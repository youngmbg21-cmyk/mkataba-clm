/* ============================================================
   f38 — the negotiation room
   ============================================================
   The negotiation was first built as a tab inside the contract workspace. It
   rendered below the workspace header, the action bar and a tab row, so the two
   documents shared about half the width and were too short to read — which
   defeats the point of putting them side by side at all.

   It is a full-window mode now. These tests are about the things that makes
   true: that the room takes the window, that the app shell goes away and comes
   back, that there is a way out, and that the dividers move and are remembered.

   jsdom has no layout engine, so nothing here measures a pixel. What is asserted
   is the structure and the CSS the layout is built from; the widths themselves
   were checked in Chromium (BUGLOG U-004). */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { buildWorld, supplyContract } = require('./world');

const BASE = [
  'WAREHOUSING AND LOGISTICS SERVICES AGREEMENT',
  '1. SCOPE',
  '1. The Provider shall receive, store, handle and dispatch the goods.',
  '2. PAYMENT TERMS',
  '2. All invoices are payable within thirty (30) days from the date of issue.',
  '3. TERMINATION',
  '3. Either party may terminate by giving not less than sixty (60) days written notice.',
].join('\n');

function contractFixture(over = {}){
  return { id: 'MK-191', name: 'Warehousing and Logistics Services Agreement',
    counterparty: 'Nordfrakt Logistik AB', template: 'WH', status: 'Draft',
    folder: 'dist', fields: {}, metadata: {}, audit: [], rounds: [], versions: [],
    signatures: [], comments: [], redlineText: BASE, format: 'text', ...over };
}

/* A world with an app shell to hide, and a room opened over it. */
async function room(opts = {}){
  const w = buildWorld({ negotiationView: true });
  const { win } = w;
  win.promptDialog = async () => '';
  /* jsdom serves an opaque origin, where window.localStorage is a getter that
     THROWS. It is also getter-only, so a plain assignment fails silently and
     leaves the throwing one in place — defineProperty is the only way to stand
     it in. The product already guards its reads and writes; this is so the test
     can see what was written. */
  Object.defineProperty(win, 'localStorage', { configurable: true,
    value: { _v: null, getItem(){ return this._v; }, setItem(k, v){ this._v = String(v); }, removeItem(){ this._v = null; } } });
  const shell = win.document.getElementById('app-shell');
  const c = opts.contract || contractFixture();
  win.negoInit(c);
  /* Proposed against THIS contract's own baseline. Editing a copy of some other
     document would file every clause as a delete plus an insert, which is a
     different test than the one intended. */
  const base = win.negoBaseText(c);
  const proposed = (opts.proposed || (t => t
    .replace('thirty (30) days', 'forty-five (45) days')
    .replace('sixty (60) days', 'thirty (30) days')))(base);
  assert.notEqual(proposed, base, 'the fixture must actually be editable');
  const filed = await win.negoFileProposal(c, proposed,
    { side: 'counterparty', author: 'Erik Lindqvist · Nordfrakt Logistik AB' });
  const exits = [];
  win.openNegotiationRoom(c, { side: opts.side || 'owner', by: 'Wanjiru Kamau',
    author: 'Wanjiru Kamau', persist: false, readonly: !!opts.readonly,
    onExit: () => exits.push(1), ...(opts.render || {}) });
  const doc = win.document;
  return { w, win, c, filed, doc, shell, exits,
    $: sel => doc.querySelector(sel),
    $$: sel => Array.from(doc.querySelectorAll(sel)),
    click: sel => { const el = doc.querySelector(sel); assert.ok(el, 'missing: ' + sel); el.click(); return el; },
    css: () => doc.getElementById('nego-style').textContent,
  };
}

describe('the room takes the window', () => {
  test('it mounts outside the workspace, not inside it', async () => {
    const r = await room();
    const el = r.$('#nego-room');
    assert.ok(el, 'the room must exist');
    assert.equal(el.closest('#nego-room-root').id, 'nego-room-root',
      'it mounts in its own host, not in a workspace pane');
    assert.equal(r.$('#nego-tab') && r.$('#nego-tab').innerHTML, '',
      'the old in-workspace host stays empty');
  });

  test('it is fixed to the viewport, so both documents get full height', async () => {
    const r = await room();
    assert.match(r.css(), /\.nego-room\{position:fixed;inset:0/);
    assert.match(r.css(), /\.nego-room\{[^}]*display:flex;flex-direction:column/);
  });

  test('the app shell is hidden while the room is open, and restored on exit', async () => {
    const r = await room();
    assert.ok(r.shell.className.includes('hidden'), 'the nav goes away');
    assert.equal(r.shell.dataset.negoHidden, '1', 'and the room records that it was the one who hid it');
    r.win.closeNegotiationRoom();
    assert.ok(!r.shell.className.includes('hidden'), 'and comes back');
    assert.equal(r.shell.dataset.negoHidden, undefined);
  });

  test('opening twice does not double-hide, and closing twice is harmless', async () => {
    const r = await room();
    r.win.openNegotiationRoom(r.c, { side: 'owner', persist: false });
    assert.ok(r.shell.className.includes('hidden'));
    r.win.closeNegotiationRoom();
    assert.ok(!r.shell.className.includes('hidden'), 'one close is enough');
    r.win.closeNegotiationRoom();
    assert.ok(!r.shell.className.includes('hidden'), 'a second close must not re-hide anything');
    assert.equal(r.win.negoRoomIsOpen(), false);
  });

  test('the three panes and both dividers are there', async () => {
    const r = await room();
    assert.ok(r.$('#nego-room .nego-pane.baseline'));
    assert.ok(r.$('#nego-room .nego-pane.working'));
    assert.ok(r.$('#nego-room .nego-pane.index'));
    assert.ok(r.$('#nego-rz-a'), 'a divider between the two documents');
    assert.ok(r.$('#nego-rz-b'), 'and one before the index');
    for (const rz of r.$$('.nego-rz'))
      assert.equal(rz.getAttribute('role'), 'separator');
  });

  test('the panes carry the prototype\'s own wording', async () => {
    const r = await room();
    /* The pane headers are now SELECTORS — you can put any two versions side by
       side — but they still say what the prototype called them, and they open
       on the live pair. */
    const left = r.$('.nego-pane.baseline [data-nego-vsel="left"]');
    const right = r.$('.nego-pane.working [data-nego-vsel="right"]');
    assert.ok(left && right, 'each pane picks its own version');
    assert.equal(left.value, 'baseline');
    assert.equal(right.value, 'working');
    /* ROUND FIRST — see f64. The round is what orders a list spanning several
       of them, so it leads the label rather than trailing it. */
    assert.match(left.options[left.selectedIndex].textContent, /Round 1 - Baseline/);
    assert.match(right.options[right.selectedIndex].textContent, /Round 1 - Working Version/);
    assert.match(r.$('.nego-pane.baseline .nego-pane-head').textContent, /read-only reference/);
    assert.match(r.$('.nego-pane.working .nego-pane-head').textContent,
      /— Proposed Redline · fingerprints anchor in the margin/);
    assert.match(r.$('.nego-pane.index h3').textContent, /Fingerprinted Change Index/);
  });
});

describe('the top bar, and the way out', () => {
  test('it carries the brand, the breadcrumb and the contract', async () => {
    const r = await room();
    const bar = r.$('.nego-topbar');
    assert.match(bar.textContent, /HaTi/);
    assert.match(bar.textContent, /Contract Lifecycle Management/);
    assert.match(bar.textContent, /Contract Workspace MK-191/);
    assert.match(bar.querySelector('.draft-chip').textContent, /Draft/);
  });

  test('the Doc breadcrumb IS the exit', async () => {
    const r = await room();
    const exit = r.$('#nego-exit');
    assert.ok(exit, 'there must be a way out');
    assert.match(exit.textContent, /Doc/);
    assert.match(exit.getAttribute('title'), /back to the Doc page/);
    assert.ok(r.$('.nego-crumbs').contains(exit), 'and it sits in the breadcrumb, not as a second control');
  });

  test('pressing it leaves the room and tells the page that opened it', async () => {
    const r = await room();
    r.click('#nego-exit');
    assert.equal(r.$('#nego-room'), null, 'the room is gone');
    assert.ok(!r.shell.className.includes('hidden'), 'the workspace is back');
    assert.equal(r.exits.length, 1, 'and the caller was told, so it can repaint');
  });

  test('Escape leaves too', async () => {
    const r = await room();
    const e = new r.win.KeyboardEvent('keydown', { key: 'Escape' });
    r.doc.dispatchEvent(e);
    assert.equal(r.$('#nego-room'), null);
    assert.equal(r.exits.length, 1);
  });

  test('Escape after leaving does nothing — the handler is taken down', async () => {
    const r = await room();
    r.click('#nego-exit');
    r.doc.dispatchEvent(new r.win.KeyboardEvent('keydown', { key: 'Escape' }));
    assert.equal(r.exits.length, 1, 'a stray Escape must not fire the exit hook again');
  });

  test('the owner gets the prototype\'s actions', async () => {
    const r = await room();
    for (const id of ['nego-save-draft', 'nego-all-acc', 'nego-all-rej', 'nego-export'])
      assert.ok(r.$('#' + id), 'missing top-bar action: ' + id);
    /* Share Link is NOT among them any more — see f65. "Send to <them>" in
       the turn banner opens the same dialog by the same route, and two ghost
       buttons minting the same link is one too many. */
    assert.equal(r.$('#nego-share-link'), null);
    assert.equal(r.$('#nego-export').textContent.trim(), 'Export Clean PDF');
    // and a way to put wording forward, which the prototype's bar has no control for
    /* "Propose edits" is GONE, deliberately. It opened a modal holding the
       whole document in one box; a clause is now edited where it is read, with
       the Edit button on the clause itself. Two routes to one outcome is how
       they drift apart — and the whole-document route is the one that could not
       keep a heading or a list. */
    assert.equal(r.$('#nego-propose'), null,
      'the whole-document proposal modal is retired');
    assert.ok(r.$$('.nego-pane.working .nego-tools [data-nego-edit]').length,
      'proposing happens on the clause instead, and every clause offers it');
  });

  /* REWRITTEN. There were four counterparty verbs at two different scopes:
     "Accept wording" (the whole document), "Approve & sign" (which signed
     nothing), "Decline" (the whole deal) and "Send N decisions" (per change).
     Only the two that are about the WHOLE DEAL belong in a bar of deal verbs.
     Accept wording is gone — pressed with changes pending it filed an
     acceptance on nobody's behalf. The decisions send moved to the change
     index, beside the decisions it carries. */
  test('the counterparty gets the two deal verbs, and only those', async () => {
    const r = await room({ side: 'counterparty' });
    const slot = r.$('.nego-top-actions');
    for (const id of ['nego-cp-ready', 'nego-cp-decline'])
      assert.ok(slot.querySelector('#' + id), 'missing counterparty action: ' + id);
    assert.equal(slot.querySelector('#nego-cp-accept'), null,
      'accepting the whole document is not an answer to anybody\'s specific ask');
    assert.equal(slot.querySelector('#nego-cp-sign'), null,
      'nothing is signed in the room — the verb is Ready to sign');
    assert.match(slot.querySelector('#nego-cp-ready').textContent, /Ready to sign/);
    assert.equal(r.$('#nego-save-draft'), null, 'and not the owner\'s');
    assert.equal(r.$('#nego-share-link'), null);
  });

  test('their name is asked for in the room, because the room is their page', async () => {
    const r = await room({ side: 'counterparty', render: { recipientName: 'Erik Lindqvist' } });
    const box = r.$('.nego-top-actions #nego-cp-name');
    assert.ok(box, 'the field that gates every send must be reachable from the room');
    assert.equal(box.value, 'Erik Lindqvist', 'prefilled from who the link was addressed to');
  });

  test('a read-only copy offers no verbs at all', async () => {
    const r = await room({ side: 'counterparty', readonly: true });
    assert.equal(r.$('#nego-cp-ready'), null);
    assert.equal(r.$('#nego-cp-decline'), null);
    assert.equal(r.$('[data-nego-accept]'), null);
    assert.ok(r.$('.nego-pane.working'), 'but it still renders, so it can be read');
  });

  test('an unhandled action says so rather than failing silently', async () => {
    const r = await room({ side: 'counterparty' });   // no onDecline hook supplied
    r.click('#nego-cp-decline');
    assert.match(r.w.toastText(), /not available on this screen/);
  });
});

describe('the dividers move, and are remembered', () => {
  test('the workbench is driven by the two layout variables', async () => {
    const r = await room();
    const work = r.$('#nego-work');
    assert.equal(work.style.getPropertyValue('--nego-f'), '0.46');
    assert.equal(work.style.getPropertyValue('--nego-c'), '335px');
    assert.match(r.css(), /grid-template-columns:\s*calc\(\(100% - var\(--nego-c\) - 12px\) \* var\(--nego-f\)\)/);
  });

  test('setting a width writes it to the element and to storage', async () => {
    const r = await room();
    r.win.negoSetLayout({ f: 0.62 });
    assert.equal(r.$('#nego-work').style.getPropertyValue('--nego-f'), '0.62');
    const saved = JSON.parse(r.win.localStorage.getItem('hati.v1.negoLayout'));
    assert.equal(saved.f, 0.62);
  });

  test('the widths are clamped, so a pane can never be dragged out of existence', async () => {
    const r = await room();
    r.win.negoSetLayout({ f: 5 });
    assert.equal(r.win.negoLayout().f, 0.8, 'the baseline cannot swallow the working copy');
    r.win.negoSetLayout({ f: -3 });
    assert.equal(r.win.negoLayout().f, 0.2);
    r.win.negoSetLayout({ c: 10 });
    assert.equal(r.win.negoLayout().c, 240, 'the index keeps a readable width');
    r.win.negoSetLayout({ c: 9999 });
    assert.equal(r.win.negoLayout().c, 560);
  });

  test('folding the index gives its width to the documents', async () => {
    const r = await room();
    assert.ok(r.$('#nego-fold'), 'there must be a fold control');
    r.click('#nego-fold');
    const work = r.$('#nego-work');
    assert.ok(work.className.includes('idx-off'));
    assert.match(r.css(), /\.nego-work\.idx-off\{grid-template-columns:\s*calc\(\(100% - 6px\) \* var\(--nego-f\)\)/);
    assert.match(r.css(), /\.nego-work\.idx-off \.nego-pane\.index,\.nego-work\.idx-off \.nego-rz-b\{display:none\}/);
    assert.ok(r.$('#nego-unfold'), 'and a way to bring it back');
  });

  test('unfolding restores it, and the choice survives a repaint', async () => {
    const r = await room();
    r.click('#nego-fold');
    assert.equal(r.win.negoLayout().idxOff, true);
    r.win.openNegotiationRoom(r.c, { side: 'owner', persist: false });
    assert.ok(r.$('#nego-work').className.includes('idx-off'), 'still folded after a repaint');
    r.click('#nego-unfold');
    assert.equal(r.win.negoLayout().idxOff, false);
    assert.ok(!r.$('#nego-work').className.includes('idx-off'));
  });
});

describe('the room is the same negotiation, not a second one', () => {
  test('deciding a change in the room moves the wording', async () => {
    const r = await room();
    const ch = r.filed.find(x => /forty-five/.test(x.newText));
    r.click(`[data-nego-accept="${ch.id}"]`);
    assert.equal(r.win.negoChangeById(r.c, ch.id).status, 'accepted');
    assert.match(r.win.docPlainText(r.c), /forty-five \(45\) days/);
    // and the room repainted itself rather than collapsing back to the panel
    assert.ok(r.$('#nego-room'), 'the room must still be the thing on screen');
    assert.match(r.$(`[data-badge="${ch.id}"]`).textContent, /✓/);
  });

  test('the status strip and the index track it', async () => {
    const r = await room();
    assert.match(r.$('#nego-status').textContent, /Resolved: 0 \/ 2/);
    r.click('#nego-bulk-acc');
    assert.match(r.$('#nego-status').textContent, /Resolved: 2 \/ 2/);
    assert.match(r.$('#nego-progress').textContent, /^2 of 2 changes resolved$/);
  });

  test('Ready to sign and the hand-off appear inside the room', async () => {
    const r = await room();
    assert.equal(r.$('#nego-ready'), null);
    r.click('#nego-bulk-acc');
    assert.ok(r.$('#nego-ready'), 'the banner belongs in the room too');
    assert.equal(r.$('#nego-to-docs').textContent.trim(), 'Send to Docs tab for signature');
    // and still nothing that signs
    assert.equal(r.c.status, 'Draft');
    assert.equal((r.c.signatures || []).length, 0);
  });

  test('a discussion in the room opens no round', async () => {
    const r = await room();
    const ch = r.filed[0];
    const rounds = (r.c.rounds || []).length;
    r.click(`[data-nego-discuss="${ch.id}"]`);
    r.$(`#nego-ti-${ch.id}`).value = 'Would you take Net-45?';
    r.click(`[data-nego-send="${ch.id}"]`);
    assert.equal((r.c.rounds || []).length, rounds);
    assert.equal(r.win.negoChangeById(r.c, ch.id).thread.length, 1);
    assert.ok(r.$('#nego-room'), 'and we are still in the room');
  });

  test('a rich contract keeps its formatting when decided in the room', async () => {
    const r = await room({ contract: supplyContract({ status: 'Draft' }),
      proposed: t => t.replace('thirty (30) days of a valid invoice', 'forty-five (45) days of a valid invoice') });
    r.click('#nego-bulk-acc');
    assert.equal(r.win.docFormat(r.c.format), 'rich');
    assert.match(r.c.redlineText, /<h1>RAW MATERIAL SUPPLY AGREEMENT<\/h1>/);
  });
});
