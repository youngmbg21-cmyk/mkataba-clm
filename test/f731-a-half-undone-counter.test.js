'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f731 — A COUNTER THAT UNDOES ONLY PART OF THEIR ASK SAYS SO (owner, 18 Oct
   2026, over MK-369: "In the governing law clause, you have changed back to
   Sweden but left the city to be still in Nairobi which makes no sense")
   (1) their ask: Sweden → Kenya and Stockholm → Nairobi twice; our draft on
       top puts back Sweden only — our row says "Keeps their change: Nairobi
       (2 places)"
   (2) a counter that undoes none of their words, or all of them, says
       nothing; nor does their own row, nor a row with no ask under it
   (3) the law, the seat and the body are read together: Swedish law seated in
       Nairobi asks "is that intended?"; a seat and a body in two cities asks
       too; agreeing places, or places the table does not know, say nothing
   (4) it is a line on OUR row, amber, never a band, never on their seat, and
       nothing is filed or blocked
   AT THE PARENT every test here FAILS: there is no negoKeepsTheirs.
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');

const ME = { id: 'u_me', name: 'Young Mbagaya', role: 'legal', email: 'young@hati.co.ke' };
const NEGO = fs.readFileSync(path.join(__dirname, '..', 'js/views/negotiation.js'), 'utf8');
const LAW = 'This Agreement is governed by the laws of Sweden, with disputes referred to arbitration seated in Stockholm under the Arbitration Institute of the Stockholm Chamber of Commerce.';
const THEIRS = LAW.replace('laws of Sweden', 'laws of Kenya').split('Stockholm').join('Nairobi');
const stage = (ours) => {
  const w = buildWorld({ user: ME, negotiationView: true });
  const c = { id: 'MK-369', changes: [
    { id: 'CHG-1', clauseId: 'cl_4', authorSide: 'counterparty', status: 'countered', oldText: LAW, newText: THEIRS },
    { id: 'CHG-2', clauseId: 'cl_4', authorSide: 'owner', status: 'pending', counterOf: 'CHG-1', oldText: THEIRS, newText: ours } ] };
  return { w, c, ours: c.changes[1], theirs: c.changes[0] };
};

describe('f731 (1) the owner\'s case', () => {
  test('Sweden put back, Nairobi kept twice: our row says so', () => {
    const { w, c, ours } = stage(THEIRS.replace('laws of Kenya', 'laws of Sweden'));
    assert.equal(typeof w.win.negoKeepsTheirs, 'function', 'the reading exists');
    assert.deepEqual(JSON.parse(JSON.stringify(w.win.negoKeepsTheirs(c, ours))), [{ w: 'Nairobi', n: 2 }]);
    const html = w.win.rlRowKeepsHtml(c, ours, 'owner');
    assert.match(html, /class="rl-card-keeps"/);
    assert.match(html, /Keeps their change: Nairobi \(2 places\)/);
  });
});

describe('f731 (2) only a half-undone counter says it', () => {
  test('undoing none, or all, of their words says nothing', () => {
    const none = stage(THEIRS.replace('referred to arbitration', 'referred to binding arbitration'));
    assert.equal(none.w.win.negoKeepsTheirs(none.c, none.ours), null, 'none of theirs undone');
    const all = stage(LAW);
    assert.equal(all.w.win.negoKeepsTheirs(all.c, all.ours), null, 'all of theirs undone');
  });
  test('their own row, and a draft with no ask under it, say nothing', () => {
    const { w, c, theirs } = stage(THEIRS.replace('laws of Kenya', 'laws of Sweden'));
    assert.equal(w.win.negoKeepsTheirs(c, theirs), null);
    assert.equal(w.win.negoKeepsTheirs(c, { id: 'X', authorSide: 'owner', status: 'pending', oldText: LAW, newText: LAW + ' x' }), null);
  });
});

describe('f731 (3) the law, the seat and the body', () => {
  test('Swedish law seated in Nairobi asks', () => {
    const { w } = stage(LAW);
    const q = w.win.negoLawSeatQ(THEIRS.replace('laws of Kenya', 'laws of Sweden'));
    assert.deepEqual(JSON.parse(JSON.stringify(q)), { kind: 'law', law: 'Sweden', seat: 'Nairobi' });
    const { w: w2, c, ours } = stage(THEIRS.replace('laws of Kenya', 'laws of Sweden'));
    assert.match(w2.win.rlRowKeepsHtml(c, ours, 'owner'), /Laws of Sweden with the seat in Nairobi — is that intended\?/);
  });
  test('a seat in one city under another city\'s chamber asks', () => {
    const { w } = stage(LAW);
    const q = w.win.negoLawSeatQ(LAW.replace('seated in Stockholm', 'seated in Nairobi').replace('laws of Sweden', 'laws of Kenya'));
    assert.deepEqual(JSON.parse(JSON.stringify(q)), { kind: 'body', seat: 'Nairobi', body: 'Stockholm' });
  });
  test('agreeing places, and places the table does not know, say nothing', () => {
    const { w } = stage(LAW);
    assert.equal(w.win.negoLawSeatQ(LAW), null);
    assert.equal(w.win.negoLawSeatQ(THEIRS), null);
    assert.equal(w.win.negoLawSeatQ('governed by the laws of Ruritania, seated in Strelsau.'), null);
    assert.equal(w.win.negoLawSeatQ('Invoices fall due within 45 days.'), null);
  });
});

describe('f731 (4) a line on our row, nothing more', () => {
  test('never on their seat, never on a settled row', () => {
    const { w, c, ours } = stage(THEIRS.replace('laws of Kenya', 'laws of Sweden'));
    assert.equal(w.win.rlRowKeepsHtml(c, ours, 'counterparty'), '');
    assert.equal(w.win.rlRowKeepsHtml(c, Object.assign({}, ours, { status: 'accepted' }), 'owner'), '');
  });
  test('drawn on the row, under its reason; it files and blocks nothing', () => {
    assert.match(NEGO, /keeps = rlRowKeepsHtml\(c, ch, side\);\s*return \(why \|\| keeps\) \? `<div class="rl-card-sumw">\$\{sub\}\$\{why\}\$\{keeps\}<\/div>`/,
      'under the summary and its reason, above the verbs');
    const f = NEGO.slice(NEGO.indexOf('function negoKeepsTheirs('), NEGO.indexOf('function rlRowWhyHtml('));
    assert.doesNotMatch(f, /negoFileChange|changes\.push|toast\(|confirmDialog|api\(/);
  });
  test('both books carry the words', () => {
    const I18N = fs.readFileSync(path.join(__dirname, '..', 'js/i18n.js'), 'utf8');
    for (const k of ['ng_keeps_theirs', 'ng_keeps_n_other', 'ng_lawseat_q', 'ng_seatbody_q'])
      assert.equal((I18N.match(new RegExp('^\\s+' + k + ':', 'gm')) || []).length, 2, k);
  });
});
