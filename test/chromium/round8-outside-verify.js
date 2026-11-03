/* THE NEW LOOK, ROUND 8 FIRST HALF (2 Nov 2026; the review room's sign-in and an expired link, behind the company's own
   setting "the new look for people outside", off by default; the owner's answers of 2 Nov 2026).
     1 · Off: the sign-in and an expired link are today's pages; /api/status says outsideLook false
     2 · An admin turns it on from Settings & rules (People outside the company); /api/status says true
     3 · The sign-in as drawn: the black bar with the language, the wordmark and what HaTi is, the fields as lines, Sign in
         and Forgot the password; no code box for someone without two-step; signing in still works
     4 · An expired link as drawn: nothing from the agreement, the day it stopped, Ask for a new link; the press is
         recorded and the sender's bell says it
   At the parent (before this half) 2–4 fail: none of it exists.
   Run: node test/chromium/round8-outside-verify.js   (pictures: ROUND8_SHOTS=<dir>) */
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = process.env.ROUND8_SHOTS || path.join(__dirname, 'shots', 'round8-outside');
const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let fails = 0;
const check = (name, ok, more) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${more ? ' — ' + (typeof more === 'string' ? more : JSON.stringify(more)) : ''}`); if (!ok) fails++; };
const until = async (page, fn, arg, ms = 15000) => { try { await page.waitForFunction(fn, arg, { timeout: ms }); return true; } catch (_) { return false; } };

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati(); const w = await seedWorkspace(h, { approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const s = await w.admin.json('/api/shares', { method: 'POST', body: { payload: { v: 1, kind: 'hati-share', org: 'Highland Corporate Ltd', sharedBy: 'Amina Otieno', at: new Date().toISOString(), docHash: 'x', purpose: 'negotiate',
    contract: { id: 'MK-A1', name: 'Supply Agreement', counterparty: 'Kabras Sugar', value: 1, valueType: 'standard' } }, channel: 'email', recipient: { name: 'Erik Lindqvist', email: 'erik@parcelway.example' }, expiryDays: 30 } });
  { const db = new DatabaseSync(path.join(h.dataDir, 'hati.db')); db.exec('PRAGMA busy_timeout = 5000');
    db.prepare('UPDATE shares SET expires_at=? WHERE token=?').run(new Date(Date.now() - 3 * 864e5).toISOString(), s.token); db.close(); }
  const fresh = async () => (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
  const status = () => fetch(h.base + '/api/status').then(r => r.json());
  const openExpired = async p => { await p.goto(h.base + '/#share=t:' + s.token, { waitUntil: 'networkidle' }); await p.reload({ waitUntil: 'networkidle' }); };

  /* 1 · off */
  try {
    const p = await fresh(); await p.goto(h.base + '/', { waitUntil: 'networkidle' });
    await until(p, () => !!document.getElementById('li-email'), null, 15000);
    const a = await p.evaluate(() => !document.querySelector('.lin-wrap'));
    await openExpired(p); await until(p, () => /expired/i.test(document.body.innerText), null, 15000);
    const b = await p.evaluate(() => !document.querySelector('.pnl-gone'));
    check('1 off: today\'s sign-in and expired page; the server says off', a && b && (await status()).outsideLook === false, { a, b });
    await p.context().close();
  } catch (e) { check('1 off', false, String(e).slice(0, 200)); }

  /* 2 · an admin turns it on from Settings & rules */
  const adm = await fresh();
  try {
    await adm.goto(h.base + '/', { waitUntil: 'networkidle' });
    await adm.fill('#li-email', 'admin@example.co.ke'); await adm.fill('#li-pass', 'adminpassword1'); await adm.click('#li-go');
    await until(adm, () => typeof currentUser === 'function' && !!currentUser() && typeof stPrefSet === 'function', null, 40000);
    await adm.evaluate(async () => { await stPrefSet('newLook', true); newLookApply(); setView('team'); });
    const up = await until(adm, () => !!document.querySelector('#stn-outsidelook [data-st-sw="outsidelook"]'), null, 15000);
    if (up){ await adm.evaluate(() => document.querySelector('#stn-outsidelook').scrollIntoView({ block: 'center' })); await adm.waitForTimeout(300); await adm.click('#stn-outsidelook [data-st-sw="outsidelook"]', { timeout: 8000 }).catch(async () => adm.evaluate(() => document.querySelector('#stn-outsidelook [data-st-sw="outsidelook"]').click())); }
    const on = await until(adm, () => !!(state.settings && state.settings.outsideLook && state.settings.outsideLook.on), null, 8000);
    let st = false; for (let i = 0; i < 20 && !st; i++){ st = (await status()).outsideLook === true; if (!st) await adm.waitForTimeout(250); }
    check('2 an admin turns it on from Settings & rules; the server says on', up && on && st, { up, on, st });
  } catch (e) { check('2 the setting', false, String(e).slice(0, 200)); }

  /* 3 · the sign-in */
  try {
    const p = await fresh(); await p.goto(h.base + '/', { waitUntil: 'networkidle' });
    const up = await until(p, () => !!document.querySelector('.lin-wrap #li-email'), null, 15000);
    const S = up ? await p.evaluate(() => ({ bar: !!document.querySelector('.lin-bar'), lang: !!document.getElementById('li-lang'), say: (document.querySelector('.lin-say') || {}).textContent || '',
      code: !!document.getElementById('li-code-f') && document.getElementById('li-code-f').hidden, forgot: !!document.getElementById('li-forgot'), foot: (document.querySelector('.lin-foot') || {}).textContent || '' })) : null;
    await p.screenshot({ path: path.join(OUT, 'signin.png') });
    check('3a the sign-in as drawn: the bar with the language, what HaTi is, no code box without two-step, Forgot the password, what stays inside', !!S && S.bar && S.lang && /read by Jambo/.test(S.say) && S.code && S.forgot && /stays inside/.test(S.foot), S);
    await p.fill('#li-email', 'admin@example.co.ke'); await p.fill('#li-pass', 'adminpassword1'); await p.click('#li-go');
    check('3b signing in from it still works', await until(p, () => typeof currentUser === 'function' && !!currentUser(), null, 30000));
    await p.context().close();
  } catch (e) { check('3 the sign-in', false, String(e).slice(0, 200)); }

  /* 4 · an expired link */
  try {
    const p = await fresh(); await openExpired(p);
    const up = await until(p, () => !!document.querySelector('.pnl-gone #pnl-ask'), null, 15000);
    const E = up ? await p.evaluate(() => ({ h: (document.querySelector('.pnl-gone h1') || {}).textContent || '', say: (document.querySelector('.pnl-say') || {}).textContent || '', body: document.body.innerText })) : null;
    await p.screenshot({ path: path.join(OUT, 'expired.png') });
    check('4a an expired link as drawn: the day it stopped, nothing from the agreement, Ask for a new link', !!E && /has expired/.test(E.h) && /set this link to stop on/.test(E.say) && !/Supply Agreement/.test(E.body), E && { h: E.h, say: E.say });
    if (up) await p.click('#pnl-ask');
    const asked = await until(p, () => /has been told/.test((document.getElementById('pnl-ask-said') || {}).textContent || '') && !document.getElementById('pnl-ask'), null, 8000);
    await p.context().close();
    await adm.evaluate(async () => { if (typeof loadBootstrap === 'function') await loadBootstrap(); });
    const bell = await adm.evaluate(() => (buildAlerts() || []).some(a => a.kind === 'linkask' && /Erik Lindqvist asked for a new link/.test(a.text)));
    check('4b the press is recorded and the sender\'s bell says it', asked && bell, { asked, bell });
  } catch (e) { check('4 an expired link', false, String(e).slice(0, 200)); }

  await browser.close(); await h.stop();
  console.log(fails ? `\n${fails} FAILED` : '\nall passed');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
