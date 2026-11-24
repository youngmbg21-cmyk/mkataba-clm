'use strict';
/* f1223 — A LONE TAB IS NOT A SWITCH (owner, 24 Nov 2026, on Jambo's name centred as a white pill over his
   conversation: "It was not there before"). The Dossier's tabs became one grey switch in the middle (f1216, f1219);
   those rules also caught the head that holds only Jambo's name (pdTalkTabHtml) and drew it as a big centred
   button. Every rule of the switch now asks for two tabs or more, so the lone name stands as it did.
   Red at the parent: the rules matched a head with one tab. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const H = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const P = 'html.lg-new #app-shell #ig-dock > .igd-head.igd-head[data-pd-head="paper"]';

test('f1223 every rule of the tab switch needs two tabs or more', () => {
  const at = []; let i = -1; while ((i = H.indexOf(P, i + 1)) >= 0) at.push(H.slice(i + P.length, i + P.length + 30));
  assert.ok(at.length >= 10, 'the switch\'s rules are found: ' + at.length);
  assert.deepEqual(at.filter(x => !x.startsWith(':has(> .pd-tab + .pd-tab)')), [], 'none dresses a lone tab');
});
