const { supabase, checkAdmin, checkRateLimit, getIp } = require('./_lib/supabase');

const BOT_RE = /bot|crawler|spider|slurp|baidu|googlebot|yandex|facebookexternalhit|semrush|ahrefs/i;
const EVENT_TYPES = new Set(['pageview', 'cta_click']);

module.exports = async function handler(req, res) {
  if (req.method === 'GET') {
    if (!checkAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });
    const [analyticsRes, contactsRes] = await Promise.all([
      supabase.from('analytics').select('*').order('created_at', { ascending: false }),
      supabase.from('contacts').select('id, created_at').order('created_at', { ascending: false }),
    ]);
    if (analyticsRes.error) return res.status(500).json({ error: 'Failed to fetch analytics' });
    const rows = (analyticsRes.data || []).map(r => ({
      sid: r.sid, ts: r.created_at, page: r.page, ref: r.referrer,
      duration: r.duration, country: r.country, locale: r.locale, tz: r.tz,
      consented: !!r.consented, city: r.city, region: r.region,
      utmSource: r.utm_source, utmMedium: r.utm_medium, utmCampaign: r.utm_campaign,
      eventType: r.event_type || 'pageview', eventLabel: r.event_label,
    }));
    const contacts = (contactsRes.data || []).map(c => ({ id: c.id, ts: c.created_at }));
    return res.status(200).json({ rows, contacts });
  }

  if (req.method === 'POST') {
    const ua = req.headers['user-agent'] || '';
    if (BOT_RE.test(ua)) return res.status(204).end();
    if (!checkRateLimit(getIp(req) + ':analytics', 30)) return res.status(429).end();

    const body = req.body || {};
    const consented = body.consented === true;

    const sid      = consented ? String(body.sessionId || '').slice(0, 64) : null;
    const page     = String(body.page      || '').slice(0, 256);
    const referrer = String(body.referrer  || '').slice(0, 256);
    const duration = consented ? Math.min(Math.max(parseInt(body.duration) || 0, 0), 86400) : 0;
    const locale   = String(body.locale    || '').slice(0, 20);
    const tz       = String(body.tz        || '').slice(0, 64);

    const localeCountry = (locale.includes('-') ? locale.split('-').pop() : '').toUpperCase().slice(0, 2);
    const country = String(req.headers['x-vercel-ip-country'] || localeCountry || '').slice(0, 2);
    const region  = String(req.headers['x-vercel-ip-country-region'] || '').slice(0, 100);
    const city    = String(req.headers['x-vercel-ip-city'] ? decodeURIComponent(req.headers['x-vercel-ip-city']) : '').slice(0, 100);

    const utmSource   = String(body.utmSource   || '').slice(0, 100);
    const utmMedium   = String(body.utmMedium   || '').slice(0, 100);
    const utmCampaign = String(body.utmCampaign || '').slice(0, 100);

    const eventType  = EVENT_TYPES.has(body.eventType) ? body.eventType : 'pageview';
    const eventLabel = eventType === 'cta_click' ? String(body.eventLabel || '').slice(0, 200) : null;

    await supabase.from('analytics').insert({
      sid, page, referrer, duration, country, locale, tz, consented,
      city: city || null, region: region || null,
      utm_source: utmSource || null, utm_medium: utmMedium || null, utm_campaign: utmCampaign || null,
      event_type: eventType, event_label: eventLabel,
    });
    return res.status(204).end();
  }

  res.status(405).end();
};
