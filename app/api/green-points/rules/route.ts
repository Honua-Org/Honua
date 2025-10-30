import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// GET /api/green-points/rules - Get all earning rules
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    
    const includeInactive = searchParams.get('include_inactive') === 'true'
    const actionType = searchParams.get('action_type')

    let query = supabase
      .from('green_points_earning_rules')
      .select('*')
      .order('action_type')

    // Filter by active status
    if (!includeInactive) {
      query = query.eq('active', true)
    }

    // Filter by specific action type
    if (actionType) {
      query = query.eq('action_type', actionType)
    }

    const { data: rules, error } = await query

    if (error) {
      console.error('Error fetching earning rules:', error)
      return NextResponse.json({ error: 'Failed to fetch earning rules' }, { status: 500 })
    }

    return NextResponse.json({ rules: rules || [] })
  } catch (error) {
    console.error('Error in GET /api/green-points/rules:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/green-points/rules - Create a new earning rule (Admin only)
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const {
      action_type,
      points_per_action,
      daily_limit,
      description,
      active = true
    } = body

    // Validate required fields
    if (!action_type || !points_per_action || !description) {
      return NextResponse.json({ 
        error: 'Action type, points per action, and description are required' 
      }, { status: 400 })
    }

    if (points_per_action <= 0) {
      return NextResponse.json({ error: 'Points per action must be greater than 0' }, { status: 400 })
    }

    if (daily_limit !== null && daily_limit <= 0) {
      return NextResponse.json({ error: 'Daily limit must be greater than 0 or null' }, { status: 400 })
    }

    // Check if action type already exists
    const { data: existingRule } = await supabase
      .from('green_points_earning_rules')
      .select('id')
      .eq('action_type', action_type)
      .single()

    if (existingRule) {
      return NextResponse.json({ error: 'Earning rule for this action type already exists' }, { status: 409 })
    }

    // Create earning rule
    const ruleData = {
      action_type,
      points_per_action,
      daily_limit,
      description,
      active,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data: rule, error } = await supabase
      .from('green_points_earning_rules')
      .insert(ruleData)
      .select()
      .single()

    if (error) {
      console.error('Error creating earning rule:', error)
      return NextResponse.json({ error: 'Failed to create earning rule' }, { status: 500 })
    }

    return NextResponse.json({ rule }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/green-points/rules:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/green-points/rules - Update earning rules (Admin only)
export async function PUT(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { rules } = body

    if (!Array.isArray(rules) || rules.length === 0) {
      return NextResponse.json({ error: 'Rules array is required' }, { status: 400 })
    }

    // Validate each rule
    for (const rule of rules) {
      if (!rule.id || !rule.action_type || !rule.points_per_action || !rule.description) {
        return NextResponse.json({ 
          error: 'Each rule must have id, action_type, points_per_action, and description' 
        }, { status: 400 })
      }

      if (rule.points_per_action <= 0) {
        return NextResponse.json({ 
          error: `Points per action must be greater than 0 for ${rule.action_type}` 
        }, { status: 400 })
      }

      if (rule.daily_limit !== null && rule.daily_limit <= 0) {
        return NextResponse.json({ 
          error: `Daily limit must be greater than 0 or null for ${rule.action_type}` 
        }, { status: 400 })
      }
    }

    // Update rules
    const updatedRules = []
    for (const rule of rules) {
      const { data: updatedRule, error } = await supabase
        .from('green_points_earning_rules')
        .update({
          points_per_action: rule.points_per_action,
          daily_limit: rule.daily_limit,
          description: rule.description,
          active: rule.active !== undefined ? rule.active : true,
          updated_at: new Date().toISOString()
        })
        .eq('id', rule.id)
        .select()
        .single()

      if (error) {
        console.error(`Error updating rule ${rule.id}:`, error)
        return NextResponse.json({ 
          error: `Failed to update rule for ${rule.action_type}` 
        }, { status: 500 })
      }

      updatedRules.push(updatedRule)
    }

    return NextResponse.json({ rules: updatedRules })
  } catch (error) {
    console.error('Error in PUT /api/green-points/rules:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}