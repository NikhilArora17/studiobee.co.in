const { supabase } = require('./_lib/supabase');
const fs = require('fs');
const path = require('path');

// Rewrite Supabase public storage URLs → /api/media?file=<filename>
// so the frontend never hits the private bucket directly.
function rewriteMediaUrls(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(rewriteMediaUrls);
  var out = {};
  for (var k in obj) {
    var v = obj[k];
    if (typeof v === 'string' && v.includes('/storage/v1/object/public/media/')) {
      var filename = v.split('/storage/v1/object/public/media/').pop();
      out[k] = '/api/media?file=' + encodeURIComponent(filename);
    } else if (typeof v === 'object') {
      out[k] = rewriteMediaUrls(v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  try {
    const { data, error } = await supabase
      .from('site_config')
      .select('data')
      .eq('id', 1)
      .single();

    if (!error && data) return res.status(200).json(rewriteMediaUrls(data.data));
  } catch (e) {}

  // Supabase unavailable — fall back to committed config.json
  try {
    const raw = fs.readFileSync(path.join(process.cwd(), 'config.json'), 'utf8');
    return res.status(200).json(JSON.parse(raw));
  } catch (e) {}

  res.status(200).json(null);
};
