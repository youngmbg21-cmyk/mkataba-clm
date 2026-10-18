'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f709 — A CONTRACT BROUGHT UP IS A PAGE ON THE DESK, "READ DOWN" (round 7 of
   the redesign: the owner picked "Read down" by name and said yes to Details
   reading the value as amended, 17 Oct 2026)
   (1) On a computer the strip is a page of its own (hbS().card): the Board
       draws the one card and none of its furniture; the contract's desk tab is
       its tab (one per contract, remembering page or paper); turning to the
       Board lets the page go; a refresh keeps it; the phone is untouched.
   (2) The life line names the renewal it draws and marks each SIGNED
       amendment where it took effect (bsAmendMarks, one reading for the line
       and the sentence); Details reads the value as amended.
   AT THE PARENT (e9fad50) every test here FAILS.
   The browser half: test/chromium/contract-page-verify.js.
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const BS = R('js/views/boardstrip.js');
const HB = R('js/views/homeboard.js');
const CN = R('js/views/counter.js');
const CT = R('js/views/contract.js');
const I18N = R('js/i18n.js');
const fnBody = (src, name) => { const i = src.indexOf('function ' + name + '('); if (i < 0) return ''; return src.slice(i, src.indexOf('\n}', i) + 2); };
const BOOKS = (() => {
  const en = {}, sv = {};
  for (const m of I18N.matchAll(/^\s+([a-z][a-z0-9_]*): ["']((?:[^"'\\]|\\.)*)["'],?\s*$/gm)){
    if (!(m[1] in en)) en[m[1]] = m[2]; else if (!(m[1] in sv)) sv[m[1]] = m[2];
  }
  return { en, sv };
})();

describe('f709 (1) a page on the desk', () => {
  test('1a the page is the desk shell\'s, never the phone\'s, and names a strip that stands', () => {
    assert.match(fnBody(BS, 'bsCardOn'), /return !bsPhone\(\) && typeof window\.deskShellOn === 'function' && !!window\.deskShellOn\(\);/);
    assert.match(fnBody(BS, 'bsCardId'), /return \(id && bsStrip\(id\) && bsContract\(id\)\) \? id : null;/);
    assert.match(BS, /bsCardOn, bsCardId, bsCardLeave, bsAmendMarks,/, 'published (the ES-module rule)');
  });
  test('1b bring up sets it after the face turns; × and Let it go put it away', () => {
    const b = fnBody(BS, 'hbStripBring');
    assert.match(b, /if \(s\.face !== 'board' && typeof hbSetFace === 'function'\) hbSetFace\('board'\);\n\s+s\.card = bsCardOn\(\) \? st\.id : null; hbSave\(\);/);
    assert.match(fnBody(BS, 'bsStripClose'), /hbS\(\)\.card = null;/);
    assert.match(fnBody(BS, 'bsStripLetGo'), /window\.deskTabClose\('c:' \+ id\)/);
  });
  test('1c the Board draws the one card, and none of its own furniture, on the page', () => {
    assert.match(fnBody(HB, 'hbBoardHtml'), /if \(typeof window\.bsCardId === 'function' && window\.bsCardId\(\) && typeof window\.bsStripsHtml === 'function'\) return window\.bsStripsHtml\(\);/);
    assert.match(fnBody(BS, 'bsStripsHtml'), /bsStripHtml\(st, \{ desk: true \}\)/);
    assert.match(fnBody(BS, 'bsStripHtml'), /const x = desk \? '' :/, 'no × of its own on the desk');
    const head = fnBody(HB, 'hbPaintHead');
    assert.match(head, /scr\.hidden = s\.face !== 'board' \|\| card;/);
    assert.match(head, /pres\.hidden = card;/);
  });
  test('1d turning to the Board is the Board; a refresh keeps the page', () => {
    assert.match(fnBody(HB, 'hbSetFace'), /if \(f === 'board'\) s\.card = null;/);
    assert.match(fnBody(HB, 'hbS'), /if \(typeof v\.card === 'string' && s\.strips\.some\(x => x\.id === v\.card\)\) s\.card = v\.card;/);
  });
  test('1e one tab per contract, remembering page or paper; the Board tab leaves the page', () => {
    assert.match(fnBody(CN, 'deskKeyNow'), /if \(f === 'board' && typeof window\.bsCardId === 'function'\)\{ const id = window\.bsCardId\(\); if \(id\) return 'c:' \+ id; \}/);
    assert.match(fnBody(CN, 'deskTabsSync'), /if \(k\.startsWith\('c:'\)\) t\.view = /);
    const open = fnBody(CN, 'deskTabOpen');
    assert.match(open, /if \(t && t\.view === 'card' && typeof hbStripBring === 'function' && hbStripBring\(c\.id\)\) return true;/);
    assert.match(open, /const left = \(typeof window\.bsCardLeave === 'function'\) && window\.bsCardLeave\(\);/);
    /* RE-POINTED 18 Oct 2026 (the SAP way): the tab is a Recent row; × may also take the page in front off */
    assert.match(fnBody(CN, 'deskTabClose'), /if \(i >= 0 && L\[i\]\.view === 'card' && typeof bsStripClose === 'function'\) bsStripClose\(k\.slice\(2\)\);/);
  });
});

describe('f709 (2) the line and the value', () => {
  test('2a the renewal the line draws is named in the legend', () => {
    assert.match(fnBody(BS, 'bsLifeSecInner'), /\(M\.end && M\.auto && !L\.nda\) \? `<span><i class="bs-sw bs-sw-renew"><\/i>\$\{bsE\(bsT\('bs_lg_renews'\)\)\}<\/span>` : ''/);
  });
  test('2b each SIGNED amendment of the original, one reading for the line and the sentence', () => {
    const r = fnBody(BS, 'bsAmendMarks');
    assert.match(r, /if \(!rows\.length \|\| String\(rows\[0\]\.c\.id\) !== String\(c\.id\)\) return \[\];/, 'only on the original\'s card');
    assert.match(r, /amendmentExecuted\(r\.c\)/, 'signed only');
    assert.match(r, /amendmentDate\(r\.c\)/, 'where it took effect');
    assert.match(r, /effectiveTerm\(c, 'value'\)/, 'what it set: the reading the Value figure uses');
    assert.match(fnBody(BS, 'bsChartSvg'), /const amd = bsAmendMarks\(D\.c\);/);
    assert.match(fnBody(BS, 'bsCaption'), /const am = bsAmendMarks\(D\.c\);/);
  });
  test('2c Details reads the value as amended, the signed figure beside it', () => {
    const v = fnBody(CT, 'ktFieldCell');
    assert.match(v, /effectiveTerm\(c,'value'\):null; if\(e&&e\.from&&Number\(e\.v\)>0&&Number\(e\.v\)!==Number\(c\.value\)\) am=e;/);
    assert.match(v, /fmtMoneyOf\(effectiveValueView\(c\)\)\)\} <span class="ov-amd">\$\{esc\(i18t\('ov_value_amended',\{ v:R\.money \}\)\)\}<\/span>/);
  });
  test('2d the new words, in both books', () => {
    for (const k of ['bs_lg_renews', 'bs_t_amend', 'bs_t_amend_value', 'bs_cap_amend', 'bs_cap_amend_value', 'bs_cap_amend_more_one', 'bs_cap_amend_more_other', 'ov_value_amended'])
      for (const lang of ['en', 'sv']) assert.ok(BOOKS[lang][k], k + ' ' + lang);
  });
});
