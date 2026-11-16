/* f1075 — JAMBO'S PANELS DO WHAT THEY SAY, AND EVERY BUBBLE IS ROUNDED (owner, 16 Nov 2026: "if I press on needs you
   contracts in the Jambo panel in board page they should take me to the contract and not point me to the board";
   "make sure all the conversation bubbles are rounded as many pages are but some have square endings"):
     1 the Board panel's Needs-you rows carry their own row (data-hbw-row), never the "show the list" door
     2 the board's listener sends such a row to ndRowGo
     3 driven: ndRowGo opens a row's contract on Home (Jambo's piece and your move alike), the week ahead the Calendar,
       and only a row about no one contract the Board's list
     4 every conversation bubble takes the ONE CORNER (--radius), which no list sheet zeroes
   At the parent (1)–(4) fail: every row said data-hbw="all", there was no ndRowGo, the bubbles took --radius-lg.
   Run: node --test test/f1075-panel-rows-and-round-bubbles.test.js */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const body = (src, name) => { const i = src.indexOf('function ' + name + '('); assert.ok(i >= 0, name + ' exists'); return strip(src.slice(i, src.indexOf('\n}', i) + 2)); };
const HB = read('js/views/homeboard.js'), CN = read('js/views/counter.js'), CSS = read('index.html');

test('f1075 (1) the Board panel rows carry their own row, not the list door', () => {
  const b = body(HB, 'hbBoardHelloHtml');
  assert.match(b, /attr: `data-hbw-row="\$\{_hbE\(r\.key\)\}"`/);
  assert.doesNotMatch(b, /s: \[P\.deal, P\.when\][^\n]*attr: 'data-hbw="all"'/);
});

test('f1075 (2) the board listener sends a panel row to ndRowGo', () => {
  assert.match(body(HB, 'hbOnClick'), /closest\('\[data-hbw-row\]'\)[^\n]*ndRowGo\(wr\.getAttribute\('data-hbw-row'\)\)/);
});

test('f1075 (3) driven: a row opens where its work is', () => {
  const calls = [];
  const c1 = { id: 'MK-1' }, c2 = { id: 'MK-2' };
  const D = { jambo: [{ key: 'p:desk:MK-1:renewal', g: 'jambo', it: { key: 'k1', kind: 'renewal', c: c1 } },
    { key: 'p:week', g: 'jambo', it: { key: 'kw', kind: 'week', c: null } },
    { key: 'p:many', g: 'jambo', it: { key: 'km', kind: 'dates', c: null } }],
    you: [{ key: 'y:2', y: { k: 'details', x: { c: c2, it: { kind: 'details' } } } }] };
  const sb = {
    ndRead: () => D, ndOpenBoard: (t, k) => { calls.push(['board', t, k]); return true; }, ndBundleGo: () => calls.push(['bundle']),
    getContract: id => [c1, c2].find(c => c.id === id) || null,
    pdOpenOnHome: (id, tab) => { calls.push(['home', id, tab]); return true; }, openWorkspace: id => calls.push(['ws', id]),
    caGo: o => calls.push(['go', o.place]), hbNeedsPress: (k, id) => { calls.push(['needs', k, id]); return true; },
    myNotesOpen: () => {}, watchGo: () => {}, intakeGoTo: () => {}, cnLand: () => {}, cnSel: v => v,
  };
  const go = new Function(...Object.keys(sb), body(CN, 'ndRowGo') + '\nreturn ndRowGo;')(...Object.values(sb));
  go('p:desk:MK-1:renewal'); go('p:week'); go('p:many'); go('y:2');
  assert.deepEqual(calls, [['home', 'MK-1', 'open'], ['go', 'calendar'], ['board', 'jambo', 'km'], ['needs', 'details', 'MK-2']]);
});

test('f1075 (4) every conversation bubble takes the one corner', () => {
  assert.match(CSS, /\.ai-msg \.ai-bub, \.ai-msg \.jl-bub\{border-radius:var\(--radius\)\}/);
  assert.match(CSS, /\.hist-bub\{[^}]*border-radius:var\(--radius\);/);
  /* the sheet that squares a list page's parts zeroes --radius-lg only, so --radius still rounds the bubble there */
  assert.match(CSS, /\.sap-page:not\(\.st-page\)[^{]*\{--radius-lg:0px;/);
  assert.doesNotMatch(CSS, /\.sap-page:not\(\.st-page\)[^{]*\{[^}]*--radius:0/);
});
