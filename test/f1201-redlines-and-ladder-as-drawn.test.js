'use strict';
/* f1201 — THE DOSSIER AS DRAWN, ROUND D (owner, 24 Nov 2026: "you have to build as drawn"): Redlines with nothing on the
   table — Send to mark up and its promise, Draft from our Playbook with each gap (§, the paper's words, a soft badge, the
   row landing on its words) and the one drafting door as "Draft all N", Or yourself as open rows; the Ladder as a track —
   our position · fallback · walk-away · the cut line · their wording, "You are here" only where the figures say so, with
   no Playbook position the ask is "on the table" and no rung lit. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const NG = strip(R('js/views/negotiation.js')), I = R('js/i18n.js');
const fn = name => { const i = NG.indexOf('function ' + name + '('); assert.ok(i >= 0, name); return NG.slice(i, NG.indexOf('\n}', i) + 2); };
test('f1201 (1) nothing on the table, as drawn', () => {
  const E = fn('rlEmptyColumnActsHtml');
  assert.match(E, /rl_ed_nothing_sent/); for (const k of ['rl_ed_pb', 'rl_ed_gaps', 'rl_ed_draft_all']) assert.match(E, new RegExp(k));
  assert.match(E, /data-rl-gap-quote=/); assert.match(E, /prepare\.replace\(/, 'the one drafting door, renamed, never a second');
  assert.match(NG, /const gq = t\.closest\('\[data-rl-gap-quote\]'\);/);
});
test('f1201 (2) the Ladder track, never guessed', () => {
  const L = fn('rlLadderFiveHtml');
  assert.match(L, /const at = !st\.standard \? \(st\.ours \? 'mine' : 'theirs'\)/);
  assert.match(L, /rl_lt_pos_l[\s\S]*rl_lt_fb_l[\s\S]*rl_lt_walk_l[\s\S]*rl_lt_cut[\s\S]*rl_lt_theirs_l/);
  assert.match(L, /mid: ltrack/);
});
test('f1201 (3) the words, both books', () => {
  for (const k of ['rl_ed_pb', 'rl_ed_must', 'rl_ed_missing', 'rl_ed_hint', 'rl_lt_pos', 'rl_lt_mine', 'rl_lt_here', 'rl_lt_cut'])
    assert.equal((I.match(new RegExp('^    ' + k + ': ', 'gm')) || []).length, 2, k);
});
