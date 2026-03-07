import { supabase, checkAdmin, checkRateLimit, getIp } from './_lib/supabase.js';

const BOT_RE = /bot|crawler|spider|slurp|baidu|googlebot|yandex|facebookexternalhit|semrush|ahrefs/i;

export default async function handler(req, res) {
  // ── GET /analytics — admin protected ──────────────────────────────────────
  if (req.method === 'GET') {
    if (!checkAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });
    const { data, error } = await supabase
      .from('analytics')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: 'Failed to fetch analytics' });
    // Normalise column name: created_at → ts (matches existing config.html analytics tab)
    const rows = (data || []).map(r => ({
      sid:      r.sid,
      ts:       r.created_at,
      page:     r.page,
      ref:      r.referrer,
      duration: r.duration,
      country:  r.country,
      locale:   r.locale,
      tz:       r.tz,
    }));
    return res.status(200).json(rows);
  }

  // ── POST /analytics — public beacon ───────────────────────────────────────
  if (req.method === 'POST') {
    const ua = req.headers['user-agent'] || '';
    if (BOT_RE.test(ua)) return res.status(204).end();

    const ip = getIp(req);
    if (!checkRateLimit(ip + ':analytics', 30)) return res.status(429).end();

    const body = req.body || {};
    const sid      = String(body.sessionId || '').slice(0, 64);
    const page     = String(body.page      || '').slice(0, 256);
    const referrer = String(body.referrer  || '').slice(0, 256);
    const duration = Math.min(Math.max(parseInt(body.duration) || 0, 0), 86400);
    const locale   = String(body.locale    || '').slice(0, 20);
    const tz       = String(body.tz        || '').slice(0, 64);
    const country  = (locale.includes('-') ? locale.split('-').pop() : '').toUpperCase().slice(0, 2);

    await supabase.from('analytics').insert({ sid, page, referrer, duration, country, locale, tz });
    return res.status(204).end();
  }

  res.status(405).end();
}
