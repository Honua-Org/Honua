import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { status, notes } = await request.json()
    const orderId = params.id

    // Validate status
    const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // Get the order with seller and buyer info
    const { data: order, error: orderError } = await supabase
      .from('marketplace_orders')
      .select(`
        *,
        product:marketplace_products!marketplace_orders_product_id_fkey (
          id,
          title,
          type,
          seller_id
        ),
        buyer:profiles!marketplace_orders_buyer_id_fkey (
          id,
          username,
          full_name,
          email
        ),
        seller:profiles!marketplace_orders_seller_id_fkey (
          id,
          username,
          full_name,
          email
        )
      `)
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Check if user is the seller (only sellers can update order status)
    if (order.seller_id !== user.id) {
      return NextResponse.json({ error: 'Only the seller can update order status' }, { status: 403 })
    }

    // Update order status
    const { data: updatedOrder, error: updateError } = await supabase
      .from('marketplace_orders')
      .update({ 
        order_status: status,
        notes: notes || order.notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select(`
        *,
        product:marketplace_products!marketplace_orders_product_id_fkey (
          id,
          title,
          type
        ),
        buyer:profiles!marketplace_orders_buyer_id_fkey (
          id,
          username,
          full_name,
          email
        ),
        seller:profiles!marketplace_orders_seller_id_fkey (
          id,
          username,
          full_name,
          email
        )
      `)
      .single()

    if (updateError) {
      console.error('Error updating order status:', updateError)
      return NextResponse.json({ error: 'Failed to update order status' }, { status: 500 })
    }

    // Send email notifications based on status
    let emailType = ''
    switch (status) {
      case 'confirmed':
        emailType = 'order_confirmed'
        break
      case 'shipped':
        emailType = 'order_shipped'
        break
      case 'delivered':
        emailType = 'order_received'
        break
      default:
        // No email for other statuses
        break
    }

    if (emailType) {
      try {
        const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/emails/order`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            type: emailType,
            order: {
              id: updatedOrder.id,
              product_title: updatedOrder.product.title,
              quantity: updatedOrder.quantity,
              total_price: updatedOrder.total_price,
              currency: updatedOrder.currency,
              payment_method: updatedOrder.payment_method,
              shipping_address: updatedOrder.product.type === 'physical' ? updatedOrder.shipping_address : null,
              notes: updatedOrder.notes
            },
            buyer: {
              email: updatedOrder.buyer.email,
              name: updatedOrder.buyer.full_name || updatedOrder.buyer.username
            },
            seller: {
              email: updatedOrder.seller.email,
              name: updatedOrder.seller.full_name || updatedOrder.seller.username
            }
          })
        })

        if (!emailResponse.ok) {
          console.error(`Failed to send ${emailType} emails:`, await emailResponse.text())
          // Don't fail the status update for email errors, just log
        }
      } catch (error) {
        console.error(`Error sending ${emailType} emails:`, error)
        // Don't fail the status update for email errors, just log
      }
    }

    return NextResponse.json({ order: updatedOrder }, { status: 200 })
  } catch (error) {
    console.error('Error in PATCH /api/marketplace/orders/[id]/status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}