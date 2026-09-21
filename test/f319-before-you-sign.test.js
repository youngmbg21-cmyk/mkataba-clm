/* ============================================================
   f319 — BEFORE YOU SIGN: THE WHOLE LIST, IN THREE STAGES
   ============================================================
   Four reports off the last screen before a signature (Young, 15 Sep 2026),
   and one fault sitting under all of them: the card is called "Before you
   sign", which a reader takes to mean HERE IS EVERYTHING BETWEEN YOU AND A
   SIGNATURE. It was a list of what was blocking at that exact moment, which is
   a different and much less useful thing.

     1  it named CHG ids — a vocabulary the redline column stopped using on
        14 Sep, so the one handle it gave a reader pointed at nothing;
     2  it printed the Signing order card's sentence word for word, 300px
        above that card, with a second Add signers button;
     3  the plain-English edition beside the contract went silently out of
        date after a negotiation — right to draw blank, wrong to say nothing;
     4  and the three readings, with the Run control that answers them, were
        hidden until a signer was named on EACH side. So the card said "3 to
        settle", the reader settled three things, and three more appeared.

   THE FOURTH IS THE ONE WORTH STATING PLAINLY: reading a contract does not
   require knowing who will sign it. You read the thing and then decide who
   signs it. The signers question is a ROW in the list; it was a condition on
   the list being drawn.
   ============================================================ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');

const ROOT = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8');
const SC = read('js/signcheck.js');
const CT = read('js/views/contract.js');
const NG = read('js/negotiation.js');
const HTML = read('index.html');
const I18N = read('js/i18n.js');

const live = (over = {}) => Object.assign({
  id: 'MK-1', name: 'Master Supply', status: 'In Review', counterparty: 'Kestrel Retail Group PLC',
  metadata: {}, compliance: {}, changes: [],
}, over);

describe('f319 (1) A BLOCKER NAMES THE CLAUSE, NOT THE CHG NUMBER', () => {
  test('the naming is the refusal\'s own, so one change cannot have two names', () => {
    assert.match(NG, /function negoBlockerClauses\(list\)\{/, 'one reading');
    assert.match(NG, /const n = negoRefusalClause\(null, ch\);/,
      'through negoRefusalClause — the same naming negoResolve\'s refusals use');
    assert.ok(!/a\.pending\.map\(x => '#' \+ x\.id\)/.test(NG),
      'and the CHG id is no longer a reader\'s only handle');
    assert.ok(!/a\.contested\.map\(x => '#' \+ x\.id\)/.test(NG), 'on either sentence');
  });

  test('MEASURED: two changes on one clause say the clause once, and a long list stops', () => {
    const w = buildWorld({ contracts: ['MK-1'] }).win;
    const ch = (id, label) => ({ id, clauseLabel: label });
    assert.equal(w.negoBlockerClauses([ch('CHG-1', 'Clause 20. Limitation of Liability'),
      ch('CHG-2', 'Clause 20. Limitation of Liability')]), '20. Limitation of Liability',
      'one clause, named once — the reader has one place to go');
    const many = ['Clause 1. A', 'Clause 2. B', 'Clause 3. C', 'Clause 4. D', 'Clause 5. E']
      .map((l, i) => ch('CHG-' + i, l));
    const said = w.negoBlockerClauses(many);
    assert.match(said, /and 2 more/, 'this is a sentence in a list, not a report');
    assert.ok(!/Clause 4|Clause 5/.test(said), 'so it stops at three');
  });

  test('MEASURED: a change whose clause cannot be named says so in words', () => {
    const w = buildWorld({ contracts: ['MK-1'] }).win;
    assert.equal(w.negoBlockerClauses([{ id: 'CHG-9' }]), w.i18t('ng_this_clause'),
      'an honest vague word beats a precise reference to nothing');
    assert.equal(w.negoBlockerClauses([]), '', 'and nothing to name says nothing');
  });

  test('the words are in both books', () => {
    assert.equal((I18N.match(/ng_block_clauses_more:/g) || []).length, 2);
  });
});

describe('f319 (2) A ROW WHOSE WORK IS ON THIS SCREEN POINTS AT IT', () => {
  test('the signers row keeps its hold — it is not a reminder', () => {
    const rows = SC.slice(SC.indexOf('function signBlockers'), SC.length);
    assert.match(CT, /add\('signers', i18t\('ct_no_route_blocks'/,
      'still a blocker: a record sealed with nobody named is the thing it prevents');
  });

  test('and loses the sentence the card below already prints', () => {
    const at = CT.indexOf("case 'signers': acts.push(");
    assert.ok(at > 0, 'the row draws its act and no why');
    assert.ok(!/case 'signers': why=r\.label/.test(CT),
      'one fact printed twice, twelve pixels apart, is the report');
  });

  test('its press lands on the Signing order card, and that card has an anchor', () => {
    assert.match(CT, /<section id="signing-order"/, 'the card names itself');
    assert.match(CT, /if\(signLandOn\('#signing-order'\)\) return;/, 'the row goes there');
    assert.match(CT, /if\(window\.openSignerPlanEditor\) openSignerPlanEditor\(c\);/,
      'and where that card is not drawn the editor is still the answer — a door that goes nowhere is worse');
    assert.match(CT, /function signLandOn\(sel\)\{/, 'one act, lifted out of signLandOnList');
  });
});

describe('f319 (3) THE PLAIN ENGLISH CAPTION SAYS WHEN IT WAS READ', () => {
  test('the staleness rides the caption that is already drawn', () => {
    assert.match(CT, /class="doc-read-moved"/, 'no band, no pop-up, and no pixel off the contract');
    assert.match(CT, /i18tn\('ct_read_moved',moved,\{n:moved\}\)/, 'and it counts what it can no longer speak for');
  });

  test('it reuses the press this column already has, rather than growing a second', () => {
    const cap = CT.slice(CT.indexOf('class="doc-read-moved"'), CT.indexOf('class="doc-read-moved"') + 400);
    assert.match(cap, /data-doc-read-again/, 'one door, shown for its second honest reason');
  });

  test('nothing re-reads by itself', () => {
    assert.ok(!/docReadRun\(c[c]?,\s*\{\s*force:\s*true\s*\}\)\s*;?\s*\}\s*\)\s*;?\s*\/\* auto/.test(CT));
    assert.match(CT, /AND IT NEVER RE-READS BY ITSELF/,
      'a full contract is a real cost the reader has not asked for');
  });

  test('an unchanged contract draws no line at all', () => {
    assert.match(CT, /let moved=0;/, 'zero where the wording has not moved');
    assert.match(CT, /if\(sig&&c\._readSig&&c\._readSig!==sig\)\{/,
      'asked of the signature the reading was made under, never guessed');
  });

  test('the words are in both books', () => {
    for (const k of ['ct_read_moved_one', 'ct_read_moved_other'])
      assert.equal((I18N.match(new RegExp(k + ':', 'g')) || []).length, 2, k);
  });
});

describe('f319 (4a) READING A CONTRACT DOES NOT NEED TO KNOW WHO SIGNS IT', () => {
  test('signCheckReady stopped asking for a signing route', () => {
    const fn = SC.slice(SC.indexOf('function signCheckReady'), SC.indexOf('function signCheckWaiting'));
    assert.ok(!/signingRouteOpen/.test(fn),
      'the signers question is a ROW, never a condition on the list being drawn');
    assert.match(fn, /negoExecuted/, 'a sealed record still has nothing to check');
    assert.match(fn, /'Signed'|'Declined'/, 'and neither has a dead one');
  });

  test('what it used to hide is a WAITING state now, not a second hiding place', () => {
    assert.match(SC, /function signCheckWaiting\(c\)\{/, 'one reason today; a second joins this function');
    assert.match(SC, /return signCheckTableClear\(c\) \? null : 'nego';/,
      'reading wording that is about to move spends money on an answer that will be wrong');
    assert.match(SC, /if \(row\.waiting\) return false;/,
      'and a waiting row does not hold — the row it waits on is already holding');
  });

  test('MEASURED: with nobody named to sign, the readings are drawn', () => {
    const w = buildWorld({ signcheck: true }).win;
    const c = live();
    w.getContract = () => c; w.canViewValues = () => true;
    w.signingRouteOpen = () => false;
    w.resolvePlaybook = () => ({ label: 'Default', positions: [{ category: 'Payment terms' }] });
    const rd = w.signCheck(c);
    assert.equal(rd.ready, true, 'the check has a subject: a live contract with wording');
    const kinds = w.signCheckRows(c).map(r => r.kind);
    assert.ok(kinds.includes('brief'), 'the brief row is there');
    assert.ok(kinds.includes('standards-read'), 'and the standards row');
    assert.ok(kinds.includes('obligations'), 'and the obligations row');
  });

  test('MEASURED: while the negotiation is open the readings wait rather than hide', () => {
    const w = buildWorld({ signcheck: true }).win;
    const c = live();
    w.getContract = () => c; w.canViewValues = () => true;
    w.resolvePlaybook = () => ({ label: 'Default', positions: [{ category: 'Payment terms' }] });
    w.negoOpenPoints = () => [{ id: 'CHG-1' }];
    c.negotiation = { rounds: [] };
    const rows = w.signCheckRows(c);
    const readings = rows.filter(r => ['brief', 'standards-read', 'obligations'].includes(r.kind));
    assert.ok(readings.length >= 2, 'drawn');
    assert.ok(readings.every(r => r.waiting === true), 'and every one says it is waiting');
    assert.ok(readings.every(r => r.holds === false),
      'and holds nothing — one fact holding a signature twice reads as two problems');
  });

  test('the sweep itself refuses while the wording is still moving', () => {
    assert.match(CT, /if\(r\.waiting\)\{ toast\(i18t\('sc_wait_nego'\),'warn'\); return null; \}/,
      'the rows say so, the press is greyed, and the act is walled');
  });
});

describe('f319 (4b) THREE STAGES, IN THE ORDER A PERSON ASKS THEM', () => {
  test('one map says which stage a row belongs to, and an unknown kind is not lost', () => {
    assert.match(SC, /const SIGN_STAGES = \['paper', 'read', 'people'\];/, 'three, named');
    assert.match(SC, /SIGN_STAGE_OF\[String\(kind \|\| ''\)\] \|\| 'paper'/,
      'an unrecognised blocker is something about the paper and draws at the top');
    for (const k of ['negotiation', 'brief', 'standards-read', 'obligations', 'approval', 'signers'])
      assert.ok(new RegExp("\\b" + k.replace('-', '\\-') + "'?: '(paper|read|people)'").test(SC)
        || SC.includes(k + ": '") || SC.includes("'" + k + "': '"), k + ' is placed');
  });

  test('MEASURED: every row lands in exactly one stage', () => {
    const w = buildWorld({ signcheck: true }).win;
    const c = live();
    w.getContract = () => c; w.canViewValues = () => true;
    w.resolvePlaybook = () => ({ label: 'Default', positions: [{ category: 'Payment terms' }] });
    w.signBlockers = () => [{ key: 'negotiation', label: 'x' }, { key: 'signers', label: 'y' }];
    const rd = w.signReadiness(c);
    assert.ok(rd.rows.length >= 4, 'rows to place');
    rd.rows.forEach(r => assert.ok(w.SIGN_STAGES.includes(r.stage), `${r.kind} → ${r.stage}`));
    const byKind = k => (rd.rows.find(r => r.kind === k) || {}).stage;
    assert.equal(byKind('negotiation'), 'paper', 'the wording comes first');
    assert.equal(byKind('brief'), 'read', 'then who has read it');
    assert.equal(byKind('signers'), 'people', 'then the people');
  });

  test('the card draws the stages and an empty one draws nothing', () => {
    assert.match(CT, /const mine=rd\.open\.filter\(r=>stageOf\(r\)===st\);/, 'rows per stage');
    assert.match(CT, /if\(!mine\.length\) return '';/, 'an empty heading is furniture');
    assert.match(CT, /i18t\('sc_stage_'\+st\)/, 'each stage is a question');
  });

  test('the Run control moved onto the readings\' own stage and kept its id', () => {
    assert.match(CT, /const act=\(st==='read'&&rc&&rc\.ready\)/,
      'it runs the readings and nothing else — on their heading it says so by where it is');
    assert.match(CT, /id="sc-run" data-sc-run="1"\$\{busy\|\|rc\.waiting\?' disabled':''\}/,
      'greyed while the wording is still moving, and every older wiring untouched');
    assert.equal((CT.match(/id="sc-run"/g) || []).length, 1, 'one control, one id');
  });

  test('the stage heading is a label, not another card', () => {
    const rule = HTML.slice(HTML.indexOf('.sc-stage-h{'), HTML.indexOf('.sc-stage-act{'));
    assert.ok(!/border:|background:|border-radius:/.test(rule),
      'a question the rows answer, set as a label — no border, no fill, no radius');
    assert.match(HTML, /\.sc-mark\.is-wait\{background:transparent/,
      'and waiting is a hollow ring, never an alarm');
  });
});

describe('f319 (4c) THE BRIEF JOINS THE CHECK', () => {
  test('staleness is asked of the record, and the limit is stated', () => {
    assert.match(SC, /function signCheckBriefAt\(c\)\{/, 'when wording was last proposed');
    assert.match(SC, /walk\(c && c\.changes\);/, 'read RAW');
    assert.match(SC, /if \(n && Array\.isArray\(n\.rounds\)\) n\.rounds\.forEach/, 'closed rounds too');
    assert.match(SC, /IT CAN OVER-REPORT/,
      'a refused change moved no wording — the safe direction, and named');
  });

  test('MEASURED: three answers, and "we do not know" is one of them', () => {
    const w = buildWorld({ signcheck: true }).win;
    const at = t => new Date(t).toISOString();
    assert.equal(w.signCheckBrief(live()).none, true, 'no brief is its own answer');
    const fresh = live({ _brief: { at: at(5000) }, changes: [{ id: 'a', at: at(1000) }] });
    assert.equal(w.signCheckBrief(fresh).stale, false, 'written after the last change');
    const old = live({ _brief: { at: at(1000) }, changes: [{ id: 'a', at: at(5000) }] });
    assert.equal(w.signCheckBrief(old).stale, true, 'wording proposed since');
    const undated = live({ _brief: { at: '' }, changes: [{ id: 'a', at: at(5000) }] });
    assert.equal(w.signCheckBrief(undated).stale, null, 'nothing to compare is not "fine"');
  });

  test('MEASURED: a brief we cannot see draws no row and offers no re-read', () => {
    const w = buildWorld({ signcheck: true }).win;
    const b = w.signCheckBrief(live({ _hasBrief: true }));
    assert.equal(b.none, false, 'the light list carries the flag, not the brief');
    assert.equal(b.unknown, true, 'so it answers unknown');
    assert.equal(b.stale, null, 'guessing here spends the reader\'s money on a reading that may be current');
  });

  test('the light list leaves it out, with the two rows that already were', () => {
    assert.match(SC, /signCheckRows\(c\)\.filter\(r => !\(light && \(r\.kind === 'brief'/,
      'a register row cannot answer it and would answer wrongly');
  });

  test('the sweep runs it, forces where one is on file, and names it in the ask', () => {
    /* ---- RE-POINTED IN PLACE, 17 Sep 2026 ----
       The condition is unchanged and it MOVED: since the run control says how
       many readings the press makes, the three conditions have one home
       (signCheckWillRun) and the sweep asks it. The claim is the same claim at
       its new address, plus the wall the move exists to build — that the sweep
       spends that reading rather than keeping a copy of it. */
    const SC = (() => { try { return require('node:fs').readFileSync(
      require('node:path').join(__dirname, '..', 'js/signcheck.js'), 'utf8'); } catch (_) { return ''; } })();
    assert.match(SC, /out\.brief\s*=\s*brief\.none === true \|\| brief\.stale !== false \|\| brief\.truncated === true;/,
      'unknown asks — the same instinct the other two use');
    assert.match(CT, /const wantBrief=will\.brief/, 'and the sweep spends that one reading');
    assert.match(CT, /const res=await runContractBrief\(c,\{force:!r\.brief\.none\}\);/,
      'the route caches on its own hash, so a stale brief must be forced');
    assert.match(CT, /if\(wantBrief\) parts\.push\(i18t\('sc_will_brief'\)\);/, 'and the ask says so before it spends');
  });

  test('the row has its own press, so the summary can be rewritten alone', () => {
    assert.match(CT, /data-sc-brief="1"/, 'a reader after the summary should not pay for the playbook too');
    /* RE-POINTED IN PLACE 21 Sep 2026. The claim is the PRESS and what it
       spends — one reading, forced where a brief is already on file — and it
       pinned the whole statement including its `await`, so putting the answer
       in a variable (to open the panel on it, Young's own ask) broke a claim
       about something else entirely. Asked of the call now. */
    assert.match(CT, /runContractBrief\(c,\{force:!!c\._brief\}\)/, 'wired, and forced');
    assert.match(CT, /window\.runContractBrief/, 'through window — the ES-module rule');
  });

  test('the words are in both books', () => {
    for (const k of ['sc_brief_never', 'sc_brief_stale', 'sc_brief_cut', 'sc_brief_btn',
      'sc_will_brief', 'sc_stage_paper', 'sc_stage_read', 'sc_stage_people', 'sc_wait_nego'])
      assert.equal((I18N.match(new RegExp('\\b' + k + ':', 'g')) || []).length, 2, k);
  });
});

describe('f319 (5) A PRESS IN THE WORDING DOES NOTHING', () => {
  test('the negotiate page draws no door onto the paper', () => {
    const NGV = read('js/views/negotiation.js');
    assert.ok(NGV.indexOf('A PRESS IN THE WORDING DOES NOTHING') > 0, 'the reversal is written where the door was');
    assert.ok(!/pill\.click\(\)/.test(NGV), 'and nothing presses a pencil for the reader');
  });

  test('the two doors the owner named are untouched', () => {
    const NGV = read('js/views/negotiation.js');
    assert.match(NGV, /\[data-rl-cp-editor\]:not\(\[data-nego-ai-clause\]\)/, 'the pencil');
    assert.match(NGV, /data-rl-cp-editor-row="\$\{_nea\(id\)\}"/, 'and the row\'s Edit');
    assert.match(NGV, /host\.addEventListener\('mouseup'/, 'and a drag still raises the menu');
  });
});
