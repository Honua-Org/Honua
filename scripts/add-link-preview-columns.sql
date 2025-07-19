-- Add link preview columns to posts table
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS link_preview_url TEXT,
ADD COLUMN IF NOT EXISTS link_preview_title TEXT,
ADD COLUMN IF NOT EXISTS link_preview_description TEXT,
ADD COLUMN IF NOT EXISTS link_preview_image TEXT,
ADD COLUMN IF NOT EXISTS link_preview_domain TEXT;