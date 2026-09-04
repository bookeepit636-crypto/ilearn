// Cloudinary Client & Upload Helper

const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '';
const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '';

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

  // Cloudinary free unsigned upload limit is ~20-25MB for browser client uploads.
  // Files exceeding this return 413 (Request Entity Too Large). Seamlessly use local stream.
  const MAX_CLOUDINARY_SIZE = 25 * 1024 * 1024; // 25MB
  if (file.size > MAX_CLOUDINARY_SIZE) {
    console.info(
      `File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds Cloudinary 25MB unsigned limit. Using local blob stream.`
    );
    return URL.createObjectURL(file);
  }

  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);

    // Cloudinary unsigned uploads work best with 'auto' for videos, audio, and documents
    const endpointType = resourceType === 'video' ? 'auto' : resourceType;

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
