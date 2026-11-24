'use strict';
/* clauses-first-frame-verify — NO OLD PAGE IN BETWEEN (owner, 24 Nov 2026, the second time: "when I go from dossier to
   clauses, the older version of this tab flashes before I land on this tab … what can we do to stop you from doing this
   again?"; f1216 pins the source). Driven where the reader looks, in BOTH faces of the Clauses tab (the one-clause page
   and the neat list): the Clauses tab is pressed on the Dossier and EVERY animation frame after it is recorded for 1.5s —
   any frame that paints the list without its new dress (is-page / is-list) fails. Red at the parent: the list painted
   ~120ms undressed. Also the tabs as one switch: one grey track, the open tab a white pill. Each half guarded. */
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
  try {
    for (const face of ['list', 'page']) {
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 780 } });
      await ctx.addInitScript(f => { try { if (f === 'list') localStorage.setItem('hati.v1.thList', '1'); else localStorage.removeItem('hati.v1.thList'); } catch (_) {} }, face);
      const page = await ctx.newPage(); const errors = []; page.on('pageerror', e => errors.push(e.message));
      await page.goto(h.base + '/', { waitUntil: 'networkidle' });
      await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
      await until(page, () => !!(window.state && typeof currentUser === 'function' && currentUser() && typeof pdOpenOnHome === 'function' && getContract('DV-20')), null, 30000);
      await page.evaluate(() => pdOpenOnHome('DV-20', 'open'));
      const tab = await until(page, () => !!document.querySelector('#ig-dock > .igd-head [data-pd-tab="doc"]'), null, 15000);
      check(face + ': the Dossier draws its Clauses tab', tab);
      if (!tab) { await ctx.close(); continue; }
      if (face === 'list') {
        const sw = await page.evaluate(() => { const on = document.querySelector('#ig-dock > .igd-head > .pd-tab.on'), all = [...document.querySelectorAll('#ig-dock > .igd-head > .pd-tab')];
          if (!on) return null; const pill = getComputedStyle(on, '::before');
          return { track: all.every(t => getComputedStyle(t).backgroundColor === getComputedStyle(all[0]).backgroundColor && getComputedStyle(t).backgroundColor !== 'rgba(0, 0, 0, 0)'), pill: pill.backgroundColor, gaps: all.slice(1).map((t, i) => Math.round(t.getBoundingClientRect().left - all[i].getBoundingClientRect().right)) }; });
        check('the tabs sit on one grey track', sw && sw.track && sw.gaps.every(g => g === 0), JSON.stringify(sw));
        check('the open tab is a white pill', sw && sw.pill === 'rgb(255, 255, 255)', sw && sw.pill);
      }
      const frames = await page.evaluate(want => new Promise(res => { const out = [], t0 = performance.now();
        const snap = () => { const th = document.getElementById('pd-thread');
          const rows = th ? [...th.querySelectorAll('.doc-th-row')].some(r => r.getBoundingClientRect().height > 0) : false;
          if (th && rows) out.push(th.classList.contains(want) ? 1 : 0);
          if (performance.now() - t0 < 1500) requestAnimationFrame(snap); else res(out); };
        document.querySelector('#ig-dock > .igd-head [data-pd-tab="doc"]').click(); requestAnimationFrame(snap); }), face === 'list' ? 'is-list' : 'is-page');
      check(face + ': the Clauses tab paints its rows', frames.length > 0, frames.length + ' frames');
      check(face + ': no frame paints the old, undressed list', frames.length > 0 && frames.every(x => x === 1), frames.filter(x => !x).length + ' undressed of ' + frames.length);
      check(face + ': no page errors', errors.length === 0, errors.join(' | '));
      await ctx.close();
    }
  } catch (e) { check('the run completed', false, e.message); }
  finally { await browser.close(); await h.stop(); }
  const pass = results.filter(r => r.pass).length;
  console.log(`\n${pass}/${results.length} checks passed`);
  process.exit(pass === results.length ? 0 : 1);
})();
