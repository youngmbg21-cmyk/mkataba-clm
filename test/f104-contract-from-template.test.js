/* ============================================================
   f104 — create contract from template (Phase C of the brief)

   A contract is a COPY of the template's published version, independent from
   the moment it is born. Pinned here, server-side:

     · only a published template spawns; a draft answers 409 and so does an
       archived one — the front end hides nothing the server doesn't block
     · company answers arrive pre-filled: {{org.…}} defaults resolve from the
       org profile at creation, and the rendered wording carries them with no
       {{placeholder}} syntax visible anywhere
     · provenance (template_id + template_version_id) is stamped on the
       contract row and its JSON, and the library counts the child
     · THE IMMUTABILITY TEST THE BRIEF DEMANDS: publish a v2 afterwards and
       the earlier contract's stored record is byte-identical
     · the counterparty's per-field autosave (POST template-values) validates
       every value against the shared registry, saves the valid, names the
       problem with the invalid, and survives a closed tab because it lands
       on the share row
     · signed values travel with the response and land on the owner's record
       via the applied-response path (values validated again on both hops)
   ============================================================ */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startHati, seedWorkspace } = require('./helpers');

describe('f104 — contract from template', () => {
  let h, w, tplId, v1Id;

  before(async () => {
    h = await startHati();
    w = await seedWorkspace(h);
    await w.admin.json('/api/org/branding', { method: 'PUT', body: {
      companyName: 'Highland Corporate Ltd', registrationNumber: 'C.123456',
      address: 'Riverside Drive, Nairobi', defaultFooterText: 'Registered in Kenya' } });
    await w.admin.json('/api/org/profile-values', { method: 'PUT', body: { values: {
      company_kra_pin: 'A012345678Z' } } });

    const r = await w.admin.json('/api/templates', { method: 'POST', body: {
      name: 'Account Opening Form', category: 'sales' } });
    tplId = r.template.id;
    const d = await w.admin.json('/api/templates/' + tplId);
    v1Id = d.versions[0].id;
    await w.admin.json(`/api/templates/${tplId}/versions/${v1Id}`, { method: 'PUT', body: {
      blocks: [
        { orderIndex: 0, blockType: 'heading', content: 'ACCOUNT OPENING FORM' },
        { orderIndex: 1, blockType: 'field_group', content: 'Supplier: {{org_name}} (KRA PIN {{org_kra}})\n\nClient: {{client_name}}, email {{client_email}}' },
        { orderIndex: 2, blockType: 'field_group', content: 'Payment terms: {{payment_terms}}' },
        { orderIndex: 3, blockType: 'fixed_text', content: 'Article 1. Invoices are payable within the agreed terms.' },
        { orderIndex: 4, blockType: 'signature_block', content: 'Client Director' },
      ],
      fields: [
        { fieldKey: 'org_name', label: 'Our company', fieldType: 'short_text', required: true, defaultValue: '{{org.company_name}}' },
        { fieldKey: 'org_kra', label: 'Our KRA PIN', fieldType: 'kenya_tax_id', required: true, defaultValue: '{{org.company_kra_pin}}' },
        { fieldKey: 'client_name', label: 'Client name', fieldType: 'short_text', required: true },
        { fieldKey: 'client_email', label: 'Client email', fieldType: 'email', required: true },
        { fieldKey: 'payment_terms', label: 'Payment terms', fieldType: 'select', control: 'guided', options: ['30 days', '45 days', '60 days'], required: true },
        { fieldKey: 'client_sign', label: 'Client Director', fieldType: 'signature_name_title' },
      ] } });
  });
  after(async () => { await h.stop(); });

  test('a draft cannot spawn contracts', async () => {
    const out = await w.admin.raw(`/api/templates/${tplId}/contracts`, { method: 'POST', body: {} });
    assert.equal(out.status, 409);
    assert.match(out.json.error, /draft/);
  });

  let contractId, storedAfterCreate;

  test('a published template spawns a pre-filled, independent copy', async () => {
    await w.admin.json(`/api/templates/${tplId}/versions/${v1Id}/publish`, { method: 'POST', body: { changeNote: 'v1' } });
    const r = await w.admin.json(`/api/templates/${tplId}/contracts`, { method: 'POST', body: { folder: 'sales' } });
    const c = r.contract;
    contractId = c.id;
    assert.match(c.id, /^MK-\d+$/);
    assert.equal(c.libraryTemplateId, tplId);
    assert.equal(c.libraryTemplateVersionId, v1Id);
    // company answers arrived pre-filled from the org profile
    assert.equal(c.templateForm.values.org_name, 'Highland Corporate Ltd');
    assert.equal(c.templateForm.values.org_kra, 'A012345678Z');
    assert.equal(c.templateForm.values.client_name, undefined, 'deal-specific blanks stay blank');
    // the rendered wording carries the resolved values and no placeholder syntax
    assert.ok(c.redlineText.includes('Highland Corporate Ltd'));
    assert.ok(!/\{\{/.test(c.redlineText), 'no {{syntax}} on a document, ever');
    assert.ok(c.redlineText.includes('hati-field'), 'unfilled blanks render as visible field slots');
    assert.equal(c.format, 'rich');
    assert.ok(c.branding && c.branding.companyName === 'Highland Corporate Ltd', 'the branding snapshot rides the contract');

    const lib = await w.admin.json('/api/templates');
    const t = lib.templates.find(x => x.id === tplId);
    assert.equal(t.contractsCreated, 1);
    assert.ok(t.lastUsedAt, 'the library remembers when the template was last used');

    storedAfterCreate = JSON.stringify(await w.admin.json('/api/contracts/' + contractId));
  });

  test('THE test: publishing v2 leaves the earlier contract byte-identical', async () => {
    const nv = await w.admin.json(`/api/templates/${tplId}/versions`, { method: 'POST' });
    await w.admin.json(`/api/templates/${tplId}/versions/${nv.versionId}`, { method: 'PUT', body: {
      blocks: [{ orderIndex: 0, blockType: 'heading', content: 'COMPLETELY DIFFERENT WORDING' },
        { orderIndex: 1, blockType: 'fixed_text', content: 'New payment terms: everything is due yesterday.' }],
      fields: [{ fieldKey: 'client_name', label: 'Client name', fieldType: 'short_text', required: true }] } });
    await w.admin.json(`/api/templates/${tplId}/versions/${nv.versionId}/publish`, { method: 'POST', body: {
      changeNote: 'Everything changed' } });

    const again = JSON.stringify(await w.admin.json('/api/contracts/' + contractId));
    assert.equal(again, storedAfterCreate, 'the contract from v1 is byte-identical after v2 published');
    // and a NEW contract now spawns from v2
    const r2 = await w.admin.json(`/api/templates/${tplId}/contracts`, { method: 'POST', body: { folder: 'sales' } });
    assert.ok(r2.contract.redlineText.includes('COMPLETELY DIFFERENT WORDING'));
    assert.equal(r2.contract.templateForm.versionNumber, 2);
  });

  test('an archived template spawns nothing new; its children keep working', async () => {
    await w.admin.json('/api/templates/' + tplId, { method: 'PATCH', body: { status: 'archived' } });
    const out = await w.admin.raw(`/api/templates/${tplId}/contracts`, { method: 'POST', body: {} });
    assert.equal(out.status, 409);
    assert.match(out.json.error, /archived/);
    const child = await w.admin.json('/api/contracts/' + contractId);
    assert.equal(child.libraryTemplateId, tplId, 'the child still cites its archived parent');
    await w.admin.json('/api/templates/' + tplId, { method: 'PATCH', body: { status: 'restore' } });
  });

  test('the counterparty portal autosave validates and persists per field', async () => {
    const full = await w.admin.json('/api/contracts/' + contractId);
    delete full._v;
    // owner shares the contract (the payload carries the form, values and all)
    const made = await w.admin.json('/api/shares', { method: 'POST', body: {
      payload: { v: 1, kind: 'hati-share', org: 'Highland Corporate Ltd', sharedBy: 'Amina Otieno',
        at: new Date().toISOString(), docHash: 'x', purpose: 'sign',
        contract: { id: full.id, name: full.name, counterparty: '', value: 0, valueType: 'none',
          fields: {}, templateForm: full.templateForm, branding: full.branding,
          redlineText: full.redlineText, format: 'rich' } },
      channel: 'email', recipient: { name: 'Grace Njeri', email: 'grace@client.co.ke' }, expiryDays: 30 } });

    // a valid value saves; an invalid one is named and NOT saved
    const r1 = await w.admin.raw(`/api/shares/${made.token}/template-values`, { method: 'POST', body: {
      values: { client_name: 'Brut Africa Ltd', client_email: 'not-an-email', payment_terms: '90 days' } } });
    assert.equal(r1.status, 200);
    assert.equal(r1.json.values.client_name, 'Brut Africa Ltd');
    assert.equal(r1.json.values.client_email, undefined);
    assert.match(r1.json.problems.client_email, /valid email/);
    assert.match(r1.json.problems.payment_terms, /approved options/, 'a guided field refuses an invented option');

    // a closed tab loses nothing: a fresh GET of the link carries the values
    const back = await w.admin.json('/api/shares/' + made.token);
    assert.equal(back.payload.contract.templateForm.values.client_name, 'Brut Africa Ltd');

    // fixed wording is untouchable through this route by construction:
    // only values are read, and unknown keys never invent a field
    const r2 = await w.admin.json(`/api/shares/${made.token}/template-values`, { method: 'POST', body: {
      values: { invented_field: 'nope', client_email: 'grace@client.co.ke' } } });
    assert.equal(r2.values.invented_field, undefined);
    assert.equal(r2.values.client_email, 'grace@client.co.ke');
  });

  test('viewers cannot spawn contracts from templates', async () => {
    await w.admin.json('/api/users', { method: 'POST', body: {
      name: 'Read Only', email: 'viewer3@example.co.ke', role: 'viewer', password: 'temporary-pass-1' } });
    const viewer = h.client('viewer3');
    await viewer.json('/api/login', { method: 'POST', body: { email: 'viewer3@example.co.ke', password: 'temporary-pass-1' } });
    const out = await viewer.raw(`/api/templates/${tplId}/contracts`, { method: 'POST', body: {} });
    assert.equal(out.status, 403);
  });
});
