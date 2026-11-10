'use strict';
/* f997 — THE WALL'S CIRCLES ARE THE PLATFORM'S (owner, 10 Nov 2026, over a picture of the wall: "the circles need to
   match what other circles in the platform"). In the new look the wall's papers, and a party's own list of agreements,
   wore the older ring (a dotted or half-filled outline, regStageMarkHtml) while the list beside them wears the SAP way
   mark (regSapMarkHtml: a filled circle, ✓ ! i × –). One reading (regSapMarkOf), one mark, on the list, the wall and
   the party's page. At the parent both draw the older ring and the mark is not published. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const read = f => strip(fs.readFileSync(path.join(__dirname, '..', f), 'utf8'));
const fnBody = (src, name) => { const i = src.indexOf('function ' + name + '('); assert.ok(i >= 0, name); return src.slice(i, src.indexOf('\n}', i)); };

test('f997 (1) the wall\'s new-look paper wears the list\'s own mark', () => {
  const nl = fnBody(read('js/views/intelligence.js'), 'igWallCardHtml');
  const at = nl.indexOf('newLookOn()'); assert.ok(at > 0, 'the new-look branch');
  const mark = /const mark=([^;]+);/.exec(nl.slice(at)); assert.ok(mark, 'its mark');
  assert.match(mark[1], /^typeof window\.regSapMarkHtml==='function'\?regSapMarkHtml\(c\):/, 'the shared mark first');
});

test('f997 (2) a party\'s own agreements wear it too', () => {
  assert.match(read('js/views/customers.js'), /class="cunp-mk">\$\{typeof regSapMarkHtml === 'function' \? regSapMarkHtml\(c\) :/);
});

test('f997 (3) the mark and its reading are published once, by the register', () => {
  const R = read('js/views/register.js');
  const pubs = R.split('Object.assign(window').slice(1).map(x => x.slice(0, x.indexOf('});')));
  const one = pubs.filter(x => /\bregSapMarkHtml,/.test(x));
  assert.equal(one.length, 1, 'published once'); assert.match(one[0], /\bregSapMarkOf,/); assert.match(one[0], /\bregStageMarkHtml,/, 'beside the older mark');
});
