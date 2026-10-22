'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f764 — OUR PAPER AND THE BUILDER, THE SECOND CHECK'S FIXES (round 21 of the
   redesign, "Paper first", 19 Oct 2026; js/views/templatebuilder.js,
   js/views/library.js, js/wizard.js, index.html)
   A second, separate checker found:
   (1) the Build tab named a section by its POSITION ("Section 1 · Parties",
       "Section 6") where the paper and the Outline print "·" and "5." — the
       panel now says the paper's own number (tbPaperNo, tbNoHead);
   (2) the builder arrived with a dashed frame round the first section — the
       frame shows only while the reader writes in it;
   (3) after Skip the standards line said nothing of it — it says what was
       skipped, with "Propose it again" (the same one writer, undo);
   (4) the Templates list showed a company template's stream as "—" and the
       builder's head its long name — one stream, said alike (its short name,
       the whole on the hover);
   (5) the signatures sat tight under the last clause's marks;
   (6) Draft from it said "Contracts › New agreement" from Our paper — the
       crumb names Our paper.
   AT THE PARENT (gaps/D, b7f6228) every test here FAILS.
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadViews } = require('./dom');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const TB = R('js/views/templatebuilder.js');
const LIB = R('js/views/library.js');
const WZ = R('js/wizard.js');
const HTML = R('index.html');
const I18N = R('js/i18n.js');
const BOOKS = (() => {
  const en = {}, sv = {};
  for (const m of I18N.matchAll(/^\s+([a-z][a-z0-9_]*): ["']((?:[^"'\\]|\\.)*)["'],?\s*$/gm)){
    if (!(m[1] in en)) en[m[1]] = m[2]; else if (!(m[1] in sv)) sv[m[1]] = m[2];
  }
  return { en, sv };
})();

const VERSION = blocks => ({
  version: { versionNumber: 1, status: 'draft' },
  blocks: blocks.map((b, i) => ({ orderIndex: i, blockType: b[0], content: b[1] })),
  fields: [],
});
const RESELLER = [
  ['heading', 'Parties'], ['field_group', 'This agreement is made between us and the Reseller.'],
  ['heading', 'Territory'], ['field_group', 'The Territory is Kenya.'],
  ['heading', 'Prices and payment'], ['field_group', 'Invoices are payable within 30 days of the invoice date.'],
  ['heading', 'Liability'], ['field_group', "Each party's total liability is capped at the fees paid in the 12 months before the claim."],
  ['heading', 'Governing law'], ['field_group', 'This agreement is governed by the laws of Kenya.'],
  ['signature_block', 'Highland Corporate Ltd'],
];
const CALLS = [];
const stage = async (skipped) => {
  const w = loadViews(['js/fieldlib.js', 'js/clausemodel.js', 'js/playbook.js', 'js/views/templatebuilder.js'], {
    state: { contracts: [], settings: {}, aiConfigured: true, view: 'templates' },
    API_MODE: () => true, canEdit: () => true, copilotAvailable: () => true,
    jamboHintHtml: () => '<p class="jb-hint">Typing never signs, sends or files — a press does.</p>',
    api: async (p, m, body) => {
      CALLS.push([p, m || 'GET', body || null]);
      if (p === 'templates/tpl_1/skipped' && m === 'PUT') return { ok: true, skippedStandards: body.undo ? [] : [body.category] };
      if (p === 'templates/tpl_1') return { template: { id: 'tpl_1', name: 'Reseller agreement', category: 'other', folder: 'sales', skippedStandards: skipped || [] } };
      if (p === 'templates/tpl_1/versions/tv_1') return VERSION(RESELLER);
      if (p === 'org/branding') return { branding: { logoUrl: null, companyName: 'Mkataba', registrationNumber: '', address: '', defaultFooterText: '' } };
      throw new Error('unexpected api call: ' + p);
    },
  });
  await w.openTemplateBuilder('tpl_1', 'tv_1');
  await new Promise(r => setTimeout(r, 0));
  const read = () => ({ paper: w.document.getElementById('tb-paperslot').innerHTML, rail: w.document.getElementById('tb-railslot').innerHTML });
  return { w, ...read(), read };
};
const kOf = (w, head) => w.tbSections().find(s => s.head === head).k;

describe('f764 (1) the panel says the paper\'s own number', () => {
  test('1a the unnumbered first section is named by its heading; the fifth is "5"', async () => {
    const s = await stage();
    s.w.tbFocus(kOf(s.w, 'Parties'));
    let rail = s.read().rail;
    assert.match(rail, /<b>✎ Parties<\/b>/);
    assert.doesNotMatch(rail, /Section 1 · Parties/);
    s.w.tbFocus(kOf(s.w, 'Governing law'));
    rail = s.read().rail;
    assert.match(rail, /<b>✎ Section 4 · Governing law<\/b>/, 'the paper prints Governing law as 4.');
    assert.match(s.read().paper, /<span class="tb-n">4\.<\/span><span class="tb-ed tb-hed"[^>]*>Governing law</);
  });
});

describe('f764 (2) the paper arrives clean', () => {
  test('2a the section in hand wears its frame only while the reader writes in it', () => {
    assert.match(TB, /\.tb-sec\.is-on:focus-within\{outline:1px dashed/);
    assert.doesNotMatch(TB, /\.tb-sec\.is-on\{outline:/);
  });
});

describe('f764 (3) a skip is said, with its way back', () => {
  test('3a the Outline says what was skipped, and "Propose it again" sends the undo', async () => {
    const s = await stage(['Data protection']);
    s.w.tbSetTab('outline');
    const rail = s.read().rail;
    if (!/Data protection/.test(rail)) return assert.fail('the seed reads no missing Data protection standard: ' + rail.slice(0, 400));
    assert.match(rail, /Skipped for this template: Data protection\. <button type="button" class="ui-link" data-tb-unskip="Data protection">Propose it again<\/button>/);
    CALLS.length = 0;
    await s.w.tbSkip('Data protection', { undo: true });
    assert.equal(JSON.stringify(CALLS.filter(c => c[1] === 'PUT')), JSON.stringify([['templates/tpl_1/skipped', 'PUT', { category: 'Data protection', undo: true }]]));
    s.w.tbPaintPaper();
    assert.match(s.read().paper, /data-tb-prop="Data protection"/, 'the proposal is back on the paper');
  });
  test('3b the words, in both books', () => {
    for (const k of ['tb_ol_std_skipped', 'tb_ol_unskip']) assert.ok(BOOKS.en[k] && BOOKS.sv[k] && BOOKS.en[k] !== BOOKS.sv[k], k);
  });
});

describe('f764 (4) one stream, said alike', () => {
  test('4a the Templates list carries a company template\'s stream', () => {
    assert.match(LIB, /rows\.push\(\{ kind:'company', id:t\.id, name:t\.name, draft,[\s\S]{0,120}stream:t\.folder\|\|null,/);
  });
  test('4b the builder\'s head says the short name, the whole on the hover', async () => {
    const s = await stage();
    s.w.FOLDERS = { sales: { name: 'Sales & Route-to-Market', color: '#123456' } };
    s.w.tplShortStream = n => String(n || '').split(' & ')[0];
    s.w.tbPaintHead();
    const head = s.w.document.getElementById('tb-head').innerHTML;
    assert.match(head, /data-tb-meta="stream"\s+title="[^"]*Sales &amp; Route-to-Market[^"]*"[\s\S]*?<span class="v">Sales<\/span>/);
    assert.match(LIB, /tplDraftFrom,tplShortStream,/, 'published for the builder');
  });
});

describe('f764 (5) the signatures stand apart', () => {
  test('5a space between the last clause\'s marks and "Signed for …"', () => {
    assert.match(HTML, /\.tpl-pf-sheet \.tpl-mks \+ p\{margin-top:var\(--s-6\);\}/);
  });
});

describe('f764 (6) the New agreement crumb names where it came from', () => {
  /* RE-POINTED 22 Oct 2026 (owner: "Always open beside Jambo"): the form now goes Home first
     (naHomeFirst), so the crumb reads the page it was STARTED on, kept before the move (fromView) */
  test('6a from Our paper: "Our paper › New agreement"', () => {
    assert.match(WZ, /const fromView=\(typeof state==='object'&&state\)\?state\.view:'';\n  const naFrom=naHomeFirst\(\);/);
    assert.match(WZ, /crumb:`\$\{i18t\(\(fromView==='templates'\|\|fromView==='playbook'\)\?'nav_tpl_std':'nav_contracts'\)\} › \$\{i18t\('na_title'\)\}`/);
  });
});

describe('f764 (7) the bar names the builder', () => {
  test('7a while the builder is in front the bar says "Builder" (round 21\'s tab), and the builder asks the bar to repaint', () => {
    const CN = R('js/views/counter.js');
    const i = CN.indexOf('function deskPageName('); const body = CN.slice(i, CN.indexOf('\n}', i));
    assert.match(body, /if \(typeof window !== 'undefined' && typeof window\.tbOnScreen === 'function' && window\.tbOnScreen\(\)\) return _cnT\('tb_jl_word'\);/);
    assert.match(TB, /const tbOnScreen = \(\) => typeof document !== 'undefined' && !!document\.getElementById\('tb-page'\);/);
    assert.match(TB, /tbPaintBranding\(\);\n  if \(typeof window\.deskBarPaint === 'function'\) window\.deskBarPaint\(\);/);
    assert.equal(BOOKS.en.tb_jl_word, 'Builder');
  });
});
