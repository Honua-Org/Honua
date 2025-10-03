import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// GET /api/green-points/transactions - Get user's green points transaction history
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const transactionType = searchParams.get('type') // 'earned' or 'spent'
    const actionType = searchParams.get('action_type')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')

    let query = supabase
      .from('green_points_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Filter by transaction type
    if (transactionType === 'earned') {
      query = query.gt('points', 0)
    } else if (transactionType === 'spent') {
      query = query.lt('points', 0)
    }

    // Filter by action type
    if (actionType) {
      query = query.eq('action_type', actionType)
    }

    // Filter by date range
    if (startDate) {
      query = query.gte('created_at', startDate)
    }
    if (endDate) {
      query = query.lte('created_at', endDate)
    }

    const { data: transactions, error } = await query

    if (error) {
      console.error('Error fetching transactions:', error)
      return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('green_points_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if (transactionType === 'earned') {
      countQuery = countQuery.gt('points', 0)
    } else if (transactionType === 'spent') {
      countQuery = countQuery.lt('points', 0)
    }

    if (actionType) {
      countQuery = countQuery.eq('action_type', actionType)
    }

    if (startDate) {
      countQuery = countQuery.gte('created_at', startDate)
    }
    if (endDate) {
      countQuery = countQuery.lte('created_at', endDate)
    }

    const { count, error: countError } = await countQuery

    if (countError) {
      console.error('Error counting transactions:', countError)
    }

    return NextResponse.json({
      transactions: transactions || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        has_more: (count || 0) > offset + limit
      }
    })
  } catch (error) {
    console.error('Error in GET /api/green-points/transactions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/green-points/transactions - Award points for marketplace activities
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      action_type,
      points,
      description,
      metadata = {},
      target_user_id // Optional: for admin awarding points to other users
    } = body

    // Validate required fields
    if (!action_type || !points || !description) {
      return NextResponse.json({ 
        error: 'Action type, points, and description are required' 
      }, { status: 400 })
    }

    if (typeof points !== 'number') {
      return NextResponse.json({ error: 'Points must be a number' }, { status: 400 })
    }

    // Determine the recipient user ID
    let recipientUserId = user.id
    
    // If target_user_id is provided, check if current user is admin
    if (target_user_id && target_user_id !== user.id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (!profile || profile.role !== 'admin') {
        return NextResponse.json({ 
          error: 'Forbidden: Admin access required to award points to other users' 
        }, { status: 403 })
      }

      recipientUserId = target_user_id
    }

    // For positive points (earning), check daily limits and earning rules
    if (points > 0) {
      // Get earning rule for this action type
      const { data: earningRule } = await supabase
        .from('green_points_earning_rules')
        .select('*')
        .eq('action_type', action_type)
        .eq('active', true)
        .single()

      if (!earningRule) {
        return NextResponse.json({ 
          error: `No active earning rule found for action type: ${action_type}` 
        }, { status: 400 })
      }

      // Check if points match the earning rule (unless admin override)
      if (target_user_id !== recipientUserId || points !== earningRule.points_per_action) {
        // Allow admin to override points amount
        const { data: adminProfile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        if (!adminProfile || adminProfile.role !== 'admin') {
          return NextResponse.json({ 
            error: `Points amount must match earning rule: ${earningRule.points_per_action} points for ${action_type}` 
          }, { status: 400 })
        }
      }

      // Check daily limit if applicable
      if (earningRule.daily_limit) {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)

        const { data: todayTransactions } = await supabase
          .from('green_points_transactions')
          .select('points')
          .eq('user_id', recipientUserId)
          .eq('action_type', action_type)
          .gte('created_at', today.toISOString())
          .lt('created_at', tomorrow.toISOString())

        const todayTotal = todayTransactions?.reduce((sum, t) => sum + (t.points > 0 ? t.points : 0), 0) || 0
        
        if (todayTotal + points > earningRule.daily_limit) {
          return NextResponse.json({ 
            error: `Daily limit exceeded for ${action_type}. Limit: ${earningRule.daily_limit}, Today's total: ${todayTotal}` 
          }, { status: 400 })
        }
      }
    }

    // For negative points (spending), check if user has enough balance
    if (points < 0) {
      const { data: currentBalance, error: balanceError } = await supabase
        .rpc('get_green_points_balance', { target_user_id: recipientUserId })

      if (balanceError) {
        console.error('Error checking balance:', balanceError)
        return NextResponse.json({ error: 'Failed to check balance' }, { status: 500 })
      }

      if (currentBalance + points < 0) {
        return NextResponse.json({ 
          error: `Insufficient balance. Current: ${currentBalance}, Required: ${Math.abs(points)}` 
        }, { status: 400 })
      }
    }

    // Award/deduct points using the RPC function
    const { data: result, error: awardError } = await supabase
      .rpc('add_green_points', {
        target_user_id: recipientUserId,
        points_amount: points,
        action_type,
        description,
        metadata
      })

    if (awardError) {
      console.error('Error awarding points:', awardError)
      return NextResponse.json({ error: 'Failed to process points transaction' }, { status: 500 })
    }

    // Get the created transaction
    const { data: transaction } = await supabase
      .from('green_points_transactions')
      .select('*')
      .eq('user_id', recipientUserId)
      .eq('action_type', action_type)
      .eq('points', points)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    // Get updated balance
    const { data: newBalance } = await supabase
      .rpc('get_green_points_balance', { target_user_id: recipientUserId })

    return NextResponse.json({
      transaction,
      new_balance: newBalance || 0,
      message: points > 0 ? 'Points awarded successfully' : 'Points deducted successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/green-points/transactions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}