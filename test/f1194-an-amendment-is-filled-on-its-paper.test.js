'use strict';
/* f1194 — AN AMENDMENT IS FILLED ON ITS PAPER (owner, 23 Nov 2026: "I have filled in the paper but it still does not
   allow me to save … Filling in should only be on paper unless other requirements not on paper are needed").

   (1) THE ANSWER GOES INTO THE WORDING: every blank writer (the paper fill, Jambo, the panel) is contractBlankSet, and
       for our own amendment's ruled line it hands to ownBlankSet, so the paper the other side signs is filled — before,
       only c.fields was, the ruled line stayed and signing was refused for a placeholder.
   (2) FILLED MEANS FILLED ON THE PAPER: an answer kept on the record while the wording still shows the line is owed.
   (3) THE "MADE ON" LINE IS THE EFFECTIVE DATE: filling it fills the record's, and no second Effective box is asked.
   (4) AN AMENDMENT WE WROTE OWES NO VALUE: its new value is a suggestion approval already reads (f1192). */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');

function world(){
  const dom = new JSDOM('<!doctype html><body></body>', { runScripts: 'outside-only' });
  const W = dom.window;
  W.eval(`var persisted = 0; function persist(){ persisted++; } function canEdit(){ return true; } function logAudit(){}
    function todayStr(){ return '23 Nov 2026'; } function fmtDocDate(v){ return v === '2027-06-18' ? '18 June 2027' : v; }
    function isUpload(){ return false; } var BLANK_MAX = 60;`);
  W.eval(R('js/blanks.js'));
  return W;
}
const AMEND = () => ({ id: 'MK-9', parentId: 'MK-1', source: 'amendment', status: 'Draft', fields: {},
  redlineText: '<p>This Amendment No. 1 is made on ____________ between A and B.</p><p>The parties entered into the Deal dated ____________ (the Agreement).</p>' });

test('f1194 (1)(3) the paper fill writes the wording, and "made on" fills the effective date', () => {
  const W = world(), c = AMEND();
  assert.equal(W.ownBlanksRead(c).map(b => b.label).join('|'), 'Made on|Deal dated');
  assert.equal(W.contractBlankSet(c, 'own_1', '2027-06-18', { hold: true }), true);
  assert.match(c.redlineText, /made on <span class="hati-field-done" data-field-key="own_1">18 June 2027<\/span>/, 'the answer is on the paper');
  assert.equal(c.fields.effDate, '2027-06-18', 'the effective date follows the paper');
  assert.equal(W.ownMadeOnOf(c), '2027-06-18');
  assert.equal(W.contractBlankSet(c, 'own_2', '2026-11-24'), true);
  assert.equal(W.contractPlaceholders ? W.contractPlaceholders(c).length : 0, 0);
  assert.doesNotMatch(c.redlineText, /_{3,}/, 'no ruled line left on the paper');
});

test('f1194 (2) an answer only on the record is still owed', () => {
  const W = world(), c = AMEND();
  c.fields = { own_1: '2027-06-18', own_2: '2026-11-24' };
  assert.equal(W.ownBlanksRead(c).map(b => b.value).join('|'), '|', 'the paper still shows the lines');
  assert.equal(W.contractBlankSet(c, 'own_1', '2027-06-18'), true, 'typing the same date again writes the wording');
  assert.match(c.redlineText, /18 June 2027/);
});

test('f1194 (3)(4) the details owed: no value, no second Effective box, on an amendment we wrote', () => {
  const src = strip(R('js/views/contract.js'));
  const i = src.indexOf('function detailsOf('), fn = src.slice(i, i + 5000);
  assert.match(fn, /const ownPaper = c\.source === 'amendment' && !!c\.parentId;/);
  assert.match(fn, /if\(seeMoney && \(money \|\| pay\) && !ownPaper\) add\(recSec, 'value'/);
  assert.match(fn, /if\(madeOn == null\) add\(recSec, 'effDate'/);
  assert.match(strip(R('js/core.js')), /!madeOn && !boxes\.some\(b=>b\.key==='effDate'\)/, 'the readiness line agrees');
});
