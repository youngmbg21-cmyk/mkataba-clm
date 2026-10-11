/* ONE ZOOM ON EVERY PAGE THAT SHOWS THE CONTRACT (owner, 11 Oct 2026,
   docs/WORKORDER-four-builds.md item 3: "add image 1 feature to all the pages
   that have paper and delete the feature highlighted in image 2"; "zoom
   everywhere, count only on Negotiate").

   The A⁻ 15px A⁺ text-size stepper is gone; the clause editor's "− 100% +"
   zoom stands in its place on the Document tab, Negotiate and Home's Paper,
   one remembered value. The page grows; the words keep their type. The
   "+N −N" words-moved count is on Negotiate only.

   RE-POINTED 11 Oct 2026 (owner: "the page adjust was supposed to go inside
   the page area ... not adding a button on the panel"; "this needs to be done
   to all pages with a paper"): the zoom stands on each paper's own grey, top
   right above the sheet (rlPaperZoomHtml, .paper-zc), never on a bar. */
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

    /* 1. HOME'S DOCUMENT — RE-POINTED 11 Oct 2026: the contract room's
       Document tab is gone (owner); its working copy is read on Home's
       Document now, so the first presses happen here. */
    await page.evaluate(() => setView('dashboard'));
    await until(page, () => typeof window.igAnalyze === 'function');
    await page.evaluate(id => igAnalyze(id), id);
    const docUp = await until(page, () => !!document.querySelector('#ig-paper .paper-zc .rl-type-step') && !!document.querySelector('#ig-paper .ig-zoom'));
    ok('1a Home\'s Document carries the zoom, on the paper', docUp);
    ok('1a2 and none on the strip', await page.evaluate(() => !document.querySelector('#ig-strip .rl-type-step')));
    const d0 = await READ('#ig-paper .ig-zoom');
    ok('1b it reads "− 100% +", and no A⁻ / A⁺ is drawn', d0.ctl === '− 100% +' && !d0.textSize, d0.ctl);
    ok('1c no words-moved count on Home\'s Document', !d0.moved);
    await page.click('#ig-paper .rl-type-step [data-rl-type="1"]');
    await until(page, () => (document.querySelector('#ig-paper .rl-type-out') || {}).textContent === '110%');
    await page.click('#ig-paper .rl-type-step [data-rl-type="1"]');
    await until(page, () => (document.querySelector('#ig-paper .rl-type-out') || {}).textContent === '120%');
    const d1 = await READ('#ig-paper .ig-zoom');
    ok('1d two presses: 120%, the page grows, the words keep their type',
      d1.ctl === '− 120% +' && Math.abs(d1.zoom - 1.2) < 0.01 && d1.type === d0.type,
      `zoom ${d0.zoom} → ${d1.zoom}, type ${d0.type} → ${d1.type}`);
    ok('1e it is remembered', await page.evaluate(() => localStorage.getItem('hati.v1.docZoom')) === '120');
    await page.screenshot({ path: path.join(OUT, '1-home-document.png') });

    /* 2. NEGOTIATE: the same zoom, and the words moved */
    await page.evaluate(id => openRedlineWorkbench(id), id);
    const ngUp = await until(page, () => !!document.querySelector('#view-redline .paper-zc .rl-type-step') && !!document.querySelector('#view-redline .rl-zoom'));
    ok('2a Negotiate carries the zoom, on the paper', ngUp);
    ok('2a2 and none on the control row', await page.evaluate(() => !document.querySelector('#view-redline .rl-head .rl-type-step')));
    const above = await page.evaluate(() => { const z = document.querySelector('#view-redline .paper-zc').getBoundingClientRect();
      const s = document.querySelector('#view-redline .rl-paper').getBoundingClientRect(); return { zb: Math.round(z.bottom), st: Math.round(s.top) }; });
    ok('2a3 it stands in the grey above the sheet', above.zb <= above.st, JSON.stringify(above));
    const n0 = await READ('#view-redline .rl-zoom');
    ok('2b at the zoom Home\'s Document left', n0.ctl === '− 120% +' && Math.abs(n0.zoom - 1.2) < 0.01, `${n0.ctl}, zoom ${n0.zoom}`);
    ok('2c nothing open on the table, no count', !n0.moved);
    const filed = await page.evaluate(async id => {
      const c = getContract(id); const cl = negoClauseList(c)[0];
      const body = '<p>' + String(cl.text || '').replace(/[<&>]/g, '') + ' The Supplier shall also keep records for seven years.</p>';
      try { await negoEditClause(c, cl.clauseId, body, { side: 'owner', note: 'test' }); } catch (e) { return 'threw ' + e.message; }
      renderRedline(); return rlWordsMoved(c);
    }, id);
    const shown = await page.evaluate(() => (document.querySelector('#view-redline .paper-zc .rl-moved') || {}).textContent || '');
    ok('2d a filed change shows its words moved beside the zoom', filed && filed.ins > 0 && shown.replace(/\s+/g, ' ').trim() === `+${filed.ins} −${filed.del}`,
      `${JSON.stringify(filed)} · "${shown}"`);
    await page.screenshot({ path: path.join(OUT, '2-negotiate.png') });

    /* 3. BACK ON HOME'S DOCUMENT: the value Negotiate kept, and a press turns it */
    await page.evaluate(() => setView('dashboard'));
    await page.evaluate(id => igAnalyze(id), id);
    const hmUp = await until(page, () => !!document.querySelector('#ig-paper .paper-zc .rl-type-step') && !!document.querySelector('#ig-paper .ig-zoom'));
    const m0 = hmUp ? await READ('#ig-paper .ig-zoom') : {};
    ok('3a back on Home, the same remembered zoom, and the page wears it', hmUp && m0.ctl === '− 120% +' && Math.abs(m0.zoom - 1.2) < 0.01, `${m0.ctl}, zoom ${m0.zoom}`);
    await page.click('#ig-paper .rl-type-step [data-rl-type="-1"]');
    await until(page, () => (document.querySelector('#ig-paper .rl-type-out') || {}).textContent === '110%');
    const m1 = await READ('#ig-paper .ig-zoom');
    ok('3b a press on Home turns Home\'s page', Math.abs(m1.zoom - 1.1) < 0.01, `zoom ${m1.zoom}`);
    await page.screenshot({ path: path.join(OUT, '3-home-document.png') });

    /* 4. THE ROOM'S SIGNING TAB — the one paper the room still draws. Its zoom
       stands on the same grey, top right, beside the signing copy's page
       arrows. It scales the A4 pages whole (the pages that get signed never
       re-break), so it is the signing copy's own "− N% +". */
    await page.evaluate(id => openWorkspace(id), id);
    await until(page, () => !!document.querySelector('.room-tabrow'), null, 10000);
    await page.evaluate(id => roomGoTab(getContract(id), 'sign'), id);
    const sgUp = await until(page, () => !!document.querySelector('#doc-zc-slot .paper-zc [data-sc-zoom]') && !!document.querySelector('#doc-signwrap .pg-sheet'), null, 10000);
    ok('4a the Signing tab carries the zoom, on the paper', sgUp);
    ok('4a2 and none on the tab row', await page.evaluate(() => !document.querySelector('#ws-tabrow-end .rl-type-step, #ws-tabrow-end [data-sc-zoom]')));
    if (sgUp) {
      const s0 = await page.evaluate(() => {
        const st = document.querySelector('#doc-zc-slot .paper-zc [data-sc-zoom]').closest('.sc-step');
        const z = document.querySelector('#doc-zc-slot .paper-zc').getBoundingClientRect();
        const sh = document.querySelector('#doc-signwrap .pg-sheet').getBoundingClientRect();
        return { ctl: st.textContent.replace(/\s+/g, ' ').trim(), zb: Math.round(z.bottom), st: Math.round(sh.top), w: Math.round(sh.width),
          textSize: /A⁻|A⁺/.test(document.body.innerText), moved: !!document.querySelector('#view-workspace .rl-moved') };
      });
      ok('4b it reads "− N% +", no A⁻ / A⁺, no words-moved count', /^− \d+% \+$/.test(s0.ctl) && !s0.textSize && !s0.moved, s0.ctl);
      ok('4c it stands in the grey above the sheet', s0.zb <= s0.st, JSON.stringify({ zb: s0.zb, st: s0.st }));
      await page.click('#doc-zc-slot [data-sc-zoom="1"]');
      const grew = await until(page, w => { const sh = document.querySelector('#doc-signwrap .pg-sheet'); return !!sh && Math.round(sh.getBoundingClientRect().width) > w; }, s0.w);
      ok('4d a press turns the signing page larger, whole', grew);
      await page.screenshot({ path: path.join(OUT, '4-signing.png') });
    }

    ok('5 no page errors', errs.length === 0, errs.slice(0, 2).join(' | ') || null);
  } catch (e) { fail++; console.log('FAIL  the check threw — ' + e.message); }
  await browser.close(); await h.stop();
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
