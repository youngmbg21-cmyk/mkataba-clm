'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f731 — THE HINT LINE UNDER EVERY JAMBO ASK BOX (owner's yes, 18 Oct 2026:
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

describe('f731 (1) one builder, the drawn words', () => {
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

describe('f731 (2) every Jambo ask box draws it, from the builder', () => {
  test('2a Home\'s panel: under its box, with the keys while a paper is up', () => {
    assert.match(IG, /jamboHintHtml\(\{ places:!!\(igPaperUp\(\)\|\|\(window\.pdOnPaper&&pdOnPaper\(\)\)\) \}\)/);
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

describe('f731 (3) both books', () => {
  test('3a the words in English and Svenska', () => {
    for (const k of ['jb_hint', 'jb_hint_places', 'jb_hint_closes', 'jb_hint_lists'])
      for (const lang of ['en', 'sv']) assert.ok(BOOKS[lang][k], `${k} ${lang}`);
    assert.equal(BOOKS.sv.jb_hint, 'Att skriva skriver aldrig under, skickar eller arkiverar — det gör ett tryck.');
  });
});
