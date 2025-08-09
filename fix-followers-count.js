const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// You'll need to replace these with your actual Supabase URL and service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixFollowersCount() {
  try {
    console.log('Adding followers_count and following_count columns to profiles table...');
    
    // Add columns to profiles table
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE profiles
        ADD COLUMN IF NOT EXISTS followers_count INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0;
      `
    });
    
    if (alterError && !alterError.message.includes('already exists')) {
      console.error('Error adding columns:', alterError);
      return;
    } else {
      console.log('✓ Columns added successfully');
    }
    
    console.log('Creating update_follow_counts function...');
    
    // Create the function to update follow counts
    const { error: functionError } = await supabase.rpc('exec_sql', {
      sql: `
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
      `
    });
    
    if (functionError) {
      console.error('Error creating function:', functionError);
      return;
    } else {
      console.log('✓ Function created successfully');
    }
    
    console.log('Creating trigger...');
    
    // Create the trigger
    const { error: triggerError } = await supabase.rpc('exec_sql', {
      sql: `
        DROP TRIGGER IF EXISTS update_follow_counts_trigger ON follows;
        CREATE TRIGGER update_follow_counts_trigger
          AFTER INSERT OR DELETE ON follows
          FOR EACH ROW
          EXECUTE FUNCTION update_follow_counts();
      `
    });
    
    if (triggerError) {
      console.error('Error creating trigger:', triggerError);
      return;
    } else {
      console.log('✓ Trigger created successfully');
    }
    
    console.log('Initializing existing follow counts...');
    
    // Initialize existing follow counts
    const { error: initError } = await supabase.rpc('exec_sql', {
      sql: `
        UPDATE profiles SET
          followers_count = (
            SELECT COUNT(*) FROM follows WHERE following_id = profiles.id
          ),
          following_count = (
            SELECT COUNT(*) FROM follows WHERE follower_id = profiles.id
          );
      `
    });
    
    if (initError) {
      console.error('Error initializing counts:', initError);
      return;
    } else {
      console.log('✓ Existing follow counts initialized successfully');
    }
    
    console.log('\n🎉 Followers count functionality has been successfully set up!');
    console.log('The followers_count and following_count columns should now work properly.');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Alternative approach if exec_sql doesn't work
async function fixFollowersCountAlternative() {
  try {
    console.log('Using alternative approach without exec_sql...');
    
    // First, let's check if the columns exist by trying to select them
    const { data: testData, error: testError } = await supabase
      .from('profiles')
      .select('followers_count, following_count')
      .limit(1);
    
    if (testError && testError.message.includes('column')) {
      console.log('Columns do not exist. You need to add them manually in Supabase dashboard.');
      console.log('\nPlease go to your Supabase dashboard:');
      console.log('1. Go to Table Editor > profiles table');
      console.log('2. Add column: followers_count (type: int4, default: 0)');
      console.log('3. Add column: following_count (type: int4, default: 0)');
      console.log('4. Then run this script again.');
      return;
    }
    
    console.log('✓ Columns already exist');
    
    // Initialize the counts by counting existing follows
    console.log('Calculating and updating follow counts...');
    
    // Get all profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id');
    
    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      return;
    }
    
    // Update each profile's counts
    for (const profile of profiles) {
      // Count followers
      const { count: followersCount, error: followersError } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', profile.id);
      
      // Count following
      const { count: followingCount, error: followingError } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', profile.id);
      
      if (!followersError && !followingError) {
        // Update the profile with the correct counts
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            followers_count: followersCount || 0,
            following_count: followingCount || 0
          })
          .eq('id', profile.id);
        
        if (updateError) {
          console.error(`Error updating profile ${profile.id}:`, updateError);
        } else {
          console.log(`✓ Updated profile ${profile.id}: ${followersCount} followers, ${followingCount} following`);
        }
      }
    }
    
    console.log('\n🎉 Follow counts have been updated!');
    console.log('Note: You still need to set up triggers in Supabase dashboard for automatic updates.');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Skip exec_sql approach and go directly to alternative
console.log('Using alternative approach (exec_sql function not available)...');
fixFollowersCountAlternative();