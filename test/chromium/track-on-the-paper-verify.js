/* Chromium verification: THE TRACK ON HOME'S PAPER
   ============================================================
   Work order "Home speed", Part 7 (the owner picked "Track" by name, 8 Oct
   2026, off the "Clause Strip Options" artifact). The 28px strip beside the
   paper cut numbers like 3.4.1 off. The Track is one rail for the whole
   contract, a mark where each flagged clause really is, its number whole on
   a label beside it, and a window over the part on screen. On Home's Paper at
   1440 x 900 with the panel open, light and dark, flags spread through a
   long contract:
     1. every flagged clause has one label, every number is whole (not
        clipped), and no two labels overlap
     2. each mark's place on the rail matches its clause's place on the paper
        (within 2%)
     3. the window's top and height match the paper's visible part, and move
        when the paper scrolls
     4. hovering a label shows the card; pressing one glides the paper to that
        clause and fills Copilot's box without sending anything
     5. the sheet's left edge is where it is with the Track hidden (the paper
        does not move for it)
     6. where the margin is narrower than the Track, today's strip is drawn
        and the paper still does not move
     7. no page errors
   Waits ask for the state, bounded. Red at unmodified main (1, 2, 3).
   Screenshots: test/chromium/shots/track-on-the-paper/ (or HATI_SHOT_DIR).
   Run: node test/chromium/track-on-the-paper-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'track-on-the-paper');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let failures = 0;
const check = (name, pass, detail) => {
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
  if (!pass) failures++;
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h, { approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    for (const dark of [false, true]) {
      const tag = dark ? 'dark' : 'light';
      const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
      page.on('pageerror', e => errors.push(e.message));
      const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
        while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
        return v; };
      await page.goto(h.base + '/', { waitUntil: 'networkidle' });
      if (dark) await page.evaluate(() => { try { localStorage.setItem('hati-dark', '1'); } catch (_) {} });
      await page.fill('#li-email', 'admin@example.co.ke');
      await page.fill('#li-pass', 'adminpassword1');
      await page.click('#li-go');
      await page.waitForFunction(() => window.state && state.contracts && state.contracts.some(c => c.id === 'MK-A2') && typeof pdOpenOnHome === 'function', null, { timeout: 20000 });
      if (dark) await page.evaluate(() => { if (typeof setDark === 'function') setDark(true); });
      await page.evaluate(() => pdOpenOnHome('MK-A2'));
      const opened = await until(() => !!document.querySelector('#ig-paper:not([hidden]) #ig-canvas') && !!document.getElementById('ig-spine'), null, 15000);
      check(`0. ${tag}: the contract is on Home's Paper`, !!opened);
      /* flag five clauses spread down the contract (risk-scan findings on
         their own words), then let the strip paint them */
      const staged = await page.evaluate(() => {
        const c = getContract('MK-A2'); const canvas = document.getElementById('ig-canvas');
        const rows = docXrayRows(c, canvas).filter(r => r.cite && r.words > 12);
        if (rows.length < 5) return { err: 'only ' + rows.length + ' clauses' };
        const pick = [0, 0.25, 0.5, 0.75, 1].map(f => rows[Math.min(rows.length - 1, Math.floor(f * (rows.length - 1)))]);
        const sev = ['high', 'medium', 'low', 'high', 'medium'];
        c.scan = { findings: pick.map((r, k) => ({ id: 'f' + k, sev: sev[k], title: 'Flag ' + k, why: 'Why ' + k,
          quote: String(r.row.text || '').replace(/\s+/g, ' ').trim().split(' ').slice(0, 8).join(' ') })), dismissed: [] };
        igPaintPaper();
        return { cites: pick.map(r => String(r.cite).replace(/\.$/, '')) };
      });
      check(`0b. ${tag}: five clauses flagged down the contract`, !staged.err, staged.err || staged.cites.join(' · '));
      const tr = await until(() => { const sp = document.getElementById('ig-spine'); return sp && !sp.hidden && sp.classList.contains('is-track') && sp.querySelectorAll('.ig-trk-lab').length ? true : null; });
      check(`0c. ${tag}: the Track is drawn`, !!tr);
      await page.screenshot({ path: path.join(OUT, `1-track-${tag}.png`) });
      if (!tr) { await page.close(); continue; }

      /* 1. labels */
      const L = await page.evaluate(() => {
        const sp = document.getElementById('ig-spine');
        const labs = [...sp.querySelectorAll('.ig-trk-lab')].map(b => { const r = b.getBoundingClientRect(); const n = b.querySelector('.doc-xr-num') || b;
          return { t: r.top, b: r.bottom, l: r.left, r: r.right, txt: n.textContent.trim(), clipped: b.scrollWidth > b.clientWidth + 1 || n.scrollWidth > n.clientWidth + 1 }; });
        return labs; });
      const overlap = L.some((a, i) => L.some((b, j) => j > i && a.t < b.b - 1 && b.t < a.b - 1));
      check(`1a. ${tag}: one label per flagged clause`, L.length >= 5, L.map(x => x.txt).join(' '));
      check(`1b. ${tag}: every number is whole`, L.every(x => !x.clipped && x.txt.length), L.filter(x => x.clipped).map(x => x.txt).join(' ') || 'none clipped');
      check(`1c. ${tag}: no two labels overlap`, !overlap);

      /* 2. marks where the clauses really are */
      const P = await page.evaluate(() => {
        const sp = document.getElementById('ig-spine'), sc = document.getElementById('ig-paper-scroll');
        const H = sp.clientHeight, top = 14, span = H - 28, total = sc.scrollHeight, scTop = sc.getBoundingClientRect().top - sc.scrollTop;
        const marks = [...sp.querySelectorAll('.ig-trk-svg rect[style]')].map(r => Number(r.getAttribute('y')));
        const labs = [...sp.querySelectorAll('.ig-trk-lab')];
        const rows = docXrayRows(getContract('MK-A2'), document.getElementById('ig-canvas'));
        return labs.map((b, k) => { const i = Number(b.getAttribute('data-xr-seg')); const row = rows.find(x => x.i === i) || rows[i]; const r = row.el.getBoundingClientRect();
          return { paper: (r.top - scTop) / total, rail: (marks[k] - top) / span }; }); });
      const worst = Math.max(...P.map(x => Math.abs(x.paper - x.rail)));
      check(`2. ${tag}: each mark sits at its clause's place on the paper (within 2%)`, P.length && worst <= 0.02, (worst * 100).toFixed(2) + '% worst');

      /* 3. the window */
      const win = () => page.evaluate(() => { const sp = document.getElementById('ig-spine'), sc = document.getElementById('ig-paper-scroll'), w = sp.querySelector('.ig-trk-win');
        const span = sp.clientHeight - 28, total = sc.scrollHeight;
        return { y: (Number(w.getAttribute('y')) - 14) / span, h: Number(w.getAttribute('height')) / span, want: sc.scrollTop / total, wantH: sc.clientHeight / total }; });
      let w0 = await win();
      check(`3a. ${tag}: the window covers the part on screen`, Math.abs(w0.y - w0.want) < 0.01 && Math.abs(w0.h - w0.wantH) < 0.01, JSON.stringify(w0));
      await page.evaluate(() => { const sc = document.getElementById('ig-paper-scroll'); sc.scrollTop = sc.scrollHeight / 2; });
      const w1 = await until(() => { const sp = document.getElementById('ig-spine'), sc = document.getElementById('ig-paper-scroll'), w = sp.querySelector('.ig-trk-win');
        const y = (Number(w.getAttribute('y')) - 14) / (sp.clientHeight - 28); return Math.abs(y - sc.scrollTop / sc.scrollHeight) < 0.01 && sc.scrollTop > 0 ? y : null; });
      check(`3b. ${tag}: and moves when the paper scrolls`, !!w1 && w1 > w0.y + 0.1, String(w1));
      await page.evaluate(() => { document.getElementById('ig-paper-scroll').scrollTop = 0; });

      /* 4. hover and press */
      const lab = await page.evaluate(() => { const b = document.querySelectorAll('#ig-spine .ig-trk-lab')[2]; return b && b.getAttribute('data-xr-seg'); });
      await page.hover(`#ig-spine .ig-trk-lab[data-xr-seg="${lab}"]`);
      const tip = await until(() => { const t = document.getElementById('ig-spine-tip'); return t && !t.hidden ? t.textContent.trim().slice(0, 60) : null; }, null, 4000);
      check(`4a. ${tag}: hovering a label shows the card`, !!tip, tip);
      const before = await page.evaluate(() => ({ s: document.getElementById('ig-paper-scroll').scrollTop, sent: (intel.history || []).length }));
      await page.click(`#ig-spine .ig-trk-lab[data-xr-seg="${lab}"]`);
      const after = await until(({ s }) => { const sc = document.getElementById('ig-paper-scroll'); const inp = document.getElementById('igd-input');
        return sc.scrollTop > s + 20 && inp && inp.value ? { s: sc.scrollTop, q: inp.value.slice(0, 50), sent: (intel.history || []).length } : null; }, before, 6000);
      check(`4b. ${tag}: pressing glides the paper and fills Copilot's box, sending nothing`, !!after && after.sent === before.sent, JSON.stringify(after));

      /* 5. the paper does not move for it */
      const edge = () => page.evaluate(() => Math.round((document.getElementById('ig-canvas').closest('.pg-sheet') || document.getElementById('ig-canvas')).getBoundingClientRect().left));
      const withTrack = await edge();
      await page.evaluate(() => { document.getElementById('ig-spine').style.display = 'none'; });
      const without = await edge();
      await page.evaluate(() => { document.getElementById('ig-spine').style.display = ''; });
      check(`5. ${tag}: the sheet's left edge does not move for the Track`, withTrack === without, withTrack + ' / ' + without);
      await page.close();
    }

    /* 6. where the margin is narrower than the Track, today's strip is drawn.
       On Home's Paper the margin measured 95px at every desktop width (the
       sheet narrows with the column), so the narrow margin is MADE: the sheet
       is drawn 60px further left (a transform, which moves nothing else) and
       the strip painted again. */
    const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForFunction(() => window.state && state.contracts && state.contracts.some(c => c.id === 'MK-A2') && typeof pdOpenOnHome === 'function', null, { timeout: 20000 });
    await page.evaluate(() => pdOpenOnHome('MK-A2'));
    await page.waitForFunction(() => !!document.getElementById('ig-canvas') && !!document.getElementById('ig-spine'), null, { timeout: 15000 });
    const narrow = await page.evaluate(() => {
      const c = getContract('MK-A2'); const canvas = document.getElementById('ig-canvas');
      const rows = docXrayRows(c, canvas).filter(r => r.cite && r.words > 12);
      c.scan = { findings: rows.slice(0, 3).map((r, k) => ({ id: 'n' + k, sev: 'high', title: 'F', why: 'W', quote: String(r.row.text || '').replace(/\s+/g, ' ').trim().split(' ').slice(0, 8).join(' ') })), dismissed: [] };
      igPaintPaper();
      const sp = document.getElementById('ig-spine'), sheet = canvas.closest('.pg-sheet') || canvas;
      const wide = sp.classList.contains('is-track');
      const shift = Math.round(sheet.getBoundingClientRect().left - sp.parentElement.getBoundingClientRect().left) - 40;
      sheet.style.transform = `translateX(${-shift}px)`;
      igStrandPaint(c);
      const room = Math.round(sheet.getBoundingClientRect().left - sp.parentElement.getBoundingClientRect().left);
      const left = Math.round(sheet.getBoundingClientRect().left); sp.style.display = 'none';
      const left2 = Math.round(sheet.getBoundingClientRect().left); sp.style.display = '';
      const out = { wide, room, track: sp.classList.contains('is-track'), blocks: sp.querySelectorAll('.doc-xr-seg').length, width: sp.style.width, left, left2 };
      sheet.style.transform = ''; igStrandPaint(c); out.back = sp.classList.contains('is-track');
      return out;
    });
    check('6a. with room, the Track', narrow.wide, JSON.stringify(narrow));
    check('6b. a margin narrower than the Track draws today\'s strip, and the paper does not move',
      !narrow.track && narrow.blocks > 0 && narrow.width === '28px' && narrow.left === narrow.left2, JSON.stringify(narrow));
    check('6c. given room again, the Track comes back', narrow.back);
    check('7. no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } finally {
    await browser.close(); await h.stop();
  }
  console.log(failures ? `\n${failures} FAILED` : '\nALL PASS');
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
