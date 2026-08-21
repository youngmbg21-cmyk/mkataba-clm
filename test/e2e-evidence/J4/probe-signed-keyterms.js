/* Does the value-stream picker really stay live on a SIGNED contract?
   CLAUDE.md: "IT DOES NOT STAND DOWN ON A SIGNED CONTRACT, deliberately (D-1)
   ... Every OTHER key-terms row on that contract has stood down — measured,
   0 of 7." My J4 sweep found NO [data-kt-row] at all on a signed contract, so
   this settles which is true. */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('/home/user/mkataba-clm/test/helpers');
const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
(async () => {
  const h = await startHati(); const W = await seedWorkspace(h); const A = W.admin;
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const page = await (await browser.newContext({ viewport: { width: 1500, height: 1000 } })).newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(h.base + '/', { waitUntil: 'networkidle' }); await page.waitForTimeout(500);
  await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
  await page.waitForTimeout(2600);

  for (const id of ['MK-A2', 'MK-A1']) {          // A2 = Under Review, A1 = seeded Signed
    await page.evaluate(cid => { state.activeId = cid; state.selId = cid; setView('workspace'); }, id);
    await page.waitForTimeout(1600);
    await page.click('[data-ws-tab="terms"]');
    await page.waitForTimeout(1600);
    const r = await page.evaluate(() => {
      const rows = [...document.querySelectorAll('[data-kt-row]')];
      const streamRow = rows.find(x => /stream|folder/i.test(x.getAttribute('data-kt-row') || ''))
        || [...document.querySelectorAll('*')].find(n => n.childElementCount < 6 && /Value stream/i.test(n.textContent || ''));
      const picker = document.querySelector('#kt-folder, [data-kt-folder], select[data-kt="folder"]');
      const c = getContract(state.activeId);
      return { status: c.status, executed: !!(window.negoExecuted ? negoExecuted(c) : c.status === 'Signed'),
        rowCount: rows.length, rowKeys: rows.map(x => x.getAttribute('data-kt-row')),
        streamRowText: streamRow ? streamRow.textContent.replace(/\s+/g, ' ').trim().slice(0, 90) : null,
        pickerPresent: !!picker,
        pickerVisible: picker ? (() => { const b = picker.getBoundingClientRect(); return b.width > 4 && b.height > 4; })() : false,
        ktPanelPresent: !!document.querySelector('#kt-side, .terms-grid, #view-workspace [data-kt-row]') };
    });
    console.log(`\n=== ${id} (${r.status}, executed=${r.executed}) ===`);
    console.log('  Key terms panel present :', r.ktPanelPresent);
    console.log('  [data-kt-row] count     :', r.rowCount, r.rowKeys.join(','));
    console.log('  value-stream row text   :', r.streamRowText);
    console.log('  stream picker present   :', r.pickerPresent, ' visible:', r.pickerVisible);
  }
  console.log('\npage errors:', errs.length ? errs.join(' | ') : 'none');
  await browser.close(); await h.stop();
})();
