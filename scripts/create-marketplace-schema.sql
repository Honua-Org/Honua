-- Marketplace Database Schema
-- This script creates the necessary tables for the marketplace system

-- Create marketplace_orders table
CREATE TABLE IF NOT EXISTS marketplace_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    buyer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    seller_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    product_id UUID REFERENCES marketplace_products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    green_points_used INTEGER DEFAULT 0,
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('green_points', 'mixed', 'stripe')),
    payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
    order_status VARCHAR(50) DEFAULT 'pending' CHECK (order_status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
    shipping_address JSONB,
    tracking_number VARCHAR(255),
    stripe_payment_intent_id VARCHAR(255),
    notes TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create marketplace_reviews table
CREATE TABLE IF NOT EXISTS marketplace_reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID REFERENCES marketplace_products(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    order_id UUID REFERENCES marketplace_orders(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    content TEXT,
    images TEXT[],
    verified_purchase BOOLEAN DEFAULT FALSE,
    helpful_votes INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'hidden', 'flagged')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(product_id, reviewer_id, order_id)
);

-- Create marketplace_categories table
CREATE TABLE IF NOT EXISTS marketplace_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(7), -- Hex color code
    parent_id UUID REFERENCES marketplace_categories(id) ON DELETE CASCADE,
    sort_order INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create marketplace_favorites table
CREATE TABLE IF NOT EXISTS marketplace_favorites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    product_id UUID REFERENCES marketplace_products(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, product_id)
);

-- Create marketplace_cart table
CREATE TABLE IF NOT EXISTS marketplace_cart (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    product_id UUID REFERENCES marketplace_products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, product_id)
);

-- Update marketplace_products table to add missing columns
ALTER TABLE marketplace_products ADD COLUMN IF NOT EXISTS title VARCHAR(255);
ALTER TABLE marketplace_products ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'physical' CHECK (type IN ('physical', 'digital', 'service'));
ALTER TABLE marketplace_products ADD COLUMN IF NOT EXISTS green_points_price INTEGER;
ALTER TABLE marketplace_products ADD COLUMN IF NOT EXISTS location VARCHAR(255);
ALTER TABLE marketplace_products ADD COLUMN IF NOT EXISTS digital_delivery_info JSONB;
ALTER TABLE marketplace_products ADD COLUMN IF NOT EXISTS service_duration VARCHAR(100);
ALTER TABLE marketplace_products ADD COLUMN IF NOT EXISTS service_location_type VARCHAR(50);
ALTER TABLE marketplace_products ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;
ALTER TABLE marketplace_products ADD COLUMN IF NOT EXISTS favorites_count INTEGER DEFAULT 0;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_buyer_id ON marketplace_orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_seller_id ON marketplace_orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_product_id ON marketplace_orders(product_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_created_at ON marketplace_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_status ON marketplace_orders(order_status);

CREATE INDEX IF NOT EXISTS idx_marketplace_reviews_product_id ON marketplace_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_reviews_reviewer_id ON marketplace_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_reviews_rating ON marketplace_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_marketplace_reviews_created_at ON marketplace_reviews(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_marketplace_categories_parent_id ON marketplace_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_categories_slug ON marketplace_categories(slug);
CREATE INDEX IF NOT EXISTS idx_marketplace_categories_active ON marketplace_categories(active);

CREATE INDEX IF NOT EXISTS idx_marketplace_favorites_user_id ON marketplace_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_favorites_product_id ON marketplace_favorites(product_id);

CREATE INDEX IF NOT EXISTS idx_marketplace_cart_user_id ON marketplace_cart(user_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_cart_product_id ON marketplace_cart(product_id);

CREATE INDEX IF NOT EXISTS idx_marketplace_products_seller_id ON marketplace_products(seller_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_products_category ON marketplace_products(category);
CREATE INDEX IF NOT EXISTS idx_marketplace_products_type ON marketplace_products(type);
CREATE INDEX IF NOT EXISTS idx_marketplace_products_status ON marketplace_products(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_products_created_at ON marketplace_products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_marketplace_products_price ON marketplace_products(price);
CREATE INDEX IF NOT EXISTS idx_marketplace_products_green_points_price ON marketplace_products(green_points_price);

-- Enable Row Level Security
ALTER TABLE marketplace_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_cart ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for marketplace_orders
DROP POLICY IF EXISTS "Users can view their own orders" ON marketplace_orders;
CREATE POLICY "Users can view their own orders" ON marketplace_orders
    FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

DROP POLICY IF EXISTS "Users can create orders as buyers" ON marketplace_orders;
CREATE POLICY "Users can create orders as buyers" ON marketplace_orders
    FOR INSERT WITH CHECK (auth.uid() = buyer_id);

DROP POLICY IF EXISTS "Sellers can update their orders" ON marketplace_orders;
CREATE POLICY "Sellers can update their orders" ON marketplace_orders
    FOR UPDATE USING (auth.uid() = seller_id);

-- Create RLS policies for marketplace_reviews
DROP POLICY IF EXISTS "Everyone can view active reviews" ON marketplace_reviews;
CREATE POLICY "Everyone can view active reviews" ON marketplace_reviews
    FOR SELECT USING (status = 'active');

DROP POLICY IF EXISTS "Users can create reviews for their purchases" ON marketplace_reviews;
CREATE POLICY "Users can create reviews for their purchases" ON marketplace_reviews
    FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

DROP POLICY IF EXISTS "Users can update their own reviews" ON marketplace_reviews;
CREATE POLICY "Users can update their own reviews" ON marketplace_reviews
    FOR UPDATE USING (auth.uid() = reviewer_id);

-- Create RLS policies for marketplace_categories
DROP POLICY IF EXISTS "Everyone can view active categories" ON marketplace_categories;
CREATE POLICY "Everyone can view active categories" ON marketplace_categories
    FOR SELECT USING (active = true);

DROP POLICY IF EXISTS "Only admins can manage categories" ON marketplace_categories;
CREATE POLICY "Only admins can manage categories" ON marketplace_categories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Create RLS policies for marketplace_favorites
DROP POLICY IF EXISTS "Users can manage their own favorites" ON marketplace_favorites;
CREATE POLICY "Users can manage their own favorites" ON marketplace_favorites
    FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for marketplace_cart
DROP POLICY IF EXISTS "Users can manage their own cart" ON marketplace_cart;
CREATE POLICY "Users can manage their own cart" ON marketplace_cart
    FOR ALL USING (auth.uid() = user_id);

-- Insert default categories
INSERT INTO marketplace_categories (name, slug, description, icon, color) VALUES
('Sustainable Products', 'sustainable-products', 'Eco-friendly and sustainable physical products', '🌱', '#22c55e'),
('Digital Services', 'digital-services', 'Digital products and online services', '💻', '#3b82f6'),
('Consulting', 'consulting', 'Professional consulting and advisory services', '🤝', '#8b5cf6'),
('Education', 'education', 'Educational content and courses', '📚', '#f59e0b'),
('Health & Wellness', 'health-wellness', 'Health and wellness products and services', '🏥', '#ef4444'),
('Home & Garden', 'home-garden', 'Sustainable home and garden products', '🏡', '#10b981'),
('Fashion', 'fashion', 'Sustainable fashion and accessories', '👕', '#ec4899'),
('Food & Beverage', 'food-beverage', 'Organic and sustainable food products', '🍎', '#84cc16'),
('Technology', 'technology', 'Green technology and eco-friendly gadgets', '⚡', '#06b6d4'),
('Transportation', 'transportation', 'Sustainable transportation solutions', '🚲', '#6366f1')
ON CONFLICT (slug) DO NOTHING;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_marketplace_orders_updated_at ON marketplace_orders;
CREATE TRIGGER update_marketplace_orders_updated_at
    BEFORE UPDATE ON marketplace_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_marketplace_reviews_updated_at ON marketplace_reviews;
CREATE TRIGGER update_marketplace_reviews_updated_at
    BEFORE UPDATE ON marketplace_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_marketplace_cart_updated_at ON marketplace_cart;
CREATE TRIGGER update_marketplace_cart_updated_at
    BEFORE UPDATE ON marketplace_cart
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT ALL ON marketplace_orders TO authenticated;
GRANT ALL ON marketplace_reviews TO authenticated;
GRANT SELECT ON marketplace_categories TO authenticated;
GRANT ALL ON marketplace_favorites TO authenticated;
GRANT ALL ON marketplace_cart TO authenticated;