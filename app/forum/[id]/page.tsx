"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import MainLayout from "@/components/main-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Users,
  MessageSquare,
  Plus,
  Search,
  ArrowLeft,
  Pin,
  Lock,
  Clock,
  ThumbsUp,
  MoreHorizontal,
  Flag,
  Share2,
} from "lucide-react"
import Link from "next/link"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

// Mock forum data
const mockForums = {
  "1": {
    id: "1",
    name: "Solar Energy Discussion",
    description: "Share experiences, tips, and questions about solar energy installations and technology",
    category: "Solar Energy",
    member_count: 1247,
    thread_count: 89,
    latest_activity: "2024-01-15T10:30:00Z",
    moderators: ["sarah_green", "solar_expert"],
    is_private: false,
    cover_image: "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&h=200&fit=crop",
    rules: [
      "Keep discussions related to solar energy",
      "Be respectful to all community members",
      "No spam or promotional content",
      "Share reliable sources when posting facts",
    ],
  },
  "2": {
    id: "2",
    name: "Zero Waste Living",
    description: "Community for those pursuing zero waste lifestyles and sustainable living practices",
    category: "Waste Reduction",
    member_count: 892,
    thread_count: 156,
    latest_activity: "2024-01-15T09:15:00Z",
    moderators: ["eco_marcus"],
    is_private: false,
    cover_image: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&h=200&fit=crop",
    rules: [
      "Focus on zero waste and sustainable practices",
      "Share practical tips and experiences",
      "No judgmental attitudes toward beginners",
      "Provide sources for product recommendations",
    ],
  },
  "3": {
    id: "3",
    name: "Climate Action Planning",
    description: "Organize and plan climate action initiatives in your local community",
    category: "Climate Action",
    member_count: 2134,
    thread_count: 234,
    latest_activity: "2024-01-15T08:45:00Z",
    moderators: ["climate_action_now"],
    is_private: false,
    cover_image: "https://images.unsplash.com/photo-1569163139394-de4e4f43e4e3?w=800&h=200&fit=crop",
    rules: [
      "Focus on actionable climate solutions",
      "Respect diverse perspectives and approaches",
      "Share credible scientific information",
      "Encourage local community involvement",
    ],
  },
  "4": {
    id: "4",
    name: "Green Tech Innovations",
    description: "Discuss latest developments in green technology and sustainable innovations",
    category: "Technology",
    member_count: 567,
    thread_count: 78,
    latest_activity: "2024-01-14T16:20:00Z",
    moderators: ["green_tech_co"],
    is_private: true,
    cover_image: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=200&fit=crop",
    rules: [
      "Share verified green technology news",
      "Discuss technical aspects respectfully",
      "No unsubstantiated claims",
      "Credit original sources and research",
    ],
  },
}

// Mock threads data
const mockThreads = [
  {
    id: "1",
    title: "Best practices for community solar installations",
    content:
      "I'm looking into setting up a community solar project in my neighborhood. Has anyone here gone through this process? What are the key things to consider?",
    author: {
      username: "sarah_green",
      full_name: "Sarah Green",
      avatar_url: "/images/profiles/sarah-green-avatar.png",
      reputation: 850,
    },
    forum_id: "1",
    replies_count: 23,
    views_count: 456,
    likes_count: 34,
    created_at: "2024-01-15T10:30:00Z",
    last_activity: "2024-01-15T14:20:00Z",
    is_pinned: true,
    is_locked: false,
    tags: ["community-solar", "installation", "planning"],
  },
  {
    id: "2",
    title: "Solar panel efficiency in winter months",
    content:
      "I've noticed my solar panels aren't producing as much energy during winter. Is this normal? What can I do to optimize performance?",
    author: {
      username: "solar_newbie",
      full_name: "Mike Chen",
      avatar_url: "/placeholder.svg?height=40&width=40",
      reputation: 120,
    },
    forum_id: "1",
    replies_count: 15,
    views_count: 289,
    likes_count: 18,
    created_at: "2024-01-14T16:45:00Z",
    last_activity: "2024-01-15T12:30:00Z",
    is_pinned: false,
    is_locked: false,
    tags: ["efficiency", "winter", "maintenance"],
  },
  {
    id: "3",
    title: "Comparing different solar inverter types",
    content:
      "I'm trying to decide between string inverters, power optimizers, and microinverters for my home installation. What are the pros and cons of each?",
    author: {
      username: "tech_enthusiast",
      full_name: "Lisa Rodriguez",
      avatar_url: "/placeholder.svg?height=40&width=40",
      reputation: 445,
    },
    forum_id: "1",
    replies_count: 31,
    views_count: 567,
    likes_count: 42,
    created_at: "2024-01-13T09:20:00Z",
    last_activity: "2024-01-15T11:15:00Z",
    is_pinned: false,
    is_locked: false,
    tags: ["inverters", "technology", "comparison"],
  },
]

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

  if (diffInHours < 1) return "Just now"
  if (diffInHours < 24) return `${diffInHours}h ago`
  if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`
  return date.toLocaleDateString()
}

export default function ForumDetailPage() {
  const params = useParams()
  const router = useRouter()
  const forumId = params.id as string
  const forum = mockForums[forumId as keyof typeof mockForums]

  const [searchQuery, setSearchQuery] = useState("")
  const [newThreadTitle, setNewThreadTitle] = useState("")
  const [newThreadContent, setNewThreadContent] = useState("")
  const [activeTab, setActiveTab] = useState("threads")
  const [isCreatingThread, setIsCreatingThread] = useState(false)

  if (!forum) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto p-4 text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Forum Not Found</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">The forum you're looking for doesn't exist.</p>
          <Button asChild>
            <Link href="/forum">Back to Forums</Link>
          </Button>
        </div>
      </MainLayout>
    )
  }

  const forumThreads = mockThreads.filter((thread) => thread.forum_id === forumId)

  const handleCreateThread = () => {
    if (newThreadTitle.trim() && newThreadContent.trim()) {
      // In a real app, this would create a new thread
      console.log("Creating thread:", { title: newThreadTitle, content: newThreadContent })
      setNewThreadTitle("")
      setNewThreadContent("")
      setIsCreatingThread(false)
    }
  }

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto p-4 pb-20 lg:pb-4">
        {/* Back Navigation */}
        <div className="mb-6">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/forum">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Forums
            </Link>
          </Button>
        </div>

        {/* Forum Header */}
        <div className="relative mb-8">
          <div
            className="h-48 bg-gradient-to-r from-green-400 to-blue-500 rounded-lg bg-cover bg-center"
            style={{ backgroundImage: `url(${forum.cover_image})` }}
          >
            <div className="absolute inset-0 bg-black bg-opacity-40 rounded-lg"></div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <h1 className="text-3xl font-bold">{forum.name}</h1>
                  {forum.is_private && <Lock className="w-5 h-5" />}
                </div>
                <p className="text-lg opacity-90 mb-2">{forum.description}</p>
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4" />
                    <span>{forum.member_count.toLocaleString()} members</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MessageSquare className="w-4 h-4" />
                    <span>{forum.thread_count} threads</span>
                  </div>
                  <Badge variant="secondary" className="bg-white/20 text-white">
                    {forum.category}
                  </Badge>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button className="bg-green-600 hover:bg-green-700" onClick={() => setIsCreatingThread(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Thread
                </Button>
                <Button variant="secondary" className="bg-white/20 hover:bg-white/30 text-white">
                  Join Forum
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            {/* Search and Filters */}
            <div className="mb-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search threads..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            {/* Create Thread Form */}
            {isCreatingThread && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Create New Thread</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    placeholder="Thread title..."
                    value={newThreadTitle}
                    onChange={(e) => setNewThreadTitle(e.target.value)}
                  />
                  <Textarea
                    placeholder="What would you like to discuss?"
                    value={newThreadContent}
                    onChange={(e) => setNewThreadContent(e.target.value)}
                    rows={4}
                  />
                  <div className="flex space-x-2">
                    <Button onClick={handleCreateThread}>Create Thread</Button>
                    <Button variant="outline" onClick={() => setIsCreatingThread(false)}>
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Threads List */}
            <div className="space-y-4">
              {forumThreads.map((thread) => (
                <Card key={thread.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={thread.author.avatar_url || "/placeholder.svg"} />
                        <AvatarFallback>{thread.author.full_name.charAt(0)}</AvatarFallback>
                      </Avatar>

                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          {thread.is_pinned && <Pin className="w-4 h-4 text-green-600" />}
                          <Link
                            href={`/forum/thread/${thread.id}`}
                            className="text-lg font-semibold text-gray-900 dark:text-gray-100 hover:text-green-600"
                          >
                            {thread.title}
                          </Link>
                          {thread.is_locked && <Lock className="w-4 h-4 text-gray-500" />}
                        </div>

                        <p className="text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{thread.content}</p>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex items-center space-x-1">
                              <span>by</span>
                              <Link
                                href={`/profile/${thread.author.username}`}
                                className="font-medium hover:text-green-600"
                              >
                                {thread.author.full_name}
                              </Link>
                              <Badge variant="outline" className="text-xs">
                                {thread.author.reputation}
                              </Badge>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="w-4 h-4" />
                              <span>{formatTimeAgo(thread.created_at)}</span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                              <div className="flex items-center space-x-1">
                                <ThumbsUp className="w-4 h-4" />
                                <span>{thread.likes_count}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <MessageSquare className="w-4 h-4" />
                                <span>{thread.replies_count}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <span>{thread.views_count} views</span>
                              </div>
                            </div>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Share2 className="w-4 h-4 mr-2" />
                                  Share
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Flag className="w-4 h-4 mr-2" />
                                  Report
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>

                        {/* Tags */}
                        {thread.tags && thread.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {thread.tags.map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                #{tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Forum Rules</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {forum.rules.map((rule, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <span className="text-green-600 font-bold text-sm">{index + 1}.</span>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{rule}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Moderators</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {forum.moderators.map((moderator) => (
                  <div key={moderator} className="flex items-center space-x-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src="/placeholder.svg" />
                      <AvatarFallback>{moderator.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">@{moderator}</p>
                      <p className="text-xs text-gray-500">Moderator</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Forum Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total Threads</span>
                  <span className="font-medium">{forum.thread_count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total Members</span>
                  <span className="font-medium">{forum.member_count.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Last Activity</span>
                  <span className="font-medium">{formatTimeAgo(forum.latest_activity)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
