import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')

    const supabase = createClient()

    // Get recent posts to extract hashtags from
    const { data: posts, error } = await supabase
      .from('posts')
      .select('content')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days
      .limit(1000)

    if (error) {
      console.error('Error fetching posts for hashtag analysis:', error)
      return NextResponse.json({ error: 'Failed to fetch hashtags' }, { status: 500 })
    }

    // Extract hashtags from posts and count their usage
    const hashtagCounts = new Map<string, number>()
    const hashtagRegex = /#([a-zA-Z0-9_]+)/g

    posts?.forEach(post => {
      if (post.content) {
        const matches = post.content.match(hashtagRegex)
        if (matches) {
          matches.forEach(match => {
            const hashtag = match.toLowerCase() // Normalize to lowercase
            hashtagCounts.set(hashtag, (hashtagCounts.get(hashtag) || 0) + 1)
          })
        }
      }
    })

    // Convert to array and sort by count
    const trendingHashtags = Array.from(hashtagCounts.entries())
      .map(([hashtag, count]) => ({
        hashtag: hashtag.slice(1), // Remove the # symbol
        count,
        trend: 'up' as const // You could implement trend calculation here
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)

    return NextResponse.json({ hashtags: trendingHashtags })
  } catch (error) {
    console.error('Error in trending hashtags API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}