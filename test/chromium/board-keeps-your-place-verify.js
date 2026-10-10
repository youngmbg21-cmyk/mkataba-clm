/* Chromium verification: THE BOARD KEEPS YOUR PLACE (owner, 10 Oct 2026)
   ============================================================
   "when you click to get a new chart or any new changes on the board, the
   board pushes you to the top. I need for the new charts or changes to be on
   screen not pushed out and have scroll and find it."
   At 1440 x 900, light, five cards on the Board:
     1. changing a card's dropdown while scrolled down keeps that card where
        it was on the screen
     2. a new chart, added while scrolled to the bottom, is brought on screen
        — the board does not jump to its top
     3. a change to the open chart while partway down it (the repaint the
        reading chips, "what if" and Explain ask for) does not throw the
        reader back to the chart's top
     4. no page errors
   Waits ask for the state, bounded. Red at unmodified main (2, 3).
   Run: node test/chromium/board-keeps-your-place-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'board-keeps-your-place');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let failures = 0;
const check = (name, pass, detail) => {
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
  if (!pass) failures++;
};
const R = { which: 'all', pic: 'bars', split: { by: 'status' }, measure: 'count' };
const PANELS = [['pa', 'q:contracts by status'], ['pb', 'q:contracts by counterparty'], ['pc', 'q:contracts by month signed'], ['pd', 'q:contracts by stream'], ['pe', 'q:contracts by owner']];

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
    const place = ({ P, R }) => { const s = hbS(); s.face = 'board'; s.prep = 'closed'; s.path = []; s.digBig = false;
      s.panels = P.map(([id, key]) => ({ id, kind: 'view', key, title: id, recipe: JSON.parse(JSON.stringify(R)), split: false, big: false }));
      hbSave(); if (state.view !== 'dashboard') setView('dashboard'); else hbPaintBoard(); return true; };
    await page.evaluate(place, { P: PANELS, R });
    const stood = await until(async ({ P, R }) => {
      if (P.every(([id]) => document.querySelector(`[data-hb-pid="${id}"] [data-hb-rc]`))) return true;
      const s = hbS(); if (!(s.panels || []).some(p => p.id === 'pa')) { s.panels = P.map(([id, key]) => ({ id, kind: 'view', key, title: id, recipe: JSON.parse(JSON.stringify(R)), split: false, big: false })); hbSave(); hbPaintBoard(); }
      return false; }, { P: PANELS, R }, 15000);
    check('0. five cards on the Board, each with its dropdown row', !!stood);
    const where = id => page.evaluate(id => { const host = document.getElementById('hb-board'), el = document.querySelector(`[data-hb-pid="${id}"]`);
      if (!host || !el) return null; const hr = host.getBoundingClientRect(), r = el.getBoundingClientRect();
      return { top: Math.round(r.top - hr.top), bottom: Math.round(r.bottom - hr.top), H: host.clientHeight, st: Math.round(host.scrollTop) }; }, id);

    console.log('\n1 · a card changed where it stands');
    const lowest = await page.evaluate(() => { const host = document.getElementById('hb-board');
      const cards = [...host.querySelectorAll('[data-hb-pid]')]; const c = cards[cards.length - 1]; c.scrollIntoView({ block: 'center' }); return c.getAttribute('data-hb-pid'); });
    await page.waitForTimeout(300);
    const before = await where(lowest);
    await page.click(`[data-hb-pid="${lowest}"] [data-hb-rc="measure"], [data-hb-pid="${lowest}"] [data-hb-rc="pic"]`);
    await until(() => !!document.querySelector('.hb-rmenu'));
    const chose = await page.evaluate(() => { const b = [...document.querySelectorAll('.hb-rmenu [data-hb-rset]')].find(x => x.getAttribute('aria-checked') !== 'true' && !x.disabled);
      if (!b) return null; b.scrollIntoView({ block: 'nearest' }); return b.getAttribute('data-hb-rset'); });
    if (chose) await page.click(`.hb-rmenu [data-hb-rset="${chose}"]`);
    await until(() => !document.querySelector('.hb-rmenu'));
    await page.waitForTimeout(400);
    const after = await where(lowest);
    check('1. the changed card stays where it was on the screen', !!before && !!after && before.st > 0 && Math.abs(after.top - before.top) <= 6,
      JSON.stringify({ chose, before, after }));
    await page.screenshot({ path: path.join(OUT, '1-changed-in-place.png') });

    console.log('\n2 · a new chart while scrolled to the bottom');
    await page.evaluate(() => { const host = document.getElementById('hb-board'); host.scrollTop = host.scrollHeight; });
    await page.waitForTimeout(200);
    const nid = await page.evaluate(() => { const s = hbS(); hbAddCard({ all: true }, { pic: 'bars', split: { by: 'status' }, measure: 'value' }, 'A new chart');
      s.path = []; hbSave(); hbPaintBoard({ jump: 'top' }); return (s.panels[s.panels.length - 1] || {}).id; });
    await page.waitForTimeout(400);
    const nw = await where(nid);
    check('2. the new chart is on screen, all of it (it fits)', !!nw && nw.top >= 0 && nw.bottom <= nw.H, JSON.stringify(nw));
    await page.screenshot({ path: path.join(OUT, '2-new-on-screen.png') });

    console.log('\n3 · the open chart changed partway down it');
    await page.evaluate(() => { const s = hbS(); s.path = ['q:contracts by counterparty']; s.digBig = false; hbSave(); hbPaintBoard({ jump: 'focus' }); });
    const open = await until(() => !!document.querySelector('#hb-focus [data-hb-rc]'));
    check('3a. the chart is open', !!open);
    await page.evaluate(() => { const host = document.getElementById('hb-board'), f = document.getElementById('hb-focus'), rc = f.querySelector('.hb-recipe, [data-hb-rkey]') || f;
      const hr = host.getBoundingClientRect(), r = rc.getBoundingClientRect(); host.scrollTop += (r.top - hr.top) - 200; });
    await page.waitForTimeout(250);
    const fBefore = await page.evaluate(() => { const host = document.getElementById('hb-board'), b = document.querySelector('#hb-focus [data-hb-rc="measure"], #hb-focus [data-hb-rc="pic"]');
      return { st: Math.round(host.scrollTop), y: Math.round(b.getBoundingClientRect().top - host.getBoundingClientRect().top) }; });
    /* a press inside the open chart, then the repaint Copilot's reading
       chips, "what if" and Explain ask for (hbPaintBoard({ jump: 'focus' })) */
    await page.mouse.click(...await page.evaluate(() => { const b = document.querySelector('#hb-focus [data-hb-rc="measure"], #hb-focus [data-hb-rc="pic"]'); const r = b.getBoundingClientRect(); return [r.left - 30, r.top + r.height / 2]; }));
    const chose2 = await page.evaluate(() => { const key = (hbS().path || []).slice(-1)[0]; hbRecipeSet(key, 'pic', 'cols'); hbPaintBoard({ jump: 'focus' }); return 'pic:cols'; });
    await page.waitForTimeout(400);
    const fAfter = await page.evaluate(() => { const host = document.getElementById('hb-board'), b = document.querySelector('#hb-focus [data-hb-rc="measure"], #hb-focus [data-hb-rc="pic"]');
      return b ? { st: Math.round(host.scrollTop), y: Math.round(b.getBoundingClientRect().top - host.getBoundingClientRect().top) } : null; });
    check('3b. the dropdown row the reader pressed stays where it was', !!fAfter && fBefore.st > 0 && Math.abs(fAfter.y - fBefore.y) <= 6, JSON.stringify({ chose2, fBefore, fAfter }));
    await page.screenshot({ path: path.join(OUT, '3-open-chart.png') });
  } catch (e) {
    console.log('ERROR', e && e.stack || e); failures++;
  } finally {
    check('4. no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
    await browser.close(); await h.stop();
    console.log(failures ? `\n${failures} failed` : '\nall passed');
    process.exit(failures ? 1 : 0);
  }
})();
