/* f860 — JAMBO'S STANDING WATCHES ARE THE PERSON'S OWN, AND TELL THEM ONCE
   (owner, 21 Oct 2026: "build the chatbot as recommended" — "tell me when
   Siginon replies", "warn me if any contract renews within 60 days", "remind
   me Friday about the NDA")
   (1) the wall: no session, no watches; a contract outside the person's
       streams is refused as if it were not there (404), never stored
   (2) only mine: a colleague sees none of them, and cannot pause, mark or
       delete them (404)
   (3) the cleaner: a kind HaTi cannot check, a reply with no contract, a
       reminder with no day — refused (400)
   (4) CRUD: start (with the trail's line), pause, resume, delete (with its line)
   (5) the sweep: a reminder due today fires once — the bell reads it until it
       is marked seen — and ends; their note on the contract fires a reply
       watch once; a renewal inside the window and a late obligation fire once
       and never again for the same day; a paused watch does not fire
   (6) a watch on a contract that left the person's streams is neither shown
       nor fired
   AT THE PARENT (a15d058f) every part fails: the routes do not exist (404).
   Run: node --test test/f860-jambo-watches.test.js */
const { test, before, after, describe } = require('node:test');
const assert = require('node:assert/strict');
const { startHati, seedWorkspace, fixtureContract, FOLDER_A, FOLDER_B } = require('./helpers');

/* days relative to the run, never a calendar date (THE DAY IT RUNS) */
const dayOff = n => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
const CONTRACTS = [
  { ...fixtureContract('MK-A1', 'Supply agreement', 'Siginon Group', FOLDER_A, 900000, 'Under Review'), expiry: dayOff(20) },
  { ...fixtureContract('MK-A2', 'Office lease', 'Britam Properties', FOLDER_A, 400000, 'Signed'), expiry: dayOff(400),
    obligations: [{ id: 'ob1', desc: 'Pay the deposit', due: dayOff(-3), status: 'open', party: 'ours' }] },
  { ...fixtureContract('MK-B1', 'Listing agreement', 'Naivas Supermarkets', FOLDER_B, 100000, 'Under Review'), expiry: dayOff(15) },
];

let h, W;
before(async () => { h = await startHati({ HATI_AGENTS_AUTO: 'off' }); W = await seedWorkspace(h, { contracts: CONTRACTS, approvalRules: [] }); });
after(async () => { await h.stop(); });
const mine = async c => (await c.json('/api/me/watches')).watches;
const run = () => W.admin.json('/api/watches/run', { method: 'POST', body: {} });

describe('f860 Jambo\'s watches', () => {
  let reply, remind;
  test('(1) the wall: a session, and only contracts inside the person\'s streams', async () => {
    const anon = h.client('nobody');
    assert.equal((await anon.raw('/api/me/watches')).status, 401);
    assert.equal((await anon.raw('/api/me/watches', { method: 'POST', body: { kind: 'remind', params: { on: dayOff(1) } } })).status, 401);
    const out = await W.restricted.raw('/api/me/watches', { method: 'POST', body: { kind: 'reply', contractId: 'MK-B1' } });
    assert.equal(out.status, 404, 'a contract outside their streams is not there');
    assert.deepEqual(await mine(W.restricted), [], 'and nothing was stored');
    const run403 = await W.restricted.raw('/api/watches/run', { method: 'POST', body: {} });
    assert.equal(run403.status, 403, 'running the sweep by hand is an admin\'s');
  });
  test('(2) only mine: a colleague neither sees nor touches them', async () => {
    reply = (await W.restricted.json('/api/me/watches', { method: 'POST', body: { kind: 'reply', contractId: 'MK-A1' } })).watch;
    assert.ok(reply && reply.id && reply.kind === 'reply' && reply.contractId === 'MK-A1' && !reply.paused);
    assert.deepEqual(await mine(W.unrestricted), [], 'a colleague sees none');
    assert.deepEqual(await mine(W.admin), [], 'nor does an admin');
    for (const [m, body] of [['PATCH', { paused: true }], ['PATCH', { seen: true }], ['DELETE', undefined]])
      assert.equal((await W.unrestricted.raw('/api/me/watches/' + reply.id, { method: m, body })).status, 404, m);
    assert.equal((await mine(W.restricted)).length, 1);
  });
  test('(3) the cleaner refuses what HaTi cannot check', async () => {
    for (const body of [{ kind: 'stock-price' }, { kind: 'reply' }, { kind: 'remind', params: {} }, { kind: 'remind', params: { on: 'Friday' } }]){
      const r = await W.restricted.raw('/api/me/watches', { method: 'POST', body });
      assert.equal(r.status, 400, JSON.stringify(body));
    }
  });
  test('(4) start, pause, resume, delete — and the trail says start and stop', async () => {
    const w = (await W.restricted.json('/api/me/watches', { method: 'POST', body: { kind: 'renewal', params: { days: 30 } } })).watch;
    assert.equal(w.params.days, 30);
    assert.equal((await W.restricted.json('/api/me/watches/' + w.id, { method: 'PATCH', body: { paused: true } })).watch.paused, true);
    assert.equal((await W.restricted.json('/api/me/watches/' + w.id, { method: 'PATCH', body: { paused: false } })).watch.paused, false);
    assert.equal((await W.restricted.raw('/api/me/watches/' + w.id, { method: 'PATCH', body: { paused: 'yes' } })).status, 400);
    await W.restricted.json('/api/me/watches/' + w.id, { method: 'DELETE' });
    assert.ok(!(await mine(W.restricted)).some(x => x.id === w.id));
    const csv = (await W.admin.raw(`/api/trail/export?as=csv&from=${dayOff(-1)}&to=${dayOff(1)}`)).text;
    assert.match(csv, /Started a Jambo watch[^\n]*a renewal within 30 days/);
    assert.match(csv, /Stopped a Jambo watch[^\n]*a renewal within 30 days/);
    assert.doesNotMatch(csv, /Started a Jambo watch[^\n]*Siginon/, 'the trail names no contract');
  });
  test('(5) the sweep fires each hit once; a paused watch does not fire', async () => {
    remind = (await W.restricted.json('/api/me/watches', { method: 'POST', body: { kind: 'remind', params: { on: dayOff(-1), what: 'the NDA' } } })).watch;
    const later = (await W.restricted.json('/api/me/watches', { method: 'POST', body: { kind: 'remind', params: { on: dayOff(30), what: 'later' } } })).watch;
    const renew = (await W.restricted.json('/api/me/watches', { method: 'POST', body: { kind: 'renewal', params: { days: 60 } } })).watch;
    const oblig = (await W.restricted.json('/api/me/watches', { method: 'POST', body: { kind: 'obligation', params: { days: 7 } } })).watch;
    const paused = (await W.restricted.json('/api/me/watches', { method: 'POST', body: { kind: 'remind', params: { on: dayOff(-1), what: 'paused' } } })).watch;
    await W.restricted.json('/api/me/watches/' + paused.id, { method: 'PATCH', body: { paused: true } });
    /* their note lands on MK-A1 after the reply watch began */
    await W.admin.json('/api/contracts/MK-A1/messages', { method: 'POST', body: { topic: 'general', body: 'We accept clause 4.', viaWordComment: true, author: 'Siginon' } });
    const r1 = await run();
    assert.ok(r1.fired >= 4, JSON.stringify(r1));
    const L = Object.fromEntries((await mine(W.restricted)).map(w => [w.id, w]));
    assert.ok(L[remind.id].unseen && L[remind.id].fired.what === 'remind' && L[remind.id].endedAt, 'the reminder fired and ended');
    assert.ok(L[reply.id].unseen && L[reply.id].fired.what === 'reply' && L[reply.id].fired.cid === 'MK-A1' && L[reply.id].endedAt, 'their reply fired and ended');
    assert.ok(L[renew.id].unseen && L[renew.id].fired.what === 'renewal' && L[renew.id].fired.cid === 'MK-A1', 'MK-A1 ends inside 60 days');
    assert.ok(L[oblig.id].unseen && L[oblig.id].fired.what === 'obligation' && L[oblig.id].fired.late, 'the late obligation');
    assert.ok(!L[later.id].fired && !L[later.id].unseen, 'a reminder for later waits');
    assert.ok(!L[paused.id].fired, 'a paused watch does not fire');
    assert.ok(!Object.values(L).some(w => w.fired && w.fired.cid === 'MK-B1'), 'nothing outside their streams');
    /* seen: the bell lets go; the sweep again tells nothing new */
    await W.restricted.json('/api/me/watches/' + remind.id, { method: 'PATCH', body: { seen: true } });
    await W.restricted.json('/api/me/watches/' + renew.id, { method: 'PATCH', body: { seen: true } });
    const r2 = await run();
    const L2 = Object.fromEntries((await mine(W.restricted)).map(w => [w.id, w]));
    assert.equal(L2[remind.id].unseen, false);
    assert.equal(L2[renew.id].unseen, false, 'the same renewal is not told twice');
    assert.equal(L2[renew.id].lastFiredAt, L[renew.id].lastFiredAt);
    assert.equal(r2.fired, 0, JSON.stringify(r2));
  });
  test('(6) a contract that left the person\'s streams: not shown, not fired', async () => {
    const w = (await W.unrestricted.json('/api/me/watches', { method: 'POST', body: { kind: 'reply', contractId: 'MK-B1' } })).watch;
    assert.ok(w && w.id);
    const uid = W.users.unrestricted.id;
    await W.admin.json('/api/settings', { method: 'PUT', body: { folderAccess: { [W.users.restricted.id]: [FOLDER_A], [uid]: [FOLDER_A] } } });
    assert.ok(!(await mine(W.unrestricted)).some(x => x.id === w.id), 'not shown');
    await W.admin.json('/api/contracts/MK-B1/messages', { method: 'POST', body: { topic: 'general', body: 'Signed copy attached.', viaWordComment: true } });
    await run();
    await W.admin.json('/api/settings', { method: 'PUT', body: { folderAccess: { [W.users.restricted.id]: [FOLDER_A] } } });
    const back = (await mine(W.unrestricted)).find(x => x.id === w.id);
    assert.ok(back && !back.fired, 'and it did not fire while they could not see it');
  });
});
