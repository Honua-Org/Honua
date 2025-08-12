const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables from .env.local
const envPath = path.join(__dirname, '.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  const envLines = envContent.split('\n')
  
  envLines.forEach(line => {
    const [key, ...valueParts] = line.split('=')
    if (key && valueParts.length > 0) {
      let value = valueParts.join('=').trim()
      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1)
      }
      process.env[key.trim()] = value
    }
  })
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testDatabaseFunctions() {
  try {
    console.log('🔍 Testing database functions...')
    
    // Test if add_user_points function exists
    console.log('\n1. Testing add_user_points function...')
    
    // Get a sample user ID from profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)
    
    if (profilesError || !profiles || profiles.length === 0) {
      console.log('❌ No profiles found to test with')
      return
    }
    
    const testUserId = profiles[0].id
    console.log(`Using test user ID: ${testUserId}`)
    
    // Try to call add_user_points
    try {
      const { data: pointsResult, error: pointsError } = await supabase.rpc('add_user_points', {
        user_id: testUserId,
        points: 1,
        description: 'Test points'
      })
      
      if (pointsError) {
        console.log('❌ add_user_points function error:', pointsError.message)
      } else {
        console.log('✅ add_user_points function works')
      }
    } catch (err) {
      console.log('❌ add_user_points function failed:', err.message)
    }
    
    // Test if get_invite_leaderboard function exists
    console.log('\n2. Testing get_invite_leaderboard function...')
    try {
      const { data: leaderboardResult, error: leaderboardError } = await supabase.rpc('get_invite_leaderboard')
      
      if (leaderboardError) {
        console.log('❌ get_invite_leaderboard function error:', leaderboardError.message)
      } else {
        console.log('✅ get_invite_leaderboard function works')
        console.log('Leaderboard result:', leaderboardResult)
      }
    } catch (err) {
      console.log('❌ get_invite_leaderboard function failed:', err.message)
    }
    
    // Test invite update permissions
    console.log('\n3. Testing invite update permissions...')
    
    // Get an existing invite
    const { data: invites, error: invitesError } = await supabase
      .from('invites')
      .select('*')
      .eq('is_used', false)
      .limit(1)
    
    if (invitesError || !invites || invites.length === 0) {
      console.log('❌ No unused invites found to test with')
      return
    }
    
    const testInvite = invites[0]
    console.log(`Testing with invite: ${testInvite.invite_code}`)
    
    // Try to update the invite (but don't actually mark it as used)
    try {
      const { error: updateError } = await supabase
        .from('invites')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', testInvite.id)
      
      if (updateError) {
        console.log('❌ Invite update permission error:', updateError.message)
      } else {
        console.log('✅ Invite update permissions work')
      }
    } catch (err) {
      console.log('❌ Invite update failed:', err.message)
    }
    
  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

testDatabaseFunctions()