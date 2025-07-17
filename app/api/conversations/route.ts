import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

// GET /api/conversations - Fetch user's conversations
export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch conversations with participant profiles and latest message
    const { data: conversations, error } = await supabase
      .from('conversations')
      .select(`
        *,
        participant_one:profiles!conversations_participant_one_id_fkey (
          id,
          username,
          full_name,
          avatar_url
        ),
        participant_two:profiles!conversations_participant_two_id_fkey (
          id,
          username,
          full_name,
          avatar_url
        ),
        messages (
          id,
          content,
          created_at,
          sender_id
        )
      `)
      .or(`participant_one_id.eq.${user.id},participant_two_id.eq.${user.id}`)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Error fetching conversations:', error)
      return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 })
    }

    // Transform conversations to include other participant and latest message
    const transformedConversations = conversations
      .filter(conversation => {
        // Filter out conversations where participant data is missing
        return conversation.participant_one && conversation.participant_two
      })
      .map(conversation => {
        const otherParticipant = conversation.participant_one.id === user.id 
          ? conversation.participant_two 
          : conversation.participant_one
        
        // Get latest message
        const latestMessage = conversation.messages && conversation.messages.length > 0
          ? conversation.messages
              .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
          : null

        return {
          id: conversation.id,
          otherParticipant,
          latestMessage,
          updated_at: conversation.updated_at,
          created_at: conversation.created_at
        }
      })

    return NextResponse.json(transformedConversations)
  } catch (error) {
    console.error('Error in GET /api/conversations:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/conversations - Create or get conversation with a user
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { participant_id } = body

    if (!participant_id) {
      return NextResponse.json({ error: 'Participant ID is required' }, { status: 400 })
    }

    if (participant_id === user.id) {
      return NextResponse.json({ error: 'Cannot create conversation with yourself' }, { status: 400 })
    }

    // Check if conversation already exists (in either direction)
    const { data: existingConversation, error: searchError } = await supabase
      .from('conversations')
      .select('*')
      .or(`and(participant_one_id.eq.${user.id},participant_two_id.eq.${participant_id}),and(participant_one_id.eq.${participant_id},participant_two_id.eq.${user.id})`)
      .single()

    if (searchError && searchError.code !== 'PGRST116') {
      console.error('Error searching for existing conversation:', searchError)
      return NextResponse.json({ error: 'Failed to search conversations' }, { status: 500 })
    }

    if (existingConversation) {
      return NextResponse.json({ conversation: existingConversation })
    }

    // Create new conversation
    const { data: newConversation, error: createError } = await supabase
      .from('conversations')
      .insert({
        participant_one_id: user.id,
        participant_two_id: participant_id
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating conversation:', createError)
      return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 })
    }

    return NextResponse.json({ conversation: newConversation })
  } catch (error) {
    console.error('Error in POST /api/conversations:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}