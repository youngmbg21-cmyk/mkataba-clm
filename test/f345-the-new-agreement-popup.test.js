/* f345 — THE NEW AGREEMENT POP-UP (Young, 21 Sep 2026: "you have not
   implemented pop ups like this", over the redesign artifact's own pop-up)
   ==========================================================================
   One screen replaces a four-row menu, a picker and a form. The claims here
   are the ones the source can hold: every door the menu offered has a home on
   the pop-up (the redesign's one rule), the right-hand card is the existing
   door's own form mounted rather than a fourth form, nothing here mints a
   contract, the sentence hand-off lands in the open pop-up, and the words are
   in both books. The look is a browser's to measure (new-agreement-verify). */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadViews, STUB_FOLDERS } = require('./dom');

const ROOT = path.join(__dirname, '..');
const SRC = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const WZ = SRC('js/wizard.js'), APP = SRC('js/app.js'), DR = SRC('js/draft.js');
const TF = SRC('js/templatefields.js'), LIB = SRC('js/views/library.js'), TL = SRC('js/views/templatelib.js');
const I18N = SRC('js/i18n.js'), HTML = SRC('index.html');
const region = (src, name) => { const i = src.indexOf('function ' + name + '('); assert.ok(i >= 0, name + ' exists');
  const j = src.indexOf('\nfunction ', i + 1); return src.slice(i, j < 0 ? undefined : j); };
const NA = region(WZ, 'openNewAgreement');

const T = {};
for (const [id, kind] of Object.entries({ RM: 'Raw Materials Supply', ND: 'NDA', PS: 'Professional Services', LE: 'Premises Lease', MK: 'Marketing Services' }))
  T[id] = { id, kind, name: kind, blurb: kind + ' agreement', folder: 'proc', valueType: 'estimated', ic: 'file' };
function stage(over = {}) {
  const modals = [];
  const sb = loadViews(['js/wizard.js'], {
    TEMPLATES: T, FOLDERS: STUB_FOLDERS,
    openModal: html => { modals.push(String(html)); return { innerHTML: '' }; },
    closeModal(){}, canEdit: () => true, isAdmin: () => true,
    currentUser: () => ({ name: 'Amina', role: 'admin' }),
    templateFields: () => [], tplMapLabel: () => '', validateField: () => null, saveSettings(){},
    state: { contracts: [], settings: {}, view: 'dashboard' },
    ...over,
  });
  return { sb, modals };
}

describe('f345 (1) the + button opens one screen', () => {
  test('every New agreement button reaches openNewAgreement, and the menu is the fallback', () => {
    assert.match(APP, /const nb=e\.target\.closest\?\.\('\[data-page-new\]'\);[\s\S]{0,200}if\(window\.openNewAgreement\)\{ openNewAgreement\(\); return; \}/);
    assert.match(APP, /function openNewMenu\(anchor\)\{[\s\S]{0,900}if\(window\.openNewAgreement\)\{ openNewAgreement\(\); return; \}/);
    assert.match(APP, /function renderNewMenu\(\)/, 'the menu is kept whole for a stage without the pop-up');
  });
  test('openWizard() with no template named IS the pop-up; with one it is still the answer step', () => {
    assert.match(WZ, /if\(!tid && typeof openNewAgreement==='function'\) return openNewAgreement\(\{ prefill \}\);/);
    const { sb, modals } = stage();
    sb.openWizard();
    assert.match(modals[0], /id="na-root"/);
    sb.openWizard('RM');
    assert.match(modals[1], /id="wz-create"/, 'the answer step, as before');
    assert.ok(!/id="na-root"/.test(modals[1]));
  });
  test('and the sentence door opens the same screen with the caret in the box', () => {
    assert.match(DR, /if\(typeof openNewAgreement==='function'\) return openNewAgreement\(\{ say:true \}\);/);
    assert.match(NA, /if\(o\.say && say\) say\.focus\(\);/);
  });
});

describe('f345 (2) nothing a person could press disappeared', () => {
  test('the four menu rows have homes: describe, template, upload, import', () => {
    assert.match(NA, /id="dr-say"/, 'describe what you need');
    assert.match(NA, /data-wz-\$\{r\.kind\}=/, 'the doors carry data-wz-lib / -mine');
    assert.match(NA, /data-wz-tid="\$\{esc\(r\.id\)\}"/, 'the chips carry data-wz-tid');
    assert.match(NA, /id="na-upload"[\s\S]{0,300}id="na-import"/);
    assert.match(NA, /getElementById\('na-upload'\)\?\.addEventListener\('click', \(\)=>\{ closeModal\(\); if\(typeof openUploadModal==='function'\) openUploadModal\(\); \}\)/);
    assert.match(NA, /getElementById\('na-import'\)\?\.addEventListener\('click', \(\)=>\{ closeModal\(\); if\(typeof setView==='function'\) setView\('migration'\); \}\)/);
  });
  test('the picker\'s search, streams and line of business survive on it', () => {
    assert.match(NA, /say\?\.addEventListener\('input',\(\)=>\{ clearTimeout\(_t\); _t=setTimeout\(paintLists, 120\); \}\)/, 'the sentence box filters as you type');
    assert.match(region(WZ, 'naHit'), /\$\{r\.name\} \$\{r\.sub\} \$\{r\.stream\}/, 'over name, description and stream — the browse by stream, by another door');
    assert.match(NA, /id="wz-industry"/, 'the admin\'s line of business');
    assert.match(NA, /forYouPick\(tmpls\)\.list\.concat/, 'and FOR YOU\'s order leads the chips');
  });
  test('the word filter is forgiving, and an empty query lists everything', () => {
    const { sb } = stage();
    const r = { name: 'Packaging Supply Agreement', sub: 'Bottles, cartons, films and labels', stream: 'Procurement' };
    assert.equal(sb.naHit(r, 'a two-year NDA with a Swedish packaging supplier'), true, 'one word of the sentence is enough');
    assert.equal(sb.naHit(r, 'procurement'), true, 'the stream is searched');
    assert.equal(sb.naHit(r, 'lease'), false);
    assert.equal(sb.naHit(r, 'a'), true, 'a word under three letters narrows nothing');
  });
  test('nothing matching says so and still draws every door', () => {
    assert.match(NA, /const none=naHasWords\(q\)&&!hits\.length;\s*const show=none\?all:hits;/);
    assert.match(NA, /na_no_match_find/);
  });
});

describe('f345 (3) the card is the existing door\'s own form, and this file mints nothing', () => {
  test('three doors mount into the card and hand back their acts', () => {
    assert.match(NA, /api=wizardFormMount\(hostOpts, id, prefill\)/);
    assert.match(NA, /api=\(typeof tplLibNewContract==='function'\)\?tplLibNewContract\(id, prefill, hostOpts\):null/);
    assert.match(NA, /api=\(typeof createFromCustomTemplate==='function'\)\?createFromCustomTemplate\(id, prefill, hostOpts\):null/);
    assert.match(NA, /getElementById\('na-create'\)\?\.addEventListener\('click', \(\)=>\{ if\(api\) api\.create\(\)/);
    assert.match(NA, /getElementById\('na-skip'\)\?\.addEventListener\('click', \(\)=>\{ if\(api\) api\.skip\(\)/);
  });
  test('each host form returns { create, skip, count } and keeps its own validation', () => {
    const ce = region(TF, 'openContractEssentials');
    assert.match(ce, /if\(o\.host\)\{[\s\S]*?return \{ create, skip, count: fs\.length \};/);
    assert.match(ce, /const create = \(\) => \{[\s\S]*?validateField\(\{ \.\.\.f, required:false \}, raw\)/, 'the same check, in the one closure');
    assert.match(ce, /getElementById\('ce-create'\)\.addEventListener\('click', create\)/, 'the dialog presses the same closure');
    const tf = region(LIB, 'openTemplateFillModal');
    assert.match(tf, /if\(ho && ho\.host\)\{[\s\S]*?return \{ create, skip, count \};/);
    assert.match(tf, /getElementById\('tf-create'\)\.addEventListener\('click',create\)/);
    const wm = region(WZ, 'wizardFormMount');
    assert.match(wm, /return \{ create:\(\)=>createFromWizard\(tid, vars\), skip:\(\)=>createFromWizard\(tid, vars, \{skip:true\}\), count:vars\.length\+1, vars \};/);
    assert.match(TL, /function tplLibNewContract\(id, prefill, ho\)[\s\S]{0,600}return openContractEssentials\(\{ \.\.\.\(ho \|\| \{\}\),/);
  });
  test('the answer step and the card draw the question box from ONE renderer', () => {
    assert.match(WZ, /const input=wzFieldHtml;/, 'the answer step');
    assert.match(region(WZ, 'wizardFormMount'), /vars\.map\(wzFieldHtml\)/, 'the card');
    assert.equal((WZ.match(/function wzFieldHtml\(/g) || []).length, 1);
  });
  test('the pop-up itself creates nothing', () => {
    for (const bad of ['nextId(', 'persist(', 'contractArrived(', 'state.contracts.unshift', 'changes.push', 'negoFileChange('])
      assert.ok(!NA.includes(bad), 'openNewAgreement must not ' + bad);
  });
  test('the sentence hand-off lands in the open pop-up, and opens a door only where none is open', () => {
    assert.match(region(DR, 'draftHandOff'), /if\(typeof naPickFromDraft==='function' && naPickFromDraft\(pick, prefill\)\) return;\s*closeModal\(\);/);
    const np = region(WZ, 'naPickFromDraft');
    assert.match(np, /if\(!root \|\| typeof root\._naPick!=='function' \|\| !pick\) return false;/);
    assert.match(np, /const kind=pick\.kind==='builtin'\?'tid':pick\.kind;/);
  });
  test('the paper beside the questions survives, on a wide screen, and the line is said', () => {
    assert.match(WZ, /const NA_PAPER_MIN_W = 1600;/);
    assert.match(NA, /\$\{wide\?`<div id="na-paper" class="na-paper"><\/div>`:''\}/);
    assert.match(NA, /maxWidth: wide\?'1240px':'960px'/);
    assert.match(HTML, /\.na-body\.na-wide\{ grid-template-columns:minmax\(0,1fr\) minmax\(0,1fr\) 380px; \}/);
  });
});

describe('f345 (4) the clothes and the words', () => {
  test('the pop-up is dressed in HaTi\'s sheet, to the reference\'s numbers', () => {
    assert.match(HTML, /\.na-body\{ display:grid; grid-template-columns:minmax\(0,1fr\) 380px; gap:20px; padding:18px 20px;/);
    assert.match(HTML, /\.na-head\{ display:flex; align-items:flex-start; gap:10px; padding:14px 20px; border-bottom:1px solid var\(--color-divider\); \}/);
    assert.match(HTML, /\.na-foot\{ display:flex; align-items:center; gap:8px; padding:12px 20px; border-top:1px solid var\(--color-divider\); \}/);
    assert.match(HTML, /\.na-doors\{ display:grid; grid-template-columns:1fr 1fr; gap:12px; \}/);
    assert.match(HTML, /\.na-chip\{[^}]*height:26px; padding:0 9px; border:1px dashed var\(--rule-strong\); border-radius:13px;/);
    assert.match(HTML, /\.na-card-h\{ display:flex; align-items:center; gap:10px; padding:12px 16px; border-bottom:1px solid var\(--color-divider\); \}/);
    assert.ok(!/\.na-[a-z-]*\{[^}]*!important/.test(HTML), 'never !important');
  });
  test('the three creation forms read the field-height token', () => {
    assert.match(TF, /min-height:var\(--field-h,36px\)/);
    assert.match(region(LIB, 'openTemplateFillModal'), /min-height:var\(--field-h,36px\)/);
    assert.match(WZ, /const WZ_ST='width:100%;min-height:var\(--field-h,36px\)/);
    assert.match(HTML, /--field-h:32px/);
  });
  test('every word is in both books, and differently', () => {
    const KEYS = ['na_title', 'na_sub', 'na_describe', 'na_find', 'na_find_hint', 'na_company', 'na_saved', 'na_hati', 'na_go',
      'na_questions_one', 'na_questions_other', 'na_skip', 'na_note', 'na_note_wide', 'na_received', 'na_upload', 'na_import',
      'na_no_match', 'na_no_match_find', 'na_pick_first'];
    for (const k of KEYS) {
      const m = [...I18N.matchAll(new RegExp('\\n    ' + k + ": '([^']*)',", 'g'))].map(x => x[1]);
      assert.equal(m.length, 2, k + ' in both books');
      if (k !== 'na_go') assert.notEqual(m[0], m[1], k + ' translated');
    }
  });
});
