'use client'

import { useState } from 'react'
import { Bell, Package, CreditCard, MessageCircle, X, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useMarketplaceNotifications } from '@/hooks/use-marketplace-notifications'
import { formatDistanceToNow } from 'date-fns'
import { useRouter } from 'next/navigation'

interface MarketplaceNotificationsProps {
  userId: string
}

export function MarketplaceNotifications({ userId }: MarketplaceNotificationsProps) {
  const { notifications, isConnected, clearNotifications, markAsRead } = useMarketplaceNotifications(userId)
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  const unreadCount = notifications.filter(n => !n.read).length

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order_created':
      case 'order_updated':
        return <Package className="h-4 w-4" />
      case 'payment_completed':
        return <CreditCard className="h-4 w-4" />
      case 'message_received':
        return <MessageCircle className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'order_created':
        return 'text-blue-600'
      case 'order_updated':
        return 'text-orange-600'
      case 'payment_completed':
        return 'text-green-600'
      case 'message_received':
        return 'text-purple-600'
      default:
        return 'text-gray-600'
    }
  }

  const handleNotificationClick = (notification: any) => {
    markAsRead(notification.id)
    
    // Navigate based on notification type
    switch (notification.type) {
      case 'order_created':
      case 'order_updated':
      case 'payment_completed':
        if (notification.data?.order?.id) {
          router.push(`/marketplace/orders/${notification.data.order.id}`)
        }
        break
      case 'message_received':
        if (notification.data?.message?.conversation_id) {
          router.push(`/messages/${notification.data.message.conversation_id}`)
        }
        break
    }
    
    setIsOpen(false)
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
          <span className="sr-only">Marketplace notifications</span>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Marketplace Notifications</span>
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            }`} />
            <span className="text-xs text-muted-foreground">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No notifications yet
          </div>
        ) : (
          <>
            <ScrollArea className="h-96">
              {notifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className="flex items-start gap-3 p-3 cursor-pointer hover:bg-muted/50"
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className={`mt-0.5 ${getNotificationColor(notification.type)}`}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium leading-none">
                        {notification.title}
                      </p>
                      {!notification.read && (
                        <div className="h-2 w-2 bg-blue-600 rounded-full" />
                      )}
                    </div>
                    
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {notification.message}
                    </p>
                    
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                </DropdownMenuItem>
              ))}
            </ScrollArea>
            
            <DropdownMenuSeparator />
            
            <div className="p-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-center"
                onClick={() => {
                  clearNotifications()
                  setIsOpen(false)
                }}
              >
                <X className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Notification toast component for individual notifications
export function NotificationToast({ notification, onDismiss }: {
  notification: any
  onDismiss: () => void
}) {
  const router = useRouter()

  const handleClick = () => {
    switch (notification.type) {
      case 'order_created':
      case 'order_updated':
      case 'payment_completed':
        if (notification.data?.order?.id) {
          router.push(`/marketplace/orders/${notification.data.order.id}`)
        }
        break
      case 'message_received':
        if (notification.data?.message?.conversation_id) {
          router.push(`/messages/${notification.data.message.conversation_id}`)
        }
        break
    }
    onDismiss()
  }

  return (
    <div 
      className="flex items-start gap-3 p-4 bg-white border rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
      onClick={handleClick}
    >
      <div className="text-blue-600 mt-0.5">
        {notification.type === 'order_created' || notification.type === 'order_updated' ? (
          <Package className="h-5 w-5" />
        ) : notification.type === 'payment_completed' ? (
          <CreditCard className="h-5 w-5" />
        ) : notification.type === 'message_received' ? (
          <MessageCircle className="h-5 w-5" />
        ) : (
          <Bell className="h-5 w-5" />
        )}
      </div>
      
      <div className="flex-1">
        <p className="font-medium text-sm">{notification.title}</p>
        <p className="text-sm text-muted-foreground">{notification.message}</p>
      </div>
      
      <Button
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0"
        onClick={(e) => {
          e.stopPropagation()
          onDismiss()
        }}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}