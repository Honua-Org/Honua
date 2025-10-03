import { useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useToast } from '@/hooks/use-toast'

interface MarketplaceMessage {
  id: string
  sender_id: string
  recipient_id: string
  product_id?: string
  order_id?: string
  content: string
  message_type: 'text' | 'image' | 'file' | 'system'
  is_read: boolean
  created_at: string
  updated_at: string
  sender?: {
    id: string
    username: string
    full_name: string
    avatar_url: string
  }
  product?: {
    id: string
    title: string
    price: number
    images: string[]
  }
  order?: {
    id: string
    order_number: string
    status: string
  }
}

interface MessageThread {
  id: string
  participant_one_id: string
  participant_two_id: string
  product_id?: string
  order_id?: string
  thread_type: 'product_inquiry' | 'order_discussion' | 'general'
  last_message_at: string
  created_at: string
  updated_at: string
  other_participant?: {
    id: string
    username: string
    full_name: string
    avatar_url: string
  }
  product?: {
    id: string
    title: string
    price: number
    images: string[]
  }
  order?: {
    id: string
    order_number: string
    status: string
  }
  latest_message?: {
    content: string
    created_at: string
    sender_id: string
  }
  unread_count?: number
}

interface UseMarketplaceMessagesProps {
  userId?: string
  productId?: string
  orderId?: string
  otherUserId?: string
}

export function useMarketplaceMessages({
  userId,
  productId,
  orderId,
  otherUserId
}: UseMarketplaceMessagesProps = {}) {
  const [messages, setMessages] = useState<MarketplaceMessage[]>([])
  const [threads, setThreads] = useState<MessageThread[]>([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    if (!userId) return

    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (productId) params.append('product_id', productId)
      if (orderId) params.append('order_id', orderId)
      if (otherUserId) params.append('other_user_id', otherUserId)

      const response = await fetch(`/api/marketplace/messages?${params.toString()}`)
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Fetch error response:', errorText)
        throw new Error(`Failed to fetch messages: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      setMessages(data.messages || [])
    } catch (error) {
      console.error('Error fetching marketplace messages:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to load messages'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [userId, productId, orderId, otherUserId, toast])

  // Fetch message threads
  const fetchThreads = useCallback(async () => {
    if (!userId) return

    setLoading(true)
    try {
      const { data: threadsData, error } = await supabase
        .from('marketplace_message_threads')
        .select(`
          *,
          participant_one:profiles!participant_one_id (
            id,
            username,
            full_name,
            avatar_url
          ),
          participant_two:profiles!participant_two_id (
            id,
            username,
            full_name,
            avatar_url
          ),
          product:marketplace_products!product_id (
            id,
            title,
            price,
            images
          ),
          order:marketplace_orders!order_id (
            id,
            order_number,
            status
          )
        `)
        .or(`participant_one_id.eq.${userId},participant_two_id.eq.${userId}`)
        .order('last_message_at', { ascending: false })

      if (error) throw error

      // Transform threads to include other participant and latest message
      const transformedThreads = await Promise.all(
        (threadsData || []).map(async (thread: any) => {
          const otherParticipant = thread.participant_one?.id === userId 
            ? thread.participant_two 
            : thread.participant_one

          // Fetch latest message for this thread
          const { data: latestMessages } = await supabase
            .from('marketplace_messages')
            .select('content, created_at, sender_id')
            .or(`sender_id.eq.${thread.participant_one_id},sender_id.eq.${thread.participant_two_id}`)
            .or(`recipient_id.eq.${thread.participant_one_id},recipient_id.eq.${thread.participant_two_id}`)
            .eq('product_id', thread.product_id || null)
            .eq('order_id', thread.order_id || null)
            .order('created_at', { ascending: false })
            .limit(1)

          // Count unread messages
          const { count: unreadCount } = await supabase
            .from('marketplace_messages')
            .select('*', { count: 'exact', head: true })
            .eq('recipient_id', userId)
            .eq('is_read', false)
            .or(`sender_id.eq.${thread.participant_one_id},sender_id.eq.${thread.participant_two_id}`)
            .eq('product_id', thread.product_id || null)
            .eq('order_id', thread.order_id || null)

          return {
            ...thread,
            other_participant: otherParticipant,
            latest_message: latestMessages?.[0] || null,
            unread_count: unreadCount || 0
          }
        })
      )

      setThreads(transformedThreads)
    } catch (error) {
      console.error('Error fetching message threads:', error)
      toast({
        title: 'Error',
        description: 'Failed to load conversations',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [userId, supabase, toast])

  // Send message
  const sendMessage = useCallback(async ({
    recipientId,
    content,
    productId: msgProductId,
    orderId: msgOrderId,
    messageType = 'text'
  }: {
    recipientId: string
    content: string
    productId?: string
    orderId?: string
    messageType?: 'text' | 'image' | 'file' | 'system'
  }) => {
    if (!userId || !content.trim()) return false

    setSending(true)
    try {
      const response = await fetch('/api/marketplace/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recipient_id: recipientId,
          content: content.trim(),
          product_id: msgProductId,
          order_id: msgOrderId,
          message_type: messageType
        })
      })

      if (!response.ok) {
        let errorMessage = `Failed to send message: ${response.status} ${response.statusText}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch (parseError) {
          console.error('Error parsing error response:', parseError)
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()
      
      // Add the new message to the current messages
      setMessages(prev => [...prev, data.message])
      
      // Refresh threads to update latest message
      await fetchThreads()
      
      return true
    } catch (error) {
      console.error('Error sending message:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send message',
        variant: 'destructive'
      })
      return false
    } finally {
      setSending(false)
    }
  }, [userId, toast, fetchThreads])

  // Mark messages as read
  const markAsRead = useCallback(async (messageIds: string[]) => {
    if (!userId || messageIds.length === 0) return

    try {
      const { error } = await supabase
        .from('marketplace_messages')
        .update({ is_read: true })
        .in('id', messageIds)
        .eq('recipient_id', userId)

      if (error) throw error

      // Update local state
      setMessages(prev => 
        prev.map(msg => 
          messageIds.includes(msg.id) ? { ...msg, is_read: true } : msg
        )
      )
    } catch (error) {
      console.error('Error marking messages as read:', error)
    }
  }, [userId, supabase])

  // Set up real-time subscriptions
  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel('marketplace-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'marketplace_messages',
          filter: `recipient_id=eq.${userId}`
        },
        (payload) => {
          // Add new message to the list
          setMessages(prev => [...prev, payload.new as MarketplaceMessage])
          // Refresh threads to update latest message
          fetchThreads()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'marketplace_messages',
          filter: `recipient_id=eq.${userId}`
        },
        (payload) => {
          // Update message in the list
          setMessages(prev => 
            prev.map(msg => 
              msg.id === payload.new.id ? { ...msg, ...payload.new } : msg
            )
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, supabase, fetchThreads])

  // Initial fetch
  useEffect(() => {
    if (userId) {
      if (productId || orderId || otherUserId) {
        fetchMessages()
      } else {
        fetchThreads()
      }
    }
  }, [userId, productId, orderId, otherUserId, fetchMessages, fetchThreads])

  return {
    messages,
    threads,
    loading,
    sending,
    sendMessage,
    markAsRead,
    refetch: productId || orderId || otherUserId ? fetchMessages : fetchThreads
  }
}