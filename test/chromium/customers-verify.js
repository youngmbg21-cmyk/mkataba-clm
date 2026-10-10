/* CUSTOMER FOLDERS, AND THE FILTERS BESIDE THE TABS (owner, 10 Oct 2026:
   "implement the filter besides tabs and the custom folders SAP way").
   RE-POINTED 10 Oct 2026 (the customers doors work order, owner: "when you
   click on open customer, it takes you to the contracts page and only
   contracts for that customer will be listed there. When you click on
   explorer it will then take you to the explorer page with just those
   customers but grouped by active vs expired. Also, move the customer folder
   in the nav panel to be right after home"): the customer's own page is gone,
   and its checks (trail, tabs, folding groups) went with it.

   WHAT THIS PINS, driven in a real browser on a seeded book
     1 the rail carries Customers second, right after Home, and Negotiations
       still directly under Contracts; its number is the customers listed
     2 the Customers page: one row per counterparty, Active + Expired add up to
       the customer's contracts, an expired term and a declined contract are
       Expired, the side panel names the selected customer; with Owner on, the
       row, its sub-line and the side panel all say the same number
     3 Open customer lands on Contracts narrowed by its "only" chip naming the
       customer, the rows are the customer's number (an amendment drawn under
       its agreement), a refresh keeps it narrowed, × widens it
     4 Open on Explorer lands on Explorer with a lens of exactly those ids in
       two groups, Active and Expired, adding up to the customer's number; an
       all-active customer shows one group
     5 a refresh on the Customers page keeps its filters
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
/* Two of Naivas's four are Wanjiru's (2d); an amendment rides under the first (3). */
CONTRACTS[0].owner = { id: 'u-wk', name: 'Wanjiru Kamau' };
CONTRACTS[2].owner = { id: 'u-wk', name: 'Wanjiru Kamau' };
CONTRACTS.push({ ...H.fixtureContract('MK-CU7', 'Distribution agreement — Amendment 1', 'Naivas Supermarkets', H.FOLDER_B, 0, 'Draft'),
  parentId: 'MK-CU0', relation: 'amendment' });
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
    await page.waitForFunction(() => typeof setView === 'function' && state.contracts && state.contracts.length === 8 && state.contracts.some(c => c.id === 'MK-CU0'), null, { timeout: 15000 });

    console.log('\n1 · the rail');
    await page.evaluate(() => { if (typeof updateSidebarCounts === 'function') updateSidebarCounts(); });
    const rail = await page.evaluate(() => {
      const doors = [...document.querySelectorAll('.nav-item[data-view]')].map(b => b.getAttribute('data-view'));
      return { doors, n: (document.querySelector('[data-count="customers"]') || {}).textContent || '', want: (typeof cuDoorCount === 'function') ? cuDoorCount() : null, total: state.contracts.length };
    });
    ok('1a the rail reads Home · Customers · Contracts · Negotiations', rail.doors.slice(0, 4).join(' ') === 'dashboard customers register redline', rail.doors.join(' › '));
    ok('1b its number is the customers the page lists (3: one name in two cases is one customer)', rail.n.trim() === '3', JSON.stringify(rail));

    console.log('\n2 · the Customers page');
    const opened = await page.click('.nav-item[data-view="customers"]').then(() => true, () => false);
    await page.waitForFunction(() => !!document.querySelector('[data-cu-screen="list"]'), null, { timeout: 8000 }).catch(() => {});
    const readList = () => page.evaluate(() => [...document.querySelectorAll('tr[data-cu-cust]')].map(tr => ({
      key: tr.getAttribute('data-cu-cust'), sub: ((tr.querySelector('.ap-sub') || {}).textContent || '').trim(),
      cells: [...tr.querySelectorAll('td')].map(td => td.textContent.trim()) })));
    const list = await readList();
    ok('2a the rail door opens the list', opened && list.length === 3, `${list.length} rows`);
    const nv = list.find(r => r.key === 'naivas supermarkets');
    ok('2b Naivas: 3 active and 1 expired (a term that ran out is Expired)', !!nv && nv.cells[1] === '3' && nv.cells[2] === '1', nv && nv.cells.join(' | '));
    const sg = list.find(r => r.key === 'siginon logistics');
    ok('2c a declined contract sits with Expired', !!sg && sg.cells[1] === '0' && sg.cells[2] === '1', sg && sg.cells.join(' | '));
    await page.click('tr[data-cu-cust="naivas supermarkets"]').catch(() => {});
    await page.waitForFunction(() => /Naivas/.test((document.querySelector('#ins-panel') || {}).textContent || ''), null, { timeout: 4000 }).catch(() => {});
    const panelText = () => page.evaluate(() => ((document.querySelector('#ins-panel') || {}).textContent || '').replace(/\s+/g, ' ').trim());
    ok('2d one press selects, and the side panel names the customer', /Naivas Supermarkets/.test(await panelText()));
    await page.evaluate(() => { const s = document.querySelector('select[data-cu-f="owner"]'); s.value = 'Wanjiru Kamau'; s.dispatchEvent(new Event('change', { bubbles: true })); });
    await page.waitForFunction(() => document.querySelectorAll('tr[data-cu-cust]').length === 1, null, { timeout: 4000 }).catch(() => {});
    const own = (await readList()).find(r => r.key === 'naivas supermarkets');
    await page.waitForFunction(() => /Naivas/.test((document.querySelector('#ins-panel') || {}).textContent || ''), null, { timeout: 4000 }).catch(() => {});
    const ownPanel = await panelText();
    ok('2e with Owner on, the row says 2 active, 0 expired, and its sub-line 2 contracts', !!own && own.cells[1] === '2' && own.cells[2] === '—' && /^2 contracts · 2 streams$/.test(own.sub), own && (own.cells.join(' | ') + ' / ' + own.sub));
    ok('2f …and the side panel says the same: 2 contracts, Active 2, Expired 0', /2 contracts · 2 streams/.test(ownPanel) && /Active\s*2/.test(ownPanel) && /Expired\s*0/.test(ownPanel), ownPanel.slice(0, 200));

    console.log('\n3 · Open customer lands on Contracts, narrowed');
    const pressOpen = async label => page.evaluate(label => {
      const b = [...document.querySelectorAll('#ins-panel button')].find(x => x.textContent.trim().startsWith(label));
      if (b) b.click(); return !!b; }, label);
    ok('3a the panel carries Open customer', await pressOpen('Open customer'));
    await page.waitForFunction(() => state.view === 'register' && !!document.querySelector('#reg-only-chip'), null, { timeout: 8000 }).catch(() => {});
    const rowsNow = () => page.evaluate(() => ({ view: state.view,
      chip: ((document.querySelector('#reg-only-chip') || {}).textContent || '').replace(/\s+/g, ' ').trim(),
      ids: [...new Set([...document.querySelectorAll('#content tbody tr')].map(t => (t.textContent.match(/MK-CU\d+/) || [''])[0]).filter(Boolean))].sort() }));
    const land = await rowsNow();
    ok('3b it lands on Contracts with the chip naming the customer and the number', land.view === 'register' && /^Naivas Supermarkets · 2$/.test(land.chip), JSON.stringify(land));
    ok('3c the list is exactly that customer\'s two (filters held), the amendment under its agreement', land.ids.join() === 'MK-CU0,MK-CU2,MK-CU7', land.ids.join());
    await page.waitForTimeout(400);
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForFunction(() => typeof state !== 'undefined' && state.view === 'register' && document.querySelectorAll('#content tbody tr').length > 0, null, { timeout: 15000 }).catch(() => {});
    const again = await rowsNow();
    ok('3d a refresh keeps it narrowed', again.view === 'register' && again.ids.join() === land.ids.join() && /Naivas/.test(again.chip), JSON.stringify(again));
    await page.click('#reg-only-clear').catch(() => {});
    await page.waitForFunction(() => !document.querySelector('#reg-only-chip'), null, { timeout: 4000 }).catch(() => {});
    const wide = await rowsNow();
    ok('3e × on the chip widens it to every contract', !wide.chip && wide.ids.length > land.ids.length, wide.ids.join());

    console.log('\n4 · Open on Explorer: that customer, Active | Expired');
    const toExplorer = async key => {
      await page.click('.nav-item[data-view="customers"]');
      await page.waitForFunction(() => !!document.querySelector('[data-cu-screen="list"]'), null, { timeout: 8000 });
      await page.evaluate(() => { const s = document.querySelector('select[data-cu-f="owner"]'); if (s && s.value !== 'all'){ s.value = 'all'; s.dispatchEvent(new Event('change', { bubbles: true })); } });
      await page.waitForFunction(k => !!document.querySelector(`tr[data-cu-cust="${k}"]`), key, { timeout: 4000 });
      await page.click(`tr[data-cu-cust="${key}"]`);
      await page.waitForFunction(() => [...document.querySelectorAll('#ins-panel button')].some(x => /Open on Explorer/.test(x.textContent)), null, { timeout: 4000 });
      await pressOpen('Open on Explorer');
      await page.waitForFunction(() => state.view === 'dashboard' && typeof hbS === 'function' && hbS().face === 'explorer' && !!document.querySelector('#ig-cv'), null, { timeout: 10000 }).catch(() => {});
      return page.evaluate(() => {
        const act = (typeof intelActive === 'function') ? intelActive() : { ids: null };
        const counts = {}; Object.values(intel.groups || {}).forEach(l => { counts[l] = (counts[l] || 0) + 1; });
        return { view: state.view, face: hbS().face, groupBy: intel.groupBy, ids: act.ids ? [...act.ids].sort() : null, counts,
          lens: (intel.lenses.find(l => l.on && l.action === 'filter' && !l.hb) || {}).label || '' };
      });
    };
    const ex = await toExplorer('naivas supermarkets');
    ok('4a it lands on Explorer', ex.view === 'dashboard' && ex.face === 'explorer', JSON.stringify(ex));
    ok('4b with a lens of exactly that customer\'s contracts', ex.lens === 'Naivas Supermarkets' && (ex.ids || []).join() === 'MK-CU0,MK-CU1,MK-CU2,MK-CU3,MK-CU7', JSON.stringify(ex.ids));
    ok('4c in two groups, Active and Expired, adding up (3 + its amendment · 1)', ex.groupBy === 'custom' && ex.counts.Active === 4 && ex.counts.Expired === 1 && Object.keys(ex.counts).length === 2, JSON.stringify(ex.counts));
    const shot = await page.evaluate(() => { const cv = document.querySelector('#ig-cv'); if (!cv) return null; const r = cv.getBoundingClientRect(); return { w: r.width, h: r.height }; });
    ok('4d the map is painted on screen', !!shot && shot.w > 300 && shot.h > 200, JSON.stringify(shot));
    await page.screenshot({ path: process.env.CU_SHOT || '/tmp/cu-explorer.png' }).catch(() => {});
    const ck = await toExplorer('carrefour kenya');
    ok('4e an all-active customer shows one group', ck.groupBy === 'custom' && Object.keys(ck.counts).join() === 'Active' && ck.counts.Active === 2, JSON.stringify(ck.counts));

    console.log('\n5 · a refresh keeps the Customers page\'s filters');
    await page.click('.nav-item[data-view="customers"]');
    await page.waitForFunction(() => !!document.querySelector('[data-cu-screen="list"]'), null, { timeout: 8000 });
    await page.evaluate(id => { const s = document.querySelector('select[data-cu-f="stream"]'); s.value = id; s.dispatchEvent(new Event('change', { bubbles: true })); }, H.FOLDER_A);
    await page.waitForTimeout(400);
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForFunction(() => !!document.querySelector('[data-cu-screen]'), null, { timeout: 15000 }).catch(() => {});
    const back = await page.evaluate(() => ({ screen: (document.querySelector('[data-cu-screen]') || {}).getAttribute?.('data-cu-screen'),
      stream: (document.querySelector('select[data-cu-f="stream"]') || {}).value, rows: document.querySelectorAll('tr[data-cu-cust]').length }));
    ok('5a the list, with its stream filter still on', back.screen === 'list' && back.stream === H.FOLDER_A && back.rows === 2, JSON.stringify(back));
    await page.evaluate(() => { const s = document.querySelector('select[data-cu-f="stream"]'); s.value = 'all'; s.dispatchEvent(new Event('change', { bubbles: true })); });

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
