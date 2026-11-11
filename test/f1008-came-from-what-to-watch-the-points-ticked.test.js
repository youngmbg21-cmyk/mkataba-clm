/* f1008 — CAME FROM "WHAT TO WATCH": THE POINTS, TICKED (owner picked "Legora with ticks", 11 Nov 2026)

   The owner: "why is it when i press start redline it and it takes me to editor, there is no reference moving to
   editor asking jambo what to edit?" — Jambo's own points carry no wording, so the editor opened empty and silent.
   The pick: The Legora Way's rows (what is at stake, its words quoted, highlighted on the paper) with The SAP Way's
   tick boxes and one button; then "the numbers are wasting valuable space so delete them. The check box should do
   the job highlight which sentences in the clauses that are in question".

   Start redlining carries the clause's points (stkRedlineGo → land.points); rlLandOn hands them to ceOfferPoints;
   Jambo's panel lists them ticked, no numbers; the ticked points' words are a CSS highlight on the clause (nothing in
   the box moves); one black button drafts for the ticked set through the ONE ask door (ceAsk, the points in the
   playbook line); Not now / the ask box's "N points ×" put them away. Browser half: contract-new-look-verify 13f. */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const CE_RAW = read('js/views/clauseeditor.js');
const CE = strip(CE_RAW);
const BD = strip(read('js/views/breakdown.js'));
const NEGO = strip(read('js/views/negotiation.js'));
const fnSrc = (src, name) => {
  const i = src.indexOf('function ' + name + '('); assert.ok(i >= 0, name + ' exists');
  let d = 0, j = src.indexOf('{', src.indexOf(')', i));
  for (let k = j; k < src.length; k++){ if (src[k] === '{') d++; else if (src[k] === '}' && --d === 0) return src.slice(i, k + 1); }
  throw new Error('unclosed ' + name);
};

function sandbox(pts, tab){
  const ctx = { _cePts: pts, _ceTab: tab || 'chat', ceClause: () => ({}), ceClauseLabel: () => '3. Pricing and Payment',
    _cee: s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'), _ceea: s => String(s),
    _cet: k => ({ stk_watch_h: 'What to watch', ce_pts_tick: 'Include', ce_pts_none: 'Tick a point to draft a fix', ce_pts_off: 'Not now', ce_pts_prompt: 'PROMPT:' }[k] || k),
    _cetn: (k, n, v) => k === 'ce_pts_say' ? 'You came from ' + v.what + ' on ' + v.clause + ' · ' + n + ' points.' : k + '|' + n + '|' + JSON.stringify(v || {}) };
  vm.createContext(ctx);
  vm.runInContext('const cePtsTicked = () => (_cePts ? _cePts.list.filter(p => p.on) : []);\n' + fnSrc(CE, 'cePointsHtml') + '\n' + fnSrc(CE, 'cePointsAsk'), ctx);
  return ctx;
}
const PTS = () => ({ list: [{ t: 'No cap on increases', q: 'AIT may adjust pricing', s: 'need', on: true },
  { t: 'Any new tax lands on us', q: 'significant increases in external costs', s: 'need', on: false },
  { t: 'No set-off', q: 'Payments shall be made in full', s: 'look', on: true }] });

test('f1008 (1) Start redlining carries the clause\'s points: same row, not blank or missing, the open ones first', () => {
  const go = fnSrc(BD, 'stkRedlineGo');
  assert.match(go, /stkShown\(c, b\)\.filter\(x => x && !x\.missing && !x\.blank && stkAt\(x, _stk\.nums \|\| \[\], _stk\.rows\) === row\)/);
  assert.match(go, /const open = same\.filter\(x => !x\.done\);/);
  assert.match(go, /\(open\.length \? open : same\)\.map\(x => \(\{ t: String\(x\.stake \|\| x\.title \|\| ''\), q: String\(x\.quote \|\| ''\)/);
  assert.match(go, /question: q, points \}/);
  const land = fnSrc(NEGO, 'rlLandOn');
  assert.ok(land.indexOf('ceOfferPoints(land.points)') > 0 && land.indexOf('ceOfferPoints(land.points)') < land.indexOf('ceOfferAsk(land.ask'), 'the points first, then a standard\'s ask');
});

test('f1008 (2) the panel: one row per point, a tick box, the words quoted — and NO numbers', () => {
  const html = vm.runInContext('cePointsHtml()', sandbox(PTS()));
  assert.equal((html.match(/<li class="ce-pt/g) || []).length, 3);
  assert.equal((html.match(/role="checkbox"/g) || []).length, 3, 'a tick box on every row');
  assert.equal((html.match(/aria-checked="true"/g) || []).length, 2);
  assert.match(html, /<q class="ce-pt-q">AIT may adjust pricing<\/q>/);
  assert.doesNotMatch(html, /class="n"|lg-r|ce-pt-n/, 'no number markers (owner: "delete them")');
  assert.match(html, /<b>What to watch<\/b>/, 'the place named in bold, as drawn');
  assert.match(html, /You came from <b>What to watch<\/b> on 3 · 3 points\./, 'says the clause number and how many');
  assert.match(html, /data-ce-act="pts-draft">ce_pts_draft\|2\|/, 'the button counts the ticked');
  assert.match(html, /data-ce-act="pts-off">Not now</);
});

test('f1008 (3) nothing ticked: the button greys with its reason (a dead button never wears a live one\'s clothes)', () => {
  const p = PTS(); p.list.forEach(x => { x.on = false; });
  const html = vm.runInContext('cePointsHtml()', sandbox(p));
  assert.match(html, /data-ce-act="pts-draft" disabled aria-disabled="true" title="Tick a point to draft a fix">Tick a point to draft a fix</);
  assert.equal(vm.runInContext('cePointsAsk()', sandbox(p)), '', 'and nothing rides to Jambo');
});

test('f1008 (4) only on the conversation tab, and nothing without points', () => {
  assert.equal(vm.runInContext('cePointsHtml()', sandbox(PTS(), 'ladder')), '');
  assert.equal(vm.runInContext('cePointsHtml()', sandbox(null)), '');
});

test('f1008 (5) the ticked points ride to Jambo beside the question, through the ONE ask door', () => {
  const ask = vm.runInContext('cePointsAsk()', sandbox(PTS()));
  assert.equal(ask, 'PROMPT:\n- No cap on increases (the words: "AIT may adjust pricing")\n- No set-off (the words: "Payments shall be made in full")');
  assert.match(fnSrc(CE, 'ceAsk'), /ceTheirAsk\(\), scope \? '' : cePointsAsk\(\)\]\.filter\(Boolean\)\.join\('\\n'\)/);
  assert.match(fnSrc(CE, 'cePointsDraft'), /ceAsk\(_cetn\('ce_pts_draft_q', k, \{ n: k \}\)\)/, 'the press is a question to the same door');
  assert.doesNotMatch(fnSrc(CE, 'cePointsHtml'), /cost|call|credit/i, 'no Jambo call is said (rule 4, f975)');
});

test('f1008 (6) the words are highlighted, never written into the box; off on Not now and on leaving', () => {
  const paint = fnSrc(CE, 'cePointsPaint');
  assert.match(paint, /CSS\.highlights\.set\(CE_PTS_HL, new globalThis\.Highlight\(\.\.\.ranges\)\)/);
  assert.doesNotMatch(paint, /innerHTML|insertAdjacent|appendChild|wrap/, 'the box is not touched');
  assert.match(paint, /closest\('del, \[data-ce-mark="del"\]'\)/, 'struck words are not lit');
  assert.match(CE, /const CE_PTS_HL = 'ce-watch';/);
  assert.match(CE_RAW, /::highlight\(ce-watch\)\{background-color:var\(--st-amber-bg\)/);
  assert.match(fnSrc(CE, 'cePointsOff'), /_cePts = null;\s*cePointsUnpaint\(\);/);
  assert.match(fnSrc(CE, 'rlCloseClauseEditor'), /_cePts = null; cePointsUnpaint\(\);/);
  assert.match(fnSrc(CE, 'ceSpellMark'), /if \(_cePts\) cePointsPaint\(\);/, 'drawn again on every mount of the box');
});

test('f1008 (7) the ask box carries "N points ×", the quick asks step aside while they are out, a tick is a press', () => {
  const sc = fnSrc(CE, 'ceRenderScope');
  assert.match(sc, /_cetn\('ce_pts_tag', pk, \{ n: pk \}\)[\s\S]{0,80}data-ce-act="pts-off"/);
  assert.match(sc, /ask\.placeholder = _cet\('ce_ask_ph_points'\)/);
  assert.match(CE, /chips\.style\.display = \(\(_ceTab === 'chat' && !_cePts\) \|\| rk\) \? '' : 'none'/);
  assert.match(CE, /const pt = hit\('\[data-ce-pt\]'\);\s*if \(pt\)\{ ev\.preventDefault\(\); cePointsToggle\(pt\.getAttribute\('data-ce-pt'\)\); return; \}/);
  assert.match(CE, /case 'pts-draft': cePointsDraft\(\); break;\s*case 'pts-off': cePointsOff\(\); break;/);
});

test('f1008 (8) every word in both books', () => {
  const I = read('js/i18n.js');
  for (const k of ['ce_pts_say_one', 'ce_pts_say_other', 'ce_pts_tick', 'ce_pts_draft_one', 'ce_pts_draft_other', 'ce_pts_draft_q_one', 'ce_pts_draft_q_other',
    'ce_pts_none', 'ce_pts_off', 'ce_pts_tag_one', 'ce_pts_tag_other', 'ce_ask_ph_points', 'ce_pts_prompt'])
    assert.equal((I.match(new RegExp('\\b' + k + ':', 'g')) || []).length, 2, k);
});
