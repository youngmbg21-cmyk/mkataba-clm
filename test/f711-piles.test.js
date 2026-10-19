'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f711 — REDLINES, "PILES" (round 9 of the redesign: the owner picked "Piles"
   by name, 17 Oct 2026)
   (1) A row says who and when (rlRowByHtml; the reference rides its hover),
       and the reason they gave under the change (rlRowWhyHtml, negoReasonOf's
       reading), kept with the change line above the row's buttons.
   (2) "Waiting on you" names the first pile; what is settled this round folds
       behind its heading (RL_QUIET_BANDS), shut until pressed.
   AT THE PARENT (83dee6e) every test here FAILS.
   The browser half: test/chromium/piles-verify.js.
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const NV = R('js/views/negotiation.js');
const CSS = R('js/views/negotiation-css.js');
const I18N = R('js/i18n.js');
const fnBody = (src, name) => { const i = src.indexOf('function ' + name + '('); if (i < 0) return ''; return src.slice(i, src.indexOf('\n}', i) + 2); };
const BOOKS = (() => {
  const en = {}, sv = {};
  for (const m of I18N.matchAll(/^\s+([a-z][a-z0-9_]*): '((?:[^'\\]|\\.)*)',?\s*$/gm)){
    if (!(m[1] in en)) en[m[1]] = m[2]; else if (!(m[1] in sv)) sv[m[1]] = m[2];
  }
  return { en, sv };
})();
function stage(){
  const ctx = { i18t: (k, v) => k + (v ? '[' + Object.values(v).join(',') + ']' : ''), i18tn: (k, n) => k + ':' + n,
    _ne: x => String(x == null ? '' : x).replace(/</g, '&lt;'), _nea: x => String(x == null ? '' : x).replace(/"/g, '&quot;'),
    window: {}, Date, isFinite };
  ctx.window.negoReasonOf = ch => ch.why || '';
  ctx.negoReasonOf = ctx.window.negoReasonOf;
  /* the reader, for "You" on their own row (round 9's gaps, 18 Oct 2026) */
  ctx.window.currentUser = () => ({ name: 'Maria Lindgren' });
  ctx.rlOnTheirPage = () => false;
  vm.createContext(ctx);
  vm.runInContext(['rlAgoWords', 'rlRowIsMine', 'rlRowByHtml', 'rlRowWhyHtml'].map(n => fnBody(NV, n)).join('\n'), ctx);
  return ctx;
}
describe('f711 (1) the row', () => {
  test('1a who and when, the reference on the hover', () => {
    const ctx = stage();
    const now = new Date().toISOString();
    /* RE-POINTED 18 Oct 2026 (round 9's gaps, "Piles" as drawn: "You ·
       today" on the reader's own row) and 19 Oct 2026: the card's shortener
       passed in IS applied — a name on a change card is first name plus
       initial (owner, 13 Aug 2026; f188), the whole name on the hover. */
    const h = ctx.rlRowByHtml({ id: 'CHG-001', author: 'Anna Holm', createdAt: now, authorSide: 'counterparty' }, n => n.split(' ')[0] + ' ' + n.split(' ')[1][0] + '.');
    assert.equal(h, '<span class="rl-card-by" title="Anna Holm · CHG-001">Anna H. · rl_ago_today</span>');
    assert.equal(ctx.rlRowByHtml({ id: 'CHG-002', author: 'Maria Lindgren', createdAt: now, authorSide: 'owner' }),
      '<span class="rl-card-by" title="Maria Lindgren · CHG-002">ng_row_you · rl_ago_today</span>');
    const d3 = new Date(Date.now() - 3 * 86400000).toISOString();
    assert.equal(ctx.rlAgoWords(d3), 'rl_ago_days:3');
    assert.equal(ctx.rlAgoWords(new Date(Date.now() - 86400000).toISOString()), 'rl_ago_yesterday');
    assert.equal(ctx.rlAgoWords('not a date'), '', 'an absence is said as nothing, never guessed');
  });
  test('1b the reason in their words, or nothing', () => {
    const ctx = stage();
    assert.equal(ctx.rlRowWhyHtml({ why: 'Standard in our contracts.' }), '<div class="rl-card-whyq" title="Standard in our contracts.">“Standard in our contracts.”</div>');
    assert.equal(ctx.rlRowWhyHtml({}), '');
  });
  test('1c the row draws both; the reason rides with the change line, above the buttons', () => {
    assert.match(NV, /who \? `<span class="rl-card-id">\$\{_ne\(ch\.id\)\}<\/span>\$\{rlRowByHtml\(ch, _short\)\}` : ''/);
    /* RE-POINTED 18 Oct 2026 (round 9's gaps): the change line is the changed
       words where the change carries its ops (rlRowLineHtml), and a held
       clause's lock line rides with the reason, still above the buttons;
       RE-POINTED 18 Oct 2026: a half-undone counter's lines (f733) ride in
       the same block */
    assert.match(NV, /const why = rlRowWhyHtml\(ch\), keeps = rlRowKeepsHtml\(c, ch, side\), lock = rlRowLockHtml\(c, ch, side\), line = rlRowLineHtml\(ch, sub, fromRiskRow\);\s*return \(why \|\| keeps \|\| lock\) \? `<div class="rl-card-sumw">\$\{line\}\$\{why\}\$\{keeps\}\$\{lock\}<\/div>` : line;/);
    assert.match(CSS, /\.redline-page \.rl-card-d \.rl-card-id\{display:none\}/);
    assert.match(CSS, /\.redline-page \.rl-card-d \.rl-card-sumw\{grid-column:1 \/ -1;grid-row:2;min-width:0\}/);
  });
});
describe('f711 (2) the piles', () => {
  test('2a "Waiting on you" names the first pile, in both books', () => {
    assert.equal(BOOKS.en.ng_band_awaiting, 'Waiting on you');
    assert.ok(BOOKS.sv.ng_band_awaiting);
    for (const k of ['rl_ago_today', 'rl_ago_yesterday', 'rl_ago_days_one', 'rl_ago_days_other']) for (const l of ['en', 'sv']) assert.ok(BOOKS[l][k], k + ' ' + l);
  });
  test('2b settled folds behind its heading, shut until pressed, for the sitting', () => {
    assert.match(NV, /if \(RL_QUIET_BANDS\.includes\(b\)\) return `<button type="button" class="rl-band rl-band-fold" data-rl-band="\$\{_nea\(b\)\}" data-rl-settled-fold aria-expanded=/);
    assert.match(NV, /let _rlSettledOpen = false;/);
    assert.match(CSS, /#rl-changes-col:not\(\.rl-settled-open\) \.rl-card-quiet\{display:none\}/);
    assert.match(fnBody(NV, 'rlSettledToggle'), /col\.classList\.toggle\('rl-settled-open', _rlSettledOpen\)/);
  });
});
