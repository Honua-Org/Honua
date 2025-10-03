-- Migration: Fix Marketplace Storage Bucket and Real-time Setup
-- Description: Create storage bucket for product images and enable real-time subscriptions (with conflict handling)

-- Create storage bucket for marketplace product images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'marketplace-images',
  'marketplace-images',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can upload marketplace images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view marketplace images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own marketplace images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own marketplace images" ON storage.objects;

-- Storage policies for marketplace images bucket
-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload marketplace images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'marketplace-images' AND
  auth.role() = 'authenticated'
);

-- Allow public read access to marketplace images
CREATE POLICY "Public can view marketplace images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'marketplace-images');

-- Allow users to update their own uploaded images
CREATE POLICY "Users can update their own marketplace images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'marketplace-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'marketplace-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own uploaded images
CREATE POLICY "Users can delete their own marketplace images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'marketplace-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Enable real-time for marketplace tables (ignore errors if already enabled)
DO $$
BEGIN
  -- Enable real-time for marketplace_products
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE marketplace_products;
  EXCEPTION WHEN duplicate_object THEN
    -- Table already added to publication
  END;
  
  -- Enable real-time for marketplace_orders
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE marketplace_orders;
  EXCEPTION WHEN duplicate_object THEN
    -- Table already added to publication
  END;
  
  -- Enable real-time for marketplace_messages
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE marketplace_messages;
  EXCEPTION WHEN duplicate_object THEN
    -- Table already added to publication
  END;
  
  -- Enable real-time for marketplace_conversations
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE marketplace_conversations;
  EXCEPTION WHEN duplicate_object THEN
    -- Table already added to publication
  END;
  
  -- Enable real-time for marketplace_inventory
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE marketplace_inventory;
  EXCEPTION WHEN duplicate_object THEN
    -- Table already added to publication
  END;
  
  -- Enable real-time for marketplace_favorites
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE marketplace_favorites;
  EXCEPTION WHEN duplicate_object THEN
    -- Table already added to publication
  END;
  
  -- Enable real-time for marketplace_cart
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE marketplace_cart;
  EXCEPTION WHEN duplicate_object THEN
    -- Table already added to publication
  END;
END $$;

-- Grant permissions for storage bucket
GRANT ALL ON storage.objects TO authenticated;
GRANT SELECT ON storage.objects TO anon;

-- Grant permissions for marketplace tables to ensure real-time works
GRANT SELECT, INSERT, UPDATE, DELETE ON marketplace_products TO authenticated;
GRANT SELECT ON marketplace_products TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON marketplace_orders TO authenticated;
GRANT SELECT ON marketplace_orders TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON marketplace_messages TO authenticated;
GRANT SELECT ON marketplace_messages TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON marketplace_conversations TO authenticated;
GRANT SELECT ON marketplace_conversations TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON marketplace_inventory TO authenticated;
GRANT SELECT ON marketplace_inventory TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON marketplace_favorites TO authenticated;
GRANT SELECT ON marketplace_favorites TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON marketplace_cart TO authenticated;
GRANT SELECT ON marketplace_cart TO anon;

-- Create or replace function to get storage URL for images
CREATE OR REPLACE FUNCTION get_marketplace_image_url(image_path text)
RETURNS text
LANGUAGE plpgsql
AS $$
BEGIN
  IF image_path IS NULL OR image_path = '' THEN
    RETURN NULL;
  END IF;
  
  RETURN 'https://' || current_setting('app.settings.supabase_url', true) || '/storage/v1/object/public/marketplace-images/' || image_path;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_marketplace_image_url(text) TO authenticated, anon;