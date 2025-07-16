-- Add missing verified column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE;

-- Update existing profiles to have verified = false by default
UPDATE profiles SET verified = FALSE WHERE verified IS NULL;