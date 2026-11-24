'use strict';
/* f1214 — HOW OUR CONTRACTS LOOK: THE PREVIEW IN THE SIDE PANEL (owner, 24 Nov 2026: "due to space constraints, put the
   paper in the side panel and it should always be visible in the page and brand kit stages so you can see the changes
   being made. And the content in the paper should be full page long.")
   (1) on The page and Brand kit the panel carries the paper, pinned at its top (its words scroll below it); Who wears
       it and History keep their panels, with no paper
   (2) the page's table takes the whole width: no preview beside it
   (3) a WHOLE A4 page is drawn, at the width the panel's height allows, never a stub cut to the words
   (4) unless one was chosen, the preview opens on the contract whose first page is fullest */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const br = require('../js/branding.js');
const D = read('js/views/designstep.js'), S = read('js/views/settings.js'), X = read('index.html');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const fn = (src, name) => { const i = src.indexOf('function ' + name + '('); assert.ok(i >= 0, name + ' exists'); return strip(src.slice(i, src.indexOf('\nfunction ', i + 10))); };

function lookWorld(contracts) {
  const me = { id: 'a', name: 'Amina', role: 'admin' };
  const ctx = Object.assign({}, br, {
    i18t: (k, o) => k + (o ? ' ' + Object.values(o).join('|') : ''), i18tn: (k, n) => k + ' ' + n,
    esc: s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'),
    currentUser: () => me, getUsers: () => [me], FOLDERS: { proc: { id: 'proc', name: 'Procurement' } },
    state: { settings: { lookChanges: [] }, contracts } });
  ctx.window = ctx; ctx.ORG_BRANDING = br.normalizeDesignBranding({ designId: 'classic-letterhead', companyName: 'Highland' });
  ctx.ORG_STREAM_LOOKS = {}; ctx.ORG_PAPER_LOOKS = [];
  ctx.stLsHeadHtml = o => `<header>${o.acts || ''}${o.askHtml || ''}</header>`;
  vm.createContext(ctx); vm.runInContext(D, ctx); ctx.clInit();
  return ctx;
}
const words = n => Array.from({ length: n }, (_, i) => 'word' + i).join(' ');
const BOOK = () => [{ id: 'MK-1', name: 'Short', folder: 'proc', status: 'Draft', redlineText: 'SHORT\n\n1. Term\nOne year.' },
  { id: 'MK-2', name: 'Long', folder: 'proc', status: 'Draft', redlineText: words(900) },
  { id: 'MK-3', name: 'Signed', folder: 'proc', status: 'Signed', redlineText: words(2000) }];

test('f1214 (1) the paper is the panel\'s on The page and Brand kit, never on Who wears it or History', () => {
  const W = lookWorld(BOOK());
  for (const tab of ['page', 'kit']) {
    vm.runInContext(`_cl.tab = ${JSON.stringify(tab)}`, W);
    assert.match(String(vm.runInContext('clPanelFacts().pv', W)), /id="cl-pv-dock"[\s\S]*id="cl-pv-view"/, tab + ': the panel carries the paper');
  }
  for (const tab of ['who', 'history']) {
    vm.runInContext(`_cl.tab = ${JSON.stringify(tab)}`, W);
    assert.equal(vm.runInContext('clPanelFacts().pv', W), '', tab + ': no paper in the panel');
  }
  const look = fn(S, 'stLsLookPanel');
  assert.match(look, /pin:f\.pv\|\|''/, 'the look\'s panel pins the paper');
  const html = fn(S, 'stLsPanelHtml');
  assert.match(html, /if\(o\.pin\) return `<div class="jl-words is-ov sdd5-p st-ls-p is-pin">\$\{o\.pin\}<div class="st-ls-rest scroll-thin" id="st-ls-rest">\$\{card\}<\/div><\/div>`;/,
    'pinned at the top; the headline, ring and quality check scroll below it');
  assert.match(X, /\.st-ls-p\.is-pin > \.st-ls-rest\{flex:1 1 auto;min-height:0;overflow-y:auto/, 'the words below the paper scroll in their own room');
  assert.match(fn(S, 'stLsPanelPaint'), /_stPage==='look'&&typeof window\.clAfterPaint==='function'\) window\.clAfterPaint\(\)/, 'the panel\'s paint draws the paper');
  assert.match(D, /if \(!t\.closest\('\[data-st-pg="look"\], #cl-pv-dock'\)\) return;/, 'the chooser, the page buttons and the pins answer in the panel');
});

test('f1214 (2) the table takes the page\'s whole width: no preview column', () => {
  const W = lookWorld(BOOK());
  for (const tab of ['page', 'kit']) {
    vm.runInContext(`_cl.tab = ${JSON.stringify(tab)}`, W);
    const page = String(vm.runInContext('clLsPageHtml()', W));
    assert.doesNotMatch(page, /cl-pv/, tab + ': no preview on the page');
  }
  assert.doesNotMatch(fn(D, 'clLsPageHtml'), /clPreviewHtml/);
  assert.match(X, /\.cl-pg\.is-r1 \.cl-ls-grid \.cl-ls-left\{flex-basis:100%\}/, 'the table spans the page');
  assert.match(X, /\.cl-ls-tabs \.st-ls-tab\[data-cl-tab="who"\]\{flex:0 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis\}/, 'the tab line ends in "…" in its own space');
});

test('f1214 (3) a whole A4 page, fitted to the panel, never cropped to the words', () => {
  const frame = fn(D, 'clPvFrame');
  assert.match(frame, /view\.style\.height = Math\.round\(W \* clPvPageH\(\) \/ clPvPageW\(\)\) \+ 'px';/, 'the frame is a whole page high');
  const show = fn(D, 'clPvShow');
  assert.match(show, /clPvFrame\(view, W\)/); assert.doesNotMatch(show, /pg\.h/, 'never the height of the words on the page');
  const fit = fn(D, 'clPvFitW');
  assert.match(fit, /body\.clientHeight - CL_PV_REST_MIN - chrome/, 'the page fits between the panel\'s head and Jambo\'s box');
  assert.match(fit, /Math\.min\(aw, ah \* clPvPageW\(\) \/ clPvPageH\(\)\)/, 'A4 proportions kept');
  const draw = fn(D, 'clPvDraw');
  assert.equal((draw.match(/clPvFrame\(view, W\)/g) || []).length, 2, 'the sample page and the contract\'s page alike');
});

test('f1214 (4) the preview opens on the contract whose first page is fullest', () => {
  const W = lookWorld(BOOK());
  assert.equal(vm.runInContext('clPvContract().id', W), 'MK-2', 'the long unsigned contract, not the first nor the signed one');
  vm.runInContext('_cl.pv = "MK-1"', W);
  assert.equal(vm.runInContext('clPvContract().id', W), 'MK-1', 'a contract chosen stays chosen');
});
