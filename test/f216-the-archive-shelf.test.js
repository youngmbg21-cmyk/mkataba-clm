/* ============================================================
   F216 — the archive shelf (WO-5, the gap-map order)
   ============================================================
   The delete refusal on an executed contract has always said "archive it
   instead" — and no archive existed. Now it does, and its rules are pinned:

   - ARCHIVED IS A FILING FACT BESIDE STATUS, not a status: an archived
     Signed contract stays Signed, and archiving writes NOTHING that the
     executed-immutability guard protects.
   - IT LEAVES EVERY DEFAULT LIST, COUNT AND SWEEP: the register (unless the
     Archived view is chosen), the dashboard's one reading (hmDashSlices),
     the alerts, insights' live book, the negotiations door (negoIsLive),
     the reminder sweep and the daily brief.
   - IT STAYS FINDABLE — FTS still indexes it, the palette tags it — which
     is the whole difference between filing and deleting.
   - AN ARCHIVED EXECUTED AMENDMENT STILL SETS ITS PARENT'S TERM. Archiving
     is filing, not un-signing: the family arithmetic must not move.
   - REVERSIBLE, EDITOR-AND-UP, AUDITED BOTH WAYS in English records.

   Server halves run against a real server with the recording mail stub; the
   client halves are pinned at the source the way the shell's features are. */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { startHatiWithMail, seedWorkspace, FOLDER_A } = require('./helpers');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const isoDay = off => {
  const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + off);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

describe('F216 — the archive shelf, against a real server', () => {
  let h, W, mail;
  const pause = ms => new Promise(r => setTimeout(r, ms));
  const put = (id, over) => W.admin.json('/api/contracts/' + id, { method: 'PUT', body: { contract: {
    id, name: over.name || ('Shelf fixture ' + id), counterparty: 'Savannah Consumer Goods Limited',
    folder: FOLDER_A, status: 'Draft', fields: {}, metadata: {}, obligations: [],
    audit: [], rounds: [], versions: [], signatures: [], comments: [], ...over } } });
  const putBack = async (id, mut) => {
    const c = await W.admin.json('/api/contracts/' + id);
    const v = c._v; delete c._v; delete c._brief;
    mut(c);
    return W.admin.json('/api/contracts/' + id, { method: 'PUT', body: { contract: c, baseVersion: v } });
  };

  before(async () => { h = await startHatiWithMail(); W = await seedWorkspace(h); mail = h.mail; });
  after(async () => { await h.stop(); });

  test('the archived flag survives the light list — every count reads it there', async () => {
    await put('MK-AR-1', { name: 'Old warehouse porterage terms' });
    await putBack('MK-AR-1', c => { c.archived = { at: new Date().toISOString(), by: 'Amina Otieno' }; });
    const list = await W.admin.json('/api/contracts?limit=200');
    const row = (list.rows || []).find(r => r.id === 'MK-AR-1');
    assert.ok(row, 'the row still lists — the SERVER does not hide it; the client\'s lists decide');
    assert.ok(row.archived && row.archived.by === 'Amina Otieno',
      'and the flag rides the light projection like `seeded` does');
  });

  test('an archived contract stops nagging — and nags again when restored', async () => {
    await put('MK-AR-REM', { obligations: [{ id: 'ob_a', desc: 'Send the pallet reconciliation',
      due: isoDay(-1), status: 'open' }] });
    await putBack('MK-AR-REM', c => { c.archived = { at: new Date().toISOString(), by: 'Amina Otieno' }; });
    mail.reset();
    assert.equal((await W.admin.raw('/api/reminders/run', { method: 'POST', body: {} })).status, 200);
    await pause(500);
    assert.ok(!mail.sent.some(m => (m.subject + m.text).includes('pallet reconciliation')),
      'the shelf is quiet — no overdue mail for an archived contract');
    await putBack('MK-AR-REM', c => { delete c.archived; });
    mail.reset();
    assert.equal((await W.admin.raw('/api/reminders/run', { method: 'POST', body: {} })).status, 200);
    const end = Date.now() + 2000;
    while (Date.now() < end && !mail.sent.some(m => (m.subject + m.text).includes('pallet reconciliation'))) await pause(25);
    assert.ok(mail.sent.some(m => (m.subject + m.text).includes('pallet reconciliation')),
      'restored, the same duty fires — it was the archive doing the silencing, nothing else');
  });

  test('the daily brief passes the shelf by too', async () => {
    await put('MK-AR-DB', { obligations: [{ id: 'ob_b', desc: 'Lodge the excise return',
      due: isoDay(2), status: 'open', assignee: 'Unrestricted Legal' }] });
    await putBack('MK-AR-DB', c => { c.archived = { at: new Date().toISOString(), by: 'Amina Otieno' }; });
    mail.reset();
    assert.equal((await W.admin.raw('/api/daily-brief/run', { method: 'POST', body: {} })).status, 200);
    await pause(600);
    assert.ok(!mail.sent.some(m => (m.subject + m.text).includes('Lodge the excise return')),
      'an archived duty briefs nobody');
  });

  test('still findable: the wording index keeps an archived contract', async () => {
    const r = await W.admin.json('/api/search?q=' + encodeURIComponent('porterage'));
    assert.ok((r.hits || []).some(hh => hh.id === 'MK-AR-1'),
      'filing is not deleting — search still answers');
  });

  test('a SIGNED contract can be archived — the flag is additive, like a note', async () => {
    await put('MK-AR-SIGNED', { status: 'Signed', name: 'Completed haulage frame agreement' });
    const r = await putBack('MK-AR-SIGNED', c => { c.archived = { at: new Date().toISOString(), by: 'Amina Otieno' }; });
    assert.ok(r && r.ok !== false, 'the executed-immutability guard has no quarrel with filing');
    const c2 = await W.admin.json('/api/contracts/MK-AR-SIGNED');
    assert.equal(c2.status, 'Signed', 'archived is a fact BESIDE status — the status never moved');
    assert.ok(c2.archived, 'and the shelf has it');
  });

  test('the SQL aggregates leave the shelf out too — the server\'s figures follow the screens', async () => {
    /* /api/stats feeds the register head-count and dashboard figures in server
       mode; a server total that still counted the shelf would be the head
       saying 146 over a table showing 145. */
    await put('MK-AR-VAL', { name: 'Retired canteen concession', value: 777000, status: 'Draft' });
    const before = await W.admin.json('/api/stats');
    await putBack('MK-AR-VAL', c => { c.archived = { at: new Date().toISOString(), by: 'Amina Otieno' }; });
    const after2 = await W.admin.json('/api/stats');
    assert.equal(after2.total, before.total - 1, 'the count follows the filing');
    assert.equal(Math.round(before.totalValue - after2.totalValue), 777000,
      'and so does the money — a filed-away value is off the headline figure');
  });

  test('the delete refusal\'s old promise is finally true', async () => {
    const r = await W.admin.raw('/api/contracts/MK-AR-SIGNED', { method: 'DELETE' });
    assert.equal(r.status, 409);
    assert.match(r.text, /archive it/i,
      'the refusal still points at the shelf — and now the shelf exists');
  });
});

describe('F216 — the client\'s rules, pinned at the source', () => {
  test('the register: archived leaves every default list and returns under ONE view', () => {
    const reg = read('js/views/register.js');
    assert.match(reg, /if\(R\.view==='archived'\) cs=cs\.filter\(c=>!!c\.archived\);\s*\n\s*else cs=cs\.filter\(c=>!c\.archived\);/,
      'one pair of lines: the view shows the shelf, everything else excludes it');
    assert.match(reg, /\{k:'archived',\s*get label\(\)\{ return i18t\('reg_view_archived'\); \}\}/,
      'and the view is offered where the saved views live');
    assert.match(reg, /\{k:'archive',/); assert.match(reg, /\{k:'restore',/);
    assert.match(reg, /folderContracts\(f\.id\)\.filter\(c=>!c\.archived\)/,
      'the stream drawer is a daily list too');
  });

  test('the one dashboard door, the alerts, insights and the negotiations door all exclude it', () => {
    assert.match(read('js/views/home.js'),
      /function hmDashSlices\(\)\{[\s\S]{0,400}?const cs=\(state\.contracts\|\|\[\]\)\.filter\(c=>!c\.archived\);/,
      'hmDashSlices filters at the door — every KPI, the pipeline and Decisions due inherit');
    assert.match(read('js/app.js'),
      /function buildAlerts\(\)\{[\s\S]{0,300}?const cs=\(state\.contracts\|\|\[\]\)\.filter\(c=>!c\.archived\);/,
      'the bell alerts nobody about the shelf');
    assert.match(read('js/views/portfolio.js'),
      /const pfLive = \(\) => \(state\.contracts\|\|\[\]\)\.filter\(c=>c\.status!=='Declined'&&!c\.archived\);/,
      'insights\' LIVE definition moved with it — f151 holds the surfaces together');
    assert.match(read('js/views/negotiation.js'),
      /if \(c\.archived\) return false;\s*\/\/ the shelf argues with nobody/,
      'negoIsLive is the negotiations door\'s one predicate, and it refuses');
  });

  test('an archived executed amendment STILL sets its parent\'s term — both twins', () => {
    /* Archiving is filing, not un-signing. The client's effectiveExpiry kids
       filter must NOT gain an archived test, and the server's skip must sit
       at the reminder loop, never inside effExpiryReader. */
    const fam = read('js/family.js');
    const kids = fam.slice(fam.indexOf("TERM_CHANGING.has") - 200, fam.indexOf("TERM_CHANGING.has") + 200);
    assert.ok(!/archived/.test(kids), 'the family arithmetic reads signatures, not filing');
    const srv = read('server/server.js');
    const reader = srv.slice(srv.indexOf('function effExpiryReader'), srv.indexOf('function runReminders'));
    assert.ok(!/archived/.test(reader), 'the server twin likewise');
    assert.match(srv, /if \(full\.archived\) continue;/,
      'the sweep skips at the contract loop instead');
  });

  test('the act is one function, audited both ways, editor-and-up', () => {
    const core = read('js/core.js');
    const act = core.slice(core.indexOf('function contractSetArchived'), core.indexOf('async function flushSaves'));
    assert.match(act, /canEdit/, 'viewers are refused in words');
    assert.match(act, /logAudit\(c,on\?'Archived':'Restored'/, 'both directions leave an English record');
    assert.match(act, /still searchable/, 'and the record says what filing means');
    const ct = read('js/views/contract.js');
    assert.match(ct, /id="ws-archive"/, 'the room\'s ⋯ carries the same act');
    assert.match(ct, /c\.archived\?' · '\+i18t\('ct_archived_tag'\):''/, 'and the room\'s sub-line says so');
  });

  test('the palette tags an archived row instead of hiding it', () => {
    assert.match(read('js/app.js'), /c\.archived\?' · '\+i18t\('ct_archived_tag'\):''/,
      'findable, and honest about what it is');
  });

  test('every server aggregate reads the shelf the same way', () => {
    const srv = read('server/server.js');
    assert.match(srv, /const NOT_ARCH = "json_extract\(json,'\$\.archived'\) IS NULL";/,
      'one named fragment, not a per-query improvisation');
    for (const route of ["app.get('/api/stats'", "app.get('/api/analytics'"]) {
      const body = srv.slice(srv.indexOf(route), srv.indexOf(route) + 2600);
      assert.ok(/NOT_ARCH/.test(body), route + ' excludes the shelf');
    }
    const mr = srv.slice(srv.indexOf('function buildMonthlyReport'), srv.indexOf('function runMonthlyReport'));
    assert.match(mr, /filter\(x => !x\.c\.archived\)/, 'the monthly letter reads the live book');
  });

  test('the new words exist in BOTH languages', () => {
    const i18n = read('js/i18n.js');
    for (const k of ['reg_view_archived', 'reg_archive', 'reg_restore', 'ct_archived_tag',
      'ar_archive_title', 'ar_restore_title', 'ar_archived_toast', 'ar_restored_toast', 'ar_editors_only'])
      assert.equal((i18n.match(new RegExp('\\b' + k + ':', 'g')) || []).length, 2,
        k + ' must be defined exactly once per language');
  });
});
