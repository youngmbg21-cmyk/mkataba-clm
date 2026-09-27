/* f406 — A LINK KEEPS THE KIND IT WAS MADE WITH (the owner's list, 27 Sep 2026)

   "Sending a read-only View link to someone who already holds a negotiation
   link only refreshes their old link, so they can still negotiate."

   What a link lets its reader do is decided by the ROW's purpose — the server
   serves it that way. Three places put a copy of another kind onto a row:
     · the send dialog reused ANY standing link held by the typed address, so a
       View send refreshed a negotiation link and the reader could still answer;
     · the round send's link choice (standingShareFor) took any standing link;
     · the round send then pushed the round's copy onto EVERY standing link on
       the contract — a signing link or an adviser's narrowed link included.
   The server's payload refresh refused only a history copy. It now refuses any
   copy whose CHOSEN kind differs from the row's; the browser reuses and
   catches up negotiation links only (shareKindOf / standingNegotiation).

   Red at the parent (3ee647b): (1)(2)(4)(5). (3) is the CONTROL that the round
   send and the quiet catch-up still land. */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { startHati, seedWorkspace, fixtureContract, FOLDER_A, nameASigner } = require('./helpers');

const DOC = '1. TERM\nThis Agreement runs for twelve (12) months.';
const payloadFor = (id, over = {}) => ({
  v: 1, kind: 'hati-share', org: 'Highland Corporate Ltd', sharedBy: 'Amina Otieno',
  at: new Date().toISOString(), docHash: 'h1',
  contract: { id, name: 'Supply Agreement', counterparty: 'Nordkust Industri AB', fields: {},
    redlineText: DOC, format: 'text', docText: DOC, versions: [] },
  ...over,
});

describe('f406 — the payload refresh keeps the row’s kind', () => {
  let h, W;
  before(async () => {
    h = await startHati();
    W = await seedWorkspace(h);
    await W.admin.json('/api/contracts/MK-KIND-1', { method: 'PUT', body: {
      contract: fixtureContract('MK-KIND-1', 'Supply Agreement', 'Nordkust Industri AB', FOLDER_A, 4800000, 'Under Review'),
      baseVersion: 0 } });
    /* A signing link needs somebody named to sign — the rule that says
       naming the signers is what opens signing. */
    await nameASigner(W.admin, 'MK-KIND-1');
  });
  after(async () => { await h.stop(); });

  const mint = async purpose => (await W.admin.json('/api/shares', { method: 'POST', body: {
    payload: payloadFor('MK-KIND-1', { purpose, purposeChosen: purpose }), durable: true, channel: 'link', purpose,
    recipient: purpose === 'sign' ? { name: 'Grace Njeri', email: 'grace@client.co.ke' }
      : { name: 'Erik Lindqvist', email: 'erik@nordkust.se' } } })).token;
  const refresh = (token, over) => W.admin.raw('/api/shares/' + token + '/payload', { method: 'PUT',
    body: { payload: payloadFor('MK-KIND-1', over), silent: true } });

  test('f406 (1) a VIEW copy cannot be written onto a negotiation link — the reader could still negotiate', async () => {
    const tok = await mint('negotiate');
    const r = await refresh(tok, { purpose: 'view', purposeChosen: 'view' });
    assert.equal(r.status, 409, 'refused: ' + JSON.stringify(r.json));
    const seen = await h.client('erik-1').json('/api/shares/' + tok);
    assert.notEqual(seen.payload.purpose, 'view', 'the copy on the link is untouched');
  });

  test('f406 (2) and a negotiation copy cannot be written onto an adviser’s or a signing link', async () => {
    const adv = await mint('advise');
    assert.equal((await refresh(adv, { purpose: 'negotiate', purposeChosen: 'negotiate' })).status, 409);
    const sign = await mint('sign');
    assert.equal((await refresh(sign, { purpose: 'negotiate', purposeChosen: 'negotiate' })).status, 409);
  });

  test('f406 (3) CONTROL: a copy of the link’s own kind lands, and so does one that chose no kind', async () => {
    const tok = await mint('negotiate');
    assert.equal((await refresh(tok, { purpose: 'negotiate', purposeChosen: 'negotiate' })).status, 200);
    /* A round with nothing proposed INFERS 'sign' and chooses nothing — the
       round send's shape. It must still land on the negotiation link. */
    assert.equal((await refresh(tok, { purpose: 'sign', purposeChosen: null })).status, 200);
    const sign = await mint('sign');
    assert.equal((await refresh(sign, { purpose: 'sign', purposeChosen: 'sign' })).status, 200, 'the quiet catch-up keeps a signing link on its own kind');
  });

  test('f406 (4) the browser reads one kind per row, and a row made before kinds existed is a negotiation', () => {
    const SRC = fs.readFileSync(path.join(__dirname, '..', 'js/core.js'), 'utf8');
    const grab = name => { const m = new RegExp('function ' + name + '\\([^)]*\\)\\{[^\\n]*\\}').exec(SRC); return m && m[0]; };
    const sp = /const SHARE_PURPOSE = [^\n]*\n/.exec(SRC);
    const kind = grab('shareKindOf');
    assert.ok(sp && kind, 'shareKindOf');
    const shareKindOf = new Function(sp[0] + kind + '; return shareKindOf;')();
    assert.equal(shareKindOf({ purpose: 'view' }), 'view');
    assert.equal(shareKindOf({ purpose: null }), 'negotiate');
    assert.equal(shareKindOf({ purpose: 'bogus' }), 'negotiate');
  });

  test('f406 (5) the round goes on a negotiation link, and the dialog reuses only a negotiation link for a negotiation send', () => {
    const SRC = fs.readFileSync(path.join(__dirname, '..', 'js/core.js'), 'utf8');
    /* The round's link choice, driven over a contact whose newest standing
       link is a VIEW link. */
    const pick = ['shareIsStanding', 'standingShares', 'shareKindOf', 'standingNegotiation', 'standingShareFor']
      .map(n => { const i = SRC.indexOf('function ' + n + '('); const j = SRC.indexOf('\n}', i); return i >= 0 ? SRC.slice(i, j + 2) : ''; });
    assert.ok(pick.every(Boolean), 'all five readings present');
    const sp = /const SHARE_PURPOSE = [^\n]*\n/.exec(SRC)[0];
    const standingShareFor = new Function('nowISO', sp + pick.join('\n') + '; return standingShareFor;')(() => '2026-09-27T00:00:00Z');
    const shares = [
      { token: 'neg', durable: true, purpose: 'negotiate', recipientEmail: 'erik@nordkust.se', createdAt: '2026-09-01T00:00:00Z' },
      { token: 'view', durable: true, purpose: 'view', recipientEmail: 'erik@nordkust.se', createdAt: '2026-09-20T00:00:00Z' },
      { token: 'adv', durable: true, purpose: 'advise', recipientEmail: 'lawyer@firm.se', createdAt: '2026-09-21T00:00:00Z' },
    ];
    assert.equal(standingShareFor(shares, { email: 'erik@nordkust.se' }).token, 'neg');
    assert.equal(standingShareFor(shares, { email: 'lawyer@firm.se' }).token, 'neg', 'an adviser’s link is never the round’s link');
    assert.equal(standingShareFor(shares.slice(1), { email: 'erik@nordkust.se' }), null, 'no negotiation link, no reuse — a new link is made');
    assert.match(SRC, /const reuse=\(wantDurable && \(payloadObj\.purpose\|\|'negotiate'\)==='negotiate' && email\)\s*\?\s*standingNegotiation\(priorShares\)/,
      'the dialog reuses only for a negotiation send, and only a negotiation link');
    assert.match(SRC, /for\(const s of standingNegotiation\(shares\)\)\{\s*if\(!s \|\| s\.token===live\.token\) continue;/,
      'the round’s catch-up refreshes negotiation links only');
  });
});
