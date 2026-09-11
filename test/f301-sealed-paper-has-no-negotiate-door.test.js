/* f301 — AN EXECUTED CONTRACT CANNOT START A NEGOTIATION (Young ruled 11 Sep 2026)
   ============================================================================
   "If a contract has been executed, the start negotiating button should be
   greyed out and therefore locked out from the negotiate page."

   The wording already froze at the first signature (negoWordingFrozen at the
   filing funnel); what was missing was the DOOR saying so before the press.
   One reading, negoMayStart, is asked by the two drawn doors at draw time, by
   the funnel every named door goes through (openRedlineWorkbench), and by the
   page's own paint. These claims pin the reading and pin that each of those
   three askers really asks it — a name sweep, f232's shape — so a fourth door
   added later cannot forget. The pressing is proved in the browser
   (negotiations-door-verify section 9). */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

test('f301 (1) negoMayStart shuts on every way a contract can be sealed, and is open on live paper', () => {
  const w = buildWorld();
  const { negoMayStart } = w.win;
  assert.equal(typeof negoMayStart, 'function');
  const base = { id: 'X', status: 'Draft', signatures: [], changes: [] };
  assert.equal(negoMayStart(base).ok, true); assert.equal(negoMayStart(base).why, '');
  assert.equal(negoMayStart({ ...base, status: 'Signed' }).why, 'sealed');
  assert.equal(negoMayStart({ ...base, hash: 'abc' }).why, 'sealed');
  assert.equal(negoMayStart({ ...base, execution: { at: '2026-09-11T00:00:00Z' } }).why, 'sealed');
  assert.equal(negoMayStart({ ...base, signatures: [{ by: 'A' }] }).why, 'sealed', 'one signature row shuts it');
  assert.equal(negoMayStart({ ...base, signerPlan: [{ name: 'A', signed: true }] }).why, 'sealed', 'a signed plan row shuts it');
  assert.equal(negoMayStart({ ...base, archived: { at: 'x', by: 'y' } }).why, 'archived');
  assert.equal(negoMayStart(null).ok, false);
});

test('f301 (2) the reading writes nothing — asking it creates no negotiation', () => {
  const w = buildWorld();
  const c = { id: 'X', status: 'Draft', signatures: [], changes: [] };
  w.win.negoMayStart(c);
  assert.equal(c.negotiation, undefined);
  assert.deepEqual(c.changes, []);
});

test('f301 (3) the sentence follows the reason and is one of two keys in both books', () => {
  const w = buildWorld();
  const { negoMayStartLine } = w.win;
  assert.match(negoMayStartLine({ status: 'Signed' }), /executed|sealed/i);
  assert.match(negoMayStartLine({ status: 'Draft', archived: { at: 'x' } }), /archived/i);
  assert.equal(negoMayStartLine({ status: 'Draft' }), '');
  const i18n = read('js/i18n.js');
  for (const k of ['ng_start_sealed', 'ng_start_archived'])
    assert.equal((i18n.match(new RegExp(`^\\s*${k}:`, 'mg')) || []).length, 2, `${k} in both books`);
});

test('f301 (4) the wall is in the funnel, asked BEFORE anything moves', () => {
  const src = read('js/views/negotiation.js');
  const fn = src.slice(src.indexOf('function openRedlineWorkbench('));
  const body = fn.slice(0, fn.indexOf('\n}\n'));
  const ask = body.indexOf('negoMayStart(');
  const evict = body.indexOf('redlineEvict(');
  const view = body.indexOf("setView('redline')");
  assert.ok(ask > 0 && evict > 0 && view > 0);
  assert.ok(ask < evict && ask < view, 'the reading is asked before the bench is evicted or the view changes');
  assert.match(body, /return false;[\s\S]*redlineEvict\(/, 'a refusal returns false without navigating');
});

test('f301 (5) both drawn doors ask the reading where they are BUILT, and the page asks it on its paint', () => {
  const contract = read('js/views/contract.js');
  const tabEnd = contract.slice(contract.indexOf('function wsTabRowEndHtml('));
  const tabEndBody = tabEnd.slice(0, tabEnd.indexOf('\n}\n'));
  assert.match(tabEndBody, /negoMayStart\(c\)/, '#ws-to-nego asks at draw time');
  assert.match(tabEndBody, /id="ws-to-nego"[^>]*\$\{may\.ok\?'':' disabled'\}/, 'and goes disabled, never hidden');
  const needs = contract.slice(contract.indexOf('function negoRoundNeedsHtml('));
  assert.match(needs.slice(0, needs.indexOf('\n}\n')), /negoMayStart\(c\)/, '#ws-round-needs asks too');
  const nego = read('js/views/negotiation.js');
  const paint = nego.slice(nego.indexOf('function renderRedline('));
  assert.match(paint.slice(0, 6000), /negoMayStart\(c\)/, 'the page asks on its own paint');
  const reg = read('js/views/register.js');
  const openRow = reg.slice(reg.indexOf('const openRow='));
  assert.match(openRow.slice(0, 900), /negoMayStart\(/, 'the Negotiations row lands on the contract where it cannot open the negotiation');
});
