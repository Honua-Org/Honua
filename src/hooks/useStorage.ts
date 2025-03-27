import { useState } from 'react';
import { uploadFile, deleteFile, getPublicUrl, STORAGE_BUCKETS } from '../config/storage';

interface UseStorageOptions {
  bucket: keyof typeof STORAGE_BUCKETS;
  maxSizeInMB?: number;
  allowedTypes?: string[];
}

interface UploadProgress {
  progress: number;
  error: string | null;
  url: string | null;
}

export const useStorage = ({ bucket, maxSizeInMB = 10, allowedTypes = ['image/*'] }: UseStorageOptions) => {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    progress: 0,
    error: null,
    url: null,
  });

  const validateFile = (file: File): string | null => {
    // Check file size
    const maxSize = maxSizeInMB * 1024 * 1024;
    if (file.size > maxSize) {
      return `File size must be less than ${maxSizeInMB}MB`;
    }

    // Check file type
    const isValidType = allowedTypes.some(type => {
      if (type.endsWith('/*')) {
        const baseType = type.slice(0, -2);
        return file.type.startsWith(baseType);
      }
      return file.type === type;
    });

    if (!isValidType) {
      return `File type must be one of: ${allowedTypes.join(', ')}`;
    }

    return null;
  };

  const upload = async (file: File, path: string): Promise<string> => {
    try {
      setUploadProgress({ progress: 0, error: null, url: null });

      // Validate file
      const validationError = validateFile(file);
      if (validationError) {
        throw new Error(validationError);
      }

      // Upload file
      const data = await uploadFile(bucket, file, path);
      if (!data) throw new Error('Upload failed');

      // Get public URL
      const url = getPublicUrl(bucket, path);
      setUploadProgress({ progress: 100, error: null, url });
      return url;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setUploadProgress(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  };

  const remove = async (path: string): Promise<void> => {
    try {
      await deleteFile(bucket, path);
      setUploadProgress({ progress: 0, error: null, url: null });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Delete failed';
      setUploadProgress(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  };

  return {
    upload,
    remove,
    uploadProgress,
  };
};