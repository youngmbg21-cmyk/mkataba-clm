/* ============================================================
   f199 — a contract knows whose it is

   Nothing on a contract said who raised it. The fact lived only in the first
   line of its audit trail — a HISTORY, queried rather than read, and stripped
   out of every list row — so no question of the shape "which contracts are
   Asha's" could be answered at all. That is what killed half the dashboard's
   Decisions-due card and both of Reports' timing figures (f198).

   `c.owner = { id, name }` is the record that replaces the query.

   What this file pins:

     · EVERY creation site stamps it — walked against the same list f170 uses,
       so the eighth site somebody writes next year fails the suite rather
       than silently producing an ownerless contract
     · it is stamped ONCE and never overwritten
     · every contract raised before the field existed is backfilled from its
       own trail, narrowly: 'System' is not an owner, a name with no account
       still counts, and a stored owner is never rewritten
     · the stored owner outranks the stop-gap the server was carrying
   ============================================================ */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { JSDOM } = require('jsdom');
const { startHati, seedWorkspace } = require('./helpers');

const ROOT = path.join(__dirname, '..');

/* THE SAME EIGHT f170 WALKS. Kept as its own copy on purpose: if somebody
   adds a creation site they must add it to both lists, and a test that
   imported the other file's list would silently inherit a gap.

   The eighth arrived on 14 Aug 2026 and is the reason that reasoning earns its
   keep: js/family.js writes an amendment from blank paper, and it is the one
   creation site that deliberately does NOT send its draft to Key terms — so it
   is an exception in f170's list and an ordinary member of this one. Both
   facts have to be stated separately, which is exactly what two lists buy. */
const CREATORS = [
  'js/wizard.js',              // the guided draft
  'js/app.js',                 // straight from a built-in template
  'js/templatefields.js',      // a library template with a form
  'js/views/templatelib.js',   // the versioned standard-template library
  'js/views/library.js',       // the clause library's own draft
  'js/views/contract.js',      // "Draft new agreement" from the room
  'js/views/migration.js',     // an imported / migrated agreement
  'js/family.js',              // "Create an amendment" from the family card
];

describe('f199 — every creation site stamps an owner', () => {
  for (const f of CREATORS) {
    test(`${f} stamps the owner before it files the contract`, () => {
      const src = fs.readFileSync(path.join(ROOT, f), 'utf8');
      assert.match(src, /state\.contracts\.unshift\(c\);/, 'this file is expected to create contracts');
      const at = src.indexOf('state.contracts.unshift(c);');
      const before = src.slice(Math.max(0, at - 300), at);
      assert.match(before, /contractOwnerStamp\(c\)/,
        `${f} files a contract without stamping who raised it`);
    });
  }

  test('and f170 knows about every one of them — the two lists must not drift', () => {
    /* COMPARED BY NAME, NOT BY LENGTH. It was a length check, and a length
       check stopped being able to answer this question on 14 Aug 2026: f170's
       array is the sites that send a new draft to Key terms, and js/family.js
       is a creation site that deliberately does not, so it is named in a test
       of its own there rather than in the array. Counting rows would now
       report a drift that is really a documented exception — and, worse, would
       go on passing if somebody swapped one file for another. */
    const f170 = fs.readFileSync(path.join(ROOT, 'test/f170-a-new-draft-opens-on-key-terms.test.js'), 'utf8');
    const missing = CREATORS.filter(f => !f170.includes(f));
    assert.deepEqual(missing, [],
      'f170 does not know about a creation site this file does: ' + missing.join(', '));

    /* And the other way round, which is the half that catches a NEW site added
       to f170 alone: every js/ file f170 names must be here too. */
    const named = [...new Set((f170.match(/'js\/[A-Za-z0-9/._-]+\.js'/g) || [])
      .map(s => s.slice(1, -1)))];
    const notHere = named.filter(f => !CREATORS.includes(f));
    assert.deepEqual(notHere, [],
      'f170 walks a creation site this file does not: ' + notHere.join(', '));
  });
});

/* ---------- the model, on a real DOM ---------- */
function stage(opts = {}) {
  const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'https://hati.test/' });
  const me = { id: 'u_me', name: 'Young Mbagaya', role: 'admin' };
  const gone = { id: 'u_gone', name: 'Left The Company', role: 'legal' };
  const sb = {
    console, Date, Math, JSON, Number, String, Object, Array, Boolean, RegExp, Set, Map, Error,
    isNaN, parseInt, parseFloat, Promise, setTimeout: fn => { fn(); return 0; }, clearTimeout() {},
    document: dom.window.document, localStorage: dom.window.localStorage,
    currentUser: () => (opts.signedOut ? null : me),
    getUsers: () => [me, gone],
    TEMPLATES: {}, FOLDERS: {}, state: { contracts: [], settings: {} },
    toast() {}, esc: x => x, nowISO: () => 'now',
  };
  sb.window = sb; sb.globalThis = sb;
  vm.createContext(sb);
  /* Only the two functions under test, lifted out of core.js — the whole file
     needs a shell this test has no business building. */
  const src = fs.readFileSync(path.join(ROOT, 'js/core.js'), 'utf8');
  const grab = name => {
    const i = src.indexOf('function ' + name + '(');
    assert.ok(i > 0, name + ' not found in core.js');
    let depth = 0, j = src.indexOf('{', i);
    for (let k = j; k < src.length; k++) {
      if (src[k] === '{') depth++;
      else if (src[k] === '}') { depth--; if (!depth) return src.slice(i, k + 1); }
    }
  };
  vm.runInContext("const OWNER_FROM_ACTIONS=['Created','Uploaded','Migrated'];", sb);
  vm.runInContext(grab('contractOwnerStamp'), sb);
  vm.runInContext(grab('_repairOwner'), sb);
  vm.runInContext(grab('contractOwnedBy'), sb);
  vm.runInContext(grab('contractOwnerName'), sb);
  return { sb, me, gone };
}

describe('f199 — stamped once, never overwritten', () => {
  test('a new contract gets the signed-in person, id and name', () => {
    const { sb, me } = stage();
    const c = sb.contractOwnerStamp({ id: 'MK-1' });
    assert.deepEqual({ ...c.owner }, { id: me.id, name: me.name });
  });

  test('an owner already on the record is left alone', () => {
    const { sb } = stage();
    const c = sb.contractOwnerStamp({ id: 'MK-1', owner: { id: 'u_other', name: 'Somebody Else' } });
    assert.equal(c.owner.name, 'Somebody Else',
      'whoever raised it, raised it — handing it over is a different act');
  });

  test('with nobody signed in it says nothing rather than guessing', () => {
    const { sb } = stage({ signedOut: true });
    assert.equal(sb.contractOwnerStamp({ id: 'MK-1' }).owner, undefined);
  });
});

describe('f199 — the backfill is narrow', () => {
  const withTrail = (user, action = 'Created') => ({ id: 'MK-1',
    audit: [{ at: '2026-08-01T00:00:00.000Z', user, action, detail: 'x' }] });

  test('an old contract gets its owner from its own trail, with the id resolved', () => {
    const { sb, me } = stage();
    const c = sb._repairOwner(withTrail(me.name));
    assert.deepEqual({ ...c.owner }, { id: me.id, name: me.name });
  });

  test('somebody who has left still raised it — the name stands with no id', () => {
    const { sb, gone } = stage();
    const c = sb._repairOwner(withTrail(gone.name));
    assert.equal(c.owner.name, gone.name);
    assert.equal(c.owner.id, gone.id, 'they are still on the roster here');
    const gone2 = sb._repairOwner(withTrail('Nobody At All'));
    assert.deepEqual({ ...gone2.owner }, { id: null, name: 'Nobody At All' },
      'and an account that no longer exists keeps the name it was raised under');
  });

  test('"System" is not an owner — the seeded portfolio belongs to nobody', () => {
    const { sb } = stage();
    assert.equal(sb._repairOwner(withTrail('System')).owner, undefined);
  });

  test('Uploaded and Migrated count; a decision or a signature does not', () => {
    const { sb, me } = stage();
    assert.ok(sb._repairOwner(withTrail(me.name, 'Uploaded')).owner);
    assert.ok(sb._repairOwner(withTrail(me.name, 'Migrated')).owner);
    assert.equal(sb._repairOwner(withTrail(me.name, 'Signed')).owner, undefined,
      'signing a contract is not raising it');
  });

  test('a stored owner is never rewritten by the backfill', () => {
    const { sb } = stage();
    const c = { ...withTrail('Young Mbagaya'), owner: { id: null, name: 'Recorded Earlier' } };
    assert.equal(sb._repairOwner(c).owner.name, 'Recorded Earlier');
  });

  test('a contract with no trail at all is left alone', () => {
    const { sb } = stage();
    assert.equal(sb._repairOwner({ id: 'MK-1', audit: [] }).owner, undefined);
  });

  test('migrateContract runs the backfill — it is not a function somebody has to remember', () => {
    const src = fs.readFileSync(path.join(ROOT, 'js/core.js'), 'utf8');
    const fn = src.slice(src.indexOf('function migrateContract'));
    assert.match(fn.slice(0, 400), /_repairOwner\(/,
      'the repair has to ride the one function every stored record passes through');
  });
});

describe('f199 — reading it', () => {
  test('the owner answers for a person by id, and by name where there is no id', () => {
    const { sb, me } = stage();
    assert.equal(sb.contractOwnedBy({ owner: { id: me.id, name: 'Renamed Since' } }, me), true,
      'the id survives a rename');
    assert.equal(sb.contractOwnedBy({ owner: { id: null, name: me.name } }, me), true,
      'and the name answers where the account is gone');
    assert.equal(sb.contractOwnedBy({ owner: { id: 'u_other', name: 'X' } }, me), false);
  });

  test('a light row with no stored owner still answers from what the server carried', () => {
    const { sb, me } = stage();
    assert.equal(sb.contractOwnedBy({ _raisedBy: me.name, _light: true }, me), true);
    assert.equal(sb.contractOwnerName({ _raisedBy: me.name }), me.name);
  });
});

/* ---------- and the server ---------- */
let h, W;
before(async () => { h = await startHati(); W = await seedWorkspace(h); });
after(async () => { await h.stop(); });

describe('f199 — the stored owner outranks the stop-gap', () => {
  test('a contract with an owner reports THAT owner on the list, not the trail', async () => {
    /* The trail says one person, the stored owner says another. The record is
       the senior of the two — otherwise a contract handed over later would go
       on reporting whoever first typed it. */
    const c = { id: 'MK-OWN2', name: 'Owned', counterparty: 'X', folder: 'proc',
      status: 'Draft', value: 1, template: 'RM', fields: {}, comments: [], rounds: [],
      versions: [], signatures: [], compliance: {},
      owner: { id: 'u_x', name: 'The Stored Owner' },
      audit: [{ at: '2026-08-01T00:00:00.000Z', user: 'Whoever Typed It', action: 'Created', detail: 'x' }] };
    await W.admin.json('/api/contracts/MK-OWN2', { method: 'PUT', body: { contract: c, baseVersion: 0 } });
    const row = (await W.admin.json('/api/contracts?limit=200')).rows.find(x => x.id === 'MK-OWN2');
    assert.equal(row._raisedBy, 'The Stored Owner');
  });

  test('and the owner itself survives the round trip', async () => {
    const full = await W.admin.json('/api/contracts/MK-OWN2');
    assert.equal(full.owner.name, 'The Stored Owner');
    assert.equal(full.owner.id, 'u_x');
  });

  test('a contract with no owner still falls back to its trail', async () => {
    const c = { id: 'MK-OWN3', name: 'Unowned', counterparty: 'X', folder: 'proc',
      status: 'Draft', value: 1, template: 'RM', fields: {}, comments: [], rounds: [],
      versions: [], signatures: [], compliance: {},
      audit: [{ at: '2026-08-01T00:00:00.000Z', user: 'Amina Otieno', action: 'Created', detail: 'x' }] };
    await W.admin.json('/api/contracts/MK-OWN3', { method: 'PUT', body: { contract: c, baseVersion: 0 } });
    const row = (await W.admin.json('/api/contracts?limit=200')).rows.find(x => x.id === 'MK-OWN3');
    assert.equal(row._raisedBy, 'Amina Otieno', 'the stop-gap still covers what was never backfilled');
  });
});

/* ============================================================
   OVERSEEN BY — the per-person approver the owner field unlocks
   ============================================================
   It hangs on the contract's OWNER. Keying it off the READER would make the
   approval panel say different things to different people, which is the fault
   this rulebook opens with; keying it off the negotiation lead would only work
   on contracts with an argument running. Neither is honest, and neither was
   possible to avoid until a contract knew whose it was.

   Warn before enforce, like everything else: OFF by default.
   ============================================================ */
function chainStage(opts = {}) {
  const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'https://hati.test/' });
  const boss = { id: 'u_boss', name: 'Grace Njeri', role: 'legal' };
  const asha = { id: 'u_ed', name: 'Asha Kimani', role: 'legal', overseerId: opts.noOverseer ? null : boss.id };
  const admin = { id: 'u_admin', name: 'Young', role: 'admin' };
  const sb = {
    console, Date, Math, JSON, Number, String, Object, Array, Boolean, RegExp, Set, Map, Error,
    isNaN, parseInt, parseFloat, Promise, setTimeout: fn => { fn(); return 0; }, clearTimeout() {},
    document: dom.window.document, localStorage: dom.window.localStorage,
    currentUser: () => admin, getUsers: () => [admin, asha, boss],
    isAdmin: () => true, roleName: r => r, toast() {}, esc: x => x, icon: () => '',
    nowISO: () => 'now', saveSettings() {}, i18t: k => k, i18tn: k => k,
    FOLDERS: {}, TEMPLATES: {}, canEdit: () => true, logAudit() {}, persist() {},
    isMonetary: () => true, fmtMoneyShort: n => String(n),
    contractOwnerName: c => (c && c.owner && c.owner.name) || (c && c._raisedBy) || null,
    approvalRules: () => opts.rules || [],
    state: { contracts: [], settings: opts.on ? { overseer: { on: true } } : {} },
  };
  sb.window = sb; sb.globalThis = sb;
  vm.createContext(sb);
  for (const f of ['js/i18n.js', 'js/jurisdiction.js', 'js/approvals.js'])
    vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), sb, { filename: f });
  sb.approvalRules = () => opts.rules || [];
  return { sb, asha, boss, admin };
}
const owned = (by, over = {}) => ({ id: 'MK-1', name: 'Deal', value: 100, status: 'Draft',
  folder: 'proc', owner: by ? { id: by.id, name: by.name } : undefined, ...over });

describe('f199 — overseen by', () => {
  test('OFF by default — a named overseer adds no step at all', () => {
    const { sb, asha } = chainStage();
    assert.equal(sb.overseerEnforced(), false);
    assert.deepEqual(Array.from(sb.buildApprovalChain(owned(asha))), []);
  });

  test('ON, it joins the ONE chain as a final step naming the overseer', () => {
    const { sb, asha, boss } = chainStage({ on: true });
    const chain = sb.buildApprovalChain(owned(asha));
    assert.equal(chain.length, 1);
    assert.equal(chain[0].approver.kind, 'member');
    assert.equal(chain[0].approver.name, boss.name);
    assert.equal(chain[0].status, 'pending');
  });

  test('and it sorts LAST, after the ordinary rules', () => {
    const rules = [{ id: 'r1', order: 1, name: 'Value', cond: { type: 'value', op: '>=', value: 1 },
      approver: { kind: 'role', role: 'admin' } }];
    const { sb, asha, boss } = chainStage({ on: true, rules });
    const chain = sb.buildApprovalChain(owned(asha));
    assert.equal(chain.length, 2);
    assert.equal(chain[0].approver.role, 'admin', 'the money rule first');
    assert.equal(chain[1].approver.name, boss.name, 'the overseer signs off last');
  });

  test('A CONTRACT NOBODY RAISED GETS NO OVERSEER STEP — imported paper is not stranded', () => {
    const { sb } = chainStage({ on: true });
    assert.deepEqual(Array.from(sb.buildApprovalChain(owned(null))), [],
      'no owner, no overseer — the ordinary rules still apply and nothing is unapprovable');
  });

  test('a member with nobody named over them adds nothing', () => {
    const { sb, asha } = chainStage({ on: true, noOverseer: true });
    assert.deepEqual(Array.from(sb.buildApprovalChain(owned(asha))), []);
  });

  test('an overseer whose account has gone adds nothing rather than a dead step', () => {
    const { sb } = chainStage({ on: true });
    const ghost = { id: 'u_ghost', name: 'Ghost' };
    assert.deepEqual(Array.from(sb.buildApprovalChain(owned(ghost))), [],
      'the owner is not on the roster, so there is nobody to look up');
  });

  test('a decision already taken survives the chain being rebuilt', () => {
    /* buildApprovalChain runs on EVERY read; a step whose approval was erased
       on the next read is the fault this preservation exists for. */
    const { sb, asha } = chainStage({ on: true });
    const c = owned(asha);
    c.approvalChain = [{ ruleId: sb.OVERSEER_STEP_ID, status: 'approved', by: 'Grace Njeri', at: 'then' }];
    const chain = sb.buildApprovalChain(c);
    assert.equal(chain[0].status, 'approved');
    assert.equal(chain[0].by, 'Grace Njeri');
  });

  test('nobody oversees themselves, even if the record says so', () => {
    const { sb, asha } = chainStage({ on: true });
    asha.overseerId = asha.id;
    assert.deepEqual(Array.from(sb.buildApprovalChain(owned(asha))), []);
  });
});

describe('f199 — the server guards the grant', () => {
  test('a member cannot pick their own overseer, or anybody else\'s', async () => {
    const r = await W.unrestricted.raw('/api/users/' + W.users.unrestricted.id,
      { method: 'PATCH', body: { overseerId: W.users.restricted.id } });
    assert.equal(r.status, 403, 'somebody who could pick their own approver is not overseen');
    const smuggled = await W.unrestricted.raw('/api/users/' + W.users.unrestricted.id,
      { method: 'PATCH', body: { title: 'Fine', overseerId: W.users.restricted.id } });
    assert.equal(smuggled.status, 403, 'and it cannot ride along with a job title');
  });

  test('an admin sets it, and it round-trips', async () => {
    const r = await W.admin.json('/api/users/' + W.users.unrestricted.id,
      { method: 'PATCH', body: { overseerId: W.users.restricted.id } });
    assert.equal(r.user.overseerId, W.users.restricted.id);
    const cleared = await W.admin.json('/api/users/' + W.users.unrestricted.id,
      { method: 'PATCH', body: { overseerId: null } });
    assert.equal(cleared.user.overseerId, null);
  });

  test('self, a stranger and a Viewer are each refused', async () => {
    const id = W.users.unrestricted.id;
    const self = await W.admin.raw('/api/users/' + id, { method: 'PATCH', body: { overseerId: id } });
    assert.equal(self.status, 400);
    assert.match(self.json.error, /own contracts/i);
    const ghost = await W.admin.raw('/api/users/' + id, { method: 'PATCH', body: { overseerId: 'u_nobody' } });
    assert.equal(ghost.status, 400);
    const v = await W.admin.json('/api/users', { method: 'POST', body: {
      name: 'Reads Only Two', email: 'reads2@example.co.ke', role: 'viewer', password: 'temporary-pass-1' } });
    const asViewer = await W.admin.raw('/api/users/' + id, { method: 'PATCH', body: { overseerId: v.user.id } });
    assert.equal(asViewer.status, 400, 'a Viewer cannot approve a contract');
  });
});
