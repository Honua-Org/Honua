'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface ReputationLevel {
  level_name: string
  badge_color: string
  badge_icon: string
  description: string
  benefits: any
}

interface ReputationBadgeProps {
  reputation: number
  level?: ReputationLevel
  size?: 'sm' | 'md' | 'lg'
  showTooltip?: boolean
  className?: string
}

const getReputationLevel = (reputation: number): ReputationLevel => {
  if (reputation >= 901) {
    return {
      level_name: 'Sustainability Leader',
      badge_color: '#F59E0B',
      badge_icon: '👑',
      description: 'Top-tier community leader driving real change.',
      benefits: { features: ['All features', 'Leadership badge', 'Priority support'] }
    }
  } else if (reputation >= 601) {
    return {
      level_name: 'Community Expert',
      badge_color: '#8B5CF6',
      badge_icon: '🏆',
      description: 'Recognized expert in sustainability topics.',
      benefits: { features: ['Mentor others', 'Verify tasks', 'Expert badge'] }
    }
  } else if (reputation >= 301) {
    return {
      level_name: 'Trusted Member',
      badge_color: '#3B82F6',
      badge_icon: '🌳',
      description: 'Established community member with proven engagement.',
      benefits: { features: ['Moderate comments', 'Create events', 'Advanced tasks'] }
    }
  } else if (reputation >= 101) {
    return {
      level_name: 'Active Contributor',
      badge_color: '#10B981',
      badge_icon: '🌿',
      description: 'Regular participant making positive contributions.',
      benefits: { features: ['Create polls', 'Join forums', 'Basic task access'] }
    }
  } else {
    return {
      level_name: 'New Member',
      badge_color: '#6B7280',
      badge_icon: '🌱',
      description: 'Welcome to the community! Start your sustainability journey.',
      benefits: { features: ['Basic posting', 'Comment on posts', 'Like posts'] }
    }
  }
}

const ReputationBadge: React.FC<ReputationBadgeProps> = ({
  reputation,
  level,
  size = 'md',
  showTooltip = true,
  className
}) => {
  const reputationLevel = level || getReputationLevel(reputation)
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2'
  }

  const iconSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }

  return (
    <div className="relative group">
      <div
        className={cn(
          'inline-flex items-center gap-2 rounded-full font-medium text-white transition-all duration-200 hover:scale-105',
          sizeClasses[size],
          className
        )}
        style={{ backgroundColor: reputationLevel.badge_color }}
      >
        <span className={iconSizes[size]}>{reputationLevel.badge_icon}</span>

        <span className="hidden sm:inline">{reputationLevel.level_name}</span>
      </div>
      
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 whitespace-nowrap">
          <div className="font-semibold">{reputationLevel.level_name}</div>
          <div className="text-gray-300">{reputationLevel.description}</div>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  )
}

export default ReputationBadge
export type { ReputationLevel, ReputationBadgeProps }