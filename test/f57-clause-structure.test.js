/* ============================================================
   F57 — a contract in the negotiation room reads like a contract
   ============================================================
   clauseSegment gives every clause two forms of itself, and they are not
   interchangeable:

     bodyHtml — the document. Paragraphs, numbered lists, emphasis, tables.
     text     — richToText's projection: one line per block, separated by real
                newline characters. This is the substance the diff runs on and
                the fingerprints bind, and that is exactly what it is for.

   Both panes rendered `<p>${text}</p>`, and no rule set white-space on those
   paragraphs. HTML collapses a newline to a space, so every line break in the
   projection vanished: the preamble and the recitals — the part of a contract
   most densely made of short lines — arrived as one unbroken run-on blob, and
   a numbered list of parties read as a sentence.

   Two fixes, and the order matters. The projection's line breaks are made
   visible (pre-wrap), which is what a clause UNDER REDLINE needs — its marked-up
   words have to stay the words the ops were computed over. And a clause with
   NOTHING proposed against it is drawn from its own markup instead, because
   there is no redline to line up against and no reason to show somebody a
   flattened copy of a document they are being asked to agree to.

   Nothing here touches richToText, the diff, the hashes or the change model.
   Text remains the compared substance; this is what the reader sees. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { buildWorld } = require('./world');

/* A clause body with the two structures that were being destroyed: an ordered
   list of the parties, and paragraphs either side of it. This is the shape of
   every contract's opening page. */
const PARTIES_CLAUSE =
  '<p>The parties to this Agreement are as follows.</p>'
  + '<ol><li>HIGHLAND CORPORATE LIMITED, a company incorporated under the Companies Act, 2015.</li>'
  + '<li>SAVANNAH CONSUMER GOODS LIMITED, a limited liability company having its registered office at Nairobi.</li></ol>'
  + '<p>WHEREAS the Provider is engaged in the business of third-party warehousing.</p>';
const RICH = '<h1>Warehousing and Logistics Services Agreement</h1>'
  + '<p>THIS AGREEMENT is made on the 28th day of July 2026 between:</p>'
  + '<h2>Clause 1 · Parties and Recitals</h2>' + PARTIES_CLAUSE
  + '<h2>Clause 4 · Payment Terms</h2>'
  + '<p>All invoices are payable within <strong>thirty (30) days</strong> from the date of issue.</p>';

function room(opts = {}) {
  const win = buildWorld({ negotiationView: true }).win;
  const c = { id: 'MK-570', name: 'Warehousing and Logistics Services Agreement',
    counterparty: 'Savannah Consumer Goods Limited', status: 'Under Review', folder: 'dist',
    fields: {}, metadata: {}, audit: [], rounds: [], versions: [], signatures: [], comments: [],
    redlineText: RICH, format: 'rich' };
  win.negoInit(c);
  const clauses = win.negoClauseList(c);
  const open = () => {
    win.negoResetView();
    win.openNegotiationRoom(c, { side: 'owner', by: 'Young Mbagaya', persist: false, ...opts });
    return win.document;
  };
  const pane = (doc, which) => doc.querySelector(which === 'left' ? '#nego-scroll-base' : '#nego-scroll-work');
  const clause = (doc, cl, which) => pane(doc, which || 'right').querySelector(`[data-clause="${cl.clauseId}"]`);
  return { win, c, clauses, parties: clauses[0], payment: clauses[1], open, clause };
}

describe('F57 — the projection keeps its line breaks', () => {
  test('the clause really does carry newlines the browser would collapse', () => {
    const { parties } = room();
    assert.match(parties.text, /\n/, 'the fixture has to reproduce the fault to test the fix');
    assert.equal(parties.text.split('\n').length, 4,
      'a lead-in, two numbered parties and a recital — four lines, not one sentence');
  });

  /* THE ONE-LINE FIX, asserted on the stylesheet the room actually emits.
     Without it every one of those newlines renders as a space. */
  test('clause paragraphs are pre-wrap, so those breaks are visible', () => {
    const { win } = room();
    assert.match(win.negoStyleHtml(), /\.nego-clause p\{[^}]*white-space:pre-wrap/,
      'the projection is line-structured text and has to be drawn as line-structured text');
  });

  test('a clause under redline keeps the projection, with its breaks intact', async () => {
    const r = room();
    const ch = await r.win.negoEditClause(r.c, r.parties.clauseId,
      PARTIES_CLAUSE.replace('under the Companies Act, 2015', 'under the Companies Act, 2015 of the Laws of Kenya'),
      { side: 'counterparty', author: 'Amara Njoroge', summary: 'Laws of Kenya' });
    assert.equal(ch.status, 'pending');
    const block = r.clause(r.open(), r.parties);

    assert.ok(block.querySelector('.nego-ins'), 'the redline is still drawn from the stored ops');
    assert.ok(!block.querySelector('.nego-body'),
      'a clause under redline is NOT swapped to rich markup — the marked-up words have to '
      + 'stay the words the ops were computed over');
    const p = block.querySelector('p');
    assert.match(p.textContent, /\n/, 'and its line breaks survive to the page');
    assert.ok(!/\n\s*\n/.test(p.textContent),
      'richToText emits no blank lines, so pre-wrap must not double-space anything');
  });

  test('a proposed deletion strikes the clause through and keeps its shape', async () => {
    const r = room();
    await r.win.negoDeleteClause(r.c, r.parties.clauseId,
      { side: 'counterparty', author: 'Amara Njoroge' });
    const block = r.clause(r.open(), r.parties);
    const del = block.querySelector('.nego-del');
    assert.ok(del, 'every word stays on the page until the deletion is decided');
    assert.match(del.textContent, /\n/, 'including the breaks between them');
  });
});

describe('F57 — a clause nobody has touched reads as the document', () => {
  test('an unchanged clause renders its own list and paragraphs', () => {
    const r = room();
    const block = r.clause(r.open(), r.parties);
    const body = block.querySelector('.nego-body');
    assert.ok(body, 'there is no redline to line up against, so there is nothing to flatten for');
    assert.equal(body.querySelectorAll('ol').length, 1, 'the parties are a list');
    assert.equal(body.querySelectorAll('li').length, 2, 'and there are two of them');
    assert.equal(body.querySelectorAll('p').length, 2, 'with a paragraph either side');
    assert.match(block.innerHTML, /Companies Act, 2015/);
  });

  test('emphasis the drafter put there on purpose survives', () => {
    const r = room();
    const block = r.clause(r.open(), r.payment);
    assert.ok(block.querySelector('.nego-body strong'),
      'the projection drops every mark of emphasis; the document does not');
  });

  test('the baseline pane is all document — nothing is ever proposed against it', async () => {
    const r = room();
    await r.win.negoEditClause(r.c, r.parties.clauseId, PARTIES_CLAUSE.replace('Nairobi', 'Mombasa'),
      { side: 'counterparty', author: 'Amara Njoroge', summary: 'Mombasa' });
    const block = r.clause(r.open(), r.parties, 'left');
    assert.ok(block.querySelector('.nego-body'), 'the reference copy is the document');
    assert.equal(block.querySelectorAll('li').length, 2);
    assert.ok(!block.querySelector('.nego-ins') && !block.querySelector('.nego-del'),
      'and carries no marks — it is what the round is measured against');
  });

  test('a refused ask gives the clause its structure back', async () => {
    const r = room();
    const ch = await r.win.negoEditClause(r.c, r.parties.clauseId,
      PARTIES_CLAUSE.replace('Nairobi', 'Mombasa'),
      { side: 'counterparty', author: 'Amara Njoroge', summary: 'Mombasa' });
    r.win.negoResolve(r.c, ch.id, 'rejected', { by: 'Young Mbagaya' });
    const block = r.clause(r.open(), r.parties);
    assert.ok(block.querySelector('.nego-body'),
      'the baseline stands, so the clause is not under redline any more');
    assert.equal(block.querySelectorAll('li').length, 2,
      'a refusal must not quietly cost the clause its structure for the rest of the negotiation');
    assert.match(block.textContent, /Rejected — baseline kept/, 'and it still says so');
  });

  test('an accepted change keeps the redline rendering it was decided on', async () => {
    const r = room();
    const ch = await r.win.negoEditClause(r.c, r.parties.clauseId,
      PARTIES_CLAUSE.replace('Nairobi', 'Mombasa'),
      { side: 'counterparty', author: 'Amara Njoroge', summary: 'Mombasa' });
    r.win.negoResolve(r.c, ch.id, 'accepted', { by: 'Young Mbagaya' });
    const block = r.clause(r.open(), r.parties);
    assert.ok(!block.querySelector('.nego-body'),
      'the adopted wording is shown as what was adopted, from the same stored ops');
    assert.match(block.textContent, /Mombasa/);
  });

  test('the clean read is a document too', async () => {
    const r = room();
    const doc = r.open();
    doc.querySelector('#nego-clean-toggle').dispatchEvent(new r.win.Event('click', { bubbles: true }));
    assert.ok(r.win.negoCleanView());
    const block = r.clause(r.win.document, r.parties);
    assert.ok(block.querySelector('.nego-body'),
      'a screen whose whole purpose is "read it as a contract" is the last place to flatten one');
    assert.equal(block.querySelectorAll('li').length, 2);
  });
});

describe('F57 — everything the wrapper carries still works', () => {
  test('the clause id, the tools and the heading are unchanged', () => {
    const r = room();
    const block = r.clause(r.open(), r.parties);
    assert.equal(block.getAttribute('data-clause'), r.parties.clauseId, 'sync-highlight anchors on this');
    assert.equal(block.id, 'nw-' + r.win.negoDomId(r.parties.clauseId), 'and so does negoFocus');
    assert.ok(block.querySelector(`[data-nego-edit="${r.parties.clauseId}"]`), 'Change is still there');
    assert.ok(block.querySelector(`[data-nego-del="${r.parties.clauseId}"]`), 'and Delete');
    assert.match(block.querySelector('h2').textContent, /Clause 1 · Parties and Recitals/);
  });

  /* The editor used to reach for `p`, which found the FIRST paragraph inside
     the body and swapped only that — leaving the list and everything after it
     stranded below the editor and outside what would be saved. */
  test('Change opens on the whole clause body, not its first paragraph', () => {
    const r = room();
    const doc = r.open();
    doc.querySelector(`[data-nego-edit="${r.parties.clauseId}"]`)
      .dispatchEvent(new r.win.Event('click', { bubbles: true }));
    const ed = doc.querySelector('[data-nego-editor]');
    assert.ok(ed, 'the editor opened');
    assert.equal(ed.querySelectorAll('li').length, 2, 'with the list in it');
    assert.equal(ed.querySelectorAll('p').length, 2, 'and both paragraphs');
    const block = r.clause(doc, r.parties);
    assert.ok(!block.querySelector('.nego-body'), 'and nothing of the body left stranded beside it');
  });

  test('what is filed from the editor is still measured as text', async () => {
    const r = room();
    const before = r.parties.text;
    const ch = await r.win.negoEditClause(r.c, r.parties.clauseId,
      PARTIES_CLAUSE.replace('Nairobi', 'Mombasa'),
      { side: 'counterparty', author: 'Amara Njoroge', summary: 'Mombasa' });
    assert.equal(ch.oldText, before, 'the diff still runs on the projection');
    assert.ok(Array.isArray(ch.ops) && ch.ops.length, 'and the ops are still stored on the change');
    assert.ok(ch.hash, 'and it is still fingerprinted');
  });

  test('the fingerprint chain verifies, so nothing here moved a hash', async () => {
    const r = room();
    const ch = await r.win.negoEditClause(r.c, r.payment.clauseId,
      '<p>All invoices are payable within <strong>forty-five (45) days</strong> from the date of issue.</p>',
      { side: 'counterparty', author: 'Amara Njoroge', summary: 'Net-45' });
    assert.ok(ch.hash);
    const v = await r.win.verifyChangeChain(r.c);
    assert.equal(v.ok, true, v.detail);
  });
});
