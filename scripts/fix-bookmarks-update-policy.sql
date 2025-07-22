-- Fix missing UPDATE policy for bookmarks table
-- This script adds the missing UPDATE policy that allows users to update their own bookmarks
-- This is required for the move bookmark functionality to work

-- Add missing UPDATE policy for bookmarks
DROP POLICY IF EXISTS "Users can update own bookmarks" ON bookmarks;
CREATE POLICY "Users can update own bookmarks" ON bookmarks
  FOR UPDATE USING (auth.uid() = user_id);

-- Verify the policy was created
-- You can run this query to check: SELECT * FROM pg_policies WHERE tablename = 'bookmarks';