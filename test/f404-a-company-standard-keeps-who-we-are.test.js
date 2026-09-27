/* f404 — A CONTRACT FROM A COMPANY STANDARD KEEPS WHO WE ARE AND WHICH SIDE
   (the owner's list, 27 Sep 2026)

   "Creating a contract from a company standard asks 'who we are' and 'which
   side of the money', then drops both answers. The contract falls back to the
   workspace's own company name."

   Two halves, both fixed: the browser's create call (tplLibCreate) sent six
   of the form's answers and not these two, and the route (POST
   /api/templates/:id/contracts) never read them. They land exactly where
   every other creation door puts them: c.party + metadata.party, and
   metadata.category ('customer' | 'supplier'; "Neither" writes nothing).

   Red at the parent (3ee647b): (1)(2)(4). (3) is the WALL that the standard's
   own pre-filled blanks do not move — the pane beside the questions draws
   them from the same resolution (f104) — and (5) the CONTROL that an empty
   answer writes nothing. */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { startHati, seedWorkspace } = require('./helpers');

describe('f404 — the company-standard door keeps both answers', () => {
  let h, w, tplId;
  before(async () => {
    h = await startHati();
    w = await seedWorkspace(h);
    await w.admin.json('/api/org/branding', { method: 'PUT', body: { companyName: 'Highland Corporate Ltd' } });
    const r = await w.admin.json('/api/templates', { method: 'POST', body: { name: 'Distribution Agreement', category: 'sales' } });
    tplId = r.template.id;
    const d = await w.admin.json('/api/templates/' + tplId);
    const vid = d.versions[0].id;
    await w.admin.json(`/api/templates/${tplId}/versions/${vid}`, { method: 'PUT', body: {
      blocks: [{ orderIndex: 0, blockType: 'heading', content: 'DISTRIBUTION AGREEMENT' },
        { orderIndex: 1, blockType: 'field_group', content: 'Supplier: {{org_name}}' },
        { orderIndex: 2, blockType: 'fixed_text', content: 'Article 1. The Distributor shall distribute.' }],
      fields: [{ fieldKey: 'org_name', label: 'Our company', fieldType: 'short_text', required: true, defaultValue: '{{org.company_name}}' }] } });
    await w.admin.json(`/api/templates/${tplId}/versions/${vid}/publish`, { method: 'POST', body: { changeNote: 'v1' } });
  });
  after(async () => { await h.stop(); });

  const create = body => w.admin.json(`/api/templates/${tplId}/contracts`, { method: 'POST', body: { folder: 'sales', ...body } });

  test('f404 (1) the route stores who we are on the contract, where contractParty reads it', async () => {
    const { contract: c } = await create({ party: 'Highland Logistics (K) Ltd', counterparty: 'Naivas Supermarkets Ltd' });
    assert.equal(c.party, 'Highland Logistics (K) Ltd');
    assert.equal(c.metadata.party, 'Highland Logistics (K) Ltd');
    assert.equal(c.metadata.confidence.party, 'high', 'a person typed it');
    const stored = await w.admin.json('/api/contracts/' + c.id);
    assert.equal(stored.party, 'Highland Logistics (K) Ltd', 'and it is on the stored record');
  });

  test('f404 (2) the route stores which side of the money we are on, in the field the upload path writes', async () => {
    const { contract: c } = await create({ side: 'supplier' });
    assert.equal(c.metadata.category, 'supplier');
    const { contract: d } = await create({ side: 'customer' });
    assert.equal(d.metadata.category, 'customer');
    const { contract: e } = await create({ side: 'reseller' });
    assert.ok(!('category' in e.metadata), 'an answer that is not one of the two writes nothing');
  });

  test('f404 (3) [wall] the standard’s own pre-filled blanks are unchanged, so the pane and the press still agree', async () => {
    const { contract: c } = await create({ party: 'Highland Logistics (K) Ltd' });
    assert.equal(c.templateForm.values.org_name, 'Highland Corporate Ltd',
      'the {{org.company_name}} default still resolves from the org profile, exactly as the pane draws it');
  });

  test('f404 (4) the browser’s create call sends both answers', async () => {
    const SRC = fs.readFileSync(path.join(__dirname, '..', 'js/views/templatelib.js'), 'utf8');
    const m = /async function tplLibCreate\(id, essentials\) \{[\s\S]*?\n\}/.exec(SRC);
    assert.ok(m, 'tplLibCreate');
    const sent = [];
    const ctx = { window: {}, state: { contracts: [] },
      api: async (p, method, body) => { sent.push({ p, method, body }); return { contract: { id: 'MK-1', templateForm: { templateName: 'x' } } }; },
      toast: () => {}, openWorkspace: () => {} };
    vm.createContext(ctx);
    vm.runInContext(m[0] + '\nthis.tplLibCreate = tplLibCreate;', ctx);
    await ctx.tplLibCreate('T1', { party: 'Highland Logistics (K) Ltd', side: 'supplier', counterparty: 'Naivas' });
    assert.equal(sent.length, 1);
    assert.equal(sent[0].body.party, 'Highland Logistics (K) Ltd');
    assert.equal(sent[0].body.side, 'supplier');
  });

  test('f404 (5) CONTROL: left empty, neither answer writes anything — the contract falls back as every other door does', async () => {
    const { contract: c } = await create({ party: '', side: '' });
    assert.ok(!('party' in c), 'no party key');
    assert.ok(!('party' in c.metadata) && !('category' in c.metadata));
  });
});
