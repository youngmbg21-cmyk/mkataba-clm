'use strict';
/* ═════════════════════════════════════════════════════════════════════════
   f564 — THE LANES SAY THE SAME AS THE CODE (Young picked "Swimlane" off the
   Brain Lanes proposal and approved its rule, 8 Oct 2026; flow rule 9b)

   The Brain's fourth view draws each flow as a process map. It must never be
   a drawing someone forgets to redraw, so nothing on it is typed twice: a box
   is a flow step the Brain already walks, its lane is its first part's own
   fact, its stage is the step's. This file is the rule, run on every change:

   (1) EVERY PART A FLOW NAMES SITS IN EXACTLY ONE LANE, and every name in the
       lanes is a real part.
   (2) EVERY FLOW STEP HAS A STAGE: one per step, each a known stage — a step
       added to a flow without its stage fails here.
   (3) EVERY KNOWN PROBLEM is numbered once, sits on a part some flow walks,
       and has its label, reason and fix in BOTH books. Fixing one takes its
       line off the list.
   (4) Every lane, stage and view word is in both books.
   (5) The check bites: a staged part with no lane, a staged step with no
       stage and a staged problem with no words each fail it.
   Browser: test/chromium/brain-lanes-verify.js.
   AT THE PARENT (9ee408d) every claim FAILS: there are no lanes.
   ═════════════════════════════════════════════════════════════════════════ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const B = require('../js/brainmap.js');
const I18N = fs.readFileSync(path.join(__dirname, '..', 'js', 'i18n.js'), 'utf8');
const inBoth = k => (I18N.match(new RegExp('\\n    ' + k + ': ', 'g')) || []).length === 2;

/* the gaps, read off a catalogue — the real one, or a staged one in (5) */
function laneGaps(flows = B.BRAIN_FLOWS, laneOf = B.BRAIN_LANE_OF, stages = B.BRAIN_FLOW_STAGES, problems = B.BRAIN_PROBLEMS, words = inBoth){
  const parts = new Set(B.BRAIN_PARTS.map(p => p.id));
  const walked = new Set(); flows.forEach(f => f.steps.forEach(s => s.forEach(id => walked.add(id))));
  const seen = {}; Object.values(laneOf).flat().forEach(id => { seen[id] = (seen[id] || 0) + 1; });
  const nums = problems.map(p => p.n);
  return {
    noLane: [...walked].filter(id => !seen[id]).sort(),
    twoLanes: Object.keys(seen).filter(id => seen[id] > 1).sort(),
    notAPart: Object.keys(seen).filter(id => !parts.has(id)).sort(),
    stagesOff: flows.filter(f => !Array.isArray(stages[f.id]) || stages[f.id].length !== f.steps.length || stages[f.id].some(s => !B.BRAIN_STAGES.includes(s))).map(f => f.id),
    problemsOff: problems.filter(p => !walked.has(p.part) || nums.indexOf(p.n) !== nums.lastIndexOf(p.n)
      || !['brn_pb_' + p.n, 'brn_pb_' + p.n + '_why', 'brn_pb_' + p.n + '_fix'].every(words)).map(p => p.n),
  };
}

describe('f564 (1–3) — the real catalogue has no gap', () => {
  const g = laneGaps();
  test('1a every part a flow names sits in a lane', () => assert.deepEqual(g.noLane, [], 'put each in BRAIN_LANE_OF (js/brainmap.js)'));
  test('1b and in only one', () => assert.deepEqual(g.twoLanes, []));
  test('1c every name in the lanes is a part', () => assert.deepEqual(g.notAPart, []));
  test('1d the lanes are the four kinds of hand', () => assert.deepEqual(B.BRAIN_LANES, ['req', 'own', 'hati', 'them']));
  test('2 every flow step has one known stage', () => assert.deepEqual(g.stagesOff, [], 'BRAIN_FLOW_STAGES: one stage per step'));
  test('3 every known problem sits on a walked part, once, in both books', () => assert.deepEqual(g.problemsOff, []));
});

describe('f564 (4) — the view is named in both books', () => {
  test('4a lanes, stages and the view', () => {
    const keys = ['brn_view_lanes', 'brn_ov_lanes', 'brn_hint_lanes', 'brn_lanes_sub', 'brn_lanes_more', 'brn_lanes_off', 'brn_lanes_off_tag',
      'brn_lanes_new', 'brn_pb_dialog', 'brn_pb_head', 'brn_pb_why', 'brn_pb_fix', 'brn_pb_close']
      .concat(B.BRAIN_LANES.map(k => 'brn_lane_' + k), B.BRAIN_STAGES.map(k => 'brn_stage_' + k));
    assert.deepEqual(keys.filter(k => !inBoth(k)), []);
  });
  test('4b the page draws the lanes as its fourth view, read off the catalogue', () => {
    const V = fs.readFileSync(path.join(__dirname, '..', 'js', 'views', 'brain.js'), 'utf8');
    assert.match(V, /const BR_VIEW_KEYS = BRAIN_VIEWS\.concat\('lanes'\);/);
    for (const r of ['brainLaneOf(st[0])', 'BRAIN_FLOW_STAGES[f.id]', 'BRAIN_PROBLEMS.filter', 'reviewGateCfg', 'deskEnforced', 'linkCodeCfg'])
      assert.ok(V.includes(r), r);
  });
});

describe('f564 (5) — the check bites', () => {
  const flows = B.BRAIN_FLOWS.map(f => ({ id: f.id, steps: f.steps.map(s => s.slice()) }));
  test('5a a part walked by a flow but in no lane', () => {
    const laneOf = Object.fromEntries(Object.entries(B.BRAIN_LANE_OF).map(([k, v]) => [k, v.filter(id => id !== 'docx')]));
    assert.deepEqual(laneGaps(flows, laneOf).noLane, ['docx']);
  });
  test('5b a step added with no stage', () => {
    const more = flows.map(f => f.id === 'round' ? { id: f.id, steps: f.steps.concat([['bell']]) } : f);
    assert.deepEqual(laneGaps(more).stagesOff, ['round']);
  });
  test('5c a problem with no words, or on a part nobody walks', () => {
    assert.deepEqual(laneGaps(flows, B.BRAIN_LANE_OF, B.BRAIN_FLOW_STAGES, [{ n: 98, part: 'email' }]).problemsOff, [98]);
    assert.deepEqual(laneGaps(flows, B.BRAIN_LANE_OF, B.BRAIN_FLOW_STAGES, [{ n: 1, part: 'nope' }]).problemsOff, [1]);
  });
});
