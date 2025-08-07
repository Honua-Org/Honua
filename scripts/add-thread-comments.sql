-- Add thread_id column to comments table for forum thread comments
-- This allows comments to be associated with either posts or threads

ALTER TABLE comments ADD COLUMN IF NOT EXISTS thread_id UUID REFERENCES threads(id) ON DELETE CASCADE;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS comments_thread_id_idx ON comments(thread_id);

-- Update RLS policies to handle thread comments
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON comments;
CREATE POLICY "Comments are viewable by everyone" ON comments
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own comments" ON comments;
CREATE POLICY "Users can insert their own comments" ON comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own comments" ON comments;
CREATE POLICY "Users can update own comments" ON comments
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own comments" ON comments;
CREATE POLICY "Users can delete own comments" ON comments
  FOR DELETE USING (auth.uid() = user_id);

-- Add constraint to ensure comments are associated with either a post or thread, but not both
ALTER TABLE comments ADD CONSTRAINT comments_post_or_thread_check 
  CHECK ((post_id IS NOT NULL AND thread_id IS NULL) OR (post_id IS NULL AND thread_id IS NOT NULL));