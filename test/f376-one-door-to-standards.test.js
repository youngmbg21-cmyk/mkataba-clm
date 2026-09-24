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

/* ============================================================
   f376 (2)–(6) — ONE DOOR, THREE STARTS, COPILOT'S FIRST MOVE, THE HEAD
   (Young's go on "One Door to Standards", 24 Sep 2026, every decision as
   recommended: Make it ours is a shortcut into "From a template you have";
   Publish asks once, naming each open item as a door; suggested blanks arrive
   UNTICKED; the button is "+ New standard contract"; the name, category and
   value stream are at the top of the builder, changeable any time.)

   A small REAL page (jsdom) carries the claims that are about what a reader
   is shown, because the blank finder and the builder's head walk a DOM and a
   stand-in that answers "nothing" would pass them for the wrong reason. Every
   claim below fails at the commit before this part of the feature
   (3e8252f): the chooser, the head, the publish question and the first moves
   did not exist, and the four repairs found by driving them (a HaTi
   template's own blanks offered back, the liability clause proposed twice, a
   missing standard listed twice, the outline's read not counted) are each
   pinned where they were found.
   ============================================================ */
const vm = require('node:vm');
const { JSDOM } = require('jsdom');
const { runFileInContext } = require('./vmcache');
const NS_SRC = (() => { try { return read('js/views/newstandard.js'); } catch (_) { return ''; } })();
const TB_SRC = read('js/views/templatebuilder.js');
const LIB_SRC = read('js/views/library.js');
const TL_SRC = read('js/views/templatelib.js');

/* A function's own body, found by name and cut at the first line that closes
   it — PIN THE REGION, NOT A BYTE COUNT. '' where the function is absent, so
   a claim fails on its own rather than taking the file down with it. */
const bodyOf = (src, name) => {
  const m = new RegExp('(?:async )?function ' + name + '\\(').exec(src);
  if (!m) return '';
  const end = src.indexOf('\n}\n', m.index);
  return src.slice(m.index, end > m.index ? end + 2 : m.index + 4000);
};

/* The page. `files` are the product's own, evaluated in js/app.js order after
   the dictionary; `globals` are the shell the running app would provide. */
function page(files, globals = {}) {
  const dom = new JSDOM('<!doctype html><html><body><div id="content-scroll"><div id="content"></div></div><div id="modal-root"></div></body></html>',
    { runScripts: 'outside-only', pretendToBeVisual: true, url: 'https://hati.test/' });
  const win = dom.window;
  const timers = [];
  win.setTimeout = fn => { timers.push(fn); return timers.length; };
  win.clearTimeout = () => {};
  win.setInterval = () => 0; win.clearInterval = () => {};
  const log = { toasts: [], modals: [], api: [], design: 0 };
  Object.assign(win, {
    esc: s => String(s == null ? '' : s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch])),
    icon: n => `<svg data-i="${n}"></svg>`,
    toast: (m, k) => { log.toasts.push([String(m), k]); },
    openModal: (html, opts) => { log.modals.push({ html, opts: opts || {} }); win.document.getElementById('modal-root').innerHTML = `<div role="dialog">${html}</div>`; },
    closeModal: () => { win.document.getElementById('modal-root').innerHTML = ''; },
    confirmDialog: async () => true,
    state: { contracts: [], settings: {}, aiConfigured: true, view: 'templates' },
    API_MODE: () => true, canEdit: () => true, isAdmin: () => true,
    currentUser: () => ({ id: 'u1', name: 'Amina Otieno', role: 'admin' }),
    copilotAvailable: () => true,
    openDesignStep: () => { log.design++; },
    setView: () => {},
    ...globals,
  });
  const ctx = dom.getInternalVMContext();
  for (const f of ['js/i18n.js', 'js/jurisdiction.js', 'js/section.js'].concat(files)) runFileInContext(path.join(ROOT, f), ctx, f);
  win.__log = log;
  win.__run = code => vm.runInContext(code, ctx);
  /* Deferred work runs when the test says so — the frame's own focus first,
     then whatever was queued after it, exactly the order the browser keeps. */
  win.__tick = () => { while (timers.length) { const fn = timers.shift(); try { fn(); } catch (_) {} } };
  return win;
}

/* A template on the stand-in server. `blocks` are [type, content, format?]. */
const BUILDER_FILES = ['js/fieldlib.js', 'js/clausemodel.js', 'js/playbook.js', 'js/uploadblanks.js', 'js/templateform.js', 'js/views/templatebuilder.js'];
function builderPage({ blocks = [], fields = [], template = {}, ai = null, globals = {} } = {}) {
  const t = { id: 'tpl_1', name: 'Software as a Service Agreement', category: 'other', folder: null, ...template };
  const win = page(BUILDER_FILES, {
    api: async (p, method, body) => {
      win.__log.api.push([p, method || 'GET', body]);
      if (p === 'templates/tpl_1' && method === 'PATCH') { Object.assign(t, body); return { ok: true, template: { ...t } }; }
      if (p === 'templates/tpl_1') return { template: { ...t } };
      if (p === 'templates/tpl_1/versions/tv_1' && method === 'PUT') return { ok: true };
      if (p === 'templates/tpl_1/versions/tv_1') return { version: { versionNumber: 1, status: 'draft' },
        blocks: blocks.map((b, i) => ({ orderIndex: i, blockType: b[0], content: b[1], ...(b[2] ? { format: b[2] } : {}) })),
        fields: fields.map((k, i) => ({ field_key: k, label: k, order_index: i, field_type: 'short_text', control: 'free' })) };
      if (p === 'org/branding') return { branding: { logoUrl: null, companyName: 'Highland Corporate Ltd', registrationNumber: '', address: '', defaultFooterText: '' } };
      if (p === 'ai/blanks') return ai ? ai(body) : { items: [] };
      throw new Error('unexpected api call: ' + p);
    },
    ...globals,
  });
  return win;
}
const settle = () => new Promise(r => setImmediate(r));

describe('f376 (2) one button, one question, three starts', () => {
  test('the chooser is its own module, loaded by the app right after the builder, and published', () => {
    assert.ok(NS_SRC.length > 0, 'js/views/newstandard.js exists');
    const APP = read('js/app.js');
    const b = APP.indexOf("import './views/templatebuilder.js'"), n = APP.indexOf("import './views/newstandard.js'");
    assert.ok(b > 0 && n > b, 'imported after the builder it opens');
    assert.match(NS_SRC, /Object\.assign\(window, \{[^}]*\bopenNewStandard\b/, 'and published');
  });

  test('ONE question with THREE answers, in the drawing’s order, and no filled verb on a question', () => {
    const win = page(['js/views/newstandard.js']);
    assert.deepEqual([...win.NS_STARTS].map(s => s.k), ['scratch', 'template', 'contract']);
    win.openNewStandard();
    const root = win.document.getElementById('modal-root');
    assert.deepEqual([...root.querySelectorAll('[data-ns-start]')].map(b => b.getAttribute('data-ns-start')), ['scratch', 'template', 'contract']);
    assert.equal(root.querySelector('h3').textContent.trim(), win.i18t('ns_title'));
    assert.equal(root.querySelectorAll('.ui-btn-primary').length, 0, 'a question carries no filled verb');
    assert.ok(root.querySelector('#ns-cp'), 'the other side’s paper keeps a quiet link at the foot, not a fourth tile');
    assert.ok(root.querySelector('#ns-close'), 'and Cancel');
  });

  test('WHO MAY START: without the new-paper grant the two new-paper starts are GREYED with the reason; the contract start is not', () => {
    const win = page(['js/views/newstandard.js'], { newPaperBlocked: () => true });
    win.openNewStandard();
    const tile = k => win.document.querySelector(`[data-ns-start="${k}"]`);
    for (const k of ['scratch', 'template']) {
      assert.ok(tile(k).disabled, k + ' is greyed');
      assert.equal(tile(k).getAttribute('title'), win.i18t('np_refused_ask'), k + ' says why on its hover');
    }
    assert.ok(!tile('contract').disabled, 'starting from one of our contracts keeps its own gate — the template manager’s');
  });

  test('a door that names a start goes straight to it: Make it ours lands on HaTi’s tab with the template chosen', () => {
    const win = page(['js/views/newstandard.js'], {
      TEMPLATES: { RM: { id: 'RM', name: 'Raw Material Supply Agreement', folder: 'proc', kind: 'Supply' }, ND: { id: 'ND', name: 'Mutual NDA', folder: 'sales', kind: 'NDA' } },
      FOLDERS: { proc: { name: 'Procurement & Raw Materials' }, sales: { name: 'Sales' } },
    });
    win.openNewStandard({ start: 'template', tab: 'hati', pick: 'RM' });
    const root = win.document.getElementById('modal-root');
    assert.equal(root.querySelector('[data-ns-tab].on').getAttribute('data-ns-tab'), 'hati', 'HaTi’s own tab is lit');
    assert.equal(root.querySelector('[data-ns-hati].on').getAttribute('data-ns-hati'), 'RM', 'and the template is already chosen');
    assert.ok(!root.querySelector('#ns-go').disabled, 'so one press makes the copy');
    win.closeModal();
    win.openNewStandard({ start: 'scratch', said: 'A carrier agreement' });
    assert.equal(win.document.getElementById('ns-say-box').value, 'A carrier agreement', 'and the scratch start keeps a sentence it was handed');
  });

  test('the Templates page has ONE create button — "+ New standard contract" (decision 4) — and Convert a document is not beside it', () => {
    const { STRINGS } = require(path.join(ROOT, 'js', 'i18n.js'));
    assert.equal(STRINGS.en.lib_new_template, '+ New standard contract');
    assert.ok(STRINGS.sv.lib_new_template && STRINGS.sv.lib_new_template !== STRINGS.en.lib_new_template, 'in both books');
    assert.equal((LIB_SRC.match(/id="tpl-new"/g) || []).length, 1, 'one create button');
    assert.ok(!/id="tpl-convert"/.test(LIB_SRC), 'no Convert a document beside it');
    assert.match(LIB_SRC, /getElementById\('tpl-new'\)\?\.addEventListener\('click',tplNewMenu\)/);
    assert.match(bodyOf(LIB_SRC, 'tplNewMenu'), /return openNewStandard\(\)/, 'and it opens the one question');
  });

  test('Make it ours is a SHORTCUT into the door (decision 1) — it makes no template of its own', () => {
    const b = bodyOf(LIB_SRC, 'tplMakeItOurs');
    assert.match(b, /return openNewStandard\(\{ start:'template', tab:'hati', pick:bid \}\)/);
    assert.ok(!/api\('templates','POST'/.test(b) && !/openTemplateBuilder/.test(b), 'the copy is made by the start, where every copy is made');
  });

  test('"Save as template" left the contract’s menu on BOTH pages, and its dialog is gone', () => {
    assert.ok(!/id="ws-tpl"/.test(read('js/views/contract.js')), 'the room’s ⋯ menu');
    assert.ok(!/headAct\('ws-tpl'/.test(read('js/views/negotiation.js')), 'the negotiate page’s own handler');
    for (const f of ['js/views/templatelib.js', 'js/views/contract.js', 'js/views/negotiation.js', 'js/views/library.js'])
      assert.ok(!/saveContractToLibrary\(/.test(read(f)), 'no caller of saveContractToLibrary in ' + f);
  });

  test('THERE IS NO SECOND DOOR: the blank-page form and the Copilot conversion have no caller left', () => {
    const js = ['js/views/templatelib.js', 'js/views/library.js', 'js/views/newstandard.js', 'js/draft.js', 'js/views/contract.js', 'js/app.js'].map(read).join('\n');
    const calls = name => (js.match(new RegExp('\\b' + name + '\\(', 'g')) || []).length - (js.match(new RegExp('function ' + name + '\\(', 'g')) || []).length;
    assert.equal(calls('tplLibCreateModal'), 0, 'the "New standard template" form is no longer a door');
    assert.equal(calls('tplLibUploadModal'), 0, 'nor is the Copilot conversion that re-typed a whole file');
    assert.match(TL_SRC, /#tpllib-new'\)\?\.addEventListener\('click', \(\) => openNewStandard\(\)\)/, 'a dormant section’s buttons press the one door');
  });

  test('"Nothing fits" offers the scratch start, with the reader’s own sentence already in it', () => {
    const d = read('js/draft.js');
    assert.match(d, /openNewStandard\(\{ start:'scratch', said:String\(sentence\|\|''\)\s*\}\)/);
    assert.ok(!/tplLibCreateModal\(\)/.test(d));
  });
});

describe('f376 (3) a document is COPIED, never re-typed', () => {
  test('no model is asked to make the copy — the start reads the file with the product’s own readers and cuts it with the one copier', () => {
    assert.ok(NS_SRC.length > 0);
    assert.ok(!/ai\/template|templates\/upload/.test(NS_SRC), 'the Copilot conversion route is not on this path');
    assert.match(bodyOf(NS_SRC, 'nsCopy'), /tplFormCopyBlocks\(safe\)/);
    assert.match(bodyOf(NS_SRC, 'nsReadFile'), /extractWordText\(dataUrl\)/, 'a Word file through the reader every upload goes through');
  });

  test('"no word changed" is CHECKED, not claimed, and the facts are counted off the copy', () => {
    const win = page(['js/richdoc.js', 'js/templateform.js', 'js/views/newstandard.js']);
    const html = '<h1>MASTER SERVICES AGREEMENT</h1><h2>1. Definitions</h2><p>In this Agreement the Supplier means [Supplier name].</p>'
      + '<h2>2. Fees</h2><p>The Customer shall pay EUR 12,000 within 30 days.</p><table><tbody><tr><td>Item</td><td>Price</td></tr></tbody></table>';
    const c = win.nsCopy(html, null, 'x.docx');
    assert.equal(c.same, true, 'joined back together the blocks are the markup that was read');
    assert.deepEqual(JSON.parse(JSON.stringify(c.facts)), { heads: 3, numbers: 2, tables: 1 });
    assert.equal(c.name, 'Master Services Agreement', 'a title set in capitals is written as a name is');
  });

  test('the name is the DOCUMENT’S OWN title, cut where a party’s name follows — never a guess', () => {
    const win = page(['js/richdoc.js', 'js/templateform.js', 'js/views/newstandard.js']);
    assert.equal(win.nsDocTitle('<p>CONFIDENTIAL</p><p>Software as a Service Agreement for nShift’s multi-carrier Parcel Management Solution</p>', 'SaaS.docx'),
      'Software as a Service Agreement', 'the owner’s own file: the cover word is not a title, and the party is cut off');
    assert.equal(win.nsDocTitle('<p>1 SCOPE</p><p>The Supplier shall supply.</p>', 'Carrier_terms.docx'), 'Carrier terms', 'no title in the wording: the file’s name');
  });

  test('a copy that did not land leaves nothing behind: a refused write takes the empty draft back out, and the refusal is still said', async () => {
    const calls = [];
    const win = page(['js/views/newstandard.js'], { api: async (p, m) => {
      calls.push((m || 'GET') + ' ' + p);
      if (m === 'PUT') throw new Error('Too many blocks (max 500)');
      return { ok: true };
    } });
    await assert.rejects(() => win.nsFill({ tid: 'tpl_9', vid: 'tv_9' }, { blocks: [], fields: [] }), /Too many blocks/);
    assert.deepEqual(calls, ['PUT templates/tpl_9/versions/tv_9', 'DELETE templates/tpl_9']);
    assert.equal((NS_SRC.match(/await nsFill\(made, /g) || []).length, 2, 'both starts that copy wording write it through it');
  });

  test('ONE OF HaTi’S keeps every blank it has: the keys are put in the template’s own shape on the marker AND the field', () => {
    const src = bodyOf(LIB_SRC, 'tplBuiltinDraftBody');
    assert.match(LIB_SRC, /const tplBuiltinKey=k=>/);
    assert.match(src, /map\(f=>\(\{\.\.\.f, key:tplBuiltinKey\(f\.key\)\}\)\)/, 'the fields’ keys');
    assert.match(src, /const key=raw\?tplBuiltinKey\(raw\):''/, 'and the marker each box becomes, by the same function');
    /* The function itself, evaluated off the source: effDate / payDays are what
       the server would otherwise slug to effdate / paydays while the wording
       kept {{effDate}} — three of seven blanks "unplaced". */
    const fn = vm.runInNewContext('(' + /const tplBuiltinKey=(k=>[\s\S]*?\|\|'field');/.exec(LIB_SRC)[1] + ')');
    assert.deepEqual(['effDate', 'payDays', 'inspectDays', 'counterparty', 'value'].map(fn), ['eff_date', 'pay_days', 'inspect_days', 'counterparty', 'value']);
    for (const k of ['eff_date', 'pay_days', 'counterparty']) assert.match(k, /^[a-z][a-z0-9_]{0,63}$/, 'the server’s TPL_KEY_RE takes it as it is');
  });
});

describe('f376 (4) Copilot’s first move, one per start', () => {
  test('FROM SCRATCH: every proposed section says where its words come from, and an optional one arrives unticked', async () => {
    const win = builderPage();
    await win.openTemplateBuilder('tpl_1', 'tv_1', { start: { kind: 'scratch', said: 'A carrier agreement', outline: { sections: [
      { heading: 'Parties', intent: 'Who.' }, { heading: 'Payment terms', intent: 'When.' }, { heading: 'Escrow', intent: 'Code.', optional: true }] } } });
    const o = win.__run('_tb.outline');
    const row = h => o.sections.find(x => x.heading === h);
    assert.equal(row('Payment terms').src, 'lib', 'the clause library has wording for it');
    assert.equal(row('Parties').src, 'ai', 'neither the library nor the playbook does');
    assert.equal(row('Escrow').on, false, 'optional arrives unticked');
    assert.ok(o.sections.some(x => x.playbook), 'the playbook’s own open positions join the list, marked');
    const lane = win.document.getElementById('tb-lane').textContent;
    assert.match(lane, /from your clause library/, 'and the sentence above the list counts the sources');
  });

  test('[repair] a section is proposed ONCE by KIND, not only by name — "Limitation of liability" stops the playbook adding "Liability cap"', async () => {
    const win = builderPage();
    await win.openTemplateBuilder('tpl_1', 'tv_1');
    const heads = d => win.tbOutlineFrom(d, '').sections.map(x => x.heading);
    const without = heads({ sections: [{ heading: 'Parties', intent: '' }] });
    assert.ok(without.includes('Liability cap'), 'the baseline book asks for a liability cap');
    const withIt = heads({ sections: [{ heading: 'Parties', intent: '' }, { heading: 'Limitation of liability', intent: '' }] });
    assert.ok(!withIt.includes('Liability cap'), 'and the model’s own liability section answers it: ' + withIt.join(' | '));
    assert.equal(withIt.filter(h => /liabilit/i.test(h)).length, 1);
  });

  test('[repair] the outline the start paid for is COUNTED, and a refused one keeps the sentence in the box it is asked from again', async () => {
    const a = builderPage();
    await a.openTemplateBuilder('tpl_1', 'tv_1', { start: { kind: 'scratch', said: 'A carrier agreement', outline: { sections: [{ heading: 'Parties', intent: '' }] } } });
    assert.equal(a.__run('_tb.reads'), 1, 'one read spent before the builder opened');
    assert.match(a.document.getElementById('tb-lane').textContent, /read 1\b/);
    const b = builderPage();
    await b.openTemplateBuilder('tpl_1', 'tv_1', { start: { kind: 'scratch', said: 'Supply of fresh produce', outline: null } });
    assert.equal(b.document.getElementById('tb-ask').value, 'Supply of fresh produce', 'the sentence is where a press asks again');
  });

  test('FROM A TEMPLATE: the likely blanks arrive UNTICKED (decision 3), and a fact Copilot did not answer is COUNTED and said', async () => {
    const win = builderPage({
      blocks: [['heading', 'Parties'], ['field_group', 'This Agreement is made between Highland Corporate Ltd and nShift Group A/S of [address], on 1 March 2026.']],
      ai: body => ({ items: body.candidates.filter(c => /address/.test(c.text)).map(c => ({ id: c.id, kind: 'blank', label: 'Address', type: 'text' })) }),
    });
    await win.openTemplateBuilder('tpl_1', 'tv_1', { start: { kind: 'template', from: 'upload', facts: { heads: 1, numbers: 0, tables: 0 }, same: true } });
    for (let i = 0; i < 5; i++) await settle();
    const C = win.__run('_tb.cands');
    assert.equal(C.busy, false);
    assert.ok(C.rows.length >= 1 && C.rows.every(r => r.on === false), 'nothing is a blank until a person ticks it');
    assert.ok(C.dropped >= 2, 'the company name and the date were not labelled: ' + C.dropped);
    const lane = win.document.getElementById('tb-lane').textContent;
    assert.match(lane, /Copilot did not say whether \d+ names, amounts or dates are blanks/);
    const make = win.document.querySelector('[data-tb-cand-make]');
    assert.ok(make && make.disabled, 'and the button waits for a tick');
  });

  test('[repair] a {{marker}} is ALREADY a blank — it is never offered back as one', async () => {
    const win = builderPage({ blocks: [['heading', 'Parties'], ['field_group', 'Between {{counterparty}} of [Insert company address] and us.']] });
    await win.openTemplateBuilder('tpl_1', 'tv_1');
    const found = win.tbBlankCandidates().map(c => c.text);
    assert.ok(found.includes('[Insert company address]'), 'a bracketed gap is found');
    assert.ok(!found.some(t => /\{\{/.test(t)), 'the builder’s own marker is not: ' + found.join(' | '));
  });

  test('a copied heading owes no wording; a heading somebody added and left empty does', async () => {
    const win = builderPage({ blocks: [['heading', '<h1>1\tSCOPE</h1>', 'rich'], ['heading', 'Fees']] });
    await win.openTemplateBuilder('tpl_1', 'tv_1');
    const secs = win.tbSections();
    assert.equal(win.tbSectionOwes(secs[0]), false, 'the document’s own heading is a heading');
    assert.equal(win.tbSectionOwes(secs[1]), true, 'an empty section of ours is work');
  });

  test('[repair] a missing standard is listed ONCE, even where the book holds a position AND a range on it', async () => {
    const win = builderPage({ template: { category: 'procurement' } });
    await win.openTemplateBuilder('tpl_1', 'tv_1');
    const cov = win.tbCoverage();
    const cats = cov.rows.filter(r => r.state === 'open').map(r => r.category);
    const miss = win.tbMissingStandards(cov).map(r => r.category);
    assert.ok(cats.length > new Set(cats).size, 'the supply book really does hold one category twice');
    /* Joined, not deepEqual'd: the lists are born in the page's realm, and two
       identical arrays from two realms are not deepStrictEqual. */
    assert.equal(miss.join(' | '), [...new Set(cats)].join(' | '), 'and the list names each once');
    assert.match(bodyOf(TB_SRC, 'tbContractCardHtml'), /const open = tbMissingStandards\(cov\);/, 'the contract card reads it');
    assert.match(bodyOf(TB_SRC, 'tbOpenItems'), /tbMissingStandards\(cov\)/, 'and so does the question Publish asks');
  });
});

describe('f376 (5) the name, category and value stream are at the top of the builder; Publish asks once', () => {
  const FOLDERS = { proc: { name: 'Procurement & Raw Materials', color: '#2f7a5a' } };

  test('the strip carries the name, the draft, the category and the stream — an unfiled template says so on its chip', async () => {
    const win = builderPage({ globals: { FOLDERS } });
    await win.openTemplateBuilder('tpl_1', 'tv_1');
    const head = win.document.getElementById('tb-head');
    assert.ok(head, 'the head is drawn in the strip');
    assert.equal(head.querySelector('[data-tb-meta="name"] .v').textContent, 'Software as a Service Agreement');
    assert.ok(head.querySelector('.tb-chipv'), 'the draft chip');
    const cat = head.querySelector('[data-tb-meta="category"]'), stream = head.querySelector('[data-tb-meta="stream"]');
    assert.ok(cat && !cat.classList.contains('empty'), 'a category is always filled — Other is an answer');
    assert.ok(stream && stream.classList.contains('empty'), 'no stream yet: the chip is marked');
    assert.equal(stream.querySelector('.v').textContent, win.i18t('tb_h_choose'));
    assert.ok(!win.document.getElementById('tb-back').textContent.trim(), 'the way back is the square arrow alone — the name is its own control now');
  });

  test('each chip is ONE PRESS from the Template details box that already exists, on its own field; saving repaints the head, never navigates', async () => {
    const calls = [];
    const win = builderPage({ globals: { FOLDERS, tplLibMetaModal: (t, o) => calls.push({ id: t.id, focus: o && o.focus, onSaved: o && o.onSaved }) } });
    await win.openTemplateBuilder('tpl_1', 'tv_1');
    const press = sel => win.document.querySelector(sel).dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
    press('[data-tb-meta="stream"]'); press('[data-tb-meta="category"]'); press('[data-tb-meta="name"]');
    assert.deepEqual(calls.map(c => c.focus), ['stream', 'category', 'name']);
    assert.ok(calls.every(c => c.id === 'tpl_1' && typeof c.onSaved === 'function'));
    calls[0].onSaved({ id: 'tpl_1', name: 'SaaS Subscription Agreement', category: 'sales', folder: 'proc' });
    const head = win.document.getElementById('tb-head');
    assert.ok(win.document.getElementById('tb-page'), 'the builder is still open');
    assert.equal(head.querySelector('[data-tb-meta="name"] .v').textContent, 'SaaS Subscription Agreement');
    assert.ok(!head.querySelector('[data-tb-meta="stream"]').classList.contains('empty'));
    assert.equal(head.querySelector('[data-tb-meta="stream"] .v').textContent, 'Procurement & Raw Materials');
    assert.match(win.document.getElementById('tb-paperslot').textContent, /SaaS Subscription Agreement/, 'a rename reaches the paper’s title too');
  });

  test('the box itself: the caret lands AFTER the frame’s own focus, and a caller that must stay put is handed the saved template', () => {
    const b = bodyOf(TL_SRC, 'tplLibMetaModal');
    assert.match(b, /function tplLibMetaModal\(t, opts = \{\}\)/);
    assert.match(b, /\{ name: 'tpllib-m-name', category: 'tpllib-m-cat', stream: 'tpllib-m-stream' \}\[opts\.focus\]/);
    assert.match(b, /if \(at\) setTimeout\(\(\) => \{/, 'queued after trapFocus’s own tick');
    assert.match(b, /if \(typeof opts\.onSaved === 'function'\) opts\.onSaved\(r && r\.template \? r\.template : null\);\s*else openTemplateLibDetail\(t\.id\);/);
    assert.match(TL_SRC, /\/\* The builder's head chips open this same box \(24 Sep 2026\)\. \*\/\s*tplLibMetaModal,/, 'published');
  });

  test('THE ONE LINE: nothing in the strip wraps, the words give, and a ladder asked of the strip’s own width folds the keys first', () => {
    const css = TB_SRC.slice(TB_SRC.indexOf('.tb-strip{'), TB_SRC.indexOf('THE QUESTION PUBLISH ASKS'));
    assert.match(css, /\.tb-strip\{display:flex;align-items:center;gap:10px;flex-wrap:nowrap;/);
    assert.match(css, /\.tb-strip \.tb-act\{flex:none;white-space:nowrap\}/);
    assert.match(css, /\.tb-head \.tb-tname\{flex-shrink:4;min-width:6em\}/, 'the name gives first and never vanishes');
    assert.match(css, /\.tb-strip\{container-type:inline-size\}/);
    assert.match(css, /\.tb-strip #tb-drop\{flex:none;white-space:nowrap\}/, 'Discard never wraps — squeezed, it grew the strip to 35px');
    assert.match(css, /@container \(max-width:900px\)\{ \.tb-fchip \.k\{display:none\} \}/);
    assert.match(css, /@container \(max-width:640px\)\{ \.tb-head \.tb-chipv\{display:none\} \}/);
    assert.match(css, /@container \(max-width:620px\)\{ \.tb-strip #tb-save \.w\{display:none\} \}/);
    assert.match(TB_SRC, /id="tb-save"[^>]*title="\$\{esc\(i18t\('tb_save_draft'\)\)\}" aria-label="\$\{esc\(i18t\('tb_save_draft'\)\)\}">\$\{icon\('check2', 'w-3\.5 h-3\.5'\)\}<span class="w"> \$\{i18t\('tb_save_draft'\)\}<\/span>/, 'folded, Save keeps its name on its hover');
  });

  test('PUBLISH ASKS ONCE (decision 2): every open item is a row with its own door, and "Publish anyway" still goes on', async () => {
    const calls = [];
    const win = builderPage({ blocks: [['heading', 'Parties']], globals: { FOLDERS, tplLibMetaModal: (t, o) => calls.push(o && o.focus) } });
    await win.openTemplateBuilder('tpl_1', 'tv_1');
    win.document.getElementById('tb-publish').dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
    const root = win.document.getElementById('modal-root');
    assert.ok(root.querySelector('#tb-pq-go'), 'the question is up');
    assert.equal(win.__log.design, 0, 'and the design step did not open under it');
    const rows = [...root.querySelectorAll('.tb-pq-o')].map(r => r.textContent.replace(/\s+/g, ' ').trim());
    assert.ok(rows.some(r => r.startsWith(win.i18t('tb_pq_stream'))), 'the empty stream is named');
    assert.ok(rows.some(r => /Parties/.test(r)), 'so is the section still to write');
    assert.equal(root.querySelectorAll('[data-tb-pq]').length, rows.length, 'every row is a door');
    root.querySelector('[data-tb-pq="0"]').dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
    win.__tick();
    assert.deepEqual(calls, ['stream'], 'the stream row opens the stream picker');
    assert.equal(root.innerHTML, '', 'and the question is put away first');
    win.document.getElementById('tb-publish').dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
    win.document.getElementById('tb-pq-go').dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
    for (let i = 0; i < 5; i++) await settle();
    assert.equal(win.__log.design, 1, 'Publish anyway saves and goes on to the design step');
    assert.ok(win.__log.api.some(([p, m]) => p === 'templates/tpl_1/versions/tv_1' && m === 'PUT'), 'after the save');
  });

  test('and with nothing open, Publish asks nothing', async () => {
    const win = builderPage({ blocks: [['heading', 'Parties'], ['field_group', 'Between the parties.']], template: { folder: 'proc' }, globals: { FOLDERS } });
    await win.openTemplateBuilder('tpl_1', 'tv_1');
    win.__run('resolvePlaybook = () => ({ positions: [], ranges: [], label: "" })');
    assert.equal(win.tbOpenItems().length, 0);
    win.document.getElementById('tb-publish').dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
    for (let i = 0; i < 5; i++) await settle();
    assert.ok(!win.document.getElementById('tb-pq-go'), 'no question');
    assert.equal(win.__log.design, 1, 'straight on to the design step');
  });
});

describe('f376 (6) from one of our contracts — the check, and every deal detail can be put back', () => {
  test('the card names what was taken out, and "Put back" restores the words through the one writer and drops the field with its last marker', async () => {
    const win = builderPage({ blocks: [['heading', 'Parties'], ['field_group', 'This agreement is made between Highland Corporate Ltd and {{counterparty_name}}.']],
      fields: ['counterparty_name'], template: { category: 'procurement', folder: 'proc' }, globals: { FOLDERS: { proc: { name: 'Procurement' } } } });
    await win.openTemplateBuilder('tpl_1', 'tv_1', { start: { kind: 'contract', contractId: 'MK-A1', contractName: 'Refined Sugar Supply', counterparty: 'Kabras Sugar',
      taken: [{ key: 'counterparty_name', label: 'Counterparty name', value: 'Kabras Sugar', places: 1 }], negotiated: [] } });
    const lane = () => win.document.getElementById('tb-lane').textContent.replace(/\s+/g, ' ');
    assert.match(lane(), /MK-A1/);
    assert.match(lane(), /Kabras Sugar → Counterparty name/);
    assert.ok(win.document.querySelector('[data-tb-putback="counterparty_name"]'), 'with its Put back');
    const missing = win.tbMissingStandards(win.tbCoverage()).map(r => r.category);
    assert.equal(new Set(missing).size, missing.length, 'the missing standards once each');
    win.tbPutBack('counterparty_name');
    const body = win.__run('_tb.blocks[1].content');
    assert.match(body, /between Highland Corporate Ltd and Kabras Sugar\./, 'the words the paper used are back');
    assert.equal(win.__run('_tb.fields.length'), 0, 'and the blank has gone with its last marker');
    assert.ok(!win.document.querySelector('[data-tb-putback="counterparty_name"]'), 'the card no longer offers it');
  });
});

describe('f376 (7) Copilot is asked SMALL questions — and only what it was asked comes back', () => {
  const { startHati, startScriptedAi, seedWorkspace } = require('./helpers');
  let h, w, ai;
  before(async () => { ai = await startScriptedAi(); h = await startHati({ ANTHROPIC_BASE_URL: ai.base }); w = await seedWorkspace(h); });
  after(async () => { await h.stop(); await ai.stop(); });

  test('POST /api/ai/blanks with candidates: an invented id, an unknown kind and an unknown category are dropped; every string is bounded', async () => {
    ai.script({ content: [{ type: 'tool_use', id: 'tu1', name: 'label_candidates', input: {
      category: 'lease',
      items: [
        { id: 'c1', kind: 'blank', label: 'Supplier’s name ' + 'x'.repeat(200), type: 'party', variants: ['nShift', 'ab', 7] },
        { id: 'c2', kind: 'note', why: 'an instruction to whoever drafts' },
        { id: 'c9', kind: 'blank', label: 'invented' },
        { id: 'c3', kind: 'delete' },
      ] } }] });
    const r = await w.admin.json('/api/ai/blanks', { method: 'POST', body: { title: 'SaaS', company: 'Highland Corporate Ltd', candidates: [
      { id: 'c1', text: 'nShift Group A/S', context: 'between Maersk and nShift Group A/S' },
      { id: 'c2', text: '[Modify this section as necessary.]', context: '' },
      { id: 'c3', text: '1 March 2026', context: '' }] } });
    assert.deepEqual(r.items.map(x => x.id + ':' + x.kind), ['c1:blank', 'c2:note'], 'only asked ids, only the three kinds');
    assert.ok(r.items[0].label.length <= 60, 'a label is bounded');
    assert.deepEqual(r.items[0].variants, ['nShift'], 'a variant is a real string of three letters or more');
    assert.equal(r.category, null, 'a category off the list is not an answer');
    assert.equal(r.asked, 3);
    const sent = JSON.stringify(ai.calls[ai.calls.length - 1].body);
    assert.ok(sent.includes('its own name is never a blank'), 'the company’s own name is named as not a blank');
    assert.ok(!/propose_blanks/.test(sent), 'and it is the small question, not the old whole-document one');
  });

  test('POST /api/ai/outline with title: a name and a category ride back — the category only from the list', async () => {
    ai.script({ content: [{ type: 'tool_use', id: 'tu2', name: 'propose_sections', input: {
      sections: [{ heading: 'Parties', intent: 'Who.' }], name_suggestion: 'Nordic Parcel Carrier Agreement', category_guess: 'procurement' } }] });
    const a = await w.admin.json('/api/ai/outline', { method: 'POST', body: { sentence: 'A carrier agreement', title: true } });
    assert.equal(a.title, 'Nordic Parcel Carrier Agreement');
    assert.equal(a.category, 'procurement');
    ai.script({ content: [{ type: 'tool_use', id: 'tu3', name: 'propose_sections', input: {
      sections: [{ heading: 'Parties', intent: 'Who.' }], name_suggestion: 'X', category_guess: 'lease' } }] });
    const b = await w.admin.json('/api/ai/outline', { method: 'POST', body: { sentence: 'A carrier agreement', title: true } });
    assert.ok(!('category' in b), 'a category off the list is left out');
    ai.script({ content: [{ type: 'tool_use', id: 'tu4', name: 'propose_sections', input: { sections: [{ heading: 'Parties', intent: 'Who.' }] } }] });
    await w.admin.json('/api/ai/outline', { method: 'POST', body: { sentence: 'A carrier agreement' } });
    assert.ok(!JSON.stringify(ai.calls[ai.calls.length - 1].body).includes('name_suggestion'), 'the rail’s own ask is not asked for a name');
  });
});

describe('f376 (8) every sentence is in both books', () => {
  test('the chooser, the head, the question and the first moves carry English and Swedish alike', () => {
    const { STRINGS } = require(path.join(ROOT, 'js', 'i18n.js'));
    const fam = /^(ns_|tb_h_|tb_pq_|tb_c_|tb_k_|tb_src_|tb_out_)/;
    const en = Object.keys(STRINGS.en).filter(k => fam.test(k)), sv = new Set(Object.keys(STRINGS.sv).filter(k => fam.test(k)));
    assert.ok(en.length >= 60, 'the feature carries its own sentences: ' + en.length);
    assert.deepEqual(en.filter(k => !sv.has(k)), [], 'nothing is English-only');
    assert.deepEqual([...sv].filter(k => !(k in STRINGS.en)), [], 'nothing is Swedish-only');
    for (const k of ['ns_tab_upload', 'ns_tab_paste', 'ns_tab_hati', 'tb_src_lib', 'tb_src_std', 'tb_src_ai'])
      assert.ok(STRINGS.en[k] && STRINGS.sv[k], k + ', built by name at the draw, is in both');
  });
});
