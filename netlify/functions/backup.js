export default async function handler(req, context) {
  const cloudName = process.env.VITE_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME || 'dzz5belph';
  const apiKey = process.env.VITE_CLOUDINARY_API_KEY || process.env.CLOUDINARY_API_KEY || '528467798978286';
  const apiSecret = process.env.CLOUDINARY_API_SECRET || process.env.VITE_CLOUDINARY_API_SECRET || 'JECGZNA3M-BzraYbs2mQPHy9RN8';
  const folder = process.env.VITE_CLOUDINARY_FOLDER || process.env.CLOUDINARY_FOLDER || 'pepsicomosaic';

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

    return new Response(JSON.stringify({ success: true, count: photos.length, photos }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}
