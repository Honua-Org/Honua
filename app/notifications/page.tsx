"use client"

import { useState } from "react"
import MainLayout from "@/components/main-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bell, Heart, MessageCircle, UserPlus, Repeat2, CheckCircle, Settings } from "lucide-react"
import Link from "next/link"

const mockNotifications = [
  {
    id: "1",
    type: "like",
    user: {
      id: "user1",
      username: "sarah_green",
      full_name: "Sarah Green",
      avatar_url: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
    },
    content: "liked your post about solar panel installation",
    post_preview: "Just installed 20 solar panels on our community center! 🌞",
    created_at: "2024-01-15T10:30:00Z",
    read: false,
  },
  {
    id: "2",
    type: "comment",
    user: {
      id: "user2",
      username: "eco_marcus",
      full_name: "Marcus Johnson",
      avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    },
    content: "commented on your post",
    comment_preview: "This is amazing! How long did the installation take?",
    post_preview: "Just installed 20 solar panels...",
    created_at: "2024-01-15T09:15:00Z",
    read: false,
  },
  {
    id: "3",
    type: "follow",
    user: {
      id: "user3",
      username: "green_tech_co",
      full_name: "GreenTech Solutions",
      avatar_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    },
    content: "started following you",
    created_at: "2024-01-14T16:45:00Z",
    read: true,
  },
  {
    id: "4",
    type: "repost",
    user: {
      id: "user4",
      username: "climate_action_now",
      full_name: "Climate Action Network",
      avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
    },
    content: "reposted your post",
    post_preview: "Week 3 of our zero-waste challenge! Our family has reduced waste by 90%...",
    created_at: "2024-01-14T14:20:00Z",
    read: true,
  },
  {
    id: "5",
    type: "mention",
    user: {
      id: "user5",
      username: "urban_gardener",
      full_name: "Maya Patel",
      avatar_url: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    },
    content: "mentioned you in a post",
    post_preview: "Thanks to @you for the amazing gardening tips! My balcony garden is thriving...",
    created_at: "2024-01-14T12:00:00Z",
    read: true,
  },
]

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
  const [notifications, setNotifications] = useState(mockNotifications)
  const [activeTab, setActiveTab] = useState("all")

  const unreadCount = notifications.filter((n) => !n.read).length

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const filteredNotifications = notifications.filter((notification) => {
    if (activeTab === "all") return true
    if (activeTab === "unread") return !notification.read
    return notification.type === activeTab
  })

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
                        <AvatarFallback>{notification.user.full_name.charAt(0)}</AvatarFallback>
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
