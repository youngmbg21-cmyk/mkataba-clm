/* ============================================================
   THE BOARD'S OWN HELPERS STAY ON THE BOARD
   (owner's work order, 23 Oct 2026, docs/WORKORDER-board-helpers-stay-on-the-board.md:
   "am i supposed to get the list of predetermined choices to choose from? …
   review if this is happening elsewhere")
   ============================================================
   A contract brought up from the Board (hbStripBring) is drawn ON the Board
   face, so a helper that asked only "is the Board face up?" behaved as if the
   charts were in front: the empty box offered the analyst gallery, "/" the
   Board's moves, "… by " and "… in " their lists, Ctrl/⌘+Z the Board's undo,
   and a gallery pick added a chart BEHIND the contract while a toast said
   "Added to the board". ONE reading now says "the Board itself is in front"
   (hbBoardInFront: the Board face, no contract on it).
     1  with a contract in front, on each of its pages (History, Overview,
        Where we are): the empty box gives no gallery; "/" gives no Moves;
        "by" and "in" give no pop-up; Ctrl+Z gives no toast and leaves the
        Board's charts alone; a gallery pick adds nothing; Esc leaves an open
        chart path alone
     2  on the Board itself: all four pop-ups still appear; Ctrl+Z still
        answers; a gallery pick adds one chart and that chart is in view
     3  photographs at the owner's three screens
   Red at the parent (main e52f743): 1a–1e fail on every page.
     node test/chromium/board-helpers-stay-on-the-board-verify.js
   ============================================================ */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = path.join(process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots'), 'board-helpers-stay-on-the-board');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const pause = ms => new Promise(r => setTimeout(r, ms));
let pass = 0, fail = 0;
const check = (name, ok, detail) => { ok ? pass++ : fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`); };
const waitFor = async (page, fn, ms = 8000, arg) => { const end = Date.now() + ms;
  while (Date.now() < end) { if (await page.evaluate(fn, arg).catch(() => false)) return true; await pause(100); } return false; };
const SCREENS = [[1440, 780], [1536, 730], [1366, 950]];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati({ HATI_AGENTS_AUTO: 'off' });
  await seedWorkspace(h, { approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message.split('\n')[0]));
  /* what the box's pop-up shows right now: nothing, or its mode and words */
  const pop = () => page.evaluate(() => { const el = document.getElementById('hb-askpop');
    return el ? { text: el.textContent.replace(/\s+/g, ' ').trim().slice(0, 300), slash: /\/(?:trend|compare|split|explain)/.test(el.textContent) } : null; });
  /* type into Jambo's box the way a person does: focus, words, the input event */
  const type = async words => {
    await page.evaluate(() => { const i = document.getElementById('igd-input'); if (i){ i.value = ''; i.blur(); } });
    await page.locator('#igd-input').click();
    if (words) await page.keyboard.type(words, { delay: 15 });
    await pause(350);
  };
  const clearBox = () => page.evaluate(() => { const i = document.getElementById('igd-input'); if (i){ i.value = ''; i.dispatchEvent(new Event('input', { bubbles: true })); i.blur(); }
    if (typeof hbAskPopClose === 'function') hbAskPopClose(); });
  const toasts = () => page.evaluate(() => document.querySelectorAll('#toast-root .toast-in').length);
  const panels = () => page.evaluate(() => JSON.stringify((hbS().panels || []).map(p => p.id)));
  const toBoard = async () => {
    await page.evaluate(() => { if (typeof bsCardLeave === 'function') bsCardLeave(); setView('dashboard'); if (typeof hbSetFace === 'function') hbSetFace('board'); else { hbS().face = 'board'; hbMount(); } });
    await waitFor(page, () => hbS().face === 'board' && !bsCardId() && !!document.getElementById('igd-input'), 8000);
    await pause(300);
  };
  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await waitFor(page, () => window.state && state.contracts && state.contracts.some(c => c.id === 'MK-A1'), 20000);
    await page.keyboard.press('Escape').catch(() => {});
    await page.evaluate(() => { if (langId() !== 'en') langSet('en'); });
    await toBoard();

    /* ---- 1  A CONTRACT IN FRONT ---- */
    for (const pg of ['hist', 'ov', 'where']){
      await toBoard();
      await page.evaluate(pg => hbStripBring('MK-A1', pg), pg);
      const up = await waitFor(page, () => bsCardId() === 'MK-A1' && hbS().face === 'board' && !!document.getElementById('igd-input'), 8000);
      check(`1 (${pg}) the contract is in front on the Board face`, up);
      await pause(400);
      await type('');
      const g = await pop();
      check(`1a (${pg}) the empty box gives no gallery`, !g, JSON.stringify(g));
      await type('/');
      const sl = await pop();
      check(`1b (${pg}) "/" gives the places only, no Board moves`, !sl || !sl.slash, JSON.stringify(sl));
      await type('contracts by ');
      const by = await pop();
      check(`1c (${pg}) "… by " gives no Split by list`, !by, JSON.stringify(by));
      await type('value in ');
      const inn = await pop();
      check(`1d (${pg}) "… in " gives no Period list`, !inn, JSON.stringify(inn));
      await clearBox();
      const t0 = await toasts(), p0 = await panels();
      await page.evaluate(() => { if (document.activeElement) document.activeElement.blur(); });
      await page.keyboard.press('Control+z'); await pause(500);
      const t1 = await toasts(), p1 = await panels();
      check(`1e (${pg}) Ctrl+Z says nothing and leaves the charts alone`, t1 === t0 && p1 === p0, `toasts ${t0}→${t1}`);
      const added = await page.evaluate(() => { const n = (hbS().panels || []).length; hbGalleryRun('conc'); const m = (hbS().panels || []).length; return { n, m, still: bsCardId() }; });
      check(`1f (${pg}) a gallery pick adds nothing behind the contract`, added.m === added.n && added.still === 'MK-A1', JSON.stringify(added));
      const esc = await page.evaluate(() => { const s = hbS(); s.path = ['f:live']; return true; });
      await page.keyboard.press('Escape'); await pause(300);
      const kept = await page.evaluate(() => JSON.stringify(hbS().path || []));
      check(`1g (${pg}) Esc does not step out of a chart the reader cannot see`, esc && kept === '["f:live"]', kept);
      await page.evaluate(() => { hbS().path = []; hbSave(); });
      if (pg === 'hist'){ await type(''); await page.screenshot({ path: path.join(OUT, '1-contract-in-front.png') }); }
    }

    /* ---- 2  THE BOARD ITSELF ---- */
    await toBoard();
    await type('');
    const g2 = await pop();
    check('2a on the Board the empty box gives the gallery', !!g2 && /Concentration|analyst/i.test(g2.text), JSON.stringify(g2));
    await type('/');
    const s2 = await pop();
    check('2b on the Board "/" gives the Board\'s moves', !!s2 && s2.slash, JSON.stringify(s2));
    await type('contracts by ');
    check('2c on the Board "… by " gives Split by', !!(await pop()));
    await type('value in ');
    check('2d on the Board "… in " gives Period', !!(await pop()));
    await clearBox();
    const tb0 = await toasts();
    await page.evaluate(() => { if (document.activeElement) document.activeElement.blur(); });
    await page.keyboard.press('Control+z'); await pause(500);
    check('2e on the Board Ctrl+Z still answers', (await toasts()) > tb0);
    /* a pick from the gallery, pressed */
    await type('');
    const before = await page.evaluate(() => (hbS().panels || []).length);
    const row = page.locator('#hb-askpop [data-hb-pop]').filter({ hasText: /Concentration/i }).first();
    if (await row.count()) await row.click(); else await page.locator('#hb-askpop [data-hb-pop]').last().click();
    await waitFor(page, n => (hbS().panels || []).length === n + 1, 5000, before);
    await pause(900);
    const landed = await page.evaluate(() => {
      const p = (hbS().panels || []).slice(-1)[0]; if (!p) return { ok: false };
      const el = [...document.querySelectorAll('#hb-board [data-hb-pid]')].find(x => x.getAttribute('data-hb-pid') === p.id);
      if (!el) return { ok: false, why: 'not drawn' };
      const r = el.getBoundingClientRect(); const cx = r.left + Math.min(r.width / 2, 200), cy = Math.max(r.top + 24, 0);
      const hit = cy < innerHeight ? document.elementFromPoint(cx, cy) : null;
      return { ok: r.top < innerHeight && r.bottom > 0 && !!hit && el.contains(hit), top: Math.round(r.top), face: hbS().face, card: bsCardId() };
    });
    check('2f a gallery pick adds one chart and that chart is in view', (await page.evaluate(() => (hbS().panels || []).length)) === before + 1 && landed.ok, JSON.stringify(landed));
    /* no light: the landed card looks exactly as it does when not landed (the card's own lift is the look's, not a light) */
    const lit = await page.evaluate(() => { const el = document.querySelector('.is-landed'); if (!el) return { same: true, why: 'nothing landed' };
      const read = () => { const cs = getComputedStyle(el); return [cs.outlineStyle, cs.outlineWidth, cs.boxShadow, cs.backgroundColor, cs.borderColor].join(' | '); };
      const on = read(); el.classList.remove('is-landed'); const off = read(); el.classList.add('is-landed');
      return { same: on === off, on, off }; });
    check('2g it lands with no light drawn', lit.same, JSON.stringify(lit));

    /* ---- 3  THE OWNER'S THREE SCREENS ---- */
    for (const [w, hh] of SCREENS){
      await page.setViewportSize({ width: w, height: hh }); await pause(500);
      await toBoard(); await page.evaluate(() => hbStripBring('MK-A1', 'hist'));
      await waitFor(page, () => bsCardId() === 'MK-A1', 6000); await pause(400); await type('');
      check(`3 ${w}x${hh} contract in front: no gallery`, !(await pop()));
      await page.screenshot({ path: path.join(OUT, `3-contract-${w}x${hh}.png`) });
      await clearBox(); await toBoard(); await type('');
      check(`3 ${w}x${hh} the Board: the gallery`, !!(await pop()));
      await page.screenshot({ path: path.join(OUT, `3-board-${w}x${hh}.png`) });
      await clearBox();
    }
  } catch (e) {
    check('the stage ran', false, String(e && e.stack || e).slice(0, 400));
  } finally {
    check('no page errors', !errors.length, errors.slice(0, 3).join(' | '));
    console.log(`\n${pass}/${pass + fail} passed`);
    await browser.close().catch(() => {});
    await h.stop().catch(() => {});
    process.exit(fail ? 1 : 0);
  }
})();
