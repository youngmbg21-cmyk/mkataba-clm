'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f811 — ONE READER FOR EVERY JAMBO BOX (owner, 19 Oct 2026: "I want hati to
   do what the user asks in plain language supported by Minisearch without
   any constraints apart from the limitations set by the settings")

   The real readers (js/copilotacts.js, js/jambomap.js with MiniSearch,
   js/views/homeboard.js, js/views/intelligence.js) on the scenario world.
   The movers are recorders: what a box WOULD do is read, nothing is done.
   (A) a place and a narrowing, in any order, both languages (A1–A6)
   (B) a contract named any way, and what is asked of it (B1–B7)
   (C) what stays a box's own, and what only settings stop (C1–C6)
   (D) the wiring: every box asks the one reader first; nothing is cut silently
   AT THE PARENT every claim FAILS: caUnderstand does not exist there.
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world.js');
const ROOT = path.join(__dirname, '..');
const R = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const pad = n => String(n).padStart(2, '0');
const mon = (off, d = 15) => { const t = new Date(); const x = new Date(t.getFullYear(), t.getMonth() + off, d); return x.getFullYear() + '-' + pad(x.getMonth() + 1) + '-' + pad(x.getDate()); };

function book(){
  return [
    { id: 'MK-345', contractNo: 'MK-345', name: 'Master Services Agreement', counterparty: 'Nordfrakt AB', status: 'Draft', value: 5e6, folder: 'proc' },
    { id: 'MK-346', contractNo: 'MK-346', name: 'NDA Nordfrakt', counterparty: 'Nordfrakt AB', status: 'Signed', value: 0, expiry: mon(6), folder: 'proc' },
    { id: 'MK-1', contractNo: 'MK-1', name: 'Warehouse Lease', counterparty: 'Siginon', status: 'Signed', value: 10e6, expiry: mon(2), folder: 'proc', _hasBrief: true },
    { id: 'MK-0377', contractNo: 'MK-0377', name: 'Packaging', counterparty: 'Bidco', status: 'Draft', value: 5e6, folder: 'proc' },
    { id: 'MK-4', contractNo: 'MK-4', name: 'Retail', counterparty: 'Naivas', status: 'Under Review', value: 7e6, expiry: mon(14), folder: 'sales' },
    /* a code-named deal reaches an outsider as its code name alone (cnStub) */
    { id: 'MK-9', contractNo: 'MK-9', name: 'Project Falcon', counterparty: '', status: 'Signed', folder: 'sales', _codeNamed: true },
  ].map(c => ({ audit: [], metadata: {}, ...c }));
}
function stage({ view = 'dashboard', face = 'board', admin = true } = {}){
  const user = { id: 'u_test', name: 'Test User', role: admin ? 'admin' : 'legal', email: 't@x.co' };
  const w = buildWorld({ intelView: true, registerView: true, user }).win;
  w.state = { contracts: book(), settings: {}, view };
  w.FOLDERS = { proc: { id: 'proc', name: 'Procurement' }, sales: { id: 'sales', name: 'Sales' } };
  w.cKind = c => c.kind || 'Contract';
  w.getContract = id => w.state.contracts.find(c => c.id === id) || null;
  w.contractRef = c => c.contractNo || c.id;
  w.currentUser = () => user;
  w.isAdmin = () => !!admin;
  for (const f of ['vendor/minisearch-7.2.0.umd.js', 'js/views/homeboard.js', 'js/copilotacts.js', 'js/jambomap.js', 'js/draft.js']) w.eval(R(f));
  w.eval('intel.lenses=[]; intel.groups=null; intel.groupBy="folder"; intel.history=[];');
  w.eval(`hbS().face=${JSON.stringify(face)};`);
  const calls = []; w.__calls = calls;
  w.eval(`window.caHandHome = function(t, a){ __calls.push(['hand', t]); return true; };
    window.setView = function(v){ __calls.push(['view', v]); state.view = v; };
    window.hbSetFace = function(f){ __calls.push(['face', f]); hbS().face = f; };
    window.regShowOnly = function(ids, label){ __calls.push(['only', ids.slice().sort(), label]); };
    window.pdOpenOnHome = function(id, tab){ __calls.push(['paper', id, tab]); return true; };
    window.openNegotiations = function(){ __calls.push(['nego']); return true; };
    window.calHandOff = function(t){ __calls.push(['cal', t]); return true; };
    window.toast = function(m){ __calls.push(['toast', m]); };
    window.api = function(r){ __calls.push(['api', r]); return Promise.resolve({}); };`);
  return { w, calls };
}
const U = (w, q, box = 'page') => { const a = w.caUnderstand(q, { box }); return a ? JSON.parse(JSON.stringify(a)) : null; };

describe('f811 (A) a place and a narrowing, read whole, free', () => {
  const { w } = stage();
  test('A1 the owner\'s sentence lands on Explorer, Draft only, and says so in one line', () => {
    const a = U(w, 'go to explorer and show me all the contracts that are under draft');
    assert.equal(a.place, 'explorer'); assert.equal(a.narrow.what, 'Draft'); assert.equal(a.narrow.n, 2);
    assert.match(w.caUnderstandSay(w.caUnderstand('go to explorer and show me all the contracts that are under draft')), /Explorer, Draft only: 2/);
  });
  test('A2 the other ways of saying it', () => {
    for (const q of ['show me all draft contracts in explorer', 'show me contracts in draft on the map', 'take me to explorer with the drafts', 'open explorer and show draft contracts']){
      const a = U(w, q); assert.equal(a && a.place, 'explorer', q); assert.equal(a.narrow.what, 'Draft', q);
    }
  });
  test('A3 "go to contracts and show me the drafts" is the Contracts place narrowed, never the new-agreement form', () => {
    const a = U(w, 'go to contracts and show me the drafts');
    assert.equal(a.place, 'contracts'); assert.equal(a.narrow.what, 'Draft');
  });
  test('A4 a place named with a lead verb moves — on the Board too', () => {
    for (const q of ['go to explorer', 'go to explorer please', 'take me to the explorer']) assert.equal((U(w, q) || {}).place, 'explorer', q);
    assert.equal((U(w, 'go to negotiations') || {}).place, 'negotiations');
  });
  test('A5 "under draft" is Draft, read whole on the Board: the title names Draft, nothing cut', () => {
    const q = 'show me all the contracts that are under draft';
    assert.equal(w.igLeftover(q, w.igConditions(q)), '');
    assert.equal(w.hbParse(q).act, 'dig', 'the Board\'s own free list');
    const long = 'go to explorer and show me all the contracts that are under draft';
    assert.equal(w.hbFoundTitle(long, null), 'Draft', 'named by what was read, never sliced');
    assert.equal(w.hbFoundTitle('x'.repeat(80), null).slice(-1), '…', 'or cut where it shows');
  });
  test('A6 Svenska', () => {
    for (const q of ['gå till utforskaren och visa alla avtal som är utkast', 'visa utkasten i utforskaren']){
      const a = U(w, q); assert.equal(a && a.place, 'explorer', q); assert.equal(a.narrow.what, 'Draft', q);
    }
  });
  test('A7 a page that cannot narrow says so and offers the Contracts place', () => {
    const a = U(w, 'go to parties and show me the drafts');
    assert.equal(a.narrowOff, true);
    assert.match(w.caCardHtml(a, 0), /data-ca-act="andlist"/);
  });
  test('A8 the place\'s own applier: Explorer turns the face and narrows the map', () => {
    const { w: w2, calls } = stage();
    w2.caGo(w2.caUnderstand('go to explorer and show me the drafts'));
    assert.ok(calls.some(c => c[0] === 'face' && c[1] === 'explorer'), JSON.stringify(calls));
    assert.ok(w2.intel.lenses.some(l => /Draft/.test(l.label) && l.ids.length === 2), JSON.stringify(w2.intel.lenses.map(l => l.label)));
  });
});

describe('f811 (B) a contract named any way, and what is asked of it', () => {
  const { w } = stage({ view: 'team' });
  test('B1 "briefing for contracts mk 345" is MK-345\'s brief; none kept, the line says Write the brief costs one call', () => {
    const a = U(w, 'briefing for contracts mk 345');
    assert.equal(a.place, 'brief'); assert.equal(a.cid, 'MK-345');
    assert.match(w.caGoSay(w.caUnderstand('briefing for contracts mk 345')), /no brief yet.*one Jambo call/);
    assert.match(w.caGoSay(w.caUnderstand('brief for MK-1')), /Here is the brief of MK-1/, 'a kept brief is shown free');
  });
  test('B2 the number in any form opens the paper', () => {
    for (const q of ['open mk 345', 'mk345', 'MK-345', 'show me contract 345', 'open contract 345']){
      const a = U(w, q); assert.equal(a && a.place, 'document', q); assert.equal(a.cid, 'MK-345', q);
    }
    assert.equal((U(w, 'open mk 377') || {}).cid, 'MK-0377', 'the zeros let go');
  });
  test('B3 brief, read the brief, summarise', () => {
    for (const q of ['brief for MK-345', 'read the brief of mk 345', 'summarise MK-345']) assert.equal((U(w, q) || {}).place, 'brief', q);
  });
  test('B4 history, redlines, sign, obligations', () => {
    assert.equal(U(w, 'history of mk 345').place, 'history');
    assert.equal(U(w, 'redlines on mk 345').place, 'redline');
    assert.equal(U(w, 'sign mk 345').place, 'sign');
    assert.equal(U(w, 'obligations of mk 345').place, 'oblig');
  });
  test('B4b the overview or the Board, with a contract named: its strip on the Board, on its Overview (owner, 23 Oct 2026)', () => {
    for (const box of ['settings', 'page', 'window']){
      for (const q of ['take me to the board and show me the overview of contact mk 345', 'take me to the board and show me the overview of contract mk 345',
        'show me the overview of mk 345', 'show me mk 345 on the board', 'go to the board and show mk 345']){
        const a = U(w, q, box); assert.equal(a && a.place, 'board', box + ': ' + q); assert.equal(a.cid, 'MK-345', box + ': ' + q);
      }
    }
    assert.equal(U(w, 'history of mk 345 on the board').place, 'history', 'a named page keeps its own');
    assert.equal(U(w, 'who is the contact for mk 345').kind, 'ask', '"contact" not before the number stays the word it is');
    assert.match(w.caGoSay(w.caUnderstand('show me the overview of mk 345')), /Here is MK-345 on the Board, on its Overview/);
    const { w: w2, calls } = stage({ view: 'team' });
    w2.eval("window.hbStripBring = function(id, pg){ __calls.push(['strip', id, pg]); return true; };");
    assert.ok(w2.caGo(w2.caUnderstand('take me to the board and show me the overview of contact mk 345', { box: 'settings' })));
    assert.deepEqual(JSON.parse(JSON.stringify(calls.filter(c => c[0] === 'strip'))), [['strip', 'MK-345', 'ov']]);
  });
  test('B5 a party with one contract is that contract; a party with several is the Contracts place narrowed', () => {
    assert.equal(U(w, 'take me to the siginon contract').cid, 'MK-1');
    const a = U(w, 'nordfrakt contracts'); assert.equal(a.place, 'contracts'); assert.equal(a.narrow.n, 2); assert.equal(a.narrow.party, true);
    assert.equal(U(w, 'take me to the nordfrakt contract').kind, 'cpick', 'two close ones: which did you mean');
  });
  test('B6 a title in a free sentence', () => {
    assert.equal(U(w, 'open the warehouse lease').cid, 'MK-1');
  });
  test('B7 a question about a named contract is asked OF it, never dropped; "what about mk-4?" stays the card', () => {
    assert.equal(U(w, 'what does mk 345 say about termination').kind, 'ask');
    assert.equal(U(w, 'is there a non-compete in MK-345').kind, 'ask');
    assert.equal(U(w, 'what about mk-4?'), null);
    assert.equal(U(w, 'bring up MK-1', 'home'), null, '"bring up" is the Board\'s strip');
  });
});

describe('f811 (C) what stays a box\'s own, and what only settings stop', () => {
  test('C1 Settings\' own words are left to the Settings finder', () => {
    const { w } = stage({ view: 'team' });
    for (const q of ['language', 'change my language', "Set Asha's signing limit to KES 5M", 'Turn on internal review', 'qwertyuiop zxcv']) assert.equal(U(w, q, 'settings'), null, q);
    const { w: w2, calls } = stage({ view: 'team' });
    assert.equal(w2.caAskAnywhere('change my language', { box: 'settings' }), false, 'the finder answers it here');
    assert.ok(!calls.length, JSON.stringify(calls));
  });
  test('C2 the Calendar keeps booking; a contract ask moves', () => {
    const { w } = stage({ view: 'dashboard', face: 'calendar' });
    assert.equal(w.caAskAnywhere('book an hour with Amina on Tuesday', { cal: true }), false);
    assert.equal(U(w, 'open mk 345', 'cal').cid, 'MK-345');
  });
  test('C3 the editor and the builder keep their words; a sure ask leaves', () => {
    const { w } = stage();
    for (const q of ['make this clause mutual', 'add a confidentiality clause', 'NDA for a supplier']) assert.equal(w.caLeavesFor(q, 'editor'), null, q);
    assert.equal(w.caLeavesFor('open mk 345', 'editor').cid, 'MK-345');
    assert.equal(w.caLeavesFor('go to explorer', 'builder').place, 'explorer');
    const CE = R('js/views/clauseeditor.js'), TB = R('js/views/templatebuilder.js');
    assert.match(CE, /caLeavesFor\(q, 'editor'\)[\s\S]{0,600}ceLeaveGuard\(/);
    assert.match(TB, /caLeavesFor\(said, 'builder'\)[\s\S]{0,400}tbLeave\(/);
  });
  test('C4 a number nobody can see is said so; a code-named deal is found by its code name only and stays shut', () => {
    const { w, calls } = stage();
    assert.equal(U(w, 'open MK-999').kind, 'noref');
    assert.equal(w.caUnderstandSay(w.caUnderstand('open MK-999')), 'There is no contract MK-999 that you can see.');
    const a = w.caUnderstand('open project falcon'); assert.equal(a && a.cid, 'MK-9');
    w.codeNameStop = c => !!(c && c._codeNamed);
    assert.equal(w.caGo(a), false, 'the door asks codeNameStop first');
    assert.ok(!calls.some(c => c[0] === 'paper'));
    const non = stage({ admin: false }).w;
    assert.ok(!['team'].includes(((non.jmRead('add a user') || {}).map)), 'an admin\'s task is an admin\'s');
  });
  test('C5 MiniSearch is asked for at start-up, not on idle', () => {
    const MAP = R('js/jambomap.js');
    assert.doesNotMatch(MAP, /requestIdleCallback\(kick/);
    assert.match(MAP, /if \(typeof window !== 'undefined' && typeof document !== 'undefined'\)\{\s*try \{ jmLib\(\); \} catch/);
    const { w } = stage(); assert.equal(w.jmStem('explorer'), 'explor');
    assert.equal((w.jmRead('take me to the explorer') || {}).place, 'explorer');
  });
  test('C6 ⌘K and the top bar find "mk 345" through the one finder', () => {
    const APP = R('js/app.js');
    assert.match(APP, /function commandPaletteResults\(q\)\{[\s\S]*?caContractOf\(q\)/);
    assert.match(APP, /caUnderstand\(q,\{ box:'bar' \}\)/);
    const { w } = stage(); assert.equal(w.caContractOf('mk 345').c.id, 'MK-345');
  });
});

describe('f811 (C2) Settings hands Jambo what is no setting', () => {
  test('C6b a contract named, or "take me" that no setting answers, is Jambo\'s, never "I could not find a setting" (owner, 23 Oct 2026)', () => {
    const S = R('js/views/settings.js');
    const sub = S.slice(S.indexOf("if(!f || f.id!=='st-jb-form') return;"), S.indexOf('stJbAsk(q);', S.indexOf("if(!f || f.id!=='st-jb-form') return;")));
    assert.match(sub, /named=typeof caContractOf==='function'&&!!caContractOf\(q\)/);
    assert.match(sub, /const asks=!rules&&\(ST_JB_ASK_RE\.test\(q\)\|\|named\|\|\(!hits\.length&&ST_JB_GO_RE\.test\(q\)\)/);
    assert.match(sub, /if\(!hits\.length&&asks&&typeof caAiFirst==='function'&&caAiFirst\(\)&&typeof aiAskWords==='function'\)\{ stJbAskJambo\(q\); return; \}/);
  });
});

describe('f811 (D) the wiring: every box asks the one reader first; reading spends nothing', () => {
  const CA = R('js/copilotacts.js'), IG = R('js/views/intelligence.js');
  test('D1 Home\'s box asks it before the screen in front and the Board', () => {
    const ask = IG.slice(IG.indexOf('async function intelAsk('));
    assert.ok(ask.indexOf("caUnderstand(q,{ box:'home' })") > 0 && ask.indexOf("caUnderstand(q,{ box:'home' })") < ask.indexOf('const here=(typeof window.caHereRead'));
  });
  test('D2 every other box through caAskAnywhere, whatever its opts; the map from every box', () => {
    const any = CA.slice(CA.indexOf('function caAskAnywhere('), CA.indexOf('/* ---- "/" IN EVERY JAMBO BOX'));
    assert.match(any, /caUnderstand\(t, \{ box \}\)/);
    assert.match(any, /if \(!a && typeof jmRead === 'function'\)/);
    assert.match(R('js/views/settings.js'), /caAskAnywhere\(q,\{ box:'settings'/);
    assert.match(R('js/ai.js'), /caAskAnywhere\(q,\{ box:'window'/);
  });
  test('D3 reading spends nothing and moves nothing', () => {
    const { w, calls } = stage();
    for (const q of ['go to explorer and show me all the contracts that are under draft', 'briefing for contracts mk 345', 'what does mk 345 say about termination', 'nordfrakt contracts', 'open MK-999']) w.caUnderstand(q, { box: 'home' });
    assert.deepEqual(calls, []);
  });
  test('D4 the Brain knows the reader, the finder and the brief word', () => {
    const B = R('js/brainmap.js');
    for (const k of ["['onereader', 'caUnderstand'", "['contractfind', 'caContractOf'", "['briefword', 'caBriefOpen'"]) assert.ok(B.includes(k), k);
  });
});
