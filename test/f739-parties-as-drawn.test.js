'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f739 — PARTIES, AS DRAWN (round 19 of the redesign, option 3 "The SAP way";
   the owner's "build all the gaps", 18 Oct 2026; lane A2,
   js/views/customers.js)

   The real page on a real DOM over a small book:
     (1) THE BAND: each box's word above it (outside .reg-tabbar, so the band's
         labelled-box rule dresses it) — Party name · Status · Stream · Owner ·
         NDA — under a hairline; the find box says "Name or city"; Status opens
         on Live and lists Live · Ended · All; the head counts every party
     (2) THE LIST: "Parties N · live · sorted by name", the columns as drawn
         (City after the party), "N agreements · <stream>", ten at a time with
         "10 of N shown · Show more"; Columns hides and orders, kept per reader
     (3) A PARTY'S CITY: read from the one home (state.partyRecords), said in
         its column, found by the find box; a party's standing (Live/Ended) is
         its own, so a live party still counts what has ended with it
     (4) THE SUGGESTION READ OFF THE PARTIES CLAUSE: an address after the
         party's name, its city the last part that is a place — never a box, a
         number or a country; the party's own address row first
     (5) THE PANEL'S PIECES: an agreement's line (round, value, ends, secret
         until), the owner "(you)", "with us since", the party's short name,
         None said whole, the people at the party and what they do
     (6) a colleague's request about the party waits on the reader who may
         draft — never their own, never one somebody else holds
   RED AT THE PARENT (gaps/A1): labels inside, no City, no paging, no Columns,
   Status on All, none of the readings.
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { JSDOM } = require('jsdom');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const EN = require('../js/i18n.js').STRINGS.en;
const fill = (s, v) => String(s).replace(/\{(\w+)\}/g, (m, k) => (v && v[k] != null ? v[k] : m));
const i18t = (k, v) => fill(EN[k] != null ? EN[k] : k, v);
const i18tn = (k, n, v) => fill(EN[k + (n === 1 ? '_one' : '_other')] != null ? EN[k + (n === 1 ? '_one' : '_other')] : k, v);

const ME = { id: 'u1', name: 'Amina Otieno', role: 'admin' };
const C = (id, name, cp, folder, value, status, extra) => Object.assign({ id, contractNo: id, name, counterparty: cp, folder, value, status, expiry: '2027-06-30',
  metadata: { value, currency: 'KES' }, owner: { id: 'u1', name: 'Amina Otieno' } }, extra || {});
function book(){
  const out = [];
  for (let i = 1; i <= 12; i++) out.push(C('MK-P' + i, 'Supply ' + i, 'Party ' + String(i).padStart(2, '0') + ' Ltd', i % 2 ? 'proc' : 'sales', 1000000 * i, 'Signed'));
  out.push(C('MK-KF1', 'Transport agreement', 'Kenya Freight Ltd', 'proc', 2400000, 'Signed', { fields: { effDate: '2024-03-01' } }));
  out.push(C('MK-KF0', 'Old haulage', 'Kenya Freight Ltd', 'proc', 500000, 'Signed', { expiry: '2020-01-31', metadata: { expiryDate: '2020-01-31', value: 500000, currency: 'KES' } }));
  out.push(C('MK-RT', 'Old supply', 'Retired Supplies Ltd', 'proc', 50000, 'Signed', { expiry: '2020-01-31', metadata: { expiryDate: '2020-01-31', value: 50000, currency: 'KES' } }));
  return out;
}
function stage(o = {}){
  const dom = new JSDOM('<!doctype html><html><body><div id="content"></div></body></html>', { runScripts: 'outside-only', url: 'https://hati.test/' });
  const win = dom.window;
  const sb = {
    console, document: win.document, localStorage: win.localStorage, CSS: win.CSS, Event: win.Event,
    esc: s => String(s == null ? '' : s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch])),
    i18t, i18tn,
    state: { view: 'customers', contracts: o.contracts || book(), partyRecords: o.records || {}, settings: {} },
    FOLDERS: { proc: { name: 'Procurement' }, sales: { name: 'Sales' } },
    contractExpired: c => !!(c.expiry && c.expiry < '2026-10-19' && c.status === 'Signed'),
    contractOwnerName: c => (c.owner && c.owner.name) || '',
    todayISO: () => '2026-10-19',
    fmtMoneyShort: v => 'KES ' + (v / 1e6).toFixed(1) + 'M', fmtMoneyShortOf: c => 'KES ' + (c.value / 1e6).toFixed(1) + 'M',
    regDotDate: d => d, canEdit: () => o.canEdit !== false, currentUser: () => o.me || ME, API_MODE: () => false,
    contractRef: c => c.contractNo || c.id, contractStatusDotHtml: c => `<span class="reg-stg">${c.status}</span>`,
    ndaIs: c => c.category === 'nda', ndaClean: n => n || null, ndaDirWords: d => d === 'mutual' ? 'Both sides (mutual)' : 'One way',
    igLineRound: c => (c.negotiation && c.negotiation.round) || 0,
    intakeQueue: () => o.requests || [],
    contractParties: c => c.parties || [], contractPlainText: c => c.text || '',
    icon: n => `<svg data-i="${n}"></svg>`,
  };
  sb.window = sb; sb.self = sb;
  vm.createContext(sb);
  vm.runInContext(read('js/views/listhead.js'), sb, { filename: 'listhead.js' });
  vm.runInContext(read('js/views/customers.js'), sb, { filename: 'customers.js' });
  return { sb, doc: win.document };
}

describe('f739 (1) the band, each word above its box', () => {
  const { sb, doc } = stage();
  sb.renderCustomers();
  test('the five boxes, their words, outside the tab row so the word sits above', () => {
    const fb = doc.querySelector('.cu-page .sap-band > .cu-fb');
    assert.ok(fb, 'the filters are the band\'s own row (not inside .reg-tabbar, whose rule puts the word inside)');
    assert.equal(doc.querySelector('.cu-page .reg-tabbar'), null);
    const words = [...fb.children].map(el => (el.querySelector('.reg-f-l, .cu-find-l') || {}).textContent);
    assert.deepEqual(words, ['Party name', 'Status', 'Stream', 'Owner', 'NDA']);
    assert.equal(doc.getElementById('cu-q').getAttribute('placeholder'), 'Name or city');
    assert.ok(fb.querySelector('.cu-find-box svg'), 'the find box wears its glass');
  });
  test('Status opens on Live and lists Live · Ended · All', () => {
    const s = doc.querySelector('select[data-cu-f="status"]');
    assert.equal(s.value, 'live');
    assert.deepEqual([...s.options].map(x => x.value), ['live', 'ended', 'all']);
    assert.ok(!s.closest('.reg-chip').classList.contains('on'), 'Live is the box at rest, not a narrowing');
  });
  test('the head counts every party, and says the money on paper with live parties', () => {
    assert.match(doc.querySelector('.cu-t').textContent, /^Parties\s*14$/, 'the twelve, Kenya Freight and the party everything with has ended');
    assert.match(doc.querySelector('.cu-hs').textContent, /on paper with live parties$/);
    assert.ok(doc.querySelector('[data-cu-draft]'));
  });
});

describe('f739 (2) the list as drawn', () => {
  const { sb, doc } = stage();
  sb.renderCustomers();
  test('"Parties N · live · sorted by name" and Columns', () => {
    const t = doc.querySelector('.cu-card .ap-card-t');
    assert.equal(t.querySelector('.ap-card-n.is-pill').textContent, '13');
    assert.equal(t.querySelector('.ap-card-m').textContent, 'live · sorted by name');
    assert.ok(doc.querySelector('.cu-card [data-lc-btn="customers"]'));
  });
  test('the columns as drawn, City after the party', () => {
    assert.deepEqual([...doc.querySelectorAll('.cu-table thead th')].map(t => t.textContent), ['Party', 'City', 'Live', 'Ended', 'On paper', 'Next to end', 'Waiting on you', 'NDA']);
    const kf = doc.querySelector('[data-cu-cust="kenya freight ltd"]');
    assert.equal(kf.querySelector('.cu-ps').textContent, '2 agreements · Procurement');
    assert.equal(doc.querySelector('[data-cu-cust="party 01 ltd"] .cu-ps').textContent, '1 agreement · Procurement');
  });
  /* RE-POINTED 21 Oct 2026 (Part 8, the list head the Legora way): the foot
     is the list head's one foot (lhFootHtml) — "1–10 of 13 · Show 3 more",
     a live region — and Show more is the seat's own (LH_PAGES), not Columns' */
  test('ten at a time, the cap said; Show more draws the next ten', () => {
    assert.equal(doc.querySelectorAll('#cu-tbody [data-cu-cust]').length, 10);
    assert.equal(doc.querySelector('.cu-foot [data-lh-shown]').textContent.trim(), '1–10 of 13');
    assert.equal(doc.querySelector('.cu-foot [data-lh-more="customers"]').textContent.trim(), 'Show 3 more');
    assert.equal(doc.querySelector('.cu-foot [data-lh-foot="customers"]').getAttribute('role'), 'status');
    sb.LH_PAGES.customers.more();
    assert.equal(doc.querySelectorAll('#cu-tbody [data-cu-cust]').length, 13);
    assert.equal(doc.querySelector('.cu-foot').textContent.trim(), '1–13 of 13');
  });
  test('Columns: a hidden column leaves the list, an order is kept, per reader', () => {
    sb.localStorage.setItem('hati.v1.cols.customers', JSON.stringify({ order: ['nda', 'city'], hidden: ['paper'] }));
    sb.renderCustomers();
    const th = [...doc.querySelectorAll('.cu-table thead th')].map(t => t.textContent);
    assert.deepEqual(th, ['Party', 'NDA', 'City', 'Live', 'Ended', 'Next to end', 'Waiting on you']);
    assert.equal(doc.querySelector('#cu-tbody tr').children.length, th.length, 'every row draws the columns the head does');
    sb.localStorage.removeItem('hati.v1.cols.customers');
  });
});

describe('f739 (3) a party\'s city, from the one home', () => {
  const { sb, doc } = stage({ records: { 'kenya freight ltd': { name: 'Kenya Freight Ltd', city: 'Kisumu', orgNo: 'PVT-1' } } });
  sb.renderCustomers();
  test('the City column says it; a party without one says a dash', () => {
    assert.equal(doc.querySelector('[data-cu-cust="kenya freight ltd"] td.cu-city').textContent, 'Kisumu');
    assert.equal(doc.querySelector('[data-cu-cust="party 01 ltd"] td.cu-city').textContent, '—');
    assert.equal(sb.partyCityOf('kenya freight ltd'), 'Kisumu');
    assert.equal(sb.partyOrgNoOf('kenya freight ltd'), 'PVT-1');
  });
  test('the find box finds a party by its city', () => {
    sb.cuPlacePut({ q: 'kisu' });
    sb.renderCustomers();
    assert.deepEqual([...doc.querySelectorAll('#cu-tbody [data-cu-cust]')].map(r => r.getAttribute('data-cu-cust')), ['kenya freight ltd']);
    sb.cuPlacePut({ q: '' });
  });
  test('a live party still counts what has ended with it; Ended lists the parties everything with has ended', () => {
    sb.renderCustomers();
    const kf = doc.querySelector('[data-cu-cust="kenya freight ltd"]');
    const cells = [...kf.children].map(td => td.textContent.trim());
    assert.equal(cells[2], '1', 'one live');
    assert.equal(cells[3], '1', 'one ended, still counted under Live');
    assert.equal(doc.querySelector('[data-cu-cust="retired supplies ltd"]'), null, 'a party everything with has ended is off Live');
    sb.cuPlacePut({ status: 'ended' });
    sb.renderCustomers();
    assert.deepEqual([...doc.querySelectorAll('#cu-tbody [data-cu-cust]')].map(r => r.getAttribute('data-cu-cust')), ['retired supplies ltd']);
    assert.equal(doc.querySelector('.cu-card .ap-card-m').textContent, 'ended · sorted by name');
    sb.cuPlacePut({});
    assert.equal(sb.cuPlace().status, 'live', 'a refresh that kept no status opens on Live');
  });
});

describe('f739 (4) the suggestion read off the parties clause', () => {
  const { sb } = stage();
  test('an address\'s city is its last part that is a place', () => {
    assert.equal(sb.cuCityFromAddress('P.O. Box 30, Kisumu, Kenya'), 'Kisumu');
    assert.equal(sb.cuCityFromAddress('Mombasa Road, Nairobi 00100'), 'Nairobi');
    assert.equal(sb.cuCityFromAddress('Kungsgatan 5, 411 19 Gothenburg, Sweden'), 'Gothenburg');
    assert.equal(sb.cuCityFromAddress('P.O. Box 30'), '', 'a box alone names no city');
    assert.equal(sb.cuCityFromAddress('Kenya'), '', 'a country alone is no city');
  });
  test('the address a sentence gives right after the name, up to its bracket or "and"', () => {
    assert.equal(sb.cuAddrAfterName(' Ltd of P.O. Box 30, Kisumu, Kenya (the "Supplier") and'), 'P.O. Box 30, Kisumu, Kenya');
    assert.equal(sb.cuAddrAfterName(', whose email for notices is a@b.co. Article 1 Payment'), '', 'nothing said, nothing offered');
    assert.equal(sb.cuAddrAfterName(' Limited, having its registered office at Mombasa Road, Nairobi 00100; hereinafter'), 'Mombasa Road, Nairobi 00100');
  });
  test('the party\'s own address row first, then the wording; nothing invented where neither says', () => {
    const { sb: s2 } = stage({ contracts: [C('MK-1', 'Supply', 'Kabras Sugar Ltd', 'proc', 1, 'Signed', { text: 'This agreement is made between Highland Ltd of P.O. Box 1, Nairobi and Kabras Sugar Ltd of P.O. Box 30, Kisumu, Kenya (the "Supplier").' })] });
    const w = s2.partyCitySuggest('kabras sugar ltd');
    assert.equal(w.city, 'Kisumu'); assert.equal(w.ref, 'MK-1'); assert.match(w.addr, /P\.O\. Box 30, Kisumu, Kenya/);
    const { sb: s3 } = stage({ contracts: [C('MK-2', 'Supply', 'Kabras Sugar Ltd', 'proc', 1, 'Signed', { parties: [{ side: 'theirs', name: 'Kabras Sugar Ltd', address: 'Kakamega Road, Mumias, Kenya' }], text: 'Kabras Sugar Ltd of Kisumu' })] });
    assert.equal(s3.partyCitySuggest('kabras sugar ltd').city, 'Mumias');
    const { sb: s4 } = stage({ contracts: [C('MK-3', 'Supply', 'Kabras Sugar Ltd', 'proc', 1, 'Signed', { text: 'Kabras Sugar Ltd shall deliver.' })] });
    assert.equal(s4.partyCitySuggest('kabras sugar ltd'), null);
  });
  test('the suggestion fills the box only on its press; Save is the one writer, never the reading', () => {
    const src = read('js/views/customers.js');
    const fn = src.slice(src.indexOf('function partyCitySuggest'), src.indexOf('/* THE ONE DOOR'));
    assert.ok(!/partyRecordSet|api\(/.test(fn), 'reading the clause writes nothing');
    assert.match(src, /data-cu-pr-use[\s\S]*f\.value = use\.getAttribute\('data-cu-pr-use'\)/);
  });
});

describe('f739 (5) the panel\'s pieces', () => {
  const nda = C('MK-N', 'Mutual NDA', 'Kenya Freight Ltd', 'proc', 0, 'Signed', { category: 'nda', nda: { dir: 'mutual', ends: '2028-02-29', who: 'Amina Otieno' } });
  const nego = C('MK-G', 'Master services agreement', 'Kenya Freight Ltd', 'proc', 4200000, 'Under Review', { negotiation: { round: 2 } });
  const { sb } = stage({ contracts: book().concat([nda, nego]) });
  test('an agreement\'s line: round, value, ends, secret until', () => {
    assert.equal(sb.cuAgreementSub(nego), 'MK-G · round 2 · KES 4.2M');
    assert.equal(sb.cuAgreementSub(sb.state.contracts.find(c => c.id === 'MK-KF1')), 'MK-KF1 · KES 2.4M · ends 2027-06-30');
    assert.equal(sb.cuAgreementSub(nda), 'MK-N · secret until 2028-02-29');
  });
  test('the owner is "(you)"; "with us since"; the short name leaves the legal form off', () => {
    const v = sb.cuView(sb.cuCustomerOf('kenya freight ltd'));
    assert.equal(sb.cuOwnerSay(v.items), 'Amina Otieno (you)');
    assert.equal(sb.cuSinceOf(v.items), '2024-03-01');
    assert.equal(sb.cuShortName('Kenya Freight Ltd'), 'Kenya Freight');
    assert.equal(sb.cuShortName('Nordvik Logistik AB'), 'Nordvik Logistik');
    assert.equal(sb.cuShortName('Kettle & Co'), 'Kettle & Co');
  });
  test('the NDA said as drawn, and None said whole', () => {
    const v = sb.cuView(sb.cuCustomerOf('kenya freight ltd'));
    const m = sb.cuNdaMap();
    const html = (() => { const d = sb.document.createElement('div'); d.innerHTML = vm.runInContext('cuNdaFactHtml', sb)(sb.cuNdaOf(v.key, m), v.name); return d.textContent; })();
    assert.match(html, /^Both sides \(mutual\) · secret until 2028-02-29 · confirmed by you Open the NDA ›$/);
    const none = (() => { const d = sb.document.createElement('div'); d.innerHTML = vm.runInContext('cuNdaFactHtml', sb)({ state: 'none' }, 'Party 01 Ltd'); return d.textContent; })();
    assert.equal(none, 'None — no NDA with Party 01 Ltd, signed or in draft');
  });
  test('the people at the party and what they do', () => {
    const v = sb.cuView(sb.cuCustomerOf('kenya freight ltd'));
    const people = [{ key: 'e:h', name: 'Henry Dalu', title: 'Head of procurement', contracts: ['MK-G'], roleOn: () => ['negotiate'] },
      { key: 'e:s', name: 'Sofia Lunani', title: '', contracts: ['MK-KF1', 'MK-G'], roleOn: () => ['cpsign'] },
      { key: 'e:o', name: 'Olive Kettle', title: 'Director', contracts: [], roleOn: () => [] }];
    const d = sb.document.createElement('div'); d.innerHTML = sb.cuPanelPeopleHtml(people, v);
    const rows = [...d.querySelectorAll('[data-cu-pp]')].map(r => [...r.querySelectorAll('.cu-pp-av, b, .cu-li-b span')].map(x => x.textContent).join(' | '));
    assert.equal(JSON.stringify(rows), JSON.stringify(['HD | Henry Dalu | Head of procurement · negotiates MK-G', 'SL | Sofia Lunani | signs for Kenya Freight · +1 more', 'OK | Olive Kettle | Director · not on a contract yet']));
  });
});

describe('f739 (6) a colleague\'s request about the party waits on you', () => {
  const R = (id, by, extra) => Object.assign({ id, title: 'an NDA with Party 01 Ltd', counterparty: 'Party 01 Ltd', folder: 'proc', status: 'open', by: { id: by, name: by === 'u1' ? 'Amina Otieno' : 'Sara Nyström' }, createdAt: '2026-10-18T09:00:00Z' }, extra || {});
  test('open and nobody holds it, raised by a colleague: it waits on you; your own, or one held by another, does not', () => {
    const { sb, doc } = stage({ requests: [R('REQ-1', 'u2'), R('REQ-2', 'u1'), R('REQ-3', 'u2', { assignee: { id: 'u9', name: 'Other' } }), R('REQ-4', 'u2', { status: 'accepted', assignee: { id: 'u1', name: 'Amina' } })] });
    assert.equal(JSON.stringify(sb.cuRequestsOf('party 01 ltd').map(x => x.r.id)), JSON.stringify(['REQ-1', 'REQ-4']));
    sb.renderCustomers();
    /* RE-POINTED 19 Oct 2026 (lane A2, check #1): the first whole, the rest on a quiet second line */
    assert.equal(doc.querySelector('[data-cu-cust="party 01 ltd"] td.cu-wait .cu-wait-t').textContent, 'Sara asked for an NDA with Party 01 Ltd');
    assert.equal(doc.querySelector('[data-cu-cust="party 01 ltd"] td.cu-wait .cu-wait-more').textContent, '+1 more');
  });
  test('a reader who may not draft is not asked', () => {
    const { sb } = stage({ canEdit: false, requests: [R('REQ-1', 'u2')] });
    assert.equal(sb.cuRequestsOf('party 01 ltd').length, 0);
  });
  test('its door lands on the request, lit (LAND ON IT)', () => {
    const src = read('js/views/customers.js');
    assert.match(src, /if \(kind === 'request'\)\{ if \(typeof intakeGoTo === 'function'\) intakeGoTo\(id\); if \(typeof jlLand === 'function'\) jlLand\('row', id\); return; \}/);
  });
});

/* ═══ (7) CHECK #1'S DIFFERENCES, BUILT (lane A2's second pass, 19 Oct 2026) ═══
   Against round 19 as drawn: their redlines counted ("2 redlines · 4 days",
   "Answer 2 redlines"); "An approval, for Jonas" said alike in the panel; the
   Waiting column whole, any more on a second line; a fact with nothing in it
   left out of the panel (Kettle & Co); Jambo says the page from the list's
   own count; People's Party door lands on Parties, the party lit; the NDA and
   an agreement land lit; the New agreement form says the party it carries.
   RED at the first pass (3ecb408). */
describe('f739 (7) check #1\'s differences, built', () => {
  const panelOf = sb => { let got = null; sb.insPaintPanel = o => { got = o; };
    sb.insRowsHtml = list => list.map(f => `<div data-row="${f.k}">${f.label}|${f.v}</div>`).join('');
    sb.insSecHtml = (t, n, b, cls) => `<section class="${cls || ''}"><h3>${t}<span class="n">${n}</span></h3>${b}</section>`;
    return () => got; };
  test('7a their redlines are counted: the column "2 redlines · 4 days", the panel "Answer 2 redlines"', () => {
    const { sb } = stage();
    sb.negoMoveSay = () => ({ k: 'you', n: 2 });
    sb.regNegoCols = () => ({ waiting: '4 days' });
    const x = { c: { id: 'MK-1', name: 'Master services agreement' }, it: { kind: 'move' } };
    assert.equal(sb.cuNeedShort(x), '2 redlines · 4 days');
    assert.equal(sb.cuNeedTitle(x), 'Answer 2 redlines');
    sb.negoMoveSay = () => ({ k: 'you', why: 'decided', n: 2 });
    assert.equal(sb.cuNeedTitle(x), 'Our move in a negotiation', 'a move for another reason keeps its own words');
    const html = sb.cuPanelNeedsHtml([x]);
    assert.match(html, />Master services agreement · waiting 4 days<\/span>/);
  });
  test('7b an approval answered for an away colleague reads alike in the column and the panel', () => {
    const { sb } = stage();
    sb.apForWho = () => ({ name: 'Jonas Berg' });
    const x = { c: { id: 'MK-AP' }, it: { kind: 'approval' } };
    assert.equal(sb.cuNeedShort(x), 'an approval, for Jonas');
    assert.equal(sb.cuNeedTitle(x), 'An approval, for Jonas');
  });
  test('7c the Waiting column says the first whole, the rest on a quiet second line, and has the room', () => {
    const { sb } = stage();
    const td = sb.cuCellHtml('waiting', { key: 'k' }, { needs: [{ c: { id: 'A' }, it: { kind: 'details' } }, { c: { id: 'B' }, it: { kind: 'details' } }] }, new Map());
    assert.match(td, /<span class="cu-wait-t">[^<]+<\/span><span class="cu-wait-more">\+1 more<\/span>/);
    const w = sb.cuColDefs().find(c => c.k === 'waiting').w;
    assert.ok(w >= 184, `the column is ${w}px`);
  });
  test('7d a fact with nothing in it is left out of the panel, as drawn for Kettle & Co', () => {
    const { sb, doc } = stage();
    const got = panelOf(sb);
    sb.insPick = (seat, ids) => 'retired supplies ltd'; sb.insMarkRow = () => {}; sb.insListWire = () => {};
    sb.cuPlacePut({ status: 'all' }); sb.renderCustomers();
    const tb = doc.createElement('tbody'); tb.innerHTML = '<tr data-cu-cust="retired supplies ltd"></tr>';
    sb.cuPaintCustomerPanel(tb);
    const o = got();
    assert.ok(o && o.body, 'the panel painted');
    assert.doesNotMatch(o.body, /data-row="org"/, 'no Organisation no. row when none is on file');
    assert.doesNotMatch(o.body, /data-row="next"/, 'no Next to end row when nothing runs');
    assert.match(o.body, /data-row="owner"[\s\S]*data-row="live"[\s\S]*data-row="nda"/);
    assert.equal(o.jlSay, sb.cuSay, 'Jambo\'s own words for the page ride the panel');
  });
  test('7e Jambo says the page from the list\'s own count, with the page\'s own boxes as chips', () => {
    const { sb } = stage();
    sb.cuPlacePut({ status: 'all' });
    const say = sb.cuSay();
    assert.match(say.lines[0], /^<b>14 parties on this list<\/b>: 13 live\.$/);
    assert.ok(say.lines.some(l => /13 live parties have no NDA\./.test(l)));
    assert.equal(say.chips.map(c => c.label).join('|'), 'no NDA');
    say.chips[0].run();
    assert.equal(sb.cuPlace().nda, 'none');
  });
  test('7f People\'s Party door lands on Parties, the party chosen and lit', () => {
    const { sb } = stage();
    const landed = []; let chosen = null;
    sb.landOn = t => { landed.push(t); return Promise.resolve(null); };
    sb.insSelect = (seat, k) => { chosen = [seat, k]; };
    sb.cuPlacePut({ nda: 'none', q: 'zzz', status: 'live' });
    sb.cuSelectParty('party 12 ltd');
    assert.deepEqual(chosen, ['customers', 'party 12 ltd']);
    assert.equal(sb.cuPlace().q, ''); assert.equal(sb.cuPlace().nda, 'all'); assert.equal(sb.cuPlace().status, 'all');
    assert.equal(landed[0], '#cu-tbody [data-cu-cust="party 12 ltd"]');
  });
  test('7g the NDA lands on its "Secret until" figure; an agreement on Home\'s paper (LAND ON IT)', () => {
    const { sb } = stage();
    const landed = []; const opened = [];
    sb.landOn = t => { landed.push(t); return Promise.resolve(null); };
    sb.hbStripBring = () => true;
    sb.dirOpenContract = id => opened.push(id);
    sb.cuOpenNda('MK-KF2');
    assert.equal(landed.length, 1);
    assert.match(read('js/views/customers.js'), /\[data-bs-kpi="value"\]/);
    sb.cuOpenAgreement('MK-KF1');
    assert.deepEqual(opened, ['MK-KF1']);
  });
  test('7h the New agreement form says the party it carries, in both books', () => {
    const W = read('js/wizard.js');
    assert.match(W, /i18t\('na_sub_with',\{party:String\(o\.prefill\.counterparty\)\.trim\(\)\}\)/);
    const B = require('../js/i18n.js').STRINGS;
    assert.ok(B.en.na_sub_with && B.sv.na_sub_with);
    for (const k of ['cu_need_answer_redlines_one', 'cu_need_answer_redlines_other', 'cu_need_approval_for_cap', 'cu_need_waiting', 'cu_say_one', 'cu_say_other', 'cu_say_live',
      'cu_say_waiting_one', 'cu_say_waiting_other', 'cu_say_no_nda_one', 'cu_say_no_nda_other', 'cu_say_chip_no_nda', 'cu_say_chip_all'])
      assert.ok(B.en[k] && B.sv[k], k + ' in both books');
  });
  /* RE-POINTED 21 Oct 2026 (Chambers): a count beside a head is a plain number —
     Parties and People draw the section count every panel draws, no pill of their own. */
  test('7i a section\'s count is the plain number every panel draws, on Parties and People too', () => {
    const src = read('js/views/customers.js').replace(/\/\*[\s\S]*?\*\//g, '');
    assert.doesNotMatch(src, /\.ins-sec h3 \.n\{[^}]*(border-radius|background)/);
  });
});

/* ═══ (8) CHECK #2'S DIFFERENCES, BUILT (lane A2, 19 Oct 2026) ═══
   "3 details to fill in" as drawn; the Waiting words regular weight and
   never cut (two lines at most, Swedish too); Open party and Open on
   Explorer land lit; an approval in the party's panel lands on its row on
   Approvals, as the person's panel does; a party with nothing live lists no
   Agreements, and where a colleague's request about them waits it offers no
   second "Draft an agreement with …"; the panel's doors at their own width.
   RED at the first fix (cdc5051). */
describe('f739 (8) check #2\'s differences, built', () => {
  const panelOf = sb => { let got = null; sb.insPaintPanel = o => { got = o; };
    sb.insRowsHtml = list => list.map(f => `<div data-row="${f.k}">${f.label}|${f.v}</div>`).join('');
    sb.insSecHtml = (t, n, b, cls) => `<section class="${cls || ''}"><h3>${t}<span class="n">${n}</span></h3>${b}</section>`;
    sb.insMarkRow = () => {}; sb.insListWire = () => {};
    return () => got; };
  test('8a details read as drawn: "3 details to fill in"', () => {
    const { sb } = stage();
    assert.equal(sb.cuNeedShort({ c: { id: 'A' }, it: { kind: 'details', n: 3 } }), '3 details to fill in');
    assert.equal(sb.cuNeedShort({ c: { id: 'A' }, it: { kind: 'details', n: 1 } }), '1 detail to fill in');
  });
  test('8b the Waiting words: regular weight, at most two lines, never an ellipsis', () => {
    const src = read('js/views/customers.js');
    assert.match(src, /\.cu-table td\.cu-wait\.amber,\.cu-table td\.cu-wait\.ruby\{font-weight:var\(--w-body\);\}/);
    assert.match(src, /\.cu-wait-t\{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden;white-space:normal;/);
  });
  test('8c Open party and Open on Explorer land lit', () => {
    const src = read('js/views/customers.js');
    const f = s => { const i = src.indexOf('function ' + s + '('); return src.slice(i, src.indexOf('\n}', i)); };
    assert.match(f('cuOpenCustomer'), /jlLand\('list'\)/);
    assert.match(f('cuOpenExplorer'), /landOn\(\(\) => \{ const l = \(intel\.lenses \|\| \[\]\)\.find\(x => x\.label === v\.name\);[\s\S]*data-lens-hover/);
  });
  test('8d an approval in the party\'s panel lands on its row on Approvals (the person panel\'s door)', () => {
    const { sb } = stage();
    const went = [];
    sb.dirWaitGo = (k, id) => went.push(k + ':' + id);
    sb.needsYouGo = () => went.push('needsYouGo');
    sb.cuNeedGo('approval', 'MK-AP1');
    assert.equal(went.join(','), 'approval:MK-AP1');
  });
  test('8e a party with nothing live: no Agreements list; a waiting request is the one way to draft', () => {
    const { sb, doc } = stage({ requests: [{ id: 'REQ-9', title: 'an NDA', counterparty: 'Retired Supplies Ltd', folder: 'proc', status: 'open', by: { id: 'u2', name: 'Sara Nyström' }, createdAt: '2026-10-18T09:00:00Z' }] });
    const got = panelOf(sb);
    sb.insPick = () => 'retired supplies ltd';
    sb.cuPlacePut({ status: 'all' }); sb.renderCustomers();
    const tb = doc.createElement('tbody'); tb.innerHTML = '<tr data-cu-cust="retired supplies ltd"></tr>';
    sb.cuPaintCustomerPanel(tb);
    const o = got();
    assert.doesNotMatch(o.body, /cu-ags/);
    assert.doesNotMatch(o.body, /data-cu-draft-with/);
    assert.match(o.body, /data-cu-need="request"/);
    sb.insPick = () => 'kenya freight ltd';
    tb.innerHTML = '<tr data-cu-cust="kenya freight ltd"></tr>';
    sb.cuPaintCustomerPanel(tb);
    assert.match(got().body, /cu-ags[\s\S]*data-cu-draft-with/, 'a live party keeps both');
  });
  test('8f the panel\'s doors stand at their own width on Parties and People', () => {
    assert.match(read('js/views/customers.js'), /:is\(\.cu-page,\.dir-page\) \.ins-acts \.ins-lead\{flex:0 1 auto;\}/);
  });
});
