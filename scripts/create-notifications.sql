-- Notifications System Setup Script
-- This script creates the notifications table, functions, and policies
-- WARNING: This will drop and recreate the notifications table if it exists
-- Run this script in your Supabase SQL editor or via psql

-- Drop existing notifications table if it exists (to handle schema conflicts)
DROP TABLE IF EXISTS notifications CASCADE;

-- Create notifications table
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('like', 'comment', 'follow', 'repost', 'mention')),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  content TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only see their own notifications
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = recipient_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = recipient_id);

-- System can insert notifications for any user
CREATE POLICY "System can insert notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- Drop existing function and trigger if they exist
DROP TRIGGER IF EXISTS update_notifications_updated_at_trigger ON notifications;
DROP FUNCTION IF EXISTS update_notifications_updated_at();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_notifications_updated_at_trigger
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_notifications_updated_at();

-- Drop existing create_notification function if it exists
DROP FUNCTION IF EXISTS create_notification(UUID, UUID, VARCHAR(50), UUID, UUID, TEXT);

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
  p_recipient_id UUID,
  p_actor_id UUID,
  p_type VARCHAR(50),
  p_post_id UUID DEFAULT NULL,
  p_comment_id UUID DEFAULT NULL,
  p_content TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  -- Don't create notification if actor is the same as recipient
  IF p_actor_id = p_recipient_id THEN
    RETURN NULL;
  END IF;

  -- For follows, check if notification already exists
  IF p_type = 'follow' THEN
    SELECT id INTO notification_id
    FROM notifications
    WHERE recipient_id = p_recipient_id
      AND actor_id = p_actor_id
      AND type = 'follow'
      AND created_at > NOW() - INTERVAL '24 hours';
    
    IF notification_id IS NOT NULL THEN
      RETURN notification_id;
    END IF;
  END IF;

  -- For likes, check if notification already exists for this post
  IF p_type = 'like' AND p_post_id IS NOT NULL THEN
    SELECT id INTO notification_id
    FROM notifications
    WHERE recipient_id = p_recipient_id
      AND actor_id = p_actor_id
      AND type = 'like'
      AND post_id = p_post_id;
    
    IF notification_id IS NOT NULL THEN
      RETURN notification_id;
    END IF;
  END IF;

  -- Insert new notification
  INSERT INTO notifications (recipient_id, actor_id, type, post_id, comment_id, content)
  VALUES (p_recipient_id, p_actor_id, p_type, p_post_id, p_comment_id, p_content)
  RETURNING id INTO notification_id;

  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION create_notification TO authenticated;
GRANT EXECUTE ON FUNCTION create_notification TO service_role;