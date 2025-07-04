"use client"

import { useState } from "react"
import MainLayout from "@/components/main-layout"
import PostCard from "@/components/post-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Bookmark, Filter, Download, Trash2, FolderPlus } from "lucide-react"
import Image from "next/image"

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

const bookmarkCategories = ["All", "Research", "Events", "Tips", "News", "Inspiration"]

export default function BookmarksPage() {
  const [posts, setPosts] = useState(mockBookmarkedPosts)
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [sortBy, setSortBy] = useState("newest")

  const handlePostUpdate = (postId: string, updates: any) => {
    setPosts((prevPosts) => prevPosts.map((post) => (post.id === postId ? { ...post, ...updates } : post)))
  }

  const filteredPosts = posts.filter(
    (post) => selectedCategory === "All" || post.bookmark_category === selectedCategory,
  )

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
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center">
                <Bookmark className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Bookmarks</h1>
                <p className="text-gray-600 dark:text-gray-400">{posts.length} saved posts</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm">
                <FolderPlus className="w-4 h-4 mr-2" />
                New Collection
              </Button>
            </div>
          </div>

          {/* Visual Header */}
          <div className="mb-6">
            <div className="relative h-32 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg overflow-hidden">
              <Image
                src="https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1200&h=400&fit=crop"
                alt="Bookmarks collection"
                fill
                className="object-cover opacity-20"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white">
                  <Bookmark className="w-12 h-12 mx-auto mb-2" />
                  <h2 className="text-xl font-bold">Your Saved Content</h2>
                  <p className="text-yellow-100">Organize and revisit your favorite sustainability posts</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {bookmarkCategories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-48">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
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

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Collections</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {bookmarkCategories.slice(1).map((category) => (
                  <div
                    key={category}
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedCategory === category
                        ? "bg-green-100 dark:bg-green-900/20"
                        : "hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                    onClick={() => setSelectedCategory(category)}
                  >
                    <span className="font-medium">{category}</span>
                    <Badge variant="secondary">
                      {posts.filter((post) => post.bookmark_category === category).length}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Download className="w-4 h-4 mr-2" />
                  Export All Bookmarks
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear All Bookmarks
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
