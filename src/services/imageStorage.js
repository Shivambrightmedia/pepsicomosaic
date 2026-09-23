/**
 * IndexedDB storage for Predefined / Filler Mosaic Images
 * Stores large image sets (100+ photos) without hitting localStorage 5MB quotas.
 */

const DB_NAME = 'SmileMosaicDB';
const STORE_NAME = 'predefined_images';
const DB_VERSION = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function savePredefinedImages(images) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.clear();
    images.forEach((img, idx) => {
      store.put({ id: idx, url: img });
    });
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

export async function getPredefinedImages() {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        const results = req.result || [];
        resolve(results.map(r => r.url));
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[ImageStorage] Failed to read predefined images:', err);
    return [];
  }
}

export async function clearPredefinedImages() {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.clear();
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[ImageStorage] Failed to clear predefined images:', err);
    return false;
  }
}
