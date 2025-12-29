import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const limit = parseInt(searchParams.get('limit') || '20')

    if (!query) {
      return NextResponse.json({ posts: [] })
    }

    const supabase = createRouteHandlerClient({ cookies })

    // Search for posts by content
    const { data: posts, error } = await supabase
      .from('posts')
      .select(`
        id,
        content,
        media_urls,
        location,
        sustainability_category,
        impact_score,
        parent_id,
        link_preview_url,
        link_preview_title,
        link_preview_description,
        link_preview_image,
        link_preview_domain,
        created_at,
        updated_at,
        profiles!posts_user_id_fkey (
          id,
          username,
          full_name,
          avatar_url,
          verified
        )
      `)
      .or(`content.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error searching posts:', error)
      return NextResponse.json({ error: 'Failed to search posts' }, { status: 500 })
    }

    let transformedPosts: any[] = []
    
    if (posts && posts.length > 0) {
      // Get counts for each post
      const postIds = posts.map(post => post.id)
      
      // Get likes count
      const { data: likesData } = await supabase
        .from('likes')
        .select('post_id')
        .in('post_id', postIds)
      
      // Get comments count
      const { data: commentsData } = await supabase
        .from('comments')
        .select('post_id')
        .in('post_id', postIds)
      
      // Get reposts count
      const { data: repostsData } = await supabase
        .from('reposts')
        .select('post_id')
        .in('post_id', postIds)
      
      // Count occurrences
      const likesCount = likesData?.reduce((acc, like) => {
        acc[like.post_id] = (acc[like.post_id] || 0) + 1
        return acc
      }, {} as Record<string, number>) || {}
      
      const commentsCount = commentsData?.reduce((acc, comment) => {
        acc[comment.post_id] = (acc[comment.post_id] || 0) + 1
        return acc
      }, {} as Record<string, number>) || {}
      
      const repostsCount = repostsData?.reduce((acc, repost) => {
        acc[repost.post_id] = (acc[repost.post_id] || 0) + 1
        return acc
      }, {} as Record<string, number>) || {}
      
      // Transform the data to match the expected format
      transformedPosts = (posts as any[]).map(post => ({
        id: post.id,
        content: post.content,
        media_urls: post.media_urls,
        location: post.location,
        sustainability_category: post.sustainability_category,
        impact_score: post.impact_score,
        parent_id: post.parent_id,
        link_preview_url: post.link_preview_url,
        link_preview_title: post.link_preview_title,
        link_preview_description: post.link_preview_description,
        link_preview_image: post.link_preview_image,
        link_preview_domain: post.link_preview_domain,
        created_at: post.created_at,
        updated_at: post.updated_at,
        likes_count: likesCount[post.id] || 0,
        comments_count: commentsCount[post.id] || 0,
        shares_count: repostsCount[post.id] || 0,
        reposts_count: repostsCount[post.id] || 0,
        user: post.profiles
      }))
    }

    return NextResponse.json({ posts: transformedPosts })
  } catch (error) {
    console.error('Error in post search:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}