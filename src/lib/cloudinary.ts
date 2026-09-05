// Cloudinary Client & Upload Helper

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

  // Cloudinary free tier browser unsigned upload limit is ~40-100MB depending on preset.
  // We allow files up to 60MB to upload to Cloudinary.
  const MAX_CLOUDINARY_SIZE = 60 * 1024 * 1024; // 60MB
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
    return data.secure_url || URL.createObjectURL(file);
  } catch (err) {
    console.warn('Cloudinary upload network/CORS error, using local fallback:', err);
    return URL.createObjectURL(file);
  }
};

