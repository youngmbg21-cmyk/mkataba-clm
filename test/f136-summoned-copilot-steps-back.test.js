/* ============================================================
   F136 — a summoned Copilot steps back when the errand is done
   ============================================================
   The drawer opens on the same gesture as the selection-menu press
   (rlAiPropose, labAiPropose) — the reader highlighted a passage and asked for
   a rewrite, and the panel appeared to show them the proposal. What it then
   did was STAY: Apply filed the change, Decline dropped it, and either way a
   drawer the reader never asked to keep was still sitting over the document
   they were reading.

   The rule, as the product owner put it: the panel should remember WHY it
   opened. Summoned for a proposal → settling the proposal (Apply, Decline) is
   the end of the errand and the panel goes back to hiding. Opened by the
   reader → it is theirs, and a proposal settled inside it changes nothing;
   only they close it.

   The two agreed edges are pinned by name:
     · Decline settles the errand the same as Apply does.
     · Engaging mid-proposal (Edit, a placement flip) does not claim the
       panel — it still steps back after the final decision.
   And the boundary cases that keep the rule honest: an Apply the handler
   refused settles nothing; a summons landing on an already-open panel does
   not convert it; minimize is the reader claiming the panel. */
const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

/* Same stage as F88/F97/F98/F135, deliberately. */
function loadAi(){
  const el = () => ({ addEventListener(){}, querySelectorAll(){ return []; },
    querySelector(){ return null; }, innerHTML: '', value: '', style: {},
    classList: { add(){}, remove(){}, toggle(){}, contains(){ return false; } },
    focus(){}, setSelectionRange(){}, getBoundingClientRect(){ return { width: 430 }; } });
  const sandbox = {
    console, Date, Math, JSON, Number, String, Object, Array, Boolean, RegExp,
    Set, Map, Error, isNaN, parseInt, parseFloat, setTimeout, Promise,
    document: { getElementById: () => el(), querySelector: () => null,
      querySelectorAll: () => [], addEventListener(){}, createElement: () => el(),
      body: { classList: { toggle(){} } } },
    state: { contracts: [], view: '' }, icon: () => '', esc: s => String(s),
    toast(){}, lsGet(){ return null; }, lsSet(){}, getContract(){ return null; },
    currentUser(){ return { name: 'You' }; }, API_MODE(){ return false; },
    innerWidth: 1400, addEventListener(){},
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  for (const f of ['jurisdiction.js', 'ai.js'])
    vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8'),
      sandbox, { filename: f });
  return sandbox;
}

const propose = (ai, extra) => ai.aiOpenProposal(Object.assign(
  { advice: 'Tighter.', proposedText: 'The Supplier shall invoice on shipment.' }, extra));

/* ============================================================ */
describe('F136a — summoned, settled, gone', () => {
  let ai;
  beforeEach(() => { ai = loadAi(); });

  test('THE FIX: a selection action summons the panel, Apply puts it away', () => {
    ai.openAI(null, { docked: true, summoned: true });
    assert.equal(ai.ai.open, true);
    assert.equal(ai.ai.summoned, true, 'the panel knows why it opened');
    const p = propose(ai);
    ai.aiProposalApply(p.id);
    assert.equal(p.status, 'applied', 'the change was filed first');
    assert.equal(ai.ai.open, false, 'and the errand being done, the panel is gone');
    assert.equal(ai.ai.summoned, false, 'nothing left over for the next open');
  });

  test('Decline settles the errand the same way — the agreed edge', () => {
    ai.openAI(null, { docked: true, summoned: true });
    const p = propose(ai);
    ai.aiProposalDecline(p.id);
    assert.equal(p.status, 'declined');
    assert.equal(ai.ai.open, false);
  });

  test('engaging mid-proposal does not claim the panel — the other agreed edge', () => {
    /* The reader edits the wording and flips the placement before deciding.
       The errand is still running; the panel still steps back at the end. */
    ai.openAI(null, { docked: true, summoned: true });
    const p = propose(ai, { placements: true, placement: 'replace' });
    ai.aiProposalToggleEdit(p.id);
    ai.aiProposalToggleEdit(p.id);
    ai.aiProposalSetPlacement(p.id, 'after');
    assert.equal(ai.ai.summoned, true, 'still an errand, not a claimed panel');
    ai.aiProposalApply(p.id);
    assert.equal(ai.ai.open, false);
  });

  test('an Apply the handler refused settles nothing, so the panel stays', () => {
    ai.openAI(null, { docked: true, summoned: true });
    const p = propose(ai, { onApply: () => ({ ok: false, message: 'The clause is locked.' }) });
    ai.aiProposalApply(p.id);
    assert.equal(p.status, 'open', 'the card is still open');
    assert.equal(ai.ai.open, true, 'and so is the panel — the question is still being asked');
    assert.equal(ai.ai.summoned, true, 'and a later real decision will still put it away');
  });
});

/* ============================================================ */
describe('F136b — a panel the reader opened is theirs', () => {
  let ai;
  beforeEach(() => { ai = loadAi(); });

  test('THE OTHER HALF: opened by hand, a settled proposal changes nothing', () => {
    ai.openAI();
    assert.equal(ai.ai.summoned, false, 'a deliberate open is never a summons');
    const p = propose(ai);
    ai.aiProposalApply(p.id);
    assert.equal(p.status, 'applied');
    assert.equal(ai.ai.open, true, 'the panel was theirs before the proposal and still is');
  });

  test('a summons landing on an already-open panel does not convert it', () => {
    /* The reader had the panel open, then highlighted a passage and picked an
       action — the exact sequence "if I had summoned it and it was already
       there, it should stick around" describes. */
    ai.openAI();
    ai.openAI(null, { docked: true, summoned: true });
    assert.equal(ai.ai.summoned, false, 'the panel was not opened for this errand');
    const p = propose(ai);
    ai.aiProposalDecline(p.id);
    assert.equal(ai.ai.open, true, 'so settling the proposal leaves it standing');
  });

  test('re-opening by hand clears a summons that never resolved', () => {
    /* Summoned, then the reader walked away without deciding, closed it, and
       later opened the panel from the launcher. That open is deliberate. */
    ai.openAI(null, { summoned: true });
    ai.closeAI();
    assert.equal(ai.ai.summoned, false, 'closing settles whatever errand opened it');
    ai.openAI();
    const p = propose(ai);
    ai.aiProposalApply(p.id);
    assert.equal(ai.ai.open, true);
  });

  test('minimize is the reader claiming the panel', () => {
    /* "Keep this going, I will be back" — after that it is theirs, so the
       proposal they come back to decide does not slam the panel shut. */
    ai.openAI(null, { summoned: true });
    ai.minimizeAI();
    assert.equal(ai.ai.summoned, false);
  });

  test('two summonses in a row are still one errand', () => {
    /* Highlight, ask, then highlight something else and ask again without
       touching the first card: the panel is still only there on business, and
       the eventual decision still puts it away. */
    ai.openAI(null, { summoned: true });
    ai.openAI(null, { summoned: true });
    assert.equal(ai.ai.summoned, true);
    const p = propose(ai);
    ai.aiProposalApply(p.id);
    assert.equal(ai.ai.open, false);
  });
});

/* ============================================================ */
describe('F136c — the summoning sites say so', () => {
  /* The flag only means something if the selection actions actually raise it.
     Pinned at the source, the way f135d pins the prompt sentences: both places
     the workbench opens the panel FOR the reader — the propose path and the
     refusal path — pass summoned:true, and the deliberate opens (launcher,
     command bar, negotiation toolbar) do not. */
  const src = f => fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8');

  test('both propose paths and both refusal paths summon', () => {
    for (const f of ['views/negotiation.js']){
      const hits = (src(f).match(/openAI\(null,\s*\{[^}]*summoned:\s*true/g) || []).length;
      assert.equal(hits, 2, `${f}: the propose path and the refusal path both say summoned`);
    }
  });

  test('the deliberate opens do not', () => {
    assert.doesNotMatch(src('app.js'), /openAI\([^)]*summoned/,
      'the launcher and command bar open the panel as the reader\'s own');
  });
});
