import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// Add CORS headers to prevent ERR_ABORTED errors
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

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

// OPTIONS handler for CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 200, headers: corsHeaders })
}

// GET /api/notifications - Fetch user's notifications
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const countOnly = searchParams.get('count_only') === 'true'
    
    // If count_only is requested, return a simple count without authentication for now
    if (countOnly) {
      return NextResponse.json({ count: 0 }, { headers: corsHeaders })
    }
    
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get user session first
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session?.user) {
      console.log('Authentication failed in notifications API:', sessionError?.message || 'No session')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders })
    }
    
    const user = session.user

    const tab = searchParams.get('tab') || 'all'
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const recipientId = searchParams.get('recipient_id')
    const readFilter = searchParams.get('read')

    // Use recipient_id from query params if provided, otherwise use authenticated user's id
    const targetRecipientId = recipientId || user.id
    
    // If count_only is not requested, use a full query
    let query = supabase
      .from('notifications')
      .select(`
        *,
        actor:profiles!actor_id(
          id,
          username,
          full_name,
          avatar_url
        ),
        post:posts(
          id,
          content,
          media_urls
        )
      `)
      .eq('recipient_id', targetRecipientId)
    
    if (!countOnly) {
      query = query.order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)
    }

    // Filter by read status if specified
    if (readFilter !== null) {
      query = query.eq('read', readFilter === 'true')
    }
    
    // Filter by tab
    if (tab === 'unread') {
      query = query.eq('read', false)
    } else if (tab === 'likes') {
      query = query.eq('type', 'like')
    } else if (tab === 'follows') {
      query = query.eq('type', 'follow')
    }

    const { data: notifications, error, count } = await query

    if (error) {
      console.error('Error fetching notifications:', error)
      
      // Check if the error is because the table doesn't exist
      if (error.message.includes('relation "notifications" does not exist') || 
          error.message.includes('table "notifications" does not exist')) {
        return NextResponse.json({ 
          error: 'Notifications table not found',
          message: 'The notifications table has not been set up yet. Please contact an administrator.',
          setupRequired: true
        }, { status: 503, headers: corsHeaders })
      }
      
      // Check for permission errors
      if (error.message.includes('permission denied') || error.message.includes('insufficient_privilege')) {
        return NextResponse.json({ 
          error: 'Permission denied',
          message: 'You do not have permission to access notifications. Please contact an administrator.',
          permissionError: true
        }, { status: 403 })
      }
      
      return NextResponse.json({ 
        error: 'Failed to fetch notifications',
        details: error.message
      }, { status: 500, headers: corsHeaders })
    }

    // If count_only is requested, return just the count
    if (countOnly) {
      return NextResponse.json({ count: count || 0 }, { headers: corsHeaders })
    }
    
    // Transform the data to match frontend interface
    const transformedNotifications = (notifications || []).map(notification => ({
      id: (notification as any).id,
      type: (notification as any).type,
      content: (notification as any).content,
      read: (notification as any).read,
      created_at: (notification as any).created_at,
      post_preview: (notification as any).post?.content,
      comment_preview: (notification as any).comment_id ? (notification as any).content : undefined,
      user: {
        id: (notification as any).actor?.id,
        username: (notification as any).actor?.username,
        full_name: (notification as any).actor?.full_name,
        avatar_url: (notification as any).actor?.avatar_url
      }
    }))

    return NextResponse.json({ notifications: transformedNotifications }, { headers: corsHeaders })
  } catch (error) {
    console.error('Error in notifications GET:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// POST /api/notifications - Create a new notification
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders })
    }

    const body = await request.json()
    const { recipient_id, type, content, post_id, comment_id } = body

    if (!recipient_id || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400, headers: corsHeaders })
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

    return NextResponse.json({ notification_id: data.id }, { headers: corsHeaders })
  } catch (error) {
    console.error('Error in notifications POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: corsHeaders })
  }
}

// PATCH /api/notifications - Mark notifications as read
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders })
    }

    const body = await request.json()
    const { notificationId, markAllAsRead } = body

    if (markAllAsRead) {
      // Mark all notifications as read for the current user
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('recipient_id', user.id)
        .eq('read', false)

      if (error) {
        console.error('Error marking all notifications as read:', error)
        
        // Check if the error is because the table doesn't exist
        if (error.message.includes('relation "notifications" does not exist') || 
            error.message.includes('table "notifications" does not exist')) {
          return NextResponse.json({ 
            error: 'Notifications table does not exist. Please set up the notifications system first.',
            setupRequired: true,
            instructions: 'Contact your administrator to set up the notifications table or visit /api/setup-notifications'
          }, { status: 503 })
        }
        
        // Check for permission errors
        if (error.message.includes('permission denied') || error.message.includes('insufficient_privilege')) {
          return NextResponse.json({ 
            error: 'Permission denied. Please contact your administrator.',
            permissionError: true
          }, { status: 403 })
        }
        
        return NextResponse.json({ 
          error: 'Internal server error',
          message: error.message
        }, { status: 500, headers: corsHeaders })
      }

      return NextResponse.json({ success: true }, { headers: corsHeaders })
    } else if (notificationId) {
      // Mark specific notification as read
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
        .eq('recipient_id', user.id)

      if (error) {
        console.error('Error marking notification as read:', error)
        
        // Check if the error is because the table doesn't exist
        if (error.message.includes('relation "notifications" does not exist') || 
            error.message.includes('table "notifications" does not exist')) {
          return NextResponse.json({ 
            error: 'Notifications table does not exist. Please set up the notifications system first.',
            setupRequired: true,
            instructions: 'Contact your administrator to set up the notifications table or visit /api/setup-notifications'
          }, { status: 503 })
        }
        
        // Check for permission errors
        if (error.message.includes('permission denied') || error.message.includes('insufficient_privilege')) {
          return NextResponse.json({ 
            error: 'Permission denied. Please contact your administrator.',
            permissionError: true
          }, { status: 403 })
        }
        
        return NextResponse.json({ 
          error: 'Internal server error',
          message: error.message
        }, { status: 500 })
      }

      return NextResponse.json({ success: true }, { headers: corsHeaders })
    } else {
      return NextResponse.json({ error: 'Invalid request body. Provide either notificationId or markAllAsRead.' }, { status: 400, headers: corsHeaders })
    }
  } catch (error) {
    console.error('Error in notifications PATCH:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}