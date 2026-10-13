/* ============================================================
   f670 — ONLY THE QUOTED SENTENCE MOVES (owner, 13 Oct 2026)
   ============================================================
   Jambo's ask for clause 21.1 kept the sentence it quoted and added one about
   how long the duty survives. The filed change (CHG-004) struck ALL of 21.1 —
   its number, its bold title, the sentence before the quote and the sentence
   after it — and put only Jambo's paragraph back: "+69 −110". The same day
   "33.1 Danish law applies." was struck number and all.

   The block is the paragraph; the finding's quote is the address INSIDE it.
   pbFitInto now puts the wording where the quote stood (pbSpliceQuote) and
   leaves the rest of the paragraph, and its markup, byte for byte. Where the
   wording re-says the whole paragraph it still replaces it — but keeps the
   paragraph's own number.
   ============================================================ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { buildWorld } = require('./world');

const W = () => buildWorld({ playbook: true }).win;

describe('f670 only the quoted sentence moves', () => {
  test('the ask adds its sentence where the quote stood; the number, the bold title and the other sentences stay', () => {
    const body = '<p><b>21.1 General obligations.</b> All Confidential Information shall remain the property of the Disclosing Party. '
      + 'Such Confidential Information shall not be given to any third party. Receiving Party shall limit internal distribution.</p>'
      + '<p>21.2 Exceptions apply.</p>';
    const quote = 'Such Confidential Information shall not be given to any third party.';
    const ask = quote + ' This obligation shall survive for three (3) years.';
    const into = W().pbFitInto(body, quote, ask);
    assert.ok(into, 'an address was read');
    assert.match(into.html, /^<p><b>21\.1 General obligations\.<\/b> All Confidential Information shall remain the property/, 'the number, the title and its bold stay');
    assert.match(into.html, /third party\. This obligation shall survive for three \(3\) years\. Receiving Party shall limit internal distribution\.<\/p>/,
      'the new sentence stands where the quote ended, the sentence after it stays');
    assert.match(into.html, /<p>21\.2 Exceptions apply\.<\/p>$/, 'the next paragraph is untouched');
  });
  test('a figure swapped inside one sentence keeps the paragraph\'s number', () => {
    const into = W().pbFitInto('<p>33.1 Danish law applies.</p><p>33.2 Courts of Copenhagen.</p>', 'Danish law applies.', 'Swedish law applies.');
    assert.ok(into);
    assert.equal(into.html, '<p>33.1 Swedish law applies.</p><p>33.2 Courts of Copenhagen.</p>');
  });
  test('a rewrite of the whole paragraph still replaces it — and keeps its number', () => {
    const into = W().pbFitInto('<p>20.3 Each Party total aggregate liability shall not exceed 125% of the invoices, or SEK 40,000,000, whichever is the lower.</p><p>20.4 Other.</p>',
      'or SEK 40,000,000, whichever is the lower', 'Each Party total aggregate liability shall not exceed 125% of the invoices.');
    assert.ok(into);
    assert.equal(into.html, '<p>20.3 Each Party total aggregate liability shall not exceed 125% of the invoices.</p><p>20.4 Other.</p>');
  });
  test('a quote said twice in its paragraph has no single address: the paragraph is swapped as before', () => {
    const w = W();
    assert.equal(w.pbSpliceQuote('<p>1.1 It shall pay. It shall pay. And more words here.</p>', 0, 'It shall pay.', 'It shall pay now.'), null);
  });
});
