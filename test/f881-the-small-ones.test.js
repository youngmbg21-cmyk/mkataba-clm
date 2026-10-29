/* f881 — THE SMALL ONES FROM THE OWNER'S LIST (25 Oct 2026, items 11, 12, 17, 19)

   11  Jambo's greeting, his words and his answers sit 16px inside every panel
       (they sat 14px in on the list pages and the Calendar; Home's 16).
   12  The page's card and Jambo's panel are level: the builder's panel started
       flush under the bar (its head card 6px lower), Our paper and the
       Calendar ended 16px and 12px above the panel's foot, the Board's first
       card 4px below its top. The tidy sweep now measures it on every page.
   17  A button the code readies after a mouse or finger press draws no ring
       (the browser drew the keyboard ring on "‹ Back to the paper", "‹ Paper"
       and "All N" after a jump); after a key it still does.
   19  In Their view the Redlines tab counts what their column draws (it said 3,
       our unsent change included, over a column reading 2).
   Red at the parent: none of these lines existed. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const fnBody = (src, name) => { const i = src.indexOf('function ' + name + '('); if (i < 0) return ''; return src.slice(i, src.indexOf('\n}', i) + 2); };
const HTML = read('index.html'), CAL = read('js/views/calendar.js'), TB = read('js/views/templatebuilder.js');
const CORE = read('js/core.js'), COMP = read('js/components.js'), PD = read('js/paperdesk.js'), LIB = read('js/views/library.js');
const SWEEP = read('test/chromium/tidy-sweep-verify.js');

describe('f881 (11) — 16px inside every Jambo panel', () => {
  test('his greeting, his words and his answers', () => {
    assert.match(HTML, /:is\(\.jl-greet, \.cal-cop \.cal-plan-body\) > \.jb-hello\{padding:16px 16px 0;/);
    assert.match(HTML, /\.jl-words\{padding:16px 16px 4px;/);
    assert.match(HTML, /\.jl-feed\{padding:6px 16px 16px;/);
    assert.match(CAL, /\.cal-cop \.cal-yw\{padding:16px 16px 6px\}/);
    assert.match(CAL, /\.cal-cop \.cal-plan-talk\{[^}]*padding:8px 16px 16px\}/);
  });
});

describe('f881 (12) — the page and the panel are level', () => {
  test('the builder\'s panel floats as every panel does, its top on the head card\'s ring', () => {
    assert.match(TB, /@media \(min-width:1101px\)\{[\s\S]*?#tb-railslot\{margin:-6px calc\(8px - var\(--page-pad-x\)\) calc\(8px - var\(--page-pad-b\)\) 0\}/);
    assert.match(TB, /\.tb-page:not\(\.no-rail\) > \.tb-left\{margin-bottom:calc\(8px - var\(--page-pad-b\)\)\}/);
    assert.match(TB, /\.tb-rail\.tb-jl\{border-left:0;border-radius:var\(--radius-lg\);box-shadow:var\(--shadow-sm\)\}/);
  });
  test('Our paper, the Calendar and the Board meet the panel\'s lines', () => {
    assert.match(LIB, /class="view-enter sap-page tpl-page" style="padding:var\(--page-pad\);padding-bottom:var\(--tpl-pb,var\(--page-pad\)\)"/);
    assert.match(HTML, /#content \.view-enter\.tpl-page:has\(\.ins-panel\.is-jambo\)\{--tpl-pb:8px\}/);
    assert.match(CAL, /\.cal-page\.is-home \.cal-body\{padding-top:var\(--s-3\);padding-bottom:8px\}/);
    assert.match(HTML, /#ig-page \.hb-board\{padding-top:8px\}/);
  });
  test('the tidy sweep measures it on every page, the builder and a template\'s page among them', () => {
    assert.match(SWEEP, /const LEVEL = `/);
    assert.match(SWEEP, /level with Jambo's panel`, Math\.abs\(L\.dTop\) <= 1 && !\(L\.dBot > 1 && L\.dBot <= 24\)/);
    assert.match(SWEEP, /k: 'template', name: "Our paper · a template's page"/);
    assert.match(SWEEP, /k: 'builder', name: 'Our paper · the builder'/);
  });
});

describe('f881 (17) — no ring after a press', () => {
  test('the one focuser asks for no ring after a mouse or a finger, never on a box you type in', () => {
    const f = fnBody(CORE, 'fieldFocus');
    assert.match(f, /if \(_lastPress !== 'key' && !FOCUS_TYPED\.test\(el\.tagName\) && !el\.isContentEditable && o\.focusVisible == null\) o\.focusVisible = false;/);
    assert.match(CORE, /const FOCUS_TYPED = \/\^\(INPUT\|TEXTAREA\|SELECT\)\$\/;/);
  });
  test('the lander readies its button through it', () => {
    assert.match(fnBody(COMP, 'landOn'), /else if \(typeof fieldFocus === 'function'\) try \{ fieldFocus\(b, \{ preventScroll: true \}\); \} catch \(_\)\{\}/);
  });
});

describe('f881 (19) — Their view counts what they see', () => {
  test('the Redlines tab asks their column\'s own count, from their seat, quietly', () => {
    const t = fnBody(PD, 'pdTabCount');
    assert.match(t, /if \(t === 'red' && pdRedTheirs\(c\) && typeof rlOpenCardCount === 'function'\)\{/);
    assert.match(t, /rlHiddenFrom\(c, 'counterparty'\)/);
    assert.match(t, /return n \? \{ n, tone: 'quiet' \} : null;\s*\n\s*\}\s*\n\s*if \(t === 'red'\)\{ const D = dossierOf\(c\);/);
  });
});

describe('f881 (20) — one person is named once on the Signer line', () => {
  test('the other side\'s contact who is the reader (same name or same address) is not named a second time', () => {
    const f = fnBody(PD, 'pdCkSignerSay');
    assert.match(f, /const same = !!\(me && tn && \(/);
    assert.match(f, /them\.email && me\.email && String\(them\.email\)\.trim\(\)\.toLowerCase\(\) === String\(me\.email\)\.trim\(\)\.toLowerCase\(\)/);
    assert.match(f, /return \[me && me\.name, same \? '' : tn\]\.filter\(Boolean\)\.map\(short\)\.join\(' · '\);/);
  });
});
