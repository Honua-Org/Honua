import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, quantity, lowStockThreshold } = body;

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    if (quantity === undefined || quantity < 0) {
      return NextResponse.json(
        { error: 'Valid quantity is required' },
        { status: 400 }
      );
    }

    // First get the current product to preserve other fields
    const { data: currentProduct, error: fetchError } = await supabase
      .from('marketplace_products')
      .select('*')
      .eq('id', productId)
      .single();

    if (fetchError || !currentProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Check if inventory columns exist by trying a simple select first
    const { data: columnTest, error: columnError } = await supabase
      .from('marketplace_products')
      .select('quantity, low_stock_threshold, availability_status')
      .eq('id', productId)
      .limit(1);

    let updateData: any = {};
    const hasInventoryColumns = !columnError;

    if (hasInventoryColumns) {
      // Inventory columns exist, update them
      updateData = {
        quantity: quantity,
        low_stock_threshold: lowStockThreshold || 5,
        availability_status: quantity <= 0 ? 'out_of_stock' : 'available'
      };
    } else {
      // Inventory columns don't exist, return error with migration instructions
      console.error('Inventory columns missing. Database migration required.');
      return NextResponse.json(
        { 
          error: 'Database schema update required',
          message: 'Inventory columns are missing from the database. Please run the migration in supabase/migrations/add_inventory_columns.sql',
          requiresMigration: true
        },
        { status: 500 }
      );
    }

    // Update the product with inventory data
    const { data, error } = await supabase
      .from('marketplace_products')
      .update(updateData)
      .eq('id', productId)
      .select();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { 
          error: 'Failed to update inventory in database',
          details: error.message,
          requiresMigration: error.message?.includes('quantity') || error.message?.includes('low_stock_threshold')
        },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Format response to match frontend expectations
    const updatedProduct = data[0];
    const inventoryData = {
      quantity: updatedProduct.quantity || 0,
      reserved_quantity: 0, // Default value since this field doesn't exist in products table
      low_stock_threshold: updatedProduct.low_stock_threshold || lowStockThreshold || 5,
      reorder_point: updatedProduct.low_stock_threshold || lowStockThreshold || 5 // Use same as threshold
    };

    return NextResponse.json({
      success: true,
      inventory: inventoryData,
      product: updatedProduct,
      message: 'Inventory updated successfully'
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Try to select with low_stock_threshold first, fallback if column doesn't exist
    let { data, error } = await supabase
      .from('marketplace_products')
      .select('id, quantity, low_stock_threshold')
      .eq('id', productId)
      .single();

    // If low_stock_threshold column doesn't exist, select without it
    if (error && error.message?.includes('low_stock_threshold')) {
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('marketplace_products')
        .select('id, quantity')
        .eq('id', productId)
        .single();
      
      if (fallbackData) {
        // Add default low_stock_threshold value
        data = {
          ...fallbackData,
          low_stock_threshold: 5
        };
      } else {
        data = fallbackData;
      }
      error = fallbackError;
    }

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch inventory' },
        { status: 500 }
      );
    }

    // Format response to match frontend expectations
    const inventoryData = {
      quantity: data?.quantity || 0,
      reserved_quantity: 0, // Default value since this field doesn't exist in products table
      low_stock_threshold: (data as any)?.low_stock_threshold || 5,
      reorder_point: (data as any)?.low_stock_threshold || 5 // Use same as threshold
    };

    return NextResponse.json({
      success: true,
      inventory: inventoryData
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}