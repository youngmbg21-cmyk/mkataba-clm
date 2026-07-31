/* ============================================================
   f106 — no raw {{code}} ever reaches a contract, and blanks behave

   The work-order pass over the Template Library (WORKORDER-template-library-
   fixes.md). A user deleted detected fields on the upload-review screen and
   the finished contract printed literal {{buyer_signature}} — this file pins
   every layer of the fix, and the blank restyle that came with it:

     · the renderer NEVER emits raw marker syntax: an orphaned {{marker}}
       renders as a plain visible blank
     · deleting a field strips its marker from the wording (the shared
       templateFormStripMarker helper both screens call)
     · publish BLOCKS server-side when wording still mentions a field that
       does not exist, naming the marker; an unplaced typed field is a
       warning, not corruption
     · the blank a filled document shows carries data-field-key so a click
       can route to the right input — and the sanitiser admits that
       attribute only on the hati-field span, only in field-key shape
     · blanks are grey, not green: the stylesheet styles .hati-field from the
       neutral palette, with the pointer only where a click can land
     · repair on open: a contract stored with {{code}} in its wording is
       re-rendered clean from the form copy it carries (executed records are
       never touched)
   ============================================================ */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { startHati, seedWorkspace } = require('./helpers');
const { templateFormDocHtml, templateFormStripMarker } = require('../js/templateform.js');

describe('f106 — renderer and helper hygiene (no server)', () => {
  const form = {
    blocks: [
      { orderIndex: 0, blockType: 'field_group', content: 'Client: {{client_name}} · Signed: {{ghost_field}}' },
    ],
    fields: [{ fieldKey: 'client_name', label: 'Client name', fieldType: 'short_text', required: true }],
    values: {},
  };

  test('an orphaned marker renders as a plain blank, never raw syntax', () => {
    const html = templateFormDocHtml(form);
    assert.ok(!html.includes('{{'), 'no {{ anywhere in a rendered document');
    assert.ok(!html.includes('ghost_field'), 'the dead field name does not leak either');
    assert.ok(html.includes('hati-field'), 'the orphan still shows as a visible blank');
  });

  test('a live blank carries its field key for click-to-fill; a filled value carries nothing', () => {
    const empty = templateFormDocHtml(form);
    assert.ok(empty.includes('data-field-key="client_name"'), 'the blank knows which field it is');
    const filled = templateFormDocHtml({ ...form, values: { client_name: 'Wanjiru Catering Ltd' } });
    assert.ok(filled.includes('Wanjiru Catering Ltd'));
    assert.ok(!filled.includes('data-field-key="client_name"'), 'filled values are plain document text');
  });

  test('templateFormStripMarker removes every occurrence and leaves a visible blank', () => {
    const out = templateFormStripMarker('a {{k}} b {{k}} c {{other}}', 'k');
    assert.ok(!out.includes('{{k}}'));
    assert.ok(out.includes('{{other}}'), 'only the named marker is stripped');
    assert.ok(out.includes('———'), 'the wording keeps a visible blank where the field sat');
  });

  test('the stylesheet paints blanks grey, not green, with the pointer only on clickable ones', () => {
    const css = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
    const rule = /\.hati-doc \.hati-field\{[^}]*\}/.exec(css);
    assert.ok(rule, 'the blank rule exists');
    assert.ok(rule[0].includes('neutral'), 'blanks draw from the neutral (grey) palette');
    assert.ok(!rule[0].includes('accent'), 'and not from the accent (green) palette');
    assert.ok(css.includes('.hati-doc .hati-field[data-field-key]{cursor:pointer'), 'only a routable blank invites a click');
  });
});

describe('f106 — sanitiser admits data-field-key narrowly', () => {
  const world = require('./world').buildWorld();

  test('kept on a hati-field span in key shape; stripped everywhere else', () => {
    const clean = world.win.sanitizeRich(
      '<p><span class="hati-field" data-field-key="client_name">Client name</span>'
      + '<span data-field-key="loose">no class</span>'
      + '<span class="hati-field" data-field-key="NOT VALID!">bad shape</span></p>');
    assert.ok(clean.includes('data-field-key="client_name"'), 'the legitimate blank keeps its key');
    assert.ok(!clean.includes('loose'.replace('loose', 'data-field-key="loose"')), 'no class → no key');
    assert.ok(!clean.includes('NOT VALID'), 'an invalid shape is dropped');
    const count = (clean.match(/data-field-key/g) || []).length;
    assert.equal(count, 1, 'exactly the one valid attribute survives');
  });
});

describe('f106 — server holds the line', () => {
  let h, w, tplId, vId;
  before(async () => {
    h = await startHati();
    w = await seedWorkspace(h);
    const r = await w.admin.json('/api/templates', { method: 'POST', body: { name: 'Hygiene', category: 'other' } });
    tplId = r.template.id;
    vId = (await w.admin.json('/api/templates/' + tplId)).versions[0].id;
  });
  after(async () => { await h.stop(); });

  test('publish blocks on an orphaned marker, and names it', async () => {
    await w.admin.json(`/api/templates/${tplId}/versions/${vId}`, { method: 'PUT', body: {
      blocks: [
        { orderIndex: 0, blockType: 'field_group', content: 'Client: {{client_name}} · Signed by {{buyer_signature}}' },
        { orderIndex: 1, blockType: 'signature_block', content: 'Buyer' },
      ],
      fields: [{ fieldKey: 'client_name', label: 'Client name', fieldType: 'short_text', required: true }] } });
    const pub = await w.admin.raw(`/api/templates/${tplId}/versions/${vId}/publish`, { method: 'POST', body: {} });
    assert.equal(pub.status, 400);
    assert.ok(pub.json.problems.some(p => p.includes('buyer_signature')), 'the message names the orphan');
  });

  test('with the marker cleaned, publish succeeds and warns (not blocks) on an unplaced field', async () => {
    await w.admin.json(`/api/templates/${tplId}/versions/${vId}`, { method: 'PUT', body: {
      blocks: [
        { orderIndex: 0, blockType: 'field_group', content: 'Client: {{client_name}} · Signed by ———' },
        { orderIndex: 1, blockType: 'signature_block', content: 'Buyer' },
      ],
      fields: [
        { fieldKey: 'client_name', label: 'Client name', fieldType: 'short_text', required: true },
        { fieldKey: 'side_note', label: 'Side note', fieldType: 'short_text' },
      ] } });
    const pub = await w.admin.json(`/api/templates/${tplId}/versions/${vId}/publish`, { method: 'POST', body: { changeNote: 'clean' } });
    assert.equal(pub.ok, true);
    assert.ok(pub.warnings.some(x => x.includes('Side note')), 'the unplaced field is said, not silently accepted');
  });

  test('a contract spawned from the cleaned version carries no raw syntax', async () => {
    const made = await w.admin.json(`/api/templates/${tplId}/contracts`, { method: 'POST', body: { folder: 'proc' } });
    assert.ok(!/\{\{/.test(made.contract.redlineText));
    assert.ok(made.contract.redlineText.includes('data-field-key="client_name"'), 'the blank is routable');
  });
});

describe('f106 — repair on open (render sandbox)', () => {
  const { loadViews } = require('./dom');
  test('a stored contract carrying {{code}} is re-rendered clean from its form copy', () => {
    const saves = [];
    const sandbox = loadViews(['js/fieldlib.js', 'js/templateform.js', 'js/views/templatelib.js', 'js/views/templatebuilder.js'], {
      persist: c => saves.push(c.id),
      renderDocHtml: html => html,
      canEdit: () => true,
      api: async () => ({}),
      openModal() {}, closeModal() {}, confirmDialog: async () => true, toast() {},
      navigator: {},
    });
    const c = {
      id: 'MK-X', status: 'Draft',
      redlineText: 'Broken {{ghost}} wording',
      templateForm: {
        blocks: [{ orderIndex: 0, blockType: 'field_group', content: 'Client: {{client_name}}' }],
        fields: [{ fieldKey: 'client_name', label: 'Client name', fieldType: 'short_text' }],
        values: {},
      },
    };
    sandbox.renderTemplateFormSection(c);
    assert.ok(!c.redlineText.includes('{{'), 'the wording was regenerated clean');
    assert.ok(c.redlineText.includes('data-field-key="client_name"'));
    assert.deepEqual(saves, ['MK-X'], 'the repair persists');
  });

  test('tplFormCommit routes every door through one path: value lands, wording regenerates', () => {
    const sandbox = loadViews(['js/fieldlib.js', 'js/templateform.js', 'js/views/templatelib.js', 'js/views/templatebuilder.js'], {
      persist() {}, renderDocHtml: h => h, canEdit: () => true,
      api: async () => ({}), openModal() {}, closeModal() {}, confirmDialog: async () => true, toast() {},
      navigator: {}, todayStr: () => 'today',
    });
    const c = { id: 'MK-Y', status: 'Draft', redlineText: '', templateForm: {
      blocks: [{ orderIndex: 0, blockType: 'field_group', content: 'Client: {{client_name}}' }],
      fields: [{ fieldKey: 'client_name', label: 'Client name', fieldType: 'short_text' }],
      values: {},
    } };
    sandbox.tplFormCommit(c, 0, 'Wanjiru Catering Ltd');
    assert.equal(c.templateForm.values.client_name, 'Wanjiru Catering Ltd');
    assert.ok(c.redlineText.includes('Wanjiru Catering Ltd'));
    assert.ok(!c.redlineText.includes('data-field-key'), 'a filled blank stops being a blank');
  });
});
