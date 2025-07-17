import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/test-notifications - Create sample notifications for testing
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's profile
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id, username')
      .eq('id', user.id)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    // Get a sample post from the user (if any)
    const { data: userPost } = await supabase
      .from('posts')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)
      .single()

    const notifications = []
    
    try {
      // Create sample follow notification
      const followNotification = await supabase.rpc('create_notification', {
        p_recipient_id: user.id,
        p_actor_id: user.id, // Using same user for demo
        p_type: 'follow',
        p_content: 'Welcome! This is a sample follow notification.'
      })
      notifications.push({ type: 'follow', id: followNotification })

      // Create sample like notification (if user has posts)
      if (userPost) {
        const likeNotification = await supabase.rpc('create_notification', {
          p_recipient_id: user.id,
          p_actor_id: user.id,
          p_type: 'like',
          p_post_id: userPost.id,
          p_content: 'This is a sample like notification on your post.'
        })
        notifications.push({ type: 'like', id: likeNotification })
      }

      // Create sample comment notification (if user has posts)
      if (userPost) {
        const commentNotification = await supabase.rpc('create_notification', {
          p_recipient_id: user.id,
          p_actor_id: user.id,
          p_type: 'comment',
          p_post_id: userPost.id,
          p_content: 'This is a sample comment notification on your post.'
        })
        notifications.push({ type: 'comment', id: commentNotification })
      }

      // Create sample mention notification
      const mentionNotification = await supabase.rpc('create_notification', {
        p_recipient_id: user.id,
        p_actor_id: user.id,
        p_type: 'mention',
        p_content: `This is a sample mention notification for @${userProfile.username}.`
      })
      notifications.push({ type: 'mention', id: mentionNotification })

    } catch (notificationError) {
      console.error('Error creating sample notifications:', notificationError)
      return NextResponse.json({
        success: false,
        error: 'Failed to create sample notifications',
        details: notificationError instanceof Error ? notificationError.message : 'Unknown error'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Created ${notifications.length} sample notifications`,
      notifications
    })

  } catch (error) {
    console.error('Error in test notifications:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}