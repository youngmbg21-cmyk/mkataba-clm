'use strict';
/* f1082 — NO GREEN RING ON A FIELD, ANYWHERE; A CLAUSE LIST WITH NO NUMBERS DRAWS ITS DOTS BESIDE THE NAME
   (owner, 16 Nov 2026, over the Notes box in Redlines: "i have continuously stated that i do not want any green
   outlines in the entry fields across Hati. Fix this once and for all"; and over MK-301's Clauses list, whose dots sat
   on the first letter of each name while MK-382's numbered marks stood beside theirs)
   1 · ONE closing rule: every place a person types draws no outline and no glow when pressed or keyed to, in every
       look; it outweighs the house ring and comes after it.
   2 · The fields and boxes whose edge turned green darken to the ink instead; Jambo's box loses its focus glow.
   3 · "1: Orders" is a number (the mark shows it); a clause with no number keeps its dot in the marks' slot.
   At the parent every claim fails. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.join(__dirname, '..');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const CSS = strip(read('index.html'));

test('f1082 (1) one rule, last: no ring and no glow on any field', () => {
  const m = /html:not\(#_\):not\(#_\) :is\(([^{]*)\):is\(:focus, :focus-visible\)\{outline:none;box-shadow:none\}/.exec(CSS);
  assert.ok(m, 'the one rule');
  for (const who of ['textarea', 'select', '[contenteditable]:not([contenteditable="false"])']) assert.ok(m[1].includes(who), who + ' is named');
  assert.match(m[1], /^input:not\(\[type="checkbox"\]/, 'every typed input, not ticks or buttons');
  assert.ok(m.index > CSS.indexOf('button:focus-visible,a:focus-visible,input:focus-visible'), 'after the house ring');
  assert.ok(m.index > CSS.lastIndexOf('.cd-fld :is(input,select,textarea):focus{'), 'after the forms\' glow');
  assert.ok(m.index > CSS.lastIndexOf('#ig-dock .ac-in:focus{'), 'after a box\'s own ring');
});

test('f1082 (2) a green edge darkens to the ink; the boxes that hold a field the same', () => {
  const f = /html:not\(#_\):not\(#_\) :is\(([^{]*)\):focus\{border-color:var\(--color-text\)\}/.exec(CSS);
  assert.ok(f, 'the fields');
  for (const who of ['.na-inp', '.field', '.hati-editor', '.cd-fld :is(input, select, textarea)']) assert.ok(f[1].includes(who), who);
  const b = /html:not\(#_\):not\(#_\) :is\(([^{]*)\):focus-within\{outline:none;box-shadow:none;border-color:var\(--color-text\)\}/.exec(CSS);
  assert.ok(b, 'the boxes');
  for (const who of ['.rl-np-box', '.jl-box', '.hist-q', '.cmd-search', '.na-askbox', '.sh-col-in']) assert.ok(b[1].includes(who), who);
  assert.match(CSS, /html:not\(#_\):not\(#_\) \.jb-card:focus-within\{outline:none;box-shadow:none\}/);
});

test('f1082 (3) the clause list: "1:" is a number; no number keeps its dot beside the name', () => {
  const J = strip(read('js/views/contract.js'));
  assert.ok(J.includes('lab.match(/^(\\d+(?:\\.\\d+)*)[.:)]?\\s+/)'), 'a colon or bracket after the number');
  const re = /^(\d+(?:\.\d+)*)[.:)]?\s+/;
  assert.equal(re.exec('1: Orders and Deliveries')[1], '1');
  assert.equal(re.exec('2. Term')[1], '2');
  assert.equal(re.exec('Company Information'), null);
  assert.match(CSS, /\.doc-th-lbl ~ \.doc-th-rows \.doc-th-row \.doc-th-bead:not\(\[data-n\]\)\{position:static;flex:none;width:8px;height:8px;margin:0 9px\}/);
});
