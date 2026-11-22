'use strict';
/* f1152 — ONE ROW, ONE DOOR ON SETTINGS' PANEL (owner, 22 Nov 2026: "The two jambo lessons links in the side panel are the
   same link"). Where a "Needs you" row already opens Jambo's lessons, the panel does not say the lessons again under it.
   AT THE PARENT it fails: the lessons group was pushed whenever lessons waited. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const S = fs.readFileSync(path.join(__dirname, '..', 'js/views/settings.js'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
test('f1152 the lessons are said once: not again under a needs-you row that opens them', () => {
  const i = S.indexOf('function sddCardHtml('); assert.ok(i > 0);
  const f = S.slice(i, S.indexOf('\nfunction ', i + 10));
  assert.match(f, /const lesShown=groups\.some\(g=>\(g\.rows\|\|\[\]\)\.some\(x=>\/data-st-panel="lessons"\/\.test\(String\(x\.attr\|\|''\)\)\)\);/);
  assert.match(f, /if\(admin&&les\.length&&!lesShown&&\(!area\|\|area==='jambo'\)\) groups\.push\(\{ label:i18t\('stn_p_lessons'\)/);
  assert.ok(f.indexOf('const lesShown=') > f.indexOf("groups.push({ label:i18t('sdd5_needs')"), 'read after the needs-you rows are drawn');
});
