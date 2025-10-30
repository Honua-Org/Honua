"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, Search, Loader2, Plus } from "lucide-react"

interface Conversation {
  id: string
  otherParticipant: {
    id: string
    username: string
    full_name: string
    avatar_url?: string
    online?: boolean
  }
  latestMessage?: {
    content: string
    created_at: string
    sender_id: string
  }
  updated_at: string
  created_at: string
  unread_count?: number
}

interface ConversationListProps {
  conversations: Conversation[]
  loading: boolean
  selectedConversationId?: string
  onConversationSelect?: (conversation: Conversation) => void
  showMobileView?: boolean
  className?: string
}

export default function ConversationList({
  conversations,
  loading,
  selectedConversationId,
  onConversationSelect,
  showMobileView = false,
  className = ""
}: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()

  const formatLastMessageTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return `${diffInHours}h`
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d`
    return date.toLocaleDateString()
  }

  const filteredConversations = conversations.filter(
    (conv) => {
      if (!conv.otherParticipant) return false
      const fullName = conv.otherParticipant.full_name || ''
      const username = conv.otherParticipant.username || ''
      return fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
             username.toLowerCase().includes(searchQuery.toLowerCase())
    }
  )

  const handleConversationClick = (conversation: Conversation) => {
    if (showMobileView) {
      // Navigate to individual chat page on mobile
      router.push(`/messages/${conversation.id}`)
    } else {
      // Call the selection handler for desktop split view
      onConversationSelect?.(conversation)
    }
  }

  const handleNewChat = () => {
    // TODO: Implement new chat functionality
    console.log("New chat clicked")
  }

  return (
    <Card className={`h-full ${className}`}>
      <CardContent className="p-0">
        {/* Header */}
        <div className="p-4 border-b bg-white dark:bg-gray-900">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Messages
            </h1>
            <Button 
              size="sm" 
              className="sustainability-gradient"
              onClick={handleNewChat}
            >
              <Plus className="w-4 h-4 mr-1" />
              New
            </Button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="overflow-y-auto max-h-[calc(100vh-16rem)]">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-6 h-6 animate-spin text-green-600" />
              <span className="ml-2 text-gray-600 dark:text-gray-400">Loading conversations...</span>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center p-8 text-gray-500">
              <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium mb-1">No conversations yet</p>
              <p className="text-sm">Start a conversation by visiting a user&apos;s profile</p>
            </div>
          ) : (
            filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`p-4 border-b cursor-pointer transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-800 active:bg-gray-100 dark:active:bg-gray-700 ${
                  selectedConversationId === conversation.id && !showMobileView
                    ? "bg-green-50 dark:bg-green-900/20 border-r-4 border-green-500"
                    : ""
                }`}
                onClick={() => handleConversationClick(conversation)}
              >
                <div className="flex items-center space-x-3">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <Avatar className="w-12 h-12">
                      <AvatarImage 
                        src={conversation.otherParticipant?.avatar_url || "/placeholder.svg"} 
                        alt={conversation.otherParticipant?.full_name || conversation.otherParticipant?.username}
                      />
                      <AvatarFallback className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                        {(conversation.otherParticipant?.full_name || conversation.otherParticipant?.username || 'U').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {/* Online indicator */}
                    {conversation.otherParticipant?.online && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {conversation.otherParticipant?.full_name || conversation.otherParticipant?.username || 'Unknown User'}
                      </p>
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {conversation.latestMessage 
                            ? formatLastMessageTime(conversation.latestMessage.created_at) 
                            : formatLastMessageTime(conversation.updated_at)
                          }
                        </span>
                        {conversation.unread_count && conversation.unread_count > 0 && (
                          <Badge className="bg-green-500 text-white text-xs min-w-[20px] h-5 rounded-full flex items-center justify-center">
                            {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {/* Last message preview */}
                    <div className="flex items-center space-x-1">
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate flex-1">
                        {conversation.latestMessage?.content || 'Start a conversation&hellip;'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}