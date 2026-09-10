/* f282 — ONE FORMAT ON SCREEN (owner-asked 10 Sep 2026)
   =====================================================
   *"Some clauses are in capital letters and some in small letters. Let them all
   be in one format for presentation purposes."*

   THE BEFORE-STATE, MEASURED through the product's own one naming function on
   one document's own headings:

     "Clause 1 · SUPPLY & SPECIFICATION"
     "Clause 2 · Price & Contract Value"
     "Clause 3 · quality & rejection"

   Three cases in one column, none of them a decision anybody here took.

   WHAT IS PROVED HERE is that ONE reading answers for every screen, that it
   changes what is PRINTED and nothing else, and that the PAPER is deliberately
   left exactly as drafted. The sweep at the end is the net: it fails on the
   next surface written the old way. */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const { buildWorld } = require('./world.js');

const W = buildWorld();
const win = W.win;
const read = p => fs.readFileSync(p, 'utf8');

test('f282 — one clause-name format on screen', async t => {

  /* ---------- (1) THE READING ---------- */

  await t.test('a clause name is presented in ONE style, whatever case it arrived in', () => {
    const shown = win.clauseNameShown;
    assert.strictEqual(typeof shown, 'function',
      'clauseNameShown must be published — an unpublished name read through window is silence');
    /* The three the owner reported, and they come back as one format. */
    assert.strictEqual(shown('SUPPLY & SPECIFICATION'), 'Supply & Specification');
    assert.strictEqual(shown('Price & Contract Value'), 'Price & Contract Value');
    assert.strictEqual(shown('quality & rejection'), 'Quality & Rejection');
  });

  await t.test('the NUMBER and the SHAPE are left exactly as they stand', () => {
    const shown = win.clauseNameShown;
    /* A built label stays a built label; only the title is re-cased. */
    assert.strictEqual(shown('Clause 1 · SUPPLY & SPECIFICATION'),
      'Clause 1 · Supply & Specification');
    /* A raw heading stays a raw heading — no "Clause" is invented in front. */
    assert.strictEqual(shown('4. TERM AND TERMINATION'), '4. Term and Termination');
    /* A number with nothing after it has no title to case. */
    assert.strictEqual(shown('Clause 8.2'), 'Clause 8.2');
    /* A title that OPENS with a figure keeps the figure where it was. */
    assert.strictEqual(shown('2019 DATA PROTECTION ACT'), '2019 Data Protection Act');
    assert.strictEqual(shown(''), '');
    assert.strictEqual(shown(null), '');
  });

  await t.test('it is clausemodel\'s own case machinery and not a second copy', () => {
    /* If these two ever disagree there are two house styles in one product. */
    for (const s of ['SPECIFICATIONS, QUALITY & INSPECTION', 'IP RIGHTS',
      'ROUTE-TO-MARKET', 'TERM AND TERMINATION', 'Liability & Governing Law'])
      assert.strictEqual(win.clauseNameShown(s), win.clauseTitleCase(s),
        `${s} must read the same way here as it does on the friction page`);
  });

  /* ---------- (2) ONE DOOR ---------- */

  await t.test('clauseLabel builds a RECORD, so it does NOT present', () => {
    /* THE WALL, and it passes before this job and after: `clauseLabel`'s answer
       is stamped onto every change as `ch.clauseLabel` and onto the front-matter
       region, where the stamped string keeps English. Presenting inside it would
       rewrite records for a screen's sake — "for presentation purposes" is about
       what a screen SHOWS, never about what is written down. Its job is to fail
       the day somebody moves the format one level too deep. */
    assert.strictEqual(win.clauseLabel({ num: '1', title: 'SUPPLY & SPECIFICATION' }),
      'Clause 1 · SUPPLY & SPECIFICATION');
    assert.strictEqual(win.clauseLabel({ num: '', title: 'Front matter' }), 'Front matter');
  });

  await t.test('the opening-words fallback is deliberately never presented', () => {
    /* A clause with no number and no heading is named by its own first words.
       Title Case on a sentence is worse than the shouting it would fix, so the
       reading leaves a sentence alone even when it is asked. */
    const sentence = 'The Supplier shall supply an estimated 5000 metric tonnes.';
    assert.ok(/^The Supplier shall supply an estimated/
      .test(win.clauseLabel({ num: '', title: '', text: sentence })),
      'a sentence fallback stays a sentence');
  });

  /* ---------- (3) IT CHANGES WHAT IS PRINTED AND NOTHING ELSE ---------- */

  await t.test('no stored wording moves and no fingerprint moves', () => {
    const src = read('js/clausemodel.js');
    const i = src.indexOf('function clauseNameShown(');
    assert.ok(i > 0, 'clauseNameShown lives in the clause model');
    const body = src.slice(i, src.indexOf('\n}', i));
    for (const bad of ['clauseReplaceHeading', 'clauseReplaceBody', 'headingText',
      'persist(', 'logAudit'])
      assert.ok(!body.includes(bad),
        `clauseNameShown must not reach ${bad} — it presents, it does not rewrite`);
    /* The attested field is headingText and this never touches it. */
    const hash = read('js/negotiation.js');
    const hi = hash.indexOf('function negoHashInput(');
    const hbody = hash.slice(hi, hash.indexOf('\n}', hi));
    assert.ok(hbody.includes('iss.headingText'), 'the fingerprint carries headingText');
    assert.ok(!hbody.includes('clauseLabel'),
      'the fingerprint must not carry the display label, or presenting one would move it');
  });

  await t.test('THE PAPER IS NOT SWEPT — the agreement is drawn as it was drafted', () => {
    /* The three builders that draw the contract itself. None of them may ask
       the presentation reading: a document tab that quietly re-cased its own
       headings would read differently from the file it came out of. */
    const nv = read('js/views/negotiation.js');
    for (const fname of ['function redlineDocHtml(', 'function negoDocHtml(']){
      const i = nv.indexOf(fname);
      assert.ok(i > 0, `${fname} exists`);
      const body = nv.slice(i, nv.indexOf('\n}\n', i));
      assert.ok(!/_neClause\(|clauseNameShown\(|negoClauseName\(/.test(body),
        `${fname} draws the paper and must present nothing`);
    }
    const cv = read('js/views/contract.js');
    const di = cv.indexOf('function documentTextHtml(');
    if (di > 0) assert.ok(!/clauseNameShown\(|_ctClauseName\(/
      .test(cv.slice(di, cv.indexOf('\n}\n', di))),
      'documentTextHtml draws the paper and must present nothing');
  });

  /* ---------- (4) THE NET ---------- */

  await t.test('every screen that prints a stored clause name asks the one reading', () => {
    /* A stored label was written by whatever clauseLabel said on the day it was
       filed, so a surface printing it raw is a surface still showing whatever
       case the paper shouted in. This sweep fails on the next one written that
       way. Each entry names the file and the one builder allowed to read the
       field raw, with its reason. */
    const files = {
      'js/views/negotiation.js': '_neClause',
      'js/views/contract.js': '_ctClauseName',
      'js/views/portal.js': '_pvClauseName',
      'js/review.js': '_rvClauseName',
      'js/ai.js': '_aiClauseName',
    };
    for (const [path, helper] of Object.entries(files)){
      const src = read(path);
      assert.ok(src.includes(`const ${helper} =`),
        `${path} must name its one reading (${helper})`);
      assert.ok(/window\.negoClauseName/.test(src),
        `${path} must reach it through window — a bare cross-module read throws`);
    }
    /* And the model's own helper is published, or every guard above is false. */
    assert.ok(/negoClauseLabel, negoClauseName,/.test(read('js/negotiation.js')),
      'negoClauseName must be published from js/negotiation.js');
    /* The clause editor names every screen it draws through ONE function, so
       its greeting, its reading line, its scope line and its leave warning
       cannot come to call one clause four different things. */
    const ce = read('js/views/clauseeditor.js');
    const i = ce.indexOf('function ceClauseLabel(');
    assert.ok(i > 0 && ce.slice(i, i + 500).includes('negoClauseName('),
      'ceClauseLabel is the clause editor\'s one display naming and must present');
  });

  await t.test('the timeline presents ONCE, for every history surface at once', () => {
    /* The room\'s History tab, the negotiation page\'s history screen, its
       exported report and the phone all read negoTimeline\'s rows, so the
       reading belongs in that builder and not in four renderers. */
    const src = read('js/negotiation.js');
    const i = src.indexOf('const pushChange = (ch, roundN) =>');
    assert.ok(i > 0, 'negoTimeline builds its rows in pushChange');
    assert.ok(src.slice(i, i + 400).includes('negoClauseName(ch.clauseLabel'),
      'the timeline row carries a presented name');
  });
});
