"use client"

import { useState, useEffect } from "react"
import type { Session } from "@supabase/auth-helpers-nextjs"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import MainLayout from "@/components/main-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import {
  CheckSquare,
  Calendar,
  Award,
  TrendingUp,
  Users,
  Target,
  Leaf,
  Upload,
  Twitter,
  Share2,
  Copy,
  UserPlus,
  Crown,
  Star,
  ExternalLink,
  Gift,
  Zap,
  Heart,
  MessageCircle,
  Recycle,
  Droplets,
  Car,
  Home,
  ShoppingBag,
  Clock,
} from "lucide-react"
import { toast } from "sonner"

interface Task {
  id: string
  title: string
  description: string
  category: string
  points: number
  deadline?: string
  difficulty: string
  participants?: number
  completed_by_user: boolean
  progress: number
  icon: any
  action_text: string
  verification_required: boolean
  action_url?: string
  task_type?: string
  verification_method?: string
  social_platform?: string
  blockchain_network?: string
  contract_address?: string
  requirements?: any
  is_active?: boolean
  completion_status?: string | null
  impact_score?: number
  estimated_time?: string
}

// Task categories with icons
const taskCategories = [
  { id: 'all', name: 'All Tasks', icon: Target, color: 'bg-blue-500' },
  { id: 'social', name: 'Social', icon: Users, color: 'bg-indigo-500' },
  { id: 'blockchain', name: 'Blockchain', icon: Star, color: 'bg-purple-600' },
  { id: 'energy', name: 'Energy', icon: Zap, color: 'bg-yellow-500' },
  { id: 'waste', name: 'Waste', icon: Recycle, color: 'bg-green-500' },
  { id: 'water', name: 'Water', icon: Droplets, color: 'bg-blue-400' },
  { id: 'transport', name: 'Transport', icon: Car, color: 'bg-purple-500' },
  { id: 'home', name: 'Home', icon: Home, color: 'bg-orange-500' },
  { id: 'shopping', name: 'Shopping', icon: ShoppingBag, color: 'bg-pink-500' },
]

// Utility functions
const getCategoryIcon = (category: string) => {
  const categoryData = taskCategories.find(cat => cat.id === category.toLowerCase())
  return categoryData ? categoryData.icon : Leaf
}

const getCategoryColor = (category: string) => {
  const categoryData = taskCategories.find(cat => cat.id === category.toLowerCase())
  return categoryData ? categoryData.color : 'bg-gray-500'
}

const getSocialActionText = (taskType: string, socialPlatform: string | null, requirements: any) => {
  if (taskType !== 'social_media' || !socialPlatform) {
    return 'Start Task'
  }

  const action = requirements?.action || 'visit'
  const platformName = socialPlatform.charAt(0).toUpperCase() + socialPlatform.slice(1)
  
  switch (action) {
    case 'follow':
      return `Follow on ${platformName}`
    case 'like':
      return `Like on ${platformName}`
    case 'share':
      return `Share on ${platformName}`
    case 'visit':
      return `Visit ${platformName}`
    default:
      return `Open ${platformName}`
  }
}

const inviteLeaderboard = [
  {
    rank: 1,
    user: {
      username: "invite_master",
      full_name: "Alex Chen",
      avatar_url: "/placeholder.svg?height=32&width=32",
    },
    invites: 47,
    points_earned: 470,
  },
  {
    rank: 2,
    user: {
      username: "sarah_green",
      full_name: "Sarah Green",
      avatar_url: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=32&h=32&fit=crop&crop=face",
    },
    invites: 32,
    points_earned: 320,
  },
  {
    rank: 3,
    user: {
      username: "eco_warrior",
      full_name: "Marcus Johnson",
      avatar_url: "/placeholder.svg?height=32&width=32",
    },
    invites: 28,
    points_earned: 280,
  },
  {
    rank: 4,
    user: {
      username: "green_tech",
      full_name: "Emma Wilson",
      avatar_url: "/placeholder.svg?height=32&width=32",
    },
    invites: 19,
    points_earned: 190,
  },
  {
    rank: 5,
    user: {
      username: "planet_saver",
      full_name: "David Kim",
      avatar_url: "/placeholder.svg?height=32&width=32",
    },
    invites: 15,
    points_earned: 150,
  },
]

const pointsLeaderboard = [
  {
    rank: 1,
    user: {
      username: "sarah_green",
      full_name: "Sarah Green",
      avatar_url: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=32&h=32&fit=crop&crop=face",
    },
    points: 1250,
    tasks_completed: 28,
  },
  {
    rank: 2,
    user: {
      username: "eco_marcus",
      full_name: "Marcus Johnson",
      avatar_url: "/placeholder.svg?height=32&width=32",
    },
    points: 980,
    tasks_completed: 22,
  },
  {
    rank: 3,
    user: {
      username: "green_tech_co",
      full_name: "GreenTech Solutions",
      avatar_url: "/placeholder.svg?height=32&width=32",
    },
    points: 875,
    tasks_completed: 19,
  },
  {
    rank: 4,
    user: {
      username: "planet_hero",
      full_name: "Lisa Park",
      avatar_url: "/placeholder.svg?height=32&width=32",
    },
    points: 720,
    tasks_completed: 16,
  },
  {
    rank: 5,
    user: {
      username: "eco_innovator",
      full_name: "James Rodriguez",
      avatar_url: "/placeholder.svg?height=32&width=32",
    },
    points: 650,
    tasks_completed: 14,
  },
]



const getDifficultyColor = (difficulty: string) => {
  switch (difficulty.toLowerCase()) {
    case "easy":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
    case "medium":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
    case "hard":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
  }
}

const getCategoryBadgeColor = (category: string) => {
  switch (category.toLowerCase()) {
    case "social":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
    case "blockchain":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
    case "energy":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
    case "waste":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
    case "water":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
    case "transport":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
    case "home":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
    case "shopping":
      return "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200"
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
  }
}

const formatDeadline = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  if (diffInDays < 0) return "Expired"
  if (diffInDays === 0) return "Due today"
  if (diffInDays === 1) return "Due tomorrow"
  return `${diffInDays} days left`
}

export default function TasksPage() {
  const [allTasks, setAllTasks] = useState<Task[]>([])
  const [selectedCategory, setSelectedCategory] = useState("All Tasks")
  const [activeTab, setActiveTab] = useState("available")
  const [leaderboardTab, setLeaderboardTab] = useState("points")
  const [inviteLink, setInviteLink] = useState("https://beta.honua.green/invite/loading...")
  const [profile, setProfile] = useState<any>(null)
  const [isCopied, setIsCopied] = useState(false)
  const [userStats, setUserStats] = useState({
    points: 0,
    rank: 0,
    tasks_completed: 0,
    invites_sent: 0
  })
  const [leaderboards, setLeaderboards] = useState({
    points: [],
    invites: []
  })
  const [isLoadingStats, setIsLoadingStats] = useState(true)
  const [isLoadingTasks, setIsLoadingTasks] = useState(true)
  const [session, setSession] = useState<Session | null>(null)
  
  const supabase = createClientComponentClient()

  // Get session
  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
    }
    getSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  // Fetch tasks from API
  const fetchTasks = async () => {
    if (!session?.user?.id) return
    
    try {
      setIsLoadingTasks(true)
      const response = await fetch(`/api/tasks?userId=${session.user.id}`)
      
      if (response.ok) {
        const data = await response.json()
        // Transform API data to match our Task interface
        const transformedTasks = data.tasks.map((task: any) => ({
          id: task.id.toString(),
          title: task.title,
          description: task.description,
          category: task.category,
          points: task.points,
          difficulty: task.difficulty,
          completed_by_user: task.completion_status === 'verified',
          progress: task.completion_status === 'verified' ? 100 : task.completion_status === 'pending' ? 50 : 0,
          icon: getCategoryIcon(task.category),
          action_text: getSocialActionText(task.task_type, task.social_platform, task.requirements),
          verification_required: task.verification_required,
          action_url: task.external_url,
          task_type: task.task_type,
          verification_method: task.verification_method,
          social_platform: task.social_platform,
          blockchain_network: task.blockchain_network,
          contract_address: task.contract_address,
          requirements: task.requirements,
          is_active: task.is_active,
          completion_status: task.completion_status,
          impact_score: task.impact_score,
          estimated_time: task.estimated_time,
          participants: Math.floor(Math.random() * 1000) + 100, // Mock data
          deadline: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString() // Mock deadline
        }))
        setAllTasks(transformedTasks)
      } else {
        console.error('Failed to fetch tasks')
        toast.error('Failed to load tasks')
      }
    } catch (error) {
      console.error('Error fetching tasks:', error)
      toast.error('Failed to load tasks')
    } finally {
      setIsLoadingTasks(false)
    }
  }

  // Fetch user stats from API
  const fetchUserStats = async () => {
    if (!session?.user?.id) return
    
    try {
      setIsLoadingStats(true)
      const response = await fetch(`/api/users/stats?userId=${session.user.id}`)
      
      if (response.ok) {
        const data = await response.json()
        setUserStats({
          points: data.user.points,
          rank: data.user.rank,
          tasks_completed: data.user.tasks_completed,
          invites_sent: data.user.invites_sent
        })
        setLeaderboards({
          points: data.leaderboards.points,
          invites: data.leaderboards.invites
        })
      } else {
        console.error('Failed to fetch user stats')
        toast.error('Failed to load dashboard data')
      }
    } catch (error) {
      console.error('Error fetching user stats:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setIsLoadingStats(false)
    }
  }

  // Fetch user profile and generate unique invite link
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (session?.user?.id) {
        const { data, error } = await supabase
          .from('profiles')
          .select('username, id')
          .eq('id', session.user.id)
          .single()
        
        if (!error && data) {
          setProfile(data)
          // Generate unique invite link using username or user ID
          const uniqueCode = data.username || data.id.slice(0, 8)
          setInviteLink(`https://beta.honua.green/invite/${uniqueCode}`)
        } else {
          // Fallback to user ID if profile not found
          const uniqueCode = session.user.id.slice(0, 8)
          setInviteLink(`https://beta.honua.green/invite/${uniqueCode}`)
        }
        
        // Fetch user stats and tasks after profile is loaded
        await fetchUserStats()
        await fetchTasks()
      }
    }
    
    fetchUserProfile()
  }, [session?.user?.id, supabase])

  const filteredTasks = allTasks.filter((task) => {
    let matchesCategory = false
    if (selectedCategory === "All Tasks" || selectedCategory === "All") {
      matchesCategory = true
    } else {
      // Map category names to match the filter
      const categoryMap: { [key: string]: string[] } = {
        "Social": ["social"],
        "Blockchain": ["blockchain"],
        "Energy": ["energy"],
        "Waste": ["waste"],
        "Water": ["water"],
        "Transport": ["transport"],
        "Home": ["home"],
        "Shopping": ["shopping"]
      }
      
      const allowedCategories = categoryMap[selectedCategory] || [selectedCategory.toLowerCase()]
      matchesCategory = allowedCategories.includes(task.category.toLowerCase())
    }
    
    if (activeTab === "available") return matchesCategory && !task.completed_by_user
    if (activeTab === "completed") return matchesCategory && task.completed_by_user
    if (activeTab === "in-progress") return matchesCategory && task.progress > 0 && task.progress < 100
    return matchesCategory
  })

  const handleStartTask = (taskId: string) => {
    setAllTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, progress: 10 } : task)))
    toast.success("Task started! Complete the requirements to earn points.")
  }

  const handleCompleteTask = async (taskId: string) => {
    const task = allTasks.find((t) => t.id === taskId)
    if (!task || !session?.user?.id) return

    try {
      // Call the tasks API to mark task as completed and award points
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          task_id: taskId,
          user_id: session.user.id,
          verification_status: 'verified' // Auto-verify for demo purposes
        }),
      })

      if (response.ok) {
        // Update local state
        setAllTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, completed_by_user: true, progress: 100 } : t)),
        )
        
        // Refresh user stats to show updated points
        await fetchUserStats()
        
        toast.success(`Task completed! You earned ${task.points} points.`)
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to complete task')
      }
    } catch (error) {
      console.error('Error completing task:', error)
      toast.error('Failed to complete task')
    }
  }

  const handleExternalAction = (url: string, taskId: string) => {
    if (url === "#") {
      toast.info("Share functionality will be implemented soon!")
      return
    }
    window.open(url, "_blank")
    // Mark task as in progress when user clicks external link
    handleStartTask(taskId)
  }

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink)
    setIsCopied(true)
    toast.success("Invite link copied to clipboard!")
    setTimeout(() => setIsCopied(false), 2000)
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto p-4 pb-20 lg:pb-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-pink-500 rounded-xl flex items-center justify-center">
              <CheckSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Tasks & Rewards</h1>
              <p className="text-gray-600 dark:text-gray-400">Complete tasks, earn points, and make an impact</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <div className="xl:col-span-3">
            {/* User Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                      <Award className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-700 dark:text-green-300">{isLoadingStats ? '...' : userStats.points}</p>
                      <p className="text-sm text-green-600 dark:text-green-400">Total Points</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-800">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">#{isLoadingStats ? '...' : userStats.rank}</p>
                      <p className="text-sm text-blue-600 dark:text-blue-400">Global Rank</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border-purple-200 dark:border-purple-800">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                      <Target className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{isLoadingStats ? '...' : userStats.tasks_completed}</p>
                      <p className="text-sm text-purple-600 dark:text-purple-400">Tasks Done</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-orange-200 dark:border-orange-800">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                      <UserPlus className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">{isLoadingStats ? '...' : userStats.invites_sent}</p>
                      <p className="text-sm text-orange-600 dark:text-orange-400">Invites Sent</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Invite Section */}
            <Card className="mb-6 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <Gift className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Invite Friends & Earn</h3>
                      <p className="text-white/80">Get 10 points for each friend who joins!</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Input
                      value={inviteLink}
                      readOnly
                      className="w-64 bg-white/10 border-white/20 text-white placeholder-white/60"
                    />
                    <Button
                      onClick={copyInviteLink}
                      variant="secondary"
                      size="sm"
                      className="bg-white/20 hover:bg-white/30 text-white border-white/20"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      {isCopied ? 'Copied!' : 'Copy'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Category Filter Buttons */}
            <div className="flex flex-wrap gap-2 mb-6">
              {taskCategories.map((category) => {
                const IconComponent = category.icon
                return (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.name ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category.name)}
                    className={`flex items-center space-x-2 ${
                      selectedCategory === category.name
                        ? "sustainability-gradient text-white"
                        : "hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                  >
                    <IconComponent className="w-4 h-4" />
                    <span>{category.name}</span>
                  </Button>
                )
              })}
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="available">Available</TabsTrigger>
                <TabsTrigger value="in-progress">In Progress</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="space-y-4 mt-6">
                {isLoadingTasks ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading tasks...</p>
                  </div>
                ) : (
                  filteredTasks.map((task) => {
                    const IconComponent = task.icon
                    const isSocial = task.category.toLowerCase() === "social" || task.category.toLowerCase() === "blockchain"

                    return (
                      <Card
                        key={task.id}
                        className={`hover:shadow-lg transition-all duration-200 ${
                          isSocial
                            ? "bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/10 dark:to-cyan-900/10 border-blue-200 dark:border-blue-800"
                            : "bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 border-green-200 dark:border-green-800"
                        }`}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-start space-x-4 flex-1">
                              <div
                                className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                  isSocial ? "bg-blue-500 text-white" : "bg-green-500 text-white"
                                }`}
                              >
                                <IconComponent className="w-6 h-6" />
                              </div>

                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{task.title}</h3>
                                  <Badge className={getDifficultyColor(task.difficulty)}>{task.difficulty}</Badge>
                                  <Badge className={getCategoryBadgeColor(task.category)}>{task.category}</Badge>
                                </div>

                                <p className="text-gray-600 dark:text-gray-400 mb-3">{task.description}</p>

                                {task.progress > 0 && task.progress < 100 && (
                                  <div className="mb-3">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-sm text-gray-600 dark:text-gray-400">Progress</span>
                                      <span className="text-sm font-medium">{task.progress}%</span>
                                    </div>
                                    <Progress value={task.progress} className="h-2" />
                                  </div>
                                )}

                                <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                                  <div className="flex items-center space-x-1">
                                    <Award className="w-4 h-4" />
                                    <span className="font-medium text-green-600 dark:text-green-400">
                                      {task.points} points
                                    </span>
                                  </div>
                                  {task.participants && (
                                    <div className="flex items-center space-x-1">
                                      <Users className="w-4 h-4" />
                                      <span>{task.participants} participants</span>
                                    </div>
                                  )}
                                  {task.deadline && (
                                    <div className="flex items-center space-x-1">
                                      <Calendar className="w-4 h-4" />
                                      <span>{formatDeadline(task.deadline)}</span>
                                    </div>
                                  )}
                                  {task.estimated_time && (
                                    <div className="flex items-center space-x-1">
                                      <Clock className="w-4 h-4" />
                                      <span>{task.estimated_time}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="ml-4 flex flex-col space-y-2">
                              {task.completed_by_user ? (
                                <Badge className="bg-green-500 text-white px-4 py-2">
                                  <CheckSquare className="w-4 h-4 mr-1" />
                                  Completed
                                </Badge>
                              ) : task.progress > 0 ? (
                                <div className="space-y-2">
                                  <Button
                                    size="sm"
                                    className="sustainability-gradient"
                                    onClick={() => handleCompleteTask(task.id)}
                                  >
                                    <Upload className="w-4 h-4 mr-2" />
                                    Submit
                                  </Button>
                                  {isSocial && task.action_url && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleExternalAction(task.action_url!, task.id)}
                                    >
                                      <ExternalLink className="w-4 h-4 mr-2" />
                                      {task.action_text}
                                    </Button>
                                  )}
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <Button
                                    size="sm"
                                    className={
                                      isSocial ? "bg-blue-500 hover:bg-blue-600 text-white" : "sustainability-gradient"
                                    }
                                    onClick={() =>
                                      isSocial && task.action_url
                                        ? handleExternalAction(task.action_url, task.id)
                                        : handleStartTask(task.id)
                                    }
                                  >
                                    {isSocial && task.action_url ? (
                                      <>
                                        <ExternalLink className="w-4 h-4 mr-2" />
                                        {task.action_text || 'Open Social Media'}
                                      </>
                                    ) : (
                                      <>
                                        <Star className="w-4 h-4 mr-2" />
                                        Start Task
                                      </>
                                    )}
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })
                )}

                {filteredTasks.length === 0 && (
                  <Card className="text-center py-12">
                    <CardContent>
                      <CheckSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No tasks found</h3>
                      <p className="text-gray-500 dark:text-gray-400">Try selecting a different category or tab</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-6">


            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Crown className="w-5 h-5" />
                  <span>Leaderboards</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={leaderboardTab} onValueChange={setLeaderboardTab}>
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="points">Points</TabsTrigger>
                    <TabsTrigger value="invites">Invites</TabsTrigger>
                  </TabsList>

                  <TabsContent value="points" className="space-y-4">
                    {isLoadingStats ? (
                      <div className="text-center py-4">
                        <p className="text-gray-500">Loading leaderboard...</p>
                      </div>
                    ) : leaderboards.points.length > 0 ? (
                      leaderboards.points.map((entry: any) => (
                        <div key={entry.rank} className="flex items-center space-x-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                              entry.rank === 1
                                ? "bg-yellow-100 text-yellow-800"
                                : entry.rank === 2
                                  ? "bg-gray-100 text-gray-800"
                                  : entry.rank === 3
                                    ? "bg-orange-100 text-orange-800"
                                    : "bg-gray-50 text-gray-600"
                            }`}
                          >
                            {entry.rank}
                          </div>
                          <img
                            src={entry.user.avatar_url || "/placeholder.svg"}
                            alt={entry.user.full_name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                              {entry.user.full_name}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {entry.points} points • {entry.tasks_completed} tasks
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-gray-500">No leaderboard data available</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="invites" className="space-y-4">
                    {isLoadingStats ? (
                      <div className="text-center py-4">
                        <p className="text-gray-500">Loading leaderboard...</p>
                      </div>
                    ) : leaderboards.invites.length > 0 ? (
                      leaderboards.invites.map((entry: any) => (
                        <div key={entry.rank} className="flex items-center space-x-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                              entry.rank === 1
                                ? "bg-yellow-100 text-yellow-800"
                                : entry.rank === 2
                                  ? "bg-gray-100 text-gray-800"
                                  : entry.rank === 3
                                    ? "bg-orange-100 text-orange-800"
                                    : "bg-gray-50 text-gray-600"
                            }`}
                          >
                            {entry.rank}
                          </div>
                          <img
                            src={entry.user.avatar_url || "/placeholder.svg"}
                            alt={entry.user.full_name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                              {entry.user.full_name}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {entry.invites} invites • {entry.points_earned} pts
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-gray-500">No leaderboard data available</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Available Tasks</span>
                  <span className="font-medium">{allTasks.filter((t) => !t.completed_by_user).length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Social Tasks</span>
                  <span className="font-medium">{allTasks.filter(t => t.category.toLowerCase() === 'social').length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Sustainability Tasks</span>
                  <span className="font-medium">{allTasks.filter(t => !['social', 'blockchain'].includes(t.category.toLowerCase())).length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total Participants</span>
                  <span className="font-medium">4,892</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Points Awarded</span>
                  <span className="font-medium">127,450</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
