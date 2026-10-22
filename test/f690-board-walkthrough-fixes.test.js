/* f690 — THE BOARD WALK-THROUGH'S FIXES (the owner's overnight order, 15 Oct 2026)
   ========================================================================
   The analyst walk and the iPad walk found these; each is pinned where a
   reader would notice it break. The browser half is
   test/chromium/board-walkthrough-fixes-verify.js.
     1  a reply typed as the tool's own JSON is read, never printed raw
        (the owner's iPad screenshot: `fix it.", "citations":[]`)
     2  the bell says each heading once ("1 detail to fill" stood three times)
     3  a number on its own is the one contract it numbers ("352")
     4  the side list is drawn outside the board's scroller (iPad Safari cut
        it off behind Jambo's panel) and its own door puts it away
     5  the divider lets go when Safari cancels a drag
     7  no "nobody owns this" on an obligation the other side owes, on the Board
     8  Your book's tiles wrap evenly (3 + 2, never 4 + 1)
   Run: node --test test/f690-board-walkthrough-fixes.test.js */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const bodyOf = (src, name) => {
  const at = src.indexOf('function ' + name + '(');
  assert.ok(at > -1, name + ' is found');
  let i = src.indexOf('{', at), depth = 0;
  for (; i < src.length; i++){ if (src[i] === '{') depth++; else if (src[i] === '}' && --depth === 0) break; }
  return src.slice(at, i + 1);
};
const SERVER = read('server/server.js');
const APP = read('js/app.js');
const CA = read('js/copilotacts.js');
const HB = read('js/views/homeboard.js');
const IG = read('js/views/intelligence.js');
const CSS = read('index.html');

describe('F690 (1) — a reply written as the tool\'s JSON is read', () => {
  const f = new Function(bodyOf(SERVER, 'copilotTextAnswer') + '; return copilotTextAnswer;')();
  test('plain prose passes untouched', () => {
    assert.equal(f('Three contracts end in March, "and" one in May.'), 'Three contracts end in March, "and" one in May.');
  });
  test('a whole JSON reply gives its answer', () => {
    assert.equal(f('{"answer":"Hello \\"side\\" world.\\nNext line","citations":[]}'), 'Hello "side" world.\nNext line');
  });
  test('a cut JSON tail (the screenshot) is dropped and the quotes are unescaped', () => {
    const out = f('flagged \\"Payment terms: 30 days\\" as worth review.\\nfix it.",\n"citations":[]');
    assert.equal(out, 'flagged "Payment terms: 30 days" as worth review.\nfix it.');
    assert.ok(!/citations/.test(out));
  });
  test('both plain-text doors of the Copilot route read through it', () => {
    assert.equal((SERVER.match(/const txt = copilotTextAnswer\(content\.filter/g) || []).length, 2);
  });
});

describe('F690 (2) — the bell says each heading once', () => {
  const groups = new Function(bodyOf(APP, 'alertGroupsOf') + '; return alertGroupsOf;')();
  test('rows that say the same words are one group wherever they were sorted', () => {
    const rows = [{ kind: 'details', text: '2 details to fill' }, { kind: 'details', text: '1 detail to fill' },
      { kind: 'details', text: '2 details to fill' }, { kind: 'details', text: '1 detail to fill' }, { kind: 'ob', text: 'Overdue' }];
    const g = groups(rows);
    assert.deepEqual(g.map(x => x.text), ['2 details to fill', '1 detail to fill', 'Overdue']);
    assert.deepEqual(g[1].rows.map(r => r.i), [1, 3], 'each row keeps its own index (its press)');
  });
});

describe('F690 (3) — a number on its own is the contract it numbers', () => {
  const at = CA.indexOf('function caRefFix(');
  const SRC = CA.slice(at, CA.indexOf('\n}', at) + 2);
  const make = refs => new Function('state', 'caRef', SRC + '; return caRefFix;')(
    { contracts: refs.map(r => ({ id: r, contractNo: r })) }, c => c.contractNo);
  test('"352" opens MK-352 when it is the only one', () => {
    assert.equal(make(['MK-352', 'MK-10'])('352'), 'MK-352');
  });
  test('a number two contracts share is left as typed', () => {
    assert.equal(make(['MK-352', 'NDA-352'])('352'), '352');
  });
  test('a number inside a sentence is not taken', () => {
    assert.equal(make(['MK-352'])('contracts over 352 days'), 'contracts over 352 days');
  });
});

describe('F690 (4) — the side list lies outside the board and its door closes it', () => {
  test('the board\'s HTML no longer carries the side list', () => {
    assert.ok(!/hbSheetHtml\(\)/.test(bodyOf(HB, 'hbBoardHtml')));
  });
  test('it is painted into its own host on the page after every board paint', () => {
    assert.match(bodyOf(HB, 'hbSheetPaint'), /hb-sheet-host[\s\S]*hbPage\(\)|hbPage\(\)[\s\S]*hb-sheet-host/);
    assert.match(strip(bodyOf(HB, 'hbPaintBoard')), /hbMorph\(host, hbBoardHtml\(\)\);[\s\S]{0,400}?hbCvPaint\(\);\s*hbSheetPaint\(\);/);
  });
  test('hidden with the board on the other faces', () => {
    assert.match(CSS, /#ig-page:has\(#hb-board\[hidden\]\) #hb-sheet-host/);
  });
  test('the door that opened it puts it away', () => {
    assert.match(strip(bodyOf(HB, 'hbOnClick')), /_hbSheet\.from === el\.getAttribute\('data-hb-dig'\)[^\n]*hbSheetClose\(\)/);
  });
  /* RE-POINTED 22 Oct 2026 (owner picked "One door"): the side list draws no
     card of its own any more — a row lands on the contract's Dossier on Home
     through hbSheetGo, so there is no record to load here. */
  test('a row pressed lands on the contract, through the one door', () => {
    assert.match(strip(bodyOf(HB, 'hbOnClick')), /data-hb-sheet-c[^\n]*hbSheetGo\(/);
    assert.match(bodyOf(HB, 'hbSheetGo'), /roomHomeLand\(id\)/);
    assert.ok(!/hbCardHtml\(/.test(bodyOf(HB, 'hbSheetHtml')), 'the sheet draws no contract card');
  });
});

describe('F690 (5) — the iPad: the divider', () => {
  test('a cancelled drag lets go like a lift', () => {
    /* RE-POINTED 19 Oct 2026 (owner: "all the new jambo panels do not have a
       slider like in the redline page. They should all have one."): Home's
       divider is a client of the ONE wiring every Jambo panel shares
       (splitWire, js/components.js); the claim is the same — a cancel lets
       go like a lift — and it now holds for every panel's divider. */
    assert.match(strip(bodyOf(IG, 'igWireSplit')), /splitWire\(rez, IG_SPLIT\)/);
    const w = strip(bodyOf(read('js/components.js'), 'splitWire'));
    assert.match(w, /addEventListener\('pointercancel', onUp\)/);
    assert.match(w, /removeEventListener\('pointercancel', onUp\)/);
  });
});

describe('F690 (7, 8) — the Board\'s wording and tiles', () => {
  test('an obligation they owe carries no "nobody owns this"', () => {
    assert.match(strip(bodyOf(HB, 'hbOblRowsHtml')), /obligationIsTheirs\(o\)\)\) \? '' :/);
    assert.match(strip(bodyOf(HB, 'hbCardHtml')), /o\.who \|\| o\.theirs \? ''/);
  });
  test('the tiles say their count and wrap by the book\'s own width', () => {
    /* the then-and-now table (round 17) keeps the count class on the same box */
    assert.match(HB, /class="hb-figs hb-tn is-n\$\{chosen\.length\}"/);
    assert.ok(!/minmax\(min\(150px,100%\),1fr\)/.test(HB), 'the auto-fit that left one tile alone is gone');
    assert.match(CSS, /\.hb-book>\.hb-cb\{container-type:inline-size\}/);
    assert.match(CSS, /@container \(max-width:749\.98px\)\{\s*\.hb-book \.hb-figs\.is-n5/);
  });
  test('the value tile names what it leaves out, on the tile', () => {
    assert.match(strip(bodyOf(HB, 'hbBookHtml')), /hb-fig-left/);
    /* round 17 as drawn (18 Oct 2026): hbValueSay says the whole line — the currency, the rates, the left out, the not added — off fxCounted */
    assert.match(bodyOf(HB, 'hbValueSay'), /fx(Home|Counted)/);   // fxCounted: fxHome, less a private folder (17 Oct 2026)
  });
});

describe('F690 (9) — ending means signed (owner, 16 Oct 2026: "Signed contracts only")', () => {
  const HOME = read('js/views/home.js'), REG = read('js/views/register.js');
  test('the Board\'s tile, Home\'s reading, the Contracts filter and the monthly email ask Signed', () => {
    assert.match(strip(bodyOf(HB, 'hbBookData')), /const ending = agreements\.filter\(c => c\.status === 'Signed'\)/);
    assert.match(strip(HOME), /const expiring=agreementsIn\(cs\)[^\n]*x\.c\.status==='Signed'\)/);
    assert.match(strip(REG), /const expWithin=n=>c=>\{ if\(c\.parentId\|\|c\.status!=='Signed'\) return false;/);
    assert.match(SERVER, /if \(r\.status !== 'Signed'\) continue;   \/\* ending means signed/);
  });
});
