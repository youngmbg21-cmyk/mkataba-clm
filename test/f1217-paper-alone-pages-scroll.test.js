'use strict';
/* f1217 — HOW OUR CONTRACTS LOOK: THE PAPER ALONE, ITS PAGES SCROLL (owner, 24 Nov 2026, on a photo of the panel at 560 wide
   with the paper alone in it: "make it like this image and the pages should just be scrollable as opposed to adding the
   1, 2, 3")
   (1) on The page and Brand kit the panel is the paper alone; Who wears it and History keep their panels
   (2) no page buttons: the pages scroll in the panel's own scroller, under the chooser line
   (3) every page drawn and stacked, each whole; a long contract capped and the cap said, never a silent trim
   (4) the panel opens at 560 there, through the slider's own writer; the reader's saved width is never written over,
       and comes back once the paper is gone; a drag there is honoured in memory only
   RE-POINTED 24 Nov 2026 (one page, waves kept, owner: "No! I want the waves and simply put one page of paper on the
   panel"): (2) and (3) now pin ONE whole page, no paper scroller, no grey card, the waves kept but cut round the page,
   pins only for page-1 parts; (4) the panel is sized to the page, at most 560 */
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
  /* RE-POINTED 24 Nov 2026 (one page, waves kept, owner): one page, no scroller */
  for (const tab of ['page', 'kit']) { vm.runInContext(`_cl.tab = ${JSON.stringify(tab)}`, W); assert.match(String(vm.runInContext('clPanelFacts().pv', W)), /id="cl-pv-stage"/, tab); }
  for (const tab of ['who', 'history']) { vm.runInContext(`_cl.tab = ${JSON.stringify(tab)}`, W); assert.equal(vm.runInContext('clPanelFacts().pv', W), '', tab); }
  const look = fn(S, 'stLsLookPanel');
  assert.match(look, /if\(f\.pv\) return \{ pin:f\.pv, paperOnly:true \};/, 'paper alone: no headline, ring or quality check');
  assert.match(look.slice(look.indexOf('paperOnly:true')), /groups:\[\{ label:i18t\('cl_ls_p_quality'\)/, 'elsewhere the panel stays as it was');
  assert.match(fn(S, 'stLsPanelHtml'), /if\(o\.paperOnly\) return `<div class="jl-words is-ov sdd5-p st-ls-p is-paper-only">\$\{o\.pin\}<\/div>`;/);
});

test('f1217 (2) one page, nothing scrolls: no page buttons, no paper scroller, no grey card', () => {
  const W = lookWorld();
  const pv = String(vm.runInContext('clPreviewHtml()', W));
  assert.doesNotMatch(pv, /cl-pv-pages|cl-pv-thumb|data-cl-pv-page|cl-pv-scroll|cl-pv-cap/, 'no 1 · 2 · 3, no scroller, no cap');
  assert.doesNotMatch(strip(D), /data-cl-pv-page|cl-pv-thumb|clPvPagesPaint|cl-pv-scroll|clPvScrolled|CL_PV_MAX_PAGES/);
  assert.match(pv, /<div class="cl-pv-h">[\s\S]*id="cl-pv-n"[\s\S]*<div class="cl-pv-stage" id="cl-pv-stage"><div class="cl-pv-view" id="cl-pv-view">/, 'the chooser line above, the one page under it');
  const X = read('index.html');
  assert.match(X, /\.cl-pg\.is-r1\.cl-pv-dock \.cl-pv\{flex:1 1 auto;min-height:0;width:100%;padding:0;gap:8px;background:none;border-radius:0\}/, 'no grey card round the page');
  assert.match(X, /\.cl-pg\.is-r1\.cl-pv-dock \.cl-pv-stage\{[^}]*overflow:hidden;[^}]*justify-content:center/, 'the page centred; nothing scrolls');
  assert.match(X, /\.cl-pg\.is-r1\.cl-pv-dock \.cl-pv-view\{flex:none;background:var\(--color-doc-surface\);box-shadow:var\(--shadow-paper\)\}/, 'a white sheet with a soft shadow');
  /* the waves stay on this panel (no rule turns them off), cut round the page */
  assert.doesNotMatch(X, /cl-pv-dock[^{]*\)\s*#wm-ins\{[^}]*(display:none|content:none)/);
  assert.match(X, /html\.lg-new:has\(#cl-pv-dock\) #wm-ins\{[^}]*mask-composite:subtract\}/, 'the waves never over the page');
  assert.match(fn(D, 'clPvHole'), /st\.style\.setProperty\('--wm-hole-x'/);
  assert.match(fn(D, 'clPvSayPage'), /i18t\('cl_ls_pv_page', \{ n: num\(p\), m: of \}\)/, '"page 1 of M"');
});

test('f1217 (3) one whole page: the first page of wording; pins only for what is on it, a later part says its page', () => {
  const view = { style: {} }, paper = { style: {} };
  const W = lookWorld({ 'cl-pv-paper': paper });
  W.__v = view;
  vm.runInContext('clPvFrame(__v, 397)', W);
  assert.equal(view.style.height, Math.round(1122.5 * 0.5) + 'px', 'one whole page high');
  const root = n => ({ querySelector: sel => (n && sel === '.pg-cover') ? {} : null });
  W.__r = root(false); W.__c = root(true);
  assert.equal(vm.runInContext('clPvShownPage({ n: 4 }, __r)', W), 1, 'page 1');
  assert.equal(vm.runInContext('clPvShownPage({ n: 4 }, __c)', W), 2, 'with a cover, the first page of wording');
  const show = fn(D, 'clPvShow');
  assert.match(show, /sheet\.style\.transform = `translateY\(\$\{-\(pg \? pg\.top : 0\) \* k\}px\) scale\(\$\{k\}\)`;/, 'only that page is in the frame');
  const pins = fn(D, 'clPinsPaint');
  assert.match(pins, /if \(b\.bottom < vr\.top \|\| b\.top > vr\.bottom - 4\) \{ const at = pageOf\(el\); if \(at > 1\) off\[r\.k\] = at; return; \}/, 'no pin for a part off the page');
  assert.match(pins, /note\.textContent = i18t\('cl_ls_pv_on_page', \{ n: off\[k\] \}\)/, 'its row says which page, quietly');
  assert.doesNotMatch(fn(D, 'clRowChoose'), /scrollTop|scrollIntoView/, 'a row press only lights');
  const I = read('js/i18n.js'), sv = I.indexOf('\n  sv: {');
  assert.ok(I.slice(0, sv).includes("\n    cl_ls_pv_on_page: 'on page {n}',") && I.slice(sv).includes("\n    cl_ls_pv_on_page: 'på sida {n}',"), 'both books');
  assert.ok(!I.includes('cl_ls_pv_capped'), 'the cap\'s words went with the cap');
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
  assert.match(fn(S, 'stLsPanelPaint'), /window\.clPvPanelW\(ST_LOOK_PANEL_W\)/, 'the panel sized to the page, at most 560');
  assert.match(fn(S, 'stLsPanelPaint'), /window\.jlPageWideSet\(lookW,'#cl-pv-dock'\)/);
  assert.match(fn(D, 'clPvPanelW'), /Math\.max\(floor, Math\.min\(top, Math\.ceil\(W \+ 2 \* \(CL_PV_EDGE \+ CL_PV_SIDE\) \+ pad\)\)\)/, 'the page and a modest margin');
  assert.match(S, /const ST_LOOK_PANEL_W=560;/);
});
