/* ============================================================
   f101 — the Template Library foundation (Phase A of the brief)

   A template and a contract are different objects, and the template is the
   parent. This file pins the library's ground rules server-side, because the
   front end hides nothing the server does not also block:

     · only a template manager (Admin or Legal) can create, edit, publish or
       archive; a viewer's writes are refused with a 403
     · a DRAFT template is invisible to non-managers — it reads as 404, the
       same "does not exist" answer the contracts routes give — and becomes
       visible the moment it is published
     · a published version is immutable: editing it answers 409, and edits go
       to a new draft version instead
     · a template that has spawned contracts can never be hard-deleted (409);
       archive is the only exit, and archiving does not break the child's link
     · a contract's template provenance (template_id / template_version_id)
       is written once and can never be overwritten by a later save
     · org branding and org profile values round-trip, manager-only on write
   ============================================================ */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startHati, seedWorkspace } = require('./helpers');

describe('f101 — template library foundation', () => {
  let h, w, viewer;

  before(async () => {
    h = await startHati();
    w = await seedWorkspace(h);
    // seedWorkspace has no viewer — the library's "everyone else" is exactly
    // the viewer role, so make one the way an admin would.
    await w.admin.json('/api/users', { method: 'POST', body: {
      name: 'Read Only', email: 'viewer@example.co.ke', role: 'viewer', password: 'temporary-pass-1' } });
    viewer = h.client('viewer');
    await viewer.json('/api/login', { method: 'POST', body: { email: 'viewer@example.co.ke', password: 'temporary-pass-1' } });
    await viewer.json('/api/password/change', { method: 'POST', body: { current: 'temporary-pass-1', password: 'their-own-pass-9' } });
  });
  after(async () => { await h.stop(); });

  let tplId, v1Id;

  test('a manager creates a template shell: draft status, v1 draft, in the library list', async () => {
    const r = await w.admin.json('/api/templates', { method: 'POST', body: {
      name: 'Account Opening Form', description: 'Standard client onboarding paper', category: 'sales' } });
    tplId = r.template.id;
    assert.equal(r.template.status, 'draft');
    assert.equal(r.template.latestVersion, 1);
    assert.equal(r.template.publishedVersion, null);

    const detail = await w.admin.json('/api/templates/' + tplId);
    assert.equal(detail.versions.length, 1);
    assert.equal(detail.versions[0].status, 'draft');
    v1Id = detail.versions[0].id;

    const list = await w.admin.json('/api/templates');
    assert.ok(list.templates.some(t => t.id === tplId), 'the manager sees the draft in the library');
    assert.equal(list.canManage, true);
  });

  test('a viewer cannot create, and cannot see the draft at all', async () => {
    const create = await viewer.raw('/api/templates', { method: 'POST', body: { name: 'Nope' } });
    assert.equal(create.status, 403);

    const list = await viewer.json('/api/templates');
    assert.equal(list.canManage, false);
    assert.ok(!list.templates.some(t => t.id === tplId), 'the draft is not in a viewer’s library');

    const get = await viewer.raw('/api/templates/' + tplId);
    assert.equal(get.status, 404, 'a draft reads as "does not exist" to a non-manager, not as "forbidden"');
  });

  test('publish validates: a guided field with no options and an empty label are both refused', async () => {
    const put = await w.admin.json(`/api/templates/${tplId}/versions/${v1Id}`, { method: 'PUT', body: {
      blocks: [{ orderIndex: 0, blockType: 'heading', content: 'Company information' }],
      fields: [
        { fieldKey: 'company_name', label: '', fieldType: 'short_text', required: true },
        { fieldKey: 'payment_terms', label: 'Payment terms', fieldType: 'select', control: 'guided', options: [] },
      ] } });
    assert.equal(put.ok, true);
    const pub = await w.admin.raw(`/api/templates/${tplId}/versions/${v1Id}/publish`, { method: 'POST', body: {} });
    assert.equal(pub.status, 400);
    assert.ok(pub.json.problems.some(p => /no label/.test(p)), 'names the unlabeled field');
    assert.ok(pub.json.problems.some(p => /no options/.test(p)), 'names the optionless guided field');
  });

  test('publishing a valid draft makes the template visible to everyone', async () => {
    await w.admin.json(`/api/templates/${tplId}/versions/${v1Id}`, { method: 'PUT', body: {
      blocks: [
        { orderIndex: 0, blockType: 'heading', content: 'Company information' },
        { orderIndex: 1, blockType: 'field_group', content: 'Company: {{company_name}} · KRA PIN: {{kra_pin}}' },
        { orderIndex: 2, blockType: 'fixed_text', content: 'Article 1. Invoices are payable within thirty (30) days.' },
        { orderIndex: 3, blockType: 'signature_block', content: 'Director' },
      ],
      fields: [
        { fieldKey: 'company_name', label: 'Company name', fieldType: 'short_text', required: true },
        { fieldKey: 'kra_pin', label: 'KRA PIN', fieldType: 'kenya_tax_id', required: true },
        { fieldKey: 'payment_terms', label: 'Payment terms', fieldType: 'select', control: 'guided', options: ['30 days', '45 days', '60 days'] },
        { fieldKey: 'director_sign', label: 'Director', fieldType: 'signature_name_title' },
      ] } });
    const pub = await w.admin.json(`/api/templates/${tplId}/versions/${v1Id}/publish`, { method: 'POST', body: {
      changeNote: 'First published version' } });
    assert.equal(pub.ok, true);
    assert.deepEqual(pub.warnings, [], 'a template with a signature block publishes without warnings');

    const list = await viewer.json('/api/templates');
    const t = list.templates.find(x => x.id === tplId);
    assert.ok(t, 'the viewer sees the template once published');
    assert.equal(t.status, 'published');
    assert.equal(t.publishedVersion, 1);

    const detail = await viewer.json('/api/templates/' + tplId);
    assert.equal(detail.versions.length, 1);
    assert.equal(detail.versions[0].changeNote, 'First published version');

    // and the viewer can read the published content (they create contracts from it)
    const content = await viewer.json(`/api/templates/${tplId}/versions/${v1Id}`);
    assert.equal(content.blocks.length, 4);
    assert.equal(content.fields.length, 4);
    assert.deepEqual(content.fields.find(f => f.field_key === 'payment_terms').options, ['30 days', '45 days', '60 days']);
  });

  test('a published version is immutable — edits answer 409 and go to a new draft instead', async () => {
    const put = await w.admin.raw(`/api/templates/${tplId}/versions/${v1Id}`, { method: 'PUT', body: { blocks: [], fields: [] } });
    assert.equal(put.status, 409);
    assert.match(put.json.error, /never be edited/);

    const draft = await w.admin.json(`/api/templates/${tplId}/versions`, { method: 'POST' });
    assert.equal(draft.versionNumber, 2);
    // the new draft is seeded from v1, so a manager iterates on what is live
    const content = await w.admin.json(`/api/templates/${tplId}/versions/${draft.versionId}`);
    assert.equal(content.blocks.length, 4);
    assert.equal(content.fields.length, 4);
    // only one open draft at a time
    const again = await w.admin.raw(`/api/templates/${tplId}/versions`, { method: 'POST' });
    assert.equal(again.status, 409);
    // a non-manager never sees the draft-in-progress in the version list
    const seen = await viewer.json('/api/templates/' + tplId);
    assert.ok(!seen.versions.some(v => v.status === 'draft'), 'draft versions are a manager-only sight');
    const peek = await viewer.raw(`/api/templates/${tplId}/versions/${draft.versionId}`);
    assert.equal(peek.status, 404);
  });

  test('template provenance on a contract is written once and never overwritten', async () => {
    const c = {
      id: 'MK-901', name: 'Account Opening — Kabras', counterparty: 'Kabras Sugar',
      folder: 'proc', value: 0, valueType: 'none', status: 'Draft',
      libraryTemplateId: tplId, libraryTemplateVersionId: v1Id,
      fields: {}, comments: [], audit: [], signatures: [],
    };
    await w.admin.json('/api/contracts/MK-901', { method: 'PUT', body: { contract: c, baseVersion: 0 } });

    // a later save that tries to point the contract at "nothing" (or anywhere
    // else) is silently corrected back to the recorded parent
    const tampered = { ...c, libraryTemplateId: 'tpl_forged', libraryTemplateVersionId: null };
    await w.admin.json('/api/contracts/MK-901', { method: 'PUT', body: { contract: tampered, baseVersion: 1 } });
    const back = await w.admin.json('/api/contracts/MK-901');
    assert.equal(back.libraryTemplateId, tplId, 'provenance survives a tampering save');
    assert.equal(back.libraryTemplateVersionId, v1Id);

    const list = await w.admin.json('/api/templates');
    assert.equal(list.templates.find(t => t.id === tplId).contractsCreated, 1, 'the library counts the child');
  });

  test('a template with children can be archived, never deleted — and the child keeps its link', async () => {
    const del = await w.admin.raw('/api/templates/' + tplId, { method: 'DELETE' });
    assert.equal(del.status, 409);
    assert.match(del.json.error, /archived, never deleted/);

    const arch = await w.admin.json('/api/templates/' + tplId, { method: 'PATCH', body: { status: 'archived' } });
    assert.equal(arch.template.status, 'archived');

    // archived is still visible (the audit trail of its children points here) …
    const seen = await viewer.json('/api/templates/' + tplId);
    assert.equal(seen.template.status, 'archived');
    // … and the child still cites it
    const child = await w.admin.json('/api/contracts/MK-901');
    assert.equal(child.libraryTemplateId, tplId);

    // restore brings it back to published (it has a published version)
    const rest = await w.admin.json('/api/templates/' + tplId, { method: 'PATCH', body: { status: 'restore' } });
    assert.equal(rest.template.status, 'published');
  });

  test('an unused draft template deletes cleanly; viewers cannot archive or delete anything', async () => {
    const r = await w.admin.json('/api/templates', { method: 'POST', body: { name: 'Scratch', category: 'other' } });
    const va = await viewer.raw('/api/templates/' + r.template.id, { method: 'PATCH', body: { status: 'archived' } });
    assert.equal(va.status, 403);
    const vd = await viewer.raw('/api/templates/' + r.template.id, { method: 'DELETE' });
    assert.equal(vd.status, 403);
    const del = await w.admin.json('/api/templates/' + r.template.id, { method: 'DELETE' });
    assert.equal(del.ok, true);
    const gone = await w.admin.raw('/api/templates/' + r.template.id);
    assert.equal(gone.status, 404);
  });

  test('org branding and profile values round-trip; writes are manager-only', async () => {
    const png = 'data:image/png;base64,' + Buffer.from('not-a-real-png').toString('base64');
    await w.admin.json('/api/org/branding', { method: 'PUT', body: {
      logoUrl: png, companyName: 'Highland Corporate Ltd', registrationNumber: 'C.123456',
      address: 'Riverside Drive, Nairobi', defaultFooterText: 'Registered in Kenya' } });
    const b = await viewer.json('/api/org/branding');
    assert.equal(b.branding.companyName, 'Highland Corporate Ltd');
    assert.equal(b.branding.logoUrl, png);

    const badLogo = await w.admin.raw('/api/org/branding', { method: 'PUT', body: { logoUrl: 'data:text/html;base64,PGI+', companyName: 'X' } });
    assert.equal(badLogo.status, 400, 'a non-image logo is refused');

    await w.admin.json('/api/org/profile-values', { method: 'PUT', body: { values: {
      company_name: 'Highland Corporate Ltd', registration_number: 'C.123456' } } });
    const pv = await viewer.json('/api/org/profile-values');
    assert.equal(pv.values.company_name, 'Highland Corporate Ltd');

    const vb = await viewer.raw('/api/org/branding', { method: 'PUT', body: { companyName: 'Nope' } });
    assert.equal(vb.status, 403);
    const vv = await viewer.raw('/api/org/profile-values', { method: 'PUT', body: { values: {} } });
    assert.equal(vv.status, 403);
  });
});
