'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f722 — OUR PAPER'S BOOK, "PAPER FIRST" (round 21 of the redesign: the
   owner picked "Paper first" by name, 17 Oct 2026)
   (1) The book is an index of templates on their shelves (our own first) and
       the chosen template's own paper beside it (tplPfHtml).
   (2) The paper is the product's ONE renderer (fillPreviewHtml → docBody),
       never a second drawing; a sample says it is read once imported.
   (3) The doors on the paper are the template's own verbs (tplPanelActs).
   (4) The words, in both books.
   AT THE PARENT (round 20's head) every test here FAILS.
   The browser half: test/chromium/paper-first-verify.js.
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const LIB = R('js/views/library.js');
const I18N = R('js/i18n.js');
const fnBody = (src, name) => { const i = src.indexOf('function ' + name + '('); if (i < 0) return ''; return src.slice(i, src.indexOf('\n}', i) + 2); };
const BOOKS = (() => {
  const en = {}, sv = {};
  for (const m of I18N.matchAll(/^\s+([a-z][a-z0-9_]*): ["']((?:[^"'\\]|\\.)*)["'],?\s*$/gm)){
    if (!(m[1] in en)) en[m[1]] = m[2]; else if (!(m[1] in sv)) sv[m[1]] = m[2];
  }
  return { en, sv };
})();

describe('f722 (1) an index and a paper', () => {
  test('1a the book draws the index and the paper; the shelves\' table is kept, not drawn', () => {
    assert.match(fnBody(LIB, 'tplBookHtml'), /return tplPfHtml\(d\);/);
    const pf = fnBody(LIB, 'tplPfHtml');
    assert.match(pf, /class="tpl-pf-idx"/);
    assert.match(pf, /class="tpl-pf-paper"/);
    assert.match(LIB, /const TPL_PF_SHELVES = \['company', 'builtin', 'sample', 'cp'\];/, 'our own paper first');
  });
  test('1b the groups read the find box and leave an empty shelf out; the choice falls back to the first', () => {
    const ctx = { _tplPf: { pick: 'builtin:ND', q: '' }, TPL_PF_SHELVES: ['company', 'builtin', 'sample', 'cp'] };
    vm.createContext(ctx);
    vm.runInContext(['tplPfKey', 'tplPfGroups', 'tplPfChosen'].map(n => fnBody(LIB, n)).join('\n'), ctx);
    const d = { cards: [{ kind: 'builtin', id: 'RM', name: 'Raw Material Supply' }, { kind: 'builtin', id: 'ND', name: 'Mutual NDA' }, { kind: 'sample', id: 's1', name: 'Overdraft letter' }] };
    assert.deepEqual(JSON.parse(JSON.stringify(ctx.tplPfGroups(d).map(g => [g.k, g.cards.length]))), [['builtin', 2], ['sample', 1]]);
    assert.equal(ctx.tplPfChosen(d).id, 'ND');
    ctx._tplPf.q = 'nda';
    assert.deepEqual(JSON.parse(JSON.stringify(ctx.tplPfGroups(d).map(g => g.cards.map(c => c.id)))), [['ND']]);
    ctx._tplPf.pick = 'sample:gone'; ctx._tplPf.q = '';
    assert.equal(ctx.tplPfChosen(d).id, 'RM', 'a choice no longer listed falls back to the first');
  });
});

describe('f722 (2) the one renderer', () => {
  test('2a the paper is fillPreviewHtml\'s, for a built-in, theirs and ours; a sample says so', () => {
    const p = fnBody(LIB, 'tplPfPaperHtml');
    assert.match(p, /fillPreviewHtml\('builtin', \{ tid: card\.id \}\)/);
    assert.match(p, /fillPreviewHtml\('saved', \{ t \}\)/);
    assert.match(p, /card\.kind === 'sample' \? 'lib_pf_sample' : 'lib_pf_no_paper'/);
    assert.match(p, /class="tpl-pf-sheet doc-surface hati-doc"/);
  });
});

describe('f722 (3) the template\'s own doors', () => {
  test('3a the doors are tplPanelActs\' verbs, the menu left to the list', () => {
    /* RE-POINTED 19 Oct 2026 (round 21 as drawn, lane D): the head's verbs
       are "Open in the builder" · "Draft from it" beside the template's own
       (tplPfVerbs); a greyed one presses nothing */
    assert.match(fnBody(LIB, 'tplPfVerbs'), /own = \(tplPanelActs\(row\)\.acts \|\| \[\]\)\.filter\(a => !\['more', 'use', 'edit'\]\.includes\(a\.k\)\)/);
    assert.match(fnBody(LIB, 'tplPfHtml'), /const acts = tplPfVerbs\(card\);/);
    assert.match(fnBody(LIB, 'tplBookWire'), /const a=\(_tplPf\.acts\|\|\[\]\)\[Number\(b\.getAttribute\('data-tpl-pf-act'\)\)\]; if\(a&&a\.run&&!a\.off\) a\.run\(\);/);
  });
});

describe('f722 (4) the words', () => {
  test('4a in both books', () => {
    assert.equal(BOOKS.en.lib_pf_find, 'Find a template');
    for (const k of ['lib_pf_find', 'lib_pf_used_short', 'lib_pf_changed_one', 'lib_pf_changed_other', 'lib_pf_used_one', 'lib_pf_used_other', 'lib_pf_came_back_one', 'lib_pf_came_back_other', 'lib_pf_sample', 'lib_pf_no_paper'])
      for (const lang of ['en', 'sv']) assert.ok(BOOKS[lang][k], k + ' ' + lang);
  });
});
