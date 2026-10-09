/* ============================================================
   f591 — "OUR COMPANY" IS NEVER BLANK, AND AN OPEN BLANK IS SAID BEFORE IT
   TRAVELS (functional review, 9 Oct 2026, the drafting walk)
   ============================================================
   A company standard's "Our company" field defaults to {{org.company_name}}.
   With branding never filled in it resolved to nothing, and the contract went
   to the other side reading "between Our company (the Client)" — while the
   Send screen's readiness said only that email was not set up, because it
   never looked at a company standard's own form, and the Overview's open
   fields counted required fields only.

   Now: the workspace's own name stands in (tplOrgValues), and every field
   still open — empty, or still reading as its label — is named: required ones
   hold like an empty box (tick to send anyway), optional ones are worth
   checking and never hold.
   ============================================================ */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startHati, seedWorkspace } = require('./helpers');
const { buildWorld } = require('./world');
const { buildPortal } = require('./portalworld');

describe('f591 (1) — {{org.company_name}} falls back to the workspace name', () => {
  let h, w;
  before(async () => { h = await startHati(); w = await seedWorkspace(h); });
  after(async () => { await h.stop(); });

  test('no branding: the contract is born with the workspace name, not a blank', async () => {
    const r = await w.admin.json('/api/templates', { method: 'POST', body: { name: 'Supply Form', category: 'sales' } });
    const tplId = r.template.id;
    const d = await w.admin.json('/api/templates/' + tplId);
    const vid = d.versions[0].id;
    await w.admin.json(`/api/templates/${tplId}/versions/${vid}`, { method: 'PUT', body: {
      blocks: [
        { orderIndex: 0, blockType: 'heading', content: 'SUPPLY FORM' },
        { orderIndex: 1, blockType: 'field_group', content: 'Between {{org_name}} (the Client) and {{client_name}}.' },
      ],
      fields: [
        { fieldKey: 'org_name', label: 'Our company', fieldType: 'short_text', required: false, defaultValue: '{{org.company_name}}' },
        { fieldKey: 'client_name', label: 'Client name', fieldType: 'short_text', required: true },
      ] } });
    await w.admin.json(`/api/templates/${tplId}/versions/${vid}/publish`, { method: 'POST', body: { changeNote: 'v1' } });
    const out = await w.admin.json(`/api/templates/${tplId}/contracts`, { method: 'POST', body: { folder: 'sales' } });
    const c = out.contract;
    assert.equal(c.templateForm.values.org_name, 'Highland Corporate Ltd');
    assert.match(c.redlineText, /Between (<[^>]+>)*Highland Corporate Ltd/, 'the paper names us');
    assert.doesNotMatch(c.redlineText, /Between <span[^>]*>Our company/);
  });
});

describe('f591 (2) — the Send screen and the Overview name every open field', () => {
  const formContract = values => ({
    id: 'MK-591', name: 'Supply Form', counterparty: 'Juno Limited', status: 'Draft', folder: 'corp',
    fields: {}, metadata: {}, audit: [], value: 0, valueType: 'none', format: 'rich',
    expiry: '2027-01-01', effectiveDate: '2026-10-01', redlineText: '<p>x</p>',
    templateForm: { fields: [
      { fieldKey: 'org_name', label: 'Our company', fieldType: 'short_text', required: false },
      { fieldKey: 'client_name', label: 'Client name', fieldType: 'short_text', required: true },
      { fieldKey: 'notes', label: 'Notes', fieldType: 'short_text', required: false },
      { fieldKey: 'sig', label: 'Client Director', fieldType: 'signature_name_title' },
    ], values } });

  test('required open holds; optional open (empty or its own label) is worth checking', () => {
    const { win } = buildPortal({ url: 'http://localhost/hati/' });
    const rows = win.contractReadiness(formContract({ org_name: 'Our company', notes: '' }));
    const req = rows.find(r => r.key === 'form-blanks');
    const opt = rows.find(r => r.key === 'form-optional');
    assert.ok(req && req.severity === 'block', 'a required field left open holds like an empty box');
    assert.match(req.label, /Client name/);
    assert.ok(opt && opt.severity === 'warn', 'an optional one is worth checking, never a hold');
    assert.match(opt.label, /Our company/, 'a field still reading as its own label is open');
    assert.match(opt.label, /Notes/);
    assert.doesNotMatch(opt.label + req.label, /Client Director/, 'the signing flow captures signatures');
  });

  test('a filled form says nothing', () => {
    const { win } = buildPortal({ url: 'http://localhost/hati/' });
    const rows = win.contractReadiness(formContract({ org_name: 'Highland Corporate Ltd', client_name: 'Juno', notes: 'n' }));
    assert.ok(!rows.some(r => r.key === 'form-blanks' || r.key === 'form-optional'));
  });

  test('the Overview’s open fields name optional ones too; the required count is unchanged', () => {
    const { win } = buildWorld({ contractView: true, blanks: true });
    const c = formContract({ client_name: 'Juno' });
    assert.deepEqual(win.contractOpenFieldNames(c).sort(), ['Notes', 'Our company']);
    assert.equal(win.tplFormOpenCount(c), 0, 'the required-only count every other reader uses');
  });
});
