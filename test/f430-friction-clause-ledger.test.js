/* f430 — THE FRICTION TAB IS A CLAUSE LEDGER (owner-picked 28 Sep 2026)

   Off the Insights design-options page the owner picked "Clause Ledger" by name
   and said "build", with one condition: "leave the copilot feature". What is
   pinned here:

     1  Copilot's read is still FIRST, drawn by the same function, unchanged.
     2  A strip of SIX figures; a figure with a list behind it is a door onto
        that list, and a zero is never a door.
     3  ONE ranked list that reads three ways — Clauses · Counterparties ·
        Waiting on a decision — with a details panel beside it, and each panel
        carrying the one door to where you act.
     4  The NEW readings are plain counts off the tracked changes, worked out in
        a data function (intelFrictionLedgerData) and not in the renderer, and
        right on a fixture whose every figure is worked out by hand below.
     5  READING MUST NOT WRITE: a contract with no negotiation is never given
        one, and the ledger adds no second walk of the book.
     6  Every new word is a key in BOTH books; the brief's hard-coded English
        sentences are gone.

   MEASURED AT THE PARENT (ac2c7d5b, the brief): 20 of 23 RED. The three that
   pass are named — one [control] (Copilot's four functions still stand) and
   two [wall]s that must pass on both sides by design: the old stats fields
   keep their meaning (Copilot's snapshot and the health report read them),
   and reading the book creates no negotiation. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadViews, STUB_FOLDERS } = require('./dom');

const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const INTEL = read('js/views/intelligence.js');
const I18N = read('js/i18n.js');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^\s*\/\/.*$/gm, ' ');
/* PIN THE REGION: a function's body runs to the next top-level function. */
const fnBody = (src, name) => {
  const at = src.search(new RegExp('\\n(?:async )?function ' + name + '\\('));
  if (at < 0) return '';
  const rest = src.slice(at + 1);
  const end = rest.slice(9).search(/\n(?:async )?function \w+\(/);
  return end < 0 ? rest : rest.slice(0, end + 9);
};

/* A REALM MISMATCH makes deepStrictEqual fail on two identical values: an
   object born inside the stage's vm has that realm's prototypes. Compare JSON. */
const eqJ = (a, b, m) => assert.equal(JSON.stringify(a), JSON.stringify(b), m);
const ago = d => new Date(Date.now() - d * 86400000).toISOString();
const CH = (clause, status, side, over = {}) => ({ clauseLabel: clause, status, authorSide: side,
  withdrawn: false, createdAt: ago(20), resolvedAt: ago(18), ...over });
const deal = (id, cp, round, changes, over = {}) => ({ id, name: id + ' agreement', counterparty: cp,
  status: 'Under Review', negotiation: { round, startedAt: ago(40), rounds: [] }, changes, ...over });

/* THE FIXTURE, AND EVERY FIGURE WORKED OUT BY HAND.
   Five negotiations (A–E) and one contract with none (F).
     A MK-1 Naivas r4 · Payment terms: ours REFUSED (open), ours accepted;
                       Liability: theirs refused but WITHDRAWN.
     B MK-2 Naivas r3 signed, two rounds on file · Payment terms: theirs accepted;
                       Liability: ours REFUSED (open).
     C MK-3 Copia r1 signed · Governing law: ours accepted.
     D MK-4 Copia r1 signed · Governing law: theirs REFUSED (open).
     E MK-5 Juno  r2 · a refusal on a change that names no clause (open).
   Clauses contested: Payment terms {A,B}, Liability {A,B}, Governing law {C,D}.
   Extra rounds: PT and Liability (4+3)/2 − (1+1+2)/3 = +2.17; Governing law
   (1+1)/2 − (4+3+2)/3 = −2. So the ledger ranks PT, Liability, Governing law.
   Refused, still open: 4 changes in 4 negotiations (A, B, D, E); one of them on
   no named clause — outside the listed clauses. */
function book() {
  return [
    deal('MK-1', 'Naivas', 4, [CH('Payment Terms', 'rejected', 'owner'), CH('Payment Terms', 'accepted', 'owner'),
      CH('Liability', 'rejected', 'counterparty', { withdrawn: true })]),
    deal('MK-2', 'Naivas', 3, [CH('Payment Terms', 'accepted', 'counterparty'), CH('Liability', 'rejected', 'owner')],
      { status: 'Signed', execution: { at: ago(10) } }),
    deal('MK-3', 'Copia', 1, [CH('Governing Law', 'accepted', 'owner')], { status: 'Signed', execution: { at: ago(30) } }),
    deal('MK-4', 'Copia', 1, [CH('Governing Law', 'rejected', 'counterparty')], { status: 'Signed', execution: { at: ago(25) } }),
    deal('MK-5', 'Juno', 2, [CH('', 'rejected', 'counterparty')]),
    { id: 'MK-6', name: 'Quiet lease', counterparty: 'Copia', status: 'Draft' },
  ].map(c => { if (c.id === 'MK-2') c.negotiation.rounds = [{ n: 1, changes: [] }, { n: 2, changes: [] }]; return c; });
}
let walks = [];
function stage(contracts) {
  walks = [];
  return loadViews(['js/clausemodel.js', 'js/views/intelligence.js'], {
    state: { contracts, settings: {}, view: 'intel' },
    /* READING MUST NOT WRITE: the stand-in reads raw and records who asked. */
    negoAllChanges: c => { walks.push(c.id); return [...(c.negotiation.rounds || []).flatMap(r => r.changes || []), ...(c.changes || [])]; },
    FOLDERS: STUB_FOLDERS, TEMPLATES: {},
    getContract: id => contracts.find(c => c.id === id),
  });
}
const ledgerOf = s => { const st = s.intelFrictionStats(null); return { st, led: st.ledger }; };
const setLens = (s, lens, sel) => { s.intel.frictionLedger = { lens, sel: Object.assign({ clauses: null, cps: null, wait: null }, sel || {}) }; };

describe('f430 (1) — Copilot\'s read is still first, and untouched', () => {
  test('the page opens on Copilot\'s strip, then the figures, then the ledger', () => {
    const html = stage(book()).intelFrictionHtml();
    /* RE-POINTED 29 Sep 2026 ("Fit to Screen"): the strip is the shared
       grammar's .igx-figs now; the order is what this pins (f435 the rest). */
    const cop = html.indexOf('id="igf-copilot"'), fig = html.indexOf('class="igx-figs"'), list = html.indexOf('data-igf-list=');
    assert.ok(cop >= 0 && fig > cop && list > fig, `order copilot ${cop} · strip ${fig} · list ${list}`);
  });
  test('[control] it is drawn by the same function, and its key, repaint and ask are the same three', () => {
    const body = fnBody(INTEL, 'intelFrictionHtml');
    assert.match(body, /intelFrictionCopilotHtml\(st\)/, 'the read is the old builder, handed the same stats');
    for (const n of ['intelFrictionKey', 'intelFrictionCopilotHtml', 'intelFrictionWireAI', 'intelFrictionRepaintAI'])
      assert.ok(new RegExp('function ' + n + '\\(').test(INTEL), n + ' still stands');
  });
});

describe('f430 (2) — a strip of six figures, doors only where a list stands behind', () => {
  test('six figures in the owner\'s order', () => {
    const html = stage(book()).intelFrictionHtml();
    const keys = [...html.matchAll(/data-igf-fig="(\w+)"/g)].map(m => m[1]);
    eqJ(keys, ['deals', 'rounds', 'tosign', 'decide', 'round1', 'open']);
  });
  test('the figures are the counted ones', () => {
    const html = stage(book()).intelFrictionHtml();
    const fig = k => { const m = new RegExp('data-igf-fig="' + k + '"[^>]*>[\\s\\S]*?<span class="igx-fig-n[^"]*">([^<]*)</span>').exec(html); return m && m[1]; };
    assert.equal(fig('deals'), '5', 'five negotiations — the contract with none is not one');
    assert.equal(fig('rounds'), '2.2', '(4+3+1+1+2)/5');
    assert.equal(fig('round1'), '67%', 'two of the three signed closed in round 1');
    assert.equal(fig('open'), '4', 'refused and never withdrawn');
  });
  test('a figure with a list is a door onto exactly that list; the average and the decision time are not', () => {
    const html = stage(book()).intelFrictionHtml();
    const go = k => (new RegExp('data-igf-fig="' + k + '"[^>]*data-igf-go="(\\w+)"').exec(html) || [])[1] || null;
    assert.equal(go('deals'), 'deals');
    assert.equal(go('tosign'), 'signed');
    assert.equal(go('round1'), 'round1');
    assert.equal(go('open'), 'wait', 'the amber figure opens the waiting list');
    assert.equal(go('rounds'), null);
    assert.equal(go('decide'), null);
    const { led } = ledgerOf(stage(book()));
    eqJ([...led.dealIds].sort(), ['MK-1', 'MK-2', 'MK-3', 'MK-4', 'MK-5'], 'the Negotiations door opens the five');
    eqJ([...led.round1Ids].sort(), ['MK-3', 'MK-4'], 'and the round-1 door the two');
  });
  test('a zero is not a door', () => {
    const quiet = [deal('MK-9', 'Naivas', 2, [CH('Payment Terms', 'accepted', 'owner')])];
    const html = stage(quiet).intelFrictionHtml();
    for (const k of ['tosign', 'round1', 'open'])
      assert.ok(!new RegExp('data-igf-fig="' + k + '"[^>]*data-igf-go').test(html), k + ' has nothing behind it and is no door');
    assert.match(html, /<div class="igx-fig" data-igf-fig="open"/, 'nothing refused: a figure, not a button');
  });
});

describe('f430 (3) — one list, three readings, a details panel beside it', () => {
  test('the switch reads Clauses · Counterparties · Waiting on a decision, each with its count', () => {
    const html = stage(book()).intelFrictionHtml();
    const lenses = [...html.matchAll(/data-igf-lens="(\w+)"[^>]*>([^<]+)<span class="igf-led-cnt">(\d+)</g)].map(m => [m[1], m[2], m[3]]);
    eqJ(lenses, [['clauses', 'Clauses', '3'], ['cps', 'Counterparties', '2'], ['wait', 'Waiting on a decision', '4']]);
  });
  test('the clause list is ranked by the extra rounds each clause costs', () => {
    const s = stage(book());
    const html = s.intelFrictionHtml();
    const rows = [...html.matchAll(/<tr data-igf-row="([^"]+)"/g)].map(m => m[1]);
    eqJ(rows, ['Payment Terms', 'Liability', 'Governing Law']);
    assert.match(html, /<b class="igf-led-cost">\+2\.2<\/b>/, 'a cost is a printed figure');
    assert.match(html, /<b class="igf-led-gain">−2\.0<\/b>/, 'and a clause that settles fast says so');
  });
  test('each lens draws its own list', () => {
    const s = stage(book());
    setLens(s, 'cps');
    let html = s.intelFrictionHtml();
    assert.match(html, /data-igf-list="cps"/);
    eqJ([...html.matchAll(/<tr data-igf-row="([^"]+)"/g)].map(m => m[1]), ['Naivas', 'Copia'],
      'the counterparties with two or more negotiations, slowest first');
    assert.match(html, /1 more counterparty has one negotiation\./, 'the one left out is counted and said');
    setLens(s, 'wait');
    html = s.intelFrictionHtml();
    assert.match(html, /data-igf-list="wait"/);
    eqJ([...html.matchAll(/<tr data-igf-row="([^"]+)"/g)].map(m => m[1]), ['MK-1', 'MK-2', 'MK-5', 'MK-4'],
      'every negotiation carrying a refusal nobody withdrew');
  });
  test('the clause panel says how it is doing, who contested it, how the asks ended and what is open — with its door', () => {
    const s = stage(book());
    const html = s.intelFrictionDetailHtml(s.intelFrictionStats(null), 'clauses',
      s.intelFrictionLedgerPick(s.intelFrictionStats(null).ledger, 'clauses'));
    assert.match(html, /<h3 class="igf-led-dname">Payment Terms<\/h3>/);
    assert.match(html, /Clause · 1 of 3 by extra rounds/);
    assert.match(html, /2 of 5 negotiations/, 'contested in');
    assert.match(html, /3\.5 when contested, 1\.3 when not/, 'the two averages the extra rounds is the difference of');
    assert.match(html, /Our asks[\s\S]*?<b>50%<\/b> accepted/, 'our asks on it: one of two accepted');
    assert.match(html, /Their asks[\s\S]*?<b>100%<\/b> accepted/, 'theirs: one of one');
    assert.match(html, /Whole book \(50% ours, 25% theirs\)/, 'the ruler is the whole book\'s own figure');
    assert.match(html, /data-igf-cp="Naivas"[\s\S]*?2 of 2/, 'who contested it holds the page to them');
    assert.match(html, /data-igf-open="MK-1"[\s\S]*?1 open/, 'what is refused and open on it opens that negotiation');
    assert.match(html, /data-igf-standards/, 'the one door to act: Our standards');
  });
  test('pressing a row fills the panel with that row', () => {
    const s = stage(book());
    setLens(s, 'clauses', { clauses: 'Governing Law' });
    const html = s.intelFrictionHtml();
    assert.match(html, /<tr data-igf-row="Governing Law"[^>]*class="is-sel"/);
    assert.match(html, /<h3 class="igf-led-dname">Governing Law<\/h3>/);
    assert.match(html, /Clause · 3 of 3 by extra rounds/);
  });
  test('the counterparty panel carries "Hold the page to …", and the waiting panel opens the negotiation', () => {
    const s = stage(book());
    setLens(s, 'cps', { cps: 'Copia' });
    let html = s.intelFrictionHtml();
    assert.match(html, /<h3 class="igf-led-dname">Copia<\/h3>/);
    assert.match(html, /class="ui-link igf-led-door" data-igf-cp="Copia"/, 'the door holds the page to them');
    assert.match(html, /2 signed · 0 open/);
    setLens(s, 'wait', { wait: 'MK-2' });
    html = s.intelFrictionHtml();
    assert.match(html, /class="ui-link igf-led-door" data-igf-open="MK-2"/);
    assert.match(html, /Waiting on a decision · round 3/);
  });
  test('a counterparty already held draws no door onto itself', () => {
    const s = stage(book());
    s.intel.frictionFilter = { counterparty: 'Copia' };
    setLens(s, 'cps', { cps: 'Copia' });
    const html = s.intelFrictionHtml();
    /* GATED: an absence proves nothing on a page that draws no panel at all. */
    assert.match(html, /<h3 class="igf-led-dname">Copia<\/h3>/, 'the panel is drawn for them');
    assert.ok(!/class="ui-link igf-led-door" data-igf-cp=/.test(html), 'the page is already held to them');
  });
});

describe('f430 (4) — the new readings are plain counts, in the data function', () => {
  test('how the asks ended, by clause and by side', () => {
    const { led } = ledgerOf(stage(book()));
    const by = Object.fromEntries(led.clauses.map(c => [c.label, c]));
    eqJ(by['Payment Terms'].ours, { acc: 1, rej: 1 });
    eqJ(by['Payment Terms'].theirs, { acc: 1, rej: 0 });
    eqJ(by['Liability'].ours, { acc: 0, rej: 1 });
    eqJ(by['Liability'].theirs, { acc: 0, rej: 1 }, 'a withdrawn refusal is still a refusal — the book-wide figure\'s own rule');
    eqJ(by['Governing Law'].theirs, { acc: 0, rej: 1 });
  });
  test('refused and still open, by clause — a withdrawn one is not open', () => {
    const { led } = ledgerOf(stage(book()));
    const by = Object.fromEntries(led.clauses.map(c => [c.label, c]));
    assert.equal(by['Payment Terms'].open, 1);
    eqJ(by['Payment Terms'].openDeals.map(d => d.id), ['MK-1']);
    eqJ(by['Liability'].openDeals.map(d => d.id), ['MK-2'], 'MK-1\'s refusal on it was withdrawn');
    assert.equal(led.openOutside.reduce((s, x) => s + x.n, 0), 1, 'the refusal on no named clause is counted outside the list');
    assert.equal(led.clauses.reduce((s, c) => s + c.open, 0) + 1, ledgerOf(stage(book())).st.deadlocks,
      'the clause counts and the outside count add up to the strip\'s figure');
  });
  test('who contested it, per counterparty, out of their own negotiations', () => {
    const { led } = ledgerOf(stage(book()));
    const gl = led.clauses.find(c => c.label === 'Governing Law');
    eqJ(gl.by.map(p => [p.name, p.n, p.of]), [['Copia', 2, 2]]);
  });
  test('the waiting list is named in full, not capped at twelve like the prompt\'s list', () => {
    const many = Array.from({ length: 14 }, (_, i) => deal('MK-' + (100 + i), 'Party ' + i, 2, [CH('Payment Terms', 'rejected', 'owner')]));
    const { st, led } = ledgerOf(stage(many));
    assert.equal(st.deadlockList.length, 12, 'CONTROL — the prompt\'s own list keeps its cap');
    assert.equal(led.waiting.length, 14);
  });
  test('the renderer counts nothing of its own', () => {
    const r = strip(fnBody(INTEL, 'intelFrictionLedgerHtml') + fnBody(INTEL, 'intelFrictionDetailHtml'));
    assert.ok(!/negoAllChanges|\.changes\b|\.negotiation\b|state\.contracts/.test(r), 'no walk of the book in the drawing');
    assert.match(fnBody(INTEL, 'intelFrictionStats'), /intelFrictionLedgerData\(/, 'the stats hand their tallies to the data function');
  });
  test('[wall] the old figures keep their meaning — the clause list Copilot reads is still the most CONTESTED eight', () => {
    const { st } = ledgerOf(stage(book()));
    eqJ(st.clauses.map(c => c.label), ['Payment Terms', 'Liability', 'Governing Law']);
    assert.equal(st.deadlocks, 4);
    assert.equal(st.oursAcceptShare, 0.5);
  });
});

describe('f430 (5) — reading must not write', () => {
  test('[wall] a contract with no negotiation is never given one, and the book is walked once', () => {
    const b = book();
    const s = stage(b);
    s.intelFrictionHtml();
    const n0 = walks.length;
    assert.ok(!b.find(c => c.id === 'MK-6').negotiation, 'MK-6 still has no negotiation');
    assert.ok(!walks.includes('MK-6'), 'and nothing asked for its changes');
    assert.equal(n0, 5, 'one walk per negotiation for one paint — the ledger added no second pass');
  });
});

describe('f430 (6) — every new word is a key in both books', () => {
  const [EN, SV] = I18N.split(/\n {2}sv: \{/);
  test('each igf_led_ key the page asks for is in English and in Svenska', () => {
    const used = new Set([...INTEL.matchAll(/i18tn?\(\s*['"](igf_led_\w+)['"]/g)].map(m => m[1]));
    assert.ok(used.size > 40, 'the page speaks through its keys: ' + used.size);
    const has = (book, k) => new RegExp('\\n\\s+' + k + '(_one|_other)?:').test(book);
    const missing = [...used].filter(k => !has(EN, k) || !has(SV, k));
    eqJ(missing, []);
  });
  test('the brief\'s hard-coded English is gone from the code', () => {
    const code = strip(INTEL);
    for (const s of ['of negotiations get stuck on', 'rounds per deal with', 'Filter the page to', 'See the ${',
                     'Counted from the fingerprinted tracked changes', "th('Counterparty')"])
      assert.ok(!code.includes(s), 'still in the code: ' + s);
    assert.ok(!/data-igf-deadlocks|igf-deadlist/.test(code), 'the unfolding deadlock list went with it');
  });
  test('published through the file\'s own window assignment, one name per module', () => {
    for (const n of ['intelFrictionLedgerData', 'intelFrictionLedgerHtml', 'intelFrictionDetailHtml', 'intelFrictionWire'])
      assert.match(INTEL, new RegExp('Object\\.assign\\(window,\\{[^}]*\\b' + n + '\\b'), n + ' is published');
  });
});
