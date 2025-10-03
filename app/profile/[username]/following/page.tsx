"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, UserPlus, UserMinus, Loader2 } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { toast } from "sonner"

interface User {
  id: string
  username: string
  full_name: string
  avatar_url?: string
  bio?: string
  verified?: boolean
  followers_count?: number
  following_count?: number
}

interface FollowRelation {
  following: User
  created_at: string
}

export default function FollowingPage() {
  const params = useParams()
  const router = useRouter()
  const username = params.username as string
  const [following, setFollowing] = useState<FollowRelation[]>([])
  const [profileUser, setProfileUser] = useState<User | null>(null)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [followingStatus, setFollowingStatus] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({})
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchData()
  }, [username])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: currentUserData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        setCurrentUser(currentUserData)
      }

      // Get profile user
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single()

      if (profileError) {
        throw new Error('Profile not found')
      }
      setProfileUser(profileData)

      // Get following with user details
      const { data: followingData, error: followingError } = await supabase
        .from('follows')
        .select(`
          created_at,
          following:following_id(
            id,
            username,
            full_name,
            avatar_url,
            bio,
            verified,
            followers_count,
            following_count
          )
        `)
        .eq('follower_id', profileData.id)
        .order('created_at', { ascending: false })

      if (followingError) {
        throw new Error('Failed to fetch following')
      }

      // Transform the data to match FollowRelation interface
      const transformedData = followingData?.map(item => {
        const following = Array.isArray(item.following) ? item.following[0] : item.following
        return {
          created_at: item.created_at,
          following
        }
      }).filter(item => item.following && typeof item.following === 'object' && item.following.id) || []
      setFollowing(transformedData)

      // Get current user's following status for each user
      if (user && followingData) {
        const followingIds = followingData
          .map(f => {
            const following = f.following as User | User[]
            if (Array.isArray(following) && following.length > 0) {
              return following[0]?.id
            }
            return (following as User)?.id
          })
          .filter((id): id is string => Boolean(id))
        const { data: currentFollowingData } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', user.id)
          .in('following_id', followingIds)

        const followingMap: Record<string, boolean> = {}
        currentFollowingData?.forEach(f => {
          followingMap[f.following_id] = true
        })
        setFollowingStatus(followingMap)
      }
    } catch (err) {
      console.error('Error fetching following:', err)
      setError(err instanceof Error ? err.message : 'Failed to load following')
    } finally {
      setLoading(false)
    }
  }

  const handleFollow = async (userId: string, isCurrentlyFollowing: boolean) => {
    if (!currentUser) {
      toast.error('Please log in to follow users')
      return
    }

    setActionLoading(prev => ({ ...prev, [userId]: true }))

    try {
      if (isCurrentlyFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', currentUser.id)
          .eq('following_id', userId)

        if (error) throw error

        setFollowingStatus(prev => ({ ...prev, [userId]: false }))
        toast.success('Unfollowed successfully')
      } else {
        // Follow
        const { error } = await supabase
          .from('follows')
          .insert({
            follower_id: currentUser.id,
            following_id: userId
          })

        if (error) throw error

        setFollowingStatus(prev => ({ ...prev, [userId]: true }))
        toast.success('Following successfully')
      }
    } catch (err) {
      console.error('Error updating follow status:', err)
      toast.error('Failed to update follow status')
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: false }))
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-green-600" />
            <span className="ml-2 text-gray-600 dark:text-gray-400">Loading following...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Error</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <Button onClick={() => router.back()} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {profileUser?.full_name} is Following
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {following.length} {following.length === 1 ? 'person' : 'people'}
            </p>
          </div>
        </div>

        {/* Following List */}
        {following.length > 0 ? (
          <div className="space-y-4">
            {following.map((relation) => {
              const user = relation.following
              const isFollowing = followingStatus[user.id] || false
              const isOwnProfile = currentUser?.id === user.id
              const isLoading = actionLoading[user.id] || false

              return (
                <Card key={user.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Link href={`/profile/${user.username}`}>
                          <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 cursor-pointer hover:opacity-80 transition-opacity">
                            {user.avatar_url ? (
                              <Image
                                src={user.avatar_url}
                                alt={user.full_name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400 font-semibold">
                                {user.full_name.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                        </Link>
                        <div className="flex-1 min-w-0">
                          <Link href={`/profile/${user.username}`}>
                            <div className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity">
                              <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                                {user.full_name}
                              </h3>
                              {user.verified && (
                                <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                  <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              )}
                            </div>
                          </Link>
                          <p className="text-gray-600 dark:text-gray-400 text-sm">@{user.username}</p>
                          {user.bio && (
                            <p className="text-gray-700 dark:text-gray-300 text-sm mt-1 line-clamp-2">
                              {user.bio}
                            </p>
                          )}
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                            <span>{(user.followers_count || 0).toLocaleString()} followers</span>
                            <span>{(user.following_count || 0).toLocaleString()} following</span>
                          </div>
                        </div>
                      </div>
                      {currentUser && !isOwnProfile && (
                        <Button
                          onClick={() => handleFollow(user.id, isFollowing)}
                          disabled={isLoading}
                          className={`ml-4 ${isFollowing ? 'bg-gray-200 text-gray-800 hover:bg-gray-300' : 'sustainability-gradient'}`}
                          size="sm"
                        >
                          {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : isFollowing ? (
                            <>
                              <UserMinus className="w-4 h-4 mr-2" />
                              Unfollow
                            </>
                          ) : (
                            <>
                              <UserPlus className="w-4 h-4 mr-2" />
                              Follow
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Not following anyone</h3>
            <p className="text-gray-600 dark:text-gray-400">
              {profileUser?.full_name} isn't following anyone yet.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}