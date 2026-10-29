// Cloudinary Client & Upload Helper
import { compressVideo, CompressionResult } from './videoCompression';

const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'lnfbecmj';
const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'ml_default';

export const isCloudinaryConfigured = () => {
  return Boolean(cloudName && uploadPreset);
};

export const uploadToCloudinary = async (
  file: File,
  resourceType: 'video' | 'raw' | 'image' | 'auto' = 'auto'
): Promise<string> => {
  if (!isCloudinaryConfigured()) {
    console.warn('Cloudinary environment variables not set. Using local ObjectURL fallback.');
    return URL.createObjectURL(file);
  }

  // Cloudinary free tier browser unsigned upload limit is ~100MB.
  // We allow files up to 100MB to upload directly.
  const MAX_CLOUDINARY_SIZE = 100 * 1024 * 1024; // 100MB
  if (file.size > MAX_CLOUDINARY_SIZE) {
    console.warn(
      `File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds maximum cloud upload threshold. Using local stream.`
    );
    return URL.createObjectURL(file);
  }

  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);

    // Explicitly route video files to /video/upload for proper video processing & streaming
    const isVideoFile = resourceType === 'video' || file.type.startsWith('video/');
    const endpointType = isVideoFile ? 'video' : resourceType === 'image' || file.type.startsWith('image/') ? 'image' : 'auto';

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/${endpointType}/upload`,
      {
        method: 'POST',
        body: formData
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.warn('Cloudinary upload warning:', errorData);
      return URL.createObjectURL(file);
    }

    const data = await response.json();
    let secureUrl = data.secure_url || '';

    // Apply Cloudinary dynamic streaming optimizations (auto quality, compact codec, 720p limit)
    if (secureUrl && isVideoFile && secureUrl.includes('/video/upload/')) {
      secureUrl = secureUrl.replace('/video/upload/', '/video/upload/q_auto,vc_auto,w_1280,c_limit/');
    }

    return secureUrl || URL.createObjectURL(file);
  } catch (err) {
    console.warn('Cloudinary upload network/CORS error, using local fallback:', err);
    return URL.createObjectURL(file);
  }
};

/**
 * Uploads a video file with automatic in-browser compression if larger than 25MB.
 * Returns the final streaming URL and compression metrics.
 */
export const uploadVideoWithAutoCompression = async (
  file: File,
  onProgress?: (percent: number, message: string) => void
): Promise<{ url: string; compressionResult: CompressionResult }> => {
  // Compress in browser if > 25MB
  const compressionResult = await compressVideo(file, {
    thresholdSizeMb: 25,
    maxDimension: 1280,
    videoBitrate: 1_200_000,
    playbackRate: 2.0,
    onProgress
  });

  onProgress?.(85, 'Uploading to Cloudinary...');
  const uploadedUrl = await uploadToCloudinary(compressionResult.file, 'video');
  onProgress?.(100, 'Upload complete!');

  return { url: uploadedUrl, compressionResult };
};


