'use strict';
/* f1229 — THE EDITOR'S WRITING BAR IS ONE WHITE BAR ACROSS THE TOP (owner, 25 Nov 2026: "build this bar to just be a white
   bar across the top of the page like it used to be" … "make the content sit at the center of the bar"). It spans the page
   from its left edge to the side panel, a thin line under it, no card, no shadow, no corners; the tools in ONE line in its
   middle; where they need more room than the bar has, the last of them fold into More — never a second line. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const CE = strip(R('js/views/clauseeditor.js')), H = R('index.html'), I = R('js/i18n.js');
const fn = name => { const i = CE.indexOf('function ' + name + '('); assert.ok(i >= 0, name + ' exists'); return CE.slice(i, CE.indexOf('\n}', i) + 2); };

test('f1229 (1) the bar is the page\'s width and stands still', () => {
  const b = fn('ceTabBarPlace');
  /* RE-POINTED 26 Nov 2026 (f1242): past the mark the side lies over the page, and the bar stops where it starts */
  assert.match(b, /const w = Math\.round\(\(left\.clientWidth[^\n]*- over\)/);
  assert.match(b, /head\.style\.width = w \+ 'px';/);
  assert.doesNotMatch(b, /translate\(/, 'the bar is not moved over the sheet any more');
  assert.doesNotMatch(b, /addEventListener\('scroll'/, 'nothing follows the paper\'s scroll');
  assert.match(b, /ceTabBarFold\(pg\);/);
});
test('f1229 (2) one white bar: edge to edge, a line under it, no card; the tools centred, never wrapped', () => {
  assert.ok(H.includes('html.lg-new #clause-editor.is-tabbed .ce-head{position:absolute;left:0;top:0;z-index:6;width:100%;max-width:none;border:0;border-bottom:1px solid var(--color-neutral-200);'));
  assert.ok(H.includes('border-radius:0;background:var(--color-surface);box-shadow:none;padding:0 16px;box-sizing:border-box;height:54px;display:flex;align-items:center}'));
  assert.ok(H.includes('flex-wrap:nowrap;justify-content:center;border-bottom:0;padding:0}'));
  assert.ok(H.includes('html.lg-new #clause-editor.is-tabbed .ce-left{padding-top:54px}'));
  assert.doesNotMatch(H, /#clause-editor\.is-tabbed \.ce-head\{[^}]*box-shadow:var\(--shadow-sm\)/);
});
test('f1229 (3) More takes the last tools where there is no room, and opens and shuts', () => {
  const f = fn('ceTabBarFold');
  assert.match(f, /while \(pop\.firstChild\) bar\.insertBefore\(pop\.firstChild, more\);/, 'the tools are put back first, in order');
  assert.match(f, /while \(!fits\(\) && guard-- > 0\)/);
  assert.match(f, /pop\.insertBefore\(last, pop\.firstChild\);/);
  assert.match(f, /if \(!pop\.firstChild\) more\.remove\(\);/);
  assert.match(CE, /if \(b\.hasAttribute\('data-ce-more'\)\)\{ ceClosePicker\(\); ceTabMoreToggle\(b\); return; \}/, 'the bar\'s one listener answers More');
  const t = fn('ceTabMoreToggle');
  assert.match(t, /const on = open == null \? pop\.hidden : !!open;/, 'press it again and it closes');
  assert.match(t, /ev\.key === 'Escape'/);
  assert.match(fn('ceRenderBar'), /if \(ceTabbed\(\)\) ceTabBarPlace\(\);/, 'a redrawn bar is fitted again');
  assert.equal((I.match(/ce_bar_more: /g) || []).length, 2, 'More in both books');
});
