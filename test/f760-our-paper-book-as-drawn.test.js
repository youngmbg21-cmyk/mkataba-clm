'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f760 — OUR PAPER'S BOOK AS DRAWN (round 21 of the redesign, "Paper first",
   scene a — every drawn part on the owner's "build all the gaps", 18 Oct 2026;
   js/views/library.js)
   (1) ONE READING PER TEMPLATE (tplPfTally): the contracts drafted from it in
       12 months, those a playbook read, those that came back changed, and per
       standard how often — one contract one vote per standard.
   (2) A company standard's contracts are found by libraryTemplateId too
       (templateUsage) — so "used 14 times" and "5 came back changed" can be
       said of our own paper at all.
   (3) The index's shelves: the chosen one's open, the others one line; the
       reader's press wins; a find opens them all.
   (4) A blank on the template's own paper reads as a blank, never a box
       (tplPfBlanksHtml).
   (5) The page's frame: the facts line beside the name, a count on each tab
       (paperTabsHtml too), ONE Jambo's panel for the page outside both tabs,
       the shared panel takes a headless item (head:false).
   (6) The template's verbs: Open in the builder · Draft from it — the ONE New
       agreement form, greyed on a draft.
   (7) The words, in both books.
   AT THE PARENT (gaps/A1, d2a4eb4) every test here FAILS.
   The browser half: test/chromium/our-paper-as-drawn-verify.js.
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const LIB = R('js/views/library.js');
const INS = R('js/views/inspector.js');
const I18N = R('js/i18n.js');
const fnBody = (src, name) => { const i = src.indexOf('function ' + name + '('); if (i < 0) return ''; return src.slice(i, src.indexOf('\n}', i) + 2); };
const BOOKS = (() => {
  const en = {}, sv = {};
  for (const m of I18N.matchAll(/^\s+([a-z][a-z0-9_]*): ["']((?:[^"'\\]|\\.)*)["'],?\s*$/gm)){
    if (!(m[1] in en)) en[m[1]] = m[2]; else if (!(m[1] in sv)) sv[m[1]] = m[2];
  }
  return { en, sv };
})();
const run = (names, extra) => { const ctx = Object.assign({ Date, Map, Set, String, Number, Array, JSON }, extra || {}); vm.createContext(ctx);
  vm.runInContext(names.map(n => fnBody(LIB, n) || (() => { throw new Error('missing ' + n); })()).join('\n'), ctx); return ctx; };
const DAY = 864e5;

describe('f760 (1) one reading per template', () => {
  const now = Date.UTC(2026, 9, 19);
  const V = (cat, st) => ({ category: cat, status: st });
  const cs = [
    { id: 'a', at: now - 10 * DAY, playbook: { verdicts: [V('Liability cap', 'deviation'), V('Payment terms', 'deviation'), V('Liability cap', 'missing')] } },
    { id: 'b', at: now - 40 * DAY, playbook: { verdicts: [V('Liability cap', 'deviation'), V('Payment terms', 'aligned')] } },
    { id: 'c', at: now - 100 * DAY, playbook: { verdicts: [V('Liability cap', 'aligned')] } },
    { id: 'd', at: now - 200 * DAY },
    { id: 'e', at: now - 400 * DAY, playbook: { verdicts: [V('Liability cap', 'deviation')] } },
  ];
  test('1a used, checked and changed over the last 12 months; per standard, one contract one vote, most first', () => {
    const ctx = run(['tplPfTally'], { TPL_PF_DAYS: 365 });
    const t = ctx.tplPfTally(cs, { now, raisedAt: c => c.at });
    assert.equal(t.used, 4, 'the one raised 400 days ago is outside the 12 months');
    assert.equal(t.checked, 3, 'a contract no playbook read is not counted as checked');
    assert.equal(t.changed, 2);
    assert.deepEqual(JSON.parse(JSON.stringify(t.byCat.map(x => [x.category, x.n, x.ids]))), [['Liability cap', 2, ['a', 'b']], ['Payment terms', 1, ['a']]]);
  });
  test('1b a contract whose day is unknown is not counted, never guessed', () => {
    const ctx = run(['tplPfTally'], { TPL_PF_DAYS: 365 });
    assert.equal(ctx.tplPfTally([{ id: 'x' }], { now, raisedAt: () => null }).used, 0);
  });
  test('1c the window is said as "12 months" and is ONE constant', () => {
    assert.match(LIB, /const TPL_PF_DAYS = 365;/);
    assert.match(fnBody(LIB, 'tplPfStats'), /tplRowContracts\(\{ kind:card\.kind, id:card\.id \}\)/, 'the page\'s one reading of which contracts came from a template');
  });
});

describe('f760 (2) our own paper\'s contracts', () => {
  test('2a templateUsage reads libraryTemplateId, which POST /api/templates/:id/contracts writes', () => {
    const ctx = run(['templateUsage'], { state: { contracts: [{ id: 'm1', libraryTemplateId: 'tpl_1' }, { id: 'm2', templateId: 'tpl_1' }, { id: 'm3', libraryTemplateId: 'tpl_2' }] } });
    assert.deepEqual(JSON.parse(JSON.stringify(ctx.templateUsage('tpl_1').rows.map(c => c.id))), ['m1', 'm2']);
    assert.match(R('server/server.js'), /templateId: t\.id, templateVersionId: pub\.id, templateName: t\.name,/);
  });
});

describe('f760 (3) the shelves fold', () => {
  test('3a the chosen template\'s shelf is open; the reader\'s press wins; a find opens them all', () => {
    const ctx = run(['tplPfShelfOpen'], { _tplPf: { q: '', open: {} } });
    assert.equal(ctx.tplPfShelfOpen('company', { kind: 'company' }), true);
    assert.equal(ctx.tplPfShelfOpen('builtin', { kind: 'company' }), false);
    ctx._tplPf.open = { builtin: true, company: false };
    assert.equal(ctx.tplPfShelfOpen('builtin', { kind: 'company' }), true);
    assert.equal(ctx.tplPfShelfOpen('company', { kind: 'company' }), false, 'pressed again it folds');
    ctx._tplPf.q = 'nda'; assert.equal(ctx.tplPfShelfOpen('sample', { kind: 'company' }), true);
  });
  test('3b a shelf is a line that opens (a button with aria-expanded); a folded one draws no rows; kept through a refresh', () => {
    const pf = fnBody(LIB, 'tplPfHtml');
    assert.match(pf, /class="tpl-pf-g" data-tpl-pf-shelf="\$\{_tplEsc\(g\.k\)\}" aria-expanded=/);
    assert.match(pf, /if \(!open\) return head;/);
    assert.match(fnBody(LIB, 'tplPlace'), /open:Object\.assign\(\{\}, _tplPf\.open\|\|\{\}\)/);
    assert.match(fnBody(LIB, 'tplPlacePut'), /_tplPf\.pick=p\.pick/);
  });
});

describe('f760 (4) a blank reads as a blank', () => {
  test('4a every form box becomes its label (or the answer it starts with), escaped; no <input> is left', () => {
    const ctx = run(['tplPfBlanksHtml'], { _tplEsc: s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'),
      i18t: (k, p) => k + (p && p.v ? ':' + p.v : '') });
    const html = 'made on <input readonly="" tabindex="-1" type="date" value="" data-field="effDate" class="field field-date"> with <input readonly type="text" value="" placeholder="Counterparty name" data-sync="counterparty" class="field"> at <input readonly type="number" value="12" placeholder="" data-field="margin" class="field field-num">%';
    const out = ctx.tplPfBlanksHtml(html, k => (k === 'effDate' ? 'Start <date>' : ''));
    assert.ok(!/<input/.test(out));
    assert.match(out, /<span class="tpl-pf-blank" data-field-key="effDate" title="lib_pf_blank_t">Start &lt;date&gt;<\/span>/);
    assert.match(out, /data-field-key="counterparty"[^>]*>Counterparty name<\/span>/);
    assert.match(out, /<span class="tpl-pf-blank has-v" data-field-key="margin" title="lib_pf_blank_t_v:12">12<\/span>/);
  });
  test('4b the paper is still the one renderer\'s, the blanks turned after it; a company standard is drawn by templateFormDocHtml', () => {
    const p = fnBody(LIB, 'tplPfPaperHtml');
    assert.match(p, /fillPreviewHtml\('builtin', \{ tid: card\.id \}\)/);
    assert.match(p, /if \(html\) html = tplPfBlanksHtml\(html, tplPfLabels\(card\)\);/);
    assert.match(fnBody(LIB, 'tplPfDocLoad'), /templateFormDocHtml\(\{ blocks:full\.blocks/);
    assert.match(R('index.html'), /\.tpl-pf-sheet \.tpl-pf-blank,\.tpl-pf-sheet \.hati-field\{[^}]*border-bottom:1px dashed var\(--st-amber-dot\)/);
  });
});

describe('f760 (5) the page\'s frame', () => {
  const page = fnBody(LIB, 'renderTemplatesPage');
  test('5a the facts line beside the name; the three figures are not drawn', () => {
    assert.match(page, /<span class="tpl-hd-n">\$\{esc\(i18tn\('lib_pf_h_n',hf\.n,\{n:hf\.n\}\)\)\}<\/span><\/h1>/);
    assert.match(page, /<span class="tpl-hd-sub" data-tpl-hd-sub>\$\{esc\(i18tn\('lib_pf_h_sub',hf\.used,\{n:hf\.used,c:hf\.changed\}\)\)\}<\/span>/);
    assert.ok(!/tplBookGlanceHtml\(ov\)/.test(page));
  });
  test('5b a count on each of the three tabs, on this page and on Our standards\' row', () => {
    assert.match(page, /data-tpl-tab="book"[^\n]*<span class="st-tab-n">\$\{hf\.n\}<\/span>/);
    assert.match(page, /data-paper-tab="standards"[^\n]*stdN!=null\?`<span class="st-tab-n">\$\{stdN\}<\/span>`/);
    assert.match(fnBody(LIB, 'paperTabsHtml'), /n\[k\]!=null\?`<span class="st-tab-n">\$\{n\[k\]\}<\/span>`/);
  });
  test('5c ONE Jambo\'s panel for the page, outside both tabs; each tab paints it', () => {
    const asideAt = page.indexOf('<aside id="ins-panel"');
    assert.ok(asideAt > page.indexOf('data-tpl-sec="list"'), 'after the list\'s section');
    assert.ok(!page.slice(page.indexOf('<section data-tpl-sec="list"'), asideAt).includes('ins-panel" class'), 'not inside it');
    assert.match(fnBody(LIB, 'tplPageSetTab'), /if\(k==='book'\) tplPfPanelPaint\(\);/);
    assert.match(fnBody(LIB, 'tplPfPanelPaint'), /head:false, jlWord:card\.name, body:tplPfJamboHtml\(card, read\)/);
    assert.match(INS, /item \? \(\(opt\.head === false \? '' : insItemHeadHtml\(opt\.head \|\| \{\}\)\) \+ \(opt\.body \|\| ''\)\)/);
  });
});

describe('f760 (6) the template\'s verbs', () => {
  test('6a Open in the builder (our own paper) and Draft from it — the ONE New agreement form, with the template chosen', () => {
    const v = fnBody(LIB, 'tplPfVerbs');
    assert.match(v, /out\.push\(\{ k:'builder', label:i18t\('lib_pf_open_builder'\), run:\(\) => tplLibEdit\(card\.id\) \}\)/);
    assert.match(v, /run:\(\) => openNewAgreement\(\{ pick:\{ kind:pick, id:card\.id \} \}\)/);
    assert.match(v, /const pick = card\.kind === 'company' \? 'lib' : card\.kind === 'cp' \? 'mine' : card\.kind === 'builtin' \? 'tid' : null;/);
    assert.match(R('js/wizard.js'), /const want=o\.pick&&rows\(\)\.find\(r=>r\.kind===o\.pick\.kind&&String\(r\.id\)===String\(o\.pick\.id\)\);/, 'the form knows these three kinds');
  });
  test('6b a draft standard cannot be drafted from: the button greys with its reason and presses nothing', () => {
    assert.match(fnBody(LIB, 'tplPfVerbs'), /const shut = card\.kind === 'company' && card\.draft;/);
    assert.match(fnBody(LIB, 'tplPfHtml'), /\$\{a\.off \? ` disabled title="\$\{_tplEsc\(a\.why \|\| ''\)\}"` : ''\}/);
    assert.match(fnBody(LIB, 'tplBookWire'), /if\(a&&a\.run&&!a\.off\) a\.run\(\);/);
  });
});

describe('f760 (7) the words', () => {
  test('7a every new word is in both books', () => {
    const keys = ['lib_pf_v_draft', 'lib_pf_draft_pill', 'lib_pf_blank_t', 'lib_pf_blank_t_v', 'lib_pf_blank_value', 'lib_pf_reading', 'lib_pf_empty',
      'lib_pf_used12_one', 'lib_pf_used12_other', 'lib_pf_updated', 'lib_pf_updated_by', 'lib_pf_started', 'lib_pf_started_by', 'lib_pf_open_builder',
      'lib_pf_draft_from', 'lib_pf_draft_shut', 'lib_pf_h_n_one', 'lib_pf_h_n_other', 'lib_pf_h_sub_one', 'lib_pf_h_sub_other', 'lib_pf_changed_list'];
    for (const k of keys) for (const lang of ['en', 'sv']) assert.ok(BOOKS[lang][k], k + ' ' + lang);
    assert.equal(BOOKS.en.lib_pf_used12_other, 'used {n} times in 12 months');
    assert.equal(BOOKS.en.lib_pf_open_builder, 'Open in the builder');
    assert.equal(BOOKS.en.lib_pf_draft_from, 'Draft from it');
  });
});
