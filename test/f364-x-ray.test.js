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
  const a = CODE.indexOf('const DOC_XRAY_SPINE_W');
  if (a < 0) return '';
  const b = CODE.indexOf('function wireDocRead(', a);
  return b > a ? CODE.slice(a, b) : '';
}

/* ============================================================================
   1 · THREE POSITIONS, IN THE OWNER'S ORDER
   ==========================================================================*/
describe('f364 (1) the switch', () => {
  test('X-ray is the third button, straight after Plain English', () => {
    const sw = region('docReadSwitchHtml');
    const order = [...sw.matchAll(/data-doc-read="(\d)"/g)].map(m => m[1]);
    assert.deepEqual(order, ['0', '1', '2'], 'Contract View, Plain English, X-ray');
    assert.ok(sw.indexOf("i18t('ct_read_plain')") < sw.indexOf("i18t('xr_switch')"),
      'and it is drawn after the edition, not before it');
  });
  test('Contract View is lit only when NEITHER layer is up', () => {
    const sw = region('docReadSwitchHtml');
    assert.ok(/data-doc-read="0" aria-pressed="\$\{!on&&!xr\}"/.test(sw),
      'a third position that did not clear the first would light two at once');
  });
  test('it is lit off the MODE, never off a reading having been made', () => {
    const sw = region('docReadSwitchHtml');
    assert.ok(/const xr=docXrayOn\(\);/.test(sw));
    assert.ok(!/xr=docXrayOn\(\)&&docReadHeld/.test(sw),
      'X-ray needs no edition — its panel offers that press where there is none');
  });
  test('the press maps a position to a mode, and sets it once', () => {
    const w = region('wireDocRead');
    assert.ok(/pos==='1'\?'plain':pos==='2'\?'xray':'paper'/.test(w));
    assert.equal((w.match(/docViewSet\(/g) || []).length, 1, 'one writer of the store');
  });
});

/* ============================================================================
   2 · ONE STORE, AND YESTERDAY'S CHOICE STILL MEANS WHAT IT MEANT
   ==========================================================================*/
describe('f364 (2) the store', () => {
  test("'1' is still Plain English", () => {
    const m = region('docViewMode');
    assert.ok(/if\(v==='1'\) return 'plain';/.test(m),
      'a browser holding the old value opens where it always did');
  });
  test('an unknown value reads as the paper, which is where the switch rests', () => {
    const m = region('docViewMode');
    assert.ok(/DOC_VIEW_MODES\.indexOf\(v\)>0 \? v : 'paper'/.test(m));
    assert.ok(/if\(!docReadFits\(\)\) return 'paper';/.test(m),
      'and a narrow window is the paper, never a layer it cannot draw');
  });
  test('docReadOn keeps its name AND its answer', () => {
    assert.ok(/function docReadOn\(\)\{ return docViewMode\(\)==='plain'; \}/.test(CODE),
      'said in terms of the mode, so its callers cannot drift from it');
    /* Its callers are the reason: the painter, the switch, the duty marks and
       the mirror column all mean "is the edition up". */
    assert.ok((CODE.match(/docReadOn\(\)/g) || []).length >= 3, 'and it has callers');
  });
  test('one key, three values, and only three', () => {
    const st = region('docViewSet');
    assert.ok(/m==='plain' \? '1' : \(m==='xray' \? 'xray' : '0'\)/.test(st));
    assert.ok(/const DOC_VIEW_MODES=\['paper','plain','xray'\];/.test(CODE));
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
    assert.ok(/const _xrPbOpen = v => !!v && !\/\^\(ok\|aligned\)\$\//.test(CODE),
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
    assert.ok(/docReadSheet==='function'\)\?docReadSheet\(c\)/.test(region('docXrayRows')));
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
  test('the panel takes the edition’s OWN entry rather than making a second', () => {
    const f = region('docXrayPanelHtml');
    assert.ok(/docReadAnchors\(c\s*,\s*docReadItems\(c\)\)/.test(f),
      'paired by the same anchors the edition pairs with, AND handed the same entries');
    assert.ok(/paired\.find\(a=>a&&a\.row&&a\.row\.el===x\.el\)/.test(f), 'and matched on the element');
  });
  test('where there is no reading it offers the press, and claims nothing', () => {
    assert.ok(/i18t\('xr_plain_none'\)/.test(region('docXrayPanelHtml')));
  });
  test('the ladder is drawn only where the clause has an id to be argued about', () => {
    const f = region('docXrayPanelHtml');
    assert.ok(/const cid=docXrayClauseId\(x\.row\);/.test(f));
    assert.ok(/if\(cid\)\{[\s\S]{0,120}ladderRungs\(c,cid\)/.test(f),
      'template paper has no stamped ids, and saying "never argued" there would be a claim');
    assert.ok(/rungs\.length\?docXraySecHtml/.test(f), 'no rungs, no section');
  });
});

/* ============================================================================
   5 · THE MAP IS MEASURED BEFORE IT IS MOUNTED
   ==========================================================================*/
describe('f364 (5) the spine takes grey, never paper', () => {
  test('it is mounted only where the ground will hold it', () => {
    const f = region('docXrayPaint');
    assert.ok(/room=canvas\.getBoundingClientRect\(\)\.left-sec\.getBoundingClientRect\(\)\.left/.test(f),
      'the room is measured against the sheet the reader is looking at');
    assert.ok(/if\(!\(room>=DOC_XRAY_SPINE_W\+DOC_XRAY_SPINE_GAP\)\) return;/.test(f),
      'and a verb that cannot work is not drawn');
  });
  test('it is absolutely positioned and never in the flow', () => {
    assert.ok(/\.doc-xr-spine\{position:absolute;/.test(INDEX),
      'nothing in the layout changes, so the contract cannot move');
  });
  test('the paper column gained a position and an id, and nothing else', () => {
    const m = CODE.match(/<section id="doc-paper-col" style="([^"]+)"/);
    assert.ok(m, 'the column is named');
    assert.equal(m[1], 'position:relative;overflow:hidden;display:flex;flex-direction:column;min-height:0',
      'relative with no offsets changes no layout at all');
  });
  test('the panel is the edition’s OWN card, by one rule and not a copy', () => {
    /* Young, 22 Sep 2026: "the right hand side of the card should be on a
       white card just like plain English". That card is the 10 Sep ruling
       ("let the plain english also sit in a white card and not the grey
       background") and it is now ONE selector covering both layers — a
       second copy of those five declarations is a second thing to keep in
       step. THE CLOTHES FOLLOW THE BUILDER. */
    assert.ok(/#doc-read,#doc-xray\{[^}]*background:var\(--color-surface\)/.test(INDEX),
      'one rule dresses both layers');
    /* NOT PRECEDED BY A COMMA: `#doc-read,#doc-xray{` CONTAINS `#doc-xray{`,
       so the plain negative tripped on the shared rule it exists to allow. */
    assert.ok(!/(?<![,\w-])#doc-xray\{[^}]*background:var\(--color-surface\)/.test(INDEX),
      'and X-ray has no card rule of its OWN to drift with');
    assert.ok(/#doc-read\[hidden\],#doc-xray\[hidden\]\{ display:none; \}/.test(INDEX),
      'and both are hidden the same way, or the card outlives its content');
  });
  test('the panel is a sibling of the edition’s layer, at the same inset', () => {
    const r = CODE.match(/<div id="doc-read"[^>]*style="([^"]+)"/);
    const x = CODE.match(/<div id="doc-xray"[^>]*style="([^"]+)"/);
    assert.ok(r && x, 'both layers are in the template');
    assert.equal(x[1], r[1], 'one geometry, so the cards under them are covered the same way');
  });
});

/* ============================================================================
   6 · THE ORDER IS LOAD-BEARING
   ==========================================================================*/
describe('f364 (6) two writers of one property', () => {
  test('docXrayPaint runs after docReadPaint at every call site that changes the mode', () => {
    const lines = CONTRACT.split('\n');
    /* THE PICK HANDLER IS EXCLUDED BY NAME, and that is the measurement rather
       than an exemption: pressing a segment of the map repaints the PANEL, it
       does not change which layer is up, so there is nothing for the edition's
       painter to hand back. Every other site is a mode or a tab change, and
       there the order is load-bearing. */
    const wireA = lines.findIndex(l => /^function docXrayWire\(/.test(l));
    assert.ok(wireA > 0, 'the wiring is a named function');
    const wireB = lines.findIndex((l, i) => i > wireA && /^function /.test(l));
    const inWire = i => i > wireA && (wireB < 0 || i < wireB);
    const paints = [];
    lines.forEach((l, i) => {
      if (/docReadPaint\(/.test(l)) paints.push({ i, kind: 'read' });
      if (/docXrayPaint\(/.test(l) && !/^function /.test(l)) paints.push({ i, kind: 'xray' });
    });
    const xrays = paints.filter(p => p.kind === 'xray' && !inWire(p.i));
    assert.ok(xrays.length >= 3, 'painted on the canvas funnel, the tab sweep and the press');
    xrays.forEach(x => {
      const before = paints.filter(p => p.kind === 'read' && p.i <= x.i && x.i - p.i <= 8);
      assert.ok(before.length, 'a read paint sits just above line ' + (x.i + 1));
    });
  });
  test('and it takes the cover back when it is the one that is up', () => {
    assert.ok(/if\(right\) right\.style\.visibility='hidden';/.test(region('docXrayPaint')));
  });
  test('the wiring is armed once per element, on hosts that are rebuilt', () => {
    const f = region('docXrayWire');
    assert.ok(/if\(!host\|\|host\.dataset\.xrBound\) return;/.test(f));
    assert.ok(/host\.dataset\.xrBound='1';/.test(f));
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
  const PANEL = () => region('docXrayPanelHtml');
  const WIRE = () => region('wireDocRead');

  /* ---- the pairing gets its entries ---- */
  test('the panel HANDS THE READINGS OVER — docReadAnchors takes them second', () => {
    const p = PANEL();
    assert.ok(/docReadAnchors\(c\s*,\s*docReadItems\(c\)\)/.test(p),
      'the X-ray pairs against the entries the edition holds, not against nothing');
    assert.ok(!/docReadAnchors\(c\)/.test(p),
      'and never calls it with the contract alone');
  });
  test('[wall] docReadAnchors still walks (items||[]) — silence is the safe failure', () => {
    const a = region('docReadAnchors');
    assert.ok(/function docReadAnchors\(c,\s*items\)/.test(a), 'items is its second parameter');
    assert.ok(/\(items\|\|\[\]\)\.forEach/.test(a),
      'a caller that forgets gets an empty pairing rather than a wrong one — which is ' +
      'exactly why this fault was silent for as long as it was');
  });

  /* ---- the press ---- */
  test('a MISSING memory is "we do not know", never "it moved"', () => {
    const w = WIRE();
    assert.ok(/const moved=!!\(sig&&c\._readSig&&c\._readSig!==sig\)/.test(w),
      'the press asks for a re-read only where the signature is KNOWN to have moved');
    assert.ok(!/c\._readSig!==sig\)\s*\{\s*if\(!await docReadRun/.test(w),
      'and never off a bare inequality, which reads an absent memory as a change');
  });
  test('the painter and the press now read _readSig the same way', () => {
    const paint = region('docReadPaint');
    assert.ok(/sig&&c\._readSig&&c\._readSig!==sig/.test(paint), 'the painter, as it always did');
    assert.ok(/sig&&c\._readSig&&c\._readSig!==sig/.test(WIRE()), 'and the press, which did not');
  });
  test('a refused re-read does not swallow the press', () => {
    const w = WIRE();
    assert.ok(/if\(!got&&!docReadItems\(c\)\.length\)\s*return;/.test(w),
      'the press stands down ONLY where there is nothing at all to show');
    assert.ok(w.indexOf('docViewSet(mode)') > w.indexOf('docReadRun(c)'),
      'and the switch is set after the attempt, not skipped by it');
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
    assert.ok(/docXrayBriefOdd\(c\)\.forEach\(u=>\{ if\(docXrayPlace\(txt,u\.quote\)\)/.test(marks),
      'the same containment, on the quote it carries');
    assert.ok(!/u\.say\)\)/.test(marks), 'never on the sentence');
    assert.ok(/docXrayBriefOdd\(c\)\.forEach/.test(region('docXrayWide')), 'and said about the whole contract where it lands nowhere');
  });
  test('docXrayBriefWatch is the ONE reading of that list', () => {
    assert.ok(/function docXrayBriefWatch\(c\)/.test(CODE), 'it exists');
    /* COUNT THE CALLS, NOT THE DEFINITION — a count that matches its own
       declaration is this codebase's own recorded instrument fault. */
    const askers = (CODE.match(/docXrayBriefWatch\(c\)\./g) || []).length;
    assert.equal(askers, 2, 'the clause marks and the contract-level block, and nothing else');
    const w = region('docXrayWide');
    assert.ok(/if\(!landed\(w\.quote\)\)/.test(w),
      'a watchout that landed on its clause is said there, not twice');
    assert.ok(/_xrOddMark\(u\)/.test(w) && /const _xrOddMark = u => \(\{[^)]*grade:'steel'/.test(CODE),
      'and an unusual term is worth knowing, not a warning');
  });

  /* ---- one builder for a mark ---- */
  test('ONE builder for a mark, and it always names who said it', () => {
    assert.ok(/const docXrayMarkHtml = m =>/.test(CODE), 'one builder');
    const p = PANEL();
    assert.ok((p.match(/docXrayMarkHtml/g) || []).length === 2,
      'drawn by the clause list and by the contract-level block — the clothes follow the builder');
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
    assert.ok(/var\(--accent-ink\)/.test(m[1]), 'reading the frame’s own token');
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
