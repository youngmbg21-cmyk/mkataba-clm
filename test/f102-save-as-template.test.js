/* ============================================================
   f102 — save-as-template: a deal that went well becomes the standard

   The one-click path from Phase B of the Template Library brief. On any
   existing contract, "Save as template" copies the wording into a NEW draft
   template: party-specific values the record itself knows (counterparty,
   email, value, dates) become empty typed fields with {{placeholders}} in
   the wording, everything else stays fixed text, and the draft opens in the
   builder — never anywhere near published without a person looking at it.

   Pinned here:
     · the counterparty's name becomes an empty required short_text field and
       its placeholder replaces every literal occurrence in the wording
     · legal articles arrive as fixed_text/heading blocks, never as fields
     · origin and source_contract_id record where the standard came from
     · the source contract itself is byte-for-byte untouched
     · a rich-format body converts through its block structure
     · folder scope holds: a manager who cannot see the contract cannot
       template it (404), and a viewer cannot reach the route at all (403)
   ============================================================ */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startHati, seedWorkspace, FIXTURE_BODY_A1 } = require('./helpers');

/* The body MK-A1 ships with. Imported rather than restated so the fixture
   and the assertions cannot drift apart. */
const TEXT_BODY = FIXTURE_BODY_A1;

describe('f102 — save-as-template', () => {
  let h, w, viewer;

  before(async () => {
    h = await startHati();
    w = await seedWorkspace(h);
    await w.admin.json('/api/users', { method: 'POST', body: {
      name: 'Read Only', email: 'viewer2@example.co.ke', role: 'viewer', password: 'temporary-pass-1' } });
    viewer = h.client('viewer2');
    await viewer.json('/api/login', { method: 'POST', body: { email: 'viewer2@example.co.ke', password: 'temporary-pass-1' } });

    /* MK-A1 ships WITH its document body now (helpers.js, FIXTURE_BODY_A1).
       It used to be written on here by a PUT, which stopped being legal when
       the executed guard learned that a contract marked Signed is executed:
       MK-A1 is a Signed fixture, and its sealed wording is exactly what that
       guard exists to refuse. Saving an executed contract AS a template is
       still perfectly good — it reads the record, it does not rewrite it —
       so the test's subject is unchanged; only the way it got its body is. */
  });
  after(async () => { await h.stop(); });

  test('party values become empty typed fields; articles stay fixed wording', async () => {
    const r = await w.admin.json('/api/contracts/MK-A1/save-as-template', { method: 'POST', body: {} });
    assert.ok(r.templateId && r.versionId);

    const t = await w.admin.json('/api/templates/' + r.templateId);
    assert.equal(t.template.status, 'draft', 'the copy is a draft, never auto-published');
    assert.equal(t.template.origin, 'saved_from_contract');
    assert.equal(t.template.sourceContractId, 'MK-A1');

    const v = await w.admin.json(`/api/templates/${r.templateId}/versions/${r.versionId}`);
    const name = v.fields.find(f => f.field_key === 'counterparty_name');
    assert.ok(name, 'the counterparty became a field');
    assert.equal(name.field_type, 'short_text');
    assert.equal(name.required, true);
    assert.equal(name.default_value, null, 'the field is EMPTY — the next deal fills it');

    const email = v.fields.find(f => f.field_key === 'counterparty_email');
    assert.equal(email.field_type, 'email');
    const value = v.fields.find(f => f.field_key === 'contract_value');
    assert.equal(value.field_type, 'currency');
    const expiry = v.fields.find(f => f.field_key === 'expiry_date');
    assert.equal(expiry.field_type, 'date');

    const all = v.blocks.map(b => b.content).join('\n');
    assert.ok(!all.includes('Kabras Sugar'), 'the literal party name is gone from the wording');
    assert.ok(all.includes('{{counterparty_name}}'), 'its placeholder took the seat');
    assert.ok(!all.includes('48,000,000'), 'the literal amount is gone');

    const headings = v.blocks.filter(b => b.blockType === 'heading').map(b => b.content);
    assert.ok(headings.includes('Article 1 Payment'), 'articles arrive as headings');
    assert.ok(headings.includes('Article 2 Term'));
    assert.ok(v.blocks.some(b => b.blockType === 'fixed_text' && /confidential/.test(b.content)),
      'boilerplate stays fixed wording, not a field');
    assert.ok(v.blocks.some(b => b.blockType === 'field_group' && /thirty days/.test(b.content) && b.content.includes('{{contract_value}}')),
      'a paragraph that held a party value became wording-with-blanks');
    assert.equal(v.blocks.filter(b => b.blockType === 'signature_block').length, 2,
      'signature scaffolding for both parties');

    // and the draft publishes through the normal Phase B path
    const pub = await w.admin.json(`/api/templates/${r.templateId}/versions/${r.versionId}/publish`, {
      method: 'POST', body: { changeNote: 'Adopted from MK-A1' } });
    assert.equal(pub.ok, true);
  });

  test('the source contract is untouched by the copy', async () => {
    const c = await w.admin.json('/api/contracts/MK-A1');
    assert.equal(c.redlineText, TEXT_BODY);
    assert.equal(c.counterparty, 'Kabras Sugar');
    assert.equal(c.libraryTemplateId, undefined, 'saving AS a template does not stamp provenance — only creating FROM one does');
  });

  test('a rich-format body converts through its block structure', async () => {
    const c = await w.admin.json('/api/contracts/MK-A2');
    const v0 = c._v; delete c._v;
    c.format = 'rich';
    c.redlineText = '<h1>MILK COLLECTION AGREEMENT</h1><p>Between Highland Corporate Ltd and Nandi Dairy.</p><h2>Article 1</h2><p>Collection happens daily.</p>';
    await w.admin.json('/api/contracts/MK-A2', { method: 'PUT', body: { contract: c, baseVersion: v0 } });

    const r = await w.admin.json('/api/contracts/MK-A2/save-as-template', { method: 'POST', body: { name: 'Milk standard' } });
    const v = await w.admin.json(`/api/templates/${r.templateId}/versions/${r.versionId}`);
    assert.equal(v.blocks[0].blockType, 'heading');
    assert.equal(v.blocks[0].content, 'MILK COLLECTION AGREEMENT');
    assert.ok(v.blocks.some(b => b.content.includes('{{counterparty_name}}')));
    assert.ok(v.blocks.some(b => b.blockType === 'heading' && b.content === 'Article 1'));
  });

  test('folder scope holds, and viewers cannot template anything', async () => {
    // restricted (folder A only) cannot template a folder-B contract — 404, not 403
    const out = await w.restricted.raw('/api/contracts/MK-B1/save-as-template', { method: 'POST', body: {} });
    assert.equal(out.status, 404);
    const vr = await viewer.raw('/api/contracts/MK-A1/save-as-template', { method: 'POST', body: {} });
    assert.equal(vr.status, 403);
  });
});
