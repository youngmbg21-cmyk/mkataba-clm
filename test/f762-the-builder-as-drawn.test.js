'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f762 — THE TEMPLATE BUILDER AS DRAWN (round 21 of the redesign, "Paper
   first", scene b — the owner's "build all the gaps", 18 Oct 2026;
   js/views/templatebuilder.js)
   (1) Jambo's panel beside the paper: his tab, "Builder", ‹ Jambo, › fold
       (the lists' own remembered fold); tabs Build · Outline · Playbook
       <met>/<total> · Blanks <n>; it opens on the Outline where the paper
       has sections, on Build where it is empty.
   (2) The Outline: "·" for the unnumbered first section, the paper's own
       numbers, "1 blank", ✓ where a standard is met, "+ <standard> proposed";
       then what the blanks ask and how many of Our standards it meets.
   (3) Jambo proposes ON the paper, where Add puts it (before the signatures):
       "Jambo proposes · <standard>" · Add · Skip · "Our standard: …"; never
       wording; Skip is kept for the template; marks under met sections.
   (4) The ask box as drawn on every tab ("Ask for anything, or type /", the
       word Ask; since Chambers, 20 Oct 2026, no hint line under it) — "/"
       leaves the page through tbLeave (caSlTake's `_caLeave`), and a
       question from another tab is answered on Build.
   (5) Everything the builder did keeps its one writer: tbAddBlock the only
       push, tbFocus the only writer of the section in hand besides the open.
   (6) The words, in both books.
   AT THE PARENT (gaps/A1, d2a4eb4) every test here FAILS.
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadViews } = require('./dom');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const TB = R('js/views/templatebuilder.js');
const CA = R('js/copilotacts.js');
const I18N = R('js/i18n.js');
const fnBody = (src, name) => { const i = src.indexOf('function ' + name + '('); if (i < 0) return ''; return src.slice(i, src.indexOf('\n}', i) + 2); };
const BOOKS = (() => {
  const en = {}, sv = {};
  for (const m of I18N.matchAll(/^\s+([a-z][a-z0-9_]*): ["']((?:[^"'\\]|\\.)*)["'],?\s*$/gm)){
    if (!(m[1] in en)) en[m[1]] = m[2]; else if (!(m[1] in sv)) sv[m[1]] = m[2];
  }
  return { en, sv };
})();

const VERSION = (blocks, fields) => ({
  version: { versionNumber: 1, status: 'draft' },
  blocks: blocks.map((b, i) => ({ orderIndex: i, blockType: b[0], content: b[1] })),
  fields: (fields || []).map(([k, l]) => ({ field_key: k, label: l, field_type: 'short_text', control: 'free', options: [], required: false })),
});
const RESELLER = [
  ['heading', 'Parties'], ['field_group', 'This agreement is made between us and {{reseller_name}}.'],
  ['heading', 'Territory'], ['field_group', 'The Territory is {{territory}}.'],
  ['heading', 'Prices and payment'], ['field_group', 'Invoices are payable within 30 days of the invoice date.'],
  ['heading', 'Liability'], ['field_group', "Each party's total liability is capped at the fees paid in the 12 months before the claim."],
  ['heading', 'Governing law'], ['field_group', 'This agreement is governed by the laws of Kenya.'],
  ['signature_block', 'Highland Corporate Ltd'],
];
const CALLS = [];
const stage = async (blocks, fields) => {
  const w = loadViews(['js/fieldlib.js', 'js/clausemodel.js', 'js/playbook.js', 'js/views/templatebuilder.js'], {
    state: { contracts: [], settings: {}, aiConfigured: true, view: 'templates' },
    API_MODE: () => true, canEdit: () => true, copilotAvailable: () => true,
    jamboHintHtml: () => '<p class="jb-hint">Typing never signs, sends or files — a press does.</p>',
    api: async (p, m, body) => {
      CALLS.push([p, m || 'GET', body || null]);
      if (p === 'templates/tpl_1/skipped' && m === 'PUT') return { ok: true, skippedStandards: [body.category] };
      if (p === 'templates/tpl_1') return { template: { id: 'tpl_1', name: 'Reseller agreement', category: 'other', folder: 'sales' } };
      if (p === 'templates/tpl_1/versions/tv_1') return VERSION(blocks, fields);
      if (p === 'org/branding') return { branding: { logoUrl: null, companyName: 'Mkataba', registrationNumber: '', address: '', defaultFooterText: '' } };
      throw new Error('unexpected api call: ' + p);
    },
  });
  await w.openTemplateBuilder('tpl_1', 'tv_1');
  await new Promise(r => setTimeout(r, 0));
  const read = () => ({ paper: w.document.getElementById('tb-paperslot').innerHTML, rail: w.document.getElementById('tb-railslot').innerHTML });
  return { w, ...read(), read };
};
const FIELDS = [['reseller_name', 'Reseller name'], ['territory', 'Territory']];

describe('f762 (1) Jambo\'s panel beside the paper', () => {
  test('1a his tab, "Builder", ‹ Jambo and the fold; tabs Build · Outline · Playbook n/m · Blanks n', async () => {
    const s = await stage(RESELLER, FIELDS);
    assert.match(s.rail, /<aside class="tb-rail tb-jl[^"]*" id="tb-rail"/);
    assert.match(s.rail, /<div class="jl-head tb-jh">[\s\S]*data-tb-jambo[\s\S]*<span class="jl-word"[^>]*>Builder<\/span>[\s\S]*class="pd-back" data-tb-jambo[\s\S]*data-tb-fold/);
    assert.match(s.rail, /data-tb-door/, 'the folded strip is drawn to open it again');
    const tabs = [...s.rail.matchAll(/data-tb-tab="(\w+)"[^>]*>([^<]+)(?:<span class="n[^"]*">([^<]+)<\/span>)?/g)].map(m => [m[1], m[2], m[3] || '']);
    assert.deepEqual(tabs.map(t => t[0]), ['build', 'outline', 'playbook', 'blanks']);
    assert.match(tabs[2][2], /^\d+\/\d+$/, 'Playbook says met of total');
    assert.equal(tabs[3][2], '2');
  });
  test('1b it opens on the Outline where the paper has sections; on Build where it is empty', async () => {
    assert.match((await stage(RESELLER, FIELDS)).rail, /data-tb-tab="outline" aria-selected="true"/);
    assert.match((await stage([])).rail, /data-tb-tab="build" aria-selected="true"/);
  });
  /* RE-POINTED (check #1, 19 Oct 2026): the builder keeps its OWN fold — the
     lists' key opened the builder folded after Our paper's panel was folded —
     and the strip's arrow stands first, where the › stood */
  test('1c the fold is the builder\'s own remembered fold, and the page gives the strip its column', () => {
    assert.match(TB, /const TB_FOLD_KEY = 'hati\.v1\.tbFold';/);
    assert.match(fnBody(TB, 'tbRailFolded'), /localStorage\.getItem\(TB_FOLD_KEY\) === '1'/);
    assert.doesNotMatch(fnBody(TB, 'tbRailFolded') + fnBody(TB, 'tbRailFold'), /jlFold/);
    assert.match(fnBody(TB, 'tbRailFold'), /localStorage\.setItem\(TB_FOLD_KEY, '1'\)[\s\S]*classList\.toggle\('is-railfold', !!on\)/);
    assert.match(TB, /class="tb-door" data-tb-door aria-expanded="false"[^>]*><svg[^>]*><use href="#i-left"\/><\/svg><span class="tb-door-i">/, 'the arrow first, where the › stood');
    assert.match(TB, /\.tb-page\.is-railfold\{grid-template-columns:minmax\(0,1fr\) calc\(46px - var\(--page-pad-x\)\)\}/);
    assert.match(TB, /#tb-railslot\{margin:calc\(-1 \* var\(--page-pad-t\)\) calc\(-1 \* var\(--page-pad-x\)\) calc\(-1 \* var\(--page-pad-b\)\) 0\}/, 'the panel stands at the window\'s edge, to the foot');
  });
});

describe('f762 (2) the Outline', () => {
  test('2a every section in paper order, "·" first, numbers, "1 blank", ✓ where met, "+ … proposed"', async () => {
    const s = await stage(RESELLER, FIELDS);
    const rows = [...s.rail.matchAll(/<button type="button" class="tb-ol-r[^"]*" data-tb-ol(?:-prop)?="[^"]*"><span class="tb-ol-n">([^<]*)<\/span><span class="tb-ol-h">([^<]*)<\/span>([\s\S]*?)<\/button>/g)]
      .map(m => [m[1], m[2], /1 blank/.test(m[3]) ? 'blank' : /tb-ol-ok/.test(m[3]) ? 'ok' : /proposed/.test(m[3]) ? 'proposed' : '']);
    /* RE-POINTED (check #1, 19 Oct 2026): the proposed rows stand where the
       paper draws them — before Governing law, as round 21 draws them */
    assert.deepEqual(rows.slice(0, 4), [['·', 'Parties', 'blank'], ['1', 'Territory', 'blank'], ['2', 'Prices and payment', 'ok'], ['3', 'Liability', 'ok']]);
    assert.deepEqual(rows[rows.length - 1], ['4', 'Governing law', 'ok']);
    const mid = rows.slice(4, -1);
    assert.ok(mid.length >= 1 && mid.every(r => r[0] === '+' && r[2] === 'proposed'), JSON.stringify(rows));
  });
  test('2b what the blanks ask, and how many of Our standards it meets', async () => {
    const s = await stage(RESELLER, FIELDS);
    assert.match(s.rail, /<p class="tb-ol-sh">Blanks <span class="tb-ol-cnt">2<\/span><\/p><p class="tb-ol-p">Reseller name · Territory: asked of whoever drafts from it\.<\/p>/);
    assert.match(s.rail, /<p class="tb-ol-sh">Our standards<\/p><p class="tb-ol-p">\d+ of \d+ met\. .+ (is|are) proposed on the paper\.<\/p>/);
  });
  test('2c a row lands on its section (landOn) and keeps the Outline open', () => {
    assert.match(TB, /hit\('\[data-tb-ol\]'\)\)\) \{ const k = Number\(b\.getAttribute\('data-tb-ol'\)\); tbFocus\(k, \{ keepTab: true \}\);\s*if \(typeof landOn === 'function'\) landOn\(`\[data-tb-sec="\$\{k\}"\]`/);
    assert.match(fnBody(TB, 'tbFocus'), /if \(sec && !opts\.keepTab\) _tb\.tab = 'build';/);
  });
});

describe('f762 (3) Jambo proposes on the paper', () => {
  test('3a where Add puts it — before the signatures — with Add · Skip and our standard said; never wording', async () => {
    const s = await stage(RESELLER, FIELDS);
    const at = s.paper.indexOf('class="tb-props"'), sig = s.paper.indexOf('class="tb-sigs"');
    assert.ok(at > 0 && sig > at, 'before the signatures');
    /* RE-POINTED (check #1, 19 Oct 2026): and before Governing law, as drawn */
    const law = s.paper.indexOf('>Governing law<'), liab = s.paper.indexOf('>Liability<');
    assert.ok(liab > 0 && liab < at && at < law, JSON.stringify({ liab, at, law }));
    assert.match(s.paper, /<div class="tb-prop" data-tb-prop="([^"]+)" contenteditable="false" data-not-wording>[\s\S]*?<b>Jambo proposes · \1<\/b>[\s\S]*?data-tb-prop-add="\1"[^>]*>Add<\/button>[\s\S]*?data-tb-prop-skip="\1"[^>]*>Skip<\/button><\/div>\s*<p>Our standard: [^<]+\.<\/p>/);
  });
  test('3b Add is our standard\'s own wording through the one push; Skip is kept for this template', async () => {
    assert.match(TB, /if \(\(b = hit\('\[data-tb-prop-add\]'\)\)\) \{ tbAddStandard\(b\.getAttribute\('data-tb-prop-add'\)\); return; \}/);
    assert.match(fnBody(TB, 'tbAddStandard'), /const h = tbAddBlock\('heading', category\); const w = tbAddBlock\('field_group', lib \? lib\.preferred : ''\);/);
    const s = await stage(RESELLER, FIELDS);
    const cat = /data-tb-prop="([^"]+)"/.exec(s.paper)[1];
    CALLS.length = 0;
    await s.w.tbSkip(cat); s.w.tbPaintPaper(); s.w.tbPaintRail();
    const after = s.read();
    assert.ok(!after.paper.includes(`data-tb-prop="${cat}"`) && !after.rail.includes(`data-tb-ol-prop="${cat}"`), 'gone from the paper and the Outline');
    /* RE-POINTED (check #1, 19 Oct 2026): a skip is kept ON THE TEMPLATE, on
       the server — no longer this browser's alone */
    assert.equal(JSON.stringify(CALLS.filter(c => c[1] === 'PUT')), JSON.stringify([['templates/tpl_1/skipped', 'PUT', { category: cat }]]));
    assert.equal(s.w.localStorage.getItem('hati.v1.tbSkipped'), null, 'nothing kept in the browser');
    assert.equal(JSON.stringify(s.w.tbSkippedOf()), JSON.stringify([cat]), 'the template now carries it');
  });
  test('3c marks under the sections that meet a standard, inside the section, never editable', async () => {
    const s = await stage(RESELLER, FIELDS);
    assert.match(s.paper, /data-tb-sec="\d+"[\s\S]*?Invoices are payable within 30 days[\s\S]*?<div class="tpl-mks" data-not-wording contenteditable="false"><span class="tpl-mk"[^>]*>[\s\S]*?Payment within 30 days<\/span><\/div><\/div>/);
    assert.match(fnBody(TB, 'tbPaperHtml'), /const closeSec = \(\) => \{ if \(open\) \{ html \+= tbMarksHtml\(marksBy\.get\(openK\)\) \+ '<\/div>';/);
  });
});

describe('f762 (4) the ask box as drawn', () => {
  test('4a on every tab: "Ask for anything, or type /", the word Ask, "/" the places, and no hint line under the box', async () => {
    const s = await stage(RESELLER, FIELDS);
    /* RE-POINTED 20 Oct 2026 (owner picked "Two-row card" for every Jambo box): the words the whole width, + and the round send on their own row under them, drawn by the one builder (jamboCardHtml) */
    assert.match(s.rail, /<div class="tb-foot">(<div class="jb-card" id="tb-askrow">)?<textarea id="tb-ask"[^>]*data-ca-slash placeholder="Ask for anything, or type \/"/);
    assert.match(s.rail, /data-tb-send[^>]*aria-label="[^"]+"/);
    /* RE-POINTED 20 Oct 2026 (Chambers: no hint line under any Jambo box) */
    assert.doesNotMatch(s.rail, /jb-hint|jb-keys|Typing never signs, sends or files/, 'no hint line inside the foot');
    s.w.tbSetTab('blanks'); assert.match(s.read().rail, /id="tb-ask"/, 'the box stays on another tab');
  });
  test('4b a question from another tab is answered on Build; "/" leaves through tbLeave', () => {
    assert.match(fnBody(TB, 'tbSend'), /if \(_tb\.tab !== 'build'\) \{ _tb\.tab = 'build'; tbPaintRail\(\); \}/);
    assert.match(fnBody(TB, 'tbPaintRail'), /box\._caLeave = then => tbLeave\(then\);/);
    assert.match(fnBody(CA, 'caSlTake'), /const leave = P\.inp && typeof P\.inp\._caLeave === 'function' \? P\.inp\._caLeave : null;\s*if \(leave\) leave\(\(\) => caPlaceRun\(r\.k\)\); else caPlaceRun\(r\.k\);/);
  });
});

describe('f762 (5) one writer each', () => {
  test('5a tbAddBlock is still the only push; tbFocus and the open the only writers of the section in hand', () => {
    assert.equal((TB.match(/_tb\.blocks\.push\(/g) || []).length, 1);
    assert.equal((TB.match(/_tb\.focus = /g) || []).length, 2);
    assert.match(TB, /if \(hit\('\[data-tb-jambo\]'\)\) \{ _tb\.tab = 'build'; tbFocus\(null\); return; \}/, '‹ Jambo is Build with nothing in hand, through tbFocus');
  });
});

describe('f762 (6) the words', () => {
  test('6a in both books', () => {
    const keys = ['tb_tab_outline', 'tb_jl_word', 'tb_ol_none', 'tb_ol_blanks_one', 'tb_ol_blanks_other', 'tb_ol_meets', 'tb_ol_dev', 'tb_ol_dev_t', 'tb_ol_proposed',
      'tb_ol_blanks_ask', 'tb_ol_blanks_none', 'tb_ol_std_h', 'tb_ol_std_all_one', 'tb_ol_std_all_other', 'tb_ol_std_some', 'tb_ol_std_prop_one', 'tb_ol_std_prop_other', 'tb_ol_and',
      'tb_prop_h', 'tb_prop_add', 'tb_prop_skip', 'tb_prop_add_t', 'tb_prop_add_t_none', 'tb_prop_skip_t', 'tb_prop_std', 'tpl_mk_met_t', 'tpl_mk_dev_t', 'tpl_mk_dev',
      'tpl_mk_changed_one', 'tpl_mk_changed_other', 'tpl_mk_changed_t', 'tpl_u_days', 'tpl_u_months'];
    for (const k of keys) for (const lang of ['en', 'sv']) assert.ok(BOOKS[lang][k], k + ' ' + lang);
    assert.equal(BOOKS.en.tb_tab_outline, 'Outline');
    assert.equal(BOOKS.en.tb_prop_h, 'Jambo proposes · {s}');
  });
});
