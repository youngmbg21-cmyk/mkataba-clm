/* f433 — INSIGHTS FITS THE SCREEN: THE SHARED GRAMMAR (owner-picked "Fit to Screen", 29 Sep 2026)
   The owner asked for every Insights page to fit one screen, with the cards in a
   row the same height and no empty band. Five tabs share ONE grammar (index.html,
   `.igx-*`), so the figure strip, the cards and the fallback read the same
   everywhere. This pins the grammar and that every tab's scroller wears it; the
   per-tab layouts are f434–f438, and insights-fit-verify measures the real page. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const HTML = read('index.html');
const IG = read('js/views/intelligence.js');

/* The region between the block's heading and the next block — pin the region,
   not a byte count. */
function block() {
  const a = HTML.indexOf('INSIGHTS FITS THE SCREEN');
  assert.ok(a > 0, 'the grammar block is in the stylesheet');
  const b = HTML.indexOf('INSIGHTS, NEGOTIATION FRICTION: THE CLAUSE LEDGER', a);
  assert.ok(b > a, 'the block ends where the ledger styles begin');
  const end = HTML.lastIndexOf('/*', b);   // the next block's own comment opens here
  return HTML.slice(a, end).replace(/\/\*[\s\S]*?\*\//g, '');
}

test('1. the grid is exactly the scroller\'s height, with a floor so a short window scrolls instead of squeezing', () => {
  const css = block();
  assert.match(css, /\.igx-fit\{[^}]*height:100%/);
  assert.match(css, /\.igx-fit\{[^}]*min-height:\d+px/);
  assert.match(css, /\.igx-fit\{[^}]*grid-template-rows:var\(--igx-rows/);
});

test('2. cards in a row share one height and a long list scrolls inside its card', () => {
  const css = block();
  assert.match(css, /\.igx-row\{[^}]*display:grid/);
  assert.match(css, /\.igx-row\{[^}]*grid-template-columns:var\(--igx-cols/);
  assert.match(css, /\.igx-card\{[^}]*min-height:0/);
  assert.match(css, /\.igx-scroll\{[^}]*overflow:auto/);
  assert.match(css, /\.igx-fill\{[^}]*flex:1 1 auto/);
});

test('3. ONE figure tile for every tab, its tones on the figure only', () => {
  const css = block();
  for (const k of ['.igx-figs{', '.igx-fig{', '.igx-fig-t{', '.igx-fig-n{', '.igx-fig-s{']) assert.ok(css.includes(k), k);
  assert.match(css, /\.igx-fig \.igx-warn\{color:var\(--st-amber-fg\)\}/);
  assert.match(css, /\.igx-fig \.igx-bad\{color:var\(--st-ruby-fg\)\}/);
  assert.match(css, /\.igx-fig \.igx-good\{color:var\(--st-green-fg\)\}/);
  // the hero tile wears the BRAND's own hero, so a brand setting still reaches it
  assert.match(css, /\.igx-fig\.is-hero\{background:var\(--brand-hero,/);
  assert.match(css, /\.igx-fig\.is-hero [^{]*\{color:var\(--brand-hero-sub,/);
});

test('4. below 1080px the page becomes a plain scrolling column', () => {
  const css = block();
  const m = css.match(/@media \(max-width:1079px\)\{([\s\S]*)\}\s*$/);
  assert.ok(m, 'the narrow-window fallback is in the block');
  assert.match(m[1], /\.igx-fit\{height:auto/);
  assert.match(m[1], /\.igx-row\{grid-template-columns:minmax\(0,1fr\)\}/);
  assert.match(m[1], /\.igx-scroll\{overflow:visible\}/);
});

test('5. nothing in the grammar wins by !important — cascade fights are settled by scope', () => {
  assert.doesNotMatch(block(), /!important/);
});

test('6. every tab but Explorer scrolls in the same host, each keeping its own id', () => {
  for (const id of ['ig-frame', 'ig-friction', 'ig-oblig', 'ig-exp-body', 'ig-pt-body']) {
    const re = new RegExp(`<div id="${id}" class="[^"]*\\bigx-host\\b[^"]*">`);
    assert.match(IG, re, id + ' wears .igx-host');
  }
});
