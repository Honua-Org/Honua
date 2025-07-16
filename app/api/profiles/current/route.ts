import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch the user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error fetching profile:', profileError)
      return NextResponse.json(
        { error: 'Database error', profile: null },
        { status: 500 }
      )
    }

    if (!profile) {
      // Profile doesn't exist, create one
      const userMetadata = session.user.user_metadata || {}
      const username = userMetadata.username || 
                      userMetadata.full_name?.toLowerCase().replace(/\s+/g, '') || 
                      session.user.email?.split('@')[0] || 
                      `user_${session.user.id.slice(0, 8)}`
      
      // Ensure username is unique
      let uniqueUsername = username
      let counter = 1
      while (true) {
        const { data: existingUser } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', uniqueUsername)
          .single()
        
        if (!existingUser) break
        uniqueUsername = `${username}${counter}`
        counter++
      }

      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: session.user.id,
          full_name: userMetadata.full_name || userMetadata.name || session.user.email?.split('@')[0] || 'User',
          username: uniqueUsername,
          avatar_url: userMetadata.avatar_url || userMetadata.picture || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (createError) {
        console.error('Error creating profile:', createError)
        return NextResponse.json(
          { error: 'Failed to create profile', profile: null },
          { status: 500 }
        )
      }

      // Update user metadata
      await supabase.auth.updateUser({
        data: {
          username: uniqueUsername,
          full_name: userMetadata.full_name || userMetadata.name || session.user.email?.split('@')[0] || 'User'
        }
      })

      return NextResponse.json({ profile: newProfile })
    }

    return NextResponse.json({ profile })
  } catch (error) {
    console.error('Error in /api/profiles/current:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}