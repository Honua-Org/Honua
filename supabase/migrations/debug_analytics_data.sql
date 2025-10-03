-- Create test data for analytics debugging
-- This will help us verify the RPC functions work correctly

-- Insert test product analytics data
INSERT INTO product_analytics (product_id, seller_id, date, views, unique_views, orders, revenue, messages)
SELECT 
  mp.id as product_id,
  mp.seller_id,
  CURRENT_DATE - INTERVAL '1 day' * generate_series(0, 7) as date,
  (random() * 100)::integer as views,
  (random() * 50)::integer as unique_views,
  (random() * 5)::integer as orders,
  (random() * 500)::numeric(10,2) as revenue,
  (random() * 10)::integer as messages
FROM marketplace_products mp
WHERE mp.seller_id = '9333e2fa-4d62-4fe2-a5ac-f421ad3f1b57'
ON CONFLICT (product_id, date) DO NOTHING;

-- Insert test customer analytics data using existing user IDs
INSERT INTO customer_analytics (customer_id, seller_id, first_purchase_date, last_purchase_date, total_orders, total_spent, average_order_value, lifetime_value)
SELECT 
  au.id as customer_id,
  '9333e2fa-4d62-4fe2-a5ac-f421ad3f1b57' as seller_id,
  NOW() - INTERVAL '30 days' as first_purchase_date,
  NOW() - INTERVAL '5 days' as last_purchase_date,
  3 as total_orders,
  150.00 as total_spent,
  50.00 as average_order_value,
  180.00 as lifetime_value
FROM auth.users au
WHERE au.id != '9333e2fa-4d62-4fe2-a5ac-f421ad3f1b57'
LIMIT 3
ON CONFLICT (customer_id, seller_id) DO NOTHING;

-- Insert test customer demographics data
INSERT INTO customer_demographics (seller_id, age_group, gender, country, region, date, count)
VALUES 
  ('9333e2fa-4d62-4fe2-a5ac-f421ad3f1b57', '25-34', 'Female', 'USA', 'California', CURRENT_DATE, 15),
  ('9333e2fa-4d62-4fe2-a5ac-f421ad3f1b57', '35-44', 'Male', 'USA', 'New York', CURRENT_DATE, 12),
  ('9333e2fa-4d62-4fe2-a5ac-f421ad3f1b57', '18-24', 'Other', 'Canada', 'Ontario', CURRENT_DATE, 8),
  ('9333e2fa-4d62-4fe2-a5ac-f421ad3f1b57', '45-54', 'Female', 'UK', 'London', CURRENT_DATE, 5)
ON CONFLICT (seller_id, age_group, country, date) DO NOTHING;