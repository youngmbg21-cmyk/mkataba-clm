/* ============================================================
   f146 — the market setting reaches the built-in templates

   js/jurisdiction.js made the market a VALUE rather than a sentence, but the
   twelve built-in templates never asked it. A workspace switched to Sweden got
   Swedish kronor on its register and, in the contract it created, "the laws of
   Kenya", "arbitration in Nairobi", KEBS standards, KRA licences and a lease
   under the Land Act (2012). Money said one thing and the paper said another.

   What this file pins:

     · every built-in template's governing-law sentence names the ACTIVE
       market, not Kenya
     · a Swedish workspace's contract wording contains no Kenyan noun at all —
       not the currency, not the standards body, not the tax authority, not a
       town used as a placeholder example
     · a KENYAN workspace is unchanged, which is the other half of the promise:
       making the market configurable must not quietly move an existing
       customer's paper
     · where a market has no equivalent, the clause DROPS that half rather than
       naming a stand-in — Sweden has no lease stamp duty and no single food
       regulator, so the lease and co-packing clauses stay quiet instead of
       inventing one (the rule js/jurisdiction.js states in its header)

   The real docBody is reached with a local harness rather than test/world.js,
   because that world deliberately replaces docBody with a stub.
   ============================================================ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { JSDOM } = require('jsdom');

const ROOT = path.join(__dirname, '..');
const KINDS = ['RM','PK','CM','EQ','WH','FF','DA','RL','MK','ND','LE','PS'];

/* Every Kenyan proper noun that used to be written into template wording. A
   Swedish workspace must produce none of them. Kept as one list so a new Kenyan
   noun added to a clause fails here rather than reaching a Swedish customer. */
const KENYAN_NOUNS = /Kenya|Kenyan|Nairobi|KEBS|\bKRA\b|ICPAK|\bLSK\b|\bKES\b|Land Act|Mombasa|Nyanza|Westlands|Industrial Area/;

function harness(market) {
  const dom = new JSDOM('<!doctype html><html><body><div id="content"></div></body></html>',
    { runScripts: 'outside-only', url: 'https://hati.test/' });
  const win = dom.window;
  win.window = win;
  /* The shell docBody borrows from the rest of the app. Stubbed to the minimum
     that lets the template builder run; the wording under test is the real one. */
  Object.assign(win, {
    FIRST_PARTY: 'Test Company Ltd',
    PORTAL_MODE: false,
    canEdit: () => true,
    isUpload: () => false,
    openFindings: () => [],
    SEV_RANK: { high: 3, med: 2, low: 1 },
    lsGet: k => { try { return JSON.parse(win.localStorage.getItem(k)); } catch (e) { return null; } },
    lsSet: (k, v) => { try { win.localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
    esc: s => String(s == null ? '' : s).replace(/[&<>]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[ch])),
    TEMPLATES: KINDS.reduce((a, k) => (a[k] = { kind: k + ' agreement' }, a), {}),
    state: { settings: {} },
    icon: () => '',
    fmtDocDate: s => s || '',
    fmtDocAmount: n => String(n),
    fieldDisplayValue: v => v,
    isMonetary: () => true,
  });
  const ctx = dom.getInternalVMContext();
  for (const rel of ['js/jurisdiction.js', 'js/views/contract.js']) {
    try { vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), ctx, { filename: rel }); }
    catch (e) { /* contract.js touches app globals as it loads; docBody is what matters */ }
  }
  assert.equal(win.jxSet(market), true, `the ${market} pack exists and can be selected`);
  return win;
}

const wording = (win, kind) => {
  const html = win.docBody({ id: 'C-1', template: kind, status: 'Draft',
    fields: {}, counterparty: 'Acme AB', value: 1000000 });
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
};

describe('f146 — a Swedish workspace gets Swedish paper', () => {
  const win = harness('sweden');

  test('the market really switched', () => {
    assert.equal(win.jxCurrency(), 'SEK');
    assert.equal(win.jxLocale(), 'sv-SE');
  });

  for (const kind of KINDS) {
    test(`${kind} names Sweden and no Kenyan noun survives`, () => {
      const text = wording(win, kind);
      assert.ok(text.length > 200, 'the template rendered something to read');
      assert.match(text, /Sweden|Swedish/, 'the wording names the active market');
      const leak = text.match(KENYAN_NOUNS);
      assert.equal(leak, null,
        `Kenyan wording reached a Swedish contract: ${leak && leak[0]}`);
    });
  }

  test('the lease drops the statute and the court Sweden has no equivalent for', () => {
    const text = wording(win, 'LE');
    assert.match(text, /This Lease is governed by the laws of Sweden/);
    assert.ok(!/including/.test(text.split('This Lease is governed')[1] || ''),
      'no statute is named where the pack has none');
  });

  test('co-packing asks for licences without inventing a regulator', () => {
    const text = wording(win, 'CM');
    assert.match(text, /food-safety and business licences/,
      'the generic form is used where the market has no single named regulator');
  });
});

describe('f146 — a Kenyan workspace is left exactly as it was', () => {
  const win = harness('kenya');

  test('the market is Kenya', () => {
    assert.equal(win.jxCurrency(), 'KES');
  });

  test('the lease still sits under the Land Act and the Environment and Land Court', () => {
    const text = wording(win, 'LE');
    assert.match(text, /governed by the laws of Kenya, including the Land Act \(2012\)/);
    assert.match(text, /Environment and Land Court at Nairobi/);
  });

  test('the standards body, tax authority and professional bodies are still named', () => {
    assert.match(wording(win, 'RM'), /KEBS standard/);
    assert.match(wording(win, 'CM'), /Public Health and KRA licences/);
    assert.match(wording(win, 'PS'), /ICPAK \/ LSK requirements/);
    assert.match(wording(win, 'RL'), /KEBS labelling and Legal Metrology/);
  });

  test('every template still says Kenya somewhere in its governing law', () => {
    for (const kind of KINDS) {
      assert.match(wording(win, kind), /Kenya|Kenyan/, `${kind} still names Kenya`);
    }
  });

  test('contract value is still in shillings', () => {
    assert.match(wording(win, 'RM'), /KES/);
  });
});
