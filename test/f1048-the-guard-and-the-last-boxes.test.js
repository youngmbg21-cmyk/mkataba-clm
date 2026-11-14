'use strict';
/* f1048 — THE FLASH SURVEY'S LAST ROUND (owner, 14 Nov 2026: "a plan where I say go and you finish all the jobs").
   The measure's third run still found words lost where a box is drawn by more than one painter (the Calendar's,
   Settings'), and two lists thrown back to their tops when a row low down was pressed (the Handbook's chapters, Our
   paper's standards). One watcher puts words back whatever redrew the box; one helper keeps a list's place but not
   the pane beside it. The browser half is test/chromium/nothing-is-thrown-away-verify.js (the guard).
   Source-sliced where it pins code, and run in jsdom where it pins behaviour. */
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const raw = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const read = f => strip(raw(f));
const region = (src, start, len = 4000) => { const i = src.indexOf(start); assert.ok(i >= 0, 'missing: ' + start); return src.slice(i, i + len); };

/* components.js's draft homes, the watcher and keepScrollIn, run in a small page of their own */
function stage(html){
  const dom = new JSDOM(`<!doctype html><body>${html}</body>`, { runScripts: 'outside-only' });
  const w = dom.window; let frames = [];
  w.requestAnimationFrame = f => { frames.push(f); return frames.length; };
  w.eval(`window.state = {};`);
  const src = raw('js/components.js');
  const a = src.indexOf('/* ============================================================\n   ONE HOME FOR A HALF-TYPED QUESTION');
  const b = src.indexOf("Object.assign(window, { jamboDraft,", a);
  const end = src.indexOf('});', b) + 3;
  assert.ok(a > 0 && b > a, 'the drafts block is found');
  w.eval(src.slice(a, end));
  const flush = async () => { await new Promise(r => setTimeout(r, 0)); const f = frames; frames = []; f.forEach(fn => fn()); };
  return { w, d: w.document, flush };
}

test('f1048 (1) the known boxes are named in ONE table, and the house picker is not one of them', () => {
  const s = read('js/components.js');
  const t = region(s, 'var BOX_DRAFT_SEATS', 160);
  assert.doesNotMatch(s, /^(const|let) BOX_DRAFT_SEATS/m, 'loaded twice into one test world (f830): never a const');
  for (const id of ['jl-q', 'st-jb-q', 'cal-plan-in']) assert.ok(t.includes(`'${id}'`), id);
  assert.ok(!t.includes('jh-one'), 'the contract picker writes its own words back: not kept');
});

test('f1048 (2) words typed into a box redrawn EMPTY come back, by the one watcher', async () => {
  const { w, d, flush } = stage('<div id="host"><textarea id="cal-plan-in"></textarea></div>');
  const box = d.getElementById('cal-plan-in'); box.value = 'plan my week'; box.dispatchEvent(new w.Event('input', { bubbles: true }));
  d.getElementById('host').innerHTML = '<textarea id="cal-plan-in"></textarea>';   /* a painter draws it again, empty */
  await flush();
  assert.equal(d.getElementById('cal-plan-in').value, 'plan my week');
});

test('f1048 (3) a box the asking path emptied stays empty', async () => {
  const { w, d, flush } = stage('<div id="host"><textarea id="st-jb-q"></textarea></div>');
  const box = d.getElementById('st-jb-q'); box.value = 'who signs'; box.dispatchEvent(new w.Event('input', { bubbles: true }));
  box.value = ''; w.boxDraftClear('settings');                                       /* the ask: box and home emptied together */
  d.getElementById('host').innerHTML = '<textarea id="st-jb-q"></textarea>';
  await flush();
  assert.equal(d.getElementById('st-jb-q').value, '');
});

test('f1048 (4) words the reader deleted stay deleted, and a box with words is never overwritten', async () => {
  const { w, d, flush } = stage('<div id="host"><textarea id="jl-q"></textarea></div>');
  const box = d.getElementById('jl-q');
  box.value = 'abc'; box.dispatchEvent(new w.Event('input', { bubbles: true }));
  box.value = ''; box.dispatchEvent(new w.Event('input', { bubbles: true }));
  d.getElementById('host').innerHTML = '<textarea id="jl-q"></textarea>';
  await flush();
  assert.equal(d.getElementById('jl-q').value, '', 'deleted by the reader');
  box.value = 'xyz';
  d.getElementById('host').innerHTML = '<textarea id="jl-q">put by a door</textarea>';
  w.boxDraftSet('list', 'stale');
  await flush();
  assert.equal(d.getElementById('jl-q').value, 'put by a door', 'never over words a painter or a door put there');
});

test('f1048 (5) Jambo\'s box is the one home\'s, through the same watcher', async () => {
  const { w, d, flush } = stage('<div id="host"><textarea id="igd-input"></textarea></div>');
  const box = d.getElementById('igd-input'); box.value = 'renewals'; box.dispatchEvent(new w.Event('input', { bubbles: true }));
  assert.equal(w.jamboDraft(), 'renewals');
  d.getElementById('host').innerHTML = '<textarea id="igd-input"></textarea>';
  await flush();
  assert.equal(d.getElementById('igd-input').value, 'renewals');
});

test('f1048 (6) the Calendar\'s ask empties its home with its box', () => {
  const c = read('js/views/calendar.js');
  assert.match(region(c, 'function calWireOwn', 1600), /inp\.value='';\s*if\(typeof window\.boxDraftClear==='function'\) boxDraftClear\('calendar'\); calBoxAsk/);
});

test('f1048 (7) keepScrollIn keeps the list, never the pane beside it', () => {
  const { w, d } = stage('<div id="h"><div class="a list">x</div><div class="pane">y</div></div>');
  Object.defineProperty(w.HTMLElement.prototype, 'scrollTop', { get(){ return this._st || 0; }, set(v){ this._st = v; }, configurable: true });
  const h = d.getElementById('h');
  h.querySelector('.list').scrollTop = 120; h.querySelector('.pane').scrollTop = 80;
  w.keepScrollIn(h, () => { h.innerHTML = '<div class="a list">x2</div><div class="pane">y2</div>'; }, '.pane');
  assert.equal(h.querySelector('.list').scrollTop, 120, 'the list keeps its place');
  assert.equal(h.querySelector('.pane').scrollTop, 0, 'what was picked starts at its top');
});

test('f1048 (8) the Handbook and Our paper keep their lists, not their reading panes', () => {
  assert.match(region(read('js/views/handbook.js'), 'function hbknRender', 600), /keepScrollIn\(host, \(\) => hbknRender\(host\), '#hbk-body, #hbk-body \*'\)/);
  assert.match(region(read('js/views/library.js'), 'function tplBookRepaint', 900), /keepScrollIn\(host, draw, '\.tpl-pf-paper, \.tpl-pf-paper \*'\)/);
});

test('f1048 (9) the guard\'s known list may only name presses the guard drives, each with a reason', () => {
  const known = JSON.parse(raw('test/thrown-away-known.json'));
  const guard = raw('test/chromium/nothing-is-thrown-away-verify.js');
  for (const [k, why] of Object.entries(known)){ if (k === '_why') continue;
    assert.ok(guard.includes(`'${k}'`), k + ' is a press the guard makes');
    assert.ok(String(why).length > 20, k + ' carries its reason'); }
});

test('f1048 (10) the measure counts a lost place only where the same list still shows', () => {
  const m = read('test/chromium/_audit/rebuild-measure.js');
  assert.match(m, /same: !!el && sigOf\(el\) === sc\.sig/);
  assert.match(m, /if \(s\.there && !s\.same\)\{ away\.push/);
});

test('f1048 (11) the scrollers AROUND the redrawn host keep their place too', () => {
  const { w, d } = stage('<div id="outer" class="sc"><div id="h"><div class="row">x</div></div></div>');
  Object.defineProperty(w.HTMLElement.prototype, 'scrollTop', { get(){ return this._st || 0; }, set(v){ this._st = v; }, configurable: true });
  const outer = d.getElementById('outer'), h = d.getElementById('h');
  outer.scrollTop = 104;
  w.keepScrollIn(h, () => { outer.scrollTop = 0; h.innerHTML = '<div class="row">y</div>'; }, '.pane');
  assert.equal(outer.scrollTop, 104, 'GitHub\'s guard: Our paper\'s list lives in a scroller above the redrawn host');
});

test('f1048 (12) a stand-in document with no listeners is left alone (a test stage of f100)', () => {
  const s = read('js/components.js');
  assert.match(region(s, 'function boxDraftWatch', 500), /typeof document\.addEventListener !== 'function'/);
});
