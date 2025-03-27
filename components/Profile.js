import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function Profile({ user }) {
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    getProfile()
  }, [user])

  const getProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error
      setProfile(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  return (
    <div>
      {profile ? (
        <div>
          <h2>Welcome, {profile.username}!</h2>
          <p>Email: {profile.email}</p>
        </div>
      ) : (
        <div>Loading...</div>
      )}
    </div>
  )
}