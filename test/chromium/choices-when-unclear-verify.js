/* Chromium verification: CHOICES WHEN A QUESTION IS UNCLEAR (the owner's work
   order, Part 6, 4 Oct 2026)
   ============================================================
   On Home's board, free (no Copilot):
     1. "contracts by month" draws by end date, says so, and offers "By signing
        date" and "By created date" as the map's own choice buttons;
     2. pressing "By signing date" changes that card — and Undo takes it back;
     3. a clear question offers no buttons;
     4. no page errors, nothing spent.
   Run: node test/chromium/choices-when-unclear-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'choices-when-unclear');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const BOOK = [];
for (let k = 0; k < 18; k++){ const c = fixtureContract('MK-' + (800 + k), 'Agreement ' + k, ['Juno AB', 'Naivas', 'Bidco'][k % 3], k % 2 ? 'proc' : 'sales', 1e6, k % 3 ? 'Signed' : 'Draft'); BOOK.push(c); }

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass, detail: detail == null ? '' : String(detail) });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h, { contracts: BOOK, approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  let spent = 0;
  await page.route('**/api/ai/**', route => { if (!/\/api\/ai\/(usage|config|spend)/.test(route.request().url())) spent++; return route.fallback(); });
  const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
    while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
    return v; };
  const ask = async q => { await page.evaluate(() => { intel.history = []; }); await page.evaluate(async q => { await intelAsk(q); }, q);
    return until(() => { const a = (intel.history || []).filter(m => m.role === 'assistant'); return a.length ? String(a[a.length - 1].text).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ') : null; }); };
  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForFunction(ids => window.state && state.contracts && ids.every(id => state.contracts.some(c => c.id === id)), BOOK.map(c => c.id), { timeout: 20000 });
    await page.evaluate(() => { const s = hbS(); s.face = 'board'; s.prep = 'closed'; s.panels = []; s.path = []; s.recipe = {}; s.undo = []; hbSave(); setView('dashboard'); });
    await until(() => document.getElementById('hb-board') ? true : null);
    if (!(await page.evaluate(() => typeof hbAmbiguity === 'function'))) throw new Error('the board offers no choices');

    /* ================= 1. BY MONTH, NO DATE NAMED ================= */
    const said = await ask('contracts by month');
    const btns = await until(() => { const b = [...document.querySelectorAll('.igd-choices [data-ig-choice]')].map(x => x.textContent.trim()); return b.length ? b : null; });
    check('1a the reading drawn is said', /Drawn by end date; you may have meant another date:/.test(said || ''), said);
    check('1b the other readings are the map\'s own choice buttons', JSON.stringify(btns) === JSON.stringify(['By signing date', 'By created date']), JSON.stringify(btns));
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(OUT, '1-choices.png') });

    /* ================= 2. PRESS ONE, THEN UNDO ================= */
    await page.click('.igd-choices [data-ig-choice]');
    const d2 = await until(() => { const D = hbDigData('q:contracts by month', hbS().lens); const P = D && hbPlan(D); return P && P.split && P.split.date === 'signed' ? true : null; });
    check('2a the press changed that card to the signing date', !!d2);
    await until(() => document.querySelector('.hb-undo') ? true : null);
    await page.click('.hb-undo');
    check('2b Undo takes it back to the end date', !!(await until(() => { const P = hbPlan(hbDigData('q:contracts by month', hbS().lens)); return P.split.date === 'end' ? true : null; })));

    /* ================= 3. A CLEAR QUESTION ================= */
    await ask('contracts signed by month');
    check('3a a clear question offers no buttons', await page.evaluate(() => !document.querySelector('.igd-choices')));
    check('nothing was spent', spent === 0, String(spent));
    check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | ') || 'none');
  } catch (e) {
    check('stage ran', false, e.message + (errors.length ? ' | page errors: ' + errors.slice(0, 3).join(' | ') : ''));
  } finally {
    await browser.close(); await h.stop();
    const bad = results.filter(r => !r.pass);
    console.log(`\n${results.length - bad.length}/${results.length} passed`);
    process.exit(bad.length ? 1 : 0);
  }
})();
