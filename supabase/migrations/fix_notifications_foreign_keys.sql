-- Fix notifications table foreign key relationships
-- Drop existing foreign key constraints that point to auth.users
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_recipient_id_fkey;
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_actor_id_fkey;

-- Add new foreign key constraints that point to public.profiles
ALTER TABLE notifications 
  ADD CONSTRAINT notifications_recipient_id_fkey 
  FOREIGN KEY (recipient_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE notifications 
  ADD CONSTRAINT notifications_actor_id_fkey 
  FOREIGN KEY (actor_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Verify the constraints are properly set
-- This will help ensure the relationships are correctly established
SELECT 
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM 
  information_schema.table_constraints AS tc 
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE 
  tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'notifications'
  AND kcu.column_name IN ('recipient_id', 'actor_id');