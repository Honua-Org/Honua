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
} from "lucide-react"
import { toast } from "sonner"

interface Task {
  id: string
  title: string
  description: string
  category: string
  points: number
  deadline: string
  difficulty: string
  participants: number
  completed_by_user: boolean
  progress: number
  icon: any
  action_text: string
  verification_required: boolean
  action_url?: string
}

const socialFiTasks: Task[] = [
  {
    id: "social-1",
    title: "Follow Honua on Twitter",
    description: "Follow @HonuaEcosystem on Twitter to stay updated with our latest news",
    category: "SocialFi",
    points: 25,
    deadline: "2024-03-31T23:59:59Z",
    difficulty: "Easy",
    participants: 1234,
    completed_by_user: false,
    progress: 0,
    icon: Twitter,
    action_url: "https://x.com/HonuaEcosystem",
    action_text: "Follow on Twitter",
    verification_required: true,
  },
  {
    id: "social-2",
    title: "Like Our Latest Post",
    description: "Like and retweet our pinned tweet about sustainable living",
    category: "SocialFi",
    points: 15,
    deadline: "2024-02-28T23:59:59Z",
    difficulty: "Easy",
    participants: 892,
    completed_by_user: true,
    progress: 100,
    icon: Heart,
    action_url: "https://x.com/HonuaEcosystem/status/1936335715341844968",
    action_text: "Like Tweet",
    verification_required: true,
  },
  {
    id: "social-3",
    title: "Share Honua with Friends",
    description: "Share Honua platform on your social media and tag 3 friends",
    category: "SocialFi",
    points: 40,
    deadline: "2024-03-15T23:59:59Z",
    difficulty: "Medium",
    participants: 567,
    completed_by_user: false,
    progress: 0,
    icon: Share2,
    action_url: "#",
    action_text: "Share Now",
    verification_required: true,
  },
  {
    id: "social-4",
    title: "Join Our Discord",
    description: "Join our Discord community and introduce yourself",
    category: "SocialFi",
    points: 30,
    deadline: "2024-02-29T23:59:59Z",
    difficulty: "Easy",
    participants: 2341,
    completed_by_user: false,
    progress: 0,
    icon: MessageCircle,
    action_url: "https://t.co/4xmmjkfGgT",
    action_text: "Join Discord",
    verification_required: true,
  },
]

const sustainabilityTasks: Task[] = [
  {
    id: "sustain-1",
    title: "Plant a Tree Challenge",
    description: "Plant a native tree in your community and share a photo with location",
    category: "Conservation",
    points: 100,
    deadline: "2024-04-22T23:59:59Z",
    difficulty: "Medium",
    participants: 234,
    completed_by_user: false,
    progress: 0,
    icon: Leaf,
    action_text: "Upload Photo",
    verification_required: true,
  },
  {
    id: "sustain-2",
    title: "Zero Waste Week",
    description: "Document your zero waste journey for 7 consecutive days",
    category: "Waste Reduction",
    points: 80,
    deadline: "2024-03-31T23:59:59Z",
    difficulty: "Hard",
    participants: 156,
    completed_by_user: false,
    progress: 25,
    icon: Target,
    action_text: "Continue Challenge",
    verification_required: true,
  },
  {
    id: "sustain-3",
    title: "Energy Audit Report",
    description: "Conduct a home energy audit and share your findings and improvements",
    category: "Energy Efficiency",
    points: 60,
    deadline: "2024-03-15T23:59:59Z",
    difficulty: "Medium",
    participants: 89,
    completed_by_user: true,
    progress: 100,
    icon: Zap,
    action_text: "View Report",
    verification_required: true,
  },
  {
    id: "sustain-4",
    title: "Sustainable Transportation",
    description: "Use eco-friendly transport (bike, walk, public transport) for 5 days",
    category: "Transportation",
    points: 50,
    deadline: "2024-02-28T23:59:59Z",
    difficulty: "Medium",
    participants: 445,
    completed_by_user: false,
    progress: 60,
    icon: Target,
    action_text: "Log Journey",
    verification_required: true,
  },
]

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

const taskCategories = ["All", "SocialFi", "Conservation", "Waste Reduction", "Energy Efficiency", "Transportation"]

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case "Easy":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
    case "Medium":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
    case "Hard":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
  }
}

const getCategoryColor = (category: string) => {
  switch (category) {
    case "SocialFi":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
    case "Conservation":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
    case "Waste Reduction":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
    case "Energy Efficiency":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
    case "Transportation":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
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
  const [allTasks, setAllTasks] = useState<Task[]>([...socialFiTasks, ...sustainabilityTasks])
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [activeTab, setActiveTab] = useState("available")
  const [leaderboardTab, setLeaderboardTab] = useState("points")
  const [inviteLink, setInviteLink] = useState("https://honua.app/invite/loading...")
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
          setInviteLink(`https://honuasocial.vercel.app/invite/${uniqueCode}`)
        } else {
          // Fallback to user ID if profile not found
          const uniqueCode = session.user.id.slice(0, 8)
          setInviteLink(`https://honuasocial.vercel.app/invite/${uniqueCode}`)
        }
        
        // Fetch user stats after profile is loaded
        await fetchUserStats()
      }
    }
    
    fetchUserProfile()
  }, [session?.user?.id, supabase])

  const filteredTasks = allTasks.filter((task) => {
    const matchesCategory = selectedCategory === "All" || task.category === selectedCategory
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

            <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="available">Available</TabsTrigger>
                <TabsTrigger value="in-progress">In Progress</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="space-y-4 mt-6">
                {filteredTasks.map((task) => {
                  const IconComponent = task.icon
                  const isSocialFi = task.category === "SocialFi"

                  return (
                    <Card
                      key={task.id}
                      className={`hover:shadow-lg transition-all duration-200 ${
                        isSocialFi
                          ? "bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/10 dark:to-cyan-900/10 border-blue-200 dark:border-blue-800"
                          : "bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 border-green-200 dark:border-green-800"
                      }`}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-start space-x-4 flex-1">
                            <div
                              className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                isSocialFi ? "bg-blue-500 text-white" : "bg-green-500 text-white"
                              }`}
                            >
                              <IconComponent className="w-6 h-6" />
                            </div>

                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{task.title}</h3>
                                <Badge className={getDifficultyColor(task.difficulty)}>{task.difficulty}</Badge>
                                <Badge className={getCategoryColor(task.category)}>{task.category}</Badge>
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
                                <div className="flex items-center space-x-1">
                                  <Users className="w-4 h-4" />
                                  <span>{task.participants} participants</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Calendar className="w-4 h-4" />
                                  <span>{formatDeadline(task.deadline)}</span>
                                </div>
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
                                {isSocialFi && task.action_url && (
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
                                    isSocialFi ? "bg-blue-500 hover:bg-blue-600 text-white" : "sustainability-gradient"
                                  }
                                  onClick={() =>
                                    isSocialFi && task.action_url
                                      ? handleExternalAction(task.action_url, task.id)
                                      : handleStartTask(task.id)
                                  }
                                >
                                  {isSocialFi && task.action_url ? (
                                    <>
                                      <ExternalLink className="w-4 h-4 mr-2" />
                                      {task.action_text}
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
                })}

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
                <CardTitle>Categories</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {taskCategories.map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setSelectedCategory(category)}
                  >
                    <Leaf className="w-4 h-4 mr-2" />
                    {category}
                  </Button>
                ))}
              </CardContent>
            </Card>

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
                  <span className="text-sm text-gray-600 dark:text-gray-400">SocialFi Tasks</span>
                  <span className="font-medium">{socialFiTasks.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Sustainability Tasks</span>
                  <span className="font-medium">{sustainabilityTasks.length}</span>
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
