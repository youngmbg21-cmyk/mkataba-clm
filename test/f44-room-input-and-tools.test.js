/* f44 — you can type in the room, and you can see the controls
   ============================================================
   Two reports from the product, both about the room being unusable rather than
   incorrect — which is the kind of thing a suite full of markup assertions
   sails straight past.

   1. THE DISCUSSION BOX SWALLOWED THE SPACE BAR. You could type words; you
      could not put spaces between them. The change card is itself
      keyboard-focusable — it acts as a button, so Enter or Space selects it —
      and its key handler called preventDefault() on Space. The reply input
      sits INSIDE that card, so every space typed into the input bubbled up to
      the card and was cancelled before the browser could insert it.

      The fix is the rule that handler should always have had: a container that
      behaves like a button responds to keys only when IT is what is focused,
      never when the focus is in a field inside it.

   2. THE CLAUSE TOOLS WERE HIDING. Edit / Add clause / Delete were revealed on
      hover, anchored in the margin, and clipped by the pane edge — so they
      were half off-screen and pale enough to miss. They are the only way to
      propose anything now that the whole-document editor is gone, so they are
      always visible and legible. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { buildWorld } = require('./world');
const F = require('./clausefixtures.js');

function contract(over = {}){
  return { id: 'MK-191', name: 'Warehousing and Logistics Services Agreement',
    counterparty: 'Nordfrakt Logistik AB', template: 'WH', status: 'Under Review',
    folder: 'dist', fields: {}, metadata: {}, audit: [], rounds: [], versions: [],
    signatures: [], comments: [], redlineText: F.protoRich(), format: 'rich', ...over };
}
async function mounted(){
  const w = buildWorld({ negotiationView: true });
  const win = w.win;
  const c = contract();
  win.negoInit(c);
  const filed = [];
  for (const n of ['4', '6']){
    const cl = win.negoClauseList(c).find(x => x.num === n);
    filed.push(await win.negoEditClause(c, cl.clauseId, `<p>${F.PROTO_ASKS[n].text}</p>`,
      { side: 'counterparty', author: 'Erik Lindqvist', summary: F.PROTO_ASKS[n].summary }));
  }
  win.openNegotiationRoom(c, { side: 'owner', by: 'Wanjiru Kamau', persist: false });
  const doc = win.document;
  return { win, c, filed, doc,
    $: sel => doc.querySelector(sel), $$: sel => Array.from(doc.querySelectorAll(sel)) };
}
/* A key press as the browser delivers it: dispatched at the element that has
   focus, and allowed to bubble. Dispatching straight at the card would test a
   situation that never happens. */
function press(win, el, key){
  const ev = new win.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
  el.dispatchEvent(ev);
  return ev;
}

describe('the discussion box accepts a space', () => {
  test('a space typed into the reply field is NOT cancelled', async () => {
    const m = await mounted();
    m.$(`[data-nego-discuss="${m.filed[0].id}"]`).click();
    const input = m.$(`#nego-ti-${m.filed[0].id}`);
    assert.ok(input, 'the reply field must be open');

    const ev = press(m.win, input, ' ');
    assert.equal(ev.defaultPrevented, false,
      'the space bar must reach the input — the card was cancelling it, so no reply could contain two words');
  });

  test('Enter in the reply field posts the comment rather than selecting the card', async () => {
    const m = await mounted();
    const id = m.filed[0].id;
    m.$(`[data-nego-discuss="${id}"]`).click();
    const input = m.$(`#nego-ti-${id}`);
    input.value = 'Net-45 works if you invoice on the 1st.';
    press(m.win, input, 'Enter');
    const thread = m.win.negoChangeById(m.c, id).thread;
    assert.equal(thread.length, 1, 'Enter posts');
    assert.equal(thread[0].text, 'Net-45 works if you invoice on the 1st.',
      'and the text arrives whole, spaces and all');
  });

  test('a multi-word reply survives the round trip', async () => {
    const m = await mounted();
    const id = m.filed[1].id;
    m.$(`[data-nego-discuss="${id}"]`).click();
    const input = m.$(`#nego-ti-${id}`);
    const words = 'EUR 250,000 is too low for a full container load';
    input.value = words;
    press(m.win, input, 'Enter');
    assert.equal(m.win.negoChangeById(m.c, id).thread[0].text, words);
  });

  /* The card must KEEP its keyboard behaviour — the fix is a narrowing, not a
     removal. Tabbing to a card and pressing Space still selects it. */
  test('the card itself still answers to Enter and Space', async () => {
    const m = await mounted();
    const card = m.$(`[data-nego-card="${m.filed[1].id}"]`);
    assert.equal(card.getAttribute('role'), 'button');
    const ev = press(m.win, card, ' ');
    assert.equal(ev.defaultPrevented, true, 'Space on the card is still the card’s to handle');
  });

  test('no focusable field in the room has its keys eaten by a parent', async () => {
    const m = await mounted();
    m.$(`[data-nego-discuss="${m.filed[0].id}"]`).click();
    /* Every text field on the screen, tested the way it is really used. A
       container that swallows a space from ANY of them is the same bug in a
       different place. */
    const fields = m.$$('#nego-room input[type="text"], #nego-room textarea, #nego-room input:not([type])');
    assert.ok(fields.length, 'there must be fields to check');
    for (const f of fields){
      const ev = press(m.win, f, ' ');
      assert.equal(ev.defaultPrevented, false,
        `a space typed into ${f.id || f.className || f.tagName} was cancelled by an ancestor`);
    }
  });
});

describe('the clause tools are visible without hunting for them', () => {
  /* TWO, not three. "Add clause" is gone: proposing a clause the contract does
     not have yet is a real act, but it was done through two blank prompt boxes
     — a heading, then a body, typed into a modal with no sight of the document
     around it. That is not how anybody drafts a clause, and a control nobody
     can use well is worse than its absence. Wording still enters through the
     template, through an edit, or as a redline from the other side. */
  test('every clause carries both tools, always rendered', async () => {
    const m = await mounted();
    const clauses = m.$$('#nego-room .nego-pane.working .nego-clause');
    assert.equal(clauses.length, 6);
    for (const cl of clauses){
      const tools = cl.querySelector('.nego-tools');
      assert.ok(tools, 'every clause in the working pane must carry its tools');
      const labels = Array.from(tools.querySelectorAll('button')).map(b => b.textContent.trim());
      /* "Change", not "Edit". A counterparty cannot edit somebody else's
         contract and knows it, so a button marked Edit reads as one they are
         not allowed to press — and the act is not an edit anyway: it files a
         tracked change for the other side to accept or reject. Someone sent a
         contract to negotiate was meeting two verbs in this room, Decline and
         Ready to sign, and nothing named the one act the room exists for. */
      assert.deepEqual(Array.from(labels), ['Change', 'Delete']);
    }
  });

  test('and nothing is left wired to the clause-adding modal', async () => {
    const m = await mounted();
    assert.equal(m.$('[data-nego-add-after]'), null, 'the trigger is gone');
    assert.ok(!/Add a clause/.test(m.win.document.body.innerHTML), 'and so is the dialog');
  });

  test('they are not hover-only — no rule hides them until hover', async () => {
    const m = await mounted();
    const css = m.doc.getElementById('nego-style').textContent;
    assert.ok(!/\.nego-tools\{[^}]*opacity:0/.test(css),
      'the tools must not start invisible — they are the only way to propose anything');
    assert.ok(!/\.nego-clause:hover \.nego-tools/.test(css),
      'and must not depend on hover, which does not exist on a touch screen');
  });

  test('they are drawn in the room’s own slate, not a pale outline', async () => {
    const m = await mounted();
    const css = m.doc.getElementById('nego-style').textContent;
    const rule = (css.match(/\.nego-tool\{[^}]*\}/) || [''])[0];
    assert.match(rule, /--n-slate/, 'the tools must use the room’s slate token, not a washed-out grey');
    assert.ok(!/color:var\(--n-slate-soft\)/.test(rule),
      'the soft tone is what made them easy to miss');
  });

  test('the baseline pane carries no tools — it is a read-only reference', async () => {
    const m = await mounted();
    assert.equal(m.$$('#nego-room .nego-pane.baseline .nego-tools').length, 0,
      'you cannot edit the wording this round is being measured against');
  });

  test('a read-only viewer gets no tools at all', async () => {
    const w = buildWorld({ negotiationView: true });
    const win = w.win;
    const c = contract();
    win.negoInit(c);
    win.openNegotiationRoom(c, { side: 'owner', by: 'W', persist: false, readonly: true });
    assert.equal(win.document.querySelectorAll('.nego-tools').length, 0);
  });
});
