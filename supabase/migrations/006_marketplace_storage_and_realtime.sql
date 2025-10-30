-- Migration: Marketplace Storage Bucket and Real-time Setup
-- Description: Create storage bucket for product images and enable real-time subscriptions

-- Create storage bucket for marketplace product images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'marketplace-images',
  'marketplace-images',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

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

-- Enable real-time for marketplace tables
-- Enable real-time for marketplace_products
ALTER PUBLICATION supabase_realtime ADD TABLE marketplace_products;

-- Enable real-time for marketplace_orders
ALTER PUBLICATION supabase_realtime ADD TABLE marketplace_orders;

-- Enable real-time for marketplace_messages
ALTER PUBLICATION supabase_realtime ADD TABLE marketplace_messages;

-- Enable real-time for marketplace_conversations
ALTER PUBLICATION supabase_realtime ADD TABLE marketplace_conversations;

-- Enable real-time for marketplace_inventory (for stock updates)
ALTER PUBLICATION supabase_realtime ADD TABLE marketplace_inventory;

-- Enable real-time for marketplace_favorites (for wishlist updates)
ALTER PUBLICATION supabase_realtime ADD TABLE marketplace_favorites;

-- Enable real-time for marketplace_cart (for cart updates)
ALTER PUBLICATION supabase_realtime ADD TABLE marketplace_cart;

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

-- Create function to get storage URL for images
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