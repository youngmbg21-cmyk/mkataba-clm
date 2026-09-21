/* f337 — FIVE OFF FOUR SCREENSHOTS (Young, 19 Sep 2026, afternoon)
 *
 *   1  "Image 1, make the highlighted KPIs to be KPI cards."
 *   2  "Image 2, delete this card."          (Biggest by contracted value)
 *   3  "Image 3, shading should fill the whole shaded button."
 *   4  "Image 4, focus mode button in the editor page is not working."
 *   5  "Plain English contract should highlight obligations in Amber."
 *
 * TWO OF THE FIVE ARE THIS CODEBASE'S OWN STANDING FAULTS IN NEW COSTUMES.
 * (4) is f295's lesson a third time: a door drawn by a SHARED builder and
 * answered by only one of the two pages that draw it — roomHeadHtml draws the
 * focus button for both shells, the contract room answers `data-ws-focus` in
 * wireWsFocus, and the negotiate page wired `#ws-focus`, which is the MENU
 * ROW's id and an attribute that button does not carry. It drew, it looked
 * live, it did nothing. (3) is the base rule outliving the widening: the seat
 * switch was told to wear the Contract-View switch's clothes and was given its
 * COLOURS, while the base .rl-segwrap it was widened out of went on stating a
 * 26px segment inside a 28px box with a radius on it and no clip — so the fill
 * drew as a rounded pill floating in a square box.
 *
 * WHAT THIS FILE CANNOT SEE: whether the fill reaches the edge, whether the
 * cards line up, whether a press hides the header. Those are PAINT and are
 * driven in five-screenshots-verify. What is pinned here is the machinery.
 *
 * MEASURED AT THE PARENT (ae0c041): 22 of 31 claims RED. The nine that pass
 * are the named CONTROLS and WALLS — the switch this one is matched TO, the
 * builder that draws the button for both shells, the door the deleted card
 * fed, the registry it was never in, the reading switch that is deliberately
 * not swept, and the three "must not" sweeps that were already true and have
 * to stay true with a third source in the reading. A claim that passes before
 * the fix is a description; a wall that passes before and after is the point.
 */
const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const INTEL = read('js/views/intelligence.js');
const PORTFOLIO = read('js/views/portfolio.js');
const NEGO = read('js/views/negotiation.js');
const NCSS = read('js/views/negotiation-css.js');
const CONTRACT = read('js/views/contract.js');
const HTML = read('index.html');
const I18N = read('js/i18n.js');

/* PIN THE REGION, NOT A BOUNDARY THAT HAPPENS TO HOLD — the lesson f213, f334
   and f335 each paid for. `async function` ends a region too. */
const fnBody = (src, name) => {
  const at = src.search(new RegExp('(?:async )?function ' + name + '\\('));
  if (at < 0) return '';
  const rest = src.slice(at + 8);
  const end = rest.search(/\n(?:async )?function \w+\(/);
  return end < 0 ? rest : rest.slice(0, end);
};
/* Comments are prose and the sweeps below read CODE — or a retired name
   quoted in its own gravestone reads as live. */
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^\s*\/\/.*$/gm, ' ');
/* One CSS rule's body, by its selector, out of a stylesheet. */
const ruleFor = (src, sel) => {
  const at = src.indexOf(sel);
  if (at < 0) return '';
  const open = src.indexOf('{', at);
  const close = src.indexOf('}', open);
  return open < 0 || close < 0 ? '' : src.slice(open + 1, close);
};

/* ══════════════════════════════════════════════════════════════════════════
   1 — THE FOUR FIGURES ARE KPI CARDS
   ══════════════════════════════════════════════════════════════════════════ */
describe('f337 (1) — the friction figures are KPI cards', () => {
  test('the dress is a stylesheet rule, not another run of inline style', () => {
    /* The whole point of the ask is that these look like the product's own KPI
       cards. A second set of literals in intelligence.js could not follow
       .hm-tile the next time it is retuned. */
    assert.ok(HTML.includes('.igf-kpis{'), 'the grid is a rule');
    assert.ok(HTML.includes('.igf-kpi{'), 'and so is the card');
    assert.match(INTEL, /class="igf-kpi"/, 'the builder names the class');
    assert.match(INTEL, /class="igf-kpis"/, 'and the grid');
  });
  test('it wears .hm-tile\'s own four declarations', () => {
    const card = ruleFor(HTML, '.igf-kpi{');
    const tile = ruleFor(HTML, '.hm-tile{');
    for (const d of ['background:var(--color-surface)', 'border:1px solid var(--color-divider)',
                     'border-top:3px solid', 'border-radius:var(--radius)'])
      assert.ok(card.replace(/\s+/g, ' ').includes(d),
        'the KPI card carries the tile\'s ' + d);
    assert.ok(tile.replace(/\s+/g, ' ').includes('background:var(--color-surface)'),
      'CONTROL — and that is what the tile itself says, so the two are one dress');
  });
  test('ONE edge colour, and no verdict tone among them', () => {
    /* Home cycles four tones BY POSITION, which is decoration there and would
       be a claim here: ruby is this product's word for "this is against you"
       and there is no target behind any of these four to earn it. */
    const card = ruleFor(HTML, '.igf-kpi{');
    assert.match(card, /border-top:3px solid var\(--color-accent-600\)/, 'the accent, once');
    assert.ok(!/ruby|amber|green/.test(card),
      'no colour saying good or bad on a figure HaTi holds no target for');
  });
  test('and they are not buttons — no door exists behind them', () => {
    /* Home's rule is that a card opens the list that would change its number.
       None of these four has a list, so a card that looked pressable would be
       a dead press. */
    const at = INTEL.indexOf('const mini=(n,t)=>');
    assert.ok(at > 0, 'the builder is there');
    const body = INTEL.slice(at, at + 400);
    assert.ok(!/<button/.test(body), 'a div, not a button');
    assert.ok(!/data-igf|onclick|cursor:pointer/.test(body), 'and nothing that promises a press');
  });
  test('the same four readings, in the same order, with the same labels', () => {
    /* WALL. The ask was about the DRESS. A re-dress that quietly drops a
       figure or re-words a label is a different change. */
    const at = INTEL.indexOf('const minis=');
    const body = INTEL.slice(at, at + 1200);
    for (const lab of ['median to signature', 'median decision time',
                       'our asks / their asks accepted', 'signed within round 1'])
      assert.ok(body.includes(lab), 'still says: ' + lab);
    assert.ok(body.indexOf('median to signature') < body.indexOf('median decision time')
      && body.indexOf('median decision time') < body.indexOf('our asks / their asks accepted')
      && body.indexOf('our asks / their asks accepted') < body.indexOf('signed within round 1'),
      'in the order they were in');
    assert.match(body, /st\.medianDays!=null/, 'and an absent reading still draws no card');
  });
  test('the label leads and the figure follows, as on the tile', () => {
    const at = INTEL.indexOf('const mini=(n,t)=>');
    const body = INTEL.slice(at, at + 400);
    assert.ok(body.indexOf('igf-kpi-t') < body.indexOf('igf-kpi-n'),
      'label above value — the tile\'s own order');
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   2 — BIGGEST BY CONTRACTED VALUE IS GONE
   ══════════════════════════════════════════════════════════════════════════ */
describe('f337 (2) — the biggest-by-value card is deleted', () => {
  test('the builder is gone and nothing calls it', () => {
    assert.ok(!/function pfBiggest/.test(PORTFOLIO), 'the function is deleted, not stubbed');
    assert.ok(!/pfBiggest\(\)/.test(strip(PORTFOLIO)), 'and no caller is left behind');
  });
  test('it is off the published list too', () => {
    /* A name published but undefined is a window key that reads as available
       and throws on the press. */
    assert.ok(!/\bpfBiggest\b/.test(strip(PORTFOLIO)), 'not in the Object.assign either');
  });
  test('THE DOOR IT FED SURVIVES — the counterparty filter is on the risk map', () => {
    /* WALL, and the reason the deletion is safe to make. Every row of that
       card was a press onto `data-pf-cp`; so is every dot of the risk map,
       and one handler answers both. */
    assert.match(PORTFOLIO, /data-pf-cp="\$\{pfEsc\(p\.c\.counterparty/,
      'the risk map still carries the attribute');
    assert.match(PORTFOLIO, /querySelectorAll\('\[data-pf-cp\]'\)/,
      'and the one handler still answers it');
  });
  test('Copilot loses nothing — it was never a readable panel', () => {
    /* WALL. PF_PANEL_DATA is the ONE door onto these panels and the names in
       it are the contract with Copilot. */
    const at = PORTFOLIO.indexOf('const PF_PANEL_DATA');
    const body = PORTFOLIO.slice(at, at + 400);
    assert.ok(!/biggest/i.test(body), 'it was not in the registry');
    assert.match(body, /workload_runway|money_held_back/, 'CONTROL — the registry is still there');
  });
  test('the sentences are retired, not deleted — inert in BOTH books', () => {
    /* How this product retires a sentence: the key stays in both dictionaries
       and nothing calls it. A key removed from one book and not the other
       leaves a screen half-English. */
    for (const k of ['pf_biggest', 'pf_largest', 'pf_in_focus', 'pf_click_a_row'])
      assert.ok((I18N.match(new RegExp('\\b' + k + ':', 'g')) || []).length === 2,
        k + ' is still in both books');
    assert.ok(!/i18t\('pf_biggest'\)/.test(PORTFOLIO), 'and nothing calls it');
  });
  test('the deletion is written down where it happened', () => {
    /* IT CUTS BOTH WAYS: removing a surface is as much a change as adding one,
       so what was lost is stated beside the hole. */
    assert.match(PORTFOLIO, /BIGGEST BY CONTRACTED VALUE IS GONE/, 'the note is there');
    assert.match(PORTFOLIO, /WHAT IS LOST/, 'and it says what went with it');
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   3 — THE SHADING FILLS THE WHOLE SHADED HALF
   ══════════════════════════════════════════════════════════════════════════ */
describe('f337 (3) — the seat switch fill reaches the edge', () => {
  const WRAP = '.redline-page .rl-cp-head .rl-segwrap{';
  const SEG = '.redline-page .rl-cp-head .rl-segwrap .rl-seg{';
  test('the box CLIPS, which is how .doc-read-seg\'s fill has always reached its corners', () => {
    assert.match(ruleFor(NCSS, WRAP), /overflow:hidden/, 'the seat switch clips');
    assert.match(ruleFor(HTML, '.doc-read-seg{'), /overflow:hidden/,
      'CONTROL — because that is what the switch it was told to resemble does');
  });
  test('the segment takes the box\'s height instead of stating its own', () => {
    const seg = ruleFor(NCSS, SEG);
    assert.match(seg, /height:100%/, 'the full height, so no hairline of page shows');
    assert.ok(!/height:26px/.test(seg), 'the 26 inside a 28 is gone');
    assert.match(ruleFor(HTML, '.doc-read-seg button{'), /height:100%/,
      'CONTROL — the same mechanism, not a second set of numbers');
  });
  test('and the base radius is taken back off it', () => {
    /* The base .rl-seg is a pill in a grey trough and carries a radius for it.
       This control stopped being that the day it was given an accent box, and
       a rounded fill inside a square box shows page at all four corners. */
    assert.match(ruleFor(NCSS, SEG), /border-radius:0/, 'square, like the box');
    assert.match(NCSS, /\.rl-seg,\n\s*\.redline-page \.rl-seg\{[^}]*border-radius:var\(--radius\)/,
      'CONTROL — the base still carries it, for the control that still is a pill');
  });
  test('BOTH HOMES MOVE TOGETHER — the clause panel\'s History | + notes too', () => {
    /* WALL, owner-asked 25 Aug 2026 and pinned by f236: the two are the same
       control and had already drifted once by being written twice. */
    for (const frag of ['.redline-page .rl-actions .rl-segwrap,', '.redline-page .rl-cp-head .rl-segwrap{'])
      assert.ok(NCSS.includes(frag), 'one rule names both: ' + frag);
    assert.ok(NCSS.indexOf('.rl-actions .rl-segwrap .rl-seg,') > 0
      && NCSS.includes('.rl-cp-head .rl-segwrap .rl-seg{height:100%'),
      'and so does the segment rule');
  });
  test('THE READING SWITCH IS NOT SWEPT WITH THEM', () => {
    /* WALL. .rl-segwrap.rl-readwrap is Redlined / As agreed / With changes —
       a bare tab row with no box at all, which is why it states
       background:none and border:0. A clip and a 100% height there would be
       answering a question nobody asked. */
    assert.match(NCSS, /\.rl-segwrap\.rl-readwrap\{background:none;border:0/,
      'the reading switch keeps its own clothes');
    assert.ok(!/rl-readwrap[^}]*overflow:hidden/.test(NCSS), 'and is not clipped');
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   4 — FOCUS MODE WORKS ON THE NEGOTIATE PAGE
   ══════════════════════════════════════════════════════════════════════════ */
describe('f337 (4) — the head\'s Focus button is live on both pages', () => {
  test('the button is drawn by ONE builder, for both shells', () => {
    /* CONTROL — this is what made the fault possible and it is still true. */
    assert.match(NEGO, /class="ui-btn rl-focus-door" data-ws-focus/,
      'roomHeadHtml draws it, so every page that draws the head draws it');
  });
  test('the negotiate page answers the ATTRIBUTE, not just the menu row\'s id', () => {
    /* THE FAULT: `headAct` looks controls up by ID, and #ws-focus is the MENU
       ROW. The head button carries the attribute and no id, so on this page it
       drew, looked live, and did nothing. */
    assert.match(strip(NEGO), /querySelectorAll\('\[data-rl-focus\],\[data-ws-focus\]'\)/,
      'one act answers both door names');
    assert.match(strip(NEGO), /headAct\('ws-focus'/,
      'CONTROL — and the menu row keeps its own listener, as the owner asked');
  });
  test('ONE ACT behind both doors on this page', () => {
    const at = NEGO.indexOf("querySelectorAll('[data-rl-focus],[data-ws-focus]')");
    assert.ok(at > 0, 'the wiring is there');
    assert.match(NEGO.slice(at, at + 160), /rlSetFocus\(!rlFocusOn\(\)\)/,
      'and it is this page\'s own focus mode, not the room\'s');
  });
  test('and it is the page\'s own mechanism, not the room\'s', () => {
    /* The two pages hide different furniture: the room sets display:none on
       #ws-head, this page flips `rl-focus` on the page and `rl-focused` on the
       body. Calling wireWsFocus here would have hidden the head and left the
       sidebar and the top strip standing. */
    assert.ok(!/wireWsFocus/.test(strip(NEGO)), 'the room\'s wiring is not borrowed');
    assert.match(fnBody(NEGO, 'rlSetFocus'), /classList\.toggle\('rl-focused'/,
      'CONTROL — this page stands the shell down itself');
  });
  test('the face is painted by whichever page OWNS the button', () => {
    /* Two painters on one element is drift. applyWsFocus owns it in the room;
       this one is scoped to a button drawn INSIDE a mounted redline page, and
       in the room there is no such page around the head. */
    const body = fnBody(NEGO, 'rlPaintFocusBtn');
    assert.match(body, /rlFocusPage\(\)/, 'scoped to the mounted page');
    assert.match(body, /page\.querySelectorAll\('\[data-ws-focus\]'\)/, 'and to that button');
    assert.match(fnBody(CONTRACT, 'applyWsFocus'), /querySelectorAll\('\[data-ws-focus\](,\[data-ws-focus-door\])?'\)/,
      'CONTROL — the room keeps its own painter');
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   5 — PLAIN ENGLISH MARKS OBLIGATIONS IN AMBER
   ══════════════════════════════════════════════════════════════════════════ */
describe('f337 (5) — a recorded promise is NOT an amber fact (REVERSED)', () => {
  /* ---- REVERSED IN PLACE, 19 Sep 2026 evening, by the owner ----
     These three claims asked that an obligation put a BAR on its clause, off
     *"Plain English contract should highlight obligations in Amber"*. Shown
     the two readings of that sentence side by side, Young chose the other:
     *"I was asking to highlight only the absolute action guiding key words
     that make a clause an obligation."*

     So this was the wrong answer twice over — a fact about the CLAUSE where
     the ask was about the WORDS, and, once the words are lit, one colour
     saying two things twelve pixels apart. The bar keeps its two judgements;
     the promise is on the wording, pinned in f339 and driven in
     duty-marks-verify.

     THE MACHINERY UNDER THEM IS NOT REVERSED and the claims below it still
     hold: the heading key, the collect, the walls. Only the third source
     goes. */
  test('an obligation is no longer one of the bar\'s sources', () => {
    /* STRIPPED: the gravestone over this reading names the retired key, and a
       name quoted in its own gravestone reads as live to a raw sweep. */
    const body = strip(fnBody(CONTRACT, 'docReadFlags'));
    assert.ok(!/c\.obligations/.test(body), 'it does not read them at all');
    assert.ok(!/ct_read_watch_oblig/.test(body), 'nor draw their sentence');
  });
  test('the bar keeps the two judgements it was built for', () => {
    /* rlPbFindClause is still the ONE reading of which clause a quote belongs
       to, and still refuses below RL_PB_MATCH_MIN rather than guessing. */
    const body = fnBody(CONTRACT, 'docReadFlags');
    assert.match(body, /ct_read_watch_pb/, 'your playbook disagreed');
    assert.match(body, /ct_read_watch_scan/, 'the risk scan flagged it');
    assert.match(body, /rlPbFindClause\(c,q,cat\)/,
      'CONTROL — through the door that refuses rather than guesses');
  });
  test('THE DESCRIPTION IS NEVER REACHED FOR', () => {
    /* WALL, and it outlives the source it was written for: a summary in the
       reader's own words would land on whichever clause shared a word with it. */
    const body = fnBody(CONTRACT, 'docReadFlags');
    assert.ok(!/o\.desc/.test(body), 'no fallback onto the description');
  });
  test('and the obligations reading is not asked at all any more', () => {
    const body = fnBody(CONTRACT, 'docReadFlags');
    assert.ok(!/obState\(o\)/.test(body), 'no state to read where there is no source');
    assert.ok(!/o\.status==='done'/.test(body), 're-derived nowhere, then or now');
  });
  test('IT IS KEYED ON THE HEADING, BECAUSE THE PAGE HOLDS NO CLAUSE ID', () => {
    /* MEASURED in a browser: keyed on `clauseId`, NOTHING was ever marked.
       docReadSheet walks the PAINTED PAGE and its rows carry no clause id at
       all; rlPbFindClause answers off clauseSegment, which MINTS one on the fly
       for any body that has never been stamped. The two sides were comparing an
       id the page does not have against one that changes per call — the guard
       that is always false, and it made the amber added on 18 Sep dead too.
       The heading is the pairing this column already uses for its readings. */
    const body = fnBody(CONTRACT, 'docReadFlags');
    assert.match(body, /_docReadNorm\(cl\.headingText\)/, 'the clause side reads its own heading');
    assert.match(body, /if\(!k\) return/, 'and a headingless clause is refused rather than collapsed');
    assert.ok(!/out\.set\(cl\.clauseId/.test(body), 'the id that never matched is gone');
    const paint = fnBody(CONTRACT, 'docReadPaint');
    assert.match(paint, /flags\.get\(_docReadNorm\(p\.row\.heading\)\)/,
      'and the page side reads the same normaliser, so the two cannot drift');
  });
  test('EVERY REASON, NOT THE FIRST ONE', () => {
    /* A clause can carry a departure AND a finding AND a promise. The hover is
       the ONLY place a reader is told why the bar is there, so dropping the
       second reason would be a silent trim. */
    const body = fnBody(CONTRACT, 'docReadFlags');
    assert.match(body, /e\.whys\.push\(why\)/, 'reasons collect');
    assert.match(body, /whys\.join/, 'and the title states all of them');
    assert.ok(!/out\.has\(cl\.clauseId\)\) return;/.test(body),
      'the first-one-wins return is gone');
  });
  test('READING MUST NOT WRITE, and it spends nothing', () => {
    /* WALL, and it has to stay true with a third source in it. */
    const body = fnBody(CONTRACT, 'docReadFlags');
    for (const bad of ['negoInit', 'persist(', 'changes.push', 'api(', 'fetch(', 'obligationMarkDone'])
      assert.ok(!body.includes(bad), 'the flag reading never writes or spends: ' + bad);
  });
  test('the sentence is STALE, not deleted, and still in BOTH books', () => {
    /* A key is retired by not being called. Deleted from one book and not the
       other, a screen comes back half-English. */
    assert.strictEqual((I18N.match(/\bct_read_watch_oblig:/g) || []).length, 2,
      'still English and Swedish');
    assert.ok(!/ct_read_watch_oblig/.test(strip(CONTRACT)), 'and called from nowhere');
  });
  test('AMBER, and still only amber', () => {
    /* WALL. The owner ruled on red and green the day before and nothing here
       reopens it: a third fact earns the same bar, not a third colour. */
    const at = HTML.indexOf('.doc-read-note.dr-watch');
    assert.ok(at > 0, 'the rule is there');
    const block = HTML.slice(at, at + 200);
    assert.match(block, /--st-amber-dot/, 'amber');
    assert.ok(!/ruby|green/.test(block), 'and nothing else');
  });
});
