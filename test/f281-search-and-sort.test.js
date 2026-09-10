/* f281 — THE SEARCH NARROWS AGAIN, AND EVERY COLUMN SORTS (segment 5 of 6)
   ========================================================================
   Two of the owner's thirteen, 10 Sep 2026, and both are about the Contracts
   page: *"the search feature is not working"* and *"I should be able to sort
   on each column like in the signed column."*

   THE SEARCH WAS DEAD, AND THE CAUSE IS ONE COMMENT'S OVER-REACH. N-3
   (31 Aug 2026) retired the register's OWN search box on the Contracts seat —
   the owner asked for it, because the shell bar carries one directly above —
   and took the text filter out of regFiltered with it, reasoning that "a page
   narrowed by a control nobody can see" is the worse fault. That reasoning is
   right about the box that was removed and wrong about the one that remains:
   the shell bar's box is on screen, says "Search contracts, clauses,
   counterparties…", writes regState().query and then opens Contracts — where
   nothing has read that field since. MEASURED in a browser before this was
   written: four rows, type "lease", four rows.

   AND THE SECOND HALF WOULD HAVE SURVIVED THE FIRST. regState() answers for
   whichever seat is showing, so typing from the Negotiations page wrote the
   query onto state.regNego and then opened Contracts, whose own query is
   empty. MEASURED: {contractsQuery:"", negoQuery:"lease"}. regShowOnly has
   cleared the scope before reading the state since it was written, for exactly
   this reason; this door never did.

   WHAT IS PINNED:
     1  the query narrows again, on the seat that has a box for it
     2  "is anything narrowing" is ONE reading — it was written three times
        and all three disagreed
     3  the way back clears the query AND the box that holds it
     4  the shell bar writes to the seat it LANDS on
     5  every column that can be ordered has a head that orders it
     6  a blank cell sorts LAST in both directions — one reading, four columns
     7  the reference sorts as a number, not as a string
     8  the stream sorts by the word the cell prints
     9  the Sort dropdown and the column heads are ONE list
    10  both languages

   WHAT DRAWS is contracts-page-verify's: whether the box really narrows the
   table, whether a head can be pressed, and whether the column comes back in
   the order it claims are questions jsdom cannot answer. The files name each
   other. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');
const i18n = require('../js/i18n.js');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
/* Comments carry the arguments in this codebase and would answer half of these
   assertions by accident. Every claim that reads source strips them. */
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

const REG = strip(read('js/views/register.js'));
const APP = strip(read('js/app.js'));
const NEGV = strip(read('js/views/negotiation.js'));

const w = buildWorld({ registerView: true });
const win = w.win;

/* A book with the shapes that matter: a blank counterparty, a blank stream,
   ids that sort differently as text and as numbers. */
function seed(){
  win.state = Object.assign(win.state || {}, { contracts: [] });
  win.state.contracts = [
    /* The streams are the world's OWN ids — 'proc' is Procurement and 'sales'
       is Sales — because the column prints the folder's NAME and a made-up id
       resolves to blank, which would make two rows blank and the claim
       meaningless. */
    { id:'MK-10', name:'Zebra lease',   counterparty:'Acme Ltd',  folder:'sales', status:'Draft', lastAction:'2026-01-01' },
    { id:'MK-2',  name:'Alpha supply',  counterparty:'',          folder:'proc',  status:'Draft', lastAction:'2026-01-02' },
    { id:'MK-9',  name:'Middle lease',  counterparty:'zeta plc',  folder:null,    status:'Draft', lastAction:'2026-01-03' },
  ];
  const R = win.regState();
  Object.assign(R, { query:'', stage:'all', type:'all', category:'all', signed:'all',
    payterms:'all', sort:'updated', dir:-1, page:1, sel:{}, view:null, only:null, renewal:'all' });
  return R;
}

describe('f281 (1) — the search narrows again', () => {
  test('a query typed into the shell bar filters the Contracts list', () => {
    win.regSetScope(null);
    const R = seed();
    assert.equal(win.regFiltered().length, 3, 'the control: nothing narrowed');
    R.query = 'lease';
    const got = [...win.regFiltered().map(c => c.id)].sort();
    assert.deepEqual(got, ['MK-10', 'MK-9'], 'the two leases, and not the supply');
  });

  test('it reads the name, the counterparty and the reference', () => {
    win.regSetScope(null);
    const R = seed();
    /* THE ONLY ONE, never merely "among them": a claim written as includes()
       is satisfied by a page that filters nothing at all, which is exactly the
       state being fixed. */
    for (const [q, id] of [['zebra','MK-10'], ['acme','MK-10'], ['mk-2','MK-2'], ['ZETA','MK-9']]){
      R.query = q;
      const got = [...win.regFiltered().map(c => c.id)];
      assert.deepEqual(got, [id], `"${q}" finds ${id} and nothing else — got ${JSON.stringify(got)}`);
    }
  });

  test('AND THE PHONE\u2019S OWN BOX IS MENDED BY THE SAME LINE', () => {
    /* The duplication warning in its usual direction, and nobody had reported
       it: the phone draws its own #m-reg-q, writes the same regState().query
       and reads the same regFiltered — so retiring the filter killed the
       phone's search too. It is one reading, so one fix reaches both shells,
       and the phone's own paint sets the scope to null on Contracts. */
    const MOB = strip(read('js/mobile-screens.js'));
    const MOBJS = strip(read('js/mobile.js'));
    assert.match(MOB, /id="m-reg-q"/, 'the phone still draws a search box');
    assert.match(MOB, /R\.query = q\.value/, 'and writes the one query field');
    assert.match(MOB, /regFiltered\(\)/, 'and reads the one filtered set');
    assert.match(MOBJS, /regSetScope\(s\.screen==='negotiations' \? 'negotiations' : null\)/,
      'its Contracts screen is the seat the query narrows');
  });

  /* A CONTROL: true before this change and after it. Its job is to fail the
     day somebody widens the fix to a seat that has no box to say so. */
  test('and the Negotiations seat, which draws no box anywhere, is untouched', () => {
    /* M-5's rule and the reason for it are unchanged: that page has no search
       control on either shell, and a page narrowed by a control nobody can see
       is worse than the duplicate box ever was. The shell bar's own box always
       navigates to Contracts, so it can never be the one narrowing here. */
    win.regSetScope('negotiations');
    const R = seed();
    /* This seat narrows to live negotiations before any filter runs, so the
       claim is a COMPARISON rather than a count: whatever it holds, a query
       must not change it. */
    const before = win.regFiltered().length;
    R.query = 'lease';
    assert.equal(win.regFiltered().length, before, 'the query narrows nothing on this seat');
    win.regSetScope(null);
  });
});

describe('f281 (2) — one reading of "is anything narrowing"', () => {
  test('it is named once and every surface asks it', () => {
    assert.match(REG, /function regNarrowed\s*\(/, 'the reading exists');
    /* THREE COPIES, ALL DISAGREEING, is what this replaces: the empty state's
       left out signed and payterms, the filter bar's left out the query, and
       the Negotiations head counted a query that narrowed nothing. */
    const inline = REG.match(/R\.stage!=='all'\|\|R\.type!=='all'/g) || [];
    assert.equal(inline.length, 0,
      'no surface works it out again — ' + inline.length + ' left');
    assert.ok(/regNarrowed\(/.test(NEGV),
      'the Negotiations head asks the same reading rather than keeping its own');
  });

  test('the query counts as narrowing, and only where it narrows', () => {
    win.regSetScope(null);
    const R = seed();
    assert.equal(win.regNarrowed(R), false, 'a clean page is not narrowed');
    R.query = 'lease';
    assert.equal(win.regNarrowed(R), true, 'a query is a filter like any other');
    R.query = '   ';
    assert.equal(win.regNarrowed(R), false, 'whitespace is not a query');
    R.query = '';
    for (const k of ['stage','type','category','signed','payterms']){
      R[k] = 'x'; assert.equal(win.regNarrowed(R), true, k + ' counts'); R[k] = 'all';
    }
  });

  test('and on the seat with no box, a stale query is not called a filter', () => {
    /* Or the head would offer "Clear" over a list nothing had narrowed — the
       control saying one thing and the table another. */
    win.regSetScope('negotiations');
    const R = seed(); R.query = 'lease';
    assert.equal(win.regNarrowed(R), false);
    win.regSetScope(null);
  });
});

describe('f281 (3) — the way back clears the query and the box', () => {
  test('both Clear controls empty the shell bar as well as the state', () => {
    const src = REG;
    for (const anchor of ['reg-empty-clear', 'reg-clear-filters']){
      const at = src.indexOf("getElementById('" + anchor + "')");
      assert.ok(at > 0, anchor + ' is wired');
      const body = src.slice(at, at + 460);
      assert.match(body, /R\.query=''/, anchor + ' clears the query');
      assert.match(body, /cmd-search/, anchor + " empties the shell bar's own box");
    }
  });

  test('and it is PAINTED, because the search repaints only the body', () => {
    /* A Clear interpolated into the filter bar's markup appears on a full
       render alone — and the shell bar's search calls renderRegisterBody on
       every keystroke, so the page would be narrowed with nothing on it to
       press. One builder, one wiring, one painter, called from both. */
    assert.match(REG, /function regClearHtml\s*\(/);
    assert.match(REG, /function wireRegClear\s*\(/);
    assert.match(REG, /id="reg-clear-slot"/, 'the bar carries a slot');
    const body = REG.slice(REG.indexOf('function renderRegisterBody'));
    assert.match(body.slice(0, 900), /regPaintClear\(\)/,
      'and the body painter paints it');
    assert.equal((REG.match(/id="reg-clear-filters"/g) || []).length, 1,
      'the button is built in exactly one place');
  });
});

describe('f281 (4) — the shell bar writes to the seat it lands on', () => {
  test('the scope is cleared before the state is read', () => {
    /* regShowOnly has done this since it was written, in its own words: "a
       calendar day pressed while the reader happened to be on the Negotiations
       page would write its answer into that page's filters and then open a
       register that had never heard of it." MEASURED on this door before the
       fix: {contractsQuery:"", negoQuery:"lease"}. */
    const at = APP.indexOf("getElementById('cmd-search')");
    assert.ok(at > 0, 'the shell bar box is wired');
    const body = APP.slice(at, at + 700);
    const scope = body.indexOf('regSetScope');
    const write = body.indexOf('.query=');
    assert.ok(scope > 0, 'it names the scope');
    assert.ok(scope < write, 'and clears it BEFORE the state is read');
  });
});

describe('f281 (5) — every column that can be ordered has a head that orders it', () => {
  test('the four columns the owner named are sortable', () => {
    for (const k of ['ref', 'name', 'party', 'stream', 'value', 'signed', 'expiry', 'stage'])
      assert.ok(win.REG_CMP[k], k + ' has a comparator');
    /* Drawn, not merely defined: a comparator with no head is a sort nobody
       can reach from the table. */
    const head = REG.slice(REG.indexOf("sortableTh('name'") - 600, REG.indexOf('ngl_col_move') + 80);
    for (const k of ['ref', 'name', 'party', 'stream', 'value', 'expiry', 'stage'])
      assert.ok(head.includes(`sortableTh('${k}'`), k + "'s head sorts");
  });

  test('and the last column deliberately does not', () => {
    /* On Contracts it holds the row's ⋯ and carries no heading, so there is
       nothing to press and nothing to order; on Negotiations it is whose move,
       which is the very thing the bands above already group by. */
    const from = REG.indexOf("sortableTh('stage'");
    const last = REG.slice(REG.indexOf('}', from) + 1, REG.indexOf('</tr>', from));
    assert.ok(last.includes('ngl_col_move'), 'the slice really is the last column');
    assert.ok(!last.includes('sortableTh('), 'and it carries no sort');
    assert.ok(!last.includes('data-reg-sort'), 'nor a head that claims one');
  });

  test('every sort has a default direction and a place in the dropdown', () => {
    /* ONE LIST, OR THE TWO CONTROLS LIE ABOUT EACH OTHER. A <select> whose
       value matches no option falls back to its first, so sorting by a head
       the dropdown does not offer left it reading "Recently updated" over a
       table sorted by something else — the Signed FILTER's own recorded trap,
       one control along. */
    const inMenu = [...win.REG_SORTS.map(s => s.k)];
    for (const k of Object.keys(win.REG_CMP)){
      assert.ok(win.REG_SORT_DEFDIR[k] !== undefined, k + ' states its direction');
      assert.ok(inMenu.includes(k), k + ' is offered in the Sort dropdown');
    }
    for (const k of inMenu) assert.ok(win.REG_CMP[k], k + ' in the menu has a comparator');
  });
});

describe('f281 (6) — a blank cell sorts last in both directions', () => {
  test('one reading, and the four columns that can be blank all ask it', () => {
    assert.match(REG, /function regBlanksLast\s*\(/, 'the reading is named once');
    const asks = (REG.match(/regBlanksLast\(/g) || []).length;
    assert.ok(asks >= 4, 'signed, counterparty and stream all ask it — ' + asks);
    /* The direction is ASKED, never assumed: regFiltered sorts with `dir*cmp`,
       so a value that puts the blanks last ascending puts them FIRST
       descending. This was the signed column's own claim and is now the one
       reading three more columns inherit. */
    const at = REG.indexOf('function regBlanksLast');
    assert.match(REG.slice(at, at + 320), /regState\(\)\.dir/,
      'it asks which way it is being read');
  });

  test('driven both ways, on the counterparty and on the stream', () => {
    win.regSetScope(null);
    const R = seed();
    for (const key of ['party', 'stream']){
      for (const dir of [1, -1]){
        R.sort = key; R.dir = dir;
        const order = [...win.regFiltered().map(c => c.id)];
        const blank = key === 'party' ? 'MK-2' : 'MK-9';
        assert.equal(order[order.length - 1], blank,
          `${key} at dir ${dir}: the blank is last — ${JSON.stringify(order)}`);
      }
    }
  });
});

describe('f281 (7) — the reference sorts as a number', () => {
  test('MK-2 before MK-9 before MK-10, not as text', () => {
    win.regSetScope(null);
    const R = seed();
    R.sort = 'ref'; R.dir = 1;
    assert.deepEqual([...win.regFiltered().map(c => c.id)], ['MK-2', 'MK-9', 'MK-10']);
    R.dir = -1;
    assert.deepEqual([...win.regFiltered().map(c => c.id)], ['MK-10', 'MK-9', 'MK-2']);
  });

  test('a lettered prefix keeps its own family', () => {
    /* A migrated book carries MK-P1 beside MK-2. Compared as one string the
       two families interleave; the prefix is compared first so each sorts
       within itself. */
    win.regSetScope(null);
    const R = seed();
    win.state.contracts.push({ id:'MK-P2', name:'Parent', counterparty:'A', folder:'sales', status:'Draft', lastAction:'2026-01-04' });
    win.state.contracts.push({ id:'MK-P10', name:'Parent ten', counterparty:'A', folder:'sales', status:'Draft', lastAction:'2026-01-05' });
    R.sort = 'ref'; R.dir = 1;
    const got = [...win.regFiltered().map(c => c.id)];
    assert.deepEqual(got, ['MK-2', 'MK-9', 'MK-10', 'MK-P2', 'MK-P10'], JSON.stringify(got));
  });
});

describe('f281 (8) — the stream sorts by the word the cell prints', () => {
  test('one reading, shared by the cell and the comparator', () => {
    /* Ordering by the folder ID would put the column in a sequence the reader
       cannot see, and core's streamLabel is a SHORT name — a third word again.
       So the cell and the sort ask one function. */
    assert.match(REG, /function regStreamName\s*\(/, 'the reading is named');
    assert.ok((REG.match(/regStreamName\(/g) || []).length >= 3,
      'the cell and the comparator both ask it');
    assert.ok(!/FOLDERS\[c\.folder\]\.name/.test(REG.slice(REG.indexOf('function regRowHtml'))),
      'no row builder reads the folder name for itself');
  });
});

describe('f281 (9) — both languages', () => {
  test('every new sort label is written in both books and reads differently', () => {
    const keys = ['reg_sort_ref', 'reg_sort_party', 'reg_sort_stream', 'reg_sort_stage'];
    for (const k of keys){
      const en = i18n.STRINGS.en[k], sv = i18n.STRINGS.sv[k];
      assert.ok(en && sv, k + ' is in both books');
      assert.notEqual(en, sv, k + ' is really translated');
    }
  });
});
