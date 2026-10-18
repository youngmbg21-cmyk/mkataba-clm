'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f744 — JAMBO'S PANEL BESIDE WHAT HOME HOLDS: ITS HEAD, ITS CHIPS, ITS BOX
   (rounds 13, 7 and 12 of the redesign as drawn; the owner's "build all the
   gaps", 18 Oct 2026)
   (1) The head names what the panel holds beside Jambo's tab: "Contract",
       "<ref> at a glance", "<ref> · History"; nothing where it holds his own
       words.
   (2) Its chips: none for a paper chosen on the wall (as drawn); beside a
       signed page "obligations · history · amend", an unsigned one "redline ·
       history · obligations" — a shut door never offered (caChipShut); on
       History the questions worth asking (put in the box for the reader to
       ask, its cost on the box) and "redline". Each presses its own door.
   (3) The box: "Ask about <ref>…" beside a page, "Ask about <ref>'s
       history…" on its History, "Ask for a contract, a number or a list…"
       with a paper chosen; a question beside a page goes with THAT contract's
       wording (igPaperAsk(q, id)), the Board's own reader and the map's
       stepped past, as beside the paper.
   (4) PASS 3 (the checker's differences, 18 Oct 2026): a page's chips sit
       RIGHT UNDER ITS CARD, at the top of the panel (rounds 7 and 12 as
       drawn), not in the panel's foot row — which a page leaves empty, so
       Jambo perches on the ask box; a row of their own, never the paper's
       chips row (pdChipsRepaint writes the paper's next steps into that).
   AT THE PARENT (8dc306a) every test here FAILS.
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const PD = R('js/paperdesk.js');
const IG = R('js/views/intelligence.js');
const CA = R('js/copilotacts.js');
const I18N = R('js/i18n.js');
const fnBody = (src, name) => { const i = src.indexOf('function ' + name + '('); if (i < 0) return ''; return src.slice(i, src.indexOf('\n}', i) + 2); };
const lineOf = (src, start) => { const i = src.indexOf(start); if (i < 0) return ''; return src.slice(i, src.indexOf('\n', i) + 1); };
const BOOKS = (() => {
  const en = {}, sv = {};
  for (const m of I18N.matchAll(/^\s+([a-z][a-z0-9_]*): (?:"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)'),?\s*$/gm)){
    const v = m[2] != null ? m[2] : m[3];
    if (!(m[1] in en)) en[m[1]] = v; else if (!(m[1] in sv)) sv[m[1]] = v;
  }
  return { en, sv };
})();
const say = (k, v) => { const t = BOOKS.en[k]; if (t == null) return k; return t.replace(/\{(\w+)\}/g, (_, x) => (v && v[x] != null) ? v[x] : ''); };
/* pass 4: what a page owes leads its chips (pdHeldOwes); History asks its trail's other questions (pdHistAlso) */
const FNS = ['pdCardNow', 'pdCardPage', 'pdHolds', 'pdHeldContract', 'pdHeadWord', 'pdAskPlaceholder', 'pdAskContractId', 'pdHeldOwes', 'pdHeldChips', 'pdPanelChipsHtml', 'pdHeldChipsHtml', 'pdHistChanges', 'pdHistAlso', 'pdHistQuestions'];
function world(o){
  const ctx = Object.assign({ Array, JSON, Math, Number, String, Object,
    state: { view: 'dashboard' }, i18t: say, i18tn: (k, n, v) => say(k + (n === 1 ? '_one' : '_other'), Object.assign({ n }, v)),
    face: 'board', page: 'ov', card: null, chosen: null, shut: [],
    contractRef: c => c.id, negoExecuted: c => c.status === 'Signed', negoClauseName: s => s,
    dsChanges: c => c.changes || [], jamboChipsOn: () => true,
    caNextLabel: k => ({ oblig: 'obligations', history: 'history', amend: 'amend', redline: 'redline' })[k] || k,
    pdContract: () => null,
  }, o || {});
  ctx.hbFace = () => ctx.face;
  ctx.igHomePaperFace = () => ctx.face === 'paper';
  ctx.igWallChosen = () => ctx.chosen;
  ctx.bsCardId = () => ctx.card ? ctx.card.id : null;
  ctx.bsStrip = () => ({ page: ctx.page });
  ctx.getContract = id => (ctx.card && ctx.card.id === id ? ctx.card : null);
  ctx.caChipShut = (c, k) => ctx.shut.includes(k);
  ctx.window = ctx; vm.createContext(ctx);
  vm.runInContext([lineOf(PD, 'const _pdE = '), lineOf(PD, 'const _pdT = '), lineOf(PD, 'const _pdTn = '), lineOf(PD, 'const PD_HELD_CHIPS = '), lineOf(PD, 'const PD_CHIP_CLS = '), lineOf(PD, 'const PD_HELD_CHIPS_MAX = '), lineOf(PD, 'const PD_HELD_CHIP_WORD = ')]
    .concat(FNS.map(f => fnBody(PD, f))).join('\n'), ctx);
  return ctx;
}
const SIGNED = { id: 'MK-0377', status: 'Signed', changes: [] };
const LIVE = { id: 'MK-0382', status: 'Under Review', negotiation: { round: 2 },
  changes: [{ id: 'A', authorSide: 'counterparty', clauseLabel: '7. Liability cap', status: 'pending', roundN: 2 },
    { id: 'B', authorSide: 'counterparty', clauseLabel: '12. Law and disputes', status: 'rejected', roundN: 1, resolvedAt: '2026-10-12T16:50:00Z' }] };

describe('f744 (1) the head names what the panel holds', () => {
  test('1a a page, its History, a chosen paper — and nothing where it holds his own words', () => {
    for (const f of FNS) assert.ok(fnBody(PD, f), f + ' is defined');
    const w = world({ card: SIGNED });
    assert.equal(w.pdHolds(), 'card'); assert.equal(w.pdHeadWord(), 'MK-0377 at a glance');
    w.page = 'hist'; w.card = LIVE; assert.equal(w.pdHolds(), 'hist'); assert.equal(w.pdHeadWord(), 'MK-0382 · History');
    w.page = 'where'; assert.equal(w.pdHolds(), 'card', 'Where we are and Details: the glance');
    w.card = null; assert.equal(w.pdHolds(), ''); assert.equal(w.pdHeadWord(), '');
    w.face = 'calendar'; w.card = SIGNED; assert.equal(w.pdHolds(), '', 'only while the Board shows the page');
  });
  test('1b the dock draws the word beside the tab', () => {
    assert.match(fnBody(IG, 'renderIntelDock'), /const w=\(typeof window\.pdHeadWord==='function'\)\?pdHeadWord\(\):''; return w\?`<span class="igd-head-w" title="\$\{igEsc\(w\)\}">\$\{igEsc\(w\)\}<\/span>`:'';/);
  });
});

describe('f744 (2) the chips for what is held', () => {
  test('2a a paper chosen on the wall: no chips (as drawn); his own place: none of these', () => {
    const w = world({ face: 'paper', chosen: { id: 'MK-1' } });
    assert.equal(w.pdPanelChipsHtml(), '');
    assert.equal(world().pdPanelChipsHtml(), null, 'the panel\'s own chips stand');
  });
  test('2b beside a signed page: obligations · history · amend, each pressing its own door; a shut door is not offered', () => {
    const w = world({ card: SIGNED });
    const h = w.pdPanelChipsHtml();
    assert.deepEqual([...h.matchAll(/data-pd-held-chip="(\w+)"[^>]*>([^<]+)</g)].map(m => m[2]), ['obligations', 'history', 'amend']);
    w.shut = ['amend'];
    assert.deepEqual([...w.pdPanelChipsHtml().matchAll(/data-pd-held-chip="(\w+)"/g)].map(m => m[1]), ['oblig', 'history']);
    const u = world({ card: LIVE });
    assert.deepEqual([...u.pdPanelChipsHtml().matchAll(/data-pd-held-chip="(\w+)"/g)].map(m => m[1]), ['redline', 'history', 'oblig']);
  });
  test('2c on History: the questions put in the box for the reader to ask, then redline', () => {
    const w = world({ card: LIVE, page: 'hist' });
    const h = w.pdPanelChipsHtml();
    assert.match(h, /^<button type="button" data-ca-fill="what changed in round 2"[^>]*>what changed in round 2<\/button><button type="button" data-ca-fill="who decided clause 12"[^>]*>who decided clause 12<\/button><button type="button" data-pd-held-chip="redline"[^>]*>redline<\/button>$/);
  });
  test('2d the dock draws no foot chips where a contract is held (its own sit under its card); the chip readings are published', () => {
    const D = fnBody(IG, 'renderIntelDock');
    /* RE-POINTED (pass 3, 18 Oct 2026): the held chips moved under the card (pdHeldChipsHtml) */
    assert.match(D, /const held=\(state\.view==='dashboard'&&typeof window\.pdPanelChipsHtml==='function'\)\?pdPanelChipsHtml\(\):null;\n\s+if\(held!==null\) return '';/);
    assert.match(CA, /caChipShut, caNextLabel/);
    const i = PD.indexOf('document._pdHeldWired'), seg = PD.slice(i, PD.indexOf('\n}\n', i));
    assert.match(seg, /\[data-pd-held-chip\][\s\S]*?pdHeldGo\(pdCardNow\(\), ch\.getAttribute\('data-pd-held-chip'\)\)/);
  });
});

describe('f744 (4) pass 3: the chips right under the card', () => {
  test('4a beside a page and on its History, the chips are a row of their own under the card; none for a chosen paper or nothing held', () => {
    const w = world({ card: SIGNED });
    assert.match(w.pdHeldChipsHtml(), /^<div class="pd-held-chips" data-pd-held-chips><button type="button" data-pd-held-chip="oblig"[^]*<\/div>$/);
    assert.doesNotMatch(w.pdHeldChipsHtml(), /data-ig-chips/, 'never the paper\'s chips row');
    w.page = 'hist'; w.card = LIVE;
    assert.match(w.pdHeldChipsHtml(), /data-ca-fill="what changed in round 2"/);
    assert.equal(world({ face: 'paper', chosen: { id: 'MK-1' } }).pdHeldChipsHtml(), '');
    assert.equal(world().pdHeldChipsHtml(), '');
    assert.equal(world({ card: SIGNED, jamboChipsOn: () => false }).pdHeldChipsHtml(), '', 'a reader who turned the chips off sees none');
  });
  test('4b the top draws the card and then its chips; a repaint keeps the row under the card', () => {
    assert.match(fnBody(PD, 'pdHeldTopHtml'), /return \(k === 'hist' \? pdHistGlanceHtml\(c\) : k === 'card' \? pdCardGlanceHtml\(c\) : pdChosenHtml\(c\)\) \+ pdHeldChipsHtml\(\);/);
    const F = fnBody(PD, 'pdHeldFollow');
    assert.match(F, /const row = document\.querySelector\('#ig-dock \[data-pd-held-chips\]'\), want = pdHeldChipsHtml\(\);/);
    assert.match(F, /else if \(nr\) card\.after\(nr\);/);
    assert.match(R('index.html'), /#ig-dock \.pd-held-chips\{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px\}/);
  });
});

describe('f744 (3) the box asks about what is held', () => {
  test('3a the words on the box', () => {
    const w = world({ card: SIGNED });
    assert.equal(w.pdAskPlaceholder(), 'Ask about MK-0377…');
    assert.equal(w.pdAskContractId(), 'MK-0377');
    w.page = 'hist'; assert.equal(w.pdAskPlaceholder(), 'Ask about MK-0377\'s history…');
    const c = world({ face: 'paper', chosen: { id: 'MK-1' } });
    assert.equal(c.pdAskPlaceholder(), 'Ask for a contract, a number or a list…');
    assert.equal(world().pdAskPlaceholder(), null);
  });
  test('3b the box reads them before its own words; its cost is counted for the page\'s contract', () => {
    const ctx = { state: { view: 'dashboard' }, intel: { paper: null }, i18t: say, getContract: () => null, igPaperUp: () => false,
      pdAskPlaceholder: () => 'Ask about MK-0377…', pdAskContractId: () => 'MK-0377' };
    ctx.window = ctx; vm.createContext(ctx);
    vm.runInContext(fnBody(IG, 'igHeldAskId') + fnBody(IG, 'igAskPlaceholder'), ctx);
    assert.equal(ctx.igAskPlaceholder(), 'Ask about MK-0377…');
    assert.equal(ctx.igHeldAskId(), 'MK-0377');
    ctx.igPaperUp = () => true; assert.equal(ctx.igHeldAskId(), null, 'a paper up is asked about itself');
    assert.match(fnBody(IG, 'igAskCost'), /const P=igPaperUp\(\)\?intel\.paper:igPaperCost\(c\);/);
  });
  test('3c a question beside a page goes with that contract\'s wording; the Board\'s reader and the map are stepped past', () => {
    const A = fnBody(IG, 'intelAsk');
    assert.match(A, /const heldId=igHeldAskId\(\);/);
    assert.match(A, /if\(state\.view==='dashboard' && \(onPaperSide\|\|heldId\) && typeof window\.hbBringOf==='function'/);
    /* main's template ask (tplAsk) and ANSWER WHERE YOU STAND (hereMap) kept beside it */
    assert.match(A, /if\(!heldId && state\.view==='dashboard' && !onPaperSide && !tplAsk && !hereMap && typeof window\.hbAsk==='function'\)/);
    assert.match(A, /const boardUp=\(!!igBoardNow\(\)&&!IG_WALK_RE\.test\(q\)&&!IG_OUTLIER_RE\.test\(q\)&&!mapListy\)\|\|!!heldId;/);
    assert.match(A, /const mapRest=\(igPaperUp\(\)\|\|boardUp\|\|tplAsk\)\?null:await intelMapLocal\(q\);/);
    /* JAMBO, THE SAME ON EVERY PAGE (main, 18 Oct 2026): the screen in front
       (caHereRead) and the words' acts (caActOf) are read before the page's
       question goes with its wording */
    assert.ok(A.indexOf('caHereRead(q)') > 0 && A.indexOf('caHereRead(q)') < A.indexOf('const heldId=igHeldAskId();'), 'the screen in front first');
    assert.ok(A.indexOf('caActOf(q)') < A.indexOf('const heldId=igHeldAskId();'), 'the words\' acts next');
    assert.match(A, /else if\(heldId\)\s+await igPaperAsk\(q,heldId\);/);
    const P = fnBody(IG, 'igPaperAsk');
    assert.match(P, /^function igPaperAsk\(q,cid\)\{\n[\s\S]*?const p0=intel\.paper; const c=cid\?getContract\(cid\):\(p0\?getContract\(p0\.id\):null\);/);
    assert.match(P, /if\(p\)\{ p\.words=/, 'the paper\'s own count is written only for the paper');
  });
});

/* ═══════════════════════════════════════════════════════════════════════════
   (5) PASS 4 — LAND ON IT (owner, 18 Oct 2026, main's rule): every door these
   panels hold names the one thing it opens on and arrives there through the
   one lander (landOn) — lit, in view, pressing nothing. And the box reads
   through Jambo's one reader first (the screen in front, the words' acts)
   before a page's question goes with its wording.
   AT THE LANE'S PREVIOUS COMMIT (dfe908f) every test here FAILS.
   ═══════════════════════════════════════════════════════════════════════════ */
describe('f744 (5) pass 4: every door lands on what it opened', () => {
  test('5a one table of where each door lands, through landOn; the door opens first, then lands', () => {
    const calls = [];
    const ctx = { Array, String, Set, Map, Object, CSS: { escape: s => s }, intel: { paper: { id: 'MK-1' } },
      document: { querySelector: s => ({ sel: s }) }, landOn: (t, o) => { calls.push({ el: t(), o }); return Promise.resolve(null); } };
    ctx.window = ctx; vm.createContext(ctx);
    vm.runInContext([lineOf(PD, 'const PD_HELD_LAND_TRIES = '), lineOf(PD, 'const PD_HELD_LAND_STILL = ')].join('\n') + '\n'
      + PD.slice(PD.indexOf('const PD_HELD_LAND = {'), PD.indexOf('\n};', PD.indexOf('const PD_HELD_LAND = {')) + 3) + '\n' + fnBody(PD, 'pdHeldLand'), ctx);
    const want = { oblig: '#obw-one-host', history: '#bs-strip-MK-1[data-bs-on="hist"]', amend: '#pd-amendface', red: '#pd-redface [data-nego-card]', fill: '#pd-fillface [data-pd-owed="1"]',
      sign: '#pd-signface #sign-btn', pay: '[data-bs-host="pay"][data-bs-cid="MK-1"]', access: '#st-ps', page: '#bs-strip-MK-1', paper: '#ig-paper' };
    for (const [k, sel] of Object.entries(want)){ calls.length = 0; ctx.pdHeldLand(k, 'MK-1'); assert.equal(calls.length, 1, k); assert.equal(calls[0].el.sel, sel, k); }
    calls.length = 0; ctx.pdHeldLand('redline', 'MK-1'); assert.equal(calls[0].el.sel, '#pd-redface [data-nego-card]', 'redline is the Redlines face too');
    calls.length = 0; ctx.pdHeldLand('page', 'MK-1'); assert.equal(calls[0].o.focus, false, 'a page is lit, no button readied on it'); assert.equal(calls[0].o.block, 'start');
    ctx.intel.paper = { id: 'MK-2' }; calls.length = 0; ctx.pdHeldLand('paper', 'MK-1'); assert.equal(calls[0].el, null, 'the paper only once it is the one opened');
    assert.match(fnBody(PD, 'pdHeldGo'), /const done = pdHeldOpen\(c, w\);\n\s+if \(done && c\) pdHeldLand\(w, c\.id\);/);
  });
  test('5b the chosen panel\'s doors and the glance\'s Bring it up land; Details\' doors too', () => {
    const i = PD.indexOf('document._pdHeldWired'), seg = PD.slice(i, PD.indexOf('\n}\n', i));
    assert.match(seg, /pdRedOpen\(id\) !== false\) pdHeldLand\('red', id\)/);
    assert.match(seg, /\[data-pd-cg-bring\][\s\S]*?hbStripBring\(id\) !== false\) pdHeldLand\('page', id\)/);
    const CT = R('js/views/contract.js'), FAM = R('js/family.js');
    assert.match(fnBody(CT, 'ovFilingRestPaint'), /openSettingsAt\('company','stream:'\+P2\.fid\); if\(typeof pdHeldLand==='function'\) pdHeldLand\('access',cc\.id\);/);
    assert.match(fnBody(CT, 'ovOpenFiling'), /landOn\(\(\)=>\{ const el=document\.getElementById\('ov-record'\);/, 'Re-file lands on the filing rows through the one lander');
    assert.ok(!/scrollIntoView/.test(fnBody(CT, 'ovOpenFiling')), 'never a hand-rolled scroll');
    assert.match(FAM, /if\(hbStripBring\(id\)!==false&&typeof pdHeldLand==='function'\) pdHeldLand\('page',id\);/);
  });
});
