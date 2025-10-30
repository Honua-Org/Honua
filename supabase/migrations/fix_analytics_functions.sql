-- Fix analytics functions to handle type mismatches and update existing functions

-- Drop and recreate the get_top_products function with proper type casting
DROP FUNCTION IF EXISTS get_top_products(UUID, INTEGER, INTEGER);

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
    COALESCE(SUM(pa.views), 0)::BIGINT as total_views,
    COALESCE(SUM(pa.orders), 0)::BIGINT as total_orders,
    COALESCE(SUM(pa.revenue), 0)::NUMERIC as total_revenue,
    CASE 
      WHEN COALESCE(SUM(pa.views), 0) > 0 
      THEN ROUND((COALESCE(SUM(pa.orders), 0)::NUMERIC / COALESCE(SUM(pa.views), 1)) * 100, 2)
      ELSE 0::NUMERIC 
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

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_top_products(UUID, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_top_products(UUID, INTEGER, INTEGER) TO anon;