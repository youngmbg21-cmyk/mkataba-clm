'use strict';
/* f1034 — WHAT LANDED THE SAME IS NOT DRAWN AGAIN (owner, 13 Nov 2026: "fix the flash issues", after the flash
   measure filmed every page move). Three pages drew themselves a second time a moment after arriving, when their
   data came back from the server: Approvals (~350 ms, the whole page, once per record loaded), Discover (~55 ms,
   the very rows it had just drawn) and Jambo's house (~75 ms, the whole page, the loading line turning into the
   house). Each now writes nothing where nothing changed, and only the part that changed where something did.
   Source-sliced: comments stripped, each check pinned to its function's own region. */
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const read = f => strip(fs.readFileSync(path.join(__dirname, '..', f), 'utf8'));
const region = (src, start, len = 4000) => { const i = src.indexOf(start); assert.ok(i >= 0, 'missing: ' + start); return src.slice(i, i + len); };

test('f1034 (1) a record landing in the background asks ONE paint a frame, and Approvals repaints its rows alone', () => {
  const s = read('js/signcheck.js');
  const land = region(s, 'function signReadinessFor', 900);
  assert.match(land, /scLandedRepaint\(\)/, 'the loader asks the one repaint');
  assert.doesNotMatch(land, /renderApprovalsPage\(\)/, 'no whole-page paint per record');
  const one = region(s, 'function scLandedRepaint', 900);
  assert.match(one, /_scLandQueued/, 'records landing together are one paint');
  assert.match(one, /requestAnimationFrame/, 'answered in the next frame');
  assert.match(one, /renderApprovalsPage\(\{\s*rows:\s*true\s*\}\)/, 'Approvals: the rows alone');
});

test('f1034 (2) a rows paint that would write what stands writes nothing', () => {
  const s = read('js/views/approvalsview.js');
  const r = region(s, 'function apnRender', 9000);
  assert.match(r, /tbl\._apnSrc===tblSrc/, 'the table compares what it would write with what it wrote');
  assert.match(r, /tbl\._apnSrc=tblSrc/, 'and stamps what it wrote');
  const i = r.indexOf('tbl._apnSrc===tblSrc'), j = r.indexOf('apPaintHead()');
  assert.ok(i >= 0 && j > i, 'the unchanged rows return before the head and the panel are painted');
});

test('f1034 (3) Discover draws again only when the rows that landed differ', () => {
  const s = read('js/views/reads.js');
  const r = region(s, 'async function rdLoad', 1400);
  assert.match(r, /const was = rdRowsKey\(_rd\.rows\)/);
  assert.match(r, /rdRowsKey\(_rd\.rows\) !== was\) renderReads\(\)/);
  assert.match(s, /function rdRowsKey\(rows\)/);
});

test('f1034 (4) Jambo\'s house: the period landing changes only the card, and nothing when it is the same', () => {
  const s = read('js/views/jambohouse.js');
  const r = region(s, 'function renderJamboHouse', 5000);
  assert.match(r, /opts\.fromLoad && host\._jhSrc === src && standing\) return/, 'the same page is not written');
  assert.match(r, /card\.innerHTML = jhnHeadHtml\(\) \+ body/, 'a different page changes only the card');
  assert.match(r, /host\._jhPanel !== panelBody/, 'the panel only where its words moved');
  const w = r.indexOf('host.innerHTML = html'), c = r.indexOf('card.innerHTML');
  assert.ok(c >= 0 && w > c, 'the whole page is the fallback, not the first road');
});

test('f1034 (5) the flash measure names who wrote late and what moved, at the owner\'s three screens', () => {
  const s = fs.readFileSync(path.join(__dirname, 'chromium', '_audit', 'flash-measure.js'), 'utf8');
  assert.match(s, /wrote late/);
  assert.match(s, /moved {7}/);
  assert.match(s, /\[1440, 780\], \[1536, 730\], \[1366, 950\]/);
});
