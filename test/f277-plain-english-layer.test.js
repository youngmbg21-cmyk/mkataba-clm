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
