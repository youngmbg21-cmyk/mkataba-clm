/* ============================================================
   f145 — company standard paper is a window per clause, not one window
   ============================================================
   Reported from the field with a screenshot (Young, 04 Aug 2026). A freight
   and logistics agreement was brought in as company standard paper, a contract
   was drafted from it, and the Redline page drew the ENTIRE agreement as a
   single clause: one box, one "Direct Edit" button at the very foot of the
   page, and no way to work on clause 8 without opening clause 1 through 10 at
   the same time.

   THE CAUSE IS IN THE CLAUSE MODEL, not in the template feature. That document
   is typed the way a great many standard contracts are typed: the agreement's
   name is the only real HEADING, and every clause is an ordinary paragraph
   opening with its own number — "8. Termination. Either party may…".

   clauseSegment had two readings and this document fell between them. With no
   headings at all it read one clause per block (right). With headings it read
   a clause per heading (right). With exactly ONE heading it opened a clause on
   that heading and poured the whole contract into its body — and because the
   title is only recognised as chrome when a LOWER-RANKED heading exists later,
   the lone <h1> was never recognised as a title either.

   The fix says a heading that is the document's only heading cannot be marking
   clause boundaries: it is the title, and the blocks under it fall to the
   per-block reading. Everything downstream — the workbench, the room, the
   portal, the phone — draws from that one list, so it is fixed in one place.

   The second half of the report — "it does not allow me to edit by claude" —
   is the same screenshot: the clause toolbar offered Direct Edit and nothing
   else, because the Copilot had been made reachable only by highlighting
   wording, which is an invisible affordance. The button is back, and it is
   pinned here as a door onto the SAME menu rather than a second proposal path. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { buildWorld } = require('./world');

/* Exactly what templateFormDocHtml emits for the reported document: one
   heading block (the agreement's name) and everything else as paragraphs. */
const FREIGHT = [
  '<h1>FREIGHT &amp; LOGISTICS SERVICES AGREEMENT</h1>',
  '<p>Contract No. LOG-2026-0042</p>',
  '<p>This Agreement is entered into on 4 August 2026 between:</p>',
  '<p>Nordkraft Bygg AB, Reg. No. 556677-8899, Stockholm, Sweden ("Customer"); and</p>',
  '<p>Baltic Line Transport ApS, CVR No. 41229876, Copenhagen, Denmark ("Carrier").</p>',
  '<p>1. Services. Carrier shall provide road freight transport of palletised construction materials.</p>',
  '<p>2. Term. This Agreement starts on 1 September 2026 and runs for twelve (12) months.</p>',
  '<p>3. Rates &amp; Payment. Rates are set out in Annex A. Invoices are payable within forty-five (45) days.</p>',
  '<p>8. Termination. Either party may terminate for material breach not remedied within thirty (30) days.</p>',
  '<p>9. Confidentiality. Each party shall keep the other’s pricing and volumes confidential.</p>',
  '<p>10. Governing Law. This Agreement is governed by Swedish law.</p>',
  '<p>Signed by the duly authorised representatives of the parties:</p>',
].join('');

/* A document that DOES mark its clauses with headings. Nothing about it may
   move: it is the shape the whole change model was built on. */
const HEADED = [
  '<h1>MASTER SERVICES AGREEMENT</h1>',
  '<p>Between Alpha Ltd and Beta Ltd.</p>',
  '<h2>1. Scope</h2><p>The Supplier shall supply the Services.</p>',
  '<h2>2. Payment</h2><p>Net thirty (30) days.</p>',
].join('');

function contractFixture(over = {}){
  return { id: 'MK-300', name: 'Freight & Logistics Services Agreement',
    counterparty: 'Baltic Line Transport ApS', template: 'SV', status: 'Under Review',
    folder: 'proc', fields: {}, metadata: {}, audit: [], rounds: [], versions: [],
    signatures: [], comments: [], redlineText: FREIGHT, format: 'rich', ...over };
}

async function page(over = {}){
  const w = buildWorld({ negotiationView: true });
  const { win } = w;
  win.promptDialog = async () => '';
  win.openShareModal = () => {};
  const c = contractFixture(over);
  win.negoInit(c);
  win.state = Object.assign({}, win.state, { contracts: [c], activeId: c.id, view: 'redline' });
  win.getContract = id => (id === c.id ? c : null);
  win.renderRedline();
  const doc = win.document;
  return { w, win, c, doc,
    clauses: () => [...doc.querySelectorAll('#rl-doc .rl-clause[data-clause]')] };
}

describe('f145 — the clause model reads standard paper as clauses', () => {

  test('a contract whose only heading is its title is NOT one clause', () => {
    const { win } = buildWorld();
    const cls = win.clauseSegment(FREIGHT);
    assert.ok(cls.length > 1,
      `the whole agreement came back as ${cls.length} clause — this is the reported defect`);
    const text = cls.map(x => String(x.text));
    assert.ok(text.some(t => /^8\. Termination/.test(t)),
      'clause 8 is a clause of its own, addressable on its own');
    assert.ok(text.some(t => /^10\. Governing Law/.test(t)));
    /* The point of the whole fix: no single clause holds the argument end to
       end. If one did, the page would draw one editing window again. */
    assert.ok(!text.some(t => /Termination/.test(t) && /Governing Law/.test(t)),
      'no clause swallows the document');
  });

  test('the title is the document\'s name, never a negotiable clause', () => {
    const { win } = buildWorld();
    const front = win.clauseFrontMatter(FREIGHT);
    assert.equal(front.titleText, 'FREIGHT & LOGISTICS SERVICES AGREEMENT');
    /* And it does not ALSO claim the contract as its recital — that would
       print the whole agreement as unnegotiable front matter, which is the
       same defect wearing the opposite coat. */
    assert.equal(front.bodyHtml, '', 'the clauses under the title are clauses, not a recital');
    assert.ok(!win.clauseSegment(FREIGHT).some(cl => /FREIGHT & LOGISTICS/.test(String(cl.text))),
      'the title is not filed as a clause');
  });

  test('every clause is stamped with an id, and stamping twice moves nothing', () => {
    const { win } = buildWorld();
    const once = win.clauseStampIds(FREIGHT);
    assert.ok(once.stamped > 1, `expected an id per clause, got ${once.stamped}`);
    const ids = win.clauseSegment(once.html).map(cl => cl.clauseId);
    assert.ok(ids.every(Boolean), 'a clause with no id can be read but never negotiated');
    assert.equal(new Set(ids).size, ids.length, 'ids are unique');
    const twice = win.clauseStampIds(once.html);
    assert.equal(twice.stamped, 0, 'a second pass stamps nothing');
    assert.deepEqual(Array.from(win.clauseSegment(twice.html).map(cl => cl.clauseId)),
      Array.from(ids), 'and re-points nothing');
  });

  test('a document that marks its clauses with headings is untouched', () => {
    const { win } = buildWorld();
    const cls = win.clauseSegment(HEADED);
    assert.equal(cls.length, 2, 'two headings, two clauses');
    assert.deepEqual(Array.from(cls.map(x => x.num)), ['1', '2']);
    const front = win.clauseFrontMatter(HEADED);
    assert.equal(front.titleText, 'MASTER SERVICES AGREEMENT');
    assert.ok(/Alpha Ltd/.test(front.bodyHtml), 'its recital is still a recital');
  });

  test('a genuinely headingless document still reads one clause per block', () => {
    const { win } = buildWorld();
    const wall = '<p>First paragraph of the agreement.</p><p>Second paragraph of the agreement.</p>';
    assert.equal(win.clauseSegment(wall).length, 2);
  });
});

describe('f145 — the workbench draws a window per clause', () => {
  /* REVERSED IN PLACE, 16 Aug 2026. This section grew up around the clause
     toolbar — one Direct Edit per clause, a Copilot button on each, the
     button opening the clause-scoped menu. The owner has retired that whole
     surface ("there should be no ability to make edits on the contract
     itself … All edits will happen on the side panel"), so the claim each
     test carried moves to its successor: the window-per-clause claim itself
     is unchanged, the per-clause DOOR is the green Edit pill, and the
     Copilot's routes are the highlight on the paper and the panel. */

  test('every clause gets its own box and its own Edit pill', async () => {
    const p = await page();
    const boxes = p.clauses();
    assert.ok(boxes.length > 1,
      `the page drew ${boxes.length} clause box — the screenshot's single window`);
    const pills = p.doc.querySelectorAll('#rl-doc .rl-cp-pill');
    assert.equal(pills.length, boxes.length,
      'one door per clause, not one for the whole document');
    assert.equal(p.doc.querySelectorAll('#rl-doc [data-nego-edit]').length, 0,
      'and no Direct Edit anywhere on the paper — writing happens in the panel');
  });

  test('and no clause-level Copilot button on any of them', async () => {
    const p = await page();
    assert.equal(p.doc.querySelectorAll('#rl-doc [data-nego-ai-clause]').length, 0,
      'the highlight and the panel are the Copilot\'s doors now');
  });

  /* The counterparty's page mounts the same workbench with noAi, because it
     has no Copilot panel to route an ask into. A promise that opened nothing
     would be worse than no promise — the panel's violet Copilot note stands
     down with noAi exactly as the retired button did. */
  test('a page with no Copilot shows no Copilot signal in the panel', async () => {
    const w = buildWorld({ negotiationView: true });
    const { win } = w;
    const c = contractFixture();
    win.negoInit(c);
    win.state = Object.assign({}, win.state, { contracts: [c], activeId: c.id });
    const host = win.document.createElement('div');
    win.document.body.appendChild(host);
    win.redlineEmbed(host, c, { side: 'counterparty', noAi: true, selMenu(){}, persist: false });
    assert.ok(host.querySelectorAll('[data-rl-cp-edit]').length > 0, 'it can still redline — through the panel');
    assert.equal(host.querySelectorAll('.rl-cp-ai-note').length, 0);
  });

  test('an executed contract offers neither door', async () => {
    const p = await page({ status: 'Signed', hash: '0xabc' });
    assert.equal(p.doc.querySelectorAll('#rl-doc .rl-cp-pill').length, 0);
    assert.equal(p.doc.querySelectorAll('#rl-cp [data-rl-cp-edit]').length, 0);
  });
});
