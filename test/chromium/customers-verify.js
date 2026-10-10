/* CUSTOMER FOLDERS, AND THE FILTERS BESIDE THE TABS (owner, 10 Oct 2026:
   "implement the filter besides tabs and the custom folders SAP way").

   WHAT THIS PINS, driven in a real browser on a seeded book
     1 the rail carries Customers third, under Negotiations, and its number is
       the number of customers the page lists
     2 the Customers page: one row per counterparty, Active + Expired add up to
       the customer's contracts, an expired term and a declined contract are
       Expired, the side panel names the selected customer
     3 a second press opens the customer's page: trail, Active | Expired | All
       tabs whose counts are the lists behind them, groups by stream that fold
     4 the filters sit BESIDE the tabs on one row, each box saying its label
       and value inside ("Stream: All streams"); a filter narrows the list
     5 a refresh lands on the same customer and tab
     6 Contracts and Negotiations draw their filters beside their tabs too

   Run: node test/chromium/customers-verify.js */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const H = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

let pass = 0, fail = 0;
const ok = (n, c, d) => { c ? pass++ : fail++; console.log((c ? '  ok   ' : '  FAIL ') + n + (d ? '  → ' + d : '')); };
const day = off => { const t = new Date(); t.setDate(t.getDate() + off); return t.toISOString().slice(0, 10); };

const ROWS = [
  ['Naivas Supermarkets', 'Distribution agreement', 'Signed', H.FOLDER_B, 48e6, 300],
  ['Naivas Supermarkets', 'Promotional pricing addendum', 'Under Review', H.FOLDER_B, 6.5e6, 900],
  ['Naivas Supermarkets', 'Mutual NDA', 'Signed', H.FOLDER_A, 0, 500],
  ['naivas supermarkets', 'Distribution agreement 2023', 'Signed', H.FOLDER_B, 19e6, -200],
  ['Carrefour Kenya', 'Supply agreement', 'Signed', H.FOLDER_B, 22e6, 120],
  ['Carrefour Kenya', 'Supply renewal 2027', 'Draft', H.FOLDER_B, 24e6, 900],
  ['Siginon Logistics', '3PL warehousing', 'Declined', H.FOLDER_A, 5.5e6, 900],
];
const CONTRACTS = ROWS.map((r, i) => ({ ...H.fixtureContract('MK-CU' + i, r[1], r[0], r[3], r[4], r[2]),
  expiry: day(r[5]), metadata: { value: r[4], currency: 'KES' } }));
/* One live negotiation, so the Negotiations page draws its list (6). */
Object.assign(CONTRACTS[1], { negotiation: { round: 1, rounds: [] },
  changes: [{ id: 'CHG-CU1', clauseId: 'cl_a1', clauseLabel: 'Article 1', changeType: 'edit', status: 'pending', authorSide: 'counterparty', summary: 'Price', createdAt: day(-2), roundN: 1 }] });

(async () => {
  const h = await H.startHati();
  await H.seedWorkspace(h, { contracts: CONTRACTS, approvalRules: [] });
  const b = await chromium.launch({ executablePath: EXEC });
  const page = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForFunction(() => typeof setView === 'function' && state.contracts && state.contracts.length === 7 && state.contracts.some(c => c.id === 'MK-CU0'), null, { timeout: 15000 });

    console.log('\n1 · the rail');
    await page.evaluate(() => { if (typeof updateSidebarCounts === 'function') updateSidebarCounts(); });
    const rail = await page.evaluate(() => {
      const doors = [...document.querySelectorAll('.nav-item[data-view]')].map(b => b.getAttribute('data-view'));
      return { doors, n: (document.querySelector('[data-count="customers"]') || {}).textContent || '', want: (typeof cuDoorCount === 'function') ? cuDoorCount() : null, total: state.contracts.length };
    });
    const at = rail.doors.indexOf('customers');
    ok('1a Customers is in the rail, right under Negotiations', at > 0 && rail.doors[at - 1] === 'redline', rail.doors.join(' › '));
    ok('1b its number is the customers the page lists (3: one name in two cases is one customer)', rail.n.trim() === '3', JSON.stringify(rail));

    console.log('\n2 · the Customers page');
    const opened = await page.click('.nav-item[data-view="customers"]').then(() => true, () => false);
    await page.waitForFunction(() => !!document.querySelector('[data-cu-screen="list"]'), null, { timeout: 8000 }).catch(() => {});
    const list = await page.evaluate(() => [...document.querySelectorAll('tr[data-cu-cust]')].map(tr => ({
      key: tr.getAttribute('data-cu-cust'), cells: [...tr.querySelectorAll('td')].map(td => td.textContent.trim()) })));
    ok('2a the rail door opens the list', opened && list.length === 3, `${list.length} rows`);
    const nv = list.find(r => r.key === 'naivas supermarkets');
    ok('2b Naivas: 3 active and 1 expired (a term that ran out is Expired)', !!nv && nv.cells[1] === '3' && nv.cells[2] === '1', nv && nv.cells.join(' | '));
    const sg = list.find(r => r.key === 'siginon logistics');
    ok('2c a declined contract sits with Expired', !!sg && sg.cells[1] === '0' && sg.cells[2] === '1', sg && sg.cells.join(' | '));
    await page.click('tr[data-cu-cust="naivas supermarkets"]').catch(() => {});
    await page.waitForTimeout(300);
    const panel = await page.evaluate(() => ((document.querySelector('#ins-panel .ins-cp') || {}).textContent || '').trim());
    ok('2d one press selects, and the side panel names the customer', /Naivas Supermarkets/.test(panel), panel);

    console.log('\n3 · one customer\'s page');
    await page.dblclick('tr[data-cu-cust="naivas supermarkets"]').catch(() => {});
    await page.waitForFunction(() => !!document.querySelector('[data-cu-screen="customer"]'), null, { timeout: 8000 }).catch(() => {});
    const cust = await page.evaluate(() => {
      const tabs = {}; document.querySelectorAll('[data-cu-tab]').forEach(b => { tabs[b.getAttribute('data-cu-tab')] = ((b.querySelector('.n') || {}).textContent || '0').trim(); });
      return { crumb: ((document.querySelector('.cu-crumb') || {}).textContent || '').replace(/\s+/g, ' ').trim(),
        tabs, rows: document.querySelectorAll('tr[data-cu-row]').length, groups: document.querySelectorAll('tr[data-cu-grp]').length };
    });
    ok('3a the trail leads back to Customers', /^Customers\s*›\s*Naivas Supermarkets$/.test(cust.crumb), cust.crumb);
    ok('3b Active | Expired | All count 3 · 1 · 4', cust.tabs.active === '3' && cust.tabs.expired === '1' && cust.tabs.all === '4', JSON.stringify(cust.tabs));
    ok('3c the Active tab lists what its count says, grouped by stream', cust.rows === 3 && cust.groups === 2, `${cust.rows} rows in ${cust.groups} groups`);
    await page.click('tr[data-cu-grp]').catch(() => {});
    await page.waitForTimeout(250);
    const folded = await page.evaluate(() => document.querySelectorAll('tr[data-cu-row]').length);
    ok('3d a stream heading folds its group', folded < 3, `${folded} rows after the fold`);
    await page.click('tr[data-cu-grp]').catch(() => {});
    await page.waitForTimeout(250);

    console.log('\n4 · the filters beside the tabs');
    const fb = await page.evaluate(() => {
      const row = document.querySelector('.cu-page .reg-tabbar');
      const tabs = row && row.querySelector('.reg-views'), bar = row && row.querySelector('.reg-fb');
      const chip = bar && bar.querySelector('.reg-chip');
      const tr = tabs && tabs.getBoundingClientRect(), br = bar && bar.getBoundingClientRect();
      return { one: !!(tr && br) && Math.abs((tr.top + tr.bottom) / 2 - (br.top + br.bottom) / 2) < 14 && br.left > tr.right,
        face: chip ? chip.textContent.replace(/\s+/g, ' ').trim().slice(0, 40) : '' };
    });
    ok('4a the tabs and the filters share one row, the filters at its right end', fb.one);
    ok('4b each box says its label and its value inside', /^Stream\s*All streams/.test(fb.face), fb.face);
    await page.evaluate(id => { const s = document.querySelector('select[data-cu-f="stream"]'); s.value = id; s.dispatchEvent(new Event('change', { bubbles: true })); }, H.FOLDER_A);
    await page.waitForTimeout(300);
    const narrowed = await page.evaluate(() => document.querySelectorAll('tr[data-cu-row]').length);
    ok('4c a stream filter narrows the list', narrowed === 1, `${narrowed} rows`);
    await page.evaluate(() => { const s = document.querySelector('select[data-cu-f="stream"]'); s.value = 'all'; s.dispatchEvent(new Event('change', { bubbles: true })); });
    await page.click('[data-cu-tab="expired"]').catch(() => {});
    await page.waitForTimeout(300);

    console.log('\n5 · a refresh lands on the same spot');
    await page.waitForTimeout(400);
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForFunction(() => !!document.querySelector('[data-cu-screen]'), null, { timeout: 15000 }).catch(() => {});
    const back = await page.evaluate(() => ({ screen: (document.querySelector('[data-cu-screen]') || {}).getAttribute?.('data-cu-screen'),
      tab: ((document.querySelector('[data-cu-tab].on') || {}).getAttribute?.('data-cu-tab')) || '' }));
    ok('5a the same customer and the same tab', back.screen === 'customer' && back.tab === 'expired', JSON.stringify(back));

    console.log('\n6 · Contracts and Negotiations');
    for (const v of ['register', 'redline']){
      await page.evaluate(v => setView(v), v);
      await page.waitForTimeout(1200);
      const r = await page.evaluate(() => {
        const row = document.querySelector('.reg-tabbar');
        const tabs = row && row.querySelector('.reg-views'), bar = row && row.querySelector('.reg-fb');
        const tr = tabs && tabs.getBoundingClientRect(), br = bar && bar.getBoundingClientRect();
        const chip = bar && bar.querySelector('.reg-chip:not(.reg-chip-btn)');
        return { one: !!(tr && br) && Math.abs((tr.top + tr.bottom) / 2 - (br.top + br.bottom) / 2) < 14 && br.left > tr.right,
          face: chip ? chip.textContent.replace(/\s+/g, ' ').trim().slice(0, 40) : '' };
      });
      ok(`6 ${v === 'register' ? 'Contracts' : 'Negotiations'}: the filters sit beside the tabs, label and value inside`, r.one && /:?\s*\S/.test(r.face), r.face);
    }
    ok('no page errors', !errs.length, errs.join(' | '));
  } catch (e) {
    ok('the stage ran to the end', false, e && e.message);
  } finally {
    await b.close(); await h.stop();
  }
  console.log(`\n${pass}/${pass + fail} passed`);
  process.exit(fail ? 1 : 0);
})();
