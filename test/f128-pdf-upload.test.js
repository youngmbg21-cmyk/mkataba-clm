/* ============================================================
   f128 — the PDF door: a PDF (including a scan) becomes a draft template

   The PDF & Scanned Document Upload addendum. The rule the whole feature
   rests on is that a PDF is a second DOOR, not a second product: it enters at
   the same screen, is read into the same blocks-and-fields shape, and lands on
   the same confirmation screen as a Word file. Everything below is either
   proving that sameness, or proving the small number of things that must be
   DIFFERENT because a photograph of paper is not a document.

   Pinned here:

     · a PDF is judged by its bytes: %PDF- or refused. An unreadable PDF, an
       encrypted one, and one over the page cap are all refused BEFORE a call
       is made — the cap exists to bound spending, so it must hold even when
       the client lies about the count
     · classification is the server's own reading of the file: a text layer
       means pdf_digital, its absence means pdf_scanned. Both are recorded on
       the template alongside the page count
     · the file reaches the model as a document content block — the API renders
       the pages, HaTi never rasterises — and the PDF-specific detection rules
       travel with it while the shared prompt, tool and output contract stay
       exactly as the Word route left them
     · the scan rule is hard-coded, not asked of the model: from a scan, every
       digit-bearing field (ID, KRA PIN, phone, company reg, number) comes back
       at 'medium' at best, however confident the model was. From a digital PDF
       it does not
     · a scan says so — the template carries scanned:true, which is what draws
       the confirmation screen's banner
     · end-to-end on all three fixtures: upload → classify → detect → confirm →
       publish → create contract → fill → the document carries the values and
       no {{placeholder}} syntax

   What this file CANNOT prove without a live Anthropic key: whether the model
   actually reads the Brut form well (the brief's bar is 20 of ~27 blanks) and
   what a page costs. Those need a real call; see BUGLOG.md and SUMMARY.md.
   ============================================================ */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const { startHati, seedWorkspace } = require('./helpers');

const FIX = f => fs.readFileSync(path.join(__dirname, '..', 'fixtures', f));
const pdfUrl = buf => 'data:application/pdf;base64,' + buf.toString('base64');

/* The digit-bearing types the scan rule holds down, and a couple that it must
   leave alone — so the test proves the rule is selective, not a blanket. */
const PDF_FIELDS = [
  ['registered_company_name', 'Registered company name', 'short_text', true],
  ['certificate_of_incorporation_number', 'Certificate of incorporation number', 'company_reg_number', true],
  ['kra_pin', 'KRA PIN', 'kenya_tax_id', true],
  ['company_telephone', 'Company telephone', 'phone', true],
  ['email_address', 'Email address', 'email', true],
  ['receiver_id_number', 'Receiver ID number', 'national_id', true],
  ['requested_credit_limit', 'Requested credit limit (KES)', 'number', false],
  ['date_of_incorporation', 'Date of incorporation', 'date', false],
  ['director_signature', 'Director signature', 'signature_name_title', true],
];
const DIGIT_KEYS = ['certificate_of_incorporation_number', 'kra_pin', 'company_telephone', 'receiver_id_number', 'requested_credit_limit'];

/* Every field comes back 'high'. Anything below 'high' downstream is therefore
   the server's doing, which is exactly what the scan rule is. */
const detection = () => ({
  blocks: [
    { order_index: 0, block_type: 'heading', content: 'BRUT AFRICA LIMITED — ACCOUNT OPENING FORM' },
    { order_index: 1, block_type: 'field_group', content: PDF_FIELDS.slice(0, 8).map(([k, l]) => `${l}: {{${k}}}`).join('\n') },
    { order_index: 2, block_type: 'fixed_text', content: 'Article 1. Application. (boilerplate)' },
    { order_index: 3, block_type: 'signature_block', content: 'Customer director' },
    { order_index: 4, block_type: 'field_group', content: `Director signature: {{director_signature}}` },
  ],
  fields: PDF_FIELDS.map(([field_key, label, field_type, required]) => ({
    label, field_key, field_type, required, section: 'Section A', confidence: 'high',
  })),
});

/* ---------- hand-built PDFs for the cases no fixture should carry --------- */
/* A structurally valid PDF with `pages` page objects and nothing else worth
   reading. Used for the page cap, where what matters is only the count. */
function pdfWithPages(pages) {
  const objs = [];
  const kids = [];
  for (let i = 0; i < pages; i++) kids.push(`${3 + i} 0 R`);
  objs.push('<< /Type /Catalog /Pages 2 0 R >>');
  objs.push(`<< /Type /Pages /Count ${pages} /Kids [${kids.join(' ')}] >>`);
  for (let i = 0; i < pages; i++) objs.push('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] >>');
  let out = '%PDF-1.4\n', offsets = [0], pos = out.length;
  objs.forEach((o, i) => { const s = `${i + 1} 0 obj\n${o}\nendobj\n`; offsets.push(pos); out += s; pos += s.length; });
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objs.length; i++) out += String(offsets[i]).padStart(10, '0') + ' 00000 n \n';
  out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${pos}\n%%EOF\n`;
  return Buffer.from(out, 'latin1');
}
const encryptedPdf = () => Buffer.concat([pdfWithPages(2),
  Buffer.from('trailer\n<< /Size 5 /Root 1 0 R /Encrypt 9 0 R >>\n%%EOF\n', 'latin1')]);

describe('f128 — the PDF door', () => {
  let h, w, stub;
  const stubCalls = [];
  let stubMode = 'ok';

  before(async () => {
    stub = await new Promise(resolve => {
      const server = http.createServer((req, res) => {
        let raw = '';
        req.on('data', d => { raw += d; });
        req.on('end', () => {
          stubCalls.push(raw);
          res.writeHead(200, { 'content-type': 'application/json' });
          res.end(JSON.stringify({
            id: 'msg_stub', type: 'message', role: 'assistant', model: 'claude-sonnet-4-6',
            content: [{ type: 'tool_use', id: 'tu_1', name: 'propose_template',
              input: stubMode === 'garbage' ? { blocks: 'nope', fields: null } : detection() }],
            usage: { input_tokens: 900, output_tokens: 500 },
          }));
        });
      });
      server.listen(0, '127.0.0.1', () => resolve({
        base: 'http://127.0.0.1:' + server.address().port,
        stop: () => new Promise(r => server.close(r)),
      }));
    });
    /* The converter sits behind the Copilot rate limiter (15 deep calls per
       window in production). This file deliberately uploads far more than that
       — every fixture, every refusal, every end-to-end pass — so the limiter is
       given headroom here. It is a real guard and is left alone everywhere
       else; raising it for this run is what lets the run be thorough, not a
       statement that it does not matter. */
    h = await startHati({ ANTHROPIC_BASE_URL: stub.base, AI_RATE_DEEP: '500' });
    w = await seedWorkspace(h);
  });
  after(async () => { await h.stop(); await stub.stop(); });

  /* ---------- refusals, all of them before a single call ---------------- */

  test('an unreadable, an encrypted and an over-long PDF are all refused without a model call', async () => {
    const calls = stubCalls.length;

    const broken = await w.admin.raw('/api/templates/upload', { method: 'POST', body: {
      fileName: 'broken.pdf', dataUrl: pdfUrl(Buffer.from('%PDF-1.4 and then nothing at all')) } });
    assert.equal(broken.status, 400);
    assert.match(broken.json.error, /could not be read/);

    const locked = await w.admin.raw('/api/templates/upload', { method: 'POST', body: {
      fileName: 'locked.pdf', dataUrl: pdfUrl(encryptedPdf()) } });
    assert.equal(locked.status, 400);
    assert.match(locked.json.error, /password-protected/);

    const long = await w.admin.raw('/api/templates/upload', { method: 'POST', body: {
      fileName: 'long.pdf', dataUrl: pdfUrl(pdfWithPages(31)) } });
    assert.equal(long.status, 400);
    assert.match(long.json.error, /31 pages/);
    assert.match(long.json.error, /split the file or upload the Word version/);

    assert.equal(stubCalls.length, calls,
      'not one of the three reached the model — the caps bound spending, so they must hold before the call');
  });

  test('the page cap is the server’s own count, not a number the client supplied', async () => {
    const calls = stubCalls.length;
    /* The browser is welcome to pre-check for a fast, friendly error. It is not
       trusted: the count that decides whether we spend money is read from the
       bytes here. A client claiming a 31-page file is 2 pages changes nothing. */
    const out = await w.admin.raw('/api/templates/upload', { method: 'POST', body: {
      fileName: 'long.pdf', dataUrl: pdfUrl(pdfWithPages(31)), pageCount: 2, sourceType: 'pdf_digital' } });
    assert.equal(out.status, 400);
    assert.match(out.json.error, /31 pages/);
    assert.equal(stubCalls.length, calls, 'still no model call');

    // 30 exactly is inside the cap — the boundary is not off by one
    const ok = await w.admin.json('/api/templates/upload', { method: 'POST', body: {
      fileName: 'thirty.pdf', dataUrl: pdfUrl(pdfWithPages(30)) } });
    assert.equal(ok.pageCount, 30);
  });

  /* ---------- classification ------------------------------------------- */

  test('a born-digital PDF is read as digital, with its page count recorded', async () => {
    const r = await w.admin.json('/api/templates/upload', { method: 'POST', body: {
      fileName: 'brut-account-opening.pdf', dataUrl: pdfUrl(FIX('brut-account-opening.pdf')) } });
    assert.equal(r.converted, true);
    assert.equal(r.sourceType, 'pdf_digital', 'a text layer means digital');
    assert.equal(r.scanned, false);
    assert.equal(r.pageCount, 2);

    const t = await w.admin.json('/api/templates/' + r.templateId);
    assert.equal(t.template.sourceType, 'pdf_digital', 'and it is recorded on the template, not just returned');
    assert.equal(t.template.pageCount, 2);
    assert.equal(t.template.scanned, false);
    assert.equal(t.template.status, 'draft', 'an upload is a DRAFT — never published by the machine');
    assert.equal(t.template.origin, 'upload');
  });

  test('a scan is read as a scan — no text layer, so pdf_scanned', async () => {
    const r = await w.admin.json('/api/templates/upload', { method: 'POST', body: {
      fileName: 'brut-account-opening-scanned.pdf', dataUrl: pdfUrl(FIX('brut-account-opening-scanned.pdf')) } });
    assert.equal(r.converted, true);
    assert.equal(r.sourceType, 'pdf_scanned');
    assert.equal(r.scanned, true, 'this flag is what draws the banner on the confirmation screen');
    assert.equal(r.pageCount, 2);
    const t = await w.admin.json('/api/templates/' + r.templateId);
    assert.equal(t.template.scanned, true);
  });

  test('a Word file is still docx, and templates from before this feature stay silent', async () => {
    const docx = 'data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,'
      + FIX('blanks-inline.docx').toString('base64');
    const r = await w.admin.json('/api/templates/upload', { method: 'POST', body: {
      fileName: 'blanks-inline.docx', dataUrl: docx } });
    assert.equal(r.sourceType, 'docx');
    assert.equal(r.scanned, false);
    assert.equal(r.pageCount, null, 'page count is a PDF idea; a Word file has none');

    /* The column is additive and nullable, so everything converted before this
       feature existed carries NULL — and NULL must read as "not a scan", never
       as "unknown, better warn them". */
    const built = await w.admin.json('/api/templates', { method: 'POST', body: {
      name: 'Made in the builder', category: 'other' } });
    const t = await w.admin.json('/api/templates/' + built.template.id);
    assert.equal(t.template.sourceType, null);
    assert.equal(t.template.scanned, false, 'NULL is not a scan');
  });

  /* ---------- how the document reaches the model ------------------------ */

  test('the PDF travels as a document block and the PDF rules travel with it', async () => {
    await w.admin.json('/api/templates/upload', { method: 'POST', body: {
      fileName: 'brut-account-opening.pdf', dataUrl: pdfUrl(FIX('brut-account-opening.pdf')) } });
    const sent = JSON.parse(stubCalls[stubCalls.length - 1]);

    // the file itself, attached — not text HaTi extracted, and not page images
    const content = sent.messages[0].content;
    assert.ok(Array.isArray(content), 'the user turn is content blocks, not a bare string');
    const doc = content.find(b => b.type === 'document');
    assert.ok(doc, 'the PDF is attached as a document block');
    assert.equal(doc.source.type, 'base64');
    assert.equal(doc.source.media_type, 'application/pdf');
    assert.ok(doc.source.data.length > 1000, 'the whole file went, not a summary of it');
    assert.equal(Buffer.from(doc.source.data, 'base64').subarray(0, 5).toString(), '%PDF-',
      'and what went is really the PDF');
    assert.ok(content.some(b => b.type === 'text'), 'with an instruction beside it');
    assert.ok(!content.some(b => b.type === 'image'), 'HaTi does not rasterise — the API renders the pages');

    // the shared contract is untouched; the PDF rules are an addendum to it
    assert.equal(sent.model, 'claude-sonnet-4-6', 'the brief’s model is requested');
    assert.equal(sent.tool_choice.name, 'propose_template', 'the same forced tool as the Word route');
    assert.equal(sent.tools[0].name, 'propose_template');
    assert.match(sent.system, /converting a company's standard document/, 'the shared prompt is reused whole');
    assert.match(sent.system, /left to right, top to bottom/, 'reading order');
    assert.match(sent.system, /empty ruled box/, 'a ruled box is a field');
    assert.match(sent.system, /ignore whatever was handwritten/i, 'handwriting is ignored, the blank is not');
    assert.match(sent.system, /confidence: low/, 'a half-legible label is kept, not dropped');
    assert.match(sent.system, /Never invent a field/, 'nothing invented');
  });

  test('a Word upload is unchanged by any of this', async () => {
    const docx = 'data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,'
      + FIX('brut-account-opening.docx').toString('base64');
    await w.admin.json('/api/templates/upload', { method: 'POST', body: {
      fileName: 'brut-account-opening.docx', dataUrl: docx } });
    const sent = JSON.parse(stubCalls[stubCalls.length - 1]);
    assert.equal(typeof sent.messages[0].content, 'string', 'the Word route still sends its extraction as text');
    assert.ok(sent.messages[0].content.includes('KRA PIN'));
    assert.ok(!/left to right, top to bottom/.test(sent.system), 'and it does not get the PDF rules');
  });

  /* ---------- the scan rule -------------------------------------------- */

  test('from a scan, every digit field is held down to medium — whatever the model claimed', async () => {
    const r = await w.admin.json('/api/templates/upload', { method: 'POST', body: {
      fileName: 'brut-account-opening-scanned.pdf', dataUrl: pdfUrl(FIX('brut-account-opening-scanned.pdf')) } });
    const v = await w.admin.json(`/api/templates/${r.templateId}/versions/${r.versionId}`);
    const byKey = Object.fromEntries(v.fields.map(f => [f.field_key, f]));

    // the model said 'high' for all nine; these five must not have survived it
    for (const k of DIGIT_KEYS)
      assert.equal(byKey[k].detection_confidence, 'medium',
        `${k} is digits on a scan — it cannot be high confidence`);

    // and the rule is selective: a name, an email and a date are left alone
    for (const k of ['registered_company_name', 'email_address', 'date_of_incorporation'])
      assert.equal(byKey[k].detection_confidence, 'high', `${k} is not a digit field — untouched`);

    assert.match(r.notice || '', /marked for checking because the source was a scan/,
      'and the user is told it happened, rather than quietly seeing lower numbers');
  });

  test('from a digital PDF the same fields keep their confidence', async () => {
    const r = await w.admin.json('/api/templates/upload', { method: 'POST', body: {
      fileName: 'brut-account-opening.pdf', dataUrl: pdfUrl(FIX('brut-account-opening.pdf')) } });
    const v = await w.admin.json(`/api/templates/${r.templateId}/versions/${r.versionId}`);
    const byKey = Object.fromEntries(v.fields.map(f => [f.field_key, f]));
    for (const k of DIGIT_KEYS)
      assert.equal(byKey[k].detection_confidence, 'high',
        `${k} came from a text layer, not a photograph — no reason to doubt it`);
  });

  /* ---------- failure and permission ------------------------------------ */

  test('a garbage answer to a PDF saves a draft with an error note instead of crashing', async () => {
    stubMode = 'garbage';
    const r = await w.admin.json('/api/templates/upload', { method: 'POST', body: {
      fileName: 'brut-account-opening.pdf', dataUrl: pdfUrl(FIX('brut-account-opening.pdf')) } });
    assert.equal(r.converted, false);
    assert.ok(r.errorNote, 'the failure is said, not swallowed');
    assert.ok(r.fileId, 'the original PDF is stored for reprocessing');
    assert.equal(r.sourceType, 'pdf_digital', 'and what we learned about the file survives the failure');
    const t = await w.admin.json('/api/templates/' + r.templateId);
    assert.equal(t.template.status, 'draft');
    stubMode = 'ok';
  });

  test('viewers cannot upload a PDF either', async () => {
    await w.admin.json('/api/users', { method: 'POST', body: {
      name: 'Read Only', email: 'viewer128@example.co.ke', role: 'viewer', password: 'temporary-pass-1' } });
    const viewer = h.client('viewer128');
    await viewer.json('/api/login', { method: 'POST', body: { email: 'viewer128@example.co.ke', password: 'temporary-pass-1' } });
    const out = await viewer.raw('/api/templates/upload', { method: 'POST', body: {
      fileName: 'x.pdf', dataUrl: pdfUrl(FIX('brut-account-opening.pdf')) } });
    assert.equal(out.status, 403);
  });

  /* ---------- the whole way through, for each fixture ------------------- */

  for (const [file, expectType, expectPages] of [
    ['brut-account-opening.pdf', 'pdf_digital', 2],
    ['brut-account-opening-scanned.pdf', 'pdf_scanned', 2],
    ['blanks-mixed.pdf', 'pdf_digital', 1],
  ]) {
    test(`end-to-end (${file}): upload → classify → detect → confirm → publish → contract → fill`, async () => {
      const r = await w.admin.json('/api/templates/upload', { method: 'POST', body: {
        fileName: file, dataUrl: pdfUrl(FIX(file)) } });
      assert.equal(r.converted, true);
      assert.equal(r.sourceType, expectType);
      assert.equal(r.pageCount, expectPages);

      // the confirmation pass — the human screen's PUT, identical to the Word route's
      const v = await w.admin.json(`/api/templates/${r.templateId}/versions/${r.versionId}`);
      await w.admin.json(`/api/templates/${r.templateId}/versions/${r.versionId}`, { method: 'PUT', body: {
        blocks: v.blocks.map(b => ({ orderIndex: b.orderIndex, blockType: b.blockType, content: b.content })),
        fields: v.fields.map((f, i) => ({
          fieldKey: f.field_key, label: f.label, section: f.section, orderIndex: i,
          fieldType: f.field_type, control: 'free', options: [], required: f.required,
          detectionConfidence: f.detection_confidence, humanReviewed: true,
        })) } });

      const pub = await w.admin.json(`/api/templates/${r.templateId}/versions/${r.versionId}/publish`, {
        method: 'POST', body: { changeNote: `Adopted from ${file}` } });
      assert.equal(pub.ok, true);

      const made = await w.admin.json(`/api/templates/${r.templateId}/contracts`, { method: 'POST', body: { folder: 'sales' } });
      const c = made.contract;
      assert.ok(!/\{\{/.test(c.redlineText), 'no placeholder syntax on the document');

      c.templateForm.values.kra_pin = 'A012345678Z';
      c.templateForm.values.registered_company_name = 'Wanjiru Catering Ltd';
      const { templateFormDocHtml } = require('../js/templateform.js');
      c.redlineText = templateFormDocHtml(c.templateForm);
      const v0 = c._v; delete c._v;
      await w.admin.json('/api/contracts/' + c.id, { method: 'PUT', body: { contract: c, baseVersion: v0 } });
      const back = await w.admin.json('/api/contracts/' + c.id);
      assert.ok(back.redlineText.includes('A012345678Z'));
      assert.ok(back.redlineText.includes('Wanjiru Catering Ltd'));
      assert.ok(!/\{\{/.test(back.redlineText), 'still no placeholder syntax after filling');
      assert.equal(back.libraryTemplateId, r.templateId, 'provenance points at the uploaded template');
    });
  }
});
