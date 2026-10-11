/* Chromium verification: CHOOSING THE CONTRACT IS THE ONE PRESS (owner, 11 Oct
   2026: "when i choose a contract in the breakdown tab, i then get another
   Button to break it down ... Choosing the contract should be the only press
   needed to break it down").

   1 the picker says the cost before the press (Copilot's place: cost visible)
   2 a pick alone reads the contract ONCE and draws the regions — no second
     button between the pick and the table
   3 a refusal is said and offers Try again, and is never retried in a loop

   The Copilot route is stubbed in the page (window.api), so nothing is spent.
   Run: node test/chromium/breakdown-pick-reads-verify.js */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let pass = 0, fail = 0;
const ok = (name, good, detail) => { good ? pass++ : fail++;
  console.log(`${good ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`); };
const iso = n => new Date(Date.now() + n * 864e5).toISOString();
const deal = (id, name) => ({ id, contractNo: id, name, counterparty: 'Juno Limited', folder: 'proc', value: 900000, valueType: 'standard',
  status: 'Under Review', template: 'RM', lastAction: '1 Oct 2026', expiry: '2029-06-30', hash: null, signedAt: null,
  fields: {}, metadata: { value: 900000, currency: 'KES' }, comments: [], signatures: [], obligations: [], rounds: [],
  audit: [{ at: iso(-6), user: 'System', action: 'Created', detail: 'fixture' }], changes: [],
  body: '<h2>1. Term</h2><p>' + 'The agreement runs for two years from signature. '.repeat(6) + '</p><h2>2. Payment</h2><p>'
    + 'Invoices are paid within thirty days of receipt. '.repeat(6) + '</p>' });

(async () => {
  const h = await startHati();
  await seedWorkspace(h, { contracts: [deal('MK-B1', 'Haulage One'), deal('MK-B2', 'Haulage Two')], approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errs = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    page.on('pageerror', e => errs.push(e.message));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await page.waitForFunction(() => typeof getContract === 'function' && !!getContract('MK-B1') && !!getContract('MK-B2'), null, { timeout: 15000 });
    await page.evaluate(() => {
      state.aiConfigured = true;
      window.__bd = { n: 0, refuse: false };
      const o = window.api;
      window.api = async function (p, ...a){
        if (p !== 'ai/breakdown') return o.call(this, p, ...a);
        window.__bd.n++;
        if (window.__bd.refuse) return { error: 'Jambo found no regions in this wording.' };
        return { head: 'Fix one', sub: 'Start with payment.', links: [],
          regions: [{ name: 'Payment', clauses: '2', status: 'need', kind: 'pay', headline: 'You pay in thirty days', items: [{ ref: '2', title: 'Payment', status: 'need' }], quotes: [] },
            { name: 'Term', clauses: '1', status: 'fine', kind: 'protect', headline: 'Two years', items: [{ ref: '1', title: 'Term', status: 'fine' }], quotes: [] }] };
      };
      setView('dashboard'); hbSetFace('breakdown');
    });
    const picker = await page.waitForSelector('#hb-bd .ig-pick-card', { timeout: 8000 }).then(() => true, () => false);
    const sub = picker ? await page.evaluate(() => document.querySelector('#hb-bd .ig-pick-sub').innerText) : '';
    ok('1 the picker says the cost before the press', /Jambo once/.test(sub), sub);

    if (picker) {
      await page.click('#hb-bd [data-bd-pick="MK-B1"]');
      const drawn = await page.waitForSelector('#hb-bd .bd-table', { timeout: 8000 }).then(() => true, () => false);
      const r = await page.evaluate(() => ({ n: window.__bd.n, rows: document.querySelectorAll('#hb-bd .bd-table tbody tr').length,
        runBtn: !!document.querySelector('#hb-bd .bd-empty [data-bd-run]') }));
      ok('2 a pick alone reads the contract once and draws its regions', drawn && r.n === 1 && r.rows === 2 && !r.runBtn, JSON.stringify(r));

      await page.evaluate(() => { window.__bd.refuse = true; window.__bd.n = 0; });
      await page.click('#hb-bd [data-bd-pick-again]');
      await page.waitForSelector('#hb-bd [data-bd-pick="MK-B2"]', { timeout: 5000 });
      await page.click('#hb-bd [data-bd-pick="MK-B2"]');
      const said = await page.waitForSelector('#hb-bd .bd-err', { timeout: 8000 }).then(() => true, () => false);
      await page.waitForFunction(() => !document.querySelector('#hb-bd [aria-live]'), null, { timeout: 3000 }).catch(() => {});
      const f = await page.evaluate(() => ({ n: window.__bd.n, err: (document.querySelector('#hb-bd .bd-err') || {}).innerText || null,
        again: !!document.querySelector('#hb-bd [data-bd-run]') }));
      ok('3 a refusal is said once, with Try again, and never retried in a loop', said && f.n === 1 && !!f.err && f.again, JSON.stringify(f));
    } else {
      ok('2 a pick alone reads the contract once and draws its regions', false, 'no picker on the Breakdown face');
      ok('3 a refusal is said once, with Try again, and never retried in a loop', false, 'no picker on the Breakdown face');
    }
    ok('4 no page errors', errs.length === 0, errs.join(' | ').slice(0, 300));
  } finally { await browser.close(); await h.stop(); }
  console.log(`${pass}/${pass + fail} checks passed`);
  process.exit(fail ? 1 : 0);
})();
