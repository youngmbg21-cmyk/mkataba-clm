/* f366 — THE UPLOADED CONTRACT, FIXED (Young's go, 22 Sep 2026; items A–L)

   A Maersk SaaS agreement uploaded as Word came back with most of its clauses
   drawn as big bold headings, a Plain English column that stayed white, an
   X-ray that dropped the risk scan, an obligations door that landed on an
   empty tab, and three Overview cards out of line. Each section below is one
   item of the list the owner approved, over a drawing of the result.

     A  a heading STYLE is not always a heading — a clause set in "Heading 2"
        with a bold run-in title is a numbered paragraph
     B  a heading-only row that is really wording is read as a clause, and a
        short reading is said in the column's head, not only at its foot
     C  an X-ray quote is matched against the clause's name AND its wording
     D  nothing is dropped: a scan or playbook item that lands nowhere is said
        about the whole contract, worst first; a MATCHING verdict is no mark
     E  the map's segments are sized by the clause's whole words
     F  the obligations tile opens the found list while the tab is empty
     G  every concern carries its reason; the brief asks for it
     H  "About this contract" is shaded a very light red
     I  "Who else is on this agreement" takes the card's own inset
     J  "What Copilot read" stands its head row clear of the card's head
     K  Parties draws one line under its head, not two

   A missing name READS AS EMPTY rather than throwing, so a build without a
   piece reports its claims one at a time. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const D = require('../js/docx.js');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1 ');
const ROOM_RAW = read('js/views/contract.js');
const ROOM = strip(ROOM_RAW);
const AI = strip(read('js/ai.js'));
const SERVER = strip(read('server/server.js'));
const INDEX = read('index.html');
const I18N = read('js/i18n.js');

function region(src, name) {
  const a = src.indexOf('function ' + name + '(');
  if (a < 0) return '';
  const b = src.indexOf('\nfunction ', a + 1);
  return src.slice(a, b > a ? b : src.length);
}

/* ---- a real .docx, written the way Word writes one (f257's own builder) ---- */
function crc32(buf){ let c, t = []; for(let n = 0; n < 256; n++){ c = n;
  for(let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
  let crc = 0 ^ (-1); for(let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ t[(crc ^ buf[i]) & 0xFF];
  return (crc ^ (-1)) >>> 0; }
function zip(files){
  const chunks = [], central = []; let off = 0;
  for(const f of files){
    const name = Buffer.from(f.name, 'utf8'), data = Buffer.from(f.data);
    const comp = zlib.deflateRawSync(data), crc = crc32(data);
    const lh = Buffer.alloc(30); lh.writeUInt32LE(0x04034b50, 0); lh.writeUInt16LE(20, 4);
    lh.writeUInt16LE(8, 8); lh.writeUInt32LE(crc, 14); lh.writeUInt32LE(comp.length, 18);
    lh.writeUInt32LE(data.length, 22); lh.writeUInt16LE(name.length, 26);
    chunks.push(lh, name, comp);
    const ch = Buffer.alloc(46); ch.writeUInt32LE(0x02014b50, 0); ch.writeUInt16LE(20, 4);
    ch.writeUInt16LE(20, 6); ch.writeUInt16LE(8, 10); ch.writeUInt32LE(crc, 16);
    ch.writeUInt32LE(comp.length, 20); ch.writeUInt32LE(data.length, 24);
    ch.writeUInt16LE(name.length, 28); ch.writeUInt32LE(off, 42);
    central.push(ch, name);
    off += lh.length + name.length + comp.length;
  }
  const cd = Buffer.concat(central);
  const e = Buffer.alloc(22); e.writeUInt32LE(0x06054b50, 0); e.writeUInt16LE(files.length, 8);
  e.writeUInt16LE(files.length, 10); e.writeUInt32LE(cd.length, 12); e.writeUInt32LE(off, 16);
  return new Uint8Array(Buffer.concat([...chunks, cd, e]));
}
const R = (t, o) => `<w:r>${o ? `<w:rPr>${o}</w:rPr>` : ''}<w:t xml:space="preserve">${t}</w:t></w:r>`;
const P = (style, runs) => `<w:p><w:pPr>${style ? `<w:pStyle w:val="${style}"/>` : ''}</w:pPr>${runs}</w:p>`;
const doc = inner => '<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/'
  + 'wordprocessingml/2006/main"><w:body>' + inner + '</w:body></w:document>';
/* THE MAERSK SHAPE: the numbering lives on the STYLE, which is how Word numbers
   "every Heading 2 is 1.1, 1.2 …". */
const NUMBERING = '<?xml version="1.0"?><w:numbering xmlns:w="http://schemas.openxmlformats.org/'
  + 'wordprocessingml/2006/main"><w:abstractNum w:abstractNumId="0">'
  + '<w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%1"/></w:lvl>'
  + '<w:lvl w:ilvl="1"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%1.%2"/></w:lvl>'
  + '<w:lvl w:ilvl="2"><w:start w:val="1"/><w:numFmt w:val="lowerLetter"/><w:lvlText w:val="(%3)"/></w:lvl>'
  + '</w:abstractNum><w:num w:numId="6"><w:abstractNumId w:val="0"/></w:num></w:numbering>';
const STY = (id, name, ol, ilvl) => `<w:style w:type="paragraph" w:styleId="${id}"><w:name w:val="${name}"/>`
  + `<w:pPr><w:numPr><w:ilvl w:val="${ilvl}"/><w:numId w:val="6"/></w:numPr><w:outlineLvl w:val="${ol}"/></w:pPr></w:style>`;
const STYLES = '<?xml version="1.0"?><w:styles xmlns:w="http://schemas.openxmlformats.org/'
  + 'wordprocessingml/2006/main">' + STY('Heading1', 'heading 1', 0, 0) + STY('Heading2', 'heading 2', 1, 1)
  + STY('Heading3', 'heading 3', 2, 2) + '<w:style w:styleId="Title"><w:name w:val="Title"/></w:style></w:styles>';
const mk = inner => zip([
  { name: '[Content_Types].xml', data: '<Types/>' },
  { name: 'word/document.xml', data: doc(inner) },
  { name: 'word/numbering.xml', data: NUMBERING },
  { name: 'word/styles.xml', data: STYLES },
]);
const B = '<w:b/>';
const BODY =
  P('Title', R('SOFTWARE AS A SERVICE AGREEMENT')) +
  P('Heading1', R('SCOPE')) +
  /* A clause in Heading 2: a bold run-in title split across Word runs, then wording. */
  P('Heading2', R('Request ', B) + R('for provision', B) + R(' of Services. ', B)
    + R('Each Maersk Group Entity shall be entitled at any time to require the provision of Services.')) +
  /* A short heading in Heading 2 stays a heading. */
  P('Heading2', R('Testing phase')) +
  /* A list item in Heading 3, the sentence ending "; and". */
  P('Heading3', R('this Agreement has been executed by a duly authorised representative; and')) +
  P('Heading1', R('ORDERING AND DELIVERY')) +
  P('Heading2', R('No suspension. ', B) + R('Supplier shall meet its obligation to provide the Services.'));

/* ============================================================================
   A · A HEADING STYLE IS NOT ALWAYS A HEADING
   ==========================================================================*/
describe('f366 (A) a clause set in a heading style is read as a clause', () => {
  test('the reading is one named function, published on both hosts', () => {
    assert.equal(typeof D.docxStyledIsWording, 'function');
    assert.ok(/Object\.assign\(window,\{docxStyledIsWording,/.test(read('js/docx.js')));
  });
  test('a run-in clause, a list sentence and a long heading are wording; a title is not', () => {
    const w = D.docxStyledIsWording || (() => null);
    assert.equal(w('<strong>Non-exclusivity. </strong>This Agreement is of a non-exclusive nature.',
      'Non-exclusivity. This Agreement is of a non-exclusive nature.'), true, 'run-in title then wording');
    assert.equal(w('', 'this Agreement has been executed by a duly authorised representative; and'), true,
      'a list item ending "; and"');
    assert.equal(w('', 'the likely consequences of the personal data breach;'), true, 'a list item ending ";"');
    assert.equal(w('', 'TERM AND TERMINATION'), false, 'a title');
    assert.equal(w('', 'Use of sub-processors'), false, 'a short title');
    assert.equal(w('', '1. Definitions.'), false, 'too short to be wording even with a full stop');
  });
  test('the Maersk shape: the clause becomes a numbered paragraph, the bold stays on its title', async () => {
    const r = await D.docxExtractRich(mk(BODY));
    const h = r.html;
    assert.ok(/<h1>1\tSCOPE<\/h1>/.test(h) || /<h\d>1\tSCOPE<\/h\d>/.test(h), 'the section title is still a heading: ' + h.slice(0, 200));
    assert.ok(/<p[^>]*>1\.1\t<strong>Request <\/strong><strong>for provision<\/strong><strong> of Services\. <\/strong>Each Maersk/.test(h),
      'the clause is a paragraph with its number and only its own title in bold');
    assert.ok(!/<h\d[^>]*>1\.1\tRequest/.test(h), 'and it is not a heading');
    assert.ok(/<h\d>1\.2\tTesting phase<\/h\d>/.test(h), 'a short title in the same style stays a heading');
    assert.ok(/<p class="hati-lv-1">\(a\)\tthis Agreement has been executed/.test(h), h.slice(h.indexOf('(a)')-40, h.indexOf('(a)')+40) ||
      'a list item in Heading 3 is a stepped paragraph');
    assert.ok(/<p[^>]*>2\.1\t<strong>No suspension\. <\/strong>Supplier shall/.test(h));
    assert.equal(r.report.demoted, 3, 'the file strip can count what was read as wording');
  });
  test('[wall] not one character of the text moves — only the markup', async () => {
    const r = await D.docxExtractRich(mk(BODY));
    const plain = await D.docxExtract(mk(BODY));
    const t = typeof plain === 'string' ? plain : (plain && plain.text) || '';
    assert.ok(/1\.1\tRequest for provision of Services\. Each Maersk Group Entity/.test(r.text));
    if (t) assert.ok(t.replace(/\s+/g, ' ').includes('Request for provision of Services. Each Maersk'),
      'the plain reader carries the same words');
  });
});

/* ============================================================================
   B · A HEADING THAT IS A WHOLE CLAUSE IS READ, AND A SHORT READING IS SAID
   ==========================================================================*/
describe('f366 (B) Plain English reads every clause and says when it could not', () => {
  const sheet = region(ROOM, 'docReadSheet');
  test('a heading-only row that is wording is sent WITH its words', () => {
    assert.ok(/if\(row\.isHead&&!text\)\{/.test(sheet), 'asked only of a heading with nothing under it');
    assert.ok(/window\.docxStyledIsWording\(row\.el\.innerHTML,own\)/.test(sheet), 'by the Word reader\'s own measure');
    assert.ok(/if\(wordy\)\{\s*text=own;/.test(sheet), 'its own words become its text, so it is a clause, not a section');
    assert.ok(/heading=_docReadWords\(own\);/.test(sheet), 'the pairing reading is its first words, never the whole clause twice');
  });
  test('a bold title split across Word runs is ONE lead-in', () => {
    const loose = ROOM.slice(ROOM.indexOf('const _docReadBoldLeadLoose=el=>{'), ROOM.indexOf('const _docReadLead=el=>{'));
    assert.ok(/for\(let n=b\.nextSibling;n;n=n\.nextSibling\)/.test(loose), 'adjacent bold runs are joined');
    assert.ok(/\/\^\(STRONG\|B\)\$\/\.test\(n\.tagName\)/.test(loose));
    const lead = ROOM.slice(ROOM.indexOf('const _docReadBoldLead=el=>{'), ROOM.indexOf('const _docReadBoldLeadLoose=el=>{'));
    assert.ok(/at<=num\.length\+3/.test(lead), 'and a title straight after the clause\'s own number counts as its lead-in');
  });
  test('a short reading is said in the head, which is always on screen', () => {
    assert.ok(/doc-read-moved doc-read-short/.test(ROOM_RAW), 'the moved line\'s own slot');
    assert.ok(/:\(partial\|\|over\)\?`<span class="doc-read-moved doc-read-short">/.test(ROOM_RAW));
    const i = ROOM_RAW.indexOf('doc-read-moved doc-read-short');
    assert.ok(/data-doc-read-again/.test(ROOM_RAW.slice(i, i + 400)), 'carrying the same Read again door');
  });
});

/* ============================================================================
   C, D, E, G, H · THE X-RAY — evaluated, not only read
   ==========================================================================*/
function xray() {
  const a = ROOM_RAW.indexOf('const DOC_XRAY_QUOTE_MIN');
  const b = ROOM_RAW.indexOf('function docXrayClauseId(');
  if (a < 0 || b < 0) return null;
  const src = ROOM_RAW.slice(a, b);
  const win = { openFindings: c => c.scan.findings, findingQuote: f => f.quote || '' };
  const f = new Function('window', 'i18t', 'esc', 'openFindings', 'findingQuote',
    src + '\nreturn { docXrayMarks, docXrayWide, docXrayRowText: typeof docXrayRowText==="function"?docXrayRowText:null, docXrayMarkHtml, XR_GRADES };');
  try {
    return f(win, (k, o) => o && o.pos ? k + ':' + o.pos : k, s => String(s), win.openFindings, win.findingQuote);
  } catch (_) { return null; }
}
const X = xray();
const C = {
  scan: { findings: [
    { id: 'f1', sev: 'high', title: 'No right to suspend', why: 'Your only lever in a payment dispute is gone.',
      quote: 'is not entitled to suspend, withhold, discontinue or interrupt the Services' },
    { id: 'f2', sev: 'med', title: 'Governing law abroad', why: 'Disputes are heard far from home.',
      quote: 'governed by the laws of a place this paper never names' } ], dismissed: [] },
  playbook: { verdicts: [
    { category: 'Suspension', status: 'deviation', quote: 'Supplier shall meet its obligation to provide the Services', position: 'Suspend after 30 days unpaid' },
    { category: 'Payment terms', status: 'aligned', quote: 'Payment is due sixty (60) days from receipt', position: '60 days' } ] },
  _brief: { data: {
    watchouts: [{ point: 'The supplier cannot pause service.', why: 'It removes the usual protection.', quote: 'Supplier shall meet its obligation to provide the Services' }],
    unusual: ['Only Maersk may terminate for convenience.',
      { point: 'A change of owner ends the deal.', why: 'A sale could end this contract free.', quote: 'change of Control of Supplier' }] } },
};
/* A heading row that carries the whole clause in its name, as a Word file
   read before item A arrives: the wording is in `heading`, nothing in `text`. */
const HEAD_ROW = { headed: true, heading: '4.3 No suspension. Irrespective of any dispute, Supplier shall meet its obligation to provide the Services and is not entitled to suspend, withhold, discontinue or interrupt the Services.', text: '' };
const PAY_ROW = { headed: false, heading: 'Due payment.', text: '5.6 Due payment. Payment is due sixty (60) days from receipt of a correct invoice.' };

describe('f366 (C, D, E) every concern is placed on its clause or said about the whole contract', () => {
  test('the X-ray block evaluates', () => assert.ok(X, 'the block between DOC_XRAY_QUOTE_MIN and docXrayClauseId runs'));
  test('C · a quote is matched against the clause\'s name AND its wording', () => {
    if (!X) return assert.fail('no X-ray');
    assert.ok(X.docXrayRowText, 'docXrayRowText exists');
    const m = X.docXrayMarks(C, HEAD_ROW);
    assert.ok(m.some(x => x.k === 'scan' && x.grade === 'ruby'), 'the high scan finding lands on the clause whose name carries its words');
    assert.ok(m.some(x => x.k === 'pb'), 'and the playbook departure');
    assert.ok(m.some(x => x.k === 'brief'), 'and the brief watchout');
  });
  test('D · a MATCHING playbook verdict is no mark — the route answers "aligned"', () => {
    if (!X) return assert.fail('no X-ray');
    const m = X.docXrayMarks(C, PAY_ROW);
    assert.equal(m.filter(x => x.k === 'pb').length, 0, 'aligned is not amber');
  });
  test('D · nothing is dropped: an unplaced scan finding is said about the whole contract, worst first', () => {
    if (!X) return assert.fail('no X-ray');
    const wide = X.docXrayWide(C, [{ row: HEAD_ROW }, { row: PAY_ROW }]);
    const scan = wide.filter(x => x.k === 'scan');
    assert.equal(scan.length, 1, 'the finding that landed nowhere is here: ' + JSON.stringify(wide.map(x => x.k)));
    assert.equal(scan[0].lead, 'Governing law abroad');
    assert.ok(!wide.some(x => x.lead === 'No suspension'), 'one that landed is said on its clause, not twice');
    const ranks = wide.map(x => X.XR_GRADES.indexOf(x.grade));
    assert.deepEqual(ranks, [...ranks].sort((a, b) => a - b), 'worst first');
  });
  test('G · an unusual term that carries a quote is placed; a bare one stays about the whole contract', () => {
    if (!X) return assert.fail('no X-ray');
    const row = { headed: false, text: '12.4 Maersk may terminate on a change of Control of Supplier without cost.' };
    const m = X.docXrayMarks(C, row);
    assert.ok(m.some(x => x.k === 'odd' && x.grade === 'steel'), 'placed by its own quote');
    const wide = X.docXrayWide(C, [{ row }]);
    assert.ok(wide.some(x => x.k === 'odd' && x.say === 'Only Maersk may terminate for convenience.'),
      'an older brief\'s bare sentence is still read');
  });
  test('G · every mark carries its reason, drawn under its point', () => {
    if (!X) return assert.fail('no X-ray');
    const m = X.docXrayMarks(C, HEAD_ROW);
    assert.equal(m.find(x => x.k === 'scan').why, 'Your only lever in a payment dispute is gone.');
    assert.equal(m.find(x => x.k === 'brief').why, 'It removes the usual protection.');
    assert.ok(/xr_pb_why/.test(m.find(x => x.k === 'pb').why), 'the playbook\'s reason is your own standard');
    const html = X.docXrayMarkHtml(m[0]);
    assert.ok(/class="doc-xr-why"><b>xr_why<\/b> Your only lever/.test(html), html);
    const bare = X.docXrayMarkHtml({ grade: 'amber', tag: 'Brief', say: 'x', why: '' });
    assert.ok(!/doc-xr-why/.test(bare), 'no reason, no line');
  });
  test('E · the map is sized by the clause\'s whole words', () => {
    assert.ok(/words:_xrWords\(docXrayRowText\(r\)\)/.test(ROOM));
  });
  test('H · "About this contract" is shaded a very light red, in both themes', () => {
    assert.ok(/wide\.map\(docXrayMarkHtml\)\.join\(''\),'is-wide'\)/.test(ROOM), 'the section carries the class');
    const rule = INDEX.slice(INDEX.indexOf('.doc-xr-sec.is-wide{'), INDEX.indexOf('.doc-xr-sec.is-wide{') + 300);
    assert.ok(/background:color-mix\(in srgb,var\(--st-ruby-bg\) 55%,var\(--color-surface\)\)/.test(rule),
      'mixed from the ruby wash and the surface, so the night theme answers');
  });
});

/* ============================================================================
   F · THE OBLIGATIONS DOOR FOLLOWS THE TAB
   ==========================================================================*/
describe('f366 (F) the obligations tile opens the found list while the tab is empty', () => {
  const src = region(ROOM_RAW, 'obTileOpensReview');
  const run = (c, held, runFn) => {
    if (!src) return null;
    const window = { triageHeldObligations: () => held, runFindObligations: runFn };
    const f = new Function('window', 'triageHeldObligations', src + '\nreturn obTileOpensReview;');
    return f(window, window.triageHeldObligations)(c);
  };
  test('empty tab, a held reading → the list', () => assert.equal(run({ obligations: [] }, [{ description: 'x' }], () => {}), true));
  test('the tab has obligations → the tab', () => assert.equal(run({ obligations: [{ id: 1 }] }, [{ description: 'x' }], () => {}), false));
  test('nothing held → the tab, never a second paid scan', () => assert.equal(run({}, [], () => {}), false));
  test('the press asks the one reading and presses the one funnel', () => {
    const i = ROOM.indexOf("if(go==='oblig'){");
    assert.ok(i > 0);
    assert.ok(/if\(obTileOpensReview\(c\)\)\{ runFindObligations\(c\); return; \}/.test(ROOM.slice(i, i + 200)));
  });
});

/* ============================================================================
   G · THE BRIEF ASKS FOR THE REASON, AND READS BOTH SHAPES
   ==========================================================================*/
describe('f366 (G) the brief carries a reason for every concern', () => {
  const i = SERVER.indexOf("name: 'contract_brief'");
  const schema = SERVER.slice(SERVER.lastIndexOf('watchouts:', i + 4000), SERVER.lastIndexOf('watchouts:', i + 4000) + 1500);
  test('a watchout and an unusual term each REQUIRE a why', () => {
    assert.ok(/required: \['point', 'why'\] \} \},\s*unusual:/.test(schema), 'watchouts');
    assert.ok(/unusual: \{ type: 'array', maxItems: 4, items: \{ type: 'object'/.test(schema), 'unusual is an object now');
    assert.ok(/quote: \{ type: 'string', description: 'Short verbatim snippet of the wording it rests on/.test(schema),
      'and carries a quote so it can be placed');
  });
  test('the prompt says so, and the ceiling grew by the schema\'s own arithmetic', () => {
    assert.ok(/add one plain sentence saying WHY it is worth a look/.test(SERVER));
    assert.ok(/max_tokens: 6000, tools: \[tool\], tool_choice: \{ type: 'tool', name: 'contract_brief' \}/.test(SERVER));
  });
  test('the brief panel reads a bare string AND an object, and prints the reason', () => {
    const r = region(AI, 'renderBriefSection');
    assert.ok(/const o=\(typeof u==='object'\)\?u:\{point:String\(u\)\};/.test(r), 'both shapes');
    assert.ok(/whyLine\(w\.why\)/.test(r) && /whyLine\(o\.why\)/.test(r), 'the reason under each');
  });
  test('both books carry the new words', () => {
    ['xr_why', 'xr_pb_departs', 'xr_pb_missing', 'xr_pb_why'].forEach(k =>
      assert.equal((I18N.match(new RegExp('\\b' + k + ':', 'g')) || []).length, 2, k + ' in English and Swedish'));
  });
});

/* ============================================================================
   I, J, K · THE THREE OVERVIEW CARDS
   ==========================================================================*/
describe('f366 (I, J, K) the Overview cards line up', () => {
  test('I · "Who else" takes the card\'s own inset', () => {
    assert.ok(/body:`<div class="sec-body"><div id="kt-people">\$\{people\}<\/div>\$\{ovAddressBookHtml\(addrs\)\}<\/div>`/.test(ROOM));
  });
  test('J · "What Copilot read" stands its head row 14px clear of the card head', () => {
    assert.ok(/\.ov-reads\{ width:100%; border-collapse:collapse; margin:14px 0 4px;/.test(INDEX));
  });
  test('K · Parties draws one line under its head', () => {
    assert.ok(/\.py-rows > \.py-row:first-child\{ border-top:0; \}/.test(INDEX));
  });
});
