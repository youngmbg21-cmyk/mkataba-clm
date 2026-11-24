'use strict';
/* dossier-back-to-place-verify — BACK TO WHERE YOU WERE (owner, 24 Nov 2026: "when I press on these links and come back to
   the dossier, the panel moves me back to the top … I need to be moved where I was"; f1205 pins the source).
   Driven where the reader looks: the Dossier scrolled down to What stands, a row pressed (the deal's, then the duties'),
   the page's way back pressed — the panel stands where it stood. Red at the parent: it came back at 0.
   Each half guarded: a missing feature reports, it does not time out. */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati } = require('../helpers');
const { seedDiscoverWorld } = require('../discover-world');
const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const results = [];
const check = (name, pass, detail) => { results.push({ name, pass: !!pass }); console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`); };
const until = async (page, fn, arg, ms = 8000) => { try { await page.waitForFunction(fn, arg, { timeout: ms }); return true; } catch (_) { return false; } };
const TXT = ['DEPOT LEASE', '1. Premises', 'The Landlord lets to the Tenant the depot known as Plot 14.', '2. Term', 'The lease runs for five years from 1 March 2024.',
  '3. Rent', 'The rent is KES 48,000,000 a year, paid quarterly in advance.', '4. Late payment', 'Rent unpaid for seven days bears interest at 4% a month.',
  '5. Use', 'The Tenant may use the Premises as a distribution depot.', '6. Repairs', 'The Tenant keeps the whole of the Premises in repair.'].join('\n\n');
(async () => {
  const h = await startHati(); const W = await seedDiscoverWorld(h);
  await W.admin.json('/api/settings', { method: 'PUT', body: { approvalRules: [] } }).catch(() => {});
  await W.admin.json('/api/contracts/DV-20', { method: 'PUT', body: { baseVersion: 0, contract: { id: 'DV-20', name: 'Depot Lease', counterparty: 'Tatu City', folder: 'corp', status: 'Draft', value: 48000000, expiry: '2029-02-28', valueType: 'standard', template: 'RM', fields: {}, metadata: { value: 48000000, currency: 'KES' }, comments: [], audit: [], signatures: [], format: 'text', redlineText: TXT } } });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await until(page, () => !!(window.state && typeof currentUser === 'function' && currentUser() && typeof pdOpenOnHome === 'function' && getContract('DV-20')), null, 30000);
    await page.evaluate(async () => { const c = getContract('DV-20'); try { await ensureFull(c); } catch (_) {}
      c.obligations = [{ id: 'o1', title: 'Pay rent quarterly', due: '2030-12-01', whose: 'us', status: 'open' }, { id: 'o2', title: 'Refund premium', due: '2031-01-15', whose: 'us', status: 'open' }];
      try { persist(c); } catch (_) {} pdOpenOnHome('DV-20', 'open'); });
    const up = await until(page, () => !!document.querySelector('#ig-dock [data-pd2-ws] [data-pd2-dl-open]'), null, 15000);
    check('the Dossier draws What stands', up);
    const feedTop = () => page.evaluate(() => { const f = document.getElementById('igd-feed'); return f ? Math.round(f.scrollTop) : null; });
    for (const [sel, name] of [['[data-pd2-dl-open]', 'the deal\'s row'], ['[data-pd2-dtc]', 'the duties\' row']]) {
      if (!up) break;
      const before = await page.evaluate(s => { const f = document.getElementById('igd-feed'), r = document.querySelector('#ig-dock ' + s);
        if (!f || !r) return null; f.scrollTop = 0; f.scrollTop = Math.max(0, r.getBoundingClientRect().top - f.getBoundingClientRect().top - 120); return Math.round(f.scrollTop); }, sel);
      await page.waitForTimeout(200);
      check(name + ': the panel is scrolled down first', before > 20, 'scrollTop ' + before);
      await page.click('#ig-dock ' + sel);
      const mid = await until(page, () => !!document.querySelector('[data-dlg-page]'), null, 8000);
      check(name + ' opens its page in the middle', mid);
      const back = await page.evaluate(() => { const b = document.querySelector('[data-dlg-page] [data-pd-mid-back], [data-pd-mid-back]'); if (b) { b.click(); return true; } return false; });
      const home = back && await until(page, () => { const g = document.getElementById('pd-glance'); return !!(g && !/(^|\s)is-/.test(g.className) && !document.querySelector('[data-dlg-page]')); }, null, 8000);
      check(name + ': the way back returns to the Dossier', home);
      await page.waitForTimeout(300);
      const after = await feedTop();
      check(name + ': the panel stands where it stood', home && Math.abs(after - before) <= 2, `before ${before}, after ${after}`);
    }
    check('no page errors', errors.length === 0, errors.join(' | '));
  } catch (e) { check('the run completed', false, e.message); }
  finally { await browser.close(); await h.stop(); }
  const pass = results.filter(r => r.pass).length;
  console.log(`\n${pass}/${results.length} checks passed`);
  process.exit(pass === results.length ? 0 : 1);
})();
