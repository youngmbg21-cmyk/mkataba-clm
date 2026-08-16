/* f207 — ONE PROPOSAL ON THE TABLE (owner-approved 15 Aug 2026, from
 * WORKORDER-competing-redlines.md and the rendered brief).
 *
 * THE STATE THIS IS ABOUT: two live changes on one clause — our ask and their
 * counter. The 15 Aug review reproduced five symptoms against the real
 * renderers: the paper drew only one of them, the other's card had no clause to
 * jump to, accepting both silently kept only the second, a decided mark
 * vanished when a newer change landed, and the counterparty's page mirrored all
 * of it. The market research behind the fix found that no credible tool ships
 * this state: Word and Google Docs make rivals unrepresentable by layering, the
 * CLM platforms make the counter the position on the table with the earlier
 * proposal kept as history, and nobody lets a second acceptance silently
 * discard a first.
 *
 * THE FIX, in three parts:
 *   A. The paper tells the truth — both document renderers keep a LIST of
 *      changes per clause. Every ask draws its tag; the jump anchor carries
 *      every id (the queue's own data-rl-queue-ids pattern).
 *   B. A counter takes the table — a filing on a clause whose pending change
 *      the fold does not cover (other side, or another round) SUPERSEDES it,
 *      linked both ways, said in the audit trail. Uses the 'superseded' status
 *      that every list, count and the share payload already filter and that
 *      nothing had ever set.
 *   C. The guard — accepting a change on a clause that already carries a
 *      different accepted change this round is refused in words. For contracts
 *      that already hold rivals, where accept-both was a silent overwrite.
 */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

/* ---- REVERSED IN PLACE, 16 Aug 2026 ---- the ask tags have come off the
   paper (owner-asked: "remove the pills from the contracts"). Four of them on
   one clause heading pushed the clause's own name off its line. What replaced
   them is the clause PANEL — every ask on the clause, live and settled, with
   its wording and its outcome, behind the Edit pill on the same row — and a red
   rule down the clause's right edge, which says at a glance the one thing the
   tags said at a glance: this clause has been argued over.

   The claim is not deleted, because what it was really pinning is still true
   and still worth pinning. It is re-pointed at the surface that now carries it.

   Every ask on a clause is named once in the panel, in a .rl-cp-who line whose
   <b> is the change id — the same population the tags drew, read where it now
   lives. Deduplicated, because a live ask is named on the table AND nowhere
   else while settled ones sit in the history: one row per change either way. */
const _panelIds = html => {
  const ids = [...String(html).matchAll(/<span class="rl-cp-who"><b>([^<]+)<\/b>/g)].map(m => m[1]);
  return [...new Set(ids)];
};
/* The canvas AND the panel bodies it fills. redlineDocHtml only builds the
   panel when a caller hands it a sink, so a test that wants to know what the
   reader can see has to be that caller — see the one-producer rule in f210. */
const _paper = (win, c, opts = {}) => {
  const cpSink = [];
  const doc = win.redlineDocHtml(c, { ...opts, cpSink });
  return { doc, panel: cpSink.join('') };
};
const { buildWorld, supplyContract } = require('./world.js');

const RICH = [
  '<h2>1. Payment</h2>',
  '<p>Payment shall be made within thirty (30) days of invoice.</p>',
  '<h2>2. Insurance</h2>',
  '<p>The Supplier shall maintain cover of not less than KES 20,000,000.</p>',
].join('');

const plain = s => String(s || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

function stage(){
  const w = buildWorld({ negotiationView: true, contractView: true });
  const c = supplyContract({ redlineText: RICH, format: 'rich' });
  w.win.negoInit(c);
  return { w, win: w.win, c, cl: w.win.negoClauseList(c)[0].clauseId };
}
/* Our ask, then their counter on the same clause — the commonest shape a real
   negotiation makes, driven through the same funnel every route uses. */
async function contested(){
  const s = stage();
  s.ours = await s.win.negoEditClause(s.c, s.cl,
    '<p>Payment shall be made within forty-five (45) days of invoice.</p>',
    { side: 'owner', author: 'Amina Otieno' });
  s.theirs = await s.win.negoEditClause(s.c, s.cl,
    '<p>Payment shall be made within ninety (90) days of invoice.</p>',
    { side: 'counterparty', author: 'Nordkust Legal', via: 'their link' });
  return s;
}
/* The LEGACY shape — two pending rivals side by side, as contracts written
   before this rule already hold. Built by hand because the funnel no longer
   produces it; parts A and C exist for exactly these records. */
async function legacyRivals(){
  const s = stage();
  s.ours = await s.win.negoEditClause(s.c, s.cl,
    '<p>Payment shall be made within forty-five (45) days of invoice.</p>',
    { side: 'owner', author: 'Amina Otieno' });
  s.theirs = await s.win.negoEditClause(s.c, s.cl,
    '<p>Payment shall be made within ninety (90) days of invoice.</p>',
    { side: 'counterparty', author: 'Nordkust Legal' });
  /* Un-supersede by hand: the stored record of an older contract. */
  s.ours.status = 'pending';
  delete s.ours.supersededBy; delete s.ours.supersededAt; delete s.theirs.counterOf;
  return s;
}

/* ============================================================ */
describe('f207-B — a counter takes the table', () => {
  test('their counter supersedes our pending ask, linked both ways', async () => {
    const { win, c, ours, theirs } = await contested();
    assert.equal(ours.status, 'superseded', 'the earlier ask steps down');
    assert.equal(ours.supersededBy, theirs.id, 'and says what took the table');
    assert.ok(ours.supersededAt, 'with a timestamp');
    assert.equal(theirs.counterOf, ours.id, 'the counter names what it answers');
    assert.equal(theirs.status, 'pending', 'and is the one live question');
    const live = win.negoPending(c);
    assert.equal(live.length, 1, 'one proposal on the table');
    assert.equal(live[0].id, theirs.id);
  });

  test('the supersession is in the audit trail, naming both', async () => {
    const { w, ours, theirs } = await contested();
    const line = w.log.audit.map(a => `${a.action}: ${a.detail}`).join('\n');
    assert.match(line, new RegExp(`${theirs.id}[\\s\\S]*supersed[\\s\\S]*${ours.id}|${ours.id}[\\s\\S]*supersed`, 'i'),
      'the record says one ask replaced the other: ' + line.split('\n').slice(-2).join(' | '));
  });

  test('the fold is UNTOUCHED: same side, same round still revises in place', async () => {
    const s = stage();
    const first = await s.win.negoEditClause(s.c, s.cl, '<p>Forty-five days.</p>',
      { side: 'owner', author: 'Amina Otieno' });
    const second = await s.win.negoEditClause(s.c, s.cl, '<p>Sixty days.</p>',
      { side: 'owner', author: 'Brian Ochieng' });
    assert.equal(second.id, first.id, 'one card, revised — not a supersession');
    assert.equal(s.win.negoChanges(s.c).length, 1);
    assert.equal(second.status, 'pending');
    assert.equal((second.revisions || []).length, 1, 'the previous wording is on revisions[]');
  });

  test('same side, ANOTHER round supersedes rather than filing a rival', async () => {
    const s = stage();
    const old = await s.win.negoEditClause(s.c, s.cl, '<p>Forty-five days.</p>',
      { side: 'owner', author: 'Amina Otieno', roundN: 1 });
    const fresh = await s.win.negoEditClause(s.c, s.cl, '<p>Fifty days.</p>',
      { side: 'owner', author: 'Amina Otieno', roundN: 2 });
    assert.notEqual(fresh.id, old.id, 'a new round files a new change');
    assert.equal(old.status, 'superseded', 'and the stale ask steps down rather than standing beside it');
    assert.equal(fresh.counterOf, old.id);
  });

  test('insertions never supersede and are never superseded', async () => {
    const s = stage();
    const ins = await s.win.negoInsertClause(s.c, null,
      { headingText: 'Escrow', bodyHtml: '<p>An escrow of KES 1,000,000.</p>' },
      { side: 'owner', author: 'Amina Otieno' });
    /* Their edit of the PROPOSED new clause is layered work on ground the
       insertion provides — superseding the insertion would delete the ground
       the edit stands on. Both stay. Filed through the funnel directly: the
       clause editor only reaches baseline clauses, but the Word round-trip
       and applyNegoProposals both arrive here with a modify on a pending
       insert's id. */
    const edit = await s.win.negoFileChange(s.c, { clauseId: ins.clauseId, changeType: 'modify',
      oldText: 'An escrow of KES 1,000,000.', newText: 'An escrow of KES 2,000,000.',
      clauseLabel: 'Escrow' }, { side: 'counterparty', author: 'Nordkust Legal' });
    assert.ok(edit, 'the modify files');
    assert.equal(ins.status, 'pending', 'the insertion stands');
    assert.ok(!edit.counterOf, 'and the edit is not recorded as a counter');
    /* And a second, unrelated insertion supersedes nothing anywhere. */
    const before = s.win.negoChanges(s.c).map(x => x.status).join(',');
    await s.win.negoInsertClause(s.c, null,
      { headingText: 'Notices', bodyHtml: '<p>Notices go by email.</p>' },
      { side: 'counterparty', author: 'Nordkust Legal' });
    assert.equal(s.win.negoChanges(s.c).slice(0, 2).map(x => x.status).join(','), before,
      'an insertClause filing scans no rivals');
  });

  test('a superseded change leaves the column, the counts and the payload — machinery that already existed', async () => {
    const { win, c, ours, theirs } = await contested();
    const ids = win.redlineCardIds(c, { side: 'owner' });
    assert.ok(!ids.includes(ours.id), 'off the card column');
    assert.ok(ids.includes(theirs.id), 'the counter is on it');
    const queue = win.rlQueueRows(c, { side: 'owner' });
    const queued = queue.flatMap(r => r.changes.map(x => x.id));
    assert.ok(!queued.includes(ours.id), 'off the round queue');
  });

  /* ---- CLAIM REVERSED IN PLACE, 15 Aug 2026 ----
     This asserted that the countering card CARRIES a line naming the ask it
     replaced — "Counters #CHG-005 — the earlier ask stays on the record". The
     owner saw it on the real page and ruled it out: "avoid adding more
     information to the cards unless I ask you to."

     A fair call, and the reason is the card's budget. It already carries an
     id, a status, a clause, an author, a company, the marked wording, a reason
     and a row of verbs; a ninth line about record-keeping was the least of
     those and it pushed the wording down.

     THE FACT IS NOT LOST, which is what makes the removal safe rather than a
     deletion: `counterOf` is still stamped by the funnel (asserted above),
     still travels on the payload (asserted below), and the audit trail still
     names both changes. What went is one line of prose on a card. */
  test('the card does NOT explain what it countered — that stays in the record', async () => {
    const { win, c, theirs, ours } = await contested();
    const cards = win.redlineChangeCardsHtml(c, { side: 'owner', canAct: true });
    const card = cards.split('data-nego-card=').find(x => x.includes(theirs.id)) || '';
    assert.ok(card, 'the countering card is on the table');
    assert.ok(!/counter/i.test(card), 'and carries no counter line');
    assert.ok(!card.includes(ours.id),
      'nor names the ask it replaced — that is what the audit trail is for');
    /* The record still knows, which is the half that must not be lost. */
    assert.equal(win.negoChangeById(c, theirs.id).counterOf, ours.id,
      'counterOf is still stamped on the change itself');
    assert.ok((c.audit || []).some(a => /\b(counter|supersed)/i.test(
      [a.action, a.detail].filter(Boolean).join(' '))),
      'and the audit trail still names the supersession');
  });

  test('when the loser was OUR OWN UNSENT draft, the owner is told', async () => {
    const s = stage();
    await s.win.negoEditClause(s.c, s.cl, '<p>Forty-five days.</p>',
      { side: 'owner', author: 'Amina Otieno' });
    s.w.log.toasts.length = 0;
    await s.win.negoEditClause(s.c, s.cl, '<p>Ninety days.</p>',
      { side: 'counterparty', author: 'Nordkust Legal', via: 'their link' });
    const said = s.w.log.toasts.map(t => t.msg).join(' | ');
    assert.match(said, /replaced|superseded|set aside/i,
      'their arrival over our internal work must not be silent: ' + (said || 'NOTHING SAID'));
  });
});

/* ============================================================ */
describe('f207-A — the paper tells the truth (legacy rivals)', () => {
  test('the workbench document draws a tag for EVERY ask on the clause', async () => {
    const { win, c, ours, theirs } = await legacyRivals();
    const { doc, panel } = _paper(win, c, { side: 'owner' });
    const tags = _panelIds(panel);
    assert.ok(tags.includes(ours.id), 'our ask is named where the reader can reach it');
    assert.ok(tags.includes(theirs.id), 'and so is theirs');
    /* AND THE CLAUSE ITSELF SAYS IT HAS BEEN ARGUED OVER, which is what the
       tags did at a glance and what the red margin rule does now. */
    assert.match(doc, /class="nego-clause rl-clause is-changed/,
      'the clause is marked as changed on the paper');
  });

  test('the jump anchor carries every id, and each is findable the way the queue is', async () => {
    const { win, c, ours, theirs } = await legacyRivals();
    const doc = win.redlineDocHtml(c, { side: 'owner' });
    const anchors = [...doc.matchAll(/data-nego-card-anchor="([^"]+)"/g)].map(m => m[1].replace(/<[^>]+>/g, ''));
    const hit = anchors.find(a => a.split(/\s+/).includes(ours.id));
    assert.ok(hit, 'the hidden ask has a clause to jump to: ' + JSON.stringify(anchors));
    assert.ok(hit.split(/\s+/).includes(theirs.id), 'one clause, one anchor, both ids');
    /* The [~=] word-match rlLinkFocus now uses. */
    const dom = new (require('jsdom').JSDOM)(`<div id="rl-doc">${doc}</div>`);
    for (const id of [ours.id, theirs.id])
      assert.ok(dom.window.document.querySelector(`#rl-doc [data-nego-card-anchor~="${id}"]`),
        `attribute word-match finds the clause for ${id}`);
  });

  test('a decided mark no longer vanishes when a newer change lands on the clause', async () => {
    const { win, c, ours, theirs } = await legacyRivals();
    win.negoResolve(c, ours.id, 'accepted', { side: 'counterparty', by: 'Nordkust Legal' });
    const { doc, panel } = _paper(win, c, { side: 'owner' });
    assert.match(panel, /adopted/, 'the acceptance is on the record the reader opens');
    assert.match(doc, /is-changed/, 'and the clause is still marked as argued over');
    const tags = _panelIds(panel).join(' | ');
    assert.ok(tags.includes(ours.id) && tags.includes(theirs.id),
      'both the decided and the live ask are marked: ' + tags);
  });

  test('the contract tab’s renderer draws a badge for every ask too', async () => {
    const { win, c, ours, theirs } = await legacyRivals();
    const doc = win.negoDocHtml(c, { side: 'owner' });
    const badges = [...doc.matchAll(/data-badge="([^"]+)"/g)].map(m => m[1].replace(/<[^>]+>/g, ''));
    assert.ok(badges.includes(ours.id), 'our badge is drawn');
    assert.ok(badges.includes(theirs.id), 'and theirs');
  });

  test('the counterparty’s seat reads the same truth', async () => {
    const { win, c, ours, theirs } = await legacyRivals();
    const { panel } = _paper(win, c, { side: 'counterparty', hiddenIds: [] });
    const tags = _panelIds(panel).join(' | ');
    assert.ok(tags.includes(ours.id) && tags.includes(theirs.id),
      'both asks marked from their chair: ' + tags);
  });

  test('one live change per clause draws exactly as before — no visual churn', async () => {
    const s = stage();
    const only = await s.win.negoEditClause(s.c, s.cl, '<p>Forty-five days.</p>',
      { side: 'owner', author: 'Amina Otieno' });
    const { doc, panel } = _paper(s.win, s.c, { side: 'owner' });
    const anchors = [...doc.matchAll(/data-nego-card-anchor="([^"]+)"/g)].map(m => m[1].replace(/<[^>]+>/g, ''));
    assert.deepEqual(anchors, [only.id], 'a single ask keeps a single-id anchor');
    /* The tag is a nested element now (cap + label + glyph), so counting the
       bare class name counts its parts. Anchored on the opening class, which
       only the tag itself carries. */
    assert.equal(_panelIds(panel).length, 1, 'and one ask named in the panel');
  });
});

/* ============================================================ */
describe('f207-C — the guard: no second acceptance silently discards a first', () => {
  test('accepting a rival on an already-adopted clause is refused, in words', async () => {
    const { w, win, c, ours, theirs } = await legacyRivals();
    win.negoResolve(c, ours.id, 'accepted', { side: 'counterparty', by: 'Nordkust Legal' });
    assert.match(plain(win.negoResolvedBody(c)), /forty-five/, 'the first acceptance is in the wording');
    w.log.toasts.length = 0;
    const second = win.negoResolve(c, theirs.id, 'accepted', { side: 'owner', by: 'Amina Otieno' });
    assert.equal(second, null, 'the second acceptance does not apply');
    assert.equal(theirs.status, 'pending', 'and the rival stays undecided');
    assert.match(plain(win.negoResolvedBody(c)), /forty-five/, 'the adopted wording is untouched');
    const said = w.log.toasts.map(t => t.msg).join(' | ');
    assert.ok(said.includes(ours.id), 'the refusal names the adopted change: ' + (said || 'SILENT'));
    assert.match(said, /reopen|reject/i, 'and names the way out');
  });

  test('rejecting stays free — a refusal composes with anything', async () => {
    const { win, c, ours, theirs } = await legacyRivals();
    win.negoResolve(c, ours.id, 'accepted', { side: 'counterparty', by: 'Nordkust Legal' });
    const r = win.negoResolve(c, theirs.id, 'rejected', { side: 'owner', by: 'Amina Otieno', reply: 'Ninety is too long.' });
    assert.ok(r, 'the refusal lands');
    assert.equal(theirs.status, 'rejected');
    assert.match(plain(win.negoResolvedBody(c)), /forty-five/, 'the adopted wording still stands');
  });

  test('reopening the adopted one frees the rival', async () => {
    const { win, c, ours, theirs } = await legacyRivals();
    win.negoResolve(c, ours.id, 'accepted', { side: 'counterparty', by: 'Nordkust Legal' });
    win.negoResolve(c, ours.id, 'pending', { side: 'counterparty', by: 'Nordkust Legal' });
    const now = win.negoResolve(c, theirs.id, 'accepted', { side: 'owner', by: 'Amina Otieno' });
    assert.ok(now, 'with the clause reopened, the rival can be adopted');
    assert.match(plain(win.negoResolvedBody(c)), /ninety/);
  });

  test('sequential cross-round acceptance is NOT caught — that is how negotiation works', async () => {
    const s = stage();
    const r1 = await s.win.negoEditClause(s.c, s.cl, '<p>Forty-five days.</p>',
      { side: 'owner', author: 'Amina Otieno', roundN: 1 });
    s.win.negoResolve(s.c, r1.id, 'accepted', { side: 'counterparty', by: 'Nordkust Legal' });
    /* Their round-2 counter measures the UPDATED clause — sequential layering,
       the market's pattern 1 — and must adopt cleanly over the round-1 result. */
    const r2 = await s.win.negoEditClause(s.c, s.cl, '<p>Sixty days.</p>',
      { side: 'counterparty', author: 'Nordkust Legal', roundN: 2 });
    const ok = s.win.negoResolve(s.c, r2.id, 'accepted', { side: 'owner', by: 'Amina Otieno' });
    assert.ok(ok, 'a different round composes: ' + JSON.stringify({ r1: r1.status, r2: r2.status }));
  });

  test('a superseded change takes no decision at all', async () => {
    const { win, c, ours } = await contested();
    for (const verdict of ['accepted', 'rejected', 'pending'])
      assert.equal(win.negoResolve(c, ours.id, verdict, { side: 'counterparty', by: 'Nordkust' }), null,
        verdict + ' must not land on a change that is off the table');
    assert.equal(ours.status, 'superseded');
  });
});

/* ============================================================ */
describe('f207 — the record survives', () => {
  test('a round close archives the superseded ask beside the decided ones', async () => {
    const { win, c, ours, theirs } = await contested();
    win.negoResolve(c, theirs.id, 'accepted', { side: 'owner', by: 'Amina Otieno' });
    const closed = win.negoAdvanceRound(c, { by: 'Amina Otieno' });
    assert.ok(closed, 'the round closes');
    const archived = c.negotiation.rounds[0].changes.map(x => `${x.id}:${x.status}`);
    assert.ok(archived.includes(`${ours.id}:superseded`),
      'the countered ask is history, not a deletion: ' + archived.join(' · '));
    assert.ok(archived.includes(`${theirs.id}:accepted`));
  });

  test('the share payload strips superseded and carries counterOf', async () => {
    /* The payload projection lives in core.js, which the portal stage loads. */
    const { buildPortal } = require('./portalworld');
    const { win } = buildPortal();
    const c = supplyContract({ redlineText: RICH, format: 'rich' });
    win.negoInit(c);
    const cl = win.negoClauseList(c)[0].clauseId;
    const ours = await win.negoEditClause(c, cl, '<p>Forty-five days.</p>',
      { side: 'owner', author: 'Amina Otieno' });
    const theirs = await win.negoEditClause(c, cl, '<p>Ninety days.</p>',
      { side: 'counterparty', author: 'Nordkust Legal' });
    c.negotiation.turn = 'counterparty';
    c.negotiation.turnAt = '2099-01-01T00:00:00.000Z';
    /* The portal stage has nobody signed in, so the sender is named the way
       the share dialog names one. */
    const payload = win.buildSharePayload(c, 'hash', { sharedBy: 'Amina Otieno' }, { purpose: 'negotiate' });
    const ids = (payload.contract.changes || []).map(x => x.id);
    assert.ok(!ids.includes(ours.id), 'a superseded change never travels');
    const travelled = (payload.contract.changes || []).find(x => x.id === theirs.id);
    assert.ok(travelled, 'the counter travels');
    assert.equal(travelled.counterOf, ours.id,
      'naming the ask it answered — an id the other side already knows');
  });
});
