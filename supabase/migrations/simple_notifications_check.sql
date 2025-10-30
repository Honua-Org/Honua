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

-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables 
WHERE tablename = 'notifications';