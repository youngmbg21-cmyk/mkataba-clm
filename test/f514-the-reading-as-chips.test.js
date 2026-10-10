/* f514 — THE READING, AS CHIPS (work order "the board that answers right",
   Part 4, 5 Oct 2026; screen 2 of the owner's sketches)

     A. a reply that drew or changed the open chart carries its reading; one
        that changed nothing carries none;
     B. the chips equal the card's plan (Picture · Split · Measure) and each
        opens the card's own menu, greyed options with their reason;
     C. a choice writes through the card's own writer and moves the card;
     D. only the newest reply about the open card is live — an older one is
        plain text and can never edit a card that has moved on;
     E. a chip changed right after an answer is kept as a possible
        misreading (kind 'fix'). */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { read, strip, J, boardWorld, openKey, openPlan } = require('./board-world');

/* what intelAsk does around a free answer: snapshot, ask, reading */
function askWithReading(w, q){
  const snap = w.hbReadingSnap();
  const said = w.hbAsk(q);
  const m = Object.assign({ role: 'assistant', text: said }, w.hbTakeMeta(), (() => { const r = w.hbReadingAfter(snap); return r ? { reading: r } : {}; })());
  w.intel.history.push({ role: 'user', text: q }); w.intel.history.push(m);
  return w.intel.history.length - 1;
}

describe('F514 (A) — which replies carry a reading', () => {
  test('a new chart and a change carry one; a reply that changed nothing does not', () => {
    const w = boardWorld();
    const i1 = askWithReading(w, 'contracts by stage');
    assert.equal(w.intel.history[i1].reading.key, openKey(w));
    const i2 = askWithReading(w, 'as bars');
    assert.ok(w.intel.history[i2].reading, 'a change to the open chart');
    const snap = w.hbReadingSnap();
    assert.equal(w.hbReadingAfter(snap), null, 'nothing changed, no reading');
  });
});

describe('F514 (B, C) — the chips are the card\'s own menus', () => {
  test('the chips say the plan, and a choice moves the card through its writer', () => {
    const w = boardWorld();
    const i = askWithReading(w, 'contracts by stage');
    const html = w.hbReadingHtml(w.intel.history[i].reading, w.hbReadingLive(i));
    assert.match(html, /data-hb-rd="pic"[^>]*><i>Picture<\/i>Ring/);
    assert.match(html, /data-hb-rd="split"[^>]*><i>Split<\/i>by stage/);
    assert.match(html, /data-hb-rd="measure"[^>]*><i>Measure<\/i>Count/);
    w.hbRdToggle(openKey(w), 'split');
    const open = w.hbReadingHtml(w.intel.history[i].reading, true);
    assert.match(open, /role="menu"/); assert.match(open, /data-hb-rdset="split:g:counterparty"/);
    w.hbReadingSet(openKey(w), 'split', 'g:counterparty');
    assert.equal(openPlan(w).P.split.by, 'counterparty');
  });
  /* RE-POINTED 10 Oct 2026 (owner: "If a choice in the filter can not be
     clicked on and provide results then it should not be a choice in the
     filter at all"): a choice that cannot draw is not listed; the reading
     still knows why (hbRcOptions). */
  test('a choice that cannot draw is not listed, and the reading keeps its reason', () => {
    const w = boardWorld();
    const i = askWithReading(w, 'payment terms by stage as bars');
    w.hbRdToggle(openKey(w), 'pic');
    const html = w.hbReadingHtml(w.intel.history[i].reading, true);
    assert.ok(!/data-hb-rdset="pic:ring"/.test(html), 'the ring is not offered');
    assert.ok(!/data-hb-rdset="[^"]*" disabled/.test(html), 'no greyed choice');
    assert.match(html, /data-hb-rdset="pic:bars"/, 'the one in use is there');
  });
});

describe('F514 (D) — an old reply cannot edit a card that moved on', () => {
  test('only the newest reply about the open card is live', () => {
    const w = boardWorld();
    const i1 = askWithReading(w, 'contracts by stage');
    const i2 = askWithReading(w, 'Juno contracts by counterparty');
    assert.equal(w.hbReadingLive(i1), false);
    assert.equal(w.hbReadingLive(i2), true);
    const old = w.hbReadingHtml(w.intel.history[i1].reading, w.hbReadingLive(i1));
    assert.match(old, /class="hb-rd is-still"/); assert.ok(!/data-hb-rd=/.test(old), 'no buttons on an old reply');
    assert.match(old, /by stage/, 'it keeps the words it read');
  });
});

describe('F514 (E) — a quick change is a possible misreading', () => {
  test('a chip change within the window is recorded as kind fix', () => {
    const w = boardWorld();
    const got = []; w.hbFeedbackSend = r => { got.push(J(r)); return r; }; w.eval('hbFeedbackSend = window.hbFeedbackSend');
    askWithReading(w, 'contracts by stage');
    w.hbReadingSet(openKey(w), 'split', 'g:folder');
    assert.equal(got.length, 1); assert.equal(got[0].kind, 'fix'); assert.equal(got[0].q, 'contracts by stage');
    assert.deepEqual(got[0].changed, { split: 'g:folder' });
  });
});

describe('F514 — wired into the panel (source)', () => {
  test('the panel draws the chips and attaches the reading to both roads', () => {
    const src = strip(read('js/views/intelligence.js'));
    assert.match(src, /hbReadingHtml\(m\.reading,hbReadingLive\(i\)\)/);
    assert.match(src, /hbTakeMeta\(\):\{\}, rdOf\(\),/);
    assert.match(src, /if\(last&&!last\.reading\)\{ const r=rdOf\(\);/);
  });
});
