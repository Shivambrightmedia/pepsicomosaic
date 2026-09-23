/**
 * Cloudinary Direct Upload Service
 * Handles uploading photobooth selfies directly to Cloudinary using unsigned upload presets.
 */

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dzz5belph';
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'mosaic';
const FOLDER = import.meta.env.VITE_CLOUDINARY_FOLDER || 'pepsicomosaic';

export async function uploadPhoto(photoDataUrl) {
  if (!photoDataUrl) {
    throw new Error('No photo provided for upload');
  }

  const endpoint = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

  const formData = new FormData();
  formData.append('file', photoDataUrl);
  formData.append('upload_preset', UPLOAD_PRESET);
  if (FOLDER) {
    formData.append('folder', FOLDER);
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData
    });

    const data = await response.json();

    if (!response.ok || !data.secure_url) {
      const errMsg = data.error?.message || `Cloudinary upload failed with status ${response.status}`;
      console.error('[Cloudinary] Upload failed:', errMsg, data);
      return {
        success: false,
        error: errMsg
      };
    }

    return {
      success: true,
      url: data.secure_url,
      publicId: data.public_id
    };
  } catch (err) {
    console.error('[Cloudinary] Network error during upload:', err);
    return {
      success: false,
      error: err.message || 'Network error during image upload'
    };
  }
}
