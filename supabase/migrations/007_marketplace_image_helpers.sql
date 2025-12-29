-- Migration: Marketplace Image Helper Functions and Views
-- Description: Add helper functions and views to work with storage bucket URLs

-- Create a view that includes full image URLs
CREATE OR REPLACE VIEW marketplace_products_with_images AS
SELECT 
  p.*,
  CASE 
    WHEN p.images IS NOT NULL AND array_length(p.images, 1) > 0 THEN
      array(
        SELECT get_marketplace_image_url(unnest(p.images))
      )
    ELSE 
      ARRAY[]::text[]
  END AS image_urls,
  CASE 
    WHEN p.images IS NOT NULL AND array_length(p.images, 1) > 0 THEN
      get_marketplace_image_url(p.images[1])
    ELSE 
      NULL
  END AS primary_image_url
FROM marketplace_products p;

-- Grant permissions on the view
GRANT SELECT ON marketplace_products_with_images TO authenticated, anon;

-- Create function to add image to product
CREATE OR REPLACE FUNCTION add_product_image(
  product_id uuid,
  image_path text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user owns the product
  IF NOT EXISTS (
    SELECT 1 FROM marketplace_products 
    WHERE id = product_id AND seller_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'You can only add images to your own products';
  END IF;
  
  -- Add image to the images array
  UPDATE marketplace_products 
  SET 
    images = COALESCE(images, ARRAY[]::text[]) || ARRAY[image_path],
    updated_at = now()
  WHERE id = product_id;
  
  RETURN TRUE;
END;
$$;

-- Create function to remove image from product
CREATE OR REPLACE FUNCTION remove_product_image(
  product_id uuid,
  image_path text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user owns the product
  IF NOT EXISTS (
    SELECT 1 FROM marketplace_products 
    WHERE id = product_id AND seller_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'You can only remove images from your own products';
  END IF;
  
  -- Remove image from the images array
  UPDATE marketplace_products 
  SET 
    images = array_remove(images, image_path),
    updated_at = now()
  WHERE id = product_id;
  
  RETURN TRUE;
END;
$$;

-- Create function to reorder product images
CREATE OR REPLACE FUNCTION reorder_product_images(
  product_id uuid,
  new_image_order text[]
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user owns the product
  IF NOT EXISTS (
    SELECT 1 FROM marketplace_products 
    WHERE id = product_id AND seller_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'You can only reorder images for your own products';
  END IF;
  
  -- Update the images array with new order
  UPDATE marketplace_products 
  SET 
    images = new_image_order,
    updated_at = now()
  WHERE id = product_id;
  
  RETURN TRUE;
END;
$$;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION add_product_image(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION remove_product_image(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION reorder_product_images(uuid, text[]) TO authenticated;

-- Create a function to generate upload path for product images
CREATE OR REPLACE FUNCTION generate_product_image_path(
  product_id uuid,
  file_extension text DEFAULT 'jpg'
)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  user_id uuid;
  timestamp_str text;
  random_str text;
BEGIN
  user_id := auth.uid();
  
  IF user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;
  
  -- Generate timestamp string
  timestamp_str := to_char(now(), 'YYYYMMDDHH24MISS');
  
  -- Generate random string
  random_str := substr(gen_random_uuid()::text, 1, 8);
  
  -- Return path: user_id/product_id/timestamp_random.extension
  RETURN user_id::text || '/' || product_id::text || '/' || timestamp_str || '_' || random_str || '.' || file_extension;
END;
$$;

-- Grant execute permission on the path generation function
GRANT EXECUTE ON FUNCTION generate_product_image_path(uuid, text) TO authenticated;

-- Update the get_marketplace_image_url function to handle null/empty paths better
CREATE OR REPLACE FUNCTION get_marketplace_image_url(image_path text)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  supabase_url text;
BEGIN
  IF image_path IS NULL OR image_path = '' THEN
    RETURN NULL;
  END IF;
  
  -- Try to get the Supabase URL from settings, fallback to a placeholder
  BEGIN
    supabase_url := current_setting('app.settings.supabase_url', true);
  EXCEPTION
    WHEN OTHERS THEN
      supabase_url := 'your-project.supabase.co';
  END;
  
  RETURN 'https://' || supabase_url || '/storage/v1/object/public/marketplace-images/' || image_path;
END;
$$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_marketplace_products_images ON marketplace_products USING GIN (images);
CREATE INDEX IF NOT EXISTS idx_marketplace_products_seller_status ON marketplace_products (seller_id, status);
CREATE INDEX IF NOT EXISTS idx_marketplace_products_category_status ON marketplace_products (category, status);

-- Add comment to document the image storage approach
COMMENT ON COLUMN marketplace_products.images IS 'Array of image file paths in the marketplace-images storage bucket. Use get_marketplace_image_url() to convert to full URLs.';