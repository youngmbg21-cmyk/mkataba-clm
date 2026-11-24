'use strict';
/* f1203 — HOW OUR CONTRACTS LOOK, ROUND 2: THE HEADER AND THE PAGE NUMBERS (owner, 24 Nov 2026)
   (1) one cleaner for both sides of the wire (js/branding.js pageMarksClean): places and formats from a list, words
       capped, unknown keys dropped; fields filled from the contract and a field with no value says nothing
   (2) the SERVER validates the company's and a stream's marks on PUT /api/org/branding, keeps what a save does not
       carry, and a stream's own marks ride with the look a new contract takes (srvLookOf)
   (3) the signing copy draws both on every page (the per-page furniture and the design's footer), the working copy's
       faded head and foot say the same words; the print and the sealed PDF carry them
   (4) the Word file we write gets a real header and footer, the number as Word's PAGE and NUMPAGES fields
   (5) the page: two rows, Header and Page numbers, each its own edit place with fields as chips; their pins; the
       sentence reader; the quality check's "No page numbers"
   (6) every new word in both books */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const H = require('./helpers');
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const J = x => JSON.parse(JSON.stringify(x));
const br = require('../js/branding.js');

test('f1203 (1) one cleaner, fields filled, a field with no value says nothing', () => {
  assert.deepEqual(br.PAGE_NUM_FORMATS, ['page-of', 'of', 'slash']);
  const ok = br.pageMarksClean({ headerText: '  {company}  · Confidential ', headerPos: 'right', pageNumPos: 'center', pageNumFmt: 'of', junk: 'x' });
  assert.equal(ok.error, null);
  assert.deepEqual(ok.marks, { headerText: '{company} · Confidential', headerPos: 'right', pageNumPos: 'center', pageNumFmt: 'of' }, 'unknown keys dropped');
  assert.equal(br.pageMarksClean({ headerText: 'x'.repeat(500), headerPos: 'left' }).marks.headerText.length, br.PAGE_HEAD_MAX, 'the words are capped');
  assert.match(br.pageMarksClean({ pageNumPos: 'top' }).error, /page numbers/);
  assert.match(br.pageMarksClean({ headerPos: 'middle', headerText: 'x' }).error, /header/);
  assert.match(br.pageMarksClean({ pageNumFmt: 'roman' }).error, /format/);
  assert.equal(br.pageMarksClean({ headerText: 'Words', headerPos: null }).marks, null, 'a header with no place is none');
  assert.equal(br.pageMarksClean(null).marks, null);
  const c = { id: 'C-9', contractNo: 'MK-449', name: 'Equipment Lease' };
  assert.equal(br.brFieldsFill('{ref} · {title} · Confidential', c, { companyName: 'Highland' }), 'MK-449 · Equipment Lease · Confidential');
  assert.equal(br.brFieldsFill('{company} · {ref} · Confidential', { id: '', name: 'X' }, {}), 'Confidential', 'no "{ref}", no stray separator');
  assert.equal(br.brPageNumberSay('slash', 2, 6), '2 / 6');
  assert.equal(br.brPageNumberSay('of', 2, 6), '2 of 6');
  assert.equal(br.brPageNumberSay(null, 2, 6), 'Page 2 of 6');
  assert.deepEqual(br.normalizeDesignBranding({ designId: 'classic-letterhead', pageMarks: { pageNumPos: 'off' } }).pageMarks,
    { headerText: '', headerPos: null, pageNumPos: 'off', pageNumFmt: null });
  /* the design's own footer fills its fields */
  const foot = br.docDesignFooterHtml(br.normalizeDesignBranding({ designId: 'modern-minimal', companyName: 'Highland', footerText: '{ref} · Confidential' }), c);
  assert.match(foot, /Highland · MK-449 · Confidential/); assert.doesNotMatch(foot, /\{ref\}/);
});

describe('f1203 (2) the server validates and keeps the marks', () => {
  let h, admin;
  before(async () => {
    h = await H.startHati({ HATI_AGENTS_AUTO: 'off' }); await H.seedWorkspace(h, { approvalRules: [] });
    admin = h.client('admin'); await admin.json('/api/login', { method: 'POST', body: { email: 'admin@example.co.ke', password: 'adminpassword1' } });
  });
  after(async () => { if (h) await h.stop(); });
  test('a place or a format it does not know is a 400; unknown keys are dropped; absent keeps what is stored', async () => {
    assert.equal((await admin.raw('/api/org/branding', { method: 'PUT', body: { pageMarks: { pageNumPos: 'top' } } })).status, 400);
    assert.equal((await admin.raw('/api/org/branding', { method: 'PUT', body: { pageMarks: { pageNumFmt: 'roman' } } })).status, 400);
    assert.equal((await admin.raw('/api/org/branding', { method: 'PUT', body: { pageMarks: 'x' } })).status, 400);
    const ok = await admin.raw('/api/org/branding', { method: 'PUT', body: { designId: 'classic-letterhead',
      pageMarks: { headerText: '{company} · Confidential', headerPos: 'right', pageNumPos: 'center', pageNumFmt: 'slash', evil: '<script>' } } });
    assert.equal(ok.status, 200);
    let got = await admin.json('/api/org/branding');
    assert.deepEqual(got.branding.pageMarks, { headerText: '{company} · Confidential', headerPos: 'right', pageNumPos: 'center', pageNumFmt: 'slash' });
    assert.equal((await admin.raw('/api/org/branding', { method: 'PUT', body: { accentColor: '#004c78' } })).status, 200);
    got = await admin.json('/api/org/branding');
    assert.equal(got.branding.pageMarks.pageNumFmt, 'slash', 'a save that does not carry the marks leaves them alone');
    const bad = await admin.raw('/api/org/branding', { method: 'PUT', body: { streamLooks: { proc: { designId: 'modern-minimal', pageMarks: { headerPos: 'up', headerText: 'x' } } } } });
    assert.equal(bad.status, 400, 'a stream\'s marks are validated too');
    assert.equal((await admin.raw('/api/org/branding', { method: 'PUT', body: { streamLooks: { proc: { designId: 'modern-minimal', pageMarks: { pageNumPos: 'off', x: 1 } } } } })).status, 200);
    got = await admin.json('/api/org/branding');
    assert.deepEqual(got.streamLooks.proc.pageMarks, { headerText: '', headerPos: null, pageNumPos: 'off', pageNumFmt: null });
    assert.equal((await admin.raw('/api/org/branding', { method: 'PUT', body: { pageMarks: null } })).status, 200);
    assert.equal((await admin.json('/api/org/branding')).branding.pageMarks, null, 'null clears them');
  });
  test('a stream\'s own marks ride with the look a new contract takes; the company\'s are read live', () => {
    const S = read('server/server.js');
    const i = S.indexOf('function srvLookOf('), f = S.slice(i, S.indexOf('\n}', i));
    assert.match(f, /sl\.pageMarks \? \{ pageMarks: sl\.pageMarks \} : \{\}/);
    assert.match(S, /addColumnIfMissing\('org_branding', 'page_marks', 'TEXT'\);/);
    assert.match(S, /if \(sent\('pageMarks'\) && JSON\.stringify\(pageMarksClean\(b\.pageMarks\)\.marks\) !== JSON\.stringify\(srvPageMarksOf\(stored\)\)\) lookMoved\.push\(\['pageMarks'\]\);/, 'an Editor cannot move them (a difference)');
  });
});

/* the page-maker, run with the shared catalogue */
function pagesWorld(db) {
  const ctx = Object.assign({}, br, { console });
  ctx.window = ctx;
  ctx.resolveDocBranding = () => db;
  ctx.isUpload = c => c && c.source === 'upload';
  vm.createContext(ctx);
  vm.runInContext(read('js/pages.js'), ctx, { filename: 'pages.js' });
  return ctx;
}
const DIMS = { W: 794, bl: 0, bt: 0, br: 0, mT: 64, mB: 88, pL: 84, pR: 84 };

test('f1203 (3) the signing copy draws both on every page; the working copy says the same, faded; print and PDF carry them', () => {
  const db = br.normalizeDesignBranding({ designId: 'modern-minimal', companyName: 'Highland', footerText: '{ref} · Confidential',
    pageMarks: { headerText: '{company} · {title}', headerPos: 'right', pageNumPos: 'center', pageNumFmt: 'of' } });
  const P = pagesWorld(db), c = { id: 'C-1', contractNo: 'MK-449', name: 'Equipment Lease' };
  const mk = J(P.pagesMarksFor(c));
  assert.deepEqual({ head: mk.head, headAl: mk.headAl, num: mk.num, fmt: mk.fmt, foot: mk.foot }, { head: 'Highland · Equipment Lease', headAl: 'right', num: 'center', fmt: 'of', foot: 'MK-449 · Confidential' });
  assert.equal(P.pagesMarksFor({ id: 'U', source: 'upload' }), null, 'their paper wears none of ours');
  const sign = P._pgFurniture({ mode: 'sign', marks: mk, foot: (label, k, n) => P.pagesSignFoot(c, label, k, n) }, 0, 6, 0, 1122, DIMS).join('');
  assert.match(sign, /class="pg-run is-mark" data-al="right"[^>]*data-l="Highland · Equipment Lease"/, 'the header on page one too');
  assert.match(sign, /class="pg-pnum" data-al="center">1 of 6</, 'the number in its place and words');
  assert.match(sign, /Highland · MK-449 · Confidential/, 'the footer, its fields filled');
  const p3 = P._pgFurniture({ mode: 'sign', marks: mk, foot: (label, k, n) => P.pagesSignFoot(c, label, k, n) }, 2, 6, 0, 1122, DIMS).join('');
  assert.match(p3, /pg-run is-mark/); assert.match(p3, />3 of 6</);
  const off = Object.assign({}, mk, { num: 'off' });
  const db2 = Object.assign({}, db, { pageMarks: Object.assign({}, db.pageMarks, { pageNumPos: 'off' }) });
  const P2 = pagesWorld(db2);
  assert.doesNotMatch(P2._pgFurniture({ mode: 'sign', marks: off, foot: (l, k, n) => P2.pagesSignFoot(c, l, k, n) }, 0, 6, 0, 1122, DIMS).join(''), /of 6|pg-pnum|pg-sfoot/, 'off: no number anywhere');
  const work = P._pgFurniture({ mode: 'work', marks: mk, name: 'Highland', ref: 'MK-449' }, 1, 6, 0, 1122, DIMS).join('');
  assert.match(work, /class="pg-head is-mark" data-al="right"[^>]*data-l="Highland · Equipment Lease"/);
  assert.match(work, /class="pg-foot" [^>]*data-l="MK-449 · Confidential"/);
  assert.match(work, /class="pg-foot is-num" data-al="center"[^>]*data-l="2 of 6"/);
  /* no marks: exactly as before */
  const plain = P._pgFurniture({ mode: 'work', name: 'Highland', ref: 'MK-449' }, 1, 6, 0, 1122, DIMS).join('');
  assert.match(plain, /class="pg-head is-run"/); assert.match(plain, /class="pg-foot" [^>]*data-l="Page 2 of 6"/);
  /* every screen that draws the pages hands them the marks; the print copies the same furniture */
  for (const f of ['js/views/contract.js', 'js/views/approvalsview.js', 'js/views/intelligence.js', 'js/views/negotiation.js', 'js/views/portal.js'])
    assert.match(read(f), /marks: ?window\.pagesMarksFor ?\? ?pagesMarksFor\(c\) ?: ?null/, f);
  assert.match(read('js/views/contract.js'), /foot:\(label,k,n\)=>window\.pagesSignFoot\?pagesSignFoot\(c,label,k,n\):''/);
  assert.match(strip(read('js/pages.js')), /_pgFurniture\(o, k, info\.n, 0, info\.pages\[k\]\.h, pd\)/, 'the printed page wears the same furniture');
  const S = read('server/server.js');
  /* RE-POINTED 24 Nov 2026 (contract look round 3): the count leaves out a cover page the look does not count */
  /* RE-POINTED 24 Nov 2026 (contract look round 5): the page words in the snapshot's own language, English where none */
  assert.match(S, /const pn = brPageNumberSay\(pm && pm\.pageNumFmt, i \+ 1, pages\.length - \(cvSkip && !cvCount \? 1 : 0\), \(pm && pm\.furnLang\) \|\| 'en'\);/, 'the sealed PDF: the snapshot\'s own page numbers');
  assert.match(S, /if \(pm && pm\.pageNumPos === 'off'\) return;/);
  assert.match(S, /brFieldsFill\(pm\.headerText, c, b\)/);
});

test('f1203 (4) the Word file gets a real header and footer, the number as Word\'s own fields', () => {
  const D = require('../js/docx.js');
  const hf = { head: { text: 'Highland · Confidential', al: 'right' }, foot: { text: 'Highland · MK-449' }, num: { al: 'center', words: 'Page \u0001 of \u0002' } };
  const out = D.docxExportTracked('<p>The wording.</p>', { headFoot: hf });
  assert.match(out.header, /<w:hdr [^>]*><w:p><w:pPr><w:jc w:val="right"\/><\/w:pPr>.*Highland · Confidential/);
  assert.match(out.footer, /<w:ftr /); assert.match(out.footer, /<w:jc w:val="center"\/>/);
  assert.match(out.footer, /<w:t xml:space="preserve">Page <\/w:t><\/w:r><w:fldSimple w:instr=" PAGE ">/);
  assert.match(out.footer, /<w:fldSimple w:instr=" NUMPAGES ">/);
  assert.match(out.xml, /<w:sectPr><w:headerReference w:type="default" r:id="rId5"\/><w:footerReference w:type="default" r:id="rId6"\/>/);
  assert.match(out.xml, /xmlns:r="http:\/\/schemas\.openxmlformats\.org\/officeDocument\/2006\/relationships"/);
  const names = D.zipEntries(out.bytes).map(e => e.name);
  assert.ok(names.includes('word/header1.xml') && names.includes('word/footer1.xml'));
  assert.doesNotMatch(out.xml.replace(/<w:sectPr>[\s\S]*$/, ''), /PAGE|Confidential/, 'never the wording');
  const none = D.docxExportTracked('<p>The wording.</p>', {}), again = D.docxExportTracked('<p>The wording.</p>', { headFoot: null });
  assert.deepEqual(Buffer.from(none.bytes), Buffer.from(again.bytes), 'no marks: the file is byte-identical to what it was');
  assert.ok(!D.zipEntries(none.bytes).some(e => /header|footer/.test(e.name)));
  assert.match(read('js/views/contract.js'), /headFoot:window\.pagesWordHeadFoot\?pagesWordHeadFoot\(c\):null/);
  const P = pagesWorld(br.normalizeDesignBranding({ designId: 'modern-minimal', companyName: 'Highland', footerText: 'Confidential', pageMarks: { pageNumPos: 'off' } }));
  assert.equal(J(P.pagesWordHeadFoot({ id: 'C' })).num, null, 'off: no number field');
});

/* the page's own module, as round 1's test runs it */
function lookWorld(look) {
  const ctx = Object.assign({}, br, {
    i18t: (k, o) => k + (o ? ' ' + Object.values(o).join('|') : ''), i18tn: (k, n) => k + ' ' + n,
    esc: s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'),
    currentUser: () => ({ role: 'admin' }), FOLDERS: { proc: { id: 'proc', name: 'Procurement' } },
    state: { contracts: [{ id: 'MK-1', contractNo: 'MK-449', name: 'Supply', folder: 'proc', status: 'Draft' }] } });
  ctx.window = ctx;
  ctx.ORG_BRANDING = br.normalizeDesignBranding(Object.assign({ companyName: 'Highland' }, look));
  ctx.ORG_STREAM_LOOKS = {}; ctx.ORG_PAPER_LOOKS = [];
  vm.createContext(ctx); vm.runInContext(read('js/views/designstep.js'), ctx); ctx.clInit();
  return ctx;
}

test('f1203 (5) two rows with their own edit places and pins, the sentence reader, "No page numbers"', () => {
  const W = lookWorld({ designId: 'classic-letterhead', footerText: '{ref} · Confidential', pageMarks: { headerText: '{company} · {ref}', headerPos: 'right', pageNumPos: 'left', pageNumFmt: 'slash' } });
  const parts = J(vm.runInContext('clParts()', W)), by = Object.fromEntries(parts.map(r => [r.k, r]));
  /* RE-POINTED 24 Nov 2026 (contract look round 3): two more parts, Signature block and Cover page */ assert.deepEqual(parts.map(r => r.k), ['logo', 'header', 'letterhead', 'style', 'layout', 'colour', 'type', 'footer', 'pagenum', 'sigblock', 'cover', 'lang']); /* RE-POINTED 24 Nov 2026 (contract look round 5): one more part, the words on the pages */
  assert.match(by.header.html, /“Highland · MK-449”/, 'what the paper will say, filled from the previewed contract'); assert.equal(by.header.act.attr, 'data-cl-mode="h"');
  assert.match(by.footer.html, /“MK-449 · Confidential”/);
  assert.match(by.pagenum.html, /“1 \/ 1”/); assert.match(by.pagenum.html, /cl_ls_pos_left/); assert.equal(by.pagenum.act.attr, 'data-cl-mode="n"');
  W.vm = 1; vm.runInContext('_cl.mode = "h"', W);
  const h = vm.runInContext('clPickHtml()', W);
  assert.match(h, /data-cl-hpos="right"/); assert.match(h, /id="cl-head-words"[^>]*value=""/, 'the words alone: no braces in the box');
  assert.match(h, /class="cl-pill is-on" data-cl-hfield="company"/); assert.match(h, /class="cl-pill is-on" data-cl-hfield="ref"/); assert.match(h, /data-cl-hfield="title"/);
  vm.runInContext('_cl.mode = "n"', W);
  const n = vm.runInContext('clPickHtml()', W);
  for (const v of ['off', 'left', 'center', 'right']) assert.match(n, new RegExp(`data-cl-npos="${v}"`));
  for (const v of ['page-of', 'of', 'slash']) assert.match(n, new RegExp(`data-cl-nfmt="${v}"`));
  vm.runInContext('_cl.mode = "f"', W);
  assert.match(vm.runInContext('clPickHtml()', W), /data-cl-ffield="ref"/);
  const D = read('js/views/designstep.js');
  /* RE-POINTED 24 Nov 2026 (contract look round 3): the pin sides carry the two new parts too */
  assert.match(D, /const CL_PIN_SIDE = \{ logo: 'l', header: 'r', letterhead: 'r', style: 'l', layout: 'l', colour: 'r', type: 'r', footer: 'l', pagenum: 'r'(, [a-z]+: '[lr]')* \};/);
  assert.match(D, /if \(r\.k === 'header'\) el = inView\('\.pg-run\.is-mark'\);/);
  assert.match(D, /if \(r\.k === 'pagenum'\) el = r\.st === 'optional' \? null : \(inView\('\.pg-pnum'\) \|\| inView\('\.pg-dfoot, \.pg-sfoot'\)\);/);
  assert.match(D, /pageMarks: _cl\.look\.pageMarks \|\| null \};/, 'Save carries them');
  const r = s => J(vm.runInContext(`clReadLook(${JSON.stringify(s)}).got`, W));
  assert.deepEqual(r('page numbers bottom right'), { pageMarks: { pageNumPos: 'right' } });
  assert.deepEqual(r('no page numbers'), { pageMarks: { pageNumPos: 'off' } });
  assert.deepEqual(r('header: Confidential on the right'), { pageMarks: { headerText: 'Confidential', headerPos: 'right' } });
  assert.deepEqual(r('use our navy and put the logo on the left, formal legal, two columns'),
    { accentColor: '#004c78', logoPosition: 'top-left', designId: 'formal-legal', structureId: 'two-column' }, 'what it read before stands');
  const off = lookWorld({ designId: 'classic-letterhead', footerText: 'x', pageMarks: { pageNumPos: 'off' } });
  const q = J(vm.runInContext('clQuality()', off)).find(x => x.t === 'cl_ls_q_nonum');
  assert.ok(q && q.tone === 'amber' && q.go.attr === 'data-st-ls-cl="n"', 'No page numbers: an amber note with its door');
  assert.equal(J(vm.runInContext('clParts()', off)).find(x => x.k === 'pagenum').st, 'optional');
  assert.match(vm.runInContext('clTabsHtml(clParts())', off), /cl_ls_n_parts 12/, 'the parts count moves with it'); /* RE-POINTED 24 Nov 2026 (contract look round 5): one more part, the words on the pages */ /* RE-POINTED 24 Nov 2026 (contract look round 3): two more parts, Signature block and Cover page */
});

test('f1203 (6) every new word in both books', () => {
  const I = read('js/i18n.js'), sv = I.indexOf('\n  sv: {');
  const en = I.slice(0, sv), se = I.slice(sv);
  const keys = ['cl_n_header', 'cl_n_pagenum', 'cl_ls_none', 'cl_ls_off', 'cl_ls_add', 'cl_ls_pos_left', 'cl_ls_pos_center', 'cl_ls_pos_right', 'cl_ls_pn_inline',
    'cl_ls_pn_place', 'cl_ls_pn_reads', 'cl_ls_head_place', 'cl_ls_head_ph', 'cl_ls_fields', 'cl_ls_f_company', 'cl_ls_f_ref', 'cl_ls_f_title', 'cl_ls_on_paper',
    'cl_ls_q_nonum', 'cl_ls_d_marks', 'cl_said_num', 'cl_said_nonum', 'cl_said_head', 'cl_said_nohead', 'pg_num_of', 'pg_num_slash'];
  const has = (book, k) => book.includes('\n    ' + k + ": '");
  assert.deepEqual(keys.filter(k => !has(en, k) || !has(se, k)), []);
  assert.match(se, /\n {4}pg_num_of: '\{n\} av \{m\}'/); assert.match(se, /\n {4}pg_page_of: 'Sida \{n\} av \{m\}'/);
  assert.match(read('js/handbook.js'), /\{ui:cl_n_pagenum\}: where they sit in the footer/);
});
