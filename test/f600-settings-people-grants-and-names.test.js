/* ============================================================
   f600 — Settings → People: a grant on its own, a rename that sticks, and an
   invite that says what really happened (overnight run 9 Oct 2026, stream D).

   D2  Ticking only "may re-file" or only "may put on hold" was refused
       "Nothing to change": PATCH /api/users/:id wrote both only inside the
       new-paper block and its "anything to change?" check never counted them.
   D3  A rename said "Saved" and came back on refresh: the route took no name.
       It takes one now (admin only), refuses a name another member already
       has, and the approval rules that name the person follow them — bound by
       id from here on.
   D4  Adding a member always said "an invite email was queued". The toast
       reads the server's mailReport now.
   ============================================================ */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { startHati, seedWorkspace } = require('./helpers');

const ROOT = path.join(__dirname, '..');
const SETTINGS = fs.readFileSync(path.join(ROOT, 'js/views/settings.js'), 'utf8');
const APPROVALS = fs.readFileSync(path.join(ROOT, 'js/approvals.js'), 'utf8');
const I18N = require('../js/i18n.js').STRINGS;

let h, W;
before(async () => {
  h = await startHati();
  W = await seedWorkspace(h, { approvalRules: [
    { id: 'r-old', name: 'Value ≥ 1', order: 1, cond: { type: 'value', op: '>=', value: 1 },
      approver: { kind: 'member', name: 'Unrestricted Legal' } },
  ] });
});
after(async () => { if (h) await h.stop(); });

const userRow = async (id) => ((await W.admin.json('/api/bootstrap')).users || []).find(u => u.id === id);

describe('f600 (D2) — re-file and hold are grants of their own', () => {
  test('re-file alone is written, not refused', async () => {
    const id = W.users.restricted.id;
    const r = await W.admin.json('/api/users/' + id, { method: 'PATCH', body: { reFile: true } });
    assert.equal(r.ok, true);
    assert.equal((await userRow(id)).reFile, true);
  });
  test('hold alone is written, not refused', async () => {
    const id = W.users.restricted.id;
    const r = await W.admin.json('/api/users/' + id, { method: 'PATCH', body: { holdContracts: true } });
    assert.equal(r.ok, true);
    assert.equal((await userRow(id)).holdContracts, true);
  });
  test('and neither touches the new-paper grant', async () => {
    const id = W.users.novalues.id;
    const before = (await userRow(id)).newPaper;
    await W.admin.json('/api/users/' + id, { method: 'PATCH', body: { reFile: true } });
    assert.equal((await userRow(id)).newPaper, before);
  });
  test('a colleague still cannot grant themselves either', async () => {
    const r = await W.restricted.raw('/api/users/' + W.users.restricted.id, { method: 'PATCH', body: { holdContracts: true } });
    assert.equal(r.status, 403);
  });
});

describe('f600 (D3) — a rename sticks and the approval rules follow', () => {
  test('the name is stored and read back after a refresh', async () => {
    const id = W.users.unrestricted.id;
    const r = await W.admin.json('/api/users/' + id, { method: 'PATCH', body: { name: 'Wanjiru Kamau' } });
    assert.equal(r.user.name, 'Wanjiru Kamau');
    assert.equal((await userRow(id)).name, 'Wanjiru Kamau');
  });
  test('the rule that named them by their old name now names them, by id', async () => {
    const boot = await W.admin.json('/api/bootstrap');
    const rule = (boot.settings.approvalRules || []).find(x => x.id === 'r-old');
    assert.deepEqual(rule.approver, { kind: 'member', name: 'Wanjiru Kamau', id: W.users.unrestricted.id });
  });
  test('a name another member already has is refused', async () => {
    const r = await W.admin.raw('/api/users/' + W.users.novalues.id, { method: 'PATCH', body: { name: 'wanjiru kamau' } });
    assert.equal(r.status, 409);
  });
  test('an empty name is refused', async () => {
    const r = await W.admin.raw('/api/users/' + W.users.novalues.id, { method: 'PATCH', body: { name: '  ' } });
    assert.equal(r.status, 400);
  });
  test('a colleague cannot rename themselves (only their title is theirs)', async () => {
    const r = await W.restricted.raw('/api/users/' + W.users.restricted.id, { method: 'PATCH', body: { name: 'Somebody Else' } });
    assert.equal(r.status, 403);
  });
  test('the browser sends the name and no longer keeps it only in memory', () => {
    assert.match(SETTINGS, /if\(renamed\) body\.name=name;/);
    assert.doesNotMatch(SETTINGS, /It does\s+NOT take a name today/);
  });
  test('a rule picks its approver by id, and both hosts match by id first', () => {
    assert.match(SETTINGS, /option value="member:\$\{esc\(m\.id\)\}"/);
    assert.match(SETTINGS, /\{kind:'member',name:apM\.name,id:apM\.id\}/);
    assert.match(APPROVALS, /a\.kind==='member'\) return \(a\.id!=null&&a\.id!==''\) \? String\(a\.id\)===String\(u\.id\)/);
    const SERVER = fs.readFileSync(path.join(ROOT, 'server/server.js'), 'utf8');
    assert.match(SERVER, /if \(a\.kind === 'member'\) return a\.id \? String\(a\.id\) === String\(u\.id \|\| ''\)/);
  });
});

describe('f600 (D4) — the invite toast says what the server did', () => {
  test('with no email set up the server reports the outbox', async () => {
    const r = await W.admin.json('/api/users', { method: 'POST', body: {
      name: 'New Person', email: 'new.person@example.co.ke', role: 'legal', password: 'temporary-pass-1' } });
    assert.equal(r.emailSent, false);
    assert.equal(r.outbox, true);
  });
  test('the toast reads that report, and never says "queued" any more', () => {
    assert.match(SETTINGS, /\(mailed && mailed\.emailSent\) \? 'set_t_invite_sent'/);
    assert.match(SETTINGS, /\(mailed && mailed\.outbox\) \? 'set_t_invite_outbox' : 'set_t_invite_failed'/);
    assert.doesNotMatch(SETTINGS, /i18t\('set_t_invite_queued'\)/);
  });
  test('both books carry all three sentences', () => {
    for (const lang of ['en', 'sv'])
      for (const k of ['set_t_invite_sent', 'set_t_invite_outbox', 'set_t_invite_failed'])
        assert.ok(I18N[lang][k], `${lang}.${k}`);
  });
});
