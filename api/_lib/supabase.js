import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.SUPABASE_URL    || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

export const ADMIN_KEY = process.env.ADMIN_KEY || '';

export function checkAdmin(req) {
  return req.headers['x-admin-key'] === ADMIN_KEY && ADMIN_KEY !== '';
}

export function getIp(req) {
  return (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
}

// Simple in-memory rate limiter — resets on cold start (fine for low traffic)
const rateLimits = new Map();
export function checkRateLimit(key, maxPerMin) {
  const now = Date.now();
  let rec = rateLimits.get(key);
  if (!rec || now > rec.resetAt) {
    rec = { count: 0, resetAt: now + 60_000 };
  }
  rec.count++;
  rateLimits.set(key, rec);
  return rec.count <= maxPerMin;
}
