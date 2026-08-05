// StudioBee shared analytics: consent banner, pageview/CTA beacons.
// Loaded on every public page (index.html, case-studies.html, case-study.html).
(function () {
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') return;

  var API = (window.location.port === '5500') ? 'http://localhost:3000' : '';
  var CONSENT_KEY = '_sb_consent';
  var SID_KEY = '_sb_sid';

  function getConsent() {
    try { return localStorage.getItem(CONSENT_KEY); } catch (e) { return null; }
  }
  function setConsent(v) {
    try { localStorage.setItem(CONSENT_KEY, v); } catch (e) {}
  }
  function isConsented() { return getConsent() === 'granted'; }

  function getSid() {
    if (!isConsented()) return null;
    try {
      var id = sessionStorage.getItem(SID_KEY);
      if (!id) {
        id = Math.random().toString(36).slice(2) + Date.now().toString(36);
        sessionStorage.setItem(SID_KEY, id);
      }
      return id;
    } catch (e) { return null; }
  }

  function getUtm() {
    var params = new URLSearchParams(location.search);
    return {
      utmSource: params.get('utm_source') || '',
      utmMedium: params.get('utm_medium') || '',
      utmCampaign: params.get('utm_campaign') || '',
    };
  }

  function send(payload, useBeacon) {
    var body = JSON.stringify(payload);
    try {
      if (useBeacon && navigator.sendBeacon) {
        navigator.sendBeacon(API + '/analytics', body);
      } else {
        fetch(API + '/analytics', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body, keepalive: true });
      }
    } catch (e) {}
  }

  var start = Date.now();
  var page = location.pathname + location.search;
  var utm = getUtm();

  function trackPageview(duration) {
    send({
      eventType: 'pageview',
      page: page,
      referrer: document.referrer || '',
      duration: duration || 0,
      consented: isConsented(),
      sessionId: getSid(),
      locale: navigator.language || '',
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
      utmSource: utm.utmSource,
      utmMedium: utm.utmMedium,
      utmCampaign: utm.utmCampaign,
    }, false);
  }

  window.SBTrack = function (label) {
    send({
      eventType: 'cta_click',
      eventLabel: String(label || ''),
      page: page,
      consented: isConsented(),
      sessionId: getSid(),
    }, false);
  };

  // ── PostHog session replay (consented sessions only) ───────────────────────
  var POSTHOG_TOKEN = 'phc_AE89s7iL9TRtKeie69cbFr7Mi7F59McQpuGoMPYiq882';
  var POSTHOG_HOST = 'https://eu.i.posthog.com';
  var POSTHOG_ASSETS = 'https://eu-assets.i.posthog.com';
  var posthogReady = false;

  function loadPostHog(onReady) {
    if (window.posthog && posthogReady) { onReady(); return; }
    var s = document.createElement('script');
    s.src = POSTHOG_ASSETS + '/static/array.js';
    s.async = true;
    s.onload = function () {
      window.posthog.init(POSTHOG_TOKEN, {
        api_host: POSTHOG_HOST,
        person_profiles: 'identified_only',
        loaded: function () {
          posthogReady = true;
          onReady();
        },
      });
    };
    document.head.appendChild(s);
  }

  function getReplayUrl() {
    try {
      return (posthogReady && window.posthog.get_session_replay_url)
        ? window.posthog.get_session_replay_url({ withTimestamp: true }) : '';
    } catch (e) { return ''; }
  }

  // ── Live presence heartbeat (consented sessions only) ──────────────────────
  var HEARTBEAT_MS = 20000;
  var heartbeatTimer = null;

  function sendHeartbeat() {
    var sid = getSid();
    if (!sid) return;
    fetch(API + '/presence', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: sid, page: page, replayUrl: getReplayUrl() }),
      keepalive: true,
    }).catch(function () {});
  }

  function startHeartbeat() {
    if (!isConsented() || heartbeatTimer) return;
    sendHeartbeat();
    heartbeatTimer = setInterval(sendHeartbeat, HEARTBEAT_MS);
  }

  function initLiveTracking() {
    if (!isConsented()) return;
    loadPostHog(function () { sendHeartbeat(); });
    startHeartbeat();
  }

  initLiveTracking();

  trackPageview(0);
  window.addEventListener('pagehide', function () {
    send({
      eventType: 'pageview',
      page: page,
      referrer: document.referrer || '',
      duration: Math.round((Date.now() - start) / 1000),
      consented: isConsented(),
      sessionId: getSid(),
      locale: navigator.language || '',
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
      utmSource: utm.utmSource,
      utmMedium: utm.utmMedium,
      utmCampaign: utm.utmCampaign,
    }, true);
  });

  // Delegated CTA click tracking
  document.addEventListener('click', function (e) {
    var el = e.target.closest && e.target.closest('[data-track-cta]');
    if (el) window.SBTrack(el.getAttribute('data-track-cta'));
  });

  // Consent banner
  function showBanner() {
    if (getConsent()) return;
    var bar = document.createElement('div');
    bar.id = 'sb-consent-bar';
    bar.setAttribute('role', 'dialog');
    bar.setAttribute('aria-label', 'Cookie consent');
    bar.style.cssText = 'position:fixed;left:16px;right:16px;bottom:16px;z-index:9998;max-width:520px;margin:0 auto;' +
      'background:#0A0A0A;color:#FBFBFB;border-radius:12px;padding:16px 20px;box-shadow:0 12px 32px rgba(0,0,0,0.35);' +
      'font-family:"DM Sans",sans-serif;font-size:13px;line-height:1.5;display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:space-between;';
    bar.innerHTML =
      '<span style="flex:1;min-width:200px;opacity:0.85;">We use cookies to understand how visitors use this site.</span>' +
      '<span style="display:flex;gap:8px;flex-shrink:0;">' +
        '<button id="sb-consent-reject" style="background:transparent;color:#FBFBFB;border:1px solid rgba(251,251,251,0.3);border-radius:8px;padding:8px 14px;font-size:13px;cursor:pointer;">Reject</button>' +
        '<button id="sb-consent-accept" style="background:#2F48DF;color:#FBFBFB;border:none;border-radius:8px;padding:8px 14px;font-size:13px;cursor:pointer;">Accept</button>' +
      '</span>';
    document.body.appendChild(bar);

    document.getElementById('sb-consent-accept').addEventListener('click', function () {
      setConsent('granted');
      bar.remove();
      trackPageview(0);
      initLiveTracking();
    });
    document.getElementById('sb-consent-reject').addEventListener('click', function () {
      setConsent('denied');
      bar.remove();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', showBanner);
  } else {
    showBanner();
  }
})();
