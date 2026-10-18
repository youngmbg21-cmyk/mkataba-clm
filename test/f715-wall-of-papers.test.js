'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f715 — THE CONTRACTS PLACE, "WALL OF PAPERS" (round 13 of the redesign: the
   owner picked "Wall of papers" by name and said yes to the archive leaving
   the Quick filters box for a button of its own, 17 Oct 2026)
   (1) The archive is its own button beside Wall | List, counted by the
       press's own reading; one press the shelf, a second the live book; the
       box on the place no longer offers it (the full table's box still does).
   (2) The paper carries nothing stamped on it; under it the stage, the number
       with its value (one reading, igWallValue), the party, the asks and a
       private stream's lock; a deal kept to its list shows its stream and
       "Kept to its list".
   AT THE PARENT (cb7b090) every test here FAILS.
   The browser half: test/chromium/wall-of-papers-verify.js.
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const REG = R('js/views/register.js');
const IG = R('js/views/intelligence.js');
const COMP = R('js/components.js');
const I18N = R('js/i18n.js');
const fnBody = (src, name) => { const i = src.indexOf('function ' + name + '('); if (i < 0) return ''; return src.slice(i, src.indexOf('\n}', i) + 2); };
const BOOKS = (() => {
  const en = {}, sv = {};
  for (const m of I18N.matchAll(/^\s+([a-z][a-z0-9_]*): ["']((?:[^"'\\]|\\.)*)["'],?\s*$/gm)){
    if (!(m[1] in en)) en[m[1]] = m[2]; else if (!(m[1] in sv)) sv[m[1]] = m[2];
  }
  return { en, sv };
})();

describe('f715 (1) the archive\'s own button', () => {
  test('1a beside Wall | List, counted by the press\'s own reading, saying whether it is pressed', () => {
    const b = fnBody(REG, 'regArchiveBtnHtml');
    assert.match(b, /n=regViewCount\('archived'\)/);
    assert.match(b, /data-ct-archive aria-pressed="\$\{on\?'true':'false'\}"/);
    assert.match(b, /i18t\('ct_archive'\)/);
    const head = fnBody(REG, 'regHomeHeadHtml');
    assert.ok(head.indexOf('${regArchiveBtnHtml(R)}') > 0 && head.indexOf('${regArchiveBtnHtml(R)}') < head.indexOf('class="reg-seg ct-seg"'), 'before Wall | List');
  });
  test('1b one press the shelf, a second the live book', () => {
    assert.match(REG, /\[data-reg-home\] \[data-ct-archive\]'\)\.forEach\(b=>b\.addEventListener\('click',\(\)=>\{\n\s+R\.view=R\.view==='archived'\?null:'archived'; R\.page=1; regRepaint\(\); \}\)\);/);
  });
  test('1c the box on the place no longer offers it; the full table\'s still does', () => {
    assert.match(fnBody(REG, 'regViewOptsHtml'), /REG_VIEWS\.filter\(v=>!\(o\.home&&v\.k==='archived'\)\)/);
    assert.match(REG, /selFilter\('reg-view-sel',regViewOptsHtml\(R,\{ home:HOME \}\),\(!!R\.view&&!\(HOME&&R\.view==='archived'\)\)/);
  });
});

describe('f715 (2) the paper and its facts', () => {
  test('2a nothing is stamped on the paper any more (the stage stamp sat over the title)', () => {
    const sh = fnBody(IG, 'igWallSheetHtml');
    assert.ok(sh && !/igw-stamp|igw-red|igw-sigs/.test(sh), 'no stamp, no marks over the title');
    assert.match(sh, /if\(c&&c\._codeNamed\) return `<span class="igw-sheet is-coded"/);
  });
  test('2b the value under the number: one reading', () => {
    const ctx = { FOLDERS: { s1: { name: 'Sales' } }, canViewValues: () => true, isMonetary: c => c.valueType !== 'none', fmtMoneyShortOf: c => (c.pay ? '—' : 'SEK ' + c.value) };
    vm.createContext(ctx); vm.runInContext(fnBody(IG, 'igWallValue'), ctx);
    assert.equal(ctx.igWallValue({ _codeNamed: true, folder: 's1' }), 'Sales', 'a deal kept to its list: its stream');
    assert.equal(ctx.igWallValue({ value: 4200000 }), 'SEK 4200000');
    assert.equal(ctx.igWallValue({ value: 0 }), '—', 'no figure: a dash');
    assert.equal(ctx.igWallValue({ value: 9, valueType: 'none' }), '—', 'no money passes: a dash');
    assert.equal(ctx.igWallValue({ value: 9, pay: true }), '—', 'pay is not deal value');
    ctx.canViewValues = () => false;
    assert.equal(ctx.igWallValue({ value: 4200000 }), '', 'not the reader\'s to see: nothing');
  });
  test('2c under the paper: the stage, the number and value, the party (or "Kept to its list"), the asks and a private stream\'s lock', () => {
    const card = fnBody(IG, 'igWallCardHtml');
    assert.match(card, /<span class="igw-rl"><span class="igw-ref">/);
    assert.match(card, /c\._codeNamed\?i18t\('igw_kept_list'\):\(c\.counterparty\|\|''\)/);
    assert.match(card, /const priv=!c\._codeNamed&&typeof streamIsPrivate==='function'&&streamIsPrivate\(c\.folder\);/);
    assert.match(card, /<span class="igw-lock"/);
  });
  test('2d drawn icons and the new words, in both books', () => {
    assert.match(COMP, /\n {2}archive:'<rect/);
    assert.match(COMP, /\n {2}tag:'<path/);
    for (const k of ['ct_archive', 'ct_arch_title', 'ct_arch_back', 'igw_code_name', 'igw_kept_list', 'igw_private_title'])
      for (const lang of ['en', 'sv']) assert.ok(BOOKS[lang][k], k + ' ' + lang);
  });
});
