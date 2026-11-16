'use strict';
/* f1083 — REDLINES' NOTES ARE THE BAR'S NOTES; NO AMBER BOX ROUND A NOTE BESIDE THE PAPER
   (owner, 16 Nov 2026: Redlines' Notes "should look exactly like how notes in the notes located at the top of the page
   bar" — "yes" to drawing it with the bar's own builder; the amber box round the open clause's note — "never")
   1 · In the new look the Notes face holds a host, and its wiring paints the bar's own builders into it: the whole
       contract through rlChatPanelPaint, one change through rlNotesPanelPaint. The name line is left out there.
   2 · pd2ClauseTint lights nothing: no note boxed, no row lit, and the sheet's amber box rules are gone.
   At the parent both fail. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.join(__dirname, '..');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const N = strip(read('js/views/negotiation.js'));
const fn = (src, name) => { const i = src.indexOf('function ' + name + '('); assert.ok(i >= 0, name); const j = src.indexOf('\nfunction ', i + 10); return src.slice(i, j < 0 ? undefined : j); };

test('f1083 (1) the Notes face paints the bar\'s own builders', () => {
  const H = fn(N, 'rlFaceNotesHtml');
  assert.match(H, /newLookOn\(\)\)\{[\s\S]*class="rl-fn rl-fn-same"[\s\S]*data-rl-fn-host/, 'a host in the new look');
  const W = fn(N, 'rlFaceNotesWire');
  assert.match(W, /querySelector\('\[data-rl-fn-host\]'\)/);
  assert.match(W, /if \(ch\) rlNotesPanelPaint\(same, c, ch, o\); else rlChatPanelPaint\(same, c, o\);/);
  assert.match(strip(read('index.html')), /html\.lg-new #ig-dock \.rl-fn-same \.rl-chat > \.rl-np-which\{display:none\}/);
});

test('f1083 (2) nothing is lit amber beside the paper', () => {
  const T = fn(strip(read('js/paperdesk.js')), 'pd2ClauseTint');
  assert.doesNotMatch(T, /classList\.add\(/, 'no note boxed, no row lit');
  assert.match(T, /classList\.remove\('is-on', 'pd2-lit'\)/, 'a page drawn before is cleared');
  const CSS = strip(read('index.html'));
  assert.doesNotMatch(CSS, /#pd2-notes \.pd2-mg\.is-on\{/);
  assert.doesNotMatch(CSS, /\.doc-th-row\.is-open\.pd2-lit\{box-shadow:inset 0 0 0 1\.5px/);
});
