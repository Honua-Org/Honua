import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Get current user session
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const currentUserId = session.user.id

    // Check if already following
    const { data: existingFollow } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', currentUserId)
      .eq('following_id', userId)
      .single()

    if (existingFollow) {
      return NextResponse.json({ error: 'Already following this user' }, { status: 400 })
    }

    // Create follow relationship
    const { error: followError } = await supabase
      .from('follows')
      .insert({
        follower_id: currentUserId,
        following_id: userId
      })

    if (followError) {
      console.error('Error creating follow relationship:', followError)
      return NextResponse.json({ error: 'Failed to follow user' }, { status: 500 })
    }

    // Update follower count for the followed user
    const { error: updateError } = await supabase.rpc('increment_followers_count', {
      user_id: userId
    })

    if (updateError) {
      console.error('Error updating follower count:', updateError)
      // Don't fail the request if count update fails
    }

    // Update following count for current user
    const { error: updateFollowingError } = await supabase.rpc('increment_following_count', {
      user_id: currentUserId
    })

    if (updateFollowingError) {
      console.error('Error updating following count:', updateFollowingError)
      // Don't fail the request if count update fails
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in follow API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Get current user session
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const currentUserId = session.user.id

    // Remove follow relationship
    const { error: unfollowError } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', currentUserId)
      .eq('following_id', userId)

    if (unfollowError) {
      console.error('Error removing follow relationship:', unfollowError)
      return NextResponse.json({ error: 'Failed to unfollow user' }, { status: 500 })
    }

    // Update follower count for the unfollowed user
    const { error: updateError } = await supabase.rpc('decrement_followers_count', {
      user_id: userId
    })

    if (updateError) {
      console.error('Error updating follower count:', updateError)
      // Don't fail the request if count update fails
    }

    // Update following count for current user
    const { error: updateFollowingError } = await supabase.rpc('decrement_following_count', {
      user_id: currentUserId
    })

    if (updateFollowingError) {
      console.error('Error updating following count:', updateFollowingError)
      // Don't fail the request if count update fails
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in unfollow API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}