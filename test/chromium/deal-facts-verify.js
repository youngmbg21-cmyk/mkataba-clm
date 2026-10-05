/* Chromium verification: CHART THE DEAL FACTS (work order "the board that
   answers right", Part 8, 5 Oct 2026; screen 8 of the sketches)
   ============================================================
   In a real server, so the board counts off the LIGHT list:
     1. the list hands the brief's concerns over as `_briefLite`, and the row
        is light (no audit);
     2. "contracts by open risks" draws, read free, and the contract with a
        brief counts as "1-2 open risks" — never "Not read yet";
     3. the Split chip's menu shows the five under a "Deal facts" heading;
     4. "which stalled deals are waiting on us, by counterparty" reads free;
     5. no page errors.
   Run: node test/chromium/deal-facts-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'deal-facts');
const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const BOOK = ['Draft', 'Under Review', 'Under Review', 'Signed', 'Signed'].map((st, i) => fixtureContract('MK-' + (680 + i), 'Agreement ' + i, ['Juno AB', 'Baltic Oy', 'Nordkraft AB'][i % 3], i % 2 ? 'proc' : 'sales', 1e6, st));
const results = [];
const check = (name, pass, detail) => { results.push({ name, pass: !!pass }); console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`); };

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h, { contracts: BOOK, approvalRules: [] });
  const { DatabaseSync } = require('node:sqlite');
  const db = new DatabaseSync(path.join(h.dataDir, 'hati.db')); db.exec('PRAGMA busy_timeout = 5000');
  db.prepare('INSERT OR REPLACE INTO briefs (contract_id, json, created_at) VALUES (?,?,?)').run('MK-683', JSON.stringify({ data: {
    summary: 'Memo.', watchouts: [{ point: 'No liability cap', quote: '', why: 'Unlimited exposure.', wording: true }], unusual: [] } }), new Date().toISOString());
  db.close();
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now(); while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); } return v; };
  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await page.waitForFunction(ids => window.state && state.contracts && state.contracts.length === ids.length && ids.every(id => state.contracts.some(c => c.id === id)), BOOK.map(c => c.id), { timeout: 20000 });
    const s1 = await page.evaluate(() => { const c = getContract('MK-683'); return { light: !!c._light, audit: c.audit === undefined, lite: !!(c._briefLite && c._briefLite.data && c._briefLite.data.watchouts.length === 1), full: !!c._brief }; });
    check('1 the light list carries the brief\'s concerns, not the brief', s1.light && s1.lite && !s1.full, JSON.stringify(s1));
    await page.evaluate(() => { const s = hbS(); s.face = 'board'; s.prep = 'closed'; s.panels = []; s.path = []; s.screen = 'dark'; hbSave(); setView('dashboard'); });
    await until(() => document.getElementById('hb-board') ? true : null);
    await page.waitForTimeout(600);
    await page.evaluate(async () => { intel.history = []; await intelAsk('contracts by open risks'); });
    const s2 = await until(() => { const s = hbS(), k = (s.path || []).slice(-1)[0]; if (!k) return null; const P = hbPlan(hbDigData(k, s.lens)); const a = (intel.history || []).filter(m => m.role === 'assistant').pop();
      return P.split && P.split.by === 'risks' && a ? { free: /Free/.test(String(a.text)), g: hbGroupLabel('risks', hbGroupOf(getContract('MK-683'), 'risks')), other: hbGroupLabel('risks', hbGroupOf(getContract('MK-680'), 'risks')) } : null; });
    await page.screenshot({ path: path.join(OUT, '2-open-risks.png') });
    check('2 "contracts by open risks" reads free and counts the light list\'s brief', !!s2 && s2.free && s2.g === '1-2 open risks' && s2.other === 'Not read yet', JSON.stringify(s2));
    await page.click('.hb-rd [data-hb-rd="split"]');
    const s3 = await until(() => { const m = document.querySelector('.hb-rd-menu'); if (!m) return null; const h = m.querySelector('.hb-rd-menu-h');
      return { head: h ? h.textContent.trim() : null, after: h ? [...m.querySelectorAll('button')].filter(b => h.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING).slice(0, 5).map(b => b.textContent.trim()) : [] }; });
    await page.screenshot({ path: path.join(OUT, '3-deal-facts-menu.png') });
    check('3 the Split menu shows the five under "Deal facts"', !!s3 && s3.head === 'Deal facts' && s3.after.length === 5, JSON.stringify(s3));
    await page.keyboard.press('Escape');
    await page.evaluate(async () => { await intelAsk('which stalled deals are waiting on us, by counterparty'); });
    const s4 = await until(() => { const s = hbS(), k = (s.path || []).slice(-1)[0]; const D = k && hbDigData(k, s.lens); const a = (intel.history || []).filter(m => m.role === 'assistant').pop();
      return D && /waiting on us/.test(D.setLabel || '') && a && /Free/.test(String(a.text)) ? { set: D.setLabel, by: hbPlan(D).split.by } : null; });
    await page.screenshot({ path: path.join(OUT, '4-stalled.png') });
    check('4 "which stalled deals are waiting on us, by counterparty" reads free', !!s4 && s4.by === 'counterparty', JSON.stringify(s4));
    check('5 no page errors', errors.length === 0, errors.slice(0, 3).join(' | ') || 'none');
  } catch (e) { check('stage ran', false, e.message); }
  finally { await browser.close(); await h.stop(); const bad = results.filter(r => !r.pass); console.log(`\n${results.length - bad.length}/${results.length} passed`); process.exit(bad.length ? 1 : 0); }
})();
