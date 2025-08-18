"use client"

import { useState } from "react"
import MainLayout from "@/components/main-layout"
import PostCard from "@/components/post-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import { Bookmark, Filter, Download, Trash2, FolderPlus, Plus, Edit, X } from "lucide-react"
import Image from "next/image"
import { useEffect } from "react"
import { useSession } from "@supabase/auth-helpers-react"
import { createClient } from "@/lib/supabase/client"

const mockBookmarkedPosts = [
  {
    id: "bookmark1",
    user: {
      id: "user1",
      username: "green_tech_co",
      full_name: "GreenTech Solutions",
      avatar_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      verified: true,
    },
    content:
      "Exciting news! Our new wind turbine design is 40% more efficient than traditional models. This breakthrough could revolutionize renewable energy production. Read our full research paper in the comments 👇",
    media_urls: ["https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=800&h=600&fit=crop"],
    location: "Copenhagen, Denmark",
    sustainability_category: "Wind Power",
    impact_score: 95,
    likes_count: 892,
    comments_count: 67,
    reposts_count: 234,
    created_at: "2024-01-14T16:45:00Z",
    liked_by_user: false,
    bookmarked_by_user: true,
    bookmark_category: "Research",
  },
  {
    id: "bookmark2",
    user: {
      id: "user2",
      username: "climate_action_now",
      full_name: "Climate Action Network",
      avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
      verified: true,
    },
    content:
      "Join us for the Global Climate Strike this Friday! 🌍 Together, we can demand urgent action on climate change. Every voice matters, every action counts. #ClimateStrike #ActNow",
    media_urls: ["https://images.unsplash.com/photo-1569163139394-de4e4f43e4e3?w=800&h=600&fit=crop"],
    location: "Global Event",
    sustainability_category: "Climate Action",
    impact_score: 88,
    likes_count: 1247,
    comments_count: 156,
    reposts_count: 567,
    created_at: "2024-01-14T09:00:00Z",
    liked_by_user: false,
    bookmarked_by_user: true,
    bookmark_category: "Events",
  },
]

type Collection = {
  id: string;
  name: string;
  description: string | null;
  color: string;
  created_at: string;
  updated_at: string;
  bookmark_count: number;
};

type BookmarkedPost = {
  id: string;
  user: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string;
    verified?: boolean;
  };
  content: string;
  media_urls?: string[];
  location?: string;
  sustainability_category?: string;
  impact_score?: number;
  likes_count: number;
  comments_count: number;
  reposts_count: number;
  created_at: string;
  updated_at: string;
  parent_id?: string;
  liked_by_user: boolean;
  bookmarked_by_user: boolean;
  reposted_by_user: boolean;
  link_preview_url?: string;
  link_preview_title?: string;
  link_preview_description?: string;
  link_preview_image?: string;
  link_preview_domain?: string;
  collection_id?: string;
  collection_name?: string;
};

export default function BookmarksPage() {
  const [posts, setPosts] = useState<BookmarkedPost[]>([])
  const [collections, setCollections] = useState<Collection[]>([])
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState("newest")
  const [isNewCollectionOpen, setIsNewCollectionOpen] = useState(false)
  const [newCollectionName, setNewCollectionName] = useState("")
  const [newCollectionDescription, setNewCollectionDescription] = useState("")
  const [newCollectionColor, setNewCollectionColor] = useState("#10B981")
  const [loading, setLoading] = useState(false)
  const session = useSession()
  const supabase = createClient()

  const fetchCollections = async () => {
    if (!session?.user?.id) return
    try {
      const response = await fetch('/api/collections')
      if (response.ok) {
        const data = await response.json()
        setCollections(data)
      }
    } catch (error) {
      console.error('Error fetching collections:', error)
    }
  }

  const fetchBookmarks = async () => {
    if (!session?.user?.id) return
    const { data, error } = await supabase
      .from('bookmarks')
      .select(`
        post_id,
        created_at,
        collection_id,
        collections (
          id,
          name
        ),
        posts (
          id,
          content,
          media_urls,
          location,
          sustainability_category,
          impact_score,
          created_at,
          profiles:user_id (
            id,
            username,
            full_name,
            avatar_url,
            verified
          )
        )
      `)
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
    if (error) {
      console.error('Error fetching bookmarks:', error)
      setPosts([])
      return
    }
    // Map to PostCard expected structure
    const mapped = (data || []).map((b: any) => {
      const p = b.posts
      return {
        id: p.id,
        user: p.profiles,
        content: p.content,
        media_urls: p.media_urls,
        location: p.location,
        sustainability_category: p.sustainability_category,
        impact_score: p.impact_score,
        likes_count: 0,
        comments_count: 0,
        reposts_count: 0,
        created_at: p.created_at,
        updated_at: p.updated_at || p.created_at,
        parent_id: p.parent_id,
        liked_by_user: false, // Optionally fetch likes
        bookmarked_by_user: true,
        reposted_by_user: false,
        link_preview_url: p.link_preview_url,
        link_preview_title: p.link_preview_title,
        link_preview_description: p.link_preview_description,
        link_preview_image: p.link_preview_image,
        link_preview_domain: p.link_preview_domain,
        collection_id: b.collection_id,
        collection_name: b.collections?.name || null
      }
    })
    setPosts(mapped)
  }

  useEffect(() => {
    if (session?.user?.id) {
      fetchCollections()
      fetchBookmarks()
    }
  }, [session?.user?.id])

  const refreshBookmarks = async () => {
    await fetchBookmarks()
  }

  const createNewCollection = async () => {
    if (!newCollectionName.trim()) {
      toast({
        title: "Error",
        description: "Collection name is required",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/collections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newCollectionName.trim(),
          description: newCollectionDescription.trim() || null,
          color: newCollectionColor
        })
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Collection created successfully"
        })
        setIsNewCollectionOpen(false)
        setNewCollectionName("")
        setNewCollectionDescription("")
        setNewCollectionColor("#10B981")
        await fetchCollections()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to create collection",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error creating collection:', error)
      toast({
        title: "Error",
        description: "Failed to create collection",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const clearAllCollections = async () => {
    if (!confirm('Are you sure you want to clear all collections? This action cannot be undone.')) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/collections', {
        method: 'DELETE'
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "All collections cleared successfully"
        })
        setCollections([])
        setSelectedCollection(null)
        await fetchBookmarks()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to clear collections",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error clearing collections:', error)
      toast({
        title: "Error",
        description: "Failed to clear collections",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePostUpdate = (postId: string, updates: any) => {
    // Handle post deletion
    if (updates.deleted) {
      setPosts((prevPosts) => prevPosts.filter((post) => post.id !== postId))
      return
    }
    
    setPosts((prevPosts) => prevPosts.map((post) => (post.id === postId ? { ...post, ...updates } : post)))
    // If bookmark status changed, refresh bookmarks
    if (updates.bookmarked_by_user === false || updates.bookmarked_by_user === true) {
      refreshBookmarks()
    }
  }

  const filteredPosts = posts.filter(post => {
    if (!selectedCollection) return true
    return post.collection_id === selectedCollection
  })

  const sortedPosts = [...filteredPosts].sort((a, b) => {
    if (sortBy === "newest") {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    } else if (sortBy === "oldest") {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    } else if (sortBy === "most_liked") {
      return b.likes_count - a.likes_count
    }
    return 0
  })

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto p-4 pb-20 lg:pb-4">
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                <Bookmark className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Bookmarks</h1>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">{posts.length} saved posts</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                <Download className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Export</span>
              </Button>
              <Dialog open={isNewCollectionOpen} onOpenChange={setIsNewCollectionOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                    <FolderPlus className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">New Collection</span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Collection</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="collection-name">Collection Name</Label>
                      <Input
                        id="collection-name"
                        value={newCollectionName}
                        onChange={(e) => setNewCollectionName(e.target.value)}
                        placeholder="Enter collection name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="collection-description">Description (Optional)</Label>
                      <Textarea
                        id="collection-description"
                        value={newCollectionDescription}
                        onChange={(e) => setNewCollectionDescription(e.target.value)}
                        placeholder="Enter collection description"
                      />
                    </div>
                    <div>
                      <Label htmlFor="collection-color">Color</Label>
                      <Input
                        id="collection-color"
                        type="color"
                        value={newCollectionColor}
                        onChange={(e) => setNewCollectionColor(e.target.value)}
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setIsNewCollectionOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={createNewCollection} disabled={loading}>
                        {loading ? "Creating..." : "Create Collection"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Visual Header */}
          <div className="mb-4 sm:mb-6">
            <div className="relative h-24 sm:h-32 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg overflow-hidden">
              <Image
                src="https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1200&h=400&fit=crop"
                alt="Bookmarks collection"
                fill
                className="object-cover opacity-20"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white px-4">
                  <Bookmark className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-2" />
                  <h2 className="text-lg sm:text-xl font-bold">Your Saved Content</h2>
                  <p className="text-sm sm:text-base text-yellow-100 hidden sm:block">Organize and revisit your favorite sustainability posts</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4">
            <Select value={selectedCollection || "all"} onValueChange={(value) => setSelectedCollection(value === "all" ? null : value)}>
              <SelectTrigger className="w-full sm:w-48 h-10">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="All Collections" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Collections</SelectItem>
                {collections.map((collection) => (
                  <SelectItem key={collection.id} value={collection.id}>
                    {collection.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-48 h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="most_liked">Most Liked</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          <div className="lg:col-span-2 space-y-4 lg:space-y-6 order-2 lg:order-1">
            {sortedPosts.length > 0 ? (
              sortedPosts.map((post) => <PostCard key={post.id} post={post} onUpdate={handlePostUpdate} />)
            ) : (
              <Card className="text-center py-12">
                <CardContent>
                  <Bookmark className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No bookmarks yet</h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Start bookmarking posts to save them for later reading
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-4 lg:space-y-6 order-1 lg:order-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Collections</CardTitle>
                  <Dialog open={isNewCollectionOpen} onOpenChange={setIsNewCollectionOpen}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div
                  className={`flex items-center justify-between p-3 sm:p-4 rounded-lg cursor-pointer transition-colors min-h-[48px] ${
                    !selectedCollection
                      ? "bg-green-100 dark:bg-green-900/20"
                      : "hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                  onClick={() => setSelectedCollection(null)}
                >
                  <span className="font-medium text-sm sm:text-base">All Bookmarks</span>
                  <Badge variant="secondary" className="text-xs">{posts.length}</Badge>
                </div>
                {collections.map((collection) => (
                  <div
                    key={collection.id}
                    className={`flex items-center justify-between p-3 sm:p-4 rounded-lg cursor-pointer transition-colors min-h-[48px] ${
                      selectedCollection === collection.id
                        ? "bg-green-100 dark:bg-green-900/20"
                        : "hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                    onClick={() => setSelectedCollection(collection.id)}
                  >
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: collection.color }}
                      />
                      <span className="font-medium text-sm sm:text-base truncate">{collection.name}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs flex-shrink-0">{collection.bookmark_count}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start min-h-[44px] text-sm">
                  <Download className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="truncate">Export All Bookmarks</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start min-h-[44px] text-sm"
                  onClick={clearAllCollections}
                  disabled={loading}
                >
                  <Trash2 className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="truncate">Clear All Collections</span>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
