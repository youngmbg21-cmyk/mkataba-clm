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

test('f1200 (1) one helper waves every pop-up frame once, never a page, the Send screen or New agreement', () => {
  const { w, ctx } = world();
  const host = w.document.createElement('div');
  host.innerHTML = '<div class="modal-in" role="dialog" id="sheet"><form class="lgp"><div class="lgp-hd"></div></form></div>'
    + '<div class="modal-in" role="dialog" id="old"><div class="dlg-h"><h3>Add a duty</h3></div></div>'
    + '<div class="modal-in" role="alertdialog" id="yes"><h3>Are you sure?</h3></div>'
    + '<div class="dts-card" role="dialog" id="duty"><form class="lgp"></form></div>'
    + '<div class="modal-in" role="dialog" id="page" data-dlg-page><div>a page</div></div>'
    + '<div class="modal-in" role="dialog" id="send"><div data-share-sap></div></div>'
    + '<div class="modal-in" role="dialog" id="na"><div id="na-root"></div></div>';
  assert.equal(ctx.lgpWaveSweep(host), 4, 'the edit sheet, the older pop-up, the yes/no box and the duties sheet');
  assert.equal(ctx.lgpWaveSweep(host), 0, 'a second sweep stacks none');
  for (const id of ['sheet', 'old', 'yes', 'duty']){
    const f = host.querySelector('#' + id);
    assert.ok(f.firstElementChild.classList.contains('lgp-wave'), id + ': first in its frame, so it lies behind the head');
    assert.ok(f.classList.contains('has-pop-wave'), id + ': the frame is isolated');
    assert.equal(f.querySelectorAll('.lgp-wave').length, 1, id + ': one strip, none inside the sheet');
  }
  for (const id of ['page', 'send', 'na']) assert.equal(host.querySelector('#' + id + ' .lgp-wave'), null, id + ': no wave on a page');
  const page = host.querySelector('#old'); page.setAttribute('data-dlg-page', '');
  ctx.lgpWaveSweep(host);
  assert.equal(page.querySelector('.lgp-wave'), null, 'a frame turned into a page loses its strip');
  assert.equal(host.querySelector('#sheet .lgp-wave').getAttribute('aria-hidden'), 'true');
  assert.equal(host.querySelectorAll('#sheet .lgp-wave > b').length, 2, 'two weaves');
  assert.match(COMP, /Object\.assign\(window, \{ LGP_WAVE_HTML, POP_WAVE_FRAME, lgpWaveSweep, lgpWaveWatch \}\)/);
});

test('f1200 (2) two watchers: the one dialog, and the layers put straight on the page', async () => {
  const { w, ctx } = world();
  assert.equal(ctx.lgpWaveWatch(), true);
  const mr = w.document.getElementById('modal-root');
  mr.innerHTML = '<div><div class="modal-in" role="dialog" id="a"><div class="p-6"><h3>Pick a contract</h3></div></div></div>';
  await tick();
  assert.equal(mr.querySelectorAll('#a > .lgp-wave').length, 1, 'opened by openModal: waved');
  mr.querySelector('#a').innerHTML = '<form class="lgp" id="b"></form>';
  await tick();
  assert.equal(mr.querySelectorAll('#a > .lgp-wave').length, 1, 'its body redrawn in place: waved again');
  await tick();
  assert.equal(mr.querySelectorAll('.lgp-wave').length, 1, 'its own insertion adds nothing more');
  const ov = w.document.createElement('div'); ov.id = 'confirm-overlay';
  ov.innerHTML = '<div class="modal-in" role="alertdialog"><h3>Are you sure?</h3></div>';
  w.document.body.appendChild(ov);
  await tick();
  assert.equal(ov.querySelectorAll('.modal-in > .lgp-wave').length, 1, 'a yes/no box put on the page: waved');
  const toast = w.document.createElement('div'); toast.className = 'toast'; w.document.body.appendChild(toast);
  await tick();
  assert.equal(toast.querySelector('.lgp-wave'), null, 'a toast is not a pop-up');
  assert.equal(ctx.lgpWaveWatch(), false, 'one pair of watchers');
  const CORE = read('js/core.js');
  assert.match(CORE, /ov\.id='confirm-overlay'[\s\S]{0,1200}class="modal-in" role="alertdialog"/, 'the yes/no box is a frame on the page');
  assert.match(CORE, /ov\.id='prompt-overlay'[\s\S]{0,600}class="modal-in" role="dialog"/, 'the "why?" box is a frame on the page');
});

test('f1200 (3) the look: the panels\' weaves by token, behind the words, a fading strip, still for less motion', () => {
  const i = CSS.indexOf('.lgp-wave{'); assert.ok(i > 0);
  /* RE-POINTED 24 Nov 2026 (review: the wave's rules wait on the new look, html.lg-new) */
  const block = CSS.slice(CSS.lastIndexOf('.has-pop-wave{', i) - 16, CSS.indexOf('@media (prefers-reduced-motion: reduce){ html.lg-new .lgp-wave > b{animation:none} }', i) + 100);
  assert.match(block, /\n  html\.lg-new \.has-pop-wave\{isolation:isolate\}/);
  assert.match(block, /\.lgp-wave\{[^]*?z-index:-1;overflow:hidden;pointer-events:none/);
  assert.match(block, /mask-image:linear-gradient\(black 45%, transparent\)/);
  assert.match(block, /var\(--wm-a1\), var\(--wm-a2\), var\(--wm-a3\), var\(--wm-a4\), var\(--wm-a5\)/);
  assert.match(block, /var\(--wm-b1\), var\(--wm-b2\), var\(--wm-b3\)/);
  assert.match(block, /animation:wmSlideA 210s linear infinite/); assert.match(block, /animation:wmSlideB 208s linear infinite/);
  assert.match(block, /prefers-reduced-motion: reduce\)\{ html\.lg-new \.lgp-wave > b\{animation:none\}/);
  assert.doesNotMatch(block.replace(/data:[^"]*"/g, ''), /#[0-9a-fA-F]{3,8}\b/, 'no hand-typed colour');
});
