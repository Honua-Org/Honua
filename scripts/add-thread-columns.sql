-- Add missing columns to threads and forums tables
-- This script adds missing columns that are expected by the frontend

-- Add missing columns to threads table
ALTER TABLE threads ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;
ALTER TABLE threads ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT FALSE;

-- Add missing columns to forums table
ALTER TABLE forums ADD COLUMN IF NOT EXISTS cover_image TEXT;
ALTER TABLE forums ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS threads_is_pinned_idx ON threads(is_pinned);
CREATE INDEX IF NOT EXISTS threads_is_locked_idx ON threads(is_locked);
CREATE INDEX IF NOT EXISTS forums_updated_at_idx ON forums(updated_at DESC);

-- Update the existing records to have default values
UPDATE threads SET is_pinned = FALSE WHERE is_pinned IS NULL;
UPDATE threads SET is_locked = FALSE WHERE is_locked IS NULL;
UPDATE forums SET updated_at = created_at WHERE updated_at IS NULL;