import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    
    if (!query || query.length < 1) {
      return NextResponse.json({ users: [] })
    }

    // Search for users by username or full_name
    const { data: users, error } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url, verified')
      .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
      .limit(10)
      .order('username')

    if (error) {
      console.error('Error searching users:', error)
      return NextResponse.json({ error: 'Failed to search users' }, { status: 500 })
    }

    return NextResponse.json({ users: users || [] })
  } catch (error) {
    console.error('Error in user search:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}