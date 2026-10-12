/* Chromium verification: STAKES — Home's Clauses tab carries the deep read
   (owner picked "Stakes" by name, 13 Oct 2026; one company view).

   1 with no reading, the tab offers "Read the deal" and says the cost first
   2 one press reads once; the head says the points and draws the region ribbon
   3 each point stands under its clause as ONE company line with a Deep dive door;
     a point about something missing stands under "Not in the contract"
   4 Deep dive opens its own panel (title, cost, what we should get, our edge,
     the ask) and repeats none of the contract's wording
   5 ‹ › walk the points; Back and Esc return to the same list
   6 a refusal is said where the reader looks, never silent
   7 no page errors

   The Jambo route is stubbed in the page (window.api), so nothing is spent.
   Run: node test/chromium/stakes-verify.js */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let pass = 0, fail = 0;
const ok = (name, good, detail) => { good ? pass++ : fail++;
  console.log(`${good ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`); };
const iso = n => new Date(Date.now() + n * 864e5).toISOString();
const PAY = 'Invoices are paid within thirty days of receipt. ';
const deal = (id, name) => ({ id, contractNo: id, name, counterparty: 'Juno Limited', folder: 'proc', value: 900000, valueType: 'standard',
  status: 'Under Review', template: 'RM', lastAction: '1 Oct 2026', expiry: '2029-06-30', hash: null, signedAt: null,
  fields: {}, metadata: { value: 900000, currency: 'KES' }, comments: [], signatures: [], obligations: [], rounds: [],
  audit: [{ at: iso(-6), user: 'System', action: 'Created', detail: 'fixture' }], changes: [],
  body: '<h2>1. Term</h2><p>' + 'The agreement runs for two years from signature. '.repeat(6) + '</p><h2>2. Payment</h2><p>'
    + PAY.repeat(6) + '</p><h2>3. Liability</h2><p>' + 'Liability is capped at the fees paid in the last three months. '.repeat(5) + '</p>' });

(async () => {
  const h = await startHati();
  await seedWorkspace(h, { contracts: [deal('MK-S1', 'Haulage Stakes'), deal('MK-S2', 'Haulage Refused')], approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errs = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
    page.on('pageerror', e => errs.push(e.message));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await page.waitForFunction(() => typeof getContract === 'function' && !!getContract('MK-S1'), null, { timeout: 15000 });
    await page.evaluate(() => {
      state.aiConfigured = true;
      window.__bd = { n: 0, refuse: false };
      const o = window.api;
      window.api = async function (p, ...a){
        if (p !== 'ai/breakdown') return o.call(this, p, ...a);
        window.__bd.n++;
        if (window.__bd.refuse) return { error: 'Jambo found no regions in this wording.' };
        return { head: 'Fix the cap first', sub: 'Their cover stops at three months of fees.', links: [],
          regions: [{ name: 'Money', status: 'look', kind: 'pay', headline: 'Thirty days', items: [{ ref: '2', title: 'Payment' }], quotes: [] },
            { name: 'Risk', status: 'need', kind: 'protect', headline: 'A small cap', items: [{ ref: '3', title: 'Liability' }], quotes: [] }],
          points: [
            { clause: '3', region: 2, status: 'need', missing: false, title: 'Their liability is capped at three months of fees', stake: 'Their cover stops at KES 225,000, far below the risk.',
              what: 'A single failure could cost us far more than the cap.', theirs: 'Three months of fees.', usual: 'Twelve months of fees.', figure: 'KES 675,000',
              how: '12 months less 3 months of fees.', push: 'They will say the fees are small.', edge: ['Ask for a mutual cap tied to a year of fees.'],
              trade: [{ give: 'Accept twelve months', get: 'Data breach outside the cap' }], ask: 'Each party’s liability shall not exceed the fees payable in the 12 months before the claim.',
              quote: 'Liability is capped at the fees paid in the last three months.', links: [2] },
            { clause: '', after: '2', region: 1, status: 'look', missing: true, title: 'No notice before a price rise', stake: 'Prices could rise with no warning.',
              what: 'Nothing says how much notice we get.', theirs: 'Nothing.', usual: '90 days of notice.', figure: '', how: 'No figure in the wording.',
              push: '', edge: ['Ask for 90 days of notice.'], trade: [], ask: '', quote: '', links: [1] }] };
      };
      setView('dashboard');
      pdOpenOnHome('MK-S1', 'doc');
    });
    const listed = await page.waitForSelector('#pd-thread .doc-th-row', { timeout: 10000 }).then(() => true, () => false);
    const e1 = await page.evaluate(() => ({ btn: !!document.querySelector('#pd-thread [data-stk-run]'), cost: (document.querySelector('#pd-thread .stk-cost') || {}).innerText || '', n: window.__bd.n }));
    ok('1 with no reading the tab offers Read the deal and says the cost first', listed && e1.btn && /Jambo once/.test(e1.cost) && e1.n === 0, JSON.stringify(e1));

    if (e1.btn) {
      await page.click('#pd-thread [data-stk-run]');
      const read = await page.waitForSelector('#pd-thread .stk-line', { timeout: 8000 }).then(() => true, () => false);
      const e2 = await page.evaluate(() => ({ n: window.__bd.n, count: (document.querySelector('#pd-thread .stk-count') || {}).innerText || '',
        ribbon: document.querySelectorAll('#pd-thread .stk-ribbon i').length }));
      ok('2 one press reads once; the head says the points and draws the ribbon', read && e2.n === 1 && /2 points/.test(e2.count) && /1 need you/.test(e2.count) && e2.ribbon === 2, JSON.stringify(e2));

      const e3 = await page.evaluate(() => {
        const rows = [...document.querySelectorAll('#pd-thread .doc-th-row')];
        const under = rows.find(r => r.querySelector('.stk-line'));
        const miss = document.querySelector('#pd-thread .stk-miss');
        return { underName: under ? under.querySelector('.doc-th-name').innerText : null, lines: document.querySelectorAll('#pd-thread .doc-th-row .stk-line').length,
          missH: miss ? miss.querySelector('.stk-miss-h').innerText : null, doors: document.querySelectorAll('#pd-thread [data-stk-dive]').length };
      });
      ok('3 a point stands under its clause; a missing one under Not in the contract', /^3\b/.test(e3.underName || '') && e3.lines === 1 && /Not in the contract \(1\)/.test(e3.missH || '') && e3.doors === 2, JSON.stringify(e3));

      if (process.env.STK_SHOT) await page.screenshot({ path: process.env.STK_SHOT + '-list.png' });
      await page.click('#pd-thread .doc-th-row [data-stk-dive="0"]');
      const dived = await page.waitForSelector('#pd-thread .stk-dv h3', { timeout: 4000 }).then(() => true, () => false);
      const e4 = await page.evaluate(() => {
        const dv = document.querySelector('#pd-thread .stk-dv'); const t = dv ? dv.innerText : '';
        const listShown = [...document.querySelectorAll('#pd-thread .doc-th-rows')].some(el => el.offsetParent !== null);
        return { title: (dv.querySelector('h3') || {}).innerText, fig: (dv.querySelector('.stk-fig') || {}).innerText, edge: !!dv.querySelector('.stk-edge li'),
          ask: !!dv.querySelector('.stk-ask'), usual: /Twelve months of fees/.test(t), wording: /fees paid in the last three months/.test(t), listShown };
      });
      if (process.env.STK_SHOT) await page.screenshot({ path: process.env.STK_SHOT + '-dive.png' });
      ok('4 Deep dive opens its own panel and repeats none of the contract wording', dived && /capped/.test(e4.title || '') && e4.fig === 'KES 675,000' && e4.edge && e4.ask && e4.usual && !e4.wording && !e4.listShown, JSON.stringify(e4));

      await page.click('#pd-thread .stk-pg [data-stk-dive="1"]');
      const t2 = await page.evaluate(() => (document.querySelector('#pd-thread .stk-dv h3') || {}).innerText || '');
      await page.click('#pd-thread [data-stk-back]');
      const back = await page.evaluate(() => ({ dive: !!document.querySelector('#pd-thread .stk-dv'), list: [...document.querySelectorAll('#pd-thread .doc-th-rows')].some(el => el.offsetParent !== null) }));
      await page.click('#pd-thread .doc-th-row [data-stk-dive="0"]');
      await page.keyboard.press('Escape');
      const esc = await page.evaluate(() => !document.querySelector('#pd-thread .stk-dv'));
      ok('5 the arrows walk the points; Back and Esc return to the list', /price rise/.test(t2) && !back.dive && back.list && esc, JSON.stringify({ t2, back, esc }));

      await page.evaluate(() => { window.__bd.refuse = true; pdOpenOnHome('MK-S2', 'doc'); });
      await page.waitForSelector('#pd-thread [data-stk-run]', { timeout: 8000 });
      await page.click('#pd-thread [data-stk-run]');
      const said = await page.waitForSelector('#pd-thread .stk-err', { timeout: 8000 }).then(() => true, () => false);
      ok('6 a refusal is said where the reader looks', said, said ? await page.evaluate(() => document.querySelector('#pd-thread .stk-err').innerText) : 'no message');
    } else {
      ['2', '3', '4', '5', '6'].forEach(k => ok(k + ' (not reached)', false, 'no Read the deal button on the Clauses tab'));
    }
    ok('7 no page errors', errs.length === 0, errs.join(' | ').slice(0, 300));
  } finally { await browser.close(); await h.stop(); }
  console.log(`${pass}/${pass + fail} checks passed`);
  process.exit(fail ? 1 : 0);
})();
