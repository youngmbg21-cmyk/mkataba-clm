/* f419 — THE OVERNIGHT RUN'S TIDY-UP FIXES (the owner's list, 27 Sep 2026)

   y8  an outage stops the overnight sweeps after three failed calls in a row;
   y11 a signed record stored without a field the page adds on load (absent
       versus empty) no longer refuses every later save — and a real change is
       still refused;
   y4  a scan with no `dismissed` list counts its findings instead of throwing;
   y7  the template converter says when it cuts a long Word file.
   Red at a837d09: every claim. */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { startHati, seedWorkspace, FOLDER_A } = require('./helpers');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const SRV = R('server/server.js');

test('f419 (y8) both overnight sweeps stop after three failed calls in a row', () => {
  assert.match(SRV, /const PREP_OUTAGE_STREAK = 3;/);
  const count = (SRV.match(/if \(\+\+streak >= PREP_OUTAGE_STREAK\) \{ out\.outage = true; break; \}/g) || []).length;
  assert.ok(count >= 4, 'a failed answer and a thrown call, in each sweep: ' + count);
});

test('f419 (y4) a scan without its dismissed list is counted, not thrown on', () => {
  const AI = R('js/ai.js');
  const a = AI.indexOf('const openFindings = c =>');
  const src = AI.slice(a, AI.indexOf('\nconst worstSevOf', a));
  const openFindings = new Function(src + '; return openFindings;')();
  assert.deepEqual(openFindings({ scan: { findings: [{ id: 'a' }, { id: 'b' }] } }).map(x => x.id), ['a', 'b']);
  assert.deepEqual(openFindings({ scan: { findings: [{ id: 'a' }], dismissed: ['a'] } }), []);
  assert.deepEqual(openFindings({ scan: {} }), [], 'no findings list is none');
  assert.deepEqual(openFindings({}), []);
});

test('f419 (y7) the converter says when a Word file is longer than it reads', () => {
  assert.match(SRV, /const TPL_CONVERT_CHARS = 60000;/);
  assert.match(SRV, /if \(!isPdf && tplExtractionFull\(structure\)\.length > TPL_CONVERT_CHARS\)/);
});

describe('f419 (y11) absent and empty are one answer on a signed record', () => {
  let h, W;
  before(async () => { h = await startHati(); W = await seedWorkspace(h, { approvalRules: [] }); });
  after(async () => { await h.stop(); });
  test('a save adding an empty box goes through; a real change is still refused', async () => {
    const base = { id: 'MK-Y11', name: 'Old supply', counterparty: 'Acme', folder: FOLDER_A, status: 'Signed',
      hash: 'abc', value: 0, valueType: 'none', audit: [], changes: [] };   // no fields, no signatures
    await W.admin.json('/api/contracts/MK-Y11', { method: 'PUT', body: { contract: base, baseVersion: 0 } });
    let c = await W.admin.json('/api/contracts/MK-Y11'); let v = c._v; delete c._v;
    c.fields = {}; c.signatures = []; c.lastAction = 'today';
    const ok = await W.admin.raw('/api/contracts/MK-Y11', { method: 'PUT', body: { contract: c, baseVersion: v } });
    assert.equal(ok.status, 200, ok.text.slice(0, 200));
    c = await W.admin.json('/api/contracts/MK-Y11'); v = c._v; delete c._v;
    c.fields = { fee: '100' };
    const no = await W.admin.raw('/api/contracts/MK-Y11', { method: 'PUT', body: { contract: c, baseVersion: v } });
    assert.equal(no.status, 409, 'content on a frozen field is still a change');
  });
});
