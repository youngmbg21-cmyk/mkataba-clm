'use strict';
/* f996 — A SEARCH BOX WEARS NO RING; THE FOLDERS SCROLL
   (owner, 10 Nov 2026, over a picture of Contracts' folders: "the search areas as highlighted should never have
   outlines. They should be like the jambo entry fields where you simply type in an empty field. Also, the page does
   not scroll which i saw in other pages previously")
   1 · In the new look a search or filter box draws no outline and no glow, pressed or keyed to: the field and the line
       that holds it. The house ring is an outline AND a shadow; the folders' box had only the outline taken off.
   2 · The Contracts place clips what it holds, so the folders page needs its own scroller inside: its list (and the
       tiles) take the room under the head and scroll there; the rows never squeeze.
   3 · The browser check that looks for the fault everywhere: white-sheet-verify's CUT, with its own planted fault.
   At the parent every claim fails. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.join(__dirname, '..');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const CSS = strip(read('index.html'));
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

test('f996 (1) a search box wears no ring: the field, and the line that holds it', () => {
  const field = /html\.lg-new :is\(([^{]*)\):is\(:focus, :focus-visible\)\{outline:none;box-shadow:none\}/.exec(CSS);
  assert.ok(field, 'the one rule for the field');
  for (const who of ['input[type="search"]', '.apn-box input', '.lh-ask input', '.jl-box input', '.st-search input', '.hist-q input', '.ik-search input', '.cmd-search input'])
    assert.ok(field[1].split(',').map(s => s.trim()).includes(who), who + ' is named');
  const line = /html\.lg-new :is\(([^{]*)\):focus-within\{outline:none;box-shadow:none\}/.exec(CSS);
  assert.ok(line, 'the one rule for the line that holds it');
  for (const who of ['.apn-box', '.lh-ask', '.st-search', '.hist-q', '.ik-search', '.cmd-search'])
    assert.ok(line[1].split(',').map(s => s.trim()).includes(who), who + ' is named');
  /* it comes after the house ring, and after the folders' own box rule, so it wins by order as well as by weight */
  assert.ok(field.index > CSS.indexOf('button:focus-visible,a:focus-visible,input:focus-visible'));
  assert.ok(field.index > CSS.indexOf('html.lg-new .apn-box input{flex:1'));
});

test('f996 (2) the folders page scrolls inside the place that clips it', () => {
  assert.match(CSS, /\.ig-pick\.ct-place\{[^}]*overflow:hidden/, 'the place clips (the reason a scroller is owed)');
  assert.match(CSS, new RegExp(esc('html.lg-new #ct-place .ctf-page > :is(.ctf-list, .ctf-grid){flex:1 1 0%;min-height:0;overflow-y:auto}')));
  assert.match(CSS, new RegExp(esc('html.lg-new #ct-place .ctf-page > .ctf-list > *{flex:none}')), 'a row never squeezes');
  assert.match(strip(read('js/views/register.js')), /class="sap-page ct-page ctf-page"[^`]*\$\{regFoldersHeadHtml\(\)\}\$\{regFoldersHtml\(\)\}<\/div>/, 'the list is the page\'s own child');
});

test('f996 (3) the browser check looks for a cut-off page, and proves it can see one', () => {
  const W = read('test/chromium/white-sheet-verify.js');
  assert.match(W, /const cut = \[\]/); assert.match(W, /PLANT cut/); assert.match(W, /the planted cut-off block is seen/);
  assert.match(W, /const CUT_HELD = \[[^\]]*'contracts'/, 'Contracts is held to it');
});
