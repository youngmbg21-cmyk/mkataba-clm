/* f283 — COPILOT KNOWS WHAT PAGE THIS IS (owner-asked 10 Sep 2026)
   ===============================================================
   *"the copilot is not aware of what is on the page"*

   MEASURED before it was touched, with the reader standing on Contracts:

     view             "register"          — a developer's word for the page
     activeContractId "MK-9"              — and NO contract was open
     page             undefined           — nothing about what was on it

   That middle line is the sharp end. `state.activeId` is a global that
   survives whatever was last opened ANYWHERE and is never cleared on the way
   out, and the prompt turns it into *"The contract open on screen is MK-9 —
   an unqualified 'this contract' means that one."* False on fifteen of the
   seventeen pages in this product.

   AND ONE MAP WAS INCOMPLETE. AI_INSIGHTS_TABS named three of Insights' five
   tabs, and the caller filled the gap with 'portfolio' — so a reader on
   Payment terms or Obligations was described as looking at a chart on another
   tab. A wrong answer wearing a right one's clothes.

   Nothing here is a store, a route or a spend: it is a reading of what is
   already on the screen. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');
/* A top-level `const` lives in the script's lexical scope, not on the sandbox
   object, so a table is reached by running an expression in the SAME context
   rather than by reading a property that is not there. And an array or object
   that crosses back has the vm realm's own prototype — `own()` copies it into
   this realm so a comparison is about the VALUES (f40's lesson). */
const peek = (w, expr) => vm.runInContext(expr, w);
const own = xs => Array.from(xs);
const SRC = f => fs.readFileSync(path.join(ROOT, 'js', f), 'utf8');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

/* The stage f268 and f97 use, plus the four readings this feature borrows —
   each of which a real page owns and this one must never count for itself. */
function loadAi(opts = {}){
  const el = () => ({ addEventListener(){}, querySelectorAll(){ return []; },
    querySelector(){ return null; }, innerHTML: '', value: '', style: {},
    classList: { add(){}, remove(){}, toggle(){}, contains(){ return false; } },
    focus(){}, setSelectionRange(){}, getBoundingClientRect(){ return { width: 430 }; } });
  const contracts = opts.contracts || [{ id: 'MK-9', name: 'Warehousing',
    counterparty: 'Acme', status: 'Signed' }];
  const sandbox = {
    console, Date, Math, JSON, Number, String, Object, Array, Boolean, RegExp,
    Set, Map, Error, isNaN, parseInt, parseFloat, setTimeout, Promise,
    document: { getElementById: () => el(), querySelector: () => null,
      querySelectorAll: () => [], addEventListener(){}, createElement: () => el(),
      body: { classList: { toggle(){} } } },
    state: { contracts, view: opts.view || 'register',
      activeId: opts.activeId === undefined ? 'MK-9' : opts.activeId,
      folderId: opts.folderId || null },
    icon: () => '', esc: s => String(s == null ? '' : s), toast(){},
    lsGet(){ return null; }, lsSet(){},
    getContract(id){ return contracts.find(c => c.id === id) || null; },
    currentUser(){ return { name: 'Amina', role: 'admin' }; }, API_MODE(){ return false; },
    innerWidth: 1400, addEventListener(){}, isMonetary: () => true,
    fmtMoneyShort: n => String(n), cIcon: () => 'file', statusChip: () => '',
    contractStatusChip: () => '', metrics: () => ({ totalValue: 0 }),
    aiPortfolioSnapshot: () => 'snapshot', aiInsightsPanels: () => ({}),
  };
  /* The four borrowed readings, each recording what it was asked so the sweep
     can prove they were the source. Absent (opts.bare) they must all fall
     silent rather than be replaced by a count taken here. */
  if (!opts.bare){
    sandbox.commandMeta = () => [opts.label || 'Kontrakt', ''];
    sandbox.regScope = () => opts.scope || null;
    sandbox.regState = () => (opts.reg || { query: '', stage: 'all', type: 'all' });
    sandbox.regNarrowed = () => !!opts.narrowed;
    sandbox.regFiltered = () => (opts.matching || []);
    sandbox.roomCurrentTab = () => opts.tab || '';
    sandbox.redlineHeldId = () => opts.held || null;
    /* The real obwFilters always carries all five keys (it spreads OBW_DEF),
       so a fixture that carries two would report the missing three as cuts. */
    sandbox.obwFilters = () => ({ whose: 'all', state: 'open', side: 'all',
      folder: 'all', due: 'all', ...(opts.obw || {}) });
    /* THE WORKLIST'S OWN reading of what is narrowing, not a comparison against
       'all' — that list opens on state='open', which is a cut. */
    sandbox.OBW_DEF = { whose: 'all', state: 'open', side: 'all', folder: 'all', due: 'all' };
    sandbox.obwNarrowing = f => Object.keys(sandbox.OBW_DEF)
      .filter(k => String(f[k]) !== String(sandbox.OBW_DEF[k]));
    sandbox.obwRows = () => (opts.obwRows || []);
    sandbox.FOLDERS = { f1: { name: 'Supply chain' } };
    if (opts.intelTab) sandbox.intel = { tab: opts.intelTab };
  }
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  for (const f of ['i18n.js', 'jurisdiction.js', 'ai.js'])
    vm.runInContext(SRC(f), sandbox, { filename: f });
  return sandbox;
}

/* ---------- (1) THE CONTRACT ON SCREEN IS THE ONE ON SCREEN ---------- */

describe('f283 (1) a contract is claimed open only where one really is', () => {
  test('THE REPORTED FAULT: on Contracts, no contract is open', () => {
    const w = loadAi({ view: 'register', activeId: 'MK-9' });
    assert.equal(w.aiScreenContractId(), null);
    assert.equal(w.aiChatContext().activeContractId, undefined,
      'the prompt must not tell Copilot a contract is open when none is');
  });

  test('and on every other page that shows no contract', () => {
    for (const v of ['intel', 'obligations', 'templates', 'reports', 'calendar',
      'dashboard', 'directory', 'team', 'pipeline', 'intake', 'migration'])
      assert.equal(loadAi({ view: v, activeId: 'MK-9' }).aiScreenContractId(), null, v);
  });

  test("the contract's own room names it", () => {
    const w = loadAi({ view: 'workspace', activeId: 'MK-9' });
    assert.equal(w.aiScreenContractId(), 'MK-9');
    assert.equal(w.aiChatContext().activeContractId, 'MK-9');
  });

  /* THE RECORDED DEFECT, closed here: the negotiation page reads a global that
     still names whatever was last opened from anywhere. What is on that screen
     is what was PAINTED — redlineHeldId — and with the list up there is no
     contract on it at all. */
  test('the negotiation page reads the PAINTED contract, never the global', () => {
    assert.equal(loadAi({ view: 'redline', activeId: 'MK-9', held: 'MK-4' })
      .aiScreenContractId(), 'MK-4');
    assert.equal(loadAi({ view: 'redline', activeId: 'MK-9', held: null })
      .aiScreenContractId(), null, 'the list is up — no contract is on screen');
  });
});

/* ---------- (2) WHICH PAGE, IN BOTH VOCABULARIES ---------- */

describe('f283 (2) the page names itself', () => {
  test('a stable English name travels, and the reader\'s own label beside it', () => {
    const p = loadAi({ view: 'register', label: 'Kontrakt' }).aiPageContext();
    assert.equal(p.view, 'register');
    assert.equal(p.name, 'Contracts', 'stable English — a model matches on this');
    assert.equal(p.label, 'Kontrakt', 'and the reader sees this');
  });

  test('every view the shell can be on is named', () => {
    /* A page with no name would be described to Copilot by its developer key. */
    const app = read('js/app.js');
    const views = [...app.matchAll(/case '([a-z]+)':/g)].map(m => m[1]);
    const names = peek(loadAi(), 'AI_PAGE_NAMES');
    for (const v of new Set(views))
      assert.ok(names[v], `js/app.js can set state.view="${v}" and AI_PAGE_NAMES does not name it`);
  });

  test('the name is English, never a dictionary key', () => {
    for (const n of own(peek(loadAi(), 'Object.values(AI_PAGE_NAMES)')))
      assert.ok(!/^[a-z]+_[a-z_]+$/.test(n), `${n} looks like a key, not a name`);
  });

  test('no view, nothing said — never a guess', () => {
    const w = loadAi(); w.state.view = '';
    assert.equal(w.aiPageContext(), null);
  });
});

/* ---------- (3) WHAT IS ON IT, BORROWED AND NEVER COUNTED HERE ---------- */

describe('f283 (3) what the page is showing', () => {
  test('the register\'s own readings are what travel', () => {
    const p = loadAi({ view: 'register', narrowed: true,
      reg: { query: 'lease', stage: 'Signed', type: 'all' },
      matching: [1, 2, 3], contracts: Array.from({ length: 40 }, (_, i) =>
        ({ id: 'MK-' + i, name: 'x' })) }).aiPageContext();
    assert.equal(p.narrowed, true);
    assert.equal(p.searchBox, 'lease');
    assert.deepEqual(own(p.filters), ['stage=Signed']);
    assert.equal(p.matching, 3);
    assert.equal(p.ofBook, 40);
  });

  test('the Negotiations seat is named as itself, not as Contracts', () => {
    const p = loadAi({ view: 'register', scope: 'negotiations' }).aiPageContext();
    assert.equal(p.name, 'Negotiations');
  });

  test('a value stream drawer names the stream', () => {
    const p = loadAi({ view: 'folder', folderId: 'f1' }).aiPageContext();
    assert.equal(p.valueStream, 'Supply chain');
  });

  test('the obligations worklist borrows its own filters and rows', () => {
    const p = loadAi({ view: 'obligations', obw: { whose: 'mine', state: 'open' },
      obwRows: [1, 2] }).aiPageContext();
    assert.equal(p.matching, 2);
    assert.deepEqual(own(p.filters), ['whose=mine']);
    assert.equal(p.narrowed, true);
  });

  test("a contract's room names the tab it is on", () => {
    const p = loadAi({ view: 'workspace', tab: 'terms' }).aiPageContext();
    assert.equal(p.tab, 'terms');
  });

  test('the negotiations LIST says it is a list', () => {
    const p = loadAi({ view: 'redline', held: null }).aiPageContext();
    assert.match(String(p.showing), /list of live negotiations/);
  });

  /* THE HONEST SILENCE. A stage without a page's own reading says NOTHING
     about that page's contents — Copilot has tools to fetch data, and an
     invented summary of a screen is the one thing it may not rest on. */
  test('no reading, no claim', () => {
    const p = loadAi({ view: 'register', bare: true }).aiPageContext();
    assert.equal(p.name, 'Contracts');
    assert.equal(p.matching, undefined);
    assert.equal(p.filters, undefined);
    assert.equal(p.label, undefined);
  });

  test('it counts nothing of its own', () => {
    const src = SRC('ai.js');
    const i = src.indexOf('function aiPageContext(');
    const body = src.slice(i, src.indexOf('\n}\n', i));
    for (const borrowed of ['regFiltered()', 'regNarrowed(', 'regState()', 'obwRows(', 'obwFilters()'])
      assert.ok(body.includes(borrowed), `aiPageContext must borrow ${borrowed}`);
    assert.ok(body.includes('obwNarrowing(f)'),
      "the worklist's own narrowing reading, never a comparison against 'all'");
    /* The one thing it may never do is walk the book itself: a second count of
       the rows can disagree with the screen, which is the whole reason each
       page's own reading is borrowed. Selecting WHICH filter names are in
       force is not counting rows and is done here. */
    for (const bad of ['state.contracts.filter', 'contracts.filter(', 'allObligations('])
      assert.ok(!body.includes(bad),
        `aiPageContext must not count for itself (${bad}) — a second count can disagree with the screen`);
  });

  test('it writes nothing', () => {
    const src = SRC('ai.js');
    const i = src.indexOf('function aiPageContext(');
    const body = src.slice(i, src.indexOf('\n}\n', i));
    for (const bad of ['persist(', 'logAudit', 'lsSet(', 'innerHTML', 'render'])
      assert.ok(!body.includes(bad), `aiPageContext must not ${bad}`);
    const w = loadAi({ view: 'register' });
    const before = JSON.stringify(w.state);
    w.aiPageContext(); w.aiPageContext();
    assert.equal(JSON.stringify(w.state), before, 'asked twice, it changes nothing');
  });
});

/* ---------- (4) INSIGHTS' TABS ---------- */

describe('f283 (4) every Insights tab is named, and an unknown one is not guessed', () => {
  test('the map is COMPLETE against the page\'s own tab list', () => {
    const ig = read('js/views/intelligence.js');
    const m = ig.match(/const IG_TABS = \[([^\]]*)\]/);
    assert.ok(m, 'IG_TABS is the page\'s one tab list');
    const tabs = [...m[1].matchAll(/'([a-z]+)'/g)].map(x => x[1]);
    assert.ok(tabs.length >= 5, `expected the five tabs, got ${tabs.join(', ')}`);
    const map = peek(loadAi(), 'AI_INSIGHTS_TABS');
    for (const t of tabs) assert.ok(map[t],
      `Insights draws a "${t}" tab and AI_INSIGHTS_TABS does not name it`);
  });

  test('THE REPORTED SHAPE: Payment terms is not described as Portfolio', () => {
    const w = loadAi({ view: 'intel', intelTab: 'payterms' });
    assert.equal(w.aiInsightsTab(), 'payment-terms');
    assert.equal(w.aiChatContext().insightsTab, 'payment-terms');
  });

  test('a tab this map does not know is said NOTHING about', () => {
    const w = loadAi({ view: 'intel', intelTab: 'somethingnew' });
    assert.equal(w.aiChatContext().insightsTab, undefined,
      "an unknown tab must not be filled in as 'portfolio'");
  });
});

/* ---------- (5) THE TWIN ---------- */

describe('f283 (5) both hosts say the same facts about the page', () => {
  const page = { view: 'register', name: 'Contracts', label: 'Kontrakt',
    tab: 'terms', valueStream: 'Supply chain', showing: 'the list',
    searchBox: 'lease', filters: ['stage=Signed'], matching: 3, ofBook: 40 };

  function serverSays(p){
    const src = read('server/server.js');
    const i = src.indexOf('function pageSays(');
    assert.ok(i > 0, 'the server writes its own sentence from the fields');
    const body = src.slice(i, src.indexOf('\n}\n', i) + 2);
    return vm.runInNewContext(body + '\npageSays(P);', { P: p });
  }

  test('field for field, the two sentences carry the same facts', () => {
    const mine = loadAi().aiPageSays(page);
    const theirs = serverSays(page);
    assert.ok(mine.trim(), 'the browser says something');
    for (const fact of ['Contracts', 'Kontrakt', 'terms', 'Supply chain',
      'the list', 'lease', 'stage=Signed', '3 of 40']){
      assert.ok(mine.includes(fact), `the browser must say ${fact}`);
      assert.ok(theirs.includes(fact), `and so must the server (${fact})`);
    }
    assert.equal(mine, theirs, 'and they say it the same way');
  });

  test('an absent count is silence on both, never a guess', () => {
    const bare = { view: 'templates', name: 'Templates' };
    for (const say of [loadAi().aiPageSays(bare), serverSays(bare)]){
      assert.match(say, /Templates page/);
      assert.ok(!/row/.test(say), 'no count was given, so none is claimed');
    }
  });

  test('nothing at all is said about a page nobody described', () => {
    assert.equal(loadAi().aiPageSays(null), '');
    assert.equal(serverSays(null), '');
    assert.equal(serverSays({}), '');
  });

  /* THE SERVER TAKES FIELDS, NEVER A SENTENCE. A request that could hand this
     route a finished line of the system prompt is a request that could put
     anything in it, so every field is clamped where it lands. */
  test('the server clamps every field it is handed', () => {
    const long = 'x'.repeat(500);
    const said = serverSays({ view: 'register', name: long, label: long,
      tab: long, searchBox: long, filters: [long, long] });
    assert.ok(said.length < 700, `a crafted page object must not fill the prompt (${said.length})`);
    assert.ok(!said.includes(long), 'nothing arrives unclamped');
  });

  test('the browser uses it, and the server uses it', () => {
    assert.match(SRC('ai.js'), /const says=aiPageSays\(ctx\.page\);/);
    assert.match(read('server/server.js'), /const says = pageSays\(ctx\.page\);/);
  });
});
