-- Marketplace Inventory Management Schema Migration
-- This creates the inventory tracking system for marketplace products

-- Create marketplace_inventory table
CREATE TABLE IF NOT EXISTS marketplace_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES marketplace_products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    reserved_quantity INTEGER NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0),
    available_quantity INTEGER GENERATED ALWAYS AS (quantity - reserved_quantity) STORED,
    low_stock_threshold INTEGER DEFAULT 5,
    reorder_point INTEGER DEFAULT 10,
    max_stock_level INTEGER,
    cost_per_unit DECIMAL(10,2),
    supplier_info JSONB DEFAULT '{}',
    location TEXT,
    batch_number TEXT,
    expiry_date DATE,
    last_restocked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(product_id)
);

-- Create inventory_transactions table for tracking stock movements
CREATE TABLE IF NOT EXISTS inventory_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES marketplace_products(id) ON DELETE CASCADE,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('restock', 'sale', 'reserve', 'release', 'adjustment', 'return')),
    quantity_change INTEGER NOT NULL,
    previous_quantity INTEGER NOT NULL,
    new_quantity INTEGER NOT NULL,
    reference_id UUID, -- Can reference order_id or other related entities
    reference_type TEXT, -- 'order', 'manual', 'return', etc.
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_marketplace_inventory_product_id ON marketplace_inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_inventory_available_quantity ON marketplace_inventory(available_quantity);
CREATE INDEX IF NOT EXISTS idx_marketplace_inventory_low_stock ON marketplace_inventory(product_id) WHERE available_quantity <= low_stock_threshold;
CREATE INDEX IF NOT EXISTS idx_marketplace_inventory_updated_at ON marketplace_inventory(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_inventory_transactions_product_id ON inventory_transactions(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_type ON inventory_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_reference ON inventory_transactions(reference_id, reference_type);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_created_at ON inventory_transactions(created_at DESC);

-- RLS Policies for marketplace_inventory
ALTER TABLE marketplace_inventory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view inventory for their products" ON marketplace_inventory;
CREATE POLICY "Users can view inventory for their products" ON marketplace_inventory
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM marketplace_products 
            WHERE id = product_id AND seller_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can manage inventory for their products" ON marketplace_inventory;
CREATE POLICY "Users can manage inventory for their products" ON marketplace_inventory
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM marketplace_products 
            WHERE id = product_id AND seller_id = auth.uid()
        )
    );

-- RLS Policies for inventory_transactions
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view transactions for their products" ON inventory_transactions;
CREATE POLICY "Users can view transactions for their products" ON inventory_transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM marketplace_products 
            WHERE id = product_id AND seller_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can create transactions for their products" ON inventory_transactions;
CREATE POLICY "Users can create transactions for their products" ON inventory_transactions
    FOR INSERT WITH CHECK (
        auth.uid() = created_by AND
        EXISTS (
            SELECT 1 FROM marketplace_products 
            WHERE id = product_id AND seller_id = auth.uid()
        )
    );

-- Function to update inventory and create transaction
CREATE OR REPLACE FUNCTION update_inventory(
    p_product_id UUID,
    p_quantity_change INTEGER,
    p_transaction_type TEXT,
    p_reference_id UUID DEFAULT NULL,
    p_reference_type TEXT DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    current_quantity INTEGER;
    new_quantity INTEGER;
BEGIN
    -- Get current quantity
    SELECT quantity INTO current_quantity
    FROM marketplace_inventory
    WHERE product_id = p_product_id;
    
    -- If no inventory record exists, create one
    IF current_quantity IS NULL THEN
        INSERT INTO marketplace_inventory (product_id, quantity)
        VALUES (p_product_id, GREATEST(0, p_quantity_change));
        current_quantity := 0;
    END IF;
    
    -- Calculate new quantity
    new_quantity := current_quantity + p_quantity_change;
    
    -- Ensure quantity doesn't go below 0
    IF new_quantity < 0 THEN
        RAISE EXCEPTION 'Insufficient inventory. Current: %, Requested change: %', current_quantity, p_quantity_change;
    END IF;
    
    -- Update inventory
    UPDATE marketplace_inventory
    SET quantity = new_quantity,
        updated_at = NOW()
    WHERE product_id = p_product_id;
    
    -- Create transaction record
    INSERT INTO inventory_transactions (
        product_id,
        transaction_type,
        quantity_change,
        previous_quantity,
        new_quantity,
        reference_id,
        reference_type,
        notes,
        created_by
    ) VALUES (
        p_product_id,
        p_transaction_type,
        p_quantity_change,
        current_quantity,
        new_quantity,
        p_reference_id,
        p_reference_type,
        p_notes,
        auth.uid()
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reserve inventory for orders
CREATE OR REPLACE FUNCTION reserve_inventory(
    p_product_id UUID,
    p_quantity INTEGER,
    p_order_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    available_qty INTEGER;
BEGIN
    -- Check available quantity
    SELECT available_quantity INTO available_qty
    FROM marketplace_inventory
    WHERE product_id = p_product_id;
    
    IF available_qty IS NULL OR available_qty < p_quantity THEN
        RAISE EXCEPTION 'Insufficient inventory available. Available: %, Requested: %', COALESCE(available_qty, 0), p_quantity;
    END IF;
    
    -- Update reserved quantity
    UPDATE marketplace_inventory
    SET reserved_quantity = reserved_quantity + p_quantity,
        updated_at = NOW()
    WHERE product_id = p_product_id;
    
    -- Create transaction record
    INSERT INTO inventory_transactions (
        product_id,
        transaction_type,
        quantity_change,
        previous_quantity,
        new_quantity,
        reference_id,
        reference_type,
        notes,
        created_by
    ) VALUES (
        p_product_id,
        'reserve',
        -p_quantity,
        (SELECT quantity FROM marketplace_inventory WHERE product_id = p_product_id),
        (SELECT quantity FROM marketplace_inventory WHERE product_id = p_product_id),
        p_order_id,
        'order',
        'Reserved for order',
        auth.uid()
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to release reserved inventory
CREATE OR REPLACE FUNCTION release_inventory(
    p_product_id UUID,
    p_quantity INTEGER,
    p_order_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Update reserved quantity
    UPDATE marketplace_inventory
    SET reserved_quantity = GREATEST(0, reserved_quantity - p_quantity),
        updated_at = NOW()
    WHERE product_id = p_product_id;
    
    -- Create transaction record
    INSERT INTO inventory_transactions (
        product_id,
        transaction_type,
        quantity_change,
        previous_quantity,
        new_quantity,
        reference_id,
        reference_type,
        notes,
        created_by
    ) VALUES (
        p_product_id,
        'release',
        p_quantity,
        (SELECT quantity FROM marketplace_inventory WHERE product_id = p_product_id),
        (SELECT quantity FROM marketplace_inventory WHERE product_id = p_product_id),
        p_order_id,
        'order',
        'Released from order',
        auth.uid()
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to complete sale (reduce actual inventory)
CREATE OR REPLACE FUNCTION complete_sale(
    p_product_id UUID,
    p_quantity INTEGER,
    p_order_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Reduce both quantity and reserved quantity
    UPDATE marketplace_inventory
    SET quantity = quantity - p_quantity,
        reserved_quantity = GREATEST(0, reserved_quantity - p_quantity),
        updated_at = NOW()
    WHERE product_id = p_product_id;
    
    -- Create transaction record
    INSERT INTO inventory_transactions (
        product_id,
        transaction_type,
        quantity_change,
        previous_quantity,
        new_quantity,
        reference_id,
        reference_type,
        notes,
        created_by
    ) VALUES (
        p_product_id,
        'sale',
        -p_quantity,
        (SELECT quantity + p_quantity FROM marketplace_inventory WHERE product_id = p_product_id),
        (SELECT quantity FROM marketplace_inventory WHERE product_id = p_product_id),
        p_order_id,
        'order',
        'Sale completed',
        auth.uid()
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update marketplace_products stock_quantity when inventory changes
CREATE OR REPLACE FUNCTION sync_product_stock()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE marketplace_products
    SET stock_quantity = NEW.available_quantity,
        availability_status = CASE
            WHEN NEW.available_quantity > 0 THEN 'available'
            ELSE 'out_of_stock'
        END,
        updated_at = NOW()
    WHERE id = NEW.product_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_product_stock_trigger ON marketplace_inventory;
CREATE TRIGGER sync_product_stock_trigger
    AFTER INSERT OR UPDATE ON marketplace_inventory
    FOR EACH ROW
    EXECUTE FUNCTION sync_product_stock();

-- View for low stock alerts
CREATE OR REPLACE VIEW low_stock_products AS
SELECT 
    p.id,
    p.name,
    p.seller_id,
    i.available_quantity,
    i.low_stock_threshold,
    i.reorder_point
FROM marketplace_products p
JOIN marketplace_inventory i ON p.id = i.product_id
WHERE i.available_quantity <= i.low_stock_threshold;

-- Grant permissions
GRANT SELECT ON low_stock_products TO authenticated;
GRANT EXECUTE ON FUNCTION update_inventory(UUID, INTEGER, TEXT, UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION reserve_inventory(UUID, INTEGER, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION release_inventory(UUID, INTEGER, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION complete_sale(UUID, INTEGER, UUID) TO authenticated;