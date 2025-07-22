import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// GET /api/forums - Get all forums
export async function GET(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })

  try {
    // Get search query from URL if present
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query') || ''
    const category = searchParams.get('category') || ''

    let forumsQuery = supabase
      .from('forums')
      .select(`
        *,
        profiles:admin_id(username, full_name, avatar_url),
        thread_count:threads(count)
      `)
      .order('created_at', { ascending: false })

    // Apply search filter if query exists
    if (query) {
      forumsQuery = forumsQuery.or(`name.ilike.%${query}%,description.ilike.%${query}%`)
    }

    // Apply category filter if category exists
    if (category && category !== 'All') {
      forumsQuery = forumsQuery.eq('category', category)
    }

    const { data: forums, error } = await forumsQuery

    if (error) {
      console.error('Error fetching forums:', error)
      return NextResponse.json({ error: 'Failed to fetch forums' }, { status: 500 })
    }

    // Format the response
    const formattedForums = forums.map((forum) => ({
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
    }))

    return NextResponse.json(formattedForums)
  } catch (error) {
    console.error('Error in forums GET route:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/forums - Create a new forum
export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })

  try {
    // Check if user is authenticated
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Get request body
    const { name, description, category, is_private } = await request.json()

    // Validate required fields
    if (!name || !description || !category) {
      return NextResponse.json(
        { error: 'Name, description, and category are required' },
        { status: 400 }
      )
    }

    // Insert new forum
    const { data: forum, error } = await supabase
      .from('forums')
      .insert({
        name,
        description,
        category,
        admin_id: userId,
        is_private: is_private || false,
      })
      .select()

    if (error) {
      console.error('Error creating forum:', error)
      return NextResponse.json({ error: 'Failed to create forum' }, { status: 500 })
    }

    return NextResponse.json(forum[0], { status: 201 })
  } catch (error) {
    console.error('Error in forums POST route:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}