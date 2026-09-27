/* f408 — A PAPER BUILT FROM THE RECORD FREEZES AT THE FIRST SIGNATURE
   (the owner's list, 27 Sep 2026)

   "On contracts drafted from HaTi's built-in templates, the key terms can
   still be changed after the first person signs, so the next signer could see
   different paper."

   Such a contract stores no wording: docBody BUILDS its paper from the record
   every time it is drawn — the template's blanks (fields), who they are and
   what it is worth (printed in its clauses), who we are, and the term's two
   days. The first-signature freeze (SIGNED_WORDING_FROZEN) covered only stored
   wording, so those terms stayed writable between signatures and the paper the
   next signer saw could differ from the one already signed. For THAT paper the
   printed terms are the wording, and the server now freezes them with it
   (recordDrawnPaper / PAPER_TERMS_FROZEN / paperTerm); the Overview draws them
   as read-outs saying why (paperTermsFrozen, js/views/contract.js).

   Red at the parent (3ee647b): (1)(2)(5). (3) and (4) are the CONTROLS that
   the 21 Aug ruling still stands — everything else stays open between
   signatures, and a contract with STORED wording keeps its Key terms open. */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { startHati, seedWorkspace, FOLDER_A } = require('./helpers');

const BASE = over => ({
  folder: FOLDER_A, status: 'Under Review', template: 'RM', counterparty: 'Nordkust Industri AB',
  value: 4800000, valueType: 'estimated', party: 'Highland Corporate Ltd', expiry: '2027-09-30',
  fields: { effDate: '2026-10-01', tonnes: 120, price: 40000 }, metadata: { governingLaw: 'Kenya' },
  comments: [], audit: [], signatures: [], rounds: [], versions: [], obligations: [],
  signerPlan: [
    { id: 'sg-us-1', party: 'internal', order: 1, name: 'Amina Otieno', email: 'admin@example.co.ke', role: 'Director', signed: true, signedAt: '2026-09-27T09:00:00Z' },
    { id: 'sg-cp-1', party: 'counterparty', order: 2, name: 'Grace Njeri', email: 'grace@client.co.ke', role: 'Director', signed: false },
  ],
  ...over,
});

describe('f408 — the terms a record-drawn paper prints freeze with it', () => {
  let h, W;
  before(async () => { h = await startHati(); W = await seedWorkspace(h); });
  after(async () => { await h.stop(); });

  let n = 0;
  const make = async over => {
    const id = 'MK-PF-' + (++n);
    await W.admin.json('/api/contracts/' + id, { method: 'PUT', body: { contract: { id, name: 'Raw Material Supply Agreement', ...BASE(over) }, baseVersion: 0 } });
    return id;
  };
  const save = async (id, patch) => {
    const cur = await W.admin.json('/api/contracts/' + id);
    const v = cur._v; delete cur._v;
    const next = typeof patch === 'function' ? patch(cur) : { ...cur, ...patch };
    return W.admin.raw('/api/contracts/' + id, { method: 'PUT', body: { contract: next, baseVersion: v } });
  };

  test('f408 (1) once one party has signed a built-in paper, every term it prints is refused', async () => {
    const id = await make();
    const tries = {
      fields: c => ({ ...c, fields: { ...c.fields, tonnes: 90 } }),
      counterparty: c => ({ ...c, counterparty: 'Someone Else AB' }),
      value: c => ({ ...c, value: 9900000 }),
      party: c => ({ ...c, party: 'Highland Logistics (K) Ltd' }),
      effDate: c => ({ ...c, fields: { ...c.fields, effDate: '2026-11-01' } }),
      expiry: c => ({ ...c, expiry: '2028-09-30' }),
      template: c => ({ ...c, template: 'ND' }),
    };
    const got = {};
    for (const [k, fn] of Object.entries(tries)) {
      const r = await save(id, fn);
      got[k] = r.status;
      if (r.status === 409) assert.equal(r.json.signedFreeze, true, k + ' is refused by the first-signature freeze');
    }
    assert.deepEqual(Object.entries(got).filter(([, s]) => s !== 409), [], 'refused: ' + JSON.stringify(got));
  });

  test('f408 (2) a day the paper prints from the reading is frozen too — the metadata fallback docTermSpan reads', async () => {
    const id = await make({ expiry: null, metadata: { governingLaw: 'Kenya', expiryDate: '2027-09-30' } });
    const r = await save(id, c => ({ ...c, metadata: { ...c.metadata, expiryDate: '2029-01-01' } }));
    assert.equal(r.status, 409, JSON.stringify(r.json));
  });

  test('f408 (3) CONTROL: what the paper does not print stays open between signatures, as ruled', async () => {
    const id = await make();
    const r = await save(id, c => ({ ...c, metadata: { ...c.metadata, governingLaw: 'Laws of Kenya', noticePeriodDays: 90 },
      obligations: [{ id: 'ob1', desc: 'Deliver the first batch', due: '2026-10-15', status: 'open' }] }));
    assert.equal(r.status, 200, JSON.stringify(r.json));
  });

  test('f408 (4) CONTROL: with STORED wording, and before anybody signs, Key terms stay open', async () => {
    const stored = await make({ redlineText: '<h1>SUPPLY</h1><p>The Supplier shall supply.</p>', format: 'rich' });
    assert.equal((await save(stored, { counterparty: 'Someone Else AB', value: 1 })).status, 200,
      'the stored wording is the paper, and its own freeze is unchanged');
    const unsigned = await make({ signerPlan: BASE().signerPlan.map(s => ({ ...s, signed: false, signedAt: undefined })) });
    assert.equal((await save(unsigned, { counterparty: 'Someone Else AB', value: 1 })).status, 200, 'nobody has signed');
  });

  test('f408 (5) the Overview draws the printed terms as read-outs once signing has started, and says why', () => {
    const SRC = fs.readFileSync(path.join(__dirname, '..', 'js/views/contract.js'), 'utf8');
    const I18N = fs.readFileSync(path.join(__dirname, '..', 'js/i18n.js'), 'utf8');
    const grab = name => { const i = SRC.indexOf('function ' + name + '('); const j = SRC.indexOf('\n}', i); return i >= 0 ? SRC.slice(i, j + 2) : ''; };
    const keys = /const PAPER_TERM_KEYS=\[[^\]]*\];/.exec(SRC);
    assert.ok(keys && grab('paperTermsFrozen'), 'the one reading');
    const frozen = new Function('window', 'isUpload', keys[0] + grab('paperTermsFrozen') + '; return paperTermsFrozen;')(
      { negoAnySignature: c => !!(c.signerPlan || []).some(s => s && s.signed) }, c => c.source === 'upload');
    const signed = BASE();
    assert.equal(frozen(signed), true);
    assert.equal(frozen({ ...signed, redlineText: '<p>x</p>' }), false, 'stored wording: its own freeze');
    assert.equal(frozen({ ...signed, source: 'upload' }), false, 'an upload is its own paper');
    assert.equal(frozen({ ...signed, status: 'Signed' }), false, 'executed: the executed freeze answers');
    assert.equal(frozen({ ...signed, signerPlan: [] }), false, 'nobody has signed');
    assert.match(grab('ktFieldCell'), /if\(frozenTerm\) edit=false;/, 'the grid draws no box');
    assert.match(grab('ktTermsRowsHtml'), /edK\('counterparty'\)/, 'nor do the rows');
    assert.equal((I18N.match(/ov_paper_frozen:/g) || []).length, 2, 'the reason is in both books');
  });
});
