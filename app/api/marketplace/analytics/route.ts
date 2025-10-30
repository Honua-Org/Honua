import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// GET /api/marketplace/analytics - Get real-time analytics data for seller
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    const sellerId = searchParams.get('sellerId')
    const timeRange = searchParams.get('timeRange') || '30d'

    if (!sellerId) {
      return NextResponse.json(
        { error: 'Seller ID is required' },
        { status: 400 }
      )
    }

    // Calculate date range
    const now = new Date()
    const startDate = new Date()
    
    switch (timeRange) {
      case '7d':
        startDate.setDate(now.getDate() - 7)
        break
      case '30d':
        startDate.setDate(now.getDate() - 30)
        break
      case '90d':
        startDate.setDate(now.getDate() - 90)
        break
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1)
        break
      default:
        startDate.setDate(now.getDate() - 30)
    }

    // Calculate days back from timeRange
    let daysBack = 30
    switch (timeRange) {
      case '7d':
        daysBack = 7
        break
      case '30d':
        daysBack = 30
        break
      case '90d':
        daysBack = 90
        break
      case '1y':
        daysBack = 365
        break
      default:
        daysBack = 30
    }

    // Get daily analytics using the function we created
    const { data: dailyAnalytics, error: dailyError } = await supabase
      .rpc('get_seller_analytics', {
        seller_uuid: sellerId,
        days_back: daysBack
      })

    if (dailyError) {
      console.error('Error fetching daily analytics:', dailyError)
      return NextResponse.json(
        { error: 'Failed to fetch daily analytics' },
        { status: 500 }
      )
    }

    // Get top performing products
    const { data: topProducts, error: topProductsError } = await supabase
      .rpc('get_top_products', {
        seller_uuid: sellerId,
        days_back: daysBack,
        limit_count: 10
      })

    if (topProductsError) {
      console.error('Error fetching top products:', topProductsError)
      return NextResponse.json(
        { error: 'Failed to fetch top products' },
        { status: 500 }
      )
    }

    // Get engagement metrics (views, likes, messages)
    const { data: engagementData, error: engagementError } = await supabase
      .from('product_analytics')
      .select('*')
      .eq('seller_id', sellerId)
      .gte('date', startDate.toISOString().split('T')[0])
      .order('date', { ascending: true })

    if (engagementError) {
      console.error('Error fetching engagement data:', engagementError)
      return NextResponse.json(
        { error: 'Failed to fetch engagement data' },
        { status: 500 }
      )
    }

    // Get traffic sources
    const { data: trafficSources, error: trafficError } = await supabase
      .from('traffic_sources')
      .select('*')
      .eq('seller_id', sellerId)
      .gte('date', startDate.toISOString().split('T')[0])

    if (trafficError) {
      console.error('Error fetching traffic sources:', trafficError)
    }

    // Get demographics data
    const { data: demographics, error: demographicsError } = await supabase
      .from('customer_demographics')
      .select('*')
      .eq('seller_id', sellerId)
      .gte('date', startDate.toISOString().split('T')[0])

    if (demographicsError) {
      console.error('Error fetching demographics:', demographicsError)
    }

    // Process and aggregate the data
    const processedData = {
      dailyAnalytics: dailyAnalytics || [],
      topProducts: topProducts || [],
      engagementMetrics: {
        totalViews: engagementData?.reduce((sum, item) => sum + (item.total_views || 0), 0) || 0,
        totalUniqueViews: engagementData?.reduce((sum, item) => sum + (item.unique_views || 0), 0) || 0,
        totalLikes: engagementData?.reduce((sum, item) => sum + (item.total_likes || 0), 0) || 0,
        totalMessages: engagementData?.reduce((sum, item) => sum + (item.total_messages || 0), 0) || 0,
        totalOrders: engagementData?.reduce((sum, item) => sum + (item.total_orders || 0), 0) || 0,
        totalRevenue: engagementData?.reduce((sum, item) => sum + (item.total_revenue || 0), 0) || 0,
        dailyData: engagementData || []
      },
      trafficSources: trafficSources || [],
      demographics: demographics || [],
      summary: {
        timeRange,
        startDate: startDate.toISOString(),
        endDate: now.toISOString(),
        totalProducts: topProducts?.length || 0
      }
    }

    return NextResponse.json(processedData)

  } catch (error) {
    console.error('Error in analytics API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/marketplace/analytics - Track product view
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()
    
    const { 
      productId, 
      sellerId, 
      viewerId, 
      source = 'direct',
      userAgent,
      ipAddress 
    } = body

    if (!productId || !sellerId) {
      return NextResponse.json(
        { error: 'Product ID and Seller ID are required' },
        { status: 400 }
      )
    }

    // Insert product view log
    const { error: viewLogError } = await supabase
      .from('product_view_logs')
      .insert({
        product_id: productId,
        seller_id: sellerId,
        viewer_id: viewerId,
        source,
        user_agent: userAgent,
        ip_address: ipAddress,
        viewed_at: new Date().toISOString()
      })

    if (viewLogError) {
      console.error('Error logging product view:', viewLogError)
      return NextResponse.json(
        { error: 'Failed to log product view' },
        { status: 500 }
      )
    }

    // The database triggers will automatically update the analytics tables
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error in analytics POST:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}