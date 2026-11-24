'use strict';
/* f1184 — THE DUTIES CARD (owner, 23 Nov 2026: "how do you review the duties soon after it has been downloaded or created
   from your own template?" → picked "Its own card").

   (1) WHERE THE READER LOOKS: the card sits on the Dossier under Where the deal stands, above the facts.
   (2) ONE DOOR EACH: its presses are the existing doors — the arrival reading (data-pd-ds-read), the review page
       (data-pd-ds-obl → openObligationsReview), the contract's duty list (data-pd-glance-tab="oblig"); it adds no writer.
   (3) THE STATES, read off the record: unread · review (found, not decided) · list (added, next due) · none · failed ·
       reading; a Viewer gets the words and no press.
   (4) BOTH BOOKS carry its words; the Handbook names it.
   At the parent every part fails (the card is new). */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const PD = strip(R('js/paperdesk.js'));
const fn = name => { const i = PD.indexOf('function ' + name + '('); assert.ok(i >= 0, name + ' exists'); const j = PD.indexOf('\nfunction ', i + 9); return PD.slice(i, j < 0 ? undefined : j); };

test('f1184 (1) the card sits under Where the deal stands, above the facts', () => {
  /* RE-POINTED 24 Nov 2026 (What stands, L+S, f1204): the duties are the row under the deal's, above the facts */
  assert.match(PD, /\$\{nl \? pd2WsHtml\(c\) : ''\}\$\{nl && facts \?/);
  assert.match(PD, /pd2DealCardHtml\(c\) \+ pd2DutiesCardHtml\(c\)/);
});
test('f1184 (2) every press is an existing door; the card writes nothing', () => {
  const h = fn('pd2DutiesCardHtml'), of = fn('pd2DutiesCardOf');
  /* RE-POINTED 23 Nov 2026 (owner, "Duties, end to end"): ONE door whatever the state — the contract's Duties page
     (data-pd-ds-obl → dutiesOpen); only an unread contract offers the read first */
  assert.match(h, /attr = 'data-pd-ds-obl'/);
  assert.doesNotMatch(h, /data-pd-glance-tab="oblig"/, 'no second door to a hidden panel');
  assert.match(h, /attr = 'data-pd-ds-read'/);
  assert.match(PD, /t\.closest\('\[data-pd-ds-obl\]'\)[\s\S]{0,300}window\.dutiesOpen\(cc\)/, 'the door opens the Duties page');
  for (const body of [h, of]) assert.doesNotMatch(body, /persist\(|api\(|\.obligations\s*=|\.push\(/, 'reading never writes');
});
test('f1184 (3) the states, and a Viewer gets no press', () => {
  const of = fn('pd2DutiesCardOf'), h = fn('pd2DutiesCardHtml');
  for (const k of ['reading', 'review', 'list', 'unread', 'failed', 'none']) assert.match(of, new RegExp(`k: '${k}'`), k);
  assert.match(of, /obReviewWaiting/, 'what waits is the review\'s own count');
  assert.match(h, /mayActOn/); assert.match(h, /const press = may && attr/); assert.match(h, /is-still/);
});
test('f1184 (4) both books carry the words; the Handbook names the card', () => {
  const I = R('js/i18n.js');
  for (const k of ['pd2_dt_head', 'pd2_dt_review', 'pd2_dt_none_added', 'pd2_dt_next', 'pd2_dt_unread', 'pd2_dt_read', 'pd2_dt_found_none', 'pd2_dt_found_one', 'pd2_dt_n_other'])
    assert.equal((I.match(new RegExp('^\\s+' + k + ':', 'mg')) || []).length, 2, k + ' in both books');
  /* RE-POINTED 23 Nov 2026 ("Duties, end to end"): the Handbook names the card as the one way to a contract's duties */
  assert.match(R('js/handbook.js'), /the duties\\' row of \{ui:pd2_ws_head\} in its Dossier is the one way to its duties/);
});
