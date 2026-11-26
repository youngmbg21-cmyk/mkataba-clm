/* f1246 — FILL-INS ARE ANSWERS, NOT REDLINES, AND THEY COME AFTER THE NEGOTIATION (owner, 26 Nov 2026: "Fill in should not
   be a redline and should likely not come before negotiations. You should negotiate or redline a contract and once you
   are done, you then fill in the contract right before signing … For counter party contracts or 3rd party contracts,
   they should be filled in using their tools", then "build all steps autonomously and merge").
   Step 1: the stages read Arrive · Read · Negotiate · Fill · Sign · Live; Fill in waits while a change is open (said, with
           the way to Redlines); their paper (an upload) has no Fill in at all.
   Step 2: an answer is kept on c.fills by the one writer (negoFillsSet), never filed as a change; drawn in its space on
           every face and on their page (negoFillsPaint at the end of redlineDocHtml), written into the wording that
           travels and is sealed (negoCommitBody → negoFillsBody); it travels on the link and is frozen once signed.
   Step 3: an old Fill in change of ours not yet sent is taken back and its answers kept as answers (pd2FillAdoptOld). */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');
const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const fnSrc = (src, name) => {
  const at = src.search(new RegExp('\\n(?:async )?function ' + name + '\\(')); assert.ok(at >= 0, name + ' exists');
  let i = src.indexOf('{', at), d = 0;
  for (; i < src.length; i++){ if (src[i] === '{') d++; else if (src[i] === '}' && --d === 0) break; }
  return strip(src.slice(at + 1, i + 1));
};
const PD = read('js/paperdesk.js'), NG = read('js/negotiation.js');

test('f1246 step 1: negotiate, then fill in — the stages in that order everywhere', () => {
  assert.match(PD, /const DOSSIER_STAGES = \['arrive', 'read', 'nego', 'fill', 'sign', 'live'\];/);
  assert.match(read('js/dealstands.js'), /const DP_STAGES = \['arrive', 'read', 'nego', 'fill', 'sign', 'live'\];/);
  assert.match(read('js/mobile-contract.js'), /const ST = \['arrive','read','nego','fill','sign','live'\]/);
  const ds = fnSrc(read('js/dealstands.js'), 'dpStages');
  assert.ok(ds.indexOf("k: 'nego'") < ds.indexOf("k: 'fill'"), 'the stages drawn on the deal page too');
  assert.match(fnSrc(PD, 'dossierNowStage'), /negoFillOpenCount\(c\) > 0\) return 'nego';/, 'a draft with a change open is negotiating');
});

test('f1246 step 1: Fill in waits for the table to clear, and their paper is theirs to fill', () => {
  const held = fnSrc(PD, 'pd2FillHeldWhy');
  assert.match(held, /pd2RoadPaper\(c\) === 'theirs'\) return 'theirs';/);
  assert.match(held, /negoFillOpenCount\(c\) > 0\) return 'open';/);
  const say = fnSrc(PD, 'pd2FillHeldSay');
  assert.match(say, /toast\(why === 'theirs' \? _pdT\('pd2_fill_theirs'\) : _pdTn\('ng_fill_finish_first', n, \{ n \}\), 'warn'\)/);
  assert.match(say, /if \(why === 'open'\) try \{ pdRedOpen\(c\.id\); \}/, 'its way forward: Redlines');
  for (const name of ['pdFillGo', 'pd2FillFromPress']) assert.match(fnSrc(PD, name), /pd2FillHeldSay\(/, name + ' says it, never the form in its place');
  assert.match(fnSrc(PD, 'pd2FillStart'), /if \(pd2FillHeldWhy\(c\) === 'theirs'\) return false;[\s\S]*if \(pd2FillHeldWhy\(c\)\) return false;/);
  assert.match(fnSrc(PD, 'pd2NegoFillOn'), /isUpload\(c\)\) return false;/);
  assert.match(fnSrc(read('js/uploadblanks.js'), 'uploadBlanksTheirs'), /return !!\(typeof isUpload === 'function' && isUpload\(c\)\);/, 'every upload stands its form down');
  const open = fnSrc(NG, 'negoFillOpenCount');
  assert.match(open, /x\.status === 'pending' \|\| x\.status === 'countered'\) && !negoIsFillChange\(x\)/, 'read RAW; an old Fill in change aside');
  assert.doesNotMatch(open, /negoInit|negoChanges\(/);
  const I = read('js/i18n.js');
  for (const k of ['ng_fill_finish_first_one', 'ng_fill_finish_first_other', 'pd2_fill_theirs', 'ng_fill_answer'])
    assert.equal((I.match(new RegExp('\\b' + k + ':', 'g')) || []).length, 2, k + ' in both books');
});

test('f1246 step 2: the one writer keeps answers, never a change, and refuses an open table or signed wording', () => {
  const w = strip(NG.slice(NG.indexOf('\nfunction negoFillsSet('), NG.indexOf('\n}', NG.indexOf('\nfunction negoFillsSet(')) + 2));
  assert.match(w, /mayActOn\(c\)\)\{ negoFillLastRefusal = i18t\('viewer_reads_only'\); return false; \}/);
  assert.match(w, /if \(negoWordingFrozen\(c\)\)\{/);
  assert.match(w, /if \(open && !opts\.adopt\)\{ negoFillLastRefusal = i18tn\('ng_fill_finish_first'/);
  assert.match(w, /negoCommitBody\(c, negoResolvedBody\(c\)\);/);
  assert.doesNotMatch(w, /negoFileChange|negoEditClause|changes\.push/, 'never a change');
  assert.match(fnSrc(NG, 'negoCommitBody'), /body = negoFillsBody\(c, body\);/, 'the wording that travels and is sealed carries them');
  assert.match(read('js/views/negotiation.js'), /return _fillsPaint\(c, `<div class="rl-zoom"/, 'every drawn face carries them');
  assert.match(read('js/core.js'), /fills:\(c\.fills&&typeof c\.fills==='object'&&Object\.keys\(c\.fills\)\.length\)\?JSON\.parse\(JSON\.stringify\(c\.fills\)\):undefined,/, 'they travel on the link');
  const S = read('server/server.js'); const L = S.slice(S.indexOf('const EXECUTED_IMMUTABLE'), S.indexOf('];', S.indexOf('const EXECUTED_IMMUTABLE')));
  assert.match(L, /'fills',/, 'frozen once signed');
  assert.match(read('js/views/intelligence.js'), /\(window\.pd2NegoPaperOk&&pd2NegoPaperOk\(c\)\)/, 'a clear table still draws the canvas the answers sit on');
});

test('f1246 step 2: the answers are put in their spaces, by kind, words and occurrence, never in struck words', () => {
  const { win } = buildWorld({ blanks: true });
  const doc = win.document;
  const host = doc.createElement('div');
  host.innerHTML = '<p>Between [Name] and [Name], at <span class="hati-field" data-field-key="addr">address</span>. <del>[Name] once</del> Rent [Rent].</p>';
  const seq = JSON.parse(JSON.stringify(win.negoFillSeq(host).map(b => b.sig + '~' + b.n)));
  assert.deepEqual(seq, ['u:[Name]~0', 'u:[Name]~1', 'f:addr~0', 'u:[Rent]~0'], 'struck words are never walked');
  const n = win.negoFillsInto(host, { 'u:[Name]~1': 'Denta Ltd', 'f:addr~0': '14 Riverside', 'u:[Rent]~0': '4,500' },
    (b, v) => { const sp = doc.createElement('span'); sp.className = 'ans'; sp.textContent = v; return sp; });
  assert.equal(n, 3);
  assert.equal(host.textContent, 'Between [Name] and Denta Ltd, at 14 Riverside. [Name] once Rent 4,500.');
  assert.equal(host.querySelectorAll('span.ans').length, 3);
});

test('f1246 step 2: on the paper, an open table and our paper read as the owner said', () => {
  const { win } = buildWorld({ blanks: true });
  const c = { id: 'MK-1', changes: [{ id: 'a', status: 'pending', authorSide: 'counterparty' }, { id: 'b', status: 'pending', authorSide: 'owner', note: 'Filled in on the paper' },
    { id: 'c', status: 'accepted', authorSide: 'owner' }, { id: 'd', status: 'pending', authorSide: 'owner', withdrawn: { by: 'x' } }] };
  assert.equal(win.negoFillOpenCount(c), 1, 'their ask is open; our old Fill in change and settled ones are not');
  assert.equal(win.negoIsFillChange(c.changes[1]), true);
  assert.equal(win.negoFillsOn({ fills: { front: {} } }), false, 'an empty clause holds nothing');
  assert.equal(win.negoFillsOn({ fills: { front: { 'u:[A]~0': 'x' } } }), true);
  assert.equal(win.negoWordingShared({ negotiation: { turnAt: '2026-11-01' } }), true);
  assert.equal(win.negoWordingShared({ negotiation: {} }), false, 'a paper nobody has seen is not shared');
});

test('f1246 step 3: an old Fill in change not yet sent becomes answers, on a press only', () => {
  const a = fnSrc(PD, 'pd2FillAdoptOld');
  assert.match(a, /negoIsFillChange\(x\) && x\.status === 'pending'/);
  assert.match(a, /const own = pd2NegoOwnFill\(c, x\.clauseId\); if \(!own \|\| own\.id !== x\.id\) return;/, 'not yet sent: still ours to take back');
  assert.match(a, /negoRetractDraft\(c, x\.id, \{ side: 'owner', quiet: true \}\)/);
  assert.match(a, /negoFillsSet\(c, x\.clauseId, merged, \{ hold: true, adopt: true \}\)/);
  for (const name of ['pd2FillStart', 'pdFillGo', 'pd2FillFromPress']) assert.match(fnSrc(PD, name), /pd2FillAdoptOld\(/, name + ': only on a press of Fill in');
  assert.doesNotMatch(fnSrc(PD, 'pd2NotesPaint'), /pd2FillAdoptOld/, 'never on a read');
});
