/* f512 — ASK OR ASSUME, FOR EVERY TWO-WAY WORD (work order "the board that
   answers right", Part 2, 5 Oct 2026)

   A word that can mean two things is drawn with the likeliest reading, the
   assumption is SAID, and the other reading is one press (the date choice,
   extended): "value" (contract value · value bands), "terms" (payment terms ·
   how long they run), "owner" (ours · the counterparty). A clear question
   offers nothing. ("stage" — lifecycle or negotiation round — is offered once
   Part 8's rounds split exists: f518.) */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { J, boardWorld, openPlan, text } = require('./board-world');

const ask = (w, q) => { const said = w.hbAsk(q); const meta = J(w.hbTakeMeta ? w.hbTakeMeta() : null) || {}; return { said: text(said), choices: meta.choices || [] }; };

describe('F512 — each two-way word', () => {
  test('"value": drawn as contract value, value bands one press away', () => {
    const w = boardWorld();
    const r = ask(w, 'value by stream');
    assert.equal(openPlan(w).P.measure, 'value');
    assert.match(r.said, /Read “value” as contract value; you may have meant value bands:/);
    assert.equal(r.choices.length, 1); assert.equal(r.choices[0].label, 'By value band instead');
    w.hbChoicePress(r.choices[0]);
    const P = openPlan(w).P;
    assert.equal(P.split.by, 'valueBand'); assert.equal(P.measure, 'count');
  });
  test('"terms": drawn as payment terms, when they end one press away', () => {
    const w = boardWorld();
    const r = ask(w, 'contracts by terms');
    assert.equal(openPlan(w).P.split.by, 'payterms');
    assert.match(r.said, /Read “terms” as payment terms; you may have meant how long they run:/);
    w.hbChoicePress(r.choices[0]);
    const P = openPlan(w).P;
    assert.equal(P.split.by, 'date'); assert.equal(P.split.date, 'end');
  });
  test('"owner": drawn as ours, the counterparty one press away', () => {
    const w = boardWorld();
    const r = ask(w, 'contracts by owner');
    assert.equal(openPlan(w).P.split.by, 'owner');
    assert.match(r.said, /Read “owner” as who owns it on our side; you may have meant the counterparty:/);
    w.hbChoicePress(r.choices[0]);
    assert.equal(openPlan(w).P.split.by, 'counterparty');
  });
});

describe('F512 — a clear question offers nothing', () => {
  for (const q of ['contracts by value band', 'contracts by payment terms', 'contracts by stage', 'contracts by counterparty', 'Siginon contracts by stage as a pie'])
    test(q, () => {
      const w = boardWorld();
      const r = ask(w, q);
      assert.ok(r.said, 'read free');
      assert.equal(r.choices.length, 0, q + ' → ' + JSON.stringify(r.choices));
    });
});
