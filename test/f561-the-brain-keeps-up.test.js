'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f561 — EVERY CHANGE UPDATES THE BRAIN (Young, 8 Oct 2026: "I need one more
   rule which is for every change the brain should be updated accordingly")

   The rule was already written ("a new feature is named in BRAIN_PARTS and
   put in a flow"), and the 8 Oct merge "Copilot prepares, you press" still
   landed a new file, a new route and seven new acts with none of them named:
   a rule nobody runs is a wish. This file runs it, on every change:

   (1) A NEW FILE IS PLACED: every js/ and server/ file carries at least one
       named part, and every js/ file outside views/ has an area line in
       BRAIN_FILE_REGION — or it stood unnamed on 8 Oct (test/brain-known.json).
   (2) A NEW ROUTE IS NAMED: every server route is a part, or was there on 8 Oct.
   (3) EVERY PART STANDS IN A FLOW: a part nobody walks through is a dot with
       no story — or it stood that way on 8 Oct.
   (4) THE OLD DEBT ONLY SHRINKS: every entry in brain-known.json is still
       uncovered; one that has been named is taken off the list, never left.
   (5) The check bites: a staged new file, route and part each fail it.

   AT THE PARENT (5585d67) (1) fails on js/copilotacts.js and (2) on
   POST /api/contracts/:id/pass: the merge that prompted the rule.
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.join(__dirname, '..');
const B = require('../js/brainmap.js');
const KNOWN = JSON.parse(fs.readFileSync(path.join(__dirname, 'brain-known.json'), 'utf8'));

const codeFiles = () => {
  const out = {};
  const walk = rel => { for (const e of fs.readdirSync(path.join(ROOT, rel), { withFileTypes: true })){
    const r = rel + '/' + e.name; if (e.isDirectory()) walk(r); else if (e.name.endsWith('.js')) out[r] = fs.readFileSync(path.join(ROOT, r), 'utf8'); } };
  walk('js'); walk('server');
  return out;
};
const ROUTE = /^(GET|POST|PUT|PATCH|DELETE) /;

/* The four gaps, read off a set of files. One reading, used by the real check
   and by the staged ones in (5), so the staged ones prove the real one bites. */
function brainGaps(files, parts = B.BRAIN_PARTS, flows = B.BRAIN_FLOWS){
  const m = B.brainRead(files);
  const placed = new Set();
  for (const p of parts){
    const defs = B.brainDefs(p);
    for (const f of Object.keys(files).sort()){ if (defs.some(d => files[f].includes(d))){ placed.add(f); break; } }
  }
  const codes = new Set(parts.map(p => p.code));
  const walked = new Set(); flows.forEach(fl => fl.steps.forEach(s => s.forEach(id => walked.add(id))));
  return {
    filesWithoutPart: Object.keys(files).filter(f => !placed.has(f)).sort(),
    filesWithoutArea: Object.keys(files).filter(f => /^js\/(?!views\/)/.test(f) && !B.BRAIN_FILE_REGION.some(([re]) => re.test(f))).sort(),
    routesUnnamed: m.published.filter(p => ROUTE.test(p.name) && !codes.has(p.name)).map(p => p.name).sort(),
    partsWithoutFlow: parts.map(p => p.id).filter(id => !walked.has(id)).sort(),
  };
}
const SAY = {
  filesWithoutPart: 'a new file with no named part: name at least one of its acts in BRAIN_PARTS (js/brainmap.js), with brn_p_/brn_pd_ words in both books',
  filesWithoutArea: 'a new js/ file with no area: add it to a BRAIN_FILE_REGION line, or its parts land in the wrong area',
  routesUnnamed: 'a new server route not named in BRAIN_PARTS: name it as a part ("POST /api/…") and put it in a flow',
  partsWithoutFlow: 'a part in no flow: join it to an EXISTING step of a flow in BRAIN_FLOWS (never insert a step)',
};
const fresh = (gaps, k) => gaps[k].filter(x => !KNOWN[k].includes(x));

describe('f561 — every change updates the Brain', () => {
  const gaps = brainGaps(codeFiles());
  for (const [n, k] of [[1, 'filesWithoutPart'], [1, 'filesWithoutArea'], [2, 'routesUnnamed'], [3, 'partsWithoutFlow']]){
    test(`(${n}) ${k}: nothing new is left out of the Brain`, () => {
      assert.deepEqual(fresh(gaps, k), [], SAY[k]);
    });
  }
  test('(4) the 8 Oct list only shrinks: whatever has since been named comes off it', () => {
    for (const k of Object.keys(SAY)){
      const named = KNOWN[k].filter(x => !gaps[k].includes(x));
      assert.deepEqual(named, [], `${k}: these are named now (or gone); take them off test/brain-known.json`);
    }
  });
  test('(4b) the list carries nothing from after the rule began', () => {
    assert.ok(!KNOWN.filesWithoutPart.includes('js/copilotacts.js'), 'the file that prompted the rule is named, not excused');
    assert.ok(!KNOWN.routesUnnamed.includes('POST /api/contracts/:id/pass'), 'the route that prompted the rule is named, not excused');
  });
  test('(5) the check bites: a staged new file, route and part each fail it', () => {
    const files = Object.assign({}, codeFiles(), {
      'js/newthing.js': 'function newThingDoes(){ return 1; }\nObject.assign(window, { newThingDoes });\n',
      'server/extra.js': "app.post('/api/new-thing', (req, res) => res.json({}));\n",
    });
    const orphan = { id: 'orphanpart', code: 'newThingDoes', reg: 'see', floor: 1, def: '', men: '' };
    const g = brainGaps(files, B.BRAIN_PARTS.concat([orphan]));
    assert.ok(fresh(g, 'filesWithoutPart').includes('server/extra.js'), 'a new file with no part is caught');
    assert.ok(fresh(g, 'filesWithoutArea').includes('js/newthing.js'), 'a new file with no area is caught');
    assert.ok(fresh(g, 'routesUnnamed').includes('POST /api/new-thing'), 'a new route is caught');
    assert.ok(fresh(g, 'partsWithoutFlow').includes('orphanpart'), 'a part in no flow is caught');
  });
  test('(6) the merge that prompted the rule is in the Brain, each part walked by a flow', () => {
    const ids = ['copilotask', 'draftcard', 'paperjobs', 'papermark', 'homepaper', 'citedoor', 'passroute', 'agentlevel', 'linkkeep', 'readings'];
    const m = B.brainRead(codeFiles());
    for (const id of ids) assert.ok(m.parts[id] && m.parts[id].found, id + ' is a named part found in the code');
    assert.equal(B.brainRegionOfFile('js/copilotacts.js'), 'ai', 'the Copilot file sits in the AI area, not the wall');
  });
});
