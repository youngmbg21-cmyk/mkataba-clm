'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f763 — OUR PAPER AND THE BUILDER, THE FIRST CHECK'S FIXES (round 21 of the
   redesign, "Paper first", 19 Oct 2026; js/views/library.js,
   js/views/templatebuilder.js, js/views/inspector.js, server/server.js)
   A separate checker compared the drawing with the build and found:
   (1) the last clause's marks sat UNDER the signature block — the last clause
       ends at the signatures (tplPfSheetSections' `end`, TPL_PF_SIG_RE);
   (2) the panel's tab said "Our standards 6" while Jambo said "3 of 4" — the
       sentence names what it reads against where the two differ;
   (3) "The book 19 · Templates 13" — the Templates tab counts every template
       and opens on All, as drawn ("24 · 24"); numbers plain, no pill;
   (4) Jambo's proposals sat after Governing law — they and Add go before the
       closing clauses (tbProposalSpot), the Outline too;
   (5) once folded, the › was gone — the strip's arrow stands first, where it
       stood; the builder keeps its own fold;
   (6) Skip was this browser's alone — it is kept on the template, on the
       server (PUT /api/templates/:id/skipped);
   (7) the list's "Draft a contract" opened the older form — the one New
       agreement form (tplDraftFrom);
   (8) the builder's paper is clean: no dots, the gutter under the hand only,
       the name without a pencil, the stream without a swatch, labels dropped
       below 1400 wide, Add block quiet, the letterhead folded to one line.
   AT THE PARENT (gaps/D, a179f38) every test here FAILS.
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { JSDOM } = require('jsdom');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const LIB = R('js/views/library.js');
const TB = R('js/views/templatebuilder.js');
const INS = R('js/views/inspector.js');
const TL = R('js/views/templatelib.js');
const HTML = R('index.html');
const I18N = R('js/i18n.js');
const fnBody = (src, name) => { const i = src.indexOf('function ' + name + '('); if (i < 0) return ''; return src.slice(i, src.indexOf('\n}', i) + 2); };
const BOOKS = (() => {
  const en = {}, sv = {};
  for (const m of I18N.matchAll(/^\s+([a-z][a-z0-9_]*): ["']((?:[^"'\\]|\\.)*)["'],?\s*$/gm)){
    if (!(m[1] in en)) en[m[1]] = m[2]; else if (!(m[1] in sv)) sv[m[1]] = m[2];
  }
  return { en, sv };
})();

describe('f763 (1) the last clause ends at the signatures', () => {
  test('1a its marks go before "Signed for …", never under the signature block', () => {
    const dom = new JSDOM(`<div class="tpl-pf-sheet"><h1>Master services agreement</h1>
      <h2>1. Services</h2><p>The Supplier provides the Services.</p>
      <h2>2. Governing law</h2><p>This agreement is governed by the laws of Kenya.</p>
      <p><strong>Signed for Highland Corporate Ltd</strong><br>Name: <span class="hati-field">full name</span></p></div>`);
    const ctx = { document: dom.window.document, String, TPL_PF_SIG_RE: null };
    vm.createContext(ctx);
    const sig = /const TPL_PF_SIG_RE = [^\n]+/.exec(LIB);
    assert.ok(sig, 'TPL_PF_SIG_RE is one constant');
    vm.runInContext(fnBody(LIB, 'tplPfSheetSections') + '\n' + fnBody(LIB, 'tplPfMarkPlace') + '\n' + sig[0].replace('const ', 'var '), ctx);
    const sheet = dom.window.document.querySelector('.tpl-pf-sheet');
    const secs = ctx.tplPfSheetSections(sheet);
    assert.equal(secs.length, 2);
    assert.equal(secs[1].head, 'Governing law');
    assert.equal(secs[1].text, 'This agreement is governed by the laws of Kenya.', 'the signature block is not the clause\'s text');
    const at = ctx.tplPfMarkPlace(sheet, secs[1]);
    assert.ok(at.before && /^Signed for/.test(at.before.textContent), 'the marks go in before the signatures');
  });
  test('1b the signature words are templateFormDocHtml\'s own', () => {
    assert.match(R('js/templateform.js'), /<p><strong>Signed for \$\{party\}<\/strong>/);
    assert.match(LIB, /const TPL_PF_SIG_RE = \/\^Signed for\\b\/;/);
  });
});

describe('f763 (2) one number for Our standards on the page', () => {
  test('2a where the paper\'s set differs from the tab, the sentence says what it is read against', () => {
    const b = fnBody(LIB, 'tplPfSaid');
    assert.match(b, /const differs = cov\.total !== paperStandardsCount\(\);/);
    assert.match(b, /const base = differs && tplPfBookKey\(card\) === '_default';/);
    assert.match(b, /i18tn\('lib_pf_j_meets_all' \+ k,/);
    assert.match(b, /i18t\('lib_pf_j_meets_some' \+ k,/);
  });
  test('2b the words, in both books', () => {
    for (const k of ['lib_pf_j_meets_all_for_one', 'lib_pf_j_meets_all_for_other', 'lib_pf_j_meets_some_for',
      'lib_pf_j_meets_all_base_one', 'lib_pf_j_meets_all_base_other', 'lib_pf_j_meets_some_base']){
      assert.ok(BOOKS.en[k] && BOOKS.sv[k] && BOOKS.en[k] !== BOOKS.sv[k], k);
    }
    assert.equal(BOOKS.en.lib_pf_j_meets_some_base, 'It meets {met} of the {n} standards every contract is read against; still to meet: {list}.');
  });
});

describe('f763 (3) the tabs\' numbers', () => {
  test('3a the Templates tab counts every template and opens on All', () => {
    assert.match(LIB, /let _tplPage=\{ group:'all', stream:null, q:'', showAll:false, kind:'all' \};/);
    assert.match(LIB, /\$\{i18t\('nav_templates'\)\}<span class="st-tab-n">\$\{rows\.length\}<\/span><\/button>/);
    assert.match(fnBody(LIB, 'paperTabCounts'), /list=rows\.length;/);
  });
  test('3b plain numbers on Our paper\'s tabs, by scope', () => {
    assert.match(LIB, /<div class="st-tabs tpl-tabs" role="tablist">/);
    assert.match(HTML, /\.paper-tabs \.st-tab \.st-tab-n,\.tpl-tabs \.st-tab \.st-tab-n\{background:none;padding:0;font-family:inherit;/);
  });
});

describe('f763 (4) proposals before the closing clauses', () => {
  test('4a one reading of where a standard goes, for the paper, Add and the Outline', () => {
    assert.match(TB, /const TB_CLOSING_RE = \/\\b\(governing law\|applicable law/);
    assert.match(fnBody(TB, 'tbProposalSpot'), /return law >= 0 \? law : sig;/);
    assert.match(fnBody(TB, 'tbAddStandard'), /const at = tbProposalSpot\(\);[\s\S]*_tb\.blocks\.splice\(at, 0, h, w\);/);
    assert.match(fnBody(TB, 'tbPaperHtml'), /if \(i === propsAt\) putProps\(\);/);
    assert.match(fnBody(TB, 'tbOutlineTabHtml'), /const spot = props\.length \? tbProposalSpot\(\) : -1;/);
  });
  test('4b the closing words, both languages', () => {
    const re = new RegExp(/const TB_CLOSING_RE = \/(.+)\/i;/.exec(TB)[1], 'i');
    for (const w of ['Governing law', 'Applicable law', 'Disputes', 'Tillämplig lag', 'Tvister']) assert.ok(re.test(w), w);
    for (const w of ['Liability', 'Confidentiality', 'Payment', 'Law firm fees']) assert.ok(!re.test(w), w);
  });
});

describe('f763 (5) press it again: the fold', () => {
  test('5a the strip\'s arrow stands first, where the › stood, on both panels', () => {
    assert.match(fnBody(INS, 'jlDoorHtml'), /data-jl-door aria-expanded="false"[^`]*><svg class="igd-door-o"[^>]*><use href="#i-left"\/><\/svg><span class="igd-door-i">/);
    assert.match(INS, /data-jl-fold aria-expanded="true"/);
    assert.match(TB, /data-tb-fold aria-expanded="true"/);
  });
  test('5b the builder keeps its own fold', () => {
    assert.match(TB, /const TB_FOLD_KEY = 'hati\.v1\.tbFold';/);
    assert.doesNotMatch(fnBody(TB, 'tbRailFold'), /jlFoldSet/);
  });
});

describe('f763 (6) a skip is kept on the template, on the server', () => {
  let h, w;
  before(async () => { const { startHati, seedWorkspace } = require('./helpers'); h = await startHati(); w = await seedWorkspace(h, { approvalRules: [] }); });
  after(async () => { if (h) await h.stop(); });
  test('6a PUT /api/templates/:id/skipped adds and takes back; the template reads it back', async () => {
    const t = (await w.admin.json('/api/templates', { method: 'POST', body: { name: 'Reseller agreement', category: 'sales' } })).template;
    assert.deepEqual(t.skippedStandards, []);
    const r = await w.admin.json(`/api/templates/${t.id}/skipped`, { method: 'PUT', body: { category: 'Confidentiality' } });
    assert.deepEqual(r.skippedStandards, ['Confidentiality']);
    await w.admin.json(`/api/templates/${t.id}/skipped`, { method: 'PUT', body: { category: 'Confidentiality' } });
    assert.deepEqual((await w.admin.json('/api/templates/' + t.id)).template.skippedStandards, ['Confidentiality'], 'once, never twice');
    await w.admin.json(`/api/templates/${t.id}/skipped`, { method: 'PUT', body: { category: 'Confidentiality', undo: true } });
    assert.deepEqual((await w.admin.json('/api/templates/' + t.id)).template.skippedStandards, []);
    const bad = await w.admin.raw(`/api/templates/${t.id}/skipped`, { method: 'PUT', body: {} });
    assert.equal(bad.status, 400);
    const none = await w.admin.raw('/api/templates/tpl_nope/skipped', { method: 'PUT', body: { category: 'X' } });
    assert.equal(none.status, 404);
  });
  test('6b the builder reads the template, never this browser', () => {
    assert.doesNotMatch(TB, /hati\.v1\.tbSkipped/);
    assert.match(fnBody(TB, 'tbSkip'), /await api\(`templates\/\$\{_tb\.tid\}\/skipped`, 'PUT', \{ category \}/);
    assert.match(fnBody(TB, 'tbSkippedOf'), /t\.skippedStandards/);
  });
});

describe('f763 (7) one door to draft from a company template', () => {
  test('7a the list\'s "Draft a contract" and the template page open the one New agreement form', () => {
    assert.match(fnBody(LIB, 'tplDraftFrom'), /openNewAgreement\(\{ pick:\{ kind:'lib', id \} \}\)/);
    assert.match(LIB, /label:i18t\('lib_draft_contract'\), run:\(\)=>tplDraftFrom\(r\.id\)/);
    assert.match(LIB, /\[data-tpllib-use\]'\)\.forEach\(b=>b\.addEventListener\('click',\(\)=>tplDraftFrom\(/);
    assert.match(TL, /\(window\.tplDraftFrom \|\| tplLibNewContract\)\(t\.id\)/);
  });
});

describe('f763 (8) the builder\'s paper is clean', () => {
  test('8a no dots; the gutter under the hand or caret only', () => {
    assert.doesNotMatch(fnBody(TB, 'tbPaperHtml'), /tb-dot/);
    assert.match(TB, /\.tb-row:hover>\.tb-g,\.tb-row:focus-within>\.tb-g\{opacity:1\}/);
    assert.doesNotMatch(TB, /\.tb-sec\.is-on>\.tb-row-h>\.tb-g\{opacity:1\}/);
  });
  test('8b the head: no pencil, no swatch, labels dropped below 1400', () => {
    const h = fnBody(TB, 'tbHeadHtml');
    assert.doesNotMatch(h, /pencil/);
    assert.doesNotMatch(h, /class="sw"/);
    assert.match(TB, /@media \(max-width:1399px\)\{ \.tb-fchip \.k\{display:none\} \}/);
  });
  test('8c Add block quiet on a computer; the letterhead one line until pressed', () => {
    assert.match(TB, /@media \(hover:hover\)\{ \.tb-paper:not\(:hover\):not\(:focus-within\) \.tb-add\{opacity:0\}/);
    assert.match(fnBody(TB, 'tbPaintBranding'), /<details class="tb-bf"\$\{_tbBrandOpen \? ' open' : ''\}>/);
  });
});
