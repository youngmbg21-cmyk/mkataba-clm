/* THE PULSE BOARD (owner, 29 Oct 2026: "Build it" — the prototype "The Pulse Board"; then "add a button to take you
   to the pulse board to the right of the summarize my board and move summarize my board to where the highlight is").
     1 · the Board's head: Summarise my board, then the Pulse board's button, the head's last control
     2 · written by Jambo: our own changes whose provenance says Jambo, split by checked (a review's clearance),
         not yet sent (the ladder's own reading) and sent without any verdict; theirs and a person's never count
     3 · the four rules order the rows as said: work owed first; largest value first; soonest end first, ended after
         the living and no end last; Jambo's unchecked wording first
     4 · READING MUST NOT WRITE: the page asks nothing that initialises a negotiation, saves or calls the server
     5 · every page list names it (rule 9c): the view, the Guide row, the "/" word, a page word, the Brain, the book
   At the parent (before this change) every part fails: js/views/pulse.js does not exist.
   Run: node --test test/f963-the-pulse-board.test.js */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const PU = read('js/views/pulse.js');

/* the page's readings in a box of their own, with the few house readings they ask stood in */
function load(extra){
  const ctx = { console, Date, Math, JSON, Map, Set, Number, String, Array, Object, RegExp, isFinite, setTimeout, clearTimeout, setInterval, clearInterval };
  ctx.window = ctx;
  ctx.todayISO = () => '2026-10-29';
  ctx.i18t = (k, v) => k + (v ? JSON.stringify(v) : '');
  ctx.i18tn = (k, n) => k + ':' + n;
  Object.assign(ctx, extra || {});
  vm.createContext(ctx);
  vm.runInContext(PU, ctx);
  return ctx;
}
const ch = (id, o) => Object.assign({ id, clauseLabel: '9. Termination', newText: 'Either party may end it on sixty days notice.', status: 'pending', authorSide: 'owner', createdAt: '2026-10-28T10:00:00Z', note: 'Jambo — Edit' }, o || {});

test('1 · the Board\'s head: Summarise my board, then the Pulse board, the last control', () => {
  const HB = read('js/views/homeboard.js');
  const head = HB.slice(HB.indexOf('function hbBoardHeadHtml('), HB.indexOf('function hbBoardHeadHtml(') + 900);
  /* RE-POINTED 29 Oct 2026 (owner: "the explorer page has a button next to the pulse"): Explorer ends the row */
  assert.match(head, /\$\{bs\.btn\}\$\{hbPulseBtnHtml\(\)\}\$\{hbExplorerBtnHtml\(\)\}<\/div>/, 'Summarise, the Pulse board, Explorer, then the row ends');
  assert.match(HB, /if \(on\('\[data-hb-explorer\]'\)\)\{ if \(typeof caGo === 'function'\) caGo\(\{ kind: 'go', place: 'explorer' \}\)/, 'Explorer\'s button moves through the one mover');
  const btn = HB.slice(HB.indexOf('function hbPulseBtnHtml('), HB.indexOf('function hbPulseBtnHtml(') + 500);
  assert.match(btn, /class="hb-btn is-sm hb-pulse-go" data-hb-pulse/, 'outlined like Summarise, one door');
  assert.doesNotMatch(btn, /is-primary/, 'no filled button on the head');
  assert.match(HB, /if \(on\('\[data-hb-pulse\]'\)\)\{ if \(typeof pulseOpen === 'function'\) pulseOpen\(\)/, 'the press opens the page');
});

test('2 · written by Jambo: checked, not yet sent, and sent without a verdict', () => {
  const cleared = new Set(['c2']);
  const W = load({ reviewCleared: x => cleared.has(x.id), reviewOn: x => cleared.has(x.id) ? { verdict: 'cleared' } : null, reviewOpenFor: () => null });
  const c = { id: 'MK-1', negotiation: { turnAt: '2026-10-20T00:00:00Z' }, changes: [
    ch('c1'),                                                   /* Jambo, after the hand-over: open */
    ch('c2'),                                                   /* Jambo, cleared by a colleague: not open */
    ch('c3', { createdAt: '2026-10-10T00:00:00Z' }),            /* Jambo, before the hand-over, no verdict: went out unchecked */
    ch('c4', { note: null }),                                   /* a person's own wording */
    ch('c5', { authorSide: 'counterparty' }),                   /* theirs */
    ch('c6', { note: 'Written on the clause editor' }),         /* the editor's own label is a person */
    ch('c7', { status: 'superseded' }),                         /* stepped down */
  ] };
  const J = W.puJamboOf(c);
  assert.equal(J.jambo, 3, 'three of ours carry Jambo\'s provenance');
  assert.equal(J.total, 5, 'five of ours are on the table or went out');
  assert.deepEqual([...J.open.map(x => x.id)], ['c1'], 'only the unchecked, unsent one is open');
  assert.deepEqual([...J.gone.map(x => x.id)], ['c3'], 'the one that went out with no verdict');
  assert.ok(J.share > 0 && J.share < 100, 'his share of our changed words');
  /* held back by a solo send counts as unsent whatever the turn says */
  const c2 = { id: 'MK-2', negotiation: { turnAt: '2026-10-29T00:00:00Z', holdIds: ['h1'] }, changes: [ch('h1', { createdAt: '2026-10-01T00:00:00Z' })] };
  assert.equal(W.puJamboOf(c2).unchecked, 1, 'a held-back change has not left');
  assert.ok(W.puJamboWrote({ note: 'Copilot — Simplify' }), 'notes saved before 11 Oct say Copilot');
  assert.ok(!W.puJamboWrote({ note: 'Playbook — Liability' }), 'a standard filed is the company\'s own wording');
});

test('3 · the four rules order the rows as they say', () => {
  const W = load();
  const row = (id, o) => Object.assign({ id, c: { name: id }, needs: { n: 0, late: 0 }, val: null, left: null, score: 0, J: { unchecked: 0, uncheckedWords: 0, gone: [], share: 0 } }, o);
  const R = [row('a', { score: 3, needs: { n: 1, late: 0 }, val: 5, left: 200 }), row('b', { score: 9, needs: { n: 2, late: 1 }, val: 50, left: -3 }),
    row('c', { score: 0, val: null, left: 12, J: { unchecked: 2, uncheckedWords: 80, gone: [], share: 90 } }), row('d', { score: 3, needs: { n: 1, late: 0 }, val: 9, left: null })];
  const ids = crit => W.puSort(R, crit).map(r => r.id).join('');
  assert.equal(ids('needs'), 'bdac', 'work owed first; a tie goes to the larger value');
  assert.equal(ids('money'), 'bdac', 'largest value first, the ones that cannot rank last');
  assert.equal(ids('days'), 'cabd', 'soonest end first, the ended after the living, no end date last');
  assert.equal(ids('jambo').charAt(0), 'c', 'Jambo\'s unchecked wording first');
});

test('4 · reading must not write', () => {
  const code = strip(PU);
  for (const w of ['negoInit(', 'negoChanges(', 'negoAllChanges(', 'negoPending(', 'negoUnsentAsks(', 'reviewState(', 'persist(', 'saveState(', "api('", 'fetch(', 'contractSave'])
    assert.ok(!code.includes(w), 'the page never asks ' + w);
  assert.ok(code.includes("ndRead()"), 'what needs you is the one desk\'s reading');
  assert.ok(code.includes('fxRankValue('), 'money ranks by the book\'s own reading');
  assert.ok(code.includes('effectiveExpiry('), 'days left reads the amended end');
});

test('5 · every page list names it (rule 9c)', () => {
  const APP = read('js/app.js'), CORE = read('js/core.js'), CA = read('js/copilotacts.js'), NAV = read('js/navmap.js'), BR = read('js/brainmap.js'), HBK = read('js/handbook.js');
  assert.match(APP, /import '\.\/views\/pulse\.js';/);
  assert.match(APP, /else if\(view==='pulse'\) renderPulse\(\);/);
  assert.match(APP, /pulse:\['puPlace','puPlacePut'\]/, 'a refresh lands at the same spot');
  assert.match(APP, /\{ k: 'see', rows: \['board', 'pulse', 'explorer', 'house'\] \}/, 'the Guide row, beside the Board');
  assert.match(CORE, /'handbook','pulse'/, 'setView knows it at start');
  assert.match(CA, /\{ k: 'pulse', w: \['pulse', 'pulse board'/, 'the "/" word');
  assert.match(CA, /'reads', 'pulse', 'handbook'/, 'its name typed moves there free');   /* RE-POINTED 29 Oct 2026: Insights left the list on main */
  assert.match(NAV, /\['pulse', \/ \(pulse board\|/, 'navigable by typing');
  assert.ok(BR.includes("['pulse', 'renderPulse', 'see', 0]"), 'the Brain names it');
  assert.match(BR, /\[\/\^js\\\/views\\\/pulse\\\.js\$\/, 'see'\]/, 'and gives the file its area');
  assert.match(HBK, /\{ k: '6\.1\.1', part: 'see', round: 2,/, 'the Handbook chapter (rule 9d)');
  const EN = (() => { const s = read('js/i18n.js'); return s.slice(s.indexOf('  en: {'), s.indexOf('  sv: {')); })();
  const SV = (() => { const s = read('js/i18n.js'); return s.slice(s.indexOf('  sv: {')); })();
  for (const k of ['nav_pulse', 'ca_w_pulse', 'gd_p_pulse', 'gd_w_pulse', 'hb_pulse_btn', 'pu_c_jambo', 'pu_say_j_open_one', 'pu_say_free'])
    for (const [nm, B] of [['English', EN], ['Swedish', SV]]) assert.ok(new RegExp('\\n    ' + k + ':').test(B), k + ' is in the ' + nm + ' book');
  /* every word the page asks is in both books */
  const keys = [...new Set([...PU.matchAll(/_puTn?\('([a-z_]+)'/g)].map(m => m[1]))].filter(k => !k.endsWith('_'));
  for (const k of keys) for (const [nm, B] of [['English', EN], ['Swedish', SV]])
    assert.ok(new RegExp('\\n    ' + k + '(_one|_other)?:').test(B), k + ' is in the ' + nm + ' book');
});
