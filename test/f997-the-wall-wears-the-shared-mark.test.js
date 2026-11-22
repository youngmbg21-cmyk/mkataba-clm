'use strict';
/* f997 — THE WALL'S CIRCLES ARE THE PLATFORM'S (owner, 10 Nov 2026, over a picture of the wall: "the circles need to
   match what other circles in the platform"). In the new look the wall's papers, and a party's own list of agreements,
   wore the older ring (a dotted or half-filled outline, regStageMarkHtml) while the list beside them wears the SAP way
   mark (regSapMarkHtml: a filled circle, ✓ ! i × –). One reading (regSapMarkOf), one mark, on the list, the wall and
   the party's page. At the parent both draw the older ring and the mark is not published. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const read = f => strip(fs.readFileSync(path.join(__dirname, '..', f), 'utf8'));
const fnBody = (src, name) => { const i = src.indexOf('function ' + name + '('); assert.ok(i >= 0, name); return src.slice(i, src.indexOf('\n}', i)); };

/* RE-POINTED (P-31, owner's pick 20 Nov 2026: THE STRIPE WALL): the new-look paper wears no mark — its standing is the
   list's own soft badge (regStageTone's tone), with the end date, and no money */
test('f997 (1) the wall\'s new-look paper wears the list\'s standing badge, no mark, no money', () => {
  const nl = fnBody(read('js/views/intelligence.js'), 'igWallCardHtml');
  const at = nl.indexOf('newLookOn()'); assert.ok(at > 0, 'the new-look branch');
  const br = nl.slice(at, nl.indexOf('\n  }\n', at));
  assert.match(br, /regStageTone\(c\)\.tone/, 'the list\'s own tone');
  assert.match(br, /<span class="reg-badge is-\$\{igEsc\(tone\)\}">/);
  assert.doesNotMatch(br, /regSapMarkHtml|igEsc\(val\)/, 'no mark, no money');
});

/* RETIRED 19 Nov 2026 (the Parties round, owner's "build all the designs in parties"): (2) "a party's own agreements wear
   it too" — the party's own page is gone; its agreements are the panel's rows, which wear the five parts' file mark. */

test('f997 (3) the mark and its reading are published once, by the register', () => {
  const R = read('js/views/register.js');
  const pubs = R.split('Object.assign(window').slice(1).map(x => x.slice(0, x.indexOf('});')));
  const one = pubs.filter(x => /\bregSapMarkHtml,/.test(x));
  assert.equal(one.length, 1, 'published once'); assert.match(one[0], /\bregSapMarkOf,/); assert.match(one[0], /\bregStageMarkHtml,/, 'beside the older mark');
});
