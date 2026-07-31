/* ============================================================
   F32 — a drafted contract reads like a contract
   ============================================================
   The worst friction the fourth UX review found in the Word scenario. A
   contract drafted in the wizard keeps its answers in form fields, and the
   browser tidies those up on screen: a date box shows 01/08/2026 whatever is
   stored behind it. The moment the document left that screen — into Word, into
   the counterparty's page, into the PDF, into the sealed record — the tidying
   stopped and the stored value showed through raw. Every copy therefore read:

       "This Raw Material Supply Agreement is made on 2026-08-01 …"
       "The estimated annual contract value is KES 4800000 …"

   That is the first thing a counterparty reads, the text he marks up, and the
   text the signature is taken over.

   These tests run on a contract built the way js/wizard.js actually builds one
   — no saved document, no formatting marker, just a template and the answers —
   because the review before this one used a convenient stand-in instead and
   missed a real fault as a result. */
const { test, describe, before } = require('node:test');
const assert = require('node:assert/strict');
const { buildPortal } = require('./portalworld');

/* Exactly the shape createFromWizard() produces: fields, and no body at all. */
function wizardContract(over = {}){
  return {
    id: 'MK-101', name: 'Raw Material Supply Agreement — Nordkust Industri AB',
    counterparty: 'Nordkust Industri AB', folder: 'proc', template: 'RM',
    status: 'Draft', value: 4800000, valueType: 'standard', lastAction: '26 Jul 2026',
    fields: { effDate: '2026-08-01', material: 'refined sugar', volume: 5000, inspectDays: 3 },
    metadata: {}, comments: [], audit: [], signatures: [], rounds: [], versions: [],
    compliance: { consent: false }, ...over,
  };
}

describe('F32 — the values a reader sees', () => {
  let p, W, c, text;
  before(() => {
    p = buildPortal();
    W = p.win;
    c = wizardContract();
    text = W.docPlainText(c);
  });

  test('the date reads as a date, not as a database key', () => {
    assert.match(text, /is made on 1 August 2026 between/,
      'got: ' + (text.split('\n').find(l => /is made on/.test(l)) || '(no recital)'));
    assert.ok(!/2026-08-01/.test(text), 'the stored form of the date must not reach the reader');
  });

  test('money reads as money', () => {
    assert.match(text, /contract value is KES 4,800,000/,
      'got: ' + (text.split('\n').find(l => /contract value/.test(l)) || '(no value clause)'));
    assert.ok(!/KES 4800000/.test(text));
  });

  test('a count is left exactly as typed — only amounts are grouped', () => {
    // "5000 metric tonnes" is a quantity, not shillings. Guessing at a number's
    // meaning is how a year becomes "2,026".
    assert.match(text, /an estimated 5000 metric tonnes/);
    assert.match(text, /rejected within 3 days/);
  });

  test('the counterparty reads the same values, not a second version of them', () => {
    // readOnlyDocHtml is what the portal shows; it must agree with the seal
    const shown = W.readOnlyDocHtml(W.docBody(c));
    assert.match(shown, /1 August 2026/);
    assert.match(shown, /4,800,000/);
    assert.ok(!/2026-08-01/.test(shown));
  });

  test('and so does the sealed record', () => {
    const frozen = W.freezeContractHtml(c);
    assert.match(frozen, /1 August 2026/);
    assert.match(frozen, /4,800,000/);
    assert.ok(!/2026-08-01/.test(frozen), 'the signature must be taken over the readable text');
  });

  test('an unfilled blank is still visibly a gap', () => {
    const shown = W.readOnlyDocHtml(W.docBody(wizardContract({ fields: {}, value: 0 })));
    assert.match(shown, /—/, 'a blank nobody filled must remain visible as a blank');
  });
});

describe('F32 — the two conversions, on their own', () => {
  let W;
  before(() => { W = buildPortal().win; });

  test('a date is spelled out', () => {
    assert.equal(W.fmtDocDate('2026-08-01'), '1 August 2026');
    assert.equal(W.fmtDocDate('2026-12-31'), '31 December 2026');
    assert.equal(W.fmtDocDate('2027-01-09'), '9 January 2027');
  });

  test('a date-only value never slips to the day before', () => {
    // read through new Date() a date-only string is treated as UTC, so anyone
    // west of Greenwich would see 31 July on a contract dated 1 August
    assert.equal(W.fmtDocDate('2026-08-01'), '1 August 2026');
    assert.ok(!/31 July/.test(String(W.fmtDocDate('2026-08-01'))));
  });

  test('anything that is not a date is left alone', () => {
    assert.equal(W.fmtDocDate('not a date'), null);
    assert.equal(W.fmtDocDate('2026-13-01'), null, 'there is no thirteenth month');
    assert.equal(W.fmtDocDate(''), null);
  });

  test('amounts are grouped; non-numbers are not touched', () => {
    assert.equal(W.fmtDocAmount('4800000'), '4,800,000');
    assert.equal(W.fmtDocAmount('500'), '500');
    assert.equal(W.fmtDocAmount('sixty'), null);
  });

  test('only a blank marked as money is grouped', () => {
    const doc = buildPortal().win.document;
    const mk = attrs => { const i = doc.createElement('input');
      for (const [k, v] of Object.entries(attrs)) i.setAttribute(k, v);
      i.value = attrs.value; return i; };
    assert.equal(W.fieldDisplayValue(mk({ type: 'number', value: '4800000', 'data-money': '1' })), '4,800,000');
    assert.equal(W.fieldDisplayValue(mk({ type: 'number', value: '5000' })), '5000',
      'tonnes, days and years must survive untouched');
    assert.equal(W.fieldDisplayValue(mk({ type: 'date', value: '2026-08-01' })), '1 August 2026');
    assert.equal(W.fieldDisplayValue(mk({ type: 'text', value: 'refined sugar' })), 'refined sugar');
  });
});
