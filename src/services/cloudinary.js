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

const API_KEY = import.meta.env.VITE_CLOUDINARY_API_KEY || '528467798978286';
const API_SECRET = import.meta.env.VITE_CLOUDINARY_API_SECRET || 'JECGZNA3M-BzraYbs2mQPHy9RN8';

/**
 * Fetch all photos stored in the Cloudinary folder (Backup / Restore)
 * @param {string} folder - Cloudinary folder name (default: FOLDER)
 * @returns {Promise<string[]>} Array of image secure URLs
 */
export async function fetchFolderPhotos(folder = FOLDER) {
  // 1. Try Netlify function or local Vite server proxy endpoints
  const endpoints = [
    '/.netlify/functions/backup',
    '/api/cloudinary/backup'
  ];

  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint);
      if (res.ok) {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await res.json();
          if (data.success && Array.isArray(data.photos) && data.photos.length > 0) {
            return data.photos;
          }
        }
      }
    } catch (err) {
      console.warn(`[Cloudinary] Backup endpoint ${endpoint} failed:`, err);
    }
  }

  // 2. Direct fallback using Cloudinary Search API with Basic Auth
  try {
    const auth = btoa(`${API_KEY}:${API_SECRET}`);
    const searchEndpoint = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/resources/search`;

    const res = await fetch(searchEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        expression: `asset_folder:${folder} OR folder:${folder}`,
        max_results: 500
      })
    });

    if (res.ok) {
      const data = await res.json();
      return (data.resources || []).map(r => r.secure_url);
    }
  } catch (err) {
    console.error('[Cloudinary] Direct search fetch failed:', err);
  }

  return [];
}

