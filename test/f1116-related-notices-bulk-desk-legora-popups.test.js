'use strict';
/* f1116 — GROUP C ON THE ONE EDIT POP-UP (owner, 19 Nov 2026: "Fix all batches" — every old-style edit pop-up moves
   onto the shared Legora sheet, lgpOpen/lgpHtml in js/components.js)
   1 · Link a related agreement (openLinkModal): the search a line typed in place, the matches quiet choices paged by
       six, how it relates and the note as lines; the same ids.
   2 · Create an amendment (openCreateAmendmentModal): its two steps kept — the change, then the wording — on the sheet,
       the steps named under the title, the clause list paged (a tick on another page is kept).
   3 · Record a notice served (openNoticeServedDialog): day, way, reference as three lines; withdrawing an earlier
       record is the ending act on the left.
   4 · The bulk acts on chosen contracts (cohortAmendAsk, cohortAskDocAsk).
   5 · The team desk (openDeskSheet, openDeskHandover, openDeskJoinAsk): the people as quiet lines, nothing boxed.
   At the parent every one of these is a hand-made box (p-6, field, the tinted head), so every claim fails. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const fnBody = (src, name) => { const i = src.search(new RegExp('(?:async )?function ' + name + '\\(')); assert.ok(i >= 0, name); return src.slice(i, src.indexOf('\n}', i) + 2); };
const OLD = /class="(?:p-6|field|field-grid|rvd-[a-z]+|sap-[a-z]+)"|_dkHead\(|HATI_FLD/;

test('f1116 (1) linking a related agreement is the one sheet', () => {
  const f = strip(fnBody(read('js/family.js'), 'openLinkModal'));
  assert.match(f, /lgpOpen\(\{ id:'lk-form'/);
  assert.doesNotMatch(f, OLD);
  for (const id of ["id:'lk-search'", "id:'lk-rel'", "id:'lk-note'", 'id="lk-results"', 'id="lk-err"', 'id="lk-save"', 'id="lk-standalone"', 'id="lk-cancel"', 'name="lk-pick"', 'name="lk-sug"'])
    assert.ok(f.includes(id), id);
  assert.match(f, /data-lk-page=/, 'the matches page, never scroll');
});

test('f1116 (2) an amendment keeps its two steps on the one sheet', () => {
  const f = strip(fnBody(read('js/family.js'), 'openCreateAmendmentModal'));
  assert.match(f, /openModal\(`<form class="lgp" id="am-dlg" novalidate><\/form>`, \{ maxWidth: window\.LGP_W/);
  assert.doesNotMatch(f, OLD);
  assert.match(f, /\[i18t\('fa_step_change'\), i18t\('fa_step_wording'\)\]/, 'the two steps named under the title');
  for (const id of ['id="am-note"', 'id="am-rel"', 'id="am-name"', 'id="am-ai"', 'id="am-blank"', 'id="am-back"', 'id="am-go"', 'id="am-cancel"', 'id="am-expiry"', 'id="am-skeleton"', 'id="am-pick-new"', 'data-am-chip=', 'data-am-pick=', 'data-am-item='])
    assert.ok(f.includes(id), id);
  assert.match(f, /data-am-page=/, 'the clause list pages by six');
  assert.match(f, /if\(cb\.checked\) S\.picks\.add\(i\); else S\.picks\.delete\(i\);/, 'a tick on another page is kept');
  assert.doesNotMatch(f, /type="submit"/, 'no button submits: Enter never spends a Jambo call');
  for (const k of ['fa_step_change', 'fa_step_wording', 'dk_add_label'])
    assert.equal((read('js/i18n.js').match(new RegExp('^\\s*' + k + ':', 'gm')) || []).length, 2, k + ' in both books');
});

test('f1116 (3) a notice served is three lines; withdrawing is the ending act on the left', () => {
  const f = strip(fnBody(read('js/notice.js'), 'openNoticeServedDialog'));
  assert.match(f, /lgpOpen\(\{ id:'nts-form'/);
  assert.doesNotMatch(f, OLD);
  for (const id of ["id:'nts-on'", "id:'nts-way'", "id:'nts-ref'", 'id="nts-say"', 'id="nts-ok"', 'id="nts-cancel"'])
    assert.ok(f.includes(id), id);
  assert.match(f, /left: had \? \{ label:i18t\('nt_served_clear'\), attr:'id="nts-clear"', danger:true \}/);
  assert.match(f, /d0\.max = today/, 'the day still may not be in the future');
});

test('f1116 (4) the bulk acts are the one sheet', () => {
  const CO = read('js/cohort.js');
  const a = strip(fnBody(CO, 'cohortAmendAsk')), d = strip(fnBody(CO, 'cohortAskDocAsk'));
  for (const f of [a, d]){ assert.match(f, /lgpOpen\(\{ id:'co-h-form'/); assert.doesNotMatch(f, OLD); assert.ok(f.includes('id="co-h-go"')); }
  assert.ok(a.includes("id:'co-h-says', type:'area'"));
  assert.ok(d.includes("id:'co-h-doc'") && d.includes("id:'co-h-due', type:'date'"));
  assert.match(d, /e\.key === 'Enter' && e\.target && e\.target\.tagName === 'INPUT'\) e\.preventDefault\(\)/, 'Enter never asks every counterparty');
});

test('f1116 (5) the team desk: the sheet, the hand-over and the join request', () => {
  const DK = read('js/desk.js');
  const sheet = strip(fnBody(DK, 'deskSheetHtml'));
  assert.match(sheet, /return lgpHtml\(\{ id: 'dk-sheet'/);
  assert.match(sheet, /cancelLabel: i18t\('dk_done_btn'\), cancelAttr: 'data-lgp-close id="dk-close"'/);
  assert.doesNotMatch(sheet, OLD); assert.doesNotMatch(sheet, /dk-row-lead|dk-row-ask/, 'no tinted boxes');
  const ho = strip(fnBody(DK, 'openDeskHandover')), jn = strip(fnBody(DK, 'openDeskJoinAsk'));
  assert.match(ho, /lgpHtml\(\{ id: 'dk-ho-form'/); assert.ok(ho.includes('id="dk-ho-tell"') && ho.includes('id="dk-hook"'));
  assert.match(jn, /lgpHtml\(\{ id: 'dk-join-form'/); assert.ok(jn.includes("id: 'dk-why', type: 'area'") && jn.includes('id="dk-jok"'));
  for (const f of [strip(fnBody(DK, 'openDeskSheet')), ho, jn]){
    assert.doesNotMatch(f, OLD); assert.match(f, /ownFrame: true/); }
  const pick = strip(fnBody(DK, '_dkPickLine'));
  for (const id of ['id="dk-who"', 'id="dk-who-caret"', 'id="dk-who-list"', 'id="dk-who-say"', 'id="dk-who-id"']) assert.ok(pick.includes(id), id);
});
