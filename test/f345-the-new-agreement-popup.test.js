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
    /* RE-POINTED IN PLACE 22 Sep 2026 (proposal C). The doors and the chips
       became ONE rail row, so there is one builder and one attribute shape
       for all three shelves instead of two builders that could drift. The
       CLAIM is unchanged: every shelf's rows carry the attribute the one
       delegated handler answers, so nothing a person could press went. */
    assert.match(NA, /data-wz-\$\{r\.kind\}=/, 'one row builder, every shelf');
    assert.equal((NA.match(/data-wz-\$\{r\.kind\}=/g) || []).length, 1, 'and there is only one of it');
    assert.match(NA, /b\.hasAttribute\('data-wz-lib'\)[\s\S]{0,200}data-wz-mine[\s\S]{0,200}data-wz-tid/,
      'and the handler still answers all three');
    /* REVERSED 23 Sep 2026 (Young: "remove the Upload it link") — upload is a door in front of this screen (openNewDoors), so the screen's own link is gone and Import stays. */
    assert.ok(!/id="na-upload"/.test(NA) && !/getElementById\('na-upload'\)/.test(NA), 'no second way to the upload dialog');
    assert.match(NA, /id="na-import"/);
    assert.match(NA, /getElementById\('na-import'\)\?\.addEventListener\('click', \(\)=>\{ closeModal\(\); if\(typeof setView==='function'\) setView\('migration'\); \}\)/);
  });
  test('the picker\'s search, streams and line of business survive on it', () => {
    /* RE-POINTED IN PLACE 22 Sep 2026: the same listener also fits the box to
       its own content now (Young: "the describe what you need should be able
       to wrap text"). The CLAIM is the filter, and it is untouched. */
    assert.match(NA, /say\?\.addEventListener\('input',\(\)=>\{ naSayFit\(say\); clearTimeout\(_t\); _t=setTimeout\(paintLists, 120\); \}\)/, 'the sentence box filters as you type');
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
    /* RE-POINTED IN PLACE 21 Sep 2026: both presses go through one wrapper
       now (goCreate), which marks the people named on this screen as claimed
       before handing over — a hold spent by a creation must not be dropped by
       the screen's own teardown. The CLAIM is unchanged: the foot presses the
       chosen door's own act and this file mints nothing itself. */
    assert.match(NA, /getElementById\('na-create'\)\?\.addEventListener\('click', goCreate\(\(\)=>api\.create\(\)\)\)/);
    assert.match(NA, /getElementById\('na-skip'\)\?\.addEventListener\('click', goCreate\(\(\)=>api\.skip\(\)\)\)/);
    assert.match(NA, /const goCreate=fn=>\(\)=>\{ if\(!api\)/, 'and the wrapper still refuses without a door');
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
  /* RE-POINTED IN PLACE 22 Sep 2026 — Young chose proposal C. The line moved
     1600 -> 1280 and the frame's three tracks became rail | questions | paper,
     so the agreement is drawn on the screen he actually uses. The CLAIM is the
     one that mattered: there is ONE line, it is stated, and the frame and the
     grid read the same numbers rather than each typing their own.
     REVERSED IN PLACE 23 Sep 2026 — Young: "remove paper from the pop up
     entirely and in any type of computer", then option 1, the ask across the
     top. There is no paper line any more because there is no paper; what the
     claim still holds is its second half — the frame and the grid read the
     SAME numbers. At the parent the paper host was drawn and handed to the
     form, and all four of its numbers were published. */
  test('the pop-up draws no paper at any width, and the numbers that remain are said once', () => {
    const code = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
    assert.ok(!/id="na-paper"/.test(code(NA)), 'no paper host is drawn');
    assert.match(code(NA), /paperHost:null/, 'and the mounted form is handed none');
    assert.ok(!/NA_PAPER_MIN_W|NA_PAPER_W|NA_FRAME_W\b|NA_STACK_MIN_W/.test(code(WZ)),
      'the four numbers the paper needed are gone, not kept dormant');
    assert.match(WZ, /const NA_RAIL_W = 260;/);
    assert.match(WZ, /const NA_FRAME_NARROW_W = 900;/);
    assert.match(NA, /\{ maxWidth: NA_FRAME_NARROW_W\+'px'/, 'the frame reads the constant, at every width');
    assert.ok(!/\.na-body\.na-wide/.test(code(HTML)), 'no third track');
    /* THE TWO HOSTS MUST AGREE about the rail, as they did about the paper. */
    const railCss = /--na-rail-w:(\d+)px/.exec(HTML);
    assert.ok(railCss, 'the stylesheet states the rail');
    assert.equal(+railCss[1], +/const NA_RAIL_W = (\d+);/.exec(WZ)[1], 'the rail is one number');
    assert.ok(!/--na-paper-w/.test(code(HTML)), 'and the paper\'s width token went with the paper');
  });
});

describe('f345 (4) the clothes and the words', () => {
  test('the pop-up is dressed in HaTi\'s sheet, to the reference\'s numbers', () => {
    /* RE-POINTED IN PLACE 22 Sep 2026: the picker's column leads now (proposal
       C) and its width is a token both hosts read. The rest of the frame —
       the gap, the padding, the head, the foot, the card — is untouched. */
    assert.match(HTML, /\.na-body\{ display:grid; grid-template-columns:var\(--na-rail-w\) minmax\(0,1fr\); gap:20px; padding:18px 20px;/);
    assert.match(HTML, /\.na-head\{ display:flex; align-items:flex-start; gap:10px; padding:14px 20px; border-bottom:1px solid var\(--color-divider\); \}/);
    assert.match(HTML, /\.na-foot\{ display:flex; align-items:center; gap:8px; padding:12px 20px; border-top:1px solid var\(--color-divider\); \}/);
    /* THE CARDS AND THE CHIPS ARE GONE, and so are their rules — see f360.
       What replaced them is the Templates page's own rail, borrowed rather
       than reinvented, which is what this claim now holds. */
    assert.ok(!/\.na-doors\{/.test(HTML) && !/\.na-chip\{/.test(HTML), 'no rule survives for a card or a chip');
    assert.match(HTML, /\.na-pick\{[^}]*border-radius:var\(--radius\)/);
    assert.match(HTML, /\.na-pick\.on,\.na-pick\.on:hover\{ background:var\(--accent-fill\); \}/);
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
