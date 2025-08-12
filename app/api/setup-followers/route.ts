import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/setup-followers - Add followers_count and following_count columns and triggers
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
    
    // Execute SQL commands to add followers count functionality
    const setupSQL = `
      -- Add follower and following count columns to profiles table if they don't exist
      ALTER TABLE profiles
      ADD COLUMN IF NOT EXISTS followers_count INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0;
      
      -- Create functions to update follower/following counts
      CREATE OR REPLACE FUNCTION update_follow_counts()
      RETURNS TRIGGER AS $$
      BEGIN
        IF TG_OP = 'INSERT' THEN
          -- Increment follower count for the user being followed
          UPDATE profiles
          SET followers_count = followers_count + 1
          WHERE id = NEW.following_id;
      
          -- Increment following count for the user doing the following
          UPDATE profiles
          SET following_count = following_count + 1
          WHERE id = NEW.follower_id;
      
          RETURN NEW;
        ELSIF TG_OP = 'DELETE' THEN
          -- Decrement follower count for the user being unfollowed
          UPDATE profiles
          SET followers_count = followers_count - 1
          WHERE id = OLD.following_id;
      
          -- Decrement following count for the user doing the unfollowing
          UPDATE profiles
          SET following_count = following_count - 1
          WHERE id = OLD.follower_id;
      
          RETURN OLD;
        END IF;
        RETURN NULL;
      END;
      $$ LANGUAGE plpgsql;
      
      -- Create triggers to automatically update follow counts
      DROP TRIGGER IF EXISTS update_follow_counts_trigger ON follows;
      CREATE TRIGGER update_follow_counts_trigger
        AFTER INSERT OR DELETE ON follows
        FOR EACH ROW
        EXECUTE FUNCTION update_follow_counts();
      
      -- Initialize existing follow counts (run once to fix existing data)
      UPDATE profiles SET
        followers_count = (
          SELECT COUNT(*) FROM follows WHERE following_id = profiles.id
        ),
        following_count = (
          SELECT COUNT(*) FROM follows WHERE follower_id = profiles.id
        );
    `
    
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: setupSQL })
      
      if (error) {
        console.error('Error setting up followers count:', error)
        return NextResponse.json({
          success: false,
          error: 'Failed to setup followers count functionality',
          details: error.message
        }, { status: 500 })
      }
      
    } catch (setupError) {
      console.error('Error during setup:', setupError)
      return NextResponse.json({
        success: false,
        error: 'Failed to setup followers count functionality',
        details: setupError instanceof Error ? setupError.message : 'Unknown error'
      }, { status: 500 })
    }
    
    // Test if the columns were added successfully
    const { data: testData, error: testError } = await supabase
      .from('profiles')
      .select('followers_count, following_count')
      .limit(1)
    
    if (testError) {
      console.error('Error testing followers count columns:', testError)
      return NextResponse.json({
        success: false,
        error: 'Column creation may have failed',
        details: testError.message
      }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      message: 'Followers count functionality setup completed successfully'
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

// GET /api/setup-followers - Check if followers count columns exist
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
    
    // Test if followers count columns exist
    const { data, error } = await supabase
      .from('profiles')
      .select('followers_count, following_count')
      .limit(1)
    
    if (error) {
      return NextResponse.json({
        exists: false,
        error: error.message
      })
    }
    
    return NextResponse.json({
      exists: true,
      message: 'Followers count columns exist'
    })
    
  } catch (error) {
    return NextResponse.json({
      exists: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}