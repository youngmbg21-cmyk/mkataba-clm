/* Chromium verification: SOLID LISTS, A LIGHT SELECTION, ONE SEARCH FIELD
   ============================================================
   Work order "Home speed", Parts 10–12 (owner, 8 Oct 2026: "The drop down on
   the board is translucent ... When selecting choices on the board, there's a
   dark black outline ... The search field at the top of the page seems to
   have thick boundaries and does not turn dark"). RE-POINTED 20 Oct 2026
   (the owner picked "Chambers" and removed dark mode: "Let's not implement
   the dark theme. Remove it from HaTi."): the dark pass is gone with the
   night; the Board is always the light screen, and the light pass stays:
     1. a board card's open list (and its ⋯ menu) paints a SOLID ground, no
        blur — nothing of the card below shows through
     2. after a MOUSE press the open choice wears no dark ring: no inset
        shadow, no outline, its edge lighter than the board's glow
     3. a keyboard Tab onto a choice still shows a 2px ring
     4. the search field at rest has no THICK boundary: Chambers draws it as
        a well with ONE hairline, the bar's own line (--bar-line), and no glow
        (until 20 Oct 2026 it had no edge at all on the dark bar)
     5. pressed, it has one 1px edge and no glow (the box inside draws no
        second ring); its ground is white and its typed text dark
     6. no page errors
   and, once the cards stand, 0b: the Board is the light screen even for a
   reader who stored the old Dark choice, and no Light | Dark switch is drawn.
   Waits ask for the state, bounded. Red at main e18f309 (1, 2, 4, 5).
   Run: node test/chromium/board-lists-and-search-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'board-lists-and-search');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let failures = 0;
const check = (name, pass, detail) => {
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
  if (!pass) failures++;
};
const R = { which: 'all', pic: 'bars', split: { by: 'status' }, measure: 'count' };
const PANELS = [['pa', 'q:contracts by status'], ['pb', 'q:contracts by counterparty']];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h, { approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    for (const screen of ['light']) {
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
      const standFn = ({ P, R, screen }) => {
        /* RE-POINTED 11 Oct 2026 (the Board as drawn): the card's list is the How this is drawn panel */
        if (P.every(([id]) => document.querySelector(`[data-hb-pid="${id}"] [data-hb-drawn]`))) return true;
        /* a reader who chose the Board's old Dark screen before 20 Oct 2026
           still carries it in their stored board: it must not be read (0b) */
        const s = hbS(); s.face = 'board'; s.prep = 'closed'; s.path = []; s.screen = 'dark'; s.scrPick = 1;
        s.panels = P.map(([id, key]) => ({ id, kind: 'view', key, title: id, recipe: JSON.parse(JSON.stringify(R)), split: false, big: false }));
        hbSave(); if (state.view !== 'dashboard') setView('dashboard'); else hbPaintBoard(); return false; };
      /* SLOW-RUNNER WAIT (10 Oct 2026, "get main to green"): on GitHub's runner
         a pass once found the cards standing, then lost card "pa" to a
         later repaint before the press — the list never opened and step 3 read
         a card that was gone. So each press first asks that the cards STILL
         stand (re-staging them if a repaint took them), bounded. */
      const stand = () => until(standFn, { P: PANELS, R, screen }, 15000);
      const stood = await stand();
      check(`0. ${screen}: the board's cards stand`, !!stood);
      if (!stood) { await page.close(); continue; }
      /* THE ONE LOOK (20 Oct 2026): the Board is the light screen whatever was
         stored, and no Light | Dark switch is drawn — so every check below
         that says "light" was read on the light screen */
      const look = await page.evaluate(() => { const pg = document.getElementById('hb-page') || document.getElementById('ig-page');
        return { light: !!pg && pg.classList.contains('hb-light'), dark: !!pg && pg.classList.contains('hb-dark'),
          html: document.documentElement.classList.contains('dark'), switch: !!document.querySelector('[data-hb-screen], .hb-scr') }; });
      check(`0b. ${screen}: the Board is the light screen though an old Dark choice is stored, and draws no Light | Dark switch`,
        look.light && !look.dark && !look.html && !look.switch, JSON.stringify(look));
      const rgba = s => { const m = String(s).match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
      /* 1 + 2: a mouse press on the Split choice */
      await stand();
      const btn = await page.evaluate(() => { const b = document.querySelector('[data-hb-pid="pa"] [data-hb-drawn]');
        b.scrollIntoView({ block: 'center' }); const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
      await page.mouse.click(btn.x, btn.y);
      const menu = await until(() => { const m = document.querySelector('.hb-dp'); if (!m) return null; const cs = getComputedStyle(m);
        const b = document.querySelector('[data-hb-pid="pa"] [data-hb-drawn]'), bs = getComputedStyle(b);
        const glow = getComputedStyle(document.getElementById('hb-page') || document.getElementById('ig-page')).getPropertyValue('--hb-glow').trim();
        return { bg: cs.backgroundColor, blur: cs.backdropFilter, shadow: bs.boxShadow, outline: bs.outlineStyle + ' ' + bs.outlineWidth, edge: bs.borderTopColor, ew: parseFloat(bs.borderTopWidth), glow }; });
      await page.screenshot({ path: path.join(OUT, '1-list-open-light.png') });
      const mbg = menu && rgba(menu.bg);
      check(`1. ${screen}: the open list's ground is solid, no blur`, !!mbg && mbg.a === 1 && (!menu.blur || menu.blur === 'none'), menu && `${menu.bg} · blur ${menu.blur}`);
      const edge = menu && rgba(menu.edge);
      check(`2. ${screen}: after a mouse press the open choice wears no dark ring`, !!menu && !/inset/.test(menu.shadow) && (/^none /.test(menu.outline) || / 0px$/.test(menu.outline))
        && !!edge && (edge.a < 1 || menu.ew === 0), menu && `shadow ${menu.shadow} · outline ${menu.outline} · edge ${menu.edge}`);
      await page.keyboard.press('Escape'); await page.mouse.click(4, 400);
      await until(() => !document.querySelector('.hb-dp'), null, 3000);
      /* the card's ⋯ menu */
      const more = await page.evaluate(() => { const b = document.querySelector('[data-hb-pid="pa"] [data-hb-tools-more]'); if (!b) return false; b.click(); return true; });
      if (more) { const pm = await until(() => { const m = document.querySelector('.hb-pmenu'); if (!m) return null; const cs = getComputedStyle(m); return { bg: cs.backgroundColor, blur: cs.backdropFilter }; });
        const pbg = pm && rgba(pm.bg);
        check(`1. ${screen}: the ⋯ menu's ground is solid, no blur`, !!pbg && pbg.a === 1 && (!pm.blur || pm.blur === 'none'), pm && `${pm.bg} · blur ${pm.blur}`);
        await page.keyboard.press('Escape'); await page.mouse.click(4, 400); }
      /* 3: the keyboard still gets a ring */
      await stand();
      await page.evaluate(() => document.querySelector('[data-hb-pid="pa"] [data-hb-drawn]').setAttribute('data-kb', '1'));
      await page.focus('[data-hb-pid="pa"] [data-hb-drawn][data-kb]'); await page.keyboard.press('Shift+Tab'); await page.keyboard.press('Tab');
      const ring = await page.evaluate(() => { const a = document.activeElement; const cs = getComputedStyle(a); return { on: a.matches('[data-hb-drawn]'), style: cs.outlineStyle, w: parseFloat(cs.outlineWidth) }; });
      check(`3. ${screen}: a keyboard Tab onto a choice shows a 2px ring`, ring.on && ring.style !== 'none' && ring.w >= 2, JSON.stringify(ring));
      /* 4 + 5 RE-POINTED 29 Oct 2026 (round 1 "The Legora way", owner's yes): the bar's search field left — one box per
         page, Jambo's; the field's rest and pressed dress went with it */
      const none = await page.evaluate(() => !document.querySelector('#top-header .cmd-search, #cmd-search'));
      check(`4. ${screen}: the bar carries no search field`, none);
      await page.close();
    }
    check('6. no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } finally {
    await browser.close(); await h.stop();
  }
  console.log(failures ? `\n${failures} FAILED` : '\nALL PASS');
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
