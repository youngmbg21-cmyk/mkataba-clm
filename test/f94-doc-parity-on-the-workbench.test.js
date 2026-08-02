/* ============================================================
   F94 — the workbench shows THE DOCUMENT, front matter included
   ============================================================
   The Doc page opens a contract with its kicker line, its own title and the
   recital naming the parties and key terms. The clause model rightly calls
   all of that chrome (nobody negotiates a title), but the Redline page used
   to LOSE it: the canvas opened at "1." under a heading invented from the
   record's display name — the same agreement reading as two different
   documents depending on which tab you were on.

   Two mechanisms close the gap, and both are pinned here:

     · clauseFrontMatter returns exactly what clauseSegment skips — detected
       by the same rule, so the two can never disagree — and the workbench
       renders it above the clauses;
     · an UNTOUCHED negotiation re-reads its baseline from the document
       (negoFreshenBaseline), so key terms filled on the Doc page after the
       workbench's first paint show up here too. The guards are the round
       model's contract: one filed change, one archived round or one issued
       hash and the baseline may not move. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { buildWorld } = require('./world');

/* A template-shaped body, as docRichFromText lifts one: kicker paragraph,
   the document's own <h1>, the recital, then the clauses. */
const KICKER = 'Raw Material Supply · Republic of Kenya · MK-903';
const RECITAL = 'This Raw Material Supply Agreement is made on 31 Jul 2026 between Young (the "Buyer") and Juno Limited (the "Supplier") for the supply of Sugar into the Buyer\'s production facilities in Kenya.';
const RICH = [
  `<p>${KICKER}</p>`,
  '<h1>RAW MATERIAL SUPPLY AGREEMENT</h1>',
  `<p>${RECITAL}</p>`,
  '<h2>1. Supply &amp; Specification</h2>',
  '<p>The Supplier shall supply an estimated 5000 metric tonnes per annum.</p>',
  '<h2>2. Price &amp; Contract Value</h2>',
  '<p>The estimated annual contract value is KES —, based on agreed per-tonne pricing.</p>',
].join('');

function contractFixture(over = {}){
  return { id: 'MK-903', name: 'Raw Material Supply Agreement — Juno Limited',
    counterparty: 'Juno Limited', template: 'RM', status: 'Under Review',
    folder: 'proc', fields: {}, metadata: {}, audit: [], rounds: [], versions: [],
    signatures: [], comments: [], redlineText: RICH, format: 'rich', ...over };
}

async function page(opts = {}){
  const w = buildWorld({ negotiationView: true });
  const { win } = w;
  win.promptDialog = async () => 'Because the commercial terms require it.';
  win.openAI = () => {}; win.aiPush = () => {}; win.renderAIFeed = () => {};
  win.copilotAvailable = () => false;
  win.openShareModal = () => {};
  win.counterpartyContact = () => null;
  win.reshareToLastRecipient = async () => ({ delivered: true });
  win.cachedShares = () => [];
  const c = opts.contract || contractFixture();
  win.negoInit(c);
  win.state = Object.assign({}, win.state, { contracts: [c], activeId: c.id, view: 'redline' });
  win.getContract = id => (id === c.id ? c : null);
  win.renderRedline();
  return { w, win, c, doc: win.document,
    $: sel => win.document.querySelector(sel),
    $$: sel => [...win.document.querySelectorAll(sel)] };
}

describe('F94 (1) — clauseFrontMatter returns what the segmentation skips', () => {
  test('kicker, title and recital come back; the clauses do not', async () => {
    const p = await page();
    const front = p.win.clauseFrontMatter(RICH);
    assert.equal(front.titleText, 'RAW MATERIAL SUPPLY AGREEMENT');
    assert.match(front.leadHtml, /Republic of Kenya · MK-903/);
    assert.match(front.bodyHtml, /between Young \(the "Buyer"\) and Juno Limited/);
    assert.ok(!/Supply & Specification/.test(front.bodyHtml),
      'the clauses belong to clauseSegment, not the front matter');
  });

  test('a wall of paragraphs has no front matter to invent', async () => {
    const p = await page();
    const front = p.win.clauseFrontMatter('<p>one</p><p>two</p><p>three</p>');
    assert.equal(front.titleText, '');
    assert.equal(front.bodyHtml, '');
  });

  test('it uses the same detection as the segmentation', async () => {
    // every clause the segmentation returns must be absent from the front
    // matter, and vice versa — one rule, two views of it
    const p = await page();
    const front = p.win.clauseFrontMatter(RICH);
    const clauses = p.win.clauseSegment(RICH);
    assert.equal(clauses.length, 2, 'two clauses in the fixture');
    for (const cl of clauses)
      assert.ok(!front.bodyHtml.includes(cl.headingText), cl.headingText);
  });
});

describe('F94 (2) — the workbench canvas opens like the Doc page', () => {
  test('the title is the document\'s own, not the record\'s display name', async () => {
    const p = await page();
    const title = p.$('#rl-doc .rl-paper-title');
    assert.equal(title.textContent.trim(), 'RAW MATERIAL SUPPLY AGREEMENT');
    assert.ok(!/JUNO LIMITED/.test(title.textContent),
      '"— Juno Limited" is the register\'s label, not the contract\'s title');
  });

  test('the kicker line renders above the title, the recital below it', async () => {
    const p = await page();
    assert.match(p.$('#rl-doc .rl-paper-kick').textContent, /Republic of Kenya · MK-903/);
    const recital = p.$('#rl-doc .rl-recital');
    assert.ok(recital, 'the party/key-terms paragraph is on the page');
    assert.match(recital.textContent, /for the supply of Sugar/);
    /* and it sits before clause 1, as the document orders it */
    const paper = p.$('#rl-doc .rl-paper');
    const firstClause = p.$('#rl-doc .rl-clause');
    assert.ok(recital.compareDocumentPosition(firstClause) & 4, 'recital precedes the clauses');
    assert.ok(paper.contains(recital));
  });

  test('a document with no front matter keeps the label head', async () => {
    const p = await page({ contract: contractFixture({
      redlineText: '<h2>1. One</h2><p>alpha</p><h2>2. Two</h2><p>beta</p>' }) });
    assert.match(p.$('#rl-doc .rl-paper-title').textContent, /RAW MATERIAL SUPPLY AGREEMENT — JUNO LIMITED/);
    assert.ok(p.$('#rl-doc .rl-paper-sub'), 'the template/jurisdiction line stands in');
    assert.equal(p.$('#rl-doc .rl-recital'), null, 'no recital is invented');
  });
});

describe('F94 (3) — an untouched baseline follows the document', () => {
  test('key terms filled after the first paint reach the workbench', async () => {
    const p = await page();
    assert.match(p.$('#rl-doc').textContent, /KES —/, 'the blank, as first painted');
    /* The Doc page fills the value — the working body moves. */
    p.c.redlineText = RICH.replace('KES —', 'KES 14,500,000');
    p.win.renderRedline();
    assert.match(p.$('#rl-doc').textContent, /KES 14,500,000/,
      'the same contract must not read differently on the two pages');
    assert.match(p.win.negoBaseText(p.c), /14,500,000/, 'the baseline itself moved');
  });

  test('one filed change freezes the baseline again', async () => {
    const p = await page();
    await p.win.negoFileProposal(p.c, p.win.negoBaseText(p.c).replace('5000', '6000'),
      { side: 'owner', author: 'Young Mbagaya' });
    const before = p.win.negoBaseText(p.c);
    p.c.redlineText = RICH.replace('KES —', 'KES 999');
    assert.equal(p.win.negoFreshenBaseline(p.c), false,
      'a measured-against baseline may not move — the ask was diffed on it');
    assert.equal(p.win.negoBaseText(p.c), before);
  });

  test('an archived round freezes it too', async () => {
    const p = await page();
    p.c.negotiation.round = 2;                 // history exists
    p.c.redlineText = RICH.replace('KES —', 'KES 999');
    assert.equal(p.win.negoFreshenBaseline(p.c), false);
  });

  test('and an unchanged document is left exactly alone', async () => {
    const p = await page();
    assert.equal(p.win.negoFreshenBaseline(p.c), false, 'nothing to do is not a change');
  });
});
