"use client"

import { useState } from "react"
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
} from "lucide-react"

const mockConversations = [
  {
    id: "1",
    user: {
      id: "user1",
      username: "sarah_green",
      full_name: "Sarah Green",
      avatar_url: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
      online: true,
    },
    last_message: "Thanks for sharing that solar panel guide! Really helpful 🌞",
    last_message_time: "2024-01-15T10:30:00Z",
    unread_count: 2,
  },
  {
    id: "2",
    user: {
      id: "user2",
      username: "eco_marcus",
      full_name: "Marcus Johnson",
      avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
      online: false,
    },
    last_message: "Let's collaborate on the zero-waste workshop next month",
    last_message_time: "2024-01-14T16:45:00Z",
    unread_count: 0,
  },
  {
    id: "3",
    user: {
      id: "user3",
      username: "green_tech_co",
      full_name: "GreenTech Solutions",
      avatar_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      online: true,
    },
    last_message: "We'd love to feature your community project in our newsletter",
    last_message_time: "2024-01-14T14:20:00Z",
    unread_count: 1,
  },
]

const mockMessages = [
  {
    id: "1",
    sender_id: "user1",
    content: "Hey! I saw your post about the community solar project. That's amazing work!",
    created_at: "2024-01-15T09:00:00Z",
    is_own: false,
    reactions: [{ emoji: "👍", count: 1, reacted_by_user: false }],
    reply_to: null,
  },
  {
    id: "2",
    sender_id: "current_user",
    content: "Thank you! It's been a long journey but seeing the impact makes it all worth it 🌞",
    created_at: "2024-01-15T09:05:00Z",
    is_own: true,
    reactions: [{ emoji: "❤️", count: 1, reacted_by_user: false }],
    reply_to: null,
  },
  {
    id: "3",
    sender_id: "user1",
    content:
      "I'm working on a similar project in my neighborhood. Would you mind sharing some tips on getting community buy-in?",
    created_at: "2024-01-15T09:10:00Z",
    is_own: false,
    reactions: [],
    reply_to: null,
  },
  {
    id: "4",
    sender_id: "current_user",
    content:
      "The key is starting with education. I can send you the presentation we used for our first community meeting.",
    created_at: "2024-01-15T09:15:00Z",
    is_own: true,
    reactions: [{ emoji: "🙏", count: 1, reacted_by_user: false }],
    reply_to: "3",
  },
  {
    id: "5",
    sender_id: "user1",
    content: "Thanks for sharing that solar panel guide! Really helpful 🌞",
    created_at: "2024-01-15T10:30:00Z",
    is_own: false,
    reactions: [],
    reply_to: null,
  },
]

export default function MessagesPage() {
  const [conversations, setConversations] = useState(mockConversations)
  const [selectedConversation, setSelectedConversation] = useState(conversations[0])
  const [messages, setMessages] = useState(mockMessages)
  const [newMessage, setNewMessage] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showBlockDialog, setShowBlockDialog] = useState(false)
  const [showReportDialog, setShowReportDialog] = useState(false)
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null)
  const { toast } = useToast()

  const handleSendMessage = () => {
    if (!newMessage.trim()) return

    const message = {
      id: Date.now().toString(),
      sender_id: "current_user",
      content: newMessage,
      created_at: new Date().toISOString(),
      is_own: true,
      reactions: [],
      reply_to: replyingTo,
    }

    setMessages((prev) => [...prev, message])
    setNewMessage("")
    setReplyingTo(null)
  }

  const handleEmojiSelect = (emoji: string) => {
    setNewMessage((prev) => prev + emoji)
  }

  const handleMessageReaction = (messageId: string, emoji: string) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === messageId) {
          const existingReaction = msg.reactions?.find((r) => r.emoji === emoji)
          if (existingReaction) {
            return {
              ...msg,
              reactions: msg.reactions?.map((r) =>
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
      description: `${selectedConversation?.user.full_name} has been blocked`,
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
    (conv) =>
      conv.user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.user.username.toLowerCase().includes(searchQuery.toLowerCase()),
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
                  {filteredConversations.map((conversation) => (
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
                            <AvatarImage src={conversation.user.avatar_url || "/placeholder.svg"} />
                            <AvatarFallback>{conversation.user.full_name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          {conversation.user.online && (
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                              {conversation.user.full_name}
                            </p>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-gray-500">
                                {formatLastMessageTime(conversation.last_message_time)}
                              </span>
                              {conversation.unread_count > 0 && (
                                <Badge className="bg-green-500 text-white">{conversation.unread_count}</Badge>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                            {conversation.last_message}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
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
                        <AvatarImage src={selectedConversation.user.avatar_url || "/placeholder.svg"} />
                        <AvatarFallback>{selectedConversation.user.full_name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      {selectedConversation.user.online && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        {selectedConversation.user.full_name}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedConversation.user.online ? "Online" : "Offline"}
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
                  {messages.map((message) => (
                    <div key={message.id} className={`flex ${message.is_own ? "justify-end" : "justify-start"}`}>
                      <div className="group relative max-w-xs lg:max-w-md">
                        <div
                          className={`px-4 py-2 rounded-lg ${
                            message.is_own
                              ? "bg-green-500 text-white"
                              : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
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
                                    : selectedConversation?.user.full_name}
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
                              {message.reactions.map((reaction, index) => (
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
                  ))}
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
              Are you sure you want to block {selectedConversation?.user.full_name}? They won't be able to message you
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
              Help us keep Honua safe. What's happening with {selectedConversation?.user.full_name}?
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
