import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!query) {
      return NextResponse.json({ hashtags: [] })
    }

    const supabase = createClient()

    // Search for hashtags in posts content
    const { data: posts, error } = await supabase
      .from('posts')
      .select('content')
      .ilike('content', `%#${query}%`)
      .limit(50)

    if (error) {
      console.error('Error searching hashtags:', error)
      return NextResponse.json({ error: 'Failed to search hashtags' }, { status: 500 })
    }

    // Extract hashtags from posts content
    const hashtagCounts = new Map<string, number>()
    const hashtagRegex = /#([a-zA-Z0-9_]+)/g

    posts?.forEach((post: { content: string }) => {
      let match
      while ((match = hashtagRegex.exec(post.content)) !== null) {
        const hashtag = match[1].toLowerCase()
        if (hashtag.includes(query.toLowerCase())) {
          hashtagCounts.set(hashtag, (hashtagCounts.get(hashtag) || 0) + 1)
        }
      }
    })

    // Convert to array and sort by usage count
    const hashtags = Array.from(hashtagCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20)

    return NextResponse.json({ hashtags })
  } catch (error) {
    console.error('Error in hashtag search:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}