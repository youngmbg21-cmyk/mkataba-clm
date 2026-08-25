/* f240 — FIVE OFF FIVE SCREENSHOTS (owner-asked 23 Aug 2026)
   =========================================================
   Five reports in one message, and the first is the only one that is a defect
   rather than a preference:

     1. "advise why these alerts have the contract numbers named twice."
     2. "reduce the size of the stripe by 1 third and move the all, mine,
        their to sit next to tracked changes as opposed to below it."
     3. "publish round should not be bold."
     4. "your turn should always be at the top of the alert."
     5. the two lists with every row at one size and one weight, colours kept.

   WHY THIS FILE IS SOURCE-READING AND ITS TWIN IS NOT, said out loud rather
   than left to be discovered. buildWorld deliberately never loads the shell
   (f215's rule), so buildAlerts, alertsPanelHtml and the register's own
   <style> block cannot be DRIVEN here at all — and three of the five reports
   are about COMPUTED pixels, which is a question only a browser can answer
   and which this codebase has been caught by more than once (.rl-rej read
   border-width 0 for a year while a source-reading test passed on it). So the
   division is deliberate:

     · here — the claims that are about what the code SAYS: the fallback that
       printed a reference twice, the running order being a list rather than a
       special case, the exclusion that kept one button bold, and the sweep
       that fails on the next row cell written large or bold;
     · flat-rows-and-alerts-verify — the claims that are about what DRAWS: the
       band's real height, the caption really sharing the tabs' line, the row
       really carrying one size, and the panel really putting your own
       signature first.

   PIN THE RELATION, NOT THE NUMBER, wherever the claim is really a relation.
   The 1,994-size sweep of 22 Aug cost five test edits and four of them were
   exactly that mistake. So the register sweep asks "is anything in a row set
   larger or bolder than the row" rather than naming 14, and the band asks for
   a third off rather than for 32px. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

const APP = read('js/app.js');
const NCSS = read('js/views/negotiation-css.js');
const REG = read('js/views/register.js');
const IDX = read('index.html');

/* Comments carry the arguments in this codebase and would answer half of these
   assertions by accident. Every claim below reads the code with them gone. */
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

const fnBody = (src, name) => {
  const i = src.indexOf(name);
  assert.ok(i > -1, name + ' is not in this file any more');
  return src.slice(i, i + 1400);
};

/* ============================================================ 1 — NAMED ONCE */
describe('f240 (1) — an alert names its contract once', () => {
  const push = fnBody(strip(APP), 'const push=(kind,c,text,go,extra)');

  test('the name no longer falls back to the reference', () => {
    assert.ok(!/name:c\?\(c\.name\|\|c\.id\)/.test(push),
      'the fallback IS the bug: the row prints the id on its own line already, '
      + 'so a contract with no name printed its reference twice');
  });

  test('and a name that IS the reference counts as the same duplicate', () => {
    assert.match(push, /nm\s*!==\s*\(?\s*c\s*&&\s*c\.id\s*\)?/,
      'a contract genuinely named "MK-324" is the reported fault in other clothes');
  });

  test('the row draws the name line only when there is a name', () => {
    const rows = strip(APP).match(/data-alert-i="\$\{i\}"[\s\S]{0,1600}/)[0];
    assert.match(rows, /\$\{a\.name\?`<span[^`]*\$\{esc\(a\.name\)\}<\/span>`:''\}/,
      'an empty name must draw no line at all, never an empty one');
    assert.match(rows, /\$\{esc\(a\.id\)\}/, 'the reference itself still prints');
  });
});

/* ====================================================== 2 — THE COLUMN HEAD */
describe('f240 (2) — the stripe is a third shorter and the caption shares the line', () => {
  test('the band is at least a third shorter than the 50px it measured', () => {
    const band = strip(NCSS).match(/\.rl-unsent\{[\s\S]*?\}/)[0];
    const go = strip(NCSS).match(/\.rl-unsent-go\{[\s\S]*?\}/)[0];
    const h = Number((go.match(/height:(\d+)px/) || [])[1]);
    const padY = Number((band.match(/padding:(\d+)px/) || [])[1]);
    assert.ok(h && padY != null, { h, padY });
    /* The BUTTON is what set the old height, which is why trimming the padding
       alone could never have bought a third. 30 + 9 + 9 + 2 borders = 50. */
    const now = h + padY * 2 + 2;
    assert.ok(now <= Math.round(50 * 2 / 3), `band measures ${now}px, wanted ≤ 33`);
  });

  test('its type came down with it, or the sentence reads as clipped', () => {
    const s = strip(NCSS);
    for (const cls of ['rl-unsent-n', 'rl-unsent-s', 'rl-unsent-go']){
      const r = s.match(new RegExp('\\.' + cls + '\\{[\\s\\S]*?\\}'))[0];
      const px = Number((r.match(/font-size:(\d+)px/) || [])[1]);
      assert.ok(px && px < 14, cls + ' is still ' + px + 'px');
    }
  });

  test('NOTHING ABOUT THE WARNING ITSELF MOVED — this is a height, not a redesign', () => {
    const band = strip(NCSS).match(/\.rl-unsent\{[\s\S]*?\}/)[0];
    assert.match(band, /var\(--st-amber-line\)/);
    assert.match(band, /var\(--st-amber-bg\)/);
    const go = strip(NCSS).match(/\.rl-unsent-go\{[\s\S]*?\}/)[0];
    assert.match(go, /var\(--st-amber-fg\)/, 'the send keeps the amber it always had');
  });

  test('the caption no longer claims a whole line to itself', () => {
    const k = strip(NCSS).match(/\.rl-idx-k\{[\s\S]*?\}/)[0];
    assert.ok(!/flex:1 0 100%/.test(k), k);
    assert.match(k, /flex:1 1 auto/, 'it takes what is left and pushes the tabs right');
    assert.ok(!/padding-top/.test(k),
      'that padding pushed a caption sitting ABOVE the tabs down toward them; '
      + 'beside them it pushes it off the head’s own centre');
  });

  test('and no short-window rule puts the padding back', () => {
    assert.ok(!/\.rl-idx-k\{padding-top/.test(strip(NCSS)),
      'the two @media overrides went with the line');
  });

  test('THE WRAP IS KEPT — a narrow column may still drop the tabs', () => {
    const head = strip(NCSS).match(/\.rl-idx-head\{[\s\S]*?\}/)[0];
    assert.match(head, /flex-wrap:wrap/,
      'at the 300px the divider still allows, two lines beats a crushed caption');
    assert.match(head, /align-items:center/,
      'what lines a 12px caption up against a 30px tab block');
  });
});

/* ================================================== 3 — NOTHING IN THE HEAD IS BOLD */
describe('f240 (3) — Publish Round is not bold', () => {
  const rule = strip(NCSS).match(/#ws-head \.room-acts button:not\([^{]*\{font-weight:400\}/)[0];

  test('the head-row weight rule no longer excludes the lead act', () => {
    assert.ok(!/\.rl-btn-go/.test(rule), rule);
  });

  test('it is still scoped to the HEAD, so the fold ladder is untouched', () => {
    assert.match(strip(NCSS), /\.redline-page #ws-head \.room-acts button:not/,
      '.rl-btn also draws on the control bar, whose metrics feed rlFitTabRow');
    const bar = strip(NCSS).match(/\.rl-btn\{[\s\S]*?\}/)[0];
    assert.match(bar, /font-weight:700/, 'the control bar keeps its own weight');
  });

  test('and BOTH buttons wearing the class change, not just the reported one', () => {
    assert.ok(!/\.rl-btn-go[^{]*\{[^}]*font-weight/.test(strip(NCSS)),
      'Publish Round and Close Round share .rl-btn-go; flattening one is the '
      + 'inconsistency the previous report was about');
  });
});

/* ======================================================= 4 — THE RUNNING ORDER */
describe('f240 (4) — your own signature is at the top', () => {
  const kinds = [...strip(APP).match(/const ALERT_KINDS = \[[\s\S]*?\];/)[0]
    .matchAll(/k:'([a-z-]+)'/g)].map(m => m[1]);

  test('ALERT_KINDS IS the order, signature first', () => {
    assert.equal(kinds[0], 'signature',
      'nobody else in the workspace can clear this row for you');
    assert.equal(kinds[1], 'cp-ready', 'they have finished; the next move is one press');
  });

  /* REVERSED IN PLACE 24 Aug 2026. The claim was that a date which moved by
     itself sorts LAST, and it was pinned to the literal end of the list. A
     kind has since joined below it — 'email-off', the workspace's own standing
     fault, which is not work with anybody's name on it and ranks under
     everything that is. The RELATION is what the claim was always about, so it
     is written as one and the next kind added costs no test edit. */
  test('and a date that moved by itself is last of the work rows', () => {
    const work = kinds.filter(k => k !== 'email-off');
    assert.equal(work[work.length - 1], 'renewal');
    assert.equal(kinds[kinds.length - 1], 'email-off',
      'a setting nobody is blocked on ranks under every piece of work');
    assert.ok(kinds.indexOf('review-out') > kinds.indexOf('review-mine'),
      'what you owe outranks what you are waiting on');
  });

  test('buildAlerts sorts by that list rather than by build order', () => {
    const body = strip(APP).match(/function buildAlerts\(\)\{[\s\S]*?\n\}/)[0];
    assert.match(body, /out\.sort\(\(a,b\)=>alertRank\(a\.kind\)-alertRank\(b\.kind\)\)/,
      'a rule that lifts one row leaves every other row in build order');
  });

  test('IT IS AN ORDER, NOT A SPECIAL CASE — no kind is named at the draw', () => {
    const rows = strip(APP).match(/data-alert-i="\$\{i\}"[\s\S]{0,1600}/)[0];
    for (const k of kinds)
      assert.ok(!new RegExp("'" + k + "'").test(rows),
        `the row markup names '${k}'; ranking belongs in ALERT_KINDS`);
  });

  test('an unranked kind sorts LAST, never first', () => {
    const r = strip(APP).match(/const alertRank = [\s\S]{0,220}/)[0];
    assert.match(r, /i<0 \? ALERT_KINDS\.length/,
      'a row nobody has ranked must not displace one somebody did');
  });

  test('the sort is stable, so rows within one kind keep their own order', () => {
    const body = strip(APP).match(/function buildAlerts\(\)\{[\s\S]*?\n\}/)[0];
    assert.ok(!/\.sort\([^)]*\.id/.test(body),
      'nothing may re-order inside a kind — this reorders the groups only');
  });
});

/* ================================================= 5 — ONE SIZE, ONE WEIGHT */
describe('f240 (5) — the rows read at one size and one weight', () => {
  /* THE ROW TEMPLATE ITSELF — <tr> to </tr> — and not the function around it.
     regRowsHtml also builds the "nothing matches your filters" card and the ⋯
     menu's own buttons, and neither is a row: a first draft of this sweep took
     the whole function and reported a 15px empty-state heading and a 13px menu
     item as faults. A sweep is only as good as its idea of what it is over. */
  const rowsFn = (() => { const s = strip(REG); const i = s.indexOf('<tr data-row=');
    return s.slice(i, s.indexOf('</tr>', i)); })();
  const css = strip(REG).match(/\.reg-table\{[\s\S]*?\.reg-th-sort\.active/)[0];

  /* REVERSED IN PLACE 24 Aug 2026 — the row VERB is gone (owner-approved
     render): pressing the row already opens the contract, so a text verb beside
     the ⋯ was restating the stage two columns along. What this claim was really
     about survives on the reference, and the verb's absence is asserted below
     so nothing can quietly put a second weight back in the row. */
  /* THE SIZE REVERSED IN PLACE 24 Aug 2026 (WO-16, owner-ruled: "reduce the
     font by a size ... so that there is enough room in the card"). The CLAIM is
     unchanged and is the one that matters — the reference is regular weight and
     reads at the ROW's size, whatever that size is. Pinned as the row's own
     value rather than a literal, so the next density ruling costs no test edit:
     that is the lesson the 1,994-size sweep of 22 Aug paid five times. */
  test('the reference is regular weight, and the row draws no verb', () => {
    const rowSize = css.match(/\.reg-table\{[^}]*font-size:(\d+)px/)[1];
    const r = css.match(/\.reg-mk\{[\s\S]*?\}/)[0];
    assert.match(r, new RegExp('font-size:' + rowSize + 'px'));
    assert.match(r, /font-weight:400/);
    assert.ok(!/class="reg-actlink"/.test(rowsFn), 'the row carries no text verb');
    assert.ok(!/\.reg-actlink\{/.test(css), 'and no rule is left dressing one');
  });

  test('AND EVERY COLOUR IS EXACTLY WHAT IT WAS — except one, deliberately', () => {
    /* REVERSED IN PLACE 25 Aug 2026, and this is the ONE colour on this row
       that really did move — said out loud rather than absorbed. WO-16's claim
       was that flattening the TYPE moved no colour, and that is still true and
       is what the three assertions below pin. What moved is the reference's
       own ink, on its own account: --color-accent-600 as 13px text measures
       3.74:1 on white, under AA's 4.5, and a real browser counted 41 of these
       failing on one page. It reads --accent-ink-700 now, which is accent-700
       by day (5.47:1) and answers properly at night, where the raw ramp step
       had no answer at all and measured 2.35:1.
       IT IS STILL THE ROW'S TEAL HANDLE — one rung darker, not a new colour —
       and that is what this asks: the token, and that it is an accent ink
       rather than a neutral. */
    const mk = css.match(/\.reg-mk\{[\s\S]*?\}/)[0];
    assert.match(mk, /color:var\(--accent-ink-700\)/,
      'the reference is still the row’s teal handle, at the rung that clears AA');
    assert.match(rowsFn, /renDateColor/, 'the expiry still carries its urgency colour');
    assert.match(rowsFn, /\$\{renColor\}/, 'and so does the countdown');
    assert.match(rowsFn, /folderColor\(c\)/, 'the stream tick is untouched');
  });

  test('the status chip is flattened HERE, never at .badge', () => {
    /* Size reversed in place with the row (WO-16); read from .reg-table so the
       chip can never drift away from the cells beside it. */
    const rowSize = css.match(/\.reg-table\{[^}]*font-size:(\d+)px/)[1];
    assert.match(css, new RegExp('\\.reg-table \\.badge\\{font-size:' + rowSize + 'px;font-weight:400\\}'),
      'a table row is not every card, list and panel in the product');
    const badge = IDX.match(/\.badge\{[^}]*\}/)[0];
    assert.match(badge, /font-weight:700/, 'the global chip keeps its own dress');
  });

  /* REVERSED IN PLACE 24 Aug 2026 (owner-ruled: "drop the document type and go
     with 36px rows"). The kind's second line WAS the row's height — dropping it
     is what buys the design's 36px row, and the owner was shown that trade and
     took it. THE FACT IS NOT LOST and that is what this now pins: the kind
     rides the title's hover, and the VALUE STREAM it used to sit beside is a
     column of its own rather than a colour with a legend at the foot. */
  test('THE ROW IS ONE LINE — the kind rides the hover, the stream is a column', () => {
    assert.ok(!/\.reg-kind\{/.test(css), '.reg-kind is retired with the second line');
    assert.ok(!/reg-kind/.test(rowsFn), 'and no row draws one');
    assert.match(rowsFn, /title="\$\{esc\(regTitleOf\(c\)\)\} · \$\{esc\(cKind\(c\)\)\}"/,
      'the kind is still said — on the title’s own hover');
    assert.match(rowsFn, /FOLDERS\[c\.folder\]/,
      'and the stream it sat beside is written out in a column');
    /* The height is stated on the CELL, which for a td is a floor rather than a
       cap — content taller than it still expands the row. */
    assert.match(css, /\.reg-table\{--reg-row-h:36px\}/);
    assert.match(css, /\.reg-table td\{height:var\(--reg-row-h\)/);
  });

  test('NO CELL IN A ROW IS BOLD ANY MORE — the sweep that catches the next one', () => {
    const bold = [...rowsFn.matchAll(/font-weight:\s*(\d{3}|\$\{[^}]*\})/g)]
      .map(m => m[1]).filter(w => w !== '400');
    assert.deepEqual(bold, [], 'still bold in a row: ' + JSON.stringify(bold));
  });

  /* Read from .reg-table rather than pinned at a literal (WO-16 reversal): the
     claim is that no INLINE cell sets a size of its own, whatever the row's
     size currently is. Five of these cells are inline styles a class rule
     cannot reach, so this sweep is what stops the next density ruling leaving
     one of them behind. */
  test('nor set smaller than the row, the kind line excepted', () => {
    const rowSize = Number(css.match(/\.reg-table\{[^}]*font-size:(\d+)px/)[1]);
    const small = [...rowsFn.matchAll(/font-size:(\d+)px/g)]
      .map(m => Number(m[1])).filter(px => px !== rowSize);
    assert.deepEqual(small, [], 'off the row’s size: ' + JSON.stringify(small));
  });

  test('the whose-move words follow the row, and their three inks do not', () => {
    /* NOT the first .ngl-w in the file — .room-facet .v .ngl-w sits above it
       and is the contract room's fact row, which keeps its own 700. */
    /* Size reversed in place with the row (WO-16) — the whose-move words are a
       CELL and the 23 Aug ruling is that every cell reads at one size. */
    const w = IDX.match(/(^|\n)\s*\.ngl-w\{[\s\S]*?\}/)[0];
    const rowSize = css.match(/\.reg-table\{[^}]*font-size:(\d+)px/)[1];
    assert.match(w, new RegExp('font-size:' + rowSize + 'px'));
    assert.match(w, /font-weight:400/);
    for (const [cls, tok] of [['ngl-w-you', '--st-amber-fg'],
      ['ngl-w-them', '--st-gray-fg'], ['ngl-w-clear', '--st-green-fg']])
      assert.match(IDX.match(new RegExp('\\.' + cls + '\\{[^}]*\\}'))[0],
        new RegExp(tok.replace(/-/g, '\\-')), cls + ' lost its ink');
  });

  test('THE CONTRACT ROOM’S FACT ROW IS A HEAD, AND KEEPS ITS BOLD', () => {
    assert.match(IDX, /\.room-facet \.v \.ngl-w\{ font-weight:700; \}/,
      'one builder, two homes — only the LIST was reported');
  });

  test('and the headers are what still tell a heading from a row', () => {
    assert.match(css.match(/\.reg-table th\{[\s\S]*?\}/)[0], /font-weight:700/);
    for (const cls of ['ngl-band-k', 'ngl-band-n'])
      assert.match(IDX.match(new RegExp('\\.' + cls + '\\{[\\s\\S]*?\\}'))[0],
        /font-weight:700/, cls + ' is a heading, not a row');
  });
});
