/* ============================================================
   f376 — ONE DOOR TO A STANDARD CONTRACT
   (Young's go on "One Door to Standards", 24 Sep 2026, every decision as
   recommended)

   Four doors made a company standard, each copied the words its own way, and
   the owner's SaaS agreement worked through one and failed through another:
   "Save as template" left all 47 of its tables behind, and the Copilot
   conversion re-typed the whole file and ran out of room.

     1  A TEMPLATE KEEPS THE DOCUMENT IT WAS COPIED FROM. A block may carry the
        document's own markup (`format: 'rich'`) — a heading at its level, the
        paragraphs, lists and TABLES under it — through one allowlist on both
        hosts, rendered verbatim with the blanks substituted.

   Every claim here fails at the parent: the copier, the allowlist and the rich
   block did not exist.

   Run: node --test test/f376-one-door-to-standards.test.js
   ============================================================ */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const TF = require(path.join(ROOT, 'js', 'templateform.js'));
const has = name => typeof TF[name] === 'function';

describe('f376 (1) a template keeps the document it was copied from', () => {
  test('the copier and the allowlist exist, on both hosts', () => {
    for (const n of ['tplFormRichSafe', 'tplFormCopyBlocks', 'tplFormRichText', 'tplFormBlockText', 'tplFormRichReplace', 'tplFormBlockReplace', 'tplFormNumbersOff'])
      assert.ok(has(n), n + ' is exported for the server');
    const src = read('js/templateform.js');
    assert.match(src, /Object\.assign\(window, \{[\s\S]*\.\.\.TPLFORM_RICH_API \}\)/, 'and published for the browser under the same names');
  });

  test('[no drift] the allowlist is the SAME set as js/richdoc.js', () => {
    if (!has('tplFormRichSafe')) return assert.fail('no allowlist');
    const RD = read('js/richdoc.js');
    const tags = /const RICH_TAGS = new Set\(\[([\s\S]*?)\]\)/.exec(RD)[1].match(/'([A-Z0-9]+)'/g).map(x => x.slice(1, -1).toLowerCase());
    assert.deepEqual([...TF.TPLFORM_RICH_TAGS].sort(), tags.sort(), 'tags');
    const shapes = /const RICH_SHAPE_CLASSES = new Set\(\[([\s\S]*?)\]\)/.exec(RD)[1].match(/'([a-z0-9-]+)'/g).map(x => x.slice(1, -1));
    assert.deepEqual([...TF.TPLFORM_SHAPES].sort(), shapes.sort(), 'paragraph shapes');
    const inks = /const RICH_MARK_INKS = \[([^\]]*)\]/.exec(RD)[1].match(/'([a-z]+)'/g).map(x => 'hati-ink-' + x.slice(1, -1));
    const hls = /const RICH_MARK_HLS\s*= \[([^\]]*)\]/.exec(RD)[1].match(/'([a-z]+)'/g).map(x => 'hati-hl-' + x.slice(1, -1));
    const sizes = /const RICH_SIZES\s*= \[([^\]]*)\]/.exec(RD)[1].match(/\d+/g).map(x => 'hati-fs-' + x);
    for (const c of [...inks, ...hls, ...sizes, 'hati-field', 'hati-toc-n', 'hati-wfield', 'hati-field-done'])
      assert.ok(TF.tplFormSpanClassOk(c), c + ' is admitted on a span, as richdoc admits it');
    for (const c of ['hati-ink-green', 'hati-ink-red', 'hati-hl-green', 'evil', 'hati-field hati-ink-blue'])
      assert.ok(!TF.tplFormSpanClassOk(c), c + ' is refused, as richdoc refuses it');
  });

  test('the allowlist REBUILDS: tags off the list go whole, attributes are re-derived', () => {
    if (!has('tplFormRichSafe')) return assert.fail('no allowlist');
    const out = TF.tplFormRichSafe('<p class="hati-lv-2 x" onclick="steal()" style="color:red">A<script>alert(1)</script><img src=x onerror=1>B</p>'
      + '<h2 data-clause-id="cl_abcd1234">Scope</h2><span class="hati-field" data-field-key="counterparty_name" id="z">Party</span>'
      + '<a href="javascript:1">link</a><table><tbody><tr><td colspan="2">cell</td></tr></tbody></table><ol start="3" type="a" reversed><li>x</li></ol>');
    assert.equal(out, '<p class="hati-lv-2">AB</p><h2>Scope</h2><span class="hati-field" data-field-key="counterparty_name">Party</span>'
      + 'link<table><tbody><tr><td>cell</td></tr></tbody></table><ol start="3" type="a"><li>x</li></ol>');
  });

  test('a document becomes blocks WORD FOR WORD — headings, tables and all', () => {
    if (!has('tplFormCopyBlocks')) return assert.fail('no copier');
    const html = '<p><strong>SUPPLY AGREEMENT</strong></p><p>between A and B</p>'
      + '<h1>1\tSCOPE</h1><p>1.1\tThe Supplier shall supply.</p>'
      + '<h2>1.2\t<strong>Delivery</strong></h2><p class="hati-lv-1">(a)\tOn time.</p>'
      + '<h2> </h2>'
      + '<table><tbody><tr><th>Volume</th><th>Price</th></tr><tr><td>30M</td><td>€390,000.00</td></tr></tbody></table>'
      + '<h1>2\tTERM</h1><p>Three years.</p>';
    const blocks = TF.tplFormCopyBlocks(html);
    assert.equal(blocks.map(b => b.content).join(''), html, 'joined back together, the blocks ARE the document');
    assert.ok(blocks.every(b => b.format === 'rich'), 'every block is the document\'s own markup');
    assert.deepEqual(blocks.filter(b => b.blockType === 'heading').map(b => TF.tplFormBlockText(b).replace(/\s+/g, ' ')),
      ['1 SCOPE', '1.2 Delivery', '2 TERM'], 'a heading with no words opens no section');
    assert.equal(blocks[0].blockType, 'fixed_text', 'the front matter is wording before the first section');
    const doc = TF.templateFormDocHtml({ blocks: blocks.map((b, i) => ({ ...b, orderIndex: i })), fields: [], values: {} });
    assert.equal(doc, html, 'rendered, it is the document again — no number added, no table dropped');
  });

  test('a table larger than a block is cut between ROWS, never inside one', () => {
    if (!has('tplFormCopyBlocks')) return assert.fail('no copier');
    const row = i => `<tr><td>row ${i}</td><td>${'x'.repeat(60)}</td></tr>`;
    const table = '<table><tbody><tr><th>A</th><th>B</th></tr>' + Array.from({ length: 40 }, (_, i) => row(i)).join('') + '</tbody></table>';
    const blocks = TF.tplFormCopyBlocks('<h1>Schedule</h1>' + table, { bodyMax: 1200 });
    const bodies = blocks.filter(b => b.blockType !== 'heading');
    assert.ok(bodies.length >= 2, 'the table spans several blocks');
    for (const b of bodies) {
      assert.match(b.content, /^<table><tbody><tr><th>A<\/th><th>B<\/th><\/tr>/, 'each half carries the head row');
      assert.match(b.content, /<\/tbody><\/table>$/, 'and is a whole table');
    }
    const rows = bodies.map(b => (b.content.match(/<td>row \d+<\/td>/g) || []).length).reduce((a, b) => a + b, 0);
    assert.equal(rows, 40, 'no row lost, none repeated');
  });

  test('a copied heading keeps its own number, so HaTi adds none — to any heading', () => {
    if (!has('tplFormNumbersOff')) return assert.fail('no reading');
    const plain = [{ blockType: 'heading', content: 'Agreement', orderIndex: 0 }, { blockType: 'heading', content: 'Term', orderIndex: 1 }];
    assert.match(TF.templateFormDocHtml({ blocks: plain, fields: [], values: {} }), /<h2>1\. Term<\/h2>/, 'a plain template is numbered as before');
    const mixed = plain.concat([{ blockType: 'heading', format: 'rich', content: '<h2>3.4\tFees</h2>', orderIndex: 2 }]);
    const out = TF.templateFormDocHtml({ blocks: mixed, fields: [], values: {} });
    assert.match(out, /<h2>Term<\/h2>/, 'where the document numbers itself, nothing is derived');
    assert.match(out, /<h2>3\.4\tFees<\/h2>/);
  });

  test('a blank is replaced in the WORDS of a rich block, never in its markup', () => {
    if (!has('tplFormRichReplace')) return assert.fail('no replacement');
    const html = '<p class="hati-lv-1">nShift Group A/S &amp; nShift</p><span class="hati-toc-n">nShift</span>';
    const r = TF.tplFormRichReplace(html, 'nShift', '{{supplier}}');
    assert.equal(r.n, 3);
    assert.equal(r.html, '<p class="hati-lv-1">{{supplier}} Group A/S &amp; {{supplier}}</p><span class="hati-toc-n">{{supplier}}</span>');
    assert.equal(TF.tplFormRichReplace('<p class="hati-lv-1">x</p>', 'hati-lv-1', 'Y').n, 0, 'a class name is never wording');
    assert.equal(TF.tplFormRichReplace('<p>Smith &amp; Co</p>', 'Smith & Co', '{{p}}').html, '<p>{{p}}</p>', 'the needle is escaped as the text is');
    const out = TF.templateFormDocHtml({ blocks: [{ blockType: 'field_group', format: 'rich', content: '<p>For {{supplier}}.</p>', orderIndex: 0 }],
      fields: [{ fieldKey: 'supplier', label: 'Supplier name' }], values: {} });
    assert.equal(out, '<p>For <span class="hati-field" data-field-key="supplier">Supplier name</span>.</p>', 'and the blank prints as every blank prints');
  });
});

describe('f376 (1b) the server stores, serves and copies the document\'s own markup', () => {
  const { startHati, seedWorkspace } = require('./helpers');
  let h, w;
  before(async () => { h = await startHati(); w = await seedWorkspace(h); });
  after(async () => { await h.stop(); });

  test('a rich block is written through the allowlist, served with its format, and copied into a new version', async () => {
    const t = await w.admin.json('/api/templates', { method: 'POST', body: { name: 'Copied paper', category: 'procurement', sourceType: 'docx' } });
    const det = await w.admin.json('/api/templates/' + t.template.id);
    const vid = det.versions.find(v => v.status === 'draft').id;
    await w.admin.json(`/api/templates/${t.template.id}/versions/${vid}`, { method: 'PUT', body: { blocks: [
      { orderIndex: 0, blockType: 'heading', format: 'rich', content: '<h2 onclick="x()">1\tScope</h2>' },
      { orderIndex: 1, blockType: 'fixed_text', format: 'rich', content: '<table><tbody><tr><td>30M</td><td>€390,000.00</td></tr></tbody></table><script>x</script>' },
      { orderIndex: 2, blockType: 'fixed_text', content: 'Plain <b>stays</b> plain.' },
      { orderIndex: 3, blockType: 'signature_block', format: 'rich', content: '<p>Company</p>' },
    ], fields: [] } });
    const v = await w.admin.json(`/api/templates/${t.template.id}/versions/${vid}`);
    assert.deepEqual(v.blocks.map(b => [b.blockType, b.format || '', b.content]), [
      ['heading', 'rich', '<h2>1\tScope</h2>'],
      ['fixed_text', 'rich', '<table><tbody><tr><td>30M</td><td>€390,000.00</td></tr></tbody></table>'],
      ['fixed_text', '', 'Plain <b>stays</b> plain.'],
      ['signature_block', '', '<p>Company</p>'],
    ], 'rich where asked and allowed, plain everywhere else — a plain block is not touched');
    assert.equal(det.template.sourceType, 'docx', 'the copier names the kind of file it read');
    await w.admin.json(`/api/templates/${t.template.id}/versions/${vid}/publish`, { method: 'POST', body: {} });
    const nv = await w.admin.json(`/api/templates/${t.template.id}/versions`, { method: 'POST', body: {} });
    const v2 = await w.admin.json(`/api/templates/${t.template.id}/versions/${nv.versionId}`);
    assert.deepEqual(v2.blocks.map(b => b.format || ''), ['rich', 'rich', '', ''], 'a new version keeps the markup');
    const made = await w.admin.json(`/api/templates/${t.template.id}/contracts`, { method: 'POST', body: { folder: 'proc' } });
    assert.match(made.contract.redlineText, /<table><tbody><tr><td>30M<\/td><td>€390,000\.00<\/td><\/tr><\/tbody><\/table>/, 'and a contract drawn from it prints the table');
    assert.match(made.contract.redlineText, /<h2>1\tScope<\/h2>/, 'and the heading at its level, with its own number');
  });
});
