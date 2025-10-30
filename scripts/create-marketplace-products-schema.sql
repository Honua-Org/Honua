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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_marketplace_products_seller_id ON marketplace_products(seller_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_products_category ON marketplace_products(category);
CREATE INDEX IF NOT EXISTS idx_marketplace_products_type ON marketplace_products(type);
CREATE INDEX IF NOT EXISTS idx_marketplace_products_status ON marketplace_products(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_products_created_at ON marketplace_products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_marketplace_products_price ON marketplace_products(price);

-- Create GIN indexes for array columns
CREATE INDEX IF NOT EXISTS idx_marketplace_products_tags ON marketplace_products USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_marketplace_products_sustainability ON marketplace_products USING GIN(sustainability_features);

-- Create full-text search index
CREATE INDEX IF NOT EXISTS idx_marketplace_products_search ON marketplace_products USING GIN(to_tsvector('english', title || ' ' || description));

-- Create product categories table for better organization
CREATE TABLE IF NOT EXISTS marketplace_categories (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  icon VARCHAR(10),
  description TEXT,
  parent_id VARCHAR(50) REFERENCES marketplace_categories(id),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default categories
INSERT INTO marketplace_categories (id, name, icon, description) VALUES
  ('electronics', 'Electronics', '📱', 'Sustainable electronics and gadgets'),
  ('home', 'Home & Garden', '🏠', 'Eco-friendly home and garden products'),
  ('clothing', 'Sustainable Fashion', '👕', 'Ethical and sustainable clothing'),
  ('food', 'Organic Food', '🥬', 'Organic and locally sourced food'),
  ('consulting', 'Consulting', '💡', 'Professional consulting services'),
  ('software', 'Software', '💻', 'Digital products and software'),
  ('education', 'Education', '📚', 'Educational services and materials'),
  ('health', 'Health & Wellness', '🌿', 'Health and wellness products/services'),
  ('transport', 'Transportation', '🚲', 'Sustainable transportation options'),
  ('energy', 'Renewable Energy', '⚡', 'Renewable energy products and services')
ON CONFLICT (id) DO NOTHING;

-- Create product likes table
CREATE TABLE IF NOT EXISTS marketplace_product_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES marketplace_products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, user_id)
);

-- Create indexes for likes
CREATE INDEX IF NOT EXISTS idx_marketplace_product_likes_product_id ON marketplace_product_likes(product_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_product_likes_user_id ON marketplace_product_likes(user_id);

-- Create product views table for analytics
CREATE TABLE IF NOT EXISTS marketplace_product_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES marketplace_products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for views
CREATE INDEX IF NOT EXISTS idx_marketplace_product_views_product_id ON marketplace_product_views(product_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_product_views_created_at ON marketplace_product_views(created_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_marketplace_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER trigger_update_marketplace_products_updated_at
  BEFORE UPDATE ON marketplace_products
  FOR EACH ROW
  EXECUTE FUNCTION update_marketplace_products_updated_at();

-- Function to update likes count
CREATE OR REPLACE FUNCTION update_product_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE marketplace_products 
    SET likes_count = likes_count + 1 
    WHERE id = NEW.product_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE marketplace_products 
    SET likes_count = likes_count - 1 
    WHERE id = OLD.product_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Triggers for likes count
CREATE TRIGGER trigger_product_like_insert
  AFTER INSERT ON marketplace_product_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_product_likes_count();

CREATE TRIGGER trigger_product_like_delete
  AFTER DELETE ON marketplace_product_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_product_likes_count();

-- Function to update views count (called daily via cron or manually)
CREATE OR REPLACE FUNCTION update_product_views_count()
RETURNS void AS $$
BEGIN
  UPDATE marketplace_products 
  SET views_count = (
    SELECT COUNT(*) 
    FROM marketplace_product_views 
    WHERE marketplace_product_views.product_id = marketplace_products.id
  );
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE marketplace_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_product_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_product_views ENABLE ROW LEVEL SECURITY;

-- Products policies
CREATE POLICY "Products are viewable by everyone" ON marketplace_products
  FOR SELECT USING (status = 'active');

CREATE POLICY "Users can insert their own products" ON marketplace_products
  FOR INSERT WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Users can update their own products" ON marketplace_products
  FOR UPDATE USING (auth.uid() = seller_id);

CREATE POLICY "Users can delete their own products" ON marketplace_products
  FOR DELETE USING (auth.uid() = seller_id);

-- Categories policies
CREATE POLICY "Categories are viewable by everyone" ON marketplace_categories
  FOR SELECT USING (is_active = true);

-- Likes policies
CREATE POLICY "Likes are viewable by everyone" ON marketplace_product_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own likes" ON marketplace_product_likes
  FOR ALL USING (auth.uid() = user_id);

-- Views policies
CREATE POLICY "Users can insert product views" ON marketplace_product_views
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view their own views" ON marketplace_product_views
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for product images
CREATE POLICY "Product images are publicly viewable" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "Users can upload product images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'product-images' AND 
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = 'marketplace-products' AND
    (storage.foldername(name))[2] = auth.uid()::text
  );

CREATE POLICY "Users can update their own product images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'product-images' AND 
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = 'marketplace-products' AND
    (storage.foldername(name))[2] = auth.uid()::text
  );

CREATE POLICY "Users can delete their own product images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'product-images' AND 
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = 'marketplace-products' AND
    (storage.foldername(name))[2] = auth.uid()::text
  );