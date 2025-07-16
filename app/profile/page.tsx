"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "@supabase/auth-helpers-react"

export default function ProfilePage() {
  const session = useSession()
  const router = useRouter()

  useEffect(() => {
    const handleProfileRedirect = async () => {
      if (!session?.user) return
      
      // First check if user has username in metadata
      if (session.user.user_metadata?.username) {
        router.replace(`/profile/${session.user.user_metadata.username}`)
        return
      }
      
      // If no username in metadata, check database
      try {
        const response = await fetch('/api/profiles/current')
        if (response.ok) {
          const data = await response.json()
          if (data.profile?.username) {
            router.replace(`/profile/${data.profile.username}`)
            return
          }
        }
      } catch (error) {
        console.error('Error fetching profile:', error)
      }
      
      // If no profile or username found, redirect to settings
      router.replace("/settings")
    }
    
    handleProfileRedirect()
  }, [session, router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Loading profile...</p>
      </div>
    </div>
  )
}
