/* f1077 — JAMBO'S PANELS DO WHAT THEY SAY, AND EVERY BUBBLE IS ROUNDED (owner, 16 Nov 2026: "if I press on needs you
   contracts in the Jambo panel in board page they should take me to the contract and not point me to the board";
   "make sure all the conversation bubbles are rounded as many pages are but some have square endings"):
     1 the Board panel's Needs-you rows carry their own row (data-hbw-row), never the "show the list" door
     2 the board's listener sends such a row to ndRowGo
     3 driven: ndRowGo opens a row's contract on Home (Jambo's piece and your move alike), the week ahead the Calendar,
       and only a row about no one contract the Board's list
     4 every conversation bubble takes the ONE CORNER (--radius), which no list sheet zeroes
     5 the bell: its new-look list (.ndb) is the panel, so Company Open works, a piece's Open opens its contract, and
       a press on a row's words does what its Open does
     6 a choice under an answer stays inside its panel ("…", the whole on hover); a chapter is named in one language
   At the parent (1)–(4) fail: every row said data-hbw="all", there was no ndRowGo, the bubbles took --radius-lg.
   Run: node --test test/f1077-panel-rows-and-round-bubbles.test.js */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const body = (src, name) => { const i = src.indexOf('function ' + name + '('); assert.ok(i >= 0, name + ' exists'); return strip(src.slice(i, src.indexOf('\n}', i) + 2)); };
const HB = read('js/views/homeboard.js'), CN = read('js/views/counter.js'), CSS = read('index.html');

test('f1077 (1) the Board panel rows carry their own row, not the list door', () => {
  const b = body(HB, 'hbBoardHelloHtml');
  assert.match(b, /attr: `data-hbw-row="\$\{_hbE\(r\.key\)\}"`/);
  assert.doesNotMatch(b, /s: \[P\.deal, P\.when\][^\n]*attr: 'data-hbw="all"'/);
});

test('f1077 (2) the board listener sends a panel row to ndRowGo', () => {
  assert.match(body(HB, 'hbOnClick'), /closest\('\[data-hbw-row\]'\)[^\n]*ndRowGo\(wr\.getAttribute\('data-hbw-row'\)\)/);
});

test('f1077 (3) driven: a row opens where its work is', () => {
  const calls = [];
  const c1 = { id: 'MK-1' }, c2 = { id: 'MK-2' };
  const D = { jambo: [{ key: 'p:desk:MK-1:renewal', g: 'jambo', it: { key: 'k1', kind: 'renewal', c: c1 } },
    { key: 'p:round:MK-2', g: 'jambo', it: { key: 'k2', kind: 'answer', c: c2 } },
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
  go('p:desk:MK-1:renewal'); go('p:round:MK-2'); go('p:week'); go('p:many'); go('y:2');
  assert.deepEqual(calls, [['home', 'MK-1', 'oblig'], ['home', 'MK-2', 'red'], ['go', 'calendar'], ['board', 'jambo', 'km'], ['needs', 'details', 'MK-2']]);
});

test('f1077 (4) every conversation bubble takes the one corner', () => {
  assert.match(CSS, /\.ai-msg \.ai-bub, \.ai-msg \.jl-bub\{border-radius:var\(--radius\)\}/);
  assert.match(CSS, /\.hist-bub\{[^}]*border-radius:var\(--radius\);/);
  /* the sheet that squares a list page's parts zeroes --radius-lg only, so --radius still rounds the bubble there */
  assert.match(CSS, /\.sap-page:not\(\.st-page\)[^{]*\{--radius-lg:0px;/);
  assert.doesNotMatch(CSS, /\.sap-page:not\(\.st-page\)[^{]*\{[^}]*--radius:0/);
});

test('f1077 (5) the bell: its new-look list is the panel; Open and the row go where the work is', () => {
  const i = CN.indexOf("document.addEventListener('click', e => {", CN.indexOf('PRESSES, ONE LISTENER EACH'));
  const L = strip(CN.slice(i, CN.indexOf("document.addEventListener('input'", i)));
  assert.match(L, /const inPanel = !!t\.closest\('#panel-body \.nd-pan, #panel-body \.ndb'\);/);
  assert.match(L, /closest\('\[data-nd-look\]'\)\)\)\{ step\(\); const row = inPanel \? el\.closest\('\[data-nd-row\]'\) : null;\s*if \(row\)\{ ndRowGo\(row\.getAttribute\('data-nd-row'\)\); return; \}/);
  assert.match(L, /if \(inPanel && !t\.closest\('button, a, input, select, textarea'\) && \(el = t\.closest\('\[data-nd-row\]'\)\)\)\{/);
});

test('f1077 (6) a choice under an answer stays inside its panel, a chapter named in one language', () => {
  const SRV = read('server/server.js');
  assert.match(body(SRV, 'copilotWayForward'), /if \(h\.kind === 'guide'\) \{ try \{ const ch = HBK\.hbkChapterOf\(h\.ref\); if \(ch\) title = HBK\.hbkPlainOf\(ch\.title, cx && cx\.user && cx\.user\.lang === 'sv' \? 'sv' : 'en', srvHbkWord\);/);
  assert.match(read('js/ai.js'), /data-ai-choice="\$\{i\}:\$\{j\}" title="\$\{_aiEsc\(c\.label\)\}"><span class="igd-ch-t">/);
  assert.match(read('js/views/intelligence.js'), /data-ig-choice="\$\{i\}:\$\{j\}" title="\$\{igEsc\(c\.title\|\|c\.label\)\}"><span class="igd-ch-t">/);
  assert.match(CSS, /\.igd-choices > \.ui-btn\{max-width:100%;min-width:0\}/);
  assert.match(CSS, /\.igd-choices \.igd-ch-t\{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap\}/);
});
