import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// Helper function to get authenticated user from either cookies or Bearer token
async function getAuthenticatedUser(request: NextRequest) {
  console.log('=== AUTHENTICATION ATTEMPT ===')
  
  // First try Bearer token authentication
  const authHeader = request.headers.get('authorization')
  console.log('Auth header present:', !!authHeader)
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    console.log('Bearer token found, length:', token.length)
    
    try {
      const supabase = createClient(
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
      
      const { data: { user }, error } = await supabase.auth.getUser(token)
      console.log('Bearer auth result:', { hasUser: !!user, error: error?.message })
      
      if (user && !error) {
        console.log('Bearer authentication successful')
        return { user, error: null, supabase }
      } else {
        console.log('Bearer authentication failed:', error?.message)
      }
    } catch (bearerError) {
      console.error('Bearer token authentication error:', bearerError)
    }
  }
  
  // Fallback to cookie-based authentication
  console.log('Attempting cookie-based authentication...')
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error } = await supabase.auth.getUser()
    
    console.log('Cookie auth result:', { hasUser: !!user, error: error?.message })
    
    if (user && !error) {
      console.log('Cookie authentication successful')
      return { user, error: null, supabase }
    }
    
    return { user, error, supabase }
  } catch (cookieError) {
    console.error('Cookie authentication error:', cookieError)
    return { user: null, error: cookieError, supabase: null }
  }
}

// GET /api/marketplace/orders - Get user's orders
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Check authentication with detailed error handling
    const { user, error: authError, supabase } = await getAuthenticatedUser(request)
    if (authError) {
      console.error('Authentication error in orders API:', {
        error: (authError as any)?.message || 'Unknown error',
        code: (authError as any)?.status || 'Unknown status',
        details: authError
      })
      return NextResponse.json({ 
        error: 'Authentication failed', 
        details: (authError as any)?.message || 'Authentication failed'
      }, { status: 401 })
    }
    
    if (!user) {
      console.error('No user found in session')
      return NextResponse.json({ 
        error: 'User not authenticated', 
        details: 'Please log in to access this resource' 
      }, { status: 401 })
    }

    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
    const status = searchParams.get('status') // 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'
    const type = searchParams.get('type') // 'buyer' or 'seller'
    const offset = (page - 1) * limit

    let query = supabase
      .from('marketplace_orders')
      .select(`
        *,
        product:marketplace_products!marketplace_orders_product_id_fkey (
          id,
          title,
          images,
          type,
          seller_id
        ),
        buyer:profiles!marketplace_orders_buyer_id_fkey (
          id,
          username,
          full_name,
          avatar_url
        ),
        seller:profiles!marketplace_orders_seller_id_fkey (
          id,
          username,
          full_name,
          avatar_url,
          email
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Filter by user role (buyer or seller)
    if (type === 'seller') {
      query = query.eq('seller_id', user.id)
    } else {
      query = query.eq('buyer_id', user.id)
    }

    // Filter by status if provided
    if (status) {
      query = query.eq('status', status)
    }

    const { data: orders, error, count } = await query

    if (error) {
      console.error('Error fetching orders:', error)
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
    }

    return NextResponse.json({
      orders: orders || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    console.error('Error in GET /api/marketplace/orders:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/marketplace/orders - Create a new order
export async function POST(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(7)
  
  console.log('=== ORDER CREATION REQUEST RECEIVED ===', {
    requestId,
    timestamp: new Date().toISOString(),
    method: request.method,
    url: request.url,
    headers: {
      'content-type': request.headers.get('content-type'),
      'authorization': request.headers.get('authorization') ? 'Bearer [PRESENT]' : 'None',
      'user-agent': request.headers.get('user-agent'),
      'origin': request.headers.get('origin'),
      'referer': request.headers.get('referer')
    },
    environment: {
      nodeEnv: process.env.NODE_ENV,
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    }
  })

  try {
    // Get authenticated user
    console.log(`[${requestId}] Attempting authentication...`)
    const { user, error: authError, supabase } = await getAuthenticatedUser(request)
    console.log(`[${requestId}] Authentication result:`, {
      authenticated: !!user,
      userId: user?.id,
      userEmail: user?.email,
      hasUser: !!user
    })
    
    if (authError) {
      console.error('Authentication error in orders POST API:', {
        error: (authError as any)?.message || 'Unknown error',
        code: (authError as any)?.status || 'Unknown status',
        details: authError
      })
      return NextResponse.json({ 
        error: 'Authentication failed', 
        details: (authError as any)?.message || 'Authentication failed'
      }, { status: 401 })
    }
    
    if (!user) {
      console.error('No user found in session for order creation')
      return NextResponse.json({ 
        error: 'User not authenticated', 
        details: 'Please log in to create an order' 
      }, { status: 401 })
    }
    console.log('User authenticated:', { userId: user.id, email: user.email })

    console.log(`[${requestId}] Parsing request body...`)
    const body = await request.json()
    console.log(`[${requestId}] Request body parsed:`, {
      fullBody: body,
      bodyStringified: JSON.stringify(body, null, 2),
      hasProductId: !!body.product_id,
      hasPaymentMethod: !!body.payment_method,
      hasQuantity: !!body.quantity,
      paymentMethod: body.payment_method,
      quantity: body.quantity,
      productId: body.product_id,
      bodyKeys: Object.keys(body || {}),
      bodyType: typeof body,
      hasShippingAddress: !!body.shipping_address
    })
    const {
      product_id,
      quantity = 1,
      payment_method, // 'stripe', 'green_points', or 'mixed'
      unit_price,
      total_price,
      green_points_used = 0,
      shipping_address,
      notes
    } = body

    // Validate required fields
    console.log('Validating required fields...')
    if (!product_id) {
      console.error('Validation failed: Missing product_id')
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    if (!payment_method || !['green_points', 'stripe', 'mixed'].includes(payment_method)) {
      console.error('Validation failed: Invalid payment method:', payment_method)
      return NextResponse.json(
        { error: 'Valid payment method is required (green_points, stripe, or mixed)' },
        { status: 400 }
      )
    }

    if (!quantity || quantity < 1) {
      console.error('Validation failed: Invalid quantity:', quantity)
      return NextResponse.json(
        { error: 'Valid quantity is required' },
        { status: 400 }
      )
    }
    console.log('Field validation passed')

    // Get product details
    console.log('Fetching product details for ID:', product_id)
    const { data: product, error: productError } = await supabase
      .from('marketplace_products')
      .select(`
        *,
        seller:profiles!marketplace_products_seller_id_fkey(
          id,
          username,
          full_name
        )
      `)
      .eq('id', product_id)
      .single()

    if (productError || !product) {
      console.error('Product fetch error:', {
        error: productError,
        productId: product_id,
        hasProduct: !!product
      })
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }
    console.log('Product fetched successfully:', {
      productId: product.id,
      title: product.title,
      price: product.price,
      sellerId: product.seller_id,
      type: product.type
    })

    // Check if user is trying to buy their own product
    if (product.seller_id === user.id) {
      return NextResponse.json({ error: 'You cannot purchase your own product' }, { status: 400 })
    }

    // Check stock availability for physical products
    if (product.type === 'physical') {
      const { data: stockCheck, error: stockError } = await supabase
        .rpc('check_stock_availability', {
          p_product_id: product_id,
          p_quantity: quantity
        })

      if (stockError) {
        console.error('Stock check error:', stockError)
        return NextResponse.json({ error: 'Unable to verify stock availability' }, { status: 500 })
      }

      if (!stockCheck) {
        return NextResponse.json({ error: 'Insufficient stock available' }, { status: 400 })
      }
    }

    // Validate pricing based on payment method
    if (payment_method === 'green_points') {
      if (!product.green_points_price) {
        return NextResponse.json({ error: 'This product is not available for green points purchase' }, { status: 400 })
      }
      if (green_points_used !== product.green_points_price * quantity) {
        return NextResponse.json({ error: 'Invalid green points amount' }, { status: 400 })
      }
      
      // Check if user has enough green points
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('green_points')
        .eq('id', user.id)
        .single()
      
      if (!userProfile || userProfile.green_points < green_points_used) {
        return NextResponse.json({ error: 'Insufficient green points' }, { status: 400 })
      }
    } else if (payment_method === 'stripe') {
      if (total_price !== product.price * quantity) {
        return NextResponse.json({ error: 'Invalid total price' }, { status: 400 })
      }
      if (unit_price !== product.price) {
        return NextResponse.json({ error: 'Invalid unit price' }, { status: 400 })
      }
    }

    // Validate shipping address for physical products
    if (product.type === 'physical' && !shipping_address) {
      return NextResponse.json({ error: 'Shipping address is required for physical products' }, { status: 400 })
    }

    // Handle Stripe payment intent creation for non-green-points payments
    let stripe_payment_intent_id = null
    let stripe_client_secret = null
    
    if (payment_method === 'stripe' || payment_method === 'mixed') {
      const stripe_amount = payment_method === 'mixed' ? (total_price - green_points_used) : total_price
      
      if (stripe_amount <= 0) {
        return NextResponse.json({ error: 'Invalid Stripe payment amount' }, { status: 400 })
      }

      console.log('Creating Stripe payment intent directly...', {
        stripeAmount: stripe_amount,
        currency: product.currency || 'USD'
      })
      
      try {
        // Import Stripe directly to avoid internal API call authentication issues
        const Stripe = require('stripe')
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
          apiVersion: '2024-06-20',
        })

        // Validate Stripe credentials
        if (!process.env.STRIPE_SECRET_KEY) {
          console.error('STRIPE_SECRET_KEY environment variable is not set')
          return NextResponse.json({
            error: 'Payment system configuration error'
          }, { status: 500 })
        }

        // Create payment intent for frontend confirmation
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(stripe_amount * 100), // Convert to cents
          currency: (product.currency || 'usd').toLowerCase(),
          metadata: {
            order_id: `temp_${Date.now()}`, // Temporary ID, will be updated after order creation
            user_id: user.id,
            product_name: product.title
          },
          receipt_email: user.email,
          description: `Payment for ${product.title}`,
          automatic_payment_methods: {
            enabled: true,
          },
        })

        stripe_payment_intent_id = paymentIntent.id
        stripe_client_secret = paymentIntent.client_secret
        
        console.log('Stripe payment intent created successfully:', {
          paymentIntentId: stripe_payment_intent_id,
          hasClientSecret: !!stripe_client_secret
        })
      } catch (stripeError: any) {
        console.error('=== STRIPE ERROR DETAILS ===', {
          requestId,
          timestamp: new Date().toISOString(),
          error: stripeError,
          message: stripeError instanceof Error ? stripeError.message : String(stripeError),
          type: stripeError.type,
          code: stripeError.code,
          param: stripeError.param,
          statusCode: stripeError.statusCode,
          stripeRequestId: stripeError.requestId,
          stack: stripeError.stack,
          stripeAccount: stripeError.stripeAccount,
          headers: stripeError.headers,
          rawType: stripeError.rawType,
          charge: stripeError.charge,
          decline_code: stripeError.decline_code,
          payment_intent: stripeError.payment_intent,
          payment_method: stripeError.payment_method,
          setup_intent: stripeError.setup_intent,
          source: stripeError.source,
          environment: {
            hasStripeKey: !!process.env.STRIPE_SECRET_KEY,
            stripeKeyPrefix: process.env.STRIPE_SECRET_KEY?.substring(0, 7),
            nodeEnv: process.env.NODE_ENV
          }
        })
        
        let errorMessage = 'Payment processing failed'
        if (stripeError.type === 'StripeCardError') {
          errorMessage = 'Card error: ' + stripeError.message
        } else if (stripeError.type === 'StripeInvalidRequestError') {
          errorMessage = 'Invalid request: ' + stripeError.message
        } else if (stripeError.type === 'StripeAuthenticationError') {
          errorMessage = 'Authentication error: ' + stripeError.message
        } else if (stripeError.type === 'StripeAPIError') {
          errorMessage = 'API error: ' + stripeError.message
        } else if (stripeError.type === 'StripeConnectionError') {
          errorMessage = 'Connection error: ' + stripeError.message
        } else if (stripeError.type === 'StripeRateLimitError') {
          errorMessage = 'Rate limit error: ' + stripeError.message
        }
        
        return NextResponse.json({
          error: errorMessage,
          details: stripeError.message || 'Unable to create payment intent',
          type: stripeError.type,
          code: stripeError.code,
          param: stripeError.param
        }, { status: 500 })
      }
    }

    // Create order in database
    console.log('Creating order in database...')
    const orderData = {
      product_id,
      buyer_id: user.id,
      seller_id: product.seller_id,
      quantity,
      unit_price: unit_price || 0,
      total_price: total_price || 0,
      currency: product.currency || 'USD',
      green_points_used: green_points_used || 0,
      payment_method,
      payment_status: payment_method === 'stripe' || payment_method === 'mixed' ? 'pending' : 'completed',
      order_status: 'pending',
      shipping_address: product.type === 'physical' ? shipping_address : null,
      stripe_payment_intent_id,
      notes
    }
    
    console.log('Order data prepared:', {
      buyerId: orderData.buyer_id,
      sellerId: orderData.seller_id,
      productId: orderData.product_id,
      quantity: orderData.quantity,
      totalPrice: orderData.total_price,
      paymentMethod: orderData.payment_method,
      hasShippingAddress: !!orderData.shipping_address,
      hasStripePaymentIntent: !!orderData.stripe_payment_intent_id
    })

    const { data: order, error: orderError } = await supabase
      .from('marketplace_orders')
      .insert(orderData)
      .select(`
        *,
        product:marketplace_products!marketplace_orders_product_id_fkey (
          id,
          title,
          images,
          type
        ),
        seller:profiles!marketplace_orders_seller_id_fkey (
          id,
          username,
          full_name,
          avatar_url
        )
      `)
      .single()

    if (orderError) {
      console.error('=== DATABASE ERROR CREATING ORDER ===')
      console.error('Error creating order:', {
        orderError,
        message: orderError.message,
        details: orderError.details,
        hint: orderError.hint,
        code: orderError.code,
        orderData: orderData,
        timestamp: new Date().toISOString()
      })
      console.error('=== END DATABASE ERROR ===')
      
      const errorResponse = {
        error: 'Failed to create order',
        message: orderError.message || 'Database operation failed',
        details: {
          code: orderError.code,
          hint: orderError.hint,
          category: 'database_error',
          timestamp: new Date().toISOString()
        }
      }
      
      return NextResponse.json(errorResponse, { status: 500 })
    }
    
    console.log('Order created successfully:', {
      orderId: order.id,
      orderStatus: order.order_status,
      paymentStatus: order.payment_status
    })

    // If payment is with green points, process through transactions API
    if (payment_method === 'green_points' && green_points_used > 0) {
      // Use the green points transactions API to handle the payment
      const transactionResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/green-points/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          action_type: 'marketplace_purchase',
          points: -green_points_used,
          description: `Purchase of ${product.title}`,
          metadata: { 
            product_id, 
            seller_id: product.seller_id,
            order_type: 'marketplace_purchase'
          }
        })
      })

      if (!transactionResponse.ok) {
        const errorData = await transactionResponse.json()
        // Rollback order creation if points deduction fails
        await supabase.from('marketplace_orders').delete().eq('id', order.id)
        return NextResponse.json({ 
          error: errorData.error || 'Failed to process green points payment' 
        }, { status: transactionResponse.status })
      }
    }

    // Reserve stock for physical products
    if (product.type === 'physical') {
      const { error: reserveError } = await supabase
        .from('marketplace_stock_movements')
        .insert({
          product_id: product_id,
          movement_type: 'reserved',
          quantity: quantity,
          reason: 'Stock reserved for order',
          reference_id: order.id,
          created_by: user.id
        })

      if (reserveError) {
        console.error('Stock reservation error:', reserveError)
        // Note: Order is already created, but stock reservation failed
        // In a production system, you might want to implement compensation logic
      }
    }

    // Award green points to seller (5% of sale value)
    const sellerRewardPoints = Math.floor((total_price || 0) * 0.05)
    if (sellerRewardPoints > 0) {
      try {
        const sellerRewardResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/green-points/transactions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
          },
          body: JSON.stringify({
            action_type: 'marketplace_sale',
            points: sellerRewardPoints,
            description: `Sale reward for ${product.title}`,
            target_user_id: product.seller_id,
            metadata: { 
              product_id, 
              buyer_id: user.id,
              order_id: order.id,
              sale_amount: total_price || 0
            }
          })
        })

        if (!sellerRewardResponse.ok) {
          console.error('Failed to award seller points:', await sellerRewardResponse.text())
          // Don't fail the order for reward errors, just log
        }
      } catch (error) {
        console.error('Error awarding seller points:', error)
        // Don't fail the order for reward errors, just log
      }
    }

    // Update product stock for physical products
    if (product.type === 'physical' && product.stock_quantity !== null) {
      const { error: stockError } = await supabase
        .from('marketplace_products')
        .update({ 
          stock_quantity: product.stock_quantity - quantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', product_id)

      if (stockError) {
        console.error('Error updating stock:', stockError)
        // Note: We don't rollback the order here as the purchase is valid
        // Stock discrepancy can be handled separately
      }
    }

    // Send order placed email notifications
    try {
      const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/emails/order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'order_placed',
          order: {
            id: order.id,
            product_title: product.title,
            quantity,
            total_price,
            currency: product.currency || 'USD',
            payment_method,
            shipping_address: product.type === 'physical' ? shipping_address : null
          },
          buyer: {
            email: user.email,
            name: user.user_metadata?.full_name || user.user_metadata?.username || user.email?.split('@')[0] || 'Customer'
          },
          seller: {
            email: order.seller.email || '',
            name: order.seller.full_name || order.seller.username
          }
        })
      })

      if (!emailResponse.ok) {
        console.error('Failed to send order placed emails:', await emailResponse.text())
        // Don't fail the order for email errors, just log
      }
    } catch (error) {
      console.error('Error sending order placed emails:', error)
      // Don't fail the order for email errors, just log
    }

    // Return order with payment details
    const response: any = { order }
    
    // For Stripe payments, include client secret for frontend payment completion
    if ((payment_method === 'stripe' || payment_method === 'mixed') && stripe_client_secret) {
      response.client_secret = stripe_client_secret
      response.payment_intent_id = stripe_payment_intent_id
      response.requires_payment = true
    }
    


    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    let user, body
    try {
      const authResult = await getAuthenticatedUser(request)
      user = authResult.user
    } catch (e) {
      // Ignore auth errors in error handler
    }
    
    try {
      body = await request.clone().json()
    } catch (e) {
      // Ignore body parsing errors in error handler
    }
    
    const errorDetails = {
      requestId,
      timestamp: new Date().toISOString(),
      userId: user?.id,
      productId: body?.product_id,
      requestBody: body,
      errorType: typeof error,
      errorConstructor: error?.constructor?.name,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
      errorName: error instanceof Error ? error.name : undefined,
      fullError: error,
      requestHeaders: {
        'content-type': request.headers.get('content-type'),
        'authorization': request.headers.get('authorization') ? 'Bearer [REDACTED]' : 'None',
        'user-agent': request.headers.get('user-agent')
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        hasStripeKey: !!process.env.STRIPE_SECRET_KEY
      }
    }
    
    console.error('=== CRITICAL ERROR IN ORDER CREATION ===', errorDetails)
    
    // Also log a simplified version for easier reading
    console.error('=== ERROR SUMMARY ===', {
      requestId,
      message: errorDetails.errorMessage,
      type: errorDetails.errorConstructor,
      userId: errorDetails.userId,
      productId: errorDetails.productId,
      timestamp: errorDetails.timestamp
    })

    // Determine error category and user-friendly message
    let errorCategory = 'unknown'
    let userMessage = 'An unexpected error occurred while processing your order'

    if (error instanceof Error) {
      if (error.message.includes('network') || error.message.includes('fetch')) {
        errorCategory = 'network'
        userMessage = 'Network error occurred. Please check your connection and try again.'
      } else if (error.message.includes('database') || error.message.includes('connection')) {
        errorCategory = 'database'
        userMessage = 'Database error occurred. Please try again later.'
      } else if (error.message.includes('payment') || error.message.includes('stripe')) {
        errorCategory = 'payment'
        userMessage = 'Payment processing error. Please try again or use a different payment method.'
      } else if (error.message.includes('auth') || error.message.includes('unauthorized')) {
        errorCategory = 'authentication'
        userMessage = 'Authentication error. Please log in again.'
      } else if (error.message.includes('validation') || error.message.includes('invalid')) {
        errorCategory = 'validation'
        userMessage = 'Invalid request data. Please check your input and try again.'
      }
    }

    const errorResponse = { 
      error: userMessage,
      category: errorCategory,
      timestamp: new Date().toISOString(),
      debug: process.env.NODE_ENV === 'development' ? {
        originalError: errorDetails.errorMessage,
        errorType: errorDetails.errorConstructor
      } : undefined
    }
    
    console.error('=== SENDING ERROR RESPONSE ===', errorResponse)

    return NextResponse.json(errorResponse, { status: 500 })
  }
}