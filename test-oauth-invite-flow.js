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

// Simulate the OAuth callback flow
async function simulateOAuthCallback() {
  try {
    console.log('🧪 Simulating OAuth callback flow with invite...')
    
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
    console.log(`📝 Using invite code: ${testInvite.invite_code}`)
    
    // Simulate creating a new user (like OAuth would do)
    const crypto = require('crypto')
    const mockUser = {
      id: crypto.randomUUID(),
      email: `test${Date.now()}@example.com`,
      user_metadata: {
        full_name: 'Test User',
        name: 'Test User',
        avatar_url: null
      }
    }
    
    console.log(`👤 Simulating new user: ${mockUser.id}`)
    
    // Check if this would be a new user (no existing profile)
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', mockUser.id)
      .single()
    
    if (!existingProfile) {
      console.log('✅ This would be a new user, proceeding with profile creation...')
      
      // Generate username like the callback does
      const fullName = mockUser.user_metadata?.full_name || mockUser.user_metadata?.name || ''
      const email = mockUser.email || ''
      
      let username = ''
      if (fullName) {
        username = fullName.toLowerCase().replace(/[^a-z0-9]/g, '')
      } else if (email) {
        username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '')
      } else {
        username = `user${mockUser.id.slice(0, 8)}`
      }
      
      // Ensure username is unique
      let finalUsername = username
      let counter = 1
      while (true) {
        const { data: existingUser } = await supabase
          .from('profiles')
          .select('username')
          .eq('username', finalUsername)
          .single()
        
        if (!existingUser) break
        finalUsername = `${username}${counter}`
        counter++
      }
      
      console.log(`📝 Generated username: ${finalUsername}`)
      
      // Create the profile (simulate what callback does)
      const { error: profileError } = await supabase.from('profiles').insert({
        id: mockUser.id,
        username: finalUsername,
        full_name: fullName,
        avatar_url: mockUser.user_metadata?.avatar_url || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      
      if (profileError) {
        console.error('❌ Error creating profile:', profileError)
        return
      }
      
      console.log('✅ Profile created successfully')
      
      // Now test invite acceptance (simulate what callback does)
      const inviteCode = testInvite.invite_code // This would come from URL ref parameter
      console.log(`🔄 Attempting to accept invite: ${inviteCode}`)
      
      // Find the invite
      const { data: invite, error: inviteError } = await supabase
        .from('invites')
        .select('*')
        .eq('invite_code', inviteCode)
        .eq('is_active', true)
        .single()

      if (inviteError || !invite) {
        console.error('❌ Invite not found:', inviteError)
        return
      }

      console.log('📋 Found invite:', {
        id: invite.id,
        inviter_id: invite.inviter_id,
        is_used: invite.is_used
      })

      // Check if invite is already used
      if (invite.is_used) {
        console.error('❌ Invite already used')
        return
      }

      // Check if user is trying to use their own invite
      if (invite.inviter_id === mockUser.id) {
        console.error('❌ User cannot use their own invite')
        return
      }

      console.log('✅ Invite validation passed, updating invite...')

      // Mark invite as used
      const { error: updateError } = await supabase
        .from('invites')
        .update({
          is_used: true,
          invited_user_id: mockUser.id,
          used_at: new Date().toISOString()
        })
        .eq('id', invite.id)

      if (updateError) {
        console.error('❌ Error updating invite:', updateError)
        return
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
          user_id: mockUser.id,
          points: 50,
          description: 'Welcome bonus'
        })
        
        if (newUserPointsError) {
          console.error('❌ Error adding points to new user:', newUserPointsError)
        } else {
          console.log('✅ Added 50 points to new user')
        }
        
        console.log('\n🎉 OAuth invite flow simulation COMPLETED SUCCESSFULLY!')
        
        // Verify the final state
        const { data: finalInvite } = await supabase
          .from('invites')
          .select('*')
          .eq('id', invite.id)
          .single()
        
        console.log('📊 Final invite status:', {
          is_used: finalInvite.is_used,
          invited_user_id: finalInvite.invited_user_id,
          used_at: finalInvite.used_at
        })
        
        // Clean up - delete the test user profile
        console.log('🧹 Cleaning up test data...')
        await supabase.from('profiles').delete().eq('id', mockUser.id)
        console.log('✅ Test cleanup completed')
        
      } catch (pointsError) {
        console.error('❌ Error adding points:', pointsError)
      }
    } else {
      console.log('⚠️ User already exists, skipping profile creation')
    }
    
  } catch (error) {
    console.error('❌ Simulation error:', error)
  }
}

simulateOAuthCallback()