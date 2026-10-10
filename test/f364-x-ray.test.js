/* f364 — X-RAY, THE SWITCH'S THIRD POSITION
   ============================================================================
   Young, 22 September 2026: *"build the X-ray next to plain English"*, and in
   the same breath *"you have explanations between the top card and the paper
   so please exclude that from the implementation."*

   X-ray shows the paper, a MAP of it down the margin, and everything already
   known about whichever clause you are looking at. Every word of that panel is
   a reading this product has already paid for — the plain-English entry, the
   open scan findings, the playbook verdicts, the clause ladder — which is why
   it can be a position on a switch rather than a feature with a bill.

   WHAT THIS FILE PINS (the structure; the behaviour is driven in a real
   browser by runway-and-xray-verify, because "the paper does not move" and
   "the map does not overlap the sheet" are pixels)
     · three positions, in the owner's order, and X-ray is the third
     · ONE store, and '1' still means Plain English for a browser that holds it
     · docReadOn keeps its name AND its answer, so its six existing callers
       cannot drift from the new mode
     · placement REFUSES rather than guesses — containment, and a floor under
       the quote, which is rlPbFindClause's own rule in a second costume
     · one walk: the map, the panel and the head read docReadSheet, so the two
       positions of the switch see the same clauses
     · the panel BORROWS the edition's entry rather than making a second one
     · the spine is MEASURED before it is mounted, and not drawn where the grey
       will not hold it
     · docXrayPaint runs AFTER docReadPaint at every call site — two writers of
       #doc-right's visibility only agree while one of them runs last
     · no route, no store, no field, no spend
     · and NO EXPLAINER BAND, which is the owner's exclusion asserted as an
       absence

   Run: node --test test/f364-x-ray.test.js */
const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const read = p => fs.readFileSync(path.join(__dirname, '..', p), 'utf8');
const CONTRACT = read('js/views/contract.js');
const INDEX = read('index.html');
const I18N = read('js/i18n.js');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1 ');
const CODE = strip(CONTRACT);

/* PIN THE REGION: a named function from its own `function` to the next one at
   column zero — never a byte count, which this codebase has paid for twice. */
function region(name) {
  const a = CODE.indexOf('function ' + name + '(');
  assert.ok(a > 0, name + ' exists');
  const b = CODE.indexOf('\nfunction ', a + 1);
  return CODE.slice(a, b > a ? b : CODE.length);
}
/* The whole block, for the absence claims: from the first X-ray constant to
   the wiring function that closes it. */
function xrayBlock() {
  /* ABSENT READS AS EMPTY rather than throwing: this runs at describe time,
     and against the commit before this one a throw here would collapse a
     section of claims into one unreadable failure. The section's first test
     is what asserts the block is there. */
  /* RE-POINTED 5 Oct 2026 (the Thread): the readings run from the placement
     floor to the thread's own header; the thread (which presses docReadRun
     from its Explain door) is a block of its own. */
  const a = CODE.indexOf('const DOC_XRAY_QUOTE_MIN');
  if (a < 0) return '';
  const b = CODE.indexOf('const DOC_THREAD_LINE', a);
  return b > a ? CODE.slice(a, b) : '';
}

/* ============================================================================
   1 · THREE POSITIONS, IN THE OWNER'S ORDER
   ==========================================================================*/
describe('f364 (1) the switch is gone', () => {
  /* REVERSED IN PLACE 5 Oct 2026 (Young picked the Thread). The three
     positions, their store and the press that mapped one to the other are
     retired; the readings X-ray drew now feed the thread's open row. */
  test('no switch, no store, no position', () => {
    assert.ok(!/function docReadSwitchHtml|function wireDocRead\(|function docViewMode|function docViewSet|function docXrayOn|DOC_VIEW_MODES/.test(CODE));
    assert.ok(!/data-doc-read=/.test(CODE), 'no button carries a position');
  });
  test('docReadOn keeps its name, and its answer is the thread', () => {
    assert.ok(/function docReadOn\(\)\{ return docThreadOn\(\); \}/.test(CODE), 'said in terms of the thread, so its callers cannot drift from it');
    assert.ok((CODE.match(/docReadOn\(\)/g) || []).length >= 2, 'and it has callers');
  });
});

/* ============================================================================
   2 · ONE STORE, AND YESTERDAY'S CHOICE STILL MEANS WHAT IT MEANT
   ==========================================================================*/
describe('f364 (2) one facing page, always up', () => {
  test('up wherever two working columns fit, on the Document tab alone', () => {
    /* RE-POINTED 10 Oct 2026: on the Document tab the rule is unchanged; Home's Paper is the thread's second home */
    assert.ok(/const docThreadOn = \(\) => thOnHome\(\) \? thHomeLive\(\) : \(docReadFits\(\) && _wsTab === 'docs'\);/.test(CODE));
    assert.ok(/const docReadFits=\(\)=>window\.innerWidth>=DOC_READ_MIN_W;/.test(CODE), 'a narrow window stands it down, never a layer it cannot draw');
  });
});

/* ============================================================================
   3 · IT REFUSES RATHER THAN GUESSES
   ==========================================================================*/
describe('f364 (3) placement is certainty about one clause', () => {
  test('a quote shorter than the floor places nothing', () => {
    const f = region('docXrayPlace');
    assert.ok(/q\.length<DOC_XRAY_QUOTE_MIN/.test(f), 'a two-word quote marks nine clauses');
    assert.ok(/const DOC_XRAY_QUOTE_MIN = \d+;/.test(CODE));
  });
  test('and placement is containment, not overlap', () => {
    assert.ok(/_xrNorm\(rowText\)\.indexOf\(q\)>=0/.test(region('docXrayPlace')));
  });
  /* RE-POINTED IN PLACE 22 Sep 2026 (item D): the four sources are read by
     named helpers the clause marks AND the contract-level block share, so the
     claims are asked of those helpers. The route answers 'aligned', which the
     old test never named — a matching verdict was being drawn amber. */
  test('a playbook verdict that MATCHES is not a mark', () => {
    /* and, since fix 3 (23 Sep 2026), a standard that does not apply to this
       contract ('na') — it is not a departure, so it is not a mark either. */
    assert.ok(/const _xrPbOpen = v => !!v && !\/\^\(ok\|aligned\|na\)\$\//.test(CODE),
      "both spellings of a match — 'ok' and the route's own 'aligned' — are refused");
    assert.ok(/_xrVerdicts\(c\)\.forEach/.test(region('docXrayMarks')));
  });
  test('the scan reading is borrowed whole, dismissals and all', () => {
    assert.ok(/window\.openFindings/.test(region('_xrFinds')), "the scan's own not-dismissed rule");
    assert.ok(/window\.findingQuote\?findingQuote\(f\)/.test(CODE), "and its own reading of the quote");
    assert.ok(/_xrFinds\(c\)\.forEach/.test(region('docXrayMarks')));
  });
  /* RE-POINTED IN PLACE 22 Sep 2026 (Young: Format A, three grades). The claim
     is unchanged — a clause wears its worst mark, never its first — but the
     reading is a walk down XR_GRADES now rather than a two-armed ternary, so
     a grade added tomorrow is one entry in that list and this stays true. */
  test('the tone is the worst mark on the clause, never the first', () => {
    assert.ok(/XR_GRADES\.find\(g=>\(marks\|\|\[\]\)\.some\(m=>m&&m\.grade===g\)\)/.test(CODE),
      'the rank is walked, so the worst wins whatever order the marks arrived in');
  });
});

/* ============================================================================
   4 · ONE WALK, AND ONE READING BORROWED FROM THE POSITION BESIDE IT
   ==========================================================================*/
describe('f364 (4) the two positions see the same clauses', () => {
  test('the map reads docReadSheet, which is what the edition pairs against', () => {
    /* Re-pointed 26 Sep 2026: the walk takes an optional root (the graph's
       Analyze contract hands it its own canvas); the claim is the READING it
       asks, not the argument list. */
    assert.ok(/docReadSheet==='function'\)\?docReadSheet\(c(?:, ?root)?\)/.test(region('docXrayRows')));
  });
  test('the share is worked out once, off that one walk', () => {
    const f = region('docXrayRows');
    assert.ok(/const total=out\.reduce\(/.test(f) && /x\.share=Math\.round\(x\.words\/total\*100\)/.test(f));
  });
  /* REVERSED IN PLACE 22 Sep 2026. This claim PINNED THE DEFECT: it required
     `docReadAnchors(c)` — the call with no entries — and so it passed, green,
     for as long as the X-ray never once showed a reading. The half that was
     right is kept: the panel must BORROW the edition's pairing rather than
     make a second one. What it must borrow it WITH is the entries. */
  test('the thread takes the edition’s OWN entry rather than making a second', () => {
    /* RE-POINTED 5 Oct 2026 (the Thread): docThreadPlain pairs once per paint. */
    const f = region('docThreadPlain');
    assert.ok(/docReadAnchors\(c,\s*docReadItems\(c\),\s*sheet\)/.test(f),
      'paired by the same anchors the edition pairs with, AND handed the same entries');
    assert.ok(/out\.set\(p\.row\.el,t\)/.test(f), 'and keyed on the element');
  });
  test('where there is no reading it offers the press, and claims nothing', () => {
    const b = region('docThreadBodyHtml');
    assert.ok(/docThreadExplainHtml\(c,rows,i\)/.test(b), 'Explain this clause');
    assert.ok(!/xr_plain_none/.test(b), 'never "press Plain View" — there is no such thing to press');
  });
  test('the ladder is drawn only where the clause has an id to be argued about', () => {
    const f = region('docThreadBodyHtml');
    assert.ok(/const cid=docXrayClauseId\(x\.row\);/.test(f));
    assert.ok(/if\(cid\)\{[\s\S]{0,120}ladderRungs\(c,cid\)/.test(f),
      'template paper has no stamped ids, and saying "never argued" there would be a claim');
    assert.ok(/if\(rungs\.length\) parts\.push/.test(f), 'no rungs, no section');
  });
});

/* ============================================================================
   5 · THE MAP IS MEASURED BEFORE IT IS MOUNTED
   ==========================================================================*/
describe('f364 (5) the strand left the margin; the thread is the map', () => {
  /* REVERSED IN PLACE 5 Oct 2026 (the Thread): the Document tab draws no
     strand — every clause is a row on the thread, with a name. The strand
     builders stay for the Explorer, which draws them over its own paper. */
  test('the Document tab mounts no strand', () => {
    /* RE-POINTED 6 Oct 2026 (red on main since the Thread landed): the strip's
       WIDTH, DOC_XRAY_SPINE_W, was kept and published on purpose in the same
       commit — the Explorer reads it through window (f392 (7) pins that read)
       — so naming it here forbade the very thing that commit kept. The
       claim is the Document tab's: no painter, no follower, no mount. */
    assert.ok(!/function docXrayPaint\(|function docXrayFollow\(|id='doc-xr-spine'/.test(CODE));
    assert.match(CODE, /const DOC_XRAY_SPINE_W = 28;/, 'the width stays, for the Explorer');
    assert.ok(!/docXraySpineHtml\(/.test(region('docThreadPaint')), 'the thread paints beads, not blocks');
  });
  test('the Explorer draws the Track, never the strand (10 Oct 2026, owner)', () => {
    const IG = require('node:fs').readFileSync(require('node:path').join(__dirname, '..', 'js', 'views', 'intelligence.js'), 'utf8');
    assert.ok(!/docXraySpineHtml\(rows/.test(IG), 'the old strip is never drawn on the paper again');
    assert.ok(/sp\.innerHTML=igTrackHtml\(rows\);/.test(IG));
    assert.ok(/\.doc-xr-spine\{position:absolute;/.test(INDEX), 'absolutely positioned and never in the flow');
  });
  test('the paper column gained a position and an id, and nothing else', () => {
    const m = CODE.match(/<section id="doc-paper-col" style="([^"]+)"/);
    assert.ok(m, 'the column is named');
    assert.equal(m[1], 'position:relative;overflow:hidden;display:flex;flex-direction:column;min-height:0',
      'relative with no offsets changes no layout at all');
  });
  test('the thread is one white card in the column, by one rule', () => {
    assert.ok(/\.doc-th\{[^}]*background:var\(--color-surface\)/.test(INDEX), 'one rule dresses it');
    assert.ok(/\.doc-th\[hidden\]\{ display:none; \}/.test(INDEX), 'and it is hidden the same way, or the card outlives its content');
    assert.ok(!/id="doc-read"|id="doc-xray"/.test(CODE), 'the two layers are gone');
  });
});

/* ============================================================================
   6 · THE ORDER IS LOAD-BEARING
   ==========================================================================*/
describe('f364 (6) one painter', () => {
  /* REVERSED IN PLACE 5 Oct 2026 (the Thread): where two painters once had
     to run in order (the edition handing #doc-right back, X-ray covering it
     again), there is ONE, and it covers nothing. */
  test('docThreadPaint is painted on the canvas funnel and the tab sweep', () => {
    const sites = (CODE.match(/^\s*docThreadPaint\(c\);/gm) || []).length;
    assert.ok(sites >= 2, 'wireDocCanvas and applyWsTabs');
    assert.ok(!/docXrayPaint\(|docReadPaint\(c\);\s*\n\s*docXrayPaint/.test(CODE), 'and no second painter to order against');
    assert.ok(/function docReadPaint\(c\)\{ docThreadPaint\(c\); \}/.test(CODE), 'the old name presses the one painter');
  });
  test('it covers nothing', () => {
    assert.ok(!/right\.style\.visibility='hidden'/.test(CODE), 'the column is not covered; the thread is a card in it');
  });
  test('the wiring is armed once per element, on hosts that are rebuilt', () => {
    const f = region('docThreadWire');
    assert.ok(/if\(card&&!card\.dataset\.thBound\)\{/.test(f));
    assert.ok(/if\(col&&!col\.dataset\.thBound\)\{/.test(f));
  });
});

/* ============================================================================
   7 · IT SPENDS NOTHING, AND IT SAYS NOTHING IT WAS TOLD NOT TO
   ==========================================================================*/
describe('f364 (7) no bill, and no band', () => {
  const B = xrayBlock();
  test('there is a block to read', () => {
    assert.ok(B.length > 2000, 'the X-ray block exists and has something in it');
  });
  test('no route, no model, no store, no field', () => {
    assert.ok(B.length > 2000, 'gated: there is a block to grep');
    [/\bfetch\s*\(/, /\bapi\s*\(/, /\/api\//, /copilotAsk/, /docReadRun/, /persist\s*\(/,
     /saveContract/, /localStorage/].forEach(re =>
      assert.ok(!re.test(B), 'the X-ray block does not use ' + re));
  });
  test('it writes nothing onto the contract it reads', () => {
    assert.ok(B.length > 2000, 'gated: there is a block to grep');
    assert.ok(!/\bc\.\w+\s*=(?!=)/.test(B), 'never onto a contract');
    assert.ok(!/\bx\.row\.\w+\s*=(?!=)/.test(B), 'never onto a row of the walk');
  });
  test('NO EXPLAINER BAND — the owner’s exclusion, asserted as an absence', () => {
    assert.ok(B.length > 2000, 'gated: there is a block to grep');
    /* The prototype drew a paragraph over the paper saying what X-ray was.
       Nothing here builds a hint, a strip, a band or a callout. */
    [/class="hint"/, /doc-xr-hint/, /class="[^"]*\bband\b/, /rlNoticeStackHtml/,
     /ct_read_note/].forEach(re => assert.ok(!re.test(B), 'no ' + re));
    assert.ok(!/\.doc-xr-(hint|band|note)\{/.test(INDEX), 'and nothing dresses one');
  });
});

/* ============================================================================
   8 · BOTH BOOKS
   ==========================================================================*/
describe('f364 (8) it speaks both languages', () => {
  test('every xr_ key the panel asks for is in both dictionaries', () => {
    const asked = new Map();
    for (const m of CODE.matchAll(/\b(i18tn?)\('(xr_[a-z_]+)'/g)) asked.set(m[2], m[1]);
    assert.ok(asked.size >= 8, 'the panel asks for a good few, got ' + asked.size);
    asked.forEach((fn, k) => {
      (fn === 'i18tn' ? [k + '_one', k + '_other'] : [k]).forEach(kk =>
        assert.equal((I18N.match(new RegExp('\\b' + kk + ':', 'g')) || []).length, 2,
          kk + ' is in both books'));
    });
  });
});

/* ============================================================================
   9 · FORMAT A, AND THE TWO FAULTS UNDER IT (Young ruled 22 Sep 2026)
   ============================================================================
   Off two screenshots: *"the x ray says press in plain english to get a plain
   English but plain english is already there and also when i press on plain
   english nothing happens"*, and *"the brief addresses concerns, unusual
   clauses and areas i should pay attention to in the contract but these
   clauses are not highlighted in the x-ray"*. He was shown three formats and
   picked A — the graded map — and D1 for the dividers.

   BOTH FAULTS WERE MEASURED IN A BROWSER FIRST, on a contract carrying a real
   thirteen-clause reading: the Plain English column paired 13 and the X-ray
   paired 0, and a press on Plain English bought a reading it already had and
   then abandoned the press when that purchase failed.
   ==========================================================================*/
describe('f364 (9) Format A', () => {
  /* RE-POINTED 5 Oct 2026 (the Thread): the pairing is docThreadPlain's, the
     body is docThreadBodyHtml's, and the "moved" reading is docThreadMovedHtml's. */
  const PANEL = () => region('docThreadBodyHtml');
  const WIRE = () => region('docThreadMovedHtml');

  /* ---- the pairing gets its entries ---- */
  test('the thread HANDS THE READINGS OVER — docReadAnchors takes them second', () => {
    const p = region('docThreadPlain');
    assert.ok(/docReadAnchors\(c,\s*docReadItems\(c\),\s*sheet\)/.test(p),
      'the thread pairs against the entries the edition holds, not against nothing');
    assert.ok(!/docReadAnchors\(c\)/.test(p),
      'and never calls it with the contract alone');
  });
  test('[wall] docReadAnchors still walks (items||[]) — silence is the safe failure', () => {
    const a = region('docReadAnchors');
    /* RE-POINTED 26 Sep 2026: a THIRD, optional parameter carries the sheet
       the painter already walked (one walk per paint); the claim is unchanged —
       items is still the second parameter. */
    assert.ok(/function docReadAnchors\(c,\s*items(?:,\s*sheet)?\)/.test(a), 'items is its second parameter');
    assert.ok(/\(items\|\|\[\]\)\.forEach/.test(a),
      'a caller that forgets gets an empty pairing rather than a wrong one — which is ' +
      'exactly why this fault was silent for as long as it was');
  });

  /* ---- the press ---- */
  test('a MISSING memory is "we do not know", never "it moved"', () => {
    const w = WIRE();
    assert.ok(/moved=!!\(sig&&c\._readSig&&c\._readSig!==sig\)/.test(w),
      'the row says stale only where the signature is KNOWN to have moved');
    assert.ok(/if\(!moved\) return '';/.test(w), 'and says nothing otherwise');
  });
  test('there is ONE reading of "moved" now, so nothing can disagree with it', () => {
    assert.equal((CODE.match(/c\._readSig!==sig/g) || []).length, 1, 'one reader');
    assert.ok(/c\._readSig!==sig/.test(WIRE()), 'and it is the open row\'s');
  });
  /* RE-POINTED IN PLACE (fix 6, Young's go, 23 Sep 2026: "Each clause
     appears as soon as it is read"). The 22 Sep fault was a refused re-read
     RETURNING before the switch was set, so the press did nothing. The switch
     is now set BEFORE the reading, so the column can fill as it runs — which
     makes that fault impossible by construction — and a reading that brings
     back nothing stands down by itself: with nothing held the column is not
     drawn. */
  test('a refused re-read cannot swallow the press: the thread is up before any press', () => {
    assert.ok(!/docReadHeld/.test(region('docThreadPaint')), 'the thread does not wait for a reading to exist');
    const run = region('docReadRun');
    assert.ok(/if\(docReadWatching\(id\)\) docThreadPaint\(c\);/.test(run), 'and a press repaints it the moment the reading starts, so the row says Reading…');
  });
  test('[wall] _readSig still has exactly ONE writer, inside docReadRun', () => {
    const hits = (CODE.match(/_readSig\s*=(?!=)/g) || []).length;
    assert.equal(hits, 1, 'one writer — the whole reasoning above rests on it not being stored');
    assert.ok(/_readSig=sig/.test(region('docReadRun')), 'and it is docReadRun');
  });

  /* ---- three grades ---- */
  test('XR_GRADES is ruby, amber, steel — and the order IS the rank', () => {
    const m = CODE.match(/const XR_GRADES=\[([^\]]+)\]/);
    assert.ok(m, 'XR_GRADES is declared');
    assert.deepEqual(m[1].replace(/['\s]/g, '').split(','), ['ruby', 'amber', 'steel']);
    assert.ok(/XR_GRADES\.find\(g=>\(marks\|\|\[\]\)\.some\(m=>m&&m\.grade===g\)\)/.test(CODE),
      'a clause wears its WORST mark, walked down the rank, never its first');
  });
  test('exactly one thing earns ruby, and it is a high scan finding', () => {
    const m = CODE.match(/const XR_SEV_GRADE=\{([^}]+)\}/);
    assert.ok(m, 'the scan’s three severities are mapped once');
    assert.ok(/high:'ruby'/.test(m[1]) && /med:'amber'/.test(m[1]) && /low:'steel'/.test(m[1]));
    const marks = region('docXrayMarks');
    assert.ok(!/grade:'ruby'/.test(marks),
      'nothing else in the marks reader hands out ruby — only the severity table does');
  });
  test('three is the ceiling: the sheet dresses exactly those three', () => {
    /* `is-on` is the picked segment's outline, not a grade — the map's own
       three are what this counts. A sweep that took it in reported four. */
    const segs = [...INDEX.matchAll(/\.doc-xr-seg\.is-([a-z]+)\{/g)]
      .map(x => x[1]).filter(g => g !== 'on').sort();
    assert.deepEqual(segs, ['amber', 'ruby', 'steel'], 'no fourth tint on the map');
    const tags = [...INDEX.matchAll(/\.doc-xr-mark\.is-([a-z]+) \.doc-xr-mk\{/g)].map(x => x[1]).sort();
    assert.deepEqual(tags, ['ruby', 'steel'], 'amber is the base, so the other two are stated');
    assert.ok(!/\.doc-xr-mark\.is-high/.test(INDEX), 'is-high is stale and nothing dresses it');
    assert.ok(!/is-high/.test(xrayBlock()), 'and nothing builds one');
  });
  test('every grade is a token this product already holds, in BOTH themes', () => {
    ['ruby', 'amber', 'steel'].forEach(g => {
      ['dot', 'fg', 'bg'].forEach(k => assert.ok(
        (INDEX.match(new RegExp('--st-' + g + '-' + k + ':', 'g')) || []).length >= 2,
        '--st-' + g + '-' + k + ' is answered in light AND dark'));
    });
  });

  /* ---- the brief reaches the X-ray ---- */
  test('the brief’s watchouts are marks, placed by the SAME containment', () => {
    const marks = region('docXrayMarks');
    assert.ok(/docXrayBriefWatch\(c\)\.forEach/.test(marks), 'the watchouts are read');
    assert.ok(/docXrayPlace\(txt,w\.quote\)/.test(marks) && /const txt=docXrayRowText\(row\)/.test(marks),
      'and placed by the quote they carry — no looser reading is allowed in');
    /* The mark's shape lives in ONE builder the clause list and the
       contract-level block share (22 Sep 2026), so the source tag is asked of it. */
    assert.ok(/_xrBriefMark\(w\)/.test(marks) && /const _xrBriefMark = w => \(\{[^)]*tag:i18t\('xr_m_brief'\)/.test(CODE),
      'each naming the brief as its source');
  });
  /* REVERSED IN PLACE 22 Sep 2026 (item G, Young's go): the brief now asks
     for a quote on every unusual term, so one that CARRIES a quote is placed by
     exactly the watchouts' containment. What stays a wall is the guess: an
     unusual term with no quote is never matched by its words. */
  test('[wall] an UNUSUAL term is placed only by its own quote, never its words', () => {
    const marks = region('docXrayMarks');
    /* 4 Oct 2026: a line dismissed in the Redlines card's risk list is asked
       first (`!gone(...)`), then the same containment on its own quote. */
    assert.ok(/docXrayBriefOdd\(c\)\.forEach\(u=>\{ if\(!gone\('odd',u\.say\)&&docXrayPlace\(txt,u\.quote\)\)/.test(marks),
      'the same containment, on the quote it carries');
    assert.ok(!/u\.say\)\)/.test(marks), 'never on the sentence');
    /* RE-POINTED IN PLACE 25 Sep 2026 (Young: "this 'about contract x'
       portion should be excluded from the x-ray"). An unusual term that lands
       nowhere was SAID about the whole contract; the panel says it no more.
       The reading that gathered it is kept whole with no caller, so what is
       asserted now is that it still reads the list AND that nothing draws it. */
    assert.ok(/docXrayBriefOdd\(c\)\.forEach/.test(region('docXrayWide')),
      'the dormant whole-contract reading still reads the unusual terms, kept whole');
    assert.ok(!/docXrayWide\(/.test(region('docThreadBodyHtml')),
      'and the open row no longer draws what lands nowhere');
  });
  test('docXrayBriefWatch is the ONE reading of that list', () => {
    assert.ok(/function docXrayBriefWatch\(c\)/.test(CODE), 'it exists');
    /* COUNT THE CALLS, NOT THE DEFINITION — a count that matches its own
       declaration is this codebase's own recorded instrument fault. */
    const askers = (CODE.match(/docXrayBriefWatch\(c\)\./g) || []).length;
    assert.equal(askers, 2, 'the clause marks and the dormant contract-level reading (kept whole since 25 Sep 2026), and nothing else');
    const w = region('docXrayWide');
    assert.ok(/if\(!landed\(w\.quote\)\)/.test(w),
      'a watchout that landed on its clause is said there, not twice');
    assert.ok(/_xrOddMark\(u\)/.test(w) && /const _xrOddMark = u => \(\{[^)]*grade:'steel'/.test(CODE),
      'and an unusual term is worth knowing, not a warning');
  });

  /* ---- one builder for a mark ---- */
  test('ONE builder for a mark, and it always names who said it', () => {
    /* 4 Oct 2026: the builder takes the risk list's two doors as an optional
       second argument (riskMarkFootHtml); still one builder. */
    assert.ok(/const docXrayMarkHtml = \(m, foot\) =>/.test(CODE), 'one builder');
    const p = PANEL();
    /* REVERSED IN PLACE 25 Sep 2026: About this contract left the X-ray, so
       the builder has ONE home — the clause's own list. 5 Oct 2026: that
       home is the thread's open row, and the foot is EMPTY: Worth a look
       carries no "Add a note" (owner). */
    assert.ok((p.match(/docXrayMarkHtml/g) || []).length === 1,
      'drawn by the clause list alone — the contract-level block is no longer drawn');
    assert.ok(/docXrayMarkHtml\(m,''\)/.test(p), 'with no foot under a mark');
    const b = CODE.slice(CODE.indexOf('const docXrayMarkHtml'), CODE.indexOf('const docXrayMarkHtml') + 400);
    assert.ok(/doc-xr-mk">\$\{esc\(m\.tag\|\|''\)\}/.test(b), 'every mark prints its source tag');
    assert.ok(/is-\$\{esc\(m\.grade\|\|'amber'\)\}/.test(b), 'and wears its own grade');
  });
  test('the four source tags are in both books', () => {
    ['xr_m_scan', 'xr_m_pb', 'xr_m_brief', 'xr_m_odd', 'xr_sec_wide'].forEach(k =>
      assert.equal((I18N.match(new RegExp('\\b' + k + ':', 'g')) || []).length, 2, k));
  });
  test('silence names no reader, so it cannot go stale when a fourth is added', () => {
    const m = I18N.match(/xr_look_none:\s*'([^']+)'/);
    assert.ok(m, 'the sentence is there');
    assert.ok(!/playbook|risk scan/i.test(m[1]),
      'it listed two readers by name while there were three — it says nothing on the record ' +
      'mentions this clause instead, and that that is not the same as safe');
  });
  test('[wall] and it still spends nothing, adds no route and no field', () => {
    const B = xrayBlock();
    assert.ok(B.length > 2000, 'gated: there is a block to grep');
    [/\bapi\(/, /\bfetch\(/, /\bpersist\(/, /ai\//].forEach(re =>
      assert.ok(!re.test(B), 'the X-ray reads what is already paid for — no ' + re));
  });

  /* ---- D1, the dividers ---- */
  test('D1 — a line between every pair, in the frame’s own colour', () => {
    const m = INDEX.match(/\.doc-read-seg button \+ button\{([^}]+)\}/);
    assert.ok(m, 'the rule exists');
    assert.ok(/border-left:1px solid/.test(m[1]), 'a 1px left edge on each button after the first');
    /* RE-POINTED IN PLACE, 26 Sep 2026: the claim is that the seam reads the
       FRAME's own token, and the frame moved from --accent-ink to the one light
       grey button edge (the button work order's third item). Asked as the
       relation now, so it cannot pin a colour the owner has since changed. */
    const frame = (INDEX.match(/\.doc-read-seg\{[^}]*border:1px solid var\((--[a-z0-9-]+)\)/) || [])[1];
    assert.ok(frame, 'the frame draws its edge from a token');
    assert.ok(new RegExp('var\\(' + frame + '\\)').test(m[1]), 'reading the frame’s own token');
    assert.ok(!/#[0-9a-f]{3,8}\b/i.test(m[1]), 'and naming no colour of its own');
  });
  test('it is between EVERY pair, not only the unlit ones', () => {
    /* GATED on there being a divider at all: an absence claim about a rule
       that does not exist passes on a build with no dividers, which is the
       quietest way a measurement proves nothing. */
    assert.ok(/\.doc-read-seg button \+ button\{/.test(INDEX), 'gated: there is a divider');
    assert.ok(!/\.doc-read-seg button:not\(\[aria-pressed/.test(INDEX),
      'dropping the rule beside the filled half moves the furniture as the lit half moves');
  });
  test('[control] the group gained a divider and not a pixel of size', () => {
    const m = INDEX.match(/\.doc-read-seg\{([^}]+)\}/);
    assert.ok(m, 'the group rule is there');
    assert.ok(/height:var\(--ctl-h\)/.test(m[1]), 'one rung with every other control');
    assert.ok(/border-radius:var\(--radius\)/.test(m[1]), 'the platform’s own corner');
    const b = INDEX.match(/\.doc-read-seg button\{([^}]+)\}/);
    assert.ok(/padding:0 12px/.test(b[1]), 'and the same padding it always had');
  });
});
