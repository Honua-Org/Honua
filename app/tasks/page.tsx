"use client"

import { useState } from "react"
import MainLayout from "@/components/main-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckSquare, Calendar, Award, TrendingUp, Users, Target, Leaf, Upload } from "lucide-react"

const mockTasks = [
  {
    id: "1",
    title: "Plant a Tree",
    description: "Plant a native tree in your community and share a photo",
    category: "Conservation",
    points: 50,
    deadline: "2024-02-15T23:59:59Z",
    difficulty: "Easy",
    participants: 234,
    completed_by_user: false,
    progress: 0,
  },
  {
    id: "2",
    title: "Start Composting",
    description: "Begin composting organic waste and document your setup",
    category: "Waste Reduction",
    points: 30,
    deadline: "2024-01-31T23:59:59Z",
    difficulty: "Easy",
    participants: 456,
    completed_by_user: true,
    progress: 100,
  },
  {
    id: "3",
    title: "Energy Audit",
    description: "Conduct a home energy audit and share your findings",
    category: "Energy Efficiency",
    points: 40,
    deadline: "2024-02-28T23:59:59Z",
    difficulty: "Medium",
    participants: 123,
    completed_by_user: false,
    progress: 25,
  },
  {
    id: "4",
    title: "Bike to Work Week",
    description: "Use sustainable transportation for a full week",
    category: "Sustainable Transportation",
    points: 60,
    deadline: "2024-02-07T23:59:59Z",
    difficulty: "Medium",
    participants: 789,
    completed_by_user: false,
    progress: 60,
  },
  {
    id: "5",
    title: "Community Garden",
    description: "Start or join a community garden project",
    category: "Sustainable Agriculture",
    points: 80,
    deadline: "2024-03-15T23:59:59Z",
    difficulty: "Hard",
    participants: 67,
    completed_by_user: false,
    progress: 0,
  },
]

const mockLeaderboard = [
  {
    rank: 1,
    user: {
      username: "sarah_green",
      full_name: "Sarah Green",
      avatar_url: "/placeholder.svg?height=32&width=32",
    },
    points: 450,
    tasks_completed: 12,
  },
  {
    rank: 2,
    user: {
      username: "eco_marcus",
      full_name: "Marcus Johnson",
      avatar_url: "/placeholder.svg?height=32&width=32",
    },
    points: 380,
    tasks_completed: 9,
  },
  {
    rank: 3,
    user: {
      username: "green_tech_co",
      full_name: "GreenTech Solutions",
      avatar_url: "/placeholder.svg?height=32&width=32",
    },
    points: 320,
    tasks_completed: 8,
  },
]

const taskCategories = [
  "All",
  "Conservation",
  "Waste Reduction",
  "Energy Efficiency",
  "Sustainable Transportation",
  "Sustainable Agriculture",
]

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
  const [tasks, setTasks] = useState(mockTasks)
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [activeTab, setActiveTab] = useState("available")

  const userPoints = 180
  const userRank = 15
  const tasksCompleted = 4

  const filteredTasks = tasks.filter((task) => {
    const matchesCategory = selectedCategory === "All" || task.category === selectedCategory
    if (activeTab === "available") return matchesCategory && !task.completed_by_user
    if (activeTab === "completed") return matchesCategory && task.completed_by_user
    if (activeTab === "in-progress") return matchesCategory && task.progress > 0 && task.progress < 100
    return matchesCategory
  })

  const handleStartTask = (taskId: string) => {
    setTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, progress: 10 } : task)))
  }

  const handleCompleteTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === taskId ? { ...task, completed_by_user: true, progress: 100 } : task)),
    )
  }

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto p-4 pb-20 lg:pb-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
              <CheckSquare className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Sustainability Tasks</h1>
              <p className="text-gray-600 dark:text-gray-400">Take action and earn points for sustainable activities</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            {/* User Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                      <Award className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{userPoints}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total Points</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">#{userRank}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Global Rank</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
                      <Target className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{tasksCompleted}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Tasks Completed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="available">Available</TabsTrigger>
                <TabsTrigger value="in-progress">In Progress</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="space-y-4 mt-6">
                {filteredTasks.map((task) => (
                  <Card key={task.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{task.title}</h3>
                            <Badge className={getDifficultyColor(task.difficulty)}>{task.difficulty}</Badge>
                            <Badge variant="outline">{task.category}</Badge>
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
                              <span>{task.points} points</span>
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

                        <div className="ml-4">
                          {task.completed_by_user ? (
                            <Badge className="bg-green-500 text-white">
                              <CheckSquare className="w-4 h-4 mr-1" />
                              Completed
                            </Badge>
                          ) : task.progress > 0 ? (
                            <div className="space-y-2">
                              <Button size="sm" className="sustainability-gradient">
                                <Upload className="w-4 h-4 mr-2" />
                                Submit
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => handleCompleteTask(task.id)}>
                                Complete
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              className="sustainability-gradient"
                              onClick={() => handleStartTask(task.id)}
                            >
                              Start Task
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

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
                  <TrendingUp className="w-5 h-5" />
                  <span>Leaderboard</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {mockLeaderboard.map((entry) => (
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
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{entry.user.full_name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {entry.points} points • {entry.tasks_completed} tasks
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Available Tasks</span>
                  <span className="font-medium">{tasks.filter((t) => !t.completed_by_user).length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total Participants</span>
                  <span className="font-medium">2,847</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Points Awarded</span>
                  <span className="font-medium">45,230</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
