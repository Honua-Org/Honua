"use client"

import type React from "react"

import { useState } from "react"
import MainLayout from "@/components/main-layout"
import PostCard from "@/components/post-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, TrendingUp, Users, Calendar, Sparkles } from "lucide-react"
import Image from "next/image"

const trendingTopics = [
  { name: "#SolarEnergy", posts: 1247, trend: "+12%" },
  { name: "#ClimateAction", posts: 892, trend: "+8%" },
  { name: "#ZeroWaste", posts: 634, trend: "+15%" },
  { name: "#RenewableEnergy", posts: 567, trend: "+5%" },
  { name: "#SustainableLiving", posts: 445, trend: "+22%" },
]

const featuredUsers = [
  {
    id: "user1",
    username: "dr_climate",
    full_name: "Dr. Sarah Climate",
    avatar_url: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&h=150&fit=crop&crop=face",
    bio: "Climate scientist & sustainability advocate",
    followers: 12500,
    verified: true,
  },
  {
    id: "user2",
    username: "green_innovator",
    full_name: "Alex Green",
    avatar_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    bio: "Green tech entrepreneur",
    followers: 8900,
    verified: false,
  },
  {
    id: "user3",
    username: "eco_educator",
    full_name: "Maria Santos",
    avatar_url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face",
    bio: "Environmental educator & activist",
    followers: 6700,
    verified: true,
  },
]

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

const mockTrendingPosts = [
  {
    id: "trending1",
    user: {
      id: "user1",
      username: "renewable_future",
      full_name: "Renewable Future Initiative",
      avatar_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      verified: true,
    },
    content:
      "BREAKING: New solar panel technology achieves 47% efficiency! This could revolutionize renewable energy adoption worldwide. The future is bright! ☀️ #SolarEnergy #Innovation",
    media_urls: ["https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800&h=600&fit=crop"],
    location: "Global",
    sustainability_category: "Solar Energy",
    impact_score: 92,
    likes_count: 2847,
    comments_count: 234,
    reposts_count: 892,
    created_at: "2024-01-15T14:30:00Z",
    liked_by_user: false,
    bookmarked_by_user: false,
  },
  {
    id: "trending2",
    user: {
      id: "user2",
      username: "ocean_guardian",
      full_name: "Ocean Guardian Project",
      avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
      verified: true,
    },
    content:
      "Our latest ocean cleanup mission removed 50 tons of plastic waste! 🌊 Thanks to 500+ volunteers who joined us. Together, we can restore our oceans. #OceanCleanup #Conservation",
    media_urls: [
      "https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=300&fit=crop",
    ],
    location: "Pacific Coast",
    sustainability_category: "Conservation",
    impact_score: 88,
    likes_count: 1956,
    comments_count: 167,
    reposts_count: 445,
    created_at: "2024-01-15T11:15:00Z",
    liked_by_user: true,
    bookmarked_by_user: false,
  },
]

export default function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All Categories")
  const [posts, setPosts] = useState(mockTrendingPosts)
  const [activeTab, setActiveTab] = useState("trending")

  const handlePostUpdate = (postId: string, updates: any) => {
    setPosts((prevPosts) => prevPosts.map((post) => (post.id === postId ? { ...post, ...updates } : post)))
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Implement search functionality
    console.log("Searching for:", searchQuery)
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
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} onUpdate={handlePostUpdate} />
                ))}
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
                {trendingTopics.map((topic, index) => (
                  <div
                    key={topic.name}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{topic.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{topic.posts.toLocaleString()} posts</p>
                    </div>
                    <Badge variant="secondary" className="text-green-600">
                      {topic.trend}
                    </Badge>
                  </div>
                ))}
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
                {featuredUsers.map((user) => (
                  <div key={user.id} className="flex items-center space-x-3">
                    <div className="relative">
                      <Image
                        src={user.avatar_url || "/placeholder.svg"}
                        alt={user.full_name}
                        width={48}
                        height={48}
                        className="rounded-full"
                      />
                      {user.verified && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                          <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{user.full_name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">@{user.username}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.bio}</p>
                    </div>
                    <Button size="sm" variant="outline" className="text-green-600 border-green-600 hover:bg-green-50">
                      Follow
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Sustainability Categories */}
            <Card>
              <CardHeader>
                <CardTitle>Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {sustainabilityCategories.slice(1).map((category) => (
                    <Badge
                      key={category}
                      variant="secondary"
                      className="cursor-pointer hover:bg-green-100 hover:text-green-800 dark:hover:bg-green-900 dark:hover:text-green-200"
                    >
                      {category}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
