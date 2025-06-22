import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

const supabase = createClientComponentClient()

export interface UploadResult {
  url: string
  path: string
  error?: string
}

/**
 * Upload a file to Supabase storage
 * @param file - The file to upload
 * @param bucket - The storage bucket name
 * @param folder - Optional folder path within the bucket
 * @returns Promise with upload result
 */
export async function uploadFile(
  file: File,
  bucket: string,
  folder?: string
): Promise<UploadResult> {
  try {
    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return {
        url: '',
        path: '',
        error: 'File size must be less than 10MB'
      }
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return {
        url: '',
        path: '',
        error: 'Only image files (JPEG, PNG, WebP, GIF) are allowed'
      }
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = folder ? `${folder}/${fileName}` : fileName

    // Upload file
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Upload error:', error)
      return {
        url: '',
        path: '',
        error: error.message
      }
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path)

    return {
      url: publicUrl,
      path: data.path,
      error: undefined
    }
  } catch (error) {
    console.error('Upload error:', error)
    return {
      url: '',
      path: '',
      error: error instanceof Error ? error.message : 'Upload failed'
    }
  }
}

/**
 * Upload multiple files to Supabase storage
 * @param files - Array of files to upload
 * @param bucket - The storage bucket name
 * @param folder - Optional folder path within the bucket
 * @returns Promise with array of upload results
 */
export async function uploadMultipleFiles(
  files: File[],
  bucket: string,
  folder?: string
): Promise<UploadResult[]> {
  const uploadPromises = files.map(file => uploadFile(file, bucket, folder))
  return Promise.all(uploadPromises)
}

/**
 * Delete a file from Supabase storage
 * @param bucket - The storage bucket name
 * @param path - The file path to delete
 * @returns Promise with success/error result
 */
export async function deleteFile(bucket: string, path: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path])

    if (error) {
      console.error('Delete error:', error)
      return {
        success: false,
        error: error.message
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Delete error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Delete failed'
    }
  }
}

/**
 * Upload avatar image
 * @param file - The avatar image file
 * @param userId - The user ID for organizing files
 * @returns Promise with upload result
 */
export async function uploadAvatar(file: File, userId: string): Promise<UploadResult> {
  return uploadFile(file, 'avatars', userId)
}

/**
 * Upload post media
 * @param file - The media file
 * @param userId - The user ID for organizing files
 * @returns Promise with upload result
 */
export async function uploadPostMedia(file: File, userId: string): Promise<UploadResult> {
  return uploadFile(file, 'post-media', userId)
}

/**
 * Upload cover image
 * @param file - The cover image file
 * @param userId - The user ID for organizing files
 * @returns Promise with upload result
 */
export async function uploadCoverImage(file: File, userId: string): Promise<UploadResult> {
  return uploadFile(file, 'cover-images', userId)
}