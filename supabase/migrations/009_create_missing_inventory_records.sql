-- Migration: Create missing inventory records for existing products
-- Description: Fix "Insufficient stock available" error by creating inventory records for products that don't have them

-- Insert inventory records for products that don't have them
INSERT INTO marketplace_inventory (
    product_id,
    quantity,
    reserved_quantity,
    low_stock_threshold,
    reorder_point,
    created_at,
    updated_at
)
SELECT 
    p.id as product_id,
    CASE 
        WHEN p.type = 'digital' THEN 999999  -- Digital products have unlimited stock
        WHEN p.type = 'service' THEN 100     -- Services have high availability
        ELSE COALESCE(p.quantity, 50)        -- Physical products use existing quantity or default to 50
    END as quantity,
    0 as reserved_quantity,
    CASE 
        WHEN p.type = 'digital' THEN 0       -- No low stock threshold for digital
        WHEN p.type = 'service' THEN 5       -- Low threshold for services
        ELSE COALESCE(p.low_stock_threshold, 5)  -- Use existing threshold or default
    END as low_stock_threshold,
    CASE 
        WHEN p.type = 'digital' THEN 0       -- No reorder point for digital
        WHEN p.type = 'service' THEN 10      -- Reorder point for services
        ELSE 10                               -- Default reorder point for physical
    END as reorder_point,
    NOW() as created_at,
    NOW() as updated_at
FROM marketplace_products p
LEFT JOIN marketplace_inventory i ON p.id = i.product_id
WHERE i.product_id IS NULL  -- Only products without inventory records
  AND p.status = 'active';   -- Only active products

-- Update the availability_status of products based on their new inventory
UPDATE marketplace_products 
SET availability_status = CASE 
    WHEN type = 'digital' THEN 'available'  -- Digital products are always available
    WHEN type = 'service' THEN 'available'  -- Services are always available
    ELSE (
        CASE 
            WHEN EXISTS (
                SELECT 1 FROM marketplace_inventory i 
                WHERE i.product_id = marketplace_products.id 
                AND i.quantity > 0
            ) THEN 'available'
            ELSE 'out_of_stock'
        END
    )
END
WHERE status = 'active';

-- Create a function to automatically create inventory records for new products
CREATE OR REPLACE FUNCTION create_inventory_for_new_product()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create inventory for active products
    IF NEW.status = 'active' THEN
        INSERT INTO marketplace_inventory (
            product_id,
            quantity,
            reserved_quantity,
            low_stock_threshold,
            reorder_point
        ) VALUES (
            NEW.id,
            CASE 
                WHEN NEW.type = 'digital' THEN 999999
                WHEN NEW.type = 'service' THEN 100
                ELSE COALESCE(NEW.quantity, 50)
            END,
            0,
            CASE 
                WHEN NEW.type = 'digital' THEN 0
                WHEN NEW.type = 'service' THEN 5
                ELSE COALESCE(NEW.low_stock_threshold, 5)
            END,
            CASE 
                WHEN NEW.type = 'digital' THEN 0
                WHEN NEW.type = 'service' THEN 10
                ELSE 10
            END
        )
        ON CONFLICT (product_id) DO NOTHING;  -- Don't overwrite existing records
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically create inventory records for new products
DROP TRIGGER IF EXISTS create_inventory_trigger ON marketplace_products;
CREATE TRIGGER create_inventory_trigger
    AFTER INSERT OR UPDATE OF status ON marketplace_products
    FOR EACH ROW
    EXECUTE FUNCTION create_inventory_for_new_product();

-- Grant permissions
GRANT EXECUTE ON FUNCTION create_inventory_for_new_product() TO authenticated;
GRANT EXECUTE ON FUNCTION create_inventory_for_new_product() TO anon;

-- Add comment for documentation
COMMENT ON FUNCTION create_inventory_for_new_product() IS 'Automatically creates inventory records for new active products to prevent stock availability issues';

-- Refresh table statistics
ANALYZE marketplace_products;
ANALYZE marketplace_inventory;