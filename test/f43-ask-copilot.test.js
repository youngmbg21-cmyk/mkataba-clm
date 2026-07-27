/* f43 — Ask Copilot in the room is HaTi's Copilot, not a lookalike
   ============================================================
   The first version of this built a bespoke chat dock inside the room. It was
   the wrong call: a second Copilot is a second thing to keep in step, and it
   did not look or behave like the one on every other screen.

   The room now opens the APPLICATION'S OWN panel. It is identical because it
   IS the same element, wired by the same code in js/ai.js — nothing is matched
   or reproduced.

   The reason it could not simply be opened before is stacking, not styling: the
   room is a full-window mode at z-index 60 and the panel lives in the app shell
   underneath it, so opening it slid a panel in behind the page being read. The
   room now lifts it over itself while it is open.

   What the room DOES add is context: which contract, which round, which
   changes are on the table — so an answer is about the negotiation on screen
   rather than about contracts in general. That is what the panel already
   promises everywhere else ("I know what's on your screen"); the room just has
   to say where it is. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { buildWorld } = require('./world');
const F = require('./clausefixtures.js');

const own = xs => Array.from(xs);

function contract(over = {}){
  return { id: 'MK-191', name: 'Warehousing and Logistics Services Agreement',
    counterparty: 'Nordfrakt Logistik AB', template: 'WH', status: 'Under Review',
    folder: 'dist', fields: {}, metadata: {}, audit: [], rounds: [], versions: [],
    signatures: [], comments: [], redlineText: F.protoRich(), format: 'rich', ...over };
}
async function negotiated(win){
  const c = contract();
  win.negoInit(c);
  for (const n of ['5', '6']){
    const cl = win.negoClauseList(c).find(x => x.num === n);
    await win.negoEditClause(c, cl.clauseId, `<p>${F.PROTO_ASKS[n].text}</p>`,
      { side: 'counterparty', author: 'Erik Lindqvist', summary: F.PROTO_ASKS[n].summary });
  }
  return c;
}
async function mounted(side = 'owner'){
  const w = buildWorld({ negotiationView: true });
  const win = w.win;
  const c = await negotiated(win);
  const opened = [];
  win.openAI = prefill => opened.push(prefill === undefined ? null : prefill);
  win.openNegotiationRoom(c, { side, by: 'Wanjiru Kamau', persist: false });
  const doc = win.document;
  return { win, c, opened, doc,
    $: sel => doc.querySelector(sel), $$: sel => Array.from(doc.querySelectorAll(sel)) };
}

describe('the button opens the application’s own Copilot', () => {
  test('it is in the OWNER\'s top bar, and not the counterparty\'s', async () => {
    const owner = await mounted('owner');
    assert.ok(owner.$('#nego-copilot'), 'the owner gets it');
    assert.match(owner.$('#nego-copilot').textContent, /Ask Copilot/);

    /* Copilot reads our whole portfolio and our playbook. It is our tool, and
       the counterparty's link is not the place to hand it over. */
    const theirs = await mounted('counterparty');
    assert.equal(theirs.$('#nego-copilot'), null,
      'Copilot must not appear on the counterparty’s side of the room');
  });

  test('clicking it calls openAI — the real panel, not a room-local clone', async () => {
    const m = await mounted();
    m.$('#nego-copilot').click();
    assert.equal(m.opened.length, 1, 'the app’s own Copilot must be what opens');
  });

  test('there is no second chat surface built into the room', async () => {
    const m = await mounted();
    assert.equal(m.$('#nego-copilot-dock'), null, 'the bespoke dock is retired');
    assert.equal(m.$('#nego-cop-feed'), null);
    assert.equal(m.$('#nego-cop-form'), null);
    const css = m.doc.getElementById('nego-style').textContent;
    assert.ok(!/\.nego-cop-/.test(css),
      'and none of its styling survives to drift from the real panel’s');
  });

  test('the room lifts the real panel above itself while it is open', async () => {
    const m = await mounted();
    assert.ok(m.doc.body.classList.contains('nego-room-open'),
      'the room must mark the page, so the rule below can apply');
    const css = m.doc.getElementById('nego-style').textContent;
    const room = Number((css.match(/\.nego-room\{[^}]*z-index:(\d+)/) || [])[1]);
    const panel = Number((css.match(/body\.nego-room-open #ai-panel\{z-index:(\d+)/) || [])[1]);
    const scrim = Number((css.match(/body\.nego-room-open #ai-scrim\{z-index:(\d+)/) || [])[1]);
    assert.ok(room > 0 && panel > room,
      `the panel (${panel}) must sit above the room (${room}) or it opens behind the page`);
    assert.ok(scrim > room && scrim < panel, `the scrim (${scrim}) belongs between them`);
  });

  test('leaving the room puts the page back as it was', async () => {
    const m = await mounted();
    assert.ok(m.doc.body.classList.contains('nego-room-open'));
    m.win.closeNegotiationRoom();
    assert.ok(!m.doc.body.classList.contains('nego-room-open'),
      'the lift is scoped to the room being open — the panel returns to its normal stacking');
  });

  test('with no Copilot at all the button says so instead of doing nothing', async () => {
    const w = buildWorld({ negotiationView: true });
    const win = w.win;
    const c = await negotiated(win);
    win.openAI = undefined;
    win.openNegotiationRoom(c, { side: 'owner', by: 'W', persist: false });
    win.document.getElementById('nego-copilot').click();
    assert.ok(w.log.toasts.some(t => /Copilot is not available/.test(t.msg)),
      'a button that silently does nothing teaches people the feature is broken');
  });
});

describe('Copilot is told which negotiation is on the screen', () => {
  test('the room reports its contract while open, and nothing after', async () => {
    const m = await mounted();
    assert.equal(m.win.negoRoomContract(), m.c, 'while open, the room says what it is showing');
    m.win.closeNegotiationRoom();
    assert.equal(m.win.negoRoomContract(), null, 'and stops claiming a screen that is gone');
  });

  test('the context carries the clauses, the changes and whose turn it is', async () => {
    const { win } = buildWorld();
    const c = await negotiated(win);
    const ctx = win.negoCopilotContext(c);

    assert.equal(ctx.surface, 'negotiation-room');
    assert.equal(ctx.contractId, 'MK-191');
    assert.equal(ctx.counterparty, 'Nordfrakt Logistik AB');
    assert.equal(ctx.round, 1);
    assert.equal(ctx.turn, 'owner');
    assert.equal(ctx.clauses.length, 6);
    assert.deepEqual(own(ctx.clauses.map(x => x.label)).slice(0, 2),
      ['Clause 1 · Scope of Services', 'Clause 4 · Payment Terms']);
    assert.equal(ctx.changes.length, 2);
    assert.equal(ctx.changes[0].status, 'pending');
    assert.equal(ctx.changes[0].author, 'Erik Lindqvist');
    assert.ok(ctx.changes[1].proposedWording.includes('EUR 250,000'),
      'both the current and the proposed wording travel, or an answer about a change is guesswork');
    assert.ok(ctx.changes[1].currentWording.includes('full replacement value'));
  });

  test('a very long contract is capped rather than sent whole', () => {
    const { win } = buildWorld();
    const long = '<h1>T</h1><h2>Clause 1 · Schedule</h2><p>' + 'word '.repeat(40000) + '</p>';
    const c = contract({ redlineText: long });
    win.negoInit(c);
    const ctx = win.negoCopilotContext(c);
    assert.ok(ctx.workingText.length <= win.NEGO_CTX_CHARS + 32,
      `the context must be bounded, got ${ctx.workingText.length}`);
    assert.match(ctx.workingText, /\[truncated\]$/, 'and must say it was cut, not pretend to be whole');
  });

  /* THE rule, and it survives the panel being swapped for the real one:
     Copilot reads this contract and never edits it. Asked in the least
     convenient way — the room is opened, Copilot is summoned, and the document
     must not have moved. */
  test('summoning Copilot changes no wording and files no fingerprint', async () => {
    const m = await mounted();
    const textBefore = m.win.docPlainText(m.c);
    const changesBefore = m.win.negoChanges(m.c).length;
    const versionsBefore = (m.c.versions || []).length;

    m.$('#nego-copilot').click();
    m.win.negoCopilotContext(m.c);          // and reading the context is a READ

    assert.equal(m.win.docPlainText(m.c), textBefore, 'the wording is untouched');
    assert.equal(m.win.negoChanges(m.c).length, changesBefore, 'no fingerprint was filed');
    assert.equal((m.c.versions || []).length, versionsBefore, 'no version was captured');
  });
});
