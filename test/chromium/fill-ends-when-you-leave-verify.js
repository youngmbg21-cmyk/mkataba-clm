/* Chromium verification: FILL IN ENDS WHEN YOU LEAVE IT, AND THE EDITOR'S DIVIDER MOVES (owner, 26 Nov 2026)
   ============================================================
   "sometimes the highlighted top bar changes to a different bar that has completely different buttons" — Fill in on
   the paper's own bar (name · Stop · Save) stood in for the paper's line until Stop or Save, across tabs, pages and a
   refresh. Then: "if nothing was filled in, then you just move on. If something started and was filled in, a pop up
   appears in the middle of the screen asking stop or save". And: "the divider in the editor tab does not allow for
   minimizing and expansion like all other panels".
     1. nothing typed, another tab: Fill in ends, its bar gone, the paper's line back
     2. something typed, another page: ONE question in the middle; Esc does not close it; Stop ends Fill in, nothing kept
     3. something typed, another tab: the question; Save keeps what was typed and ends Fill in
     4. a refresh standing on Fill in lands on the paper with Fill in put away
     5. the Editor tab's divider is the Dossier's own: a drag widens and narrows the side, the Dossier panel takes the same
        width, and the writing bar ends at the panel's edge
     6. no page errors
   Red at the parent: 1–4 (the bar stayed), 5 (the side did not move). Waits ask for the state, bounded.
   Run: node test/chromium/fill-ends-when-you-leave-verify.js */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let failures = 0;
const check = (name, pass, detail) => {
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
  if (!pass) failures++;
};

(async () => {
  const h = await startHati();
  await seedWorkspace(h, { approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const page = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
    page.on('pageerror', e => errors.push(e.message));
    const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
      while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
      return v; };
    const signIn = async () => {
      await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go'); };
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await signIn();
    await until(() => window.state && state.view === 'dashboard' && typeof roomHomeLand === 'function' && typeof pd2FillStart === 'function' && state.contracts.length > 0, null, 20000);
    const ID = await page.evaluate(() => { const c = state.contracts.find(x => x && !x.archived && typeof pdEdTabOn === 'function' && pdEdTabOn(x)); return c ? c.id : null; });
    check('0. a contract to fill in and edit', !!ID, String(ID));
    const st = () => page.evaluate(id => ({ head: !!document.getElementById('pd2-fill-head'), on: !!pd2FillOn(id),
      strip: (() => { const s = document.getElementById('ig-strip'); return !!(s && getComputedStyle(s).display !== 'none'); })(),
      ask: (document.querySelector('#modal-root .lgp-h') || {}).textContent || '', x: !!document.querySelector('#modal-root .lgp-x') }), ID);
    const open = async () => { await page.evaluate(id => roomHomeLand(id, { open: true }), ID);
      await until(id => window.intel && intel.paper && String(intel.paper.id) === id && !!document.getElementById('ig-canvas'), ID); await page.waitForTimeout(600);
      await page.evaluate(() => { pdSetTab('copilot'); renderIntelDock(); }); await page.waitForTimeout(300); };
    const startFill = async () => { const ok = await page.evaluate(id => pd2FillStart(id, ''), ID); await until(() => !!document.getElementById('pd2-fill-head')); return ok; };
    const typeIn = async words => { const k = await page.evaluate(() => { const b = document.querySelector('#ig-canvas input[type=text][data-pd2-bl]'); if (!b) return null; b.focus(); b.value = ''; return b.getAttribute('data-pd2-bl'); });
      if (k) { await page.keyboard.type(words); await page.waitForTimeout(250); } return k; };

    /* 1 */
    await open(); const s1 = await startFill();
    check('1a. Fill in starts on the paper (its own bar)', s1 && (await st()).head);
    await page.evaluate(() => { pdSetTab('doc'); renderIntelDock(); });
    const g1 = await until(id => !pd2FillOn(id) && !document.getElementById('pd2-fill-head'), ID);
    check('1. nothing typed, another tab: Fill in ends and its bar goes', !!g1, JSON.stringify(await st()));

    /* 2 */
    await open(); await startFill(); const k2 = await typeIn('Nairobi');
    check('2a. something typed in a blank', !!k2, String(k2));
    await page.evaluate(() => caGo({ kind: 'go', place: 'board' }));
    const asked2 = await until(() => !!document.querySelector('#modal-root [data-pd2-fl-save]'));
    check('2b. another page: one question in the middle, Save or Stop', !!asked2, (await st()).ask);
    check('2c. no corner cross that would close nothing', !(await st()).x);
    await page.keyboard.press('Escape'); await page.waitForTimeout(400);
    check('2d. Esc does not close it', !!(await page.evaluate(() => document.querySelector('#modal-root [data-pd2-fl-save]'))));
    const was2 = await page.evaluate(([id, k]) => String((getContract(id).fields || {})[k] || ''), [ID, k2]);
    await page.click('#modal-root [data-pd2-fl-stop]');
    const g2 = await until(id => !pd2FillOn(id) && !document.querySelector('#modal-root [data-pd2-fl-save]'), ID);
    const now2 = await page.evaluate(([id, k]) => String((getContract(id).fields || {})[k] || ''), [ID, k2]);
    check('2. Stop ends Fill in and keeps nothing typed', !!g2 && now2 === was2 && now2 !== 'Nairobi', `before "${was2}" · after "${now2}"`);

    /* 3 */
    await open(); await startFill(); await typeIn('Kept by Save');
    await page.evaluate(() => { pdSetTab('doc'); renderIntelDock(); });
    const asked3 = await until(() => !!document.querySelector('#modal-root [data-pd2-fl-save]'));
    check('3a. another tab with something typed: the question', !!asked3);
    await page.click('#modal-root [data-pd2-fl-save]');
    const g3 = await until(id => !pd2FillOn(id) && !document.querySelector('#modal-root [data-pd2-fl-save]'), ID);
    const v3 = await page.evaluate(id => JSON.stringify(getContract(id)).includes('Kept by Save') ? 'Kept by Save' : 'not on the record', ID);
    check('3. Save keeps what was typed and ends Fill in', !!g3 && v3 === 'Kept by Save', v3);

    /* 4 */
    await open(); await startFill();
    await page.reload({ waitUntil: 'networkidle' });
    if (await page.locator('#li-email').count()) await signIn();
    await until(id => window.intel && intel.paper && String(intel.paper.id) === id, ID, 15000); await page.waitForTimeout(2500);
    const s4 = await st();
    check('4. a refresh lands on the paper with Fill in put away', !s4.on && !s4.head && s4.strip, JSON.stringify(s4));

    /* 5 */
    await open();
    await page.evaluate(() => { pdSetTab('red'); renderIntelDock(); }); await page.waitForTimeout(800);
    await page.evaluate(() => { const t = document.querySelector('#ig-dock [data-pd-ed-tab]'); if (t) t.click(); });
    const ed = await until(() => { const p = document.getElementById('clause-editor'), z = document.getElementById('ce-tab-resizer');
      return p && p.classList.contains('is-tabbed') && z && z.getClientRects().length ? true : null; }, null, 10000);
    /* the grip is the Dossier's own (#ce-tab-resizer), the editor's own divider stands down */
    check('5a. the Editor tab is open with its divider', !!ed);
    const rail = () => page.evaluate(() => parseInt(document.getElementById('clause-editor').style.getPropertyValue('--ce-tab-rail'), 10) || 0);
    const grab = () => page.evaluate(() => { const r = document.getElementById('ce-tab-resizer').getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; });
    if (ed){
      const r0 = await rail(); let p = await grab();
      await page.mouse.move(p.x, p.y); await page.mouse.down(); await page.mouse.move(p.x - 120, p.y, { steps: 8 }); await page.mouse.up(); await page.waitForTimeout(400);
      const r1 = await rail(); p = await grab();
      await page.mouse.move(p.x, p.y); await page.mouse.down(); await page.mouse.move(p.x + 80, p.y, { steps: 8 }); await page.mouse.up(); await page.waitForTimeout(400);
      const r2 = await rail();
      check('5b. a drag to the left widens the side, to the right narrows it', r1 >= r0 + 100 && r2 <= r1 - 60, `${r0} → ${r1} → ${r2}`);
      const stored = await page.evaluate(() => Number(localStorage.getItem(window.IG_SPLIT_KEY || 'hati.v1.igDockW')));
      check('5c. the Dossier panel takes the same width', stored === r2, `stored ${stored} · side ${r2}`);
      const tie = await page.evaluate(() => { const b = document.querySelector('#clause-editor .ce-head').getBoundingClientRect(), r = document.querySelector('#clause-editor .ce-rail').getBoundingClientRect(); return { bar: Math.round(b.right), panel: Math.round(r.left) }; });
      check('5d. the writing bar ends at the panel\'s edge', Math.abs(tie.bar - tie.panel) <= 1, JSON.stringify(tie));
    }
    check('6. no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } finally {
    await browser.close(); await h.stop();
  }
  console.log(failures ? `\n${failures} FAILED` : '\nALL PASS');
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
