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
    check('1b in Jambo calls and files used, never money', !!asked && /about 12 Jambo calls/.test(asked) && /41 of 200 files used/.test(asked) && !/\$|KES|SEK|money/.test(asked), asked);
    await shot(page, 'import-drawn-total-1440x780');
    if (asked) await page.click('#cf-ok');
    await until(() => { const M = migState(); return M.queue.length === paths.length && !M.running; }, null, 60000);
    await page.evaluate(async () => { try { await flushSaves(); } catch (_) {} renderMigration(); });

    console.log('\n2 · the head');
    const head = await until(() => { const f = document.getElementById('page-head-facts'); const t = f && f.textContent; return t && /files/.test(t) ? t : null; }, null, 6000);
    check('2a the head says what the batch is: old contracts, started on a day by you, the files', !!head && /^Old contracts brought in · started \w{3} \d{1,2} \w{3} by you · 12 files$/.test(head), head);
    const chooser = await Promise.race([page.waitForEvent('filechooser', { timeout: 4000 }).then(() => true).catch(() => false),
      page.click('#mig-choose').then(() => new Promise(r => setTimeout(() => r(null), 4500))).catch(() => false)]);
    check('2b Choose files… in the head opens the chooser', chooser === true);

    console.log('\n3 · the tabs and the cap');
    const TAB = k => '[data-lh-seat="migration"] [role="tab"][data-mig-show="' + k + '"]';
    const figs = await page.evaluate(() => [...document.querySelectorAll('[data-lh-seat="migration"] [role="tab"]')].map(e => e.innerText.replace(/\s+/g, ' ').trim()));
    check('3a the five readings as the tab row: All · To check · Duplicate? · No readable text · Filed', JSON.stringify(figs) === JSON.stringify(['All 12', 'To check 3', 'Duplicate? 1', 'No readable text 1', 'Filed 7']), JSON.stringify(figs));
    const foot = await page.evaluate(() => (document.querySelector('[data-lh-foot="migration"]') || {}).innerText || '');
    check('3b "1–9 of 12 · Show 3 more": the cap said', /^1–9 of 12 · Show 3 more$/.test(foot.replace(/\s+/g, ' ').trim()), foot.replace(/\s+/g, ' '));
    if (await press(TAB('check'), '3c To check')) {
      const R = await until(() => { const ks = [...document.querySelectorAll('.mig-table tbody tr[data-row]')].map(r => r.className.match(/is-(\w+)/)[1]); return ks.length === 3 ? ks : null; }, null, 4000);
      check('3c a tab narrows the list to what it counts', !!R && R.every(k => k === 'check'), JSON.stringify(R));
      await page.click(TAB('check'));
      const stays = await page.evaluate(sel => { const b = document.querySelector(sel); return !!b && b.getAttribute('aria-selected') === 'true' && document.querySelectorAll('.mig-table tbody tr[data-row]').length === 3; }, TAB('check'));
      await page.click(TAB('all'));
      const back = await until(() => document.querySelectorAll('.mig-table tbody tr[data-row]').length === 9 ? true : null, null, 4000);
      check('3d pressed again it stays; All brings the whole list back (nine of it, the cap said)', stays && !!back, JSON.stringify({ stays, back: !!back }));
    }
    if (await press('[data-lh-more="migration"]', '3e Show 3 more')) {
      const n = await until(() => { const k = document.querySelectorAll('.mig-table tbody tr[data-row]').length; return k === 12 ? k : null; }, null, 4000);
      check('3e Show 3 more shows all twelve', n === 12, String(n));
    }

    console.log('\n4 · one table');
    const T = await page.evaluate(() => ({ heads: [...document.querySelectorAll('.mig-table thead th')].map(th => th.textContent.trim()),
      order: [...document.querySelectorAll('.mig-table tbody tr[data-row]')].map(r => r.className.match(/is-(\w+)/)[1]),
      title: (document.querySelector('[data-lh-seat="migration"] [role="tab"][data-mig-show="all"]') || {}).title || '', filedRef: !!document.querySelector('.mig-table tr.is-filed [data-open]') }));
    check('4a the drawn columns', JSON.stringify(T.heads) === JSON.stringify(['File · what Jambo read', 'Stream', 'Value', 'Ends', 'Done', 'State']), JSON.stringify(T.heads));
    check('4b "Files in this batch · the ones that need you first" (the All tab says it), and they come first', /Files in this batch/.test(T.title) && /the ones that need you first/.test(T.title)
      && T.order.join() === 'check,check,check,dupe,none,filed,filed,filed,filed,filed,filed,filed', T.order.join());
    check('4c a filed row\'s number opens its contract', T.filedRef);
    await shot(page, 'import-drawn-list-1440x780');

    console.log('\n8 · a duplicate');
    const dkey = await page.evaluate(() => { const r = migRows().find(x => x.st.k === 'dupe'); return r ? r.key : null; });
    if (dkey && await press(`.mig-table tr[data-row="${dkey}"] .mig-td-f`, '8 the duplicate row')) {
      const D = await until(() => { const s = document.getElementById('mig-side'); return s && s.querySelector('[data-dup-skip]') ? (s.querySelector('.mig-cf-t') || {}).textContent : null; }, null, 4000);
      check('8a Jambo asks "Is this a copy?" with the duplicate choices', D === 'Is this a copy?', String(D));
      await page.click('#mig-side [data-dup-skip]');
      const left = await until(k => { const tr = document.querySelector(`.mig-table tr[data-row="${k}"]`); return tr && tr.classList.contains('is-skipped') ? true : null; }, dkey, 6000);
      check('8b Skip leaves it out, said on its row', !!left);
    } else check('8 a duplicate to decide', false, 'none waiting (needs this sitting\'s queue)');

    console.log('\n5 · a press chooses a file');
    const lease = await page.evaluate(() => (migContracts().find(c => /Warehouse/.test((c.upload || {}).fileName || '')) || {}).id);
    if (lease && await press(`.mig-table tr[data-row="${lease}"] .mig-td-f`, '5 the lease\'s row')) {
      const P = await until(id => { const s = document.getElementById('mig-side'); const tr = document.querySelector(`.mig-table tr[data-row="${id}"]`);
        if (!s || !tr || !tr.classList.contains('is-picked') || !s.querySelector('.mig-cf')) return null;
        const ends = s.querySelector('[data-mig-ff="expiryDate"]');
        return { word: (s.querySelector('[data-jl-word]') || {}).textContent, back: !(s.querySelector('[data-jl-back]') || { hidden: true }).hidden,
          title: (s.querySelector('.mig-cf-t') || {}).textContent, say: (s.querySelector('.mig-cf-say') || {}).textContent,
          ends: ends && { need: ends.classList.contains('is-need'), ph: (ends.querySelector('input') || {}).placeholder, why: (ends.querySelector('.mig-ff-why') || {}).textContent || '' },
          file: !!(s.querySelector('[data-mig-file]') || {}).disabled, wait: (s.querySelector('[data-mig-wait]') || {}).textContent,
          labels: [...s.querySelectorAll('.mig-ff-l')].map(l => l.textContent.trim()) }; }, lease, 6000);
      check('5a Jambo\'s panel holds the file: his word "Import" and ‹ Jambo', !!P && P.word === 'Import' && P.back, JSON.stringify(P && { word: P.word, back: P.back }));
      check('5b "Check this file · Jambo read it; one fact needs you before it is filed."', !!P && P.title === 'Check this file' && P.say === 'Jambo read it; one fact needs you before it is filed.', JSON.stringify(P && [P.title, P.say]));
      check('5c the facts as drawn: Title · Party · Starts · Ends · Value · Stream', !!P && P.labels.join() === 'Title,Party,Starts,Ends,Value,Stream', JSON.stringify(P && P.labels));
      check('5d Ends in amber, "Jambo was not sure", with the clause it read', !!P && P.ends && P.ends.need && P.ends.ph === 'Jambo was not sure' && /^§ 3: “It renews by itself/.test(P.ends.why), JSON.stringify(P && P.ends));
      check('5e File it grey, with its reason beside it', !!P && P.file && /File it waits for Ends: choose “renews by itself” or a date\./.test(P.wait), JSON.stringify(P && [P.file, P.wait]));
      await shot(page, 'import-drawn-chosen-1440x780');
      if (await press('#mig-side [data-jl-back]', '5f ‹ Jambo')) {
        const gone = await until(() => !document.querySelector('.mig-table tr.is-picked') && /files are in this batch/.test(document.getElementById('mig-side').textContent) ? true : null, null, 4000);
        check('5f ‹ Jambo lets the file go, and Jambo says the batch', !!gone);
      }
      await page.locator(`.mig-table tr[data-row="${lease}"] .mig-td-f`).click();
      await until(() => !!document.querySelector('#mig-side [data-mig-check-one]'), null, 4000);

      console.log('\n6 · Open the file: one at a time');
      if (await press('#mig-side [data-mig-check-one]', '6 Open the file')) {
        const V = await until(() => { const d = document.getElementById('mig-ck-doc'), f = document.getElementById('mig-ck-facts'); if (!d || !f || !d.querySelector('.mig-ck-text')) return null;
          return { title: (d.querySelector('.mig-ck-title') || {}).textContent, marks: [...d.querySelectorAll('.mig-ck-m')].map(m => [m.getAttribute('data-mig-n'), m.textContent.replace(/\s+/g, ' ')]),
            nums: [...f.querySelectorAll('.mig-ff-n')].map(n => n.textContent), bar: (document.querySelector('.mig-ck-bar') || {}).innerText || '',
            why: (document.querySelector('#mig-side .mig-ck-why') || {}).innerText || '', use: !!document.querySelector('#mig-side [data-mig-use="renews"]') }; }, null, 8000);
        check('6a the file\'s own words, its title, numbered where each fact was found', !!V && V.title === 'WAREHOUSE LEASE'
          && JSON.stringify(V.marks.map(m => m[1])) === JSON.stringify(['Bandari Warehousing Ltd', '1 April 2019', 'It renews by itself for a further year at a time unless it is ended three months before the term runs out.', 'KES 480,000'])
          && V.nums.join() === '1,2,3,4', JSON.stringify(V && { marks: V.marks, nums: V.nums }));
        /* re-pointed (fix pass, 19 Oct 2026): option 1's tabs as drawn — Check 3 · Decide N · Filed N — and Jambo's drawn sentence with the yearly reminder */
        check('6b the bar: ‹ All files · Check 3 · Decide 1 · Filed 7 · File n of 3', !!V && /All files/.test(V.bar) && /Check 3/.test(V.bar) && /Decide 1/.test(V.bar) && /Filed 7/.test(V.bar) && /File \d of 3/.test(V.bar), V && V.bar.replace(/\s+/g, ' '));
        check('6c Jambo says why he was not sure, in the file\'s own words, and offers renews by itself', !!V && /Why I was not sure of the end: § 3 has no end date\. It reads: “It renews by itself/.test(V.why)
          && /3 months' notice\. If you choose that, HaTi will remind you each year before the notice day\./.test(V.why) && V.use, V && V.why.slice(0, 260));
        await shot(page, 'import-drawn-check-1440x780');
        if (await press('#mig-side [data-mig-use="renews"]', '6d Use: renews by itself')) {
          const F = await until(() => { const f = document.getElementById('mig-ck-facts'); const b = f && f.querySelector('[data-mig-file]'); const e = f && f.querySelector('[data-mig-f="expiryDate"]');
            return b && e && e.value === 'Renews by itself' && !b.disabled ? true : null; }, null, 4000);
          check('6d a press fills the box; File it is ready — a second press', !!F);
          const before = await page.evaluate(() => migCheckId());
          await page.click('#mig-ck-facts [data-mig-file]');
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
        const N = await until(() => { const f = document.getElementById('mig-ck-facts'), d = document.getElementById('mig-ck-doc'); if (!f || !d || !f.querySelector('[data-mig-unsigned]')) return null;
          return { acts: [...f.querySelectorAll('[data-mig-unsigned]')].map(b => b.textContent.trim()), text: !!d.querySelector('.mig-ck-text'), as: (f.querySelector('[data-mig-ff="status"]') || {}).textContent || '' }; }, null, 5000);
        check('12b in the walk it is a page: its own words, what it would be filed as, and three answers', !!onIt && !!N && N.text && N.acts.join() === 'Import as a draft,Import as signed,Leave it out' && /not signed: import as a draft\?/.test(N.as), JSON.stringify(N));
        const J = await page.evaluate(() => { const w = document.querySelector('#mig-side .mig-ck-why'); return w ? { t: w.innerText, use: !!w.querySelector('[data-mig-use]') } : null; });
        check('12b2 Jambo asks only the one question until it is answered — no instruction its read-only boxes cannot follow', !!J && /call it a draft/.test(J.t) && !/write the date|made between/.test(J.t) && !J.use, JSON.stringify(J));
        await shot(page, 'import-drawn-unsigned-1440x780');
        if (N && await press('#mig-ck-facts [data-mig-unsigned="draft"]', '12c Import as a draft')){
          /* ASK FOR THE STATE (22 Oct 2026): the draft exists a beat before the walk's id moves from the
             queue key ("q:2") to it, so the wait asks for both together; on time-out the last state reports */
          const draftNow = () => { const c = migContracts().find(x => /NDA_Acme/.test((x.upload || {}).fileName || '')); return c ? { id: c.id, status: c.status, hash: c.hash || null, out: !!(c.migration && c.migration.executedOutside), on: migCheckId() } : null; };
          const D = await until(() => { const c = migContracts().find(x => /NDA_Acme/.test((x.upload || {}).fileName || '')); return c && migCheckId() === c.id ? true : null; }, null, 10000)
            .then(() => page.evaluate(draftNow));
          check('12c Import as a draft makes a draft — nothing sealed, not signed outside HaTi — and the walk stays on it', !!D && D.status === 'Draft' && !D.hash && !D.out && D.on === D.id, JSON.stringify(D));
          const U = await until(() => { const b = document.querySelector('#mig-side [data-mig-use="party"]'); return b ? b.textContent : null; }, null, 5000);
          check('12d no party marked: Jambo offers the one the file is made with — "Use: Acme Ltd"', U === 'Use: Acme Ltd', String(U));
          if (U){ await page.click('#mig-side [data-mig-use="party"]');
            const P = await until(() => { const e = document.querySelector('#mig-ck-facts [data-mig-f="counterparty"]'); return e && e.value === 'Acme Ltd' ? true : null; }, null, 3000);
            check('12e a press fills the box; nothing is filed until File it', !!P && await page.evaluate(() => { const c = getContract(migCheckId()); return !!(c && c.migration && c.migration.needsReview); })); }
        }
      }
      const SL = await page.evaluate(id => { const c = getContract(id); const box = document.createElement('div'); box.innerHTML = migSignedLineHtml(c); return box.textContent; }, lease);
      check('12f signed where the file says so — never the start date', /^signed in Mombasa, 14 Mar 2019$/.test(SL), SL);
      const tabs = await page.evaluate(() => [...document.querySelectorAll('.mig-ck-tab')].map(t => t.textContent.replace(/\s+/g, ' ').trim()));
      check('12g the bar\'s tabs: Check · Decide · Filed', tabs.length === 3 && /^Check \d+$/.test(tabs[0]) && /^Decide \d+$/.test(tabs[1]) && /^Filed \d+$/.test(tabs[2]), JSON.stringify(tabs));
      const head = await page.evaluate(() => (document.getElementById('mig-choose') || {}).textContent);
      check('12h while checking, the head\'s button is "New batch"', head === 'New batch', String(head));

      console.log('\n7 · a refresh lands on the same file');
      const was = await page.evaluate(() => migCheckId());
      await page.evaluate(() => { try { placeSave(); } catch (_) {} });
      await page.reload({ waitUntil: 'networkidle' });
      await until(() => window.state && state.contracts && state.contracts.length > 5, null, 20000);
      const again = await until(() => (state.view === 'migration' && document.getElementById('mig-ck-facts')) ? migCheckId() : null, null, 12000);
      check('7a after a refresh the check view is up on the same file', !!was && again === was, JSON.stringify({ was, again }));
      if (await press('[data-mig-ck-close]', '7b ‹ All files')) {
        const lst = await until(() => document.querySelector('.mig-table') && !document.getElementById('mig-ck-facts') ? true : null, null, 4000);
        check('7b ‹ All files goes back to the list', !!lst);
      }
      console.log('\n14 · fix pass 2');
      const cost = await until(() => { const e = document.getElementById('mig-cost'); const t = e && e.textContent; return t && /onboarding allowance \(\d+ of 200 files used\)/.test(t) ? t : null; }, null, 6000);
      check('14a after a refresh the drop strip says the onboarding allowance open, before any batch', !!cost, String(cost));
      if (await page.evaluate(() => migCheckOpen())){
        await until(() => !!document.querySelector('[data-mig-ck-tab="decide"]'), null, 4000);
        if (await press('[data-mig-ck-tab="decide"]', '14b the Decide tab')){
          const DB = await until(() => { const on = document.querySelector('#mig-band .mig-ck-tab.is-on'); const rows = [...document.querySelectorAll('.mig-table tbody tr[data-row]')].map(r => r.className.match(/is-(\w+)/)[1]);
            return on && !document.getElementById('mig-ck-facts') ? { on: on.textContent.replace(/\s+/g, ' ').trim(), rows } : null; }, null, 4000);
          check('14b Decide keeps the tab row as its frame, Decide lit, the list the files that want a decision', !!DB && /^Decide \d+$/.test(DB.on) && DB.rows.length > 0 && DB.rows.every(k => k === 'dupe' || k === 'none'), JSON.stringify(DB));
          if (await press('[data-mig-ck-tab="check"]', '14c the Check tab')){
            check('14c the Check tab opens the walk again', !!(await until(() => !!document.getElementById('mig-ck-facts'), null, 4000)));
            await page.evaluate(() => migCheckClose());
          }
        }
      }
    } else check('5 the lease to choose', false, 'not imported');

    console.log('\n13 · the list after the fix pass');
    await page.evaluate(() => { migPickSet(null); const all = document.querySelector('[data-lh-more="migration"]'); if (all) all.click(); });
    const L13 = await page.evaluate(() => {
      const rows = [...document.querySelectorAll('.mig-table tbody tr[data-row]')];
      const dots = rows.map(r => r.querySelectorAll('.mig-dot').length).filter(n => n);
      const lr = migContracts().find(c => /Warehouse/.test((c.upload || {}).fileName || ''));
      const tr = lr && document.querySelector(`.mig-table tr[data-row="${lr.id}"]`);
      return { dots, stream: tr && tr.querySelector('.mig-td-s').textContent, want: lr && FOLDERS[lr.folder] && FOLDERS[lr.folder].name, value: tr && tr.querySelector('.mig-td-v').textContent };
    });
    check('13a six marks on every row', L13.dots.length > 5 && L13.dots.every(n => n === 6), JSON.stringify(L13.dots));
    check('13b one name for a stream: the list says it as the stream box does', !!L13.stream && L13.stream === L13.want, JSON.stringify([L13.stream, L13.want]));
    check('13c the value with the period the file writes: "a year"', /^KES 480K a year$/.test(L13.value || ''), String(L13.value));
    if (await press('.mig-table tr.is-none .mig-td-f', '13d the file with no text')){
      const Z = await until(() => { const s = document.getElementById('mig-side'); const v = s && s.querySelector('[data-mig-ff="value"]'); return v ? { v: v.textContent, chip: !!s.querySelector('[data-mig-renews]') } : null; }, null, 4000);
      check('13d nothing read is nothing known: no "No money passes", no renews chip', !!Z && !/No money passes/.test(Z.v) && !Z.chip, JSON.stringify(Z));
    }
    await page.evaluate(() => migPickSet(null));
    if (await press('.mig-table tr.is-filed .mig-td-f', '13e a filed file')){
      const FL = await until(() => { const s = document.getElementById('mig-side'); const ls = s && [...s.querySelectorAll('.mig-ff-l')].map(l => l.textContent.trim()); return ls && ls.length ? ls : null; }, null, 4000);
      check('13e a filed file says the same six facts: Title · Party · Starts · Ends · Value · Stream', !!FL && FL.join() === 'Title,Party,Starts,Ends,Value,Stream', JSON.stringify(FL));
    }
    await page.evaluate(() => migPickSet(null));

    console.log('\n9 · Review spreadsheet');
    if (await press('#mig-sheet', '9 Review spreadsheet')) {
      const m = await until(() => { const e = document.getElementById('mig-sheet-menu'); return e ? [...e.querySelectorAll('.nd-t')].map(x => x.textContent) : null; }, null, 3000);
      check('9a a menu of two: the sheet out, the corrected one in', !!m && m.join() === 'Download it,Load the corrected one', JSON.stringify(m));
      await page.click('#mig-sheet');
      check('9b pressed again it closes', !(await has('#mig-sheet-menu')));
    }

    console.log('\n10 · the ask box');
    await page.evaluate(() => migPickSet(null));
    /* RE-POINTED 21 Oct 2026 (Chambers): the hint line under every Jambo box
       is gone (jamboHintHtml deleted) — the box keeps its placeholder, and
       nothing is drawn under it */
    const A = await page.evaluate(() => { const side = document.querySelector('#mig-side');
      return { ph: (document.querySelector('#mig-side #jl-q') || {}).placeholder,
        hints: side ? side.querySelectorAll('.jb-hint, .jb-keys, .jb-kbd').length : -1,
        said: side ? /Typing never signs, sends or files/.test(side.textContent) : null }; });
    check('10a "Ask for anything, or type /" with no hint line under it', A.ph === 'Ask for anything, or type /' && A.hints === 0 && A.said === false, JSON.stringify(A));
    await page.fill('#mig-side #jl-q', 'contracts'); await page.press('#mig-side #jl-q', 'Enter');
    const went = await until(() => state.view !== 'migration' ? state.view : null, null, 6000);
    check('10b a place word typed in it opens that place, as every Jambo box does', !!went, String(went));

    console.log('\n11 · the owner\'s three screens');
    for (const [w, hh] of [[1440, 780], [1536, 730], [1366, 950]]) {
      await page.setViewportSize({ width: w, height: hh });
      await page.evaluate(() => { setView('migration'); });
      await until(() => !!document.querySelector('.mig-table'), null, 6000);
      await page.evaluate(id => { if (id) migPickSet(id); }, await page.evaluate(() => (migRows().find(r => r.st.k === 'check') || {}).key));
      await page.waitForTimeout(250);
      const L = await page.evaluate(() => { const s = document.getElementById('mig-side').getBoundingClientRect(), k = document.querySelector('[data-lh-seat="migration"] [role="tablist"]').getBoundingClientRect(), t = document.querySelector('.mig-list').getBoundingClientRect();
        return { side: s.left >= t.right - 1 && s.right <= innerWidth && s.bottom <= innerHeight + 1, figs: k.top >= 0 && k.bottom < innerHeight, sx: document.scrollingElement.scrollWidth > innerWidth,
          sxc: (sc => sc ? sc.scrollWidth > sc.clientWidth + 1 : false)(document.getElementById('content-scroll')) }; });
      check(`11a ${w}×${hh}: the panel beside the list and in the window, the tab row in view, nothing sideways`, L.side && L.figs && !L.sx && !L.sxc, JSON.stringify(L));
      const cut = await page.evaluate(() => [...document.querySelectorAll('.mig-table .mig-td-v, .mig-table .mig-td-s, .mig-table .mig-fr, .mig-table .mig-st-why')].filter(e => e.scrollWidth > e.clientWidth + 1).map(e => e.textContent));
      check(`14e ${w}×${hh}: nothing in a row is cut — the value with its period, the stream, the file's line, the reason`, !cut.length, JSON.stringify(cut));
      await shot(page, `import-drawn-list-${w}x${hh}`);
      if (await page.evaluate(() => migCheckOpen())) {
        await until(() => !!document.getElementById('mig-ck-facts'), null, 4000); await page.waitForTimeout(250);
        const V = await page.evaluate(() => { const d = document.getElementById('mig-ck-doc').getBoundingClientRect(), f = document.getElementById('mig-ck-facts').getBoundingClientRect(), s = document.getElementById('mig-side').getBoundingClientRect();
          return { beside: d.right <= f.left + 1 && Math.abs(d.top - f.top) < 4, inWin: f.bottom <= innerHeight + 1 && d.bottom <= innerHeight + 1, clear: f.right <= s.left + 1,
            sx: document.scrollingElement.scrollWidth > innerWidth }; });
        check(`11b ${w}×${hh}: the check view's two cards side by side, in the window, clear of the panel`, V.beside && V.inWin && V.clear && !V.sx, JSON.stringify(V));
        await shot(page, `import-drawn-check-${w}x${hh}`);
        await page.evaluate(() => migCheckClose());
      }
      await page.evaluate(() => migPickSet(null));
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
