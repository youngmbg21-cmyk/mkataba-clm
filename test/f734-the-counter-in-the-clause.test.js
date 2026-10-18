'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f734 — JAMBO'S COUNTER IS MARKED IN THE CLAUSE ITSELF (owner, 18 Oct 2026:
   "the counter highlighted in blue is a full clause which makes it a terrible
   choice especially if it is a long clause. Just make the counter changes in
   the clause itself by editing the words or numbers but do not add a new
   clause unless the counter clause is completely different")
   (1) a figure: their 90 is struck in his dashed ink where it stands, his 60
       stands beside it — after their insertion, not inside it; nothing else
       in the clause moves
   (2) a long clause: only the words that differ are marked, no copy of it
   (3) a rewrite (less than half the words kept) is not marked inline: the
       painter answers false and the box under the clause stays its door
   (4) the marks come off cleanly, the clause as it was
   (5) the reader's click-to-type counts past his inserted words
   (6) nothing of it reaches their page (rlPaintCopilotAnswers stands down)
   AT THE PARENT every test here FAILS: there is no rlSugInline.
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');

const ME = { id: 'u_me', name: 'Young Mbagaya', role: 'legal', email: 'young@hati.co.ke' };
const NEGO = fs.readFileSync(path.join(__dirname, '..', 'js/views/negotiation.js'), 'utf8');
const body = (w, html) => { const d = w.win.document.createElement('div'); d.className = 'nego-body'; d.innerHTML = html; w.win.document.body.appendChild(d); return d; };
const shown = el => { const c = el.cloneNode(true); c.querySelectorAll('del, .nego-del, .rl-sug-del').forEach(x => x.remove()); return c.textContent.replace(/\s+/g, ' ').trim(); };

describe('f734 (1) a figure is countered where it stands', () => {
  test('their 90 struck in his ink, his 60 beside it, after their insertion', () => {
    const w = buildWorld({ user: ME, negotiationView: true });
    assert.equal(typeof w.win.rlSugInline, 'function', 'the painter exists');
    const b = body(w, 'Invoices fall due within <del class="nego-del">45</del> <ins class="nego-ins">90</ins> days of receipt.');
    assert.equal(w.win.rlSugInline(b, 'Invoices fall due within 60 days of receipt.', 'CHG-1'), true);
    const del = b.querySelectorAll('.rl-sug-del'), ins = b.querySelectorAll('.rl-sug-ins');
    assert.equal(del.length, 1); assert.equal(del[0].textContent, '90');
    assert.equal(ins.length, 1); assert.equal(ins[0].textContent.trim(), '60');
    assert.ok(del[0].closest('ins'), 'his strike sits on their own inserted word');
    assert.ok(!ins[0].closest('ins'), 'his word stands beside their insertion, not inside it');
    assert.equal(ins[0].getAttribute('data-rl-sug'), 'CHG-1');
    assert.ok(/Invoices fall due within/.test(b.textContent) && /days of receipt\./.test(b.textContent), 'nothing else moves');
    assert.equal(shown(b), 'Invoices fall due within 60 days of receipt.', 'read without the struck words, it is his wording');
  });
});

describe('f734 (2) a long clause is marked, never copied', () => {
  test('only the differing words carry marks', () => {
    const w = buildWorld({ user: ME, negotiationView: true });
    const long = 'The Supplier shall deliver the Goods to the Delivery Point on the Delivery Date in accordance with the Specification and shall bear all risk in the Goods until delivery is complete, and the Buyer may reject any Goods that do not conform within ten business days of delivery.';
    const b = body(w, '<p>' + long + '</p>');
    const to = long.replace('ten business days', 'five business days');
    assert.equal(w.win.rlSugInline(b, to, 'CHG-2'), true);
    assert.deepEqual([...b.querySelectorAll('.rl-sug-del')].map(x => x.textContent), ['ten']);
    assert.deepEqual([...b.querySelectorAll('.rl-sug-ins')].map(x => x.textContent.trim()), ['five']);
    assert.equal(b.querySelectorAll('p').length, 1, 'no second copy of the clause');
  });
});

describe('f734 (3) a rewrite keeps its box', () => {
  test('less than half the words kept: no inline marks, the painter says no', () => {
    const w = buildWorld({ user: ME, negotiationView: true });
    const b = body(w, 'Invoices fall due within 45 days of receipt.');
    assert.equal(w.win.rlSugInline(b, 'Payment is made monthly in arrears by bank transfer to the account named by the Supplier.', 'CHG-3'), false);
    assert.equal(b.querySelectorAll('.rl-sug-ins, .rl-sug-del').length, 0);
    assert.match(NEGO, /if \(a\.verdict === 'counter' && a\.wording && \(whole \|\| !rlSugInline\(body, a\.wording, ch\.id\)\)\)\{\s*\n\s*const box = document\.createElement\('div'\);/,
      'a rewrite, or a clause the painter could not mark, keeps the box');
  });
});

describe('f734 (4) the marks come off cleanly', () => {
  test('clearing puts the clause back as it was', () => {
    const w = buildWorld({ user: ME, negotiationView: true });
    const html = 'Invoices fall due within <del class="nego-del">45</del> <ins class="nego-ins">90</ins> days of receipt.';
    const b = body(w, html);
    w.win.rlSugInline(b, 'Invoices fall due within 60 days of receipt.', 'CHG-1');
    w.win.rlSugInlineClear(b);
    assert.equal(b.innerHTML, html);
  });
});

describe('f734 (5) and (6) the reader\'s typing and their page', () => {
  test('click-to-type counts past his inserted words', () => {
    assert.match(NEGO, /p\.closest\('del, \.nego-del, \.hati-del, \.rl-sug-ins'\)\) continue;/);
  });
  test('their page draws none of it', () => {
    const f = NEGO.slice(NEGO.indexOf('function rlPaintCopilotAnswers('), NEGO.indexOf('\n}', NEGO.indexOf('function rlPaintCopilotAnswers(')));
    assert.match(f, /if \(opts\.side === 'counterparty' \|\| rlOnTheirPage\(\)\) return 0;/);
    assert.ok(f.indexOf('rlSugInlineClear(root)') < f.indexOf("opts.side === 'counterparty'"), 'old marks are cleared before it stands down');
  });
});
