/* f515 — THREE NEXT QUESTIONS (work order "the board that answers right",
   Part 5, 5 Oct 2026; screen 3 of the owner's sketches)

     A. across every free request in the precision book, each next question
        offered is read FREE, changes the open card (never a new card), and
        leaves a card that is not empty;
     B. at most three, nothing on an empty card, nothing under an old reply;
     C. a press asks it as if typed, through the panel (source). */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { readBook } = require('./board-precision');
const { read, strip, J, boardWorld, openKey } = require('./board-world');

const sigOf = (w, key) => JSON.stringify(J(w.hbPlan(w.hbDigData(key, w.hbS().lens))));

describe('F515 (A) — every offered question draws, free, on the open card', () => {
  const REQ = readBook().requests.filter(r => r.road === 'free' && !r.after && !(r.want && r.want.parse));
  test(`over ${REQ.length} questions in the book`, () => {
    let offered = 0; const bad = [];
    for (const r of REQ){
      const w0 = boardWorld(); if (!w0.hbAsk(r.q)) continue;
      const key = openKey(w0); if (!key) continue;
      const qs = J(w0.hbNextQuestions(key));
      assert.ok(qs.length <= 3, r.q);
      for (const nq of qs){
        offered++;
        const w = boardWorld(); w.hbAsk(r.q);
        const k0 = openKey(w), s0 = sigOf(w, k0), n0 = w.hbS().panels.length;
        const said = w.hbAsk(nq);
        const k1 = openKey(w);
        const D1 = k1 ? w.hbDigData(k1, w.hbS().lens) : null;
        if (!said) bad.push(`${r.q} → ${nq}: not read free`);
        else if (!D1 || !D1.n) bad.push(`${r.q} → ${nq}: empty`);
        else if (w.hbS().panels.length !== n0) bad.push(`${r.q} → ${nq}: a new card`);
        else if (k1 === k0 && sigOf(w, k1) === s0) bad.push(`${r.q} → ${nq}: nothing changed`);
      }
    }
    assert.ok(offered >= 60, 'questions are offered across the book: ' + offered);
    assert.deepEqual(bad, []);
  });
});

describe('F515 (B) — few, and only where they can be pressed', () => {
  test('nothing on an empty card', () => {
    const w = boardWorld(); w.hbAsk('Tuskys contracts signed in 1999 by stage');
    const key = openKey(w);
    if (key && w.hbDigData(key, w.hbS().lens).n === 0) assert.deepEqual(J(w.hbNextQuestions(key)), []);
    assert.deepEqual(J(w.hbNextQuestions('q:nothing open')), [], 'a key that is not the open card offers nothing');
  });
  test('drawn only under the live reply', () => {
    const w = boardWorld(); w.hbAsk('contracts by stage');
    const key = openKey(w);
    assert.match(w.hbReadingHtml({ key, words: {} }, true), /class="hb-nx"[\s\S]*data-hb-next="by month of signing"/);
    assert.ok(!/hb-nx/.test(w.hbReadingHtml({ key, words: { pic: 'Ring' } }, false)), 'an old reply offers none');
  });
  test('a pie is never offered over time', () => {
    const w = boardWorld(); w.hbAsk('signed contracts by month');
    assert.ok(!J(w.hbNextQuestions(openKey(w))).includes('as a pie'));
  });
});

describe('F515 (C) — a press asks it as if typed', () => {
  test('the panel sends it through intelAsk (source)', () => {
    const src = strip(read('js/views/homeboard.js'));
    assert.match(src, /if \(\(el = on\('\[data-hb-next\]'\)\)\)\{ const q = el\.getAttribute\('data-hb-next'\); if \(q && typeof intelAsk === 'function'\) intelAsk\(q\); return; \}/);
  });
});
