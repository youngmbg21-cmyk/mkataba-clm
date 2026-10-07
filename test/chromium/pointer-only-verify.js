/* ON HOME THE POINTER ONLY POINTS, UNTIL YOU EXIT IT (Young, 7 Oct 2026,
   the one-build work order, part F — reverses the 6 Oct "hand over a button")
   ============================================================
   Present → Pointer, on the Board and then on Explorer:
     1. over a figure, the Board · Explorer tab and a card's button the computed
        cursor is none and the red dot is drawn at the mouse;
     2. a click on a figure opens nothing and changes no state (the dig-in
        path, the side of the screen, the page);
     3. the "Exit pointer" control brings the cursor back, and Escape does too;
     4. after exit a click works again.
   Every driven half is GUARDED — a build without the feature REPORTS.
   Screenshots: test/chromium/shots/pointer-only/ (or HATI_SHOT_DIR).
   Run: node test/chromium/pointer-only-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, FIXTURES } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'pointer-only');
fs.mkdirSync(OUT, { recursive: true });

let failures = 0;
const check = (ok, what, detail) => {
  console.log((ok ? '  ok  ' : '  FAIL') + ' — ' + what + (detail != null ? ` [${detail}]` : ''));
  if (!ok) failures++;
};
const until = async (page, fn, arg, ms = 8000) => {
  const t0 = Date.now();
  for (;;){
    let v = null;
    try{ v = await page.evaluate(fn, arg); }catch(_){ v = null; }
    if (v) return v;
    if (Date.now() - t0 > ms) return v;
    await new Promise(r => setTimeout(r, 120));
  }
};

/* where things are, measured BEFORE the pointer is on */
const spotsOf = page => page.evaluate(() => {
  const mid = el => { if (!el || !el.getClientRects().length) return null; const r = el.getBoundingClientRect();
    return r.width > 4 && r.height > 4 ? [Math.round(r.left + r.width / 2), Math.round(r.top + r.height / 2)] : null; };
  const fig = document.querySelector('#hb-board .hb-fig-main[data-hb-dig]') || document.querySelector('#hb-board [data-hb-dig]');
  const vis = sel => [...document.querySelectorAll(sel)].find(e => e.getClientRects().length && e.getBoundingClientRect().width > 4);
  const head = vis('[data-hb-face]');
  const dock = vis('#igd-input') || vis('#hb-board .hb-ins button, #hb-board [data-hb-ins]') || vis('#hb-board button[data-hb-act]');
  const cv = document.getElementById('ig-cv');
  return { fig: mid(fig), head: mid(head), dock: mid(dock), map: mid(cv) };
});
const stateNow = page => page.evaluate(() => JSON.stringify({ view: state.view, face: hbS().face, path: hbS().path || [],
  crumbs: document.querySelectorAll('[data-hb-crumb]').length, ws: state.currentId || null }));
const at = (page, xy) => page.evaluate(([x, y]) => {
  const el = document.elementFromPoint(x, y); const lz = document.getElementById('hb-laser');
  const lr = lz && !lz.hidden ? lz.getBoundingClientRect() : null;
  return { cur: el ? getComputedStyle(el).cursor : null, dot: !!lr, near: !!lr && Math.abs(lr.left + lr.width / 2 - x) < 14 && Math.abs(lr.top + lr.height / 2 - y) < 14 };
}, xy);

(async () => {
  const h = await startHati({});
  await seedWorkspace(h, { contracts: FIXTURES, approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const shot = n => page.screenshot({ path: path.join(OUT, n) }).catch(() => {});
  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await until(page, () => !!(window.state && state.contracts && state.contracts.length), null, 15000);
    await page.evaluate(() => setView('dashboard'));
    if (!(await until(page, () => document.querySelectorAll('#hb-board .hb-fig').length > 0, null, 12000))) throw new Error('the board did not draw');

    for (const face of ['board', 'explorer']){
      if (face === 'explorer'){
        await page.evaluate(() => hbSetFace('explorer'));
        await until(page, () => hbS().face === 'explorer' && !!document.getElementById('ig-cv'), null, 12000);
        await page.waitForTimeout(600);
      }
      await page.click('#hb-present').catch(() => {});
      await until(page, () => document.getElementById('ig-page') && document.getElementById('ig-page').classList.contains('hb-presenting'));
      /* the page settles into the presentation before anything is aimed at */
      await until(page, () => { const f = document.querySelector('[data-hb-face]'); return f && f.getBoundingClientRect().width > 0 ? true : null; });
      await page.waitForTimeout(500);
      const S = await spotsOf(page);
      await page.click('[data-hb-tool="pointer"]').catch(() => {});
      const on = await until(page, () => !!document.querySelector('.hb-pointing'));
      check(!!on, `${face} 0 Pointer turns on`);
      const targets = face === 'board' ? [['a figure', S.fig], ['the Board · Explorer tab', S.head], ['a card\'s button', S.dock]]
        : [['the map', S.map], ['the Board · Explorer tab', S.head]];
      for (const [name, xy] of targets){
        if (!xy){ check(false, `${face} 1 ${name} is on the screen to aim at`); continue; }
        await page.mouse.move(xy[0], xy[1], { steps: 3 });
        await page.waitForTimeout(150);
        const a = await at(page, xy);
        check(a.cur === 'none' && a.dot && a.near, `${face} 1 over ${name}: no cursor, the red dot at the mouse`, JSON.stringify(a));
      }
      await shot(`${face}-pointing.png`);
      const before = await stateNow(page);
      const aim = face === 'board' ? S.fig : S.map;
      if (aim){ await page.mouse.click(aim[0], aim[1]); await page.waitForTimeout(400); }
      const after = await stateNow(page);
      check(!!aim && before === after && !!(await page.evaluate(() => !!document.querySelector('.hb-pointing'))), `${face} 2 a click while pointing opens nothing`, before + ' → ' + after);

      /* 3. Exit pointer, then Escape */
      const exit = await page.evaluate(() => { const b = document.querySelector('.hb-veil-exit');
        const r = b && b.getBoundingClientRect(); return r && r.width ? [Math.round(r.left + r.width / 2), Math.round(r.top + r.height / 2)] : null; });
      if (exit) await page.mouse.click(exit[0], exit[1]);
      const off = await until(page, () => !document.querySelector('.hb-pointing') ? true : null);
      const cur = S.head ? await at(page, S.head) : null;
      check(!!off && !!cur && cur.cur !== 'none' && !cur.dot, `${face} 3a "Exit pointer" brings the cursor back`, JSON.stringify(cur));
      await page.click('[data-hb-tool="pointer"]').catch(() => {});
      await until(page, () => !!document.querySelector('.hb-pointing'));
      await page.keyboard.press('Escape');
      const off2 = await until(page, () => !document.querySelector('.hb-pointing') ? true : null);
      check(!!off2, `${face} 3b Escape brings the cursor back too`);
      await page.evaluate(() => hbPresent(false));
      await page.waitForTimeout(300);
      const S2 = await spotsOf(page);
      if (face === 'board' && S2.fig){
        await page.mouse.click(S2.fig[0], S2.fig[1]);
        const dug = await until(page, () => (hbS().path || []).length > 0 ? true : null);
        check(!!dug, 'board 4 after exit a click on a figure opens it again');
        await page.evaluate(() => { const c = document.querySelector('[data-hb-crumb="-1"]'); if (c) c.click(); });
        await page.waitForTimeout(300);
      }
    }
  } catch (e){
    console.log('  FAIL — stopped: ' + (e && e.message));
    failures++;
  }
  check(errors.length === 0, '9 no page errors', errors.join(' | ') || 'none');
  await browser.close();
  await h.stop();
  console.log(failures ? `\n${failures} FAILED` : '\nall passed');
  process.exit(failures ? 1 : 0);
})();
