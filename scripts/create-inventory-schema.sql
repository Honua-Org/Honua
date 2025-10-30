-- Create inventory management tables for marketplace

-- Inventory tracking table
CREATE TABLE IF NOT EXISTS marketplace_inventory (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES marketplace_products(id) ON DELETE CASCADE,
    current_stock INTEGER NOT NULL DEFAULT 0,
    reserved_stock INTEGER NOT NULL DEFAULT 0,
    available_stock INTEGER GENERATED ALWAYS AS (current_stock - reserved_stock) STORED,
    low_stock_threshold INTEGER NOT NULL DEFAULT 10,
    reorder_point INTEGER NOT NULL DEFAULT 5,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(product_id)
);

-- Stock movements tracking table
CREATE TABLE IF NOT EXISTS marketplace_stock_movements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES marketplace_products(id) ON DELETE CASCADE,
    movement_type VARCHAR(20) NOT NULL CHECK (movement_type IN ('in', 'out', 'reserved', 'released')),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    reason TEXT NOT NULL,
    reference_id UUID, -- Can reference orders, returns, etc.
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by UUID REFERENCES auth.users(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_marketplace_inventory_product_id ON marketplace_inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_inventory_available_stock ON marketplace_inventory(available_stock);
CREATE INDEX IF NOT EXISTS idx_marketplace_inventory_low_stock ON marketplace_inventory(available_stock, low_stock_threshold) WHERE available_stock <= low_stock_threshold;

CREATE INDEX IF NOT EXISTS idx_marketplace_stock_movements_product_id ON marketplace_stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_stock_movements_created_at ON marketplace_stock_movements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_marketplace_stock_movements_reference_id ON marketplace_stock_movements(reference_id) WHERE reference_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_marketplace_stock_movements_type ON marketplace_stock_movements(movement_type);

-- Enable RLS (Row Level Security)
ALTER TABLE marketplace_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_stock_movements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for marketplace_inventory
-- Sellers can view and manage inventory for their own products
CREATE POLICY "Sellers can view their product inventory" ON marketplace_inventory
    FOR SELECT USING (
        product_id IN (
            SELECT id FROM marketplace_products 
            WHERE seller_id = auth.uid()
        )
    );

CREATE POLICY "Sellers can update their product inventory" ON marketplace_inventory
    FOR UPDATE USING (
        product_id IN (
            SELECT id FROM marketplace_products 
            WHERE seller_id = auth.uid()
        )
    );

CREATE POLICY "Sellers can insert inventory for their products" ON marketplace_inventory
    FOR INSERT WITH CHECK (
        product_id IN (
            SELECT id FROM marketplace_products 
            WHERE seller_id = auth.uid()
        )
    );

-- Buyers can view basic inventory info (available stock) for products
CREATE POLICY "Users can view product availability" ON marketplace_inventory
    FOR SELECT USING (
        product_id IN (
            SELECT id FROM marketplace_products 
            WHERE status = 'active'
        )
    );

-- RLS Policies for marketplace_stock_movements
-- Sellers can view stock movements for their products
CREATE POLICY "Sellers can view their product stock movements" ON marketplace_stock_movements
    FOR SELECT USING (
        product_id IN (
            SELECT id FROM marketplace_products 
            WHERE seller_id = auth.uid()
        )
    );

CREATE POLICY "Sellers can insert stock movements for their products" ON marketplace_stock_movements
    FOR INSERT WITH CHECK (
        product_id IN (
            SELECT id FROM marketplace_products 
            WHERE seller_id = auth.uid()
        )
    );

-- System can insert stock movements (for automated processes)
CREATE POLICY "System can manage stock movements" ON marketplace_stock_movements
    FOR ALL USING (true);

-- Function to automatically create inventory record when product is created
CREATE OR REPLACE FUNCTION create_initial_inventory()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create inventory for physical products
    IF NEW.type = 'physical' THEN
        INSERT INTO marketplace_inventory (
            product_id,
            current_stock,
            reserved_stock,
            low_stock_threshold,
            reorder_point
        ) VALUES (
            NEW.id,
            COALESCE((NEW.metadata->>'initial_stock')::INTEGER, 0),
            0,
            COALESCE((NEW.metadata->>'low_stock_threshold')::INTEGER, 10),
            COALESCE((NEW.metadata->>'reorder_point')::INTEGER, 5)
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create inventory when product is created
DROP TRIGGER IF EXISTS trigger_create_initial_inventory ON marketplace_products;
CREATE TRIGGER trigger_create_initial_inventory
    AFTER INSERT ON marketplace_products
    FOR EACH ROW
    EXECUTE FUNCTION create_initial_inventory();

-- Function to update inventory when stock movements are recorded
CREATE OR REPLACE FUNCTION update_inventory_on_movement()
RETURNS TRIGGER AS $$
BEGIN
    -- Update inventory based on movement type
    IF NEW.movement_type = 'in' THEN
        UPDATE marketplace_inventory 
        SET 
            current_stock = current_stock + NEW.quantity,
            last_updated = NOW()
        WHERE product_id = NEW.product_id;
    ELSIF NEW.movement_type = 'out' THEN
        UPDATE marketplace_inventory 
        SET 
            current_stock = current_stock - NEW.quantity,
            last_updated = NOW()
        WHERE product_id = NEW.product_id;
    ELSIF NEW.movement_type = 'reserved' THEN
        UPDATE marketplace_inventory 
        SET 
            reserved_stock = reserved_stock + NEW.quantity,
            last_updated = NOW()
        WHERE product_id = NEW.product_id;
    ELSIF NEW.movement_type = 'released' THEN
        UPDATE marketplace_inventory 
        SET 
            reserved_stock = GREATEST(0, reserved_stock - NEW.quantity),
            last_updated = NOW()
        WHERE product_id = NEW.product_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update inventory on stock movements
DROP TRIGGER IF EXISTS trigger_update_inventory_on_movement ON marketplace_stock_movements;
CREATE TRIGGER trigger_update_inventory_on_movement
    AFTER INSERT ON marketplace_stock_movements
    FOR EACH ROW
    EXECUTE FUNCTION update_inventory_on_movement();

-- Function to check stock availability before order creation
CREATE OR REPLACE FUNCTION check_stock_availability(p_product_id UUID, p_quantity INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    available_qty INTEGER;
    product_type VARCHAR;
BEGIN
    -- Get product type
    SELECT type INTO product_type
    FROM marketplace_products
    WHERE id = p_product_id;
    
    -- Digital products have unlimited stock
    IF product_type = 'digital' THEN
        RETURN TRUE;
    END IF;
    
    -- Check physical product stock
    SELECT available_stock INTO available_qty
    FROM marketplace_inventory
    WHERE product_id = p_product_id;
    
    -- If no inventory record exists, assume no stock
    IF available_qty IS NULL THEN
        RETURN FALSE;
    END IF;
    
    RETURN available_qty >= p_quantity;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON marketplace_inventory TO authenticated;
GRANT SELECT, INSERT ON marketplace_stock_movements TO authenticated;
GRANT EXECUTE ON FUNCTION check_stock_availability(UUID, INTEGER) TO authenticated;