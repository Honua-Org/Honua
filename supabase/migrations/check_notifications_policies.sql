-- Check current RLS policies for notifications table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'notifications';

-- Check current permissions for notifications table
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND table_name = 'notifications'
AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;

-- If no policies exist, create basic RLS policies for notifications
-- Policy to allow users to read their own notifications
CREATE POLICY "Users can read their own notifications" ON notifications
    FOR SELECT USING (auth.uid() = recipient_id);

-- Policy to allow authenticated users to insert notifications
CREATE POLICY "Authenticated users can create notifications" ON notifications
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Policy to allow users to update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = recipient_id);

-- Grant necessary permissions to authenticated role
GRANT SELECT, INSERT, UPDATE ON notifications TO authenticated;

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'notifications';