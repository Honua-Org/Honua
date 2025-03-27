import React, { useCallback } from 'react';
import { useStorage } from '../../hooks/useStorage';
import { STORAGE_BUCKETS } from '../../config/storage';

interface FileUploadProps {
  onUploadComplete: (url: string) => void;
  onUploadError?: (error: string) => void;
  bucket?: keyof typeof STORAGE_BUCKETS;
  maxSizeInMB?: number;
  allowedTypes?: string[];
  className?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onUploadComplete,
  onUploadError,
  bucket = 'POST_MEDIA',
  maxSizeInMB = 10,
  allowedTypes = ['image/*'],
  className = '',
}) => {
  const { upload, uploadProgress } = useStorage({
    bucket,
    maxSizeInMB,
    allowedTypes,
  });

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      try {
        const timestamp = new Date().getTime();
        const path = `${timestamp}-${file.name}`;
        const url = await upload(file, path);
        onUploadComplete(url);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Upload failed';
        onUploadError?.(errorMessage);
      }

      // Reset input value to allow uploading the same file again
      event.target.value = '';
    },
    [upload, onUploadComplete, onUploadError]
  );

  return (
    <div className={className}>
      <input
        type="file"
        onChange={handleFileChange}
        accept={allowedTypes.join(',')}
        className="block w-full text-sm text-gray-500
          file:mr-4 file:py-2 file:px-4
          file:rounded-full file:border-0
          file:text-sm file:font-semibold
          file:bg-violet-50 file:text-violet-700
          hover:file:bg-violet-100"
      />
      {uploadProgress.error && (
        <p className="mt-2 text-sm text-red-600">{uploadProgress.error}</p>
      )}
      {uploadProgress.progress > 0 && uploadProgress.progress < 100 && (
        <div className="mt-2">
          <div className="h-2 bg-gray-200 rounded-full">
            <div
              className="h-2 bg-violet-600 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress.progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};