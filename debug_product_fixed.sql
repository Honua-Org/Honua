-- Fixed debugging script for Product ID: b4dd9df5-0f1d-4f77-a4e7-6da25fa0e77c
-- This script will investigate and fix the 'Product not found' error

-- Step 1: Check if the product exists in marketplace_products
SELECT 
    id,
    title,
    description,
    price,
    currency,
    category,
    status,
    seller_id,
    created_at,
    updated_at
FROM marketplace_products 
WHERE id = 'b4dd9df5-0f1d-4f77-a4e7-6da25fa0e77c';

-- Step 2: Check marketplace_inventory for this product
SELECT 
    product_id,
    stock_quantity,
    reserved_quantity,
    available_quantity,
    low_stock_threshold,
    created_at,
    updated_at
FROM marketplace_inventory 
WHERE product_id = 'b4dd9df5-0f1d-4f77-a4e7-6da25fa0e77c';

-- Step 3: Check if there are any orders for this product
SELECT 
    id,
    product_id,
    buyer_id,
    status,
    quantity,
    total_amount,
    created_at
FROM marketplace_orders 
WHERE product_id = 'b4dd9df5-0f1d-4f77-a4e7-6da25fa0e77c'
ORDER BY created_at DESC
LIMIT 5;

-- Step 4: List all products to see what exists
SELECT 
    id,
    title,
    status,
    seller_id,
    created_at
FROM marketplace_products 
ORDER BY created_at DESC
LIMIT 10;

-- Step 5: If product doesn't exist, create it with the expected ID
-- (This will be executed conditionally based on the results above)
INSERT INTO marketplace_products (
    id,
    title,
    description,
    price,
    currency,
    category,
    status,
    seller_id,
    type,
    created_at,
    updated_at
) VALUES (
    'b4dd9df5-0f1d-4f77-a4e7-6da25fa0e77c',
    'Debug Test Product',
    'This is a test product created to resolve the Product not found error',
    29.99,
    'USD',
    'electronics',
    'active',
    '9333e2fa-4d62-4fe2-a5ac-f421ad3f1b57', -- Using the user ID from the error logs
    'physical',
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    status = 'active',
    updated_at = NOW();

-- Step 6: Ensure inventory record exists
INSERT INTO marketplace_inventory (
    product_id,
    stock_quantity,
    reserved_quantity,
    available_quantity,
    low_stock_threshold,
    created_at,
    updated_at
) VALUES (
    'b4dd9df5-0f1d-4f77-a4e7-6da25fa0e77c',
    100,
    0,
    100,
    10,
    NOW(),
    NOW()
) ON CONFLICT (product_id) DO UPDATE SET
    stock_quantity = GREATEST(EXCLUDED.stock_quantity, 10),
    available_quantity = GREATEST(EXCLUDED.available_quantity, 10),
    updated_at = NOW();

-- Step 7: Verify the fix by checking both tables again
SELECT 
    p.id,
    p.title,
    p.status,
    i.stock_quantity,
    i.available_quantity
FROM marketplace_products p
LEFT JOIN marketplace_inventory i ON p.id = i.product_id
WHERE p.id = 'b4dd9df5-0f1d-4f77-a4e7-6da25fa0e77c';

-- Step 8: Test the stock availability function that the API uses (if it exists)
-- SELECT check_stock_availability('b4dd9df5-0f1d-4f77-a4e7-6da25fa0e77c', 1) as stock_available;

-- Step 9: Check RLS policies to ensure proper access
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
WHERE tablename IN ('marketplace_products', 'marketplace_inventory')
ORDER BY tablename, policyname;