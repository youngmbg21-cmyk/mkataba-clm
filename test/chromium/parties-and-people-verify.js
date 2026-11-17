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
    /* a party's own page (the panel's Open party, cuOpenCustomer) */
    const partyPage = async key => { await page.evaluate(k => cuOpenCustomer(k), key);
      return until(k => { const pg = document.querySelector('.cun-page[data-cu-screen="party"]'); if (!pg) return null; return {
        name: ((pg.querySelector('.cunp-head .ctf-h') || {}).textContent || '').trim(), key: k,
        waits: [...pg.querySelectorAll('.cunp-w')].map(w => ({ t: ((w.querySelector('b') || {}).textContent || '').trim(), cut: (() => { const b = w.querySelector('b'); return !!b && b.scrollWidth > b.clientWidth + 1; })(),
          door: (w.querySelector('[data-cu-need]') || { getAttribute: () => '' }).getAttribute('data-cu-need'), btn: ((w.querySelector('[data-cu-need]') || {}).textContent || '').trim() })),
        draft: [...pg.querySelectorAll('[data-cu-draft-with]')].map(b => b.getAttribute('data-cu-draft-with') + '|' + b.textContent.trim()) }; }, key, 10000); };
    const backToList = async () => { await page.evaluate(() => { const b = document.querySelector('.cun-page [data-cunp-back]'); if (b) b.click(); else setView('customers'); });
      await until(() => document.querySelector('.cun-page[data-cu-screen="list"] #cu-tbody')); };

    /* ---- 1 the head ---- */
    await part('1 the head', async () => {
      const B = await page.evaluate(() => {
        const pg = document.querySelector('.cun-page[data-cu-screen="list"]'); if (!pg) return null;
        const q = document.getElementById('cun-q'), head = pg.querySelector('.cun-head'), bar = pg.querySelector('.apn-bar');
        const r = e => e && e.getBoundingClientRect();
        return { old: !!document.querySelector('.cun-page .sap-band, .cun-page .cu-fb, .cun-page .reg-f-l, .cun-page .cu-find-l, .cun-page select[data-cu-f]'),
          box: !!(q && bar && bar.contains(q) && q.type === 'search'), ph: q && q.getAttribute('placeholder'),
          order: !!(head && bar && r(head).bottom <= r(bar).top + 1),
          tabs: bar ? [...bar.querySelectorAll('[data-cun-tab]')].map(t => ({ k: t.getAttribute('data-cun-tab'), on: t.classList.contains('is-on') })) : [],
          title: ((head && head.querySelector('.ctf-h')) || {}).textContent || '', sub: ((head && head.querySelector('.ctf-hf')) || {}).textContent || '' };
      });
      check('1a one box to filter in, under the head; no labelled band', !!B && B.box && B.order && !B.old, JSON.stringify(B));
      /* RE-POINTED 17 Nov 2026 (#762): the views are round 6's tabs — Folders · List · Waiting on you · No NDA (a tab
         with nothing in it stays out), the list opening on List. RETIRED 17 Nov 2026 (#762): Status as All · Live ·
         Ended and "+ Filter" — round 6's head has no Status tabs and no filters to add (old look only). */
      check('1a2 the views are the tabs: Folders · List, then Waiting on you · No NDA where they hold a party; the list opens on List', !!B
        && JSON.stringify(B.tabs.map(t => t.k).slice(0, 2)) === JSON.stringify(['folders', 'all']) && B.tabs.every(t => ['folders', 'all', 'wait', 'nda'].includes(t.k))
        && B.tabs.some(t => t.k === 'wait') && B.tabs.some(t => t.k === 'nda') && (B.tabs.find(t => t.on) || {}).k === 'all', JSON.stringify(B && B.tabs));
      /* RETIRED 17 Nov 2026 (#762): "a hairline under the title row" — the new look's head and list are ONE white sheet (old look only) */
      check('1b the box says "Filter this list"', !!B && B.ph === 'Filter this list', JSON.stringify(B && { ph: B.ph }));
      /* RETIRED 17 Nov 2026 (#762): "… on paper with live parties" and the head's "+ Draft new agreement" — round 6's head
         says only the count; drafting with a party is its own page's New agreement (4f) (old look only) */
      check('1c the head: "Parties" and "N counterparties"', !!B && B.title.trim() === 'Parties' && /^\d+ counterparties$/.test(B.sub.trim()), JSON.stringify(B && { t: B.title, s: B.sub }));
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
          name: kf ? ((kf.querySelector('.cun-name') || {}).textContent || '').trim() : '', deals: kf ? ((kf.querySelector('td.cun-num') || {}).textContent || '').trim() : '',
          chips: kf ? [...kf.querySelectorAll('.cun-sub > *')].map(x => x.textContent.trim()).filter(Boolean) : [] };
      });
      /* RE-POINTED 17 Nov 2026 (#762): the count on the lit tab is the rows drawn, the head's N and the foot's N.
         RETIRED 17 Nov 2026 (#762): "sorted by name" on the Party column and Columns in the chip row — round 6's
         table is fixed and has neither (old look only). */
      const n = Number((/(\d+)/.exec(L.lit) || [])[1]);
      check('2a the list\'s count is the lit tab\'s (List N), the head\'s and the foot\'s N, every row drawn',
        /^all \d+$/.test(L.lit) && n === L.rows && L.head === n + ' counterparties' && L.foot.startsWith(n + ' parties'), JSON.stringify({ lit: L.lit, rows: L.rows, head: L.head, foot: L.foot }));
      /* RE-POINTED 17 Nov 2026 (#762): round 6's columns, in order */
      check('2b the columns as drawn, in order: Party · Deals · On paper · Standing · NDA · Waiting on you', JSON.stringify(L.cols) === JSON.stringify(['Party', 'Deals', 'On paper', 'Standing', 'NDA', 'Waiting on you']), JSON.stringify(L.cols));
      /* RE-POINTED 17 Nov 2026 (#762): a party's line is its name over its stream as a chip; its agreements are the Deals column */
      check('2c a party\'s row: its name over its stream, its deals counted (2)', L.name === 'Kenya Freight Ltd' && L.chips.length >= 1 && L.deals === '2', JSON.stringify({ n: L.name, c: L.chips, d: L.deals }));
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
      const F = await until(() => { const f = document.getElementById('cu-pr-form'); return f ? { sug: (f.querySelector('[data-cu-pr-sug]') || {}).textContent || '', use: (f.querySelector('[data-cu-pr-use]') || {}).getAttribute ? f.querySelector('[data-cu-pr-use]').getAttribute('data-cu-pr-use') : '' } : null; });
      check('3a two boxes in the panel; the parties clause\'s address is offered, its city to use', !!F && /P\.O\. Box 30, Kisumu, Kenya/.test(F.sug) && F.use === 'Kisumu', JSON.stringify(F));
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
      const S = await until(() => { const sub = document.querySelector('#cu-tbody [data-cu-cust="kenya freight ltd"] .cun-sub'); if (!sub || !/Kisumu/.test(sub.textContent)) return null;
        const p = document.getElementById('ins-panel');
        const facts = p ? [...p.querySelectorAll('.jov5-row')].map(r => ((r.querySelector('.jov5-k') || {}).textContent || '').trim() + '=' + ((r.querySelector('.jov5-rt b') || {}).textContent || '').trim()) : [];
        return { sub: sub.textContent.replace(/\s+/g, ' ').trim(), facts }; }, null, 10000);
      check('3b the row and the panel say it: the row "Kisumu · … PVT-AB12CD", the panel City Kisumu and the organisation no.', !!S && /^Kisumu\b/.test(S.sub) && /PVT-AB12CD/.test(S.sub)
        && S.facts.includes('City=Kisumu') && S.facts.some(f => /PVT-AB12CD/.test(f)), JSON.stringify(S));
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
      const R = await until(() => { const sub = document.querySelector('#cu-tbody [data-cu-cust="kenya freight ltd"] .cun-sub'); return sub && /Kisumu/.test(sub.textContent) ? sub.textContent.replace(/\s+/g, ' ').trim() : null; });
      check('3e a refresh keeps it (the bootstrap carries it)', !!R && /^Kisumu\b/.test(R), R);
    });

    /* ---- 4 the panel as drawn ---- */
    await part('4 the panel', async () => {
      await page.click('#cu-tbody [data-cu-cust="kenya freight ltd"]');
      const P = await until(() => { const t = document.querySelector('#ins-panel .jov5-title'); return t && /Kenya Freight/.test(t.textContent); }).then(() => readPanel());
      const more = secOf(P, /^More$/), facts = secOf(P, /own facts/), ags = secOf(P, /^Agreements$/);
      /* RE-POINTED 17 Nov 2026 (#762): the panel's headline is the party, its doors the More group's rows.
         RETIRED 17 Nov 2026 (#762, owner's ruling 4): Open on Explorer. */
      check('4a the head: the party\'s name; its doors Open party · Web search · Edit the party record, no Explorer', !!P && P.title.trim() === 'Kenya Freight Ltd'
        && JSON.stringify(more.rows.map(r => r.door)) === JSON.stringify(['data-cun-open', 'data-cun-web', 'data-cu-pr-edit']) && /^Open party/.test((more.rows[0] || {}).t || ''),
        JSON.stringify(P && { t: P.title, more: more.rows }));
      /* RE-POINTED 17 Nov 2026 (#762): round 6's own facts — (City once filed) · Org. no. · Signer · NDA */
      check('4b the facts: (City) · Org. no. · Signer · NDA', JSON.stringify(facts.rows.map(r => r.k).filter(k => k !== 'City')) === JSON.stringify(['Org. no.', 'Signer', 'NDA']), JSON.stringify(facts.rows));
      /* RE-POINTED 17 Nov 2026 (#762): the line under the name says the agreements; the signer is the person who signs
         for them (their link's cpsign, as the party's own page names her), with job title; the confirmed mutual NDA
         says Confirmed. RETIRED 17 Nov 2026 (#762): the Owner "(you)" and "Live agreements · on paper" facts (round 6 has neither). */
      const fk = k => (facts.rows.find(r => r.k === k) || {}).t || '';
      check('4c the line says "… in 2 agreements"; the Signer is Sofia Lunani, Legal counsel (who signs for them); the NDA Confirmed',
        !!P && /2 agreements/.test(P.sub) && fk('Signer') === 'Sofia Lunani, Legal counsel' && /^Confirmed/.test(fk('NDA')), JSON.stringify(P && { sub: P.sub, signer: fk('Signer'), nda: fk('NDA') }));
      /* RE-POINTED 17 Nov 2026 (#762): the Agreements group, each with the day it ends */
      check('4d the agreements, each with "Ends …"', ags.rows.length === 2 && ags.rows.every(a => /^Ends /.test(a.s)) && ags.rows.some(a => a.t === 'Mutual NDA') && ags.rows.some(a => a.t === 'Transport agreement'), JSON.stringify(ags.rows));
      /* RETIRED 17 Nov 2026 (#762, owner's ruling): 4e "People at Kenya Freight" rows — a party's People at rows stay gone. */
      await shot('19-party-panel-1440x780.png');
      /* RE-POINTED 17 Nov 2026 (#762): "Draft an agreement with Kenya Freight" is the party's own page's New agreement, for that party */
      const KF = await partyPage('kenya freight ltd');
      check('4f the party\'s own page drafts with it: "New agreement" for Kenya Freight', !!KF && KF.name === 'Kenya Freight Ltd' && KF.draft.includes('kenya freight ltd|New agreement') && KF.draft.every(d => d.startsWith('kenya freight ltd|')), JSON.stringify(KF));
      await backToList();
      /* RE-POINTED 17 Nov 2026 (#762): what waits on you is said whole on the party's page ("Waiting on you") */
      const HE = await partyPage('helio energy ltd');
      const ap = HE && HE.waits.find(w => w.door === 'approval');
      check('4i an approval the reader answers for an away colleague: "An approval, for Jonas", whole, with its door', !!ap && ap.t === 'An approval, for Jonas' && !ap.cut && ap.btn === 'Open approval', JSON.stringify(HE && HE.waits));
      await backToList();
      /* a colleague's request about a party waits on the reader: its row's Waiting column and its own page say it,
         with Open request (RE-POINTED 17 Nov 2026, #762: the party's page holds the panel's old waiting list) */
      const ND = await partyPage('nandi dairy');
      const Qp = await until(() => { const b = document.querySelector('.cun-page[data-cu-screen="party"] [data-cu-need="request"]'); return b ? { row: b.closest('.cunp-w').textContent.replace(/\s+/g, ' ').trim(), btn: b.textContent.trim() } : null; }, null, 10000);
      await backToList();
      /* the Waiting column says two in words and names every one on its hover, as the old column did (17 Nov 2026, #762) */
      const col = await page.evaluate(() => { const td = document.querySelector('#cu-tbody [data-cu-cust="nandi dairy"] td.cun-wait'); return td ? (td.textContent + ' ' + (td.getAttribute('title') || '')).replace(/\s+/g, ' ').trim() : ''; });
      check('4g a colleague\'s request about the party waits on you: the page says "Restricted asked for an NDA with Nandi Dairy" with "Open request", the row\'s Waiting column too',
        !!Qp && /Restricted asked for an NDA with Nandi Dairy/.test(Qp.row) && Qp.btn === 'Open request' && /Restricted asked for an NDA/.test(col), JSON.stringify({ page: Qp || (ND && ND.waits), col }));
      if (Qp){ await partyPage('nandi dairy'); await page.click('.cun-page[data-cu-screen="party"] [data-cu-need="request"]');
        const land = await until(() => state.view === 'intake' ? (document.querySelector('[data-ik-row].is-landed, .is-landed') ? 'lit' : 'page') : null, null, 8000);
        check('4h Open request lands on the request, lit', land === 'lit', land);
        await page.evaluate(() => setView('customers'));
        await backToList();
      }
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
          box: !!(q && bar && bar.contains(q) && q.type === 'search'), ph: q && q.getAttribute('placeholder'),
          title: ((pg.querySelector('.cun-head .ctf-h') || {}).textContent || '').trim(), sub: ((pg.querySelector('.cun-head .ctf-hf') || {}).textContent || '').trim(),
          cols: [...pg.querySelectorAll('.cun-table thead th')].map(t => t.textContent.trim()),
          tabs: [...pg.querySelectorAll('[data-dirn-tab]')].map(t => ({ k: t.getAttribute('data-dirn-tab'), w: t.firstChild.textContent.trim(), n: Number(((t.querySelector('span') || {}).textContent || '').trim()), on: t.classList.contains('is-on') })),
          az: !!document.querySelector('#dir-page .dir-az'), rows: rows.length,
          first: rows[0] ? { name: ((rows[0].querySelector('.cun-name') || {}).textContent || '').trim(), role: ((rows[0].querySelectorAll('td')[1] || {}).textContent || '').trim(), sub: ((rows[0].querySelector('.cun-sub') || {}).textContent || '').trim() } : null,
          foot: ((pg.querySelector('.apn-foot') || {}).textContent || '').trim() };
      });
      check('6a one box to filter in, "Filter this list"; no labelled band', !!D && D.box && !D.old && D.ph === 'Filter this list', JSON.stringify(D && { box: D.box, old: D.old, ph: D.ph }));
      check('6a2 the sides are the tabs: All · Yours · Outside, opening on All', !!D && JSON.stringify(D.tabs.slice(0, 3).map(t => t.w)) === JSON.stringify(['All', 'Yours', 'Outside']) && (D.tabs.find(t => t.on) || {}).k === 'all', JSON.stringify(D && D.tabs));
      const tn = k => ((D && D.tabs.find(t => t.k === k)) || {}).n;
      check('6b the page is People: "People" and "N · n of yours, n outside", each the tab\'s own number; no A to Z',
        !!D && D.title === 'People' && D.sub === `${tn('all')} · ${tn('yours')} of yours, ${tn('outside')} outside` && D.rows === tn('all') && D.foot === `${tn('all')} people` && !D.az, JSON.stringify(D && { t: D.title, s: D.sub, rows: D.rows, foot: D.foot, az: D.az }));
      check('6c the table as drawn: Name · Role · Does for you · Waiting on them (· Reach); ours first — you first, wearing "you", your role in its column',
        !!D && JSON.stringify(D.cols.slice(0, 4)) === JSON.stringify(['Name', 'Role', 'Does for you', 'Waiting on them']) && D.cols.length <= 5 && !!D.first && /Amina Otieno/.test(D.first.name) && D.first.role === 'Admin' && /\byou\b/.test(D.first.sub),
        JSON.stringify(D && { c: D.cols, f: D.first }));
      /* RE-POINTED 17 Nov 2026 (#762): an away colleague's absence is said in their panel (the third figure: Away, until
         when and who stands in), round 6's row carries no pill */
      await page.click('#dir-tbody [data-dir-row="' + (await page.evaluate(() => (dirBook().find(p => p.name === 'Jonas Berg') || {}).key)) + '"]');
      const J = await until(() => { const p = document.getElementById('ins-panel'); const t = p && p.querySelector('.jov5-title'); if (!t || !/Jonas Berg/.test(t.textContent)) return null;
        return [...p.querySelectorAll('.jov5-g')].map(g => g.textContent.replace(/\s+/g, ' ').trim()); });
      check('6d an away colleague\'s panel says "Away until …" and who stands in', !!J && J.some(x => /^Away\s*Away until .+ stand-in: Amina Otieno/.test(x)), JSON.stringify(J));
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
      await until(() => document.querySelector('#ins-panel .jov5-row[data-jov]'));
      /* RE-POINTED 17 Nov 2026 (#762): an agreement in the panel is opened on purpose — it lands on that contract's Cover (MAP: THE COVER FIRST) */
      const first = await page.evaluate(() => ((document.querySelector('#ins-panel .jov5-row[data-jov] .jov5-rt b') || {}).textContent || '').trim());
      await page.click('#ins-panel .jov5-row[data-jov]');
      const A = await until(n => { const c = typeof pdContract === 'function' && pdContract(); return c && c.name === n && document.querySelector('#modal-root [data-dlg-page].is-cover') ? 'cover' : null; }, first, 10000);
      check('8c an agreement in the panel opens that contract on its Cover', A === 'cover', String(A) + ' · ' + first);
      await page.evaluate(() => { try { closeModal(); } catch (_){} });
      await page.evaluate(() => setView('directory'));
      await until(() => document.querySelector('#dir-tbody'));
      await page.evaluate(() => { const p = dirBook().find(x => /henry/i.test(x.email || '')); if (p) dirOpenPerson(p.key); });
      const T = await until(() => { const p = document.getElementById('ins-panel'); const t = p && p.querySelector('.jov5-title'); if (!t || !/Henry/.test(t.textContent)) return null; return true; }, null, 8000).then(v => v ? readPanel() : null);
      const reach = secOf(T, /^Reach them$/), named = secOf(T, /^Named on/);
      /* RE-POINTED 17 Nov 2026 (#762): someone on their side — Email them · Show their contracts · their party, as Reach them's rows */
      check('8d someone on their side: Email them · Show their contracts · their party', JSON.stringify(reach.rows.map(r => r.door)) === JSON.stringify(['data-dirn-mail', 'data-dirn-contracts', 'data-dir-party'])
        && reach.rows[2] && reach.rows[2].t === 'Kenya Freight Ltd', JSON.stringify(reach.rows));
      /* RE-POINTED 17 Nov 2026 (#762): the contracts they are named on, with their party */
      check('8e "Named on": the contract they are named on, with their party', named.rows.length === 1 && named.rows[0].t === 'Transport agreement' && named.rows[0].s === 'Kenya Freight Ltd', JSON.stringify(named.rows));
      /* RE-POINTED 17 Nov 2026 (#762): what they do for their party is the line under their name */
      check('8f the line under their name says what they do for their party: "Their lead · negotiated for Transport agreement"', !!T && /^Their lead · negotiated for Transport agreement$/.test(T.sub.trim()) && !T.secs.some(s => /^Also at/.test(s.label)), JSON.stringify(T && T.sub));
      if (reach.rows[2] && reach.rows[2].door === 'data-dir-party'){
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
      await page.click('#cu-tbody [data-cu-cust="kenya freight ltd"]');
      await until(() => document.querySelector('#ins-panel [data-cun-open]'));
      await page.click('#ins-panel [data-cun-open]');
      /* RE-POINTED 17 Nov 2026 (#762): Open party opens the party's own page (round 6), not the Contracts place */
      const O = await until(() => { const pg = document.querySelector('.cun-page[data-cu-screen="party"]'); return pg ? ((pg.querySelector('.cunp-head .ctf-h') || {}).textContent || '').trim() : null; }, null, 8000);
      check('9b Open party lands on the party\'s own page', O === 'Kenya Freight Ltd', String(O));
      await backToList();
      /* RETIRED 17 Nov 2026 (#762, owner's ruling 4): 9c Open on Explorer. */
      /* RE-POINTED 17 Nov 2026 (#762): the approval's door is on the party's page */
      const HE = await partyPage('helio energy ltd');
      if (HE && HE.waits.some(w => w.door === 'approval')){ await page.click('.cun-page[data-cu-screen="party"] [data-cu-need="approval"]');
        const A = await lit();
        check('9d an approval on the party\'s page lands on its row on Approvals, lit', !!A && /\|approvals\|MK-AP1$/.test(A), String(A)); }
      else check('9d an approval on the party\'s page lands on its row on Approvals, lit', false, 'no approval row');
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
