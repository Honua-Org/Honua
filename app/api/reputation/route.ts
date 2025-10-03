import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/reputation - Get user reputation details
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const username = searchParams.get('username')

    if (!userId && !username) {
      return NextResponse.json(
        { error: 'User ID or username is required' },
        { status: 400 }
      )
    }

    // Get user profile with reputation
    let userQuery = supabase
      .from('profiles')
      .select('id, username, reputation')

    if (userId) {
      userQuery = userQuery.eq('id', userId)
    } else {
      userQuery = userQuery.eq('username', username)
    }

    const { data: user, error: userError } = await userQuery.single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get reputation level
    const { data: levelData, error: levelError } = await supabase
      .rpc('get_user_reputation_level', { reputation_score: user.reputation })

    if (levelError) {
      console.error('Error getting reputation level:', levelError)
    }

    // Get recent reputation actions
    const { data: recentActions, error: actionsError } = await supabase
      .from('reputation_actions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)

    if (actionsError) {
      console.error('Error getting reputation actions:', actionsError)
    }

    // Get user achievements
    const { data: achievements, error: achievementsError } = await supabase
      .from('user_achievements')
      .select(`
        earned_at,
        achievements (
          id,
          name,
          description,
          icon,
          category,
          points
        )
      `)
      .eq('user_id', user.id)
      .order('earned_at', { ascending: false })

    if (achievementsError) {
      console.error('Error getting achievements:', achievementsError)
    }

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        reputation: user.reputation
      },
      level: levelData?.[0] || null,
      recentActions: recentActions || [],
      achievements: achievements || []
    })

  } catch (error) {
    console.error('Error in reputation GET:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/reputation - Award reputation points
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      userId,
      actionType,
      points,
      referenceId,
      referenceType,
      description
    } = body

    if (!userId || !actionType || points === undefined) {
      return NextResponse.json(
        { error: 'userId, actionType, and points are required' },
        { status: 400 }
      )
    }

    // Validate action type
    const validActionTypes = [
      'post_created', 'post_liked', 'post_shared', 'post_reported',
      'comment_created', 'comment_liked', 'comment_helpful',
      'task_completed', 'achievement_earned', 'verified_action',
      'community_participation', 'educational_content', 'sustainability_impact',
      'peer_recognition', 'consistency_bonus', 'inactivity_penalty'
    ]

    if (!validActionTypes.includes(actionType)) {
      return NextResponse.json(
        { error: 'Invalid action type' },
        { status: 400 }
      )
    }

    // Add reputation points using the database function
    const { error: addPointsError } = await supabase
      .rpc('add_reputation_points', {
        user_uuid: userId,
        action_type_param: actionType,
        points_param: points,
        reference_id_param: referenceId || null,
        reference_type_param: referenceType || null,
        description_param: description || null
      })

    if (addPointsError) {
      console.error('Error adding reputation points:', addPointsError)
      return NextResponse.json(
        { error: 'Failed to add reputation points' },
        { status: 500 }
      )
    }

    // Get updated user reputation
    const { data: updatedUser, error: userError } = await supabase
      .from('profiles')
      .select('reputation')
      .eq('id', userId)
      .single()

    if (userError) {
      console.error('Error getting updated reputation:', userError)
    }

    // Check for new achievements
    await checkAndAwardAchievements(userId)

    return NextResponse.json({
      success: true,
      newReputation: updatedUser?.reputation || 0,
      pointsAwarded: points
    })

  } catch (error) {
    console.error('Error in reputation POST:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to check and award achievements
async function checkAndAwardAchievements(userId: string) {
  try {
    // Get user stats for achievement checking
    const { data: userStats } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (!userStats) return

    // Get user's current achievements
    const { data: currentAchievements } = await supabase
      .from('user_achievements')
      .select('achievement_id')
      .eq('user_id', userId)

    const currentAchievementIds = currentAchievements?.map(a => a.achievement_id) || []

    // Get all available achievements
    const { data: allAchievements } = await supabase
      .from('achievements')
      .select('*')

    if (!allAchievements) return

    // Check each achievement
    for (const achievement of allAchievements) {
      if (currentAchievementIds.includes(achievement.id)) continue

      const requirements = achievement.requirements as any
      let qualifies = false

      // Check different achievement types
      switch (achievement.name) {
        case 'First Post':
          // Check if user has at least 1 post
          const { count: postCount } = await supabase
            .from('posts')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
          qualifies = (postCount || 0) >= 1
          break

        case 'Community Helper':
          // Check if user has 50+ comment likes
          const { data: commentLikes } = await supabase
            .from('likes')
            .select('post_id')
            .eq('user_id', userId)
          // This is simplified - in a real app, you'd track comment likes separately
          qualifies = (commentLikes?.length || 0) >= 50
          break

        case 'Impact Maker':
          // Check if user has 500+ total impact score
          qualifies = (userStats.reputation || 0) >= 500
          break

        // Add more achievement checks as needed
      }

      if (qualifies) {
        // Award the achievement
        await supabase
          .from('user_achievements')
          .insert({
            user_id: userId,
            achievement_id: achievement.id
          })

        // Award achievement points
        await supabase
          .rpc('add_reputation_points', {
            user_uuid: userId,
            action_type_param: 'achievement_earned',
            points_param: achievement.points,
            reference_id_param: achievement.id,
            reference_type_param: 'achievement',
            description_param: `Earned achievement: ${achievement.name}`
          })
      }
    }
  } catch (error) {
    console.error('Error checking achievements:', error)
  }
}