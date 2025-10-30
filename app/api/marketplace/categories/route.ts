import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// GET /api/marketplace/categories - Get all marketplace categories
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    
    const includeStats = searchParams.get('include_stats') === 'true'
    const type = searchParams.get('type') // Filter by product type: 'physical', 'digital', 'service'

    let query = supabase
      .from('marketplace_categories')
      .select('*')
      .eq('active', true)
      .order('name')

    // Filter by type if provided
    if (type && ['physical', 'digital', 'service'].includes(type)) {
      query = query.contains('applicable_types', [type])
    }

    const { data: categories, error } = await query

    if (error) {
      console.error('Error fetching categories:', error)
      return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
    }

    // If stats are requested, get product counts for each category
    if (includeStats && categories) {
      const categoriesWithStats = await Promise.all(
        categories.map(async (category) => {
          const { count } = await supabase
            .from('marketplace_products')
            .select('*', { count: 'exact', head: true })
            .eq('category', category.slug)
            .eq('status', 'active')

          return {
            ...category,
            product_count: count || 0
          }
        })
      )

      return NextResponse.json({ categories: categoriesWithStats })
    }

    return NextResponse.json({ categories: categories || [] })
  } catch (error) {
    console.error('Error in GET /api/marketplace/categories:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/marketplace/categories - Create a new category (Admin only)
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
      name,
      slug,
      description,
      icon,
      applicable_types = ['physical', 'digital', 'service'],
      active = true
    } = body

    // Validate required fields
    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 })
    }

    // Validate applicable_types
    const validTypes = ['physical', 'digital', 'service']
    if (!Array.isArray(applicable_types) || !applicable_types.every(type => validTypes.includes(type))) {
      return NextResponse.json({ error: 'Invalid applicable_types. Must be array of: physical, digital, service' }, { status: 400 })
    }

    // Check if slug already exists
    const { data: existingCategory } = await supabase
      .from('marketplace_categories')
      .select('id')
      .eq('slug', slug)
      .single()

    if (existingCategory) {
      return NextResponse.json({ error: 'Category with this slug already exists' }, { status: 409 })
    }

    // Create category
    const categoryData = {
      name,
      slug,
      description,
      icon,
      applicable_types,
      active,
      created_at: new Date().toISOString()
    }

    const { data: category, error } = await supabase
      .from('marketplace_categories')
      .insert(categoryData)
      .select()
      .single()

    if (error) {
      console.error('Error creating category:', error)
      return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
    }

    return NextResponse.json({ category }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/marketplace/categories:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}