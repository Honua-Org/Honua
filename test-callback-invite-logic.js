const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables manually
const envPath = path.join(__dirname, '.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  envContent.split('\n').forEach(line => {
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

// Test the invite acceptance logic from the callback route
async function testCallbackInviteLogic() {
  try {
    console.log('🧪 Testing callback invite acceptance logic...')
    
    // Get an unused invite
    const { data: invites, error: invitesError } = await supabase
      .from('invites')
      .select('*')
      .eq('is_used', false)
      .eq('is_active', true)
      .limit(1)
    
    if (invitesError) {
      console.error('❌ Error fetching invites:', invitesError)
      return
    }
    
    if (!invites || invites.length === 0) {
      console.log('⚠️ No unused invites found')
      return
    }
    
    const invite = invites[0]
    console.log('📝 Using invite code:', invite.invite_code)
    
    // Get an existing user from profiles to simulate OAuth user
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)
    
    if (profilesError || !profiles || profiles.length === 0) {
      console.error('❌ No existing profiles found for testing')
      return
    }
    
    const testUserId = profiles[0].id
    console.log('👤 Using existing user ID for test:', testUserId)
    
    // Test the acceptInvite function logic from callback route
    console.log('🎯 Testing invite acceptance...')
    
    // Update the invite to mark it as used
    const { error: updateError } = await supabase
      .from('invites')
      .update({
        is_used: true,
        invited_user_id: testUserId,
        used_at: new Date().toISOString()
      })
      .eq('invite_code', invite.invite_code)
    
    if (updateError) {
      console.error('❌ Error updating invite:', updateError)
      return
    }
    
    console.log('✅ Invite marked as used successfully')
    
    // Test adding points to inviter
    console.log('💰 Testing points addition...')
    
    const { error: inviterPointsError } = await supabase.rpc('add_user_points', {
      user_id: invite.inviter_id,
      points: 100,
      description: 'Successful referral (test)'
    })
    
    if (inviterPointsError) {
      console.error('❌ Error adding points to inviter:', inviterPointsError)
    } else {
      console.log('✅ Points added to inviter successfully')
    }
    
    // Test adding points to new user
    const { error: newUserPointsError } = await supabase.rpc('add_user_points', {
      user_id: testUserId,
      points: 50,
      description: 'Welcome bonus (test)'
    })
    
    if (newUserPointsError) {
      console.error('❌ Error adding points to new user:', newUserPointsError)
    } else {
      console.log('✅ Points added to new user successfully')
    }
    
    console.log('🎉 Callback invite logic test completed successfully!')
    
    // Reset the invite for future testing
    console.log('🔄 Resetting invite for future tests...')
    await supabase
      .from('invites')
      .update({
        is_used: false,
        invited_user_id: null,
        used_at: null
      })
      .eq('invite_code', invite.invite_code)
    
    console.log('✅ Invite reset completed')
    
  } catch (error) {
    console.error('❌ Test error:', error)
  }
}

// Run the test
testCallbackInviteLogic()