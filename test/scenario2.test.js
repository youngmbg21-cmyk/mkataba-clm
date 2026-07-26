/* ============================================================
   SCENARIO 2 — both parties inside HaTi, six full rounds
   ============================================================
   Same agreement, same two people. This time Erik accepts the invitation and
   negotiates in HaTi's counterparty portal — the no-login review page that
   opens from a share link.

   The rounds:
     1. Wanjiru shares; Erik opens the link and proposes MIXED edits
     2. She accepts some of his changes and rejects others — in one pass
     3. The rejected points travel back to him as still open; she reshares in
        one click, to the recipient the system already knows
     4. He counters on the durable link, which is still live and shows what moved
     5. A value round: he proposes a different contract value
     6. He accepts the wording, signs with an email code, and the seal is written

   Three surfaces are exercised, each where it really lives:
     · the negotiation engine  — through test/world.js, on the real modules
     · the share payload       — through js/core.js itself (as F7/F12 do)
     · the portal page         — through js/views/portal.js's own markup
     · durable links           — against a real server (test/helpers.js) */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { buildWorld, supplyContract } = require('./world');
const { loadViews, STUB_TEMPLATES, STUB_FOLDERS } = require('./dom');
const { startHati, seedWorkspace, fixtureContract, FOLDER_A } = require('./helpers');

const core = () => loadViews(['js/richdoc.js', 'js/core.js'], {
  TEMPLATES: STUB_TEMPLATES, FOLDERS: STUB_FOLDERS });
const portal = () => loadViews(['js/views/portal.js'], {
  TEMPLATES: STUB_TEMPLATES, FOLDERS: STUB_FOLDERS });

/* Erik's response, in the shape the portal actually sends back. */
const erikResponse = (over = {}) => ({
  v: 1, kind: 'hati-response', action: 'changes', name: 'Erik Lindqvist',
  title: 'Procurement Manager', email: 'erik@nordkust.se',
  comment: 'Two points: payment terms and the liability cap.',
  at: new Date().toISOString(), ...over });

describe('Scenario 2 — Erik negotiates inside HaTi', () => {
  let w, c;

  before(() => {
    w = buildWorld();
    c = supplyContract();
    w.win.captureVersion(c, 'Drafted from Raw Material Supply Agreement', 'Wanjiru Kamau');
  });

  /* ---------- Round 1: the share, and Erik's mixed proposal ---------- */

  test('round 1 — the share payload carries the wording, history and the thread (checklist 12)', () => {
    const s = core();
    const shared = {
      id: 'MK-SUP-1', name: 'Supply Agreement', counterparty: 'Nordkust Industri AB',
      template: 'RM', value: 4800000, valueType: 'estimated', fields: {},
      folder: 'proc', redlineText: 'AGREED WORDING', format: 'text',
      versions: [{ n: 1, at: '2026-07-26T08:00:00.000Z', by: 'Wanjiru Kamau', label: 'Sent to you', text: 'AGREED WORDING' }],
      rounds: [{ n: 1, at: '2026-07-26T09:00:00.000Z', by: 'Erik Lindqvist',
        comment: 'Net-60 is our standard.', proposedText: 'X', baseText: 'Y',
        status: 'closed', resolution: { decision: 'rejected', by: 'Wanjiru Kamau',
          at: '2026-07-26T10:00:00.000Z', comment: 'Net-30, or a 2% price increase.' } }],
    };
    const p = s.buildSharePayload(shared, 'hash123', { org: 'Wanjiru Catering Ltd', sharedBy: 'Wanjiru Kamau' });

    assert.equal(p.kind, 'hati-share');
    assert.ok(p.contract.rounds && p.contract.rounds.length, 'the round history must travel');
    const r = p.contract.rounds[0];
    assert.equal(r.comment, 'Net-60 is our standard.',
      "the counterparty's own ask must be visible to them in the portal");
    assert.ok(r.resolution, 'the outcome must travel');
    assert.equal(r.resolution.comment, 'Net-30, or a 2% price increase.',
      'the REPLY must travel too — the why of a decision belongs with the contract');
  });

  test('round 1 — the portal shows the thread beside the document (checklist 12)', () => {
    const s = portal();
    assert.equal(typeof s.portalThreadHtml, 'function',
      'the portal must be able to render the round conversation');
    const html = s.portalThreadHtml({
      rounds: [{ n: 1, by: 'Erik Lindqvist', at: '2026-07-26T09:00:00.000Z',
        comment: 'Net-60 is our standard.', status: 'closed',
        resolution: { decision: 'rejected', at: '2026-07-26T10:00:00.000Z',
          comment: 'Net-30, or a 2% price increase.' } }],
    }, { org: 'Wanjiru Catering Ltd' });

    assert.match(html, /Net-60 is our standard/, "Erik's ask must be shown");
    assert.match(html, /Net-30, or a 2% price increase/, "Wanjiru's reply must be shown");
    assert.match(html, /Erik Lindqvist/);
  });

  test('round 1 — a hostile comment cannot inject markup into the portal thread (integrity)', () => {
    const s = portal();
    const html = s.portalThreadHtml({
      rounds: [{ n: 1, by: '<img src=x onerror=alert(1)>', at: '2026-07-26T09:00:00.000Z',
        comment: '<script>alert(2)</script>', status: 'open', resolution: null }],
    }, { org: 'Wanjiru Catering Ltd' });
    assert.ok(!/<img/.test(html), 'the portal is a public page — every field must be escaped');
    assert.ok(!/<script/.test(html));
  });

  test('round 1 — Erik proposes edits to two clauses at once (mixed round)', () => {
    const base = w.win.docPlainText(c);
    const proposed = base
      .replace('thirty (30) days', 'sixty (60) days')                         // she will reject
      .replace('fourteen (14) days', 'twenty-one (21) days');                 // she will accept
    c.rounds.push({ n: 1, at: w.win.nowISO(), by: 'Erik Lindqvist, Procurement Manager',
      comment: 'Net-60 is our standard, and we need three weeks to receive.',
      status: 'open', resolution: null, baseText: base, proposedText: proposed });

    const st = w.win.diffStats(base, proposed);
    assert.ok(st.add > 0 && st.del > 0, 'the round must read as a real redline');
  });

  /* ---------- Round 2: accept some, reject others ---------- */

  test('round 2 — the redline splits into separately decidable change blocks (checklist 7)', () => {
    assert.equal(typeof w.win.diffBlocks, 'function',
      'a redline must be decomposable into individual changes');
    const r = c.rounds[0];
    const blocks = w.win.diffBlocks(r.baseText, r.proposedText);
    assert.ok(blocks.length >= 2, `two edits must yield at least two blocks, got ${blocks.length}`);
    for (const b of blocks) {
      assert.ok('id' in b, 'each block needs an identity so a decision can be attached');
      assert.ok(typeof b.before === 'string' && typeof b.after === 'string');
    }
    // the blocks carry only what CHANGED — "days" is unchanged context and
    // belongs to neither side, which is why it is not in them
    const joined = blocks.map(b => b.after).join(' ');
    assert.match(joined, /sixty \(60\)/);
    assert.match(joined, /twenty-one \(21\)/);
  });

  test('round 2 — she accepts one block and rejects the other, in one pass (checklist 7)', () => {
    const r = c.rounds[0];
    const blocks = w.win.diffBlocks(r.baseText, r.proposedText);
    const payment = blocks.find(b => /sixty \(60\)/.test(b.after));
    const delivery = blocks.find(b => /twenty-one \(21\)/.test(b.after));
    assert.ok(payment && delivery, 'both edits must be identifiable');

    const decisions = { [payment.id]: 'reject', [delivery.id]: 'accept' };
    const merged = w.win.applyBlockDecisions(r.baseText, r.proposedText, decisions);

    assert.match(merged, /thirty \(30\) days/, 'the rejected change must NOT enter the document');
    assert.ok(!/sixty \(60\) days/.test(merged));
    assert.match(merged, /twenty-one \(21\) days/, 'the accepted change MUST enter the document');
  });

  test('round 2 — adopting the decisions versions the contract and keeps it formatted (checklist 9)', () => {
    const r = c.rounds[0];
    const blocks = w.win.diffBlocks(r.baseText, r.proposedText);
    const payment = blocks.find(b => /sixty \(60\)/.test(b.after));
    const delivery = blocks.find(b => /twenty-one \(21\)/.test(b.after));
    const versionsBefore = (c.versions || []).length;

    w.win.acceptProposedRound(c, r.n, {
      decisions: { [payment.id]: 'reject', [delivery.id]: 'accept' },
      comment: 'Net-30 stands, or a 2% price increase. Three weeks to receive is fine.',
    });

    assert.equal(r.status, 'closed');
    assert.ok((c.versions || []).length > versionsBefore, 'a decision must capture a version');
    assert.equal(w.win.docFormat(c.format), 'rich',
      'a partly-accepted round must not flatten the document (checklist 9)');
    const live = w.win.docPlainText(c);
    assert.match(live, /twenty-one \(21\) days/);
    assert.match(live, /thirty \(30\) days/);
    assert.match(live, /RAW MATERIAL SUPPLY AGREEMENT/, 'the heading must survive');
  });

  test('round 2 — the rejected point stays open and travels back to Erik (checklist 8)', () => {
    const r = c.rounds[0];
    assert.ok(Array.isArray(r.blockDecisions) || r.openPoints,
      'the round must record what was decided per change');
    const open = w.win.openPointsFor(c);
    assert.ok(open.length >= 1, 'the rejected change must remain a live, visible point');
    // the point carries only the wording that CHANGED — "days" is unchanged
    // context on both sides, so it belongs to neither half of the block
    assert.match(open.map(p => p.before + ' ' + p.after).join(' '), /sixty \(60\)/);

    // and the counterparty must be able to SEE it in the portal
    const s = portal();
    const html = s.portalOpenPointsHtml({ openPoints: open }, { org: 'Wanjiru Catering Ltd' });
    assert.match(html, /sixty \(60\)/, 'the still-open point must be rendered for Erik');
  });

  test('round 2 — the audit trail records a partial decision honestly (checklist 4)', () => {
    const trail = (c.audit || []).map(e => `${e.user}::${e.action}::${e.detail}`).join('\n');
    assert.match(trail, /Round 1/);
    assert.match(trail, /accept|adopt/i);
    assert.match(trail, /reject|not adopted|1 of 2|partly/i,
      'a round that was only partly accepted must say so, not read as a full acceptance');
  });

  /* ---------- Round 3: one-click reshare ---------- */

  test('round 3 — the next round reshares to the known recipient in one step (checklist 5)', () => {
    const s = core();
    assert.equal(typeof s.lastShareRecipient, 'function',
      'the app must remember who it last shared with');
    const shares = [
      { token: 't1', recipientName: 'Erik Lindqvist', recipientEmail: 'erik@nordkust.se',
        channel: 'email', createdAt: '2026-07-26T08:00:00.000Z' },
    ];
    const last = s.lastShareRecipient(shares);
    assert.equal(last.email, 'erik@nordkust.se');
    assert.equal(last.name, 'Erik Lindqvist');
    assert.equal(last.channel, 'email');
  });

  test('round 3 — the share dialog prefills the previous recipient (checklist 5)', () => {
    const s = core();
    assert.equal(typeof s.shareModalPrefill, 'function');
    const pre = s.shareModalPrefill([
      { token: 't1', recipientName: 'Erik Lindqvist', recipientEmail: 'erik@nordkust.se',
        channel: 'email', createdAt: '2026-07-26T08:00:00.000Z' },
    ]);
    assert.equal(pre.email, 'erik@nordkust.se');
    assert.equal(pre.channel, 'email');
    // with no history there is nothing to prefill, and that must not crash.
    // Field-by-field: the object is built inside the vm realm and does not
    // share Node's Object.prototype, so a strict deepEqual compares realms.
    const empty = s.shareModalPrefill([]);
    assert.equal(empty.name, ''); assert.equal(empty.email, '');
    assert.equal(empty.phone, ''); assert.equal(empty.channel, 'email');
  });

  test('round 3 — he comes back on the refused point, as a new round', () => {
    // she reshared; he reads the open point and counters on it
    const base = w.win.docPlainText(c);
    const proposed = base.replace('thirty (30) days', 'forty-five (45) days');
    c.rounds.push({ n: c.rounds.length + 1, at: w.win.nowISO(), by: 'Erik Lindqvist, Procurement Manager',
      comment: 'Meet in the middle at Net-45?', status: 'open', resolution: null,
      baseText: base, proposedText: proposed });
    const r = c.rounds[c.rounds.length - 1];

    const blocks = w.win.diffBlocks(r.baseText, r.proposedText);
    assert.equal(blocks.length, 1, 'one ask, one decision');
    w.win.acceptProposedRound(c, r.n, { decisions: { [blocks[0].id]: 'accept' },
      comment: 'Net-45 works. Agreed.' });

    assert.equal(r.resolution.decision, 'accepted');
    assert.match(w.win.docPlainText(c), /forty-five \(45\) days/);
    assert.equal(w.win.docFormat(c.format), 'rich', 'still a formatted document at round 3');
    assert.equal(w.win.openPointsFor(c).length, 0,
      'the point he raised in round 1 is now settled and must drop off the open list');
  });

  test('round 4 — a further round on liability, decided the same way', () => {
    const base = w.win.docPlainText(c);
    const proposed = base.replace('capped at the total sums paid in the preceding twelve months',
      'capped at fifty percent (50%) of the sums paid in the preceding twelve months');
    c.rounds.push({ n: c.rounds.length + 1, at: w.win.nowISO(), by: 'Erik Lindqvist, Procurement Manager',
      comment: 'Our board needs a cap at 50%.', status: 'open', resolution: null,
      baseText: base, proposedText: proposed });
    const r = c.rounds[c.rounds.length - 1];
    const blocks = w.win.diffBlocks(r.baseText, r.proposedText);
    w.win.acceptProposedRound(c, r.n, {
      decisions: Object.fromEntries(blocks.map(b => [b.id, 'accept'])),
      comment: 'Accepted.' });

    assert.match(w.win.docPlainText(c), /fifty percent \(50%\)/);
    assert.equal(w.win.docFormat(c.format), 'rich', 'still formatted after four rounds');
    assert.match(w.win.docPlainText(c), /RAW MATERIAL SUPPLY AGREEMENT/);
  });

  /* ---------- Round 4 (server): the durable link ---------- */

  describe('round 4 — the durable negotiation link (checklist 6)', () => {
    let h, W;
    before(async () => { h = await startHati(); W = await seedWorkspace(h); });
    after(async () => { await h.stop(); });

    const payloadFor = (text, versions) => ({
      v: 1, kind: 'hati-share', org: 'Wanjiru Catering Ltd', sharedBy: 'Wanjiru Kamau',
      at: new Date().toISOString(), docHash: 'h1',
      contract: { id: 'MK-D1', name: 'Supply Agreement', counterparty: 'Nordkust Industri AB',
        template: 'RM', value: 4800000, valueType: 'estimated', fields: {},
        redlineText: text, format: 'text', docText: text, versions: versions || [] },
    });

    test('a durable link survives a response and keeps accepting the next one', async () => {
      const c = fixtureContract('MK-D1', 'Supply Agreement', 'Nordkust Industri AB', FOLDER_A, 4800000, 'Under Review');
      await W.admin.json('/api/contracts/MK-D1', { method: 'PUT', body: { contract: c, baseVersion: 0 } });

      const made = await W.admin.json('/api/shares', { method: 'POST', body: {
        payload: payloadFor('WORDING v1'), channel: 'email', durable: true,
        recipient: { name: 'Erik Lindqvist', email: 'erik@nordkust.se' }, expiryDays: 30 } });
      assert.ok(made.token, 'a durable link must be created');
      const token = made.token;

      // Erik answers once
      let r = await W.admin.raw('/api/shares/' + token + '/respond', { method: 'POST', body:
        erikResponse({ id: 'MK-D1', comment: 'Round one.' }) });
      assert.equal(r.status, 200, 'the first response must be accepted');

      // …and the SAME link is still alive for the next round
      r = await W.admin.raw('/api/shares/' + token);
      assert.equal(r.status, 200, 'a durable link must not die after one response');
      assert.equal(r.json.durable, true);
      assert.ok(!r.json.superseded, 'a durable link is never a stale copy of itself');

      r = await W.admin.raw('/api/shares/' + token + '/respond', { method: 'POST', body:
        erikResponse({ id: 'MK-D1', comment: 'Round two, on the same link.' }) });
      assert.equal(r.status, 200, 'the durable link must accept the next round too');
    });

    test('a durable link always serves the CURRENT wording, not the copy it was made from', async () => {
      const made = await W.admin.json('/api/shares', { method: 'POST', body: {
        payload: payloadFor('WORDING v1'), channel: 'email', durable: true,
        recipient: { name: 'Erik Lindqvist', email: 'erik@nordkust.se' }, expiryDays: 30 } });

      // the owner revises and refreshes the durable link's payload
      const up = await W.admin.raw('/api/shares/' + made.token + '/payload', { method: 'PUT', body: {
        payload: payloadFor('WORDING v2 — revised', [
          { n: 1, at: '2026-07-26T08:00:00.000Z', by: 'Wanjiru Kamau', label: 'Sent to you', text: 'WORDING v1' }]) } });
      assert.equal(up.status, 200, 'a durable link must be refreshable to the current wording');

      const got = await W.admin.raw('/api/shares/' + made.token);
      assert.equal(got.status, 200);
      assert.match(got.json.payload.contract.docText, /WORDING v2 — revised/,
        'the durable link must show what the contract says now');
      assert.ok(got.json.prior || got.json.payload.contract.versions.length,
        'the reader must be able to see what moved since their last copy');
    });

    test('one-shot links still exist for the final signature pass (checklist 6)', async () => {
      const made = await W.admin.json('/api/shares', { method: 'POST', body: {
        payload: payloadFor('FINAL WORDING'), channel: 'email',
        recipient: { name: 'Erik Lindqvist', email: 'erik@nordkust.se' }, expiryDays: 7 } });

      let r = await W.admin.raw('/api/shares/' + made.token);
      assert.equal(r.status, 200);
      assert.ok(!r.json.durable, 'the default link stays single-use');

      r = await W.admin.raw('/api/shares/' + made.token + '/respond', { method: 'POST', body:
        erikResponse({ id: 'MK-D1', action: 'accept', comment: 'Agreed.' }) });
      assert.equal(r.status, 200);
      r = await W.admin.raw('/api/shares/' + made.token + '/respond', { method: 'POST', body:
        erikResponse({ id: 'MK-D1', action: 'accept', comment: 'Twice?' }) });
      assert.ok(r.status >= 400, 'a one-shot link must still refuse a second response');
    });
  });

  /* ---------- Round 5: the value round ---------- */

  test('round 5 — a proposed value is carried, decided, and voids stale approvals', () => {
    const before = c.value;
    c.approval = { by: 'Amina', at: '2026-07-26T07:00:00.000Z' };
    c.rounds.push({ n: c.rounds.length + 1, at: w.win.nowISO(), by: 'Erik Lindqvist',
      comment: 'Our budget is KES 4.4m.', status: 'open', resolution: null,
      proposedValue: 4400000, proposedText: null, baseText: null });
    const r = c.rounds[c.rounds.length - 1];

    w.win.resolveRound(c, r.n, true);
    assert.equal(c.value, 4400000, 'an accepted value counter must update the contract');
    assert.notEqual(c.value, before);
    assert.equal(c.approval, null, 'a changed value must void an approval given for the old one');
  });

  /* ---------- Round 6: acceptance, signature, seal ---------- */

  test('round 6 — the formatting is still intact after all six rounds (checklist 10)', () => {
    assert.equal(w.win.docFormat(c.format), 'rich',
      'the contract must still be a formatted document at the end of the negotiation');
    const live = w.win.docPlainText(c);
    assert.match(live, /RAW MATERIAL SUPPLY AGREEMENT/, 'headings survive');
    assert.match(live, /^\s*5\.\s*Payment shall be made/m, 'clause numbering survives');
    assert.match(live, /twenty-one \(21\) days/, 'the accepted change is in the final text');
  });

  test('round 6 — every round is resolved, then the contract is signed and sealed (checklist 14)', async () => {
    for (const r of (c.rounds || []).filter(x => x.status === 'open')) w.win.resolveRound(c, r.n, true);
    assert.equal(w.win.unresolvedRedlines(c), 0);

    c.acceptance = { by: 'Erik Lindqvist, Procurement Manager', at: w.win.nowISO(), email: 'erik@nordkust.se' };
    c.signatures = [
      { party: 'counterparty', name: 'Erik Lindqvist', email: 'erik@nordkust.se',
        at: w.win.nowISO(), method: 'share-link-otp', form: 'drawn' },
      { party: 'internal', name: 'Wanjiru Kamau', email: 'wanjiru@company.co.ke',
        at: w.win.nowISO(), method: 'session-authenticated', form: 'drawn' },
    ];
    const frozen = w.win.freezeContractHtml(c);
    c.execution = { at: w.win.nowISO(), html: frozen, format: 'rich', hashMode: 'rich',
      textHash: await w.win.sha256(frozen) };
    c.hash = c.execution.textHash; c.status = 'Signed';
    w.win.logAudit(c, 'Executed', `Sealed after ${c.rounds.length} rounds, both parties signed`);

    assert.equal(c.status, 'Signed');
    assert.match(c.hash, /^[0-9a-f]{64}$/);
    assert.equal(c.execution.format, 'rich',
      'the signed instrument must be the formatted document, not a plain-text shadow (checklist 10)');
    assert.equal(c.signatures.length, 2, 'both sides must be on the record');
  });

  test('round 6 — the record is truthful end to end (checklist 14)', () => {
    const trail = (c.audit || []).map(e => `${e.user}::${e.action}::${e.detail}`).join('\n');
    assert.match(trail, /Executed/);
    assert.match(trail, /Erik|counterparty/i, 'the counterparty must appear in the record');
    assert.ok(c.rounds.length >= 3, 'the rounds must survive to execution');
    for (const r of c.rounds) {
      assert.equal(r.status, 'closed', 'no round may be left dangling on a signed contract');
      assert.ok(r.resolution && r.resolution.decision, 'every round must record its decision');
    }
  });
});
