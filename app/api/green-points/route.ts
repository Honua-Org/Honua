import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// GET /api/green-points - Get user's green points balance and recent transactions
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const includeHistory = searchParams.get('include_history') === 'true'
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')

    // Get user's current green points balance
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('green_points')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Error fetching user profile:', profileError)
      return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 })
    }

    const response: any = {
      balance: profile.green_points || 0
    }

    // Include transaction history if requested
    if (includeHistory) {
      const { data: transactions, error: transactionsError } = await supabase
        .rpc('get_green_points_history', {
          user_id: user.id,
          limit_count: limit,
          offset_count: offset
        })

      if (transactionsError) {
        console.error('Error fetching transaction history:', transactionsError)
        // Don't fail the request, just return balance without history
        response.transactions = []
        response.error_message = 'Could not fetch transaction history'
      } else {
        response.transactions = transactions || []
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error in GET /api/green-points:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/green-points - Award green points for various actions
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
      reference_id,
      reference_type,
      description,
      metadata
    } = body

    // Validate required fields
    if (!action_type) {
      return NextResponse.json({ error: 'Action type is required' }, { status: 400 })
    }

    // Get earning rule for this action
    const { data: earningRule, error: ruleError } = await supabase
      .from('green_points_earning_rules')
      .select('*')
      .eq('action_type', action_type)
      .eq('active', true)
      .single()

    if (ruleError || !earningRule) {
      return NextResponse.json({ error: 'Invalid action type or action not configured' }, { status: 400 })
    }

    // Check daily limit if applicable
    if (earningRule.daily_limit) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const { data: todayTransactions, error: dailyError } = await supabase
        .from('green_points_transactions')
        .select('points')
        .eq('user_id', user.id)
        .eq('source', action_type)
        .gte('created_at', today.toISOString())

      if (dailyError) {
        console.error('Error checking daily limit:', dailyError)
        return NextResponse.json({ error: 'Failed to check daily limit' }, { status: 500 })
      }

      const todayPoints = todayTransactions?.reduce((sum, t) => sum + t.points, 0) || 0
      
      if (todayPoints >= earningRule.daily_limit) {
        return NextResponse.json({ 
          error: 'Daily limit reached for this action',
          daily_limit: earningRule.daily_limit,
          earned_today: todayPoints
        }, { status: 429 })
      }

      // Adjust points if it would exceed daily limit
      const remainingPoints = earningRule.daily_limit - todayPoints
      const pointsToAward = Math.min(earningRule.points_per_action, remainingPoints)
      
      if (pointsToAward <= 0) {
        return NextResponse.json({ 
          error: 'Daily limit reached for this action',
          daily_limit: earningRule.daily_limit,
          earned_today: todayPoints
        }, { status: 429 })
      }

      // Award the points
      const { data: result, error: awardError } = await supabase
        .rpc('add_green_points', {
          user_id: user.id,
          points: pointsToAward,
          transaction_type: 'earned',
          source: action_type,
          reference_id: reference_id || null,
          reference_type: reference_type || null,
          description: description || earningRule.description,
          metadata: metadata || null
        })

      if (awardError) {
        console.error('Error awarding green points:', awardError)
        return NextResponse.json({ error: 'Failed to award points' }, { status: 500 })
      }

      return NextResponse.json({
        points_awarded: pointsToAward,
        new_balance: result[0]?.new_balance || 0,
        transaction_id: result[0]?.transaction_id,
        daily_limit_remaining: earningRule.daily_limit - todayPoints - pointsToAward
      })
    } else {
      // No daily limit, award full points
      const { data: result, error: awardError } = await supabase
        .rpc('add_green_points', {
          user_id: user.id,
          points: earningRule.points_per_action,
          transaction_type: 'earned',
          source: action_type,
          reference_id: reference_id || null,
          reference_type: reference_type || null,
          description: description || earningRule.description,
          metadata: metadata || null
        })

      if (awardError) {
        console.error('Error awarding green points:', awardError)
        return NextResponse.json({ error: 'Failed to award points' }, { status: 500 })
      }

      return NextResponse.json({
        points_awarded: earningRule.points_per_action,
        new_balance: result[0]?.new_balance || 0,
        transaction_id: result[0]?.transaction_id
      })
    }
  } catch (error) {
    console.error('Error in POST /api/green-points:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}