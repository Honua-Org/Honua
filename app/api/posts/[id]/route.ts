import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/posts/[id] - Get a specific post
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const params = await context.params;
    const { id } = params;

    // Get current user session (optional for viewing posts)
    const { data: { session } } = await supabase.auth.getSession()

    // Fetch specific post with user data and interaction counts
    let query = supabase
      .from('posts')
      .select(`
        *,
        profiles:user_id (
          id,
          username,
          full_name,
          avatar_url
        ),
        likes:likes(count),
        comments:comments(count),
        reposts:reposts(count)
      `)
      .eq('id', id)
      .single()

    const { data: post, error } = await query

    if (error || !post || !post.profiles) {
      console.error('Error fetching post or missing user profile:', error)
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Fetch user-specific interactions if user is logged in
    let userInteractions = {
      liked_by_user: false,
      bookmarked_by_user: false,
      reposted_by_user: false
    }

    if (session?.user?.id) {
      const [likesResult, bookmarksResult, repostsResult] = await Promise.all([
        supabase.from('likes').select('id').eq('post_id', id).eq('user_id', session.user.id).single(),
        supabase.from('bookmarks').select('id').eq('post_id', id).eq('user_id', session.user.id).single(),
        supabase.from('reposts').select('id').eq('post_id', id).eq('user_id', session.user.id).single()
      ])

      userInteractions = {
        liked_by_user: !likesResult.error && !!likesResult.data,
        bookmarked_by_user: !bookmarksResult.error && !!bookmarksResult.data,
        reposted_by_user: !repostsResult.error && !!repostsResult.data
      }
    }

    // Transform the data
    const transformedPost = {
      ...post,
      user: post.profiles,
      likes_count: post.likes?.[0]?.count || 0,
      comments_count: post.comments?.[0]?.count || 0,
      reposts_count: post.reposts?.[0]?.count || 0,
      ...userInteractions
    }

    return NextResponse.json({ post: transformedPost })
  } catch (error) {
    console.error('Error in GET /api/posts/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/posts/[id] - Delete a post
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const params = await context.params;
    const { id } = params;

    // Get current user session
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user owns the post
    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select('user_id')
      .eq('id', id)
      .single()

    if (fetchError || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    if (post.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Delete the post
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting post:', error)
      return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Post deleted successfully' })
  } catch (error) {
    console.error('Error in DELETE /api/posts/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}