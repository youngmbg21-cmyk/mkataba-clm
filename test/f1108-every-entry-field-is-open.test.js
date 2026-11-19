'use strict';
/* f1108 — EVERY ENTRY FIELD IS OPEN, THE LEGORA WAY (owner, 19 Nov 2026: "The design token for hati should be like
   image 2" — the Send screen's To step — then "all of hati at once").

   (1) ONE HOME: :root carries the --fld-* tokens — no edge, one divider line under, no fill, square.
   (2) ONE CLOSING RULE dresses every field the sheet styles from those tokens, leaving out the boxes that hold a
       field (Jambo's, the jump window, search and note boxes, the sign-in) and "Fill in the contract"; it sits
       before the panel-head line rule (f1107 keeps that one last).
   (3) NO FIELD BUILDER WRITES A BOX: no <input>/<select>/<textarea> tag in js/, and no field style (one sized by
       --field-h or --field-pad-x), still writes "border:1px solid …" — they read --fld-edge / --fld-under.
   (4) ROWS: the pop-ups' .sap-f, Settings' labels and the calendar's event put the label beside the words with the
       line under the row; a row that draws its own line sets --fld-under to none.
   (5) A CHOICE OF A FEW IS PILLS: Who pays whom is grey pills, the chosen one ink, and the request form draws it
       with the one builder (payWhoHtml) instead of a dropdown.
   (6) AN OWED FIELD'S HINT IS AMBER; the rule line in CLAUDE.md no longer says "not yet built". */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const HTML = read('index.html');
const CSS = HTML.replace(/\/\*[\s\S]*?\*\//g, '');
const JS_FILES = [...fs.readdirSync(path.join(ROOT, 'js')).filter(f => f.endsWith('.js')).map(f => 'js/' + f),
  ...fs.readdirSync(path.join(ROOT, 'js/views')).filter(f => f.endsWith('.js')).map(f => 'js/views/' + f)];

test('f1108 (1) one home: the --fld-* tokens on :root', () => {
  assert.match(CSS, /--fld-edge:0 solid transparent;/);
  assert.match(CSS, /--fld-under:1px solid var\(--color-divider\);/);
  assert.match(CSS, /--fld-under-none:0 solid transparent;/);
  assert.match(CSS, /--fld-bg:transparent;/);
  assert.match(CSS, /--fld-r:0;/);
});

test('f1108 (2) one closing rule dresses every styled field from the tokens, its boxes left out', () => {
  const at = CSS.indexOf('{border:var(--fld-edge);border-bottom:var(--fld-under);border-radius:var(--fld-r);background-color:var(--fld-bg);box-shadow:none}');
  assert.ok(at > 0, 'the closing rule exists');
  const sel = CSS.slice(CSS.lastIndexOf('\n', at), at);
  assert.match(sel, /^\s*html:not\(#_\):not\(#_\) :is\(input:not\(/, 'weighed like the ring rule');
  for (const k of ['select', 'textarea', '.dp-face', '[type="search"]', '[id$="-q"]'])
    assert.ok(sel.includes(k), k + ' is named');
  for (const box of ['.jb-card', '#cmd-palette', '.rl-np-box', '.lin-wrap', '.pd2-fm-mid', '.sdd-find', '.nd-bar'])
    assert.ok(sel.includes(box), box + ' keeps its own look');
  const head = CSS.indexOf(':is(.jl-head, #ig-dock > .igd-head, #ai-panel > header, .st-side-head)');
  assert.ok(head > at, 'it stands before the panel-head line rule, which stays last (f1107)');
});

test('f1108 (3) no field builder writes a box', () => {
  const tag = /<(input|select|textarea)\b[^>]*?>/g;
  const lit = /(['"`])((?:(?!\1)[^\n\\]|\\.)*?(?:var\(--field-h|var\(--field-pad-x)(?:(?!\1)[^\n\\]|\\.)*?)\1/g;
  const boxed = [];
  for (const f of JS_FILES){
    const s = read(f);
    for (const m of s.matchAll(tag)){
      if (/type=["'](checkbox|radio|hidden|file|range|color|search)/.test(m[0])) continue;
      if (/border\s*:\s*1px solid/.test(m[0])) boxed.push(f + ': ' + m[0].slice(0, 80));
    }
    for (const m of s.matchAll(lit)) if (/border\s*:\s*1px solid var\(--(field-line|color-divider)\)/.test(m[2])) boxed.push(f + ': ' + m[2].slice(0, 80));
  }
  assert.deepEqual(boxed, []);
  assert.match(read('js/core.js'), /const HATI_FLD='[^']*border:var\(--fld-edge\);border-bottom:var\(--fld-under\);background:var\(--fld-bg\);border-radius:var\(--fld-r\)/);
  assert.match(read('js/review.js'), /const RV_FLD = '[^']*border:var\(--fld-edge\);border-bottom:var\(--fld-under\)/);
  assert.match(read('js/views/settings.js'), /const ST_INPUT='[^']*border:var\(--fld-edge\);border-bottom:var\(--fld-under\)/);
  assert.match(read('js/wizard.js'), /const WZ_ST='[^']*border:var\(--fld-edge\);border-bottom:var\(--fld-under\);background:var\(--fld-bg\)/);
});

test('f1108 (4) rows put the label beside the words, the line under the row', () => {
  assert.match(CSS, /html:not\(#_\) \.modal-in \.sap-f\{--fld-under:var\(--fld-under-none\);display:grid;grid-template-columns:minmax\(96px, 150px\) minmax\(0, 1fr\);[^}]*border-bottom:1px solid var\(--color-divider\)\}/);
  assert.match(CSS, /html:not\(#_\) \.modal-in \.sap-body > :is\(\.sap-row, \.sap-row3\)\{display:block\}/);
  assert.match(CSS, /\.st-sec label:has\(> :is\(input:not\(\[type="checkbox"\], \[type="radio"\]\), select, textarea\)\)\{--fld-under:var\(--fld-under-none\);display:grid;grid-template-columns:150px minmax\(0, 1fr\)/);
  assert.match(CSS, /:is\(\.cal-evd > label, \.cal-evd-row > label:not\(\.cal-evd-all\)\)\{--fld-under:var\(--fld-under-none\);display:grid/);
  assert.match(CSS, /:is\(\.lgp-row, \.sh-lt-who > label, \.na-kt-r\)\{--fld-under:var\(--fld-under-none\)\}/, 'rows that draw their own line draw no second');
});

test('f1108 (5) a choice of a few is pills; the request form uses the one builder', () => {
  assert.match(CSS, /\.pw \.pw-seg \.na-seg-b\{[^}]*background:var\(--color-neutral-100\);border-radius:999px/);
  assert.match(CSS, /\.pw \.pw-seg \.na-seg-b\[aria-checked="true"\]\{background:var\(--color-text\);color:var\(--color-surface\)\}/);
  const ik = read('js/views/intake.js');
  assert.equal((ik.match(/f\.key==='side' && typeof window\.payWhoHtml==='function'/g) || []).length, 2, 'both request builders');
});

test('f1108 (6) an owed hint is amber; the rule is no longer "not yet built"', () => {
  assert.match(CSS, /:is\(input, textarea\)\.need-empty::placeholder\{color:var\(--st-amber-fg\)\}/);
  const rules = read('CLAUDE.md');
  assert.match(rules, /EVERY ENTRY FIELD IS OPEN, THE LEGORA WAY/);
  assert.ok(!/EVERY ENTRY FIELD IS OPEN[^\n]*NOT YET BUILT/.test(rules), 'the rule says it is built');
});
