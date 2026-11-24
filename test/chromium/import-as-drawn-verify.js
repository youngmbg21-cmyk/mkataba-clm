/* IMPORT AS DRAWN (round 22 of the redesign, "The SAP way", with option 1's
   "One at a time" view for "Check all"; the owner's yes of 18 Oct 2026 to
   build every drawn part — js/views/migration.js)

   WHAT THIS PINS, driven in a real browser on Import contracts, with Jambo's
   reading staged (his answer per file stands in for the model; nothing else is
   faked) and an onboarding allowance of 200 files, 41 used
     1 the total before it starts: in Jambo calls and files, never money
     2 the head says what the batch is; Choose files… opens the chooser
     3 the five readings as the list head's tabs; a tab narrows the list to
       what it counts, All brings it back; "1–9 of 12 · Show 3 more"
     4 one table, the ones that need you first, in the drawn columns
     5 a press chooses a file: Jambo's panel says "Check this file", the end
       Jambo was not sure of in amber with the clause it read, File it grey
       with its reason; ‹ Jambo lets the file go
     6 Open the file: the file's own words numbered where each fact was found;
       Jambo's why with "Use: renews by itself", which fills the box; File it
       files it — on the server — and the next file comes up
     7 a refresh lands on the same file in the check view; ‹ All files back
     8 a duplicate: Jambo asks "Is this a copy?"; Skip leaves it out
     9 Review spreadsheet is a menu of two; pressed again it closes
    10 the ask box asks as every Jambo box asks, with no hint line under it
       (re-pointed 21 Oct 2026, Chambers: no hint line under any Jambo box)
    11 the owner's three screens: nothing sideways, the panel in the window,
       the check view's two cards side by side
   Waits ask for the state, bounded; a missing part reports.
   RE-POINTED 21 Oct 2026 (Part 8, "every list page the Legora way", the
   owner's pick): 3 the five figures are the list head's TAB ROW (All · To
   check · Duplicate? · No readable text · Filed, a tab with none left out), a
   tab pressed again stays and All brings the list back, the foot says
   "1–9 of 12 · Show 3 more"; 4b the list card's head is gone — its words are
   the All tab's hover; 11a the tab row stands where the figures did; 13 Show
   more is the foot's [data-lh-more]. Each claim kept.
   RE-POINTED (P-33, owner's pick 20 Nov 2026: Import the Legora + Stripe way): the title alone, the batch said by
   its chips (2a); the five figure tiles are ONE batch bar with its legend, a legend word the tile's press (3); the
   calm table File · Reading · What Jambo read · How sure · Stream · Value with no buttons on the rows (4); the panel's
   head is the file (paper, badge, name, "N of 5 details sure"), the unsure fact opened in the file's words (5, 8, 13e).
   RE-POINTED 21 Nov 2026 (P-33, as drawn): the title "Import contracts" (2a); no foot under the table and no "Read whole"
   row (3b, 4b — the drawing draws neither; the chips count); a copy's act "Skip the copy" (8a); a file to check carries
   Check it · File it (5e2); the unsure fact's place said after its words (5d); the value with its period "/yr" (13c).
   Run: node test/chromium/import-as-drawn-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { chromium } = require('playwright-core');
const H = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = process.env.HATI_SHOT_DIR || '';
let failures = 0;
const check = (name, pass, detail) => {
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
  if (!pass) failures++;
};
const shot = async (page, name) => { if (!OUT) return; try { await page.screenshot({ path: path.join(OUT, name + '.png') }); } catch (_) {} };

const LEASE = `WAREHOUSE LEASE

§ 1 Parties. Bandari Warehousing Ltd, Mombasa ("the Landlord") and Highland Corporate Ltd ("the Tenant").

§ 2 Premises. A warehouse of 1,200 square metres at Port Reitz, Mombasa.

§ 3 Term. This lease applies from 1 April 2019. It renews by itself for a further year at a time unless it is ended three months before the term runs out.

§ 4 Rent. The rent is KES 480,000 a year, paid quarterly in advance.

§ 5 Signatures. Signed in Mombasa on 14 March 2019, in two copies.
`;
const body = (title, party, extra) => `${title}\n\n1. Parties. This Agreement is made between Highland Corporate Ltd and ${party}.\n\n`
  + `2. Scope. The parties agree to the terms set out below for the supply of goods and services.\n\n`
  + `3. Payment. Invoices are payable within thirty days of receipt.\n\n${extra || ''}4. Law. This Agreement is governed by the laws of Kenya.\n`;
const FILES = {
  'Warehouse_lease_Mombasa_2019.txt': LEASE,
  'Cleaning_services_scan.txt': body('CLEANING SERVICES AGREEMENT', 'Safi Cleaners Ltd', 'The fee is KES 1,250,000 for the term ending 30 April 2027.\n\n'),
  'NDA_Acme_draft_v2.txt': body('NON-DISCLOSURE AGREEMENT', 'Acme Ltd'),
  'Supply_Riverside_2023.txt': body('SUPPLY AGREEMENT', 'Riverside Foods Ltd', 'The value is KES 3,600,000. This Agreement ends on 31 March 2027.\n\n'),
  'Scan_0042.txt': 'faint page',
  'Supply_Mwangi_2023.txt': body('SUPPLY AGREEMENT', 'Mwangi Metals Ltd', 'The value is KES 2,200,000. This Agreement ends on 31 December 2026.\n\n'),
  'Licence_Stratos_signed.txt': body('SOFTWARE LICENCE', 'Stratos Software Ltd', 'The fee is KES 1,100,000. It ends on 15 January 2027.\n\n'),
  'Lease_Tornmark_2020.txt': body('OFFICE LEASE', 'Tornmark Properties Ltd', 'The rent is KES 3,600,000. It ends on 30 September 2030.\n\n'),
  'Consultancy_Baraka_2022.txt': body('CONSULTANCY AGREEMENT', 'Baraka Advisory LLP', 'The fee is KES 640,000. It ends on 30 June 2027.\n\n'),
  'Transport_Upesi_2021.txt': body('TRANSPORT AGREEMENT', 'Upesi Movers Ltd', 'The fee is KES 950,000. It ends on 31 May 2027.\n\n'),
  'Storage_Kilindini_2022.txt': body('STORAGE AGREEMENT', 'Kilindini Stores Ltd', 'The fee is KES 720,000. It ends on 31 August 2027.\n\n'),
};

(async () => {
  const h = await H.startHati({ HATI_AGENTS_AUTO: 'off' });
  await H.seedWorkspace(h, { approvalRules: [] });
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hati-impd-'));
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 780 } });
    const page = await ctx.newPage();
    page.on('pageerror', e => errors.push(e.message));
    const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
      while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
      return v; };
    const has = sel => page.locator(sel).count();
    const press = async (sel, what) => { if (!(await has(sel))) { check(what + ' (nothing to press: ' + sel + ')', false); return false; } await page.locator(sel).first().click(); return true; };
    const login = async () => {
      await page.goto(h.base + '/', { waitUntil: 'networkidle' });
      await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
      await until(() => window.state && state.contracts && state.contracts.some(c => c.id === 'MK-A2'), null, 20000);
      await page.keyboard.press('Escape').catch(() => {});
    };
    await login();
    /* Jambo's reading, staged: the allowance is real (the server's), the reading per file is his answer */
    await page.evaluate(async () => {
      await api('ai/allowance', 'PUT', { open: true, docs: 200 });
      await api('ai/allowance/document', 'POST', { count: 41 });
      state.aiConfigured = true;
      window.importQueueRead = undefined;   /* read here, as a workspace without the server's queue */
      const Hi = k => ({ confidence: Object.fromEntries(k.map(x => [x, 'high'])) });
      const all = ['contractType', 'counterparty', 'effectiveDate', 'expiryDate', 'value'];
      const READ = [
        [/WAREHOUSE LEASE/, Object.assign(Hi(['contractType', 'counterparty', 'effectiveDate', 'value']), { contractType: 'Warehouse lease', counterparty: 'Bandari Warehousing Ltd', effectiveDate: '2019-04-01', value: 480000, currency: 'KES', noticePeriodDays: 90,
          sourceSpans: { counterparty: 'Bandari Warehousing Ltd', effectiveDate: '1 April 2019', value: 'KES 480,000' } })],
        [/CLEANING SERVICES/, { contractType: 'Cleaning services', counterparty: 'Safi Cleaners Ltd', effectiveDate: '2024-05-01', expiryDate: '2027-04-30', value: 1250000, currency: 'KES', confidence: { contractType: 'high', counterparty: 'high', effectiveDate: 'high', expiryDate: 'high', value: 'low' } }],
        [/^NON-DISCLOSURE AGREEMENT/, Object.assign(Hi(['contractType', 'effectiveDate', 'renewalType']), { contractType: 'Non-disclosure agreement', effectiveDate: '2024-02-01', renewalType: 'evergreen' })],
        ...[['Riverside', 'Supply agreement', 'Riverside Foods Ltd', '2027-03-31', 3600000], ['Mwangi', 'Supply agreement', 'Mwangi Metals Ltd', '2026-12-31', 2200000], ['Stratos', 'Software licence', 'Stratos Software Ltd', '2027-01-15', 1100000],
          ['Tornmark', 'Office lease', 'Tornmark Properties Ltd', '2030-09-30', 3600000], ['Baraka', 'Consultancy agreement', 'Baraka Advisory LLP', '2027-06-30', 640000], ['Upesi', 'Transport agreement', 'Upesi Movers Ltd', '2027-05-31', 950000],
          ['Kilindini', 'Storage agreement', 'Kilindini Stores Ltd', '2027-08-31', 720000]]
          .map(([w, t, p, e, v]) => [new RegExp(w), Object.assign(Hi(all), { contractType: t, counterparty: p, effectiveDate: '2023-01-01', expiryDate: e, value: v, currency: 'KES' })]),
      ];
      window.aiExtractMetadata = async text => { const hit = READ.find(([re]) => re.test(String(text || ''))); return JSON.parse(JSON.stringify(hit ? hit[1] : { confidence: {} })); };
      setView('migration');
    });
    await until(() => !!document.getElementById('mig-drop'));
    const paths = Object.entries(FILES).map(([n, t]) => { const f = path.join(dir, n); fs.writeFileSync(f, t); return f; });
    /* a copy of one of them, in the same batch: the same words in another file */
    const dup = path.join(dir, 'Supply_Riverside_2023_copy.txt'); fs.writeFileSync(dup, FILES['Supply_Riverside_2023.txt'].replace(/\n/g, '\r\n')); paths.push(dup);

    console.log('\n1 · the total before it starts');
    await page.setInputFiles('#mig-files', paths);
    const asked = await until(() => { const o = document.getElementById('confirm-overlay'); return o ? o.innerText.replace(/\s+/g, ' ') : null; }, null, 8000);
    check('1a whenever Jambo reads, the total is asked first — an open allowance too', !!asked, asked);
    /* RE-POINTED (owner, 8 Nov 2026: "remove all information related to jambo calls"): no cost is said */
    check('1b it names the files Jambo reads, no calls, never money', !!asked && /Read 12 files with Jambo\?/.test(asked) && !/\bcalls?\b|\bfree\b|costs? nothing|\$|KES|SEK|money/i.test(asked), asked);
    await shot(page, 'import-drawn-total-1440x780');
    if (asked) await page.click('#cf-ok');
    await until(() => { const M = migState(); return M.queue.length === paths.length && !M.running; }, null, 60000);
    await page.evaluate(async () => { try { await flushSaves(); } catch (_) {} renderMigration(); });

    /* RE-POINTED 16 Nov 2026 (the new look is the only look, #762): with files in, Import is "Import as drawn"
       (round 6, migNlRender): ONE table (.mign-table) of every file — no cap, nothing behind a "Show more" — the
       ones that need you first, then "Read whole · N"; the head says "N files · N read whole · N need you" with
       Choose files its one black button (#mign-choose; the drop strip stands only on the empty page); the five
       readings are five FIGURES over the list (.mign-fig, migNlFigsHtml), each a press that shows its own files
       and, pressed again, lets go; the tabs Need you · Read · All; Jambo's panel is #ins-panel (migNlPanelFiveHtml).
       A row's state is read off migRowByKey (the new rows carry no is-<state> class). */
    const ROWS = '.mign-table tbody tr[data-row]';
    const rowSel = k => `.mign-table tr[data-row="${k}"] td:first-child`;
    await until(sel => document.querySelector(sel), ROWS, 8000);
    console.log('\n2 · the head');
    /* RE-POINTED (P-33, owner's pick 20 Nov 2026: Import the Legora + Stripe way) */
    /* the title alone (no facts line beside it); what the batch is — how many need you, how many were read whole, every
       file — is said ONCE, by the chips under the ask box (Need you · Read · All with their counts) */
    const head = await until(() => { const h = document.querySelector('.mign-page .cun-head .ctf-h'); if (!h) return null;
      const chips = [...document.querySelectorAll('.mign-page .apn-bar [data-mign-tab]')].map(b => b.textContent.replace(/\s+/g, ' ').trim());
      return chips.length ? { title: h.textContent.trim(), facts: !!document.querySelector('.mign-page .cun-head .ctf-hf'), chips } : null; }, null, 6000);
    /* RE-POINTED 21 Nov 2026 (P-33, as drawn): the title is "Import contracts" */
    check('2a the title alone; the chips say what the batch is: need you · read whole · every file', !!head && head.title === 'Import contracts' && !head.facts
      && JSON.stringify(head.chips) === JSON.stringify(['Need you 5', 'Read 7', 'All 12']), JSON.stringify(head));
    const headBtn = await page.evaluate(() => [...document.querySelectorAll('#content button, #content [role="button"]')].filter(b => /^Choose files/.test(b.textContent.trim())).length);
    const chooser = await Promise.race([page.waitForEvent('filechooser', { timeout: 4000 }).then(() => true).catch(() => false),
      page.click('#mign-choose').then(() => new Promise(r => setTimeout(() => r(null), 4500))).catch(() => false)]);
    check('2b Choose files opens the chooser; ONE Choose files door on the page', chooser === true && headBtn === 1, JSON.stringify({ chooser, headBtn }));

    console.log('\n3 · the batch bar, and no cap');
    /* RE-POINTED (P-33, owner's pick 20 Nov 2026: Import the Legora + Stripe way) */
    /* the five coloured figure tiles became ONE thin batch bar (.mign-batch .mign-bbar) with its legend under it
       (.mign-bkey .mign-bk); a legend word is the press its tile was ([data-mign-fig]); a reading with none is not drawn */
    const FIG = k => `.mign-page .mign-batch [data-mign-fig="${k}"]`;
    const figs = await page.evaluate(() => ({ bar: document.querySelectorAll('.mign-page .mign-batch .mign-bbar > i').length,
      key: [...document.querySelectorAll('.mign-page .mign-batch .mign-bk')].map(e => e.innerText.replace(/\s+/g, ' ').trim()),
      tiles: document.querySelectorAll('.mign-figs, .mign-fig').length }));
    /* RE-POINTED 21 Nov 2026 (P-33, as drawn): a file parked because it looks unsigned is its own violet part, "is it signed?" */
    check('3a the readings as one batch bar with its legend: filed · to check · is it signed? · a copy? · no readable text (no tiles)', figs.bar === 5 && figs.tiles === 0
      && JSON.stringify(figs.key) === JSON.stringify(['7 filed', '2 to check', '1 is it signed?', '1 a copy?', '1 no readable text']), JSON.stringify(figs));
    /* RE-POINTED 21 Nov 2026 (P-33, as drawn): no foot under the table (the drawing has none); the All chip says 12 */
    const foot = await page.evaluate(sel => ({ n: document.querySelectorAll(sel).length, foot: !!document.querySelector('.mign-page .apn-foot'),
      all: ((document.querySelector('.mign-page [data-mign-tab="all"]') || {}).textContent || '').replace(/\s+/g, ' ').trim() }), ROWS);
    check('3b no cap: all twelve files in the one table, no foot, the All chip "All 12"', foot.n === 12 && !foot.foot && foot.all === 'All 12', JSON.stringify(foot));
    if (await press(FIG('k:check'), '3c the "to check" legend word')) {
      const R = await until(() => { const b = document.querySelector('.mign-page .mign-batch [data-mign-fig="k:check"]'); if (!b || b.getAttribute('aria-pressed') !== 'true') return null;
        return [...document.querySelectorAll('.mign-table tbody tr[data-row]')].map(r => migRowByKey(r.getAttribute('data-row')).st.k); }, null, 4000);
      check('3c a legend word narrows the list to what it counts', !!R && R.length === 3 && R.every(k => k === 'check'), JSON.stringify(R));
      await page.click(FIG('k:check'));
      const back = await until(sel => document.querySelectorAll(sel).length === 12 ? true : null, ROWS, 4000);
      await page.click('.mign-page [data-mign-tab="need"]');
      await until(() => { const b = document.querySelector('.mign-page [data-mign-tab="need"]'); return b && b.classList.contains('is-on') ? true : null; }, null, 3000);
      await page.click('.mign-page [data-mign-tab="need"]'); await page.waitForTimeout(300);
      const stays = await page.evaluate(sel => { const b = document.querySelector('.mign-page [data-mign-tab="need"]'); return !!b && b.classList.contains('is-on') && document.querySelectorAll(sel).length === 5; }, ROWS);
      await page.click('.mign-page [data-mign-tab="all"]');
      const all = await until(sel => document.querySelectorAll(sel).length === 12 ? true : null, ROWS, 4000);
      check('3d the legend word pressed again lets go (the whole list back); a tab pressed again stays; All brings the whole list back', !!back && stays && !!all, JSON.stringify({ back: !!back, stays, all: !!all }));
    }
    /* RETIRED 16 Nov 2026 (#762): 3e "Show 3 more shows all twelve" — old look only: the new look draws every file, no cap (3b) */

    console.log('\n4 · one table');
    const T = await page.evaluate(() => ({ heads: [...document.querySelectorAll('.mign-table thead th')].map(th => th.textContent.trim()),
      order: [...document.querySelectorAll('.mign-table tbody tr[data-row]')].map(r => migRowByKey(r.getAttribute('data-row')).st.k),
      grp: document.querySelectorAll('.mign-table tr.rdn-grp').length,
      rowButtons: document.querySelectorAll('.mign-table tbody tr[data-row] button, .mign-table tbody tr[data-row] [data-mign-go]').length }));
    /* RE-POINTED (P-33, owner's pick 20 Nov 2026: Import the Legora + Stripe way) */
    /* the calm table: File · Reading (a soft badge) · What Jambo read · How sure · Stream · Value right-aligned; the Looks
       column and the row's own button went (no buttons on the rows) */
    check('4a the drawn columns', JSON.stringify(T.heads) === JSON.stringify(['File', 'Reading', 'What Jambo read', 'How sure', 'Stream', 'Value']), JSON.stringify(T.heads));
    /* RE-POINTED 21 Nov 2026 (P-33, as drawn): the filed follow the ones that need you with no row between */
    check('4b the ones that need you first, then the filed, no row between', T.grp === 0
      && T.order.join() === 'check,check,check,dupe,none,filed,filed,filed,filed,filed,filed,filed', T.order.join() + ' | ' + T.grp);
    /* RE-POINTED (P-33, owner's pick 20 Nov 2026: Import the Legora + Stripe way) */
    /* no buttons on the rows: a press chooses, and a filed file's Open is the chosen file's panel's black button */
    let filedOpen = null;
    { const fk = await page.evaluate(() => (migRows().find(r => r.st.k === 'filed') || {}).key);
      if (fk && await press(rowSel(fk), '4c a filed row')) filedOpen = await until(k => { const s = document.getElementById('ins-panel'); const tr = document.querySelector(`.mign-table tr[data-row="${k}"]`);
        return s && tr && tr.classList.contains('is-picked') ? !!s.querySelector('.jov5-go[data-mign-go][data-mign-need="0"]') || null : null; }, fk, 4000); }
    check('4c no buttons on the rows; a filed file\'s Open is its panel\'s black button', T.rowButtons === 0 && !!filedOpen, JSON.stringify({ rowButtons: T.rowButtons, filedOpen }));
    await shot(page, 'import-drawn-list-1440x780');

    console.log('\n8 · a duplicate');
    const dkey = await page.evaluate(() => { const r = migRows().find(x => x.st.k === 'dupe'); return r ? r.key : null; });
    /* RE-POINTED (#762): the duplicate's row in the one table, Jambo's panel #ins-panel (the promise kept: he asks
       whether it is a copy, with the choices, and Skip leaves it out, said on its row) */
    if (dkey && await press(rowSel(dkey), '8 the duplicate row')) {
      /* RE-POINTED (P-33, owner's pick 20 Nov 2026: Import the Legora + Stripe way) */
      /* the panel's head is the file (its badge "A copy?" and its name); its acts on one line: Skip it, it is a copy (black),
         Open the one we have (grey), Keep both a quiet link under them */
      const D = await until(() => { const s = document.getElementById('ins-panel'); return s && s.querySelector('[data-dup-skip]') ? { badge: ((s.querySelector('.mign5-top .apn-st') || {}).textContent || '').trim(),
        skip: ((s.querySelector('.jov5-go[data-dup-skip]') || {}).textContent || '').trim(), both: !!s.querySelector('.mign5-quiet[data-dup-import]') } : null; }, null, 4000);
      /* RE-POINTED 21 Nov 2026 (P-33, as drawn): "Skip the copy" (black), "Keep both" a quiet link */
      check('8a Jambo asks "A copy?" with the duplicate choices', !!D && D.badge === 'A copy?' && D.skip === 'Skip the copy' && D.both, JSON.stringify(D));
      if (D) await page.click('#ins-panel [data-dup-skip]');
      const left = await until(k => { const tr = document.querySelector(`.mign-table tr[data-row="${k}"]`); return tr && /left out|skipped/i.test(tr.textContent) ? true : null; }, dkey, 6000);
      check('8b Skip leaves it out, said on its row', !!left);
    } else check('8 a duplicate to decide', false, 'none waiting (needs this sitting\'s queue)');

    console.log('\n5 · a press chooses a file');
    const lease = await page.evaluate(() => (migContracts().find(c => /Warehouse/.test((c.upload || {}).fileName || '')) || {}).id);
    /* RE-POINTED (#762): the panel is Jambo's five parts for the chosen file (#ins-panel, migNlPanelFiveHtml) */
    if (lease && await press(rowSel(lease), '5 the lease\'s row')) {
      const P = await until(id => { const s = document.getElementById('ins-panel'); const tr = document.querySelector(`.mign-table tr[data-row="${id}"]`);
        if (!s || !tr || !tr.classList.contains('is-picked') || !s.querySelector('.jov5-title') || !/Warehouse/.test(s.textContent)) return null;
        /* RE-POINTED (P-33, owner's pick 20 Nov 2026: Import the Legora + Stripe way) */
        /* the panel's head: a small paper beside the file's badge, its name and "N of 5 details sure"; each fact a dot, the
           one Jambo was not sure of OPENED in place — the file's own words lit, its §, and a "Use: …" chip */
        const open = s.querySelector('.mign5-f.is-open'), ow = s.querySelector('.mign5-open');
        return { word: (s.querySelector('[data-jl-word]') || {}).textContent, back: !(s.querySelector('[data-jl-back]') || { hidden: true }).hidden,
          pic: !!s.querySelector('.mign5-top .mign5-pap'), badge: ((s.querySelector('.mign5-top .apn-st') || {}).textContent || '').trim(),
          title: (s.querySelector('.jov5-title') || {}).textContent, say: (s.querySelector('.mign5-top .jov5-sub') || {}).textContent,
          ends: open && { k: ((open.querySelector('.mign5-k') || {}).textContent || '').trim(), v: ((open.querySelector('.mign5-v') || {}).textContent || '').trim(),
            lit: ow ? ((ow.querySelector('.mign5-lit mark') || {}).textContent || '') + ' | ' + ((ow.querySelector('.mign5-lit') || {}).textContent || '') : '',
            where: ow ? ((ow.querySelector('.mign5-lit .mign5-w') || {}).textContent || '').trim() : '', use: !!(ow && ow.querySelector('[data-mign-use]')) },
          go: ((s.querySelector('.jov5-go') || {}).textContent || '').trim() }; }, lease, 6000);
      check('5a Jambo\'s panel holds the file: no word beside the tabs, no duplicate back button', !!P && !P.word && !P.back, JSON.stringify(P && { word: P.word, back: P.back }));
      /* RE-POINTED (P-33, owner's pick 20 Nov 2026: Import the Legora + Stripe way) */
      check('5b the head is the file: a small paper, its badge "To check", its name and how many details Jambo is sure of', !!P && P.pic && P.badge === 'To check'
        && P.title === 'Warehouse_lease_Mombasa_2019.txt' && /^\d of \d details sure$/.test(P.say || ''), JSON.stringify(P && [P.pic, P.badge, P.title, P.say]));
      /* RETIRED 16 Nov 2026 (#762): 5c "the facts as drawn: Title · Party · Starts · Ends · Value · Stream" in the panel —
         old look only: the five-part panel says what was read as rows; the six facts are the check view's (6a) */
      /* RE-POINTED (P-33, owner's pick 20 Nov 2026: Import the Legora + Stripe way) */
      /* RE-POINTED 21 Nov 2026 (P-33, as drawn): "not found" in amber; the § said after the file's words */
      check('5d the end Jambo could not read is opened in the file\'s own words, its §, with a Use chip', !!P && !!P.ends && P.ends.k === 'Ends' && /not found/i.test(P.ends.v)
        && /renews by itself/.test(P.ends.lit) && /§ 3/.test(P.ends.where) && P.ends.use, JSON.stringify(P && P.ends));
      /* RE-POINTED 21 Nov 2026 (P-33, as drawn): Check it (black), File it beside it (grey, with its reason while Ends is owed) */
      check('5e2 the panel\'s one black button is the file\'s own door: Check it', !!P && P.go === 'Check it', JSON.stringify(P && P.go));
      await shot(page, 'import-drawn-chosen-1440x780');
      /* RETIRED 16 Nov 2026 (#762): 5f "‹ Jambo lets the file go, and Jambo says the batch" — old look only: the new
         look's panel always reads a chosen file and says the batch in its three numbers */

      console.log('\n6 · Open the file: one at a time');
      if (await press('#ins-panel .jov5-go', '6 Check it (Open the file)')) {
        /* RE-POINTED 22 Nov 2026 (THE CHECK, A CALM TABLE, owner's pick): the rows carry the numbers (.mig-ckr-n), the
           title is the Title row's place (1, "Heading"), and the end Jambo could not read is answered in its own row (the
           "Renews by itself" chip), never in the panel */
        const V = await until(() => { const d = document.getElementById('mig-ck-doc'), f = document.getElementById('mig-ck-facts'); if (!d || !f || !d.querySelector('.mig-ck-text')) return null;
          return { title: ((d.querySelector('.mig-ck-title .mig-ck-m') || {}).textContent || ''), marks: [...d.querySelectorAll('.mig-ck-m')].map(m => [m.getAttribute('data-mig-n'), m.textContent.replace(/\s+/g, ' ')]),
            nums: [...f.querySelectorAll('.mig-ckr-n')].map(n => n.textContent), bar: ((document.querySelector('.mig-ck-bar') || {}).innerText || '').replace(/\s+/g, ' '),
            why: (document.querySelector('#mig-side .mig-ck-why') || {}).innerText || '', use: !!document.querySelector('#mig-ck-facts tr[data-mig-ff="expiryDate"] [data-mig-renews]') }; }, null, 8000);
        check('6a the file\'s own words, its title, numbered where each fact was found', !!V && V.title === 'WAREHOUSE LEASE'
          && JSON.stringify(V.marks.map(m => m[1])) === JSON.stringify(['WAREHOUSE LEASE', 'Bandari Warehousing Ltd', '1 April 2019', 'It renews by itself for a further year at a time unless it is ended three months before the term runs out.', 'KES 480,000'])
          && V.nums.join() === '1,2,3,4,5', JSON.stringify(V && { marks: V.marks, nums: V.nums }));
        /* re-pointed (fix pass, 19 Oct 2026): option 1's tabs as drawn — Check 3 · Decide N · Filed N — and Jambo's drawn sentence with the yearly reminder */
        check('6b the bar: ‹ All files · Check 3 · Decide 1 · Filed 7 · File n of 3', !!V && /All files/.test(V.bar) && /Check 3/.test(V.bar) && /Decide 1/.test(V.bar) && /Filed 7/.test(V.bar) && /File \d of 3/.test(V.bar), V && V.bar.replace(/\s+/g, ' '));
        /* RE-POINTED 20 Nov 2026 (the check made like the Send screen, owner: "build it as drawn"): the reason stands in the Ends card of Jambo's panel, the card naming the fact */
        /* RE-POINTED 22 Nov 2026 (THE CHECK, A CALM TABLE): the panel's Before you file says why, the row offers the answer */
        check('6c Jambo says why he was not sure, in the file\'s own words, and the row offers renews by itself', !!V && /Ends\s+No end date; § 3 says it renews by itself\./.test(V.why)
          && /With 3 months' notice, HaTi will remind you each year before the notice day\./.test(V.why) && V.use, V && V.why.slice(0, 260));
        await shot(page, 'import-drawn-check-1440x780');
        /* RE-POINTED 20 Nov 2026 (the check made like the Send screen): File it stands in the page's head, its reason on the button */
        const waitedGrey = await page.evaluate(() => { const b = document.querySelector('#page-head-acts [data-mig-file]');
          return b ? { dis: b.disabled, why: (b.title || '') } : null; });
        if (await press('#mig-ck-facts tr[data-mig-ff="expiryDate"] [data-mig-renews]', '6d the row\'s Renews by itself')) {
          const F = await until(() => { const f = document.getElementById('mig-ck-facts'); const b = document.querySelector('#page-head-acts [data-mig-file]'); const e = f && f.querySelector('[data-mig-f="expiryDate"]');
            return b && e && e.value === 'Renews by itself' && !b.disabled ? true : null; }, null, 4000);
          check('6d a press fills the box; File it is ready — a second press', !!F);
          /* RE-POINTED (#762) from 5e: File it waited, grey with its reason, until the box was filled */
          check('5e File it was grey, with its reason on it, until then', !!waitedGrey && waitedGrey.dis && /File it waits for Ends: choose “renews by itself” or a date\./.test(waitedGrey.why), JSON.stringify(waitedGrey));
          const before = await page.evaluate(() => migCheckId());
          await page.click('#page-head-acts [data-mig-file]');
          const next = await until(was => { const id = migCheckId(); return id && id !== was ? id : null; }, before, 8000);
          const rec = await page.evaluate(async id => { try { await flushSaves(); } catch (_) {} try { const c = await api('contracts/' + encodeURIComponent(id));
            const ob = (c.obligations || []).find(o => o.origin === 'renew-notice');
            /* the notice day: the coming anniversary of 1 April 2019, less 90 days, the first still ahead of today */
            const t = todayISO(); let want = '';
            for (let y = 2020; y < 2200 && !want; y++){ const a = new Date(y, 3, 1); a.setDate(a.getDate() - 90); const iso = `${a.getFullYear()}-${String(a.getMonth() + 1).padStart(2, '0')}-${String(a.getDate()).padStart(2, '0')}`; if (iso >= t) want = iso; }
            return { needs: !!(c.migration && c.migration.needsReview), renew: c.metadata && c.metadata.renewalType, expiry: c.expiry || null, cp: c.counterparty,
              ob: ob && { due: ob.due, rec: ob.recurring, party: ob.party, ok: ob.due === want } }; } catch (e) { return { err: String(e && e.message) }; } }, lease);
          check('6e File it files it on the server: checked, renews by itself, no end date', rec.needs === false && rec.renew === 'evergreen' && !rec.expiry && rec.cp === 'Bandari Warehousing Ltd', JSON.stringify(rec));
          check('6e2 and HaTi reminds you each year before the notice day: a yearly obligation of ours, on the server', !!rec.ob && rec.ob.ok && rec.ob.rec === 'annual' && rec.ob.party === 'ours', JSON.stringify(rec.ob));
          check('6f and the next file that waits comes up', !!next && next !== lease, String(next));
        }
      }

      console.log('\n12 · not signed: import as a draft? (fix pass)');
      const nkey = await page.evaluate(() => { const r = migRows().find(x => x.q && x.q.status === 'unsigned'); return r ? r.key : null; });
      check('12a the draft NDA is held, not filed: "To check · not signed: import as a draft?"', !!nkey && await page.evaluate(k => { const r = migRowByKey(k); return r.st.k === 'check' && r.st.why === 'not signed: import as a draft?' && !migContracts().some(c => /NDA_Acme/.test((c.upload || {}).fileName || '')); }, nkey), String(nkey));
      if (nkey){
        const onIt = await until(k => migCheckId() === k ? true : null, nkey, 3000) || await page.evaluate(k => { migCheckTo(k); return migCheckId() === k; }, nkey);
        /* RE-POINTED 22 Nov 2026 (PR 881, batch 7 review; THE CHECK, MADE LIKE THE SEND SCREEN, owner 20 Nov 2026, f1125):
           the three answers stand in the page's head as Skip and File it do — Leave it out · Import as signed · Import as a
           draft, the one black button last — and the owed "Filed as" is an EMPTY amber box whose words are on its title,
           no amber words (.need-empty) */
        const N = await until(() => { const f = document.getElementById('mig-ck-facts'), d = document.getElementById('mig-ck-doc'), a = document.getElementById('page-head-acts');
          if (!f || !d || !a || !a.querySelector('[data-mig-unsigned]')) return null;
          /* RE-POINTED 22 Nov 2026 (THE CHECK, A CALM TABLE): the owed Import as is a row like the others — its amber words and
             its "To fill" badge */
          const st = f.querySelector('[data-mig-ff="status"] .mig-ff-ro'), bs = [...a.querySelectorAll('[data-mig-unsigned]')];
          const bd = f.querySelector('[data-mig-ff="status"] .mig-ckr-b .apn-st');
          return { acts: bs.map(b => b.textContent.trim()), black: bs.filter(b => b.classList.contains('ui-btn-primary')).map(b => b.textContent.trim()),
            inFacts: !!f.querySelector('[data-mig-unsigned]'), text: !!d.querySelector('.mig-ck-text'),
            as: st ? (st.getAttribute('title') || '') : '', empty: !!st && st.classList.contains('is-owed') && !!bd && bd.textContent.trim() === 'To fill' }; }, null, 5000);
        check('12b in the walk it is a page: its own words, what it would be filed as, and three answers in the head',
          !!onIt && !!N && N.text && N.acts.join() === 'Leave it out,Import as signed,Import as a draft' && N.black.join() === 'Import as a draft' && !N.inFacts
          && /not signed: import as a draft\?/.test(N.as) && N.empty, JSON.stringify(N));
        const J = await page.evaluate(() => { const w = document.querySelector('#mig-side .mig-ck-why'); return w ? { t: w.innerText, use: !!w.querySelector('[data-mig-use]') } : null; });
        check('12b2 Jambo asks only the one question until it is answered — no instruction its read-only boxes cannot follow', !!J && /call it a draft/.test(J.t) && !/write the date|made between/.test(J.t) && !J.use, JSON.stringify(J));
        await shot(page, 'import-drawn-unsigned-1440x780');
        if (N && await press('#page-head-acts [data-mig-unsigned="draft"]', '12c Import as a draft')){
          /* ASK FOR THE STATE (22 Oct 2026): the draft exists a beat before the walk's id moves from the
             queue key ("q:2") to it, so the wait asks for both together; on time-out the last state reports */
          const draftNow = () => { const c = migContracts().find(x => /NDA_Acme/.test((x.upload || {}).fileName || '')); return c ? { id: c.id, status: c.status, hash: c.hash || null, out: !!(c.migration && c.migration.executedOutside), on: migCheckId() } : null; };
          const D = await until(() => { const c = migContracts().find(x => /NDA_Acme/.test((x.upload || {}).fileName || '')); return c && migCheckId() === c.id ? true : null; }, null, 10000)
            .then(() => page.evaluate(draftNow));
          check('12c Import as a draft makes a draft — nothing sealed, not signed outside HaTi — and the walk stays on it', !!D && D.status === 'Draft' && !D.hash && !D.out && D.on === D.id, JSON.stringify(D));
          /* RE-POINTED 22 Nov 2026 (THE CHECK, A CALM TABLE): the party the paper names is a chip in the Party row */
          const U = await until(() => { const b = document.querySelector('#mig-ck-facts [data-mig-ck-pick="counterparty"]'); return b ? b.textContent : null; }, null, 5000);
          check('12d no party marked: the row offers the one the file is made with — "Acme Ltd"', U === 'Acme Ltd', String(U));
          if (U){ await page.click('#mig-ck-facts [data-mig-ck-pick="counterparty"]');
            const P = await until(() => { const e = document.querySelector('#mig-ck-facts [data-mig-f="counterparty"]'); return e && e.value === 'Acme Ltd' ? true : null; }, null, 3000);
            check('12e a press fills the box; nothing is filed until File it', !!P && await page.evaluate(() => { const c = getContract(migCheckId()); return !!(c && c.migration && c.migration.needsReview); })); }
        }
      }
      const SL = await page.evaluate(id => { const c = getContract(id); const box = document.createElement('div'); box.innerHTML = migSignedLineHtml(c); return box.textContent; }, lease);
      check('12f signed where the file says so — never the start date', /^signed in Mombasa, 14 Mar 2019$/.test(SL), SL);
      const tabs = await page.evaluate(() => [...document.querySelectorAll('.mig-ck-tab')].map(t => t.textContent.replace(/\s+/g, ' ').trim()));
      check('12g the bar\'s tabs: Check · Decide · Filed', tabs.length === 3 && /^Check \d+$/.test(tabs[0]) && /^Decide \d+$/.test(tabs[1]) && /^Filed \d+$/.test(tabs[2]), JSON.stringify(tabs));
      const head = await page.evaluate(() => (document.getElementById('mig-choose') || {}).textContent);
      /* RE-POINTED 20 Nov 2026 (the check made like the Send screen): "New batch" is a link in the check's bar */
      check('12h while checking, the bar carries "New batch"', head === 'New batch' && await page.evaluate(() => !!document.querySelector('.mig-ck-bar #mig-choose')), String(head));

      console.log('\n7 · a refresh lands on the same file');
      const was = await page.evaluate(() => migCheckId());
      await page.evaluate(() => { try { placeSave(); } catch (_) {} });
      await page.reload({ waitUntil: 'networkidle' });
      /* RE-POINTED 22 Nov 2026 (the book arrives whole; no demo book): "> 5" was only ever met by the thirty demo
         contracts held in memory while the page loaded — this world seeds FOUR (FIXTURES). The book now starts empty on
         a server and arrives in one step, so four in hand is the real book loaded. */
      await until(() => window.state && state.contracts && state.contracts.length >= 4, null, 20000);
      const again = await until(() => (state.view === 'migration' && document.getElementById('mig-ck-facts')) ? migCheckId() : null, null, 12000);
      check('7a after a refresh the check view is up on the same file', !!was && again === was, JSON.stringify({ was, again }));
      if (await press('[data-mig-ck-close]', '7b ‹ All files')) {
        /* RE-POINTED 16 Nov 2026 (the new look is the only look, #762): the list it goes back to is the one table (.mign-table) */
        const lst = await until(() => document.querySelector('.mign-table') && !document.getElementById('mig-ck-facts') ? true : null, null, 4000);
        check('7b ‹ All files goes back to the list', !!lst);
      }
      console.log('\n14 · fix pass 2');
      /* RETIRED 16 Nov 2026 (#762): 14a "after a refresh the drop strip says Jambo reads each one and the total comes first"
         — old look only: with files in, the new look's Import draws no drop strip (it stands only on the empty page; Choose
         files is the head's button); that the total is asked before Jambo reads, with no cost said, stays pinned by 1a/1b */
      if (await page.evaluate(() => migCheckOpen())){
        await until(() => !!document.querySelector('[data-mig-ck-tab="decide"]'), null, 4000);
        if (await press('[data-mig-ck-tab="decide"]', '14b the Decide tab')){
          /* RE-POINTED 16 Nov 2026 (#762): Decide lands on the one table (.mign-table, no tab row of the old list head);
             the promise kept: the list shows the files that want a decision, and only those (a row's state off migRowByKey) */
          const DB = await until(() => { const rows = [...document.querySelectorAll('.mign-table tbody tr[data-row]')].map(r => (migRowByKey(r.getAttribute('data-row')) || { st: {} }).st.k);
            return rows.length && !document.getElementById('mig-ck-facts') ? { rows } : null; }, null, 4000);
          check('14b Decide shows the list of the files that want a decision, and only those', !!DB && DB.rows.length > 0 && DB.rows.every(k => k === 'dupe' || k === 'none'), JSON.stringify(DB));
          /* RE-POINTED 16 Nov 2026 (#762): back on the list, the walk opens again from the head's Check all (#mig-check-all) */
          if (await press('#mig-check-all', '14c Check all')){
            check('14c Check all opens the walk again', !!(await until(() => !!document.getElementById('mig-ck-facts'), null, 4000)));
            await page.evaluate(() => migCheckClose());
          }
        }
      }
    } else check('5 the lease to choose', false, 'not imported');

    console.log('\n13 · the list after the fix pass');
    /* RE-POINTED (#762): the new table's cells (File · What Jambo read · How sure · Looks · Stream · Value) */
    await page.evaluate(() => { if (migCheckId()) migCheckClose(); setView('migration'); });
    await until(sel => document.querySelector(sel), '.mign-table tbody tr[data-row]', 6000);
    const L13 = await page.evaluate(() => {
      /* RE-POINTED 21 Nov 2026 (P-33): a file with no readable text was never read, so it says no sureness ("—") */
      const rows = [...document.querySelectorAll('.mign-table tbody tr[data-row]')].filter(r => { const x = migRowByKey(r.getAttribute('data-row')); return x && x.c && migNlKindOf(x) !== 'none'; });
      const sure = rows.map(r => !!r.querySelector('.mign-sure'));
      const lr = migContracts().find(c => /Warehouse/.test((c.upload || {}).fileName || ''));
      const tr = lr && document.querySelector(`.mign-table tr[data-row="${lr.id}"]`);
      const td = n => tr && tr.children[n] ? tr.children[n].textContent.trim() : null;
      return { sure, stream: td(4), want: lr && ((typeof STREAM_SHORT === 'object' && STREAM_SHORT && STREAM_SHORT[lr.folder]) || (FOLDERS[lr.folder] && FOLDERS[lr.folder].name)), value: td(5) };
    });
    /* RE-POINTED (owner, 16 Nov 2026, "How sure"): the six gate marks gave way to how sure Jambo was of each file */
    check('13a every file Jambo read says how sure he was', L13.sure.length > 5 && L13.sure.every(Boolean), JSON.stringify(L13.sure));
    check('13b one name for a stream: the list says it as every list does (its short name)', !!L13.stream && L13.stream === L13.want, JSON.stringify([L13.stream, L13.want]));
    /* RE-POINTED 21 Nov 2026 (P-33, as drawn): "KES 480K/yr", never wrapped */
    check('13c the value with the period the file writes: "/yr"', /^KES 480K\/yr$/.test(L13.value || ''), String(L13.value));
    const none = await page.evaluate(() => (migRows().find(r => r.st.k === 'none') || {}).key);
    if (none && await press(rowSel(none), '13d the file with no text')){
      const Z = await until(k => { const s = document.getElementById('ins-panel'); const tr = document.querySelector(`.mign-table tr[data-row="${k}"]`);
        return s && tr && tr.classList.contains('is-picked') && s.querySelector('.jov5-title') ? { v: s.innerText + ' | ' + tr.innerText, chip: !!s.querySelector('[data-mig-renews]') } : null; }, none, 4000);
      check('13d nothing read is nothing known: no "No money passes", no renews chip', !!Z && !/No money passes/.test(Z.v) && !Z.chip, JSON.stringify(Z));
    }
    const filedK = await page.evaluate(() => (migRows().find(r => r.st.k === 'filed') || {}).key);
    if (filedK && await press(rowSel(filedK), '13e a filed file')){
      const FL = await until(key => { const s = document.getElementById('ins-panel'); const tr = document.querySelector(`.mign-table tr[data-row="${key}"]`);
        return s && tr && tr.classList.contains('is-picked') && s.querySelector('.mign5-facts') ? { k: [...s.querySelectorAll('.mign5-facts .mign5-f .mign5-k')].map(b => b.textContent.trim()),
          dots: s.querySelectorAll('.mign5-facts .mign5-f > .mign5-d').length, badge: ((s.querySelector('.mign5-top .apn-st') || {}).textContent || '').trim() } : null; }, filedK, 4000);
      /* RE-POINTED (P-33, owner's pick 20 Nov 2026: Import the Legora + Stripe way) */
      /* a filed file's panel says the same facts as one to check — what it was filed as, each with its dot (the old four
         rows read · term · signature · parties gave way to the five facts of the check, the badge saying Filed) */
      /* the money fact is not pinned here: MONEY IS NEVER A BIG PART OF A PAGE (no money in a side panel) — whether the panel
         may say Value is the owner's question, not this check's */
      check('13e a filed file says the same facts as one to check: Title · Party · Starts · Ends, each with a dot', !!FL && FL.badge === 'Filed'
        && FL.k.slice(0, 4).join() === 'Title,Party,Starts,Ends' && FL.dots === FL.k.length, JSON.stringify(FL));
    }

    console.log('\n9 · Review spreadsheet');
    if (await press('#mig-sheet', '9 Review spreadsheet')) {
      const m = await until(() => { const e = document.getElementById('mig-sheet-menu'); return e ? [...e.querySelectorAll('.nd-t')].map(x => x.textContent) : null; }, null, 3000);
      check('9a a menu of two: the sheet out, the corrected one in', !!m && m.join() === 'Download it,Load the corrected one', JSON.stringify(m));
      await page.click('#mig-sheet');
      check('9b pressed again it closes', !(await has('#mig-sheet-menu')));
    }

    console.log('\n10 · the ask box');
    /* RE-POINTED 21 Oct 2026 (Chambers): the hint line under every Jambo box
       is gone (jamboHintHtml deleted) — the box keeps its placeholder, and
       nothing is drawn under it */
    /* RE-POINTED (#762): the box is Jambo's panel's (#ins-panel) */
    const A = await page.evaluate(() => { const side = document.querySelector('#ins-panel');
      return { ph: (document.querySelector('#ins-panel #jl-q') || {}).placeholder,
        hints: side ? side.querySelectorAll('.jb-hint, .jb-keys, .jb-kbd').length : -1,
        said: side ? /Typing never signs, sends or files/.test(side.textContent) : null,
        th: (typeof teachHintOn === 'function' && teachHintOn()) ? i18t('teach_hint_ph') : null }; });
    /* RE-POINTED 22 Nov 2026 (the top box filters, Jambo's box asks, #888): Import's Jambo box carries the page's question */
    /* RE-POINTED 23 Nov 2026 (Jambo the instructor, f1189: for a person's first days, until they say, every box's own example
       words are the "I'm new" hint, teachPh/jlPagePh): the page's question, or the hint while teachHintOn() */
    check('10a "Ask Jambo: “which ones end this year?”" (or the newcomer\'s hint) with no hint line under it', A.ph === (A.th || 'Ask Jambo: “which ones end this year?”') && A.hints === 0 && A.said === false, JSON.stringify(A));
    await page.fill('#ins-panel #jl-q', 'contracts'); await page.press('#ins-panel #jl-q', 'Enter');
    const went = await until(() => state.view !== 'migration' ? state.view : null, null, 6000);
    check('10b a place word typed in it opens that place, as every Jambo box does', !!went, String(went));

    console.log('\n11 · the owner\'s three screens');
    for (const [w, hh] of [[1440, 780], [1536, 730], [1366, 950]]) {
      await page.setViewportSize({ width: w, height: hh });
      await page.evaluate(() => { setView('migration'); });
      await until(() => !!document.querySelector('.mign-table'), null, 6000);
      await page.waitForTimeout(250);
      /* RE-POINTED (#762): the panel #ins-panel beside the one table's card, the figures in view */
      /* RE-POINTED (P-33, owner's pick 20 Nov 2026: Import the Legora + Stripe way) */ /* the batch bar stands where the figures did */
      const L = await page.evaluate(() => { const s = document.getElementById('ins-panel').getBoundingClientRect(), k = document.querySelector('.mign-page .mign-batch').getBoundingClientRect(), t = document.querySelector('.mign-page .apn-card').getBoundingClientRect();
        return { side: s.left >= t.right - 1 && s.right <= innerWidth && s.bottom <= innerHeight + 1, figs: k.top >= 0 && k.bottom < innerHeight, sx: document.scrollingElement.scrollWidth > innerWidth,
          sxc: (sc => sc ? sc.scrollWidth > sc.clientWidth + 1 : false)(document.getElementById('content-scroll')) }; });
      check(`11a ${w}×${hh}: the panel beside the list and in the window, the batch bar in view, nothing sideways`, L.side && L.figs && !L.sx && !L.sxc, JSON.stringify(L));
      /* RE-POINTED (P-33, owner's pick 20 Nov 2026: Import the Legora + Stripe way) */
      /* the file's name ends in "…" by design (title carries it whole); the value, the badge and the sureness are never cut */
      const cut = await page.evaluate(() => [...document.querySelectorAll('.mign-table .mign-val, .mign-table .apn-st, .mign-table .mign-sure')].filter(e => e.scrollWidth > e.clientWidth + 1).map(e => e.textContent));
      check(`14e ${w}×${hh}: nothing in a row is cut — the value with its period, the reading's badge, how sure`, !cut.length, JSON.stringify(cut));
      await shot(page, `import-drawn-list-${w}x${hh}`);
      if (await page.evaluate(() => migCheckOpen())) {
        await until(() => !!document.getElementById('mig-ck-facts'), null, 4000); await page.waitForTimeout(250);
        const V = await page.evaluate(() => { const d = document.getElementById('mig-ck-doc').getBoundingClientRect(), f = document.getElementById('mig-ck-facts').getBoundingClientRect(), s = document.getElementById('mig-side').getBoundingClientRect();
          /* RE-POINTED 20 Nov 2026 (the check made like the Send screen): the entry stands LEFT of the file, the file's sheet a little lower on its own air */
          return { beside: f.right <= d.left + 1 && Math.abs(d.top - f.top) <= 20, inWin: f.bottom <= innerHeight + 1 && d.bottom <= innerHeight + 1, clear: d.right <= s.left + 1,
            sx: document.scrollingElement.scrollWidth > innerWidth }; });
        check(`11b ${w}×${hh}: the check view's entry and file side by side, in the window, clear of the panel`, V.beside && V.inWin && V.clear && !V.sx, JSON.stringify(V));
        await shot(page, `import-drawn-check-${w}x${hh}`);
        await page.evaluate(() => migCheckClose());
      }
    }
  } catch (e) {
    check('the run finished', false, e && e.stack);
  } finally {
    check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
    await browser.close(); await h.stop();
  }
  console.log(failures ? `\n${failures} FAILED` : '\nALL PASS');
  process.exit(failures ? 1 : 0);
})();
