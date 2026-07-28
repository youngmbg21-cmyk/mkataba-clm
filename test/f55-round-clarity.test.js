/* ============================================================
   F55 — reading the contract, hearing the answer, and one inbox
   ============================================================
   Four complaints from one negotiation walked end to end, and each of them is
   a place where the product told the reader something that was not quite true.

     1  THE PANE SELECTOR listed the same document under several names, so a
        contract opened for the first time offered three choices where there
        were two documents, and one round of negotiation made it worse. Covered
        in f46 and f54, where the selector's own tests live.

     2  THE REDLINE CANNOT BE READ AS A CONTRACT. Both panes are marked up —
        struck-through wording, inserted wording, a fingerprint against each —
        which is what deciding a change needs and the opposite of what reading
        the agreement needs. "What does this say if we agree to all of it" had
        no answer short of accepting everything to find out.

     3  A CARD SHOWED HALF A CONVERSATION. A comment on a fingerprint has two
        stores — the thread on the contract record, and the discussion channel a
        counterparty's public page has to use — and each side rendered only the
        one it wrote to. So the owner asked for input, the counterparty answered,
        and the card that asked the question showed no reply.

     4  "FULLY EXECUTED" WITH ONE SIGNATURE ON IT. Sealing is a fact about the
        DOCUMENT and execution is a fact about the PARTIES; the notice read one
        for the other and announced a finished agreement to both sides when only
        one had signed — with the seal and a link to the document in it.
*/
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { buildWorld } = require('./world');
const http = require('node:http');
const { startHati, seedWorkspace, FOLDER_A, Client } = require('./helpers');
const F = require('./clausefixtures.js');

function contract(over = {}){
  return { id: 'MK-455', name: 'Warehousing and Logistics Services Agreement',
    counterparty: 'Nordfrakt Logistik AB', template: 'WH', status: 'Under Review',
    folder: 'dist', fields: {}, metadata: {}, audit: [], rounds: [], versions: [],
    signatures: [], comments: [], redlineText: F.protoRich(), format: 'rich', ...over };
}
/* One ask on the table, undecided — the state the room is in for most of its
   life, and the state in which "what would this say" is worth asking. */
async function pending(win){
  const c = contract();
  win.negoInit(c);
  const cl = win.negoClauseList(c).find(x => x.num === '4');
  const ch = await win.negoEditClause(c, cl.clauseId, `<p>${F.PROTO_ASKS['4'].text}</p>`,
    { side: 'counterparty', author: 'Erik Lindqvist', summary: 'Net-45' });
  return { c, ch };
}

describe('F55 — the contract can be read as if every change were agreed', () => {
  test('the clean document carries the proposed wording and not the wording it replaces', async () => {
    const { win } = buildWorld();
    const { c } = await pending(win);
    const base = win.negoBaseText(c);
    const clean = win.negoCleanText(c);
    const asked = F.PROTO_ASKS['4'].text;

    assert.ok(base.includes('thirty (30)'), 'the baseline still says what it said');
    assert.ok(clean.includes(asked.slice(0, 40)),
      'the clean read includes the wording that was asked for');
    assert.ok(!clean.includes('thirty (30) days of receipt'),
      'and excludes the wording it would replace — nothing is struck through, it is gone');
  });

  test('reading it agrees to nothing', async () => {
    const { win } = buildWorld();
    const { c, ch } = await pending(win);
    const before = JSON.stringify(c);
    win.negoCleanBody(c);
    assert.equal(win.negoChangeById(c, ch.id).status, 'pending',
      'a look is not a decision');
    assert.equal(JSON.stringify(c), before, 'and it writes nothing at all');
    assert.notEqual(win.negoResolvedText(c), win.negoCleanText(c),
      'the document itself has not moved — only the hypothetical has the new wording');
  });

  test('a refused ask is not assumed, and neither is a withdrawn one', async () => {
    const { win } = buildWorld();
    const { c, ch } = await pending(win);
    win.negoResolve(c, ch.id, 'rejected', { by: 'Wanjiru Kamau' });
    assert.equal(win.negoCleanText(c), win.negoResolvedText(c),
      'silence rejects here too — a refused change is settled, not outstanding');
  });

  test('the room offers the switch, and shows both documents clean when it is on', async () => {
    const w = buildWorld({ negotiationView: true });
    const win = w.win;
    const { c } = await pending(win);
    win.negoResetView();
    win.openNegotiationRoom(c, { side: 'owner', by: 'Wanjiru Kamau', persist: false });
    const doc = win.document;

    const btn = doc.querySelector('#nego-clean-toggle');
    assert.ok(btn, 'the switch is on the working pane, where the redline is');
    assert.equal(btn.getAttribute('aria-pressed'), 'false');
    assert.ok(doc.querySelector('.nego-del'), 'the redline is marked up to begin with');

    btn.dispatchEvent(new win.Event('click', { bubbles: true }));

    assert.ok(win.negoCleanView(), 'the switch is on');
    assert.equal(doc.querySelectorAll('.nego-del').length, 0, 'nothing is struck through');
    assert.equal(doc.querySelectorAll('.nego-ins').length, 0, 'and nothing is marked as inserted');
    assert.equal(doc.querySelectorAll('.nego-badge').length, 0, 'no fingerprints in the margin');
    const both = Array.from(doc.querySelectorAll('.nego-doc')).length;
    assert.ok(both >= 2, 'both documents are on the screen, side by side');
    /* A mode that does not say it is a mode is a screen telling you the
       contract says something it does not say yet. */
    const bar = doc.querySelector('#nego-clean-bar');
    assert.ok(bar, 'and the screen says what it is showing');
    assert.match(bar.textContent, /Nothing has been accepted/i);
    /* The way back is the toggle that opened the mode, in the place the reader
       pressed to get here. The bar used to carry a second button saying the
       same words a few inches away — see f60. */
    assert.equal(doc.querySelector('#nego-clean-exit'), null, 'and only one way back');
    assert.match(doc.querySelector('#nego-clean-toggle').textContent, /Show changes/,
      'which is the toggle, now offering the return trip');
  });

  test('the counterparty gets the same switch — neither side reads a lesser screen', async () => {
    const w = buildWorld({ negotiationView: true });
    const win = w.win;
    const { c } = await pending(win);
    win.negoResetView();
    win.openNegotiationRoom(c, { side: 'counterparty', by: 'Erik Lindqvist', persist: false });
    assert.ok(win.document.querySelector('#nego-clean-toggle'),
      'reading the contract is not an owner privilege');
  });
});

describe('F55 — one thread per change, out of two stores', () => {
  test('a reply filed through the discussion channel appears on the card that asked', async () => {
    const { win } = buildWorld();
    const { c, ch } = await pending(win);
    /* Stamped explicitly rather than through negoPostComment, which uses the
       clock: the thread is ordered by time, so whether the owner's own line
       sorted before or after a fixed fixture timestamp depended on the time of
       day the suite happened to run. */
    win.negoChangeById(c, ch.id).thread = [{ who: 'Young Mbagaya', side: 'owner',
      at: '2026-07-28T07:18:00Z', text: 'Possibly not needed — what do you think?' }];
    /* What the counterparty's page can actually do: their copy of the contract
       is rebuilt from the share payload on every repaint, so a reply cannot be
       written to it and goes to the channel under the change's own topic. */
    c._messages = [{ id: 1, side: 'counterparty', author: 'Erik Lindqvist',
      topic: win.negoTopicFor(ch), body: 'Agreed, drop it.', at: '2026-07-28T08:00:00Z' }];

    const thread = win.negoThreadOf(c, win.negoChangeById(c, ch.id));
    assert.equal(thread.length, 2, 'the question and the answer are one exchange');
    assert.equal(thread[1].text, 'Agreed, drop it.');
    assert.equal(thread[1].side, 'counterparty');
    assert.equal(thread[1].who, 'Erik Lindqvist', 'attributed to whoever wrote it');
  });

  test('a message about another change does not leak onto this one', async () => {
    const { win } = buildWorld();
    const { c, ch } = await pending(win);
    c._messages = [{ id: 1, side: 'counterparty', author: 'Erik Lindqvist',
      topic: 'change:CHG-999', body: 'About something else entirely.', at: '2026-07-28T08:00:00Z' },
      { id: 2, side: 'counterparty', author: 'Erik Lindqvist',
        topic: 'general', body: 'A general remark.', at: '2026-07-28T08:01:00Z' }];
    assert.equal(win.negoThreadOf(c, win.negoChangeById(c, ch.id)).length, 0,
      'a thread on a fingerprint carries what was said about that fingerprint');
  });

  test('a comment written to both stores is one message, not two', async () => {
    const { win } = buildWorld();
    const { c, ch } = await pending(win);
    win.negoPostComment(c, ch.id, 'What do you think?', { side: 'owner', author: 'Young Mbagaya' });
    // the owner's room posts the same sentence down the channel, so it reaches
    // the counterparty's page — it must not then appear twice on the owner's
    c._messages = [{ id: 1, side: 'owner', author: 'Young Mbagaya',
      topic: win.negoTopicFor(ch), body: 'What do you think?', at: '2026-07-28T07:18:00Z' }];
    assert.equal(win.negoThreadOf(c, win.negoChangeById(c, ch.id)).length, 1);
  });

  /* DECIDING AND SPEAKING ARE NOT THE SAME PERMISSION. A copy that can no
     longer move the negotiation — a spent one-shot link — was also a copy that
     could not answer a question, because one flag stood for both. The owner's
     "what do you think?" then arrived on a card with nowhere to reply. */
  test('a copy that can no longer decide can still answer', async () => {
    const w = buildWorld({ negotiationView: true });
    const win = w.win;
    const { c, ch } = await pending(win);
    win.negoResetView();
    win.openNegotiationRoom(c, { side: 'counterparty', by: 'Erik Lindqvist', persist: false,
      readonly: true, readonlyWhy: 'This link has already been answered.', canComment: true });
    const doc = win.document;
    assert.ok(!doc.querySelector(`[data-nego-accept="${ch.id}"]`), 'no decisions — the link is spent');
    assert.ok(doc.querySelector(`[data-nego-send="${ch.id}"]`),
      'but a reply on the change still has somewhere to go');
  });

  test('and a copy with no channel back offers no reply box either', async () => {
    const w = buildWorld({ negotiationView: true });
    const win = w.win;
    const { c, ch } = await pending(win);
    win.negoResetView();
    win.openNegotiationRoom(c, { side: 'counterparty', by: 'Erik Lindqvist', persist: false,
      readonly: true, canComment: false });
    assert.ok(!win.document.querySelector(`[data-nego-send="${ch.id}"]`),
      'a box that cannot send anything is worse than no box');
  });

  test('the card renders the merged thread and counts it', async () => {
    const w = buildWorld({ negotiationView: true });
    const win = w.win;
    const { c, ch } = await pending(win);
    c._messages = [{ id: 1, side: 'counterparty', author: 'Erik Lindqvist',
      topic: win.negoTopicFor(ch), body: 'We would rather keep it.', at: '2026-07-28T08:00:00Z' }];
    win.negoResetView();
    win.openNegotiationRoom(c, { side: 'owner', by: 'Young Mbagaya', persist: false });
    const card = win.document.querySelector(`[data-nego-card="${ch.id}"]`);
    assert.ok(card, 'the change has a card');
    assert.match(card.textContent, /We would rather keep it\./,
      'the answer is on the card that asked the question');
    assert.match(card.textContent, /Discuss \(1\)/, 'and it is counted');
  });
});

/* A stand-in for Resend, so the assertions can read the BODY of what went out.
   /api/outbox reports subjects only; "is the seal in this message" is exactly
   the question that cannot be answered from a subject line. Copied from f10,
   where the same stub exercises the delivery-failure paths. */
function startResendStub() {
  const seen = [];
  const server = http.createServer((req, res) => {
    let raw = '';
    req.on('data', d => { raw += d; });
    req.on('end', () => {
      let body = {}; try { body = JSON.parse(raw); } catch (_) {}
      seen.push({ to: (body.to || [])[0], subject: body.subject, text: body.text || '' });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ id: 'stub-email-id' }));
    });
  });
  return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve({
    base: 'http://127.0.0.1:' + server.address().port,
    seen,
    stop() { return new Promise(r => server.close(r)); },
  })));
}

describe('F55 — the executed copy waits for every signature', () => {
  let h, W, resend;
  const SEAL = 'a4a2574f85cbc917ae4b8846dee8aef10c4e130460304dc492ad53e9abbb194ac';
  /* Two records rather than one edited twice: an executed row's signatures are
     immutable by design (EXECUTED_IMMUTABLE), which is the right rule and means
     each state has to be filed as it stands. */
  const base = id => ({
    id, name: 'WH — Young Mbagaya', counterparty: 'Savannah Consumer Goods Limited',
    folder: FOLDER_A, status: 'Signed', hash: SEAL,
    fields: {}, metadata: {}, audit: [], rounds: [], versions: [], comments: [],
  });
  const OURS = { party: 'first', name: 'Young Mbagaya', email: 'young@highland.co.ke', at: '2026-07-28T07:30:00Z' };
  const THEIRS = { party: 'counterparty', name: 'Amara Njoroge', email: 'amara@savannah.co.ke', at: '2026-07-28T09:05:00Z' };
  const recipients = [{ name: 'Young Mbagaya', email: 'young@highland.co.ke', party: 'first' },
    { name: 'Amara Njoroge', email: 'amara@savannah.co.ke', party: 'counterparty' }];
  const file = rec => W.admin.json('/api/contracts/' + rec.id, { method: 'PUT', body: { contract: rec } });
  const distribute = id => W.admin.json('/api/contracts/' + id + '/distribute',
    { method: 'POST', body: { recipients, appUrl: 'https://hati-clm.onrender.com/' } });
  const toParties = () => resend.seen.filter(m =>
    m.to === 'young@highland.co.ke' || m.to === 'amara@savannah.co.ke');

  before(async () => {
    resend = await startResendStub();
    h = await startHati({ RESEND_API_KEY: 're_test_key', RESEND_BASE_URL: resend.base });
    W = await seedWorkspace(h);
  });
  after(async () => { await h.stop(); await resend.stop(); });

  test('one signature is announced as one signature, and carries no copy', async () => {
    await file({ ...base('MK-EXEC-1'), signatures: [OURS] });
    const r = await distribute('MK-EXEC-1');
    assert.equal(r.fullyExecuted, false);

    const sent = toParties();
    assert.equal(sent.length, 2, 'both parties are still told where it stands');
    for (const m of sent) {
      assert.ok(!/Fully executed/i.test(m.subject),
        `a half-signed contract must not be announced as executed — got "${m.subject}"`);
      assert.match(m.subject, /^Signed by Young Mbagaya —/, 'it names the party that has signed');
      assert.match(m.text, /Savannah Consumer Goods Limited has still to sign/);
      assert.ok(!m.text.includes(SEAL),
        'and it carries no seal — the seal is what makes it read as a finished agreement');
      assert.ok(!/hati-clm\.onrender\.com/.test(m.text),
        'nor a link to the document: both parties sign before the contract is shared');
    }
  });

  test('the second signature is what makes it fully executed', async () => {
    const before = resend.seen.length;
    await file({ ...base('MK-EXEC-2'), signatures: [OURS, THEIRS] });
    const r = await distribute('MK-EXEC-2');
    assert.equal(r.fullyExecuted, true);

    const sent = resend.seen.slice(before).filter(m =>
      m.to === 'young@highland.co.ke' || m.to === 'amara@savannah.co.ke');
    assert.equal(sent.length, 2, 'the copy goes to both parties');
    for (const m of sent) {
      assert.match(m.subject, /^Fully executed —/);
      assert.ok(m.text.includes(SEAL), 'now the seal travels with it');
      assert.match(m.text, /hati-clm\.onrender\.com/, 'and so does the copy');
    }
  });
});

describe('F55 — a response is emailed when it moves something, and not otherwise', () => {
  let h, W, token;
  const CID = 'MK-RESP-1';
  const payload = { v: 1, kind: 'hati-share', org: 'Highland Corporate Ltd',
    sharedBy: 'Young Mbagaya', at: new Date().toISOString(), docHash: 'h1',
    contract: { id: CID, name: 'WH — Young Mbagaya', counterparty: 'Savannah Consumer Goods Limited',
      template: 'WH', fields: {}, docText: '1. TERM\nTwelve (12) months.', versions: [] } };
  const anon = () => new Client(h.base, 'anon');
  /* Newest first, and subjects only — /api/outbox reports no bodies. Which is
     all this describe needs: the question here is how MANY messages an exchange
     produces and who they are addressed to. */
  const outbox = async () => ((await W.admin.json('/api/outbox')).items || [])
    .map(i => ({ to: i.to_addr, subject: i.subject }));
  const about = async () => (await outbox()).filter(m => /WH — Young Mbagaya/.test(m.subject));
  const respond = body => anon().json('/api/shares/' + token + '/respond',
    { method: 'POST', body: { kind: 'hati-response', id: CID, name: 'Amara Njoroge',
      at: new Date().toISOString(), ...body } });

  before(async () => {
    h = await startHati();
    W = await seedWorkspace(h);
    await W.admin.json('/api/contracts/' + CID, { method: 'PUT', body: { contract: {
      id: CID, name: 'WH — Young Mbagaya', counterparty: 'Savannah Consumer Goods Limited',
      folder: FOLDER_A, status: 'Under Review', fields: {}, metadata: {},
      audit: [], rounds: [], versions: [], signatures: [], comments: [] } } });
    const s = await W.admin.json('/api/shares', { method: 'POST', body: {
      payload, contractId: CID, durable: true, channel: 'email',
      recipient: { name: 'Amara Njoroge', email: 'amara@savannah.co.ke' } } });
    token = s.token;
  });
  after(async () => { await h.stop(); });

  /* THE RECEIPT IS GONE. It told the responder what the responder had just
     done, and it doubled the traffic of every exchange — six messages for
     three answers, all landing in one inbox where a workspace negotiates
     through a single address. */
  test('answering does not send the answerer a receipt', async () => {
    const before = (await about()).length;
    await respond({ action: 'decisions', email: 'amara@savannah.co.ke',
      negoDecisions: [{ id: 'CHG-001', status: 'accepted' }] });
    const added = (await about()).slice(0, (await about()).length - before);

    assert.ok(added.some(m => /^Decisions returned/.test(m.subject)),
      'the sender still learns that a decision landed — got ' + JSON.stringify(added));
    assert.ok(!added.some(m => /^Your response to/.test(m.subject)),
      'and nobody is told what they themselves just did — got ' + JSON.stringify(added));
    assert.ok(!added.some(m => m.to === 'amara@savannah.co.ke'),
      'nothing goes back down the link it came from');
  });

  test('a readiness signal that moves nothing sends nothing', async () => {
    const before = (await about()).length;
    await respond({ action: 'ready' });
    assert.equal((await about()).length, before,
      'a signal is visible on the contract; it does not need an inbox');
  });

  test('a signature is always worth an email', async () => {
    const before = (await about()).length;
    await respond({ action: 'sign', email: 'amara@savannah.co.ke' });
    const added = (await about()).slice(0, (await about()).length - before);
    assert.ok(added.some(m => /^Signed:/.test(m.subject)),
      'the one event that cannot be missed — got ' + JSON.stringify(added));
  });
});
