import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// GET /api/threads/[id] - Get a specific thread by ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createRouteHandlerClient({ cookies })
  const { id } = params

  try {
    // Get thread details
    const { data: thread, error: threadError } = await supabase
      .from('threads')
      .select(`
        *,
        profiles:user_id(id, username, full_name, avatar_url),
        forums:forum_id(id, name, category)
      `)
      .eq('id', id)
      .single()

    if (threadError) {
      console.error('Error fetching thread:', threadError)
      return NextResponse.json({ error: 'Failed to fetch thread' }, { status: 500 })
    }

    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 })
    }

    // Format the response
    const formattedThread = {
      id: thread.id,
      title: thread.title,
      content: thread.content,
      forum_id: thread.forum_id,
      forum_name: thread.forums?.name,
      forum_category: thread.forums?.category,
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
    }

    return NextResponse.json(formattedThread)
  } catch (error) {
    console.error('Error in thread GET route:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/threads/[id] - Update a thread
export async function PUT(
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

    // Check if thread exists and user is the author
    const { data: thread, error: threadError } = await supabase
      .from('threads')
      .select('user_id, forum_id, is_locked, is_pinned')
      .eq('id', id)
      .single()

    if (threadError) {
      console.error('Error fetching thread:', threadError)
      return NextResponse.json({ error: 'Failed to fetch thread' }, { status: 500 })
    }

    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 })
    }

    // Check if thread is locked
    if (thread.is_locked) {
      // Check if user is forum admin
      const { data: forum, error: forumError } = await supabase
        .from('forums')
        .select('admin_id')
        .eq('id', thread.forum_id)
        .single()

      if (forumError) {
        console.error('Error fetching forum:', forumError)
        return NextResponse.json({ error: 'Failed to fetch forum' }, { status: 500 })
      }

      // Only forum admin can edit locked threads
      if (forum.admin_id !== userId) {
        return NextResponse.json(
          { error: 'Cannot edit a locked thread' },
          { status: 403 }
        )
      }
    } else {
      // For unlocked threads, only the author can edit
      if (thread.user_id !== userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }
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

    // Check if user is forum admin (for pinning/locking)
    const { data: forum, error: forumError } = await supabase
      .from('forums')
      .select('admin_id')
      .eq('id', thread.forum_id)
      .single()

    if (forumError) {
      console.error('Error fetching forum:', forumError)
      return NextResponse.json({ error: 'Failed to fetch forum' }, { status: 500 })
    }

    // Only forum admin can pin or lock threads
    const updateData: any = {
      title,
      content,
      updated_at: new Date().toISOString(),
    }

    if (forum.admin_id === userId) {
      updateData.is_pinned = is_pinned !== undefined ? is_pinned : thread.is_pinned
      updateData.is_locked = is_locked !== undefined ? is_locked : thread.is_locked
    }

    // Update thread
    const { data: updatedThread, error } = await supabase
      .from('threads')
      .update(updateData)
      .eq('id', id)
      .select()

    if (error) {
      console.error('Error updating thread:', error)
      return NextResponse.json({ error: 'Failed to update thread' }, { status: 500 })
    }

    return NextResponse.json(updatedThread[0])
  } catch (error) {
    console.error('Error in thread PUT route:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/threads/[id] - Delete a thread
export async function DELETE(
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

    // Check if thread exists and get forum_id
    const { data: thread, error: threadError } = await supabase
      .from('threads')
      .select('user_id, forum_id')
      .eq('id', id)
      .single()

    if (threadError) {
      console.error('Error fetching thread:', threadError)
      return NextResponse.json({ error: 'Failed to fetch thread' }, { status: 500 })
    }

    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 })
    }

    // Check if user is the author or forum admin
    if (thread.user_id !== userId) {
      // Check if user is forum admin
      const { data: forum, error: forumError } = await supabase
        .from('forums')
        .select('admin_id')
        .eq('id', thread.forum_id)
        .single()

      if (forumError) {
        console.error('Error fetching forum:', forumError)
        return NextResponse.json({ error: 'Failed to fetch forum' }, { status: 500 })
      }

      if (forum.admin_id !== userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }
    }

    // Delete thread
    const { error } = await supabase
      .from('threads')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting thread:', error)
      return NextResponse.json({ error: 'Failed to delete thread' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Thread deleted successfully' })
  } catch (error) {
    console.error('Error in thread DELETE route:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}