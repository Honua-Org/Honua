import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/users/stats - Get user statistics for dashboard
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    // Get user profile with reputation
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('id, username, full_name, reputation')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get total points from reputation_actions
    const { data: pointsData, error: pointsError } = await supabase
      .from('reputation_actions')
      .select('points')
      .eq('user_id', userId)

    const totalPoints = pointsData?.reduce((sum, action) => sum + (action.points || 0), 0) || 0

    // Get completed tasks count
    const { data: completedTasks, error: tasksError } = await supabase
      .from('user_task_completions')
      .select('id')
      .eq('user_id', userId)
      .eq('verification_status', 'verified')

    const tasksCompleted = completedTasks?.length || 0

    // Get invites count (assuming we have a referrals table)
    const { data: invites, error: invitesError } = await supabase
      .from('referrals')
      .select('id')
      .eq('inviter_id', userId)

    const invitesCount = invites?.length || 0

    // Calculate user rank based on total points
    const { data: allUsers, error: rankError } = await supabase
      .from('profiles')
      .select('id, reputation')
      .order('reputation', { ascending: false })

    let userRank = 1
    if (allUsers) {
      const userIndex = allUsers.findIndex(u => u.id === userId)
      userRank = userIndex >= 0 ? userIndex + 1 : allUsers.length + 1
    }

    // Get leaderboard data for points
    const { data: pointsLeaderboard, error: pointsLeaderboardError } = await supabase
      .from('profiles')
      .select(`
        id,
        username,
        full_name,
        avatar_url,
        reputation
      `)
      .order('reputation', { ascending: false })
      .limit(10)

    // Transform leaderboard data
    const transformedPointsLeaderboard = pointsLeaderboard?.map((user, index) => ({
      rank: index + 1,
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        avatar_url: user.avatar_url
      },
      points: user.reputation || 0,
      tasks_completed: 0 // We'll need to calculate this separately if needed
    })) || []

    // Get invites leaderboard
    const { data: invitesLeaderboard, error: invitesLeaderboardError } = await supabase
      .rpc('get_invites_leaderboard')
      .limit(10)

    // If the function doesn't exist, create a fallback
    let transformedInvitesLeaderboard = []
    if (!invitesLeaderboardError && invitesLeaderboard) {
      transformedInvitesLeaderboard = invitesLeaderboard
    } else {
      // Fallback: get invites count for top users
      const { data: topInviters } = await supabase
        .from('referrals')
        .select(`
          inviter_id,
          profiles!referrals_inviter_id_fkey (
            id,
            username,
            full_name,
            avatar_url
          )
        `)

      // Group by inviter and count
      const inviterCounts = new Map()
      topInviters?.forEach(referral => {
        const inviterId = referral.inviter_id
        const count = inviterCounts.get(inviterId) || 0
        inviterCounts.set(inviterId, count + 1)
      })

      // Convert to leaderboard format
      transformedInvitesLeaderboard = Array.from(inviterCounts.entries())
        .map(([inviterId, count]) => {
          const referral = topInviters?.find(r => r.inviter_id === inviterId)
          const inviter = referral?.profiles as any
          return {
            rank: 0, // Will be set below
            user: {
              id: (inviter && typeof inviter === 'object' && !Array.isArray(inviter)) ? inviter.id : inviterId,
              username: (inviter && typeof inviter === 'object' && !Array.isArray(inviter)) ? inviter.username || 'Unknown' : 'Unknown',
              full_name: (inviter && typeof inviter === 'object' && !Array.isArray(inviter)) ? inviter.full_name || 'Unknown User' : 'Unknown User',
              avatar_url: (inviter && typeof inviter === 'object' && !Array.isArray(inviter)) ? inviter.avatar_url || null : null
            },
            invites: count,
            points_earned: count * 10 // Assuming 10 points per invite
          }
        })
        .sort((a, b) => b.invites - a.invites)
        .slice(0, 10)
        .map((entry, index) => ({ ...entry, rank: index + 1 }))
    }

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        points: totalPoints,
        rank: userRank,
        tasks_completed: tasksCompleted,
        invites_sent: invitesCount
      },
      leaderboards: {
        points: transformedPointsLeaderboard,
        invites: transformedInvitesLeaderboard
      }
    })

  } catch (error) {
    console.error('Error fetching user stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}