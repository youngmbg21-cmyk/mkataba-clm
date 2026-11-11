/* Chromium verification: ONE ROW — EXPLORER'S JAMBO PANEL
   =======================================================
   The owner, 11 Nov 2026, of the three layouts drawn on 10 November: "for the explorer, build one row."

   As drawn: Explorer's talk runs long, so the answers BEFORE the newest fold to one line each — the words you
   asked, and how many the answer put on the map — and the newest answer carries ONE row: the chips that correct
   what Jambo read, the one filled button, and ⋯ for everything else (the next steps, the other doors, Explain
   this view, Pin this finding, Copy picture, and the line saying where it was read). It is the panel's ONE
   layout: the three-row toolbar of 10 November is retired, so the Board draws the same row (section 6).

   Red at the parent: the panel draws the three labelled rows, nothing folds, and there is no ⋯.

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
    const folds = [...document.querySelectorAll('#ig-dock .igd-fold')];
    const dock = document.getElementById('ig-dock');
    const box = R ? R.getBoundingClientRect() : null, dr = dock ? dock.getBoundingClientRect() : null;
    return {
      rows: document.querySelectorAll('#ig-dock .igd-one').length,
      sap: document.querySelectorAll('#ig-dock .igd-sap, #ig-dock [data-ig-sap-r]').length,
      folds: folds.map(b => ({ q: (b.querySelector('.igd-fold-q') || {}).textContent || '', n: ((b.querySelector('.igd-fold-n') || {}).textContent || '').trim(), open: b.getAttribute('aria-expanded') === 'true' })),
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

    console.log('\n2 · THE ANSWERS BEFORE IT ARE ONE LINE EACH');
    check('2a the two earlier questions are folded, the newest keeps its bubble',
      !!P && P.folds.length === 2 && P.bubbles === 1, JSON.stringify(P && { folds: P.folds.map(f => f.q), bubbles: P.bubbles }));
    check('2b a folded line says the words you asked', !!P && /counterparties/.test(P.folds[0].q) && /payment terms/.test(P.folds[1].q), JSON.stringify(P && P.folds.map(f => f.q)));
    check('2c and how many that answer put on the map, where it drew a set', !!P && /\d+/.test(P.folds[0].n), JSON.stringify(P && P.folds.map(f => f.n)));
    for (const [w, hh] of SCREENS){ await page.setViewportSize({ width: w, height: hh }); await page.waitForTimeout(350); await page.screenshot({ path: path.join(OUT, `one-row-${w}x${hh}.png`) }); }
    await page.setViewportSize({ width: 1440, height: 780 }); await page.waitForTimeout(300);

    console.log('\n3 · A FOLDED ANSWER OPENS WHERE IT STANDS, AND FOLDS BACK');
    await page.click('#ig-dock [data-ig-fold]'); await page.waitForTimeout(300);
    const O = await panel();
    check('3a one press opens it and it says so', !!O && O.folds[0].open, JSON.stringify(O && O.folds.map(f => f.open)));
    await page.click('#ig-dock [data-ig-fold]'); await page.waitForTimeout(300);
    const C = await panel();
    check('3b the same press folds it back', !!C && !C.folds[0].open, JSON.stringify(C && C.folds.map(f => f.open)));

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

    console.log('\n5 · NOTHING SPILLS');
    const spills = [];
    for (const [w, hh] of SCREENS){
      await page.setViewportSize({ width: w, height: hh }); await page.waitForTimeout(350);
      const S = await panel(); if (!S || S.spill || S.sideways > 0) spills.push(`${w}x${hh}: ${JSON.stringify(S && { spill: S.spill, sideways: S.sideways })}`);
    }
    check('5a the row stays inside Jambo\'s panel at the owner\'s three screens, and the page never scrolls sideways', spills.length === 0, spills.join(' | ') || 'all three clean');
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
    check('8b and its earlier answers fold the same way', !!B && B.folds.length >= 1, JSON.stringify(B && { folds: B.folds.length }));
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
