/* f405 — A CONFIRMED REVIEW MERGES; IT NEVER REPLACES (the owner's list,
   27 Sep 2026)

   "Confirming a key-terms review replaces every recorded term. Anything typed
   on the Overview that the review did not include is lost without warning."

   Both confirm paths — applyMetadata (js/views/contract.js: an upload's
   confirm and the settings backfill) and applyReviewedMeta
   (js/views/migration.js: the import queue) — assigned the dialog's answer
   over the whole record. metaMergeReviewed (js/metadata.js) is the one
   reading of how a review lands. And the dialog stops choosing an answer
   nobody gave: a list term nothing was read for used to draw as its FIRST
   option ("customer", "capped", "consent") and Confirm filed that.

   The browser half — the backfill's own path, a real press, read back off
   the server after a reload — is review-keeps-typed-terms-verify.

   Red at the parent (3ee647b): all six — the merge is new. (6) is the
   CONTROL of its behaviour: with nothing on file a review lands whole, as it
   always did. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const META = read('js/metadata.js');

/* A function's body by NAME (the f255 lesson): the brace walk, not a regex
   that could stop at an inner closing brace. */
const fnBody = (src, name) => {
  const m = new RegExp('function\\s+' + name + '\\s*\\([^)]*\\)\\s*\\{').exec(src);
  if (!m) return null;
  let i = m.index + m[0].length, depth = 1;
  while (i < src.length && depth > 0) { const ch = src[i]; if (ch === '{') depth++; else if (ch === '}') depth--; i++; }
  return src.slice(m.index, i);
};
const merge = (() => {
  const noAns = /const META_NO_ANSWER = [^\n]*\n/.exec(META);
  const blank = fnBody(META, 'metaIsBlankAnswer'), mm = fnBody(META, 'metaMergeReviewed');
  if (!noAns || !blank || !mm) return null;
  return new Function(noAns[0] + blank + '\n' + mm + '\nreturn metaMergeReviewed;')();
})();

const TYPED = () => ({
  assignment: 'prohibited', confidentiality: 'Five years after termination', party: 'Highland Logistics (K) Ltd',
  templateFields: { material: 'Corrugated board' }, noticePeriodDays: 90, sourceSpans: { value: 'KES 1,200,000' },
  confidence: { assignment: 'high', confidentiality: 'high', party: 'high', noticePeriodDays: 'high' },
});
/* What the dialog hands back when a FRESH reading found none of the typed
   terms: every box it draws, the un-found ones empty. */
const REVIEW = () => ({
  counterparty: 'Nordkust Industri AB', assignment: '', confidentiality: '', noticePeriodDays: 0,
  liabilityCapped: 'unclear', category: 'supplier', sourceSpans: { counterparty: 'Nordkust Industri AB' },
  confirmedAt: '2026-09-27T10:00:00Z',
  confidence: { counterparty: 'medium', assignment: 'high', confidentiality: 'high', noticePeriodDays: 'high', liabilityCapped: 'low', category: 'high' },
});

test('f405 (1) a key the review did not carry survives, untouched', () => {
  assert.ok(merge, 'metaMergeReviewed exists');
  const out = merge(TYPED(), REVIEW());
  assert.equal(out.party, 'Highland Logistics (K) Ltd');
  assert.deepEqual(out.templateFields, { material: 'Corrugated board' });
  assert.equal(out.confidence.party, 'high');
});

test('f405 (2) an EMPTY box never erases an answer on file — text, number, list, and "cannot tell"', () => {
  assert.ok(merge, 'metaMergeReviewed exists');
  const out = merge(TYPED(), REVIEW());
  assert.equal(out.assignment, 'prohibited');
  assert.equal(out.confidentiality, 'Five years after termination');
  assert.equal(out.noticePeriodDays, 90, 'an empty number box yields 0, which is not an answer');
  const withUnclear = merge({ liabilityCapped: 'capped', confidence: { liabilityCapped: 'high' } }, { liabilityCapped: 'unclear', confidence: { liabilityCapped: 'low' } });
  assert.equal(withUnclear.liabilityCapped, 'capped', 'a person’s answer outranks the reading’s "unclear"');
  assert.equal(withUnclear.confidence.liabilityCapped, 'high');
});

test('f405 (3) what a person confirmed wins, with its confidence; the evidence merges by key', () => {
  assert.ok(merge, 'metaMergeReviewed exists');
  const out = merge(TYPED(), REVIEW());
  assert.equal(out.counterparty, 'Nordkust Industri AB');
  assert.equal(out.confidence.counterparty, 'medium');
  assert.equal(out.category, 'supplier');
  assert.equal(out.liabilityCapped, 'unclear', 'nothing on file, so the honest reading is written');
  assert.deepEqual(out.sourceSpans, { value: 'KES 1,200,000', counterparty: 'Nordkust Industri AB' });
  assert.equal(out.confirmedAt, '2026-09-27T10:00:00Z');
});

test('f405 (4) both confirm paths ask the merge, and neither assigns the review over the record', () => {
  const CT = fnBody(read('js/views/contract.js'), 'applyMetadata');
  const MG = fnBody(read('js/views/migration.js'), 'applyReviewedMeta');
  for (const [name, body] of [['applyMetadata', CT], ['applyReviewedMeta', MG]]) {
    assert.ok(body, name);
    assert.match(body, /metaMergeReviewed\(c\.metadata, m\)/, name + ' merges');
    assert.ok(!/c\.metadata\s*=\s*m\s*;/.test(body), name + ' no longer replaces the record with the review');
  }
  assert.match(META, /Object\.assign\(window,\{[^}]*\bmetaMergeReviewed\b/, 'published, because two other modules ask it');
});

test('f405 (5) the dialog draws an empty choice for a list term nothing was read for', () => {
  const body = fnBody(META, 'openMetaReview');
  assert.ok(body, 'openMetaReview');
  assert.match(body, /v===''\?'<option value="" selected>—<\/option>':''/,
    'nothing read is not the list’s first answer');
});

test('f405 (6) CONTROL: with nothing on file, the review lands whole, as before', () => {
  assert.ok(merge, 'metaMergeReviewed exists');
  const out = merge(undefined, REVIEW());
  assert.equal(out.counterparty, 'Nordkust Industri AB');
  assert.equal(out.assignment, '');
  assert.equal(out.category, 'supplier');
});
