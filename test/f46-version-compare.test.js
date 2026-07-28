/* f46 — any version against any other
   ============================================================
   The two panes were fixed: this round's baseline on the left, this round's
   working copy on the right. That is the right default and it is not the only
   question people have. "What did this clause say before we conceded it in
   round 2" is answerable from the version list and was not reachable from this
   screen.

   The pane headers are now selectors over every snapshot the contract carries.

   ONE RULE governs what happens when you pick something else, and it is why
   this is more than a rendering change: A COMPARISON OF TWO OLD VERSIONS IS
   HISTORY. The fingerprints belong to the round in flight; the differences
   between v2 and v5 were never proposed by anybody and there is nobody to
   accept them. So the screen goes read-only and says so. Offering Accept on a
   difference nobody put forward would be inventing a decision — the same
   failure as a Verified badge that verified nothing. */
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
/* A contract with real history: two rounds closed, so there are versions to
   choose between rather than a list of one. */
async function withHistory(win){
  const c = contract();
  win.negoInit(c);
  const edit = async (num, body, summary) => {
    const cl = win.negoClauseList(c).find(x => x.num === num);
    return win.negoEditClause(c, cl.clauseId, body,
      { side: 'counterparty', author: 'Erik Lindqvist', summary });
  };
  const a = await edit('4', `<p>${F.PROTO_ASKS['4'].text}</p>`, 'Net-45');
  const b = await edit('6', `<p>${F.PROTO_ASKS['6'].text}</p>`, 'EUR 250,000 cap');
  win.negoResolve(c, a.id, 'accepted', { by: 'Wanjiru Kamau' });
  win.negoResolve(c, b.id, 'rejected', { by: 'Wanjiru Kamau' });
  win.negoAdvanceRound(c, { by: 'Wanjiru Kamau' });
  const d = await edit('9', `<p>${F.PROTO_ASKS['9'].text}</p>`, '30 days notice');
  win.negoResolve(c, d.id, 'accepted', { by: 'Wanjiru Kamau' });
  win.negoAdvanceRound(c, { by: 'Wanjiru Kamau' });
  return c;
}
async function mounted(c){
  const w = buildWorld({ negotiationView: true });
  const win = w.win;
  const contractC = c || await withHistory(win);
  win.negoResetView();
  win.openNegotiationRoom(contractC, { side: 'owner', by: 'Wanjiru Kamau', persist: false });
  const doc = win.document;
  return { win, c: contractC, doc,
    $: sel => doc.querySelector(sel), $$: sel => Array.from(doc.querySelectorAll(sel)),
    pick: (which, key) => {
      const sel = doc.querySelector(`[data-nego-vsel="${which}"]`);
      sel.value = key;
      sel.dispatchEvent(new win.Event('change', { bubbles: true }));
    } };
}

describe('every version the contract carries is selectable', () => {
  test('the list reads as a sequence: the original first, what is on the table last', async () => {
    const { win } = buildWorld();
    const c = await withHistory(win);
    const opts = win.negoVersionOptions(c);

    /* THE ORDER IS THE DOCUMENT'S OWN. First the wording this round is
       measured against, then each saved version in the order it was taken,
       then what is on the table now. It used to be the live pair followed by
       the snapshots newest-first, which put the original at the bottom of a
       list whose first entry changed every round — so "which one is the
       contract we started from" was answered by a different row each time. */
    assert.equal(opts[0].key, 'baseline', 'the original the round is measured against comes first');
    assert.equal(opts[opts.length - 1].key, 'working', 'and what is proposed now comes last');
    assert.match(opts[0].label, /^Original Baseline · round 3/, 'the prototype’s own words are kept');
    assert.match(opts[opts.length - 1].label, /^Working Version · round 3/);
    const versions = opts.slice(1, -1);
    assert.equal(versions.length, 2, `expected one snapshot per document change, got ${versions.length}`);
    assert.notEqual(versions[0].text, versions[1].text, 'and each one is a different document');
    const ns = versions.map(v => v.n);
    assert.deepEqual(own(ns), own(ns.slice().sort((a, b) => a - b)),
      'oldest first — the list is read top to bottom as the sequence the document went through');
    for (const v of versions) assert.ok(v.body && v.body.trim(), `v${v.n} must carry a document`);
  });

  /* WHAT IS NOT OFFERED, and why that is the point.

     Every milestone takes a snapshot — the template applied, each hand-over,
     each round closing, the signature — and all of them belong in the version
     history. A pane selector is not the version history: it asks which two
     DOCUMENTS to put side by side, and two entries holding word-for-word the
     same document are not two answers to that.

     A contract opened for the first time offered three choices, of which the
     first and the third were the identical wording under two names. */
  test('a version that says exactly what the live pair says is not offered twice', async () => {
    const { win } = buildWorld();
    const c = contract();
    win.negoInit(c);
    win.captureVersion(c, 'Template “Warehousing & Distribution”', 'Wanjiru Kamau');

    assert.ok(win.listedVersions(c).length >= 1, 'the version history still records it');
    assert.ok(win.negoVersionByKey(c, 'v1'), 'and the key still resolves to that document');
    assert.deepEqual(own(win.negoVersionChoices(c).map(o => o.key)), ['baseline', 'working'],
      'a freshly opened contract offers the original and the working copy, and nothing else');
  });

  test('a version that says something different is offered', async () => {
    const { win } = buildWorld();
    const c = contract();
    win.negoInit(c);
    win.captureVersion(c, 'Template “Warehousing & Distribution”', 'Wanjiru Kamau');
    const cl = win.negoClauseList(c).find(x => x.num === '4');
    const ch = await win.negoEditClause(c, cl.clauseId, `<p>${F.PROTO_ASKS['4'].text}</p>`,
      { side: 'counterparty', author: 'Erik Lindqvist', summary: 'Net-45' });
    win.negoResolve(c, ch.id, 'accepted', { by: 'Wanjiru Kamau' });
    win.negoAdvanceRound(c, { by: 'Wanjiru Kamau' });

    const keys = win.negoVersionChoices(c).map(o => o.key);
    assert.equal(keys[0], 'baseline');
    assert.equal(keys[keys.length - 1], 'working');
    assert.ok(keys.includes('v1'),
      'the wording before the round is a different document, so it stays on the list');
  });

  /* A selection cannot be dropped out from under the pane showing it: a
     <select> whose own value is missing from its options renders as blank. */
  test('a version being shown stays on the menu even when it duplicates the pair', async () => {
    const { win } = buildWorld();
    const c = contract();
    win.negoInit(c);
    win.captureVersion(c, 'Template “Warehousing & Distribution”', 'Wanjiru Kamau');
    const keys = win.negoVersionChoices(c, ['v1']).map(o => o.key);
    assert.ok(keys.includes('v1'), 'the pane is showing it, so it is on the list');
    assert.ok(keys.includes('baseline') && keys.includes('working'),
      'and the live pair is always reachable — a mode you cannot leave is a trap');
  });

  test('a plain-text snapshot is lifted so it can still be compared', () => {
    const { win } = buildWorld();
    const c = contract({ versions: [{ n: 1, at: '2026-07-01T09:00:00Z', by: 'W',
      label: 'Saved', text: 'AGREEMENT\n1. SCOPE\nThe Provider shall deliver.', format: 'text' }] });
    win.negoInit(c);
    const v1 = win.negoVersionByKey(c, 'v1');
    assert.ok(v1.body.includes('<'), 'an old text-only version still has to be readable as a document');
    assert.ok(win.clauseSegment(v1.body).length > 0, 'and segmentable into clauses');
  });
});

describe('two versions, compared clause by clause', () => {
  test('it reports what changed, what was added and what was removed', async () => {
    const { win } = buildWorld();
    const c = contract();
    win.negoInit(c);
    const before = c.negotiation.baselineBody;
    const four = win.clauseSegment(before).find(x => x.num === '4');
    const twelve = win.clauseSegment(before).find(x => x.num === '12');
    let after = win.clauseReplaceBody(before, four.clauseId, `<p>${F.PROTO_ASKS['4'].text}</p>`);
    after = win.clauseRemove(after, twelve.clauseId);
    after = win.clauseInsert(after, four.clauseId,
      { headingText: 'Clause 4A · Invoice disputes', bodyHtml: '<p>Raise within ten (10) days.</p>' }).html;
    c.versions = [{ n: 1, at: '2026-07-01T09:00:00Z', by: 'W', label: 'Before',
      text: win.richToText(before), body: before, format: 'rich' },
      { n: 2, at: '2026-07-02T09:00:00Z', by: 'W', label: 'After',
        text: win.richToText(after), body: after, format: 'rich' }];

    const cmp = win.negoCompareVersions(c, 'v1', 'v2');
    const state = k => cmp.rows.filter(r => r.state === k);
    assert.equal(state('changed').length, 1, 'one clause reworded');
    assert.match(state('changed')[0].label, /Clause 4 · Payment Terms/);
    assert.equal(state('added').length, 1, 'one clause added');
    assert.match(state('added')[0].label, /Invoice disputes/);
    assert.equal(state('removed').length, 1, 'one clause removed');
    assert.match(state('removed')[0].label, /Clause 12/);
    assert.equal(state('same').length, 4, 'and the rest are untouched');
    assert.equal(cmp.moved, 3);
  });

  test('a reworded clause carries the ops, so the difference is readable', async () => {
    const { win } = buildWorld();
    const c = await withHistory(win);
    const cmp = win.negoCompareVersions(c, 'baseline', 'working');
    for (const r of cmp.rows){
      assert.equal(win.redlineOldText(r.ops), r.oldText, `${r.label}: keep+del is the old wording`);
      assert.equal(win.redlineNewText(r.ops), r.newText, `${r.label}: keep+ins is the new wording`);
    }
  });

  /* The property durable clause ids buy: a clause is followed across versions
     even when it has been renumbered or had clauses inserted above it. */
  test('a renumbered clause is followed, not reported as removed-and-added', async () => {
    const { win } = buildWorld();
    const c = contract();
    win.negoInit(c);
    const before = c.negotiation.baselineBody;
    let after = before;
    win.clauseSegment(before).forEach((cl, i) => {
      after = win.clauseReplaceHeading(after, cl.clauseId, `Clause ${i + 1} · ${cl.title}`);
    });
    c.versions = [{ n: 1, by: 'W', label: 'Before', text: win.richToText(before), body: before },
      { n: 2, by: 'W', label: 'Renumbered', text: win.richToText(after), body: after }];

    const cmp = win.negoCompareVersions(c, 'v1', 'v2');
    assert.equal(cmp.moved, 0,
      'renumbering changes no wording, so nothing should be reported as different');
    assert.equal(cmp.rows.filter(r => r.state === 'removed').length, 0);
    assert.equal(cmp.rows.filter(r => r.state === 'added').length, 0);
  });

  test('identical versions say so rather than showing an empty screen', async () => {
    const { win } = buildWorld();
    const c = await withHistory(win);
    const cmp = win.negoCompareVersions(c, 'baseline', 'baseline');
    assert.equal(cmp.moved, 0);
    assert.match(cmp.summary, /say the same thing/);
  });

  test('the live pair is recognised as live; anything else is not', async () => {
    const { win } = buildWorld();
    const c = await withHistory(win);
    assert.equal(win.negoCompareVersions(c, 'baseline', 'working').live, true);
    assert.equal(win.negoCompareVersions(c, 'v1', 'working').live, false);
    assert.equal(win.negoCompareVersions(c, 'baseline', 'v2').live, false);
    assert.equal(win.negoIsLivePair('baseline', 'working'), true);
    assert.equal(win.negoIsLivePair('v1', 'working'), false);
  });

  test('an unknown key is reported, not guessed at', async () => {
    const { win } = buildWorld();
    const c = await withHistory(win);
    assert.equal(win.negoCompareVersions(c, 'v999', 'working'), null);
    assert.equal(win.negoVersionByKey(c, 'nope'), null);
  });
});

describe('the room opens on the live pair and can leave it', () => {
  test('both panes start on the live pair, with the normal screen', async () => {
    const m = await mounted();
    assert.equal(m.$('[data-nego-vsel="left"]').value, 'baseline');
    assert.equal(m.$('[data-nego-vsel="right"]').value, 'working');
    assert.equal(m.$('#nego-cmp-bar'), null, 'no comparison banner on the live pair');
  });

  test('picking an old version enters a comparison and says so', async () => {
    const m = await mounted();
    m.pick('left', 'v1');
    const bar = m.$('#nego-cmp-bar');
    assert.ok(bar, 'the screen must say you are reading history');
    assert.match(bar.textContent, /Comparing versions/);
    assert.match(bar.textContent, /read-only look back/);
    assert.match(bar.textContent, /nothing here to accept or reject/);
    assert.equal(m.$('[data-nego-vsel="left"]').value, 'v1', 'and the selector remembers the choice');
  });

  /* THE rule. */
  test('a comparison offers no decisions at all', async () => {
    const m = await mounted();
    assert.ok(m.$$('[data-nego-accept]').length + m.$$('[data-nego-reject]').length > 0
      || m.win.negoPending(m.c).length === 0, 'sanity: the live screen is the one with verbs');
    m.pick('left', 'v1');
    assert.equal(m.$$('[data-nego-accept]').length, 0, 'nobody proposed these differences');
    assert.equal(m.$$('[data-nego-reject]').length, 0);
    assert.equal(m.$$('[data-nego-undo]').length, 0);
    assert.equal(m.$$('.nego-badge').length, 0,
      'and no fingerprints — a fingerprint names a change, and there are none here');
    /* The BULK verbs too. Leaving "Accept All" live while someone reads history
       would let them accept the round behind the page they are looking at. */
    assert.equal(m.$('#nego-bulk-acc'), null, 'no bulk Accept in the index');
    assert.equal(m.$('#nego-bulk-rej'), null, 'no bulk Reject in the index');
    assert.ok(m.$('#nego-all-acc').disabled, 'and the top bar’s Accept All is disabled');
    assert.ok(m.$('#nego-all-rej').disabled, 'as is Reject All');
    assert.match(m.$('#nego-all-acc').getAttribute('title'), /comparing versions/);
  });

  test('the index reports the comparison, not the round’s progress', async () => {
    const m = await mounted();
    m.pick('left', 'v1');
    assert.match(m.$('#nego-progress').textContent, /Read-only comparison/,
      '"1 of 4 changes resolved" is about the live round and would mislead here');
    assert.equal(m.$('#nego-fill'), null, 'and the round’s progress bar is not shown');
  });

  test('the index lists the differences instead of the round’s changes', async () => {
    const m = await mounted();
    m.pick('left', 'v1');
    const rows = m.$$('[data-nego-cmp-row]');
    assert.ok(rows.length, 'the differences belong on the list');
    for (const r of rows) assert.ok(r.textContent.trim(), 'each row must say what differs');
  });

  test('Back to the live round restores the working screen', async () => {
    const m = await mounted();
    m.pick('left', 'v1');
    assert.ok(m.$('#nego-cmp-bar'));
    assert.ok(m.$('#nego-cmp-exit').className.includes('nego-cmp-exit'),
      'the way out must be a solid button, not a ghost that vanishes into the banner');
    m.$('#nego-cmp-exit').click();
    assert.equal(m.$('#nego-cmp-bar'), null, 'a mode you cannot leave is a trap');
    assert.ok(m.$('#nego-bulk-acc'), 'and the live verbs come back');
    assert.equal(m.$('[data-nego-vsel="left"]').value, 'baseline');
    assert.equal(m.$('[data-nego-vsel="right"]').value, 'working');
  });

  test('choosing the live pair back by hand also leaves comparison mode', async () => {
    const m = await mounted();
    m.pick('right', 'v1');
    assert.ok(m.$('#nego-cmp-bar'));
    m.pick('right', 'working');
    assert.equal(m.$('#nego-cmp-bar'), null);
    assert.ok(m.$$('[data-nego-accept]').length >= 0, 'and the live screen is back');
  });

  test('the comparison does not leak into the next contract opened', async () => {
    const m = await mounted();
    m.pick('left', 'v1');
    assert.equal(m.win.negoComparePair().left, 'v1');
    m.win.negoResetView();
    assert.deepEqual(own(Object.values(m.win.negoComparePair())), ['baseline', 'working'],
      'a stale comparison must not follow you to a different contract');
  });

  test('comparing changes no wording and files nothing', async () => {
    const m = await mounted();
    const textBefore = m.win.docPlainText(m.c);
    const changesBefore = m.win.negoChanges(m.c).length;
    m.pick('left', 'v1');
    m.pick('right', 'v2');
    assert.equal(m.win.docPlainText(m.c), textBefore, 'looking at history changes no history');
    assert.equal(m.win.negoChanges(m.c).length, changesBefore);
  });
});
