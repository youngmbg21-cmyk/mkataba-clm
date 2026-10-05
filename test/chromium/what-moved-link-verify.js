/* Chromium verification: "WHAT MOVED" IN THE BRIEF — the link lands (work
   order "the board that answers right", Part 11, 5 Oct 2026)
   ============================================================
     1. the brief's link (#home&go=moved&card=pay), followed by somebody who
        must sign in first, opens Home's board with that finding's chart open;
     2. the hash is cleared once honoured (a refresh lands where they left);
     3. a word the list does not know is not acted on;
     4. painting Home hands the shelf's top findings to the server (≤ 3);
     5. no page errors.
   Run: node test/chromium/what-moved-link-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'what-moved-link');
const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const BOOK = ['Signed', 'Signed', 'Under Review'].map((st, i) => fixtureContract('MK-' + (640 + i), 'Agreement ' + i, ['Juno AB', 'Baltic Oy'][i % 2], i % 2 ? 'proc' : 'sales', 1e6, st));
const results = [];
const check = (name, pass, detail) => { results.push({ name, pass: !!pass }); console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`); };

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h, { contracts: BOOK, approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  const moved = []; page.on('request', r => { if (/\/api\/home\/moved$/.test(r.url()) && r.method() === 'PUT') moved.push(r.postDataJSON()); });
  const until = async (fn, arg, ms = 10000) => { let v; const t0 = Date.now(); while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); } return v; };
  try {
    await page.goto(h.base + '/#home&go=moved&card=pay', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    const s1 = await until(() => { if (!window.state || state.view !== 'dashboard' || typeof hbS !== 'function') return null; const s = hbS(); const k = (s.path || []).slice(-1)[0];
      const f = document.getElementById('hb-focus'); const r = f && f.getBoundingClientRect();
      return f && k === hbInsKey('pay', false) && r.top >= 0 && r.top < innerHeight - 100 ? { face: s.face, key: k, top: Math.round(r.top) } : null; });
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(OUT, '1-landed.png') });
    check('1 the link opens the board with that finding\'s chart open, in view', !!s1 && s1.face === 'board', JSON.stringify(s1));
    check('2 the hash is cleared once honoured', await page.evaluate(() => location.hash === ''), await page.evaluate(() => location.hash));
    const s4 = await until(() => true, null, 1500) && moved.length ? moved[moved.length - 1] : null;
    check('4 painting Home hands over the shelf\'s top findings, at most three', !!s4 && Array.isArray(s4.items) && s4.items.length <= 3 && s4.items.every(i => /^[a-z]+(\.mine)?$/.test(i.key) && /^\d{4}-\d{2}-\d{2}$/.test(i.at)), JSON.stringify(s4));
    await page.evaluate(() => { const s = hbS(); s.path = []; hbSave(); setView('contracts'); });
    await page.evaluate(() => { location.hash = '#home&go=nonsense&card=pay'; openFromHash(); });
    await page.waitForTimeout(500);
    check('3 a word the list does not know is not acted on', await page.evaluate(() => state.view === 'contracts' && !(hbS().path || []).length), await page.evaluate(() => state.view));
    check('5 no page errors', errors.length === 0, errors.slice(0, 3).join(' | ') || 'none');
  } catch (e) { check('stage ran', false, e.message); }
  finally { await browser.close(); await h.stop(); const bad = results.filter(r => !r.pass); console.log(`\n${results.length - bad.length}/${results.length} passed`); process.exit(bad.length ? 1 : 0); }
})();
