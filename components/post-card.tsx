"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "@supabase/auth-helpers-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import MoveBookmarkDialog from "./move-bookmark-dialog"
import {
  Heart,
  MessageCircle,
  Repeat2,
  Bookmark,
  Share,
  MoreHorizontal,
  MapPin,
  TrendingUp,
  CheckCircle,
  Flag,
  UserPlus,
  UserMinus,
  Trash2,
  FolderPlus,
  Plus,
  FolderOpen,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import ImageModal from "./image-modal"; // Adjust path if necessary
import { renderContentWithLinksAndMentions } from '@/lib/mention-utils'

interface PostCardProps {
  post: {
    id: string
    user: {
      id: string
      username: string
      full_name: string
      avatar_url: string
      verified?: boolean
    }
    content: string
    media_urls?: string[]
    location?: string
    sustainability_category?: string
    impact_score?: number
    likes_count: number
    comments_count: number
    reposts_count: number
    created_at: string
    updated_at: string
    parent_id?: string
    liked_by_user: boolean
    bookmarked_by_user: boolean
    reposted_by_user: boolean
    link_preview_url?: string
    link_preview_title?: string
    link_preview_description?: string
    link_preview_image?: string
    link_preview_domain?: string
    collection_id?: string
  }
  onPostDeleted?: () => void
  onUpdate?: (postId: string, updates: any) => void
}

export default function PostCard({ post, onPostDeleted, onUpdate }: PostCardProps) {
  const [isLiked, setIsLiked] = useState(post.liked_by_user)
  const [isBookmarked, setIsBookmarked] = useState(post.bookmarked_by_user)
  const [likesCount, setLikesCount] = useState(post.likes_count)
  const [isFollowing, setIsFollowing] = useState(false)
  const session = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const [isMoveBookmarkOpen, setIsMoveBookmarkOpen] = useState(false);

  const handleLike = async () => {
    const newIsLiked = !isLiked
    const newLikesCount = newIsLiked ? likesCount + 1 : likesCount - 1

    setIsLiked(newIsLiked)
    setLikesCount(newLikesCount)

    // Update parent component
    onUpdate?.(post.id, {
      liked_by_user: newIsLiked,
      likes_count: newLikesCount
    })

    toast({
      title: newIsLiked ? "Post liked!" : "Like removed",
      description: newIsLiked ? "Added to your liked posts" : "Removed from liked posts",
    })
  }

  // State for collection selection dialog
  const [isCollectionDialogOpen, setIsCollectionDialogOpen] = useState(false)
  const [collections, setCollections] = useState<Array<{id: string, name: string, color: string}>>([])  
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null)
  const [isLoadingCollections, setIsLoadingCollections] = useState(false)

  // Fetch user's collections
  const fetchCollections = async () => {
    if (!session?.user?.id) return
    
    setIsLoadingCollections(true)
    try {
      const response = await fetch('/api/collections')
      if (!response.ok) throw new Error('Failed to fetch collections')
      
      const data = await response.json()
      // The API returns the collections array directly, not nested under a 'collections' property
      setCollections(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching collections:', error)
      toast({
        title: "Error",
        description: "Failed to load collections",
        variant: "destructive",
      })
    } finally {
      setIsLoadingCollections(false)
    }
  }

  const handleBookmarkClick = () => {
    if (isBookmarked) {
      // If already bookmarked, remove the bookmark
      handleRemoveBookmark()
    } else {
      // If not bookmarked, show collection selection dialog
      fetchCollections()
      setIsCollectionDialogOpen(true)
    }
  }

  const handleRemoveBookmark = async () => {
    setIsBookmarked(false)

    try {
      const response = await fetch(`/api/posts/${post.id}/bookmark`, { method: 'DELETE' })
      
      if (!response.ok) {
        // Revert the optimistic update if API call fails
        setIsBookmarked(true)
        throw new Error('Failed to remove bookmark')
      }

      // Update parent component
      onUpdate?.(post.id, {
        bookmarked_by_user: false
      })

      toast({
        title: "Bookmark removed",
        description: "Removed from bookmarks",
      })
    } catch (error) {
      console.error('Error removing bookmark:', error)
      toast({
        title: "Error",
        description: "Failed to remove bookmark",
        variant: "destructive",
      })
    }
  }

  const handleBookmark = async (collectionId: string | null = null) => {
    setIsBookmarked(true)
    setIsCollectionDialogOpen(false)

    try {
      const response = await fetch(`/api/posts/${post.id}/bookmark`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ collection_id: collectionId }),
      })
      
      if (!response.ok) {
        // Revert the optimistic update if API call fails
        setIsBookmarked(false)
        throw new Error('Failed to bookmark post')
      }

      // Update parent component
      onUpdate?.(post.id, {
        bookmarked_by_user: true
      })

      toast({
        title: "Post bookmarked!",
        description: collectionId 
          ? `Saved to ${collections.find(c => c.id === collectionId)?.name || 'collection'}` 
          : "Saved to your bookmarks",
      })
    } catch (error) {
      console.error('Error bookmarking post:', error)
      toast({
        title: "Error",
        description: "Failed to bookmark post",
        variant: "destructive",
      })
    }
  }

  const handleRepost = async () => {
    if (!session?.user?.id) {
      toast({
        title: "Authentication required",
        description: "Please log in to repost",
        variant: "destructive",
      })
      return
    }

    try {
      const method = post.reposted_by_user ? 'DELETE' : 'POST'
      const response = await fetch(`/api/posts/${post.id}/repost`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update repost')
      }

      const data = await response.json()
      
      // Update parent component
      onUpdate?.(post.id, {
        reposted_by_user: !post.reposted_by_user,
        reposts_count: data.reposts_count || (post.reposted_by_user ? post.reposts_count - 1 : post.reposts_count + 1)
      })

      toast({
        title: post.reposted_by_user ? "Repost removed" : "Post reposted!",
        description: post.reposted_by_user ? "Removed from your reposts" : "Shared with your followers",
      })
    } catch (error) {
      console.error('Error updating repost:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update repost",
        variant: "destructive",
      })
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${post.user.full_name} on Honua`,
          text: post.content,
          url: `${window.location.origin}/post/${post.id}`,
        })
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      // Fallback to clipboard
      await navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`)
      toast({
        title: "Link copied!",
        description: "Post link copied to clipboard",
      })
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/posts/${post.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete post')
      }

      toast({
        title: "Post deleted",
        description: "Your post has been successfully deleted.",
      })

      // Notify parent component to remove the post
      onUpdate?.(post.id, { deleted: true })
      onPostDeleted?.()
    } catch (error) {
      console.error('Error deleting post:', error)
      toast({
        title: "Error",
        description: "Failed to delete post. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleFollow = async () => {
    if (!post.user?.id) return

    try {
      const method = isFollowing ? 'DELETE' : 'POST'
      const response = await fetch(`/api/profiles/${post.user.id}/follow`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update follow status')
      }

      // Update local state
      setIsFollowing(!isFollowing)

      toast({
        title: isFollowing ? "Unfollowed" : "Following",
        description: `${isFollowing ? "Unfollowed" : "Now following"} @${post.user?.username || 'Unknown'}`,
      })
    } catch (error) {
      console.error('Error updating follow status:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update follow status",
        variant: "destructive",
      })
    }
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
    <>
      <Card className="bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex space-x-4">
            <Link href={`/profile/${post.user?.username || 'unknown'}`}>
              <Avatar className="w-12 h-12 cursor-pointer">
                <AvatarImage src={post.user?.avatar_url || "/placeholder.svg"} />
                <AvatarFallback className="bg-green-500 text-white">{post.user?.full_name?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
            </Link>

            <div className="flex-1 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Link href={`/profile/${post.user?.username || 'unknown'}`} className="flex items-center space-x-2 hover:underline">
                    <span className="font-semibold text-gray-900 dark:text-gray-100">{post.user?.full_name || 'Unknown User'}</span>
                    {post.user?.verified && <CheckCircle className="w-4 h-4 text-blue-500" />}
                  </Link>
                  <span className="text-gray-500 dark:text-gray-400">@{post.user?.username || 'unknown'}</span>
                  <span className="text-gray-500 dark:text-gray-400">·</span>
                  <span className="text-gray-500 dark:text-gray-400">{formatTimeAgo(post.created_at)}</span>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {post.user?.id === session?.user?.id ? (
                      <>
                        <DropdownMenuItem onClick={handleDelete} className="text-red-600 focus:text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete post
                        </DropdownMenuItem>
                        {isBookmarked ? (
                          <>
                            <DropdownMenuItem onClick={handleRemoveBookmark}>
                              <Bookmark className="mr-2 h-4 w-4" />
                              Remove bookmark
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setIsMoveBookmarkOpen(true)}>
                              <FolderOpen className="mr-2 h-4 w-4" />
                              Move to collection
                            </DropdownMenuItem>
                          </>
                        ) : (
                          <DropdownMenuItem onClick={handleBookmarkClick}>
                            <Bookmark className="mr-2 h-4 w-4" />
                            Bookmark post
                          </DropdownMenuItem>
                        )}
                      </>
                    ) : (
                      <>
                        <DropdownMenuItem onClick={handleFollow}>
                          {isFollowing ? (
                            <>
                              <UserMinus className="mr-2 h-4 w-4" />
                              Unfollow @{post.user?.username || 'unknown'}
                            </>
                          ) : (
                            <>
                              <UserPlus className="mr-2 h-4 w-4" />
                              Follow @{post.user?.username || 'unknown'}
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/report/${post.id}`}>
                            <Flag className="mr-2 h-4 w-4" />
                            Report post
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleBookmarkClick}>
                          <Bookmark className="mr-2 h-4 w-4" />
                          {isBookmarked ? "Remove bookmark" : "Bookmark post"}
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="space-y-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 -m-2 p-2 rounded-lg transition-colors" onClick={() => router.push(`/post/${post.id}`)}>
                <div className="text-gray-900 dark:text-gray-100 leading-relaxed" onClick={(e) => e.stopPropagation()}>
                  {renderContentWithLinksAndMentions(post.content)}
                </div>
                  
                  {/* Link Preview */}
                  {post.link_preview_url && (
                    <div className="mt-3 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                      <a 
                        href={post.link_preview_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="block hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {post.link_preview_image && (
                          <div className="aspect-video w-full bg-gray-100 dark:bg-gray-800">
                            <img 
                              src={post.link_preview_image} 
                              alt={post.link_preview_title || 'Link preview'}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="p-3">
                          {post.link_preview_title && (
                            <h3 className="font-medium text-gray-900 dark:text-gray-100 line-clamp-2">
                              {post.link_preview_title}
                            </h3>
                          )}
                          {post.link_preview_description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                              {post.link_preview_description}
                            </p>
                          )}
                          {post.link_preview_domain && (
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                              {post.link_preview_domain}
                            </p>
                          )}
                        </div>
                      </a>
                    </div>
                  )}

                  {post.media_urls && post.media_urls.length > 0 && (
                    <div
                      className={`grid gap-2 rounded-lg overflow-hidden ${
                        post.media_urls.length === 1
                          ? "grid-cols-1"
                          : post.media_urls.length === 2
                            ? "grid-cols-2"
                            : "grid-cols-2"
                      }`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {post.media_urls.map((url, index) => {
                        const isVideo = url.endsWith('.mp4') || url.endsWith('.webm') || url.endsWith('.ogg');
                        return (
                          <div 
                            key={index} 
                            className="relative aspect-video bg-gray-100 dark:bg-gray-700 cursor-pointer"
                            onClick={() => setSelectedMedia(url)}
                          >
                            {isVideo ? (
                              <video src={url} className="object-cover w-full h-full" />
                            ) : (
                              <Image
                                src={url || "/placeholder.svg"}
                                alt={`Post media ${index + 1}`}
                                fill
                                className="object-cover"
                              />
                            )}
                          </div>
                        );
                      })}
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
              </div>

              <div
                className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center space-x-6">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLike}
                    className={`flex items-center space-x-2 ${
                      isLiked ? "text-red-500 hover:text-red-600" : "text-gray-500 hover:text-red-500"
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
                    <span>{likesCount}</span>
                  </Button>

                  <Link href={`/post/${post.id}`}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex items-center space-x-2 text-gray-500 hover:text-blue-500"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>{post.comments_count}</span>
                    </Button>
                  </Link>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRepost}
                    className={`flex items-center space-x-2 ${
                      post.reposted_by_user ? "text-green-500 hover:text-green-600" : "text-gray-500 hover:text-green-500"
                    }`}
                  >
                    <Repeat2 className={`w-4 h-4 ${post.reposted_by_user ? "fill-current" : ""}`} />
                    <span>{post.reposts_count}</span>
                  </Button>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBookmarkClick}
                  className={`${
                    isBookmarked ? "text-yellow-500 hover:text-yellow-600" : "text-gray-500 hover:text-yellow-500"
                  }`}
                >
                  <Bookmark className={`w-4 h-4 ${isBookmarked ? "fill-current" : ""}`} />
                </Button>

                  <Button variant="ghost" size="sm" onClick={handleShare} className="text-gray-500 hover:text-blue-500">
                    <Share className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {selectedMedia && (
        <ImageModal 
          src={selectedMedia} 
          alt="Post media" 
          onClose={() => setSelectedMedia(null)} 
        />
      )}

      {/* Collection Selection Dialog */}
      <Dialog open={isCollectionDialogOpen} onOpenChange={setIsCollectionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save to Collection</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <RadioGroup value={selectedCollectionId || ''} onValueChange={setSelectedCollectionId}>
              <div className="space-y-3 p-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="" id="default-collection" />
                  <Label htmlFor="default-collection" className="flex items-center space-x-2 cursor-pointer">
                    <Bookmark className="h-4 w-4" />
                    <span>Default Collection</span>
                  </Label>
                </div>
                
                {isLoadingCollections ? (
                  <div className="py-4 text-center text-gray-500">Loading collections...</div>
                ) : collections.length > 0 ? (
                  collections.map((collection) => (
                    <div key={collection.id} className="flex items-center space-x-2">
                      <RadioGroupItem value={collection.id} id={`collection-${collection.id}`} />
                      <Label 
                        htmlFor={`collection-${collection.id}`} 
                        className="flex items-center space-x-2 cursor-pointer"
                      >
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: collection.color || '#10b981' }}
                        />
                        <span>{collection.name}</span>
                      </Label>
                    </div>
                  ))
                ) : (
                  <div className="py-4 text-center text-gray-500">
                    No collections found. Create one below.
                  </div>
                )}
                
                <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full mt-2 flex items-center justify-center"
                    onClick={() => {
                      setIsCollectionDialogOpen(false);
                      router.push('/bookmarks');
                    }}
                  >
                    <FolderPlus className="h-4 w-4 mr-2" />
                    Manage Collections
                  </Button>
              </div>
            </RadioGroup>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCollectionDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => handleBookmark(selectedCollectionId)}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Move Bookmark Dialog */}
      <MoveBookmarkDialog
        open={isMoveBookmarkOpen}
        onOpenChange={setIsMoveBookmarkOpen}
        bookmarkId={post.id}
        currentCollectionId={post.collection_id || null}
        onSuccess={() => {
          // Update parent component to refresh bookmarks
          onUpdate?.(post.id, {
            bookmarked_by_user: true
          })
        }}
      />
    </>
  )
}
