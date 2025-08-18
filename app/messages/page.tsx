"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { useSession } from "@supabase/auth-helpers-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import ConversationList from "@/components/ConversationList"
import { ChatInterface } from "@/components/ChatInterface"
import MainLayout from "@/components/main-layout"
import { Suspense } from "react"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

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
  latestMessage?: {
    content: string
    created_at: string
    sender_id: string
  }
  unread_count?: number
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

function MessagesPageContent() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [messageInput, setMessageInput] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const session = useSession()
  const { toast } = useToast()
  const supabase = createClientComponentClient()
  const searchParams = useSearchParams()

  // Fetch conversations
  const fetchConversations = async () => {
    if (!session?.user?.id) return

    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          participant_1:profiles!participant_one_id(*),
          participant_2:profiles!participant_two_id(*),
          latest_message:messages(
            content,
            created_at,
            sender_id
          )
        `)
        .or(`participant_one_id.eq.${session.user.id},participant_two_id.eq.${session.user.id}`)
        .order('updated_at', { ascending: false })

      if (error) throw error

      const conversationsWithOtherParticipant = data.map(conv => {
        const otherParticipant = conv.participant_1.id === session.user.id 
          ? conv.participant_2 
          : conv.participant_1
        
        return {
          ...conv,
          otherParticipant,
          latestMessage: conv.latest_message?.[0] || null
        }
      })

      setConversations(conversationsWithOtherParticipant)
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
    setMessagesLoading(true)
    try {
      const response = await fetch(`/api/messages?conversationId=${conversationId}`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data)
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setMessagesLoading(false)
    }
  }

  // Handle conversation selection
  const handleConversationSelect = (conversation: Conversation) => {
    setSelectedConversation(conversation)
    setMessages([])
    fetchMessages(conversation.id)
  }

  // Send message
  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation || sendingMessage) return

    setSendingMessage(true)
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId: selectedConversation.id,
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

  // Load conversations on mount
  useEffect(() => {
    if (session?.user?.id) {
      fetchConversations()
    }
  }, [session])

  // Set up real-time subscriptions
  useEffect(() => {
    if (!session?.user?.id) return

    const conversationChannel = supabase
      .channel('conversations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `or(participant_one_id.eq.${session.user.id},participant_two_id.eq.${session.user.id})`,
        },
        () => {
          fetchConversations()
        }
      )
      .subscribe()

    const messageChannel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        async (payload) => {
          // Update conversations list
          fetchConversations()
          
          // If message is for selected conversation, add it to messages
          if (selectedConversation && payload.new.conversation_id === selectedConversation.id) {
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
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(conversationChannel)
      supabase.removeChannel(messageChannel)
    }
  }, [session, selectedConversation])

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

  if (!session?.user) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2 text-foreground">Please sign in</h2>
            <p className="text-muted-foreground">You need to be signed in to view messages</p>
          </div>
        </div>
      </MainLayout>
    )
  }





  return (
    <MainLayout>
      <div className="h-full">
        {/* Mobile View - Show only conversation list */}
        <div className="lg:hidden h-full">
          <ConversationList
            conversations={conversations}
            loading={loading}
            showMobileView={true}
          />
        </div>

        {/* Desktop View - Split pane layout */}
        <div className="hidden lg:flex h-full">
          {/* Left Pane - Conversation List */}
          <div className="w-1/3 border-r border-border">
            <ConversationList
              conversations={conversations}
              loading={loading}
              selectedConversationId={selectedConversation?.id}
              onConversationSelect={handleConversationSelect}
              showMobileView={false}
            />
          </div>

          {/* Right Pane - Chat Interface */}
          <div className="flex-1">
            {selectedConversation ? (
              <ChatInterface
                conversation={selectedConversation}
                messages={messages}
                messageInput={messageInput}
                setMessageInput={setMessageInput}
                sendingMessage={sendingMessage}
                replyingTo={replyingTo}
                setReplyingTo={setReplyingTo}
                onSendMessage={handleSendMessage}
                onEmojiSelect={handleEmojiSelect}
                currentUserId={session?.user?.id || ''}
                loading={messagesLoading}
              />
            ) : (
              <div className="flex items-center justify-center h-full bg-muted/30">
                <div className="text-center text-muted-foreground">
                  <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium mb-2 text-foreground">Select a conversation</h3>
                  <p className="text-sm">Choose a conversation from the list to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

export default function MessagesPage() {
  return (
    <Suspense fallback={
      <MainLayout>
        <div className="h-screen flex">
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-green-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-muted-foreground mb-2">
                Loading Messages...
              </h2>
            </div>
          </div>
        </div>
      </MainLayout>
    }>
      <MessagesPageContent />
    </Suspense>
  )
}
