-- Add is_private column to forums table and create INSERT policy

-- Add is_private column if it doesn't exist
ALTER TABLE forums 
ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT FALSE;

-- Add INSERT policy for forums if it doesn't exist
DROP POLICY IF EXISTS "Users can create forums" ON forums;
CREATE POLICY "Users can create forums" ON forums
  FOR INSERT WITH CHECK (auth.uid() = admin_id);