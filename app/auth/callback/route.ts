import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

// Function to track referrals
const trackReferral = async (newUserId: string, referralCode: string, supabase: any) => {
  try {
    // Find the inviter by username or user ID
    let inviterId = null
    
    // Try to find by username first
    const { data: inviterByUsername } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', referralCode)
      .single()
    
    if (inviterByUsername) {
      inviterId = inviterByUsername.id
    } else {
      // Try to find by user ID (first 8 characters)
      const { data: inviterById } = await supabase
        .from('profiles')
        .select('id')
        .ilike('id', `${referralCode}%`)
        .limit(1)
      
      if (inviterById && inviterById.length > 0) {
        inviterId = inviterById[0].id
      }
    }
    
    if (inviterId) {
      // Create referral record
      const { error: referralError } = await supabase.from('referrals').insert({
        inviter_id: inviterId,
        invited_user_id: newUserId,
        referral_code: referralCode,
        status: 'completed',
        points_awarded: 10,
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      })
      
      if (referralError) {
        console.error('Error creating referral record:', referralError)
        return
      }
      
      // Award points to inviter using the reputation system
      try {
        const { error: pointsError } = await supabase.rpc('add_reputation_points', {
          user_id: inviterId,
          points: 10,
          action_type: 'peer_recognition',
          reference_id: newUserId,
          reference_type: 'referral',
          description: `Invited new user: ${referralCode}`
        })
        
        if (pointsError) {
          console.error('Error awarding referral points:', pointsError)
        } else {
          console.log(`Awarded 10 referral points to user ${inviterId} for inviting ${newUserId}`)
        }
      } catch (pointsError) {
        console.error('Error calling add_reputation_points:', pointsError)
      }
    }
  } catch (error) {
    console.error('Error tracking referral:', error)
  }
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")

  if (code) {
    const supabase = createRouteHandlerClient({ cookies })
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    // If authentication successful and user exists, ensure profile exists
    if (!error && data.user) {
      try {
        // Check if profile already exists
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', data.user.id)
          .single()
        
        // If no profile exists, create one
        if (!existingProfile) {
          const userData = data.user.user_metadata || {}
          const email = data.user.email || ''
          
          // Generate username from email if not provided
          let username = userData.username || userData.full_name?.toLowerCase().replace(/\s+/g, '') || email.split('@')[0]
          
          // Ensure username is unique
          let uniqueUsername = username
          let counter = 1
          while (true) {
            const { data: existingUser } = await supabase
              .from('profiles')
              .select('username')
              .eq('username', uniqueUsername)
              .single()
            
            if (!existingUser) break
            uniqueUsername = `${username}${counter}`
            counter++
          }
          
          // Create profile
          await supabase.from('profiles').insert({
            id: data.user.id,
            full_name: userData.full_name || userData.name || email.split('@')[0],
            username: uniqueUsername,
            avatar_url: userData.avatar_url || userData.picture || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          
          // Process referral if present in user metadata
          const referralCode = userData.referral_code
          if (referralCode) {
            await trackReferral(data.user.id, referralCode, supabase)
          }
          
          // Update user metadata with username
          await supabase.auth.updateUser({
            data: {
              ...userData,
              username: uniqueUsername,
              full_name: userData.full_name || userData.name || email.split('@')[0]
            }
          })
        }
      } catch (profileError) {
        console.error('Error creating profile:', profileError)
      }
    }
  }

  return NextResponse.redirect(requestUrl.origin)
}
