const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL    || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

const ADMIN_KEY = process.env.ADMIN_KEY || '';

function checkAdmin(req) {
  return req.headers['x-admin-key'] === ADMIN_KEY && ADMIN_KEY !== '';
}

function getIp(req) {
  return (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
}

const rateLimits = new Map();
function checkRateLimit(key, maxPerMin) {
  const now = Date.now();
  let rec = rateLimits.get(key);
  if (!rec || now > rec.resetAt) {
    rec = { count: 0, resetAt: now + 60000 };
  }
  rec.count++;
  rateLimits.set(key, rec);
  return rec.count <= maxPerMin;
}

module.exports = { supabase, ADMIN_KEY, checkAdmin, getIp, checkRateLimit };
