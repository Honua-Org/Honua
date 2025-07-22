import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// GET /api/forums/[id] - Get a specific forum by ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createRouteHandlerClient({ cookies })
  const { id } = params

  try {
    // Get forum details
    const { data: forum, error: forumError } = await supabase
      .from('forums')
      .select(`
        *,
        profiles:admin_id(id, username, full_name, avatar_url),
        thread_count:threads(count)
      `)
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
      .order('created_at', { ascending: false })

    if (threadsError) {
      console.error('Error fetching threads:', threadsError)
      return NextResponse.json({ error: 'Failed to fetch threads' }, { status: 500 })
    }

    // Format the response
    const formattedForum = {
      id: forum.id,
      name: forum.name,
      description: forum.description,
      category: forum.category,
      member_count: 0, // This would need a separate query or join to get actual member count
      thread_count: forum.thread_count?.[0]?.count || 0,
      latest_activity: forum.updated_at || forum.created_at,
      moderators: [forum.profiles?.username],
      is_private: forum.is_private || false,
      creator: forum.profiles?.username,
      admin_id: forum.admin_id,
      threads: threads.map((thread) => ({
        id: thread.id,
        title: thread.title,
        content: thread.content,
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
      })),
    }

    return NextResponse.json(formattedForum)
  } catch (error) {
    console.error('Error in forum GET route:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/forums/[id] - Update a forum
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

    // Check if user is the forum admin
    const { data: forum, error: forumError } = await supabase
      .from('forums')
      .select('admin_id')
      .eq('id', id)
      .single()

    if (forumError) {
      console.error('Error fetching forum:', forumError)
      return NextResponse.json({ error: 'Failed to fetch forum' }, { status: 500 })
    }

    if (!forum) {
      return NextResponse.json({ error: 'Forum not found' }, { status: 404 })
    }

    if (forum.admin_id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Get request body
    const { name, description, category, is_private } = await request.json()

    // Validate required fields
    if (!name || !description || !category) {
      return NextResponse.json(
        { error: 'Name, description, and category are required' },
        { status: 400 }
      )
    }

    // Update forum
    const { data: updatedForum, error } = await supabase
      .from('forums')
      .update({
        name,
        description,
        category,
        is_private: is_private || false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()

    if (error) {
      console.error('Error updating forum:', error)
      return NextResponse.json({ error: 'Failed to update forum' }, { status: 500 })
    }

    return NextResponse.json(updatedForum[0])
  } catch (error) {
    console.error('Error in forum PUT route:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/forums/[id] - Delete a forum
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

    // Check if user is the forum admin
    const { data: forum, error: forumError } = await supabase
      .from('forums')
      .select('admin_id')
      .eq('id', id)
      .single()

    if (forumError) {
      console.error('Error fetching forum:', forumError)
      return NextResponse.json({ error: 'Failed to fetch forum' }, { status: 500 })
    }

    if (!forum) {
      return NextResponse.json({ error: 'Forum not found' }, { status: 404 })
    }

    if (forum.admin_id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Delete forum
    const { error } = await supabase
      .from('forums')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting forum:', error)
      return NextResponse.json({ error: 'Failed to delete forum' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Forum deleted successfully' })
  } catch (error) {
    console.error('Error in forum DELETE route:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}