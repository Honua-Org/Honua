const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Read and parse environment variables
const envContent = fs.readFileSync('.env.local', 'utf8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    let value = valueParts.join('=').trim();
    // Remove quotes if present
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    envVars[key.trim()] = value;
  }
});

console.log('Environment variables loaded:');
console.log('URL:', envVars.NEXT_PUBLIC_SUPABASE_URL);
console.log('Service key exists:', !!envVars.SUPABASE_SERVICE_ROLE_KEY);

if (!envVars.NEXT_PUBLIC_SUPABASE_URL || !envVars.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.SUPABASE_SERVICE_ROLE_KEY
);

async function checkInvitesTable() {
  try {
    console.log('\nChecking if invites table exists...');
    
    // Try to query the invites table
    const { data, error } = await supabase
      .from('invites')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('Error querying invites table:', error.message);
      if (error.message.includes('relation "public.invites" does not exist')) {
        console.log('\n❌ The invites table does not exist in the database.');
        console.log('\n🔧 To fix this, you need to:');
        console.log('1. Go to your Supabase project dashboard');
        console.log('2. Navigate to SQL Editor');
        console.log('3. Copy and paste the contents of scripts/create-invites-table.sql');
        console.log('4. Run the SQL script');
        console.log('\nAlternatively, check SETUP_INSTRUCTIONS.md for detailed steps.');
      }
      return;
    }
    
    console.log('✅ Invites table exists!');
    
    // Check if there are any invites
    const { data: invites, error: countError } = await supabase
      .from('invites')
      .select('*')
      .limit(5);
    
    if (countError) {
      console.error('Error counting invites:', countError.message);
      return;
    }
    
    console.log(`📊 Found ${invites.length} invite(s) in the table`);
    
    if (invites.length > 0) {
      console.log('\nSample invites:');
      invites.forEach((invite, index) => {
        console.log(`${index + 1}. Code: ${invite.invite_code}, Active: ${invite.is_active}, Used: ${invite.is_used}`);
      });
    } else {
      console.log('\n💡 No invites found. Try generating an invite first by:');
      console.log('1. Starting the development server: npm run dev');
      console.log('2. Opening the app and clicking the "Invite Friends" button');
      console.log('3. This should generate an invite code');
    }
    
  } catch (error) {
    console.error('Unexpected error:', error.message);
  }
}

checkInvitesTable();