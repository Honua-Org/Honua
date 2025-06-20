"use client"

import React from "react"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import MainLayout from "@/components/main-layout"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import {
  Heart,
  MessageCircle,
  Repeat2,
  Bookmark,
  Share,
  ArrowLeft,
  Send,
  MapPin,
  TrendingUp,
  CheckCircle,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import ImageModal from "@/components/image-modal"

// Mock data - in real app, this would come from API
const mockPost = {
  id: "1",
  user: {
    id: "user1",
    username: "sarah_green",
    full_name: "Sarah Green",
    avatar_url: "/images/profiles/sarah-green-avatar.png",
    verified: true,
  },
  content:
    "Just installed our community solar panel system! 🌞 This 50kW installation will power 15 homes and reduce CO2 emissions by 35 tons annually. The future of renewable energy is community-driven! #SolarEnergy #CommunityPower #ClimateAction",
  media_urls: [
    "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1497440001374-f26997328c1b?w=800&h=600&fit=crop",
  ],
  location: "Portland, Oregon",
  sustainability_category: "Solar Energy",
  impact_score: 92,
  likes_count: 234,
  comments_count: 45,
  reposts_count: 67,
  created_at: "2024-01-15T10:30:00Z",
  liked_by_user: false,
  bookmarked_by_user: false,
}

const mockComments = [
  {
    id: "comment1",
    user: {
      id: "user2",
      username: "eco_marcus",
      full_name: "Marcus Johnson",
      avatar_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      verified: false,
    },
    content:
      "This is amazing! How long did the installation process take? We're considering a similar project in our neighborhood.",
    likes_count: 12,
    replies_count: 3,
    created_at: "2024-01-15T11:45:00Z",
    liked_by_user: false,
  },
  {
    id: "comment2",
    user: {
      id: "user3",
      username: "green_tech_co",
      full_name: "GreenTech Solutions",
      avatar_url: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop&crop=face",
      verified: true,
    },
    content: "Fantastic work! Community solar is the way forward. The impact calculations look spot on. 👏",
    likes_count: 8,
    replies_count: 1,
    created_at: "2024-01-15T12:20:00Z",
    liked_by_user: true,
  },
  {
    id: "comment3",
    user: {
      id: "user4",
      username: "climate_action_now",
      full_name: "Climate Action Now",
      avatar_url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face",
      verified: true,
    },
    content:
      "Love seeing real climate action in communities! This is exactly the kind of grassroots initiative we need more of. Keep up the great work! 🌱",
    likes_count: 25,
    replies_count: 0,
    created_at: "2024-01-15T13:10:00Z",
    liked_by_user: false,
  },
]

export default function PostDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [post, setPost] = useState(mockPost)
  const [comments, setComments] = useState(mockComments)
  const [newComment, setNewComment] = useState("")
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isLiked, setIsLiked] = useState(post.liked_by_user)
  const [likesCount, setLikesCount] = useState(post.likes_count)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState("")

  const handleLike = () => {
    const newIsLiked = !isLiked
    setIsLiked(newIsLiked)
    setLikesCount(newIsLiked ? likesCount + 1 : likesCount - 1)
    toast({
      title: newIsLiked ? "Post liked!" : "Like removed",
      description: newIsLiked ? "Added to your liked posts" : "Removed from liked posts",
    })
  }

  const handleCommentLike = (commentId: string) => {
    setComments(
      comments.map((comment) =>
        comment.id === commentId
          ? {
              ...comment,
              liked_by_user: !comment.liked_by_user,
              likes_count: comment.liked_by_user ? comment.likes_count - 1 : comment.likes_count + 1,
            }
          : comment,
      ),
    )
  }

  const handleSubmitComment = () => {
    if (!newComment.trim()) return

    const comment = {
      id: `comment${Date.now()}`,
      user: {
        id: "current_user",
        username: "current_user",
        full_name: "Current User",
        avatar_url: "/images/profiles/sarah-green-avatar.png",
        verified: false,
      },
      content: newComment,
      likes_count: 0,
      replies_count: 0,
      created_at: new Date().toISOString(),
      liked_by_user: false,
    }

    setComments([comment, ...comments])
    setNewComment("")
    toast({
      title: "Comment posted!",
      description: "Your comment has been added to the discussion.",
    })
  }

  const handleReplyToComment = (commentId: string) => {
    if (!replyContent.trim()) return

    const reply = {
      id: `reply${Date.now()}`,
      user: {
        id: "current_user",
        username: "current_user",
        full_name: "Current User",
        avatar_url: "/images/profiles/sarah-green-avatar.png",
        verified: false,
      },
      content: replyContent,
      likes_count: 0,
      replies_count: 0,
      created_at: new Date().toISOString(),
      liked_by_user: false,
      parent_id: commentId,
    }

    setComments([reply, ...comments])
    setReplyContent("")
    setReplyingTo(null)
    toast({
      title: "Reply posted!",
      description: "Your reply has been added to the discussion.",
    })
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return `${diffInHours}h`
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d`
    return date.toLocaleDateString()
  }

  const getImpactColor = (score: number) => {
    if (score >= 80) return "bg-green-500"
    if (score >= 60) return "bg-yellow-500"
    return "bg-orange-500"
  }

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto p-4 pb-20 lg:pb-4">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-6">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Post</h1>
        </div>

        {/* Main Post */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex space-x-4">
              <Link href={`/profile/${post.user.username}`}>
                <Avatar className="w-12 h-12 cursor-pointer">
                  <AvatarImage src={post.user.avatar_url || "/placeholder.svg"} />
                  <AvatarFallback className="bg-green-500 text-white">{post.user.full_name.charAt(0)}</AvatarFallback>
                </Avatar>
              </Link>

              <div className="flex-1 space-y-3">
                <div className="flex items-center space-x-2">
                  <Link href={`/profile/${post.user.username}`} className="flex items-center space-x-2 hover:underline">
                    <span className="font-semibold text-gray-900 dark:text-gray-100">{post.user.full_name}</span>
                    {post.user.verified && <CheckCircle className="w-4 h-4 text-blue-500" />}
                  </Link>
                  <span className="text-gray-500 dark:text-gray-400">@{post.user.username}</span>
                  <span className="text-gray-500 dark:text-gray-400">·</span>
                  <span className="text-gray-500 dark:text-gray-400">{formatTimeAgo(post.created_at)}</span>
                </div>

                <p className="text-gray-900 dark:text-gray-100 leading-relaxed text-lg">{post.content}</p>

                {post.media_urls && post.media_urls.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 rounded-lg overflow-hidden">
                    {post.media_urls.map((url, index) => (
                      <div
                        key={index}
                        className="relative aspect-video bg-gray-100 dark:bg-gray-700 cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => setSelectedImage(url)}
                      >
                        <Image
                          src={url || "/placeholder.svg"}
                          alt={`Post media ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center flex-wrap gap-2">
                  {post.sustainability_category && (
                    <Badge
                      variant="secondary"
                      className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    >
                      {post.sustainability_category}
                    </Badge>
                  )}

                  {post.location && (
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <MapPin className="w-3 h-3 mr-1" />
                      {post.location}
                    </div>
                  )}

                  {post.impact_score && (
                    <div className="flex items-center space-x-1">
                      <TrendingUp className="w-3 h-3 text-green-600" />
                      <span className="text-sm text-green-600 font-medium">Impact: {post.impact_score}</span>
                      <div className={`w-2 h-2 rounded-full ${getImpactColor(post.impact_score)}`} />
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex items-center space-x-6">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleLike}
                      className={`flex items-center space-x-2 ${
                        isLiked ? "text-red-500 hover:text-red-600" : "text-gray-500 hover:text-red-500"
                      }`}
                    >
                      <Heart className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`} />
                      <span>{likesCount}</span>
                    </Button>

                    <div className="flex items-center space-x-2 text-gray-500">
                      <MessageCircle className="w-5 h-5" />
                      <span>{comments.length}</span>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex items-center space-x-2 text-gray-500 hover:text-green-500"
                    >
                      <Repeat2 className="w-5 h-5" />
                      <span>{post.reposts_count}</span>
                    </Button>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" className="text-gray-500 hover:text-yellow-500">
                      <Bookmark className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-gray-500 hover:text-blue-500">
                      <Share className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comment Input */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex space-x-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src="/images/profiles/sarah-green-avatar.png" />
                <AvatarFallback className="bg-green-500 text-white">S</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-3">
                <Textarea
                  placeholder="Write a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="min-h-[80px] resize-none"
                />
                <div className="flex justify-end">
                  <Button
                    onClick={handleSubmitComment}
                    disabled={!newComment.trim()}
                    className="sustainability-gradient"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Comment
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comments */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Comments ({comments.length})</h2>

          {comments.map((comment) => (
            <Card key={comment.id}>
              <CardContent className="p-4">
                <div className="flex space-x-3">
                  <Link href={`/profile/${comment.user.username}`}>
                    <Avatar className="w-10 h-10 cursor-pointer">
                      <AvatarImage src={comment.user.avatar_url || "/placeholder.svg"} />
                      <AvatarFallback className="bg-green-500 text-white">
                        {comment.user.full_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  </Link>

                  <div className="flex-1 space-y-2">
                    <div className="flex items-center space-x-2">
                      <Link
                        href={`/profile/${comment.user.username}`}
                        className="flex items-center space-x-2 hover:underline"
                      >
                        <span className="font-semibold text-gray-900 dark:text-gray-100">{comment.user.full_name}</span>
                        {comment.user.verified && <CheckCircle className="w-4 h-4 text-blue-500" />}
                      </Link>
                      <span className="text-gray-500 dark:text-gray-400">@{comment.user.username}</span>
                      <span className="text-gray-500 dark:text-gray-400">·</span>
                      <span className="text-gray-500 dark:text-gray-400">{formatTimeAgo(comment.created_at)}</span>
                    </div>

                    <p className="text-gray-900 dark:text-gray-100">{comment.content}</p>

                    <div className="flex items-center space-x-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCommentLike(comment.id)}
                        className={`flex items-center space-x-1 ${
                          comment.liked_by_user ? "text-red-500 hover:text-red-600" : "text-gray-500 hover:text-red-500"
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${comment.liked_by_user ? "fill-current" : ""}`} />
                        <span>{comment.likes_count}</span>
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex items-center space-x-1 text-gray-500 hover:text-blue-500"
                        onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>Reply</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        {comments.map((comment) => (
          <React.Fragment key={comment.id}>
            <Card key={comment.id}>
              <CardContent className="p-4">
                <div className="flex space-x-3">
                  <Link href={`/profile/${comment.user.username}`}>
                    <Avatar className="w-10 h-10 cursor-pointer">
                      <AvatarImage src={comment.user.avatar_url || "/placeholder.svg"} />
                      <AvatarFallback className="bg-green-500 text-white">
                        {comment.user.full_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  </Link>

                  <div className="flex-1 space-y-2">
                    <div className="flex items-center space-x-2">
                      <Link
                        href={`/profile/${comment.user.username}`}
                        className="flex items-center space-x-2 hover:underline"
                      >
                        <span className="font-semibold text-gray-900 dark:text-gray-100">{comment.user.full_name}</span>
                        {comment.user.verified && <CheckCircle className="w-4 h-4 text-blue-500" />}
                      </Link>
                      <span className="text-gray-500 dark:text-gray-400">@{comment.user.username}</span>
                      <span className="text-gray-500 dark:text-gray-400">·</span>
                      <span className="text-gray-500 dark:text-gray-400">{formatTimeAgo(comment.created_at)}</span>
                    </div>

                    <p className="text-gray-900 dark:text-gray-100">{comment.content}</p>

                    <div className="flex items-center space-x-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCommentLike(comment.id)}
                        className={`flex items-center space-x-1 ${
                          comment.liked_by_user ? "text-red-500 hover:text-red-600" : "text-gray-500 hover:text-red-500"
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${comment.liked_by_user ? "fill-current" : ""}`} />
                        <span>{comment.likes_count}</span>
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex items-center space-x-1 text-gray-500 hover:text-blue-500"
                        onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>Reply</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            {replyingTo === comment.id && (
              <div className="mt-3 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                <div className="flex space-x-2">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src="/images/profiles/sarah-green-avatar.png" />
                    <AvatarFallback className="bg-green-500 text-white">S</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <Textarea
                      placeholder={`Reply to ${comment.user.full_name}...`}
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      className="min-h-[60px] resize-none text-sm"
                    />
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setReplyingTo(null)
                          setReplyContent("")
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleReplyToComment(comment.id)}
                        disabled={!replyContent.trim()}
                        className="sustainability-gradient"
                      >
                        Reply
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <ImageModal src={selectedImage || "/placeholder.svg"} alt="Post image" onClose={() => setSelectedImage(null)} />
      )}
    </MainLayout>
  )
}
