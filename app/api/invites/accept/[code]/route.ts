import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: cookieStore })
    const { code } = await params
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find the invite
    const { data: invite, error: inviteError } = await supabase
      .from('invites')
      .select('*')
      .eq('invite_code', code)
      .eq('is_active', true)
      .single()

    if (inviteError || !invite) {
      return NextResponse.json({ error: 'Invalid invite code' }, { status: 404 })
    }

    // Check if invite is already used
    if (invite.is_used) {
      return NextResponse.json({ error: 'Invite has already been used' }, { status: 400 })
    }

    // Check if user is trying to use their own invite
    if (invite.inviter_id === user.id) {
      return NextResponse.json({ error: 'Cannot use your own invite code' }, { status: 400 })
    }

    // Mark invite as used
    const { error: updateError } = await supabase
      .from('invites')
      .update({
        is_used: true,
        invited_user_id: user.id,
        used_at: new Date().toISOString()
      })
      .eq('id', invite.id)

    if (updateError) {
      console.error('Error updating invite:', updateError)
      return NextResponse.json({ error: 'Failed to accept invite' }, { status: 500 })
    }

    // Optionally, give bonus points to both users
    try {
      // Give points to the inviter
      await supabase.rpc('add_user_points', {
        user_id: invite.inviter_id,
        points: 100,
        description: 'Successful referral'
      })

      // Give points to the new user
      await supabase.rpc('add_user_points', {
        user_id: user.id,
        points: 50,
        description: 'Welcome bonus'
      })
    } catch (pointsError) {
      // Don't fail the invite acceptance if points fail
      console.error('Error adding points:', pointsError)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error accepting invite:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}