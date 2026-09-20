/* f343 — A WORD FILL-IN FIELD IS A BLANK
   ============================================================
   Young, 20 September 2026: *"Merge all to main then Build the last item."*
   The last item is item 9's third shape. The artifact the owner approved said
   HaTi would learn to recognise another firm's blanks — *"brackets,
   underscores, a shaded Word field"* — and the build of 20 September delivered
   the first two. This is the third.

   MEASURED BEFORE A LINE MOVED, on a real .docx: a FORMTEXT field and a
   content control both arrive as ordinary sentence text —
   `"This Agreement is made with Enter buyer name of Click or tap here to enter
   text.."` — because both readers keep the field's RESULT and drop everything
   that says it is a field. Nothing downstream could tell a gap from a
   sentence, so the blanks reader found none, and the prompt read as if it were
   the contract's own wording.

   THE FILE IS WHAT KNOWS. There is no pattern in the characters to find:
   `Enter buyer name` is indistinguishable from drafting. So the fact is
   carried from the reader, in a span that changes no character and admits
   nothing open-ended beyond the drafter's own name for the gap, in exactly the
   machine-safe shape `data-field-key` already takes.

   THE WALLS THIS FILE PINS, and each one is a way the change could have gone
   wrong quietly:
     · THE TEXT DOES NOT MOVE. The two readers still project the same string,
       and marking a field moves the stored body's own projection by nothing.
     · ONLY AN UNANSWERED FIELD IS A BLANK. A field somebody filled in is their
       wording and is left exactly as it arrived.
     · THE PAPER'S OWN SPAN IS NEVER UNWRAPPED by the painter that marks it.

   WHAT IS MEASURED IN A BROWSER INSTEAD (upload-blanks-verify section 8): that
   the field is really painted on the page, that the panel really lists it, and
   that the contract does not move a pixel.

   Run: node --test test/f343-a-word-fill-in-field.test.js */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const { buildWorld } = require('./world');

const ROOT = path.join(__dirname, '..');
const read = f => { try{ return fs.readFileSync(path.join(ROOT, f), 'utf8'); }catch(_){ return ''; } };
const strip = t => t.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1 ');
const DOCX = read('js/docx.js');
const DOCX_CODE = strip(DOCX);
const RICH = read('js/richdoc.js');
const RICH_CODE = strip(RICH);
const UB_CODE = strip(read('js/uploadblanks.js'));
const CONTRACT_CODE = strip(read('js/views/contract.js'));

const fnBody = (src, name) => {
  const m = new RegExp('function\\s+' + name + '\\s*\\([^)]*\\)\\s*\\{').exec(src);
  if (!m) return null;
  let i = m.index + m[0].length, depth = 1;
  while (i < src.length && depth > 0) {
    const ch = src[i];
    if (ch === '{') depth++; else if (ch === '}') depth--;
    i++;
  }
  return src.slice(m.index, i);
};

/* ---- a REAL .docx, written the way Word writes one ---- */
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
const T = t => `<w:r><w:t xml:space="preserve">${t}</w:t></w:r>`;
/* A legacy form field, exactly as Word writes one: begin (carrying the ffData
   that names it and holds its default), the field code, separate, the RESULT
   runs, end. */
const FIELD = (name, def, result, kind) =>
  `<w:r><w:fldChar w:fldCharType="begin"><w:ffData><w:name w:val="${name}"/><w:enabled/>`
  + `${kind === 'check' ? '<w:checkBox><w:default w:val="0"/></w:checkBox>'
     : kind === 'ddl' ? '<w:ddList><w:listEntry w:val="A"/></w:ddList>'
     : `<w:textInput><w:default w:val="${def}"/></w:textInput>`}`
  + `</w:ffData></w:fldChar></w:r>`
  + `<w:r><w:instrText xml:space="preserve"> FORMTEXT </w:instrText></w:r>`
  + `<w:r><w:fldChar w:fldCharType="separate"/></w:r>`
  + T(result)
  + `<w:r><w:fldChar w:fldCharType="end"/></w:r>`;
/* A content control. `showingPlcHdr` is Word's own statement that nobody has
   answered it; without it the content is an answer. */
const SDT = (alias, showing, text) =>
  `<w:sdt><w:sdtPr><w:alias w:val="${alias}"/><w:tag w:val="t"/>`
  + `${showing ? '<w:showingPlcHdr/>' : ''}<w:text/></w:sdtPr>`
  + `<w:sdtContent>${T(text)}</w:sdtContent></w:sdt>`;
const docXml = inner => '<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/'
  + 'wordprocessingml/2006/main"><w:body>' + inner + '</w:body></w:document>';
const mk = inner => zip([
  { name: '[Content_Types].xml', data: '<Types/>' },
  { name: 'word/document.xml', data: docXml(inner) },
]);

const NB = '     ';
/* One paragraph carrying every case at once: an unanswered field with a
   prompt, a control showing its placeholder, an ANSWERED field, an empty
   field, and an ANSWERED control. */
const FORM = '<w:p>' + T('This Agreement is made with ')
  + FIELD('BuyerName', 'Enter buyer name', 'Enter buyer name')
  + T(' of ') + SDT('Registered Address', true, 'Click or tap here to enter text.')
  + T('.') + '</w:p>'
  + '<w:p>' + T('The Seller is ') + FIELD('Seller', 'Enter seller', 'Acme Trading Ltd')
  + T(' and the fee is ') + FIELD('Fee', '', NB) + T('.') + '</w:p>'
  + '<w:p>' + T('Governed by ') + SDT('Law', false, 'the laws of Kenya') + T('.') + '</w:p>';

const D = require('../js/docx.js');
const world = () => buildWorld({ blanks: true, templates: true }).win;
const CLS = 'hati-wfield';
/* EVERY CLAIM AN UNMARKED DOCUMENT WOULD SATISFY IS GATED. Against the commit
   before this work nothing is marked at all, so "an answered field is not
   marked" and "the record guessed nothing" are true of a reader that marks
   nothing anywhere — a green tally is not a net. The claims that are genuinely
   CONTROLS, walls that were already standing and must not break, say so in
   their own name. */
const gateMarked = html => assert.ok(html.includes(CLS),
  'STAGE: the reader marked nothing at all, so nothing below could bite');

describe('f343 (1) the reader marks a gap the file states', () => {
  test('1a an unanswered form field is marked', async () => {
    const r = await D.docxExtractRich(mk(FORM));
    assert.match(r.html, new RegExp('<span class="' + CLS + '"[^>]*>Enter buyer name</span>'), r.html);
  });
  test('1b a content control showing its placeholder is marked', async () => {
    const r = await D.docxExtractRich(mk(FORM));
    assert.match(r.html, new RegExp('<span class="' + CLS + '"[^>]*>Click or tap here to enter text\\.</span>'), r.html);
  });
  test('1c AN ANSWERED FIELD IS THEIR WORDING and is not marked', async () => {
    const r = await D.docxExtractRich(mk(FORM));
    gateMarked(r.html);
    assert.ok(!/<span[^>]*>Acme Trading Ltd</.test(r.html), 'a filled form field was marked: ' + r.html);
    assert.ok(!/<span[^>]*>the laws of Kenya</.test(r.html), 'a filled control was marked: ' + r.html);
    assert.match(r.html, /Acme Trading Ltd/, 'and the words are still there');
    assert.match(r.html, /the laws of Kenya/);
  });
  test('1d an empty field is a gap, padding and all', async () => {
    const r = await D.docxExtractRich(mk(FORM));
    assert.match(r.html, new RegExp('<span class="' + CLS + '"[^>]*>' + NB + '</span>'), r.html);
  });
  test('1e a TICK BOX or a DROPDOWN is not a gap for wording', async () => {
    /* GATED on the same shape with a TEXT input really being marked, or this
       is true of a reader that marks nothing. */
    gateMarked((await D.docxExtractRich(mk('<w:p>' + T('Name: ') + FIELD('N', 'Enter', 'Enter') + '</w:p>'))).html);
    for(const kind of ['check', 'ddl']){
      const r = await D.docxExtractRich(mk('<w:p>' + T('Tick: ') + FIELD('Opt', '', 'X', kind) + '</w:p>'));
      assert.ok(!r.html.includes(CLS), kind + ' was marked: ' + r.html);
    }
  });
  test('1f the file\'s own name for the gap rides with it', async () => {
    const r = await D.docxExtractRich(mk(FORM));
    assert.match(r.html, /data-wfield="buyer_name"/, r.html);
    assert.match(r.html, /data-wfield="registered_address"/, r.html);
  });
  test('1g they are counted, and a count is what makes the body worth storing', async () => {
    const r = await D.docxExtractRich(mk(FORM));
    assert.equal(r.report.fields, 3, JSON.stringify(r.report));
    const has = fnBody(CONTRACT_CODE, 'docxHasStructure');
    assert.ok(has && /rep\.fields/.test(has),
      'a Word FORM is plain paragraphs with grey boxes — without this it stores no body');
  });
});

describe('f343 (2) THE TEXT DOES NOT MOVE', () => {
  test('2a CONTROL — the two readers still project the same string, byte for byte', async () => {
    const bytes = mk(FORM);
    const rich = await D.docxExtractRich(bytes);
    const flat = await D.docxExtract(bytes);
    assert.equal(rich.text, flat.text,
      'the wall f257 states, and the one the Word round trip rests on');
  });
  test('2b CONTROL — and the text still carries the empty box\'s own padding', async () => {
    const rich = await D.docxExtractRich(mk(FORM));
    assert.ok(rich.text.includes(NB), 'the empty box\'s own characters: ' + JSON.stringify(rich.text));
  });
  test('2c MARKING A FIELD MOVES THE STORED PROJECTION BY NOTHING', () => {
    const w = world();
    const marked = '<p>the fee is <span class="' + CLS + '" data-wfield="fee">' + NB + '</span>.</p>';
    const bare = '<p>the fee is ' + NB + '.</p>';
    /* GATED: with the span unwrapped the two sides are the same string by
       construction and this claim says nothing. */
    assert.ok(w.sanitizeRich(marked).includes(CLS), 'STAGE: the mark did not survive storage');
    assert.equal(w.richToText(w.sanitizeRich(marked)), w.richToText(w.sanitizeRich(bare)));
  });
  test('2d CONTROL — only `html` is wrapped; the reader never writes into `text`', () => {
    const b = fnBody(DOCX_CODE, 'docxRunsHtml');
    assert.ok(b, 'docxRunsHtml not found');
    assert.ok(!/text\s*=\s*text\.slice|text\s*\+=\s*'<span/.test(b),
      'the text projection must not learn about the span');
  });
});

describe('f343 (3) the record admits the fact and nothing open-ended', () => {
  test('3a the class survives the sanitiser', () => {
    const w = world();
    const out = w.sanitizeRich('<p>a <span class="' + CLS + '">x</span> b</p>');
    assert.match(out, new RegExp('class="' + CLS + '"'), out);
  });
  test('3b the name survives ONLY in the machine-safe shape', () => {
    const w = world();
    assert.match(w.sanitizeRich('<p><span class="' + CLS + '" data-wfield="buyer_name">x</span></p>'),
      /data-wfield="buyer_name"/);
    /* A quote cannot reach an attribute value at all — the parser ends the
       value at it — so the cases here are the ones that CAN arrive: a space, a
       hyphen, markup, a leading digit, nothing, and one over the length. */
    for(const bad of ['Buyer Name', 'a-b', '<script>', '9x', '', 'x'.repeat(70)]){
      const out = w.sanitizeRich('<p><span class="' + CLS + '" data-wfield="' + bad + '">x</span></p>');
      assert.ok(!/data-wfield=/.test(out), JSON.stringify(bad) + ' survived: ' + out);
    }
  });
  test('3c and only on ITS OWN span, never on another', () => {
    const w = world();
    /* GATED on it surviving where it belongs, or "it does not survive here" is
       true of a build that admits it nowhere. */
    assert.match(w.sanitizeRich('<p><span class="' + CLS + '" data-wfield="buyer_name">x</span></p>'),
      /data-wfield="buyer_name"/, 'STAGE: the attribute is admitted nowhere');
    const out = w.sanitizeRich('<p><span class="hati-field" data-wfield="buyer_name">x</span></p>');
    assert.ok(!/data-wfield=/.test(out), out);
  });
  test('3d IT IS NOT hati-field — one class with two meanings is drift', () => {
    assert.ok(/RICH_WFIELD_CLASS\s*=\s*'hati-wfield'/.test(RICH_CODE));
    assert.ok(/RICH_FIELD_CLASS\s*=\s*'hati-field'/.test(RICH_CODE));
  });
  test('3e AN EMPTY FIELD IS NOT NOISE — its span and its padding both survive', () => {
    const w = world();
    const out = w.sanitizeRich('<p>a <span class="' + CLS + '" data-wfield="fee">' + NB + '</span> b</p>');
    assert.match(out, new RegExp('class="' + CLS + '"'), 'the span was removed as empty: ' + out);
    const doc = w.document.createElement('div'); doc.innerHTML = out;
    assert.equal((doc.querySelector('span.' + CLS).textContent || '').length, NB.length,
      'the padding was stripped: ' + out);
  });
});

describe('f343 (4) the panel reads it', () => {
  const stage = (body, over) => {
    const w = world();
    const c = Object.assign({ id: 'MK-950', name: 'Form', status: 'Under Review', source: 'upload',
      format: 'rich', redlineText: body, fields: {}, audit: [], metadata: {},
      upload: { fileName: 'form.docx', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
    }, over || {});
    w.state = w.state || { contracts: [], settings: {} };
    w.state.contracts = [c]; w.state.activeId = c.id;
    return { w, c };
  };
  const BODY = '<h4>1. Parties</h4><p>Made with <span class="' + CLS + '" data-wfield="buyer_name">Enter buyer name</span>'
    + ' of <span class="' + CLS + '" data-wfield="registered_address">Click or tap here to enter text.</span>.</p>'
    + '<h4>2. Fee</h4><p>The fee is <span class="' + CLS + '" data-wfield="fee">' + NB + '</span>.</p>';

  test('4a every field is a blank', () => {
    const { w, c } = stage(BODY);
    const ks = w.contractBlanks(c).map(b => b.key);
    assert.equal(ks.join(','), 'up_buyer_name,up_registered_address,up_fee', ks.join(','));
  });
  test('4b THE DRAFTER\'S OWN NAME LEADS, and it reads as words', () => {
    const { w, c } = stage(BODY);
    const by = k => w.contractBlanks(c).find(b => b.key === k);
    assert.equal(by('up_buyer_name').label, 'Buyer name');
    assert.equal(by('up_registered_address').label, 'Registered address');
    assert.equal(by('up_fee').label, 'Fee');
  });
  test('4c the PROMPT is what the box shows, never the label', () => {
    const { w, c } = stage(BODY);
    assert.equal(w.contractBlanks(c).find(b => b.key === 'up_buyer_name').ph, 'Enter buyer name');
  });
  test('4d WORD\'S OWN PROMPT IS NOT A NAME', () => {
    const w = world();
    assert.equal(w.upStockPrompt('Click or tap here to enter text.'), true);
    assert.equal(w.upStockPrompt('CLICK HERE TO ENTER TEXT'), true);
    assert.equal(w.upStockPrompt('Enter the buyer\'s registered address'), false,
      'a prompt the drafter wrote is a name');
    /* Unnamed and stock-prompted: it falls to the ruled line\'s own rule rather
       than giving every gap in the document one key. */
    const { w: w2, c } = stage('<p>Delivery address: <span class="' + CLS + '">Click or tap here to enter text.</span></p>');
    const b = w2.contractBlanks(c)[0];
    assert.ok(b && b.key !== 'up_click_or_tap_here_to_enter_text', b && b.key);
    assert.equal(b.label, 'Delivery address', b.label);
  });
  test('4e a field is ONE unit — its words are never read twice', () => {
    const { w, c } = stage(BODY);
    const seq = w.uploadBlankSeq(c).map(x => x.key);
    assert.equal(seq.length, 3, seq.join(','));
    assert.equal(new Set(seq).size, 3);
  });
  test('4f it is still kind:"upload", so the record never guesses one', () => {
    const { w, c } = stage(BODY);
    const bs = w.contractBlanks(c);
    assert.ok(bs.length >= 3, 'STAGE: the fields were not read as blanks at all');
    for(const b of bs) assert.equal(b.kind, 'upload', b.key);
    assert.equal(w.fillBlanksFromRecord(c, { hold: true }).filled.length, 0);
  });
  test('4g answering one leaves the wording byte-identical', () => {
    const { w, c } = stage(BODY);
    w.contractBlankSet(c, 'up_fee', 'KES 900,000', { hold: true });
    assert.equal(c.redlineText, BODY, 'the received document was rewritten');
    assert.equal(w.contractBlanksOpen(c).length, 2);
  });
  test('4h ONE READING, BOTH WALKS — the read and the paint ask upNodeHits', () => {
    assert.ok(/function upNodeHits/.test(UB_CODE), 'upNodeHits not found');
    const walk = fnBody(UB_CODE, 'upWalk');
    const paint = fnBody(UB_CODE, 'uploadBlanksPaint');
    assert.ok(walk && /upNodeHits\(/.test(walk), 'the read does not ask it');
    assert.ok(paint && /upNodeHits\(/.test(paint), 'the paint does not ask it');
  });
});

describe('f343 (5) the paper\'s own span is never unwrapped', () => {
  test('5a the painter marks a field IN PLACE', () => {
    const p = fnBody(UB_CODE, 'uploadBlanksPaint');
    assert.ok(p, 'not found');
    assert.ok(/if\(field\)/.test(p.replace(/\s+/g, '')), 'no branch for a field the paper owns');
    assert.ok(/UP_MADE_ATTR/.test(p), 'the painter must say which spans are its own');
  });
  test('5b and the clear gives it back rather than unwrapping it', () => {
    const cl = fnBody(UB_CODE, 'uploadBlanksClear');
    assert.ok(cl, 'not found');
    assert.ok(/hasAttribute\(UP_MADE_ATTR\)/.test(cl),
      'unwrapping the paper\'s own span deletes a fact the document carries');
  });
  test('5c CONTROL — NO ROUTE, NO STORE, NO MODEL in the reader', () => {
    assert.ok(UB_CODE.length > 500, 'STAGE: js/uploadblanks.js is missing');
    for(const bad of [/\bapi\s*\(/, /\bfetch\s*\(/, /\bpersist\s*\(/, /copilot/i, /anthropic/i])
      assert.ok(!bad.test(UB_CODE), 'js/uploadblanks.js reaches for ' + bad);
  });
  test('5d the two files agree about the class by READING it, never by typing it twice', () => {
    assert.ok(/RICH_WFIELD_CLASS/.test(UB_CODE), 'uploadblanks must read the published name');
    assert.ok(/RICH_WFIELD_CLASS/.test(RICH.slice(RICH.indexOf('Object.assign(window'))),
      'and richdoc must publish it');
  });
});
