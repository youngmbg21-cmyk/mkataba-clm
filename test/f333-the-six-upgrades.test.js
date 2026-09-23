/* ============================================================
   f333 — THE SIX UPGRADES (4 to 9)
   ============================================================
   Young, 18 Sep 2026: *"In an overnight run, implement ideas 4 through 9 and
   the 7 repairs."*  The seven repairs are in f332 beside this; these are the
   six upgrades from "HaTi, today and next", in its own numbering.

   RE-POINTED AND EXTENDED 18 Sep 2026, when each upgrade was built out to the
   drawing in the artifact rather than to its headline. Where a claim reversed,
   the old reasoning is kept beside it.

   Every claim below is red at the parent except these three, which are WALLS —
   they state what must NOT have moved and pass on both sides:
     4c  the picker stays as the other answer on "nothing fits"
     8f  `hold` is NOT on EXECUTED_IMMUTABLE
     9f  the Advice Desk is a different feature and is untouched
   ============================================================ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { startHati, seedWorkspace } = require('./helpers');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

describe('f333 (4) "nothing fits" leads to the door that exists', () => {
  const DR = read('js/draft.js');

  /* RE-POINTED IN PLACE, 18 Sep 2026, when the refusal was built to the
     drawing: it now carries the model's REASON and the NEAREST template it
     could name, and TWO doors rather than one. The claim that matters is
     unchanged — every door is the product's own and this file mints nothing. */
  test('4a the refusal carries a way forward, and it is the product\'s own ask form', () => {
    assert.match(DR, /function draftNothingFits\(out, sentence, why, closest\)/);
    assert.match(DR, /draftNothingFits\(out, sentence, String\(\(r&&r\.why\)\|\|''\), String\(\(r&&r\.closestName\)\|\|''\)\); return;/,
      'the branch hands it the reason and the nearest, both read off the route');
    assert.match(DR, /openIntakeForm\(\{ need:String\(sentence\|\|''\) \}\)/,
      'and the sentence they already typed goes with them');
    assert.ok(!/function openIntakeForm/.test(DR), 'never a second copy of the ask form');
  });

  test('4a2 the reason and the nearest are printed, and absent where nothing was said', () => {
    assert.match(DR, /q\.id='dr-why'/, 'the reason has its own line');
    assert.match(DR, /const said=String\(why\|\|''\)\.trim\(\), near=String\(closest\|\|''\)\.trim\(\);/);
    assert.match(DR, /if\(said\|\|near\)\{/, 'drawn only where there is something to say');
    assert.match(DR, /dr_closest_is/, 'and the nearest is NAMED');
    /* A NAME, NEVER AN ID: the route resolves it, so a reader is not shown a
       template key. */
    assert.match(read('server/server.js'), /closestName/);
    assert.ok(!/dr-closest-go|data-dr-closest/.test(DR),
      'the nearest is named and NOT offered as a press — it did not fit');
  });

  test('4a3 two doors, and the second is drawn only where it would work', () => {
    assert.match(DR, /id='dr-doors'/);
    assert.match(DR, /b\.id='dr-ask-team'/, 'Send this as a request');
    assert.match(DR, /mayMakeNewPaper\(\) && typeof tplLibCreateModal==='function'/,
      'writing new paper is the grant that is off by default — the door is not drawn without it');
    assert.match(DR, /t\.id='dr-write-template'/);
  });

  test('4a4 what happens next is read off the record, and refuses rather than averages', () => {
    const IK = read('js/views/intake.js');
    assert.match(IK, /function intakeAnswerLine\(\)\{/);
    assert.match(IK, /const days=intakeMedianDays\(list\);/, 'borrowed, never a second arithmetic');
    assert.match(IK, /return null;\n\}/, 'nothing to say is null, never a guess');
    assert.match(DR, /n\.id='dr-answers'/);
    assert.match(DR, /if\(!line \|\| !document\.getElementById\('dr-doors'\)\) return;/,
      'and a refusal must never fail over a second fetch');
  });

  test('4b the ask form takes a prefill, additively', () => {
    const IK = read('js/views/intake.js');
    assert.match(IK, /function openIntakeForm\(pre\)/);
    assert.match(IK, /value="\$\{esc\(String\(\(pre&&pre\.title\)\|\|''\)\)\}"/);
    assert.match(IK, /maxlength="4000">\$\{esc\(String\(\(pre&&pre\.need\)\|\|''\)\)\}<\/textarea>/);
    assert.match(IK, /openIntakeForm\(\)\)/, 'every older caller passes nothing and is unchanged');
  });

  test('4c the picker stays as the other answer', () => {
    assert.match(DR, /dr-pick'\)\.addEventListener\('click'/, 'looking for yourself is still on the screen');
  });
});

describe('f333 (5) the contract type the record already holds', () => {
  test('5a one reading on each host, and they are the same reading', () => {
    assert.match(read('js/core.js'), /function contractTypeRead\(c\)\{/);
    assert.match(read('js/core.js'), /contractTypeRead,CKIND_SAYS_NOTHING,/, 'published');
    assert.match(read('server/server.js'), /function copilotContractType\(c\) \{/);
    for (const [f, re] of [['js/core.js', /CKIND_SAYS_NOTHING = \/\^\(external document\|contract\)\$\/i/],
                           ['server/server.js', /COPILOT_KIND_SAYS_NOTHING = \/\^\(external document\|contract\)\$\/i/]])
      assert.match(read(f), re, f + ' — the same two words say nothing');
  });

  test('5b both playbook lookups ask it', () => {
    assert.match(read('js/playbook.js'), /contractTypeRead\(c\):cKind\(c\)\)\|\|''\)\.toLowerCase\(\)/);
    assert.match(read('server/server.js'), /const k = copilotContractType\(c\)\.toLowerCase\(\);/);
  });

  test('5c the curated word wins, and the extraction answers only where it says nothing', () => {
    const body = (() => { const s = read('js/core.js'); const i = s.indexOf('function contractTypeRead');
      return s.slice(i, s.indexOf('\n}', i)); })();
    assert.match(body, /if \(k && !CKIND_SAYS_NOTHING\.test\(k\)\) return k;/);
    assert.match(body, /metadata\) \|\| \{\}\)\.contractType/);
  });

  /* THE REORDERING IS THE BUILD (added 18 Sep 2026). The type and the value
     stream were asked in ONE breath, so an uploaded contract was judged by
     whichever stream somebody filed it in. */
  test('5b2 the type is asked BEFORE the value stream, on both hosts', () => {
    const blank = x => x.replace(/\/\*[\s\S]*?\*\//g, m => ' '.repeat(m.length)).replace(/\/\/[^\n]*/g, m => ' '.repeat(m.length));
    const PB = blank(read('js/playbook.js')), SV = blank(read('server/server.js'));
    const mine = PB.slice(PB.indexOf('function playbookKeyFor(c){'), PB.indexOf('function clauseLibrary'));
    const theirs = SV.slice(SV.indexOf('function copilotPlaybookKey(pb, c) {'));
    for (const [name, body] of [['browser', mine], ['server', theirs.slice(0, theirs.indexOf('\n}') + 2)]]) {
      /* THE BUILT-IN SUPPLY LINE NO LONGER ASKS THE FOLDER IN THE SAME BREATH. */
      assert.ok(!/retail\/\.test\(k\) *\|\| *f/.test(body),
        name + ': the supply pattern must not fall through to the value stream in one condition');
      /* AND THE STREAM TEST COMES AFTER THE "A TYPE WAS READ" ANSWER. */
      const said = body.search(/if *\(?said\)? *return '_default'/);
      const stream = body.search(/f *===? *'proc'/);
      assert.ok(said > -1, name + ': a type that was read and matched nothing takes the baseline');
      assert.ok(stream > said, name + ': the value stream is asked only after that');
    }
    /* THE CUSTOM BOOKS ARE UNTOUCHED AND STILL WIN FIRST, type OR stream —
       a book naming a value stream is a rule this workspace wrote down. */
    assert.match(mine, /\(k\.includes\(w\)\|\|f===w\)/);
    assert.match(theirs, /\(k\.includes\(w\) \|\| f === w\)/);
  });

  test('5b3 "did anybody read a type" carries its own fallback, in the safe direction', () => {
    const PB = read('js/playbook.js');
    assert.match(PB, /const SAYS_NOTHING=\(typeof CKIND_SAYS_NOTHING!=='undefined'\)\?CKIND_SAYS_NOTHING:\/\^\(external document\|contract\)\$\/i;/,
      'js/core.js is not on every stage, and an ABSENT constant read as "a type was read" would take the stream fallback away from every upload');
  });

  test('5e the reading row NAMES the book it used', () => {
    const CT = read('js/views/contract.js');
    assert.match(CT, /const pbBook=\(c&&c\.playbook&&String\(c\.playbook\.label\|\|''\)\.trim\(\)\)\|\|'';/);
    assert.match(CT, /\(pbBook\?' · '\+pbBook:''\)/,
      'a count of departures with no book behind it reads the same whether the right standards were applied or the wrong ones');
    /* THE NAME THE REVIEW STAMPED, never re-resolved — re-asking resolvePlaybook
       would print today's book beside yesterday's verdicts. */
    assert.ok(!/resolvePlaybook\(/.test(CT.slice(CT.indexOf('function ktReadingsRowsHtml'), CT.indexOf('function ktDocsRowsHtml'))),
      'the row must not resolve a book of its own');
    const PB = read('js/playbook.js');
    /* RE-POINTED IN PLACE (fix 3, 23 Sep 2026): the review stamps the label of
       the STANDARDS it checked (pbStandardsFor — the book with the library's
       positions folded in), so the name is `std.label` now. Both branches still
       stamp one. */
    assert.equal((PB.match(/key:std\.key, label:std\.label, verdicts/g) || []).length, 2, 'and both branches of the review stamp one');
  });

  test('5d the Overview prints it, borrowed and not computed', () => {
    const CT = read('js/views/contract.js');
    assert.match(CT, /\['contractType', i18t\('ov_f_type'\), R\.contractType\]/);
    assert.match(CT, /contractType: \(\(\)=>\{ try\{ return esc\(\(window\.contractTypeRead\?contractTypeRead\(c\)/);
    assert.equal((read('js/i18n.js').match(/\n\s+ov_f_type:/g) || []).length, 2, 'both books');
  });
});

describe('f333 (6) the approval card says when nothing is in the way', () => {
  const AP = read('js/approvals.js');

  test('6a the card has a second state, and it is opt-in', () => {
    assert.match(AP, /if\(!st\.required\) return \(opts&&opts\.clear\)/,
      'every older caller still gets nothing back, byte for byte');
    assert.match(AP, /ap_none_needed/);
  });

  /* REBUILT TO THE DRAWING, 18 Sep 2026: one line per rule ACTUALLY CHECKED,
     which is what makes it a receipt rather than a reassurance. The prose
     sentence survives for the one case it is still true of — a workspace with
     no approval rules at all, where there was nothing to check. */
  test('6b it is a receipt: one line per rule that was actually checked', () => {
    assert.match(AP, /function approvalClearRows\(c\)\{/);
    assert.match(AP, /function approvalClearHtml\(c\)\{/);
    assert.match(AP, /APPROVAL_CLEAR_SAYS,approvalClearRows,approvalClearHtml,/, 'published');
    /* IT BORROWS THE ONE READING. A second copy of "does this rule bite" is
       how a card comes to disagree with the gate twelve pixels above it. */
    assert.match(AP, /bit=ruleMatches\(r,c\);/);
    assert.match(AP, /if\(bit\) continue;/, 'a rule that BIT is named by the chain, not by this card');
    /* KEYED ON THE CONDITION TYPE, never the rule's typed name. */
    for (const k of ['value', 'folder', 'kind', 'foreignLaw', 'deviation'])
      assert.ok(new RegExp('(^|[\\s{,])' + k + ':').test(AP.slice(AP.indexOf('const APPROVAL_CLEAR_SAYS'), AP.indexOf('function approvalClearRows'))), k);
    assert.match(AP, /ap_none_needed_checked/);
    assert.match(AP, /i18t\(rows\.length\?'ap_none_needed_checked':'ap_none_needed_why'\)/,
      'and a workspace with no rules gets the old sentence — a receipt for nothing is the reassurance this replaced');
  });

  test('6b2 the lines are the reader\'s own facts, and an absence is not claimed', () => {
    /* MONEY: an NDA carries none at all, which is a better answer than "under
       the threshold", and isMonetary is the ONE reading of it. */
    assert.match(AP, /if\(typeof isMonetary==='function' && !isMonetary\(c\)\) return i18t\('ap_clr_no_money'\);/);
    /* THE MARKET IS NAMED: "foreign law" with no home named is a fact a reader
       cannot check. */
    assert.match(AP, /ap_clr_home_law/);
    assert.match(AP, /jxAdjective/);
    /* THE SIGNING LIMIT is only claimed where one was actually answered. */
    assert.match(AP, /if\(cap\.answered && cap\.limit!=null && !\(typeof signCapBlocker==='function' && signCapBlocker\(c,me\)\)\)/);
    const I = read('js/i18n.js');
    for (const k of ['ap_none_needed', 'ap_none_needed_why', 'ap_none_needed_checked', 'ap_clr_no_money',
                     'ap_clr_value_under', 'ap_clr_value_over', 'ap_clr_not_stream', 'ap_clr_not_kind',
                     'ap_clr_home_law', 'ap_clr_no_departure', 'ap_clr_no_overseer', 'ap_clr_in_cap'])
      assert.equal((I.match(new RegExp('\\n\\s+' + k + ':', 'g')) || []).length, 2, k);
  });

  test('6c the Signing tab asks for it only while the record is open', () => {
    assert.match(read('js/views/contract.js'), /approvalChainHtml\(c,\{bare:true,clear:!closed\}\)/,
      'on a sealed record there is nothing left to decide');
  });
});

describe('f333 (7) the promises are on the phone', () => {
  const MC = read('js/mobile-contract.js');

  test('7a a fourth tab, with the count the desktop tab shows', () => {
    assert.match(MC, /\$\{tab\('oblig'\)\}\$\{i18t\('tab_obligations'\)\}\$\{mObligCountHtml\(c\)\}/);
    assert.match(MC, /s\.tab==='oblig' \? mObligHtml\(c\)/, 'and the dispatch reaches it');
    assert.match(MC, /obligationTabState\(c\)/, 'the desktop tab\'s own reading');
    assert.match(MC, /st\.overdue\?' is-late':''/, 'amber only when something is overdue');
  });

  test('7b every reading is borrowed — this is a renderer and nothing else', () => {
    for (const n of ['obligationBand', 'obligationDue', 'obligationIsTheirs', 'obligationOwner',
                     'obligationAmount', 'obligationTabState'])
      assert.ok(MC.includes(n), n + ' is asked, not re-derived');
    assert.ok(!/function obligationBand|function obState\b/.test(MC), 'no second copy of a reading');
  });

  /* REVERSED IN PLACE, 18 Sep 2026, built to the drawing: "Chase and Mark
     done as the same two acts they are on the desktop, through the same
     funnel." The rule the first build reached for — "the phone files no change
     of its own" — is about a negotiation CHANGE to the wording, and an
     obligation is not one. The renderer still computes nothing. */
  test('7c the two verbs, and they are the desktop\'s own funnel', () => {
    const M = read('js/mobile.js');
    assert.match(MC, /data-m-ob-chase=/);
    assert.match(MC, /data-m-ob-done=/);
    assert.match(M, /await obligationChase\(c\.id, b\.getAttribute\('data-m-ob-chase'\)\);/,
      'the product\'s own chase, which asks its own confirm and its own guards');
    assert.match(M, /if\(o\.status!=='done' && typeof window\.openObligationDone==='function'\)\{ openObligationDone\(c, i\); return; \}/,
      'and the contract room tab\'s own branch — the dialog when completing');
    assert.match(M, /toggleObligation\(c, i, \{ from:'phone obligations tab' \}\);/);
    /* NO SECOND WRITER. The phone presses the verbs; it does not write the
       record itself. */
    const blank = x => x.replace(/\/\*[\s\S]*?\*\//g, m => ' '.repeat(m.length)).replace(/\/\/[^\n]*/g, m => ' '.repeat(m.length));
    const pane = blank(MC.slice(MC.indexOf('THE OBLIGATIONS TAB'), MC.indexOf('THE DOCUMENT TAB')));
    for (const w of ['obligationMarkDone', 'persist(', 'logAudit(', 'changes.push', 'negoFileChange'])
      assert.ok(!pane.includes(w), pane.length && w + ' must not be reachable from the phone\'s tab');
  });

  test('7c2 a verb that cannot work is not drawn', () => {
    assert.match(MC, /if\(may && theirs && !done && typeof obligationChase==='function'\)/,
      'the chase refuses one of ours or one already done, so it is offered only where it would really go out');
    assert.match(MC, /const may = \(typeof canEdit!=='function'\) \|\| canEdit\(\);/, 'a viewer presses neither');
    assert.match(MC, /i18t\(done\?'ob_reopen':'ob_mark_done'\)/);
  });

  test('7c3 the required documents ride in on the same list', () => {
    /* A document obligation IS an ordinary obligation carrying a `doc` shape,
       so it was already in this list; what it gains is its own state line, in
       the desktop table's own tones. */
    assert.match(MC, /const M_OB_DOC_TONE = \{ lapsed:'ruby', missing:'ruby', soon:'amber', held:'' \};/);
    assert.match(read('js/views/contract.js'), /const OV_DOC_TONE=\{ lapsed:'ruby', missing:'ruby', soon:'amber', held:'' \};/,
      'and the two tables agree about what each state looks like');
    assert.match(MC, /obligationDocState\(o\)/);
    assert.match(MC, /data-m-ob-doc="/);
    for (const k of ['ov_doc_lapsed', 'ov_doc_never', 'ov_doc_unsaid'])
      assert.ok(MC.includes(k), k + ' — the desktop\'s own words, never a second set');
  });

  test('7c4 money obeys the same permission, and prints through the product\'s own printer', () => {
    /* THE PERMISSION HALF IS A CONTROL and passes at the parent: it was never
       dropped. What was wrong is the PRINTING — a bare 840000 beside a promise
       is a number, not money, and the contract's own currency is what
       obligationMoneyText knows. */
    assert.match(MC, /obligationMoneyVisible\(\)/);
    assert.match(MC, /obligationMoneyText\(amt, c\)/, 'the desktop rows\' own printer, never a second one');
    assert.match(MC, /\$\{\(money&&amt!=null\)\?/,
      'and where the answer is no the amount is not drawn at all, never as dashes');
  });

  test('7d an empty band draws nothing, and an empty contract says so', () => {
    assert.match(MC, /if\(!rows\.length\) continue;/);
    assert.match(MC, /ob_none_tracked/);
    const I = read('js/i18n.js');
    /* ob_none_tracked was already in both books and is REUSED rather than
       written again — two sentences under one key is this codebase's own named
       fault, and the one it already had is the shorter. */
    for (const k of ['ob_none_tracked', 'ob_no_wording'])
      assert.equal((I.match(new RegExp('\\n\\s+' + k + ':', 'g')) || []).length, 2, k);
  });
});

describe('f333 (8) a contract in dispute is frozen, and more visible', () => {
  const CORE = read('js/core.js'), SRV = read('server/server.js');

  test('8a the field, the predicate and the one act', () => {
    assert.match(CORE, /function contractOnHold\(c\)\{ return !!\(c && c\.hold && c\.hold\.at\); \}/);
    assert.match(CORE, /async function contractSetHold\(c,on,why\)/);
    assert.match(CORE, /contractOnHold,contractSetHold,HOLD_WHY_MAX,HOLD_META,/, 'published');
    assert.match(CORE, /if\(on && !text\)\{ toast\(i18t\('hd_needs_reason'\)/,
      'a freeze nobody can explain later is the thing this exists to avoid');
  });

  test('8b it is a display overlay and outranks the other three', () => {
    assert.match(CORE, /const contractStage = c => contractOnHold\(c\) \? 'On hold'/);
    assert.match(CORE, /const contractStatusMeta = c => contractOnHold\(c\) \? HOLD_META/);
    assert.match(CORE, /const contractStatusChip = c => contractOnHold\(c\)/);
  });

  test('8c it is NOT the archive — it stays on every list', () => {
    const body = CORE.slice(CORE.indexOf('async function contractSetHold'), CORE.indexOf('const HOLD_WHY_MAX'));
    assert.ok(!/archived/.test(body), 'a held contract is not shelved');
    assert.match(read('js/views/register.js'), /contractOnHold\(c\)===want/,
      'and the filter is how you gather them, not how you find one');
  });

  test('8d the server refuses the wording, the negotiation and a signature', () => {
    assert.match(SRV, /if \(prev && prev\.hold && prev\.hold\.at && c\.hold && c\.hold\.at\) \{/,
      'asked of the STORED record, so a save cannot lift its own hold and move the wording at once');
    assert.match(SRV, /SIGNED_WORDING_FROZEN\.concat\(\['changes', 'negotiation', 'signatures', 'execution'\]\)/);
    assert.match(SRV, /heldFreeze: true/);
    const sign = SRV.slice(SRV.indexOf('AND NOTHING IS SIGNED ON A CONTRACT IN DISPUTE'));
    assert.match(sign.slice(0, 900), /r\.action === 'sign'[\s\S]{0,500}hold && j\.hold\.at/);
  });

  test('8e and the browser stops a reader pressing into that refusal', () => {
    assert.match(read('js/views/contract.js'), /if\(window\.contractOnHold && contractOnHold\(c\)\)\{\s*\n\s*add\('hold'/,
      'first in signBlockers — it is not about this contract being ready');
  });

  test('8f hold is NOT frozen at execution — the contracts this is asked of are signed', () => {
    const list = SRV.slice(SRV.indexOf('const EXECUTED_IMMUTABLE'), SRV.indexOf('const SEAL_ACQUIRABLE'));
    assert.ok(!/'hold'/.test(list), 'a sealed contract must still be able to go on hold and come off it');
  });
});

describe('f333 (9) two clauses to an outside adviser', () => {
  const SRV = read('server/server.js'), CORE = read('js/core.js'), ASL = read('js/adviserlink.js');

  test('9a a fifth purpose, on both hosts', () => {
    assert.match(SRV, /const SHARE_PURPOSES = \['negotiate', 'sign', 'view', 'history', 'advise'\];/);
    assert.match(CORE, /\['sign','negotiate','view','history','advise'\]\.includes\(p\)/);
  });

  test('9b it is NOT read-only, and that is the point — a note is the whole product of it', () => {
    assert.match(SRV, /const shareIsAdvice = s => sharePurposeOf\(s\) === 'advise';/);
    assert.match(SRV, /function refuseIfAdvice\(s, res\)\{/);
    /* CODE, NOT PROSE, again: the note between these two lines explains why the
       adviser purpose is deliberately NOT on the read-only reading, so it says
       the word this claim is checking is absent from the code. */
    const strip = x => x.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/\/\/[^\n]*/g, ' ');
    const ro = strip(SRV.slice(SRV.indexOf('const shareIsReadOnly'), SRV.indexOf('const shareIsAdvice')));
    assert.ok(!/advise/.test(ro), 'shareIsReadOnly must not swallow it, or the adviser cannot write a note');
  });

  test('9c every route that touches wording, a decision or a signature asks the guard', () => {
    assert.equal((SRV.match(/if \(refuseIfAdvice\(s, res\)\) return;/g) || []).length, 3,
      'respond, template-values and the signing code');
  });

  test('9d the narrowing is in the payload, never on their page', () => {
    assert.match(CORE, /function shareAdviceBody\(c, ids\)\{/);
    assert.match(CORE, /shareAdviceBody,/, 'published');
    assert.match(CORE, /adviseBody:\(opts&&opts\.purpose==='advise'/);
    assert.match(CORE, /redlineText:\(opts&&opts\.purpose==='advise'\)\?undefined:/,
      'the full wording is dropped in the same breath');
    assert.match(CORE, /clauseSegment/, 'built through the product\'s ONE splitter');
  });

  /* REVERSED IN PLACE, 18 Sep 2026, built to the drawing: the adviser purpose
     is the FIFTH SEGMENT on the send screen's own purpose row, and the
     More-menu row is a PROXY onto it. The first build gave it a dialog of its
     own — a second door onto one act, which is this rulebook's named fault
     class — and this claim held that door in place. */
  test('9e it is the fifth segment on the send screen, and the menu row is a proxy', () => {
    assert.match(CORE, /\$\{seg\('sign'\)\}\$\{seg\('negotiate'\)\}\$\{seg\('view'\)\}\$\{seg\('advise'\)\}/,
      'beside the other purposes on the one-screen row');
    assert.match(CORE, /\$\{btn\('sign'\)\}\$\{btn\('negotiate'\)\}\$\{btn\('view'\)\}\$\{btn\('advise'\)\}/,
      'and on the two-screen shape, or one of them shows a choice the other does not');
    assert.match(ASL, /function openAdviserLink\(c\)\{/);
    assert.match(ASL, /openShareModal\(c, \{ purpose:'advise' \}\)/, 'the proxy presses the one door');
    assert.ok(!/api\('shares','POST'/.test(ASL), 'and mints nothing of its own any more');
    assert.match(read('js/views/contract.js'), /id="ws-advice"/, 'the menu row survives');
    assert.match(read('js/app.js'), /import '\.\/adviserlink\.js'/);
  });

  test('9e2 the one question the other purposes do not ask, and the two facts under it', () => {
    assert.match(CORE, /function shareAdviseBlockHtml\(c, purposeSel\)\{/);
    assert.match(CORE, /shareAdviseBlockHtml,ADVISE_LINK_DAYS,/, 'published');
    assert.match(CORE, /asl_which_clauses/);
    assert.match(CORE, /asl_expires_in/);
    assert.match(CORE, /asl_no_seat/, '"No seat is used." is on the screen, not implied');
    /* BUILT ONCE AND TOGGLED, never rebuilt — the note box above it may
       already carry words the sender typed. #share-signers' own rule. */
    assert.match(CORE, /getElementById\('share-advise'\)\?\.classList\.toggle\('hidden', purposeSel!=='advise'\)/);
    /* AND THE CONTRACT'S SIGNING CHECKS STAND DOWN: nobody is being asked for
       a signature on this link. */
    assert.match(CORE, /getElementById\('share-readiness-wrap'\)\?\.classList\.toggle\('hidden', purposeSel==='advise'\)/);
  });

  test('9e3 the send builds the adviser payload, and refuses an empty one', () => {
    assert.match(CORE, /let payloadObj=buildSharePayload/, 'rebuilt at send time, not edited down');
    assert.match(CORE, /if\(payloadObj\.purpose==='advise'\)\{/);
    assert.match(CORE, /'#share-advise \.asl-cl:checked'/);
    assert.match(CORE, /if\(!ids\.length\)\{ toast\(i18t\('asl_pick_a_clause'\),'err'\); return false; \}/);
    assert.match(CORE, /payloadObj\.purpose!=='advise' && email\)/,
      'and an advice payload is never PUT onto a standing negotiate link');
    /* THE WORD CHANNEL ATTACHES THE WHOLE CONTRACT, which is exactly what this
       purpose exists not to send — a file walks around the payload's
       narrowing. Refused in words, never a silent send of more than was
       chosen. */
    assert.match(CORE, /if\(ch==='word' && payloadObj\.purpose==='advise'\)\{ toast\(i18t\('asl_no_word'\),'err'\); return false; \}/);
    assert.equal((read('js/i18n.js').match(/\n\s+asl_no_word:/g) || []).length, 2, 'both books');
  });

  test('9g NOTHING AN ADVISER WRITES IS EVER VISIBLE TO THE COUNTERPARTY', () => {
    /* THE SERVER IS THE WALL. An adviser posts through the same share-message
       route the counterparty uses, and GET /api/shares/:token served the whole
       table to every link holder. */
    assert.match(SRV, /const MSG_SIDE_ADVISER = 'adviser';/);
    assert.match(SRV, /side: adviser \? MSG_SIDE_ADVISER : 'counterparty',/);
    assert.match(SRV, /function contractMessages\(contractId, opts\) \{/);
    assert.match(SRV, /m\.side !== MSG_SIDE_ADVISER \? true/, 'dropped by default');
    /* EVERY CALL SITE SAYS WHO IS ASKING — a reader that forgets gets the
       walled answer, which is the safe direction. */
    const calls = SRV.match(/contractMessages\([^)]*\)/g) || [];
    assert.ok(calls.length >= 6, 'every reader accounted for');
    for (const call of calls) {
      if (/function contractMessages/.test(call)) continue;
      assert.ok(/adviser: true|adviserToken|shareIsAdvice|undefined\)|\)$/.test(call), call);
    }
    /* THE COUNTERPARTY'S OWN LINK NAMES NO ADVISER TOKEN. */
    assert.match(SRV, /contractMessages\(s\.contract_id, shareIsAdvice\(s\) \? \{ adviserToken: s\.token \} : undefined\)/);
    /* AND A COLLEAGUE SEES THEM: the owner asked the question. */
    assert.match(SRV, /contractMessages\(req\.params\.id, \{ adviser: true \}\)/);
    /* "THE OTHER SIDE SPOKE LAST" MUST NOT COUNT AN ADVISER AS THEM: the
       waiting query reads side = 'counterparty' and a third value keeps it
       honest by construction. */
    assert.match(SRV, /WHERE m\.side = 'counterparty'/);
  });

  test('9f it does not collide with the Advice Desk, which is a different feature', () => {
    assert.ok(fs.existsSync(path.join(ROOT, 'js/advice.js')), 'the Advice Desk model is still there');
    assert.match(read('js/advice.js'), /hydrateAdvice,loadAdviceRequests/,
      'and still publishes what js/core.js reads');
  });
});

/* ============================================================
   THE WALL, DRIVEN: nothing an adviser writes reaches the counterparty
   ============================================================
   The claims above read the source. This one runs the real server and asks it
   the question a counterparty's browser asks — because that is where the hole
   was: an adviser posts through the SAME share-message route the counterparty
   uses, and GET /api/shares/:token served the whole table to every link
   holder. A sweep over the source would have been satisfied by a filter that
   was never reached. */
describe('f333 (9g) driven — an adviser note never reaches the counterparty', () => {
  test('two links on one contract, and only one of them can read the note', async (t) => {
    const h = await startHati();
    t.after(() => h.stop());
    const W = await seedWorkspace(h);
    const cid = 'MK-A2';

    const mk = async purpose => {
      const r = await W.admin.json('/api/shares', { method: 'POST', body: {
        payload: { kind: 'hati-share', purpose, contract: { id: cid, name: 'Raw Milk Collection' } },
        channel: 'link', recipient: { name: 'x', email: purpose + '@example.com' },
        purpose, durable: true } });
      assert.ok(r && r.token, purpose + ' link minted');
      return r.token;
    };
    const adviser = await mk('advise');
    const cp = await mk('negotiate');

    const said = await fetch(h.base + '/api/shares/' + adviser + '/messages', { method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ author: 'John Mwangi', topic: 'general',
        body: 'The liability cap is too low. Push for 24 months.' }) });
    assert.equal(said.status, 200, 'an adviser may leave a note — it is the whole product of the link');

    const readBack = async tok => {
      const r = await fetch(h.base + '/api/shares/' + tok);
      assert.equal(r.status, 200);
      return ((await r.json()).messages || []).map(m => m.body);
    };
    assert.ok((await readBack(adviser)).some(b => /liability cap/.test(b)),
      'the adviser reads their own note back');
    assert.ok(!(await readBack(cp)).some(b => /liability cap/.test(b)),
      "AND THE COUNTERPARTY NEVER SEES IT — the promise printed on the link's own sentence");
    /* AND A COLLEAGUE DOES: they are who asked the question. */
    const mine = await W.admin.json('/api/contracts/' + cid + '/messages');
    assert.ok((mine.messages || []).some(m => /liability cap/.test(m.body)),
      'a signed-in colleague reads it');
    /* THE SIDE IS A THIRD VALUE, so every "the other side spoke last" count
       stays honest by construction. */
    assert.ok((mine.messages || []).some(m => m.side === 'adviser'),
      "an adviser is not filed as the counterparty");
  });
});
