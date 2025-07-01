import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

// GET /api/posts - Fetch posts for home feed
export async function GET(request: NextRequest) {
  try {
    // Check if Supabase environment variables are configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Missing Supabase environment variables')
      return NextResponse.json({ 
        error: 'Server configuration error: Missing Supabase environment variables. Please check your .env.local file.' 
      }, { status: 500 })
    }

    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.error('Supabase auth error:', authError)
      return NextResponse.json({ 
        error: 'Authentication error: ' + authError.message 
      }, { status: 401 })
    }

    // Fetch posts with user data, likes, comments, and reposts
    const { data: posts, error } = await supabase
      .from('posts')
      .select(`
        *,
        profiles!posts_user_id_fkey (
          id,
          username,
          full_name,
          avatar_url
        ),
        likes(count),
        comments(count),
        reposts(count)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching posts:', error)
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return NextResponse.json({ 
        error: 'Database error: ' + error.message + (error.hint ? ' Hint: ' + error.hint : '')
      }, { status: 500 })
    }

    // Transform the data to include interaction counts and user interaction status
    const transformedPosts = await Promise.all(
      posts.map(async (post) => {
        // Get user's interactions with this post
        let userLiked = false
        let userBookmarked = false
        let userReposted = false

        if (user) {
           const [likeResult, bookmarkResult, repostResult] = await Promise.all([
             supabase
               .from('likes')
               .select('id')
               .eq('post_id', post.id)
               .eq('user_id', user.id)
               .single(),
             supabase
               .from('bookmarks')
               .select('id')
               .eq('post_id', post.id)
               .eq('user_id', user.id)
               .single(),
             supabase
               .from('reposts')
               .select('id')
               .eq('post_id', post.id)
               .eq('user_id', user.id)
               .single()
           ])

          userLiked = !likeResult.error
          userBookmarked = !bookmarkResult.error
          userReposted = !repostResult.error
        }

        return {
          ...post,
          user: post.profiles,
          likes_count: post.likes?.[0]?.count || 0,
          comments_count: post.comments?.[0]?.count || 0,
          reposts_count: post.reposts?.[0]?.count || 0,
          liked_by_user: userLiked,
          bookmarked_by_user: userBookmarked,
          reposted_by_user: userReposted
        }
      })
    )

    return NextResponse.json(transformedPosts)
  } catch (error) {
    console.error('Error in GET /api/posts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/posts - Create a new post
export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { content, media_urls, parent_id, location, sustainability_category, impact_score } = body

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    // Prepare insert data, only include parent_id if it's provided and not null/undefined
    const insertData: any = {
      user_id: user.id,
      content: content.trim(),
      media_urls: media_urls || [],
      location: location || null,
      sustainability_category: sustainability_category || null,
      impact_score: impact_score || null
    }

    // Only add parent_id if it's a valid UUID string
    if (parent_id && typeof parent_id === 'string' && parent_id.trim() !== '') {
      insertData.parent_id = parent_id
    }

    // Insert the new post
    const { data: post, error } = await supabase
      .from('posts')
      .insert(insertData)
      .select(`
         *,
         profiles!posts_user_id_fkey (
           id,
           username,
           full_name,
           avatar_url
         )
       `)
      .single()

    if (error) {
      console.error('Error creating post:', error)
      return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
    }

    // Return the created post with default interaction counts
    const transformedPost = {
      ...post,
      likes_count: 0,
      comments_count: 0,
      reposts_count: 0,
      user_liked: false,
      user_bookmarked: false,
      user_reposted: false
    }

    return NextResponse.json(transformedPost, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/posts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}