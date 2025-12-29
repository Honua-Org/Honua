import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// GET /api/marketplace/products - Fetch products with filters
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const category = searchParams.get('category')
    const type = searchParams.get('type')
    const search = searchParams.get('search')
    const sort = searchParams.get('sort') || 'created_at'
    const order = searchParams.get('order') || 'desc'
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const location = searchParams.get('location')
    const sustainability = searchParams.get('sustainability') === 'true'
    
    const offset = (page - 1) * limit

    // Build query (temporarily without reviews until marketplace_reviews table is created)
    let query = supabase
      .from('marketplace_products')
      .select(`
        *,
        seller:profiles!marketplace_products_seller_id_fkey (
          id,
          username,
          full_name,
          avatar_url,
          verified
        )
      `)
      .eq('status', 'active')
      .range(offset, offset + limit - 1)

    // Apply filters
    if (category) {
      query = query.eq('category', category)
    }
    
    if (type) {
      query = query.eq('type', type)
    }
    
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,tags.cs.{"${search}"}`)  
    }
    
    if (minPrice) {
      query = query.gte('price', parseFloat(minPrice))
    }
    
    if (maxPrice) {
      query = query.lte('price', parseFloat(maxPrice))
    }
    
    if (location) {
      query = query.ilike('location', `%${location}%`)
    }
    
    if (sustainability) {
      query = query.not('sustainability_features', 'eq', '{}')
    }

    // Apply sorting
    if (sort === 'price_low') {
      query = query.order('price', { ascending: true })
    } else if (sort === 'price_high') {
      query = query.order('price', { ascending: false })
    } else if (sort === 'rating') {
      // Note: This would need a computed column or separate query for accurate rating sorting
      query = query.order('created_at', { ascending: false })
    } else {
      query = query.order(sort, { ascending: order === 'asc' })
    }

    const { data: products, error } = await query

    if (error) {
      console.error('Error fetching products:', error)
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
    }

    // Transform data to include calculated fields (temporarily without reviews)
    const transformedProducts = products?.map(product => {
      return {
        ...product,
        seller: product.seller,
        reviews_count: 0, // Will be populated once reviews table is created
        average_rating: 0  // Will be populated once reviews table is created
      }
    }) || []

    // Get total count for pagination
    let countQuery = supabase
      .from('marketplace_products')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')

    // Apply same filters for count
    if (category) countQuery = countQuery.eq('category', category)
    if (type) countQuery = countQuery.eq('type', type)
    if (search) countQuery = countQuery.or(`title.ilike.%${search}%,description.ilike.%${search}%,tags.cs.{"${search}"}`)
    if (minPrice) countQuery = countQuery.gte('price', parseFloat(minPrice))
    if (maxPrice) countQuery = countQuery.lte('price', parseFloat(maxPrice))
    if (location) countQuery = countQuery.ilike('location', `%${location}%`)
    if (sustainability) countQuery = countQuery.not('sustainability_features', 'eq', '{}')

    const { count, error: countError } = await countQuery

    if (countError) {
      console.error('Error getting product count:', countError)
    }

    return NextResponse.json({
      products: transformedProducts,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    console.error('Error in GET /api/marketplace/products:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/marketplace/products - Create a new product
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
      title,
      description,
      price,
      currency,
      green_points_price,
      category,
      type,
      images,
      location,
      sustainability_features,
      tags,
      shipping_info,
      digital_delivery_info,
      service_duration,
      service_location_type,
      initial_stock,
      low_stock_threshold,
      reorder_point
    } = body

    // Validate required fields
    if (!title || !description || !price || !category || !type) {
      return NextResponse.json(
        { error: 'Title, description, price, category, and type are required' },
        { status: 400 }
      )
    }

    // Validate type
    if (!['physical', 'digital', 'service'].includes(type)) {
      return NextResponse.json(
        { error: 'Type must be physical, digital, or service' },
        { status: 400 }
      )
    }

    // Validate price
    if (price <= 0) {
      return NextResponse.json(
        { error: 'Price must be greater than 0' },
        { status: 400 }
      )
    }

    // Create product
    const { data: product, error } = await supabase
      .from('marketplace_products')
      .insert({
        seller_id: user.id,
        name: title, // Map title to name field
        title,
        description,
        price,
        currency: currency || 'USD',
        green_points_price: green_points_price || Math.round(price * 5),
        category,
        type,
        images: images || [],
        location: type === 'physical' ? location : null,
        sustainability_features: sustainability_features || [],
        tags: tags || [],
        shipping_info: type === 'physical' ? shipping_info : null,
        digital_delivery_info: type === 'digital' ? digital_delivery_info : null,
        service_duration: type === 'service' ? service_duration : null,
        service_location_type: type === 'service' ? service_location_type : null,
        status: 'active'
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating product:', error)
      return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
    }

    // Update product with stock information if it's a physical product
    if (type === 'physical' && initial_stock !== undefined) {
      const { error: stockUpdateError } = await supabase
        .from('marketplace_products')
        .update({
          stock_quantity: initial_stock,
          quantity: initial_stock,
          low_stock_threshold: low_stock_threshold || 5,
        })
        .eq('id', product.id);

      if (stockUpdateError) {
        console.error('Error updating product stock:', stockUpdateError);
        return NextResponse.json(
          { error: 'Failed to update product stock', details: stockUpdateError.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ product }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/marketplace/products:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}