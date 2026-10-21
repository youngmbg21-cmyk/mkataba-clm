'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f805 — THE HINT LINE UNDER EVERY JAMBO ASK BOX (owner's yes, 18 Oct 2026:
   every picked drawing of rounds 3–26 drew it — "Typing never signs, sends
   or files — a press does.")

   RE-POINTED 20 Oct 2026 — CHAMBERS (the owner picked the "Chambers" design
   by name): NO HINT LINE UNDER ANY JAMBO BOX. The line, its builder
   (jamboHintHtml), its keys (.jb-keys/.jb-kbd), Home's one reading of which
   keys to name (igHintKeys) and its painter (igHintPaint), the window's host
   (#ai-hint, aiHintPaint) and Home's Needs-you note (.cn-hint) are gone from
   every box that drew them. This file now pins that they are ABSENT, box by
   box, that each box ITSELF still stands (so the absence is not a box that
   left with its line), and that the words stay INERT in both books.

   (1) THE BUILDER IS GONE: no jamboHintHtml, none published, no keys drawn.
   (2) EVERY BOX DRAWS NONE: Home's panel, Settings' Jambo side, Jambo's panel
       beside the lists and Import's (which keeps the shared box itself). The
       sentence is written nowhere in the code.
   (3) The words stay in both books, inert: nothing asks for them.
   AT THE PARENT (d2b75c7) every absence claim here FAILS: the line is drawn.
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.join(__dirname, '..');
const read = rel => { try { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); } catch (_) { return ''; } };
const COMP = read('js/components.js');
const INS = read('js/views/inspector.js');
const IG = read('js/views/intelligence.js');
const SET = read('js/views/settings.js');
const MIG = read('js/views/migration.js');
const CN = read('js/views/counter.js');
const CE = read('js/views/clauseeditor.js');
const AI = read('js/ai.js');
const HTML = read('index.html');
const I18N = read('js/i18n.js');
const fnOf = (src, name) => { const i = src.indexOf('function ' + name + '('); if (i < 0) return ''; return src.slice(i, src.indexOf('\n}', i) + 2); };
const BOOKS = (() => {
  const en = {}, sv = {};
  for (const m of I18N.matchAll(/^\s+([a-z][a-z0-9_]*): ["']((?:[^"'\\]|\\.)*)["'],?\s*$/gm)){
    if (!(m[1] in en)) en[m[1]] = m[2]; else if (!(m[1] in sv)) sv[m[1]] = m[2];
  }
  return { en, sv };
})();
/* code without its comments (a comment may tell the story of the line) */
const code = src => String(src).replace(/<!--[\s\S]*?-->/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1');
const walk = (rel, out = []) => { for (const e of fs.readdirSync(path.join(ROOT, rel), { withFileTypes: true })){
  const r = rel + '/' + e.name; if (e.isDirectory()) walk(r, out); else if (r.endsWith('.js') && r !== 'js/i18n.js') out.push(r); } return out; };
const JS = walk('js');
const HINT_NAMES = /\b(?:jamboHintHtml|igHintKeys|igHintPaint|aiHintPaint)\b/;
const HINT_CLASSES = /\.?\b(?:jb-hint|jb-keys|jb-kbd|ai-hint|cn-hint)\b/;

describe('f805 (1) the builder is gone, and its keys with it', () => {
  test('1a no jamboHintHtml in components.js, and none published', () => {
    assert.doesNotMatch(code(COMP), /jamboHintHtml/);
    assert.doesNotMatch(COMP, /Object\.assign\(window,\{[^}]*\bjamboHintHtml\b/);
  });
  test('1b no hint line, no keys drawn as keys: no .jb-hint, .jb-keys or .jb-kbd anywhere in the sheet or the code', () => {
    assert.doesNotMatch(code(HTML), /\.jb-hint|\.jb-keys|\.jb-kbd|class="jb-hint"|class="jb-kbd"/, 'index.html');
    const hits = JS.filter(f => /jb-hint|jb-keys|jb-kbd/.test(code(read(f))));
    assert.deepEqual(hits, [], 'no module draws or dresses it');
  });
  test('1c nothing anywhere asks for it: no module names the builder, the keys reading or a painter', () => {
    const hits = JS.filter(f => HINT_NAMES.test(code(read(f))));
    assert.deepEqual(hits, []);
    assert.doesNotMatch(code(HTML), HINT_NAMES, 'nor the page');
  });
});

describe('f805 (2) every Jambo ask box draws none — and the box itself stands', () => {
  test('2a Home\'s panel: its box and Ask stand, with no line under them', () => {
    /* the box and Ask in their own frame, drawn by the one builder (jamboCardHtml) */
    assert.match(IG, /_igJbCard\(\{ cls: 'igd-askbox'[\s\S]{0,400}send: _igJbSend\('id="igd-go"'/, 'the box stands');
    assert.doesNotMatch(code(IG), HINT_CLASSES, 'no hint line beside it');
    assert.doesNotMatch(code(IG), HINT_NAMES);
  });
  test('2b Settings\' Jambo side: its form ends the side, no line under it', () => {
    const f = fnOf(SET, 'stJamboHtml');
    assert.match(f, /<form class="st-jb-ask" id="st-jb-form"/, 'the form stands');
    assert.match(f, /<\/form>\s*<\/div>`;/, 'nothing drawn after the form');
    assert.doesNotMatch(code(f), HINT_NAMES);
  });
  test('2c Jambo\'s panel beside a list, and Import\'s panel, which keeps the shared box — no line under it', () => {
    const f = fnOf(INS, 'jlAskHtml');
    assert.match(f, /id="jl-q"/, 'the box stands');
    assert.match(f, /<\/form>\s*<\/div>`;/, 'nothing drawn after the form');
    assert.doesNotMatch(code(f), HINT_NAMES);
    /* Import's panel wears the shared frame itself (jlFrame builds the box
       with jlAskHtml once), and his conversation is said under the chosen file */
    assert.match(fnOf(MIG, 'migSidePaint'), /jlFrame\(host, \{ jlPh:i18t\('jl_ph_any'\) \}\)/);
    assert.match(fnOf(INS, 'jlFrame'), /jlAskHtml\(\{ placeholder: opt\.jlPh \}\)/);
    assert.match(fnOf(INS, 'jlTalkHtml'), /<div id="jl-feed" class="jl-feed" aria-live="polite"><\/div>/, 'and his conversation is said in it');
    assert.doesNotMatch(fnOf(MIG, 'migSidePaint'), /id="jl-feed"/, 'not drawn twice');
  });
  test('2d the sentence is written nowhere in the code', () => {
    const hits = JS.filter(f => /Typing never signs|Att skriva skriver aldrig/.test(code(read(f))));
    assert.deepEqual(hits, []);
    assert.doesNotMatch(code(HTML), /Typing never signs|Att skriva skriver aldrig/);
  });
});

describe('f805 (3) both books keep the words, inert', () => {
  test('3a the words stay in English and Svenska (a retired key is left inert in BOTH books)', () => {
    for (const k of ['jb_hint', 'jb_hint_places', 'jb_hint_closes', 'jb_hint_lists'])
      for (const lang of ['en', 'sv']) assert.ok(BOOKS[lang][k], `${k} ${lang}`);
    assert.equal(BOOKS.sv.jb_hint, 'Att skriva skriver aldrig under, skickar eller arkiverar — det gör ett tryck.');
  });
  test('3b nothing asks for them', () => {
    const hits = JS.filter(f => /\bjb_hint/.test(code(read(f))));
    assert.deepEqual(hits, []);
    assert.doesNotMatch(code(HTML), /\bjb_hint/);
  });
});

/* ═══ PASS 3 (18 Oct 2026) drew the line under the last three boxes — the
   Counter's, the floating Jambo window's (#ai-input) and the clause editor's
   ask — and gave Home ONE reading of which keys it named (igHintKeys).
   RE-POINTED 20 Oct 2026 (Chambers): all three draw none, and the reading
   and its painter are gone with the line. */
describe('f805 (4) the last three boxes: the Counter, the Jambo window, the clause editor — none', () => {
  test('4a the Counter\'s box: the chips straight under it, no line, no Needs-you note', () => {
    assert.match(fnOf(CN, 'counterHtml'), /<div class="ca-pop cn-pop" id="cn-pop" hidden><\/div><\/div>\s*<div class="cn-chips"[ >]/, 'box, then the chips');
    assert.doesNotMatch(code(CN), HINT_CLASSES);
    assert.doesNotMatch(code(CN), HINT_NAMES);
    assert.doesNotMatch(code(HTML), /\.cn-ask > \.jb-hint|\.cn-hint/, 'no rule dresses either');
  });
  test('4b the floating window: no host under its box, nothing painted on open', () => {
    assert.match(HTML, /id="ai-send"[^>]*class="jb-send">[\s\S]*?<\/button><\/div>\s*<\/div>\s*<\/footer>/, 'the card closes the foot');
    assert.doesNotMatch(code(HTML), /id="ai-hint"|\.ai-hint\b|#ai-hint/);
    assert.doesNotMatch(code(fnOf(AI, 'openAI')), /aiHintPaint/);
    assert.doesNotMatch(code(AI), HINT_NAMES);
  });
  test('4c the clause editor\'s ask: its row stands, no line under it', () => {
    assert.match(CE, /send: _ceJbSend\('data-ce-act="ask"', _cet\('ce_send'\)\) \}\)\}<\/div>\s*`\}/, 'the ask row ends its block');
    assert.doesNotMatch(code(CE), /\.ce-askwrap \+ \.jb-hint/);
    assert.doesNotMatch(code(CE), HINT_NAMES);
  });
});

describe('f805 (5) which keys Home\'s line names — the reading is gone with the line', () => {
  test('5a no igHintKeys in Home\'s panel, and nobody asks it', () => {
    assert.equal(fnOf(IG, 'igHintKeys'), '', 'the reading is gone');
    const hits = JS.filter(f => /\bigHintKeys\b/.test(code(read(f))));
    assert.deepEqual(hits, []);
  });
});

describe('f805 (6) no painter follows what is in front', () => {
  test('6a no igHintPaint, and neither the Board\'s paint nor Still owed\'s repaint calls one', () => {
    assert.equal(fnOf(IG, 'igHintPaint'), '', 'the painter is gone');
    const board = fnOf(read('js/views/homeboard.js'), 'hbPaintBoard');
    const owed = fnOf(read('js/paperdesk.js'), 'pdNeedsRepaint');
    assert.ok(board && owed, 'both painters are still there to look in');
    assert.doesNotMatch(code(board), /igHintPaint/);
    assert.doesNotMatch(code(owed), /igHintPaint/);
  });
});

/* ═══ PASS 4 (18 Oct 2026, evening) drew it under the Calendar's Jambo box
   (round 16) and the template builder's (round 21). RE-POINTED 20 Oct 2026
   (Chambers): neither draws it now; each box stands last in its card. */
describe('f805 (7) the Calendar\'s box and the template builder\'s — none', () => {
  const CAL = read('js/views/calendar.js'), TB = read('js/views/templatebuilder.js');
  test('7a the Calendar: its box last in its Jambo card, with its cost, and no line under it', () => {
    assert.match(fnOf(CAL, 'calPlanHtml'), /_calJbCard\(\{ cls: 'cal-plan-box'[^\n]*title="\$\{_esc\(cost\)\}"[^\n]*\}\)\}\s*<\/div>\s*<\/aside>/);
    assert.match(fnOf(CAL, 'calPlanHtml'), /const cost=i18t\('jl_ask_cost'\);/);
    assert.doesNotMatch(code(CAL), HINT_NAMES);
    assert.doesNotMatch(code(CAL), HINT_CLASSES);
  });
  test('7b the builder: its ask row ends the foot, no line under it', () => {
    assert.match(fnOf(TB, 'tbAskHtml'), /tail: `<div class="tb-pick" id="tb-pick" hidden><\/div>` \}\)\}<\/div>`;/);
    assert.doesNotMatch(code(TB), /\.tb-foot \.jb-card \+ \.jb-hint/);
    assert.doesNotMatch(code(TB), HINT_NAMES);
  });
  test('7c no Jambo ask box in the code asks for a line: Home, Settings, the list panel (and Import), the Counter, the window, the clause editor, the Calendar, the builder', () => {
    const askers = ['js/views/intelligence.js', 'js/views/settings.js', 'js/views/inspector.js', 'js/views/counter.js', 'js/ai.js', 'js/views/clauseeditor.js', 'js/views/calendar.js', 'js/views/templatebuilder.js'];
    for (const f of askers){
      const src = read(f);
      assert.ok(src, f + ' is there');
      assert.doesNotMatch(code(src), /jamboHintHtml\(/, f);
    }
    /* and every one of them still draws its box through the one card builder */
    for (const f of askers.filter(f => f !== 'js/ai.js')) assert.match(read(f), /_[a-z]+JbCard\(/, f + ' draws the two-row card');
    assert.match(HTML, /<div class="jb-card">\s*<textarea id="ai-input"/, 'the window\'s card is in the page');
  });
});
