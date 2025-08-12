import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

// Function to accept invite
const acceptInvite = async (newUserId: string, inviteCode: string, supabase: any) => {
  try {
    // Find the invite
    const { data: invite, error: inviteError } = await supabase
      .from('invites')
      .select('*')
      .eq('invite_code', inviteCode)
      .eq('is_active', true)
      .single()

    if (inviteError || !invite) {
      console.error('Invite not found:', inviteError)
      return false
    }

    // Check if invite is already used
    if (invite.is_used) {
      console.error('Invite already used')
      return false
    }

    // Check if user is trying to use their own invite
    if (invite.inviter_id === newUserId) {
      console.error('User cannot use their own invite')
      return false
    }

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
      console.error('Error updating invite:', updateError)
      return false
    }

    // Give bonus points to both users
    try {
      // Give points to the inviter
      await supabase.rpc('add_user_points', {
        user_id: invite.inviter_id,
        points: 100,
        description: 'Successful referral'
      })

      // Give points to the new user
      await supabase.rpc('add_user_points', {
        user_id: newUserId,
        points: 50,
        description: 'Welcome bonus'
      })
      
      console.log(`Invite accepted successfully: ${inviteCode}`)
      return true
    } catch (pointsError) {
      // Don't fail the invite acceptance if points fail
      console.error('Error adding points:', pointsError)
      return true
    }
  } catch (error) {
    console.error('Error accepting invite:', error)
    return false
  }
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const refFromUrl = searchParams.get("ref") // Get referral code from URL
  const stateFromUrl = searchParams.get("state") // Get referral code from OAuth state parameter
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get("next") ?? "/"

  if (code) {
    const supabase = createRouteHandlerClient({ cookies })
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data.user) {
      // Check if this is a new user (first time login)
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', data.user.id)
        .single()
      
      if (!existingProfile) {
        // This is a new user, create their profile
        const fullName = data.user.user_metadata?.full_name || data.user.user_metadata?.name || ''
        const email = data.user.email || ''
        
        // Generate a unique username
        let username = ''
        if (fullName) {
          // Create username from full name
          username = fullName.toLowerCase().replace(/[^a-z0-9]/g, '')
        } else if (email) {
          // Fallback to email prefix
          username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '')
        } else {
          // Last resort: use user ID prefix
          username = `user${data.user.id.slice(0, 8)}`
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
        
        // Create the profile
        const { error: profileError } = await supabase.from('profiles').insert({
          id: data.user.id,
          username: finalUsername,
          full_name: fullName,
          avatar_url: data.user.user_metadata?.avatar_url || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        
        if (profileError) {
          console.error('Error creating profile:', profileError)
        }
        
        // Check for invite code from URL parameters or user metadata
        const inviteCode = refFromUrl || stateFromUrl || data.user.user_metadata?.referral_code
        console.log('Checking for invite code:', { refFromUrl, stateFromUrl, userMetadata: data.user.user_metadata?.referral_code, finalInviteCode: inviteCode })
        if (inviteCode) {
          console.log(`Attempting to accept invite with code: ${inviteCode} for user: ${data.user.id}`)
          const inviteResult = await acceptInvite(data.user.id, inviteCode, supabase)
          console.log('Invite acceptance result:', inviteResult)
        }
      }
      
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
