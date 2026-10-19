'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f678 — EVERY DOOR LANDS ON HOME: THE CENSUS AND THE WRONG DOORS
   (the overnight work order, steps 1 and 2; owner's "Go", 14 Oct 2026;
   docs/WORKORDER-one-page-finish.md)

   The browser census (test/chromium/every-door-lands-on-home-verify.js)
   presses every door that opens a contract or its work and is the measure.
   This file pins the four doors step 2 moved, at the source and run on their
   own with the product's names stubbed, and pins the census itself:
   (1) THE WORKSPACE DOOR OPENS HOME: roomHomeLand — Fill in beside the paper
       while details are owed and the reader may write, else the paper on
       Jambo, PLAIN (pdOpenOnHome 'plain' puts away a face an earlier press
       left open on that contract); false on the phone (the caller keeps the
       room there). Every door named Workspace asks it first: the list panel's
       third door, the Contracts row's ⋯, Explorer's card and strip, the
       Board's contract card, the Negotiate page's Open workspace. A contract
       just made lands through the same landing.
   (2) OBLIGATIONS ROWS OPEN THE BOARD'S OBLIGATIONS VIEW: obOpenContract is
       roomOpenAt(cid,'oblig') with the row's key, the view's tab moved to one
       that shows that row (so the row pressed is the row chosen); the panel's
       Document door went on 15 Oct 2026 (the owner), Workspace stays.
   (3) OPEN PARTY OPENS HOME'S CONTRACTS PLACE, NARROWED (re-pointed at step
       7, when the wall's own set retired into the register's one state):
       regShowOnly(cuIdsOf(v)) on every shell; the set keeps a party's closed
       contract, the search narrows within it, a door lands on fresh filters
       and keeps Wall | List, its place survives a refresh, junk does not;
       Jambo's "contracts" lets it go and "wall" / "list" turn the place; the
       count line counts the set the way Parties counted it (agreements, an
       amendment said beside them); the place's one set chip has a drawn ×.
   (4) THE BELL'S APPROVAL ROW OPENS BEFORE YOU SIGN through the walls
       (roomOpenAt 'sign'); so does the side panel's checklist row since 15
       Oct 2026 (the owner: "go with your suggestions").
   (5) THE CENSUS RUNS IN CI and a PENDING row never fails it.
   AT THE PARENT (9cf3a18) (1)–(4) fail: roomHomeLand and igWallShowOnly do
   not exist, obOpenContract opens the paper's panel tab, the bell opens the
   Approvals page.
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const J = x => JSON.parse(JSON.stringify(x));
const CONTRACT = R('js/views/contract.js');
const INS = strip(R('js/views/inspector.js'));
const REG = strip(R('js/views/register.js'));
const IG = R('js/views/intelligence.js');
const OB = strip(R('js/obligations.js'));
const CU = strip(R('js/views/customers.js'));
const APP = strip(R('js/app.js'));
const HOME = strip(R('js/views/home.js'));
const fnBody = (src, name) => { const i = src.indexOf('function ' + name + '('); assert.ok(i >= 0, name + ' exists');
  const j = src.indexOf('\nfunction ', i + 10); return src.slice(i, j < 0 ? undefined : j); };

describe('f678 (1) the Workspace door opens Home, never the room', () => {
  const region = (() => { const a = CONTRACT.indexOf('const _wsNewDrafts=new Set();'); const b = CONTRACT.indexOf('/* ---- A RENEWAL IS DECIDED ON TODAY', a);
    assert.ok(a > 0 && b > a, 'the arrival region'); return CONTRACT.slice(a, b); })();
  const stage = ({ left = 2, phone = false, may = true, known = true } = {}) => {
    const calls = [];
    const ctx = { Date, String, Number,
      window: { innerWidth: phone ? 390 : 1440, mPhone: () => phone },
      getContract: id => (known && id === 'MK-1' ? { id: 'MK-1', status: 'Under Review' } : null),
      negoExecuted: () => false, detailsOf: () => ({ left, all: 5, live: true }), canEdit: () => may,
      pdFillOpen: id => { calls.push(['fill', id]); return true; },
      pdOpenOnHome: (id, tab) => { calls.push(['home', id, tab]); return true; } };
    ctx.mPhone = ctx.window.mPhone;
    vm.createContext(ctx); vm.runInContext(region + '\nthis.roomHomeLand=roomHomeLand; this.roomOpenOnTerms=roomOpenOnTerms; this.roomArrivesOnHome=roomArrivesOnHome;', ctx);
    return { ctx, calls };
  };
  test('1a details owed and the reader may write: Fill in beside the paper', () => {
    const { ctx, calls } = stage();
    assert.equal(ctx.roomHomeLand('MK-1'), true);
    assert.deepEqual(J(calls), [['fill', 'MK-1']]);
  });
  test('1b nothing owed, or a reader who may not write: the paper on Jambo, plain (no face left up)', () => {
    let s = stage({ left: 0 }); assert.equal(s.ctx.roomHomeLand('MK-1'), true); assert.deepEqual(J(s.calls), [['home', 'MK-1', 'plain']]);
    s = stage({ may: false }); assert.equal(s.ctx.roomHomeLand('MK-1'), true); assert.deepEqual(J(s.calls), [['home', 'MK-1', 'plain']]);
  });
  test('1c the phone and an unknown contract answer false and open nothing (the caller keeps the room)', () => {
    let s = stage({ phone: true }); assert.equal(s.ctx.roomHomeLand('MK-1'), false); assert.equal(s.calls.length, 0);
    s = stage({ known: false }); assert.equal(s.ctx.roomHomeLand('MK-1'), false); assert.equal(s.calls.length, 0);
  });
  test('1d a contract just made lands through the same landing', () => {
    const { ctx, calls } = stage(); ctx.roomOpenOnTerms('MK-1');
    assert.equal(ctx.roomArrivesOnHome('MK-1'), true); assert.deepEqual(J(calls), [['fill', 'MK-1']]);
    assert.match(strip(fnBody(CONTRACT, 'roomArrivesOnHome')), /return roomHomeLand\(k\);/);
  });
  test('1e every door named Workspace asks it first; the room only as the fallback', () => {
    const doors = INS.slice(INS.indexOf('function insDoorActs'), INS.indexOf('function insActsHtml'));
    const ws = doors.slice(doors.indexOf("k: 'door-ws'"), doors.indexOf('const all ='));
    assert.ok(ws.indexOf('roomHomeLand(c.id)') > 0 && ws.indexOf('roomHomeLand(c.id)') < ws.indexOf('openWorkspace(c.id)'), 'the list panel\'s Workspace door');
    assert.match(fnBody(REG, 'regRunRowAct'), /if\(act==='open'\)\{ if\(!\(window\.roomHomeLand&&roomHomeLand\(id\)\)\) openWorkspace\(id\); \}/, 'the Contracts row\'s ⋯ Workspace');
    const igCode = strip(IG);
    const wsHandlers = igCode.match(/\[data-ig-ws\][^\n]*/g) || [];
    assert.ok(wsHandlers.length >= 2, 'Explorer\'s card and the strip');
    for (const h of wsHandlers.filter(x => /openWorkspace/.test(x)))
      assert.match(h, /if\(!\(window\.roomHomeLand&&roomHomeLand\(id\)\)\) openWorkspace\(id\)/, h.slice(0, 120));
    assert.match(R('js/views/contract.js'), /roomArrivesOnHome,roomHomeLand,ROOM_ARRIVE_MS/, 'published');
    const HB = strip(R('js/views/homeboard.js'));
    assert.match(HB, /if \(\(el = on\('\[data-hb-room\]'\)\)\)\{ const id = el\.getAttribute\('data-hb-room'\);\s*if \(!\(window\.roomHomeLand && roomHomeLand\(id\)\) && typeof openWorkspace === 'function'\) openWorkspace\(id\); return; \}/, 'the Board\'s contract card');
    const NG = strip(R('js/views/negotiation.js'));
    const ng = NG.slice(NG.indexOf("host.querySelectorAll('[data-rl-open-ws]')"), NG.indexOf("host.querySelectorAll('[data-rl-open-doc]')"));
    assert.ok(ng.indexOf('roomHomeLand(c.id)') > 0 && ng.indexOf('roomHomeLand(c.id)') < ng.indexOf('openWorkspace(c.id)'), 'the Negotiate page\'s Open workspace');
  });
  /* the plain landing, run on its own: a face left open is put away */
  test('1f pdOpenOnHome(\'plain\') puts away a face left open on that contract; \'copilot\' keeps it', () => {
    const PD = R('js/paperdesk.js');
    const a = PD.indexOf('const PD_ROOM_TAB'), b = PD.indexOf('\n/* ====', PD.indexOf('function pdOpenOnHome('));
    assert.ok(a > 0 && b > a, 'pdOpenOnHome');
    const walked = [];
    const ctx = { String, window: { innerWidth: 1440, state: { view: 'approvals' } }, state: { view: 'approvals' },
      getContract: id => ({ id }), igWalk: (ids, at, o) => walked.push([ids[0], o.tab]), setView: v => { ctx.state.view = v; },
      pdArrived: () => {}, pdRedPaper: () => {}, pdSignPaper: () => {}, pdFillLand: () => {}, pdSetTab: () => {}, pdPresenceOff: () => {} };
    vm.createContext(ctx);
    vm.runInContext('let _pdFill = null, _pdFillKey = null, _pdRed = null, _pdSign = null;\n' + PD.slice(a, b)
      + '\nthis.pdOpenOnHome=pdOpenOnHome; this.faces=()=>[_pdFill,_pdRed,_pdSign];', ctx);
    ctx.pdOpenOnHome('MK-1', 'signing'); assert.deepEqual(J(ctx.faces()), [null, null, 'MK-1']);
    ctx.pdOpenOnHome('MK-1', 'copilot'); assert.deepEqual(J(ctx.faces()), [null, null, 'MK-1'], '\'copilot\' keeps the same contract\'s face');
    ctx.pdOpenOnHome('MK-1', 'plain'); assert.deepEqual(J(ctx.faces()), [null, null, null], 'the Workspace door\'s landing puts it away');
    ctx.pdOpenOnHome('MK-1', 'red'); ctx.pdOpenOnHome('MK-1', 'plain'); assert.deepEqual(J(ctx.faces()), [null, null, null]);
    assert.deepEqual(J(walked.slice(-1)), [['MK-1', 'copilot']], 'it lands on Jambo\'s tab');
  });
});

describe('f678 (2) an Obligations row opens the Board\'s Obligations view', () => {
  test('2a obOpenContract is the Board\'s view, the row chosen by its key; never the paper\'s panel tab', () => {
    const open = fnBody(OB, 'obOpenContract');
    assert.match(open, /if\(key\)\{\s*if\(typeof window\.insSelect === 'function'\) insSelect\('oblig:' \+ cid, key\);/);
    assert.match(open, /roomOpenAt\(cid, 'oblig'\)/);
    assert.doesNotMatch(open, /pdOpenOnHome/);
  });
  test('2b every row press hands over its key: double-click and Enter, the narrow row and its Open', () => {
    /* RE-POINTED 18 Oct 2026 (round 16 as drawn, lane A4): a renewal decision's
       row opens the renewal card (needsYouGo) before an obligation's row opens
       its contract's table — the same press, one more kind of row */
    assert.match(OB, /onOpen: k => \{ const r = byKey\.get\(k\);[^\n]*if\(r\) obOpenContract\(r\.cid, k\); \}/);
    assert.match(OB, /data-obw-row="\$\{_obEsc\(o\.id\)\}" data-obw-cid="\$\{_obEsc\(o\.cid\)\}" data-obw-key="\$\{_obEsc\(okey\)\}"/);
    assert.match(OB, /data-obw-open="\$\{_obEsc\(o\.cid\)\}" data-obw-key="\$\{_obEsc\(okey\)\}"/);
    assert.match(OB, /const okey = obKeyOf\(o\.cid, o, o\._i\);/, 'the same key the inspector\'s rows carry');
  });
  /* the tab move, run on its own: the row pressed is on the tab the view opens on */
  test('2d the view\'s tab moves to one that shows the row pressed; a tab that shows it stays', () => {
    const a = OB.indexOf('function obOpenContract('), b = OB.indexOf('\nfunction ', a + 10);
    const ROWS = { 'MK-1::o1': { st: 'open', win: 'soon' }, 'MK-1::o2': { st: 'done', win: 'done' }, 'MK-1::o3': { st: 'open', win: 'overdue' } };
    const ctx = { String, window: { insSelect: () => {}, getContract: id => ({ id }), roomOpenAt: () => true }, insSelect: () => {}, getContract: id => ({ id }), roomOpenAt: () => true,
      obtRowsOf: () => Object.entries(ROWS).map(([k, r]) => ({ ...r, _key: k })) };
    vm.createContext(ctx);
    const PASS = OB.slice(OB.indexOf('function obtPass('), OB.indexOf('\nfunction ', OB.indexOf('function obtPass(') + 10));
    vm.runInContext(`const OBT_VIEWS = [['all','a'],['open','o'],['overdue','v'],['done','d']]; const _obtView = {};
      function obtView(cid){ const v = _obtView[cid]; return OBT_VIEWS.some(x => x[0] === v) ? v : 'open'; }\n` + PASS + '\n' + OB.slice(a, b)
      + '\nthis.obOpenContract=obOpenContract; this.V=_obtView;', ctx);
    const press = (left, key) => { ctx.V['MK-1'] = left; ctx.obOpenContract('MK-1', key); return ctx.V['MK-1']; };
    assert.equal(press('open', 'MK-1::o2'), 'done', 'a completed row: Completed');
    assert.equal(press('overdue', 'MK-1::o1'), 'open', 'an open row the Overdue tab hides: Outstanding');
    assert.equal(press('done', 'MK-1::o1'), 'open', 'an open row off Completed: Outstanding');
    assert.equal(press('overdue', 'MK-1::o3'), 'overdue', 'a tab that shows it stays');
    assert.equal(press('all', 'MK-1::o2'), 'all', 'All shows every row');
    assert.equal(press('done', 'MK-1::gone'), 'open', 'a key no longer on the record: Outstanding, as before');
  });
  /* RE-POINTED 15 Oct 2026 (owner: "we have 2 buttons to the same page so
     document will simply need to be deleted"): the panel's Document door went;
     the panel draws the shared doors, Negotiation · Workspace, no landing of its own */
  test('2c the panel draws the shared doors, with no Document door of its own', () => {
    assert.match(OB, /acts\.push\(\.\.\.insDoorActs\(c\)\);/);
    assert.doesNotMatch(OB, /insDoorActs\(c, \{ doc:/);
  });
});

describe('f678 (3) Open party opens Home\'s Contracts place, narrowed to the party (steps 2 and 7)', () => {
  /* STEP 7 MADE THE SET THE PLACE'S OWN: the wall's own find box, stage chips
     and set (igWall, igWallShowOnly) retired into the register's one state
     (state.reg), which the Wall and the List both read. The claims of step 2
     stand, measured on that one home. */
  test('3a the door: the set the row counted, through the register\'s one door, on every shell', () => {
    const open = fnBody(CU, 'cuOpenCustomer');
    /* `party: true` (the checkers of step 7): the set is a party's shelf, so
       the Wall counts it as the row did; every other set is counted whole */
    assert.match(open, /if \(typeof regShowOnly === 'function'\) regShowOnly\(cuIdsOf\(v\), phone \? `\$\{v\.name\} · \$\{v\.items\.length\}` : v\.name, \{ party: true \}\);/);
    assert.doesNotMatch(open, /igWallShowOnly|caHomeWall/, 'no second door onto the set');
    assert.doesNotMatch(IG, /function igWallShowOnly\(|const igWall=/, 'the wall keeps no set of its own');
  });
  /* the register's reading, run in the world (js/views/register.js, real) */
  const { buildWorld } = require('./world');
  const world = () => {
    const win = buildWorld({ registerView: true }).win;
    win.state = Object.assign({}, win.state || {}, { view: 'dashboard', contracts: [
      { id: 'MK-1', name: 'Supply', counterparty: 'Naivas', status: 'Signed', folder: 'sales', lastAction: '2026-10-02', metadata: {} },
      { id: 'MK-2', name: 'Listing', counterparty: 'Naivas', status: 'Declined', folder: 'sales', lastAction: '2026-10-03', metadata: {} },
      { id: 'MK-3', name: 'Amendment 1', counterparty: 'Naivas', status: 'Draft', folder: 'sales', parentId: 'MK-1', relation: 'amendment', lastAction: '2026-10-04', metadata: {} },
      { id: 'MK-4', name: 'Naivas pricing note', counterparty: 'Carrefour', status: 'Draft', folder: 'sales', lastAction: '2026-10-05', metadata: {} },
      { id: 'MK-5', name: 'Old', counterparty: 'Naivas', status: 'Signed', folder: 'sales', archived: true, lastAction: '2026-10-06', metadata: {} },
    ] });
    win.__went = []; win.setView = v => { win.__went.push(v); };
    win.regSetScope(null);
    return win;
  };
  const ids = rows => rows.map(c => c.id).sort().join();
  test('3b the set: exactly its ids, a closed one kept, an archived one not; the open book is every contract the List holds', () => {
    const w = world();
    assert.equal(ids(w.regFiltered()), 'MK-1,MK-2,MK-3,MK-4', 'no set: the book on the All tab, the closed one on it as on the List (the Wall reads the same rows since step 7)');
    w.regShowOnly(['MK-1', 'MK-2', 'MK-3', 'MK-5'], 'Naivas');
    assert.deepEqual(J(w.__went), ['register'], 'the door opens the Contracts place (setView redirects it to Home)');
    assert.equal(ids(w.regFiltered()), 'MK-1,MK-2,MK-3', 'the party\'s closed contract is counted, so it is drawn; the archived one is not');
    assert.equal(w.state.reg.only.label, 'Naivas');
    w.state.reg.query = 'amend';
    assert.equal(ids(w.regFiltered()), 'MK-3', 'the search narrows within the set');
  });
  test('3c it opens on fresh filters, keeping how the reader looks (Wall or List); an empty set is no set', () => {
    const w = world(); const R = w.regState();
    Object.assign(R, { query: 'x', stage: 'Signed', show: 'list' });
    w.regShowOnly(['MK-1'], 'Naivas');
    assert.equal(R.query, ''); assert.equal(R.stage, 'all'); assert.equal(R.show, 'list', 'Wall | List is a way of looking, kept');
    w.regShowOnly([], 'Nobody'); assert.equal(w.state.reg.only, null);
  });
  test('3d a refresh brings the set and the view back (Home\'s pair carries the register\'s); anything else is no set', () => {
    const w = world(); w.regShowOnly(['MK-1', 'MK-3'], 'Naivas'); w.state.reg.show = 'list';
    const kept = J(w.regPlace());
    const v = world(); v.regPlacePut(kept);
    assert.deepEqual(J(v.state.reg.only), { ids: ['MK-1', 'MK-3'], label: 'Naivas' });
    assert.equal(v.state.reg.show, 'list');
    for (const junk of [{ ids: 'MK-1' }, { ids: [1, 2] }, { ids: [] }, null]){ v.regPlacePut({ scope: null, st: { only: junk } }); assert.equal(v.state.reg.only, null, JSON.stringify(junk)); }
    v.regPlacePut({ scope: null, st: { show: 'gallery' } }); assert.equal(v.state.reg.show, 'wall', 'an unknown way of looking is the Wall');
    assert.match(IG, /function igWallPlace\(\)\{ return \{ scope:null, st:\{ \.\.\.\(state\.reg\|\|\{\}\) \} \}; \}/, 'Home\'s pair carries the place\'s own state');
    assert.match(IG, /function igWallPlacePut\(p\)\{[^\n]*regPlacePut\(\{ scope:null, st:p\.st \}\)/);
  });
  /* THE NUMBER PRESSED IS THE NUMBER READ (the Six Questions' sixth) */
  test('3g narrowed, the count line counts agreements as Parties does, an amendment said beside them, out of the set', () => {
    const a = IG.indexOf('function igWallCountWords('), b = IG.indexOf('function igWallBodyHtml(', a);
    assert.ok(a > 0 && b > a, 'the count line\'s region');
    const ctx = { Array, i18t: (k, v) => `${k}[${v.k} of ${v.n}]`, i18tn: (k, n) => `${k}#${n}` };
    vm.createContext(ctx); vm.runInContext(IG.slice(a, b) + '\nthis.words=igWallCountWords;', ctx);
    const w = world();
    assert.equal(ctx.words(w.regFiltered(), { base: w.regRestBase() }), 'igw_count[4 of 4]', 'open: every paper drawn, out of the book at rest');
    w.regShowOnly(['MK-1', 'MK-3', 'MK-2'], 'Naivas', { party: true });
    const R = w.state.reg;
    assert.equal(ctx.words(w.regFiltered(), { only: R.only, base: w.regRestBase() }), 'igw_count[2 of 2] · int_dep_amend#1', 'the agreements Parties counted, the amendment beside them');
    R.stage = 'Signed';
    assert.equal(ctx.words(w.regFiltered(), { only: R.only, base: w.regRestBase() }), 'igw_count[1 of 2]', 'a tab narrows k, never n');
    /* ANY OTHER SET IS COUNTED WHOLE (the checkers of step 7: the Board's
       "Open these 7 contracts" read "6 of 6 contracts · 1 amendment") */
    w.regShowOnly(['MK-1', 'MK-3', 'MK-2'], 'Open these');
    assert.equal(w.state.reg.only.party, undefined, 'not a party\'s shelf');
    assert.equal(ctx.words(w.regFiltered(), { only: w.state.reg.only, base: w.regRestBase() }), 'igw_count[3 of 3]', 'the number on the door that sent it');
    /* THE ARCHIVE SHELF IS ITS OWN BOOK: "of n" is the shelf, never the book
       at rest that holds none of it */
    w.regGoFiltered({ view: 'archived' });
    assert.equal(ctx.words(w.regFiltered(), { base: w.regRestBase() }), 'igw_count[1 of 1]', 'the shelf counted against the shelf');
  });
  test('3e the place\'s one set chip names the set and is its way out, on the Wall and the List, in both books', () => {
    const REGS = R('js/views/register.js');
    assert.match(REGS, /const onlyChip=R\.only\?`<span id="reg-only-chip"/);
    assert.match(REGS, /<button id="reg-only-clear" title="\$\{esc\(i18t\('reg_only_clear'\)\)\}"[\s\S]{0,260}\$\{icon\('x','w-3\.5 h-3\.5'\)\}<\/button>/, 'a drawn ×, never a typed one (f385)');
    assert.match(REGS, /const fbBoxes=`\s*\$\{onlyChip\}/, 'it leads the filter boxes');
    assert.match(REGS, /\$\{HOME\?regHomeHeadHtml\(R,fbBoxes,adaptBtn,clearSlot\):/, 'and the place\'s one head draws them, over the Wall or the List');
    assert.match(REG, /getElementById\('reg-only-clear'\)\?\.addEventListener\('click',\(\)=>\{ R\.only=null; R\.page=1; regRepaint\(\); \}\)/);
    const i18n = R('js/i18n.js');
    assert.equal((i18n.match(/^\s+reg_only_clear: /gm) || []).length, 2, 'in both books');
  });
});

describe('f678 (3f) Jambo\'s "contracts" is every contract: the set is let go; "wall" and "list" turn the place', () => {
  test('3f CA_GO lets the set go before the place, and turns its view', () => {
    const CA = strip(R('js/copilotacts.js'));
    /* RE-POINTED 15 Oct 2026 (the checkers of step 7): "Every contract is
       here" is true only with the tab, the filters and the search at rest too */
    assert.match(CA, /contracts: \(\) => \{\s*if \(typeof regPlaceSet === 'function'\)\{ const R = regPlaceSet\(\{ only: null \}\);\s*if \(typeof regFiltersAtRest === 'function'\) regFiltersAtRest\(R\);\s*if \(typeof regSearchBoxClear === 'function'\) regSearchBoxClear\(\); \}\s*return caHomeWall\(\); \},/);
    assert.match(CA, /wall: \(\) => \{ if \(typeof regPlaceSet === 'function'\) regPlaceSet\(\{ show: 'wall' \}\); return caHomeWall\(\); \},/);
    assert.match(CA, /list: \(\) => \{ if \(typeof regPlaceSet === 'function'\) regPlaceSet\(\{ show: 'list' \}\); return caHomeWall\(\); \},/);
  });
});

describe('f678 (4) the bell\'s approval row opens Before you sign', () => {
  test('4a through the walls (roomOpenAt), never the Approvals page', () => {
    const row = APP.match(/\(D\.myApprovals\|\|\[\]\)\.filter\(x=>x\.mine\)\.forEach\(x=>push\('approval',x\.c,\s*i18t\('al_approval'\),\(\)=>\{([^\n]*)\n/);
    assert.ok(row, 'the row');
    assert.match(row[1], /^ if\(window\.roomOpenAt\) roomOpenAt\(x\.c\.id,'sign'\);/);
    assert.doesNotMatch(row[1], /pdOpenOnHome/);
  });
  test('4b the side panel\'s checklist row lands there too (owner, 15 Oct 2026): through the walls, never the Approvals page', () => {
    const row = HOME.match(/if\(kind==='approval'\)\{([^\n]*)\n/);
    assert.ok(row, 'the row');
    assert.match(row[1], /^ if\(window\.roomOpenAt\) roomOpenAt\(c\.id,'sign'\);/);
    assert.doesNotMatch(row[1], /pdOpenOnHome/);
  });
});

describe('f678 (5) the census is the measure, and CI runs it', () => {
  const FILE = 'test/chromium/every-door-lands-on-home-verify.js';
  const src = R(FILE);
  test('5a it is a browser check run-all picks up: not set aside, not known red', () => {
    const all = R('test/chromium/run-all.js');
    const notTests = all.slice(all.indexOf('const NOT_TESTS'), all.indexOf(']);', all.indexOf('const NOT_TESTS')));
    const knownRed = all.slice(all.indexOf('const KNOWN_RED'), all.indexOf('\n};', all.indexOf('const KNOWN_RED')));
    assert.ok(!notTests.includes('every-door-lands-on-home-verify') && !knownRed.includes('every-door-lands-on-home-verify'));
    assert.match(all, /fs\.readdirSync\(DIR\)\s*\.filter\(f => f\.endsWith\('\.js'\) && !NOT_TESTS\.has\(f\)\)/, 'the folder is read, not a list');
  });
  test('5b a PENDING row is printed and never fails the run; the exit code is the failures', () => {
    assert.match(src, /else if \(pending\) \{ verdict = `PENDING step \$\{pending\}`; pend\+\+; \}/);
    assert.match(src, /process\.exit\(fail \? 1 : 0\)/);
    assert.match(src, /PENDING \(printed on every run/);
  });
  test('5c it fails on the room, the Negotiate page, a retired page and a door that does nothing', () => {
    for (const re of [/bad\.push\('lands on the room'\)/, /the room is drawn on the way/, /lands on the Negotiate page/, /a retired page: /, /bad\.push\('does nothing'\)/])
      assert.match(src, re);
    assert.match(src, /const RETIRED = \['calendar', 'agents', 'doc'\];/);
  });
  test('5d the doors step 2 moved are not PENDING', () => {
    /* RE-POINTED 15 Oct 2026: steps 7 and 8 took their rows off — nothing waits now */
    const pend = (src.match(/pending: \d/g) || []).length;
    assert.equal(pend, 0, 'no door waits on a later step');
    for (const name of ['Workspace door', 'Obligations row, double-click', 'Parties panel, Open party', 'approval row present'])
      assert.ok(src.includes(name), name);
    const block = src.slice(src.indexOf("await door(A, 'Parties panel, Open party"), src.indexOf("await door(A, 'Parties panel, Open on Explorer"));
    assert.doesNotMatch(block, /pending:/);
  });
});
