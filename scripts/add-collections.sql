-- Add collections support to bookmarks
-- This script adds a collections table and modifies the bookmarks table

-- Create collections table
CREATE TABLE IF NOT EXISTS collections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#10B981', -- Default green color
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, name)
);

-- Add collection_id to bookmarks table
ALTER TABLE bookmarks ADD COLUMN IF NOT EXISTS collection_id UUID REFERENCES collections(id) ON DELETE SET NULL;

-- Enable RLS for collections
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;

-- Create policies for collections
DROP POLICY IF EXISTS "Users can view own collections" ON collections;
CREATE POLICY "Users can view own collections" ON collections
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own collections" ON collections;
CREATE POLICY "Users can insert their own collections" ON collections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own collections" ON collections;
CREATE POLICY "Users can update own collections" ON collections
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own collections" ON collections;
CREATE POLICY "Users can delete own collections" ON collections
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS collections_user_id_idx ON collections(user_id);
CREATE INDEX IF NOT EXISTS collections_created_at_idx ON collections(created_at DESC);
CREATE INDEX IF NOT EXISTS bookmarks_collection_id_idx ON bookmarks(collection_id);

-- Create a default "General" collection for existing bookmarks
INSERT INTO collections (user_id, name, description, color)
SELECT DISTINCT user_id, 'General', 'Default collection for bookmarks', '#10B981'
FROM bookmarks
WHERE NOT EXISTS (
  SELECT 1 FROM collections 
  WHERE collections.user_id = bookmarks.user_id 
  AND collections.name = 'General'
);

-- Update existing bookmarks to use the General collection
UPDATE bookmarks 
SET collection_id = (
  SELECT id FROM collections 
  WHERE collections.user_id = bookmarks.user_id 
  AND collections.name = 'General'
)
WHERE collection_id IS NULL;