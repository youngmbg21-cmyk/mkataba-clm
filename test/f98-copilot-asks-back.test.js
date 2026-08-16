/* ============================================================
   F98 — the Copilot asking a question is not a redline
   ============================================================
   Two defects, found together on one screenshot, from one session: a drafter
   selected the price-adjustment and invoicing sub-paragraphs of a clause and
   typed "combine them".

     · THE MODEL COULD NOT SEE THE CONVERSATION. A seeded session held the
       passage and nothing else, so the instruction went to the model with the
       passage and that one sentence — the turns before it were dropped. "them"
       arrived as a pronoun with no antecedent, and the model, reasonably, asked
       what was meant. Worse: the ANSWER would have gone out the same way, so a
       session that once needed clarifying could never get out of the loop.

     · AND THE QUESTION IT ASKED WAS DRAWN AS CONTRACT WORDING. The guard that
       keeps a model's remarks out of the proposal card only knew how to spot a
       REFUSAL — "I'm sorry", "I cannot", "this is not legal advice". A question
       matches none of those, so the whole reply — bullet points, "Please
       share:", the lot — was handed to the card and given an Apply Redline
       button. One press would have filed it into clause 4.2 as a tracked
       change: wording nobody drafted, on the record, on its way to a
       counterparty. Silent, plausible-looking, and it survives to a signature.

   The two halves are tested apart because they fail apart. A question caught by
   the guard is still a wasted round trip if the model never had the context; a
   model with the context still needs the guard the day it asks anyway.

   THE THIRD FILE IN THIS FAMILY. F88 pins the refusal patterns and F97 the
   placements; this one pins the question, the session's memory, and the
   false-positive direction — real contract wording that merely reads a bit like
   a person talking must still reach the card, because a guard that eats real
   wording is the same harm pointing the other way. */
const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { buildWorld } = require('./world');

/* ai.js wires the panel's buttons at load, so it needs a stage. Same shape as
   F88's and F97's loaders, deliberately. */
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
  /* js/jurisdiction.js first, the order js/app.js loads it in: ai.js asks it
     what law this workspace is under and what money looks like. */
  for (const f of ['i18n.js', 'jurisdiction.js', 'ai.js'])
    vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8'),
      sandbox, { filename: f });
  return sandbox;
}

/* The reply from the screenshot, verbatim. This exact string was drawn in the
   proposal card with an Apply Redline button under it. */
const THE_QUESTION = `I need to see the full context of what the drafter wants me to combine. You've shown me clauses 4.2 and 4.3 (Price Adjustment and Invoicing), but the instruction "combine them" is ambiguous without knowing:

1. **What are they combining with?** Is there other wording elsewhere in the contract, or in a previous message, that should be merged with 4.2-4.3?
2. **What is the goal?** Should I merge 4.2 and 4.3 into a single clause? Or combine them with material from another section?

Please share:
- The full contract (or at least the sections around 4.2-4.3), or
- Any other wording the drafter has selected for combining, or
- Clarification of what "combine them" means in this context.

Once I see the full picture, I can draft a clean, enforceable combined version under Kenyan law.`;

/* ============================================================ */
describe('F98a — a question back never reaches the card', () => {
  let ai;
  beforeEach(() => { ai = loadAi(); });

  test('THE FIX: the reply that shipped is advice, and there is nothing to apply', () => {
    const p = ai.aiParseProposal(THE_QUESTION);
    assert.equal(p.proposedText, '',
      'nothing to put an Apply Redline button on — this is the whole defect');
    assert.equal(p.advice, THE_QUESTION.trim(),
      'and the reader still reads every word of it, in the bubble where it belongs');
    assert.equal(p.strict, false, 'still marked as a reply that missed the shape');
  });

  /* The shapes a model actually produces when it wants something before it will
     draft. Each one used to arrive as proposedText. */
  const asks = [
    'I need the definitions schedule before I can rewrite this limb.',
    "I'd need to know which of the two caps you want to survive.",
    'I cannot see the clause the passage cross-refers to.',
    'Could you confirm which sub-paragraphs should be merged?',
    'Can you paste the sections around 4.2 so I can combine them?',
    'Please share the wording you would like this combined with.',
    'Please tell me whether the 3% cap is still the position.',
    'Before I draft this, which party is meant to bear the freight cost?',
    'Which two paragraphs did you mean?',
    'What should happen to the notice period?',
  ];
  for (const a of asks){
    test(`"${a.slice(0, 38)}…" is advice, not a proposal`, () => {
      const p = ai.aiParseProposal(a);
      assert.equal(p.proposedText, '', 'no card');
      assert.ok(p.advice.includes(a.slice(0, 20)), 'and the question is still put to the reader');
    });
  }

  test('a question the model puts inside proposedText is moved out of it', () => {
    /* The other way in: the shape was kept, and the question was posted through
       the wording field. The two bubbles exist precisely so it has somewhere
       else to go. */
    const p = ai.aiParseProposal(JSON.stringify({ advice: 'Needs one more fact.',
      proposedText: 'Which of the two invoicing regimes should survive the merge?' }));
    assert.equal(p.proposedText, '', 'nothing filed');
    assert.match(p.advice, /Needs one more fact/);
    assert.match(p.advice, /invoicing regimes/, 'and the question survives into the bubble');
  });

  test('a question in FRONT of good wording keeps the wording', () => {
    /* The half-and-half case. The clause is real and must still reach the card;
       only the sentence talking to the reader moves. */
    const p = ai.aiParseProposal(JSON.stringify({ advice: '',
      proposedText: 'Could you confirm the cap? The Supplier shall invoice within seven (7) days of shipment.' }));
    assert.equal(p.proposedText, 'The Supplier shall invoice within seven (7) days of shipment.',
      'the clause is what gets spliced');
    assert.match(p.advice, /Could you confirm/, 'and the question is said, in the bubble');
  });
});

/* ============================================================ */
describe('F98b — and real wording is left alone', () => {
  let ai;
  beforeEach(() => { ai = loadAi(); });

  /* THE OTHER DIRECTION OF THE SAME HARM. A guard that eats real wording sends
     a drafter to retype a clause the Copilot had already written, and does it
     without saying why. Every string here is contract wording a model could
     legitimately return, chosen because each one brushes against one of the new
     patterns. */
  const wording = [
    /* "Please confirm" is how a real facility letter closes. It is deliberately
       not in the ask-back list for exactly this reason. */
    'Please confirm your acceptance of these terms by countersigning and returning the duplicate copy of this letter.',
    'Please provide written notice to the address set out in clause 12.1.',
    /* Roman-numeral sub-paragraphs: the near miss the first-person test is
       written to survive, because "(i)" is not the word "I". */
    'The Supplier shall (i) issue invoices upon shipment, (ii) reference the applicable PO number, and (iii) attach the Certificate of Analysis.',
    'Whichever of the two rates is lower shall apply for the remainder of the Term.',
    'What constitutes Confidential Information is set out in Schedule 2.',
    'The Supplier cannot assign this Agreement without prior written consent.',
    'Can-Am Holdings Limited shall procure the performance of its subsidiaries.',
    'Any proposed price adjustment must be submitted in writing at least sixty (60) days prior to the effective date and shall be capped at 3% per annum.',
  ];
  for (const w of wording){
    test(`"${w.slice(0, 38)}…" still reaches the card`, () => {
      assert.equal(ai.aiLooksConversational(w), false, 'not read as a remark');
      const p = ai.aiParseProposal(w);
      assert.equal(p.proposedText, w, 'and it is the wording, whole');
      assert.equal(p.advice, '');
    });
  }

  test('the first-person test wants a word, not a letter', () => {
    /* Spelt out because it is the single character standing between a
       sub-paragraph list and a guard that would swallow it. */
    assert.equal(ai.aiAsksTheReader('Is the cap (i) annual or (ii) cumulative?'), false,
      'roman numerals are not the model talking about itself');
    assert.equal(ai.aiAsksTheReader('Is the cap annual? I can draft either.'), true);
    assert.equal(ai.aiAsksTheReader('I have redrafted the cap as annual.'), false,
      'and a question mark is required as well — this one is a statement');
  });
});

/* ============================================================ */
describe('F98c — the session remembers the exchange', () => {
  let ai;
  beforeEach(() => { ai = loadAi(); });

  test('a new session starts with nothing to remember', () => {
    const s = ai.aiOpenRephraseSession({ passage: '4.2 Price Adjustment.', clauseLabel: 'Clause 4' });
    assert.equal(s.turns.length, 0);
    assert.equal(ai.aiRephraseHistory(s), '');
  });

  test('THE FIX: turns are kept, and read back as an exchange', () => {
    const s = ai.aiOpenRephraseSession({ passage: '4.2 Price Adjustment.' });
    ai.aiRephraseRemember('you', 'tighten the price review');
    ai.aiRephraseRemember('copilot', 'Which cap should survive?');
    const h = ai.aiRephraseHistory(s);
    assert.match(h, /The drafter said: "tighten the price review"/);
    assert.match(h, /You replied: "Which cap should survive\?"/);
    assert.ok(h.indexOf('drafter said') < h.indexOf('You replied'), 'in the order they happened');
  });

  test('markup does not travel into the prompt', () => {
    /* The panel's own bubbles are HTML. Sending the tags would spend tokens on
       <div>s and teach the model that wording comes wrapped in them. */
    ai.aiOpenRephraseSession({ passage: 'x' });
    ai.aiRephraseRemember('copilot', '<div>Which  cap\n should survive?</div>');
    assert.match(ai.aiRephraseHistory(), /You replied: "Which cap should survive\?"/);
  });

  test('it is bounded, so the prompt cannot outgrow the passage', () => {
    const s = ai.aiOpenRephraseSession({ passage: 'x' });
    for (let i = 0; i < 20; i++) ai.aiRephraseRemember('you', `turn ${i}`);
    assert.equal(s.turns.length, ai.AI_SESSION_TURNS);
    assert.equal(s.turns[s.turns.length - 1].text, 'turn 19', 'and it keeps the recent end');
  });

  test('nothing is recorded once the session is closed', () => {
    const s = ai.aiOpenRephraseSession({ passage: 'x' });
    ai.aiCloseRephraseSession();
    ai.aiRephraseRemember('you', 'stray');
    assert.equal(s.turns.length, 0, 'a card owns the follow-up, and carries its own history');
  });

  test('a reply with no wording is recorded, and the session stays open', () => {
    /* The whole point of remembering. The Copilot has just asked a question,
       the reader is about to answer it, and that answer is only meaningful
       beside the question. */
    const s = ai.aiOpenRephraseSession({ passage: '4.2 Price Adjustment.' });
    const card = ai.aiOpenProposal({ advice: THE_QUESTION, proposedText: '' });
    assert.equal(card, null, 'no card — there is no wording to put a button on');
    assert.equal(ai.aiActiveRephrase(), s, 'and the session is still the one taking the next sentence');
    assert.match(ai.aiRephraseHistory(s), /You replied: "I need to see the full context/);
  });

  test('a reply that DID draft is not recorded — the card takes over', () => {
    const s = ai.aiOpenRephraseSession({ passage: '4.2 Price Adjustment.' });
    ai.aiOpenProposal({ advice: 'Tightened.', proposedText: 'The Supplier shall invoice on shipment.' });
    assert.equal(s.turns.length, 0);
  });
});

/* ============================================================ */
describe('F98d — an unparsed reply does not claim to be a considered replacement', () => {
  let ai;
  beforeEach(() => { ai = loadAi(); });

  const bubbles = () => ai.ai.history.filter(m => m.role === 'assistant').map(m => String(m.text || ''));

  test('the panel says the shape was missed rather than vouching for the wording', () => {
    ai.aiOpenProposal({ advice: '', strict: false,
      proposedText: 'The Supplier shall invoice on shipment.' });
    const said = bubbles().join(' ');
    assert.match(said, /without the structure this panel asks for/);
    assert.match(said, /Read it before you apply it/);
    assert.doesNotMatch(said, /I have no reasoning to add/,
      'THE FIX: "no reasoning to add" is a claim about a reply that was parsed');
  });

  test('a clean reply with an empty advice field still says so plainly', () => {
    ai.aiOpenProposal({ advice: '', strict: true,
      proposedText: 'The Supplier shall invoice on shipment.' });
    assert.match(bubbles().join(' '), /no reasoning to add beyond the wording itself/);
  });
});

/* ============================================================ */
describe('F98e — the panel hands the exchange to the model', () => {
  /* The wiring, end to end on the negotiation page: what aiSubmit reads off the
     session has to reach copilotPropose, or the memory above is a record nobody
     sends. */
  const RICH = [
    '<h1>SUPPLY AND SERVICES AGREEMENT</h1>',
    '<h2>4. PRICING, INVOICING &amp; PAYMENT TERMS</h2>',
    '<p>4.2 Price Adjustment. Any proposed price adjustment must be submitted in writing.</p>',
    '<p>4.3 Invoicing. Supplier shall issue invoices upon shipment of Materials.</p>',
  ].join('');

  async function page(){
    const w = buildWorld({ negotiationView: true });
    const { win } = w;
    win.promptDialog = async () => '';
    const c = { id: 'MK-980', name: 'Supply and Services Agreement',
      counterparty: 'Naivas Supermarkets', template: 'RM', status: 'Under Review',
      folder: 'proc', fields: {}, metadata: {}, audit: [], rounds: [], versions: [],
      signatures: [], comments: [], redlineText: RICH, format: 'rich' };

    const panel = { sessions: [], proposals: [], cards: [] };
    win.openAI = () => {};
    win.aiPush = () => {};
    win.renderAIFeed = () => {};
    win.copilotAvailable = () => true;
    win.copilotPropose = async o => { panel.proposals.push(o);
      return { advice: 'a', proposedText: 'The Supplier shall invoice on shipment.',
        strict: true, placement: 'replace', headingText: '' }; };
    win.aiOpenProposal = o => { panel.cards.push(o); return o; };
    win.aiOpenRephraseSession = o => { panel.sessions.push(o); return o; };
    win.aiCloseRephraseSession = () => {};
    win.aiNormalizePlacement = v => {
      const s = String(v == null ? '' : v).trim().toLowerCase();
      return ['replace', 'after', 'before', 'newClause'].find(p => p.toLowerCase() === s) || 'replace';
    };
    win.openShareModal = () => {};
    win.counterpartyContact = () => null;
    win.cachedShares = () => [];

    win.negoInit(c);
    win.state = Object.assign({}, win.state, { contracts: [c], activeId: c.id, view: 'redline' });
    win.getContract = id => (id === c.id ? c : null);
    win.renderRedline();

    const clause = win.negoClauseList(c).find(x => /PRICING/i.test(x.headingText));
    const action = win.RL_SEL_ACTIONS.find(a => a.id === 'edit');
    const passage = '4.2 Price Adjustment. Any proposed price adjustment must be submitted in writing.';
    win.rlAiPropose({ c, action, text: passage, clauseId: clause.clauseId,
      opts: { side: 'owner', by: 'Young Mbagaya', persist: false }, again: () => {} });
    await new Promise(r => setTimeout(r, 0));
    return { win, panel, session: panel.sessions[panel.sessions.length - 1] };
  }

  test('THE FIX: the history aiSubmit gathered travels with the first instruction', async () => {
    const p = await page();
    await p.session.onPropose('combine them', p.session,
      { history: 'The drafter said: "look at 4.2 and 4.3"\nYou replied: "Both are about pricing."' });
    const sent = p.panel.proposals[p.panel.proposals.length - 1];
    assert.match(sent.history, /look at 4\.2 and 4\.3/,
      'without this "them" is a pronoun with nothing to point at');
    assert.match(sent.history, /Both are about pricing/);
    assert.equal(sent.instruction, 'combine them');
  });

  test('a session with nothing said yet sends no history rather than the word undefined', async () => {
    const p = await page();
    await p.session.onPropose('combine them', p.session);
    assert.equal(p.panel.proposals[p.panel.proposals.length - 1].history, '');
  });

  test('and the model is told which clause it is looking at', async () => {
    /* The model saw "4.2 … 4.3 …" as bare text and concluded it was being shown
       two clauses — a thing this product forbids combining. It was not: a clause
       here runs from one heading to the next, so both are sub-paragraphs of
       clause 4. */
    const p = await page();
    await p.session.onPropose('combine them', p.session);
    const sent = p.panel.proposals[p.panel.proposals.length - 1];
    assert.match(sent.clauseLabel, /PRICING, INVOICING/);
    assert.match(sent.clauseLabel, /^Clause 4\b/);
  });

  test('the label reaches the prompt text, saying sub-paragraphs are not clauses', async () => {
    /* Asserted on the composed prompt rather than the option, because an option
       nothing reads is a field, not an instruction. */
    const ai = loadAi();
    let seen = '';
    ai.window.copilotAsk = async msgs => { seen = msgs[0].content; return '{"advice":"a","proposedText":"b"}'; };
    await ai.copilotPropose({ ask: 'Rewrite.', passage: '4.2 …\n4.3 …',
      clauseLabel: 'Clause 4 · PRICING, INVOICING & PAYMENT TERMS' });
    assert.match(seen, /The passage comes from Clause 4 · PRICING, INVOICING & PAYMENT TERMS/);
    /* THE PURPOSE SURVIVES THE REWORD: a passage that really reads "4.2 … 4.3 …"
       is still told, bindingly, that those are sub-paragraphs of one clause. */
    assert.match(seen, /sub-paragraphs of\s+that one clause, never as separate clauses/);
    assert.match(seen, /is ONE clause/);
  });

  test('the sub-paragraph rule is CONDITIONAL — it never asserts the example numbers exist', async () => {
    /* Owner-reported 16 Aug 2026: the old line read "Numbers inside it — 4.2,
       4.3, (a), (b) — are sub-paragraphs", sent on EVERY request. On a
       one-sentence governing-law clause with no numbering the model took the
       examples as fact, decided it had been shown a fragment, and refused to
       draft until "the full clause including its sub-paragraphs" was pasted in
       — naming exactly those four example numbers back. The sentence must be an
       "if", never a statement that specific numbers are present. */
    const ai = loadAi();
    let seen = '';
    ai.window.copilotAsk = async msgs => { seen = msgs[0].content; return '{"advice":"a","proposedText":"b"}'; };
    await ai.copilotPropose({ ask: 'Rewrite.',
      passage: 'This Agreement is governed by the laws of Sweden, and the Parties submit to the exclusive jurisdiction of the courts of Sweden.',
      clauseLabel: 'Clause 4 · Governing Law' });
    /* The old assertive form must be gone… */
    assert.doesNotMatch(seen, /Numbers inside it/,
      'the assertive form is what made the model believe 4.2/4.3/(a)/(b) exist');
    /* …the examples may only appear inside a clearly conditional sentence… */
    assert.match(seen, /If it contains\s+numbered or lettered items \(for example 4\.2 or \(a\)\)/);
    /* …and the model is told outright not to ask for sub-paragraphs it was not shown. */
    assert.match(seen, /Do not ask for sub-paragraphs the passage\s+does not show/);
    assert.match(seen, /what is shown is the whole selection/);
  });

  test('a caller with no label sends no line about clauses at all', async () => {
    const ai = loadAi();
    let seen = '';
    ai.window.copilotAsk = async msgs => { seen = msgs[0].content; return '{"advice":"a","proposedText":"b"}'; };
    await ai.copilotPropose({ ask: 'Rewrite.', passage: 'x' });
    assert.doesNotMatch(seen, /The passage comes from/);
  });
});
