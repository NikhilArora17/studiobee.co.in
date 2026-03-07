const { supabase, checkAdmin, checkRateLimit, getIp } = require('./_lib/supabase');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  if (!checkAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });
  if (!checkRateLimit(getIp(req) + ':save-config', 20)) return res.status(429).json({ error: 'Too many requests' });

  let body = req.body;
  try {
    body = JSON.parse(JSON.stringify(body));
  } catch {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  const { error } = await supabase
    .from('site_config')
    .upsert({ id: 1, data: body, updated_at: new Date().toISOString() });

  if (error) return res.status(500).json({ error: 'Failed to save config' });
  res.status(200).json({ ok: true });
};
