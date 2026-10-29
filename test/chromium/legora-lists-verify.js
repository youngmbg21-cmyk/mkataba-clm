/* ============================================================
   EVERY LIST PAGE THE LEGORA WAY (Part 8; the owner picked "The Legora way"
   from the drawing of the list pages, 21 Oct 2026: "one box you can search or
   ask in, views as tabs, filters only when you add them, and Jambo's answers
   as columns with the clause they came from")
   ============================================================
   WHAT THIS CHECKS, in a real browser, signed in as the admin, on a seeded
   book where every page has rows in at least two of its views. The ten pages:
   Contracts, Negotiations, Approvals, Obligations, Requests, My notes,
   Parties, People, Our paper (the book, the Templates list, Our standards)
   and Import. On each page:
     1  ONE HEAD: one [data-lh-seat]; its box input[data-lh-q] sits under the
        title and above the tab row; the box's words carry a number and never
        "⌘K"
     2  NO LABELLED BAND: none of the old labelled filter boxes is drawn
        (.reg-fb .reg-f-l, .cu-find-l, .ik-fb-l, #reg-adapt, .ct-adapt,
        [data-obw-filters])
     3  TABS ARE THEIR ROWS: every tab prints a number above 0 unless it is lit
        or All, and pressing a tab shows exactly the rows its number said (the
        foot's total where the list shows a page at a time)
     4  + FILTER ([data-lh-add]) where the page has filters: a finger on it
        opens HaTi's one list (pointerType 'touch', never the system picker);
        it never offers a filter's at-rest value, nor a value with no rows;
        a choice leaves rows, stands as ONE chip .lh-chip with its ×
        ([data-lh-x]), and × brings the rows back
     5  THE RIGHT END: "Ask a column" ([data-ac-open]) inside the chip row on
        the Contracts List only; Columns ([data-lc-btn]) in the chip row where
        the page registers it, and hiding a column takes its head and cells
        away; on Contracts the <col> widths still add up to 100%
     6  THE FOOT [data-lh-foot] says "1–k of n" as a live status (role=status),
        and "Show N more" adds exactly min(step, n − k) rows
     7  THE BOX: typing a party narrows to the rows that carry it and the tab
        numbers follow; the caret stays in the box at every keystroke; "Visa"
        or a party name narrows like any word; RE-POINTED 29 Oct 2026 (owner:
        "AI questions should only go to the jambo panel"): the box only
        searches — "which ones are waiting on us?" narrows the list like any
        words, and Enter on it, or on plain words, sends nothing to Jambo
     8  A REFRESH LANDS AT THE SAME SPOT: a tab lit, a chip added and words
        typed come back after a reload, with the same rows
   CONTRACTS ONLY: the Archive button still stands beside List | Wall; the
   views EXACTLY All · Needs you · In negotiation · Ending in 90 days · Drafts
   (then the saved views; owner, 22 Oct 2026, question 2 "B"), and the four
   old Quick filters (Term already ended, Auto-renewing soon, Overdue
   obligations, Details to fill) one "Quick filters" group under + Filter: a
   finger's choice shows ONE chip and the rows that view reads, × brings the
   list back, and the tab row is ONE line at all three screens; the
   first column shows initials, the party, and "kind · ref" under it; the
   columns at rest are Agreement · Stage · Ends · Value (Owner under
   Columns); no "Ask a column" on the Wall; with an Ask-a-column answer kept
   (asked the way ask-a-column-verify asks one), the answer cell carries a §
   chip and pressing it opens that contract on Home's paper (Go to clause's
   own door).
   PEOPLE ONLY: tabs Everyone · Ours · Theirs; the job title under the name;
   no Email column.
   EVERY SCREEN: at 1440×780, 1536×730 and 1366×950 the head's rows, the first
   list row and Jambo's panel are in view; the tab and chip rows are not cut
   sideways; the page never scrolls sideways; the box and + Filter are the
   pixels actually painted where they stand (elementFromPoint). Pictures go
   to HATI_SHOT_DIR/legora-lists.

   RED AT THE PARENT: run in a worktree at unmodified main db763d0a (the
   remote's main, checked), every page FAILS from step 1 on — there is no
   list head anywhere: 22 passed, 208 failed, in under two minutes. Measured
   there too: the list panel's own box (jlAsk) sends "which ones are waiting
   on us?" to Home's Board and the reader leaves the page. The head's box
   hands a question to that SAME door (typing it in the box is typing it in
   Jambo's panel). TIGHTENED 22 Oct 2026 (the owner's answer to question 3,
   "A — Answer beside the list"): 7g now asks that the reader STAYS — same
   view, the tabs, chips and rows unchanged, the box empty, the question and
   Jambo's answer in the panel, no request to the AI stand-in. Run in a
   throwaway worktree at e10e3af6 (before the answer was built), 7g FAILS on
   every list page: the view becomes 'dashboard' (Home's Board).

   Every driven half is guarded: a missing part prints FAIL with its reason
   instead of waiting. Every wait asks for the state and is bounded.

   Run all ten:   node test/chromium/legora-lists-verify.js
   Run some:      LH_PAGES=contracts,people node test/chromium/legora-lists-verify.js
   (names: contracts negotiations approvals obligations requests mynotes
    parties people paper import; also intake customers directory templates
    playbook standards book migration notes)
   ============================================================ */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const H = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = path.join(process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots'), 'legora-lists');
const SCREENS = [[1440, 780], [1536, 730], [1366, 950]];
let pass = 0, fail = 0;
const check = (name, ok, detail) => {
  ok ? pass++ : fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail != null && detail !== '' ? ' — ' + String(detail).slice(0, 400) : ''}`);
};
const note = (name, detail) => console.log(`NOTE  ${name}${detail ? ' — ' + String(detail).slice(0, 300) : ''}`);

/* ---- DATES THAT DO NOT DEPEND ON THE DAY THE CHECK RUNS ----
   Whole calendar months away from today (monthSpan, f183), so every date
   sits well inside or well outside each window whatever today is: one month
   ahead is always within 90 days, eighteen months ahead never is, four
   months back has always ended. */
const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const monthSpan = off => { const n = new Date(); n.setHours(0, 0, 0, 0);
  return { start: iso(new Date(n.getFullYear(), n.getMonth() + off, 1)), end: iso(new Date(n.getFullYear(), n.getMonth() + off + 1, 0)) }; };
const todayDay = () => iso(new Date());

/* ---- THE BOOK ----
   Sixteen parties, each with one person on their side (a job title in the
   company's directory), 44 agreements across them plus a batch of 12 imported
   files: more than one page of Contracts (40), Parties (10) and People (12),
   and more than Import shows at rest (9). Drafts, live negotiations, terms
   ending within 90 days, a party whose every contract has ended, overdue,
   open and finished obligations, a signature the admin owes and one a
   colleague owes on the admin's own contract. */
const PARTIES = ['Nordkap ERP Consulting AB', 'AIT Worldwide Logistics Norway AS', 'Lumumba Logistics', 'Visa Kenya Ltd',
  'Nandi Dairy', 'Kabras Sugar', 'Naivas Supermarkets', 'Britam Properties', 'Siginon Logistics', 'Carrefour Kenya',
  'Helio Energy AB', 'Saw Sawa LLC', 'Kettle and Co', 'Tusker Brewing Co', 'Mara Freight Ltd', 'Bidco Africa'];
const PEOPLE = ['Grace Njeri', 'Ola Nordmann', 'Peter Otieno', 'Wanjiku Kamau', 'Daniel Kiprop', 'Mercy Achieng', 'John Mwangi',
  'Ruth Wambui', 'Samuel Kariuki', 'Faith Chebet', 'Erik Lund', 'Young Mbagaya', 'Kevin Omondi', 'Lucy Nyambura', 'Brian Kibet', 'Agnes Moraa'];
const TITLES = ['Procurement Director', 'Head of Logistics', 'Operations Manager', 'Country Manager', 'Supply Chain Lead',
  'Finance Director', 'Commercial Lead', 'General Counsel', 'Category Manager', 'Legal Counsel', 'Chief Financial Officer',
  'Supply Chain Director', 'Managing Partner', 'Head of Sales', 'Fleet Manager', 'Company Secretary'];
const KINDS = ['Professional Services', 'Warehousing & Transportation', 'Freight & Distribution', 'Mutual NDA',
  'Raw Material Supply', 'Office Lease', 'Distribution Agreement', 'Software Licence'];
const mail = i => PEOPLE[i].toLowerCase().replace(/[^a-z]+/g, '.') + '@' + PARTIES[i].toLowerCase().replace(/[^a-z]+/g, '').slice(0, 14) + '.example';
const QUESTION = 'which ones are waiting on us?';

function theBook(){
  const out = [];
  const far = monthSpan(18).end, soon = monthSpan(1).start, ended = monthSpan(-4).start;
  for (let i = 0; i < 44; i++){
    const p = i % 16;
    const st = p === 15 ? 'Signed' : (i % 5 === 0 ? 'Draft' : i % 5 === 1 ? 'Under Review' : 'Signed');
    const c = H.fixtureContract('MK-' + (401 + i), KINDS[i % 8] + ' — ' + PARTIES[p].split(' ')[0] + ' ' + (i + 1),
      PARTIES[p], i % 3 ? H.FOLDER_A : H.FOLDER_B, (i + 1) * 150000, st);
    c.expiry = p === 15 ? ended : (st === 'Signed' && i % 7 === 2) ? soon : far;
    c.counterpartyEmail = mail(p); c.counterpartyName = PEOPLE[p];
    out.push(c);
  }
  /* two live negotiations, their change waiting on us */
  [1, 6].forEach(i => Object.assign(out[i], { negotiation: { round: 1, rounds: [] },
    changes: [{ id: 'CHG-LH' + i, clauseId: 'cl_a1', clauseLabel: 'Article 1', changeType: 'edit', status: 'pending',
      authorSide: 'counterparty', summary: 'Price', createdAt: monthSpan(-1).start, roundN: 1 }] }));
  /* obligations: late, open and done */
  [2, 3, 4, 7].forEach((i, k) => { out[i].obligations = [
    { id: 'lh' + i + 'a', desc: 'Send the insurance certificate ' + i, party: 'theirs', due: monthSpan(-2).start, status: 'open' },
    { id: 'lh' + i + 'b', desc: 'Pay the quarterly fee ' + i, party: 'ours', due: monthSpan(2).start, status: 'open' },
    ...(k % 2 ? [{ id: 'lh' + i + 'c', desc: 'Deliver the opening report ' + i, party: 'ours', due: monthSpan(-1).start, status: 'done', doneAt: monthSpan(-1).end }] : []),
  ]; });
  /* a signature the admin owes next (Approvals, and Contracts' Needs you) */
  out[11].status = 'Under Review';
  out[11].signerPlan = [
    { id: 'sg-us-lh11', party: 'internal', order: 1, name: 'Amina Otieno', email: 'admin@example.co.ke', role: 'Director', signed: false },
    { id: 'sg-cp-lh11', party: 'counterparty', order: 2, name: PEOPLE[11], email: mail(11), role: 'Director', signed: false }];
  /* a signature a colleague owes on the admin's own contract (its owner is set after the seed) */
  out[13].status = 'Under Review';
  out[13].signerPlan = [
    { id: 'sg-us-lh13', party: 'internal', order: 1, name: 'Unrestricted Legal', email: 'everything@example.co.ke', role: 'Director', signed: false },
    { id: 'sg-cp-lh13', party: 'counterparty', order: 2, name: PEOPLE[13], email: mail(13), role: 'Director', signed: false }];
  /* an imported batch: two to check, the rest filed */
  for (let k = 0; k < 12; k++){
    const c = H.fixtureContract('MK-' + (601 + k), KINDS[k % 8] + ' (scan ' + (k + 1) + ')', PARTIES[k % 16], H.FOLDER_A, (k + 2) * 90000, 'Signed');
    c.expiry = far; c.counterpartyEmail = mail(k % 16); c.counterpartyName = PEOPLE[k % 16];
    c.migration = { batch: 'LH1', from: 'Old drive', needsReview: k < 2 };
    c.upload = { fileName: 'scan-' + (601 + k) + '.pdf' };
    out.push(c);
  }
  return out;
}

/* ---- THE PAGES, EACH WITH ITS WAY IN ----
   rows: the list's own row; hidden: folded rows count (Obligations' weeks);
   id: the attribute that names a row; panel: Jambo's panel beside it;
   step: Show N more's page; filters/columns: true = the page has them,
   'maybe' = test them where drawn, false = none. */
const DEFS = [
  { key: 'contracts', title: 'Contracts', go: () => { regPlaceSet({ show: 'list' }); setView('register'); },
    rows: '#ct-place #reg-tbody tr[data-row]', panel: '#ig-dock', step: 40, filters: true, columns: true },
  { key: 'negotiations', title: 'Negotiations', go: () => openNegotiations({ list: true }),
    rows: '#reg-tbody tr[data-row]', panel: '#ins-panel', filters: true, columns: 'maybe' },
  { key: 'approvals', title: 'Approvals & signing', go: () => setView('approvals'),
    rows: '.ap-table tbody tr[data-ap-row]', panel: '#ins-panel', filters: 'maybe', columns: 'maybe' },
  { key: 'obligations', title: 'Obligations', go: () => setView('obligations'),
    rows: '#obw-scroll [data-ins-row]:not(.obw-finds)', hidden: true, panel: '#ins-panel', filters: true, columns: 'maybe' },
  { key: 'requests', title: 'Requests', go: () => setView('intake'),
    rows: '.ik-lt tbody [data-ik-row]', panel: '#ins-panel', filters: true, columns: 'maybe' },
  { key: 'mynotes', title: 'My notes', go: () => (window.mineLoad ? mineLoad(true) : Promise.resolve()).then(() => setView('mynotes')),
    rows: '.mn-t tbody [data-mn-row]', panel: '#ins-panel', filters: true, columns: 'maybe' },
  { key: 'parties', title: 'Parties', go: () => setView('customers'),
    rows: '#cu-tbody [data-cu-cust]', panel: '#ins-panel', step: 10, filters: true, columns: true },
  { key: 'people', title: 'People', go: () => setView('directory'),
    rows: '#dir-tbody [data-dir-row]', panel: '#ins-panel', step: 12, filters: true, columns: true },
  { key: 'paper', sub: 'book', title: 'Our paper · the book', go: () => { setView('templates'); if (window.tplPageSetTab) tplPageSetTab('book'); },
    rows: '[data-tpl-pf]', panel: '#ins-panel', tabs: false, filters: false, columns: false, foot: 'maybe' },
  { key: 'paper', sub: 'templates', title: 'Our paper · Templates', go: () => { setView('templates'); if (window.tplPageSetTab) tplPageSetTab('list'); },
    rows: '.tpl-lt tbody [data-tpl-row]', panel: '#ins-panel', filters: true, columns: 'maybe' },
  { key: 'paper', sub: 'standards', title: 'Our paper · Our standards', go: () => setView('playbook'),
    rows: '[id^="sd-scroll-"] tr[data-ins-row]', panel: '#ins-panel', filters: 'maybe', columns: 'maybe' },
  { key: 'import', title: 'Import', go: () => setView('migration'),
    rows: '.mig-table tbody tr[data-row]', panel: '#mig-side', filters: false, columns: 'maybe' },
];
const ALIAS = { intake: 'requests', customers: 'parties', directory: 'people', templates: 'paper', playbook: 'paper',
  standards: 'paper', book: 'paper', migration: 'import', notes: 'mynotes', mine: 'mynotes', redline: 'negotiations' };
const WANT = (() => {
  const raw = String(process.env.LH_PAGES || '').toLowerCase().split(/[\s,]+/).filter(Boolean);
  if (!raw.length) return null;
  const keys = new Set(DEFS.map(d => d.key));
  const out = new Set();
  raw.forEach(w => { const k = ALIAS[w] || w; if (keys.has(k)) out.add(k); else note(`LH_PAGES names no page "${w}"`, [...keys].join(' ')); });
  return out;
})();

/* ---- READINGS IN THE PAGE (installed before the app on every load) ---- */
function pageKit(){
  const vis = e => { if (!e || !e.getClientRects || !e.getClientRects().length) return false;
    const cs = getComputedStyle(e); return cs.visibility !== 'hidden' && cs.display !== 'none'; };
  const num = x => { const v = String(x == null ? '' : x).replace(/[^\d]/g, ''); return v === '' ? null : Number(v); };
  const words = e => (e ? e.textContent : '').replace(/\s+/g, ' ').trim();
  const rect = e => { if (!e) return null; const r = e.getBoundingClientRect(); return { l: Math.round(r.left), t: Math.round(r.top), r: Math.round(r.right), b: Math.round(r.bottom), w: Math.round(r.width), h: Math.round(r.height) }; };
  const K = {
    vis, num, words, rect,
    seats: () => [...document.querySelectorAll('[data-lh-seat]')].filter(vis),
    seat: () => K.seats()[0] || null,
    seatName: () => { const s = K.seat(); return s ? s.getAttribute('data-lh-seat') : null; },
    box: () => { const s = K.seat(); const b = s && s.querySelector('input[data-lh-q]'); return b && vis(b) ? b : null; },
    rowEls: c => { const els = [...document.querySelectorAll(c.rows)]; return c.hidden ? els : els.filter(e => !e.closest('[hidden]') && e.getClientRects().length); },
    rows: c => K.rowEls(c).length,
    idOf: e => { for (const a of ['data-row', 'data-ap-row', 'data-ob-key', 'data-ik-row', 'data-mn-row', 'data-cu-cust', 'data-dir-row', 'data-tpl-row', 'data-tpl-pf', 'data-sd-row', 'data-sd-book', 'data-sd-dev', 'data-ins-id'])
      if (e.hasAttribute(a)) return a + '=' + e.getAttribute(a); return words(e).slice(0, 40); },
    ids: c => K.rowEls(c).map(K.idOf),
    rowText: e => (words(e) + ' ' + (e.title || '') + ' ' + [...e.querySelectorAll('[title]')].map(x => x.title).join(' ')).toLowerCase(),
    foot: () => {
      const nm = K.seatName();
      let f = nm ? document.querySelector(`[data-lh-foot="${CSS.escape(nm)}"]`) : null;
      if (!f || !vis(f)) f = [...document.querySelectorAll('[data-lh-foot]')].find(vis) || null;
      if (!f) return null;
      const t = words(f), m = t.match(/(\d[\d\s,.]*)\s*[–-]\s*(\d[\d\s,.]*)\s+of\s+(\d[\d\s,.]*)/);
      const mb = (nm && document.querySelector(`[data-lh-more="${CSS.escape(nm)}"]`)) || f.querySelector('[data-lh-more]');
      return { text: t, a: m ? num(m[1]) : null, k: m ? num(m[2]) : null, n: m ? num(m[3]) : null,
        status: f.getAttribute('role') === 'status' || !!f.querySelector('[role="status"]'),
        more: mb && vis(mb) ? words(mb) : null };
    },
    total: c => { const f = K.foot(); return f && f.n != null ? f.n : K.rows(c); },
    tabEls: () => { const s = K.seat(); return s ? [...s.querySelectorAll('[role="tablist"] [role="tab"]')].filter(vis) : []; },
    tabLabel: t => { const x = t.cloneNode(true); x.querySelectorAll('.n,[data-lh-n],button').forEach(e => e.remove());
      return words(x).replace(/\s*\d[\d,\s]*$/, '').trim(); },
    tabNum: t => { const n = t.querySelector('.n,[data-lh-n]'); if (n) return n.hidden ? null : num(n.textContent);
      const m = words(t).match(/(\d[\d,\s]*)$/); return m ? num(m[1]) : null; },
    tabs: () => K.tabEls().map(t => { const label = K.tabLabel(t);
      return { label, n: K.tabNum(t), lit: t.getAttribute('aria-selected') === 'true' || t.classList.contains('on') || t.classList.contains('is-on'),
        all: /^(all|everyone|alla|allt)$/i.test(label), saved: t.hasAttribute('data-lh-saved') || t.classList.contains('reg-vtab-saved') }; }),
    tabPress: label => { const t = K.tabEls().find(x => K.tabLabel(x) === label); if (!t) return false; t.click(); return true; },
    tabLit: label => { const t = K.tabs().find(x => x.label === label); return !!(t && t.lit); },
    chips: () => { const s = K.seat(); return s ? [...s.querySelectorAll('.lh-chip')].filter(vis).map(c => ({ t: words(c), x: !!c.querySelector('[data-lh-x]') })) : []; },
    addSel: () => { const s = K.seat(); const a = s && s.querySelector('[data-lh-add]'); if (!a) return null; return a.tagName === 'SELECT' ? a : a.querySelector('select'); },
    hist: () => { const h = (window.ai && Array.isArray(ai.history)) ? ai.history : ((window.intel && Array.isArray(intel.history)) ? intel.history : []); return h.length; },
    asked: q => { const h = (window.ai && Array.isArray(ai.history)) ? ai.history : ((window.intel && Array.isArray(intel.history)) ? intel.history : []);
      return h.filter(m => m && m.role === 'user' && String(m.text || m.content || '').trim() === q).length; },
    busy: () => !!((window.ai && ai.busy) || (window.intel && intel.busy)),
    /* the head shows what its page reads now: the head counts again only once
       the typing pauses (LH_SYNC_QUIET_MS, js/views/listhead.js), so a stage
       that reads the tabs or the chips just after typing asks for this first */
    synced: () => { const s = K.seat(); if (!s || typeof window.lhTabsHtml !== 'function') return true;
      const rows = el => [...el.children].filter(e => e.matches('.reg-views, .lh-chips')).map(words).join(' ');
      const tmp = document.createElement('div'); tmp.innerHTML = window.lhTabsHtml(s.getAttribute('data-lh-seat')) + window.lhChipsHtml(s.getAttribute('data-lh-seat'));
      return rows(tmp) === rows(s); },
    /* a party one row carries and not every row does (any: or every row does);
       else a long word of the first row */
    pick: (c, parties, any) => {
      const els = K.rowEls(c); if (!els.length) return null;
      const txt = els.map(K.rowText);
      const first = txt[0];
      const cands = parties.filter(p => { const n = txt.filter(t => t.includes(p.toLowerCase())).length; return n >= 1 && (any || n < els.length); });
      const p = cands.find(x => first.includes(x.toLowerCase())) || cands[0];
      if (p) return { word: p, kind: 'party' };
      const ws = (els[0].textContent || '').split(/[^A-Za-zÀ-ÿ]+/).filter(w => w.length >= 5);
      const w = ws.find(x => any || txt.filter(t => t.includes(x.toLowerCase())).length < els.length);
      return w ? { word: w, kind: 'word' } : null;
    },
  };
  window.__lh = K;
}

(async () => {
  const deadline = setTimeout(() => { console.log('FAIL  the whole check finished within nine minutes — it did not'); process.exit(1); }, 9 * 60 * 1000);
  deadline.unref();
  fs.mkdirSync(OUT, { recursive: true });
  const h = await H.startHati({ HATI_AGENTS_AUTO: 'off' });
  const w = await H.seedWorkspace(h, { contracts: theBook(), approvalRules: [] });
  /* the people's job titles, the company's own directory. The settings save
     replaces the whole record, so it says again that this workspace has no
     approval rules (else the default rule would come back) */
  await w.admin.json('/api/settings', { method: 'PUT', body: { approvalRules: [], directory: PARTIES.map((p, i) => ({ name: PEOPLE[i], email: mail(i), title: TITLES[i] })) } })
    .catch(e => note('the directory of job titles was not saved', e.message));
  /* the colleague's signature on the admin's own contract: the admin owns it */
  try {
    const boot = await w.admin.json('/api/bootstrap');
    const me = (boot.users || []).find(u => u.email === 'admin@example.co.ke');
    const full = await w.admin.json('/api/contracts/MK-414'); const baseVersion = full._v; delete full._v;
    full.owner = { id: me.id, name: me.name || 'Amina Otieno' };
    await w.admin.json('/api/contracts/MK-414', { method: 'PUT', body: { contract: full, baseVersion } });
  } catch (e){ note('the admin could not be made the owner of MK-414', e.message); }
  /* requests: the admin's own, and two from colleagues */
  for (const [cl, t, cp] of [[w.admin, 'NDA with Kettle and Co', 'Kettle and Co'], [w.restricted, 'Supply deal for Tusker Brewing Co', 'Tusker Brewing Co'],
    [w.unrestricted, 'Lease renewal with Britam Properties', 'Britam Properties']])
    await cl.json('/api/intake', { method: 'POST', body: { title: t, need: 'We need this soon, please.', counterparty: cp, folder: H.FOLDER_A } })
      .catch(e => note('a request was not raised', e.message));
  /* the admin's own notes: due today, late, later; on two contracts */
  for (const it of [{ body: 'Ask Lumumba about the insurance before Friday', contractId: 'MK-403', reviewBy: todayDay() },
    { body: 'Check the price index for Visa next month', contractId: 'MK-404', reviewBy: monthSpan(2).start },
    { body: 'Remember the fee change Visa asked for', contractId: 'MK-404', reviewBy: monthSpan(-1).start }])
    await w.admin.json('/api/me/items', { method: 'POST', body: { kind: 'note', item: it } }).catch(e => note('a note was not kept', e.message));

  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 780 } });
  await ctx.addInitScript(pageKit);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e.message || e).slice(0, 200)));
  /* A WAIT ASKS FOR THE STATE, BOUNDED */
  const until = async (fn, arg, ms = 6000) => { const end = Date.now() + ms;
    for (;;){ const v = await page.evaluate(fn, arg).catch(() => null); if (v) return v; if (Date.now() >= end) return null; await new Promise(r => setTimeout(r, 100)); } };
  const ev = (fn, arg) => page.evaluate(fn, arg).catch(e => ({ __err: String(e && e.message || e).slice(0, 200) }));
  const shot = n => page.screenshot({ path: path.join(OUT, n + '.png') }).catch(() => {});
  const quiet = () => until(() => !window.__lh.busy() ? true : null, null, 12000);
  const cfgOf = d => ({ rows: d.rows, hidden: !!d.hidden });
  const signIn = async () => {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await until(() => window.state && Array.isArray(state.contracts) && state.contracts.length >= 50 ? true : null, null, 20000);
    await ev(() => { if (window.langId && langId() !== 'en') langSet('en'); });
  };
  const loaded = () => until(() => window.state && Array.isArray(state.contracts) && state.contracts.length >= 50 && typeof setView === 'function' ? true : null, null, 20000);
  /* the way in; then the rows (or the head) are on screen */
  const arrive = async d => {
    await ev(() => { if (window.selectMenuClose) selectMenuClose(); if (window.closeAI) try { closeAI(); } catch (_){} });
    const r = await ev(d.go);
    if (r && r.__err) note(`${d.title}: the way in threw`, r.__err);
    return until(c => window.__lh.rows(c) > 0 || window.__lh.seat() ? true : null, cfgOf(d), 10000);
  };
  const tag = d => d.key === 'paper' ? 'paper/' + d.sub : d.key;

  /* ===== 1 · ONE HEAD, ITS BOX UNDER THE TITLE AND ABOVE THE TABS ===== */
  async function gHead(d){
    const S = await ev(() => {
      const seats = window.__lh.seats(), s = seats[0];
      if (!s) return { n: 0 };
      const box = s.querySelector('input[data-lh-q]');
      const tl = s.querySelector('[role="tablist"]');
      const title = s.querySelector('.ph-top')
        || (s.closest('.ph-card, .ct-head, .sap-band, section') || document).querySelector('.ph-top, .ct-top')
        || [...document.querySelectorAll('#page-head .ph-top, #content h1, #content h2')].find(window.__lh.vis) || null;
      return { n: seats.length, seat: s.getAttribute('data-lh-seat'), box: !!box, type: box && box.type, ph: box ? box.placeholder : '',
        boxR: window.__lh.rect(box), tlR: window.__lh.rect(tl), titleR: window.__lh.rect(title), titleT: title ? window.__lh.words(title).slice(0, 60) : '' };
    });
    check(`${tag(d)} 1a ONE list head ([data-lh-seat]) on the page`, S.n === 1, S.n ? `${S.n} heads, seat "${S.seat}"` : 'no [data-lh-seat] anywhere on the page');
    if (!S.n) return false;
    check(`${tag(d)} 1b the head carries one box, input[type=search][data-lh-q]`, S.box && S.type === 'search', JSON.stringify({ box: S.box, type: S.type }));
    if (!S.box) return true;
    /* RE-POINTED 24 Oct 2026 (Round 2, owner's yes): Contracts says its count once, at the foot — its box carries none */
    check(`${tag(d)} 1c the box's words carry a number (Contracts: none, its foot says it) and no ⌘K hint`, (d.key === 'contracts' ? !/\d/.test(S.ph) : /\d/.test(S.ph)) && !/⌘|cmd\s*k|ctrl\s*k/i.test(S.ph), `"${S.ph}"`);
    const under = S.titleR && S.boxR && S.boxR.t >= S.titleR.b - 1;
    const above = !S.tlR ? d.tabs === false : S.boxR.b <= S.tlR.t + 1;
    check(`${tag(d)} 1d the box sits under the title${d.tabs === false ? '' : ' and above the tab row'}`, !!(under && above),
      JSON.stringify({ title: S.titleR, titleWords: S.titleT, box: S.boxR, tabs: S.tlR }));
    return true;
  }

  /* ===== 2 · NO LABELLED BAND ===== */
  async function gBand(d){
    const B = await ev(() => ['.reg-fb .reg-f-l', '.cu-find-l', '.ik-fb-l', '#reg-adapt', '.ct-adapt', '[data-obw-filters]']
      .map(s => [s, [...document.querySelectorAll(s)].filter(window.__lh.vis).length]).filter(x => x[1]));
    check(`${tag(d)} 2 no labelled band of filter boxes under the head`, Array.isArray(B) && !B.length, JSON.stringify(B));
  }

  /* ===== 3 · TABS ARE THEIR ROWS ===== */
  async function gTabs(d){
    if (d.tabs === false){ note(`${tag(d)} 3 this list draws no tab row (as ruled)`); return; }
    await arrive(d);
    const T = await ev(() => window.__lh.seat() ? window.__lh.tabs() : null);
    if (!T || T.__err){ check(`${tag(d)} 3 the tabs print their rows`, false, 'no list head to read a tab row from'); return; }
    if (!T.length){ check(`${tag(d)} 3 the head carries a tab row`, false, 'no [role=tab] inside the head\'s [role=tablist]'); return; }
    const said = T.map(t => `${t.label}${t.n != null ? ' ' + t.n : ''}${t.lit ? '*' : ''}`).join(' · ');
    check(`${tag(d)} 3a every tab prints a number above 0, unless it is lit or All`,
      T.every(t => t.saved || t.lit || t.all || (t.n != null && t.n > 0)) && T.every(t => t.saved || t.n != null), said);
    const start = T.find(t => t.lit);
    const res = [];
    for (const t of T.filter(x => !x.saved)){
      const pressed = await ev(l => window.__lh.tabPress(l), t.label);
      const lit = await until(l => window.__lh.tabLit(l) ? true : null, t.label, 4000);
      const want = (await ev(l => { const x = window.__lh.tabs().find(y => y.label === l); return x ? x.n : null; }, t.label));
      const got = await until(([c, n]) => { const v = window.__lh.total(c); return n != null && v === n ? v : null; }, [cfgOf(d), want], 4000);
      const rows = await ev(c => window.__lh.total(c), cfgOf(d));
      res.push({ tab: t.label, said: want, rows, lit: !!lit, pressed: pressed === true, ok: !!lit && got != null });
    }
    check(`${tag(d)} 3b each tab's number is the rows its press shows`, res.length > 0 && res.every(r => r.ok), JSON.stringify(res));
    if (res.filter(r => r.rows > 0).length < 2) note(`${tag(d)} fewer than two views hold rows on this book`, JSON.stringify(res));
    if (start) { await ev(l => window.__lh.tabPress(l), start.label); await until(l => window.__lh.tabLit(l) ? true : null, start.label, 4000); }
  }

  /* ===== 4 · + FILTER, A CHIP, AND × ===== */
  async function gFilter(d){
    if (d.filters === false){
      const drawn = await ev(() => !!(window.__lh.seat() && window.__lh.seat().querySelector('[data-lh-add]')));
      if (drawn === true) note(`${tag(d)} 4 + Filter is drawn on a page ruled to have no filters`);
      return;
    }
    await arrive(d);
    const A = await ev(() => { if (!window.__lh.seat()) return null; const sel = window.__lh.addSel();
      if (!sel) return { none: !window.__lh.seat().querySelector('[data-lh-add]'), nosel: true };
      return { opts: [...sel.options].map((o, i) => ({ i, v: o.value, t: window.__lh.words(o), g: o.parentElement && o.parentElement.tagName === 'OPTGROUP' ? o.parentElement.label : '' })).filter(o => o.v) }; });
    if (!A || A.__err){ check(`${tag(d)} 4 + Filter`, false, 'no list head to find + Filter in'); return; }
    if (A.nosel){
      if (A.none && d.filters !== true){ note(`${tag(d)} 4 no + Filter here`, d.filters === false ? 'the page has no filters' : 'nothing drawn to add'); return; }
      check(`${tag(d)} 4 + Filter ([data-lh-add]) stands in the head`, false, A.none ? 'no [data-lh-add] in the head' : '[data-lh-add] holds no select for HaTi\'s list');
      return;
    }
    const vOf = o => (o.v.indexOf('\u0001') >= 0 ? o.v.split('\u0001')[1] : o.v);
    const rest = A.opts.filter(o => vOf(o) === 'all' || vOf(o) === '' || /^(all|any|anyone|anybody|every|both sides|any date)\b/i.test(o.t));
    check(`${tag(d)} 4a + Filter never offers a filter's at-rest value`, A.opts.length > 0 && !rest.length, JSON.stringify(rest.slice(0, 4).map(o => o.g + ': ' + o.t)) + ` of ${A.opts.length}`);
    const cnt = o => { const m = o.t.match(/\((\d[\d,\s]*)\)\s*$/); return m ? Number(m[1].replace(/\D/g, '')) : null; };
    const zero = A.opts.filter(o => cnt(o) === 0);
    check(`${tag(d)} 4b every value + Filter offers gives rows`, !zero.length, JSON.stringify(zero.slice(0, 4).map(o => o.g + ': ' + o.t)));
    const before = await ev(c => window.__lh.total(c), cfgOf(d));
    const pick = A.opts[0];
    const T = await ev(async i => {
      const sel = window.__lh.addSel(); if (!sel) return { gone: true };
      if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
      const r = sel.getBoundingClientRect();
      sel.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, pointerType: 'touch', isPrimary: true, clientX: r.x + 5, clientY: r.y + 5 }));
      const t0 = Date.now();
      while (Date.now() - t0 < 2000 && !document.querySelector('.hati-selmenu')) await new Promise(z => requestAnimationFrame(z));
      const menus = [...document.querySelectorAll('.hati-selmenu')].length;
      const a = document.activeElement;
      const row = document.querySelector(`.hati-selmenu [data-sm="${i}"]`);
      if (row) row.click();
      return { menus, focusedSelect: !!(a && a.tagName === 'SELECT'), row: !!row };
    }, pick.i);
    check(`${tag(d)} 4c a finger on + Filter opens HaTi's one list, never the system picker`, T && T.menus === 1 && !T.focusedSelect && T.row, JSON.stringify(T));
    if (!T || !T.row){ /* the list did not open: choose through the select itself, so the chip can still be judged */
      await ev(v => { const s = window.__lh.addSel(); if (!s) return; s.value = v; s.dispatchEvent(new Event('change', { bubbles: true })); }, pick.v);
    }
    const word = pick.t.replace(/\s*\(\d[\d,\s]*\)\s*$/, '').trim();
    const chips = await until(() => { const c = window.__lh.chips(); return c.length ? c : null; }, null, 4000);
    check(`${tag(d)} 4d the choice stands as ONE chip, its word and value with ×`, !!chips && chips.length === 1 && chips[0].x && chips[0].t.toLowerCase().includes(word.toLowerCase()),
      JSON.stringify({ chose: (pick.g ? pick.g + ': ' : '') + pick.t, chips }));
    const said = cnt(pick);
    const after = await until(([c, n]) => { const v = window.__lh.total(c); return v != null && (n == null || v === n) ? { n: v } : null; }, [cfgOf(d), said], 3000)
      || await ev(c => ({ n: window.__lh.total(c) }), cfgOf(d));
    const lit = await ev(() => { const t = window.__lh.tabs().find(x => x.lit); return t ? t.n : null; });
    check(`${tag(d)} 4e at least one row remains, as many as the choice said, and the lit tab follows`,
      !!after && after.n >= 1 && (said == null || after.n === said) && (lit == null || lit === after.n), JSON.stringify({ before, after: after && after.n, said, litTab: lit }));
    const x = await ev(() => { const s = window.__lh.seat(); const b = s && s.querySelector('.lh-chip [data-lh-x]'); if (!b) return false; b.click(); return true; });
    const back = await until(([c, n]) => !window.__lh.chips().length && window.__lh.total(c) === n ? true : null, [cfgOf(d), before], 4000);
    check(`${tag(d)} 4f × takes the chip away and the rows come back`, x === true && !!back, JSON.stringify({ pressed: x, before, now: await ev(c => window.__lh.total(c), cfgOf(d)) }));
  }

  /* ===== 5 · THE RIGHT END: Ask a column, Columns ===== */
  async function gRight(d){
    await arrive(d);
    const R = await ev(() => { const s = window.__lh.seat(); const ac = [...document.querySelectorAll('[data-ac-open]')].filter(window.__lh.vis);
      return { seat: !!s, acAny: ac.length, acInChips: !!(s && s.querySelector('.lh-chips [data-ac-open]')),
        lc: !!document.querySelector('[data-lc-btn]'), lcInChips: !!(s && s.querySelector('.lh-chips [data-lc-btn]')) }; });
    if (d.key === 'contracts') check(`${tag(d)} 5a "Ask a column" sits in the chip row (.lh-chips) on the List`, R.acInChips, JSON.stringify(R));
    else check(`${tag(d)} 5a no "Ask a column" on this page`, R.acAny === 0, JSON.stringify(R));
    if (d.columns === false) return;
    if (!R.lc && d.columns === 'maybe'){ note(`${tag(d)} 5b no Columns on this page`); return; }
    check(`${tag(d)} 5b Columns ([data-lc-btn]) sits in the chip row`, R.lcInChips, JSON.stringify(R));
    if (!R.lc){ check(`${tag(d)} 5c hiding a column takes its head and cells away`, false, 'no [data-lc-btn] to press'); return; }
    const before = await ev(c => { const r = window.__lh.rowEls(c)[0]; const t = r && r.closest('table');
      return t ? { th: [...t.querySelectorAll('thead th')].filter(window.__lh.vis).map(x => window.__lh.words(x)), td: r.querySelectorAll('td').length } : null; }, cfgOf(d));
    await ev(() => { const s = window.__lh.seat(); const b = (s && s.querySelector('.lh-chips [data-lc-btn]')) || document.querySelector('[data-lc-btn]'); if (b) b.click(); });
    const popped = await until(() => { const p = [...document.querySelectorAll('[data-lc-pop]')].find(window.__lh.vis); return p ? true : null; }, null, 3000);
    const hid = popped && await ev(() => { const p = [...document.querySelectorAll('[data-lc-pop]')].find(window.__lh.vis);
      const cb = p && [...p.querySelectorAll('input[type=checkbox][data-lc-k]')].find(x => x.checked && !x.disabled);
      if (!cb) return null; const label = window.__lh.words(cb.closest('label') || cb.parentElement); cb.click(); return { k: cb.getAttribute('data-lc-k'), label }; });
    const after = hid && before && await until(([c, n, lab]) => { const r = window.__lh.rowEls(c)[0]; const t = r && r.closest('table'); if (!t) return null;
      /* RE-POINTED 28 Oct 2026 (ROOM TO SPREAD): the room a hidden column gives back may let the grey line's
         facts stand as columns of their own, so the head may grow by those; the hidden one is gone either way */
      const th = [...t.querySelectorAll('thead th')].filter(window.__lh.vis).map(x => window.__lh.words(x)); return !th.includes(lab) ? { th, td: r.querySelectorAll('td').length } : null; }, [cfgOf(d), before.th.length, hid.label], 4000);
    check(`${tag(d)} 5c hiding a column through Columns takes its head and its cells away`,
      !!(before && hid && after && after.td === after.th.length && !after.th.includes(hid.label)), JSON.stringify({ popped: !!popped, hid, before, after }));
    await ev(() => { const r = [...document.querySelectorAll('[data-lc-pop] [data-lc-reset]')].find(window.__lh.vis); if (r) r.click(); });
    await until(([c, n]) => { const r = window.__lh.rowEls(c)[0]; const t = r && r.closest('table'); return t && [...t.querySelectorAll('thead th')].filter(window.__lh.vis).length === n ? true : null; }, [cfgOf(d), before ? before.th.length : -1], 3000);
    /* PRESS IT AGAIN AND IT CLOSES */
    await ev(() => { if ([...document.querySelectorAll('[data-lc-pop]')].some(window.__lh.vis)){ const b = [...document.querySelectorAll('[data-lc-btn]')].find(window.__lh.vis); if (b) b.click(); } });
  }

  /* ===== 6 · THE FOOT, AND SHOW N MORE ===== */
  async function gFoot(d){
    await arrive(d);
    const F = await ev(c => ({ f: window.__lh.foot(), rows: window.__lh.rows(c), lit: (window.__lh.tabs().find(t => t.lit) || {}).n }), cfgOf(d));
    if (!F || F.__err || !F.f){
      if (d.foot === 'maybe'){ note(`${tag(d)} 6 no foot under this list`); return; }
      check(`${tag(d)} 6a the foot [data-lh-foot] reads "1–k of n"`, false, 'no [data-lh-foot] under the list'); return; }
    const f = F.f;
    check(`${tag(d)} 6a the foot reads "1–k of n" for the rows drawn, as a live status (role=status)`,
      f.a === (f.n ? 1 : 0) && f.k === F.rows && f.n >= f.k && f.status && (F.lit == null || F.lit === f.n), JSON.stringify({ text: f.text, rows: F.rows, litTab: F.lit, status: f.status }));
    if (!(f.n > f.k)){
      check(`${tag(d)} 6b every row is drawn, and no Show more is offered`, !f.more, f.more || '');
      return;
    }
    const m = f.more && f.more.match(/(\d[\d,\s]*)/);
    const N = m ? Number(m[1].replace(/\D/g, '')) : null;
    const want = d.step ? Math.min(d.step, f.n - f.k) : null;
    check(`${tag(d)} 6b the foot offers "Show N more" with N = min(step, n − k)`, N != null && N <= f.n - f.k && (want == null || N === want), JSON.stringify({ more: f.more, step: d.step || null, k: f.k, n: f.n }));
    if (N == null) return;
    await ev(() => { const nm = window.__lh.seatName(); const b = (nm && document.querySelector(`[data-lh-more="${CSS.escape(nm)}"]`)) || document.querySelector('[data-lh-foot] [data-lh-more]'); if (b) b.click(); });
    const grown = await until(([c, n]) => window.__lh.rows(c) === n ? true : null, [cfgOf(d), f.k + N], 4000);
    const now = await ev(c => ({ rows: window.__lh.rows(c), f: window.__lh.foot() }), cfgOf(d));
    check(`${tag(d)} 6c Show ${N} more adds exactly ${N} rows, and the foot says so`, !!grown && now.f && (now.f.k === f.k + N || new RegExp('^' + (f.k + N) + ' contracts?\\b').test(now.f.text || '')), JSON.stringify({ was: f.k, now: now.rows, foot: now.f && now.f.text }));
  }

  /* ===== 7 · THE BOX: IT ONLY SEARCHES (29 Oct 2026) ===== */
  const boxFocus = () => ev(() => { const b = window.__lh.box(); if (!b) return false; b.focus(); return document.activeElement === b; });
  /* the head's recount after typing is one per pause (lhHeadSyncSoon): asked
     for as a state — the lit tab says the rows shown — and bounded */
  const recounted = c => until(cc => { const t = window.__lh.tabs().find(x => x.lit); return (!t || t.n == null || t.n === window.__lh.total(cc)) ? true : null; }, c, 3000);
  const boxClear = async () => { await boxFocus(); await page.keyboard.press('Control+A'); await page.keyboard.press('Backspace'); };
  async function gBox(d){
    await arrive(d);
    const has = await ev(() => !!window.__lh.box());
    if (has !== true){
      check(`${tag(d)} 7a typing a party in the box narrows the list, the caret kept`, false, 'no input[data-lh-q] in the head to type in');
      check(`${tag(d)} 7f a question narrows like any words, and Enter sends nothing to Jambo`, false, 'no box to type in');
      return;
    }
    const cfg = cfgOf(d);
    const before = await ev(c => ({ total: window.__lh.total(c), rows: window.__lh.rows(c), tabs: window.__lh.tabs(), view: state.view }), cfg);
    const P = await ev(([c, p]) => window.__lh.pick(c, p), [cfg, PARTIES]);
    if (!P || P.__err){ check(`${tag(d)} 7a typing a party narrows`, false, 'no row to take a word from'); return; }
    await boxClear();
    let lost = null;
    for (let i = 0; i < P.word.length; i++){
      await page.keyboard.type(P.word[i]);
      const ok = await ev(v => { const a = document.activeElement; return !!(a && a.matches && a.matches('[data-lh-seat] input[data-lh-q]') && a.value === v); }, P.word.slice(0, i + 1));
      if (ok !== true && lost == null) lost = { at: i + 1, typed: P.word.slice(0, i + 1), active: await ev(() => { const a = document.activeElement; return a ? a.tagName + (a.id ? '#' + a.id : '') : null; }) };
    }
    check(`${tag(d)} 7a the caret stays in the box at every keystroke`, lost == null, lost == null ? `typed "${P.word}"` : JSON.stringify(lost));
    const nar = await until(([c, wd]) => { const els = window.__lh.rowEls(c); return els.length && els.every(e => window.__lh.rowText(e).includes(wd.toLowerCase())) ? els.length : null; }, [cfg, P.word], 5000);
    /* the head counts again once the typing pauses (lhHeadSyncSoon,
       LH_SYNC_QUIET_MS): wait for that recount, bounded, before judging it */
    await recounted(cfg);
    await until(() => window.__lh.synced() ? true : null, null, 3000);
    const after = await ev(c => ({ total: window.__lh.total(c), tabs: window.__lh.tabs() }), cfg);
    const litT = (after.tabs || []).find(t => t.lit), allB = (before.tabs || []).find(t => t.all), allA = (after.tabs || []).find(t => t.all);
    check(`${tag(d)} 7b typing "${P.word}" narrows the list to the rows that carry it (a ${P.kind} is never a question)`,
      !!nar && after.total >= 1 && after.total < before.total, JSON.stringify({ before: before.total, after: after.total }));
    /* a list ruled to draw no tab row (the book) has no numbers to follow */
    if (d.tabs === false) note(`${tag(d)} 7c this list draws no tab row (as ruled)`);
    else check(`${tag(d)} 7c the tab numbers follow the words`, (after.tabs || []).length > 0 && (!litT || litT.n === after.total)
      && (after.tabs || []).every(t => t.saved || t.lit || t.all || t.n > 0) && (!allB || !allA || allA.n <= allB.n),
      JSON.stringify({ was: (before.tabs || []).map(t => t.label + ' ' + t.n), now: (after.tabs || []).map(t => t.label + ' ' + t.n), shown: after.total }));
    /* Enter on plain words stays a search */
    const h0 = await ev(() => window.__lh.hist());
    await page.keyboard.press('Enter');
    const grew = await until(n => window.__lh.hist() > n ? true : null, h0, 1500);
    const st = await ev(c => ({ box: (window.__lh.box() || {}).value, total: window.__lh.total(c), view: state.view }), cfg);
    check(`${tag(d)} 7d Enter on plain words stays a search: no Jambo turn, the words and the rows stay`,
      !grew && st.box === P.word && st.total === after.total && st.view === before.view, JSON.stringify({ grew: !!grew, st }));
    await boxClear();
    await until(([c, n]) => window.__lh.total(c) === n ? true : null, [cfg, before.total], 4000);
    /* "Visa" is a party, never a question */
    const visa = await ev(c => { const els = window.__lh.rowEls(c); const n = els.filter(e => window.__lh.rowText(e).includes('visa')).length; return { n, of: els.length }; }, cfg);
    if (visa && visa.n >= 1 && visa.n < visa.of){
      await boxFocus(); await page.keyboard.type('Visa');
      const vn = await until(c => { const els = window.__lh.rowEls(c); return els.length && els.every(e => window.__lh.rowText(e).includes('visa')) ? els.length : null; }, cfg, 5000);
      const vt = await ev(c => window.__lh.total(c), cfg);
      check(`${tag(d)} 7e "Visa" narrows like any word (it is a party, not a question)`, !!vn && vt < before.total, JSON.stringify({ before: before.total, after: vt }));
      await boxClear();
      await until(([c, n]) => window.__lh.total(c) === n ? true : null, [cfg, before.total], 4000);
    } else note(`${tag(d)} 7e no row here names Visa, so "Visa" is not tried`, JSON.stringify(visa));
    /* RE-POINTED 29 Oct 2026 (owner: "AI questions should only go to the jambo
       panel"): the box only searches. A question narrows the list like any
       words (none of these rows carries all of them), the caret kept; Enter
       sends nothing to Jambo — no turn, no AI call — and the reader, the
       view and the words stay. */
    const rest = await ev(c => window.__lh.rows(c), cfg);
    await boxFocus(); await page.keyboard.type(QUESTION);
    const held = await until(([c, n, q]) => { const b = window.__lh.box(); return b && b.value === q && window.__lh.rows(c) < n ? true : null; }, [cfg, rest, QUESTION], 4000);
    const qn = await ev(c => ({ total: window.__lh.total(c), rows: window.__lh.rows(c), focus: document.activeElement === window.__lh.box() }), cfg);
    check(`${tag(d)} 7f "${QUESTION}" narrows the list like any words, the caret kept`, !!held && qn.rows < rest && qn.focus, JSON.stringify({ before: before.total, rest, now: qn }));
    const asked0 = await ev(q => window.__lh.asked(q), QUESTION);
    const calls0 = h.ai.calls.length;
    await page.keyboard.press('Enter');
    const went = await until(([q, n]) => window.__lh.asked(q) > n ? true : null, [QUESTION, asked0], 1500);
    await quiet();
    const after2 = await ev(c => { const b = window.__lh.box();
      return { view: state.view, head: !!window.__lh.seat(), box: b ? b.value : null, rows: window.__lh.rows(c) }; }, cfg);
    const calls = h.ai.calls.length - calls0;
    check(`${tag(d)} 7g Enter on "${QUESTION}" sends nothing to Jambo: no turn, no AI call, the reader stays and the words stay in the box`,
      !went && calls === 0 && after2.view === before.view && after2.head && after2.box === QUESTION && after2.rows === qn.rows,
      JSON.stringify({ asked: !!went, calls, ...after2, wasView: before.view }));
    /* leave the box empty for what follows */
    if (await ev(() => !!(window.__lh.box() && window.__lh.box().value)) === true) await boxClear();
  }

  /* ===== 8 · A REFRESH LANDS AT THE SAME SPOT ===== */
  async function gRefresh(d){
    await arrive(d);
    if (await ev(() => !!window.__lh.seat()) !== true){ check(`${tag(d)} 8 a refresh keeps the tab, the chip and the words`, false, 'no list head to set a spot on'); return; }
    const cfg = cfgOf(d);
    const hasBox = await ev(() => !!window.__lh.box()) === true;
    if (hasBox) await boxClear();
    const start = await ev(() => { const t = window.__lh.tabs().find(x => x.lit); return t ? t.label : null; });
    const tabs = await ev(() => window.__lh.tabs());
    const other = (Array.isArray(tabs) ? tabs : []).find(t => !t.lit && !t.all && !t.saved && t.n > 0) || (Array.isArray(tabs) ? tabs : []).find(t => !t.lit && !t.saved && t.n > 0);
    if (other){ await ev(l => window.__lh.tabPress(l), other.label); await until(l => window.__lh.tabLit(l) ? true : null, other.label, 4000); }
    const addV = await ev(() => { const s = window.__lh.addSel(); const o = s && [...s.options].find(x => x.value); if (!o) return null; s.value = o.value; s.dispatchEvent(new Event('change', { bubbles: true })); return o.value; });
    if (addV) await until(() => window.__lh.chips().length ? true : null, null, 4000);
    const P = await ev(([c, p]) => { const r = window.__lh.pick(c, p, true); return r ? r.word.split(' ')[0] : null; }, [cfg, PARTIES]);
    if (P && hasBox){
      await boxClear(); await page.keyboard.type(P);
      await until(([c, wd]) => { const els = window.__lh.rowEls(c); return els.length && els.every(e => window.__lh.rowText(e).includes(wd.toLowerCase())) ? true : null; }, [cfg, P], 5000);
      await recounted(cfg);
    }
    const spot = () => ev(c => ({ tab: (window.__lh.tabs().find(t => t.lit) || {}).label || null, chips: window.__lh.chips().map(x => x.t).sort(),
      words: (window.__lh.box() || {}).value == null ? null : window.__lh.box().value, ids: window.__lh.ids(c).slice(0, 60) }), cfg);
    /* the head's numbers settle once the typing pauses (lhHeadSyncSoon): ask, bounded */
    await until(c => { const t = window.__lh.total(c), lit = window.__lh.tabs().find(x => x.lit); return (!lit || lit.n === t) ? true : null; }, cfg, 3000);
    await until(() => window.__lh.synced() ? true : null, null, 3000);
    const was = await spot();
    await page.reload({ waitUntil: 'networkidle' });
    await loaded();
    const back = await until(([c, wd]) => { const b = window.__lh.box(); return window.__lh.seat() && window.__lh.rows(c) > 0 && (!wd || (b && b.value === wd)) ? true : null; }, [cfg, was.words || ''], 15000);
    const now = await spot();
    const same = !!back && now.tab === was.tab && JSON.stringify(now.chips) === JSON.stringify(was.chips) && now.words === was.words && JSON.stringify(now.ids) === JSON.stringify(was.ids);
    if (d.tabs !== false && !other) note(`${tag(d)} 8 no second tab with rows to light before the refresh`);
    check(`${tag(d)} 8 a refresh lands at the same spot: the same tab lit, chip, words and rows`,
      same && hasBox && !!P && now.words === P && (!other || now.tab === other.label) && (d.filters !== true || (!!addV && now.chips.length === 1)) && now.ids.length > 0,
      JSON.stringify({ set: { tab: other && other.label, chip: !!addV, words: P }, was: { ...was, ids: was.ids.length }, now: { ...now, ids: now.ids.length }, sameRows: JSON.stringify(now.ids) === JSON.stringify(was.ids) }));
    /* put it back at rest */
    await ev(() => { const s = window.__lh.seat(); s && s.querySelectorAll('.lh-chip [data-lh-x]').forEach(b => b.click()); });
    if (await ev(() => !!window.__lh.box()) === true) await boxClear();
    if (start) await ev(l => window.__lh.tabPress(l), start);
  }

  /* ===== CONTRACTS ONLY ===== */
  async function gContracts(d){
    await arrive(d);
    const C = await ev(c => {
      const arch = [...document.querySelectorAll('[data-ct-archive]')].find(window.__lh.vis);
      const wb = [...document.querySelectorAll('button[data-ct-show="wall"]')].find(window.__lh.vis);
      const seg = wb ? [...wb.parentElement.querySelectorAll('button[data-ct-show]')].filter(window.__lh.vis) : [];
      const ra = window.__lh.rect(arch), rs = seg.length ? window.__lh.rect(seg[0].parentElement) : null;
      const tr = window.__lh.rowEls(c)[0], id = tr && tr.getAttribute('data-row');
      const ct = id && (state.contracts || []).find(x => String(x.id) === String(id));
      const td = tr && tr.querySelector('td');
      const ref = ct ? String(ct.contractNo || ct.id) : '';
      /* the line under the party: an element of the cell holding "kind · ref" and not the party itself */
      const subs = td && ct ? [...td.querySelectorAll('*')].map(e => window.__lh.words(e)).filter(t => t && !t.includes(ct.counterparty)) : [];
      const t = tr && tr.closest('table');
      /* the widths the table is drawn with: its <col>s, else its heads */
      const colEls = t ? [...t.querySelectorAll('colgroup col')] : [];
      const cols = t ? (colEls.length ? colEls : [...t.querySelectorAll('thead th')]).map(x => x.style.width || x.getAttribute('width') || '') : [];
      return { arch: !!arch, seg: seg.map(e => e.getAttribute('data-ct-show')), beside: !!(ra && rs && ra.t < rs.b && rs.t < ra.b),
        first: td ? { text: window.__lh.words(td).slice(0, 120), av: (() => { const a = td.querySelector('.reg-av, [class*="-av"]'); return a ? window.__lh.words(a) : null; })(), mark: !!td.querySelector('.reg-id .ls-mark svg'),
          party: ct ? window.__lh.words(td).includes(ct.counterparty) : false, subs, ref, title: ct ? ct.name : '', hover: !!(ct && [...td.querySelectorAll('[title]'), td].some(e => (e.title || '').includes(ct.name))) } : null,
        heads: t ? [...t.querySelectorAll('thead th')].filter(window.__lh.vis).map(x => window.__lh.words(x)) : [], cols };
    }, cfgOf(d));
    check('contracts C1 the Archive button still stands beside List | Wall', C.arch && C.seg.join() === 'list,wall' && C.beside, JSON.stringify({ arch: C.arch, seg: C.seg, beside: C.beside }));
    const T = await ev(() => window.__lh.seat() ? window.__lh.tabs().filter(t => !t.saved).map(t => t.label) : null);
    const VIEWS = ['All', 'Needs you', 'In negotiation', 'Ending in 90 days', 'Drafts'];
    /* TIGHTENED 22 Oct 2026 (the owner's answer to question 2, "B": "Move
       those four under + Filter — exactly the five drawn tabs"): EXACTLY these
       five (the saved views apart), though Term already ended, Overdue
       obligations and Details to fill hold rows on this book. Red at
       e10e3af6, where the four stood as tabs after Drafts. */
    check('contracts C2 the views: exactly All · Needs you · In negotiation · Ending in 90 days · Drafts (each holds rows on this book), then only saved views',
      Array.isArray(T) && T.length === VIEWS.length && VIEWS.every((v, i) => T[i] === v), JSON.stringify(T));
    const f = C.first;
    const kr = f && f.subs.find(s => new RegExp('^\\S.* · ' + f.ref.replace(/[-.]/g, '\\$&') + '$').test(s));
    /* RE-POINTED 27 Oct 2026 (THE LIST LANGUAGE, owner: "keep contracts … as designed"): a mark leads in the
       initials' place, and the grey line under the agreement reads "party · ref · stage · when it moved" */
    check('contracts C3 the first column: a mark, the agreement, and "party · ref · stage" under it',
      !!(f && f.mark && !f.av && f.title && f.text.indexOf(f.title) >= 0 && new RegExp(' · ' + f.ref.replace(/[-.]/g, '\\$&') + ' · \\S').test(f.text) && f.hover), JSON.stringify(f));
    check('contracts C4 the columns at rest: Agreement · Stream · Our standards · Ends · Value, Owner under Columns, no Ref or Stage column of its own',
      ['Agreement', 'Stream', 'Our standards', 'Ends', 'Value'].every(k => C.heads.includes(k)) && !C.heads.includes('Owner') && !C.heads.includes('Ref') && !C.heads.includes('Stage'), JSON.stringify(C.heads));
    const pct = C.cols.map(x => /%$/.test(x) ? parseFloat(x) : NaN);
    const sum = pct.reduce((a, b) => a + b, 0);
    check('contracts C5 the <col> widths add up to 100%', C.cols.length > 0 && pct.every(Number.isFinite) && Math.abs(sum - 100) <= 0.6, JSON.stringify({ cols: C.cols, sum: Math.round(sum * 10) / 10 }));
    /* no Ask a column on the Wall */
    await ev(() => { regPlaceSet({ show: 'wall' }); setView('register'); });
    const wall = await until(() => { const b = document.querySelector('[data-ct-show="wall"]'); return b && (b.getAttribute('aria-pressed') === 'true' || b.classList.contains('on') || b.classList.contains('is-on')) || document.querySelector('#ig-wall, .igw-foot') ? true : null; }, null, 6000);
    const acW = await ev(() => [...document.querySelectorAll('[data-ac-open]')].filter(window.__lh.vis).length);
    check('contracts C6 the Wall carries no "Ask a column"', !!wall && acW === 0, JSON.stringify({ wall: !!wall, ac: acW }));
    await ev(() => { regPlaceSet({ show: 'list' }); setView('register'); });
    await until(c => window.__lh.rows(c) > 0 ? true : null, cfgOf(d), 6000);
  }
  /* ===== CONTRACTS: THE FOUR OLD QUICK FILTERS UNDER + FILTER (22 Oct 2026) =====
     The owner's answer to question 2, "B": "Move those four under + Filter —
     exactly the five drawn tabs. The four views are still one press away
     under + Filter." A finger on + Filter opens HaTi's own list; its Quick
     filters group (the 'view' key, the very R.view the tabs write) holds the
     four that have rows; a choice shows ONE chip and exactly the rows that
     view reads, All lit with their number; × brings the list back. Then the
     tab row is ONE line at each of the owner's three screens. Red at
     e10e3af6: there was no Quick filters group (the four were tabs), and
     the tab row took two lines. */
  async function gQuick(d){
    await arrive(d);
    await until(c => window.__lh.rows(c) > 0 ? true : null, cfgOf(d), 6000);
    const before = await ev(c => window.__lh.total(c), cfgOf(d));
    const Q = await ev(() => { const sel = window.__lh.addSel(); if (!sel) return { nosel: true };
      const opts = [...sel.options].map((o, i) => { let kv = null; try { kv = JSON.parse(o.value); } catch (_){ kv = null; }
        return { i, kv, t: window.__lh.words(o), g: o.parentElement && o.parentElement.tagName === 'OPTGROUP' ? o.parentElement.label : '' }; })
        .filter(o => Array.isArray(o.kv) && o.kv[0] === 'view');
      return { opts }; });
    const four = ['expired', 'autosoon', 'overdueob', 'details'];
    const okOpts = !!Q && Array.isArray(Q.opts) && Q.opts.length > 0 && Q.opts.every(o => four.includes(o.kv[1]) && /\((\d+)\)\s*$/.test(o.t) && !/\(0\)\s*$/.test(o.t))
      && new Set(Q.opts.map(o => o.g)).size === 1;
    check('contracts C8a + Filter holds ONE Quick filters group: only the four old views, each with rows and counted',
      okOpts, JSON.stringify(Q && Array.isArray(Q.opts) ? Q.opts.map(o => (o.g ? o.g + ': ' : '') + o.t) : Q));
    if (!okOpts){ check('contracts C8b choosing one of the four under + Filter shows one chip and the rows that view reads', false, 'no Quick filters choice under + Filter to press'); }
    else {
      const pick = Q.opts[0], k = pick.kv[1], said = Number(pick.t.match(/\((\d+)\)\s*$/)[1]);
      /* the rows that view reads, asked of the page's own reading with only the view swapped (as regViewCount does) */
      const want = await ev(v => { const R = regState(), was = R.view; R.view = v; let ids = [];
        try { ids = regFiltered().map(c => 'data-row=' + c.id); } finally { R.view = was; } return ids; }, k);
      const T = await ev(async i => {
        const sel = window.__lh.addSel(); if (!sel) return { gone: true };
        if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
        const r = sel.getBoundingClientRect();
        sel.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, pointerType: 'touch', isPrimary: true, clientX: r.x + 5, clientY: r.y + 5 }));
        const t0 = Date.now();
        while (Date.now() - t0 < 2000 && !document.querySelector('.hati-selmenu')) await new Promise(z => requestAnimationFrame(z));
        const menus = document.querySelectorAll('.hati-selmenu').length, a = document.activeElement;
        const row = document.querySelector(`.hati-selmenu [data-sm="${i}"]`);
        if (row) row.click();
        return { menus, focusedSelect: !!(a && a.tagName === 'SELECT'), row: !!row };
      }, pick.i);
      const chips = await until(() => { const c = window.__lh.chips(); return c.length ? c : null; }, null, 4000);
      const got = await until(([c, n]) => window.__lh.total(c) === n ? true : null, [cfgOf(d), said], 4000);
      const S = await ev(c => ({ view: regState().view, total: window.__lh.total(c), ids: window.__lh.ids(c),
        lit: window.__lh.tabs().filter(t => t.lit && !t.saved).map(t => ({ label: t.label, n: t.n })) }), cfgOf(d));
      const word = pick.t.replace(/\s*\(\d+\)\s*$/, '').trim();
      const inSet = !!S && Array.isArray(S.ids) && S.ids.length > 0 && S.ids.every(x => want.includes(x));
      check('contracts C8b a finger on + Filter opens HaTi\'s one list; choosing a Quick filter shows ONE chip and exactly the rows that view reads, All lit with their number',
        !!T && T.menus === 1 && !T.focusedSelect && T.row && !!chips && chips.length === 1 && chips[0].x && chips[0].t.includes(word)
          && !!got && S.view === k && S.total === said && S.total === want.length && inSet && S.lit.length === 1 && S.lit[0].label === 'All' && S.lit[0].n === said,
        JSON.stringify({ chose: pick.t, k, press: T, chips, view: S && S.view, total: S && S.total, said, reads: want.length, inSet, lit: S && S.lit }));
      const x = await ev(() => { const s = window.__lh.seat(); const b = s && s.querySelector('.lh-chip [data-lh-x="view"]'); if (!b) return false; b.click(); return true; });
      const back = await until(([c, n]) => !window.__lh.chips().length && window.__lh.total(c) === n ? true : null, [cfgOf(d), before], 4000);
      const after = await ev(() => regState().view);
      check('contracts C8c its × takes the chip away, the view back to rest, and the whole list back',
        x === true && !!back && (after == null || after === ''), JSON.stringify({ pressed: x, before, view: after, now: await ev(c => window.__lh.total(c), cfgOf(d)) }));
    }
    /* THE TAB ROW IS ONE LINE, at each of the owner's three screens — at
       rest and with a Quick filter's chip standing; and the four are one
       press away (the open list's Quick filters heading), photographed */
    const tabLines = () => ev(() => { const s = window.__lh.seat(), tl = s && s.querySelector('[role="tablist"]'); if (!tl) return null;
      const kids = [...tl.children].filter(window.__lh.vis).map(e => ({ t: window.__lh.words(e).slice(0, 30), r: window.__lh.rect(e) }));
      /* a line is the band the pieces overlap in: a smaller control centred on the row (+ Save this view) is the same line */
      const lines = []; kids.forEach(x => { const ln = lines.find(l => x.r.t < l.b - 2 && x.r.b > l.t + 2);
        if (ln){ ln.t = Math.min(ln.t, x.r.t); ln.b = Math.max(ln.b, x.r.b); } else lines.push({ t: x.r.t, b: x.r.b }); });
      return { lines: lines.length, n: kids.length, h: window.__lh.rect(tl).h, kids: kids.map(x => x.t + '@' + x.r.t + '-' + x.r.b) }; });
    for (const [wd, ht] of SCREENS){
      await page.setViewportSize({ width: wd, height: ht });
      await arrive(d);
      await until(c => window.__lh.rows(c) > 0 ? true : null, cfgOf(d), 4000);
      const L = await tabLines();
      await shot(`contracts-tabs-${wd}x${ht}`);
      check(`contracts C8d ${wd}×${ht}: the tab row is ONE line`, !!L && L.n >= 5 && L.lines === 1, JSON.stringify(L));
      const M = await ev(async () => { const sel = window.__lh.addSel(); if (!sel) return null;
        if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
        const r = sel.getBoundingClientRect();
        sel.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, pointerType: 'touch', isPrimary: true, clientX: r.x + 5, clientY: r.y + 5 }));
        const t0 = Date.now();
        while (Date.now() - t0 < 2000 && !document.querySelector('.hati-selmenu')) await new Promise(z => requestAnimationFrame(z));
        const g = [...document.querySelectorAll('.hati-selmenu .hati-selmenu-g')].find(x => window.__lh.words(x) === 'Quick filters');
        if (g) g.scrollIntoView({ block: 'nearest' });
        return { heads: [...document.querySelectorAll('.hati-selmenu .hati-selmenu-g')].map(window.__lh.words), quick: !!g }; });
      await shot(`contracts-filter-menu-${wd}x${ht}`);
      await ev(() => { if (window.selectMenuClose) selectMenuClose(); });
      const v = await ev(() => { const s = window.__lh.addSel(); const o = s && [...s.options].find(x => { try { return JSON.parse(x.value)[0] === 'view'; } catch (_){ return false; } });
        if (!o) return null; s.value = o.value; s.dispatchEvent(new Event('change', { bubbles: true })); return o.value; });
      const chip = v && await until(() => document.querySelector('[data-lh-seat="contracts"] .lh-chip[data-lh-chip="view"]') ? true : null, null, 4000);
      const L2 = chip ? await tabLines() : null;
      await shot(`contracts-quick-chip-${wd}x${ht}`);
      check(`contracts C8e ${wd}×${ht}: the Quick filters are one press away under + Filter, and with one chosen the tab row is still ONE line`,
        !!M && M.quick && !!chip && !!L2 && L2.lines === 1, JSON.stringify({ menu: M, chip: !!chip, lines: L2 && L2.lines }));
      await ev(() => { const b = document.querySelector('[data-lh-seat="contracts"] .lh-chip [data-lh-x="view"]'); if (b) b.click(); });
      await until(() => !document.querySelector('[data-lh-seat="contracts"] .lh-chip[data-lh-chip="view"]') ? true : null, null, 4000);
    }
    await page.setViewportSize({ width: 1440, height: 780 });
  }
  /* the § chip on a kept answer opens the contract on Home's paper */
  async function gCite(d){
    await arrive(d);
    const door = await ev(() => { const b = [...document.querySelectorAll('[data-ac-open]')].find(window.__lh.vis); if (!b || b.disabled) return false; b.click(); return true; });
    if (door !== true){ check('contracts C7 an answer cell carries a § chip that opens its contract on Home\'s paper', false, 'no live [data-ac-open] to ask a column with'); return; }
    const form = await until(() => document.querySelector('#ac-q') && document.querySelector('[data-ac-ask]') ? true : null, null, 5000);
    if (!form){ check('contracts C7 the § chip', false, 'the Ask a column form did not open'); return; }
    await page.fill('#ac-q', 'How much notice does each side need to end the contract early?');
    /* RE-POINTED 28 Oct 2026 (round 2 of the review): the form has one box; the name is said under it, with Change */
    await page.click('[data-ac-name-edit]').catch(() => {}); await page.fill('#ac-name', 'Notice to end').catch(() => {});
    await ev(() => document.querySelector('[data-ac-ask]').click());
    const filled = await until(() => document.querySelectorAll('td.ac-cell .ac-ans:not(.is-wait)').length > 0 ? true : null, null, 30000);
    /* RE-POINTED (the owner picked "Lights", 26 Oct 2026): the § chip came OUT
       of the cell, which now says one thing — the light and the short answer.
       The clause, the words it was read from and the tick stand in the panel's
       reading of the chosen row, and Go to clause is its own button there. */
    const cell = filled && await until(() => { const a = [...document.querySelectorAll('td.ac-cell .ac-ans')].find(e => window.__lh.vis(e) && !e.classList.contains('is-wait'));
      if (!a) return null; const td = a.closest('td.ac-cell');
      return { cid: td && td.getAttribute('data-ac-cid'), t: window.__lh.words(td), lines: td.getClientRects().length, chip: !!td.querySelector('.ac-cite'), tick: !!td.querySelector('[data-ac-ck]') }; }, null, 4000);
    if (!cell){ check('contracts C7 an answer cell is one light and one answer', false, filled ? 'no answered cell found' : 'no answer came back to the list'); return; }
    check('contracts C7 an answer cell is one light and one answer, with no § chip or tick squeezing it', !cell.chip && !cell.tick && !/\n/.test(cell.t), JSON.stringify(cell));
    /* RE-POINTED 29 Oct 2026 (One sheet): the list now reaches the panel's foot, so more answered rows are in
       sight and the first may be one read with no clause to go to (none quoted) — the first answered row whose
       reading carries Go to clause is the one asked */
    const cids = await ev(() => [...document.querySelectorAll('td.ac-cell .ac-ans:not(.is-wait)')].filter(e => window.__lh.vis(e)).map(e => e.closest('td.ac-cell').getAttribute('data-ac-cid')).filter(Boolean).slice(0, 6));
    let go = null, goCid = cell.cid;
    for (const cid of (cids && cids.length ? cids : [cell.cid])){
      await ev(c => { const a = document.querySelector(`td.ac-cell[data-ac-cid="${CSS.escape(c)}"] .ac-a`); if (a) a.click(); }, cid);
      go = await until(() => document.querySelector('#ig-dock [data-ac-go]') ? true : null, null, 3000);
      if (go){ goCid = cid; break; }
    }
    if (go) await ev(() => document.querySelector('#ig-dock [data-ac-go]').click());
    const open = await until(cid => window.pdContract && pdContract() && String(pdContract().id) === cid ? true : null, goCid, 10000);
    check('contracts C7\u2032 the panel reads that answer out, and Go to clause opens its contract on Home\'s paper', !!go && !!open, JSON.stringify(Object.assign({}, cell, { tried: cids, went: goCid })));
    await shot('contracts-cite');
  }

  /* ===== PEOPLE ONLY ===== */
  async function gPeople(d){
    await arrive(d);
    const T = await ev(() => window.__lh.seat() ? window.__lh.tabs().map(t => t.label) : null);
    check('people P1 tabs Everyone · Ours · Theirs', Array.isArray(T) && T[0] === 'Everyone' && T[1] === 'Ours' && T[2] === 'Theirs', JSON.stringify(T));
    const P = await ev(([c, people, titles]) => {
      const els = window.__lh.rowEls(c);
      const hit = els.map(tr => { const td = tr.querySelector('td'); const i = people.findIndex(p => td && window.__lh.words(td).includes(p)); return i >= 0 ? { tr, td, i } : null; }).find(Boolean);
      const t = els[0] && els[0].closest('table');
      const heads = t ? [...t.querySelectorAll('thead th')].filter(window.__lh.vis).map(x => window.__lh.words(x)) : [];
      const mails = els.filter(tr => tr.querySelector('a[href^="mailto:"]')).length;
      if (!hit) return { heads, mails, none: true };
      const nameEl = [...hit.td.querySelectorAll('*')].find(e => !e.children.length && window.__lh.words(e) === people[hit.i]);
      const titleEl = [...hit.td.querySelectorAll('*')].find(e => !e.children.length && window.__lh.words(e).includes(titles[hit.i]));
      const rn = window.__lh.rect(nameEl), rt = window.__lh.rect(titleEl);
      /* RE-POINTED 28 Oct 2026 (owner: "take the title from below the name"): the job title is its own column */
      const ti = heads.indexOf('Job title'), tcell = ti >= 0 ? hit.tr.children[ti] : null;
      return { heads, mails, who: people[hit.i], title: titles[hit.i], under: !!(rn && rt && rt.t >= rn.b - 2), inCol: !!(tcell && window.__lh.words(tcell).includes(titles[hit.i])), cell: window.__lh.words(hit.td).slice(0, 80) };
    }, [cfgOf(d), PEOPLE, TITLES]);
    check('people P2 the job title stands in its own column, not under the name', !!(P && !P.none && P.inCol && !P.under), JSON.stringify(P));
    check('people P3 no Email column (the address stays in the person\'s panel)', !!P && !P.heads.some(h => /^e-?mail$/i.test(h)) && P.mails === 0, JSON.stringify({ heads: P && P.heads, mailLinks: P && P.mails }));
  }

  /* ===== EVERY SCREEN ===== */
  async function gScreens(d){
    for (const [wd, ht] of SCREENS){
      await page.setViewportSize({ width: wd, height: ht });
      await arrive(d);
      await until(c => window.__lh.rows(c) > 0 ? true : null, cfgOf(d), 4000);
      const M = await ev(([c, p]) => {
        const inV = r => !!r && r.w > 0 && r.h > 0 && r.t >= -1 && r.l >= -1 && r.b <= innerHeight + 1 && r.r <= innerWidth + 1;
        const s = window.__lh.seat(), box = window.__lh.box(), tl = s && s.querySelector('[role="tablist"]'), ch = s && s.querySelector('.lh-chips');
        const add = s && s.querySelector('[data-lh-add]'), addEl = add ? (add.closest('label') || add) : null;
        const row = window.__lh.rowEls(c).find(e => e.getClientRects().length), pn = document.querySelector(p);
        const hitOf = el => { if (!el) return null; const r = el.getBoundingClientRect(); const at = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
          return !!at && (at === el || el.contains(at) || at.contains(el)); };
        const cut = el => el ? el.scrollWidth - el.clientWidth : null;
        const chR = window.__lh.rect(ch);
        return { head: !!s, box: inV(window.__lh.rect(box)), tabs: tl ? inV(window.__lh.rect(tl)) : null, chips: chR && chR.h > 0 ? inV(chR) : null,
          row: inV(window.__lh.rect(row)), rowR: window.__lh.rect(row), panel: (() => { const r = window.__lh.rect(pn); return !!r && r.w >= 200 && r.l >= -1 && r.r <= innerWidth + 1 && r.t < innerHeight && r.b > 0; })(), panelR: window.__lh.rect(pn),
          tabsCut: cut(tl), chipsCut: cut(ch), side: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          boxHit: hitOf(box), addHit: addEl ? hitOf(addEl) : null };
      }, [cfgOf(d), d.panel]);
      await shot(`${tag(d).replace('/', '-')}-${wd}x${ht}`);
      const tabsNeeded = d.tabs !== false, chipsNeeded = d.filters === true || d.columns === true;
      check(`${tag(d)} S ${wd}×${ht}: the head's rows, the first list row and Jambo's panel are in view`,
        M.head && M.box && (!tabsNeeded || M.tabs === true) && (chipsNeeded ? M.chips === true : M.chips !== false) && M.row && M.panel,
        JSON.stringify({ head: M.head, box: M.box, tabs: M.tabs, chips: M.chips, row: M.row, rowR: M.rowR, panel: M.panel, panelR: M.panelR }));
      check(`${tag(d)} S ${wd}×${ht}: nothing cut sideways, no sideways page scroll`,
        M.head && (M.tabsCut == null || M.tabsCut <= 1) && (M.chipsCut == null || M.chipsCut <= 1) && M.side <= 1 && (!tabsNeeded || M.tabsCut != null),
        JSON.stringify({ tabsCut: M.tabsCut, chipsCut: M.chipsCut, page: M.side }));
      check(`${tag(d)} S ${wd}×${ht}: ${d.filters === true ? 'the box and + Filter are' : 'the box is'} what is painted where ${d.filters === true ? 'they stand' : 'it stands'}`,
        M.boxHit === true && (d.filters !== true || M.addHit === true), JSON.stringify({ box: M.boxHit, add: M.addHit }));
    }
    await page.setViewportSize({ width: 1440, height: 780 });
  }

  try {
    await signIn();
    const ok = await loaded();
    check('0 the book is loaded: 56 contracts, signed in as the admin', !!ok, ok ? '' : 'the list never arrived');
    for (const d of DEFS){
      if (WANT && !WANT.has(d.key)) continue;
      console.log(`\n== ${d.title} ==`);
      try {
        const up = await arrive(d);
        if (!up) note(`${tag(d)}: neither rows nor a head came up after the way in`);
        await shot(`${tag(d).replace('/', '-')}-arrival`);
        await gHead(d);
        await gBand(d);
        if (d.key === 'contracts') await gContracts(d);
        if (d.key === 'contracts') await gQuick(d);
        if (d.key === 'people') await gPeople(d);
        await gTabs(d);
        await gFilter(d);
        await gRight(d);
        await gFoot(d);
        await gBox(d);
        await gRefresh(d);
        await gScreens(d);
        if (d.key === 'contracts') await gCite(d);
      } catch (e){
        check(`${tag(d)} the section ran to its end`, false, String(e && e.stack || e).slice(0, 400));
        await page.setViewportSize({ width: 1440, height: 780 }).catch(() => {});
      }
    }
  } catch (e){
    check('the stage ran', false, String(e && e.stack || e).slice(0, 400));
  } finally {
    check('no page errors', !errors.length, errors.slice(0, 3).join(' | '));
    await browser.close().catch(() => {});
    await h.stop().catch(() => {});
    console.log(`\n${pass} passed, ${fail} failed`);
    process.exit(fail ? 1 : 0);
  }
})().catch(e => { console.error(e); process.exit(1); });
