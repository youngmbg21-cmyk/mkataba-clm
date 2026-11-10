/* ═══════════════════════════════════════════════════════════════════════════
   f999 — ONE LIST, ONE COUNT (owner, 10 Nov 2026: the overnight run's job 3;
   seen on the owner's screenshots: Explorer's Your day said "183 Need you"
   while the Board's Needs you card said "98 things")

   The Board counts the ROWS it draws (ndOnBoard; owner, 9 Nov 2026: "count
   rows") — four details owed bundle into ONE row. The bell, the Guide,
   Jambo's panels and Explorer's Your day asked ndRead().n, which counts every
   thing inside a bundle. Now every reader asks counterNeedsCount, and it is
   the Board's own number.

   AT THE PARENT every test here FAILS: counterNeedsCount returned ndRead().n
   (6 below, not 3) and Explorer's tile summed its own.
   ═══════════════════════════════════════════════════════════════════════════ */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const CN = R('js/views/counter.js');
const IG = R('js/views/intelligence.js');
const fnBody = (src, name) => { const i = src.search(new RegExp('(async )?function ' + name + '\\(')); if (i < 0) return ''; return src.slice(i, src.indexOf('\n}', i) + 2); };
const constLine = (src, name) => { const m = src.match(new RegExp('^(const|let) ' + name + '\\b[^\\n]*$', 'm')); return m ? m[0] : ''; };

const NAMES = ['ndAlerts', 'ndAlCovered', 'ndPieces', 'ndAgeOf', 'ndPieceAge', 'ndKindOf', 'ndRead', 'ndOnBoard', 'counterNeedsCount', 'ndIsNews'];
const CONSTS = ['ND_BUNDLE_MIN', 'ND_MERGE', 'ND_KIND_OF', 'ND_NEWS', 'ND_AL_ROWS', 'ND_AL_PIECES', 'ND_AL_ADMIN', 'ND_AL_KIND', '_ndCid', '_ndHash', 'ndAlKey', '_ndAge', 'ndThings', 'ndRowsN'];
const C = id => ({ id, name: 'Agreement ' + id, counterparty: 'Party ' + id, value: 1e6 });
const BOOK = { 'MK-1': C('MK-1'), 'MK-2': C('MK-2'), 'MK-3': C('MK-3'), 'MK-4': C('MK-4'), 'MK-5': C('MK-5') };
const row = (id, kind) => ({ k: 'c', kind, urgent: false, x: { c: BOOK[id], it: { kind, n: 1 }, age: null } });

function world(newLook){
  /* four details owed (one bundled row on the Board), one approval, one review: three rows, six things */
  const rows = [row('MK-1', 'details'), row('MK-2', 'details'), row('MK-3', 'details'), row('MK-4', 'details'), row('MK-5', 'approval'), row('MK-1', 'review')];
  const ctx = {
    i18t: k => k, i18tn: k => k, todayISO: () => '2026-11-10', setTimeout: () => 0, getContract: id => BOOK[id] || null,
    newLookOn: () => newLook, cnRows: () => rows, cnCompany: () => [], cnSetup: () => 0, buildAlerts: () => [],
    AG_KEYS: [], AG_DEF: {}, agentsData: () => ({ agents: {} }),
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(CONSTS.map(n => constLine(CN, n)).join('\n') + '\nlet _ndMemo = null;\n' + NAMES.map(n => fnBody(CN, n)).join('\n'), ctx);
  return ctx;
}

test('1 the number every door asks is the rows the Board draws, a bundle of details one row', () => {
  const w = world(true);
  const D = w.ndRead();
  assert.equal(D.n, 6, 'the things inside the rows (the reason the two numbers differed)');
  assert.equal(w.ndOnBoard(D).n, 3, 'the Board draws three rows');
  assert.equal(w.counterNeedsCount(), w.ndOnBoard(w.ndRead()).n, 'the panel button, the Guide and Jambo say the Board\'s number');
});

test('2 Explorer\'s Your day figure is that same number, never a second sum', () => {
  const f = fnBody(IG, 'igBriefNeeds');
  assert.match(f, /counterNeedsCount\(\)/, 'it asks the one count');
  assert.doesNotMatch(f.replace(/\/\*[\s\S]*?\*\//g, ''), /n:\s*D\.n/, 'and not ndRead\'s sum of things');
});

test('3 in the old look the Board counts things, and the one count follows it', () => {
  const w = world(false);
  assert.equal(w.counterNeedsCount(), w.ndOnBoard(w.ndRead()).n);
  assert.equal(w.counterNeedsCount(), 6);
});
