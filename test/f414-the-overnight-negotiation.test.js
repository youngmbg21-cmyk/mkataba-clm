/* f414 — THE OVERNIGHT RUN'S NEGOTIATION ITEMS (the owner's list, 27 Sep 2026)

   n3  a Copilot suggestion that cannot be filed says why ('warn'/'err'), and a
       filing confirms itself ('ok'), in both languages;
   n4  a single line break becomes a paragraph before the lines are read, so
       deleting the start of a line does not merge it into the line above;
   n5  typing over a selection with struck words in it is handled by the page;
   n6  the clause editor's Apply refuses a conversational reply;
   n7  the Word history credits each tracked change to its proposer;
   n8  HTML's named characters (&middot;, &nbsp;…) reach Word as characters;
   n9  "Why they asked" never shows Copilot's provenance label;
   n10 the contract name is printed as typed on the Negotiate page;
   n11 the gutter number is not bolded in the room's redline view;
   n12 a closing section banner is drawn after the last clause;
   n13 the control row's height is a floor, so a wrapped row does not spill;
   n14 the divider's fraction limits light the at-limit grip and the cursor;
   n15 both colour keys name the parties through one reading;
   n16 figure-scale readings on one number share one mark that names them all;
   n17 the playbook window asks "Already here" fresh after each filing;
   n18 the playbook review loads a light record before saying it has no text;
   n19 an open clause panel reshapes when the window crosses 1024px;
   n20 the blank document's note names the same button as the button;
   n22 Exit is as tall as the writing tools beside it;
   n23 the empty change column's sentence has the rows' padding.
   Red at a837d09: every claim. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const NV = R('js/views/negotiation.js'), CSS = R('js/views/negotiation-css.js'), CE = R('js/views/clauseeditor.js');
const NM = R('js/negotiation.js'), CV = R('js/views/contract.js'), PB = R('js/playbook.js'), I18N = R('js/i18n.js');
const inBoth = k => (I18N.match(new RegExp('\\n    ' + k + ': ', 'g')) || []).length === 2;

test('f414 (n3) a Copilot filing speaks, both ways', () => {
  assert.match(NV, /toast\(i18t\('ng_ai_filed', \{ id: ch\.id \}\), 'ok'\)/);
  assert.match(NV, /toast\(i18t\('ng_could_not_file'\) \+ \(\(err && err\.message\) \|\| err\), 'err'\)/);
  assert.ok(inBoth('ng_ai_filed') && inBoth('ng_filing'));
});

test('f414 (n4 n5 n6) the clause editor keeps lines, handles struck words, refuses chat', () => {
  assert.match(CE, /negoRichFromLines\(t\.replace\(\/\\n\(\?!\\n\)\/g, '\\n\\n'\)\)/);
  assert.match(CE, /function ceSpanOverAtoms\(box, sel, ev\)\{/);
  assert.match(CE, /!sel\.isCollapsed && ceSpanOverAtoms\(box, sel, ev\)\) return;/);
  assert.match(CE, /window\.aiLooksConversational\(String\(card\.text \|\| ''\)\)/);
});

test('f414 (n7 n8) the Word writer: each change its own author, HTML characters decoded', () => {
  const d = require('../js/docx.js');
  const p = d.docxRunsFromHtml('<p>A &middot; B <ins data-author="Ann">new</ins> <del data-author="Bo">old</del> <ins>x</ins></p>');
  const runs = p[0].runs;
  assert.equal(runs[0].text, 'A · B ', 'the dot is a dot');
  assert.equal(runs.find(r => r.text === 'new').author, 'Ann');
  assert.equal(runs.find(r => r.text === 'old').author, 'Bo');
  assert.equal(runs.find(r => r.text === 'x').author, undefined, 'a mark naming nobody falls back to the file');
  const out = R('js/docx.js');
  assert.match(out, /w:author="\$\{_dxX\(r\.author \|\| state\.author\)\}"/);
  assert.match(NV, /negoChangeHtml\(e\.ch\)\.replace\(\/<\(ins\|del\)\\b\/g, `<\$1 data-author="\$\{_nea\(e\.ch\.author \|\| ''\)\}"`\)/);
});

test('f414 (n9) "Why they asked" reads the reason, never the provenance', () => {
  const at = NM.indexOf('const NEGO_PROVENANCE_RE');
  const negoReasonOf = new Function(NM.slice(at, NM.indexOf('\n', NM.indexOf('const negoReasonOf'))) + '; return negoReasonOf;')();
  assert.equal(negoReasonOf({ note: 'Copilot — Edit' }), '');
  assert.equal(negoReasonOf({ note: 'We need longer' }), 'We need longer');
  assert.equal(negoReasonOf({ why: 'Cash flow', note: 'Copilot — Edit' }), 'Cash flow');
  assert.ok(!/\(ch\.why \|\| ch\.note\)/.test(NV), 'no card reads the raw pair');
  assert.match(NM, /note: negoReasonOf\(ch\) \|\| null, ch \}\);/);
});

test('f414 (n10 n11 n13 n22 n23) what the pages draw', () => {
  assert.ok(!/\$\{_ne\(\(c\.name \|\| tmpl\)\)\.toUpperCase\(\)\}/.test(NV), 'the name is printed as typed');
  assert.match(CSS, /\.nego-redline \.rl-marker\{font-weight:inherit\}/);
  assert.match(CSS, /\.redline-page \.rl-tabrow\{[^}]*min-height:var\(--rl-tabrow-h\)/);
  assert.match(CE, /\.ce-exit\{flex:none; height:34px;/);
  assert.match(R('index.html'), /\.rb-btn\{width:34px;height:34px;/, 'the tools it matches');
  assert.match(CSS, /\.redline-page \.rl-cards-empty\{padding:10px var\(--s-4\);/);
});

test('f414 (n12) a closing banner rides on the last clause and is drawn after it', () => {
  assert.match(R('js/clausemodel.js'), /if \(pend\.length && out\.length\) out\[out\.length - 1\]\.sectionTailHtml = pend\.join\(''\);/);
  assert.equal((NV.match(/rlSectionTailHtml\(clauses\)/g) || []).length, 4, 'the builder and its three papers');
});

test('f414 (n14) the fraction limits light the grip', () => {
  assert.match(NV, /atMin = s\.left <= RL_LEFT_MIN \|\| \(frac != null && frac <= RL_FMIN\)/);
  assert.match(NV, /document\.body\.style\.cursor = lim === 'min' \? 'e-resize' : lim === 'max' \? 'w-resize' : 'col-resize';/);
});

test('f414 (n15) both keys name the parties through one reading', () => {
  assert.match(NV, /function rlLegendNames\(c, side\)\{/);
  assert.match(NV, /function rlCtlLegendHtml\(c, rowSide\)\{\n  const nm = rlLegendNames\(c, rowSide\);/);
  assert.match(NV, /rlMarkLegendHtml\(side, c\)/);
});

test('f414 (n16) readings on one number share one mark', () => {
  assert.match(NV, /data-rl-sc-shared="\$\{g\.length\}"/);
  assert.match(NV, /g\.map\(m => i18t\(m\[2\], \{ n: m\[0\] \}\)\)\.join\(' · '\)/);
});

test('f414 (n17 n18) the playbook window and runner', () => {
  assert.match(NV, /const dupClausesNow = \(\) =>/);
  assert.match(NV, /const stop = dupStop\(other\);/);
  assert.match(PB, /!c\._loaded && typeof window\.ensureFull==='function'\)\{\n    try\{ await window\.ensureFull\(c\); \}catch\(_\)\{\}/);
});

test('f414 (n19) the open panel follows the window across the line', () => {
  assert.match(NV, /window\.addEventListener\('resize', \(\) => \{\n    const now = rlCpNarrowSeat\(\);/);
});

test('f414 (n20) the blank note names the button it sits beside', () => {
  const at = CV.indexOf('function docNothingWrittenHtml(c){');
  const body = CV.slice(at, CV.indexOf('\n}', at));
  assert.ok(!/window\.negoNeedsYouIds\|\|/.test(body), 'no longer asks whether a function exists');
  assert.match(body, /const btn=started \? i18t\('ct_open_negotiate'\) : i18t\('ct_start_negotiating'\);/);
});
