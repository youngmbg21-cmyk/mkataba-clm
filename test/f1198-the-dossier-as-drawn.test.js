'use strict';
/* f1198 — THE DOSSIER AS DRAWN, ROUND A (owner, 24 Nov 2026: "you have to build as drawn. That was the plan").
   (1) the top card's drawn faces: their paper arrived (Plan the read · Read without a plan; "Not read by Jambo yet"), read
       with clauses to look at ("N clauses need a look before this goes to <them>"; Open the first clause · Edit the paper
       yourself; "Jambo read all N clauses … K had nothing to find"), what was owed said under it, never a signed paper;
   (2) a signed agreement: What needs you and Coming up, one reading for the headline, the black act and the rows; ours
       signed by whom; "Nothing waits for either side"; Renews its own row;
   (3) open lines: no boxes round the sections or the card's act;
   (4) the words, both books. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const PD = strip(R('js/paperdesk.js')), H = R('index.html'), I = R('js/i18n.js');
const fn = name => { const i = PD.indexOf('function ' + name + '('); assert.ok(i >= 0, name); return PD.slice(i, PD.indexOf('\n}', i) + 2); };

test('f1198 (1) the drawn faces of the top card', () => {
  const F = fn('pd2DrawnFaceOf');
  assert.match(F, /if \(!c \|\| pd2Sealed\(c\) \|\| !\['arrive', 'read', 'fill'\]\.includes\(focus\)\) return null;/);
  assert.match(F, /data-pd2-plan-open[\s\S]*pd2_plan_noplan/);
  assert.match(F, /window\.stkLivePoints\(c\)/);
  assert.match(F, /data-pd2-first-clause=[\s\S]*pd2_df_first[\s\S]*data-pd-glance="redline"[\s\S]*pd2_df_edit/);
  assert.match(F, /pd2_df_read_all/);
  assert.match(F, /const then = N && N\.head && N\.btns && N\.btns\.length \? T\('pd2_df_then'/);
  assert.match(fn('pd2CardHtml'), /const DF = pd2DrawnFaceOf\(c, D, R, focus, N\);/);
});
test('f1198 (2) a signed agreement as drawn: one reading of what it still asks', () => {
  assert.match(fn('pd2SignedNeedsHtml'), /pd2SignedNeedsOf\(c, D\)/);
  assert.match(fn('pd2CardHtml'), /const SN = AM \? pd2SignedNeedsOf\(c, D\) : \[\];[\s\S]*pd2_live_needs/);
  assert.match(fn('pd2ComingUpHtml'), /pd2_cu_signed[\s\S]*pd2_life_today[\s\S]*pd2_cu_ends/);
  assert.match(fn('pd2DlTwoHtml'), /pd2_two_signed_by/);
  assert.match(fn('pd2DealCardHtml'), /D && D\.executed \? 'pd2_dl_c_none_both'/);
  assert.match(fn('pd2Facts'), /k: 'renews', l: _pdT\('pd2_f_renews'\)/);
});
test('f1198 (3) open lines, no boxes', () => {
  assert.match(H, /#ig-dock \.pd2-dossier \.pd2-card\.is-five \.pd2-card-act\{margin:14px 0 0;padding:0;border-radius:0;background:none\}/);
  assert.match(H, /#ig-dock \.pd2-dossier > :is\(\.pd2-fd, \.pd2-famc, \.pd2-dlc\)\{margin:0;padding:14px 0;border:0;border-top:1px solid var\(--color-divider\);border-radius:0;background:none;box-shadow:none\}/);
});
test('f1198 (4) the words, both books', () => {
  for (const k of ['pd2_df_arrived', 'pd2_df_first', 'pd2_df_edit', 'pd2_df_read_all_other', 'pd2_df_then', 'pd2_sn_head', 'pd2_sn_pb_go', 'pd2_cu_head', 'pd2_live_needs_other', 'pd2_two_signed', 'pd2_two_signed_by', 'pd2_dl_c_none_both', 'pd2_f_renews', 'pd2_facts_off_paper'])
    assert.equal((I.match(new RegExp('^    ' + k + ': ', 'gm')) || []).length, 2, k);
});
