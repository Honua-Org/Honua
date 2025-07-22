import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/collections - Get user's collections
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get current user session
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch user's collections with bookmark counts
    const { data: collections, error } = await supabase
      .from('collections')
      .select(`
        id,
        name,
        description,
        color,
        created_at,
        updated_at,
        bookmarks(count)
      `)
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching collections:', error)
      return NextResponse.json({ error: 'Failed to fetch collections' }, { status: 500 })
    }

    // Transform the data to include bookmark counts
    const collectionsWithCounts = collections?.map(collection => ({
      ...collection,
      bookmark_count: collection.bookmarks?.[0]?.count || 0
    })) || []

    return NextResponse.json(collectionsWithCounts)
  } catch (error) {
    console.error('Error in collections GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/collections - Create a new collection
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get current user session
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, color } = body

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'Collection name is required' }, { status: 400 })
    }

    // Check if collection with this name already exists for the user
    const { data: existingCollection } = await supabase
      .from('collections')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('name', name.trim())
      .single()

    if (existingCollection) {
      return NextResponse.json({ error: 'Collection with this name already exists' }, { status: 409 })
    }

    // Create the collection
    const { data: collection, error } = await supabase
      .from('collections')
      .insert({
        user_id: session.user.id,
        name: name.trim(),
        description: description?.trim() || null,
        color: color || '#10B981'
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating collection:', error)
      return NextResponse.json({ error: 'Failed to create collection' }, { status: 500 })
    }

    return NextResponse.json(collection, { status: 201 })
  } catch (error) {
    console.error('Error in collections POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/collections - Clear all collections (delete all user's collections)
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get current user session
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Delete all user's collections (bookmarks will have collection_id set to NULL due to ON DELETE SET NULL)
    const { error } = await supabase
      .from('collections')
      .delete()
      .eq('user_id', session.user.id)

    if (error) {
      console.error('Error clearing collections:', error)
      return NextResponse.json({ error: 'Failed to clear collections' }, { status: 500 })
    }

    return NextResponse.json({ message: 'All collections cleared successfully' })
  } catch (error) {
    console.error('Error in collections DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}