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

/* RE-POINTED (P-33, owner's pick 20 Nov 2026: Import the Legora + Stripe way): the five tinted tiles became ONE batch bar;
   each kind still wears the colour of what it means — green filed, amber to check, violet is it signed?, blue a copy?,
   red no readable text — on its segment and its legend dot, from the status tokens */
test('f1082 (1) Import: each kind on the batch bar wears the colour of what it means', () => {
  const M = read('js/views/migration.js');
  assert.match(M, /const MIGN_BATCH = \[\['filed', 'green', 'k:filed'\], \['check', 'amber', 'k:check'\], \['unsigned', 'violet', ''\], \['dupe', 'steel', 'k:dupe'\], \['none', 'ruby', 'k:none'\]\];/);
  for (const t of ['green', 'amber', 'violet', 'steel', 'ruby'])
    assert.ok(HTML.includes(`html.lg-new :is(.mign-bbar,.mign-bkey) .is-${t}{background:var(--st-${t}-dot)}`), t + ': the segment and its dot, one token');
});

test('f1082 (2) New agreement: a card wears its stream\'s colour, grey drawn green; the chosen one keeps its outline', () => {
  const W = read('js/wizard.js');
  assert.equal(W.split('folder:t.folder, cat:t.category').length - 1, 3, 'every row carries its stream');
  const m = W.match(/const naCardTone=r=>\{[^\n]*\};/); assert.ok(m, 'naCardTone');
  const tone = new Function('listStreamTone', m[0] + ' return naCardTone;')(k => ({ proc: 'violet', corp: 'gray' })[k]);
  assert.equal(tone({ folder: 'proc' }), 'violet'); assert.equal(tone({ folder: 'corp' }), 'green'); assert.equal(tone({}), '');
  assert.match(W, /const tint=card===true\?naCardTone\(r\):'';/, 'the sheet\'s card only, never the list\'s row');
  assert.match(W, /\$\{tint\?` data-tone="\$\{tint\}"`:''\}>\$\{inner\}<\/button>/, 'carried as an attribute, the row\'s class left as it was');
  for (const t of ['violet', 'steel', 'amber', 'pink', 'green'])
    assert.ok(HTML.includes(`html.lg-new #na-root.na-one .na-closest .na-pick.na-close[data-tone="${t}"]{background:var(--st-${t}-bg);border-color:transparent}`), t);
  assert.ok(HTML.includes('html.lg-new #na-root.na-one .na-closest .na-pick.na-close[data-tone].on{border-color:var(--color-text)}'));
});
