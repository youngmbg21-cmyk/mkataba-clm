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
  test('a playbook verdict that MATCHES is not a mark', () => {
    assert.ok(/if\(!v\|\|String\(v\.status\|\|''\)==='ok'\) return;/.test(region('docXrayMarks')));
  });
  test('the scan reading is borrowed whole, dismissals and all', () => {
    const f = region('docXrayMarks');
    assert.ok(/window\.openFindings/.test(f), "the scan's own not-dismissed rule");
    assert.ok(/window\.findingQuote\?findingQuote\(f\)/.test(f), "and its own reading of the quote");
  });
  test('the tone is the worst mark on the clause, never the first', () => {
    assert.ok(/marks\.some\(m=>m\.k==='scan'&&m\.sev==='high'\) \? 'ruby' : \(marks\.length \? 'amber' : ''\)/
      .test(CODE));
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
  test('the panel takes the edition’s OWN entry rather than making a second', () => {
    const f = region('docXrayPanelHtml');
    assert.ok(/docReadAnchors==='function'\)\?docReadAnchors\(c\)/.test(f),
      'paired by the same anchors the edition pairs with');
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
