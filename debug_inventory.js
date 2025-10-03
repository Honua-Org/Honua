const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dauuiqsdqemxwtkriilw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRhdXVpcXNkcWVteHd0a3JpaWx3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDY2ODI1NiwiZXhwIjoyMDY2MjQ0MjU2fQ.BDrhoa6GCT-Md8YHCCdfcZiZIDrlyyXMwGjK8yrqhTM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkInventoryData() {
  try {
    // Check products and their inventory records
    const { data: products, error: productsError } = await supabase
      .from('marketplace_products')
      .select(`
        id,
        name,
        type,
        status,
        marketplace_inventory(
          available_quantity,
          quantity,
          reserved_quantity
        )
      `)
      .eq('status', 'active')
      .limit(10);

    if (productsError) {
      console.error('Error fetching products:', productsError);
      return;
    }

    console.log('Active products and their inventory:');
    console.log('=====================================');
    
    products.forEach(product => {
      console.log(`Product: ${product.name} (${product.type})`);
      console.log(`ID: ${product.id}`);
      
      if (product.marketplace_inventory && product.marketplace_inventory.length > 0) {
        const inventory = product.marketplace_inventory[0];
        console.log(`Inventory: ${inventory.available_quantity} available (${inventory.quantity} total, ${inventory.reserved_quantity} reserved)`);
      } else {
        console.log('❌ NO INVENTORY RECORD FOUND - This will cause "Insufficient stock" error!');
      }
      console.log('---');
    });

    // Test the check_stock_availability function
    console.log('\nTesting check_stock_availability function:');
    console.log('==========================================');
    
    for (const product of products.slice(0, 3)) {
      const { data: stockCheck, error: stockError } = await supabase
        .rpc('check_stock_availability', {
          p_product_id: product.id,
          p_quantity: 1
        });

      if (stockError) {
        console.error(`Error checking stock for ${product.name}:`, stockError);
      } else {
        console.log(`${product.name}: Stock available = ${stockCheck}`);
      }
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

checkInventoryData();