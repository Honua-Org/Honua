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
      const params = new URLSearchParams()
      if (type && type !== 'all') {
        params.append('type', type)
      }
      
      const response = await fetch(`/api/notifications?${params.toString()}`)
      if (!response.ok) {
        const errorData = await response.json()
        if (errorData.code === 'TABLE_NOT_FOUND') {
          setError('Notifications table not found. Click "Setup Notifications" to create it.')
          return
        }
        throw new Error(errorData.details || 'Failed to fetch notifications')
      }
      
      const data = await response.json()
      setNotifications(data.notifications || [])
      setError(null)
    } catch (error) {
      console.error('Error fetching notifications:', error)
      setError('Failed to load notifications')
      toast.error('Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id: string) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notification_ids: [id]
        })
      })

      if (!response.ok) {
        throw new Error('Failed to mark notification as read')
      }

      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
    } catch (error) {
      console.error('Error marking notification as read:', error)
      toast.error('Failed to mark notification as read')
    }
  }

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mark_all: true
        })
      })

      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read')
      }

      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      toast.success('All notifications marked as read')
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
      toast.error('Failed to mark all notifications as read')
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
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
              <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Notifications</h1>
              {unreadCount > 0 && <p className="text-gray-600 dark:text-gray-400">{unreadCount} unread</p>}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={markAllAsRead}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Mark all read
              </Button>
            )}
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">
              Unread {unreadCount > 0 && <Badge className="ml-1 h-5 w-5 p-0 text-xs">{unreadCount}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="like">Likes</TabsTrigger>
            <TabsTrigger value="follow">Follows</TabsTrigger>
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
                  <CardContent className="p-4">
                    <div className="flex space-x-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={notification.user.avatar_url || "/placeholder.svg"} />
                        <AvatarFallback>{notification.user.full_name?.charAt(0) || 'U'}</AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              {getNotificationIcon(notification.type)}
                              <Link
                                href={`/profile/${notification.user.username}`}
                                className="font-semibold text-gray-900 dark:text-gray-100 hover:underline"
                              >
                                {notification.user.full_name}
                              </Link>
                              <span className="text-gray-600 dark:text-gray-400">{notification.content}</span>
                            </div>

                            {notification.post_preview && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                {notification.post_preview}
                              </p>
                            )}

                            {notification.comment_preview && (
                              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 italic">
                                "{notification.comment_preview}"
                              </p>
                            )}
                          </div>

                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatTimeAgo(notification.created_at)}
                            </span>
                            {!notification.read && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
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
