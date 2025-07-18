import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

interface Profile {
  id: string
  username: string
  full_name: string
  avatar_url: string | null
}

interface NotificationData {
  id: string
  type: string
  content: string
  read: boolean
  created_at: string
  post_id: string | null
  comment_id: string | null
  actor_profile: Profile | null
}

// GET /api/notifications - Fetch user's notifications
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const unreadOnly = searchParams.get('unread_only') === 'true'
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('notifications')
      .select(`
        id,
        type,
        content,
        read,
        created_at,
        post_id,
        comment_id,
        actor_id
      `)
      .eq('recipient_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (type && type !== 'all') {
      query = query.eq('type', type)
    }

    if (unreadOnly) {
      query = query.eq('read', false)
    }

    const { data: notifications, error } = await query

    if (error) {
      console.error('Error fetching notifications:', error)
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        hint: error.hint,
        details: error.details
      })
      
      // Check if it's a table not found error
      if (error.code === '42P01' || error.message.includes('relation "notifications" does not exist')) {
        return NextResponse.json({ 
          error: 'Notifications table does not exist. Please run the database setup script.',
          code: 'TABLE_NOT_FOUND'
        }, { status: 500 })
      }
      
      return NextResponse.json({ 
        error: 'Failed to fetch notifications',
        details: error.message
      }, { status: 500 })
    }

    // Fetch actor profiles for all notifications
    const actorIds = notifications ? [...new Set(notifications.map(n => n.actor_id).filter(Boolean))] : []
    
    let actorProfiles: any[] = []
    if (actorIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .in('id', actorIds)
      
      actorProfiles = profiles || []
    }

    // Transform the data to match the expected format
    const transformedNotifications = notifications?.map((notification: any) => {
      const actorProfile = actorProfiles.find(p => p.id === notification.actor_id)
      
      return {
        id: notification.id,
        type: notification.type,
        content: notification.content,
        read: notification.read,
        created_at: notification.created_at,
        user: {
          id: actorProfile?.id || '',
          username: actorProfile?.username || '',
          full_name: actorProfile?.full_name || '',
          avatar_url: actorProfile?.avatar_url || null
        },
        post_preview: null,
        comment_preview: null
      };
    }) || []

    return NextResponse.json({ notifications: transformedNotifications })
  } catch (error) {
    console.error('Error in notifications GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/notifications - Create a new notification
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { recipient_id, type, content, post_id, comment_id } = body

    if (!recipient_id || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Don't create notification for self
    if (recipient_id === user.id) {
      return NextResponse.json({ error: 'Cannot create notification for self' }, { status: 400 })
    }

    // Insert notification directly
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        recipient_id: recipient_id,
        actor_id: user.id,
        type: type,
        content: content,
        post_id: post_id,
        comment_id: comment_id,
        read: false
      })
      .select('id')
      .single()

    if (error) {
      console.error('Error creating notification:', error)
      return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 })
    }

    return NextResponse.json({ notification_id: data.id })
  } catch (error) {
    console.error('Error in notifications POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/notifications - Mark notifications as read
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { notification_ids, mark_all } = body

    let query = supabase
      .from('notifications')
      .update({ read: true })
      .eq('recipient_id', user.id)

    if (mark_all) {
      // Mark all notifications as read
      query = query.eq('read', false)
    } else if (notification_ids && Array.isArray(notification_ids)) {
      // Mark specific notifications as read
      query = query.in('id', notification_ids)
    } else {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const { error } = await query

    if (error) {
      console.error('Error updating notifications:', error)
      return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in notifications PATCH:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}