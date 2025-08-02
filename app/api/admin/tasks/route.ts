import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// GET - Fetch all tasks with completion counts
export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Check if user is authenticated and is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // For now, we'll assume any authenticated user can access admin features
    // In production, you should check for admin role in user metadata
    
    // Fetch tasks with completion counts
    const { data: tasks, error } = await supabase
      .from('sustainability_tasks')
      .select(`
        *,
        completion_count:user_task_completions(count)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching tasks:', error)
      return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
    }

    // Transform the data to include completion count as a number
    const tasksWithCounts = tasks?.map(task => ({
      ...task,
      completion_count: task.completion_count?.[0]?.count || 0
    })) || []

    return NextResponse.json({ tasks: tasksWithCounts })
  } catch (error) {
    console.error('Error in GET /api/admin/tasks:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create a new task
export async function POST(request: NextRequest) {
  try {
    // Use service role key for admin operations to bypass RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    if (!supabaseServiceKey) {
      return NextResponse.json({ error: 'Service configuration missing' }, { status: 500 })
    }
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
    
    // Still check user authentication with regular client
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      title,
      description,
      category,
      difficulty,
      points,
      impact_score,
      verification_required
    } = body

    // Validate required fields
    if (!title || !description || !category) {
      return NextResponse.json(
        { error: 'Title, description, and category are required' },
        { status: 400 }
      )
    }

    // Validate difficulty
    if (!['easy', 'medium', 'hard'].includes(difficulty)) {
      return NextResponse.json(
        { error: 'Difficulty must be easy, medium, or hard' },
        { status: 400 }
      )
    }

    // Validate points and impact_score
    if (points < 1 || points > 1000 || impact_score < 1 || impact_score > 1000) {
      return NextResponse.json(
        { error: 'Points and impact score must be between 1 and 1000' },
        { status: 400 }
      )
    }

    // Insert the new task using admin client to bypass RLS
    const { data: task, error } = await supabaseAdmin
      .from('sustainability_tasks')
      .insert({
        title,
        description,
        category,
        difficulty,
        points: parseInt(points),
        impact_score: parseInt(impact_score),
        verification_required: Boolean(verification_required)
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating task:', error)
      return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
    }

    return NextResponse.json({ task }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/admin/tasks:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}