/* ============================================================
   f669 — THE DIRECTORY, FACES (owner picked it 13 Oct 2026)

   Everyone HaTi deals with, inside and outside, as a wall of contact cards.
   A READING, nothing filed: the roster, every contract's people list (the
   one address book for the other side, our own rows, the owner, who worked
   on it) and the admin's imported list, joined by email address.

   What this file pins:
     · one person is one address across contracts, with every role they hold
       and every contract they are named on; two spellings of a party are one
       party (the Parties page's own key); an archived contract is off the book
     · an imported contact nobody has named is "Not on a contract"; one that
       matches lends a job title
     · the tabs, the find box and the three filters, and that the number on a
       tab is the rows behind it
     · the wall as drawn: a card per person, the one link an address, the
       A to Z edge with a dead letter dimmed and saying so
     · the place a refresh puts back, the doors, both books, the brain, the
       Parties panel's door, and the phone keeping its People screen
   ============================================================ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { JSDOM } = require('jsdom');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

const USERS = [
  { id: 'a', name: 'Amina Otieno', role: 'admin', email: 'a@x.test', title: 'General Counsel' },
  { id: 'b', name: 'Brian Odhiambo', role: 'legal', email: 'b@x.test', title: 'Procurement lead' },
  { id: 'v', name: 'Vera Reader', role: 'viewer', email: 'v@x.test', title: '' },
];
const CONTRACTS = () => [
  { id: 'MK-1', name: 'Supply agreement', counterparty: 'Naivas Ltd', counterpartyEmail: 'wanjiru@naivas.co.ke', counterpartyName: 'Wanjiru Kamau',
    folder: 'proc', status: 'Signed', owner: { id: 'a', name: 'Amina Otieno' },
    participants: [{ id: 'p1', name: 'Peter Mwangi', email: 'peter@naivas.co.ke', role: 'negotiate', access: 'all' },
      { id: 'p2', name: 'Brian Odhiambo', email: 'b@x.test', role: 'contribute', access: 'all', memberId: 'b' }],
    signerPlan: [{ party: 'counterparty', name: 'Wanjiru Kamau', email: 'wanjiru@naivas.co.ke' }] },
  /* the same party in another spelling, and the same Peter as its main contact */
  { id: 'MK-2', name: 'Framework agreement', counterparty: 'naivas  ltd', counterpartyEmail: 'peter@naivas.co.ke', folder: 'legal', status: 'Draft', participants: [] },
  { id: 'MK-3', name: 'Connectivity', counterparty: 'Safaricom PLC', counterpartyEmail: 'susan@safaricom.co.ke', counterpartyName: 'Susan Achieng', folder: 'proc', status: 'Expired' },
  /* archived: off every default list, so off the book */
  { id: 'MK-4', name: 'Old deal', counterparty: 'Ghost Ltd', counterpartyEmail: 'g@ghost.test', folder: 'proc', status: 'Signed', archived: true },
];
const IMPORTED = [
  { name: 'Olof Sand', email: 'olof@nordkust.se', title: 'Ekonomichef' },
  { name: '', email: 'wanjiru@naivas.co.ke', title: 'Chief Finance Officer' },
];

/* The real reading and the real page on a real DOM, over a small workspace
   with the address book's own module loaded, so the join is the product's. */
function stage(o = {}) {
  const dom = new JSDOM('<!doctype html><html><body><div id="content"></div></body></html>',
    { runScripts: 'outside-only', url: 'https://hati.test/' });
  const win = dom.window;
  const calls = { setView: [], showOnly: [], settings: [] };
  const me = o.me || USERS[0];
  const sb = {
    console, document: win.document, localStorage: win.localStorage,
    esc: s => String(s == null ? '' : s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch])),
    i18t: (k, v) => String(k) + (v ? ' ' + JSON.stringify(v) : ''),
    i18tn: (k, n) => `${k}:${n}`,
    roleName: r => ({ admin: 'Admin', legal: 'Editor', viewer: 'Viewer' }[r] || ''),
    getUsers: () => USERS,
    currentUser: () => me,
    isAdmin: () => me.role === 'admin',
    openSettingsAt: t => calls.settings.push(t),
    setView: v => calls.setView.push(v),
    placeSave() {},
    regShowOnly: (ids, label) => calls.showOnly.push({ ids, label }),
    contractExpired: c => c.status === 'Expired',
    contractOwnerName: c => (c.owner && c.owner.name) || c._raisedBy || null,
    cuKeyOf: n => String(n || '').trim().replace(/\s+/g, ' ').toLowerCase(),
    partiesTheirs: c => [{ id: 'py1', name: c.counterparty }],
    orgDirectory: () => (o.imported || IMPORTED).map(x => ({ ...x })),
    state: { settings: {}, contracts: o.contracts || CONTRACTS() },
    FOLDERS: { proc: { name: 'Procurement' }, legal: { name: 'Legal' } },
  };
  sb.window = sb; sb.self = sb;
  vm.createContext(sb);
  vm.runInContext(read('js/participants.js'), sb, { filename: 'participants.js' });
  vm.runInContext(read('js/views/directory.js'), sb, { filename: 'directory.js' });
  return { sb, doc: win.document, calls };
}
const byName = (book, n) => book.find(p => p.name === n);
/* Values from the sandbox's realm carry its prototypes; compare by shape. */
const eq = (a, b, m) => assert.equal(JSON.stringify(a), JSON.stringify(b), m);

/* ============================================================
   THE READING
   ============================================================ */
describe('f669 — one book, every person once', () => {
  const { sb } = stage();
  const book = sb.dirBook();

  test('everyone HaTi deals with, each side counted, the archived contract off the book', () => {
    const sides = k => book.filter(p => p.side === k).map(p => p.name).sort();
    eq(sides('ours'), ['Amina Otieno', 'Brian Odhiambo', 'Vera Reader']);
    eq(sides('theirs'), ['Peter Mwangi', 'Susan Achieng', 'Wanjiru Kamau']);
    eq(sides('none'), ['Olof Sand']);
    assert.equal(book.length, 7);
    assert.ok(!book.some(p => /ghost/i.test(p.email)), 'an archived contract names nobody here');
  });

  test('one person is one address: the main contact who also signs is one card with both roles', () => {
    const w = byName(book, 'Wanjiru Kamau');
    eq(w.contracts, ['MK-1']);
    eq(w.roles.slice().sort(), ['cpsign', 'negotiate']);
    assert.equal(w.partyName, 'Naivas Ltd');
    assert.equal(w.partyKey, 'naivas ltd');
    assert.equal(w.title, 'Chief Finance Officer', 'the imported list lends a job title to somebody already here');
  });

  test('two spellings of a party are one party, so the same person on both is one card with two contracts', () => {
    const p = byName(book, 'Peter Mwangi');
    eq(p.contracts.slice().sort(), ['MK-1', 'MK-2']);
    assert.equal(p.partyKey, 'naivas ltd');
    eq(p.streams.slice().sort(), ['legal', 'proc']);
    assert.equal(p.active, 2);
  });

  test('our side is read off the contract too: the owner and a contributor', () => {
    eq(byName(book, 'Amina Otieno').roles, ['owner']);
    eq(byName(book, 'Amina Otieno').contracts, ['MK-1']);
    eq(byName(book, 'Brian Odhiambo').roles, ['contribute']);
    eq(byName(book, 'Vera Reader').contracts, [], 'a colleague on nothing is still a colleague');
    assert.equal(byName(book, 'Amina Otieno').you, true, 'the reader is marked');
  });

  test('an expired contract counts as a contract but not as active', () => {
    const s = byName(book, 'Susan Achieng');
    assert.equal(s.contracts.length, 1);
    assert.equal(s.active, 0);
  });

  test('an imported contact nobody has named is "Not on a contract"', () => {
    const o = byName(book, 'Olof Sand');
    assert.equal(o.side, 'none');
    assert.equal(o.title, 'Ekonomichef');
    eq(o.contracts, []);
  });

  test('the reading writes nothing — the contracts are as they were', () => {
    const before = JSON.stringify(CONTRACTS());
    const { sb: s2 } = stage();
    s2.dirBook(); s2.renderDirectory();
    assert.equal(JSON.stringify(s2.state.contracts), before);
  });
});

/* ============================================================
   THE TABS, THE FIND BOX, THE FILTERS
   ============================================================ */
describe('f669 — what the tabs and filters leave', () => {
  const { sb } = stage();
  const book = sb.dirBook();
  const f = o => Object.assign({ q: '', party: 'all', role: 'all', stream: 'all' }, o);

  test('the number on a tab is the rows behind it, and the three sides add up to everyone', () => {
    for (const k of sb.DIR_TABS)
      assert.equal(sb.dirTabCount(book, k, f()), sb.dirRows(book, k, f()).length, k);
    assert.equal(sb.dirTabCount(book, 'ours', f()) + sb.dirTabCount(book, 'theirs', f()) + sb.dirTabCount(book, 'none', f()),
      sb.dirTabCount(book, 'all', f()));
  });

  test('Everyone reads by name; Our people keeps the roster\'s order, admins first', () => {
    eq(sb.dirRows(book, 'all', f()).map(p => p.name),
      ['Amina Otieno', 'Brian Odhiambo', 'Olof Sand', 'Peter Mwangi', 'Susan Achieng', 'Vera Reader', 'Wanjiru Kamau']);
    eq(sb.dirRows(book, 'ours', f()).map(p => p.name), ['Amina Otieno', 'Brian Odhiambo', 'Vera Reader']);
  });

  test('Party narrows to that party\'s people, and the Parties panel\'s door counts the same', () => {
    eq(sb.dirRows(book, 'all', f({ party: 'naivas ltd' })).map(p => p.name).sort(), ['Peter Mwangi', 'Wanjiru Kamau']);
    assert.equal(sb.dirPeopleOfParty('naivas ltd').length, 2);
    assert.equal(sb.dirPeopleOfParty('ghost ltd').length, 0);
  });

  test('Role and Stream narrow by what a person holds on their contracts', () => {
    eq(sb.dirRows(book, 'all', f({ role: 'cpsign' })).map(p => p.name), ['Wanjiru Kamau']);
    eq(sb.dirRows(book, 'all', f({ stream: 'legal' })).map(p => p.name), ['Peter Mwangi']);
    eq(sb.dirRows(book, 'all', f({ role: 'owner' })).map(p => p.name), ['Amina Otieno']);
  });

  test('the find box reads name, address, party and job title', () => {
    eq(sb.dirRows(book, 'all', f({ q: 'naivas' })).map(p => p.name).sort(), ['Peter Mwangi', 'Wanjiru Kamau']);
    eq(sb.dirRows(book, 'all', f({ q: 'ekonomi' })).map(p => p.name), ['Olof Sand']);
    eq(sb.dirRows(book, 'all', f({ q: 'v@x' })).map(p => p.name), ['Vera Reader']);
    eq(sb.dirRows(book, 'theirs', f({ q: 'amina' })), []);
  });

  test('the place a refresh puts back: the tab, the find box and the three filters, and nothing else', () => {
    sb.dirPlacePut({ tab: 'theirs', q: 'na', party: 'naivas ltd', role: 'cpsign', stream: 'proc', cust: 'ignored' });
    eq(sb.dirPlace(), { tab: 'theirs', q: 'na', party: 'naivas ltd', role: 'cpsign', stream: 'proc' });
    sb.dirPlacePut({ tab: 'nonsense' });
    eq(sb.dirPlace(), { tab: 'all', q: '', party: 'all', role: 'all', stream: 'all' });
  });
});

/* ============================================================
   THE WALL AS DRAWN
   ============================================================ */
describe('f669 — the wall of faces', () => {
  const { sb, doc } = stage();
  sb.dirPlacePut({ tab: 'all' });
  sb.renderDirectory();
  const cards = [...doc.querySelectorAll('#dir-page [data-dir-row]')];
  const card = n => cards.find(c => c.querySelector('.dir-name').textContent.includes(n));

  test('a card per person, under the band every list page wears', () => {
    assert.equal(cards.length, 7);
    assert.ok(doc.querySelector('#dir-page.sap-page .sap-band .dir-t'), 'the page\'s name is in the band');
    assert.match(doc.querySelector('#dir-page .page-facts').textContent, /dir_count:7/, 'everyone counted');
    assert.match(doc.querySelector('#dir-page .page-facts').textContent, /cu_n_customers:2/, 'two parties');
    assert.match(doc.querySelector('#dir-page .page-facts').textContent, /"n":3/, 'three of ours');
  });

  test('a card says who, where, what they do and how many contracts; the address is the one link', () => {
    const w = card('Wanjiru Kamau');
    assert.match(w.querySelector('.dir-sub').textContent, /Naivas Ltd/);
    assert.match(w.querySelector('.dir-sub').textContent, /Chief Finance Officer/);
    assert.match(w.querySelector('.dir-role').textContent, /ppl_r_cpsign/, 'the address book\'s own role words');
    assert.match(w.querySelector('.dir-role').textContent, /ppl_r_negotiate/);
    assert.match(w.querySelector('.dir-foot').textContent, /cu_n_contracts:1/);
    assert.match(w.querySelector('.dir-foot').textContent, /dir_n_active/);
    const a = w.querySelector('.dir-mail a');
    assert.equal(a.getAttribute('href'), 'mailto:wanjiru@naivas.co.ke');
    const links = [...doc.querySelectorAll('#dir-page a')];
    assert.ok(links.every(l => l.getAttribute('href').startsWith('mailto:')), 'no other link on the page');
  });

  test('a colleague\'s card says their HaTi role and Our side; the reader is marked', () => {
    const a = card('Amina Otieno');
    assert.match(a.querySelector('.dir-role').textContent, /Admin/);
    assert.match(a.querySelector('.dir-role').textContent, /ppl_r_owner/);
    assert.match(a.querySelector('.dir-sub').textContent, /dir_our_side/);
    assert.ok(a.querySelector('.dir-you'));
    assert.equal(a.getAttribute('data-dir-row'), 'a', 'a colleague\'s key is their id');
  });

  test('an absence says so in the one grey both shells share', () => {
    const v = card('Vera Reader');
    assert.match(v.querySelector('.dir-sub .dir-none').textContent, /dir_no_title/);
    assert.match(v.querySelector('.dir-foot .dir-none').textContent, /dir_no_contracts/);
    const o = card('Olof Sand');
    assert.match(o.querySelector('.dir-role .dir-none').textContent, /dir_not_named/);
    assert.match(o.querySelector('.dir-sub').textContent, /dir_imported/);
  });

  test('the A to Z edge: a letter with somebody behind it is live, one with nobody is dimmed and says so', () => {
    const az = doc.querySelector('#dir-page .dir-az');
    assert.ok(az, 'the edge is drawn');
    const btn = L => az.querySelector(`[data-dir-az="${L}"]`);
    assert.ok(btn('W') && !btn('W').classList.contains('is-dim'), 'W is live');
    assert.ok(btn('Z') && btn('Z').classList.contains('is-dim') && btn('Z').getAttribute('aria-disabled') === 'true', 'Z is dimmed');
    assert.match(btn('Z').getAttribute('title'), /dir_az_none/);
    assert.equal(az.querySelectorAll('button').length, 26, 'the alphabet, nothing invented');
    assert.equal(card('Wanjiru Kamau').getAttribute('data-dir-letter'), 'W');
  });

  test('a first letter outside the alphabet joins the edge, in the reader\'s order', () => {
    const { sb: s2, doc: d2 } = stage({ imported: [{ name: 'Åsa Lind', email: 'asa@nordkust.se', title: '' }] });
    s2.renderDirectory();
    const letters = [...d2.querySelectorAll('.dir-az button')].map(b => b.getAttribute('data-dir-az'));
    assert.equal(letters.length, 27);
    assert.equal(letters[26], 'Å');
  });

  test('an admin is pointed at Settings → People; a viewer is not', () => {
    assert.ok(doc.querySelector('#dir-manage'));
    const { doc: dv } = stage({ me: USERS[2] });
    assert.equal(dv.querySelector('#dir-manage'), null);
  });

  test('the find box narrows the wall in place and says when nobody matches', () => {
    const { sb: s3, doc: d3 } = stage();
    s3.dirPlacePut({ tab: 'all', q: 'safaricom' });
    s3.renderDirectory();
    assert.equal(d3.querySelectorAll('[data-dir-row]').length, 1);
    s3.dirPlacePut({ tab: 'all', q: 'zzz' });
    s3.renderDirectory();
    assert.equal(d3.querySelectorAll('[data-dir-row]').length, 0);
    assert.match(d3.querySelector('.dir-empty').textContent, /dir_none_match/);
  });
});

/* ============================================================
   THE DOORS
   ============================================================ */
describe('f669 — the doors go somewhere', () => {
  test('the Parties panel\'s People door lands here narrowed to that party', () => {
    const { sb, calls } = stage();
    sb.dirOpenParty('naivas ltd');
    eq(calls.setView, ['directory']);
    eq(sb.dirPlace(), { tab: 'all', q: '', party: 'naivas ltd', role: 'all', stream: 'all' });
  });

  test('a colleague\'s contracts open the Contracts page narrowed to them, by the page\'s own door', () => {
    const { sb, calls } = stage();
    const book = sb.dirBook();
    sb.dirShowContracts(byName(book, 'Amina Otieno'));
    assert.equal(calls.showOnly.length, 1);
    eq(calls.showOnly[0].ids, ['MK-1']);
    assert.match(calls.showOnly[0].label, /Amina Otieno · 1/);
    sb.dirShowContracts(byName(book, 'Vera Reader'));
    assert.equal(calls.showOnly.length, 1, 'somebody on nothing opens nothing');
  });

  test('the Parties panel draws the door, only where somebody is named, and the page keeps its place', () => {
    const cu = read('js/views/customers.js');
    assert.match(cu, /cu_people_door/);
    assert.match(cu, /dirPeopleOfParty\(r\.key\)/, 'the number on the door is the Directory\'s own reading');
    assert.match(cu, /dirOpenParty\(x\.id\)/);
    assert.match(cu, /cuChip \}\);|cuChip\s*\}\)/, 'the one filter-box builder is shared');
    const app = read('js/app.js');
    assert.match(app, /directory:\['dirPlace','dirPlacePut'\]/, 'a refresh lands at the same spot');
    assert.match(app, /case 'directory': return \[i18t\('nav_directory'\)/);
    const ins = read('js/views/inspector.js');
    assert.match(ins, /directory: 'renderDirectory'/, 'a width that crosses the line repaints the page');
  });

  test('the rail door is People\'s, renamed; the phone keeps its People screen', () => {
    const html = read('index.html');
    const at = html.indexOf('data-view="directory" class="nav-item"');
    const door = html.slice(at, html.indexOf('</button>', at));
    assert.match(door, /data-i18n-title="nav_directory_title"/);
    assert.match(door, /data-i18n="nav_directory"/);
    assert.match(door, /#i-people/, 'the same symbol, so nav tests and the owner\'s eye find it where it was');
    const m = read('js/mobile.js');
    assert.match(m, /dirPeople\(\)/);
    assert.match(m, /nav_people/);
  });
});

/* ============================================================
   BOTH BOOKS, THE BRAIN, AND WHAT THE PAGE NEVER DOES
   ============================================================ */
describe('f669 — both books and the brain', () => {
  test('every new word is in en and sv', () => {
    const i18n = read('js/i18n.js');
    for (const k of ['nav_directory', 'nav_directory_title', 'dir_tabs_label', 'dir_tab_all', 'dir_tab_ours', 'dir_tab_theirs', 'dir_tab_none',
      'dir_n_ours', 'dir_find', 'dir_find_ph', 'dir_f_party', 'dir_f_role', 'dir_all_parties', 'dir_any_role', 'dir_our_side', 'dir_imported',
      'dir_not_named', 'dir_not_named_long', 'dir_n_active', 'dir_no_contracts', 'dir_shown_of', 'dir_panel_none', 'dir_panel_label',
      'dir_show_contracts', 'dir_show_contracts_none', 'dir_party_none', 'dir_f_in_hati', 'dir_f_contracts', 'dir_f_roles', 'dir_named_on',
      'dir_also_at', 'dir_nobody_else', 'dir_works_with', 'dir_more_contracts', 'dir_az_label', 'dir_az_none', 'cu_people_door',
      'brn_p_directory', 'brn_pd_directory']) {
      const hits = i18n.match(new RegExp(`\\b${k}:`, 'g')) || [];
      assert.equal(hits.length, 2, `${k} appears ${hits.length} times, expected en + sv`);
    }
  });

  test('the Brain names the page, in a lane and in a flow step', () => {
    const b = read('js/brainmap.js');
    assert.match(b, /\['directory', 'renderDirectory', 'see', 0\]/);
    assert.match(b, /'customers', 'directory', 'cellfold'/, 'in the lane of the person working the contract');
    assert.match(b, /'customers', 'directory', 'passroute'/, 'on the doors step of the ask flow');
  });

  test('the page writes nothing and asks the server nothing', () => {
    const src = read('js/views/directory.js');
    for (const w of ['saveSettings', 'saveContract', 'contactSet(', 'participantAdd', 'participantSet', 'participantRemove', 'fetch(', 'api('])
      assert.ok(!src.includes(w), `the directory calls ${w}`);
    assert.match(src, /getUsers\(\)/);
    assert.match(src, /contactsOf/);
    assert.match(src, /orgDirectory/);
  });
});
