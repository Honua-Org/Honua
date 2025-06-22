import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/test-connection - Test Supabase connection
export async function GET(request: NextRequest) {
  try {
    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    console.log('Environment check:')
    console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing')
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Set' : 'Missing')
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({
        success: false,
        error: 'Missing Supabase environment variables',
        details: {
          url: supabaseUrl ? 'Set' : 'Missing',
          anonKey: supabaseAnonKey ? 'Set' : 'Missing'
        }
      }, { status: 500 })
    }

    // Test Supabase client creation
    const supabase = createRouteHandlerClient({ cookies })
    
    // Test basic connection
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('Supabase connection test failed:', error)
      return NextResponse.json({
        success: false,
        error: 'Supabase connection failed',
        details: {
          message: error.message,
          code: error.code,
          hint: error.hint
        }
      }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      message: 'Supabase connection successful',
      environment: {
        url: supabaseUrl ? 'Configured' : 'Missing',
        anonKey: supabaseAnonKey ? 'Configured' : 'Missing'
      }
    })
    
  } catch (error) {
    console.error('Connection test error:', error)
    return NextResponse.json({
      success: false,
      error: 'Connection test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}