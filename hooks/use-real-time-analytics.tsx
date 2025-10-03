'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { RealtimeChannel } from '@supabase/supabase-js'

export interface DailyAnalytics {
  date: string
  total_views: number
  unique_views: number
  total_orders: number
  total_revenue: number
  total_messages: number
}

export interface TopProduct {
  product_id: string
  product_title: string
  total_views: number
  total_orders: number
  total_revenue: number
  conversion_rate: number
}

export interface EngagementMetrics {
  total_views: number
  total_likes: number
  total_messages: number
  total_orders: number
  conversion_rate: number
}

export interface TrafficSource {
  source: string
  visits: number
  percentage: number
}

export interface Demographics {
  age_group: string
  count: number
  percentage: number
  locations?: Array<{
    city: string
    count: number
  }>
}

export interface AnalyticsData {
  dailyAnalytics: DailyAnalytics[]
  topProducts: TopProduct[]
  engagementMetrics: EngagementMetrics & {
    avg_response_time?: string
    engagement_rate?: number
  }
  trafficSources: TrafficSource[]
  demographics: Demographics & {
    locations?: Array<{
      city: string
      count: number
    }>
  }
  engagement?: {
    total_likes: number
    total_messages: number
    avg_response_time: string
    engagement_rate: number
  }
  loading: boolean
  error: string | null
}

export function useRealTimeAnalytics(sellerId: string | null, timeRange: string = '30') {
  const [data, setData] = useState<AnalyticsData>({
    dailyAnalytics: [],
    topProducts: [],
    engagementMetrics: {
      total_views: 0,
      total_likes: 0,
      total_messages: 0,
      total_orders: 0,
      conversion_rate: 0
    },
    trafficSources: [],
    demographics: {
      age_group: '',
      count: 0,
      percentage: 0,
      locations: []
    },
    loading: true,
    error: null
  })

  const supabase = createClientComponentClient()
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)

  const fetchAnalyticsData = useCallback(async () => {
    if (!sellerId) return

    try {
      setData(prev => ({ ...prev, loading: true, error: null }))

      // Fetch daily analytics using the database function
      const { data: dailyData, error: dailyError } = await supabase
        .rpc('get_seller_analytics', {
          seller_uuid: sellerId,
          days_back: parseInt(timeRange)
        })

      if (dailyError) {
        const errorDetails = {
          message: dailyError.message || 'Unknown error',
          details: dailyError.details || null,
          hint: dailyError.hint || null,
          code: dailyError.code || null,
          name: dailyError.name || 'Error',
          stack: dailyError.stack || null,
          fullError: JSON.stringify(dailyError, Object.getOwnPropertyNames(dailyError))
        }
        console.error('Daily analytics error:', errorDetails)
        console.error('Raw error object:', dailyError)
        throw new Error(`Failed to fetch daily analytics: ${dailyError.message || 'Unknown error'}`)
      }

      // Fetch top products
      const { data: topProductsData, error: topProductsError } = await supabase
        .rpc('get_top_products', {
          seller_uuid: sellerId,
          days_back: parseInt(timeRange),
          limit_count: 10
        })

      if (topProductsError) {
        console.error('Top products error:', {
          error: topProductsError,
          sellerId,
          timeRange,
          message: topProductsError.message,
          details: topProductsError.details,
          hint: topProductsError.hint,
          code: topProductsError.code
        })
        throw new Error(`Failed to fetch top products: ${topProductsError.message}`)
      }

      // Calculate engagement metrics from daily data
      const totalViews = dailyData?.reduce((sum: number, day: any) => sum + (day.total_views || 0), 0) || 0
      const totalOrders = dailyData?.reduce((sum: number, day: any) => sum + (day.total_orders || 0), 0) || 0
      const totalMessages = dailyData?.reduce((sum: number, day: any) => sum + (day.total_messages || 0), 0) || 0

      // Fetch traffic sources
      const { data: trafficData, error: trafficError } = await supabase
        .from('traffic_sources')
        .select('source, visits')
        .eq('seller_id', sellerId)
        .gte('date', new Date(Date.now() - parseInt(timeRange) * 24 * 60 * 60 * 1000).toISOString().split('T')[0])

      if (trafficError) {
        console.error('Traffic sources error:', {
          error: trafficError,
          sellerId,
          timeRange,
          message: trafficError.message,
          details: trafficError.details,
          hint: trafficError.hint,
          code: trafficError.code
        })
        throw new Error(`Failed to fetch traffic sources: ${trafficError.message}`)
      }

      // Calculate traffic source percentages
      const totalTrafficVisits = trafficData?.reduce((sum, item) => sum + item.visits, 0) || 1
      const trafficSources = trafficData?.map(item => ({
        source: item.source,
        visits: item.visits,
        percentage: Math.round((item.visits / totalTrafficVisits) * 100)
      })) || []

      // Fetch demographics
      const { data: demographicsData, error: demographicsError } = await supabase
        .from('customer_demographics')
        .select('age_group, count')
        .eq('seller_id', sellerId)
        .gte('date', new Date(Date.now() - parseInt(timeRange) * 24 * 60 * 60 * 1000).toISOString().split('T')[0])

      if (demographicsError) {
        console.error('Demographics error:', {
          error: demographicsError,
          sellerId,
          timeRange,
          message: demographicsError.message,
          details: demographicsError.details,
          hint: demographicsError.hint,
          code: demographicsError.code
        })
        throw new Error(`Failed to fetch demographics: ${demographicsError.message}`)
      }

      // Calculate demographics percentages
      const totalDemographics = demographicsData?.reduce((sum, item) => sum + item.count, 0) || 1
      const demographics = demographicsData?.map(item => ({
        age_group: item.age_group,
        count: item.count,
        percentage: Math.round((item.count / totalDemographics) * 100)
      })) || []

      setData({
        dailyAnalytics: dailyData?.map((day: any) => ({
          date: day.date,
          total_views: day.total_views || 0,
          unique_views: day.unique_views || 0,
          total_orders: day.total_orders || 0,
          total_revenue: parseFloat(day.total_revenue || '0'),
          total_messages: day.total_messages || 0
        })) || [],
        topProducts: topProductsData?.map((product: any) => ({
          product_id: product.product_id,
          product_title: product.product_title,
          total_views: product.total_views || 0,
          total_orders: product.total_orders || 0,
          total_revenue: parseFloat(product.total_revenue || '0'),
          conversion_rate: parseFloat(product.conversion_rate || '0')
        })) || [],
        engagementMetrics: {
          total_views: totalViews,
          total_likes: 0, // Will be calculated from likes data when available
          total_messages: totalMessages,
          total_orders: totalOrders,
          conversion_rate: totalViews > 0 ? Math.round((totalOrders / totalViews) * 100 * 100) / 100 : 0
        },
        trafficSources,
        demographics: demographics[0] || {
          age_group: '',
          count: 0,
          percentage: 0,
          locations: []
        },
        loading: false,
        error: null
      })

    } catch (error) {
      const errorDetails = {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : null,
        name: error instanceof Error ? error.name : 'Unknown',
        type: typeof error,
        constructor: error?.constructor?.name || 'Unknown',
        fullError: JSON.stringify(error, Object.getOwnPropertyNames(error)),
        sellerId,
        timeRange
      }
      
      console.error('Error fetching analytics data:', errorDetails)
      console.error('Raw error object:', error)
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : typeof error === 'string' 
          ? error 
          : 'Failed to fetch analytics data'
      
      setData(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }))
    }
  }, [sellerId, timeRange, supabase])

  // Set up real-time subscriptions
  useEffect(() => {
    if (!sellerId) return

    // Clean up existing channel
    if (channel) {
      supabase.removeChannel(channel)
    }

    // Create new channel for real-time updates
    const newChannel = supabase
      .channel(`analytics_${sellerId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'product_analytics',
          filter: `seller_id=eq.${sellerId}`
        },
        () => {
          // Refetch data when analytics change
          fetchAnalyticsData()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'customer_analytics',
          filter: `seller_id=eq.${sellerId}`
        },
        () => {
          // Refetch data when customer analytics change
          fetchAnalyticsData()
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
          // Refetch data when new views are logged
          fetchAnalyticsData()
        }
      )
      .subscribe()

    setChannel(newChannel)

    // Initial data fetch
    fetchAnalyticsData()

    return () => {
      if (newChannel) {
        supabase.removeChannel(newChannel)
      }
    }
  }, [sellerId, timeRange, fetchAnalyticsData, supabase])

  const refreshData = useCallback(() => {
    fetchAnalyticsData()
  }, [fetchAnalyticsData])

  return {
    ...data,
    refreshData
  }
}