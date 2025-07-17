import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/setup-notifications - Create notifications table if it doesn't exist
export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        success: false,
        error: 'Missing Supabase configuration'
      }, { status: 500 })
    }
    
    // Use service role key for admin operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Execute SQL commands step by step using RPC
    const setupSQL = `
      -- Create notifications table
      CREATE TABLE IF NOT EXISTS notifications (
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
      
      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON notifications(recipient_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
      CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
      
      -- Enable RLS
      ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
      
      -- Drop existing policies if they exist
      DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
      DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
      DROP POLICY IF EXISTS "System can insert notifications" ON notifications;
      
      -- Create RLS policies
      CREATE POLICY "Users can view their own notifications" ON notifications
        FOR SELECT USING (auth.uid() = recipient_id);
      
      CREATE POLICY "Users can update their own notifications" ON notifications
        FOR UPDATE USING (auth.uid() = recipient_id);
      
      CREATE POLICY "System can insert notifications" ON notifications
        FOR INSERT WITH CHECK (true);
      
      -- Create update trigger function
      CREATE OR REPLACE FUNCTION update_notifications_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
      
      -- Create trigger
      DROP TRIGGER IF EXISTS update_notifications_updated_at_trigger ON notifications;
      
      CREATE TRIGGER update_notifications_updated_at_trigger
        BEFORE UPDATE ON notifications
        FOR EACH ROW
        EXECUTE FUNCTION update_notifications_updated_at();
      
      -- Create notification function
      DROP FUNCTION IF EXISTS create_notification(UUID, UUID, VARCHAR(50), UUID, UUID, TEXT);
      
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
        -- Don't create notification if actor and recipient are the same
        IF p_recipient_id = p_actor_id THEN
          RETURN NULL;
        END IF;
        
        -- Insert the notification
        INSERT INTO notifications (
          recipient_id,
          actor_id,
          type,
          post_id,
          comment_id,
          content,
          read,
          created_at,
          updated_at
        ) VALUES (
          p_recipient_id,
          p_actor_id,
          p_type,
          p_post_id,
          p_comment_id,
          p_content,
          FALSE,
          NOW(),
          NOW()
        ) RETURNING id INTO notification_id;
        
        RETURN notification_id;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
      
      -- Grant permissions
      GRANT EXECUTE ON FUNCTION create_notification TO authenticated;
      GRANT EXECUTE ON FUNCTION create_notification TO service_role;
    `
    
    try {
       const { error } = await supabase.rpc('exec_sql', { sql: setupSQL })
       
       if (error) {
         console.error('Error setting up notifications table:', error)
         return NextResponse.json({
           success: false,
           error: 'Failed to create notifications table',
           details: error.message
         }, { status: 500 })
       }
       
     } catch (setupError) {
         console.error('Error during setup:', setupError)
         return NextResponse.json({
           success: false,
           error: 'Failed to create notifications table',
           details: setupError instanceof Error ? setupError.message : 'Unknown error'
         }, { status: 500 })
       }
    
    // Test if the table was created successfully
    const { data: testData, error: testError } = await supabase
      .from('notifications')
      .select('count')
      .limit(1)
    
    if (testError) {
      console.error('Error testing notifications table:', testError)
      return NextResponse.json({
        success: false,
        error: 'Table creation may have failed',
        details: testError.message
      }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      message: 'Notifications table setup completed successfully'
    })
    
  } catch (error) {
    console.error('Setup error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET /api/setup-notifications - Check if notifications table exists
export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        exists: false,
        error: 'Missing Supabase configuration'
      }, { status: 500 })
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Test if notifications table exists
    const { data, error } = await supabase
      .from('notifications')
      .select('count')
      .limit(1)
    
    if (error) {
      if (error.code === '42P01' || error.message.includes('relation "notifications" does not exist')) {
        return NextResponse.json({
          exists: false,
          message: 'Notifications table does not exist'
        })
      }
      
      return NextResponse.json({
        exists: false,
        error: 'Error checking table existence',
        details: error.message
      }, { status: 500 })
    }
    
    return NextResponse.json({
      exists: true,
      message: 'Notifications table exists and is accessible'
    })
    
  } catch (error) {
    console.error('Check error:', error)
    return NextResponse.json({
      exists: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}