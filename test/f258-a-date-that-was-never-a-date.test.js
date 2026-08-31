/* f258 — A DATE THAT WAS NEVER A DATE, AND THE WAY TO FIND ONE (J-5.1)
   ========================================================================
   `signDocument` wrote the execution record with a real timestamp and then
   wrote a SECOND copy beside it — `fmtDT(at)+' EAT'` — which is the words a
   reader saw, in the reader's own LANGUAGE. That is fine while something only
   ever prints it and fatal the moment anything does arithmetic with it, and
   six things did. Measured: `slice(0,10)` of it is "12 Aug 202"; read as a
   date that is the year 202; in Swedish it is "12 aug. 20".

   AND THEN, owner-asked 31 Aug 2026: *"If I am in 2029 and i want to find a
   contract that was signed in 2021, how would i find it?"* — measured, there
   was no way to ask. So this file pins BOTH halves: the date becomes a date,
   and the page you scan gains a column, a sort and a filter that all read it.

   WHAT IS PINNED, and every one is a rule rather than a look:
     1  ONE reading, four sources, in a stated order, never a guess
     2  the DAY is the SIGNER'S day, not the UTC day
     3  no reader keeps its own arithmetic, and none falls back to the old one
     4  the reading lives where every stage can reach it
     5  the offset is RECORDED at signing, not derived from a display string
     6  the evidence pack exports a machine-readable moment
     7  a ninth column, a seventh sort, a sixth filter — Contracts only
     8  the column widths still sum to 100, on both seats
     9  the columns are draggable, and a drag is a TRADE that cannot drift
    10  both languages

   WHAT DRAWS is contracts-page-verify's and signed-date-verify's: whether the
   column is on screen, whether the grip can be taken hold of with a real
   mouse, and whether the table scrolls sideways are questions jsdom cannot
   answer at all. The two files name each other. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');
const i18n = require('../js/i18n.js');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
/* Comments carry the arguments in this codebase and would answer half of these
   assertions by accident. Every claim that reads source strips them. */
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

const NEG = strip(read('js/negotiation.js'));
const CORE = strip(read('js/core.js'));
const CHART = strip(read('js/aichart.js'));
const WS = strip(read('js/workshape.js'));
const FAM = strip(read('js/family.js'));
const DED = strip(read('js/dedupe.js'));
const ROOM = strip(read('js/views/contract.js'));
const SRV = strip(read('server/server.js'));
const REG = read('js/views/register.js');
const REG_CODE = strip(REG);

const w = buildWorld({ registerView: true });
const win = w.win;
const signedAt = win.contractSignedAt;

describe('f258 (1) — one reading, and it answers in the signer’s own day', () => {
  test('four sources, in the order the work order states', () => {
    /* 1 — a plain day somebody RECORDED outranks the day the file reached us:
       a paper filing's signedOn IS the day the parties signed. */
    assert.equal(signedAt({ execution: { at: '2026-08-20T09:00:00.000Z', signedOn: '2026-08-12' } }), '2026-08-12');
    /* 2 — the execution stamp, moved into the signer's own clock. */
    assert.equal(signedAt({ execution: { at: '2026-08-12T07:00:00.000Z', tzOffsetMin: 180 } }), '2026-08-12');
    /* 3 — a display string written before this was a date. */
    assert.equal(signedAt({ signedAt: '12 Aug 2026, 10:00 EAT' }), '2026-08-12');
    /* 4 — the trail, and the server's transport field for a light-list row. */
    assert.equal(signedAt({ audit: [{ action: 'Signed', at: '2026-08-12T07:00:00.000Z' }] }), '2026-08-12');
    assert.equal(signedAt({ _signedAt: '2026-08-12T07:00:00.000Z' }), '2026-08-12');
  });

  test('THE DAY IS THE SIGNER’S DAY, NOT THE UTC DAY', () => {
    /* 22:00 UTC on the 11th is 01:00 EAT on the 12th. Answering with the UTC
       day would put the contract in the wrong month — the fault the calendar's
       own calToday() was written for, one screen along. */
    assert.equal(signedAt({ execution: { at: '2026-08-11T22:00:00.000Z', tzOffsetMin: 180 } }), '2026-08-12');
    /* And the mirror: 01:00 UTC on the 1st is 20:00 the previous day in New York. */
    assert.equal(signedAt({ execution: { at: '2026-09-01T01:00:00.000Z', tzOffsetMin: -300 } }), '2026-08-31');
  });

  test('a legacy display string is read in EITHER language', () => {
    assert.equal(signedAt({ signedAt: '12 Aug 2026, 10:00 EAT' }), '2026-08-12');
    assert.equal(signedAt({ signedAt: '12 aug. 2026 10:00 EAT' }), '2026-08-12');
    /* The two months whose Swedish differs from their English. */
    assert.equal(signedAt({ signedAt: '03 maj 2021 09:00 CEST' }), '2021-05-03');
    assert.equal(signedAt({ signedAt: '30 okt. 2020 16:20 CET' }), '2020-10-30');
  });

  test('NEVER A GUESS — a record that says nothing answers null', () => {
    assert.equal(signedAt({}), null);
    assert.equal(signedAt(null), null);
    assert.equal(signedAt({ signedAt: 'sometime last year' }), null);
    assert.equal(signedAt({ signedAt: '' }), null);
    /* A day that is not a day is not accepted as one. */
    assert.equal(signedAt({ signedAt: '99 Foo 2021' }), null);
  });

  test('a migrated record, which stored a real date all along, is untouched', () => {
    assert.equal(signedAt({ signedAt: '2021-03-14' }), '2021-03-14');
  });
});

describe('f258 (2) — the reading lives where every stage can reach it', () => {
  test('it is beside negoExecuted, which asks the sibling question', () => {
    /* Written in core.js it would be a name half the product reaches through
       `window` on a stage that does not carry it, and every caller would fall
       back to the broken arithmetic this repair exists to remove — the
       rlPaperFootHtml class in its quietest costume. */
    assert.match(NEG, /function contractSignedAt\(c\)\{/);
    assert.ok(!/function contractSignedAt/.test(CORE), 'and it is not also declared in core.js');
    assert.match(NEG, /Object\.assign\(window,\{[^}]*contractSignedAt/, 'published');
    assert.equal(typeof win.contractSignedAt, 'function', 'and reachable on an ordinary stage');
  });

  test('NO READER FALLS BACK TO THE BROKEN ARITHMETIC', () => {
    /* A fallback to c.signedAt is the bug returning silently on any stage that
       does not carry the module — which is exactly how it survived unseen. */
    for (const [name, src] of [['chart', CHART], ['workshape', WS], ['family', FAM],
                               ['dedupe', DED], ['portfolio', strip(read('js/views/portfolio.js'))]]) {
      assert.ok(!/contractSignedAt\(\w+\)\s*:\s*\w*\.?signedAt/.test(src),
        `${name} falls back to null, never to the old reading`);
    }
  });

  test('and no reader still slices the display string', () => {
    for (const [name, src] of [['chart', CHART], ['workshape', WS], ['family', FAM], ['dedupe', DED]])
      assert.ok(!/signedAt\s*\)?\s*\.?\s*slice\(0\s*,\s*(7|10)\)/.test(src.replace(/contractSignedAt/g, '')),
        `${name} no longer takes the first characters of a sentence`);
  });

  test('the chart counts a real month', () => {
    const S = win.AI_SERIES['contracts.signed'];
    const cs = [
      { status: 'Signed', execution: { at: '2026-08-12T07:00:00.000Z', tzOffsetMin: 180 } },
      { status: 'Signed', signedAt: '12 Aug 2026, 10:00 EAT' },
      { status: 'Signed', signedAt: '2021-03-14' },
      { status: 'Draft' },
    ];
    assert.equal(S.at(cs, '2026-08'), 2, 'it returned 0 for every month before this');
    assert.equal(S.at(cs, '2021-03'), 1);
    assert.equal(S.at(cs, '2026-09'), 0);
  });
});

describe('f258 (3) — the offset is recorded, and the evidence pack is a record', () => {
  test('signing writes a DATE and records the signer’s own clock', () => {
    assert.match(ROOM, /c\.signedAt=at;/, 'the stored value is the moment, not the words');
    assert.ok(!/c\.signedAt=fmtDT\(at\)/.test(ROOM), 'the display string is gone from the record');
    assert.match(ROOM, /tzOffsetMin:\(typeof signedTzOffsetMin==='function'\?signedTzOffsetMin\(\):0\)/);
    assert.match(ROOM, /tzLabel:\(typeof signedTzLabel==='function'\?signedTzLabel\(\):''\)/);
  });

  test('the PDF reads the recorded offset first and KEEPS the old parse', () => {
    /* Every record filed before the repair still carries the old display
       string, and it is the only thing that knows their wall clock. */
    assert.match(SRV, /rex\.tzOffsetMin/, 'the recorded fact is read');
    assert.match(SRV, /const sm = \/\^\(\\d\{1,2\}\) \(\\w\{3\}\)/, 'and the legacy parse is still there');
  });

  test('the evidence pack exports a moment, not a sentence in somebody’s language', () => {
    assert.match(CORE, /signedAt:\(c\.execution&&c\.execution\.at\)\|\|null/);
    assert.match(CORE, /signedOn:\(typeof window\.contractSignedAt==='function'\?contractSignedAt\(c\):null\)/);
    assert.match(CORE, /signedLabel:contractSignedLabel\(c\)/, 'with a human copy beside it');
  });

  test('the server keeps its own twin, and it answers identically', () => {
    assert.match(SRV, /function contractSignedOn\(c\) \{/);
    /* The four seal panels go through ONE builder, so a PDF and its HTML twin
       cannot word the same moment differently. */
    assert.match(SRV, /function sealWhen\(c\) \{/);
    assert.equal((SRV.match(/sealWhen\(c\)/g) || []).length >= 4, true);
  });
});

describe('f258 (4) — the column, the sort and the filter', () => {
  test('ONE reading, four surfaces — none of them derives a signed date', () => {
    assert.match(REG_CODE, /const regSignedOn = c => \(typeof window\.contractSignedAt==='function' \? contractSignedAt\(c\) : null\) \|\| null;/);
    /* The cell, the comparator, the year list and the narrowing all ask it. */
    for (const anchor of ['function regSignedCell', 'signed:(a,b)=>', 'function regSignedYears', "if(R.signed&&R.signed!=='all')"])
      assert.ok(REG_CODE.includes(anchor), anchor + ' exists');
    assert.equal((REG_CODE.match(/regSignedOn\(/g) || []).length >= 4, true,
      'four callers, and no fifth reading of its own');
  });

  test('a contract with no signature sorts LAST in both directions', () => {
    /* A SENTINEL CANNOT DO THIS, which is why the comparator asks which way it
       is being read: regFiltered sorts with `dir*cmp`, so a value that puts the
       unsigned last ascending puts them FIRST descending — and the default here
       is newest-first, which would open on a screen of em-dashes. Driven both
       ways rather than read, because the multiplication is the whole trap. */
    const src = REG_CODE.slice(REG_CODE.indexOf('signed:(a,b)=>'));
    assert.match(src.slice(0, 400), /const d=\(regState\(\)\.dir===1\?1:-1\);/,
      'the direction is asked, not assumed');
    const A = { execution: { at: '2021-03-14T09:00:00.000Z', tzOffsetMin: 0 } };
    const B = { execution: { at: '2026-08-12T07:00:00.000Z', tzOffsetMin: 0 } };
    const N = {};
    win.state = Object.assign(win.state || {}, { contracts: [] });
    for (const dir of [1, -1]) {
      const R = win.regState(); R.dir = dir; R.sort = 'signed';
      const cmp = win.REG_CMP ? win.REG_CMP.signed : null;
      if (!cmp) continue;
      /* What regFiltered actually applies is dir*cmp. */
      const order = [N, B, A].slice().sort((a, b) => dir * cmp(a, b));
      assert.equal(order[order.length - 1], N,
        `the unsigned contract is last at dir ${dir}`);
      assert.notEqual(order[0], N);
    }
  });

  test('the year list holds only years this book was signed in, newest first', () => {
    win.state = Object.assign(win.state || {}, { contracts: [
      { id: 'A', signedAt: '2021-03-14' },
      { id: 'B', signedAt: '2024-01-11' },
      { id: 'C', signedAt: '2021-09-02' },
      { id: 'D' },
    ]});
    assert.deepEqual([...win.regSignedYears()], ['2024', '2021'],
      'no duplicates, no empty years, newest first');
  });

  test('this year and last year resolve against the clock, not a frozen option', () => {
    const y = new Date().getFullYear();
    assert.equal(win.regSignedYear('this'), String(y));
    assert.equal(win.regSignedYear('last'), String(y - 1));
    assert.equal(win.regSignedYear('2021'), '2021');
  });

  test('the filter is in the catalogue and NOT in the default four', () => {
    const keys = win.REG_BAR_FILTERS.map(f => f.k);
    assert.ok(keys.includes('signed'), 'it is offered under Adapt filters');
    assert.ok(!win.REG_BAR_DEFAULT.includes('signed'),
      'and it costs the bar nothing until a reader asks for it');
    /* THE SAFETY PROPERTY, asserted on THIS filter rather than inherited on
       trust: a control that is narrowing draws whether it was chosen or not. */
    assert.equal(win.regFilterActive('signed', { signed: '2021' }), true);
    assert.equal(win.regFilterActive('signed', { signed: 'all' }), false);
  });

  /* ---- THE CUT IN FORCE IS ALWAYS ON THE LIST ----
     The stream picker's rule, pointed the other way: there it is the RECORD
     that must not be silently re-filed, here it is the READER who must not be
     stranded. The years come off the book, so a chosen cut can leave the list
     under somebody — the last 2021 contract deleted, or a page left open over
     New Year while "This year" resolves to a year nothing is signed in. The
     select would then read "Any" over a narrowed, empty table.
     PINNED ON THE BUILDER'S OWN SHAPE, because the options are built inside
     the renderer and there is no seam to call. */
  test('a chosen year that has left the book is still offered, labelled by its year', () => {
    const src = REG.slice(REG.indexOf('const signedOpts='), REG.indexOf('const catOpts='));
    assert.match(src, /const cur=R\.signed\|\|'all';/);
    assert.match(src, /if\(cur!=='all' && !opts\.some\(\(\[k\]\)=>k===cur\)\) opts\.push\(\[cur, regSignedYear\(cur\)\]\)/,
      'appended when nothing else offers it, and named by regSignedYear so a ' +
      'stale "this" reads as the year rather than as a window it no longer names');
    /* and the SELECTED attribute is decided from that same one reading, so the
       list and the mark cannot disagree about which cut is in force */
    assert.ok(!/R\.signed\|\|'all'\)===k/.test(src),
      'the selected test reads `cur`, never a second copy of the same fallback');
  });

  test('the Negotiations seat draws no Signed column and no Signed filter', () => {
    assert.match(REG, /\$\{neg\?'':sortableTh\('signed'/);
    assert.match(REG, /\$\{neg\?'':`<td style="white-space:nowrap">\$\{regSignedCell\(c\)\}<\/td>`\}/);
    assert.match(REG, /\$\{\(!neg&&BAR\.includes\('signed'\)\)\?selFilter\('reg-signed'/);
  });

  test('Clear clears it, and it counts as a filter', () => {
    assert.match(REG_CODE, /const filtered=[^;]*R\.signed&&R\.signed!=='all'/);
    assert.match(REG_CODE, /reg-clear-filters'\)\?\.addEventListener\('click',\(\)=>\{[^}]*R\.signed='all';/);
  });
});

describe('f258 (5) — the columns are draggable, like a spreadsheet', () => {
  test('THE WIDTHS SUM TO 100 ON BOTH SEATS, and that is not negotiable', () => {
    assert.equal(win.REG_COL_W.reduce((a, b) => a + b, 0), 100);
    assert.equal(win.REG_COL_W_NEGO.reduce((a, b) => a + b, 0), 100);
    assert.equal(win.REG_COL_W.length, win.REG_COL_KEYS.length, 'one width per column');
    assert.equal(win.REG_COL_W_NEGO.length, win.REG_COL_KEYS_NEGO.length);
    assert.equal(win.REG_COL_KEYS.length - win.REG_COL_KEYS_NEGO.length, 1,
      'Contracts has exactly one column Negotiations has not — Signed');
    assert.ok(win.REG_COL_KEYS.includes('signed'));
    assert.ok(!win.REG_COL_KEYS_NEGO.includes('signed'));
  });

  test('a drag is a LOCAL TRADE and the total can never drift', () => {
    const t = win.regColTrade, base = [10, 20, 30, 40];
    assert.deepEqual([...t(base, 1, 25, 4)], [10, 25, 25, 40], 'only the pair moves');
    for (const want of [-50, 0, 3, 25, 60, 999])
      assert.equal(t(base, 1, want, 4).reduce((a, b) => a + b, 0), 100,
        'and the total holds whatever the pointer does');
  });

  test('a column can never be dragged to nothing', () => {
    const t = win.regColTrade, base = [10, 20, 30, 40];
    assert.deepEqual([...t(base, 1, 1, 4)], [10, 4, 46, 40], 'the floor bites on the left');
    assert.deepEqual([...t(base, 1, 99, 4)], [10, 46, 4, 40], 'and on the right');
    /* A pair too narrow to hold two floors is LEFT ALONE rather than fudged:
       splitting it would push both columns under the floor, which is the state
       the floor exists to prevent. */
    assert.deepEqual([...t([10, 3, 3, 84], 1, 2, 4)], [10, 3, 3, 84]);
  });

  test('a stored array that cannot be honoured is IGNORED, not applied', () => {
    /* This is the whole migration story for the Signed column: a browser that
       stored eight widths before it existed must fall back to the defaults
       rather than shift every column one place left. */
    const def = [...win.regColDefaults()];
    const key = 'hati.v1.regCols';
    win.localStorage.setItem(key, JSON.stringify([1, 2, 3]));
    assert.deepEqual([...win.regColWidths()], def, 'a wrong length falls back');
    win.localStorage.setItem(key, JSON.stringify(def.map(() => 5)));
    assert.deepEqual([...win.regColWidths()], def, 'a total that is not 100 falls back');
    win.localStorage.setItem(key, 'not json');
    assert.deepEqual([...win.regColWidths()], def, 'and so does junk');
    const good = def.slice(); good[0] += 2; good[1] -= 2;
    win.localStorage.setItem(key, JSON.stringify(good));
    assert.deepEqual([...win.regColWidths()], good, 'a real one is honoured');
    win.regColReset();
    assert.deepEqual([...win.regColWidths()], def, 'and reset means "nobody has chosen"');
  });

  test('the head takes its widths from the ONE list, and carries the grip', () => {
    assert.match(REG, /const COLW=regColWidths\(\);/);
    assert.match(REG, /const colAt=\(extra=''\)=>\{ const i=_colN\+\+; return `width:\$\{COLW\[i\]\}%/);
    assert.ok(!/width:\d+%/.test(REG.slice(REG.indexOf('<th style="${colAt()}">MK'), REG.indexOf('</tr>', REG.indexOf('<th style="${colAt()}">MK')))),
      'no column head still types a width of its own');
    assert.match(REG, /const gripFor=i=>\(i>=COLW\.length-1\) \? '' :/,
      'the LAST column carries no grip — it has nothing to its right to trade with');
  });

  test('a press on the grip is a drag and NEVER a sort', () => {
    /* The head around it is itself a control; without this every resize would
       also re-order the book underneath the reader. */
    const down = REG_CODE.slice(REG_CODE.indexOf('const down = e => {'), REG_CODE.indexOf('const move = e => {'));
    assert.match(down, /e\.preventDefault\(\); e\.stopPropagation\(\);/);
    /* MEASURED FROM WHERE THE POINTER IS, never distance travelled — the rule
       the negotiation divider and Key terms both state in their own words. */
    const move = REG_CODE.slice(REG_CODE.indexOf('const move = e => {'), REG_CODE.indexOf('const up = () => {'));
    assert.match(move, /e\.clientX - drag\.rect\.left/);
    assert.ok(!/movementX|deltaX/.test(move), 'and never a delta');
  });

  test('one listener, armed once on the document', () => {
    assert.match(REG_CODE, /if\(document\._regColWired\) return;\s*document\._regColWired = true;/);
    assert.match(REG_CODE, /document\.addEventListener\('pointerdown', down\)/);
    /* And it takes the keyboard: a control reachable only by mouse is not
       reachable — the same reason the column heads gained Enter and Space. */
    assert.match(REG_CODE, /e\.key === 'ArrowLeft'/);
    assert.match(REG_CODE, /dblclick/, 'double-click puts it back');
  });
});

describe('f258 (6) — both languages', () => {
  for (const lang of ['en', 'sv']) {
    test(`${lang}: every new word is there and says something`, () => {
      const d = i18n.STRINGS[lang];
      for (const k of ['reg_col_signed', 'reg_sort_signed', 'reg_signed', 'reg_signed_title',
                       'reg_signed_this_year', 'reg_signed_last_year', 'reg_col_drag'])
        assert.ok(d[k] && String(d[k]).trim(), `${lang}.${k}`);
    });
  }
  test('and the two languages do not say the same thing', () => {
    for (const k of ['reg_col_signed', 'reg_signed_this_year', 'reg_col_drag'])
      assert.notEqual(i18n.STRINGS.en[k], i18n.STRINGS.sv[k], k + ' is translated');
  });
});
