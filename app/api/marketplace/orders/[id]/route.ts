import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const orderId = params.id

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch order with product and seller details
    const { data: order, error: orderError } = await supabase
      .from('marketplace_orders')
      .select(`
        *,
        product:marketplace_products!marketplace_orders_product_id_fkey (
          id,
          title,
          description,
          price,
          currency,
          green_points_price,
          type,
          category,
          images,
          seller_profile:profiles!marketplace_products_seller_id_fkey (
            id,
            username,
            full_name,
            avatar_url
          )
        )
      `)
      .eq('id', orderId)
      .single()

    if (orderError) {
      console.error('Error fetching order:', orderError)
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Check if user is authorized to view this order (buyer or seller)
    if (order.buyer_id !== user.id && order.seller_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized to view this order' }, { status: 403 })
    }

    return NextResponse.json({ order }, { status: 200 })
  } catch (error) {
    console.error('Error in GET /api/marketplace/orders/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Update order status (for sellers)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const orderId = params.id
    const body = await request.json()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { order_status, payment_status, tracking_number, notes } = body

    // First, get the order to check permissions
    const { data: existingOrder, error: fetchError } = await supabase
      .from('marketplace_orders')
      .select('seller_id, buyer_id, order_status')
      .eq('id', orderId)
      .single()

    if (fetchError) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Check permissions - only seller can update order status, buyer can cancel pending orders
    const canUpdate = existingOrder.seller_id === user.id || 
                     (existingOrder.buyer_id === user.id && order_status === 'cancelled' && existingOrder.order_status === 'pending')
    
    if (!canUpdate) {
      return NextResponse.json({ error: 'Unauthorized to update this order' }, { status: 403 })
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (order_status) updateData.order_status = order_status
    if (payment_status) updateData.payment_status = payment_status
    if (tracking_number) updateData.tracking_number = tracking_number
    if (notes) updateData.notes = notes

    // Update the order
    const { data: updatedOrder, error: updateError } = await supabase
      .from('marketplace_orders')
      .update(updateData)
      .eq('id', orderId)
      .select(`
        *,
        product:marketplace_products!marketplace_orders_product_id_fkey (
          id,
          title,
          description,
          price,
          currency,
          green_points_price,
          type,
          category,
          images,
          seller_profile:profiles!marketplace_products_seller_id_fkey (
            id,
            username,
            full_name,
            avatar_url
          )
        )
      `)
      .single()

    if (updateError) {
      console.error('Error updating order:', updateError)
      return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
    }

    return NextResponse.json({ order: updatedOrder }, { status: 200 })
  } catch (error) {
    console.error('Error in PATCH /api/marketplace/orders/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}