/* F379 — SIX OFF FIVE IMAGES (Young ruled 24 Sep 2026)
   ===================================================
   *"Image 1, Remove the value stream column from both pages as well but not
   from the filter. Image 2, remove the highlighted alerts and end the card
   with only the graph in it. Image 3, extend the graph to cover the little
   space left to have a full screen when screen is at 100% zoom on a thinkpad.
   Image 4, make the DNA strand to cover until the bottom of the screen. It
   should not extend past the length of the screen. Image 5, the why it
   matters should be in bold font. Finally, when on focus mode, and you change
   pages, the exit focus esc should not move with you to other pages. It should
   stay where the focus mode is."*

   WHY MOSTLY SOURCE CLAIMS. Four of the six are geometry or a journey across
   pages and are measured in test/chromium/six-off-five-images-verify.js. What
   is pinned here is the shape that makes each of them true, and the walls:
   the Stream filter and the sort by stream survive the column, the pressable
   floor survives the strand, and the focus mode itself survives a page change.
   [wall] and [control] claims pass on both sides by design. */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');

const read = p => fs.readFileSync(path.join(__dirname, '..', p), 'utf8');
/* COMMENTS ARE PROSE — the notes beside these changes quote the very names
   the sweeps look for. A sweep reads CODE. */
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const REG = strip(read('js/views/register.js'));
const HOME = strip(read('js/views/home.js'));
const ROOM = strip(read('js/views/contract.js'));
const AI = read('js/ai.js');
const CSS = read('index.html');

const w = buildWorld({ registerView: true });
const win = w.win;

test('F379 — six off five images', async t => {

  /* ═══════ 1. NO VALUE STREAM COLUMN, THE FILTER STAYS ═══════ */
  await t.test('(1) neither seat draws a stream column', () => {
    assert.ok(!win.REG_COL_KEYS.includes('stream'), 'Contracts has no stream column');
    assert.ok(!win.REG_COL_KEYS_NEGO.includes('stream'), 'nor does Negotiations');
    assert.ok(!/CELL\.stream=/.test(REG), 'and no cell builder is left drawing one');
    assert.ok(!/sortableTh\('stream'/.test(REG), 'nor a head');
    assert.ok(!/\.reg-tick\{/.test(REG), 'and its colour tick rule went with it');
  });
  await t.test('(1b) the widths still sum to 100, and the five shared columns agree', () => {
    const sum = a => Array.from(a).reduce((x, y) => x + y, 0);
    assert.equal(sum(win.REG_COL_W), 100);
    assert.equal(sum(win.REG_COL_W_NEGO), 100);
    const A = Object.fromEntries(Array.from(win.REG_COL_KEYS).map((k, i) => [k, win.REG_COL_W[i]]));
    const B = Object.fromEntries(Array.from(win.REG_COL_KEYS_NEGO).map((k, i) => [k, win.REG_COL_W_NEGO[i]]));
    for (const k of ['mk', 'counterparty', 'value', 'expiry', 'stage']) assert.equal(A[k], B[k], k + ' agrees');
    assert.equal(A.counterparty, 39, 'the freed width went to the give column on both seats');
  });
  await t.test('(1c) [wall] the Stream filter stays, and so does sorting by stream', () => {
    assert.match(REG, /selFilter\('reg-type-sel',typeOpts,R\.type!=='all',i18t\('reg_value_stream'\)/,
      'the Stream filter chip is still built');
    assert.ok(Array.from(win.REG_SORTS).some(s => s.k === 'stream'), 'the dropdown still offers the stream sort');
    assert.ok(win.REG_CMP.stream, 'and its comparator is still there');
  });
  await t.test('(1d) a group heading spans the seat\'s own column count, never a literal', () => {
    assert.match(REG, /<tr class="ngl-band" role="presentation"><td role="presentation" colspan="\$\{REG_COL_KEYS_NEGO\.length\}">/);
  });

  /* ═══════ 2 + 3. HOME: THE CARD ENDS WITH THE GRAPH, AND FILLS THE SCREEN ═══════ */
  await t.test('(2) the decision card draws no rows, and ends with the rail', () => {
    assert.ok(!/id="hm-dd-rows"/.test(HOME), 'the rows are gone');
    assert.match(HOME, /const ddRows=rwCard\s*\|\|/, 'the rail is the card\'s whole body');
    assert.match(HOME, /if\(!rwSp\|\|!rwSp\.rows\.length\) return '';/,
      'and it is drawn whenever there is anything on the card');
    assert.ok(!/hmFitDecisions|HM_DD_MIN|_hmDdFit/.test(HOME), 'the row-fitting machinery went with the rows');
    assert.ok(!/i18t\('home_dd_sorted'\)/.test(HOME), '"sorted by what closes first" described the rows and went with them');
  });
  /* Not a control: at the parent "See all" stood down at four or fewer,
     because the rows were then already on screen. With no rows it is the
     one door onto every decision, so it draws whenever there is one. */
  await t.test('(2b) "See all" is drawn whenever there is anything — the one door onto every decision', () => {
    assert.match(HOME, /\+ \(ddAll\.length\s*\?\s*`<button type="button" class="hm-cz" data-hm-go="needsyou">/);
  });
  await t.test('(3) the card and the rail grow into the rest of the screen', () => {
    assert.match(HOME, /hmCard\(hmSec\(i18t\('home_needs_decision'\),ddLink,true\), ddRows, 'hm-dd'\)/);
    assert.match(CSS, /\.hm-page\{min-height:var\(--view-h\);\}/);
    assert.match(CSS, /\.hm-page>\.hm-card\.hm-dd\{flex:1 0 auto;display:flex;flex-direction:column;\}/);
    assert.match(CSS, /\.hm-dd>\.hm-rw\{flex:1 0 auto;border-bottom:0;\}/);
    assert.match(CSS, /\.hm-dd \.hm-rw-rail\{flex:1 0 76px;height:auto;\}/, 'never below its old height');
  });

  /* ═══════ 4. THE STRAND RUNS TO THE BOTTOM, AND NO FURTHER ═══════ */
  await t.test('(4) a block is a share of the strip, weighted by its words', () => {
    assert.match(ROOM, /style="--xr-w:\$\{docXraySegH\(x\.words\)\};min-height:\$\{XR_SEG_MIN\}px"/);
    assert.match(CSS, /\.doc-xr-seg\{position:relative;flex:var\(--xr-w,1\) 0 0px;/);
    assert.ok(!/style="height:\$\{docXraySegH/.test(ROOM), 'no fixed height is left on a block');
  });
  await t.test('(4b) [wall] the 23 Sep floor stays, so no block is too small to press', () => {
    const [, mn] = ROOM.match(/const XR_SEG_MIN = (\d+)/) || [];
    assert.ok(Number(mn) >= 14, 'the floor is at least 14px');
  });

  /* ═══════ 5. "WHY IT MATTERS" IS BOLD ═══════ */
  await t.test('(5) both lead-ins wear the product\'s bold token', () => {
    assert.match(CSS, /\.doc-xr-why b\{color:var\(--color-text\);font-weight:var\(--w-strong\);\}/, 'the X-ray');
    assert.match(AI, /#brief-section \.br-why b\{color:var\(--color-text\);font-weight:var\(--w-strong\)\}/, 'the brief panel');
  });

  /* ═══════ 6. THE FOCUS CHIP STAYS ON ITS OWN PAGE ═══════ */
  await t.test('(6) the chip is mounted on the room\'s page, and drawn only there', () => {
    const fn = ROOM.slice(ROOM.indexOf('function wsFocusChip()'), ROOM.indexOf('let _wsFocusKeyWired'));
    assert.ok(!/document\.body\.appendChild\(chip\)/.test(fn), 'it is no longer hung on the whole window');
    assert.match(fn, /const host=document\.getElementById\('content'\)/, 'it lives in the page, which every navigation replaces');
    assert.match(fn, /if\(!_wsFocus\|\|!wsFocusHere\(\)\)\{ if\(chip\) chip\.remove\(\); return; \}/,
      'and it stands down anywhere but the room');
    assert.match(ROOM, /const wsFocusHere=\(\)=>typeof state!=='undefined'&&!!state&&\(state\.view==='workspace'\|\|state\.view==='doc'\);/);
  });
  await t.test('(6b) Escape is the room\'s key only while the room is on screen', () => {
    const key = ROOM.slice(ROOM.indexOf("if(e.key!=='Escape'||!_wsFocus) return;"), ROOM.indexOf('_wsFocus=false; applyWsFocus();\n    });'));
    assert.match(key, /if\(!wsFocusHere\(\)\) return;/);
  });
  await t.test('(6c) [control] the mode itself stays with its contract', () => {
    assert.match(ROOM, /if\(_wsFocusFor!==c\.id\)\{ _wsFocus=false; _wsFocusFor=c\.id; \}/,
      'only a DIFFERENT contract resets it — coming back to the same one finds it on');
  });
});
