/* Signing capacity — a signature block must state the capacity someone signed
   in, not the permission level they hold in the software.

   The bug: `role` (admin/legal/viewer) is a PERMISSION LEVEL; `title` (COO,
   Finance Director) is a CAPACITY. Nothing recorded a title for a team member,
   and the signature block filled the gap with the permission level — so a COO
   who was also the workspace admin signed as "Amina Otieno, Admin". A missing
   capacity must render as nothing at all, because a permission level is not a
   weaker version of the truth, it is a different claim. */
const { test, before, after, describe } = require('node:test');
const assert = require('node:assert/strict');
const { startHati, seedWorkspace } = require('./helpers');
const { loadViews, STUB_TEMPLATES, STUB_FOLDERS } = require('./dom');

function loadCore(overrides = {}) {
  return loadViews(['js/core.js'], {
    TEMPLATES: STUB_TEMPLATES, FOLDERS: STUB_FOLDERS,
    docBody: () => '<p>doc</p>', captureVersion: () => null, docFormat: f => f,
    updateSidebarCounts() {}, renderWorkspace() {}, setView() {}, renderSignButton() {},
    ...overrides,
  });
}

const sig = extra => ({ party: 'first', name: 'Amina Otieno', email: 'a@x.co.ke',
  at: '2026-07-10T06:00:00.000Z', method: 'session-authenticated', form: 'drawn', ...extra });

describe('capacity — the rule', () => {
  test('a recorded job title is the capacity', () => {
    const { signatureCapacity } = loadCore();
    assert.equal(signatureCapacity(sig({ title: 'Chief Operating Officer' })), 'Chief Operating Officer');
  });

  test('a permission level is NOT a capacity, and is suppressed', () => {
    const { signatureCapacity } = loadCore();
    // 'Legal' is the name the Editor role carried before the rename; a
    // signature taken then still holds it, and it is still not a capacity
    for (const r of ['Admin', 'Legal', 'Editor', 'Viewer'])
      assert.equal(signatureCapacity(sig({ role: r })), '',
        `"${r}" is a permission level and must never be shown as a signing capacity`);
  });

  test('an old signature that carries a real title in the route field still shows it', () => {
    // the signing route's field is labelled "Title (e.g. CFO)" but stored as `role`
    const { signatureCapacity } = loadCore();
    assert.equal(signatureCapacity(sig({ role: 'Finance Director' })), 'Finance Director');
  });

  test('a title always wins over anything in the route field', () => {
    const { signatureCapacity } = loadCore();
    assert.equal(signatureCapacity(sig({ title: 'COO', role: 'Admin' })), 'COO');
  });

  test('nothing recorded means nothing shown', () => {
    const { signatureCapacity } = loadCore();
    assert.equal(signatureCapacity(sig({})), '');
    assert.equal(signatureCapacity(null), '');
  });
});

describe('capacity — where it is read from when signing', () => {
  test('the account title is preferred', () => {
    const { signerTitle } = loadCore({ directoryLookup: () => null });
    assert.equal(signerTitle({ name: 'Amina', email: 'a@x.co.ke', role: 'admin', title: 'COO' }), 'COO');
  });

  test('the people directory is the fallback', () => {
    // the real orgDirectory()/directoryLookup(), driven by a real directory —
    // this is the path an imported contacts CSV feeds
    const sb = loadCore({ REMOTE: null });
    sb.state.settings = { directory: [{ name: 'Amina', email: 'a@x.co.ke', title: 'Finance Director' }] };
    assert.equal(sb.signerTitle({ name: 'Amina', email: 'a@x.co.ke', role: 'admin' }), 'Finance Director');
  });

  test('with neither, it is empty — never the permission level', () => {
    const sb = loadCore({ REMOTE: null });
    sb.state.settings = { directory: [] };
    assert.equal(sb.signerTitle({ name: 'Amina', email: 'a@x.co.ke', role: 'admin' }), '',
      'an admin with no title must sign with no capacity, not as "Admin"');
  });
});

describe('capacity — what the signed contract shows', () => {
  const SIGNED = title => ({
    id: 'MK-A1', name: 'Refined Sugar Supply', counterparty: 'Kabras Sugar', folder: 'proc',
    status: 'Signed', value: 48000000, valueType: 'standard', template: 'RM',
    hash: 'f'.repeat(64), signedAt: '10 Jul 2026', sealVersion: 2,
    execution: { at: '2026-07-10T06:00:00.000Z', textHash: 'a'.repeat(64), html: '<p>x</p>', hashMode: 'text' },
    signatures: [sig(title)], audit: [], comments: [], fields: {},
  });
  const render = c => {
    const sb = loadViews(['js/views/contract.js'], {
      isUpload: () => false, isExternallyExecuted: () => false,
      generatePseudo: () => 'x'.repeat(60), fmtDT: iso => String(iso), statusChip: s => `<span>${s}</span>`,
    });
    return sb.signatureBlock(c);
  };

  test('the block prints the job title', () => {
    const html = render(SIGNED({ title: 'Chief Operating Officer' }));
    assert.ok(html.includes('Amina Otieno, Chief Operating Officer'));
  });

  test('the block never prints "Admin" as a capacity', () => {
    const html = render(SIGNED({ role: 'Admin' }));
    assert.ok(!html.includes('Amina Otieno, Admin'), 'a permission level is on the document face');
    assert.ok(html.includes('Amina Otieno'), 'the name itself must still be there');
  });
});

describe('capacity — the evidence pack records it', () => {
  test('the pack carries a capacity field, empty when none was recorded', () => {
    const sb = loadCore();
    let written = null;
    sb.downloadFile = (n, content) => { written = content; };
    sb.downloadEvidence({ id: 'MK-A1', name: 'x', counterparty: 'y', value: 1, valueType: 'standard',
      status: 'Signed', hash: 'f'.repeat(64), audit: [],
      signatures: [sig({ title: 'Chief Operating Officer' }), sig({ name: 'No Title', role: 'Admin' })] });
    const pack = JSON.parse(written);
    assert.equal(pack.signatures[0].capacity, 'Chief Operating Officer',
      'the evidence pack must record in what capacity each person signed');
    assert.equal(pack.signatures[1].capacity, null,
      'no capacity recorded must stay empty — never back-filled from a permission level');
  });
});

describe('capacity — the seal is unaffected', () => {
  test('adding a title does not change the string a contract is sealed over', () => {
    const sb = loadCore();
    sb.FIRST_PARTY = 'Highland Corporate Ltd';
    const base = { id: 'MK-A1', counterparty: 'Kabras', value: 48000000, valueType: 'standard',
      sealVersion: 2, execution: { at: '2026-07-10T06:00:00.000Z', textHash: 'a'.repeat(64) } };
    const without = sb.sealString({ ...base, signatures: [sig({})] });
    const withTitle = sb.sealString({ ...base, signatures: [sig({ title: 'Chief Operating Officer' })] });
    assert.equal(withTitle, without,
      'the seal covers name, time, form and mark — not capacity. Recording a title must not move any existing hash.');
  });
});

describe('capacity — the server stores and serves it', () => {
  let h, W;
  before(async () => { h = await startHati(); W = await seedWorkspace(h); });
  after(async () => { await h.stop(); });

  test('the workspace founder can record a title at setup', async () => {
    const fresh = await startHati();
    try {
      const c = fresh.client('founder');
      const r = await c.json('/api/setup', { method: 'POST', body: {
        org: 'Tamu Beverages Ltd', name: 'Amina Otieno', title: 'Chief Operating Officer',
        email: 'coo@tamu.co.ke', password: 'adminpassword1' } });
      assert.equal(r.me.title, 'Chief Operating Officer',
        'the founder is the person most likely to sign — setup must ask for their title');
      assert.equal((await c.json('/api/bootstrap')).me.title, 'Chief Operating Officer');
    } finally { await fresh.stop(); }
  });

  test('a new member can be given a title', async () => {
    const r = await W.admin.json('/api/users', { method: 'POST', body: {
      name: 'Wanjiku Kamau', email: 'wanjiku@example.co.ke', role: 'legal',
      title: 'Head of Legal', password: 'temporary-pass-1' } });
    assert.equal(r.user.title, 'Head of Legal');
  });

  test('an admin can set another member\'s title', async () => {
    const id = W.users.unrestricted.id;
    const r = await W.admin.json('/api/users/' + id, { method: 'PATCH', body: { title: 'Finance Director' } });
    assert.equal(r.user.title, 'Finance Director');
    assert.equal((await W.unrestricted.json('/api/bootstrap')).me.title, 'Finance Director');
  });

  test('a member can set their OWN title — a permission is granted, a job title is a fact', async () => {
    const r = await W.restricted.json('/api/users/' + W.users.restricted.id, { method: 'PATCH', body: { title: 'Procurement Lead' } });
    assert.equal(r.user.title, 'Procurement Lead');
  });

  test('but still cannot grant themselves anything else', async () => {
    const bad = await W.restricted.raw('/api/users/' + W.users.restricted.id, { method: 'PATCH', body: { canViewValues: true } });
    assert.equal(bad.status, 403);
    const other = await W.restricted.raw('/api/users/' + W.users.novalues.id, { method: 'PATCH', body: { title: 'Nice Try' } });
    assert.equal(other.status, 403, 'a non-admin must not retitle a colleague');
    const role = await W.restricted.raw('/api/users/' + W.users.restricted.id, { method: 'PATCH', body: { role: 'admin' } });
    assert.equal(role.status, 403);
  });

  test('an admin still cannot change their own role or value access', async () => {
    const me = (await W.admin.json('/api/bootstrap')).me;
    assert.equal((await W.admin.raw('/api/users/' + me.id, { method: 'PATCH', body: { role: 'legal' } })).status, 400);
    assert.equal((await W.admin.raw('/api/users/' + me.id, { method: 'PATCH', body: { canViewValues: false } })).status, 400);
    // …but can record their own job title
    const ok = await W.admin.json('/api/users/' + me.id, { method: 'PATCH', body: { title: 'Chief Operating Officer' } });
    assert.equal(ok.user.title, 'Chief Operating Officer');
  });

  test('an account created before this change simply has no title', async () => {
    assert.equal((await W.novalues.json('/api/bootstrap')).me.title, '',
      'no title recorded must read as empty, not as a permission level');
  });
});
