/* f550 — THE BOARD CHART STANDARD, PINNED AS RELATIONS (work order O-26, 8 Oct 2026)
   f549 pins the numbers the work order named; this file pins what must stay
   TRUE when someone later moves a number (the rulebook: pin the relation,
   not the number). The type ladder is read through test/tokens.js.
   (1) each kind of chart text grows one way only: board < opened < full.
   (2) inside a step: axis words are never bigger than category names, and a
       value is never smaller than a category name; values are the bold ones.
   (3) whole pixels, and nothing on the board goes under the board's floor
       (the axis words are the smallest thing a chart draws).
   (4) the chart's HEIGHT comes from the step, not the width: hbStepH takes
       the step alone, and a fitted drawer asks hbFH, never a share of W.
   (5) at any ordinary window, board < opened < full, and full never runs
       past the window. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { chartStepType, chartStepRoles } = require('./tokens');

const SRC = fs.readFileSync(path.join(__dirname, '..', 'js', 'views', 'homeboard.js'), 'utf8');
const code = SRC.replace(/\/\*[\s\S]*?\*\//g, '');
function region(name){
  const at = code.indexOf('function ' + name + '(');
  assert.ok(at > -1, 'no function ' + name);
  const open = code.indexOf('{', code.indexOf(')', at));
  let d = 0;
  for (let i = open; i < code.length; i++){ if (code[i] === '{') d++; else if (code[i] === '}' && !--d) return code.slice(at, i + 1); }
  throw new Error('unbalanced ' + name);
}
const T = chartStepType();
const STEPS = ['board', 'open', 'full'];
const ROLES = ['ax', 'cat', 'val'];

test('f550 (0) the ladder is read, not guessed', () => {
  for (const s of STEPS) for (const r of ROLES) assert.ok(Number.isFinite(T[s][r]), `${s}.${r} read from index.html`);
  const roles = chartStepRoles();
  assert.equal(roles['hb-sv-mute'] && roles['hb-sv-mute'].role, 'ax', 'muted text is the axis words');
  assert.equal(roles['hb-sv-ink2'] && roles['hb-sv-ink2'].role, 'cat', 'second ink is the category names');
  assert.equal(roles['hb-sv-ink'] && roles['hb-sv-ink'].role, 'val', 'main ink is the values');
});

test('f550 (1) each kind of text grows as you dig: board < opened < full', () => {
  for (const r of ROLES){
    assert.ok(T.board[r] < T.open[r], `${r}: board ${T.board[r]} < opened ${T.open[r]}`);
    assert.ok(T.open[r] < T.full[r], `${r}: opened ${T.open[r]} < full ${T.full[r]}`);
  }
});

test('f550 (2) inside a step: axis ≤ category ≤ value, and values are the bold ones', () => {
  for (const s of STEPS){
    assert.ok(T[s].ax <= T[s].cat, `${s}: axis ${T[s].ax} ≤ category ${T[s].cat}`);
    assert.ok(T[s].cat <= T[s].val, `${s}: category ${T[s].cat} ≤ value ${T[s].val}`);
  }
  const roles = chartStepRoles();
  assert.ok(roles['hb-sv-ink'].weight > roles['hb-sv-ink2'].weight, 'a value outweighs a category name');
  assert.ok(roles['hb-sv-ink2'].weight >= roles['hb-sv-mute'].weight, 'a category name is never lighter than the axis');
});

test('f550 (3) whole pixels, and the axis words are the board\'s floor', () => {
  for (const s of STEPS) for (const r of ROLES) assert.equal(T[s][r] % 1, 0, `${s}.${r} is a whole pixel`);
  const floor = Math.min(...STEPS.flatMap(s => ROLES.map(r => T[s][r])));
  assert.equal(floor, T.board.ax, 'nothing a chart writes is smaller than the board\'s axis words');
  assert.ok(floor >= 11, 'and that floor is readable (11px or more)');
});

test('f550 (4) the height comes from the step, never from the width', () => {
  const stepH = region('hbStepH');
  assert.match(stepH, /^function hbStepH\(step\)/, 'hbStepH takes the step and nothing else');
  assert.doesNotMatch(stepH, /hbFW|_hbFit|\.w\b|clientWidth|innerWidth/, 'hbStepH never reads a width');
  assert.match(region('hbFH'), /hbStepH\(_hbFit\.step\)/, 'a fitted chart asks its step');
  /* every drawer that sizes by the step asks hbFH; none makes H a share of W */
  for (const f of ['hbBlocksSvg', 'hbBubblesSvg', 'hbColsSvg', 'hbLiveSvg', 'hbStackSvg', 'hbCompareSvg']){
    const r = region(f);
    assert.match(r, /\bH = hbFH\(/, `${f} takes its height from the step`);
    assert.doesNotMatch(r, /\bH = [^,;]*\bW\b/, `${f} never makes the height a share of the width`);
  }
  /* the heat table grows by rows, so it is held to the step by cutting rows */
  assert.match(region('hbHeatSvg'), /hbStepH\(_hbFit\.step\)/, 'the heat table cuts its rows to the step');
});

test('f550 (5) at any ordinary window: board < opened < full ≤ the window', () => {
  const ctx = { window: { innerHeight: 900 } };
  vm.runInNewContext('HB_STEP_H = { board: 196 }; this.hbStepH = ' + region('hbStepH').replace('function hbStepH', 'function'), ctx);
  for (const vh of [640, 720, 800, 900, 1080, 1440]){
    ctx.window.innerHeight = vh;
    const b = ctx.hbStepH('board'), o = ctx.hbStepH('open'), f = ctx.hbStepH('full');
    assert.ok(b < o, `${vh}: board ${b} < opened ${o}`);
    assert.ok(o < f, `${vh}: opened ${o} < full ${f}`);
    assert.ok(f < vh, `${vh}: full ${f} leaves room for the card's head`);
    assert.ok(o <= vh * 0.5, `${vh}: opened ${o} is at most half the window`);
  }
});
