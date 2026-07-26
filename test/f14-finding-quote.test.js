/* ============================================================
   F14 — a finding's quote survives the scan that stored it
   ============================================================
   Findings gained a `quote` field so the panel could jump to the wording they
   concern. Scans already stored on a contract do not have it, and the jump was
   then hidden from exactly those findings — so a contract scanned last week
   lost the button entirely, with no hint that re-scanning would bring it back.

   The quote has always been printed in the finding's own text. It is read back
   from there when the field is absent, which needs no migration and no re-scan.
*/
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { loadViews, STUB_TEMPLATES, STUB_FOLDERS } = require('./dom');

const ai = () => loadViews(['js/ai.js'], { TEMPLATES: STUB_TEMPLATES, FOLDERS: STUB_FOLDERS });

describe('F14 — locating the wording a finding is about', () => {
  test('the field is used when the scan recorded one', () => {
    assert.equal(ai().findingQuote({ quote: 'THE CLAUSE', what: 'something else' }), 'THE CLAUSE');
  });

  test('a scan stored before the field existed still yields its quote', () => {
    const f = { what: 'The document reads: “2 Limitation of Liability.”' };
    assert.equal(ai().findingQuote(f), '2 Limitation of Liability.',
      'the button must not vanish from contracts scanned by an earlier build');
  });

  test('straight quotes read the same as typographic ones', () => {
    assert.equal(ai().findingQuote({ what: 'The document reads: "Governing law is Kenya."' }),
      'Governing law is Kenya.');
  });

  test('a quote running over several sentences is kept whole', () => {
    const long = 'It shall automatically renew for successive one (1) year terms unless either '
      + 'Party provides written notice of non-renewal at least sixty (60) days prior to the end of the current term.';
    assert.equal(ai().findingQuote({ what: `The document reads: “${long}”` }), long);
  });

  test('a finding that quotes nothing yields nothing, so no jump is offered', () => {
    const f = { what: 'This AI review flags common issues but is not legal advice and cannot catch everything.' };
    assert.equal(ai().findingQuote(f), '',
      'general advice has no location in the document — a jump would only go to the top');
    assert.equal(ai().findingQuote({ what: '(clause not located in the extracted text)' }), '');
  });

  test('nothing at all is handled without throwing', () => {
    const a = ai();
    assert.equal(a.findingQuote(null), '');
    assert.equal(a.findingQuote({}), '');
  });
});
