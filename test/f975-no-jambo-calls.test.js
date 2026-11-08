'use strict';
/* f975 — NOTHING IS SAID ABOUT JAMBO CALLS (owner, 8 Nov 2026: "remove all information related to jambo calls across
   the platform"; asked: "Keep admin spend" and the "no call / free / nothing spent" lines "Remove them too").
   1 · no label in either book speaks of calls, of a read being free, or of costing nothing — except the admin's own
       spending and limits pages, the Brain (the admin's map of the machine), and words that only look alike
       ("Before the call", "What the paper calls them", "free time", "a free room")
   2 · the retired cost labels stay empty in both books, so a spot that still asks for one draws nothing
   3 · the Handbook says no cost: no cost column, no cost line under a chapter, none in what Jambo reads of it
   At the parent: 1 finds hundreds of labels; 2 finds "1 call", "free"; 3 finds the cost column and line. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { STRINGS } = require('../js/i18n.js');
const { RETIRED_COST_KEYS } = require('./retired-cost-keys.js');

const CALL_RE = /\bJambo calls?\b|\b\d+ calls?\b|\bone call\b|\{calls\}|\bno call\b|\bcalls?\b|anrop|costs? nothing|kostar inget|\bis free\b|\bfree\b|gratis/i;
/* the admin's spending and limits, the Brain, and look-alike words — kept on purpose */
const KEPT = new Set(['ai_brain_browser_hint', 'cu_br_h', 'mig_cf_say_unsigned', 'py_role', 'set_work_word', 'set_workshape_sub',
  'foot_spend_title', 'set_ai_navigate_cost', 'set_local_mode_note', 'set_renewal_prep_body', 'set_spend_money', 'set_spend_people_note',
  'set_thorough_warn', 'set_today_free_one', 'set_today_free_other', 'set_today_of_one', 'set_today_of_other', 'st_cf_day_calls_one',
  'st_cf_day_calls_other', 'cal_plan_none', 'cal_plan_dropped_one', 'cal_plan_dropped_other', 'cal_plan_p_hour', 'ng_start_pick_none',
  'st_acc_free', 'st_lessons_note', 'tb_free', 'jh_free', 'jh_tip_free_t']);
const kept = k => KEPT.has(k) || /^(brn_|set_lim_|set_spend|ag_stop_|st_acc_stopped)/.test(k);
const val = (L, k) => { const d = Object.getOwnPropertyDescriptor(STRINGS[L], k); return d && typeof d.value === 'string' ? d.value : ''; };

test('1 · no label speaks of calls, of a free read, or of costing nothing', () => {
  const hits = [];
  for (const L of ['en', 'sv']) for (const k of Object.keys(STRINGS[L])) if (!kept(k) && CALL_RE.test(val(L, k))) hits.push(`${L} ${k}: ${val(L, k).slice(0, 90)}`);
  assert.deepEqual(hits, []);
});

test('2 · the retired cost labels are empty in both books', () => {
  for (const k of RETIRED_COST_KEYS) for (const L of ['en', 'sv']) assert.equal(val(L, k), '', `${L} ${k}`);
});

test('3 · the Handbook says no cost', () => {
  const V = fs.readFileSync(path.join(__dirname, '../js/views/handbook.js'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  assert.doesNotMatch(V, /hbkCostHtml\(/, 'no cost column, no cost line');
  const H = fs.readFileSync(path.join(__dirname, '../js/handbook.js'), 'utf8');
  const plain = H.slice(H.indexOf('function hbkChapterPlain'), H.indexOf('\n}\n', H.indexOf('function hbkChapterPlain')));
  assert.doesNotMatch(plain.replace(/\/\*[\s\S]*?\*\//g, ''), /\.cost\b/, 'what Jambo reads of a chapter carries no cost');
});
