/* f363 — THE RUNWAY: ONE LINE OF TIME, AND ONE UNIT ON IT
   ============================================================================
   Young, 22 September 2026, of the home page: *"looks boring with mostly
   words"* — and then the question that decided the shape of the fix:
   *"how does the app measure the dates of redline answers that are pending?
   Redlines usually do not have due dates."*

   MEASURED OUT OF THE RECORD BEFORE A LINE MOVED, and the answer is that he is
   right: NOTHING on that card was ever due. What HaTi holds for a pending
   redline is `createdAt` on the other side's change — the day they asked — and
   a rule the workspace sets on the negotiation-desk panel: answer within five
   WORKING days. The card's "37 days" was elapsed working days, and it sat in
   the same column as "in 9 days", which is calendar days REMAINING. Two units
   and two directions, read as one.

   WHAT THIS FILE PINS
     · the rail is one unit, CALENDAR days, on both sides of TODAY
     · the left-hand clock starts where the STANDARD ran out, not where they
       asked — and the standard is the desk's own, read, never re-invented
     · the day it ran out is the exact inverse of desk.js's own working-day
       walk (the pair is pinned against each other, never either number)
     · a row with no date is NOT plotted — it is counted, and the counts and
       the rail come off ONE pass
     · a renewal past its deadline lands LEFT, a review past its due date
       lands LEFT: one reading, whichever source the date came from
     · it writes nothing, spends nothing, and reaches no route
     · and the home page hands it RAW facts, never a presented string

   Run: node --test test/f363-the-runway.test.js */
const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');

const read = p => fs.readFileSync(path.join(__dirname, '..', p), 'utf8');
/* A FILE THAT WILL NOT LOAD PROVES NOTHING. Run against the commit before this
   one js/runway.js does not exist, and a throw at module level collapses
   twenty-four claims into one unreadable failure. Absent reads as empty, so
   every claim fails on its own and says which one. */
const readOr = p => { try { return read(p); } catch (_) { return ''; } };
const RUNWAY = readOr('js/runway.js');
const HOME = read('js/views/home.js');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1 ');
const RW_CODE = strip(RUNWAY);
const HOME_CODE = strip(HOME);

/* A day n days from today, in the LOCAL calendar — the one the reading uses. */
const day = n => { const d = new Date(); d.setDate(d.getDate() + n);
  const p = x => String(x).padStart(2, '0');
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()); };

/* ============================================================================
   1 · IT IS A READING. No route, no store, no field, no spend.
   ==========================================================================*/
describe('f363 (1) the runway reaches nothing', () => {
  /* GATED ON THE FILE EXISTING. Every claim below is an ABSENCE, and an
     absence is satisfied by an empty string — so against the commit before
     this one, where js/runway.js does not exist, the whole section passed and
     proved nothing. That is this codebase's own "a check that passes against
     the parent is a description", in its quietest costume. */
  test('there is a file to read', () => {
    assert.ok(RUNWAY.length > 500, 'js/runway.js exists and has something in it');
  });
  test('no route, no persistence, no model', () => {
    assert.ok(RUNWAY.length > 500, 'gated: there is a file to grep');
    [/\bfetch\s*\(/, /\bapi\s*\(/, /\/api\//, /persist\s*\(/, /saveContract\s*\(/,
     /localStorage/, /copilotAsk\s*\(/, /anthropic/i].forEach(re =>
      assert.ok(!re.test(RW_CODE), 'runway.js does not use ' + re));
  });
  test('it writes nothing onto what it reads', () => {
    assert.ok(RUNWAY.length > 500, 'gated: there is a file to grep');
    /* Every assignment in the file lands on a local or on the object the
       reading itself just built — never on a contract or a decision row. */
    /* `=` and not `==`: `c.side === 'past'` is a READING, and a guard that
       cannot tell the two apart fails on correct code and teaches nothing. */
    assert.ok(!/\bit\.\w+\s*=(?!=)/.test(RW_CODE), 'it never writes onto a row it was handed');
    assert.ok(!/\brow\.it\.\w+\s*=(?!=)/.test(RW_CODE), 'nor through the row onto it');
  });
});

/* ============================================================================
   2 · THE STANDARD IS THE DESK'S OWN, READ AND NEVER RE-INVENTED
   ==========================================================================*/
describe('f363 (2) one promise, said in one place', () => {
  test('it reads deskCfg, and falls back rather than guessing a different rule', async () => {
    assert.ok(/window\.deskCfg/.test(RW_CODE), 'it asks the desk for the standard');
    const w = await buildWorld({ runway: true });
    /* No desk module on this stage: the fallback is the desk's own default,
       not a number of its own. */
    assert.equal(w.win.rwStandardDays(), 5);
    w.win.deskCfg = () => ({ on: false, staleDays: 9 });
    assert.equal(w.win.rwStandardDays(), 9, 'a workspace that moved it is followed');
  });
  /* A NAMED WALL: this one passes against the parent too, and is meant to.
     deskCfg was ALREADY published — the runway did not have to widen anything
     to read the standard, which is exactly why reading it was the right
     answer. What this claim stops is a later tidy taking it off the list and
     quietly dropping every workspace back to the five-day fallback. */
  test('desk.js publishes it (WALL) — or the reading above is always the fallback', () => {
    const DESK = read('js/desk.js');
    /* PIN THE LIST, NOT THE FILE: a greedy match past the closing brace finds
       the function’s own declaration and would pass on a build that
       publishes nothing. */
    const i = DESK.indexOf('Object.assign(window, {');
    assert.ok(i > 0, 'desk.js has a published list');
    assert.ok(/\bdeskCfg\b/.test(DESK.slice(i, DESK.indexOf('});', i))), 'deskCfg is ON it');
  });
});

/* ============================================================================
   3 · THE DAY THE STANDARD RAN OUT IS THE INVERSE OF THE DESK'S OWN WALK
   ----------------------------------------------------------------------------
   PIN THE PAIR, NEVER THE NUMBER. Either walk changing its mind about what a
   working day is, on its own, is the one way this can be silently wrong.
   ==========================================================================*/
describe('f363 (3) working days, agreed by both walks', () => {
  test('adding N working days then counting them back gives N', async () => {
    const w = await buildWorld({ runway: true });
    const count = (from, to) => {           /* desk.js’s own walk, verbatim */
      const a = new Date(from + 'T00:00:00'), b = new Date(to + 'T00:00:00');
      let n = 0; const cur = new Date(a.getFullYear(), a.getMonth(), a.getDate());
      const end = new Date(b.getFullYear(), b.getMonth(), b.getDate());
      while (cur < end) { cur.setDate(cur.getDate() + 1);
        const d = cur.getDay(); if (d !== 0 && d !== 6) n++; }
      return n;
    };
    /* Every start day of a fortnight, so a Friday and a Sunday are both in. */
    for (let s = 0; s < 14; s++) {
      const from = day(-40 + s);
      for (const n of [1, 5, 9]) {
        const ran = w.win.rwAddWorkingDays(from, n);
        assert.equal(count(from, ran), n, n + ' working days from ' + from);
      }
    }
  });
  test('it never lands on a weekend, and refuses a day it cannot read', async () => {
    const w = await buildWorld({ runway: true });
    for (let s = 0; s < 7; s++) {
      const got = w.win.rwAddWorkingDays(day(-20 + s), 5);
      const wd = new Date(got + 'T00:00:00').getDay();
      assert.ok(wd !== 0 && wd !== 6, got + ' is a working day');
    }
    assert.equal(w.win.rwAddWorkingDays('', 5), null);
    assert.equal(w.win.rwAddWorkingDays('not a day', 5), null);
  });
});

/* ============================================================================
   4 · ONE UNIT, AND THE LEFT-HAND CLOCK STARTS AT THE STANDARD
   ==========================================================================*/
describe('f363 (4) calendar days on both sides', () => {
  test('a redline is measured from where the standard ran out, not from the ask', async () => {
    const w = await buildWorld({ runway: true });
    const since = day(-30);
    const ran = w.win.rwAddWorkingDays(since, 5);
    const k = w.win.rwClock({ rw: { since } });
    assert.equal(k.side, 'past');
    assert.equal(k.n, w.win.rwDayDiff(ran, w.win.rwToday()),
      'the distance is calendar days from the day the standard ran out');
    assert.ok(k.n < 30, 'and it is SHORTER than the time since they asked');
  });
  test('a fresh ask is not yet past the standard', async () => {
    const w = await buildWorld({ runway: true });
    const k = w.win.rwClock({ rw: { since: day(0) } });
    assert.equal(k.side, 'left', 'inside the standard it is time still to run');
  });
  test('a renewal with days left lands right, past its date lands left', async () => {
    const w = await buildWorld({ runway: true });
    assert.deepEqual(w.win.rwClock({ rw: { left: 12 } }), { side: 'left', n: 12 });
    assert.deepEqual(w.win.rwClock({ rw: { left: -4 } }), { side: 'past', n: 4 });
  });
  test('a typed due date is read the same way, whichever side it falls', async () => {
    const w = await buildWorld({ runway: true });
    assert.deepEqual(w.win.rwClock({ rw: { due: day(9) } }), { side: 'left', n: 9 });
    assert.deepEqual(w.win.rwClock({ rw: { due: day(-3) } }), { side: 'past', n: 3 });
  });
});

/* ============================================================================
   5 · A ROW WITH NO DATE IS COUNTED, NEVER PLOTTED
   ==========================================================================*/
describe('f363 (5) no clock is not a place on a timeline', () => {
  test('a signature carries no clock, and says how long it has sat', async () => {
    const w = await buildWorld({ runway: true });
    assert.deepEqual(w.win.rwClock({ rw: {} }), { side: 'none', n: null, sat: null });
    assert.deepEqual(w.win.rwClock({ rw: { sat: 11 } }), { side: 'none', n: null, sat: 11 });
  });
  test('one pass, and the three piles add up to the whole list', async () => {
    const w = await buildWorld({ runway: true });
    const items = [
      { cid: 'a', rk: 'wait', rw: { since: day(-30) } },
      { cid: 'b', rk: 'renew', rw: { left: 10 } },
      { cid: 'c', rk: 'renew', rw: { left: 70 } },
      { cid: 'd', rk: 'sign', rw: {} },
      { cid: 'e', rk: 'idle', rw: { sat: 40 } },
      { cid: 'f', rk: 'join', rw: { sat: 2 } },
    ];
    const sp = w.win.rwSplit(items);
    assert.equal(sp.rows.length, 6);
    assert.equal(sp.past.length + sp.left.length + sp.none.length, 6);
    assert.equal(sp.plotted, sp.past.length + sp.left.length);
    assert.equal(sp.plotted, 3, 'exactly the three that carry a date');
    assert.equal(sp.none.length, 3);
    assert.deepEqual(Object.keys(sp.noneBy).sort(), ['idle', 'join', 'sign']);
    assert.deepEqual(w.win.rwNoneGroups(sp).map(g => g.kind + ':' + g.n),
      ['sign:1', 'idle:1', 'join:1'], 'in the stated order, and only the kinds that have any');
  });
  test('a kind nobody has named is counted rather than dropped', async () => {
    const w = await buildWorld({ runway: true });
    const sp = w.win.rwSplit([{ cid: 'x', rk: 'something-new', rw: {} }]);
    assert.equal(sp.none.length, 1, 'still counted');
    assert.equal(sp.rows[0].kind, 'idle', 'and drawn in the quietest tone');
  });
});

/* ============================================================================
   6 · WHERE A ROW SITS, AND THE WALLS AT EITHER END
   ==========================================================================*/
describe('f363 (6) the rail’s own arithmetic', () => {
  test('today is today, and the two ends are the two ends', async () => {
    const w = await buildWorld({ runway: true });
    const X = w.win;
    assert.equal(X.rwX({ side: 'past', n: 0 }), X.RW_TODAY_AT);
    assert.equal(X.rwX({ side: 'left', n: 0 }), X.RW_TODAY_AT);
    assert.equal(X.rwX({ side: 'past', n: X.RW_PAST_MAX }), 0);
    assert.equal(X.rwX({ side: 'left', n: X.RW_LEFT_MAX }), 100);
  });
  test('a row past either end is PINNED to it, never dropped off the rail', async () => {
    const w = await buildWorld({ runway: true });
    const X = w.win;
    assert.equal(X.rwX({ side: 'past', n: 4000 }), 0);
    assert.equal(X.rwX({ side: 'left', n: 4000 }), 100);
    assert.equal(X.rwX({ side: 'none', n: null }), null, 'and a no-clock row has no place');
  });
  test('further past is further left; further ahead is further right', async () => {
    const w = await buildWorld({ runway: true });
    const X = w.win;
    assert.ok(X.rwX({ side: 'past', n: 40 }) < X.rwX({ side: 'past', n: 10 }));
    assert.ok(X.rwX({ side: 'left', n: 10 }) < X.rwX({ side: 'left', n: 40 }));
  });
});

/* ============================================================================
   7 · THE HOME PAGE HANDS IT RAW FACTS
   ----------------------------------------------------------------------------
   The old card's own tag is a PRESENTED string — "37 days", already through
   i18t and esc. A reading built on that would be reading its own output.
   ==========================================================================*/
describe('f363 (7) the card carries the record, not its own words', () => {
  test('all six sources carry a kind and a clock', () => {
    ['rk:\'ask\'', 'rk:\'wait\'', 'rk:\'join\'', 'rk:\'sign\'', 'rk:\'renew\'', 'rk:\'idle\'']
      .forEach(k => assert.ok(HOME_CODE.includes(k), 'a source carries ' + k));
    assert.equal((HOME_CODE.match(/\brw:\s*\{/g) || []).length, 6,
      'six sources, six raw clocks');
  });
  test('the quiet desk hands over the DAY THEY ASKED, not its working-day count', () => {
    assert.ok(/rk:'wait',\s*rw:\s*\{\s*since:x\.stale\.since\s*\}/.test(HOME_CODE),
      'the timestamp travels, so the rail can measure in its own unit');
  });
  test('the rail is above the rows, and the rows are still drawn', () => {
    assert.ok(/ddRows\s*=\s*ddShown\.length\s*\?\s*rwCard\+`<div class="hm-rows"/.test(HOME_CODE),
      'the picture leads and the list survives under it');
  });
  test('nothing is plotted, nothing is drawn', () => {
    assert.ok(/if\(!rwSp\|\|!rwSp\.plotted\)\s*return\s*'';/.test(HOME_CODE),
      'a rail with no dots on it is not built');
  });
  test('every dot is a door, and so is every count', () => {
    assert.ok(/class="hm-rw-pin" data-sel=/.test(HOME_CODE), 'a pin opens its contract');
    assert.ok(/data-hm-go="rwnone:\$\{esc\(g\.kind\)\}"/.test(HOME_CODE), 'a count opens its list');
    assert.ok(/kind==='rwnone'/.test(HOME_CODE), 'and the page’s one destination handler answers it');
  });
  test('the row and the rail speak ONE number about a quiet desk', () => {
    assert.ok(/rwSp\.past\.forEach\(r=>\{ if\(r\.kind==='wait'&&r\.it\) r\.it\.tag=/.test(HOME_CODE),
      'the tag beside a dot is the dot’s own reading');
  });
  test('the head counts the three piles off the same split', () => {
    assert.ok(/rw_sum',\{a:rwSp\.past\.length,b:rwSp\.left\.length,c:rwSp\.none\.length\}/.test(HOME_CODE));
  });
});

/* ============================================================================
   8 · BOTH BOOKS, AND NO KEY DRAWN AS ITS OWN NAME
   ==========================================================================*/
describe('f363 (8) it speaks both languages', () => {
  test('every rw_ key the card asks for is in both dictionaries', () => {
    const I18N = read('js/i18n.js');
    /* PLURALITY IS READ OFF THE CALL, never guessed from the key's spelling:
       i18tn wants _one and _other, i18t wants the key itself. */
    const asked = new Map();
    for (const m of HOME_CODE.matchAll(/\b(i18tn?)\('(rw_[a-z_]+)'/g)) asked.set(m[2], m[1]);
    assert.ok(asked.size >= 6, 'the card asks for a good few');
    asked.forEach((fn, k) => {
      (fn === 'i18tn' ? [k + '_one', k + '_other'] : [k]).forEach(kk =>
        assert.equal((I18N.match(new RegExp('\\b' + kk + ':', 'g')) || []).length, 2,
          kk + ' is in both books'));
    });
  });
});
