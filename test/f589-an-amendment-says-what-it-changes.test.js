/* f589 — AN AMENDMENT CHANGES WHAT IT SAYS IT CHANGES, AND THE AGREEMENT
   READS AS AMENDED (B12, B13; 8 Oct 2026).
   ============================================================
   The 9 Oct review:
     B12 a term-only amendment was held for "no value — this contract type
         carries one", and the figure typed to get past the hold became the
         whole deal's value;
     B13 after an amendment that moved the end date was signed, the parent's
         Overview printed the stored date in its Expiry cell while the family
         card beside it said the live date came from the amendment.
   Run: node --test test/f589-an-amendment-says-what-it-changes.test.js */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { buildWorld } = require('./world');

const ME = { id: 'u_y', name: 'Young Mbagaya', role: 'admin', email: 'y@hati.co.ke' };
function world(){
  const w = buildWorld({ user: ME, family: true, contractView: true, negotiationView: true }).win;
  w.state = { settings: {}, contracts: [], activeId: null, view: 'workspace' };
  w.FIRST_PARTY = 'HaTi Ltd';
  w.getUsers = () => [ME];
  w.getContract = id => w.state.contracts.find(x => x.id === id) || null;
  w.canEdit = () => true;
  /* core.js is not on this stage: its two readers, as the product writes them */
  if (typeof w.isMonetary !== 'function') w.isMonetary = c => !c || (c.valueType ? c.valueType !== 'none' : true);
  if (typeof w.ctTheirEmail !== 'function') w.ctTheirEmail = () => '';
  return w;
}
const parent = w => { const c = { id: 'MK-318', name: 'Supply Agreement', counterparty: 'Delta LLC', party: 'HaTi Ltd',
  status: 'Signed', hash: 'h', value: 1200000, valueType: 'standard', expiry: '2026-12-31', audit: [], signatures: [], fields: {} };
  w.state.contracts.unshift(c); return c; };
const kid = (w, over) => { const k = Object.assign({ id: 'MK-318-A1', parentId: 'MK-318', relation: 'amendment', name: 'Amendment No. 1',
  counterparty: 'Delta LLC', valueType: 'standard', status: 'Signed', hash: 'k', metadata: { effectiveDate: '2027-01-01' },
  audit: [], signatures: [], fields: {}, amends: [] }, over || {});
  w.state.contracts.push(k); if (w.familyIndexDirty) w.familyIndexDirty(); return k; };

test('B12 a term-only amendment is not held for a value', () => {
  /* contractReadiness lives in js/core.js, which this stage does not load: the
     rule is pinned where it is written (the Sign button and the share
     readiness both read this one list). */
  const CORE = require('node:fs').readFileSync(require('node:path').join(__dirname, '..', 'js', 'core.js'), 'utf8');
  const fn = CORE.slice(CORE.indexOf('function contractReadiness(c){'), CORE.indexOf('function contractReadiness(c){') + 1200);
  assert.match(fn, /if\(isMonetary\(c\) && !\(Number\(c\.value\)>0\) && !c\.parentId\)\s*add\('block','value'/);
});

test('B12 a value the amendment did not say it changes is not the deal\'s value', () => {
  const w = world(); const p = parent(w);
  kid(w, { value: 999 });
  assert.equal(w.effectiveTerm(p, 'value').v, 1200000, 'a figure typed to get past a hold moves nothing');
  assert.equal(w.effectiveValueView(p).value, 1200000);
});

test('B12 …and one it does say it changes still is', () => {
  for (const say of [{ valueSetHere: true }, { amendFacts: { value: 1320000 } }]) {
    const w = world(); const p = parent(w);
    kid(w, { value: 1320000, ...say });
    const e = w.effectiveTerm(p, 'value');
    assert.equal(e.v, 1320000, JSON.stringify(say));
    assert.equal(e.from.id, 'MK-318-A1');
  }
});

test('B13 the Expiry cell reads the date as amended, and says by which document', () => {
  const w = world(); const p = parent(w);
  kid(w, { expiry: '2028-06-30' });
  const R = w.ktFactReads(p);
  assert.match(R.expiry, /2028|30 Jun/, R.expiry);
  assert.equal(R.expiryFrom, 'MK-318-A1');
  assert.equal(p.expiry, '2026-12-31', 'the stored date is not rewritten');
  const html = w.ktReadValue(p, 'expiry');
  assert.match(html, /as amended by MK-318-A1/);
  const w2 = world(); const p2 = parent(w2);
  kid(w2, { expiry: '2028-06-30', status: 'Draft', hash: null });
  assert.equal(w2.ktFactReads(p2).expiryFrom, '', '[control] an unsigned amendment changes nothing');
});
