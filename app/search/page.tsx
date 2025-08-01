"use client"

import type React from "react"

import { useState, useEffect, useCallback, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import MainLayout from "@/components/main-layout"
import PostCard from "@/components/post-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Users, Hash, FileText, TrendingUp, Verified, Loader2 } from "lucide-react"
import Link from "next/link"
import { renderContentWithLinksAndMentions } from "@/lib/mention-utils"
import { formatDistanceToNow } from "date-fns"

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
  user: User
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

interface SearchResults {
  users: User[]
  posts: Post[]
  hashtags: Hashtag[]
  categories: Category[]
}

function SearchPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [query, setQuery] = useState(searchParams.get("q") || "")
  const [activeTab, setActiveTab] = useState(searchParams.get("type") || "all")
  const [searchResults, setSearchResults] = useState<SearchResults>({
    users: [],
    posts: [],
    hashtags: [],
    categories: []
  })
  const [isLoading, setIsLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const performSearch = useCallback(async (searchQuery: string, searchType: string = "all") => {
    if (!searchQuery.trim()) {
      setSearchResults({ users: [], posts: [], hashtags: [], categories: [] })
      setHasSearched(false)
      return
    }

    setIsLoading(true)
    setHasSearched(true)

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&type=${searchType}&limit=10`)
      if (response.ok) {
        const data = await response.json()
        
        // Transform posts to include missing properties with default values
        const transformedPosts = (data.posts || []).map((post: any) => ({
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
        
        // Transform users to ensure avatar_url is always present
        const transformedUsers = (data.users || []).map((user: any) => ({
          ...user,
          avatar_url: user.avatar_url || "/placeholder.svg"
        }))
        
        setSearchResults({
          users: transformedUsers,
          posts: transformedPosts,
          hashtags: data.hashtags || [],
          categories: data.categories || []
        })
      } else {
        console.error('Search failed:', response.statusText)
        setSearchResults({ users: [], posts: [], hashtags: [], categories: [] })
      }
    } catch (error) {
      console.error('Search error:', error)
      setSearchResults({ users: [], posts: [], hashtags: [], categories: [] })
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const initialQuery = searchParams.get("q")
    const initialType = searchParams.get("type") || "all"
    
    if (initialQuery) {
      setQuery(initialQuery)
      setActiveTab(initialType)
      performSearch(initialQuery, initialType)
    }
  }, [searchParams, performSearch])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      const newUrl = `/search?q=${encodeURIComponent(query)}&type=${activeTab}`
      router.push(newUrl)
      performSearch(query, activeTab)
    }
  }

  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab)
    if (query.trim()) {
      const newUrl = `/search?q=${encodeURIComponent(query)}&type=${newTab}`
      router.push(newUrl)
      performSearch(query, newTab)
    }
  }

  const handlePostUpdate = (postId: string, updates: any) => {
    setSearchResults(prev => ({
      ...prev,
      posts: prev.posts.map(post => post.id === postId ? { ...post, ...updates } : post)
    }))
  }

  const renderUsers = (users: User[], showAll: boolean = false) => {
    const displayUsers = showAll ? users : users.slice(0, 2)
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayUsers.map((user) => (
          <Card key={user.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={user.avatar_url || "/placeholder.svg"} />
                  <AvatarFallback className="bg-green-500 text-white">
                    {user.full_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-1">
                    <Link
                      href={`/profile/${user.username}`}
                      className="font-semibold text-gray-900 dark:text-gray-100 hover:underline"
                    >
                      {user.full_name}
                    </Link>
                    {user.verified && (
                      <Verified className="w-4 h-4 text-blue-500" />
                    )}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">@{user.username}</p>
                  {user.bio && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{user.bio}</p>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-green-600 border-green-600 hover:bg-green-50"
                >
                  Follow
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const renderHashtags = (hashtags: Hashtag[], showAll: boolean = false) => {
    const displayHashtags = showAll ? hashtags : hashtags.slice(0, 2)
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayHashtags.map((hashtag) => (
          <Link key={hashtag.name} href={`/search?q=${encodeURIComponent('#' + hashtag.name)}&type=hashtags`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-blue-600 dark:text-blue-400">#{hashtag.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {hashtag.count.toLocaleString()} posts
                    </p>
                  </div>
                  <Hash className="w-5 h-5 text-blue-500" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    )
  }

  const renderCategories = (categories: Category[]) => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categories.map((category) => (
          <Card key={category.id} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{category.name}</p>
                  {category.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{category.description}</p>
                  )}
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {category.posts_count.toLocaleString()} posts
                  </p>
                </div>
                {category.icon && (
                  <div className="text-2xl">{category.icon}</div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto p-4 pb-20 lg:pb-4">
        <div className="mb-6">
          <form onSubmit={handleSearch} className="flex space-x-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search for users, posts, hashtags..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit" className="sustainability-gradient" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Search"
              )}
            </Button>
          </form>

          {query && hasSearched && (
            <div className="mb-4">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Search results for "{query}"</h1>
            </div>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="all">
              <FileText className="w-4 h-4 mr-2" />
              All
            </TabsTrigger>
            <TabsTrigger value="users">
              <Users className="w-4 h-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="posts">
              <FileText className="w-4 h-4 mr-2" />
              Posts
            </TabsTrigger>
            <TabsTrigger value="hashtags">
              <Hash className="w-4 h-4 mr-2" />
              Hashtags
            </TabsTrigger>
          </TabsList>

          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-green-600" />
            </div>
          ) : (
            <>
              <TabsContent value="all" className="space-y-6">
                {/* Users Section */}
                {searchResults.users.length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Users</h2>
                    {renderUsers(searchResults.users)}
                    {searchResults.users.length > 2 && (
                      <div className="mt-4 text-center">
                        <Button variant="outline" onClick={() => handleTabChange('users')}>
                          View all {searchResults.users.length} users
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* Hashtags Section */}
                {searchResults.hashtags.length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Hashtags</h2>
                    {renderHashtags(searchResults.hashtags)}
                    {searchResults.hashtags.length > 2 && (
                      <div className="mt-4 text-center">
                        <Button variant="outline" onClick={() => handleTabChange('hashtags')}>
                          View all {searchResults.hashtags.length} hashtags
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* Categories Section */}
                {searchResults.categories.length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Categories</h2>
                    {renderCategories(searchResults.categories)}
                  </div>
                )}

                {/* Posts Section */}
                {searchResults.posts.length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Posts</h2>
                    <div className="space-y-4">
                      {searchResults.posts.slice(0, 3).map((post) => (
                        <PostCard key={post.id} post={post} onUpdate={handlePostUpdate} />
                      ))}
                    </div>
                    {searchResults.posts.length > 3 && (
                      <div className="mt-4 text-center">
                        <Button variant="outline" onClick={() => handleTabChange('posts')}>
                          View all {searchResults.posts.length} posts
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {hasSearched && Object.values(searchResults).every(arr => arr.length === 0) && (
                  <div className="text-center py-12">
                    <p className="text-gray-500 dark:text-gray-400">
                      No results found for "{query}". Try different keywords or check your spelling.
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="users" className="space-y-4">
                {searchResults.users.length > 0 ? (
                  renderUsers(searchResults.users, true)
                ) : hasSearched ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500 dark:text-gray-400">
                      No users found for "{query}".
                    </p>
                  </div>
                ) : null}
              </TabsContent>

              <TabsContent value="posts" className="space-y-4">
                {searchResults.posts.length > 0 ? (
                  searchResults.posts.map((post) => (
                    <PostCard key={post.id} post={post} onUpdate={handlePostUpdate} />
                  ))
                ) : hasSearched ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500 dark:text-gray-400">
                      No posts found for "{query}".
                    </p>
                  </div>
                ) : null}
              </TabsContent>

              <TabsContent value="hashtags" className="space-y-4">
                {searchResults.hashtags.length > 0 ? (
                  renderHashtags(searchResults.hashtags, true)
                ) : hasSearched ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500 dark:text-gray-400">
                      No hashtags found for "{query}".
                    </p>
                  </div>
                ) : null}
              </TabsContent>
            </>
          )}
        </Tabs>

        {!hasSearched && !query && (
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">
              Search Honua Social
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              Find users, posts, hashtags, and sustainability topics
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <MainLayout>
        <div className="max-w-4xl mx-auto p-4 pb-20 lg:pb-4">
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">
                Loading Search...
              </h2>
            </div>
          </div>
        </div>
      </MainLayout>
    }>
      <SearchPageContent />
    </Suspense>
  )
}
