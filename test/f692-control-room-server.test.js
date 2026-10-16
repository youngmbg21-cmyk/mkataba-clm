/* f692 — THE CONTROL ROOM BUILT IN FULL: THE SERVER'S HALF (owner, 16 Oct
   2026: "build and for the 4 decisions, go with your advice")

   Every new route the full build added is a wall, so each is asked from both
   sides of it:
     · POST /api/users/:id/invite — the welcome sent again, only while the
       member has not signed in, only by an admin, recorded on the member
     · PUT /api/me/prefs jamboChips / opensOn — a person's own two flags; a
       value outside the list is refused, never stored
     · GET /api/me/totp, POST /api/me/totp/recovery — the count is your own,
       a fresh set costs a current code
     · /api/settings-asks — Ask an admin as a RECORD: one open ask per person
       per rule, an admin's list and the asker's own, an answer only an admin
       gives (and "no" needs a reason), "seen" only the asker says
     · POST /api/ai/settings-why — the prompt the SERVER assembles: an admin's
       reads the rules and everyone; anybody else's reads their own settings
       only, never a colleague and never the rules

   Run: node --test test/f692-control-room-server.test.js */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startHati, seedWorkspace } = require('./helpers');

let h, W;
before(async () => { h = await startHati(); W = await seedWorkspace(h); });
after(async () => { if (h) await h.stop(); });

describe('f692 — send the welcome again', () => {
  test('only while they have not signed in; only an admin; recorded on the member', async () => {
    const made = await W.admin.json('/api/users', { method: 'POST', body: {
      name: 'Lena Strom', email: 'lena@example.co.ke', role: 'viewer', password: 'temporary-pass-1' } });
    const id = made.user.id;
    assert.equal(made.user.prefs.mustChangePassword, true, 'a new member has not signed in');
    const no = await W.unrestricted.raw('/api/users/' + id + '/invite', { method: 'POST', body: {} });
    assert.equal(no.status, 403, 'an editor cannot send it');
    const r = await W.admin.json('/api/users/' + id + '/invite', { method: 'POST', body: { to: 'someone@else.test' } });
    assert.ok('emailSent' in r && 'outbox' in r, 'the answer says sent, queued or refused');
    assert.ok(r.user.prefs.invitedAgainAt, 'the resend is recorded on the member');
    const already = await W.admin.raw('/api/users/' + W.users.unrestricted.id + '/invite', { method: 'POST', body: {} });
    assert.equal(already.status, 409, 'somebody who has signed in has no invitation to send again');
    const ghost = await W.admin.raw('/api/users/u_nobody/invite', { method: 'POST', body: {} });
    assert.equal(ghost.status, 404);
  });
});

describe('f692 — how a person likes to work', () => {
  test('Jambo\'s suggestions and where a contract opens are the person\'s own, and checked', async () => {
    let r = await W.unrestricted.json('/api/me/prefs', { method: 'PUT', body: { jamboChips: false } });
    assert.equal(r.prefs.jamboChips, false);
    r = await W.unrestricted.json('/api/me/prefs', { method: 'PUT', body: { jamboChips: true } });
    assert.ok(!('jamboChips' in r.prefs), 'on is the default, so it is not stored');
    r = await W.unrestricted.json('/api/me/prefs', { method: 'PUT', body: { opensOn: 'red' } });
    assert.equal(r.prefs.opensOn, 'red');
    r = await W.unrestricted.json('/api/me/prefs', { method: 'PUT', body: { opensOn: 'jambo' } });
    assert.ok(!('opensOn' in r.prefs), 'Jambo is the default, so it is not stored');
    assert.equal((await W.unrestricted.raw('/api/me/prefs', { method: 'PUT', body: { opensOn: 'basement' } })).status, 400, 'a place that does not exist is refused');
    assert.equal((await W.unrestricted.raw('/api/me/prefs', { method: 'PUT', body: { jamboChips: 'no' } })).status, 400, 'a flag is true or false');
  });
});

describe('f692 — recovery codes', () => {
  test('the count is your own, and a fresh set needs two-step to be on and a code', async () => {
    const t = await W.unrestricted.json('/api/me/totp');
    assert.equal(t.on, false); assert.equal(t.recoveryLeft, null, 'no two-step, no codes to count');
    const r = await W.unrestricted.raw('/api/me/totp/recovery', { method: 'POST', body: { code: '123456' } });
    assert.equal(r.status, 400, 'nothing to renew while two-step is off');
  });
});

describe('f692 — ask an admin is a record, tracked until answered', () => {
  let askId;
  test('an editor asks; asking again for the same rule is the same ask; an admin may not ask', async () => {
    const r = await W.unrestricted.json('/api/settings-asks', { method: 'POST', body: {
      what: 'turn on review before sending', why: 'HR offers go out unchecked', panel: 'review', to: 'x@y.z' } });
    assert.equal(r.ask.status, 'open'); assert.equal(r.ask.panel, 'review');
    askId = r.ask.id;
    const again = await W.unrestricted.json('/api/settings-asks', { method: 'POST', body: { what: 'please', panel: 'review' } });
    assert.equal(again.ask.id, askId, 'one open ask per person per rule');
    assert.equal(again.again, true);
    assert.equal((await W.admin.raw('/api/settings-asks', { method: 'POST', body: { what: 'x', panel: 'review' } })).status, 400,
      'an admin changes the setting rather than asking');
    assert.equal((await W.unrestricted.raw('/api/settings-asks', { method: 'POST', body: { what: '' } })).status, 400);
  });
  test('the admin\'s list holds it; another member\'s does not', async () => {
    const a = await W.admin.json('/api/settings-asks');
    assert.ok(a.asks.some(x => x.id === askId), 'it waits in the admins\' list');
    const mine = await W.unrestricted.json('/api/settings-asks');
    assert.ok(mine.asks.some(x => x.id === askId), 'and in the asker\'s own');
    const theirs = await W.restricted.json('/api/settings-asks');
    assert.ok(!theirs.asks.some(x => x.id === askId), 'never in a colleague\'s');
  });
  test('only an admin answers; no needs a reason; an answer is final; seen is the asker\'s', async () => {
    assert.equal((await W.unrestricted.raw('/api/settings-asks/' + askId, { method: 'PATCH', body: { status: 'done' } })).status, 403);
    assert.equal((await W.restricted.raw('/api/settings-asks/' + askId, { method: 'PATCH', body: { seen: true } })).status, 404,
      'a colleague cannot even see it');
    assert.equal((await W.admin.raw('/api/settings-asks/' + askId, { method: 'PATCH', body: { status: 'declined' } })).status, 400,
      'no, without a reason, is refused');
    const r = await W.admin.json('/api/settings-asks/' + askId, { method: 'PATCH', body: { status: 'declined', note: 'Not before the audit' } });
    assert.equal(r.ask.status, 'declined'); assert.equal(r.ask.note, 'Not before the audit'); assert.equal(r.ask.seenAt, null);
    assert.equal((await W.admin.raw('/api/settings-asks/' + askId, { method: 'PATCH', body: { status: 'done' } })).status, 409, 'an answer is final');
    const seen = await W.unrestricted.json('/api/settings-asks/' + askId, { method: 'PATCH', body: { seen: true } });
    assert.ok(seen.ask.seenAt, 'the asker has read the answer');
  });
});

describe('f692 — why, asked of the rules: the server builds what Jambo reads', () => {
  test('an admin\'s prompt reads the rules and everyone; an editor\'s reads only their own', async () => {
    const before = h.ai.calls.length;
    await W.admin.raw('/api/ai/settings-why', { method: 'POST', body: { q: 'Why can\'t Restricted Legal sign the Kisumu deal?' } });
    await W.unrestricted.raw('/api/ai/settings-why', { method: 'POST', body: { q: 'Why can\'t I sign?' } });
    const calls = h.ai.calls.slice(before).map(c => JSON.stringify(c));
    assert.equal(calls.length, 2, 'one Jambo call each');
    assert.ok(calls[0].includes('Restricted Legal') && calls[0].includes('No Values Legal'), 'the admin\'s reads every member');
    assert.ok(/rules \(stored settings\)/.test(calls[0]), 'and the rules');
    assert.ok(calls[1].includes('Unrestricted Legal'), 'the editor\'s reads their own settings');
    assert.ok(!calls[1].includes('Restricted Legal') && !calls[1].includes('No Values Legal'), 'and no colleague');
    assert.ok(/not shown to them/.test(calls[1]) && !/rules \(stored settings\)/.test(calls[1]), 'and never the rules');
    assert.equal((await W.unrestricted.raw('/api/ai/settings-why', { method: 'POST', body: { q: '' } })).status, 400, 'an empty question is not sent');
  });
});
