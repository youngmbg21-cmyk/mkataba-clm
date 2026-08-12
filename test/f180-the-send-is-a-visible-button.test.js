/* ============================================================
   F180 — the send is a button a reader can SEE
   ============================================================
   Reported as "the owner's screen doesn't update when the counterparty
   accepts" — and the sync was innocent. The acceptance had never left the
   counterparty's browser, because the page offered them nowhere to send it:
   every deal-level verb they have — Send decisions, Ready to sign, Decline —
   lives in #pt-nego-foot, and on the full-window workbench page that bar was
   rendered [hidden] and nothing ever unhid it.

   How it got that way is the lesson. When the workbench page was built
   (31 Jul), hiding the page's own foot was CORRECT: the embedded workbench
   still drew its own pulsing send beside the change cards, and one send door
   beats two. Then the new design (10 Aug) deliberately clipped that column
   send into .rl-sendslot-hidden and gave the OWNER a visible proxy on their
   toolbar — a toolbar the counterparty's page does not render. Two right
   decisions, a week apart, adding up to a page with no way to answer.

   And 98 tests stayed green while it shipped, because jsdom presses hidden
   buttons happily: f37 clicks #pt-nego-send by id and the handler works. "A
   hidden verb is only a decision about pixels" — so this file asserts the
   PIXEL decision: the walk up the tree from each verb must cross none of the
   mechanisms this app hides things with. Then it closes the loop the bug
   report was actually about: the visible send is pressed, the posted body is
   applied by the real applyResponse, and the OWNER's queue — the exact
   surface the report screenshotted — reads the acceptance. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { buildWorld } = require('./world');
const { buildPortal, sharePayloadFor } = require('./portalworld');

const BASE = [
  'WAREHOUSING AND LOGISTICS SERVICES AGREEMENT',
  '1. SCOPE',
  '1. The Provider shall receive, store, handle and dispatch the goods.',
  '2. PAYMENT TERMS',
  '2. All invoices are payable within thirty (30) days from the date of issue.',
  '3. TERMINATION',
  '3. Either party may terminate by giving not less than sixty (60) days written notice.',
].join('\n');

function ownerContract(over = {}){
  return { id: 'MK-180', name: 'Warehousing and Logistics Services Agreement',
    counterparty: 'Nordfrakt Logistik AB', template: 'WH', status: 'Under Review',
    folder: 'dist', fields: {}, metadata: {}, audit: [], rounds: [], versions: [],
    signatures: [], comments: [], redlineText: BASE, format: 'text', ...over };
}

/* The record side needs the real applyResponse, which lives in js/core.js —
   loaded on the portal stage, not the light one. Same substitution f37 makes:
   what is under test is what applyResponse DECIDES, not where it saves. */
function recordStage(){
  const p = buildPortal();
  p.win.promptDialog = async () => '';
  p.win.persist = () => {};
  p.win.saveContract = () => {};
  p.win.renderWorkspace = () => {};
  p.win.setView = () => {};
  return p.win;
}

/* Wanjiru has asked for ninety days' notice; Erik has not answered yet. */
async function ownerProposed(){
  const win = recordStage();
  const c = ownerContract();
  win.negoInit(c);
  const filed = await win.negoFileProposal(c,
    BASE.replace('sixty (60) days', 'ninety (90) days'),
    { side: 'owner', author: 'Wanjiru Kamau' });
  return { win, c, filed };
}

/* Erik's page, rendered from a payload the product's own allow-list built. */
function counterpartyView(c){
  const p = buildPortal();
  const payload = sharePayloadFor(p, { ...c });
  p.open(payload);
  return { p, payload,
    $: sel => p.win.document.querySelector(sel),
  };
}

/* jsdom computes no layout, so visibility is asserted the way the page loses
   it: the walk from the control to the root must cross NONE of the mechanisms
   this app has ever hidden anything with — the [hidden] attribute (this
   bug's), the .hidden utility class (the agreed screen's), the
   .rl-sendslot-hidden clip (the design's), or an inline display:none. A verb
   inside any of them is markup a test can press and a person cannot. */
function assertVisible(el, what){
  assert.ok(el, `${what} must be on the page at all`);
  for (let n = el; n && n.nodeType === 1; n = n.parentElement){
    const where = `<${n.tagName.toLowerCase()}${n.id ? ` id="${n.id}"` : ''}>`;
    assert.ok(!n.hasAttribute('hidden'),
      `${what} is unreachable pixels: ${where} carries [hidden]`);
    assert.ok(!n.classList.contains('hidden'),
      `${what} is unreachable pixels: ${where} carries .hidden`);
    assert.ok(!n.classList.contains('rl-sendslot-hidden'),
      `${what} is unreachable pixels: ${where} is the clipped sendslot`);
    assert.ok(!/display\s*:\s*none/i.test(n.getAttribute('style') || ''),
      `${what} is unreachable pixels: ${where} sets display:none`);
  }
}

describe('F180 — the counterparty\'s deal verbs are visible before any decision', () => {
  test('the workbench page draws its verb bar, and the bar is not hidden', async () => {
    const o = await ownerProposed();
    const v = counterpartyView(o.c);
    /* The claim is about the MODERN page. If routing ever stops landing a
       negotiation link on the workbench, this test must fail loudly rather
       than green-lighting the retired card layout. */
    assert.ok(v.$('#pw-page'), 'a negotiation link lands on the full-window workbench');
    const foot = v.$('#pt-nego-foot');
    assertVisible(foot, 'the deal-verb bar');
    /* Nothing decided yet, so no send — but the verbs are already there. A
       page whose only verbs appear after a decision is a page that never
       explains itself. */
    assertVisible(v.$('#pt-nego-ready'), 'Ready to sign');
    assertVisible(v.$('#pt-nego-decline'), 'Decline');
    /* WHERE THE SENTENCE WENT (12 Aug 2026). The bar moved out of a full-width
       strip and into the header row, which has room for verbs and none for
       paragraphs — so it no longer prints "held here until you send them"
       itself. The sentence is not lost: the wall line the workbench draws for
       this same reader says it, and that wall is the one band this page is
       allowed to keep precisely so it is read BEFORE any decision. */
    assert.match(v.$('#rl-banner').textContent, /stay on this page until you press Send/i,
      'the reader is still told where decisions wait, before they make one');
  });

  test('deciding draws the send, visible, with its count', async () => {
    const o = await ownerProposed();
    const v = counterpartyView(o.c);
    v.$(`[data-nego-accept="${o.filed[0].id}"]`).click();
    const send = v.$('#pt-nego-send');
    assertVisible(send, 'the Send button');
    assert.match(send.textContent, /Send 1 decision/,
      'the button says what the press will do');
    /* The count that used to sit beside the buttons now rides on the button's
       own label above, and the "nothing has travelled yet" half is on the wall
       line — which counts the held answers itself. */
    assert.match(v.$('#rl-banner').textContent, /nothing has reached/i,
      'and the reader is told the answer has not travelled yet');
    assert.match(v.$('#rl-banner').textContent, /1 answer/i,
      'counted, so the sentence is about what they actually did');
  });

  /* THE ROLL CALL. The bug this file is named for was one verb losing its
     pixels in a layout change; the 12 Aug header move was another layout
     change over the same buttons. So the claim is made once, by name, over
     every deal-level verb the page has — a future move that drops one fails
     here rather than in a screenshot. */
  test('every deal verb the page has is visible pixels, by name', async () => {
    const o = await ownerProposed();
    const v = counterpartyView(o.c);
    v.$(`[data-nego-accept="${o.filed[0].id}"]`).click();
    const VERBS = [
      ['#pt-nego-send', 'Send decisions — the page\'s one postbox'],
      ['#pt-nego-ready', 'Ready to sign'],
      ['#pt-nego-decline', 'Decline'],
      ['#pt-derive', 'Share a read-only copy'],
    ];
    for (const [sel, what] of VERBS) assertVisible(v.$(sel), what);
    /* And exactly one of each — the header once carried a MIRROR of Ready to
       sign, which is how deleting the strip could have left a page with a
       button that hides itself and no real one. Two doors onto one act is a
       thing this app does deliberately elsewhere; here it is not wanted. */
    for (const [sel] of VERBS)
      assert.equal(v.p.win.document.querySelectorAll(sel).length, 1,
        `${sel} exists exactly once — no mirror to keep in step`);
  });

  test('and the send is ON THE CARD the decision was made on', async () => {
    /* Asked for directly (11 Aug 2026): you pressed Accept on the card, so
       the act that makes it real belongs there too — not only in a bar at
       the other end of the page. The card's Send is a proxy onto the page's
       one postbox, so both doors post the same batch. */
    const o = await ownerProposed();
    const v = counterpartyView(o.c);
    const id = o.filed[0].id;
    v.$(`[data-nego-accept="${id}"]`).click();
    const card = v.$(`[data-nego-card="${id}"]`);
    assert.ok(card, 'the decided-but-held card stays on the table');
    const cardSend = card.querySelector(`[data-rl-send="${id}"]`);
    assertVisible(cardSend, 'the card\'s own Send');
    assert.ok(card.querySelector(`[data-nego-undo="${id}"]`),
      'Undo stands beside it — held means still yours to take back');
  });
});

describe('F180 — the visible send closes the loop the bug report was about', () => {
  test('press it, apply what it posted, and the owner\'s queue reads accepted', async () => {
    const o = await ownerProposed();
    const id = o.filed[0].id;

    /* The owner's screen BEFORE: the workbench queue counts the round the way
       the report's screenshot did — nothing decided, the clause marked "now". */
    const w = buildWorld({ negotiationView: true, contractView: true });
    const owner = () => {
      w.win.state = Object.assign({}, w.win.state,
        { contracts: [o.c], activeId: o.c.id, view: 'redline' });
      w.win.getContract = cid => (cid === o.c.id ? o.c : null);
      w.win.renderRedline();
      return w.win.document.getElementById('view-redline');
    };
    let page = owner();
    assert.match(page.querySelector('.rl-q-foot').textContent, /0 of 1/,
      'nothing has been decided this round');
    assert.match(page.querySelector('.rl-q-row').textContent, /now/,
      'the clause is still waiting on them');

    /* Erik answers — through the CARD's own door, exactly as a person would:
       accept on the card, name in the box, press the Send sitting right
       there. The card's Send proxies the page's one postbox, so this also
       proves the proxy chain end to end. */
    const v = counterpartyView(o.c);
    v.$(`[data-nego-accept="${id}"]`).click();
    assertVisible(v.$('#pt-nego-send'), 'the Send button');
    v.p.setResponderName('Erik Lindqvist');
    const cardSend = v.$(`[data-nego-card="${id}"] [data-rl-send="${id}"]`);
    assertVisible(cardSend, 'the card\'s own Send');
    cardSend.dispatchEvent(new v.p.win.Event('click', { bubbles: true }));
    for (let i = 0; i < 8; i++) await Promise.resolve();
    await new Promise(r => setImmediate(r));
    const sent = v.p.lastSent();
    assert.equal(sent.action, 'decisions', 'the press posted a decisions response');
    assert.equal(sent.negoDecisions[0].id, id);
    assert.equal(sent.negoDecisions[0].status, 'accepted');

    /* What the poller does with it, run by the real applyResponse. */
    assert.equal(await o.win.applyResponse(o.c, sent, { background: true }), true);
    assert.equal(o.win.negoChangeById(o.c, id).status, 'accepted', 'the record moved');

    /* The owner's screen AFTER — the surface the report screenshotted. */
    page = owner();
    assert.match(page.querySelector('.rl-q-foot').textContent, /1 of 1/,
      'the queue counts the acceptance');
    const row = page.querySelector('.rl-q-row');
    assert.ok(row.className.includes('is-done'), 'the row is ticked');
    assert.match(row.textContent, /accepted/, 'and says accepted');
  });
});
