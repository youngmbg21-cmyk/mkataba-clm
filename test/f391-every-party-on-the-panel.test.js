/* ============================================================
   F391 — EVERY PARTY BUT OURS ON THE RIGHT-HAND PANEL (Young ruled it
   26 Sep 2026)
   ============================================================
   "For contracts that have multiple parties, all the parties apart from the
   owner should be listed on the right panels. MK-430 as an example has another
   party in the contract as well but they are not listed on the right panels."

   The list Inspector's head printed the first outside party with "+1" beside
   it and kept the rest on the hover. It lists every outside party now, one
   line each, with the word the paper calls that party beside it where one is
   recorded — on the Contracts, Negotiations and Approvals & signing panels
   (one head builder) and under the contract's name on Our standards'
   departures panel. An ordinary two-party contract draws exactly what it drew.

   RED AT THE PARENT (0e93de1), MEASURED in a worktree: every claim but the
   named ones. 2a is the [control] (the two-party head, byte for byte) and 2d a
   [wall] (our own side was never on the panel, and still is not).
   ============================================================ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');

const ROOT = path.join(__dirname, '..');
const read = rel => { try { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); } catch (_) { return ''; } };
/* Code only — a claim that a name is CALLED must not be satisfied by prose. */
const code = s => String(s || '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1');
const INS = read('js/views/inspector.js');
const LIB = read('js/views/library.js');
const CSS = read('index.html');
/* One function's own region: from its declaration to the next top-level one. */
function fnOf(src, name){
  const at = src.indexOf('function ' + name + '(');
  if (at < 0) return '';
  const next = src.slice(at + 1).search(/\n(?:async )?function [A-Za-z_$]/);
  return src.slice(at, next < 0 ? undefined : at + 1 + next);
}

function world(){
  const w = buildWorld({ registerView: true });
  const win = w.win;
  win.state = Object.assign({}, win.state, { contracts: [] });
  return win;
}
function plain(over){
  return Object.assign({ id: 'MK-430', name: 'Warehousing agreement', counterparty: 'Nordkust Logistics AS',
    status: 'Under Review', folder: 'proc', fields: {}, metadata: {}, audit: [], changes: [] }, over || {});
}
/* MK-430's shape: us, the customer, and a parent company that guarantees it. */
function three(win, third){
  const c = plain();
  const err = win.partiesSet(c, [
    { side: 'ours', name: 'Highland Corporate Ltd' },
    { side: 'theirs', name: 'Nordkust Logistics AS', role: 'Customer' },
    Object.assign({ side: 'theirs', name: 'Nordkust Holding ASA', role: 'Guarantor', involvement: 'sign' }, third || {}),
  ]);
  assert.equal(err, null, 'the stage: three parties are a record the product accepts');
  return c;
}
function head(win, c){
  const d = win.document.createElement('div');
  d.innerHTML = win.insHeadHtml(c, { acts: [] });
  return d;
}
const has = (win, name) => typeof win[name] === 'function';

describe('f391 (1) — one reading: every party but ours, only where there is more than one', () => {
  test('1a an ordinary two-party contract answers nothing — "draw the counterparty as before"', () => {
    const win = world();
    assert.ok(has(win, 'insParties'), 'insParties is published');
    assert.equal(win.insParties(plain()).length, 0);
  });
  test('1b and so does one whose single other party is stored with a role', () => {
    const win = world();
    assert.ok(has(win, 'insParties'), 'insParties is published');
    const c = plain();
    win.partiesSet(c, [{ side: 'ours', name: 'Highland Corporate Ltd' }, { side: 'theirs', name: 'Nordkust Logistics AS', role: 'Customer' }]);
    assert.equal(win.insParties(c).length, 0, 'the two-party head keeps its one name');
  });
  test('1c a three-party contract answers both other parties, in the record\'s order, and never ours', () => {
    const win = world();
    assert.ok(has(win, 'insParties'), 'insParties is published');
    const list = win.insParties(three(win));
    assert.equal(list.map(p => p.name).join(' | '), 'Nordkust Logistics AS | Nordkust Holding ASA');
    assert.ok(!list.some(p => p.side === 'ours'), 'our own side is not a party the panel lists');
  });
});

describe('f391 (2) — the head lists them, one line each', () => {
  test('2a [control] the two-party head is byte for byte what it drew', () => {
    const win = world();
    const h = head(win, plain()).querySelector('h2');
    /* Re-pointed 9 Oct 2026 (SAP benchmark, owner-approved): the counterparty's
       initials sit beside its name, as on every list row; nothing else moved. */
    const av = typeof win.regAvatarHtml === 'function' ? win.regAvatarHtml('Nordkust Logistics AS') : '';
    assert.equal(h.outerHTML, `<h2 class="ins-cp${av ? ' has-av' : ''}" title="Nordkust Logistics AS">${av}<span class="ins-cp-n">Nordkust Logistics AS</span></h2>`);
  });
  test('2b a multi-party head names every other party, each on a line of its own', () => {
    const win = world();
    const lines = [...head(win, three(win)).querySelectorAll('h2 [data-ins-party]')];
    assert.equal(lines.length, 2, 'two parties besides us — MK-430 drew one and "+1"');
    assert.equal(lines.map(l => l.querySelector('.ins-cp-n').textContent).join(' | '), 'Nordkust Logistics AS | Nordkust Holding ASA');
    assert.match(head(win, three(win)).querySelector('h2').className, /\bis-many\b/, 'and the heading is a column');
  });
  test('2c the "+1" count is gone from the head — the names are the count', () => {
    const win = world();
    const h = head(win, three(win)).querySelector('h2');
    assert.equal(h.querySelectorAll('.reg-py-n').length, 0);
    assert.ok(!/\+\d/.test(h.textContent), h.textContent);
  });
  test('2d [wall] our own side is never on the panel', () => {
    const win = world();
    assert.ok(!/Highland Corporate/.test(head(win, three(win)).querySelector('h2').textContent));
  });
  test('2e the word the paper calls each party sits beside its name; none recorded prints none', () => {
    const win = world();
    const lines = [...head(win, three(win, { role: 'Guarantor' })).querySelectorAll('h2 [data-ins-party]')];
    assert.equal(lines.length, 2);
    assert.equal(lines.map(l => (l.querySelector('.ins-cp-r') || {}).textContent || '').join(' | '), 'Customer | Guarantor');
    const bare = [...head(win, three(win, { role: '' })).querySelectorAll('h2 [data-ins-party]')];
    assert.equal(bare[1] && bare[1].querySelectorAll('.ins-cp-r').length, 0, 'no empty role beside a party with none');
  });
  test('2f every line carries its whole line on the hover, the product\'s own one-line reading (partyLine)', () => {
    const win = world();
    const lines = [...head(win, three(win)).querySelectorAll('h2 [data-ins-party]')];
    assert.equal(lines.length, 2);
    assert.equal(lines[1].getAttribute('title'), win.partyLine(win.partiesTheirs(three(win))[1]));
  });
  test('2g a name is printed as written, never as markup', () => {
    const win = world();
    const lines = [...head(win, three(win, { name: 'Moe & Sons <Holding>', role: '' })).querySelectorAll('h2 [data-ins-party]')];
    assert.equal(lines.length, 2);
    assert.equal(lines[1].querySelector('.ins-cp-n').textContent, 'Moe & Sons <Holding>');
  });
});

describe('f391 (3) — one reading, two panels, one dressing', () => {
  test('3a the reading is parties.js\'s own — partiesMulti and partiesTheirs, never a second list', () => {
    const fn = code(fnOf(INS, 'insParties'));
    assert.ok(fn, 'insParties exists');
    assert.match(fn, /partiesMulti\(c\)/);
    assert.match(fn, /partiesTheirs\(c\)/);
  });
  test('3b the head asks it, and no longer reads partiesLead\'s count', () => {
    const fn = code(fnOf(INS, 'insHeadHtml'));
    assert.match(fn, /insParties\(c\)/);
    assert.match(fn, /insPartiesHtml\(/);
    assert.ok(!/partiesLead\(/.test(fn), 'the "+N" reading has no caller in the head');
  });
  test('3c Our standards\' departures panel draws the same lines under the contract\'s name', () => {
    const fn = code(fnOf(LIB, 'sdDevPanelOpts'));
    assert.match(fn, /insParties\(c\)/);
    assert.match(fn, /sub:many\.length\?insPartiesHtml\(many\)/);
  });
  test('3d the heading becomes a column and the role takes the quiet ink', () => {
    assert.match(CSS, /\.ins-cp\.is-many\{display:block;\}/);
    assert.match(CSS, /\.ins-cp-r\{[^}]*color:var\(--color-neutral-600\)/);
  });
});
