/* Chromium verification: JAMBO READS A CONTRACT ONCE (owner's yes to the drawing "Read once", 27 Nov 2026).
   ============================================================
   A file dropped on Jambo's panel lands on its Plan tab with nothing read (no AI route called) and no notes beside the
   paper; a suggested plan is offered; Read with this plan runs ONE read — the arrival reading first, then the clause
   read with the plan — and only then do the notes come beside the paper and the plan answer its lines. The model is
   stood in for. Every wait asks for a state, bounded; a missing part reports, never times out.

   Run: node test/chromium/read-once-verify.js */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const results = [];
const check = (name, pass, detail) => { results.push({ name, pass: !!pass }); console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + JSON.stringify(detail) : ''}`); };
const until = async (page, fn, arg, ms = 8000) => { const t = Date.now(); while (Date.now() - t < ms) { const v = await page.evaluate(fn, arg).catch(() => null); if (v) return v; await new Promise(r => setTimeout(r, 120)); } return null; };
const LEASE = `OFFICE LEASE AGREEMENT\n\nThis Office Lease Agreement is made between Highland Corporate Ltd (the "Tenant") and Westlands Properties Ltd (the "Landlord").\n\n1. Premises\nThe Landlord lets to the Tenant the offices on the fourth floor of Westlands Tower, Nairobi.\n\n2. Term\nThe term is three (3) years from the start date and may be renewed by written agreement.\n\n3. Rent\nThe Tenant shall pay rent of KES 450,000 per month in advance on the first day of each month. The rent may be reviewed once a year.\n\n4. Repairs\nThe Landlord keeps the structure and common areas in repair. The Tenant keeps the interior in good order.\n\n5. Termination\nEither party may terminate on six (6) months written notice.\n\n6. Governing Law\nThis Agreement is governed by the laws of Kenya.\n`;

(async () => {
  const h = await startHati();
  await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  const calls = [];
  await page.route('**/api/ai/**', async r => {
    const u = r.request().url(), name = u.replace(/.*\/api\/ai\//, '').split('?')[0]; if (name !== 'usage') calls.push(name);
    const b = JSON.parse(r.request().postData() || '{}');
    if (name === 'breakdown') return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ head: 'Office lease', regions: [{ name: 'Lease' }],
      points: [{ region: 1, title: 'Leaving early', quote: 'six (6) months written notice', clause: '5', status: 'look', plan: 1 }], plan: b.plan || [] }) });
    if (name === 'obligations') return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [] }) });
    if (name === 'playbook') return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ verdicts: [] }) });
    return r.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });
  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await until(page, () => typeof window.pdDropTake === 'function' && !!window.REMOTE && !!window.REMOTE.me, null, 12000);
    await page.evaluate(() => { state.aiConfigured = true; });
    const n0 = await page.evaluate(() => state.contracts.length);
    await page.evaluate(t => pdDropTake(new File([t], 'Office Lease.txt', { type: 'text/plain' })), LEASE);
    const A = await until(page, n0 => state.contracts.length > n0 && document.querySelector('#ig-dock .pd2-plan') ? { tab: pdTab(), face: document.querySelector('#ig-dock .pd2-plan').getAttribute('data-pd2-plan'), notes: document.querySelectorAll('#pd2-notes > *').length, id: state.contracts[0].id } : null, n0, 15000);
    check('1a a dropped file lands on its Plan tab, before Jambo reads', !!A && A.tab === 'plan' && A.face === 'none', A);
    check('1b nothing is read on arrival: no AI route called', calls.length === 0, calls);
    check('1c no notes beside the clean paper', !!A && A.notes === 0, A);
    const sug = await page.evaluate(() => document.querySelectorAll('#ig-dock .pd2-ro-pl').length);
    check('1d a suggested plan is offered, with Read with this plan', sug >= 1 && await page.evaluate(() => !!document.querySelector('[data-pd2-plan-usesug]')), { sug });
    if (A){
      await page.click('[data-pd2-plan-usesug]');
      const R = await until(page, () => document.querySelector('#ig-dock .pd2-plan.is-reading') ? true : null, null, 4000);
      check('2a the read shows its progress in the panel', !!R);
      const D = await until(page, id => !readOnceBusy(getContract(id)) ? { notes: document.querySelectorAll('#pd2-notes > *').length, found: document.querySelectorAll('#ig-dock .pd2-fd-row').length } : null, A.id, 20000);
      check('2b the arrival reading ran before the clause read', calls.indexOf('breakdown') > calls.indexOf('brief') && calls.indexOf('brief') >= 0, calls);
      check('2c one clause read, no second', calls.filter(x => x === 'breakdown').length === 1, calls);
      check('2d the notes come beside the paper and the plan is answered', !!D && D.notes > 0 && D.found > 0, D);
    }
    check('no page errors', errors.length === 0, errors.slice(0, 3));
  } catch (e) { check('ran to the end', false, String(e && e.message || e).slice(0, 300)); }
  await browser.close(); await h.stop();
  const bad = results.filter(r => !r.pass);
  console.log(`\n${results.length - bad.length}/${results.length} passed`);
  process.exit(bad.length ? 1 : 0);
})();
