import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function RealtimeProfile({ userId }) {
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    // Initial fetch
    getProfile()

    // Set up real-time subscription
    const subscription = supabase
      .from('profiles')
      .on('UPDATE', payload => {
        if (payload.new.id === userId) {
          setProfile(payload.new)
        }
      })
      .subscribe()

    return () => {
      supabase.removeSubscription(subscription)
    }
  }, [userId])
}
