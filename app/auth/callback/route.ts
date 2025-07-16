import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")

  if (code) {
    const supabase = createRouteHandlerClient({ cookies })
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    // If authentication successful and user exists, ensure profile exists
    if (!error && data.user) {
      try {
        // Check if profile already exists
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', data.user.id)
          .single()
        
        // If no profile exists, create one
        if (!existingProfile) {
          const userData = data.user.user_metadata || {}
          const email = data.user.email || ''
          
          // Generate username from email if not provided
          let username = userData.username || userData.full_name?.toLowerCase().replace(/\s+/g, '') || email.split('@')[0]
          
          // Ensure username is unique
          let uniqueUsername = username
          let counter = 1
          while (true) {
            const { data: existingUser } = await supabase
              .from('profiles')
              .select('username')
              .eq('username', uniqueUsername)
              .single()
            
            if (!existingUser) break
            uniqueUsername = `${username}${counter}`
            counter++
          }
          
          // Create profile
          await supabase.from('profiles').insert({
            id: data.user.id,
            full_name: userData.full_name || userData.name || email.split('@')[0],
            username: uniqueUsername,
            avatar_url: userData.avatar_url || userData.picture || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          
          // Update user metadata with username
          await supabase.auth.updateUser({
            data: {
              ...userData,
              username: uniqueUsername,
              full_name: userData.full_name || userData.name || email.split('@')[0]
            }
          })
        }
      } catch (profileError) {
        console.error('Error creating profile:', profileError)
      }
    }
  }

  return NextResponse.redirect(requestUrl.origin)
}
