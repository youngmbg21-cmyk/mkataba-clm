'use strict';
/* f1082 — SOFT TINT ON THE TILES (owner's pick by name, 16 Nov 2026: "soft tint", then "keep it as drawn").
   Import's five figures each wear the pale colour of what they mean (a figure of nothing stays grey); New agreement's
   three cards each wear their paper's stream colour, the list language's own, a grey stream drawn green on the card.
   Source-sliced, comments stripped; the small reading runs. */
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const read = f => strip(fs.readFileSync(path.join(__dirname, '..', f), 'utf8'));
const HTML = read('index.html');

test('f1082 (1) Import: a figure wears the colour of what it means; a figure of nothing wears none', () => {
  const M = read('js/views/migration.js');
  assert.match(M, /const MIGN_FIG_TONE = \{ files: 'steel', filed: 'green', check: 'amber', dupe: 'amber', none: 'ruby' \};/);
  assert.match(M, /`<button type="button" class="mign-fig is-t-\$\{MIGN_FIG_TONE\[f\]\}/, 'the pressable figure carries its tone');
  assert.match(M, /`<span class="mign-fig is-zero">/, 'a figure of nothing carries none');
  for (const t of ['steel', 'green', 'amber', 'ruby'])
    assert.ok(HTML.includes(`html.lg-new .mign-fig.is-t-${t}{background:var(--st-${t}-bg)} html.lg-new .mign-fig.is-t-${t} b{color:var(--st-${t}-fg)}`), t + ': pale ground, deep number, both tokens');
});

test('f1082 (2) New agreement: a card wears its stream\'s colour, grey drawn green; the chosen one keeps its outline', () => {
  const W = read('js/wizard.js');
  assert.equal(W.split('folder:t.folder, cat:t.category').length - 1, 3, 'every row carries its stream');
  const m = W.match(/const naCardTone=r=>\{[^\n]*\};/); assert.ok(m, 'naCardTone');
  const tone = new Function('listStreamTone', m[0] + ' return naCardTone;')(k => ({ proc: 'violet', corp: 'gray' })[k]);
  assert.equal(tone({ folder: 'proc' }), 'violet'); assert.equal(tone({ folder: 'corp' }), 'green'); assert.equal(tone({}), '');
  assert.match(W, /const tint=card===true\?naCardTone\(r\):'';/, 'the sheet\'s card only, never the list\'s row');
  for (const t of ['violet', 'steel', 'amber', 'pink', 'green'])
    assert.ok(HTML.includes(`html.lg-new #na-root.na-one .na-closest .na-pick.na-close.is-t-${t}{background:var(--st-${t}-bg);border-color:transparent}`), t);
  assert.ok(HTML.includes('html.lg-new #na-root.na-one .na-closest .na-pick.na-close[class*="is-t-"].on{border-color:var(--color-text)}'));
});
