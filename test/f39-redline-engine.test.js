/* f39 — the redline engine (js/redline.js)
   ============================================================
   The behavioural contract for the diff that a negotiation runs on. Every
   assertion here is about output a human reads or a hash is taken over, so
   "correct" is not enough on its own: an alignment that is right and
   unreadable fails, and so does one that is readable and cannot reproduce the
   texts it came from.

   js/versioning.js's own wordDiff() and the version-compare modal are NOT
   touched by any of this — they are a separate engine with a separate history,
   and f21/f22 still assert on them. */
const test = require('node:test');
const assert = require('node:assert');
const { buildWorld } = require('./world.js');

const W = buildWorld();
const win = W.win;
const { redlineOps, redlineOldText, redlineNewText, redlineIsNoop, redlineTokens } = win;

/* The invariant every case is checked against: the ops reproduce BOTH texts
   exactly, byte for byte. Nothing is trimmed or normalised on the way through,
   so a stored redline can always be read back as either side of the change. */
function roundTrips(oldText, newText){
  const ops = redlineOps(oldText, newText);
  assert.strictEqual(redlineOldText(ops), oldText, 'ops must reproduce the old text exactly');
  assert.strictEqual(redlineNewText(ops), newText, 'ops must reproduce the new text exactly');
  return ops;
}
const runs = (ops, op) => ops.filter(o => o.op === op);
const text = (ops, op) => runs(ops, op).map(o => o.text).join('|');

test('f39 — the redline engine', async t => {

  await t.test('a no-op yields no change runs at all', () => {
    const s = 'All invoices are payable within thirty (30) days from the date of issue.';
    const ops = roundTrips(s, s);
    assert.ok(redlineIsNoop(ops), 'identical texts must produce no del and no ins');
    assert.strictEqual(runs(ops, 'del').length, 0);
    assert.strictEqual(runs(ops, 'ins').length, 0);
  });

  await t.test('empty on both sides is a no-op, not a crash', () => {
    assert.strictEqual(redlineOps('', '').length, 0);
    assert.ok(redlineIsNoop(redlineOps('', '')));
    roundTrips('', 'A wholly new clause.');
    roundTrips('A clause that goes.', '');
  });

  /* The prototype's own edit: Net-30 → Net-45 in clause 4. Two words move in a
     three-sentence clause and everything else must stay untouched context. */
  await t.test('a local edit touches only the words that moved', () => {
    const oldT = 'All invoices are payable within thirty (30) days from the date of issue (Net-30). '
      + 'Late payments will incur a service charge of 1.5% per month on the outstanding balance.';
    const newT = 'All invoices are payable within forty-five (45) days from the date of issue (Net-45). '
      + 'Late payments will incur a service charge of 1.5% per month on the outstanding balance.';
    const ops = roundTrips(oldT, newT);
    assert.ok(text(ops, 'del').includes('thirty (30)'), 'the old period is deleted as one run');
    assert.ok(text(ops, 'ins').includes('forty-five (45)'), 'the new period arrives as one run');
    assert.ok(!text(ops, 'del').includes('Late payments'),
      'the untouched second sentence must never appear in a deletion');
    assert.ok(ops.some(o => o.op === 'keep' && o.text.includes('Late payments')),
      'the untouched second sentence stays as context');
  });

  /* The whitespace-bridge rule inherited from _diffSegments: "thirty (30)"
     must not split into two decisions a reviewer could half-take. */
  await t.test('adjacent changed words separated only by a space are ONE run', () => {
    const ops = roundTrips('within thirty (30) days', 'within forty-five (45) days');
    assert.strictEqual(runs(ops, 'del').length, 1, 'one deletion run, not two');
    assert.strictEqual(runs(ops, 'ins').length, 1, 'one insertion run, not two');
    assert.strictEqual(runs(ops, 'del')[0].text, 'thirty (30)');
    assert.strictEqual(runs(ops, 'ins')[0].text, 'forty-five (45)');
  });

  await t.test('multiple separated edit regions in one clause are all found', () => {
    const oldT = 'The Provider shall deliver within thirty days, store for one hundred days, '
      + 'and insure to the full replacement value under the schedule in Annex A.';
    const newT = 'The Provider shall deliver within fourteen days, store for ninety days, '
      + 'and insure to the full replacement value under the schedule in Annex B.';
    const ops = roundTrips(oldT, newT);
    assert.strictEqual(runs(ops, 'del').length, 3, 'three separated regions, three deletions');
    assert.strictEqual(runs(ops, 'ins').length, 3, 'three separated regions, three insertions');
    assert.ok(ops.some(o => o.op === 'keep' && o.text.includes('full replacement value')),
      'the untouched middle stays context and is not swept into a region');
  });

  /* U-006, which this engine inherits as a rule rather than as a patch. */
  await t.test('a full rewrite degrades to ONE deletion and ONE insertion', () => {
    const oldT = "The Provider's aggregate liability for loss of or damage to stored goods "
      + 'shall not exceed the full replacement value of the affected goods.';
    const newT = "The Provider's aggregate liability for loss of or damage to stored goods "
      + 'shall not exceed EUR 250,000 in the aggregate per contract year.';
    const ops = roundTrips(oldT, newT);
    const d = runs(ops, 'del'), i = runs(ops, 'ins');
    assert.strictEqual(d.length, 1, 'a rewritten passage is one strikeout, not shreds');
    assert.strictEqual(i.length, 1, 'a rewritten passage is one insertion, not shreds');
    assert.ok(!d[0].text.includes("Provider's"),
      'the unchanged opening is context, not part of the rewrite');
    assert.ok(d[0].text.includes('full replacement value'));
    assert.ok(i[0].text.includes('EUR 250,000'));
  });

  await t.test('a wholesale replacement of the entire clause is one run each way', () => {
    const oldT = 'Alpha beta gamma delta epsilon zeta eta theta iota kappa lambda mu nu xi.';
    const newT = 'Omicron pi rho sigma tau upsilon phi chi psi omega alpha beta gamma delta.';
    const ops = roundTrips(oldT, newT);
    assert.strictEqual(runs(ops, 'del').length, 1);
    assert.strictEqual(runs(ops, 'ins').length, 1);
  });

  await t.test('punctuation-only and case-only edits are detected', () => {
    const p = roundTrips('payable within thirty (30) days.', 'payable within thirty (30) days;');
    assert.ok(!redlineIsNoop(p), 'a full stop becoming a semicolon is a change');
    assert.strictEqual(runs(p, 'del')[0].text, 'days.');
    assert.strictEqual(runs(p, 'ins')[0].text, 'days;');

    const c = roundTrips('The Provider shall pay.', 'The provider shall pay.');
    assert.ok(!redlineIsNoop(c), 'a capital becoming lowercase is a change');
    assert.strictEqual(runs(c, 'del')[0].text, 'Provider');
    assert.strictEqual(runs(c, 'ins')[0].text, 'provider');
  });

  await t.test('leading and trailing whitespace edits survive the round trip', () => {
    for (const [a, b] of [
      ['  Clause text.', 'Clause text.'],
      ['Clause text.', 'Clause text.  '],
      ['Clause  text.', 'Clause text.'],
      ['Clause text.\n', 'Clause text.\n\n'],
    ]) {
      const ops = roundTrips(a, b);
      assert.ok(!redlineIsNoop(ops), `whitespace edit ${JSON.stringify(a)} → ${JSON.stringify(b)} must be seen`);
    }
  });

  await t.test('unicode survives — Swahili and Swedish', () => {
    const sw = roundTrips(
      'Mtoa huduma atapokea, kuhifadhi na kusafirisha bidhaa za mteja ndani ya siku thelathini.',
      'Mtoa huduma atapokea, kuhifadhi na kusafirisha bidhaa za mteja ndani ya siku arobaini na tano.');
    assert.ok(sw.some(o => o.op === 'ins' && o.text.includes('arobaini')));
    const sv = roundTrips(
      'Leverantören ska förvara godset i högst etthundratjugo dagar på anläggningen i Malmö.',
      'Leverantören ska förvara godset i högst nittio dagar på anläggningen i Malmö.');
    assert.ok(sv.some(o => o.op === 'del' && o.text.includes('etthundratjugo')));
    assert.ok(sv.some(o => o.op === 'keep' && o.text.includes('Malmö')),
      'unchanged non-ASCII stays context and is not re-encoded');
  });

  /* A hash is taken over content these ops describe. If the ops moved between
     two calls on the same input, nothing downstream could be verified. */
  await t.test('the ops are deterministic — same input, identical output, twice', () => {
    const oldT = 'Either party may terminate this Agreement for convenience by giving the other '
      + "party not less than sixty (60) days' written notice. Termination shall not affect fees accrued.";
    const newT = 'Either party may terminate this Agreement for convenience by giving the other '
      + "party not less than thirty (30) days' written notice. Termination shall not affect fees accrued.";
    const a = redlineOps(oldT, newT);
    const b = redlineOps(oldT, newT);
    assert.deepStrictEqual(a, b, 'two calls on one input must agree exactly');
    assert.deepStrictEqual(JSON.stringify(a), JSON.stringify(b), 'and agree as stored JSON');
  });

  await t.test('runs are maximal — no two adjacent ops share a kind', () => {
    const ops = roundTrips(
      'one two three four five six seven eight nine ten eleven twelve',
      'one TWO three four FIVE six seven EIGHT nine ten eleven TWELVE');
    for (let i = 1; i < ops.length; i++)
      assert.notStrictEqual(ops[i].op, ops[i - 1].op,
        `ops ${i - 1} and ${i} are both "${ops[i].op}" — runs were not merged`);
  });

  /* The measured reason this engine exists. The LCS table in versioning.js
     fills 4,000 × 4,000 Uint32 cells for this input — 61 MiB — because its cost
     depends on LENGTH. Myers' cost depends on the EDIT DISTANCE, and a
     schedule with ten amended lines has a tiny one. */
  await t.test('a 2,000-word clause diffs well under 200ms', () => {
    const WORDS = ['Provider','Client','goods','facility','storage','handling','dispatch',
      'inventory','reporting','carrier','coordination','schedule','annex','invoice','payment',
      'liability','insurance','termination','notice','governing','law','dispute','negotiation',
      'representative','party','agreement','clause','term','condition','obligation'];
    const words = [];
    for (let i = 0; i < 2000; i++) words.push(WORDS[(i * 7) % WORDS.length]);
    const oldT = words.join(' ');
    const nw = words.slice();
    for (let i = 100; i < 2000; i += 200) nw[i] = 'AMENDED';
    const newT = nw.join(' ');

    assert.strictEqual(redlineTokens(oldT).length, 3999, 'the fixture really is ~4,000 tokens');
    const t0 = process.hrtime.bigint();
    const ops = redlineOps(oldT, newT);
    const ms = Number(process.hrtime.bigint() - t0) / 1e6;

    assert.strictEqual(redlineOldText(ops), oldT, 'still exact at 2,000 words');
    assert.strictEqual(redlineNewText(ops), newT, 'still exact at 2,000 words');
    assert.strictEqual(runs(ops, 'ins').length, 10, 'all ten amendments found');
    assert.ok(ms < 200, `2,000-word clause took ${ms.toFixed(1)}ms, budget is 200ms`);
  });

  await t.test('a 2,000-word clause that was wholly rewritten stays bounded too', () => {
    const a = [], b = [];
    for (let i = 0; i < 2000; i++){ a.push('alpha' + (i % 37)); b.push('beta' + (i % 41)); }
    const t0 = process.hrtime.bigint();
    const ops = redlineOps(a.join(' '), b.join(' '));
    const ms = Number(process.hrtime.bigint() - t0) / 1e6;
    assert.strictEqual(redlineOldText(ops), a.join(' '));
    assert.strictEqual(redlineNewText(ops), b.join(' '));
    assert.ok(ms < 200, `worst case took ${ms.toFixed(1)}ms, budget is 200ms`);
    assert.ok(runs(ops, 'del').length <= 1 && runs(ops, 'ins').length <= 1,
      'past the budget the passage reads as replaced, not as confetti');
  });

  await t.test('renders from an ops array without consulting any diff', () => {
    const ops = [{ op: 'keep', text: 'payable within ' }, { op: 'del', text: 'thirty (30)' },
      { op: 'ins', text: 'forty-five (45)' }, { op: 'keep', text: ' days' }];
    const html = win.redlineOpsHtml(ops);
    /* ELEMENTS, not styled spans — <ins> and <del> are what HTML has for this,
       so a redline is announced as inserted and deleted wording rather than as
       coloured text. The nego-* hooks ride along on the class list, which is
       what the room's stylesheet and the rest of this suite address. */
    assert.match(html, /<del class="[^"]*nego-del[^"]*">thirty \(30\)<\/del>/);
    assert.match(html, /<ins class="[^"]*nego-ins[^"]*">forty-five \(45\)<\/ins>/);
    assert.match(html, /bg-red-100 text-red-800 line-through/);
    assert.match(html, /bg-green-100 text-green-800 underline/);
    assert.ok(html.startsWith('payable within '));
  });

  await t.test('markup in the wording is escaped, never rendered', () => {
    const ops = redlineOps('pay <b>now</b>', 'pay <i>later</i>');
    const html = win.redlineOpsHtml(ops);
    assert.ok(!html.includes('<b>') && !html.includes('<i>'), 'no document text reaches the DOM as markup');
    assert.ok(html.includes('&lt;'), 'it is escaped instead');
  });
});
