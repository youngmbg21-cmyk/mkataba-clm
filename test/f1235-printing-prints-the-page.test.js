'use strict';
/* f1235 — PRINTING PRINTS THE PAGE (owner, 25 Nov 2026, a print preview of Read down showing the phone's Home: "Review
   the printing bug across hati and that it is printing the right pages").
   (1) THE PHONE IS A SCREEN: a printed page is narrower than 767px, so the bare query switched the phone shell on while
       printing (body.m-on, #m-root printed). Every 767px query is `screen and` now, and mPhone asks M_QUERY.
   (2) A PAGE PRINTS IN PLACE: beforeprint marks the page beside Jambo's panel (printPageOf → printPageDown), its way up
       and its scrollers (printInPlaceOn); the print sheet draws only those, full width, scrollers opened whole, controls
       left on screen; afterprint takes the marks off. A contract's paper is still copied into #print-root.
   Red at the parent: the bare query, no in-place print (Read down printed beside the panel, cut off). */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const H = R('index.html'), APP = R('js/app.js'), M = R('js/mobile.js');

test('f1235 (1) every phone query is for a screen only, so printing never turns the phone on', () => {
  assert.match(M, /const M_QUERY = 'screen and \(max-width:767px\)';/);
  for (const f of ['index.html', 'js/mobile.js', 'js/mobile-copilot.js', 'js/mobile-portal.js', 'js/views/portal.js', 'js/views/reads.js'])
    assert.doesNotMatch(R(f), /@media \(max-width:\s?767px\)|matchMedia\('\(max-width:\s?767px\)'\)/, f);
});

test('f1235 (2) a page prints in place, its panel and its controls left on screen', () => {
  for (const n of ['printPageOf', 'printPageDown', 'printInPlaceOn', 'printInPlaceOff', 'printPaperSurface']) assert.match(APP, new RegExp('function ' + n + '\\('), n);
  assert.match(APP, /if \(!printPaperSurface\(\) && printInPlaceOn\(\)\) return;/, 'beforeprint: a page prints itself, a paper is copied');
  assert.match(APP, /try\{ printInPlaceOff\(\); \}catch\(_\)\{\}/, 'afterprint takes the marks off');
  assert.match(APP, /const PRINT_PANELS = '#ig-dock, \.ins-panel, \.st-side, #ai-panel, \.cal-cop';/);
  assert.match(H, /body:not\(\.pr-inplace\)>\*\{display:none!important;\}/, 'the copied paper still isolates itself');
  assert.match(H, /body\.pr-inplace>\*:not\(\[data-pr-path\]\):not\(\[data-pr-page\]\)\{display:none!important;\}/);
  assert.match(H, /body\.pr-inplace \[data-pr-path\]>\*:not\(\[data-pr-path\]\):not\(\[data-pr-page\]\)\{display:none!important;\}/);
  assert.match(H, /body\.pr-inplace \[data-pr-open\]\{height:auto!important;max-height:none!important;overflow:visible!important;\}/);
  assert.match(H, /body\.pr-inplace \.wm-stage\{display:none!important;\}/);
});
