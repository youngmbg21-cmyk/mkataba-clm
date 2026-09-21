/* N8 — the friction brief and the templates library page (the approved comps).

   The friction page is a BRIEF now: the left column answers "what is slowing
   you down" in three act-on-it sentences — costliest clause, refused changes
   nobody withdrew (named, not just counted), slowest counterparty — and the
   right column keeps the evidence with colour never carrying meaning alone.
   The Templates page is a LIBRARY: a rail of kinds and streams, one dense
   table, every old verb still reachable. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { loadViews, STUB_FOLDERS } = require('./dom');

const ago = d => new Date(Date.now() - d * 86400000).toISOString();

/* ---------- friction ---------- */
function frictionStage(contracts) {
  return loadViews(['js/views/intelligence.js'], {
    state: { contracts, settings: {}, view: 'intel' },
    negoAllChanges: c => c.changes || [],
    FOLDERS: STUB_FOLDERS, TEMPLATES: {},
    getContract: id => contracts.find(c => c.id === id),
  });
}
const CH = (clause, status, side, over = {}) => ({ clauseLabel: clause, status, authorSide: side,
  withdrawn: false, createdAt: ago(15), ...over });
const deal = (id, cp, round, changes, over = {}) => ({ id, name: id + ' — ' + cp, counterparty: cp,
  negotiation: { round, startedAt: ago(40), rounds: [] }, changes, ...over });

const PORTFOLIO = [
  deal('MK-1', 'Naivas', 4, [CH('Payment terms', 'rejected', 'owner'), CH('Payment terms', 'accepted', 'owner', { resolvedAt: ago(12) })]),
  deal('MK-2', 'Naivas', 4, [CH('Payment terms', 'accepted', 'counterparty'), CH('Liability', 'rejected', 'owner')],
    { execution: { at: ago(6) } }),
  deal('MK-3', 'Copia', 1, [CH('Governing law', 'accepted', 'owner')], { execution: { at: ago(32) } }),
  deal('MK-4', 'Copia', 1, [CH('Governing law', 'accepted', 'owner')], { execution: { at: ago(30) } }),
];

describe('N8 (1) — the stats behind the brief', () => {
  test('the slowest counterparty is named, with two deals before the label sticks', () => {
    const s = frictionStage(PORTFOLIO);
    const st = s.intelFrictionStats(null);
    assert.equal(st.slowest.name, 'Naivas');
    assert.equal(st.slowest.avgRounds, 4);
    assert.equal(st.deals, 4);
  });

  test('deadlocks are named, not just counted — "see the six" needs six to show', () => {
    const st = frictionStage(PORTFOLIO).intelFrictionStats(null);
    assert.equal(st.deadlocks, 2);
    assert.equal(st.deadlockList.length, 2);
    assert.ok(st.deadlockList.every(x => x.id && x.name && x.clause));
  });

  test('median days to signature comes from the signed deals', () => {
    const st = frictionStage(PORTFOLIO).intelFrictionStats(null);
    assert.ok(st.medianDays != null && st.medianDays >= 8 && st.medianDays <= 34,
      'a median inside the staged range, not an invention: got ' + st.medianDays);
  });
});

describe('N8 (2) — the brief itself', () => {
  test('the left column answers in sentences with a verb on each', () => {
    const html = frictionStage(PORTFOLIO).intelFrictionHtml();
    assert.match(html, /What is slowing you down/);
    assert.match(html, /of negotiations get stuck on <b>Payment terms<\/b>/);
    assert.match(html, /data-igf-standards/, 'the clause link goes to Our standards');
    assert.match(html, /data-igf-deadlocks/, '"see the N" unfolds the deadlocks');
    assert.match(html, /data-igf-open="MK-1"/, 'each deadlock opens its contract');
    assert.match(html, /Filter the page to Naivas/);
    assert.match(html, /median to signature/);
  });

  test('colour never carries meaning alone: every extra-rounds figure is printed', () => {
    const html = frictionStage(PORTFOLIO).intelFrictionHtml();
    assert.match(html, /\+\d\.\d/, 'a cost is printed as +N.N beside its bar');
    assert.match(html, /click a row to filter the page/);
    assert.match(html, /data-igf-cp="Naivas"/, 'the table row is the filter control');
  });

  test('an empty book says so in words, not an empty grid', () => {
    const html = frictionStage([]).intelFrictionHtml();
    assert.match(html, /No negotiations recorded yet/);
  });
});

/* ---------- templates library page ---------- */
function libraryStage(over = {}) {
  const T = {};
  for (const [id, kind] of Object.entries({ ND: 'NDA', PS: 'Professional Services', LE: 'Lease' }))
    T[id] = { id, kind, name: kind, blurb: kind + ' paper', folder: 'proc', valueType: 'estimated', ic: 'file' };
  return loadViews(['js/richdoc.js', 'js/views/library.js'], {
    TEMPLATES: T, FOLDERS: STUB_FOLDERS,
    folderColor: () => '#2e9f80',
    templateFormat: () => 'plain', isRich: () => false,
    builtinUsageCount: () => 0,
    templateAllowedForRole: () => true,
    canEdit: () => true, currentUser: () => ({ name: 'Amina', role: 'admin' }),
    openModal(){}, closeModal(){}, setView(){}, setActiveNav(){},
    state: { contracts: [], settings: { customTemplates: [
      { id: 'ct1', name: 'Naivas Supply Terms', folder: 'sales', at: ago(2), source: 'paste',
        text: 'x'.repeat(400), format: 'plain' } ] }, view: 'templates' },
    tplLibAll: () => ({ canManage: true, loaded: true, list: [
      { id: 'tpl_1', name: 'Wanjiru Standard MSA', status: 'published', publishedVersion: 4,
        category: 'services', contractsCreated: 38, lastUsedAt: ago(1) },
      { id: 'tpl_2', name: 'Warehousing Agreement', status: 'draft', publishedVersion: null,
        category: 'services', contractsCreated: 0 } ] }),
    TPLLIB_CATEGORIES: { services: 'Services' },
    API_MODE: () => false,
    ...over,
  });
}

describe('N8 (3) — the templates library page', () => {
  /* The rail used to carry a second door to Our standards. That page now has
     its own nav item under Administration, so the door here is GONE rather
     than duplicated — one home per thing, the rule WO N1 set. */
  test('the rail names the kinds with honest counts, and no longer doubles as a door to Our standards', () => {
    const s = libraryStage(); s.renderTemplatesPage();
    const html = s.document.getElementById('content').innerHTML;
    assert.match(html, /All templates/); assert.match(html, /Company standard/);
    assert.match(html, /Counterparty paper/); assert.match(html, /HaTi standard/);
    assert.match(html, /Value stream/i);
    assert.ok(!html.includes('id="tpl-standards"'), 'Our standards is reached from the sidebar, not from Templates');
  });

  /* The rows render into #tpl-rows (repainted on search without losing the
     shell); the stand-in document keeps that host as its own node, so the
     rows are asserted there — same convention as f103's section host. */
  test('company paper leads the table, and the pile a reader arrives on is what they can use', () => {
    const s = libraryStage(); s.renderTemplatesPage();
    const html = s.document.getElementById('tpl-rows').innerHTML;
    const first = html.indexOf('Wanjiru Standard MSA');
    assert.ok(first > -1 && first < html.indexOf('Naivas Supply Terms'), 'company before counterparty');
    assert.ok(html.indexOf('Naivas Supply Terms') < html.indexOf('Professional Services'), 'counterparty before built-ins');
    assert.match(html, />v4</, 'the published version is printed');
    assert.match(html, /data-tpllib-use="tpl_1"/, 'Draft a contract on the published one');
    assert.ok(!html.includes('data-tpllib-use="tpl_2"'), 'never on a draft');
    /* ---- RE-POINTED 18 Sep 2026 ---- The rail is piles now and the one a
       reader arrives on is Ready to use, so an unfinished draft is not on the
       first screen. It is not hidden: the rail names it, counts it in amber
       and it is one press away. The claim below is the other half of the same
       ruling and is asserted where it is now true. */
    assert.ok(!html.includes('Continue editing'), 'a draft is not in the Ready to use pile');
  });

  test('and on its own pile a draft says Draft and offers Continue editing', () => {
    const s = libraryStage(); s.renderTemplatesPage();
    /* The rail draws the pile as a real door, with its own count. The stub
       document does not answer attribute selectors, so the door is asserted in
       the markup and the ROW is asserted off the builder it presses — which is
       the reading the pile uses, not a second copy of it. */
    const shell = s.document.getElementById('content').innerHTML;
    assert.match(shell, /data-tpl-group="writing"/, 'the pile is a real door in the rail');
    assert.match(shell, /Being written/, 'and it says what it holds');
    const draft = s.tplPageRows().find(r => r.id === 'tpl_2');
    assert.ok(draft && draft.draft, 'tpl_2 is the draft in this stage');
    assert.equal(s.tplRowPile(draft), 'writing', 'and it lands in that pile');
    const html = s.tplPageRowHtml(draft);
    assert.match(html, />Draft</, 'the row says what it is');
    assert.match(html, /Continue editing/, 'and offers the one thing there is to do');
    assert.match(html, /data-tpllib-edit="tpl_2"/, 'straight into the builder, not the filing card');
  });

  test('every old verb is still reachable — the rare ones one ⋯ away', () => {
    const s = libraryStage(); s.renderTemplatesPage();
    const rows = s.document.getElementById('tpl-rows').innerHTML;
    const shell = s.document.getElementById('content').innerHTML;
    assert.match(rows, /data-tpl-use="ct1"/); assert.match(rows, /data-tpl-prev="ct1"/);
    /* ---- RE-POINTED 18 Sep 2026: the ⋯ is now ONE menu for every kind ----
       It used to exist for the other side's paper alone and carry its id bare;
       it is keyed `kind:id` now so one builder can serve all four kinds, and
       the claim — the rare verbs live one ⋯ away — is unchanged. */
    assert.match(rows, /data-tpl-dots="cp:ct1"/, 'edit/blanks/bulk/versions/delete live behind ⋯');
    assert.match(rows, /data-tpl-builtin="ND"/);
    /* Bulk moved INTO that menu rather than taking a column on every built-in
       row, so the row no longer draws its own door to it. */
    assert.ok(!rows.includes('data-tpl-bulk-b='), 'and bulk is in the menu, not on the row');
    assert.match(rows, /data-tpl-ours="ND"/, 'a built-in can finally be made ours');
    /* ---- AND THE TWO TOP BUTTONS ARE ONE ----
       "Convert a document" was a sibling of "+ Build new template" and is not
       a sibling act: it is one of five answers to "where do the words come
       from", which the one door asks. The BUTTON's own words are still the
       owner's and still drawn. */
    assert.match(shell, /Build new template/);
    /* REVERSED IN PLACE (21 Sep 2026, the redesign's second pass): the
       owner-approved reference draws Convert a document beside Build new
       template, and it is back as a PROXY — the head's button and the
       chooser's own "a document" row press ONE function, so the two doors
       are one act and cannot drift. */
    assert.ok(shell.includes('id="tpl-convert"'), 'Convert a document is drawn beside the one door');
    const LIB = require('node:fs').readFileSync(require('node:path').join(__dirname, '..', 'js', 'views', 'library.js'), 'utf8');
    assert.match(LIB, /getElementById\('tpl-convert'\)\?\.addEventListener\('click',tplConvertDoor\)/, 'the head presses the one act');
    assert.match(LIB, /if\(k==='doc'\) return tplConvertDoor\(\);/, 'and so does the chooser\'s own row');
  });
});

/* ---------- the report's own house style ----------
   Owner-asked 26 Aug 2026: "although the contracts may have capital letters for
   the headers, in the analytics report make sure it conforms to uniformity and
   have proper grammar. Not all caps."

   THE STAGE LOADS clausemodel.js ON PURPOSE. _igClauseName falls back to the raw
   heading where that module is absent, which is right in the product (a chart
   label must never throw) and fatal in a test: without it every claim below
   passes against a page doing nothing at all. */
function casedStage(contracts) {
  return loadViews(['js/clausemodel.js', 'js/views/intelligence.js'], {
    state: { contracts, settings: {}, view: 'intel' },
    negoAllChanges: c => c.changes || [],
    FOLDERS: STUB_FOLDERS, TEMPLATES: {},
    getContract: id => contracts.find(c => c.id === id),
  });
}

describe('N8 (4) — the report prints clause names in ONE style', () => {
  /* Two firms' drafting, as it really arrives: one shouts, one does not. */
  const SHOUTY = [
    deal('MK-A', 'Juno', 3, [CH('SPECIFICATIONS, QUALITY & INSPECTION', 'rejected', 'owner')]),
    deal('MK-B', 'Juno', 2, [CH('SPECIFICATIONS, QUALITY & INSPECTION', 'accepted', 'owner')]),
    deal('MK-C', 'Copia', 2, [CH('Delivery Information', 'accepted', 'owner')]),
  ];

  test('a shouted heading is printed back in Title Case, never as typed', () => {
    const st = casedStage(SHOUTY).intelFrictionStats(null);
    const names = st.clauses.map(c => c.label);
    assert.ok(names.includes('Specifications, Quality & Inspection'),
      `expected Title Case, got ${JSON.stringify(names)}`);
    assert.ok(!names.some(n => /^[^a-z]*$/.test(n) && /[A-Z]{4,}/.test(n)),
      `a name is still shouting: ${JSON.stringify(names)}`);
  });

  test('one clause is ONE row however the two contracts capitalised it', () => {
    /* Owner-ruled the same day: merge them. Before this the chart showed the
       same clause twice, each with half its real count, and the two rows sat
       next to each other looking like two different arguments. */
    const mixed = [
      deal('MK-A', 'Juno', 3, [CH('PAYMENT TERMS', 'rejected', 'owner')]),
      deal('MK-B', 'Juno', 2, [CH('Payment terms', 'accepted', 'owner')]),
      deal('MK-C', 'Copia', 2, [CH('payment terms', 'accepted', 'owner')]),
    ];
    const st = casedStage(mixed).intelFrictionStats(null);
    const pay = st.clauses.filter(c => /payment/i.test(c.label));
    assert.equal(pay.length, 1, `expected one row, got ${JSON.stringify(pay.map(p => p.label))}`);
    assert.equal(pay[0].n, 3, 'all three deals count toward the one row');
    assert.equal(pay[0].label, 'Payment Terms');
  });

  test('the SENTENCE above the chart reads the same name as the chart does', () => {
    /* One reading, many surfaces: the costliest-clause sentence, the bar list
       and the health report all take their name from here, so a fix in one is
       a fix in all — and a second copy is how they would come to disagree. */
    const st = casedStage(SHOUTY).intelFrictionStats(null);
    if (st.insight) assert.ok(!/[A-Z]{4,}/.test(st.insight.label),
      `the sentence still shouts: ${st.insight.label}`);
    const dl = (st.deadlockList || []).map(d => d.clause);
    assert.ok(!dl.some(n => /[A-Z]{4,}/.test(n)),
      `a refused-change row still shouts: ${JSON.stringify(dl)}`);
  });

  test('the contract itself is never rewritten — only what is printed', () => {
    const contracts = JSON.parse(JSON.stringify(SHOUTY));
    casedStage(contracts).intelFrictionStats(null);
    assert.equal(contracts[0].changes[0].clauseLabel,
      'SPECIFICATIONS, QUALITY & INSPECTION',
      'the stored heading moved — this reading may only change what is DRAWN');
  });
});
