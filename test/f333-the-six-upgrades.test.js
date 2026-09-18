/* ============================================================
   f333 — THE SIX UPGRADES (4 to 9)
   ============================================================
   Young, 18 Sep 2026: *"In an overnight run, implement ideas 4 through 9 and
   the 7 repairs."*  The seven repairs are in f332 beside this; these are the
   six upgrades from "HaTi, today and next", in its own numbering.

   Every claim below is red at the parent except those named as controls.
   ============================================================ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

describe('f333 (4) "nothing fits" leads to the door that exists', () => {
  const DR = read('js/draft.js');

  test('4a the refusal carries a way forward, and it is the product\'s own ask form', () => {
    assert.match(DR, /function draftNothingFits\(out, sentence\)/);
    assert.match(DR, /draftNothingFits\(out, sentence\); return;/, 'the branch calls it');
    assert.match(DR, /openIntakeForm\(\{ need:String\(sentence\|\|''\) \}\)/,
      'and the sentence they already typed goes with them');
    assert.ok(!/function openIntakeForm/.test(DR), 'never a second copy of the ask form');
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

  test('6b it names what it checked — an assurance a reader cannot check is worth less than silence', () => {
    assert.match(AP, /ap_none_needed_why/);
    const I = read('js/i18n.js');
    for (const k of ['ap_none_needed', 'ap_none_needed_why'])
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

  test('7c it writes nothing — the phone files no changes of its own', () => {
    /* THE SWEEPS READ CODE, NOT PROSE — the note beside this pane names
       toggleObligation as the thing it deliberately does not press, so a sweep
       over the raw text finds the word in its own reason for not being there. */
    const blank = x => x.replace(/\/\*[\s\S]*?\*\//g, m => ' '.repeat(m.length)).replace(/\/\/[^\n]*/g, m => ' '.repeat(m.length));
    const pane = blank(MC.slice(MC.indexOf('THE OBLIGATIONS TAB'), MC.indexOf('THE DOCUMENT TAB')));
    for (const w of ['toggleObligation', 'obligationMarkDone', 'persist(', 'logAudit('])
      assert.ok(!pane.includes(w), pane.length && w + ' must not be reachable from the phone\'s tab');
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

  test('9e it is its own door, and it mints through the route the send uses', () => {
    assert.match(ASL, /async function openAdviserLink\(c\)/);
    assert.match(ASL, /api\('shares','POST'/, 'the same route, never a second one');
    assert.match(ASL, /purpose:'advise'/);
    assert.match(read('js/views/contract.js'), /id="ws-advice"/);
    assert.match(read('js/app.js'), /import '\.\/adviserlink\.js'/);
  });

  test('9f it does not collide with the Advice Desk, which is a different feature', () => {
    assert.ok(fs.existsSync(path.join(ROOT, 'js/advice.js')), 'the Advice Desk model is still there');
    assert.match(read('js/advice.js'), /hydrateAdvice,loadAdviceRequests/,
      'and still publishes what js/core.js reads');
  });
});
