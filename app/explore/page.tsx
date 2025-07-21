"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import MainLayout from "@/components/main-layout"
import PostCard from "@/components/post-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, TrendingUp, Users, Calendar, Sparkles, Verified, Loader2 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

interface User {
  id: string
  username: string
  full_name: string
  avatar_url: string
  verified: boolean
  bio?: string
}

interface Post {
  id: string
  content: string
  image_url?: string
  created_at: string
  likes_count: number
  comments_count: number
  shares_count: number
  reposts_count: number
  updated_at: string
  liked_by_user: boolean
  bookmarked_by_user: boolean
  reposted_by_user: boolean
  media_urls?: string[]
  location?: string
  sustainability_category?: string
  impact_score?: number
  parent_id?: string
  link_preview_url?: string
  link_preview_title?: string
  link_preview_description?: string
  link_preview_image?: string
  link_preview_domain?: string
  user: User
}

interface Hashtag {
  name: string
  count: number
}

interface Category {
  id: string
  name: string
  description?: string
  icon?: string
  color?: string
  posts_count: number
}

const sustainabilityCategories = [
  "All Categories",
  "Solar Energy",
  "Wind Power",
  "Recycling & Waste Reduction",
  "Sustainable Transportation",
  "Green Building",
  "Climate Action",
  "Conservation",
  "Renewable Energy",
  "Sustainable Agriculture",
  "Environmental Education",
]

export default function ExplorePage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All Categories")
  const [activeTab, setActiveTab] = useState("trending")
  const [trendingHashtags, setTrendingHashtags] = useState<Hashtag[]>([])
  const [featuredUsers, setFeaturedUsers] = useState<User[]>([])
  const [trendingPosts, setTrendingPosts] = useState<Post[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTrendingData = useCallback(async () => {
    try {
      setLoading(true)
      
      // Fetch trending hashtags
      const hashtagsResponse = await fetch('/api/hashtags/search?q=')
      if (hashtagsResponse.ok) {
        const hashtagsData = await hashtagsResponse.json()
        // Extract hashtags array from response object
        const hashtags = hashtagsData.hashtags || []
        setTrendingHashtags(hashtags.slice(0, 5))
      }
      
      // Fetch featured users
      const usersResponse = await fetch('/api/users/search?q=&limit=3')
      if (usersResponse.ok) {
        const usersData = await usersResponse.json()
        // Extract users array from response object
        const users = usersData.users || []
        
        // Transform users to ensure avatar_url is always present
        const transformedUsers = users.map((user: any) => ({
          ...user,
          avatar_url: user.avatar_url || "/placeholder.svg"
        }))
        
        setFeaturedUsers(transformedUsers)
      }
      
      // Fetch trending posts
      const postsResponse = await fetch('/api/posts/search?q=&limit=10')
      if (postsResponse.ok) {
        const postsData = await postsResponse.json()
        // Extract posts array from response object
        const posts = postsData.posts || []
        
        // Transform posts to include missing properties with default values
         const transformedPosts = posts.map((post: any) => ({
           ...post,
           user: {
             ...post.user,
             avatar_url: post.user?.avatar_url || "/placeholder.svg"
           },
           reposts_count: post.reposts_count || post.shares_count || 0,
           updated_at: post.updated_at || post.created_at,
           liked_by_user: post.liked_by_user || false,
           bookmarked_by_user: post.bookmarked_by_user || false,
           reposted_by_user: post.reposted_by_user || false,
           media_urls: post.media_urls || (post.image_url ? [post.image_url] : []),
           location: post.location || undefined,
           sustainability_category: post.sustainability_category || undefined,
           impact_score: post.impact_score || undefined,
           parent_id: post.parent_id || undefined,
           link_preview_url: post.link_preview_url || undefined,
           link_preview_title: post.link_preview_title || undefined,
           link_preview_description: post.link_preview_description || undefined,
           link_preview_image: post.link_preview_image || undefined,
           link_preview_domain: post.link_preview_domain || undefined
         }))
        
        setTrendingPosts(transformedPosts)
      }
      
      // Fetch categories
      const categoriesResponse = await fetch('/api/categories/search?q=&limit=10')
      if (categoriesResponse.ok) {
        const categoriesData = await categoriesResponse.json()
        // Extract categories array from response object
        const categories = categoriesData.categories || []
        setCategories(categories)
      }
    } catch (error) {
      console.error('Error fetching trending data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTrendingData()
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const handlePostUpdate = (postId: string, updates: any) => {
    setTrendingPosts((prevPosts) => prevPosts.map((post) => (post.id === postId ? { ...post, ...updates } : post)))
  }

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto p-4 pb-20 lg:pb-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Explore Sustainability</h1>

          <form onSubmit={handleSearch} className="flex space-x-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search posts, users, hashtags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sustainabilityCategories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="submit" className="sustainability-gradient">
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </form>

          {/* Featured Content Banner */}
          <div className="mb-6">
            <Card className="relative overflow-hidden">
              <div className="relative h-48 md:h-64">
                <Image
                  src="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&h=600&fit=crop"
                  alt="Featured sustainability content"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-green-900/80 to-transparent" />
                <div className="absolute inset-0 flex items-center">
                  <div className="p-6 text-white">
                    <h2 className="text-2xl md:text-3xl font-bold mb-2">Discover Sustainability Stories</h2>
                    <p className="text-green-100 mb-4 max-w-md">
                      Explore inspiring content from environmental leaders, innovators, and activists making a
                      difference.
                    </p>
                    <Button className="bg-white text-green-800 hover:bg-green-50">Explore Now</Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="trending">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Trending
                </TabsTrigger>
                <TabsTrigger value="recent">
                  <Calendar className="w-4 h-4 mr-2" />
                  Recent
                </TabsTrigger>
                <TabsTrigger value="featured">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Featured
                </TabsTrigger>
              </TabsList>

              <TabsContent value="trending" className="space-y-6 mt-6">
                {loading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-green-600" />
                  </div>
                ) : (
                  trendingPosts.map((post) => (
                    <PostCard key={post.id} post={post} onUpdate={handlePostUpdate} />
                  ))
                )}
              </TabsContent>

              <TabsContent value="recent" className="space-y-6 mt-6">
                <div className="text-center py-12">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Recent Posts</h3>
                  <p className="text-gray-500 dark:text-gray-400">Latest sustainability posts from the community</p>
                </div>
              </TabsContent>

              <TabsContent value="featured" className="space-y-6 mt-6">
                <div className="text-center py-12">
                  <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Featured Content</h3>
                  <p className="text-gray-500 dark:text-gray-400">Curated sustainability content from experts</p>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-6">
            {/* Trending Topics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <span>Trending Topics</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {loading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="w-6 h-6 animate-spin text-green-600" />
                  </div>
                ) : (
                  trendingHashtags.map((hashtag, index) => (
                    <div
                      key={hashtag.name}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                    >
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">#{hashtag.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{hashtag.count.toLocaleString()} posts</p>
                      </div>
                      <Badge variant="secondary" className="text-green-600">
                        Trending
                      </Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Featured Users */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-green-600" />
                  <span>Who to Follow</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="w-6 h-6 animate-spin text-green-600" />
                  </div>
                ) : (
                  featuredUsers.map((user) => (
                    <div key={user.id} className="flex items-center space-x-3">
                      <div className="relative">
                        <Avatar>
                          <AvatarImage src={user.avatar_url} alt={user.full_name} />
                          <AvatarFallback>{user.full_name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        {user.verified && (
                          <Verified className="absolute -bottom-1 -right-1 w-4 h-4 text-blue-500 bg-white rounded-full" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{user.full_name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">@{user.username}</p>
                        {user.bio && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.bio}</p>
                        )}
                      </div>
                      <Button size="sm" variant="outline" className="text-green-600 border-green-600 hover:bg-green-50">
                        Follow
                      </Button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Sustainability Categories */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-green-600" />
                  Sustainability Categories
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="w-6 h-6 animate-spin text-green-600" />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {categories.length > 0 ? (
                      categories.map((category) => (
                        <Badge
                          key={category.id}
                          variant="outline"
                          className="justify-center p-2 cursor-pointer hover:bg-green-50 hover:border-green-300 dark:hover:bg-green-900/20"
                        >
                          {category.name}
                        </Badge>
                      ))
                    ) : (
                      sustainabilityCategories.slice(1).map((category) => (
                        <Badge
                          key={category}
                          variant="outline"
                          className="justify-center p-2 cursor-pointer hover:bg-green-50 hover:border-green-300 dark:hover:bg-green-900/20"
                        >
                          {category}
                        </Badge>
                      ))
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
