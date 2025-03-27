import { supabase } from './supabase';

// Storage bucket names
export const STORAGE_BUCKETS = {
  AVATARS: 'avatars',
  POST_MEDIA: 'post-media',
} as const;

// Initialize storage buckets
export const initializeStorageBuckets = async () => {
  try {
    // Create avatars bucket if it doesn't exist
    const { error: avatarError } = await supabase.storage.createBucket(STORAGE_BUCKETS.AVATARS, {
      public: false,
      fileSizeLimit: 1024 * 1024 * 2, // 2MB limit for avatars
    });
    if (avatarError && avatarError.message !== 'Bucket already exists') {
      throw avatarError;
    }

    // Create post-media bucket if it doesn't exist
    const { error: mediaError } = await supabase.storage.createBucket(STORAGE_BUCKETS.POST_MEDIA, {
      public: true,
      fileSizeLimit: 1024 * 1024 * 10, // 10MB limit for post media
    });
    if (mediaError && mediaError.message !== 'Bucket already exists') {
      throw mediaError;
    }
  } catch (error) {
    console.error('Error initializing storage buckets:', error);
    throw error;
  }
};

// Upload file to a specific bucket
export const uploadFile = async (bucket: keyof typeof STORAGE_BUCKETS, file: File, path: string) => {
  try {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKETS[bucket])
      .upload(path, file);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`Error uploading file to ${bucket}:`, error);
    throw error;
  }
};

// Get public URL for a file
export const getPublicUrl = (bucket: keyof typeof STORAGE_BUCKETS, path: string) => {
  const { data } = supabase.storage.from(STORAGE_BUCKETS[bucket]).getPublicUrl(path);
  return data.publicUrl;
};

// Delete file from a bucket
export const deleteFile = async (bucket: keyof typeof STORAGE_BUCKETS, path: string) => {
  try {
    const { error } = await supabase.storage.from(STORAGE_BUCKETS[bucket]).remove([path]);
    if (error) throw error;
  } catch (error) {
    console.error(`Error deleting file from ${bucket}:`, error);
    throw error;
  }
};