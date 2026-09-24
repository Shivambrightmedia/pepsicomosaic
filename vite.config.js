import { defineConfig, loadEnv } from 'vite';
import fs from 'node:fs';
import path from 'node:path';

// Sync play assets from dist to public if needed
try {
  const root = process.cwd();
  const distP1 = path.join(root, 'dist', 'play1.jpg');
  const pubP1 = path.join(root, 'public', 'play1.jpg');
  if (fs.existsSync(distP1) && !fs.existsSync(pubP1)) {
    fs.copyFileSync(distP1, pubP1);
  }
  const distP2 = path.join(root, 'dist', 'play2.jpg');
  const pubP2 = path.join(root, 'public', 'play2.jpg');
  if (fs.existsSync(distP2) && !fs.existsSync(pubP2)) {
    fs.copyFileSync(distP2, pubP2);
  }
  const oldBg = path.join(root, 'public', 'start_bg.jpg');
  if (fs.existsSync(oldBg)) {
    fs.unlinkSync(oldBg);
  }
} catch (e) {
  console.warn('[Vite Config] Asset sync warning:', e);
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  const cloudName = env.VITE_CLOUDINARY_CLOUD_NAME || 'dzz5belph';
  const apiKey = env.VITE_CLOUDINARY_API_KEY || '528467798978286';
  const apiSecret = env.CLOUDINARY_API_SECRET || env.VITE_CLOUDINARY_API_SECRET || 'JECGZNA3M-BzraYbs2mQPHy9RN8';
  const folder = env.VITE_CLOUDINARY_FOLDER || 'pepsicomosaic';

  const backupMiddleware = async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');

    try {
      const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
      const searchEndpoint = `https://api.cloudinary.com/v1_1/${cloudName}/resources/search`;

      const response = await fetch(searchEndpoint, {
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

      const data = await response.json();
      const photos = (data.resources || []).map(r => r.secure_url);

      res.end(JSON.stringify({
        success: true,
        count: photos.length,
        photos
      }));
    } catch (err) {
      console.error('[Cloudinary Backup API Error]:', err);
      res.statusCode = 500;
      res.end(JSON.stringify({
        success: false,
        error: err.message || 'Failed to fetch Cloudinary backup'
      }));
    }
  };

  return {
    server: {
      host: true,
    },
    plugins: [
      {
        name: 'cloudinary-backup-middleware',
        configureServer(server) {
          server.middlewares.use('/api/cloudinary/backup', backupMiddleware);
        },
        configurePreviewServer(server) {
          server.middlewares.use('/api/cloudinary/backup', backupMiddleware);
        }
      }
    ]
  };
});
