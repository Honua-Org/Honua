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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Settings, MessageSquare, Pin, Trash2, UserPlus, Edit, Upload, Plus, X } from "lucide-react"
import Link from "next/link"

// Mock data - in real app this would come from API
const mockForum = {
  id: "1",
  name: "Solar Energy Discussion",
  description: "Share experiences, tips, and questions about solar energy installations and technology",
  category: "Solar Energy",
  member_count: 1247,
  thread_count: 89,
  latest_activity: "2024-01-15T10:30:00Z",
  moderators: ["sarah_green", "solar_expert"],
  is_private: false,
  creator: "sarah_green",
  cover_image: "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&h=200&fit=crop",
  rules: [
    "Keep discussions related to solar energy",
    "Be respectful to all community members",
    "No spam or promotional content",
    "Share reliable sources when posting facts",
  ],
}

const mockThreads = [
  {
    id: "1",
    title: "Best practices for community solar installations",
    author: {
      username: "sarah_green",
      full_name: "Sarah Green",
      avatar_url: "/images/profiles/sarah-green-avatar.png",
    },
    replies_count: 23,
    views_count: 456,
    created_at: "2024-01-15T10:30:00Z",
    is_pinned: true,
    is_locked: false,
  },
  {
    id: "2",
    title: "Solar panel efficiency in winter months",
    author: {
      username: "solar_newbie",
      full_name: "Mike Chen",
      avatar_url: "/placeholder.svg?height=40&width=40",
    },
    replies_count: 15,
    views_count: 289,
    created_at: "2024-01-14T16:45:00Z",
    is_pinned: false,
    is_locked: false,
  },
]

const mockModerators = [
  {
    username: "sarah_green",
    full_name: "Sarah Green",
    avatar_url: "/images/profiles/sarah-green-avatar.png",
    role: "Creator",
    joined_at: "2024-01-01T00:00:00Z",
  },
  {
    username: "solar_expert",
    full_name: "David Martinez",
    avatar_url: "/placeholder.svg?height=40&width=40",
    role: "Moderator",
    joined_at: "2024-01-05T00:00:00Z",
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

export default function ForumManagePage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const forumId = params.id as string

  const [forum, setForum] = useState(mockForum)
  const [threads, setThreads] = useState(mockThreads)
  const [moderators, setModerators] = useState(mockModerators)
  const [activeTab, setActiveTab] = useState("settings")
  const [isEditingForum, setIsEditingForum] = useState(false)
  const [editedForum, setEditedForum] = useState({
    name: forum.name,
    description: forum.description,
  })
  const [newRule, setNewRule] = useState("")
  const [newModeratorUsername, setNewModeratorUsername] = useState("")
  const [announcement, setAnnouncement] = useState("")

  // Mock current user check
  const currentUser = "sarah_green"
  const isCreator = forum.creator === currentUser

  if (!isCreator) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto p-4 text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Access Denied</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">You don't have permission to manage this forum.</p>
          <Button asChild>
            <Link href={`/forum/${forumId}`}>Back to Forum</Link>
          </Button>
        </div>
      </MainLayout>
    )
  }

  const handleSaveForumSettings = () => {
    setForum((prev) => ({
      ...prev,
      name: editedForum.name,
      description: editedForum.description,
    }))
    setIsEditingForum(false)
    toast({
      title: "Forum updated!",
      description: "Forum settings have been saved successfully",
    })
  }

  const handleAddRule = () => {
    if (newRule.trim()) {
      setForum((prev) => ({
        ...prev,
        rules: [...prev.rules, newRule.trim()],
      }))
      setNewRule("")
      toast({
        title: "Rule added!",
        description: "New forum rule has been added",
      })
    }
  }

  const handleRemoveRule = (index: number) => {
    setForum((prev) => ({
      ...prev,
      rules: prev.rules.filter((_, i) => i !== index),
    }))
    toast({
      title: "Rule removed!",
      description: "Forum rule has been removed",
    })
  }

  const handlePinThread = (threadId: string) => {
    setThreads((prev) =>
      prev.map((thread) => (thread.id === threadId ? { ...thread, is_pinned: !thread.is_pinned } : thread)),
    )
    toast({
      title: "Thread updated!",
      description: "Thread pin status has been changed",
    })
  }

  const handleDeleteThread = (threadId: string) => {
    setThreads((prev) => prev.filter((thread) => thread.id !== threadId))
    toast({
      title: "Thread deleted!",
      description: "Thread has been removed from the forum",
    })
  }

  const handleAddModerator = () => {
    if (newModeratorUsername.trim()) {
      const newModerator = {
        username: newModeratorUsername.trim(),
        full_name: newModeratorUsername.trim(), // In real app, fetch from user data
        avatar_url: "/placeholder.svg?height=40&width=40",
        role: "Moderator",
        joined_at: new Date().toISOString(),
      }
      setModerators((prev) => [...prev, newModerator])
      setNewModeratorUsername("")
      toast({
        title: "Moderator added!",
        description: `${newModeratorUsername} has been added as a moderator`,
      })
    }
  }

  const handleRemoveModerator = (username: string) => {
    if (username !== currentUser) {
      setModerators((prev) => prev.filter((mod) => mod.username !== username))
      toast({
        title: "Moderator removed!",
        description: `${username} has been removed as a moderator`,
      })
    }
  }

  const handlePostAnnouncement = () => {
    if (announcement.trim()) {
      // In real app, this would create a pinned announcement thread
      toast({
        title: "Announcement posted!",
        description: "Your announcement has been posted to the forum",
      })
      setAnnouncement("")
    }
  }

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto p-4 pb-20 lg:pb-4">
        {/* Back Navigation */}
        <div className="mb-6">
          <Button variant="ghost" asChild className="mb-4">
            <Link href={`/forum/${forumId}`}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Forum
            </Link>
          </Button>
        </div>

        {/* Header */}
        <div className="flex items-center space-x-3 mb-8">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
            <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Manage Forum</h1>
            <p className="text-gray-600 dark:text-gray-400">{forum.name}</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="threads">Threads</TabsTrigger>
            <TabsTrigger value="moderators">Moderators</TabsTrigger>
            <TabsTrigger value="announcements">Announcements</TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Forum Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditingForum ? (
                  <>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Forum Name</label>
                      <Input
                        value={editedForum.name}
                        onChange={(e) => setEditedForum((prev) => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Description</label>
                      <Textarea
                        value={editedForum.description}
                        onChange={(e) => setEditedForum((prev) => ({ ...prev, description: e.target.value }))}
                        rows={3}
                      />
                    </div>
                    <div className="flex space-x-2">
                      <Button onClick={handleSaveForumSettings}>Save Changes</Button>
                      <Button variant="outline" onClick={() => setIsEditingForum(false)}>
                        Cancel
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Forum Name</label>
                      <p className="text-gray-900 dark:text-gray-100">{forum.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Description</label>
                      <p className="text-gray-900 dark:text-gray-100">{forum.description}</p>
                    </div>
                    <Button onClick={() => setIsEditingForum(true)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Forum Info
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cover Image</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative h-32 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                  <img
                    src={forum.cover_image || "/placeholder.svg"}
                    alt="Forum cover"
                    className="w-full h-full object-cover"
                  />
                </div>
                <Button variant="outline">
                  <Upload className="w-4 h-4 mr-2" />
                  Change Cover Image
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Forum Rules</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {forum.rules.map((rule, index) => (
                    <div
                      key={index}
                      className="flex items-start justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div className="flex items-start space-x-2">
                        <span className="text-green-600 font-bold text-sm">{index + 1}.</span>
                        <p className="text-sm text-gray-900 dark:text-gray-100">{rule}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveRule(index)}
                        className="text-red-500 hover:text-red-600"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="flex space-x-2">
                  <Input placeholder="Add a new rule..." value={newRule} onChange={(e) => setNewRule(e.target.value)} />
                  <Button onClick={handleAddRule}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Rule
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="threads" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Thread Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {threads.map((thread) => (
                    <div key={thread.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-start space-x-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={thread.author.avatar_url || "/placeholder.svg"} />
                          <AvatarFallback>{thread.author.full_name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center space-x-2">
                            {thread.is_pinned && <Pin className="w-4 h-4 text-green-600" />}
                            <Link
                              href={`/forum/thread/${thread.id}`}
                              className="font-medium text-gray-900 dark:text-gray-100 hover:text-green-600"
                            >
                              {thread.title}
                            </Link>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                            <span>by {thread.author.full_name}</span>
                            <span>•</span>
                            <span>{thread.replies_count} replies</span>
                            <span>•</span>
                            <span>{formatTimeAgo(thread.created_at)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePinThread(thread.id)}
                          className={thread.is_pinned ? "text-green-600" : ""}
                        >
                          <Pin className="w-4 h-4" />
                          {thread.is_pinned ? "Unpin" : "Pin"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteThread(thread.id)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="moderators" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Forum Moderators</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {moderators.map((moderator) => (
                    <div key={moderator.username} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={moderator.avatar_url || "/placeholder.svg"} />
                          <AvatarFallback>{moderator.full_name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center space-x-2">
                            <p className="font-medium text-gray-900 dark:text-gray-100">{moderator.full_name}</p>
                            <Badge variant={moderator.role === "Creator" ? "default" : "secondary"}>
                              {moderator.role}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">@{moderator.username}</p>
                        </div>
                      </div>
                      {moderator.username !== currentUser && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveModerator(moderator.username)}
                          className="text-red-500 hover:text-red-600"
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex space-x-2 pt-4 border-t">
                  <Input
                    placeholder="Enter username to add as moderator..."
                    value={newModeratorUsername}
                    onChange={(e) => setNewModeratorUsername(e.target.value)}
                  />
                  <Button onClick={handleAddModerator}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Moderator
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="announcements" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Post Announcement</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Write an important announcement for your forum members..."
                  value={announcement}
                  onChange={(e) => setAnnouncement(e.target.value)}
                  rows={4}
                />
                <Button onClick={handlePostAnnouncement} disabled={!announcement.trim()}>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Post Announcement
                </Button>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Announcements will be pinned at the top of your forum and all members will be notified.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  )
}
