'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { RealtimeChannel } from '@supabase/supabase-js'

export interface CustomerProfile {
  id?: string
  customer_id: string
  customer_email: string
  customer_name: string
  full_name?: string
  email?: string
  phone?: string
  avatar_url?: string
  location?: string
  total_orders: number
  total_spent: number
  average_order_value: number
  lifetime_value: number
  first_purchase_date: string
  last_purchase_date: string
  last_order_date?: string
  created_at?: string
}

export interface PurchaseHistoryItem {
  id: string
  product_id: string
  product_title: string
  product_image: string
  quantity: number
  unit_price: number
  total_amount: number
  status: string
  created_at: string
  shipping_address: any
  customer_name?: string
  product_name?: string
}

export interface CustomerAnalytics {
  total_customers: number
  new_customers_this_month: number
  average_order_value: number
  customer_lifetime_value: number
  repeat_customer_rate: number
  top_customers: CustomerProfile[]
}

export interface CustomerDataState {
  customers: CustomerProfile[]
  customerAnalytics: CustomerAnalytics
  selectedCustomer: CustomerProfile | null
  purchaseHistory: PurchaseHistoryItem[]
  loading: boolean
  error: string | null
}

export function useCustomerData(sellerId: string | null) {
  const [data, setData] = useState<CustomerDataState>({
    customers: [],
    customerAnalytics: {
      total_customers: 0,
      new_customers_this_month: 0,
      average_order_value: 0,
      customer_lifetime_value: 0,
      repeat_customer_rate: 0,
      top_customers: []
    },
    selectedCustomer: null,
    purchaseHistory: [],
    loading: true,
    error: null
  })

  const supabase = createClientComponentClient()
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)

  const fetchCustomerData = useCallback(async () => {
    if (!sellerId) {
      console.warn('fetchCustomerData called without sellerId')
      return
    }

    try {
      setData(prev => ({ ...prev, loading: true, error: null }))

      console.log('Fetching customer data for seller:', sellerId)
      
      // Validate supabase client
      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }

      // Fetch customer analytics using the database function
      const { data: customersData, error: customersError } = await supabase
        .rpc('get_customer_analytics', {
          seller_uuid: sellerId
        })

      console.log('RPC call result:', { customersData, customersError })

      if (customersError) {
        const errorDetails = {
          message: customersError.message || 'Unknown error',
          details: customersError.details || null,
          hint: customersError.hint || null,
          code: customersError.code || null,
          name: customersError.name || 'Error',
          stack: customersError.stack || null,
          fullError: JSON.stringify(customersError, Object.getOwnPropertyNames(customersError))
        }
        console.error('Supabase RPC error:', errorDetails)
        console.error('Raw error object:', customersError)
        throw new Error(`Failed to fetch customer analytics: ${customersError.message || 'Unknown error'}`)
      }

      // Calculate customer analytics
      const totalCustomers = customersData?.length || 0
      const totalSpent = customersData?.reduce((sum: number, customer: any) => sum + parseFloat(customer.total_spent || '0'), 0) || 0
      const averageOrderValue = customersData?.reduce((sum: number, customer: any) => sum + parseFloat(customer.average_order_value || '0'), 0) / Math.max(totalCustomers, 1) || 0
      const customerLifetimeValue = customersData?.reduce((sum: number, customer: any) => sum + parseFloat(customer.lifetime_value || '0'), 0) / Math.max(totalCustomers, 1) || 0

      // Calculate new customers this month
      const thisMonth = new Date()
      thisMonth.setDate(1)
      const newCustomersThisMonth = customersData?.filter((customer: any) => 
        new Date(customer.first_purchase_date) >= thisMonth
      ).length || 0

      // Calculate repeat customer rate
      const repeatCustomers = customersData?.filter((customer: any) => customer.total_orders > 1).length || 0
      const repeatCustomerRate = totalCustomers > 0 ? Math.round((repeatCustomers / totalCustomers) * 100) : 0

      // Get top 5 customers by total spent
      const topCustomers = customersData?.slice(0, 5) || []

      const customerAnalytics: CustomerAnalytics = {
        total_customers: totalCustomers,
        new_customers_this_month: newCustomersThisMonth,
        average_order_value: Math.round(averageOrderValue * 100) / 100,
        customer_lifetime_value: Math.round(customerLifetimeValue * 100) / 100,
        repeat_customer_rate: repeatCustomerRate,
        top_customers: topCustomers.map((customer: any) => ({
          customer_id: customer.customer_id,
          customer_email: customer.customer_email,
          customer_name: customer.customer_name,
          total_orders: customer.total_orders,
          total_spent: parseFloat(customer.total_spent || '0'),
          average_order_value: parseFloat(customer.average_order_value || '0'),
          lifetime_value: parseFloat(customer.lifetime_value || '0'),
          first_purchase_date: customer.first_purchase_date,
          last_purchase_date: customer.last_purchase_date
        }))
      }

      setData(prev => ({
        ...prev,
        customers: customersData?.map((customer: any) => ({
          customer_id: customer.customer_id,
          customer_email: customer.customer_email,
          customer_name: customer.customer_name,
          total_orders: customer.total_orders,
          total_spent: parseFloat(customer.total_spent || '0'),
          average_order_value: parseFloat(customer.average_order_value || '0'),
          lifetime_value: parseFloat(customer.lifetime_value || '0'),
          first_purchase_date: customer.first_purchase_date,
          last_purchase_date: customer.last_purchase_date
        })) || [],
        customerAnalytics,
        loading: false,
        error: null
      }))

    } catch (error) {
      // Enhanced error logging
      const errorDetails = {
        type: typeof error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace',
        name: error instanceof Error ? error.name : 'Unknown',
        constructor: error?.constructor?.name || 'Unknown',
        fullError: JSON.stringify(error, Object.getOwnPropertyNames(error)),
        sellerId,
        supabaseClientStatus: !!supabase
      }
      
      console.error('=== CUSTOMER DATA FETCH ERROR ===')
      console.error('Error details:', errorDetails)
      console.error('Raw error object:', error)
      console.error('Seller ID:', sellerId)
      console.error('Supabase client status:', !!supabase)
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : typeof error === 'string' 
          ? error 
          : 'Failed to fetch customer data'
      
      setData(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }))
    }
  }, [sellerId, supabase])

  const fetchPurchaseHistory = useCallback(async (customerId: string) => {
    if (!sellerId || !customerId) return

    try {
      setData(prev => ({ ...prev, loading: true }))

      // Fetch purchase history for the selected customer
      const { data: ordersData, error: ordersError } = await supabase
        .from('marketplace_orders')
        .select(`
          id,
          product_id,
          quantity,
          unit_price,
          total_amount,
          status,
          created_at,
          shipping_address,
          marketplace_products (
            title,
            images
          )
        `)
        .eq('seller_id', sellerId)
        .eq('buyer_id', customerId)
        .order('created_at', { ascending: false })

      if (ordersError) throw ordersError

      const purchaseHistory: PurchaseHistoryItem[] = ordersData?.map(order => ({
        id: order.id,
        product_id: order.product_id,
        product_title: (order.marketplace_products as any)?.title || 'Unknown Product',
        product_image: (order.marketplace_products as any)?.images?.[0] || '',
        quantity: order.quantity,
        unit_price: parseFloat(order.unit_price || '0'),
        total_amount: parseFloat(order.total_amount || '0'),
        status: order.status,
        created_at: order.created_at,
        shipping_address: order.shipping_address
      })) || []

      setData(prev => ({
        ...prev,
        purchaseHistory,
        loading: false
      }))

    } catch (error) {
      console.error('Error fetching purchase history:', error)
      setData(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch purchase history'
      }))
    }
  }, [sellerId, supabase])

  const selectCustomer = useCallback((customer: CustomerProfile) => {
    setData(prev => ({ ...prev, selectedCustomer: customer }))
    fetchPurchaseHistory(customer.customer_id)
  }, [fetchPurchaseHistory])

  // Set up real-time subscriptions
  useEffect(() => {
    if (!sellerId) return

    // Clean up existing channel
    if (channel) {
      supabase.removeChannel(channel)
    }

    // Create new channel for real-time updates
    const newChannel = supabase
      .channel(`customers_${sellerId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'customer_analytics',
          filter: `seller_id=eq.${sellerId}`
        },
        () => {
          // Refetch customer data when analytics change
          fetchCustomerData()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'marketplace_orders',
          filter: `seller_id=eq.${sellerId}`
        },
        (payload) => {
          // Refetch data when new orders are created
          fetchCustomerData()
          
          // If we're viewing a specific customer's history, refresh it
          if (data.selectedCustomer && payload.new && 'buyer_id' in payload.new) {
            if (payload.new.buyer_id === data.selectedCustomer.customer_id) {
              fetchPurchaseHistory(data.selectedCustomer.customer_id)
            }
          }
        }
      )
      .subscribe()

    setChannel(newChannel)

    // Initial data fetch
    fetchCustomerData()

    return () => {
      if (newChannel) {
        supabase.removeChannel(newChannel)
      }
    }
  }, [sellerId, fetchCustomerData, supabase])

  const refreshData = useCallback(() => {
    fetchCustomerData()
    if (data.selectedCustomer) {
      fetchPurchaseHistory(data.selectedCustomer.customer_id)
    }
  }, [fetchCustomerData, fetchPurchaseHistory, data.selectedCustomer])

  return {
    ...data,
    selectCustomer,
    refreshData
  }
}