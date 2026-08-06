/* ============================================================
   f147 — the sample portfolio and the field catalogue follow the market

   Two halves of the same complaint. A Stockholm prospect opening HaTi for the
   first time was shown thirty Kenyan contracts priced in shillings — "Regional
   Distributor — Mt. Kenya", "Naivas Supermarkets", "Football Kenya Federation"
   — and every form hinted at a `co.ke` address and a KRA PIN. The market
   setting existed; the demo data and the field catalogue never asked it.

   What this file pins:

     · there is a sample portfolio per market, and the SHAPES match — same six
       value streams, same twelve contract types, same status mix — so every
       screen that groups, filters, charts or counts behaves identically
       whichever market seeded it
     · a Swedish portfolio carries no Kenyan company, place or currency
     · the field catalogue's placeholder hints follow the market
     · the two company-tax-number types reject each other's format, which is
       the whole reason sweden_tax_id is its own entry rather than a widened
       kenya_tax_id
   ============================================================ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { JSDOM } = require('jsdom');

const ROOT = path.join(__dirname, '..');
const KENYAN = /Kenya|Kenyan|Nairobi|Naivas|Kabras|Nandi|Wilmar|Nampak|Statpack|Kevian|Orbit|Kapa|Krones|CFAO|Siginon|Sendy|Lori|Wasoko|Ramogi|Muranga|Copia|Scanad|Ogilvy Kenya|Aleph|Givaudan East|Britam|Bowmans|Nyanza|Mt\. Kenya|Westlands|Coast|\bKES\b|Otieno|Wanjiku/;

function boot() {
  const dom = new JSDOM('<!doctype html><html><body></body></html>',
    { runScripts: 'outside-only', url: 'https://hati.test/' });
  const win = dom.window;
  win.window = win;
  const ctx = dom.getInternalVMContext();
  for (const rel of ['js/components.js', 'js/templates.js', 'js/jurisdiction.js', 'js/core.js']) {
    try { vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), ctx, { filename: rel }); }
    catch (e) { /* core.js reaches for screens as it loads; the seed is what matters */ }
  }
  return win;
}

const shapeOf = cs => ({
  n: cs.length,
  folders: [...new Set(cs.map(c => c.folder))].sort().join(','),
  kinds: [...new Set(cs.map(c => c.template))].sort().join(','),
  statuses: cs.reduce((a, c) => (a[c.status] = (a[c.status] || 0) + 1, a), {}),
});

describe('f147 — a sample portfolio per market, the same shape either way', () => {
  const win = boot();

  test('both markets seed thirty contracts', () => {
    win.jxSet('kenya');
    assert.equal(win.sampleContracts().length, 30);
    win.jxSet('sweden');
    assert.equal(win.sampleContracts().length, 30);
  });

  test('value streams, contract types and status mix are identical', () => {
    win.jxSet('kenya');
    const ke = shapeOf(win.sampleContracts());
    win.jxSet('sweden');
    const se = shapeOf(win.sampleContracts());
    assert.equal(se.folders, ke.folders, 'same six value streams');
    assert.equal(se.kinds, ke.kinds, 'same twelve contract types');
    assert.deepEqual(se.statuses, ke.statuses, 'same status mix');
  });

  test('the Swedish portfolio carries nothing Kenyan', () => {
    win.jxSet('sweden');
    for (const c of win.sampleContracts()) {
      const blob = [c.name, c.counterparty, c.signatory,
        ...(c.comments || []).map(x => `${x.author} ${x.text}`)].join(' ');
      const hit = blob.match(KENYAN);
      assert.equal(hit, null, `Kenyan demo content in a Swedish portfolio: ${hit && hit[0]} (${c.name})`);
    }
  });

  test('the Kenyan portfolio is untouched', () => {
    win.jxSet('kenya');
    const cs = win.sampleContracts();
    assert.equal(cs[0].counterparty, 'Kabras Sugar (West Kenya Ltd)');
    assert.equal(cs[0].value, 48000000);
    assert.equal(cs[0].signatory, 'A. Otieno, Director');
    assert.match(cs[0].comments[0].text, /stays Kenyan/);
  });

  test('the seeded comment names the market it is actually in', () => {
    win.jxSet('sweden');
    assert.match(win.sampleContracts()[0].comments[0].text, /stays Swedish/);
  });
});

describe('f147 — the field catalogue follows the market', () => {
  const jx = require('../js/jurisdiction.js');
  /* fieldlib.js reads jxEg through a bare global, the way it runs in the
     browser; the server requires it with no jurisdiction loaded at all, which
     is why every hint has a fallback. Both paths are exercised here. */
  global.jxEg = jx.jxEg; global.jxCurrency = jx.jxCurrency;
  /* A REAL little store, not a no-op. jxSet persists through lsSet and jxId
     reads back through lsGet; stubbing them to nothing makes jxSet silently
     fail and every "Sweden" assertion below quietly test Kenya instead. */
  const store = new Map();
  global.getOrg = undefined;
  global.lsGet = k => (store.has(k) ? store.get(k) : null);
  global.lsSet = (k, v) => { store.set(k, v); };
  const { FIELD_LIB, fieldLibValidate } = require('../js/fieldlib.js');

  test('Kenya keeps the hints it always had', () => {
    jx.jxSet('kenya');
    assert.equal(FIELD_LIB.email.hint, 'name@company.co.ke');
    assert.equal(FIELD_LIB.phone.hint, '+254 700 000000');
    assert.equal(FIELD_LIB.currency.label, 'Amount (KES)');
  });

  test('Sweden gets Swedish ones', () => {
    jx.jxSet('sweden');
    assert.equal(FIELD_LIB.email.hint, 'namn@foretag.se');
    assert.equal(FIELD_LIB.phone.hint, '+46 70 000 00 00');
    assert.equal(FIELD_LIB.currency.label, 'Amount (SEK)');
  });

  test('the two company-tax-number types reject each other', () => {
    const orgnr = { field_type: 'sweden_tax_id', required: true };
    const kra = { field_type: 'kenya_tax_id', required: true };
    assert.equal(fieldLibValidate(orgnr, '556016-0680'), null, 'a real organisationsnummer passes');
    assert.equal(fieldLibValidate(orgnr, '5560160680'), null, 'the hyphen is optional');
    assert.ok(fieldLibValidate(orgnr, 'A123456789B'), 'a KRA PIN is not an organisationsnummer');
    assert.ok(fieldLibValidate(kra, '556016-0680'), 'and the reverse');
    assert.equal(fieldLibValidate(kra, 'A123456789B'), null, 'the KRA PIN check is unchanged');
  });
});
