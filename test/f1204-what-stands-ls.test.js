/* f1204 — WHAT STANDS, THE LEGORA + STRIPE WAY (owner's pick, 24 Nov 2026: "this area looks very busy and not easy to
   follow" → "Build L+S and merge"). The Dossier's three cards (Family, Where the deal stands, Duties) become ONE head and
   three ROWS: a soft badge, the one thing that waits, a grey line of detail, the row's own door. The two-sides strip and
   the duty dates timeline are gone from the Dossier (the two sides are drawn on the deal's page); the facts' head wears
   the same small capitals. Every press stays the door it was. Fails on the parent: pd2WsHtml does not exist there. */
'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs'), path = require('path');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const PD = strip(R('js/paperdesk.js')), H = R('index.html'), I = R('js/i18n.js');
const fn = name => { const i = PD.indexOf('function ' + name + '('); assert.ok(i >= 0, name + ' exists'); const j = PD.indexOf('\nfunction ', i + 9); return PD.slice(i, j < 0 ? undefined : j); };

test('f1204 (1) one head, three rows in the drawn order, above the facts', () => {
  assert.match(PD, /\$\{nl \? pd2WsHtml\(c\) : ''\}\$\{nl && facts \?/);
  const ws = fn('pd2WsHtml');
  assert.match(ws, /const rows = pd2DealCardHtml\(c\) \+ pd2DutiesCardHtml\(c\) \+ pd2FamCardHtml\(c\);/);
  assert.match(ws, /class="pd2-ws" data-pd2-ws><div class="pd2-ws-h">\$\{_pdE\(_pdT\('pd2_ws_head'\)\)\}/);
  assert.doesNotMatch(PD, /pd2FamCardHtml\(c\) : ''\}\$\{nl \? pd2DealCardHtml/, 'the three cards are no longer drawn one by one');
});
test('f1204 (2) each row: a badge, the line that waits, a grey detail, its own door', () => {
  const deal = fn('pd2DealCardHtml'), duty = fn('pd2DutiesCardHtml'), fam = fn('pd2FamCardHtml');
  for (const [k, f] of [['deal', deal], ['duty', duty], ['fam', fam]]){
    assert.match(f, /pd2WsBadge\(/, k + ' wears a soft badge');
    assert.match(f, /class="pd2-ws-w">[^`]{0,140}<b>/, k + ' says the one thing first');
  }
  assert.match(deal, /class="pd2-ws-r is-deal" data-pd2-dl-open=/, 'the deal row opens Where the deal stands');
  assert.match(deal, /unsent \? _pdTn\('pd2_ws_unsent'/, 'it says what is not sent yet');
  assert.match(deal, /n \|\| unsent \|\| \(who && !theirs\) \? pd2WsBadge\('amber', T\('pd2_ws_b_you'\)\)/, 'our move while our ticks or our unsent changes wait');
  assert.match(duty, /class="pd2-ws-r is-duty" data-pd2-dtc="\$\{E\(S\.k\)\}" \$\{attr\}/, 'the duties row keeps its one door');
  assert.match(duty, /pd2_ws_dt_decide/);
  assert.match(fam, /data-pd-ds-fam=/, 'each paper of the family is its door');
  assert.match(fam, /a\.k !== 'create'/);
  assert.match(fam, /class="pd2-ws-r is-fam" data-pd2-famc>/);
});
test('f1204 (3) the busy parts are gone from the Dossier', () => {
  assert.doesNotMatch(PD, /function pd2DlTwoHtml\(/);
  assert.doesNotMatch(PD, /function pd2DutyDatesHtml\(/);
  assert.doesNotMatch(PD, /pd2-fam-chain/);
  assert.doesNotMatch(H, /#ig-dock \.pd2-(two|dtl|famc|dlc)\b/);
});
test('f1204 (4) one look: rows are flex, the facts\' head matches, tokens only', () => {
  assert.match(H, /html\.lg-new #ig-dock \.pd2-ws-r\{display:flex;/);
  assert.match(H, /html\.lg-new #ig-dock \.pd2-ws-h,html\.lg-new #ig-dock \.pd2-dossier > \.pd2-ws ~ \.pd2-eye\{[^}]*text-transform:uppercase/);
  assert.match(H, /html\.lg-new #ig-dock button\.pd2-ws-r:hover\{background:var\(--row-hover\)\}/, 'a row pointed at is light green');
  const block = H.slice(H.indexOf('/* WHAT STANDS, THE LEGORA + STRIPE WAY'), H.indexOf('.pd2-ws-go{'));
  assert.doesNotMatch(block.replace(/\/\*[\s\S]*?\*\//g, ''), /#[0-9a-fA-F]{3,6}\b/, 'no literal colours');
});
test('f1204 (5) both books carry the words', () => {
  for (const k of ['pd2_ws_head', 'pd2_ws_b_you', 'pd2_ws_b_them', 'pd2_ws_b_decide', 'pd2_ws_b_listed', 'pd2_ws_unsent_other', 'pd2_ws_dt_decide_other', 'pd2_ws_dt_on_other', 'pd2_ws_fam_none', 'pd2_ws_fam_n_other'])
    assert.strictEqual((I.match(new RegExp('\\n\\s*' + k + ':', 'g')) || []).length, 2, k + ' in both books');
  assert.match(R('js/handbook.js'), /\{ui:pd2_ws_head\}, one heading over three rows/);
});
