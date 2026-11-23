'use strict';
/* f1186 — A ROW POINTED AT OR CHOSEN IS LIGHT GREEN, NEVER GREY (owner, 23 Nov 2026: "review across the platform that
   hovering or highlighting rows are not in grey but should be in light green like in the discovery page. And make it a
   rule for any new pages as well").

   (1) ONE HOME: two tokens on :root — --row-hover (the accent ink 4% over white) and --row-chosen (6%, Discover's own
       chosen row) — exported to docs/design/tokens.json.
   (2) THE RULE FOR EVERY PAGE, NEW ONES TOO: no style rule in HaTi's sheet paints a list row's hover or chosen state
       grey (surface-2, nav-well, neutral 50/100/200, accent-50, the board's line tint, st-gray). A row reads
       var(--row-hover) / var(--row-chosen). The few grey rows left are NOT LIST ROWS (navigation, drop-down menus,
       buttons inside a row, the Redlines change and risk cards) and are named in ROW_GREY_KNOWN, which only shrinks.
   At the parent every part fails (the tokens are new; about seventy rows were grey). */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const HTML = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

/* not list rows: each with why. ONLY SHRINKS. */
const ROW_GREY_KNOWN = [
  '.nav-item:hover',                                        // the old left navigation, not a list
  '#side-nav .nav-item:hover',                              // the same navigation
  '#ws-tabrow-end .ws-th-door.is-on',                       // a tab button on the paper's line
  '.hati-selmenu-row:hover',                                // a drop-down menu's option
  '.dk-r:hover', '.dk-r-act:hover',                         // the bar's recent-pages menu
  '#ig-dock #pd-og .pd-og-dd-row:hover',                    // a drop-down menu's option
  '.rk-row:not(.is-none):not(.is-gone)):is(:hover',         // Redlines risk card, lit with its clause on the paper
  '.rk-row):hover) .rk-row.is-linked:not(:hover) .rk-why',  // the same card's linked shade
  '.pd-acts-pop .pd-acts-r:hover:not(:disabled)', '.pd-acts-pop .pd-acts-r:focus-visible', // the ⋯ actions menu
  '#clause-editor .ce-rowback:hover',                       // a button
  'html.lg-new .apn-table tr:not(.is-sel) .apn-acts .apn-ok', 'html.lg-new .ikn-table tr:not(.is-sel) .ikn-go', // buttons in a row
];
function greyRowStates(){
  let css = ''; const re = /<style[^>]*>([\s\S]*?)<\/style>/g; let m;
  while ((m = re.exec(HTML))) css += m[1] + '\n';
  css = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const ROWSEL = /(\btr\b|row|-r\b|-tr\b|-li\b|item\b|-lr\b|-pick\b|-g\b)/i;
  const STATE = /(:hover|\.is-sel\b|\.is-chosen\b|\.is-picked\b|\.is-on\b|aria-selected="true"|:focus-visible)/;
  const GREY = /background(-color)?\s*:\s*(var\(--(surface-2|nav-well|color-neutral-(50|100|200)|color-accent-50|st-gray-bg)\b[^;}]*|rgba\(var\(--hb-ln\)[^;}]*|color-mix\([^;}]*(surface-2|neutral-1|accent-50)[^;}]*)/;
  const out = new Set(); const rr = /([^{}]+)\{([^{}]*)\}/g; let r;
  while ((r = rr.exec(css))){
    if (!GREY.test(r[2])) continue;
    r[1].split(',').forEach(one => { const o = one.trim().replace(/\s+/g, ' ');
      if (STATE.test(o) && ROWSEL.test(o.replace(/:hover|:focus-visible/g, ''))) out.add(o); });
  }
  return [...out];
}

test('f1186 (1) the two light greens have one home, exported', () => {
  assert.match(HTML, /--row-hover:color-mix\(in srgb,var\(--accent-ink\) 4%,var\(--color-surface\)\)/);
  assert.match(HTML, /--row-chosen:color-mix\(in srgb,var\(--accent-ink\) 6%,var\(--color-surface\)\)/);
  const T = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'docs/design/tokens.json'), 'utf8')).tokens;
  assert.ok(T['--row-hover'] && T['--row-chosen'], 'exported');
  assert.match(HTML, /\.dsn-page \.dsn-table tr\.dsn-row\.is-sel>td\{background:var\(--row-chosen\)\}/, 'Discover reads the same green');
});
test('f1186 (2) no list row turns grey when pointed at or chosen — on any page, new ones too', () => {
  const grey = greyRowStates().filter(s => !ROW_GREY_KNOWN.includes(s));
  assert.deepEqual(grey, [], 'these rows turn grey — use var(--row-hover) / var(--row-chosen) (or, if it is not a list row, name it in ROW_GREY_KNOWN with why)');
});
test('f1186 (3) the known list only shrinks: every name on it is still in the sheet', () => {
  const now = greyRowStates();
  const gone = ROW_GREY_KNOWN.filter(s => !now.includes(s));
  assert.deepEqual(gone, [], 'no longer grey — take it off ROW_GREY_KNOWN');
});
test('f1186 (4) the rows the owner looks at most read the tokens', () => {
  for (const re of [/\.apn-page #ap-scroll \.apn-table tbody tr\.is-sel td\{background:var\(--row-chosen\)\}/,
    /\.cun-page \.cun-table tbody tr\.is-sel td\{background:var\(--row-chosen\)\}/,
    /\.ctf-row:hover\{background:var\(--row-hover\)\}/,
    /\.obd-row\.is-ls:hover td\{background:var\(--row-hover\)\}/,
    /\.hbkn-row:hover td,html\.lg-new \.hbkn-row\.is-on td\{background:var\(--row-chosen\)\}/,
    /\.ins-lt tbody tr\[data-ins-row\]:hover td\{background:var\(--row-hover\);\}/]) assert.match(HTML, re);
});
