-- Create storage policies for avatars bucket
CREATE POLICY "Users can upload their own avatar" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar" ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can view avatars" ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'avatars');

-- Create storage policies for post-media bucket
CREATE POLICY "Authenticated users can upload post media" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'post-media');

CREATE POLICY "Users can update their own post media" ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'post-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own post media" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'post-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can view post media" ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'post-media');