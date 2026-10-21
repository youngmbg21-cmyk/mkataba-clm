/* Chromium verification: THE LANGUAGE IS CHANGED IN SETTINGS › YOU, NOT IN THE BAR
   ============================================================
   Work order "Home speed", Part 8 (owner, 8 Oct 2026: "You also moved the
   language toggle. Move it back to where it was") pinned the bar's switch in
   one place at every width. RE-POINTED 20 Oct 2026: the owner picked
   "Chambers", whose bar carries no language switch (#lang-switch, .lang-btn
   and .lang-toggle are gone); the language is changed in Settings › You
   ([data-st-lang] → langSet, the one writer). So what this file now pins:
     1. on load at 1440 the bar carries no language switch
     2. at 800 it still carries none — nothing moved into the bar or a menu
     3. back at 1440 still none
     4. Settings › You's Svenska switches the language, and English brings it back
     5. no page errors
   Waits ask for the state, bounded.
   Run: node test/chromium/language-switch-stays-verify.js */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let failures = 0;
const check = (name, pass, detail) => {
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
  if (!pass) failures++;
};

(async () => {
  const h = await startHati();
  await seedWorkspace(h, { approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
    page.on('pageerror', e => errors.push(e.message));
    const until = async (fn, arg, ms = 6000) => { let v; const t0 = Date.now();
      while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
      return v; };
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForFunction(() => window.state && state.contracts && state.contracts.length > 2, null, { timeout: 20000 });
    /* signing in lands on the Counter since 17 Oct 2026: measure once it has landed, not while the sign-in screen still covers the bar */
    await page.waitForFunction(() => !document.body.classList.contains('pre-auth') && state.view === 'counter', null, { timeout: 20000 }).catch(() => {});
    /* any language control left in the bar, or anywhere outside Settings › You */
    const switches = () => page.evaluate(() => {
      const bar = document.getElementById('top-header');
      const els = [...document.querySelectorAll('#lang-switch, .lang-btn, .lang-toggle, [data-lang]')];
      return { bar: !!bar && bar.getBoundingClientRect().height > 0, n: els.length, inBar: !!bar && els.some(e => bar.contains(e)),
        what: els.slice(0, 3).map(e => e.id ? '#' + e.id : (e.className ? '.' + String(e.className).split(' ')[0] : e.tagName.toLowerCase())) };
    });
    const w0 = await switches();
    check('1. on load at 1440 the bar carries no language switch', w0.bar && w0.n === 0 && !w0.inBar, JSON.stringify(w0));
    await page.setViewportSize({ width: 800, height: 900 });
    await page.evaluate(() => setView('contracts'));
    await until(w => { const b = document.getElementById('top-header'); return innerWidth === w && !!b && b.getBoundingClientRect().height > 0; }, 800);
    const w1 = await switches();
    check('2. at 800 it still carries none — nothing moved into the bar', w1.bar && w1.n === 0 && !w1.inBar, JSON.stringify(w1));
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.evaluate(() => setView('dashboard'));
    await until(w => { const b = document.getElementById('top-header'); return innerWidth === w && !!b && b.getBoundingClientRect().height > 0 && state.view === 'dashboard'; }, 1440);
    const w2 = await switches();
    check('3. back at 1440 still none', w2.bar && w2.n === 0 && !w2.inBar, JSON.stringify(w2));
    /* the one way in: Settings › You's language row */
    await page.evaluate(() => { if (typeof window.openSettingsAt === 'function') window.openSettingsAt('you'); else window.setView('team'); });
    const row = await until(() => { const b = document.querySelector('[data-st-lang="sv"]'); if (!b) return null; b.scrollIntoView({ block: 'center' }); return true; }, null, 8000);
    let sv = null, back = null;
    if (row) {
      await page.click('[data-st-lang="sv"]');
      sv = await until(() => (typeof langId === 'function' && langId() === 'sv') ? langId() : null);
      await until(() => !!document.querySelector('[data-st-lang="en"]'), null, 6000);
      await page.evaluate(() => { const b = document.querySelector('[data-st-lang="en"]'); if (b) b.scrollIntoView({ block: 'center' }); });
      if (await page.$('[data-st-lang="en"]')) await page.click('[data-st-lang="en"]');
      back = await until(() => (typeof langId === 'function' && langId() === 'en') ? langId() : null);
    }
    check('4. Settings › You\'s Svenska switches the language, and English brings it back', !!row && sv === 'sv' && back === 'en', JSON.stringify({ row: !!row, sv, back }));
    check('5. no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } finally {
    await browser.close(); await h.stop();
  }
  console.log(failures ? `\n${failures} FAILED` : '\nALL PASS');
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
