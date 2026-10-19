'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f795 — PEOPLE, AS A TABLE (round 19 of the redesign, option 3 "The SAP way",
   the People scene; the owner's "build all the gaps", 18 Oct 2026, reverses
   the 13 Oct face cards; lane A2, js/views/directory.js)

   The real page on a real DOM, the Parties page's shared pieces loaded beside
   it (the find box, the boxes, Columns, the paged foot — one builder):
     (1) THE BAND: "People N", "<n> of ours · <n> at <n> parties"; each box's
         word above it — Name, email or party · Side · Party · Role in HaTi ·
         Stream; the find box says "Type to find"; no tab row, no A to Z edge
     (2) THE TABLE: Name · Side · Party or company · Job title · In HaTi ·
         Contracts · Email; "ours first, then theirs, by name", the reader
         first; "(you)"; an away colleague's "Away until <day>"; an absence a
         grey dash that still says what is missing
     (3) Side and Role in HaTi narrow; twelve at a time, "12 of N shown · Show
         more"; Columns hides a column
     (4) the page is named People in both books; a person from elsewhere
         (the Parties panel) is chosen and landed on (dirOpenPerson → landOn)
   RED AT THE PARENT (gaps/A1): a wall of face cards under tabs, no Side box,
   no Role in HaTi, no paging, named Directory.
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { JSDOM } = require('jsdom');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const BOOKS = require('../js/i18n.js').STRINGS;
const EN = BOOKS.en;
const fill = (s, v) => String(s).replace(/\{(\w+)\}/g, (m, k) => (v && v[k] != null ? v[k] : m));
const i18t = (k, v) => fill(EN[k] != null ? EN[k] : k, v);
const i18tn = (k, n, v) => fill(EN[k + (n === 1 ? '_one' : '_other')] != null ? EN[k + (n === 1 ? '_one' : '_other')] : k, v);

const USERS = [
  { id: 'a', name: 'Amina Otieno', role: 'admin', email: 'a@x.test', title: 'General Counsel' },
  { id: 'b', name: 'Jonas Berg', role: 'legal', email: 'b@x.test', title: 'Commercial lead' },
  { id: 'v', name: 'Vera Reader', role: 'viewer', email: 'v@x.test', title: '' },
  { id: 'z', name: 'Zed Mwangi', role: 'legal', email: 'z@x.test', title: 'Finance' },
];
function contracts(){
  const out = [];
  for (let i = 1; i <= 11; i++) out.push({ id: 'MK-' + i, name: 'Supply ' + i, counterparty: 'Party ' + String(i).padStart(2, '0') + ' Ltd', folder: i % 2 ? 'proc' : 'sales',
    status: 'Signed', counterpartyEmail: `buyer${i}@party${i}.co.ke`, counterpartyName: 'Buyer ' + String(i).padStart(2, '0'), owner: { id: 'a', name: 'Amina Otieno' } });
  return out;
}
function stage(o = {}){
  const dom = new JSDOM('<!doctype html><html><body><div id="content"></div></body></html>', { runScripts: 'outside-only', url: 'https://hati.test/' });
  const win = dom.window;
  const landed = [];
  const sb = {
    console, document: win.document, localStorage: win.localStorage, CSS: win.CSS,
    esc: s => String(s == null ? '' : s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch])),
    i18t, i18tn, roleName: r => ({ admin: 'Admin', legal: 'Editor', viewer: 'Viewer' }[r] || ''),
    getUsers: () => USERS, currentUser: () => o.me || USERS[2], isAdmin: () => false,
    state: { view: 'directory', settings: {}, contracts: contracts(), partyRecords: {} },
    FOLDERS: { proc: { name: 'Procurement' }, sales: { name: 'Sales' } },
    FIRST_PARTY: 'Highland Corporate Ltd',
    contractExpired: () => false, contractOwnerName: c => (c.owner && c.owner.name) || '',
    cuKeyOf: undefined, partiesTheirs: c => [{ id: 'py1', name: c.counterparty }], orgDirectory: () => [],
    todayISO: () => '2026-10-19', jlAwayOf: id => (id === 'b' ? { from: '2026-10-19', to: '2026-10-23' } : null), jlDayWord: () => 'Fri',
    icon: n => `<svg data-i="${n}"></svg>`, canEdit: () => true, API_MODE: () => false,
    landOn: (sel, opt) => { landed.push(sel); return Promise.resolve(null); },
    setView: v => { sb.state.view = v; sb.renderDirectory(); }, placeSave() {},
  };
  sb.window = sb; sb.self = sb;
  vm.createContext(sb);
  vm.runInContext(read('js/participants.js'), sb, { filename: 'participants.js' });
  vm.runInContext(read('js/views/customers.js'), sb, { filename: 'customers.js' });
  vm.runInContext(read('js/views/directory.js'), sb, { filename: 'directory.js' });
  return { sb, doc: win.document, landed };
}
const rowsOf = doc => [...doc.querySelectorAll('#dir-tbody [data-dir-row]')];
const nameOf = r => r.querySelector('.dir-name').textContent;

describe('f795 (1) the band as drawn', () => {
  const { sb, doc } = stage();
  sb.renderDirectory();
  test('"People N", and who is on whose side', () => {
    assert.match(doc.querySelector('#dir-page .cu-t').textContent, /^People\s*15$/);
    assert.equal(doc.querySelector('#dir-page .cu-hs').textContent, '4 of ours · 11 at 11 parties');
  });
  test('each box\'s word above it, the find box first, no tab row and no A to Z edge', () => {
    const fb = doc.querySelector('#dir-page .sap-band > .cu-fb');
    assert.ok(fb, 'the filters are the band\'s own row, under a hairline');
    assert.deepEqual([...fb.children].map(el => (el.querySelector('.reg-f-l, .cu-find-l') || {}).textContent), ['Name, email or party', 'Side', 'Party', 'Role in HaTi', 'Stream']);
    assert.equal(doc.getElementById('dir-q').getAttribute('placeholder'), 'Type to find');
    assert.equal(doc.querySelector('#dir-page [data-dir-tab], #dir-page .reg-views, #dir-page .dir-az'), null);
    assert.equal(doc.querySelector('select[data-dir-f="tab"]').value, 'all');
    assert.deepEqual([...doc.querySelector('select[data-dir-f="hati"]').options].map(x => x.textContent), ['Any', 'Admin', 'Editor', 'Viewer']);
  });
});

describe('f795 (2) the table as drawn', () => {
  const { sb, doc } = stage();
  sb.renderDirectory();
  test('the columns and the list\'s head', () => {
    assert.deepEqual([...doc.querySelectorAll('#dir-page thead th')].map(t => t.textContent), ['Name', 'Side', 'Party or company', 'Job title', 'In HaTi', 'Contracts', 'Email']);
    const t = doc.querySelector('.dir-card .ap-card-t');
    assert.equal(t.querySelector('.ap-card-n').textContent, '15');
    assert.equal(t.querySelector('.ap-card-m').textContent, 'ours first, then theirs, by name');
    assert.ok(doc.querySelector('.dir-card [data-lc-btn="directory"]'), 'Columns');
  });
  test('ours first — the reader first — then theirs, each by name', () => {
    const names = rowsOf(doc).map(nameOf);
    assert.deepEqual(names.slice(0, 5), ['Vera Reader', 'Amina Otieno', 'Jonas Berg', 'Zed Mwangi', 'Buyer 01']);
  });
  test('a row says it all: (you), side, party or company, title, role here, contracts, the address', () => {
    const r = rowsOf(doc);
    const cells = row => [...row.children].map(td => td.textContent.replace(/\s+/g, ' ').trim());
    assert.equal(JSON.stringify(cells(r[0])), JSON.stringify(['VRVera Reader (you)', 'Ours', 'Highland Corporate Ltd', '—', 'Viewer', '—', 'v@x.test']));
    assert.equal(JSON.stringify(cells(r[4])), JSON.stringify(['B0Buyer 01', 'Theirs', 'Party 01 Ltd', '—', '—', '1', 'buyer1@party1.co.ke']));
    assert.match(r[0].children[3].querySelector('.dir-none').getAttribute('title'), /title/i, 'a missing job title still says so, on the hover');
  });
  test('an away colleague wears "Away until <day>"', () => {
    const j = rowsOf(doc).find(r => nameOf(r) === 'Jonas Berg');
    assert.equal(j.querySelector('.dir-away').textContent, 'Away until Fri');
    assert.equal(rowsOf(doc).filter(r => r.querySelector('.dir-away')).length, 1);
  });
});

describe('f795 (3) the boxes narrow; twelve at a time; Columns', () => {
  test('Side and Role in HaTi', () => {
    const { sb, doc } = stage();
    sb.dirPlacePut({ tab: 'theirs' }); sb.renderDirectory();
    assert.ok(rowsOf(doc).every(r => r.children[1].textContent === 'Theirs'));
    sb.dirPlacePut({ tab: 'all', hati: 'legal' }); sb.renderDirectory();
    assert.deepEqual(rowsOf(doc).map(nameOf), ['Jonas Berg', 'Zed Mwangi']);
  });
  test('twelve at a time, the cap said; Show more draws the rest', () => {
    const { sb, doc } = stage();
    sb.renderDirectory();
    assert.equal(rowsOf(doc).length, 12);
    assert.equal(doc.querySelector('.dir-cardfoot .lc-shown').textContent.trim(), '12 of 15 shown ·');
    sb.LC_PAGES.directory.more();
    assert.equal(rowsOf(doc).length, 15);
  });
  test('Columns hides a column, for this reader', () => {
    const { sb, doc } = stage();
    sb.localStorage.setItem('hati.v1.cols.directory', JSON.stringify({ hidden: ['email', 'side'] }));
    sb.renderDirectory();
    assert.deepEqual([...doc.querySelectorAll('#dir-page thead th')].map(t => t.textContent), ['Name', 'Party or company', 'Job title', 'In HaTi', 'Contracts']);
  });
});

describe('f795 (4) the page\'s name, and a person landed on from elsewhere', () => {
  test('People in both books', () => {
    assert.equal(BOOKS.en.nav_directory, 'People');
    assert.equal(BOOKS.sv.nav_directory, 'Personer');
    for (const k of ['dir_find_type', 'dir_f_side', 'dir_f_hati', 'dir_side_ours', 'dir_side_theirs', 'dir_col_side', 'dir_col_party', 'dir_col_hati', 'dir_col_contracts', 'dir_list_sort', 'dir_head_theirs_one', 'dir_head_theirs_other', 'dir_you_paren'])
      for (const lang of ['en', 'sv']) assert.ok(BOOKS[lang][k], k + ' ' + lang);
  });
  test('dirOpenPerson clears what would hide them, draws down to them, chooses and lands on their row', () => {
    const { sb, doc, landed } = stage();
    sb.dirPlacePut({ tab: 'ours', q: 'zzz' });
    const key = sb.dirBook().find(p => p.name === 'Buyer 11').key;
    sb.state.view = 'customers';
    sb.dirOpenPerson(key);
    assert.equal(sb.state.view, 'directory');
    assert.equal(JSON.stringify(sb.dirPlace()), JSON.stringify({ tab: 'all', q: '', party: 'all', hati: 'all', stream: 'all' }));
    assert.ok(rowsOf(doc).some(r => r.getAttribute('data-dir-row') === key), 'the row is drawn, past the first twelve');
    assert.equal(landed.length, 1);
    assert.match(landed[0], /#dir-tbody \[data-dir-row="e:buyer11@party11\.co\.ke"\]/);
  });
});
