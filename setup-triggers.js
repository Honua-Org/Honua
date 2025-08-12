const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function setupTriggers() {
  console.log('Setting up database triggers for followers count...')

  try {
    // First, create the function
    console.log('Creating update_follow_counts function...')
    const functionSQL = `
      CREATE OR REPLACE FUNCTION update_follow_counts()
      RETURNS TRIGGER AS $$
      BEGIN
        IF TG_OP = 'INSERT' THEN
          UPDATE profiles SET followers_count = followers_count + 1 WHERE id = NEW.following_id;
          UPDATE profiles SET following_count = following_count + 1 WHERE id = NEW.follower_id;
          RETURN NEW;
        ELSIF TG_OP = 'DELETE' THEN
          UPDATE profiles SET followers_count = followers_count - 1 WHERE id = OLD.following_id;
          UPDATE profiles SET following_count = following_count - 1 WHERE id = OLD.follower_id;
          RETURN OLD;
        END IF;
        RETURN NULL;
      END;
      $$ LANGUAGE plpgsql;
    `
    
    const { error: funcError } = await supabase.rpc('exec_sql', { sql: functionSQL })
    if (funcError) {
      console.log('exec_sql not available, using alternative method...')
      console.log('⚠️  You will need to manually create the database triggers in your Supabase dashboard.')
      console.log('\nPlease run the following SQL in your Supabase SQL Editor:')
      console.log('\n--- SQL to run in Supabase Dashboard ---')
      console.log(functionSQL)
      console.log(`
      -- Drop trigger if it exists
      DROP TRIGGER IF EXISTS follows_count_trigger ON follows;

      -- Create trigger
      CREATE TRIGGER follows_count_trigger
        AFTER INSERT OR DELETE ON follows
        FOR EACH ROW
        EXECUTE FUNCTION update_follow_counts();
      `)
      console.log('--- End of SQL ---\n')
      
      console.log('After running the SQL above, the followers count will be automatically updated!')
      return
    }
    
    // Create the trigger
    console.log('Creating trigger...')
    const triggerSQL = `
      DROP TRIGGER IF EXISTS follows_count_trigger ON follows;
      CREATE TRIGGER follows_count_trigger
        AFTER INSERT OR DELETE ON follows
        FOR EACH ROW
        EXECUTE FUNCTION update_follow_counts();
    `
    
    const { error: triggerError } = await supabase.rpc('exec_sql', { sql: triggerSQL })
    if (triggerError) {
      console.error('Error creating trigger:', triggerError)
      return
    }
    
    console.log('✅ Database triggers set up successfully!')
    console.log('The followers_count and following_count will now be automatically updated when users follow/unfollow each other.')
    
  } catch (error) {
    console.error('Error setting up triggers:', error)
    console.log('\n⚠️  Please manually create the triggers in your Supabase dashboard using the SQL provided above.')
  }
}

setupTriggers()
  .then(() => {
    console.log('\nSetup process complete!')
    console.log('\nNext steps:')
    console.log('1. If SQL was provided above, run it in your Supabase SQL Editor')
    console.log('2. Test the follow/unfollow functionality')
    console.log('3. Check that the followers count updates correctly')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Setup failed:', error)
    process.exit(1)
  })