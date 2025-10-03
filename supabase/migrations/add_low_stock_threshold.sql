-- Add low_stock_threshold column to marketplace_products table
ALTER TABLE marketplace_products 
ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER DEFAULT 5;

-- Update existing products to have a default low stock threshold
UPDATE marketplace_products 
SET low_stock_threshold = 5 
WHERE low_stock_threshold IS NULL;

-- Add comment to the column
COMMENT ON COLUMN marketplace_products.low_stock_threshold IS 'Threshold for low stock alerts';