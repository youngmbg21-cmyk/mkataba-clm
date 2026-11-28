'use strict';
/* f1220 — EVERY TAB THE SAME SIZE (owner, 28 Nov 2026: "make these buttons the same size"; picked "Full width, equal", then
   "A: today's words, nearly equal"): the Dossier's strip runs from the panel's left edge to the fold arrow, its tabs sharing
   it equally (flex 1 1 0), none narrower than its own words (min-width: max-content — a tab with a number is a few pixels
   wider, no word is ever cut); the editor's copy is the same strip, its own grey track gone, each tab the track and the open
   one the white pill inset 3px. The words keep their size. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const H = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const D = 'html.lg-new #app-shell #ig-dock > .igd-head.igd-head[data-pd-head="paper"]';
const E = 'html.lg-new #clause-editor.is-tabbed';

test('f1220 (1) the Dossier strip: full width, equal shares, words whole', () => {
  assert.ok(H.includes(D + '{justify-content:flex-start;padding-left:16px;padding-right:52px}'));
  assert.ok(H.includes(D + ':has(> .pd-tab + .pd-tab) > .pd-tab, ' + D + ':has(> .pd-tab + .pd-tab):has(> .pd-tab:nth-of-type(5)) > .pd-tab, ' + D + ':has(> .pd-tab + .pd-tab):has(> .pd-tab:nth-of-type(6)) > .pd-tab{flex:1 1 0;min-width:max-content;justify-content:center;padding:0 3px;margin:0}'));
});
test('f1220 (2) the editor copy is the same strip', () => {
  assert.ok(H.includes(E + ' .ce-drow{justify-content:flex-start;padding:0 52px 0 16px}'));
  assert.ok(H.includes(E + ' .ce-drow > .ce-dtabs{flex:1 1 auto;width:auto;max-width:none;gap:0;padding:0;border-radius:0;background:none}'));
  assert.ok(H.includes(E + ' .ce-drow > .ce-dtabs .pd-tab{position:relative;isolation:isolate;flex:1 1 0;min-width:max-content;justify-content:center;height:32px;padding:0 3px;'));
  assert.ok(H.includes(E + ' .ce-drow > .ce-dtabs .pd-tab.on::before{content:"";position:absolute;inset:3px;'));
});
test('f1220 (3) the words keep their size', () => {
  const blk = H.slice(H.indexOf('/* EVERY TAB THE SAME SIZE'), H.indexOf('</style>', H.indexOf('/* EVERY TAB THE SAME SIZE')));
  assert.doesNotMatch(blk, /font-size/);
});
