/* f535 — RISK EXPOSURE OVER TIME DRAWS (Young, 6 Oct 2026: "Fix the risk
   exposure crash")
     (1) "risk exposure by month signed over the last 12 months" gives a
         reading instead of throwing: the columns and the edge columns carry
         how many of their contracts have no risks read (`left`), and the
         reading adds those, never a property the copies do not have;
     (2) the "not counted" line says exactly the contracts in the window
         whose risks nobody has read — read ones are counted, unread ones
         are said.
   Run: node --test test/f535-board-exposure-over-time.test.js */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');
const { bookContracts } = require('./board-precision');

const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const Q = 'risk exposure by month signed over the last 12 months';
function world(contracts){
  const w = buildWorld({ intelView: true }).win;
  w.state = { contracts, settings: {}, view: 'dashboard' };
  w.FOLDERS = { proc: { id: 'proc', name: 'Procurement & Raw Materials' } };
  w.cKind = c => c.kind || 'Contract';
  w.getContract = id => w.state.contracts.find(c => c.id === id) || null;
  w.isMonetary = () => true;
  w.currentUser = () => ({ id: 'u_test', name: 'Test User', role: 'legal' });
  w.eval(read('js/views/homeboard.js'));
  w.eval('intel.lenses=[]; intel.groups=null; intel.groupBy="folder"; intel.history=[];');
  w.hbPaintBoard = () => {};
  const s = w.hbS(); s.face = 'board'; s.panels = []; s.path = []; s.recipe = {};
  return { w, s };
}
function ask(w, s){
  w.hbAsk(Q);
  const key = (s.path || []).slice(-1)[0];
  const src = w.hbReadSrc(key);
  assert.ok(src && src.reading, 'the card has a reading');
  return src.reading.lines;
}
const nOf = (lines, re) => { const l = lines.find(x => re.test(x)); return l ? Number(l.match(/^(\d+)/)[1]) : null; };

describe('f535 risk exposure over time', () => {
  test('(1) the question draws and reads, unread said', () => {
    const { w, s } = world(bookContracts());
    let lines;
    assert.doesNotThrow(() => { lines = ask(w, s); });
    assert.ok(lines.some(l => /of risk exposure, across \d+ contracts/.test(l)), lines.join(' | '));
    assert.ok(lines.some(l => /no risks read yet/.test(l)), 'nothing read yet, and it says so');
  });
  test('(2) read contracts count, unread ones are said', () => {
    const book = bookContracts();
    book.forEach((c, i) => { if (i % 2 === 0) c.scan = { findings: [{ sev: 'high' }] }; });
    const { w, s } = world(book);
    w.riskOpenOf = c => (c.scan && c.scan.findings) || [];
    const lines = ask(w, s);
    const across = nOf(lines.map(l => l.replace(/^[^,]*, across /, '')), /^\d+ contracts?\.?$/);
    const unread = nOf(lines, /no risks read yet/);
    const inWin = Number((lines.find(l => /contracts fall in it/.test(l)) || '').match(/(\d+) of/)[1]);
    const readIn = book.filter((c, i) => i % 2 === 0).length;
    assert.ok(unread > 0 && unread < inWin, `some read, some not: ${lines.join(' | ')}`);
    assert.ok(across === inWin, 'every contract in the window is counted in the total line');
    assert.ok(readIn > 0);
    assert.ok(!/^KES 0 /.test(lines[0]), 'read risks put money on the chart: ' + lines[0]);
  });
});
