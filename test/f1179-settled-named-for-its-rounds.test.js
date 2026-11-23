/* ============================================================
   f1179 — the settled pile is named for the rounds it was settled in
   ============================================================
   Bug log: rlSettledPileLabel built "Settled in rounds 1–{round-1}" from the
   CURRENT round, so changes all settled in round 1 read "rounds 1–2" once the
   table reached round 3. Each change now belongs to the closed round it was
   settled in. Red at the parent: (1) read "rounds 1–2".
   ============================================================ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const NG = fs.readFileSync(path.join(__dirname, '..', 'js/views/negotiation.js'), 'utf8');
const fnBody = name => { const i = NG.indexOf('function ' + name + '('); return NG.slice(i, NG.indexOf('\n}', i) + 2); };
function label(c, list){
  const ctx = { i18t: (k, o) => k + (o ? ':' + o.n : ''), negoRoundSince: c => c.negotiation.roundAt };
  ctx.window = ctx; vm.createContext(ctx);
  vm.runInContext(fnBody('rlSettledAt') + '\n' + fnBody('rlSettledPileLabel') + '\nthis.f = rlSettledPileLabel;', ctx);
  return ctx.f(c, list);
}
const nego = { round: 3, roundAt: '2026-03-01', rounds: [{ n: 1, at: '2026-01-15' }, { n: 2, at: '2026-03-01' }] };
describe('f1179 — settled in the rounds it was', () => {
  test('(1) all settled in round 1, now round 3: "round 1"', () => {
    assert.equal(label({ negotiation: nego }, [{ resolvedAt: '2026-01-10' }, { resolvedAt: '2026-01-12' }]), 'ng_band_settled_in:1');
  });
  test('(2) settled across rounds 1 and 2: "rounds 1–2"', () => {
    assert.equal(label({ negotiation: nego }, [{ resolvedAt: '2026-01-10' }, { resolvedAt: '2026-02-10' }]), 'ng_band_settled_upto:2');
  });
  test('(3) some settled this round: "rounds 1–3"', () => {
    assert.equal(label({ negotiation: nego }, [{ resolvedAt: '2026-01-10' }, { resolvedAt: '2026-03-05' }]), 'ng_band_settled_upto:3');
  });
});
