'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { RealtimeChannel } from '@supabase/supabase-js'

export interface ProductMetrics {
  product_id: string
  title: string
  views: number
  unique_views: number
  likes: number
  messages: number
  orders: number
  revenue: number
  conversion_rate: number
  last_viewed: string
  trend: 'up' | 'down' | 'stable'
}

export interface ProductPerformance {
  daily_views: Array<{ date: string; views: number }>
  weekly_performance: Array<{ 
    week: string
    views: number
    orders: number
    revenue: number
    conversion_rate: number
  }>
  top_referrers: Array<{ source: string; visits: number; percentage: number }>
  geographic_data: Array<{ country: string; visits: number; percentage: number }>
}

export interface ProductMetricsState {
  products: ProductMetrics[]
  selectedProduct: ProductMetrics | null
  performance: ProductPerformance
  loading: boolean
  error: string | null
}

export function useProductMetrics(sellerId: string | null, timeRange: string = '30') {
  const [data, setData] = useState<ProductMetricsState>({
    products: [],
    selectedProduct: null,
    performance: {
      daily_views: [],
      weekly_performance: [],
      top_referrers: [],
      geographic_data: []
    },
    loading: true,
    error: null
  })

  const supabase = createClientComponentClient()
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)

  const fetchProductMetrics = useCallback(async () => {
    if (!sellerId) return

    try {
      setData(prev => ({ ...prev, loading: true, error: null }))

      // Fetch products with their analytics
      const { data: productsData, error: productsError } = await supabase
        .from('marketplace_products')
        .select(`
          id,
          title,
          created_at,
          product_analytics (
            views,
            unique_views,
            likes,
            messages,
            orders,
            revenue,
            date
          )
        `)
        .eq('seller_id', sellerId)

      if (productsError) throw productsError

      // Process products data
      const products: ProductMetrics[] = productsData?.map(product => {
        const analytics = product.product_analytics || []
        const recentAnalytics = analytics.filter((a: any) => {
          const analyticsDate = new Date(a.date)
          const cutoffDate = new Date()
          cutoffDate.setDate(cutoffDate.getDate() - parseInt(timeRange))
          return analyticsDate >= cutoffDate
        })

        const totalViews = recentAnalytics.reduce((sum: number, a: any) => sum + (a.views || 0), 0)
        const totalUniqueViews = recentAnalytics.reduce((sum: number, a: any) => sum + (a.unique_views || 0), 0)
        const totalLikes = recentAnalytics.reduce((sum: number, a: any) => sum + (a.likes || 0), 0)
        const totalMessages = recentAnalytics.reduce((sum: number, a: any) => sum + (a.messages || 0), 0)
        const totalOrders = recentAnalytics.reduce((sum: number, a: any) => sum + (a.orders || 0), 0)
        const totalRevenue = recentAnalytics.reduce((sum: number, a: any) => sum + parseFloat(a.revenue || '0'), 0)

        // Calculate trend (comparing last 7 days vs previous 7 days)
        const last7Days = recentAnalytics.filter((a: any) => {
          const analyticsDate = new Date(a.date)
          const cutoffDate = new Date()
          cutoffDate.setDate(cutoffDate.getDate() - 7)
          return analyticsDate >= cutoffDate
        })
        const previous7Days = recentAnalytics.filter((a: any) => {
          const analyticsDate = new Date(a.date)
          const startDate = new Date()
          startDate.setDate(startDate.getDate() - 14)
          const endDate = new Date()
          endDate.setDate(endDate.getDate() - 7)
          return analyticsDate >= startDate && analyticsDate < endDate
        })

        const lastWeekViews = last7Days.reduce((sum: number, a: any) => sum + (a.views || 0), 0)
        const previousWeekViews = previous7Days.reduce((sum: number, a: any) => sum + (a.views || 0), 0)

        let trend: 'up' | 'down' | 'stable' = 'stable'
        if (lastWeekViews > previousWeekViews * 1.1) trend = 'up'
        else if (lastWeekViews < previousWeekViews * 0.9) trend = 'down'

        return {
          product_id: product.id,
          title: product.title,
          views: totalViews,
          unique_views: totalUniqueViews,
          likes: totalLikes,
          messages: totalMessages,
          orders: totalOrders,
          revenue: totalRevenue,
          conversion_rate: totalViews > 0 ? Math.round((totalOrders / totalViews) * 100 * 100) / 100 : 0,
          last_viewed: recentAnalytics.length > 0 ? recentAnalytics[recentAnalytics.length - 1].date : product.created_at,
          trend
        }
      }) || []

      setData(prev => ({
        ...prev,
        products: products.sort((a, b) => b.views - a.views),
        loading: false,
        error: null
      }))

    } catch (error) {
      console.error('Error fetching product metrics:', error)
      setData(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch product metrics'
      }))
    }
  }, [sellerId, timeRange, supabase])

  const fetchProductPerformance = useCallback(async (productId: string) => {
    if (!sellerId || !productId) return

    try {
      setData(prev => ({ ...prev, loading: true }))

      // Fetch daily views for the selected product
      const { data: dailyData, error: dailyError } = await supabase
        .from('product_analytics')
        .select('date, views')
        .eq('product_id', productId)
        .gte('date', new Date(Date.now() - parseInt(timeRange) * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('date', { ascending: true })

      if (dailyError) throw dailyError

      // Fetch weekly performance
      const { data: weeklyData, error: weeklyError } = await supabase
        .from('product_analytics')
        .select('date, views, orders, revenue')
        .eq('product_id', productId)
        .gte('date', new Date(Date.now() - parseInt(timeRange) * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('date', { ascending: true })

      if (weeklyError) throw weeklyError

      // Process weekly data (group by week)
      const weeklyPerformance = weeklyData?.reduce((acc: any[], item: any) => {
        const date = new Date(item.date)
        const weekStart = new Date(date.setDate(date.getDate() - date.getDay()))
        const weekKey = weekStart.toISOString().split('T')[0]

        const existingWeek = acc.find(w => w.week === weekKey)
        if (existingWeek) {
          existingWeek.views += item.views || 0
          existingWeek.orders += item.orders || 0
          existingWeek.revenue += parseFloat(item.revenue || '0')
        } else {
          acc.push({
            week: weekKey,
            views: item.views || 0,
            orders: item.orders || 0,
            revenue: parseFloat(item.revenue || '0'),
            conversion_rate: 0 // Will be calculated below
          })
        }
        return acc
      }, []) || []

      // Calculate conversion rates for weekly data
      weeklyPerformance.forEach(week => {
        week.conversion_rate = week.views > 0 ? Math.round((week.orders / week.views) * 100 * 100) / 100 : 0
      })

      // Fetch referrer data from view logs
      const { data: referrerData, error: referrerError } = await supabase
        .from('product_view_logs')
        .select('referrer')
        .eq('product_id', productId)
        .gte('viewed_at', new Date(Date.now() - parseInt(timeRange) * 24 * 60 * 60 * 1000).toISOString())
        .not('referrer', 'is', null)

      if (referrerError) throw referrerError

      // Process referrer data
      const referrerCounts = referrerData?.reduce((acc: any, item: any) => {
        const source = item.referrer || 'Direct'
        acc[source] = (acc[source] || 0) + 1
        return acc
      }, {}) || {}

      const totalReferrers = Object.values(referrerCounts).reduce((sum: number, count: any) => sum + count, 0) || 1
      const topReferrers = Object.entries(referrerCounts)
        .map(([source, visits]: [string, any]) => ({
          source,
          visits,
          percentage: Math.round((visits / totalReferrers) * 100)
        }))
        .sort((a, b) => b.visits - a.visits)
        .slice(0, 5)

      // Fetch geographic data
      const { data: geoData, error: geoError } = await supabase
        .from('product_view_logs')
        .select('country')
        .eq('product_id', productId)
        .gte('viewed_at', new Date(Date.now() - parseInt(timeRange) * 24 * 60 * 60 * 1000).toISOString())
        .not('country', 'is', null)

      if (geoError) throw geoError

      // Process geographic data
      const geoCounts = geoData?.reduce((acc: any, item: any) => {
        const country = item.country || 'Unknown'
        acc[country] = (acc[country] || 0) + 1
        return acc
      }, {}) || {}

      const totalGeoVisits = Object.values(geoCounts).reduce((sum: number, count: any) => sum + count, 0) || 1
      const geographicData = Object.entries(geoCounts)
        .map(([country, visits]: [string, any]) => ({
          country,
          visits,
          percentage: Math.round((visits / totalGeoVisits) * 100)
        }))
        .sort((a, b) => b.visits - a.visits)
        .slice(0, 10)

      setData(prev => ({
        ...prev,
        performance: {
          daily_views: dailyData?.map(item => ({
            date: item.date,
            views: item.views || 0
          })) || [],
          weekly_performance: weeklyPerformance,
          top_referrers: topReferrers,
          geographic_data: geographicData
        },
        loading: false
      }))

    } catch (error) {
      console.error('Error fetching product performance:', error)
      setData(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch product performance'
      }))
    }
  }, [sellerId, timeRange, supabase])

  const selectProduct = useCallback((product: ProductMetrics) => {
    setData(prev => ({ ...prev, selectedProduct: product }))
    fetchProductPerformance(product.product_id)
  }, [fetchProductPerformance])

  // Set up real-time subscriptions
  useEffect(() => {
    if (!sellerId) return

    // Clean up existing channel
    if (channel) {
      supabase.removeChannel(channel)
    }

    // Create new channel for real-time updates
    const newChannel = supabase
      .channel(`product_metrics_${sellerId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'product_analytics',
          filter: `seller_id=eq.${sellerId}`
        },
        () => {
          // Refetch product metrics when analytics change
          fetchProductMetrics()
          
          // If we're viewing a specific product, refresh its performance
          if (data.selectedProduct) {
            fetchProductPerformance(data.selectedProduct.product_id)
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'product_view_logs',
          filter: `seller_id=eq.${sellerId}`
        },
        () => {
          // Refetch metrics when new views are logged
          fetchProductMetrics()
          
          // If we're viewing a specific product, refresh its performance
          if (data.selectedProduct) {
            fetchProductPerformance(data.selectedProduct.product_id)
          }
        }
      )
      .subscribe()

    setChannel(newChannel)

    // Initial data fetch
    fetchProductMetrics()

    return () => {
      if (newChannel) {
        supabase.removeChannel(newChannel)
      }
    }
  }, [sellerId, timeRange, fetchProductMetrics, supabase])

  const refreshData = useCallback(() => {
    fetchProductMetrics()
    if (data.selectedProduct) {
      fetchProductPerformance(data.selectedProduct.product_id)
    }
  }, [fetchProductMetrics, fetchProductPerformance, data.selectedProduct])

  return {
    ...data,
    selectProduct,
    refreshData
  }
}