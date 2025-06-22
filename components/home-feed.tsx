"use client"

import { useState, useEffect } from "react"
import { useSession } from "@supabase/auth-helpers-react"
import MainLayout from "@/components/main-layout"
import PostCard from "@/components/post-card"
import CreatePostModal from "@/components/create-post-modal"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { TrendingUp, Users, Sparkles, Plus } from "lucide-react"

// Mock data for demonstration
const mockPosts = [
  {
    id: "1",
    user: {
      id: "user1",
      username: "sarah_green",
      full_name: "Sarah Green",
      avatar_url: "/images/profiles/sarah-green-avatar.png",
      verified: true,
    },
    content:
      "Just installed 20 solar panels on our community center! 🌞 This will reduce our carbon footprint by 80% and save $3,000 annually. Small steps lead to big changes! #SolarEnergy #CommunityAction",
    media_urls: ["https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&h=600&fit=crop"],
    location: "Portland, Oregon",
    sustainability_category: "Solar Energy",
    impact_score: 85,
    likes_count: 234,
    comments_count: 18,
    reposts_count: 45,
    created_at: "2024-01-15T10:30:00Z",
    liked_by_user: false,
    bookmarked_by_user: false,
  },
  {
    id: "2",
    user: {
      id: "user2",
      username: "eco_marcus",
      full_name: "Marcus Johnson",
      avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
      verified: false,
    },
    content:
      "Week 3 of our zero-waste challenge! Our family has reduced waste by 90% through composting, reusable containers, and mindful shopping. Who else is joining the movement? 🌱",
    media_urls: [
      "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop",
    ],
    location: "Austin, Texas",
    sustainability_category: "Waste Reduction",
    impact_score: 72,
    likes_count: 156,
    comments_count: 32,
    reposts_count: 28,
    created_at: "2024-01-15T08:15:00Z",
    liked_by_user: true,
    bookmarked_by_user: true,
  },
  {
    id: "3",
    user: {
      id: "user3",
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
    bookmarked_by_user: false,
  },
  {
    id: "4",
    user: {
      id: "user4",
      username: "urban_gardener",
      full_name: "Maya Patel",
      avatar_url: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
      verified: false,
    },
    content:
      "Transformed our apartment balcony into a thriving urban garden! 🌿 Growing our own herbs, vegetables, and flowers. Even small spaces can make a big difference for biodiversity and food security.",
    media_urls: [
      "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=400&h=300&fit=crop",
    ],
    location: "New York, NY",
    sustainability_category: "Sustainable Agriculture",
    impact_score: 68,
    likes_count: 445,
    comments_count: 89,
    reposts_count: 67,
    created_at: "2024-01-14T12:20:00Z",
    liked_by_user: true,
    bookmarked_by_user: false,
  },
  {
    id: "5",
    user: {
      id: "user5",
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
  },
]

export default function HomeFeed() {
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("for-you")
  const [createPostOpen, setCreatePostOpen] = useState(false)
  const session = useSession()

  // Fetch posts from API
  const fetchPosts = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/posts')
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Failed to fetch posts - Status:', response.status, 'Response:', errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }
      
      const data = await response.json()
      // Use real data from API, or empty array if no posts
      setPosts(data || [])
    } catch (error) {
      console.error('Error fetching posts:', error)
      console.error('This error is likely due to missing Supabase configuration.')
      console.error('Please check your .env.local file and ensure Supabase environment variables are set.')
      setPosts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPosts()
  }, [])

  const handlePostUpdate = async (postId: string, updates: any) => {
    // Optimistically update the UI
    setPosts((prevPosts) => prevPosts.map((post) => (post.id === postId ? { ...post, ...updates } : post)))
    
    // If it's a like/unlike action, make API call
    if ('liked_by_user' in updates) {
      try {
        const method = updates.liked_by_user ? 'POST' : 'DELETE'
        const response = await fetch(`/api/posts/${postId}/like`, { method })
        
        if (!response.ok) {
          // Revert the optimistic update if API call fails
          setPosts((prevPosts) => prevPosts.map((post) => 
            post.id === postId ? { 
              ...post, 
              liked_by_user: !updates.liked_by_user,
              likes_count: updates.liked_by_user ? post.likes_count - 1 : post.likes_count + 1
            } : post
          ))
        }
      } catch (error) {
        console.error('Error updating like:', error)
        // Revert the optimistic update
        setPosts((prevPosts) => prevPosts.map((post) => 
          post.id === postId ? { 
            ...post, 
            liked_by_user: !updates.liked_by_user,
            likes_count: updates.liked_by_user ? post.likes_count - 1 : post.likes_count + 1
          } : post
        ))
      }
    }
  }

  const LoadingSkeleton = () => (
    <div className="space-y-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-6 space-y-4">
          <div className="flex items-center space-x-3">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-48 w-full rounded-lg" />
          <div className="flex items-center space-x-6">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-16" />
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto p-4 pb-20 lg:pb-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="for-you" className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4" />
              <span>For You</span>
            </TabsTrigger>
            <TabsTrigger value="trending" className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4" />
              <span>Trending</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="for-you" className="space-y-6 mt-6">
            {loading ? (
              <LoadingSkeleton />
            ) : (
              posts.map((post) => <PostCard key={post.id} post={post} onUpdate={handlePostUpdate} />)
            )}
          </TabsContent>

          <TabsContent value="trending" className="space-y-6 mt-6">
            {loading ? (
              <LoadingSkeleton />
            ) : (
              posts
                .sort((a, b) => b.likes_count - a.likes_count)
                .map((post) => <PostCard key={post.id} post={post} onUpdate={handlePostUpdate} />)
            )}
          </TabsContent>
        </Tabs>

        {posts.length === 0 && !loading && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No posts yet</h3>
            <p className="text-gray-500 dark:text-gray-400">
              Follow some users or create your first post to get started!
            </p>
          </div>
        )}

        {/* Floating Action Button */}
        <Button
          onClick={() => setCreatePostOpen(true)}
          className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 w-14 h-14 rounded-full sustainability-gradient shadow-lg hover:shadow-xl transition-shadow z-50"
          size="lg"
        >
          <Plus className="w-6 h-6" />
        </Button>

        {/* Create Post Modal */}
        <CreatePostModal open={createPostOpen} onOpenChange={setCreatePostOpen} onPostCreated={fetchPosts} />
      </div>
    </MainLayout>
  )
}
