"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import MainLayout from "@/components/main-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import {
  ArrowLeft,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Share2,
  Flag,
  MoreHorizontal,
  Pin,
  Lock,
  Clock,
  Award,
  Reply,
} from "lucide-react"
import Link from "next/link"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

// TypeScript interfaces
interface Author {
  username: string
  full_name: string
  avatar_url: string
  reputation: number
  badges?: string[]
}

interface Reply {
  id: string
  content: string
  author: Author
  likes_count: number
  created_at: string
  user_vote: "up" | "down" | null
}

interface Comment {
  id: string
  content: string
  author: Author
  likes_count: number
  dislikes_count: number
  created_at: string
  user_vote: "up" | "down" | null
  replies: Reply[]
}

interface Thread {
  id: string
  title: string
  content: string
  author: Author
  forum: {
    id: string
    name: string
    category: string
  }
  replies_count: number
  views_count: number
  likes_count: number
  dislikes_count: number
  created_at: string
  last_activity: string
  is_pinned: boolean
  is_locked: boolean
  tags: string[]
  user_vote: "up" | "down" | null
}

// Utility function for formatting time

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

  if (diffInHours < 1) return "Just now"
  if (diffInHours < 24) return `${diffInHours}h ago`
  if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`
  return date.toLocaleDateString()
}

export default function ThreadDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClientComponentClient()
  const threadId = params.id as string

  const [thread, setThread] = useState<Thread | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newComment, setNewComment] = useState("")
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState("")

  // Fetch thread data and comments
  useEffect(() => {
    const fetchThreadAndComments = async () => {
      try {
        setIsLoading(true)
        
        // Fetch thread data
        const threadResponse = await fetch(`/api/threads/${threadId}`)
        if (!threadResponse.ok) {
          throw new Error('Failed to fetch thread')
        }
        
        const threadData = await threadResponse.json()
        
        // Transform API data to match our Thread interface
        const formattedThread: Thread = {
          id: threadData.id,
          title: threadData.title,
          content: threadData.content,
          author: {
            username: threadData.author.username || 'Unknown',
            full_name: threadData.author.full_name || 'Unknown User',
            avatar_url: threadData.author.avatar_url || '/placeholder.svg',
            reputation: 0, // API doesn't provide this yet
            badges: [] // API doesn't provide this yet
          },
          forum: {
            id: threadData.forum_id,
            name: threadData.forum_name || 'Unknown Forum',
            category: threadData.forum_category || 'General'
          },
          replies_count: threadData.replies_count || 0,
          views_count: threadData.views_count || 0,
          likes_count: 0, // API doesn't provide this yet
          dislikes_count: 0, // API doesn't provide this yet
          created_at: threadData.created_at,
          last_activity: threadData.updated_at || threadData.created_at,
          is_pinned: threadData.is_pinned || false,
          is_locked: threadData.is_locked || false,
          tags: [], // API doesn't provide this yet
          user_vote: null
        }
        
        setThread(formattedThread)
        
        // Fetch comments for the thread
        const commentsResponse = await fetch(`/api/threads/${threadId}/comments`)
        if (commentsResponse.ok) {
          const commentsData = await commentsResponse.json()
          setComments(commentsData.comments || [])
        } else {
          console.warn('Failed to fetch comments, using empty array')
          setComments([])
        }
        
      } catch (error) {
        console.error('Error fetching thread:', error)
        toast({
          title: "Error",
          description: "Failed to load thread. Please try again.",
          variant: "destructive"
        })
        router.push('/forum')
      } finally {
        setIsLoading(false)
      }
    }

    if (threadId) {
      fetchThreadAndComments()
    }
  }, [threadId, toast, router])

  const handleVote = (type: "up" | "down", commentId?: string) => {
    if (commentId) {
      // Handle comment vote
      setComments((prev) =>
        prev.map((comment) => {
          if (comment.id === commentId) {
            const newVote = comment.user_vote === type ? null : type
            return {
              ...comment,
              user_vote: newVote,
              likes_count:
                newVote === "up"
                  ? comment.likes_count + 1
                  : comment.user_vote === "up"
                    ? comment.likes_count - 1
                    : comment.likes_count,
              dislikes_count:
                newVote === "down"
                  ? comment.dislikes_count + 1
                  : comment.user_vote === "down"
                    ? comment.dislikes_count - 1
                    : comment.dislikes_count,
            }
          }
          return comment
        }),
      )
    } else if (thread) {
      // Handle thread vote
      const newVote = thread.user_vote === type ? null : type
      setThread((prev) => {
        if (!prev) return null
        return {
          ...prev,
          user_vote: newVote,
          likes_count:
            newVote === "up" ? prev.likes_count + 1 : prev.user_vote === "up" ? prev.likes_count - 1 : prev.likes_count,
          dislikes_count:
            newVote === "down"
              ? prev.dislikes_count + 1
              : prev.user_vote === "down"
                ? prev.dislikes_count - 1
                : prev.dislikes_count,
        }
      })
    }

    toast({
      title: type === "up" ? "Upvoted!" : "Downvoted!",
      description: "Your vote has been recorded",
    })
  }

  const handleAddComment = async () => {
    if (!newComment.trim()) return

    try {
      const response = await fetch(`/api/threads/${threadId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newComment
        })
      })

      if (!response.ok) {
        throw new Error('Failed to add comment')
      }

      const { comment } = await response.json()
      setComments((prev) => [...prev, comment])
      setNewComment("")

      toast({
        title: "Comment added!",
        description: "Your comment has been posted",
      })
    } catch (error) {
      console.error('Error adding comment:', error)
      toast({
        title: "Error",
        description: "Failed to add comment. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleAddReply = async (parentId: string) => {
    if (!replyContent.trim()) return

    try {
      const response = await fetch(`/api/threads/${threadId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: replyContent,
          parent_id: parentId
        })
      })

      if (!response.ok) {
        throw new Error('Failed to add reply')
      }

      const { comment: reply } = await response.json()
      
      setComments((prev) =>
        prev.map((comment) => {
          if (comment.id === parentId) {
            return {
              ...comment,
              replies: [...comment.replies, reply],
            }
          }
          return comment
        }),
      )

      setReplyContent("")
      setReplyingTo(null)

      toast({
        title: "Reply added!",
        description: "Your reply has been posted",
      })
    } catch (error) {
      console.error('Error adding reply:', error)
      toast({
        title: "Error",
        description: "Failed to add reply. Please try again.",
        variant: "destructive"
      })
    }
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto p-4 pb-20 lg:pb-4">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading thread...</p>
            </div>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (!thread) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto p-4 pb-20 lg:pb-4">
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">Thread not found.</p>
            <Button asChild className="mt-4">
              <Link href="/forum">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Forums
              </Link>
            </Button>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto p-4 pb-20 lg:pb-4">
        {/* Back Navigation */}
        <div className="mb-6">
          <Button variant="ghost" asChild className="mb-4">
            <Link href={`/forum/${thread.forum.id}`}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to {thread.forum.name}
            </Link>
          </Button>
        </div>

        {/* Thread Header */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <Avatar className="w-12 h-12">
                <AvatarImage src={thread.author.avatar_url || "/placeholder.svg"} />
                <AvatarFallback>{thread.author.full_name.charAt(0)}</AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  {thread.is_pinned && <Pin className="w-4 h-4 text-green-600" />}
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{thread.title}</h1>
                  {thread.is_locked && <Lock className="w-4 h-4 text-gray-500" />}
                </div>

                <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                  <div className="flex items-center space-x-2">
                    <Link href={`/profile/${thread.author.username}`} className="font-medium hover:text-green-600">
                      {thread.author.full_name}
                    </Link>
                    <Badge variant="outline" className="text-xs">
                      {thread.author.reputation}
                    </Badge>
                    {thread.author.badges?.map((badge) => (
                      <Badge key={badge} variant="secondary" className="text-xs">
                        <Award className="w-3 h-3 mr-1" />
                        {badge}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{formatTimeAgo(thread.created_at)}</span>
                  </div>
                  <span>{thread.views_count} views</span>
                </div>

                <div className="prose dark:prose-invert max-w-none mb-4">
                  <div className="whitespace-pre-wrap text-gray-900 dark:text-gray-100">{thread.content}</div>
                </div>

                {/* Tags */}
                {thread.tags && thread.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {thread.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Thread Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex items-center space-x-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleVote("up")}
                      className={`flex items-center space-x-2 ${
                        thread.user_vote === "up" ? "text-green-600" : "text-gray-500 hover:text-green-600"
                      }`}
                    >
                      <ThumbsUp className={`w-4 h-4 ${thread.user_vote === "up" ? "fill-current" : ""}`} />
                      <span>{thread.likes_count}</span>
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleVote("down")}
                      className={`flex items-center space-x-2 ${
                        thread.user_vote === "down" ? "text-red-600" : "text-gray-500 hover:text-red-600"
                      }`}
                    >
                      <ThumbsDown className={`w-4 h-4 ${thread.user_vote === "down" ? "fill-current" : ""}`} />
                      <span>{thread.dislikes_count}</span>
                    </Button>

                    <div className="flex items-center space-x-2 text-gray-500">
                      <MessageSquare className="w-4 h-4" />
                      <span>{thread.replies_count} replies</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" className="text-gray-500 hover:text-blue-500">
                      <Share2 className="w-4 h-4" />
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Flag className="w-4 h-4 mr-2" />
                          Report
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Add Comment */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Add a Comment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Share your thoughts, experiences, or ask questions..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={4}
            />
            <Button onClick={handleAddComment} disabled={!newComment.trim()}>
              Post Comment
            </Button>
          </CardContent>
        </Card>

        {/* Comments */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Comments ({comments.length})</h2>

          {comments.map((comment) => (
            <Card key={comment.id}>
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={comment.author.avatar_url || "/placeholder.svg"} />
                    <AvatarFallback>{comment.author.full_name.charAt(0)}</AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Link
                        href={`/profile/${comment.author.username}`}
                        className="font-medium text-gray-900 dark:text-gray-100 hover:text-green-600"
                      >
                        {comment.author.full_name}
                      </Link>
                      <Badge variant="outline" className="text-xs">
                        {comment.author.reputation}
                      </Badge>
                      {comment.author.badges?.map((badge) => (
                        <Badge key={badge} variant="secondary" className="text-xs">
                          <Award className="w-3 h-3 mr-1" />
                          {badge}
                        </Badge>
                      ))}
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {formatTimeAgo(comment.created_at)}
                      </span>
                    </div>

                    <div className="prose dark:prose-invert max-w-none mb-4">
                      <div className="whitespace-pre-wrap text-gray-900 dark:text-gray-100">{comment.content}</div>
                    </div>

                    {/* Comment Actions */}
                    <div className="flex items-center space-x-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleVote("up", comment.id)}
                        className={`flex items-center space-x-1 ${
                          comment.user_vote === "up" ? "text-green-600" : "text-gray-500 hover:text-green-600"
                        }`}
                      >
                        <ThumbsUp className={`w-3 h-3 ${comment.user_vote === "up" ? "fill-current" : ""}`} />
                        <span>{comment.likes_count}</span>
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleVote("down", comment.id)}
                        className={`flex items-center space-x-1 ${
                          comment.user_vote === "down" ? "text-red-600" : "text-gray-500 hover:text-red-600"
                        }`}
                      >
                        <ThumbsDown className={`w-3 h-3 ${comment.user_vote === "down" ? "fill-current" : ""}`} />
                        <span>{comment.dislikes_count}</span>
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                        className="flex items-center space-x-1 text-gray-500 hover:text-blue-500"
                      >
                        <Reply className="w-3 h-3" />
                        <span>Reply</span>
                      </Button>
                    </div>

                    {/* Reply Form */}
                    {replyingTo === comment.id && (
                      <div className="mt-4 space-y-3">
                        <Textarea
                          placeholder="Write your reply..."
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          rows={3}
                        />
                        <div className="flex space-x-2">
                          <Button size="sm" onClick={() => handleAddReply(comment.id)} disabled={!replyContent.trim()}>
                            Post Reply
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setReplyingTo(null)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Replies */}
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="mt-4 space-y-4 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                        {comment.replies.map((reply) => (
                          <div key={reply.id} className="flex items-start space-x-3">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={reply.author.avatar_url || "/placeholder.svg"} />
                              <AvatarFallback>{reply.author.full_name.charAt(0)}</AvatarFallback>
                            </Avatar>

                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <Link
                                  href={`/profile/${reply.author.username}`}
                                  className="font-medium text-sm text-gray-900 dark:text-gray-100 hover:text-green-600"
                                >
                                  {reply.author.full_name}
                                </Link>
                                <Badge variant="outline" className="text-xs">
                                  {reply.author.reputation}
                                </Badge>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {formatTimeAgo(reply.created_at)}
                                </span>
                              </div>

                              <p className="text-sm text-gray-900 dark:text-gray-100 mb-2">{reply.content}</p>

                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="flex items-center space-x-1 text-gray-500 hover:text-green-600 h-6 px-2"
                                >
                                  <ThumbsUp className="w-3 h-3" />
                                  <span className="text-xs">{reply.likes_count}</span>
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </MainLayout>
  )
}
