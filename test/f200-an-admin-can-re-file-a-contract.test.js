/* ============================================================
   f200 — which drawer a contract is filed in is an admin's to change

   TWO HALVES, AND THE SECOND ONE NOBODY ASKED FOR IS THE URGENT ONE.

   The ask was "admins should be able to move a contract to a different
   folder". Checking the server first turned up the opposite problem: PUT
   /api/contracts/:id asked TWO questions about folders and both of them were
   SCOPE questions —

       if (existing && !inScope(scope, existing.folder)) return 404;   // where it IS
       if (!inScope(scope, contract.folder))            return 403;    // where it is GOING

   — so an Editor sending back a contract with a different `folder` had it
   re-filed. No refusal, no audit line, nobody told. The interface never
   offered the control, which is the only reason it had not happened by
   accident.

   So this file holds BOTH: the gap closed for everybody, and the control
   added for an admin. Building the second without the first would have
   shipped a feature saying "admins only" over a rule that was not enforced.

   THE GUARD IS ASKED AS A DIFFERENCE, like every other guard on that route.
   This route receives the whole contract on every save and every ordinary save
   carries the folder unchanged, so the question is never "may this person
   touch folders" — that would refuse a viewer saving a note — but "does this
   save MOVE the contract, and is the caller an admin".

   The browser half (the picker drawn for an admin and not for an Editor) is
   PIXELS and is proved in a browser: test/chromium/refile-a-contract-verify.js.
   ============================================================ */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { startHati, seedWorkspace, FOLDER_A, FOLDER_B } = require('./helpers');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

const contract = (id, folder, over = {}) => ({
  id, name: 'Re-filing subject', counterparty: 'Someone', folder,
  status: 'Under Review', value: 4000000, template: 'RM', fields: {},
  comments: [], rounds: [], versions: [], signatures: [], compliance: { consent: false },
  audit: [{ at: '2026-08-01T09:00:00.000Z', user: 'Amina Otieno', action: 'Created', detail: 'Guided creation' }],
  ...over,
});

let h, W;
before(async () => { h = await startHati(); W = await seedWorkspace(h); });
after(async () => { await h.stop(); });

const put = (client, c, v = 0) =>
  client.json('/api/contracts/' + c.id, { method: 'PUT', body: { contract: c, baseVersion: v } });
const raw = (client, c, v = 0) =>
  client.raw('/api/contracts/' + c.id, { method: 'PUT', body: { contract: c, baseVersion: v } });
const load = async (client, id) => {
  const full = await client.json('/api/contracts/' + id);
  const baseVersion = full._v; delete full._v;
  return { full, baseVersion };
};

/* ============================================================
   THE GAP, CLOSED
   ============================================================ */
describe('f200 — a non-admin cannot move a contract', () => {
  before(async () => { await put(W.admin, contract('MK-MV1', FOLDER_A)); });

  test('THE FAULT: before this guard, an Editor re-filed a contract by saving it', async () => {
    /* This is the request that used to work. It is refused now, and the
       refusal is what the test asserts — but the shape of the request is the
       record of what was possible. */
    const { full, baseVersion } = await load(W.unrestricted, 'MK-MV1');
    full.folder = FOLDER_B;
    const r = await raw(W.unrestricted, full, baseVersion);
    assert.equal(r.status, 403, 'an Editor moving a contract is refused');
    assert.match(r.json.error, /only an admin can move it/i, 'and told who can');
    assert.match(r.json.error, new RegExp(FOLDER_A), 'the refusal names the drawer it is in');
  });

  test('and the contract did not move', async () => {
    const { full } = await load(W.admin, 'MK-MV1');
    assert.equal(full.folder, FOLDER_A);
  });

  test('the refusal carries the move it refused, so a screen can say what happened', async () => {
    const { full, baseVersion } = await load(W.unrestricted, 'MK-MV1');
    full.folder = FOLDER_B;
    const r = await raw(W.unrestricted, full, baseVersion);
    assert.deepEqual(r.json.folderMove, { from: FOLDER_A, to: FOLDER_B });
  });

  test('AN ORDINARY SAVE BY THE SAME PERSON STILL PASSES — this is a difference, not a gate', async () => {
    /* The whole reason the guard is asked as a difference. An Editor edits key
       terms, metadata and obligations all day, and every one of those saves
       carries the folder along unchanged. */
    const { full, baseVersion } = await load(W.unrestricted, 'MK-MV1');
    full.counterparty = 'A new counterparty';
    const r = await raw(W.unrestricted, full, baseVersion);
    assert.equal(r.status, 200, 'a save that leaves the folder alone is untouched by this rule');
    const after = await W.admin.json('/api/contracts/MK-MV1');
    assert.equal(after.counterparty, 'A new counterparty', 'and the edit landed');
    assert.equal(after.folder, FOLDER_A);
  });
});

describe('f200 — an admin can', () => {
  test('an admin moving the same contract lands', async () => {
    const { full, baseVersion } = await load(W.admin, 'MK-MV1');
    full.folder = FOLDER_B;
    full.audit = (full.audit || []).concat([{ at: new Date().toISOString(), user: 'Amina Otieno',
      action: 'Re-filed', detail: `Re-filed from ${FOLDER_A} to ${FOLDER_B} by Amina Otieno` }]);
    const r = await raw(W.admin, full, baseVersion);
    assert.equal(r.status, 200);
    const after = await W.admin.json('/api/contracts/MK-MV1');
    assert.equal(after.folder, FOLDER_B, 'it moved');
  });

  test('the audit line names both drawers and the person', async () => {
    const after = await W.admin.json('/api/contracts/MK-MV1');
    const line = (after.audit || []).find(a => a.action === 'Re-filed');
    assert.ok(line, 'a contract quietly changing drawer is exactly what somebody needs to reconstruct later');
    assert.match(line.detail, new RegExp(FOLDER_A), 'where it came from');
    assert.match(line.detail, new RegExp(FOLDER_B), 'where it went');
    assert.match(line.detail, /Amina Otieno/, 'and who moved it');
  });

  test('the light list agrees, so every screen reading the register moves with it', async () => {
    const row = (await W.admin.json('/api/contracts?limit=200')).rows.find(x => x.id === 'MK-MV1');
    assert.equal(row.folder, FOLDER_B, 'the projected column follows the record');
  });
});

/* ============================================================
   D-1 — A SIGNED CONTRACT CAN STILL BE MOVED
   ============================================================
   Filing is housekeeping, not part of the agreement: nothing in the executed
   document mentions the drawer, and a mis-filed executed contract is precisely
   the one you most want to be able to find. `folder` is deliberately absent
   from EXECUTED_IMMUTABLE, and this pins that it stays absent.
   ============================================================ */
describe('f200 — D-1: an executed contract is still filed somewhere', () => {
  before(async () => {
    await put(W.admin, contract('MK-MV-SIGNED', FOLDER_A, {
      status: 'Signed', signedAt: '2026-08-05T09:00:00.000Z', hash: 'abc123',
      signatures: [{ name: 'Amina Otieno', at: '2026-08-05T09:00:00.000Z', method: 'session-authenticated' }],
      execution: { at: '2026-08-05T09:00:00.000Z' },
    }));
  });

  test('an admin may re-file it', async () => {
    const { full, baseVersion } = await load(W.admin, 'MK-MV-SIGNED');
    full.folder = FOLDER_B;
    const r = await raw(W.admin, full, baseVersion);
    assert.equal(r.status, 200, 'the executed-immutable list does not carry `folder`, deliberately');
    assert.equal((await W.admin.json('/api/contracts/MK-MV-SIGNED')).folder, FOLDER_B);
  });

  test('folder is not on the executed-immutable list, and this is why', () => {
    const src = read('server/server.js');
    const list = src.slice(src.indexOf('const EXECUTED_IMMUTABLE'), src.indexOf('const SEAL_ACQUIRABLE'));
    assert.ok(!/'folder'/.test(list),
      'if somebody adds it, a mis-filed executed contract becomes permanently mis-filed');
  });

  test('but an Editor still cannot move it — the two rules are independent', async () => {
    const { full, baseVersion } = await load(W.unrestricted, 'MK-MV-SIGNED');
    full.folder = FOLDER_A;
    const r = await raw(W.unrestricted, full, baseVersion);
    assert.equal(r.status, 403);
    assert.match(r.json.error, /only an admin can move it/i);
  });
});

/* ============================================================
   D-2 — THE SCOPE CHECKS STAY, AND THEY ANSWER A DIFFERENT QUESTION
   ============================================================ */
describe('f200 — the scope checks are untouched', () => {
  test('a contract cannot be filed into a stream the caller cannot see', async () => {
    /* The restricted member holds FOLDER_A only. This refusal is the OLD one
       and it must survive: it is what stops a move being a one-request way to
       make a record disappear, if the control is ever widened past admins. */
    await put(W.admin, contract('MK-MV-SCOPE', FOLDER_A));
    const { full, baseVersion } = await load(W.restricted, 'MK-MV-SCOPE');
    full.folder = FOLDER_B;
    const r = await raw(W.restricted, full, baseVersion);
    assert.equal(r.status, 403, 'refused either way — this is belt and braces, on purpose');
  });

  test('and a contract in a stream they cannot see is still invisible, therefore unwritable', async () => {
    await put(W.admin, contract('MK-MV-HIDDEN', FOLDER_B));
    const r = await W.restricted.raw('/api/contracts/MK-MV-HIDDEN', { method: 'PUT',
      body: { contract: contract('MK-MV-HIDDEN', FOLDER_B), baseVersion: 1 } });
    assert.equal(r.status, 404, 'invisible answers 404, not 403 — you cannot be told it exists');
  });
});

/* ============================================================
   CREATION IS NOT A MOVE
   ============================================================ */
describe('f200 — the creation case is not caught', () => {
  test('an Editor can still create a contract in a folder they can see', async () => {
    const r = await raw(W.unrestricted, contract('MK-MV-NEW', FOLDER_B));
    assert.equal(r.status, 200,
      'a contract that did not exist a moment ago has no previous drawer to have been moved out of');
    assert.equal((await W.admin.json('/api/contracts/MK-MV-NEW')).folder, FOLDER_B);
  });

  test('the guard is written to ask that — it is conditioned on `existing`', () => {
    const src = read('server/server.js');
    const guard = src.slice(src.indexOf('WHICH DRAWER A CONTRACT IS FILED IN'));
    const body = guard.slice(0, guard.indexOf('A SIGNING STEP RESERVED'));
    assert.match(body, /if \(prev && req\.user\.role !== 'admin'/,
      'no prev means no move — the same shape every difference-guard on this route uses');
  });
});

/* ============================================================
   WHO CAN SEE IT AFTERWARDS — ASKED OF THE SERVER, NOT OF A SCREEN
   ============================================================
   The whole reason the control confirms before it acts: re-filing changes who
   can open the contract. Two members on different folder lists, one contract,
   moved across.
   ============================================================ */
describe('f200 — a move changes who can open it', () => {
  before(async () => { await put(W.admin, contract('MK-MV-SEE', FOLDER_A)); });

  test('the restricted member can see it while it is in their stream', async () => {
    const r = await W.restricted.raw('/api/contracts/MK-MV-SEE');
    assert.equal(r.status, 200);
  });

  test('an admin moves it out of their stream', async () => {
    const { full, baseVersion } = await load(W.admin, 'MK-MV-SEE');
    full.folder = FOLDER_B;
    assert.equal((await raw(W.admin, full, baseVersion)).status, 200);
  });

  test('and now they cannot — which is the consequence the confirm has to state', async () => {
    const r = await W.restricted.raw('/api/contracts/MK-MV-SEE');
    assert.equal(r.status, 404);
    const rows = (await W.restricted.json('/api/contracts?limit=200')).rows;
    assert.ok(!rows.some(x => x.id === 'MK-MV-SEE'), 'gone from their register too');
  });

  test('the unrestricted member, who holds every stream, is unaffected either way', async () => {
    assert.equal((await W.unrestricted.raw('/api/contracts/MK-MV-SEE')).status, 200);
  });
});

/* ============================================================
   THE BROWSER SIDE — the model, not the pixels
   ============================================================
   The picker's VISIBILITY is proved in a browser (a control that is present
   and invisible passes every other kind of test). What is asserted here is the
   shape of the thing: one list, one counting reading, no second door.
   ============================================================ */
describe('f200 — the control is built on what already exists', () => {
  const src = read('js/views/contract.js');
  const row = src.slice(src.indexOf('function ktStreamRowHtml'), src.indexOf('function ktTermsRowsHtml'));

  test('the picker is drawn for an admin only', () => {
    assert.match(row, /isAdmin\(\)/, 'and nobody else gets a control that would be refused');
    assert.match(row, /!PORTAL_MODE/, 'never on the counterparty\'s page');
  });

  test('it is built from visibleFolders — the one list — and not a second one', () => {
    assert.match(row, /visibleFolders\(\)/);
    assert.ok(!/Object\.values\(FOLDERS\)/.test(row),
      'a restricted reader being offered a stream they cannot open is a dead end or a lost contract');
  });

  test('it deliberately does NOT offer "create a new folder"', () => {
    /* Every other picker in the product is folderOptionsHtml, which carries a
       __new__ sentinel. A custom folder is saved in the reader's own browser
       and no colleague's browser knows it exists, so minting one mid-move
       would file the contract somewhere only one person can see. */
    assert.ok(!/folderOptionsHtml\(/.test(row), 'it does not call the picker that carries the sentinel');
    assert.ok(!/'__new__'/.test(row) && !/"__new__"/.test(row));
  });

  test('the drawer it is already in stays on the list even where it is out of reach', () => {
    assert.match(row, /opts\.unshift\(FOLDERS\[c\.folder\]\)/,
      'folderOptionsHtml\'s own rule — otherwise opening the row silently re-files it');
  });

  test('it does not stand down on a signed contract (D-1), unlike the rows beside it', () => {
    assert.ok(!/status!=='Signed'/.test(row) && !/status !== 'Signed'/.test(row));
  });

  test('the move asks first, and it is not the ordinary [data-kt] keystroke handler', () => {
    const wire = src.slice(src.indexOf('function wireKtFolder'), src.indexOf('function renderKeyTerms'));
    assert.match(wire, /confirmDialog/, 'a real act asks before it happens');
    assert.match(wire, /logAudit\(c,'Re-filed'/, 'and writes a record');
    assert.match(wire, /sel\.value=from/, 'and a cancel puts the picker back');
    assert.ok(!/data-kt=/.test(wire), 'it does not ride the panel\'s write-on-keystroke handler');
  });

  test('bound once per element, so one press cannot ask the question twice', () => {
    const wire = src.slice(src.indexOf('function wireKtFolder'), src.indexOf('function renderKeyTerms'));
    assert.match(wire, /dataset\.ktFolderBound/,
      'wireKeyTerms runs from renderKeyTerms AND from the room\'s main wiring');
  });
});

/* ============================================================
   ONE READING OF "WHO CAN SEE THIS DRAWER"
   ============================================================ */
describe('f200 — the count on the confirm is the settings panel\'s own', () => {
  test('folderSeerCount is built on canAccessFolder and exported', () => {
    const core = read('js/core.js');
    const fn = core.slice(core.indexOf('function folderSeerCount'), core.indexOf('function folderSeerCount') + 400);
    assert.match(fn, /canAccessFolder\(fid,u\)/, 'the map\'s own named predicate, not a fourth copy of it');
    assert.match(core, /canAccessFolder,folderSeerCount,/, 'exported — an unexported cross-module call fails silently');
  });

  test('the settings panel now asks it instead of carrying its own arithmetic', () => {
    const set = read('js/views/settings.js');
    const paint = set.slice(set.indexOf('function stPaintFolders'), set.indexOf('function stPaintFolders') + 900);
    assert.match(paint, /folderSeerCount\(fid\)\.n/);
    assert.ok(!/folderAccess\)\)\[u\.id\]/.test(paint),
      'two copies of "who can see this drawer" is two answers to one question');
  });

  test('and it really counts — a restricted member is in one folder and not the other', () => {
    /* Run for real, in a sandbox holding the two functions and a roster,
       rather than asserting the source reads plausibly. */
    const core = read('js/core.js');
    const cut = s => core.slice(core.indexOf(s), core.indexOf('\n}', core.indexOf(s)) + 2);
    const sandbox = {
      state: { settings: { folderAccess: { u2: ['proc'] } } },
      currentUser: () => ({ id: 'u1', role: 'admin' }),
      getUsers: () => [{ id: 'u1', role: 'admin' }, { id: 'u2', role: 'legal' }, { id: 'u3', role: 'legal' }],
    };
    vm.createContext(sandbox);
    vm.runInContext(cut('function userFolderAccess(u){')
      + '\n' + core.slice(core.indexOf('function canAccessFolder'), core.indexOf('\n', core.indexOf('function canAccessFolder')))
      + '\n' + cut('function folderSeerCount(fid){'), sandbox);
    assert.deepEqual(Array.from([sandbox.folderSeerCount('proc').n, sandbox.folderSeerCount('proc').total]), [3, 3],
      'admin + the restricted member (who holds proc) + the member nobody restricted');
    assert.deepEqual(Array.from([sandbox.folderSeerCount('sales').n, sandbox.folderSeerCount('sales').total]), [2, 3],
      'and one fewer in the drawer the restricted member does not hold');
  });
});

/* ============================================================
   THE RIDER — custom folders are saved in one browser, and say so
   ============================================================ */
describe('f200 — the custom-folder honesty line', () => {
  test('the folders panel states where a folder you create actually lives', () => {
    const set = read('js/views/settings.js');
    assert.match(set, /st_p_folders_local/,
      'a rename box and a delete button make a browser-only list look like a company setting');
  });

  test('and it says so in both languages', () => {
    const i18n = read('js/i18n.js');
    const hits = i18n.match(/st_p_folders_local:/g) || [];
    assert.equal(hits.length, 2, 'en and sv');
    assert.match(i18n, /st_p_folders_local: 'A folder you create here is saved in this browser/);
  });

  test('the claim is true — addCustomFolder writes to this browser and nowhere else', () => {
    const tpl = read('js/templates.js');
    const fn = tpl.slice(tpl.indexOf('function addCustomFolder'), tpl.indexOf('function folderColor'));
    assert.match(fn, /saveCustomFolders\(\)/);
    const save = tpl.slice(tpl.indexOf('function saveCustomFolders'), tpl.indexOf('function saveCustomFolders') + 300);
    assert.ok(/lsSet|localStorage/.test(save), 'browser storage, not a route');
  });
});
