/* ============================================================
   f111 — a decision carries who really made it, and why
   ============================================================
   Two small capture improvements, shipped early on purpose: they change what
   the record COLLECTS, and a record only ever accrues going forward. Building
   the history screen first and these second would mean the screen's first year
   of data is the thin kind.

   WP-2.2 — WHO. The name a counterparty types into the box is a claim, and it
   was being stored as though it were a fact: "Rejected by Jane Mwangi", with
   nothing recording whether anyone checked that Jane sent it. Verification was
   computed only for signing, because a signature obviously needs a name on it
   — but a REJECTION is evidence too. A year later the history screen reads
   that sentence to an auditor, and its whole value is the part nobody recorded.

   HONEST IN BOTH DIRECTIONS, which is the actual claim of this file. Verified
   decisions carry the verified address. Unverified ones say "link holder,
   unverified" rather than going quiet — because a bare name reads as verified
   to every reader who was not there. Never claiming verification that did not
   happen is worth more than the verification itself.

   AND NEVER THE TYPED ADDRESS. A signer who types their own address and
   receives a code has proved control of that mailbox and nothing about who
   they are. The address that means something is the one the OWNER invited.

   WP-2.3 — WHY. A reason given at the moment of rejection lands on the change
   record and travels with it. Encouraged, never mandatory: friction at the
   moment of disagreement is how a field stops being filled in at all. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { buildWorld } = require('./world');
const F = require('./clausefixtures.js');

function contract(){
  return { id: 'MK-198', name: 'Warehousing Agreement', counterparty: 'Nordfrakt Logistik AB',
    template: 'WH', status: 'Under Review', folder: 'dist', fields: {}, metadata: {},
    audit: [], rounds: [], versions: [], signatures: [], comments: [],
    redlineText: F.protoRich(), format: 'rich' };
}

/* One owner ask on the table for them to answer. */
async function withAsk(win){
  const c = contract();
  win.negoInit(c);
  const cl = win.negoClauseList(c)[0];
  const ch = await win.negoEditClause(c, cl.clauseId,
    { newText: cl.text + ' Payment terms are ninety (90) days.' },
    { side: 'owner', author: 'Wanjiru Kamau' });
  assert.ok(ch, 'the owner must have something on the table');
  return { c, ch };
}

describe('WP-2.2 — the decision says who really made it', () => {
  const { win } = buildWorld();

  test('a verified link stamps the address the owner invited', () => {
    const r = { name: 'Jane Mwangi', title: 'Legal Counsel', verified: true,
      verifiedEmail: 'jane@nordfrakt.se', invitedEmail: 'jane@nordfrakt.se' };
    const who = win.negoActorLabel(r, 'the counterparty');
    assert.match(who, /Jane Mwangi/);
    assert.match(who, /jane@nordfrakt\.se/);
    assert.match(who, /email-verified/);
  });

  test('an unverified link says so, rather than going quiet', () => {
    const r = { name: 'Jane Mwangi', verified: false, invitedEmail: 'jane@nordfrakt.se' };
    const who = win.negoActorLabel(r, 'the counterparty');
    assert.match(who, /unverified/i,
      'a bare name reads as verified to every reader who was not there');
    assert.ok(!/email-verified/.test(who), 'and must not claim the thing it is denying');
  });

  test('it never claims verification that did not happen', () => {
    for (const r of [
      { name: 'X', verified: false, verifiedEmail: 'typed@elsewhere.com' },
      { name: 'X' },
      { name: 'X', verified: undefined },
    ]) assert.ok(!/email-verified/.test(win.negoActorLabel(r, 'cp')),
      'anything short of a verified link must not read as verified');
  });

  test('an old response with no verification fields still reads as it always did', () => {
    assert.match(win.negoActorLabel({ name: 'Erik Lindqvist' }, 'cp'), /^Erik Lindqvist/,
      'the name stays first — this adds a qualifier, it does not rewrite history');
  });

  test('the verified identity lands on the change record', async () => {
    const { c, ch } = await withAsk(win);
    /* applyNegoDecisions (js/core.js) computes this label and hands it to
       negoResolve as `by`. The world stage does not load core.js, so the two
       steps are driven here in the order core.js drives them — the claim under
       test is that the label reaches resolvedBy, not which file assembles it. */
    const who = win.negoActorLabel({ name: 'Jane Mwangi', verified: true,
      verifiedEmail: 'jane@nordfrakt.se' }, 'the counterparty');
    win.negoResolve(c, ch.id, 'rejected', { side: 'counterparty', by: who });
    assert.equal(ch.status, 'rejected');
    assert.match(String(ch.resolvedBy), /jane@nordfrakt\.se/,
      'the history screen reads resolvedBy — that is where the identity has to be');
    assert.match(String(ch.resolvedBy), /email-verified/);
  });

  test('an unverified decision is labelled on the record too', async () => {
    const { c, ch } = await withAsk(win);
    const who = win.negoActorLabel({ name: 'Someone', verified: false,
      invitedEmail: 'jane@nordfrakt.se' }, 'the counterparty');
    win.negoResolve(c, ch.id, 'rejected', { side: 'counterparty', by: who });
    assert.match(String(ch.resolvedBy), /unverified/i);
  });
});

describe('WP-2.3 — and why', () => {
  const { win } = buildWorld();

  test('a reason given at rejection lands on the change record', async () => {
    const { c, ch } = await withAsk(win);
    win.negoResolve(c, ch.id, 'rejected', { side: 'counterparty', by: 'Jane Mwangi',
      reply: 'Ninety days is outside our insurance cover.' });
    assert.equal(ch.status, 'rejected');
    assert.match(String(ch.reply), /outside our insurance cover/,
      'the reason is the sentence the history screen exists to be able to show');
  });

  test('a rejection with no reason is still a rejection', async () => {
    const { c, ch } = await withAsk(win);
    const done = win.negoResolve(c, ch.id, 'rejected', { side: 'counterparty', by: 'Jane Mwangi' });
    assert.equal(ch.status, 'rejected');
    assert.ok(done,
      'encouraged, never mandatory — friction at the moment of disagreement is how a field stops being filled at all');
  });
});
