const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with service role key (bypasses RLS)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const PRODUCT_ID = 'b4dd9df5-0f1d-4f77-a4e7-6da25fa0e77c';
const USER_ID = '9333e2fa-4d62-4fe2-a5ac-f421ad3f1b57';

async function testProductFetch() {
  console.log('=== TESTING PRODUCT FETCH LIKE API ===');
  console.log('Product ID:', PRODUCT_ID);
  console.log('User ID:', USER_ID);
  console.log('');

  try {
    // Test 1: Using service role key (bypasses RLS)
    console.log('1. Testing with SERVICE ROLE KEY (bypasses RLS)...');
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: productService, error: errorService } = await supabaseService
      .from('marketplace_products')
      .select(`
        *,
        seller:profiles!marketplace_products_seller_id_fkey(
          id,
          username,
          full_name,
          email
        )
      `)
      .eq('id', PRODUCT_ID)
      .single();

    if (errorService) {
      console.log('❌ Service role query error:', errorService);
    } else if (productService) {
      console.log('✅ Product found with service role:');
      console.log(JSON.stringify(productService, null, 2));
    } else {
      console.log('❌ Product NOT found with service role');
    }
    console.log('');

    // Test 2: Using anon key (subject to RLS)
    console.log('2. Testing with ANON KEY (subject to RLS)...');
    const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
    
    const { data: productAnon, error: errorAnon } = await supabaseAnon
      .from('marketplace_products')
      .select(`
        *,
        seller:profiles!marketplace_products_seller_id_fkey(
          id,
          username,
          full_name,
          email
        )
      `)
      .eq('id', PRODUCT_ID)
      .single();

    if (errorAnon) {
      console.log('❌ Anon key query error:', errorAnon);
    } else if (productAnon) {
      console.log('✅ Product found with anon key:');
      console.log(JSON.stringify(productAnon, null, 2));
    } else {
      console.log('❌ Product NOT found with anon key');
    }
    console.log('');

    // Test 3: Simulate authenticated user context
    console.log('3. Testing with AUTHENTICATED USER context...');
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);
    
    // First, let's check if we can query without auth
    const { data: productNoAuth, error: errorNoAuth } = await supabaseAuth
      .from('marketplace_products')
      .select('id, title, status, seller_id')
      .eq('id', PRODUCT_ID)
      .single();

    if (errorNoAuth) {
      console.log('❌ No auth query error:', errorNoAuth);
    } else if (productNoAuth) {
      console.log('✅ Product found without auth:');
      console.log(JSON.stringify(productNoAuth, null, 2));
    } else {
      console.log('❌ Product NOT found without auth');
    }
    console.log('');

    // Test 4: Check RLS policies
    console.log('4. Checking RLS policies...');
    const { data: policies, error: policiesError } = await supabaseService
      .rpc('exec_sql', { 
        sql: `
          SELECT 
            schemaname,
            tablename,
            policyname,
            permissive,
            roles,
            cmd,
            qual,
            with_check
          FROM pg_policies 
          WHERE tablename = 'marketplace_products'
          ORDER BY policyname;
        `
      });

    if (policiesError) {
      console.log('❌ Policies query error:', policiesError);
      
      // Alternative way to check policies
      const { data: altPolicies, error: altError } = await supabaseService
        .from('pg_policies')
        .select('*')
        .eq('tablename', 'marketplace_products');
        
      if (altError) {
        console.log('❌ Alternative policies query error:', altError);
      } else {
        console.log('✅ RLS Policies (alternative method):');
        console.log(JSON.stringify(altPolicies, null, 2));
      }
    } else {
      console.log('✅ RLS Policies:');
      console.log(JSON.stringify(policies, null, 2));
    }
    console.log('');

    // Test 5: Check if table has RLS enabled
    console.log('5. Checking if RLS is enabled...');
    const { data: rlsStatus, error: rlsError } = await supabaseService
      .from('pg_class')
      .select('relname, relrowsecurity')
      .eq('relname', 'marketplace_products')
      .single();

    if (rlsError) {
      console.log('❌ RLS status query error:', rlsError);
    } else {
      console.log('✅ RLS Status:');
      console.log(`Table: ${rlsStatus.relname}, RLS Enabled: ${rlsStatus.relrowsecurity}`);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the test
testProductFetch().then(() => {
  console.log('=== TEST COMPLETE ===');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});