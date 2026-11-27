'use strict';
/* f1261 — P-54, BEFORE YOU SEND THE STRIPE WAY (owner's pick, 27 Nov 2026; only the panel's cards change): a count ring
   ("3 of 4 checks ready", "Round 1 · to Ventura"), each check a row with a soft badge — What goes (Ready, or N held
   back), the paper's checks (Blanks on the paper · N to fill, with the Send-it-anyway tick kept in this row), Mail
   (Ready, or Off), Names (Private) — then How it goes: Drafted → Reviewed → Send to … → Their reply. The tabs, the
   crumb, the links line and Jambo's box are not touched; the old look keeps its cards. */
const { describe, test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const C = strip(R('js/core.js')), I = R('js/i18n.js'), H = R('index.html');

describe('f1261 the side panel, as drawn', () => {
  test('the new look draws the ring, four rows and the timeline; the old look keeps its cards', () => {
    assert.match(C, /if\(typeof newLookOn==='function' && newLookOn\(\)\) return `<div class="sh-sp-ring" id="sh-sp-ring"><\/div>/);
    for (const id of ['sh-lt-goes', 'sh-sp-mail', 'sh-sp-names', 'sh-sp-how']) assert.ok(C.includes(`id="${id}"`), id);
    assert.match(C, /<span class="sh-sp-bd is-grey">\$\{esc\(i18t\('sh_sp_private'\)\)\}<\/span>/);
    assert.match(C, /return `\$\{shareStaysHtml\(c\)\}\s*\$\{''/, 'the old look\'s cards stand');
  });
  test('the ring counts the four rows off the readings the rows use', () => {
    assert.match(C, /const m=4, ok=\(held\?0:1\)\+\(paperOk\?1:0\)\+\(off\?0:1\)\+1;/);
    assert.match(C, /i18t\('sh_sp_ring', \{ n:ok, m \}\)/);
    assert.match(C, /i18t\('sh_sp_sub', \{ r, who:short \}\)/);
    assert.match(C, /shareVerdictPaint\(c, st\);\s*shareGoesPaint\(c, st, who\);\s*shareStripePaint\(c, st, who\);/);
  });
  test('the paper\'s checks are one row: blanks counted, the Send-it-anyway tick kept in it, nothing to fix is Ready', () => {
    assert.match(C, /const allBlank=blocks\.length && blocks\.every\(x=>BLANK\.has\(x\.key\)\);/);
    assert.match(C, /i18tn\('sh_sp_fill', nFill, \{ n:nFill \}\)/);
    const row = C.slice(C.indexOf('if(sp){'), C.indexOf('if(sp){') + 2400);
    assert.match(row, /<label class="sh-lt-check-ack"><input id="sh-ack" type="checkbox"\/>/);
    assert.match(C, /id="sh-sp-paper-ok" class="sh-lt-card sh-sp-row"/);
    assert.match(C, /i18tn\('sgx_rd_ph',ph\.length,[\s\S]{0,120}\), \{ n:ph\.length \}\);/);
    assert.match(C, /\{ fields: boxes\.map\(b=>b\.key\), n:boxes\.length \}\);/);
  });
  test('"Ready to send." is not said twice in the new look', () => {
    assert.match(C, /html=\(typeof newLookOn==='function' && newLookOn\(\)\) \? ''\s*: `<h4><i class="sh-v-dot"/);
  });
  test('soft badges and the timeline wear the status tokens, scoped to the panel', () => {
    assert.ok(H.includes('html.lg-new #ig-dock #pd-sendface .sh-sp-bd.is-amber{background:var(--st-amber-bg);color:var(--st-amber-fg)}'));
    assert.ok(H.includes('html.lg-new #ig-dock #pd-sendface .sh-sp-tl > li.is-done > i{border-color:var(--st-green-dot);background:var(--st-green-dot)}'));
    assert.ok(H.includes('html.lg-new #ig-dock #pd-sendface .sh-sp-ring{order:-2;'));
  });
  test('the words are in both books', () => {
    for (const k of ['sh_sp_ring', 'sh_sp_sub', 'sh_sp_goes', 'sh_sp_held_none', 'sh_sp_ready', 'sh_sp_private', 'sh_sp_off', 'sh_sp_blanks',
      'sh_sp_fill_one', 'sh_sp_fill_other', 'sh_sp_how', 'sh_sp_t_drafted', 'sh_sp_t_reviewed', 'sh_sp_t_send', 'sh_sp_t_reply', 'sh_sp_t_board'])
      assert.equal((I.match(new RegExp('\\b' + k + ': ', 'g')) || []).length, 2, k);
  });
});
