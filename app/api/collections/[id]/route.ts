import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// PUT /api/collections/[id] - Update a collection
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { id: collectionId } = params
    
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

    // Check if collection exists and belongs to user
    const { data: existingCollection, error: fetchError } = await supabase
      .from('collections')
      .select('id, name')
      .eq('id', collectionId)
      .eq('user_id', session.user.id)
      .single()

    if (fetchError || !existingCollection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 })
    }

    // Check if another collection with this name already exists for the user (excluding current collection)
    const { data: duplicateCollection } = await supabase
      .from('collections')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('name', name.trim())
      .neq('id', collectionId)
      .single()

    if (duplicateCollection) {
      return NextResponse.json({ error: 'Collection with this name already exists' }, { status: 409 })
    }

    // Update the collection
    const { data: collection, error } = await supabase
      .from('collections')
      .update({
        name: name.trim(),
        description: description?.trim() || null,
        color: color || '#10B981',
        updated_at: new Date().toISOString()
      })
      .eq('id', collectionId)
      .eq('user_id', session.user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating collection:', error)
      return NextResponse.json({ error: 'Failed to update collection' }, { status: 500 })
    }

    return NextResponse.json(collection)
  } catch (error) {
    console.error('Error in collection PUT:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/collections/[id] - Delete a specific collection
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { id: collectionId } = params
    
    // Get current user session
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if collection exists and belongs to user
    const { data: existingCollection, error: fetchError } = await supabase
      .from('collections')
      .select('id, name')
      .eq('id', collectionId)
      .eq('user_id', session.user.id)
      .single()

    if (fetchError || !existingCollection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 })
    }

    // Delete the collection (bookmarks will have collection_id set to NULL due to ON DELETE SET NULL)
    const { error } = await supabase
      .from('collections')
      .delete()
      .eq('id', collectionId)
      .eq('user_id', session.user.id)

    if (error) {
      console.error('Error deleting collection:', error)
      return NextResponse.json({ error: 'Failed to delete collection' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Collection deleted successfully' })
  } catch (error) {
    console.error('Error in collection DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}