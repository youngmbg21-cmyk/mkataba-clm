/* ============================================================
   F224 — the signature assurance ladder (W3-3, the gap-map order)
   ============================================================
   Not every signature this product takes is the same claim. Somebody who
   typed a name into a shared link, somebody who proved an emailed code
   first, and a colleague signing on an account that also asked for a
   two-step code are three different things — and in a dispute the
   difference is the whole question. The record held all of it in scattered
   fields and said none of it out loud.

   The rules pinned here:
   - THE LADDER CHANGES WHAT IS SAID, NOT WHAT IS ACCEPTED. Nothing is
     refused that was accepted yesterday; today's signing is still the
     default rung.
   - STAMPED AT SIGNING, NEVER DERIVED AFTERWARDS. Whether the signer's
     account carried a second step is a fact about the MOMENT: turning it
     off next year must not quietly downgrade a signature taken today, and
     turning it on must not silently upgrade one.
   - AN INFERENCE IS NEVER DRESSED AS A RECORD. Signatures taken before the
     stamp existed are read conservatively and reported as derived.
   - THE WEAKEST LINK IS THE CLAIM: the contract-level statement takes the
     LOWEST rung, because the flattering reading is the one a dispute
     destroys.
   - THE BANKID RUNG IS DECLARED AND NOT AVAILABLE, so every surface can
     say "not this one" honestly and the rung clips on when a broker
     account exists. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

/* The module is required directly — it is pure arithmetic over a signature
   record. Its labels are GETTERS that read the dictionary AT ACCESS TIME,
   which is the house rule (a label must follow the reader's language, not
   the language at load), so the stub stays installed for the whole file
   rather than only across the require. Returning the key means the RUNGS
   can be asserted without pinning anybody's wording. */
global.i18t = k => k;
const ladder = () => require('../js/assurance.js');

describe('F224 — the rungs', () => {
  const A = ladder();

  test('the ladder is ordered, and every rung says what it proves', () => {
    const ranks = A.SIGNATURE_ASSURANCE.map(r => r.rank);
    assert.deepEqual([...ranks], [...ranks].sort((x, y) => x - y), 'ordered by what is actually proved');
    for (const r of A.SIGNATURE_ASSURANCE) {
      assert.ok(r.key && r.label, r.key + ' has a name');
      assert.ok(r.basis, r.key + ' says what it proves — a rung with no basis is a label');
    }
  });

  test('a typed name, a checked code and an account are three different claims', () => {
    assert.equal(A.assuranceAtSigning({ method: 'share-link' }), 'typed');
    assert.equal(A.assuranceAtSigning({ method: 'share-link', verify: 'tok' }), 'email-code');
    assert.equal(A.assuranceAtSigning({ method: 'session-authenticated' }), 'account');
    assert.equal(A.assuranceAtSigning({ method: 'session-authenticated', twoStep: true }), 'account-2fa');
    assert.equal(A.assuranceAtSigning({ external: true }), 'paper', 'migrated paper is its own rung');
  });

  test('the national eID rung is declared and NOT available', () => {
    const eid = A.assuranceRung('national-eid');
    assert.ok(eid, 'it is in the ladder, so screens can name it');
    assert.equal(eid.available, false, 'and it is honest about not being offered');
    assert.ok(!A.assuranceAvailable().some(r => r.key === 'national-eid'));
    assert.equal(A.assuranceAvailable().length, A.SIGNATURE_ASSURANCE.length - 1);
  });
});

describe('F224 — reading a stored signature', () => {
  const A = ladder();

  test('a stamped signature is reported as a RECORD', () => {
    const r = A.signatureAssurance({ method: 'session-authenticated', assurance: 'account-2fa' }, {});
    assert.equal(r.key, 'account-2fa');
    assert.equal(r.derived, false);
  });

  test('an OLD signature is read conservatively and marked derived', () => {
    const r = A.signatureAssurance({ method: 'session-authenticated' }, {});
    assert.equal(r.key, 'account', 'never account-2fa — nothing on the record proves the second step was in force');
    assert.equal(r.derived, true, 'and an inference is never dressed as a record');
  });

  test('a stamp is not overturned by what the account looks like today', () => {
    /* The point of stamping. Somebody turning two-step off next year must
       not downgrade a signature taken while it was on. */
    const r = A.signatureAssurance({ method: 'session-authenticated', assurance: 'account-2fa' }, {});
    assert.equal(r.key, 'account-2fa');
  });

  test('a nonsense stamp falls back to reading the fields', () => {
    const r = A.signatureAssurance({ method: 'share-link', verify: 't', assurance: 'platinum' }, {});
    assert.equal(r.key, 'email-code');
    assert.equal(r.derived, true);
  });
});

describe('F224 — the agreement as a whole', () => {
  const A = ladder();

  test('THE WEAKEST LINK IS THE CLAIM', () => {
    const c = { signatures: [
      { method: 'session-authenticated', assurance: 'account-2fa' },
      { method: 'share-link', assurance: 'typed' },
    ] };
    const a = A.contractAssurance(c);
    assert.equal(a.key, 'typed', 'the flattering reading is the one a dispute destroys');
  });

  test('and it says so when any part of it was inferred', () => {
    const c = { signatures: [
      { method: 'session-authenticated', assurance: 'account' },
      { method: 'share-link', verify: 'tok' },
    ] };
    assert.equal(A.contractAssurance(c).derived, true);
  });

  test('nothing signed yet is null, not a rung', () => {
    assert.equal(A.contractAssurance({ signatures: [] }), null);
    assert.equal(A.contractAssurance({}), null);
  });
});

describe('F224 — where it is written down', () => {
  test('the rung is stamped at every signing site', () => {
    const ct = read('js/views/contract.js');
    const stamps = (ct.match(/assurance:\(typeof assuranceAtSigning==='function'\)/g) || []).length;
    assert.equal(stamps, 2, 'both internal signing sites stamp it');
    assert.match(ct, /twoStep:!!\(u&&u\.twoStep\)/, 'with what is true at that moment');
    const core = read('js/core.js');
    assert.match(core, /assurance:\(typeof assuranceAtSigning==='function'\)/,
      'and the counterparty response stamps it as it is applied');
  });

  test('the evidence pack states the rung, its basis, and whether it was inferred', () => {
    const core = read('js/core.js');
    const pack = core.slice(core.indexOf('function downloadEvidence'), core.indexOf('function downloadEvidence') + 4200);
    for (const k of ['assuranceLabel', 'assuranceBasis', 'assuranceDerived'])
      assert.ok(pack.includes(k), 'the pack must carry ' + k);
    assert.match(pack, /The lowest assurance among the signatures below/,
      'and one statement for the agreement, taken from the weakest signature');
  });

  test('the signing screen says what was proved, with the basis on hover', () => {
    const ct = read('js/views/contract.js');
    assert.match(ct, /const asWord=s=>\{ const a=\(typeof signatureAssurance==='function'\)/);
    assert.match(ct, /title="\$\{esc\(String\(a\.rung\.basis\)\)\}"/, 'the full basis is one hover away');
    assert.match(ct, /a\.derived\?'\*':''/, 'and an inferred reading is marked as one');
  });

  test('the words exist in both languages', () => {
    const i18n = read('js/i18n.js');
    for (const k of ['as_paper', 'as_typed', 'as_code', 'as_account', 'as_account_2fa', 'as_eid',
      'as_typed_basis', 'as_code_basis', 'as_eid_basis', 'as_line', 'as_line_derived'])
      assert.equal((i18n.match(new RegExp('\\b' + k + ':', 'g')) || []).length, 2, k);
  });
});
