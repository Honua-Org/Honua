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

// Function to simulate invite acceptance (same as in callback route)
const acceptInvite = async (newUserId, inviteCode) => {
  try {
    console.log(`🔄 Attempting to accept invite: ${inviteCode} for user: ${newUserId}`)
    
    // Find the invite
    const { data: invite, error: inviteError } = await supabase
      .from('invites')
      .select('*')
      .eq('invite_code', inviteCode)
      .eq('is_active', true)
      .single()

    if (inviteError || !invite) {
      console.error('❌ Invite not found:', inviteError)
      return false
    }

    console.log('📋 Found invite:', {
      id: invite.id,
      inviter_id: invite.inviter_id,
      is_used: invite.is_used,
      invited_user_id: invite.invited_user_id
    })

    // Check if invite is already used
    if (invite.is_used) {
      console.error('❌ Invite already used')
      return false
    }

    // Check if user is trying to use their own invite
    if (invite.inviter_id === newUserId) {
      console.error('❌ User cannot use their own invite')
      return false
    }

    console.log('✅ Invite validation passed, updating invite...')

    // Mark invite as used
    const { error: updateError } = await supabase
      .from('invites')
      .update({
        is_used: true,
        invited_user_id: newUserId,
        used_at: new Date().toISOString()
      })
      .eq('id', invite.id)

    if (updateError) {
      console.error('❌ Error updating invite:', updateError)
      return false
    }

    console.log('✅ Invite marked as used successfully')

    // Give bonus points to both users
    try {
      console.log('💰 Adding points to users...')
      
      // Give points to the inviter
      const { error: inviterPointsError } = await supabase.rpc('add_user_points', {
        user_id: invite.inviter_id,
        points: 100,
        description: 'Successful referral'
      })
      
      if (inviterPointsError) {
        console.error('❌ Error adding points to inviter:', inviterPointsError)
      } else {
        console.log('✅ Added 100 points to inviter')
      }

      // Give points to the new user
      const { error: newUserPointsError } = await supabase.rpc('add_user_points', {
        user_id: newUserId,
        points: 50,
        description: 'Welcome bonus'
      })
      
      if (newUserPointsError) {
        console.error('❌ Error adding points to new user:', newUserPointsError)
      } else {
        console.log('✅ Added 50 points to new user')
      }
      
      console.log(`✅ Invite accepted successfully: ${inviteCode}`)
      return true
    } catch (pointsError) {
      // Don't fail the invite acceptance if points fail
      console.error('⚠️ Error adding points (but invite still accepted):', pointsError)
      return true
    }
  } catch (error) {
    console.error('❌ Error accepting invite:', error)
    return false
  }
}

async function testInviteAcceptance() {
  try {
    console.log('🧪 Testing invite acceptance flow...')
    
    // Get an unused invite
    const { data: invites, error: invitesError } = await supabase
      .from('invites')
      .select('*')
      .eq('is_used', false)
      .eq('is_active', true)
      .limit(1)
    
    if (invitesError || !invites || invites.length === 0) {
      console.log('❌ No unused invites found to test with')
      return
    }
    
    const testInvite = invites[0]
    console.log(`📝 Testing with invite code: ${testInvite.invite_code}`)
    
    // Get a different user to test with (not the inviter)
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id')
      .neq('id', testInvite.inviter_id)
      .limit(1)
    
    if (profilesError || !profiles || profiles.length === 0) {
      console.log('❌ No other users found to test with')
      return
    }
    
    const testUserId = profiles[0].id
    console.log(`👤 Using test user ID: ${testUserId}`)
    
    // Test the invite acceptance
    const result = await acceptInvite(testUserId, testInvite.invite_code)
    
    if (result) {
      console.log('\n🎉 Invite acceptance test PASSED!')
      
      // Verify the invite was actually updated
      const { data: updatedInvite } = await supabase
        .from('invites')
        .select('*')
        .eq('id', testInvite.id)
        .single()
      
      console.log('📊 Updated invite status:', {
        is_used: updatedInvite.is_used,
        invited_user_id: updatedInvite.invited_user_id,
        used_at: updatedInvite.used_at
      })
    } else {
      console.log('\n❌ Invite acceptance test FAILED!')
    }
    
  } catch (error) {
    console.error('❌ Test error:', error)
  }
}

testInviteAcceptance()