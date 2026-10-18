/* JAMBO'S PANEL BESIDE A PAGE — TO THE TOP, WITH HOME'S DIVIDER (owner, 18 Oct
   2026, off Settings and Home's Contracts place side by side: "make sure that
   the jambo panel resembles how the panel in image 2 is designed. The panel
   goes to the top and you have a slider that you can pull left to right to
   adjust the jambo panel"; js/app.js pageDockSet)

   WHAT THIS PINS, in a real browser on a seeded workspace
     1 on Settings (You and Company) and Import the panel runs from the top of
       the page's room (under the desk tabs) to the window's foot, flush to
       the right edge; the page's name is drawn left of it, at the page's one
       glyph top; the shell's title row is empty
     2 the divider is on the panel's left edge and really painted; a drag
       moves the panel's edge with the pointer, the width is Home's own stored
       width (Home's panel opens at it), a double-click puts it back, the
       arrows step it, and at a floor the grip goes amber
     3 an iPad finger drags it too (touch)
     4 the page still scrolls under its own scrollbar, left of the panel; the
       panel holds still
     5 leaving the page takes the panel down: nothing of it stays on the next
       page, and the bar's Jambo is no longer sent to it
     6 it fits the owner's three screens: the panel, the page beside it, no
       sideways scroll
   At the parent (cb6290f) 1, 2, 3, 4a, 5a and 6 fail: the panel is a card
   inside the page, below its name, with no divider. 4b (the band stays
   pinned) and 5b (the bar's Jambo leaves with the page) are the controls that
   must pass on both sides. Every press on a
   part that may not exist reports instead of waiting out the clock.
   Run: node test/chromium/jambo-panel-beside-the-page-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const H = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = process.env.HATI_SHOT_DIR || '';
let failures = 0;
const check = (name, pass, detail) => {
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
  if (!pass) failures++;
};
const shot = async (page, name) => { if (!OUT) return; try { await page.screenshot({ path: path.join(OUT, name + '.png') }); } catch (_) {} };

/* the panel's box, the page's room and the page's name, as the reader sees them */
const GEO = () => {
  const r = s => { const e = typeof s === 'string' ? document.querySelector(s) : s; if (!e) return null; const b = e.getBoundingClientRect();
    return b.width || b.height ? { l: Math.round(b.left), t: Math.round(b.top), r: Math.round(b.right), b: Math.round(b.bottom), w: Math.round(b.width) } : null; };
  const dock = document.getElementById('page-dock');
  const grid = document.getElementById('body-grid');
  const h1 = document.querySelector('#content h1');
  const rz = document.getElementById('page-dock-rz');
  let grip = null;
  if (rz && !rz.hidden){ const g = rz.querySelector('span').getBoundingClientRect(); const hit = document.elementFromPoint(Math.round(g.left + g.width / 2), Math.round(g.top + g.height / 2));
    grip = { x: Math.round(g.left + g.width / 2), y: Math.round(g.top + g.height / 2), painted: !!(hit && hit.closest && hit.closest('#page-dock-rz')), limit: rz.getAttribute('data-at-limit') || '' }; }
  const padT = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--page-pad-t')) || 0;
  return { dock: dock && !dock.hidden ? r(dock) : null, grid: r(grid), sc: r('#content-scroll'), h1: h1 ? r(h1) : null, h1Text: h1 ? h1.textContent.trim() : '',
    head: (document.getElementById('page-head') || {}).innerHTML || '', grip, padT,
    jambo: !!(dock && dock.querySelector('#st-side, #mig-side')), win: [innerWidth, innerHeight], sideways: document.scrollingElement.scrollWidth > innerWidth };
};

(async () => {
  const h = await H.startHati({ HATI_AGENTS_AUTO: 'off' });
  await H.seedWorkspace(h, { approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 780 }, hasTouch: true });
    const page = await ctx.newPage();
    page.on('pageerror', e => errors.push(e.message));
    const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
      while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
      return v; };
    const geo = () => page.evaluate(GEO);
    const toSettings = async face => { await page.evaluate(f => { setView('team'); if (f) settingsGoTab(f); }, face);
      return until(() => !!document.getElementById('set-page') && !!document.getElementById('st-side')); };
    const toImport = async () => { await page.evaluate(() => setView('migration')); return until(() => !!document.getElementById('mig-side')); };

    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await page.waitForFunction(() => window.state && state.contracts && Array.isArray(state.contracts), null, { timeout: 20000 });
    await until(() => state.view === 'counter', null, 10000);
    await page.evaluate(() => { try { localStorage.removeItem(IG_SPLIT_KEY); } catch (_) {} });

    console.log('\n1 · to the top, flush right, the name beside it');
    for (const [label, go] of [['Settings · You', () => toSettings('you')], ['Settings · Company', () => toSettings('company')], ['Import', toImport]]) {
      await go(); await page.waitForTimeout(450);
      const g = await geo();
      const ok = !!g.dock && !!g.grid && g.dock.t === g.grid.t && g.dock.r === g.win[0] && g.dock.b === g.win[1] && g.jambo;
      check(`1a ${label}: the panel runs from the top of the page's room to the foot, flush right`, ok, JSON.stringify({ dock: g.dock, room: g.grid, win: g.win }));
      check(`1b ${label}: the page's name is left of the panel, at the one glyph top; no title row above`,
        !!g.h1 && !!g.dock && g.h1.r <= g.dock.l && Math.abs(g.h1.t - g.grid.t - g.padT) <= 1 && g.head === '', JSON.stringify({ h1: g.h1, text: g.h1Text, head: g.head.slice(0, 40) }));
      check(`1c ${label}: the page's scroller ends where the panel begins`, !!g.dock && !!g.sc && g.sc.r === g.dock.l, JSON.stringify({ sc: g.sc, dock: g.dock }));
      await shot(page, `beside-1-${label.replace(/\W+/g, '-').toLowerCase()}`);
    }

    console.log('\n2 · Home\'s divider');
    await toSettings('you'); await page.waitForTimeout(300);
    let g = await geo();
    check('2a the divider sits on the panel\'s left edge and is really painted', !!g.grip && g.grip.painted && !!g.dock && Math.abs(g.grip.x - g.dock.l) <= 10, JSON.stringify(g.grip));
    const w0 = g.dock ? g.dock.w : 0;
    check('2b where nobody has chosen, the panel is Home\'s resting width', w0 === await page.evaluate(() => IG_DOCK_W0), String(w0));
    if (g.grip) {
      await page.mouse.move(g.grip.x, g.grip.y); await page.mouse.down();
      await page.mouse.move(g.grip.x - 60, g.grip.y, { steps: 4 }); await page.mouse.move(g.grip.x - 140, g.grip.y, { steps: 4 });
      const mid = await geo(); await page.mouse.up();
      const after = await geo();
      check('2c a drag left widens the panel by what the pointer moved', !!after.dock && Math.abs(after.dock.w - (w0 + 140)) <= 3 && Math.abs(after.dock.l - (g.dock.l - 140)) <= 3,
        JSON.stringify({ before: w0, during: mid.dock && mid.dock.w, after: after.dock && after.dock.w }));
      const stored = await page.evaluate(() => Number(localStorage.getItem(IG_SPLIT_KEY)));
      check('2d the width is Home\'s own stored width', stored === after.dock.w, `${stored} stored`);
      await page.evaluate(() => hbOpenContracts());
      const home = await until(() => { const d = document.getElementById('ig-dock'); return d && d.offsetWidth > 100 ? d.offsetWidth : null; });
      check('2e Home\'s panel opens at the same width', home === after.dock.w, `${home} on Home, ${after.dock.w} beside Settings`);
      await toSettings('you'); await page.waitForTimeout(300);
      g = await geo();
      check('2f back on Settings it is still that width', !!g.dock && g.dock.w === after.dock.w, String(g.dock && g.dock.w));
      await page.mouse.dblclick(g.grip.x, g.grip.y); await page.waitForTimeout(150);
      g = await geo();
      check('2g a double-click puts it back to the resting width', !!g.dock && g.dock.w === w0, String(g.dock && g.dock.w));
      await page.focus('#page-dock-rz'); await page.keyboard.press('ArrowLeft'); await page.waitForTimeout(100);
      const k = await geo();
      check('2h the arrow steps it (left widens)', !!k.dock && k.dock.w > w0, `${w0} → ${k.dock && k.dock.w}`);
      await page.mouse.move(k.grip.x, k.grip.y); await page.mouse.down(); await page.mouse.move(k.win[0] - 5, k.grip.y, { steps: 6 }); await page.mouse.up();
      const lo = await geo();
      check('2i dragged to the right edge it stops at its floor and the grip says so', !!lo.dock && lo.dock.w === await page.evaluate(() => IG_DOCK_MIN) && lo.grip.limit === 'min', JSON.stringify({ w: lo.dock && lo.dock.w, limit: lo.grip && lo.grip.limit }));
      await page.mouse.move(lo.grip.x, lo.grip.y); await page.mouse.down(); await page.mouse.move(5, lo.grip.y, { steps: 6 }); await page.mouse.up();
      const hi = await geo();
      check('2j dragged to the left the page keeps its floor and the grip says so', !!hi.dock && hi.dock.l === await page.evaluate(() => IG_LEFT_MIN) && hi.grip.limit === 'max', JSON.stringify({ left: hi.dock && hi.dock.l, limit: hi.grip && hi.grip.limit }));
      await page.evaluate(() => { try { localStorage.removeItem(IG_SPLIT_KEY); } catch (_) {} pageDockFit(); });
    }

    console.log('\n3 · an iPad finger');
    g = await geo();
    if (g.grip) {
      const cdp = await ctx.newCDPSession(page);
      const touch = (type, x) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y: g.grip.y }] });
      await touch('touchStart', g.grip.x); await touch('touchMove', g.grip.x - 50); await touch('touchMove', g.grip.x - 100); await touch('touchEnd');
      await page.waitForTimeout(150);
      const t = await geo();
      check('3a a finger drag widens the panel too', !!t.dock && Math.abs(t.dock.w - (w0 + 100)) <= 4, `${w0} → ${t.dock && t.dock.w}`);
      await page.evaluate(() => { try { localStorage.removeItem(IG_SPLIT_KEY); } catch (_) {} pageDockFit(); });
    } else check('3a a finger drag widens the panel too (no divider to drag)', false);

    console.log('\n4 · the page scrolls, the panel holds still');
    await toSettings('company'); await page.waitForTimeout(300);
    const s0 = await geo();
    await page.evaluate(() => { document.getElementById('content-scroll').scrollTop = 600; });
    await page.waitForTimeout(250);
    const s1 = await page.evaluate(() => ({ top: document.getElementById('content-scroll').scrollTop, dock: (() => { const d = document.getElementById('page-dock'); if (!d) return null; const b = d.getBoundingClientRect(); return [Math.round(b.top), Math.round(b.bottom)]; })(),
      band: Math.round(document.querySelector('#set-page .st-tabs').getBoundingClientRect().top - document.getElementById('content-scroll').getBoundingClientRect().top) }));
    check('4a the page scrolled in its own scroller and the panel did not move', s1.top > 0 && !!s0.dock && !!s1.dock && s1.dock[0] === s0.dock.t && s1.dock[1] === s0.dock.b, JSON.stringify({ s1, was: s0.dock }));
    check('4b the band with the name and the tabs is still pinned at the top', s1.band === 0, String(s1.band));

    console.log('\n5 · leaving the page takes the panel down');
    await page.evaluate(() => setView('approvals'));
    const gone = await until(() => { const d = document.getElementById('page-dock'); return d && d.hidden && !document.getElementById('st-side') && !document.getElementById('mig-side') ? true : null; });
    const here = await page.evaluate(() => (typeof aiEmbeddedHere === 'function' ? aiEmbeddedHere() : 'none'));
    const grid = await page.evaluate(() => document.getElementById('body-grid').style.gridTemplateColumns);
    check('5a nothing of the panel stays on the next page, the room is one column again', !!gone && grid === '1fr', `hidden ${!!gone}, columns "${grid}"`);
    check('5b the bar\'s Jambo is no longer sent to the Settings panel', here !== 'settings', String(here));

    console.log('\n6 · the owner\'s three screens');
    for (const [w, hh] of [[1440, 780], [1536, 730], [1366, 950]]) {
      await page.setViewportSize({ width: w, height: hh });
      for (const [label, go] of [['Settings', () => toSettings('you')], ['Import', toImport]]) {
        await go(); await page.waitForTimeout(350);
        const f = await geo();
        check(`6 ${label} at ${w}×${hh}: the panel to the top and foot, the page beside it, nothing sideways`,
          !!f.dock && f.dock.t === f.grid.t && f.dock.b === hh && f.dock.r === w && !!f.h1 && f.h1.r <= f.dock.l && !f.sideways, JSON.stringify({ dock: f.dock, h1: f.h1, sideways: f.sideways }));
        await shot(page, `beside-6-${label.toLowerCase()}-${w}x${hh}`);
      }
    }
    check('no console errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } catch (e) {
    check('the run finished', false, e && e.message);
  } finally {
    await browser.close(); await h.stop();
    console.log(failures ? `\n${failures} FAILED` : '\nALL PASS');
    process.exit(failures ? 1 : 0);
  }
})();
