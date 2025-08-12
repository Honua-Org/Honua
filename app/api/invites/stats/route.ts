import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's invite count
    const { count: invitedCount, error: countError } = await supabase
      .from('invites')
      .select('*', { count: 'exact', head: true })
      .eq('inviter_id', user.id)
      .eq('is_used', true)

    if (countError) {
      console.error('Error fetching invite count:', countError)
      return NextResponse.json({ error: 'Failed to fetch invite count' }, { status: 500 })
    }

    // Get leaderboard data to calculate rank
    const { data: leaderboardData, error: leaderboardError } = await supabase
      .rpc('get_invite_leaderboard')

    let rank = 0
    let totalUsers = 0

    if (leaderboardError) {
      // Fallback: calculate rank manually if RPC function doesn't exist
      const { data: allInviters, error: allInvitersError } = await supabase
        .from('invites')
        .select('inviter_id')
        .eq('is_used', true)

      if (!allInvitersError && allInviters) {
        // Count invites per user
        const inviteCountsByUser = allInviters.reduce((acc: Record<string, number>, invite) => {
          acc[invite.inviter_id] = (acc[invite.inviter_id] || 0) + 1
          return acc
        }, {})

        // Sort users by invite count
        const sortedUsers = Object.entries(inviteCountsByUser)
          .sort(([, a], [, b]) => (b as number) - (a as number))

        // Find current user's rank
        const userRankIndex = sortedUsers.findIndex(([userId]) => userId === user.id)
        rank = userRankIndex >= 0 ? userRankIndex + 1 : 0
        totalUsers = sortedUsers.length
      }
    } else if (leaderboardData) {
      // Use RPC function result
      const userEntry = leaderboardData.find((entry: any) => entry.inviter_id === user.id)
      rank = userEntry ? userEntry.rank : 0
      totalUsers = leaderboardData.length
    }

    return NextResponse.json({
      invitedCount: invitedCount || 0,
      rank,
      totalUsers
    })
  } catch (error) {
    console.error('Error in invite stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}