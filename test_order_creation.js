const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const PRODUCT_ID = 'b4dd9df5-0f1d-4f77-a4e7-6da25fa0e77c';
const USER_ID = '9333e2fa-4d62-4fe2-a5ac-f421ad3f1b57';

async function testOrderCreation() {
  console.log('=== TESTING ORDER CREATION API ===');
  console.log('Product ID:', PRODUCT_ID);
  console.log('User ID:', USER_ID);
  console.log('');

  try {
    // Test the fixed product query first
    console.log('1. Testing fixed product query...');
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    const { data: product, error: productError } = await supabase
      .from('marketplace_products')
      .select(`
        *,
        seller:profiles!marketplace_products_seller_id_fkey(
          id,
          username,
          full_name
        )
      `)
      .eq('id', PRODUCT_ID)
      .single();

    if (productError) {
      console.log('❌ Product query error:', productError);
      return;
    } else if (product) {
      console.log('✅ Product found with fixed query:');
      console.log(`Title: ${product.title}`);
      console.log(`Status: ${product.status}`);
      console.log(`Price: ${product.price}`);
      console.log(`Seller: ${product.seller?.username || 'Unknown'}`);
    } else {
      console.log('❌ Product NOT found with fixed query');
      return;
    }
    console.log('');

    // Test 2: Test just the product query without joins
    console.log('2. Testing simple product query (no joins)...');
    
    const { data: simpleProduct, error: simpleError } = await supabase
      .from('marketplace_products')
      .select('*')
      .eq('id', PRODUCT_ID)
      .single();

    if (simpleError) {
      console.log('❌ Simple product query error:', simpleError);
    } else if (simpleProduct) {
      console.log('✅ Product found with simple query:');
      console.log(JSON.stringify(simpleProduct, null, 2));
    } else {
      console.log('❌ Product NOT found with simple query');
    }
    console.log('');

    // Test 3: Check if the development server is running
    console.log('3. Checking if development server is running...');
    
    try {
      const healthResponse = await fetch('http://localhost:3000/api/health', {
        method: 'GET'
      });
      console.log('Health check status:', healthResponse.status);
    } catch (fetchError) {
      console.log('❌ Development server not running:', fetchError.message);
      console.log('Please start the development server with: npm run dev');
      return;
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the test
testOrderCreation().then(() => {
  console.log('=== TEST COMPLETE ===');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});