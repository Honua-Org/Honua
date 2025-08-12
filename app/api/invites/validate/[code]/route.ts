import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  try {
    // Use service role client for public invite validation
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
    const { code } = await params
    
    // First, try to find an invite with this code
    const { data: invite, error: inviteError } = await supabase
      .from('invites')
      .select('*')
      .eq('invite_code', code)
      .eq('is_active', true)
      .single()

    if (inviteError || !invite) {
      return NextResponse.json({ error: 'Invalid invite code' }, { status: 404 })
    }

    // Get the inviter's profile separately
    const { data: inviterProfile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, username, avatar_url')
      .eq('id', invite.inviter_id)
      .single()

    if (profileError || !inviterProfile) {
      return NextResponse.json({ error: 'Inviter profile not found' }, { status: 404 })
    }

    // Check if invite is already used
    if (invite.is_used) {
      return NextResponse.json({
        inviter_name: inviterProfile.full_name,
        inviter_username: inviterProfile.username,
        inviter_avatar: inviterProfile.avatar_url,
        is_valid: true,
        is_used: true
      })
    }

    return NextResponse.json({
      inviter_name: inviterProfile.full_name,
      inviter_username: inviterProfile.username,
      inviter_avatar: inviterProfile.avatar_url,
      is_valid: true,
      is_used: false
    })
  } catch (error) {
    console.error('Error validating invite:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}