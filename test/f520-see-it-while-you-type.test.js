/* f520 — SEE IT WHILE YOU TYPE (work order "the board that answers right",
   Part 10, 5 Oct 2026)

     A. READING MUST NOT WRITE: hbAskReadingOf and the line's words change
        nothing — the board's record, the contracts, the browser's storage —
        across the whole precision book;
     B. the preview IS the answer: free exactly when the answer is free, the
        chart it names is the chart drawn, Copilot exactly when it goes on;
     C. hbAsk takes the reading as its first step (one reading, not two);
     D. Copilot is said with no price. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { readBook } = require('./board-precision');
const { read, strip, J, boardWorld, openPlan } = require('./board-world');

const BOOK = readBook().requests;
const world = () => boardWorld({ before: w => { w.contractOwnerName = c => (c.owner && c.owner.name) || null; w.setActiveNav = () => {}; } });
const snap = w => JSON.stringify({ s: w.hbS(), cs: w.state.contracts, ls: Object.keys(w.localStorage).sort().map(k => [k, w.localStorage.getItem(k)]) });

describe('F520 (A) — reading writes nothing', () => {
  test('across the whole precision book', () => {
    const bad = [];
    for (const r of BOOK){
      const w = world();
      if (r.after) w.hbAsk(r.after);
      const before = snap(w);
      const A = w.hbAskReadingOf(r.q); w.hbAskPreviewText(A);
      if (snap(w) !== before) bad.push(r.q);
      w.close();
    }
    assert.deepEqual(bad, []);
  });
  test('the reader names none of the writers', () => {
    const src = strip(read('js/views/homeboard.js'));
    for (const n of ['hbAskReadingOf', 'hbAskPreviewText', 'hbFollowUpRead']){
      const i = src.indexOf('function ' + n + '('), body = src.slice(i, src.indexOf('\n}\n', i));
      assert.ok(i > 0, n);
      assert.doesNotMatch(body, /\bhb(?:Dig|CardSet|RecipeSet|Save|BoardEdit|AddCard|AddPanel|PaintBoard)\s*\(/, n + ' writes');
    }
  });
});

describe('F520 (B) — the preview is the answer', () => {
  test('free when the answer is free, the same chart, Copilot when it goes on', () => {
    const bad = [];
    for (const r of BOOK){
      const w = world();
      if (r.after) w.hbAsk(r.after);
      const A = w.hbAskReadingOf(r.q), line = w.hbAskPreviewText(A);
      let said; try { said = w.hbAsk(r.q); } catch (e){ bad.push(r.q + ' — threw ' + e.message); w.close(); continue; }
      const why = [];
      if (!!said !== (A && A.road === 'free')) why.push(`road ${A && A.road} but answered ${!!said}`);
      if (!said && line !== 'Copilot will read this one') why.push('line: ' + line);
      if (said && !/ · Free$/.test(line)) why.push('line: ' + line);
      if (said && A.r && A.r.act === 'dig' && /^q:/.test(A.r.key)){
        const { key, P } = openPlan(w);
        if (key !== A.r.key) why.push(`opened ${key}, previewed ${A.r.key}`);
        else if (!line.includes(w.hbHowWord(w.hbPlan(w.hbDigData(key, w.hbS().lens))))) why.push(`drew ${w.hbHowWord(P)}, line "${line}"`);
      }
      if (said && A.kind === 'follow' && !A.fu.narrow){
        const { P } = openPlan(w);
        if (!line.includes(w.hbHowWord(P))) why.push(`changed to ${w.hbHowWord(P)}, line "${line}"`);
      }
      if (why.length) bad.push(r.q + ' — ' + why.join('; '));
      w.close();
    }
    assert.deepEqual(bad, []);
  });
  test('a few lines as the reader sees them', () => {
    const w = world();
    assert.equal(w.hbAskPreviewText(w.hbAskReadingOf('contracts by stage')), 'All contracts: Ring · by stage · count · Free');
    assert.equal(w.hbAskPreviewText(w.hbAskReadingOf('how quickly do we close deals in each stream')), 'Copilot will read this one');
    assert.equal(w.hbAskReadingOf('   '), null); assert.equal(w.hbAskPreviewText(null), '');
    w.hbAsk('contracts by stage');
    assert.match(w.hbAskPreviewText(w.hbAskReadingOf('make it bars')), /^Changes the open chart: Bars · by stage · count · Free$/);
  });
});

describe('F520 (C, D) — one reading; no price guessed', () => {
  test('hbAsk takes the reading first; the panel draws the line from it', () => {
    const src = strip(read('js/views/homeboard.js'));
    const i = src.indexOf('function hbAsk('), body = src.slice(i, i + 400);
    assert.match(body, /^function hbAsk\(q\)\{\s*_hbMeta = null;\s*const A = hbAskReadingOf\(q\);/);
    const ig = strip(read('js/views/intelligence.js'));
    assert.match(ig, /hbAskPreviewText\(hbAskReadingOf\(inp\.value\)\)/);
    assert.match(ig, /setTimeout\(igPrePaint,IG_PRE_MS\)/);
  });
  test('the Copilot line carries no figure', () => {
    for (const lang of ['en', 'sv']){
      const book = read('js/i18n.js');
      assert.doesNotMatch(book.match(/hb_pre_copilot: "([^"]*)"/g).join(' '), /\d|kr|\$|€|cost|kostar/i, lang);
    }
  });
});
