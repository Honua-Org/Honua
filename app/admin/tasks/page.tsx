'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

import { useToast } from '@/hooks/use-toast'
import { Loader2, Plus, Edit, Trash2, Eye, Users, Award, Clock, CheckCircle } from 'lucide-react'

interface Task {
  id: string
  title: string
  description: string
  category: string
  difficulty: 'easy' | 'medium' | 'hard'
  points: number
  impact_score: number
  verification_required: boolean
  task_type: 'sustainability' | 'social_media' | 'blockchain' | 'community' | 'educational'
  verification_method: 'manual' | 'automatic' | 'social_verification' | 'blockchain_verification' | 'url_verification'
  external_url?: string
  social_platform?: string
  blockchain_network?: string
  contract_address?: string
  requirements?: any
  created_at: string
  completion_count?: number
}

interface TaskFormData {
  title: string
  description: string
  category: string
  difficulty: 'easy' | 'medium' | 'hard'
  points: number
  impact_score: number
  verification_required: boolean
  task_type: 'sustainability' | 'social_media' | 'blockchain' | 'community' | 'educational'
  verification_method: 'manual' | 'automatic' | 'social_verification' | 'blockchain_verification' | 'url_verification'
  external_url: string
  social_platform: string
  blockchain_network: string
  contract_address: string
  requirements: string
}

const categories = [
  'Energy',
  'Waste',
  'Transportation',
  'Water',
  'Biodiversity',
  'Community',
  'Education',
  'Food',
  'Climate',
  'Recycling',
  'Social Media',
  'Blockchain',
  'Educational'
]

const taskTypes = [
  { value: 'sustainability', label: 'Sustainability', icon: '🌱' },
  { value: 'social_media', label: 'Social Media', icon: '📱' },
  { value: 'blockchain', label: 'Blockchain', icon: '⛓️' },
  { value: 'community', label: 'Community', icon: '👥' },
  { value: 'educational', label: 'Educational', icon: '📚' }
]

const verificationMethods = [
  { value: 'manual', label: 'Manual Review', description: 'Admin manually verifies completion' },
  { value: 'automatic', label: 'Automatic', description: 'System automatically marks as complete' },
  { value: 'social_verification', label: 'Social Media Verification', description: 'Verify through social media APIs' },
  { value: 'blockchain_verification', label: 'Blockchain Verification', description: 'Verify through blockchain transaction' },
  { value: 'url_verification', label: 'URL Verification', description: 'Verify through website visit tracking' }
]

const socialPlatforms = [
  { value: 'twitter', label: 'X (Twitter)', icon: '🐦' },
  { value: 'instagram', label: 'Instagram', icon: '📷' },
  { value: 'linkedin', label: 'LinkedIn', icon: '💼' },
  { value: 'facebook', label: 'Facebook', icon: '👥' },
  { value: 'youtube', label: 'YouTube', icon: '📺' },
  { value: 'tiktok', label: 'TikTok', icon: '🎵' }
]

const blockchainNetworks = [
  { value: 'ethereum', label: 'Ethereum', icon: '⟠' },
  { value: 'polygon', label: 'Polygon', icon: '🔷' },
  { value: 'binance', label: 'Binance Smart Chain', icon: '🟡' },
  { value: 'solana', label: 'Solana', icon: '🌞' },
  { value: 'cardano', label: 'Cardano', icon: '🔵' },
  { value: 'avalanche', label: 'Avalanche', icon: '🔺' }
]

const difficulties = [
  { value: 'easy', label: 'Easy', color: 'bg-green-100 text-green-800' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'hard', label: 'Hard', color: 'bg-red-100 text-red-800' }
]

export default function AdminTasksPage() {
  const { toast } = useToast()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    category: '',
    difficulty: 'easy',
    points: 10,
    impact_score: 10,
    verification_required: false,
    task_type: 'sustainability',
    verification_method: 'manual',
    external_url: '',
    social_platform: '',
    blockchain_network: '',
    contract_address: '',
    requirements: '{}'
  })

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: '',
      difficulty: 'easy',
      points: 10,
      impact_score: 10,
      verification_required: false,
      task_type: 'sustainability',
      verification_method: 'manual',
      external_url: '',
      social_platform: '',
      blockchain_network: '',
      contract_address: '',
      requirements: '{}'
    })
    setEditingTask(null)
  }

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/admin/tasks')
      if (response.ok) {
        const data = await response.json()
        setTasks(data.tasks || [])
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch tasks",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error fetching tasks:', error)
      toast({
        title: "Error",
        description: "Failed to fetch tasks",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title || !formData.description || !formData.category) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }

    // Validate requirements JSON
    let parsedRequirements = {}
    try {
      parsedRequirements = JSON.parse(formData.requirements)
    } catch (error) {
      toast({
        title: "Error",
        description: "Requirements must be valid JSON",
        variant: "destructive"
      })
      return
    }

    setCreating(true)
    
    try {
      const url = editingTask ? `/api/admin/tasks/${editingTask.id}` : '/api/admin/tasks'
      const method = editingTask ? 'PUT' : 'POST'
      
      const submitData = {
        ...formData,
        requirements: parsedRequirements,
        external_url: formData.external_url || null,
        social_platform: formData.social_platform || null,
        blockchain_network: formData.blockchain_network || null,
        contract_address: formData.contract_address || null
      }
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submitData)
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: editingTask ? "Task updated successfully" : "Task created successfully"
        })
        resetForm()
        setIsDialogOpen(false)
        fetchTasks()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to save task",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error saving task:', error)
      toast({
        title: "Error",
        description: "Failed to save task",
        variant: "destructive"
      })
    } finally {
      setCreating(false)
    }
  }

  const handleEdit = (task: Task) => {
    setEditingTask(task)
    setFormData({
      title: task.title,
      description: task.description,
      category: task.category,
      difficulty: task.difficulty,
      points: task.points,
      impact_score: task.impact_score,
      verification_required: task.verification_required,
      task_type: task.task_type || 'sustainability',
      verification_method: task.verification_method || 'manual',
      external_url: task.external_url || '',
      social_platform: task.social_platform || '',
      blockchain_network: task.blockchain_network || '',
      contract_address: task.contract_address || '',
      requirements: task.requirements ? JSON.stringify(task.requirements, null, 2) : '{}'
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
      return
    }

    setDeleting(taskId)
    
    try {
      const response = await fetch(`/api/admin/tasks/${taskId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Task deleted successfully"
        })
        fetchTasks()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to delete task",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error deleting task:', error)
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive"
      })
    } finally {
      setDeleting(null)
    }
  }

  const getDifficultyBadge = (difficulty: string) => {
    const diff = difficulties.find(d => d.value === difficulty)
    return (
      <Badge className={diff?.color}>
        {diff?.label}
      </Badge>
    )
  }

  const getStats = () => {
    const totalTasks = tasks.length
    const totalCompletions = tasks.reduce((sum, task) => sum + (task.completion_count || 0), 0)
    const avgPoints = totalTasks > 0 ? Math.round(tasks.reduce((sum, task) => sum + task.points, 0) / totalTasks) : 0
    const verificationRequired = tasks.filter(task => task.verification_required).length
    
    return { totalTasks, totalCompletions, avgPoints, verificationRequired }
  }

  const stats = getStats()

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Task Management</h1>
          <p className="text-muted-foreground">
            Create and manage sustainability tasks for your community
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Create Task
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingTask ? 'Edit Task' : 'Create New Task'}
              </DialogTitle>
              <DialogDescription>
                {editingTask ? 'Update the task details below.' : 'Fill in the details to create a new sustainability task.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Install LED Bulbs"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe what users need to do to complete this task..."
                    rows={3}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="difficulty">Difficulty</Label>
                  <Select value={formData.difficulty} onValueChange={(value: 'easy' | 'medium' | 'hard') => setFormData({ ...formData, difficulty: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {difficulties.map((diff) => (
                        <SelectItem key={diff.value} value={diff.value}>
                          {diff.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="points">Points</Label>
                  <Input
                    id="points"
                    type="number"
                    min="1"
                    max="1000"
                    value={formData.points}
                    onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="impact_score">Impact Score</Label>
                  <Input
                    id="impact_score"
                    type="number"
                    min="1"
                    max="1000"
                    value={formData.impact_score}
                    onChange={(e) => setFormData({ ...formData, impact_score: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="col-span-2 flex items-center space-x-2">
                  <Switch
                    id="verification_required"
                    checked={formData.verification_required}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, verification_required: checked }))}
                  />
                  <Label htmlFor="verification_required">Requires verification</Label>
                </div>

                <div>
                  <Label htmlFor="task_type">Task Type</Label>
                  <Select
                        value={formData.task_type}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, task_type: value as TaskFormData['task_type'] }))}
                      >
                    <SelectTrigger>
                      <SelectValue placeholder="Select task type" />
                    </SelectTrigger>
                    <SelectContent>
                      {taskTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.icon} {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="verification_method">Verification Method</Label>
                  <Select
                        value={formData.verification_method}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, verification_method: value as TaskFormData['verification_method'] }))}
                      >
                    <SelectTrigger>
                      <SelectValue placeholder="Select verification method" />
                    </SelectTrigger>
                    <SelectContent>
                      {verificationMethods.map(method => (
                        <SelectItem key={method.value} value={method.value}>
                          {method.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {(formData.task_type === 'social_media' || formData.verification_method === 'url_verification') && (
                  <div className="col-span-2">
                    <Label htmlFor="external_url">External URL</Label>
                    <Input
                      id="external_url"
                      value={formData.external_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, external_url: e.target.value }))}
                      placeholder="https://example.com"
                    />
                  </div>
                )}

                {formData.task_type === 'social_media' && (
                  <div>
                    <Label htmlFor="social_platform">Social Platform</Label>
                    <Select
                       value={formData.social_platform}
                       onValueChange={(value) => setFormData(prev => ({ ...prev, social_platform: value as TaskFormData['social_platform'] }))}
                     >
                      <SelectTrigger>
                        <SelectValue placeholder="Select social platform" />
                      </SelectTrigger>
                      <SelectContent>
                        {socialPlatforms.map(platform => (
                          <SelectItem key={platform.value} value={platform.value}>
                            {platform.icon} {platform.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {formData.task_type === 'blockchain' && (
                  <>
                    <div>
                      <Label htmlFor="blockchain_network">Blockchain Network</Label>
                      <Select
                         value={formData.blockchain_network}
                         onValueChange={(value) => setFormData(prev => ({ ...prev, blockchain_network: value as TaskFormData['blockchain_network'] }))}
                       >
                        <SelectTrigger>
                          <SelectValue placeholder="Select blockchain network" />
                        </SelectTrigger>
                        <SelectContent>
                          {blockchainNetworks.map(network => (
                            <SelectItem key={network.value} value={network.value}>
                              {network.icon} {network.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="contract_address">Contract Address (Optional)</Label>
                      <Input
                        id="contract_address"
                        value={formData.contract_address}
                        onChange={(e) => setFormData(prev => ({ ...prev, contract_address: e.target.value }))}
                        placeholder="0x..."
                      />
                    </div>
                  </>
                )}

                <div className="col-span-2">
                  <Label htmlFor="requirements">Requirements (JSON)</Label>
                  <Textarea
                    id="requirements"
                    value={formData.requirements}
                    onChange={(e) => setFormData(prev => ({ ...prev, requirements: e.target.value }))}
                    placeholder='{"example": "requirement"}'
                    rows={4}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Specify task-specific requirements in JSON format
                  </p>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={creating}>
                  {creating ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  {editingTask ? 'Update Task' : 'Create Task'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTasks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Completions</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCompletions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Points</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgPoints}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Need Verification</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.verificationRequired}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tasks Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Tasks</CardTitle>
          <CardDescription>
            Manage your sustainability tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <div className="text-center py-8">
              <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No tasks yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first sustainability task to get started
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Task
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Difficulty</TableHead>
                  <TableHead>Points</TableHead>
                  <TableHead>Impact</TableHead>
                  <TableHead>Verification</TableHead>
                  <TableHead>Completions</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{task.title}</div>
                        <div className="text-sm text-muted-foreground truncate max-w-xs">
                          {task.description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{task.category}</Badge>
                    </TableCell>
                    <TableCell>
                      {getDifficultyBadge(task.difficulty)}
                    </TableCell>
                    <TableCell>{task.points}</TableCell>
                    <TableCell>{task.impact_score}</TableCell>
                    <TableCell>
                      {task.verification_required ? (
                        <Badge className="bg-orange-100 text-orange-800">Required</Badge>
                      ) : (
                        <Badge className="bg-green-100 text-green-800">Auto</Badge>
                      )}
                    </TableCell>
                    <TableCell>{task.completion_count || 0}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(task)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(task.id)}
                          disabled={deleting === task.id}
                        >
                          {deleting === task.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}