import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/achievements - Get all achievements or user-specific achievements
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const category = searchParams.get('category')

    if (userId) {
      // Get user's achievements
      const { data: userAchievements, error } = await supabase
        .from('user_achievements')
        .select(`
          earned_at,
          achievements (
            id,
            name,
            description,
            icon,
            category,
            points,
            requirements
          )
        `)
        .eq('user_id', userId)
        .order('earned_at', { ascending: false })

      if (error) {
        console.error('Error fetching user achievements:', error)
        return NextResponse.json(
          { error: 'Failed to fetch achievements' },
          { status: 500 }
        )
      }

      return NextResponse.json({ achievements: userAchievements })
    } else {
      // Get all achievements
      let query = supabase
        .from('achievements')
        .select('*')
        .order('category', { ascending: true })
        .order('points', { ascending: true })

      if (category) {
        query = query.eq('category', category)
      }

      const { data: achievements, error } = await query

      if (error) {
        console.error('Error fetching achievements:', error)
        return NextResponse.json(
          { error: 'Failed to fetch achievements' },
          { status: 500 }
        )
      }

      return NextResponse.json({ achievements })
    }
  } catch (error) {
    console.error('Error in achievements GET:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/achievements - Create a new achievement (admin only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      description,
      icon,
      category,
      points,
      requirements
    } = body

    if (!name || !description || !icon || !category) {
      return NextResponse.json(
        { error: 'Name, description, icon, and category are required' },
        { status: 400 }
      )
    }

    const validCategories = ['sustainability', 'community', 'content', 'engagement', 'impact']
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: 'Invalid category' },
        { status: 400 }
      )
    }

    const { data: achievement, error } = await supabase
      .from('achievements')
      .insert({
        name,
        description,
        icon,
        category,
        points: points || 0,
        requirements: requirements || {}
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating achievement:', error)
      return NextResponse.json(
        { error: 'Failed to create achievement' },
        { status: 500 }
      )
    }

    return NextResponse.json({ achievement }, { status: 201 })
  } catch (error) {
    console.error('Error in achievements POST:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}