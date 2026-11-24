'use strict';
/* f1217 — HOW OUR CONTRACTS LOOK: THE PAPER ALONE, ITS PAGES SCROLL (owner, 24 Nov 2026, on a photo of the panel at 560 wide
   with the paper alone in it: "make it like this image and the pages should just be scrollable as opposed to adding the
   1, 2, 3")
   (1) on The page and Brand kit the panel is the paper alone; Who wears it and History keep their panels
   (2) no page buttons: the pages scroll in the panel's own scroller, under the chooser line
   (3) every page drawn and stacked, each whole; a long contract capped and the cap said, never a silent trim
   (4) the panel opens at 560 there, through the slider's own writer; the reader's saved width is never written over,
       and comes back once the paper is gone; a drag there is honoured in memory only */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const br = require('../js/branding.js');
const { buildWorld } = require('./world');
const D = read('js/views/designstep.js'), S = read('js/views/settings.js');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const fn = (src, name) => { const i = src.indexOf('function ' + name + '('); assert.ok(i >= 0, name + ' exists'); return strip(src.slice(i, src.indexOf('\nfunction ', i + 10))); };

function lookWorld(els) {
  const me = { id: 'a', name: 'Amina', role: 'admin' };
  const ctx = Object.assign({}, br, {
    i18t: (k, o) => k + (o ? ' ' + Object.values(o).join('|') : ''), i18tn: (k, n) => k + ' ' + n,
    esc: s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'),
    currentUser: () => me, getUsers: () => [me], FOLDERS: { proc: { id: 'proc', name: 'Procurement' } },
    state: { settings: { lookChanges: [] }, contracts: [{ id: 'MK-1', name: 'Long', folder: 'proc', status: 'Draft', redlineText: 'x '.repeat(3000) }] } });
  ctx.window = ctx; ctx.ORG_BRANDING = br.normalizeDesignBranding({ designId: 'classic-letterhead', companyName: 'Highland' });
  ctx.ORG_STREAM_LOOKS = {}; ctx.ORG_PAPER_LOOKS = []; ctx.PG_SIGN_W = 794; ctx.PG_SIGN_H = 1122.5;
  vm.createContext(ctx); vm.runInContext(D, ctx); ctx.clInit();
  if (els) ctx.document = { getElementById: id => els[id] || null, querySelector: () => null, querySelectorAll: () => [] };
  return ctx;
}

test('f1217 (1) the panel is the paper alone on The page and Brand kit; Who wears it and History keep theirs', () => {
  const W = lookWorld();
  for (const tab of ['page', 'kit']) { vm.runInContext(`_cl.tab = ${JSON.stringify(tab)}`, W); assert.match(String(vm.runInContext('clPanelFacts().pv', W)), /id="cl-pv-scroll"/, tab); }
  for (const tab of ['who', 'history']) { vm.runInContext(`_cl.tab = ${JSON.stringify(tab)}`, W); assert.equal(vm.runInContext('clPanelFacts().pv', W), '', tab); }
  const look = fn(S, 'stLsLookPanel');
  assert.match(look, /if\(f\.pv\) return \{ pin:f\.pv, paperOnly:true \};/, 'paper alone: no headline, ring or quality check');
  assert.match(look.slice(look.indexOf('paperOnly:true')), /groups:\[\{ label:i18t\('cl_ls_p_quality'\)/, 'elsewhere the panel stays as it was');
  assert.match(fn(S, 'stLsPanelHtml'), /if\(o\.paperOnly\) return `<div class="jl-words is-ov sdd5-p st-ls-p is-paper-only">\$\{o\.pin\}<\/div>`;/);
});

test('f1217 (2) no page buttons: the pages scroll under the chooser line', () => {
  const W = lookWorld();
  const pv = String(vm.runInContext('clPreviewHtml()', W));
  assert.doesNotMatch(pv, /cl-pv-pages|cl-pv-thumb|data-cl-pv-page/, 'no 1 · 2 · 3');
  assert.doesNotMatch(strip(D), /data-cl-pv-page|cl-pv-thumb|clPvPagesPaint/);
  assert.match(pv, /<div class="cl-pv-h">[\s\S]*id="cl-pv-n"[\s\S]*<div class="cl-pv-scroll scroll-thin" id="cl-pv-scroll"><div class="cl-pv-view" id="cl-pv-view">/, 'the chooser line above, the pages in their own scroller');
  assert.match(D, /document\.addEventListener\('scroll', e => \{ if \(_cl && e\.target && e\.target\.id === 'cl-pv-scroll'\) clPvScrolled\(\); \}, true\);/, '"page N of M" follows the page in view');
  assert.match(fn(D, 'clPvSayPage'), /p0 \|\| clPvPageAt\(\)/);
  assert.match(fn(D, 'clRowChoose'), /sc\.scrollTop = Math\.max\(0, y - 40\)/, 'a row brings its pin into the panel\'s view');
  assert.doesNotMatch(fn(D, 'clRowChoose'), /scrollIntoView|content-scroll/, 'the page itself never moves');
});

test('f1217 (3) every page stacked, each whole; a long contract capped and the cap said', () => {
  const view = { style: {} }, paper = { style: {} }, cap = { hidden: true, textContent: '' };
  const W = lookWorld({ 'cl-pv-paper': paper, 'cl-pv-cap': cap });
  const info = n => ({ n, pageH: 1122.5, pages: Array.from({ length: n }, (_, i) => ({ top: i * (1122.5 + 20), h: 1122.5 })) });
  W.__v = view; W.__i = info(3);
  vm.runInContext('clPvFrame(__v, 397, __i)', W);
  assert.equal(view.style.height, Math.round((2 * 1142.5 + 1122.5) * 0.5) + 'px', 'all three pages, the last one whole');
  assert.equal(cap.hidden, true, 'nothing left out, nothing said');
  W.__i = info(30);
  vm.runInContext('clPvFrame(__v, 397, __i)', W);
  assert.equal(vm.runInContext('CL_PV_MAX_PAGES', W), 12);
  assert.equal(view.style.height, Math.round((11 * 1142.5 + 1122.5) * 0.5) + 'px', 'twelve pages drawn');
  assert.equal(cap.hidden, false); assert.equal(cap.textContent, 'cl_ls_pv_capped 12|30', 'the cap is said under the last page');
  const I = read('js/i18n.js'), sv = I.indexOf('\n  sv: {');
  assert.ok(I.slice(0, sv).includes("\n    cl_ls_pv_capped: 'Showing {n} of {m} pages',") && I.slice(sv).includes("\n    cl_ls_pv_capped: 'Visar {n} av {m} sidor',"), 'both books');
});

test('f1217 (4) 560 wide on the paper\'s tabs through the slider\'s own writer; the reader\'s width never written over', () => {
  const { win } = buildWorld({ registerView: true });
  win.eval(read('js/components.js'));   /* the slider's builder, as the browser loads it */
  assert.equal(typeof win.jlPageWideSet, 'function');
  win.localStorage.setItem('hati.v1.jlW', '450');
  assert.equal(win.JL_SPLIT.pref(), 450, 'the reader\'s own width');
  const dock = win.document.createElement('div'); dock.id = 'cl-pv-dock'; win.document.body.appendChild(dock);
  win.jlPageWideSet(560, '#cl-pv-dock');
  assert.equal(win.JL_SPLIT.w0, 560, 'the paper\'s tabs open the panel at 560');
  assert.equal(win.JL_SPLIT.pref(), null, 'the reader\'s saved width does not override it there');
  win.JL_SPLIT.save(620);
  assert.equal(win.JL_SPLIT.pref(), 620, 'a drag there is honoured');
  assert.equal(win.localStorage.getItem('hati.v1.jlW'), '450', 'and never saved over the reader\'s own');
  dock.remove();
  assert.equal(win.JL_SPLIT.w0, 384, 'the paper gone: the resting width');
  assert.equal(win.JL_SPLIT.pref(), 450, 'and the reader\'s own width back');
  assert.match(fn(S, 'stLsPanelPaint'), /window\.jlPageWideSet\(_stPage==='look'&&document\.getElementById\('cl-pv-dock'\)\?ST_LOOK_PANEL_W:0,'#cl-pv-dock'\)/);
  assert.match(S, /const ST_LOOK_PANEL_W=560;/);
});
