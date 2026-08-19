/* ============================================================
   F218 — money in its own currency (W2-1, the gap-map order)
   ============================================================
   Owner-ruled 19 Aug 2026: "i would want for the contract to be converted to
   local currency when it comes to reporting so the dashboards or reporting
   have one currency." Before this, every amount was SUMMED as though it were
   the workspace currency — a USD 40,000 contract added 40,000 shillings to
   the headline figure, which is a wrong number wearing a right number's
   clothes.

   What is true now:
   - REPORTING converts. Dashboards, stats, analytics and the monthly letter
     carry ONE figure in the workspace currency, each foreign contract
     converted at the admin's dated rate.
   - A CONTRACT'S OWN PAGE keeps its own currency. Nothing stored is ever
     rewritten.
   - NO RATE IS EVER GUESSED. A currency with no rate on file is left OUT of
     the converted figure and the leaving-out is reported (fxMissing), never
     silently trimmed.
   - THE GUARDS COMPARE LIKE WITH LIKE. A signing limit is in the workspace
     currency, so the contract converts before it is measured — and where it
     cannot be converted the signature is REFUSED, because on a signature an
     unanswerable question errs toward the human.
   - ONE ARITHMETIC, TWO HOSTS. The conversion lives once in
     js/jurisdiction.js; the server injects its own readers. A client/server
     twin of a money formula is the recorded defect class.
   - THE RATES ARE ADMIN-SET AND DATED — never fetched from an outside
     service, so no figure moves unless an admin decided it should. */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { startHati, seedWorkspace, FOLDER_A } = require('./helpers');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

describe('F218 — the model, on its own', () => {
  const jx = require('../js/jurisdiction.js');
  let rates = {};
  before(() => {
    jx.fxSetRatesReader(() => rates);
    jx.fxSetHomeReader(() => 'KES');
  });

  test('a contract with no currency of its own is home currency — yesterday\'s behaviour exactly', () => {
    assert.equal(jx.contractCurrency({ value: 1000 }), 'KES');
    assert.equal(jx.fxHomeValue({ value: 1000 }), 1000, 'unchanged, unconverted, no rate needed');
    assert.equal(jx.fxHome({ value: 1000 }).converted, false);
  });

  test('prose, blanks and typos in the currency field fall back to home rather than breaking', () => {
    for (const bad of ['', '  ', 'dollars', 'US$', 'KES ', 'k'])
      assert.equal(jx.contractCurrency({ value: 5, metadata: { currency: bad } }), 'KES', JSON.stringify(bad));
    assert.equal(jx.contractCurrency({ value: 5, metadata: { currency: ' usd ' } }), 'USD',
      'a real code is read whatever the spacing or case');
  });

  test('with a rate on file a foreign contract converts; without one it is LEFT OUT and named', () => {
    const usd = { value: 40000, metadata: { currency: 'USD' } };
    const none = jx.fxHome(usd);
    assert.equal(none.missing, true, 'no rate — nothing is guessed');
    assert.equal(none.v, 0, 'and it contributes nothing to a total');
    assert.deepEqual(jx.fxMissing([{ ...usd, status: 'Draft' }]), { USD: 1 }, 'the omission is reportable');

    rates = { USD: { rate: 129.5, at: '2026-08-19' } };
    const conv = jx.fxHome(usd);
    assert.equal(conv.converted, true);
    assert.equal(conv.v, Math.round(40000 * 129.5));
    assert.equal(conv.at, '2026-08-19', 'a rate is a claim WITH A DATE');
    assert.deepEqual(jx.fxMissing([{ ...usd, status: 'Draft' }]), {}, 'nothing is left out any more');
  });

  test('the contract\'s own print keeps its own currency', () => {
    assert.match(jx.fmtMoneyOf({ value: 40000, metadata: { currency: 'USD' } }), /^USD /);
    assert.match(jx.fmtMoneyOf({ value: 40000 }), /^KES /);
  });

  test('declined and archived contracts are not counted as "left out"', () => {
    rates = {};
    const eur = { value: 10, metadata: { currency: 'EUR' } };
    assert.deepEqual(jx.fxMissing([{ ...eur, status: 'Declined' }]), {});
    assert.deepEqual(jx.fxMissing([{ ...eur, status: 'Draft', archived: { at: 'x' } }]), {});
    assert.deepEqual(jx.fxMissing([{ ...eur, status: 'Draft', value: 0 }]), {}, 'nor an unvalued one');
  });
});

describe('F218 — the server reports one currency', () => {
  let h, W;
  const put = (id, over) => W.admin.json('/api/contracts/' + id, { method: 'PUT', body: { contract: {
    id, name: over.name || ('FX fixture ' + id), counterparty: 'Global Freight Ltd',
    folder: FOLDER_A, status: 'Signed', fields: {}, metadata: {}, obligations: [],
    audit: [], rounds: [], versions: [], signatures: [], comments: [], ...over } } });

  before(async () => {
    h = await startHati();
    W = await seedWorkspace(h, { contracts: [] });   // an empty book, so the sums are ours
    // distinct counterparties, so the by-party roll-up below measures ONE of them
    await put('MK-FX-HOME', { value: 1000000, name: 'Local haulage', counterparty: 'Rift Valley Transporters' });
    await put('MK-FX-USD', { value: 40000, name: 'Cross-border freight', metadata: { currency: 'USD' } });
  });
  after(async () => { await h.stop(); });

  test('with no rate on file the foreign contract is left out — and the figure says so', async () => {
    const s = await W.admin.json('/api/stats');
    assert.equal(s.totalValue, 1000000, 'the dollar contract is NOT added as though it were shillings');
    assert.deepEqual(s.fxMissing, { USD: 1 }, 'and the omission travels, so a screen can say it');
  });

  test('setting a rate moves every reporting figure, and clears the omission', async () => {
    await W.admin.json('/api/settings/fx-rates', { method: 'PUT', body: { code: 'USD', rate: 129.5 } });
    const s = await W.admin.json('/api/stats');
    assert.equal(s.totalValue, 1000000 + Math.round(40000 * 129.5), 'one figure, one currency');
    assert.deepEqual(s.fxMissing, {}, 'nothing is left out any more');
    const a = await W.admin.json('/api/analytics');
    const party = a.byParty.find(p => p.counterparty === 'Global Freight Ltd');
    assert.equal(party.val, Math.round(40000 * 129.5), 'the analytics roll-ups convert too');
    assert.deepEqual(a.fxMissing, {});
  });

  test('the rate is stored with the day it was set, and only an admin may set it', async () => {
    const boot = await W.admin.json('/api/bootstrap');
    const r = (boot.settings.fxRates || {}).USD;
    assert.equal(r.rate, 129.5);
    assert.match(r.at, /^\d{4}-\d{2}-\d{2}$/, 'a rate is a claim with a date');
    const asEditor = await W.unrestricted.raw('/api/settings/fx-rates', { method: 'PUT', body: { code: 'EUR', rate: 140 } });
    assert.equal(asEditor.status, 403, 'an exchange rate moves every figure — admin only');
  });

  test('nonsense is refused rather than stored', async () => {
    for (const body of [{ code: 'US', rate: 1 }, { code: 'USDD', rate: 1 }, { code: 'EUR', rate: -3 }]) {
      const r = await W.admin.raw('/api/settings/fx-rates', { method: 'PUT', body });
      assert.equal(r.status, 400, JSON.stringify(body));
    }
    const own = await W.admin.raw('/api/settings/fx-rates', { method: 'PUT', body: { code: 'KES', rate: 1 } });
    assert.equal(own.status, 400, 'the workspace currency needs no rate');
  });

  test('removing a rate puts that currency back to honestly left out', async () => {
    await W.admin.json('/api/settings/fx-rates', { method: 'PUT', body: { code: 'USD', rate: null } });
    const s = await W.admin.json('/api/stats');
    assert.equal(s.totalValue, 1000000);
    assert.deepEqual(s.fxMissing, { USD: 1 });
  });

  test('an ordinary settings save cannot silently revert the rates', async () => {
    await W.admin.json('/api/settings/fx-rates', { method: 'PUT', body: { code: 'USD', rate: 130 } });
    await W.admin.json('/api/settings', { method: 'PUT', body: { somethingElse: true } });
    const boot = await W.admin.json('/api/bootstrap');
    assert.equal((boot.settings.fxRates || {}).USD.rate, 130,
      'a stale blob save that reverted a rate would move every figure in the workspace');
  });

  test('the STORED value is never rewritten — only what the screens say about it', async () => {
    const c = await W.admin.json('/api/contracts/MK-FX-USD');
    assert.equal(c.value, 40000, 'the contract still holds what the paper says');
    assert.equal(c.metadata.currency, 'USD');
  });
});

describe('F218 — the guards compare like with like', () => {
  test('the signing cap converts, and refuses rather than guesses', () => {
    const src = read('js/approvals.js');
    const fn = src.slice(src.indexOf('function signCapBlocker'), src.indexOf('function signCapLadder'));
    assert.match(fn, /fxHome\(c\)/, 'the contract is converted before it is measured');
    assert.match(fn, /if\(h\.missing\) return \{ key:'signcap'/,
      'no rate = a refusal in words, never a silent pass');
    const rule = src.slice(src.indexOf("case 'value':"), src.indexOf("case 'value':") + 420);
    assert.match(rule, /if\(h\.missing\) return true;/,
      'an approval rule is a safety net, so the unknown case ENGAGES it');
  });

  test('the server\'s own signing wall does the same, off the STORED record', () => {
    const srv = read('server/server.js');
    const guard = srv.slice(srv.indexOf('if (signCapOn() && req.user.role !==') ,
      srv.indexOf('if (signCapOn() && req.user.role !==') + 2600);
    assert.match(guard, /const meta = \(prev && prev\.metadata\) \|\| \(c && c\.metadata\) \|\| \{\};/,
      'the currency comes off the stored record, like the value beside it');
    assert.match(guard, /conv\.missing/, 'and an unconvertible contract is refused, not waved through');
  });

  test('ONE arithmetic, two hosts — the server injects readers, it does not re-implement', () => {
    const srv = read('server/server.js');
    assert.match(srv, /fxSetRatesReader\(/); assert.match(srv, /fxSetHomeReader\(/);
    assert.match(srv, /require\('\.\.\/js\/jurisdiction\.js'\)/);
    const own = srv.slice(srv.indexOf('fxSetRatesReader('), srv.length);
    assert.ok(!/function fxHome\b/.test(own), 'the server has no copy of the formula');
  });

  test('every reporting surface converts, and the new words are in both languages', () => {
    for (const f of ['js/views/home.js', 'js/views/reports.js', 'js/views/portfolio.js',
      'js/views/healthreport.js', 'js/views/weekly.js', 'js/views/register.js', 'js/views/intelligence.js'])
      assert.match(read(f), /fxHomeValue/, f + ' sums converted values');
    const i18n = read('js/i18n.js');
    for (const k of ['st_fx', 'st_fx_sub', 'st_fx_note', 'fx_left_out_one', 'fx_left_out_other',
      'sc_block_norate', 'sc_block_fx'])
      assert.equal((i18n.match(new RegExp('\\b' + k + ':', 'g')) || []).length, 2,
        k + ' must be defined exactly once per language');
  });

  test('no rate is ever fetched from outside — the admin owns the number', () => {
    const all = ['server/server.js', 'js/jurisdiction.js', 'js/views/settings.js'].map(read).join('\n');
    assert.ok(!/exchangerate|openexchange|fixer\.io|currencyapi|api\.frankfurter/i.test(all),
      'a headline that moves by itself is a number nobody can stand behind');
  });
});
