import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// GET /api/forums/[id]/threads - Get all threads for a specific forum
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createRouteHandlerClient({ cookies })
  const { id } = params

  try {
    // Check if forum exists
    const { data: forum, error: forumError } = await supabase
      .from('forums')
      .select('id')
      .eq('id', id)
      .single()

    if (forumError) {
      console.error('Error fetching forum:', forumError)
      return NextResponse.json({ error: 'Failed to fetch forum' }, { status: 500 })
    }

    if (!forum) {
      return NextResponse.json({ error: 'Forum not found' }, { status: 404 })
    }

    // Get threads for this forum
    const { data: threads, error: threadsError } = await supabase
      .from('threads')
      .select(`
        *,
        profiles:user_id(id, username, full_name, avatar_url)
      `)
      .eq('forum_id', id)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })

    if (threadsError) {
      console.error('Error fetching threads:', threadsError)
      return NextResponse.json({ error: 'Failed to fetch threads' }, { status: 500 })
    }

    // Format the response
    const formattedThreads = threads.map((thread) => ({
      id: thread.id,
      title: thread.title,
      content: thread.content,
      forum_id: thread.forum_id,
      created_at: thread.created_at,
      updated_at: thread.updated_at,
      author: {
        id: thread.profiles?.id,
        username: thread.profiles?.username,
        full_name: thread.profiles?.full_name,
        avatar_url: thread.profiles?.avatar_url,
      },
      replies_count: 0, // Would need a separate query to get actual replies count
      views_count: 0, // Would need a separate table to track views
      is_pinned: thread.is_pinned || false,
      is_locked: thread.is_locked || false,
    }))

    return NextResponse.json(formattedThreads)
  } catch (error) {
    console.error('Error in threads GET route:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/forums/[id]/threads - Create a new thread in a forum
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createRouteHandlerClient({ cookies })
  const { id } = params

  try {
    // Check if user is authenticated
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Check if forum exists
    const { data: forum, error: forumError } = await supabase
      .from('forums')
      .select('id, is_private, admin_id')
      .eq('id', id)
      .single()

    if (forumError) {
      console.error('Error fetching forum:', forumError)
      return NextResponse.json({ error: 'Failed to fetch forum' }, { status: 500 })
    }

    if (!forum) {
      return NextResponse.json({ error: 'Forum not found' }, { status: 404 })
    }

    // If forum is private, check if user is the admin
    if (forum.is_private && forum.admin_id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Get request body
    const { title, content, is_pinned, is_locked } = await request.json()

    // Validate required fields
    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      )
    }

    // Only forum admin can create pinned or locked threads
    const isPinned = forum.admin_id === userId ? is_pinned || false : false
    const isLocked = forum.admin_id === userId ? is_locked || false : false

    // Insert new thread
    const { data: thread, error } = await supabase
      .from('threads')
      .insert({
        title,
        content,
        forum_id: id,
        user_id: userId,
        is_pinned: isPinned,
        is_locked: isLocked,
      })
      .select(`
        *,
        profiles:user_id(id, username, full_name, avatar_url)
      `)

    if (error) {
      console.error('Error creating thread:', error)
      return NextResponse.json({ error: 'Failed to create thread' }, { status: 500 })
    }

    // Update forum's updated_at timestamp
    await supabase
      .from('forums')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', id)

    // Format the response to match the GET endpoint structure
    const formattedThread = {
      id: thread[0].id,
      title: thread[0].title,
      content: thread[0].content,
      forum_id: thread[0].forum_id,
      created_at: thread[0].created_at,
      updated_at: thread[0].updated_at,
      author: {
        id: thread[0].profiles?.id,
        username: thread[0].profiles?.username,
        full_name: thread[0].profiles?.full_name,
        avatar_url: thread[0].profiles?.avatar_url,
      },
      replies_count: 0,
      views_count: 0,
      is_pinned: thread[0].is_pinned || false,
      is_locked: thread[0].is_locked || false,
    }

    return NextResponse.json(formattedThread, { status: 201 })
  } catch (error) {
    console.error('Error in threads POST route:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}