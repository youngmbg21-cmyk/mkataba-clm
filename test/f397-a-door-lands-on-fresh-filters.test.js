/* f397 — A DOOR FROM ANOTHER PAGE LANDS ON FRESH FILTERS
   =======================================================
   Young, 27 Sep 2026, over a screenshot of the Contracts page reading
   "Needs your decision ✕  Stage Drafting": *"i was on the home page and
   clicked on the main graph to take me to contracts and look at the contracts
   in draft stage. Then i went back to home and clicked on the needs your
   decision and it took me back to the contracts page but i did not see all the
   contracts that need my decision because they were filtered still on draft
   then needs your decision. This is counter productive. When you have chosen a
   new filter from outside the page and you are landed to the results, the
   previous filters should not be there."*

   WHAT WAS WRONG IS ONE SHAPE IN SIX COSTUMES. Every door onto the Contracts
   page from another page wrote its own short list of what to clear — the
   named-set door (regShowOnly) cleared nothing but the named set, the Map's
   stage door five filters, the phone's tiles three, the shell search none —
   so whatever the reader had left on the page an hour earlier went on cutting
   the list under a door that had counted the whole book.

   WHAT IS PINNED:
     1  ONE reading of "nothing is narrowing", derived from the filter
        catalogue, which keeps how the reader LOOKS (sort, direction, fold)
     2  the owner's journey, in the model: a named set lands with nothing else
        narrowing it, and the shell bar's box is emptied with the state
     3  a filter chosen ON the page still narrows further (a WALL)
     4  every door from another page goes through the one door: the Map's
        stage bar, Home's See all, the shell search typed elsewhere, the
        phone's tiles, My Queue's "+N more", and every caller of regShowOnly
     5  the named set still says where it came from (a WALL)

   WHAT DRAWS is fresh-filters-verify's: the owner's own presses on the real
   app, the rows that arrive and the chips that are lit. The files name each
   other. Claims marked [wall] pass at the parent by design. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
/* Comments carry the arguments in this codebase and would answer half of these
   assertions by accident. Every claim that reads source strips them. */
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
const REG = strip(read('js/views/register.js'));
const HOME = strip(read('js/views/home.js'));
const APP = strip(read('js/app.js'));
const PHONE = strip(read('js/mobile-screens.js'));
const QUEUE = strip(read('js/views/queue.js'));

/* The body of one named top-level function — PIN THE REGION, never a byte
   count: from its declaration to the next top-level declaration. */
function fnOf(src, name){
  const at = src.search(new RegExp('\\nfunction ' + name + '\\s*\\('));
  if (at < 0) return '';
  const rest = src.slice(at + 1);
  const next = rest.slice(1).search(/\n(?:async )?(function |const |let |Object\.assign)/);
  return next < 0 ? rest : rest.slice(0, next + 1);
}
/* A listener's own region: from its anchor to the end of the arrow body it
   opens, found by counting braces rather than characters. */
function handlerOf(src, anchor){
  const at = src.indexOf(anchor);
  if (at < 0) return '';
  const open = src.indexOf('{', src.indexOf('=>', at));
  let depth = 0;
  for (let i = open; i < src.length; i++){
    if (src[i] === '{') depth++;
    else if (src[i] === '}' && --depth === 0) return src.slice(at, i + 1);
  }
  return src.slice(at);
}

/* A book across every stage and both streams, so a stale filter of any kind
   has something to hide. The streams are the world's OWN ids. */
function world(){
  const w = buildWorld({ registerView: true, homeView: true });
  const win = w.win;
  win.state = Object.assign({}, win.state || {}, { contracts: [], view: 'dashboard' });
  win.state.contracts = [
    { id: 'MK-1', name: 'Alpha supply', counterparty: 'Acme Ltd', folder: 'sales', status: 'Draft', lastAction: '2026-09-01', metadata: { category: 'customer' } },
    { id: 'MK-2', name: 'Beta lease', counterparty: 'Juno Ltd', folder: 'proc', status: 'Draft', lastAction: '2026-09-02', metadata: {} },
    { id: 'MK-3', name: 'Gamma services', counterparty: 'Acme Ltd', folder: 'sales', status: 'Under Review', lastAction: '2026-09-03', metadata: {} },
    { id: 'MK-4', name: 'Delta supply', counterparty: 'Samsung', folder: 'sales', status: 'Signed', lastAction: '2026-09-04', metadata: { category: 'supplier' } },
    { id: 'MK-5', name: 'Epsilon lease', counterparty: 'Maersk', folder: 'proc', status: 'Signed', lastAction: '2026-09-05', metadata: {} },
    { id: 'MK-6', name: 'Zeta services', counterparty: 'Juno Ltd', folder: 'proc', status: 'Under Review', lastAction: '2026-09-06', metadata: {} },
  ];
  /* A door opens a page; this stage records where it went rather than
     drawing the whole application around it. */
  win.__went = [];
  win.setView = v => { win.state.view = v; win.__went.push(v); };
  if (typeof win.regSetScope === 'function') win.regSetScope(null);
  return win;
}
/* What a reader leaves behind on the Contracts page: a stage from the Map's
   bar, a stream, a category, a quick-filter tab, a search, a named set, and a
   page further down. Every one of them narrows this book. */
function leaveFilters(win){
  const R = win.regState();
  Object.assign(R, { stage: 'Draft', type: 'sales', category: 'customer', query: 'alpha',
    renewal: 'auto-renew', signed: 'last', payterms: 'none', docs: 'none', hold: 'on',
    only: { ids: ['MK-1', 'MK-2'], label: 'An earlier door' }, page: 3 });
  return R;
}
const ids = win => win.regFiltered().map(c => c.id).sort().join(',');
const need = (win, name) => assert.equal(typeof win[name], 'function', name + ' is published');

describe('f397 (1) — ONE reading of "nothing is narrowing"', () => {
  test('1a it puts every filter in the catalogue to rest, with the search, the named set and the page', () => {
    const win = world();
    need(win, 'regFiltersAtRest');
    const R = leaveFilters(win);
    R.view = 'expiring90';
    win.regFiltersAtRest(R);
    for (const f of win.REG_BAR_FILTERS)
      assert.equal(win.regFilterActive(f.k, R), false, f.k + ' is at rest');
    assert.equal(R.query, '', 'the search is empty');
    assert.equal(R.only, null, 'the named set is let go');
    assert.equal(R.page, 1, 'back to the first page');
    assert.equal(win.regNarrowed(R), false, 'and the page says nothing is narrowing it');
  });
  test('1b it keeps how the reader LOOKS — the sort, its direction, the amendment fold', () => {
    const win = world();
    need(win, 'regFiltersAtRest');
    const R = leaveFilters(win);
    Object.assign(R, { sort: 'value', dir: 1, flat: true });
    win.regFiltersAtRest(R);
    assert.deepEqual({ sort: R.sort, dir: R.dir, flat: R.flat }, { sort: 'value', dir: 1, flat: true });
  });
  test('1c it is DERIVED from the catalogue: a filter added tomorrow is cleared without being listed', () => {
    const win = world();
    need(win, 'regFiltersAtRest');
    win.REG_BAR_FILTERS.push({ k: 'zzNew', fixed: false, label: 'A new filter' });
    try {
      const R = win.regState(); R.zzNew = 'narrowing';
      win.regFiltersAtRest(R);
      assert.equal(R.zzNew, 'all', 'a filter nobody listed by hand is still put to rest');
    } finally { win.REG_BAR_FILTERS.pop(); }
    assert.match(fnOf(REG, 'regFiltersAtRest'), /REG_BAR_FILTERS\.forEach/, 'read off the catalogue, not a list of its own');
  });
  test('1d both Clear buttons ask the same reading — a door and Clear cannot disagree', () => {
    for (const anchor of ["getElementById('reg-clear-filters')", "getElementById('reg-empty-clear')"]){
      const h = handlerOf(REG, anchor);
      assert.ok(h, anchor + ' is wired');
      assert.match(h, /regFiltersAtRest\(/, anchor + ' asks the one reading');
      assert.ok(!/R\.stage\s*=/.test(h), anchor + ' keeps no list of its own');
    }
  });
});

describe('f397 (2) — the owner\'s journey, in the model', () => {
  test('2a a named set lands with nothing else narrowing it: every contract on it, and only those', () => {
    const win = world();
    leaveFilters(win);
    const set = ['MK-1', 'MK-3', 'MK-4', 'MK-5'];
    win.regShowOnly(set, 'Needs your decision');
    assert.equal(ids(win), set.slice().sort().join(','),
      'the list holds the whole named set, across every stage — not the drafts left over from the stage door');
    assert.equal(win.state.view, 'register', 'and it opened the Contracts page');
  });
  test('2b and the page says the named set is the only thing narrowing it', () => {
    const win = world();
    const R = leaveFilters(win);
    win.regShowOnly(['MK-3', 'MK-4'], 'Needs your decision');
    for (const f of win.REG_BAR_FILTERS)
      assert.equal(win.regFilterActive(f.k, R), false, f.k + ' is not narrowing the landing');
    assert.equal(R.query, '', 'no search left narrowing it');
    assert.equal(R.page, 1);
  });
  test('2c the shell bar\'s box is emptied with the search it held', () => {
    const win = world();
    const box = win.document.createElement('input'); box.id = 'cmd-search'; box.value = 'alpha';
    win.document.body.appendChild(box);
    try {
      leaveFilters(win);
      win.regShowOnly(['MK-4'], 'A door');
      assert.equal(box.value, '', 'the box says what the list is narrowed by — nothing');
    } finally { box.remove(); }
  });
  test('2d [wall] a door from the Negotiations page writes the Contracts seat, never that page\'s own filters', () => {
    const win = world();
    win.regSetScope('negotiations');
    const N = win.regState(); N.stage = 'Draft';
    win.regShowOnly(['MK-4'], 'A door');
    assert.equal(win.regScope(), null, 'the seat is back on Contracts');
    assert.equal(win.state.regNego.stage, 'Draft', 'the Negotiations seat keeps what its reader chose');
    /* Joined, never deepEqual'd: an array born inside jsdom carries that
       realm's prototype and two identical lists compare unequal. */
    assert.equal(win.state.reg.only.ids.join(','), 'MK-4');
  });
});

describe('f397 (3) — [wall] a filter chosen ON the page still narrows further', () => {
  test('3a a stage picked after landing narrows inside the named set, and keeps the set', () => {
    const win = world();
    win.regShowOnly(['MK-1', 'MK-3', 'MK-4', 'MK-5'], 'Needs your decision');
    const R = win.regState(); R.stage = 'Signed';
    assert.equal(ids(win), 'MK-4,MK-5', 'the chip narrows inside what is on the page');
    assert.ok(R.only && R.only.ids.length === 4, 'and the named set is still there');
  });
});

describe('f397 (4) — every door from another page goes through the one door', () => {
  test('4a the Map\'s stage bar lands on that stage and nothing else', () => {
    const win = world();
    need(win, 'hmMapWire');
    leaveFilters(win);
    const el = win.document.createElement('div');
    el.innerHTML = '<button type="button" data-hm-map="stage:Signed">Signed</button>';
    win.document.body.appendChild(el);
    try {
      win.hmMapWire(el, {});
      el.querySelector('button').click();
      const R = win.regState();
      assert.equal(R.stage, 'Signed', 'the stage the bar named');
      assert.equal(ids(win), 'MK-4,MK-5', 'every signed contract, and nothing a stale filter would hide');
      for (const f of win.REG_BAR_FILTERS.filter(x => x.k !== 'stage'))
        assert.equal(win.regFilterActive(f.k, R), false, f.k + ' did not survive the door');
      assert.equal(R.query, '', 'nor the search');
    } finally { el.remove(); }
  });
  /* RETIRED 28 Sep 2026 (Young: "discard the current 2 cards"): Home's See
     all left with the decisions card. Home's one work card opens Copilot's
     work, which is a page, not a filtered Contracts list. */
  test('4b Home has no See all onto Contracts any more — its work card opens Copilot\'s work', () => {
    assert.ok(!handlerOf(HOME, `document.querySelector('[data-hm-go="needsyou"]')`), 'the See all door is gone');
    assert.match(HOME, /setView\('agents'\)/, 'the card\'s door is Copilot\'s work');
  });
  test('4c the shell search typed on another page lands fresh; typed on Contracts it narrows inside', () => {
    const h = handlerOf(APP, "search.addEventListener('input'");
    assert.ok(h, 'the shell bar\'s box is wired');
    const reset = h.search(/state\.view!=='register'\s*&&\s*window\.regFiltersAtRest\)\s*regFiltersAtRest\(R\)/);
    const write = h.indexOf('R.query=q');
    assert.ok(reset > 0, 'arriving from another page, it puts the filters to rest');
    assert.ok(write > reset, 'and only then writes the search');
    assert.ok(h.indexOf('regSetScope') < reset, 'the seat is put back first, as before');
  });
  test('4d the phone\'s tiles land through the one door and write no filter by hand', () => {
    const h = handlerOf(PHONE, "root.querySelectorAll('[data-m-kpi]')");
    assert.ok(h, 'the tiles are wired');
    assert.match(h, /regGoFiltered\([^)]*\{\s*open:\s*false\s*\}\)/, 'the one door, told the phone opens its own screen');
    assert.ok(!/R\.(stage|view|only|type|category)\s*=/.test(h), 'no filter is written by hand');
  });
  test('4e My Queue\'s "+N more" lands fresh from its own page, and keeps its old press on the Board', () => {
    const h = handlerOf(QUEUE, "document.querySelectorAll('[data-pipe-more]')");
    assert.ok(h, '"+N more" is wired');
    assert.match(h, /state\.view!=='register'\s*&&\s*window\.regGoFiltered\)\{\s*regGoFiltered\(\{\s*stage:k\s*\}\)/,
      'from My Queue it is a door, through the one door');
    assert.match(h, /regState\(\)\.stage=k/, 'on the Contracts page\'s own Board it is a press inside the page');
  });
  test('4f every caller of regShowOnly lands fresh by construction — the door itself presses the one door', () => {
    assert.match(fnOf(REG, 'regShowOnly'), /regGoFiltered\(/);
    const door = fnOf(REG, 'regGoFiltered');
    assert.match(door, /regSetScope\(null\)[\s\S]*regFiltersAtRest\(regState\(\)\)/, 'the seat first, then the rest');
    assert.match(door, /regSearchBoxClear\(\)/, 'and the box with it');
  });
  test('4g outside the register, nobody writes a named set by hand any more', () => {
    /* A door that sets `only` itself is a door that has to remember everything
       else it should clear — the fault this file exists for. Letting a set go
       (`= null`, the phone's own Clear) is the one write left outside. */
    const files = fs.readdirSync(path.join(ROOT, 'js')).filter(f => f.endsWith('.js')).map(f => 'js/' + f)
      .concat(fs.readdirSync(path.join(ROOT, 'js/views')).filter(f => f.endsWith('.js')).map(f => 'js/views/' + f))
      .filter(f => f !== 'js/views/register.js');
    const writes = [];
    for (const f of files){
      const src = strip(read(f));
      const re = /\b(?:R|r|st|S)\.only\s*=(?!=)\s*([^;]+);/g;
      let m;
      while ((m = re.exec(src))) if (!/^null\b/.test(m[1].trim())) writes.push(f + ': ' + m[0].slice(0, 80));
    }
    assert.deepEqual(writes, [], 'a named set is written only by the register\'s own door');
  });
});

describe('f397 (5) — [wall] the named set still says where it came from', () => {
  test('5a its label and its ids travel with it', () => {
    const win = world();
    win.regShowOnly(['MK-3', 'MK-3', '', 'MK-6'], 'Needs your decision');
    const R = win.regState();
    assert.equal(JSON.stringify(R.only), JSON.stringify({ ids: ['MK-3', 'MK-6'], label: 'Needs your decision' }),
      'deduplicated, blanks dropped, the label kept for the chip');
  });
});
