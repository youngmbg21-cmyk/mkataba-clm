/* ============================================================
   F458 — The owner's eleven
   ============================================================
   Eleven things, written down over four messages on 3 and 4 October 2026 and
   held as a list until he said *"go ahead and build"*. Each is small; what
   they have in common is that every one of them is something a reader sees
   and nobody had measured.

     1  map the five new features in the Brain
     2  "Remove waiting on you from the home page permanently" — f450
     3  "delete export button from the document page"
     4  "Delete counting and all contracts from the top of the home page"
     5  "Delete the date and the … update … that comes after the greeting"
     6  "The value under contract card … currently cuts off"
     7  "the height of the calendar changes when you navigate around the
        buttons in the page. This should not happen"
     8  "the date boxes should have rounded corners like the cards across the
        platform"
     9  "when in dark mode you still have white patches. Fix this across the
        platform"
    10  "More button in the calendar page does not have an outline"
    11  "The x button to exit a card in the home page dashboards should always
        be on the right corner of a card"

   WHAT IS HERE AND WHAT IS NOT. 2 and 4 have their own files (f450, f447),
   because each reverses a ruling and the reversal needs its story beside it.
   Everything a browser has to answer — that the month really does keep its
   height, that the x really does land in the corner, that nothing paints
   white at night — is measured in calendar-holds-still-verify,
   dark-no-white-patches-verify and home-one-list-verify, with the before
   figures recorded in MAP-HISTORY. This file holds what source can answer:
   that the thing was removed, that the rule exists, and that it is written
   where it cannot be undone by accident.
   ============================================================ */
const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
/* Comments off first: this codebase explains itself at length and names the
   things it has removed. The rulebook's own lesson (f354). */
const code = s => s.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1 ');

const HTML = read('index.html');
const CAL = read('js/views/calendar.js');
const BOARD = read('js/views/homeboard.js');
const CONTRACT = read('js/views/contract.js');
const JX = read('js/jurisdiction.js');
const BRAIN = read('js/brainmap.js');
const I18N = read('js/i18n.js');

/* ---------------------------------------------------------------- 1 ---- */
describe('f458 (1) — the five new features are on the Brain', () => {
  const PARTS = ['suggest', 'here', 'follow', 'baton', 'guestcode', 'stands'];

  test('each is a named part in the catalogue', () => {
    const list = BRAIN.slice(BRAIN.indexOf('const BRAIN_PARTS = ['), BRAIN.indexOf('].map((a, i)'));
    for (const id of PARTS)
      assert.ok(new RegExp(`\\['${id}',`).test(list), id + ' is not in BRAIN_PARTS');
  });

  test('and each names a function or a route the reading can find', () => {
    /* The catalogue is hand-written and the reading is not: a part whose code
       name has drifted draws as "missing" on the page. These six are read
       against the real files by the brain stage; here we only hold the names
       that were measured as found. */
    for (const [id, codeName] of [['suggest', 'deskStampOnFile'], ['here', 'presenceHere'],
      ['follow', 'presenceWalk'], ['baton', 'clauseLockAsk'], ['guestcode', 'shareNeedsCode'],
      ['stands', 'dealStands']])
      assert.ok(BRAIN.includes(`['${id}', '${codeName}'`), id + ' no longer names ' + codeName);
  });

  test('every one of them stands in a flow, so the story walks through it', () => {
    const flows = BRAIN.slice(BRAIN.indexOf('const BRAIN_FLOWS = ['), BRAIN.indexOf('/* Where a part'));
    for (const id of PARTS)
      assert.ok(new RegExp(`'${id}'`).test(flows), id + ' is named nowhere in the six flows');
  });

  test('no step was inserted, so no sentence was renumbered', () => {
    const flows = BRAIN.slice(BRAIN.indexOf('const BRAIN_FLOWS = ['), BRAIN.indexOf('/* Where a part'));
    const steps = f => (flows.match(new RegExp(`id: '${f}', steps: \\[(.*?)\\] \\}`))[1].match(/\[/g) || []).length;
    assert.equal(steps('redline'), 10, 'the redline flow still has ten steps');
    assert.equal(steps('round'), 8, 'the round flow still has eight');
  });

  test('the two new files know which area they sit in', () => {
    const region = BRAIN.slice(BRAIN.indexOf('const BRAIN_FILE_REGION'), BRAIN.indexOf('function brainRegionOfFile'));
    assert.match(region, /presence/, 'js/presence.js would default to the wall');
    assert.match(region, /dealstands/, 'js/dealstands.js would default to the wall');
  });

  for (const id of PARTS)
    test(`brn_p_${id} and brn_pd_${id} are in both books`, () => {
      for (const k of ['brn_p_' + id, 'brn_pd_' + id]){
        const n = I18N.split('\n').filter(l => new RegExp(`^\\s*${k}:`).test(l)).length;
        assert.equal(n, 2, `${k} should stand in both books exactly once (found ${n})`);
      }
    });
});

/* ---------------------------------------------------------------- 3 ---- */
describe('f458 (3) — the Export door is off the Document page', () => {
  test('the control row draws no export menu', () => {
    /* THE REGION, NEVER A BYTE COUNT: a window of 3,000 characters read the
       whole builder here and stopped short of the menu at the parent, so the
       check passed against the very code it was written to refuse. */
    const at = CONTRACT.indexOf('function wsTabRowEndHtml');
    const row = CONTRACT.slice(at, CONTRACT.indexOf('\nfunction ', at + 10));
    assert.ok(row.length > 500 && row.length < 12000, 'the builder was not found whole: ' + row.length);
    assert.ok(!code(row).includes('ws-export'), 'the second door is back on the row');
  });

  test('nothing is wired to it, and its dress is gone', () => {
    assert.ok(!code(CONTRACT).includes('data-ws-export-go'), 'the proxy handler is still armed');
    assert.ok(!/#ws-tabrow-end \.ws-export/.test(HTML), 'the menu still has styles');
  });

  test('ALL THREE EXPORTS ARE STILL THERE, under the ⋯ menu', () => {
    for (const id of ['ws-pdf', 'ws-word', 'ws-pdf-record'])
      assert.ok(CONTRACT.includes(`id="${id}"`), id + ' went with the door');
    assert.match(CONTRACT, /mgroup">\$\{i18t\('ct_export'\)\}/, 'and under their own Export heading');
  });
});

/* ---------------------------------------------------------------- 5 ---- */
describe('f458 (5) — the greeting stands alone', () => {
  const hello = BOARD.slice(BOARD.indexOf('function hbHelloInner'), BOARD.indexOf('function hbHeadHtml'));

  test('it returns the name and nothing after it', () => {
    assert.match(hello, /return `<h1>\$\{_hbE\(greet\)\}, \$\{_hbE\(first\)\}<\/h1>`;/);
    assert.ok(!code(hello).includes('<span>'), 'the sub-line is back');
  });

  test('neither the day nor the count is worked out any more', () => {
    assert.ok(!code(hello).includes('toLocaleDateString'), 'the date is still being built');
    assert.ok(!code(hello).includes('hbAgentsData'), 'the count is still being read');
  });

  test('and the words it used stay inert in both books', () => {
    for (const k of ['hb_ready_for_you_one', 'hb_ready_for_you_other']){
      const n = I18N.split('\n').filter(l => new RegExp(`^\\s*${k}:`).test(l)).length;
      assert.equal(n, 2, k);
    }
  });
});

/* ---------------------------------------------------------------- 6 ---- */
describe('f458 (6) — the money shortener steps up to billions', () => {
  /* The function, lifted out and run — one arithmetic, read by every figure
     on every screen, so the rungs are checked by what they print. */
  const src = JX.slice(JX.indexOf('const fmtMoneyShortIn'), JX.indexOf('const fmtMoneyShort ='));
  // eslint-disable-next-line no-new-func
  const fn = new Function('jxCurrency', 'return ' + src.replace(/^const fmtMoneyShortIn = /, '').replace(/;\s*$/, ''))(() => 'KES');

  test('a billion is said in billions, not four figures of millions', () => {
    assert.equal(fn(3.6e9, 'KES'), 'KES 3.60B');
    assert.equal(fn(1e9, 'KES'), 'KES 1B');
  });

  test('every rung below it is exactly what it was', () => {
    assert.equal(fn(4.5e6, 'KES'), 'KES 4.50M');
    assert.equal(fn(1e6, 'KES'), 'KES 1M');
    assert.equal(fn(12000, 'KES'), 'KES 12K');
    assert.equal(fn(999, 'KES'), 'KES 999');
  });

  test('and nothing that fitted before got longer', () => {
    for (const v of [999, 12000, 1e6, 4.5e6, 9.99e8])
      assert.ok(fn(v, 'KES').length <= 'KES 999.99M'.length, String(v) + ' → ' + fn(v, 'KES'));
    assert.ok(fn(3.6e9, 'KES').length < 'KES 3600M'.length + 1,
      'the figure the owner photographed must not be longer than it was');
  });
});

/* ------------------------------------------------------------- 7 8 10 --- */
describe('f458 (7) — the calendar keeps its height', () => {
  /* RE-POINTED IN PLACE 9 Oct 2026 (SAP benchmark, batch 2 — the drawing
     is the target): the agenda moved BESIDE the month. The month is sized by
     the page alone; the agenda is a column of one width, never taller than
     the month. The rule this pins is unchanged: the agenda cannot move the
     month. calendar-holds-still-verify measures it in a browser. */
  test('the agenda is a column of ONE width beside the month, capped at its height', () => {
    assert.match(CAL, /\.cal-stack > \.cal-panel\{flex:0 0 var\(--cal-side-w\);min-height:0;max-height:100%\}/,
      'a fixed width that does not shrink, and never taller than the month beside it');
    assert.match(CAL, /--cal-side-w:clamp\(360px,32vw,460px\)/, 'and the number is written once');
    assert.match(CAL, /\.cal-stack:not\(\.is-wide\)\{flex-direction:row;align-items:flex-start/,
      'side by side, the agenda as tall as its rows');
  });

  test('the agenda still scrolls inside it, so nothing is hidden by the cap', () => {
    assert.match(CAL, /\.cal-upn-list\{flex:1;min-height:0;overflow-y:auto\}/);
  });

  test('the month keeps its floor, so a short screen squeezes the panel first', () => {
    /* the month sits in its own column (.cal-month) since 9 Oct 2026 */
    assert.match(CAL, /\.cal-month > \.cal-grid\{flex:1 1 auto;min-height:440px/);
  });

  test('and below 1024 the panel takes its content back, because the PAGE scrolls', () => {
    /* One height is what stops the month resizing on a page that cannot
       scroll. Stacked, the page does scroll, and a fixed panel would put a
       second scroller inside it — the trap that block's own note names. */
    const narrow = CAL.slice(CAL.indexOf('@media (max-width:1023px)'), CAL.indexOf('@media print'));
    assert.match(narrow, /\.cal-stack > \.cal-panel\{flex:none;max-height:none\}/);
    assert.match(narrow, /\.cal-stack:not\(\.is-wide\)\{flex-direction:column/, 'and stacks under the month again');
  });
});

describe('f458 (8) — the date boxes are rounded tiles', () => {
  test('a day carries the card radius and an edge of its own', () => {
    const day = CAL.slice(CAL.indexOf('  .cal-day{'), CAL.indexOf('.cal-day.is-mute'));
    assert.match(day, /border-radius:var\(--radius-lg\)/, 'the radius CLAUDE.md names for a card');
    assert.match(day, /border:1px solid var\(--color-divider\)/,
      'without an edge a surface-coloured tile on a surface-coloured card is invisible');
  });

  test('the grey backing that drew the old grid lines is gone', () => {
    const wk = CAL.slice(CAL.indexOf('  .cal-weeks{'), CAL.indexOf('  .cal-day{'));
    assert.match(wk, /background:none/, 'a radius over a grey backing leaves four wedges per corner');
    assert.ok(!/gap:1px/.test(wk), 'and the hairline gap became a real one');
  });

  test('the day-name band takes the same gap, or its labels stop lining up', () => {
    const dow = CAL.slice(CAL.indexOf('  .cal-dow{'), CAL.indexOf('  .cal-dow span{'));
    assert.match(dow, /column-gap:var\(--s-1\)/);
    assert.match(dow, /padding:0 var\(--s-1\)/);
  });
});

describe('f458 (10) — the calendar\'s More button wears the row\'s outline', () => {
  test('it is an ordinary button, dressed like every other More', () => {
    const btn = CAL.slice(CAL.indexOf('id="cal-more"') - 160, CAL.indexOf('id="cal-more"') + 40);
    assert.ok(!/ui-btn-plain/.test(btn), '.ui-btn-plain declares a transparent border');
    /* + cal-more-ic since 9 Oct 2026 (SAP benchmark, batch 2): the drawing's
       ⋯ is a square icon button; the shared dress is unchanged under it */
    assert.match(btn, /class="ui-btn ws-more-btn( cal-more-ic)?"/, 'the shared dress every other More wears');
  });

  test('and that dress still exists to be worn', () => {
    assert.match(HTML, /\.ws-more-btn\{/);
  });
});

/* ---------------------------------------------------------------- 9 ---- */
describe('f458 (9) — the two pale accent rungs have a dark answer', () => {
  const _d0 = HTML.indexOf('  :root.dark{');
  const dark = HTML.slice(_d0, HTML.indexOf('}', _d0) + 1);

  test('both are declared for the night', () => {
    assert.match(dark, /--color-accent-50:rgb\(var\(--color-accent-500-rgb\)\/\.08\)/);
    assert.match(dark, /--color-accent-100:rgb\(var\(--color-accent-500-rgb\)\/\.16\)/);
  });

  test('written in channels, so the wash follows whichever brand is on', () => {
    assert.ok(!/#[0-9a-fA-F]{6}/.test(dark), 'a hex here would freeze the teal onto the navy workspace');
  });

  test('it is the SAME answer the compiled utilities already give', () => {
    assert.match(HTML, /html\.dark \.bg-brand-50[^}]*rgb\(var\(--color-accent-500-rgb\)\/\.08\)/,
      'bg-brand-50 and a hand-written accent-50 must paint one colour at night');
    assert.match(HTML, /html\.dark \.bg-brand-100\{background-color:rgb\(var\(--color-accent-500-rgb\)\/\.16\)/);
  });

  test(':root.dark, and after the brand blocks — or navy keeps the white patch', () => {
    const navy = HTML.indexOf(':root[data-brand="navy"]{');
    assert.ok(navy > 0 && HTML.indexOf('  :root.dark{') > navy,
      ':root[data-brand="navy"] (0,2,0) outranks html.dark (0,1,1); the tie is broken by order');
  });

  test('daylight is untouched: the light values are where they were', () => {
    /* RE-PINNED 7 Oct 2026: Young moved the palette to the HaTi Platform
       mockup's brighter brand (#12796D / #264C9E), whose tint and soft rungs
       these are. The claim stands — the dark answer leaves daylight alone. */
    assert.match(HTML, /--color-accent-50:#F1F9F7;/);
    assert.match(HTML, /--color-accent-100:#E3F3EF;/);
    assert.match(HTML, /--color-accent-50:#f0f4fb;/);
  });

  test('and the inks that sat ON the wash read the accent ink, not a dark rung', () => {
    /* accent-800 on a dark wash is dark on dark. --accent-ink is accent-700 by
       day and accent-400 at night, so one token answers both. */
    for (const [file, mark] of [
      ['js/views/contract.js', "b.style.color=on?'var(--accent-ink)'"],
      /* the Activity & comments card's avatar (color:${internal?…}) left the
         Document tab with the card, 5 Oct 2026 (the Thread) */
      ['js/views/settings.js', "'var(--accent-ink)'"],
      ['js/wizard.js', "color:${r.std?'#fff':'var(--accent-ink)'}"]])
      assert.ok(read(file).includes(mark), file + ' still pairs a dark ink with the wash');
  });
});

/* --------------------------------------------------------------- 11 ---- */
describe('f458 (11) — the x that closes a card is in its right corner', () => {
  test('the corner is a rule, not an arrangement', () => {
    assert.match(HTML, /\.hb-ch \.hb-x\{margin-left:auto\}/);
  });

  test('every card on the board that closes carries it', () => {
    /* The three: Copilot's prepared work, the focus card a question digs
       into, and a panel. The focus card is the one that was wrong — nothing
       before its controls took the free space, so they huddled by the title. */
    /* and since 4 Oct 2026 a fourth: a view kept from today's insights is a
       panel of its own (hbViewPanelHtml), closed the same way. The shelf's
       per-picture "let go" is not a card's close and wears hb-ins-x. */
    const xs = (BOARD.match(/class="hb-ib hb-x"/g) || []).length;
    assert.equal(xs, 4, 'expected four card-closing x buttons, found ' + xs);
    for (const door of ['data-hb-prep="closed"', 'data-hb-crumb="-1"', 'data-hb-act="x"'])
      assert.ok(new RegExp('class="hb-ib hb-x"[^>]*' + door.replace(/"/g, '"')).test(BOARD)
        || new RegExp(door.replace(/"/g, '"') + '[^>]*class="hb-ib hb-x"').test(BOARD),
        door + ' is not the one wearing hb-x');
  });

  test('ONE thing takes the free space in a head, never two auto margins', () => {
    /* Two of them SPLIT it. The panel head already had margin-left:auto on
       .hb-src, so with a second one on the x the chip stopped at the middle
       and the x sat forty measured pixels adrift from the buttons it belongs
       to. Every head now takes the space with .hb-cs or a .hb-grow spacer,
       and the x's auto margin is the guarantee that resolves to nothing. */
    const src = HTML.slice(HTML.indexOf('  .hb-src{'), HTML.indexOf('\n', HTML.indexOf('  .hb-src{')));
    assert.ok(!/margin-left:auto/.test(src), '.hb-src still takes the space with an auto margin');
    const panel = BOARD.slice(BOARD.indexOf('<section class="hb-card hb-panel'), BOARD.indexOf('</header>', BOARD.indexOf('<section class="hb-card hb-panel')));
    assert.match(panel, /<span class="hb-grow"><\/span>/, 'the panel head has nothing taking its free space');
  });

  test('and the focus card no longer huddles its controls against the title', () => {
    const head = BOARD.slice(BOARD.indexOf('<section class="hb-card hb-dig'), BOARD.indexOf('</header>', BOARD.indexOf('<section class="hb-card hb-dig')));
    assert.match(head, /<span class="hb-grow"><\/span>/,
      'the group needs the free space taken before it, or only the x moves right');
  });
});
