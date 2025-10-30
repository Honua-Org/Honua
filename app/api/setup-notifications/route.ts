import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

// POST /api/setup-notifications - Create notifications table if it doesn't exist
export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        success: false,
        error: 'Missing Supabase configuration'
      }, { status: 500 })
    }
    
    // Use service role key for admin operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // First check if table already exists
    const { data: existingTable, error: checkError } = await supabase
      .from('notifications')
      .select('count')
      .limit(1)
    
    if (!checkError) {
      return NextResponse.json({
        success: true,
        message: 'Notifications table already exists'
      })
    }
    
    // If table doesn't exist, try to create it using direct SQL execution
    try {
      // Read the migration file
      const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', 'create_notifications_table.sql')
      
      if (!fs.existsSync(migrationPath)) {
        return NextResponse.json({
          success: false,
          error: 'Migration file not found. Please ensure the notifications migration file exists.'
        }, { status: 500 })
      }
      
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
      
      // Execute the migration using a simple approach
      // Split the SQL into individual statements and execute them
      const statements = migrationSQL
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
      
      for (const statement of statements) {
        if (statement.trim()) {
          try {
            await supabase.rpc('exec', { sql: statement + ';' })
          } catch (stmtError) {
            // Try alternative method if exec RPC doesn't work
            console.log('exec RPC failed, trying direct table creation...')
            break
          }
        }
      }
      
    } catch (migrationError) {
      console.error('Migration execution failed:', migrationError)
      
      // Fallback: Create table directly using basic operations
      try {
        // Create the basic table structure
        const createTableResult = await supabase.rpc('create_notifications_table_basic')
        
        if (createTableResult.error) {
          // Final fallback - return instructions for manual setup
          return NextResponse.json({
            success: false,
            error: 'Unable to create notifications table automatically',
            instructions: 'Please run the migration file manually in your Supabase SQL editor: supabase/migrations/create_notifications_table.sql'
          }, { status: 500 })
        }
      } catch (fallbackError) {
        return NextResponse.json({
          success: false,
          error: 'Unable to create notifications table automatically',
          instructions: 'Please run the migration file manually in your Supabase SQL editor: supabase/migrations/create_notifications_table.sql',
          details: fallbackError instanceof Error ? fallbackError.message : 'Unknown error'
        }, { status: 500 })
      }
    }
    
    // Test if the table was created successfully
    const { data: testData, error: testError } = await supabase
      .from('notifications')
      .select('count')
      .limit(1)
    
    if (testError) {
      console.error('Error testing notifications table:', testError)
      return NextResponse.json({
        success: false,
        error: 'Failed to verify notifications table creation',
        details: testError.message,
        instructions: 'Please run the migration file manually in your Supabase SQL editor: supabase/migrations/create_notifications_table.sql'
      }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      message: 'Notifications table created successfully'
    })
    
  } catch (error) {
    console.error('Error in setup-notifications:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      instructions: 'Please run the migration file manually in your Supabase SQL editor: supabase/migrations/create_notifications_table.sql'
    }, { status: 500 })
  }
}

// GET /api/setup-notifications - Check if notifications table exists
export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        exists: false,
        error: 'Missing Supabase configuration'
      }, { status: 500 })
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Try to query the notifications table
    const { data, error } = await supabase
      .from('notifications')
      .select('count')
      .limit(1)
    
    if (error) {
      // Check if the error is because the table doesn't exist
      if (error.message.includes('relation "notifications" does not exist') || 
          error.message.includes('table "notifications" does not exist')) {
        return NextResponse.json({
          exists: false,
          message: 'Notifications table does not exist'
        })
      }
      
      return NextResponse.json({
        exists: false,
        error: 'Error checking notifications table',
        details: error.message
      }, { status: 500 })
    }
    
    return NextResponse.json({
      exists: true,
      message: 'Notifications table exists'
    })
    
  } catch (error) {
    console.error('Error checking notifications table:', error)
    return NextResponse.json({
      exists: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}