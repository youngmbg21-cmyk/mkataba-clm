'use strict';
/* f1133 — THE BOARD NEVER SAYS A NUMBER IT DOES NOT HOLD (21 Nov 2026; the Board check's step 1d failed now and then on
   GitHub with the four figures reading 0,0,0,0 — once 29,0,0,0 — while the book said 10,1,1,1).
   Three causes, each measured in a browser at the parent (frames where the figures' words differed from the book):
   (1) on a server, the thirty demo contracts state is born with stayed in memory until the real book loaded, so a
       Board painted meanwhile counted 29 live contracts that do not exist;
   (2) the book was emptied and then filled page by page, so a paint between two pages counted an empty or half book;
   (3) the count-up wrote '0', '3', '7'… into the figure's own words for most of a second, so the page SAID 0.
   Now: no demo book on a server; the book is put in place whole; the count is painted OVER the number (data-jov-count),
   whose words stay true — and a redraw writing the same number keeps the count going, a new number stops it.
   AT THE PARENT every test here fails. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { JSDOM } = require('jsdom');
const { buildWorld } = require('./world');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const noComments = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const sliceFn = (src, head) => { const i = src.indexOf(head); assert.ok(i >= 0, head + ' exists'); const j = src.indexOf('\n}\n', i); return src.slice(i, j + 3); };

test('f1133 (1) on a server the book starts empty: the demo book is never counted', () => {
  const app = noComments(read('js/app.js'));
  const i = app.indexOf("if(st && st.mode==='api'){"); assert.ok(i > 0, 'the server branch of boot');
  const block = app.slice(i, app.indexOf('hydrate();', i));
  const empty = block.indexOf('state.contracts=[];');
  assert.ok(empty > 0, 'the server branch empties the book state was born with');
  assert.ok(empty < block.indexOf("renderAuth('login')") && empty < block.indexOf('loadBootstrap()'), 'before sign-in, before the book loads');
});

test('f1133 (2) the book arrives whole: never empty, never half, while its pages load', async () => {
  const OLD = [{ id: 'old' }];
  const seen = [];
  const ctx = vm.createContext({
    state: { contracts: OLD }, REMOTE: null, uid: 0, rlUid: 0, window: {}, LS: { ui: 'ui' }, lsGet: () => ({}),
    migrateContract: r => Object.assign({}, r), Infinity, Number,
    api: async p => {
      if (p === 'bootstrap') return { me: {}, users: [] };
      seen.push(ctx.state.contracts);
      const m = /offset=(\d+)/.exec(p); const off = Number(m && m[1]);
      return off === 0 ? { total: 3, rows: [{ id: 'a' }, { id: 'b' }] } : { total: 3, rows: [{ id: 'c' }] };
    },
  });
  vm.runInContext(sliceFn(read('js/api.js'), 'async function loadBootstrap(){') + '\nthis.loadBootstrap = loadBootstrap;', ctx);
  await ctx.loadBootstrap();
  assert.equal(seen.length, 2, 'two pages asked for');
  seen.forEach((b, k) => assert.equal(b, OLD, 'while page ' + (k + 1) + ' loads, the book in hand is the one before, whole'));
  assert.equal(ctx.state.contracts.map(c => c.id).join(','), 'a,b,c', 'then the whole book, in one step');
});

function world(){
  const W = buildWorld().win;
  W.frames = []; W.timers = [];
  W.requestAnimationFrame = fn => { W.frames.push(fn); return W.frames.length; };
  W.setTimeout = fn => { W.timers.push(fn); return W.timers.length; };
  return W;
}
const runFrames = (W, at) => { const fs2 = W.frames.splice(0); fs2.forEach(f => f(at)); };

test('f1133 (3) a count-up is painted over the number: its words stay true throughout', () => {
  const W = world(); assert.equal(typeof W.jovCountOver, 'function', 'one count-up for every number that counts');
  const b = W.document.createElement('span'); b.textContent = '10'; W.document.body.appendChild(b);
  const t0 = W.performance.now();
  W.jovCountOver(b);
  assert.equal(b.textContent, '10', 'the words say the true number from the first moment');
  assert.equal(b.getAttribute('data-jov-count'), '0', 'the count starts from nothing, painted over it');
  runFrames(W, t0 + 160 + 350);
  assert.equal(b.textContent, '10', 'and still say it mid-count');
  assert.ok(Number(b.getAttribute('data-jov-count')) > 0 && Number(b.getAttribute('data-jov-count')) < 10, 'the painted count climbs');
  W.timers.splice(0).forEach(f => f());
  assert.ok(!b.hasAttribute('data-jov-count'), 'the timer takes the paint away even when frames stop');
  /* the panel's tiles (jovCountUp) take the same road */
  const el = W.document.createElement('div'); el.innerHTML = '<div class="jov5-g"><b>12</b></div>'; W.document.body.appendChild(el);
  W.jovPlay(el);
  assert.equal(el.querySelector('b').textContent, '12', "a panel tile's number keeps its words too");
  assert.equal(el.querySelector('b').getAttribute('data-jov-count'), '0');
  /* the Board's figures (hbArrivePage) ask the same helper and write no words of their own */
  const arrive = noComments(sliceFn(read('js/views/homeboard.js'), 'function hbArrivePage(){'));
  assert.match(arrive, /jovCountOver/, 'the Board counts through jovCountOver');
  assert.doesNotMatch(arrive, /textContent\s*=/, 'and never writes a number into a figure');
  const sheet = read('index.html');
  assert.match(sheet, /\[data-jov-count\]\{[^}]*-webkit-text-fill-color:transparent/, 'the true words are hidden while counting');
  assert.match(sheet, /\[data-jov-count\]::after\{content:attr\(data-jov-count\)/, 'and the count painted in their place');
});

test('f1133 (4) a redraw writing the same number keeps the count; a new number stops it', () => {
  const hb = read('js/views/homeboard.js');
  const morph = sliceFn(hb, 'function hbMorph(host, html){') + sliceFn(hb, 'function hbMorphSameShell(a, b){') + sliceFn(hb, 'function hbMorphKids(cur, next){');
  const W = world();
  const dom = new JSDOM('<!doctype html><body></body>', { runScripts: 'outside-only' });
  dom.window.eval(morph + '\nwindow.hbMorph = hbMorph;');
  const D = dom.window.document;
  const host = D.createElement('div'); D.body.appendChild(host);
  const html = n => `<div class="hb-fig"><span class="hb-fig-n">${n}</span></div>`;
  host.innerHTML = html(10);
  const span = host.querySelector('.hb-fig-n');
  span.setAttribute('data-jov-count', '4');
  dom.window.hbMorph(host, html(10));
  assert.equal(host.querySelector('.hb-fig-n'), span, 'the same number: the counting figure is kept');
  assert.equal(span.getAttribute('data-jov-count'), '4', 'and its count goes on');
  dom.window.hbMorph(host, html(11));
  assert.equal(host.querySelector('.hb-fig-n').textContent, '11', 'a new number is written at once');
  /* the count sees its number changed and stops */
  const b = W.document.createElement('span'); b.textContent = '10'; W.document.body.appendChild(b);
  W.jovCountOver(b); b.textContent = '11';
  runFrames(W, W.performance.now() + 400);
  assert.ok(!b.hasAttribute('data-jov-count'), 'a count whose number was rewritten stops, the new number shows');
});
