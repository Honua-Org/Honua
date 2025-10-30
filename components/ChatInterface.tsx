"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { 
  Send, 
  Smile, 
  Paperclip, 
  MoreVertical, 
  Copy, 
  Trash2, 
  Flag, 
  ArrowLeft,
  Phone,
  Video,
  Info
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import EmojiPicker from "@/components/emoji-picker"

interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  created_at: string
  updated_at: string
  reply_to_id?: string
  sender?: {
    id: string
    username: string
    full_name: string
    avatar_url: string
  }
  reply_to?: {
    id: string
    content: string
    sender: {
      full_name: string
    }
  }
}

interface Conversation {
  id: string
  participant_one_id: string
  participant_two_id: string
  created_at: string
  updated_at: string
  otherParticipant?: {
    id: string
    username: string
    full_name: string
    avatar_url: string
    is_online: boolean
  }
}

interface ChatInterfaceProps {
  conversation: Conversation | null
  messages: Message[]
  loading: boolean
  currentUserId: string
  onSendMessage: (content: string, replyToId?: string) => void
  onDeleteMessage: (messageId: string) => void
  onDeleteConversation: (conversationId: string) => void
  showMobileView: boolean
  replyingTo?: Message | null
  onCancelReply?: () => void
}

export function ChatInterface({
  conversation,
  messages,
  loading,
  currentUserId,
  onSendMessage,
  onDeleteMessage,
  onDeleteConversation,
  showMobileView,
  replyingTo,
  onCancelReply
}: ChatInterfaceProps) {
  const [messageInput, setMessageInput] = useState("")
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [deleteMessageId, setDeleteMessageId] = useState<string | null>(null)
  const [showDeleteConversation, setShowDeleteConversation] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = () => {
    if (messageInput.trim() && conversation) {
      onSendMessage(messageInput.trim(), replyingTo?.id)
      setMessageInput("")
      onCancelReply?.()
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleEmojiSelect = (emoji: string) => {
    setMessageInput(prev => prev + emoji)
    setShowEmojiPicker(false)
  }

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content)
  }

  const formatMessageTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch {
      return "Just now"
    }
  }

  if (!conversation) {
    return (
      <div className="h-full flex items-center justify-center bg-muted/30">
        <div className="text-center text-muted-foreground">
          <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
            <Send className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-medium mb-2 text-foreground">Select a conversation</h3>
          <p className="text-sm">Choose a conversation from the list to start messaging</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Chat Header */}
      <div className="p-4 border-b border-border bg-background">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {showMobileView && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="p-3 min-h-[44px] min-w-[44px]"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            )}
            <div className="relative">
              <Avatar className="w-10 h-10">
                <AvatarImage
                  src={conversation.otherParticipant?.avatar_url}
                  alt={conversation.otherParticipant?.full_name}
                />
                <AvatarFallback>
                  {conversation.otherParticipant?.full_name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("") || "?"}
                </AvatarFallback>
              </Avatar>
              {conversation.otherParticipant?.is_online && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-primary border-2 border-background rounded-full" />
              )}
            </div>
            <div>
              <h2 className="font-semibold text-foreground">
                {conversation.otherParticipant?.full_name || "Unknown User"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {conversation.otherParticipant?.is_online ? "Online" : "Offline"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 md:gap-2">
            <Button variant="ghost" size="sm" className="p-3 min-h-[44px] min-w-[44px]">
              <Phone className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="sm" className="p-3 min-h-[44px] min-w-[44px]">
              <Video className="w-5 h-5" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="p-3 min-h-[44px] min-w-[44px]">
                  <MoreVertical className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Info className="w-4 h-4 mr-2" />
                  View Profile
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setShowDeleteConversation(true)}
                  className="text-red-600"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Conversation
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4">
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
                <div className="flex items-start gap-2 max-w-xs">
                  {i % 2 === 0 && <Skeleton className="w-8 h-8 rounded-full" />}
                  <Skeleton className="h-12 w-48 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <Send className="w-12 h-12 mx-auto mb-4 text-primary/50" />
              <p className="text-sm">No messages yet. Start the conversation!</p>
            </div>
          </div>
        ) : (
          messages.map((message) => {
            const isOwnMessage = message.sender_id === currentUserId
            return (
              <div
                key={message.id}
                className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
              >
                <div className={`flex items-start gap-2 max-w-xs lg:max-w-md xl:max-w-lg ${isOwnMessage ? "flex-row-reverse" : ""}`}>
                  {!isOwnMessage && (
                    <Avatar className="w-8 h-8">
                      <AvatarImage
                        src={message.sender?.avatar_url}
                        alt={message.sender?.full_name}
                      />
                      <AvatarFallback>
                        {message.sender?.full_name
                          ?.split(" ")
                          .map((n) => n[0])
                          .join("") || "?"}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div className={`group relative ${isOwnMessage ? "text-right" : ""}`}>
                    {message.reply_to && (
                      <div className={`text-xs text-muted-foreground mb-1 p-2 bg-muted rounded border-l-2 ${isOwnMessage ? "border-primary" : "border-border"}`}>
                        <p className="font-medium">{message.reply_to.sender.full_name}</p>
                        <p className="truncate">{message.reply_to.content}</p>
                      </div>
                    )}
                    <div
                      className={`px-4 py-3 rounded-lg ${isOwnMessage
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                    <div className={`flex items-center gap-2 mt-1 ${isOwnMessage ? "justify-end" : "justify-start"}`}>
                      <span className="text-xs text-muted-foreground">
                        {formatMessageTime(message.created_at)}
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 md:opacity-100 transition-opacity p-2 min-h-[32px] min-w-[32px]"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align={isOwnMessage ? "end" : "start"}>
                          <DropdownMenuItem onClick={() => copyMessage(message.content)}>
                            <Copy className="w-4 h-4 mr-2" />
                            Copy
                          </DropdownMenuItem>
                          {isOwnMessage && (
                            <DropdownMenuItem
                              onClick={() => setDeleteMessageId(message.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          )}
                          {!isOwnMessage && (
                            <DropdownMenuItem className="text-red-600">
                              <Flag className="w-4 h-4 mr-2" />
                              Report
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply Preview */}
      {replyingTo && (
        <div className="px-4 py-3 bg-muted/50 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Replying to {replyingTo.sender?.full_name}</p>
              <p className="text-sm text-foreground truncate">{replyingTo.content}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancelReply}
              className="p-2 min-h-[32px] min-w-[32px]"
            >
              ×
            </Button>
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className="p-4 border-t border-border bg-background">
        <div className="flex items-end gap-3 md:gap-2">
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-3 min-h-[44px] min-w-[44px]"
            >
              <Smile className="w-5 h-5" />
            </Button>
            {showEmojiPicker && (
              <div className="absolute bottom-12 left-0 z-50">
                <EmojiPicker onEmojiSelect={handleEmojiSelect}>
                  <div />
                </EmojiPicker>
              </div>
            )}
          </div>
          <Button variant="ghost" size="sm" className="p-3 min-h-[44px] min-w-[44px]">
            <Paperclip className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <Input
              placeholder="Type a message..."
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={handleKeyPress}
              className="resize-none"
            />
          </div>
          <Button
            onClick={handleSendMessage}
            disabled={!messageInput.trim()}
            className="p-3 min-h-[44px] min-w-[44px]"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Delete Message Dialog */}
      <AlertDialog open={!!deleteMessageId} onOpenChange={() => setDeleteMessageId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Message</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this message? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteMessageId) {
                  onDeleteMessage(deleteMessageId)
                  setDeleteMessageId(null)
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Conversation Dialog */}
      <AlertDialog open={showDeleteConversation} onOpenChange={setShowDeleteConversation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Conversation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this entire conversation? This action cannot be undone and will remove all messages.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (conversation) {
                  onDeleteConversation(conversation.id)
                  setShowDeleteConversation(false)
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}