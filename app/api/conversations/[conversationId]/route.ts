import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { conversationId } = params

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch the conversation with participant details
    const { data: conversation, error } = await supabase
      .from('conversations')
      .select(`
        id,
        participant_one_id,
        participant_two_id,
        created_at,
        updated_at,
        participant_1:profiles!participant_one_id(
          id,
          username,
          full_name,
          avatar_url,
          is_online
        ),
        participant_2:profiles!participant_two_id(
          id,
          username,
          full_name,
          avatar_url,
          is_online
        )
      `)
      .eq('id', conversationId)
      .single()

    if (error) {
      console.error('Error fetching conversation:', error)
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    // Check if user is a participant in this conversation
    if (conversation.participant_one_id !== user.id && conversation.participant_two_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Determine the other participant
    const otherParticipant = conversation.participant_one_id === user.id 
      ? conversation.participant_2 
      : conversation.participant_1

    // Format the response
    const formattedConversation = {
      id: conversation.id,
      participant_one_id: conversation.participant_one_id,
      participant_two_id: conversation.participant_two_id,
      created_at: conversation.created_at,
      updated_at: conversation.updated_at,
      otherParticipant
    }

    return NextResponse.json(formattedConversation)
  } catch (error) {
    console.error('Error in conversation API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}