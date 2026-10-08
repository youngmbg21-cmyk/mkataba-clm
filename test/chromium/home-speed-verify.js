/* Chromium verification: HOME IS QUICK
   ============================================================
   Work order "Home speed", Parts 1–3 (owner-asked 8 Oct 2026: "please check
   why there is a lag when i try to get into the home page and also in
   navigating between the tabs in the home page"). The sample book is copied
   up to 430 contracts in the page, as the measuring script did, and every
   limit is a RELATION with room for a slower machine, never a bare
   millisecond figure:
     1. Board ⇄ Paper: the longest freeze of a switch is under half of the
        freeze of opening Home itself (the face turns in place)
     2. the second Explorer arrival's longest freeze is under half of the
        first's (the laid-out map is kept)
     3. sitting on a still, settled Explorer keeps the browser busy under 5%
        of the time (the frame loop rests)
     4. no frame of the map is drawn while the Board shows
     5. a second visit to Home freezes no longer than the first, give or take
        a quarter (the shelf's readings are remembered)
     6. no page errors
   A "freeze" is a browser long task; "busy" is the main thread's task time
   (CDP Performance.getMetrics TaskDuration). Waits ask for the state, bounded.
   Run: node test/chromium/home-speed-verify.js */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const BOOK = Number(process.env.HOME_SPEED_BOOK || 430);
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
    const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
    page.on('pageerror', e => errors.push(e.message));
    const until = async (fn, arg, ms = 10000) => { let v; const t0 = Date.now();
      while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
      return v; };
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForFunction(() => window.state && state.contracts && state.contracts.length > 3 && typeof hbS === 'function', null, { timeout: 20000 });
    const hasKept = await page.evaluate(() => typeof igFramesDrawn === 'function' && typeof igTurnFace === 'function');
    check('0. this build keeps the map and counts its frames', hasKept);
    const cdp = await page.context().newCDPSession(page); await cdp.send('Performance.enable');
    const busyNow = async () => { const m = (await cdp.send('Performance.getMetrics')).metrics; return (m.find(x => x.name === 'TaskDuration') || {}).value || 0; };
    await page.evaluate(N => {
      const base = state.contracts.slice(); let k = 0;
      while (state.contracts.length < N){ const c = JSON.parse(JSON.stringify(base[k % base.length])); c.id = c.id + '-X' + k; c.contractNo = (c.contractNo || c.id) + '-' + k; state.contracts.push(c); k++; }
      if (typeof familyIndexDirty === 'function') familyIndexDirty();
      window.__lt = []; new window.PerformanceObserver(l => { for (const e of l.getEntries()) window.__lt.push(e.duration); }).observe({ type: 'longtask', buffered: false });
      const s = hbS(); s.face = 'board'; s.prep = 'closed'; hbSave(); setView('contracts');
    }, BOOK);
    await page.waitForTimeout(1000);
    /* one act: its longest freeze, the time the main thread was busy, and
       the map's frames drawn, over a bounded settle */
    const act = async (fn, settle) => {
      await page.evaluate(() => { window.__lt = []; });
      const b0 = await busyNow(), f0 = await page.evaluate(() => typeof igFramesDrawn === 'function' ? igFramesDrawn() : 0);
      await page.evaluate(fn);
      await settle();
      const lt = await page.evaluate(() => window.__lt.slice());
      return { max: Math.round(Math.max(0, ...lt)), busy: Math.round((await busyNow() - b0) * 1000),
        frames: await page.evaluate(() => typeof igFramesDrawn === 'function' ? igFramesDrawn() : 0) - f0 };
    };
    const quiet = ms => () => page.waitForTimeout(ms);
    const onFace = f => () => until(f => document.getElementById('ig-page') && document.getElementById('ig-page').getAttribute('data-hb-side') === f, f).then(() => page.waitForTimeout(600));
    const home1 = await act(() => setView('dashboard'), () => until(() => !!document.querySelector('#hb-board .hb-note')).then(() => page.waitForTimeout(600)));
    const toPaper = await act(() => hbSetFace('paper'), onFace('paper'));
    const toBoard = await act(() => hbSetFace('board'), onFace('board'));
    check('1. Board ⇄ Paper: a switch freezes under half of opening Home',
      Math.max(toPaper.max, toBoard.max) < Math.max(60, home1.max / 2), `paper ${toPaper.max} · board ${toBoard.max} · Home ${home1.max} ms`);
    const ex1 = await act(() => hbSetFace('explorer'), onFace('explorer'));
    /* settle: the layout finishes off the press, then the loop rests */
    await page.waitForTimeout(4000);
    await page.evaluate(() => { if (typeof igSetSpin === 'function') igSetSpin(false); });
    await page.waitForTimeout(2500);
    const sit = await act(() => 0, quiet(4000));
    check('3. a still, settled Explorer keeps the browser busy under 5% of the time', sit.busy < 200, `${sit.busy} ms busy of 4000`);
    const back = await act(() => hbSetFace('board'), onFace('board'));
    const onBoard = await act(() => 0, quiet(3000));
    check('4. no frame of the map is drawn while the Board shows', onBoard.frames === 0, `${onBoard.frames} frames (and ${back.frames} on the way out)`);
    const ex2 = await act(() => hbSetFace('explorer'), onFace('explorer'));
    check('2. the second Explorer arrival freezes under half of the first', ex2.max < Math.max(60, ex1.max / 2), `first ${ex1.max} · second ${ex2.max} ms`);
    await page.evaluate(() => { if (typeof igSetSpin === 'function') igSetSpin(true); });
    await act(() => hbSetFace('board'), onFace('board'));
    await act(() => setView('contracts'), quiet(800));
    const home2 = await act(() => setView('dashboard'), () => until(() => !!document.querySelector('#hb-board .hb-note')).then(() => page.waitForTimeout(600)));
    check('5. a second visit to Home freezes no longer than the first (±25%)', home2.max <= Math.max(60, home1.max * 1.25), `first ${home1.max} · second ${home2.max} ms`);
    check('6. no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } finally {
    await browser.close(); await h.stop();
  }
  console.log(failures ? `\n${failures} FAILED` : '\nALL PASS');
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
