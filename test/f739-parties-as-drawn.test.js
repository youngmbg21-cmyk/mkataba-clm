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
  test('ten at a time, the cap said; Show more draws the next ten', () => {
    assert.equal(doc.querySelectorAll('#cu-tbody [data-cu-cust]').length, 10);
    assert.equal(doc.querySelector('.cu-foot .lc-shown').textContent.trim(), '10 of 13 shown ·');
    assert.ok(doc.querySelector('.cu-foot [data-lc-more="customers"]'));
    sb.LC_PAGES.customers.more();
    assert.equal(doc.querySelectorAll('#cu-tbody [data-cu-cust]').length, 13);
    assert.equal(doc.querySelector('.cu-foot').textContent.trim(), '13 of 13 shown');
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
    assert.equal(doc.querySelector('[data-cu-cust="party 01 ltd"] td.cu-wait').textContent, 'Sara asked for an NDA with Party 01 Ltd · +1 more');
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
