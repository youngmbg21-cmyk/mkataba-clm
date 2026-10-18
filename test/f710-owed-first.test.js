'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f710 — FILL IN, "OWED FIRST" (round 8 of the redesign: the owner picked
   "Owed first" by name and said yes to both questions, 17 Oct 2026)
   (1) detailsOf, the ONE reading of what is owed: an NDA's two facts count
       until a person confirms them (ndaClean of the stored c.nda); base pay
       counts on an employment agreement — read here in a sandbox.
   (2) The face is one worklist laid over the painters' own hosts: rows
       placed by a mark set at paint (pdFillMark), a box answered never moved
       under the hand, one fold for what is answered; base pay and the NDA's
       facts keep their own doors on the full page and the phone.
   AT THE PARENT (8c60bd1) every test here FAILS but 1c, a control.
   The browser half: test/chromium/owed-first-verify.js.
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const CT = R('js/views/contract.js');
const PD = R('js/paperdesk.js');
const MC = R('js/mobile-contract.js');
const I18N = R('js/i18n.js');
const fnBody = (src, name) => { const i = src.indexOf('function ' + name + '('); if (i < 0) return ''; return src.slice(i, src.indexOf('\n}', i) + 2); };
const BOOKS = (() => {
  const en = {}, sv = {};
  for (const m of I18N.matchAll(/^\s+([a-z][a-z0-9_]*): '((?:[^'\\]|\\.)*)',?\s*$/gm)){
    if (!(m[1] in en)) en[m[1]] = m[2]; else if (!(m[1] in sv)) sv[m[1]] = m[2];
  }
  return { en, sv };
})();

function detailsStage(){
  const ctx = {
    i18t: k => k, DET_RECORD_KEYS: ['party', 'counterparty', 'value', 'effDate'],
    negoExecuted: () => false, isMonetary: c => c.valueType !== 'none',
    fxIsPay: c => String(((c && c.metadata) || {}).category || '') === 'employment',
    ndaIs: c => /NDA/.test(c.name || ''), ndaClean: n => (n && (n.dir || n.ends || n.forGood)) ? n : null,
    blankFormLive: () => false,
  };
  vm.createContext(ctx); vm.runInContext(fnBody(CT, 'detailsOf'), ctx);
  return ctx;
}
const keys = d => JSON.parse(JSON.stringify(d.items.map(x => x.key + ':' + x.open)));

describe('f710 (1) what is owed', () => {
  test('1a an NDA owes its two facts until a person confirms them', () => {
    const { detailsOf } = detailsStage();
    const nda = { name: 'Mutual NDA', counterparty: 'Kettle', valueType: 'none', fields: { effDate: '2026-11-01' } };
    assert.deepEqual(keys(detailsOf(nda)).filter(k => /^nda/.test(k)), ['ndaDir:true', 'ndaEnds:true']);
    assert.deepEqual(keys(detailsOf({ ...nda, nda: { dir: 'mutual' } })).filter(k => /^nda/.test(k)), ['ndaDir:false', 'ndaEnds:true'], 'one confirmed, one owed');
    assert.deepEqual(keys(detailsOf({ ...nda, nda: { dir: 'mutual', forGood: true } })).filter(k => /^nda/.test(k)), ['ndaDir:false', 'ndaEnds:false'], 'kept for good is an answer');
    assert.equal(detailsOf({ name: 'Supply agreement', counterparty: 'X', fields: {} }).items.some(x => x.kind === 'nda'), false, 'not an NDA: nothing');
  });
  test('1b base pay counts on an employment agreement, read as pay', () => {
    const { detailsOf } = detailsStage();
    const job = { name: 'Employment', counterparty: 'Annika', valueType: 'none', metadata: { category: 'employment' }, fields: {} };
    const it = detailsOf(job).items.find(x => x.key === 'value');
    assert.ok(it && it.open && it.label === 'ov_f_pay', JSON.stringify(it));
    assert.equal(detailsOf({ ...job, value: 145000 }).items.find(x => x.key === 'value').open, false);
    assert.equal(detailsOf({ ...job, metadata: {} }).items.some(x => x.key === 'value'), false, 'no money and no pay: not asked');
  });
  test('1c a signed contract owes nothing, as before', () => {
    const { detailsOf } = detailsStage();
    assert.equal(detailsOf({ name: 'NDA', status: 'Signed', fields: {} }).items.length, 0);
  });
});

describe('f710 (2) one worklist, the boxes untouched', () => {
  test('2a the face lays the painters\' hosts flat and adds its own headings', () => {
    const f = fnBody(PD, 'pdFillFaceHtml');
    assert.match(f, /class="pd-ff pd-ff-work\$\{_pdFillFolded \? '' : ' is-filled-open'\}"/);
    for (const k of ['data-pd-ff-owh', 'data-pd-ff-fdh', 'data-pd-ff-doc', 'id="det-basics"', 'id="pd-fill"']) assert.ok(f.includes(k), k);
  });
  test('2b each row is placed by a mark set when the face is painted; a count marks only rows drawn again', () => {
    const m = fnBody(PD, 'pdFillMark');
    assert.match(m, /if \(!all && r\.hasAttribute\('data-pd-owed'\)\) return;/, 'a row being answered is never moved under the hand');
    assert.match(m, /const owed = open\.has\(k\) \? open\.get\(k\) :/, 'detailsOf decides, by key');
    assert.match(fnBody(PD, 'pdFillFacePaint'), /pdFillMark\(c, true\);/);
    assert.match(fnBody(PD, 'pdFillCounts'), /pdFillMark\(c, false\);/);
    assert.match(m, /el\.style\.display !== want\) el\.style\.display = want;/, 'the inline display is changed on the element, never !important');
  });
  test('2c one fold for what is answered, kept for the sitting; a landing on an answered box opens it', () => {
    assert.match(PD, /\[data-pd-ff-fold\]'\)\)\{ e\.preventDefault\(\);\n\s+const ff = host\.querySelector\('\.pd-ff'\); if \(ff\)\{ ff\.classList\.toggle\('is-filled-open'\); _pdFillFolded = !ff\.classList\.contains\('is-filled-open'\); \}/);
    assert.match(fnBody(PD, 'pdFillLand'), /box\.closest\('\[data-pd-owed="0"\]'\)/);
  });
  test('2d base pay and the NDA facts keep their own doors: the full page and the phone', () => {
    assert.match(fnBody(CT, 'cdBoxHtml'), /if\(x\.key==='value'&&window\.fxIsPay&&fxIsPay\(c\)\)/);
    assert.match(fnBody(CT, 'cdBoxHtml'), /if\(x\.kind==='nda'\)/);
    assert.match(fnBody(CT, 'detNdaRows'), /data-det-nda=/);
    assert.match(CT, /closest\('\[data-det-nda\]'\); if\(!b\) return;\n\s+e\.preventDefault\(\); if\(window\.ndaEditOpen\) ndaEditOpen/);
    assert.match(fnBody(MC, 'mDetBoxHtml'), /if\(x\.kind==='nda'\) return/);
  });
  test('2e the new words, in both books', () => {
    for (const k of ['pd_ff_owed', 'pd_ff_filled', 'pd_ff_doc', 'pd_ff_doc_pending', 'pd_ff_doc_in', 'det_f_nda_dir', 'det_f_nda_ends', 'det_nda_confirm', 'det_nda_change', 'det_nda_from_clause', 'det_nda_from_wording', 'det_nda_unsaid', 'det_on_computer'])
      for (const lang of ['en', 'sv']) assert.ok(BOOKS[lang][k], k + ' ' + lang);
  });
});
