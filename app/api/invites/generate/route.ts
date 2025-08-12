import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { nanoid } from 'nanoid'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body to check if bulk generation is requested
    const body = await request.json().catch(() => ({}))
    const generateBulk = body.bulk === true
    const count = generateBulk ? 5 : 1

    if (!generateBulk) {
      // Original single invite generation logic
      const inviteCode = nanoid(10)
      
      // Check if user already has an active invite code
      const { data: existingInvite } = await supabase
        .from('invites')
        .select('invite_code')
        .eq('inviter_id', user.id)
        .eq('is_active', true)
        .single()
      
      if (existingInvite) {
        // Return existing invite code
        return NextResponse.json({ inviteCode: existingInvite.invite_code })
      }

      // Create new invite record
      const { data: invite, error: insertError } = await supabase
        .from('invites')
        .insert({
          invite_code: inviteCode,
          inviter_id: user.id,
          is_active: true,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (insertError) {
        console.error('Error creating invite:', insertError)
        return NextResponse.json({ error: 'Failed to create invite' }, { status: 500 })
      }

      return NextResponse.json({ inviteCode })
    }

    // Bulk generation logic - generate 5 invite codes
    const inviteCodes = []
    const inviteRecords = []
    
    // Generate 5 unique invite codes
    for (let i = 0; i < count; i++) {
      let inviteCode
      let isUnique = false
      
      // Ensure each code is unique
      while (!isUnique) {
        inviteCode = nanoid(10)
        
        // Check if this code already exists
        const { data: existingCode } = await supabase
          .from('invites')
          .select('invite_code')
          .eq('invite_code', inviteCode)
          .single()
        
        if (!existingCode) {
          isUnique = true
          inviteCodes.push(inviteCode)
          inviteRecords.push({
            invite_code: inviteCode,
            inviter_id: user.id,
            is_active: true,
            created_at: new Date().toISOString()
          })
        }
      }
    }

    // Insert all invite records at once
    const { data: invites, error: insertError } = await supabase
      .from('invites')
      .insert(inviteRecords)
      .select()

    if (insertError) {
      console.error('Error creating bulk invites:', insertError)
      return NextResponse.json({ error: 'Failed to create invite codes' }, { status: 500 })
    }

    return NextResponse.json({ 
      inviteCodes,
      count: inviteCodes.length,
      message: `Successfully generated ${inviteCodes.length} invite codes`
    })
  } catch (error) {
    console.error('Error in invite generation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}