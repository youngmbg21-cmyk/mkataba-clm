/* Chromium verification: TODAY'S INSIGHTS — THE SHELF (Young picked "Shelf"
   by name; "Build it", 4 Oct 2026)
   ============================================================
   Inside Prepared by Copilot on Home: a row and three small pictures of what
   moved in the book, each with Keep · Open · Ask why · let go.
     1. the shelf is drawn from a book that moved, three pictures at most, and
        each picture is one press (no doors inside the thumbnail);
     2. the payment-days drift is offered in HaTi's own words, read off the
        board's own chart (the same trend Open draws);
     3. Open is the board's own dig-in, with its dropdowns;
     4. Keep puts a kept view on the board that counts again, the button says
        Kept, and the brief is told (PUT /api/home/kept);
     5. let go takes it off and it rests: tomorrow's three do not bring it back;
     6. Ask why puts the question in the panel on the page, never the window
        outside it;
     7. on a phone nothing scrolls sideways.
   Dates are built from today (a test whose answer depends on the day it runs
   is worse than none). Waits ask for the state, bounded.
   Screenshots go to test/chromium/shots/insights-shelf/.
   Run: node test/chromium/insights-shelf-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract, FIXTURES } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'insights-shelf');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const dayIn = (months, day) => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() + months); d.setDate(day);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
/* six closed months, four contracts signed in each, payment days 30 → 55 */
const DRIFT = [];
for (let m = 6; m >= 1; m--) for (let j = 0; j < 4; j++){
  const c = fixtureContract(`MK-P${m}-${j}`, `Supply ${m}-${j}`, ['Naivas Supermarkets', 'Kabras Sugar', 'Bidco Africa', 'Twiga Foods'][j], 'proc', 1e6, 'Signed');
  c.signedAt = dayIn(-m, 10 + j); c.metadata = { ...c.metadata, paymentTerms: (30 + (6 - m) * 5) + ' days' };
  DRIFT.push(c);
}
const BOOK = FIXTURES.concat(DRIFT);

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
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const kept = [];
  page.on('request', r => { if (/\/api\/home\/kept$/.test(r.url()) && r.method() === 'PUT') kept.push(r.postData() || ''); });
  const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
    while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
    return v; };
  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForFunction(n => window.state && state.contracts && state.contracts.length >= n, BOOK.length, { timeout: 20000 });
    await page.evaluate(() => { window._outsideChat = 0; window.openAI = () => { window._outsideChat++; };
      const s = hbS(); s.face = 'board'; s.prep = 'open'; s.ins = null; s.insOff = {}; s.insKept = {}; s.panels = []; s.path = []; hbSave(); setView('dashboard'); });
    /* the shelf drawn from THIS paint: as many pictures as today's list holds */
    const has = await until(() => typeof hbInsightsToday === 'function' && state.contracts.some(c => /^MK-P/.test(c.id)) && !!document.querySelector('#hm-agents .hb-shelf')
      && hbS().ins && hbS().ins.n === hbInsBookSig() && document.querySelectorAll('#hm-agents .hb-shelf .hb-ins').length === hbS().ins.list.length);
    if (!has){ check('1a the shelf is drawn inside Prepared by Copilot', false, 'no .hb-shelf'); throw new Error('no shelf'); }

    /* ================= 1. THE SHELF ================= */
    const s1 = await page.evaluate(() => {
      const cards = [...document.querySelectorAll('#hm-agents .hb-shelf .hb-ins')];
      return { n: cards.length, shapes: cards.map(c => c.getAttribute('data-hb-ins-card')),
        acts: cards.every(c => c.querySelector('[data-hb-ins="keep"]') && c.querySelector('[data-hb-ins="open"]') && c.querySelector('[data-hb-ins="why"]') && c.querySelector('[data-hb-ins="go"]')),
        doorsInside: document.querySelectorAll('#hm-agents .hb-ins-pic [data-hb-dig], #hm-agents .hb-ins-pic [tabindex]').length,
        row: (document.querySelector('#hm-agents .hb-ins-row .hb-ag-t') || {}).textContent || '' };
    });
    check('1a the shelf is drawn inside Prepared by Copilot, three pictures at most', s1.n >= 2 && s1.n <= 3 && s1.shapes.includes('pay'), JSON.stringify(s1.shapes));
    check('1b every picture carries Keep · Open · Ask why · let go', s1.acts);
    check('1c a picture is one press — no doors inside the thumbnail', s1.doorsInside === 0, `${s1.doorsInside} doors inside`);
    check('1d its row says how many are waiting', /Today.s insights\s*\d/.test(s1.row.replace(/\s+/g, ' ')), s1.row.replace(/\s+/g, ' ').trim());
    await page.waitForTimeout(1500);   /* the columns rise in; photograph them risen */
    await page.screenshot({ path: path.join(OUT, '1-the-shelf.png') });

    /* ================= 2. THE DRIFT, IN HATI'S WORDS ================= */
    const s2 = await page.evaluate(() => { const c = document.querySelector('[data-hb-ins-card="pay"]');
      return c ? { t: c.querySelector('.hb-ins-t').textContent, f: c.querySelector('.hb-ins-f').textContent } : null; });
    check('2a the payment-days drift is offered', !!s2 && /longer/i.test(s2.t), JSON.stringify(s2));
    check('2b with the numbers the open chart draws (30 → 55 days)', !!s2 && /30 days\s*→\s*55 days/.test(s2.f), s2 && s2.f);

    /* ================= 3. OPEN IS THE BOARD'S OWN DIG-IN ================= */
    await page.evaluate(() => document.querySelector('[data-hb-ins-card="pay"] [data-hb-ins="open"]').click());
    const s3 = await until(() => { const d = document.querySelector('#hb-focus .hb-dig'); if (!d) return null;
      return { recipe: !!d.querySelector('.hb-recipe, [data-hb-rc]'), cols: !!d.querySelector('svg.hb-cols'), trend: !!d.querySelector('.hb-sv-trend'),
        key: (hbS().path || []).slice(-1)[0] }; });
    check('3a Open lands on the board\'s own dig-in, with its dropdowns', !!s3 && s3.recipe && s3.cols, JSON.stringify(s3));
    check('3b drawing the same trend the picture promised', !!s3 && s3.trend && /^q:average payment days/.test(s3.key), s3 && s3.key);
    await page.screenshot({ path: path.join(OUT, '3-open.png') });
    await page.evaluate(() => { const s = hbS(); s.path = []; hbSave(); hbPaintBoard(); });

    /* ================= 4. KEEP ================= */
    await page.evaluate(() => document.querySelector('[data-hb-ins-card="pay"] [data-hb-ins="keep"]').click());
    const s4 = await until(() => { const v = document.querySelector('.hb-grid .hb-view'); const b = document.querySelector('[data-hb-ins-card="pay"] [data-hb-ins="keep"]');
      return v ? { title: v.querySelector('.hb-ct').textContent, chart: !!v.querySelector('svg.hb-cols'), kept: b && b.disabled, label: b && b.textContent.trim() } : null; });
    check('4a Keep puts a kept view on the board that counts again', !!s4 && s4.chart && /Payment days/.test(s4.title), JSON.stringify(s4));
    check('4b and the picture\'s button says Kept', !!s4 && s4.kept && s4.label === 'Kept', s4 && s4.label);
    const told = await until(() => true, null, 300) && await (async () => { const t0 = Date.now(); while (Date.now() - t0 < 4000 && !kept.some(b => /Payment days/.test(b))) await page.waitForTimeout(100); return kept.find(b => /Payment days/.test(b)); })();
    check('4c the daily brief is told what Home counted (PUT /api/home/kept)', !!told && /"at":"\d{4}-\d{2}-\d{2}"/.test(told), (told || 'nothing sent').slice(0, 160));
    await page.screenshot({ path: path.join(OUT, '4-kept.png') });

    /* ================= 5. LET GO, AND IT RESTS ================= */
    const before = await page.evaluate(() => document.querySelectorAll('.hb-shelf .hb-ins').length);
    const goneK = await page.evaluate(() => { const c = [...document.querySelectorAll('.hb-shelf .hb-ins')].find(x => x.getAttribute('data-hb-ins-card') !== 'pay') || document.querySelector('.hb-shelf .hb-ins');
      const k = c.getAttribute('data-hb-ins-card'); c.querySelector('[data-hb-ins="go"]').click(); return k; });
    const s5 = await until(k => !document.querySelector(`[data-hb-ins-card="${k}"]`) ? { n: document.querySelectorAll('.hb-shelf .hb-ins').length, off: hbS().insOff[k] } : null, goneK);
    check('5a let go takes it off the shelf', !!s5 && s5.n === before - 1, JSON.stringify({ before, s5 }));
    const s5b = await page.evaluate(k => { const s = hbS(); s.ins = { day: '2000-01-01', list: [] }; hbSave(); hbPaintBoard(); return { list: hbS().ins.list, resting: hbInsResting(k) }; }, goneK);
    check('5b tomorrow\'s pictures do not bring it back for 30 days', !s5b.list.includes(goneK) && s5b.resting, JSON.stringify(s5b));

    /* ================= 6. ASK WHY ================= */
    await page.evaluate(() => { intel.dockOpen = true; const b = document.getElementById('igd-input'); if (b) b.value = ''; document.querySelector('.hb-shelf [data-hb-ins="why"]').click(); });
    const s6 = await until(() => { const b = document.getElementById('igd-input'); return b && b.value ? { v: b.value, out: window._outsideChat } : null; }, null, 3000);
    check('6a Ask why puts the question in the Copilot panel on the page', !!s6 && /^What explains this:/.test(s6.v) && s6.out === 0, JSON.stringify(s6));

    /* ================= 7. ON A PHONE-WIDE WINDOW ================= */
    await page.setViewportSize({ width: 820, height: 900 });
    await page.waitForTimeout(400);
    const over = await page.evaluate(() => { const b = document.getElementById('hb-board'); return b ? b.scrollWidth - b.clientWidth : -1; });
    check('7a narrow, the shelf stacks and nothing scrolls sideways', over <= 1, `${over}px`);
    await page.screenshot({ path: path.join(OUT, '7-narrow.png') });
    check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | ') || 'none');
  } catch (e) {
    check('stage ran', false, e.message);
  } finally {
    await browser.close(); await h.stop();
    const bad = results.filter(r => !r.pass);
    console.log(`\n${results.length - bad.length}/${results.length} passed`);
    process.exit(bad.length ? 1 : 0);
  }
})();
