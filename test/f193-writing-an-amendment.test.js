/* ============================================================
   f193 — writing an amendment from blank paper
   ============================================================
   Owner-asked (14 Aug 2026), from a drawn page. Until now the only way to get
   an amendment into HaTi was to write it somewhere else and attach the file.
   "Link an existing document" is still that act and is untouched. This is the
   other half: a NEW draft, on our letterhead, filed against its parent from the
   moment it exists.

   THE CLAIM WORTH TESTING IS THAT ALMOST NOTHING HERE IS NEW. From the instant
   a valid draft is on the record it is an ordinary contract — same negotiation
   page, same rounds, same share link, same signing route — so this file is not
   about an amendment feature. It is about the START being right:

     1. THE LINK EXISTS FROM THE FIRST MOMENT. There is no window in which the
        document is a loose contract somebody has to remember to file. That is
        what makes the KPI count and the renewal date come out right, which is
        the entire reason the family model exists.
     2. WHAT IS CARRIED AND WHAT IS NOT, each for its own reason. A copied
        contract value would be a guess wearing a fact's clothes; a copied
        signatory may have left the company. A copied counterparty is simply
        the same counterparty.
     3. THE BODY IS SOMETHING THE REST OF THE PRODUCT CAN READ. Both ways —
        with the four-line skeleton and without it. A blank page that the
        negotiation cannot insert a clause into is not a blank page, it is a
        dead end, and the wording of a contract with no template at all used to
        take the whole Document tab down with it.
     4. FAMILIES STAY ONE LEVEL DEEP. An amendment cannot be amended.

   WHAT IS NOT ASSERTED HERE, and where it is instead: the recital prints the
   parent's date as "31 July 2026" through fmtDocDate, which is a js/core.js
   global this stage does not carry — reimplementing it in the harness would
   test the reimplementation. The browser file asserts the printed date against
   the real formatter. Same split as f176's source-pinned claims. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');

const ME = { id: 'u_y', name: 'Young Mbagaya', role: 'admin', email: 'y@hati.co.ke' };

function master(over = {}){
  return { id: 'MK-1042', name: 'Equipment Lease & Maintenance',
    counterparty: 'Juno Limited', counterpartyEmail: 'contracts@juno.co.ke',
    party: 'Young Kenya Ltd', folder: 'proc', valueType: 'estimated', value: 4200000,
    status: 'Signed', template: 'WH', expiry: '2026-09-30',
    metadata: { effectiveDate: '2026-07-31' }, fields: {}, audit: [], signatures: [],
    obligations: [{ id: 'ob_1', desc: 'Quarterly maintenance report', status: 'open' }],
    branding: { designId: 'letterhead-1', companyName: 'Young' },
    ...over };
}

function world(contracts){
  const w = buildWorld({ user: ME, family: true, contractView: true, negotiationView: true });
  w.win.state = { settings: {}, contracts: contracts || [], activeId: null, view: 'workspace' };
  w.win.FIRST_PARTY = 'Young Holdings Ltd';
  w.win.getUsers = () => [ME];
  w.win.getContract = id => w.win.state.contracts.find(x => x.id === id) || null;
  return w;
}

describe('f193 · the link is there from the first moment', () => {
  test('a created amendment is already filed against its parent', () => {
    const { win } = world([master()]);
    const c = win.createAmendment(win.state.contracts[0], { relation: 'amendment' }).contract;

    assert.equal(c.parentId, 'MK-1042');
    assert.equal(c.relation, 'amendment');
    assert.equal(c.status, 'Draft');
    assert.ok(win.state.contracts.includes(c), 'and it is on the register');
    /* THE COUNT IS THE PAYOFF. Two documents, one agreement — which is the
       whole reason for filing it as a family rather than as a seventh
       standalone contract. (Read field by field: the object is built inside
       jsdom's realm, where deepEqual's constructor check fails on structurally
       identical values.) */
    const k = win.familyCounts(win.state.contracts);
    assert.equal(k.agreements, 1);
    assert.equal(k.documents, 2);
    assert.equal(k.amendments, 1);
    assert.deepEqual(win.familyChildren('MK-1042').map(k => k.id), [c.id]);
  });

  test('nothing is left for a human to confirm — a person just made it', () => {
    /* The amber "this reads like an amendment, confirm or mark standalone" band
       is for documents that ARRIVED and were guessed at. There is nothing to
       guess about one somebody wrote here on purpose. */
    const { win } = world([master()]);
    const c = win.createAmendment(win.state.contracts[0], {}).contract;
    assert.equal(c.linkConfirmed, true);
    assert.ok(!c.linkSuggestions, 'and no machine suggestion is invented for it');
  });

  test('the record says what happened, in that order, in English', () => {
    const { win } = world([master()]);
    const c = win.createAmendment(win.state.contracts[0],
      { relation: 'addendum', expiry: '2029-03-31', note: 're-prices maintenance' }).contract;
    const lines = c.audit.map(a => `${a.action}: ${a.detail}`);
    assert.match(lines[0], /^Created: New addendum written from blank paper against MK-1042/);
    assert.match(lines[0], /states a term to 2029-03-31/,
      'a new end date is a fact about the deal — the trail says it was stated');
    /* "a addendum" was what this said before. An audit line is a record and a
       record is read by people. */
    assert.match(lines[1], /^Linked: Filed as an addendum of MK-1042 — re-prices maintenance$/);
    assert.equal(c.audit[0].user, ME.name, 'and names who did it');
  });

  test('an UNSIGNED amendment proposes the new end date and does not impose it', () => {
    /* REVERSED IN PLACE, owner-ruled 14 Aug 2026. This asserted that creating a
       draft amendment moved the master's live expiry immediately — deliberate,
       documented behaviour, which the audit put to the owner as legal risk.

       An unsigned amendment has no legal effect, and a renewal reminder is
       acted on without anybody re-checking why it says what it says: somebody
       reading the moved date and deciding not to serve notice would be relying
       on a term that does not exist yet.

       THE PROPOSAL IS NOT LOST, which is the other half of the ruling. It is
       stated BESIDE the live date rather than replacing it. */
    const { win } = world([master()]);
    const parent = win.state.contracts[0];
    assert.equal(win.effectiveExpiry(parent), '2026-09-30', 'before: its own date');

    const c = win.createAmendment(parent, { relation: 'amendment', expiry: '2029-03-31' }).contract;
    assert.equal(win.effectiveExpiry(parent), '2026-09-30',
      'a draft does not move the live expiry');
    assert.equal(win.expirySource(parent), null, 'nor claim a source for one');

    const p = win.proposedExpiry(parent);
    assert.ok(p, 'but the proposal is known');
    assert.equal(p.date, '2029-03-31');
    assert.equal(p.id, c.id, 'and it names the document asking for it');
  });

  test('and once it is signed, the term moves — and the panel says where from', () => {
    const { win } = world([master()]);
    const parent = win.state.contracts[0];
    const c = win.createAmendment(parent, { relation: 'amendment', expiry: '2029-03-31' }).contract;
    c.status = 'Signed';
    assert.equal(win.effectiveExpiry(parent), '2029-03-31',
      'the date the signed amendment states');
    assert.equal(win.expirySource(parent).id, c.id,
      'and the panel can say WHICH document moved it, rather than quietly showing another date');
    assert.equal(win.proposedExpiry(parent), null,
      'and it stops being a proposal once it is the answer');
  });

  test('a seal counts as signed even where the status has not caught up', () => {
    /* The same three signals negoExecuted and the server's isExecutedRow read.
       Reducing this to the status alone is the narrowing both of those exist
       to prevent. */
    const { win } = world([master()]);
    const parent = win.state.contracts[0];
    const c = win.createAmendment(parent, { relation: 'amendment', expiry: '2030-01-31' }).contract;
    c.execution = { at: new Date().toISOString() };
    assert.equal(win.effectiveExpiry(parent), '2030-01-31');
  });

  test('an amendment that does not touch the term leaves it alone', () => {
    const { win } = world([master()]);
    const parent = win.state.contracts[0];
    win.createAmendment(parent, { relation: 'amendment' });
    assert.equal(win.effectiveExpiry(parent), '2026-09-30');
    assert.equal(win.expirySource(parent), null);
  });
});

describe('f193 · what is carried over, and what is deliberately not', () => {
  const made = () => {
    const w = world([master()]);
    return { win: w.win, parent: w.win.state.contracts[0],
      c: w.win.createAmendment(w.win.state.contracts[0], {}).contract };
  };

  test('the other side, our own entity, the stream and the letterhead come across', () => {
    const { c, parent } = made();
    assert.equal(c.counterparty, parent.counterparty);
    assert.equal(c.counterpartyEmail, parent.counterpartyEmail, 'and the address we have for them');
    /* c.party, not FIRST_PARTY: the DOCUMENT names the legal entity that signed
       the original, and the workspace is a different fact. See contractParty. */
    assert.equal(c.party, 'Young Kenya Ltd');
    assert.notEqual(c.party, 'Young Holdings Ltd');
    assert.equal(c.folder, parent.folder, 'filed in the same value stream');
    assert.deepEqual(c.branding, parent.branding, 'and it looks like the original');
  });

  test('the money is NOT copied, but whether money passes at all is', () => {
    /* An amendment either restates the figure or changes it, so a copied one is
       a guess wearing a fact's clothes. Whether money passes under this
       agreement is a different question and the parent has already answered it
       — an amendment to an NDA is no likelier to carry a figure than the NDA. */
    const { c } = made();
    assert.equal(c.value, 0, 'no figure is invented');
    assert.equal(c.valueType, 'estimated', 'but the kind of agreement carries over');

    const w = world([master({ valueType: 'none', value: 0 })]);
    const nda = w.win.createAmendment(w.win.state.contracts[0], {}).contract;
    assert.equal(nda.valueType, 'none',
      'an amendment to an agreement carrying no money carries none either');
  });

  test('who signs, the obligations and the dates start empty', () => {
    const { c } = made();
    assert.equal(c.signatures.length, 0, 'a signature is given to one arrangement');
    assert.ok(!c.signerPlan, 'and last year’s signatory may have left the company');
    assert.ok(!c.obligations, 'obligations belong to the document that created them');
    assert.equal(c.expiry, null, 'unless the form was told otherwise');
    assert.ok(!c.hash && !c.signedAt && !c.execution, 'and nothing is executed');
    assert.equal(Object.keys(c.fields).length, 0);
  });

  test('it is not a copy of the parent’s wording', () => {
    const { c, parent } = made();
    assert.notEqual(c.redlineText, parent.redlineText);
    assert.equal(c.template, null, 'and it is not born from a template either');
    assert.equal(c.source, 'amendment');
  });
});

describe('f193 · the name', () => {
  test('it counts from the documents already in the family', () => {
    const { win } = world([master()]);
    const p = win.state.contracts[0];
    assert.equal(win.amendmentDefaultName(p, 'amendment'),
      'Amendment No. 1 to Equipment Lease & Maintenance');
    win.createAmendment(p, { relation: 'amendment' });
    assert.equal(win.amendmentDefaultName(p, 'amendment'),
      'Amendment No. 2 to Equipment Lease & Maintenance');
  });

  test('and it counts per KIND, not across the whole family', () => {
    /* "Amendment No. 2" is wrong on a document that follows one amendment and
       three annexes. */
    const { win } = world([master()]);
    const p = win.state.contracts[0];
    win.createAmendment(p, { relation: 'annex' });
    win.createAmendment(p, { relation: 'annex' });
    assert.equal(win.amendmentOrdinal(p, 'annex'), 3);
    assert.equal(win.amendmentOrdinal(p, 'amendment'), 1);
    assert.match(win.amendmentDefaultName(p, 'annex'), /^Annex No\. 3 to /);
  });

  test('a declined document still holds its number', () => {
    /* No. 2 was issued even if it died, and reusing the number is how two
       documents come to share a name. */
    const { win } = world([master()]);
    const p = win.state.contracts[0];
    const first = win.createAmendment(p, { relation: 'amendment' }).contract;
    first.status = 'Declined';
    assert.equal(win.amendmentOrdinal(p, 'amendment'), 2);
  });

  test('the name is English whatever the reader’s language', () => {
    /* It is a RECORD — it goes on the paper, into the register and into every
       list — and this rulebook's own rule is that a label which is also a
       record keeps English. RELATION_LABEL is the SCREEN's word and follows the
       reader; RELATION_DOC_WORD is the document's and does not. */
    const { win } = world([master()]);
    win.langSet && win.langSet('sv', { repaint: false });
    try {
      assert.match(win.amendmentDefaultName(win.state.contracts[0], 'amendment'),
        /^Amendment No\. 1 to /);
    } finally { win.langSet && win.langSet('en', { repaint: false }); }
  });

  test('a name typed on the form wins over the counted one', () => {
    const { win } = world([master()]);
    const c = win.createAmendment(win.state.contracts[0],
      { relation: 'amendment', name: 'Price Variation 2027' }).contract;
    assert.equal(c.name, 'Price Variation 2027');
  });
});

describe('f193 · the body the rest of the product has to read', () => {
  test('the skeleton says which agreement is being changed', () => {
    /* Not decoration. It is how a reader on the other side knows what they are
       amending — and it is what HaTi itself matches on when the same document
       comes back through an import. */
    const { win } = world([master()]);
    const c = win.createAmendment(win.state.contracts[0], { relation: 'amendment' }).contract;
    assert.match(c.redlineText, /Equipment Lease &amp; Maintenance/, 'names the parent');
    assert.match(c.redlineText, /Young Kenya Ltd/, 'names us as the paper names us');
    assert.match(c.redlineText, /Juno Limited/, 'and them');
    assert.match(c.redlineText, /remain in full force and effect/, 'and closes with the survival line');
    assert.equal(c.format, 'rich');
  });

  test('and HaTi can recognise its own skeleton as an amendment', () => {
    /* The loop closing: the same predicate the importer uses to propose a
       parent when a document like this one arrives from outside. */
    const { win } = world([master()]);
    const c = win.createAmendment(win.state.contracts[0], { relation: 'amendment' }).contract;
    assert.ok(win.looksLikeAmendment(c.name, win.richToText(c.redlineText)));
  });

  test('the blank page is genuinely blank, and still a document', () => {
    const { win } = world([master()]);
    const c = win.createAmendment(win.state.contracts[0], { skeleton: false }).contract;
    assert.equal(win.richToText(c.redlineText).trim(), '', 'nothing is written on it');
    assert.equal(win.sanitizeRich(c.redlineText), c.redlineText,
      'and what is there survives sanitising — <p></p> alone does not, which is how a blank page becomes no page');
    assert.match(c.audit[0].detail, /blank page/, 'the record says which was chosen');
  });

  test('a clause can be written into the blank page — the whole promise', async () => {
    const { win } = world([master()]);
    const c = win.createAmendment(win.state.contracts[0], { skeleton: false }).contract;
    win.negoInit(c);
    const ch = await win.negoInsertClause(c,
      { title: 'Term', text: 'Clause 4.1 of the Agreement is deleted and replaced.' },
      { side: 'owner', author: ME.name });
    assert.ok(ch, 'the negotiation inserts into an empty body');
    assert.equal(c.changes.length, 1);
    assert.equal(c.changes[0].status, 'pending', 'filed as our ask, like any other change');
  });

  test('the skeleton arrives as four clauses the negotiation can work on', () => {
    const { win } = world([master()]);
    const c = win.createAmendment(win.state.contracts[0], {}).contract;
    win.negoInit(c);
    assert.equal(win.negoClauses(c).length, 4);
  });

  test('a contract with no template and no wording no longer kills the Document tab', () => {
    /* docBody read `TEMPLATES[c.template].kind` while the line beside it fell
       back to BUILD.ND. Nothing could reach that state until an amendment could
       be written from blank paper. Both halves of the expression agree now. */
    const { win } = world([master()]);
    const bare = { id: 'MK-BARE', name: 'Nothing', counterparty: 'Juno Limited',
      status: 'Draft', template: null, fields: {}, metadata: {}, audit: [], signatures: [] };
    assert.doesNotThrow(() => win.docBody(bare));
  });
});

describe('f193 · families stay one level deep', () => {
  test('an amendment offers no Create of its own', () => {
    const { win } = world([master()]);
    const c = win.createAmendment(win.state.contracts[0], {}).contract;
    const again = win.createAmendment(c, {});
    assert.ok(again.error, 'the model refuses');
    assert.match(again.error, /one level deep/i);
    assert.equal(win.state.contracts.length, 2, 'and nothing was created');
  });

  test('the panel does not draw the button either — a hidden verb is not a rule', () => {
    const { win } = world([master()]);
    const c = win.createAmendment(win.getContract('MK-1042'), {}).contract;
    const host = win.document.getElementById('family-section');

    win.renderFamilySection(win.getContract('MK-1042'));
    assert.match(host.innerHTML, /id="fam-create"/, 'the master offers it');

    win.renderFamilySection(c);
    assert.ok(!/id="fam-create"/.test(host.innerHTML), 'the amendment does not');
    assert.match(host.innerHTML, /id="fam-unlink"/, 'it offers Unlink instead');
  });
});

describe('f193 · the panel that was built and never drawn', () => {
  const panel = (win, c) => {
    win.renderFamilySection(c);
    return win.document.getElementById('family-section').innerHTML;
  };

  test('a standalone agreement says so, and offers all three acts', () => {
    const { win } = world([master({ id: 'MK-SOLO' })]);
    const html = panel(win, win.state.contracts[0]);
    assert.match(html, /standalone agreement/i);
    assert.match(html, /id="fam-create"/, 'write one');
    assert.match(html, /id="fam-add"/, 'attach one');
    assert.match(html, /id="fam-link"/, 'or file this under a master');
  });

  test('a master drops the third — linkError would only ever refuse it', () => {
    /* A control whose one outcome is a refusal is furniture. */
    const { win } = world([master()]);
    win.createAmendment(win.state.contracts[0], {});
    const p = win.state.contracts.find(x => x.id === 'MK-1042');
    const html = panel(win, p);
    assert.match(html, /id="fam-create"/);
    assert.match(html, /id="fam-add"/);
    assert.ok(!/id="fam-link"/.test(html));
    assert.ok(win.linkError(p, 'MK-OTHER'), 'because the model refuses it anyway');
  });

  test('the master states the live expiry and where it came from', () => {
    /* The sentence the whole feature exists for: the date this agreement really
       ends is not the date typed on it. */
    const { win } = world([master()]);
    const c = win.createAmendment(win.state.contracts[0],
      { relation: 'amendment', expiry: '2029-03-31' }).contract;
    const html = panel(win, win.state.contracts.find(x => x.id === 'MK-1042'));
    assert.match(html, /2029-03-31/);
    assert.match(html, new RegExp(c.id));
    assert.match(html, /one agreement · 2 documents/);
  });

  test('a viewer sees the facts and none of the verbs', () => {
    const w = buildWorld({ user: ME, family: true, canEdit: false });
    w.win.state = { settings: {}, contracts: [master()], activeId: null, view: 'workspace' };
    w.win.getContract = id => w.win.state.contracts.find(x => x.id === id) || null;
    const html = panel(w.win, w.win.state.contracts[0]);
    assert.match(html, /standalone agreement/i, 'the statement is a fact from every chair');
    assert.ok(!/id="fam-create"/.test(html));
    assert.ok(!/id="fam-add"/.test(html));
    assert.ok(!/id="fam-link"/.test(html));
  });
});

describe('f193 · the word that had to change', () => {
  const SRC = fs.readFileSync(path.join(__dirname, '..', 'js', 'family.js'), 'utf8');

  test('"Add an amendment" is retired — it added nothing', () => {
    /* It attached a document you already had. Put a button beside it that
       genuinely writes one and you have two buttons reading the same and doing
       different things. The old act keeps its own words. */
    const I = require('../js/i18n.js');
    assert.equal(I.STRINGS.en.fa_add_amendment, undefined, 'gone from English');
    assert.equal(I.STRINGS.sv.fa_add_amendment, undefined, 'and from Swedish');
    assert.equal(I.STRINGS.en.fa_link_existing, 'Link an existing document');
    assert.ok(I.STRINGS.sv.fa_link_existing, 'in both languages');
    assert.ok(!/fa_add_amendment/.test(SRC), 'and nothing still asks for it');
  });

  test('every new string exists in both languages', () => {
    const I = require('../js/i18n.js');
    assert.deepEqual(I.langMissingKeys('sv'), []);
  });

  test('the modal that attaches a document is translated too', () => {
    /* Its heading was hardcoded English inside a dialog whose every other line
       goes through i18t — the same half-a-sentence-per-language fault the
       import box had. */
    assert.ok(!/'Link to a parent agreement':'Add an amendment'/.test(SRC));
    assert.match(SRC, /i18t\('fa_link_parent'\):i18t\('fa_link_existing'\)/);
  });

  test('the skeleton’s own four sentences are NOT in the dictionary', () => {
    /* Deliberate. All twelve built-in templates draft their paper in English
       whatever the reader has chosen (docBody's BUILD), and this document's
       title is English for the record rule above. A skeleton that followed the
       reader would put a Swedish body under an English title on a page the
       counterparty reads. */
    const I = require('../js/i18n.js');
    assert.equal(I.STRINGS.en.fa_sk_recital, undefined);
    assert.match(SRC, /IN ENGLISH, ALWAYS, and that is not an oversight/);
  });
});
