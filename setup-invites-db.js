const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Read environment variables from .env.local
function loadEnvFile() {
  try {
    const envPath = path.join(__dirname, '.env.local')
    const envContent = fs.readFileSync(envPath, 'utf8')
    
    envContent.split('\n').forEach(line => {
      const trimmedLine = line.trim()
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=')
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').replace(/^"|"$/g, '') // Remove quotes
          process.env[key] = value
        }
      }
    })
  } catch (error) {
    console.log('Could not load .env.local file')
  }
}

loadEnvFile()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupInvitesTable() {
  try {
    console.log('Setting up invites table...')
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'scripts', 'create-invites-table.sql')
    const sql = fs.readFileSync(sqlPath, 'utf8')
    
    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    console.log(`Executing ${statements.length} SQL statements...`)
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement.trim()) {
        try {
          console.log(`Executing statement ${i + 1}/${statements.length}...`)
          const { error } = await supabase.rpc('exec_sql', { sql: statement })
          
          if (error) {
            console.error(`Error in statement ${i + 1}:`, error)
            // Continue with other statements
          } else {
            console.log(`✓ Statement ${i + 1} executed successfully`)
          }
        } catch (err) {
          console.error(`Error executing statement ${i + 1}:`, err.message)
        }
      }
    }
    
    console.log('\n✅ Invites table setup completed!')
    console.log('\nIf you see any errors above, you may need to run the SQL manually in Supabase SQL Editor:')
    console.log('1. Go to your Supabase dashboard')
    console.log('2. Navigate to SQL Editor')
    console.log('3. Copy and paste the contents of scripts/create-invites-table.sql')
    console.log('4. Run the SQL')
    
  } catch (error) {
    console.error('Error setting up invites table:', error)
    console.log('\nFallback: Please run the SQL manually in Supabase SQL Editor:')
    console.log('1. Go to your Supabase dashboard')
    console.log('2. Navigate to SQL Editor')
    console.log('3. Copy and paste the contents of scripts/create-invites-table.sql')
    console.log('4. Run the SQL')
  }
}

setupInvitesTable()