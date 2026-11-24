'use strict';
/* f1206 — HOW OUR CONTRACTS LOOK, ROUND 5: THE LANGUAGE OF THE WORDS HaTi PRINTS ON THE PAGES (owner, 24 Nov 2026)
   WHAT HaTi KNOWS, AND WHAT WAS NOT BUILT: a contract records which of OUR entities signs it only as a name typed on the
   contract (c.party, offered from a list that "grows by use"); there is no register of our own entities with a number
   and an address, and nothing records a contract's language. So no look per entity was invented: the look carries the
   language of the page words, per company and per stream.
   (1) one reader for both hosts (i18tIn) and one rule (brFurnT): the look's language where chosen, else as before
   (2) the server validates it (English or Swedish), for the company and a stream; an entity is not a key a look takes
   (3) the signing copy's page numbers, the signature block's labels and the cover speak it; the Word file too
   (4) the sealed PDF speaks the language of the look it was sealed in — rendered here, not read off the source
   (5) Who wears it: the language beside the company, a chip per language, the row's footer as its pages read it, and the
       panel's lines with "Wording never translated"; the Page tab's row, edit place and the ask box
   (6) the wording and the sealed text are never translated, nor changed
   (7) every new word in both books */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const H = require('./helpers');
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const J = x => JSON.parse(JSON.stringify(x));
const br = require('../js/branding.js');
const I = require('../js/i18n.js');

test('f1206 (1) one reader, one rule: the look\'s language where chosen, else as before', () => {
  assert.equal(I.i18tIn('sv', 'pg_page_of', { n: 2, m: 5 }), 'Sida 2 av 5');
  assert.equal(I.i18tIn('en', 'pg_page_of', { n: 2, m: 5 }), 'Page 2 of 5');
  assert.equal(I.i18tIn(null, 'pg_page_of', { n: 2, m: 5 }), I.i18t('pg_page_of', { n: 2, m: 5 }), 'none chosen: the reader\'s');
  assert.equal(br.brPageNumberSay(null, 2, 5, 'sv'), 'Sida 2 av 5');
  assert.equal(br.brPageNumberSay('of', 2, 5, 'sv'), '2 av 5');
  assert.equal(br.brPageNumberSay(null, 2, 5), 'Page 2 of 5', 'no language on the server: English, as before');
  assert.equal(br.brFurnT('sv', 'sig_ln_date', null, 'Date'), 'Datum');
  assert.deepEqual(br.BR_FURN_LANGS, ['en', 'sv']);
  assert.equal(br.pageMarksClean({ furnLang: 'sv' }).marks.furnLang, 'sv');
  assert.match(br.pageMarksClean({ furnLang: 'de' }).error, /language/);
  assert.equal(br.pageMarksClean({ entity: 'Highland Sweden AB' }).marks, null, 'a look takes no entity: HaTi keeps none to point at');
  assert.match(read('js/views/contract.js'), /it grows by use, nothing for an admin to maintain/, 'what HaTi has: a name per contract, no register');
});

describe('f1206 (2) the server validates the language', () => {
  let h, W, admin;
  before(async () => {
    h = await H.startHati({ HATI_AGENTS_AUTO: 'off' }); W = await H.seedWorkspace(h, { approvalRules: [] });
    admin = h.client('admin'); await admin.json('/api/login', { method: 'POST', body: { email: 'admin@example.co.ke', password: 'adminpassword1' } });
  });
  after(async () => { if (h) await h.stop(); });
  test('English or Swedish, admins only, the company\'s and a stream\'s', async () => {
    assert.equal((await admin.raw('/api/org/branding', { method: 'PUT', body: { pageMarks: { furnLang: 'de' } } })).status, 400);
    assert.equal((await W.unrestricted.raw('/api/org/branding', { method: 'PUT', body: { pageMarks: { furnLang: 'sv' } } })).status, 403);
    assert.equal((await admin.raw('/api/org/branding', { method: 'PUT', body: { designId: 'classic-letterhead', pageMarks: { furnLang: 'sv' } } })).status, 200);
    assert.equal((await admin.json('/api/org/branding')).branding.pageMarks.furnLang, 'sv');
    assert.equal((await admin.raw('/api/org/branding', { method: 'PUT', body: { streamLooks: { proc: { designId: 'modern-minimal', pageMarks: { furnLang: 'xx' } } } } })).status, 400);
    assert.equal((await admin.raw('/api/org/branding', { method: 'PUT', body: { streamLooks: { proc: { designId: 'modern-minimal', pageMarks: { furnLang: 'en' } } } } })).status, 200);
    assert.equal((await admin.json('/api/org/branding')).streamLooks.proc.pageMarks.furnLang, 'en');
  });
});

function pagesWorld(db) {
  const ctx = Object.assign({}, br, { console, i18tIn: I.i18tIn, i18t: I.i18t });
  ctx.window = ctx; ctx.resolveDocBranding = () => db; ctx.isUpload = c => c && c.source === 'upload';
  ctx.contractParty = () => 'Highland Sweden AB'; ctx.FIRST_PARTY = 'Highland';
  vm.createContext(ctx); vm.runInContext(read('js/pages.js'), ctx);
  return ctx;
}
const DIMS = { W: 794, bl: 0, bt: 0, br: 0, mT: 64, mB: 88, pL: 84, pR: 84 };
const look = pm => br.normalizeDesignBranding({ designId: 'classic-letterhead', companyName: 'Highland Sweden AB', footerText: 'Konfidentiellt', pageMarks: pm });

test('f1206 (3) the signing copy, the signature block, the cover and the Word file speak it', () => {
  const P = pagesWorld(look({ furnLang: 'sv', coverOn: true })), c = { id: 'MK-501', name: 'Leasing', counterparty: 'Saw Sawa AB' };
  const mk = J(P.pagesMarksFor(c)); assert.equal(mk.lang, 'sv');
  const p2 = P._pgFurniture({ mode: 'sign', marks: mk, foot: (l, k, n) => P.pagesSignFoot(c, l, k, n) }, 1, 3, 0, 1122, DIMS).join('');
  assert.match(p2, /Sida 1 av 2/, 'the number in Swedish, after the cover');
  const cover = P.pagesCoverHtml(c);
  assert.match(cover, /Mellan Highland Sweden AB och Saw Sawa AB/); assert.match(cover, /Referens MK-501/); assert.match(cover, /Datum: ______________/);
  assert.match(J(P.pagesWordHeadFoot(c)).num.words, /^Sida \u0001 av \u0002$/, 'Word\'s page words');
  const work = P._pgFurniture({ mode: 'work', marks: mk }, 1, 3, 0, 1122, DIMS).join('');
  assert.match(work, /Sida 2 av 3/, 'the working copy\'s faded foot too');
  const N = read('js/views/negotiation.js'), i = N.indexOf('function rlPaperFootHtml('), f = N.slice(i, N.indexOf('\n}\n', i) + 2);
  const P2 = pagesWorld(look({ furnLang: 'sv', sigLines: ['name', 'date'] }));
  const fctx = { window: P2, PARTY_SIDE_OURS: 'ours', i18t: (k, v) => I.i18t(k, v), _ne: s => String(s), _ngOurParty: () => 'Highland Sweden AB' };
  vm.createContext(fctx); vm.runInContext(f, fctx);
  const foot = fctx.rlPaperFootHtml({ id: 'C', name: 'L', counterparty: 'Saw Sawa AB' });
  assert.match(foot, /Namn: /); assert.match(foot, /Datum: /); assert.match(foot, new RegExp(I.i18tIn('sv', 'ng_signed_for', { who: 'Highland Sweden AB' })));
  const plain = pagesWorld(look(null)).pagesMarksFor(c);
  assert.equal(plain, null, 'nothing set: no marks, the pages as before');
});

test('f1206 (4) the sealed PDF speaks the language it was sealed in (rendered)', () => {
  const S = read('server/server.js');
  const src = S.slice(S.indexOf('const PDF_PAGE_W'), S.indexOf('\nfunction executedAttachment('));
  const ctx = Object.assign({}, br, { zlib: require('zlib'), Buffer, console, contractRef: c => String(c.contractNo || c.id),
    sealWhen: () => '24 Nov 2026', orgJx: () => ({ esignatureShort: 'Electronic signatures' }) });
  vm.createContext(ctx); vm.runInContext(src, ctx);
  const c = (pm) => ({ id: 'MK-9', name: 'Equipment Lease', counterparty: 'Saw Sawa AB', status: 'Signed', signatures: [],
    execution: { html: '<h2>1. Rent</h2><p>The rent is due monthly.</p>', textHash: 'abc' },
    branding: { designId: 'classic-letterhead', companyName: 'Highland Sweden AB', footerText: 'Konfidentiellt', pageMarks: pm } });
  const sv = ctx.executedPdf(c({ furnLang: 'sv', coverOn: true })).toString('latin1');
  assert.ok(sv.includes('(Sida 1 av 1)'), 'the page number in Swedish'); assert.ok(sv.includes('Mellan') && sv.includes('Referens') && sv.includes('Datum'));
  assert.ok(!sv.includes('Page 1 of'));
  const en = ctx.executedPdf(c(null)).toString('latin1');
  assert.ok(en.includes('(Page 1 of 1)'), 'none chosen: English, as before');
  assert.ok(sv.includes('The rent is due monthly.') && en.includes('The rent is due monthly.'), 'the sealed wording, never translated');
});

function lookWorld(lk, streams) {
  const ctx = Object.assign({}, br, { i18tIn: I.i18tIn,
    i18t: (k, o) => k + (o ? ' ' + Object.values(o).join('|') : ''), i18tn: (k, n) => k + ' ' + n,
    esc: s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'),
    currentUser: () => ({ role: 'admin' }), FOLDERS: { proc: { id: 'proc', name: 'Nordic Procurement' }, sales: { id: 'sales', name: 'Sales' } },
    state: { contracts: [{ id: 'MK-1', contractNo: 'MK-449', name: 'Supply', folder: 'proc', status: 'Draft' }] } });
  ctx.window = ctx; ctx.ORG_BRANDING = br.normalizeDesignBranding(Object.assign({ companyName: 'Highland', footerText: 'Konfidentiellt' }, lk));
  ctx.ORG_STREAM_LOOKS = streams || {}; ctx.ORG_PAPER_LOOKS = [];
  vm.createContext(ctx); vm.runInContext(read('js/views/designstep.js'), ctx); ctx.clInit();
  return ctx;
}

test('f1206 (5) Who wears it, the Page tab\'s row, its edit place and the ask box', () => {
  const W = lookWorld({ designId: 'classic-letterhead' }, { proc: { designId: 'classic-letterhead', pageMarks: { furnLang: 'sv' } } });
  const rows = J(vm.runInContext('clWhoRows()', W));
  assert.equal(rows.find(r => r.fid === 'proc').lang, 'sv'); assert.equal(rows.find(r => r.fid === 'sales').lang, null);
  const h = vm.runInContext('clWhoHtml()', W);
  assert.match(h, /Highland · cl_lg_sv<\/span>/, 'the company and the language'); assert.match(h, /Highland · cl_lg_reader<\/span>/);
  assert.match(h, /data-cl-chip="lang:sv"><i class="apn-cd is-steel" aria-hidden="true"><\/i>cl_lg_sv <span>1<\/span>/, 'a chip per language worn');
  assert.doesNotMatch(h, /lang:en/, 'no chip with no rows');
  assert.match(h, /“Highland · Konfidentiellt · Sida 2 av 5”/, 'the row\'s footer as its pages read it');
  vm.runInContext('_cl.tab = "who"; _cl.whoPick = "stream:proc"', W);
  const f = J(vm.runInContext('clPanelFacts()', W)).who;
  assert.equal(f.lang, 'cl_lg_sv');
  assert.ok(f.langLines.includes('cl_lg_d_num Sida 2 av 5') && f.langLines.some(x => /Namn, Datum/.test(x)) && f.langLines.includes('cl_lg_d_foot Highland · Konfidentiellt'));
  assert.match(read('js/views/settings.js'), /\(w\.lang\?line\('grey',i18t\('cl_lg_never_cap'\)\):''\)/, 'Wording never translated');
  const P = lookWorld({ designId: 'classic-letterhead', pageMarks: { furnLang: 'sv' } });
  const row = J(vm.runInContext('clParts()', P)).find(r => r.k === 'lang');
  assert.equal(row.st, 'set'); assert.match(row.html, /cl_lg_sv/); assert.equal(row.act.attr, 'data-cl-mode="lg"');
  vm.runInContext('_cl.mode = "lg"', P);
  const lg = vm.runInContext('clPickHtml()', P);
  assert.match(lg, /class="cl-pill is-on" data-cl-lang="sv"/); assert.match(lg, /data-cl-lang="en"/); assert.match(lg, /data-cl-lang=""/);
  assert.match(lg, /cl_lg_note Sida 2 av 5/);
  assert.deepEqual(J(vm.runInContext('clReadLook("page words in Swedish").got', P)), { pageMarks: { furnLang: 'sv' } });
  assert.deepEqual(J(vm.runInContext('clReadLook("page numbers bottom right").got', P)), { pageMarks: { pageNumPos: 'right' } }, 'what it read before stands');
});

test('f1206 (6) the wording and the sealed text are never translated, nor changed', () => {
  const signed = { id: 'S', name: 'Leasing', status: 'Signed', counterparty: 'X', redlineText: '<h2>1. Rent</h2><p>See clause 2.1 (a).</p>',
    execution: { html: '<p>sealed words</p>', textHash: 'h' }, clauses: [{ id: 'cl-1' }] };
  const draft = Object.assign(J(signed), { id: 'D', status: 'Draft', execution: null });
  for (const l of ['sv', 'en']) {
    const P = pagesWorld(look({ furnLang: l, coverOn: true, sigLines: ['name'] }));
    for (const c of [signed, draft]) {
      const was = JSON.stringify(c);
      const mk = P.pagesMarksFor(c), cover = P.pagesCoverHtml(c); P.pagesWordHeadFoot(c); P.pagesWordCoverHtml(c);
      assert.match(cover, l === 'sv' ? /Mellan/ : /Between/, 'the page words did change language');
      for (let k = 0; k < 3; k++) P._pgFurniture({ mode: 'sign', marks: mk, foot: (x, kk, n) => P.pagesSignFoot(c, x, kk, n) }, k, 3, 0, 1122, DIMS);
      assert.equal(JSON.stringify(c), was, l + ' leaves ' + c.id + ' exactly as it was');
    }
  }
});

test('f1206 (7) every new word in both books', () => {
  const src = read('js/i18n.js'), sv = src.indexOf('\n  sv: {'), en = src.slice(0, sv), se = src.slice(sv);
  const keys = ['cl_n_lang', 'cl_lg_reader', 'cl_lg_en', 'cl_lg_sv', 'cl_lg_never', 'cl_lg_never_cap', 'cl_lg_note', 'cl_lg_d_num', 'cl_lg_d_sig', 'cl_lg_d_foot', 'cl_said_lang'];
  const has = (book, k) => book.includes('\n    ' + k + ': ');
  assert.deepEqual(keys.filter(k => !has(en, k) || !has(se, k)), []);
  assert.match(read('js/handbook.js'), /\{ui:cl_n_lang\}: the words HaTi itself prints on the pages/);
});
