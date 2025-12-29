-- Fix column reference error in get_customer_analytics function
-- The function is referencing mo.total_amount but the column is actually mo.total_price

-- Drop and recreate the get_customer_analytics function with correct column reference
DROP FUNCTION IF EXISTS get_customer_analytics(UUID);

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
  -- Calculate customer analytics from marketplace_orders directly
  SELECT 
    mo.buyer_id as customer_id,
    COALESCE(au.email, '')::TEXT as customer_email,
    COALESCE(p.full_name, p.username)::TEXT as customer_name,
    COUNT(mo.id)::BIGINT as total_orders,
    COALESCE(SUM(mo.total_price), 0)::NUMERIC as total_spent,  -- Fixed: total_price instead of total_amount
    COALESCE(AVG(mo.total_price), 0)::NUMERIC as average_order_value,  -- Fixed: total_price instead of total_amount
    COALESCE(SUM(mo.total_price), 0)::NUMERIC as lifetime_value,  -- Fixed: total_price instead of total_amount
    MIN(mo.created_at) as first_purchase_date,
    MAX(mo.created_at) as last_purchase_date
  FROM marketplace_orders mo
  JOIN profiles p ON mo.buyer_id = p.id
  LEFT JOIN auth.users au ON mo.buyer_id = au.id
  WHERE mo.seller_id = seller_uuid
  GROUP BY mo.buyer_id, au.email, p.full_name, p.username
  ORDER BY total_spent DESC, last_purchase_date DESC;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_customer_analytics(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_customer_analytics(UUID) TO anon;