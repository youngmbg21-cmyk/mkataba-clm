'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f805 — THE HINT LINE UNDER EVERY JAMBO ASK BOX (owner's yes, 18 Oct 2026:
   every picked drawing of rounds 3–26 draws it — "Typing never signs, sends
   or files — a press does.")

   (1) ONE BUILDER (components.js, jamboHintHtml): the sentence as drawn; on
       Home with a paper up the keys the box answers ("/ places · Esc closes",
       rounds 6–9 and 12); round 3's "/ lists the places." kept as a choice.
   (2) EVERY BOX DRAWS IT: Home's panel, Settings' Jambo side, Import's panel
       (which gains the shared box itself) and Jambo's panel beside the lists.
       The sentence is written nowhere else — a box that wants it asks the one
       builder.
   (3) The words in both books.

   AT THE PARENT (8dc306a) every claim FAILS: there is no builder, no jb_*
   key, and no box draws the line.
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
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
/* the builder, run on its own with the English book */
const builder = (() => {
  const m = /const jamboHintHtml = \(o = \{\}\) => \{[\s\S]*?\n\};/.exec(COMP);
  if (!m) return null;
  const ctx = { i18t: k => BOOKS.en[k] || k, esc: s => String(s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch])) };
  vm.createContext(ctx); vm.runInContext(m[0].replace('const jamboHintHtml', 'var jamboHintHtml'), ctx);
  return ctx.jamboHintHtml;
})();
const text = html => String(html).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

describe('f805 (1) one builder, the drawn words', () => {
  test('1a the sentence as drawn', () => {
    assert.ok(builder, 'jamboHintHtml is there');
    assert.equal(text(builder()), 'Typing never signs, sends or files — a press does.');
    assert.match(builder(), /^<p class="jb-hint" data-jb-hint>/);
  });
  test('1b with the keys Home\'s box answers: "/ places · Esc closes"; round 3\'s "/ lists the places."', () => {
    assert.equal(text(builder({ places: true })), 'Typing never signs, sends or files — a press does. / places · Esc closes');
    assert.equal((builder({ places: true }).match(/<kbd class="jb-kbd">/g) || []).length, 2, 'the keys are drawn as keys');
    assert.equal(text(builder({ places: 'lists' })), 'Typing never signs, sends or files — a press does. / lists the places.');
  });
  test('1c published, for every module to ask', () => {
    assert.match(COMP, /Object\.assign\(window,\{[^}]*\bjamboHintHtml\b/);
  });
});

describe('f805 (2) every Jambo ask box draws it, from the builder', () => {
  test('2a Home\'s panel: under its box, with the keys while a paper is up', () => {
    /* RE-POINTED 18 Oct 2026 (pass 3, the checker against rounds 3, 7 and
       12): which keys the line names is ONE reading, igHintKeys — see (4) */
    assert.match(IG, /jamboHintHtml\(\{ places:igHintKeys\(\) \}\)/);
    assert.match(IG, /<div class="igd-askbox relative">[\s\S]{0,700}<button id="igd-go" class="ui-btn ui-btn-sm ui-btn-primary absolute" style="right:6px;bottom:8px">/, 'the box and Ask in their own frame, so the line never moves the button');
  });
  test('2b Settings\' Jambo side: under its form', () => {
    assert.match(fnOf(SET, 'stJamboHtml'), /<\/form>\s*\$\{typeof jamboHintHtml==='function'\?jamboHintHtml\(\):''\}/);
  });
  test('2c Jambo\'s panel beside a list, and Import\'s panel, which gains the shared box', () => {
    assert.match(fnOf(INS, 'jlAskHtml'), /typeof jamboHintHtml === 'function' \? jamboHintHtml\(\) : ''/);
    assert.match(fnOf(MIG, 'migSidePaint'), /jlAskHtml\(\{ placeholder: i18t\('jl_ph_any'\) \}\)/);
    assert.match(fnOf(MIG, 'migSidePaint'), /<div id="jl-feed" class="jl-feed" aria-live="polite"><\/div>/, 'and his conversation is said in it');
  });
  test('2d the sentence is written nowhere else in the code — every box asks the builder', () => {
    const walk = (rel, out = []) => { for (const e of fs.readdirSync(path.join(ROOT, rel), { withFileTypes: true })){
      const r = rel + '/' + e.name; if (e.isDirectory()) walk(r, out); else if (r.endsWith('.js') && r !== 'js/i18n.js') out.push(r); } return out; };
    const code = src => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1');
    assert.ok(builder, 'the one builder is there');
    const hits = walk('js').filter(f => /Typing never signs|Att skriva skriver aldrig/.test(code(read(f))));
    assert.deepEqual(hits, []);
  });
});

describe('f805 (3) both books', () => {
  test('3a the words in English and Svenska', () => {
    for (const k of ['jb_hint', 'jb_hint_places', 'jb_hint_closes', 'jb_hint_lists'])
      for (const lang of ['en', 'sv']) assert.ok(BOOKS[lang][k], `${k} ${lang}`);
    assert.equal(BOOKS.sv.jb_hint, 'Att skriva skriver aldrig under, skickar eller arkiverar — det gör ett tryck.');
  });
});

/* ═══ PASS 3 (18 Oct 2026): the owner's answer (2), "Every Jambo box", and the
   checker against rounds 3, 7 and 12 ══════════════════════════════════════
   (4) THE LAST THREE BOXES: the Counter's ("What do you need, Amina?"), the
       floating Jambo window's (#ai-input) and the clause editor's ask — each
       from the one builder; the window's line is painted on every open (the
       reader's language of the moment) and never on the phone, whose
       full-screen Jambo is the same element.
   (5) WHICH KEYS HOME'S LINE NAMES, ONE READING (igHintKeys): "/ places · Esc
       closes" with a contract in front — a paper (rounds 6, 8, 9) or a
       contract brought up as a page, its History too (rounds 7, 12); "/ lists
       the places." on Jambo's tab beside a paper while Needs you here has
       rows (round 3); the sentence alone on Before you sign (round 10), the
       wall and the Board (rounds 13, 17).
   AT THE PARENT (8dc306a) and before this pass (14b2f8a) these FAIL. */
describe('f805 (4) the last three boxes: the Counter, the Jambo window, the clause editor', () => {
  test('4a the Counter\'s box: the line right under it, from the builder', () => {
    assert.match(fnOf(CN, 'counterHtml'), /<div class="ca-pop cn-pop" id="cn-pop" hidden><\/div><\/div>\s*\$\{''\/\*[\s\S]*?\*\/\}\$\{typeof jamboHintHtml === 'function' \? jamboHintHtml\(\) : ''\}\s*<div class="cn-chips">/);
    assert.match(HTML, /\.cn-ask > \.jb-hint\{margin:-6px 2px 0;text-align:left\}/);
  });
  test('4b the floating window: a host under its box, painted from the builder on every open; off on the phone', () => {
    assert.match(HTML, /data-ic-big="send"><\/button>\s*<\/div>\s*<!--[\s\S]*?-->\s*<div id="ai-hint" class="ai-hint"><\/div>\s*<\/footer>/);
    assert.match(fnOf(AI, 'aiHintPaint'), /el\.innerHTML=window\.jamboHintHtml\(\);/);
    assert.match(fnOf(AI, 'openAI'), /renderAIFeed\(\); renderAISuggest\(\);\s*aiHintPaint\(\);/);
    assert.match(HTML, /@media \(max-width:767px\)\{ \.ai-hint\{display:none;\} \}/, 'the phone stays untouched');
  });
  test('4c the clause editor\'s ask: under its row, from the builder, and only where Jambo asks (not their seat)', () => {
    assert.match(CE, /title="\$\{_ceea\(_cet\('ce_send'\)\)\}">\$\{CE_SEND_ICON\}<\/button>\s*<\/div>\s*\$\{''\/\*[\s\S]*?\*\/\}\$\{typeof jamboHintHtml === 'function' \? jamboHintHtml\(\) : ''\}`\}/);
    assert.match(CE, /\.ce-ask \+ \.jb-hint\{flex:none; margin:-4px 14px 8px\}/);
  });
});

describe('f805 (5) which keys Home\'s line names — one reading', () => {
  const run = env => {
    const ctx = Object.assign({ state: { view: 'dashboard' }, intel: { paper: null }, getContract: () => null }, env || {});
    ctx.window = ctx; vm.createContext(ctx);
    vm.runInContext(fnOf(IG, 'igPaperUp') + '\n' + fnOf(IG, 'igMapUp') + '\n' + fnOf(IG, 'igHintKeys'), ctx);
    return ctx.igHintKeys();
  };
  const paper = { intel: { paper: { mode: 'paper', id: 'C1' } }, getContract: () => ({ id: 'C1' }), pdContract: () => ({ id: 'C1' }), pdOnPaper: () => true, hbFace: () => 'paper' };
  test('5a a paper up: the keys (rounds 6, 8, 9)', () => {
    assert.equal(run(Object.assign({}, paper, { pdNeedsRows: () => [] })), true);
    assert.equal(run(Object.assign({}, paper, { pdNeedsRows: () => [{ k: 'x' }], pdFillShows: () => true })), true, 'Fill in keeps them');
    assert.equal(run(Object.assign({}, paper, { pdNeedsRows: () => [{ k: 'x' }], pdRedShows: () => true })), true, 'Redlines keeps them');
  });
  test('5b Jambo\'s tab beside a paper with Needs you here: "/ lists the places." (round 3)', () => {
    assert.equal(run(Object.assign({}, paper, { pdNeedsRows: () => [{ k: 'x' }] })), 'lists');
  });
  test('5c a contract brought up as a page — its History too: the keys (rounds 7, 12)', () => {
    assert.equal(run({ bsCardId: () => 'C1', hbFace: () => 'board' }), true);
    assert.equal(run({ bsCardId: () => 'C1', hbFace: () => 'calendar' }), false, 'the card is the Board\'s: not in front on another face');
  });
  test('5c2 a paper left open behind the Board is not in front; one on Explorer\'s map is', () => {
    assert.equal(run({ intel: { paper: { mode: 'paper', id: 'C1' } }, getContract: () => ({ id: 'C1' }), pdOnPaper: () => false, hbFace: () => 'board', bsCardId: () => null }), false);
    assert.equal(run({ intel: { paper: { mode: 'paper', id: 'C1' } }, getContract: () => ({ id: 'C1' }), pdOnPaper: () => false, hbFace: () => 'explorer',
      document: { getElementById: id => id === 'ig-svg' ? {} : null } }), true);
  });
  test('5d the sentence alone: Before you sign, the wall, the Board, another page', () => {
    assert.equal(run(Object.assign({}, paper, { pdSignShows: () => true })), false, 'round 10');
    assert.equal(run({ bsCardId: () => null, hbFace: () => 'board' }), false, 'the Board, the wall');
    assert.equal(run({ state: { view: 'negotiations' }, bsCardId: () => 'C1' }), false);
  });
  test('5e a reading that writes nothing', () => {
    assert.match(fnOf(IG, 'igHintKeys'), /^function igHintKeys\(\)\{/, 'the reading is there');
    assert.doesNotMatch(fnOf(IG, 'igHintKeys'), /pdSetTab|hbSave|\.push\(|(intel|state)\.[a-z.]+\s*=[^=]/);
  });
});

describe('f805 (6) the line follows what is in front, in place', () => {
  test('6a one painter, the one builder, called where the Board paints and where Needs you here repaints', () => {
    const f = fnOf(IG, 'igHintPaint');
    assert.match(f, /document\.querySelector\('#ig-dock \.igd-askbox \+ \.jb-hint'\)/);
    assert.match(f, /jamboHintHtml\(\{ places:igHintKeys\(\) \}\)/);
    assert.match(fnOf(read('js/views/homeboard.js'), 'hbPaintBoard'), /if \(typeof window\.igHintPaint === 'function'\) try \{ igHintPaint\(\); \} catch \(_\)\{\}\n\}$/);
    assert.equal((fnOf(read('js/paperdesk.js'), 'pdNeedsRepaint').match(/igHintPaint\(\)/g) || []).length, 2, 'filling and emptying');
  });
});

/* ═══ PASS 4 (18 Oct 2026, evening): the owner's answer (2), "Every Jambo
   box", and the checker's second pass ══════════════════════════════════════
   (7) THE CALENDAR'S JAMBO BOX (round 16 draws the line last under it) and
       THE TEMPLATE BUILDER'S (round 21) — from the one builder, so no Jambo
       ask box in HaTi is left without it.
   AT THE PARENT (8dc306a) both FAIL. */
describe('f805 (7) the Calendar\'s box and the template builder\'s', () => {
  const CAL = read('js/views/calendar.js'), TB = read('js/views/templatebuilder.js');
  test('7a the Calendar: the line last in its Jambo card, under the box and its cost', () => {
    assert.match(fnOf(CAL, 'calPlanHtml'), /<p class="cal-plan-cost">[^\n]*<\/p>\s*\$\{[\s\S]{0,200}typeof window\.jamboHintHtml==='function'\?jamboHintHtml\(\):''\}\s*<\/aside>/);
    assert.match(CAL, /\.cal-cop \.cal-plan-cost \+ \.jb-hint\{margin:-8px 14px 12px\}/);
  });
  test('7b the builder: under its ask row, from the builder', () => {
    assert.match(fnOf(TB, 'tbAskHtml'), /<div class="tb-pick" id="tb-pick" hidden><\/div><\/div>\$\{[\s\S]{0,300}typeof jamboHintHtml === 'function' \? jamboHintHtml\(\) : ''\}`;/);
    assert.match(TB, /\.tb-ask \+ \.jb-hint\{flex:none;margin:-4px 14px 8px\}/);
  });
  test('7c every Jambo ask box in the code asks the builder: Home, Settings, the list panel (and Import), the Counter, the window, the clause editor, the Calendar, the builder', () => {
    const askers = ['js/views/intelligence.js', 'js/views/settings.js', 'js/views/inspector.js', 'js/views/counter.js', 'js/ai.js', 'js/views/clauseeditor.js', 'js/views/calendar.js', 'js/views/templatebuilder.js'];
    for (const f of askers) assert.match(read(f), /jamboHintHtml\(/, f);
  });
});
