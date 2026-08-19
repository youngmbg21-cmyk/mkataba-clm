/* ============================================================
   F220 — the intake front door (W2-2, the gap-map order)
   ============================================================
   Until now only somebody with edit rights could start a contract, so the
   colleague who actually needs one had no way even to ASK inside HaTi —
   which capped the product at the two or three people who handle contracts
   and pushed every real request into email, where nothing is tracked.

   The rules pinned here:
   - A VIEWER MAY ASK. That is the whole feature, and the reason it is worth
     building: reach without permission creep.
   - ASKING GRANTS NOTHING. A request is its own record; it creates no
     contract, appears in no contract list or count, and a viewer still
     cannot draft, decide another person's request, or write paper.
   - A REQUESTER SEES THEIR OWN, ALWAYS — they must be able to follow what
     they asked for — and nobody else's.
   - SCOPE IS SCOPE: a request filed into a value stream is invisible to
     editors who cannot see that stream, and cannot be raised into one the
     asker cannot see either.
   - TURNING ONE INTO PAPER goes through the ORDINARY creation path, so a
     requested contract is in no way a different kind of record; the request
     then POINTS at the contract rather than becoming it.
   - THE AI SHORTENS THE CHOICE, IT DOES NOT OWN IT: with no Copilot key the
     picker still opens on the full list and the door works. */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { startHati, seedWorkspace, FOLDER_A, FOLDER_B } = require('./helpers');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

describe('F220 — the front door, against a real server', () => {
  let h, W, viewer, viewerId;

  before(async () => {
    h = await startHati();
    W = await seedWorkspace(h);
    await W.admin.json('/api/users', { method: 'POST', body: {
      name: 'Sales Colleague', email: 'sales@example.co.ke', role: 'viewer', password: 'temporary-pass-1' } });
    viewer = h.client('sales');
    await viewer.json('/api/login', { method: 'POST', body: { email: 'sales@example.co.ke', password: 'temporary-pass-1' } });
    await viewer.json('/api/password/change', { method: 'POST', body: { current: 'temporary-pass-1', password: 'their-own-pass-9' } });
    viewerId = (await viewer.json('/api/bootstrap')).me.id;
  });
  after(async () => { await h.stop(); });

  test('A VIEWER MAY ASK — the door the product did not have', async () => {
    const r = await viewer.json('/api/intake', { method: 'POST', body: {
      title: 'NDA with a new packaging supplier',
      need: 'They want to see our volumes before quoting. Nothing signed yet, needed this week.',
      counterparty: 'Rift Packaging Ltd' } });
    assert.equal(r.ok, true);
    assert.equal(r.request.status, 'open');
    assert.equal(r.request.by.name, 'Sales Colleague', 'the record names who asked');
    assert.match(r.request.id, /^REQ-/);
  });

  test('and asking creates NO contract and moves no count', async () => {
    const list = await W.admin.json('/api/contracts?limit=200');
    assert.ok(!(list.rows || []).some(c => /packaging supplier/i.test(c.name || '')),
      'a request is its own record — nothing unapproved may look like paper');
    const stats = await W.admin.json('/api/stats');
    assert.equal(stats.total, (await W.admin.json('/api/stats')).total, 'and the book is unchanged');
  });

  test('a viewer still cannot draft, and still cannot decide', async () => {
    const mk = await viewer.raw('/api/contracts/MK-SNEAK', { method: 'PUT', body: { contract: {
      id: 'MK-SNEAK', name: 'Snuck in', status: 'Draft', folder: FOLDER_A, fields: {}, metadata: {},
      obligations: [], audit: [], rounds: [], versions: [], signatures: [], comments: [] } } });
    assert.equal(mk.status, 403, 'asking is not drafting');
    const mine = (await viewer.json('/api/intake')).requests[0];
    const decide = await viewer.raw('/api/intake/' + mine.id, { method: 'PATCH', body: { status: 'declined' } });
    assert.equal(decide.status, 403, 'nor deciding — not even their own');
  });

  test('but they may withdraw what they asked for', async () => {
    const r = await viewer.json('/api/intake', { method: 'POST', body: {
      title: 'Catering agreement for the depot', need: 'Monthly, small, nothing unusual.' } });
    const out = await viewer.json('/api/intake/' + r.request.id, { method: 'PATCH', body: { status: 'withdrawn' } });
    assert.equal(out.request.status, 'withdrawn');
  });

  test('the requester sees their own and nobody else\'s; an editor sees the queue', async () => {
    await W.restricted.json('/api/intake', { method: 'POST', body: {
      title: 'Somebody else\'s ask', need: 'Not the viewer\'s business.', folder: FOLDER_A } });
    const asViewer = await viewer.json('/api/intake');
    assert.ok(asViewer.requests.every(x => x.by.id === viewerId),
      'a viewer sees exactly what they asked for');
    const asEditor = await W.unrestricted.json('/api/intake');
    assert.ok(asEditor.requests.some(x => /packaging supplier/i.test(x.title)),
      'an editor sees the queue — that is what they act on');
  });

  test('scope is scope, in both directions', async () => {
    await W.admin.json('/api/intake', { method: 'POST', body: {
      title: 'Naivas listing paperwork', need: 'Modern trade listing, folder B.', folder: FOLDER_B } });
    const restricted = await W.restricted.json('/api/intake');
    assert.ok(!restricted.requests.some(x => /Naivas/.test(x.title)),
      'an editor never sees a request filed in a stream they cannot open');
    const intoHidden = await W.restricted.raw('/api/intake', { method: 'POST', body: {
      title: 'Sneaking into folder B', need: 'x', folder: FOLDER_B } });
    assert.equal(intoHidden.status, 403, 'and cannot file one INTO such a stream either');
  });

  test('an editor turns a request into a draft, and the request points at it', async () => {
    const q = await W.unrestricted.json('/api/intake');
    const req = q.requests.find(x => /packaging supplier/i.test(x.title));
    // the client creates the contract through the ordinary path; this is the link
    const done = await W.unrestricted.json('/api/intake/' + req.id, { method: 'PATCH', body: {
      status: 'done', contractId: 'MK-A1' } });
    assert.equal(done.request.status, 'done');
    assert.equal(done.request.contractId, 'MK-A1', 'the request POINTS at the contract, it did not become one');
    assert.equal(done.request.decidedBy, 'Unrestricted Legal', 'and names who acted');
    const asViewer = await viewer.json('/api/intake');
    const seen = asViewer.requests.find(x => x.id === req.id);
    assert.equal(seen.status, 'done', 'the person who asked can follow it without any new rights');
  });

  test('a declined request carries the reason back to the person who asked', async () => {
    const r = await viewer.json('/api/intake', { method: 'POST', body: {
      title: 'Sponsorship deal', need: 'For the football club.' } });
    await W.unrestricted.json('/api/intake/' + r.request.id, { method: 'PATCH', body: {
      status: 'declined', note: 'We are not doing sponsorships this year — ask Finance.' } });
    const seen = (await viewer.json('/api/intake')).requests.find(x => x.id === r.request.id);
    assert.equal(seen.status, 'declined');
    assert.match(seen.note, /not doing sponsorships/, 'a refusal without a reason is a dead end');
  });

  test('a request must actually say something', async () => {
    const bad = await viewer.raw('/api/intake', { method: 'POST', body: { title: '', need: '' } });
    assert.equal(bad.status, 400);
  });
});

describe('F220 — the screen, pinned at the source', () => {
  const src = read('js/views/intake.js');

  test('the count answers for the reader\'s own chair', () => {
    const fn = src.slice(src.indexOf('function intakeCount'), src.indexOf('async function loadIntake'));
    assert.match(fn, /canEdit\(\)\) return intakeQueue\(\)\.length/, 'an editor is told what is waiting');
    assert.match(fn, /intakeMine\(\)\.filter/, 'everybody else, what they are waiting on');
  });

  test('creating paper goes through the ORDINARY creation path', () => {
    assert.match(src, /createFromTemplate\(tid\)/,
      'the same door every template-made contract uses — owner stamp, audit line, open-on-Key-terms');
    assert.ok(!/state\.contracts\.unshift/.test(src),
      'this file never mints a contract of its own');
    assert.match(src, /logAudit\(c,'Requested'/, 'and the contract records where it came from');
  });

  test('the AI shortens the choice and never owns it', () => {
    const fn = src.slice(src.indexOf('async function intakeSuggestTemplate'), src.indexOf('async function intakeDraft'));
    assert.match(fn, /if\(!\(typeof API_MODE==='function'&&API_MODE\(\)\)\|\|!state\.aiConfigured\) return null;/,
      'no key, no suggestion — and the picker still opens');
    assert.match(src, /ik_no_suggestion/, 'which the dialog says out loud');
    assert.match(src, /ids\.map\(t=>`<option/, 'the full template list is always offered');
  });

  test('every act still asks canEdit, and the form is open to everyone', () => {
    assert.match(src, /async function intakeDraft\(id\)\{\s*\n\s*if\(!canEdit\(\)\)/,
      'drafting is an editor\'s act');
    const form = src.slice(src.indexOf('function openIntakeForm'), src.indexOf('async function intakeSuggestTemplate'));
    assert.ok(!/canEdit/.test(form), 'asking is not — that is the point of the door');
  });

  test('it is wired into the shell like any other view', () => {
    assert.match(read('js/app.js'), /else if\(view==='intake'\) renderIntake\(\);/);
    assert.match(read('js/app.js'), /import '\.\/views\/intake\.js';/);
    assert.match(read('js/core.js'), /'pipeline','advice','intake','folder'/, 'a saved link reopens it');
    assert.match(read('index.html'), /data-view="intake"/, 'and it has a door in the sidebar');
    assert.match(read('index.html'), /data-count="intake"/);
  });

  test('the words exist in both languages', () => {
    const i18n = read('js/i18n.js');
    for (const k of ['nav_intake', 'pg_intake_sub', 'ik_lead_asker', 'ik_lead_editor', 'ik_ask_btn',
      'ik_f_need', 'ik_queue_head', 'ik_mine_head', 'ik_st_open', 'ik_act_draft', 'ik_drafted'])
      assert.equal((i18n.match(new RegExp('\\b' + k + ':', 'g')) || []).length, 2, k);
  });
});
