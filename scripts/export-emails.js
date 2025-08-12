// Node.js script to export user emails from Supabase to CSV
// Run with: node scripts/export-emails.js

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

// Initialize Supabase client with service role key for admin access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // This key has admin privileges
);

async function exportUserEmails() {
  try {
    console.log('🔄 Fetching user emails from Supabase...');
    
    // Query the user_emails_export view
    const { data, error } = await supabase
      .from('user_emails_export')
      .select('*')
      .order('user_registered_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching emails:', error.message);
      return;
    }

    if (!data || data.length === 0) {
      console.log('⚠️  No user emails found.');
      return;
    }

    console.log(`✅ Found ${data.length} user emails`);

    // Convert to CSV format
    const csvHeader = 'Email,Email Status,Registration Date,Email Confirmed At\n';
    const csvRows = data.map(row => {
      const email = row.email || '';
      const status = row.email_status || 'pending';
      const registeredAt = row.user_registered_at ? new Date(row.user_registered_at).toISOString() : '';
      const confirmedAt = row.email_confirmed_at ? new Date(row.email_confirmed_at).toISOString() : '';
      
      return `"${email}","${status}","${registeredAt}","${confirmedAt}"`;
    }).join('\n');

    const csvContent = csvHeader + csvRows;

    // Create exports directory if it doesn't exist
    const exportsDir = path.join(__dirname, '..', 'exports');
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const filename = `user-emails-${timestamp}.csv`;
    const filepath = path.join(exportsDir, filename);

    // Write CSV file
    fs.writeFileSync(filepath, csvContent, 'utf8');
    
    console.log(`📁 Emails exported to: ${filepath}`);
    console.log(`📊 Total emails exported: ${data.length}`);
    
    // Show summary statistics
    const confirmedEmails = data.filter(row => row.email_status === 'confirmed').length;
    const pendingEmails = data.filter(row => row.email_status === 'pending').length;
    
    console.log(`\n📈 Summary:`);
    console.log(`   Confirmed emails: ${confirmedEmails}`);
    console.log(`   Pending emails: ${pendingEmails}`);
    console.log(`   Total emails: ${data.length}`);

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

// Export specific email lists
async function exportConfirmedEmails() {
  try {
    console.log('🔄 Fetching confirmed emails only...');
    
    const { data, error } = await supabase
      .from('user_emails_export')
      .select('email')
      .eq('email_status', 'confirmed')
      .order('user_registered_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching confirmed emails:', error.message);
      return;
    }

    if (!data || data.length === 0) {
      console.log('⚠️  No confirmed emails found.');
      return;
    }

    // Simple email list (one per line)
    const emailList = data.map(row => row.email).join('\n');
    
    const exportsDir = path.join(__dirname, '..', 'exports');
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const filename = `confirmed-emails-${timestamp}.txt`;
    const filepath = path.join(exportsDir, filename);

    fs.writeFileSync(filepath, emailList, 'utf8');
    
    console.log(`📁 Confirmed emails exported to: ${filepath}`);
    console.log(`📊 Total confirmed emails: ${data.length}`);

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--confirmed-only')) {
    await exportConfirmedEmails();
  } else {
    await exportUserEmails();
  }
}

// Check if required environment variables are set
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  console.error('\nPlease add these to your .env.local file.');
  process.exit(1);
}

// Run the script
main().catch(console.error);

// Export functions for potential reuse
module.exports = {
  exportUserEmails,
  exportConfirmedEmails
};