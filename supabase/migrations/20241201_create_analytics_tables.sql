-- Create analytics tables for real-time dashboard tracking
-- This migration creates the necessary tables for product analytics, customer analytics, and view tracking

-- Product Analytics Table
CREATE TABLE IF NOT EXISTS product_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES marketplace_products(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  views INTEGER DEFAULT 0,
  unique_views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  messages INTEGER DEFAULT 0,
  orders INTEGER DEFAULT 0,
  revenue DECIMAL(10,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, date)
);

-- Customer Analytics Table
CREATE TABLE IF NOT EXISTS customer_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first_purchase_date TIMESTAMP WITH TIME ZONE,
  last_purchase_date TIMESTAMP WITH TIME ZONE,
  total_orders INTEGER DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0.00,
  average_order_value DECIMAL(10,2) DEFAULT 0.00,
  lifetime_value DECIMAL(10,2) DEFAULT 0.00,
  engagement_score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(customer_id, seller_id)
);

-- Product View Logs Table for detailed tracking
CREATE TABLE IF NOT EXISTS product_view_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES marketplace_products(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  country TEXT,
  region TEXT,
  city TEXT,
  age_group TEXT,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Traffic Sources Table
CREATE TABLE IF NOT EXISTS traffic_sources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  medium TEXT,
  campaign TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  visits INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(seller_id, source, date)
);

-- Demographics Table
CREATE TABLE IF NOT EXISTS customer_demographics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  age_group TEXT NOT NULL,
  gender TEXT,
  country TEXT,
  region TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(seller_id, age_group, country, date)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_product_analytics_seller_date ON product_analytics(seller_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_product_analytics_product_date ON product_analytics(product_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_customer_analytics_seller ON customer_analytics(seller_id);
CREATE INDEX IF NOT EXISTS idx_product_view_logs_product ON product_view_logs(product_id);
CREATE INDEX IF NOT EXISTS idx_product_view_logs_seller_date ON product_view_logs(seller_id, viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_traffic_sources_seller_date ON traffic_sources(seller_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_demographics_seller_date ON customer_demographics(seller_id, date DESC);

-- Enable Row Level Security
ALTER TABLE product_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_view_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE traffic_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_demographics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for product_analytics
CREATE POLICY "Sellers can view their own product analytics" ON product_analytics
  FOR SELECT USING (seller_id = auth.uid());

CREATE POLICY "Sellers can insert their own product analytics" ON product_analytics
  FOR INSERT WITH CHECK (seller_id = auth.uid());

CREATE POLICY "Sellers can update their own product analytics" ON product_analytics
  FOR UPDATE USING (seller_id = auth.uid());

-- RLS Policies for customer_analytics
CREATE POLICY "Sellers can view their own customer analytics" ON customer_analytics
  FOR SELECT USING (seller_id = auth.uid());

CREATE POLICY "Sellers can insert their own customer analytics" ON customer_analytics
  FOR INSERT WITH CHECK (seller_id = auth.uid());

CREATE POLICY "Sellers can update their own customer analytics" ON customer_analytics
  FOR UPDATE USING (seller_id = auth.uid());

-- RLS Policies for product_view_logs
CREATE POLICY "Sellers can view their own product view logs" ON product_view_logs
  FOR SELECT USING (seller_id = auth.uid());

CREATE POLICY "Anyone can insert product view logs" ON product_view_logs
  FOR INSERT WITH CHECK (true);

-- RLS Policies for traffic_sources
CREATE POLICY "Sellers can view their own traffic sources" ON traffic_sources
  FOR SELECT USING (seller_id = auth.uid());

CREATE POLICY "Sellers can manage their own traffic sources" ON traffic_sources
  FOR ALL USING (seller_id = auth.uid());

-- RLS Policies for customer_demographics
CREATE POLICY "Sellers can view their own demographics" ON customer_demographics
  FOR SELECT USING (seller_id = auth.uid());

CREATE POLICY "Sellers can manage their own demographics" ON customer_demographics
  FOR ALL USING (seller_id = auth.uid());

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON product_analytics TO authenticated;
GRANT SELECT, INSERT, UPDATE ON customer_analytics TO authenticated;
GRANT SELECT, INSERT ON product_view_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON traffic_sources TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON customer_demographics TO authenticated;

-- Grant permissions to anon users for view tracking
GRANT INSERT ON product_view_logs TO anon;