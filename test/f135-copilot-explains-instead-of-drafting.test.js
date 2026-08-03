/* ============================================================
   F135 — the Copilot EXPLAINING is not a redline either
   ============================================================
   The third member of the family F88 (refusals) and F98 (questions) started.
   Two screenshots, same session: a drafter pressed "✂️ Shorten & Simplify" on
   Clause 3 · Term, and the Copilot — whose fetched record was truncated —
   replied with three calm paragraphs explaining what it had received, what it
   could not do, and what to paste. No question mark anywhere. Every paragraph
   opener a plain statement. The whole reply was drawn in the proposal card and
   one Apply press filed it into the clause as a tracked change.

   Why every existing guard missed it:

     · AI_NOT_WORDING and AI_ASKS_BACK are ANCHORED — they only read the
       opening of the candidate. The giveaways ("I cannot properly rewrite…",
       "Please paste or share…") sat in paragraphs two and three.
     · aiAsksTheReader needs a question mark. "Please paste…" asks without one.
     · The second screenshot's ask was BOLD — "**Please paste…**" — and two
       asterisks in front of "Please" defeat an anchored pattern.
     · And aiSplitDisclaimer could only move ONE opening sentence to advice;
       everything after it was "the wording" by definition.

   The fix is a rule about VOICE rather than another phrase: contract wording
   is third person about the parties, so a standalone capital "I" followed by a
   verb of speech, sight or need is the model talking, whatever sentence it
   invents next month (AI_MODEL_VOICE). And the reply is now split PARAGRAPH BY
   PARAGRAPH (aiSplitReply): talk goes to the advice bubble, wording goes to
   the card, each judged on its own.

   The false-positive direction is half of every test here, per the family
   rule: a guard that eats real wording is the same harm pointing the other
   way. "Article I can be amended" and "I, the undersigned, hereby appoint" are
   the two near misses the voice rule is written to survive. */
const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

/* Same stage as F88's, F97's and F98's loaders, deliberately. */
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

/* The two replies from the screenshots, verbatim. Both were drawn whole in the
   proposal card; the first was APPLIED, and landed in Clause 3 as a redline. */
const THE_TERM_REPLY = `The contract text I received is truncated and doesn't contain the Clause 3 · Term passage you've quoted. The document shows only metadata and a pending change to Clause 1, not the term clause itself.

I cannot properly rewrite the passage without seeing the full contract body and understanding the surrounding context — such as what "the effective date" refers to in your jurisdiction, whether there are cross-references to other clauses, or what the termination mechanism looks like elsewhere in the agreement.

Please paste or share the full Clause 3 · Term section (including all sub-paragraphs 4.2, 4.3, (a), (b) that you mentioned), or let me know if there is a different version of this contract I should fetch. Then I can give you the plain-language rewrite with reasoning in the JSON format you asked for.`;

const THE_CONFIDENTIALITY_REPLY = `The contract text is severely truncated in the system. I can see there are negotiation changes pending, but the full Clause 2 · Confidential Information is not visible in the fetched record. The document shows only metadata and changes to Clauses 1 and 3, not the full content I need to work with.

I cannot rewrite the passage without seeing the actual current wording of Clause 2 in full. The anchor text you've provided is only a definition of "Confidential Information", and to make it shorter while staying enforceable, I need to know what else is in that clause — exceptions, permitted uses, return/destruction obligations, and any other sub-paragraphs that might be redundant or verbose.

**Please paste the full current wording of Clause 2 · Confidential Information** (including all sub-paragraphs) so I can spot what to trim and propose a shorter version that still holds up under Swedish law and keeps Young's position safe.`;

/* ============================================================ */
describe('F135a — an explanation never reaches the card', () => {
  let ai;
  beforeEach(() => { ai = loadAi(); });

  for (const [name, reply] of [['Term', THE_TERM_REPLY],
    ['Confidential Information', THE_CONFIDENTIALITY_REPLY]]){
    test(`THE FIX: the ${name} reply that shipped is advice, whole, with nothing to apply`, () => {
      const p = ai.aiParseProposal(reply);
      assert.equal(p.proposedText, '',
        'nothing to put an Apply Redline button on — this is the whole defect');
      assert.equal(p.advice, reply.trim(),
        'and the reader still reads every word, in order, in the bubble');
      assert.equal(p.strict, false);
    });
  }

  test('no question mark is needed — "Please paste" asks without asking', () => {
    assert.equal(ai.aiLooksConversational(
      'Please paste the full current wording of Clause 2.'), true);
  });

  test('bold does not smuggle an ask past the anchor', () => {
    /* The second screenshot: "**Please paste…**". Two asterisks in front of
       "Please" defeated every anchored pattern. */
    assert.equal(ai.aiLooksConversational(
      '**Please paste the full current wording of Clause 2.**'), true);
  });

  test('the model narrating what it received is the model talking', () => {
    for (const s of [
      'The contract text I received is truncated and does not contain the passage.',
      'I can see there are negotiation changes pending.',
      'The anchor text is only a definition, and I need to know what else is in the clause.',
      "I've reviewed the fetched record and it holds only metadata.",
    ]) assert.equal(ai.aiLooksConversational(s), true, s.slice(0, 48));
  });
});

/* ============================================================ */
describe('F135b — the reply is split by paragraph, not by first sentence', () => {
  let ai;
  beforeEach(() => { ai = loadAi(); });

  const MIXED = [
    'I can see the clause is longer than it needs to be. Here is a tighter version.',
    'This Agreement shall remain in force for three (3) years from the Effective Date, unless terminated earlier on ninety (90) days’ written notice to the registered office.',
    'Please confirm whether the notice period should stay at ninety days — I can shorten it further if you prefer.',
  ];

  test('THE FIX: talk before AND after the wording both land in advice', () => {
    const p = ai.aiParseProposal(MIXED.join('\n\n'));
    assert.equal(p.proposedText, MIXED[1], 'the clause, alone, is what gets the button');
    assert.match(p.advice, /longer than it needs to be/);
    assert.match(p.advice, /shorten it further/,
      'the trailing paragraph — the one aiSplitDisclaimer could never reach');
  });

  test('the same split guards the JSON path, where the shape was kept', () => {
    const p = ai.aiParseProposal(JSON.stringify({ advice: 'Tightened.',
      proposedText: MIXED.join('\n\n') }));
    assert.equal(p.proposedText, MIXED[1]);
    assert.match(p.advice, /Tightened\./);
    assert.match(p.advice, /shorten it further/);
  });

  test('a multi-paragraph clause with no talk in it travels whole', () => {
    /* Real wording is allowed to have paragraphs. Only talk moves. */
    const clause = 'The Term begins on the Effective Date.\n\nEither Party may terminate on ninety (90) days’ written notice.';
    const p = ai.aiParseProposal(clause);
    assert.equal(p.proposedText, clause);
    assert.equal(p.advice, '');
  });

  test('sub-paragraphs on single newlines are one paragraph, not many', () => {
    const list = '(a) issue invoices upon shipment;\n(b) reference the PO number;\n(c) attach the Certificate of Analysis.';
    const p = ai.aiParseProposal(list);
    assert.equal(p.proposedText, list, 'a list is not split into fragments');
  });
});

/* ============================================================ */
describe('F135c — and real wording still is not the model talking', () => {
  let ai;
  beforeEach(() => { ai = loadAi(); });

  /* Each string brushes the voice rule on purpose. */
  const wording = [
    /* A roman numeral wearing a capital I — the lookbehind's whole job. */
    'Article I can be amended only by a resolution passed by both Parties.',
    'Schedule I was agreed between the Parties on the Effective Date.',
    /* First person that IS wording: no verb of speech, sight or need. */
    'I, the undersigned, hereby appoint the Attorney to act on my behalf.',
    /* The F98b regulars, still safe under the new rule. */
    'Please confirm your acceptance of these terms by countersigning and returning the duplicate copy of this letter.',
    'The Supplier shall (i) issue invoices upon shipment, (ii) reference the applicable PO number, and (iii) attach the Certificate of Analysis.',
    'This Agreement shall remain in force for 3 years from the effective date, unless terminated earlier by written notice to the registered office in Nairobi.',
  ];
  for (const w of wording){
    test(`"${w.slice(0, 44)}…" still reaches the card`, () => {
      assert.equal(ai.aiLooksConversational(w), false, 'not read as a remark');
      const p = ai.aiParseProposal(w);
      assert.equal(p.proposedText, w, 'and it is the wording, whole');
    });
  }

  test('stripping decoration never strips a sub-paragraph mark', () => {
    /* aiBareText exists to unmask "**Please paste"; "(a)" and "1." are
       structure, not decoration, and must arrive intact. */
    assert.equal(ai.aiBareText('**Please paste the clause.**'), 'Please paste the clause.');
    assert.match(ai.aiBareText('(a) issue invoices upon shipment;'), /^\(a\)/);
    assert.match(ai.aiBareText('1. The Term begins on the Effective Date.'), /^1\./);
  });
});

/* ============================================================ */
describe('F135d — the prompts stop teaching the phrasing', () => {
  let ai;
  beforeEach(() => { ai = loadAi(); });

  test('both format contracts say where a question belongs', () => {
    /* The parse guard is the net; the prompt is the fence. Both shapes tell
       the model that proposedText is wording only and an empty string is the
       honest answer when it cannot draft. */
    for (const f of [ai.AI_PROPOSAL_FORMAT(), ai.AI_EDIT_FORMAT()]){
      assert.match(f, /CONTRACT WORDING ONLY/);
      assert.match(f, /empty string/);
      assert.match(f, /never put a question, an apology or a note about missing context/);
    }
  });

  test('the truncation rule no longer invites a refusal, in both brains', () => {
    /* The "say so plainly" instruction (F132) is what taught the Copilot to
       open with "The contract text I received is truncated…" and stop there.
       It keeps the honesty and loses the refusal: the quoted passage is
       authoritative, so draft from it. Pinned in BOTH places the sentence
       lives — the server system prompt and the browser-local one — because
       drift between them is how one brain regains the old behaviour. */
    for (const src of [
      fs.readFileSync(path.join(__dirname, '..', 'server', 'server.js'), 'utf8'),
      fs.readFileSync(path.join(__dirname, '..', 'js', 'ai.js'), 'utf8'),
    ]){
      assert.match(src, /A truncated record is not a reason to refuse an edit/i);
      assert.match(src, /that quoted passage is the authoritative text/);
    }
  });
});
