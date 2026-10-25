'use strict';
/* ═══════════════════════════════════════════════════════════════
   f884 — DISCOVER STAGE 7: NEGOTIATION MEMORY, ON THEIR ROW AND IN THE
   CLAUSE EDITOR (docs/PLAN-jambo-discover.md, owner 25 Oct 2026: "1 round
   with the party · 3 across the book")
   precedentMemoryOf(c, ch), counted off the book, never a model:
   (1) one settled round with THIS party is enough to say what they settled,
       and its wording is what worked before;
   (2) with no history with them, the book speaks only from three settled
       rounds; two say nothing;
   (3) only their pending ask is read; ours, or a settled one, has no memory.
   (4) Where it shows: under the verdict on their row (rlRowReadHtml), and as
       the editor's "What worked before" card, whose Apply only fills the box.
   AT THE PARENT (stage 6) every claim fails: no precedentMemoryOf.
   ═══════════════════════════════════════════════════════════════ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const change = o => ({ id: o.id, clauseId: 'c1', clauseLabel: o.label || 'Payment terms', oldText: o.oldText || 'within thirty (30) days',
  newText: o.newText || 'within forty-five (45) days', status: o.status, authorSide: o.side || 'counterparty', author: 'Them',
  createdAt: o.at || '2026-01-01T00:00:00.000Z', updatedAt: o.at || '2026-02-01T00:00:00.000Z' });
const contract = (id, counterparty, changes) => ({ id, name: id, counterparty, status: 'Signed', folder: 'proc', fields: {}, metadata: {},
  obligations: [], audit: [], rounds: [], versions: [], signatures: [], comments: [], changes, negotiation: { round: 2 } });
function win(contracts){
  const w = buildWorld({});
  w.win.eval(read('js/precedent.js'));
  w.win.state = { contracts, settings: {} };
  return w.win;
}
const ASK = change({ id: 'NOW', status: 'pending', newText: 'within ninety (90) days' });

describe('f884 (1) one round with this party is enough', () => {
  test('1a their settled round is said, and its wording is what worked before', () => {
    const now = contract('MK-NOW', 'Siginon Group', [ASK]);
    const W = win([now, contract('MK-OLD', 'Siginon Group', [change({ id: 'A', status: 'accepted', newText: 'within sixty (60) days', at: '2026-03-01T00:00:00.000Z' })])]);
    const M = W.precedentMemoryOf(now, ASK);
    assert.ok(M && M.line, JSON.stringify(M));
    assert.match(M.line, /Siginon Group/);
    assert.equal(M.withThem, true);
    assert.equal(M.wording.text, 'within sixty (60) days');
    assert.equal(M.wording.ref, 'MK-OLD');
  });
});

describe('f884 (2) the book speaks only from three', () => {
  test('2a two settled rounds elsewhere: nothing said', () => {
    const now = contract('MK-NOW', 'New Party', [ASK]);
    const W = win([now, contract('X1', 'Other A', [change({ id: 'a', status: 'accepted' })]), contract('X2', 'Other B', [change({ id: 'b', status: 'rejected' })])]);
    assert.equal(W.precedentMemoryOf(now, ASK), null);
  });
  test('2b three settled rounds: the book is said, and the latest agreed wording offered', () => {
    const now = contract('MK-NOW', 'New Party', [ASK]);
    const W = win([now,
      contract('X1', 'Other A', [change({ id: 'a', status: 'accepted', newText: 'within forty-five (45) days', at: '2026-01-05T00:00:00.000Z' })]),
      contract('X2', 'Other B', [change({ id: 'b', status: 'accepted', newText: 'within sixty (60) days', at: '2026-04-05T00:00:00.000Z' })]),
      contract('X3', 'Other C', [change({ id: 'c', status: 'accepted', newText: 'within forty-five (45) days', at: '2026-02-05T00:00:00.000Z' })])]);
    const M = W.precedentMemoryOf(now, ASK);
    assert.ok(M && M.line, JSON.stringify(M));
    assert.equal(M.withThem, false);
    assert.equal(M.wording.text, 'within sixty (60) days', 'the latest agreed');
  });
});

describe('f884 (3) only their pending ask', () => {
  test('3a our ask, or a settled one, has no memory', () => {
    const ours = change({ id: 'O', status: 'pending', side: 'owner' });
    const done = change({ id: 'D', status: 'accepted' });
    const now = contract('MK-NOW', 'Siginon Group', [ours, done]);
    const W = win([now, contract('MK-OLD', 'Siginon Group', [change({ id: 'A', status: 'accepted' })])]);
    assert.equal(W.precedentMemoryOf(now, ours), null);
    assert.equal(W.precedentMemoryOf(now, done), null);
    assert.equal(W.precedentMemoryOf(now, Object.assign({}, ASK, { superseded: true })), null, 'a superseded ask has no memory');
  });
});

describe('f884 (4) where it shows', () => {
  test('4a their row draws the line under the verdict, our seat only', () => {
    const src = read('js/views/negotiation.js');
    const at = src.indexOf('function rlRowReadHtml(');
    const body = src.slice(at, src.indexOf('\nfunction ', at + 10));
    assert.match(body, /precedentMemoryOf\(c, ch\)/);
    assert.match(body, /side !== 'counterparty' && !PORTAL_MODE/);
    assert.match(body, /data-rl-row-memory/);
  });
  test('4b the editor\'s "What worked before" card: words only reach the box on Apply (no prepared or std flag)', () => {
    const src = read('js/views/clauseeditor.js');
    const at = src.indexOf('WHAT WORKED BEFORE');
    const body = src.slice(at, at + 1600);
    assert.match(body, /precedentMemoryOf\(_ceC, mch\)/);
    assert.match(body, /name: _cet\('ce_mem_h'\)/);
    assert.doesNotMatch(body, /prepared: true|std:/, 'the generic Apply path: ceApply into the box, filed only by Save');
  });
});
