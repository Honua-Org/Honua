const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkDatabase() {
  console.log('Checking database status...')

  try {
    // Check if profiles table exists and has data
    console.log('\n1. Checking profiles table...')
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, username, full_name, followers_count, following_count')
      .limit(5)
    
    if (profilesError) {
      console.error('Error fetching profiles:', profilesError)
    } else {
      console.log(`Found ${profiles?.length || 0} profiles:`)
      profiles?.forEach(profile => {
        console.log(`  - ${profile.username} (${profile.full_name}) - Followers: ${profile.followers_count || 'NULL'}, Following: ${profile.following_count || 'NULL'}`)
      })
    }

    // Check if follows table exists and has data
    console.log('\n2. Checking follows table...')
    const { data: follows, error: followsError } = await supabase
      .from('follows')
      .select('follower_id, following_id')
      .limit(5)
    
    if (followsError) {
      console.error('Error fetching follows:', followsError)
    } else {
      console.log(`Found ${follows?.length || 0} follow relationships`)
    }

    // Check if the columns exist by trying to describe the table
    console.log('\n3. Checking table structure...')
    const { data: tableInfo, error: tableError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1)
    
    if (tableInfo && tableInfo.length > 0) {
      console.log('Profiles table columns:', Object.keys(tableInfo[0]))
    }

  } catch (error) {
    console.error('Error checking database:', error)
  }
}

checkDatabase()
  .then(() => {
    console.log('\nDatabase check complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Database check failed:', error)
    process.exit(1)
  })