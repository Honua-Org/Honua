"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Search, User, FileText, Hash, Loader2 } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import Link from "next/link"

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
}

interface User {
  id: string
  username: string
  full_name: string
  avatar_url?: string
  bio?: string
  followers_count: number
}

interface Post {
  id: string
  content: string
  created_at: string
  user: {
    username: string
    full_name: string
    avatar_url?: string
  }
}

interface Hashtag {
  name: string
  count: number
}

interface SearchResults {
  users: User[]
  posts: Post[]
  hashtags: Hashtag[]
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResults>({
    users: [],
    posts: [],
    hashtags: []
  })
  const [isLoading, setIsLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClientComponentClient()

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [isOpen])

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setQuery("")
      setSearchResults({ users: [], posts: [], hashtags: [] })
      setHasSearched(false)
    }
  }, [isOpen])

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setSearchResults({ users: [], posts: [], hashtags: [] })
      setHasSearched(false)
      return
    }

    setIsLoading(true)
    setHasSearched(true)

    try {
      const [usersResponse, postsResponse, hashtagsResponse] = await Promise.all([
        // Search users
        supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url, bio, followers_count')
          .or(`username.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%`)
          .limit(5),
        
        // Search posts
        supabase
          .from('posts')
          .select(`
            id,
            content,
            created_at,
            user_id,
            profiles!posts_user_id_fkey(
              username,
              full_name,
              avatar_url
            )
          `)
          .textSearch('content', searchQuery)
          .limit(5),
        
        // Search hashtags
        supabase
          .from('hashtags')
          .select('name, posts_count')
          .ilike('name', `%${searchQuery}%`)
          .limit(5)
      ])

      setSearchResults({
        users: usersResponse.data || [],
        posts: (postsResponse.data || []).map(post => ({
          ...post,
          user: Array.isArray(post.profiles) ? post.profiles[0] : post.profiles
        })),
        hashtags: (hashtagsResponse.data || []).map(h => ({ name: h.name, count: h.posts_count }))
      })
    } catch (error) {
      console.error('Search error:', error)
      setSearchResults({ users: [], posts: [], hashtags: [] })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      onClose()
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
    }
  }

  const handleResultClick = (path: string) => {
    onClose()
    router.push(path)
  }

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(query)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [query])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="sr-only">Search</DialogTitle>
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              ref={inputRef}
              type="text"
              placeholder="Search for users, posts, hashtags..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 text-lg h-12 border-0 border-b rounded-none focus-visible:ring-0 focus-visible:border-green-500"
            />
          </form>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 pt-4">
          {isLoading && (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-green-600" />
            </div>
          )}

          {!isLoading && hasSearched && (
            <div className="space-y-6">
              {/* Users */}
              {searchResults.users.length > 0 && (
                <div>
                  <div className="flex items-center mb-3">
                    <User className="w-4 h-4 mr-2 text-gray-500" />
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">Users</h3>
                  </div>
                  <div className="space-y-2">
                    {searchResults.users.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => handleResultClick(`/profile/${user.username}`)}
                        className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-left transition-colors"
                      >
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={user.avatar_url || "/placeholder-user.jpg"} />
                          <AvatarFallback className="bg-green-500 text-white">
                            {user.full_name?.charAt(0) || user.username?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                            {user.full_name || user.username}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            @{user.username}
                          </p>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {user.followers_count} followers
                        </Badge>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Posts */}
              {searchResults.posts.length > 0 && (
                <div>
                  <div className="flex items-center mb-3">
                    <FileText className="w-4 h-4 mr-2 text-gray-500" />
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">Posts</h3>
                  </div>
                  <div className="space-y-2">
                    {searchResults.posts.map((post) => (
                      <button
                        key={post.id}
                        onClick={() => handleResultClick(`/post/${post.id}`)}
                        className="w-full flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-left transition-colors"
                      >
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={post.user?.avatar_url || "/placeholder-user.jpg"} />
                          <AvatarFallback className="bg-green-500 text-white text-xs">
                            {post.user?.full_name?.charAt(0) || post.user?.username?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                            @{post.user?.username}
                          </p>
                          <p className="text-sm text-gray-900 dark:text-gray-100 line-clamp-2">
                            {post.content}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Hashtags */}
              {searchResults.hashtags.length > 0 && (
                <div>
                  <div className="flex items-center mb-3">
                    <Hash className="w-4 h-4 mr-2 text-gray-500" />
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">Hashtags</h3>
                  </div>
                  <div className="space-y-2">
                    {searchResults.hashtags.map((hashtag) => (
                      <button
                        key={hashtag.name}
                        onClick={() => handleResultClick(`/search?q=${encodeURIComponent(hashtag.name)}`)}
                        className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-left transition-colors"
                      >
                        <span className="font-medium text-green-600 dark:text-green-400">
                          #{hashtag.name}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {hashtag.count} posts
                        </Badge>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* No results */}
              {Object.values(searchResults).every(arr => arr.length === 0) && (
                <div className="text-center py-8">
                  <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">
                    No results found for "{query}"
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                    Try different keywords or check your spelling
                  </p>
                </div>
              )}
            </div>
          )}

          {!hasSearched && !query && (
            <div className="text-center py-8">
              <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">
                Start typing to search for users, posts, and hashtags
              </p>
            </div>
          )}

          {query && !isLoading && (
            <div className="mt-6 pt-4 border-t">
              <Button 
                onClick={handleSearch}
                className="w-full sustainability-gradient"
              >
                View all results for "{query}"
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}