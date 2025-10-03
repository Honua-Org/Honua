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
        created_at,
        updated_at,
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
        likes:likes!left (count),
        comments:comments!left (count),
        reposts:reposts!left (count)${currentUserId ? `,
          user_likes:likes!left (user_id),
          user_bookmarks:bookmarks!left (user_id),
          user_reposts:reposts!left (user_id)
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
    const transformedPosts = (posts || []).map((post: any) => {
      const likesCount = post.likes?.[0]?.count || 0
      const commentsCount = post.comments?.[0]?.count || 0
      const repostsCount = post.reposts?.[0]?.count || 0
      
      return {
        ...post,
        likes_count: likesCount,
        comments_count: commentsCount,
        reposts_count: repostsCount,
        liked_by_user: currentUserId ? (post.user_likes || []).some((like: any) => like.user_id === currentUserId) : false,
        bookmarked_by_user: currentUserId ? (post.user_bookmarks || []).some((bookmark: any) => bookmark.user_id === currentUserId) : false,
        reposted_by_user: currentUserId ? (post.user_reposts || []).some((repost: any) => repost.user_id === currentUserId) : false,
        shares_count: repostsCount // Alias for compatibility
      }
    }).map(({ likes, comments, reposts, user_likes, user_bookmarks, user_reposts, ...post }) => post) // Remove internal fields

    return NextResponse.json(transformedPosts)
  } catch (error) {
    console.error('Error in recent posts API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}