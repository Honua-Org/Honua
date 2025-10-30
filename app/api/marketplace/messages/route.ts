import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('product_id')
    const orderId = searchParams.get('order_id')
    const otherUserId = searchParams.get('other_user_id')

    let query = supabase
      .from('marketplace_messages')
      .select(`
        *,
        sender:profiles!sender_id (
          id,
          username,
          full_name,
          avatar_url
        ),
        product:marketplace_products!product_id (
          id,
          title,
          price,
          images
        ),
        order:marketplace_orders!order_id (
          id,
          order_number,
          status
        )
      `)
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .order('created_at', { ascending: true })

    if (productId) {
      query = query.eq('product_id', productId)
    }

    if (orderId) {
      query = query.eq('order_id', orderId)
    }

    if (otherUserId) {
      query = query.or(`sender_id.eq.${otherUserId},recipient_id.eq.${otherUserId}`)
    }

    const { data: messages, error } = await query

    if (error) {
      console.error('Error fetching marketplace messages:', error)
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
    }

    return NextResponse.json({ messages })
  } catch (error) {
    console.error('Error in marketplace messages GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { recipient_id, content, product_id, order_id, message_type = 'text' } = body

    if (!recipient_id || !content) {
      return NextResponse.json({ error: 'Recipient ID and content are required' }, { status: 400 })
    }

    // Verify recipient exists
    const { data: recipient, error: recipientError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', recipient_id)
      .single()

    if (recipientError || !recipient) {
      return NextResponse.json({ error: 'Recipient not found' }, { status: 404 })
    }

    // If product_id is provided, verify the user has permission to message about this product
    if (product_id) {
      const { data: product, error: productError } = await supabase
        .from('marketplace_products')
        .select('seller_id')
        .eq('id', product_id)
        .single()

      if (productError || !product) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 })
      }

      // User must be either the seller or a potential buyer
      if (product.seller_id !== user.id && product.seller_id !== recipient_id) {
        return NextResponse.json({ error: 'Unauthorized to message about this product' }, { status: 403 })
      }
    }

    // If order_id is provided, verify the user is part of the order
    if (order_id) {
      const { data: order, error: orderError } = await supabase
        .from('marketplace_orders')
        .select('buyer_id, seller_id')
        .eq('id', order_id)
        .single()

      if (orderError || !order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 })
      }

      // User must be either the buyer or seller of the order
      if (order.buyer_id !== user.id && order.seller_id !== user.id) {
        return NextResponse.json({ error: 'Unauthorized to message about this order' }, { status: 403 })
      }
    }

    // Create the message
    const { data: message, error } = await supabase
      .from('marketplace_messages')
      .insert({
        sender_id: user.id,
        recipient_id,
        content,
        product_id,
        order_id,
        message_type
      })
      .select(`
        *,
        sender:profiles!sender_id (
          id,
          username,
          full_name,
          avatar_url
        ),
        product:marketplace_products!product_id (
          id,
          title,
          price,
          images
        ),
        order:marketplace_orders!order_id (
          id,
          order_number,
          status
        )
      `)
      .single()

    if (error) {
      console.error('Error creating marketplace message:', error)
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
    }

    return NextResponse.json({ message }, { status: 201 })
  } catch (error) {
    console.error('Error in marketplace messages POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}