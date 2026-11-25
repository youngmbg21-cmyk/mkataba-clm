'use strict';
/* f1220 — THE EDITOR'S SIDE PANEL, THE LEGORA + STRIPE WAY (owner, 24 Nov 2026: "l+s facelift … only in the panel and make
   it have value add and make sense to a user"; "Remove the green links and the grey wordings below save counter. And reduce
   the save counter button size so undo can be next to it … less is more"; "Build it and merge it").
   (1) The head: § over the clause's name, ONE badge — Not filed yet while a change waits; no sentence under the name.
   (2) What they asked: their open change, their words marked (before against after), Accept · Reject beside it — the
       Redlines row's own buttons; once a counter is typed, Your answer: the paper's words marked against theirs.
   (3) Before you answer: only lines that say something (no "holds no figure", no "no precedent"), a soft mark each.
   (4) The foot: Save · Undo side by side (or Next ›), nothing under it but Jambo's box: no links line, no "Next: …".
   Red at the parent. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const CE = read('js/views/clauseeditor.js'), H = read('index.html'), I = read('js/i18n.js');
const fn = name => { const i = CE.indexOf('function ' + name + '('); assert.ok(i >= 0, name); return CE.slice(i, CE.indexOf('\n}', i) + 2); };

test('f1220 (1) the head: § over the name, one badge, no sentence', () => {
  const p = fn('ceTabPaint');
  assert.match(p, /<div class="ce-thd is-ls">\$\{num \? `<p class="ce-teb">\\u00a7 \$\{_cee\(num\)\}<\/p>` : ''\}<h3 class="ce-th">/);
  assert.match(p, /liveNow \? `<span class="ce-tbadge k-unfiled">\$\{_cee\(_cet\('ce_tab_unfiled'\)\)\}<\/span>` : badge/);
  assert.doesNotMatch(p, /ce_tab_sub2/);
});
test('f1220 (2) what they asked, Accept · Reject through the row, and your answer once typed', () => {
  const p = fn('ceTabPaint');
  assert.match(p, /x\.authorSide === 'counterparty' && x\.status === 'pending'/);
  assert.match(p, /ceRedlineHtml\(theirs\.oldText != null \? theirs\.oldText : _ceBase, theirs\.newText != null \? theirs\.newText : ceWords\(theirs\.text\)\)/);
  assert.match(p, /data-ce-act="ladder-accept" data-id="\$\{_ceea\(theirs\.id\)\}"[\s\S]*data-ce-act="theirs-reject"/);
  assert.match(CE, /case 'theirs-reject': \{[\s\S]*if \(on\) ceRejectTheirs\(on\);/);
  assert.match(p, /liveNow \? \(\(\) => \{[\s\S]*ce_tab_answer[\s\S]*ceRedlineHtml\(theirs\.newText/);
});
test('f1220 (3) Before you answer: only lines that say something', () => {
  const lad = fn('ceLadderCardHtml');
  assert.match(lad, /ladder !== _cet\('ce_lc_nostd'\)[\s\S]*prec !== _cet\('ce_lc_noprec'\)/);
  assert.match(fn('ceTabBeforeHtml'), /if \(!lines \|\| !lines\.length\) return '';/);
});
test('f1220 (4) the foot: Save · Undo, no links line, no grey words', () => {
  const p = fn('ceTabPaint');
  assert.match(p, /data-ce-tsave[\s\S]*<button type="button" class="ce-tundo2" data-ce-act="undo">/);
  assert.match(p, /const fh = btn \? `<div class="ce-tfrow is-ls">\$\{btn\}<\/div>` : '';/);
  assert.doesNotMatch(p, /ce_tab_next_to/);
  assert.ok(H.includes('.ce-tfrow.is-ls .ce-tnext.is-save{background:var(--color-text);color:var(--color-surface);padding:6px 14px}'), 'a small black Save');
});
test('f1220 (5) the words, both books', () => {
  for (const k of ['ce_tab_unfiled', 'ce_tab_asked', 'ce_tab_asked_x', 'ce_tab_before', 'ce_tab_answer'])
    assert.equal((I.match(new RegExp('^    ' + k + ': ', 'gm')) || []).length, 2, k);
});

test('f1220 (6) Your answer is its own block, a line above it, so Accept and Reject sit with what they asked', () => {
  const fs = require('node:fs'), path = require('node:path');
  const src = fs.readFileSync(path.join(__dirname, '..', 'js/views/clauseeditor.js'), 'utf8');
  assert.match(src, /<div class="ce-tansb"><div class="ce-sh ce-tans-h">/, 'the answer wrapped in its own block');
  const css = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.match(css, /#clause-editor\.is-tabbed \.ce-tasked \.ce-tansb\{[^}]*border-top:1px solid var\(--color-divider\)/, 'a line above it, as every other block');
});

test('f1220 review of #1004/#1007: one Accept on the tab; the heading number typed like any word', () => {
  const E = require('node:fs').readFileSync(require('node:path').join(__dirname, '..', 'js/views/clauseeditor.js'), 'utf8');
  const lc = E.slice(E.indexOf('function ceLadderCardHtml('), E.indexOf('function ceLadderCardHtml(') + 6000);
  assert.match(lc, /const tActs = \/data-ce-act="ladder-accept"\/\.test\(acts\) \? '' : acts;/, 'the card does not draw a second Accept on the tab');
  assert.match(E, /if \(!String\(f\.textContent \|\| ''\)\.trim\(\)\) ev\.preventDefault\(\);/, 'a Backspace at the start of the name never takes the locked number');
  assert.match(E, /t\.innerHTML = window\.rlHeadNumHtml \? rlHeadNumHtml\(_cee\(_ceHead\)\)/, 'Escape puts the number column back');
});

test('f1220 the Playbook\'s wording on the Editor TAB (owner, 25 Nov 2026: "yes"): the chips row stands for its Playbook questions only', () => {
  const H = require('node:fs').readFileSync(require('node:path').join(__dirname, '..', 'index.html'), 'utf8');
  assert.match(H, /html\.lg-new #clause-editor\.is-tabbed #ce-chips:has\(\[data-ce-std\]\)\{display:flex/, 'the row stands where a Playbook question is in it');
  assert.match(H, /html\.lg-new #clause-editor\.is-tabbed #ce-chips:has\(\[data-ce-std\]\) button:not\(\[data-ce-std\]\)\{display:none\}/, 'and draws only those');
});
