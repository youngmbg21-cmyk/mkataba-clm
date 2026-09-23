/* f360 — PROPOSAL C, BUILT (Young, 22 Sep 2026: "Build C but the describe
   what you need should be able to wrap text")
   =========================================================================
   Five proposals were drawn on a canvas after the New agreement pop-up was
   MEASURED in a real browser at five widths; the owner chose C. What C is:
   the paper you have becomes a RAIL of rows down the left, so the questions
   and the agreement both get room, and the agreement is drawn at 1280 rather
   than 1600 — which is to say, on the screen the owner actually uses.

   WHAT THE MEASUREMENT SAID AT 1440x900, before a line moved:
     · the frame was 960x711, columns 518 (picker) and 380 (questions)
     · the contract was NOT ON THAT SCREEN AT ALL (the line was 1600)
     · past 1600 the picker got WORSE: 518 -> 389px, doors 253 -> 189px, and
       all four company-standard names cut off
     · opening "Who else is on this agreement" pushed the whole pop-up into
       scrolling: 673px wanted against 666 available

   The claims here are the ones the source can hold. The look and the numbers
   are a browser's to measure — new-agreement-verify. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const SRC = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const WZ = SRC('js/wizard.js'), HTML = SRC('index.html');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const CSS = strip(HTML);
const region = (src, name) => { const i = src.indexOf('function ' + name + '('); assert.ok(i >= 0, name + ' exists');
  const j = src.indexOf('\nfunction ', i + 1); return src.slice(i, j < 0 ? undefined : j); };
const NA = region(WZ, 'openNewAgreement');

describe('f360 (1) the picker is a rail of rows, and there is one builder', () => {
  test('one row builder answers all three shelves', () => {
    /* TWO BUILDERS FOR ONE ACT IS WHAT DRIFTS, and it already had: the chip
       carried a different hover from the card's, and only the card said which
       stream a thing was filed in. */
    assert.equal((strip(NA).match(/const pickRow=/g) || []).length, 1, 'one builder');
    assert.ok(!/const door=r=>/.test(strip(NA)) && !/const chip=r=>/.test(strip(NA)),
      'and neither of the two it replaced');
    assert.match(NA, /<div class="na-rows">\$\{rs\.map\(pickRow\)\.join\(''\)\}<\/div>/,
      'every shelf draws through it');
    assert.equal((NA.match(/na-rows/g) || []).length, 1, 'into one container class');
  });
  test('the row carries the attribute the one delegated handler answers', () => {
    assert.match(NA, /class="na-pick\$\{sel&&sel\.kind===r\.kind&&sel\.id===r\.id\?' on':''\}" data-wz-\$\{r\.kind\}=/);
    /* THE ONE DOOR IS UNCHANGED: the same listener, on the same element, for
       the same three attributes. Nothing here is a second way to pick. */
    assert.match(NA, /root\.querySelector\('#wz-pick'\)\?\.addEventListener\('click',e=>\{/);
    assert.match(NA, /closest\('\[data-wz-lib\],\[data-wz-mine\],\[data-wz-tid\]'\)/);
  });
  test('a row says its name and its figures, and the whole of it rides the hover', () => {
    assert.match(NA, /const meta=\[r\.go\|\|'', r\.stream\|\|''\]\.filter\(Boolean\)\.join\(' · '\)/,
      'version, usage and stream — an absent one is dropped, never printed empty');
    assert.match(NA, /hint=naCardTitle\(r\)/);
    assert.match(NA, /\$\{hint\?` title="\$\{esc\(hint\)\}"`:''\}/);
    assert.match(NA, /<span class="na-pick-n">\$\{esc\(r\.name\)\}<\/span>/);
    assert.match(NA, /\$\{meta\?`<span class="na-pick-m">\$\{esc\(meta\)\}<\/span>`:''\}/);
  });
  /* A NAMED CONTROL: it passes at the parent too, which is the point — those
     readings and those doors were there before and are there after. */
  test('[control] the description is the STATED cost, and nothing else went', () => {
    /* naCardSub is what the card printed on its face; it still feeds the
       hover through naCardTitle, so no reading was deleted. */
    assert.match(WZ, /function naCardSub\(r\)\{/);
    assert.match(WZ, /function naCardTitle\(r\)\{/);
    const fn = /function naCardTitle\(r\)\{[\s\S]*?\n\}/.exec(WZ)[0];
    assert.match(fn, /naCardSub\(r\)/, 'the sentence the face used to carry');
    for (const keep of ['id="dr-say"', 'id="dr-read"', 'id="dr-out"', 'id="wz-industry"',
      /* id="na-upload" left: REVERSED 23 Sep 2026 (Young: "remove the Upload it link") — upload is a door in front of this screen (openNewDoors) */ 'id="na-import"', 'id="na-people"', 'id="na-create"', 'id="na-skip"', 'id="wz-pick-cancel"'])
      assert.ok(NA.includes(keep), keep + ' still has a home');
  });
  test('[wall] the pop-up still mints nothing of its own', () => {
    for (const bad of ['nextId(', 'persist(', 'contractArrived(', 'state.contracts.unshift', 'changes.push'])
      assert.ok(!NA.includes(bad), 'openNewAgreement must not ' + bad);
  });
});

describe('f360 (2) the ask wraps, and grows with the sentence', () => {
  /* A NAMED CONTROL, and an honest one: this half passed at the parent, because
     the box has been a textarea since 21 Sep. What the owner asked for on
     22 Sep is the growing, which is the claim under it. */
  test('[control] it is a textarea and keeps its cap, its placeholder and its Enter', () => {
    /* IT HAS WRAPPED SINCE 21 SEP. What the owner asked for on 22 Sep is the
       half that was missing: at 236px in the rail a sentence is five lines
       and the box stood at two with a scrollbar inside it. */
    assert.match(NA, /<textarea id="dr-say" class="na-inp na-say"/);
    assert.ok(!/<input id="dr-say"/.test(NA));
    assert.match(NA, /maxlength="\$\{\(typeof DRAFT_SENTENCE_MAX/);
    assert.match(NA, /e\.key==='Enter'&&!e\.shiftKey/, 'Enter presses Find, Shift+Enter is a newline');
  });
  test('naSayFit asks the element, is bounded, and is published', () => {
    const fit = region(WZ, 'naSayFit');
    assert.match(WZ, /const NA_SAY_MAX_LINES = \d+;/, 'the bound is a number said out loud');
    assert.match(fit, /el\.style\.height='auto';/, 'measured from nothing, never accumulated');
    assert.match(fit, /el\.scrollHeight/, 'asked of the element, never of the character count');
    assert.match(fit, /Math\.min\(/, 'and bounded, so a pasted paragraph cannot push the shelf off the screen');
    assert.match(fit, /line\*NA_SAY_MAX_LINES/);
    assert.match(WZ, /naSayFit,NA_SAY_MAX_LINES/, 'published (the ES-module rule)');
    /* IT WRITES NOTHING BUT A HEIGHT. */
    assert.ok(!/\.value\s*=/.test(fit), 'it never touches what was typed');
  });
  test('it runs on every keystroke and once at open', () => {
    assert.match(NA, /say\?\.addEventListener\('input',\(\)=>\{ naSayFit\(say\);/);
    assert.match(NA, /naSayFit\(say\);\s*\n\s*if\(o\.say && say\) say\.focus\(\);/, 'and on arrival, before the caret');
  });
  test('in the rail the box takes the whole line and Find drops under it', () => {
    assert.match(CSS, /\.na-rail \.na-row\{ flex-wrap:wrap; \}/);
    assert.match(CSS, /\.na-rail \.na-row > \.na-say\{ flex:1 0 100%; \}/);
    assert.match(CSS, /\.na-inp\.na-say\{[^}]*height:auto/, 'the field rung is taken back off a growing box');
  });
});

describe('f360 (3) the rail is the product\'s own, and its list is bounded', () => {
  test('it borrows the Templates page\'s rail rather than inventing one', () => {
    const rail = /\.tpl-rail\{[^}]*\}/.exec(CSS)[0];
    const pick = /\.na-pick\{[^}]*\}/.exec(CSS)[0];
    for (const shared of ['border-radius:var(--radius)', 'border:0', 'cursor:pointer', 'text-align:left'])
      assert.ok(pick.includes(shared), 'the row shares the rail\'s ' + shared);
    assert.ok(rail.includes('padding:0 10px') && /padding:5px 10px/.test(pick),
      'the same 10px inset — two lines instead of one is the only difference');
    assert.match(CSS, /\.na-pick:hover\{ background:var\(--color-neutral-100\); \}/, 'the rail\'s own hover');
    assert.match(CSS, /\.tpl-rail\.on,\.tpl-rail\.on:hover\{background:var\(--accent-fill\);color:#fff;/);
    assert.match(CSS, /\.na-pick\.on,\.na-pick\.on:hover\{ background:var\(--accent-fill\); \}/, 'and its own lit state');
    assert.match(CSS, /\.na-pick\.on \.na-pick-n\{ color:#fff/);
  });
  test('the list scrolls inside the rail, on a cap that is derived', () => {
    const r = /\.na-picks\{[^}]*\}/.exec(CSS)[0];
    assert.match(r, /overflow:auto/);
    assert.match(r, /max-height:max\(\d+px, calc\(88vh - \d+px\)\)/,
      'a floor and a derivation, never a picked number');
    /* THE DERIVATION IS AGAINST THE FRAME'S OWN CEILING, which is 88vh, so
       the two cannot drift apart when one is retuned. */
    assert.match(CSS, /\.na-root\{[^}]*max-height:calc\(88vh - 2px\)/);
  });
  test('the shelf heading pins, and the foot of the rail is parted from the list', () => {
    assert.match(CSS, /\.na-picks \.na-sec-h\{ position:sticky; top:0; z-index:1; background:var\(--color-bg\); \}/);
    assert.match(CSS, /\.na-rail \.na-more\{ border-top:1px solid var\(--color-divider\)/);
  });
  test('the line of business takes its own line in the rail, at the form\'s rung', () => {
    assert.match(CSS, /\.na-rail \.na-lob\{ margin-left:0; width:100%; flex-direction:column/);
    assert.match(CSS, /\.na-rail \.na-lob select\{ width:100%; min-width:0; \}/);
    assert.match(CSS, /\.na-lob select\{ height:var\(--field-h,32px\)/, 'and is still the size of the controls beside it');
  });
});

describe('f360 (4) three columns, and the agreement on the far side', () => {
  test('the paper is drawn AFTER the questions, and is found by id', () => {
    const paper = NA.indexOf('id="na-paper"'), card = NA.indexOf('class="na-card" id="na-card"');
    assert.ok(card >= 0 && paper > card, 'the agreement sits beyond the answers, not between them and the picker');
    assert.match(NA, /paperHost:document\.getElementById\('na-paper'\)/,
      'the host form mounts by id, so the order is presentation and nothing else');
  });
  test('the stack under 760px is one column, and the cap is released there', () => {
    assert.match(CSS, /@media \(max-width:760px\)\{ \.na-body,\.na-body\.na-wide\{ grid-template-columns:1fr; \} \.na-picks\{ max-height:none; \} \}/);
  });
  test('[wall] no rule shouts, and the card rules are gone rather than stubbed', () => {
    assert.ok(!/\.na-[a-z-]*\{[^}]*!important/.test(CSS), 'never !important');
    assert.ok(!/\.na-door/.test(CSS) && !/\.na-chip/.test(CSS), 'no card or chip rule survives');
    assert.ok(!/na-door|na-chip/.test(strip(WZ)), 'and nothing draws one');
  });
});
