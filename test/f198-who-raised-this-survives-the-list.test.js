/* ============================================================
   f198 — who raised a contract survives the list

   THE BUG, REPRODUCED BEFORE IT WAS FIXED. The dashboard's "Decisions due"
   card is built from two halves: contracts where the reader can approve a
   step, and contracts the reader RAISED. The second half asked the audit
   trail:

       const raisedByMe = c => (c.audit||[]).some(a => /creat/i.test(a.action) && a.user === me.name);

   The dashboard reads `state.contracts` — the LIGHT list — and HEAVY strips
   the audit trail out of every list row to keep the register fast. So on a
   real server `c.audit` was undefined for every row, `raisedByMe` answered
   false for everything, and half of that card was dead.

   IT WORKED PERFECTLY IN LOCAL MODE, where there is no server and the records
   are whole. That is why it survived: correct everywhere except in production.

   The fix carries the FACT instead of the trail — the server computes who
   raised a contract in the one place that still has the trail in hand, and
   sends it on the row. Two properties this file exists to hold:

     1. the light row carries it, and the dashboard's own reading works on it
     2. it is TRANSPORT, not a record — a save must not write it back into the
        stored contract, or a derived field quietly becomes a stored one

   The real answer is a stored owner on the contract (WORKORDER-contract-owner)
   and supersedes this. Until then the card has to be true.
   ============================================================ */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { startHati, seedWorkspace } = require('./helpers');

const ROOT = path.join(__dirname, '..');

/* The product's own reading, lifted out of js/views/home.js rather than
   paraphrased — a test that reimplements the thing it is testing proves
   nothing about the thing. */
function raisedByMe(c, me) {
  if (!me) return false;
  if (c && c._raisedBy != null) return c._raisedBy === me.name;
  return ((c && c.audit) || []).some(a => /creat/i.test(a.action || '') && a.user === me.name);
}

const contract = (id, name, who, over = {}) => ({
  id, name, counterparty: 'Someone', folder: 'proc', status: 'Under Review',
  value: 9000000, template: 'RM', fields: {}, comments: [], rounds: [],
  versions: [], signatures: [], compliance: { consent: false },
  audit: [{ at: '2026-08-01T09:00:00.000Z', user: who, action: 'Created', detail: 'Guided creation' }],
  ...over,
});

let h, W;
before(async () => {
  h = await startHati();
  W = await seedWorkspace(h);
  /* An approval rule, so something genuinely needs approving — and an approver
     who is NOT the person raising it, which is the case the "own" half of the
     card exists to cover. */
  await W.admin.json('/api/settings', { method: 'PUT', body: {
    approvalRules: [{ id: 'r1', order: 1, name: 'Value',
      cond: { type: 'value', op: '>=', value: 1 },
      approver: { kind: 'role', role: 'admin' } }] } });
});
after(async () => { await h.stop(); });

const put = (client, c) => client.json('/api/contracts/' + c.id, { method: 'PUT', body: { contract: c, baseVersion: 0 } });
const rowOf = async (client, id) =>
  (await client.json('/api/contracts?limit=200')).rows.find(x => x.id === id);

describe('f198 — the fact rides the row', () => {
  test('THE BUG: a light row has no audit trail at all', async () => {
    await put(W.unrestricted, contract('MK-R1', 'Raised by Asha', 'Unrestricted Legal'));
    const row = await rowOf(W.unrestricted, 'MK-R1');
    assert.ok(row, 'the contract is on the list');
    assert.equal(row.audit, undefined,
      'the trail is stripped on purpose — this is the constraint, not the fault');
  });

  test('and the reading the dashboard actually does now answers TRUE on that row', async () => {
    const row = await rowOf(W.unrestricted, 'MK-R1');
    assert.equal(row._raisedBy, 'Unrestricted Legal', 'the fact is carried instead of the trail');
    assert.equal(raisedByMe(row, { name: 'Unrestricted Legal' }), true,
      'BEFORE THE FIX THIS WAS FALSE — half of Decisions due was dead in server mode');
    assert.equal(raisedByMe(row, { name: 'Somebody Else' }), false,
      'and it is still somebody ELSE\'s contract that does not count');
  });

  test('the full record is unchanged — the trail is still the record', async () => {
    const full = await W.unrestricted.json('/api/contracts/MK-R1');
    assert.equal(full.audit.length, 1, 'opening a contract still gives you its history');
    assert.equal(raisedByMe(full, { name: 'Unrestricted Legal' }), true,
      'and the same reading works there, by either road');
  });

  test('it carries WHEN as well as who, because the same entry has both', async () => {
    const row = await rowOf(W.unrestricted, 'MK-R1');
    assert.equal(row._raisedAt, '2026-08-01T09:00:00.000Z');
  });
});

describe('f198 — what must NOT be answered', () => {
  test('a seeded sample raised nothing — "System" is not a person', async () => {
    /* Every demo contract's trail says System. Answering with it would put the
       whole sample portfolio in somebody's queue. */
    await put(W.admin, contract('MK-R2', 'Seeded', 'System', { seeded: true }));
    const row = await rowOf(W.admin, 'MK-R2');
    assert.equal(row._raisedBy, undefined);
    assert.equal(raisedByMe(row, { name: 'System' }), false);
  });

  test('a contract with no history at all answers nothing rather than guessing', async () => {
    await put(W.admin, contract('MK-R3', 'No trail', 'Nobody', { audit: [] }));
    const row = await rowOf(W.admin, 'MK-R3');
    assert.equal(row._raisedBy, undefined);
  });

  test('an UPLOADED contract counts — it was raised too, by a different verb', async () => {
    await put(W.unrestricted, contract('MK-R4', 'Uploaded paper', 'x', {
      audit: [{ at: '2026-08-02T09:00:00.000Z', user: 'Unrestricted Legal', action: 'Uploaded', detail: 'Received a file' }] }));
    const row = await rowOf(W.unrestricted, 'MK-R4');
    assert.equal(row._raisedBy, 'Unrestricted Legal',
      'Created is not the only way a contract arrives — Uploaded and Migrated are the others');
  });
});

describe('f198 — it is transport, not a record', () => {
  test('a save does not write it back into the stored contract', async () => {
    /* THE FAULT THIS PREVENTS: a light row is saved back (the product does this
       — see saveContract), and a field the server invented for the journey
       becomes a field the record carries. Then it is stale the moment the
       trail says something else, and there are two answers to one question. */
    const row = await rowOf(W.unrestricted, 'MK-R1');
    assert.ok(row._raisedBy, 'it is on the row before we send it back');
    const src = fs.readFileSync(path.join(ROOT, 'js/core.js'), 'utf8');
    const save = src.slice(src.indexOf('async function saveContract'));
    /* The window was 1200 chars; the strip block gained `_brief` and its
       comment on 18 Aug 2026 (WO-2 — the same transport rule, a new field),
       which pushed the date strips past the old measure. Widened in place;
       every claim below is unchanged. */
    assert.match(save.slice(0, 1800), /delete payload\._raisedBy/, 'stripped on the way out');
    assert.match(save.slice(0, 1800), /delete payload\._raisedAt/);
    assert.match(save.slice(0, 1800), /delete payload\._brief/, 'the brief is transport too (WO-2)');
    /* The three dates go the same way, for the same reason. */
    assert.match(save.slice(0, 1800), /delete payload\._signedAt/);
    assert.match(save.slice(0, 1800), /delete payload\._lastAuditAt/);

    /* And proved against the server rather than off the source: send the row
       back the way the product would, then read the stored record. */
    const full = await W.unrestricted.json('/api/contracts/MK-R1');
    const baseVersion = full._v; delete full._v;
    delete full._raisedBy; delete full._raisedAt;      // what saveContract does
    full.counterparty = 'Someone Else';
    await W.unrestricted.json('/api/contracts/MK-R1', { method: 'PUT', body: { contract: full, baseVersion } });
    const after = await W.unrestricted.json('/api/contracts/MK-R1');
    assert.equal(after._raisedBy, undefined, 'the stored record did not gain the field');
    assert.equal(after.audit.length, 1, 'and the trail it is derived from is intact');
    const row2 = await rowOf(W.unrestricted, 'MK-R1');
    assert.equal(row2._raisedBy, 'Unrestricted Legal', 'so the row still computes it fresh every time');
  });
});

/* ============================================================
   THE SAME CAUSE, ONE SCREEN OVER — REPORTS
   ============================================================
   computeReports() reads state.contracts too, and measures two things off the
   audit trail: how long a contract took from raising to signature, and how
   long one has been sitting where it is. Both came back empty on a real
   server. MEASURED before the fix, with a contract raised 20 days ago and
   signed 8 days ago, and another sitting in Draft for 15 days:

       cycle time from the full record : 12 days
       cycle time from the light row   : null
       stage age  from the full record : 15.0 days
       stage age  from the light row   : 0.0 days     <- every contract, always

   The stage-age zero is the nastier of the two: null at least shows as "no
   data", while 0.0 reads as "nothing is stuck", which is the opposite of the
   truth and is exactly the number somebody would act on.
   ============================================================ */
const daysBetween = (a, b) => (a == null || b == null) ? null : Math.max(0, (b - a) / 86400000);
const day = n => new Date(Date.now() - n * 86400000).toISOString();

/* The product's own readings, lifted from js/views/reports.js. */
const _repAt = v => { const t = Date.parse(v || ''); return isNaN(t) ? null : t; };
const firstAuditAt = (c, actions) => { const h = ((c && c.audit) || []).find(a => actions.includes(a.action)); return h ? Date.parse(h.at) : null; };
const repRaisedAt = c => _repAt(c && c._raisedAt) ?? firstAuditAt(c, ['Created', 'Uploaded', 'Migrated']);
const repSignedAt = c => _repAt(c && c._signedAt) ?? firstAuditAt(c, ['Signed']);
const lastActivity = c => {
  const a = (c && c.audit) || [];
  if (a.length) return Date.parse(a[a.length - 1].at);
  return _repAt(c && c._lastAuditAt) ?? _repAt(c && c.lastAction) ?? Date.now();
};

describe('f198 — Reports measures off the same missing trail', () => {
  before(async () => {
    await put(W.admin, contract('MK-CY', 'Cycle', 'Amina Otieno', {
      status: 'Signed',
      audit: [{ at: day(20), user: 'Amina Otieno', action: 'Created', detail: 'x' },
              { at: day(8),  user: 'Amina Otieno', action: 'Signed',  detail: 'x' }] }));
    await put(W.admin, contract('MK-ST', 'Stuck in draft', 'Amina Otieno', {
      status: 'Draft',
      audit: [{ at: day(15), user: 'Amina Otieno', action: 'Created', detail: 'x' }] }));
  });

  test('cycle time is measurable from a light row', async () => {
    const row = await rowOf(W.admin, 'MK-CY');
    const d = daysBetween(repRaisedAt(row), repSignedAt(row));
    assert.ok(d != null, 'BEFORE THE FIX THIS WAS null for every signed contract');
    assert.ok(Math.abs(d - 12) < 0.1, `expected ~12 days, got ${d}`);
  });

  test('and it matches what the full record says, which is the point', async () => {
    const row = await rowOf(W.admin, 'MK-CY');
    const full = await W.admin.json('/api/contracts/MK-CY');
    assert.equal(
      Math.round(daysBetween(repRaisedAt(row), repSignedAt(row))),
      Math.round(daysBetween(repRaisedAt(full), repSignedAt(full))),
      'the light list and the opened contract must not disagree about a figure');
  });

  test('stage age is the age of the contract, not zero', async () => {
    const row = await rowOf(W.admin, 'MK-ST');
    const age = (Date.now() - lastActivity(row)) / 86400000;
    assert.ok(age > 14 && age < 16, `expected ~15 days, got ${age.toFixed(1)}`);
    /* THE OLD READING: no trail, so lastActivity fell through to "now" and the
       age came out 0 — "nothing is stuck", which is the opposite of true. */
    const naive = (Date.now() - (((row.audit || []).length) ? 0 : Date.now())) / 86400000;
    assert.ok(naive < 0.001, 'and the old fall-through really did produce zero');
  });

  test('a seeded sample still gets its dates, even though it has no owner', async () => {
    /* The PERSON and the DATES are different questions: "System" is not
       somebody's queue, but a sample was still raised on a day and its cycle
       time is a real figure. */
    const row = await rowOf(W.admin, 'MK-R2');
    assert.equal(row._raisedBy, undefined, 'no owner');
    assert.ok(row._raisedAt, 'but a raising date');
  });
});
