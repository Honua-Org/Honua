"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  ArrowLeft,
  Phone,
  Video,
  MoreVertical,
  Send,
  Smile,
  Paperclip,
  Reply,
  Copy,
  Trash2,
  MoreHorizontal,
  X
} from "lucide-react"
import EmojiPicker from "@/components/emoji-picker"

interface Message {
  id: string
  content: string
  sender_id: string
  created_at: string
  reply_to?: {
    id: string
    content: string
    sender: {
      username: string
      full_name: string
    }
  }
  reactions?: Array<{
    emoji: string
    user_id: string
    user: {
      username: string
    }
  }>
}

interface Conversation {
  id: string
  otherParticipant: {
    id: string
    username: string
    full_name: string
    avatar_url?: string
    online?: boolean
  }
}

interface ChatInterfaceProps {
  conversation: Conversation
  messages: Message[]
  currentUserId: string
  loading: boolean
  sendingMessage: boolean
  showMobileHeader?: boolean
  onSendMessage: (content: string, replyToId?: string) => void
  onDeleteMessage?: (messageId: string) => void
  onDeleteConversation?: () => void
  onBlockUser?: () => void
  onReportUser?: () => void
  className?: string
}

export default function ChatInterface({
  conversation,
  messages,
  currentUserId,
  loading,
  sendingMessage,
  showMobileHeader = false,
  onSendMessage,
  onDeleteMessage,
  onDeleteConversation,
  onBlockUser,
  onReportUser,
  className = ""
}: ChatInterfaceProps) {
  const [messageInput, setMessageInput] = useState("")
  const [replyingTo, setReplyingTo] = useState<Message | null>(null)
  const [deleteMessageId, setDeleteMessageId] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showBlockDialog, setShowBlockDialog] = useState(false)
  const [showReportDialog, setShowReportDialog] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const router = useRouter()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const handleSendMessage = () => {
    if (messageInput.trim() && !sendingMessage) {
      onSendMessage(messageInput.trim(), replyingTo?.id)
      setMessageInput("")
      setReplyingTo(null)
    }
  }

  const handleEmojiSelect = (emoji: string) => {
    setMessageInput(prev => prev + emoji)
    textareaRef.current?.focus()
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content)
  }

  const handleReply = (message: Message) => {
    setReplyingTo(message)
    textareaRef.current?.focus()
  }

  const handleDeleteMessage = (messageId: string) => {
    setDeleteMessageId(messageId)
    setShowDeleteDialog(true)
  }

  const confirmDeleteMessage = () => {
    if (deleteMessageId && onDeleteMessage) {
      onDeleteMessage(deleteMessageId)
    }
    setDeleteMessageId(null)
    setShowDeleteDialog(false)
  }

  return (
    <Card className={`h-full flex flex-col ${className}`}>
      {/* Header */}
      {showMobileHeader && (
        <div className="p-4 border-b bg-white dark:bg-gray-900 flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          <div className="flex items-center space-x-3 flex-1">
            <div className="relative">
              <Avatar className="w-10 h-10">
                <AvatarImage 
                  src={conversation.otherParticipant?.avatar_url || "/placeholder.svg"} 
                  alt={conversation.otherParticipant?.full_name}
                />
                <AvatarFallback className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                  {(conversation.otherParticipant?.full_name || conversation.otherParticipant?.username || 'U').charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {conversation.otherParticipant?.online && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></div>
              )}
            </div>
            
            <div className="flex-1">
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">
                {conversation.otherParticipant?.full_name || conversation.otherParticipant?.username}
              </h2>
              {conversation.otherParticipant?.online && (
                <p className="text-sm text-green-600 dark:text-green-400">Online</p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" className="p-2">
              <Phone className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="sm" className="p-2">
              <Video className="w-5 h-5" />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="p-2">
                  <MoreVertical className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowBlockDialog(true)}>
                  Block User
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowReportDialog(true)}>
                  Report User
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-red-600 dark:text-red-400"
                >
                  Delete Conversation
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <CardContent className="flex-1 p-0 overflow-hidden">
        <div className="h-full overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
                <p className="text-gray-600 dark:text-gray-400">Loading messages...</p>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-gray-600 dark:text-gray-400 mb-2">No messages yet</p>
                <p className="text-sm text-gray-500 dark:text-gray-500">Start the conversation!</p>
              </div>
            </div>
          ) : (
            messages.map((message) => {
              const isOwnMessage = message.sender_id === currentUserId
              
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[70%] group`}>
                    {/* Reply preview */}
                    {message.reply_to && (
                      <div className={`mb-1 ${isOwnMessage ? 'text-right' : 'text-left'}`}>
                        <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-lg p-2 border-l-4 border-green-500">
                          <p className="font-medium">{message.reply_to.sender.full_name || message.reply_to.sender.username}</p>
                          <p className="truncate">{message.reply_to.content}</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Message bubble */}
                    <div className="relative">
                      <div
                        className={`rounded-2xl px-4 py-2 break-words ${
                          isOwnMessage
                            ? 'bg-green-500 text-white rounded-br-md'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-md'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{message.content}</p>
                        
                        {/* Reactions */}
                        {message.reactions && message.reactions.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {message.reactions.map((reaction, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {reaction.emoji}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      {/* Message actions */}
                      <div className={`absolute top-0 ${isOwnMessage ? 'left-0 -translate-x-full' : 'right-0 translate-x-full'} opacity-0 group-hover:opacity-100 transition-opacity`}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align={isOwnMessage ? "end" : "start"}>
                            <DropdownMenuItem onClick={() => handleReply(message)}>
                              <Reply className="w-4 h-4 mr-2" />
                              Reply
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleCopyMessage(message.content)}>
                              <Copy className="w-4 h-4 mr-2" />
                              Copy
                            </DropdownMenuItem>
                            {isOwnMessage && (
                              <DropdownMenuItem 
                                onClick={() => handleDeleteMessage(message.id)}
                                className="text-red-600 dark:text-red-400"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    
                    {/* Timestamp */}
                    <div className={`mt-1 ${isOwnMessage ? 'text-right' : 'text-left'}`}>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatTime(message.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </CardContent>

      {/* Reply Preview */}
      {replyingTo && (
        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-t">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Replying to {replyingTo.sender_id === currentUserId ? 'yourself' : conversation.otherParticipant?.full_name}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                {replyingTo.content}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReplyingTo(null)}
              className="p-1"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className="p-4 border-t bg-white dark:bg-gray-900">
        <div className="flex items-end space-x-2">
          <Button variant="ghost" size="sm" className="p-2 flex-shrink-0">
            <Paperclip className="w-5 h-5" />
          </Button>
          
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              placeholder="Type a message..."
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={handleKeyPress}
              className="min-h-[40px] max-h-32 resize-none pr-12"
              rows={1}
            />
            
            <div className="absolute right-2 bottom-2">
              <EmojiPicker onEmojiSelect={handleEmojiSelect}>
                <Button variant="ghost" size="sm" className="p-1">
                  <Smile className="w-5 h-5" />
                </Button>
              </EmojiPicker>
            </div>
          </div>
          
          <Button
            onClick={handleSendMessage}
            disabled={!messageInput.trim() || sendingMessage}
            className="sustainability-gradient p-2 flex-shrink-0"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Dialogs */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Message</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this message? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteMessage}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Block User</DialogTitle>
            <DialogDescription>
              Are you sure you want to block {conversation.otherParticipant?.full_name}? You won&apos;t receive messages from them.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBlockDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => { onBlockUser?.(); setShowBlockDialog(false); }}>
              Block
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report User</DialogTitle>
            <DialogDescription>
              Are you sure you want to report {conversation.otherParticipant?.full_name}? This will notify our moderation team.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReportDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => { onReportUser?.(); setShowReportDialog(false); }}>
              Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}