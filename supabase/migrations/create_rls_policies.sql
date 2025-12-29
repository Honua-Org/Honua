-- Create RLS policies for auth.users table access
-- This allows authenticated users to read user data for analytics

-- Enable RLS on auth.users if not already enabled
-- Note: auth.users already has RLS enabled by default

-- Create policy to allow authenticated users to read user data
-- This is needed for customer analytics that join with auth.users
DROP POLICY IF EXISTS "Allow authenticated users to read user data for analytics" ON auth.users;
CREATE POLICY "Allow authenticated users to read user data for analytics" 
ON auth.users 
FOR SELECT 
TO authenticated 
USING (true);

-- Alternative more restrictive policy (commented out)
-- This would only allow users to read their own data
-- CREATE POLICY IF NOT EXISTS "Allow users to read their own data" 
-- ON auth.users 
-- FOR SELECT 
-- TO authenticated 
-- USING (auth.uid() = id);

-- Grant necessary permissions to authenticated role
GRANT SELECT ON auth.users TO authenticated;