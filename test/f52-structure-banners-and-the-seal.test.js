/* f52 — four reports from using the product
   ============================================================
   1. THE ROOM STACKED ITS NOTICES. Readiness, "every change is resolved",
      whose turn it is and the comparison bar all rendered unconditionally, one
      under another, so a contract could carry three notices that between them
      said three different things about where it stood. On an EXECUTED contract
      two of them were simply false — still inviting the reader to propose
      changes, and to issue a signing link for a deal already signed.

   2. A CONTRACT ARRIVED AS A WALL OF PROSE. Its numbering and its bullets are
      how a reader finds clause 7 and how a negotiation cites it. Two intake
      faults destroyed them in opposite directions: the PDF fallback scrape
      collapsed every newline into a space (one paragraph for the whole
      agreement, page footers inside it), and the structured path emitted one
      paragraph per VISUAL line (a wrapped sentence shredded into three, and
      "1. Services" demoted to body text).

   3. The general discussion panel is removed — see f31, which now asserts its
      absence and records what that costs.

   4. PRINTING A SIGNED CONTRACT LOST ITS SEAL. exportPDF took its body from
      docBody(), which folds the execution block in only when a frozen
      `execution.html` exists. Anything else — a contract signed without one, an
      uploaded document — printed the wording, a lone SHA-256 box and an audit
      trail. No signatures, no "Executed & Sealed": the one page that most needs
      to prove it was signed was the one that did not. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { buildWorld } = require('./world');
const { buildPortal, sharePayloadFor } = require('./portalworld');
const F = require('./clausefixtures.js');

/* ============================================================
   1 — one notice at a time
   ============================================================ */
function contract(over = {}){
  return { id: 'MK-196', name: 'Warehousing and Logistics Services Agreement',
    counterparty: 'Nordfrakt Logistik AB', template: 'WH', status: 'Under Review',
    folder: 'dist', fields: {}, metadata: {}, audit: [], rounds: [], versions: [],
    signatures: [], comments: [], redlineText: F.protoRich(), format: 'rich', ...over };
}
/* THE CONTRACT IS NEGOTIATED FIRST AND EXECUTED AFTER, which is both how it
   happens and, since f106, the only order the model permits. This helper used
   to stamp `status: 'Signed'` on the record and then file changes against it,
   which worked only because negoFileChange asked nothing about execution — the
   fault MK-248 was reported for. The negoResolve calls in those setups were
   already no-ops against the signed door, so the "accepted" they claimed to set
   up never existed; the banner assertions below never depended on it.

   So the executed fields are held back, the negotiation happens on a draft, and
   the record is stamped executed at the end — the same end state, arrived at
   the way a real contract arrives at it. */
const EXECUTED_KEYS = ['status', 'signedAt', 'hash', 'execution'];
async function room(over = {}, opts = {}){
  const { win } = buildWorld({ negotiationView: true });
  const executedAfter = {};
  const draftOver = { ...over };
  if (String(over.status || '') === 'Signed'){
    for (const k of EXECUTED_KEYS)
      if (k in draftOver){ executedAfter[k] = draftOver[k]; delete draftOver[k]; }
  }
  const c = contract(draftOver);
  win.negoInit(c);
  const filed = [];
  for (const n of (opts.asks || ['4', '6'])){
    const cl = win.negoClauseList(c).find(x => x.num === n);
    filed.push(await win.negoEditClause(c, cl.clauseId, `<p>${F.PROTO_ASKS[n].text}</p>`,
      { side: 'owner', author: 'Wanjiru Kamau', summary: F.PROTO_ASKS[n].summary }));
  }
  if (opts.before) opts.before(win, c, filed);
  Object.assign(c, executedAfter);
  win.openNegotiationRoom(c, { side: 'owner', by: 'Wanjiru Kamau', persist: false,
    readonly: !!opts.readonly, ...(opts.render || {}) });
  const d = win.document;
  return { win, c, filed, d,
    /* Every notice the room can raise, in one list. The claim under test is
       about how many of these are on the screen, so they are counted rather
       than checked one at a time. */
    notices: () => ['nego-ready-signal', 'nego-ready', 'nego-turn', 'nego-closed']
      .filter(id => d.getElementById(id)),
    text: id => (d.getElementById(id) || {}).textContent?.replace(/\s+/g, ' ').trim() || '' };
}

describe('the room raises one notice at a time', () => {
  test('mid-negotiation it is whose turn it is, and nothing else', async () => {
    const r = await room();
    assert.deepEqual(r.notices(), ['nego-turn'], 'one notice, and it is the live question');
  });

  test('everything settled, it is the readiness prompt instead', async () => {
    const r = await room({}, { before: (win, c, filed) => {
      for (const ch of filed) win.negoResolve(c, ch.id, 'accepted', { side: 'counterparty', by: 'Erik' });
    } });
    assert.deepEqual(r.notices(), ['nego-ready'], 'the turn banner steps aside for it');
  });

  test('somebody has signalled, and that supersedes both', async () => {
    const r = await room({}, { before: (win, c, filed) => {
      for (const ch of filed) win.negoResolve(c, ch.id, 'accepted', { side: 'counterparty', by: 'Erik' });
      win.negoSignalReady(c, { side: 'counterparty', by: 'Erik Lindqvist' });
    } });
    assert.deepEqual(r.notices(), ['nego-ready-signal']);
    assert.match(r.text('nego-ready-signal'), /ready to sign/);
  });

  /* The report: a SIGNED contract still saying "Your turn — propose changes or
     send it back", above a banner offering to issue a signing link for a deal
     that had already been signed. */
  test('an executed contract says so, and says nothing else', async () => {
    const r = await room({ status: 'Signed', signedAt: '27 Jul 2026, 16:30' }, {
      readonly: true,
      before: (win, c, filed) => {
        for (const ch of filed) win.negoResolve(c, ch.id, 'accepted', { side: 'counterparty', by: 'Erik' });
        win.negoSignalReady(c, { side: 'counterparty', by: 'Erik Lindqvist' });
      } });
    assert.deepEqual(r.notices(), ['nego-closed'], 'one notice on a closed contract');
    assert.match(r.text('nego-closed'), /executed and sealed/i);
    assert.match(r.text('nego-closed'), /read-only/);
    assert.equal(r.d.getElementById('nego-issue-signing'), null,
      'and no invitation to take forward a deal that is already done');
    assert.ok(!/Your turn/.test(r.d.body.textContent), 'nor a turn to take');
  });

  test('a declined contract says that, in its own words', async () => {
    const r = await room({ status: 'Declined' }, { readonly: true });
    assert.deepEqual(r.notices(), ['nego-closed']);
    assert.match(r.text('nego-closed'), /declined/i);
    assert.match(r.text('nego-closed'), /closed/);
  });

  test('while comparing two versions the live notices stand down', async () => {
    const r = await room();
    r.win.negoSetComparePair('baseline', 'v1');
    r.win.openNegotiationRoom(r.c, { side: 'owner', by: 'Wanjiru Kamau', persist: false });
    assert.deepEqual(r.notices(), [],
      'they describe a round the reader is not currently looking at');
    r.win.negoSetComparePair('baseline', 'working');
  });

  /* It read "Young Mbagaya signalled Young Mbagaya is ready to sign". The
     signer and the party they sign for are usually the same words. */
  test('the readiness notice names the signer once', async () => {
    const r = await room({ counterparty: 'Young Mbagaya' }, { before: (win, c, filed) => {
      for (const ch of filed) win.negoResolve(c, ch.id, 'accepted', { side: 'counterparty', by: 'Erik' });
      win.negoSignalReady(c, { side: 'counterparty', by: 'Young Mbagaya' });
    } });
    const t = r.text('nego-ready-signal');
    assert.match(t, /Young Mbagaya signalled they are ready to sign/);
    assert.ok(!/Young Mbagaya signalled Young Mbagaya/.test(t), 'and not twice: “' + t + '”');
  });
});

/* ============================================================
   2 — a contract keeps its structure
   ============================================================ */
describe('structure is read from the wording, not from the line breaks', () => {
  const { win } = buildWorld({});
  const rich = t => win.docRichFromText(t);

  /* The structured PDF reader emits one line per line of the PAGE. */
  const WRAPPED = [
    'WAREHOUSING & DISTRIBUTION SERVICES AGREEMENT',
    'THIS AGREEMENT is made between Siginon Group ("the Company") and Rafiki Consumer Brands Ltd, a',
    'company incorporated in the Republic of Kenya ("the Counterparty"). By signing below the Counterparty',
    'accepts the terms set out in this document.',
    '1. Services',
    'The Provider shall receive, store and distribute the Counterparty\'s finished goods from its facility,',
    'including up to 1,200 pallet positions and ambient handling.',
    'PAGE 1 OF 4',
    '2. Charges',
    'A monthly service charge of KES 1,500,000 applies, exclusive of VAT.',
  ].join('\n');

  test('a sentence that wrapped across three lines is one paragraph', () => {
    const html = rich(WRAPPED);
    assert.match(html, /<p>THIS AGREEMENT is made between Siginon Group[^<]*accepts the terms set out in this document\.<\/p>/,
      'three lines of a page are not three paragraphs of a contract');
  });

  test('a numbered clause title is a heading, not body text', () => {
    const html = rich(WRAPPED);
    assert.match(html, /<h2>1\. Services<\/h2>/);
    assert.match(html, /<h2>2\. Charges<\/h2>/);
    assert.ok(!/<p>1\. Services<\/p>/.test(html), 'a reader navigates by these');
  });

  test('the title is the title', () => {
    assert.match(rich(WRAPPED), /<h1>WAREHOUSING &amp; DISTRIBUTION SERVICES AGREEMENT<\/h1>/);
  });

  test('what the page printed about itself is not part of the agreement', () => {
    assert.ok(!/PAGE 1 OF 4/.test(rich(WRAPPED)),
      'a page footer wedged between two clauses is noise on every read');
  });

  test('every word survives — this rearranges blocks, it does not edit', () => {
    const html = rich(WRAPPED);
    for (const phrase of ['Siginon Group', 'Rafiki Consumer Brands Ltd', '1,200 pallet positions',
      'KES 1,500,000', 'ambient handling'])
      assert.ok(html.includes(phrase), 'lost: ' + phrase);
  });

  /* The fallback scrape's output: no line structure at all. */
  const RUNON = 'THIS WAREHOUSING AND LOGISTICS SERVICES AGREEMENT (the "Agreement") is entered into '
    + 'this 1st day of August, 2026, BY AND BETWEEN: 1. APEX LOGISTICS & WAREHOUSING KENYA LIMITED, '
    + 'a limited liability company incorporated under the Companies Act, 2015 of the Laws of Kenya; '
    + 'AND 2. SAVANNAH CONSUMER GOODS LIMITED, a limited liability company incorporated under the '
    + 'Companies Act, 2015. RECITALS: • WHEREAS, the Logistics Provider provides warehousing; '
    + '• WHEREAS, the Customer desires to engage the Logistics Provider. NOW, THEREFORE, IT IS '
    + 'HEREBY AGREED as follows: PAGE 1 OF 4 1. DEFINITIONS In this Agreement the following terms '
    + 'shall have the meanings set out below and shall be construed accordingly.';

  test('a run-on blob is recognised as having lost its structure', () => {
    assert.equal(win.docTextIsRunOn(RUNON), true);
    assert.equal(win.docTextIsRunOn(WRAPPED), false,
      'and properly broken text is left alone — the two repairs are opposites');
  });

  test('the parties come back as a numbered list', () => {
    const html = rich(RUNON);
    assert.match(html, /<ol[^>]*><li>APEX LOGISTICS/);
    assert.match(html, /<li>SAVANNAH CONSUMER GOODS LIMITED/);
  });

  test('the recitals come back as bullets', () => {
    const html = rich(RUNON);
    assert.match(html, /<ul><li>WHEREAS, the Logistics Provider provides warehousing;<\/li>/);
    assert.match(html, /<li>WHEREAS, the Customer desires to engage the Logistics Provider\.<\/li><\/ul>/);
  });

  test('and it is no longer one paragraph containing the whole agreement', () => {
    const html = rich(RUNON);
    const blocks = (html.match(/<(?:p|h1|h2|ol|ul)[ >]/g) || []).length;
    assert.ok(blocks >= 5, 'got ' + blocks + ' blocks: ' + html);
  });

  test('the page footer does not end up mid-sentence', () => {
    assert.ok(!/PAGE 1 OF 4/.test(rich(RUNON)));
  });

  /* "…under the Companies Act, 2015. RECITALS" — read as clause 2015, which
     invented a clause and hung the recitals under it. */
  test('a year ending a sentence is not read as a clause number', () => {
    const html = rich(RUNON);
    assert.ok(!/<h2>2015\./.test(html), 'no clause 2015: ' + html.slice(0, 400));
    assert.match(html, /<h2>RECITALS:<\/h2>/, 'and the recitals heading stands on its own');
  });

  test('the negotiation model takes its document through the same builder', () => {
    const w = buildWorld({});
    assert.equal(w.win.negoRichFromLines(WRAPPED), w.win.docRichFromText(WRAPPED),
      'one description of the structure, not one per caller');
  });
});

/* ============================================================
   3 — nothing the panel left behind is still pressable
   ============================================================ */
describe('removing the discussion panel left no dead controls', () => {
  /* The open-points card carried a reply box per point, wired by the same
     function that wired the panel. Deleting the panel without deleting these
     would have left a Send button that did nothing — the exact fault this
     product has spent a session removing. */
  test('the open points card is for reading, and offers nothing to press', () => {
    const p = buildPortal();
    const c = contract({
      rounds: [{ n: 1, at: '2026-07-20T09:00:00Z', by: 'Erik Lindqvist', status: 'closed',
        baseText: 'Payment within thirty (30) days.',
        proposedText: 'Payment within sixty (60) days.',
        blockDecisions: [{ id: 'b0', decision: 'reject', before: 'thirty (30)', after: 'sixty (60)',
          note: 'Net-60 is our standard.', reply: 'Net-30 stands.' }],
        resolution: { decision: 'rejected', at: '2026-07-21T09:00:00Z', comment: 'Net-30 stands.' } }] });
    p.open(sharePayloadFor(p, c), { token: 'tok', messages: [] });
    const d = p.win.document;
    const points = d.getElementById('pt-openpoints');
    if (!points) return;                       // nothing outstanding on this fixture
    assert.equal(points.querySelector('textarea'), null, 'nowhere to type');
    assert.equal(points.querySelector('button'), null, 'and nothing to press');
    assert.match(points.textContent.replace(/\s+/g, ' '), /sixty \(60\)|Net-60|open/i,
      'but the point itself still reads');
  });
});

/* ============================================================
   4 — a printed contract carries its seal
   ============================================================ */
describe('printing a signed contract', () => {
  function printed(over = {}){
    const p = buildPortal();
    p.win.print = () => {};
    p.win.persist = () => {};
    p.win.renderAuditSection = () => {};
    const c = p.win.migrateContract({
      ...contract({ status: 'Signed', signedAt: '27 Jul 2026, 16:30',
        hash: '1c71d57e9298790d100811f4108f3e2332562ad17e24401c2509fe7ef660cebb',
        execution: { textHash: '76522835 0E8c989bb2740Bcee75Ef8b27B0c6745d8b9853e1f0499305a59526'.replace(/ /g, '') },
        audit: [{ at: '2026-07-27T16:30:00Z', user: 'Young Mbagaya', action: 'Signed',
          detail: 'Executed and sealed' }],
        signatures: [{ party: 'first', name: 'Young Mbagaya', email: 'youngmbg21@gmail.com',
          form: 'type', at: '2026-07-27T16:30:00Z' }] }),
      ...over });
    p.win.exportPDF(c);
    return { c, win: p.win,
      html: p.win.document.getElementById('print-root').innerHTML,
      text: p.win.document.getElementById('print-root').textContent.replace(/\s+/g, ' ') };
  }

  test('the execution block is on the printed page at all', () => {
    const r = printed();
    assert.match(r.text, /Executed & Sealed/,
      'the page that most needs to prove it was signed printed no proof of it');
  });

  test('with who signed, how and when', () => {
    const r = printed();
    assert.match(r.text, /Young Mbagaya/);
    assert.match(r.text, /youngmbg21@gmail\.com/);
    assert.match(r.text, /type signature/);
    assert.match(r.text, /First party/);
  });

  test('with the sealed text fingerprint, which is not the same number as the seal', () => {
    const r = printed();
    assert.match(r.text, /Sealed text fingerprint/);
    assert.ok(r.text.includes('765228350E8c989bb2740Bcee75Ef8b27B0c6745d8b9853e1f0499305a59526'));
  });

  test('and the document seal, exactly once', () => {
    const r = printed();
    const hash = '1c71d57e9298790d100811f4108f3e2332562ad17e24401c2509fe7ef660cebb';
    const n = r.html.split(hash).length - 1;
    assert.equal(n, 1, 'two copies of one fingerprint read like two different seals');
  });

  /* The case that produced the report: signed, but with no frozen
     execution.html for docBody to fold the block into. */
  test('it prints even when there is no frozen body to have carried it', () => {
    const r = printed({ execution: { textHash: 'abc123' } });   // no .html
    assert.match(r.text, /Executed & Sealed/);
    assert.match(r.text, /Young Mbagaya/);
  });

  test('the wording is still there, and still first', () => {
    const r = printed();
    const surface = r.win.document.querySelector('#print-root .doc-surface');
    assert.ok(surface && surface.textContent.trim().length > 200, 'the contract itself prints');
    const first = surface.textContent.trim().slice(0, 40);
    assert.ok(r.text.indexOf('Executed & Sealed') > r.text.indexOf(first.slice(0, 20)),
      'the execution follows the agreement, as it does on the page');
  });

  test('an unsigned contract gets no execution block and no seal', () => {
    const p = buildPortal();
    p.win.print = () => {}; p.win.persist = () => {}; p.win.renderAuditSection = () => {};
    const c = p.win.migrateContract(contract());
    p.win.exportPDF(c);
    const t = p.win.document.getElementById('print-root').textContent;
    assert.ok(!/Executed & Sealed/.test(t), 'nothing has been executed');
    assert.ok(!/DOCUMENT SEAL/.test(t));
  });

  test('the audit trail still prints below it', () => {
    const r = printed();
    assert.match(r.text, /Audit trail/);
  });
});
