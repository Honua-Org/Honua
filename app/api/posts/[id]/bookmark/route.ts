import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/posts/[id]/bookmark - Bookmark a post
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { id: postId } = params

    // Get current user session
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get collection_id from request body (optional)
    const body = await request.json().catch(() => ({}))
    const { collection_id } = body

    // Check if post exists
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('id')
      .eq('id', postId)
      .single()

    if (postError || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
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

    // Check if user already bookmarked the post
    const { data: existingBookmark } = await supabase
      .from('bookmarks')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', session.user.id)
      .single()

    if (existingBookmark) {
      return NextResponse.json({ error: 'Post already bookmarked' }, { status: 400 })
    }

    // Add bookmark
    const { error } = await supabase
      .from('bookmarks')
      .insert({
        post_id: postId,
        user_id: session.user.id,
        collection_id: collection_id || null
      })

    if (error) {
      console.error('Error bookmarking post:', error)
      return NextResponse.json({ error: 'Failed to bookmark post' }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'Post bookmarked successfully',
      bookmarked_by_user: true
    })
  } catch (error) {
    console.error('Error in POST /api/posts/[id]/bookmark:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/posts/[id]/bookmark - Remove bookmark from a post
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { id: postId } = params

    // Get current user session
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Remove bookmark
    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', session.user.id)

    if (error) {
      console.error('Error removing bookmark:', error)
      return NextResponse.json({ error: 'Failed to remove bookmark' }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'Bookmark removed successfully',
      bookmarked_by_user: false
    })
  } catch (error) {
    console.error('Error in DELETE /api/posts/[id]/bookmark:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}