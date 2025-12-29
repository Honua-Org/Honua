import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// GET /api/marketplace/products/[id] - Get a specific product
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { id } = await params
    const productId = id

    // Get current user for interaction data
    const { data: { user } } = await supabase.auth.getUser()

    // Fetch product with seller info and reviews
    const { data: product, error } = await supabase
      .from('marketplace_products')
      .select(`
        *,
        seller:profiles!marketplace_products_seller_id_fkey (
          id,
          username,
          full_name,
          avatar_url,
          verified,
          created_at
        ),
        reviews:marketplace_reviews!marketplace_reviews_product_id_fkey (
          id,
          rating,
          content,
          created_at,
          verified_purchase,
          reviewer_id
        )
      `)
      .eq('id', productId)
      .eq('status', 'active')
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 })
      }
      console.error('Error fetching product:', error)
      return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 })
    }

    // Calculate average rating and reviews count
    const ratings = product.reviews?.map((r: any) => r.rating) || []
    const averageRating = ratings.length > 0 
      ? ratings.reduce((sum: number, rating: number) => sum + rating, 0) / ratings.length 
      : 0

    // Check if user has liked/bookmarked this product (if authenticated)
    let userInteractions = {
      liked_by_user: false,
      bookmarked_by_user: false
    }

    if (user) {
      const [likesResult, bookmarksResult] = await Promise.all([
        supabase.from('marketplace_likes').select('id').eq('product_id', productId).eq('user_id', user.id).single(),
        supabase.from('marketplace_bookmarks').select('id').eq('product_id', productId).eq('user_id', user.id).single()
      ])

      userInteractions = {
        liked_by_user: !likesResult.error && !!likesResult.data,
        bookmarked_by_user: !bookmarksResult.error && !!bookmarksResult.data
      }
    }

    // Transform the data
    const transformedProduct = {
      ...product,
      reviews_count: ratings.length,
      average_rating: Math.round(averageRating * 10) / 10,
      seller: {
        ...product.seller,
        // Calculate seller stats
        rating: 4.8, // Mock data - in real implementation, calculate from seller's product reviews
        total_sales: 247 // Mock data - in real implementation, count from orders
      },
      ...userInteractions
    }

    return NextResponse.json({ product: transformedProduct })
  } catch (error) {
    console.error('Error in GET /api/marketplace/products/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/marketplace/products/[id] - Update a product
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { id } = await params
    const productId = id
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if product exists and user owns it
    const { data: existingProduct, error: fetchError } = await supabase
      .from('marketplace_products')
      .select('seller_id')
      .eq('id', productId)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 })
      }
      return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 })
    }

    if (existingProduct.seller_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden: You can only update your own products' }, { status: 403 })
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
      stock_quantity,
      status
    } = body

    // Validate required fields if provided
    if (title !== undefined && !title) {
      return NextResponse.json({ error: 'Title cannot be empty' }, { status: 400 })
    }
    if (description !== undefined && !description) {
      return NextResponse.json({ error: 'Description cannot be empty' }, { status: 400 })
    }
    if (price !== undefined && price <= 0) {
      return NextResponse.json({ error: 'Price must be greater than 0' }, { status: 400 })
    }
    if (type !== undefined && !['physical', 'digital', 'service'].includes(type)) {
      return NextResponse.json({ error: 'Type must be physical, digital, or service' }, { status: 400 })
    }
    if (status !== undefined && !['active', 'inactive', 'sold'].includes(status)) {
      return NextResponse.json({ error: 'Status must be active, inactive, or sold' }, { status: 400 })
    }

    // Build update object with only provided fields
    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (price !== undefined) updateData.price = price
    if (currency !== undefined) updateData.currency = currency
    if (green_points_price !== undefined) updateData.green_points_price = green_points_price
    if (category !== undefined) updateData.category = category
    if (type !== undefined) updateData.type = type
    if (images !== undefined) updateData.images = images
    if (location !== undefined) updateData.location = location
    if (sustainability_features !== undefined) updateData.sustainability_features = sustainability_features
    if (tags !== undefined) updateData.tags = tags
    if (shipping_info !== undefined) updateData.shipping_info = shipping_info
    if (digital_delivery_info !== undefined) updateData.digital_delivery_info = digital_delivery_info
    if (service_duration !== undefined) updateData.service_duration = service_duration
    if (service_location_type !== undefined) updateData.service_location_type = service_location_type
    if (stock_quantity !== undefined) updateData.stock_quantity = stock_quantity
    if (status !== undefined) updateData.status = status

    updateData.updated_at = new Date().toISOString()

    // Update product
    const { data: product, error } = await supabase
      .from('marketplace_products')
      .update(updateData)
      .eq('id', productId)
      .select()
      .single()

    if (error) {
      console.error('Error updating product:', error)
      return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
    }

    return NextResponse.json({ product })
  } catch (error) {
    console.error('Error in PUT /api/marketplace/products/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/marketplace/products/[id] - Delete a product
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { id } = await params
    const productId = id
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if product exists and user owns it
    const { data: existingProduct, error: fetchError } = await supabase
      .from('marketplace_products')
      .select('seller_id')
      .eq('id', productId)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 })
      }
      return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 })
    }

    if (existingProduct.seller_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden: You can only delete your own products' }, { status: 403 })
    }

    // Soft delete by setting status to 'deleted'
    const { error } = await supabase
      .from('marketplace_products')
      .update({ 
        status: 'deleted',
        updated_at: new Date().toISOString()
      })
      .eq('id', productId)

    if (error) {
      console.error('Error deleting product:', error)
      return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Product deleted successfully' })
  } catch (error) {
    console.error('Error in DELETE /api/marketplace/products/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}