-- Fix marketplace_reviews table permissions and RLS policies

-- Grant basic permissions to anon and authenticated roles
GRANT SELECT ON marketplace_reviews TO anon;
GRANT ALL PRIVILEGES ON marketplace_reviews TO authenticated;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON marketplace_reviews;
DROP POLICY IF EXISTS "Users can insert their own reviews" ON marketplace_reviews;
DROP POLICY IF EXISTS "Users can update their own reviews" ON marketplace_reviews;
DROP POLICY IF EXISTS "Users can delete their own reviews" ON marketplace_reviews;

-- Create RLS policies for marketplace_reviews
-- Allow everyone to view reviews (public read access)
CREATE POLICY "Reviews are viewable by everyone" ON marketplace_reviews
    FOR SELECT USING (true);

-- Allow authenticated users to insert reviews
CREATE POLICY "Users can insert their own reviews" ON marketplace_reviews
    FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- Allow users to update their own reviews
CREATE POLICY "Users can update their own reviews" ON marketplace_reviews
    FOR UPDATE USING (auth.uid() = reviewer_id);

-- Allow users to delete their own reviews
CREATE POLICY "Users can delete their own reviews" ON marketplace_reviews
    FOR DELETE USING (auth.uid() = reviewer_id);

-- Ensure RLS is enabled
ALTER TABLE marketplace_reviews ENABLE ROW LEVEL SECURITY;