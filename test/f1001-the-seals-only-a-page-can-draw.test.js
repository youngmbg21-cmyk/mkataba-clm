'use strict';
/* f1001 — THE SEALS ONLY A PAGE CAN DRAW (owner, 10 Nov 2026: "fix the
   template contracts gap too").

   A paper drawn from a template and never edited has no wording stored, so
   the server cannot draw its frozen copy. A contract whose every signature
   came in before the page prepared that copy sat unsealed until somebody
   opened THAT contract. Now the first page an editor opens looks, once per
   sitting, for every visible contract with every signature in and no seal,
   draws its copy and saves it — the server seals on that save.

   The sweep is sliced out of js/core.js and run against stand-ins: what is
   under test is WHICH records it draws a copy for, and that it saves them.
   The server's seal on that save is f580's. */
const { describe, test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');

const CORE = fs.readFileSync(path.join(__dirname, '..', 'js', 'core.js'), 'utf8');
const SRC = CORE.slice(CORE.indexOf('let _sealCatchUpRan=false;'), CORE.indexOf('async function pollPendingResponses(){'));

function sandbox(contracts, opts = {}) {
  const log = { drawn: [], saved: [], flushed: 0, loaded: [] };
  const plan = c => c.signerPlan || [];
  const ctx = {
    state: { contracts },
    API_MODE: () => opts.api !== false,
    canEdit: () => opts.editor !== false,
    isExternallyExecuted: c => c.hash === 'MIGRATED' || !!(c.execution && c.execution.offPlatform),
    ensureFull: async c => { log.loaded.push(c.id); c._loaded = true; },
    sealPrepStamp: async c => { log.drawn.push(c.id); c.sealPrep = { html: '<p>x</p>' }; },
    persist: c => { log.saved.push(c.id); },
    flushSaves: async () => { log.flushed++; for (const c of contracts) if (c.sealPrep) c.status = 'Signed'; },
  };
  ctx.window = { PORTAL_MODE: !!opts.portal, sealPrepStamp: ctx.sealPrepStamp,
    signerPlan: plan, allSigned: c => plan(c).length > 0 && plan(c).every(s => s.signed),
    bothPartiesSigned: c => (c.signatures || []).some(s => s.party === 'counterparty') && (c.signatures || []).some(s => s.party !== 'counterparty') };
  ctx.signerPlan = ctx.window.signerPlan; ctx.allSigned = ctx.window.allSigned; ctx.bothPartiesSigned = ctx.window.bothPartiesSigned;
  vm.createContext(ctx);
  vm.runInContext(SRC + '\nthis.sealCatchUpPage = sealCatchUpPage; this.sealCatchUpDue = sealCatchUpDue;', ctx);
  return { ctx, log };
}
const at = '2026-07-30T14:18:00.000Z';
const route = (us, them) => [
  { id: 'sg-us', party: 'internal', order: 1, name: 'Young Mbagaya', signed: us, ...(us ? { at } : {}) },
  { id: 'sg-cp', party: 'counterparty', order: 2, name: 'John Wayne', signed: them, ...(them ? { at } : {}) }];
const tplContract = (id, extra = {}) => ({ id, name: 'Raw Materials Procurement Agreement', template: 'supply', status: 'Under Review',
  signerPlan: route(true, true), signatures: [{ party: 'internal-planned', at }, { party: 'counterparty', at }], ...extra });

describe('f1001 the first page an editor opens draws the copies the server cannot', () => {
  test('1 a template paper with every signature in and no seal: its copy is drawn and saved, and the save seals it', async () => {
    const c = tplContract('MK-243');
    const { ctx, log } = sandbox([c]);
    const n = await ctx.sealCatchUpPage();
    assert.deepEqual(log.loaded, ['MK-243'], 'the full record is read first');
    assert.deepEqual(log.drawn, ['MK-243']);
    assert.deepEqual(log.saved, ['MK-243']);
    assert.equal(n, 1);
    assert.equal(c.status, 'Signed');
  });
  test('2 [control] still waiting on a signer, held, sealed, declined, executed elsewhere or code-named: left alone', async () => {
    const list = [
      tplContract('W', { signerPlan: route(true, false) }),
      tplContract('H', { hold: { at } }),
      tplContract('S', { status: 'Signed', hash: 'abc' }),
      tplContract('D', { status: 'Declined' }),
      tplContract('M', { hash: 'MIGRATED' }),
      tplContract('O', { execution: { method: 'outside' } }),
      tplContract('C', { _codeNamed: true })];
    const { ctx, log } = sandbox(list);
    assert.equal(await ctx.sealCatchUpPage(), 0);
    assert.deepEqual(log.drawn, []);
    assert.deepEqual(log.saved, []);
  });
  test('3 with no route, both parties\' marks are enough; one side\'s is not', async () => {
    const both = tplContract('B', { signerPlan: [] });
    const ours = tplContract('U', { signerPlan: [], signatures: [{ party: 'internal-planned', at }] });
    const { ctx, log } = sandbox([both, ours]);
    await ctx.sealCatchUpPage();
    assert.deepEqual(log.drawn, ['B']);
  });
  test('4 once per sitting; never for a viewer, the counterparty\'s page or without a server', async () => {
    const c = tplContract('X');
    const s = sandbox([c]);
    await s.ctx.sealCatchUpPage(); c.status = 'Under Review'; delete c.sealPrep;
    await s.ctx.sealCatchUpPage();
    assert.equal(s.log.drawn.length, 1, 'the second call in the same sitting does nothing');
    for (const opts of [{ editor: false }, { portal: true }, { api: false }]) {
      const o = sandbox([tplContract('Y')], opts);
      await o.ctx.sealCatchUpPage();
      assert.deepEqual(o.log.drawn, [], JSON.stringify(opts));
    }
  });
  test('5 it is started with the other first-load reads, in server mode', () => {
    assert.match(CORE, /pollPendingResponses\(\); refreshAiUsage\(\); sealCatchUpPage\(\);/);
  });
});
