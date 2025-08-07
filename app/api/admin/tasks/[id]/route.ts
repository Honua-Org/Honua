import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// PUT - Update a task
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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

    const taskId = params.id
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

    // Check if task exists
    const { data: existingTask, error: fetchError } = await supabase
      .from('sustainability_tasks')
      .select('id')
      .eq('id', taskId)
      .single()

    if (fetchError || !existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Update the task using admin client to bypass RLS
    const { data: task, error } = await supabaseAdmin
      .from('sustainability_tasks')
      .update({
        title,
        description,
        category,
        difficulty,
        points: parseInt(points),
        impact_score: parseInt(impact_score),
        verification_required: Boolean(verification_required)
      })
      .eq('id', taskId)
      .select()
      .single()

    if (error) {
      console.error('Error updating task:', error)
      return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
    }

    return NextResponse.json({ task })
  } catch (error) {
    console.error('Error in PUT /api/admin/tasks/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete a task
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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

    const taskId = params.id

    // Check if task exists
    const { data: existingTask, error: fetchError } = await supabase
      .from('sustainability_tasks')
      .select('id, title')
      .eq('id', taskId)
      .single()

    if (fetchError || !existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Check if task has completions (optional: you might want to prevent deletion of completed tasks)
    const { data: completions, error: completionsError } = await supabase
      .from('user_task_completions')
      .select('id')
      .eq('task_id', taskId)
      .limit(1)

    if (completionsError) {
      console.error('Error checking task completions:', completionsError)
      // Continue with deletion even if we can't check completions
    }

    // If you want to prevent deletion of tasks with completions, uncomment this:
    // if (completions && completions.length > 0) {
    //   return NextResponse.json(
    //     { error: 'Cannot delete task that has been completed by users' },
    //     { status: 400 }
    //   )
    // }

    // Delete the task using admin client to bypass RLS (this will cascade delete related completions if foreign key is set up)
    const { error } = await supabaseAdmin
      .from('sustainability_tasks')
      .delete()
      .eq('id', taskId)

    if (error) {
      console.error('Error deleting task:', error)
      return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Task deleted successfully' })
  } catch (error) {
    console.error('Error in DELETE /api/admin/tasks/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET - Get a specific task
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
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

    const taskId = params.id

    // Fetch the task with completion count using admin client
    const { data: task, error } = await supabaseAdmin
      .from('sustainability_tasks')
      .select(`
        *,
        completion_count:user_task_completions(count)
      `)
      .eq('id', taskId)
      .single()

    if (error || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Transform the data to include completion count as a number
    const taskWithCount = {
      ...task,
      completion_count: task.completion_count?.[0]?.count || 0
    }

    return NextResponse.json({ task: taskWithCount })
  } catch (error) {
    console.error('Error in GET /api/admin/tasks/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}