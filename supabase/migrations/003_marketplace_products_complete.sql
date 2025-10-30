-- Marketplace Storage Setup Migration
-- This ensures the storage bucket for product images is properly configured

-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for product images
DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;
CREATE POLICY "Public can view product images" ON storage.objects
    FOR SELECT USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;
CREATE POLICY "Authenticated users can upload product images" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'product-images' AND
        auth.role() = 'authenticated'
    );

DROP POLICY IF EXISTS "Users can update their own product images" ON storage.objects;
CREATE POLICY "Users can update their own product images" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'product-images' AND
        auth.role() = 'authenticated'
    );

DROP POLICY IF EXISTS "Users can delete their own product images" ON storage.objects;
CREATE POLICY "Users can delete their own product images" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'product-images' AND
        auth.role() = 'authenticated'
    );

-- Ensure marketplace_products table has proper RLS policies
ALTER TABLE marketplace_products ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Public can view active products" ON marketplace_products;
CREATE POLICY "Public can view active products" ON marketplace_products
    FOR SELECT USING (status = 'active' AND availability_status = 'available');

DROP POLICY IF EXISTS "Users can view their own products" ON marketplace_products;
CREATE POLICY "Users can view their own products" ON marketplace_products
    FOR SELECT USING (auth.uid() = seller_id);

DROP POLICY IF EXISTS "Users can create products" ON marketplace_products;
CREATE POLICY "Users can create products" ON marketplace_products
    FOR INSERT WITH CHECK (auth.uid() = seller_id);

DROP POLICY IF EXISTS "Users can update their own products" ON marketplace_products;
CREATE POLICY "Users can update their own products" ON marketplace_products
    FOR UPDATE USING (auth.uid() = seller_id);

DROP POLICY IF EXISTS "Users can delete their own products" ON marketplace_products;
CREATE POLICY "Users can delete their own products" ON marketplace_products
    FOR DELETE USING (auth.uid() = seller_id);