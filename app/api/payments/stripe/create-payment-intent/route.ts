import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
})

export async function POST(request: NextRequest) {
  try {
    console.log('=== STRIPE PAYMENT INTENT CREATION ===')
    
    // Try Bearer token authentication first
    const authHeader = request.headers.get('authorization')
    let supabase
    let user
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      console.log('Using Bearer token authentication for Stripe API')
      
      supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          },
          global: {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        }
      )
      
      const { data: { user: bearerUser }, error: bearerError } = await supabase.auth.getUser(token)
      if (bearerUser && !bearerError) {
        user = bearerUser
        console.log('Bearer authentication successful for Stripe API')
      } else {
        console.log('Bearer authentication failed for Stripe API:', bearerError?.message)
      }
    }
    
    // Fallback to cookie-based authentication
    if (!user) {
      console.log('Falling back to cookie authentication for Stripe API')
      supabase = createRouteHandlerClient({ cookies })
      const { data: { user: cookieUser }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !cookieUser) {
        console.error('Authentication error in Stripe API:', userError)
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }
      user = cookieUser
    }

    const body = await request.json()
    const { 
      amount, 
      currency = 'usd', 
      order_id, 
      customer_email,
      customer_name,
      product_name 
    } = body

    // Validate required fields
    if (!amount || !order_id) {
      return NextResponse.json(
        { error: 'Amount and order_id are required' },
        { status: 400 }
      )
    }

    // Validate Stripe credentials
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('STRIPE_SECRET_KEY environment variable is not set')
      return NextResponse.json(
        { error: 'Payment system configuration error' },
        { status: 500 }
      )
    }

    console.log('Creating Stripe payment intent with:', {
      amount,
      currency,
      order_id,
      customer_email: customer_email ? '[REDACTED]' : 'not provided'
    })

    // Create payment intent with manual confirmation for 3D Secure support
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      confirmation_method: 'manual',
      metadata: {
        order_id: order_id.toString(),
        user_id: user.id,
        product_name: product_name || 'Marketplace Product'
      },
      receipt_email: customer_email,
      description: `Payment for order ${order_id}${product_name ? ` - ${product_name}` : ''}`,
      automatic_payment_methods: {
        enabled: true,
      },
    })

    console.log('Stripe payment intent created:', paymentIntent.id)

    return NextResponse.json({
      success: true,
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency
    })

  } catch (error: any) {
    console.error('Error creating Stripe payment intent:', error)
    
    if (error.type === 'StripeCardError') {
      return NextResponse.json(
        { error: 'Card error: ' + error.message },
        { status: 400 }
      )
    }
    
    if (error.type === 'StripeInvalidRequestError') {
      return NextResponse.json(
        { error: 'Invalid request: ' + error.message },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Payment intent creation failed', details: error.message },
      { status: 500 }
    )
  }
}