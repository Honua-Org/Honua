-- Fix notifications table permissions
-- This migration ensures proper RLS policies and permissions for the notifications table

-- First, ensure RLS is enabled on notifications table
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can insert notifications for others" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON notifications;

-- Create comprehensive RLS policies for notifications

-- Policy 1: Users can view notifications where they are the recipient
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT
  USING (auth.uid() = recipient_id);

-- Policy 2: Authenticated users can create notifications for others (but not themselves)
CREATE POLICY "Users can create notifications for others" ON notifications
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL 
    AND auth.uid() = actor_id 
    AND auth.uid() != recipient_id
  );

-- Policy 3: Users can update (mark as read) their own notifications
CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE
  USING (auth.uid() = recipient_id)
  WITH CHECK (auth.uid() = recipient_id);

-- Policy 4: Users can delete their own notifications
CREATE POLICY "Users can delete their own notifications" ON notifications
  FOR DELETE
  USING (auth.uid() = recipient_id);

-- Grant necessary permissions to authenticated and anon roles
GRANT SELECT ON notifications TO authenticated;
GRANT INSERT ON notifications TO authenticated;
GRANT UPDATE ON notifications TO authenticated;
GRANT DELETE ON notifications TO authenticated;

-- Grant limited permissions to anon role (for public access if needed)
GRANT SELECT ON notifications TO anon;

-- Ensure the profiles table has proper permissions for the foreign key relationships
GRANT SELECT ON profiles TO authenticated;
GRANT SELECT ON profiles TO anon;

-- Ensure posts and comments tables have proper permissions for foreign key relationships
GRANT SELECT ON posts TO authenticated;
GRANT SELECT ON posts TO anon;
GRANT SELECT ON comments TO authenticated;
GRANT SELECT ON comments TO anon;

-- Create an index for better performance on recipient_id queries
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_read ON notifications(recipient_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Add a comment to document the table
COMMENT ON TABLE notifications IS 'Stores user notifications with RLS policies for secure access';