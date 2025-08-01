"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useSession } from "@supabase/auth-helpers-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { UserPlus, Award, Leaf, Users, ArrowRight, CheckCircle } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface InviterProfile {
  id: string
  username: string
  full_name: string
  avatar_url: string | null
  bio: string | null
}

export default function InvitePage() {
  const params = useParams()
  const router = useRouter()
  const session = useSession()
  const supabase = createClientComponentClient()
  const [inviterProfile, setInviterProfile] = useState<InviterProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const inviteCode = params.code as string

  useEffect(() => {
    const fetchInviterProfile = async () => {
      if (!inviteCode) {
        setError("Invalid invite link")
        setLoading(false)
        return
      }

      try {
        // Try to find user by username first, then by user ID
        let { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url, bio')
          .eq('username', inviteCode)
          .single()

        // If not found by username, try by user ID (first 8 characters)
        if (profileError || !profile) {
          const { data: profiles, error: idError } = await supabase
            .from('profiles')
            .select('id, username, full_name, avatar_url, bio')
            .ilike('id', `${inviteCode}%`)
            .limit(1)

          if (!idError && profiles && profiles.length > 0) {
            profile = profiles[0]
          } else {
            setError("Invite link not found or expired")
            setLoading(false)
            return
          }
        }

        setInviterProfile(profile)
      } catch (err) {
        console.error('Error fetching inviter profile:', err)
        setError("Failed to load invite information")
      } finally {
        setLoading(false)
      }
    }

    fetchInviterProfile()
  }, [inviteCode, supabase])

  // If user is already logged in, redirect to home
  useEffect(() => {
    if (session?.user) {
      router.push('/')
    }
  }, [session, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  if (error || !inviterProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserPlus className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Invalid Invite Link
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {error || "This invite link is not valid or has expired."}
            </p>
            <Link href="/auth/signup">
              <Button className="w-full">
                Sign Up Anyway
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-3">
            <Image
              src="/images/honua-logo.svg"
              alt="Honua"
              width={32}
              height={32}
              className="w-8 h-8"
            />
            <span className="text-xl font-bold text-gray-900 dark:text-gray-100">Honua</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] p-4">
        <div className="w-full max-w-2xl space-y-6">
          {/* Welcome Card */}
          <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader className="text-center pb-4">
              <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserPlus className="w-10 h-10 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                You're Invited to Join Honua!
              </CardTitle>
              <p className="text-gray-600 dark:text-gray-400">
                Join the community making a positive impact on our planet
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Inviter Profile */}
              <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg p-6">
                <div className="flex items-center space-x-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={inviterProfile.avatar_url || undefined} alt={inviterProfile.full_name} />
                    <AvatarFallback className="bg-green-500 text-white text-lg">
                      {inviterProfile.full_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {inviterProfile.full_name}
                    </h3>
                    <p className="text-green-600 dark:text-green-400 font-medium">
                      @{inviterProfile.username}
                    </p>
                    {inviterProfile.bio && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {inviterProfile.bio}
                      </p>
                    )}
                  </div>
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    Inviter
                  </Badge>
                </div>
              </div>

              {/* Benefits */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Leaf className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                    Make Impact
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Join sustainability challenges
                  </p>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                    Connect
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Meet like-minded people
                  </p>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Award className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                    Earn Rewards
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Complete tasks for points
                  </p>
                </div>
              </div>

              {/* Bonus */}
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                      Welcome Bonus
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Get 50 bonus points when you complete your first task!
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href={`/auth/signup?ref=${inviteCode}`} className="flex-1">
                  <Button className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white">
                    Join Honua
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Link href="/auth/login" className="flex-1">
                  <Button variant="outline" className="w-full">
                    Already have an account?
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            <p>
              By joining Honua, you agree to our{" "}
              <Link href="/terms" className="text-green-600 hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-green-600 hover:underline">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}