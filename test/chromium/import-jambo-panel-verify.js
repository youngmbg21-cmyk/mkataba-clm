/* IMPORT: JAMBO'S PANEL BESIDE THE LIST (round 22, "The SAP way": the owner's
   word, 18 Oct 2026 — "you need a Jambo side panel"; js/views/migration.js
   migSideHtml, migPickSet)

   WHAT THIS PINS, driven in a real browser on Import contracts
     1 beside the list, Jambo says the batch in words from the figures' own
       counts, and his chip narrows the list to the files to check
     2 a press on a row CHOOSES it: the row is lit and the panel says that
       file — its facts (the ones the review window asks for), amber where a
       fact was not found, the marks in words, and the row's own doors
     3 Review in the panel opens the review window; pressed again the row is
       let go, and "‹ All files" goes back too
     4 the panel's Open, and a double-click on a row, open the contract
     5 the owner's three screens: the panel beside the list, in the window,
       nothing sideways
   At the parent (main before this change) every check fails but the console.
   RE-POINTED 19 Oct 2026 (lane E, round 22 built as drawn): the panel is
   Jambo's shared frame; his chip "check the 2 files" opens the check view;
   a chosen file to check reads "Check this file" with its facts in boxes
   (.mig-ff) and the drawn doors File it · Open the file; the marks in words
   are a filed file's; Review is "All the details…"; ‹ Jambo lets it go; the
   panel stands at the window's right edge from under the bar.
   Waits ask for the state, bounded; a missing part reports.
   Run: node test/chromium/import-jambo-panel-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { chromium } = require('playwright-core');
const H = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = process.env.HATI_SHOT_DIR || '';
let failures = 0;
const check = (name, pass, detail) => {
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
  if (!pass) failures++;
};
const shot = async (page, name) => { if (!OUT) return; try { await page.screenshot({ path: path.join(OUT, name + '.png') }); } catch (_) {} };
const body = (title, party) => `${title}\n\nThis Agreement is made between Highland Corporate Ltd and ${party}.\n`
  + `1. Scope. The parties agree to the terms set out below for the supply of goods and services.\n`
  + `2. Payment. Invoices are payable within thirty days of receipt.\n3. Law. This Agreement is governed by the laws of Kenya.\n`;

(async () => {
  const h = await H.startHati({ HATI_AGENTS_AUTO: 'off' });
  await H.seedWorkspace(h, { approvalRules: [] });
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hati-impj-'));
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const page = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
    page.on('pageerror', e => errors.push(e.message));
    const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
      while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
      return v; };
    const press = async (sel, what) => { if (!(await page.locator(sel).count())) { check(what + ' (nothing to press: ' + sel + ')', false); return false; } await page.locator(sel).first().click(); return true; };
    /* RE-POINTED 16 Nov 2026 (#762): with files in, the new look's Import is its one table (.mign-page); before, the empty page with its drop strip */
    const toImport = () => until(() => { if (!document.getElementById('mig-drop') && !document.querySelector('.mign-page')) { setView('migration'); return null; } return true; }, null, 8000);
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await until(() => window.state && state.contracts && state.contracts.some(c => c.id === 'MK-A2'), null, 20000);
    await page.keyboard.press('Escape').catch(() => {});
    await page.evaluate(() => { state.aiConfigured = false; });
    await toImport();
    const paths = Object.entries({ 'acme_supply.txt': body('SUPPLY AGREEMENT', 'Acme Ltd'), 'office_lease.txt': body('LEASE AGREEMENT', 'Riverside Properties Ltd'),
      'consultancy.txt': body('CONSULTANCY AGREEMENT', 'Mwangi Advisory LLP') }).map(([n, t]) => { const f = path.join(dir, n); fs.writeFileSync(f, t); return f; });
    await page.setInputFiles('#mig-files', paths);
    await until(() => { const M = window.migState && migState(); return M && M.queue.length === 3 && !M.running; }, null, 60000);
    /* one of the three is reviewed, so two of three are to check */
    await page.evaluate(() => { const c = migContracts()[0]; c.migration.needsReview = false; renderMigration(); });

    /* RE-POINTED 16 Nov 2026 (the new look is the only look, #762): Import's panel is Jambo's FIVE PARTS for the
       chosen file (migNlPanelFiveHtml in #ins-panel; CLAUDE.md "THE CHOSEN ROW'S PANELS"): the batch is said by its
       three numbers (filed of N · need you · parked), and "need you" — with the link "Check all N" — opens the check
       view on the files that wait; a file is always chosen (the first that needs you), its headline says what to
       do, what Jambo read stands as rows (an end date not read in amber), and its one black button is the file's
       own door (Fill in → the check view; Open the contract). The row's own word opens it (no double-click). */
    const SIDE = '#ins-panel';
    console.log('\n1 · Jambo says the batch');
    const batch = await until(sel => { const s = document.querySelector(sel); if (!s || !s.querySelector('.jov5-glance')) return null;
      return [...s.querySelectorAll('.jov5-glance .jov5-g')].map(g => g.textContent.replace(/\s+/g, ' ').trim()); }, SIDE, 6000);
    check('1a beside the list, Jambo says the batch in its numbers: 1 of 3 filed · 2 need you', !!batch && batch[0] === '1of 3 filed' && batch[1] === '2need you', JSON.stringify(batch));
    if (await page.locator(SIDE + ' [data-mign-checkall]').count()) {
      await page.locator(SIDE + ' [data-mign-checkall]').first().click();
      const ck = await until(() => document.getElementById('mig-ck-facts') ? migCheckIds().length : null, null, 4000);
      check('1b his "need you" door opens the check view on the two', ck === 2, String(ck));
      await page.evaluate(() => migCheckClose()); await toImport();
    } else check('1b his "need you" door ("Check all 2")', false, 'not drawn');
    await shot(page, 'import-jambo-batch-1440x780');

    console.log('\n2 · a press chooses a file');
    const pick = await page.evaluate(() => { const ids = migContracts().filter(x => x.migration.needsReview).map(c => c.id); const on = document.querySelector('.mign-table tr.is-picked');
      return ids.find(id => !on || on.getAttribute('data-row') !== id) || null; });
    if (pick && await press(`.mign-table tbody tr[data-row="${pick}"] td:nth-child(1)`, '2 the row')) {
      const f = await until(([id, sel]) => { const s = document.querySelector(sel); const tr = document.querySelector(`.mign-table tr[data-row="${id}"]`);
        if (!s || !tr || !tr.classList.contains('is-picked') || !s.querySelector('.jov5-title')) return null;
        const c = getContract(id);
        return { lit: document.querySelectorAll('.mign-table tr.is-picked').length, eb: (s.querySelector('.jov5-eb') || {}).textContent || '', file: c && c.migration ? (c.migration.file || c.upload && c.upload.name || '') : '',
          name: (s.querySelector('.jov5-title') || {}).textContent || '', facts: s.querySelectorAll('.jov5-group .jov5-row').length,
          need: s.querySelectorAll('.jov5-group .jov5-row .jov5-mk.is-amber').length,
          go: ((s.querySelector('.jov5-go') || {}).textContent || '').trim(), view: state.view }; }, [pick, SIDE], 4000);
      check('2a the row is lit (one row) and the page stays on Import', !!f && f.lit === 1 && f.view === 'migration', JSON.stringify(f && { lit: f.lit, view: f.view }));
      check('2b the panel says that file: "Check what I was unsure of." and what was read, as rows', !!f && f.name === 'Check what I was unsure of.' && f.facts >= 3 && /^Import · \S/.test(f.eb), JSON.stringify(f && { name: f.name, facts: f.facts, eb: f.eb }));
      check('2c a fact not found is amber', !!f && f.need >= 1, String(f && f.need));
      check('2e the file\'s own door: Fill in', !!f && f.go === 'Fill in', JSON.stringify(f && f.go));
      const filed = await page.evaluate(() => (migContracts().find(c => !c.migration.needsReview) || {}).id);
      await page.locator(`.mign-table tbody tr[data-row="${filed}"] td:nth-child(1)`).click();
      const marks = await until(([id, sel]) => { const tr = document.querySelector(`.mign-table tr[data-row="${id}"]`); if (!tr || !tr.classList.contains('is-picked')) return null;
        const li = [...document.querySelectorAll(sel + ' .jov5-group .jov5-row')].map(x => x.textContent.replace(/\s+/g, ' ').trim()); return li.length >= 3 ? { li, title: (document.querySelector(sel + ' .jov5-title') || {}).textContent } : null; }, [filed, SIDE], 4000);
      check('2d a filed file: what was read said in words, and that it was filed', !!marks && /^Filed/.test(marks.title || '') && marks.li.some(m => /Read whole/i.test(m)), JSON.stringify(marks));
      await page.locator(`.mign-table tbody tr[data-row="${pick}"] td:nth-child(1)`).click();
      await until(id => { const tr = document.querySelector(`.mign-table tr[data-row="${id}"]`); return tr && tr.classList.contains('is-picked') ? true : null; }, pick, 3000);
      await shot(page, 'import-jambo-file-1440x780');

      console.log('\n3 · the file\'s door');
      if (await press(SIDE + ' .jov5-go', '3a Fill in')) {
        const ck = await until(() => document.getElementById('mig-ck-facts') ? migCheckId() : null, null, 6000);
        check('3a Fill in in the panel opens the check view on that file', ck === pick, String(ck));
        await page.evaluate(() => migCheckClose()); await toImport();
      }
      /* RETIRED 16 Nov 2026 (#762): 3b "pressed again, the row is let go and Jambo says the batch" and 3c "‹ Jambo goes
         back to the batch" — old look only: the new look's Import panel always reads the chosen file (a file is chosen on
         arrival, migNlRender) and says the batch in its three numbers, so there is no batch-only face to go back to */

      console.log('\n4 · open');
      const filedId = await page.evaluate(() => (migContracts().find(x => !x.migration.needsReview) || {}).id);
      await page.locator(`.mign-table tbody tr[data-row="${filedId}"] td:nth-child(1)`).click();
      await until(id => { const tr = document.querySelector(`.mign-table tr[data-row="${id}"]`); return tr && tr.classList.contains('is-picked') ? true : null; }, filedId, 3000);
      if (await press(SIDE + ' .jov5-go', '4a Open the contract')) {
        const opened = await until(() => state.view !== 'migration' ? state.view : null, null, 6000);
        check('4a the panel\'s Open the contract opens the contract', !!opened, String(opened));
      }
      await toImport();
      /* RE-POINTED (#762): the row's own word — Open on a filed file — opens it; a row press only chooses */
      await until(sel => document.querySelector(sel), `.mign-table tbody tr[data-row="${filedId}"] [data-mign-go]`, 4000);
      if (await press(`.mign-table tbody tr[data-row="${filedId}"] [data-mign-go]`, '4b the row\'s Open')) {
        const opened2 = await until(() => state.view !== 'migration' ? state.view : null, null, 6000);
        check('4b the row\'s own Open opens it', !!opened2, String(opened2));
      }
      await toImport();
    } else check('2 a file to choose', false, 'none to check');

    console.log('\n5 · the owner\'s three screens');
    for (const [w, hh] of [[1440, 780], [1536, 730], [1366, 950]]) {
      await page.setViewportSize({ width: w, height: hh });
      await toImport(); await page.waitForTimeout(400);
      const fit = await page.evaluate(sel => { const s = document.querySelector(sel), m = document.querySelector('.mign-page .apn-card');
        if (!s || !m) return { none: true };
        const R = s.getBoundingClientRect(), M = m.getBoundingClientRect();
        return { beside: R.left >= M.right - 1 && Math.abs(R.top - M.top) < 12, inWin: R.right <= innerWidth + 1 && R.bottom <= innerHeight + 1 && R.top >= 0,
          sx: document.scrollingElement.scrollWidth > innerWidth, w: Math.round(R.width) }; }, SIDE);
      check(`5 at ${w}×${hh}: the panel beside the list, in the window, nothing sideways`, fit.beside && fit.inWin && !fit.sx, JSON.stringify(fit));
      await shot(page, `import-jambo-${w}x${hh}`);
    }
    check('no console errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } catch (e) {
    check('the run finished', false, e && e.message);
  } finally {
    await browser.close(); await h.stop();
  }
  console.log(failures ? `\n${failures} FAILED` : '\nALL PASS');
  process.exit(failures ? 1 : 0);
})();
