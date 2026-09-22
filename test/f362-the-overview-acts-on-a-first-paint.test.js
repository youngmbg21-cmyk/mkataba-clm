/* f362 — THE OVERVIEW'S ACTS WORK ON A FIRST PAINT
   ============================================================================
   Young, 22 September 2026: *"fix the edit button bug too"*.

   MEASURED IN A REAL BROWSER BEFORE A LINE MOVED, on an ordinary contract:
   open the Overview, press `Edit these details`, and ZERO boxes appear. Fold
   any section shut and open again and the same press opens 24. The button was
   drawn, visible and hit-testable the whole time.

   THE CAUSE IS ONE STRUCTURAL ODDITY. The Overview's stack has three hosts —
   #kt-ov-lead, #kt-ov-terms, #kt-side — and two of them are EMPTY SLOTS that
   renderKeyTermsSide fills when the tab is shown. The middle one filled itself
   from the room's own template instead. So its markup arrived without
   renderKeyTerms ever running, and renderKeyTerms is where every door on that
   card is wired: Edit these details, Move to another stream, a marked field's
   Fix, the signers row, the people list, and wireKeyTerms' own boxes. A fold
   calls renderKeyTerms through the section router, which is why a fold woke it.

   THE FIX IS THE PRODUCT'S OWN IDIOM, twelve lines above it in the same
   template: #kt-triage-slot is "A SLOT, NOT THE STRIP ITSELF", with a painter.
   This host becomes a slot too, so it has ONE WRITER rather than two.

   WHAT THIS FILE PINS
     · the template writes no sections into that host — it is an empty slot
     · ktOverviewTermsHtml has exactly ONE caller and it is the painter
     · the tab branch paints all three hosts, the middle one AFTER the side
     · wireKtRows is called ONCE on that path, not twice (it adds a listener
       per row with no bound-once flag)
     · the painter still refuses a missing host, so no other stage is touched

   Run: node --test test/f362-the-overview-acts-on-a-first-paint.test.js */
const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const read = p => fs.readFileSync(path.join(__dirname, '..', p), 'utf8');
const CONTRACT = read('js/views/contract.js');

/* READ CODE, NOT PROSE — the notes this change added name every function these
   claims assert the absence of. */
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const CODE = strip(CONTRACT);

/* PIN THE REGION: a named function from its own `function` to the next one at
   column zero. */
function region(src, name) {
  const a = src.indexOf('function ' + name + '(');
  assert.ok(a > 0, name + ' was found');
  const b = src.indexOf('\nfunction ', a + 1);
  return src.slice(a, b > a ? b : src.length);
}

/* ============================================================================
   1 · THE HOST IS A SLOT, LIKE THE TWO BESIDE IT
   ==========================================================================*/
describe('f362 (1) one writer for #kt-ov-terms', () => {
  test('the template leaves the host empty', () => {
    const m = CODE.match(/<div id="kt-ov-terms">([\s\S]{0,80}?)<\/div>/);
    assert.ok(m, 'the host is in the template');
    assert.equal(m[1].trim(), '', 'it interpolates nothing — it is a slot');
  });

  test('all three hosts in the stack are slots now', () => {
    /* A RELATION, not three pins: the stack is lead · terms · side and none of
       them fills itself. Its own painter is what puts content in. */
    const a = CODE.indexOf('class="ov-stack"');
    assert.ok(a > 0, 'the stack was found');
    /* PAST the closing tag, not up to it — the regex below needs it. */
    const stack = CODE.slice(a, CODE.indexOf('</div>', CODE.indexOf('id="kt-side"')) + 6);
    for (const id of ['kt-ov-lead', 'kt-ov-terms', 'kt-side']) {
      const m = stack.match(new RegExp('id="' + id + '"[^>]*>([\\s\\S]{0,80}?)<\\/div>'));
      assert.ok(m, id + ' is in the stack');
      assert.equal(m[1].trim(), '', id + ' fills itself');
    }
  });

  test('ktOverviewTermsHtml has exactly one caller, and it is the painter', () => {
    const calls = (CODE.match(/ktOverviewTermsHtml\(/g) || []).length;
    /* One definition + one call. Two calls would be the defect coming back. */
    assert.equal(calls, 2, 'one definition and one call');
    assert.ok(/ktOverviewTermsHtml\(/.test(region(CODE, 'renderKeyTerms')),
      'and the call is renderKeyTerms\' own');
  });
});

/* ============================================================================
   2 · THE TAB BRANCH PAINTS IT
   ==========================================================================*/
describe('f362 (2) the painter runs when the tab is shown', () => {
  const branch = () => {
    const w = region(CODE, 'applyWsTabs');
    const a = w.indexOf("_wsTab==='terms'");
    assert.ok(a > 0, 'the terms branch was found');
    return w.slice(a, w.indexOf('}', w.indexOf('{', a)) + 1);
  };

  test('it calls renderKeyTerms, so the card arrives wired', () => {
    assert.ok(/renderKeyTerms\(c\)/.test(branch()),
      'the middle host has a painter on this path');
  });

  test('and AFTER the side, whose markup its row sweep has to cover', () => {
    const b = branch();
    const mid = b.indexOf('renderKeyTerms(c)');
    assert.ok(mid > 0, 'the middle host is painted on this path');
    assert.ok(b.indexOf('renderKeyTermsSide(c)') < mid, 'the side is painted first');
  });

  test('wireKtRows is called ONCE on this path, never twice', () => {
    /* It adds a listener per row with no bound-once flag, so two calls in one
       pass would put two handlers on every row — a blur that writes twice. */
    assert.ok(!/wireKtRows\(/.test(branch()),
      'the branch does not call it — the painter does');
    assert.ok(/wireKtRows\(c\)/.test(region(CODE, 'renderKeyTerms')),
      'and the painter still does');
  });

  test('the parties door is bound after the paint that writes its markup', () => {
    const b = branch();
    /* GATED: an ABSENT call indexes at -1, which would sit before anything and
       pass on a build that never paints the host at all. */
    const at = b.indexOf('renderKeyTerms(c)');
    assert.ok(at > 0, 'the host is painted on this path');
    assert.ok(at < b.indexOf('wireKtParties'),
      'and it is filled before the door is armed');
    /* AND IT SURVIVES EVERY LATER REPAINT because it is delegated on the HOST,
       which renderKeyTerms writes the innerHTML of rather than replacing. */
    const w = region(CODE, 'wireKtParties');
    assert.ok(/getElementById\('kt-ov-terms'\)/.test(w) && /host\.addEventListener/.test(w),
      'it listens on the host itself');
  });
});

/* ============================================================================
   3 · NO OTHER STAGE IS TOUCHED
   ==========================================================================*/
describe('f362 (3) the painter still refuses a host that is not there', () => {
  test('[wall] renderKeyTerms returns on a missing host', () => {
    const w = region(CODE, 'renderKeyTerms');
    assert.ok(/getElementById\('kt-ov-terms'\);\s*if\(!host\)\s*return;/.test(w),
      'a stage without the Overview is unharmed');
  });

  test('[wall] and the two acts are still wired where they are painted', () => {
    const w = region(CODE, 'renderKeyTerms');
    for (const a of ['data-ov-edit', 'data-ov-fix', 'data-ov-move-stream', 'data-ov-signers'])
      assert.ok(w.includes(a), a + ' is armed by the painter');
  });
});
