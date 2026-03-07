import { supabase, checkAdmin, checkRateLimit, getIp } from './_lib/supabase.js';

const ALLOWED_EXTS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.mp4', '.webm', '.mov', '.avi', '.mkv']);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  if (!checkAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });
  if (!checkRateLimit(getIp(req) + ':upload', 10)) return res.status(429).json({ error: 'Too many requests' });

  const rawName = req.headers['x-filename']
    ? decodeURIComponent(req.headers['x-filename'])
    : 'upload.bin';

  const extMatch = rawName.match(/\.[^.]+$/);
  const ext = extMatch ? extMatch[0].toLowerCase() : '';
  if (!ALLOWED_EXTS.has(ext)) return res.status(415).json({ error: 'File type not allowed' });

  const base = rawName.slice(0, rawName.lastIndexOf('.')).replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
  const filename = Date.now() + '-' + base + ext;

  const { data, error } = await supabase.storage
    .from('media')
    .createSignedUploadUrl(filename);

  if (error) return res.status(500).json({ error: 'Could not create upload URL' });

  const publicUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/media/${filename}`;

  res.status(200).json({ uploadUrl: data.signedUrl, publicUrl });
}
