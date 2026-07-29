/* F85 — the rewrite lands on the phrase you pointed at, not the first one.

   Splicing a rewrite into a clause with working.replace(text, …) takes the
   FIRST match. Contract wording repeats, and payment clauses repeat most of
   all:

     "The Customer shall pay each invoice within thirty (30) days of receipt,
      and shall remedy any failure to pay within thirty (30) days of notice."

   Select the second "within thirty (30) days", ask for it to be softened, and a
   string splice rewrites the first. The invoice term moves; the cure period,
   which is what was selected, does not. Both sentences still read plausibly, so
   there is nothing on screen to catch it — and a clause has been changed in a
   way nobody proposed. That is the same harm the selection guard exists to
   prevent, arriving through a different door.

   The fix is to carry an OFFSET rather than a string. The selection's start is
   measured against the working text as it is rendered — skipping struck-through
   wording, which is on the page but not in the string — and the occurrence
   nearest that offset is the one spliced.

   Nearest, not exact, and that is deliberate. The measurement is reconstructed
   from marked-up HTML, so whitespace can move it by a character or two. It only
   ever has to be good enough to tell two occurrences apart, and where a phrase
   appears once it cannot change the answer at all. */
const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { JSDOM } = require('jsdom');

function loadLab(extraGlobals){
  const store = new Map();
  const localStorage = {
    getItem: k => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => { store.set(k, String(v)); },
    removeItem: k => { store.delete(k); }
  };
  const win = { FIRST_PARTY: 'Wanjiru Catering Ltd' };
  const ctx = vm.createContext(Object.assign({
    window: win, localStorage, JSON, Math, console,
    nowISO: () => '2026-07-28T14:30:00.000Z'
  }, extraGlobals || {}));
  const src = fs.readFileSync(path.join(__dirname, '..', 'js', 'views', 'doclab.js'), 'utf8');
  vm.runInContext(src, ctx, { filename: 'doclab.js' });
  return win;
}

/* The clause the whole file is about: one phrase, twice, meaning two different
   things. */
const TWICE = 'The Customer shall pay each invoice within thirty (30) days of receipt, '
  + 'and shall remedy any failure to pay within thirty (30) days of notice.';
const PHRASE = 'within thirty (30) days';
const FIRST  = TWICE.indexOf(PHRASE);
const SECOND = TWICE.indexOf(PHRASE, FIRST + 1);

describe('F85a — picking the occurrence', () => {
  let lab;
  beforeEach(() => { lab = loadLab(); });

  test('the clause really does contain it twice', () => {
    assert.ok(FIRST > -1 && SECOND > FIRST, 'precondition for everything below');
  });

  test('a hint near the second occurrence picks the second', () => {
    assert.equal(lab.labPickOccurrence(TWICE, PHRASE, SECOND), SECOND);
  });

  test('a hint near the first picks the first', () => {
    assert.equal(lab.labPickOccurrence(TWICE, PHRASE, FIRST), FIRST);
  });

  /* The point of "nearest" rather than "exact": the hint is reconstructed from
     a rendering and is allowed to be a little wrong. */
  test('a hint that drifts by a few characters still picks the right one', () => {
    for (const drift of [-6, -3, -1, 0, 1, 3, 6]){
      assert.equal(lab.labPickOccurrence(TWICE, PHRASE, SECOND + drift), SECOND,
        `drift ${drift} must not change which sentence is rewritten`);
    }
  });

  test('the tie is broken toward the earlier occurrence, deterministically', () => {
    const mid = Math.floor((FIRST + SECOND) / 2);
    const pick = lab.labPickOccurrence(TWICE, PHRASE, mid);
    assert.ok(pick === FIRST || pick === SECOND);
    assert.equal(pick, lab.labPickOccurrence(TWICE, PHRASE, mid),
      'the same hint must always give the same answer');
  });

  test('no hint means the first occurrence — the old behaviour, kept as the floor', () => {
    assert.equal(lab.labPickOccurrence(TWICE, PHRASE), FIRST);
    assert.equal(lab.labPickOccurrence(TWICE, PHRASE, undefined), FIRST);
    assert.equal(lab.labPickOccurrence(TWICE, PHRASE, NaN), FIRST);
  });

  test('a hint past the end of the clause still picks the last occurrence', () => {
    assert.equal(lab.labPickOccurrence(TWICE, PHRASE, TWICE.length + 500), SECOND);
  });

  test('wording that is not there at all is refused, not guessed at', () => {
    assert.equal(lab.labPickOccurrence(TWICE, 'within ninety (90) days', 40), -1);
    assert.equal(lab.labPickOccurrence(TWICE, '', 0), -1);
    assert.equal(lab.labPickOccurrence('', PHRASE, 0), -1);
  });

  test('a phrase appearing once is found wherever the hint points', () => {
    for (const hint of [0, 20, 500, -30]){
      assert.equal(lab.labPickOccurrence(TWICE, 'of notice', hint), TWICE.indexOf('of notice'),
        'one occurrence means the hint cannot change the answer');
    }
  });

  test('three occurrences, and the middle one is reachable', () => {
    const thrice = `${PHRASE} A. ${PHRASE} B. ${PHRASE} C.`;
    const i2 = thrice.indexOf(PHRASE, 1);
    assert.equal(lab.labPickOccurrence(thrice, PHRASE, i2), i2);
    assert.equal(lab.labPickOccurrence(thrice, PHRASE, 0), 0);
    assert.equal(lab.labPickOccurrence(thrice, PHRASE, thrice.length), thrice.lastIndexOf(PHRASE));
  });
});

describe('F85b — the splice puts the words where the offset says', () => {
  let lab;
  beforeEach(() => { lab = loadLab(); });

  /* Exactly what labAiPropose does with the offset it picked. */
  const spliceAt = (working, at, text, replacement) =>
    working.slice(0, at) + replacement + working.slice(at + text.length);

  test('rewriting the SECOND occurrence leaves the first alone', () => {
    const at = lab.labPickOccurrence(TWICE, PHRASE, SECOND);
    const out = spliceAt(TWICE, at, PHRASE, 'within sixty (60) days');
    assert.match(out, /pay each invoice within thirty \(30\) days of receipt/,
      'the invoice term was not selected and must not move');
    assert.match(out, /failure to pay within sixty \(60\) days of notice/,
      'the cure period was selected and is what changes');
  });

  test('and the string splice it replaces gets this wrong — the bug being pinned', () => {
    const naive = TWICE.replace(PHRASE, 'within sixty (60) days');
    assert.match(naive, /pay each invoice within sixty \(60\) days of receipt/,
      'precondition: replace() moves the invoice term');
    assert.match(naive, /failure to pay within thirty \(30\) days of notice/,
      'and leaves the cure period — the opposite of what was asked for');
  });

  test('rewriting the FIRST occurrence leaves the second alone', () => {
    const at = lab.labPickOccurrence(TWICE, PHRASE, FIRST);
    const out = spliceAt(TWICE, at, PHRASE, 'within fourteen (14) days');
    assert.match(out, /pay each invoice within fourteen \(14\) days of receipt/);
    assert.match(out, /failure to pay within thirty \(30\) days of notice/);
  });

  test('the clause keeps its length bar the edit — nothing is duplicated or eaten', () => {
    const at = lab.labPickOccurrence(TWICE, PHRASE, SECOND);
    const out = spliceAt(TWICE, at, PHRASE, 'within sixty (60) days');
    assert.equal(out.length, TWICE.length - PHRASE.length + 'within sixty (60) days'.length);
    assert.equal((out.match(/within/g) || []).length, 2, 'still two terms, not three');
  });

  /* The $-expansion fix from F84, restated against the splice that replaced it.
     slice() has no substitution behaviour at all, so this is now structural. */
  test('a replacement containing $$ is spliced verbatim', () => {
    const clause = 'The Customer shall pay the sum on signature.';
    const at = lab.labPickOccurrence(clause, 'the sum', 0);
    const out = spliceAt(clause, at, 'the sum', 'a deposit of US$$500');
    assert.match(out, /a deposit of US\$\$500/);
    assert.ok(!/US\$500\b/.test(out.replace('US$$500', '')), 'no dollar sign was consumed');
  });
});

describe('F85c — measuring the offset off a rendered redline', () => {
  let lab, dom;

  /* The lab's own markup: one block per line, insertions in .lab-ins, deletions
     in .lab-del. labWorkingOffset has to read the working text out of that —
     which means counting insertions and kept wording, and NOT counting the
     struck-through wording that is on the page beside them. */
  function render(html){
    dom = new JSDOM(`<body><div data-lab-clause="c1"><div class="clause-body">${html}</div></div></body>`);
    lab = loadLab({ document: dom.window.document });
    return dom.window.document.querySelector('.clause-body');
  }
  const textNodes = root => {
    const out = [];
    const walk = n => { if(n.nodeType === 3) out.push(n); else n.childNodes.forEach(walk); };
    walk(root);
    return out;
  };

  test('plain wording: the offset is the character offset', () => {
    const body = render('<p class="rl-line">The Customer shall pay each invoice.</p>');
    const t = textNodes(body)[0];
    assert.equal(lab.labWorkingOffset(body, t, 0), 0);
    assert.equal(lab.labWorkingOffset(body, t, 13), 13);
  });

  test('struck-through wording counts for nothing — it is not in the working text', () => {
    // "pay within [del thirty (30)][ins sixty (60)] days"
    const body = render('<p class="rl-line">pay within '
      + '<del class="lab-del">thirty (30) </del><ins class="lab-ins">sixty (60) </ins>days</p>');
    const nodes = textNodes(body);
    const [lead, struck, added, tail] = nodes;
    assert.equal(lead.nodeValue, 'pay within ');
    assert.equal(struck.nodeValue, 'thirty (30) ');
    assert.equal(added.nodeValue, 'sixty (60) ');

    assert.equal(lab.labWorkingOffset(body, added, 0), 'pay within '.length,
      'the inserted wording starts where the kept wording ended — the deletion is not counted');
    assert.equal(lab.labWorkingOffset(body, tail, 0), 'pay within sixty (60) '.length,
      'and the wording after it lines up with the working string, not the visible one');
  });

  test('a position inside struck wording does not run the count forward', () => {
    const body = render('<p class="rl-line">pay within '
      + '<del class="lab-del">thirty (30) </del><ins class="lab-ins">sixty (60) </ins>days</p>');
    const struck = textNodes(body)[1];
    assert.equal(lab.labWorkingOffset(body, struck, 6), 'pay within '.length,
      'six characters into a deletion is still nowhere in the working text');
  });

  test('each line contributes the newline that separates it', () => {
    const body = render('<p class="rl-line">7.1 Payment.</p><p class="rl-line">7.2 Interest.</p>');
    const second = textNodes(body)[1];
    assert.equal(second.nodeValue, '7.2 Interest.');
    assert.equal(lab.labWorkingOffset(body, second, 0), '7.1 Payment.'.length + 1,
      'the block boundary is a newline in the string it is standing in for');
  });

  test('a heading block counts the same as a paragraph', () => {
    const body = render('<h4 class="rl-line">7. PAYMENT</h4><p class="rl-line">Pay monthly.</p>');
    const second = textNodes(body)[1];
    assert.equal(lab.labWorkingOffset(body, second, 0), '7. PAYMENT'.length + 1);
  });

  /* A range can start on an element rather than a text node — the offset is
     then a child index. */
  test('an element-anchored position counts the children it sits after', () => {
    const body = render('<p class="rl-line">abc<ins class="lab-ins">def</ins>ghi</p>');
    const p = body.querySelector('p');
    assert.equal(lab.labWorkingOffset(body, p, 0), 0);
    assert.equal(lab.labWorkingOffset(body, p, 1), 3, 'after the first child');
    assert.equal(lab.labWorkingOffset(body, p, 2), 6, 'after the insertion too');
  });

  test('a missing host or node is nought rather than a throw', () => {
    const body = render('<p class="rl-line">abc</p>');
    assert.equal(lab.labWorkingOffset(null, null, 0), 0);
    assert.equal(lab.labWorkingOffset(body, null, 0), 0);
  });

  /* THE WHOLE POINT, END TO END.

     The repeating clause is under a live redline SOMEWHERE ELSE — the party
     name — so both occurrences of the phrase survive into the working text and
     the choice between them is genuine. The struck-out "Customer" sits on the
     page ahead of both of them, which is exactly the thing that would throw off
     an offset measured from the visible text. */
  test('on a clause under redline, the second occurrence is the one resolved', () => {
    const working = TWICE.replace('The Customer', 'The Buyer');
    assert.equal((working.match(/within thirty \(30\) days/g) || []).length, 2,
      'precondition: the redline is elsewhere, so both occurrences are still there');

    const body = render('<p class="rl-line">The '
      + '<del class="lab-del">Customer</del><ins class="lab-ins">Buyer</ins>'
      + ' shall pay each invoice within thirty (30) days of receipt, '
      + 'and shall remedy any failure to pay within thirty (30) days of notice.</p>');

    const tail = textNodes(body).find(n => /shall pay each invoice/.test(n.nodeValue));
    const secondInTail = tail.nodeValue.indexOf(PHRASE, tail.nodeValue.indexOf(PHRASE) + 1);
    assert.ok(secondInTail > -1, 'precondition: both occurrences are in this text node');

    const hint = lab.labWorkingOffset(body, tail, secondInTail);
    const at = lab.labPickOccurrence(working, PHRASE, hint);

    assert.equal(at, working.lastIndexOf(PHRASE),
      'the cure period was selected, so the cure period is what gets rewritten');
    assert.notEqual(at, working.indexOf(PHRASE),
      'and NOT the invoice term, which is merely the one that comes first');
  });

  test('and selecting the FIRST occurrence on that same rendering resolves the first', () => {
    const working = TWICE.replace('The Customer', 'The Buyer');
    const body = render('<p class="rl-line">The '
      + '<del class="lab-del">Customer</del><ins class="lab-ins">Buyer</ins>'
      + ' shall pay each invoice within thirty (30) days of receipt, '
      + 'and shall remedy any failure to pay within thirty (30) days of notice.</p>');

    const tail = textNodes(body).find(n => /shall pay each invoice/.test(n.nodeValue));
    const hint = lab.labWorkingOffset(body, tail, tail.nodeValue.indexOf(PHRASE));
    assert.equal(lab.labPickOccurrence(working, PHRASE, hint), working.indexOf(PHRASE));
  });
});

describe('F85d — the shipped file splices by offset', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'js', 'views', 'doclab.js'), 'utf8');
  /* Asserted against CODE, not prose. This file's own comments name the call
     they are warning against, and a bare search of the source would match the
     warning and report the bug still present. */
  const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

  test('the comment stripper actually removed the prose', () => {
    assert.ok(/labPickOccurrence/.test(code), 'but kept the code');
    assert.ok(!/THE WORDING A NEW EDIT LANDS ON/.test(code), 'a known comment is gone');
  });

  test('the guard resolves an occurrence rather than testing for presence', () => {
    assert.ok(/const at = labPickOccurrence\(working, text, ctx\.hint\)/.test(code));
    assert.ok(/if\(at < 0\)\{/.test(code));
    assert.ok(!/if\(!working\.includes\(text\)\)/.test(code),
      'the presence test cannot survive alongside it — it would take the first match');
  });

  test('no String.replace splice remains in the AI path', () => {
    assert.ok(!/working\.replace\(text/.test(code),
      'replace() takes the first match, which is the bug this file exists for');
    assert.ok(/working\.slice\(0, at\) \+ t \+ working\.slice\(at \+ text\.length\)/.test(code));
  });

  test('the selection is measured from the range START, not the anchor', () => {
    assert.ok(/range\.startContainer/.test(code) && /range\.startOffset/.test(code),
      'a right-to-left drag puts the anchor at the far end of the passage');
    assert.ok(!/const node = sel\.anchorNode/.test(code));
  });

  test('the hint is carried from the selection through the menu to the proposal', () => {
    assert.ok(/labSelMenu\(\{ c, lab, side, again: againLab, rect, clause, text, hint \}\)/.test(code));
    assert.ok(/hint: ctx\.hint/.test(code), 'the menu must pass it on, or it stops at the menu');
  });
});
