/* ============================================================
   f1175 — "which approvals are late?" is not a question about duties
   ============================================================
   Bug log: the Board's free reader (hbParse) took any "late" as the
   obligations question (HB_RX.obl matches \blate\b) and opened the late
   duties list for "how many approvals are late?". A question that names
   approvals is no longer read as duties; one about duties still is. Red at
   the parent: the approvals question opened f:overdue.
   ============================================================ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');
const HB = fs.readFileSync(path.join(__dirname, '..', 'js/views/homeboard.js'), 'utf8');

function world(){
  const w = buildWorld({ intelView: true }).win;
  w.state = { contracts: [], settings: {}, view: 'dashboard' };
  w.FOLDERS = {}; w.cKind = () => 'Contract';
  w.getContract = () => null;
  w.payDays = () => null; w.paySide = () => null; w.contractExpired = () => false;
  w.currentUser = () => ({ id: 'u1', name: 'Amina', role: 'legal' });
  w.eval(HB);
  w.eval('intel.lenses=[]; intel.groups=null; intel.groupBy="folder"; intel.history=[];');
  w.hbPaintBoard = () => {};
  return w;
}
const read = q => { const r = world().hbParse(q); return r ? { ...r } : null; };

describe('f1175 — late approvals are not late duties', () => {
  for (const q of ['how many approvals are late?', 'which approvals are late', 'vilka godkännanden är sena'])
    test(JSON.stringify(q) + ' does not open the late duties', () => {
      const r = read(q);
      assert.ok(!(r && r.key === 'f:overdue'), 'got ' + JSON.stringify(r));
      assert.ok(!(r && r.kind === 'obl'));
    });
  for (const q of ['late obligations', 'show late duties'])
    test(JSON.stringify(q) + ' still opens the late duties', () => {
      assert.equal((read(q) || {}).key, 'f:overdue');
    });
});
