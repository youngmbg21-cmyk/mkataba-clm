/* ============================================================
   f169 — the desk, stage 4: the gaps a strict rule opens
   ============================================================
   Stage 3 made one person the only route to the counterparty. That is the whole
   point of the design and it introduces exactly one new failure: the deal goes
   quiet the week that person is on leave, and the counterparty experiences it
   as being ignored. Everything in this file exists because of that.

   1. THE WAITING CLOCK. When THEY are waiting on US, counted in working days,
      read off their own unanswered proposals rather than off a timestamp
      somebody has to remember to set. Shown to the lead and to admins. NEVER
      shown to them — they get a reply, not a notice that we noticed.

   2. THE LEAVER CHECK. A desk whose lead has no account is a negotiation with
      no door out.

   3. THE COURTESY NOTE. The one sentence about our side that ever reaches
      theirs, on the round the contact changed and on no other. A different name
      appearing at the top of their page with no explanation is how a
      counterparty comes to feel handled; this is the difference between a
      handover and being passed around.

   And the wall, one last time: everything else stays behind it.
   ============================================================ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { buildWorld } = require('./world');

const BODY =
  '<h1>Cane Supply Agreement</h1><p>Between Wanjiru Catering Ltd and Nordfrakt Logistik AB</p>'
  + '<h2>Clause 2 · Delivery</h2><p>Weekly consignments to the mill gate.</p>'
  + '<h2>Clause 4 · Payment Terms</h2><p>Undisputed invoices are payable within thirty (30) days.</p>'
  + '<h2>Clause 6 · Liability</h2><p>Liability is capped at the fees paid in the preceding twelve months.</p>';

const ME    = { id: 'u_wanjiru', name: 'Wanjiru Kamau',  role: 'legal', email: 'wanjiru@wanjiru.co.ke' };
const GRACE = { id: 'u_grace',   name: 'Grace Mwangi',   role: 'legal', email: 'grace@wanjiru.co.ke' };
const DAN   = { id: 'u_dan',     name: 'Daniel Kiptoo',  role: 'legal', email: 'daniel@wanjiru.co.ke' };
const BOSS  = { id: 'u_boss',    name: 'Achieng Otieno', role: 'admin', email: 'achieng@wanjiru.co.ke' };
const EVERYONE = [ME, GRACE, DAN, BOSS];

function contract(over = {}){
  return { id: 'MK-D4', name: 'Cane Supply Agreement',
    counterparty: 'Nordfrakt Logistik AB', template: 'WH', status: 'Under Review',
    folder: 'dist', fields: {}, metadata: {}, audit: [], rounds: [], versions: [],
    signatures: [], comments: [], value: 4800000, redlineText: BODY, format: 'rich', ...over };
}
function world(opts = {}){
  const w = buildWorld({ user: opts.user || ME, ...opts });
  w.win.state = { settings: { deskRule: { on: true, staleDays: opts.staleDays || 5 } },
    contracts: [], activeId: 'MK-D4' };
  w.win.getUsers = () => EVERYONE;
  w.win.userById = id => EVERYONE.find(u => u.id === id) || null;
  w.win.saveSettings = () => {};
  return w;
}
const editIn = (win, c, num, body, over = {}) => {
  const cl = win.negoClauseList(c).find(x => String(x.num) === String(num));
  assert.ok(cl, `clause ${num} must be findable`);
  return win.negoEditClause(c, cl.clauseId, body, { side: 'owner', summary: 'an ask', ...over });
};
async function claimed(opts = {}){
  const w = world(opts);
  const c = contract();
  await editIn(w.win, c, 4, '<p>Undisputed invoices are payable within forty-five (45) days.</p>');
  return { ...w, c };
}
/* One of THEIR proposals, filed on a chosen date, still unanswered. */
async function theirAsk(w, c, num, at){
  const cl = w.win.negoClauseList(c).find(x => String(x.num) === String(num));
  return w.win.negoEditClause(c, cl.clauseId, '<p>Fortnightly consignments to the mill gate.</p>',
    { side: 'counterparty', author: 'Erik Lindqvist · Nordfrakt Logistik AB',
      summary: 'their ask', at });
}

/* ============================================================
   1 — THE WAITING CLOCK
   ============================================================ */
describe('f169 · a deal that has gone quiet is flagged to us, never to them', () => {

  test('nothing is flagged while the ball is on their side', async () => {
    const { win, c } = await claimed();
    assert.equal(win.deskWaitingSince(c), null, 'our own unanswered redline is not them waiting');
    assert.equal(win.deskStale(c), null);
  });

  test('their unanswered proposal starts the clock, counted in working days', async () => {
    const w = await claimed();
    /* Monday 03 Aug 2026 → Monday 10 Aug is five working days, not seven. Five
       calendar days over a weekend is not a week of silence, and flagging it as
       one is how people learn to scroll past the flag. */
    await theirAsk(w, w.c, 2, '2026-08-03T09:00:00.000Z');

    assert.equal(w.win.deskStale(w.c, '2026-08-07T09:00:00.000Z'), null, 'four working days: quiet');
    const s = w.win.deskStale(w.c, '2026-08-10T09:00:00.000Z');
    assert.ok(s, 'five: flagged');
    assert.equal(s.days, 5);
    assert.equal(s.lead.name, ME.name, 'and it names who to ask');
  });

  test('answering it stops the clock', async () => {
    const w = await claimed();
    const ch = await theirAsk(w, w.c, 2, '2026-08-03T09:00:00.000Z');
    assert.ok(w.win.deskStale(w.c, '2026-08-10T09:00:00.000Z'));
    w.win.negoResolve(w.c, ch.id, 'accepted', { side: 'owner' });
    assert.equal(w.win.deskStale(w.c, '2026-08-10T09:00:00.000Z'), null);
  });

  test('the threshold is a setting, because five is a default and not a law', async () => {
    const w = await claimed({ staleDays: 10 });
    await theirAsk(w, w.c, 2, '2026-08-03T09:00:00.000Z');
    assert.equal(w.win.deskStale(w.c, '2026-08-10T09:00:00.000Z'), null);
  });

  test('the lead and an admin see it; a colleague with no say does not', async () => {
    const w = await claimed();
    await theirAsk(w, w.c, 2, '2026-08-03T09:00:00.000Z');
    const at = '2026-08-10T09:00:00.000Z';
    assert.equal(w.win.deskStaleInboxFor([w.c], ME, at).length, 1);
    assert.equal(w.win.deskStaleInboxFor([w.c], BOSS, at).length, 1,
      'somebody has to see the whole board when the lead is away');
    assert.equal(w.win.deskStaleInboxFor([w.c], DAN, at).length, 0);
  });

  test('the counterparty is told nothing about the flag', async () => {
    const w = await claimed();
    await theirAsk(w, w.c, 2, '2026-08-03T09:00:00.000Z');
    if (typeof w.win.buildSharePayload !== 'function') return;
    const s = JSON.stringify(w.win.buildSharePayload(w.c, 'h', { org: 'X', sharedBy: ME.name }));
    assert.equal(/stale|waitingSince|"days"/.test(s), false);
  });
});

/* ============================================================
   2 — THE LEAVER CHECK
   ============================================================ */
describe('f169 · a lead with no account is a negotiation with no door out', () => {

  test('the desks somebody leads are findable before they are removed', async () => {
    const { win, c } = await claimed();
    const other = contract({ id: 'MK-D5' });
    await editIn(win, other, 4, '<p>Payable within sixty (60) days.</p>');
    win.deskHandover(other, GRACE);

    assert.deepEqual(win.deskLedBy([c, other], ME.id).map(x => x.id), ['MK-D4']);
    assert.deepEqual(win.deskLedBy([c, other], GRACE.id).map(x => x.id), ['MK-D5']);
    assert.deepEqual(win.deskLedBy([c, other], DAN.id), []);
  });

  test('a closed desk is not somebody\'s outstanding responsibility', async () => {
    const { win, c } = await claimed();
    win.deskOf(c).closedAt = win.nowISO();
    assert.deepEqual(win.deskLedBy([c], ME.id), []);
  });
});

/* ============================================================
   3 — THE COURTESY NOTE
   ============================================================
   The one sentence about our side that ever crosses the wall. */
describe('f169 · a handover is announced, once, in plain words', () => {

  test('the next round carries it, and the round after does not', async () => {
    const { win, c } = await claimed();
    assert.equal(win.deskAnnouncement(c), null, 'nothing to say before a handover');

    win.deskHandover(c, GRACE);
    const said = win.deskAnnouncement(c);
    assert.ok(said);
    assert.match(said, /Grace Mwangi is now handling this/);

    /* The note is bound to the round it was made in. A sentence that repeated
       every round afterwards would read as an error. */
    c.desk.announce.round = (win.negoRound(c) || 1) - 1;
    assert.equal(win.deskAnnouncement(c), null);
  });

  test('it can be declined, and then nothing travels', async () => {
    const { win, c } = await claimed();
    win.deskHandover(c, GRACE, { tell: false });
    assert.equal(win.deskAnnouncement(c), null);
    if (typeof win.buildSharePayload !== 'function') return;
    const p = win.buildSharePayload(c, 'h', { org: 'X' });
    assert.equal(p.leadNotice, undefined);
  });

  test('the payload names the LEAD as the contact, not whoever pressed send', async () => {
    /* A contributor doing something administrative must not surface on their
       page as a change of contact. The contact is stable across a tenure and
       changes only when the lead does — which is announced. */
    const { win, c } = await claimed();
    if (typeof win.buildSharePayload !== 'function') return;
    assert.equal(win.buildSharePayload(c, 'h', { org: 'X' }).sharedBy, ME.name);

    win.deskHandover(c, GRACE);
    const p = win.buildSharePayload(c, 'h', { org: 'X' });
    assert.equal(p.sharedBy, GRACE.name);
    assert.match(p.leadNotice, /Grace Mwangi/);
  });

  test('and still nothing else about the desk travels', async () => {
    const { win, c } = await claimed();
    win.deskAddContributor(c, DAN);
    win.deskHandover(c, GRACE);
    if (typeof win.buildSharePayload !== 'function') return;
    const s = JSON.stringify(win.buildSharePayload(c, 'h', { org: 'X' }));
    assert.equal(/Daniel Kiptoo/.test(s), false, 'no contributor names');
    assert.equal(/contributors|joinRequests|leadId|"desk"/.test(s), false);
    assert.equal(/Wanjiru Kamau/.test(s), false, 'not even the outgoing lead is named');
  });
});
