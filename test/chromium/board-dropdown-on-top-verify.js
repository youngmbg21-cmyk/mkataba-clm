/* Chromium verification: A BOARD DROPDOWN IS ALWAYS ON TOP OF THE CARDS
   ============================================================
   Work order "Home speed", Part 4 (owner-asked 8 Oct 2026). On the Board the
   open SPLIT list of a card ran down over the card below it, and the card
   below was painted ON TOP of the list: its words showed through and the
   lower choices could not be pressed. Every .hb-card makes its own layer (its
   frosted backdrop-filter), so a later card stacked over an earlier card's
   list whatever the list's z-index. The fix raises the card whose list is
   open (index.html, `.hb-card:has(.hb-rmenu,.hb-pmenu)`).

   For a card with a card below it, in light and dark, at 1440 and 1100 wide:
     1. every dropdown on the card's row (Contracts, Split, Picture, Measure)
        and its ⋯ menu where drawn: at the middle of every choice the list
        shows, the element under the pointer is the list (elementFromPoint)
     2. pressing the lowest visible SPLIT choice applies it
   Waits ask for the state, bounded. Red at unmodified main (1).
   Run: node test/chromium/board-dropdown-on-top-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'board-dropdown-on-top');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let failures = 0;
const check = (name, pass, detail) => {
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
  if (!pass) failures++;
};
const R = { which: 'all', pic: 'bars', split: { by: 'status' }, measure: 'count' };
const PANELS = [['pa', 'q:contracts by status'], ['pb', 'q:contracts by counterparty'], ['pc', 'q:contracts by month signed']];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h, { approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    for (const W of [1440, 1100]) for (const screen of ['light', 'dark']) {
      const tag = `${W} ${screen}`;
      const page = await (await browser.newContext({ viewport: { width: W, height: 900 } })).newPage();
      page.on('pageerror', e => errors.push(e.message));
      const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
        while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
        return v; };
      await page.goto(h.base + '/', { waitUntil: 'networkidle' });
      await page.fill('#li-email', 'admin@example.co.ke');
      await page.fill('#li-pass', 'adminpassword1');
      await page.click('#li-go');
      await page.waitForFunction(() => window.state && state.contracts && state.contracts.length > 3 && typeof hbS === 'function', null, { timeout: 20000 });
      const place = ({ P, R, screen }) => { const s = hbS(); s.face = 'board'; s.prep = 'closed'; s.path = []; s.digBig = false; s.screen = screen; s.scrPick = 1;
        s.panels = P.map(([id, key]) => ({ id, kind: 'view', key, title: id, recipe: JSON.parse(JSON.stringify(R)), split: false, big: false }));
        hbSave(); if (state.view !== 'dashboard') setView('dashboard'); else hbPaintBoard(); return true; };
      await page.evaluate(place, { P: PANELS, R, screen });
      /* the saved settings may land after the first paint: ask until the
         three cards stand, placing them again if they were replaced */
      const stood = await until(async ({ P, R, screen }) => {
        if (P.every(([id]) => document.querySelector(`[data-hb-pid="${id}"] [data-hb-rc]`))) return true;
        const s = hbS(); if (!(s.panels || []).some(p => p.id === 'pa')) { s.panels = P.map(([id, key]) => ({ id, kind: 'view', key, title: id, recipe: JSON.parse(JSON.stringify(R)), split: false, big: false })); s.screen = screen; s.scrPick = 1; hbSave(); hbPaintBoard(); }
        return false; }, { P: PANELS, R, screen }, 15000);
      check(`0. ${tag}: three cards on the board, each with its dropdown row`, !!stood);
      if (!stood) { await page.close(); continue; }
      /* the upper card: the one with another card straight below it */
      const upper = await page.evaluate(ids => {
        const rs = ids.map(id => ({ id, r: document.querySelector(`[data-hb-pid="${id}"]`).getBoundingClientRect() }));
        const pair = rs.find(a => rs.some(b => b !== a && b.r.top >= a.r.bottom - 2 && Math.abs(b.r.left - a.r.left) < 40));
        return pair ? pair.id : null; }, PANELS.map(p => p[0]));
      check(`0b. ${tag}: a card has a card straight below it`, !!upper, upper);
      if (!upper) { await page.close(); continue; }
      const parts = await page.evaluate(id => [...document.querySelectorAll(`[data-hb-pid="${id}"] [data-hb-rc]`)].map(b => b.getAttribute('data-hb-rc')), upper);
      const probe = () => {
        const m = document.querySelector('.hb-rmenu, .hb-pmenu'); if (!m) return null;
        const mr = m.getBoundingClientRect(); const bad = []; let n = 0;
        [...m.querySelectorAll('button')].forEach(it => { const r = it.getBoundingClientRect(); const cy = r.top + r.height / 2;
          if (r.height < 2 || cy < mr.top + 3 || cy > mr.bottom - 3 || cy < 0 || cy > innerHeight) return;
          n++; const e = document.elementFromPoint(r.left + r.width / 2, cy);
          if (!e || !m.contains(e)) bad.push((it.textContent || '').trim().slice(0, 24) + ' → ' + (e ? ((e.closest('[data-hb-pid]') || e).getAttribute('data-hb-pid') || e.className.toString().slice(0, 20)) : 'nothing')); });
        return { n, bad }; };
      const close = async () => { await page.keyboard.press('Escape'); await page.mouse.click(4, 4); await until(() => !document.querySelector('.hb-rmenu, .hb-pmenu'), null, 3000); };
      for (const part of parts) {
        await page.evaluate(({ id, part }) => { const b = document.querySelector(`[data-hb-pid="${id}"] [data-hb-rc="${part}"]`); b.scrollIntoView({ block: 'center' }); b.click(); }, { id: upper, part });
        const r = await until(probe);
        check(`1. ${tag}: the ${part} list is on top at every choice it shows`, !!r && r.n > 0 && r.bad.length === 0,
          r ? `${r.n - r.bad.length}/${r.n} on top${r.bad.length ? ' · covered: ' + r.bad.join(', ') : ''}` : 'no list opened');
        if (part === 'split' && W === 1440 && screen === 'light') await page.screenshot({ path: path.join(OUT, '1-split-open.png') });
        await close();
      }
      /* the card's own ⋯ menu, where this card draws one */
      const more = await page.evaluate(id => { const b = document.querySelector(`[data-hb-pid="${id}"] [data-hb-act="more"]`); if (!b) return false; b.scrollIntoView({ block: 'center' }); b.click(); return true; }, upper);
      if (more) { const r = await until(probe);
        check(`1. ${tag}: the ⋯ menu is on top`, !!r && r.bad.length === 0, r ? `${r.n - r.bad.length}/${r.n}` : 'no menu'); await close(); }
      /* 2. pressing the lowest visible split choice applies it */
      if (W === 1440 && screen === 'light' && parts.includes('split')) {
        await page.evaluate(id => { const b = document.querySelector(`[data-hb-pid="${id}"] [data-hb-rc="split"]`); b.scrollIntoView({ block: 'center' }); b.click(); }, upper);
        await until(() => !!document.querySelector('.hb-rmenu'));
        const pick = await page.evaluate(() => { const m = document.querySelector('.hb-rmenu'), mr = m.getBoundingClientRect();
          const vis = [...m.querySelectorAll('[data-hb-rset]:not(:disabled)')].filter(b => { const r = b.getBoundingClientRect(); return r.bottom <= mr.bottom - 2 && r.top >= mr.top && r.bottom <= innerHeight; });
          const b = vis[vis.length - 1]; if (!b) return null; const r = b.getBoundingClientRect();
          return { v: b.getAttribute('data-hb-rset'), x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
        if (pick) { await page.mouse.click(pick.x, pick.y);
          const applied = await until(({ id, v }) => { const k = (hbS().panels || []).find(p => p.id === id); const key = k && k.key; const val = v.slice(v.indexOf(':') + 1);
            const P = key ? hbPlan(hbDigData(key, hbS().lens)) : null; const S = P && P.split; const cur = !S ? 'none' : S.by === 'date' ? 'd:' + S.unit + ':' + S.date : 'g:' + S.by;
            return cur === val ? cur : null; }, { id: upper, v: pick.v });
          check('2. pressing the lowest visible split choice applies it', !!applied, pick.v + ' → ' + applied);
        } else check('2. a split choice to press', false, 'none visible');
      }
      await page.close();
    }
    check('3. no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } finally {
    await browser.close(); await h.stop();
  }
  console.log(failures ? `\n${failures} FAILED` : '\nALL PASS');
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
