-- Debug query to check existing products
SELECT id, name, title, status, type, availability_status 
FROM marketplace_products 
ORDER BY created_at DESC 
LIMIT 10;