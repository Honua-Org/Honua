'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { toast } from 'sonner'
import { RealtimeChannel } from '@supabase/supabase-js'

interface MarketplaceNotification {
  id: string
  type: 'order_created' | 'order_updated' | 'payment_completed' | 'message_received'
  title: string
  message: string
  data: any
  timestamp: string
  read: boolean
}

export function useMarketplaceNotifications(userId?: string) {
  const [notifications, setNotifications] = useState<MarketplaceNotification[]>([])
  const [isConnected, setIsConnected] = useState(false)
  
  // Connection state management
  const [isConnecting, setIsConnecting] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [lastRetryTime, setLastRetryTime] = useState(0)
  
  const MAX_RETRIES = 3
  const BASE_RETRY_DELAY = 1000 // 1 second
  const MAX_RETRY_DELAY = 30000 // 30 seconds
  const supabase = createClientComponentClient()

  useEffect(() => {
    if (!userId) return

    let orderChannel: RealtimeChannel | null = null
    let messageChannel: RealtimeChannel | null = null
    let retryTimeoutId: NodeJS.Timeout | null = null
    let connectionTimeout: NodeJS.Timeout | null = null
    let isCleanedUp = false

    const setupRealtimeSubscriptions = async () => {
      if (!userId || isConnecting || isCleanedUp) return

      // Clean up existing subscriptions first
      cleanupSubscriptions()
      
      setIsConnecting(true)

      try {
        setIsConnected(false)
        console.log('Setting up marketplace realtime subscriptions for user:', userId)

        // Add connection timeout handling
        connectionTimeout = setTimeout(() => {
          if (!isCleanedUp) {
            console.warn('Realtime connection timeout, retrying...')
            setIsConnected(false)
            retryConnection()
          }
        }, 10000) // 10 second timeout

        // Check if user is authenticated
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          console.warn('No active session for realtime subscriptions')
          setIsConnecting(false)
          return
        }

        // Subscribe to marketplace orders
        orderChannel = supabase
          .channel('marketplace_orders_changes')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'marketplace_orders',
              filter: `buyer_id=eq.${userId}`
            },
            async (payload) => {
              console.log('Order change received:', payload)
              
              // Determine user role for this order
              const userRole = (payload.new as any)?.buyer_id === userId ? 'buyer' : 'seller'
              await handleOrderUpdate(payload, userRole)
            }
          )
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'marketplace_orders',
              filter: `seller_id=eq.${userId}`
            },
            async (payload) => {
              console.log('Order change received:', payload)
              
              // Determine user role for this order
              const userRole = (payload.new as any)?.buyer_id === userId ? 'buyer' : 'seller'
              await handleOrderUpdate(payload, userRole)
            }
          )
          .subscribe((status) => {
            console.log('Order subscription status:', status)
            if (isCleanedUp) return
            
            if (status === 'SUBSCRIBED') {
              console.log('Successfully subscribed to marketplace orders')
              if (connectionTimeout) {
                clearTimeout(connectionTimeout)
                connectionTimeout = null
              }
              setIsConnected(true)
              setIsConnecting(false)
              setRetryCount(0) // Reset retry count on successful connection
              setLastRetryTime(0)
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
              console.warn('Order subscription connection issue:', status, '- will attempt reconnection')
              setIsConnected(false)
              if (!isCleanedUp) {
                retryConnection()
              }
            } else if (status === 'CLOSED') {
              console.log('Order subscription closed')
              setIsConnected(false)
              // Don't retry on CLOSED status as it's usually intentional
            }
          })

        // Subscribe to messages
        messageChannel = supabase
          .channel('marketplace_messages_changes')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'marketplace_messages',
              filter: `recipient_id=eq.${userId}`
            },
            async (payload) => {
              console.log('Message change received:', payload)
              await handleMessageReceived(payload)
            }
          )
          .subscribe((status) => {
            console.log('Message subscription status:', status)
            if (isCleanedUp) return
            
            if (status === 'SUBSCRIBED') {
              console.log('Successfully subscribed to messages')
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
              console.warn('Message subscription connection issue:', status, '- will attempt reconnection')
              setIsConnected(false)
              if (!isCleanedUp) {
                retryConnection()
              }
            } else if (status === 'CLOSED') {
              console.log('Message subscription closed')
              // Don't retry on CLOSED status as it's usually intentional
            }
          })

      } catch (error) {
        console.error('Error setting up realtime subscriptions:', error)
        setIsConnected(false)
        setIsConnecting(false)
        if (!isCleanedUp) {
          retryConnection()
        }
      }
    }

    const cleanupSubscriptions = () => {
      try {
        if (connectionTimeout) {
          clearTimeout(connectionTimeout)
          connectionTimeout = null
        }
        if (retryTimeoutId) {
          clearTimeout(retryTimeoutId)
          retryTimeoutId = null
        }
        if (orderChannel) {
          orderChannel.unsubscribe()
          supabase.removeChannel(orderChannel)
          orderChannel = null
        }
        if (messageChannel) {
          messageChannel.unsubscribe()
          supabase.removeChannel(messageChannel)
          messageChannel = null
        }
      } catch (error) {
        console.error('Error during cleanup:', error)
      }
    }

    const retryConnection = () => {
      // Prevent multiple simultaneous retry attempts
      if (isConnecting || retryCount >= MAX_RETRIES || isCleanedUp) {
        if (retryCount >= MAX_RETRIES) {
          console.warn('Maximum retry attempts reached. Stopping reconnection attempts.')
          setIsConnected(false)
          setIsConnecting(false)
        }
        return
      }

      // Prevent rapid retry attempts
      const now = Date.now()
      const timeSinceLastRetry = now - lastRetryTime
      const minRetryInterval = 5000 // 5 seconds minimum between retries
      
      if (timeSinceLastRetry < minRetryInterval) {
        console.log('Retry attempt too soon, waiting...')
        return
      }

      const newRetryCount = retryCount + 1
      const delay = Math.min(BASE_RETRY_DELAY * Math.pow(2, newRetryCount - 1), MAX_RETRY_DELAY)
      
      console.log(`Retrying connection (attempt ${newRetryCount}/${MAX_RETRIES}) in ${delay}ms...`)
      
      setRetryCount(newRetryCount)
      setLastRetryTime(now)
      setIsConnecting(true)
      
      // Clear any existing retry timeout
      if (retryTimeoutId) {
        clearTimeout(retryTimeoutId)
        retryTimeoutId = null
      }
      
      retryTimeoutId = setTimeout(() => {
        if (!isCleanedUp) {
          setupRealtimeSubscriptions()
        }
      }, delay)
    }

    const handleOrderUpdate = async (payload: any, userRole: 'buyer' | 'seller') => {
      const { eventType, new: newRecord, old: oldRecord } = payload
      
      try {
        // Fetch product details for better notifications
        const { data: product } = await supabase
          .from('marketplace_products')
          .select('title, images')
          .eq('id', newRecord.product_id)
          .single()

        let notification: MarketplaceNotification

        if (eventType === 'INSERT') {
          notification = {
            id: `order_${newRecord.id}_created`,
            type: 'order_created',
            title: userRole === 'buyer' ? 'Order Placed' : 'New Order Received',
            message: userRole === 'buyer' 
              ? `Your order for ${product?.title || 'product'} has been placed successfully`
              : `You received a new order for ${product?.title || 'your product'}`,
            data: { order: newRecord, product, userRole },
            timestamp: new Date().toISOString(),
            read: false
          }
        } else if (eventType === 'UPDATE') {
          const statusChanged = oldRecord.order_status !== newRecord.order_status
          const paymentChanged = oldRecord.payment_status !== newRecord.payment_status

          if (statusChanged) {
            notification = {
              id: `order_${newRecord.id}_status_${newRecord.order_status}`,
              type: 'order_updated',
              title: 'Order Status Updated',
              message: `Order for ${product?.title || 'product'} is now ${newRecord.order_status}`,
              data: { order: newRecord, product, userRole, statusChange: true },
              timestamp: new Date().toISOString(),
              read: false
            }
          } else if (paymentChanged && newRecord.payment_status === 'completed') {
            notification = {
              id: `order_${newRecord.id}_payment_completed`,
              type: 'payment_completed',
              title: 'Payment Completed',
              message: userRole === 'buyer'
                ? `Payment for ${product?.title || 'product'} has been processed`
                : `Payment received for ${product?.title || 'your product'}`,
              data: { order: newRecord, product, userRole },
              timestamp: new Date().toISOString(),
              read: false
            }
          } else {
            return // Skip notification for other updates
          }
        } else {
          return // Skip other event types
        }

        // Add to notifications list
        setNotifications(prev => [notification, ...prev.slice(0, 49)]) // Keep last 50

        // Show toast notification
        showToastNotification(notification)

      } catch (error) {
        console.error('Error handling order update:', error)
      }
    }

    const handleMessageReceived = async (payload: any) => {
      const { new: newMessage } = payload
      
      try {
        // Check if this is a marketplace-related message
        if (newMessage.metadata?.type === 'marketplace') {
          const notification: MarketplaceNotification = {
            id: `message_${newMessage.id}`,
            type: 'message_received',
            title: 'New Message',
            message: `You have a new message about ${newMessage.metadata?.product_title || 'a marketplace item'}`,
            data: { message: newMessage },
            timestamp: new Date().toISOString(),
            read: false
          }

          setNotifications(prev => [notification, ...prev.slice(0, 49)])
          showToastNotification(notification)
        }
      } catch (error) {
        console.error('Error handling message received:', error)
      }
    }

    const createNotification = async (notificationData: {
      recipient_id: string
      type: 'order_update' | 'new_message' | 'payment_received' | 'order_completed'
      title: string
      message: string
      order_id?: string
      sender_id?: string
    }) => {
      try {
        // Use the API endpoint instead of direct Supabase call to avoid schema issues
        const response = await fetch('/api/notifications', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            recipient_id: notificationData.recipient_id,
            type: notificationData.type,
            title: notificationData.title,
            message: notificationData.message,
            order_id: notificationData.order_id,
            sender_id: notificationData.sender_id
          })
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        console.log('Notification created successfully:', { type: notificationData.type, title: notificationData.title })
        return data
      } catch (error) {
        console.error('Error creating notification:', error)
      }
    }

    const showToastNotification = (notification: MarketplaceNotification) => {
      switch (notification.type) {
        case 'order_created':
          toast.success(notification.title, {
            description: notification.message,
            duration: 5000
          })
          break
        case 'order_updated':
          toast.info(notification.title, {
            description: notification.message,
            duration: 4000
          })
          break
        case 'payment_completed':
          toast.success(notification.title, {
            description: notification.message,
            duration: 5000
          })
          break
        case 'message_received':
          toast(notification.title, {
            description: notification.message,
            duration: 4000
          })
          break
      }
    }

    setupRealtimeSubscriptions()

    return () => {
      isCleanedUp = true
      cleanupSubscriptions()
      setIsConnected(false)
      setIsConnecting(false)
      setRetryCount(0)
      setLastRetryTime(0)
      console.log('Cleaned up marketplace notification subscriptions')
    }
  }, [userId])

  const clearNotifications = () => {
    setNotifications([])
  }

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId 
          ? { ...n, read: true } 
          : n
      )
    )
  }

  return {
    notifications,
    isConnected,
    clearNotifications,
    markAsRead
  }
}