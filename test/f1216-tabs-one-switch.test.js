'use strict';
/* f1216 — THE DOSSIER'S TABS ARE ONE SWITCH, AND THE LIST NEVER FLASHES (owner, 24 Nov 2026):
   (1) beside a paper, Dossier · Plan · Clauses · Redlines · Editor sit on ONE grey track, the open tab a white pill with the
       view switch's own shadow (Clean · Redline · Their view);
   (2) the editor's copy of the row is the same switch — the same word and count sizes, no 80px cut — read off the LIVE
       record, as the Dossier's row is;
   (3) going from the Dossier to Clauses, the neat list is dressed in the first frame (is-list with the rows, its tabs and
       badges drawn in the same task, never by the next timer). */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const H = R('index.html'), PD = strip(R('js/paperdesk.js')), CT = strip(R('js/views/contract.js'));
const fn = (S, name) => { const i = S.indexOf('function ' + name + '('); assert.ok(i >= 0, name); return S.slice(i, S.indexOf('\n}', i) + 2); };
const HEAD = 'html.lg-new #app-shell #ig-dock > .igd-head.igd-head[data-pd-head="paper"]';

test('f1216 (1) one grey track, the open tab a white pill', () => {
  assert.ok(H.includes(HEAD + ' > .pd-tab{position:relative;isolation:isolate;height:32px;margin:0;padding:0 9px;border-radius:0;background:var(--surface-2)'));
  assert.ok(H.includes(HEAD + ' > .pd-tab:first-child{margin-left:0;padding-left:11px;border-radius:999px 0 0 999px}'));
  assert.ok(H.includes(HEAD + ' > .pd-tab:not(:has(+ .pd-tab)){margin-right:8px;padding-right:11px;border-radius:0 999px 999px 0}'));
  assert.ok(H.includes(HEAD + ' > .pd-tab.on::before{content:"";position:absolute;inset:3px;z-index:-1;border-radius:999px;background:var(--color-surface);box-shadow:0 1px 2px rgba(0,0,0,.10)}'));
});
test('f1216 (2) the editor\'s row is the same switch, off the live record', () => {
  assert.match(H, /html\.lg-new #clause-editor\.is-tabbed \.ce-dtabs\{[^}]*padding:3px;border-radius:999px;background:var\(--surface-2\)\}/);
  assert.match(H, /html\.lg-new #clause-editor\.is-tabbed \.ce-dtabs \.pd-tab\{max-width:none;[^}]*font-size:var\(--t-body\)/);
  assert.match(H, /html\.lg-new #clause-editor\.is-tabbed \.ce-dtabs \.pd-tab-n\{font-size:var\(--t-label\);font-weight:var\(--w-strong\)/);
  assert.match(H, /html\.lg-new #clause-editor\.is-tabbed \.ce-dtabs \.pd-tab\.on\{background:var\(--color-surface\)/);
  assert.match(fn(PD, 'pdEdTabsHtml'), /const c = \(c0 && typeof getContract === 'function' && getContract\(c0\.id\)\) \|\| c0;/);
});
test('f1216 (3) the neat list is dressed in the first frame', () => {
  assert.match(fn(CT, 'docThreadFill'), /card\.classList\.toggle\('is-list',!!\(!_thPage&&docThreadNavOn\(\)\)\);/);
  assert.match(fn(CT, 'docThreadPaint'), /stkDecorate\(c,card,rows\);\s*if\(!_thPage&&docThreadNavOn\(\)\) docThreadNavSync\(\);/);
});
