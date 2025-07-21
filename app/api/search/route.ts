import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const type = searchParams.get('type') || 'all'
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!query) {
      return NextResponse.json({ 
        users: [], 
        posts: [], 
        hashtags: [], 
        categories: [] 
      })
    }

    const supabase = createClient()
    const results: any = {}

    // Search users
    if (type === 'all' || type === 'users') {
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, verified, bio')
        .or(`username.ilike.%${query}%,full_name.ilike.%${query}%,bio.ilike.%${query}%`)
        .limit(limit)

      if (!usersError) {
        results.users = users || []
      }
    }

    // Search posts
    if (type === 'all' || type === 'posts') {
      const { data: posts, error: postsError } = await supabase
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
        .ilike('content', `%${query}%`)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (!postsError && posts) {
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
        
        results.posts = posts.map(post => ({
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
      } else {
        results.posts = []
      }
    }

    // Search hashtags
    if (type === 'all' || type === 'hashtags') {
      const { data: hashtagPosts, error: hashtagError } = await supabase
        .from('posts')
        .select('content')
        .ilike('content', `%#${query}%`)
        .limit(50)

      if (!hashtagError) {
        const hashtagCounts = new Map<string, number>()
        const hashtagRegex = /#([a-zA-Z0-9_]+)/g

        hashtagPosts?.forEach(post => {
          let match
          while ((match = hashtagRegex.exec(post.content)) !== null) {
            const hashtag = match[1].toLowerCase()
            if (hashtag.includes(query.toLowerCase())) {
              hashtagCounts.set(hashtag, (hashtagCounts.get(hashtag) || 0) + 1)
            }
          }
        })

        results.hashtags = Array.from(hashtagCounts.entries())
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, limit)
      }
    }

    // Search categories
    if (type === 'all' || type === 'categories') {
      const { data: categories, error: categoriesError } = await supabase
        .from('categories')
        .select('id, name, description, icon, color, posts_count')
        .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
        .order('posts_count', { ascending: false })
        .limit(limit)

      if (!categoriesError) {
        results.categories = categories || []
      }
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error('Error in comprehensive search:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}