"use client"

import type React from "react"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import MainLayout from "@/components/main-layout"
import PostCard from "@/components/post-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Users, Hash, FileText, TrendingUp } from "lucide-react"
import Link from "next/link"

const mockUsers = [
  {
    id: "user1",
    username: "sarah_green",
    full_name: "Sarah Green",
    avatar_url: "/images/profiles/sarah-green-avatar.png",
    bio: "Environmental scientist passionate about renewable energy",
    followers: 2847,
    verified: true,
  },
  {
    id: "user2",
    username: "eco_marcus",
    full_name: "Marcus Johnson",
    avatar_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    bio: "Zero waste advocate and sustainability blogger",
    followers: 1234,
    verified: false,
  },
]

const mockHashtags = [
  { tag: "#SolarEnergy", posts: 1247, trend: "+12%" },
  { tag: "#ClimateAction", posts: 892, trend: "+8%" },
  { tag: "#ZeroWaste", posts: 634, trend: "+15%" },
  { tag: "#RenewableEnergy", posts: 567, trend: "+5%" },
]

const mockPosts = [
  {
    id: "search1",
    user: {
      id: "user1",
      username: "sarah_green",
      full_name: "Sarah Green",
      avatar_url: "/images/profiles/sarah-green-avatar.png",
      verified: true,
    },
    content:
      "Just installed our community solar panel system! 🌞 This 50kW installation will power 15 homes and reduce CO2 emissions by 35 tons annually. #SolarEnergy #CommunityPower",
    media_urls: ["https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800&h=600&fit=crop"],
    location: "Portland, Oregon",
    sustainability_category: "Solar Energy",
    impact_score: 92,
    likes_count: 234,
    comments_count: 45,
    reposts_count: 67,
    created_at: "2024-01-15T10:30:00Z",
    liked_by_user: false,
    bookmarked_by_user: false,
  },
]

export default function SearchPage() {
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(searchParams.get("q") || "")
  const [activeTab, setActiveTab] = useState("all")
  const [posts, setPosts] = useState(mockPosts)

  const handlePostUpdate = (postId: string, updates: any) => {
    setPosts((prevPosts) => prevPosts.map((post) => (post.id === postId ? { ...post, ...updates } : post)))
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, this would trigger an API call
    console.log("Searching for:", query)
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
            <Button type="submit" className="sustainability-gradient">
              Search
            </Button>
          </form>

          {query && (
            <div className="mb-4">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Search results for "{query}"</h1>
            </div>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
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

          <TabsContent value="all" className="space-y-6">
            {/* Users Section */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Users</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {mockUsers.slice(0, 2).map((user) => (
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
                              <Badge variant="secondary" className="text-xs">
                                ✓
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">@{user.username}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{user.bio}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {user.followers.toLocaleString()} followers
                          </p>
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
            </div>

            {/* Hashtags Section */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Hashtags</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {mockHashtags.slice(0, 2).map((hashtag) => (
                  <Card key={hashtag.tag} className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-gray-100">{hashtag.tag}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {hashtag.posts.toLocaleString()} posts
                          </p>
                        </div>
                        <Badge variant="secondary" className="text-green-600">
                          {hashtag.trend}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Posts Section */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Posts</h2>
              <div className="space-y-4">
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} onUpdate={handlePostUpdate} />
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            {mockUsers.map((user) => (
              <Card key={user.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={user.avatar_url || "/placeholder.svg"} />
                      <AvatarFallback className="bg-green-500 text-white text-xl">
                        {user.full_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/profile/${user.username}`}
                          className="text-xl font-semibold text-gray-900 dark:text-gray-100 hover:underline"
                        >
                          {user.full_name}
                        </Link>
                        {user.verified && <Badge variant="secondary">✓ Verified</Badge>}
                      </div>
                      <p className="text-gray-500 dark:text-gray-400">@{user.username}</p>
                      <p className="text-gray-600 dark:text-gray-300 mt-2">{user.bio}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                        {user.followers.toLocaleString()} followers
                      </p>
                    </div>
                    <Button className="sustainability-gradient">Follow</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="posts" className="space-y-4">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} onUpdate={handlePostUpdate} />
            ))}
          </TabsContent>

          <TabsContent value="hashtags" className="space-y-4">
            {mockHashtags.map((hashtag) => (
              <Card key={hashtag.tag} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{hashtag.tag}</h3>
                      <p className="text-gray-500 dark:text-gray-400">{hashtag.posts.toLocaleString()} posts</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                      <Badge variant="secondary" className="text-green-600">
                        {hashtag.trend}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>

        {query && (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">
              Can't find what you're looking for? Try different keywords or check your spelling.
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
