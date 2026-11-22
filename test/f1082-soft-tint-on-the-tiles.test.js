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

/* RE-POINTED (P-36, owner's pick 20 Nov 2026: New agreement the Legora + Stripe way — "no filled lavender/mint cards"):
   a card wears no fill of its own; its stream's colour is a soft shelf badge and its used-bar, from the status tokens */
test('f1082 (2) New agreement: a calm card — its stream\'s colour on a soft badge and the used-bar, never a filled card', () => {
  const W = read('js/wizard.js');
  assert.equal(W.split('folder:t.folder, cat:t.category').length - 1, 3, 'every row carries its stream');
  assert.match(W, /const tint='';/, 'no fill of its own');
  /* RE-POINTED 21 Nov 2026 (P-36, as drawn): the badge says the stream's short name ("Procurement"), the whole on its hover */
  assert.match(W, /<span class="na6-cb" style="background:var\(--st-\$\{naTn\}-bg\);color:var\(--st-\$\{naTn\}-fg\)"\$\{r\.stream\?` title="\$\{esc\(r\.stream\)\}"`:''\}>\$\{esc\(naShelfShort\(r\)\)\}<\/span>/, 'the stream\'s soft badge');
  assert.match(W, /<span class="na6-used"><i style="--p:[^"]*;--sd:var\(--st-\$\{naTn\}-dot\)"/, 'the used-bar in the stream\'s colour');
  assert.ok(HTML.includes('html.lg-new #na-root.na-one .na-closest .na-pick.na-close.on{border:2px solid var(--color-text)'), 'the chosen one keeps its outline');
});
