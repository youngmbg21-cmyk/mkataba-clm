'use strict';
/* f1133 — A REQUEST SAYS WHEN IT WAS TAKEN (P-32 review, 22 Nov 2026: the drawing's timeline says "You took it · 18 Nov").
   (1) the PATCH that names a holder stamps the moment (takenAt); a request nobody holds has none.
   (2) handing it on to someone else stamps it again; the same holder saved again keeps the first stamp.
   (3) putting it down clears it; the tracker page (no login) never says it.
   (4) the panel's timeline reads the stamp, and an old request without one says no day (nothing invented).
   AT THE PARENT every test here fails: the column, the stamp and the reading do not exist. */
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { startHati, seedWorkspace } = require('./helpers');

let h, W, me, req;
before(async () => {
  h = await startHati({ HATI_AGENTS_AUTO: 'off' });
  W = await seedWorkspace(h, { approvalRules: [] });
  me = (await W.admin.json('/api/bootstrap')).me;
  req = (await W.restricted.json('/api/intake', { method: 'POST', body: { title: 'NDA with a supplier', need: 'They want our volumes first.', counterparty: 'Rift Packaging Ltd' } })).request;
});
after(async () => { await h.stop(); });
const get = async id => ((await W.admin.json('/api/intake')).requests || []).find(r => r.id === id);

test('f1133 (1) taking a request stamps the moment; nobody holding it, no stamp', async () => {
  assert.ok(req && req.id, 'the request was made');
  assert.equal((await get(req.id)).takenAt, null, 'nobody holds it yet');
  const t0 = Date.now();
  const out = await W.admin.json('/api/intake/' + req.id, { method: 'PATCH', body: { status: 'open', assignee: me.id } });
  assert.ok(out.ok && out.request.takenAt, 'the take is stamped');
  const at = Date.parse(out.request.takenAt);
  assert.ok(at >= t0 - 2000 && at <= Date.now() + 2000, 'stamped now');
});

test('f1133 (2) the same holder saved again keeps the stamp; handing on stamps again', async () => {
  const first = (await get(req.id)).takenAt;
  const again = await W.admin.json('/api/intake/' + req.id, { method: 'PATCH', body: { status: 'open', assignee: me.id } });
  assert.equal(again.request.takenAt, first, 'the same holder, the same moment');
  const other = ((await W.admin.json('/api/bootstrap')).users || []).find(u => u && u.id !== me.id && u.role !== 'viewer');
  assert.ok(other, 'a colleague who edits');
  await new Promise(r => setTimeout(r, 15));
  const on = await W.admin.json('/api/intake/' + req.id, { method: 'PATCH', body: { status: 'open', assignee: other.id } });
  assert.ok(on.request.takenAt && on.request.takenAt !== first, 'handed on: a new moment');
});

test('f1133 (3) put down, the stamp goes; the tracker page never says it', async () => {
  const down = await W.admin.json('/api/intake/' + req.id, { method: 'PATCH', body: { status: 'open', assignee: '' } });
  assert.equal(down.request.takenAt, null);
  const SRV = fs.readFileSync(path.join(__dirname, '..', 'server', 'server.js'), 'utf8');
  const i = SRV.indexOf("app.get('/track/:token'"); assert.ok(i > 0, 'the tracker route is there');
  assert.doesNotMatch(SRV.slice(i, i + 6000), /taken_at|takenAt/, 'the tracker never reads it');
});

test('f1133 (4) the timeline reads the stamp; without one it says no day', () => {
  const SRC = fs.readFileSync(path.join(__dirname, '..', 'js', 'views', 'intake.js'), 'utf8');
  assert.match(SRC, /i18t\('ikn_tl_you_took'\) : i18t\('ikn_tl_took', [^\n]*iknDay\(r\.takenAt\), 'held'\)/);
  assert.match(SRC, /function iknDay\(iso\)\{\s*const t = Date\.parse\(String\(iso \|\| ''\)\); if \(!isFinite\(t\)\) return '';/, 'no stamp, no day');
});
