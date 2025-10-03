-- Migration: Add check_stock_availability function
-- Description: Create the missing check_stock_availability function for order processing

-- Function to check stock availability for a product
CREATE OR REPLACE FUNCTION check_stock_availability(
    p_product_id UUID,
    p_quantity INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
    available_qty INTEGER;
    product_type TEXT;
BEGIN
    -- Get product type and available quantity
    SELECT 
        p.type,
        COALESCE(i.available_quantity, 0)
    INTO 
        product_type,
        available_qty
    FROM marketplace_products p
    LEFT JOIN marketplace_inventory i ON p.id = i.product_id
    WHERE p.id = p_product_id AND p.status = 'active';
    
    -- If product not found, return false
    IF product_type IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- For digital products, always return true (unlimited stock)
    IF product_type = 'digital' THEN
        RETURN TRUE;
    END IF;
    
    -- For physical products, check if we have enough stock
    IF product_type = 'physical' THEN
        -- If no inventory record exists, assume no stock
        IF available_qty IS NULL THEN
            RETURN FALSE;
        END IF;
        
        -- Check if requested quantity is available
        RETURN available_qty >= p_quantity;
    END IF;
    
    -- Default case: return false for unknown product types
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION check_stock_availability(UUID, INTEGER) TO authenticated;

-- Grant execute permission to anon users (for public product checks)
GRANT EXECUTE ON FUNCTION check_stock_availability(UUID, INTEGER) TO anon;

-- Add comment for documentation
COMMENT ON FUNCTION check_stock_availability(UUID, INTEGER) IS 'Checks if sufficient stock is available for a given product and quantity. Returns true for digital products (unlimited stock) and for physical products with sufficient inventory.';