import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/posts/[id]/comments - Get comments for a post
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const params = await context.params;
    const { id: postId } = params;
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // Get current user session (optional for viewing comments)
    const { data: { session } } = await supabase.auth.getSession()

    // Fetch ALL comments (both top-level and replies) with user data and like counts
    const { data: comments, error } = await supabase
      .from('comments')
      .select(`
        *,
        profiles:user_id (
          id,
          username,
          full_name,
          avatar_url,
          verified
        ),
        comment_likes:comment_likes(count)
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching comments:', error)
      return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 })
    }

    // Transform the data
    const transformedComments = await Promise.all(
      (comments || []).map(async (comment) => {
        let liked_by_user = false
        
        // Check if user liked this comment (only if user is logged in)
        if (session?.user?.id) {
          const { data: userLike } = await supabase
            .from('comment_likes')
            .select('id')
            .eq('comment_id', comment.id)
            .eq('user_id', session.user.id)
            .single()
          
          liked_by_user = !!userLike
        }
        
        return {
          ...comment,
          user: comment.profiles,
          likes_count: comment.comment_likes?.[0]?.count || 0,
          liked_by_user
        }
      })
    )

    return NextResponse.json({ comments: transformedComments })
  } catch (error) {
    console.error('Error in GET /api/posts/[id]/comments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/posts/[id]/comments - Create a new comment
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const params = await context.params;
    const { id: postId } = params;

    // Get current user session
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user profile exists
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', session.user.id)
      .single()

    if (profileError || !userProfile) {
      console.error('User profile not found:', profileError)
      return NextResponse.json({ error: 'User profile not found. Please complete your profile setup.' }, { status: 400 })
    }

    const body = await request.json()
    const { content, parent_id } = body

    // Validate required fields
    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    // Check if post exists
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('id')
      .eq('id', postId)
      .single()

    if (postError || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // If replying to a comment, check if parent comment exists
    if (parent_id) {
      const { data: parentComment, error: parentError } = await supabase
        .from('comments')
        .select('id')
        .eq('id', parent_id)
        .eq('post_id', postId)
        .single()

      if (parentError || !parentComment) {
        return NextResponse.json({ error: 'Parent comment not found' }, { status: 404 })
      }
    }

    // Insert new comment
    const { data: comment, error } = await supabase
      .from('comments')
      .insert({
        post_id: postId,
        user_id: session.user.id,
        content: content.trim(),
        parent_id: parent_id || null
      })
      .select(`
        *,
        profiles:user_id (
          id,
          username,
          full_name,
          avatar_url,
          verified
        )
      `)
      .single()

    if (error) {
      console.error('Error creating comment:', error)
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      })
      
      // Handle specific error cases
      if (error.code === '23503') {
        return NextResponse.json({ error: 'Invalid reference: post or user not found' }, { status: 400 })
      }
      if (error.code === '42501') {
        return NextResponse.json({ error: 'Permission denied: check your account permissions' }, { status: 403 })
      }
      
      return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 })
    }

    // Transform the response
    const transformedComment = {
      ...comment,
      user: comment.profiles,
      likes_count: 0,
      liked_by_user: false
    }

    return NextResponse.json({ comment: transformedComment }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/posts/[id]/comments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}