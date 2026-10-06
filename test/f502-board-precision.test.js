/* f502 — THE BOARD'S PRECISION, THE FREE HALF (the owner's work order, Part 7,
   4 Oct 2026: "A hit rate everyone can see, kept from slipping")

     A. the book holds about a hundred requests in the owner's style, each
        tagged free or copilot, each with the card it must produce;
     B. the free half's hit rate is measured over every request — the right
        card read free, or a Copilot request handed on rather than guessed —
        and it may not fall below the book's pass mark;
     C. the pass mark only goes up: it is pinned at or above the day-one
        measure (written in the book), and every miss is printed with what
        came back, so a slip names itself. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');
const { ROOT, readBook, mon, bookContracts, runFree } = require('./board-precision');

const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const HB_SRC = read('js/views/homeboard.js');
/* the day-one measure (4 Oct 2026); the book's pass mark may never sit below it */
const DAY_ONE = 97;

function world(){
  const w = buildWorld({ intelView: true }).win;
  w.state = { contracts: bookContracts(), settings: {}, view: 'dashboard' };
  w.FOLDERS = { proc: { id: 'proc', name: 'Procurement & Raw Materials' }, sales: { id: 'sales', name: 'Sales & Route-to-Market' } };
  w.cKind = c => c.kind || 'Contract';
  w.getContract = id => w.state.contracts.find(c => c.id === id) || null;
  w.payDays = c => { const m = String((c.metadata && c.metadata.paymentTerms) || '').match(/(\d+)/); return m ? Number(m[1]) : null; };
  w.paySide = c => ({ supplier: 'supplier', customer: 'customer' })[(c.metadata && c.metadata.category) || ''] || null;
  w.contractExpired = c => c.status === 'Signed' && !!c.expiry && c.expiry < mon(0, 1);
  w.contractOwnerName = c => (c.owner && c.owner.name) || null;
  w.isMonetary = () => true;
  w.currentUser = () => ({ id: 'u_test', name: 'Test User', role: 'legal' });
  w.eval(HB_SRC);
  w.eval('intel.lenses=[]; intel.groups=null; intel.groupBy="folder"; intel.history=[];');
  w.hbPaintBoard = () => {};
  const s = w.hbS(); s.face = 'board'; s.panels = []; s.path = []; s.recipe = {}; s.digBig = false;
  return w;
}

const BOOK = readBook();
const REQ = BOOK.requests;

describe('F502 (A) — the book', () => {
  test('about a hundred requests, each tagged and each with a want', () => {
    assert.ok(REQ.length >= 95 && REQ.length <= 240, String(REQ.length));   /* 201 with the analyst phrasebook (6 Oct 2026) */
    for (const r of REQ){
      assert.ok(r.q && typeof r.q === 'string', JSON.stringify(r));
      assert.ok(r.road === 'free' || r.road === 'copilot', r.q);
      assert.ok(r.want && typeof r.want === 'object' && Object.keys(r.want).length, r.q);
    }
    assert.equal(new Set(REQ.map(r => (r.after || '') + '→' + r.q)).size, REQ.length, 'no request twice');
    assert.ok(REQ.filter(r => r.road === 'copilot').length >= 10, 'a Copilot half to measure');
  });
});

describe('F502 (B, C) — the free half\'s hit rate', () => {
  test('measured over the whole book, at or above the pass mark', () => {
    const misses = [];
    let hits = 0;
    for (const r of REQ){
      const out = runFree(world, r);
      if (out.hit) hits++; else misses.push(`${r.after ? '[after ' + JSON.stringify(r.after) + '] ' : ''}${JSON.stringify(r.q)} (${r.road}): ${out.why.join('; ')}`);
    }
    const rate = Math.floor(100 * hits / REQ.length);
    console.log(`board precision, free half: ${hits}/${REQ.length} = ${rate}%` + (misses.length ? '\n  ' + misses.join('\n  ') : ''));
    assert.ok(rate >= BOOK.passMark.free, `the hit rate fell to ${rate}% (pass mark ${BOOK.passMark.free}%):\n  ${misses.join('\n  ')}`);
  });
  test('the pass mark only goes up', () => {
    assert.ok(BOOK.passMark.free >= DAY_ONE, `the pass mark (${BOOK.passMark.free}%) is below the day-one measure (${DAY_ONE}%)`);
  });
});
