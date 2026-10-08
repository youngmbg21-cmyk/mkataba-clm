/* ============================================================
   f594 — THE DRAFTING WALK'S SMALLER FINDINGS (functional review, 9 Oct 2026)
   ============================================================
   C9  the room head read "updated Created from template": lastAction was
       words. The company-standard door writes a day now, and the head prints
       "updated" only before a date (a stored value is never rewritten).
   C10 a template with no questions drew an empty "Contract form" card.
   C12 "Which side are we on?" opened on "Neither — no one pays", a claim,
       even with a value typed: the empty answer reads "not recorded" now.
   C13 a contract from a company standard was named the template alone while
       HaTi's own templates name it "<Template> — <Counterparty>".
   ============================================================ */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const { buildWorld } = require('./world');
const { loadViews } = require('./dom');
const { startHati, seedWorkspace } = require('./helpers');
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');

describe('f594 (server) — the company-standard door: a day, and one name', () => {
  let h, w, tplId;
  before(async () => {
    h = await startHati(); w = await seedWorkspace(h);
    const r = await w.admin.json('/api/templates', { method: 'POST', body: { name: 'Supply Standard', category: 'sales' } });
    tplId = r.template.id;
    const d = await w.admin.json('/api/templates/' + tplId);
    const vid = d.versions[0].id;
    await w.admin.json(`/api/templates/${tplId}/versions/${vid}`, { method: 'PUT', body: {
      blocks: [{ orderIndex: 0, blockType: 'field_group', content: 'For {{goods}}.' }],
      fields: [{ fieldKey: 'goods', label: 'Goods', fieldType: 'short_text' }] } });
    await w.admin.json(`/api/templates/${tplId}/versions/${vid}/publish`, { method: 'POST', body: { changeNote: 'v1' } });
  });
  after(async () => { await h.stop(); });

  test('C13 named "<Template> — <Counterparty>", as HaTi’s own templates name it', async () => {
    const r = await w.admin.json(`/api/templates/${tplId}/contracts`, { method: 'POST', body: { folder: 'sales', counterparty: 'Juno Limited' } });
    assert.equal(r.contract.name, 'Supply Standard — Juno Limited');
    const bare = await w.admin.json(`/api/templates/${tplId}/contracts`, { method: 'POST', body: { folder: 'sales' } });
    assert.equal(bare.contract.name, 'Supply Standard', 'no counterparty, no dash');
    assert.match(read('js/wizard.js'), /name:t\.name\+\(cp\?' — '\+cp:''\)/, 'the same shape as the wizard');
  });
  test('C9 lastAction is a day, not words', async () => {
    const r = await w.admin.json(`/api/templates/${tplId}/contracts`, { method: 'POST', body: { folder: 'sales' } });
    assert.match(String(r.contract.lastAction), /\b20\d{2}\b/);
    assert.notEqual(r.contract.lastAction, 'Created from template');
  });
});

describe('f594 (browser) — what the page draws', () => {
  test('C9 the head prints "updated" only before a date', () => {
    const { win } = buildWorld({ contractView: true });
    const c = { id: 'MK-594', name: 'X', counterparty: 'Juno', status: 'Draft', fields: {}, metadata: {}, audit: [] };
    c.lastAction = 'Created from template';
    assert.doesNotMatch(win.roomHeadSubHtml(c), /Created from template/);
    c.lastAction = '09 Oct 2026';
    assert.match(win.roomHeadSubHtml(c), /09 Oct 2026/);
  });
  test('C10 a template with no questions draws no form card', () => {
    const dom = new JSDOM('<div id="tplform-section">stale</div>');
    const sb = loadViews(['js/fieldlib.js', 'js/templateform.js', 'js/views/templatelib.js', 'js/views/templatebuilder.js'], {
      document: dom.window.document, persist(){}, renderDocHtml: x => x, canEdit: () => true,
      api: async () => ({}), openModal(){}, closeModal(){}, confirmDialog: async () => true, toast(){}, navigator: {} });
    sb.renderTemplateFormSection({ id: 'MK-594', status: 'Draft', redlineText: '<p>x</p>',
      templateForm: { blocks: [], fields: [{ fieldKey: 's', label: 'Signer', fieldType: 'signature_name_title' }], values: {} } });
    assert.equal(dom.window.document.getElementById('tplform-section').innerHTML, '', 'nothing drawn');
  });
  test('C12 no side is preselected: the empty answer says "not recorded", never "Neither"', () => {
    for (const f of ['js/templatefields.js', 'js/templates.js'])
      assert.match(read(f), /\{ v:'', l:i18t\('tf_side_unset'\) \}/, f);
    const I = read('js/i18n.js');
    assert.equal((I.match(/\n\s+tf_side_unset:/g) || []).length, 2, 'in both books');
  });
});
