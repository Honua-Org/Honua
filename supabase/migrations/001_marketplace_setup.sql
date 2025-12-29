-- Create marketplace products table
CREATE TABLE IF NOT EXISTS marketplace_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  category VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('physical', 'digital', 'service')),
  images TEXT[] DEFAULT '{}',
  location VARCHAR(255),
  green_points_price INTEGER NOT NULL DEFAULT 0,
  sustainability_features TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  shipping_info TEXT,
  digital_delivery_info TEXT,
  service_duration VARCHAR(100),
  service_location_type VARCHAR(20) CHECK (service_location_type IN ('remote', 'in-person', 'both')),
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'sold', 'draft')),
  views_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_marketplace_products_seller_id ON marketplace_products(seller_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_products_category ON marketplace_products(category);
CREATE INDEX IF NOT EXISTS idx_marketplace_products_status ON marketplace_products(status);

-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE marketplace_products ENABLE ROW LEVEL SECURITY;

-- Basic policies
CREATE POLICY "Products are viewable by everyone" ON marketplace_products
  FOR SELECT USING (status = 'active');

CREATE POLICY "Users can insert their own products" ON marketplace_products
  FOR INSERT WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Users can update their own products" ON marketplace_products
  FOR UPDATE USING (auth.uid() = seller_id);

-- Storage policies
CREATE POLICY "Product images are publicly viewable" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "Users can upload product images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'product-images' AND 
    auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update their own product images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'product-images' AND 
    auth.role() = 'authenticated'
  );

CREATE POLICY "Users can delete their own product images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'product-images' AND 
    auth.role() = 'authenticated'
  );