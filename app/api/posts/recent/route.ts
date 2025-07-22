import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const category = searchParams.get('category')

    // Get current user session (optional for viewing posts)
    const { data: { session } } = await supabase.auth.getSession()
    const currentUserId = session?.user?.id

    // Build query with optional category filter
    let query = supabase
      .from('posts')
      .select(`
        id,
        content,
        media_urls,
        image_url,
        created_at,
        updated_at,
        likes_count,
        comments_count,
        reposts_count,
        location,
        sustainability_category,
        impact_score,
        parent_id,
        link_preview_url,
        link_preview_title,
        link_preview_description,
        link_preview_image,
        link_preview_domain,
        user:profiles!posts_user_id_fkey (
          id,
          username,
          full_name,
          avatar_url,
          verified
        ),
        ${currentUserId ? `
          post_likes!left (user_id),
          bookmarks!left (user_id),
          reposts!left (user_id)
        ` : ''}
      `)

    // Add category filter if specified and not "All Categories"
    if (category && category !== 'All Categories') {
      query = query.eq('sustainability_category', category)
    }

    // Fetch most recent posts
    const { data: posts, error } = await query
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching recent posts:', error)
      return NextResponse.json({ error: 'Failed to fetch recent posts' }, { status: 500 })
    }

    // Transform posts to include user interaction status
    const transformedPosts = (posts || []).map((post: any) => ({
      ...post,
      liked_by_user: currentUserId ? (post.post_likes || []).some((like: any) => like.user_id === currentUserId) : false,
      bookmarked_by_user: currentUserId ? (post.bookmarks || []).some((bookmark: any) => bookmark.user_id === currentUserId) : false,
      reposted_by_user: currentUserId ? (post.reposts || []).some((repost: any) => repost.user_id === currentUserId) : false,
      shares_count: post.reposts_count || 0 // Alias for compatibility
    })).map(({ post_likes, bookmarks, reposts, ...post }) => post) // Remove internal fields

    return NextResponse.json(transformedPosts)
  } catch (error) {
    console.error('Error in recent posts API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}