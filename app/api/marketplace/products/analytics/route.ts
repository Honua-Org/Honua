import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// GET /api/marketplace/products/analytics - Get detailed product analytics
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    const sellerId = searchParams.get('sellerId')
    const productId = searchParams.get('productId')
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

    let query = supabase
      .from('product_analytics')
      .select('*')
      .eq('seller_id', sellerId)
      .gte('date', startDate.toISOString().split('T')[0])
      .order('date', { ascending: true })

    // Filter by specific product if provided
    if (productId) {
      query = query.eq('product_id', productId)
    }

    const { data: productAnalytics, error: analyticsError } = await query

    if (analyticsError) {
      console.error('Error fetching product analytics:', analyticsError)
      return NextResponse.json(
        { error: 'Failed to fetch product analytics' },
        { status: 500 }
      )
    }

    // Get product view logs for detailed analysis
    let viewLogsQuery = supabase
      .from('product_view_logs')
      .select('*')
      .eq('seller_id', sellerId)
      .gte('viewed_at', startDate.toISOString())
      .order('viewed_at', { ascending: false })

    if (productId) {
      viewLogsQuery = viewLogsQuery.eq('product_id', productId)
    }

    const { data: viewLogs, error: viewLogsError } = await viewLogsQuery

    if (viewLogsError) {
      console.error('Error fetching view logs:', viewLogsError)
    }

    // Process daily views data
    const dailyViews: Record<string, { views: number; unique_viewers: Set<string> }> = {}
    viewLogs?.forEach(log => {
      const date = log.viewed_at.split('T')[0]
      if (!dailyViews[date]) {
        dailyViews[date] = { views: 0, unique_viewers: new Set() }
      }
      dailyViews[date].views += 1
      if (log.viewer_id) {
        dailyViews[date].unique_viewers.add(log.viewer_id)
      }
    })

    const dailyViewsArray = Object.entries(dailyViews).map(([date, data]) => ({
      date,
      views: data.views,
      unique_views: data.unique_viewers.size
    }))

    // Process weekly performance
    const weeklyData: Record<string, { week: string; views: number; orders: number; revenue: number; conversion_rate: number }> = {}
    productAnalytics?.forEach(item => {
      const date = new Date(item.date)
      const weekStart = new Date(date.setDate(date.getDate() - date.getDay()))
      const weekKey = weekStart.toISOString().split('T')[0]
      
      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = {
          week: weekKey,
          views: 0,
          orders: 0,
          revenue: 0,
          conversion_rate: 0
        }
      }
      
      weeklyData[weekKey].views += item.total_views || 0
      weeklyData[weekKey].orders += item.total_orders || 0
      weeklyData[weekKey].revenue += item.total_revenue || 0
    })

    // Calculate conversion rates for weekly data
    Object.values(weeklyData).forEach((week) => {
      week.conversion_rate = week.views > 0 ? (week.orders / week.views * 100) : 0
    })

    const weeklyPerformance = Object.values(weeklyData)

    // Process traffic sources
    const trafficSources: Record<string, number> = {}
    viewLogs?.forEach(log => {
      const source = log.source || 'direct'
      if (!trafficSources[source]) {
        trafficSources[source] = 0
      }
      trafficSources[source] += 1
    })

    const topReferrers = Object.entries(trafficSources)
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Process geographic data (mock data for now - would need IP geolocation)
    const geographicData = [
      { country: 'United States', views: Math.floor(Math.random() * 1000) + 100 },
      { country: 'Canada', views: Math.floor(Math.random() * 500) + 50 },
      { country: 'United Kingdom', views: Math.floor(Math.random() * 300) + 30 },
      { country: 'Australia', views: Math.floor(Math.random() * 200) + 20 },
      { country: 'Germany', views: Math.floor(Math.random() * 150) + 15 }
    ]

    // Calculate overall metrics
    const totalViews = productAnalytics?.reduce((sum, item) => sum + (item.total_views || 0), 0) || 0
    const totalUniqueViews = productAnalytics?.reduce((sum, item) => sum + (item.unique_views || 0), 0) || 0
    const totalLikes = productAnalytics?.reduce((sum, item) => sum + (item.total_likes || 0), 0) || 0
    const totalMessages = productAnalytics?.reduce((sum, item) => sum + (item.total_messages || 0), 0) || 0
    const totalOrders = productAnalytics?.reduce((sum, item) => sum + (item.total_orders || 0), 0) || 0
    const totalRevenue = productAnalytics?.reduce((sum, item) => sum + (item.total_revenue || 0), 0) || 0
    const conversionRate = totalViews > 0 ? (totalOrders / totalViews * 100) : 0

    // Calculate trend (comparing with previous period)
    const previousPeriodStart = new Date(startDate)
    const periodLength = now.getTime() - startDate.getTime()
    previousPeriodStart.setTime(startDate.getTime() - periodLength)

    let previousQuery = supabase
      .from('product_analytics')
      .select('*')
      .eq('seller_id', sellerId)
      .gte('date', previousPeriodStart.toISOString().split('T')[0])
      .lt('date', startDate.toISOString().split('T')[0])

    if (productId) {
      previousQuery = previousQuery.eq('product_id', productId)
    }

    const { data: previousPeriodData } = await previousQuery

    const previousViews = previousPeriodData?.reduce((sum, item) => sum + (item.total_views || 0), 0) || 0
    const viewsTrend = previousViews > 0 ? ((totalViews - previousViews) / previousViews * 100) : 0

    return NextResponse.json({
      metrics: {
        views: totalViews,
        unique_views: totalUniqueViews,
        likes: totalLikes,
        messages: totalMessages,
        orders: totalOrders,
        revenue: totalRevenue,
        conversion_rate: conversionRate,
        trend: viewsTrend
      },
      dailyViews: dailyViewsArray,
      weeklyPerformance,
      topReferrers,
      geographicData,
      rawAnalytics: productAnalytics || [],
      summary: {
        timeRange,
        startDate: startDate.toISOString(),
        endDate: now.toISOString(),
        productId: productId || 'all'
      }
    })

  } catch (error) {
    console.error('Error in product analytics API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}