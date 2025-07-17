import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    const { searchParams } = new URL(request.url)
    const username = searchParams.get('username')
    
    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 })
    }
    
    // Get user profile by username
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .single()
    
    if (error) {
      console.error('Error fetching profile:', error)
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }
    
    return NextResponse.json({ profile })
  } catch (error) {
    console.error('Error in GET /api/profiles:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await request.json()
    // Only update fields provided in the request body
    const updateFields: any = { updated_at: new Date().toISOString() }
    if (body.full_name !== undefined) updateFields.full_name = body.full_name
    if (body.username !== undefined) updateFields.username = body.username
    if (body.bio !== undefined) updateFields.bio = body.bio
    if (body.location !== undefined) updateFields.location = body.location
    if (body.website !== undefined) updateFields.website = body.website
    if (body.avatar_url !== undefined) updateFields.avatar_url = body.avatar_url
    if (body.cover_url !== undefined) updateFields.cover_url = body.cover_url

    // If username is being changed, check if it's already taken (excluding current user)
    if (body.username) {
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', body.username)
        .neq('id', user.id)
        .single()
      if (existingUser) {
        return NextResponse.json({ error: 'Username is already taken' }, { status: 409 })
      }
    }

    // Update the profile with only provided fields
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update(updateFields)
      .eq('id', user.id)
      .select()
      .single()
    
    if (updateError) {
      console.error('Error updating profile:', updateError)
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }
    
    return NextResponse.json({ profile: updatedProfile })
  } catch (error) {
    console.error('Error in PUT /api/profiles:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}