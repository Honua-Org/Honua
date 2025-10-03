'use client'

import { useState, useEffect } from 'react'
import { Leaf, TrendingUp, TrendingDown, History, Award, ShoppingCart, Plus, Minus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface GreenPointsTransaction {
  id: string
  points: number
  action_type: string
  description: string
  metadata?: any
  created_at: string
}

interface GreenPointsDisplayProps {
  balance?: number
  transactions?: GreenPointsTransaction[]
  isLoading?: boolean
  showTransactions?: boolean
  compact?: boolean
  className?: string
}

const ACTION_TYPE_CONFIG = {
  'daily_login': { icon: '🎯', color: 'text-blue-600', label: 'Daily Login' },
  'post_creation': { icon: '📝', color: 'text-green-600', label: 'Post Created' },
  'comment_creation': { icon: '💬', color: 'text-purple-600', label: 'Comment Added' },
  'marketplace_purchase': { icon: '🛒', color: 'text-red-600', label: 'Purchase' },
  'marketplace_sale': { icon: '💰', color: 'text-green-600', label: 'Sale Reward' },
  'referral_signup': { icon: '👥', color: 'text-orange-600', label: 'Referral Bonus' },
  'sustainability_action': { icon: '🌱', color: 'text-green-600', label: 'Eco Action' },
  'profile_completion': { icon: '✅', color: 'text-blue-600', label: 'Profile Complete' },
  'admin_award': { icon: '🏆', color: 'text-yellow-600', label: 'Admin Award' }
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
  
  if (diffInHours < 1) {
    return 'Just now'
  } else if (diffInHours < 24) {
    return `${Math.floor(diffInHours)}h ago`
  } else if (diffInHours < 168) {
    return `${Math.floor(diffInHours / 24)}d ago`
  } else {
    return date.toLocaleDateString()
  }
}

const formatPoints = (points: number) => {
  return new Intl.NumberFormat().format(Math.abs(points))
}

export function GreenPointsDisplay({
  balance = 0,
  transactions = [],
  isLoading = false,
  showTransactions = true,
  compact = false,
  className
}: GreenPointsDisplayProps) {
  const [selectedTab, setSelectedTab] = useState('all')
  
  const filteredTransactions = transactions.filter(transaction => {
    if (selectedTab === 'earned') return transaction.points > 0
    if (selectedTab === 'spent') return transaction.points < 0
    return true
  })

  const totalEarned = transactions
    .filter(t => t.points > 0)
    .reduce((sum, t) => sum + t.points, 0)
  
  const totalSpent = Math.abs(transactions
    .filter(t => t.points < 0)
    .reduce((sum, t) => sum + t.points, 0))

  if (compact) {
    return (
      <div className={cn('flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200', className)}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <Leaf className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <div className="font-semibold text-green-800">
              {isLoading ? (
                <Skeleton className="h-4 w-16" />
              ) : (
                `${formatPoints(balance)} GP`
              )}
            </div>
            <div className="text-xs text-green-600">Green Points</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <Leaf className="w-4 h-4 text-green-600" />
          </div>
          Green Points Balance
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Balance Display */}
        <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
          {isLoading ? (
            <Skeleton className="h-12 w-32 mx-auto mb-2" />
          ) : (
            <div className="text-4xl font-bold text-green-800 mb-2">
              {formatPoints(balance)}
              <span className="text-lg font-normal text-green-600 ml-2">GP</span>
            </div>
          )}
          <p className="text-green-600 text-sm">Available Green Points</p>
        </div>

        {/* Stats */}
        {!isLoading && transactions.length > 0 && (
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span className="font-semibold text-blue-800">{formatPoints(totalEarned)}</span>
              </div>
              <p className="text-xs text-blue-600">Total Earned</p>
            </div>
            
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendingDown className="w-4 h-4 text-red-600" />
                <span className="font-semibold text-red-800">{formatPoints(totalSpent)}</span>
              </div>
              <p className="text-xs text-red-600">Total Spent</p>
            </div>
          </div>
        )}

        {/* Transaction History */}
        {showTransactions && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold flex items-center gap-2">
                <History className="w-4 h-4" />
                Recent Activity
              </h4>
              {transactions.length > 5 && (
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              )}
            </div>

            {isLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-32 mb-1" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            ) : transactions.length > 0 ? (
              <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="earned">Earned</TabsTrigger>
                  <TabsTrigger value="spent">Spent</TabsTrigger>
                </TabsList>
                
                <TabsContent value={selectedTab} className="mt-3">
                  <ScrollArea className="h-64">
                    <div className="space-y-2">
                      {filteredTransactions.slice(0, 10).map((transaction) => {
                        const config = ACTION_TYPE_CONFIG[transaction.action_type as keyof typeof ACTION_TYPE_CONFIG] || {
                          icon: '📋',
                          color: 'text-gray-600',
                          label: transaction.action_type
                        }
                        
                        return (
                          <div key={transaction.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm">
                              {config.icon}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm truncate">
                                  {config.label}
                                </span>
                                {transaction.points > 0 ? (
                                  <Plus className="w-3 h-3 text-green-600" />
                                ) : (
                                  <Minus className="w-3 h-3 text-red-600" />
                                )}
                              </div>
                              <p className="text-xs text-gray-500 truncate">
                                {transaction.description}
                              </p>
                              <p className="text-xs text-gray-400">
                                {formatDate(transaction.created_at)}
                              </p>
                            </div>
                            
                            <div className="text-right">
                              <div className={cn(
                                'font-semibold',
                                transaction.points > 0 ? 'text-green-600' : 'text-red-600'
                              )}>
                                {transaction.points > 0 ? '+' : ''}{formatPoints(transaction.points)}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <History className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">No transactions yet</p>
                <p className="text-xs">Start earning points by engaging with the platform!</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Simple balance widget for headers/navbars
export function GreenPointsWidget({ 
  balance = 0, 
  isLoading = false,
  onClick,
  className 
}: { 
  balance?: number
  isLoading?: boolean
  onClick?: () => void
  className?: string 
}) {
  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={onClick}
      className={cn('flex items-center gap-2 h-8 px-3', className)}
    >
      <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
        <Leaf className="w-3 h-3 text-green-600" />
      </div>
      {isLoading ? (
        <Skeleton className="h-4 w-12" />
      ) : (
        <span className="font-medium text-green-800">
          {formatPoints(balance)} GP
        </span>
      )}
    </Button>
  )
}