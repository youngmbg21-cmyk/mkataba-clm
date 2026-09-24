/* ============================================================
   f377 — THREE THINGS A TEMPLATE COULD NOT SAY
   ============================================================
   Young, 24 Sep 2026, of three lines the one-door run wrote into BUGLOG.md as
   "noticed, not fixed": *"fix these"* —

     1  A template can't be moved back to "no value stream" once it has one.
        The details box read its stream through tplLibPick, which falls back
        on an EMPTY value — and "None yet" IS the empty value. It saved, said
        "Saved", and changed nothing.

     2  Categories your company adds in Settings can't be saved onto a
        template. Every picker offered them since 17 Sep; the three routes
        that file a template asked TPL_CATEGORIES — the five HaTi ships — so
        the details box was refused ("Unknown category") and the create
        routes filed it quietly as Other.

     3  A template written from scratch printed its first section heading
        ("Parties") as the published contract's title, and numbered every
        section one low. The rule — the first heading is the title — is the
        rule of a COPIED document; the builder's paper drew the template's
        name above "Parties", so the author read one document and the contract
        printed another.

   Every claim is red at the parent except these WALLS and CONTROLS, which pass
   on both sides because their job is to fail the day somebody moves them:
     1c  choosing another stream still files it there           (control)
     1d  a sentinel that reaches the save keeps what it had       (wall)
     2c  a category nobody has is still refused                    (wall)
     2e  naming an unknown category does not add it to anything    (wall)
     3c  HaTi's own paper made ours opens with its own title       (wall)
     3d  ... and still does once the template is renamed           (wall)
     3e  a copied document keeps its first heading as its title    (wall)
     3f  a contract minted before this is drawn byte for byte      (wall)
     3g  a copied document's markup carries its own title          (wall)

   Run: node --test test/f377-a-template-says-what-it-is.test.js
   ============================================================ */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { JSDOM } = require('jsdom');
const { runFileInContext } = require('./vmcache');
const { startHati, seedWorkspace } = require('./helpers');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
/* THE SWEEPS READ CODE, NOT PROSE — the notes beside these fixes name the
   very calls they replaced. */
const strip = t => t.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1 ');
const TF = require(path.join(ROOT, 'js', 'templateform.js'));
const settle = () => new Promise(r => setImmediate(r));

/* A real page: the product's own files evaluated after the dictionary, and
   the shell the running app would provide as `globals`. */
function page(files, globals = {}) {
  const dom = new JSDOM('<!doctype html><html><body><div id="content-scroll"><div id="content"></div></div><div id="modal-root"></div></body></html>',
    { runScripts: 'outside-only', pretendToBeVisual: true, url: 'https://hati.test/' });
  const win = dom.window;
  const timers = [];
  win.setTimeout = fn => { timers.push(fn); return timers.length; };
  win.clearTimeout = () => {};
  win.setInterval = () => 0; win.clearInterval = () => {};
  const log = { toasts: [], api: [] };
  Object.assign(win, {
    esc: s => String(s == null ? '' : s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch])),
    icon: n => `<svg data-i="${n}"></svg>`,
    toast: (m, k) => { log.toasts.push([String(m), k]); },
    openModal: html => { win.document.getElementById('modal-root').innerHTML = `<div role="dialog">${html}</div>`; },
    closeModal: () => { win.document.getElementById('modal-root').innerHTML = ''; },
    confirmDialog: async () => true,
    state: { contracts: [], settings: {}, aiConfigured: true, view: 'templates' },
    API_MODE: () => true, canEdit: () => true, isAdmin: () => true,
    currentUser: () => ({ id: 'u1', name: 'Amina Otieno', role: 'admin' }),
    copilotAvailable: () => true,
    openDesignStep: () => {},
    setView: () => {},
    ...globals,
  });
  const ctx = dom.getInternalVMContext();
  for (const f of ['js/i18n.js', 'js/jurisdiction.js', 'js/section.js'].concat(files)) runFileInContext(path.join(ROOT, f), ctx, f);
  win.__log = log;
  win.__run = code => vm.runInContext(code, ctx);
  win.__tick = () => { while (timers.length) { const fn = timers.shift(); try { fn(); } catch (_) {} } };
  return win;
}
const press = (win, el) => el.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));

/* ------------------------------------------------------------------
   1 — "NONE YET" TAKES A TEMPLATE OUT OF ITS STREAM
   ------------------------------------------------------------------ */
describe('f377 (1) a template can be moved back to no value stream', () => {
  const FOLDERS = { proc: { id: 'proc', name: 'Procurement & Raw Materials' }, sales: { id: 'sales', name: 'Sales' } };
  const detailsPage = () => {
    const calls = [];
    const win = page(['js/views/templatelib.js'], {
      FOLDERS,
      api: async (p, method, body) => { calls.push([p, method || 'GET', body]); return { ok: true, template: { id: 'tpl_1', ...body } }; },
    });
    win.__calls = calls;
    return win;
  };
  const saveWith = async (win, stream) => {
    win.tplLibMetaModal({ id: 'tpl_1', name: 'Nordic Parcel Carrier Agreement', category: 'other', folder: 'proc', description: '' },
      { onSaved: () => {} });
    const sel = win.document.getElementById('tpllib-m-stream');
    assert.equal(sel.value, 'proc', 'the box opens on the stream the template is filed under');
    sel.value = stream;
    press(win, win.document.getElementById('tpllib-m-save'));
    for (let i = 0; i < 4; i++) await settle();
    const patch = win.__calls.find(c => c[1] === 'PATCH');
    assert.ok(patch, 'the save reached the route');
    return patch[2];
  };

  test('1a choosing "None yet" is SENT as no stream — the owner\'s report, driven', async () => {
    const win = detailsPage();
    const body = await saveWith(win, '');
    assert.equal(body.folder, null, '"None yet" files the template under no stream — the parent sent the old stream back');
  });

  test('1b the stream box has its OWN reading, and all three dialogs that draw the row ask it', () => {
    const win = detailsPage();
    assert.equal(typeof win.tplLibPickStream, 'function', 'published');
    const LIB = strip(read('js/views/templatelib.js'));
    assert.match(LIB, /folder: tplLibPickStream\('tpllib-m-stream', t\.folder\)/, 'the details box');
    assert.match(LIB, /folder: tplLibPickStream\('tpllib-stream', null\)/, 'the create dialog');
    assert.match(LIB, /folder: tplLibPickStream\('tpllib-up-stream', null\)/, 'the convert dialog');
    assert.ok(!/tplLibPick\('tpllib-(?:m-|up-)?stream'/.test(LIB), 'no stream box is read through the category box\'s guard any more');
  });

  test('1c [control] choosing another stream still files it there', async () => {
    const win = detailsPage();
    assert.equal((await saveWith(win, 'sales')).folder, 'sales');
  });

  test('1d [wall] a sentinel that reaches the save keeps what the template had', async () => {
    const win = detailsPage();
    assert.equal((await saveWith(win, '__new__')).folder, 'proc', '"+ New value stream…" is never a stream');
  });

  test('1e the reading itself: empty is null, the sentinel and a missing box keep the current stream', () => {
    const win = detailsPage();
    win.document.body.insertAdjacentHTML('beforeend', '<select id="s1"><option value="">None yet</option><option value="proc">P</option><option value="__new__">+</option></select>');
    const s = win.document.getElementById('s1');
    s.value = ''; assert.equal(win.tplLibPickStream('s1', 'proc'), null);
    s.value = '__new__'; assert.equal(win.tplLibPickStream('s1', 'proc'), 'proc');
    s.value = 'proc'; assert.equal(win.tplLibPickStream('s1', null), 'proc');
    assert.equal(win.tplLibPickStream('no-such-box', 'proc'), 'proc', 'a box that is not there never clears a stream');
  });
});

/* ------------------------------------------------------------------
   2 — A CATEGORY THE COMPANY ADDED IS A CATEGORY
   ------------------------------------------------------------------ */
describe('f377 (2) a category the company added can be saved onto a template', () => {
  let h, w;
  before(async () => {
    h = await startHati();
    w = await seedWorkspace(h);
    await w.admin.json('/api/settings/filing', { method: 'PUT', body: {
      valueStreams: [], templateCategories: [{ id: 'tc_logistics', name: 'Logistics' }] } });
  });
  after(async () => { await h.stop(); });

  let tid;
  test('2a a new template is filed under it, not quietly under Other', async () => {
    const r = await w.admin.json('/api/templates', { method: 'POST', body: { name: 'Nordic Parcel Carrier Agreement', category: 'tc_logistics' } });
    tid = r.template.id;
    assert.equal(r.template.category, 'tc_logistics');
  });

  test('2b the details box can move a template into it — the refusal the owner saw', async () => {
    const r = await w.admin.json('/api/templates', { method: 'POST', body: { name: 'Warehousing standard', category: 'other' } });
    const out = await w.admin.raw('/api/templates/' + r.template.id, { method: 'PATCH', body: { name: 'Warehousing standard', category: 'tc_logistics' } });
    assert.equal(out.status, 200, (out.json && out.json.error) || '');
    assert.equal(out.json.template.category, 'tc_logistics');
  });

  test('2c [wall] a category nobody has is still refused — the list is an allow-list', async () => {
    const out = await w.admin.raw('/api/templates/' + tid, { method: 'PATCH', body: { category: 'tc_made_up' } });
    assert.equal(out.status, 400);
    assert.match(out.json.error, /Unknown category/);
  });

  test('2d the category a template already has stays sayable after the company removes it — asked as a difference', async () => {
    await w.admin.json('/api/settings/filing', { method: 'PUT', body: { valueStreams: [], templateCategories: [] } });
    const out = await w.admin.raw('/api/templates/' + tid, { method: 'PATCH', body: { name: 'Nordic Parcel Carrier Agreement v2', category: 'tc_logistics', folder: null } });
    assert.equal(out.status, 200, 're-saving the details box never fails on the category the template is already under');
    assert.equal(out.json.template.category, 'tc_logistics');
    assert.equal(out.json.template.name, 'Nordic Parcel Carrier Agreement v2');
  });

  test('2e [wall] naming an unknown category at creation files it as Other and adds it to nothing', async () => {
    const r = await w.admin.json('/api/templates', { method: 'POST', body: { name: 'Stray', category: 'tc_not_a_category' } });
    assert.equal(r.template.category, 'other');
  });

  test('2f all three filing routes ask ONE reading, and Copilot\'s own guesses are left to the five', () => {
    const SRV = strip(read('server/server.js'));
    assert.match(SRV, /const tplCategoryOk = v => typeof v === 'string' && \(TPL_CATEGORIES\.includes\(v\) \|\| tplCompanyCategoryIds\(\)\.has\(v\)\);/);
    const route = sig => { const i = SRV.indexOf(sig); assert.ok(i > 0, sig); return SRV.slice(i, SRV.indexOf('\napp.', i + 10)); };
    assert.match(route("app.post('/api/templates', auth"), /tplCategoryOk\(b\.category\) \? b\.category : 'other'/);
    assert.match(route("app.patch('/api/templates/:id'"), /b\.category !== t\.category && !tplCategoryOk\(b\.category\)/);
    assert.match(route("app.post('/api/templates/upload'"), /tplCategoryOk\(b\.category\) \? b\.category : 'other'/);
  });

  test('2g a category made inside the box is on the server before the box files anything under it', async () => {
    let release;
    const pending = new Promise(r => { release = r; });
    const calls = [];
    const win = page(['js/views/templatelib.js'], {
      FOLDERS: {},
      saveFilingSettings: () => pending,
      promptNewName: async o => o.make('Logistics'),
      api: async (p, method, body) => { calls.push([p, method || 'GET', body]); return { ok: true, template: { id: 'tpl_1', ...body } }; },
    });
    win.tplLibMetaModal({ id: 'tpl_1', name: 'Carrier', category: 'other', folder: null, description: '' }, { onSaved: () => {} });
    const cat = win.document.getElementById('tpllib-m-cat');
    cat.value = '__new__';
    cat.dispatchEvent(new win.Event('change', { bubbles: true }));
    for (let i = 0; i < 4; i++) await settle();
    assert.equal(cat.value, win.state.settings.templateCategories[0].id, 'the category the reader just made is chosen in the box');
    press(win, win.document.getElementById('tpllib-m-save'));
    for (let i = 0; i < 4; i++) await settle();
    assert.equal(calls.filter(c => c[1] === 'PATCH').length, 0, 'the save waits while the company\'s list is still on its way');
    release(true);
    for (let i = 0; i < 4; i++) await settle();
    const patch = calls.find(c => c[1] === 'PATCH');
    assert.ok(patch, 'and goes the moment it has landed');
    assert.equal(patch[2].category, win.state.settings.templateCategories[0].id);
  });
});

/* ------------------------------------------------------------------
   3 — WHICH LINE IS THE DOCUMENT'S TITLE
   ------------------------------------------------------------------ */
describe('f377 (3) a template written in HaTi is titled by its name', () => {
  const doc = (origin, name, blocks) => TF.templateFormDocHtml({ templateName: name, templateOrigin: origin, fields: [], values: {},
    blocks: blocks.map((b, i) => ({ orderIndex: i, blockType: b[0], content: b[1], ...(b[2] ? { format: b[2] } : {}) })) });
  const WRITTEN = [['heading', 'Parties'], ['fixed_text', 'This agreement is between us and the Carrier.'],
    ['heading', 'Services'], ['fixed_text', 'The Carrier collects and delivers.'], ['heading', 'Payment terms'], ['fixed_text', 'Invoices are paid in 30 days.']];

  test('3a the name is the title and "Parties" is section 1 — the owner\'s report', () => {
    const html = doc('built_in_hati', 'Nordic Parcel Carrier Agreement', WRITTEN);
    assert.ok(html.startsWith('<h1>Nordic Parcel Carrier Agreement</h1>'), 'the published title is the template\'s name: ' + html.slice(0, 60));
    assert.match(html, /<h2>1\. Parties<\/h2>/, 'the first section is a section, numbered 1');
    assert.match(html, /<h2>2\. Services<\/h2>/);
    assert.match(html, /<h2>3\. Payment terms<\/h2>/);
    assert.ok(!/<h1>Parties<\/h1>/.test(html), '"Parties" is not the title');
  });

  test('3b a written template that opens with wording still takes its name as its title', () => {
    const html = doc('built_in_hati', 'Carrier Agreement', [['fixed_text', 'Recitals.'], ['heading', 'Parties'], ['heading', 'Services']]);
    assert.ok(html.startsWith('<h1>Carrier Agreement</h1><p>Recitals.</p>'), html.slice(0, 80));
    assert.match(html, /<h2>1\. Parties<\/h2><h2>2\. Services<\/h2>/);
  });

  test('3c [wall] HaTi\'s own paper made ours opens with its own title — it reads the template\'s name', () => {
    const html = doc('built_in_hati', 'Raw Material Supply Agreement', [['heading', 'Raw Material Supply Agreement'],
      ['fixed_text', 'This agreement is made...'], ['heading', '1. Definitions'], ['heading', '2. Supply']]);
    assert.ok(html.startsWith('<h1>Raw Material Supply Agreement</h1>'));
    assert.equal((html.match(/<h1>/g) || []).length, 1, 'one title, never two');
    assert.match(html, /<h2>1\. Definitions<\/h2><h2>2\. Supply<\/h2>/, 'its own numbers, kept');
  });

  test('3d [wall] ... and still does once the template is renamed: no number of its own, numbers under it', () => {
    const html = doc('built_in_hati', 'Our supply standard', [['heading', 'Raw Material Supply Agreement'],
      ['heading', '1. Definitions'], ['heading', '2. Supply'], ['heading', '3. Price']]);
    assert.ok(html.startsWith('<h1>Raw Material Supply Agreement</h1>'), html.slice(0, 60));
    assert.ok(!/Our supply standard/.test(html), 'the library name is not printed over the paper\'s own title');
  });

  test('3e [wall] a copied document keeps its first heading as its title, whatever the template is called', () => {
    for (const origin of ['upload', 'saved_from_contract']) {
      const html = doc(origin, 'SaaS_agreement_standard', [['heading', 'SOFTWARE AS A SERVICE AGREEMENT'], ['heading', 'Definitions']]);
      assert.equal(html, '<h1>SOFTWARE AS A SERVICE AGREEMENT</h1><h2>1. Definitions</h2>', origin);
    }
  });

  test('3f [wall] a contract minted before this — its form carries no origin — is drawn byte for byte as it was', () => {
    const html = doc(undefined, 'Nordic Parcel Carrier Agreement', WRITTEN);
    assert.ok(html.startsWith('<h1>Parties</h1><p>This agreement'), 'a stored wording never moves when it is drawn again');
    assert.match(html, /<h2>1\. Services<\/h2>/);
  });

  test('3g [wall] a copied document\'s own markup carries its own title: no name is printed above it', () => {
    const html = doc('built_in_hati', 'Carrier', [['heading', '<h1>MASTER SERVICES AGREEMENT</h1>', 'rich'], ['fixed_text', '<p>Words.</p>', 'rich']]);
    assert.ok(!/<h1>Carrier<\/h1>/.test(html));
    assert.ok(html.startsWith('<h1>MASTER SERVICES AGREEMENT</h1>'));
  });

  test('3h ONE READING, on both hosts, and the renderer asks it', () => {
    assert.equal(typeof TF.tplFormHeads, 'function', 'exported for the server');
    assert.equal(typeof TF.tplFormNameIsTitle, 'function');
    const src = read('js/templateform.js');
    assert.match(src, /Object\.assign\(window, \{[^}]*tplFormHeads, tplFormNameIsTitle,/, 'and published for the browser');
    const fn = src.slice(src.indexOf('function templateFormDocHtml('), src.indexOf('function templateFormResolveDefaults('));
    assert.match(fn, /const plan = tplFormHeads\(blocks, form && form\.templateName, form && form\.templateOrigin\);/);
    assert.ok(!/let first = true/.test(fn), 'no second copy of the walk left in the renderer');
  });

  test('3i the contract copy carries the origin, and so does the share link, so their page draws what ours does', () => {
    const SRV = strip(read('server/server.js'));
    assert.match(SRV, /templateId: t\.id, templateVersionId: pub\.id, templateName: t\.name, templateOrigin: t\.origin,/);
    const CORE = strip(read('js/core.js'));
    const i = CORE.indexOf('templateForm:c.templateForm?{');
    assert.ok(i > 0);
    assert.match(CORE.slice(i, CORE.indexOf('}:undefined', i)), /templateOrigin:c\.templateForm\.templateOrigin/,
      'the counterparty re-draws the form when they fill a field — without the origin their title would differ from ours');
  });

  test('3j every preview hands the renderer the name and the origin', () => {
    const LIB = strip(read('js/views/templatelib.js'));
    assert.equal((LIB.match(/templateFormDocHtml\(\{ templateName: t\.name, templateOrigin: t\.origin,/g) || []).length, 2,
      'the essentials pane and the template\'s own page');
    const TB = strip(read('js/views/templatebuilder.js'));
    assert.match(TB, /form: \{\s*templateName: _tb\.template\.name, templateOrigin: _tb\.template\.origin,/, 'and the Design step\'s sample');
  });

  describe('3k a contract minted on a real server', () => {
    let h, w;
    before(async () => { h = await startHati(); w = await seedWorkspace(h); });
    after(async () => { await h.stop(); });
    test('prints the template\'s name as its title and numbers "Parties" 1', async () => {
      const r = await w.admin.json('/api/templates', { method: 'POST', body: { name: 'Nordic Parcel Carrier Agreement', category: 'procurement' } });
      const tid = r.template.id;
      const vid = (await w.admin.json('/api/templates/' + tid)).versions[0].id;
      await w.admin.json(`/api/templates/${tid}/versions/${vid}`, { method: 'PUT', body: {
        blocks: WRITTEN.map((b, i) => ({ orderIndex: i, blockType: b[0], content: b[1] })), fields: [] } });
      await w.admin.json(`/api/templates/${tid}/versions/${vid}/publish`, { method: 'POST', body: { changeNote: 'v1' } });
      const c = (await w.admin.json(`/api/templates/${tid}/contracts`, { method: 'POST', body: { folder: 'proc' } })).contract;
      assert.ok(String(c.redlineText).startsWith('<h1>Nordic Parcel Carrier Agreement</h1>'), String(c.redlineText).slice(0, 80));
      assert.match(c.redlineText, /<h2>1\. Parties<\/h2>/);
      assert.equal(c.templateForm.templateOrigin, 'built_in_hati', 'the copy says where the paper came from');
    });
  });
});

/* ------------------------------------------------------------------
   3 (the paper) — WHAT THE AUTHOR SEES IS WHAT PRINTS
   ------------------------------------------------------------------ */
describe('f377 (3) the builder\'s paper draws the title and numbers the contract will print', () => {
  const BUILDER_FILES = ['js/fieldlib.js', 'js/clausemodel.js', 'js/playbook.js', 'js/uploadblanks.js', 'js/templateform.js', 'js/views/templatebuilder.js'];
  const builderPage = ({ blocks, template }) => {
    const t = { id: 'tpl_1', name: 'Nordic Parcel Carrier Agreement', category: 'other', folder: null, ...template };
    return page(BUILDER_FILES, {
      FOLDERS: {},
      api: async (p, method) => {
        if (p === 'templates/tpl_1' && method === 'PATCH') return { ok: true, template: { ...t } };
        if (p === 'templates/tpl_1') return { template: { ...t } };
        if (p === 'templates/tpl_1/versions/tv_1' && method === 'PUT') return { ok: true };
        if (p === 'templates/tpl_1/versions/tv_1') return { version: { versionNumber: 1, status: 'draft' },
          blocks: blocks.map((b, i) => ({ orderIndex: i, blockType: b[0], content: b[1] })), fields: [] };
        if (p === 'org/branding') return { branding: { companyName: 'Highland Corporate Ltd' } };
        if (p === 'ai/blanks') return { items: [] };
        throw new Error('unexpected api call: ' + p);
      },
    });
  };
  const heads = win => [...win.document.querySelectorAll('#tb-paperslot .tb-row-h h3.tb-h')]
    .map(h => ({ no: (h.querySelector('.tb-n') || { textContent: '' }).textContent, text: h.querySelector('.tb-hed').textContent, title: h.classList.contains('is-title') }));

  test('3l a template written here: its name above, and "Parties" is 1 — as the contract prints it', async () => {
    const win = builderPage({ blocks: [['heading', 'Parties'], ['fixed_text', 'Between us.'], ['heading', 'Services'], ['fixed_text', 'Carriage.']],
      template: { origin: 'built_in_hati' } });
    await win.openTemplateBuilder('tpl_1', 'tv_1');
    const title = win.document.querySelector('#tb-paperslot .tb-title');
    assert.ok(title, 'the name is drawn as the title');
    assert.equal(title.textContent, 'Nordic Parcel Carrier Agreement');
    assert.deepEqual(heads(win).map(h => h.no + ' ' + h.text).join(' | '), '1. Parties | 2. Services',
      'every section numbered from 1 — the parent drew "Parties" bare and "Services" as 1');
  });

  test('3m a copied document on plain blocks: its own first heading is drawn AS the title, and no name above it', async () => {
    const win = builderPage({ blocks: [['heading', 'SERVICE AGREEMENT'], ['fixed_text', 'Made between...'], ['heading', 'Definitions']],
      template: { name: 'service_agreement_2024', origin: 'upload' } });
    await win.openTemplateBuilder('tpl_1', 'tv_1');
    assert.equal(win.document.querySelector('#tb-paperslot .tb-title'), null,
      'the library name never printed on this paper, so the paper does not draw it — the parent drew it above the real title');
    const h = heads(win);
    assert.equal(h[0].text, 'SERVICE AGREEMENT');
    assert.ok(h[0].title && !h[0].no, 'the document\'s own title line, drawn as the title and unnumbered');
    assert.equal(h[1].no + ' ' + h[1].text, '1. Definitions');
  });

  test('3n the title line is dressed as the title', () => {
    const TB = read('js/views/templatebuilder.js');
    assert.match(TB, /\.tb-h\.is-title\{justify-content:center;font-family:var\(--font-heading\);font-size:16px;letter-spacing:\.01em\}/);
    assert.match(TB, /<h3 class="tb-h\$\{asTitle \? ' is-title' : ''\}">/);
  });
});
