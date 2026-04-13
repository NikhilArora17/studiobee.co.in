import 'dotenv/config';
import http from 'http';
import fs from 'fs';
import os from 'os';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT      = parseInt(process.env.PORT) || 3000;
const MEDIA_DIR = path.join(__dirname, 'media');

process.on('uncaughtException',  e => console.error('Uncaught exception:', e));
process.on('unhandledRejection', e => console.error('Unhandled rejection:', e));

fs.mkdirSync(MEDIA_DIR, { recursive: true });

// ── Security constants ────────────────────────────────────────────────────────
const MAX_UPLOAD_BYTES    = 50 * 1024 * 1024; // 50 MB
const MAX_CONTACT_BYTES   = 64 * 1024;         // 64 KB
const MAX_ANALYTICS_BYTES = 4  * 1024;         //  4 KB

// Files that must never be served via static file handler
const BLOCKED_FILES = new Set([
  'smtp-config.json',
  'contacts.json',
  'analytics.json',   // served only via protected GET /analytics
  'package.json',
  'package-lock.json',
  'serve.mjs',
  'screenshot.mjs',
]);

// Allowed extensions for /upload
const ALLOWED_UPLOAD_EXTS = new Set([
  '.jpg', '.jpeg', '.png', '.gif', '.webp',
  '.mp4', '.webm', '.mov', '.avi', '.mkv',
]);

// HTML-escape helper for email bodies
function escHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Admin key ─────────────────────────────────────────────────────────────────
// Priority: ADMIN_KEY env var → smtp-config.json "adminKey" → random (logged once)
let adminKey = process.env.ADMIN_KEY || '';
if (!adminKey) {
  try {
    const smtpCfg = JSON.parse(fs.readFileSync(path.join(__dirname, 'smtp-config.json'), 'utf8'));
    adminKey = String(smtpCfg.adminKey || '');
  } catch (e) {}
}
if (!adminKey) {
  adminKey = crypto.randomBytes(16).toString('hex');
  console.log('──────────────────────────────────────────────────────────────');
  console.log(`Admin key (set ADMIN_KEY env var to persist): ${adminKey}`);
  console.log('──────────────────────────────────────────────────────────────');
}

// ── Optional SMTP config ──────────────────────────────────────────────────────
// Priority: SMTP_* env vars → smtp-config.json → no email (contacts.json only)
let smtpTransport = null;
let smtpTo        = 'arora.nikhil@studiobee.ai';
let smtpFrom      = 'noreply@studiobee.ai';
if (process.env.SMTP_HOST) {
  smtpTransport = nodemailer.createTransport({
    host:   process.env.SMTP_HOST,
    port:   parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  smtpTo   = process.env.SMTP_TO   || smtpTo;
  smtpFrom = process.env.SMTP_FROM || process.env.SMTP_USER;
  console.log(`SMTP configured via env → emails to ${smtpTo}`);
} else {
  try {
    const smtpCfg = JSON.parse(fs.readFileSync(path.join(__dirname, 'smtp-config.json'), 'utf8'));
    smtpTransport = nodemailer.createTransport({
      host:   smtpCfg.host,
      port:   smtpCfg.port   || 587,
      secure: smtpCfg.secure || false,
      auth: { user: smtpCfg.user, pass: smtpCfg.pass },
    });
    smtpTo   = smtpCfg.to   || smtpTo;
    smtpFrom = smtpCfg.from || smtpCfg.user;
    console.log(`SMTP configured → emails to ${smtpTo}`);
  } catch (e) {
    console.log('No SMTP config — contact submissions saved to contacts.json only');
  }
}

// ── Per-IP rate limiter ───────────────────────────────────────────────────────
const rateLimits = new Map();
function checkRateLimit(key, maxPerMin) {
  const now = Date.now();
  let rec = rateLimits.get(key);
  if (!rec || now > rec.resetAt) rec = { count: 0, resetAt: now + 60000 };
  rec.count++;
  rateLimits.set(key, rec);
  return rec.count <= maxPerMin;
}
// Clean up stale entries every 2 minutes
setInterval(() => {
  const now = Date.now();
  for (const [k, rec] of rateLimits) {
    if (now > rec.resetAt + 60000) rateLimits.delete(k);
  }
}, 120000);

// ── MIME types ────────────────────────────────────────────────────────────────
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.mjs':  'application/javascript',
  '.json': 'application/json',
  '.xml':  'application/xml',
  '.txt':  'text/plain',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.ttf':  'font/ttf',
  '.webp': 'image/webp',
  '.mp4':  'video/mp4',
  '.webm': 'video/webm',
  '.mov':  'video/quicktime',
  '.avi':  'video/x-msvideo',
  '.mkv':  'video/x-matroska',
};

// ── CSP header value ──────────────────────────────────────────────────────────
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.tailwindcss.com",
  "font-src https://fonts.gstatic.com",
  "img-src 'self' data: https://images.unsplash.com https://placehold.co https://*.supabase.co",
  "media-src 'self' blob: https://*.supabase.co",
  "connect-src 'self'",
  "frame-ancestors 'none'",
].join('; ');

// ── Allowed CORS origins ──────────────────────────────────────────────────────
const ALLOWED_ORIGINS = new Set([
  'https://studiobee.co.in',
  'https://www.studiobee.co.in',
  'http://localhost:3000',
  'http://localhost:5500',
]);

const server = http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split('?')[0]);

  // Client IP (respects reverse-proxy X-Forwarded-For)
  const ip = ((req.headers['x-forwarded-for'] || '').split(',')[0].trim()
           || req.socket.remoteAddress
           || '').replace('::ffff:', '');

  // ── Security headers on ALL responses ────────────────────────────────────
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Content-Security-Policy', CSP);

  // ── CORS (restricted to known origins) ───────────────────────────────────
  const reqOrigin = req.headers.origin || '';
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGINS.has(reqOrigin) ? reqOrigin : 'https://studiobee.co.in');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-Filename, Content-Type, X-Admin-Key');
  res.setHeader('Vary', 'Origin');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  // ── GET /ping ─────────────────────────────────────────────────────────────
  if ((req.method === 'GET' || req.method === 'HEAD') && urlPath === '/ping') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  // ── GET /analytics (admin protected) ─────────────────────────────────────
  if (req.method === 'GET' && urlPath === '/analytics') {
    if (req.headers['x-admin-key'] !== adminKey) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorized' }));
      return;
    }
    const analyticsFile = path.join(__dirname, 'analytics.json');
    try {
      const raw = fs.readFileSync(analyticsFile, 'utf8');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(raw);
    } catch (e) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end('[]');
    }
    return;
  }

  // ── POST /analytics ───────────────────────────────────────────────────────
  if (req.method === 'POST' && urlPath === '/analytics') {
    // Skip known bots
    const ua = (req.headers['user-agent'] || '').toLowerCase();
    if (/bot|crawler|spider|slurp|baidu|googlebot|yandex|facebookexternalhit|semrush|ahrefs/.test(ua)) {
      res.writeHead(204); res.end(); return;
    }
    // Rate limit: 30/min per IP
    if (!checkRateLimit(ip + ':analytics', 30)) {
      res.writeHead(429); res.end('Too Many Requests'); return;
    }
    let totalSize = 0;
    const chunks = [];
    req.on('data', c => {
      totalSize += c.length;
      if (totalSize > MAX_ANALYTICS_BYTES) { req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => {
      try {
        const body = JSON.parse(Buffer.concat(chunks).toString());
        const locale = String(body.locale || '');
        const locParts = locale.split('-');
        const country = locParts.length > 1 ? locParts[locParts.length - 1].toUpperCase().slice(0, 2) : '';
        const entry = {
          sid:      String(body.sessionId || '').slice(0, 64),
          ts:       new Date().toISOString(),
          page:     String(body.page || '/').slice(0, 256),
          ref:      String(body.referrer || '').slice(0, 256),
          duration: Math.min(Math.max(0, Number(body.duration) || 0), 86400),
          country,
          locale:   locale.slice(0, 20),
          tz:       String(body.tz || '').slice(0, 64),
        };
        const analyticsFile = path.join(__dirname, 'analytics.json');
        let arr = [];
        try { arr = JSON.parse(fs.readFileSync(analyticsFile, 'utf8')); } catch (e) {}
        if (!Array.isArray(arr)) arr = [];
        arr.push(entry);
        if (arr.length > 10000) arr = arr.slice(arr.length - 10000);
        fs.writeFileSync(analyticsFile, JSON.stringify(arr));
        res.writeHead(204); res.end();
      } catch (e) {
        res.writeHead(400); res.end('Bad request');
      }
    });
    return;
  }

  // ── POST /contact ─────────────────────────────────────────────────────────
  if (req.method === 'POST' && urlPath === '/contact') {
    if (!checkRateLimit(ip + ':contact', 5)) {
      res.writeHead(429, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Too many requests. Please wait a moment.' }));
      return;
    }
    let totalSize = 0;
    const chunks = [];
    req.on('data', c => {
      totalSize += c.length;
      if (totalSize > MAX_CONTACT_BYTES) { req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', async () => {
      try {
        const body = JSON.parse(Buffer.concat(chunks).toString());
        const name    = String(body.name    || '').trim().slice(0, 200);
        const email   = String(body.email   || '').trim().slice(0, 200);
        const phone   = String(body.phone   || '').trim().slice(0, 50);
        const city    = String(body.city    || '').trim().slice(0, 100);
        const message = String(body.message || '').trim().slice(0, 5000);

        const contactsFile = path.join(__dirname, 'contacts.json');
        let contacts = [];
        try { contacts = JSON.parse(fs.readFileSync(contactsFile, 'utf8')); } catch (e) {}
        contacts.push({ name, email, phone, city, message, timestamp: new Date().toISOString() });
        fs.writeFileSync(contactsFile, JSON.stringify(contacts, null, 2));
        console.log(`New contact: ${name} <${email}> — ${city}`);

        if (smtpTransport) {
          try {
            await smtpTransport.sendMail({
              from:    `"studiobee Website" <${smtpFrom}>`,
              to:      smtpTo,
              subject: `New Project Inquiry — ${escHtml(name)}`,
              html: `
                <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;">
                  <h2 style="color:#2F48DF;margin-bottom:24px;font-size:22px;">New project inquiry</h2>
                  <table style="width:100%;border-collapse:collapse;">
                    <tr><td style="padding:10px 0;border-bottom:1px solid #eee;color:#888;width:100px;">Name</td><td style="padding:10px 0;border-bottom:1px solid #eee;font-weight:600;">${escHtml(name)}</td></tr>
                    <tr><td style="padding:10px 0;border-bottom:1px solid #eee;color:#888;">Email</td><td style="padding:10px 0;border-bottom:1px solid #eee;">${escHtml(email)}</td></tr>
                    <tr><td style="padding:10px 0;border-bottom:1px solid #eee;color:#888;">Phone</td><td style="padding:10px 0;border-bottom:1px solid #eee;">${escHtml(phone)}</td></tr>
                    <tr><td style="padding:10px 0;border-bottom:1px solid #eee;color:#888;">City</td><td style="padding:10px 0;border-bottom:1px solid #eee;">${escHtml(city)}</td></tr>
                  </table>
                  <div style="margin-top:24px;">
                    <p style="color:#888;margin-bottom:8px;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;">Message</p>
                    <p style="background:#f7f7f7;padding:18px;border-radius:8px;line-height:1.65;color:#333;">${escHtml(message).replace(/\n/g, '<br/>')}</p>
                  </div>
                  <p style="margin-top:32px;font-size:12px;color:#bbb;">Sent from studiobee.co.in</p>
                </div>
              `,
            });
            console.log(`Email sent to ${smtpTo}`);
          } catch (e) {
            console.error('Email failed:', e.message);
          }

          // Confirmation email to submitter
          if (email) {
            try {
              await smtpTransport.sendMail({
                from:    `"studiobee" <${smtpFrom}>`,
                to:      email,
                subject: `We received your inquiry, ${name}`,
                html: `
                  <div style="background:#0A0A0A;padding:0;margin:0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
                    <div style="max-width:560px;margin:0 auto;padding:48px 32px;">
                      <p style="font-size:22px;font-weight:700;color:#2F48DF;letter-spacing:-0.02em;margin:0 0 32px;">studiobee</p>
                      <h1 style="font-size:28px;font-weight:400;color:#FBFBFB;line-height:1.25;margin:0 0 16px;">Thanks for reaching out,<br/>${escHtml(name)}.</h1>
                      <p style="font-size:15px;line-height:1.7;color:rgba(251,251,251,0.55);margin:0 0 36px;">We've received your brief and will review it shortly. Expect a reply within <strong style="color:#FBFBFB;">one business day</strong>.</p>
                      <div style="background:rgba(47,72,223,0.12);border:1px solid rgba(47,72,223,0.25);border-radius:12px;padding:24px 28px;margin-bottom:36px;">
                        <p style="font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:rgba(251,251,251,0.35);margin:0 0 16px;">Your submission</p>
                        <table style="width:100%;border-collapse:collapse;">
                          <tr><td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.07);color:rgba(251,251,251,0.4);font-size:13px;width:80px;">Name</td><td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.07);color:#FBFBFB;font-size:13px;">${escHtml(name)}</td></tr>
                          <tr><td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.07);color:rgba(251,251,251,0.4);font-size:13px;">City</td><td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.07);color:#FBFBFB;font-size:13px;">${escHtml(city)}</td></tr>
                          <tr><td style="padding:8px 0;color:rgba(251,251,251,0.4);font-size:13px;vertical-align:top;">Message</td><td style="padding:8px 0;color:rgba(251,251,251,0.65);font-size:13px;line-height:1.6;">${escHtml(message).replace(/\n/g, '<br/>')}</td></tr>
                        </table>
                      </div>
                      <p style="font-size:13px;color:rgba(251,251,251,0.25);margin:0;">studiobee · creative studio, Gurgaon · <a href="https://studiobee.co.in" style="color:#2F48DF;text-decoration:none;">studiobee.co.in</a></p>
                    </div>
                  </div>
                `,
              });
              console.log(`Confirmation email sent to ${email}`);
            } catch (e) {
              console.error('Confirmation email failed:', e.message);
            }
          }
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      } catch (err) {
        res.writeHead(400); res.end('Bad request');
      }
    });
    return;
  }

  // ── POST /upload ──────────────────────────────────────────────────────────
  if (req.method === 'POST' && urlPath === '/upload') {
    if (!checkRateLimit(ip + ':upload', 10)) {
      res.writeHead(429, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Too many requests' }));
      return;
    }
    const rawName = req.headers['x-filename']
      ? decodeURIComponent(req.headers['x-filename'])
      : 'upload.bin';
    const ext = path.extname(rawName).toLowerCase() || '.bin';
    if (!ALLOWED_UPLOAD_EXTS.has(ext)) {
      res.writeHead(415, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'File type not allowed' }));
      return;
    }
    try {
      fs.mkdirSync(MEDIA_DIR, { recursive: true });
    } catch (e) {
      console.error('Cannot create media dir:', e);
      res.writeHead(500); res.end('Upload failed');
      return;
    }
    const base = path.basename(rawName, ext).replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
    const name = Date.now() + '-' + base + ext;
    const dest = path.join(MEDIA_DIR, name);
    const writeStream = fs.createWriteStream(dest);
    let totalSize = 0;
    let aborted = false;

    req.on('error', () => {
      aborted = true;
      writeStream.destroy();
      fs.unlink(dest, () => {});
      if (!res.headersSent) { res.writeHead(400); res.end('Upload error'); }
    });
    req.on('data', c => {
      if (aborted) return;
      totalSize += c.length;
      if (totalSize > MAX_UPLOAD_BYTES) {
        aborted = true;
        writeStream.destroy();
        fs.unlink(dest, () => {});
        res.writeHead(413, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'File too large (max 50 MB)' }));
        req.destroy();
        return;
      }
      writeStream.write(c);
    });
    req.on('end', () => {
      if (aborted) return;
      writeStream.end();
    });
    writeStream.on('finish', () => {
      if (aborted) return;
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ url: '/media/' + name }));
    });
    writeStream.on('error', err => {
      console.error('Upload write error:', err);
      aborted = true;
      fs.unlink(dest, () => {});
      if (!res.headersSent) { res.writeHead(500); res.end('Upload failed'); }
    });
    return;
  }

  // ── POST /save-config (admin protected) ───────────────────────────────────
  if (req.method === 'POST' && urlPath === '/save-config') {
    if (req.headers['x-admin-key'] !== adminKey) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorized' }));
      return;
    }
    if (!checkRateLimit(ip + ':save-config', 20)) {
      res.writeHead(429); res.end('Too Many Requests'); return;
    }
    let totalSize = 0;
    const chunks = [];
    req.on('data', c => {
      totalSize += c.length;
      if (totalSize > MAX_UPLOAD_BYTES) { req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => {
      try {
        const body = Buffer.concat(chunks).toString();
        JSON.parse(body); // validate JSON
        fs.writeFileSync(path.join(__dirname, 'config.json'), body);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      } catch (e) {
        res.writeHead(400); res.end('Bad JSON');
      }
    });
    return;
  }

  // ── Static file server ─────────────────────────────────────────────────────
  if (urlPath === '/') urlPath = '/index.html';
  const filePath = path.resolve(__dirname, '.' + urlPath);

  // Path traversal guard
  const rootWithSep = __dirname + path.sep;
  if (!filePath.startsWith(rootWithSep) && filePath !== __dirname) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }

  // Block sensitive files
  const basename = path.basename(filePath);
  if (BLOCKED_FILES.has(basename)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }

  // Block node_modules and dotfiles
  if (filePath.includes(path.sep + 'node_modules' + path.sep) || basename.startsWith('.')) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }

  const fileExt     = path.extname(filePath).toLowerCase();
  const contentType = MIME[fileExt] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    if (fileExt === '.html') {
      // Inject server-side config before content.js loads
      let cfgJson = 'null';
      try {
        const raw = fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8').trim();
        cfgJson = JSON.stringify(JSON.parse(raw));
      } catch (e) {}
      const cfgInjection = `<script>window.__SITE_CONFIG__ = ${cfgJson};</script>\n`;
      let html = data.toString().replace(
        '<script src="content.js">',
        cfgInjection + '<script src="content.js">'
      );
      // Inject admin key into config.html only (not public pages)
      if (basename === 'config.html') {
        html = html.replace(
          '</head>',
          `<script>window.__ADMIN_KEY__ = ${JSON.stringify(adminKey)};</script>\n</head>`
        );
      }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
      return;
    }

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  const nets = Object.values(os.networkInterfaces()).flat();
  const lan  = nets.find(n => n.family === 'IPv4' && !n.internal);
  console.log(`studiobee server running at http://localhost:${PORT}`);
  if (lan) console.log(`On your phone (same WiFi):   http://${lan.address}:${PORT}`);
});
