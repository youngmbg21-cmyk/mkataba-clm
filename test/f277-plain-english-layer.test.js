/* ============================================================
   F277 — a plain-English reading beside every clause (idea 7)
   ============================================================
   Young, 9 Sep 2026, on why this exists at all: *"part of the frustration with
   reading contracts is the legal verbiage in contracts so the plain english
   needs to be clear enough for a regular person."* And, on where the control
   goes and what it must never do: *"go with the switch is in your slot option
   as i shared with no ring around the buttons ... switch the 2 buttons so that
   the first button is 'Contract View' and then 'Plain English' comes second."*

   The worry that shaped the whole design, in Young's own words two messages
   earlier: *"i am concerned you want to delete the highlighted area"* — the
   right-hand column, which on their own contract holds the fill-in form, the
   provenance line, Checks and Activity. NOTHING IS DELETED. The column takes
   turns, exactly as it already does between the Document tab and Signing.

   What is pinned here, and each is a way this could go wrong:
   - THE ORDER AND THE DEFAULT ARE YOUNG'S. Contract View first and lit at rest;
     Plain English second. A page that opened on the readings would be a page
     that had spent Copilot money nobody asked for.
   - THE READING IS NEVER IN THE DOCUMENT BUILDER. docBody is what the share
     copy, the exports and the phone all render, so a note written into it would
     travel. It is painted beside the paper, off wireDocCanvas.
   - IT NEVER TRAVELS AND IS NEVER STORED. Its own table, transport on the way
     out, stripped on save and stripped out of any share payload.
   - THE LIST SENT AND THE ANCHORS ARE ONE WALK OF THE PAINTED SHEET. The
     server is deliberately never asked what counts as a clause — two answers to
     that question is how a note comes to sit beside the wrong wording.
   - PAIRED BY THE NUMBER IT WAS GIVEN. An answer that skipped one clause must
     not shunt every reading after it onto the next clause down.
   - A CUT-SHORT ANSWER IS NOT KEPT. The brief paid for this lesson once.
   - AND THE PROMPT IS THE FEATURE. Young asked for plain English for a regular
     person; the instruction that produces it is pinned word for word, because
     it is the only part of this a test can hold on to. */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { startHati, startScriptedAi, seedWorkspace, FOLDER_A, FOLDER_B } = require('./helpers');
const { buildWorld } = require('./world');

const SRC = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const CONTRACT_JS = SRC('js/views/contract.js');
const SERVER_JS = SRC('server/server.js');
const CORE_JS = SRC('js/core.js');
const INDEX = SRC('index.html');

const BODY = [
  '<h1>Raw Materials Supply Agreement</h1>',
  '<p>Between Highland Corporate Ltd and Nordkust Industri AB.</p>',
  '<h2>1. Supply and delivery</h2>',
  '<p>The Supplier shall deliver the Products to the Delivery Point on the dates set out in each accepted purchase order. Time of delivery is of the essence.</p>',
  '<h2>2. Prices and payment</h2>',
  '<p>The Buyer shall pay each undisputed invoice within thirty (30) days of the invoice date.</p>',
  '<h2>3. Interpretation</h2>',
  '<p>Headings are for convenience only and do not affect interpretation.</p>',
].join('');

/* THE SHEET IS THE STAGE, because the sheet is what this layer reads. Every
   claim below plants a real #doc-canvas and puts markup on it — which is the
   only honest way to ask this in node, and is also stronger than the reading
   these tests started life pinning. */
function sheet(win, html) {
  const doc = win.document;
  let canvas = doc.getElementById('doc-canvas');
  if (!canvas) {
    canvas = doc.createElement('div');
    canvas.id = 'doc-canvas';
    doc.body.appendChild(canvas);
  }
  canvas.innerHTML = html;
  return canvas;
}

const tu = input => [{ type: 'tool_use', id: 'tu_pe', name: 'clause_readings', input }];

/* ============================================================
   1. THE SWITCH — Young's order, Young's default
   ============================================================ */
describe('f277 (1) the switch reads Contract View then Plain English', () => {
  let win;
  before(() => {
    win = buildWorld({ contractView: true }).win;
    win.innerWidth = 1440;
    sheet(win, BODY);
  });

  test('two buttons, in that order, with Contract View lit at rest', () => {
    const c = { id: 'MK-1', name: 'Supply', redlineText: BODY, changes: [], audit: [] };
    const html = win.docReadSwitchHtml(c);
    assert.ok(html, 'the switch draws on a contract with wording');
    const first = html.indexOf('Contract View');
    const second = html.indexOf('Plain English');
    assert.ok(first > -1 && second > -1, 'both words are on it');
    assert.ok(first < second, 'Contract View comes FIRST — Young ruled the order');
    const pressed = html.match(/aria-pressed="true"/g) || [];
    assert.equal(pressed.length, 1, 'exactly one of the pair is lit');
    const upToSecond = html.slice(0, second);
    assert.ok(/aria-pressed="true"/.test(upToSecond),
      'and it is Contract View: nothing has been read, so nothing is shown');
  });

  test('no ring, no band, no strip — it is a control and nothing else', () => {
    const c = { id: 'MK-1', name: 'Supply', redlineText: BODY, changes: [], audit: [] };
    const html = win.docReadSwitchHtml(c);
    assert.ok(!/<div class="(band|strip|notice)/.test(html), 'the switch draws no band of its own');
    assert.equal((html.match(/<button/g) || []).length, 2, 'two buttons and nothing more');
  });

  test('it stands down on a window too narrow to hold two working columns', () => {
    const c = { id: 'MK-1', name: 'Supply', redlineText: BODY, changes: [], audit: [] };
    win.innerWidth = 900;
    assert.equal(win.docReadSwitchHtml(c), '', 'not drawn where it could not be used');
    assert.equal(win.docReadOn(), false, 'and the preference is not honoured there either');
    win.innerWidth = 1440;
  });

  test('the stored preference is READ but never WRITTEN at a width that cannot honour it', () => {
    win.innerWidth = 1440;
    win.docReadSet(true);
    assert.equal(win.docReadOn(), true);
    win.innerWidth = 900;
    win.docReadSet(false);                       // a narrow sitting must not clear it
    win.innerWidth = 1440;
    assert.equal(win.docReadOn(), true, 'the laptop choice survives a narrow sitting');
    win.docReadSet(false);
  });

  test('a document with nothing to read is offered no switch', () => {
    const blank = { id: 'MK-2', name: 'A scan whose words never came out', redlineText: '', changes: [], audit: [] };
    sheet(win, '');
    assert.equal(win.docReadSwitchHtml(blank), '', 'a verb that cannot work is not drawn');
    sheet(win, BODY);
  });

  /* THE COMMONEST SHAPE THIS FEATURE MEETS, and the browser caught it: a scan
     whose words never came out of the file still paints ONE heading — the
     contract's own name, which the upload branch draws in a bare div of its own
     rather than in the header the template paper uses. Left as a clause it
     drew the switch and would have asked the model to explain a title. */
  test('a sheet holding nothing but the contract\'s own name is nothing to read', () => {
    const c = { id: 'MK-3', name: 'Nordkust supply agreement', redlineText: '', changes: [], audit: [] };
    sheet(win, '<div><h3>Nordkust supply agreement</h3></div><div>scan.pdf · filed 9 Sep</div>');
    assert.equal(win.docReadClauses(c).length, 0, 'the title is not a clause');
    assert.equal(win.docReadSwitchHtml(c), '', 'so no switch is offered');
    sheet(win, BODY);
  });
});

/* ============================================================
   2. ONE WALK OF THE SHEET, AND A NOTE THAT CANNOT LAND ON THE WRONG CLAUSE
   ============================================================
   REVERSED IN PLACE 9 Sep 2026, and the claim these tests were written for is
   stronger for it. They pinned that the list sent was clauseSegment's, on the
   reasoning that one splitter means one answer to what a clause is. That
   reasoning is right and clauseSegment is untouched — but it reads a DOCUMENT
   MODEL, top-level blocks under their own headings, which is the shape a
   stored rich body has and NOT the shape docBody draws for a template
   contract: there each clause sits inside a block of its own with the heading
   nested in it. MEASURED on this product's own paper — MK-A2's sheet paints
   five headings and segmenting the same html returns ONE clause, the whole
   agreement under its title.

   So this layer reads the PAINTED SHEET, and what is pinned now is the
   property that was ever load-bearing: the list sent to the model and the
   anchors the notes hang on are the SAME WALK, so a note cannot land beside
   the wrong wording by construction rather than by care. */
describe('f277 (2) one walk, and a note that cannot land on the wrong clause', () => {
  let win;
  before(() => { win = buildWorld({ contractView: true }).win; win.innerWidth = 1440; });

  const C = { id: 'MK-1', name: 'Supply', redlineText: BODY, changes: [], audit: [] };

  test('the clauses sent are the headings painted on the sheet', () => {
    sheet(win, BODY);
    const mine = win.docReadClauses(C);
    /* Array.from, NOT .map — the reading runs in the jsdom realm and hands back
       that realm's Array, whose prototype is not this one's, and
       deepStrictEqual compares prototypes. Two identical lists reported as
       different is the stage rather than the product. */
    assert.deepEqual(Array.from(mine, x => x.heading),
      ['Raw Materials Supply Agreement', '1. Supply and delivery', '2. Prices and payment', '3. Interpretation'],
      'every heading a reader can see, in the order they read them');
    assert.ok(mine.every(x => typeof x.text === 'string'), 'each carries its own wording');
    assert.ok(/thirty \(30\) days/.test(mine[2].text),
      "and a clause's wording is what sits under its own heading");
    assert.ok(!/thirty \(30\) days/.test(mine[1].text),
      'and stops at the next one, so no clause carries its neighbour');
  });

  test('the list sent and the anchors are the same walk — never two readings', () => {
    sheet(win, BODY);
    const sent = win.docReadClauses(C);
    const pairs = win.docReadAnchors(C, sent.map((x, i) => ({ i, heading: x.heading, plain: 'p' + i })));
    assert.equal(pairs.length, sent.length, 'every clause sent can be anchored back');
    pairs.forEach((p, i) => assert.equal(p.el.textContent, sent[i].heading,
      'and each lands on the heading it was sent as'));
  });

  test('a reading is paired with the clause whose heading it names', () => {
    sheet(win, '<h1>Title</h1><h2>1. Supply and delivery</h2><p>x</p>'
      + '<h2>2. Prices and payment</h2><p>y</p><h2>3. Interpretation</h2><p>z</p>');
    const c = { id: 'MK-1', name: 'Supply', changes: [], audit: [] };
    const pairs = win.docReadAnchors(c, [
      { i: 1, heading: '1. Supply and delivery', plain: 'They deliver on the dates you order for.' },
      { i: 2, heading: '2. Prices and payment', plain: 'You pay within 30 days.' },
    ]);
    assert.equal(pairs.length, 2);
    assert.equal(pairs[0].el.textContent, '1. Supply and delivery');
    assert.equal(pairs[1].el.textContent, '2. Prices and payment',
      'the second reading is beside the second clause, not the third');
  });

  test('a skipped clause does not shunt the readings after it onto the wrong wording', () => {
    sheet(win, '<h2>1. Supply and delivery</h2><p>x</p>'
      + '<h2>2. Prices and payment</h2><p>y</p><h2>3. Interpretation</h2><p>z</p>');
    const c = { id: 'MK-1', name: 'Supply', changes: [], audit: [] };
    /* Clause 2 came back with nothing to say, so it is simply absent. The
       reading for clause 3 must still find clause 3. */
    const pairs = win.docReadAnchors(c, [
      { i: 0, heading: '1. Supply and delivery', plain: 'a' },
      { i: 2, heading: '3. Interpretation', plain: 'c' },
    ]);
    assert.equal(pairs.length, 2);
    assert.equal(pairs[1].el.textContent, '3. Interpretation');
  });

  /* THE HEADING GUARD IS WHAT MAKES A REPAINTED DOCUMENT DRAW NOTHING rather
     than shunt every note one clause along. The number alone would be enough
     while the sheet is the sheet the reading was written about; this is the
     case where it is not. */
  test('a reading whose clause is not on the page draws nothing at all', () => {
    sheet(win, '<h2>1. Supply and delivery</h2><p>x</p>');
    const c = { id: 'MK-1', name: 'Supply', changes: [], audit: [] };
    assert.equal(win.docReadAnchors(c, [
      { i: 0, heading: '9. A clause that was renamed', plain: 'a' },
    ]).length, 0, 'silence is the only safe failure here');
  });

  test('and a document read again since is not re-anchored by number alone', () => {
    sheet(win, '<h2>0. A clause inserted since</h2><p>new</p>'
      + '<h2>1. Supply and delivery</h2><p>x</p>');
    const c = { id: 'MK-1', name: 'Supply', changes: [], audit: [] };
    assert.equal(win.docReadAnchors(c, [
      { i: 0, heading: '1. Supply and delivery', plain: 'a' },
    ]).length, 0, 'the number still resolves, and the words no longer match');
  });

  test('an empty reading is not drawn', () => {
    sheet(win, '<h2>3. Interpretation</h2><p>z</p>');
    const c = { id: 'MK-1', name: 'Supply', changes: [], audit: [] };
    assert.equal(win.docReadAnchors(c, [{ i: 0, heading: '3. Interpretation', plain: '   ' }]).length, 0);
  });

  /* THE FRONT MATTER IS NOT A CLAUSE, and this tab draws it two ways. */
  test('the paper\'s own head and signature block are stepped over', () => {
    sheet(win, '<header class="rl-paper-head"><h3>Supply</h3></header>'
      + '<h2>1. Supply and delivery</h2><p>x</p>'
      + '<div class="rl-paper-foot"><h4>Signed for and on behalf of</h4></div>');
    const c = { id: 'MK-1', name: 'Supply', changes: [], audit: [] };
    assert.deepEqual(Array.from(win.docReadClauses(c), x => x.heading), ['1. Supply and delivery']);
    const only = win.docReadClauses(c)[0];
    assert.ok(!/Signed for and on behalf of/.test(only.text),
      "the last clause stops at the signature block — the parties are not wording");
  });
});

/* ============================================================
   3. IT IS PAINTED BESIDE THE PAPER, NEVER INTO IT
   ============================================================ */
describe('f277 (3) the reading is never part of the document', () => {
  test('docBody carries no reading, and no reading builder is called from it', () => {
    const at = CONTRACT_JS.indexOf('function docBody(');
    assert.ok(at > 0, 'docBody is where it was');
    const end = CONTRACT_JS.indexOf('\nfunction ', at + 20);
    const body = CONTRACT_JS.slice(at, end > at ? end : at + 9000);
    ['docReadPaint', 'docReadItems', '_readings', 'doc-read'].forEach(name => {
      assert.ok(!body.includes(name),
        'the one document builder must not know this feature exists: ' + name);
    });
  });

  test('the layer hangs off wireDocCanvas — the funnel that re-arms the sheet', () => {
    const at = CONTRACT_JS.indexOf('function wireDocCanvas(');
    const end = CONTRACT_JS.indexOf('\n}', at);
    assert.ok(CONTRACT_JS.slice(at, end).includes('docReadPaint(c)'),
      'it is put back after every re-render, exactly as the signature places are');
  });

  test('it sits in the grid’s second track, so the paper is not narrowed', () => {
    assert.ok(/id="doc-read"[^>]*grid-column:2/.test(INDEX) || /id="doc-read"[^>]*grid-column:2/.test(CONTRACT_JS),
      'placed into the right-hand grid area rather than given a track of its own');
    assert.ok(/id="doc-read"[^>]*hidden/.test(CONTRACT_JS),
      'and it is hidden until somebody asks for it');
  });
});

/* ============================================================
   4. IT NEVER TRAVELS AND IS NEVER STORED
   ============================================================ */
describe('f277 (4) transport, never the record', () => {
  test('its own table, like the brief and the renewal advice', () => {
    assert.ok(/CREATE TABLE IF NOT EXISTS clause_readings/.test(SERVER_JS),
      'a server-side write must not bump the version under an open editor');
  });

  test('stripped on the way in, on both hosts', () => {
    assert.ok(/delete c\._readings;/.test(SERVER_JS), 'the save route drops it');
    assert.ok(/delete payload\._readings;/.test(CORE_JS), 'and so does the browser before it posts');
  });

  test('and stripped out of every share payload', () => {
    assert.ok(/delete payload\.contract\._readings;/.test(SERVER_JS),
      'our own reading of their paper is ours; the wall is on the route every path goes through');
  });

  test('the server is never asked what counts as a clause', () => {
    const at = SERVER_JS.indexOf("app.post('/api/ai/readings'");
    assert.ok(at > 0, 'the route is there');
    const route = SERVER_JS.slice(at, SERVER_JS.indexOf('\n});', at));
    ['clauseSegment', 'CLAUSE_HEADINGS', 'clauseFrontMatter'].forEach(n => {
      assert.ok(!route.includes(n), 'a second splitter here is how the two would disagree: ' + n);
    });
    assert.ok(route.includes('req.body'), 'the clause list comes from the browser');
  });
});

/* ============================================================
   5. THE PROMPT IS THE FEATURE
   ============================================================ */
describe('f277 (5) plain enough for a regular person', () => {
  const at = SERVER_JS.indexOf('const READ_PLAIN_RULE');
  const rule = SERVER_JS.slice(at, SERVER_JS.indexOf('].join', at));

  test('it names the reader Young described', () => {
    assert.ok(/no lawyer/i.test(rule), 'written for somebody with no lawyer');
    assert.ok(/legal wording|legal term/i.test(rule), 'and it takes the legal wording head on');
    assert.ok(/[Ee]veryday words/.test(rule));
  });

  /* REVERSED IN PLACE 10 Sep 2026. This pinned "never more than three
     sentences", which is what made the column a summary — Young ruled it a
     clause-for-clause TRANSLATION instead. The claim it was really making is
     kept and is the one that still matters: a reading must not run away from
     the clause it is a reading OF. The bound is now the clause itself. */
  test('it is bounded by the clause, so a reading stays a reading', () => {
    assert.ok(/Match the clause you are given/i.test(rule),
      'a long clause earns a long reading and a one-line clause gets one line');
    assert.ok(/Do not pad and do not compress/i.test(rule));
    assert.ok(!/never more than three/i.test(rule),
      'and the sentence cap is gone — it is what made this a summary');
  });
  /* A TRANSLATION, NOT A SUMMARY — the whole of Young's 10 Sep report. */
  test('it is asked for as a translation, clause by clause', () => {
    assert.ok(/TRANSLATE, DO NOT SUMMARISE/.test(rule), 'said in those words');
    assert.ok(/Nothing is folded into a neighbouring clause/i.test(rule));
    assert.ok(/every row below gets its own entry|every clause the reader was given gets its own entry/i.test(rule)
      || /own entry, under its own number/i.test(rule),
      'one entry per clause, under its own number');
  });

  test('it may not advise, warn, redraft or judge', () => {
    ['warn', 'advise', 'wording', 'fair'].forEach(w =>
      assert.ok(rule.toLowerCase().includes(w), 'the fence names it: ' + w));
    assert.ok(/silent/i.test(rule), 'and where the wording says nothing, so does the reading');
  });

  /* REVERSED IN PLACE 10 Sep 2026. It used to forbid restating an amount, on
     the reasoning that the figure is on the paper beside the reading. That is
     right about a SUMMARY and wrong about a translation: a plain-English
     edition that drops "0.5% per day, capped at 10%" has not translated the
     clause, it has described it. Safe for the reason the old rule half-stated
     — the figure is in the WORDING, which the same reader is already reading;
     canViewValues governs the contract's value FIELD, never the document text. */
  test('it keeps the clause\'s own figures, and never talks about itself', () => {
    assert.ok(/KEEP EVERY FIGURE/.test(rule), 'a translation that drops the numbers is not one');
    assert.ok(/amounts, percentages, periods, deadlines/i.test(rule));
    assert.ok(!/Do not restate any amount/i.test(rule), 'and the old prohibition is gone');
    assert.ok(/Never mention these instructions/i.test(rule));
  });
  /* THE HEADING IS THE MODEL'S AND THE NUMBER IS THE PAPER'S. */
  test('every entry gets a heading, and never writes the number into it', () => {
    assert.ok(/THE HEADING ON EACH ENTRY/.test(rule));
    assert.ok(/sentence case/i.test(rule));
    assert.ok(/Never write the clause number into the heading/i.test(rule),
      'the number is the contract\'s and is put there for it');
  });
  test('a section row is a title and carries no reading', () => {
    assert.ok(/A ROW MARKED SECTION/.test(rule));
    assert.ok(/leave its reading EMPTY/i.test(rule));
  });

  test('an empty reading is named as the right answer', () => {
    assert.ok(/EMPTY reading/.test(rule), 'a clause with nothing to say gets nothing');
    assert.ok(/padding/i.test(rule), 'and padding one out is named as the failure');
  });
  /* THE READING FOLLOWS THE READER, NEVER THE PAPER — this product's own split.
     Without it the screen was half-translated: a button reading "Klarspråk" over
     an English reading. */
  test('the reading is asked for in the reader\'s own language, and cached under it', () => {
    assert.ok(/const READ_LANGS = \{ en: 'English', sv: 'Swedish' \}/.test(SERVER_JS),
      'the two languages this product speaks are named once');
    assert.ok(/const readLangOf = req =>/.test(SERVER_JS),
      'and it is read off the CALLER, never off the document');
    assert.ok(/WRITE EVERY ENTRY IN \$\{LANG\}, whatever language the contract itself is written in/.test(SERVER_JS),
      'the prompt says so plainly — a model drifts to the language in front of it');
    assert.ok(/const inputHash = sha\(lang \+ '\\n' \+ sent\)/.test(SERVER_JS),
      'the language is IN the cache key, or a Swedish reader is served the English answer');
  });
});

/* ============================================================
   6. THE ROUTE, AGAINST A REAL SERVER
   ============================================================ */
describe('f277 (6) the route', () => {
  let h, ai, W;
  const CLAUSES = [
    { heading: '1. Supply and delivery', text: 'The Supplier shall deliver on the dates ordered.' },
    { heading: '2. Prices and payment', text: 'The Buyer shall pay within thirty (30) days.' },
    { heading: '3. Interpretation', text: 'Headings are for convenience only.' },
  ];
  const ANSWER = { readings: [
    { i: 0, plain: 'They deliver on the dates in each order you place.' },
    { i: 2, plain: '' },
    { i: 1, plain: 'You pay within 30 days of an invoice you are not disputing.' },
  ] };

  before(async () => {
    ai = await startScriptedAi();
    h = await startHati({ ANTHROPIC_BASE_URL: ai.base });
    W = await seedWorkspace(h, { contracts: [] });
    await W.admin.json('/api/contracts/MK-PE-1', { method: 'PUT', body: { baseVersion: 0, contract: {
      id: 'MK-PE-1', name: 'Supply agreement', counterparty: 'Nordkust', folder: FOLDER_A,
      status: 'Under Review', redlineText: BODY, fields: {}, obligations: [], audit: [],
      rounds: [], versions: [], signatures: [], comments: [], searchText: 'supply',
    } } });
  });
  after(async () => { await h.stop(); await ai.stop(); });

  test('it reads the clauses it is given and pairs each answer by its own number', async () => {
    ai.script(tu(ANSWER));
    const out = await W.admin.json('/api/ai/readings', { method: 'POST', body: { id: 'MK-PE-1', clauses: CLAUSES } });
    const items = out.readings.items;
    assert.equal(items.length, 2, 'the empty one is dropped rather than drawn blank');
    assert.equal(items[0].i, 0);
    assert.equal(items[0].heading, '1. Supply and delivery',
      'the heading comes from OUR list, never from the answer');
    const two = items.find(x => x.i === 1);
    assert.ok(two && /30 days/.test(two.plain),
      'an answer that arrived out of order still lands on its own clause');
  });

  test('an unchanged contract is paid for once', async () => {
    const before = ai.calls.length;
    const out = await W.admin.json('/api/ai/readings', { method: 'POST', body: { id: 'MK-PE-1', clauses: CLAUSES } });
    assert.equal(out.cached, true);
    assert.equal(ai.calls.length, before, 'and nothing was spent on the second reader');
  });

  test('moving a word re-reads it', async () => {
    ai.script(tu({ readings: [{ i: 0, plain: 'They deliver within two days now.' }] }));
    const moved = CLAUSES.map((x, i) => i === 0 ? { ...x, text: x.text + ' Delivery is within two days.' } : x);
    const out = await W.admin.json('/api/ai/readings', { method: 'POST', body: { id: 'MK-PE-1', clauses: moved } });
    assert.ok(!out.cached, 'a changed fingerprint is a changed reading');
  });

  test('an answer cut short is handed over and NOT kept', async () => {
    ai.script({ content: tu({ readings: [{ i: 0, plain: 'Half an answer.' }] }), stopReason: 'max_tokens' });
    const out = await W.admin.json('/api/ai/readings', { method: 'POST',
      body: { id: 'MK-PE-1', clauses: CLAUSES.slice(0, 2), force: true } });
    assert.equal(out.readings.truncated, true, 'the reader is told where they are looking');
    const c = await W.admin.json('/api/contracts/MK-PE-1');
    assert.ok(!(c._readings && c._readings.truncated),
      'and nothing half-finished was written to the table for every later read to inherit');
  });

  test('it rides the contract on the way out and is stripped on the way back', async () => {
    ai.script(tu(ANSWER));
    await W.admin.json('/api/ai/readings', { method: 'POST', body: { id: 'MK-PE-1', clauses: CLAUSES, force: true } });
    const c = await W.admin.json('/api/contracts/MK-PE-1');
    assert.ok(c._readings && c._readings.items.length, 'handed back with the contract');
    await W.admin.json('/api/contracts/MK-PE-1', { method: 'PUT',
      body: { baseVersion: c._v, contract: { ...c, name: 'Supply agreement (renamed)' } } });
    const raw = await W.admin.json('/api/contracts/MK-PE-1');
    assert.equal(raw.name, 'Supply agreement (renamed)', 'the save landed');
    assert.ok(!Object.prototype.hasOwnProperty.call(raw, 'readings'),
      'and the echo never became a field on the record');
  });

  test('a contract out of this reader’s scope reads as one that does not exist', async () => {
    /* The restricted member can see FOLDER_A only, so the wall is asked with a
       contract filed somewhere else — a 404 on paper they CAN see would prove
       nothing at all. */
    await W.admin.json('/api/contracts/MK-PE-2', { method: 'PUT', body: { baseVersion: 0, contract: {
      id: 'MK-PE-2', name: 'Out of their reach', counterparty: 'Nordkust', folder: FOLDER_B,
      status: 'Under Review', redlineText: BODY, fields: {}, obligations: [], audit: [],
      rounds: [], versions: [], signatures: [], comments: [], searchText: 'out',
    } } });
    const r = await W.restricted.raw('/api/ai/readings', { method: 'POST',
      body: { id: 'MK-PE-2', clauses: CLAUSES } });
    assert.equal(r.status, 404, 'out of scope reads exactly like does not exist');
  });

  test('nothing to read is refused in words rather than read as an empty contract', async () => {
    const r = await W.admin.raw('/api/ai/readings', { method: 'POST', body: { id: 'MK-PE-1', clauses: [] } });
    assert.equal(r.status, 400);
    assert.match(r.json.error, /no wording/i);
  });
});

/* ============================================================
   7. BOTH LANGUAGES
   ============================================================ */
describe('f277 (7) it speaks both languages', () => {
  test('every new key is written in English and in Swedish, and they differ', () => {
    const win = buildWorld({}).win;
    const keys = ['ct_read_contract', 'ct_read_plain', 'ct_read_plain_title', 'ct_read_reading',
      'ct_read_group', 'ct_read_cap', 'ct_read_nothing', 'ct_read_nothing_back', 'ct_read_failed',
      'ct_read_over_one', 'ct_read_over_other'];
    win.langSet('en',{repaint:false});
    const en = keys.map(k => win.i18t(k));
    win.langSet('sv',{repaint:false});
    const sv = keys.map(k => win.i18t(k));
    keys.forEach((k, i) => {
      assert.ok(en[i] && en[i] !== k, 'English is written: ' + k);
      assert.ok(sv[i] && sv[i] !== k, 'Swedish is written: ' + k);
      assert.notEqual(en[i], sv[i], 'and it is really translated: ' + k);
    });
    win.langSet('en',{repaint:false});
  });
});

/* ============================================================
   8. A CLAUSE-FOR-CLAUSE EDITION — Young reported it 10 Sep 2026
   ============================================================
   "the plain english should match the font size in the contract side. Also,
   Plain english should be structured in the sense that is translates the
   contracts into plain english and not just summarizing. If there clause 1.1
   in the contract then there should be a traslated clause 1.1 in plain
   english."

   THE CAUSE WAS THE SEGMENTATION, not the prompt. The walk took HEADINGS and
   nothing else, and on real commercial paper the headings are the SECTION
   titles while 1.1, 1.2 and 1.3 are bold lead-ins inside ordinary paragraphs.
   So the whole of section 1 arrived as one row and could only come back as one
   note. The paper below is the shape Young's own supply agreement is in. */
describe('f277 (8) a numbered clause is a row of its own', () => {
  let win;
  before(() => { win = buildWorld({ contractView: true }).win; win.innerWidth = 1440; });

  const PAPER = [
    '<h1>Raw Materials Supply Agreement</h1>',
    '<p>Between Highland Corporate Ltd and Nordkust Industri AB.</p>',
    '<h2>1. Scope of supply &amp; purchase orders</h2>',
    '<p><strong>1.1 Master Agreement Structure.</strong> This Agreement establishes the legal and commercial framework under which Buyer may purchase raw materials.</p>',
    '<p><strong>1.2 Issuance of Purchase Orders.</strong> Supplier shall confirm acceptance of each PO in writing within two (2) business days of receipt.</p>',
    '<p><strong>1.3 Precedence.</strong> In the event of any conflict the terms of this Agreement shall strictly prevail.</p>',
    '<h2>3. Delivery, title &amp; risk of loss</h2>',
    '<p><strong>3.1 Delivery Terms.</strong> All deliveries shall be made DDP to the destination facility.</p>',
  ].join('');
  const C = { id: 'MK-1', name: 'Raw Materials Supply Agreement', changes: [], audit: [] };

  test('the reported fault: a section of three clauses is not one row', () => {
    sheet(win, PAPER);
    const rows = win.docReadClauses(C);
    assert.equal(rows.length, 6,
      'two section titles and four numbered clauses — against the old walk this was 2');
    assert.deepEqual(Array.from(rows, r => r.num),
      ['', '1.1', '1.2', '1.3', '', '3.1'],
      'and every clause carries its own number, in document order');
    assert.deepEqual(Array.from(rows, r => r.kind),
      ['section', 'clause', 'clause', 'clause', 'section', 'clause']);
  });

  test("a clause's heading is its own bold lead-in, not the whole paragraph", () => {
    sheet(win, PAPER);
    const rows = win.docReadClauses(C);
    assert.equal(rows[1].heading, '1.1 Master Agreement Structure.',
      'what the drafter wrote as its name');
    assert.ok(!/framework/.test(rows[1].heading), 'and not the clause it leads');
  });

  test("a clause's wording includes its own lead-in, and stops at the next clause", () => {
    sheet(win, PAPER);
    const rows = win.docReadClauses(C);
    assert.ok(/1\.2 Issuance/.test(rows[2].text), 'the lead-in is part of the clause');
    assert.ok(/two \(2\) business days/.test(rows[2].text));
    assert.ok(!/Precedence/.test(rows[2].text), 'and it does not carry its neighbour');
  });

  test('a section title does not swallow the clauses beneath it', () => {
    sheet(win, PAPER);
    const rows = win.docReadClauses(C);
    assert.ok(!/Master Agreement Structure/.test(rows[0].text),
      'the wording belongs to 1.1, which now has a row to put it in');
  });

  /* IT ONLY EVER ADDS ANCHORS — which is what makes it safe on paper nobody
     has seen. A document with no numbered paragraphs walks exactly as it did. */
  test('CONTROL: paper with no numbered clauses walks exactly as before', () => {
    sheet(win, BODY);
    const rows = win.docReadClauses({ id: 'MK-1', name: 'Supply', changes: [], audit: [] });
    /* A CONTROL, so it asserts only what was true BEFORE this change as well —
       the same rows, in the same order, with the same wording. It passes
       either way, and its job is to fail the day the finer walk starts
       changing paper it has no business changing. */
    assert.deepEqual(Array.from(rows, x => x.heading),
      ['Raw Materials Supply Agreement', '1. Supply and delivery', '2. Prices and payment', '3. Interpretation']);
    assert.ok(/thirty \(30\) days/.test(rows[2].text));
    assert.ok(!/thirty \(30\) days/.test(rows[1].text));
  });

  test('and every row on that paper is a section', () => {
    sheet(win, BODY);
    const rows = win.docReadClauses({ id: 'MK-1', name: 'Supply', changes: [], audit: [] });
    assert.ok(rows.every(r => r.kind === 'section'), 'nothing there is a numbered clause');
  });

  test('a bare "1." is not a sub-clause — a dot is required', () => {
    sheet(win, '<h2>Terms</h2><p>1. This is a list item, or a sentence opening with a figure.</p>');
    const rows = win.docReadClauses({ id: 'MK-1', name: 'x', changes: [], audit: [] });
    assert.equal(rows.length, 1, 'only the heading');
  });

  test('a wrapper around the numbered paragraph is not the clause', () => {
    sheet(win, '<h2>1. Scope</h2><div><p><strong>1.1 Structure.</strong> Wording here.</p></div>');
    /* docReadSheet, not docReadClauses — the element is what this claim is
       about, and the route deliberately never sees one. */
    const rows = win.docReadSheet({ id: 'MK-1', name: 'x', changes: [], audit: [] });
    assert.equal(rows.length, 2, 'the paragraph inside it, never the div as well');
    assert.equal(rows[1].num, '1.1');
    assert.equal(rows[1].el.tagName, 'P', 'and the anchor is the paragraph itself');
  });

  /* A SECTION TITLE CARRIES NO WORDING BY DESIGN, so it is the one row that
     may stand on a heading alone. A CLAUSE with only a heading would draw a
     title over nothing. */
  test('a section stands on its heading alone; a clause may not', () => {
    sheet(win, PAPER);
    const pairs = win.docReadAnchors(C, [
      { i: 0, heading: '1. Scope of supply & purchase orders', head: 'What you are buying', plain: '' },
      { i: 1, heading: '1.1 Master Agreement Structure.', head: 'How this agreement works', plain: '' },
      { i: 2, heading: '1.2 Issuance of Purchase Orders.', head: 'Placing an order', plain: 'You send a written order.' },
    ]);
    assert.deepEqual(Array.from(pairs, p => p.it.i), [0, 2],
      'the section keeps its title, the empty clause draws nothing');
  });
});

/* ============================================================
   9. THE READING FOLLOWS THE WORDING
   ============================================================
   "when the contract in the document changes or is redlined and you click on
   plain english it should update the translation accordingly with the new
   changes" — Young, 10 Sep 2026. The press ran the route only where there was
   NO reading at all, so a redlined clause went on showing the reading of the
   wording it replaced. */
describe('f277 (9) a redlined clause is read again', () => {
  let win;
  before(() => { win = buildWorld({ contractView: true }).win; win.innerWidth = 1440; });
  const C = { id: 'MK-1', name: 'Supply', changes: [], audit: [] };

  test('the signature is stable while the wording is', () => {
    sheet(win, BODY);
    const a = win.docReadSig(C);
    sheet(win, BODY);
    assert.equal(win.docReadSig(C), a, 'a repaint of the same paper asks nothing');
    assert.ok(a, 'and it is not empty on a real sheet');
  });

  test('it moves the moment a clause is redlined', () => {
    sheet(win, BODY);
    const before = win.docReadSig(C);
    sheet(win, BODY.replace('thirty (30) days', 'forty-five (45) days'));
    assert.notEqual(win.docReadSig(C), before, 'the reading of that clause is now wrong');
  });

  test('it moves when a clause is added or taken out', () => {
    sheet(win, BODY);
    const before = win.docReadSig(C);
    sheet(win, BODY + '<h2>4. Governing law</h2><p>Kenyan law.</p>');
    assert.notEqual(win.docReadSig(C), before);
  });

  test('an empty sheet has no signature', () => {
    sheet(win, '');
    assert.equal(win.docReadSig(C), '');
  });

  /* THE PRESS IS WHERE IT IS ASKED, and the stamp is taken from the walk that
     was SENT rather than read back after the await — the paper can be
     repainted while the request is in flight. */
  test('the press asks when the paper has moved, and the stamp is the sent walk', () => {
    assert.ok(/if\(!docReadItems\(c\)\.length\|\|c\._readSig!==sig\)/.test(CONTRACT_JS),
      'nothing yet, or the wording has moved since the reading we hold');
    const run = CONTRACT_JS.slice(CONTRACT_JS.indexOf('async function docReadRun'));
    const body = run.slice(0, run.indexOf('\nfunction '));
    assert.ok(body.indexOf('const sig=docReadSig(c);') < body.indexOf('await api('),
      'taken BEFORE the await');
    assert.ok(/c\._readSig=sig;/.test(body), 'and stamped only on a reading that arrived');
  });
});

/* ============================================================
   10. A WHITE SHEET, AT THE CONTRACT'S OWN SIZE
   ============================================================ */
describe('f277 (10) the edition is a facing page', () => {
  /* "Let the plain english also sit in a white card and not the grey
     background" — Young, 10 Sep 2026. */
  test('the layer is a white sheet, not notes on the page ground', () => {
    const at = INDEX.indexOf('#doc-read{');
    const css = INDEX.slice(at, INDEX.indexOf('.doc-read-head{', at));
    assert.ok(/background:var\(--color-surface\)/.test(css), 'the surface token, so dark follows');
    assert.ok(/border:1px solid var\(--color-divider\)/.test(css));
  });

  /* SET AT THE SIZE THE CONTRACT IS SET AT, and MEASURED rather than computed
     from a token: --doc-scale is written on the paper's own zoom wrapper in
     the other column and never reaches this one, and a document style can
     multiply the size again on top of it. */
  test('the reading takes its size from the paper itself', () => {
    const at = INDEX.indexOf('.doc-read-note{');
    const css = INDEX.slice(at, INDEX.indexOf('.doc-read-over{', at));
    assert.ok(/font-size:var\(--dr-size,var\(--t-body\)\)/.test(css),
      'a measured value, with the body rung as the fallback');
    assert.ok(!/var\(--t-meta\)/.test(css), 'and it is no longer a size smaller than the contract');
    assert.ok(/getComputedStyle\(paper\)\.fontSize/.test(CONTRACT_JS),
      'measured off the sheet on every paint');
    assert.ok(/layer\.style\.setProperty\('--dr-size',px\)/.test(CONTRACT_JS));
  });

  test('an entry is drawn as a document: the number, a heading, the reading', () => {
    assert.ok(/class="dr-n"/.test(CONTRACT_JS), 'the clause number');
    assert.ok(/class="\$\{sec\?'dr-s':'dr-h'\}"/.test(CONTRACT_JS), 'a heading of its own');
    assert.ok(/p\.it\.num\|\|p\.row\.num/.test(CONTRACT_JS),
      'and the number is the PAPER\'s, read off the sheet, never asked of the model');
  });

  /* LEVEL WITH ITS OWN CLAUSE is what makes this a parallel reading; stepping
     down is what keeps that promise honest when it cannot be kept exactly. */
  test('an entry steps down rather than overlapping the one above', () => {
    const at = CONTRACT_JS.indexOf('let floor=0, bottom=0;');
    assert.ok(at > 0, 'the stepping exists');
    const css = CONTRACT_JS.slice(at, at + 400);
    assert.ok(/if\(top<floor\) top=floor;/.test(css));
    assert.ok(/floor=top\+el\.offsetHeight\+DOC_READ_GAP;/.test(css));
  });
});

/* ============================================================
   11. ONE CONTROL ROW, TWO PAGES
   ============================================================
   "the buttons at the bottom should be shorter and have the same height as the
   buttons above them ... also not in bold like the ones above ... Only the
   shaded buttons should bold." Young, 10 Sep 2026, of the Document tab's slot
   and of the negotiation page's control row. */
describe('f277 (11) the control row reads as one row with the acts above it', () => {
  const NEGO_CSS = SRC('js/views/negotiation-css.js');

  /* THE CLAIM IS A RELATION, NOT A NUMBER — .ui-btn-lg is what the row above
     is, so both sides are read and compared. A later retune moves them
     together and costs this no edit. */
  test('the head row above is the rung everything is measured against', () => {
    const lg = INDEX.slice(INDEX.indexOf('.ui-btn-lg{'), INDEX.indexOf('.ui-btn-lg{') + 200);
    assert.ok(/min-height:var\(--ctl-h\)/.test(lg));
    assert.ok(/font-size:var\(--t-body\)/.test(lg));
    assert.ok(/font-weight:var\(--w-body\)/.test(lg), 'and it is not bold');
  });

  test('the Document tab slot takes that rung, size and weight', () => {
    const at = INDEX.indexOf('#ws-tabrow-end .ui-btn{');
    const css = INDEX.slice(at, INDEX.indexOf('.doc-read-seg button:disabled', at));
    assert.ok(/#ws-tabrow-end \.ui-btn\{ min-height:var\(--ctl-h\);/.test(css),
      'the head row\'s rung, not --ctl-h-lg');
    assert.ok(/#ws-tabrow-end \.rl-type-step\{ height:var\(--ctl-h\)/.test(css));
    assert.ok(!/--ctl-h-lg/.test(css), 'and nothing in the slot is on the taller rung any more');
    assert.ok(/\.doc-read-seg\{[^}]*height:var\(--ctl-h\)/.test(css));
    assert.ok(/font-size:var\(--t-body\);\s*\n?\s*font-weight:var\(--w-body\)/.test(css),
      'the seg reads at the body rung, unbold');
  });

  test('only the shaded half is bold', () => {
    const at = INDEX.indexOf('.doc-read-seg button[aria-pressed="true"]');
    const css = INDEX.slice(at, at + 220);
    assert.ok(/font-weight:var\(--w-title\)/.test(css));
  });

  test('the negotiation control row takes the same rung, scoped to its own group', () => {
    const at = NEGO_CSS.indexOf('.redline-page .rl-head .rl-type-step{');
    assert.ok(at > 0, 'the block exists');
    const css = NEGO_CSS.slice(at, at + 900);
    assert.ok(/\.rl-head \.rl-type-step\{height:var\(--ctl-h\)/.test(css));
    assert.ok(/\.rl-head \.rl-segwrap:not\(\.rl-readwrap\)\{height:var\(--ctl-h\)\}/.test(css));
    assert.ok(/\.rl-head \.rl-livelist\{font-size:var\(--t-body\);font-weight:var\(--w-body\)\}/.test(css));
    assert.ok(/\.rl-head \.rl-needs\{font-size:var\(--t-body\)\}/.test(css),
      'every control the row draws, not only the four in the screenshot');
    assert.ok(/\.rl-seg\.on\{font-weight:var\(--w-title\)\}/.test(css), 'and only the shaded one is bold');
  });

  /* THE READING TABS ARE NOT IN THE ASK and share .rl-segwrap with the seat
     switch. They are excluded twice: they sit outside .rl-head, and the
     selector says so as well. */
  test('the reading tabs and the counterparty header are untouched', () => {
    const at = NEGO_CSS.indexOf('.redline-page .rl-head .rl-type-step{');
    const css = NEGO_CSS.slice(at, at + 900);
    (css.match(/\.rl-segwrap[^{,]*/g) || []).forEach(sel =>
      assert.ok(/:not\(\.rl-readwrap\)/.test(sel), 'every segwrap rule excludes the reading switch: ' + sel));
    assert.ok(css.split('\n').filter(l => /^\s*\./.test(l))
      .every(l => /^\s*\.redline-page \.rl-head /.test(l)),
      'and every rule in the block is scoped to the group that was ringed');
  });
});

/* ============================================================
   12. THE OTHER SHAPE OF PAPER — Young reported it 10 Sep 2026
   ============================================================
   "the contract view and plain english buttons are missing."

   Reported as an arrival — "sometimes when i click on a contract from a
   different page" — and it is nothing to do with the route. MEASURED on four
   arrivals: from the dashboard, from the register, from the calendar and
   straight to the tab, the switch behaved identically every time. What
   differs is the CONTRACT.

   A contract drawn from PLAIN TEXT — every received document, and every
   working text a negotiation has stored, which is what Young's own screenshot
   shows — is laid out by documentTextHtml. It paints a heading as a styled
   <div> and a clause number as a styled <span>: there is not one <h*> on the
   sheet. So the walk found nothing, the switch stood down, and the reader was
   offered nothing at all on the paper a plain-English reading is worth most
   on. MEASURED against the parent: 0 rows.

   THE BUILDER NOW NAMES WHAT IT ALREADY DECIDED — it asked docLineKind and
   then threw the answer away — and the walk reads those two names beside the
   <h*> it already knew. ONE WALK, BOTH SHAPES.

   THE PAPER IS BUILT BY THE REAL BUILDER HERE, never hand-written: a block
   that types out the shape the product produces passes on the commit before
   the product could produce it. */
describe('f277 (12) the walk reads the plain-text sheet too', () => {
  let win;
  before(() => { win = buildWorld({ contractView: true }).win; win.innerWidth = 1440; });

  const TEXT = [
    'EQUIPMENT LEASE & MAINTENANCE',
    '',
    'This agreement is made between Kwetu and Juno Limited.',
    '',
    '1. DEFINITIONS AND INTERPRETATION',
    '',
    '1.1 Master Agreement Structure. This agreement sets out the terms on which equipment is leased.',
    '1.2 Order Forms. Each order form is incorporated into this agreement by reference.',
    '',
    '2. LEASE CHARGES',
    '',
    '2.1 The Lessee shall pay the charges monthly in advance, exclusive of VAT.',
    '2.2 Late payment attracts interest at 1.5% per month on the outstanding sum.',
  ].join('\n');
  const C = { id: 'MK-1', name: 'Equipment Lease & Maintenance — Juno Limited', changes: [], audit: [] };
  const paint = () => sheet(win, win.documentTextHtml(TEXT));

  test('the builder marks its own two decisions and nothing else', () => {
    const html = win.documentTextHtml(TEXT);
    assert.ok(/class="doc-t-h"/.test(html), 'a heading it decided is a heading says so');
    assert.ok(/class="doc-t-n"/.test(html), 'and a clause number it decided is a number says so');
    /* A NAME, NOT A RESTRUCTURING. Nothing moves, so the five other callers of
       this builder render as they did and simply carry an inert class. */
    const plain = html.replace(/ class="doc-t-[hn]"/g, '');
    assert.equal(plain, win.documentTextHtml(TEXT).replace(/ class="doc-t-[hn]"/g, ''),
      'strip the two names and the markup is what it always was');
  });

  test('the reported fault: this paper had no switch at all', () => {
    paint();
    const rows = win.docReadClauses(C);
    assert.ok(rows.length >= 7,
      `against the parent this was 0, so docReadSwitchHtml drew nothing — got ${rows.length}`);
    assert.notEqual(win.docReadSwitchHtml(C), '', 'and the switch is drawn');
  });

  test('a section is a section and a numbered clause is a row of its own', () => {
    paint();
    const rows = win.docReadClauses(C);
    assert.deepEqual(Array.from(rows, r => r.num),
      ['', '', '1.1', '1.2', '', '2.1', '2.2'],
      'every clause carries the number the paper gives it, in document order');
    assert.deepEqual(Array.from(rows, r => r.kind),
      ['section', 'section', 'clause', 'clause', 'section', 'clause', 'clause']);
  });

  test("a clause's wording runs to the next clause and no further", () => {
    paint();
    const rows = win.docReadClauses(C);
    const c11 = rows.find(r => r.num === '1.1');
    assert.ok(/equipment is leased/.test(c11.text), 'it carries its own wording');
    assert.ok(!/Order Forms/.test(c11.text), 'and not its neighbour');
    assert.ok(!/^1\.1/.test(c11.text.trim()),
      'the number is the anchor, so it is not repeated inside the wording');
  });

  test("a marked clause's heading is the lead-in that follows the number", () => {
    paint();
    const rows = win.docReadClauses(C);
    assert.ok(/^Master Agreement Structure/.test(rows.find(r => r.num === '1.1').heading),
      'what the drafter wrote as its name');
  });

  test('a section title does not swallow the clauses beneath it', () => {
    paint();
    const rows = win.docReadClauses(C);
    const sec = rows.find(r => /DEFINITIONS/.test(r.heading));
    assert.ok(!/Master Agreement Structure/.test(sec.text),
      'the wording belongs to 1.1, which now has a row to put it in');
  });

  /* THE CONTRACT'S OWN NAME IS NOT A CLAUSE, and that rule has to reach this
     shape of paper too — it was written for an <h*> and the first heading here
     is a marked div. */
  test("the contract's own name is stepped over on this paper as well", () => {
    sheet(win, win.documentTextHtml(['EQUIPMENT LEASE & MAINTENANCE', '', '1.1 It runs for a year.'].join('\n')));
    const rows = win.docReadClauses({ id: 'MK-1', name: 'Equipment Lease & Maintenance', changes: [], audit: [] });
    assert.ok(rows.length, 'the clause under it is found — or this proves nothing');
    assert.ok(!rows.some(r => /EQUIPMENT LEASE/i.test(r.heading)),
      'the paper naming itself is front matter, whichever shape it is drawn in');
  });

  /* IT ONLY EVER ADDS ANCHORS. The rich sheet is what every claim above this
     section reads, and it must walk byte for byte as it did — this is the
     CONTROL and it passes before and after. */
  test('CONTROL: the rich sheet is untouched by any of it', () => {
    sheet(win, [
      '<h1>Raw Materials Supply Agreement</h1>',
      '<h2>1. Scope</h2>',
      '<p><strong>1.1 Structure.</strong> This Agreement establishes the framework.</p>',
      '<p><strong>1.2 Orders.</strong> Supplier shall confirm each PO in writing.</p>',
    ].join(''));
    const rows = win.docReadClauses({ id: 'MK-1', name: 'Raw Materials Supply Agreement', changes: [], audit: [] });
    assert.deepEqual(Array.from(rows, r => r.num), ['', '1.1', '1.2']);
    assert.deepEqual(Array.from(rows, r => r.kind), ['section', 'clause', 'clause']);
  });

  /* ONE READING OF "THE FIRST FEW WORDS", or the two shapes of paper would
     name the same clause differently. */
  test('one reading of the lead words, read by both shapes', () => {
    const SRC = require('node:fs').readFileSync(
      require('node:path').join(__dirname, '..', 'js', 'views', 'contract.js'), 'utf8');
    assert.equal((SRC.match(/const _docReadWords\s*=/g) || []).length, 1,
      'declared once');
    assert.ok(/_docReadWords\(t\)/.test(SRC) && /_docReadWords\(after\)/.test(SRC),
      'and asked by the paragraph anchor and by the mark alike');
  });
});

/* ============================================================
   F277 (13) — THE CLAUSE NUMBER APPEARS ON A READING (Job 3)
   ============================================================
   docReadPaint has always drawn the clause's number, and on real paper it drew
   nothing. Two reasons, and they compound:

     1. docReadSheet sets `num = head ? '' : _docReadNumOf(el)` — A HEADING ROW
        IS GIVEN NO NUMBER, UNCONDITIONALLY.
     2. _docReadNumOf requires a multi-part number (1.1, 3.2.1) and is only
        ever applied to non-heading rows anyway.

   So on any contract whose clause numbers live in its headings — which is most
   commercial paper, and every structured PDF since J-3.4 — every reading was
   drawn with no citation at all.

   THE CONTROLS COME FIRST, and they are the wall rather than the fix: what the
   route is SENT may not move by a byte, because its cache key is a hash of
   exactly that. Fill the sent field and every contract already read pays for a
   deep call that returns an identical reading. */
describe('f277 (13) a heading carries its own number', () => {
  let win;
  before(() => { win = buildWorld({ contractView: true }).win; win.innerWidth = 1440; });

  /* The shape the whole job is about: a numbered SECTION heading over numbered
     paragraph clauses — f277's own NUMBERED fixture, and the owner's screenshot. */
  const NUMBERED = [
    '<h2>1. Scope of supply and purchase orders</h2>',
    '<p><strong>1.1 Master Agreement Structure.</strong> This Agreement establishes the framework.</p>',
    '<p><strong>1.2 Issuance of Purchase Orders.</strong> Supplier shall confirm each order in writing.</p>',
    '<p><strong>1.3 Precedence.</strong> In the event of any conflict this Agreement prevails.</p>',
  ].join('');
  const C = { id: 'MK-A2', name: 'Supply Agreement — Juno Limited', changes: [], audit: [] };

  test('13a CONTROL — what the route is sent does not move by a byte', () => {
    /* The route's cache key is sha(lang + the document it was sent), and that
       document is built from num + heading + text. This claim is what keeps the
       job free: no re-read, no spend, and nothing already on file re-asked. */
    sheet(win, NUMBERED);
    const sent = win.docReadClauses(C);
    assert.equal(sent.length, 4, 'the walk itself moved');
    assert.equal(sent.map(r => r.num).join(','), ',1.1,1.2,1.3',
      'the SENT number changed — every contract already read would pay for a re-read');
    assert.deepEqual(Object.keys(sent[0]).sort(), ['heading', 'kind', 'num', 'text'],
      'a field leaked into what the route is sent: ' + Object.keys(sent[0]).join(','));
  });

  test('13b CONTROL — the reading signature is unchanged, so nothing is re-asked', () => {
    sheet(win, NUMBERED);
    /* docReadSig hashes the SENT rows. It is not the cache key — the route owns
       that — it is only how the press knows whether to ask at all. */
    const sig = win.docReadSig(C);
    assert.equal(sig, '4:' + sig.split(':')[1], 'the signature stopped counting the sent rows');
    assert.equal(win.docReadSig(C), sig, 'the signature is not stable across two reads');
  });

  test('13c CONTROL — a numbered paragraph keeps the number it always had', () => {
    sheet(win, NUMBERED);
    const rows = win.docReadSheet(C);
    const paras = rows.filter(r => r.kind === 'clause');
    assert.equal(paras.map(r => r.num).join(','), '1.1,1.2,1.3', 'the paragraph rule was loosened');
    assert.ok(paras.every(r => !r.cite),
      'a paragraph row grew a heading number — the two readings are not kept apart');
  });

  test('13d the rule refuses far more than it accepts', () => {
    /* INVENTING A NUMBER IS A WRONG CITATION printed beside the agreement,
       which is worse than a missing one. "2026 Annual Review Terms" must not
       become clause 2026, and a bare "1 Scope" is left alone on purpose. */
    for (const t of ['Definitions', '2026 Annual Review Terms', '1 Scope of supply',
                     '2026. Annual Review', 'Appendix A Fees', '']) {
      assert.equal(win._docReadHeadNum(t), '', `"${t}" was read as a numbered clause`);
    }
  });

  test('13e the section heading carries its own number — the fault', () => {
    sheet(win, NUMBERED);
    const rows = win.docReadSheet(C);
    const sec = rows.find(r => r.kind === 'section');
    assert.ok(sec, 'the section row is gone');
    assert.equal(sec.cite, '1',
      'the heading still carries no number — this is the reported screen');
  });

  test('13f a self-naming heading is read too, and the WORD is not captured', () => {
    /* Job 1 & 2's own reproduction case is "ARTICLE 2. Obligations of the first
       party", so leaving this out would ship two jobs that do not meet. Only
       the NUMBER is captured: if a later job prints a word before it, that word
       must come from the paper's own heading, or an article is cited as a
       clause. */
    assert.equal(win._docReadHeadNum('ARTICLE 2. Obligations of the first party'), '2');
    assert.equal(win._docReadHeadNum('Article 5 — Liability'), '5');
    assert.equal(win._docReadHeadNum('Schedule 1 — Fees'), '1');
    assert.equal(win._docReadHeadNum('Section 3. Confidentiality'), '3');
    assert.equal(win._docReadHeadNum('Clause 12) Termination'), '12');
    assert.equal(win._docReadHeadNum('1.1 Master Agreement Structure'), '1.1');
  });

  test('13g and the painter draws it, without printing it twice', () => {
    sheet(win, NUMBERED);
    const rows = win.docReadSheet(C);
    /* The model is told never to include the clause number in its heading, so
       the entry's own head is the plain title and the number is the paper's. */
    C._readings = { items: rows.map((r, i) => ({
      i, num: r.num, heading: r.heading, kind: r.kind,
      head: r.kind === 'section' ? 'Scope of supply' : 'What this covers',
      plain: 'A short plain reading of this clause for a business owner.' })) };
    const pairs = win.docReadAnchors(C, C._readings.items);
    assert.equal(pairs.length, 4, 'the pairing guard dropped an entry');
    const p = pairs[0];
    const num = String(p.it.num || p.row.num || p.row.cite || '').trim();
    assert.equal(num, '1', 'the painter\'s fallback does not reach the heading\'s number');
    assert.ok(!/^1\b/.test(p.it.head), 'the number is in the entry heading too — it would print twice');
  });
});

/* ---------------------------------------------------------------------------
   f277 (13) — THE HEADING IS THE DRAFTER'S OWN (Young ruled 10 Sep 2026)
   ---------------------------------------------------------------------------
   *"Dropping copilot headings makes sense."*

   The edition is a TRANSLATION of this contract, so its headings are this
   contract's. A model-written heading beside the drafter's own is a second name
   for one clause, and the two disagree the moment it is renamed.
   --------------------------------------------------------------------------- */
test('f277 (13) — the heading is the drafter’s own', async t => {
  const fs2 = require('node:fs');
  const path2 = require('node:path');
  const ROOT2 = path2.join(__dirname, '..');
  const rd = f => fs2.readFileSync(path2.join(ROOT2, f), 'utf8');

  await t.test('the model is no longer ASKED for one', () => {
    const srv = rd('server/server.js');
    const i = srv.indexOf("app.post('/api/ai/readings'");
    const route = srv.slice(i, srv.indexOf("app.post('/api/", i + 40));
    assert.doesNotMatch(route, /head: \{ type: 'string'/,
      'the schema field is gone rather than being asked for and ignored');
    assert.match(route, /required: \['i', 'plain'\]/);
    assert.match(route, /DO NOT WRITE HEADINGS/,
      'and the prompt says so, with the reason: a heading of the model’s would '
      + 'be a second name for one clause');
  });

  await t.test('a SECTION row survives without one', () => {
    /* It used to be kept only where the model had written a heading. With
       headings no longer asked for, that test would have dropped every section
       title out of the edition. */
    const srv = rd('server/server.js');
    assert.match(srv, /if \(!plain && list\[i\]\.kind !== 'section'\) return;/);
  });

  await t.test('nothing already read has to be paid for again', () => {
    /* The route's cache key is a hash of the DOCUMENT it was sent, not of the
       prompt — so dropping the field re-runs nothing, and a reading cached with
       a heading keeps it on the record and simply stops being drawn. */
    const srv = rd('server/server.js');
    const i = srv.indexOf("app.post('/api/ai/readings'");
    const route = srv.slice(i, srv.indexOf("app.post('/api/", i + 40));
    assert.match(route, /const inputHash = sha\(lang \+ '\\n' \+ sent\)/,
      'the key is the language and the wording, and neither moved');
  });

  await t.test('the painter draws the PAPER’S heading', () => {
    const src = rd('js/views/contract.js');
    /* THE REGION IS THE PAINTER, NOT A BYTE WINDOW. This sliced 900 characters
       back from `numHtml` — which is an ANCHOR, not a boundary — so the first
       comment written above that line pushed the claim out of its own window
       and the check failed on code that was perfectly correct. Both landmarks
       below are the painter's own first and last lines. */
    const i = src.indexOf("const sec=p.row.kind==='section'");
    const region = src.slice(i, src.indexOf('data-doc-read-note="', i));
    assert.ok(i > 0 && region.length > 0, 'the painter was found');
    assert.match(region, /const head=String\(p\.row\.ownHead\|\|''\)\.trim\(\)/,
      'the sheet’s own heading, not p.it.head');
    assert.doesNotMatch(region, /p\.it\.head/,
      'and the model’s is not drawn at all');
  });

  await t.test('the number and the name are cut ONCE', () => {
    /* They are printed in different places — the number as a citation in its
       own gutter, the name beside it — and cutting the string twice is how the
       same heading comes to be printed with its number and again without. */
    const src = rd('js/views/contract.js');
    assert.match(src, /const _docReadHeadCut=t=>/);
    assert.match(src, /const _docReadHeadNum=t=>_docReadHeadCut\(t\)\.num;/,
      'the older reading is now half of the one reading');
  });

  await t.test('the edition borrows the paper’s own step vocabulary', () => {
    const src = rd('js/views/contract.js');
    assert.match(src, /function docReadShape\(el\)\{[\s\S]{0,700}hati-lv-\(\[123\]\)/,
      'hati-lv-N — the same class the Word reader, the writing bar and the '
      + 'gutter walk all write');
    assert.match(src, /function docReadShape[\s\S]{0,700}rl-hang/);
    const css = rd('index.html');
    assert.match(css, /\.doc-read-note\.hati-lv-1\{ margin-left:2\.6em; \}/);
    assert.match(css, /\.doc-read-note\.dr-hang > \.dr-h[^{]*\{[^}]*text-indent:-2\.6em/);
  });

  await t.test('and the shape is read off the PAGE, never stored in the reading', () => {
    /* A reading is cached against the WORDING, and a clause can be indented
       without a word moving — so a stored shape would go stale under a reader
       while the paper in front of them said otherwise. */
    const src = rd('js/views/contract.js');
    const i = src.indexOf('function docReadShape');
    const fn = src.slice(i, src.indexOf('\n}', i));
    assert.doesNotMatch(fn, /_readings|it\.|readSig/,
      'it asks the DOM and nothing else');
  });
});

/* ---------------------------------------------------------------------------
   f277 (14) — A WORKING TEXT IS A DOCUMENT, AND ITS TOP IS SAID ONCE
   (Young reported it 10 Sep 2026, off two screenshots of one contract: "top of
   the contract is a mess ... does not resemble image 3 which is in the
   negotiate page and looks more structured. So plain english is not set like a
   contract and the main contract is unstructured unlike the negotiate page
   which is clean.")

   MEASURED on one contract, both surfaces, before a line was written. The
   NEGOTIATION lifts a plain body into a document — negoBodyOf calls
   negoRichFromLines, which is docRichFromText — so it draws real headings, real
   paragraphs and each marker in its own gutter. The DOCUMENT TAB threw the same
   lines into `white-space:pre-wrap` divs, and then printed a header above them
   carrying the RECORD's name, which the wording's own first lines were about to
   say again.

   THE FIX IS THE READING, NOT A SECOND RENDERER: the plain branch lifts through
   the SAME function the negotiation already uses and goes down the SAME
   renderDocHtml path the rich branch takes — which is what puts the gutter on.
   So the two pages cannot come to disagree about the document's shape, which is
   what was reported.

   WHAT THE BROWSER FILE ANSWERS INSTEAD: whether the paper really paints those
   headings, whether the top is said once as PIXELS, and whether the number sits
   beside the reading rather than above it — three geometries, and none of them
   is a claim this stage can make. plain-english-verify section 13.
   --------------------------------------------------------------------------- */
/* Read a source file — the same helper f277 (13) declares for its own block. */
const _f277rd = f => require('node:fs').readFileSync(
  require('node:path').join(__dirname, '..', f), 'utf8');

describe('f277 (14) a working text is a document', () => {
  let win;
  before(() => { win = buildWorld({ contractView: true }).win; win.innerWidth = 1440; });

  const TEXT = [
    'SUPPLY AGREEMENT',
    '',
    'This Agreement is made between Highland Corporate Ltd and Naivas Supermarkets.',
    '',
    '1. SCOPE OF SUPPLY',
    '',
    '1.1 Master Agreement Structure. This Agreement establishes the framework for purchases.',
    '',
    '2. CHARGES AND PAYMENT',
    '',
    '2.1 The Buyer shall pay each undisputed invoice within thirty (30) days of receipt.',
  ].join('\n');
  const C = () => ({ id: 'MK-1', name: 'Retail Supply — Coast', counterparty: 'Naivas Supermarkets',
    redlineText: TEXT, format: 'text', changes: [], audit: [] });

  test('ONE READING, BOTH SURFACES — the lift is the negotiation’s own', () => {
    /* Not "a lift that happens to agree today": the SAME function, so the two
       pages cannot come apart. */
    const src = _f277rd('js/views/contract.js');
    assert.match(src, /function docPlainToRich\(text\)\{[\s\S]{0,900}docRichFromText\(src\)/,
      'docPlainToRich lifts through docRichFromText');
    assert.match(src, /function docBodyHtml\(c, opts=\{\}\)\{[\s\S]{0,600}docPlainToRich\(/,
      'and the plain branch of docBodyHtml is what asks it');
    const neg = _f277rd('js/negotiation.js');
    assert.match(neg, /function negoBodyOf\(c\)\{[\s\S]{0,400}negoRichFromLines\(text\)/,
      'which is the reading the negotiation already runs on');
  });

  test('the reported fault: the same lines come out as a document', () => {
    const html = win.docBodyHtml(C(), { size: '13.5px', lh: '1.85' });
    assert.ok(/<h1[\s>]/.test(html), 'the document names itself');
    assert.ok((html.match(/<h2[\s>]/g) || []).length >= 2, 'and its clauses are headings');
    assert.ok(/class="rl-hang"/.test(html) && /class="rl-marker"/.test(html),
      'each numbered clause carries its marker in the gutter — the paper’s own vocabulary');
    /* THE FAULT, pinned as an absence: against the parent every one of these
       lines was a run inside one pre-wrap box. */
    assert.ok(!/pre-wrap/.test(html), 'and not one pre-wrap run survives');
  });

  test('IT LIFTS FOR THE SCREEN AND NEVER FOR THE RECORD', () => {
    /* docBodyHtml is a renderer. Nothing here may move the stored wording, or a
       fingerprint moves with it and every contract on file is accused of
       having changed. */
    const c = C();
    const before = c.redlineText;
    win.docBodyHtml(c, {});
    assert.equal(c.redlineText, before, 'the stored wording is untouched');
    assert.equal(c.format, 'text', 'and so is its format');
  });

  test('NO LIFT, NO CHANGE — the fallback is the old paper, never silence', () => {
    /* A stage without js/docx.js must get exactly the sheet it got before,
       rather than an empty one: the rlPaperFootHtml family, where a name that
       cannot be reached takes the else branch in silence. */
    const src = _f277rd('js/views/contract.js');
    const i = src.indexOf('function docBodyHtml(c, opts={})');
    const fn = src.slice(i, src.indexOf('\n}', i));
    assert.match(fn, /rich \? renderDocHtml[\s\S]{0,200}: documentTextHtml\(/,
      'no lift falls back to documentTextHtml');
    const keep = win.docRichFromText;
    try {
      win.docRichFromText = undefined;
      const html = win.docBodyHtml(C(), { size: '13.5px', lh: '1.85' });
      assert.ok(/pre-wrap/.test(html), 'and that really is the old builder');
    } finally { win.docRichFromText = keep; }
  });

  test('a ruled block keeps its columns', () => {
    /* documentTextHtml had one thing the lift does not: a run of ruled lines —
       a rate card, a two-column signature block — set in monospace with its
       spacing preserved. HTML collapses runs of spaces, so lifted alone the
       card becomes three sentences. */
    const RATE = ['SCHEDULE A', '',
      'Service                     Rate        Unit',
      'Collection                  1,200       per tonne',
      'Chilling                      450       per tonne'].join('\n');
    const html = win.docBodyHtml({ id: 'MK-2', name: 'Rate card', redlineText: RATE,
      format: 'text', changes: [], audit: [] }, {});
    assert.ok(/<pre/.test(html), 'the ruled run is set as a block that keeps its spacing');
    assert.ok(/Collection {2,}1,200/.test(html), 'and the columns really survive');
    const css = _f277rd('index.html');
    assert.match(css, /\.hati-doc pre\{[^}]*white-space:pre[^}]*\}/);
    assert.match(css, /\.hati-doc pre\{[^}]*overflow-x:auto/,
      'a wide card scrolls inside itself — the page never scrolls sideways');
  });

  test('ONE STRAY WIDE LINE IS A SENTENCE, not a table', () => {
    const ONE = ['1. SCOPE', '', 'The Supplier shall    deliver each consignment promptly.'].join('\n');
    const html = win.docBodyHtml({ id: 'MK-3', name: 'x', redlineText: ONE, format: 'text',
      changes: [], audit: [] }, {});
    assert.ok(!/<pre/.test(html), 'a single ruled-looking line is left as wording');
  });

  test('THE TOP IS SAID ONCE — no header above wording that already carries it', () => {
    /* A working text built from a template contract IS the paper's own front
       matter followed by its clauses: docPlainText writes that header out as
       text and the editor is seeded from it. A header above it is the same
       facts printed twice, which is what "the top is a mess" is. */
    const html = win.redlineDocBody(C());
    assert.ok(!/rl-paper-head/.test(html), 'redlineDocBody draws no paper head');
    assert.equal((html.match(/Retail Supply — Coast/g) || []).length, 0,
      'and the RECORD’s name is not printed over the document’s own title');
  });

  test('AND IT IS STILL DRAWN where the wording carries no top', () => {
    /* An AMENDMENT'S skeleton is four English paragraphs — the two recitals,
       the "amended as follows" line and the survival clause — with no title of
       its own. Standing the header down unconditionally left that draft with no
       name on its paper at all; amendment-journey-verify caught it. */
    const skeleton = ['The parties entered into the Supply Agreement dated 31 July 2026.',
      'The parties wish to amend it as set out below.',
      'The Agreement is amended as follows.',
      'All other terms remain in full force and effect.'].join('\n\n');
    const c = { id: 'MK-4', name: 'Amendment No. 1 — extended term',
      counterparty: 'Naivas Supermarkets', redlineText: skeleton, format: 'text',
      changes: [], audit: [] };
    const html = win.redlineDocBody(c);
    assert.ok(/rl-paper-head/.test(html), 'the header is drawn');
    assert.ok(/Amendment No\. 1/.test(html), 'and the draft has a name on its paper');
  });

  test('the name is matched on a BLOCK, never anywhere in the wording', () => {
    /* A contract whose NAME happens to appear in a recital must still get its
       header — the signal is the opening block BEING the name, not the name
       being mentioned. */
    const c = { id: 'MK-5', name: 'Retail Supply — Coast', counterparty: 'Naivas',
      redlineText: ['This deed varies the Retail Supply — Coast agreement in part.',
        'The parties agree as follows.'].join('\n\n'),
      format: 'text', changes: [], audit: [] };
    assert.ok(/rl-paper-head/.test(win.redlineDocBody(c)),
      'a mention inside a sentence is not the top of the paper');
  });
});

/* ---------------------------------------------------------------------------
   f277 (15) — THE HEADING PRINTED IS THE DRAFTER'S OWN, OR NOTHING
   (Young, the same report: "in plain english theres duplication of clause
   numbers and the numbers are above the clause as opposed to next to the
   clause like in the contract. it also does not have clause headers.")

   `_docReadLead` answers TWO questions and only one of them can take the
   eight-word fallback. As the pairing guard's READING and as what the route is
   sent, eight words is a fingerprint and is exactly right. As a name to PRINT
   it is a fragment of the clause's first sentence, cut mid-phrase — drawn as a
   heading it says what the reading under it is about to say; and where the
   drafter set only the NUMBER bold it is the number, printed a second time
   beside the one in the gutter.
   --------------------------------------------------------------------------- */
describe('f277 (15) the heading printed is the drafter’s own', () => {
  let win;
  before(() => { win = buildWorld({ contractView: true }).win; win.innerWidth = 1440; });

  const C = { id: 'MK-1', name: 'Supply', changes: [], audit: [] };
  const rows = html => { sheet(win, html); return win.docReadSheet(C); };

  test('a real bold lead-in is the name, with its number cut off once', () => {
    const r = rows('<div class="hati-doc"><h2>1. Scope</h2>'
      + '<p><strong>1.1 Master Agreement Structure.</strong> This sets out the framework.</p></div>');
    const cl = r.find(x => x.num === '1.1');
    assert.ok(cl, 'the clause is a row of its own');
    assert.equal(cl.ownHead, 'Master Agreement Structure.',
      'the drafter’s own name, without the number that is already in the gutter');
  });

  test('THE REPORTED DUPLICATION: a lead-in that is only a number prints no name', () => {
    /* What is left after the number is cut off a lead-in that was nothing but a
       number is the number again. Printed, that is the duplication. */
    const r = rows('<div class="hati-doc"><h2>1. Scope</h2>'
      + '<p><strong>1.1</strong> This Agreement establishes the framework for purchases.</p></div>');
    const cl = r.find(x => x.num === '1.1');
    assert.ok(cl, 'the clause is still a row');
    assert.equal(cl.ownHead, '', 'and it carries no heading rather than the number twice');
  });

  test('and a clause with no lead-in at all carries none', () => {
    /* Most commercial paper: the clause number runs straight into the wording.
       An eight-word fragment of that sentence is not a heading. */
    const r = rows('<div class="hati-doc"><h2>2. Charges</h2>'
      + '<p class="rl-hang"><span class="rl-marker">2.1 </span>The Buyer shall pay each undisputed '
      + 'invoice within thirty (30) days of receipt.</p></div>');
    const cl = r.find(x => x.num === '2.1');
    assert.ok(cl, 'the clause is a row of its own');
    assert.equal(cl.ownHead, '', 'no heading is invented out of its first words');
  });

  test('THE WALL: what the ROUTE is sent does not move by a byte', () => {
    /* The route's cache key is a hash of exactly what it was sent, so the
       eight-word reading stays exactly where it was — this changes what is
       PRINTED and nothing about what is asked. */
    const r = rows('<div class="hati-doc"><h2>2. Charges</h2>'
      + '<p class="rl-hang"><span class="rl-marker">2.1 </span>The Buyer shall pay each undisputed '
      + 'invoice within thirty (30) days of receipt.</p></div>');
    const cl = r.find(x => x.num === '2.1');
    assert.match(cl.heading, /^2\.1 The Buyer shall pay each undisputed/,
      'the reading is still the first few words, number included');
    const sent = win.docReadClauses(C).find(x => x.num === '2.1');
    assert.equal(sent.heading, cl.heading, 'and it is what docReadClauses hands over');
    assert.ok(!('ownHead' in sent), 'the name to print never travels — it is not asked about');
  });

  test('a section keeps its own name, cut from its own number', () => {
    const r = rows('<div class="hati-doc"><h2>3. Quality &amp; Rejection</h2>'
      + '<p>Consignments failing specification may be rejected.</p></div>');
    const sec = r.find(x => x.kind === 'section');
    assert.equal(sec.ownHead, 'Quality & Rejection');
    assert.equal(sec.cite, '3', 'and its number rides as the citation');
  });

  test('A NAME HAS A WORD IN IT', () => {
    const src = _f277rd('js/views/contract.js');
    assert.match(src, /const _docReadName=t=>\{[^}]*\[A-Za-zÀ-ÿ\]/,
      'a heading of nothing but digits and punctuation is the number again');
    assert.match(src, /const _docReadBoldLead=el=>\{/,
      'and the name to print is read by its own function');
    /* The eight-word fallback survives in _docReadLead, which is the READING. */
    assert.match(src, /const _docReadLead=el=>\{[\s\S]{0,300}_docReadWords\(t\)/);
  });
});

/* ---------------------------------------------------------------------------
   f277 (16) — THE NUMBER SITS BESIDE THE READING, NEVER ABOVE IT
   --------------------------------------------------------------------------- */
describe('f277 (16) the number sits beside the reading', () => {
  test('a clause with no heading puts its number in the reading’s own line', () => {
    const src = _f277rd('js/views/contract.js');
    const i = src.indexOf('const numHtml=num?');
    const region = src.slice(i, i + 1400);
    assert.match(region, /const lead=!head&&!!num&&!sec;/,
      'the state is named: a number, no heading of its own, not a section');
    assert.match(region, /<p\$\{lead\?' class="dr-lead"':''\}>\$\{lead\?numHtml:''\}/,
      'and the number is drawn INSIDE the reading’s paragraph');
    /* THE REPORTED FAULT, pinned as an absence: an <h4> holding nothing but
       the number, with the reading underneath it. */
    assert.ok(!/<h4 class="dr-h">\$\{numHtml\}<\/h4>/.test(region),
      'never a heading element holding only the number');
  });

  test('and the gutter is the paper’s own measure', () => {
    const css = _f277rd('index.html');
    assert.match(css, /\.doc-read-note > p\.dr-lead\{[^}]*padding-left:2\.6em[^}]*text-indent:-2\.6em/);
    assert.match(css, /\.doc-read-note > p\.dr-lead \.dr-n\{[^}]*min-width:2\.6em/,
      'the number sits in a gutter of exactly the width the contract uses');
    assert.match(css, /\.doc-read-note\.dr-hang > p:not\(\.dr-lead\)\{ padding-left:2\.6em; \}/,
      'and the two rules do not double up on one paragraph');
  });
});

/* ============================================================
   f277 (17) — THE NUMBER IS NOT WELDED TO THE NAME
   ============================================================
   Young reported it 10 Sep 2026, off the two columns side by side: the
   contract reading *"4. Independent Contractor"* and the edition reading
   *"4Independent Contractor"*.

   ONE CAUSE WITH TWO HALVES. The reading that cuts a number off a heading
   discards the drafter's punctuation — correctly, because it captures a
   CITATION and "4." and "4" cite the same clause — and nothing put it back for
   the one place the number is PRINTED. And the rule that would have separated
   them regardless gives the number a 2.6em box, which only fires where the
   clause hangs its marker in a gutter; this contract's headings, and most
   commercial paper's, do not.

   THE WALL IS THAT NEITHER HALF REACHES THE ROUTE. `num` is what
   docReadClauses SENDS, and /api/ai/readings hashes exactly what it was sent,
   so a separator folded into it would make every contract already read pay for
   one deep call returning an identical reading. 17d is that claim and it
   passes before and after — its job is to fail the day somebody folds the
   punctuation into the citation. */
describe('f277 (17) the number is not welded to the name', () => {
  const src = _f277rd('js/views/contract.js');

  test('the separator is the paper’s own, taken off the source', () => {
    assert.match(src, /const _docReadSepOf=\(src,num\)=>/,
      'one reading of "what followed the number", with two callers');
    const i = src.indexOf('const _docReadSepOf=');
    const fn = src.slice(i, i + 420);
    assert.match(fn, /indexOf\(n\)/, 'found in the string it was cut from');
    assert.match(fn, /\/\[\.\):\]\/\.test\(ch\)/,
      'and only the three a drafter uses — never a character invented here');
    assert.match(fn, /if\(!n\) return '';/,
      'no number, no separator');
  });

  test('the painter prints it beside the number', () => {
    const i = src.indexOf('const numHtml=num?');
    const line = src.slice(i, i + 160);
    assert.match(line, /esc\(num\+String\(p\.row\.sep\|\|''\)\)/,
      'the row’s separator, printed inside the citation span');
  });

  test('and the sheet carries it beside the number, never inside it', () => {
    assert.match(src, /out\.push\(\{el:row\.el,heading,ownHead,text,num:row\.num,cite,sep,/,
      'sep is its own field on the row');
    assert.match(src, /const sep=row\.isHead\?_docReadSepOf\(heading,cite\):String\(row\.sep\|\|''\);/,
      'a heading reads its own; a mark and a paragraph read theirs in the walk');
    assert.match(src, /return n\?\{el,isHead:false,isMark:true,num:n,sep:_docReadSepOf\(raw,n\)\}:null;/,
      'a mark IS its number, so the character after it is the whole of it');
  });

  /* THE WALL. Passes before and after; its job is to fail the day the
     punctuation is folded into the citation and every contract already read
     silently pays for a fresh deep call. */
  test('WALL — what the route is sent does not move by a byte', () => {
    assert.match(src,
      /const docReadClauses=c=>docReadSheet\(c\)\.map\(r=>\(\{num:r\.num,heading:r\.heading,text:r\.text,kind:r\.kind\}\)\);/,
      'the sent shape names num, heading, text and kind — and no separator');
    const i = src.indexOf('const _docReadHeadCut=');
    const cut = src.slice(i, i + 520);
    assert.match(cut, /return \{num,rest:src\.slice/,
      'the cut still answers a bare citation');
  });

  test('the gap is a guarantee, and the gutter takes it back', () => {
    const css = _f277rd('index.html');
    assert.match(css,
      /\.doc-read-note \.dr-h \.dr-n,\.doc-read-note \.dr-s \.dr-n\{ margin-right:\.4em; \}/,
      'a heading that carried no punctuation cannot weld either');
    assert.match(css,
      /\.doc-read-note\.dr-hang > \.dr-h \.dr-n,\.doc-read-note\.dr-hang > \.dr-s \.dr-n\{ margin-right:0; \}/,
      'and where the number sits in its own 2.6em box the margin is given back');
  });
});
