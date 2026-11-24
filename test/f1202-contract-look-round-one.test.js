'use strict';
/* f1202 — HOW OUR CONTRACTS LOOK, ROUND 1 OF THE LEGORA + STRIPE WAY (owner's pick 24 Nov 2026: "build it in L+S, in
   rounds"). Settings › Company › How our contracts look, from what HaTi already keeps:
   (1) two tabs carrying their counts — The page · N parts, Who wears it · N streams — and no tab of a later round
       (Brand kit, History); no dead "coming soon" control, no "Send for approval" yet
   (2) the table of parts, its four columns, its rows read off the real look (logo, letterhead from Company & market,
       style, layout, colour, type, footer), a soft badge each, and each row's link opening TODAY's picker for that part
   (3) the quality check: logo, footer, the letterhead's facts, and the colour's WCAG contrast on white (below 4.5 : 1
       is "Too faint", with its Fix; a black-and-white style says nothing about colour)
   (4) Who wears it: every stream with its look, footer, unsigned count and today's per-stream doors; Other looks folded in
   (5) the preview reads the SIGNING copy's builder on one of our own unsigned contracts (never their paper, never a
       write), page by page, with numbered pins; with none, the sample page stands in and says so
   (6) the panel: plain sections, a ring of parts set, the quality check, no money, no History; Jambo's box stays at the
       panel's foot (the shared panel painter)
   (7) every new word in both books */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const D = read('js/views/designstep.js');
const S = read('js/views/settings.js');
const I = read('js/i18n.js');
const J = x => JSON.parse(JSON.stringify(x));
const fn = (src, name) => { const i = src.indexOf('function ' + name + '('); assert.ok(i >= 0, name + ' is there'); return strip(src.slice(i, src.indexOf('\nfunction ', i + 10))); };

/* the page's own module, run with the real catalogue of designs and a company's look */
function world(look) {
  const br = require('../js/branding.js');
  const ctx = Object.assign({}, br, {
    i18t: (k, o) => k + (o ? ' ' + Object.values(o).join('|') : ''), i18tn: (k, n) => k + ' ' + n,
    esc: s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'),
    currentUser: () => ({ role: 'admin' }),
    FOLDERS: { proc: { id: 'proc', name: 'Procurement' }, sales: { id: 'sales', name: 'Sales' }, corp: { id: 'corp', name: 'Corporate' } },
    state: { contracts: [
      { id: 'MK-1', name: 'Supply', folder: 'proc', status: 'Draft' },
      { id: 'MK-2', name: 'Lease', folder: 'proc', status: 'Under Review' },
      { id: 'MK-3', name: 'Signed one', folder: 'proc', status: 'Signed' },
      { id: 'MK-4', name: 'Their paper', folder: 'sales', status: 'Draft', source: 'upload' },
      { id: 'MK-5', name: 'Distribution', folder: 'sales', status: 'Draft' }] },
  });
  ctx.window = ctx;
  ctx.ORG_BRANDING = br.normalizeDesignBranding(Object.assign({ companyName: 'Highland Corporate Ltd', address: 'Mombasa Road' }, look));
  ctx.ORG_STREAM_LOOKS = { corp: { designId: 'modern-minimal' } };
  ctx.ORG_PAPER_LOOKS = [{ id: 'T1', name: 'Our NDA', designId: 'formal-legal' }];
  vm.createContext(ctx);
  vm.runInContext(D, ctx, { filename: 'designstep.js' });
  ctx.clInit();
  return ctx;
}

test('f1202 (1) two tabs carrying their counts, and nothing of a later round', () => {
  const page = fn(D, 'clLsPageHtml'), tabs = fn(D, 'clTabsHtml');
  assert.match(D, /if \(typeof window\.stLsOn === 'function' && window\.stLsOn\(\) && typeof window\.stLsHeadHtml === 'function'\) return clLsPageHtml\(\);/);
  assert.match(tabs, /tab\('page', i18t\('cl_ls_tab_page'\), i18tn\('cl_ls_n_parts', parts\.length/);
  assert.match(tabs, /tab\('who', i18t\('cl_ls_tab_who'\), i18tn\('cl_ls_n_streams', nS/);
  assert.match(page, /badge: `<span class="apn-st is-grey cl-ls-badge">\$\{clE\(i18t\('cl_admins_only'\)\)\}<\/span>`/, 'the soft Admins only badge beside the title');
  assert.match(page, /id="cl-save" class="ui-btn ui-btn-primary"/, 'the one black button is today\'s Save');
  assert.match(page, /<form class="apn-ask sdd-find st-ls-find cl-ask" id="cl-ask"/, 'one ask box, the same sentence reader');
  const all = strip(D.slice(D.indexOf('const CL_AA'), D.indexOf('function clPageHtml()')));
  /* RE-POINTED 24 Nov 2026 (contract look round 4): the Brand kit is built now; History and the second admin are still a later round */
  assert.doesNotMatch(all, /cl_ls_tab_hist|History|Send for approval|coming soon|data-cl-hist/i, 'no tab or control of a later round');
  const ctx = world({ designId: 'classic-letterhead' });
  const h = vm.runInContext('clTabsHtml(clParts())', ctx);
  /* RE-POINTED 24 Nov 2026 (contract look round 2): two more parts, Header and Page numbers */
  /* RE-POINTED 24 Nov 2026 (contract look round 3): two more parts, Signature block and Cover page */ assert.match(h, /data-cl-tab="page">cl_ls_tab_page<i>cl_ls_n_parts 11<\/i>/);
  assert.match(h, /data-cl-tab="who">cl_ls_tab_who<i>cl_ls_n_streams 3 · cl_ls_n_papers 1<\/i>/);
  assert.match(S, /<h2 class="ctf-h stn-title sdd-title">\$\{esc\(o\.title\)\}<\/h2>\$\{o\.badge\|\|''\}/, 'the head carries the badge beside the title');
});

test('f1202 (2) the table of parts: four columns, rows from the real look, each row\'s link to today\'s picker', () => {
  const ctx = world({ designId: 'classic-letterhead', defaultFooterText: 'Confidential' });
  const parts = J(vm.runInContext('clParts()', ctx));
  /* RE-POINTED 24 Nov 2026 (contract look round 2): two more parts, Header and Page numbers */
  /* RE-POINTED 24 Nov 2026 (contract look round 3): two more parts, Signature block and Cover page */ assert.deepEqual(parts.map(r => r.k), ['logo', 'header', 'letterhead', 'style', 'layout', 'colour', 'type', 'footer', 'pagenum', 'sigblock', 'cover']);
  assert.deepEqual(parts.map(r => r.n), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  const by = Object.fromEntries(parts.map(r => [r.k, r]));
  assert.equal(by.logo.st, 'missing'); assert.match(by.logo.html, /cl_ls_no_logo/); assert.equal(by.logo.act.attr, 'data-cl-mode="g"');
  assert.equal(by.letterhead.st, 'set'); assert.match(by.letterhead.html, /“Highland Corporate Ltd · Mombasa Road”/, 'the letterhead read from Company & market, quoted');
  assert.equal(by.letterhead.act.attr, 'data-cl-company');
  assert.match(by.style.html, /Classic Letterhead/); assert.equal(by.style.act.attr, 'data-cl-mode="s"');
  assert.match(by.layout.html, /Standard Flow/); assert.equal(by.layout.act.attr, 'data-cl-mode="l"');
  assert.equal(by.colour.st, 'optional', 'a black-and-white style: the colour is optional'); assert.match(by.colour.html, /cl_mono/);
  assert.equal(by.type.st, 'set'); assert.equal(by.type.act, null, 'the type is set by the style: no door');
  assert.equal(by.footer.st, 'set'); assert.match(by.footer.html, /“Confidential”/); assert.equal(by.footer.act.attr, 'data-cl-mode="f"');
  const t = vm.runInContext('clPartsTableHtml(clParts())', ctx);
  for (const k of ['cl_ls_c_part', 'cl_ls_c_shows', 'cl_ls_c_status']) assert.ok(t.includes(`<th>${k}</th>`), k);
  assert.match(t, /<span class="cl-mk is-missing" aria-hidden="true">1<\/span>cl_n_logo/);
  assert.match(t, /<span class="apn-st is-amber">cl_ls_st_missing<\/span>/);
  /* RE-POINTED 24 Nov 2026 (contract look round 2): two more parts, Header and Page numbers */
  /* RE-POINTED 24 Nov 2026 (contract look round 3): two more parts, Signature block and Cover page */ assert.match(t, /data-cl-chip="all">ctf_tab_all <span>11<\/span>/);
  assert.match(t, /data-cl-chip="fix"><i class="apn-cd is-ruby" aria-hidden="true"><\/i>cl_ls_chip_fix <span>1<\/span>/, 'Needs fixing, with its red dot');
  assert.match(t, /data-cl-menu="stream"/, '+ Stream picks which stream\'s look is edited');
  /* the doors are today's: the pickers by mode, Company & market */
  const click = fn(D, 'clModeGo');
  assert.match(click, /if \(s === 'company'\) \{ if \(typeof openSettingsAt === 'function'\) openSettingsAt\('platform', 'company'\); return; \}/);
  assert.match(D, /if \(\(x = at\('\[data-cl-mode\]'\)\)\) \{ _cl\.mode = x\.getAttribute\('data-cl-mode'\); return clRepaint\(\); \}/);
  assert.match(fn(D, 'clLsPageHtml'), /picking \? `<div class="cl-pick cl-ls-pick">\$\{clPickHtml\(\)\}<\/div>`/, 'a part\'s link opens today\'s picker in the table\'s place');
});

test('f1202 (3) the quality check, with the colour\'s contrast on white', () => {
  const pale = world({ designId: 'modern-minimal', accentColor: '#f2c94c' });
  assert.ok(vm.runInContext('clContrastOnWhite(\'#ffffff\')', pale) === 1);
  assert.ok(Math.abs(vm.runInContext('clContrastOnWhite(\'#000000\')', pale) - 21) < 0.01, 'WCAG: black on white is 21 : 1');
  const parts = vm.runInContext('clParts()', pale);
  const colour = parts.find(r => r.k === 'colour');
  assert.equal(colour.st, 'faint', 'a pale colour the style shows is Too faint'); assert.equal(colour.act.label, 'cl_ls_fix');
  const q = vm.runInContext('clQuality()', pale);
  const faint = q.find(x => /cl_ls_q_faint/.test(x.t));
  assert.ok(faint && faint.tone === 'ruby' && faint.go.attr === 'data-st-ls-cl="c"', 'the finding, ruby, with its Fix to the colour picker');
  assert.ok(q.find(x => x.t === 'cl_no_logo' && x.go.attr === 'data-st-ls-cl="g"'), 'no logo: Upload');
  assert.ok(q.find(x => x.t === 'cl_no_footer' && x.go.attr === 'data-st-ls-cl="f"'), 'no footer: Edit');
  assert.ok(q.find(x => /cl_ls_q_lh/.test(x.t) && /cl_ls_lh_number/.test(x.t) && x.go.attr === 'data-st-ls-cl="company"'), 'the letterhead\'s missing number: Company & market');
  const navy = world({ designId: 'modern-minimal', accentColor: '#004c78', defaultFooterText: 'Confidential' });
  assert.equal(vm.runInContext('clParts()', navy).find(r => r.k === 'colour').st, 'set');
  assert.ok(vm.runInContext('clQuality()', navy).find(x => /cl_ls_q_reads/.test(x.t) && x.tone === 'green'), 'a readable colour is said green');
  const mono = world({ designId: 'classic-letterhead', accentColor: '#f2c94c' });
  assert.ok(!vm.runInContext('clQuality()', mono).some(x => /cl_ls_q_(faint|reads)/.test(x.t)), 'a black-and-white style says nothing about colour');
  /* the panel draws it, each finding with its door, and the ring of parts set */
  const p = fn(S, 'stLsLookPanel');
  assert.match(p, /window\.clPanelFacts\(\)/);
  assert.match(p, /class="cl-qc"><i class="cl-qc-dot is-\$\{tone\[q\.tone\]\|\|'grey'\}"/);
  assert.match(p, /sdd5RingHtml\(f\.set,f\.of,/);
  assert.match(p, /label:i18t\('cl_ls_p_quality'\)/);
});

test('f1202 (4) Who wears it: every stream, its look and footer, its unsigned count, today\'s doors; Other looks folded in', () => {
  const ctx = world({ designId: 'classic-letterhead', defaultFooterText: 'Confidential' });
  const rows = J(vm.runInContext('clWhoRows()', ctx));
  assert.deepEqual(rows.map(r => r.key), ['stream:proc', 'stream:sales', 'stream:corp', 'paper:T1']);
  const by = Object.fromEntries(rows.map(r => [r.key, r]));
  assert.equal(by['stream:proc'].unsigned, 2, 'a draft and one under review; the signed one is not counted');
  assert.equal(by['stream:sales'].unsigned, 1, 'their paper is not counted');
  assert.equal(by['stream:corp'].own, true); assert.equal(by['stream:corp'].look.designId, 'modern-minimal');
  assert.equal(by['stream:proc'].foot, 'Highland Corporate Ltd · Confidential');
  const h = vm.runInContext('clWhoHtml()', ctx);
  for (const k of ['cl_ls_c_stream', 'cl_ls_c_which', 'cl_ls_c_wears']) assert.ok(h.includes(`<th>${k}</th>`), k);
  assert.match(h, /<th class="r">cl_ls_c_unsigned<\/th>/);
  assert.match(h, /data-cl-edit-as="proc">cl_ls_give_own/, 'a stream that follows: Give it its own');
  assert.match(h, /data-cl-stream-edit="corp">cl_edit/, 'a stream with its own: Edit (today\'s door)');
  assert.match(h, /data-cl-paper-x="T1">cl_use_company/, 'a paper with its own look: Use the company look (Other looks, folded in)');
  assert.match(h, /data-cl-add-stream>/, '+ A look for a stream: today\'s door');
  assert.match(h, /<span class="apn-st is-violet">cl_ls_wears_own<\/span>/); assert.match(h, /<span class="apn-st is-green">cl_ls_wears_follows<\/span>/);
  assert.match(h, /<p class="cl-ls-rule">cl_ls_wins<\/p>/);
  assert.match(I, /cl_ls_wins: 'Which look wins: the paper’s own, then its stream’s, then the company’s\. Unsigned contracts follow a change; signed ones keep the look they were signed in\. The other side’s paper is never dressed\.'/);
});

test('f1202 (5) the preview: the signing copy on one of our own unsigned contracts, page by page, with numbered pins; it never writes', () => {
  const ctx = world({ designId: 'classic-letterhead' });
  assert.deepEqual(J(vm.runInContext('clPvCandidates().map(c => c.id)', ctx)), ['MK-1', 'MK-2', 'MK-5'], 'our own paper, unsigned; never their paper, never signed');
  const draw = fn(D, 'clPvDraw');
  assert.match(draw, /signCopySheetHtml\(Object\.assign\(\{\}, c, \{ branding: Object\.assign\(\{\}, clBranding\(\)\) \}\), \{ wrapId: 'cl-pv-wrap', canvasId: '' \}\)/, 'the signing copy\'s own builder, on a copy wearing the look being edited');
  assert.match(draw, /signCopyWatch\(sheet,/, 'the signing copy\'s pages and footer, from the page-maker');
  assert.match(draw, /if \(!html\) \{\s*paper\.innerHTML = clSheetHtml\(\)/, 'with none, today\'s sample page stands in');
  assert.doesNotMatch(strip(D.slice(D.indexOf('function clAfterPaint'), D.indexOf('function clEditAs'))), /saveContract|persist\(|api\(|\.branding\s*=[^=]/, 'the preview reads; it never writes the contract');
  assert.match(fn(D, 'clPreviewHtml'), /cl_ls_pv_none/, 'and says so');
  assert.match(fn(D, 'clPinsPaint'), /class="cl-pin is-\$\{r\.st\}\$\{_cl\.row === r\.k \? ' is-lit' : ''\}" data-cl-pin="\$\{r\.k\}"/, 'a pin per part, numbered as the table, lit when its row is chosen');
  assert.match(fn(D, 'clPinsPaint'), />\$\{r\.n\}<\/button>/);
  /* RE-POINTED 24 Nov 2026 (contract look round 3): a cover page is "Cover" and the pages after it count from 1 */
  assert.match(fn(D, 'clPvPagesPaint'), /i18t\('cl_ls_pv_page', \{ n: num\(i\), m: of \}\)/, 'page N of M');
  assert.match(fn(D, 'clRowChoose'), /tr\.classList\.toggle\('is-chosen'/);
  assert.match(S, /if\(_stPage==='look'&&typeof window\.clAfterPaint==='function'\) window\.clAfterPaint\(\);/, 'the preview is drawn once the page stands');
});

test('f1202 (6) the panel: no money, no History; Jambo\'s box stays at its foot', () => {
  const p = fn(S, 'stLsLookPanel');
  assert.match(p, /window\.clPanelFacts\(\)/, 'the panel reads the page\'s own facts');
  assert.match(p, /groups:\[\{ label:i18t\('cl_ls_p_quality'\), rows:\[\], html:qc \}\]/, 'plain sections: the quality check is the last one; no History');
  assert.doesNotMatch(p, /value|fmtMoney|money|currency|hist/i);
  assert.match(fn(S, 'stLsPanelPaint'), /insPaintPanel\(\{ seat:'team'/, 'the shared panel painter, which keeps Jambo\'s box at the foot');
  assert.doesNotMatch(strip(D.slice(D.indexOf('const CL_AA'), D.indexOf('function clPageHtml()'))), /fmtMoney|canViewValues|\.value\b/);
});

test('f1202 (7) every new word in both books', () => {
  const sv = I.indexOf('\n  sv: {'); assert.ok(sv > 0);
  const en = I.slice(0, sv), se = I.slice(sv);
  const keys = new Set([...(D + S).matchAll(/i18tn?\('(cl_ls_[a-z_]+)'/g)].map(m => m[1]).filter(k => !k.endsWith('_')));
  ['cl_ls_upload', 'cl_ls_fix', 'cl_ls_give_own', 'cl_ls_own_look', 'cl_ls_company_look', 'cl_ls_wears_own', 'cl_ls_wears_follows', 'cl_ls_st_set', 'cl_ls_st_missing', 'cl_ls_st_faint', 'cl_ls_st_optional'].forEach(k => keys.add(k));
  assert.ok(keys.size > 40, 'the words are read (' + keys.size + ')');
  const has = (book, k) => book.includes('\n    ' + k + ": '") || book.includes('\n    ' + k + "_one: '");
  assert.deepEqual([...keys].filter(k => !has(en, k) || !has(se, k)), [], 'in English and in Swedish');
});
