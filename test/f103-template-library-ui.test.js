/* ============================================================
   f103 — the Template Library screens render real markup

   Render-sandbox checks (test/dom.js) for the three new screens: the library
   list, the template detail with its version history, and the builder. The
   API is faked with canned server shapes; the assertions run against the
   HTML the product actually generates — a reference error or a broken
   template literal in a render path fails here, not in a user's browser.

   Also pinned: what each role is offered. A viewer gets no "New template"
   button and no builder verbs — the server would refuse them anyway (f96),
   and the front end must not dangle verbs the server will deny.
   ============================================================ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { loadViews } = require('./dom');

const LIST = {
  templates: [
    { id: 'tpl_1', name: 'Account Opening Form', description: 'Client onboarding', category: 'sales',
      status: 'published', origin: 'upload', sourceContractId: null,
      publishedVersion: 2, publishedVersionId: 'tv_2', latestVersion: 2,
      contractsCreated: 7, lastUsedAt: '2026-07-01T08:00:00Z',
      createdBy: 'Amina', createdAt: '2026-06-01T08:00:00Z', updatedAt: '2026-07-01T08:00:00Z' },
    { id: 'tpl_2', name: 'NDA — mutual', description: '', category: 'nda',
      status: 'draft', origin: 'built_in_hati', sourceContractId: null,
      publishedVersion: null, publishedVersionId: null, latestVersion: 1,
      contractsCreated: 0, lastUsedAt: null, createdBy: 'Amina',
      createdAt: '2026-07-20T08:00:00Z', updatedAt: '2026-07-20T08:00:00Z' },
  ],
};
const DETAIL = {
  template: LIST.templates[0],
  versions: [
    { id: 'tv_1', versionNumber: 1, status: 'superseded', publishedAt: '2026-06-02T08:00:00Z', publishedBy: 'Amina', changeNote: 'First cut', errorNote: '', createdAt: '2026-06-01T08:00:00Z' },
    { id: 'tv_2', versionNumber: 2, status: 'published', publishedAt: '2026-07-01T08:00:00Z', publishedBy: 'Amina', changeNote: 'Payment terms now guided', errorNote: '', createdAt: '2026-06-20T08:00:00Z' },
    { id: 'tv_3', versionNumber: 3, status: 'draft', publishedAt: null, publishedBy: null, changeNote: '', errorNote: '', createdAt: '2026-07-25T08:00:00Z' },
  ],
};
const VERSION = {
  version: { id: 'tv_3', versionNumber: 3, status: 'draft', publishedAt: null, publishedBy: null, changeNote: '', errorNote: '' },
  blocks: [
    { id: 'tb_1', orderIndex: 0, blockType: 'heading', content: 'Company information' },
    { id: 'tb_2', orderIndex: 1, blockType: 'field_group', content: 'KRA PIN: {{kra_pin}}' },
    { id: 'tb_3', orderIndex: 2, blockType: 'fixed_text', content: 'Article 1. Invoices are payable in thirty days.' },
    { id: 'tb_4', orderIndex: 3, blockType: 'signature_block', content: 'Director' },
  ],
  fields: [
    { field_key: 'kra_pin', label: 'KRA PIN', section: 'Company information', order_index: 0,
      field_type: 'kenya_tax_id', control: 'free', options: [], required: true,
      default_value: null, help_text: null, detection_confidence: 'low', human_reviewed: false },
  ],
};

const FILES = ['js/fieldlib.js', 'js/views/templatelib.js', 'js/views/templatebuilder.js'];

function stage({ canManage = true, responses = {} } = {}) {
  const calls = [];
  const sandbox = loadViews(FILES, {
    state: { contracts: [], settings: {}, view: 'tpl-library' },
    api: async (path, method = 'GET', body) => {
      calls.push({ path, method, body });
      if (path === 'templates') return { ...LIST, canManage };
      if (path === 'templates/tpl_1') return { ...DETAIL, canManage };
      if (path === 'templates/tpl_1/versions/tv_3') return VERSION;
      if (path === 'org/branding') return { branding: { logoUrl: null, companyName: 'Highland', registrationNumber: 'C.1', address: '', defaultFooterText: '' } };
      if (responses[path]) return responses[path];
      throw new Error('unexpected api call: ' + method + ' ' + path);
    },
    openModal: html => { sandbox.document.getElementById('modal-root').innerHTML = html; },
    closeModal: () => { sandbox.document.getElementById('modal-root').innerHTML = ''; },
    confirmDialog: async () => true,
    navigator: { clipboard: { writeText() {} } },
  });
  return { sandbox, calls, content: () => sandbox.document.getElementById('content').innerHTML };
}

const settle = () => new Promise(r => setTimeout(r, 0));

describe('f103 — template library screens', () => {
  test('the company-templates section renders INTO the Templates page host', async () => {
    const { sandbox } = stage();
    // the Templates page provides this host; the section renders into it
    const host = sandbox.document.getElementById('tpl-company-section');
    await sandbox.renderCompanyTemplatesSection();
    await settle();
    const html = host.innerHTML;
    assert.ok(html.includes('Company standard templates'), 'the section names itself');
    assert.ok(html.includes('Account Opening Form'));
    assert.ok(html.includes('Published'), 'status badge');
    assert.ok(html.includes('v2'), 'current published version');
    assert.ok(html.includes('7 contracts'), 'contracts-created count');
    assert.ok(html.includes('NDA — mutual') && html.includes('Draft'), 'a manager sees the draft too');
    assert.ok(html.includes('New template') && html.includes('Convert a document'), 'manager verbs live on the section');
    assert.equal(sandbox.tplLibCount(), 1, 'one published template feeds the sidebar count');
    assert.equal(sandbox.tplLibPublished()[0].id, 'tpl_1', 'the menu reads the same cache');
  });

  test('a viewer gets no create verb (the server would 403 it anyway)', async () => {
    const { sandbox } = stage({ canManage: false });
    const host = sandbox.document.getElementById('tpl-company-section');
    await sandbox.renderCompanyTemplatesSection();
    await settle();
    assert.ok(!host.innerHTML.includes('New template'));
    assert.ok(host.innerHTML.includes('Account Opening Form'), 'and the positive case genuinely rendered');
  });

  test('the detail screen shows the version history with change notes', async () => {
    const { sandbox, content } = stage();
    await sandbox.openTemplateLibDetail('tpl_1');
    const html = content();
    assert.ok(html.includes('Payment terms now guided'), 'the change note is the version history’s point');
    assert.ok(html.includes('First cut'));
    assert.ok(html.includes('Superseded'), 'the old published version says what it is');
    assert.ok(html.includes('Open builder'), 'the draft offers the builder to a manager');
    assert.ok(html.includes('7 contracts'), 'usage on the detail too');
  });

  test('the builder renders blocks, fields, and the low-confidence flag', async () => {
    const { sandbox, content } = stage();
    await sandbox.openTemplateBuilder('tpl_1', 'tv_3');
    await settle(); // branding panel paints after its own fetch
    const html = content();
    assert.ok(html.includes('Company information'), 'heading block');
    assert.ok(html.includes('KRA PIN: {{kra_pin}}'), 'field-group wording with its placeholder');
    assert.ok(html.includes('Invoices are payable'), 'fixed wording block');
    assert.ok(html.includes('Director'), 'signature block party');
    assert.ok(html.includes('low confidence'), 'an unreviewed detected field is flagged');
    assert.ok(html.includes('Publish v3'), 'the publish verb names the version it freezes');
    assert.ok(html.includes('Save draft'));
    assert.ok(html.includes('Branding'), 'the branding panel is on the screen');
  });
});
