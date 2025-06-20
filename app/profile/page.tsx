"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "@supabase/auth-helpers-react"

export default function ProfilePage() {
  const session = useSession()
  const router = useRouter()

  useEffect(() => {
    if (session?.user?.user_metadata?.username) {
      router.replace(`/profile/${session.user.user_metadata.username}`)
    } else if (session?.user) {
      // If user doesn't have username, redirect to settings to complete profile
      router.replace("/settings")
    }
  }, [session, router])

  return null
}
