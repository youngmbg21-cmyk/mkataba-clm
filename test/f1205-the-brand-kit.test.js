'use strict';
/* f1205 — HOW OUR CONTRACTS LOOK, ROUND 4: THE BRAND KIT (owner, 24 Nov 2026; the drawing's kit())
   (1) one module for both sides of the wire: the black logo worn by a black-and-white style (only the colour logo set =
       exactly as today), an honest list of two faces HaTi serves itself (no remote host), up to four named colours
   (2) the server validates everything (admins only, the logo's transport and cap, the colours, the faces) and keeps
       the first colour and the accent in step
   (3) the faces reach every surface: the paper's own type rules (the design's face stays the fallback), the sealed PDF
       (Times or Helvetica, said), the Word file (named; byte-identical with none chosen)
   (4) the page: a Brand kit tab with its count; logo versions, faces, colours with their contrast and one press to the
       nearest colour that reads; only the places that are true in "where the kit is used"; the kit in the quality
       check and the ring
   (5) the wording and the sealed text are unchanged by every kit setting
   (6) every new word in both books */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const H = require('./helpers');
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const J = x => JSON.parse(JSON.stringify(x));
const br = require('../js/branding.js');
const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
const PNG2 = PNG.replace('A60e6', 'B60e6');

test('f1205 (1) the black logo, two honest faces, named colours', () => {
  const mono = br.normalizeDesignBranding({ designId: 'classic-letterhead', logoUrl: PNG, logoBlackUrl: PNG2 });
  const colour = br.normalizeDesignBranding({ designId: 'modern-minimal', logoUrl: PNG, logoBlackUrl: PNG2 });
  const only = br.normalizeDesignBranding({ designId: 'classic-letterhead', logoUrl: PNG });
  assert.equal(br.brLogoFor(mono), PNG2, 'a black-and-white style wears the black logo');
  assert.equal(br.brLogoFor(colour), PNG, 'a colour style wears the colour logo');
  assert.equal(br.brLogoFor(only), PNG, 'only the colour logo: as today');
  assert.match(br.docDesignHeaderHtml(mono, { name: 'X' }), new RegExp(PNG2.slice(-20).replace(/[+/=]/g, m => '\\' + m)));
  assert.equal(br.normalizeDesignBranding({ designId: 'classic-letterhead', logoBlackUrl: 'https://evil.example/x.png' }).logoBlackUrl, null, 'the same transport as the logo');
  assert.deepEqual(Object.keys(br.BR_FONTS), ['serif', 'sans']);
  assert.equal(br.BR_FONTS.serif.name, 'Source Serif 4'); assert.equal(br.BR_FONTS.sans.name, 'Geist');
  const served = read('fonts/fonts.css') + read('fonts/geist.css') + read('fonts/source-serif-4.css');
  assert.match(served, /Source Serif 4/); assert.match(served, /Geist/);
  assert.match(read('server/server.js'), /"font-src 'self' https:\/\/fonts\.gstatic\.com data:",/, 'no new font host');
  assert.equal(br.pageMarksClean({ fontBody: 'comic' }).error, 'Unknown font');
  assert.deepEqual(J(br.pageMarksClean({ fontTitle: 'sans' }).marks), { headerText: '', headerPos: null, pageNumPos: null, pageNumFmt: null, fontTitle: 'sans' });
  assert.equal(br.docDesignBodyAttr(br.normalizeDesignBranding({ designId: 'formal-legal', pageMarks: { fontBody: 'serif', fontTitle: 'sans' } })),
    ' data-doc-body="formal-legal" data-doc-font-body="serif" data-doc-font-title="sans"');
  assert.equal(br.docDesignBodyAttr(br.normalizeDesignBranding({ designId: 'formal-legal' })), ' data-doc-body="formal-legal"', 'none chosen: as today');
  assert.equal(br.brPaletteClean([{ name: 'A', hex: '#FFFFFF' }, { name: 'B', hex: '#000000' }, { name: 'C', hex: '#111111' }, { name: 'D', hex: '#222222' }, { name: 'E', hex: '#333333' }]).error, 'At most four colours');
  assert.match(br.brPaletteClean([{ name: 'x', hex: 'green' }]).error, /hex/);
  assert.deepEqual(br.brPaletteClean([{ name: ' Green <b>', hex: '#087363', use: 'rules', x: 1 }]).palette, [{ name: 'Green b', hex: '#087363', use: 'rules' }]);
});

describe('f1205 (2) the server validates and keeps the kit', () => {
  let h, W, admin;
  before(async () => {
    h = await H.startHati({ HATI_AGENTS_AUTO: 'off' }); W = await H.seedWorkspace(h, { approvalRules: [] });
    admin = h.client('admin'); await admin.json('/api/login', { method: 'POST', body: { email: 'admin@example.co.ke', password: 'adminpassword1' } });
  });
  after(async () => { if (h) await h.stop(); });
  test('admins only; the logo\'s checks; four colours at most; known faces; the first colour is the accent', async () => {
    assert.equal((await W.unrestricted.raw('/api/org/branding', { method: 'PUT', body: { logoBlackUrl: PNG } })).status, 403, 'an Editor cannot move the kit');
    assert.equal((await admin.raw('/api/org/branding', { method: 'PUT', body: { logoBlackUrl: 'https://x.example/l.png' } })).status, 400);
    assert.equal((await admin.raw('/api/org/branding', { method: 'PUT', body: { logoBlackUrl: 'data:image/png;base64,' + 'A'.repeat(700001) } })).status, 400);
    assert.equal((await admin.raw('/api/org/branding', { method: 'PUT', body: { palette: [1, 2, 3, 4, 5].map(i => ({ name: 'c' + i, hex: '#111111' })) } })).status, 400);
    assert.equal((await admin.raw('/api/org/branding', { method: 'PUT', body: { pageMarks: { fontTitle: 'papyrus' } } })).status, 400);
    assert.equal((await admin.raw('/api/org/branding', { method: 'PUT', body: { designId: 'modern-minimal', logoBlackUrl: PNG2,
      palette: [{ name: 'Green', hex: '#087363', use: 'rules' }, { name: 'Grey', hex: '#a8a8ad', use: 'notes' }], pageMarks: { fontBody: 'serif' } } })).status, 200);
    let got = (await admin.json('/api/org/branding')).branding;
    assert.equal(got.logoBlackUrl, PNG2); assert.equal(got.accentColor, '#087363', 'the first colour is the accent');
    assert.equal(got.palette.length, 2); assert.equal(got.pageMarks.fontBody, 'serif');
    assert.equal((await admin.raw('/api/org/branding', { method: 'PUT', body: { accentColor: '#004c78' } })).status, 200);
    got = (await admin.json('/api/org/branding')).branding;
    assert.equal(got.palette[0].hex, '#004c78', 'the accent alone moves the first colour with it');
    assert.equal(got.palette[1].hex, '#a8a8ad');
  });
});

test('f1205 (3) the faces reach every surface; the sealed PDF and Word say what they set', () => {
  const html = read('index.html');
  for (const id of br.DOC_DESIGNS.map(d => d.id))
    assert.match(html, new RegExp(`\\[data-doc-body="${id}"\\] :is\\(\\.doc-surface,\\.rl-paper\\) \\*:not\\(\\.hati-field\\):not\\(input\\):not\\(textarea\\)\\{font-family:var\\(--doc-font-body,`), id + ': the design\'s face is the fallback');
  assert.match(html, /\[data-doc-font-body="serif"\],\[data-doc-font-title="serif"\] :is\(h1,h2,h3,h4,\.rl-paper-title,\.rl-clause-h\)\{--doc-font-body:'Source Serif 4'/);
  assert.match(html, /\[data-doc-font-body="sans"\],\[data-doc-font-title="sans"\] :is\(h1,h2,h3,h4,\.rl-paper-title,\.rl-clause-h\)\{--doc-font-body:'Geist'/);
  const S = read('server/server.js');
  assert.match(S, /const logo = designed && brLogoFor\(b\) \? pdfImageFromDataUrl\(brLogoFor\(b\)\) : null;/, 'the sealed PDF wears the style\'s logo');
  assert.match(S, /const F = \{ body: bodySerif \? 'F1' : 'F4', bold: titleSerif \? 'F2' : 'F5' \};/, 'and its faces, as the standard PDF faces');
  const D = require('../js/docx.js');
  const st = D.docxStylesWithFonts({ body: 'Georgia', title: 'Arial' });
  assert.match(st, /<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Georgia" w:hAnsi="Georgia" w:cs="Georgia"\/>/);
  assert.match(st, /w:styleId="Heading1"[\s\S]*?<w:rPr><w:rFonts w:ascii="Arial"/);
  const plain = D.docxExportTracked('<p>The wording.</p>', {}), withNull = D.docxExportTracked('<p>The wording.</p>', { fonts: null });
  assert.deepEqual(Buffer.from(plain.bytes), Buffer.from(withNull.bytes), 'none chosen: the Word file byte-identical');
  assert.match(read('js/views/contract.js'), /fonts:window\.pagesWordFonts\?pagesWordFonts\(c\):null\}\);/);
  assert.match(read('js/i18n.js'), /cl_kit_f_where: 'On screen and in print: \{screen\}\. The sealed PDF sets \{pdf\}; the Word file names \{word\}, and Word uses a face of its own where that one is not installed\.'/, 'the row says it');
});

function lookWorld(lk) {
  const ctx = Object.assign({}, br, {
    i18t: (k, o) => k + (o ? ' ' + Object.values(o).join('|') : ''), i18tn: (k, n) => k + ' ' + n,
    esc: s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'),
    currentUser: () => ({ role: 'admin' }), FOLDERS: { proc: { id: 'proc', name: 'Procurement' } },
    state: { contracts: [{ id: 'MK-1', contractNo: 'MK-449', name: 'Supply', folder: 'proc', status: 'Draft' }] } });
  ctx.window = ctx; ctx.ORG_BRANDING = br.normalizeDesignBranding(Object.assign({ companyName: 'Highland' }, lk));
  ctx.ORG_STREAM_LOOKS = {}; ctx.ORG_PAPER_LOOKS = [];
  vm.createContext(ctx); vm.runInContext(read('js/views/designstep.js'), ctx); ctx.clInit();
  return ctx;
}

test('f1205 (4) the Brand kit tab: its count, logos, faces, colours, where it is used, the check and the ring', () => {
  const W = lookWorld({ designId: 'classic-letterhead', logoUrl: PNG, accentColor: '#087363',
    palette: [{ name: 'Green', hex: '#087363', use: 'rules' }, { name: 'Light grey', hex: '#a8a8ad', use: 'notes' }], pageMarks: { fontTitle: 'sans' } });
  assert.match(vm.runInContext('clTabsHtml(clParts())', W), /data-cl-tab="kit">cl_ls_tab_kit<i>3<\/i>/, 'colour logo, the title face, the colours: 3 set');
  const h = vm.runInContext('clKitHtml()', W);
  assert.match(h, /id="cl-kit-logos"/); assert.match(h, /data-cl-kit-up="colour">cl_logo_replace/); assert.match(h, /data-cl-kit-up="black">cl_ls_upload/);
  assert.match(h, /<span class="apn-st is-amber">cl_ls_st_missing<\/span>/, 'a black-and-white style with only a colour logo: the black one is missing');
  assert.match(h, /class="cl-pill is-on" data-cl-kit-font="fontTitle:sans"/); assert.match(h, /data-cl-kit-font="fontBody:serif"/); assert.match(h, /data-cl-kit-font="fontBody:"/);
  assert.match(h, /cl_kit_f_where Geist\|cl_kit_pdf_sans\|Arial/, 'the face says what the PDF and Word set');
  assert.match(h, /data-cl-kit-hex="0"[^>]*value="#087363"/); assert.match(h, /cl_kit_c_on_paper/);
  const near = vm.runInContext('clNearestPassing("#a8a8ad")', W);
  assert.ok(vm.runInContext(`clContrastOnWhite(${JSON.stringify(near)})`, W) >= 4.5, 'the nearest colour reads');
  assert.ok(vm.runInContext(`clContrastOnWhite(${JSON.stringify(near)})`, W) < 4.7, 'and is the nearest');
  assert.match(h, new RegExp(`cl_kit_c_faint 2\\.3[\\s\\S]*data-cl-kit-fix="1">cl_kit_c_use ${near}`), 'the ruby note and its one press');
  assert.equal((h.match(/<tr><td>cl_kit_u_/g) || []).length, 3, 'only the places that are true');
  assert.doesNotMatch(h, /cl_kit_u_mail|email/i, 'no email row: no email to the other side carries the kit');
  const q = J(vm.runInContext('clQuality()', W));
  assert.ok(q.some(x => x.t === 'cl_kit_q_noblack' && x.go.attr === 'data-st-ls-cl="kit"'));
  assert.ok(q.some(x => /^cl_kit_q_faint Light grey/.test(x.t) && x.tone === 'ruby'));
  const f = J(vm.runInContext('clPanelFacts()', W));
  /* RE-POINTED 24 Nov 2026 (contract look round 5): one more part, the words on the pages */ assert.equal(f.of, 12 + 5, 'the ring counts the kit'); assert.equal(f.kitOf, 5); assert.equal(f.kitSet, 3);
  const D = read('js/views/designstep.js');
  assert.match(D, /if \(s === 'kit'\) \{ _cl\.tab = 'kit'; _cl\.mode = 'page'; return clRepaint\(\); \}/, 'the check\'s doors open the kit');
  assert.match(D, /payload\.palette = pal\.length \? pal : null;/, 'Save carries the colours');
  assert.match(read('js/views/settings.js'), /title:f\.tab==='kit'\?i18t\('cl_kit_p_t',\{ n:f\.kitSet, m:f\.kitOf \}\)/);
});

test('f1205 (5) the wording and the sealed text are unchanged by every kit setting', () => {
  const D = require('../js/docx.js');
  const body = '<h2>1. Rent</h2><p>The rent is due monthly, as clause 2.1 (a) says.</p>';
  for (const fonts of [{ body: 'Georgia' }, { title: 'Arial' }, { body: 'Arial', title: 'Georgia' }])
    assert.equal(D.docxXmlToText(D.docxExportTracked(body, { fonts }).xml).text, D.docxXmlToText(D.docxExportTracked(body, {}).xml).text);
  const signed = { id: 'S', name: 'Lease', status: 'Signed', redlineText: '<p>words</p>', execution: { html: '<p>sealed</p>', textHash: 'h' },
    branding: { designId: 'classic-letterhead', logoUrl: PNG } };
  const draft = Object.assign(J(signed), { id: 'D', status: 'Draft', execution: null });
  for (const lk of [{ logoBlackUrl: PNG2 }, { pageMarks: { fontBody: 'sans', fontTitle: 'serif' } }, { palette: [{ name: 'G', hex: '#087363' }] }]) {
    const ctx = Object.assign({}, br, { console }); ctx.window = ctx; ctx.isUpload = c => c && c.source === 'upload';
    ctx.resolveDocBranding = () => br.normalizeDesignBranding(Object.assign({ designId: 'classic-letterhead', logoUrl: PNG }, lk));
    vm.createContext(ctx); vm.runInContext(read('js/pages.js'), ctx);
    for (const c of [signed, draft]) {
      const was = JSON.stringify(c);
      ctx.pagesMarksFor(c); ctx.pagesWordFonts(c); ctx.pagesCoverHtml(c); br.docDesignHeaderHtml(ctx.resolveDocBranding(), c); br.docDesignBodyAttr(ctx.resolveDocBranding());
      assert.equal(JSON.stringify(c), was, JSON.stringify(lk) + ' leaves ' + c.id + ' as it was');
    }
  }
  /* a signed contract reads only its own sealed snapshot: the kit set today never reaches it */
  const bctx = { window: {} }; vm.createContext(bctx); vm.runInContext(read('js/branding.js'), bctx);
  bctx.window.ORG_BRANDING = bctx.window.normalizeDesignBranding({ designId: 'classic-letterhead', logoUrl: PNG, logoBlackUrl: PNG2 });
  const seen = bctx.window.resolveDocBranding(signed);
  assert.equal(seen.logoBlackUrl, null, 'signed paper keeps the look it was signed in');
});

test('f1205 (6) every new word in both books', () => {
  const I = read('js/i18n.js'), sv = I.indexOf('\n  sv: {'), en = I.slice(0, sv), se = I.slice(sv);
  const keys = [...new Set([...read('js/views/designstep.js').matchAll(/i18t\('(cl_kit_[a-z0-9_]+|cl_ls_tab_kit)'/g)].map(m => m[1]))]
    .concat(['cl_kit_pdf_serif', 'cl_kit_pdf_sans', 'cl_kit_p_t', 'cl_kit_u_ours', 'cl_kit_u_signed', 'cl_kit_u_theirs', 'cl_kit_b_uses', 'cl_kit_b_locked', 'cl_kit_b_never']);
  assert.ok(keys.length > 30, 'the words are read (' + keys.length + ')');
  const has = (book, k) => book.includes('\n    ' + k + ': ');
  assert.deepEqual(keys.filter(k => !has(en, k) || !has(se, k)), []);
  assert.match(read('js/handbook.js'), /\{ui:cl_ls_tab_kit\}: the logo in colour and in black/);
});
