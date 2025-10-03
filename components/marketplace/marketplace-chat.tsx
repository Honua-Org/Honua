'use client'

import { useState, useEffect, useRef } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useMarketplaceMessages } from '@/hooks/use-marketplace-messages'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Send, Package, ShoppingCart, User, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface MarketplaceChatProps {
  userId: string
  otherUserId: string
  productId?: string
  orderId?: string
  productTitle?: string
  orderNumber?: string
  onBack?: () => void
}

export function MarketplaceChat({
  userId,
  otherUserId,
  productId,
  orderId,
  productTitle,
  orderNumber,
  onBack
}: MarketplaceChatProps) {
  const [messageInput, setMessageInput] = useState('')
  const [otherUser, setOtherUser] = useState<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClientComponentClient()

  const {
    messages,
    loading,
    sending,
    sendMessage,
    markAsRead
  } = useMarketplaceMessages({
    userId,
    productId,
    orderId,
    otherUserId
  })

  // Fetch other user details
  useEffect(() => {
    const fetchOtherUser = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .eq('id', otherUserId)
        .single()

      if (!error && data) {
        setOtherUser(data)
      }
    }

    if (otherUserId) {
      fetchOtherUser()
    }
  }, [otherUserId, supabase])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Mark messages as read when component mounts or messages change
  useEffect(() => {
    const unreadMessages = messages
      .filter(msg => msg.recipient_id === userId && !msg.is_read)
      .map(msg => msg.id)

    if (unreadMessages.length > 0) {
      markAsRead(unreadMessages)
    }
  }, [messages, userId, markAsRead])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageInput.trim() || sending) return

    const success = await sendMessage({
      recipientId: otherUserId,
      content: messageInput,
      productId,
      orderId
    })

    if (success) {
      setMessageInput('')
    }
  }

  const formatMessageTime = (timestamp: string) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true })
  }

  if (loading) {
    return (
      <Card className="h-[600px] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Loading messages...</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="h-[600px] flex flex-col">
      {/* Chat Header */}
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={otherUser?.avatar_url} />
              <AvatarFallback>
                {otherUser?.full_name?.charAt(0) || <User className="h-4 w-4" />}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">
                {otherUser?.full_name || otherUser?.username || 'User'}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                @{otherUser?.username}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {productId && (
              <Badge variant="secondary" className="flex items-center space-x-1">
                <Package className="h-3 w-3" />
                <span>{productTitle || 'Product'}</span>
              </Badge>
            )}
            {orderId && (
              <Badge variant="outline" className="flex items-center space-x-1">
                <ShoppingCart className="h-3 w-3" />
                <span>{orderNumber || 'Order'}</span>
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <Separator />

      {/* Messages Area */}
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-full p-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-center">
              <div>
                <div className="rounded-full bg-muted p-3 mx-auto mb-3 w-fit">
                  <Send className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">
                  No messages yet. Start the conversation!
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => {
                const isOwnMessage = message.sender_id === userId
                return (
                  <div
                    key={message.id}
                    className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg px-3 py-2 ${
                        isOwnMessage
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span
                          className={`text-xs ${
                            isOwnMessage
                              ? 'text-primary-foreground/70'
                              : 'text-muted-foreground'
                          }`}
                        >
                          {formatMessageTime(message.created_at)}
                        </span>
                        {isOwnMessage && (
                          <div className="flex items-center space-x-1 ml-2">
                            {message.is_read ? (
                              <div className="w-2 h-2 rounded-full bg-primary-foreground/70" />
                            ) : (
                              <div className="w-2 h-2 rounded-full bg-primary-foreground/40" />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>
      </CardContent>

      <Separator />

      {/* Message Input */}
      <div className="p-4">
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <Input
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder="Type your message..."
            disabled={sending}
            className="flex-1"
          />
          <Button type="submit" disabled={!messageInput.trim() || sending}>
            {sending ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </Card>
  )
}

// Thread List Component for showing all conversations
interface MarketplaceMessageThreadsProps {
  userId: string
  onSelectThread?: (thread: any) => void
}

export function MarketplaceMessageThreads({ userId, onSelectThread }: MarketplaceMessageThreadsProps) {
  const { threads, loading } = useMarketplaceMessages({ userId })

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-muted rounded-full animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded animate-pulse" />
                <div className="h-3 bg-muted rounded w-2/3 animate-pulse" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  if (threads.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="rounded-full bg-muted p-3 mx-auto mb-3 w-fit">
          <Send className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="font-semibold mb-2">No conversations yet</h3>
        <p className="text-muted-foreground">
          Start messaging with buyers and sellers about products and orders.
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {threads.map((thread) => (
        <Card 
          key={thread.id} 
          className="p-4 hover:bg-muted/50 cursor-pointer transition-colors"
          onClick={() => onSelectThread?.(thread)}
        >
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={thread.other_participant?.avatar_url} />
              <AvatarFallback>
                {thread.other_participant?.full_name?.charAt(0) || <User className="h-4 w-4" />}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold truncate">
                  {thread.other_participant?.full_name || thread.other_participant?.username}
                </h4>
                <div className="flex items-center space-x-2">
                  {thread.unread_count && thread.unread_count > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {thread.unread_count}
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {formatDistanceToNow(new Date(thread.last_message_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground truncate">
                {thread.latest_message?.content || 'No messages yet'}
              </p>
              <div className="flex items-center space-x-2 mt-1">
                {thread.product && (
                  <Badge variant="secondary" className="text-xs">
                    <Package className="h-3 w-3 mr-1" />
                    {thread.product.title}
                  </Badge>
                )}
                {thread.order && (
                  <Badge variant="outline" className="text-xs">
                    <ShoppingCart className="h-3 w-3 mr-1" />
                    {thread.order.order_number}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}