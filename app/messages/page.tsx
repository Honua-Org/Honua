"use client"

import { useState, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { useSession } from '@supabase/auth-helpers-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import MainLayout from "@/components/main-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import EmojiPicker from "@/components/emoji-picker"
import {
  MessageCircle,
  Search,
  Send,
  Paperclip,
  Smile,
  MoreVertical,
  Phone,
  Video,
  Reply,
  Copy,
  Trash2,
  Flag,
  UserX,
  AlertTriangle,
  Loader2,
} from "lucide-react"

export default function MessagesPage() {
  const searchParams = useSearchParams()
  const session = useSession()
  const supabase = createClientComponentClient()
  const [conversations, setConversations] = useState<any[]>([])
  const [selectedConversation, setSelectedConversation] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showBlockDialog, setShowBlockDialog] = useState(false)
  const [showReportDialog, setShowReportDialog] = useState(false)
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [sendingMessage, setSendingMessage] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Fetch conversations
  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/conversations')
      if (response.ok) {
        const data = await response.json()
        setConversations(data)
        if (data.length > 0 && !selectedConversation) {
          setSelectedConversation(data[0])
        }
      }
    } catch (error) {
      console.error('Error fetching conversations:', error)
      toast({
        title: "Error",
        description: "Failed to load conversations",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Fetch messages for selected conversation
  const fetchMessages = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/messages?conversation_id=${conversationId}`)
      if (response.ok) {
        const data = await response.json()
        // Add is_own property to determine message alignment
        const messagesWithOwnership = data.map((message: any) => ({
          ...message,
          is_own: message.sender_id === session?.user?.id
        }))
        setMessages(messagesWithOwnership)
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive"
      })
    }
  }

  // Create or get conversation with a user
  const createConversation = async (username: string) => {
    try {
      // First, get the user's profile by username
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .eq('username', username)
        .single()

      if (error || !profile) {
        toast({
          title: "Error",
          description: "User not found",
          variant: "destructive"
        })
        return
      }

      // Create or get conversation
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          participant_id: profile.id
        })
      })

      if (response.ok) {
        const { conversation } = await response.json()
        
        // Create conversation object for UI
        const newConversation = {
          id: conversation.id,
          otherParticipant: profile,
          latestMessage: null,
          updated_at: conversation.updated_at,
          created_at: conversation.created_at
        }

        // Check if conversation already exists in state
        const existingIndex = conversations.findIndex(conv => conv.id === conversation.id)
        if (existingIndex === -1) {
          setConversations(prev => [newConversation, ...prev])
        }
        
        setSelectedConversation(newConversation)
        setMessages([])
        
        toast({
          title: "Conversation started",
          description: `You can now message ${profile.full_name}`,
        })
      }
    } catch (error) {
      console.error('Error creating conversation:', error)
      toast({
        title: "Error",
        description: "Failed to start conversation",
        variant: "destructive"
      })
    }
  }

  // Load conversations on mount and set up real-time subscription
  useEffect(() => {
    if (session) {
      fetchConversations()
      
      // Set up real-time subscription for conversation updates
      const conversationsChannel = supabase
        .channel('conversations')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'conversations',
            filter: `or(participant_one_id.eq.${session.user.id},participant_two_id.eq.${session.user.id})`
          },
          () => {
            // Refetch conversations when any conversation is updated
            fetchConversations()
          }
        )
        .subscribe()
      
      return () => {
        supabase.removeChannel(conversationsChannel)
      }
    }
  }, [session])

  // Load messages when conversation changes and set up real-time subscription
  useEffect(() => {
    if (selectedConversation?.id) {
      fetchMessages(selectedConversation.id)
      
      // Set up real-time subscription for new messages
      const channel = supabase
        .channel(`messages:${selectedConversation.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${selectedConversation.id}`
          },
          async (payload) => {
            // Fetch the complete message with sender profile
            const { data: newMessage, error } = await supabase
              .from('messages')
              .select(`
                *,
                sender:profiles!messages_sender_id_fkey (
                  id,
                  username,
                  full_name,
                  avatar_url
                )
              `)
              .eq('id', payload.new.id)
              .single()
            
            if (!error && newMessage) {
              // Add is_own property to determine message alignment
              const messageWithOwnership = {
                ...newMessage,
                is_own: newMessage.sender_id === session?.user?.id
              }
              
              setMessages(prev => {
                // Avoid duplicates
                if (prev.some(msg => msg.id === messageWithOwnership.id)) {
                  return prev
                }
                return [...prev, messageWithOwnership]
              })
              
              // Update conversation's latest message
              setConversations(prev => prev.map(conv => 
                conv.id === selectedConversation.id 
                  ? { ...conv, latestMessage: messageWithOwnership, updated_at: messageWithOwnership.created_at }
                  : conv
              ))
            }
          }
        )
        .subscribe()
      
      // Cleanup subscription on unmount or conversation change
      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [selectedConversation, session])

  // Handle user parameter from URL to start a conversation
  useEffect(() => {
    const userParam = searchParams.get('user')
    if (userParam && session && conversations.length >= 0) {
      // Check if conversation with this user already exists
      const existingConversation = conversations.find(
        conv => conv.otherParticipant && conv.otherParticipant.username === userParam
      )
      
      if (existingConversation) {
        // Select existing conversation
        setSelectedConversation(existingConversation)
      } else {
        // Create new conversation with the user
        createConversation(userParam)
      }
    }
  }, [searchParams, session, conversations])

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || sendingMessage) return

    setSendingMessage(true)
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversation_id: selectedConversation.id,
          content: newMessage.trim(),
        })
      })

      if (response.ok) {
        const message = await response.json()
        // Add is_own property for proper alignment
        const messageWithOwnership = {
          ...message,
          is_own: true // This is always true for messages we send
        }
        
        setMessages(prev => {
          // Avoid duplicates in case real-time subscription fires
          if (prev.some(msg => msg.id === messageWithOwnership.id)) {
            return prev
          }
          return [...prev, messageWithOwnership]
        })
        setNewMessage("")
        setReplyingTo(null)
        
        // Update conversation's latest message
        setConversations(prev => prev.map(conv => 
          conv.id === selectedConversation.id 
            ? { ...conv, latestMessage: messageWithOwnership, updated_at: messageWithOwnership.created_at }
            : conv
        ))
      } else {
        toast({
          title: "Error",
          description: "Failed to send message",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error sending message:', error)
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      })
    } finally {
      setSendingMessage(false)
    }
  }

  const handleEmojiSelect = (emoji: string) => {
    setNewMessage((prev) => prev + emoji)
  }

  const handleMessageReaction = (messageId: string, emoji: string) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === messageId) {
          const existingReaction = msg.reactions?.find((r: { emoji: string; count: number; reacted_by_user: boolean }) => r.emoji === emoji)
          if (existingReaction) {
            return {
              ...msg,
              reactions: msg.reactions?.map((r: { emoji: string; count: number; reacted_by_user: boolean }) =>
                r.emoji === emoji
                  ? {
                      ...r,
                      count: r.reacted_by_user ? r.count - 1 : r.count + 1,
                      reacted_by_user: !r.reacted_by_user,
                    }
                  : r,
              ),
            }
          } else {
            return {
              ...msg,
              reactions: [...(msg.reactions || []), { emoji, count: 1, reacted_by_user: true }],
            }
          }
        }
        return msg
      }),
    )
  }

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content)
    toast({
      title: "Message copied",
      description: "Message content copied to clipboard",
    })
  }

  const handleDeleteMessage = (messageId: string) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== messageId))
    toast({
      title: "Message deleted",
      description: "Message has been deleted from your view",
    })
    setShowDeleteDialog(false)
  }

  const handleDeleteConversation = () => {
    setConversations((prev) => prev.filter((conv) => conv.id !== selectedConversation?.id))
    setSelectedConversation(conversations[0])
    toast({
      title: "Conversation deleted",
      description: "Conversation has been removed from your messages",
    })
    setShowDeleteDialog(false)
  }

  const handleBlockUser = () => {
    toast({
      title: "User blocked",
      description: `${selectedConversation?.otherParticipant?.full_name || selectedConversation?.otherParticipant?.username || 'User'} has been blocked`,
    })
    setShowBlockDialog(false)
  }

  const handleReportUser = () => {
    toast({
      title: "Report submitted",
      description: "Thank you for your report. We'll review it shortly.",
    })
    setShowReportDialog(false)
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

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

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto p-4 pb-20 lg:pb-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-8rem)]">
          {/* Conversations List */}
          <div className="lg:col-span-1">
            <Card className="h-full">
              <CardContent className="p-0">
                <div className="p-4 border-b">
                  <div className="flex items-center justify-between mb-4">
                    <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Messages</h1>
                    <Button size="sm" className="sustainability-gradient">
                      New Chat
                    </Button>
                  </div>
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

                <div className="overflow-y-auto max-h-[calc(100vh-16rem)]">
                  {loading ? (
                    <div className="flex items-center justify-center p-8">
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span className="ml-2">Loading conversations...</span>
                    </div>
                  ) : filteredConversations.length === 0 ? (
                    <div className="text-center p-8 text-gray-500">
                      <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No conversations yet</p>
                      <p className="text-sm">Start a conversation by visiting a user's profile</p>
                    </div>
                  ) : (
                    filteredConversations.map((conversation) => (
                      <div
                        key={conversation.id}
                        className={`p-4 border-b cursor-pointer transition-colors ${
                          selectedConversation?.id === conversation.id
                            ? "bg-green-50 dark:bg-green-900/20"
                            : "hover:bg-gray-50 dark:hover:bg-gray-800"
                        }`}
                        onClick={() => setSelectedConversation(conversation)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <Avatar className="w-12 h-12">
                              <AvatarImage src={conversation.otherParticipant?.avatar_url || "/placeholder.svg"} />
                              <AvatarFallback>{(conversation.otherParticipant?.full_name || conversation.otherParticipant?.username || 'U').charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                                {conversation.otherParticipant?.full_name || conversation.otherParticipant?.username || 'Unknown User'}
                              </p>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs text-gray-500">
                                  {conversation.latestMessage ? formatLastMessageTime(conversation.latestMessage.created_at) : formatLastMessageTime(conversation.updated_at)}
                                </span>
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                              {conversation.latestMessage?.content || 'Start a conversation...'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-2">
            {selectedConversation ? (
              <Card className="h-full flex flex-col">
                {/* Chat Header */}
                <div className="p-4 border-b flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={selectedConversation.otherParticipant?.avatar_url || "/placeholder.svg"} />
                        <AvatarFallback>{(selectedConversation.otherParticipant?.full_name || selectedConversation.otherParticipant?.username || 'U').charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      {selectedConversation.otherParticipant?.online && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        {selectedConversation.otherParticipant?.full_name || selectedConversation.otherParticipant?.username || 'Unknown User'}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        @{selectedConversation.otherParticipant?.username || 'unknown'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm">
                      <Phone className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Video className="w-4 h-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setShowBlockDialog(true)}>
                          <UserX className="mr-2 h-4 w-4" />
                          Block User
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setShowReportDialog(true)}>
                          <Flag className="mr-2 h-4 w-4" />
                          Report User
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setShowDeleteDialog(true)}
                          className="text-red-600 dark:text-red-400"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Conversation
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      <div className="text-center">
                        <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No messages yet</p>
                        <p className="text-sm">Start the conversation!</p>
                      </div>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div key={message.id} className={`flex ${message.is_own ? "justify-end" : "justify-start"}`}>
                      <div className="group relative max-w-xs lg:max-w-md">
                        <div
                          className={`px-4 py-2 rounded-lg ${
                            message.is_own
                              ? "bg-green-500 text-white ml-auto"
                              : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 mr-auto"
                          }`}
                        >
                          {/* Reply Reference */}
                          {message.reply_to && (
                            <div
                              className={`mb-2 pb-2 border-l-2 pl-2 text-xs opacity-75 ${
                                message.is_own
                                  ? "border-green-300 text-green-100"
                                  : "border-gray-300 text-gray-500 dark:border-gray-600 dark:text-gray-400"
                              }`}
                            >
                              <div className="flex items-center space-x-1 mb-1">
                                <Reply className="w-3 h-3" />
                                <span className="font-medium">
                                  {messages.find((m) => m.id === message.reply_to)?.is_own
                                    ? "You"
                                    : selectedConversation?.otherParticipant?.full_name || selectedConversation?.otherParticipant?.username || 'Unknown User'}
                                </span>
                              </div>
                              <p className="truncate">
                                {messages.find((m) => m.id === message.reply_to)?.content || "Message not found"}
                              </p>
                            </div>
                          )}

                          <p className="text-sm">{message.content}</p>
                          <p
                            className={`text-xs mt-1 ${
                              message.is_own ? "text-green-100" : "text-gray-500 dark:text-gray-400"
                            }`}
                          >
                            {formatTime(message.created_at)}
                          </p>

                          {/* Message Reactions */}
                          {message.reactions && message.reactions.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {message.reactions.map((reaction: { emoji: string; count: number; reacted_by_user: boolean }, index: number) => (
                                <button
                                  key={index}
                                  onClick={() => handleMessageReaction(message.id, reaction.emoji)}
                                  className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${
                                    reaction.reacted_by_user
                                      ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                      : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                                  }`}
                                >
                                  <span>{reaction.emoji}</span>
                                  <span>{reaction.count}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Message Actions */}
                        <div className="absolute top-0 right-0 transform translate-x-full opacity-0 group-hover:opacity-100 transition-opacity">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="w-3 h-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setReplyingTo(message.id)}>
                                <Reply className="mr-2 h-4 w-4" />
                                Reply
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleCopyMessage(message.content)}>
                                <Copy className="mr-2 h-4 w-4" />
                                Copy
                              </DropdownMenuItem>
                              <EmojiPicker onEmojiSelect={(emoji) => handleMessageReaction(message.id, emoji)}>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                  <Smile className="mr-2 h-4 w-4" />
                                  React
                                </DropdownMenuItem>
                              </EmojiPicker>
                              {message.is_own && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedMessageId(message.id)
                                    setShowDeleteDialog(true)
                                  }}
                                  className="text-red-600 dark:text-red-400"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              )}
                              {!message.is_own && (
                                <DropdownMenuItem onClick={() => setShowReportDialog(true)}>
                                  <Flag className="mr-2 h-4 w-4" />
                                  Report
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Reply Preview */}
                {replyingTo && (
                  <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-t">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Reply className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Replying to: {messages.find((m) => m.id === replyingTo)?.content.slice(0, 50)}...
                        </span>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setReplyingTo(null)}>
                        ×
                      </Button>
                    </div>
                  </div>
                )}

                {/* Message Input */}
                <div className="p-4 border-t">
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm">
                      <Paperclip className="w-4 h-4" />
                    </Button>
                    <div className="flex-1 relative">
                      <Textarea
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault()
                            handleSendMessage()
                          }
                        }}
                        className="min-h-[40px] max-h-[120px] resize-none pr-10"
                      />
                      <EmojiPicker onEmojiSelect={handleEmojiSelect}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute right-1 top-1/2 transform -translate-y-1/2"
                        >
                          <Smile className="w-4 h-4" />
                        </Button>
                      </EmojiPicker>
                    </div>
                    <Button onClick={handleSendMessage} className="sustainability-gradient">
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="h-full flex items-center justify-center">
                <CardContent className="text-center">
                  <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Select a conversation</h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Choose a conversation from the list to start messaging
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {selectedMessageId ? "Message" : "Conversation"}</DialogTitle>
            <DialogDescription>
              {selectedMessageId
                ? "This message will be deleted from your view only. The other person will still see it."
                : "This conversation will be deleted from your messages only. The other person will still have access to it."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2">
            <Button variant="ghost" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedMessageId) {
                  handleDeleteMessage(selectedMessageId)
                  setSelectedMessageId(null)
                } else {
                  handleDeleteConversation()
                }
              }}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Block User Dialog */}
      <Dialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Block User</DialogTitle>
            <DialogDescription>
              Are you sure you want to block {selectedConversation?.otherParticipant?.full_name || selectedConversation?.otherParticipant?.username || 'this user'}? They won't be able to message you
              or see your posts.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2">
            <Button variant="ghost" onClick={() => setShowBlockDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleBlockUser}>
              Block User
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Report User Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report User</DialogTitle>
            <DialogDescription>
              Help us keep Honua safe. What's happening with {selectedConversation?.otherParticipant?.full_name || selectedConversation?.otherParticipant?.username || 'this user'}?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <AlertTriangle className="mr-2 h-4 w-4" />
                Harassment or bullying
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Flag className="mr-2 h-4 w-4" />
                Spam or fake account
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <AlertTriangle className="mr-2 h-4 w-4" />
                Inappropriate content
              </Button>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="ghost" onClick={() => setShowReportDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleReportUser} className="sustainability-gradient">
                Submit Report
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  )
}
