/* ============================================================
   f144 — the history link: the record travels, the contract does not
   ============================================================
   A fourth purpose beside negotiate, sign and view, and it answers a different
   question from the other three. Those are things somebody does TO A CONTRACT.
   This one says what is travelling at all: the agreement, or the record of the
   argument about it.

   THREE CLAIMS.

   1. THE RECORD ARRIVES. Every fingerprinted change, who asked, when, in which
      round, what was decided — and the wording fragments, because a redline
      history with the redlines taken out is a list of dates. This is the same
      screen the counterparty already reads, served to somebody with no account.

   2. THE CONTRACT DOES NOT. "Share only the history" has to mean the agreement
      does not travel, or it is a contract link wearing a different name. The
      fixture below plants a distinctive sentence in the document body and
      another in an uploaded file, and asserts neither string appears anywhere
      in the serialised response. Not "the field is absent": the text is absent.

   3. THE LOCK IS ON THE SERVER. A history link is a read-only pass and every
      mutating route must refuse it, for the reason f108 states about view
      links: hiding a button is a courtesy, not a rule. The guard is shared
      (shareIsReadOnly → refuseIfViewOnly) so the route this has to survive is
      the one added next year by somebody who never read the comment.

   Internal material is checked the same way f108 checks it, because the
   allow-list is the only thing standing between an outside reader and the
   things a workspace says to itself. */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startHati, seedWorkspace } = require('./helpers');

/* Planted in the fixture, so every "this is absent" assertion is a real one. */
const SECRETS = {
  body: 'DOCUMENT-BODY-the-whole-agreement-in-one-sentence',
  upload: 'UPLOADED-FILE-TEXT-scanned-original',
  baseline: 'ROUND-BASELINE-wording-as-it-stood-at-round-one',
  ourNote: 'OUR-NOTE-do-not-concede-this-one',
  /* Deliberately NOT the sharer's name. `sharedBy` travels on purpose — the
     header says who sent the link — so a resolver called the same thing would
     make this suite report a leak that is really a signature. */
  resolver: 'RULED-BY-Amina-Otieno-internal-only',
  thread: 'INTERNAL-THREAD-legal-says-push-back-twice',
  comment: 'INTERNAL-COMMENT-our-fallback-is-45-days',
  audit: 'INTERNAL-AUDIT-approved-below-floor',
};
/* What the record IS, and must survive the reduction. */
const KEEP = {
  theirWording: 'sixty (60) days',
  theirNote: 'THEIR-NOTE-our-AP-cycle-runs-monthly',
  clause: 'Article 1 Payment',
};

function contractWithEverything(){
  return {
    id: 'MK-H1', name: 'Warehousing Services Agreement', counterparty: 'Brut Africa Ltd',
    folder: 'proc', value: 4200000, valueType: 'standard', template: 'WH',
    status: 'Under Review', format: 'text',
    redlineText: `Article 1 Payment\n\n${SECRETS.body}`,
    upload: { fileName: 'original.pdf', extractedText: SECRETS.upload },
    fields: {}, metadata: {}, signatures: [], obligations: [], versions: [],
    comments: [{ id: 'CM-1', by: 'Wanjiru Kamau', at: '2026-07-01T09:00:00.000Z',
      body: SECRETS.comment, internal: true }],
    audit: [{ at: '2026-07-01T09:00:00.000Z', user: 'Wanjiru Kamau',
      action: 'Approved', detail: SECRETS.audit }],
    rounds: [],
    negotiation: { round: 2, baselineText: SECRETS.baseline,
      rounds: [{ n: 1, at: '2026-07-02T09:00:00.000Z', baselineText: SECRETS.baseline,
        baselineBody: SECRETS.baseline, changeIds: ['CHG-001'] }] },
    changes: [
      {
        id: 'CHG-001', clauseId: 'cl-1', clauseLabel: KEEP.clause,
        changeType: 'modify', status: 'accepted', summary: 'Payment terms extended',
        oldText: 'Payable within thirty (30) days.',
        newText: `Payable within ${KEEP.theirWording}.`,
        ops: [{ op: 'del', text: 'thirty (30)' }, { op: 'ins', text: 'sixty (60)' }],
        author: 'Moses Kurua', authorSide: 'counterparty',
        createdAt: '2026-07-03T09:00:00.000Z', resolvedAt: '2026-07-04T09:00:00.000Z',
        /* Theirs: it travels, they wrote it. */
        note: KEEP.theirNote,
        /* Ours, on every axis: it does not. */
        resolvedBy: SECRETS.resolver,
        needsReview: true, needsReviewWhy: SECRETS.ourNote,
        thread: [{ by: 'Wanjiru Kamau', body: SECRETS.thread, internal: true }],
      },
      {
        id: 'CHG-002', clauseId: 'cl-2', clauseLabel: 'Article 4 Liability',
        changeType: 'modify', status: 'pending', summary: 'Cap reduced',
        oldText: 'Unlimited.', newText: 'Capped at the fees paid.',
        ops: [{ op: 'ins', text: 'Capped at the fees paid.' }],
        author: 'Wanjiru Kamau', authorSide: 'owner',
        createdAt: '2026-07-05T09:00:00.000Z',
        /* An OWNER-side note. The counterparty's own words come back to them;
           ours do not go out. */
        note: SECRETS.ourNote,
      },
    ],
  };
}

describe('f144 — the history link', () => {
  let h, W, histToken, negoToken;

  before(async () => {
    h = await startHati();
    W = await seedWorkspace(h);
    const c = contractWithEverything();
    await W.admin.json('/api/contracts/MK-H1', { method: 'PUT', body: { contract: c, baseVersion: 0 } });
    const mk = async purpose => {
      const r = await W.admin.json('/api/shares', { method: 'POST', body: {
        payload: { kind: 'hati-share', purpose, org: 'Highland Corporate Ltd',
          sharedBy: 'Wanjiru Kamau', contract: c },
        recipient: { name: 'Outside Advisor', email: 'advisor@example.co.ke' },
        channel: 'link', purpose } });
      return r.token || (r.link || '').split('share=')[1];
    };
    negoToken = await mk('negotiate');
    histToken = await mk('history');
  });
  after(async () => { await h.stop(); });

  /* ---------- 1. the record arrives ---------- */
  describe('the record arrives', () => {
    test('a history token fetches a history payload, and says so on the envelope', async () => {
      const r = await h.client('anon').json('/api/shares/' + histToken);
      assert.equal(r.purpose, 'history');
      assert.equal(r.historyOnly, true);
      assert.equal(r.payload.purpose, 'history');
      assert.equal(r.payload.contract.id, 'MK-H1');
    });

    test('every change is on it, with the clause and the outcome', async () => {
      const r = await h.client('anon').json('/api/shares/' + histToken);
      const ch = r.payload.contract.changes;
      assert.equal(ch.length, 2, 'the record is the whole record');
      assert.equal(ch[0].id, 'CHG-001');
      assert.equal(ch[0].clauseLabel, KEEP.clause);
      assert.equal(ch[0].status, 'accepted');
      assert.equal(ch[1].status, 'pending', 'what is still open is part of the story');
    });

    test('the wording fragments travel — a redline history needs its redlines', async () => {
      const r = await h.client('anon').json('/api/shares/' + histToken);
      const ch = r.payload.contract.changes[0];
      assert.ok(Array.isArray(ch.ops) && ch.ops.length, 'the marks are what the timeline paints');
      assert.match(ch.newText, /sixty \(60\) days/);
    });

    test('their own reason comes back to them; ours does not go out', async () => {
      const r = await h.client('anon').json('/api/shares/' + histToken);
      const [theirs, ours] = r.payload.contract.changes;
      assert.equal(theirs.note, KEEP.theirNote, 'they wrote it — it is theirs to read');
      assert.equal(ours.note, null, 'and a note written on our side of the table stays there');
    });

    test('who sent it travels, on purpose — a record from nobody is not evidence', async () => {
      const r = await h.client('anon').json('/api/shares/' + histToken);
      assert.equal(r.payload.sharedBy, 'Wanjiru Kamau');
      assert.equal(r.payload.org, 'Highland Corporate Ltd');
    });

    test('the round shape travels so the timeline can say a round closed', async () => {
      const r = await h.client('anon').json('/api/shares/' + histToken);
      const rounds = r.payload.contract.negotiation.rounds;
      assert.ok(Array.isArray(rounds) && rounds.length === 1);
      assert.equal(rounds[0].n, 1);
      assert.ok(rounds[0].at, 'when it closed is the whole point of the entry');
    });
  });

  /* ---------- 2. the contract does not ---------- */
  describe('the agreement itself does not travel', () => {
    test('not one document string appears anywhere in the response', async () => {
      const r = await h.client('anon').raw('/api/shares/' + histToken);
      for (const what of ['body', 'upload', 'baseline'])
        assert.ok(!r.text.includes(SECRETS[what]),
          `the ${what} reached a history link — "only the history" has to mean it`);
    });

    test('the document carriers are absent as fields too', async () => {
      const r = await h.client('anon').json('/api/shares/' + histToken);
      const c = r.payload.contract;
      for (const k of ['redlineText', 'body', 'upload', 'templateForm', 'fields', 'value'])
        assert.equal(c[k], undefined, `${k} has no business on a history link`);
      assert.equal(c.negotiation.rounds[0].baselineText, undefined,
        'a round baseline is the document wearing a round number');
    });

    test('the negotiate link on the same contract still carries it — this is the link, not the record', async () => {
      const r = await h.client('anon').raw('/api/shares/' + negoToken);
      assert.ok(r.text.includes(SECRETS.body),
        'control: the document travels where it is supposed to, so its absence above means something');
    });
  });

  /* ---------- 3. nothing internal travels ---------- */
  describe('nothing internal reaches the reader', () => {
    test('not one internal string appears anywhere in the response', async () => {
      const r = await h.client('anon').raw('/api/shares/' + histToken);
      for (const what of ['ourNote', 'resolver', 'thread', 'comment', 'audit'])
        assert.ok(!r.text.includes(SECRETS[what]),
          `the ${what} reached an outside reader — this is the allow-list failing`);
    });

    test('the internal carriers are absent as fields too', async () => {
      const r = await h.client('anon').json('/api/shares/' + histToken);
      const c = r.payload.contract;
      assert.equal(c.comments, undefined);
      assert.equal(c.audit, undefined);
      for (const ch of c.changes){
        assert.equal(ch.resolvedBy, undefined, 'the organisation speaks, not the person who ruled');
        assert.equal(ch.thread, undefined);
        assert.equal(ch.needsReviewWhy, undefined);
      }
    });
  });

  /* ---------- 4. it can do nothing ---------- */
  describe('a history token cannot act', () => {
    /* The same enumeration f108 runs for view tokens. When a fifth mutating
       route is added and forgets the guard, this fails rather than shipping. */
    const ROUTES = [
      ['respond', 'POST', { kind: 'hati-response', id: 'MK-H1', name: 'Outside Advisor',
        action: 'decisions', negoDecisions: [{ id: 'CHG-001', status: 'accepted' }] }],
      ['messages', 'POST', { author: 'Outside Advisor', topic: 'general', body: 'hello' }],
      ['otp', 'POST', { email: 'advisor@example.co.ke' }],
    ];
    for (const [path, method, body] of ROUTES){
      test(`${method} /${path} is refused`, async () => {
        const r = await h.client('anon').raw(`/api/shares/${histToken}/${path}`, { method, body });
        assert.equal(r.status, 403, `${path} accepted a history token — the record is not a channel`);
        assert.match(String(r.text), /history link/i, 'and it says which kind of link it is');
      });
    }

    test('the same routes still work on the negotiate link — the refusal is the purpose, not the fixture', async () => {
      const r = await h.client('anon').raw(`/api/shares/${negoToken}/messages`, { method: 'POST',
        body: { author: 'Moses Kurua', topic: 'general', body: 'control message' } });
      assert.ok(r.status < 400, 'control: a negotiate link accepts what a history link refuses');
    });
  });
});

/* ============================================================
   The page a history link actually opens
   ============================================================
   The server proves what travels; this proves what a reader sees. It is the
   product's own timeline component (negoTimelineScreenHtml), mounted as the
   whole page rather than as a modal over an empty one — so there is a single
   history in this product rather than a second one written for outsiders,
   which is the copy that would drift.

   Driven through renderSharePortal rather than by calling renderShareHistory
   directly: the routing is half the claim. A history payload is marked
   viewOnly as well, and the view branch would happily render a contract
   screen for a payload that deliberately has no contract in it. */
const { buildPortal } = require('./portalworld');

describe('f144 — the page a history link opens', () => {
  function historyPage(){
    const p = buildPortal();
    const saved = [];
    p.win.downloadFile = (name, content, mime) => saved.push({ name, content, mime });
    /* The shape historyPayload returns: no redlineText, no upload, no fields. */
    const payload = { v: 1, kind: 'hati-share', purpose: 'history', historyOnly: true,
      viewOnly: true, org: 'Highland Corporate Ltd', sharedBy: 'Wanjiru Kamau',
      at: '2026-08-01T09:00:00.000Z',
      contract: { id: 'MK-H1', name: 'Warehousing Services Agreement',
        counterparty: 'Brut Africa Ltd',
        changes: [{ id: 'CHG-001', clauseId: 'cl-1', clauseLabel: 'Article 1 Payment',
          changeType: 'modify', status: 'accepted', summary: 'Payment terms extended',
          newText: 'Payable within sixty (60) days.',
          ops: [{ op: 'del', text: 'thirty (30)' }, { op: 'ins', text: 'sixty (60)' }],
          author: 'Moses Kurua', authorSide: 'counterparty',
          createdAt: '2026-07-03T09:00:00.000Z', resolvedAt: '2026-07-04T09:00:00.000Z',
          note: 'THEIR-NOTE-our-AP-cycle-runs-monthly' }],
        negotiation: { round: 2, rounds: [{ n: 1, at: '2026-07-02T09:00:00.000Z', changeIds: ['CHG-001'] }] } } };
    p.win.renderSharePortal(payload, { token: 't', historyOnly: true, purpose: 'history',
      share: { recipientName: 'Outside Advisor', expiresAt: '2026-09-01' } });
    const d = p.win.document;
    return { p, win: p.win, d, saved, html: () => d.body.innerHTML };
  }

  test('it routes to the history screen, not the viewer and not the workbench', () => {
    const { d } = historyPage();
    assert.ok(d.getElementById('history-timeline'), 'the timeline is the page');
    assert.ok(!d.getElementById('pt-nego'), 'the negotiation room is never built');
    assert.ok(!d.getElementById('pt-doc'), 'and neither is a document surface');
  });

  test('the record is on it — the change, its clause and its redline', () => {
    const { html } = historyPage();
    const h = html();
    assert.match(h, /Negotiation history/);
    assert.match(h, /Article 1 Payment/);
    assert.match(h, /Moses Kurua/, 'who asked is part of the record');
    assert.match(h, /sixty \(60\)/, 'and so is what they asked for');
  });

  test('it says what the link is before the reader hunts for the contract', () => {
    const { html } = historyPage();
    assert.match(html(), /The record, not the contract/);
  });

  test('there is nothing on the page to answer with', () => {
    const { d } = historyPage();
    for (const id of ['pt-nego-send', 'pt-sign', 'pt-accept', 'pt-decline', 'pt-changes'])
      assert.ok(!d.getElementById(id), `#${id} has no business on a history link`);
  });

  test('the reader can check the record has not been altered', () => {
    const { d } = historyPage();
    assert.ok(d.getElementById('ht-verify'), 'a record nobody can verify is a claim, not evidence');
    assert.ok(d.getElementById('ht-export'), 'and they can keep a copy');
  });

  test('the filters narrow the record in place', () => {
    const { d, win } = historyPage();
    const sel = d.getElementById('ht-f-outcome');
    assert.ok(sel, 'the filters travel with the screen');
    sel.value = 'rejected';
    sel.dispatchEvent(new win.Event('change', { bubbles: true }));
    const list = d.getElementById('ht-list');
    assert.match(list.textContent, /Nothing matches these filters/,
      'nothing was rejected, so the filtered record says so rather than lying');
    assert.ok(d.getElementById('history-timeline'), 'and the page is still the page');
  });
});
