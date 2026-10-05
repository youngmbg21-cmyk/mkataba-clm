/* f511 — THE HONEST REPLY (work order "the board that answers right", Part 1,
   5 Oct 2026; the owner's screenshots: "Showing 10 of 181 · Top 10 by value ·
   as graph" beside a board of 178, a card named by Copilot's note)

     A. a card's name is HaTi's — the one asked for, a build's, or what it
        counts and how — never a title or a note Copilot offered unasked;
     B. Copilot's own sentence is printed only for a why / explain question;
        every other reply is HaTi's line, with the count;
     C. a set Copilot chose is named by HaTi (hbFoundTitle) and its reply is
        written from what the board draws (hbFoundSay);
     D. THE DISCONNECT CHECK: a sentence naming a count, a picture or a split
        the open chart does not show is left out, and the catch is recorded. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { read, strip, J, boardWorld, openKey, openPlan, text } = require('./board-world');

describe('F511 (A) — names come from HaTi', () => {
  test('an add_card title nobody asked for is not taken: the card says what it counts and how', () => {
    const w = boardWorld();
    w.hbBoardTakes({ actions: [{ do: 'add_card', which: { all: true }, recipe: { pic: 'ring', split: { by: 'status' }, title: 'as graph' }, title: 'Top 10 · as graph' }] }, 'add a ring of all contracts by stage');
    const p = w.hbS().panels.slice(-1)[0];
    assert.equal(p.title, 'All contracts · by stage');
    assert.ok(!J(p.recipe).title, 'no title rides in the recipe');
  });
  test('a name the person asked for is kept; so is a whole board\'s', () => {
    const w = boardWorld();
    w.hbBoardTakes({ actions: [{ do: 'add_card', which: { all: true }, recipe: { pic: 'ring', split: { by: 'status' } }, title: 'Board pack' }] }, 'a ring by stage called Board pack');
    assert.equal(w.hbS().panels.slice(-1)[0].title, 'Board pack');
    const w2 = boardWorld();
    w2.hbBoardTakes({ actions: [{ do: 'add_card', which: { all: true }, recipe: { pic: 'ring', split: { by: 'status' } }, title: 'Stages' }] }, 'build me a renewals dashboard');
    assert.equal(w2.hbS().panels.slice(-1)[0].title, 'Stages');
  });
  test('name_card is taken only when renaming was asked', () => {
    const w = boardWorld();
    w.hbBoardApply([{ do: 'add_card', which: { all: true }, recipe: { pic: 'ring', split: { by: 'status' } } }], 'add a ring by stage');
    const p = w.hbS().panels.slice(-1)[0], was = p.title;
    w.hbBoardApply([{ do: 'name_card', card: p.id, title: 'Sneaky' }], 'make it bigger');
    assert.equal(w.hbS().panels.slice(-1)[0].title, was);
    w.hbBoardApply([{ do: 'name_card', card: p.id, title: 'Pipeline' }], 'rename this card to Pipeline');
    assert.equal(w.hbS().panels.slice(-1)[0].title, 'Pipeline');
  });
  test('a chart-only answer for a new card is never named by its note', () => {
    const w = boardWorld();
    w.hbBoardTakes({ chart: { pic: 'cols', split: { by: 'date', unit: 'q', date: 'end' }, target: 'new' }, note: 'Top 10 · as graph' }, 'a new chart by quarter');
    assert.equal(w.hbS().panels.slice(-1)[0].title, 'All contracts · by quarter · end date');
  });
});

describe('F511 (B) — Copilot explains only when asked why', () => {
  test('a change to the open chart: HaTi\'s line and the count, not Copilot\'s sentence', () => {
    const w = boardWorld();
    w.hbAsk('contracts by stage');
    const said = text(w.hbBoardTakes({ chart: { pic: 'bars', split: { by: 'counterparty' }, target: 'open' }, answer: 'Now split by owner as a pie.' }, 'make it bars by counterparty'));
    assert.match(said, /^Changed the open chart, “.+”: now Bars · by counterparty · count\. \d+ contracts\.$/);
    assert.ok(!/owner|pie/.test(said), said);
  });
  test('a why question keeps Copilot\'s sentence, checked against the chart', () => {
    const w = boardWorld();
    w.hbAsk('contracts by stage');
    const said = text(w.hbBoardTakes({ chart: { pic: 'bars', target: 'open' }, answer: 'Most contracts are still being drafted. It is now shown as a pie chart.' }, 'why are most contracts in draft, show bars'));
    assert.match(said, /Most contracts are still being drafted\./);
    assert.ok(!/pie/.test(said), 'the sentence naming a picture the chart is not is left out');
  });
  test('a follow-up says the count of what is drawn', () => {
    const w = boardWorld();
    w.hbAsk('contracts by counterparty');
    const said = text(w.hbAsk('show them in graph'));
    const { D } = openPlan(w);
    assert.match(said, new RegExp('now Bars · by counterparty · count\\. ' + D.n + ' contracts\\.'));
  });
});

describe('F511 (C) — a set Copilot chose', () => {
  test('named by the asked name, HaTi\'s top label, the open card, or the person\'s words — never the note', () => {
    const w = boardWorld();
    assert.equal(w.hbFoundTitle('show me our largest deals', null), 'Show me our largest deals');
    assert.equal(w.hbFoundTitle('the big ones called Board pack', null), 'Board pack');
    assert.equal(w.hbFoundTitle('anything', 'Top 10 by value'), 'Top 10 by value');
    w.hbAsk('Juno contracts by stage');
    assert.equal(w.hbFoundTitle('show them in graph', null), w.hbCrumbOf(openKey(w), w.hbS().lens));
  });
  test('the reply is written from the board after the set is drawn', () => {
    const w = boardWorld();
    const ids = w.state.contracts.filter(c => c.status === 'Signed').slice(0, 10).map(c => c.id);
    w.hbShowFound(ids, w.hbFoundTitle('show me our largest deals', null), null);
    const said = text(w.hbFoundSay());
    assert.match(said, /^Show me our largest deals: 10 contracts, on the board\. Drawn as /);
    assert.ok(!/181|as graph/.test(said));
  });
  test('the panel names the set and rewrites the reply on the board (source)', () => {
    const src = strip(read('js/views/intelligence.js'));
    assert.match(src, /addLens\(\{ label:igBoardTitle\(q,res\)\|\|res\.note/);
    assert.match(src, /listTitle:igBoardTitle\(q,res\)\|\|/);
    assert.match(src, /if\(igBoardNow\(\)&&typeof window\.hbFoundSay==='function'\)\{ const say=hbFoundSay\(\); if\(say\)\{ m\.text=say;/);
    assert.match(src, /if\(igBoardNow\(\)\) intel\.lenses=\(intel\.lenses\|\|\[\]\)\.filter\(l=>l\.hb\|\|l\.action!=='filter'\);/, 'a typed question on the board starts afresh');
    assert.match(src, /hbBoardTakesChecked\(res,retry,q\)/);
  });
});

describe('F511 (D) — the disconnect check', () => {
  test('a count, a picture or a split the open chart does not show is left out, and recorded', () => {
    const w = boardWorld();
    const got = [];
    w.hbFeedbackSend = r => { got.push(r); return r; };
    w.eval('hbFeedbackSend = window.hbFeedbackSend');
    w.hbAsk('contracts by stage');
    const { D } = openPlan(w);
    const r = w.hbProseChecked(`Most are drafts. There are 181 contracts in total. It is shown as a bar chart. It is split by counterparty now. ${D.n} contracts are on the chart.`);
    assert.equal(r.text, `Most are drafts. ${D.n} contracts are on the chart.`);
    assert.equal(r.dropped, 3);
    assert.equal(got.length, 1); assert.equal(got[0].kind, 'disconnect');
  });
  test('a sentence that agrees is kept whole', () => {
    const w = boardWorld();
    w.hbAsk('contracts by stage as a pie');
    const r = w.hbProseChecked('It is drawn as a pie. It is split by stage.');
    assert.equal(r.dropped, 0); assert.equal(r.text, 'It is drawn as a pie. It is split by stage.');
  });
});
