/* Chromium verification: ONE ROW — EXPLORER'S JAMBO PANEL
   =======================================================
   The owner, 11 Nov 2026, of the three layouts drawn on 10 November: "for the explorer, build one row."

   The NEWEST answer carries ONE row: the chips that correct what Jambo read, the one filled button, and ⋯ for
   everything else (the next steps, the other doors, Explain this view, Pin this finding, Copy picture, and the
   line saying where it was read). The answers ABOVE it keep every word Jambo said and lose only their controls
   — the owner picked "Keep the words" over folding them away, so the conversation is still drawn. It is the
   panel's ONE layout: the three-row toolbar of 10 November is retired, so the Board draws the same row (8).

   Red at the parent: the panel draws the three labelled rows under EVERY answer, and there is no ⋯.

   Screenshots go to test/chromium/shots/jambo-one-row/ (or HATI_SHOT_DIR).
   Run: node test/chromium/jambo-one-row-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, startScriptedAi, seedWorkspace, fixtureContract } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'jambo-one-row');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const SCREENS = [[1440, 780], [1536, 730], [1366, 950]];
const ST = ['proc', 'proc', 'proc', 'sales', 'sales', 'mfg'];
const BOOK = Array.from({ length: 30 }, (_, i) => fixtureContract('MK-S' + i,
  ['Freight Services', 'Retail Supply', 'Component Supply'][i % 3] + ' ' + i,
  ['Kipande', 'Savanna', 'Mvua', 'Tausi'][i % 4], ST[i % 6], ((i * 41) % 90 + 5) * 1e6,
  ['Signed', 'Signed', 'Under Review', 'Draft'][i % 4]));

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass, detail: detail == null ? '' : String(detail) });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const ai = await startScriptedAi();
  const h = await startHati({ ANTHROPIC_BASE_URL: ai.base, HATI_AGENTS_AUTO: 'off' });
  await seedWorkspace(h, { contracts: BOOK, approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message + ' @ ' + String(e.stack || '').split('\n').slice(1, 3).join(' ')));
  const until = async (fn, arg, ms = 12000) => { let v; const t0 = Date.now();
    while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
    return v; };
  const ask = async q => { const n = await page.evaluate(() => intel.history.length);
    await page.evaluate(() => { if (typeof pdTalkShows === 'function' && pdTalkShows() && typeof pdTalkBack === 'function') pdTalkBack(); });
    await page.evaluate(w => intelAsk(w), q);
    await until(k => !intel.busy && intel.history.length >= k + 2, n); await page.waitForTimeout(400); };
  /* the panel as a reader sees it: the folded lines, the one row, and what the ⋯ holds */
  const panel = () => page.evaluate(() => {
    const vis = el => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el);
      return r.width > 0 && r.height > 0 && s.display !== 'none' && s.visibility !== 'hidden'; };
    const R = [...document.querySelectorAll('#ig-dock .igd-one')].slice(-1)[0];
    const dock = document.getElementById('ig-dock');
    const box = R ? R.getBoundingClientRect() : null, dr = dock ? dock.getBoundingClientRect() : null;
    return {
      rows: document.querySelectorAll('#ig-dock .igd-one').length,
      folds: document.querySelectorAll('#ig-dock .igd-fold').length,
      sap: document.querySelectorAll('#ig-dock .igd-sap, #ig-dock [data-ig-sap-r]').length,
      said: [...document.querySelectorAll('#ig-dock .jl-bub')].map(b => b.textContent.replace(/\s+/g, ' ').trim().slice(0, 40)),
      bubbles: document.querySelectorAll('#ig-dock .ig-bub-me').length,
      chips: R ? R.querySelectorAll('.hb-rd-chip').length : 0,
      lead: R ? R.querySelectorAll('.ui-btn-primary').length : 0,
      dots: !!(R && R.querySelector('.igd-one-more')),
      menuOpen: !!(R && R.querySelector('.igd-more-menu.is-open')),
      under: R ? ['[data-ig-mrnext]', '[data-ig-board-go]', '[data-ig-list]', '[data-ig-tour-open]', '[data-ig-pin-open]', '[data-ig-pic]', '.igd-src']
        .filter(s => !!R.querySelector('.igd-more-menu ' + s)) : [],
      underSeen: R ? [...R.querySelectorAll('.igd-more-menu > *')].filter(vis).length : 0,
      h: box ? Math.round(box.height) : 0,
      spill: !!(box && dr && (box.right > dr.right + 1 || box.left < dr.left - 1)),
      sideways: document.documentElement.scrollWidth - innerWidth
    };
  });
  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForFunction(() => window.state && state.contracts && state.contracts.some(c => c.id === 'MK-S7'), null, { timeout: 20000 });
    await until(() => state.view === 'dashboard' && !document.body.classList.contains('pre-auth'));
    await page.evaluate(async () => { try { await stPrefSet('newLook', true); } catch (_){ } try { newLookApply(); } catch (_){ }
      state.aiConfigured = true; intel.cam = null; intel.tab = 'map'; setView('dashboard'); hbSetFace('explorer'); });
    await until(() => typeof hbFace === 'function' && hbFace() === 'explorer' && !!document.getElementById('igd-input'));
    await ask('top 5 counterparties by value');
    await ask('show suppliers only, grouped by payment terms');
    await ask('group by value stream and only include the top 2 value streams by value');

    console.log('\n1 · THE NEWEST ANSWER CARRIES ONE ROW');
    const P = await panel();
    check('1a one row under the newest answer, and no three-row toolbar on Explorer', !!P && P.rows === 1 && P.sap === 0, JSON.stringify(P && { rows: P.rows, sap: P.sap }));
    check('1b the chips, the one filled button and ⋯ are all on it', !!P && P.chips >= 1 && P.lead === 1 && P.dots, JSON.stringify(P && { chips: P.chips, lead: P.lead, dots: P.dots }));
    check('1c and it is a row, not a stack', !!P && P.h > 0 && P.h <= 80, P && P.h + 'px tall');

    console.log('\n2 · THE ANSWERS ABOVE IT KEEP EVERY WORD');
    check('2a all three questions are on the panel, and nothing is folded away',
      !!P && P.bubbles === 3 && P.folds === 0, JSON.stringify(P && { bubbles: P.bubbles, folds: P.folds }));
    check('2b what Jambo said to each of them is still drawn', !!P && P.said.length === 3 && P.said.every(t => t.length > 10), JSON.stringify(P && P.said));
    check('2c and only the newest carries a row of controls', !!P && P.rows === 1, JSON.stringify(P && { rows: P.rows }));
    for (const [w, hh] of SCREENS){ await page.setViewportSize({ width: w, height: hh }); await page.waitForTimeout(350); await page.screenshot({ path: path.join(OUT, `one-row-${w}x${hh}.png`) }); }
    await page.setViewportSize({ width: 1440, height: 780 }); await page.waitForTimeout(300);
    const C = P;

    console.log('\n4 · ⋯ HOLDS EVERYTHING ELSE');
    check('4a nothing of the menu is on the panel while it is shut', !!C && !C.menuOpen && C.underSeen === 0, JSON.stringify(C && { open: C.menuOpen, seen: C.underSeen }));
    check('4b the next steps, the other doors, Explain · Pin · Copy picture and the source line are all in it',
      !!C && C.under.includes('[data-ig-tour-open]') && C.under.includes('[data-ig-pin-open]') && C.under.includes('[data-ig-pic]') && C.under.includes('.igd-src'),
      JSON.stringify(C && C.under));
    await page.click('#ig-dock .igd-one-more'); await page.waitForTimeout(300);
    const M = await panel();
    check('4c one press opens it and every row of it can be seen', !!M && M.menuOpen && M.underSeen > 0, JSON.stringify(M && { open: M.menuOpen, seen: M.underSeen }));
    await page.screenshot({ path: path.join(OUT, 'one-row-more-open.png') });
    await page.click('#ig-dock .igd-one-more'); await page.waitForTimeout(250);
    check('4d the same press closes it', !((await panel()) || {}).menuOpen, 'shut');

    console.log('\n5 · AND EVERY ROW OF IT IS PAINTED, ON ALL THREE SCREENS');
    /* A RECT IS NOT A PAINTED PIXEL (the house rule, and the fault it caught on 11 Nov 2026: the menu hung off
       the ⋯ ran out past the panel, where the feed's scroller clipped it — three of its rows were never painted
       although every rect said otherwise). elementFromPoint asks the browser what a reader would actually hit. */
    const menu = () => page.evaluate(() => {
      const m = document.querySelector('#ig-dock .igd-more-menu.is-open'); if (!m) return { open: false };
      const r = m.getBoundingClientRect(), d = document.getElementById('ig-dock').getBoundingClientRect();
      const rows = [...m.children].map(c => { const q = c.getBoundingClientRect();
        const hit = document.elementFromPoint(Math.round(q.left + q.width / 2), Math.round(q.top + q.height / 2));
        return { t: c.textContent.trim().slice(0, 26), painted: !!(hit && m.contains(hit)) }; });
      return { open: true, inside: r.left >= d.left - 1 && r.right <= d.right + 1 && r.top >= d.top - 1 && r.bottom <= d.bottom + 1,
        rows: rows.length, unpainted: rows.filter(x => !x.painted).map(x => x.t) };
    });
    const cut = [];
    for (const [w, hh] of SCREENS){
      await page.setViewportSize({ width: w, height: hh }); await page.waitForTimeout(350);
      await page.evaluate(() => { if (typeof intel !== 'undefined' && intel.moreOpen){ intel.moreOpen = null; renderIntelDock(); } });
      await page.waitForTimeout(200);
      await page.click('#ig-dock .igd-one-more'); await page.waitForTimeout(350);
      const M = await menu();
      if (!M.open || !M.inside || M.unpainted.length) cut.push(`${w}x${hh}: ${JSON.stringify(M)}`);
      await page.screenshot({ path: path.join(OUT, `one-row-more-${w}x${hh}.png`) });
    }
    check('4e the menu stands inside the panel and every row of it is painted, at all three screens', cut.length === 0, cut.join(' | ') || 'all three clean');

    /* IT IS THERE THE MOMENT IT IS PRESSED (owner, 11 Nov 2026: "the drop down ... not appearing and only
       flashing"): a press used to repaint the whole panel, which GLIDES — and a menu measured mid-glide was
       placed 700px clear of the screen, coming back only when the glide ended. Opening a menu now redraws the
       one row (or the one chip group) where it stands, so it is painted in its final place on the first frame.
       Red at the parent: the menu is off the panel, or invisible, until the glide has finished. */
    const frame = async () => { await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))); };
    const chipMenu = () => page.evaluate(() => {
      const m = document.querySelector('#ig-dock .hb-rd-wrap .hb-rd-menu'); if (!m) return { open: false };
      const r = m.getBoundingClientRect(), d = document.getElementById('ig-dock').getBoundingClientRect();
      const rows = [...m.querySelectorAll('button')].map(c => { const q = c.getBoundingClientRect();
        const hit = document.elementFromPoint(Math.round(q.left + q.width / 2), Math.round(q.top + q.height / 2));
        return { t: c.textContent.trim().slice(0, 26), painted: !!(hit && m.contains(hit)) }; });
      return { open: true, seen: getComputedStyle(m).visibility === 'visible',
        inside: r.left >= d.left - 1 && r.right <= d.right + 1 && r.top >= d.top - 1 && r.bottom <= d.bottom + 1,
        rows: rows.length, unpainted: rows.filter(x => !x.painted).map(x => x.t) };
    });
    const flash = [];
    for (const [w, hh] of SCREENS){
      await page.setViewportSize({ width: w, height: hh }); await page.waitForTimeout(350);
      await page.evaluate(() => { if (typeof intel !== 'undefined'){ intel.moreOpen = null; intel.mrOpen = null; renderIntelDock(); } });
      await page.waitForTimeout(250);
      const chip = page.locator('#ig-dock [data-ig-mr]').locator('visible=true').first();
      if (!await chip.count()){ flash.push(`${w}x${hh}: no chip`); continue; }
      await chip.click(); await frame();
      const C1 = await chipMenu();
      if (!C1.open || !C1.seen || !C1.inside || C1.unpainted.length) flash.push(`${w}x${hh} chip: ${JSON.stringify(C1)}`);
      await page.screenshot({ path: path.join(OUT, `chip-menu-${w}x${hh}.png`) });
      await page.keyboard.press('Escape'); await page.waitForTimeout(250);
      await page.click('#ig-dock .igd-one-more'); await frame();
      const D1 = await menu();
      if (!D1.open || !D1.inside || D1.unpainted.length) flash.push(`${w}x${hh} dots: ${JSON.stringify(D1)}`);
      await page.keyboard.press('Escape'); await page.waitForTimeout(200);
    }
    check('4f a chip\'s menu and the ⋯ are painted in their final place on the first frame — no flash', flash.length === 0,
      flash.join(' | ') || 'both menus, all three screens, first frame');
    await page.evaluate(() => { if (typeof intel !== 'undefined' && intel.moreOpen){ intel.moreOpen = null; renderIntelDock(); } });
    await page.setViewportSize({ width: 1440, height: 780 }); await page.waitForTimeout(300);

    console.log('\n9 · NOTHING SPILLS');
    const spills = [];
    for (const [w, hh] of SCREENS){
      await page.setViewportSize({ width: w, height: hh }); await page.waitForTimeout(350);
      const S = await panel(); if (!S || S.spill || S.sideways > 0) spills.push(`${w}x${hh}: ${JSON.stringify(S && { spill: S.spill, sideways: S.sideways })}`);
    }
    check('9a the row stays inside Jambo\'s panel at the owner\'s three screens, and the page never scrolls sideways', spills.length === 0, spills.join(' | ') || 'all three clean');
    console.log('\n6 · THE SOURCE LINE IS IN ⋯, AND SAID ONCE');
    await page.setViewportSize({ width: 1440, height: 780 }); await page.waitForTimeout(300);
    await page.evaluate(() => { if (typeof intel !== 'undefined' && intel.moreOpen){ intel.moreOpen = null; renderIntelDock(); } });
    await page.waitForTimeout(250);
    const S = await page.evaluate(() => {
      const R = [...document.querySelectorAll('#ig-dock .igd-one')].slice(-1)[0]; const turn = R && R.closest('.jb-turn');
      const src = R ? R.querySelector('.igd-src') : null;
      const vis = el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).display !== 'none'; };
      return { there: !!src, inMenu: !!(src && src.closest('.igd-more-menu')), press: !!(src && src.closest('button')),
        seen: !!(src && vis(src)), all: turn ? turn.querySelectorAll('[data-ai-read]').length : -1 };
    });
    check('6a the source line is a row of ⋯, a line and not a press', !!S && S.there && S.inMenu && !S.press, JSON.stringify(S));
    check('6b it is said once, and not under the answer while ⋯ is shut', !!S && S.all === 1 && !S.seen, JSON.stringify(S));

    console.log('\n7 · THE PAGE LINKS RIDE THE WAY-BACK LINE');
    const W = await page.evaluate(() => {
      const foot = document.querySelector('#ig-dock .igd-foot'); if (!foot) return null;
      const door = foot.querySelector('.jb-door:not([hidden])'), ways = door && door.querySelector('.jb-ways');
      const bin = door && door.querySelector('.jb-bin'), back = door && door.querySelector('.jb-door-back');
      const r = ways && ways.getBoundingClientRect(), br = back && back.getBoundingClientRect(), nr = bin && bin.getBoundingClientRect();
      return { door: !!door, links: ways ? [...ways.querySelectorAll('[data-jb-way]')].map(b => b.textContent.trim()) : [],
        own: [...document.querySelectorAll('#ig-dock .jb-ways.is-above-foot')].filter(e => e.getBoundingClientRect().height > 0).length,
        sameLine: !!(r && br) && Math.abs(Math.round(r.top - br.top)) <= 14, beforeBin: !!(r && nr) && r.right <= nr.left + 1 };
    });
    check('7a the links stand on the way-back line, after the back and before the bin',
      !!W && W.door && W.links.length >= 1 && W.sameLine && W.beforeBin, JSON.stringify(W));
    check('7b and never in a row of their own above the box', !!W && W.own === 0, JSON.stringify(W && { own: W.own }));

    console.log('\n8 · THE BOARD DRAWS THE SAME ROW');
    ai.reset(); ai.script([{ type: 'tool_use', id: 'tu_b', name: 'render_graph', input: { note: 'Value by stream', answer: '',
      actions: [{ do: 'add_card', which: { all: true }, recipe: { pic: 'bars', split: { by: 'folder' }, measure: 'value' }, title: 'Value by stream' }] } }]);
    await page.evaluate(() => { hbSetFace('board'); });
    await until(() => typeof hbFace === 'function' && hbFace() === 'board' && !!document.getElementById('igd-input'));
    await ask('chart value by stream');
    const B = await panel();
    check('8a the Board draws one row too, and no three-row toolbar anywhere', !!B && B.rows === 1 && B.sap === 0, JSON.stringify(B && { rows: B.rows, sap: B.sap }));
    check('8b and its earlier answer keeps its words, with no row of its own', !!B && B.rows === 1 && B.bubbles >= 2 && B.folds === 0, JSON.stringify(B && { rows: B.rows, bubbles: B.bubbles, folds: B.folds }));
    await page.screenshot({ path: path.join(OUT, 'one-row-board.png') });

    check('F no page errors', errors.length === 0, errors.slice(0, 3).join(' | ') || 'none');
  } catch (e) {
    check('the run stopped', false, String(e && e.message || e).slice(0, 200));
  } finally {
    await browser.close(); await h.stop(); await ai.stop();
  }
  const bad = results.filter(r => !r.pass);
  console.log(`\n${bad.length ? bad.length + ' FAILED' : 'ALL PASSED'}`);
  process.exit(bad.length ? 1 : 0);
})();
