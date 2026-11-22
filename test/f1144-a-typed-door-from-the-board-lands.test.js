/* ═══════════════════════════════════════════════════════════════════════════
   f1144 — A TYPED DOOR FROM THE BOARD LANDS, EVEN ON A SLOW READ
   (BUGLOG 22 Nov 2026; door-exam-verify on GitHub, the Board's box only:
   "plain english of MK-A1", "amend MK-B1", "obligations of MK-C1", "nda
   details of MK-D1" — "page board ≠ paper", nothing moved)

   THE CAUSE: a contract not opened yet this sitting is a LIGHT row; its paper
   waits for the whole record (igAnalyze → ensureFull). From the Board the
   door opened at once, but nothing turned and nothing said a landing was on
   its way (navLanding false) until the read came back — and the doors' own
   landers (Key terms' row, the NDA's facts) counted their beats against a
   paper not drawn yet and gave up on a read slower than their two seconds.
   (From a list page the same sentence landed: by then the Board's turn had
   read the record.)

   WHAT THIS PINS
     (1) navReadFirst: a light contract is read whole FIRST, the landing said
         meanwhile, then the door runs once; a loaded one runs at once; the
         newest door wins; a person who moved on keeps where they went
     (2) the typed doors use it: a contract's part (navGoAct), a place word
         with a contract (caGo), the Board's own "open MK-…" (hbAsk's openc)
     (3) a contract still being read for Home's paper (intel.opening) is a
         landing on its way, whichever door asked
   AT THE PARENT (8b6aff0) every test here FAILS but (1)'s "already read whole", which guards the fast path.
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const NV = R('js/navmap.js'), CA = R('js/copilotacts.js'), HB = R('js/views/homeboard.js');
const fnBody = (src, name) => { const i = src.search(new RegExp('(async )?function ' + name + '\\(')); if (i < 0) return ''; return src.slice(i, src.indexOf('\n}', i) + 2); };
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const line = (src, re) => { const m = src.match(re); return m ? m[0] : ''; };
const tick = () => new Promise(r => setImmediate(r));

/* navmap's own reading and door, run over a world of stubs */
function world(c, extra){
  let release; const read = new Promise(r => { release = r; });
  const calls = [];
  const ctx = Object.assign({
    window: {}, state: { view: 'dashboard' }, face: 'board',
    getContract: id => (String(id) === String(c.id) ? c : null),
    ensureFull: () => read.then(() => { c._loaded = true; c._light = false; }),
    pdOpenOnHome: (id, tab) => { calls.push(['open', id, tab]); return true; },
    pdKtFocus: (id, k) => { calls.push(['kt', id, k]); return true; },
    toast: () => {},
  }, extra || {});
  ctx.hbFace = () => ctx.face;
  ctx.window.intel = ctx.intel || null;
  const src = [
    line(NV, /^let _navLanding = false;$/m),
    line(NV, /^const navLanding = [^\n]*$/m),
    line(NV, /^const navC = [^\n]*$/m),
    line(NV, /^const NAV_ACTS_WRITE = [^\n]*$/m),
    line(NV, /^let _navReadSeq = 0;$/m),
    fnBody(NV, 'navReadFirst'), fnBody(NV, 'navStandsAt'), fnBody(NV, 'navGoAct'),
    'this.navLanding = navLanding; this.navGoAct = navGoAct; this.navReadFirst = typeof navReadFirst === "function" ? navReadFirst : null;',
  ].join('\n');
  vm.createContext(ctx); vm.runInContext(src, ctx);
  return { ctx, calls, release };
}

describe('f1144 (1) the whole record before the door', () => {
  test('a light contract: nothing opens until it is read, the landing is said meanwhile, then the door opens once', async () => {
    const c = { id: 'MK-A1', _light: true };
    const W = world(c);
    assert.equal(typeof W.ctx.navReadFirst, 'function', 'navReadFirst exists');
    assert.equal(W.ctx.navGoAct({ k: 'cact', cid: 'MK-A1', act: 'clauses' }), true);
    assert.deepEqual(W.calls, [], 'no door before the record is read');
    assert.equal(W.ctx.navLanding(), true, 'a landing is on its way');
    W.release(); await tick(); await tick();
    assert.deepEqual(W.calls, [['open', 'MK-A1', 'doc']], 'then the door, once');
    assert.equal(W.ctx.navLanding(), false, 'and the landing is no longer said to be on its way');
  });
  test('a contract already read whole opens at once', () => {
    const W = world({ id: 'MK-A2', _loaded: true });
    W.ctx.navGoAct({ k: 'cact', cid: 'MK-A2', act: 'value' });
    assert.deepEqual(W.calls, [['kt', 'MK-A2', 'value']]);
    assert.equal(W.ctx.navLanding(), false);
  });
  test('a person who moved on while it was read keeps where they went', async () => {
    const W = world({ id: 'MK-B1', _light: true });
    W.ctx.navGoAct({ k: 'cact', cid: 'MK-B1', act: 'oblig' });
    W.ctx.state.view = 'approvals';
    W.release(); await tick(); await tick();
    assert.deepEqual(W.calls, [], 'nothing pulled them back');
    assert.equal(W.ctx.navLanding(), false, 'and nothing is left said to be landing');
  });
  test('the newest door wins', async () => {
    const W = world({ id: 'MK-C1', _light: true });
    const a = [], b = [];
    W.ctx.navReadFirst(W.ctx.getContract('MK-C1'), () => a.push(1));
    W.ctx.navReadFirst(W.ctx.getContract('MK-C1'), () => b.push(1));
    W.release(); await tick(); await tick();
    assert.deepEqual([a.length, b.length], [0, 1]);
  });
  test('a code-named stand-in is never read (its own stop answers)', () => {
    const W = world({ id: 'MK-Q1', _light: true, _codeNamed: true });
    assert.equal(W.ctx.navReadFirst(W.ctx.getContract('MK-Q1'), () => {}), false);
  });
});

describe('f1144 (2) every typed door reads first', () => {
  test('a place word with a contract (caGo) reads it before the door, then runs the same go', () => {
    const g = strip(fnBody(CA, 'caGo'));
    const i = g.indexOf('window.navReadFirst(c0, () => caGo(a))'), j = g.indexOf('caUseBump(a.place)');
    assert.ok(i > 0 && j > i, 'read first, before the go is counted or trailed');
    assert.match(g, /const cid = a\.cid \|\| \(a\.nav && a\.nav\.cid\);/, 'a part of a contract named too');
  });
  test("the Board's own \"open MK-…\" reads first", () => {
    const i = HB.indexOf("if (r.act === 'openc'){\n"); assert.ok(i > 0);
    assert.match(strip(HB.slice(i, i + 700)), /window\.navReadFirst\(c, open\)/);
  });
});

describe('f1144 (3) a contract being read for the paper is a landing on its way', () => {
  test('navLanding says so while intel.opening stands', () => {
    const W = world({ id: 'MK-D1', _loaded: true }, { intel: { opening: { id: 'MK-D1' } } });
    assert.equal(W.ctx.navLanding(), true);
    W.ctx.window.intel.opening = null;
    assert.equal(W.ctx.navLanding(), false);
  });
});
