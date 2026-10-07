/* f549 — THE BOARD CHART STANDARD, INSTRUMENT (work order O, part 4, 7 Oct 2026)
   (1) every card drawer takes its width from the card and its height from the
       step; none keeps the fixed 1000 (O-22).
   (2) the steps: board 196, opened 42% of the window between 280 and 380,
       full the window less 230 (O-22).
   (3) the series colours are the checked sets; the first follows the brand (O-24).
   (4) Instrument marks: three gridlines on the board, thin bars, labels on the
       biggest and the latest, a part-month hatched and said (O-23).
   (5) opened: the same numbers as a table, each row a door; full screen; a
       long list is cut and the cut said (O-25).
   (6) every new word is in both books. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const SRC = fs.readFileSync(path.join(__dirname, '..', 'js', 'views', 'homeboard.js'), 'utf8');
const I18N = fs.readFileSync(path.join(__dirname, '..', 'js', 'i18n.js'), 'utf8');
const inBoth = k => (I18N.match(new RegExp('\\n    ' + k + ': ', 'g')) || []).length === 2;
const code = SRC.replace(/\/\*[\s\S]*?\*\//g, '');
function region(name){
  const at = code.indexOf('function ' + name + '(');
  assert.ok(at > -1, 'no function ' + name);
  const open = code.indexOf('{', code.indexOf(')', at));
  let d = 0;
  for (let i = open; i < code.length; i++){ if (code[i] === '{') d++; else if (code[i] === '}' && !--d) return code.slice(at, i + 1); }
  throw new Error('unbalanced ' + name);
}

test('f549 (1) no card drawer keeps the fixed 1000', () => {
  for (const f of ['hbBlocksSvg', 'hbTimelineSvg', 'hbBubblesSvg', 'hbColsSvg', 'hbLiveSvg', 'hbStackSvg', 'hbHeatSvg', 'hbCompareSvg'])
    assert.doesNotMatch(region(f), /\bW = 1000\b/, f);
  assert.match(region('hbRingSvg'), /_hbFit \? _hbFit\.w/, 'the ring takes the card too');
  assert.match(region('hbChartHtml'), /data-hb-fit=/, 'a fitted chart says so');
  assert.match(region('hbPaintBoard'), /hbFitMeasure\(\)/, 'measured after the paint');
});

test('f549 (2) the three steps', () => {
  const vm = require('node:vm');
  const ctx = { window: { innerHeight: 900 } };
  vm.runInNewContext(region('hbStepH').replace('function hbStepH', 'HB_STEP_H = { board: 196 }; this.hbStepH = function'), ctx);
  assert.equal(ctx.hbStepH('board'), 196);
  assert.equal(ctx.hbStepH('open'), 378);
  assert.equal(ctx.hbStepH('full'), 670);
  ctx.window.innerHeight = 500; assert.equal(ctx.hbStepH('open'), 280);
  ctx.window.innerHeight = 1200; assert.equal(ctx.hbStepH('open'), 380);
});

test('f549 (3) the checked series colours', () => {
  assert.match(SRC, /HB_HUES_LIGHT = \['#2F5FC4', '#1A9C8A', '#B87A0F', '#9A5CC8'/);
  assert.match(SRC, /HB_HUES_DARK = \['#4F82E6', '#1C9E8B', '#C08518', '#9E68D2'/);
  assert.match(region('hbHueOf'), /hmStageTone/, 'status colours never move');
  assert.match(region('hbHues'), /data-brand/, 'the first follows the brand');
});

test('f549 (4) the Instrument marks', () => {
  const cols = region('hbColsSvg');
  assert.match(cols, /hbGridN\(\)/);
  assert.match(region('hbGridN'), /'board' \? 3 : 4/);
  assert.match(cols, /0\.62/, 'about 62% of the slot');
  assert.match(cols, /valShown\(i\)/, 'labels pick their moments');
  assert.match(cols, /url\(#hb-hatch\)/, 'a part-month is hatched');
  assert.match(cols, /hb_so_far/, 'and says so');
  assert.match(region('hbStackSvg'), /_hbFit \? 2 : 1/, 'stacked pieces part by 2px');
});

test('f549 (5) opened, full screen, and the cut said', () => {
  const html = region('hbChartHtml');
  assert.match(html, /hbChartTableHtml\(R\.body\)/);
  assert.match(html, /data-hb-full/);
  assert.match(region('hbChartTableHtml'), /data-hb-dig="\$\{_hbE\(r\.dig\)\}"/, 'each row the same door');
  const heat = region('hbHeatSvg');
  assert.match(heat, /hb_more_rows/);
  assert.match(heat, /gridAll\.flat\(\)/, 'counting is never capped, only drawing');
});

test('f549 (6) every new word is in both books', () => {
  for (const k of ['hb_so_far', 'hb_show_table', 'hb_show_chart', 'hb_full_screen', 'hb_full_back', 'hb_more_rows', 'hb_more_rows_full', 'hb_tab_what', 'hb_tab_count'])
    assert.ok(inBoth(k), k);
});
