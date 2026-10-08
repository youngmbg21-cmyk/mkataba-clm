/* f552 — THE BOARD CHART STANDARD, THE DRAWING RULES f549 DOES NOT PIN (work order O-23/O-25, 8 Oct 2026)
   (1) text never wears a series colour: on a fitted chart the coloured
       "glow" words are put back to ink, and no card drawer paints its words
       with a series hue (hbBlocksSvg is the one known exception — BUGLOG,
       8 Oct 2026 — and is named here so it cannot hide).
   (2) a fitted chart is drawn ONCE per width: the measure redraws only when
       the card's width really moved (more than a few pixels), never inside
       its own repaint, and a window resize only on the board's page.
   (3) only a chart IN A CARD is fitted: the step is set by the two card
       builders and cleared after; outside a card the old 1000 stands and the
       svg carries no step (the shelf and packs, by the work order's scope).
   (4) Esc steps back ONE step: full screen is left before anything else on
       the board is closed.
   (5) opened is where detail is earned: Show as table and Full screen are
       offered only off the board step. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const SRC = fs.readFileSync(path.join(__dirname, '..', 'js', 'views', 'homeboard.js'), 'utf8');
const INDEX = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const code = SRC.replace(/\/\*[\s\S]*?\*\//g, '');
function region(name){
  const at = code.indexOf('function ' + name + '(');
  assert.ok(at > -1, 'no function ' + name);
  const open = code.indexOf('{', code.indexOf(')', at));
  let d = 0;
  for (let i = open; i < code.length; i++){ if (code[i] === '{') d++; else if (code[i] === '}' && !--d) return code.slice(at, i + 1); }
  throw new Error('unbalanced ' + name);
}
/* a <text …> whose own fill is a series hue (a ${…} expression, not a class) */
const HUED_TEXT = /<text\b[^>]*(?:style="fill:\$\{|\bfill="\$\{(?!HB_TILE_INK))/;
const DRAWERS = ['hbRingSvg', 'hbBlocksSvg', 'hbTimelineSvg', 'hbBubblesSvg', 'hbColsSvg', 'hbLiveSvg', 'hbStackSvg', 'hbHeatSvg', 'hbCompareSvg'];
const KNOWN_HUED = ['hbBlocksSvg'];

test('f552 (1) text never wears a series colour', () => {
  assert.match(INDEX, /\.hb-svg\[data-hb-step\] text\.hb-sv-glow\{fill:var\(--hb-ink\)\}/, 'fitted glow words are drawn in ink');
  for (const f of DRAWERS){
    const hued = HUED_TEXT.test(region(f));
    if (KNOWN_HUED.includes(f)) assert.ok(hued, `${f} is listed as a known exception — take it off the list once fixed`);
    else assert.ok(!hued, `${f} writes words in a series colour`);
  }
});

test('f552 (2) a fitted chart is drawn once per width', () => {
  const m = region('hbFitMeasure');
  assert.match(m, /if \(_hbFitBusy/, 'never re-enters its own repaint');
  assert.match(m, /Math\.abs\(w - drawn\) > \d/, 'redraws only when the width really moved');
  assert.match(m, /if \(moved\)/, 'and only then');
  assert.match(m, /_hbFitBusy = true;[\s\S]*finally \{ _hbFitBusy = false; \}/, 'the latch is raised before the repaint and always lowered');
  const wire = code.slice(code.indexOf('!window._hbFitWired'), code.indexOf('!window._hbFitWired') + 600);
  assert.match(wire, /clearTimeout\(t\); t = setTimeout\(/, 'a resize is settled before it redraws');
  assert.match(wire, /state\.view === 'dashboard'/, 'and only on the board\'s page');
});

test('f552 (3) only a chart in a card is fitted', () => {
  const sets = [...code.matchAll(/_hbFitAt = \{ key: ([^,]+), step: ([^,]+),/g)].map(x => x[1].trim() + ' ' + x[2].trim());
  assert.equal(sets.length, 2, 'two card builders set the step: ' + sets.join(' | '));
  assert.ok(sets.some(s => /'board'/.test(s)), 'a card on the board');
  assert.ok(sets.some(s => /'full' : 'open'/.test(s)), 'the opened card, or full screen');
  for (const at of code.matchAll(/_hbFitAt = \{[^}]*\};\s*([^\n]*)/g))
    assert.match(at[1], /finally \{ _hbFitAt = null; \}/, 'the step is cleared after the card is drawn');
  assert.match(region('hbFW'), /_hbFit \? _hbFit\.w : 1000/, 'outside a card the old 1000 stands');
  const html = region('hbChartHtml');
  assert.match(html, /if \(at\)\{[\s\S]*data-hb-step=/, 'only a card\'s chart carries a step');
  assert.match(html, /finally \{ _hbFit = null; \}/, 'the fitted width does not leak to the next chart');
});

test('f552 (4) Esc steps back one step: full screen first', () => {
  const k = region('hbOnKey');
  const esc = k.indexOf("e.key !== 'Escape'");
  assert.ok(esc > -1, 'Esc is handled');
  const after = k.slice(esc);
  const full = after.indexOf('if (_hbFull){ _hbFull = false;');
  const present = after.indexOf('if (_hbPresenting)');
  const board = after.indexOf('s.path = []');
  assert.ok(full > -1, 'Esc leaves full screen');
  assert.ok(full < present && full < board, 'before it leaves Present or closes the opened card');
});

test('f552 (5) detail is earned: table and full screen only once opened', () => {
  const html = region('hbChartHtml');
  assert.match(html, /if \(at\.step !== 'board' && \/data-hb-dig=\/\.test\(R\.body\)\)\{[\s\S]*data-hb-table=[\s\S]*data-hb-full/, 'offered off the board step only, and only where the chart has doors');
});
