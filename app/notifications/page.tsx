"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useSession } from "@supabase/auth-helpers-react"
import { useRouter } from "next/navigation"
import MainLayout from "@/components/main-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Bell, Heart, MessageCircle, UserPlus, Repeat2, CheckCircle, Settings } from "lucide-react"
import { toast } from "sonner"

interface NotificationUser {
  id: string
  username: string
  full_name: string
  avatar_url?: string
}

interface Notification {
  id: string
  type: "like" | "comment" | "follow" | "repost" | "mention"
  user: NotificationUser
  content: string
  post_preview?: string
  comment_preview?: string
  created_at: string
  read: boolean
}



const getNotificationIcon = (type: string) => {
  switch (type) {
    case "like":
      return <Heart className="w-4 h-4 text-red-500" />
    case "comment":
      return <MessageCircle className="w-4 h-4 text-blue-500" />
    case "follow":
      return <UserPlus className="w-4 h-4 text-green-500" />
    case "repost":
      return <Repeat2 className="w-4 h-4 text-green-500" />
    case "mention":
      return <Bell className="w-4 h-4 text-purple-500" />
    default:
      return <Bell className="w-4 h-4 text-gray-500" />
  }
}

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

  if (diffInHours < 1) return "Just now"
  if (diffInHours < 24) return `${diffInHours}h ago`
  if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`
  return date.toLocaleDateString()
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [activeTab, setActiveTab] = useState("all")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const session = useSession()
  const router = useRouter()

  const unreadCount = notifications.filter((n) => !n.read).length

  // Redirect to login if not authenticated
  useEffect(() => {
    if (session === null) {
      router.push('/auth/login')
      return
    }
  }, [session, router])

  // Show loading while checking authentication
  if (session === undefined) {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto p-4 pb-20 lg:pb-4">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </MainLayout>
    )
  }

  // Don't render if not authenticated
  if (!session) {
    return null
  }

  const setupNotifications = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/setup-notifications', {
        method: 'POST'
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success('Notifications table created successfully!')
        // Try to fetch notifications again
        await fetchNotifications(activeTab)
      } else {
        throw new Error(data.error || 'Failed to setup notifications')
      }
    } catch (error) {
      console.error('Error setting up notifications:', error)
      toast.error('Failed to setup notifications table')
    } finally {
      setLoading(false)
    }
  }

  const fetchNotifications = async (type?: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams()
      if (type && type !== 'all') {
        params.append('type', type)
      }
      params.append('limit', '20')
      params.append('offset', '0')
      
      const response = await fetch(`/api/notifications?${params.toString()}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        
        // Handle specific error cases
        if (errorData.setupRequired) {
          setError('Notifications system is not set up yet. Setting up now...')
          await setupNotificationsTable()
          return
        }
        
        if (errorData.permissionError) {
          setError('Permission denied. Please contact an administrator.')
          return
        }
        
        if (errorData.code === 'TABLE_NOT_FOUND') {
          setError('Notifications table not found. Click "Setup Notifications" to create it.')
          return
        }
        
        throw new Error(errorData.message || errorData.details || 'Failed to fetch notifications')
      }
      
      const data = await response.json()
      setNotifications(data.notifications || [])
    } catch (error) {
      console.error('Error fetching notifications:', error)
      setError(error instanceof Error ? error.message : 'Failed to load notifications')
      toast.error('Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }
  
  const setupNotificationsTable = async () => {
    try {
      const response = await fetch('/api/setup-notifications', {
        method: 'POST'
      })
      
      const data = await response.json()
      
      if (data.success) {
        setError(null)
        // Retry fetching notifications after successful setup
        await fetchNotifications(activeTab)
      } else {
        setError(data.instructions || 'Failed to set up notifications table. Please contact an administrator.')
      }
    } catch (error) {
      console.error('Error setting up notifications table:', error)
      setError('Failed to set up notifications table. Please contact an administrator.')
    }
  }

  const markAsRead = async (id: string) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notificationId: id })
      })

      if (!response.ok) {
        const errorData = await response.json()
        
        // Handle specific error cases
        if (errorData.setupRequired) {
          toast.error('Notifications system is not set up yet. Please contact an administrator.')
          return
        }
        
        if (errorData.permissionError) {
          toast.error('Permission denied. Please contact an administrator.')
          return
        }
        
        throw new Error(errorData.message || 'Failed to mark notification as read')
      }

      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === id 
            ? { ...notification, read: true }
            : notification
        )
      )
    } catch (error) {
      console.error('Error marking notification as read:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to mark notification as read')
    }
  }

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ markAllAsRead: true })
      })

      if (!response.ok) {
        const errorData = await response.json()
        
        // Handle specific error cases
        if (errorData.setupRequired) {
          toast.error('Notifications system is not set up yet. Please contact an administrator.')
          return
        }
        
        if (errorData.permissionError) {
          toast.error('Permission denied. Please contact an administrator.')
          return
        }
        
        throw new Error(errorData.message || 'Failed to mark all notifications as read')
      }

      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      )
      
      toast.success('All notifications marked as read')
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to mark all notifications as read')
    }
  }

  useEffect(() => {
    if (session) {
      fetchNotifications(activeTab)
    }
  }, [activeTab, session])

  const filteredNotifications = notifications.filter((notification) => {
    if (activeTab === "all") return true
    if (activeTab === "unread") return !notification.read
    return notification.type === activeTab
  })

  if (loading) {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto p-4 pb-20 lg:pb-4">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (error) {
    const isTableNotFound = error.includes('table not found') || error.includes('Setup Notifications')
    
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto p-4 pb-20 lg:pb-4">
          <Card className="text-center py-12">
            <CardContent>
              <Bell className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                {isTableNotFound ? 'Notifications Setup Required' : 'Error loading notifications'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">{error}</p>
              <div className="flex gap-2 justify-center">
                {isTableNotFound && (
                  <Button onClick={setupNotifications} className="bg-blue-600 hover:bg-blue-700">
                    Setup Notifications
                  </Button>
                )}
                <Button variant="outline" onClick={() => fetchNotifications(activeTab)}>Try again</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto p-4 pb-20 lg:pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
              <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Notifications</h1>
              {unreadCount > 0 && <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">{unreadCount} unread</p>}
            </div>
          </div>
          <div className="flex items-center gap-2 sm:space-x-2">
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={markAllAsRead} className="flex-1 sm:flex-none">
                <CheckCircle className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Mark all read</span>
                <span className="sm:hidden">Mark read</span>
              </Button>
            )}
            <Button variant="outline" size="sm" className="px-3">
              <Settings className="w-4 h-4" />
              <span className="sr-only">Settings</span>
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-4 h-auto">
            <TabsTrigger value="all" className="text-xs sm:text-sm py-2 px-1 sm:px-3">All</TabsTrigger>
            <TabsTrigger value="unread" className="text-xs sm:text-sm py-2 px-1 sm:px-3">
              <span className="hidden sm:inline">Unread</span>
              <span className="sm:hidden">New</span>
              {unreadCount > 0 && <Badge className="ml-1 h-4 w-4 sm:h-5 sm:w-5 p-0 text-xs">{unreadCount}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="like" className="text-xs sm:text-sm py-2 px-1 sm:px-3">Likes</TabsTrigger>
            <TabsTrigger value="follow" className="text-xs sm:text-sm py-2 px-1 sm:px-3">
              <span className="hidden sm:inline">Follows</span>
              <span className="sm:hidden">Follow</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4 mt-6">
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map((notification) => (
                <Card
                  key={notification.id}
                  className={`cursor-pointer transition-colors ${
                    !notification.read ? "bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800" : ""
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex space-x-2 sm:space-x-3">
                      <Avatar className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0">
                        <AvatarImage src={notification.user.avatar_url || "/placeholder.svg"} />
                        <AvatarFallback>{notification.user.full_name?.charAt(0) || 'U'}</AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-0">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                              <div className="flex items-center space-x-1 sm:space-x-2">
                                {getNotificationIcon(notification.type)}
                                <Link
                                  href={`/profile/${notification.user.username}`}
                                  className="font-semibold text-sm sm:text-base text-gray-900 dark:text-gray-100 hover:underline truncate"
                                >
                                  {notification.user.full_name}
                                </Link>
                              </div>
                              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 break-words">{notification.content}</span>
                            </div>

                            {notification.post_preview && (
                              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                {notification.post_preview}
                              </p>
                            )}

                            {notification.comment_preview && (
                              <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 mt-1 italic line-clamp-2">
                                "{notification.comment_preview}"
                              </p>
                            )}
                          </div>

                          <div className="flex items-center justify-between sm:justify-end sm:flex-col sm:items-end gap-2 sm:gap-1 mt-1 sm:mt-0">
                            <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                              {formatTimeAgo(notification.created_at)}
                            </span>
                            {!notification.read && <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="text-center py-12">
                <CardContent>
                  <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No notifications</h3>
                  <p className="text-gray-500 dark:text-gray-400">When you get notifications, they'll show up here</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  )
}
