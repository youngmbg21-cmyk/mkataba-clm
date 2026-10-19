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

    /* ---- 1 the band ---- */
    await part('1 the band', async () => {
      const B = await page.evaluate(() => {
        const band = document.querySelector('.cu-page .sap-band'); if (!band) return null;
        const boxes = [...band.querySelectorAll('.cu-fb > *')].map(el => {
          const l = el.querySelector('.reg-f-l, .cu-find-l'), b = el.querySelector('.reg-f-v, .cu-find-box');
          const lr = l && l.getBoundingClientRect(), br = b && b.getBoundingClientRect();
          return { label: l ? l.textContent.trim() : '', value: b ? b.textContent.trim() : '', above: !!(lr && br && lr.bottom <= br.top + 1 && lr.width > 0) };
        });
        const q = document.getElementById('cu-q');
        return { boxes, ph: q && q.getAttribute('placeholder'), title: (band.querySelector('.cu-t') || {}).textContent || '', sub: (band.querySelector('.cu-hs') || {}).textContent || '',
          draft: !!band.querySelector('[data-cu-draft]'), hair: getComputedStyle(band.querySelector('.cu-fb')).borderTopStyle };
      });
      check('1a each box\'s word is above it: Party name · Status · Stream · Owner · NDA', !!B && JSON.stringify(B.boxes.map(b => b.label)) === JSON.stringify(['Party name', 'Status', 'Stream', 'Owner', 'NDA']) && B.boxes.every(b => b.above), JSON.stringify(B && B.boxes));
      check('1b the find box says "Name or city"; Status opens on Live; a hairline over the filters', !!B && B.ph === 'Name or city' && B.boxes[1] && B.boxes[1].value === 'Live' && B.hair === 'solid', JSON.stringify(B && { ph: B.ph, st: B.boxes[1], hair: B.hair }));
      check('1c the head: "Parties N" and "… on paper with live parties", and + Draft new agreement', !!B && /^Parties\s*\d+$/.test(B.title.trim()) && /on paper with live parties$/.test(B.sub.trim()) && B.draft, JSON.stringify(B && { t: B.title, s: B.sub }));
    });

    /* ---- 2 the list ---- */
    await part('2 the list', async () => {
      const L = await page.evaluate(() => ({
        head: (document.querySelector('.cu-card .ap-card-t') || {}).textContent || '',
        cols: [...document.querySelectorAll('.cu-table thead th')].map(t => t.textContent.trim()),
        rows: document.querySelectorAll('#cu-tbody [data-cu-cust]').length,
        foot: (document.querySelector('.cu-foot') || {}).textContent || '',
        columns: !!document.querySelector('[data-lc-btn="customers"]'),
        sub: (document.querySelector('#cu-tbody [data-cu-cust="kenya freight ltd"] .cu-ps') || {}).textContent || '',
        old: !!document.querySelector('#cu-tbody [data-cu-cust="retired supplies ltd"]'),
      }));
      check('2a "Parties N live · sorted by name", and Columns', /^Parties\s*\d+\s*live · sorted by name$/.test(L.head.replace(/\s+/g, ' ').trim()) && L.columns, L.head);
      check('2b the columns as drawn', JSON.stringify(L.cols) === JSON.stringify(['Party', 'City', 'Live', 'Ended', 'On paper', 'Next to end', 'Waiting on you', 'NDA']), JSON.stringify(L.cols));
      check('2c a party\'s line: "2 agreements · <stream>"', /^2 agreements · \S/.test(L.sub), L.sub);
      check('2d ten at a time, the cap said: "10 of N shown · Show more"; a party with nothing live is off Live', L.rows === 10 && /^10 of 1\d shown · Show more/.test(L.foot.trim()) && !L.old, JSON.stringify(L));
      await page.click('[data-lc-more="customers"]');
      const M = await until(() => { const n = document.querySelectorAll('#cu-tbody [data-cu-cust]').length; return n > 10 ? { n, foot: (document.querySelector('.cu-foot') || {}).textContent.trim() } : null; });
      check('2e Show more draws the rest, and the foot says so', !!M && new RegExp(`^${M.n} of ${M.n} shown`).test(M.foot), JSON.stringify(M));
      await shot('19-parties-list-1440x780.png');
    });

    /* ---- 3 a party's city, one home ---- */
    await part('3 the city', async () => {
      await page.click('#cu-tbody [data-cu-cust="kenya freight ltd"]');
      await until(() => document.querySelector('#ins-panel [data-cu-pr-edit]'));
      await page.click('#ins-panel .ins-sub [data-cu-pr-edit]');
      const F = await until(() => { const f = document.getElementById('cu-pr-form'); return f ? { sug: (f.querySelector('[data-cu-pr-sug]') || {}).textContent || '', use: (f.querySelector('[data-cu-pr-use]') || {}).getAttribute ? f.querySelector('[data-cu-pr-use]').getAttribute('data-cu-pr-use') : '' } : null; });
      check('3a two boxes in the panel; the parties clause\'s address is offered, its city to use', !!F && /P\.O\. Box 30, Kisumu, Kenya/.test(F.sug) && F.use === 'Kisumu', JSON.stringify(F));
      await page.click('[data-cu-pr-use]');
      await page.fill('#cu-pr-org', 'PVT-AB12CD');
      await shot('19-party-city-form-1440x780.png');
      await page.click('[data-cu-pr-save]');
      const S = await until(() => { const td = document.querySelector('#cu-tbody [data-cu-cust="kenya freight ltd"] td.cu-city'); return td && td.textContent.trim() === 'Kisumu' ? {
        city: td.textContent.trim(), sub: (document.querySelector('#ins-panel .ins-sub') || {}).textContent || '', org: (document.querySelector('#ins-panel [data-ins-fact="org"] dd') || {}).textContent || '' } : null; });
      check('3b the City column and the panel say it: "Kisumu · with us since …", the organisation no. a fact', !!S && /^Kisumu · with us since /.test(S.sub.trim()) && /PVT-AB12CD/.test(S.org), JSON.stringify(S));
      const srv = await W.admin.json('/api/party-records');
      check('3c the server keeps it, one home', srv && srv.records && srv.records['kenya freight ltd'] && srv.records['kenya freight ltd'].city === 'Kisumu' && srv.records['kenya freight ltd'].orgNo === 'PVT-AB12CD', JSON.stringify(srv));
      await page.fill('#cu-q', 'kisumu');
      const Q = await until(() => { const rows = [...document.querySelectorAll('#cu-tbody [data-cu-cust]')].map(r => r.getAttribute('data-cu-cust')); return rows.length === 1 ? rows : null; });
      check('3d the find box finds a party by its city', JSON.stringify(Q) === JSON.stringify(['kenya freight ltd']), JSON.stringify(Q));
      await page.fill('#cu-q', '');
      await page.reload({ waitUntil: 'networkidle' });
      await until(() => window.state && state.view === 'customers' && document.querySelector('#cu-tbody'), null, 15000);
      const R = await until(() => { const td = document.querySelector('#cu-tbody [data-cu-cust="kenya freight ltd"] td.cu-city'); return td ? td.textContent.trim() : null; });
      check('3e a refresh keeps it (the bootstrap carries it)', R === 'Kisumu', R);
    });

    /* ---- 4 the panel as drawn ---- */
    await part('4 the panel', async () => {
      await page.click('#cu-tbody [data-cu-cust="kenya freight ltd"]');
      const P = await until(() => { const p = document.getElementById('ins-panel'); if (!p || !p.querySelector('.cu-people')) return null; return {
        word: (p.querySelector('.jl-head') || p).textContent.includes('Party'),
        title: (p.querySelector('.ins-cp') || {}).textContent || '',
        acts: [...p.querySelectorAll('.ins-h [data-ins-act]')].map(b => b.textContent.trim()),
        facts: [...p.querySelectorAll('.jl-rows dt')].map(d => d.textContent.trim()),
        nda: (p.querySelector('[data-ins-fact="nda"] dd') || {}).textContent || '',
        live: (p.querySelector('[data-ins-fact="live"] dd') || {}).textContent || '',
        owner: (p.querySelector('[data-ins-fact="owner"] dd') || {}).textContent || '',
        ags: [...p.querySelectorAll('.cu-ags [data-cu-ag]')].map(a => ({ t: (a.querySelector('b') || {}).textContent, pill: !!a.querySelector('.cu-ag-st .reg-stg, .cu-ag-st [class*="st"]'), sub: (a.querySelector('.cu-li-b span') || {}).textContent })),
        peopleHead: (p.querySelector('.cu-people h3') || {}).textContent || '',
        people: [...p.querySelectorAll('.cu-people [data-cu-pp]')].map(a => a.textContent.replace(/\s+/g, ' ').trim()),
        draft: (p.querySelector('[data-cu-draft-with]') || {}).textContent || '' }; });
      check('4a the head: the name, Open party · Open on Explorer, nothing else', !!P && /Kenya Freight Ltd/.test(P.title) && JSON.stringify(P.acts) === JSON.stringify(['Open party', 'Open on Explorer']), JSON.stringify(P && { t: P.title, a: P.acts }));
      check('4b the facts: Organisation no. · Owner · Live agreements · Next to end · NDA', !!P && JSON.stringify(P.facts) === JSON.stringify(['Organisation no.', 'Owner', 'Live agreements', 'Next to end', 'NDA']), JSON.stringify(P && P.facts));
      check('4c the owner is "(you)", live agreements "2 · … on paper", the NDA "Both sides (mutual) · secret until … · confirmed by you"',
        !!P && /\(you\)/.test(P.owner) && /^2 · .+ on paper$/.test(P.live.trim()) && /mutual/i.test(P.nda) && /secret until/.test(P.nda) && /confirmed by you/.test(P.nda) && /Open the NDA/.test(P.nda), JSON.stringify(P && { o: P.owner, l: P.live, n: P.nda }));
      check('4d the agreements with their stage pills and lines ("secret until …", "ends …")', !!P && P.ags.length === 2 && P.ags.every(a => a.pill) && P.ags.some(a => /secret until/.test(a.sub)) && P.ags.some(a => /ends /.test(a.sub)), JSON.stringify(P && P.ags));
      check('4e People at Kenya Freight: each with job title and what they do', !!P && /People at Kenya Freight/.test(P.peopleHead) && P.people.some(x => /Henry Dalu.*Head of procurement · negotiates MK-KF1/.test(x)) && P.people.some(x => /Sofia Lunani.*Legal counsel · signs for Kenya Freight/.test(x)), JSON.stringify(P && { h: P.peopleHead, p: P.people }));
      check('4f "Draft an agreement with Kenya Freight"', !!P && P.draft.trim() === 'Draft an agreement with Kenya Freight', P && P.draft);
      await shot('19-party-panel-1440x780.png');
      /* RE-POINTED 19 Oct 2026 (check #1): the first item whole, not cut; any more under it */
      const AP = await page.evaluate(() => { const t = document.querySelector('#cu-tbody [data-cu-cust="helio energy ltd"] td.cu-wait .cu-wait-t');
        return t ? { t: t.textContent.trim(), cut: t.scrollWidth > t.clientWidth + 1 } : null; });
      check('4i an approval the reader answers for an away colleague: "an approval, for Jonas", whole', !!AP && AP.t === 'an approval, for Jonas' && !AP.cut, JSON.stringify(AP));
      /* a colleague's request about a party waits on the reader */
      await page.fill('#cu-q', 'nandi');
      await until(() => document.querySelectorAll('#cu-tbody [data-cu-cust]').length === 1);
      await page.click('#cu-tbody [data-cu-cust="nandi dairy"]');
      const Q = await until(() => { const p = document.getElementById('ins-panel'); const b = p && p.querySelector('[data-cu-need="request"]'); if (!b) return null;
        return { row: b.closest('.cu-li').textContent.replace(/\s+/g, ' ').trim(), col: (document.querySelector('#cu-tbody [data-cu-cust="nandi dairy"] td.cu-wait') || {}).title || '' }; }, null, 10000);
      check('4g a colleague\'s request about the party waits on you, with "Open request"', !!Q && /Restricted asked for an NDA with Nandi Dairy/.test(Q.row) && /Open request/.test(Q.row) && /Restricted asked for an NDA/.test(Q.col), JSON.stringify(Q));
      if (Q){ await page.click('#ins-panel [data-cu-need="request"]');
        const land = await until(() => state.view === 'intake' ? (document.querySelector('[data-ik-row].is-landed, .is-landed') ? 'lit' : 'page') : null, null, 8000);
        check('4h Open request lands on the request, lit', land === 'lit', land);
        await page.evaluate(() => setView('customers'));
        await until(() => document.querySelector('#cu-tbody'));
      }
      await page.fill('#cu-q', '');
      await until(() => document.querySelectorAll('#cu-tbody [data-cu-cust]').length > 1);
    });

    /* ---- 5 columns ---- */
    await part('5 columns', async () => {
      await page.click('[data-lc-btn="customers"]');
      await until(() => document.querySelector('[data-lc-pop="customers"]'));
      await shot('19-parties-columns-1440x780.png');
      await page.click('[data-lc-pop="customers"] [data-lc-k="city"]');
      const C = await until(() => { const th = [...document.querySelectorAll('.cu-table thead th')].map(t => t.textContent.trim()); return th.includes('City') ? null : { th, open: !!document.querySelector('[data-lc-pop="customers"]') }; });
      check('5a hiding City takes it off the list, the list stays open to choose more', !!C && C.open && !C.th.includes('City') && C.th.includes('Live'), JSON.stringify(C));
      await page.click('[data-lc-btn="customers"]');
      const shut = await until(() => !document.querySelector('[data-lc-pop="customers"]'));
      check('5b pressed again, it closes', !!shut);
      await page.click('[data-lc-btn="customers"]'); await until(() => document.querySelector('[data-lc-reset]'));
      await page.click('[data-lc-reset]');
      const back = await until(() => [...document.querySelectorAll('.cu-table thead th')].some(t => t.textContent.trim() === 'City'));
      check('5c "As it was" puts every column back', !!back);
      await page.keyboard.press('Escape');
      await until(() => !document.querySelector('[data-lc-pop="customers"]'));
    });

    /* ---- 6 People ---- */
    await part('6 People', async () => {
      await page.evaluate(() => setView('directory'));
      await until(() => document.querySelector('#dir-tbody [data-dir-row]'), null, 10000);
      const D = await page.evaluate(() => {
        const band = document.querySelector('.dir-page .sap-band');
        const boxes = [...band.querySelectorAll('.cu-fb > *')].map(el => { const l = el.querySelector('.reg-f-l, .cu-find-l'), b = el.querySelector('.reg-f-v, .cu-find-box');
          const lr = l && l.getBoundingClientRect(), br = b && b.getBoundingClientRect(); return { label: l ? l.textContent.trim() : '', above: !!(lr && br && lr.bottom <= br.top + 1) }; });
        return { boxes, ph: document.getElementById('dir-q').getAttribute('placeholder'), title: band.querySelector('.cu-t').textContent.trim(), sub: band.querySelector('.cu-hs').textContent.trim(),
          head: document.querySelector('.dir-card .ap-card-t').textContent.replace(/\s+/g, ' ').trim(),
          cols: [...document.querySelectorAll('.dir-table thead th')].map(t => t.textContent.trim()),
          rows: document.querySelectorAll('#dir-tbody [data-dir-row]').length, foot: (document.querySelector('.dir-cardfoot') || {}).textContent || '',
          tabs: document.querySelectorAll('#dir-page [data-dir-tab], #dir-page .dir-az').length,
          away: [...document.querySelectorAll('#dir-tbody [data-dir-row]')].filter(r => r.querySelector('.dir-away')).map(r => r.textContent.replace(/\s+/g, ' ').trim()),
          first: (document.querySelector('#dir-tbody [data-dir-row] .dir-name') || {}).textContent || '', bar: (document.getElementById('dk-page') || {}).textContent || '' };
      });
      check('6a the words above the boxes: Name, email or party · Side · Party · Role in HaTi · Stream; "Type to find"', JSON.stringify(D.boxes.map(b => b.label)) === JSON.stringify(['Name, email or party', 'Side', 'Party', 'Role in HaTi', 'Stream']) && D.boxes.every(b => b.above) && D.ph === 'Type to find', JSON.stringify(D.boxes));
      check('6b the page is People: "People N", "<n> of ours · <n> at <n> parties"; no tabs, no A to Z', /^People\s*\d+$/.test(D.title) && /^\d+ of ours · \d+ at \d+ parties$/.test(D.sub) && D.tabs === 0, JSON.stringify({ t: D.title, s: D.sub, tabs: D.tabs, bar: D.bar }));
      check('6c the table as drawn: Name · Side · Party or company · Job title · In HaTi · Contracts · Email; "ours first, then theirs, by name"',
        JSON.stringify(D.cols) === JSON.stringify(['Name', 'Side', 'Party or company', 'Job title', 'In HaTi', 'Contracts', 'Email']) && /ours first, then theirs, by name$/.test(D.head) && /Amina Otieno/.test(D.first), JSON.stringify({ c: D.cols, h: D.head, f: D.first }));
      check('6d an away colleague wears "Away until …" on their row', D.away.some(x => /Jonas Berg.*Away until/.test(x)), JSON.stringify(D.away));
      check('6e twelve at a time, the cap said: "12 of N shown · Show more"', D.rows === 12 && /^12 of 1\d shown · Show more/.test(D.foot.trim()), JSON.stringify({ r: D.rows, f: D.foot }));
      await page.click('#dir-tbody [data-dir-row="' + (await page.evaluate(() => (dirBook().find(p => p.name === 'Jonas Berg') || {}).key)) + '"]');
      await until(() => /Jonas Berg/.test((document.querySelector('#ins-panel .ins-cp') || {}).textContent || ''));
      await shot('19-people-1440x780.png');
      /* a person at a party opens People with them chosen and lit */
      await page.evaluate(() => setView('customers'));
      await until(() => document.querySelector('#cu-tbody'));
      await page.click('#cu-tbody [data-cu-cust="kenya freight ltd"]');
      await until(() => document.querySelector('#ins-panel [data-cu-pp]'));
      await page.click('#ins-panel [data-cu-pp]');
      const O = await until(() => { if (state.view !== 'directory') return null; const r = document.querySelector('#dir-tbody tr.is-sel'); return r ? { name: r.querySelector('.dir-name').textContent, lit: r.classList.contains('is-landed'), panel: (document.querySelector('#ins-panel .ins-cp') || {}).textContent || '' } : null; }, null, 8000);
      check('6f a person at a party opens People with that person chosen and lit', !!O && /Henry Dalu|Sofia Lunani/.test(O.name) && O.lit && O.panel.trim() === O.name.trim(), JSON.stringify(O));
    });

    /* ---- 8 check #1's differences, built (lane A2's second pass, 19 Oct 2026) ---- */
    await part('8 check #1', async () => {
      await page.evaluate(() => setView('customers'));
      await until(() => document.querySelector('#cu-tbody'));
      await page.click('#cu-tbody [data-cu-cust="kenya freight ltd"]');
      await until(() => document.querySelector('#ins-panel .cu-people'));
      await page.click('#ins-panel .jl-back, #ins-panel [data-jl-back]');
      const J = await until(() => { const p = document.getElementById('ins-panel'); const b = p && p.querySelector('b');
        if (!b || !/on this list/.test(b.textContent)) return null;
        return { said: b.textContent.trim(), head: ((document.querySelector('.cu-card .ap-card-n') || {}).textContent || '').trim() }; });
      check('8a with nothing chosen Jambo says the list\'s own count, the number on its head', !!J && J.said.startsWith(J.head + ' part'), JSON.stringify(J));
      await page.click('#cu-tbody [data-cu-cust="kenya freight ltd"]');
      await until(() => document.querySelector('#ins-panel [data-cu-nda]'));
      await page.click('#ins-panel [data-cu-nda]');
      const N = await until(() => document.querySelector('[data-bs-kpi="value"].is-landed, [data-bs-kpi="value"].is-landed-held') ? 'lit' : null, null, 8000);
      check('8b "Open the NDA ›" lands on the NDA\'s "Secret until" figure, lit', N === 'lit', String(N));
      await page.evaluate(() => setView('customers'));
      await until(() => document.querySelector('#cu-tbody [data-cu-cust="kenya freight ltd"]'));
      await page.click('#cu-tbody [data-cu-cust="kenya freight ltd"]');
      await until(() => document.querySelector('#ins-panel [data-cu-ag]'));
      await page.click('#ins-panel [data-cu-ag]');
      const A = await until(() => document.querySelector('.ig-line-id.is-landed, .ig-line-id.is-landed-held') ? 'lit' : null, null, 8000);
      check('8c an agreement in the panel lands on Home\'s paper, its line lit', A === 'lit', String(A));
      await page.evaluate(() => setView('directory'));
      await until(() => document.querySelector('#dir-tbody'));
      await page.evaluate(() => { const p = dirBook().find(x => /henry/i.test(x.email || '')); if (p) dirOpenPerson(p.key); });
      const T = await until(() => { const p = document.getElementById('ins-panel'); if (!p || !/Henry/.test((p.querySelector('.ins-cp') || {}).textContent || '')) return null;
        return { acts: [...p.querySelectorAll('.ins-h [data-ins-act]')].map(b => b.textContent.trim()), rows: [...p.querySelectorAll('.jl-rows dt')].map(d => d.textContent.trim()),
          secs: [...p.querySelectorAll('.ins-sec h3')].map(h => h.firstChild.textContent.trim()), subs: [...p.querySelectorAll('.dir-ct-sub')].map(x => x.textContent.trim()),
          party: !!p.querySelector('[data-dir-party]') }; }, null, 8000);
      check('8d someone on their side: Show their contracts · Email', !!T && JSON.stringify(T.acts) === JSON.stringify(['Show their contracts', 'Email']), JSON.stringify(T && T.acts));
      check('8e their rows: Email · Phone · Party (a door) · Named on', !!T && JSON.stringify(T.rows) === JSON.stringify(['Email', 'Phone', 'Party', 'Named on']) && T.party, JSON.stringify(T && T.rows));
      check('8f "On these contracts", each saying what they do for their party; no "Also at"', !!T && T.secs.includes('On these contracts') && !T.secs.some(x => /^Also at/.test(x)) && T.subs.length && T.subs.every(x => / for Kenya Freight$/.test(x)), JSON.stringify(T && { s: T.secs, u: T.subs }));
      if (T && T.party){
        await page.click('#ins-panel [data-dir-party]');
        const L = await until(() => state.view === 'customers' && document.querySelector('#cu-tbody [data-cu-cust="kenya freight ltd"].is-landed, #cu-tbody [data-cu-cust="kenya freight ltd"].is-landed-held') ? 'lit' : null, null, 8000);
        check('8g the Party row lands on Parties, the party lit', L === 'lit', String(L));
      }
    });

    /* ---- 9 check #2's differences, built (lane A2, 19 Oct 2026) ---- */
    await part('9 check #2', async () => {
      const lit = () => until(() => { const e = document.querySelector('.is-landed, .is-landed-held'); return e ? (e.className + '|' + state.view + '|' + (e.getAttribute('data-ap-row') || '')) : null; }, null, 8000);
      const choose = async key => { await page.evaluate(() => setView('customers')); await until(() => document.querySelector('#cu-tbody'));
        await page.evaluate(k => { const r = document.querySelector(`#cu-tbody [data-cu-cust="${k}"]`); if (r) r.click(); }, key); await until(() => document.querySelector('#ins-panel [data-ins-act]')); };
      await choose('kenya freight ltd');
      const W = await page.evaluate(() => [...document.querySelectorAll('#ins-panel .ins-acts [data-ins-act]')].map(b => Math.round(b.getBoundingClientRect().width)));
      check('9a the panel\'s doors stand at their own width', W.length === 2 && W[0] < 150, JSON.stringify(W));
      await page.click('#ins-panel [data-ins-act="open"]');
      const O = await lit();
      check('9b Open party lands on the place\'s first paper, lit', !!O && /igw-card|data-row|ig/.test(O) && /dashboard/.test(O), String(O));
      await choose('kenya freight ltd');
      await page.click('#ins-panel [data-ins-act="explorer"]');
      const E = await lit();
      check('9c Open on Explorer lands on the party\'s chip on the map, lit', !!E && /ig-lens/.test(E), String(E));
      await choose('helio energy ltd');
      const hasAp = await page.evaluate(() => !!document.querySelector('#ins-panel [data-cu-need="approval"]'));
      if (hasAp){ await page.click('#ins-panel [data-cu-need="approval"]');
        const A = await lit();
        check('9d an approval in the party\'s panel lands on its row on Approvals, lit', !!A && /\|approvals\|MK-AP1$/.test(A), String(A)); }
      else check('9d an approval in the party\'s panel lands on its row on Approvals, lit', false, 'no approval row');
      await page.evaluate(() => langSet('sv'));
      for (const v of ['customers', 'directory']){
        await page.evaluate(x => setView(x), v); await page.waitForTimeout(400);
        const cut = await page.evaluate(() => [...document.querySelectorAll('.cu-table th, .cu-wait-t, .dir-table th, .dir-table td, .dir-clamp')]
          .filter(e => e.scrollWidth > e.clientWidth + 1 || (/dir-clamp|cu-wait-t/.test(e.className) && e.scrollHeight > e.clientHeight + 1)).map(e => e.textContent.trim().slice(0, 30)));
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
          await until(s => document.querySelector(s), sel);
          await page.waitForTimeout(250);
          const G = await page.evaluate(() => {
            const card = document.querySelector('.cu-card'), p = document.getElementById('ins-panel'), fb = document.querySelector('.sap-band .cu-fb');
            const cr = card && card.getBoundingClientRect(), pr = p && p.getBoundingClientRect(), fr = fb && fb.getBoundingClientRect();
            return { side: !!(cr && pr && cr.right <= pr.left + 2 && pr.width > 200), filters: !!(fr && fr.bottom <= innerHeight && fr.top >= 0),
              sideways: document.documentElement.scrollWidth > innerWidth + 1, panelIn: !!(pr && pr.bottom <= innerHeight + 1) };
          });
          check(`7 ${name} at ${w}×${hgt}: the list and the panel side by side, the filters in view, nothing sideways`, G.side && G.filters && !G.sideways && G.panelIn, JSON.stringify(G));
          /* check #1: the drawn words are read whole — the Waiting column's first item, a party's and a job's name */
          const cut = await page.evaluate(() => { const els = [...document.querySelectorAll('.cu-wait-t, .dir-clamp, .dir-table th, .cu-table th')];
            return { n: els.length, cut: els.filter(e => e.scrollWidth > e.clientWidth + 1 || e.scrollHeight > e.clientHeight + 1).map(e => e.textContent) }; });
          check(`7 ${name} at ${w}×${hgt}: nothing in the Waiting, Party or Job title cells is cut`, cut.n > 0 && cut.cut.length === 0, JSON.stringify(cut));
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
