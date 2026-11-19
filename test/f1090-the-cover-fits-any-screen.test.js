'use strict';
/* f1090 — THE COVER FITS ANY SCREEN, AND CARRIES A DOOR TO CONTRACTS (owner picked "A4 Sheet", 16 Nov 2026: "The paper
   should look proportional … Everything should fit on screen looking normal and not stretched. Also, add a door to the
   contracts page … since Jambo is not there").
   (1) THE PAPER KEEPS A REAL PAGE'S SHAPE: as tall as the window allows (never a fixed 560px), A4's proportion, its
       words sized off its own height (container units), so it never runs off the foot of a short window.
   (2) THE RIGHT SIDE IS ONE MEASURED COLUMN: a set width, a headline and spacing that step down on a short window,
       and a scroller inside only if it must — nothing cut off.
   (3) THE DOOR: a green link in the Cover's top row goes to the Contracts list (setView('register')), which keeps the
       way back to this paper; the Handbook says so in both books. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const CSS = strip(read('index.html'));
const rule = sel => { const i = CSS.indexOf(sel + '{'); assert.ok(i >= 0, sel + ' is styled'); return CSS.slice(i, CSS.indexOf('}', i)); };

test('f1090 (1) the paper keeps a real page\'s shape and fits the window', () => {
  const p = rule('html.lg-new .cv-paper');
  assert.match(p, /aspect-ratio:1 \/ 1\.414/, 'A4\'s shape');
  assert.match(p, /height:min\(calc\(100vh - /, 'as tall as the window allows');
  assert.match(p, /container-type:size/, 'its words read its own size');
  assert.doesNotMatch(p, /min-height:\s*560px/, 'never a fixed height that runs off a short window');
  for (const sel of ['html.lg-new .cv-t', 'html.lg-new .cv-sum', 'html.lg-new .cv-foot'])
    assert.match(rule(sel), /cqh/, sel + ' is sized off the paper');
});

test('f1090 (2) the right side is one measured column that steps down', () => {
  const r = rule('html.lg-new .cv-r');
  assert.match(r, /max-width:\d+px/, 'a set width, never stretched');
  assert.match(r, /overflow-y:auto/, 'a scroller inside if it must, never cut');
  assert.match(rule('html.lg-new .cv-h'), /font-size:clamp\(/, 'the headline steps down');
  assert.match(rule('html.lg-new .cv-go .cv-open'), /height:clamp\(/, 'and the button');
});

test('f1090 (3) the Cover carries a door to Contracts, said in the Handbook', () => {
  const PD = read('js/paperdesk.js');
  const right = PD.slice(PD.indexOf('function pdCoverRightHtml('), PD.indexOf('function pdCoverHtml('));
  assert.match(right, /class="cv-lnk cv-door" data-cv-go="contracts"/, 'a green link in the top row');
  assert.match(PD, /if \(k === 'contracts'\)\{ if \(typeof deskKeyNow !== 'function' \|\| deskKeyNow\(\) !== 'home:contracts'\) \{ if \(typeof setView === 'function'\) setView\('register'\); \}\s*pdMidClose\(\); return; \}/, 'it opens the Contracts list (or uncovers it, f1099)');
  assert.match(rule('html.lg-new .cv-top .cv-door'), /margin-left:auto/, 'at the top right');
  const HB = read('js/handbook.js');
  assert.match(HB, /\{ui:nav_contracts\} at its top right goes to the Contracts list/);
  assert.match(HB, /\{ui:nav_contracts\} uppe till höger går till Avtalslistan/);
});
