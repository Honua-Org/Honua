-- Create triggers and functions for real-time analytics updates
-- This migration creates the necessary triggers to automatically update analytics data

-- Function to update product analytics when orders are created
CREATE OR REPLACE FUNCTION update_product_analytics_on_order()
RETURNS TRIGGER AS $$
BEGIN
  -- Update product analytics for the order
  INSERT INTO product_analytics (product_id, seller_id, date, orders, revenue)
  VALUES (NEW.product_id, NEW.seller_id, CURRENT_DATE, 1, NEW.total_amount)
  ON CONFLICT (product_id, date)
  DO UPDATE SET
    orders = product_analytics.orders + 1,
    revenue = product_analytics.revenue + NEW.total_amount,
    updated_at = NOW();

  -- Update customer analytics
  INSERT INTO customer_analytics (customer_id, seller_id, first_purchase_date, last_purchase_date, total_orders, total_spent)
  VALUES (NEW.buyer_id, NEW.seller_id, NEW.created_at, NEW.created_at, 1, NEW.total_amount)
  ON CONFLICT (customer_id, seller_id)
  DO UPDATE SET
    last_purchase_date = NEW.created_at,
    total_orders = customer_analytics.total_orders + 1,
    total_spent = customer_analytics.total_spent + NEW.total_amount,
    average_order_value = (customer_analytics.total_spent + NEW.total_amount) / (customer_analytics.total_orders + 1),
    lifetime_value = (customer_analytics.total_spent + NEW.total_amount) * 1.2, -- Simple LTV calculation
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update product analytics when views are logged
CREATE OR REPLACE FUNCTION update_product_analytics_on_view()
RETURNS TRIGGER AS $$
DECLARE
  is_unique_view BOOLEAN := FALSE;
BEGIN
  -- Check if this is a unique view (same viewer hasn't viewed this product today)
  IF NEW.viewer_id IS NOT NULL THEN
    SELECT NOT EXISTS (
      SELECT 1 FROM product_view_logs 
      WHERE product_id = NEW.product_id 
        AND viewer_id = NEW.viewer_id 
        AND DATE(viewed_at) = CURRENT_DATE
        AND id != NEW.id
    ) INTO is_unique_view;
  ELSE
    -- For anonymous users, consider each view as unique based on IP
    SELECT NOT EXISTS (
      SELECT 1 FROM product_view_logs 
      WHERE product_id = NEW.product_id 
        AND ip_address = NEW.ip_address 
        AND DATE(viewed_at) = CURRENT_DATE
        AND id != NEW.id
    ) INTO is_unique_view;
  END IF;

  -- Update product analytics
  INSERT INTO product_analytics (product_id, seller_id, date, views, unique_views)
  VALUES (NEW.product_id, NEW.seller_id, CURRENT_DATE, 1, CASE WHEN is_unique_view THEN 1 ELSE 0 END)
  ON CONFLICT (product_id, date)
  DO UPDATE SET
    views = product_analytics.views + 1,
    unique_views = product_analytics.unique_views + CASE WHEN is_unique_view THEN 1 ELSE 0 END,
    updated_at = NOW();

  -- Update demographics if we have age group info
  IF NEW.age_group IS NOT NULL THEN
    INSERT INTO customer_demographics (seller_id, age_group, country, date, count)
    VALUES (NEW.seller_id, NEW.age_group, COALESCE(NEW.country, 'Unknown'), CURRENT_DATE, 1)
    ON CONFLICT (seller_id, age_group, country, date)
    DO UPDATE SET
      count = customer_demographics.count + 1,
      updated_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update analytics when marketplace messages are sent
CREATE OR REPLACE FUNCTION update_product_analytics_on_message()
RETURNS TRIGGER AS $$
BEGIN
  -- Update product analytics for messages
  INSERT INTO product_analytics (product_id, seller_id, date, messages)
  VALUES (NEW.product_id, NEW.seller_id, CURRENT_DATE, 1)
  ON CONFLICT (product_id, date)
  DO UPDATE SET
    messages = product_analytics.messages + 1,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_update_analytics_on_order ON marketplace_orders;
CREATE TRIGGER trigger_update_analytics_on_order
  AFTER INSERT ON marketplace_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_product_analytics_on_order();

DROP TRIGGER IF EXISTS trigger_update_analytics_on_view ON product_view_logs;
CREATE TRIGGER trigger_update_analytics_on_view
  AFTER INSERT ON product_view_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_product_analytics_on_view();

DROP TRIGGER IF EXISTS trigger_update_analytics_on_message ON marketplace_messages;
CREATE TRIGGER trigger_update_analytics_on_message
  AFTER INSERT ON marketplace_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_product_analytics_on_message();

-- Function to get real-time analytics data
CREATE OR REPLACE FUNCTION get_seller_analytics(seller_uuid UUID, days_back INTEGER DEFAULT 30)
RETURNS TABLE (
  date DATE,
  total_views BIGINT,
  unique_views BIGINT,
  total_orders BIGINT,
  total_revenue NUMERIC,
  total_messages BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pa.date,
    COALESCE(SUM(pa.views), 0) as total_views,
    COALESCE(SUM(pa.unique_views), 0) as unique_views,
    COALESCE(SUM(pa.orders), 0) as total_orders,
    COALESCE(SUM(pa.revenue), 0) as total_revenue,
    COALESCE(SUM(pa.messages), 0) as total_messages
  FROM product_analytics pa
  WHERE pa.seller_id = seller_uuid
    AND pa.date >= CURRENT_DATE - INTERVAL '1 day' * days_back
  GROUP BY pa.date
  ORDER BY pa.date DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get top performing products
CREATE OR REPLACE FUNCTION get_top_products(seller_uuid UUID, days_back INTEGER DEFAULT 30, limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  product_id UUID,
  product_title TEXT,
  total_views BIGINT,
  total_orders BIGINT,
  total_revenue NUMERIC,
  conversion_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mp.id as product_id,
    mp.title::TEXT as product_title,
    COALESCE(SUM(pa.views), 0) as total_views,
    COALESCE(SUM(pa.orders), 0) as total_orders,
    COALESCE(SUM(pa.revenue), 0) as total_revenue,
    CASE 
      WHEN COALESCE(SUM(pa.views), 0) > 0 
      THEN ROUND((COALESCE(SUM(pa.orders), 0)::NUMERIC / SUM(pa.views)) * 100, 2)
      ELSE 0 
    END as conversion_rate
  FROM marketplace_products mp
  LEFT JOIN product_analytics pa ON mp.id = pa.product_id 
    AND pa.date >= CURRENT_DATE - INTERVAL '1 day' * days_back
  WHERE mp.seller_id = seller_uuid
  GROUP BY mp.id, mp.title
  ORDER BY total_revenue DESC, total_views DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get customer analytics
CREATE OR REPLACE FUNCTION get_customer_analytics(seller_uuid UUID)
RETURNS TABLE (
  customer_id UUID,
  customer_email TEXT,
  customer_name TEXT,
  total_orders BIGINT,
  total_spent NUMERIC,
  average_order_value NUMERIC,
  lifetime_value NUMERIC,
  first_purchase_date TIMESTAMP WITH TIME ZONE,
  last_purchase_date TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ca.customer_id,
    COALESCE(au.email, '') as customer_email,
    COALESCE(p.full_name, p.username) as customer_name,
    ca.total_orders,
    ca.total_spent,
    ca.average_order_value,
    ca.lifetime_value,
    ca.first_purchase_date,
    ca.last_purchase_date
  FROM customer_analytics ca
  JOIN profiles p ON ca.customer_id = p.id
  LEFT JOIN auth.users au ON ca.customer_id = au.id
  WHERE ca.seller_id = seller_uuid
  ORDER BY ca.total_spent DESC, ca.last_purchase_date DESC;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_seller_analytics(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_top_products(UUID, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_customer_analytics(UUID) TO authenticated;