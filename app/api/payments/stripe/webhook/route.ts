import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')!

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message)
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      )
    }

    console.log('Stripe webhook event received:', event.type)

    const supabase = createRouteHandlerClient({ cookies })

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.log('Payment succeeded:', paymentIntent.id)
        
        // Update order status in database
        const orderId = paymentIntent.metadata.order_id
        if (orderId) {
          const { error: updateError } = await supabase
            .from('marketplace_orders')
            .update({
              payment_status: 'completed',
              stripe_payment_intent_id: paymentIntent.id,
              updated_at: new Date().toISOString()
            })
            .eq('id', orderId)

          if (updateError) {
            console.error('Error updating order status:', updateError)
          } else {
            console.log('Order status updated successfully for order:', orderId)
          }
        }
        break

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object as Stripe.PaymentIntent
        console.log('Payment failed:', failedPayment.id)
        
        // Update order status to failed
        const failedOrderId = failedPayment.metadata.order_id
        if (failedOrderId) {
          const { error: failedUpdateError } = await supabase
            .from('marketplace_orders')
            .update({
              payment_status: 'failed',
              stripe_payment_intent_id: failedPayment.id,
              updated_at: new Date().toISOString()
            })
            .eq('id', failedOrderId)

          if (failedUpdateError) {
            console.error('Error updating failed order status:', failedUpdateError)
          }
        }
        break

      case 'payment_intent.canceled':
        const canceledPayment = event.data.object as Stripe.PaymentIntent
        console.log('Payment canceled:', canceledPayment.id)
        
        // Update order status to canceled
        const canceledOrderId = canceledPayment.metadata.order_id
        if (canceledOrderId) {
          const { error: canceledUpdateError } = await supabase
            .from('marketplace_orders')
            .update({
              payment_status: 'canceled',
              stripe_payment_intent_id: canceledPayment.id,
              updated_at: new Date().toISOString()
            })
            .eq('id', canceledOrderId)

          if (canceledUpdateError) {
            console.error('Error updating canceled order status:', canceledUpdateError)
          }
        }
        break

      default:
        console.log('Unhandled event type:', event.type)
    }

    return NextResponse.json({ received: true })

  } catch (error: any) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed', details: error.message },
      { status: 500 }
    )
  }
}
