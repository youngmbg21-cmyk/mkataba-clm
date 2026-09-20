/* f340 — four off two screenshots and a pop-up (Young, 20 Sep 2026)
   =================================================================
   *"Image 1, the entry field for the end Date and value stream are
   overlapping. Image 2, even through I have answered which side we are on, i
   still get an error when i try to create draft. On a different issue, when i
   try to generate an agreement by describing what i need, the pull should
   generate from the company Standard contracts … Also review the pop up in
   image 3 and [ensure] it has no bugs plus it works easily without adding any
   confusion in how to navigate and use."*

   FOUR RULINGS, ONE SCREEN'S WORTH OF WORK EACH. Every claim below was
   proved red against the commit before the fix; where one is a named CONTROL
   it says so on the line.

   The pixel half of ruling 1 is NOT here — a grid blowout is a browser
   measurement and lives in a real browser (form-and-picker-verify). What is
   here is the declaration that makes it impossible. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');
const SRC = f => { try { return fs.readFileSync(path.join(ROOT, f), 'utf8'); } catch (_) { return ''; } };
/* COMMENTS ARE PROSE. Every note below quotes the defect it fixed, so a sweep
   that reads a file whole finds the very shape it is banning — this repo's
   own standing lesson. */
const CODE = f => SRC(f).replace(/\/\*[\s\S]*?\*\//g, ' ');

const TF = SRC('js/templatefields.js'), TF_CODE = CODE('js/templatefields.js');
const WZ = SRC('js/wizard.js'), WZ_CODE = CODE('js/wizard.js');
const LIB = CODE('js/views/library.js');
const DRAFT = SRC('js/draft.js'), DRAFT_CODE = CODE('js/draft.js');
const SRV = CODE('server/server.js');
const HTML = SRC('index.html');
const I18N = SRC('js/i18n.js');

/* The pure readings, on a stage of their own: these three functions touch no
   DOM and no state, which is the whole reason they can be the wall. */
function fields(){
  const sb = { console, Object, String, Number, Array, Math, Date, JSON, RegExp, Boolean, Set, Map,
    isNaN, parseInt, parseFloat, window: null, document: { getElementById: () => null,
      querySelector: () => null, querySelectorAll: () => [] } };
  sb.window = sb;
  vm.createContext(sb);
  vm.runInContext(SRC('js/templatefields.js'), sb, { filename: 'templatefields.js' });
  return sb;
}
const SIDE = { key: 'side', label: 'Which side are we on?', type: 'select', required: false,
  opts: [{ v: '', l: 'Neither — this is not about buying or selling' },
    { v: 'customer', l: 'We are the customer — we pay them' },
    { v: 'supplier', l: 'We are the supplier — they pay us' }] };

/* ════════════════════════════════════════════════════════════════
   1 · A SELECT THAT WAS ANSWERED IS NOT REFUSED
   ════════════════════════════════════════════════════════════════ */
describe('f340 (1) an answered select is accepted, and a refusal names the options', () => {
  test('1a the reported toast, gone: "customer" is accepted', () => {
    assert.equal(fields().validateField(SIDE, 'customer'), null);
    assert.equal(fields().validateField(SIDE, 'supplier'), null);
  });

  test('1b and never names an option as [object Object]', () => {
    const msg = String(fields().validateField(SIDE, 'banana') || '');
    assert.ok(msg, 'a value that is on no list is still refused');
    assert.doesNotMatch(msg, /\[object Object\]/, 'the reported message');
    /* The LABELS, because the labels are what the reader saw in the dropdown;
       the stored value is a word they were never shown. */
    assert.match(msg, /We are the customer/);
    assert.match(msg, /We are the supplier/);
    assert.doesNotMatch(msg, /\bcustomer,/, 'not the stored value');
  });

  test('1c the sentence a person read is accepted too, and resolves to the stored word', () => {
    const w = fields();
    assert.equal(w.validateField(SIDE, 'We are the customer — we pay them'), null);
    assert.equal(w.coerceField(SIDE, 'We are the customer — we pay them'), 'customer');
    assert.equal(w.coerceField(SIDE, 'customer'), 'customer');
  });

  test('1d ONE reading, asked by both, so the wall and the coercion cannot drift', () => {
    const w = fields();
    assert.equal(typeof w.fieldOptHit, 'function');
    assert.equal(w.fieldOptHit(SIDE, 'CUSTOMER').v, 'customer', 'case folded');
    assert.equal(w.fieldOptHit(SIDE, 'banana'), null, 'null where nothing is named');
    assert.match(TF_CODE, /if\(f\.type==='select'\)\{ const hit=fieldOptHit\(f, v\);/);
    assert.match(TF_CODE, /if\(opts\.length && !fieldOptHit\(f, v\)\)/);
  });

  test('1e CONTROL — a plain-string option list still behaves exactly as it did', () => {
    const w = fields();
    const f = { key: 'renew', label: 'Renewal', type: 'select', opts: ['auto-renew', 'no'] };
    assert.equal(w.validateField(f, 'auto-renew'), null);
    assert.equal(w.coerceField(f, 'AUTO-RENEW'), 'auto-renew');
    assert.match(String(w.validateField(f, 'maybe')), /auto-renew, no/);
  });

  test('1f CONTROL — a required select with nothing in it is still required', () => {
    assert.match(String(fields().validateField({ ...SIDE, required: true }, '')), /required/);
  });
});

/* ════════════════════════════════════════════════════════════════
   2 · A FIELD COLUMN MAY NOT GROW PAST ITS SHARE
   ════════════════════════════════════════════════════════════════ */
describe('f340 (2) the three creation doors cap their columns', () => {
  test('2a one declaration, published, and it is minmax(0,1fr)', () => {
    assert.match(TF_CODE, /const FIELD_GRID_CSS = 'display:grid;grid-template-columns:minmax\(0,1fr\) minmax\(0,1fr\)/);
    assert.match(TF_CODE, /Object\.assign\(window,\{[^\n]*FIELD_GRID_CSS/, 'published, because two other files read it');
  });

  test('2b all three doors wear the class and read the one declaration', () => {
    for (const [name, code] of [['essentials', TF_CODE], ['wizard', WZ_CODE], ['saved template', LIB]]) {
      assert.match(code, /class="[^"]*field-grid/, name + ' wears the class');
      assert.match(code, /FIELD_GRID_CSS/, name + ' reads the declaration');
    }
  });

  test('2c and none of them still says 1fr 1fr', () => {
    for (const [name, code] of [['essentials', TF_CODE], ['wizard', WZ_CODE], ['saved template', LIB]])
      assert.doesNotMatch(code, /grid-template-columns:1fr 1fr;gap:var\(--s-3\)/, name);
  });

  test('2d the half that cannot be inline is in the sheet', () => {
    assert.match(HTML, /\.field-grid > \*\{min-width:0;\}/, 'the item may shrink to its track');
    assert.match(HTML, /\.field-grid input, \.field-grid select\{max-width:100%; min-width:0;\}/,
      'and the control may not paint past its box');
  });

  test('2e the two other files fall back to the literal, for a stage without this one', () => {
    for (const [name, code] of [['wizard', WZ_CODE], ['saved template', LIB]])
      assert.match(code, /typeof FIELD_GRID_CSS==='string'\?FIELD_GRID_CSS[\s\S]{0,40}:'display:grid;grid-template-columns:minmax\(0,1fr\) minmax\(0,1fr\)/, name);
  });
});

/* ════════════════════════════════════════════════════════════════
   3 · THE COMPANY'S OWN STANDARD IS LOOKED AT FIRST
   ════════════════════════════════════════════════════════════════ */
describe('f340 (3) draft from a sentence prefers approved paper', () => {
  test('3a one ordered list of shelves, and the ranking comes off it', () => {
    assert.match(DRAFT_CODE, /const DRAFT_BUCKETS = \[/);
    assert.match(DRAFT_CODE, /kind:'lib',\s*rank:1/);
    assert.match(DRAFT_CODE, /kind:'mine',\s*rank:2/);
    assert.match(DRAFT_CODE, /kind:'builtin',\s*rank:3/);
    assert.match(DRAFT_CODE, /draftBucketRank\(a\.c\.kind\)-draftBucketRank\(b\.c\.kind\)/,
      'the sort asks the list, never a second copy of the order');
  });

  test('3b a company standard travels with the questions its own door asks', () => {
    assert.match(DRAFT_CODE, /push\('lib'[\s\S]{0,160}essentialFields\(\)/,
      'it used to send [] and was the least described paper on the list');
  });

  test('3c the shelf travels to the route, and the route ranks by it', () => {
    assert.match(DRAFT_CODE, /candidates:cands\.map\(c=>\(\{[^}]*kind:c\.kind/);
    assert.match(SRV, /const DRAFT_BUCKET_WORD = \{ lib:'company standard', mine:'saved template', builtin:'HaTi template' \}/);
    assert.match(SRV, /DRAFT_BUCKET_WORD\[String\(c\.kind \|\| ''\)\] \? \{ from:/,
      'an ALLOW-LIST, so a caller cannot invent a fourth shelf');
    assert.match(SRV, /"company standard" is paper this company has approved and published\. PREFER IT\./);
  });

  test('3d and both escapes the owner named are in the prompt', () => {
    assert.match(SRV, /THEY CAN OVERRIDE THIS BY SAYING SO/);
    assert.match(SRV, /Only an explicit ask counts/, 'a preference is never read into the kind of agreement');
    assert.match(DRAFT_CODE, /openWizard\(\)/, 'and "Pick one myself" is still on the same screen');
  });

  test('3e a {v,l} option reaches the model as words AND value, never [object Object]', () => {
    assert.doesNotMatch(DRAFT_CODE, /opts\.map\(String\)/, 'the browser half');
    assert.match(DRAFT_CODE, /fieldOpt\(o\)\s*:\s*\{ v:String\(o\), l:String\(o\) \}/);
    assert.doesNotMatch(SRV, /one_of: f\.opts\.slice\(0, 20\)\.map\(o => String\(o\)/, 'the route half');
    assert.match(SRV, /value: String\(o\.v == null \? '' : o\.v\)/);
    assert.match(SRV, /means: String\(o\.l == null \? o\.v : o\.l\)/);
  });

  test('3f the reader is told which shelf it came off, and it is a fact not a claim', () => {
    assert.match(DRAFT_CODE, /id="dr-from"/);
    assert.match(DRAFT_CODE, /draftBucketLabel\(pick\.kind\)/, 'read off the record, not off `why`');
    for (const k of ['dr_from_lib', 'dr_from_mine', 'dr_from_builtin'])
      assert.equal((I18N.match(new RegExp('\\b' + k + ':', 'g')) || []).length, 2, k + ' is in both books');
  });

  test('3g and the dialog says where it looks first, on the lead it already had', () => {
    assert.match(I18N, /dr_lead: 'Copilot looks at your company standards first/);
    assert.equal((I18N.match(/\bdr_lead:/g) || []).length, 2, 'both books');
    /* AND THE OTHER HALF IS ON THE BOX'S HOVER, not a third sentence — the
       pop-up diet pins this lead's length by name, and machinery belongs on
       the hover. */
    assert.equal((I18N.match(/\bdr_shelf_hint:/g) || []).length, 2, 'the hint is in both books');
    assert.match(DRAFT_CODE, /id="dr-say"[^>]*title="\$\{esc\(i18t\('dr_shelf_hint'\)\)\}"/);
  });
});

/* ════════════════════════════════════════════════════════════════
   4 · THE TEMPLATE PICKER
   ════════════════════════════════════════════════════════════════ */
describe('f340 (4) the picker shows your own paper, and has a way out', () => {
  test('4a your company standards and saved templates are on the FRONT screen', () => {
    assert.match(WZ_CODE, /const ours=\[\.\.\.rows\.filter\(r=>r\.pick==='lib'\), \.\.\.rows\.filter\(r=>r\.pick==='mine'\)\]/);
    assert.match(WZ_CODE, /\$\{ours\.length\?`<div[\s\S]{0,200}wz_your_own_paper[\s\S]{0,120}ours\.map\(rowCard\)/,
      'drawn only when there is something in it');
    assert.equal((I18N.match(/\bwz_your_own_paper:/g) || []).length, 2, 'both books');
  });

  test('4b it leads — approved paper before the paper HaTi ships', () => {
    const own = WZ_CODE.indexOf('wz_your_own_paper'), forYou = WZ_CODE.indexOf("i18t('wz_for_you')");
    assert.ok(own > 0 && forYou > 0 && own < forYou, `own paper at ${own}, FOR YOU at ${forYou}`);
  });

  test('4c there is a visible way out', () => {
    assert.match(WZ_CODE, /id="wz-pick-cancel" class="ui-btn">\$\{i18t\('act_cancel'\)\}/);
    assert.match(WZ_CODE, /getElementById\('wz-pick-cancel'\)\?\.addEventListener\('click', closeModal\)/);
  });

  test('4d and what Copilot already read is not thrown away by two of the three doors', () => {
    assert.match(WZ_CODE, /tplLibNewContract\(lb\.getAttribute\('data-wz-lib'\), prefill\)/);
    assert.match(WZ_CODE, /createFromCustomTemplate\(mn\.getAttribute\('data-wz-mine'\), prefill\)/);
  });

  test('4e CONTROL — the picker still mints nothing of its own', () => {
    for (const bad of [/nextId\(/, /state\.contracts\.push/, /persist\(\)/])
      assert.doesNotMatch(WZ.slice(WZ.indexOf('function openWizard'), WZ.indexOf('const renderStep') + 9000), bad,
        'the picker presses doors that already exist');
  });
});

/* ════════════════════════════════════════════════════════════════
   5 · THE SHELF IS LOADED BEFORE IT IS OFFERED, AND AN EMPTY ONE SAYS SO
   ════════════════════════════════════════════════════════════════
   Young, 20 Sep 2026: *"when i try to draft an agreement by describing what
   i want, it still Pulls from hati templates and not Company Standard."*

   MEASURED FIRST, and the measurement did NOT confirm the obvious theory:
   one fetch of /api/templates lands at boot, so on a settled page the shelf
   IS warm and the ranking does prefer a standard. Two real things were
   nevertheless wrong, and they are what is fixed here — the second is far
   more likely to be what the report is about.

   ONE: the list was read when the dialog OPENED, one tick after a fetch
   nobody awaited. Narrow, but real on a slow connection, and reading it at
   the press costs nothing.

   TWO, AND THE LIKELY ONE: with no company standard published there is
   nothing to prefer, and the card said only "A HaTi template" — leaving a
   reader unable to tell a standard that was PASSED OVER from a shelf that
   was EMPTY. Those are different faults and the screen was silent on both. */
describe('f340 (5) the company standards are loaded before they are offered', () => {
  test('5a one shared flight, and the latch is a boolean raised first', () => {
    const TL = CODE('js/views/templatelib.js');
    assert.match(TL, /function tplLibReady\(\)/);
    assert.match(TL, /let _tplLibWarming = false, _tplLibWarmDone = null;/,
      'A LATCH MAY NOT BE ITS OWN PROMISE — the flag exists before the promise');
    assert.match(TL, /if \(_tplLibWarming\) return _tplLibWarmDone;/, 'one flight, shared');
    assert.match(TL, /_tplLibWarming = true;[\s\S]{0,200}_tplLibWarming = false;/,
      'and it comes down, so a failed load may be asked again');
    assert.match(TL, /tplLibRefresh, tplLibReady,/, 'published — two files read it');
  });

  test('5b the draft door reads the list at the PRESS, once the shelf is loaded', () => {
    assert.match(DRAFT_CODE, /async function draftRead\(given\)/);
    assert.match(DRAFT_CODE, /if\(!given && typeof tplLibReady==='function'\) await tplLibReady\(\);/);
    assert.match(DRAFT_CODE, /const cands=given\|\|draftCandidates\(\);/);
    assert.match(DRAFT_CODE, /addEventListener\('click',\(\)=>draftRead\(\)\)/,
      'the door names no list, so it is read fresh');
  });

  test('5c and the picker re-draws when they land — but never over a typed answer', () => {
    assert.match(WZ_CODE, /tplLibReady\(\)\.then\(\(\)=>\{ if\(!tid && tplLibPublished\(\)\.length!==before\) renderStep\(\); \}\)/);
  });

  test('5d AN EMPTY SHELF IS A FACT, read off the list and never guessed', () => {
    const sb = fields();   // js/draft.js is not on that stage; read the source
    assert.ok(sb, 'stage');
    assert.match(DRAFT_CODE, /function draftNoStandards\(cands\)\{[\s\S]{0,160}c\.kind === 'lib'/);
    assert.match(DRAFT_CODE, /pick\.kind!=='lib'&&draftNoStandards\(all\)/,
      'said only where the pick is not a standard AND there was none to be');
    assert.match(DRAFT_CODE, /draftOffer\(pick, prefill, String\(\(r&&r\.why\)\|\|''\), cands\)/,
      'the card is handed the list it was chosen from');
    assert.equal((I18N.match(/\bdr_no_standards:/g) || []).length, 2, 'both books');
  });

  test('5e CONTROL — the ranking itself is untouched', () => {
    assert.match(DRAFT_CODE, /draftBucketRank\(a\.c\.kind\)-draftBucketRank\(b\.c\.kind\)/);
  });
});

/* ════════════════════════════════════════════════════════════════
   6 · A DATE FIELD IS AN ORDINARY BOX
   ════════════════════════════════════════════════════════════════
   Young, 20 Sep 2026, on an iPad: *"Start Date and end Date Field still seem
   not be lining up or to be the same size as the Rest."* MEASURED off the
   screenshot: every other box 477px, both date boxes about 520, and the date
   text centred where every other field's text sits left.

   WEBKIT GIVES input[type=date] ITS OWN INTRINSIC WIDTH AND ITS OWN INNER
   ALIGNMENT, and neither `width:100%` nor the `max-width` added on 20 Sep
   reaches either. CHROMIUM NEEDS NEITHER RULE, so this cannot be reproduced
   in the browser these checks run in — the claims below pin the rules, and
   the screen itself wants confirming on the reporter's own iPad. */
describe('f340 (6) the date boxes match the rest of the form', () => {
  /* ---- WIDENED 20 SEP 2026, because the first pair was not enough ----
     Young reported the overlap a SECOND time off an iPad. The two declarations
     below were on main and the boxes still ran past their column, so the box's
     metrics are STATED rather than left to a shorthand the control may ignore,
     and the picker glyph is pinned to the right wall instead of being left to
     shove the text about. Asked as a RELATION — which properties the rule
     carries — never as the rule's exact bytes, which is what made these two
     claims go red on a change that only added to them. */
  const dateRule = (HTML.match(/\.field-grid input\[type="date"\]\{[\s\S]*?\}/) || [''])[0];
  test('6a the box is sized by us, not by the browser', () => {
    assert.match(dateRule, /appearance:none/, 'it is an ordinary box, not a native control');
    assert.match(dateRule, /box-sizing:border-box/, 'its padding is inside its width');
    assert.match(dateRule, /width:100%/, 'it fills its track');
    assert.match(dateRule, /min-width:0/,
      'and may shrink to it — without this the browser\'s own minimum wins '
      + 'and the two-column grid overflows, which is the reported fault');
  });
  test('6b and its text sits where every other field\'s text sits', () => {
    assert.match(HTML, /::-webkit-date-and-time-value\{[\s\S]*?text-align:left/,
      'left, like every other box on the form');
    assert.match(HTML, /::-webkit-calendar-picker-indicator\{[\s\S]*?margin-left:auto/,
      'and the picker pins right, like a select\'s chevron, rather than '
      + 'pushing the value around');
  });
  test('6c and it is scoped to the three creation forms, nowhere else', () => {
    const rules = HTML.match(/input\[type="date"\]/g) || [];
    assert.ok(rules.length >= 2, 'both rules are there');
    assert.doesNotMatch(HTML.replace(/\/\*[\s\S]*?\*\//g, ' '), /(?<!\.field-grid )input\[type="date"\]/,
      'no unscoped date rule reaches the rest of the product');
  });
});
