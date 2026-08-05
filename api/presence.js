const { supabase, checkAdmin, checkRateLimit, getIp } = require('./_lib/supabase');

const ACTIVE_WINDOW_MS = 75 * 1000;
const REPLAY_URL_RE = /^https:\/\/(eu|us)\.posthog\.com\//;

function sanitizeReplayUrl(u) {
  const s = String(u || '').slice(0, 512);
  return REPLAY_URL_RE.test(s) ? s : '';
}

module.exports = async function handler(req, res) {
  if (req.method === 'GET') {
    if (!checkAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });
    const activeSince = new Date(Date.now() - ACTIVE_WINDOW_MS).toISOString();
    const [activeRes, recentRes] = await Promise.all([
      supabase.from('presence').select('*').gte('last_seen', activeSince).order('last_seen', { ascending: false }),
      supabase.from('analytics').select('*').order('created_at', { ascending: false }).limit(15),
    ]);
    if (activeRes.error) return res.status(500).json({ error: 'Failed to fetch presence' });
    const active = (activeRes.data || []).map(r => ({
      sid: r.sid, page: r.page, country: r.country, city: r.city,
      replayUrl: r.replay_url, lastSeen: r.last_seen,
    }));
    const recent = (recentRes.data || []).map(r => ({
      ts: r.created_at, page: r.page, country: r.country, city: r.city,
      eventType: r.event_type || 'pageview', eventLabel: r.event_label,
    }));
    return res.status(200).json({ active, recent });
  }

  if (req.method === 'POST') {
    const ua = req.headers['user-agent'] || '';
    if (/bot|crawler|spider|slurp|baidu|googlebot|yandex|facebookexternalhit|semrush|ahrefs/i.test(ua)) {
      return res.status(204).end();
    }
    if (!checkRateLimit(getIp(req) + ':presence', 20)) return res.status(429).end();

    const body = req.body || {};
    const sid = String(body.sessionId || '').slice(0, 64);
    if (!sid) return res.status(204).end();

    const page = String(body.page || '').slice(0, 256);
    const replayUrl = sanitizeReplayUrl(body.replayUrl);
    const country = String(req.headers['x-vercel-ip-country'] || '').slice(0, 2);
    const city = String(req.headers['x-vercel-ip-city'] ? decodeURIComponent(req.headers['x-vercel-ip-city']) : '').slice(0, 100);

    await supabase.from('presence').upsert({
      sid, page,
      country: country || null,
      city: city || null,
      replay_url: replayUrl || null,
      last_seen: new Date().toISOString(),
    }, { onConflict: 'sid' });
    return res.status(204).end();
  }

  res.status(405).end();
};
