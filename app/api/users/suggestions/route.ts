import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '5')

    // Get current user session
    const { data: { session } } = await supabase.auth.getSession()
    const currentUserId = session?.user?.id

    // Get users that the current user is NOT following, ordered by follower count
    let query = supabase
      .from('profiles')
      .select(`
        id,
        username,
        full_name,
        avatar_url,
        verified,
        bio,
        followers_count,
        following_count,
        posts_count
      `)
      .order('followers_count', { ascending: false })
      .limit(limit * 3) // Get more to filter out followed users

    // Exclude current user if logged in
    if (currentUserId) {
      query = query.neq('id', currentUserId)
    }

    const { data: allUsers, error: usersError } = await query

    if (usersError) {
      console.error('Error fetching user suggestions:', usersError)
      return NextResponse.json({ error: 'Failed to fetch user suggestions' }, { status: 500 })
    }

    let suggestedUsers = allUsers || []

    // If user is logged in, filter out users they're already following
    if (currentUserId) {
      const { data: followedUsers, error: followError } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', currentUserId)

      if (!followError && followedUsers) {
        const followedIds = new Set(followedUsers.map(f => f.following_id))
        suggestedUsers = suggestedUsers.filter(user => !followedIds.has(user.id))
      }
    }

    // Take only the requested limit and ensure avatar_url is present
    const finalSuggestions = suggestedUsers
      .slice(0, limit)
      .map(user => ({
        ...user,
        avatar_url: user.avatar_url || '/placeholder.svg'
      }))

    return NextResponse.json({ users: finalSuggestions })
  } catch (error) {
    console.error('Error in user suggestions API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}