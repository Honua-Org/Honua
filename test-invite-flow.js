const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables from .env.local
const envPath = path.join(__dirname, '.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  const envLines = envContent.split('\n')
  
  envLines.forEach(line => {
    const [key, ...valueParts] = line.split('=')
    if (key && valueParts.length > 0) {
      let value = valueParts.join('=').trim()
      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1)
      }
      process.env[key.trim()] = value
    }
  })
}

console.log('Environment variables loaded:')
console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log('Service key exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testInviteFlow() {
  try {
    console.log('🔍 Testing invite acceptance flow...')
    
    // Get all invites
    const { data: invites, error: invitesError } = await supabase
      .from('invites')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (invitesError) {
      console.error('Error fetching invites:', invitesError)
      return
    }
    
    console.log(`\n📊 Found ${invites.length} invite(s):`)    
    invites.forEach((invite, index) => {
      console.log(`${index + 1}. Code: ${invite.invite_code}`);
      console.log(`   Inviter ID: ${invite.inviter_id}`);
      console.log(`   Invited User ID: ${invite.invited_user_id || 'None'}`);
      console.log(`   Active: ${invite.is_active}`);
      console.log(`   Used: ${invite.is_used}`);
      console.log(`   Created: ${invite.created_at}`);
      console.log(`   Used At: ${invite.used_at || 'Never'}`);
      console.log('---');
    });
    
    // Check invite stats for each inviter
    const inviterIds = [...new Set(invites.map(invite => invite.inviter_id))]
    
    for (const inviterId of inviterIds) {
      const { count: usedCount } = await supabase
        .from('invites')
        .select('*', { count: 'exact', head: true })
        .eq('inviter_id', inviterId)
        .eq('is_used', true)
      
      console.log(`\n👤 Inviter ${inviterId}:`);
      console.log(`   Used invites count: ${usedCount || 0}`);
    }
    
    // Check if there are any profiles that might be missing
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, username, full_name')
      .limit(5)
    
    if (!profilesError && profiles) {
      console.log(`\n👥 Sample profiles (${profiles.length}):`);
      profiles.forEach(profile => {
        console.log(`   ${profile.id}: ${profile.username} (${profile.full_name})`);
      });
    }
    
  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

testInviteFlow()