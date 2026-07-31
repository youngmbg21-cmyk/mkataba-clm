/* F95 — a highlighted passage is found despite typography.

   What the browser hands back from a selection is not byte-for-byte what the
   clause model stores: rendering puts line breaks between sub-clauses, the
   typography turns straight quotes smart, and pasted wording carries
   non-breaking and zero-width characters. An exact indexOf over that refused
   passages any reader could see were there — "couldn't be matched to the
   clause's current wording" over a line break the renderer itself added.

   negoFindPassage is the fix, and its contract is the thing worth pinning:
   the MATCH is tolerant, the ANSWER is exact. Whatever normalisation the
   match needed, the offsets it returns index the clause's STORED text, so a
   splice at them touches exactly the wording that was chosen. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { buildWorld } = require('./world');

const win = buildWorld({ negotiationView: true }).win;
const find = win.negoFindPassage;
const norm = win.negoNormalizeText;

describe('F95 — the match is tolerant, the answer exact', () => {
  test('an exact passage answers with its own offsets', () => {
    const hay = 'Payment is due within thirty (30) days.';
    const hit = find(hay, 'thirty (30) days');
    /* compared field-by-field: the hit is built in the page's own realm, so
       deepEqual would fail it on prototype identity, not on substance */
    assert.equal(hit && hit.start, 22);
    assert.equal(hit && hit.end, 22 + 'thirty (30) days'.length);
  });

  test('a line break the renderer added does not lose the passage', () => {
    const hay = 'invoices are payable\nwithin thirty (30) days from issue.';
    const hit = find(hay, 'payable within thirty (30) days');
    assert.ok(hit, 'THE FIX: this used to be a refusal');
    assert.equal(hay.slice(hit.start, hit.end), 'payable\nwithin thirty (30) days',
      'the offsets index the stored text, line break and all');
  });

  test('smart quotes in the document match straight quotes in the selection', () => {
    const hay = 'referred to as the “Supplier” hereafter.';
    const hit = find(hay, 'the "Supplier"');
    assert.ok(hit);
    assert.equal(hay.slice(hit.start, hit.end), 'the “Supplier”');
  });

  test('non-breaking and zero-width characters are not part of the wording', () => {
    const hay = 'pay within\u00A0thirty (30)\u200B days.';
    const hit = find(hay, 'within thirty (30) days');
    assert.ok(hit);
    assert.equal(hay.slice(hit.start, hit.end), 'within\u00A0thirty (30)\u200B days');
  });

  test('splicing at the offsets replaces exactly the chosen words', () => {
    const hay = 'a.\nAll invoices are payable  within thirty (30) days.\nb.';
    const hit = find(hay, 'payable within thirty (30) days');
    assert.ok(hit);
    const out = hay.slice(0, hit.start) + 'payable within sixty (60) days' + hay.slice(hit.end);
    assert.equal(out, 'a.\nAll invoices are payable within sixty (60) days.\nb.',
      'nothing either side of the selection moved');
  });

  test('wording that is genuinely absent still answers null', () => {
    assert.equal(find('Payment is due.', 'termination for convenience'), null);
    assert.equal(find('Payment is due.', '   '), null, 'blank asks nothing');
  });

  test('normalisation collapses exactly what typography varies', () => {
    assert.equal(norm('  “Smart”\u00A0 and\n\n‘curly’\u200B quotes '),
      '"Smart" and \'curly\' quotes');
  });
});
