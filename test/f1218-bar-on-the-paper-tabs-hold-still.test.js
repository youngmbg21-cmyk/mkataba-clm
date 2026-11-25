'use strict';
/* f1218 — THE BAR ON THE PAPER, THE TABS HOLD STILL (owner, 24 Nov 2026: "the highlighted bar always has to be symmetrical
   to the page so the page always has to be equally aligned with it. On the tab with regard to the buttons, they change
   shape when you get to editor"):
   (1) the editor tab's writing bar is as wide as the paper sheet and centred on it (its own width only where its tools
       need more), its empty slots taking no gap;
   (2) the editor's side is the Dossier panel's own width (igDockWidth → --ce-tab-rail → ceFitSplit), and its tab track
       starts and stands where the Dossier's row does. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const CE = strip(R('js/views/clauseeditor.js')), H = R('index.html');
const fn = name => { const i = CE.indexOf('function ' + name + '('); assert.ok(i >= 0, name); return CE.slice(i, CE.indexOf('\n}', i) + 2); };

test('f1218 (1) the bar edge on edge with the sheet', () => {
  const b = fn('ceTabBarPlace');
  /* RE-POINTED 25 Nov 2026 (f1229, owner: "just be a white bar across the top of the page"): the bar is no longer the
     sheet's width; it spans the page, its tools centred in it */
  assert.doesNotMatch(b, /nego-doc/);
  assert.match(b, /head\.style\.width = w \+ 'px';/);
  assert.ok(H.includes('html.lg-new #clause-editor.is-tabbed .ce-barrow > :is(.ce-say, .ce-barg, .ce-exit):empty{display:none}'));
});
test('f1218 (2) the side is the Dossier panel\'s width; the track where its row is', () => {
  assert.match(fn('ceTabPaint'), /window\.igDockWidth\(\)[\s\S]*pg\.style\.setProperty\('--ce-tab-rail', Math\.round\(dw\) \+ 'px'\)[\s\S]*ceFitSplit\(\)/);
  assert.match(fn('ceFitSplit'), /if \(ceTabbed\(\)\)\{ const pg = document\.getElementById\('clause-editor'\); const dw = pg \? parseInt\(pg\.style\.getPropertyValue\('--ce-tab-rail'\), 10\) : 0;\s*if \(dw >= 300 && avail - dw >= CE_LEFT_MIN\)\{ left = avail - dw; limit = null; \} \}/);
  assert.ok(H.includes('html.lg-new #clause-editor.is-tabbed .ce-dtabs .pd-tab:first-child{padding-left:8px}'));
  assert.ok(H.includes('html.lg-new #clause-editor.is-tabbed .ce-tabtop{padding-top:12px}'));
});
