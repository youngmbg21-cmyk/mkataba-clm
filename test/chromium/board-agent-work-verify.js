/* Chromium verification: COPILOT'S WORK BELOW THE CARD WEARS THE BOARD
   (Young, 8 Oct 2026: on the dark board the approval packs' words were dark
   on dark and a white strip of buttons floated over the next pack; on the
   light board "it should be clear where one contract starts and the other
   ends").
   ============================================================
   Three approvals waiting on the admin; the approvals agent's work opened
   below its card, on the Dark board and then the Light one:
     1. the pack's title and its fields read against the card (contrast ≥ 4.5);
     2. the buttons' strip sits in its pack — not sticky, no white band on the
        dark board;
     3. each pack is a card of its own: a painted edge, and a clear gap before
        the next one;
     4. photographed; no page errors.
   Waits ask for the state, bounded.
   Screenshots: test/chromium/shots/board-agent-work/ (or HATI_SHOT_DIR).
   Run: node test/chromium/board-agent-work-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract, FIXTURES } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'board-agent-work');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const PACKS = ['Muranga Distributors Ltd', 'Orbit Products Africa Ltd', 'Royal Media Services']
  .map((cp, i) => fixtureContract('MK-AP' + i, 'Supply ' + i, cp, 'proc', 4e7, 'Under Review'));

let failures = 0;
const check = (name, pass, detail) => {
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
  if (!pass) failures++;
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h, { contracts: FIXTURES.concat(PACKS) });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
    while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
    return v; };
  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForFunction(ids => window.state && state.contracts && ids.every(id => state.contracts.some(c => c.id === id)), PACKS.map(c => c.id), { timeout: 20000 });
    await page.evaluate(() => setView('dashboard'));
    if (!(await until(() => typeof hbOpenAgent === 'function' && typeof agApproveItems === 'function'))) throw new Error('this build has no approvals work on the board');
    check('0. three approvals wait on the admin', (await until(() => agApproveItems().length >= 3)) === true || (await page.evaluate(() => agApproveItems().length)) >= 3);

    for (const scr of ['dark', 'light']) {
      await page.evaluate(scr => { const s = hbS(); s.screen = scr; hbSave(); hbOpenAgent('approve'); try { hbApplyScreen(); } catch (_) {} }, scr);
      const ready = await until(scr => { const pg = document.querySelector('#hb-page, #ig-page'); return !!pg && pg.classList.contains('hb-' + scr) && document.querySelectorAll('.hb-ag-work').length >= 3; }, scr);
      check(`${scr} 0. the packs are drawn below the card`, !!ready);
      if (!ready) continue;
      const m = await page.evaluate(() => {
        const rgb = s => { const v = (s.match(/[\d.]+/g) || []).map(Number); return { r: v[0], g: v[1], b: v[2], a: v.length > 3 ? v[3] : 1 }; };
        const over = (f, b) => ({ r: f.r * f.a + b.r * (1 - f.a), g: f.g * f.a + b.g * (1 - f.a), b: f.b * f.a + b.b * (1 - f.a), a: 1 });
        /* the ground under an element: walk up, laying each painted layer over the page's own */
        const ground = el => { const stack = []; for (let a = el; a; a = a.parentElement){ const c = rgb(getComputedStyle(a).backgroundColor); if (c.a > 0) stack.push(c); if (c.a >= 1) break; }
          let g = { r: 255, g: 255, b: 255, a: 1 }; for (const c of stack.reverse()) g = over(c, g); return g; };
        const lum = c => { const f = v => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
        const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
        const w = [...document.querySelectorAll('.hb-ag-work')];
        const first = w[0]; first.scrollIntoView({ block: 'start' });
        const words = [...first.querySelectorAll('.ag-p-title, .ag-p-who, .ag-p-body dd, .ag-p-body strong, .ag-p-body p, .ag-p-line')].filter(e => e.textContent.trim());
        const worst = words.reduce((lo, e) => { const r = ratio(over(rgb(getComputedStyle(e).color), ground(e)), ground(e)); return r < lo.r ? { r, t: e.textContent.trim().slice(0, 30) } : lo; }, { r: 99, t: '' });
        const foot = first.querySelector('.ag-p-foot'), fs = getComputedStyle(foot);
        const footG = ground(foot), cardG = ground(first);
        const cs = getComputedStyle(first);
        return { worst, n: words.length, footPos: fs.position, footBand: Math.abs(lum(footG) - lum(cardG)) > 0.1,
          edge: cs.borderTopStyle + ' ' + cs.borderTopWidth,
          gap: w[1] ? Math.round(w[1].getBoundingClientRect().top - first.getBoundingClientRect().bottom) : null };
      });
      check(`${scr} 1. the pack's words read against its card (worst ≥ 4.5)`, m.n > 3 && m.worst.r >= 4.5, `${m.worst.r.toFixed(2)} on "${m.worst.t}" of ${m.n}`);
      check(`${scr} 2a. the buttons' strip is not sticky`, m.footPos !== 'sticky' && m.footPos !== 'fixed', m.footPos);
      check(`${scr} 2b. no band of another colour under the buttons`, !m.footBand);
      check(`${scr} 3a. each pack has a painted edge`, /^solid /.test(m.edge) && parseFloat(m.edge.split(' ')[1]) >= 1, m.edge);
      check(`${scr} 3b. a clear gap before the next pack`, m.gap != null && m.gap >= 12, m.gap);
      await page.screenshot({ path: path.join(OUT, `${scr}.png`) });
    }
    check('4. no page errors', errors.length === 0, errors.join(' | '));
  } catch (e) {
    check('run', false, e.message);
  } finally {
    await browser.close(); await h.stop();
  }
  console.log(failures ? `\n${failures} FAILED` : '\nALL PASS');
  process.exit(failures ? 1 : 0);
})();
