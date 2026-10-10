/* Chromium verification: THE BOARD BALANCES ITS CARDS
   ============================================================
   Work order "Home speed", Part 5 (Young, 8 Oct 2026: "train the Board tab to
   understand symmetry and the use of space to balance the board"). Measured
   on the real board, card boxes read off the page:
     1. one card: it spans the grid's width
     2. two cards: side by side, their bottom edges equal
     3. three cards: the first two share a row (equal bottoms), the third
        spans the grid's width
     4. a pair where one grows (drawn as a list): the one beside it grows with
        it — the bottoms stay equal — and its inside stays at its top
     5. a pair where one is closed: the one left spans the row at once, and
        its chart is redrawn at the wider width
     6. a narrow window (1100): every card takes the full width
     7. no page errors
   Waits ask for the state, bounded. Red at unmodified main (1, 2, 3, 5).
   Screenshots: test/chromium/shots/board-balance/ (or HATI_SHOT_DIR).
   Run: node test/chromium/board-balance-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'board-balance');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let failures = 0;
const check = (name, pass, detail) => {
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
  if (!pass) failures++;
};
const R = { which: 'all', pic: 'ring', split: { by: 'status' }, measure: 'count' };
const ALL = [['pa', 'q:contracts by status'], ['pb', 'q:contracts by counterparty'], ['pc', 'q:contracts by month signed']];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h, { approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
    page.on('pageerror', e => errors.push(e.message));
    const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
      while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
      return v; };
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForFunction(() => window.state && state.contracts && state.contracts.length > 3 && typeof hbS === 'function', null, { timeout: 20000 });
    await page.evaluate(() => { hbS().face = 'board'; hbS().prep = 'closed'; hbSave(); setView('dashboard'); });
    /* place a set of cards (oldest first: the board draws newest first), and
       ask until they stand — the saved settings may land after a paint */
    const place = async (P, recipe = R) => {
      const want = P.map(p => p[0]);
      return until(({ P, R, want }) => {
        const s = hbS();
        const have = [...document.querySelectorAll('.hb-grid > [data-hb-pid]')].map(x => x.getAttribute('data-hb-pid'));
        if (have.length === want.length && want.every(id => have.includes(id))) return true;
        s.face = 'board'; s.prep = 'closed'; s.path = []; s.digBig = false;
        s.panels = P.map(([id, key]) => ({ id, kind: 'view', key, title: id, recipe: JSON.parse(JSON.stringify(R)), split: false, big: false }));
        hbSave(); hbPaintBoard(); return false; }, { P, R: recipe, want }, 15000);
    };
    /* SLOW-RUNNER WAIT (10 Oct 2026, "get main to green"): on GitHub's runner
       the cards once stood in the markup while the grid was not yet laid out,
       and every box read 0 (".. tops 0/0", "0 of 0"). So a measure first asks,
       bounded, that the grid and each card have a real width, then reads. */
    const boxes = async () => { await until(() => { const g = document.querySelector('.hb-grid');
      if (!g || g.getBoundingClientRect().width < 1) return false;
      const cs = [...g.querySelectorAll(':scope > [data-hb-pid]')];
      return cs.length > 0 && cs.every(c => c.getBoundingClientRect().width > 0); }, null, 10000);
      return page.evaluate(() => {
      const g = document.querySelector('.hb-grid'); if (!g) return null;
      const gr = g.getBoundingClientRect();
      return { gw: Math.round(gr.width), cards: [...g.querySelectorAll(':scope > [data-hb-pid]')].map(c => { const r = c.getBoundingClientRect();
        const svg = c.querySelector('svg.hb-svg'); const first = c.firstElementChild ? c.firstElementChild.getBoundingClientRect() : r;
        return { id: c.getAttribute('data-hb-pid'), l: Math.round(r.left), t: Math.round(r.top), w: Math.round(r.width), b: Math.round(r.bottom),
          headAt: Math.round(first.top - r.top), svgW: svg ? Math.round(svg.getBoundingClientRect().width) : null, drawnW: svg ? Number(svg.getAttribute('data-hb-w')) : null }; }) }; }); };
    const byId = (B, id) => B.cards.find(c => c.id === id);

    /* 1. one card */
    check('0. one card stands', !!(await place([ALL[0]])));
    let B = await boxes();
    let a = B && byId(B, 'pa');
    check('1. one card spans the grid\'s width', !!a && Math.abs(a.w - B.gw) <= 2, a && `${a.w} of ${B.gw}`);
    await page.screenshot({ path: path.join(OUT, '1-one.png') });

    /* 2. two cards */
    check('0. two cards stand', !!(await place(ALL.slice(0, 2))));
    B = await boxes();
    let [x, y] = [byId(B, 'pb'), byId(B, 'pa')];
    check('2a. two cards sit side by side', !!x && !!y && x.t === y.t && x.l !== y.l, x && y && `tops ${x.t}/${y.t}`);
    check('2b. and end at the same height', !!x && !!y && Math.abs(x.b - y.b) <= 1, x && y && `bottoms ${x.b}/${y.b}`);

    /* 3. three cards */
    check('0. three cards stand', !!(await place(ALL)));
    B = await boxes();
    const c3 = B.cards; const last = c3[c3.length - 1], row = c3.slice(0, 2);
    check('3a. the first two share a row, equal bottoms', row.length === 2 && row[0].t === row[1].t && Math.abs(row[0].b - row[1].b) <= 1, row.map(r => r.id + ':' + r.t + '-' + r.b).join(' '));
    check('3b. the third spans the grid\'s width', !!last && Math.abs(last.w - B.gw) <= 2, last && `${last.id} ${last.w} of ${B.gw}`);
    const lone = await until(() => { const svg = document.querySelector('.hb-grid > [data-hb-pid]:last-child svg.hb-svg'); if (!svg) return null;
      const w = svg.getBoundingClientRect().width; return Math.abs(Number(svg.getAttribute('data-hb-w')) - w) <= 8 ? Math.round(w) : null; });
    check('3c. the lone card\'s chart is drawn at its full width', !!lone && lone > B.gw * 0.7, String(lone) + ' of ' + B.gw);
    await page.screenshot({ path: path.join(OUT, '3-three.png') });

    /* 4. one of a pair grows */
    check('0. a pair again', !!(await place(ALL.slice(0, 2))));
    const before = byId(await boxes(), 'pa');
    /* the card's content grows (as a dug-into card's reading does): its
       body gains 220px, measured in the same render */
    await page.evaluate(() => { const b = document.querySelector('[data-hb-pid="pa"] .hb-cb') || document.querySelector('[data-hb-pid="pa"]');
      const d = document.createElement('div'); d.style.height = '220px'; d.setAttribute('data-test-grow', '1'); b.appendChild(d); });
    await page.waitForTimeout(300);
    B = await boxes();
    [x, y] = [byId(B, 'pb'), byId(B, 'pa')];
    check('4a. one card grew', !!before && !!y && y.b - y.t > before.b - before.t + 8, before && y && `${before.b - before.t} → ${y.b - y.t}`);
    check('4b. the other grows with it', !!x && !!y && x.t === y.t && Math.abs(x.b - y.b) <= 1, x && y && `bottoms ${x.b}/${y.b}`);
    check('4c. and the shorter card\'s inside stays at its top', !!x && !!y && x.headAt === y.headAt, x && y && `${x.headAt}/${y.headAt}`);
    await page.screenshot({ path: path.join(OUT, '4-grows.png') });

    /* 5. one of a pair is closed */
    await page.evaluate(() => { const s = hbS(); s.panels = s.panels.filter(p => p.id !== 'pb'); hbSave(); hbPaintBoard(); });
    await until(() => !document.querySelector('[data-hb-pid="pb"]'));
    B = await boxes();
    a = byId(B, 'pa');
    check('5a. the card left spans the row at once', !!a && Math.abs(a.w - B.gw) <= 2, a && `${a.w} of ${B.gw}`);

    /* 6. a narrow window */
    await place(ALL);
    await page.setViewportSize({ width: 1100, height: 900 });
    await page.waitForTimeout(300);
    B = await boxes();
    check('6. at 1100 every card takes the full width', !!B && B.cards.length === 3 && B.cards.every(c => Math.abs(c.w - B.gw) <= 2), B && B.cards.map(c => c.w).join('/') + ' of ' + B.gw);
    await page.screenshot({ path: path.join(OUT, '6-narrow.png') });
    check('7. no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } finally {
    await browser.close(); await h.stop();
  }
  console.log(failures ? `\n${failures} FAILED` : '\nALL PASS');
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
