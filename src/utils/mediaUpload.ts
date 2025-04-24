import { supabase } from '../lib/supabase';

export interface UploadedMedia {
  url: string;
  type: 'image' | 'video';
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm'];

export const uploadMedia = async (file: File): Promise<UploadedMedia> => {
  try {
    // Check authentication status
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      throw new Error('Authentication required. Please sign in to upload media.');
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`File size exceeds maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
    }

    // Validate file type
    if (!ALLOWED_IMAGE_TYPES.includes(file.type) && !ALLOWED_VIDEO_TYPES.includes(file.type)) {
      throw new Error('Unsupported file type. Please upload images (JPEG, PNG, GIF, WEBP) or videos (MP4, WEBM)');
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${session.user.id}/${Date.now()}_${fileName}`;

    // Upload file to Supabase storage
    const { error: uploadError, data: uploadData } = await supabase.storage
      .from('post-media')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      if (uploadError.message.includes('duplicate')) {
        throw new Error('A file with this name already exists');
      }
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    if (!uploadData) {
      throw new Error('Upload failed: No data received from storage');
    }

    // Get public URL for the uploaded file
    const { data: { publicUrl } } = supabase.storage
      .from('post-media')
      .getPublicUrl(filePath);

    if (!publicUrl) {
      throw new Error('Failed to generate public URL for uploaded file');
    }

    return {
      url: publicUrl,
      type: file.type.startsWith('image/') ? 'image' : 'video'
    };
  } catch (error) {
    console.error('Error uploading media:', error);
    throw error instanceof Error ? error : new Error('An unexpected error occurred during upload');
  }
};

export const uploadMultipleMedia = async (files: File[]): Promise<UploadedMedia[]> => {
  try {
    const uploadPromises = files.map(file => uploadMedia(file));
    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error('Error uploading multiple media:', error);
    throw new Error('Failed to upload multiple media files');
  }
};