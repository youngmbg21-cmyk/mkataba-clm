'use strict';
/* f1197 — REDLINES, STEP 4 OF THE DOSSIER L+S (owner, 23 Nov 2026: "the presses between ladder, notes and changes has a bug.
   You can have multiple press in black at the same time which is a bug"; the editor's walk "File · next ›", as drawn).

   (1) ONE OF THREE: Changes · Notes · Ladder light one at a time — opening the Ladder puts the notes away, opening the
       notes folds the Ladder, Notes is never lit while the Ladder stands, and Changes puts BOTH away (it used to press
       only the first it found, so with both up one stayed lit).
   (2) FILE · NEXT ›: on a walk with a clause after this one, the editor's black button says filing moves on
       (ceSaveAndOn already files and opens the next). */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const NG = strip(R('js/views/negotiation.js')), PD = strip(R('js/paperdesk.js')), CE = strip(R('js/views/clauseeditor.js'));

describe('f1197 (1) one of three', () => {
  test('the Ladder opening puts the notes away', () => {
    assert.match(NG, /rlFaceLadderSet\(rlFaceLadderOpen\(\) === faceRow \? null : faceRow\);\s*if \(rlFaceLadderOpen\(\) && typeof rlFaceNotesSet === 'function'\) rlFaceNotesSet\(null\);/);
  });
  test('the notes opening fold the Ladder', () => {
    assert.match(NG, /rlFaceNotesSet\(_rlFnFor === String\(id\) \? null : id\);\s*if \(_rlFnFor && rlFaceLadderOpen\(\)\)\{ rlFaceLadderSet\(null\);/);
  });
  test('Notes is never lit while the Ladder stands', () => {
    assert.match(NG, /const on = rlFaceNotesOn\(c, opts\) && !\(opts\.dealDoor && rlFaceLadderOpen\(\)\);/);
  });
  test('Changes puts both away', () => {
    const i = PD.indexOf("if (t.closest('[data-rl-head-changes]'))"); assert.ok(i >= 0);
    const body = PD.slice(i, PD.indexOf('return; }', i) + 9);
    assert.match(body, /rlFaceLadderOpen\(\)\)\{ rlFaceLadderSet\(null\);/);
    assert.match(body, /dk\.querySelector\('\[data-rl-notes-all\]\[aria-pressed="true"\]'\)/);
    assert.doesNotMatch(body, /\[data-rl-ladder\]\[aria-expanded="true"\]'\)\s*;\s*if \(on\) on\.click/, 'no longer only the first it finds');
  });
});

describe('f1197 (2) file · next ›', () => {
  test('on a walk with a clause after this one, the black button says it moves on', () => {
    assert.match(CE, /const wNext = \(typeof w !== 'undefined' && w && w\.k && w\.k < w\.n\) \? w : null;/);
    assert.match(CE, /label \+ ' \\u00b7 ' \+ _cet\('ce_then_next'\)/);
    assert.match(CE, /\[\[save, labelNext, anyToFile\]\]/);
    const I = R('js/i18n.js'); assert.equal((I.match(/^    ce_then_next: /gm) || []).length, 2, 'both books');
  });
});
