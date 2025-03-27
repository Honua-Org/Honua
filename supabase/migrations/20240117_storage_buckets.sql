-- Create storage schema if not exists
CREATE SCHEMA IF NOT EXISTS storage;

-- Ensure proper permissions on storage schema
GRANT USAGE ON SCHEMA storage TO postgres, anon, authenticated, service_role;

-- Create storage buckets for avatars and post media
CREATE TABLE IF NOT EXISTS storage.buckets (
  id text PRIMARY KEY,
  name text NOT NULL,
  owner uuid references auth.users,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  public boolean DEFAULT false,
  avif_autodetection boolean DEFAULT false,
  file_size_limit bigint DEFAULT null,
  allowed_mime_types text[] DEFAULT null
);

-- Create objects table if not exists
CREATE TABLE IF NOT EXISTS storage.objects (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  bucket_id text REFERENCES storage.buckets(id),
  name text,
  owner uuid references auth.users,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_accessed_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  path_tokens text[] GENERATED ALWAYS AS (string_to_array(name, '/')) STORED
);

-- Insert buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('avatars', 'avatars', false, 2097152, '{"image/*"}'),  -- 2MB limit for avatars
  ('post-media', 'post-media', true, 10485760, '{"image/*"}')  -- 10MB limit for post media
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for avatars bucket
CREATE POLICY "Avatar files are privately accessible" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'avatars' AND auth.uid() = owner);

CREATE POLICY "Anyone can upload an avatar" ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Users can update their own avatar" ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.uid() = owner);

CREATE POLICY "Users can delete their own avatar" ON storage.objects
  FOR DELETE
  USING (bucket_id = 'avatars' AND auth.uid() = owner);

-- Set up storage policies for post-media bucket
CREATE POLICY "Post media is publicly accessible" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'post-media');

CREATE POLICY "Authenticated users can upload post media" ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'post-media' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own post media" ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'post-media' AND auth.uid() = owner);

CREATE POLICY "Users can delete their own post media" ON storage.objects
  FOR DELETE
  USING (bucket_id = 'post-media' AND auth.uid() = owner);