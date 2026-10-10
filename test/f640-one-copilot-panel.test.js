/* f640 — ONE COPILOT PANEL FOR PLAYBOOK AND RISKS (Young, 10 Oct 2026; the
   "HaTi Proposals" artifact, Part 1)
   (1) the Suggestions tab is called Playbook, in both books, with a count
   (2) every Suggested wording card offers Apply · Discard, then Applied · Undo;
       Undo only while the box still holds what Apply left; the risk's card
       carries its own buttons (no Apply strip)
   (3) one foot: ‹ k of n › and Save; no Discard, no Skip, no Save & next
   (4) the Playbook walk is the clauses the playbook flags, in contract order
   Run: node --test test/f640-one-copilot-panel.test.js */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const CE = fs.readFileSync(path.join(__dirname, '..', 'js', 'views', 'clauseeditor.js'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const I18N = fs.readFileSync(path.join(__dirname, '..', 'js', 'i18n.js'), 'utf8');
function fn(src, name){
  const at = src.search(new RegExp('(async )?function ' + name + '\\('));
  assert.ok(at > -1, 'no function ' + name);
  const open = src.indexOf('{', src.indexOf(')', at)); let d = 0;
  for (let i = open; i < src.length; i++){ if (src[i] === '{') d++; else if (src[i] === '}' && !--d) return src.slice(at, i + 1); }
  throw new Error('unbalanced ' + name);
}

test('f640 (1) the tab is Playbook, with a count', () => {
  assert.match(I18N, /ce_tab_chat: 'Playbook',/);
  assert.match(I18N, /ce_tab_chat: 'Spelbok',/);
  assert.match(CE, /data-ce-tab="chat">\$\{_cet\('ce_tab_chat'\)\}<span class="n" id="ce-pb-n"><\/span>/);
  assert.match(fn(CE, 'ceRenderTabs'), /cePbWalkIds\(\)\.length/);
});

test('f640 (2) Apply · Discard, then Applied · Undo, on every card', () => {
  const acts = fn(CE, 'ceCardActsInner');
  assert.match(acts, /data-ce-apply=/);
  assert.match(acts, /data-ce-card-discard=/);
  assert.match(acts, /data-ce-card-undo=/);
  assert.match(acts, /is-applied/);
  assert.match(fn(CE, 'ceCardState'), /card\._after != null && cur === _cePlain\(card\._after\)/, 'Undo only while the box holds what Apply left');
  assert.match(fn(CE, 'ceRiskDocks'), /return false;/, 'no Apply strip on Risks');
  for (const k of ['ce_sug_discard', 'ce_sug_undo', 'ce_sug_discarded', 'ce_walk_of'])
    assert.equal(I18N.split(k + ':').length - 1, 2, k + ' in both books');
});

test('f640 (3) one foot: the walk and Save', () => {
  const foot = fn(CE, 'ceRenderFoot');
  assert.match(foot, /data-ce-act="walk-prev"/);
  assert.match(foot, /data-ce-act="walk-next"/);
  assert.match(foot, /data-ce-act="save"/);
  assert.doesNotMatch(foot, /data-ce-act="discard"/);
  assert.doesNotMatch(fn(CE, 'ceRenderRiskFoot'), /rk-save|rk-skip|rk-prev/);
  assert.match(CE, /case 'walk-next': ceWalkPress\(1\); break;/);
  assert.match(fn(CE, 'ceWalkPress'), /riskWalkPress\(_ceC, dir < 0 \? 'prev' : 'skip'\)/);
});

test('f640 (4) the Playbook walk: flagged clauses, in order, read raw', () => {
  const w = fn(CE, 'cePbWalkIds');
  assert.match(w, /status === 'deviation'/);
  assert.match(w, /rlPbFindClause/);
  assert.doesNotMatch(w, /negoInit|persist\(/);
  assert.match(fn(CE, 'ceSaveAndOn'), /ceGoClause\(w\.ids\[w\.k\]/);
});
