'use strict';
/* f1200 — THE WAVE ON EVERY EDIT POP-UP (owner, 24 Nov 2026: "Build it on every edit pop-up", off the drawing of three
   real pop-ups with the boxed piece of Jambo's weave across their tops, still moving).
   1 · ONE helper (lgpWaveSweep, js/components.js) puts the strip in every form.lgp it is given, once: a second sweep
       adds none, and a sheet redrawn in place gets it again. Published once.
   2 · ONE watcher on #modal-root (lgpWaveWatch) gives it to every sheet the one dialog opens, the hand-built ones too;
       the duties sheet over the page calls the helper itself.
   3 · Its look (index.html .lgp-wave): the panels' two weaves, colours and slides (wmSlideA/B, by token), behind the
       words, a strip at the top that fades out, held still for less motion.
   At the parent none of these exist, so every claim fails. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { JSDOM } = require('jsdom');
const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const fnBody = (src, name) => { const i = src.search(new RegExp('(?:async )?function ' + name + '\\(')); assert.ok(i >= 0, name); return src.slice(i, src.indexOf('\n}', i) + 2); };
const COMP = read('js/components.js'), CSS = read('index.html');

function world(){
  const dom = new JSDOM('<!doctype html><body><div id="modal-root"></div></body>');
  const w = dom.window;
  const src = ['var LGP_WAVE_HTML' + COMP.split('var LGP_WAVE_HTML')[1].split('\nvar _lgpWaveObs')[0],
    'var _lgpWaveObs = null;', fnBody(COMP, 'lgpWaveWatch'), 'this.lgpWaveSweep = lgpWaveSweep; this.lgpWaveWatch = lgpWaveWatch;'].join('\n');
  const ctx = { document: w.document, MutationObserver: w.MutationObserver, Array };
  vm.createContext(ctx); vm.runInContext(src, ctx);
  return { w, ctx };
}
const tick = () => new Promise(r => setTimeout(r, 0));

test('f1200 (1) one helper puts the strip in every sheet once, and again on a sheet redrawn in place', () => {
  const { w, ctx } = world();
  const host = w.document.createElement('div');
  host.innerHTML = '<form class="lgp"><div class="lgp-hd"></div></form><form class="lgp rv-ask"><div class="lgp-hd"></div></form><form class="other"></form>';
  assert.equal(ctx.lgpWaveSweep(host), 2, 'both edit sheets, not the other form');
  assert.equal(ctx.lgpWaveSweep(host), 0, 'a second sweep stacks none');
  const f = host.querySelector('form.lgp');
  assert.ok(f.firstElementChild.classList.contains('lgp-wave'), 'first in the sheet, so it lies behind the head');
  assert.equal(f.querySelector('.lgp-wave').getAttribute('aria-hidden'), 'true');
  assert.equal(f.querySelectorAll('.lgp-wave > b').length, 2, 'two weaves');
  const again = w.document.createElement('form'); again.className = 'lgp'; f.replaceWith(again);
  assert.equal(ctx.lgpWaveSweep(again), 1, 'the sheet itself may be handed in');
  assert.match(COMP, /Object\.assign\(window, \{ LGP_WAVE_HTML, lgpWaveSweep, lgpWaveWatch \}\)/);
});

test('f1200 (2) one watcher gives it to every sheet the dialog opens; the duties sheet over the page asks for it', async () => {
  const { w, ctx } = world();
  assert.equal(ctx.lgpWaveWatch(), true);
  const mr = w.document.getElementById('modal-root');
  mr.innerHTML = '<div role="dialog"><form class="lgp" id="a"><div class="lgp-hd"></div></form></div>';
  await tick();
  assert.equal(mr.querySelectorAll('#a > .lgp-wave').length, 1, 'opened by openModal: waved');
  const dlg = mr.querySelector('[role="dialog"]');
  dlg.innerHTML = '<form class="lgp" id="b"></form>';
  await tick();
  assert.equal(mr.querySelectorAll('#b > .lgp-wave').length, 1, 'redrawn in place (lgpRepaint, a hand-built step): waved again');
  await tick();
  assert.equal(mr.querySelectorAll('.lgp-wave').length, 1, 'its own insertion adds nothing more');
  assert.equal(ctx.lgpWaveWatch(), false, 'one watcher');
  assert.match(strip(fnBody(read('js/obligations.js'), 'openObligationForm')), /window\.lgpWaveSweep\(ofLayer\)/);
});

test('f1200 (3) the look: the panels\' weaves by token, behind the words, a fading strip, still for less motion', () => {
  const i = CSS.indexOf('.lgp-wave{'); assert.ok(i > 0);
  const block = CSS.slice(CSS.lastIndexOf('form.lgp{', i), CSS.indexOf('@media (prefers-reduced-motion: reduce){ .lgp-wave > b{animation:none} }', i) + 80);
  assert.match(block, /form\.lgp\{position:relative;isolation:isolate\}/);
  assert.match(block, /\.lgp-wave\{[^]*?z-index:-1;overflow:hidden;pointer-events:none/);
  assert.match(block, /mask-image:linear-gradient\(black 45%, transparent\)/);
  assert.match(block, /var\(--wm-a1\), var\(--wm-a2\), var\(--wm-a3\), var\(--wm-a4\), var\(--wm-a5\)/);
  assert.match(block, /var\(--wm-b1\), var\(--wm-b2\), var\(--wm-b3\)/);
  assert.match(block, /animation:wmSlideA 210s linear infinite/); assert.match(block, /animation:wmSlideB 208s linear infinite/);
  assert.match(block, /prefers-reduced-motion: reduce\)\{ \.lgp-wave > b\{animation:none\}/);
  assert.doesNotMatch(block.replace(/data:[^"]*"/g, ''), /#[0-9a-fA-F]{3,8}\b/, 'no hand-typed colour');
});
