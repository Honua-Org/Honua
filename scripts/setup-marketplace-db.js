const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupMarketplaceDatabase() {
  try {
    console.log('Setting up marketplace database schema...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'create-marketplace-schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`Executing ${statements.length} SQL statements...`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`Executing statement ${i + 1}/${statements.length}...`);
          const { error } = await supabase.rpc('exec_sql', {
            sql_query: statement + ';'
          });
          
          if (error) {
            console.error(`Error in statement ${i + 1}:`, error);
            // Continue with other statements
          } else {
            console.log(`✓ Statement ${i + 1} executed successfully`);
          }
        } catch (err) {
          console.error(`Error executing statement ${i + 1}:`, err.message);
        }
      }
    }
    
    console.log('\nMarketplace database setup completed!');
    console.log('Note: Some statements may have failed if tables already exist.');
    
  } catch (error) {
    console.error('Error setting up marketplace database:', error);
  }
}

setupMarketplaceDatabase();