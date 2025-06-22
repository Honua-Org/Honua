import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/comments/[id]/like - Like a comment
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { id: commentId } = params

    // Get current user session
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if comment exists
    const { data: comment, error: commentError } = await supabase
      .from('comments')
      .select('id')
      .eq('id', commentId)
      .single()

    if (commentError || !comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    }

    // Check if user already liked the comment
    const { data: existingLike } = await supabase
      .from('comment_likes')
      .select('id')
      .eq('comment_id', commentId)
      .eq('user_id', session.user.id)
      .single()

    if (existingLike) {
      return NextResponse.json({ error: 'Comment already liked' }, { status: 400 })
    }

    // Add like
    const { error } = await supabase
      .from('comment_likes')
      .insert({
        comment_id: commentId,
        user_id: session.user.id
      })

    if (error) {
      console.error('Error liking comment:', error)
      return NextResponse.json({ error: 'Failed to like comment' }, { status: 500 })
    }

    // Get updated like count
    const { count } = await supabase
      .from('comment_likes')
      .select('*', { count: 'exact', head: true })
      .eq('comment_id', commentId)

    return NextResponse.json({ 
      message: 'Comment liked successfully',
      likes_count: count || 0,
      liked_by_user: true
    })
  } catch (error) {
    console.error('Error in POST /api/comments/[id]/like:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/comments/[id]/like - Unlike a comment
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { id: commentId } = params

    // Get current user session
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Remove like
    const { error } = await supabase
      .from('comment_likes')
      .delete()
      .eq('comment_id', commentId)
      .eq('user_id', session.user.id)

    if (error) {
      console.error('Error unliking comment:', error)
      return NextResponse.json({ error: 'Failed to unlike comment' }, { status: 500 })
    }

    // Get updated like count
    const { count } = await supabase
      .from('comment_likes')
      .select('*', { count: 'exact', head: true })
      .eq('comment_id', commentId)

    return NextResponse.json({ 
      message: 'Comment unliked successfully',
      likes_count: count || 0,
      liked_by_user: false
    })
  } catch (error) {
    console.error('Error in DELETE /api/comments/[id]/like:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}