/* Chromium verification: THE TRACK ON THE DOCUMENT TAB, AND THE BUTTONS ON
   THE TAB LINE (owner, 10 Oct 2026)
   ============================================================
   "In image 1, bring the highlighted feature to the document page as well"
   (Home's Track), and "move the highlighted buttons on the right one layer
   above so they can be on the same line as the tabs ... delete the white bar
   they currently sit on ... do this for the signing page as well. And remove
   any banner words".
   At 1440 x 900, light, on a contract with five flagged clauses:
     1. the Document tab draws the Track in the paper column's left margin,
        one label per flagged clause, labels never overlapping
     2. the sheet's left edge does not move for it
     3. pressing a label glides the paper and opens the Clauses list
     4. the Signing tab draws no Track
     5. on both tabs the paper's buttons stand on the tab line, no bar under
        the tabs, no "Signing copy" or "Executed and locked" words
     6. at 900px wide the buttons take their own line under the tabs and
        never overlap them
     7. no page errors
   Waits ask for the state, bounded. Red at unmodified main (1, 3, 5).
   Screenshots: test/chromium/shots/document-tab-track/ (or HATI_SHOT_DIR).
   Run: node test/chromium/document-tab-track-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'document-tab-track');
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
    const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
    page.on('pageerror', e => errors.push(e.message));
    const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
      while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
      return v; };
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForFunction(() => window.state && state.contracts && state.contracts.some(c => c.id === 'MK-A2') && typeof openWorkspace === 'function', null, { timeout: 20000 });
    const tab = async k => {
      await page.evaluate(k => { if (state.activeId !== 'MK-A2' || state.view !== 'workspace') openWorkspace('MK-A2'); setTimeout(() => roomGoTab(getContract('MK-A2'), k), 250); }, k);
      return until(k => !!document.querySelector(`#ws-tabs [data-ws-tab="${k}"].on`) && !!document.getElementById('doc-canvas'), k, 10000);
    };
    check('0. the contract is open on the Document tab', !!(await tab('docs')));
    /* five clauses flagged down the contract, as Home's Track check does */
    const staged = await page.evaluate(() => {
      const c = getContract('MK-A2'); const canvas = document.getElementById('doc-canvas');
      const rows = docXrayRows(c, canvas).filter(r => r.cite && r.words > 12);
      if (rows.length < 5) return { err: 'only ' + rows.length + ' clauses' };
      const pick = [0, 0.25, 0.5, 0.75, 1].map(f => rows[Math.min(rows.length - 1, Math.floor(f * (rows.length - 1)))]);
      const sev = ['high', 'medium', 'low', 'high', 'medium'];
      c.scan = { findings: pick.map((r, k) => ({ id: 'f' + k, sev: sev[k], title: 'Flag ' + k, why: 'Why ' + k,
        quote: String(r.row.text || '').replace(/\s+/g, ' ').trim().split(' ').slice(0, 8).join(' ') })), dismissed: [] };
      docThreadPaint(c);
      return { n: docXraySpineRows(docXrayRows(c, canvas)).length };
    });
    check('0b. clauses flagged down the contract', !staged.err && staged.n >= 5, staged.err || String(staged.n));

    console.log('\n1 · the Track on the Document tab');
    const tr = await until(() => { const sp = document.getElementById('doc-track'); return sp && !sp.hidden && sp.querySelectorAll('.ig-trk-lab').length ? true : null; });
    check('1a the Track is drawn in the paper column', !!tr);
    const lay = await page.evaluate(() => {
      const sp = document.getElementById('doc-track'); if (!sp) return null;
      const labs = [...sp.querySelectorAll('.ig-trk-lab')].map(b => b.getBoundingClientRect());
      let overlap = 0; for (let i = 1; i < labs.length; i++) if (labs[i].top < labs[i - 1].bottom - 0.5) overlap++;
      const sheet = document.querySelector('#doc-canvas').closest('.pg-sheet') || document.getElementById('doc-canvas');
      return { n: labs.length, overlap, size: sp.dataset.trackSize, inCol: sp.parentElement && sp.parentElement.id,
        spRight: sp.getBoundingClientRect().right, sheetLeft: sheet.getBoundingClientRect().left };
    });
    check('1b one label per flagged clause, none overlapping', !!lay && lay.n === staged.n && lay.overlap === 0, JSON.stringify(lay));
    check('1c it stands in the paper column\'s margin, left of the sheet', !!lay && lay.inCol === 'doc-paper-col' && lay.spRight <= lay.sheetLeft + 1, JSON.stringify(lay));
    await page.screenshot({ path: path.join(OUT, '1-document-track.png') });

    console.log('\n2 · the paper does not move for it');
    const moved = await page.evaluate(() => {
      const sp = document.getElementById('doc-track');
      const sheet = () => (document.querySelector('#doc-canvas').closest('.pg-sheet') || document.getElementById('doc-canvas')).getBoundingClientRect().left;
      const a = sheet(); sp.style.display = 'none'; const b = sheet(); sp.style.display = ''; return Math.abs(a - b);
    });
    check('2a the sheet\'s left edge is the same with and without the Track', moved < 0.5, moved + 'px');

    console.log('\n3 · a press goes to the clause and opens it in the list');
    const before = await page.evaluate(() => document.getElementById('doc-scroll').scrollTop);
    await page.evaluate(() => { const labs = document.querySelectorAll('#doc-track .ig-trk-lab'); labs[labs.length - 1].click(); });
    const went = await until(b => { const s = document.getElementById('doc-scroll'); const card = document.getElementById('doc-thread');
      return s.scrollTop > b + 50 && card && !card.hidden ? { top: s.scrollTop } : null; }, before, 6000);
    check('3a the paper glides down and the Clauses list is open', !!went, JSON.stringify(went));
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(OUT, '2-after-press.png') });

    console.log('\n4 · the buttons on the tab line, Document');
    const line = async () => page.evaluate(() => {
      const vis = el => !!el && el.getClientRects().length > 0 && getComputedStyle(el).display !== 'none';
      const t = document.querySelector('#ws-tabs .room-tab.on'), slot = document.getElementById('ws-tabrow-end');
      const a = t.getBoundingClientRect(), r = slot.getBoundingClientRect();
      const words = (slot.textContent || '').replace(/\s+/g, ' ');
      return { inRow: !!document.querySelector('.room-tabrow > #ws-tabrow-end'), bar: vis(document.querySelector('.room-toolrow')),
        same: Math.abs((a.top + a.bottom) / 2 - (r.top + r.bottom) / 2) < 12, slotH: Math.round(r.height),
        words: /Signing copy|Signed copy|Executed and locked|agreed in round|as drafted|rebuilt from their file/.test(words) ? words : '' };
    });
    const d = await line();
    check('4a Document: the buttons stand on the tab line, no bar under the tabs', d.inRow && d.same && !d.bar, JSON.stringify(d));
    check('4b Document: no banner words where the buttons are', !d.words, d.words);

    console.log('\n5 · Signing');
    check('5a the Signing tab is open', !!(await tab('sign')));
    await page.waitForTimeout(500);
    const sg = await page.evaluate(() => { const sp = document.getElementById('doc-track'); return !sp || sp.hidden || !sp.getClientRects().length; });
    check('5b no Track on the Signing tab', sg);
    const s = await line();
    check('5c Signing: the buttons stand on the tab line, no bar, no words', s.inRow && s.same && !s.bar && !s.words, JSON.stringify(s));
    await page.screenshot({ path: path.join(OUT, '3-signing.png') });

    console.log('\n6 · a narrow window');
    await page.setViewportSize({ width: 900, height: 900 });
    await tab('docs');
    await page.waitForTimeout(500);
    const nw = await page.evaluate(() => {
      const tabs = [...document.querySelectorAll('#ws-tabs .room-tab')].map(t => t.getBoundingClientRect());
      const btns = [...document.querySelectorAll('#ws-tabrow-end > *')].filter(e => e.getClientRects().length).map(e => e.getBoundingClientRect());
      let hit = 0; tabs.forEach(t => btns.forEach(b => { if (b.left < t.right && b.right > t.left && b.top < t.bottom && b.bottom > t.top) hit++; }));
      const sp = document.getElementById('doc-track'), cv = document.getElementById('doc-canvas');
      const sheet = cv && (cv.closest('.pg-sheet') || cv);
      const over = !!(sp && !sp.hidden && sp.getClientRects().length && sheet && sp.getBoundingClientRect().right > sheet.getBoundingClientRect().left + 1);
      return { hit, wide: document.documentElement.scrollWidth <= document.documentElement.clientWidth, over };
    });
    check('6a tabs and buttons never overlap; nothing runs off the window', nw.hit === 0 && nw.wide, JSON.stringify(nw));
    check('6b the Track never lies over the paper where there is no margin', !nw.over, JSON.stringify(nw));
    await page.screenshot({ path: path.join(OUT, '4-narrow.png') });
  } catch (e) {
    console.log('ERROR', e && e.stack || e); failures++;
  } finally {
    check('7. no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
    await browser.close(); await h.stop();
    console.log(failures ? `\n${failures} failed` : '\nall passed');
    process.exit(failures ? 1 : 0);
  }
})();
