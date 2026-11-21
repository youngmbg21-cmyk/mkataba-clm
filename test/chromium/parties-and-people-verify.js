/* PARTIES AND PEOPLE, AS DRAWN (round 19 of the redesign, option 3 "The SAP
   way", both scenes; the owner's "build all the gaps", 18 Oct 2026; lane A2:
   js/views/customers.js, js/views/directory.js, PUT /api/party-records)

   WHAT THIS PINS, driven in a real browser as an admin:
     1 PARTIES' BAND: each box's word ABOVE it — Party name · Status · Stream ·
       Owner · NDA — the find box saying "Name or city", Status opening on
       Live; the head "Parties N · <money> on paper with live parties" and
       "+ Draft new agreement"
     2 THE LIST: "Parties N · live · sorted by name", Columns, the columns as
       drawn (Party · City · Live · Ended · On paper · Next to end · Waiting
       on you · NDA), a party's line "N agreement(s) · <stream>", "10 of N
       shown · Show more", and Show more draws the rest
     3 A PARTY'S CITY, ONE HOME: Add the city opens two boxes in the panel,
       the parties clause's address is offered ("Use Kisumu"), Save writes it
       (the server has it), the City column and the panel's line say it, the
       find box finds the party by its city, and a refresh keeps it
     4 THE PANEL AS DRAWN: "<city> · with us since <month>", Open party · Open
       on Explorer, the facts Organisation no. · Owner · Live agreements · Next
       to end · NDA, Agreements with their stage pills, People at <party>, and
       "Draft an agreement with <party>"; a request about the party waits on
       the reader with its own door
     5 COLUMNS: hiding City takes it off the list; pressed again it closes
     6 PEOPLE AS A TABLE: the words above the boxes (Name, email or party ·
       Side · Party · Role in HaTi · Stream), "People N", "ours first, then
       theirs, by name", the columns as drawn, the away pill on an away
       colleague's row, "12 of N shown · Show more"; a person at a party opens
       People with that person chosen and lit
     7 the owner's three screens: the list and the panel side by side, the
       filters in view, nothing sideways
   RE-POINTED 21 Oct 2026 (Part 8, the owner's pick of "The Legora way",
   reverses round 19's labelled bands and the cards' own heads on both
   pages): 1, 2a, 6a–6c, 7 and 8a read the list head — one box to search or
   ask in under the title, the views as tabs (Parties All · Live · Ended,
   opening on Live; People Everyone · Ours · Theirs), the filters under
   "+ Filter", Columns at the chip row's end — and People's table as drawn,
   Name · Party or company · Contracts with the job title under the name.
   Waits ask for the state, bounded; a missing part reports.
   Run: node test/chromium/parties-and-people-verify.js
   Photographs: HATI_SHOT_DIR=<dir> node test/chromium/parties-and-people-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const H = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = process.env.HATI_SHOT_DIR || '';
if (OUT) { try { fs.mkdirSync(OUT, { recursive: true }); } catch (_) {} }
let failures = 0;
const check = (name, pass, detail) => {
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
  if (!pass) failures++;
};
const SCREENS = [[1440, 780], [1536, 730], [1366, 950]];
const day = n => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };

(async () => {
  const h = await H.startHati({ HATI_AGENTS_AUTO: 'off' });
  const W = await H.seedWorkspace(h, { approvalRules: [] });
  const me = (await W.admin.json('/api/bootstrap')).me;
  const jonas = W.users.unrestricted;
  await W.admin.json('/api/users/' + jonas.id, { method: 'PATCH', body: { name: 'Jonas Berg' } }).catch(() => {});
  /* Jonas is away; the admin answers for him */
  await W.unrestricted.json('/api/me/away', { method: 'PUT', body: { deputyId: me.id, from: day(0), to: day(4) } });
  const mk = (id, name, cp, folder, value, status, extra) => W.admin.json('/api/contracts/' + id, { method: 'PUT', body: { baseVersion: 0, contract: Object.assign(
    H.fixtureContract(id, name, cp, folder, value, status), { owner: { id: me.id, name: me.name } }, extra || {}) } });
  /* ten more parties, so the list pages; each with a main contact, so People pages too */
  const more = ['Bidco Africa Ltd', 'Brookside Dairy Ltd', 'Capwell Industries', 'Davis & Shirtliff', 'East African Breweries',
    'Mombasa Millers', 'Nairobi Bottlers', 'Pwani Oil Products', 'Twiga Foods', 'Unga Group'];
  let n = 0;
  for (const p of more) { n++;
    await mk('MK-P' + n, 'Supply agreement ' + n, p, n % 2 ? H.FOLDER_A : H.FOLDER_B, 1000000 * n, 'Signed',
      { counterpartyEmail: 'buyer' + n + '@' + p.split(' ')[0].toLowerCase() + '.co.ke', counterpartyName: 'Buyer ' + p.split(' ')[0] }); }
  /* the party the drawing draws: its parties clause names where it is, two people on its side */
  const body = ['TRANSPORT AGREEMENT', '', 'This agreement is made between Highland Corporate Ltd of P.O. Box 1, Nairobi and Kenya Freight Ltd of P.O. Box 30, Kisumu, Kenya (the "Carrier").', '',
    'Article 1 Payment', '', 'The fees are KES 2,400,000 a year.'].join('\n');
  await mk('MK-KF1', 'Transport agreement', 'Kenya Freight Ltd', H.FOLDER_A, 2400000, 'Signed', { redlineText: body, format: 'text',
    participants: [{ id: 'p1', name: 'Henry Dalu', email: 'henry@kfreight.co.ke', role: 'negotiate', access: 'all' },
      { id: 'p2', name: 'Sofia Lunani', email: 'sofia@kfreight.co.ke', role: 'cpsign', access: 'all' }] });
  await mk('MK-KF2', 'Mutual NDA', 'Kenya Freight Ltd', H.FOLDER_A, 0, 'Signed', { template: 'NDA', category: 'nda', expiry: '2028-02-29',
    nda: { dir: 'mutual', ends: '2028-02-29', who: me.name, at: day(-30) } });
  /* a party everything with has ended: off the list that opens on Live */
  await mk('MK-OLD', 'Old supply', 'Retired Supplies Ltd', H.FOLDER_A, 50000, 'Signed', { expiry: '2020-01-31', metadata: { expiryDate: '2020-01-31', value: 50000, currency: 'KES' } });
  /* job titles from the admin's own list */
  { const st = (await W.admin.json('/api/bootstrap')).settings || {};
    await W.admin.json('/api/settings', { method: 'PUT', body: Object.assign({}, st, { directory: [
      { name: 'Henry Dalu', email: 'henry@kfreight.co.ke', title: 'Head of procurement' }, { name: 'Sofia Lunani', email: 'sofia@kfreight.co.ke', title: 'Legal counsel' }] }) }); }
  /* an approval the admin answers for Jonas while he is away */
  { const st = (await W.admin.json('/api/bootstrap')).settings || {};
    await W.admin.json('/api/settings', { method: 'PUT', body: Object.assign({}, st, { approvalRules: [{ id: 'r1', order: 1, name: 'Over 30 M',
      cond: { type: 'value', op: '>=', value: 30000000 }, approver: { kind: 'member', id: jonas.id, name: 'Jonas Berg' } }] }) }); }
  await mk('MK-AP1', 'Power purchase agreement', 'Helio Energy Ltd', H.FOLDER_A, 31000000, 'Draft');
  { const c = await W.admin.json('/api/contracts/MK-AP1'); const v = c._v; delete c._v; c.status = 'Under Review';
    await W.admin.raw('/api/contracts/MK-AP1', { method: 'PUT', body: { contract: c, baseVersion: v } }); }
  /* a colleague asks for an NDA with a party: it waits on the admin */
  await W.restricted.json('/api/intake', { method: 'POST', body: { title: 'an NDA with Nandi Dairy', need: 'We share recipes next month.', counterparty: 'Nandi Dairy', folder: H.FOLDER_A } });

  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    /* RE-POINTED 28 Oct 2026 (THE LIST'S COLUMNS, the owner's ranking): on a laptop beside the panel the columns a reader adds step aside first; what this file reads in them is read where they all have room */
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 780 } });
    const page = await ctx.newPage();
    page.on('pageerror', e => errors.push(e.message));
    page.setDefaultTimeout(6000);
    const part = async (name, fn) => { try { await fn(); } catch (e) { check(name + ': the part ran', false, String((e && e.message) || e).split('\n')[0]); } };
    const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
      while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
      return v; };
    const shot = async name => { if (OUT) await page.screenshot({ path: path.join(OUT, name) }); };
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await until(() => window.state && state.contracts && state.contracts.some(c => c.id === 'MK-OLD'), null, 20000);
    await page.keyboard.press('Escape').catch(() => {});
    await page.evaluate(() => setView('customers'));
    await until(() => document.querySelectorAll('#cu-tbody [data-cu-cust]').length >= 3, null, 10000);

    /* RE-POINTED 17 Nov 2026 (the new look is the only look, #762): Parties and People are drawn as round 6
       drew them (js/views/customers.js cunRender / cunPanelHtml / cunPartyRender, js/views/directory.js
       dirnRender / dirnPanelHtml): ONE white sheet — the head "Parties" · "N parties", one quiet box "Filter this
       list" and the views as tabs (Folders · List · Waiting on you · No NDA; People: All · Yours · Outside ·
       Waiting on them), a fixed table, the chosen row's panel in Jambo's five parts, and a party's OWN PAGE (its
       facts, what waits on you with each door, its agreements, New agreement). Every promise below is read
       there. What round 6 and the owner's rulings took away is RETIRED where it was, one line each. */
    /* the chosen row's panel, read as its five parts: the headline, the line under it, each group's rows */
    const readPanel = () => page.evaluate(() => { const p = document.getElementById('ins-panel'); if (!p || !p.querySelector('.jov5-title')) return null;
      return { title: (p.querySelector('.jov5-title') || {}).textContent || '', sub: (p.querySelector('.jov5-sub') || {}).textContent || '',
        secs: [...p.querySelectorAll('.jov5-sec')].map(s => ({ label: ((s.querySelector('.jov5-label') || {}).textContent || '').trim(),
          rows: [...s.querySelectorAll('.jov5-row')].map(r => ({ k: ((r.querySelector('.jov5-k') || {}).textContent || '').trim(), t: ((r.querySelector('.jov5-rt b') || {}).textContent || '').trim(),
            s: ((r.querySelector('.jov5-rt span') || {}).textContent || '').trim(),
            door: [...r.attributes].map(a => a.name).filter(n => /^data-(cun|cu-pr|dir|dirn)-/.test(n)).join(',') })) })) }; });
    const secOf = (P, re) => (P && P.secs.find(s => re.test(s.label))) || { label: '', rows: [] };
    /* RETIRED 19 Nov 2026 (the Parties round, owner's "build all the designs in parties"): a party's own page and its
       way back (partyPage / backToList) — the list is the landing page, a row's press chooses it and the panel says the rest */
    const backToList = async () => { await page.evaluate(() => { if (state.view !== 'customers') setView('customers'); });
      await until(() => document.querySelector('.cun-page[data-cu-screen="list"] #cu-tbody')); };
    const choose = async key => { await page.evaluate(k => cuSelectParty(k), key);
      return until(k => { const r = document.querySelector('#cu-tbody [data-cu-cust="' + k + '"]'); return r && r.classList.contains('is-sel') && document.querySelector('#ins-panel .jov5-title') ? true : null; }, key, 10000); };

    /* ---- 1 the head ---- */
    await part('1 the head', async () => {
      const B = await page.evaluate(() => {
        const pg = document.querySelector('.cun-page[data-cu-screen="list"]'); if (!pg) return null;
        const q = document.getElementById('cun-q'), head = pg.querySelector('.cun-head'), bar = pg.querySelector('.apn-bar');
        const r = e => e && e.getBoundingClientRect();
        return { old: !!document.querySelector('.cun-page .sap-band, .cun-page .cu-fb, .cun-page .reg-f-l, .cun-page .cu-find-l, .cun-page select[data-cu-f]'),
          /* RE-POINTED (P-25, owner's pick 20 Nov 2026: Parties the Legora + Stripe way): the box is the ask box under the title (label.apn-ask), the chips under it */
          box: !!(q && q.closest('label.apn-ask') && q.type === 'search'), ph: q && q.getAttribute('placeholder'),
          order: !!(head && bar && q && q.closest('label.apn-ask') && r(head).bottom <= r(q.closest('label.apn-ask')).top + 1 && r(q.closest('label.apn-ask')).bottom <= r(bar).top + 1),
          tabs: bar ? [...bar.querySelectorAll('[data-cun-tab]')].map(t => ({ k: t.getAttribute('data-cun-tab'), on: t.classList.contains('is-on') })) : [],
          title: ((head && head.querySelector('.ctf-h')) || {}).textContent || '', sub: ((head && head.querySelector('.ctf-hf')) || {}).textContent || '',
          chips: bar ? [...bar.querySelectorAll('[data-cun-tab]')].every(t => t.classList.contains('apn-tab') && t.classList.contains('is-chip')) : false };
      });
      /* RE-POINTED (P-25, owner's pick 20 Nov 2026: Parties the Legora + Stripe way): the ask box sits between the title and the chips */
      check('1a one box to ask or filter in, under the title, the chips under it; no labelled band', !!B && B.box && B.order && !B.old, JSON.stringify(B));
      /* RE-POINTED 17 Nov 2026 (#762): the views are round 6's tabs — Folders · List · Waiting on you · No NDA (a tab
         with nothing in it stays out), the list opening on List. RETIRED 17 Nov 2026 (#762): Status as All · Live ·
         Ended and "+ Filter" — round 6's head has no Status tabs and no filters to add (old look only). */
      /* RE-POINTED 19 Nov 2026 (the Parties round): Folders and NDA missing are gone — All · Waiting on you, opening on All */
      check('1a2 the views are the tabs: All · Waiting on you; the list opens on All', !!B
        && JSON.stringify(B.tabs.map(t => t.k)) === JSON.stringify(['all', 'wait']) && (B.tabs.find(t => t.on) || {}).k === 'all' && B.chips /* RE-POINTED (P-25, owner's pick 20 Nov 2026: Parties the Legora + Stripe way): the tabs are chips */, JSON.stringify(B && B.tabs));
      /* RETIRED 17 Nov 2026 (#762): "a hairline under the title row" — the new look's head and list are ONE white sheet (old look only) */
      /* RE-POINTED (P-25, owner's pick 20 Nov 2026: Parties the Legora + Stripe way): the box asks — "Ask about a party: …" */
      check('1b the box says "Ask about a party: …"', !!B && /^Ask about a party: /.test(B.ph || ''), JSON.stringify(B && { ph: B.ph }));
      /* RETIRED 17 Nov 2026 (#762): "… on paper with live parties" and the head's "+ Draft new agreement" — round 6's head
         says only the count; drafting with a party is its own page's New agreement (4f) (old look only) */
      /* RE-POINTED (P-25, owner's pick 20 Nov 2026: Parties the Legora + Stripe way): the title alone — the count beside it went (the chips say it) */
      check('1c the head: "Parties" alone, no count beside it', !!B && B.title.trim() === 'Parties' && B.sub.trim() === '', JSON.stringify(B && { t: B.title, s: B.sub }));
    });

    /* ---- 2 the list ---- */
    await part('2 the list', async () => {
      const L = await page.evaluate(() => {
        const pg = document.querySelector('.cun-page[data-cu-screen="list"]');
        const lit = pg.querySelector('[data-cun-tab].is-on');
        const kf = document.querySelector('#cu-tbody [data-cu-cust="kenya freight ltd"]');
        return { lit: lit ? lit.getAttribute('data-cun-tab') + ' ' + ((lit.querySelector('span') || {}).textContent || '').trim() : '',
          head: ((pg.querySelector('.cun-head .ctf-hf') || {}).textContent || '').trim(),
          cols: [...pg.querySelectorAll('.cun-table thead th')].map(t => t.textContent.trim()),
          rows: document.querySelectorAll('#cu-tbody [data-cu-cust]').length,
          foot: ((pg.querySelector('.apn-foot') || {}).textContent || '').trim(),
          name: kf ? ((kf.querySelector('.cun-name') || {}).textContent || '').trim() : '', deals: kf ? (() => { const t = kf.querySelector('td.cun-num svg.cun-ring text'); return t ? t.textContent.trim() : ''; })() : '',
          /* RE-POINTED (P-25, owner's pick 20 Nov 2026: Parties the Legora + Stripe way): the Agreements cell is a small ring with the count inside (svg.cun-ring text) and "N signed" beside */
          /* RE-POINTED 20 Nov 2026: since "the SAP way, revised" (19 Nov) the Agreements cell has a grey second line ("2 signed"),
             so the count is the cell's own text, not the whole cell's (which read "22 signed") */
          chips: kf ? [...kf.querySelectorAll('td.cun-streams > *')].map(x => x.textContent.trim()).filter(Boolean) : [] };
      });
      /* RE-POINTED 17 Nov 2026 (#762): the count on the lit tab is the rows drawn, the head's N and the foot's N.
         RETIRED 17 Nov 2026 (#762): "sorted by name" on the Party column and Columns in the chip row — round 6's
         table is fixed and has neither (old look only). */
      const n = Number((/(\d+)/.exec(L.lit) || [])[1]);
      /* RE-POINTED 22 Nov 2026 (P-25 review): the foot line ("11 parties · 13 agreements") is gone, as drawn — the All
         chip's number is the one count, and it still equals the rows drawn */
      check('2a the list\'s count is the lit All chip\'s, every row drawn; no count beside the title, no foot line',
        /^all \d+$/.test(L.lit) && n === L.rows && L.head === '' /* RE-POINTED (P-25, owner's pick 20 Nov 2026: Parties the Legora + Stripe way): no count beside the title */ && L.foot === '', JSON.stringify({ lit: L.lit, rows: L.rows, head: L.head, foot: L.foot }));
      /* RE-POINTED 17 Nov 2026 (#762): round 6's columns, in order */
      /* RE-POINTED 19 Nov 2026 (the Parties round): no NDA column; Deals says Agreements; the last column holds each row's one button */
      /* RE-POINTED 19 Nov 2026 (the SAP way, revised): Streams its own column; Standing and the buttons gone; Waiting on you last */
      /* RE-POINTED 21 Nov 2026 (P-25, as drawn): On paper carries the workspace's currency in its head ("On paper (KES)") */
      check('2b the columns as drawn, in order: Party · Streams · Agreements · On paper (KES) · Ends next · Waiting on you', JSON.stringify(L.cols.map(c => c.replace(/^On paper \([A-Z]{3}\)$/, 'On paper'))) === JSON.stringify(['Party', 'Streams', 'Agreements', 'On paper', 'Ends next', 'Waiting on you'])
        && L.cols.some(c => /^On paper \([A-Z]{3}\)$/.test(c)), JSON.stringify(L.cols));
      /* RE-POINTED 17 Nov 2026 (#762): a party's line is its name over its stream as a chip; its agreements are the Deals column */
      check('2c a party\'s row: its name, its stream in the Streams column, its deals counted (2)', L.name === 'Kenya Freight Ltd' && L.chips.length >= 1 && L.deals === '2', JSON.stringify({ n: L.name, c: L.chips, d: L.deals }));
      /* RETIRED 17 Nov 2026 (#762): 2d "ten at a time, 1–10 of N · Show N more; a party with nothing live is off Live"
         and 2e "Show more draws the rest" — round 6's List holds every party on one page, no Live tab (old look only). */
      await shot('19-parties-list-1440x780.png');
    });

    /* ---- 3 a party's city, one home ---- */
    await part('3 the city', async () => {
      await page.click('#cu-tbody [data-cu-cust="kenya freight ltd"]');
      await until(() => document.querySelector('#ins-panel [data-cu-pr-edit]'));
      /* RE-POINTED 17 Nov 2026 (#762): Edit the party record is a row of the panel's More group */
      await page.click('#ins-panel [data-cu-pr-edit]');
      const F = await until(() => { const f = document.getElementById('cu-pr-form'); return f ? { sug: (f.querySelector('[data-cu-pr-sug], .lgp-quote') || {}).textContent || '', use: (f.querySelector('[data-cu-pr-use]') || {}).getAttribute ? f.querySelector('[data-cu-pr-use]').getAttribute('data-cu-pr-use') : '' } : null; });
      /* RE-POINTED 19 Nov 2026 (the one edit pop-up): the two lines open in the sheet; the address is its quote line */
      check('3a two lines in the edit sheet; the parties clause\'s address is offered, its city to use', !!F && /P\.O\. Box 30, Kisumu, Kenya/.test(F.sug) && F.use === 'Kisumu', JSON.stringify(F));
      /* RE-POINTED 24 Oct 2026 (flaky on CI: the server kept city ""): fill, then confirm both boxes hold their words before Save */
      for (let i = 0; i < 6; i++) {
        await page.click('[data-cu-pr-use]');
        await page.fill('#cu-pr-org', 'PVT-AB12CD');
        await page.waitForTimeout(250);
        const held = await page.evaluate(() => ((document.getElementById('cu-pr-city') || {}).value === 'Kisumu') && ((document.getElementById('cu-pr-org') || {}).value === 'PVT-AB12CD'));
        if (held) break;
      }
      await shot('19-party-city-form-1440x780.png');
      await page.click('[data-cu-pr-save]');
      /* RE-POINTED 17 Nov 2026 (#762): no City column — the row's grey line says the city and the org. no., and
         the panel's own facts say both. RETIRED 17 Nov 2026 (#762): "with us since …" (round 6's panel has no such line). */
      /* RE-POINTED 21 Nov 2026 (P-25, as drawn): under the name the row says the words that name the party on the paper
         (.cun-pq), not its city and org. no.; the panel's own facts say both */
      const S = await until(() => { const p = document.getElementById('ins-panel');
        const facts = p ? [...p.querySelectorAll('[data-jov5-sec="facts"] .jov5-row')].map(r => ((r.querySelector('.jov5-k') || {}).textContent || '').trim() + '=' + ((r.querySelector('.jov5-rt b') || {}).textContent || '').trim()) : [];
        if (!facts.includes('City=Kisumu') || !facts.some(f => /PVT-AB12CD/.test(f))) return null;
        const row = document.querySelector('#cu-tbody [data-cu-cust="kenya freight ltd"]');
        return { facts, rowSays: row ? !/PVT-AB12CD/.test(row.textContent) : false }; }, null, 10000);
      check('3b the panel says it: City Kisumu and the organisation no.; the row keeps the paper\'s words, not the record', !!S && S.rowSays, JSON.stringify(S));
      const srv = await W.admin.json('/api/party-records');
      check('3c the server keeps it, one home', srv && srv.records && srv.records['kenya freight ltd'] && srv.records['kenya freight ltd'].city === 'Kisumu' && srv.records['kenya freight ltd'].orgNo === 'PVT-AB12CD', JSON.stringify(srv));
      /* RE-POINTED 17 Nov 2026 (#762): the find box is the sheet's one box (#cun-q) */
      await page.fill('#cun-q', 'kisumu');
      const Q = await until(() => { const rows = [...document.querySelectorAll('#cu-tbody [data-cu-cust]')].map(r => r.getAttribute('data-cu-cust')); return rows.length === 1 ? rows : null; });
      check('3d the find box finds a party by its city', JSON.stringify(Q) === JSON.stringify(['kenya freight ltd']), JSON.stringify(Q || (await page.evaluate(() => document.querySelectorAll('#cu-tbody [data-cu-cust]').length)) + ' rows'));
      await page.fill('#cun-q', '');
      await until(() => document.querySelectorAll('#cu-tbody [data-cu-cust]').length > 1);
      await page.reload({ waitUntil: 'networkidle' });
      await until(() => window.state && state.view === 'customers' && document.querySelector('#cu-tbody'), null, 15000);
      /* RE-POINTED 21 Nov 2026 (P-25, as drawn): the record is read back in the panel's own facts after the refresh */
      await page.evaluate(() => cuSelectParty('kenya freight ltd'));
      const R = await until(() => { const p = document.getElementById('ins-panel');
        const facts = p ? [...p.querySelectorAll('[data-jov5-sec="facts"] .jov5-row')].map(r => ((r.querySelector('.jov5-k') || {}).textContent || '').trim() + '=' + ((r.querySelector('.jov5-rt b') || {}).textContent || '').trim()) : [];
        return facts.includes('City=Kisumu') && facts.some(f => /PVT-AB12CD/.test(f)) ? facts.join(' · ') : null; });
      check('3e a refresh keeps it (the bootstrap carries it), no longer "read from" a contract', !!R && !/read from/.test(R), R);
    });

    /* ---- 4 the panel as drawn ---- */
    /* RE-POINTED 19 Nov 2026 (the Parties round, owner's "build all the designs in parties"): the panel is the party's
       facts (City · Org. no. · Signs for them · NDA, Edit beside them), Contacts (+ Add; the row opens People narrowed to
       them), Agreements · N (three, then all of them on Contracts). RETIRED 19 Nov 2026: More's Open party · Web search
       (the party's own page and the web search are gone), 4f the party page's New agreement, 4i/4g the party page's
       waiting list — what waits is the row's one button and its Waiting column (4i, 4g re-pointed below). */
    await part('4 the panel', async () => {
      await page.click('#cu-tbody [data-cu-cust="kenya freight ltd"]');
      const P = await until(() => { const t = document.querySelector('#ins-panel .jov5-title'); return t && /Kenya Freight/.test(t.textContent); }).then(() => readPanel());
      const facts = secOf(P, /own facts/), cts = secOf(P, /^Contacts/), ags = secOf(P, /^Agreements/);
      /* RE-POINTED (P-25, owner's pick 20 Nov 2026: Parties the Legora + Stripe way): Edit is the link beside the black button (.jov5-act .jov-lnk), + Add a contact beside Contacts */
      const links = await page.evaluate(() => [...document.querySelectorAll('#ins-panel .jov5-more, #ins-panel .jov5-flink, #ins-panel .jov5-act .jov-lnk')].map(a => [...a.attributes].map(x => x.name).filter(n => /^data-(cun|cu-pr)-/.test(n)).join(',') + '|' + a.textContent.trim()));
      check('4a the head: the party\'s name; no Open party, no Web search', !!P && P.title.trim() === 'Kenya Freight Ltd' && !secOf(P, /^More$/).rows.length
        && !(await page.evaluate(() => !!document.querySelector('#ins-panel [data-cun-open], #ins-panel [data-cun-web]'))), JSON.stringify(P && P.title));
      const fk = k => (facts.rows.find(r => r.k === k) || {}).t || '';
      /* RE-POINTED 20 Nov 2026 (the SAP way, revised, 19 Nov: "Streams its own column (first + "+N", all on hover and in
         the panel's facts)"): the facts end with the party's Streams */
      /* RE-POINTED (P-25, owner's pick 20 Nov 2026: Parties the Legora + Stripe way): Edit stands beside Open on Contracts, the facts' own line carries none */
      check('4b the facts: (City) · Org. no. · Signs for them · NDA · Streams; Edit beside the black button', JSON.stringify(facts.rows.map(r => r.k).filter(k => k !== 'City')) === JSON.stringify(['Org. no.', 'Signs for them', 'NDA', 'Streams'])
        && (facts.rows.find(r => r.k === 'Streams') || {}).t === 'Procurement'
        && links.some(l => /^data-cu-pr-edit\|Edit$/.test(l)), JSON.stringify({ rows: facts.rows, links }));
      check('4c Sofia Lunani signs for them; the NDA is in force, its row a door to it', fk('Signs for them') === 'Sofia Lunani' && /^In force/.test(fk('NDA'))
        && /data-cun-nda/.test((facts.rows.find(r => r.k === 'NDA') || {}).door || ''), JSON.stringify(facts.rows));
      check('4c2 Contacts: "2 contacts at Kenya Freight", one row opening People, + Add beside', cts.rows.length === 1 && /^2 contacts at Kenya Freight/.test(cts.rows[0].t)
        && /data-cun-ppl/.test(cts.rows[0].door) && links.some(l => /^data-cun-add-ct\|\+ Add a contact$/.test(l)) /* RE-POINTED (P-25, owner's pick 20 Nov 2026: Parties the Legora + Stripe way): "+ Add a contact" */, JSON.stringify({ cts: cts.rows, links }));
      /* RE-POINTED 19 Nov 2026 (the SAP way, revised): under the facts and contacts, two links — all the agreements, and
         those that need your attention (only where something waits) */
      /* RE-POINTED (P-25, owner's pick 20 Nov 2026: Parties the Legora + Stripe way): Agreements is the ring with "2 of 2 signed" (.cun-pring) and ONE black button Open on Contracts
         (.jov5-go[data-cun-cts]); nothing waits, so no "Waiting on you" group; no tiles and no money anywhere in the panel */
      const AG = await page.evaluate(() => { const p = document.getElementById('ins-panel'), go = p && p.querySelector('.jov5-go[data-cun-cts]');
        return { ring: ((p && p.querySelector('.cun-pring > span')) || {}).textContent ? p.querySelector('.cun-pring > span').textContent.replace(/\s+/g, ' ').trim() : '', go: go ? go.textContent.trim() : '',
          tiles: p ? p.querySelectorAll('.jov5-glance, .jov5-g').length : -1,
          money: p ? [...p.querySelectorAll('.jov5-sec, .jov5-act, .jov5-intro')].filter(r => /\b(KES|SEK|USD|EUR)\b|\d+(\.\d+)?\s?[MK]\b/.test(r.textContent)).map(r => r.textContent.trim().slice(0, 60)) : ['no panel'] }; });
      check('4d Agreements: the ring "2 of 2 signed", "Open on Contracts"; nothing waits, so no attention line; no tiles, no money', ags.rows.length === 0 && /^2 of 2 signed/.test(AG.ring)
        && AG.go === 'Open on Contracts' && !secOf(P, /^Waiting on you/).label && AG.tiles === 0 && AG.money.length === 0, JSON.stringify({ ags: ags.rows, AG }));
      await shot('19-party-panel-1440x780.png');
      /* a second press on the chosen row keeps the list (no party page any more) */
      await page.click('#cu-tbody [data-cu-cust="kenya freight ltd"]');
      await page.waitForTimeout(400);
      const still = await page.evaluate(() => ({ list: !!document.querySelector('.cun-page[data-cu-screen="list"] #cu-tbody'), view: state.view }));
      check('4e a second press on the chosen row stays on the list', still.list && still.view === 'customers', JSON.stringify(still));
      /* RE-POINTED 19 Nov 2026 (the SAP way, revised): Waiting on you is the LAST column, a count on how many contracts;
         its hover names each thing; rows carry no button */
      const HE = await page.evaluate(() => { const r = document.querySelector('#cu-tbody [data-cu-cust="helio energy ltd"]'); if (!r) return null; const td = r.querySelector('td.cun-wait');
        return { wait: ((td || {}).textContent || '').replace(/\s+/g, ' ').trim(), title: td ? td.getAttribute('title') || '' : '', last: !!td && td === r.lastElementChild, btn: !!r.querySelector('button'),
          badge: !!(td && td.querySelector('.cun-badge.is-amber, .cun-badge.is-ruby')) /* RE-POINTED 21 Nov 2026 (P-25, as drawn): a soft square badge, no dot (.cun-badge) */ }; });
      /* RE-POINTED (P-25, owner's pick 20 Nov 2026: Parties the Legora + Stripe way): the cell is a soft badge saying the count ("2 things"); "on 1 contract" left the cell (the hover still names each) */
      /* RE-POINTED 20 Nov 2026: the column counts EVERY thing waiting on the party (cunWaitSay over the row's needs, the
         same list its hover names, cuNeedTitle) — Helio's approval and its 2 details to fill on the same contract are
         "2 things", "on 1 contract"; the hover names the approval as cuNeedTitle says it ("An approval, for Jonas") */
      check('4i an approval the reader answers for an away colleague: the last column counts it with the rest, a soft badge "2 things", its hover names "An approval, for Jonas", no button', !!HE && /^2 things/.test(HE.wait) && HE.badge
        && /An approval, for Jonas/.test(HE.title) && HE.last && !HE.btn, JSON.stringify(HE));
      const col = await page.evaluate(() => { const r = document.querySelector('#cu-tbody [data-cu-cust="nandi dairy"]'); if (!r) return null; const td = r.querySelector('td.cun-wait');
        return { col: td ? (td.textContent + ' ' + (td.getAttribute('title') || '')).replace(/\s+/g, ' ').trim() : '', btn: !!r.querySelector('button') }; });
      /* RE-POINTED 19 Nov 2026: the row's ONE button opens its most urgent work — for Nandi Dairy the approval comes
         first — and the Waiting column names the colleague's request (its hover lists every one). RETIRED 19 Nov 2026:
         4h "Open request lands on the request" from Parties — the request's door is the row's only when it comes first. */
      check('4g a colleague\'s request about the party waits on you: the Waiting column names "Restricted asked for an NDA with Nandi Dairy"; the row\'s one button opens its first waiting work',
        !!col && /Restricted asked for an NDA/.test(col.col) && !col.btn, JSON.stringify(col));
    });

    /* ---- 5 columns ---- */
    /* RETIRED 17 Nov 2026 (#762): 5a–5c, Columns (hide City, pressed again it closes, As it was) — round 6's Parties
       table is fixed: no Columns, no City column (old look only). */

    /* ---- 6 People ---- */
    await part('6 People', async () => {
      await page.evaluate(() => setView('directory'));
      await until(() => document.querySelector('#dir-tbody [data-dir-row]'), null, 10000);
      /* RE-POINTED 17 Nov 2026 (#762): People as round 6 drew it — one sheet, "People" · "N · n of yours, n outside",
         the one box, the sides as tabs, Name · Role · Does for you · Waiting on them (Reach where a phone is known) */
      const D = await page.evaluate(() => {
        const pg = document.querySelector('.dirn-page'); if (!pg) return null;
        const q = document.getElementById('dirn-q'), bar = pg.querySelector('.apn-bar');
        const rows = [...document.querySelectorAll('#dir-tbody [data-dir-row]')];
        return { old: !!document.querySelector('#dir-page .sap-band, #dir-page .cu-fb, #dir-page .reg-f-l, #dir-page .cu-find-l, #dir-page select[data-dir-f]'),
          /* RE-POINTED (P-26, owner's pick 20 Nov 2026: People the Legora + Stripe way): the box is the ask box under the title (label.apn-ask), the chips under it */
          box: !!(q && bar && q.closest('label.apn-ask') && q.type === 'search' && q.closest('label.apn-ask').getBoundingClientRect().bottom <= bar.getBoundingClientRect().top + 1), ph: q && q.getAttribute('placeholder'),
          title: ((pg.querySelector('.cun-head .ctf-h') || {}).textContent || '').trim(), sub: ((pg.querySelector('.cun-head .ctf-hf') || {}).textContent || '').trim(),
          cols: [...pg.querySelectorAll('.cun-table thead th')].map(t => t.textContent.trim()),
          tabs: [...pg.querySelectorAll('[data-dirn-tab]')].map(t => ({ k: t.getAttribute('data-dirn-tab'), w: t.firstChild.textContent.trim(), n: Number(((t.querySelector('span') || {}).textContent || '').trim()), on: t.classList.contains('is-on') })),
          az: !!document.querySelector('#dir-page .dir-az'), rows: rows.length,
          first: rows[0] ? { name: ((rows[0].querySelector('.cun-name') || {}).textContent || '').trim(), role: ((rows[0].querySelectorAll('td')[1] || {}).textContent || '').trim(), sub: ((rows[0].querySelector('.cun-sub') || {}).textContent || '').trim() } : null,
          foot: ((pg.querySelector('.apn-foot') || {}).textContent || '').trim() };
      });
      /* RE-POINTED (P-26, owner's pick 20 Nov 2026: People the Legora + Stripe way): the box asks — "Ask about people: …" */
      check('6a one box to ask or filter in, "Ask about people: …", over the chips; no labelled band', !!D && D.box && !D.old && /^Ask about people: /.test(D.ph || ''), JSON.stringify(D && { box: D.box, old: D.old, ph: D.ph }));
      check('6a2 the sides are the tabs: All · Yours · Outside, opening on All', !!D && JSON.stringify(D.tabs.slice(0, 3).map(t => t.w)) === JSON.stringify(['All', 'Yours', 'Outside']) && (D.tabs.find(t => t.on) || {}).k === 'all', JSON.stringify(D && D.tabs));
      const tn = k => ((D && D.tabs.find(t => t.k === k)) || {}).n;
      /* RE-POINTED (P-26, owner's pick 20 Nov 2026: People the Legora + Stripe way): the title alone (the count line beside it went: the chips say each number) */
      /* RE-POINTED 22 Nov 2026 (P-25 review): People has no foot line under the table (P-26, as drawn) — the All chip's
         number equals the rows */
      check('6b the page is People: "People" alone, the chips counting All · Yours · Outside; no A to Z, no foot line',
        !!D && D.title === 'People' && D.sub === '' && tn('all') === tn('yours') + tn('outside') && D.rows === tn('all') && D.foot === '' && !D.az, JSON.stringify(D && { t: D.title, s: D.sub, rows: D.rows, foot: D.foot, az: D.az }));
      /* RE-POINTED (P-26, owner's pick 20 Nov 2026: People the Legora + Stripe way): Name · Role (a soft badge) · Does for you · Agreements · Waiting on them; no Phone (Reach) column */
      check('6c the table as drawn: Name · Role · Does for you · Agreements · Waiting on them, no Phone; ours first — you first, wearing "you", your role in its column',
        !!D && JSON.stringify(D.cols) === JSON.stringify(['Name', 'Role', 'Does for you', 'Agreements', 'Waiting on them']) && !!D.first && /Amina Otieno/.test(D.first.name) && D.first.role === 'Admin' && /\byou\b/.test(D.first.sub),
        JSON.stringify(D && { c: D.cols, f: D.first }));
      /* RE-POINTED 17 Nov 2026 (#762): an away colleague's absence is said in their panel (the third figure: Away, until
         when and who stands in), round 6's row carries no pill */
      await page.click('#dir-tbody [data-dir-row="' + (await page.evaluate(() => (dirBook().find(p => p.name === 'Jonas Berg') || {}).key)) + '"]');
      const J = await until(() => { const p = document.getElementById('ins-panel'); const t = p && p.querySelector('.jov5-title'); if (!t || !/Jonas Berg/.test(t.textContent)) return null;
        /* RE-POINTED (P-26, owner's pick 20 Nov 2026: People the Legora + Stripe way): no tiles — Away is a badge under the name, its title the away line with the stand-in */
        /* RE-POINTED 22 Nov 2026 (P-26 review): the house's soft badge (.cun-badge), as Parties wears it */
        return [...p.querySelectorAll('.jov5-sub .cun-badge')].map(g => (g.textContent.trim() + ' ' + (g.getAttribute('title') || '')).replace(/\s+/g, ' ').trim()); });
      check('6d an away colleague\'s panel says "Away until …" and who stands in', !!J && J.some(x => /^Away Away until .+ stand-in: Amina Otieno/.test(x)), JSON.stringify(J));
      /* RETIRED 17 Nov 2026 (#762): 6e "twelve at a time, 1–12 of N · Show N more" — round 6's People is one page (old look only) */
      await shot('19-people-1440x780.png');
      /* RETIRED 17 Nov 2026 (#762, owner's ruling): 6f "a person at a party opens People with that person chosen" —
         its door was the party panel's People at rows, which stay gone. */
    });

    /* ---- 8 check #1's differences, built (lane A2's second pass, 19 Oct 2026) ---- */
    await part('8 check #1', async () => {
      await page.evaluate(() => setView('customers'));
      await backToList();
      await page.click('#cu-tbody [data-cu-cust="kenya freight ltd"]');
      await until(() => document.querySelector('#ins-panel .jov5-title'));
      await page.click('#ins-panel [data-jl-home]');
      /* RE-POINTED 17 Nov 2026 (#762): the count is the lit tab's (List N) */
      const J = await until(() => { const p = document.getElementById('ins-panel'); const b = p && [...p.querySelectorAll('b')].find(x => /on this list/.test(x.textContent));
        if (!b) return null;
        return { said: b.textContent.trim(), head: ((document.querySelector('.cun-page [data-cun-tab].is-on span') || {}).textContent || '').trim() }; });
      check('8a with nothing chosen Jambo says the list\'s own count, the number on its lit tab', !!J && !!J.head && J.said.startsWith(J.head + ' part'), JSON.stringify(J));
      /* RETIRED 17 Nov 2026 (#762, owner's ruling): 8b "Open the NDA ›" — a party's NDA door stays gone. */
      await page.click('#cu-tbody [data-cu-cust="kenya freight ltd"]');
      /* RE-POINTED (P-25, owner's pick 20 Nov 2026: Parties the Legora + Stripe way): the panel's way to all its agreements is its black button (.jov5-go[data-cun-cts]) */
      await until(() => document.querySelector('#ins-panel .jov5-go[data-cun-cts]'));
      /* RE-POINTED 20 Nov 2026 ("Parties, the SAP way revised", owner's pick 19 Nov, #804, f1108): the panel no longer
         lists three agreements to press one by one — its way to a party's agreements is the link to all of them on
         Contracts (data-cun-cts → regShowOnly; where it lands is 9b/9d). So: no agreement rows, and that link is there. */
      const P8 = await page.evaluate(() => { const p = document.getElementById('ins-panel');
        return { rows: p ? p.querySelectorAll('.jov5-row[data-jov] .jov5-rt b').length : -1, all: !!(p && p.querySelector('.jov5-go[data-cun-cts]')) }; });
      check('8c the panel reaches the party\'s agreements through one link to all of them on Contracts, not a list of three', P8.rows === 0 && P8.all, JSON.stringify(P8));
      await page.evaluate(() => { try { closeModal(); } catch (_){} });
      await page.evaluate(() => setView('directory'));
      await until(() => document.querySelector('#dir-tbody'));
      await page.evaluate(() => { const p = dirBook().find(x => /henry/i.test(x.email || '')); if (p) dirOpenPerson(p.key); });
      const T = await until(() => { const p = document.getElementById('ins-panel'); const t = p && p.querySelector('.jov5-title'); if (!t || !/Henry/.test(t.textContent)) return null; return true; }, null, 8000).then(v => v ? readPanel() : null);
      /* RE-POINTED (P-26, owner's pick 20 Nov 2026: People the Legora + Stripe way): someone on their side — Show their contracts is the black button, Email them the link beside it,
         their party the one row under "Their party" (a phone, where known, is Phone them there too) */
      /* RE-POINTED 22 Nov 2026 (P-26 review): the drawn "Their party" section is no row list — the party's name a line
         (.dirn-pty-n) and Open party its door ([data-dir-party]) — so it is read as drawn; "Named on" is no section any
         more: the contract and the party they are named on stand on their row (its line under the name, and Does for you) */
      const party = await page.evaluate(() => { const p = document.getElementById('ins-panel');
        const sec = p && [...p.querySelectorAll('.jov5-sec')].find(s => /^Their party$/.test(((s.querySelector('.jov5-label') || {}).textContent || '').trim()));
        const d = sec && sec.querySelector('[data-dir-party]');
        return { rows: sec ? [{ t: ((sec.querySelector('.dirn-pty-n') || {}).textContent || '').trim(), door: d ? 'data-dir-party' : '' }] : [] }; });
      const named = await page.evaluate(() => { const p = dirBook().find(x => /henry/i.test(x.email || '')); const r = p && document.querySelector('#dir-tbody [data-dir-row="' + p.key + '"]');
        return { rows: r ? [{ t: ((r.querySelector('td.dirn-does') || {}).textContent || '').replace(/\s+/g, ' ').trim(), s: ((r.querySelector('.cun-sub') || {}).textContent || '').trim() }] : [] }; });
      const reach = { rows: party.rows.filter(r => /data-dir-party/.test(r.door)) };
      const ACT = await page.evaluate(() => { const p = document.getElementById('ins-panel');
        return { go: !!(p && p.querySelector('.jov5-act .jov5-go[data-dirn-contracts]')), mail: !!(p && p.querySelector('.jov5-act .jov-lnk[data-dirn-mail]')) }; });
      check('8d someone on their side: Email them · Show their contracts · their party', ACT.go && ACT.mail && reach.rows.length === 1
        && reach.rows[0].t === 'Kenya Freight Ltd', JSON.stringify({ ACT, party: party.rows }));
      /* RE-POINTED 17 Nov 2026 (#762): the contracts they are named on, with their party */
      check('8e "Named on": the contract they are named on, with their party', named.rows.length === 1 && /Transport agreement$/.test(named.rows[0].t) && named.rows[0].s === 'Kenya Freight Ltd', JSON.stringify(named.rows));
      /* RE-POINTED 17 Nov 2026 (#762): what they do for their party is the line under their name */
      /* RE-POINTED (P-26, owner's pick 20 Nov 2026: People the Legora + Stripe way): under their name stands their role as a soft badge ("Their lead"); what they do for their party is
         their row's Does for you ("Negotiated for Transport agreement") */
      const does = await page.evaluate(() => { const p = dirBook().find(x => /henry/i.test(x.email || '')); const r = p && document.querySelector('#dir-tbody [data-dir-row="' + p.key + '"] td.dirn-does');
        return r ? r.textContent.replace(/\s+/g, ' ').trim() : null; });
      /* RE-POINTED 22 Nov 2026 (P-26 review): the drawn wording is "Negotiated <agreement>" (as drawn: "Negotiated Warehouse Services") */
      check('8f the line under their name says their role, "Their lead", and their row says what they do: "Negotiated Transport agreement"', !!T && T.sub.trim() === 'Their lead' && /^Negotiated Transport agreement$/.test(does || '') && !T.secs.some(s => /^Also at/.test(s.label)), JSON.stringify({ sub: T && T.sub, does }));
      if (reach.rows[0] && /data-dir-party/.test(reach.rows[0].door)){
        await page.click('#ins-panel [data-dir-party]');
        const L = await until(() => state.view === 'customers' && document.querySelector('#cu-tbody [data-cu-cust="kenya freight ltd"].is-landed, #cu-tbody [data-cu-cust="kenya freight ltd"].is-landed-held') ? 'lit' : null, null, 8000);
        check('8g the Party row lands on Parties, the party lit', L === 'lit', String(L));
      }
    });

    /* ---- 9 check #2's differences, built (lane A2, 19 Oct 2026) ---- */
    await part('9 check #2', async () => {
      const lit = () => until(() => { const e = document.querySelector('.is-landed, .is-landed-held'); return e ? (e.className + (e.hasAttribute('data-row') ? ' data-row' : '') + '|' + state.view + '|' + (e.getAttribute('data-ap-row') || '')) : null; }, null, 8000);
      /* RETIRED 17 Nov 2026 (#762): 9a "the panel's doors stand at their own width" — in Jambo's five parts the ROW is the door (owner, 15 Nov 2026). */
      await page.evaluate(() => setView('customers')); await backToList();
      /* RE-POINTED 19 Nov 2026 (the Parties round): Open party is gone — "All N agreements on Contracts ›" lands on Contracts narrowed to the party */
      await choose('kenya freight ltd');
      await page.click('#ins-panel [data-cun-cts]');
      /* Contracts is a place beside the Board (state.view stays 'dashboard'): read its own rows */
      const O = await until(() => { const rs = [...document.querySelectorAll('#ct-place #reg-tbody tr[data-row]')];
        return rs.length === 2 ? rs.map(r => r.getAttribute('data-row')).sort().join(',') : null; }, null, 8000);
      check('9b "All 2 agreements on Contracts" lands on Contracts with that party\'s two', O === 'MK-KF1,MK-KF2', String(O));
      await backToList();
      /* RE-POINTED 21 Nov 2026 (P-25, as drawn): the drawing has no "needs your attention" link — on Waiting on you the
         panel lists WHAT WAITS ON YOU, each with its kind badge and its act (the worklist row's own door, data-cu-need),
         where All shows the party's own facts */
      await page.click('.cun-page [data-cun-tab="wait"]');
      await choose('helio energy ltd');
      const WT = await until(() => { const p = document.getElementById('ins-panel'); const sec = p && p.querySelector('[data-jov5-sec="waits"]'); if (!sec) return null;
        return { rows: [...sec.querySelectorAll('.jov5-row')].map(r => ({ k: ((r.querySelector('.jov5-k') || {}).textContent || '').trim(), act: !!r.querySelector('[data-cu-need][data-cu-id="MK-AP1"]') })),
          facts: !!p.querySelector('[data-jov5-sec="facts"]'), attn: !!p.querySelector('[data-cun-attn]') }; }, null, 8000);
      check('9d on Waiting on you the panel lists what waits on Helio, each with its kind and its act on MK-AP1; no facts, no attention link', !!WT && WT.rows.length >= 1
        && WT.rows.every(r => r.k && r.act) && !WT.facts && !WT.attn, JSON.stringify(WT));
      await page.click('.cun-page [data-cun-tab="all"]');
      await page.evaluate(() => langSet('sv'));
      for (const v of ['customers', 'directory']){
        await page.evaluate(x => setView(x), v); await page.waitForTimeout(400);
        if (v === 'customers') await backToList();
        const cut = await page.evaluate(() => [...document.querySelectorAll('.cun-table th, .cun-name, .cun-tab, .apn-tab, .cun-head .ctf-hf')]
          .filter(e => e.scrollWidth > e.clientWidth + 1).map(e => e.textContent.trim().slice(0, 30)));
        check(`9e in Swedish nothing on ${v} is cut`, cut.length === 0, JSON.stringify(cut));
      }
      await page.evaluate(() => langSet('en'));
    });

    /* ---- 7 the owner's three screens ---- */
    await part('7 three screens', async () => {
      for (const [w, hgt] of SCREENS) {
        await page.setViewportSize({ width: w, height: hgt });
        for (const [view, sel, name] of [['customers', '#cu-tbody', 'parties'], ['directory', '#dir-tbody', 'people']]) {
          await page.evaluate(v => setView(v), view);
          if (view === 'customers') await backToList();
          await until(s => document.querySelector(s), sel);
          await page.waitForTimeout(250);
          /* RE-POINTED 17 Nov 2026 (#762): the sheet (.apn-card) beside the panel, its box and tabs (.apn-bar) in view */
          const G = await page.evaluate(() => {
            const card = document.querySelector('.apn-card'), p = document.getElementById('ins-panel'), fb = document.querySelector('.apn-card .apn-bar');
            const cr = card && card.getBoundingClientRect(), pr = p && p.getBoundingClientRect(), fr = fb && fb.getBoundingClientRect();
            return { side: !!(cr && pr && cr.right <= pr.left + 2 && pr.width > 200), filters: !!(fr && fr.bottom <= innerHeight && fr.top >= 0),
              sideways: document.documentElement.scrollWidth > innerWidth + 1, panelIn: !!(pr && pr.bottom <= innerHeight + 1),
              over: cr && pr ? Math.round(cr.right - pr.left) : null,
              cols: [...document.querySelectorAll('.cun-table thead th')].map(t => t.textContent.trim() + ':' + Math.round(t.getBoundingClientRect().width)) };
          });
          check(`7 ${name} at ${w}×${hgt}: the list and the panel side by side, the box and tabs in view, nothing sideways`, G.side && G.filters && !G.sideways && G.panelIn, JSON.stringify(G));
          /* check #1: the drawn words are read whole — the heads, each name */
          const cut = await page.evaluate(() => { const els = [...document.querySelectorAll('.cun-table thead th, #cu-tbody .cun-name, #dir-tbody .cun-name')];
            return { n: els.length, cut: els.filter(e => e.scrollWidth > e.clientWidth + 1).map(e => e.textContent) }; });
          check(`7 ${name} at ${w}×${hgt}: no column head or name is cut`, cut.n > 0 && cut.cut.length === 0, JSON.stringify(cut));
          if (view === 'customers') await page.click('#cu-tbody [data-cu-cust="kenya freight ltd"]').catch(() => {});
          await page.waitForTimeout(200);
          await shot(`19-${name}-${w}x${hgt}.png`);
        }
      }
    });
    check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } finally {
    await browser.close(); await h.stop();
  }
  console.log(failures ? `\n${failures} check(s) FAILED` : '\nall checks passed');
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
