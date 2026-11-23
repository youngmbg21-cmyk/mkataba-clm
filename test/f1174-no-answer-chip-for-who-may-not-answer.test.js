/* ============================================================
   f1174 — no "Answer the redlines" for who may not answer
   ============================================================
   Bug log, 20 Nov 2026: a Viewer (or a desk Reader) was still offered the
   "Answer the redlines" chip (caOwedSteps) and the Dossier's "their ask · Go
   to it" rows (pdTheirAsks, pdTheirAsksRow), leading to Redlines they can
   only read. Both now ask negoMayAnswer, the one check (f1121). Red at the
   parent: both offered the work.
   ============================================================ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const fnBody = (src, name) => { const i = src.search(new RegExp('(async )?function ' + name + '\\(')); if (i < 0) return ''; return src.slice(i, src.indexOf('\n}', i) + 2); };
const run = (src, ctx) => { ctx.window = ctx; vm.createContext(ctx); vm.runInContext(src, ctx); return ctx; };

const CA = R('js/copilotacts.js'), PD = R('js/paperdesk.js');
const c = { id: 'MK-1', changes: [{ id: 'CHG-1', authorSide: 'counterparty', status: 'pending' }] };

describe('f1174 — the answer work goes only to who may answer', () => {
  const owed = may => run(fnBody(CA, 'caOwedSteps'), {
    caChipLead: () => 'redline', negoNeedsYouIds: () => ['CHG-1'], negoMayAnswer: () => may }).caOwedSteps(c);
  test('(1) the chip: offered to who may answer, never to who may not', () => {
    assert.deepEqual([...owed(true)], ['answer']);
    assert.deepEqual([...owed(false)], ['redline']);
  });
  const asks = may => run(fnBody(PD, 'pdTheirAsks'), {
    negoNeedsYouIds: () => ['CHG-1'], negoMayAnswer: () => may }).pdTheirAsks(c);
  test('(2) the Dossier\'s ask rows: the same', () => {
    assert.equal(asks(true).length, 1);
    assert.equal(asks(false).length, 0);
  });
  test('(3) the Dossier\'s round row asks the same check', () => {
    assert.match(fnBody(PD, 'pdTheirAsksRow'), /negoMayAnswer\(c\)/);
  });
});
