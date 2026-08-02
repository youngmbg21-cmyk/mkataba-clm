/* N4 — the one-question send, and lights that speak in words.

   First-send is the activation moment, so when everything the form would ask
   is already known — a recipient on the record, a purpose the contract's own
   state decides, nothing blocking — the Share dialog opens as one sentence
   and one button. The full form stays one click away behind "Change details",
   and BOTH doors press the same send handler, so every gate (approval,
   readiness acknowledgement, signing-address confirmation) holds on either
   path.

   After sending, the contract's Shares panel leads with a four-light journey
   — Sent · Opened · Responded · Signed — and the rule the strip obeys is:
   never a colour alone. Every light carries plain words, and the strip closes
   with one sentence naming whose move it is. */
const { test, describe, before } = require('node:test');
const assert = require('node:assert/strict');
const { loadViews, STUB_TEMPLATES, STUB_FOLDERS } = require('./dom');

function core(over = {}) {
  const s = loadViews(['js/richdoc.js', 'js/core.js', 'js/versioning.js'], {
    TEMPLATES: STUB_TEMPLATES, FOLDERS: STUB_FOLDERS });
  const me = { id: 'u_w', name: 'Wanjiru Kamau', role: over.role || 'legal', email: 'w@x.co.ke' };
  s.REMOTE = { org: 'Wanjiru Catering Ltd', me, users: [me] };
  s.toast = () => {}; s.persist = () => {};
  Object.assign(s, over);
  return s;
}
const contract = (over = {}) => ({ id: 'MK-1', name: 'Supply Agreement',
  counterparty: 'Nordkust Industri AB', status: 'Under Review',
  value: 1, valueType: 'estimated', fields: {}, audit: [], rounds: [], ...over });
const ago = days => new Date(Date.now() - days * 86400000).toISOString();
const share = (over = {}) => ({ token: 't1', recipientName: 'Erik Lindqvist',
  recipientEmail: 'erik@nordkust.se', channel: 'email', state: 'sent',
  createdAt: ago(1), sentAt: ago(1), firstOpenedAt: null, respondedAt: null,
  revokedAt: null, durable: true, expiresAt: ago(-13), ...over });

/* openShareModal with the network and modal stubbed — f17's pattern. */
function modalWorld(shares, over = {}) {
  let modalHtml = '';
  const s = core({
    openModal: html => { modalHtml = String(html); return { innerHTML: '' }; },
    api: async (p) => (String(p).endsWith('/shares') ? { shares } : {}),
    ensureFull: async () => {}, captureVersion: () => null,
    sha256: async () => 'h'.repeat(64), buildSharePayload: () => ({ v: 1 }),
    contractReadiness: () => [], readinessPanelHtml: () => '',
    isUpload: () => false, ...over,
  });
  return { s, html: () => modalHtml };
}

describe('N4 (1) — when nothing needs asking, the dialog is one sentence', () => {
  test('a known recipient opens on step 0: their address, the purpose, one Send', async () => {
    const { s, html } = modalWorld([share()]);
    await s.openShareModal(contract());
    const h = html();
    assert.match(h, /id="share-step-0"/, 'the quick panel leads');
    assert.match(h, /erik@nordkust\.se/);
    assert.match(h, /to review it and propose changes/, 'the purpose is said in words');
    assert.match(h, /link valid 14 days/);
    assert.match(h, /id="qs-send"/); assert.match(h, /Change details/);
    assert.match(h, /id="share-step-1" class="hidden"/, 'the full flow waits behind the fold');
  });

  test('no recipient on record — the full dialog, exactly as before', async () => {
    const { s, html } = modalWorld([]);
    await s.openShareModal(contract());
    assert.ok(!/share-step-0/.test(html()), 'nothing known means nothing to shortcut');
    assert.match(html(), /id="share-step-1"(?! class="hidden")/);
  });

  test('static mode never shortcuts — email cannot actually be sent', async () => {
    const { s, html } = modalWorld([share()], { API_MODE: () => false, api: async () => { throw new Error('no server'); } });
    await s.openShareModal(contract());
    assert.ok(!/share-step-0/.test(html()));
  });

  test('a blocking readiness problem forces the full panel and its acknowledgement', async () => {
    const { s, html } = modalWorld([share()],
      { contractReadiness: () => [{ severity: 'block', key: 'counterparty', label: 'No counterparty is set.' }] });
    await s.openShareModal(contract());
    assert.ok(!/share-step-0/.test(html()), 'a shortcut past a block would bypass the acknowledgement');
  });

  test('non-blocking warnings ride along as one quiet line', async () => {
    const { s, html } = modalWorld([share()],
      { contractReadiness: () => [{ severity: 'warn', key: 'term', label: 'No expiry is recorded.' }] });
    await s.openShareModal(contract());
    assert.match(html(), /share-step-0/, 'a warning is worth a line, not a form');
    assert.match(html(), /Worth checking: No expiry is recorded\./);
  });

  test('the sentence follows the purpose — a settled contract asks for a signature', () => {
    const s = core();
    assert.equal(s.quickSendPhrase('negotiate'), 'to review it and propose changes');
    assert.equal(s.quickSendPhrase('sign'), 'to sign this exact wording');
  });
});

describe('N4 (2) — the journey lights speak in words', () => {
  let s;
  before(() => { s = core(); });

  test('sent, not yet opened: one light on, and the words say what to expect', () => {
    const j = s.shareJourneyState(contract(), [share()]);
    assert.equal(j.now, 'sent');
    assert.deepEqual(Array.from(j.stages.map(x => x.on)), [true, false, false, false]);
    assert.match(j.stages[0].words, /link valid to/);
    assert.match(j.sentence, /Out with Erik Lindqvist/);
  });

  test('opened: the second light, and a sentence that does not nag', () => {
    const j = s.shareJourneyState(contract(), [share({ firstOpenedAt: ago(0), state: 'opened' })]);
    assert.equal(j.now, 'opened');
    assert.match(j.sentence, /reading it/);
    assert.match(j.sentence, /Nothing for you to do yet/);
  });

  test('responded: whose move it is, said outright', () => {
    const j = s.shareJourneyState(contract(), [share({ firstOpenedAt: ago(1), respondedAt: ago(0), state: 'changes' })]);
    assert.equal(j.now, 'responded');
    assert.match(j.stages[2].words, /your turn/);
    assert.match(j.sentence, /your move now/);
  });

  test('signed: all four lights, and nobody is waited on', () => {
    const j = s.shareJourneyState(contract({ status: 'Signed' }),
      [share({ firstOpenedAt: ago(2), respondedAt: ago(1), state: 'signed' })]);
    assert.deepEqual(Array.from(j.stages.map(x => x.on)), [true, true, true, true]);
    assert.match(j.sentence, /nothing is waiting on anyone/i);
    assert.ok(!/your turn/.test(j.stages[2].words), 'a signed contract asks nothing of the reader');
  });

  test('days of silence escalate to a chase, with the resend one click away', () => {
    const j = s.shareJourneyState(contract(), [share({ sentAt: ago(5), createdAt: ago(5) })]);
    assert.equal(j.stale, true);
    assert.match(j.sentence, /worth chasing|check the link reached them/);
    assert.match(s.shareJourneyHtml(contract(), [share({ sentAt: ago(5), createdAt: ago(5) })]), /seen-resend/);
  });

  test('revoked and expired links light nothing', () => {
    assert.equal(s.shareJourneyState(contract(), [share({ revokedAt: ago(0) })]), null);
    assert.equal(s.shareJourneyState(contract(), [share({ state: 'expired' })]), null);
    assert.equal(s.shareJourneyHtml(contract(), []), '');
  });

  test('every lit stage carries words — never a colour alone', () => {
    const html = s.shareJourneyHtml(contract(), [share({ firstOpenedAt: ago(1), respondedAt: ago(0) })]);
    for (const k of ['sent', 'opened', 'responded', 'signed'])
      assert.match(html, new RegExp(`data-journey="${k}"`), `${k} renders as a labelled cell`);
    assert.match(html, /not yet/, 'even an unreached light says so in words');
  });
});
