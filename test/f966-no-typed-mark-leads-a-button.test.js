'use strict';
/* f966 — NO TYPED MARK LEADS A BUTTON (round 0 of docs/PLAN-the-legora-way.md, owner, 31 Oct 2026): a typed
   ×, ⋯, ✦, ★, ✓ or arrow prints at the reader's text size in the text face; a drawn icon (icon(), js/components.js)
   sits at its rung in the same hairline as every other symbol. Every button whose label starts with a typed mark
   was replaced on 31 Oct 2026; this keeps it so. A label may still say a mark inside a sentence. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const LEAD = /<button[^>]*>\s*(?:<(?!\/)[^>]+>\s*)*[✦✎⇪↺▶⋯▾▼↑⇥◷✓✕×🗑★⚠]/g;
const stripCom = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const leadsIn = src => (stripCom(src).match(LEAD) || []).length;
const files = () => ['index.html',
  ...fs.readdirSync(path.join(ROOT, 'js')).filter(f => f.endsWith('.js')).map(f => 'js/' + f),
  ...fs.readdirSync(path.join(ROOT, 'js/views')).filter(f => f.endsWith('.js')).map(f => 'js/views/' + f)];

test('f966 (1) no button\'s label starts with a typed mark', () => {
  const bad = files().map(f => [f, leadsIn(fs.readFileSync(path.join(ROOT, f), 'utf8'))]).filter(([, n]) => n);
  assert.deepEqual(bad, []);
});
test('f966 (2) the marks they became are drawn', () => {
  const C = fs.readFileSync(path.join(ROOT, 'js/components.js'), 'utf8');
  for (const k of ['x', 'more', 'sparkle', 'star']) assert.match(C, new RegExp('\\n  ' + k + ":'<"), k + ' is in ICONS');
});
test('f966 (3) the check bites', () => {
  assert.equal(leadsIn('<button type="button">×</button>'), 1);
  assert.equal(leadsIn('<button type="button" aria-label="Close">${icon(\'x\')}</button>'), 0);
});
