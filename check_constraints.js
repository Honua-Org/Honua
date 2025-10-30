const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ixqhqvqjqwjqhqvqjqwj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4cWhxdnFqcXdqcWhxdnFqcXdqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNzQ2NzU3NSwiZXhwIjoyMDUzMDQzNTc1fQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8'
);

async function checkConstraints() {
  try {
    // Check table constraints
    const { data, error } = await supabase
      .from('information_schema.check_constraints')
      .select('constraint_name, check_clause')
      .like('check_clause', '%availability_status%');

    if (error) {
      console.error('Error:', error);
      return;
    }

    console.log('Availability status constraints:');
    console.log(JSON.stringify(data, null, 2));

    // Also check column info
    const { data: columns, error: colError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, column_default')
      .eq('table_name', 'marketplace_products')
      .eq('column_name', 'availability_status');

    if (colError) {
      console.error('Column Error:', colError);
      return;
    }

    console.log('\nAvailability status column info:');
    console.log(JSON.stringify(columns, null, 2));

  } catch (err) {
    console.error('Script error:', err);
  }
}