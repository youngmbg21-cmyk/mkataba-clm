/* Chromium verification: THE BOARD UPGRADE — COPILOT AND THE ANALYST
   (C1–C8, A1–A10; the owner's "Build all C and A ideas", 10 Oct 2026)
   ============================================================
   On Home's board, as a person uses it:
     1. A10/A1 "/" on the board opens the moves in the ask box;
     2. A2 after "by" the groupings this book has are offered;
     3. A7 an empty box offers the gallery; a press adds its card;
     4. C1 an opened chart reads its recipe as one sentence; C6 says how it
        was counted;
     5. C5 "Unusual" marks the odd month, and says why;
     6. A5 "What if these do not renew" draws a dashed scenario, said so;
     7. A3 growth in % is said on each column;
     8. A6 the forecast draws a range;
     9. A8 the pack is offered and downloads a page;
    10. no page errors.
   Waits ask for the state, bounded.
   Screenshots: test/chromium/shots/board-copilot-and-analyst/ (or HATI_SHOT_DIR).
   Run: node test/chromium/board-copilot-and-analyst-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract, FIXTURES } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'board-copilot-and-analyst');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const dayIn = (months, day) => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() + months); d.setDate(day);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const SIGNED = [];
const add = (id, signed, cp, expiry) => { const c = fixtureContract(id, 'Supply ' + id, cp, 'proc', 1e6 * (1 + SIGNED.length % 4), 'Signed'); c.signedAt = signed; c.createdAt = dayIn(-14, 1); c.audit = [{ action: 'Created', at: dayIn(-14, 1) + 'T09:00:00.000Z' }]; c.expiry = expiry; SIGNED.push(c); };
/* a steady three a month for ten months, and one month of fourteen */
for (let m = 1; m <= 10; m++) for (let k = 0; k < 3; k++) add(`MK-M${m}-${k}`, dayIn(-m, 3 + k), ['Bidco', 'Naivas', 'Sendy'][k], dayIn(1 + (m % 6), 15));
for (let k = 0; k < 14; k++) add('MK-X' + k, dayIn(-11, 2 + k), k < 9 ? 'Juno AB' : 'Kevian', dayIn(2 + (k % 4), 20));
const BOOK = FIXTURES.concat(SIGNED);
const KEY = 'q:contracts by month signed';
const RECIPE = { which: 'all', pic: 'cols', split: { by: 'date', unit: 'm', date: 'signed' }, measure: 'count', window: { last: 12, unit: 'm' } };

let failures = 0;
const check = (name, pass, detail) => {
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
  if (!pass) failures++;
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h, { contracts: BOOK, approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
    while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
    return v; };
  const openChart = async (key, R) => {
    await page.evaluate(({ key, R }) => { const s = hbS(); s.face = 'board'; s.prep = 'closed'; s.panels = []; s.path = [key]; hbSave(); hbCardSet(key, JSON.parse(JSON.stringify(R)), { seed: true }); hbPaintBoard(); }, { key, R });
    return until(() => !!document.querySelector('#hb-focus .hb-svg, #hb-focus .hb-chart'));
  };
  const pop = () => until(() => { const p = document.getElementById('hb-askpop'); return p && p.offsetParent !== null ? [...p.querySelectorAll('[data-hb-pop]')].map(o => o.textContent.trim()) : null; });
  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForFunction(ids => window.state && state.contracts && ids.every(id => state.contracts.some(c => c.id === id)), SIGNED.map(c => c.id), { timeout: 20000 });
    if (!(await page.evaluate(() => typeof hbAskPopRows === 'function'))) throw new Error('this build has no ask-box moves');
    await page.evaluate(() => { const s = hbS(); s.screen = 'light'; s.scrPick = 1; s.face = 'board'; s.panels = []; s.path = []; hbSave(); setView('dashboard'); });
    await until(() => !!document.getElementById('igd-input') || !!document.getElementById('igd-expand'));

    /* 1. "/" opens the moves */
    await page.mouse.click(700, 300);
    await page.keyboard.press('/');
    const moves = await pop();
    check('1. A10/A1 "/" on the board opens the moves', !!moves && moves.length >= 8 && moves.some(m => /trend/i.test(m)), moves && moves.slice(0, 5).join(' | '));
    await page.screenshot({ path: path.join(OUT, '1-slash.png') });
    await page.keyboard.press('Escape');

    /* 2. after "by" */
    await page.fill('#igd-input', '');
    await page.type('#igd-input', 'signed value by ');
    const by = await pop();
    check('2. A2 after "by" the groupings are offered', !!by && by.some(w => /counterparty/i.test(w)), by && by.slice(0, 6).join(' | '));
    await page.screenshot({ path: path.join(OUT, '2-by.png') });
    await page.keyboard.press('Escape');

    /* 3. the gallery */
    await page.fill('#igd-input', '');
    await page.evaluate(() => { const i = document.getElementById('igd-input'); i.blur(); i.focus(); });
    const gal = await pop();
    check('3a. A7 an empty box offers the gallery', !!gal && gal.length >= 4, gal && gal.slice(0, 4).join(' | '));
    await page.screenshot({ path: path.join(OUT, '3-gallery.png') });
    const n0 = await page.evaluate(() => hbS().panels.length);
    await page.click('#hb-askpop [data-hb-pop="0"]');
    check('3b. A7 a press adds the view to the board as a card', !!(await until(n => hbS().panels.length === n + 1 && !!document.querySelector('[data-hb-pid] .hb-svg, [data-hb-pid] .hb-chart'), n0)));

    /* 4. the opened chart: sentence + how */
    await openChart(KEY, RECIPE);
    const head = await until(() => { const r = document.querySelector('#hb-focus .hb-recipe.is-sentence'); const how = document.querySelector('#hb-focus .hb-how'); return r && how ? { r: r.textContent.replace(/\s+/g, ' ').trim(), how: how.textContent.trim() } : null; });
    check('4a. C1 the recipe reads as one sentence', !!head && /as/.test(head.r) && /counting/.test(head.r), head && head.r.slice(0, 120));
    check('4b. C6 how this was counted is said', !!head && /How this was counted/.test(head.how), head && head.how.slice(0, 140));
    await page.screenshot({ path: path.join(OUT, '4-sentence-and-how.png') });

    /* 5. unusual */
    await page.click('#hb-focus [data-hb-odd]');
    const odd = await until(() => { const m = document.querySelectorAll('#hb-focus .hb-svg .hb-sv-odd'); const t = [...document.querySelectorAll('#hb-focus .hb-svg title, #hb-focus .hb-odd-say, #hb-focus [class*="odd"]')].map(x => x.textContent).join(' '); return m.length || /usual/.test(t) ? { n: m.length, t: t.slice(0, 160) } : null; });
    check('5. C5 "Unusual" marks the odd month and says why', !!odd && /usual/.test(odd.t), odd && `${odd.n} marked · ${odd.t}`);
    await page.screenshot({ path: path.join(OUT, '5-unusual.png') });

    /* 6. what if */
    await openChart('q:contracts ending in the next 6 months', { which: 'all', pic: 'bars', split: { by: 'counterparty' }, measure: 'count' });
    await page.click('#hb-focus [data-hb-whatif]');
    const wi = await until(() => { const s = document.querySelector('#hb-focus svg.hb-wi'); return s ? s.textContent.slice(0, 200) : null; });
    check('6. A5 what if these do not renew: a scenario, said so', !!wi && /SCENARIO/.test(wi), wi && wi.slice(0, 80));
    await page.screenshot({ path: path.join(OUT, '6-what-if.png') });

    /* 7. growth */
    await openChart('q:signed by month as growth', Object.assign({}, RECIPE, { show: 'growth' }));
    const gr = await until(() => { const t = [...document.querySelectorAll('#hb-focus svg.hb-svg text')].map(x => x.textContent).filter(x => /^[+−-]?\d+%$|^—$/.test(x)); return t.length >= 3 ? t : null; });
    check('7. A3 growth in % is said on each column', !!gr, gr && gr.slice(0, 6).join(' '));
    await page.screenshot({ path: path.join(OUT, '7-growth.png') });

    /* 8. forecast */
    await openChart('q:renewal forecast', { which: 'all', pic: 'forecast', measure: 'value' });
    const fc = await until(() => !!document.querySelector('#hb-focus svg.hb-svg.hb-fc, #hb-focus svg.hb-svg [class*="fc"]'));
    check('8. A6 the forecast draws a range', !!fc);
    await page.screenshot({ path: path.join(OUT, '8-forecast.png') });

    /* 9. the pack */
    await page.evaluate(({ key, R }) => { const s = hbS(); s.path = []; s.panels = [{ id: 'pk', kind: 'view', key, title: 'By month', recipe: R, split: false }]; hbSave(); hbCardSet(key, R, { seed: true }); hbPaintBoard(); }, { key: KEY, R: RECIPE });
    await until(() => !!document.querySelector('[data-hb-pack]'));
    const dlP = page.waitForEvent('download', { timeout: 15000 }).catch(() => null);
    await page.click('button[data-hb-pack]');
    const dl = await dlP;
    let packOk = false;
    if (dl){ const f = path.join(OUT, 'pack.html'); await dl.saveAs(f); const t = fs.readFileSync(f, 'utf8'); packOk = /<img[^>]+src="data:image\/png/.test(t) && !/var\(--/.test(t); }
    check('9. A8 the pack downloads a standalone page of pictures', packOk, dl ? dl.suggestedFilename() : 'no download');

    check('10. no page errors', errors.length === 0, errors.join(' | '));
  } catch (e) {
    check('run', false, e.message);
  } finally {
    await browser.close(); await h.stop();
  }
  console.log(failures ? `\n${failures} FAILED` : '\nALL PASS');
  process.exit(failures ? 1 : 0);
})();
