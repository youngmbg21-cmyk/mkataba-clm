/* f545 — A PLAYBOOK THAT LEARNS (work order O, part 3, 7 Oct 2026; D5–D7)
   (1) every settled figure is kept with the contract it came from, and the
       standard's own reading returns them oldest first (O-18).
   (2) the figure in the wording is moved in the wording's own style (O-19).
   (3) "keep it" is remembered and lifts on its date or a stronger pattern (O-20).
   (4) the panel draws the evidence and the three choices, confirms in place
       with the wording marked, writes through the one writer with a trail line
       and an Undo (O-18, O-19, O-21); the row says it.
   (5) every new word is in both books. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');

const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
const LIB = read('js/views/library.js');
const I18N = read('js/i18n.js');
const inBoth = k => (I18N.match(new RegExp('\\n    ' + k + ': ', 'g')) || []).length === 2;
function region(src, name){
  const at = src.indexOf('function ' + name + '(');
  assert.ok(at > -1, 'no function ' + name);
  const open = src.indexOf('{', src.indexOf(')', at));
  let d = 0;
  for (let i = open; i < src.length; i++){
    if (src[i] === '{') d++;
    else if (src[i] === '}' && !--d) return src.slice(at, i + 1);
  }
  throw new Error('unbalanced ' + name);
}
const daysAgo = n => new Date(Date.now() - n * 86400000).toISOString();
const change = (id, at, n) => ({ id, clauseId: 'c1', clauseLabel: 'Payment terms', oldText: 'within thirty (30) days',
  newText: `within ${n === 45 ? 'forty-five' : 'sixty'} (${n}) days`, status: 'accepted', authorSide: 'counterparty', createdAt: at, updatedAt: at });
const contract = (id, cp, changes) => ({ id, name: id, counterparty: cp, status: 'Signed', folder: 'proc', fields: {}, metadata: {},
  obligations: [], audit: [], rounds: [], versions: [], signatures: [], comments: [], changes, negotiation: { round: 2 } });
function stage(){
  const { win } = buildWorld({ standards: true });
  win.state = Object.assign(win.state || {}, { settings: {}, contracts: [
    contract('MK-1', 'Kabras Sugar', [change('C1', daysAgo(30), 45)]),
    contract('MK-2', 'Juno Limited', [change('C2', daysAgo(20), 45), change('C3', daysAgo(10), 45)]),
    contract('MK-3', 'Delta LLC', [change('C4', daysAgo(5), 60)]) ] });
  return win;
}

test('f545 (1) the settled rounds behind a standard, oldest first, each with its contract', () => {
  const win = stage();
  const row = win.precedentMine().payment;
  assert.equal(row.settledRounds.length, 4);
  assert.ok(row.settledRounds.every(r => r.contractId && r.figure), 'each names its contract and figure');
  const cl = win.clauseLibrary().find(x => /payment/i.test(x.category || ''));
  assert.ok(cl, 'the library has a payment standard');
  const R = win.stdRoundsFor(cl);
  assert.equal(R.rounds.length, 4);
  assert.equal(R.rounds.map(r => r.figure).join(','), '45,45,45,60', 'oldest first');
  assert.equal(R.contracts, 3);
});

test('f545 (2) the figure moves in the wording\'s own style', () => {
  const win = stage();
  assert.equal(win.stdSwapFigure('The Buyer shall pay within thirty (30) days of a valid invoice.', 30, 45),
    'The Buyer shall pay within forty-five (45) days of a valid invoice.');
  assert.equal(win.stdSwapFigure('Within Ninety (90) days.', 90, 60), 'Within Sixty (60) days.');
  assert.equal(win.stdSwapFigure('pay within 30 days', 30, 45), 'pay within 45 days');
  assert.equal(win.stdSwapFigure('no figure here', 30, 45), null, 'nothing to move is said, not guessed');
});

test('f545 (3) a kept decision is quiet until its date or a stronger pattern', () => {
  const win = stage();
  const p = { figure: 45, seen: 3 };
  const soon = new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10);
  const past = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
  assert.equal(win.stdKeptQuiet({ learnKept: { figure: 45, seen: 3, until: soon } }, p), true, 'kept');
  assert.equal(win.stdKeptQuiet({ learnKept: { figure: 45, seen: 3, until: past } }, p), false, 'its date passed');
  assert.equal(win.stdKeptQuiet({ learnKept: { figure: 45, seen: 2, until: soon } }, p), false, 'the pattern got stronger');
  assert.equal(win.STD_KEEP_DAYS, 182, 'six months');
});

test('f545 (4) the panel draws the evidence, confirms in place, and writes once with a trail and Undo', () => {
  const settled = region(LIB, 'sdSettledHtml');
  assert.match(settled, /sdLearnChartHtml\(R,p\)/, 'the chart');
  assert.match(settled, /sd-learn-stats/, 'three counted figures');
  assert.match(settled, /data-sd-open-c=/, 'each round a door to its contract');
  assert.match(settled, /choice\('preferred'/); assert.match(settled, /choice\('fallback'/); assert.match(settled, /choice\('keep'/);
  assert.match(settled, /diffHtml\(cur,next\)/, 'the wording is shown marked before anything is saved');
  assert.match(settled, /sd_learn_copilot/, 'and says Copilot follows');
  const apply = region(LIB, 'sdLearnApply');
  assert.match(apply, /saveClauseLibrary\(lib\)/, 'through the library\'s one save');
  assert.match(apply, /rec\.learnTrail=/, 'a line on the standard\'s own trail');
  assert.match(apply, /action:\{ label:i18t\('sd_learn_undo'\)/, 'with Undo');
  assert.match(apply, /rec\.learnKept=/, 'keep is remembered');
  assert.match(region(LIB, 'sdClauseListHtml'), /sd-learn-tag/, 'the row says it');
  assert.match(region(LIB, 'sdClausePanelOpts'), /sd_sec_changes/, 'the trail has its section');
});

test('f545 (5) every new word is in both books', () => {
  for (const k of ['sd_learn_tag', 'sd_learn_settled_at', 'sd_learn_stat_rounds', 'sd_learn_see_n_one', 'sd_learn_see_n_other',
    'sd_learn_keep', 'sd_learn_keep_sub', 'sd_learn_confirm_pref', 'sd_learn_change', 'sd_learn_proposed', 'sd_learn_copilot',
    'sd_learn_kept_line', 'sd_trail_pref', 'sd_trail_keep', 'sd_learn_undo', 'sd_sec_changes'])
    assert.ok(inBoth(k), k);
});
