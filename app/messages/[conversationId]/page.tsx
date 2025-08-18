'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { ArrowLeft, Phone, Video, MoreVertical, Send, Paperclip, Smile } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { ChatInterface } from '@/components/ChatInterface'
import { MainLayout } from '@/components/main-layout'
import { useToast } from '@/hooks/use-toast'

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

interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  created_at: string
  reply_to?: string
  sender?: {
    id: string
    username: string
    full_name: string
    avatar_url: string
  }
  reply_to_message?: {
    id: string
    content: string
    sender: {
      id: string
      username: string
      full_name: string
    }
  }
  reactions?: Array<{
    emoji: string
    count: number
    reacted_by_user: boolean
  }>
}

export default function ConversationPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const { toast } = useToast()
  const supabase = createClientComponentClient()
  
  const conversationId = params.conversationId as string
  
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [messageInput, setMessageInput] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Fetch conversation details
  const fetchConversation = async () => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}`)
      if (response.ok) {
        const data = await response.json()
        setConversation(data)
      } else {
        toast({
          title: "Error",
          description: "Conversation not found",
          variant: "destructive"
        })
        router.push('/messages')
      }
    } catch (error) {
      console.error('Error fetching conversation:', error)
      toast({
        title: "Error",
        description: "Failed to load conversation",
        variant: "destructive"
      })
      router.push('/messages')
    }
  }

  // Fetch messages for the conversation
  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/messages?conversationId=${conversationId}`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data)
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setLoading(false)
    }
  }

  // Send message
  const handleSendMessage = async () => {
    if (!messageInput.trim() || !conversation || sendingMessage) return

    setSendingMessage(true)
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId: conversation.id,
          content: messageInput.trim(),
          replyToId: replyingTo
        }),
      })

      if (response.ok) {
        setMessageInput('')
        setReplyingTo(null)
        // Message will be added via real-time subscription
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

  // Handle emoji selection
  const handleEmojiSelect = (emoji: string) => {
    setMessageInput(prev => prev + emoji)
    textareaRef.current?.focus()
  }

  // Load conversation and messages on mount
  useEffect(() => {
    if (!session?.user?.id || !conversationId) return
    
    fetchConversation()
    fetchMessages()
  }, [session, conversationId])

  // Set up real-time subscriptions
  useEffect(() => {
    if (!session?.user?.id || !conversationId) return

    const messageChannel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          // Fetch complete message with sender profile
          const { data: messageWithSender } = await supabase
            .from('messages')
            .select(`
              *,
              sender:profiles!messages_sender_id_fkey(*),
              reply_to_message:messages!messages_reply_to_fkey(
                id,
                content,
                sender:profiles!messages_sender_id_fkey(*)
              )
            `)
            .eq('id', payload.new.id)
            .single()

          if (messageWithSender) {
            setMessages(prev => {
              // Prevent duplicates
              if (prev.some(msg => msg.id === messageWithSender.id)) {
                return prev
              }
              return [...prev, messageWithSender]
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(messageChannel)
    }
  }, [session, conversationId])

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (!session) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Please sign in</h2>
            <p className="text-gray-600">You need to be signed in to view messages</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading conversation...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (!conversation) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Conversation not found</h2>
            <p className="text-gray-600 mb-4">This conversation may have been deleted or you don't have access to it.</p>
            <Button onClick={() => router.push('/messages')}>
              Back to Messages
            </Button>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="flex flex-col h-full">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center p-4 border-b border-gray-200 bg-white">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/messages')}
            className="mr-3"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center space-x-3 flex-1">
            <Avatar className="h-10 w-10">
              <AvatarImage src={conversation.otherParticipant?.avatar_url} />
              <AvatarFallback>
                {conversation.otherParticipant?.full_name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="font-semibold text-gray-900">
                {conversation.otherParticipant?.full_name || 'Unknown User'}
              </h2>
              <p className="text-sm text-gray-500">
                {conversation.otherParticipant?.is_online ? 'Online' : 'Offline'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm">
              <Phone className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="sm">
              <Video className="h-5 w-5" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="text-red-600">
                  Block User
                </DropdownMenuItem>
                <DropdownMenuItem className="text-red-600">
                  Report User
                </DropdownMenuItem>
                <DropdownMenuItem className="text-red-600">
                  Delete Conversation
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Desktop/Mobile Chat Interface */}
        <div className="flex-1 hidden lg:block">
          <ChatInterface
            conversation={conversation}
            messages={messages}
            messageInput={messageInput}
            setMessageInput={setMessageInput}
            sendingMessage={sendingMessage}
            replyingTo={replyingTo}
            setReplyingTo={setReplyingTo}
            onSendMessage={handleSendMessage}
            onEmojiSelect={handleEmojiSelect}
            textareaRef={textareaRef}
            messagesEndRef={messagesEndRef}
            currentUserId={session.user.id}
          />
        </div>

        {/* Mobile Chat Interface */}
        <div className="flex-1 lg:hidden flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-gray-500">
                  <p>No messages yet</p>
                  <p className="text-sm">Start the conversation!</p>
                </div>
              </div>
            ) : (
              messages.map((message) => {
                const isOwn = message.sender_id === session?.user?.id
                return (
                  <div
                    key={message.id}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-xs relative`}>
                      {/* Reply reference */}
                      {message.reply_to_message && (
                        <div className="mb-1 p-2 bg-gray-100 rounded-lg border-l-4 border-blue-500 text-sm">
                          <p className="font-medium text-gray-700">
                            {message.reply_to_message.sender?.full_name || 'Unknown'}
                          </p>
                          <p className="text-gray-600 truncate">
                            {message.reply_to_message.content}
                          </p>
                        </div>
                      )}
                      
                      <div
                        className={`px-4 py-2 rounded-lg ${
                          isOwn
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-900 border border-gray-200'
                        }`}
                      >
                        <p className="break-words">{message.content}</p>
                        <div className="flex items-center justify-between mt-1">
                          <span
                            className={`text-xs ${
                              isOwn ? 'text-blue-100' : 'text-gray-500'
                            }`}
                          >
                            {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="p-4 bg-white border-t border-gray-200">
            <div className="flex items-end space-x-2">
              <Button variant="ghost" size="sm" className="mb-2">
                <Paperclip className="h-4 w-4" />
              </Button>
              <div className="flex-1 relative">
                <Textarea
                  ref={textareaRef}
                  placeholder="Type a message..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                  className="min-h-[40px] max-h-32 resize-none pr-10"
                  rows={1}
                />
                <div className="absolute right-2 bottom-2">
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <Smile className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Button
                onClick={handleSendMessage}
                disabled={!messageInput.trim() || sendingMessage}
                className="mb-2"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}