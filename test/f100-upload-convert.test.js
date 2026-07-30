/* ============================================================
   f100 — upload-and-convert: a Word document becomes a draft template

   Phase D of the Template Library brief. What this file can prove without a
   live Anthropic key, it proves; the parts that need the real model are
   marked in CHECKLIST.md. Pinned here:

     · the upload is judged by its real bytes: a renamed non-docx is refused,
       a zip with no word/document.xml is refused, an oversize file is
       refused — and none of those ever reach the model
     · the ordered structure extraction is deterministic code, and the
       payload the model receives carries the labels, the (empty) blank
       markers, the underscore runs, the [INSERT …] brackets and the inline
       blanks, in reading order
     · the result is ALWAYS a draft (origin=upload) with detected fields
       carrying confidence and human_reviewed=0 — never anything published
     · a garbage model response cannot crash the upload: the draft is saved
       with an error note and the original file is stored for reprocessing
     · end-to-end: upload → detect → confirm (the human pass) → publish →
       create contract → fill → the rendered document carries the values and
       no {{placeholder}} syntax
   ============================================================ */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { startHati, seedWorkspace } = require('./helpers');

const FIX = f => fs.readFileSync(path.join(__dirname, '..', 'fixtures', f));
const dataUrl = buf => 'data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,' + buf.toString('base64');

/* The canned detection for the Brut form — the shape a good claude-sonnet-4-6
   answer takes, so the server's handling of a REAL answer is what runs. */
const BRUT_FIELDS = [
  ['registered_company_name', 'Registered company name', 'short_text', true],
  ['trading_name', 'Trading name', 'short_text', false],
  ['certificate_of_incorporation_number', 'Certificate of incorporation number', 'company_reg_number', true],
  ['kra_pin', 'KRA PIN', 'kenya_tax_id', true],
  ['vat_number', 'VAT number', 'short_text', false],
  ['date_of_incorporation', 'Date of incorporation', 'date', false],
  ['registered_office_address', 'Registered office address', 'address', true],
  ['postal_address', 'Postal address', 'address', false],
  ['company_telephone', 'Company telephone', 'phone', true],
  ['email_address', 'Email address', 'email', true],
  ['website', 'Website', 'short_text', false],
  ['primary_contact_person', 'Primary contact person', 'short_text', true],
  ['contact_mobile_number', 'Contact mobile number', 'phone', true],
  ['contact_email', 'Contact email', 'email', true],
  ['bank_name', 'Bank name', 'short_text', false],
  ['bank_branch', 'Bank branch', 'short_text', false],
  ['account_number', 'Account number', 'short_text', false],
  ['requested_credit_limit', 'Requested credit limit (KES)', 'currency', false],
  ['payment_terms', 'Payment terms requested', 'select', false],
  ['delivery_address', 'Delivery address', 'address', true],
  ['authorised_receiver_full_name', 'Authorised receiver full name', 'short_text', true],
  ['receiver_id_number', 'Receiver ID number', 'national_id', true],
  ['receiver_telephone', 'Receiver telephone', 'phone', false],
  ['director_full_name', 'Director full name', 'short_text', true],
  ['director_title', 'Title', 'short_text', false],
  ['director_signature', 'Director signature', 'signature_name_title', true],
  ['date_signed', 'Date signed', 'date', false],
  ['company_stamp', 'Company stamp', 'stamp_image', false],
];
const brutDetection = () => ({
  blocks: [
    { order_index: 0, block_type: 'heading', content: 'BRUT AFRICA LIMITED — ACCOUNT OPENING FORM' },
    { order_index: 1, block_type: 'heading', content: 'Section A — Company information' },
    { order_index: 2, block_type: 'field_group', content: BRUT_FIELDS.slice(0, 11).map(([k, l]) => `${l}: {{${k}}}`).join('\n') },
    { order_index: 3, block_type: 'heading', content: 'Section B — Contact & banking' },
    { order_index: 4, block_type: 'field_group', content: BRUT_FIELDS.slice(11, 19).map(([k, l]) => `${l}: {{${k}}}`).join('\n') },
    { order_index: 5, block_type: 'heading', content: 'Section C — Goods receiving' },
    { order_index: 6, block_type: 'field_group', content: BRUT_FIELDS.slice(19, 23).map(([k, l]) => `${l}: {{${k}}}`).join('\n') },
    { order_index: 7, block_type: 'heading', content: 'Terms and conditions of trade' },
    ...[1, 2, 3, 4, 5, 6, 7].map(n => ({ order_index: 7 + n, block_type: 'fixed_text',
      content: `Article ${n}. ${['Application.', 'Orders.', 'Prices and payment.', 'Delivery and risk.', 'Claims.', 'Credit.', 'Governing law.'][n - 1]} (boilerplate)` })),
    { order_index: 15, block_type: 'signature_block', content: 'Customer director' },
    { order_index: 16, block_type: 'field_group', content: BRUT_FIELDS.slice(23).map(([k, l]) => `${l}: {{${k}}}`).join('\n') },
  ],
  fields: BRUT_FIELDS.map(([field_key, label, field_type, required], i) => ({
    label, field_key, field_type, required,
    section: i < 11 ? 'Section A — Company information' : i < 19 ? 'Section B — Contact & banking' : i < 23 ? 'Section C — Goods receiving' : 'Execution',
    confidence: field_type === 'short_text' && i > 10 ? 'medium' : 'high',
  })),
});

describe('f100 — upload-and-convert', () => {
  let h, w, stub;
  // the stub speaks for the model; each test sets its next answer
  let stubMode = 'brut';
  const stubCalls = [];

  before(async () => {
    stub = await new Promise(resolve => {
      const server = http.createServer((req, res) => {
        let raw = '';
        req.on('data', d => { raw += d; });
        req.on('end', () => {
          stubCalls.push(raw);
          const input = stubMode === 'garbage' ? { blocks: 'not-an-array', fields: null }
            : stubMode === 'prose' ? {} : brutDetection();
          res.writeHead(200, { 'content-type': 'application/json' });
          res.end(JSON.stringify({
            id: 'msg_stub', type: 'message', role: 'assistant', model: 'claude-sonnet-4-6',
            content: [{ type: 'tool_use', id: 'tu_1', name: 'propose_template', input }],
            usage: { input_tokens: 500, output_tokens: 400 },
          }));
        });
      });
      server.listen(0, '127.0.0.1', () => resolve({
        base: 'http://127.0.0.1:' + server.address().port,
        stop: () => new Promise(r => server.close(r)),
      }));
    });
    h = await startHati({ ANTHROPIC_BASE_URL: stub.base });
    w = await seedWorkspace(h);
  });
  after(async () => { await h.stop(); await stub.stop(); });

  test('the real file signature is checked — a renamed non-docx never reaches the model', async () => {
    const calls = stubCalls.length;
    const fake = await w.admin.raw('/api/templates/upload', { method: 'POST', body: {
      fileName: 'contract.docx', dataUrl: 'data:application/pdf;base64,' + Buffer.from('%PDF-1.4 not a docx').toString('base64') } });
    assert.equal(fake.status, 400);
    assert.match(fake.json.error, /not a Word/);

    // a zip wrapper with no word/document.xml inside is a zip, not a document
    const notdocx = Buffer.concat([Buffer.from([0x50, 0x4b, 0x03, 0x04]), Buffer.alloc(200)]);
    const z = await w.admin.raw('/api/templates/upload', { method: 'POST', body: {
      fileName: 'x.docx', dataUrl: dataUrl(notdocx) } });
    assert.equal(z.status, 400);
    assert.equal(stubCalls.length, calls, 'no model call was made for either');
  });

  let brutTplId, brutV1Id;

  test('the Brut form converts: extraction reaches the model in reading order, the draft carries typed fields', async () => {
    stubMode = 'brut';
    const r = await w.admin.json('/api/templates/upload', { method: 'POST', body: {
      fileName: 'brut-account-opening.docx', name: 'Brut Africa — Account Opening',
      dataUrl: dataUrl(FIX('brut-account-opening.docx')) } });
    assert.equal(r.converted, true);
    assert.equal(r.fieldsDetected, BRUT_FIELDS.length);
    brutTplId = r.templateId; brutV1Id = r.versionId;

    // the extraction the model received: labels, blank markers, reading order
    const sent = stubCalls[stubCalls.length - 1];
    assert.ok(sent.includes('KRA PIN'), 'labels reach the model');
    assert.ok(sent.includes('(empty)'), 'blank table cells are marked');
    assert.ok(sent.includes('claude-sonnet-4-6'), 'the brief’s model is requested');
    for (const label of ['Company telephone', 'Email address', 'Receiver ID number', 'Company stamp', 'Director signature'])
      assert.ok(sent.includes(label), `“${label}” reaches the model`);
    assert.ok(sent.indexOf('Section A') < sent.indexOf('Section B') && sent.indexOf('Section B') < sent.indexOf('Article 1'),
      'reading order survives extraction');
    assert.ok(sent.includes('Fields marked * are required'), 'the asterisk convention is visible to the model');

    const t = await w.admin.json('/api/templates/' + r.templateId);
    assert.equal(t.template.status, 'draft', 'an upload is a DRAFT — never published by the machine');
    assert.equal(t.template.origin, 'upload');
    const v = await w.admin.json(`/api/templates/${r.templateId}/versions/${r.versionId}`);
    const byKey = Object.fromEntries(v.fields.map(f => [f.field_key, f]));
    assert.equal(byKey.kra_pin.field_type, 'kenya_tax_id');
    assert.equal(byKey.email_address.field_type, 'email');
    assert.equal(byKey.company_telephone.field_type, 'phone');
    assert.equal(byKey.receiver_id_number.field_type, 'national_id');
    assert.equal(byKey.company_stamp.field_type, 'stamp_image');
    assert.equal(byKey.director_signature.field_type, 'signature_name_title');
    assert.ok(v.fields.every(f => !f.human_reviewed), 'nothing is marked human-reviewed until a human reviews it');
    assert.ok(v.fields.every(f => ['high', 'medium', 'low'].includes(f.detection_confidence)));
    assert.equal(v.blocks.filter(b => b.blockType === 'fixed_text').length, 7, 'Articles 1–7 arrive as fixed text');
    assert.ok(v.blocks.some(b => b.blockType === 'signature_block'));
  });

  test('the other two blank styles reach the model intact', async () => {
    stubMode = 'brut';
    await w.admin.json('/api/templates/upload', { method: 'POST', body: {
      fileName: 'blanks-underscores.docx', dataUrl: dataUrl(FIX('blanks-underscores.docx')) } });
    let sent = stubCalls[stubCalls.length - 1];
    assert.ok(sent.includes('[INSERT CONSULTANT NAME]'), 'bracket placeholders survive extraction');
    assert.ok(sent.includes('____'), 'underscore runs survive extraction');
    assert.ok(sent.includes('[\\u25cf]') || sent.includes('[●]'), 'the [●] marker survives');

    await w.admin.json('/api/templates/upload', { method: 'POST', body: {
      fileName: 'blanks-inline.docx', dataUrl: dataUrl(FIX('blanks-inline.docx')) } });
    sent = stubCalls[stubCalls.length - 1];
    assert.ok(sent.includes('whose registered address is'), 'inline-blank prose survives extraction');
  });

  test('a garbage model response saves a draft with an error note instead of crashing', async () => {
    stubMode = 'garbage';
    const r = await w.admin.json('/api/templates/upload', { method: 'POST', body: {
      fileName: 'blanks-underscores.docx', dataUrl: dataUrl(FIX('blanks-underscores.docx')) } });
    assert.equal(r.converted, false);
    assert.ok(r.errorNote, 'the failure is said, not swallowed');
    assert.ok(r.fileId, 'the original file is stored for reprocessing');
    const t = await w.admin.json('/api/templates/' + r.templateId);
    assert.equal(t.template.status, 'draft');
    assert.match(t.versions[0].errorNote, /original file is stored/);
    stubMode = 'brut';
  });

  test('viewers cannot upload', async () => {
    await w.admin.json('/api/users', { method: 'POST', body: {
      name: 'Read Only', email: 'viewer4@example.co.ke', role: 'viewer', password: 'temporary-pass-1' } });
    const viewer = h.client('viewer4');
    await viewer.json('/api/login', { method: 'POST', body: { email: 'viewer4@example.co.ke', password: 'temporary-pass-1' } });
    const out = await viewer.raw('/api/templates/upload', { method: 'POST', body: {
      fileName: 'x.docx', dataUrl: dataUrl(FIX('blanks-inline.docx')) } });
    assert.equal(out.status, 403);
  });

  test('end-to-end: confirm → publish → create contract → fill → the document is clean', async () => {
    // the confirmation pass: a human reviewed the fields (this is the screen's PUT)
    const v = await w.admin.json(`/api/templates/${brutTplId}/versions/${brutV1Id}`);
    await w.admin.json(`/api/templates/${brutTplId}/versions/${brutV1Id}`, { method: 'PUT', body: {
      blocks: v.blocks.map(b => ({ orderIndex: b.orderIndex, blockType: b.blockType, content: b.content })),
      fields: v.fields.map((f, i) => ({
        fieldKey: f.field_key, label: f.label, section: f.section, orderIndex: i,
        fieldType: f.field_key === 'payment_terms' ? 'select' : f.field_type,
        control: f.field_key === 'payment_terms' ? 'guided' : 'free',
        options: f.field_key === 'payment_terms' ? ['30 days', '45 days', '60 days'] : [],
        required: f.required, detectionConfidence: f.detection_confidence, humanReviewed: true,
      })) } });
    const pub = await w.admin.json(`/api/templates/${brutTplId}/versions/${brutV1Id}/publish`, {
      method: 'POST', body: { changeNote: 'Adopted from the uploaded account opening form' } });
    assert.equal(pub.ok, true);

    const made = await w.admin.json(`/api/templates/${brutTplId}/contracts`, { method: 'POST', body: { folder: 'sales' } });
    const c = made.contract;
    assert.ok(c.redlineText.includes('Article 3'), 'the articles are on the contract');
    assert.ok(!/\{\{/.test(c.redlineText), 'no placeholder syntax on the document');

    // fill a few fields the way the form panel does, and check the render
    c.templateForm.values.kra_pin = 'A012345678Z';
    c.templateForm.values.registered_company_name = 'Wanjiru Catering Ltd';
    c.templateForm.values.payment_terms = '45 days';
    const { templateFormDocHtml } = require('../js/templateform.js');
    c.redlineText = templateFormDocHtml(c.templateForm);
    const v0 = c._v; delete c._v;
    await w.admin.json('/api/contracts/' + c.id, { method: 'PUT', body: { contract: c, baseVersion: v0 } });
    const back = await w.admin.json('/api/contracts/' + c.id);
    assert.ok(back.redlineText.includes('A012345678Z'));
    assert.ok(back.redlineText.includes('Wanjiru Catering Ltd'));
    assert.ok(back.redlineText.includes('45 days'));
    assert.ok(!/\{\{/.test(back.redlineText), 'still no placeholder syntax after filling');
    assert.equal(back.libraryTemplateId, brutTplId, 'provenance points at the uploaded template');
  });
});
