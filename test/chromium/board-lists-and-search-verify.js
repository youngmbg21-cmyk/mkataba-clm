/* Chromium verification: SOLID LISTS, A LIGHT SELECTION, ONE SEARCH FIELD
   ============================================================
   Work order "Home speed", Parts 10–12 (owner, 8 Oct 2026: "The drop down on
   the board is translucent ... When selecting choices on the board, there's a
   dark black outline ... The search field at the top of the page seems to
   have thick boundaries and does not turn dark"). Light and dark:
     1. a board card's open list (and its ⋯ menu) paints a SOLID ground, no
        blur — nothing of the card below shows through
     2. after a MOUSE press the open choice wears no dark ring: no inset
        shadow, no outline, its edge lighter than the board's glow
     3. a keyboard Tab onto a choice still shows a 2px ring
     4. the search field at rest has no visible edge
     5. pressed, it has one 1px edge and no glow (the box inside draws no
        second ring); in dark mode its ground is
        dark and its typed text light, in light mode its ground is white
     6. no page errors
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
    for (const screen of ['light', 'dark']) {
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
      if (screen === 'dark') await page.evaluate(() => setDark(true));
      const stood = await until(({ P, R, screen }) => {
        if (P.every(([id]) => document.querySelector(`[data-hb-pid="${id}"] [data-hb-rc]`))) return true;
        const s = hbS(); s.face = 'board'; s.prep = 'closed'; s.path = []; s.screen = screen; s.scrPick = 1;
        s.panels = P.map(([id, key]) => ({ id, kind: 'view', key, title: id, recipe: JSON.parse(JSON.stringify(R)), split: false, big: false }));
        hbSave(); if (state.view !== 'dashboard') setView('dashboard'); else hbPaintBoard(); return false; }, { P: PANELS, R, screen }, 15000);
      check(`0. ${screen}: the board's cards stand`, !!stood);
      if (!stood) { await page.close(); continue; }
      const rgba = s => { const m = String(s).match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
      const lum = c => c ? (0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b) / 255 : null;
      /* 1 + 2: a mouse press on the Split choice */
      const btn = await page.evaluate(() => { const b = document.querySelector('[data-hb-pid="pa"] [data-hb-rc="split"]') || document.querySelector('[data-hb-pid="pa"] [data-hb-rc]');
        b.scrollIntoView({ block: 'center' }); const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
      await page.mouse.click(btn.x, btn.y);
      const menu = await until(() => { const m = document.querySelector('.hb-rmenu'); if (!m) return null; const cs = getComputedStyle(m);
        const b = document.querySelector('.hb-rc.is-open') || document.querySelector('[data-hb-pid="pa"] [data-hb-rc="split"]'), bs = getComputedStyle(b);
        const glow = getComputedStyle(document.getElementById('hb-page') || document.getElementById('ig-page')).getPropertyValue('--hb-glow').trim();
        return { bg: cs.backgroundColor, blur: cs.backdropFilter, shadow: bs.boxShadow, outline: bs.outlineStyle + ' ' + bs.outlineWidth, edge: bs.borderTopColor, glow }; });
      if (screen === 'light') await page.screenshot({ path: path.join(OUT, '1-list-open-light.png') });
      else await page.screenshot({ path: path.join(OUT, '1-list-open-dark.png') });
      const mbg = menu && rgba(menu.bg);
      check(`1. ${screen}: the open list's ground is solid, no blur`, !!mbg && mbg.a === 1 && (!menu.blur || menu.blur === 'none'), menu && `${menu.bg} · blur ${menu.blur}`);
      const edge = menu && rgba(menu.edge);
      check(`2. ${screen}: after a mouse press the open choice wears no dark ring`, !!menu && !/inset/.test(menu.shadow) && (/^none /.test(menu.outline) || / 0px$/.test(menu.outline))
        && !!edge && edge.a < 1, menu && `shadow ${menu.shadow} · outline ${menu.outline} · edge ${menu.edge}`);
      await page.keyboard.press('Escape'); await page.mouse.click(4, 400);
      await until(() => !document.querySelector('.hb-rmenu'), null, 3000);
      /* the card's ⋯ menu */
      const more = await page.evaluate(() => { const b = document.querySelector('[data-hb-pid="pa"] [data-hb-act="more"]'); if (!b) return false; b.click(); return true; });
      if (more) { const pm = await until(() => { const m = document.querySelector('.hb-pmenu'); if (!m) return null; const cs = getComputedStyle(m); return { bg: cs.backgroundColor, blur: cs.backdropFilter }; });
        const pbg = pm && rgba(pm.bg);
        check(`1. ${screen}: the ⋯ menu's ground is solid, no blur`, !!pbg && pbg.a === 1 && (!pm.blur || pm.blur === 'none'), pm && `${pm.bg} · blur ${pm.blur}`);
        await page.keyboard.press('Escape'); await page.mouse.click(4, 400); }
      /* 3: the keyboard still gets a ring */
      await page.evaluate(() => document.querySelector('[data-hb-pid="pa"] [data-hb-rc]').setAttribute('data-kb', '1'));
      await page.focus('[data-hb-pid="pa"] [data-hb-rc][data-kb]'); await page.keyboard.press('Shift+Tab'); await page.keyboard.press('Tab');
      const ring = await page.evaluate(() => { const a = document.activeElement; const cs = getComputedStyle(a); return { on: a.matches('[data-hb-rc]'), style: cs.outlineStyle, w: parseFloat(cs.outlineWidth) }; });
      check(`3. ${screen}: a keyboard Tab onto a choice shows a 2px ring`, ring.on && ring.style !== 'none' && ring.w >= 2, JSON.stringify(ring));
      /* 4 + 5: the search field */
      await page.mouse.click(4, 400);
      const rest = await page.evaluate(() => { const f = document.querySelector('#top-header .cmd-search'), cs = getComputedStyle(f); return { edge: cs.borderTopColor, w: cs.borderTopWidth, shadow: cs.boxShadow }; });
      const re = rgba(rest.edge);
      check(`4. ${screen}: the search field at rest has no visible edge`, (!!re && re.a === 0) || rest.w === '0px', JSON.stringify(rest));
      await page.click('#cmd-search');
      /* the field eases its edge in (a short transition): ask until it has
         settled, bounded, then read it whatever it says */
      const readOn = () => { const f = document.querySelector('#top-header .cmd-search'); if (!f.matches(':focus-within')) return null; const cs = getComputedStyle(f), is = getComputedStyle(f.querySelector('input'));
        return { bg: cs.backgroundColor, w: cs.borderTopWidth, edge: cs.borderTopColor, shadow: cs.boxShadow, ink: is.color, inner: is.boxShadow + ' · ' + is.outlineStyle }; };
      await until(f => { const v = eval(f)(); return v && !/, 0\)$/.test(v.edge) && !/0\.\d+\)$/.test(v.edge) ? v : null; }, readOn.toString(), 2000);
      const on = await page.evaluate(f => eval(f)(), readOn.toString());
      await page.keyboard.type('supply');
      await page.screenshot({ path: path.join(OUT, `2-search-${screen}.png`), clip: { x: 0, y: 0, width: 1440, height: 60 } });
      const bg = on && rgba(on.bg), ink = on && rgba(on.ink);
      check(`5. ${screen}: pressed = one 1px edge, no glow`, !!on && on.w === '1px' && on.shadow === 'none' && on.inner === 'none · none' && rgba(on.edge).a === 1, JSON.stringify(on));
      if (screen === 'dark') check('5. dark: the pressed field is dark with light text', !!bg && bg.a === 1 && lum(bg) < 0.25 && lum(ink) > 0.7, on && `${on.bg} · ${on.ink}`);
      else check('5. light: the pressed field is white with dark text', !!bg && bg.a === 1 && lum(bg) > 0.97 && lum(ink) < 0.3, on && `${on.bg} · ${on.ink}`);
      await page.close();
    }
    check('6. no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } finally {
    await browser.close(); await h.stop();
  }
  console.log(failures ? `\n${failures} FAILED` : '\nALL PASS');
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
