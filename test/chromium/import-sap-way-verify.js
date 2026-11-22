/* IMPORT, "THE SAP WAY" (round 22 of the redesign: the owner picked "The SAP
   way" by name, 17 Oct 2026; js/views/migration.js migShowSet, #mig-drop)

   WHAT THIS PINS, driven in a real browser on Import contracts
     1 each tab is a door: To check narrows the list to the ones it counts,
       and the foot says how many of how many are shown
     2 All brings the whole list back; the lit tab pressed again stays
     3 the drop area is one strip, its Choose files at its end, and a press on
       it still opens the file chooser
     4 the owner's three screens: the tab row, the strip and the list's head
       in view, nothing sideways
   RE-POINTED 19 Oct 2026 (lane E, round 22 built as drawn): the figure is
   "To check" (data-mig-show="check") over the batch's one list, and the
   list's foot says "N of M shown" (.mig-foot).
   RE-POINTED 21 Oct 2026 (Part 8, "every list page the Legora way", the
   owner's pick): the figures are the list head's TAB ROW
   ([data-lh-seat="migration"] [role=tab][data-mig-show]); a tab is a tab, so
   the whole list comes back on All, and the lit tab pressed again stays; the
   foot is the list head's "1–2 of 2" ([data-lh-foot="migration"]); the tab
   row stands where the figures did, in view at the three screens.
   Waits ask for the state, bounded; a missing part reports.
   Run: node test/chromium/import-sap-way-verify.js */
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
const body = (title, party) => `${title}\n\nThis Agreement is made between Highland Corporate Ltd and ${party}.\n`
  + `1. Scope. The parties agree to the terms set out below for the supply of goods and services.\n`
  + `2. Payment. Invoices are payable within thirty days of receipt.\n3. Law. This Agreement is governed by the laws of Kenya.\n`;

(async () => {
  const h = await H.startHati({ HATI_AGENTS_AUTO: 'off' });
  await H.seedWorkspace(h, { approvalRules: [] });
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hati-imp-'));
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const page = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
    page.on('pageerror', e => errors.push(e.message));
    const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
      while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
      return v; };
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await until(() => window.state && state.contracts && state.contracts.some(c => c.id === 'MK-A2'), null, 20000);
    await page.keyboard.press('Escape').catch(() => {});
    await page.evaluate(() => { state.aiConfigured = false; setView('migration'); });
    await until(() => !!document.getElementById('mig-drop'), null, 8000);
    const paths = Object.entries({ 'acme_supply.txt': body('SUPPLY AGREEMENT', 'Acme Ltd'), 'office_lease.txt': body('LEASE AGREEMENT', 'Riverside Properties Ltd'),
      'consultancy.txt': body('CONSULTANCY AGREEMENT', 'Mwangi Advisory LLP') }).map(([n, t]) => { const f = path.join(dir, n); fs.writeFileSync(f, t); return f; });
    await page.setInputFiles('#mig-files', paths);
    await until(() => { const M = window.migState && migState(); return M && M.queue.length === 3 && !M.running; }, null, 60000);
    /* one of the three is reviewed, so Need review counts two of three */
    await page.evaluate(() => { const c = migContracts()[0]; c.migration.needsReview = false; renderMigration(); });
    /* RE-POINTED 16 Nov 2026 (the new look is the only look, #762): with files in, Import is drawn as one
       table (migNlRender): its tabs Need you · Read · All ([data-mign-tab]), five figures over the list, each a
       press that shows its own files ([data-mign-fig], migNlFigsHtml), the table .mign-table, and Choose files
       the head's black button (#mign-choose) — the drop strip stands only on the empty page. The promises stand:
       a figure is a door whose number is the rows it shows; a tab is a tab (pressed again it stays), All brings
       the whole list back with the foot counting it; Choose files still opens the chooser; the three screens.
       RE-POINTED (P-33, owner's pick 20 Nov 2026: Import the Legora + Stripe way): the five figures are ONE batch bar
       (.mign-batch) whose legend words carry the figures' presses ([data-mign-fig]); the tabs are chips. */
    const ROWS = '.mign-table tbody tr[data-row]';
    const rows = sel => [...document.querySelectorAll(sel)].map(r => r.getAttribute('data-row'));
    await until(sel => document.querySelector(sel), ROWS, 8000);
    const R0 = await page.evaluate(rows, ROWS);

    /* ---- 1 a figure is a door ---- */
    /* the run's own last paint lands after migState().running goes false (it
       waits on the server first), so the figure is pressed BY NAME */
    const FIG = '[data-mign-fig="k:check"]';
    const TAB = k => `.mign-page [data-mign-tab="${k}"]`;
    const FOOT = '.mign-page .apn-foot';
    const door = await page.$(FIG);
    if (door) await page.click(FIG);
    const R1 = await until(([sel, rs]) => { const b = document.querySelector(sel); if (!b || b.getAttribute('aria-pressed') !== 'true') return null;
      /* RE-POINTED (P-33, owner's pick 20 Nov 2026: Import the Legora + Stripe way) */ /* the figure tiles became the batch bar's legend: the word says "N to check", its number leads it */
      return { ids: [...document.querySelectorAll(rs)].map(r => r.getAttribute('data-row')), n: parseInt(b.textContent.trim(), 10), legend: !!b.closest('.mign-batch .mign-bkey') }; }, [FIG, ROWS]);
    const want = await page.evaluate(() => migContracts().filter(c => c.migration.needsReview).map(c => c.id).sort());
    check('1 To check (the batch bar\'s legend word) narrows the list to the ones it counts, and its number is the rows it shows', !!R1 && R1.legend && JSON.stringify(R1.ids.slice().sort()) === JSON.stringify(want) && R1.n === want.length,
      JSON.stringify({ R0, R1, want }));
    if (OUT) await page.screenshot({ path: path.join(OUT, 'import-sap-way-1440x780.png') });

    /* ---- 2 a tab pressed again stays; All brings the whole list back ---- */
    if (await page.$(TAB('need'))) await page.click(TAB('need'));
    await until(sel => { const b = document.querySelector(sel); return b && b.classList.contains('is-on'); }, TAB('need'));
    const needN = await page.evaluate(rs => document.querySelectorAll(rs).length, ROWS);
    if (await page.$(TAB('need'))) await page.click(TAB('need'));
    await page.waitForTimeout(300);
    const stay = await page.evaluate(([sel, rs]) => { const b = document.querySelector(sel); return !!b && b.classList.contains('is-on') && document.querySelectorAll(rs).length; }, [TAB('need'), ROWS]);
    check('2a the lit tab pressed again stays where it is (a tab, not a toggle)', stay === want.length && stay === needN, String(stay));
    if (await page.$(TAB('all'))) await page.click(TAB('all'));
    /* RE-POINTED 21 Nov 2026 (P-33, as drawn): the table has no foot (the drawing draws none; "All N" says the count) —
       All brings the whole list back, its chip counting what it shows */
    const R2 = await until(([n, foot, rs, all]) => { const ids = [...document.querySelectorAll(rs)].map(r => r.getAttribute('data-row'));
      return ids.length === n && !document.querySelector(foot) && ((document.querySelector(all) || {}).textContent || '').replace(/\s+/g, ' ').trim() === `All ${n}` ? ids : null; }, [R0.length, FOOT, ROWS, TAB('all')]);
    check('2b All brings the whole list back', !!R2, JSON.stringify(R2));

    /* ---- 3 Choose files ---- */
    const D = await page.evaluate(() => { const b = document.getElementById('mign-choose'), hd = b && b.closest('.cun-head');
      return b ? { btn: b.textContent.trim(), btnAtEnd: !!hd && hd.getBoundingClientRect().right - b.getBoundingClientRect().right < 40 } : null; });
    const chooser = await Promise.race([page.waitForEvent('filechooser', { timeout: 4000 }).then(() => true).catch(() => false), page.click('#mign-choose').then(() => new Promise(r => setTimeout(() => r(null), 4500)))]);
    check('3 Choose files stands at the head\'s end, and a press still opens the chooser', !!D && D.btn === 'Choose files' && D.btnAtEnd && chooser === true, JSON.stringify({ D, chooser }));

    /* ---- 4 the owner's three screens ---- */
    for (const [w, ht] of [[1440, 780], [1536, 730], [1366, 950]]) {
      await page.setViewportSize({ width: w, height: ht }); await page.waitForTimeout(400);
      await page.evaluate(() => { const c = document.getElementById('content-scroll') || document.scrollingElement; c.scrollTop = 0; });
      const F = await page.evaluate(() => { const r = s => { const e = document.querySelector(s); return e ? e.getBoundingClientRect() : null; };
        const k = r('.mign-page .apn-bar'), d = r('#mign-choose');
        return { tabs: !!k && k.top >= 0 && k.bottom <= innerHeight, strip: !!d && d.top >= 0 && d.bottom <= innerHeight, side: document.documentElement.scrollWidth <= innerWidth + 1 }; });
      check(`4 ${w}×${ht}: the tab row and Choose files in view, nothing sideways`, F.tabs && F.strip && F.side, JSON.stringify(F));
      if (OUT) await page.screenshot({ path: path.join(OUT, `import-sap-way-${w}x${ht}.png`) });
    }
  } catch (e) { check('the stage ran to the end', false, e && e.stack); }
  finally {
    check('no page errors', !errors.length, errors.slice(0, 3).join(' | '));
    await browser.close(); await h.stop();
    console.log(failures ? `\n${failures} FAILED` : '\nALL PASSED');
    process.exit(failures ? 1 : 0);
  }
})();
