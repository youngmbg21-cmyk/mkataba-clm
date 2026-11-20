'use strict';
/* f1119 — GROUP F ON THE ONE EDIT POP-UP (owner, 19 Nov 2026: "Fix all batches"): the settings, requests, advice,
   calendar and list pop-ups move off their hand-made boxes onto the one Legora sheet (lgpOpen / lgpHtml, and
   lgpStepsHtml where more than about seven lines become steps, never a scroll).
   1 · Two-step sign-in: the key and the code as lines; the codes sheet's ✕ is the same press as "I have saved them".
       Every id and every call to the server exactly as it was (security-relevant).
   2 · The playbook editor in three steps (name · positions · limits); the clause editor; the approval rule editor.
   3 · Advice: the request (three steps), the rate card (a service a line), logging a request.
   4 · Ask for a contract: three steps in one form; each essential a line with the label beside the words.
   5 · Calendar: one event, share with a colleague.
   6 · Adapt filters: a paged tick list holding its ticks across pages; Reset on the left, Done black.
   7 · The stepped sheet is ONE builder (lgpStepsHtml, lgpStepGo) in js/components.js.
   At the parent none of these hold, so every claim fails. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const fnBody = (src, name) => { const i = src.search(new RegExp('(?:async )?function ' + name + '\\(')); assert.ok(i >= 0, name); return src.slice(i, src.indexOf('\n}', i) + 2); };
const OLD = /class="p-6"|class="field"|<div style="padding:2[0-4]px|<div class="cal-evd"|class="rvd-head"|class="sap-body"/;
const has = (body, ids) => { for (const id of ids) assert.ok(body.includes(id), id); };

test('f1119 (7) the stepped sheet is one builder, published', () => {
  const C = read('js/components.js');
  const S = strip(fnBody(C, 'lgpStepsHtml'));
  assert.match(S, /lgpHtml\(Object\.assign\(\{\}, o, \{ primary: null, back: null, left: null, note: '', attr: `data-lgp-steps/);
  assert.match(S, /data-lgp-next/); assert.match(S, /data-lgp-act/); assert.match(S, /data-lgp-back/);
  assert.match(S, /\.replace\(\/<div class="lgp-ft">\[\\s\\S\]\*\$\/, \(\) => foot\)/, 'the foot is put in by a function (no $ pattern in a label)');
  const G = strip(fnBody(C, 'lgpStepGo'));
  assert.match(G, /p\.hidden = Number\(p\.getAttribute\('data-lgp-step'\)\) !== n/);
  assert.match(G, /\[data-lgp-act\]'\)\.hidden = n < last/, 'the black act only on the last step');
  assert.match(strip(fnBody(C, 'lgpOpen')), /o\.stepped \? lgpStepsHtml\(o\) : lgpHtml\(o\)/);
  assert.match(C, /Object\.assign\(window, \{[^}]*lgpStepsHtml, lgpStepGo \}\)/);
});

test('f1119 (1) two-step sign-in on the one sheet, its calls unchanged', () => {
  const T = strip(fnBody(read('js/views/settings.js'), 'stTwoStepToggle'));
  assert.doesNotMatch(T, OLD);
  assert.match(T, /lgpOpen\(\{ id:'ts-form'/); assert.match(T, /lgpOpen\(\{ id:'ts-codes'/);
  has(T, ['id="ts-code"', 'autocomplete="one-time-code"', 'id="ts-err"', 'id="ts-confirm"', 'id="ts-cancel"', 'id="ts-done"']);
  for (const call of ["api('me/totp/disable','POST',{ code:String(code).trim() })", "api('me/totp/start','POST',{})", "api('me/totp/verify','POST',{ code })"]) assert.ok(T.includes(call), call);
  assert.match(T, /tsX\.removeAttribute\('data-lgp-close'\); tsX\.addEventListener\('click',\(\)=>document\.getElementById\('ts-done'\)\?\.click\(\)\)/, 'its ✕ is the Done press');
});

test('f1119 (2) the playbook, clause and approval-rule editors', () => {
  const SET = read('js/views/settings.js');
  const P = strip(fnBody(SET, 'openPlaybookEditor'));
  assert.doesNotMatch(P, OLD); assert.doesNotMatch(P, /border:1px solid var\(--color-divider\);border-radius:var\(--radius\)/, 'no boxed rows');
  assert.match(P, /lgpOpen\(\{ stepped:true, id:'pb-form'/);
  for (const n of [1, 2, 3]) assert.ok(P.includes(`data-lgp-step="${n}"`), 'step ' + n);
  has(P, ['id="pb-f-label"', 'id="pb-f-match"', "'pb-add-pos'", "'pb-add-rng'", 'id="pb-pos-list"', 'id="pb-rng-list"', 'id="pb-save"', 'id="pb-cancel"', 'savePlaybook(pb)']);
  assert.match(P, /pbGo\(\/data-pb-rlabel\/\.test\(at\)\?3:2\)/, 'a standard asked for opens on its own step');
  assert.match(P, /<button type="button" class="lgp-chip/, 'the three positions are pills');
  const CE = strip(fnBody(SET, 'openClauseEditor'));
  assert.doesNotMatch(CE, OLD); assert.match(CE, /lgpOpen\(\{ id:'ce-form'/);
  has(CE, ["id:'ce-'+k", 'id="ce-save"', 'id="ce-cancel"', 'saveClauseLibrary(lib)']);
  const AR = strip(fnBody(SET, 'openApprovalRuleEditor'));
  assert.doesNotMatch(AR, OLD); assert.match(AR, /lgpOpen\(\{ id:'ar-form'/);
  has(AR, ['id="ar-cond"', 'id="ar-condval"', "id:'ar-approver'", "id:'ar-order'", 'id="ar-says"', 'id="ar-save"', 'id="ar-cancel"', "if(apRaw==='orphan'){ toast(i18t('set_pick_approver'),'err'); return; }"]);
});

test('f1119 (3) advice: the request, the rate card, logging a request', () => {
  const A = read('js/views/advice.js');
  const M = strip(fnBody(A, 'openAdviceModal'));
  assert.doesNotMatch(M, OLD); assert.match(M, /lgpOpen\(\{ stepped:true, id:'adv-form'/);
  has(M, ['id="adv-copy-track"', "id:'adv-assignee'", "id:'adv-status'", "id:'adv-note'", 'id="adv-save"', 'updateAdviceRequest(r.id, patch)']);
  const R = strip(fnBody(A, 'openRateCardModal'));
  assert.doesNotMatch(R, OLD); assert.doesNotMatch(R, /<table/); assert.match(R, /lgpOpen\(\{ id:'rt-form'/);
  has(R, ["'rt-rate-'+s.id", "'rt-min-'+s.id", "'rt-max-'+s.id", "'rt-days-'+s.id", 'id="rt-save"']);
  const I = strip(fnBody(A, 'openAdviceIntakeModal'));
  assert.doesNotMatch(I, OLD); assert.match(I, /lgpOpen\(\{ id:'ai-form'/);
  has(I, ["id:'ai-service'", "id:'ai-name'", "id:'ai-email'", "id:'ai-company'", "id:'ai-contract'", "id:'ai-desc'", 'id="ai-priority"', 'id="ai-go"']);
});

test('f1119 (4) ask for a contract: three steps in one form, each essential a line', () => {
  const IK = read('js/views/intake.js');
  const F = strip(fnBody(IK, 'openIntakeForm'));
  assert.doesNotMatch(F, OLD); assert.match(F, /lgpOpen\(\{ stepped:true, id:'ik-form'/);
  for (const n of [1, 2, 3]) assert.ok(F.includes(`data-lgp-step="${n}"`), 'step ' + n);
  has(F, ['id="ik-lead"', 'id="ik-title"', 'id="ik-need"', 'id="ik-files-go"', 'id="ik-files"', 'id="ik-err"', 'id="ik-send"', 'id="ik-cancel"']);
  assert.match(F, /ikGo\(2\); say\(i18t\('ik_bad_email'\)\)/, 'a refusal lands on the step holding the field');
  const C = strip(fnBody(IK, 'ikSapField'));
  assert.doesNotMatch(C, /sap-f|style="\$\{FLD\}"/); assert.match(C, /class="lgp-row"/);
});

test('f1119 (5) calendar: one event, share', () => {
  const CAL = read('js/views/calendar.js');
  const E = strip(fnBody(CAL, 'calEventDialog'));
  assert.doesNotMatch(E, OLD); assert.match(E, /lgpOpen\(\{ id:'cal-ev-form'/);
  has(E, ["id:'cal-ev-title'", "id:'cal-ev-date'", 'id="cal-ev-all"', 'id="cal-ev-times"', "id:'cal-ev-start'", "id:'cal-ev-end'", 'id="cal-ev-ct"', 'id="cal-ev-say"', 'id="cal-ev-del"', 'id="cal-ev-save"', 'id="cal-ev-cancel"']);
  assert.match(E, /left:item\?\{ label:i18t\('cal_ev_delete'\), attr:'id="cal-ev-del"', danger:true \}:null/, 'Delete on the left, as an ending act');
  const S = strip(fnBody(CAL, 'openCalendarShare'));
  assert.doesNotMatch(S, OLD); assert.match(S, /lgpOpen\(\{ id:'cal-share-form'/);
  has(S, ["id:'cal-share-who'", "id:'cal-share-note'", 'id="cal-share-err"', 'id="cal-share-go"', "api('calendar/share','POST',{toId,note,lines})"]);
});

test('f1119 (6) adapt filters: a paged tick list that keeps its ticks', () => {
  const REG = read('js/views/register.js');
  const i = REG.indexOf("document.getElementById('reg-adapt')?.addEventListener('click'"); assert.ok(i > 0);
  const H = strip(REG.slice(i, REG.indexOf('\n  });', i)));
  assert.doesNotMatch(H, /padding:var\(--s-4\) 18px/); assert.match(H, /lgpOpen\(sheet\(\)\)/);
  assert.match(H, /lgpListHtml\(\{ page, tickAttr:'data-adapt', pageAttr:'data-adapt-page'/);
  assert.match(H, /disabled:!!f\.fixed/, 'a fixed filter is shown ticked and disabled');
  assert.match(H, /lgpRepaint\(sheet\(\)\)/); assert.match(H, /if\(b\.checked\) ticked\.add\(k\); else ticked\.delete\(k\);/);
  has(H, ['id="reg-adapt-reset"', 'id="reg-adapt-done"', 'regBarSetChosen(read())', 'regBarSetChosen(REG_BAR_DEFAULT.slice())']);
});

test('f1119 the new words are in both books', () => {
  const I = read('js/i18n.js');
  for (const k of ['ts_key_k', 'ts_code_k', 'adv_step_request', 'adv_step_trail', 'adv_step_update', 'ik_step_ask', 'ik_step_who', 'ik_step_terms'])
    assert.equal((I.match(new RegExp('^\\s*' + k + ':', 'gm')) || []).length, 2, k);
});
