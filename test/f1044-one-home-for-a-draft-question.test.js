'use strict';
/* f1044 — ONE HOME FOR A HALF-TYPED QUESTION (owner, 13 Nov 2026, the flash survey: "a press that should only
   change the words rebuilds the whole page instead"). MEASURED by the rebuild measure (run 43461225946): a question
   half typed into Jambo's box was lost on nearly every press of his panel's own controls — Collapse, Pop out,
   Minimize, Close, the ✦ — on every page that has the panel, because the words lived in the box element and died
   with it. The draft now has one home; only a press that USES the words may empty it.
   Source-sliced: comments stripped, each check pinned to its function's own region.
   The browser half is test/chromium/jambo-box-keeps-what-you-typed-verify.js. */
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const read = f => strip(fs.readFileSync(path.join(__dirname, '..', f), 'utf8'));
const region = (src, start, len = 4000) => { const i = src.indexOf(start); assert.ok(i >= 0, 'missing: ' + start); return src.slice(i, i + len); };

test('f1044 (1) the draft has ONE home, in memory, and it is published', () => {
  const s = read('js/components.js');
  assert.match(s, /function jamboDraft\(\)/, 'the reader');
  assert.match(s, /function jamboDraftSet\(/, 'the one writer');
  assert.match(s, /function jamboDraftClear\(/, 'the one emptier');
  assert.match(s, /Object\.assign\(window,\s*\{[^}]*jamboDraft[^}]*jamboDraftClear[^}]*\}\)/s, 'published (ES modules: only the closing Object.assign publishes)');
  /* a draft question is not a record: it is never stored, never sent, never saved */
  const home = region(s, 'let _jbDraft', 2600);
  assert.doesNotMatch(home, /lsSet|localStorage|persist\(|saveContract|fetch\(/, 'a draft is never stored nor sent');
});

test('f1044 (2) the panel reads the draft, not only the box, so a write with no box cannot end it', () => {
  const s = read('js/views/intelligence.js');
  const r = region(s, 'function renderIntelDock', 3000);
  assert.match(r, /const _keep=\(typeof window\.jamboDraft==='function'\)\?jamboDraft\(\)/, 'the words come from the one home');
  assert.match(r, /jamboDraftSet\(_was\.value,_s\)/, 'a box under the hand is the freshest copy and updates the home first');
});

test('f1044 (3) the panel puts the draft back through the one restorer', () => {
  const s = read('js/views/intelligence.js');
  const r = region(s, 'function renderIntelDock', 60000);
  assert.match(r, /jamboDraftRestore\(n,_focus\)/, 'put back through the one restorer');
});

test('f1044 (4) the ✦ window shares the one draft, both ways', () => {
  const s = read('js/ai.js');
  const r = region(s, 'function openAI', 2500);
  assert.match(r, /jamboDraftRestore\(inp,\s*!o\.noFocus\)/, 'the window opens with the words typed in the panel');
  assert.match(s, /jamboDraftWire\(document\.getElementById\('ai-input'\)\)/, 'and writes them back as the reader types');
});

test('f1044 (5) ONLY a press that uses the words empties the draft', () => {
  const ig = read('js/views/intelligence.js'), ai = read('js/ai.js');
  /* the asking paths clear */
  assert.match(region(ig, 'const go=()=>{ const inp=document.getElementById(\'igd-input\')', 600), /jamboDraftClear\(\)/, 'the panel: asking clears');
  assert.match(region(ai, 'async function aiSubmit', 1400), /jamboDraftClear\(\)/, 'the window: asking clears');
  /* and nothing else does, in either file */
  const clears = (ig + ai).match(/jamboDraftClear\(\)/g) || [];
  assert.ok(clears.length <= 4, 'the draft is emptied in the asking paths only, not scattered (found ' + clears.length + ')');
  /* the controls that lost the words must not clear */
  const fold = region(ig, "document.getElementById('igd-collapse')", 240);
  assert.doesNotMatch(fold, /jamboDraftClear/, 'folding the panel never empties the draft');
});

test('f1044 (6) a box joins the one home by being wired, once', () => {
  const s = read('js/components.js');
  const w = region(s, 'function jamboDraftWire', 900);
  assert.match(w, /dataset\.jbDraft/, 'bound once per element (the standing lesson)');
  assert.match(w, /addEventListener\('input'/, 'every keystroke keeps the home up to date');
});

test('f1044 (7) words PUT in the box (not typed) tell the one home too', () => {
  /* else a repaint would lay the stale draft over the sentence just put there */
  const w = read('js/wizard.js');
  const r = region(w, "document.getElementById('na-ask-again')", 1400);
  assert.match(r, /jamboDraftSet\(asked/, 'Change the ask: the sentence put in the box is the draft');
  const hb = read('js/views/homeboard.js');
  const tip = region(hb, "const box = document.getElementById('igd-input'); if (!box) return;", 600);
  assert.match(tip, /new Event\('input'/, "the tip's fill raises a real input event, so the home hears it");
});
