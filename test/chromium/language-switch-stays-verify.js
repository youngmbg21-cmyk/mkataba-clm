/* Chromium verification: THE LANGUAGE SWITCH STAYS BESIDE THE THEME SWITCH
   ============================================================
   Work order "Home speed", Part 8 (owner, 8 Oct 2026: "You also moved the
   language toggle. Move it back to where it was"). Below 900px the switch
   moves into the side menu; coming back it was put after the logo, top left,
   for the rest of the sitting.
     1. on load at 1440 it stands where the bar's markup puts it
     2. at 800 it is in the side menu
     3. back at 1440 it has the same neighbours as on load, not the logo
     4. pressing Svenska still switches the language
     5. no page errors
   Waits ask for the state, bounded. Red at main f31da55 (3).
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
const tag = el => el ? (el.id ? '#' + el.id : (el.className && String(el.className).split(' ')[0] ? '.' + String(el.className).split(' ')[0] : el.tagName.toLowerCase())) : 'none';

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
    await page.waitForFunction(() => window.state && state.contracts && state.contracts.length > 2 && !!document.querySelector('#lang-switch button'), null, { timeout: 20000 });
    const where = () => page.evaluate(src => { const tag = eval(src); const s = document.getElementById('lang-switch');
      return { prev: tag(s.previousElementSibling), next: tag(s.nextElementSibling), inNav: !!s.closest('#side-nav'), x: Math.round(s.getBoundingClientRect().left) }; }, tag.toString());
    const w0 = await where();
    check('1. on load it stands in the bar, not after the logo', !w0.inNav && w0.prev !== '#brand-block', JSON.stringify(w0));
    await page.setViewportSize({ width: 800, height: 900 });
    await page.evaluate(() => setView('contracts'));
    const w1 = await until(() => document.getElementById('lang-switch').closest('#side-nav') ? true : null);
    check('2. at 800 it is in the side menu', !!w1);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.evaluate(() => setView('dashboard'));
    await until(() => !document.getElementById('lang-switch').closest('#side-nav'));
    const w2 = await where();
    check('3. back at 1440 it has the same neighbours as on load', !w2.inNav && w2.prev === w0.prev && w2.next === w0.next, JSON.stringify({ load: w0, back: w2 }));
    await page.click('#lang-switch button:nth-child(2)');
    const sv = await until(() => (typeof langId === 'function' && langId() === 'sv') ? langId() : null);
    check('4. pressing Svenska still switches the language', sv === 'sv', String(sv));
    check('5. no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } finally {
    await browser.close(); await h.stop();
  }
  console.log(failures ? `\n${failures} FAILED` : '\nALL PASS');
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
