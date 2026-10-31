'use strict';
/* f964 — THE MAP IS PART OF THE PLATFORM (owner, 31 Oct 2026: "include the map to the platform when we decide
   to build and it has to be updated as the page changes shape over time as a rule"; round 0 of
   docs/PLAN-the-legora-way.md).

   ONE TABLE, FLOW_MAP (js/flowmap.js): every word Jambo can open (CA_PLACES) has its row — a stage, the step
   that moves a person on with no press, at most five doors above Jambo's box, and what Jambo predicts — and
   every target it names is itself a place. A change that adds, moves or removes a page, a door or a step
   updates the table in the same change, or this fails. (5) proves the check bites. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');
const R = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

function loadMap(src){
  const win = {}; const ctx = { window: win, Object }; vm.createContext(ctx);
  vm.runInContext(src.replace(/^export\s+/gm, ''), ctx);
  /* plain objects of this realm, so deepEqual compares values, not prototypes */
  const plain = v => JSON.parse(JSON.stringify(v));
  return { FLOW_STAGES: plain(win.FLOW_STAGES), FLOW_MAP: plain(win.FLOW_MAP), FLOW_SPINE: plain(win.FLOW_SPINE), FLOW_DOORS_MAX: win.FLOW_DOORS_MAX };
}
const placeKeys = () => {
  const CA = R('js/copilotacts.js'); const i = CA.indexOf('const CA_PLACES = [');
  assert.ok(i >= 0, 'CA_PLACES is found');
  return [...CA.slice(i, CA.indexOf('\n];', i)).matchAll(/\{\s*k:\s*'([a-z]+)'/g)].map(m => m[1]);
};
/* the rule itself, as a function, so (5) can hand it a broken table */
function mapFaults(M, places){
  const faults = [];
  const keys = new Set(M.FLOW_MAP.map(r => r.k));
  const stages = new Set(M.FLOW_STAGES.map(s => s.k));
  for (const k of places) if (!keys.has(k)) faults.push('not on the map: ' + k);
  for (const r of M.FLOW_MAP){
    if (!places.includes(r.k)) faults.push('on the map but not a place: ' + r.k);
    if (!stages.has(r.st)) faults.push(r.k + ' has no stage');
    if (!r.s || !r.s.en || !r.s.sv) faults.push(r.k + ' is not said in both books');
    if ((r.d || []).length > M.FLOW_DOORS_MAX) faults.push(r.k + ' has more than ' + M.FLOW_DOORS_MAX + ' doors');
    for (const t of r.d || []) if (!keys.has(t)) faults.push(r.k + ' door to no place: ' + t);
    for (const [t, w] of [...(r.a || []), ...(r.p || [])]){
      if (!keys.has(t)) faults.push(r.k + ' leads to no place: ' + t);
      if (!w || !w.en || !w.sv) faults.push(r.k + ' → ' + t + ' is not said in both books');
    }
  }
  for (const [a, b] of M.FLOW_SPINE) if (!keys.has(a) || !keys.has(b)) faults.push('the spine names no place: ' + a + ' → ' + b);
  return faults;
}

test('f964 (1) every place is on the map, and only places', () => {
  const M = loadMap(R('js/flowmap.js'));
  assert.deepEqual(mapFaults(M, placeKeys()), []);
});
test('f964 (2) one hub: the paper with its Dossier', () => {
  const M = loadMap(R('js/flowmap.js'));
  assert.deepEqual(M.FLOW_MAP.filter(r => r.hub).map(r => r.k), ['document']);
});
test('f964 (3) the spine runs the contract\'s life, in order', () => {
  const M = loadMap(R('js/flowmap.js'));
  assert.deepEqual(M.FLOW_STAGES.filter(s => s.spine).map(s => s.k), ['arrive', 'read', 'nego', 'sign', 'live']);
});
test('f964 (4) the map is a page: opened, kept, guided, typed, in the book and the Brain', () => {
  const APP = R('js/app.js'), CA = R('js/copilotacts.js'), CORE = R('js/core.js'), NAV = R('js/navmap.js'), BR = R('js/brainmap.js'), HBK = R('js/handbook.js');
  assert.match(APP, /import '\.\/flowmap\.js';/);
  assert.match(APP, /import '\.\/views\/flowmap\.js';/);
  assert.match(APP, /else if\(view==='flowmap'\) renderFlowMap\(\);/);
  assert.match(APP, /flowmap:\['fmPlace','fmPlacePut'\]/, 'a refresh lands at the same spot');
  assert.match(APP, /guideRowHtml\('flowmap',here,'is-foot'\)/, 'the Guide row');
  assert.match(CORE, /'pulse','flowmap'/, 'setView knows it at start');
  assert.match(CA, /\{ k: 'flowmap', w: \['flowmap', 'flow map'/, 'its words');
  assert.match(CA, /'handbook', 'flowmap', 'house'/, 'its name typed moves there free');
  assert.match(CA, /flowmap: \(\) => setView\('flowmap'\)/, 'Jambo\'s one mover opens it');
  assert.match(NAV, /\['flowmap', \/ \(flow map\|/, 'navigable by typing');
  assert.ok(BR.includes("['flowmap', 'renderFlowMap', 'see', 0]") && BR.includes("['flowtable', 'FLOW_MAP', 'see', 1]"), 'the Brain names it');
  assert.match(HBK, /doors: \['flowmap'\]/, 'its Handbook chapter (rule 9d)');
  const I = R('js/i18n.js'); const EN = I.slice(I.indexOf('  en: {'), I.indexOf('  sv: {')), SV = I.slice(I.indexOf('  sv: {'));
  for (const k of ['nav_flowmap', 'ca_w_flowmap', 'gd_p_flowmap', 'gd_w_flowmap', 'fm_head_sub', 'fm_jl_say', 'fm_open', 'brn_p_flowmap'])
    for (const [nm, B] of [['English', EN], ['Swedish', SV]]) assert.ok(new RegExp('\\n    ' + k + ':').test(B), k + ' is in the ' + nm + ' book');
});
test('f964 (5) the check bites: a place dropped, a door to nowhere, six doors', () => {
  const M = loadMap(R('js/flowmap.js')); const places = placeKeys();
  const drop = { ...M, FLOW_MAP: M.FLOW_MAP.filter(r => r.k !== 'calendar') };
  assert.ok(mapFaults(drop, places).some(f => /not on the map: calendar/.test(f)));
  const bad = { ...M, FLOW_MAP: M.FLOW_MAP.map(r => r.k === 'board' ? { ...r, d: ['nowhere'] } : r) };
  assert.ok(mapFaults(bad, places).some(f => /door to no place: nowhere/.test(f)));
  const six = { ...M, FLOW_MAP: M.FLOW_MAP.map(r => r.k === 'board' ? { ...r, d: ['contracts', 'explorer', 'calendar', 'work', 'counter', 'reads'] } : r) };
  assert.ok(mapFaults(six, places).some(f => /more than 5 doors/.test(f)));
});
test('f964 (6) the doors above Jambo\'s box are the map\'s (round 1, 31 Oct 2026)', () => {
  const C = R('js/components.js');
  const i = C.indexOf('function jamboDoorsHere('); assert.ok(i >= 0, 'jamboDoorsHere is found');
  const body = C.slice(i, C.indexOf('\n}', i));
  assert.match(body, /flowMapRow\(k\)/, 'the doors are read from the flow map, never typed beside the box');
  assert.match(body, /row\.d\.filter/, 'the row\'s own doors');
  assert.match(C, /document\.addEventListener\('click'[\s\S]{0,200}data-jb-door[\s\S]{0,200}caGo\(/, 'a door moves through the one mover');
});
