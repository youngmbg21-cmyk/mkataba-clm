/* f1161 · EXPLORER'S PANEL READS THE DRAWN MAP'S MODEL (22 Nov 2026, owner's pick "Find what's slow"; home-speed-verify 2:
   coming back to Explorer froze 242 ms against a 225 bar). Its readers built the whole map model afresh, three or four
   times a return, though the kept map held it. One reader igDrawnModel() returns the drawn map's model while it stands
   (the key igTurnFace keeps the map by), else builds. AT THE PARENT: no igDrawnModel, each reader builds. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const IG = strip(fs.readFileSync(path.join(__dirname, '..', 'js/views/intelligence.js'), 'utf8'));
const body = name => { const i = IG.indexOf('function ' + name + '('); assert.ok(i >= 0, name); return IG.slice(i, IG.indexOf('\n}\n', i)); };

test('f1161 (1) the drawn model while it stands, else a fresh build', () => {
  const b = body('igDrawnModel');
  assert.match(b, /IG&&IG\._model&&igMapUp\(\)/, 'only while the map is up and drawn');
  assert.match(b, /_igKept\.key===igKeptKey\(window\.state&&state\.contracts, intel\.groupBy, intel\.groups, intel\.lenses\)/, 'by the kept map\'s own key');
  assert.match(b, /return IG\._model;[\s\S]*return buildGraphModel\(\);/, 'else built afresh');
});

test('f1161 (2) the panel\'s readers ask it, never building one each', () => {
  for (const r of ['igOverviewHtml', 'igOverviewFive', 'igBriefBook', 'igMapNow']){
    assert.ok(body(r).includes('igDrawnModel()'), r + ' reads the drawn model');
    assert.ok(!body(r).includes('buildGraphModel()'), r + ' builds none of its own');
  }
  assert.match(body('igOverviewHtml'), /igOverviewFive\(shown, M\)/, 'the panel hands its one model on');
  assert.ok(body('igLegendPickIds').includes('buildGraphModel()'), 'the legend pick, which changes the lenses first, keeps its own build');
});
