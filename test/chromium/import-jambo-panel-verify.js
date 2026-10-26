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
    const toImport = () => until(() => { if (!document.getElementById('mig-drop')) { setView('migration'); return null; } return true; }, null, 8000);
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

    console.log('\n1 · Jambo says the batch');
    const batch = await until(() => { const s = document.getElementById('mig-side'); if (!s) return null;
      const t = s.textContent.replace(/\s+/g, ' ').trim();
      return /3 files are in this batch/.test(t) ? { t } : null; }, null, 6000);
    check('1a beside the list, Jambo says the batch in words', !!batch && /These need you: 2 to check/.test(batch.t), batch && batch.t.slice(0, 160));
    /* RE-POINTED 26 Oct 2026 (owner: "Build Jambo's Overview tab The Legora Way"): his chips are the Overview's offers under "Ask me", verb first with a capital */
    const chip = await page.evaluate(() => [...document.querySelectorAll('#mig-side .jov-lnk.is-ask')].findIndex(b => /^check the 2 files$/i.test(b.textContent.trim())));
    if (chip >= 0){
      await page.locator('#mig-side .jov-lnk.is-ask').nth(chip).click();
      const ck = await until(() => document.getElementById('mig-ck-facts') ? migCheckIds().length : null, null, 4000);
      check('1b his chip "check the 2 files" opens the check view on the two', ck === 2, String(ck));
      await page.evaluate(() => migCheckClose()); await page.evaluate(() => migPickSet(null));
    } else check('1b his chip "check the 2 files"', false, 'not drawn');
    await shot(page, 'import-jambo-batch-1440x780');

    console.log('\n2 · a press chooses a file');
    const pick = await page.evaluate(() => { const c = migContracts().find(x => x.migration.needsReview); return c ? c.id : null; });
    if (pick && await press(`.mig-table tbody tr[data-row="${pick}"] td:nth-child(1)`, '2 the row')) {
      const f = await until(id => { const s = document.getElementById('mig-side'); const tr = document.querySelector(`.mig-table tr[data-row="${id}"]`);
        if (!s || !tr || !tr.classList.contains('is-picked')) return null;
        return { lit: tr.getAttribute('aria-selected'), name: (s.querySelector('.mig-cf-t') || {}).textContent || '', facts: s.querySelectorAll('.mig-ff').length,
          need: s.querySelectorAll('.mig-ff.is-need').length,
          doors: [...s.querySelectorAll('.mig-cf-acts button')].map(b => b.textContent.trim()), view: state.view }; }, pick, 4000);
      check('2a the row is lit and the page stays on Import', !!f && f.lit === 'true' && f.view === 'migration', JSON.stringify(f && { lit: f.lit, view: f.view }));
      check('2b the panel says that file: "Check this file" and the facts it is filed with', !!f && f.name === 'Check this file' && f.facts >= 6, JSON.stringify(f && { name: f.name, facts: f.facts }));
      check('2c a fact not found is amber', !!f && f.need >= 1, String(f && f.need));
      check('2e the drawn doors: File it and Open the file', !!f && f.doors.includes('File it') && f.doors.includes('Open the file'), JSON.stringify(f && f.doors));
      const filed = await page.evaluate(() => (migContracts().find(c => !c.migration.needsReview) || {}).id);
      await page.evaluate(id => migPickSet(id), filed);
      const marks = await until(() => { const li = [...document.querySelectorAll('#mig-side .mig-sms li')].map(x => x.textContent.replace(/\s+/g, ' ').trim()); return li.length >= 5 ? li : null; }, null, 4000);
      check('2d the marks are said in words (a filed file)', !!marks && marks.some(m => /missing|done/.test(m)), JSON.stringify(marks));
      await page.evaluate(id => migPickSet(id), pick);
      await shot(page, 'import-jambo-file-1440x780');

      console.log('\n3 · Review, and letting it go');
      if (await press('#mig-side [data-mig-review-full]', '3a All the details…')) {
        const dlg = await until(() => { const m = document.querySelector('#modal-root .modal, .modal-backdrop, [role="dialog"]'); return m && m.textContent.length > 20 ? true : null; }, null, 6000);
        check('3a "All the details…" in the panel opens the whole review window', !!dlg);
        await page.keyboard.press('Escape').catch(() => {}); await page.evaluate(() => { if (typeof closeModal === 'function') closeModal(); });
      }
      await page.locator(`.mig-table tbody tr[data-row="${pick}"] td:nth-child(1)`).click();
      const let1 = await until(id => { const tr = document.querySelector(`.mig-table tr[data-row="${id}"]`); const s = document.getElementById('mig-side');
        return tr && !tr.classList.contains('is-picked') && s && /in this batch/.test(s.textContent) ? true : null; }, pick, 4000);
      check('3b pressed again, the row is let go and Jambo says the batch', !!let1);
      await page.locator(`.mig-table tbody tr[data-row="${pick}"] td:nth-child(1)`).click();
      await until(() => document.querySelector('.mig-table tr.is-picked') ? true : null, null, 3000);
      if (await press('#mig-side [data-jl-home]', '3c ‹ Jambo')) {
        const back = await until(() => !document.querySelector('.mig-table tr.is-picked') && /in this batch/.test(document.getElementById('mig-side').textContent) ? true : null, null, 3000);
        check('3c "‹ Jambo" goes back to the batch', !!back);
      }

      console.log('\n4 · open');
      await page.evaluate(() => { const c = migContracts().find(x => !x.migration.needsReview); if (c) migPickSet(c.id); });
      if (await press('#mig-side .mig-cf-acts [data-open]', '4a Open')) {
        const opened = await until(() => state.view !== 'migration' ? state.view : null, null, 6000);
        check('4a the panel\'s Open opens the contract', !!opened, String(opened));
      }
      await toImport();
      await page.locator(`.mig-table tbody tr[data-row="${pick}"] td:nth-child(1)`).dblclick();
      const opened2 = await until(() => state.view !== 'migration' ? state.view : null, null, 6000);
      check('4b a double-click on a row opens it', !!opened2, String(opened2));
      await toImport();
    } else check('2 a file to choose', false, 'none to check');

    console.log('\n5 · the owner\'s three screens');
    for (const [w, hh] of [[1440, 780], [1536, 730], [1366, 950]]) {
      await page.setViewportSize({ width: w, height: hh });
      await toImport(); await page.waitForTimeout(250);
      await page.evaluate(id => { if (id) migPickSet(id); }, pick);
      await page.waitForTimeout(150);
      const fit = await page.evaluate(() => { const s = document.getElementById('mig-side'), m = document.querySelector('.mig-list');
        const R = s.getBoundingClientRect(), M = m.getBoundingClientRect(), P = document.getElementById('page-head').getBoundingClientRect();
        return { beside: R.left >= M.right - 1 && Math.abs(R.top - P.top) < 12 /* the floating panel stands 8px in (THE LEGORA LOOK, 23 Oct 2026) */, inWin: R.right <= innerWidth && R.bottom <= innerHeight + 1 && R.top >= 0,
          sx: document.scrollingElement.scrollWidth > innerWidth, w: Math.round(R.width) }; });
      check(`5 at ${w}×${hh}: the panel beside the list, in the window, nothing sideways`, fit.beside && fit.inWin && !fit.sx, JSON.stringify(fit));
      await shot(page, `import-jambo-${w}x${hh}`);
      await page.evaluate(() => migPickSet(null));
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
