import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// PUT /api/bookmarks/[id]/move - Move a bookmark to a different collection
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { id: bookmarkId } = params
    
    // Get current user session
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { collection_id } = body

    // Check if bookmark exists and belongs to user
    const { data: existingBookmark, error: fetchError } = await supabase
      .from('bookmarks')
      .select('id, post_id')
      .eq('id', bookmarkId)
      .eq('user_id', session.user.id)
      .single()

    if (fetchError || !existingBookmark) {
      return NextResponse.json({ error: 'Bookmark not found' }, { status: 404 })
    }

    // If collection_id is provided, verify it belongs to the user
    if (collection_id) {
      const { data: collection, error: collectionError } = await supabase
        .from('collections')
        .select('id')
        .eq('id', collection_id)
        .eq('user_id', session.user.id)
        .single()

      if (collectionError || !collection) {
        return NextResponse.json({ error: 'Collection not found' }, { status: 404 })
      }
    }

    // Update the bookmark's collection
    const { data: bookmark, error } = await supabase
      .from('bookmarks')
      .update({
        collection_id: collection_id || null
      })
      .eq('id', bookmarkId)
      .eq('user_id', session.user.id)
      .select()
      .single()

    if (error) {
      console.error('Error moving bookmark:', error)
      return NextResponse.json({ error: 'Failed to move bookmark' }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Bookmark moved successfully',
      bookmark
    })
  } catch (error) {
    console.error('Error in bookmark move PUT:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}