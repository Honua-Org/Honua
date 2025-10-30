const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const PRODUCT_ID = 'b4dd9df5-0f1d-4f77-a4e7-6da25fa0e77c';

async function debugProduct() {
  console.log('=== DEBUGGING PRODUCT ===');
  console.log('Product ID:', PRODUCT_ID);
  console.log('');

  try {
    // 1. Check if product exists in marketplace_products table
    console.log('1. Checking marketplace_products table...');
    const { data: product, error: productError } = await supabase
      .from('marketplace_products')
      .select('*')
      .eq('id', PRODUCT_ID)
      .single();

    if (productError) {
      console.log('❌ Product query error:', productError);
    } else if (product) {
      console.log('✅ Product found in marketplace_products:');
      console.log(JSON.stringify(product, null, 2));
    } else {
      console.log('❌ Product NOT found in marketplace_products');
    }
    console.log('');

    // 2. Check inventory table
    console.log('2. Checking marketplace_inventory table...');
    const { data: inventory, error: inventoryError } = await supabase
      .from('marketplace_inventory')
      .select('*')
      .eq('product_id', PRODUCT_ID);

    if (inventoryError) {
      console.log('❌ Inventory query error:', inventoryError);
    } else if (inventory && inventory.length > 0) {
      console.log('✅ Inventory records found:');
      console.log(JSON.stringify(inventory, null, 2));
    } else {
      console.log('❌ No inventory records found');
    }
    console.log('');

    // 3. Check if there are any products with similar IDs (typo check)
    console.log('3. Checking for similar product IDs...');
    const { data: similarProducts, error: similarError } = await supabase
      .from('marketplace_products')
      .select('id, title, status')
      .ilike('id', `%${PRODUCT_ID.slice(-8)}%`);

    if (similarError) {
      console.log('❌ Similar products query error:', similarError);
    } else if (similarProducts && similarProducts.length > 0) {
      console.log('✅ Products with similar IDs:');
      console.log(JSON.stringify(similarProducts, null, 2));
    } else {
      console.log('❌ No products with similar IDs found');
    }
    console.log('');

    // 4. Check all products to see what exists
    console.log('4. Checking all products in marketplace...');
    const { data: allProducts, error: allError } = await supabase
      .from('marketplace_products')
      .select('id, title, status, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (allError) {
      console.log('❌ All products query error:', allError);
    } else if (allProducts && allProducts.length > 0) {
      console.log('✅ Recent products in marketplace:');
      console.log(JSON.stringify(allProducts, null, 2));
    } else {
      console.log('❌ No products found in marketplace');
    }
    console.log('');

    // 5. Check table structure
    console.log('5. Checking marketplace_products table structure...');
    const { data: tableInfo, error: tableError } = await supabase
      .rpc('get_table_info', { table_name: 'marketplace_products' });

    if (tableError) {
      console.log('❌ Table info error:', tableError);
    } else {
      console.log('✅ Table structure:');
      console.log(JSON.stringify(tableInfo, null, 2));
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the debug function
debugProduct().then(() => {
  console.log('=== DEBUG COMPLETE ===');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Debug failed:', error);
  process.exit(1);
});