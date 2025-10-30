-- Add inventory management columns to marketplace_products table
ALTER TABLE marketplace_products 
ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS availability_status TEXT DEFAULT 'available';

-- Update availability_status based on quantity
UPDATE marketplace_products 
SET availability_status = CASE 
    WHEN quantity <= 0 THEN 'out_of_stock'
    ELSE 'available'
END
WHERE type = 'physical';

-- Create index for better performance on inventory queries
CREATE INDEX IF NOT EXISTS idx_marketplace_products_quantity ON marketplace_products(quantity);
CREATE INDEX IF NOT EXISTS idx_marketplace_products_availability ON marketplace_products(availability_status);

-- Grant permissions to anon and authenticated roles
GRANT SELECT, UPDATE ON marketplace_products TO anon;
GRANT SELECT, UPDATE ON marketplace_products TO authenticated;

-- Enable Row Level Security (RLS) if not already enabled
ALTER TABLE marketplace_products ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for inventory management
-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can view all products" ON marketplace_products;
DROP POLICY IF EXISTS "Users can update their own products" ON marketplace_products;

-- Create new policies
CREATE POLICY "Users can view all products" ON marketplace_products
    FOR SELECT USING (true);

CREATE POLICY "Users can update their own products" ON marketplace_products
    FOR UPDATE USING (auth.uid() = seller_id);

-- Refresh the table statistics for better query performance
ANALYZE marketplace_products;