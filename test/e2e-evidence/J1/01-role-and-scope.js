'use strict';
/* J1 — role attacks + admin-only field leakage + folder scope.
   NOT a fix session. Reproduce, assert state, attack, record raw response. */
const assert = require('node:assert');
const { startHati, seedWorkspace, nameASigner, FOLDER_A, FOLDER_B } = require('../../helpers');

function log(...a) { console.log(...a); }

(async () => {
  const h = await startHati();
  const W = await seedWorkspace(h);
  const findings = [];
  try {
    log('\n=== SETUP OK ===');
    log('admin, restricted(folder proc only), novalues(values hidden), unrestricted all created.');

    /* ---------------------------------------------------------------
       1. EXECUTED_IMMUTABLE — attack every field on a Signed contract
       --------------------------------------------------------------- */
    log('\n--- 1. EXECUTED_IMMUTABLE attacks on MK-A1 (Signed) ---');
    const a1before = await W.unrestricted.json('/api/contracts/MK-A1');
    assert.strictEqual(a1before.status, 'Signed', 'MK-A1 must actually be Signed before attacking it');
    log('ASSERTED: MK-A1.status === "Signed" (real, from GET)');

    const attackField = async (field, value, label) => {
      const full = await W.unrestricted.json('/api/contracts/MK-A1');
      const baseVersion = full._v;
      delete full._v;
      const before = JSON.stringify(full[field]);
      full[field] = value;
      const r = await W.unrestricted.raw('/api/contracts/MK-A1', { method: 'PUT', body: { contract: full, baseVersion } });
      log(`ATTACK field=${field} (${label}): before=${before} attemptedNew=${JSON.stringify(value)} -> status=${r.status} body=${r.text.slice(0,220)}`);
      // re-read to see if it actually changed
      const after = await W.unrestricted.json('/api/contracts/MK-A1');
      const changed = JSON.stringify(after[field]) !== before;
      log(`  post-check: stored ${field} now = ${JSON.stringify(after[field])}; changed=${changed}`);
      findings.push({ id: `exec-${field}`, refused: r.status >= 400, changed });
      return { r, changed };
    };

    await attackField('status', 'Draft', 'status rollback');
    await attackField('name', 'RENAMED BY ATTACK', 'name');
    await attackField('party', 'Attacker Corp', 'party');
    await attackField('expiry', '2099-01-01', 'expiry');
    await attackField('metadata', { value: 999, currency: 'USD', hacked: true }, 'metadata');

    /* ---------------------------------------------------------------
       2. FOLDER MOVE — Editor must be refused, admin allowed
       --------------------------------------------------------------- */
    log('\n--- 2. Folder move: Editor refused, admin allowed ---');
    {
      const full = await W.unrestricted.json('/api/contracts/MK-A2'); // Under Review, folder A
      assert.strictEqual(full.folder, FOLDER_A, 'MK-A2 must actually be in folder A first');
      log('ASSERTED: MK-A2.folder === "proc"');
      const baseVersion = full._v; delete full._v;
      full.folder = FOLDER_B;
      const r = await W.unrestricted.raw('/api/contracts/MK-A2', { method: 'PUT', body: { contract: full, baseVersion } });
      log(`EDITOR attempts folder move proc->sales: status=${r.status} body=${r.text.slice(0,300)}`);
      const after = await W.unrestricted.json('/api/contracts/MK-A2');
      log(`  post-check folder = ${after.folder}`);
      findings.push({ id: 'folder-move-editor', refused: r.status >= 400, moved: after.folder !== FOLDER_A });
    }
    {
      const full = await W.admin.json('/api/contracts/MK-A2');
      const baseVersion = full._v; delete full._v;
      full.folder = FOLDER_B;
      const r = await W.admin.raw('/api/contracts/MK-A2', { method: 'PUT', body: { contract: full, baseVersion } });
      log(`ADMIN attempts folder move proc->sales: status=${r.status} body=${r.text.slice(0,200)}`);
      const after = await W.admin.json('/api/contracts/MK-A2');
      log(`  post-check folder = ${after.folder}`);
      findings.push({ id: 'folder-move-admin', refused: r.status >= 400, moved: after.folder === FOLDER_B });
      // put it back for later tests
      const full2 = await W.admin.json('/api/contracts/MK-A2');
      const bv2 = full2._v; delete full2._v; full2.folder = FOLDER_A;
      await W.admin.json('/api/contracts/MK-A2', { method: 'PUT', body: { contract: full2, baseVersion: bv2 } });
    }

    /* ---------------------------------------------------------------
       3. Recording a signature AS somebody else
       --------------------------------------------------------------- */
    log('\n--- 3. Forging a signature as somebody else ---');
    {
      // Use MK-A2 (Under Review, not executed) so it is signable-shaped.
      const signer = await nameASigner(W.unrestricted, 'MK-A2');
      log(`ASSERTED: signerPlan named. counterparty signer=${JSON.stringify(signer)}`);
      const full = await W.novalues.json('/api/contracts/MK-A2');
      const baseVersion = full._v; delete full._v;
      full.signatures = (full.signatures || []).concat([{
        method: 'session-authenticated', name: 'Amina Otieno', email: 'admin@example.co.ke',
        at: new Date().toISOString(), role: 'Director',
      }]);
      const r = await W.novalues.raw('/api/contracts/MK-A2', { method: 'PUT', body: { contract: full, baseVersion } });
      log(`novalues (signed in as novalues@) tries to record a session-authenticated signature as "Amina Otieno"/admin@: status=${r.status} body=${r.text.slice(0,300)}`);
      const after = await W.admin.json('/api/contracts/MK-A2');
      const forged = (after.signatures || []).some(s => s.email === 'admin@example.co.ke');
      log(`  post-check: forged signature present on record = ${forged}`);
      findings.push({ id: 'forge-signature', refused: r.status >= 400, forged });
    }

    /* ---------------------------------------------------------------
       4. Review verdicts / cancel / hand-back by the wrong person
       --------------------------------------------------------------- */
    log('\n--- 4. Review verdict/cancel/hand-back by wrong person ---');
    // Set up: unrestricted asks novalues to review a change on MK-A2's negotiation.
    // Need to inspect review model in js/review.js server mirror (rv* functions).
    // First create a change via negoFileChange equivalent — simplify: directly seed c.changes + c.review via PUT (as the "browser" would).
    {
      const full = await W.unrestricted.json('/api/contracts/MK-A2');
      const baseVersion = full._v; delete full._v;
      const changeId = 'CHG-atk-1';
      full.changes = (full.changes||[]).concat([{
        id: changeId, clauseId: 'c1', status: 'pending', side: 'owner', author: 'Unrestricted Legal',
        by: 'everything@example.co.ke', createdAt: new Date().toISOString(), seq: 1,
        oldText: 'old', newText: 'new', ops: [], round: 1,
      }]);
      full.review = { requests: [{ id: 'REV-atk-1', status: 'open', changeIds: [changeId],
        reviewerId: W.users.novalues.id, reviewerName: 'No Values Legal', requestedBy: W.users.unrestricted.id,
        requestedByName: 'Unrestricted Legal', at: new Date().toISOString() }] };
      const r0 = await W.unrestricted.raw('/api/contracts/MK-A2', { method: 'PUT', body: { contract: full, baseVersion } });
      log(`SEED: filed change + open review naming novalues as reviewer: status=${r0.status}`);
      const check = await W.unrestricted.json('/api/contracts/MK-A2');
      assert.ok(check.review && check.review.requests && check.review.requests[0].status === 'open', 'review must actually be open');
      assert.strictEqual(check.review.requests[0].reviewerId, W.users.novalues.id, 'reviewer must actually be novalues');
      log('ASSERTED: review REV-atk-1 open, reviewerId=novalues.id, changeIds=[CHG-atk-1]');

      // 4a. WRONG PERSON gives a verdict (restricted, not the named reviewer, and restricted cannot even see folder A? wait A2 is folder A, restricted CAN see it)
      const full2 = await W.restricted.json('/api/contracts/MK-A2');
      const bv2 = full2._v; delete full2._v;
      const ch = full2.changes.find(c => c.id === changeId);
      ch.status = 'accepted'; ch.resolvedBy = 'Restricted Legal';
      const r1 = await W.restricted.raw('/api/contracts/MK-A2', { method: 'PUT', body: { contract: full2, baseVersion: bv2 } });
      log(`WRONG PERSON (restricted, not named reviewer) gives verdict 'accepted' on CHG-atk-1: status=${r1.status} body=${r1.text.slice(0,300)}`);
      const afterVerdict = await W.unrestricted.json('/api/contracts/MK-A2');
      const stillPending = afterVerdict.changes.find(c => c.id === changeId).status === 'pending';
      log(`  post-check: change status still pending = ${stillPending}`);
      findings.push({ id: 'review-verdict-wrong-person', refused: r1.status >= 400, held: stillPending });

      // 4b. WRONG PERSON cancels the review (only requester/admin may cancel)
      const full3 = await W.restricted.json('/api/contracts/MK-A2');
      const bv3 = full3._v; delete full3._v;
      full3.review.requests[0].status = 'cancelled';
      const r2 = await W.restricted.raw('/api/contracts/MK-A2', { method: 'PUT', body: { contract: full3, baseVersion: bv3 } });
      log(`WRONG PERSON (restricted, neither requester nor admin) cancels REV-atk-1: status=${r2.status} body=${r2.text.slice(0,300)}`);
      const afterCancel = await W.unrestricted.json('/api/contracts/MK-A2');
      const stillOpen = afterCancel.review.requests[0].status === 'open';
      log(`  post-check: review still open = ${stillOpen}`);
      findings.push({ id: 'review-cancel-wrong-person', refused: r2.status >= 400, held: stillOpen });

      // 4c. WRONG PERSON hands the review back (only the named reviewer may)
      const full4 = await W.restricted.json('/api/contracts/MK-A2');
      const bv4 = full4._v; delete full4._v;
      full4.review.requests[0].status = 'returned';
      const r3 = await W.restricted.raw('/api/contracts/MK-A2', { method: 'PUT', body: { contract: full4, baseVersion: bv4 } });
      log(`WRONG PERSON (restricted, not the reviewer) hands back REV-atk-1: status=${r3.status} body=${r3.text.slice(0,300)}`);
      const afterReturn = await W.unrestricted.json('/api/contracts/MK-A2');
      const stillOpen2 = afterReturn.review.requests[0].status === 'open';
      log(`  post-check: review still open = ${stillOpen2}`);
      findings.push({ id: 'review-return-wrong-person', refused: r3.status >= 400, held: stillOpen2 });

      // 4d. RIGHT person (novalues, the named reviewer) CAN give a verdict — sanity check the guard isn't blanket
      const full5 = await W.novalues.json('/api/contracts/MK-A2');
      const bv5 = full5._v; delete full5._v;
      const ch5 = full5.changes.find(c => c.id === changeId);
      ch5.status = 'accepted'; ch5.resolvedBy = 'No Values Legal';
      const r5 = await W.novalues.raw('/api/contracts/MK-A2', { method: 'PUT', body: { contract: full5, baseVersion: bv5 } });
      log(`RIGHT PERSON (novalues, the named reviewer) gives verdict: status=${r5.status} body=${r5.text.slice(0,200)}`);
      findings.push({ id: 'review-verdict-right-person', accepted: r5.status < 400 });
    }

    /* ---------------------------------------------------------------
       5. Roster edits by non-admin, overseeing yourself
       --------------------------------------------------------------- */
    log('\n--- 5. Roster edits by non-admin (PATCH /api/users/:id) ---');
    const rosterAttack = async (client, label, body) => {
      const r = await client.raw('/api/users/' + W.users.novalues.id, { method: 'PATCH', body });
      log(`${label} PATCHes /api/users/${W.users.novalues.id} with ${JSON.stringify(body)}: status=${r.status} body=${r.text.slice(0,250)}`);
      findings.push({ id: `roster-${label}-${Object.keys(body)[0]}`, refused: r.status >= 400 });
      return r;
    };
    await rosterAttack(W.unrestricted, 'nonadmin-editor', { signCap: '1000000' });
    await rosterAttack(W.unrestricted, 'nonadmin-editor', { reviewChecked: false });
    await rosterAttack(W.unrestricted, 'nonadmin-editor', { reviewerId: W.users.restricted.id });
    await rosterAttack(W.unrestricted, 'nonadmin-editor', { overseerId: W.users.restricted.id });
    await rosterAttack(W.unrestricted, 'nonadmin-editor', { clearTwoStep: true });
    await rosterAttack(W.unrestricted, 'nonadmin-editor', { folderAccess: ['sales'] }); // note: folderAccess isn't a PATCH /users field really — check route ignores unknown field -> "Nothing to change"? test anyway

    // Overseeing yourself, as admin (should refuse regardless of role since it's a logic guard not an admin check)
    {
      const r = await W.admin.raw('/api/users/' + W.admin === null ? '' : '', {}); // placeholder unused
    }
    // Need admin's own id — fetch bootstrap
    const bootAdmin = await W.admin.json('/api/bootstrap');
    const adminId = bootAdmin.me.id;
    {
      const r = await W.admin.raw('/api/users/' + adminId, { method: 'PATCH', body: { overseerId: adminId } });
      log(`ADMIN tries to set their own overseerId to themselves: status=${r.status} body=${r.text.slice(0,250)}`);
      findings.push({ id: 'overseer-self', refused: r.status >= 400 });
    }
    // Overseeing yourself for a non-admin target set by admin (admin sets novalues.overseerId = novalues.id)
    {
      const r = await W.admin.raw('/api/users/' + W.users.novalues.id, { method: 'PATCH', body: { overseerId: W.users.novalues.id } });
      log(`ADMIN tries to set novalues.overseerId = novalues.id (self-oversee another way): status=${r.status} body=${r.text.slice(0,250)}`);
      findings.push({ id: 'overseer-self-via-admin', refused: r.status >= 400 });
    }
    // clearTwoStep on yourself (even as admin) must be refused
    {
      const r = await W.admin.raw('/api/users/' + adminId, { method: 'PATCH', body: { clearTwoStep: true } });
      log(`ADMIN tries clearTwoStep on THEMSELVES: status=${r.status} body=${r.text.slice(0,250)}`);
      findings.push({ id: 'cleartwostep-self', refused: r.status >= 400 });
    }

    /* ---------------------------------------------------------------
       6. Admin-only fields leaking into non-admin bootstrap
       --------------------------------------------------------------- */
    log('\n--- 6. Admin-only field leakage in bootstrap ---');
    const ADMIN_ONLY = ['folderAccess', 'signCap', 'reviewChecked', 'reviewerId', 'overseerId', 'twoStep'];
    // give novalues a signCap etc as admin so there's something to leak
    await W.admin.json('/api/users/' + W.users.novalues.id, { method: 'PATCH', body: { signCap: '5000000' } });
    await W.admin.json('/api/users/' + W.users.novalues.id, { method: 'PATCH', body: { reviewChecked: false } });
    await W.admin.json('/api/users/' + W.users.novalues.id, { method: 'PATCH', body: { reviewerId: W.users.restricted.id } });
    await W.admin.json('/api/users/' + W.users.novalues.id, { method: 'PATCH', body: { overseerId: W.users.unrestricted.id } });
    await W.admin.json('/api/settings', { method: 'PUT', body: { folderAccess: { [W.users.restricted.id]: [FOLDER_A] } } });

    const bootUnrestricted = await W.unrestricted.json('/api/bootstrap');
    const bootRestricted = await W.restricted.json('/api/bootstrap');
    const bootAdmin2 = await W.admin.json('/api/bootstrap');

    const novaluesRowIn = boot => boot.users.find(u => u.email === 'novalues@example.co.ke');
    for (const [label, boot] of [['unrestricted(Editor)', bootUnrestricted], ['restricted(Editor)', bootRestricted]]) {
      const row = novaluesRowIn(boot);
      const leaked = ADMIN_ONLY.filter(k => row[k] !== undefined);
      log(`${label}'s bootstrap: novalues user row keys present of ADMIN_ONLY = ${JSON.stringify(leaked)} (full row: ${JSON.stringify(row)})`);
      findings.push({ id: `leak-${label}`, leaked });
      // also check settings.folderAccess absent
      const settingsHasMap = boot.settings && boot.settings.folderAccess !== undefined;
      log(`  ${label}'s bootstrap.settings.folderAccess present = ${settingsHasMap}`);
      findings.push({ id: `leak-settings-folderAccess-${label}`, leaked: settingsHasMap });
    }
    {
      const row = novaluesRowIn(bootAdmin2);
      const allPresent = ADMIN_ONLY.every(k => row[k] !== undefined);
      log(`ADMIN's bootstrap: novalues row has ALL admin-only fields present = ${allPresent} (row: ${JSON.stringify(row)})`);
      findings.push({ id: 'admin-sees-all', allPresent });
      const settingsHasMap = bootAdmin2.settings && bootAdmin2.settings.folderAccess !== undefined;
      log(`  ADMIN's bootstrap.settings.folderAccess present = ${settingsHasMap}`);
      findings.push({ id: 'admin-sees-folderAccess-settings', present: settingsHasMap });
    }
    // signFolders.by check
    await W.admin.json('/api/settings/sign-folders', { method: 'PUT', body: { on: true, by: { [W.users.restricted.id]: [FOLDER_A] } } }).catch(e => log('sign-folders PUT failed (may need different shape): ' + e.message));
    {
      const bootU2 = await W.unrestricted.json('/api/bootstrap');
      const bootA2 = await W.admin.json('/api/bootstrap');
      log(`unrestricted bootstrap.settings.signFolders = ${JSON.stringify(bootU2.settings && bootU2.settings.signFolders)}`);
      log(`admin bootstrap.settings.signFolders = ${JSON.stringify(bootA2.settings && bootA2.settings.signFolders)}`);
      findings.push({ id: 'signfolders-by-leak-nonadmin', leaked: !!(bootU2.settings && bootU2.settings.signFolders && bootU2.settings.signFolders.by !== undefined) });
      findings.push({ id: 'signfolders-by-present-admin', present: !!(bootA2.settings && bootA2.settings.signFolders && bootA2.settings.signFolders.by !== undefined) });
    }

    /* ---------------------------------------------------------------
       7. /api/ai/spend admin-only, /api/ai/usage not
       --------------------------------------------------------------- */
    log('\n--- 7. /api/ai/spend vs /api/ai/usage ---');
    {
      const rSpendNonAdmin = await W.unrestricted.raw('/api/ai/spend');
      log(`Editor GET /api/ai/spend: status=${rSpendNonAdmin.status} body=${rSpendNonAdmin.text.slice(0,150)}`);
      findings.push({ id: 'ai-spend-nonadmin-refused', refused: rSpendNonAdmin.status >= 400 });
      const rSpendAdmin = await W.admin.raw('/api/ai/spend');
      log(`Admin GET /api/ai/spend: status=${rSpendAdmin.status} body=${rSpendAdmin.text.slice(0,150)}`);
      findings.push({ id: 'ai-spend-admin-ok', ok: rSpendAdmin.status < 400 });
      const rUsageNonAdmin = await W.unrestricted.raw('/api/ai/usage');
      log(`Editor GET /api/ai/usage: status=${rUsageNonAdmin.status} body=${rUsageNonAdmin.text.slice(0,150)}`);
      findings.push({ id: 'ai-usage-nonadmin-ok', ok: rUsageNonAdmin.status < 400 });
      const rUsageViewer = await (async () => {
        const created = await W.admin.json('/api/users', { method: 'POST', body: { name: 'View Only', email: 'viewonly@example.co.ke', role: 'viewer', password: 'temporary-pass-1' } });
        const c = h.client('viewonly@example.co.ke');
        await c.json('/api/login', { method: 'POST', body: { email: 'viewonly@example.co.ke', password: 'temporary-pass-1' } });
        return { c, r: await c.raw('/api/ai/usage') };
      })();
      log(`Viewer GET /api/ai/usage: status=${rUsageViewer.r.status} body=${rUsageViewer.r.text.slice(0,150)}`);
      findings.push({ id: 'ai-usage-viewer-ok', ok: rUsageViewer.r.status < 400 });
      global.__viewerClient = rUsageViewer.c;
      global.__viewerId = (await rUsageViewer.c.json('/api/bootstrap')).me.id;
    }

    /* ---------------------------------------------------------------
       8. FOLDER SCOPE — restricted must not reach MK-B1/MK-B2 anywhere
       --------------------------------------------------------------- */
    log('\n--- 8. Folder scope: restricted vs MK-B1/MK-B2 ---');
    {
      const rList = await W.restricted.raw('/api/contracts');
      const listIds = (rList.json && rList.json.contracts || rList.json || []).map ? (rList.json.contracts||rList.json).map(c=>c.id) : [];
      const leakList = listIds.filter(id => id === 'MK-B1' || id === 'MK-B2');
      log(`restricted GET /api/contracts -> ids: ${JSON.stringify(listIds)}. leaked B ids: ${JSON.stringify(leakList)}`);
      findings.push({ id: 'scope-list', leaked: leakList });

      const rGetB1 = await W.restricted.raw('/api/contracts/MK-B1');
      log(`restricted GET /api/contracts/MK-B1: status=${rGetB1.status} body=${rGetB1.text.slice(0,150)}`);
      findings.push({ id: 'scope-get-b1', refused: rGetB1.status === 404 });

      const rSearch = await W.restricted.raw('/api/search?q=Naivas');
      log(`restricted GET /api/search?q=Naivas: status=${rSearch.status} body=${rSearch.text.slice(0,300)}`);
      const searchHitsB = (rSearch.json && rSearch.json.hits || []).filter(h => h.id === 'MK-B1' || h.id === 'MK-B2');
      findings.push({ id: 'scope-search', leaked: searchHitsB });

      const rStats = await W.restricted.raw('/api/stats');
      log(`restricted GET /api/stats: status=${rStats.status} body=${rStats.text.slice(0,400)}`);

      const rAnalytics = await W.restricted.raw('/api/analytics');
      log(`restricted GET /api/analytics: status=${rAnalytics.status} body=${rAnalytics.text.slice(0,600)}`);
      const analyticsText = rAnalytics.text;
      const leakAnalytics = ['MK-B1','MK-B2','Naivas Supermarkets','Modern Trade Listing'].filter(m => analyticsText.includes(m));
      findings.push({ id: 'scope-analytics', leaked: leakAnalytics });

      // shares: does restricted user see any shares tied to B contracts?
      const rSharesOverview = await W.restricted.raw('/api/shares/overview');
      log(`restricted GET /api/shares/overview: status=${rSharesOverview.status} body=${rSharesOverview.text.slice(0,300)}`);

      // Try to mint a share for MK-B1 as restricted (should be refused — can't even see it)
      const rMintShare = await W.restricted.raw('/api/shares', { method: 'POST', body: { contractId: 'MK-B1', kind: 'view', recipientEmail: 'x@x.com', recipientName: 'X' } });
      log(`restricted POST /api/shares for MK-B1 (view): status=${rMintShare.status} body=${rMintShare.text.slice(0,300)}`);
      findings.push({ id: 'scope-mint-share-b1', refused: rMintShare.status >= 400 });

      // palette / search route already covered above; also try PUT on B1 (should 404, invisible therefore unwritable)
      const rPutB1 = await W.restricted.raw('/api/contracts/MK-B1', { method: 'PUT', body: { contract: { id: 'MK-B1', folder: FOLDER_B, name: 'x' }, baseVersion: 1 } });
      log(`restricted PUT /api/contracts/MK-B1 (write attempt): status=${rPutB1.status} body=${rPutB1.text.slice(0,300)}`);
      findings.push({ id: 'scope-put-b1', refused: rPutB1.status >= 400 });
    }

    log('\n=== FINDINGS SUMMARY (raw) ===');
    log(JSON.stringify(findings, null, 2));

  } finally {
    await h.stop();
  }
})().catch(e => { console.error('FATAL', e); process.exit(1); });
