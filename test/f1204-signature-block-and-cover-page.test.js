'use strict';
/* f1204 — HOW OUR CONTRACTS LOOK, ROUND 3: THE SIGNATURE BLOCK AND THE COVER PAGE (owner, 24 Nov 2026)
   CLAUSE NUMBERING IS NOT A LOOK: HaTi keeps every clause number IN the wording (live numbering is renumbering of the
   stored text at round boundaries, js/negotiation.js N3), so a look that drew other numbers would print words the
   contract does not say, and its cross-references would not follow. Asked for, the sentence reader says so and
   changes nothing. Built:
   (1) one cleaner for both sides of the wire: the block's layout and lines, the cover on and counted — said only where
       set, so a look from before carries exactly the keys it had
   (2) the server validates them (400 on what it does not know) and keeps them, the company's and a stream's
   (3) the cover page: page one of the signing copy, outside the wording, before the letterhead; no header, footer or
       number on it; the numbers start after it unless counted; the sealed PDF does the same
   (4) the signature block: stacked or side by side, labelled lines under each rule; the rules, their order and the
       anchor unchanged, so every signature box is the same box; nothing set = byte-identical
   (5) the Word file: the cover as the paper's own lines and a page break, Word's title page and a count less one;
       the wording read back unchanged
   (6) the wording, the sealed text, the clause ids and the cross-references are unchanged by every setting
   (7) the page: two rows with their edit places and pins, "Cover" in the thumbs, the reader, the quality check
   (8) every new word in both books */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const H = require('./helpers');
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const J = x => JSON.parse(JSON.stringify(x));
const br = require('../js/branding.js');

test('f1204 (1) one cleaner: the block and the cover, said only where set', () => {
  assert.deepEqual(br.SIG_LAYOUTS, ['columns', 'stacked']); assert.deepEqual(br.SIG_LINES, ['name', 'title', 'date', 'place']);
  const m = br.pageMarksClean({ sigLayout: 'stacked', sigLines: ['date', 'name'], coverOn: true, coverCounts: false, x: 1 }).marks;
  assert.deepEqual(m, { headerText: '', headerPos: null, pageNumPos: null, pageNumFmt: null, sigLayout: 'stacked', sigLines: ['name', 'date'], coverOn: true, coverCounts: false });
  assert.match(br.pageMarksClean({ sigLayout: 'grid' }).error, /signature block/);
  assert.match(br.pageMarksClean({ sigLines: ['name', 'shoe size'] }).error, /signature block/);
  assert.match(br.pageMarksClean({ sigLines: 'name' }).error, /list/);
  assert.deepEqual(br.pageMarksClean({ pageNumPos: 'off' }).marks, { headerText: '', headerPos: null, pageNumPos: 'off', pageNumFmt: null }, 'a look from before carries the keys it had');
  assert.equal(br.pageMarksClean({ coverOn: false }).marks, null, 'a cover off and nothing else is nothing set');
});

describe('f1204 (2) the server validates and keeps them', () => {
  let h, admin;
  before(async () => {
    h = await H.startHati({ HATI_AGENTS_AUTO: 'off' }); await H.seedWorkspace(h, { approvalRules: [] });
    admin = h.client('admin'); await admin.json('/api/login', { method: 'POST', body: { email: 'admin@example.co.ke', password: 'adminpassword1' } });
  });
  after(async () => { if (h) await h.stop(); });
  test('a layout or a line it does not know is a 400; the company\'s and a stream\'s are kept', async () => {
    assert.equal((await admin.raw('/api/org/branding', { method: 'PUT', body: { pageMarks: { sigLayout: 'grid' } } })).status, 400);
    assert.equal((await admin.raw('/api/org/branding', { method: 'PUT', body: { pageMarks: { sigLines: ['nickname'] } } })).status, 400);
    assert.equal((await admin.raw('/api/org/branding', { method: 'PUT', body: { designId: 'classic-letterhead', pageMarks: { sigLayout: 'stacked', sigLines: ['title', 'name'], coverOn: true } } })).status, 200);
    const got = await admin.json('/api/org/branding');
    assert.deepEqual(got.branding.pageMarks, { headerText: '', headerPos: null, pageNumPos: null, pageNumFmt: null, sigLayout: 'stacked', sigLines: ['name', 'title'], coverOn: true });
    assert.equal((await admin.raw('/api/org/branding', { method: 'PUT', body: { streamLooks: { proc: { designId: 'modern-minimal', pageMarks: { coverOn: 'yes', sigLayout: 'x' } } } } })).status, 400);
    assert.equal((await admin.raw('/api/org/branding', { method: 'PUT', body: { streamLooks: { proc: { designId: 'modern-minimal', pageMarks: { coverOn: true, coverCounts: true } } } } })).status, 200);
    assert.equal((await admin.json('/api/org/branding')).streamLooks.proc.pageMarks.coverCounts, true);
  });
});

function pagesWorld(db) {
  const ctx = Object.assign({}, br, { console });
  ctx.window = ctx; ctx.resolveDocBranding = () => db; ctx.isUpload = c => c && c.source === 'upload';
  ctx.contractParty = () => 'Highland'; ctx.FIRST_PARTY = 'Highland';
  vm.createContext(ctx); vm.runInContext(read('js/pages.js'), ctx, { filename: 'pages.js' });
  return ctx;
}
const DIMS = { W: 794, bl: 0, bt: 0, br: 0, mT: 64, mB: 88, pL: 84, pR: 84 };
const look = pm => br.normalizeDesignBranding({ designId: 'modern-minimal', companyName: 'Highland', footerText: 'Confidential', pageMarks: pm });

test('f1204 (3) the cover page: page one, outside the wording, the numbers after it', () => {
  const P = pagesWorld(look({ coverOn: true, pageNumPos: 'right' }));
  const c = { id: 'C-1', contractNo: 'MK-449', name: 'Equipment Lease', counterparty: 'Saw Sawa LLC' };
  const html = P.pagesCoverHtml(c);
  assert.match(html, /^<section class="pg-cover" data-pg-keep data-pg-cover/);
  assert.match(html, /<div class="pg-cover-title">Equipment Lease<\/div>/);
  assert.match(html, /Between Highland and Saw Sawa LLC/); assert.match(html, /Reference MK-449/); assert.match(html, /Date: ______________/);
  assert.match(P.pagesCoverHtml(Object.assign({}, c, { effectiveDate: '2026-12-01' })), /Date: 2026-12-01/);
  assert.equal(P.pagesCoverHtml({ id: 'U', source: 'upload', name: 'Theirs' }), '', 'their paper is never dressed');
  assert.equal(pagesWorld(look({ pageNumPos: 'right' })).pagesCoverHtml(c), '', 'off by default');
  const mk = J(P.pagesMarksFor(c)), o = { mode: 'sign', marks: mk, running: 'Highland', foot: (l, k, n) => P.pagesSignFoot(c, l, k, n) };
  assert.deepEqual(J(P._pgFurniture(o, 0, 4, 0, 1122, DIMS)), [], 'no header, footer or number on the cover');
  const p2 = P._pgFurniture(o, 1, 4, 0, 1122, DIMS).join('');
  assert.match(p2, />Page 1 of 3</, 'the numbers start after the cover'); assert.doesNotMatch(p2, /pg-run/, 'the letterhead page carries no running head');
  assert.match(P._pgFurniture(o, 2, 4, 0, 1122, DIMS).join(''), /pg-run/);
  const Pc = pagesWorld(look({ coverOn: true, coverCounts: true, pageNumPos: 'right' }));
  assert.match(Pc._pgFurniture(Object.assign({}, o, { marks: J(Pc.pagesMarksFor(c)), foot: (l, k, n) => Pc.pagesSignFoot(c, l, k, n) }), 1, 4, 0, 1122, DIMS).join(''), />Page 2 of 4</, 'counted, when the look counts it');
  const C = read('js/views/contract.js'), i = C.indexOf('function signCopySheetHtml('), f = C.slice(i, C.indexOf('\nfunction ', i + 10));
  assert.match(f, /\$\{\(!theirs&&window\.pagesCoverHtml\)\?pagesCoverHtml\(c\):''\}\s*\$\{head\}\s*<article/, 'before the letterhead, outside the article that holds the wording');
  const S = read('server/server.js');
  assert.match(S, /const cvm = \(b && b\.pageMarks && b\.pageMarks\.coverOn === true\) \? b\.pageMarks : null;/, 'the sealed PDF: the cover the look was signed in');
  assert.match(S, /if \(cvSkip && i0 === 0\) return;/);
  assert.match(read('index.html'), /\.pg-cover\{height:950px;[^}]*break-after:page/, 'the page-maker breaks after it');
});

/* rlPaperFootHtml, the one builder of the signature lines, run with what it reads */
function footWorld(db) {
  const N = read('js/views/negotiation.js');
  const i = N.indexOf('function rlPaperFootHtml('), f = N.slice(i, N.indexOf('\n}\n', i) + 2);
  const P = pagesWorld(db);
  const ctx = { window: P, PARTY_SIDE_OURS: 'ours', i18t: (k, v) => k === 'ng_signed_for' ? 'Signed for ' + v.who : k,
    _ne: s => String(s), _ngOurParty: () => 'Highland' };
  vm.createContext(ctx); vm.runInContext(f, ctx);
  return ctx;
}

test('f1204 (4) the signature block: stacked or side by side, labelled lines; the same boxes; nothing set = as it was', () => {
  const c = { id: 'C-1', name: 'Lease', counterparty: 'Saw Sawa LLC' };
  const plain = footWorld(look(null)).rlPaperFootHtml(c);
  const set = footWorld(look({ sigLayout: 'stacked', sigLines: ['name', 'title', 'date'] })).rlPaperFootHtml(c);
  assert.equal(plain, footWorld(null).rlPaperFootHtml(c), 'no look: byte-identical');
  assert.match(set, /^<div class="rl-paper-foot is-stacked" aria-hidden="true">/);
  assert.equal((set.match(/class="rl-sigline"/g) || []).length, 2, 'one line per party, as before');
  assert.equal((set.match(/class="rl-sigrule"/g) || []).length, 2);
  assert.match(set, /Signed for Highland<\/span><div class="rl-siglines"><div class="rl-sigrow">sig_ln_name: /);
  assert.ok(set.indexOf('Signed for Highland') < set.indexOf('Signed for Saw Sawa LLC'), 'ours first, then theirs: the boxes pagesSignRows reads');
  assert.doesNotMatch(set, /sig_ln_place/);
  const theirs = footWorld(look({ sigLayout: 'stacked', sigLines: ['name'] })).rlPaperFootHtml(Object.assign({}, c, { source: 'upload' }));
  assert.equal(theirs, plain, 'their paper is never dressed');
  assert.match(read('index.html'), /\.rl-sigline\.pg-signed \.rl-siglines\{display:none\}/, 'a signed line shows the signature, never blanks');
});

test('f1204 (5) the Word file: the cover as the paper\'s own lines, Word\'s title page, a count less one', () => {
  const D = require('../js/docx.js');
  const P = pagesWorld(look({ coverOn: true, pageNumPos: 'right' }));
  const c = { id: 'C-1', contractNo: 'MK-449', name: 'Equipment Lease', counterparty: 'Saw Sawa LLC' };
  const body = '<h2>1. Rent</h2><p>The rent is due monthly, as clause 2.1 (a) says.</p>';
  const cover = P.pagesWordCoverHtml(c);
  assert.match(cover, /<div class="rl-paper-sub">Equipment Lease<\/div>/); assert.match(cover, /<div class="rl-paper-sub hati-pb"><\/div>$/);
  const hf = J(P.pagesWordHeadFoot(c));
  assert.deepEqual(hf.cover, { counts: false });
  const out = D.docxExportTracked(cover + body, { headFoot: hf }), plain = D.docxExportTracked(body, {});
  assert.match(out.xml, /<w:pStyle w:val="HatiPaper"\/>.*Equipment Lease/, 'the paper\'s own style, read back as paper');
  assert.match(out.xml, /<w:br w:type="page"\/>/);
  assert.match(out.xml, /<w:pgNumType w:start="0"\/><w:titlePg\/><\/w:sectPr>/);
  assert.match(out.footer, /<w:instrText xml:space="preserve"> = <\/w:instrText>.*<w:instrText xml:space="preserve"> NUMPAGES <\/w:instrText>.*<w:instrText xml:space="preserve"> - 1 <\/w:instrText>/);
  assert.equal(D.docxXmlToText(out.xml).text, D.docxXmlToText(plain.xml).text, 'the wording read back is the same');
  assert.match(read('js/views/contract.js'), /const html=\(\(window\.pagesWordCoverHtml\?pagesWordCoverHtml\(c\):''\)\|\|''\)\+redlineDocHtml\(c,/);
});

test('f1204 (6) the wording, the sealed text, the clause ids and the cross-references are unchanged by every setting', () => {
  const settings = [{ coverOn: true }, { coverOn: true, coverCounts: true }, { sigLayout: 'stacked' }, { sigLines: ['name', 'title', 'date', 'place'] },
    { headerText: '{ref}', headerPos: 'left', pageNumPos: 'center', pageNumFmt: 'slash' }];
  const signed = { id: 'S-1', name: 'Signed lease', status: 'Signed', counterparty: 'X', redlineText: '<h2 data-clause-id="cl-1">1. Rent</h2><p>See clause 2.1 (a).</p>',
    execution: { html: '<p>sealed words</p>', textHash: 'abc' }, numbering: 'live', clauses: [{ id: 'cl-1', ref: '1' }] };
  const draft = Object.assign(J(signed), { id: 'D-1', status: 'Draft', execution: null });
  for (const pm of settings) {
    const P = pagesWorld(look(pm)), F = footWorld(look(pm));
    for (const c of [signed, draft]) {
      const was = JSON.stringify(c);
      P.pagesMarksFor(c); P.pagesCoverHtml(c); P.pagesWordCoverHtml(c); P.pagesWordHeadFoot(c); F.rlPaperFootHtml(c);
      const mk = P.pagesMarksFor(c);
      for (let k = 0; k < 3; k++) P._pgFurniture({ mode: 'sign', marks: mk, foot: (l, kk, n) => P.pagesSignFoot(c, l, kk, n) }, k, 3, 0, 1122, DIMS);
      assert.equal(JSON.stringify(c), was, JSON.stringify(pm) + ' leaves ' + c.id + ' exactly as it was');
    }
  }
  /* numbering asked for: said, never done */
  const W = lookWorld({ designId: 'classic-letterhead' });
  const r = J(vm.runInContext('clReadLook("numbering 1.1 (a)")', W));
  assert.deepEqual(r.got, {}, 'nothing is changed'); assert.deepEqual(r.notes, ['cl_said_numbering']);
  const N = read('js/negotiation.js');
  assert.match(N, /keeping the\s+numbers IN the stored text/, 'why: the numbers are the wording\'s own (N3)');
});

function lookWorld(lk, contracts) {
  const ctx = Object.assign({}, br, {
    i18t: (k, o) => k + (o ? ' ' + Object.values(o).join('|') : ''), i18tn: (k, n) => k + ' ' + n,
    esc: s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'),
    currentUser: () => ({ role: 'admin' }), FOLDERS: { proc: { id: 'proc', name: 'Procurement' } },
    state: { contracts: contracts || [{ id: 'MK-1', contractNo: 'MK-449', name: 'Supply', folder: 'proc', status: 'Draft' }] } });
  ctx.window = ctx; ctx.ORG_BRANDING = br.normalizeDesignBranding(Object.assign({ companyName: 'Highland' }, lk));
  ctx.ORG_STREAM_LOOKS = {}; ctx.ORG_PAPER_LOOKS = [];
  vm.createContext(ctx); vm.runInContext(read('js/views/designstep.js'), ctx); ctx.clInit();
  return ctx;
}

test('f1204 (7) the page: two rows, their edit places and pins, "Cover" in the thumbs, the reader, the check', () => {
  const W = lookWorld({ designId: 'classic-letterhead', pageMarks: { sigLayout: 'stacked', sigLines: ['name', 'date'], coverOn: true } });
  const by = Object.fromEntries(J(vm.runInContext('clParts()', W)).map(r => [r.k, r]));
  assert.match(by.sigblock.html, /cl_ls_sg_stacked/); assert.match(by.sigblock.html, /sig_ln_name, sig_ln_date/); assert.equal(by.sigblock.act.attr, 'data-cl-mode="sg"');
  assert.equal(by.cover.st, 'set'); assert.match(by.cover.html, /“Supply”/); assert.match(by.cover.html, /cl_ls_cv_not_counted/); assert.equal(by.cover.act.attr, 'data-cl-mode="cv"');
  const off = lookWorld({ designId: 'classic-letterhead' });
  const c0 = J(vm.runInContext('clParts()', off)).find(r => r.k === 'cover');
  assert.equal(c0.st, 'optional'); assert.equal(c0.act.label, 'cl_ls_add', 'Optional · Add');
  vm.runInContext('_cl.mode = "sg"', W);
  const sg = vm.runInContext('clPickHtml()', W);
  assert.match(sg, /class="cl-pill is-on" data-cl-sglay="stacked"/);
  for (const k of ['name', 'title', 'date', 'place']) assert.match(sg, new RegExp(`data-cl-sgline="${k}"`));
  vm.runInContext('_cl.mode = "cv"', W);
  const cv = vm.runInContext('clPickHtml()', W);
  assert.match(cv, /class="cl-pill is-on" data-cl-cvon="on"/); assert.match(cv, /data-cl-cvcount="yes"/);
  const D = read('js/views/designstep.js');
  assert.match(D, /if \(k === 'sigblock'\) return root\.querySelector\('\.rl-paper-foot'\);/);
  assert.match(D, /if \(k === 'cover'\) return root\.querySelector\('\.pg-cover \.pg-cover-title, \.pg-cover'\);/);
  /* RE-POINTED 24 Nov 2026 (paper alone, pages scroll, owner): no page buttons; the chooser line says Cover while it is in view */
  assert.match(D, /say\.textContent = cov && p === 1 \? i18t\('cl_ls_pv_cover'\)/, 'the preview\'s first page is the Cover');
  const r = s => J(vm.runInContext(`clReadLook(${JSON.stringify(s)}).got`, W));
  assert.deepEqual(r('cover page on'), { pageMarks: { coverOn: true } });
  assert.deepEqual(r('no cover page'), { pageMarks: { coverOn: false } });
  assert.deepEqual(r('signatures stacked'), { pageMarks: { sigLayout: 'stacked' } });
  assert.deepEqual(r('use our navy and put the logo on the left, formal legal, two columns'),
    { accentColor: '#004c78', logoPosition: 'top-left', designId: 'formal-legal', structureId: 'two-column' }, 'what it read before stands');
  const untitled = lookWorld({ designId: 'classic-letterhead', pageMarks: { coverOn: true } }, [{ id: 'MK-2', name: '', folder: 'proc', status: 'Draft' }]);
  assert.ok(J(vm.runInContext('clQuality()', untitled)).some(q => q.t === 'cl_ls_q_cover_notitle' && q.go.attr === 'data-st-ls-cl="cv"'), 'a cover with no title is said');
  assert.ok(!J(vm.runInContext('clQuality()', W)).some(q => /cover/.test(q.t)), 'nothing said when nothing is wrong');
  /* RE-POINTED 24 Nov 2026 (contract look round 5): one more part, the words on the pages */ assert.match(vm.runInContext('clTabsHtml(clParts())', W), /cl_ls_n_parts 12/);
});

test('f1204 (8) every new word in both books', () => {
  const I = read('js/i18n.js'), sv = I.indexOf('\n  sv: {'), en = I.slice(0, sv), se = I.slice(sv);
  const keys = ['cl_n_sigblock', 'cl_n_cover', 'cl_ls_sg_columns', 'cl_ls_sg_stacked', 'cl_ls_sg_noline', 'cl_ls_sg_lay', 'cl_ls_sg_lines', 'cl_ls_sg_note', 'cl_ls_on',
    'cl_ls_cv_counted', 'cl_ls_cv_not_counted', 'cl_ls_cv_no', 'cl_ls_cv_yes', 'cl_ls_cv_count_q', 'cl_ls_cv_note', 'cl_ls_q_cover_notitle', 'cl_ls_pv_cover', 'cl_ls_pv_cover_short',
    'cl_said_cover', 'cl_said_nocover', 'cl_said_sig_stacked', 'cl_said_sig_columns', 'cl_said_numbering', 'sig_ln_name', 'sig_ln_title', 'sig_ln_date', 'sig_ln_place',
    'cv_between', 'cv_and', 'cv_ref', 'cv_date', 'cv_date_blank'];
  const has = (book, k) => book.includes('\n    ' + k + ': ');
  assert.deepEqual(keys.filter(k => !has(en, k) || !has(se, k)), []);
  assert.match(read('js/handbook.js'), /\{ui:cl_n_cover\}: off until you add it/);
  assert.match(read('js/handbook.js'), /Clause numbers are not part of the look/);
});
