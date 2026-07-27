/* f40 — the clause model (js/clausemodel.js) + the richdoc attribute
   ============================================================
   The before-state this replaces, measured and recorded in BUGLOG:
   negoClausesOf() returned FOURTEEN clauses for the prototype's six-clause
   contract — every heading filed as a nameless clause body, every title and
   number empty, every id a line index (`clause:#3`).

   Every assertion below is on the prototype-shaped fixtures in
   clausefixtures.js, including the all-caps variant and the headingless one. */
const test = require('node:test');
const assert = require('node:assert');
const { buildWorld } = require('./world.js');
const F = require('./clausefixtures.js');

const W = buildWorld();
const win = W.win;

/* The modules run inside a vm realm, so an array they return has that realm's
   Array.prototype and is never deepStrictEqual to one written here. `own()`
   copies it into this realm so the comparison is about the VALUES. */
const own = xs => Array.from(xs);

test('f40 — the clause model', async t => {

  await t.test("the prototype's six clauses segment as exactly six", () => {
    const cls = win.clauseSegment(F.protoRich());
    assert.strictEqual(cls.length, 6,
      `expected 6 clauses, got ${cls.length} — the old model returned 14 here`);
    assert.deepStrictEqual(own(cls.map(c => c.num)),
      ['1', '4', '5', '6', '9', '12'],
      'non-contiguous numbering is read as written, never as an index');
    assert.deepStrictEqual(own(cls.map(c => c.title)),
      ['Scope of Services', 'Payment Terms', 'Storage Conditions and Duration',
        'Liability and Insurance', 'Termination Notice', 'Governing Law and Disputes']);
    for (const cl of cls) assert.ok(cl.text.trim(), `clause ${cl.num} must carry a body`);
  });

  await t.test('the document title and the meta line are chrome, not clauses', () => {
    const cls = win.clauseSegment(F.protoRich());
    assert.ok(!cls.some(c => c.title === F.PROTO_TITLE), 'the <h1> title is not a clause');
    assert.ok(!cls.some(c => c.text.includes('Drafted in HaTi wizard')),
      'the meta line is not part of any clause body');
  });

  await t.test('a heading is never filed as a clause body', () => {
    for (const cl of win.clauseSegment(F.protoRich()))
      assert.ok(!/^Clause \d+ ·/.test(cl.text.trim()),
        `clause ${cl.num}'s body begins with a heading — the old model's exact failure`);
  });

  await t.test('a multi-paragraph body is ONE clause with one body', () => {
    const five = win.clauseSegment(F.protoRich()).find(c => c.num === '5');
    assert.ok(five.bodyHtml.match(/<p>/g).length === 2, 'clause 5 really is two paragraphs');
    assert.ok(five.text.includes('ninety') === false);
    assert.ok(five.text.includes('one hundred and twenty (120) days'));
    assert.ok(five.text.includes('After that period'), 'both paragraphs are in the one body');
  });

  await t.test('an ALL-CAPS numbered document yields the same six clauses', () => {
    const cls = win.clauseSegment(F.protoRichCaps());
    assert.strictEqual(cls.length, 6);
    assert.deepStrictEqual(own(cls.map(c => c.num)),
      ['1', '4', '5', '6', '9', '12'],
      '"4. PAYMENT TERMS" and "Clause 4 · Payment Terms" both yield num 4');
    assert.strictEqual(cls[1].title, 'PAYMENT TERMS');
  });

  await t.test('a headingless document does not degrade to zero clauses', () => {
    const cls = win.clauseSegment(F.protoRichHeadingless());
    assert.strictEqual(cls.length, 6, 'the text fallback keeps every clause');
    assert.ok(cls.every(c => c.headingless), 'and says plainly that it is a fallback');
    assert.deepStrictEqual(own(cls.map(c => c.num)),
      ['1', '4', '5', '6', '9', '12']);
  });

  await t.test('a sub-heading is part of its clause body, not a clause', () => {
    const cls = win.clauseSegment(F.protoRichNested());
    assert.strictEqual(cls.length, 6, 'the <h3> does not open a seventh clause');
    const six = cls.find(c => c.num === '6');
    assert.ok(six.bodyHtml.includes('<h3>'), 'the sub-heading lives in clause 6 body');
    assert.ok(six.text.includes('inherent vice'), 'and so does the text under it');
  });

  /* Both heading styles the fixture rule demands, plus the ones that must NOT
     be read as numbered. */
  await t.test('heading parsing, as a table', () => {
    const rows = [
      ['Clause 4 · Payment Terms', '4', 'Payment Terms'],
      ['4. PAYMENT TERMS', '4', 'PAYMENT TERMS'],
      ['12. Governing Law and Disputes', '12', 'Governing Law and Disputes'],
      ['Clause 5 Storage Conditions', '5', 'Storage Conditions'],
      ['Article 7 — Force Majeure', '7', 'Force Majeure'],
      ['Section 2.1: Definitions', '2.1', 'Definitions'],
      ['SCHEDULE A', '', 'SCHEDULE A'],
      ['Payment Terms', '', 'Payment Terms'],
      ['9.', '9', ''],
    ];
    for (const [raw, num, title] of rows){
      const got = win.clauseParseHeading(raw);
      assert.strictEqual(got.num, num, `num of ${JSON.stringify(raw)}`);
      assert.strictEqual(got.title, title, `title of ${JSON.stringify(raw)}`);
    }
  });

  await t.test('the display label is rebuilt from num and title, never stored', () => {
    assert.strictEqual(win.clauseLabel({ num: '4', title: 'Payment Terms' }), 'Clause 4 · Payment Terms');
    assert.strictEqual(win.clauseLabel({ num: '', title: 'Schedule A' }), 'Schedule A');
    assert.strictEqual(win.clauseLabel({ num: '9', title: '' }), 'Clause 9');
  });

  /* ---------- durable ids ---------- */

  await t.test('stamping assigns one opaque id per clause, and only to clauses', () => {
    const { html, stamped } = win.clauseStampIds(F.protoRich());
    assert.strictEqual(stamped, 6, 'six clauses stamped');
    const cls = win.clauseSegment(html);
    assert.strictEqual(cls.length, 6);
    for (const cl of cls) assert.match(cl.clauseId, /^cl_[a-z0-9]{4,24}$/, 'ids are opaque');
    assert.strictEqual(new Set(cls.map(c => c.clauseId)).size, 6, 'and unique');
    assert.ok(!/<h1[^>]*data-clause-id/.test(html), 'the document title gets no clause id');
  });

  await t.test('stamping is idempotent — running it again moves no id', () => {
    const once = win.clauseStampIds(F.protoRich()).html;
    const ids1 = win.clauseSegment(once).map(c => c.clauseId);
    const twice = win.clauseStampIds(once);
    assert.strictEqual(twice.stamped, 0, 'nothing left to stamp');
    assert.deepStrictEqual(own(win.clauseSegment(twice.html).map(c => c.clauseId)), own(ids1));
  });

  /* The property a line-index id could not have. This is the defect, restated
     as a passing test. */
  await t.test('inserting a clause above a clause re-points nothing', () => {
    const doc = win.clauseStampIds(F.protoRich()).html;
    const before = win.clauseSegment(doc);
    const payment = before.find(c => c.num === '4');
    const scope = before.find(c => c.num === '1');

    const ins = win.clauseInsert(doc, scope.clauseId,
      { headingText: 'Clause 2 · Definitions', bodyHtml: '<p>In this Agreement, “Goods” means…</p>' });
    const after = win.clauseSegment(ins.html);

    assert.strictEqual(after.length, 7, 'the new clause is in the document');
    assert.strictEqual(after[1].clauseId, ins.clauseId, 'and it landed where it was asked to go');
    assert.strictEqual(after[1].title, 'Definitions');

    const paymentAfter = after.find(c => c.clauseId === payment.clauseId);
    assert.ok(paymentAfter, 'clause 4 is still findable by its id');
    assert.strictEqual(paymentAfter.text, payment.text, 'and still carries its own wording');
    assert.strictEqual(paymentAfter.num, '4', 'its printed number is unchanged here');
  });

  await t.test('renumbering the whole contract moves no id', () => {
    const doc = win.clauseStampIds(F.protoRich()).html;
    const before = win.clauseSegment(doc);
    // 1,4,5,6,9,12 → 1,2,3,4,5,6, the way a lawyer tidies a draft
    let renum = doc;
    before.forEach((cl, i) => {
      renum = win.clauseReplaceHeading(renum, cl.clauseId, `Clause ${i + 1} · ${cl.title}`);
    });
    const after = win.clauseSegment(renum);
    assert.deepStrictEqual(own(after.map(c => c.num)),
      ['1', '2', '3', '4', '5', '6'], 'the numbers moved');
    assert.deepStrictEqual(own(after.map(c => c.clauseId)), own(before.map(c => c.clauseId)),
      'and every id stayed exactly where it was');
    assert.deepStrictEqual(own(after.map(c => c.text)), own(before.map(c => c.text)), 'as did every body');
  });

  /* ---------- the richdoc change: data-clause-id, and nothing else ---------- */

  await t.test('data-clause-id survives a sanitize round trip', () => {
    const html = '<h2 data-clause-id="cl_8f2k9q">Clause 4 · Payment Terms</h2><p>Net-30.</p>';
    const out = win.sanitizeRich(html);
    assert.ok(out.includes('data-clause-id="cl_8f2k9q"'), 'the id survives');
    assert.strictEqual(win.sanitizeRich(out), out, 'and the sanitiser stays idempotent');
  });

  await t.test('no other data-* or event attribute is admitted with it', () => {
    const out = win.sanitizeRich(
      '<h2 data-clause-id="cl_8f2k9q" data-owner="erik" data-x="1" onclick="alert(1)" '
      + 'onmouseover="x()" id="c4" class="evil" style="color:red" href="javascript:x">Clause 4</h2>');
    assert.ok(out.includes('data-clause-id="cl_8f2k9q"'), 'the one allowed attribute stays');
    for (const bad of ['data-owner', 'data-x', 'onclick', 'onmouseover', ' id=', 'class=', 'style=', 'href'])
      assert.ok(!out.includes(bad), `${bad} must not survive the sanitiser`);
  });

  await t.test('a malformed clause id is dropped rather than stored', () => {
    for (const bad of ['../../etc', 'cl_<script>', 'CL_UPPER', 'clause:#3', '', 'cl_' + 'a'.repeat(40)]){
      const out = win.sanitizeRich(`<h2 data-clause-id="${bad}">Clause 4</h2>`);
      assert.ok(!out.includes('data-clause-id'),
        `${JSON.stringify(bad)} is not an id this repo issues and must be dropped`);
    }
  });

  await t.test('data-clause-id is admitted only on blocks that open a clause', () => {
    /* A heading opens a clause in a structured contract; a paragraph opens one
       in a flat uploaded document that has no headings at all. An inline mark
       and a table cell open nothing, so they carry no identity. */
    const ok = win.sanitizeRich('<h2 data-clause-id="cl_8f2k9q">h</h2><p data-clause-id="cl_zzzz11">b</p>');
    assert.ok(ok.includes('cl_8f2k9q') && ok.includes('cl_zzzz11'));
    const no = win.sanitizeRich('<span data-clause-id="cl_8f2k9q">x</span>'
      + '<td data-clause-id="cl_8f2k9q">y</td><li data-clause-id="cl_8f2k9q">z</li>');
    assert.ok(!no.includes('data-clause-id'), 'inline marks and cells carry no clause identity');
  });

  await t.test('the canonical form carries the id, so the seal covers identity', () => {
    const a = win.canonicalRich('<h2 data-clause-id="cl_8f2k9q">Clause 4</h2>');
    const b = win.canonicalRich('<h2 data-clause-id="cl_zzzz11">Clause 4</h2>');
    assert.notStrictEqual(a, b, 'two documents differing only in clause identity are different documents');
    assert.ok(a.includes('data-clause-id="cl_8f2k9q"'));
  });

  /* ---------- editing by id, on the DOM ---------- */

  await t.test('replacing a body keeps the heading, the id and every other clause', () => {
    const doc = win.clauseStampIds(F.protoRich()).html;
    const four = win.clauseSegment(doc).find(c => c.num === '4');
    const out = win.clauseReplaceBody(doc, four.clauseId, `<p>${F.PROTO_ASKS['4'].text}</p>`);
    const cls = win.clauseSegment(out);
    assert.strictEqual(cls.length, 6, 'no clause gained or lost');
    const now = cls.find(c => c.clauseId === four.clauseId);
    assert.ok(now.text.includes('forty-five (45)'), 'the new wording is in');
    assert.strictEqual(now.title, 'Payment Terms', 'the heading is untouched');
    assert.strictEqual(cls.find(c => c.num === '5').text,
      win.clauseSegment(doc).find(c => c.num === '5').text, 'the neighbours are untouched');
  });

  await t.test('removing a clause takes its heading and its whole body', () => {
    const doc = win.clauseStampIds(F.protoRich()).html;
    const five = win.clauseSegment(doc).find(c => c.num === '5');   // two paragraphs
    const out = win.clauseRemove(doc, five.clauseId);
    const cls = win.clauseSegment(out);
    assert.strictEqual(cls.length, 5);
    assert.ok(!cls.some(c => c.clauseId === five.clauseId));
    assert.ok(!out.includes('After that period'), 'the second paragraph went with it');
    assert.ok(out.includes('Liability and Insurance'), 'and clause 6 did not');
  });

  await t.test('an unknown clause id is reported, never silently ignored', () => {
    const doc = win.clauseStampIds(F.protoRich()).html;
    assert.strictEqual(win.clauseReplaceBody(doc, 'cl_nope00', '<p>x</p>'), null);
    assert.strictEqual(win.clauseRemove(doc, 'cl_nope00'), null);
    assert.strictEqual(win.clauseInsert(doc, 'cl_nope00', { headingText: 'x' }), null);
  });

  await t.test('an inserted clause takes the rank of the clause it follows', () => {
    const doc = win.clauseStampIds(F.protoRich()).html;
    const first = win.clauseSegment(doc)[0];
    const ins = win.clauseInsert(doc, first.clauseId, { headingText: 'Clause 2 · Definitions', bodyHtml: '<p>x</p>' });
    assert.ok(ins.html.includes(`<h2 data-clause-id="${ins.clauseId}">`), 'a peer, not a sub-clause');
  });
});
