/* f1212 — THE ANSWER UNDER THE BUTTONS, AND A PRESS NEVER LOST (owner, 24 Nov 2026: "this plain english translation should
   come right above 'what we found'. Also the plain english, deep dive and redline buttons are not responding quickly").
   Measured on DV-20 at 1440×780: the clause's own words (Plain English and Jambo's thinking, .doc-th-body) were drawn
   AFTER What was found and the foot, usually below the panel's fold, so a press seemed to do nothing; and one press redrew
   the page's buttons six times, so a quick second press could land on a button being swapped. Now the page is drawn in two
   parts around the clause's words (docThreadPageHtml part 'top' | 'foot'), and its parts are drawn again only when what
   they say has changed (data-th-pgsig). After: buttons → words → What was found → foot; 0 redraws after a press. */
'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs'), path = require('path');
const CT = fs.readFileSync(path.join(__dirname, '..', 'js/views/contract.js'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const H = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const fn = name => { const i = CT.indexOf('function ' + name + '('); assert.ok(i >= 0, name + ' exists'); const j = CT.indexOf('\nfunction ', i + 9); return CT.slice(i, j < 0 ? undefined : j); };

test('f1212 (1) the page in two parts around the clause\'s own words', () => {
  /* RETIRED 24 Nov 2026 (f1217; owner: "delete the one at a time feature and only leave the list version"): the one-clause
     page is deleted, its parts with it; the list alone stands */
  const S = require('node:fs').readFileSync(require('node:path').join(__dirname, '..', 'js/views/contract.js'), 'utf8');
  assert.ok(!S.includes('function docThreadPageHtml('), 'the clause page is gone');
  assert.ok(S.includes('const _thPage = false;'), 'the list alone');

});
test('f1212 (2) the page\'s parts are drawn again only when what they say changed', () => {
  /* RETIRED 24 Nov 2026 (f1217; owner: "delete the one at a time feature and only leave the list version"): the one-clause
     page is deleted, its parts with it; the list alone stands */
  const S = require('node:fs').readFileSync(require('node:path').join(__dirname, '..', 'js/views/contract.js'), 'utf8');
  assert.ok(!S.includes('function docThreadPageHtml('), 'the clause page is gone');
  assert.ok(S.includes('const _thPage = false;'), 'the list alone');

});
