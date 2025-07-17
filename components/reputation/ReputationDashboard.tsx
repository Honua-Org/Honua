'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ReputationBadge, { ReputationLevel } from './ReputationBadge'
import { formatDistanceToNow } from 'date-fns'
import { Trophy, TrendingUp, Calendar, Award, Target, Star } from 'lucide-react'

interface ReputationAction {
  id: string
  action_type: string
  points: number
  description: string
  created_at: string
  reference_type?: string
}

interface Achievement {
  earned_at: string
  achievements: {
    id: string
    name: string
    description: string
    icon: string
    category: string
    points: number
  }
}

interface ReputationData {
  user: {
    id: string
    username: string
    reputation: number
  }
  level: ReputationLevel
  recentActions: ReputationAction[]
  achievements: Achievement[]
}

interface ReputationDashboardProps {
  userId: string
  username?: string
}

const ReputationDashboard: React.FC<ReputationDashboardProps> = ({ userId, username }) => {
  const [reputationData, setReputationData] = useState<ReputationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchReputationData()
  }, [userId, username])

  const fetchReputationData = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (userId) params.append('userId', userId)
      if (username) params.append('username', username)
      
      const response = await fetch(`/api/reputation?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch reputation data')
      }
      
      const data = await response.json()
      setReputationData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const getNextLevelProgress = () => {
    if (!reputationData) return { progress: 0, nextLevel: null, pointsNeeded: 0 }
    
    const currentRep = reputationData.user.reputation
    const levels = [
      { name: 'New Member', min: 0, max: 100 },
      { name: 'Active Contributor', min: 101, max: 300 },
      { name: 'Trusted Member', min: 301, max: 600 },
      { name: 'Community Expert', min: 601, max: 900 },
      { name: 'Sustainability Leader', min: 901, max: 9999 }
    ]
    
    const currentLevel = levels.find(level => currentRep >= level.min && currentRep <= level.max)
    const nextLevel = levels.find(level => level.min > currentRep)
    
    if (!currentLevel || !nextLevel) {
      return { progress: 100, nextLevel: null, pointsNeeded: 0 }
    }
    
    const progress = ((currentRep - currentLevel.min) / (nextLevel.min - currentLevel.min)) * 100
    const pointsNeeded = nextLevel.min - currentRep
    
    return { progress, nextLevel, pointsNeeded }
  }

  const getActionTypeDisplay = (actionType: string) => {
    const actionTypes: Record<string, { label: string; icon: string; color: string }> = {
      'post_created': { label: 'Post Created', icon: '📝', color: 'bg-blue-100 text-blue-800' },
      'post_liked': { label: 'Post Liked', icon: '👍', color: 'bg-green-100 text-green-800' },
      'post_shared': { label: 'Post Shared', icon: '🔄', color: 'bg-purple-100 text-purple-800' },
      'comment_created': { label: 'Comment Added', icon: '💬', color: 'bg-gray-100 text-gray-800' },
      'comment_helpful': { label: 'Helpful Comment', icon: '🎯', color: 'bg-orange-100 text-orange-800' },
      'task_completed': { label: 'Task Completed', icon: '✅', color: 'bg-emerald-100 text-emerald-800' },
      'achievement_earned': { label: 'Achievement Earned', icon: '🏆', color: 'bg-yellow-100 text-yellow-800' },
      'verified_action': { label: 'Action Verified', icon: '✔️', color: 'bg-teal-100 text-teal-800' },
      'sustainability_impact': { label: 'Impact Made', icon: '🌱', color: 'bg-green-100 text-green-800' },
      'peer_recognition': { label: 'Peer Recognition', icon: '⭐', color: 'bg-indigo-100 text-indigo-800' }
    }
    
    return actionTypes[actionType] || { label: actionType, icon: '📊', color: 'bg-gray-100 text-gray-800' }
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'sustainability': 'bg-green-100 text-green-800',
      'community': 'bg-blue-100 text-blue-800',
      'content': 'bg-purple-100 text-purple-800',
      'engagement': 'bg-orange-100 text-orange-800',
      'impact': 'bg-emerald-100 text-emerald-800'
    }
    return colors[category] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded-lg mb-4"></div>
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    )
  }

  if (error || !reputationData) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            {error || 'Failed to load reputation data'}
          </div>
        </CardContent>
      </Card>
    )
  }

  const { progress, nextLevel, pointsNeeded } = getNextLevelProgress()

  return (
    <div className="space-y-6">
      {/* Reputation Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Reputation Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div>
              <ReputationBadge 
                reputation={reputationData.user.reputation} 
                level={reputationData.level}
                size="lg"
                showTooltip={false}
              />
              <p className="text-sm text-gray-600 mt-2">
                {reputationData.level?.description}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                {reputationData.user.reputation}
              </div>
              <div className="text-sm text-gray-500">Total Points</div>
            </div>
          </div>
          
          {nextLevel && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress to {nextLevel.name}</span>
                <span>{pointsNeeded} points needed</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Information */}
      <Tabs defaultValue="actions" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="actions" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Recent Activity
          </TabsTrigger>
          <TabsTrigger value="achievements" className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            Achievements
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="actions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Reputation Actions</CardTitle>
            </CardHeader>
            <CardContent>
              {reputationData.recentActions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No recent activity</p>
                  <p className="text-sm">Start engaging with the community to earn reputation!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {reputationData.recentActions.map((action) => {
                    const actionDisplay = getActionTypeDisplay(action.action_type)
                    return (
                      <div key={action.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{actionDisplay.icon}</span>
                          <div>
                            <div className="font-medium">{actionDisplay.label}</div>
                            {action.description && (
                              <div className="text-sm text-gray-600">{action.description}</div>
                            )}
                            <div className="text-xs text-gray-500">
                              {formatDistanceToNow(new Date(action.created_at), { addSuffix: true })}
                            </div>
                          </div>
                        </div>
                        <div className={`px-2 py-1 rounded-full text-sm font-medium ${
                          action.points > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {action.points > 0 ? '+' : ''}{action.points}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="achievements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Earned Achievements</CardTitle>
            </CardHeader>
            <CardContent>
              {reputationData.achievements.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No achievements yet</p>
                  <p className="text-sm">Complete tasks and engage with the community to earn achievements!</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {reputationData.achievements.map((achievement) => (
                    <div key={achievement.achievements.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{achievement.achievements.icon}</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{achievement.achievements.name}</h3>
                            <Badge className={getCategoryColor(achievement.achievements.category)}>
                              {achievement.achievements.category}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {achievement.achievements.description}
                          </p>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDistanceToNow(new Date(achievement.earned_at), { addSuffix: true })}
                            </span>
                            <span className="font-medium text-green-600">
                              +{achievement.achievements.points} points
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default ReputationDashboard