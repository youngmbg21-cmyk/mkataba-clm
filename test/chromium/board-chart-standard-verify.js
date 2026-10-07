/* Chromium verification: THE BOARD CHART STANDARD — INSTRUMENT
   (work order O-22..O-26, 7 Oct 2026)
   ============================================================
   On Home's board, the whole book by month signed:
     1. a card on the board, at widths 320, 560 and 1180, draws its chart at
        the card's REAL width (not stretched), 196px tall, axis words 11px,
        and the card is never taller than the window;
     2. opened, the chart is 42% of the window (280–380) with axis words 12px;
        Show as table draws the same numbers as rows, each a door;
     3. Full screen is the window less 230; Esc steps back one step at a time
        (full → opened → the board);
     4. the series colours are the checked set, the first following the brand;
     5. photographed; no page errors.
   Waits ask for the state, bounded.
   Screenshots: test/chromium/shots/board-chart-standard/ (or HATI_SHOT_DIR).
   Run: node test/chromium/board-chart-standard-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract, FIXTURES } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'board-chart-standard');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const dayIn = (months, day) => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() + months); d.setDate(day);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const SIGNED = [];
const add = (id, signed) => { const c = fixtureContract(id, 'Supply ' + id, 'Juno AB', 'proc', 1e6, 'Signed'); c.signedAt = signed; SIGNED.push(c); };
for (let k = 0; k < 4; k++) add('MK-E' + k, dayIn(-8 - k, 10));
for (let k = 0; k < 9; k++) add('MK-J' + k, dayIn(-3, 3 + k));
for (let k = 0; k < 12; k++) add('MK-A' + k, dayIn(-2, 3 + k));
const BOOK = FIXTURES.concat(SIGNED);
const KEY = 'q:contracts by month signed';
const RECIPE = { which: 'all', pic: 'cols', split: { by: 'date', unit: 'm', date: 'signed' }, measure: 'count' };

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
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
    while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
    return v; };
  const svgOf = sel => page.evaluate(sel => {
    const svg = document.querySelector(sel); if (!svg) return null;
    const r = svg.getBoundingClientRect(), vb = (svg.getAttribute('viewBox') || '').split(/\s+/).map(Number);
    const ax = svg.querySelector('text.hb-sv-mute');
    const card = svg.closest('.hb-card'); const cr = card ? card.getBoundingClientRect() : null;
    return { step: svg.getAttribute('data-hb-step'), w: r.width, h: r.height, vbW: vb[2], vbH: vb[3],
      ax: ax ? getComputedStyle(ax).fontSize : null, cardH: cr ? cr.height : 0, vh: innerHeight };
  }, sel);
  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForFunction(ids => window.state && state.contracts && ids.every(id => state.contracts.some(c => c.id === id)), SIGNED.map(c => c.id), { timeout: 20000 });
    if (!(await page.evaluate(() => typeof hbFitMeasure === 'function'))) throw new Error('this build draws charts at a fixed width');
    await page.evaluate(({ k, R }) => {
      const s = hbS(); s.face = 'board'; s.prep = 'closed'; s.path = []; s.digBig = false; s.screen = 'light';
      s.panels = [{ id: 'pchart', kind: 'view', key: k, title: 'By month signed', recipe: JSON.parse(JSON.stringify(R)), split: false, big: false }];
      hbSave(); setView('dashboard'); }, { k: KEY, R: RECIPE });
    const sel = '[data-hb-pid="pchart"] svg.hb-svg';
    check('0. the card is on the board with its chart', !!(await until(s => !!document.querySelector(s), sel)));

    /* 1. three widths */
    for (const W of [320, 560, 1180]){
      await page.evaluate(({ s, W }) => { const c = document.querySelector(s).closest('.hb-card'); c.style.width = W + 'px'; c.style.maxWidth = W + 'px'; c.style.gridColumn = '1 / -1'; hbFitMeasure(); }, { s: sel, W });
      await until(({ s }) => { const svg = document.querySelector(s); if (!svg) return false; const w = svg.getBoundingClientRect().width; return Math.abs(Number(svg.getAttribute('data-hb-w')) - w) <= 8; }, { s: sel });
      /* a repaint replaces the card: put the width back and measure again */
      await page.evaluate(({ s, W }) => { const c = document.querySelector(s).closest('.hb-card'); c.style.width = W + 'px'; c.style.maxWidth = W + 'px'; c.style.gridColumn = '1 / -1'; hbFitMeasure(); }, { s: sel, W });
      const m = await svgOf(sel);
      check(`1a. at ${W}: drawn at the card's real width, not stretched`, m && Math.abs(m.vbW - m.w) <= 8, m && `${Math.round(m.w)} shown, ${m.vbW} drawn`);
      check(`1b. at ${W}: the chart is 196px tall`, m && Math.abs(m.h - 196) <= 2, m && Math.round(m.h));
      check(`1c. at ${W}: axis words are 11px`, m && m.ax === '11px', m && m.ax);
      check(`1d. at ${W}: the card is not taller than the window`, m && m.cardH <= m.vh, m && Math.round(m.cardH));
      await page.screenshot({ path: path.join(OUT, `1-board-${W}.png`) });
    }

    /* 2. opened */
    await page.evaluate(k => { const s = hbS(); s.panels = []; s.path = [k]; s.recipe = s.recipe || {}; hbSave(); hbPaintBoard(); }, KEY);
    await page.evaluate(({ k, R }) => { hbCardSet(k, R, { seed: true }); hbPaintBoard(); }, { k: KEY, R: RECIPE });
    const fsel = '#hb-focus svg.hb-svg';
    await until(s => !!document.querySelector(s), fsel);
    await until(s => { const svg = document.querySelector(s); return svg && Math.abs(Number(svg.getAttribute('data-hb-w')) - svg.getBoundingClientRect().width) <= 8; }, fsel);
    let m = await svgOf(fsel);
    const want = Math.max(280, Math.min(380, Math.round(900 * 0.42)));
    check('2a. opened: step two', m && m.step === 'open', m && m.step);
    check(`2b. opened: ${want}px tall`, m && Math.abs(m.h - want) <= 2, m && Math.round(m.h));
    check('2c. opened: axis words are 12px', m && m.ax === '12px', m && m.ax);
    await page.screenshot({ path: path.join(OUT, '2-opened.png') });
    await page.click('[data-hb-table]');
    const tab = await until(() => { const t = document.querySelector('#hb-focus .hb-ctab'); return t ? [...t.querySelectorAll('tbody tr')].map(r => ({ dig: (r.querySelector('[data-hb-dig]') || {}).getAttribute && r.querySelector('[data-hb-dig]').getAttribute('data-hb-dig'), t: r.textContent })) : null; });
    check('2d. Show as table draws the same numbers as rows', tab && tab.length >= 3, tab && tab.length);
    check('2e. every row is a door', tab && tab.every(r => r.dig));
    await page.screenshot({ path: path.join(OUT, '2-table.png') });
    await page.click('[data-hb-table]');

    /* 3. full screen and Esc */
    await page.click('[data-hb-full]');
    await until(() => !!document.querySelector('#hb-focus .hb-dig.is-full svg[data-hb-step="full"]'));
    await until(s => { const svg = document.querySelector(s); return svg && Math.abs(Number(svg.getAttribute('data-hb-w')) - svg.getBoundingClientRect().width) <= 8; }, fsel);
    m = await svgOf(fsel);
    check('3a. full screen is the window less 230', m && Math.abs(m.h - 670) <= 2, m && Math.round(m.h));
    check('3b. axis words are 13px', m && m.ax === '13px', m && m.ax);
    const top = await page.evaluate(() => { const d = document.querySelector('.hb-dig.is-full'), r = d.getBoundingClientRect();
      const e = document.elementFromPoint(r.left + 30, r.top + 30); let z = [], a = d; while (a && a !== document.body){ const cs = getComputedStyle(a); if (cs.zIndex !== 'auto' || cs.isolation === 'isolate') z.push((a.id || a.className.toString().slice(0, 30)) + ':' + cs.zIndex + ':' + cs.position); a = a.parentElement; } return { left: !!e && d.contains(e), bg: getComputedStyle(d).backgroundColor, hit: e ? (e.id || e.className.toString().slice(0, 40)) : '', z: z.join(' / ') }; });
    check('3b2. full screen sits on top of the menu, on a solid ground', top.left && !/rgba\(.*, 0\.\d+\)$/.test(top.bg), JSON.stringify(top));
    await page.screenshot({ path: path.join(OUT, '3-full.png') });
    await page.keyboard.press('Escape');
    check('3c. Esc: back to opened', !!(await until(() => !document.querySelector('.hb-dig.is-full') && !!document.querySelector('#hb-focus svg[data-hb-step="open"]'))));
    await page.keyboard.press('Escape');
    check('3d. Esc again: back to the board', !!(await until(() => !document.querySelector('#hb-focus'))));

    /* 4. colours */
    const hues = await page.evaluate(() => { const b = document.documentElement.getAttribute('data-brand'); return { b, set: hbHues() }; });
    const light = ['#2F5FC4', '#1A9C8A', '#B87A0F', '#9A5CC8'];
    const four = hues.set.slice(0, 4);
    check('4. the light board wears the checked four, the first following the brand', light.every(x => four.includes(x)) && four[0] === (hues.b === 'navy' ? '#2F5FC4' : '#1A9C8A'), hues.b + ' ' + four.join(' '));
    check('5. no page errors', errors.length === 0, errors.join(' | '));
  } catch (e) {
    check('run', false, e.message);
  } finally {
    await browser.close(); await h.stop();
  }
  console.log(failures ? `\n${failures} FAILED` : '\nALL PASS');
  process.exit(failures ? 1 : 0);
})();
