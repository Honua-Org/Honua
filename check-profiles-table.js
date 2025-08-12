const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
const envPath = path.join(__dirname, '.env.local')
const envContent = fs.readFileSync(envPath, 'utf8')
const envVars = {}

envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=')
  if (key && valueParts.length) {
    envVars[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '')
  }
})

const supabase = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.SUPABASE_SERVICE_ROLE_KEY
)

async function checkProfilesTable() {
  console.log('📋 Checking profiles table structure...')
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1)
    
    if (error) {
      console.error('❌ Error:', error)
      return
    }
    
    if (data && data.length > 0) {
      console.log('✅ Profiles table columns:', Object.keys(data[0]))
      console.log('Sample data:', JSON.stringify(data[0], null, 2))
    } else {
      console.log('⚠️ No profile records found')
    }
    
  } catch (err) {
    console.error('❌ Error checking profiles table:', err)
  }
}

checkProfilesTable()