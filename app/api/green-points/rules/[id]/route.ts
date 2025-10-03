import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// GET /api/green-points/rules/[id] - Get a specific earning rule
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { id } = params

    const { data: rule, error } = await supabase
      .from('green_points_earning_rules')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Earning rule not found' }, { status: 404 })
      }
      console.error('Error fetching earning rule:', error)
      return NextResponse.json({ error: 'Failed to fetch earning rule' }, { status: 500 })
    }

    return NextResponse.json({ rule })
  } catch (error) {
    console.error('Error in GET /api/green-points/rules/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/green-points/rules/[id] - Update a specific earning rule (Admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { id } = params
    
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

    // Check if rule exists
    const { data: existingRule, error: fetchError } = await supabase
      .from('green_points_earning_rules')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Earning rule not found' }, { status: 404 })
      }
      console.error('Error fetching earning rule:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch earning rule' }, { status: 500 })
    }

    const body = await request.json()
    const {
      action_type,
      points_per_action,
      daily_limit,
      description,
      active
    } = body

    // Validate required fields
    if (points_per_action !== undefined && points_per_action <= 0) {
      return NextResponse.json({ error: 'Points per action must be greater than 0' }, { status: 400 })
    }

    if (daily_limit !== undefined && daily_limit !== null && daily_limit <= 0) {
      return NextResponse.json({ error: 'Daily limit must be greater than 0 or null' }, { status: 400 })
    }

    // Check if action type already exists (if being changed)
    if (action_type && action_type !== existingRule.action_type) {
      const { data: duplicateRule } = await supabase
        .from('green_points_earning_rules')
        .select('id')
        .eq('action_type', action_type)
        .neq('id', id)
        .single()

      if (duplicateRule) {
        return NextResponse.json({ error: 'Earning rule for this action type already exists' }, { status: 409 })
      }
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (action_type !== undefined) updateData.action_type = action_type
    if (points_per_action !== undefined) updateData.points_per_action = points_per_action
    if (daily_limit !== undefined) updateData.daily_limit = daily_limit
    if (description !== undefined) updateData.description = description
    if (active !== undefined) updateData.active = active

    // Update earning rule
    const { data: rule, error } = await supabase
      .from('green_points_earning_rules')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating earning rule:', error)
      return NextResponse.json({ error: 'Failed to update earning rule' }, { status: 500 })
    }

    return NextResponse.json({ rule })
  } catch (error) {
    console.error('Error in PUT /api/green-points/rules/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/green-points/rules/[id] - Delete a specific earning rule (Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { id } = params
    
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

    // Check if rule exists
    const { data: existingRule, error: fetchError } = await supabase
      .from('green_points_earning_rules')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Earning rule not found' }, { status: 404 })
      }
      console.error('Error fetching earning rule:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch earning rule' }, { status: 500 })
    }

    // Delete earning rule
    const { error } = await supabase
      .from('green_points_earning_rules')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting earning rule:', error)
      return NextResponse.json({ error: 'Failed to delete earning rule' }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'Earning rule deleted successfully',
      deleted_rule: existingRule
    })
  } catch (error) {
    console.error('Error in DELETE /api/green-points/rules/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}