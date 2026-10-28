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
     3 Open party lands on Home's wall of paper (nothing chosen) narrowed by
       one lit chip naming the party, the papers are the ids the row counted
       (its filters held, the amendment with its agreement), a refresh keeps
       it narrowed, pressing the chip widens it (step 2, 14 Oct 2026; was the
       Contracts page and its "only" chip)
     4 Open on Explorer lands on Explorer with a lens of exactly those ids in
       two groups, Active and Expired, adding up to the customer's number; an
       all-active customer shows one group
     5 a refresh on the Customers page keeps its filters
     6 Contracts and Negotiations draw their filters beside their tabs too
   RE-POINTED 21 Oct 2026 (Part 8, the list head the Legora way): Parties'
   Status box is the tab row (All · Live · Ended) and Stream · Owner · NDA are
   added through "+ Filter" as chips; the presses below drive those controls.

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

    console.log('\n1 · the way in');
    /* RE-POINTED 17 Oct 2026 (the owner picked "Desk tabs", Round 2): the left
       menu is not drawn on a computer; Parties is a place Jambo opens and his
       "/" lists it. The count the menu's door carried is the page's own reading. */
    const rail = await page.evaluate(() => ({ menu: getComputedStyle(document.getElementById('side-nav')).display,
      slash: caSlashRows('parties', { max: 5 }).map(r => r.k), want: (typeof cuDoorCount === 'function') ? cuDoorCount() : null }));
    ok('1a the left menu is gone; Parties is a place Jambo opens, in his "/" list', rail.menu === 'none' && rail.slash.includes('parties'), JSON.stringify(rail));
    ok('1b the customers counted are the customers the page lists (3: one name in two cases is one customer)', rail.want === 3, JSON.stringify(rail));

    console.log('\n2 · the Customers page');
    /* the left menu's place is the desk tabs' since 17 Oct 2026 (Round 2): the page is asked of Jambo's box */ 
    const opened = await page.evaluate(() => { setView('counter'); return counterAsk('parties'); }).then(() => true, () => false);
    await page.waitForFunction(() => !!document.querySelector('[data-cu-screen="list"]'), null, { timeout: 8000 }).catch(() => {});
    /* (Part 8) one press on the list head's own control: a Status tab, or a
       filter added through "+ Filter" / re-chosen on its chip / × to rest */
    const setF = (k, v) => page.evaluate(([k, v]) => {
      const head = document.querySelector('[data-lh-seat="customers"]'); if (!head) return false;
      if (k === 'status'){ const t = head.querySelector(`[role="tab"][data-cu-status="${v}"]`); if (t) t.click(); return !!t; }
      if (v === 'all'){ const x = head.querySelector(`[data-lh-x="${k}"]`); if (x) x.click(); return true; }
      const chip = head.querySelector(`select[data-lh-f="${k}"]`);
      if (chip){ chip.value = v; chip.dispatchEvent(new Event('change', { bubbles: true })); return true; }
      const add = head.querySelector('select[data-lh-add]'); const o = add && [...add.options].find(x => x.value === JSON.stringify([k, v]));
      if (!o) return false; add.value = o.value; add.dispatchEvent(new Event('change', { bubbles: true })); return true; }, [k, v]);
    const readList = () => page.evaluate(() => [...document.querySelectorAll('tr[data-cu-cust]')].map(tr => ({
      key: tr.getAttribute('data-cu-cust'), sub: ((tr.querySelector('.ap-sub') || {}).textContent || '').trim(),
      cells: [...tr.querySelectorAll('td')].map(td => td.textContent.trim()),
      /* RE-POINTED 28 Oct 2026 (THE LIST LANGUAGE): Live and Ended are one press away under Columns, so cells are read by their head */
      by: (() => { const h = [...document.querySelectorAll('.cu-table thead th')].map(t => t.textContent.trim()); const td = [...tr.querySelectorAll('td')]; return Object.fromEntries(h.map((k, i) => [k, td[i] ? td[i].textContent.trim() : ''])); })() })));
    const showCols = async keys => { await page.click('[data-lc-btn="customers"]');
      await page.waitForFunction(() => document.querySelector('[data-lc-pop="customers"]'), null, { timeout: 4000 }).catch(() => {});
      for (const k of keys) { const on = await page.evaluate(k => { const b = document.querySelector(`[data-lc-pop="customers"] [data-lc-k="${k}"]`); return b ? b.checked : null; }, k);
        if (on === false) await page.click(`[data-lc-pop="customers"] [data-lc-k="${k}"]`); }
      await page.click('[data-lc-btn="customers"]').catch(() => {}); };
    /* RE-POINTED 19 Oct 2026 (lane A2, round 19 as drawn): the list opens on
       Live — Siginon, whose one contract was declined, is a party everything
       with has ended, so it waits under Status · All; the cells after the
       party are City · Live · Ended · … (City first) */
    const live = await readList();
    ok('2a the rail door opens the list, on its live parties', opened && live.length === 2 && !live.some(r => r.key === 'siginon logistics'), `${live.length} rows`);
    await setF('status', 'all');
    await page.waitForFunction(() => document.querySelectorAll('tr[data-cu-cust]').length === 3, null, { timeout: 4000 }).catch(() => {});
    await showCols(['live', 'ended']);
    await page.waitForFunction(() => [...document.querySelectorAll('.cu-table thead th')].some(t => t.textContent.trim() === 'Ended'), null, { timeout: 4000 }).catch(() => {});
    const list = await readList();
    const nv = list.find(r => r.key === 'naivas supermarkets');
    /* RE-POINTED 24 Oct 2026 (Round 2, owner's yes): City is empty for every party here, so its column steps out and
       Live · Ended are the cells right after the party */
    ok('2b Naivas: 3 live and 1 ended (a term that ran out has ended)', !!nv && nv.by.Live === '3' && nv.by.Ended === '1', nv && JSON.stringify(nv.by));
    const sg = list.find(r => r.key === 'siginon logistics');
    ok('2c a declined contract sits with Ended', !!sg && sg.by.Live === '—' && sg.by.Ended === '1', sg && JSON.stringify(sg.by));
    await page.click('tr[data-cu-cust="naivas supermarkets"]').catch(() => {});
    await page.waitForFunction(() => /Naivas/.test((document.querySelector('#ins-panel') || {}).textContent || ''), null, { timeout: 4000 }).catch(() => {});
    const panelText = () => page.evaluate(() => ((document.querySelector('#ins-panel') || {}).textContent || '').replace(/\s+/g, ' ').trim());
    ok('2d one press selects, and the side panel names the customer', /Naivas Supermarkets/.test(await panelText()));
    await setF('owner', 'Wanjiru Kamau');
    await page.waitForFunction(() => document.querySelectorAll('tr[data-cu-cust]').length === 1, null, { timeout: 4000 }).catch(() => {});
    const own = (await readList()).find(r => r.key === 'naivas supermarkets');
    await page.waitForFunction(() => /Naivas/.test((document.querySelector('#ins-panel') || {}).textContent || ''), null, { timeout: 4000 }).catch(() => {});
    const ownPanel = await panelText();
    ok('2e with Owner on, the row says 2 live, none ended, and its sub-line 2 agreements and since when', !!own && own.by.Live === '2' && own.by.Ended === '—' && /^2 agreements · with us since .+$/.test(own.sub), own && (JSON.stringify(own.by) + ' / ' + own.sub));
    ok('2f …and the side panel says the same: Live agreements 2, and its two agreements', /Live agreements\s*2 · /.test(ownPanel) && /Agreements\s*2/.test(ownPanel), ownPanel.slice(0, 300));

    console.log('\n3 · Open party lands on Home\'s wall, narrowed');
    /* RE-POINTED 14 Oct 2026 (the overnight work order, step 2; owner's "Go";
       was the Contracts page narrowed by its "only" chip, 10 Oct): Open party
       lands on Home's Document with no paper chosen — the wall of paper —
       narrowed to the ids the row counted (its Owner filter held, the
       amendment with its agreement), one lit chip naming the party as the way
       out. The same claims, asked of the wall: lands narrowed, exactly those
       ids, a refresh keeps it, the chip widens it. */
    const pressOpen = async label => page.evaluate(label => {
      const b = [...document.querySelectorAll('#ins-panel button')].find(x => x.textContent.trim().startsWith(label));
      if (b) b.click(); return !!b; }, label);
    /* 20 Oct 2026 (owner: "make the contracts landing page be on list as opposed to paper"): the place lands on
       the List now; this section reads the Wall, so the reader picks Wall first */
    await page.evaluate(() => { if (window.regPlaceSet) regPlaceSet({ show: 'wall' }); });
    ok('3a the panel carries Open party', await pressOpen('Open party'));
    /* since step 7 the set is the Contracts place's own, its one chip in the head over the Wall and the List */
    await page.waitForFunction(() => state.view === 'dashboard' && !!document.querySelector('#ig-wall') && !!document.querySelector('[data-reg-home] #reg-only-chip'), null, { timeout: 8000 }).catch(() => {});
    const rowsNow = () => page.evaluate(() => ({ view: state.view, face: window.hbFace ? hbFace() : null, paper: !!(window.intel && intel.paper),
      chip: ((document.querySelector('[data-reg-home] #reg-only-chip') || {}).textContent || '').replace(/[\s×]+/g, ' ').trim(),
      count: ((document.querySelector('#ig-wall .igw-count') || {}).textContent || '').trim(),
      ids: [...document.querySelectorAll('#ig-wall [data-ig-pick]')].map(b => b.getAttribute('data-ig-pick')).sort() }));
    const land = await rowsNow();
    ok('3b it lands on Home\'s wall, nothing chosen, the chip naming the party', land.view === 'dashboard' && land.face === 'paper' && !land.paper
      && /^Naivas Supermarkets$/.test(land.chip), JSON.stringify(land));
    /* THE NUMBER PRESSED IS THE NUMBER READ (kept from the old chip's "· 2"):
       the row said 2 with Owner on (2e); the wall counts the same two
       agreements, the amendment said beside them */
    /* RE-POINTED 19 Oct 2026 (round 13 as drawn, lane B1's pass 4): the count
       line counts agreements and no longer says "· 1 amendment" — the amendment
       rides with its own agreement on the wall (3c keeps it in the set) */
    ok('3b2 the wall\'s count reads the row\'s number: 2 of 2 contracts, the amendment riding with its agreement', land.count === '2 of 2 contracts', land.count);
    ok('3c the wall is exactly that party\'s two (filters held), and the amendment under the first', land.ids.join() === 'MK-CU0,MK-CU2,MK-CU7', land.ids.join());
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForFunction(() => typeof state !== 'undefined' && state.view === 'dashboard' && document.querySelectorAll('#ig-wall [data-ig-pick]').length > 0, null, { timeout: 15000 }).catch(() => {});
    const again = await rowsNow();
    ok('3d a refresh keeps it narrowed', again.view === 'dashboard' && again.ids.join() === land.ids.join() && /Naivas/.test(again.chip), JSON.stringify(again));
    await page.click('[data-reg-home] #reg-only-clear').catch(() => {});
    await page.waitForFunction(() => !document.querySelector('[data-reg-home] #reg-only-chip'), null, { timeout: 4000 }).catch(() => {});
    const wide = await rowsNow();
    ok('3e pressing the chip widens it to every contract on the wall', !wide.chip && wide.ids.length > land.ids.length, wide.ids.join());

    console.log('\n4 · Open on Explorer: that customer, Active | Expired');
    const toExplorer = async key => {
      await page.evaluate(w => { setView('counter'); counterAsk(w); }, 'parties');
      await page.waitForFunction(() => !!document.querySelector('[data-cu-screen="list"]'), null, { timeout: 8000 });
      await setF('owner', 'all');
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
    await page.evaluate(w => { setView('counter'); counterAsk(w); }, 'parties');
    await page.waitForFunction(() => !!document.querySelector('[data-cu-screen="list"]'), null, { timeout: 8000 });
    await setF('stream', H.FOLDER_A);
    await page.waitForFunction(id => (document.querySelector('[data-lh-seat="customers"] select[data-lh-f="stream"]') || {}).value === id, H.FOLDER_A, { timeout: 4000 }).catch(() => {});
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForFunction(() => !!document.querySelector('[data-cu-screen]'), null, { timeout: 15000 }).catch(() => {});
    const back = await page.evaluate(() => ({ screen: (document.querySelector('[data-cu-screen]') || {}).getAttribute?.('data-cu-screen'),
      stream: (document.querySelector('[data-lh-seat="customers"] select[data-lh-f="stream"]') || {}).value, rows: document.querySelectorAll('tr[data-cu-cust]').length }));
    /* RE-POINTED 19 Oct 2026 (lane A2): the page opens on Live, so the stream's
       live party (Naivas) is listed and Siginon, whose one contract ended,
       waits under Status · All */
    ok('5a the list, with its stream filter still on', back.screen === 'list' && back.stream === H.FOLDER_A && back.rows === 1, JSON.stringify(back));
    await setF('stream', 'all');

    console.log('\n6 · Contracts and Negotiations');
    for (const v of ['register', 'redline']){
      await page.evaluate(v => setView(v), v);
      await page.waitForTimeout(1200);
      /* RE-POINTED 21 Oct 2026 (Part 8, the owner picked "the Legora way" for
         both lists, which reverses the labelled boxes above the card and
         beside the tabs): each page's filters are "+ Filter" and its chips,
         on the chip row of the one list head, under the name row (and, on
         Negotiations, under its tabs) */
      const r = await page.evaluate(() => {
        const head = document.querySelector('[data-lh-seat="contracts"], [data-lh-seat="negotiations"]');
        const top = head && head.querySelector('.ph-top'), row = head && head.querySelector('.lh-chips');
        const tabs = head && head.querySelector('.reg-views');
        const add = row && row.querySelector('.lh-add');
        const rr = row && row.getBoundingClientRect(), tr = top && top.getBoundingClientRect(), vr = tabs && tabs.getBoundingClientRect();
        return { seat: head && head.getAttribute('data-lh-seat'), boxes: document.querySelectorAll('[data-reg-home] .reg-fb, .reg-tabbar .reg-fb').length,
          one: !!(rr && tr) && rr.top >= tr.bottom - 1 && (!vr || rr.top >= vr.bottom - 1),
          face: add ? add.textContent.replace(/\s+/g, ' ').trim().slice(0, 40) : '' };
      });
      ok(`6 ${v === 'register' ? 'Contracts (the place)' : 'Negotiations'}: the filters are "+ Filter" on the head's chip row, under the name${v === 'register' ? '' : ' and the tabs'}, no labelled box`,
        r.seat === (v === 'register' ? 'contracts' : 'negotiations') && r.one && r.boxes === 0 && /\S/.test(r.face), JSON.stringify(r));
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
