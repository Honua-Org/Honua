"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { useSession } from "@supabase/auth-helpers-react"
import { createClient } from "@/lib/supabase/client"
import { uploadCoverImage } from "@/lib/storage"
import MainLayout from "@/components/main-layout"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  MapPin,
  LinkIcon,
  Calendar,
  MessageCircle,
  Settings,
  UserPlus,
  UserMinus,
  CheckCircle,
  Award,
  Leaf,
  Camera,
  Upload,
  Trash2,
} from "lucide-react"
import Image from "next/image"
import PostCard from "@/components/post-card"

// Mock user data
const mockUser = {
  id: "user1",
  username: "sarah_green",
  full_name: "Sarah Green",
  avatar_url: "/images/profiles/sarah-green-avatar.png",
  cover_url: "/images/covers/sarah-green-cover.png",
  bio: "Environmental scientist passionate about renewable energy and climate action. PhD in Environmental Science from Stanford. Leading community solar initiatives across the Pacific Northwest. 🌱",
  location: "Portland, Oregon",
  website: "https://sarahgreen.eco",
  verified: true,
  role: "user",
  reputation: 850,
  followers_count: 2847,
  following_count: 456,
  posts_count: 234,
  joined_date: "2023-03-15",
  sustainability_categories: ["Solar Energy", "Climate Action", "Renewable Energy"],
  achievements: [
    { name: "Solar Pioneer", description: "Installed first community solar project", icon: "☀️" },
    { name: "Climate Advocate", description: "100+ climate action posts", icon: "🌍" },
    { name: "Community Leader", description: "Led 5+ sustainability initiatives", icon: "👥" },
  ],
}

const mockUserPosts = [
  {
    id: "1",
    user: mockUser,
    content:
      "Just installed 20 solar panels on our community center! 🌞 This will reduce our carbon footprint by 80% and save $3,000 annually. Small steps lead to big changes! #SolarEnergy #CommunityAction",
    media_urls: [
      "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800&h=600&fit=crop",
    ],
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
    user: mockUser,
    content:
      "Excited to announce our new research on solar panel efficiency improvements! Our team has developed a coating that increases energy capture by 23%. Full paper published in Nature Energy 📊",
    media_urls: [
      "https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=400&h=300&fit=crop",
    ],
    location: "Stanford University",
    sustainability_category: "Solar Energy",
    impact_score: 92,
    likes_count: 567,
    comments_count: 89,
    reposts_count: 123,
    created_at: "2024-01-12T14:20:00Z",
    liked_by_user: true,
    bookmarked_by_user: true,
  },
]

export default function ProfilePage() {
  const params = useParams()
  const username = params.username as string
  const session = useSession()
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [posts, setPosts] = useState<any[]>([])
  const [isFollowing, setIsFollowing] = useState(false)
  const [activeTab, setActiveTab] = useState("posts")
  const [showCoverEditModal, setShowCoverEditModal] = useState(false)
  const [selectedCoverImage, setSelectedCoverImage] = useState<string | null>(null)
  const [uploadingCoverImage, setUploadingCoverImage] = useState(false)
  const [loading, setLoading] = useState(true)

  // Check if this is the current user's profile
  const isOwnProfile = session?.user?.user_metadata?.username === username

  // Fetch user profile and posts
  useEffect(() => {
    const fetchUserProfile = async () => {
      setLoading(true)
      try {
        // Fetch user profile
        const profileResponse = await fetch(`/api/profiles?username=${username}`)
        if (!profileResponse.ok) {
          throw new Error('Failed to fetch profile')
        }
        const profileData = await profileResponse.json()
        setUser(profileData.profile)
        
        // Fetch user posts
        const postsResponse = await fetch("/api/posts?limit=100&page=1");
        let postsData = [];
        if (postsResponse.ok) {
          postsData = await postsResponse.json();
        } else {
          const errorObj = await postsResponse.json();
          throw new Error("Error fetching posts: " + (errorObj.error || postsResponse.statusText));
        }
        setPosts((postsData || []).map((post: any) => ({ ...post, user: post.profiles })));
      } catch (error) {
        console.error('Error fetching profile data:', error)
        toast({
          title: 'Error',
          description: 'Failed to load profile data',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }
    
    if (username) {
      fetchUserProfile()
    }
  }, [username, toast])

  const handleFollow = () => {
    setIsFollowing(!isFollowing)
    setUser((prev: any) => ({
      ...prev,
      followers_count: isFollowing ? prev.followers_count - 1 : prev.followers_count + 1,
    }))

    toast({
      title: isFollowing ? "Unfollowed" : "Followed",
      description: isFollowing
        ? `You have unfollowed ${user?.full_name}`
        : `You are now following ${user?.full_name}`,
    })
  }

  const handlePostUpdate = (postId: string, updates: any) => {
    setPosts((prevPosts) => prevPosts.map((post) => (post.id === postId ? { ...post, ...updates } : post)))
  }

  const handleCoverImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Check authentication
    const supabase = createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    
    if (!authUser) {
      toast({
        title: "Authentication required",
        description: "Please log in to upload a cover image.",
        variant: "destructive",
      })
      return
    }

    setUploadingCoverImage(true)

    try {
      const result = await uploadCoverImage(file, authUser.id)
      setSelectedCoverImage(result.url)
      
      toast({
        title: "Cover image uploaded!",
        description: "Your cover image has been uploaded successfully.",
      })
    } catch (error) {
      console.error('Error uploading cover image:', error)
      toast({
        title: "Upload failed",
        description: "Failed to upload cover image. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUploadingCoverImage(false)
      // Reset the file input
      event.target.value = ''
    }
  }

  const handleSaveCoverImage = async () => {
    if (selectedCoverImage) {
      try {
        // Persist cover image URL to backend
        const response = await fetch('/api/profiles', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cover_url: selectedCoverImage })
        })
        if (!response.ok) {
          throw new Error('Failed to update cover photo')
        }
        const data = await response.json()
        setUser((prev: any) => ({
          ...prev,
          cover_url: data.profile.cover_url,
        }))
        setShowCoverEditModal(false)
        setSelectedCoverImage(null)
        toast({
          title: "Cover photo updated!",
          description: "Your new cover photo has been saved successfully.",
        })
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to update cover photo. Please try again.",
          variant: "destructive",
        })
      }
    }
  }

  const handleRemoveCoverImage = async () => {
    try {
      // Simulate API call to remove cover image
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setUser((prev: any) => ({
        ...prev,
        cover_url: "",
      }))

      setShowCoverEditModal(false)
      setSelectedCoverImage(null)

      toast({
        title: "Cover photo removed",
        description: "Your cover photo has been removed successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove cover photo. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto pb-20 lg:pb-4">
        {loading ? (
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-t-green-500 border-gray-200 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading profile...</p>
            </div>
          </div>
        ) : user ? (
          <>
            {/* Cover Image */}
            <div className="relative h-48 md:h-64 bg-gradient-to-r from-green-400 to-emerald-500 group">
              {user.cover_url ? (
                <Image src={user.cover_url || "/placeholder.svg"} alt="Profile cover" fill className="object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-green-400 to-emerald-500" />
              )}
              <div className="absolute inset-0 bg-black/20" />

              {/* Cover Photo Edit Button - Only show for own profile */}
              {isOwnProfile && (
                <Button
                  onClick={() => setShowCoverEditModal(true)}
                  className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  size="sm"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Edit Cover
                </Button>
              )}
            </div>

        {/* Profile Header */}
        <div className="relative px-4 pb-4">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between -mt-16 md:-mt-20">
            <div className="flex flex-col md:flex-row md:items-end space-y-4 md:space-y-0 md:space-x-4">
              <Avatar className="w-32 h-32 border-4 border-white shadow-lg">
                <AvatarImage src={user.avatar_url || "/placeholder.svg"} />
                <AvatarFallback className="bg-green-500 text-white text-2xl">{user.full_name.charAt(0)}</AvatarFallback>
              </Avatar>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{user.full_name}</h1>
                  {user.verified && <CheckCircle className="w-6 h-6 text-blue-500" />}
                </div>
                <p className="text-gray-600 dark:text-gray-400">@{user.username}</p>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1">
                    <Award className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-600">{user.reputation} reputation</span>
                  </div>
                  <Badge
                    variant="secondary"
                    className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  >
                    {user.role}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 mt-4 md:mt-0">
              {!isOwnProfile ? (
                <>
                  <Button variant="outline" size="sm">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Message
                  </Button>
                  <Button
                    onClick={handleFollow}
                    className={isFollowing ? "bg-gray-200 text-gray-800 hover:bg-gray-300" : "sustainability-gradient"}
                  >
                    {isFollowing ? (
                      <>
                        <UserMinus className="w-4 h-4 mr-2" />
                        Unfollow
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Follow
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <Button variant="outline" size="sm" asChild>
                  <a href="/settings">
                    <Settings className="w-4 h-4 mr-2" />
                    Edit Profile
                  </a>
                </Button>
              )}
            </div>
          </div>

          {/* Bio and Info */}
          <div className="mt-6 space-y-4">
            <p className="text-gray-900 dark:text-gray-100 leading-relaxed">{user.bio}</p>

            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              {user.location && (
                <div className="flex items-center space-x-1">
                  <MapPin className="w-4 h-4" />
                  <span>{user.location}</span>
                </div>
              )}
              {user.website && (
                <div className="flex items-center space-x-1">
                  <LinkIcon className="w-4 h-4" />
                  <a
                    href={user.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-600 hover:text-green-500"
                  >
                    {user.website.replace("https://", "")}
                  </a>
                </div>
              )}
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>
                  Joined {new Date(user.joined_date).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </span>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center space-x-6 text-sm">
              <div className="flex items-center space-x-1">
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {(user.following_count || 0).toLocaleString()}
                </span>
                <span className="text-gray-600 dark:text-gray-400">Following</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {(user.followers_count || 0).toLocaleString()}
                </span>
                <span className="text-gray-600 dark:text-gray-400">Followers</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {(user.posts_count || 0).toLocaleString()}
                </span>
                <span className="text-gray-600 dark:text-gray-400">Posts</span>
              </div>
            </div>

            {/* Sustainability Categories */}
            <div className="flex flex-wrap gap-2">
              {user.sustainability_categories?.map((category: string) => (
                <Badge
                  key={category}
                  variant="secondary"
                  className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                >
                  <Leaf className="w-3 h-3 mr-1" />
                  {category}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Achievements */}
        <div className="px-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Achievements</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {user.achievements?.map((achievement: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-center space-x-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20"
                  >
                    <span className="text-2xl">{achievement.icon}</span>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{achievement.name}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{achievement.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Photo Gallery */}
        <div className="px-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Recent Photos</h3>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                {[
                  "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=300&h=300&fit=crop",
                  "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=300&h=300&fit=crop",
                  "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=300&h=300&fit=crop",
                  "https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=300&h=300&fit=crop",
                  "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=300&h=300&fit=crop",
                  "https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?w=300&h=300&fit=crop",
                ].map((src, index) => (
                  <div
                    key={index}
                    className="relative aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden"
                  >
                    <Image
                      src={src || "/placeholder.svg"}
                      alt={`Gallery image ${index + 1}`}
                      fill
                      className="object-cover hover:scale-105 transition-transform cursor-pointer"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Posts Section */}
        <div className="px-4 space-y-6">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} onUpdate={handlePostUpdate} />
          ))}
        </div>

        {/* Cover Photo Edit Modal */}
        <Dialog open={showCoverEditModal} onOpenChange={setShowCoverEditModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Cover Photo</DialogTitle>
              <DialogDescription>
                Upload a new cover photo or remove your current one. Recommended size: 1200x400 pixels.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Current/Preview Cover Image */}
              <div className="relative h-32 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                {selectedCoverImage || user.cover_url ? (
                  <Image
                    src={selectedCoverImage || user.cover_url || "/placeholder.svg"}
                    alt="Cover preview"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-green-400 to-emerald-500 flex items-center justify-center">
                    <span className="text-white font-medium">No cover photo</span>
                  </div>
                )}
                {/* TODO: Add cropping/moving UI here for cover photo editing */}
              </div>

              {/* Upload Button */}
              <div className="flex items-center justify-center">
                <label htmlFor="cover-upload" className={uploadingCoverImage ? "cursor-not-allowed" : "cursor-pointer"}>
                  <Button variant="outline" asChild disabled={uploadingCoverImage}>
                    <span>
                      <Upload className="w-4 h-4 mr-2" />
                      {uploadingCoverImage ? "Uploading..." : "Choose New Photo"}
                    </span>
                  </Button>
                </label>
                <input
                  id="cover-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleCoverImageUpload}
                  className="hidden"
                  disabled={uploadingCoverImage}
                />
              </div>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              {user.cover_url && (
                <Button variant="outline" onClick={handleRemoveCoverImage} className="text-red-600 hover:text-red-700">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remove Cover
                </Button>
              )}
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowCoverEditModal(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveCoverImage}
                  disabled={!selectedCoverImage || uploadingCoverImage}
                  className="sustainability-gradient"
                >
                  {uploadingCoverImage ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
          </>
        ) : (
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-400">Profile not found</p>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
