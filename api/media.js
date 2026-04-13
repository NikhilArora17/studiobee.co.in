const { supabase, checkRateLimit, getIp } = require('./_lib/supabase');

const ALLOWED_EXTS = /\.(jpg|jpeg|png|gif|webp|mp4|webm|mov)$/i;
const SIGNED_TTL   = 3600;  // 1 hour

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const file = req.query.file;
  if (!file || !ALLOWED_EXTS.test(file)) {
    return res.status(400).json({ error: 'Invalid or missing file parameter' });
  }

  // Sanitise: only the filename, no path traversal
  const filename = file.replace(/^.*[\\/]/, '');
  if (filename !== file || filename.includes('..')) {
    return res.status(400).json({ error: 'Invalid filename' });
  }

  // Rate limit: 120 requests per minute per IP
  if (!checkRateLimit(getIp(req) + ':media', 120)) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  try {
    const { data, error } = await supabase.storage
      .from('media')
      .createSignedUrl(filename, SIGNED_TTL);

    if (error || !data?.signedUrl) {
      console.error('Signed URL error:', error?.message || 'no data');
      return res.status(404).json({ error: 'File not found' });
    }

    // Cache the redirect for 10 minutes (well within the 1h signed TTL)
    res.setHeader('Cache-Control', 'public, max-age=600, s-maxage=600');
    res.setHeader('Location', data.signedUrl);
    return res.status(302).end();
  } catch (e) {
    console.error('Media proxy error:', e.message);
    return res.status(500).json({ error: 'Internal error' });
  }
};
