/**
 * Firebase Realtime Database Service (Zero-Polling Streaming via SSE)
 * Uses native browser EventSource for instant real-time sync with 0ms polling overhead.
 */

const DB_URL = (import.meta.env.VITE_FIREBASE_DATABASE_URL || 'https://mosaicwall-a7b39-default-rtdb.firebaseio.com').replace(/\/+$/, '');

/**
 * Publish a new captured photo to Firebase RTDB
 * @param {string} imageUrl - Cloudinary secure URL
 */
export async function publishPhoto(imageUrl) {
  if (!imageUrl) throw new Error('Missing imageUrl to publish');

  const endpoint = `${DB_URL}/photos.json`;
  const payload = {
    imageUrl,
    createdAt: Date.now()
  };

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      throw new Error(`Firebase publish failed with status: ${res.status}`);
    }

    const data = await res.json();
    return { success: true, id: data.name, imageUrl };
  } catch (err) {
    console.error('[Firebase] Publish error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Fetch all existing photos stored in Firebase
 * @returns {Promise<Array<{ id: string, imageUrl: string, createdAt: number }>>}
 */
export async function getPhotos() {
  try {
    const res = await fetch(`${DB_URL}/photos.json`);
    if (!res.ok) return [];
    const data = await res.json();
    if (!data) return [];

    return Object.entries(data).map(([id, item]) => ({
      id,
      imageUrl: item.imageUrl,
      createdAt: item.createdAt || 0
    })).sort((a, b) => a.createdAt - b.createdAt);
  } catch (err) {
    console.error('[Firebase] Fetch photos error:', err);
    return [];
  }
}

/**
 * Delete all photos in Firebase (triggered when admin resets the mosaic wall)
 */
export async function resetRemotePhotos() {
  try {
    const res = await fetch(`${DB_URL}/photos.json`, {
      method: 'DELETE'
    });
    return res.ok;
  } catch (err) {
    console.error('[Firebase] Reset error:', err);
    return false;
  }
}

/**
 * Subscribe to real-time updates from Firebase using native EventSource SSE stream
 * @param {Object} handlers
 * @param {Function} handlers.onInitialPhotos - Called on connection with list of existing photos
 * @param {Function} handlers.onNewPhoto - Called whenever a new photo arrives live
 * @param {Function} handlers.onReset - Called when the database is cleared
 * @param {Function} handlers.onStatusChange - Called with connection status ('connected' | 'connecting' | 'disconnected')
 * @returns {Function} Unsubscribe cleanup function
 */
export function subscribeToPhotos({ onInitialPhotos, onNewPhoto, onReset, onStatusChange } = {}) {
  const seenIds = new Set();
  let isInitialLoad = true;
  let eventSource = null;

  const updateStatus = (status) => {
    if (typeof onStatusChange === 'function') onStatusChange(status);
  };

  const connect = () => {
    updateStatus('connecting');
    const streamUrl = `${DB_URL}/photos.json`;

    eventSource = new EventSource(streamUrl);

    eventSource.onopen = () => {
      console.log('[Firebase] Real-time SSE stream connected');
      updateStatus('connected');
    };

    eventSource.addEventListener('put', (e) => {
      try {
        const payload = JSON.parse(e.data);
        if (!payload) return;

        const { path, data } = payload;

        // Case 1: Initial payload at root ("/") or complete reset
        if (path === '/') {
          if (!data) {
            // Root was cleared / reset
            seenIds.clear();
            if (!isInitialLoad && typeof onReset === 'function') {
              onReset();
            } else if (isInitialLoad && typeof onInitialPhotos === 'function') {
              onInitialPhotos([]);
            }
          } else {
            // Initial batch of photos
            const photos = Object.entries(data).map(([id, item]) => {
              seenIds.add(id);
              return {
                id,
                imageUrl: item.imageUrl,
                createdAt: item.createdAt || 0
              };
            }).sort((a, b) => a.createdAt - b.createdAt);

            if (typeof onInitialPhotos === 'function') {
              onInitialPhotos(photos);
            }
          }
          isInitialLoad = false;
          return;
        }

        // Case 2: New item added at path (e.g. "/-P2D8xjmV9uUE3nXPohs")
        const id = path.replace(/^\//, '');
        if (data && data.imageUrl) {
          if (!seenIds.has(id)) {
            seenIds.add(id);
            if (!isInitialLoad && typeof onNewPhoto === 'function') {
              onNewPhoto(data.imageUrl, id);
            }
          }
        } else if (data === null) {
          // A single item was deleted
          seenIds.delete(id);
        }
      } catch (err) {
        console.error('[Firebase] Error parsing SSE payload:', err);
      }
    });

    eventSource.addEventListener('patch', (e) => {
      try {
        const payload = JSON.parse(e.data);
        if (!payload || !payload.data) return;
        Object.entries(payload.data).forEach(([id, item]) => {
          if (item && item.imageUrl && !seenIds.has(id)) {
            seenIds.add(id);
            if (!isInitialLoad && typeof onNewPhoto === 'function') {
              onNewPhoto(item.imageUrl, id);
            }
          }
        });
      } catch (err) {
        console.error('[Firebase] Error in patch event:', err);
      }
    });

    eventSource.onerror = (err) => {
      console.warn('[Firebase] SSE connection lost or reconnecting...', err);
      updateStatus('disconnected');
    };
  };

  connect();

  return () => {
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
  };
}
