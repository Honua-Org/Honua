-- Create marketplace orders table
CREATE TABLE IF NOT EXISTS marketplace_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES marketplace_products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  green_points_used INTEGER DEFAULT 0,
  payment_method VARCHAR(50) NOT NULL,
  payment_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  order_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (order_status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
  shipping_address JSONB,
  tracking_number VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create inventory table
CREATE TABLE IF NOT EXISTS marketplace_inventory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES marketplace_products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0,
  reserved_quantity INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 5,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_buyer_id ON marketplace_orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_seller_id ON marketplace_orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_product_id ON marketplace_orders(product_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_inventory_product_id ON marketplace_inventory(product_id);

-- Enable RLS
ALTER TABLE marketplace_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_inventory ENABLE ROW LEVEL SECURITY;

-- Orders policies
CREATE POLICY "Users can view their own orders" ON marketplace_orders
  FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Users can create orders" ON marketplace_orders
  FOR INSERT WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Sellers can update their orders" ON marketplace_orders
  FOR UPDATE USING (auth.uid() = seller_id);

-- Inventory policies
CREATE POLICY "Inventory is viewable by everyone" ON marketplace_inventory
  FOR SELECT USING (true);

CREATE POLICY "Sellers can manage their inventory" ON marketplace_inventory
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM marketplace_products 
      WHERE marketplace_products.id = marketplace_inventory.product_id 
      AND marketplace_products.seller_id = auth.uid()
    )
  );