/* f263 — FIVE THINGS OFF FOUR SCREENSHOTS (owner-reported 31 Aug 2026, M-3..M-6)
   ========================================================================
   Sent with the ruling on Option A, in one message:

     image 1  "when you click on find obligations or scanning of obligations,
              it is not clear that something is working in the background so
              provide a symbol that a search is ongoing within the button"
     image 2  "never allow for addition of duplicate obligations"
     image 3  "remove the search bar on the left under negotiations because we
              already have one on top of the screen. Also remove the 'sorts
              within each group' writing"
     image 4  "it is never clear if there is a filter on so you can click
              clear ... the table has no column headers ... the overdue column
              needs to be the same size in every line therefore shorten the
              obligation. User can click the obligation and it takes them to
              the contract in question's obligation page"

   WHAT IS PINNED HERE:
     1  the scan says it is working at EVERY door, and stops whatever happens
     2  a duplicate obligation is refused at the form as well as at the scan,
        and an obligation never clashes with itself
     3  the Negotiations seat draws one search control, and a stale query on
        that seat narrows nothing
     4  the worklist names its columns, says which filter is on, and holds one
        row height
     5  both languages
   ======================================================================== */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld, supplyContract } = require('./world');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
const OB = strip(read('js/obligations.js'));
const REG = strip(read('js/views/register.js'));
const HTML = read('index.html');
const I18N = read('js/i18n.js');

const both = k => {
  assert.ok(new RegExp('\\b' + k + ':').test(I18N), k + ' is in the dictionary');
  assert.equal(I18N.split(new RegExp('\\b' + k + ':')).length - 1, 2, k + ' is in BOTH languages');
};

/* ============================================================
   M-3 — THE SCAN SAYS IT IS WORKING
   ============================================================ */
describe('f263 (1) — the scan says it is working, at every door', () => {

  test('THE REPORTED CAUSE: it reached one door of two', () => {
    /* runFindObligations wrote the busy state onto `#ob-find` — the Checks
       card's door — by name. The contract's own Obligations tab draws
       `#obt-find`, which was never touched at all, and that tab is the screen
       in the screenshot. */
    const fn = OB.match(/async function runFindObligations\(c\)\{[\s\S]*?\n\}/)[0];
    assert.ok(!/getElementById\('ob-find'\)/.test(fn),
      'it must not reach for one door by name — that IS the report');
    assert.match(fn, /obFindBusy\(true\)/, 'it says so through the one helper');
    assert.match(fn, /obFindBusy\(false\)/, 'and stops through the same one');
  });

  test('ONE HELPER, EVERY DOOR — a list, so a third cannot be forgotten', () => {
    assert.match(OB, /const OB_FIND_DOORS = \['ob-find', 'obt-find'\]/,
      'the doors are named in one place');
    const helper = OB.match(/function obFindBusy\(on\)\{[\s\S]*?\n\}/)[0];
    assert.match(helper, /OB_FIND_DOORS\.forEach/, 'and the helper walks that list');
    /* THE LABEL IS REMEMBERED ON THE ELEMENT, not rebuilt from a key: the two
       doors do not read the same word, and a helper that put one word back on
       both would silently rename the other. */
    assert.match(helper, /b\.dataset\.obWas == null\) b\.dataset\.obWas = b\.innerHTML/,
      'each door remembers its own label');
    assert.match(helper, /b\.innerHTML = b\.dataset\.obWas/, 'and gets it back');
  });

  test('AND IT STOPS SPINNING WHATEVER HAPPENS', () => {
    /* A refusal deep in the reader — no key, a provider saying no, a document
       too short — must not leave a button disabled and spinning for the life of
       the page, which is a dead screen wearing a working one's clothes. */
    const fn = OB.match(/async function runFindObligations\(c\)\{[\s\S]*?\n\}/)[0];
    assert.match(fn, /try\{ found = await extractObligations\(c\)[\s\S]{0,40}?\}\n\s*finally\{ obFindBusy\(false\); \}/,
      'the stop is in a finally, not on the happy path');
  });

  test('A SYMBOL, NOT ONLY A WORD — and it stands still for a reader who asked', () => {
    assert.match(HTML, /\.ob-spin\{[^}]*animation:obSpin/, 'a spinning ring');
    assert.match(HTML, /\.ob-spin\{[^}]*border-top-color:transparent/, 'drawn as a ring, not a disc');
    assert.match(HTML, /\.ob-spin\{[^}]*border:2px solid currentColor/,
      'in the button\'s own ink, so it needs no rule per theme or per accent');
    assert.match(HTML, /prefers-reduced-motion: reduce\)\{ \.ob-spin\{ animation:none; \} \}/,
      'still drawn, just not moving — the fact is still owed');
    const helper = OB.match(/function obFindBusy\(on\)\{[\s\S]*?\n\}/)[0];
    assert.match(helper, /class="ob-spin"/, 'and the button really carries it');
    assert.match(helper, /aria-busy/, 'said to a reader who cannot see it spin');
  });

  test('the word is in both languages', () => both('ob_scanning'));
});

/* ============================================================
   M-4 — NO DUPLICATE OBLIGATIONS, EVER
   ============================================================ */
describe('f263 (2) — a duplicate obligation is refused at the form too', () => {

  test('THE GAP: the scan refused one and the form did not', () => {
    const form = OB.match(/document\.getElementById\('of-save'\)\.addEventListener[\s\S]*?\n  \}\);/)[0];
    assert.match(form, /obligationAlreadyOn\(others,o\)/,
      'the form asks the ONE reading rather than growing a second');
    assert.match(form, /toast\(i18t\('ob_dupe'/, 'and refuses in words');
    /* THE ORDER MATTERS: refused before the push, or the duplicate is on the
       record and the message is a description of what just happened. */
    assert.ok(form.indexOf('obligationAlreadyOn(others,o)') < form.indexOf('c.obligations.push(o)'),
      'refused before anything is written');
  });

  test('NEVER AGAINST ITSELF — editing without changing the wording is not a duplicate', () => {
    const form = OB.match(/document\.getElementById\('of-save'\)\.addEventListener[\s\S]*?\n  \}\);/)[0];
    assert.match(form, /const others = \{ obligations:\(c\.obligations\|\|\[\]\)\.filter\(\(_,i\)=>!\(editing&&i===seed\._i\)\) \}/,
      'the row being edited is left out of the comparison');
  });

  test('ONE READING, and it folds whitespace and case like the scan', () => {
    const { win } = buildWorld({ obligations: true });
    const c = { obligations: [{ id: 'a1', desc: 'Quarterly  report.' }] };
    assert.equal(win.obligationAlreadyOn(c, { desc: 'quarterly report' }), true,
      'the same clause read twice comes back punctuated a little differently');
    assert.equal(win.obligationAlreadyOn(c, { desc: 'Annual report' }), false);
    assert.equal(win.obligationAlreadyOn(c, { desc: '' }), false, 'nothing is not a duplicate');
    /* AND THE EXCLUSION REALLY EXCLUDES: the same object compared against a
       list it is not in reports free. */
    const others = { obligations: c.obligations.filter((_, i) => i !== 0) };
    assert.equal(win.obligationAlreadyOn(others, c.obligations[0]), false);
  });

  test('and the scan\'s own guard is untouched', () => {
    assert.match(OB, /const dupe = found\.map\(o => obligationAlreadyOn\(c, o\)\)/,
      'shown unticked with a word saying why, never silently dropped');
    assert.match(OB, /if\(obligationAlreadyOn\(c,o\)\) return;/,
      'and asked again at the add, so a proposal cannot slip in between');
  });

  test('the refusal is in both languages', () => both('ob_dupe'));
});

/* ============================================================
   M-5, THEN N-3 — ONE SEARCH BOX, AND IT IS THE SHELL'S
   ------------------------------------------------------------
   REVERSED IN PLACE 31 Aug 2026. M-5 removed the box from Negotiations and this
   block asserted that Contracts kept its own — which was right about the ASK
   (the owner named Negotiations and only Negotiations) and is now overtaken by
   the owner naming the other seat in the same words: *"remove the search open
   text field in the contracts page."*

   THE CLAIM IS SIMPLER FOR IT: it is no longer a question about seats at all.
   Neither draws one, so the guard goes rather than flipping — a condition that
   is false on every seat is one the next reader has to rule out.
   ============================================================ */
describe('f263 (3) — neither seat draws a search control', () => {

  test('the page\'s own box is drawn on neither seat', () => {
    assert.match(REG, /const ftsBlock='';/,
      'no seat gate is left behind — the box is simply not drawn');
    assert.ok(!/id="reg-search"/.test(REG),
      'and the markup is gone rather than left dead behind a false condition');
  });

  test('THE FTS WIRING IS NOT DELETED — every handler guards on the element', () => {
    /* A second code path for one seat is how the two come to disagree. What
       makes not drawing it safe is that everything downstream already asked
       whether the element was there. */
    assert.match(REG, /const si=document\.getElementById\('reg-search'\);\n\s*if\(si\)\{/,
      'the input wiring guards');
    assert.match(REG, /const box=document\.getElementById\('reg-fts'\); if\(!box\) return;/,
      'and so does the dropdown');
    assert.match(strip(read('js/app.js')), /const rs=document\.getElementById\('reg-search'\); if\(rs&&rs!==search\)/,
      'and the shell bar\'s own write');
  });

  test('A STALE QUERY NARROWS NOTHING, ON EITHER SEAT', () => {
    /* The shell bar writes regState().query and then navigates, so a value
       really can be left on the state. A page narrowed by a control nobody can
       see is worse than the duplicate box ever was, because there is nothing on
       screen to press to widen it again. */
    assert.ok(!/R\.query\)\.trim\(\)\.toLowerCase\(\)/.test(REG),
      'the text filter is gone from the ONE reading, not cleared in a renderer '
      + 'another path goes around');

    const w = buildWorld({ negotiationView: true, contractView: true, registerView: true });
    const { win } = w;
    const a = supplyContract({ id: 'MK-1', name: 'Warehousing' });
    const b = supplyContract({ id: 'MK-2', name: 'Distribution' });
    [a, b].forEach(c => win.negoInit(c));
    a.changes.push({ id: 'CHG-1', status: 'pending', authorSide: 'counterparty',
      clauseId: 'c1', kind: 'edit', author: 'Them', seq: 1 });
    b.changes.push({ id: 'CHG-2', status: 'pending', authorSide: 'counterparty',
      clauseId: 'c1', kind: 'edit', author: 'Them', seq: 1 });
    win.state = Object.assign({}, win.state, { contracts: [a, b], activeId: null, view: 'redline' });
    win.getContract = id => [a, b].find(c => c.id === id) || null;

    win.regSetScope('negotiations');
    const beforeNeg = win.regFiltered().length;
    win.regState().query = 'Warehousing';
    assert.equal(win.regFiltered().length, beforeNeg,
      'a query nobody can see must not narrow Negotiations');

    /* AND THE SAME ON CONTRACTS, which is what N-3 changed: this used to be the
       CONTROL — the seat where the box was drawn and the query still bit. */
    win.regSetScope(null);
    const beforeReg = win.regFiltered().length;
    win.regState().query = 'Warehousing';
    assert.equal(win.regFiltered().length, beforeReg,
      'nor Contracts, now that it draws no box either');
  });

  test('AND WHAT COUNTS AS NARROWED AGREES WITH WHAT NARROWS', () => {
    /* Two answers to one question is how a Clear button comes to offer itself
       over a list nothing filtered — the empty state saying one thing and the
       reading behind it another. */
    const empty = REG.match(/const filtered = [^;]+;/)[0];
    assert.ok(!/R\.query/.test(empty),
      'the empty state does not count a query that narrows nothing');
    assert.match(empty, /R\.stage!=='all'/, 'and still counts the filters that do');
  });

  test('THE SORT NOTE IS GONE, and its key is left inert in both languages', () => {
    assert.ok(!/reg-sort-note/.test(REG), 'the element is gone');
    assert.ok(!/ngl_sort_note/.test(REG), 'and nothing reads the key');
    /* Left in the dictionary rather than deleted from one language and not the
       other, which is how a screen ends up half-English. */
    both('ngl_sort_note');
  });
});

/* ============================================================
   M-6 — THE WORKLIST READS AS A TABLE
   ============================================================ */
describe('f263 (4) — the worklist names its columns and states its filters', () => {

  test('ONE STATEMENT OF THE DEFAULTS, and it is not "everything is All"', () => {
    /* State opens on `open`, which is a cut — so a reading that compared
       against 'all' would report the page as filtered the moment it was drawn. */
    assert.match(OB, /const OBW_DEF = \{ whose:'all', state:'open', side:'all', folder:'all', due:'all' \}/);
    assert.match(OB, /if\(!_obwF\) _obwF = \{ \.\.\.OBW_DEF \}/,
      'the page opens on the same answer the reading compares against');
    const { win } = buildWorld({ obligations: true });
    win._obwF = null;
    /* Compared as STRINGS: the array comes back from the jsdom realm and is
       never reference-equal to one built here, which deepStrictEqual reads as a
       difference — this codebase's own recorded trap. */
    const narrow = f => [...win.obwNarrowing(f)].sort().join(',');
    assert.equal(narrow(win.obwFilters()), '',
      'a freshly drawn page reports nothing narrowing it');
    assert.equal(narrow({ ...win.obwFilters(), state: 'all' }), 'state',
      'and widening State counts as narrowing, because the default is a cut');
    assert.equal(narrow({ ...win.obwFilters(), side: 'theirs', due: '7' }), 'due,side');
  });

  test('CLEAR STATES ITSELF: dead and quiet at zero, counting above it', () => {
    const list = OB.match(/function renderObligationsList\(\)\{[\s\S]*?\n\}/)[0];
    assert.match(list, /const narrowing = obwNarrowing\(f\);/, 'one reading, asked once');
    assert.match(list, /id="obw-clear" class="ui-btn\$\{narrowing\.length \? ' is-on' : ''\}/,
      'accented while something is on');
    assert.match(list, /narrowing\.length \? '' : ' disabled'/,
      'and refused when pressing it would do nothing');
    assert.match(list, /i18tn\('ob_clear_on', narrowing\.length/, 'the reason is on the hover');
    assert.match(list, /i18t\('ob_clear_none'\)/, 'either way');
    assert.match(HTML, /#obw-clear:disabled\{ opacity:\.5; cursor:default; \}/);
  });

  test('AND EACH CONTROL SAYS WHETHER IT IS THE ONE NARROWING', () => {
    /* The register settled this on 25 Aug — an active filter takes
       --accent-ink — so this page takes that answer rather than a second
       vocabulary. --accent-ink is the one accent ink with a dark answer, which
       is why every active-filter rule in the product reads it. */
    const sel = OB.match(/function obwSelect\(id, opts, cur\)\{[\s\S]*?\n\}/)[0];
    assert.match(sel, /const on = String\(cur\) !== String\(OBW_DEF\[id\]\)/,
      'compared against the default, never against "all"');
    assert.match(sel, /class="obw-f\$\{on \? ' is-on' : ''\}"/);
    assert.match(HTML, /\.obw-f\.is-on select\{ border-color:var\(--accent-solid\); color:var\(--accent-ink\)/);
    /* the hand-written folder control takes the same class from the same rule */
    const list = OB.match(/function renderObligationsList\(\)\{[\s\S]*?\n\}/)[0];
    assert.match(list, /class="obw-f\$\{f\.folder !== OBW_DEF\.folder \? ' is-on' : ''\}"/);
  });

  test('THE TABLE NAMES ITS COLUMNS, on the widths it already declares', () => {
    const list = OB.match(/function renderObligationsList\(\)\{[\s\S]*?\n\}/)[0];
    assert.match(list, /<table class="obw-table"><thead><tr>/);
    for (const cls of ['obw-c', 'obw-side', 'obw-who', 'obw-when', 'obw-acts'])
      assert.ok(new RegExp('<th class="' + cls + '"').test(list), cls + ' is named');
    /* THE HEAD FOLLOWS THE SAME `money` READING AS THE CELLS, so the two cannot
       come to disagree about how many columns there are. */
    assert.match(list, /\$\{money \? `<th class="obw-amt">/);
    assert.equal((list.match(/\$\{money \? `<td class="obw-amt/g) || []).length, 1);
    /* The verb column is deliberately unnamed on screen: a heading over a
       column of verbs names nothing a reader needs. */
    assert.match(list, /<th class="obw-acts"><span class="sr-only">/);
    assert.match(HTML, /\.sr-only\{position:absolute!important/, 'and sr-only really exists');
    assert.match(HTML, /\.obw-table thead th\{ position:sticky/,
      'the head does not scroll away, or the columns are unlabelled again');
  });

  test('THE DESCRIPTION IS ONE LINE, AND THE DATE COLUMN HOLDS ONE VERTICAL', () => {
    /* ONE line, not two. MEASURED in a browser: unclamped the table held rows of
       91px and 236px — a spread of 145 — and clamped to TWO it still held 54 and
       72, because a row is then one line or two depending on its wording. At one
       line every row is the description plus its meta line and the table has ONE
       height, which is what "the same size in every line" means. */
    assert.match(HTML, /\.obw-what\{ display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; \}/,
      'cut to one line, with an ellipsis saying there is more');
    /* NOTHING IS HIDDEN SILENTLY: the whole wording is on the row's own title
       and one press away in full. */
    const list = OB.match(/function renderObligationsList\(\)\{[\s\S]*?\n\}/)[0];
    assert.match(list, /class="obw-what[\s\S]{0,90}?title="\$\{_obEsc\(o\.desc \|\| ''\)\}"/);
    /* THE DOT LEFT THE TEXT FLOW: inside a clamped box an inline-block dot
       counts as one of the two lines, so a long obligation would have shown the
       dot and ONE line of wording. */
    assert.match(HTML, /\.obw-cw\{ display:flex/);
    assert.match(HTML, /\.obw-dot\{ flex:none/);
    assert.ok(!/\.obw-dot\{ display:inline-block/.test(HTML), 'and is not inline any more');
  });

  test('THE OBLIGATION IS THE DOOR, and it always was', () => {
    /* The behaviour was already there — the row opens its contract on the
       Obligations tab — and nothing on the row said so, which is why the report
       asked for something the page already did. */
    const list = OB.match(/function renderObligationsList\(\)\{[\s\S]*?\n\}/)[0];
    assert.match(list, /\[data-obw-row\]'\)\.forEach\(tr => tr\.addEventListener\('click'/);
    assert.match(list, /roomGoTab\(c, 'oblig'\)/, 'and lands on the tab the row is about');
    assert.match(HTML, /\.obw-table tr\[data-obw-row\]:hover \.obw-what\{ text-decoration:underline; \}/,
      'the description reads as the door it is');
  });

  test('the column names are in both languages', () => {
    ['ob_col_what', 'ob_col_side', 'ob_col_who', 'ob_col_when', 'ob_col_acts',
      'ob_clear_none', 'ob_clear_on_one', 'ob_clear_on_other'].forEach(both);
  });
});
