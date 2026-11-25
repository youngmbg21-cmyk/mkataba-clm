'use strict';
/* f1224 — THE UNSIGNED PAPER AND ITS NOTES, THE LEGORA + STRIPE WAY (owner's pick, 24 Nov 2026: "Update the l+s with
   the legora font"; "the zoom and the all, outstanding etc remain intact and everything scroll behind them but it
   should not be translucent"; "build L+S").
   (1) A paragraph's own number ("1.1 Scope…") is wrapped where it stands (pd2ParaNums), its space kept, the words
       reading as before; only two levels or more, never a box being typed in, never the signing copy.
   (2) The notes' row: All · Outstanding · Resolved with Hide at its end, one row that never wraps; Hide alone where
       there is one kind; the Redline view may put its notes away too.
   (3) The controls STAY PUT (reverses "Comes back"): held from the first pixel; a SOLID strip in the desk's colour
       stands behind the held row, inside the paper's window only.
   (4) A redline note's head carries a soft badge, Outstanding or Resolved.
   At the parent all four fail. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const PD = read('js/paperdesk.js'), H = read('index.html');
const fnSrc = (src, name) => { const i = src.indexOf('function ' + name + '('); assert.ok(i >= 0, name + ' exists'); return src.slice(i, src.indexOf('\n}', i) + 2); };

test('f1224 (1) a paragraph\'s own number stands in its own span; the words read as before', () => {
  const re = PD.match(/const PD2_PNUM_RE = [^;]+;/); assert.ok(re, 'the reader');
  const dom = new JSDOM('<!doctype html><body><div id="cv"><article class="nego-doc rl-paper"><div class="nego-body">'
    + '<p>1.1 <strong>Scope.</strong> The Agreement sets out the terms.</p><p>16.1.1 Deep.</p><p>30 days after signing.</p><p>Plain words.</p><p>2.3 </p></div></article>'
    + '<article class="nego-doc rl-paper pg-sign"><div class="nego-body"><p>4.2 Signed copy.</p></div></article></div></body>', { runScripts: 'outside-only' });
  const w = dom.window; w.eval(`window.newLookOn = () => true; ${re[0].replace('const', 'var')}\n${fnSrc(PD, 'pd2ParaNums')}`);
  const cv = w.document.getElementById('cv'), before = [...cv.querySelectorAll('p')].map(p => p.textContent);
  w.pd2ParaNums(cv); w.pd2ParaNums(cv);
  const ps = [...cv.querySelectorAll('p')];
  assert.deepEqual(ps.map(p => p.textContent), before, 'every paragraph reads exactly as before');
  assert.deepEqual(ps.map(p => (p.querySelector('.rl-pnum') || {}).textContent || ''), ['1.1 ', '16.1.1 ', '', '', '', ''], 'two levels or more; not "30 days", not a number alone, not the signing copy');
  assert.equal(cv.querySelectorAll('.rl-pnum').length, 2, 'done once a paragraph');
});

/* RE-POINTED 25 Nov 2026 (the paper's dock): the row is written into the dock (pd2DockRowSet), held there by sticky, not by
   a strip; f1225 carries the dock */
test('f1224 (2) one row: the three tabs with Hide at its end; Hide alone where there is one kind', () => {
  const chips = fnSrc(PD, 'pd2RedChipsHtml');
  assert.match(chips, /\.join\(''\)\}<button type="button" class="pd2-rn-hide ui-link" data-pd2-notes-tg="hide"/);
  assert.match(fnSrc(PD, 'pd2NotesTgHtml'), /if \(!hidden\) return `<div class="pd2-rn-chips pd2-tg"><button type="button" class="pd2-rn-hide ui-link" data-pd2-notes-tg="hide"/);
  assert.match(fnSrc(PD, 'pd2NotesPaint'), /pd2DockRowSet\(chips \|\| pd2NotesTgHtml\(false\)\);/);
  assert.match(H, /#pd2-dock-row > \.pd2-rn-chips\{position:static;display:flex;flex-wrap:nowrap;/, 'the row never wraps');
});

test('f1224 (3) the controls stay put: the dock holds them, the hand-held pinning stands down', () => {
  assert.match(PD, /const PD2_DOCK_ON = true;/);
  assert.match(fnSrc(PD, 'pd2CtlArm'), /if \(PD2_DOCK_ON\) return;/);
  assert.doesNotMatch(PD, /function pd2CtlStrip\(/, 'no strip guessed behind them');
});

test('f1224 (4) a redline note\'s head says Outstanding or Resolved, a soft badge', () => {
  assert.match(fnSrc(PD, 'pd2RedGroupHtml'), /<span class="pd2-rn-bd is-\$\{tone\}">\$\{E\(_pdT\(tone === 'done' \? 'pd2_rn_chip_done' : 'pd2_rn_chip_open'\)\)\}<\/span>/);
  assert.match(H, /#pd2-notes \.pd2-rn-bd\.is-done\{background:var\(--st-green-bg\);color:var\(--st-green-fg\)\}/);
});
