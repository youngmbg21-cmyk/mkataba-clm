/* ============================================================
   F492 — OUR WORD FILE READS BACK EXACTLY (4 Oct 2026, process review gap D)
   ============================================================
   The Word file we send is the file that comes back. Read straight back
   through our own reader, it did not say what we sent:

     · a numbered list item lost its number. HaTi's lists went out as Word's
       automatic numbering and the import's reader reads only the words on the
       page, so "1. The Supplier shall supply…" came back as "The Supplier
       shall supply…" — clause 1 without its 1.;
     · the signature lines under the last clause ("For Highland Corporate
       Ltd", "For Kabras Sugar") came back as WORDING of that last clause;
     · on a contract with no front matter of its own, the label HaTi draws at
       the top of the paper (the contract's name, the template line) came back
       as two brand-new clauses.

     · the Negotiate page's own chrome went into the file as wording — the
       ladder chip beside a heading reached the counterparty as "Step 1 · your
       ask", a line of the payment clause.

   So a counterparty who opened our file, touched nothing and sent it back
   filed changes nobody had made. MEASURED at the parent before a line was
   written: every one of the twelve built-in templates filed one phantom
   change on its last clause; the f477-style text contract filed two (both
   numbers gone); a contract with no front matter filed four new clauses;
   all ten tests below fail there.

   WHAT IS PROVED HERE, on the product's own stage (core.js, the real docBody,
   the real redlineDocHtml and the real writer): for every built-in template
   and for the uploaded, the text-drafted and the list-drafted shapes, the file
   wordTrackedFile writes, read back by the import's reader AND by the upload
   reader, segments into the same clauses — number, heading and wording — as
   the record, the signature block is in no clause, and an untouched file
   returned through negoImportReturnedDocx files nothing. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildPortal } = require('./portalworld');
const { mkDocx, styledPara, WORD_PARTS, para } = require('./docxfix');

const ROOT = path.join(__dirname, '..');
/* The twelve built-in papers, read off js/templates.js itself (the table is
   plain data) so a thirteenth is covered the day it is added. */
const TSRC = fs.readFileSync(path.join(ROOT, 'js', 'templates.js'), 'utf8');
const TAT = TSRC.indexOf('const TEMPLATES = {');
const TEMPLATES = (0, eval)('(' + TSRC.slice(TSRC.indexOf('{', TAT), TSRC.indexOf('\n};', TAT) + 2) + ')');

const norm = s => String(s == null ? '' : s).replace(/\s+/g, ' ').trim();

function stage(){
  const p = buildPortal();
  p.win.TEMPLATES = TEMPLATES;
  return p;
}
function contract(win, over){
  const c = Object.assign({ id: 'MK-492', name: 'Supply Agreement', counterparty: 'Kabras Sugar',
    status: 'Draft', folder: 'proc', value: 4800000, fields: { effDate: '2026-08-01' }, metadata: {},
    audit: [], rounds: [], versions: [], signatures: [], comments: [] }, over || {});
  win.state = Object.assign({}, win.state, { contracts: [c], activeId: c.id });
  win.getContract = id => (id === c.id ? c : null);
  win.negoInit(c);
  return c;
}

/* ---- THE SHAPES ---- */
const R = t => `<w:r><w:t xml:space="preserve">${t}</w:t></w:r>`;
/* Received paper: automatically numbered, real heading styles — f257's file. */
const UPLOAD_DOCX = mkDocx(
  styledPara('Title', null, 0, 'SUPPLY AGREEMENT')
  + para('This Agreement is made between Highland and Naivas.')
  + styledPara('Heading1', 1, 0, 'Definitions')
  + para('In this Agreement the following words have the meanings given.')
  + styledPara('Heading1', 1, 0, 'Term and Termination')
  + styledPara(null, 1, 1, 'This Agreement runs for twelve months.')
  + styledPara(null, 1, 1, 'Either party may terminate on sixty (60) days notice.')
  + styledPara(null, 1, 2, 'Notice must be in writing.')
  + styledPara(null, 1, 1, 'Termination does not affect accrued rights.')
  + styledPara('Heading1', 1, 0, 'Charges')
  + styledPara(null, 1, 1, 'The Buyer shall pay each invoice within thirty (30) days.')
  + styledPara(null, 2, 0, 'Insurance is maintained at all times.')
  + '<w:tbl><w:tr><w:tc><w:p>' + R('Service') + '</w:p></w:tc><w:tc><w:p>' + R('Rate') + '</w:p></w:tc></w:tr>'
  + '<w:tr><w:tc><w:p>' + R('Delivery') + '</w:p></w:tc><w:tc><w:p>' + R('KES 1,200') + '</w:p></w:tc></w:tr></w:tbl>'
  + styledPara('Heading1', 1, 0, 'Execution')
  + para('SIGNED for and on behalf of the parties.'),
  { parts: WORD_PARTS });
/* Drafted as TEXT: numbered paragraphs become <ol> / <ol start="2"> — the
   shape whose clause 1 lost its "1.". f477's own contract. */
const TEXT_BODY = [
  'RAW MATERIAL SUPPLY AGREEMENT',
  '1. SUPPLY',
  '1. The Supplier shall supply an estimated 5000 metric tonnes per annum.',
  '2. PAYMENT TERMS',
  '2. All invoices are payable within thirty (30) days from the date of issue.',
].join('\n');
/* Lists HaTi drew itself, nested, numbered and bulleted. */
const LIST_BODY = '<h1>Services Agreement</h1><p>This agreement is made between Highland and Naivas.</p>'
  + '<h2>1. Services</h2><ol><li>The Supplier delivers the goods.<ol><li>On time.</li><li>In full.</li></ol></li>'
  + '<li>The Supplier issues the invoice.</li></ol>'
  + '<h2>2. Records</h2><ul><li>Records are kept for six years.<ul><li>Copies on request.</li></ul></li></ul>'
  + '<ol start="4"><li>Audits on ten days notice.</li></ol>';
/* No front matter at all: the paper draws a label head of its own. */
const WALL_BODY = '<p>The Supplier provides the services.</p><p>Fees are payable monthly.</p>'
  + '<p>Either party may end this on notice.</p>';
/* The owner's page banners over clauses that run on across them (f371). */
const BANNER_BODY = '<h1>WAREHOUSING AND LOGISTICS SERVICES AGREEMENT</h1>'
  + '<p>THIS AGREEMENT is made between <strong>Apex Logistics Limited</strong> and <strong>Savannah Consumer Goods Limited</strong>.</p>'
  + '<h3>RECITALS:</h3><p>WHEREAS the Logistics Provider provides warehousing services.</p>'
  + '<h2>PAGE 1 OF 2: DEFINITIONS &amp; SCOPE</h2><h3>1. DEFINITIONS AND INTERPRETATION</h3>'
  + '<p>In this Agreement the following words have these meanings.</p>'
  + '<h3>2. SCOPE OF SERVICES</h3><p>The Logistics Provider shall store and handle the Goods.</p>'
  + '<h2>PAGE 2 OF 2: FEES &amp; LAW</h2><h3>3. CHARGES AND PAYMENT</h3>'
  + '<p>The Customer shall pay each invoice within thirty (30) days.</p>'
  + '<h3>4. GOVERNING LAW</h3><p>This Agreement is governed by the laws of Kenya.</p>';

async function fixtures(win){
  const up = await win.docxExtractRich(UPLOAD_DOCX);
  return [
    ...Object.keys(TEMPLATES).map(k => ({ name: 'template ' + k,
      make: () => contract(win, { id: 'MK-T' + k, name: TEMPLATES[k].name, template: k }) })),
    { name: 'uploaded, automatically numbered', make: () => contract(win, { id: 'MK-UP', source: 'upload',
      upload: { fileName: 'supply.docx', extractedText: up.text }, redlineText: win.sanitizeRich(up.html), format: 'rich' }) },
    { name: 'drafted as text', make: () => contract(win, { id: 'MK-TX', redlineText: TEXT_BODY, format: 'text' }) },
    { name: 'lists HaTi drew', make: () => contract(win, { id: 'MK-LS', redlineText: LIST_BODY, format: 'rich' }) },
    { name: 'no front matter', make: () => contract(win, { id: 'MK-WL', redlineText: WALL_BODY, format: 'rich' }) },
    { name: 'page banners', make: () => contract(win, { id: 'MK-BN', redlineText: BANNER_BODY, format: 'rich' }) },
  ];
}

/* What the import does with the text it read: lift it back onto the record's
   own structure (negoProposedBodyFromText, the funnel's door) and cut it into
   clauses (clauseSegment, the one splitter). */
function clausesOf(win, c, text){
  return win.clauseSegment(win.negoProposedBodyFromText(c, text));
}
function sameClauses(win, c, text, label){
  const base = win.negoClauseList(c);
  const back = clausesOf(win, c, text);
  assert.ok(base.length > 0, `${label}: the record has clauses`);
  assert.equal(back.length, base.length,
    `${label}: ${base.length} clauses went out and ${back.length} came back — `
    + JSON.stringify(back.map(x => x.headingText || x.text.slice(0, 40))));
  base.forEach((was, i) => {
    const now = back[i];
    assert.equal(now.num, was.num, `${label}: clause ${i + 1} keeps its number`);
    assert.equal(norm(now.headingText), norm(was.headingText), `${label}: clause ${i + 1} keeps its heading`);
    assert.equal(norm(now.text), norm(was.text), `${label}: clause ${i + 1} keeps its wording`);
  });
  return back;
}

describe('f492 (1) — the file we write reads back as the record, clause for clause', () => {
  test('every built-in template and every drafted shape, through the IMPORT\'s reader', async () => {
    const { win } = stage();
    for (const fx of await fixtures(win)){
      const c = fx.make();
      const out = win.wordTrackedFile(c, { side: 'owner' });
      const read = await win.docxExtract(out.bytes);
      const back = sameClauses(win, c, read.text, fx.name);
      /* THE SIGNATURE BLOCK IS IN NO CLAUSE. The paper ends with a ruled line
         per party; the last clause must not carry them as its wording. */
      const last = back[back.length - 1];
      assert.doesNotMatch(last.text, /\bFor (?:Highland|Kabras|Naivas)/,
        `${fx.name}: the signature lines are not wording of the last clause`);
      assert.doesNotMatch(read.text, /^\s*For (?:Highland|Kabras)/m,
        `${fx.name}: and they are not wording anywhere`);
    }
  });

  test('and through the UPLOAD reader, which a handed-over or re-filed copy is read by', async () => {
    const { win } = stage();
    for (const fx of await fixtures(win)){
      const c = fx.make();
      const out = win.wordTrackedFile(c, { side: 'owner' });
      const rich = await win.docxExtractRich(out.bytes);
      sameClauses(win, c, rich.text, fx.name + ' (upload reader)');
      assert.doesNotMatch(rich.html, /For (?:Highland|Kabras)/, `${fx.name}: no signature line in the body`);
    }
  });

  test('CLAUSE 1 KEEPS ITS 1.: a numbered list item carries its number in the file', async () => {
    const { win } = stage();
    const c = contract(win, { id: 'MK-TX', redlineText: TEXT_BODY, format: 'text' });
    assert.match(win.negoBaseBody(c), /<ol>/, 'fixture: the record holds an automatic list');
    const out = win.wordTrackedFile(c, { side: 'owner' });
    const read = await win.docxExtract(out.bytes);
    assert.match(read.text, /^1\.\tThe Supplier shall supply/m, 'the number, a real tab, the wording');
    assert.match(read.text, /^2\.\tAll invoices are payable/m, 'and a list that starts at 2 says 2');
  });

  test('a nested list carries the record\'s own marks, at its own depth', async () => {
    const { win } = stage();
    const c = contract(win, { id: 'MK-LS', redlineText: LIST_BODY, format: 'rich' });
    const read = await win.docxExtract(win.wordTrackedFile(c, { side: 'owner' }).bytes);
    const want = win.richToText(win.negoBaseBody(c)).split('\n')
      .filter(l => /^(?:[\d.]+|[•◦▪])\s/.test(l));
    assert.ok(want.length >= 7, 'fixture: seven list lines in the record');
    const got = read.text.split('\n').map(norm);
    for (const line of want) assert.ok(got.includes(norm(line)), `"${line}" is in the file as the record says it`);
  });
});

describe('f492 (2) — an untouched returned file files NOTHING', () => {
  test('every shape: the file we sent, sent straight back, is not a proposal', async () => {
    const { win } = stage();
    for (const fx of await fixtures(win)){
      const c = fx.make();
      const out = win.wordTrackedFile(c, { side: 'owner' });
      const res = await win.negoImportReturnedDocx(c, out.bytes, {});
      assert.equal(res.filed.length, 0, `${fx.name}: filed ${JSON.stringify(res.filed.map(x =>
        [x.changeType, x.clauseLabel, x.newText]))}`);
      assert.equal(res.answered.length, 0, `${fx.name}: nothing was open to answer`);
    }
  });

  test('with our ask on the table: the untouched file ACCEPTS it and files nothing of theirs', async () => {
    const { win } = stage();
    const c = contract(win, { id: 'MK-AK', redlineText: TEXT_BODY, format: 'text' });
    const mine = await win.negoFileProposal(c, win.negoBaseText(c).replace('thirty (30) days', 'sixty (60) days'),
      { side: 'owner', author: 'Us' });
    assert.equal(mine.length, 1, 'fixture: one ask of ours');
    win.negoHandOver(c, { to: 'counterparty', by: 'Us' });
    const out = win.wordTrackedFile(c, { side: 'owner' });
    assert.ok(out.tracked.ins >= 1, 'our ask went out as a tracked change');
    const res = await win.negoImportReturnedDocx(c, out.bytes, {});
    assert.equal(res.filed.length, 0, 'no change of theirs: ' + JSON.stringify(res.filed.map(x => [x.clauseLabel, x.newText])));
    assert.equal(JSON.stringify(res.answered.map(x => [x.id, x.status])), JSON.stringify([[mine[0].id, 'accepted']]));
  });
});

describe('f492 (3) — how the file says it, in Word\'s own terms', () => {
  test('the signature lines are the paper\'s, in a style of their own, after the last clause', async () => {
    const { win } = stage();
    const c = contract(win, { id: 'MK-TRM', name: TEMPLATES.RM.name, template: 'RM' });
    const xml = win.docxDocumentXml(win.redlineDocHtml(c, { side: 'owner' })).document;
    const sign = xml.match(/<w:p><w:pPr><w:pStyle w:val="HatiPaperSign"\/>[\s\S]*?<\/w:p>/g) || [];
    assert.equal(sign.length, 2, 'one ruled line per party');
    assert.match(sign[0], /For Highland Corporate Ltd/);
    assert.match(sign[1], /For Kabras Sugar/);
    assert.ok(xml.lastIndexOf('HatiPaperSign') > xml.lastIndexOf('Governing Law'), 'under the last clause');
  });

  test('a list item is a number, a real tab and a hanging indent — not Word\'s automatic numbering', async () => {
    const { win } = stage();
    const c = contract(win, { id: 'MK-TX', redlineText: TEXT_BODY, format: 'text' });
    const xml = win.docxDocumentXml(win.redlineDocHtml(c, { side: 'owner' })).document;
    assert.doesNotMatch(xml, /<w:numPr>/, 'no automatic number a text reader cannot see');
    assert.match(xml, /<w:ind w:left="720" w:hanging="720"\/>[\s\S]{0,80}<w:t xml:space="preserve">1\.<\/w:t><w:tab\/>/,
      'the number in its gutter, the tab to the stop');
  });

  test('the readers leave the paper\'s own lines out, and only those', async () => {
    const { win } = stage();
    const bytes = mkDocx(para('1. Payment')
      + '<w:p><w:pPr><w:pStyle w:val="HatiPaper"/></w:pPr>' + R('Supply Agreement') + '</w:p>'
      + para('Invoices are payable in thirty days.')
      + '<w:p><w:pPr><w:pStyle w:val="HatiPaperSign"/></w:pPr>' + R('For Highland Corporate Ltd') + '</w:p>'
      + '<w:p><w:pPr><w:pStyle w:val="Heading2"/></w:pPr>' + R('For the avoidance of doubt') + '</w:p>');
    const a = await win.docxExtract(bytes);
    const b = await win.docxExtractRich(bytes);
    for (const [who, t] of [['the import reader', a.text], ['the upload reader', b.text]]){
      assert.doesNotMatch(t, /Supply Agreement|For Highland/, `${who}: the paper's lines are not wording`);
      assert.match(t, /Invoices are payable in thirty days\./, `${who}: the wording is`);
      assert.match(t, /For the avoidance of doubt/, `${who}: a paragraph in an ordinary style is never skipped`);
    }
  });

  test('screen furniture never reaches the file at all', () => {
    const { win } = stage();
    const xml = win.docxDocumentXml('<section class="rl-clause"><div class="rl-clause-top"><h4>1. Payment</h4>'
      + '<button type="button" class="rl-rung">Step 2</button></div><div class="nego-body"><p>Pay in thirty days.</p></div></section>'
      + '<div class="rl-baseline"><span>Clause 1 = their step 1</span></div>'
      + '<div class="nego-gaps" role="status"><span class="body">Clause 2 was deleted.</span></div>').document;
    assert.match(xml, /Pay in thirty days\./);
    assert.doesNotMatch(xml, /Step 2|their step 1|was deleted/, 'the ladder chip, the baseline line and the gap notice are the screen\'s');
  });
});
