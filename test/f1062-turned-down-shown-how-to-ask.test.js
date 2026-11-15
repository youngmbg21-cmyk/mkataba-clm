/* f1062 · A QUESTION TURNED DOWN IS SHOWN HOW TO BE ASKED (owner, 15 Nov 2026: "i keep getting this wrong and there is
   no better correction to help me phrase the question as i want. Draw a solution where if my question is phrased
   incorrectly, jambo panel kicks in to explain what I did wrong and gives me multiple alternative questions. I can then
   press on one of them which goes into the question field in discover and then i can press read"; picked "the Legora
   way", drawing artifact BJmCs7EDNZ7MV2M8QmLGbt, "go with your recommendations": written by rule with no Jambo call,
   and the panel opens by itself).
   The words that ask for a list are named, and what is left becomes questions ONE contract can answer; a press only
   fills the question box; the reader's own words are kept. Fails at the parent: none of it exists. */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const AC = strip(read('js/views/askcolumn.js')), RD = strip(read('js/views/reads.js')), INS = strip(read('js/views/inspector.js')), I18N = read('js/i18n.js');
const fnBody = (src, name) => { const at = src.search(new RegExp('\\n(?:async )?function ' + name + '\\(')); assert.ok(at >= 0, name + ' exists'); const nx = src.slice(at + 10).search(/\n(?:async )?function /); return src.slice(at, nx > 0 ? at + 10 + nx : undefined); };
const reword = () => { const a = AC.indexOf('const AC_PORTFOLIO_RE'), b = AC.search(/\nfunction askColSay\(/); assert.ok(a >= 0 && b > a, 'the rules stand between the counting rule and the refusal');
  assert.match(AC.slice(a, b), /function askColReword\(/, 'askColReword exists');
  return new Function(AC.slice(a, b) + '; return { askColReword, askColIsPortfolio };')(); };

test('f1062 (1) the words that ask for a list are named, and the rest becomes questions one contract can answer', () => {
  const { askColReword, askColIsPortfolio } = reword();
  const owner = askColReword('show me contracts that state the end date is in between 2026 and 2027');
  assert.equal(owner.hit, 'show me contracts that');
  assert.deepEqual(owner.alts.map(a => a.q), ['Does this contract end between 2026 and 2027?', 'On what date does this contract end?', 'In which year does this contract end?']);
  assert.deepEqual(owner.alts.map(a => a.kind), ['yesno', 'date', 'year']);
  const says = q => askColReword(q).alts.map(a => a.q);
  assert.deepEqual(says('How many contracts mention a rebate?'), ['Does this contract mention a rebate?', 'What does this contract say about a rebate?']);
  assert.deepEqual(says('list contracts that renew automatically'), ['Does this contract renew automatically?']);
  assert.deepEqual(says('which contracts are signed'), ['Is this contract signed?']);
  assert.deepEqual(says('show me the liability cap'), ['Does this contract mention the liability cap?', 'What does this contract say about the liability cap?']);
  assert.deepEqual(says('what is the notice period in these contracts'), ['What is the notice period in this contract?']);
  assert.equal(askColReword('what is the notice period in these contracts').hit, 'these contracts');
  assert.deepEqual(says('do our contracts have a cap'), ['Does this contract have a cap?']);
  /* every question offered is one Discover will read: none is itself a counting question */
  ['show me contracts that state the end date is in between 2026 and 2027', 'How many contracts mention a rebate?', 'which contracts expire in 2027', 'who has a rebate clause', 'count the contracts that say the supplier must insure', 'do our contracts have a cap']
    .forEach(q => { const r = askColReword(q); assert.ok(r.alts.length >= 1, q); r.alts.forEach(a => assert.equal(askColIsPortfolio(a.q), false, a.q)); });
});

test('f1062 (2) words the rules cannot turn are said so: nothing is invented from them', () => {
  const { askColReword } = reword();
  const r = askColReword('how many contracts');
  assert.equal(r.general, true); assert.deepEqual(r.alts, []);
  assert.match(fnBody(RD, 'dsnFixAlts'), /f\.general[\s\S]*dsn_fix_g1[\s\S]*dsn_fix_g3/, 'the page offers its own examples');
  assert.match(fnBody(RD, 'dsnFixHtml'), /f\.general \? 'dsn_fix_said_g' : 'dsn_fix_said'/, 'and Jambo says he could not turn the words');
});

test('f1062 (3) turned down before the page leaves; the panel opens by itself; no Jambo call', () => {
  const ask = fnBody(RD, 'dsnAsk');
  const at = ask.indexOf('dsnFixSet(q)'), go = ask.indexOf("_dsn.screen = 'reading'");
  assert.ok(at > 0 && go > at, 'the question is turned down before the reading screen is drawn');
  assert.match(ask, /got\.portfolio && !more && typed\)\{ dsnFixSet\(typed\)/, 'the read\'s own refusal lands on the same face');
  const set = fnBody(RD, 'dsnFixSet');
  assert.match(set, /askColReword\(q\)/); assert.match(set, /jlFolded\(\) && [\s\S]*jlFoldSet\(false\)/, 'a folded panel is opened');
  ['dsnFixSet', 'dsnFixHtml', 'dsnFixUse', 'dsnFixBack'].forEach(n => assert.doesNotMatch(fnBody(RD, n), /api\(|fetch\(|askColAskHere|aiAsk|intelChatAsk/, n + ' spends nothing'));
  assert.match(fnBody(RD, 'dsnNewPanel'), /if \(_dsc\.fix\) return dsnFixHtml\(\)/);
  assert.match(fnBody(RD, 'dsnPanelPaint'), /_dsc\.fix && !pk[\s\S]*jlTabWord: _rdT\('dsn_fix_tab'\)[\s\S]*jlTab0: \{ label: _rdT\('dsn_fix_overview'\), run: dsnFixShut \}/, 'his name on the tab, the way back before it');
  assert.match(fnBody(INS, 'jlOwnPaint'), /\[data-jl-tab0\]'\)\.forEach\(b => b\.remove\(\)\)[\s\S]*opt\.jlTab0/, 'the way back is put away with the face');
});

test('f1062 (4) a press only fills the box; your words are kept and one press puts them back', () => {
  const use = fnBody(RD, 'dsnFixUse');
  assert.match(use, /f\.used = i; _dsc\.q = a\.q/); assert.doesNotMatch(use, /dsnAsk\(/, 'the read stays the reader\'s press');
  assert.match(fnBody(RD, 'dsnFixBack'), /f\.used = null; _dsc\.q = f\.yours/);
  assert.match(fnBody(RD, 'dsnFixKeptHtml'), /dsn_fix_yours[\s\S]*data-dsn-fix-back/);
  assert.match(RD, /\[data-dsn-fix-use\]'\)\)\)\{ stop\(e\); dsnFixUse\(/); assert.match(RD, /\[data-dsn-fix-back\]'\)\)\{ stop\(e\); dsnFixBack\(\)/);
  /* the counting door stands (owner, 26 Oct 2026): the reader's own words go to Jambo's box on a press */
  assert.match(RD, /\[data-dsn-fix-count\]'\)\)\{ stop\(e\); const f = _dsc\.fix; if \(f && typeof jlAsk === 'function'\) jlAsk\(f\.yours\)/);
  /* typing over a suggestion makes the words the reader's again; a read, a pack, a kept question or New read puts the face away */
  assert.match(RD, /f\.used != null && f\.alts\[f\.used\] && f\.alts\[f\.used\]\.q !== _dsc\.q\)\{ f\.used = null; renderReads\(\)/);
  assert.ok((RD.match(/_dsc\.fix = null/g) || []).length >= 6, 'the face is put away wherever the question is replaced');
});

test('f1062 (5) both books carry every line', () => {
  const keys = ['dsn_fix_tab', 'dsn_fix_overview', 'dsn_fix_say_one', 'dsn_fix_say_other', 'dsn_fix_say_g', 'dsn_fix_said', 'dsn_fix_said_g', 'dsn_fix_like', 'dsn_fix_use', 'dsn_fix_in', 'dsn_fix_undo', 'dsn_fix_count',
    'dsn_fix_yours', 'dsn_fix_put_back', 'dsn_fix_next', 'dsn_fix_read', 'dsn_fix_get_yesno', 'dsn_fix_get_date', 'dsn_fix_get_year', 'dsn_fix_get_say', 'dsn_fix_g1', 'dsn_fix_g2', 'dsn_fix_g3'];
  keys.forEach(k => assert.equal((I18N.match(new RegExp('\\n\\s+' + k + ': ', 'g')) || []).length, 2, k + ' in both books'));
  const hb = read('js/handbook.js');
  assert.match(hb, /Jambo's panel opens to show how to ask it/); assert.match(hb, /Jambos panel öppnas och visar hur du frågar/);
});
