import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// GET /api/marketplace/customers - Get customer data and analytics for seller
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    const sellerId = searchParams.get('sellerId')
    const customerId = searchParams.get('customerId')

    if (!sellerId) {
      return NextResponse.json(
        { error: 'Seller ID is required' },
        { status: 400 }
      )
    }

    // If specific customer requested, get their details
    if (customerId) {
      const { data: customerProfile, error: customerError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', customerId)
        .single()

      if (customerError) {
        console.error('Error fetching customer profile:', customerError)
        return NextResponse.json(
          { error: 'Failed to fetch customer profile' },
          { status: 500 }
        )
      }

      // Get customer's purchase history with this seller
      const { data: purchaseHistory, error: purchaseError } = await supabase
        .from('marketplace_orders')
        .select(`
          *,
          marketplace_products!inner(name, seller_id)
        `)
        .eq('customer_id', customerId)
        .eq('marketplace_products.seller_id', sellerId)
        .order('created_at', { ascending: false })

      if (purchaseError) {
        console.error('Error fetching purchase history:', purchaseError)
      }

      // Calculate customer analytics
      const totalOrders = purchaseHistory?.length || 0
      const totalSpent = purchaseHistory?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0
      const lastOrderDate = purchaseHistory?.[0]?.created_at || null

      return NextResponse.json({
        customer: {
          ...customerProfile,
          total_orders: totalOrders,
          total_spent: totalSpent,
          last_order_date: lastOrderDate
        },
        purchaseHistory: purchaseHistory || []
      })
    }

    // Get all customers who have purchased from this seller
    const { data: customerOrders, error: ordersError } = await supabase
      .from('marketplace_orders')
      .select(`
        customer_id,
        total_amount,
        created_at,
        profiles!inner(id, full_name, email, phone, avatar_url, created_at)
      `)
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false })

    if (ordersError) {
      console.error('Error fetching customer orders:', ordersError)
      return NextResponse.json(
        { error: 'Failed to fetch customer data' },
        { status: 500 }
      )
    }

    // Process customer data to get aggregated statistics
    const customerMap = new Map()
    
    customerOrders?.forEach(order => {
      const customerId = order.customer_id
      const customer = Array.isArray(order.profiles) ? order.profiles[0] : order.profiles
      
      if (!customerMap.has(customerId)) {
        customerMap.set(customerId, {
          id: customerId,
          full_name: customer?.full_name,
          email: customer?.email,
          phone: customer?.phone,
          avatar_url: customer?.avatar_url,
          created_at: customer?.created_at,
          total_orders: 0,
          total_spent: 0,
          last_order_date: null,
          first_order_date: null
        })
      }
      
      const customerData = customerMap.get(customerId)
      customerData.total_orders += 1
      customerData.total_spent += order.total_amount || 0
      
      if (!customerData.last_order_date || new Date(order.created_at) > new Date(customerData.last_order_date)) {
        customerData.last_order_date = order.created_at
      }
      
      if (!customerData.first_order_date || new Date(order.created_at) < new Date(customerData.first_order_date)) {
        customerData.first_order_date = order.created_at
      }
    })

    const customers = Array.from(customerMap.values())

    // Get customer analytics using the function we created
    const { data: customerAnalytics, error: analyticsError } = await supabase
      .rpc('get_customer_analytics', {
        seller_id: sellerId
      })

    if (analyticsError) {
      console.error('Error fetching customer analytics:', analyticsError)
    }

    // Calculate summary analytics
    const totalCustomers = customers.length
    const newCustomers = customers.filter(c => {
      const customerSince = new Date(c.first_order_date || c.created_at)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      return customerSince >= thirtyDaysAgo
    }).length

    const totalRevenue = customers.reduce((sum, c) => sum + c.total_spent, 0)
    const totalOrders = customers.reduce((sum, c) => sum + c.total_orders, 0)
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0
    const customerLTV = totalCustomers > 0 ? totalRevenue / totalCustomers : 0
    const repeatRate = customers.filter(c => c.total_orders > 1).length / Math.max(totalCustomers, 1) * 100

    // Get top customers by total spent
    const topCustomers = customers
      .sort((a, b) => b.total_spent - a.total_spent)
      .slice(0, 10)
      .map(customer => ({
        customer_id: customer.id,
        customer_name: customer.full_name,
        total_orders: customer.total_orders,
        total_spent: customer.total_spent
      }))

    // Get all purchase history for this seller
    const { data: allPurchaseHistory, error: allPurchaseError } = await supabase
      .from('marketplace_orders')
      .select(`
        *,
        profiles!inner(full_name, email),
        marketplace_products!inner(name)
      `)
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false })
      .limit(100) // Limit to recent 100 orders

    if (allPurchaseError) {
      console.error('Error fetching all purchase history:', allPurchaseError)
    }

    const processedPurchaseHistory = allPurchaseHistory?.map(order => ({
      id: order.id,
      customer_id: order.customer_id,
      customer_name: order.profiles?.full_name,
      customer_email: order.profiles?.email,
      product_id: order.product_id,
      product_name: order.marketplace_products?.name,
      quantity: order.quantity,
      total_amount: order.total_amount,
      status: order.status,
      created_at: order.created_at
    })) || []

    return NextResponse.json({
      customers,
      analytics: {
        total_customers: totalCustomers,
        new_customers: newCustomers,
        avg_order_value: avgOrderValue,
        customer_ltv: customerLTV,
        repeat_rate: repeatRate,
        top_customers: topCustomers
      },
      purchaseHistory: processedPurchaseHistory,
      summary: {
        total_revenue: totalRevenue,
        total_orders: totalOrders
      }
    })

  } catch (error) {
    console.error('Error in customers API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}