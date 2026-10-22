/* ALERTS ON YOUR PHONE — where the reader looks
   ============================================================
   Round 4 of Jambo's journey (owner, 22 Oct 2026: browser push, "option 2" —
   urgent things as they happen, the rest in one morning summary). f865 pins
   the server; this file asks the reader's questions in a real browser, with a
   stand-in push service (a headless browser has no real one, so the browser's
   own subscribe answers with a stand-in address; everything after it is real):
     1 · Settings › You › How you're told carries "Alerts on this device"
         after the daily brief, its words saying where this device stands,
         and a switch
     2 · pressing it asks the browser, registers HaTi's helper at /sw.js,
         and the first alert really goes: the stand-in service receives it,
         and the toast says it is on its way; the row then says On
     3 · the helper shows an alert pushed to it, and only ever opens HaTi's
         own address
     4 · the phone's account sheet carries the same row, and turning off
         there turns this device off on the server
     5 · the owner's three screens: the row painted, nothing sideways
   Run: node test/chromium/alerts-on-your-phone-verify.js */
/* global PushManager, PushEvent, self, swOwnUrl -- these run inside the page and its service worker */
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const crypto = require('node:crypto');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, FIXTURES } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = process.env.SHOTS_OUT || path.join(__dirname, 'shots', 'alerts-on-your-phone');
fs.mkdirSync(OUT, { recursive: true });

let failures = 0, passes = 0;
const check = (ok, what, detail) => {
  console.log((ok ? 'PASS  ' : 'FAIL  ') + what + (detail != null ? ' — ' + JSON.stringify(detail) : ''));
  if (ok) passes++; else failures++;
};
const until = async (page, fn, arg, ms = 8000) => {
  try { await page.waitForFunction(fn, arg, { timeout: ms }); return true; } catch (_) { return false; }
};
const still = page => until(page, () => !document.getAnimations().some(a => a.playState === 'running'), null, 4000);

function startPushService(){
  const got = [];
  const server = http.createServer((req, res) => {
    const chunks = []; req.on('data', d => chunks.push(d));
    req.on('end', () => { got.push({ url: req.url, body: Buffer.concat(chunks) }); res.writeHead(201); res.end(); });
  });
  return new Promise(r => server.listen(0, '127.0.0.1', () => r({ base: 'http://127.0.0.1:' + server.address().port, got,
    stop: () => new Promise(x => server.close(x)) })));
}
/* the stand-in phone's keys, and how a phone opens what arrives (RFC 8291) */
const ec = crypto.createECDH('prime256v1'); ec.generateKeys();
const auth = crypto.randomBytes(16);
function openAlert(body){
  const salt = body.subarray(0, 16), idlen = body[20], asPub = body.subarray(21, 21 + idlen), sealed = body.subarray(21 + idlen);
  const hmac = (k, d) => crypto.createHmac('sha256', k).update(d).digest();
  const ikm = hmac(hmac(auth, ec.computeSecret(asPub)), Buffer.concat([Buffer.from('WebPush: info\0'), ec.getPublicKey(), asPub, Buffer.from([1])]));
  const prk = hmac(salt, ikm);
  const d = crypto.createDecipheriv('aes-128-gcm', hmac(prk, Buffer.from('Content-Encoding: aes128gcm\0\x01')).subarray(0, 16),
    hmac(prk, Buffer.from('Content-Encoding: nonce\0\x01')).subarray(0, 12));
  d.setAuthTag(sealed.subarray(sealed.length - 16));
  const plain = Buffer.concat([d.update(sealed.subarray(0, sealed.length - 16)), d.final()]);
  return JSON.parse(plain.subarray(0, plain.length - 1).toString('utf8'));
}

(async () => {
  const push = await startPushService();
  const h = await startHati({ PUSH_ENDPOINT_TEST_PREFIX: push.base });
  await seedWorkspace(h, { contracts: FIXTURES, approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [], blocked = [];
  try {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 780 } });
    await ctx.grantPermissions(['notifications'], { origin: h.base });
    /* A HEADLESS BROWSER HAS NO PUSH SERVICE: its subscribe answers with the stand-in's address and this
       phone's keys; getSubscription and unsubscribe follow it. Everything else is the browser's own. */
    await ctx.addInitScript(sub => {
      if (!window.PushManager) return;
      let held = null;
      const make = () => ({ endpoint: sub.endpoint, toJSON: () => ({ endpoint: sub.endpoint, keys: sub.keys }),
        unsubscribe: async () => { held = null; return true; } });
      PushManager.prototype.subscribe = async function(){ held = make(); return held; };
      PushManager.prototype.getSubscription = async function(){ return held; };
    }, { endpoint: push.base + '/ep/this-laptop', keys: { p256dh: ec.getPublicKey().toString('base64url'), auth: auth.toString('base64url') } });
    const P = await ctx.newPage();
    P.setDefaultTimeout(8000);
    P.on('pageerror', e => errors.push(String(e && e.message || e)));
    const drive = async (fn, arg, fallback) => {
      try { return await P.evaluate(fn, arg); } catch (e) { blocked.push(String(e && e.message || e).split('\n')[0]); return fallback; }
    };
    await P.goto(h.base + '/', { waitUntil: 'networkidle' });
    await P.fill('#li-email', 'admin@example.co.ke');
    await P.fill('#li-pass', 'adminpassword1');
    await P.click('#li-go');
    await until(P, () => !!(window.currentUser && currentUser() && typeof setView === 'function'), null, 15000);

    /* ============ 1 · THE ROW ============ */
    const ROW = '#set-page [data-st-row="push"]';
    for (let i = 0; i < 10; i++){
      await drive(() => { if (state.view !== 'team') setView('team'); if (typeof settingsGoTab === 'function') settingsGoTab('you'); }, null, null);
      if (await until(P, s => !!document.querySelector(s), ROW, 1500)) break;
    }
    const said = await until(P, s => { const r = document.querySelector(s); return !!(r && r.querySelector('[data-st-sw="push"]')); }, ROW, 8000);
    const row = await drive(s => { const r = document.querySelector(s); if (!r) return null; r.scrollIntoView({ block: 'center' });
      const b = r.getBoundingClientRect(); const at = document.elementFromPoint(b.left + 20, b.top + b.height / 2);
      const labels = [...r.closest('[data-st-you-card="told"]').querySelectorAll('.st-sl')].map(x => x.textContent);
      return { text: r.innerText.replace(/\s+/g, ' ').trim(), painted: !!(at && r.contains(at)), labels,
        sw: (r.querySelector('[data-st-sw="push"]') || {}).getAttribute ? r.querySelector('[data-st-sw="push"]').getAttribute('aria-checked') : null }; }, ROW, null);
    check(said && !!(row && row.painted && /Alerts on this device/.test(row.text) && /Off\. Turn on/.test(row.text) && row.sw === 'false'),
      '1a "Alerts on this device" is painted, says Off and what on would do, with its switch', row);
    check(!!(row && row.labels[0] === 'Daily brief' && row.labels[1] === 'Alerts on this device'), '1b right after the daily brief', row && row.labels);
    await still(P); await P.screenshot({ path: path.join(OUT, '1440x780-off.png') });

    /* ============ 2 · TURNING ON ============ */
    await P.click(ROW + ' [data-st-sw="push"]');
    const on = await until(P, s => /On: urgent things as they happen/.test((document.querySelector(s) || {}).innerText || ''), ROW, 10000);
    const toastSaid = await drive(() => document.body.innerText, null, '');
    const reg = await drive(async () => { const r = await navigator.serviceWorker.getRegistration('/'); return r ? (r.active || r.waiting || r.installing || {}).scriptURL || 'none' : null; }, null, null);
    check(on, '2a the row then says On: urgent things as they happen, the rest each morning');
    check(/Alerts are on\. The first one is on its way\./.test(toastSaid), '2b the toast says the first alert is on its way', toastSaid.slice(0, 200));
    check(/\/sw\.js$/.test(String(reg || '')), '2c HaTi\'s helper is registered at /sw.js', reg);
    let first = null; try { first = push.got.length ? openAlert(push.got[0].body) : null; } catch (e) { first = { error: e.message }; }
    check(!!(first && first.title === 'Alerts are on' && first.kind === 'hello'), '2d the stand-in push service received the first alert, and it opens with this device\'s key', first);
    check(push.got.length === 1, '2e one press, one device, one first alert', push.got.length);
    await still(P); await P.screenshot({ path: path.join(OUT, '1440x780-on.png') });

    /* ============ 3 · THE HELPER ============ */
    const sw = ctx.serviceWorkers().find(w => /\/sw\.js$/.test(w.url())) || await ctx.waitForEvent('serviceworker', { timeout: 5000 }).catch(() => null);
    let shown = null, own = null;
    if (sw){
      try {
        shown = await sw.evaluate(async () => {
          self.dispatchEvent(new PushEvent('push', { data: JSON.stringify({ title: 'Your turn to sign', body: 'Office Lease (PH-1)', tag: 'sign:PH-1', url: '/#contract=PH-1&tab=sign', urgent: true }) }));
          for (let i = 0; i < 40; i++){ const n = await self.registration.getNotifications(); if (n.length) return n.map(x => ({ title: x.title, body: x.body, tag: x.tag, url: x.data && x.data.url })); await new Promise(r => setTimeout(r, 100)); }
          return [];
        });
        own = await sw.evaluate(() => [swOwnUrl('https://evil.example/x'), swOwnUrl('/#contract=PH-1')]);
      } catch (e) { blocked.push('sw: ' + String(e && e.message || e).split('\n')[0]); }
    } else blocked.push('no service worker found');
    check(!!(shown && shown.some(n => n.title === 'Your turn to sign' && n.body === 'Office Lease (PH-1)' && /#contract=PH-1/.test(n.url))), '3a the helper shows an alert pushed to it', shown);
    check(!!(own && own[0] === h.base + '/' && own[1] === h.base + '/#contract=PH-1'), '3b a tap only ever opens HaTi\'s own address', own);

    /* ============ 5 · THE OWNER'S THREE SCREENS ============ */
    for (const [w, hh] of [[1440, 780], [1536, 730], [1366, 950]]){
      await P.setViewportSize({ width: w, height: hh });
      const fit = await drive(s => { const r = document.querySelector(s); if (!r) return {}; r.scrollIntoView({ block: 'center' });
        const b = r.getBoundingClientRect(); const at = document.elementFromPoint(b.left + 20, b.top + b.height / 2);
        return { side: document.documentElement.scrollWidth > window.innerWidth + 1, painted: !!(at && r.contains(at)), inside: b.right <= window.innerWidth }; }, ROW, {});
      check(!fit.side && fit.painted && fit.inside, `5 ${w}×${hh}: the row is painted, nothing sideways`, fit);
      await still(P); await P.screenshot({ path: path.join(OUT, `${w}x${hh}-settings.png`) });
    }

    /* ============ 4 · THE PHONE ============ */
    await P.setViewportSize({ width: 390, height: 844 });
    await until(P, () => !!document.getElementById('m-root') && getComputedStyle(document.getElementById('m-root')).display !== 'none', null, 8000);
    await drive(() => { if (typeof mOpenSheet === 'function') mOpenSheet('account'); }, null, null);
    const prow = await until(P, () => !!document.querySelector('[data-m-push] [data-m-act="push-toggle"]'), null, 8000);
    const pw = await drive(() => { const r = document.querySelector('[data-m-push]'); if (!r) return null; r.scrollIntoView({ block: 'center' });
      const b = r.getBoundingClientRect(); const at = document.elementFromPoint(b.left + 20, b.top + b.height / 2);
      return { text: r.innerText.replace(/\s+/g, ' ').trim(), painted: !!(at && r.contains(at)) }; }, null, null);
    check(prow && !!(pw && pw.painted && /Turn off alerts/.test(pw.text) && /On: urgent/.test(pw.text)), '4a the phone\'s account sheet carries the same row, On', pw);
    await still(P); await P.screenshot({ path: path.join(OUT, '390x844-phone.png') });
    await P.click('[data-m-push] [data-m-act="push-toggle"]');
    const off = await until(P, () => /Turn on alerts/.test((document.querySelector('[data-m-push]') || {}).innerText || ''), null, 8000);
    const devices = await drive(async () => (await api('push/key')).devices, null, -1);
    check(off && devices === 0, '4b turning off there turns this device off on the server', { off, devices });
    await still(P); await P.screenshot({ path: path.join(OUT, '390x844-phone-off.png') });

    check(!errors.length, 'no page errors', errors.slice(0, 3));
  } catch (e) {
    check(false, 'the run finished', String(e && e.stack || e).split('\n').slice(0, 3).join(' '));
  } finally {
    if (blocked.length) console.log('BLOCKED  ' + [...new Set(blocked)].join(' · '));
    await browser.close(); await h.stop(); await push.stop();
    console.log(`\n${passes} passed, ${failures} failed`);
    process.exit(failures ? 1 : 0);
  }
})();
