/* ============================================================
   HaTi'S ALERTS ON YOUR PHONE — THE SERVICE WORKER (round 4 of Jambo's
   journey, docs/PLAN-jambo-journey.md; served at /sw.js so it covers the app)
   ============================================================
   It does two things and nothing else: shows the alert the server pushed
   (title, a line, a tag so a newer alert about the same thing replaces the
   older one), and on a tap opens HaTi on what the alert is about — focusing a
   HaTi window already open rather than opening a second. It caches nothing and
   answers no fetch, so the app loads exactly as it does without it. A tap
   presses nothing: it only opens the page. */
/* global self */
self.addEventListener('install', () => { self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(self.clients.claim()); });
self.addEventListener('push', e => {
  let m = {};
  try { m = e.data ? e.data.json() : {}; } catch (_) { m = {}; }
  e.waitUntil(self.registration.showNotification(String(m.title || 'HaTi'), {
    body: String(m.body || ''), tag: String(m.tag || 'hati'), renotify: !!m.urgent,
    data: { url: String(m.url || '/') },
  }));
});
/* only ever this app's own address: an alert can never send the reader elsewhere */
const swOwnUrl = u => { try { const x = new URL(u, self.location.origin); return x.origin === self.location.origin ? x.href : self.location.origin + '/'; } catch (_) { return self.location.origin + '/'; } };
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = swOwnUrl((e.notification.data && e.notification.data.url) || '/');
  e.waitUntil((async () => {
    const open = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const here = open.find(c => { try { return new URL(c.url).origin === self.location.origin; } catch (_) { return false; } });
    if (here){
      await here.focus();
      try { await here.navigate(url); } catch (_) { here.postMessage({ hatiGo: url }); }
      return;
    }
    await self.clients.openWindow(url);
  })());
});
