/* ONE ZOOM ON EVERY PAGE THAT SHOWS THE CONTRACT (owner, 11 Oct 2026,
   docs/WORKORDER-four-builds.md item 3: "add image 1 feature to all the pages
   that have paper and delete the feature highlighted in image 2"; "zoom
   everywhere, count only on Negotiate").

   The A⁻ 15px A⁺ text-size stepper is gone; the clause editor's "− 100% +"
   zoom stands in its place on the Document tab, Negotiate and Home's Paper,
   one remembered value. The page grows; the words keep their type. The
   "+N −N" words-moved count is on Negotiate only. */
const path = require('node:path');
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'one-zoom');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let pass = 0, fail = 0;
const ok = (name, good, detail) => { good ? pass++ : fail++;
  console.log(`${good ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`); };

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const until = (page, fn, arg, ms = 8000) => page.waitForFunction(fn, arg, { timeout: ms }).then(() => true, () => false);
  try {
    const page = await (await browser.newContext({ viewport: { width: 1500, height: 900 } })).newPage();
    const errs = []; page.on('pageerror', e => errs.push(e.message));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await until(page, () => window.state && state.contracts && state.contracts.length > 0, null, 15000);
    /* the seed's own contract, once the server's list has landed */
    await until(page, () => state.contracts.some(c => c.id === 'MK-B2'), null, 15000);
    const id = 'MK-B2';

    /* the control as the reader sees it, and the paper's measured size */
    const READ = sel => page.evaluate(sel => {
      const st = document.querySelector('.rl-type-step');
      const wrap = document.querySelector(sel);
      const sheet = wrap && (wrap.querySelector('.pg-sheet, .rl-paper') || wrap);
      const p = wrap && wrap.querySelector('p');
      return { ctl: st ? st.textContent.replace(/\s+/g, ' ').trim() : null,
        textSize: /A⁻|A⁺|A⁻|A⁺/.test(document.body.innerText),
        zoom: wrap ? Number(getComputedStyle(wrap).zoom) || 1 : null,
        w: sheet ? Math.round(sheet.getBoundingClientRect().width) : 0,
        type: p ? parseFloat(getComputedStyle(p).fontSize) : 0,
        moved: !!document.querySelector('.rl-moved') };
    }, sel);

    /* 1. THE DOCUMENT TAB */
    await page.evaluate(id => openWorkspace(id), id);
    await until(page, () => !!document.querySelector('.room-tabrow'), null, 10000);
    await page.evaluate(() => roomGoTab('contract'));
    const docUp = await until(page, () => !!document.querySelector('#ws-tabrow-end .rl-type-step') && !!document.querySelector('#doc-zoom'));
    ok('1a the Document tab carries the zoom', docUp);
    const d0 = await READ('#doc-zoom');
    ok('1b it reads "− 100% +", and no A⁻ / A⁺ is drawn', d0.ctl === '− 100% +' && !d0.textSize, d0.ctl);
    ok('1c no words-moved count on the Document tab', !d0.moved);
    await page.click('#ws-tabrow-end .rl-type-step [data-rl-type="1"]');
    await page.click('#ws-tabrow-end .rl-type-step [data-rl-type="1"]');
    await until(page, () => (document.querySelector('.rl-type-out') || {}).textContent === '120%');
    const d1 = await READ('#doc-zoom');
    ok('1d two presses: 120%, the page grows, the words keep their type',
      d1.ctl === '− 120% +' && Math.abs(d1.zoom - 1.2) < 0.01 && d1.type === d0.type,
      `zoom ${d0.zoom} → ${d1.zoom}, type ${d0.type} → ${d1.type}`);
    ok('1e it is remembered', await page.evaluate(() => localStorage.getItem('hati.v1.docZoom')) === '120');
    await page.screenshot({ path: path.join(OUT, '1-document.png') });

    /* 2. NEGOTIATE: the same zoom, and the words moved */
    await page.evaluate(id => openRedlineWorkbench(id), id);
    const ngUp = await until(page, () => !!document.querySelector('#view-redline .rl-type-step') && !!document.querySelector('#view-redline .rl-zoom'));
    ok('2a Negotiate carries the zoom', ngUp);
    const n0 = await READ('#view-redline .rl-zoom');
    ok('2b at the zoom the Document tab left', n0.ctl === '− 120% +' && Math.abs(n0.zoom - 1.2) < 0.01, `${n0.ctl}, zoom ${n0.zoom}`);
    ok('2c nothing open on the table, no count', !n0.moved);
    const filed = await page.evaluate(async id => {
      const c = getContract(id); const cl = negoClauseList(c)[0];
      const body = '<p>' + String(cl.text || '').replace(/[<&>]/g, '') + ' The Supplier shall also keep records for seven years.</p>';
      try { await negoEditClause(c, cl.clauseId, body, { side: 'owner', note: 'test' }); } catch (e) { return 'threw ' + e.message; }
      renderRedline(); return rlWordsMoved(c);
    }, id);
    const shown = await page.evaluate(() => (document.querySelector('#view-redline .rl-moved') || {}).textContent || '');
    ok('2d a filed change shows its words moved beside the zoom', filed && filed.ins > 0 && shown.replace(/\s+/g, ' ').trim() === `+${filed.ins} −${filed.del}`,
      `${JSON.stringify(filed)} · "${shown}"`);
    await page.screenshot({ path: path.join(OUT, '2-negotiate.png') });

    /* 3. HOME'S PAPER */
    await page.evaluate(() => setView('dashboard'));
    await until(page, () => typeof window.igAnalyze === 'function');
    await page.evaluate(id => igAnalyze(id), id);
    const hmUp = await until(page, () => !!document.querySelector('#ig-strip .rl-type-step') && !!document.querySelector('#ig-paper .ig-zoom'));
    ok('3a Home\'s Paper carries the zoom', hmUp);
    const m0 = await READ('#ig-paper .ig-zoom');
    ok('3b at the same remembered zoom, and the page wears it', m0.ctl === '− 120% +' && Math.abs(m0.zoom - 1.2) < 0.01, `${m0.ctl}, zoom ${m0.zoom}`);
    ok('3c no count on Home\'s Paper', !m0.moved);
    await page.click('#ig-strip .rl-type-step [data-rl-type="-1"]');
    await until(page, () => (document.querySelector('#ig-strip .rl-type-out') || {}).textContent === '110%');
    const m1 = await READ('#ig-paper .ig-zoom');
    ok('3d a press on Home turns Home\'s page', Math.abs(m1.zoom - 1.1) < 0.01, `zoom ${m1.zoom}`);
    await page.screenshot({ path: path.join(OUT, '3-home-paper.png') });

    ok('4 no page errors', errs.length === 0, errs.slice(0, 2).join(' | ') || null);
  } catch (e) { fail++; console.log('FAIL  the check threw — ' + e.message); }
  await browser.close(); await h.stop();
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
