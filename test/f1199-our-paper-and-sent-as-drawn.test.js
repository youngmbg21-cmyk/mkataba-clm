'use strict';
/* f1199 — THE DOSSIER AS DRAWN, ROUND B (owner, 24 Nov 2026: "you have to build as drawn"): What happens next and Kept once
   it is with them (pd2WaitOf's own reading); Details off detailsOf (the ONE owed list), each with the paper's words where it
   is a blank, Fill in on the paper; What was checked for our paper before it is sent (wording, Playbook with needs Legal,
   each detail filled); a departure the Playbook escalates says Needs Legal beside the paper, with what waits on it. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const PD = strip(R('js/paperdesk.js')), I = R('js/i18n.js');
const fn = name => { const i = PD.indexOf('function ' + name + '('); assert.ok(i >= 0, name); return PD.slice(i, PD.indexOf('\n}', i) + 2); };

test('f1199 (1) what happens next, only when it is with them', () => {
  const F = fn('pd2SentNextHtml');
  assert.match(F, /W = pd2WaitOf\(c, D\)/); assert.match(F, /if \(!W\) return '';/);
  assert.match(F, /pd2_sx_sent[\s\S]*pd2_sx_open[\s\S]*pd2_sx_reply[\s\S]*pd2_sx_reread/);
  assert.match(F, /data-pd2-sg-hist=/);
});
test('f1199 (2) details: the one owed list, filled on the paper', () => {
  const F = fn('pd2DetailsHtml');
  assert.match(F, /detailsOf\(c\)/); assert.match(F, /data-pd-fill-key=/); assert.doesNotMatch(F, /<input|<textarea/);
  assert.match(fn('pd2Facts'), /!String\(b\.value \|\| ''\)\.trim\(\) && sealed\)/, 'the facts no longer repeat an unsigned paper\'s blanks');
});
test('f1199 (3) what was checked: our paper, nothing left to fill, nothing sent', () => {
  const F = fn('pd2CheckedHtml');
  assert.match(F, /c\.upload \|\| c\.source === 'upload' \|\| !c\.template\) return '';/);
  assert.match(F, /D\.owed\.some\(r => r && r\.kind === 'fill'\)\) return '';/);
  assert.match(F, /pd2_ck_needs_legal/); assert.match(F, /sgTplApproval\(c, v,/);
});
test('f1199 (4) needs Legal beside the paper', () => {
  assert.match(fn('pd2StdNotes'), /word: _pdT\(v\.escalate \? 'pd2_std_needs_legal' : 'pd2_std_differs'\)/);
});
test('f1199 (5) the words, both books', () => {
  for (const k of ['pd2_sx_head', 'pd2_sx_kept', 'pd2_dx_head', 'pd2_ck_head', 'pd2_ck_needs_legal', 'pd2_std_needs_legal', 'pd2_std_legal_waits'])
    assert.equal((I.match(new RegExp('^    ' + k + ': ', 'gm')) || []).length, 2, k);
});
