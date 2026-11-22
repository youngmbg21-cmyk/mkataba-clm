/* THE CHECK, A CALM TABLE (owner's pick 22 Nov 2026, the Legora + Stripe way; js/views/migration.js migCheckHtml,
   migCkTableHtml, migCheckSideHtml) — driven in a real browser on Import contracts, with Jambo's reading staged (his
   answer per file stands in for the model; nothing else is faked).

   WHAT THIS PINS, on the drawn file — an NDA whose party and end date were not read and whose start date Jambo was
   not sure of:
     1 the head: Check · Decide · Filed as chips with their counts, the one in use filled; File it grey with its reason
     2 What it will be filed as is ONE table — Fact · What HaTi will file · where it was read · Status — "2 to fill"
       beside its name, each row a soft badge (Read · To fill · Not sure · None), the paper's words with their number
     3 the answers are in the rows: the party the paper names is a chip, "Type a name…" opens the row's own box;
       Ends offers "Renews by itself" and "Pick a date…"; Starts says Keep · Change
     4 the paper's marks are numbered like the rows: the owed one amber, the unsure one violet, the read one green
     5 the panel, no cards: a ring "4/6", "Two facts to fill.", Before you file (Party · Ends · Starts, each with its
       badge), This file as a timeline (Brought in · Read by Jambo · Checked by you now · Filed), Up next, the box at the
       foot; no money in it
     6 a press answers the row and the page says so: the party chip and Renews by itself fill their rows (Filled), Keep
       takes the start as read, the ring says 6/6, File it lights — and File it files what the rows hold, on the server
     7 the owner's three screens: the table and the paper side by side, clear of the panel, nothing sideways
   Every driven half is guarded: a missing part reports, never times out. AT THE PARENT (main 81d67b7e) 1, 2, 3, 4, 5
   and 6 FAIL (no chips on the tabs, no table, no badges, no ring or timeline).
   Run: node test/chromium/import-check-calm-table-verify.js */
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

const NSK = `NON-DISCLOSURE AGREEMENT

This Agreement is effective the [ ] day of [ ] 2019 (the “Effective Date”) between:
(1) NSK Europe Limited, registered number 2223191 whose registered office is at Belmont Place, Belmont Road, Maidenhead, Berkshire SL6 6TB, UK, (“NSK”)
and
(2) [Supplier name], registered number [company reg. no.] whose registered office is at [insert address] (“[Insert name]”)
each party referred to as a “Party” and the parties jointly referred to as the “Parties”.

BACKGROUND
A. The Parties intend to enter into discussions relating to the Purpose which will involve the exchange of Confidential Information.

1. Confidentiality. Each Party shall keep the other Party's Confidential Information confidential.

2. Law. This Agreement is governed by the laws of England and Wales.
`;
const body = (title, party, extra) => `${title}\n\n1. Parties. This Agreement is made between Highland Corporate Ltd and ${party}.\n\n2. Scope. The parties agree to the terms set out below.\n\n${extra || ''}4. Law. This Agreement is governed by the laws of Kenya.\n`;
const FILES = {
  '5-NSK-Confidentiality-Agreement-for-Suppliers.txt': NSK,
  'Cleaning_services_scan.txt': body('CLEANING SERVICES AGREEMENT', 'Safi Cleaners Ltd', '3. Term. It runs from 1 May 2024. The fee is KES 1,250,000 for the term ending 30 April 2027.\n\n'),
  'Supply_Mwangi_2023.txt': body('SUPPLY AGREEMENT', 'Mwangi Metals Ltd', '3. Term. The value is KES 2,200,000. This Agreement ends on 31 December 2026.\n\n'),
};

(async () => {
  const h = await H.startHati({ HATI_AGENTS_AUTO: 'off' });
  await H.seedWorkspace(h, { approvalRules: [] });
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ckt-'));
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  const until = async (fn, arg, ms = 8000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { let v; try { v = await page.evaluate(fn, arg); } catch (_) {} if (v) return v; await page.waitForTimeout(150); } return null; };
  const press = async (sel, name) => { const ok = await until(s => !!document.querySelector(s), sel, 4000); if (!ok) { check(name, false, 'not drawn: ' + sel); return false; }
    try { await page.click(sel, { timeout: 4000 }); } catch (e) { check(name, false, 'not pressable: ' + sel); return false; } return true; };
  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await until(() => window.state && state.contracts && state.contracts.length >= 4, null, 20000);
    await page.keyboard.press('Escape').catch(() => {});
    await page.evaluate(async () => {
      await api('ai/allowance', 'PUT', { open: true, docs: 200 }); await api('ai/allowance/document', 'POST', { count: 1 });
      state.aiConfigured = true; window.importQueueRead = undefined;
      const all = k => Object.fromEntries(k.map(x => [x, 'high']));
      const READ = [
        [/^NON-DISCLOSURE AGREEMENT\n\nThis Agreement is effective/, { contractType: 'NDA', counterparty: '', effectiveDate: '2019-01-01', confidence: { contractType: 'high', effectiveDate: 'low' }, sourceSpans: { effectiveDate: 'effective the [ ] day of [ ] 2019' } }],
        [/CLEANING SERVICES/, { contractType: 'Cleaning services', counterparty: 'Safi Cleaners Ltd', effectiveDate: '2024-05-01', expiryDate: '2027-04-30', value: 1250000, currency: 'KES', confidence: Object.assign(all(['contractType', 'counterparty', 'effectiveDate', 'expiryDate']), { value: 'low' }) }],
        [/Mwangi/, { contractType: 'Supply agreement', counterparty: 'Mwangi Metals Ltd', effectiveDate: '2023-01-01', expiryDate: '2026-12-31', value: 2200000, currency: 'KES', confidence: Object.assign(all(['contractType', 'counterparty', 'effectiveDate', 'expiryDate']), { value: 'low' }) }],
      ];
      window.aiExtractMetadata = async text => { const hit = READ.find(([re]) => re.test(String(text || ''))); return JSON.parse(JSON.stringify(hit ? hit[1] : { confidence: {} })); };
      setView('migration');
    });
    await until(() => !!document.querySelector('#mig-files'), null, 8000);
    const paths = Object.entries(FILES).map(([n, t]) => { const f = path.join(dir, n); fs.writeFileSync(f, t); return f; });
    await page.setInputFiles('#mig-files', paths);
    await until(() => !!document.getElementById('confirm-overlay'), null, 8000);
    await page.click('#cf-ok').catch(() => {});
    await until(n => { const M = migState(); return M.queue.length === n && !M.running; }, paths.length, 60000);
    await page.evaluate(async () => { try { await flushSaves(); } catch (_) {} renderMigration(); });
    const nsk = await until(() => { const c = migContracts().find(x => /NSK/.test((x.upload || {}).fileName || '')); return c ? c.id : null; }, null, 6000);
    check('0 the NSK NDA was brought in and waits for a check', !!nsk && await page.evaluate(id => !!(getContract(id).migration || {}).needsReview, nsk), String(nsk));
    if (!nsk) throw new Error('no NSK file');
    await page.evaluate(id => migCheckOpen(id), nsk);
    const on = await until(id => migCheckId() === id && document.getElementById('mig-ck-facts') && document.querySelector('#mig-ck-doc .mig-ck-text') ? true : null, nsk, 8000);
    check('0b the check opens on it, its words beside its facts', !!on);
    await page.waitForTimeout(300);

    console.log('\n1 · the head');
    const H1 = await page.evaluate(() => {
      const tabs = [...document.querySelectorAll('.mig-ck-tab')].map(t => { const cs = getComputedStyle(t);
        return { w: t.textContent.replace(/\s+/g, ' ').trim(), on: t.classList.contains('is-on'), style: cs.borderTopStyle, bg: cs.backgroundColor, radius: parseFloat(cs.borderTopLeftRadius) }; });
      const b = document.querySelector('#page-head-acts [data-mig-file]');
      return { tabs, file: b ? { dis: b.disabled, why: b.title } : null, skip: !!document.querySelector('#page-head-acts [data-mig-ck-skip]'),
        back: !!document.querySelector('.mig-ck-bar [data-mig-ck-close]'), batch: !!document.querySelector('.mig-ck-bar #mig-choose'), pos: ((document.querySelector('.mig-ck-pos') || {}).textContent || '') };
    });
    const t0 = H1.tabs[0] || {}, t1 = H1.tabs[1] || {};
    check('1a Check · Decide · Filed are chips with their counts: the one in use filled ink, the others dashed', H1.tabs.length === 3 && /^Check \d+$/.test(t0.w) && t0.on && t0.radius > 10
      && t0.bg !== 'rgba(0, 0, 0, 0)' && t1.style === 'dashed' && /^Decide \d+$/.test(t1.w), JSON.stringify(H1.tabs));
    check('1b File it is grey with its reason on its hover; Skip for now, ‹ All files, New batch and File n of m stand', !!H1.file && H1.file.dis && /File it waits for Party, Ends/.test(H1.file.why)
      && H1.skip && H1.back && H1.batch && /^File \d of \d$/.test(H1.pos), JSON.stringify(H1));

    console.log('\n2 · one calm table');
    const T = await page.evaluate(() => {
      const f = document.getElementById('mig-ck-facts'); const t = f && f.querySelector('table.mig-ckt'); if (!t) return null;
      const row = k => { const tr = t.querySelector(`tr[data-mig-ff="${k}"]`); if (!tr) return null;
        const bd = tr.querySelector('.mig-ckr-b .apn-st'), q = tr.querySelector('.mig-ckr-q');
        return { badge: bd ? bd.textContent.trim() : '', tone: bd ? [...bd.classList].find(c => /^is-/.test(c)) : '', n: (tr.querySelector('.mig-ckr-n') || {}).textContent || '',
          where: ((q && q.querySelector('b')) || {}).textContent || '', q: ((q && q.querySelector('.mig-ckr-qt')) || {}).textContent || '',
          oneLine: q ? (() => { const qt = q.querySelector('.mig-ckr-qt'); return !qt || getComputedStyle(qt).whiteSpace === 'nowrap'; })() : true }; };
      return { head: [...t.querySelectorAll('thead th')].map(x => x.textContent.trim()), hb: ((f.querySelector('.mig-ck-h .apn-st') || {}).textContent || '').trim(),
        title: row('contractType'), party: row('counterparty'), starts: row('effectiveDate'), ends: row('expiryDate'), value: row('value'),
        stream: !!t.querySelector('tr[data-mig-ff="folder"] select[data-mig-f="folder"]'), more: !!f.querySelector('[data-mig-review-full]') };
    });
    check('2a the table\'s columns: Fact · What HaTi will file · where it was read · Status, "2 to fill" beside its name', !!T && T.head.join('|') === 'Fact|What HaTi will file · where it was read|Status' && T.hb === '2 to fill', JSON.stringify(T && { head: T.head, hb: T.hb }));
    check('2b each row a soft badge: Title Read · Party To fill · Starts Not sure · Ends To fill · Value None', !!T && T.title && T.title.badge === 'Read' && T.title.tone === 'is-green'
      && T.party.badge === 'To fill' && T.party.tone === 'is-amber' && T.starts.badge === 'Not sure' && T.starts.tone === 'is-violet'
      && T.ends.badge === 'To fill' && T.value.badge === 'None' && T.value.tone === 'is-gray', JSON.stringify(T && [T.title, T.party, T.starts, T.ends, T.value].map(x => x && x.badge)));
    check('2c under each value the paper\'s own words: its number, where (Heading · Opening), the words on one line', !!T && T.title.n === '1' && T.title.where === 'Heading' && /Non-disclosure agreement/.test(T.title.q)
      && T.party.n === '2' && T.party.where === 'Opening' && /NSK Europe Limited, registered/.test(T.party.q) && T.starts.n === '3' && /effective the \[ \] day of \[ \] 2019/.test(T.starts.q)
      && [T.title, T.party, T.starts].every(x => x.oneLine), JSON.stringify(T && [T.title, T.party, T.starts]));
    check('2d what the paper does not say is said: Ends "no end date, and nothing saying it renews", Value "no sum anywhere in it"', !!T && /no end date, and nothing saying it renews/.test(T.ends.q) && /no sum anywhere in it/.test(T.value.q), JSON.stringify(T && [T.ends.q, T.value.q]));
    check('2e the Stream dropdown and "All the details…" stay', !!T && T.stream && T.more);
    await shot(page, 'import-check-table-1440x780');

    console.log('\n3 · the answers in their rows');
    const A = await page.evaluate(() => {
      const tr = k => document.querySelector(`#mig-ck-facts tr[data-mig-ff="${k}"]`); const words = el => el ? [...el.querySelectorAll('.mig-ckr-show button')].map(b => b.textContent.trim()) : [];
      return { party: words(tr('counterparty')), ends: words(tr('expiryDate')), starts: words(tr('effectiveDate')),
        likely: ((tr('counterparty') || document).querySelector('.mig-ckc.is-likely') || {}).textContent || '', dashed: !!(tr('counterparty') || document).querySelector('.mig-ckc.is-dash'),
        shut: !!(tr('counterparty') && tr('counterparty').querySelector('.mig-ckr-edit[hidden] [data-mig-f="counterparty"]')) };
    });
    check('3a Party: the name the paper gives as a chip, "Type a name…" dashed — never the blank "[Supplier name]"', A.party.join('|') === 'NSK Europe Limited|Type a name…' && A.likely === 'NSK Europe Limited' && A.dashed && A.shut, JSON.stringify(A));
    check('3b Ends: "Renews by itself" and "Pick a date…"; Starts: its value with Keep · Change', A.ends.join('|') === 'Renews by itself|Pick a date…' && A.starts.join('|') === 'Keep|Change', JSON.stringify(A));
    if (await press('#mig-ck-facts tr[data-mig-ff="counterparty"] .mig-ckc.is-dash', '3c Type a name… opens the row\'s box')) {
      const open = await until(() => { const b = document.querySelector('#mig-ck-facts tr[data-mig-ff="counterparty"] [data-mig-f="counterparty"]'); return b && b.offsetParent && document.activeElement === b ? true : null; }, null, 3000);
      check('3c Type a name… opens the row\'s own box, ready to type', !!open);
      await page.keyboard.press('Escape').catch(() => {});
      await page.evaluate(() => { const b = document.querySelector('#mig-ck-facts [data-mig-f="counterparty"]'); if (b) b.blur(); });
    }

    console.log('\n4 · the paper\'s marks');
    const M = await page.evaluate(() => [...document.querySelectorAll('#mig-ck-doc .mig-ck-m')].map(m => [m.getAttribute('data-mig-n') || '', m.textContent.replace(/\s+/g, ' '), [...m.classList].find(c => /^is-/.test(c))]));
    const mk = w => M.find(x => x[1] === w) || [];
    check('4 the marks match the rows: 1 the title green, 2 NSK Europe Limited amber, 3 the start violet, the blank amber', mk('NON-DISCLOSURE AGREEMENT')[0] === '1' && mk('NON-DISCLOSURE AGREEMENT')[2] === 'is-green'
      && mk('NSK Europe Limited')[0] === '2' && mk('NSK Europe Limited')[2] === 'is-amber' && mk('effective the [ ] day of [ ] 2019')[0] === '3' && mk('effective the [ ] day of [ ] 2019')[2] === 'is-violet'
      && mk('[Supplier name]')[2] === 'is-amber' && !mk('[Supplier name]')[0], JSON.stringify(M));

    console.log('\n5 · the panel, no cards');
    const S = await page.evaluate(() => { const s = document.querySelector('#mig-side .mig-ck-why'); if (!s) return null;
      return { ring: ((s.querySelector('.mign5-ring text') || {}).textContent || ''), head: ((s.querySelector('.mig-ckn-h') || {}).textContent || ''), sub: ((s.querySelector('.mig-ckn-tt p') || {}).textContent || ''),
        before: [...s.querySelectorAll('.mig-ckn-need')].map(x => [((x.querySelector('.apn-st') || {}).textContent || '').trim(), [...(x.querySelector('.apn-st') || { classList: [] }).classList].find(c => /^is-/.test(c)), ((x.querySelector('p') || {}).textContent || '')]),
        tl: [...s.querySelectorAll('.mig-ckn-tl li')].map(li => [li.className, li.textContent.replace(/\s+/g, ' ').trim()]),
        next: s.querySelectorAll('.mig-ckn-nx[data-mig-ck-to] .apn-st').length, cards: s.querySelectorAll('.mig-ckn-card, .jb-card').length,
        money: /KES|\d{1,3}(?:,\d{3})+/.test(s.textContent), box: !!document.querySelector('#mig-side #jl-q') }; });
    check('5a a ring "4/6", "Two facts to fill.", "Then File it. Nothing is filed until you press it."', !!S && S.ring === '4/6' && S.head === 'Two facts to fill.' && S.sub === 'Then File it. Nothing is filed until you press it.', JSON.stringify(S && [S.ring, S.head, S.sub]));
    check('5b Before you file: Party and Ends amber, Starts violet, each with why', !!S && S.before.map(x => x[0] + ':' + x[1]).join() === 'Party:is-amber,Starts:is-violet,Ends:is-amber'
      && /Only “NSK Europe Limited” and a blank “\[Supplier name\]”/.test(S.before[0][2]) && /day and month are blank/.test(S.before[1][2]) && /nothing saying it renews/.test(S.before[2][2]), JSON.stringify(S && S.before));
    check('5c This file: Brought in · Read by Jambo · Checked by you now · Filed', !!S && S.tl.length === 4 && /^Brought in \w/.test(S.tl[0][1]) && S.tl[0][0] === 'is-done' && /^Read by Jambo \w/.test(S.tl[1][1])
      && S.tl[2][1] === 'Checked by you now' && S.tl[2][0] === 'is-now' && S.tl[3][1] === 'Filed' && S.tl[3][0] === 'is-next', JSON.stringify(S && S.tl));
    check('5d Up next a calm list with soft badges; no cards; no money; Jambo\'s box at the foot', !!S && S.next >= 1 && S.cards === 0 && !S.money && S.box, JSON.stringify(S && { next: S.next, cards: S.cards, money: S.money, box: S.box }));
    await shot(page, 'import-check-panel-1440x780');

    console.log('\n6 · a press answers the row');
    if (await press('#mig-ck-facts [data-mig-ck-pick="counterparty"]', '6a the party chip')) {
      const P = await until(() => { const tr = document.querySelector('#mig-ck-facts tr[data-mig-ff="counterparty"]'), b = tr && tr.querySelector('[data-mig-f="counterparty"]');
        return tr && b && b.value === 'NSK Europe Limited' && tr.classList.contains('is-filled') ? { badge: (tr.querySelector('.mig-ckr-b .apn-st') || {}).textContent, ring: (document.querySelector('#mig-side .mign5-ring text') || {}).textContent } : null; }, null, 3000);
      check('6a the chip puts the name in the row\'s box: the row says Filled, the ring 5/6', !!P && P.badge === 'Filled' && P.ring === '5/6', JSON.stringify(P));
    }
    if (await press('#mig-ck-facts tr[data-mig-ff="expiryDate"] [data-mig-renews]', '6b Renews by itself')) {
      const E = await until(() => { const b = document.querySelector('#mig-ck-facts [data-mig-f="expiryDate"]'), f = document.querySelector('#page-head-acts [data-mig-file]');
        return b && b.value === 'Renews by itself' && f && !f.disabled ? { ring: (document.querySelector('#mig-side .mign5-ring text') || {}).textContent, head: (document.querySelector('#mig-side .mig-ckn-h') || {}).textContent } : null; }, null, 3000);
      check('6b Renews by itself fills Ends; File it lights; the panel says it', !!E && E.ring === '6/6' && E.head === 'One fact to check.', JSON.stringify(E));
    }
    if (await press('#mig-ck-facts [data-mig-ck-keep="effectiveDate"]', '6c Keep')) {
      const K = await until(() => { const tr = document.querySelector('#mig-ck-facts tr[data-mig-ff="effectiveDate"]'); return tr && tr.classList.contains('is-read') ? { badge: (tr.querySelector('.mig-ckr-b .apn-st') || {}).textContent, head: (document.querySelector('#mig-side .mig-ckn-h') || {}).textContent, mark: (document.querySelector('#mig-ck-doc .mig-ck-m[data-mig-n="3"]') || { classList: [] }).classList.contains('is-green') } : null; }, null, 3000);
      check('6c Keep takes the start as read: Read, its mark green, "Ready to file."', !!K && K.badge === 'Read' && K.head === 'Ready to file.' && K.mark, JSON.stringify(K));
    }
    await shot(page, 'import-check-answered-1440x780');
    if (await press('#page-head-acts [data-mig-file]', '6d File it')) {
      const rec = await until(async id => { try { await flushSaves(); } catch (_) {} const c = await api('contracts/' + encodeURIComponent(id));
        return c && c.migration && !c.migration.needsReview ? { cp: c.counterparty, renew: (c.metadata || {}).renewalType, eff: (c.metadata || {}).effectiveDate, conf: ((c.metadata || {}).confidence || {}).effectiveDate } : null; }, nsk, 10000);
      check('6d File it files what the rows hold, on the server: NSK Europe Limited, renews by itself, the start confirmed', !!rec && rec.cp === 'NSK Europe Limited' && rec.renew === 'evergreen' && rec.eff === '2019-01-01' && rec.conf === 'high', JSON.stringify(rec));
    }

    console.log('\n7 · the owner\'s three screens');
    const left = await page.evaluate(() => { const r = migRows().find(x => x.st.k === 'check' && x.c); return r ? r.key : null; });
    for (const [w, hh] of [[1440, 780], [1536, 730], [1366, 950]]) {
      await page.setViewportSize({ width: w, height: hh });
      if (left) await page.evaluate(id => { if (migCheckId() !== id) migCheckOpen(id); }, left);
      const ok = await until(() => document.getElementById('mig-ck-facts') && document.getElementById('mig-ck-doc') ? true : null, null, 4000);
      if (!ok) { check(`7 ${w}×${hh}: the check is up`, false, 'not drawn'); continue; }
      await page.waitForTimeout(250);
      const V = await page.evaluate(() => { const d = document.getElementById('mig-ck-doc').getBoundingClientRect(), f = document.getElementById('mig-ck-facts').getBoundingClientRect(), s = document.getElementById('mig-side').getBoundingClientRect();
        const cut = [...document.querySelectorAll('#mig-ck-facts .mig-ckr-b .apn-st, #mig-ck-facts .mig-ckc, .mig-ck-tab')].filter(e => e.scrollWidth > e.clientWidth + 1).map(e => e.textContent);
        return { beside: f.right <= d.left + 1 && Math.abs(d.top - f.top) <= 20, inWin: d.bottom <= innerHeight + 1, clear: d.right <= s.left + 1, edge: Math.round(f.left - document.getElementById('content').getBoundingClientRect().left),
          sx: document.scrollingElement.scrollWidth > innerWidth, cut }; });
      check(`7 ${w}×${hh}: the table and the paper side by side, in the window, clear of the panel, 40 from the edge, nothing cut`, V.beside && V.inWin && V.clear && !V.sx && V.edge >= 16 && !V.cut.length, JSON.stringify(V));
      await shot(page, `import-check-${w}x${hh}`);
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
