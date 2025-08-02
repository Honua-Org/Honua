const { createClient } = require('@supabase/supabase-js');

// You'll need to replace these with your actual Supabase URL and service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixRLSPolicies() {
  try {
    console.log('Adding RLS policies for sustainability_tasks...');
    
    // Add INSERT policy
    const { error: insertError } = await supabase.rpc('exec_sql', {
      sql: `CREATE POLICY "Authenticated users can insert tasks" ON sustainability_tasks FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);`
    });
    
    if (insertError && !insertError.message.includes('already exists')) {
      console.error('Error creating INSERT policy:', insertError);
    } else {
      console.log('✓ INSERT policy created successfully');
    }
    
    // Add UPDATE policy
    const { error: updateError } = await supabase.rpc('exec_sql', {
      sql: `CREATE POLICY "Authenticated users can update tasks" ON sustainability_tasks FOR UPDATE USING (auth.uid() IS NOT NULL);`
    });
    
    if (updateError && !updateError.message.includes('already exists')) {
      console.error('Error creating UPDATE policy:', updateError);
    } else {
      console.log('✓ UPDATE policy created successfully');
    }
    
    // Add DELETE policy
    const { error: deleteError } = await supabase.rpc('exec_sql', {
      sql: `CREATE POLICY "Authenticated users can delete tasks" ON sustainability_tasks FOR DELETE USING (auth.uid() IS NOT NULL);`
    });
    
    if (deleteError && !deleteError.message.includes('already exists')) {
      console.error('Error creating DELETE policy:', deleteError);
    } else {
      console.log('✓ DELETE policy created successfully');
    }
    
    console.log('\nRLS policies have been updated successfully!');
    console.log('You can now create tasks through the admin interface.');
    
  } catch (error) {
    console.error('Error fixing RLS policies:', error);
  }
}

fixRLSPolicies();