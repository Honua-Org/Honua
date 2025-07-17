import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/profiles/[id]/follow - Follow a user
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { id: targetUserId } = params

    // Get current user session
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const currentUserId = session.user.id

    // Prevent users from following themselves
    if (currentUserId === targetUserId) {
      return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 })
    }

    // Check if already following
    const { data: existingFollow } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', currentUserId)
      .eq('following_id', targetUserId)
      .single()

    if (existingFollow) {
      return NextResponse.json({ error: 'Already following this user' }, { status: 400 })
    }

    // Create follow relationship
    const { error: followError } = await supabase
      .from('follows')
      .insert({
        follower_id: currentUserId,
        following_id: targetUserId
      })

    if (followError) {
      console.error('Error creating follow:', followError)
      return NextResponse.json({ error: 'Failed to follow user' }, { status: 500 })
    }

    // Create notification for the followed user
    try {
      await supabase.rpc('create_notification', {
        p_recipient_id: targetUserId,
        p_actor_id: currentUserId,
        p_type: 'follow',
        p_content: 'started following you'
      })
    } catch (notificationError) {
      console.error('Error creating follow notification:', notificationError)
      // Don't fail the follow operation if notification fails
    }

    // Get updated follower count for the target user
    const { data: followerCount } = await supabase
      .from('follows')
      .select('id', { count: 'exact' })
      .eq('following_id', targetUserId)

    // Get updated following count for the current user
    const { data: followingCount } = await supabase
      .from('follows')
      .select('id', { count: 'exact' })
      .eq('follower_id', currentUserId)

    return NextResponse.json({
      success: true,
      follower_count: followerCount?.length || 0,
      following_count: followingCount?.length || 0
    })
  } catch (error) {
    console.error('Error in follow API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/profiles/[id]/follow - Unfollow a user
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { id: targetUserId } = params

    // Get current user session
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const currentUserId = session.user.id

    // Remove follow relationship
    const { error: unfollowError } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', currentUserId)
      .eq('following_id', targetUserId)

    if (unfollowError) {
      console.error('Error removing follow:', unfollowError)
      return NextResponse.json({ error: 'Failed to unfollow user' }, { status: 500 })
    }

    // Get updated follower count for the target user
    const { data: followerCount } = await supabase
      .from('follows')
      .select('id', { count: 'exact' })
      .eq('following_id', targetUserId)

    // Get updated following count for the current user
    const { data: followingCount } = await supabase
      .from('follows')
      .select('id', { count: 'exact' })
      .eq('follower_id', currentUserId)

    return NextResponse.json({
      success: true,
      follower_count: followerCount?.length || 0,
      following_count: followingCount?.length || 0
    })
  } catch (error) {
    console.error('Error in unfollow API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/profiles/[id]/follow - Check follow status between current user and target user
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { id: targetUserId } = params

    // Get current user session
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ 
        is_following: false, 
        follows_you: false 
      })
    }

    const currentUserId = session.user.id

    // Check if current user follows target user
    const { data: currentFollowsTarget } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', currentUserId)
      .eq('following_id', targetUserId)
      .single()

    // Check if target user follows current user
    const { data: targetFollowsCurrent } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', targetUserId)
      .eq('following_id', currentUserId)
      .single()

    return NextResponse.json({ 
      is_following: !!currentFollowsTarget,
      follows_you: !!targetFollowsCurrent
    })
  } catch (error) {
    console.error('Error checking follow status:', error)
    return NextResponse.json({ 
      is_following: false, 
      follows_you: false 
    })
  }
}