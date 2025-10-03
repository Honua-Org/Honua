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

-- Insert test customer analytics data
INSERT INTO customer_analytics (customer_id, seller_id, first_purchase_date, last_purchase_date, total_orders, total_spent, average_order_value, lifetime_value)
VALUES 
  (gen_random_uuid(), '9333e2fa-4d62-4fe2-a5ac-f421ad3f1b57', NOW() - INTERVAL '30 days', NOW() - INTERVAL '5 days', 3, 150.00, 50.00, 180.00),
  (gen_random_uuid(), '9333e2fa-4d62-4fe2-a5ac-f421ad3f1b57', NOW() - INTERVAL '15 days', NOW() - INTERVAL '2 days', 2, 75.00, 37.50, 90.00),
  (gen_random_uuid(), '9333e2fa-4d62-4fe2-a5ac-f421ad3f1b57', NOW() - INTERVAL '7 days', NOW() - INTERVAL '1 day', 1, 25.00, 25.00, 30.00)
ON CONFLICT (customer_id, seller_id) DO NOTHING;

-- Insert test customer demographics data
INSERT INTO customer_demographics (seller_id, age_group, gender, country, region, date, count)
VALUES 
  ('9333e2fa-4d62-4fe2-a5ac-f421ad3f1b57', '25-34', 'Female', 'USA', 'California', CURRENT_DATE, 15),
  ('9333e2fa-4d62-4fe2-a5ac-f421ad3f1b57', '35-44', 'Male', 'USA', 'New York', CURRENT_DATE, 12),
  ('9333e2fa-4d62-4fe2-a5ac-f421ad3f1b57', '18-24', 'Other', 'Canada', 'Ontario', CURRENT_DATE, 8),
  ('9333e2fa-4d62-4fe2-a5ac-f421ad3f1b57', '45-54', 'Female', 'UK', 'London', CURRENT_DATE, 5)
ON CONFLICT (seller_id, age_group, country, date) DO NOTHING;