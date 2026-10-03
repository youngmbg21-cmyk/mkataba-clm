/* ============================================================
   F449 — The bar says one thing
   ============================================================
   Young, 4 October 2026, looking at a contract page and drawing a box in the
   empty space to the left of the word Contracts:

     *"the circled arrow next to contracts is missing in HATI but please make
     sure it is included now both in the documents and negotiate page. Also
     kill the the wordings that come after Contract as they are redundant
     because they are already below it in the page."*

   and then, having been shown what each page would read:

     *"In negotiations, back takes you to document page. In contracts, there
     should be no back button."*

   THE ARROW WAS NEVER MISSING. It was ruled on 15 September — *"there should
   be a back button but in sign format not words"* — and built. Six days later
   the crumb moved out of the page head and into the dark bar, and one line of
   CSS in there turned the sign off and printed the word instead. So the sign
   survived only on a row that hides itself the moment the bar takes its
   button, which is to say nowhere a reader has ever seen it.

   THE WORDING WAS REDUNDANT, exactly as he said. The bar printed
   "Contracts / MK-398 · Mutual Non-Disclosure Agreement" while the page under
   it printed the name in 28px type and the reference in the quiet line thirty
   pixels below. The reference and the name are said ONCE now, by the page.

   WHAT EACH PAGE KEEPS IS WHAT THE SHELL CANNOT ALREADY DO, and that is the
   whole of this ruling:
     · the ROOM keeps a plain word — Contracts, as a label, nothing to press.
       The rail already carries that journey and is already lit, so an arrow
       here was a second door onto a trip the shell makes for free. This
       REPLACES the 17 August ruling that the room's arrow always lands on the
       contracts page: there is no arrow on the room to land anywhere.
     · the NEGOTIATE page keeps the arrow, ALONE, landing on the Document tab.
       The rail cannot make that journey — its Negotiations door goes to the
       LIST, never back to the contract you were just inside — so the arrow is
       the only way out and it earns its place.

   AND #ws-back IS STILL ONE BUTTON, the fourth time this control has been
   re-dressed rather than replaced. Same id, same data-back, same handler, same
   destination. What changed is which page draws it and what it wears.

   THE ONE TRAP THIS FILE EXISTS FOR: the room draws no button now, so the
   wiring's old fallback — a bare getElementById('ws-back') — would answer with
   the NEGOTIATE page's button, still parked in the bar from the last visit.
   shellCrumbAdopt would read its data-back and hang another page's arrow on
   the room. It is silent, it only happens on the second visit, and it is the
   kind of thing a source check catches and a screenshot does not. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const APP = read('js/app.js');
const CONTRACT = read('js/views/contract.js');
const HTML = read('index.html');

/* The function, not the file: a claim about shellCrumbAdopt that swept all of
   js/app.js would pass on any other function that happened to say the word. */
const ADOPT = APP.slice(APP.indexOf('function shellCrumbAdopt'),
  APP.indexOf('function shellCrumbLayer'));
/* The room's breadcrumb, markup only. */
const NAV = CONTRACT.slice(CONTRACT.indexOf('<nav class="room-crumb"'),
  CONTRACT.indexOf('</nav>', CONTRACT.indexOf('<nav class="room-crumb"')));

function fixture(id){
  return { id, contractNo: id, name: 'Mutual Non-Disclosure Agreement — Juno LLC',
    counterparty: 'Juno LLC', status: 'In Review', folder: 'corporate',
    changes: [], thread: [] };
}
function world(){
  const w = buildWorld({ contractView: true, negotiationView: true, registerView: true });
  const c = fixture('MK-398');
  w.win.state = Object.assign({}, w.win.state, { contracts: [c], activeId: 'MK-398' });
  w.win.getContract = id => (id === 'MK-398' ? c : null);
  return { win: w.win, c };
}

describe('f449 (1) — the room has no back button, and says where you are', () => {
  test('the room\'s head draws no #ws-back at all', () => {
    const { win, c } = world();
    const head = win.roomHeadHtml(c, { primary: false });
    assert.ok(!/id="ws-back"/.test(head),
      'the rail already carries Contracts, lit; an arrow here is a second door');
    assert.ok(!/data-back="contract"/.test(head), 'and certainly not the negotiation\'s one');
  });

  test('its crumb row still names the contract, for a stage with no bar', () => {
    const { win, c } = world();
    const head = win.roomHeadHtml(c, { primary: false });
    assert.match(head, /class="room-crumb-here"/,
      'the browser harnesses have no #shell-title, and a head with nothing in its crumb says nothing');
  });

  test('and the row folds itself away once the bar is there', () => {
    assert.match(HTML, /\.room-head \.room-crumb:not\(:has\(\.room-crumb-back\)\)\{display:none;?\}/,
      'no button in the nav, no row — the same rule that hid it when the bar took the button');
  });
});

describe('f449 (2) — the negotiate page keeps the arrow, and only the arrow', () => {
  test('its head draws #ws-back, pointed at the contract', () => {
    const { win, c } = world();
    const head = win.roomHeadHtml(c, { primary: false, backToContract: true });
    assert.match(head, /id="ws-back"/, 'the one journey the rail cannot make');
    assert.match(head, /data-back="contract"/, 'and it lands on the Document tab');
  });

  test('the title is still a door too, so the contract has two ways back', () => {
    const { win, c } = world();
    const head = win.roomHeadHtml(c, { primary: false, backToContract: true });
    assert.match(head, /id="ws-back-title"/,
      'the biggest target on the page, and the same handler');
  });

  test('#ws-back is still ONE button in the whole file', () => {
    assert.equal((CONTRACT.match(/id="ws-back"/g) || []).length, 1,
      're-dressed and moved, never cloned — two would be two handlers and two destinations');
  });

  test('the sign and its spoken name are both still on it', () => {
    assert.match(NAV, /<use href="#i-left"\/>/, 'the sprite\'s own left chevron');
    assert.match(NAV, /title="\$\{esc\(backTitle\)\}" aria-label="\$\{esc\(backTitle\)\}"/,
      'the word is not lost — it is the hover and the label');
  });
});

describe('f449 (3) — what the bar prints', () => {
  test('the room branch prints the SECTION, not the contract', () => {
    assert.match(ADOPT, /i18t\('nav_contracts'\)/,
      'a label for where you are, not a destination: ct_back_register is "back to the contract list"');
    assert.ok(!/contractRef/.test(ADOPT) && !/roomHeadTitle/.test(ADOPT),
      'the reference and the name are said once, by the page under the bar');
  });

  test('the negotiations door and the separator are gone with the rest of the wording', () => {
    assert.ok(!/crumb-door/.test(ADOPT),
      'one crumb, not two: the rail already carries Negotiations');
    assert.ok(!/crumb-sep/.test(ADOPT),
      'nothing left to separate');
  });

  test('a word left on the button from an earlier paint is cleared', () => {
    assert.match(ADOPT, /querySelectorAll\('\.crumb-word'\)/,
      'the sign stands alone, and the button is re-used paint after paint');
  });

  test('the sign is PAINTED in the bar, not hidden there', () => {
    /* The region, anchored on the bar's own crumb block rather than on the
       first line that happens to contain the selector: #top-header colours
       the same button two thousand lines earlier. */
    const from = HTML.indexOf('#shell-title .crumb-door,#shell-title .room-crumb-back.in-crumb{');
    const rule = HTML.slice(from, HTML.indexOf('#shell-title .crumb-here{', from));
    assert.ok(rule.length > 0, 'the bar dresses the adopted button');
    assert.ok(!/\.in-crumb svg\{display:none/.test(rule),
      'this one line is the whole of why Young could not see his own arrow');
    assert.match(rule, /\.in-crumb svg\{display:block/,
      'drawn, with a size of its own');
  });
});

describe('f449 (4) — the trap: another page\'s button, still in the bar', () => {
  test('the room never adopts a button the bar is already holding', () => {
    const wire = CONTRACT.slice(CONTRACT.indexOf('const bar=document.getElementById(\'shell-title\')'),
      CONTRACT.indexOf('const goBack='));
    assert.ok(wire.length > 0, 'the wiring looks the head up before it wires the arrow');
    assert.match(wire, /\.room-head #ws-back/, 'the head\'s own button first');
    assert.match(wire, /bar&&bar\.contains\(any\)/,
      'and the fallback refuses anything parked in the bar — otherwise the room '
      + 'wears the negotiate page\'s arrow on every second visit');
  });

  test('shellCrumbAdopt decides from the button it is given', () => {
    assert.match(ADOPT, /data-back'\)==='contract'/,
      'the page it belongs to is written on it; nothing here reads state.view');
  });
});
