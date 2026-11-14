'use strict';
/* f1046 — ONE POP-UP TAKING ANOTHER'S PLACE DOES NOT ARRIVE AGAIN (owner, 13 Nov 2026, the flash survey: "a press
   that should only change the words rebuilds the whole page instead"). About forty pop-ups hand over to another,
   and seven rebuilt THEMSELVES to change a few words (the History timeline on every filter, Compare after a
   snapshot, a template's editor / versions / preview). Each such open replayed the arriving animation over a frame
   already standing — the flash — and threw the reader back to the top. The ONE opener now knows it is replacing:
   no arriving animation, and the same screen drawn again keeps the reader's place.
   Source-sliced: comments stripped, each check pinned to its function's own region.
   The browser half is test/chromium/a-popup-replaced-does-not-arrive-again-verify.js. */
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const raw = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const read = f => strip(raw(f));
const region = (src, start, len = 4000) => { const i = src.indexOf(start); assert.ok(i >= 0, 'missing: ' + start); return src.slice(i, i + len); };

test('f1046 (1) the one opener reads what the replaced pop-up leaves, BEFORE it goes', () => {
  const s = read('js/core.js');
  const o = region(s, 'function openModal(html, opts={}){', 6000);
  const iKept = o.indexOf('modalKeptOf(root)'), iWrite = o.indexOf('root.innerHTML=');
  assert.ok(iKept > 0 && iWrite > 0 && iKept < iWrite, 'read before the old panel is written over');
  assert.match(o, /const kept=replacing \? modalKeptOf\(root\) : null/, 'only when a dialog is being replaced');
});

test('f1046 (2) a replacing pop-up is marked, and the mark stops the arriving animation', () => {
  const s = read('js/core.js');
  assert.match(region(s, 'function openModal(html, opts={}){', 6000), /class="modal-in scroll-thin"\$\{kept\?' data-dlg-kept':''\}/, 'marked on the panel');
  const html = raw('index.html');
  const i = html.indexOf('.modal-in{animation:viewIn'), j = html.indexOf('.modal-in[data-dlg-kept]{animation:none;}');
  assert.ok(i > 0 && j > i, 'the rule stands AFTER the arriving rule, so it wins by order and the attribute, not by !important');
  assert.doesNotMatch(html.slice(j, j + 60), /!important/);
});

test('f1046 (2b) the place is put back AFTER the frame is dressed', () => {
  const o = region(read('js/core.js'), 'function openModal(html, opts={}){', 9000);
  const iPin = o.indexOf('_modalPin = dlgPinFoot(panel)'), iPut = o.indexOf('modalKeptPut(panel, kept)');
  assert.ok(iPin > 0 && iPut > iPin, 'the grab bar and the pinned foot add height above the words: the place is set after them');
});

test('f1046 (3) only the SAME screen keeps its place; any doubt starts from the top', () => {
  const s = read('js/core.js');
  const put = region(s, 'function modalKeptPut', 700);
  assert.match(put, /kept\.key==='\|'/, 'a screen with no name and no id cannot be told from another: from the top');
  assert.match(put, /modalScreenKey\(panel\)!==kept\.key/, 'a different pop-up starts at its own top');
  const key = region(s, 'function modalScreenKey', 400);
  assert.match(key, /aria-label/, 'the screen is its label');
  assert.match(key, /first&&first\.id/, 'and its first part');
});

test('f1046 (4) the pop-ups that rebuilt themselves no longer close first', () => {
  const v = read('js/versioning.js');
  assert.doesNotMatch(v, /closeModal\(\);\s*openCompareModal\(/, 'Compare after a snapshot is drawn in the standing frame');
  const l = read('js/views/library.js');
  assert.doesNotMatch(l, /closeModal\(\);\s*openTemplateVersions\(tid\);\n/, "a template's editor hands to its versions in the frame");
  assert.doesNotMatch(l, /tv-edit'\)\?\.addEventListener\('click',\(\)=>\{\s*closeModal\(\)/, 'and back');
  assert.doesNotMatch(l, /tp-blanks'\)\?\.addEventListener\('click',\(\)=>\{\s*closeModal\(\)/, 'the preview hands to the blanks in the frame');
  assert.doesNotMatch(read('js/views/newstandard.js'), /const nsBack = \(\) => \{\s*closeModal\(\)/, 'New standard goes back in the frame');
});

test('f1046 (5) the History timeline is a named screen, so its filters keep the place', () => {
  const n = read('js/views/negotiation.js');
  assert.match(n, /<div id="history-timeline"/, 'its first part carries an id (modalScreenKey)');
});

test('f1046 (6) the helpers are published', () => {
  assert.match(read('js/core.js'), /modalScreenKey,modalKeptOf,modalKeptPut,/);
});
