const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length) {
    envVars[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
  }
});

const supabase = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTableStructure() {
  const tables = [
    'marketplace_orders',
    'marketplace_products',
    'marketplace_stock_movements'
  ];

  for (const table of tables) {
    console.log(`\n📋 Checking ${table} table structure...`);
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (error) {
        console.error(`❌ Error querying ${table}:`, error);
        continue;
      }

      if (data && data.length > 0) {
        console.log(`✅ Sample ${table} record structure:`);
        console.log('Columns:', Object.keys(data[0]));
        console.log('Sample data:', JSON.stringify(data[0], null, 2));
      } else {
        console.log(`⚠️ No records found in ${table}.`);
        console.log('ℹ️ Unable to infer columns without data.');
      }
    } catch (err) {
      console.error(`❌ Error checking ${table} table structure:`, err);
    }
  }

  console.log('\n🔎 Checking existence of RPC: check_stock_availability...');
  try {
    const { data, error } = await supabase
      .rpc('check_stock_availability', { p_product_id: 'test-id', p_quantity: 1 });
    if (error) {
      console.log('⚠️ RPC call returned error (this may be expected with dummy data):', error.message);
      console.log('➡️ Function likely exists if error is about product not found or invalid input.');
    } else {
      console.log('✅ RPC function responded:', data);
    }
  } catch (err) {
    console.error('❌ RPC check failed. Function may not exist:', err.message || err);
  }
}

checkTableStructure();