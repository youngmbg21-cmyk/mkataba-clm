'use strict';
/* f1202 — THE BUILDER'S TOP BAR, A TEMPLATE'S PAGE, AND CLAUSE N ⇄ CONTRACT (owner: "The Legora + Stripe way, build as
   drawn", 24 Nov 2026).

   (1) THE BUILDER'S TOP BAR is one row: the name on one line with one small grey line under it (the draft and where it
       is kept — the one slot, #tb-dirtyslot), a thin divider, Category and Stream as quiet words (an unchosen stream an
       amber dot), no badge, no boxed chips.
   (2) A TEMPLATE'S PAGE: the Dossier's desk with a white paper and the paper's zoom, one row at the top (More ▾ and the
       one black button: Edit in the builder for a draft, + New contract once published), Jambo's panel with Overview ·
       Blanks · Versions; Blanks read off the stored wording with where each stands; the version history in the panel.
   (3) CLAUSE N ⇄ CONTRACT: the tag names the clause by the paper's number; pressed it says Contract; a sentence then
       asks first (the keep-or-rewrite question without AI, the rest from POST /api/ai/section {ask:true}), drafts every
       section still to write as a CARD on its own thread (not written), shows it on the paper, and the person decides:
       Apply all · One by one · Discard all.
   (4) every new word in both books. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { JSDOM } = require('jsdom');
const { runFileInContext } = require('./vmcache');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const TB = read('js/views/templatebuilder.js'), TL = read('js/views/templatelib.js'), INS = read('js/views/inspector.js');
const CSS = read('index.html'), I18N = read('js/i18n.js'), SRV = read('server/server.js');
const fnBody = (src, name) => {
  const i = src.indexOf('function ' + name + '(');
  assert.ok(i >= 0, name + ' exists');
  let k = src.indexOf('{', src.indexOf(')', i)), d = 0;
  for (; k < src.length; k++) { if (src[k] === '{') d++; else if (src[k] === '}' && --d === 0) break; }
  return src.slice(i, k + 1);
};

function builder({ blocks, sectionAi }) {
  const dom = new JSDOM('<!doctype html><html><body><div id="content-scroll"><div id="content"></div></div><div id="modal-root"></div></body></html>',
    { runScripts: 'outside-only', pretendToBeVisual: true, url: 'https://hati.test/' });
  const win = dom.window; const log = { api: [], toasts: [] };
  win.setTimeout = fn => { Promise.resolve().then(() => { try { fn(); } catch (_) {} }); return 1; };
  win.clearTimeout = () => {}; win.setInterval = () => 0; win.clearInterval = () => {};
  const t = { id: 'tpl_1', name: 'Residential House Lease Agreement', category: 'other', folder: null };
  Object.assign(win, {
    esc: s => String(s == null ? '' : s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch])),
    icon: n => `<svg data-i="${n}"></svg>`, toast: (m, k) => log.toasts.push([String(m), k]),
    openModal: () => {}, closeModal: () => {}, confirmDialog: async () => true,
    state: { contracts: [], settings: {}, aiConfigured: true, view: 'templates' },
    API_MODE: () => true, canEdit: () => true, isAdmin: () => true, currentUser: () => ({ id: 'u1', name: 'Amina Otieno', role: 'admin' }),
    copilotAvailable: () => true, setView: () => {},
    api: async (p, method, body) => {
      log.api.push([p, method || 'GET', body]);
      if (p === 'templates/tpl_1') return { template: { ...t } };
      if (p === 'templates/tpl_1/versions/tv_1' && method === 'PUT') return { ok: true };
      if (p === 'templates/tpl_1/versions/tv_1') return { version: { versionNumber: 1, status: 'draft' }, blocks: blocks.map((b, i) => ({ orderIndex: i, blockType: b[0], content: b[1] })), fields: [] };
      if (p === 'org/branding') return { branding: { logoUrl: null, companyName: 'Highland Corporate Ltd' } };
      if (p === 'ai/section') return sectionAi(body);
      if (p === 'ai/blanks') return { items: [] };
      throw new Error('unexpected api call: ' + p);
    },
  });
  const ctx = dom.getInternalVMContext();
  for (const f of ['js/i18n.js', 'js/jurisdiction.js', 'js/section.js', 'js/components.js', 'js/fieldlib.js', 'js/clausemodel.js', 'js/playbook.js', 'js/uploadblanks.js', 'js/templateform.js', 'js/views/templatebuilder.js'])
    runFileInContext(path.join(ROOT, f), ctx, f);
  win.__log = log; win.__run = code => vm.runInContext(code, ctx);
  return win;
}
const settle = async (n = 30) => { for (let i = 0; i < n; i++) await new Promise(r => setImmediate(r)); };
const LEASE = [['heading', 'Parties and Property'], ['field_group', ''], ['heading', 'Term of Lease'], ['field_group', ''],
  ['heading', 'Rent and Deposit'], ['fixed_text', 'The Tenant shall pay rent on the first day of each month.'], ['heading', 'Repairs and Maintenance'], ['field_group', '']];

test('f1202 (1) the Builder\'s top bar: one row, the name on one line, one grey line under it, quiet words', () => {
  const h = fnBody(TB, 'tbHeadHtml');
  assert.match(h, /<span class="tb-hname"><button type="button" class="tb-tname"/);
  assert.match(h, /<span class="tb-hsub"><span class="tb-chipv">\$\{i18t\('tb_v_draft'[\s\S]*<span id="tb-dirtyslot" class="tb-hdirty">\$\{tbDirtyHtml\(\)\}<\/span>/, 'the draft and where it is kept, under the name');
  assert.match(h, /<span class="tb-hdiv" aria-hidden="true"><\/span>/, 'a thin divider');
  assert.equal((TB.match(/id="tb-dirtyslot"/g) || []).length, 1, 'still ONE slot');
  assert.match(CSS, /html\.lg-new #tb-page \.tb-head \.tb-tname \.v\{display:block;-webkit-line-clamp:unset;white-space:nowrap;overflow:hidden;text-overflow:ellipsis/, 'one line, never two');
  assert.match(CSS, /html\.lg-new #tb-page \.tb-head \.tb-fchip,html\.lg-new #tb-page \.tb-head \.tb-fchip\.empty\{[^}]*border:0;[^}]*background:none/, 'no boxed chips');
  assert.match(CSS, /html\.lg-new #tb-page \.tb-head \.tb-fchip\.empty::before\{content:"";[^}]*background:var\(--st-amber-dot\)\}/, 'an unchosen stream an amber dot');
  assert.ok(!/tb-head \.tb-chipv\{height:22px;padding:0 9px;border-radius:999px;background:var\(--st-gray-bg\)/.test(CSS), 'the grey badge is gone');
});

test('f1202 (2) a template\'s page: the desk, the zoom, one row, More ▾ and one black button', () => {
  const p = fnBody(TL, 'openTemplateLibDetail');
  assert.match(p, /<section class="tpl-dt-paper" id="tpl-dt-desk">[\s\S]*window\.rlPaperZoomHtml\(\)[\s\S]*<div class="tpl-dt-sheet" id="tpl-dt-zoom">/, 'the paper carries the zoom');
  assert.match(read('js/views/negotiation.js'), /if \(window\.tplDtApplyZoom\) tplDtApplyZoom\(\);/, 'and follows it');
  assert.match(CSS, /html\.lg-new #content #tpl-dt > \.tpl-dt-paper#tpl-dt-desk\{background:var\(--desk-ground\)/, 'the Dossier\'s desk');
  assert.match(fnBody(TL, 'tplLibSheetHtml'), /style="background:var\(--color-surface\);border-color:transparent/, 'a white paper');
  assert.match(p, /const blackNew = t\.status === 'published' && typeof canEdit === 'function' && canEdit\(\);/);
  assert.match(p, /editShown && blackNew \? \{ k: 'edit', label: i18t\('tl_dt_edit_builder'\)/, 'a published template\'s Edit is in More');
  assert.match(p, /\$\{editShown && !blackNew \? `<button id="tpllib-edit-wording" type="button" class="ui-btn ui-btn-primary">/, 'a draft\'s black button is Edit in the builder');
  assert.match(p, /data-ins-more aria-haspopup="true" aria-expanded="false">\$\{esc\(i18t\('tb_more'\)\)\}/, 'More ▾ replaces ⋯');
  assert.match(p, /\$\{INS \? '' : `<section class="tpl-dt-card">/, 'the version history leaves the page where the panel holds it');
});

test('f1202 (2b) the panel: Overview · Blanks · Versions; Blanks read off the stored wording', () => {
  const paint = fnBody(TL, 'tplDtPanelPaint');
  assert.match(paint, /jlTabs: \[\{ k: 'bl', label: i18t\('tb_tab_blanks'\), n: blanks\.length \}, \{ k: 'vs', label: i18t\('tl_dt_tab_vs'\), n: versions\.length \}\]/);
  assert.match(fnBody(INS, 'jlOwnPaint'), /if \(Array\.isArray\(opt\.jlTabs\) && opt\.jlTabs\.length && homeT\)\{/, 'the shared panel draws a page\'s own tabs');
  assert.match(fnBody(INS, 'jlOwnPaint'), /data-jl-tabx="_jb"><span aria-hidden="true">✦<\/span>/, 'as drawn: ✦ Jambo first');
  const ov = fnBody(TL, 'tplDtOverviewHtml');
  assert.ok(!/jamboOverviewHtml/.test(ov), 'the Overview is drawn unboxed, not as the five parts\' grey groups (owner: "built here is not right")');
  assert.match(ov, /<table class="tpl-dt-tbl is-plain">/, 'what waits as plain rows');
  const ctx = { window: {} }; vm.createContext(ctx);
  const src = TL.slice(TL.indexOf('function tplDtBlanksOf('), TL.indexOf('function tplDtKindWord('));
  vm.runInContext(src + ';this.f = tplDtBlanksOf;', ctx);
  const out = ctx.f({ fields: [{ field_key: 'start_date', label: 'Start date', field_type: 'date' }, { field_key: 'fee', label: 'Fee', field_type: 'number' }],
    blocks: [{ order_index: 1, block_type: 'heading', content: 'Lease' }, { order_index: 2, block_type: 'fixed_text', content: 'Made on {{start_date}} between us.' },
      { order_index: 3, block_type: 'heading', content: '2. Rent' }, { order_index: 4, block_type: 'fixed_text', content: 'The rent is {{fee}} a month.' }] });
  assert.equal(JSON.stringify(out.map(b => [b.key, b.where])), JSON.stringify([['start_date', ''], ['fee', '§ 2']]), 'the opening, then the heading\'s own number');
  assert.match(out[1].quote, /The rent is …/, 'the paper\'s own words before the blank');
});

test('f1202 (3) the tag names the clause by the paper\'s number; pressed, it says Contract', async () => {
  const win = builder({ blocks: [['heading', 'Lease'], ['fixed_text', 'Between the parties.']].concat(LEASE), sectionAi: () => ({ questions: [] }) });
  await win.openTemplateBuilder('tpl_1', 'tv_1'); await settle();
  win.__run("_tb.focus = tbSections()[2].k; tbPaintRail();");
  const tag = () => win.document.querySelector('[data-tb-scope]');
  assert.ok(tag(), 'the tag is a button');
  assert.equal(tag().querySelector('.w').textContent, win.i18t('tb_tag_clause', { n: '2' }), 'Clause 2, the paper\'s own number');
  tag().click(); await settle();
  assert.equal(tag().querySelector('.w').textContent, win.i18t('tb_tag_contract'));
  assert.equal(tag().getAttribute('aria-pressed'), 'true');
  tag().click(); await settle();
  assert.equal(tag().querySelector('.w').textContent, win.i18t('tb_tag_clause', { n: '2' }), 'pressed again, back to the clause');
});

test('f1202 (3b) Contract: he asks first, drafts every empty section as a card, writes nothing until Apply', async () => {
  const asked = [];
  const win = builder({ blocks: LEASE, sectionAi: b => { asked.push(b); return b.ask
    ? { questions: [{ question: 'How is the rent paid?', options: ['Monthly, in advance', 'Quarterly'], usual: 0 }] }
    : { text: `The ${b.heading} wording: rent monthly in advance.`, note: '' }; } });
  await win.openTemplateBuilder('tpl_1', 'tv_1'); await settle();
  const before = win.__run('JSON.stringify(_tb.blocks.map(b => b.content))');
  win.__run('tbScopeToggle()'); await settle();
  win.document.getElementById('tb-ask').value = 'Write the whole lease: a family home, two years.';
  win.document.querySelector('[data-tb-send]').click(); await settle();
  assert.equal(asked[0].ask, true, 'he asks first');
  assert.equal(asked[0].sections.length, 4, 'with the paper\'s headings');
  const q = win.document.querySelector('.tb-wq-q');
  assert.ok(q, 'the first question is drawn');
  assert.match(q.textContent, /already written/, 'the keep-or-rewrite question comes first, without AI');
  win.document.querySelector('[data-tb-wopt="0"]').click(); await settle();
  assert.equal(win.document.querySelector('.tb-wq-q').textContent, 'How is the rent paid?');
  assert.ok(win.document.querySelector('[data-tb-wopt="0"] .s'), 'his usual pick is marked');
  win.document.querySelector('[data-tb-wnext]').click(); await settle(80);
  const writes = asked.filter(b => !b.ask);
  assert.deepEqual(writes.map(b => b.heading), ['Parties and Property', 'Term of Lease', 'Repairs and Maintenance'], 'every EMPTY section, the written one kept');
  assert.match(writes[0].sentence, /How is the rent paid\?: Monthly, in advance/, 'the answers ride with each section');
  assert.equal(win.__run('JSON.stringify(_tb.blocks.map(b => b.content))'), before, 'NOTHING written yet');
  assert.equal(win.document.querySelectorAll('.tb-wprop').length, 3, 'each draft shown in place on the paper');
  assert.ok(win.document.querySelector('[data-tb-wall]'), 'Apply all is offered');
  win.document.querySelector('[data-tb-wall]').click(); await settle(80);
  const after = JSON.parse(win.__run('JSON.stringify(tbSections().map(s => tbSectionText(s)))'));
  assert.match(after[0], /Parties and Property wording/, 'applied through the one writer');
  assert.equal(after[2], 'The Tenant shall pay rent on the first day of each month.', 'the kept section untouched');
  assert.equal(win.document.querySelectorAll('.tb-wprop').length, 0, 'nothing waits on the paper any more');
});

test('f1202 (3c) Discard all writes nothing; no key is said, never silent', async () => {
  const win = builder({ blocks: LEASE, sectionAi: b => b.ask ? { questions: [] } : { text: 'Wording.', note: '' } });
  await win.openTemplateBuilder('tpl_1', 'tv_1'); await settle();
  const before = win.__run('JSON.stringify(_tb.blocks.map(b => b.content))');
  win.__run("tbScopeToggle(); tbWholeStart('Write it all')"); await settle();
  win.document.querySelector('[data-tb-wopt="0"]').click(); await settle(80);
  win.document.querySelector('[data-tb-wdrop]').click(); await settle();
  assert.equal(win.__run('JSON.stringify(_tb.blocks.map(b => b.content))'), before);
  assert.equal(win.document.querySelectorAll('.tb-wprop').length, 0);
  win.copilotAvailable = () => false;
  win.__run("_tb.whole = null; tbWholeStart('Write it all')"); await settle();
  assert.ok(win.document.querySelector('.tb-w-say.is-amber'), 'no key: said in amber where he would have answered');
});

test('f1202 (3d) the server asks at most three questions, writes nothing, and never invents one', () => {
  const h = SRV.slice(SRV.indexOf("app.post('/api/ai/section'"), SRV.indexOf("/* ---------- Jambo writes a standard"));
  assert.match(SRV, /const SECTION_SENTENCE_MAX = 2000, SECTION_TEXT_MAX = 2400, SECTION_ASK_MAX = 3;/);
  assert.match(h, /if \(b\.ask === true\) \{/);
  assert.match(h, /If nothing needs asking, return an empty list\./);
  assert.match(h, /Never ask for a name, an address or a figure/);
  assert.match(h, /\.filter\(q => q\.question && q\.options\.length >= 2\)/, 'a question with no answers to pick is dropped');
});

test('f1202 (4) every new word in both books', () => {
  const keys = ['tb_tag_contract', 'tb_tag_clause', 'tb_w_title', 'tb_w_ph', 'tb_wq_keep_a', 'tb_wq_keep_b', 'tb_w_before', 'tb_w_usual', 'tb_w_other',
    'tb_w_stop', 'tb_w_one', 'tb_w_discard_all', 'tb_w_next', 'tb_w_written_of', 'tl_dt_edit_builder', 'tl_dt_tab_vs', 'tl_dt_waits', 'tl_dt_th_blank', 'tl_dt_blanks_foot'];
  for (const k of keys) assert.equal((I18N.match(new RegExp('\\n\\s*' + k + ':', 'g')) || []).length, 2, k + ' in both books');
});
