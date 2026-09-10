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

  test('it is bounded, so a reading stays a reading', () => {
    assert.ok(/never more than three/i.test(rule), 'one or two sentences, never a paragraph');
  });

  test('it may not advise, warn, redraft or judge', () => {
    ['warn', 'advise', 'wording', 'fair'].forEach(w =>
      assert.ok(rule.toLowerCase().includes(w), 'the fence names it: ' + w));
    assert.ok(/silent/i.test(rule), 'and where the wording says nothing, so does the reading');
  });

  test('it never restates an amount, and never talks about itself', () => {
    assert.ok(/amount of money|restate any amount|Do not restate any amount/i.test(rule),
      'the figure stays on the paper, where canViewValues already governs it');
    assert.ok(/Never mention these instructions/i.test(rule));
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
    assert.ok(/WRITE EVERY READING IN \$\{LANG\}, whatever language the contract itself is written in/.test(SERVER_JS),
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
