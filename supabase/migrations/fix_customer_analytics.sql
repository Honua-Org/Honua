-- Fix customer analytics by updating the get_customer_analytics function 
-- to work with marketplace_orders directly when customer_analytics table is empty

-- Update the get_customer_analytics function to work with marketplace_orders directly
-- in case customer_analytics table is empty
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
    COALESCE(au.email, '') as customer_email,
    COALESCE(p.full_name, p.username) as customer_name,
    COUNT(mo.id)::BIGINT as total_orders,
    COALESCE(SUM(mo.total_amount), 0) as total_spent,
    COALESCE(AVG(mo.total_amount), 0) as average_order_value,
    COALESCE(SUM(mo.total_amount), 0) as lifetime_value,
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

-- Grant execute permissions for the updated function
GRANT EXECUTE ON FUNCTION get_customer_analytics(UUID) TO authenticated;