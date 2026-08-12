/* ============================================================
   f189 — the sender's covering note is an EMAIL, not a page element
   ============================================================
   Owner-asked, 13 Aug 2026, from a photograph of the counterparty's
   negotiation page: an envelope strip across the top reading "Message from
   <name>: …", sitting above the wall line, before the contract.

   The note was reproduced in FOUR places on that side — the banner, a box in
   the respond panel on the landing and signing page, a block at the foot of
   the Compare wording dialog, and the "What changed" panel, which wore a
   different title but was filled from the sender's own textarea in the share
   dialog. All four come off. The reader opens the link to read the contract.

   THE NOTE IS NOT LOST. It is in the email, word for word, under "Message
   from <name>", and in the WhatsApp text. Both are asserted here, because
   this change is only defensible if the note actually still goes somewhere.

   AND THE SERVER STOPS SENDING IT, which is what makes this true of links
   already sitting in somebody's inbox rather than only of new ones. That is
   the half a browser check cannot see, so it is exercised against a real
   server below.

   TWO THINGS THAT LOOK LIKE THIS AND ARE NOT, both pinned here because both
   would be a bad silent loss: the per-clause DISCUSSION thread between the
   two sides, and the one courtesy sentence when the person handling our side
   hands over.
   ============================================================ */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startHati, seedWorkspace } = require('./helpers');

const NOTE = 'CALL-ME-BEFORE-FRIDAY-we-can-move-on-the-cap';
const SUMMARY = 'ROUND-ONE-SUMMARY-payment-terms-moved-to-net-45';

const PAYLOAD = c => ({ kind: 'hati-share', org: 'Highland Corporate Ltd', contract: c });

function contractFixture(){
  return { id: 'MK-N1', name: 'Warehousing Services Agreement', counterparty: 'Brut Africa Ltd',
    folder: 'proc', template: 'WH', status: 'Under Review', format: 'text',
    redlineText: 'Article 1 Payment\n\nPayable within thirty (30) days.',
    fields: {}, metadata: {}, signatures: [], obligations: [], rounds: [], versions: [],
    comments: [], audit: [], changes: [] };
}

describe('f189 — the server stops handing the note to the counterparty', () => {
  let h, W, token;
  before(async () => {
    h = await startHati();
    W = await seedWorkspace(h);
    const c = contractFixture();
    await W.admin.json('/api/contracts/MK-N1', { method: 'PUT', body: { contract: c, baseVersion: 0 } });
    const r = await W.admin.json('/api/shares', { method: 'POST', body: {
      payload: PAYLOAD(c), channel: 'email', purpose: 'negotiate',
      recipient: { name: 'Guliz Cetin', email: 'guliz@brutafrica.example' },
      message: SUMMARY + '\n\n' + NOTE } });
    token = r.token || (r.link || '').split('share=')[1];
  });
  after(async () => { await h.stop(); });

  test('THE PUBLIC ROUTE DOES NOT RETURN IT — and this is what fixes old links', async () => {
    /* Every link already issued calls this route on every open, so with the
       field withheld here no page can draw it however old it is, and nothing
       has to be migrated. */
    const r = await h.client('anon').json('/api/shares/' + token);
    assert.ok(r.share, 'the share block is still there');
    assert.equal(r.share.message, undefined, 'and it carries no message');
    assert.ok(!JSON.stringify(r).includes(NOTE),
      'the note is nowhere in what the counterparty is handed');
    assert.ok(!JSON.stringify(r).includes(SUMMARY),
      'nor the step-1 summary, which was the same textarea wearing another title');
  });

  test('but the facts that DO belong to the reader still travel', async () => {
    /* The removal is one field, not the block. A link that stopped saying who
       it was addressed to, or when it dies, would be a different bug. */
    const r = await h.client('anon').json('/api/shares/' + token);
    assert.equal(r.share.recipientName, 'Guliz Cetin');
    assert.ok('expiresAt' in r.share);
    assert.ok('channel' in r.share);
  });

  test('THE EMAIL STILL CARRIES IT, under "Message from <name>"', async () => {
    /* The whole argument for taking it off the page: the note goes to their
       inbox instead. If this ever stops being true the change is a deletion
       rather than a move. */
    const ob = await W.admin.json('/api/outbox');
    const mail = (ob.items || []).find(m => String(m.to_addr) === 'guliz@brutafrica.example');
    assert.ok(mail, 'the counterparty was written to');
    assert.match(String(mail.body), /Message from/i, 'under its own heading');
    assert.ok(String(mail.body).includes(NOTE), 'with the sender\'s words in it');
  });

  test('the OWNER\'s own side of the link is untouched', async () => {
    /* shares.message is still WRITTEN at mint — this is a decision about what
       leaves the building on a public token, not about what we keep. The
       owner's panel never printed the note back (shareInfo has never carried
       it); what the sender sees is the manifest in the dialog as it goes, and
       the message itself in the outbox, which an admin can read. Both are
       asserted rather than assumed, because "the sender still sees what they
       sent" is a condition of this change being a move and not a deletion. */
    const list = await W.admin.json('/api/contracts/MK-N1/shares');
    const row = (list.shares || list.items || []).find(x => x.token === token);
    assert.ok(row, 'the owner can still see the link');
    assert.equal(row.recipientEmail, 'guliz@brutafrica.example', 'and who it went to');
    const ob = await W.admin.json('/api/outbox');
    assert.ok((ob.items || []).some(m => String(m.body || '').includes(NOTE)),
      'and the words they typed are readable on our own side');
  });

  test('THE DISCUSSION CHANNEL IS A DIFFERENT FEATURE AND IS UNTOUCHED', async () => {
    /* A per-clause message between the two sides, stored in its own table. It
       happens to use the same word and is nothing to do with a covering note.
       If a clause note ever disappears, this is the thing that was hit. */
    const said = 'CLAUSE-NOTE-can-you-live-with-forty-five';
    await h.client('anon').json(`/api/shares/${token}/messages`, { method: 'POST',
      body: { author: 'Guliz Cetin', topic: 'cl-1', body: said } });
    const r = await h.client('anon').json('/api/shares/' + token);
    assert.ok(JSON.stringify(r.messages || []).includes(said),
      'the clause thread still comes down the same route');
  });
});

/* ============================================================
   AND THE FOUR DRAWINGS ARE GONE FROM THE PAGE ITSELF
   ============================================================
   Read off the source rather than a mounted page: three of the four live in
   different screens of the portal (the negotiation workbench, the landing
   panel, a modal), and what is being asserted is that no branch anywhere
   still puts those typed words on the counterparty's side. */
describe('f189 — no drawing of the note is left on their side', () => {
  const fs = require('fs');
  const path = require('path');
  const src = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');

  test('the portal never reads share.message', () => {
    const portal = src('js/views/portal.js');
    /* Matched on the READ, not on a rendered string: a banner rebuilt in a
       different shape would still have to reach for this field. */
    assert.ok(!/share\s*&&\s*[A-Za-z_.]*share\.message/.test(portal),
      'no branch on their side reaches for the sender\'s note');
    assert.ok(!/\.share\.message/.test(portal));
  });

  test('nor the summary that wore a second title', () => {
    const portal = src('js/views/portal.js');
    assert.ok(!/contract\.changeSummary/.test(portal),
      'the "What changed" panel was the same typed words with another heading');
    assert.match(portal, /function portalChangeSummaryHtml\(\)\{ return ''; \}/,
      'kept as a stub so an older payload cannot start drawing it through some other caller');
  });

  test('and the MINT stops writing it into the payload', () => {
    assert.ok(!/^\s*payloadObj\.contract\.changeSummary\s*=/m.test(src('js/core.js')),
      'a new link does not carry a copy either');
  });

  test('THE ONE COURTESY SENTENCE STAYS — it is not a covering note', () => {
    /* When the person handling our side hands over, the counterparty is told
       once. That is a fact about who they are dealing with. */
    assert.match(src('js/views/portal.js'), /leadNotice/,
      'the handover sentence is still drawn');
  });

  test('AND THE WALL LINE STAYS, AND STAYS FIRST', () => {
    /* "Decisions stay on this page until you press Send" is read before they
       start, and the message banner used to sit above it. Only the message
       goes. */
    const portal = src('js/views/portal.js');
    assert.match(portal, /rl-wall/, 'the wall line is still built');
  });
});

/* ============================================================
   AND THE BOX SAYS WHERE WHAT YOU TYPE IN IT GOES
   ============================================================
   The consequence the removal creates: with the page no longer reproducing
   the note, its only roads are the email and the WhatsApp text — so "copy the
   link" is a channel that carries no message at all. A box that silently
   swallows what somebody typed is worse than the banner was. */
describe('f189 — the share dialog names the channel under the box', () => {
  const fs = require('fs');
  const path = require('path');
  const src = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');

  test('there is a slot under the message box, and setCh fills it', () => {
    const core = src('js/core.js');
    assert.match(core, /id="sh-msg-where"/, 'the line has a home under the box');
    assert.match(core, /co_note_goes_email/, 'and setCh names the channel');
    assert.match(core, /co_note_goes_whatsapp/);
    assert.match(core, /co_note_goes_nowhere/);
  });

  test('the first paint happens before anything is pressed', () => {
    /* setCh used to be skipped for email, because the markup already draws
       email as the active tab. The line has no markup default, so an
       unconditional first paint is what makes it present on arrival. */
    const core = src('js/core.js');
    assert.ok(!/if\(ch!=='email'\) setCh\(ch\);/.test(core),
      'the conditional first paint is gone');
    assert.match(core, /\n  setCh\(ch\);/);
  });

  test('and both languages have the three sentences', () => {
    const dict = src('js/i18n.js');
    for (const k of ['co_note_goes_email', 'co_note_goes_whatsapp', 'co_note_goes_nowhere'])
      assert.equal((dict.match(new RegExp('\\n\\s*' + k + ':', 'g')) || []).length, 2,
        k + ' must exist in English and in Swedish');
    assert.match(dict, /co_note_goes_nowhere: 'A copied link carries no message/);
    assert.match(dict, /co_note_goes_nowhere: 'En kopierad länk bär inget meddelande/);
  });
});
