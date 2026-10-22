/* ============================================================
   f857 — WHAT THEY ALREADY HOLD STAYS WITH THEM
   (22 Oct 2026, the bug log: "a sent change revised later and put under
   review is withheld whole, so the other side loses sight of the version
   they hold")
   ============================================================
   An ask of ours went to them; we revised it (same number, new words); the
   revision was kept back (under review, or — the stage here, since a review's
   record is only written through its own steps — on a contract put on hold,
   whose quiet catch-up carries none of our unsent asks). Both go through ONE
   strip (srvLinkStrip), and it took the change out WHOLE — so the wording they
   had been reading, and could answer, vanished from their page. Now the route
   puts back exactly the entry their copy held, and never the revision:
     1  the browser's copy (which leaves the change out) → they still read the
        version they were sent, not the revision
     2  a hand-built copy carrying the revision → the same: the revision is
        taken out, what they hold goes back
     3  a held change they never had stays out whole (f470's rule untouched)
   Red at the parent: 1 and 2 (the change was gone from their copy).
   ============================================================ */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startHati } = require('./helpers');

let h, admin, version = 0;
const ID = 'MK-HOLD-1';
before(async () => {
  h = await startHati();
  admin = h.client('admin');
  await admin.json('/api/setup', { method: 'POST', body: {
    org: 'Wanjiru Catering Ltd', name: 'Wanjiru Kamau', email: 'wanjiru@w.co.ke',
    password: 'adminpassword1', data: { uid: 900, contracts: [], settings: {} } } });
});
after(async () => { if (h) await h.stop(); });

const SENT = { newText: 'Payable within forty-five (45) days.', hash: 'h-45', createdAt: '2026-10-01T09:00:00.000Z' };
const REV = { newText: 'Payable within sixty (60) days.', hash: 'h-60', createdAt: '2026-10-01T11:00:00.000Z' };
const chg = (id, v, extra = {}) => ({ id, clauseId: 'cl-' + id, clauseLabel: 'Clause 4', changeType: 'modify', status: 'pending',
  summary: 'ask', oldText: 'Payable within thirty (30) days.', ops: [], author: 'Wanjiru Kamau', authorSide: 'owner', ...v, ...extra });
const wire = x => ({ id: x.id, clauseId: x.clauseId, clauseLabel: x.clauseLabel, changeType: x.changeType, status: x.status,
  oldText: x.oldText, newText: x.newText, hash: x.hash, author: x.author, authorSide: x.authorSide, createdAt: x.createdAt });
const base = (changes, more = {}) => ({ ...more, name: 'Cane Supply Agreement', counterparty: 'Nordfrakt Logistik AB', status: 'Under Review',
  folder: 'dist', value: 100, audit: [], versions: [], rounds: [], changes,
  negotiation: { round: 1, turn: 'counterparty', turnAt: '2026-10-01T10:00:00.000Z' } });
async function put(c){
  const r = await admin.raw('/api/contracts/' + ID, { method: 'PUT', body: { contract: { ...c, id: ID }, baseVersion: version } });
  if (r.status === 200) version = r.json.version;
  return r;
}
const payloadOf = changes => ({ kind: 'hati-share', purpose: 'negotiate', org: 'Wanjiru Catering Ltd', sharedBy: 'Wanjiru Kamau',
  contract: { id: ID, name: 'Cane Supply Agreement', status: 'Under Review', changes } });
const theirs = async token => { const r = await h.client('cp').raw('/api/shares/' + token);
  return ((r.json && r.json.payload && r.json.payload.contract && r.json.payload.contract.changes) || []); };

describe('f857 — a revision kept back never takes away the version they hold', () => {
  let token;
  test('0 the ask goes to them on a standing link', async () => {
    assert.equal((await put(base([chg('CHG-001', SENT)]))).status, 200, 'seed');
    const r = await admin.raw('/api/shares', { method: 'POST', body: {
      payload: payloadOf([wire(chg('CHG-001', SENT))]), durable: true,
      recipient: { name: 'Nordfrakt', email: 'erik@nordfrakt.se' }, channel: 'link', purpose: 'negotiate' } });
    assert.equal(r.status, 200, JSON.stringify(r.json));
    token = r.json.token;
    const got = await theirs(token);
    assert.equal(got.length, 1);
    assert.match(got[0].newText, /forty-five/);
    /* we revise it after the send and file a new ask, then the contract is put on hold:
       the quiet catch-up a colleague's browser runs carries none of our unsent asks */
    const revised = chg('CHG-001', REV, { revisions: [{ seq: 1, ...SENT, clauseId: 'cl-CHG-001', changeType: 'modify', oldText: 'Payable within thirty (30) days.', author: 'Wanjiru Kamau' }] });
    const pr = await put(base([revised, chg('CHG-002', { newText: 'Liability is uncapped.', hash: 'h-u', createdAt: '2026-10-01T11:10:00.000Z' },
      { clauseId: 'cl-6', clauseLabel: 'Clause 6' })], { hold: { at: '2026-10-01T11:20:00.000Z', by: 'Wanjiru Kamau', why: 'Waiting on finance' } }));
    assert.equal(pr.status, 200, JSON.stringify(pr.json));
  });

  test('1 a catch-up leaves the revision behind, and they still read the version they were sent', async () => {
    const r = await admin.raw('/api/shares/' + token + '/payload', { method: 'PUT', body: { payload: payloadOf([]), silent: true } });
    assert.equal(r.status, 200, JSON.stringify(r.json));
    const got = await theirs(token);
    const one = got.find(x => x.id === 'CHG-001');
    assert.ok(one, 'the change they were answering is still on their page');
    assert.match(one.newText, /forty-five/, 'in the words they were sent');
  });

  test('2 a copy carrying the revision: the revision is taken out, what they hold goes back', async () => {
    const r = await admin.raw('/api/shares/' + token + '/payload', { method: 'PUT', body: { payload: payloadOf([wire(chg('CHG-001', REV))]), silent: true } });
    assert.equal(r.status, 200, JSON.stringify(r.json));
    const got = await theirs(token);
    assert.equal(got.filter(x => x.id === 'CHG-001').length, 1, 'once, never twice');
    assert.match(got.find(x => x.id === 'CHG-001').newText, /forty-five/);
    assert.ok(!JSON.stringify(got).includes('sixty'), 'the held revision never reaches them');
  });

  test('3 a held change they never had stays out whole', async () => {
    const r = await admin.raw('/api/shares/' + token + '/payload', { method: 'PUT', body: {
      payload: payloadOf([wire(chg('CHG-002', { newText: 'Liability is uncapped.', hash: 'h-u', createdAt: '2026-10-01T11:10:00.000Z' }, { clauseId: 'cl-6' }))]), silent: true } });
    assert.equal(r.status, 200, JSON.stringify(r.json));
    const got = await theirs(token);
    assert.ok(!got.some(x => x.id === 'CHG-002'), 'never sent, held: not on their page');
  });
});
