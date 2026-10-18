/* IMPORT, "THE SAP WAY" (round 22 of the redesign: the owner picked "The SAP
   way" by name, 17 Oct 2026; js/views/migration.js migShowSet, #mig-drop)

   WHAT THIS PINS, driven in a real browser on Import contracts
     1 each figure is a door: Need review narrows Migrated contracts to the
       ones it counts, and says how many of how many are shown
     2 pressed again (or the first figure, or the note's ×), the whole list is
       back
     3 the drop area is one strip, its Choose files at its end, and a press on
       it still opens the file chooser
     4 the owner's three screens: the figures, the strip and the list's head
       in view, nothing sideways
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
    const rows = () => [...document.querySelectorAll('.mig-table tbody [data-row]')].map(r => r.getAttribute('data-row'));
    const R0 = await page.evaluate(rows);

    /* ---- 1 a figure is a door ---- */
    const door = await page.$('[data-mig-show="review"]');
    if (door) await door.click();
    const R1 = await until(() => { const b = document.querySelector('.mig-kpi[data-mig-show="review"]'); if (!b || b.getAttribute('aria-pressed') !== 'true') return null;
      return { ids: [...document.querySelectorAll('.mig-table tbody [data-row]')].map(r => r.getAttribute('data-row')), note: (document.querySelector('.mig-shown') || {}).textContent || '' }; });
    const want = await page.evaluate(() => migContracts().filter(c => c.migration.needsReview).map(c => c.id).sort());
    check('1 Need review narrows the list to the ones it counts, and says how many of how many', !!R1 && JSON.stringify(R1.ids.slice().sort()) === JSON.stringify(want) && /2 of 3 shown/.test(R1.note),
      JSON.stringify({ R0, R1, want }));
    if (OUT) await page.screenshot({ path: path.join(OUT, 'import-sap-way-1440x780.png') });

    /* ---- 2 pressed again, the whole list ---- */
    if (door) await page.click('.mig-kpi[data-mig-show="review"]');
    const R2 = await until(n => { const ids = [...document.querySelectorAll('.mig-table tbody [data-row]')].map(r => r.getAttribute('data-row'));
      return ids.length === n && !document.querySelector('.mig-shown') ? ids : null; }, R0.length);
    check('2 pressed again, the whole list is back', !!R2, JSON.stringify(R2));

    /* ---- 3 the strip ---- */
    const D = await page.evaluate(() => { const d = document.getElementById('mig-drop'); const r = d && d.getBoundingClientRect(); const b = d && d.querySelector('.ui-btn');
      return d ? { h: Math.round(r.height), btn: b ? b.textContent.trim() : '', btnAtEnd: !!b && r.right - b.getBoundingClientRect().right < 40 } : null; });
    const chooser = await Promise.race([page.waitForEvent('filechooser', { timeout: 4000 }).then(() => true).catch(() => false), page.click('#mig-drop').then(() => new Promise(r => setTimeout(() => r(null), 4500)))]);
    check('3 the drop area is one strip, Choose files at its end, and a press still opens the chooser', !!D && D.h <= 90 && D.btn === 'Choose files' && D.btnAtEnd && chooser === true, JSON.stringify({ D, chooser }));

    /* ---- 4 the owner's three screens ---- */
    for (const [w, ht] of [[1440, 780], [1536, 730], [1366, 950]]) {
      await page.setViewportSize({ width: w, height: ht }); await page.waitForTimeout(400);
      await page.evaluate(() => { const c = document.getElementById('content-scroll') || document.scrollingElement; c.scrollTop = 0; });
      const F = await page.evaluate(() => { const r = s => { const e = document.querySelector(s); return e ? e.getBoundingClientRect() : null; };
        const k = r('#mig-kpis'), d = r('#mig-drop');
        return { figs: !!k && k.top >= 0, strip: !!d && d.bottom <= innerHeight, side: document.documentElement.scrollWidth <= innerWidth + 1 }; });
      check(`4 ${w}×${ht}: the figures and the strip in view, nothing sideways`, F.figs && F.strip && F.side, JSON.stringify(F));
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
