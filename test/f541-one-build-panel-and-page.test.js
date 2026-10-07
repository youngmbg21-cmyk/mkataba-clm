'use strict';
/* F541 — THE ONE BUILD'S PANEL AND PAGE PARTS (Young, 7 Oct 2026,
   docs/WORKORDER-one-build-board-and-panel.md, parts B–G)
     (B) A suggestion shows only the sub-clause it changes: the card's builder
         passes changedOnly and heads to the ONE shared reading
         (redlineShownBlocks), keeps the sub-clause's heading, and counts what
         it left out in both books. A change that touches nothing visible
         draws the whole clause.
     (C) The prepared questions wear the platform's pale wash and its ink.
     (D) One way to dress a reference: refHtml and the one .hati-ref rule.
     (E) Every Focus button says "Focus" through one key, both books.
     (F) The pointer only points: one veil over the whole screen, its Exit the
         one press it takes; the hand-over-a-button lift is gone.
     (G) Every crossed-out word is red: one token, every del rule reads it. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const code = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
function region(src, name){
  const at = src.indexOf('function ' + name + '(');
  assert.ok(at > -1, 'no function ' + name);
  const open = src.indexOf('{', src.indexOf(')', at));
  let d = 0;
  for (let i = open; i < src.length; i++){
    if (src[i] === '{') d++;
    else if (src[i] === '}' && !--d) return src.slice(at, i + 1);
  }
  throw new Error('unbalanced ' + name);
}
const CE = read('js/views/clauseeditor.js');
const INDEX = read('index.html');
const NCSS = read('js/views/negotiation-css.js');
const I18N = read('js/i18n.js');
const HB = read('js/views/homeboard.js');
const R = require('../js/redline.js');

test('(B1) the card reads only what moved, with its heading, through the shared reading', () => {
  const f = code(region(CE, 'ceRedlineHtml'));
  assert.match(f, /redlineShownBlocks\(ops,\s*\{\s*changedOnly:\s*true,\s*heads:\s*true\s*\}\)/);
  assert.match(f, /redlineOpsBlocksHtml\(ops,\s*\{[^}]*changedOnly:\s*true[^}]*heads:\s*true/);
  assert.match(code(region(CE, 'ceCardHtml')), /ceRedlineHtml\([^;]*\{\s*changedOnly:\s*true\s*\}\)/);
});

test('(B2) the heading over a touched block stays; the untouched sub-clause goes; nothing visible → the whole clause', () => {
  const a = '2.1 Base Rent.\n\nThe Tenant pays rent.\n\n2.2 Deposit.\n\nThe Tenant lodges a deposit.';
  const b = '2.1 Base Rent.\n\nThe Tenant pays rent. Late payments carry interest.\n\n2.2 Deposit.\n\nThe Tenant lodges a deposit.';
  const ops = R.redlineOps(a, b);
  assert.equal(R.redlineDrawnBlocks(ops).length, 4);
  assert.equal(R.redlineShownBlocks(ops, { changedOnly: true }).length, 1, 'without heads: the changed paragraph alone');
  assert.equal(R.redlineShownBlocks(ops, { changedOnly: true, heads: true }).length, 2, 'with heads: its sub-clause name too');
  assert.equal(R.redlineShownBlocks(R.redlineOps(a, a), { changedOnly: true, heads: true }).length, 4, 'nothing visible moved → the whole clause');
  assert.equal(R.redlineBlockIsHead([{ type: 'eq', text: '2.1 Base Rent.' }]), true);
  assert.equal(R.redlineBlockIsHead([{ type: 'eq', text: 'The Tenant pays rent monthly in advance. Late payments carry interest.' }]), false);
});

test('(B3) what is left out is counted in both books', () => {
  const n = (I18N.match(/\bng_cb_unchanged_other\s*:/g) || []).length;
  assert.ok(n >= 2, 'ng_cb_unchanged in English and Swedish');
  assert.match(code(region(CE, 'ceRedlineHtml')), /i18tn\('ng_cb_unchanged'/);
});

test('(C) the prepared questions wear the pale accent wash and the accent ink', () => {
  const rule = /\.ce-chips button\{[^}]*\}/.exec(CE)[0];
  assert.match(rule, /background:var\(--color-accent-50\)/);
  assert.match(rule, /color:var\(--accent-ink\)/);
  assert.match(rule, /border:1px solid var\(--color-accent-100\)/);
});

test('(D) one way to dress a reference', () => {
  const OUT = read('js/outside.js');
  assert.match(code(region(OUT, 'refHtml')), /class="hati-ref"/);
  assert.match(OUT, /refHtml/);
  assert.match(INDEX, /\.hati-ref\{font-family:var\(--font-ref\);font-variant-numeric:tabular-nums;\}/);
  for (const f of ['js/views/approvalsview.js', 'js/obligations.js', 'js/views/calendar.js', 'js/app.js', 'js/views/homeboard.js', 'js/views/portal.js', 'js/views/negotiation.js'])
    assert.match(code(read(f)), /refHtml\(|hati-ref/, f + ' dresses its references');
});

test('(E) every Focus button says "Focus", through one key in both books', () => {
  assert.match(I18N, /ct_focus_word:\s*'Focus'/);
  assert.match(I18N, /ct_focus_word:\s*'Fokus'/);
  for (const f of ['js/views/contract.js', 'js/views/negotiation.js', 'js/views/portal.js'])
    assert.match(code(read(f)), /i18t\('ct_focus_word'\)/, f);
});

test('(F) the pointer only points: a veil, one exit, no hand over a button', () => {
  const C = code(HB);
  assert.match(code(region(HB, 'hbVeilPaint')), /hb-veil-exit/);
  assert.ok(!/function hbPointerHandAt|HB_CUR_CONTROL|hb-cur-chain/.test(C), 'the hand-over-a-button lift is gone');
  assert.match(INDEX, /\.hb-veil\{position:fixed;inset:0;[^}]*cursor:none/);
  assert.ok(!/hb-cur-chain/.test(code(INDEX)), 'no rule left for the old lift');
  assert.match(I18N, /hb_pointer_exit:\s*"Exit pointer"/);
});

test('(G) every crossed-out word reads the one red', () => {
  assert.match(INDEX, /--rl-del-ink:var\(--st-ruby-fg\)/);
  for (const [name, src] of [['index.html', INDEX], ['negotiation-css.js', NCSS], ['clauseeditor.js', CE]]){
    const rules = code(src).match(/[^{}]*del\.rl-(?:us|them)[^{}]*\{[^}]*\}/g) || [];
    assert.ok(rules.length > 0, name + ' has del rules');
    for (const r of rules){
      const m = /(?:^|[;{\s])color:([^;}]+)/.exec(r.slice(r.indexOf('{')));
      if (m) assert.equal(m[1].trim(), 'var(--rl-del-ink)', name + ': ' + r.trim().slice(0, 120));
    }
  }
});
