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
    /* RE-POINTED 14 Sep 2026: the face carries the artifact's verb "Counter"
       on an ask of theirs; what must stay off the card is the LINE that
       explained the supersession (ng_counters_line, .rl-counterline). */
    assert.ok(!/rl-counterline|ng_counters_line/.test(card), 'and carries no counter line');
    assert.ok(!/counter(ed|s|Of| line)/i.test(card.replace(/>Counter</g, '')), 'nor any sentence about what it countered');
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
    /* ---- AND IT NAMES THE CLAUSE, NEVER THE CHG NUMBER (Young, 15 Sep 2026) ----
       REVERSED IN PLACE, and the reason is kept here because it is the useful
       part. Requiring the adopted change's own id in the sentence was right
       while that id LED every row in the change column. Since the column took
       the artifact's shape on 14 Sep the CLAUSE leads and the id rides the
       hover, so this refusal cited a string that appears nowhere on the screen
       it interrupts, about a change the reader cannot pick out of the column.
       Young reported it as "this error makes no sense and it seems it is tied
       back to the old way of how to track changes with the CHG numbers".
       The GUARD is untouched — the second acceptance is still refused and the
       wording still stands; only what the refusal calls the other change has
       moved, to the name every other screen prints. */
    assert.ok(!said.includes(ours.id), 'the refusal no longer cites a CHG number: ' + said);
    const name = win.clauseNameShown ? win.clauseNameShown(String(ours.clauseLabel || '')) : '';
    assert.ok(said.includes(name || 'this clause'),
      'it names the clause instead: ' + (said || 'SILENT'));
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

/* ============================================================
   f207-D — THE LAYERED REDLINE (Young ruled 13 Sep 2026 — "the Large option")

   The 15 Aug rule above treated every filing on a contested clause as a rival.
   Two of the three things a filing can meet are not:

   · WRITTEN ON TOP — a counter measured against THEIR ask (its oldText IS
     their newText; negoMeasuredAlike already tells this apart from a rival).
     It STACKS: their ask is parked (`countered`, `counteredBy`), keeps its
     wording and its fingerprint, travels, and the pair is decided together —
     accepting ours answers theirs, refusing ours puts theirs back as it stood.
   · A WHOLESALE REPLACEMENT written on top — when the marks would outnumber
     the words (redlineWholesale, a comparison of two lengths) the filing is a
     BUNDLE: every live ask on the clause, both sides' and however deep it was
     parked, goes under it at once; accept answers them all, refuse puts every
     one back exactly where it was.
   · A RIVAL — measured against the standing text — still supersedes. The
     playbook pass, Prepare redlines, Copilot's batch and the Word round trip
     all file that way and the brief's own wall is that they keep doing so.

   Every claim marked (parent: red) fails against the commit before this work,
   where `onTop` is unknown to negoEditClause and every filing is a rival.
   ============================================================ */
/* Values built inside the vm carry that realm's prototypes; deepEqual is strict about them. */
const J = x => JSON.parse(JSON.stringify(x === undefined ? null : x));
describe('f207-D — the layered redline: a counter written on their ask stacks', () => {
  const THEIRS = '<p>Payment shall be made within ninety (90) days of invoice.</p>';
  const OURS = '<p>Payment shall be made within sixty (60) days of invoice.</p>';
  async function stacked(){
    const s = stage();
    s.theirs = await s.win.negoEditClause(s.c, s.cl, THEIRS,
      { side: 'counterparty', author: 'Nordkust Legal', via: 'their link' });
    s.theirsHash = s.theirs.hash;
    s.ours = await s.win.negoEditClause(s.c, s.cl, OURS,
      { side: 'owner', author: 'Amina Otieno', onTop: s.theirs.id });
    return s;
  }

  test('(parent: red) written on their ask, ours is measured against THEIR wording and theirs is PARKED, not superseded', async () => {
    const { win, c, theirs, ours, theirsHash, w } = await stacked();
    assert.ok(ours, 'the counter files');
    assert.equal(ours.oldText, theirs.newText, 'measured against their proposal — oldText records it');
    assert.equal(win.negoMeasuredAlike(ours, theirs), false, 'the two are NOT rivals');
    assert.equal(theirs.status, 'countered', 'their ask is parked under ours');
    assert.equal(theirs.counteredBy, ours.id);
    assert.equal(ours.counterOf, theirs.id, 'ours names the ask it stands on');
    assert.deepEqual(J(ours.bundle), [{ id: theirs.id, was: 'pending', counteredBy: null }],
      'and records what it parked, as it stood');
    assert.equal(theirs.supersededBy, undefined, 'nothing superseded');
    assert.equal(theirs.newText, plain(THEIRS), 'their wording is untouched');
    assert.equal(theirs.hash, theirsHash, 'and so is their fingerprint');
    assert.deepEqual(J(win.negoPending(c).map(x => x.id)), [ours.id], 'one question on the table: the counter');
    const line = w.log.audit.map(a => `${a.action}: ${a.detail}`).join('\n');
    assert.match(line, /written on/i, 'the trail says the pair is a stack: ' + line.split('\n').pop());
  });

  test('(control) measured against the standing text, the same filing is a rival and supersedes as it has since 15 Aug', async () => {
    const s = stage();
    const theirs = await s.win.negoEditClause(s.c, s.cl, THEIRS, { side: 'counterparty', author: 'Nordkust Legal' });
    const ours = await s.win.negoEditClause(s.c, s.cl, OURS, { side: 'owner', author: 'Amina Otieno' });
    assert.equal(theirs.status, 'superseded');
    assert.equal(theirs.supersededBy, ours.id);
    assert.equal(ours.bundle, undefined, 'a rival parks nothing');
  });

  test('(control) an `onTop` that names no live ask on the clause measures against the standing text', async () => {
    const s = stage();
    const ours = await s.win.negoEditClause(s.c, s.cl, OURS, { side: 'owner', author: 'Amina Otieno', onTop: 'CHG-999' });
    assert.ok(ours);
    assert.equal(ours.oldText, s.win.negoClauseNowById(s.c, s.cl).text, 'a stale id changes nothing');
    assert.equal(ours.counterOf, undefined);
  });

  test('(parent: red) a parked ask takes no decision of its own — the refusal names the counter to decide', async () => {
    const { win, c, theirs, ours, w } = await stacked();
    for (const verdict of ['accepted', 'rejected', 'pending']){
      w.log.toasts.length = 0;
      assert.equal(win.negoResolve(c, theirs.id, verdict, { side: 'owner', by: 'Amina Otieno' }), null, verdict);
      assert.equal(theirs.status, 'countered', 'still parked after ' + verdict);
      const said = w.log.toasts.map(t => t.msg).join(' | ');
      assert.ok(said.includes(ours.id), 'the refusal names the counter: ' + (said || 'NOTHING SAID'));
    }
  });

  test('(parent: red) THE PAIR RULE — accepting the counter answers the ask underneath', async () => {
    const { win, c, theirs, ours } = await stacked();
    assert.equal(theirs.status, 'countered', 'parked before the decision — the press decides a PAIR');
    const ok = win.negoResolve(c, ours.id, 'accepted', { side: 'counterparty', by: 'Nordkust Legal' });
    assert.ok(ok, 'their side may accept our counter');
    assert.equal(theirs.status, 'superseded', 'the ask under it is answered by that one press');
    assert.equal(theirs.supersededBy, ours.id);
    assert.equal(theirs.counteredBy, undefined, 'and is no longer parked');
    const p = win.negoProgress(c);
    assert.deepEqual(J([p.total, p.done, p.pending]), [1, 1, 0], 'progress counts the question, not the ask beneath it');
    assert.ok(win.negoReadyToSign(c), 'nothing outstanding');
  });

  test('(parent: red) THE PAIR RULE — refusing the counter puts the ask back exactly as it stood; reopening re-parks it', async () => {
    const { win, c, theirs, ours, theirsHash } = await stacked();
    assert.ok(win.negoResolve(c, ours.id, 'rejected', { side: 'counterparty', by: 'Nordkust Legal' }));
    assert.equal(theirs.status, 'pending', 'their ask is live again');
    assert.equal(theirs.counteredBy, undefined);
    assert.equal(theirs.counteredAt, undefined);
    assert.equal(theirs.newText, plain(THEIRS), 'with its wording');
    assert.equal(theirs.hash, theirsHash, 'and its fingerprint');
    assert.deepEqual(J(win.negoPending(c).map(x => x.id)), [theirs.id], 'the table is where it was before the counter');
    /* Reopen the refused counter: the pair is a pair again. */
    assert.ok(win.negoResolve(c, ours.id, 'pending', { side: 'counterparty', by: 'Nordkust Legal' }));
    assert.equal(theirs.status, 'countered');
    assert.equal(theirs.counteredBy, ours.id);
  });

  test('(parent: red) a counter held back from the round — never sent — releases their ask when it is retracted', async () => {
    const { win, c, theirs, ours } = await stacked();
    const gone = win.negoRetractDraft(c, ours.id, { side: 'owner', by: 'Amina Otieno', unsentIds: [ours.id] });
    assert.ok(gone, 'the unsent counter is retracted');
    assert.ok(!c.changes.some(x => x.id === ours.id), 'and is off the record');
    assert.equal(theirs.status, 'pending', 'their ask comes back onto the table');
    assert.equal(theirs.counteredBy, undefined);
  });

  test('(parent: red) THE TRAP — a round cannot close over a parked ask, so a refusal always has something to bring back', async () => {
    const { win, c, theirs, ours } = await stacked();
    assert.equal(win.negoAdvanceRound(c, { by: 'Amina Otieno' }), null, 'the counter is undecided');
    /* The wall itself, with the ordinary gate out of the way: a record where
       something is still parked cannot archive. At the parent this CLOSED and
       the parked ask fell out of the record — neither decided nor superseded,
       it was not archived and c.changes was emptied. */
    ours.status = 'accepted';
    assert.equal(theirs.status, 'countered');
    assert.equal(win.negoAdvanceRound(c, { by: 'Amina Otieno' }), null, 'a parked ask is not history');
    assert.ok(c.changes.some(x => x.id === theirs.id), 'and it is still on the record');
    /* Decided properly, the round closes and the archive carries both. */
    ours.status = 'pending';
    win.negoResolve(c, ours.id, 'accepted', { side: 'counterparty', by: 'Nordkust Legal' });
    const closed = win.negoAdvanceRound(c, { by: 'Amina Otieno' });
    assert.ok(closed, 'the round closes once the pair is decided');
    const archived = closed.changes.map(x => `${x.id}:${x.status}`);
    assert.ok(archived.includes(`${ours.id}:accepted`), archived.join(' · '));
    assert.ok(archived.includes(`${theirs.id}:superseded`), 'the answered ask is history beside it: ' + archived.join(' · '));
  });
});

describe('f207-D — the wholesale replacement is a BUNDLE', () => {
  const X = '<p>Payment shall be made within ninety (90) days of invoice.</p>';
  const R = '<p>Payment shall be made within sixty (60) days of invoice.</p>';
  const Y = '<p>Payment shall be made within seventy-five (75) days of invoice.</p>';
  const Z = '<p>All invoices fall due on the last banking day of the month following delivery, with no set-off of any kind.</p>';
  /* Three rounds of layering on one clause — their ask, our counter on it,
     their counter on ours — then OUR wholesale rewrite on top of the lot. */
  async function layered(){
    const s = stage();
    s.x = await s.win.negoEditClause(s.c, s.cl, X, { side: 'counterparty', author: 'Nordkust Legal' });
    s.r = await s.win.negoEditClause(s.c, s.cl, R, { side: 'owner', author: 'Amina Otieno', onTop: s.x.id });
    s.y = await s.win.negoEditClause(s.c, s.cl, Y, { side: 'counterparty', author: 'Nordkust Legal', onTop: s.r.id });
    s.hashes = { x: s.x.hash, r: s.r.hash, y: s.y.hash };
    return s;
  }
  const shape = s => ({
    x: [s.x.status, s.x.counteredBy || null], r: [s.r.status, s.r.counteredBy || null], y: [s.y.status, s.y.counteredBy || null] });

  test('(parent: red) three layers park one under the next, and the top of the stack is the one live question', async () => {
    const s = await layered();
    assert.deepEqual(shape(s), { x: ['countered', s.r.id], r: ['countered', s.y.id], y: ['pending', null] });
    assert.deepEqual(J(s.win.negoPending(s.c).map(c => c.id)), [s.y.id]);
    assert.equal(s.win.redlineWholesale(s.r.newText, s.y.newText), false, 'a two-word move is layered, not a replacement');
  });

  test('(parent: red) a rewrite whose marks outnumber its words is a REPLACEMENT that parks every live ask, both sides\', however deep', async () => {
    const s = await layered();
    assert.equal(s.win.redlineWholesale(s.y.newText, plain(Z)), true, 'measured: marks > words');
    const z = await s.win.negoEditClause(s.c, s.cl, Z, { side: 'owner', author: 'Amina Otieno', onTop: s.y.id });
    assert.ok(z);
    assert.equal(z.replacement, true);
    assert.equal(z.counterOf, s.y.id, 'it names the ask it was written on');
    assert.deepEqual(shape(s), { x: ['countered', z.id], r: ['countered', z.id], y: ['countered', z.id] }, 'all three parked under it');
    const by = Object.fromEntries((z.bundle || []).map(b => [b.id, [b.was, b.counteredBy]]));
    assert.deepEqual(J(by), { [s.x.id]: ['countered', s.r.id], [s.r.id]: ['countered', s.y.id], [s.y.id]: ['pending', null] },
      'the bundle records where each one stood');
    assert.deepEqual(J(s.win.negoPending(s.c).map(c => c.id)), [z.id]);
    assert.ok(s.c.audit.some(a => /replaces the clause/.test(a.detail || '')), 'said in the trail');
  });

  test('(parent: red) REFUSED — every ask comes back exactly where it was, including the ones that were parked under an earlier counter', async () => {
    const s = await layered();
    const z = await s.win.negoEditClause(s.c, s.cl, Z, { side: 'owner', author: 'Amina Otieno', onTop: s.y.id });
    assert.ok(s.win.negoResolve(s.c, z.id, 'rejected', { side: 'counterparty', by: 'Nordkust Legal' }));
    assert.deepEqual(shape(s), { x: ['countered', s.r.id], r: ['countered', s.y.id], y: ['pending', null] },
      'the stack stands as it did before the rewrite');
    assert.deepEqual(J([s.x.newText, s.r.newText, s.y.newText]), [plain(X), plain(R), plain(Y)], 'wording untouched');
    assert.deepEqual(J([s.x.hash, s.r.hash, s.y.hash]), [s.hashes.x, s.hashes.r, s.hashes.y], 'fingerprints untouched');
    assert.deepEqual(J(s.win.negoPending(s.c).map(c => c.id)), [s.y.id], 'their counter is the live question again');
  });

  test('(parent: red) ACCEPTED — one press answers all of them; REOPENED — they come back under it as they were', async () => {
    const s = await layered();
    const z = await s.win.negoEditClause(s.c, s.cl, Z, { side: 'owner', author: 'Amina Otieno', onTop: s.y.id });
    assert.ok(s.win.negoResolve(s.c, z.id, 'accepted', { side: 'counterparty', by: 'Nordkust Legal' }));
    assert.deepEqual(J([s.x.status, s.r.status, s.y.status]), ['superseded', 'superseded', 'superseded']);
    assert.deepEqual(J([s.x.supersededBy, s.r.supersededBy, s.y.supersededBy]), [z.id, z.id, z.id]);
    assert.equal(s.win.negoProgress(s.c).pending, 0);
    /* The way back is the same press in reverse. */
    assert.ok(s.win.negoResolve(s.c, z.id, 'pending', { side: 'counterparty', by: 'Nordkust Legal' }));
    assert.deepEqual(shape(s), { x: ['countered', s.r.id], r: ['countered', s.y.id], y: ['countered', z.id] },
      'the bundle is parked under the reopened replacement, each under its own counter');
    assert.equal(s.x.supersededBy, undefined);
  });

  test('(parent: red) a replacement cannot cross a round boundary undecided — the round refuses to close, so a later refusal always finds its asks', async () => {
    const s = await layered();
    const z = await s.win.negoEditClause(s.c, s.cl, Z, { side: 'owner', author: 'Amina Otieno', onTop: s.y.id });
    assert.equal(s.win.negoAdvanceRound(s.c, { by: 'Amina Otieno' }), null, 'undecided');
    /* Decided in the next sitting, whatever the calendar says: refusing it
       restores round-one asks that never left the record. */
    assert.ok(s.win.negoResolve(s.c, z.id, 'rejected', { side: 'counterparty', by: 'Nordkust Legal' }));
    assert.equal(s.x.newText, plain(X));
    assert.equal(s.x.status, 'countered');
    assert.equal(s.y.status, 'pending');
  });

  test('(parent: red) our own earlier ask from another round still steps down under a stack (the 15 Aug rule keeps that case)', async () => {
    const s = stage();
    const stale = await s.win.negoEditClause(s.c, s.cl, R, { side: 'owner', author: 'Amina Otieno', roundN: 1 });
    s.c.negotiation.round = 2;
    const theirs = await s.win.negoEditClause(s.c, s.cl, X, { side: 'counterparty', author: 'Nordkust Legal' });
    /* Their round-two ask is a rival to our stale one and supersedes it (the control half). */
    assert.equal(stale.status, 'superseded');
    const ours = await s.win.negoEditClause(s.c, s.cl, '<p>Payment shall be made within eighty (80) days of invoice.</p>',
      { side: 'owner', author: 'Amina Otieno', onTop: theirs.id });
    assert.equal(theirs.status, 'countered', 'a counter written on theirs stacks');
    assert.equal(ours.counterOf, theirs.id);
  });
});

describe('f207-D — the stack travels, arrives as a stack, and is drawn as two layers', () => {
  const THEIRS = '<p>Payment shall be made within ninety (90) days of invoice.</p>';
  const OURS = '<p>Payment shall be made within sixty (60) days of invoice.</p>';

  test('(parent: red) the share payload carries the parked ask AND the counter, with what parks what', async () => {
    const { buildPortal } = require('./portalworld');
    const { win } = buildPortal();
    const c = supplyContract({ redlineText: RICH, format: 'rich' });
    win.negoInit(c);
    const cl = win.negoClauseList(c)[0].clauseId;
    const theirs = await win.negoEditClause(c, cl, THEIRS, { side: 'counterparty', author: 'Nordkust Legal' });
    const ours = await win.negoEditClause(c, cl, OURS, { side: 'owner', author: 'Amina Otieno', onTop: theirs.id });
    c.negotiation.turn = 'counterparty';
    c.negotiation.turnAt = '2099-01-01T00:00:00.000Z';
    const payload = win.buildSharePayload(c, 'hash', { sharedBy: 'Amina Otieno' }, { purpose: 'negotiate' });
    const chs = payload.contract.changes || [];
    const t = chs.find(x => x.id === theirs.id), o = chs.find(x => x.id === ours.id);
    assert.ok(t, 'the parked ask travels — the other side must see their own marks under ours');
    assert.equal(t.status, 'countered');
    assert.equal(t.counteredBy, ours.id);
    assert.ok(o, 'the counter travels');
    assert.equal(o.counterOf, theirs.id);
    assert.deepEqual(J(o.bundle), [{ id: theirs.id, was: 'pending', counteredBy: null }]);
    assert.equal(o.replacement, undefined, 'a layered counter is not a replacement');
  });

  test('(parent: red) a replacement travels with its bundle and its flag', async () => {
    const { buildPortal } = require('./portalworld');
    const { win } = buildPortal();
    const c = supplyContract({ redlineText: RICH, format: 'rich' });
    win.negoInit(c);
    const cl = win.negoClauseList(c)[0].clauseId;
    const theirs = await win.negoEditClause(c, cl, THEIRS, { side: 'counterparty', author: 'Nordkust Legal' });
    const ours = await win.negoEditClause(c, cl,
      '<p>All invoices fall due on the last banking day of the month following delivery, with no set-off of any kind.</p>',
      { side: 'owner', author: 'Amina Otieno', onTop: theirs.id });
    assert.equal(ours.replacement, true);
    c.negotiation.turn = 'counterparty'; c.negotiation.turnAt = '2099-01-01T00:00:00.000Z';
    const payload = win.buildSharePayload(c, 'hash', { sharedBy: 'Amina Otieno' }, { purpose: 'negotiate' });
    const o = (payload.contract.changes || []).find(x => x.id === ours.id);
    assert.equal(o.replacement, true);
    assert.equal(o.bundle.length, 1);
  });

  test('(parent: red) a counter ARRIVING measured on our ask stacks on arrival instead of superseding it', async () => {
    const { buildPortal } = require('./portalworld');
    const { win } = buildPortal();
    win.persist = () => {}; win.saveContract = () => {};
    const c = supplyContract({ redlineText: RICH, format: 'rich' });
    win.negoInit(c);
    const cl = win.negoClauseList(c)[0].clauseId;
    const ours = await win.negoEditClause(c, cl, OURS, { side: 'owner', author: 'Amina Otieno' });
    /* What their page sends back: measured against OUR wording, as their own
       editor was seeded from it. */
    const filed = await win.applyNegoProposals(c, { negoProposed: [{
      id: 'CHG-777', clauseId: cl, changeType: 'modify',
      oldText: ours.newText, newText: plain(THEIRS), clauseLabel: ours.clauseLabel }] }, 'Nordkust Legal');
    assert.equal(filed.length, 1, 'their counter files');
    const theirs = win.negoChangeById(c, filed[0]);
    assert.equal(theirs.oldText, ours.newText, 'measured against what they really wrote on');
    assert.equal(ours.status, 'countered', 'our ask is parked under their counter, not superseded');
    assert.equal(ours.counteredBy, theirs.id);
    assert.equal(theirs.counterOf, ours.id);
  });

  test('(parent: red) the paper leads with the top of the stack and draws both layers in their authors\' colours, seats reversed on their page', async () => {
    const s = stage();
    const theirs = await s.win.negoEditClause(s.c, s.cl, THEIRS, { side: 'counterparty', author: 'Nordkust Legal' });
    const ours = await s.win.negoEditClause(s.c, s.cl, OURS, { side: 'owner', author: 'Amina Otieno', onTop: theirs.id });
    const cl = s.win.negoClauseList(s.c)[0];
    assert.equal(s.win.negoLeadChange(s.c, cl, [theirs, ours]), ours, 'the counter leads');
    assert.equal(s.win.negoLeadChange(s.c, cl, [ours, theirs]), ours, 'whatever the order handed in');
    /* Our seat: their marks amber (them), ours accent (us). */
    const mine = s.win.redlineDocHtml(s.c, { side: 'owner' });
    const clause = mine.split('data-clause-id=').find(x => x.includes(s.cl)) || mine;
    assert.match(clause, /class="[^"]*\brl-them\b/, 'their layer is drawn');
    assert.match(clause, /class="[^"]*\brl-us\b/, 'and ours');
    assert.match(clause, /ninety/, 'their words are still on the paper');
    assert.match(clause, /sixty/, 'beside ours');
    /* Their seat, once the round has gone over (an unsent counter is walled
       off their preview): the same picture with the colours swapped — their
       own ask is "us". */
    s.c.negotiation.turn = 'counterparty'; s.c.negotiation.turnAt = '2099-01-01T00:00:00.000Z';
    const yours = s.win.redlineDocHtml(s.c, { side: 'counterparty' });
    const ins = [...yours.matchAll(/<ins class="([^"]*)"[^>]*>([^<]*)/g)].map(m => [m[1], m[2]]);
    const sixty = ins.find(x => /sixty/.test(x[1]));
    assert.ok(sixty && /\brl-them\b/.test(sixty[0]), 'from their chair OUR insertion is the other side\'s: ' + JSON.stringify(ins));
    /* The contract tab's own canvas is the second renderer, and it agrees. */
    const room = s.win.negoDocHtml(s.c, {});
    assert.match(room, /\brl-them\b/, 'the room draws their layer'); assert.match(room, /\brl-us\b/, 'and ours');
    assert.match(room, /ninety[\s\S]*sixty/, 'both wordings, theirs under ours');
  });

  test('(parent: red) a replacement draws as one struck block, one inserted block and the line saying what it stands on', async () => {
    const s = stage();
    const theirs = await s.win.negoEditClause(s.c, s.cl, THEIRS, { side: 'counterparty', author: 'Nordkust Legal' });
    const ours = await s.win.negoEditClause(s.c, s.cl,
      '<p>All invoices fall due on the last banking day of the month following delivery, with no set-off of any kind.</p>',
      { side: 'owner', author: 'Amina Otieno', onTop: theirs.id });
    assert.equal(ours.replacement, true);
    const doc = s.win.redlineDocHtml(s.c, { side: 'owner' });
    assert.match(doc, /class="rl-repl"/, 'the replacement block');
    assert.match(doc, /rl-repl-on/, 'the stands line');
    assert.ok(doc.includes('#' + theirs.id), 'naming what it stands on');
    /* The struck block carries their whole wording, the inserted block ours. */
    assert.match(doc, /<del[^>]*>[^<]*ninety \(90\) days[^<]*<\/del>/);
    assert.match(doc, /<ins[^>]*>[^<]*last banking day[^<]*<\/ins>/);
  });

  test('(parent: red) the card column: a parked ask sits in its counter\'s pile and offers no Accept or Reject', async () => {
    const s = stage();
    const theirs = await s.win.negoEditClause(s.c, s.cl, THEIRS, { side: 'counterparty', author: 'Nordkust Legal' });
    const ours = await s.win.negoEditClause(s.c, s.cl, OURS, { side: 'owner', author: 'Amina Otieno', onTop: theirs.id });
    assert.equal(s.win.rlCardBand(theirs, 'owner', new Set(), null, s.c), s.win.rlCardBand(ours, 'owner', new Set(), null, s.c),
      'the pair sits together');
    const cards = s.win.redlineChangeCardsHtml(s.c, { side: 'owner', canAct: true });
    /* RE-POINTED 14 Sep 2026 (the artifact's column): on our seat the parked
       ask FOLDS under its counter's row — one row per argument, carrying the
       whole track and the ladder — so it is not drawn as a row of its own and
       takes no decision by construction. Their seat, below, still draws it. */
    const card = cards.split('data-nego-card=').find(x => x.includes('"' + theirs.id + '"')) || '';
    assert.equal(card, '', 'the parked ask is folded under its counter, not a second row');
    const counter = cards.split('data-nego-card=').find(x => x.includes('"' + ours.id + '"')) || '';
    assert.ok(counter, 'the counter\'s row is on the column');
    /* Their seat, once sent: our counter is the live question and carries the verbs; their parked ask does not. */
    s.c.negotiation.turn = 'counterparty'; s.c.negotiation.turnAt = '2099-01-01T00:00:00.000Z';
    const theirCards = s.win.redlineChangeCardsHtml(s.c, { side: 'counterparty', canAct: true });
    const oursThere = theirCards.split('data-nego-card=').find(x => x.includes(ours.id)) || '';
    assert.match(oursThere, /data-nego-accept/, 'they may accept our counter');
    /* And on THEIR seat the same fold: their parked ask sits under our
       counter's row rather than as a row of its own (14 Sep 2026). */
    const theirsThere = theirCards.split('data-nego-card=').find(x => x.includes('"' + theirs.id + '"')) || '';
    assert.equal(theirsThere, '', 'their parked ask folds under our counter on their seat too');
  });
});
