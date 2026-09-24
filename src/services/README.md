# Mosaic Services Architecture

Summary of services in `src/services/` for photo storage, real-time sync, and client-side persistence.

---

## 1. `cloudinary.js` — Image Cloud Storage

Direct unsigned REST upload to Cloudinary.

- **Functions**:
  - `uploadPhoto(photoDataUrl)`: Direct unsigned REST upload of captured selfie.
  - `fetchFolderPhotos(folder)`: Retrieves all photos from Cloudinary folder (backup/restore on key '8').
- **Endpoint**:
  - Upload: `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`
  - Backup: `/api/cloudinary/backup` (Vite middleware proxy) or direct Search API fallback
- **Config**:
  - `VITE_CLOUDINARY_CLOUD_NAME` (default: `dzz5belph`)
  - `VITE_CLOUDINARY_UPLOAD_PRESET` (default: `mosaic`)
  - `VITE_CLOUDINARY_FOLDER` (default: `pepsicomosaic`)
  - `CLOUDINARY_API_SECRET` / `VITE_CLOUDINARY_API_SECRET`
- **Return**: `{ success: true, url: data.secure_url, publicId: data.public_id }` or `{ success: false, error }`

---

## 2. `firebase.js` — Real-Time Streaming (Zero Polling)

Server-Sent Events (SSE) via native browser `EventSource` on Firebase Realtime Database.

- **Endpoint**: `${FIREBASE_DATABASE_URL}/photos.json`
- **Functions**:
  - `publishPhoto(imageUrl)`: `POST` new image URL with timestamp to `/photos.json`.
  - `getPhotos()`: `GET` and sort all stored photos by creation time.
  - `resetRemotePhotos()`: `DELETE /photos.json` when admin clears the wall.
  - `subscribeToPhotos({ onInitialPhotos, onNewPhoto, onReset, onStatusChange })`: Opens live SSE stream (`put`/`patch` events) for instant sync across screens. Returns unsubscribe cleanup callback.

---

## 3. `imageStorage.js` — Client-Side IndexedDB Storage

Local browser storage for 100+ predefined filler photos bypassing the 5MB `localStorage` limit.

- **Database**: `SmileMosaicDB` (v1)
- **Object Store**: `predefined_images` (keyPath: `id`)
- **Functions**:
  - `savePredefinedImages(images)`: Bulk writes optimized Base64 images.
  - `getPredefinedImages()`: Retrieves array of image data URLs.
  - `clearPredefinedImages()`: Clears store when reset from settings modal.
