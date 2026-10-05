/* Chromium verification: THE BOARD'S WORD BOOK (work order "the board that
   answers right", Part 3, 5 Oct 2026)
   ============================================================
     1. Settings › Platform settings › Board words opens as a drawer with the
        built-in words folded and none of the company's own;
     2. a word the board already reads ("stage") is refused in the drawer,
        with the reason, and nothing is sent;
     3. "deals" = these contracts: "contracts" is added, listed, and the row
        on the page says one word;
     4. on Home, "deals by stage" draws contracts by stage, FREE (nothing sent
        to Copilot);
     5. no page errors.
   Screenshots go to HATI_SHOT_DIR or test/chromium/shots/board-words/.
   Run: node test/chromium/board-words-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'board-words');
const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const BOOK = ['Draft', 'Draft', 'Under Review', 'Signed', 'Signed', 'Signed'].map((st, i) => fixtureContract('MK-' + (500 + i), 'Agreement ' + i, ['Juno AB', 'Baltic Oy'][i % 2], i % 2 ? 'proc' : 'sales', 1e6, st));

const results = [];
const check = (name, pass, detail) => { results.push({ name, pass: !!pass }); console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`); };

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h, { contracts: BOOK, approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  const sent = []; await page.route('**/api/ai/graph', async r => { sent.push(1); await r.fulfill({ status: 200, contentType: 'application/json', body: '{}' }); });
  const puts = []; page.on('request', r => { if (/settings\/board-words/.test(r.url())) puts.push(r.postData()); });
  const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now(); while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); } return v; };
  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await page.waitForFunction(() => window.state && state.contracts && state.contracts.length >= 6 && typeof isAdmin === 'function' && isAdmin(), null, { timeout: 20000 });

    /* 1 */
    await page.evaluate(() => openSettingsAt('platform', 'boardwords'));
    const s1 = await until(() => { const l = document.getElementById('st-words-list'); return l ? { text: l.textContent.replace(/\s+/g, ' '), built: !!l.querySelector('details') } : null; });
    await page.screenshot({ path: path.join(OUT, '1-drawer.png') });
    check('1 the Board words drawer opens: none of our own yet, the built-in words folded', !!s1 && /No words of your own yet/.test(s1.text) && s1.built, s1 && s1.text.slice(0, 120));

    /* 2 */
    await page.fill('#st-w-say', 'stage');
    await page.selectOption('#st-w-kind', 'set'); await page.fill('#st-w-value', 'contracts');
    await page.click('#st-w-add');
    const s2 = await until(() => { const r = document.getElementById('st-drawer-refusal'); return r && !r.hidden ? r.textContent.trim() : null; });
    check('2 a word the board already reads is refused, with the reason, and nothing is sent', /already reads “stage”/.test(s2 || '') && puts.length === 0, s2);

    /* 3 */
    await page.fill('#st-w-say', 'deals');
    await page.fill('#st-w-value', 'contracts');
    await page.click('#st-w-add');
    const s3 = await until(() => { const l = document.getElementById('st-words-list'); const t = l && l.textContent.replace(/\s+/g, ' '); return t && /deals/.test(t) ? { t, words: (state.settings.boardWords || []).length } : null; });
    await page.screenshot({ path: path.join(OUT, '3-added.png') });
    check('3 "deals" is added and listed as "These contracts: contracts"', !!s3 && /deals\s*These contracts: contracts/.test(s3.t) && s3.words === 1, s3 && s3.t.slice(0, 140));

    /* 4 */
    await page.evaluate(() => { const s = hbS(); s.face = 'board'; s.prep = 'closed'; s.panels = []; s.path = []; hbSave(); setView('dashboard'); });
    await until(() => document.getElementById('hb-board') ? true : null);
    await page.evaluate(async () => { intel.history = []; await intelAsk('deals by stage'); });
    const s4 = await until(() => { const s = hbS(), k = (s.path || []).slice(-1)[0]; if (!k) return null; const P = hbPlan(hbDigData(k, s.lens));
      const a = (intel.history || []).filter(m => m.role === 'assistant').pop(); return { k, by: P.split && P.split.by, said: a ? String(a.text).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ') : '' }; });
    await page.screenshot({ path: path.join(OUT, '4-deals-by-stage.png') });
    check('4 "deals by stage" draws contracts by stage, free', !!s4 && s4.by === 'status' && /Free/.test(s4.said) && sent.length === 0, JSON.stringify(s4));
    check('5 no page errors', errors.length === 0, errors.slice(0, 3).join(' | ') || 'none');
  } catch (e) { check('stage ran', false, e.message); }
  finally {
    await browser.close(); await h.stop();
    const bad = results.filter(r => !r.pass); console.log(`\n${results.length - bad.length}/${results.length} passed`); process.exit(bad.length ? 1 : 0);
  }
})();
