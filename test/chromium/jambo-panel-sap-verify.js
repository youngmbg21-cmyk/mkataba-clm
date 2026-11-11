/* Chromium verification: THE SAP WAY — ONE TOOLBAR UNDER A JAMBO ANSWER
   =====================================================================
   The owner, 10 Nov 2026: "the jambo panel seems extremely crowed due to the extra features like the added drop
   downs to the panel to support navigation. They are fine but they need to be more clean and structured." Three
   drawings were shown; the owner picked "The SAP way" by name.

   As drawn: the controls that stood loose under an answer — the reading chips, the checked next steps, Explain
   this view, Pin this finding, Copy picture, Open on paper, Show on the Board, Open list, Export — are ONE
   bordered toolbar with three LABELLED rows: Understood (the chips that correct what Jambo read), Next (his
   checked next steps) and Open (ONE filled button, everything else under More).

   Measured here, on the real page: the toolbar is drawn once under the answer; its three rows are labelled and in
   order; the rare acts are NOT on the panel until More is pressed; the same press closes it again, and so do Esc
   and a press outside; every row stays INSIDE the panel (nothing spills sideways) at the owner's three screens;
   and the panel is shorter than it was — the controls take fewer lines.

   Red at the parent: there is no .igd-sap toolbar at all, so 1a onward fail.

   Screenshots go to test/chromium/shots/jambo-panel-sap/ (or HATI_SHOT_DIR).
   Run: node test/chromium/jambo-panel-sap-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, startScriptedAi, seedWorkspace, fixtureContract } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'jambo-panel-sap');
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
  const until = async (fn, arg, ms = 10000) => { let v; const t0 = Date.now();
    while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
    return v; };
  const ask = async q => { const n = await page.evaluate(() => intel.history.length);
    await page.evaluate(() => { if (typeof pdTalkShows === 'function' && pdTalkShows() && typeof pdTalkBack === 'function') pdTalkBack(); });
    await page.evaluate(w => intelAsk(w), q);
    await until(k => !intel.busy && intel.history.length >= k + 2, n); await page.waitForTimeout(400); };
  /* what the toolbar looks like on the page: its rows, their labels, and what can actually be seen */
  const bar = () => page.evaluate(() => {
    const T = [...document.querySelectorAll('#ig-dock .igd-sap')].slice(-1)[0];
    if (!T) return null;
    const vis = el => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el);
      return r.width > 0 && r.height > 0 && s.display !== 'none' && s.visibility !== 'hidden'; };
    const R = [...T.querySelectorAll('.igd-sap-r')];
    const box = T.getBoundingClientRect(), panel = (document.getElementById('ig-dock') || T).getBoundingClientRect();
    return {
      n: document.querySelectorAll('#ig-dock .igd-sap').length,
      rows: R.map(r => r.getAttribute('data-ig-sap-r')),
      labels: R.map(r => (r.querySelector('.igd-sap-l') || {}).textContent || ''),
      lead: T.querySelectorAll('.ui-btn-primary').length,
      more: !!T.querySelector('[data-ig-sap-more]'),
      menuOpen: !!T.querySelector('.igd-sap-menu.is-open'),
      rareSeen: ['[data-ig-tour-open]', '[data-ig-pin-open]', '[data-ig-pic]'].filter(s => { const e = T.querySelector(s); if (!e || !vis(e)) return false;
        const r = e.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight; }),
      rareThere: ['[data-ig-tour-open]', '[data-ig-pin-open]', '[data-ig-pic]'].filter(s => !!T.querySelector(s)),
      spill: box.right > panel.right + 1 || box.left < panel.left - 1 || T.scrollWidth > T.clientWidth + 1,
      inside: Math.round(box.left - panel.left),
      lines: Math.round(box.height)
    };
  });
  try {
  await page.goto(h.base + '/', { waitUntil: 'networkidle' });
  await page.fill('#li-email', 'admin@example.co.ke');
  await page.fill('#li-pass', 'adminpassword1');
  await page.click('#li-go');
  await page.waitForFunction(() => window.state && state.contracts && state.contracts.some(c => c.id === 'MK-S7'), null, { timeout: 20000 });
  await until(() => state.view === 'dashboard' && !document.body.classList.contains('pre-auth'));
  await page.evaluate(() => { try { const p = JSON.parse(localStorage.getItem('hati.v1.prefs') || '{}'); p.newLook = true; localStorage.setItem('hati.v1.prefs', JSON.stringify(p)); } catch (_){}
    state.aiConfigured = true; intel.cam = null; intel.tab = 'map'; setView('dashboard'); hbSetFace('explorer'); });
  await until(() => typeof hbFace === 'function' && hbFace() === 'explorer' && !!document.getElementById('igd-input'));
    await ask('group by value stream and only include the top 2 value streams by value');

    console.log('\n1 · ONE TOOLBAR, THREE LABELLED ROWS');
    const B = await bar();
    check('1a one toolbar is drawn under the answer', !!B && B.n === 1, JSON.stringify(B && { n: B.n, rows: B.rows }));
    check('1b its rows are Understood · Next · Open, in that order, each labelled',
      !!B && B.rows.join('>') === 'understood>next>open' && B.labels.every(x => x.trim().length), JSON.stringify(B && B.labels));
    check('1c one filled button, and a More beside it', !!B && B.lead === 1 && B.more, JSON.stringify(B && { lead: B.lead, more: B.more }));

    console.log('\n2 · THE RARE ACTS ARE UNDER MORE');
    check('2a Explain this view, Pin this finding and Copy picture are in the page but not on the panel',
      !!B && B.rareThere.length === 3 && B.rareSeen.length === 0, JSON.stringify(B && { there: B.rareThere.length, seen: B.rareSeen }));
    await page.click('#ig-dock [data-ig-sap-more]'); await page.waitForTimeout(250);
    const B2 = await bar();
    check('2b one press opens More and every one of them can be seen',
      !!B2 && B2.menuOpen && B2.rareSeen.length === 3, JSON.stringify(B2 && { open: B2.menuOpen, seen: B2.rareSeen.length }));
    for (const [w, hh] of SCREENS){ await page.setViewportSize({ width: w, height: hh }); await page.waitForTimeout(350); await page.screenshot({ path: path.join(OUT, `sap-more-open-${w}x${hh}.png`) }); }
    await page.setViewportSize({ width: 1440, height: 780 }); await page.waitForTimeout(300);
    await page.click('#ig-dock [data-ig-sap-more]'); await page.waitForTimeout(250);
    check('2c the same press closes it again', !((await bar()) || {}).menuOpen, 'shut');
    await page.click('#ig-dock [data-ig-sap-more]'); await page.waitForTimeout(200);
    await page.keyboard.press('Escape'); await page.waitForTimeout(250);
    check('2d Escape closes it', !((await bar()) || {}).menuOpen, 'shut');
    await page.click('#ig-dock [data-ig-sap-more]'); await page.waitForTimeout(200);
    await page.click('#ig-dock .igd-head, #ig-dock'); await page.waitForTimeout(250);
    check('2e a press outside closes it', !((await bar()) || {}).menuOpen, 'shut');

    console.log('\n3 · NOTHING SPILLS, AT THE OWNER\'S THREE SCREENS');
    const spills = [];
    for (const [w, hh] of SCREENS){
      await page.setViewportSize({ width: w, height: hh }); await page.waitForTimeout(350);
      const S = await bar(); if (!S || S.spill || S.inside < 0) spills.push(`${w}x${hh}: ${JSON.stringify(S && { spill: S.spill, inside: S.inside })}`);
      await page.screenshot({ path: path.join(OUT, `sap-toolbar-${w}x${hh}.png`) });
    }
    check('3a the toolbar stays inside Jambo\'s panel and scrolls nowhere sideways', spills.length === 0, spills.join(' | ') || 'all three clean');
    check('3b and it is one compact block, not a stack of loose lines', !!B && B.lines > 0 && B.lines <= 220, B && B.lines + 'px tall');
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
