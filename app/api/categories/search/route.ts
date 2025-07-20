import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const limit = parseInt(searchParams.get('limit') || '20')

    if (!query) {
      return NextResponse.json({ categories: [] })
    }

    const supabase = createClient()

    // Search for categories by name or description
    const { data: categories, error } = await supabase
      .from('categories')
      .select(`
        id,
        name,
        description,
        icon,
        color,
        posts_count
      `)
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .order('posts_count', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error searching categories:', error)
      return NextResponse.json({ error: 'Failed to search categories' }, { status: 500 })
    }

    return NextResponse.json({ categories: categories || [] })
  } catch (error) {
    console.error('Error in category search:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}