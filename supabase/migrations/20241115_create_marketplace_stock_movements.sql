-- Create marketplace_stock_movements table for inventory tracking
CREATE TABLE IF NOT EXISTS marketplace_stock_movements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES marketplace_products(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('reserved', 'sold', 'released', 'restocked')),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  reason TEXT,
  reference_id UUID, -- References order ID for reservations/sales
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_marketplace_stock_movements_product_id ON marketplace_stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_stock_movements_reference_id ON marketplace_stock_movements(reference_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_stock_movements_created_by ON marketplace_stock_movements(created_by);
CREATE INDEX IF NOT EXISTS idx_marketplace_stock_movements_movement_type ON marketplace_stock_movements(movement_type);

-- Enable RLS
ALTER TABLE marketplace_stock_movements ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view stock movements for products they own or purchased" ON marketplace_stock_movements
  FOR SELECT USING (
    created_by = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM marketplace_products 
      WHERE marketplace_products.id = product_id 
      AND marketplace_products.seller_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM marketplace_orders 
      WHERE marketplace_orders.id = reference_id 
      AND marketplace_orders.buyer_id = auth.uid()
    )
  );

CREATE POLICY "Users can create stock movements for their products" ON marketplace_stock_movements
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM marketplace_products 
      WHERE marketplace_products.id = product_id 
      AND marketplace_products.seller_id = auth.uid()
    ) OR
    created_by = auth.uid()
  );

CREATE POLICY "Users can update stock movements for their products" ON marketplace_stock_movements
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM marketplace_products 
      WHERE marketplace_products.id = product_id 
      AND marketplace_products.seller_id = auth.uid()
    )
  );

-- Grant permissions
GRANT SELECT ON marketplace_stock_movements TO anon, authenticated;
GRANT INSERT ON marketplace_stock_movements TO authenticated;
GRANT UPDATE ON marketplace_stock_movements TO authenticated;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_marketplace_stock_movements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_marketplace_stock_movements_updated_at ON marketplace_stock_movements;
CREATE TRIGGER update_marketplace_stock_movements_updated_at
  BEFORE UPDATE ON marketplace_stock_movements
  FOR EACH ROW
  EXECUTE FUNCTION update_marketplace_stock_movements_updated_at();