/* J9 claim 2 — renewalWindow(c) against the REAL js/obligations.js + js/family.js
   (via test/world.js's jsdom stage), walking every status the claim names:
   Draft, Declined, archived, an amendment (child), still-Under-Review, and a
   contract executed OUTSIDE HaTi (migrated/uploaded, status Signed with no
   negotiation trail) — none but the last should be offered renewal. */
const assert = require('node:assert/strict');
const { buildWorld } = require('../../world');

const isoDay = off => { const d = new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate()+off);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };

const base = (over) => ({
  id: 'MK-X', name: 'Test', counterparty: 'Y', status: 'Signed',
  metadata: { expiryDate: isoDay(60), noticePeriodDays: 30 },
  ...over,
});

(function main() {
  const { win } = buildWorld({ family: true, obligations: true });
  win.state = { settings: {}, contracts: [] };
  win.daysUntil = iso => Math.ceil((new Date(iso+'T00:00:00') - Date.now())/86400000); // js/views/intelligence.js's own definition, copied verbatim (that file is not loaded on this stage)
  const rw = c => { win.state.contracts = [c]; return win.renewalWindow(c); };
  assert.equal(typeof rw, 'function', 'renewalWindow must exist on window');

  // 1) Draft — must NOT be offered renewal
  let w = rw(base({ status: 'Draft' }));
  assert.equal(w, null, 'a Draft must not be offered renewal, got: ' + JSON.stringify(w));
  console.log('PASS: Draft -> null');

  // 2) Declined — must NOT be offered renewal
  w = rw(base({ status: 'Declined' }));
  assert.equal(w, null, 'a Declined agreement must not be offered renewal, got: ' + JSON.stringify(w));
  console.log('PASS: Declined -> null');

  // 3) Archived (even if otherwise Signed & in window) — must NOT be offered
  w = rw(base({ status: 'Signed', archived: { at: new Date().toISOString(), by: 'Admin' } }));
  assert.equal(w, null, 'an archived agreement must not be offered renewal, got: ' + JSON.stringify(w));
  console.log('PASS: archived -> null');

  // 4) An amendment (child, has parentId) — must NOT be offered renewal itself
  w = rw(base({ status: 'Signed', parentId: 'MK-PARENT' }));
  assert.equal(w, null, 'an amendment must not renew itself, got: ' + JSON.stringify(w));
  console.log('PASS: amendment (has parentId) -> null');

  // 5) Under Review (still being negotiated, not executed) — must NOT be offered
  w = rw(base({ status: 'Under Review' }));
  assert.equal(w, null, 'a contract still under review must not be offered renewal, got: ' + JSON.stringify(w));
  console.log('PASS: Under Review -> null');

  // 6) Executed OUTSIDE HaTi — migrated paper, status Signed, no negotiation
  //    trail (no changes/rounds/signatures array proving in-app execution) —
  //    renewalInForce reads negoExecuted, which per CLAUDE.md must still
  //    recognise paper executed outside HaTi. This is the POSITIVE case.
  w = rw(base({ status: 'Signed', migration: { importedAt: isoDay(-400) } }));
  assert.ok(w && w.inWindow, 'a contract executed OUTSIDE HaTi (migrated, status Signed) SHOULD be offered renewal when inside the window, got: ' + JSON.stringify(w));
  console.log('PASS: migrated/executed-outside-HaTi, Signed -> offered (inWindow=true)');

  console.log('J9-02 renewalWindow status walk: ALL PASS');
})();

// ---- predatesRecord vs missed, live against the real function ----
(function predates() {
  const { win } = buildWorld({ family: true, obligations: true });
  win.state = { settings: {}, contracts: [] };
  win.daysUntil = iso => Math.ceil((new Date(iso+'T00:00:00') - Date.now())/86400000);
  const rw = c => { win.state.contracts = [c]; return win.renewalWindow(c); };

  // Case A: notice period (200d) subtracted from a near expiry (30d out) lands
  // WAY before the day the contract was filed (5 days ago) -> predatesRecord,
  // never "missed".
  const filedAt = (() => { const d = new Date(); d.setDate(d.getDate() - 5); return d.toISOString(); })();
  const cA = base({ status: 'Signed', metadata: { expiryDate: isoDay(30), noticePeriodDays: 200 },
    audit: [{ at: filedAt, action: 'Created' }] });
  const wA = rw(cA);
  assert.ok(wA, 'expected a window');
  assert.equal(wA.predatesRecord, true, 'FAIL: a deadline before the filed date must be predatesRecord=true, got ' + JSON.stringify(wA));
  assert.equal(wA.missed, false, 'FAIL: predatesRecord must NOT also be reported as missed — got ' + JSON.stringify(wA));
  console.log('PASS: a notice deadline arithmetically before the filed date reads predatesRecord=true, missed=false. decideBy=', wA.decideBy, 'filed=', wA.filed);

  // Case B: a genuinely missed deadline (decideBy well after filing, but in
  // the past relative to today) reads missed=true, predatesRecord=false.
  const filedLongAgo = (() => { const d = new Date(); d.setDate(d.getDate() - 400); return d.toISOString(); })();
  const cB = base({ status: 'Signed', metadata: { expiryDate: isoDay(-5), noticePeriodDays: 10 },
    audit: [{ at: filedLongAgo, action: 'Created' }] });
  const wB = rw(cB);
  assert.equal(wB.missed, true, 'FAIL: a genuinely passed deadline (filed long ago) must read missed=true, got ' + JSON.stringify(wB));
  assert.equal(wB.predatesRecord, false, 'FAIL: a genuine miss must not also read predatesRecord, got ' + JSON.stringify(wB));
  console.log('PASS: a genuinely missed deadline (well after filing) reads missed=true, predatesRecord=false.');

  // Case C: the expiry and notice period it counted back from are exactly
  // what is stated on the record — proves "what it counted back from".
  const cC = base({ status: 'Signed', metadata: { expiryDate: isoDay(75), noticePeriodDays: 30 } });
  const wC = rw(cC);
  assert.equal(wC.expiry, isoDay(75), 'the expiry it counted back from must be exactly the stored one');
  assert.equal(wC.notice, 30, 'the notice period it subtracted must be exactly the stored one');
  assert.equal(wC.decideBy, isoDay(45), 'expiry minus notice, computed here');
  console.log('PASS: decideBy is exactly expiry(75d) minus notice(30d) = 45d, both numbers traceable to the record.');

  console.log('J9-02b predatesRecord/missed/traceability: ALL PASS');
})();
