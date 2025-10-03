-- Check if the specific product exists
SELECT 
  id,
  name,
  status,
  availability_status,
  seller_id,
  created_at
FROM marketplace_products 
WHERE id = 'b4dd9df5-0f1d-4f77-a4e7-6da25fa0e77c';

-- Also check all products to see what's available
SELECT 
  id,
  name,
  status,
  availability_status,
  seller_id
FROM marketplace_products 
ORDER BY created_at DESC
LIMIT 10;