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
  for (const f of ['i18n.js', 'jurisdiction.js', 'ai.js'])
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
       honest answer when it cannot draft.

       WIDENED 26 Aug 2026 and the claim is stronger for it. The forbidden list
       was "a question, an apology or a note about missing context", and the
       reply that produced F135e is none of those three — it is a remark about
       the REQUEST ("the playbook concern is about Clause 5, not Clause 2").
       A fence that lists three kinds of talk teaches the model that a fourth
       kind is allowed, so it now names the shape rather than the examples. */
    for (const f of [ai.AI_PROPOSAL_FORMAT(), ai.AI_EDIT_FORMAT()]){
      assert.match(f, /CONTRACT WORDING ONLY/);
      assert.match(f, /empty string/);
      assert.match(f, /never put a question, an apology, a note about missing context/);
      assert.match(f, /remark about the request itself where wording goes/,
        'the fourth kind, named — this is what the reported reply was');
      assert.match(f, /about some other clause/,
        'and the exact case that produced it: a point raised about a different clause');
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

/* ============================================================
   F135e — THE SAME FAULT WITH THE "I" TAKEN OUT
   ============================================================
   Owner-reported 26 Aug 2026: "i asked copilot to replace an entire clause and
   this is what it did", over a screenshot of Clause 2 struck through in red
   with the reply below filed as its replacement wording.

   The fourth member of the family, and every guard above missed it for ONE
   reason: it is written entirely in the THIRD PERSON. It does not refuse, so
   AI_NOT_WORDING saw nothing. It does not ask, so AI_ASKS_BACK saw nothing and
   there is no question mark for aiAsksTheReader. And it never says "I", which
   is the whole of what AI_MODEL_VOICE reads.

   AI_TASK_TALK is the third-person half of the same rule: contract wording is
   about the PARTIES AND WHAT THEY MUST DO, so a sentence whose subject is one
   of the CONVERSATION'S own objects — who asked, what they were shown, what
   the check said — is the model talking, whatever person it talks in.

   REPRODUCED AGAINST THE REAL PARSER BEFORE ANYTHING WAS WRITTEN: proposedText
   came back as the whole paragraph and advice came back empty, which is the
   defect exactly as photographed. */
const THE_MISMATCH_REPLY = `The drafter wants to replace Clause 2 (Term and Termination), but the playbook concern is about Clause 5 (Limitation of Liability), not Clause 2. This is a mismatch. The passage shown is indeed Clause 2 and contains only term and termination language — nothing about liability.`;

describe('F135e — commentary in the third person is still commentary', () => {
  let ai;
  beforeEach(() => { ai = loadAi(); });

  test('THE FIX: the reported reply is advice, whole, with nothing to apply', () => {
    const p = ai.aiParseProposal(THE_MISMATCH_REPLY);
    assert.equal(p.proposedText, '',
      'no Apply button over a remark about the request — this is the whole defect');
    assert.equal(p.advice, THE_MISMATCH_REPLY.trim(),
      'and the reader still reads every word, in order, in the bubble');
  });

  test('it says no "I" anywhere — which is why every older guard missed it', () => {
    /* Pinned so nobody "simplifies" this fixture into first person later and
       leaves the test passing on AI_MODEL_VOICE instead of the rule it is for. */
    assert.equal(/(?:^|[^\w'’])I(?:'|’)?(?:m|d|ll|ve)?(?=\s|[,.?!;:])/.test(THE_MISMATCH_REPLY),
      false, 'no standalone capital I');
    assert.equal(/\?/.test(THE_MISMATCH_REPLY), false, 'and no question mark');
    assert.equal(ai.AI_MODEL_VOICE.test(THE_MISMATCH_REPLY), false,
      'so the first-person rule cannot be what catches it');
  });

  test('each of its three sentences is caught on its own', () => {
    /* No single pattern carries the reply. That redundancy is deliberate: it
       is what lets every individual pattern stay narrow enough to be safe. */
    for (const s of THE_MISMATCH_REPLY.split(/(?<=\.)\s+/))
      assert.equal(ai.aiLooksConversational(s), true, s.slice(0, 56));
  });

  test('the model talking about the task, in the phrasings it actually uses', () => {
    for (const s of [
      'The drafter wants to replace Clause 2 with something firmer.',
      'The drafter is asking for a mutual obligation here.',
      'The user wants this made shorter.',
      'The reader seems to want the cap raised.',
      'The passage shown is a term clause and carries nothing about liability.',
      'The excerpt quoted does not contain the provision in question.',
      'The document does not hold the passage you quoted.',
      'The playbook concern is about a different clause.',
      'The playbook position is a 12-month cap, which this clause does not carry.',
      'This is a mismatch between the instruction and the clause.',
      'This appears to be an error in the request.',
    ]) assert.equal(ai.aiLooksConversational(s), true, s.slice(0, 56));
  });
});

/* ============================================================
   F135f — AND IT DOES NOT EAT REAL CONTRACT WORDING
   ============================================================
   Half of every test in this family, per its own rule: a guard that strips
   real wording out of the card is the same class of harm pointing the other
   way. Each pattern in AI_TASK_TALK is narrower than the obvious one, and each
   narrowing is here as the sentence that forced it. */
describe('F135f — the near misses each pattern was narrowed to survive', () => {
  let ai;
  beforeEach(() => { ai = loadAi(); });

  const WORDING = [
    /* "the drafter" IS real wording — contra proferentem. So a verb of
       WANTING is required, and "asks"/"requests" are deliberately not on that
       list, because a SaaS agreement genuinely uses them of its User. */
    'This Agreement shall not be construed against the drafter of any ambiguous provision.',
    'Any ambiguity shall not be resolved against the drafter.',
    'Where the User asks us to delete their personal data we shall do so within 30 days.',
    'If the User requests a refund within 14 days, the Fee shall be repaid in full.',
    'The User asked for the Service to be suspended and the Supplier complied.',
    /* "text", "wording" and "clause" are words a contract uses about ITSELF,
       so those are caught only in the "you sent / you quoted" form — and even
       there "the text you provided" is out, because platform terms say it. */
    'The wording shown in Exhibit A shall prevail over the body of this Agreement.',
    'The clause shown in Schedule 1 is incorporated by reference.',
    'The text provided by the Licensor shall be used verbatim.',
    'You warrant that the text you provided does not infringe any third party right.',
    'The clause you selected shall be deemed incorporated into this Agreement.',
    /* "playbook" alone is not enough — a distribution agreement can carry one. */
    'The Parties shall follow the Brand Playbook attached as Annex 3.',
    'The Distributor shall comply with the Playbook as updated from time to time.',
    /* The verdict is anchored at the front, and a contract opens otherwise. */
    'This is an Agreement between the Parties dated 1 January 2026.',
    'This is a mutual undertaking given by each Party to the other.',
    /* And the plain near misses on the material nouns. */
    'The passage of title shall occur upon delivery to the named place.',
    'Passage of risk shall be governed by Incoterms 2020.',
    'Notices shall be delivered to the address provided in Clause 12.',
    'Goods shall be supplied in the form shown in Exhibit A.',
  ];
  for (const w of WORDING){
    test(`"${w.slice(0, 46)}…" still reaches the card`, () => {
      assert.equal(ai.AI_TASK_TALK.some(re => re.test(w)), false,
        'not read as a remark about the request');
      const p = ai.aiParseProposal(w);
      assert.equal(p.proposedText, w, 'and it is the wording, whole');
    });
  }

  test('MEASURED: 50 real commercial agreements, not one sentence read as a remark', () => {
    /* The claim these patterns rest on, made against real drafting rather than
       against sentences I thought of. test/cuad/contracts.json is the CUAD
       corpus already committed for the extraction scorecard — 50 agreements
       marked up by commercial lawyers. Reading it here costs a fraction of a
       second and turns "I considered the near misses" into a measurement.

       ONLY AI_TASK_TALK is asserted here; the whole guard's own hits are
       f135g's subject, because they were a pre-existing finding rather than
       this rule's. */
    const corpus = require(path.join(__dirname, 'cuad', 'contracts.json'));
    const text = corpus.data
      .map(r => r.paragraphs.map(p => p.context || p.text || '').join('\n\n')).join('\n\n');
    const sentences = text.split(/(?<=[.!?])\s+/)
      .map(s => s.trim()).filter(s => s.length > 25);
    assert.ok(sentences.length > 5000, `a corpus worth measuring against (${sentences.length})`);

    const ate = sentences.filter(s => ai.AI_TASK_TALK.some(re => re.test(s)));
    assert.deepEqual(ate.map(s => s.slice(0, 90)), [],
      'every one of these is a clause a drafter wrote — none may be read as talk');
  });
});

/* ============================================================
   F135g — A HEADING IS NOT A DISCLAIMER
   ============================================================
   Found by measuring the WHOLE guard against test/cuad while F135f was being
   written, and fixed on the owner's ask the same day. The shipped opener
   /^(?:please note|disclaimer|caveat)\b/ read real contract SECTION HEADINGS
   as the model clearing its throat: "DISCLAIMER OF WARRANTY", "Disclaimer of
   Representations and Warranties." — three of the guard's four hits across 50
   real agreements, and the largest single false positive it had.

   THE TELL IS GRAMMATICAL, NOT ANOTHER PHRASE. Followed by "of", the word is a
   noun phrase naming a section. The model's use is the word standing alone as
   a lead-in — which the sibling rule catches by its colon, and this one by its
   absence. So the fix costs the guard nothing it was actually catching, and
   this file asserts BOTH halves rather than only the one that was reported. */
describe('F135g — a section heading still reaches the card', () => {
  let ai;
  beforeEach(() => { ai = loadAi(); });

  const HEADINGS = [
    'DISCLAIMER OF WARRANTY',
    'Disclaimer of Representations and Warranties.',
    'Disclaimer of Warranty and Limitation of Liability',
    'Caveat of the Purchaser under section 14 of the Sale of Goods Act.',
  ];
  for (const h of HEADINGS){
    test(`"${h.slice(0, 44)}…" is wording, not throat-clearing`, () => {
      assert.equal(ai.aiLooksConversational(h), false);
      assert.equal(ai.aiParseProposal(h).proposedText, h, 'and it reaches the card whole');
    });
  }

  test('THE OTHER HALF: the model announcing a disclaimer is still caught', () => {
    /* Without these the fix would have bought a false positive by opening a
       false negative, which is the same harm one step along. */
    for (const s of [
      'Disclaimer: this is a suggestion and not legal advice.',
      'Disclaimer — the wording below is a draft only.',
      'Disclaimer, the above should be checked by counsel.',
      'Please note the clause below has not been reviewed.',
      'Caveat: the cap figure is a placeholder.',
    ]) assert.equal(ai.aiLooksConversational(s), true, s.slice(0, 52));
  });

  test('MEASURED: the whole guard reads THREE sentences of 50 real agreements as talk', () => {
    /* The claim is a NUMBER and it is deliberately not zero. Three survivors,
       each left on purpose and each a decision rather than a mystery:

         · a schedule footnote opening "Note:" — genuinely two-sided, because a
           model writes "Note:" as often as a schedule does;
         · two lines of a MARKETING EXHIBIT listing content-feature titles, one
           of which carries a question mark inside a quoted title.

       Those last two are the measured cost of F135h's question rule, and they
       are worth it: across the same corpus not one PARAGRAPH ends in a question
       mark, which is the unit the guard is really asked about, and the reply
       that forced the rule was four paragraphs of commentary filed into a
       contract. Left on the standing rule that the worse error is the other
       one. */
    const corpus = require(path.join(__dirname, 'cuad', 'contracts.json'));
    const text = corpus.data
      .map(r => r.paragraphs.map(p => p.context || p.text || '').join('\n\n')).join('\n\n');
    const sentences = text.split(/(?<=[.!?])\s+/)
      .map(s => s.trim()).filter(s => s.length > 25);
    const talk = sentences.filter(s => ai.aiLooksConversational(s));
    assert.equal(talk.length, 3, `three known survivors, got:\n`
      + talk.map(s => '  ' + JSON.stringify(s.slice(0, 90))).join('\n'));
    assert.equal(talk.filter(s => /^Note:/.test(s)).length, 1, 'the footnote');
    assert.equal(talk.filter(s => /\?/.test(s)).length, 2, 'and the two quoted titles');

    /* THE UNIT THAT ACTUALLY MATTERS. aiSplitReply judges PARAGRAPHS, and not
       one paragraph of 50 real agreements is read as talk. */
    const paras = text.split(/\n\s*\n/).map(x => x.trim()).filter(x => x.length > 25);
    assert.ok(paras.length > 2000, `a corpus worth measuring (${paras.length})`);
    assert.equal(paras.filter(x => ai.AI_ENDS_ASKING.test(x)).length, 0,
      'a contract does not end a paragraph by asking a question');
  });
});

/* ============================================================
   F135h — THE SAME FAMILY, IN NEW CLOTHES
   ============================================================
   Owner-reported 26 Aug 2026, the SAME DAY F135e shipped: "I asked for a
   softer version of a clause and I got this" — four paragraphs of Copilot
   discussing the assignment clause, filed into it whole.

   F135e was still a phrase list, and this reply used none of its phrases: it
   never says "I", never names the passage, never mentions the playbook. IT WAS
   NOT A REGRESSION — measured against the commit before F135e, the same reply
   was filed identically, 1058 characters either way — but it was not fixed
   either, and saying so plainly was the honest answer.

   WHAT WAS MISSING WAS THE MEASUREMENT, not another phrase. A QUESTION IS NOT
   WORDING: of 3,550 paragraphs in 50 lawyer-marked agreements, not one ends in
   a question mark. The old rule demanded a question mark AND the model naming
   itself, a conjunction written before anybody had counted. Beside it, three
   narrow tells for talk ABOUT THE DRAFTING JOB, each measured at zero across
   the same corpus and each narrowed by a real clause. */
const THE_SOFTER_REPLY = [
  'Since the current clause already permits assignment to affiliates without consent, '
    + 'a softer version would likely ease restrictions further — perhaps allowing assignment '
    + 'more broadly, or loosening the definition of "affiliate," or removing consent '
    + 'requirements altogether in more situations.',
  "However, from Young LLC's perspective (you act for Young LLC, the customer here), the "
    + 'current wording is fairly balanced: it prevents the counterparty (AIT) from assigning '
    + 'to a third party without consent, but allows both parties to assign to affiliates freely.',
  'A "softer" version that relaxes this *further* could expose Young to the risk of AIT '
    + 'assigning its obligations to a less capable or creditworthy subcontractor. If the '
    + 'drafter is asking *you* to propose softer language, this is likely a counterparty '
    + 'request in the negotiation. The question is: does Young want to allow AIT easier '
    + 'assignment rights?',
  "If you want me to draft a softer version, please confirm whether that serves Young's "
    + 'interests, or whether you want me to flag the commercial risk first.',
].join('\n\n');

describe('F135h — a reply about the drafting job is not the drafting', () => {
  let ai;
  beforeEach(() => { ai = loadAi(); });

  test('THE FIX: the reported reply is advice, whole, with nothing to apply', () => {
    const p = ai.aiParseProposal(THE_SOFTER_REPLY);
    assert.equal(p.proposedText, '',
      'no Apply button over four paragraphs of discussion');
    assert.equal(p.advice, THE_SOFTER_REPLY.trim(),
      'and every word still reaches the reader, in order');
  });

  test('EVERY paragraph is caught, so no one rule is carrying it', () => {
    for (const para of THE_SOFTER_REPLY.split(/\n\s*\n/))
      assert.equal(ai.aiLooksConversational(para), true, para.slice(0, 56));
  });

  test('it says no "I" — which is why F135e\'s rules could not see it', () => {
    assert.equal(ai.AI_MODEL_VOICE.test(THE_SOFTER_REPLY), false);
    assert.equal(ai.AI_TASK_TALK.slice(0, 5).some(re => re.test(THE_SOFTER_REPLY)), false,
      'and none of the five patterns F135e shipped matches it either');
  });

  test('a passage that ENDS by asking is the model asking', () => {
    for (const s of [
      'Does Young want to allow AIT easier assignment rights?',
      'Would you like this made mutual?',
      'Shall I keep the cap at twelve months?',
      'The question is: which of the two do you prefer?',
    ]) assert.equal(ai.aiLooksConversational(s), true, s.slice(0, 50));
  });

  test('the model asking to be told what to do next', () => {
    for (const s of [
      'If you want me to draft a softer version, please confirm whether that serves your interests.',
      'Let me know if you would prefer a firmer cap.',
      'Please advise whether the notice period should stay at ninety days.',
      'Here is the plainer wording you asked for.',
      'You act for the Buyer here, so the current position favours you.',
    ]) assert.equal(ai.aiLooksConversational(s), true, s.slice(0, 50));
  });
});

/* ============================================================
   F135i — AND THE NEW RULES DO NOT EAT REAL DRAFTING
   ============================================================
   Half of every test in this family. Each clause below brushes one of the four
   rules on purpose, and each is the sentence that forced its narrowing. */
describe('F135i — the near misses F135h was narrowed to survive', () => {
  let ai;
  beforeEach(() => { ai = loadAi(); });

  const WORDING = [
    /* "please confirm" is real — which is why only "confirm WHETHER" is caught */
    'Please confirm your acceptance of these terms by countersigning and returning the duplicate.',
    'The Supplier shall confirm whether the Goods conform to the specification within five days.',
    /* "me"/"us" need a DRAFTING verb after them */
    'I, the undersigned, hereby appoint the Attorney to act on my behalf.',
    'The Customer shall notify us if the Goods are damaged and we shall let the carrier know.',
    'The Buyer may require us to replace any defective Goods at our own cost.',
    /* the drafting register: only how something is WRITTEN */
    'Either party may request a revised version of Schedule 2 at any time.',
    'The Supplier shall provide a longer version of the specification on request.',
    'A shorter notice period may be agreed between the Parties in writing.',
    'A stronger indemnity shall apply where the loss arises from wilful default.',
    /* "act for" is ordinary; it is the SECOND PERSON that gives the other away */
    'The Agent is authorised to act for and on behalf of the Company in all dealings.',
    /* and plain wording that merely mentions the clause */
    'Neither party may assign or transfer this Agreement without the prior written consent of the other party.',
    'Subject to this clause, the Supplier may sub-contract any part of the Services.',
  ];
  for (const w of WORDING){
    test(`"${w.slice(0, 44)}…" still reaches the card`, () => {
      assert.equal(ai.aiLooksConversational(w), false, 'not read as talk');
      assert.equal(ai.aiParseProposal(w).proposedText, w, 'and it is the wording, whole');
    });
  }

  test('a clause is still a clause when it happens to contain a question mark', () => {
    /* The cost of the question rule is bounded to passages that END by asking.
       A quoted title mid-clause — the only shape the corpus turned up — still
       reaches the card. */
    const w = 'The content features shall include "Is Your Diet Working?" and two others.';
    assert.equal(ai.AI_ENDS_ASKING.test(w), false, 'it does not end by asking');
    assert.equal(ai.aiParseProposal(w).proposedText, w);
  });
});
