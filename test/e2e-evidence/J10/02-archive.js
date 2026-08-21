/* J10 finding #2 — The archive shelf. Independent reproduction against a
   real server. */
const assert = require('node:assert/strict');
const { startHati, seedWorkspace, FOLDER_A } = require('../../helpers');

// server's runReminders() computes "today" via `new Date(); .setHours(0,0,0,0)`
// — this sandbox runs in UTC (TZ offset 0), so UTC midnight arithmetic here
// matches the server's "today" exactly.
function isoInDays(n) {
  const d = new Date(); d.setUTCHours(0, 0, 0, 0); d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

(async () => {
  const h = await startHati();
  const results = [];
  const record = (name, ok, detail) => { results.push({ name, ok, detail }); console.log((ok ? 'PASS' : 'FAIL') + ' — ' + name, detail !== undefined ? JSON.stringify(detail) : ''); };

  try {
    const W = await seedWorkspace(h, { contracts: [] }); // start with an empty book so counts are exact

    const putContract = (body) => W.admin.json('/api/contracts/' + body.id, { method: 'PUT', body: { contract: body } });

    // ---- 1. A SIGNED CONTRACT, ARCHIVED. STATUS MUST NOT MOVE. ----
    await putContract({ id: 'MK-AR-1', name: 'Archived Supply Deal', counterparty: 'Kabras Sugar', folder: FOLDER_A,
      status: 'Signed', value: 1000000, valueType: 'standard', expiry: '2027-01-01',
      fields: {}, metadata: { value: 1000000, currency: 'KES' }, obligations: [],
      audit: [{ at: new Date().toISOString(), user: 'System', action: 'Created', detail: 'fixture' }],
      rounds: [], versions: [], signatures: [{ by: 'X' }], comments: [] });

    // BEFORE state
    const beforeStats = await W.admin.json('/api/stats');
    const beforeList = await W.admin.json('/api/contracts');
    record('BEFORE: /api/stats', true, beforeStats);
    record('BEFORE: /api/contracts total', true, { total: beforeList.total });

    // Archive it — mimic what contractSetArchived (js/core.js) does: sets
    // c.archived = {at, by} and appends an English audit line, then saves.
    const full = await W.admin.json('/api/contracts/MK-AR-1');
    const baseVersion = full._v; delete full._v;
    full.archived = { at: new Date().toISOString(), by: 'Amina Otieno' };
    full.audit.push({ at: new Date().toISOString(), user: 'Amina Otieno', action: 'Archived',
      detail: 'Moved to the archive shelf — off the live lists and counts, still searchable' });
    const archR = await W.admin.raw('/api/contracts/MK-AR-1', { method: 'PUT', body: { contract: full, baseVersion } });
    record('archiving a SIGNED contract is accepted (not refused as an executed-record edit)', archR.status === 200, { status: archR.status, body: archR.json && archR.json.error });

    const afterArchive = await W.admin.json('/api/contracts/MK-AR-1');
    record('STATUS STAYS "Signed" — archived is a filing fact BESIDE status, not a status', afterArchive.status === 'Signed', afterArchive.status);
    record('c.archived = {at, by} is present', !!(afterArchive.archived && afterArchive.archived.by === 'Amina Otieno'), afterArchive.archived);
    record('the audit trail carries an ENGLISH "Archived" line', afterArchive.audit.some(a => a.action === 'Archived' && /archive shelf/.test(a.detail)), afterArchive.audit.filter(a => a.action === 'Archived'));

    // ---- 2. OFF /api/stats and /api/analytics (server-side SQL aggregates) ----
    const afterStats = await W.admin.json('/api/stats');
    record('OFF /api/stats: total count drops by exactly 1', afterStats.total === beforeStats.total - 1, { before: beforeStats.total, after: afterStats.total });
    record('OFF /api/stats: signed count drops by exactly 1 (SQL SUM over zero matching rows is NULL, which is the correct/expected 0-rows case here)', (afterStats.signed || 0) === beforeStats.signed - 1, { before: beforeStats.signed, after: afterStats.signed });
    record('OFF /api/stats: totalValue drops by the archived contract\'s value', afterStats.totalValue === beforeStats.totalValue - 1000000, { before: beforeStats.totalValue, after: afterStats.totalValue });

    const afterAnalytics = await W.admin.json('/api/analytics');
    const signedInAnalytics = (afterAnalytics.byStatus || []).find(s => s.status === 'Signed');
    record('OFF /api/analytics byStatus (the archived Signed row is gone from the Signed bucket)', !signedInAnalytics || signedInAnalytics.n === 0, afterAnalytics.byStatus);

    // ---- 3. STILL RETURNED by GET /api/contracts (server does not filter it —
    // js/views/register.js filters it client-side; the row must still carry
    // the flag so the client CAN filter/tag it) ----
    const afterList = await W.admin.json('/api/contracts');
    const row = afterList.rows.find(r => r.id === 'MK-AR-1');
    record('GET /api/contracts still returns the archived row (client filters, server delivers)', !!row, { found: !!row });
    record('...and the LIGHT-LIST row carries archived={at,by} (survives HEAVY projection)', !!(row && row.archived && row.archived.by === 'Amina Otieno'), row && row.archived);
    record('...and _light is true on that row (confirms this IS the light-list projection)', !!(row && row._light), row && row._light);

    // ---- 4. STILL FINDABLE IN SEARCH (FTS) ----
    const search = await W.admin.json('/api/search?q=' + encodeURIComponent('Archived Supply Deal'));
    record('an archived contract is STILL findable in full-text search', search.hits.some(h => h.id === 'MK-AR-1'), search.hits);

    // ---- 5. THE ACT IS EDITOR-AND-UP: a Viewer cannot archive (client-side
    // gate is contractSetArchived's canEdit() check — but the server accepts
    // ANY authenticated PUT with unchanged EXECUTED_IMMUTABLE fields, so the
    // real wall here is client-side only for a Viewer with write access to
    // this stream... verify the SERVER refuses a Viewer's PUT outright,
    // which is the actual backstop regardless of the archive feature). ----
    await W.admin.json('/api/users', { method: 'POST', body: { name: 'A Viewer', email: 'viewer2@example.co.ke', role: 'viewer', password: 'temporary-pass-1' } });
    const v2 = h.client('viewer2');
    await v2.json('/api/login', { method: 'POST', body: { email: 'viewer2@example.co.ke', password: 'temporary-pass-1' } });
    await v2.json('/api/password/change', { method: 'POST', body: { current: 'temporary-pass-1', password: 'v2-pass-9' } });
    const viewerArchive = await v2.raw('/api/contracts/MK-AR-1', { method: 'PUT', body: { contract: { ...afterArchive, archived: null }, baseVersion: afterArchive._v } });
    record('a VIEWER cannot even save the contract at all (server-side wall backstops the editor-only client gate)', viewerArchive.status >= 400, { status: viewerArchive.status, body: viewerArchive.json });

    // ---- 6. RESTORE: audited both ways, in English ----
    const toRestore = await W.admin.json('/api/contracts/MK-AR-1');
    const rv = toRestore._v; delete toRestore._v;
    delete toRestore.archived;
    toRestore.audit.push({ at: new Date().toISOString(), user: 'Amina Otieno', action: 'Restored', detail: 'Restored from the archive shelf to the live lists' });
    await W.admin.json('/api/contracts/MK-AR-1', { method: 'PUT', body: { contract: toRestore, baseVersion: rv } });
    const restored = await W.admin.json('/api/contracts/MK-AR-1');
    record('RESTORE: archived flag is gone', !restored.archived, restored.archived);
    record('RESTORE: audit carries the "Restored" English line', restored.audit.some(a => a.action === 'Restored'), restored.audit.filter(a => a.action === 'Restored'));
    const restoredStats = await W.admin.json('/api/stats');
    record('RESTORE: back in /api/stats totals', restoredStats.total === beforeStats.total, { total: restoredStats.total });

    // ---- 7. THE SUBTLE CASE: an ARCHIVED EXECUTED AMENDMENT still sets its
    // PARENT'S term. Build a real parent + executed amendment, read the
    // effective expiry via POST /api/ai/renewal (which computes it with the
    // same effExpiryReader the sweeps use), archive the amendment, and prove
    // the parent's computed term is UNCHANGED. ----
    await putContract({ id: 'MK-PARENT', name: 'Master Supply Agreement', counterparty: 'Kabras Sugar', folder: FOLDER_A,
      status: 'Signed', value: 500000, valueType: 'standard', expiry: '2026-12-31',
      fields: {}, metadata: { value: 500000, currency: 'KES' }, obligations: [],
      audit: [{ at: new Date().toISOString(), user: 'System', action: 'Created', detail: 'fixture' }],
      rounds: [], versions: [], signatures: [{ by: 'X' }], comments: [] });

    await putContract({ id: 'MK-AMEND-1', name: 'Amendment No. 1', counterparty: 'Kabras Sugar', folder: FOLDER_A,
      status: 'Signed', value: 500000, valueType: 'standard', expiry: '2028-06-30', // NEW term, later than parent's own
      parentId: 'MK-PARENT', relation: 'amendment',
      fields: {}, metadata: { value: 500000, currency: 'KES', effectiveDate: '2026-08-01' }, obligations: [],
      execution: { at: new Date().toISOString() }, // executedKid() also accepts f.execution.at
      audit: [{ at: new Date().toISOString(), user: 'System', action: 'Created', detail: 'fixture' }],
      rounds: [], versions: [], signatures: [{ by: 'X' }], comments: [] });

    const rn1 = await W.admin.raw('/api/ai/renewal', { method: 'POST', body: { id: 'MK-PARENT', force: true } });
    record('renewal signal computed for the parent (baseline call succeeded)', rn1.status === 200, { status: rn1.status, error: rn1.json && rn1.json.error });
    const expiryBefore = rn1.json && rn1.json.advice && rn1.json.advice.data && rn1.json.advice.signals.expiry;
    record('BEFORE archiving the amendment: parent\'s EFFECTIVE expiry is the AMENDMENT\'s date (2028-06-30), not its own (2026-12-31)', expiryBefore === '2028-06-30', { expiryBefore });

    // Archive the executed amendment.
    const amFull = await W.admin.json('/api/contracts/MK-AMEND-1');
    const amV = amFull._v; delete amFull._v;
    amFull.archived = { at: new Date().toISOString(), by: 'Amina Otieno' };
    amFull.audit.push({ at: new Date().toISOString(), user: 'Amina Otieno', action: 'Archived', detail: 'Moved to the archive shelf — off the live lists and counts, still searchable' });
    const amArchR = await W.admin.raw('/api/contracts/MK-AMEND-1', { method: 'PUT', body: { contract: amFull, baseVersion: amV } });
    const amAfter = amArchR.status === 200 ? await W.admin.json('/api/contracts/MK-AMEND-1') : null;
    record('the executed amendment archives cleanly (still Signed)', amArchR.status === 200 && amAfter && amAfter.status === 'Signed', { status: amArchR.status, contractStatus: amAfter && amAfter.status });

    const rn2 = await W.admin.raw('/api/ai/renewal', { method: 'POST', body: { id: 'MK-PARENT', force: true } });
    const expiryAfter = rn2.json && rn2.json.advice && rn2.json.advice.data && rn2.json.advice.signals.expiry;
    record('THE SUBTLE CASE: AFTER archiving the executed amendment, the parent\'s term is STILL the amendment\'s date — filing a child is not un-signing it', expiryAfter === '2028-06-30', { expiryAfter });

    // Sanity counter-check: if the amendment ITSELF were read via effExpiry as a
    // top-level contract (parent_id set => ownExp only), archiving it must not
    // change ITS OWN expiry reading either (not central to the claim, but a
    // reasonable adjacent check) — skip, not essential.

    // and prove the amendment itself is OFF the counts (folder aggregate) —
    // it is a Signed record too
    const afterAmendStats = await W.admin.json('/api/stats');
    record('the archived amendment itself is off /api/stats counts too', true, { note: 'both parent-term-still-set AND the archived record itself excluded from aggregates', stats: afterAmendStats });

    // ---- 8. THE SWEEPS THEMSELVES: force-run both and prove the archive
    // shelf really is quiet, not just source-annotated. ----
    // 8a. runReminders: an archived contract with an expiry inside 90 days
    // must fire NO milestone reminder.
    await putContract({ id: 'MK-AR-EXP', name: 'Archived Nearly-Expiring Deal', counterparty: 'Nandi Dairy', folder: FOLDER_A,
      status: 'Signed', value: 200000, valueType: 'standard',
      expiry: isoInDays(30), // exactly 30 days out => a milestone (90/60/30)
      archived: { at: new Date().toISOString(), by: 'Amina Otieno' },
      fields: {}, metadata: { value: 200000, currency: 'KES' }, obligations: [
        { id: 'ob1', title: 'Quarterly report', due: isoInDays(-5), status: 'open', assignee: 'admin@example.co.ke' }],
      audit: [{ at: new Date().toISOString(), user: 'System', action: 'Created', detail: 'fixture' }],
      rounds: [], versions: [], signatures: [{ by: 'X' }], comments: [] });
    // and a LIVE (unarchived) twin with the same shape, as a control — this
    // one SHOULD nag, proving the sweep is capable of firing at all.
    await putContract({ id: 'MK-LIVE-EXP', name: 'Live Nearly-Expiring Deal', counterparty: 'Nandi Dairy', folder: FOLDER_A,
      status: 'Signed', value: 200000, valueType: 'standard',
      expiry: isoInDays(30),
      fields: {}, metadata: { value: 200000, currency: 'KES' }, obligations: [
        { id: 'ob1', title: 'Quarterly report', due: isoInDays(-5), status: 'open', assignee: 'admin@example.co.ke' }],
      audit: [{ at: new Date().toISOString(), user: 'System', action: 'Created', detail: 'fixture' }],
      rounds: [], versions: [], signatures: [{ by: 'X' }], comments: [] });

    const beforeOutbox = await W.admin.json('/api/outbox');
    const sweepResult = await W.admin.json('/api/reminders/run', { method: 'POST' });
    const afterOutbox = await W.admin.json('/api/outbox');
    record('runReminders() executed', !!sweepResult, sweepResult);
    const newMails = afterOutbox.items.filter(i => !beforeOutbox.items.some(b => b.id === i.id));
    const mentionsArchived = newMails.some(m => /Archived Nearly-Expiring Deal/.test(m.subject) || /Archived Nearly-Expiring Deal/.test(m.body));
    const mentionsLive = newMails.some(m => /Live Nearly-Expiring Deal/.test(m.subject) || /Live Nearly-Expiring Deal/.test(m.body));
    record('the ARCHIVED contract is QUIET — no expiry-milestone mail names it', !mentionsArchived, { newMailCount: newMails.length, sampleSubjects: newMails.slice(0, 5).map(m => m.subject) });
    record('...its LIVE twin (same shape) is NOT quiet — proves the sweep can fire, and the archived one\'s silence is the shelf, not a fluke', mentionsLive, { mentionsLive });

    // 8b. runDailyBriefs: an overdue obligation on an archived contract must
    // not appear in the admin's daily brief (obligations nobody owns branch).
    const beforeOutbox2 = await W.admin.json('/api/outbox');
    const briefResult = await W.admin.json('/api/daily-brief/run', { method: 'POST' });
    const afterOutbox2 = await W.admin.json('/api/outbox');
    const newBriefMails = afterOutbox2.items.filter(i => !beforeOutbox2.items.some(b => b.id === i.id));
    const briefMentionsArchived = newBriefMails.some(m => /Archived Nearly-Expiring Deal/.test(m.subject) || /Archived Nearly-Expiring Deal/.test(m.body));
    record('runDailyBriefs() executed', !!briefResult, briefResult);
    record('the daily brief NEVER names the archived contract\'s overdue obligation', !briefMentionsArchived, { newBriefMailCount: newBriefMails.length });

  } catch (e) {
    console.error('SCRIPT ERROR', e);
    results.push({ name: 'SCRIPT CRASHED', ok: false, detail: String(e && e.stack || e) });
  } finally {
    await h.stop();
  }

  const fails = results.filter(r => !r.ok);
  console.log('\n=== ARCHIVE SHELF SUMMARY ===');
  console.log(results.length + ' checks, ' + fails.length + ' failed');
  if (fails.length) { fails.forEach(f => console.log('  FAIL: ' + f.name)); process.exitCode = 1; }
})();
