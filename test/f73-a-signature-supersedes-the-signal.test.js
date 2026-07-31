/* ============================================================
   F73 — "Nothing is signed yet" said over a signature
   ============================================================
   The counterparty signs. Their own screen, and the owner's, go on showing a
   green strip reading:

       READY TO SIGN · Young Mbagaya signalled they are ready to sign —
       28 Jul 2026, 13:13. Nothing is signed yet.

   The last four words are simply false, and they are printed in bold next to a
   contract that has been signed.

   Why it survives: the strip stands down only when the WHOLE CONTRACT reaches
   "Executed". Until every party has signed, the contract's status is still
   "Under Review" — so between the first signature and the last, the product
   announces that nothing is signed while holding a signature.

   The right test already exists a hundred lines away in the same file:
   wsNextAction() checks `c.signatures` for a counterparty signature and says
   "X has signed. Your signature is the only thing left." The readiness strip
   was never given it.

   And it is not one surface but four, all reading the same function: the strip
   on the Docs page, the banner inside the negotiation room, the same banner on
   the counterparty's own page, and the "ready to sign" count on the dashboard.
   Fixed where they all read from — a signal of INTENT is superseded by the ACT.
   Once someone has signed, their signature says it, and it says it better.
*/
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { buildWorld, supplyContract } = require('./world');

const AT = '2026-07-28T13:13:00.000Z';

function negotiated(w, over = {}) {
  const c = supplyContract();
  c.status = 'Under Review';
  c.signatures = [];
  c.negotiation = { round: 1, turn: 'owner', seq: 0, baselineBody: '', baselineText: '',
    ready: { counterparty: { by: 'Young Mbagaya', at: AT } } };
  Object.assign(c, over);
  return c;
}
const cpSignature = () => ({ party: 'counterparty', name: 'Young Mbagaya',
  email: 'young@example.co.ke', at: AT });

describe('F73 — a signature supersedes the signal to sign', () => {
  test('before anyone signs, the signal stands', () => {
    const w = buildWorld({ negotiationView: true, contractView: true });
    const c = negotiated(w);
    assert.ok(w.win.negoReadySignal(c, 'counterparty'), 'they said it, and nobody has acted yet');
    assert.match(w.win.readyToSignStrip(c), /Nothing is signed yet/,
      'which is true at this point, and worth saying');
  });

  test('once they have signed, the strip goes', () => {
    const w = buildWorld({ negotiationView: true, contractView: true });
    const c = negotiated(w, { signatures: [cpSignature()] });
    assert.equal(w.win.negoReadySignal(c, 'counterparty'), null,
      'the act has overtaken the intention');
    assert.equal(w.win.readyToSignStrip(c), '',
      'and nothing on the page claims otherwise');
  });

  test('the negotiation room stops saying it too', () => {
    const w = buildWorld({ negotiationView: true, contractView: true });
    const c = negotiated(w, { signatures: [cpSignature()] });
    const html = w.win.negoReadySignalHtml(c, { side: 'owner' });
    assert.ok(!/Nothing is signed yet/.test(html),
      'the same sentence lives in the room, and had the same fault');
  });

  test('and the dashboard stops counting them as waiting to sign', () => {
    const w = buildWorld({ negotiationView: true, contractView: true });
    const unsigned = negotiated(w);
    const done = negotiated(w, { signatures: [cpSignature()] });
    const waiting = [unsigned, done].filter(c => w.win.negoReadySignal(c, 'counterparty'));
    assert.equal(waiting.length, 1,
      'a contract somebody has already signed is not one waiting for a signature');
    assert.equal(waiting[0], unsigned);
  });

  test('our own signature retires our own signal, not theirs', () => {
    const w = buildWorld({ negotiationView: true, contractView: true });
    const c = negotiated(w, {
      negotiation: { round: 1, turn: 'owner', seq: 0, baselineBody: '', baselineText: '',
        ready: { owner: { by: 'Wanjiru Kamau', at: AT }, counterparty: { by: 'Young Mbagaya', at: AT } } },
      signatures: [{ party: 'first', name: 'Wanjiru Kamau', at: AT }],
    });
    assert.equal(w.win.negoReadySignal(c, 'owner'), null, 'we have signed');
    assert.ok(w.win.negoReadySignal(c, 'counterparty'),
      'they have not, and their signal is still the live fact about them');
  });

  test('an executed contract shows no strip at all, as before', () => {
    const w = buildWorld({ negotiationView: true, contractView: true });
    const c = negotiated(w, { status: 'Signed', signatures: [cpSignature()] });
    assert.equal(w.win.readyToSignStrip(c), '');
  });
});
