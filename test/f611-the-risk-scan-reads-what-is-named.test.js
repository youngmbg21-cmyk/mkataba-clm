/* ============================================================
   f611 — the local risk scan reads what the contract names (9 Oct 2026 review)
   ============================================================
   findingsFromText (js/views/contract.js) is the scan that runs without
   Copilot. Two misreadings, both measured on real wording:
     · "governed by the laws of the State of California" was reported as
       "Governing law / jurisdiction not clearly stated", because only the
       jurisdiction packs' marker lists were asked;
     · the payment term was the FIRST "within N days" anywhere in the text — a
       notice or cure period answered for it.
   ============================================================ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { loadViews, STUB_TEMPLATES, STUB_FOLDERS } = require('./dom');

const scan = (text, jurisdiction = 'kenya') => {
  const w = loadViews(['js/views/contract.js'], {
    TEMPLATES: STUB_TEMPLATES, FOLDERS: STUB_FOLDERS,
    getOrg: () => ({ name: 'Test', jurisdiction }),
  });
  return w.findingsFromText({ id: 'MK-1', folder: 'proc', template: 'RM' }, text);
};
const byId = (f, id) => f.find(x => x.id === id);

describe('f611 (1) — a governing law no pack knows is still named', () => {
  test('California', () => {
    const law = byId(scan('1. DEFINITIONS. Terms have their ordinary meaning. '
      + '14. GOVERNING LAW. This Agreement shall be governed by and construed in accordance with '
      + 'the laws of the State of California, without regard to its conflict of laws principles.'), 't-law');
    assert.match(law.title, /Governing law: California — not your home market/);
    assert.notEqual(law.kind, 'missing');
    assert.match(law.quote, /State of California/);
  });
  test('a forum named by its courts', () => {
    const law = byId(scan('Any dispute shall be submitted to the exclusive jurisdiction of the courts of Ontario.'), 't-law');
    assert.match(law.title, /Ontario — not your home market/);
  });
  test('a reference that names nothing is still "not clearly stated"', () => {
    const law = byId(scan('The governing law is as stated in the Order Form. The parties agree.'), 't-law');
    assert.equal(law.kind, 'missing');
  });
  test('home and known-foreign readings are unchanged', () => {
    assert.match(byId(scan('This Agreement is governed by the laws of Kenya.'), 't-law').title, /Governing law: Kenya/);
    assert.match(byId(scan('This Agreement is governed by the laws of Sweden.'), 't-law').title, /Foreign governing law/);
  });
});

describe('f611 (2) — the payment term is read from payment wording', () => {
  test('a notice period earlier in the text does not answer for it', () => {
    const f = scan('A party in breach shall remedy the breach within 10 days of notice. '
      + 'The Customer shall pay each invoice within thirty (30) days of receipt.');
    const pay = byId(f, 't-pay');
    assert.ok(pay, 'the payment term is found');
    assert.equal(pay.title, 'Payment terms: 30 days');
    assert.match(pay.quote, /invoice/);
  });
  test('"Net 60" counts on its own', () => {
    assert.equal(byId(scan('Fees are due Net 60 days from delivery.'), 't-pay').title, 'Payment terms: 60 days');
  });
  test('no payment wording, no payment finding — never a guess', () => {
    assert.equal(byId(scan('Either party may terminate within 10 days of notice.'), 't-pay'), undefined);
  });
});
