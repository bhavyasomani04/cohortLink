/**
 * useImageUpload.js
 *
 * Custom hook that handles the full S3 presigned-URL upload flow.
 * XHR is used instead of fetch because XMLHttpRequest.upload.onprogress
 * is the only native browser API that reports upload byte progress —
 * the enterprise pattern for tracking S3 direct uploads.
 *
 * Usage:
 *   const { uploadImage, uploading, progress, uploadedUrl, error, reset } = useImageUpload();
 *   const url = await uploadImage(file);  // resolves with publicUrl on success
 */

import { useState, useCallback } from 'react';
import { getPresignedUrl } from '../services/api';

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

/**
 * @returns {{
 *   uploadImage: (file: File) => Promise<string|undefined>,
 *   uploading: boolean,
 *   progress: number,
 *   uploadedUrl: string|null,
 *   error: string|null,
 *   reset: () => void,
 * }}
 */
export function useImageUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedUrl, setUploadedUrl] = useState(null);
  const [error, setError] = useState(null);

  const reset = useCallback(() => {
    setUploading(false);
    setProgress(0);
    setUploadedUrl(null);
    setError(null);
  }, []);

  const uploadImage = useCallback(async (file) => {
    if (!file) return;

    // --- Client-side validation ---
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Unsupported file type. Please upload a JPEG, PNG, WEBP, or GIF.');
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setError('File too large — maximum size is 5 MB.');
      return;
    }

    setError(null);
    setUploading(true);
    setProgress(0);

    try {
      // Step 1: Ask our Spring Boot backend for a presigned S3 PUT URL
      const { presignedUrl, publicUrl } = await getPresignedUrl({
        filename: file.name,
        contentType: file.type,
      });

      // Step 2: PUT file directly to S3 via XHR (fetch has no upload progress events)
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        // Track bytes transferred → drive the progress bar
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            setProgress(Math.round((event.loaded / event.total) * 100));
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`S3 upload failed: HTTP ${xhr.status}`));
          }
        };

        xhr.onerror = () => reject(new Error('Network error during upload. Check your connection.'));
        xhr.ontimeout = () => reject(new Error('Upload timed out. Please try again.'));

        // S3 presigned PUT — NO Authorization header.
        // Authentication is embedded in the presigned URL itself (AWS Signature v4).
        xhr.open('PUT', presignedUrl);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.send(file);
      });

      setProgress(100);
      setUploadedUrl(publicUrl);
      return publicUrl;
    } catch (err) {
      setError(err.message || 'Upload failed. Please try again.');
      return undefined;
    } finally {
      setUploading(false);
    }
  }, []);

  return { uploadImage, uploading, progress, uploadedUrl, error, reset };
}
