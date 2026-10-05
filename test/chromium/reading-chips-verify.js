/* Chromium verification: THE READING, AS CHIPS (work order "the board that
   answers right", Part 4, 5 Oct 2026; screen 2 of the sketches)
   ============================================================
     1. "contracts by stage" — the reply carries Picture · Split · Measure
        chips that say Ring · by stage · Count;
     2. pressing Split opens the card's own menu in the panel;
     3. choosing "by counterparty" moves the open card, and the chip follows;
     4. a second question makes the first reply's chips plain (no buttons);
     5. no page errors.
   Run: node test/chromium/reading-chips-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'reading-chips');
const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const BOOK = ['Draft', 'Draft', 'Under Review', 'Signed', 'Signed', 'Signed'].map((st, i) => fixtureContract('MK-' + (600 + i), 'Agreement ' + i, ['Juno AB', 'Baltic Oy', 'Nordkraft AB'][i % 3], i % 2 ? 'proc' : 'sales', 1e6, st));
const results = [];
const check = (name, pass, detail) => { results.push({ name, pass: !!pass }); console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`); };

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h, { contracts: BOOK, approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now(); while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); } return v; };
  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await page.waitForFunction(ids => window.state && state.contracts && state.contracts.length === ids.length && ids.every(id => state.contracts.some(c => c.id === id)), BOOK.map(c => c.id), { timeout: 20000 });
    await page.evaluate(() => { const s = hbS(); s.face = 'board'; s.prep = 'closed'; s.panels = []; s.path = []; s.screen = 'dark'; hbSave(); setView('dashboard'); });
    await until(() => document.getElementById('hb-board') ? true : null);
    await page.waitForTimeout(600);
    await page.evaluate(async () => { intel.history = []; await intelAsk('contracts by stage'); });
    const s1 = await until(() => { const rows = [...document.querySelectorAll('.hb-rd')]; const r = rows[rows.length - 1]; return r ? [...r.querySelectorAll('.hb-rd-chip')].map(b => b.textContent.trim()) : null; });
    const live1 = await page.evaluate(() => { const r = [...document.querySelectorAll('.hb-rd')].pop(); return !!r && !r.classList.contains('is-still') && !!document.querySelector('#hb-focus'); });
    check('1 the reply says how it read the question, live, over the card it drew', JSON.stringify(s1) === JSON.stringify(['PictureRing', 'Splitby stage', 'MeasureCount']) && live1, JSON.stringify(s1) + ' live=' + live1);
    await page.click('.hb-rd [data-hb-rd="split"]');
    const s2 = await until(() => { const m = document.querySelector('.hb-rd-menu'); return m ? [...m.querySelectorAll('button')].map(b => b.textContent.trim()).slice(0, 12) : null; });
    await page.screenshot({ path: path.join(OUT, '2-split-menu.png') });
    check('2 Split opens the card\'s own menu in the panel', !!s2 && s2.some(t => /by counterparty/.test(t)) && s2.some(t => /by stage/.test(t)), JSON.stringify(s2));
    await page.click('.hb-rd-menu [data-hb-rdset="split:g:counterparty"]');
    const s3 = await until(() => { const s = hbS(), k = (s.path || []).slice(-1)[0]; const P = hbPlan(hbDigData(k, s.lens)); const r = [...document.querySelectorAll('.hb-rd')].pop();
      return P.split && P.split.by === 'counterparty' && r && /by counterparty/.test(r.textContent) ? { by: P.split.by, chip: r.textContent.replace(/\s+/g, ' ') } : null; });
    await page.screenshot({ path: path.join(OUT, '3-moved.png') });
    check('3 the choice moves the open card, and the chip follows', !!s3, JSON.stringify(s3));
    await page.evaluate(async () => { await intelAsk('Juno contracts by owner'); });
    const s4 = await until(() => { const rows = [...document.querySelectorAll('.hb-rd')]; if (rows.length < 2) return null; return { first: rows[0].classList.contains('is-still') && !rows[0].querySelector('button'), last: !!rows[rows.length - 1].querySelector('button') }; });
    await page.screenshot({ path: path.join(OUT, '4-old-reply-still.png') });
    check('4 an older reply\'s chips are plain; the newest is live', !!s4 && s4.first && s4.last, JSON.stringify(s4));
    /* THREE NEXT QUESTIONS (Part 5): under the live reply, each draws, free */
    const s6 = await until(() => { const r = [...document.querySelectorAll('.hb-rd')].pop(); const b = r && [...r.querySelectorAll('[data-hb-next]')]; return b && b.length ? b.map(x => x.textContent.trim()) : null; });
    await page.screenshot({ path: path.join(OUT, '6-next-questions.png') });
    check('6a up to three next questions under the live reply', !!s6 && s6.length >= 1 && s6.length <= 3, JSON.stringify(s6));
    const k6 = await page.evaluate(() => (hbS().path || []).slice(-1)[0]);
    await page.evaluate(() => { const r = [...document.querySelectorAll('.hb-rd')].pop(); r.querySelector('[data-hb-next]').click(); });
    const s6b = await until(k0 => { const s = hbS(), k = (s.path || []).slice(-1)[0]; const a = (intel.history || []).filter(m => m.role === 'assistant').pop();
      return a && /Free/.test(String(a.text)) && k === k0 && (intel.history || []).filter(m => m.role === 'user').length >= 3 ? { k, said: String(a.text).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 160) } : null; }, k6);
    check('6b pressing one asks it as typed: the open card changes, free', !!s6b, JSON.stringify(s6b));
    check('5 no page errors', errors.length === 0, errors.slice(0, 3).join(' | ') || 'none');
  } catch (e) { check('stage ran', false, e.message); }
  finally { await browser.close(); await h.stop(); const bad = results.filter(r => !r.pass); console.log(`\n${results.length - bad.length}/${results.length} passed`); process.exit(bad.length ? 1 : 0); }
})();
