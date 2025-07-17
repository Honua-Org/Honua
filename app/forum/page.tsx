"use client"

import { useState } from "react"
import MainLayout from "@/components/main-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Users, MessageSquare, Plus, Search, TrendingUp, Clock, Pin, Lock, Settings } from "lucide-react"
import Link from "next/link"

const mockForums = [
  {
    id: "1",
    name: "Solar Energy Discussion",
    description: "Share experiences, tips, and questions about solar energy installations",
    category: "Solar Energy",
    member_count: 1247,
    thread_count: 89,
    latest_activity: "2024-01-15T10:30:00Z",
    moderators: ["sarah_green", "solar_expert"],
    is_private: false,
    creator: "sarah_green", // Added creator field
  },
  {
    id: "2",
    name: "Zero Waste Living",
    description: "Community for those pursuing zero waste lifestyles",
    category: "Waste Reduction",
    member_count: 892,
    thread_count: 156,
    latest_activity: "2024-01-15T09:15:00Z",
    moderators: ["eco_marcus"],
    is_private: false,
    creator: "eco_marcus",
  },
  {
    id: "3",
    name: "Climate Action Planning",
    description: "Organize and plan climate action initiatives",
    category: "Climate Action",
    member_count: 2134,
    thread_count: 234,
    latest_activity: "2024-01-15T08:45:00Z",
    moderators: ["climate_action_now"],
    is_private: false,
    creator: "climate_action_now",
  },
  {
    id: "4",
    name: "Green Tech Innovations",
    description: "Discuss latest developments in green technology",
    category: "Technology",
    member_count: 567,
    thread_count: 78,
    latest_activity: "2024-01-14T16:20:00Z",
    moderators: ["green_tech_co"],
    is_private: true,
    creator: "green_tech_co",
  },
]

const mockThreads = [
  {
    id: "1",
    title: "Best practices for community solar installations",
    author: {
      username: "sarah_green",
      full_name: "Sarah Green",
      avatar_url: "/images/profiles/sarah-green-avatar.png",
    },
    forum_name: "Solar Energy Discussion",
    replies_count: 23,
    views_count: 456,
    created_at: "2024-01-15T10:30:00Z",
    last_activity: "2024-01-15T14:20:00Z",
    is_pinned: true,
    is_locked: false,
  },
  {
    id: "2",
    title: "Zero waste meal prep ideas for busy families",
    author: {
      username: "eco_marcus",
      full_name: "Marcus Johnson",
      avatar_url: "/placeholder.svg?height=32&width=32",
    },
    forum_name: "Zero Waste Living",
    replies_count: 45,
    views_count: 789,
    created_at: "2024-01-15T09:15:00Z",
    last_activity: "2024-01-15T13:45:00Z",
    is_pinned: false,
    is_locked: false,
  },
  {
    id: "3",
    title: "Organizing a local climate strike - need advice",
    author: {
      username: "young_activist",
      full_name: "Alex Chen",
      avatar_url: "/placeholder.svg?height=32&width=32",
    },
    forum_name: "Climate Action Planning",
    replies_count: 67,
    views_count: 1234,
    created_at: "2024-01-14T16:45:00Z",
    last_activity: "2024-01-15T12:30:00Z",
    is_pinned: false,
    is_locked: false,
  },
]

const forumCategories = ["All", "Solar Energy", "Waste Reduction", "Climate Action", "Technology", "Agriculture"]

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

  if (diffInHours < 1) return "Just now"
  if (diffInHours < 24) return `${diffInHours}h ago`
  if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`
  return date.toLocaleDateString()
}

export default function ForumPage() {
  const [forums, setForums] = useState(mockForums)
  const [threads, setThreads] = useState(mockThreads)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [activeTab, setActiveTab] = useState("forums")
  const [isCreateForumOpen, setIsCreateForumOpen] = useState(false)
  const [newForumData, setNewForumData] = useState({
    name: "",
    description: "",
    category: "",
    is_private: false,
  })
  const { toast } = useToast()

  // Mock current user (in real app, this would come from auth)
  const currentUser = "sarah_green"

  const filteredForums = forums.filter((forum) => {
    const matchesSearch =
      forum.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      forum.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "All" || forum.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const filteredThreads = threads.filter(
    (thread) =>
      thread.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      thread.author.full_name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleCreateForum = () => {
    if (newForumData.name.trim() && newForumData.description.trim() && newForumData.category) {
      const newForum = {
        id: Date.now().toString(),
        name: newForumData.name,
        description: newForumData.description,
        category: newForumData.category,
        member_count: 1,
        thread_count: 0,
        latest_activity: new Date().toISOString(),
        moderators: [currentUser],
        is_private: newForumData.is_private,
        creator: currentUser,
      }

      setForums((prev) => [newForum, ...prev])
      setNewForumData({ name: "", description: "", category: "", is_private: false })
      setIsCreateForumOpen(false)

      toast({
        title: "Forum created!",
        description: `${newForumData.name} has been created successfully`,
      })
    }
  }

  const isForumCreator = (forum: any) => forum.creator === currentUser

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto p-4 pb-20 lg:pb-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Community Forum</h1>
              <p className="text-gray-600 dark:text-gray-400">Connect and discuss sustainability topics</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Dialog open={isCreateForumOpen} onOpenChange={setIsCreateForumOpen}>
              <DialogTrigger asChild>
                <Button className="sustainability-gradient">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Forum
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Create New Forum</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Forum Name</label>
                    <Input
                      placeholder="Enter forum name..."
                      value={newForumData.name}
                      onChange={(e) => setNewForumData((prev) => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Description</label>
                    <Textarea
                      placeholder="Describe what this forum is about..."
                      value={newForumData.description}
                      onChange={(e) => setNewForumData((prev) => ({ ...prev, description: e.target.value }))}
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Category</label>
                    <Select
                      value={newForumData.category}
                      onValueChange={(value) => setNewForumData((prev) => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {forumCategories
                          .filter((cat) => cat !== "All")
                          .map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="private"
                      checked={newForumData.is_private}
                      onChange={(e) => setNewForumData((prev) => ({ ...prev, is_private: e.target.checked }))}
                      className="rounded"
                    />
                    <label htmlFor="private" className="text-sm">
                      Make this forum private
                    </label>
                  </div>
                  <div className="flex space-x-2 pt-4">
                    <Button onClick={handleCreateForum} className="flex-1">
                      Create Forum
                    </Button>
                    <Button variant="outline" onClick={() => setIsCreateForumOpen(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <div className="mb-6">
              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search forums and threads..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="forums">Forums</TabsTrigger>
                <TabsTrigger value="threads">Recent Threads</TabsTrigger>
              </TabsList>

              <TabsContent value="forums" className="space-y-4">
                {filteredForums.map((forum) => (
                  <Card key={forum.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Link
                              href={`/forum/${forum.id}`}
                              className="text-lg font-semibold text-gray-900 dark:text-gray-100 hover:text-green-600"
                            >
                              {forum.name}
                            </Link>
                            {forum.is_private && <Lock className="w-4 h-4 text-gray-500" />}
                            {isForumCreator(forum) && (
                              <Badge variant="secondary" className="text-xs">
                                Creator
                              </Badge>
                            )}
                          </div>
                          <p className="text-gray-600 dark:text-gray-400 mb-3">{forum.description}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex items-center space-x-1">
                              <Users className="w-4 h-4" />
                              <span>{forum.member_count.toLocaleString()} members</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <MessageSquare className="w-4 h-4" />
                              <span>{forum.thread_count} threads</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="w-4 h-4" />
                              <span>Active {formatTimeAgo(forum.latest_activity)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary">{forum.category}</Badge>
                          {isForumCreator(forum) && (
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/forum/${forum.id}/manage`}>
                                <Settings className="w-4 h-4" />
                              </Link>
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="threads" className="space-y-4">
                {filteredThreads.map((thread) => (
                  <Card key={thread.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={thread.author.avatar_url || "/placeholder.svg"} />
                          <AvatarFallback>{thread.author.full_name.charAt(0)}</AvatarFallback>
                        </Avatar>

                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            {thread.is_pinned && <Pin className="w-4 h-4 text-green-600" />}
                            <Link
                              href={`/forum/thread/${thread.id}`}
                              className="text-lg font-semibold text-gray-900 dark:text-gray-100 hover:text-green-600"
                            >
                              {thread.title}
                            </Link>
                            {thread.is_locked && <Lock className="w-4 h-4 text-gray-500" />}
                          </div>

                          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                            <span>by</span>
                            <Link
                              href={`/profile/${thread.author.username}`}
                              className="font-medium hover:text-green-600"
                            >
                              {thread.author.full_name}
                            </Link>
                            <span>in</span>
                            <Badge variant="outline" className="text-xs">
                              {thread.forum_name}
                            </Badge>
                          </div>

                          <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex items-center space-x-1">
                              <MessageSquare className="w-4 h-4" />
                              <span>{thread.replies_count} replies</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <span>{thread.views_count} views</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="w-4 h-4" />
                              <span>Last activity {formatTimeAgo(thread.last_activity)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Categories</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {forumCategories.map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </Button>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5" />
                  <span>Popular Topics</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <p className="text-sm font-medium">#SolarInstallation</p>
                  <p className="text-sm font-medium">#ZeroWasteChallenge</p>
                  <p className="text-sm font-medium">#ClimateAction</p>
                  <p className="text-sm font-medium">#GreenTech</p>
                  <p className="text-sm font-medium">#SustainableLiving</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Forum Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total Forums</span>
                  <span className="font-medium">{forums.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total Threads</span>
                  <span className="font-medium">{threads.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Active Members</span>
                  <span className="font-medium">5,840</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
