'use strict';
/* f1094 — JAMBO'S PANELS, FIVE PARTS ON FIVE MORE PAGES (owner picked "Five Parts" by name, 18 Nov 2026, over the
   drawing "Ten Jambo panels, drawn three ways"; six of the ten set aside for now). The five panels that still had the
   old look: Read down on the Board, a chosen request, a chosen duty (and a renewal decision), a pressed place on the
   flow map, and New agreement → Their paper.
   (1) the builder quotes a row (`quote`): the ask in their words, a duty's own clause, in the paper's serif.
   (2) each page hands the five parts in: a headline, three numbers, rows, the one black button by the page's OWN
       press (data-rd-*, needsYouGo 'renewal', data-ikn-draft / data-ikn-open, the duty's Mark done / Chase,
       data-fm-go, the sheet's own file picker) — read off the page's own reading, no AI.
   (3) every panel is the five parts in the new look and drawn as before in the old one.
   (4) every word of the round is in both books.
   AT THE PARENT every test here fails: none of these builders or words exist. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const region = (src, start, end) => { const i = src.indexOf(start); assert.ok(i >= 0, start + ' is there'); const j = end ? src.indexOf(end, i + start.length) : -1; return strip(src.slice(i, j > i ? j : i + 6000)); };
/* the pages this round reads, loaded on the world as f1068 loads its own (each eval'd once, only where missing) */
const PAGES = { 'js/flowmap.js': 'flowMapRow', 'js/views/flowmap.js': 'fmPanelFive', 'js/views/homeboard.js': 'hbRdnPanelFive', 'js/paperdesk.js': 'naTheirsFive' };
function world(){
  const w = buildWorld({ intakeView: true, obligations: true });
  const W = w.win;
  const me = { id: 'u_f1094', name: 'Amina Otieno', email: 'amina@example.co.ke', role: 'admin', prefs: {}, canViewValues: true };
  W.currentUser = () => me; W.isAdmin = () => true; W.canEdit = () => true; W.canViewValues = () => true;
  /* core.js's day count, which the app loads before obligations.js (the world does not load core.js) */
  if (typeof W.daysUntil !== 'function') W.eval(`window.daysUntil = iso => { const t = new Date(); t.setHours(12, 0, 0, 0); return Math.round((new Date(String(iso).slice(0, 10) + 'T12:00:00') - t) / 864e5); };`);
  W.state = W.state || { contracts: [], settings: {} }; if (!Array.isArray(W.state.contracts)) W.state.contracts = [];
  for (const [f, name] of Object.entries(PAGES)){ if (typeof W[name] === 'function') continue;
    try { W.eval(read(f)); } catch (e){ W['_f1094_' + name] = String(e && e.message || e); } }
  return W;
}
const draw = (W, o, slot) => { const d = W.document.createElement('div'); d.innerHTML = W.jamboOverviewHtml(o, slot); return d; };
const J = x => JSON.parse(JSON.stringify(x));   // an array from the world's window, compared here
const txt = el => (el ? el.textContent : '').replace(/\s+/g, ' ').trim();
/* a day so many days from the world's today, built from its own clock (never a date typed in) */
const dayFrom = (W, n) => { const d = new W.Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

test('f1094 (1) the builder quotes a row in the paper\'s serif', () => {
  const W = world();
  const d = draw(W, { title: 'A request.', groups: [{ label: 'In their words', rows: [{ mark: 'msg', t: 'We need an NDA first.', quote: true }] }] }, 'f1094a');
  const row = d.querySelector('.jov5-row');
  assert.ok(row.classList.contains('is-quote') && row.classList.contains('is-wrap'), 'a quoted row wraps and says it quotes');
  assert.match(read('index.html'), /\.jov5-row\.is-quote \.jov5-rt b\{font-family:var\(--font-doc\)/, 'in the paper\'s own serif token');
});

/* RE-POINTED 21 Nov 2026 (P-41, owner: "L+S and merge it"; MONEY IS NEVER A BIG PART OF A PAGE): no tiles, no money;
   the first decision is the black button, then Look closer — the first to end, the party with the most agreements, the
   late duties (or the negotiations when nothing is late) */
test('f1094 (2a) Read down: the first decision the black button, then three things to look at, no money', () => {
  const W = world();
  const R = { L: [{ id: 'a', counterparty: 'Safaricom' }, { id: 'b', counterparty: 'Safaricom' }], money: v => v ? 'KES 1.08B' : '', total: 1, sig: [], ending: [{ id: 'WS', name: 'Warehousing Services' }],
    exp: () => '2026-12-31', top: { p: 'Safaricom', cs: [{ id: 'S1' }] }, share: 22, nego: [{}, {}], ours: [{}], late: 1 };
  const f = W.hbRdnPanelFive(R);
  assert.ok(!f.glance || !f.glance.length, 'no tiles');
  const d = draw(W, f, 'f1094rd');
  assert.ok(d.querySelector('.jov5-title'), 'a serif headline');
  assert.equal(d.querySelectorAll('.jov5-row').length, 3, 'first to end, the party with the most, late duties');
  assert.ok(d.querySelector('[data-rd-show="a,b"]'), 'the party opens its agreements by the page\'s own press');
  assert.ok(d.querySelector('[data-rd-go="oblig"]'), 'the late duties by the page\'s own press');
  assert.doesNotMatch(d.textContent, /KES/, 'no money in the panel');
  assert.match(txt(d.querySelector('.jov5-go')), /Warehousing Services/, 'the first renewal is the black button');
  const none = W.hbRdnPanelFive(Object.assign({}, R, { ending: [], late: 0 }));
  assert.ok(none.act && none.act.attr === 'data-rd-go="calendar"', 'nothing ending: the calendar, never an empty panel');
  const src = region(read('js/views/homeboard.js'), 'function hbRdnPanelFive(R){', 'function hbRdnBtnHtml');
  assert.match(src, /needsYouGo\('renewal', f\.id\)/, 'Decide is the renewal\'s own door');
});

test('f1094 (2b) a chosen request: its title, the ask quoted, Start the draft by the row\'s own press', () => {
  const W = world();
  const r = { id: 'RQ1', title: 'NDA for a new distributor', need: 'We are meeting a distributor next week and need an NDA first.',
    counterparty: 'Coastline Distributors', by: { name: 'Grace Wanjiru' }, createdAt: new W.Date().toISOString(), status: 'new' };
  const f = W.iknPanelFive(r, true);
  assert.equal(f.title, 'NDA for a new distributor.');
  assert.equal(f.glance.length, 3);
  const d = draw(W, f, 'f1094rq');
  assert.ok(d.querySelector('.jov5-row.is-quote'), 'the ask in their words, quoted');
  assert.match(txt(d), /Coastline Distributors/, 'what was read from the ask');
  assert.ok(d.querySelector('.jov5-go[data-ikn-draft="RQ1"]'), 'Start the draft is the row\'s own press');
  assert.match(f.sub, /Nobody holds it yet/, 'who holds it, said');
  /* what main brought back on 17 Nov (owner's picks) stands in the five parts: the lane, each file by name with who added
     it (data-ikn-file), and Hand back beside Start the draft while the request is open (data-ikn-back) */
  const r2 = Object.assign({}, r, { status: 'open', lane: 'NDA', files: [{ id: 'f1', name: 'pilot-brief.pdf', size: 2048 }] });
  const f2 = W.iknPanelFive(r2, true), d2 = draw(W, f2, 'f1094rq2');
  assert.match(f2.sub, /NDA lane/, 'the lane that sent it');
  assert.ok(d2.querySelector('[data-ikn-file="f1"]'), 'the file by name, a door');
  assert.match(txt(d2), /added by Grace/, 'who added it');
  assert.ok(d2.querySelector('.jov5-acts [data-ikn-back="RQ1"]'), 'Hand back beside Start the draft');
  const viewer = W.iknPanelFive(r, false);
  assert.equal(viewer.act, null, 'no Start the draft for one who may not edit');
});

test('f1094 (2c) a chosen duty: when as the headline, the clause said or its absence, Mark done the black button', () => {
  const W = world();
  const o = { id: 'o1', desc: 'Quarterly stock count', due: dayFrom(W, 12), party: 'us', status: 'open', recurring: 'none' };
  const c = { id: 'C1', name: 'Warehousing Services', counterparty: 'Juno Logistics', folder: 'sales', obligations: [o] };
  const f = W.obPanelFive(o, c, 0);
  assert.match(f.title, /^Quarterly stock count is due in 12 days\.$/);
  assert.match(f.sub, /We owe it to Juno Logistics under Warehousing Services/);
  assert.equal(f.glance.length, 3);
  const d = draw(W, f, 'f1094ob');
  assert.match(txt(d), /No wording recorded/, 'no clause recorded: said plainly, never left out');
  assert.equal(f.act && f.act.label, 'Mark done', 'Mark done is the black button');
  assert.ok(d.querySelector('.jov5-go'), 'drawn as the one black button');
  const quoted = W.obPanelFive(Object.assign({}, o, { quote: 'The Supplier shall count stock quarterly.' }), c, 0);
  assert.ok(quoted.groups[1].rows[0].quote && quoted.groups[1].rows[0].link, 'the clause quoted, with Show it in the contract');
  const late = W.obPanelFive(Object.assign({}, o, { due: dayFrom(W, -3) }), c, 0);
  assert.match(late.title, /is 3 days late\.$/); assert.ok(late.glance[0].warn, 'late reads amber');
  const src = region(read('js/obligations.js'), 'function obPanelFive(o, c, i){', 'function obDecisionFive');
  assert.match(src, /obPanelActs\(o, c, i, 'page'\)/, 'the acts are the panel\'s own runs');
  assert.match(src, /attr: 'data-ob-show=""'/, 'Show it in the contract keeps the duty\'s own door by name');
  assert.match(region(read('js/obligations.js'), 'function obPaintPanel(', 'const opts = obPanelOpts'), /\[data-ob-show\][\s\S]*obligationShowInContract\(c\.id, o\.quote/, 'and is wired where the panel is painted');
  assert.match(src, /class="jov5-sec ins-rem ob-rem-five"/, 'Reminders stays one line, the rules behind a link');
  const dec = region(read('js/obligations.js'), 'function obDecisionFive(r){', 'function obPaintPanel');
  assert.match(dec, /needsYouGo\('renewal', c\.id\)/, 'a renewal decision\'s Decide is the renewal\'s own door');
});

test('f1094 (2d) a pressed place on the flow map: its line, its road, its doors, Open by the page\'s own press', () => {
  const W = world();
  const f = W.fmPanelFive('upload');
  assert.ok(f && /^Upload: /.test(f.title), 'the place and its one line');
  const row = W.eval('flowMapRow("upload")');
  assert.deepEqual(J(f.glance.map(g => g.n)), [row.a.length, row.d.length, row.p.length], 'counted off the map itself');
  const d = draw(W, f, 'f1094fm');
  assert.equal(d.querySelectorAll('.jov5-row').length, row.d.length + row.p.length, 'a row per door and per likely next');
  assert.ok(d.querySelector('.jov5-go[data-fm-go="upload"]'), 'Open is the page\'s own press');
  assert.equal(W.fmPanelFive('nowhere'), null, 'a place not on the map draws nothing');
});

test('f1094 (2e) Their paper: the steps, what Create needs as it stands, Choose a file the sheet\'s own picker', () => {
  const W = world();
  let picked = 0;
  const T = (file, stream) => ({ file: () => file, kept: () => '', stream: () => stream, pick: () => { picked++; } });
  const f = W.naTheirsFive(T('', ''));
  assert.equal(f.steps.items.length, 3, 'three steps');
  assert.deepEqual(J(f.groups[0].rows.map(r => r.tone)), ['amber', 'amber'], 'both still needed, in amber');
  assert.ok(f.act.label && typeof f.act.run === 'function', 'Choose a file');
  f.act.run(); assert.equal(picked, 1, 'it presses the sheet\'s own picker');
  const ready = W.naTheirsFive(T('supply.docx', 'Sales'));
  assert.deepEqual(J(ready.groups[0].rows.map(r => r.tone)), ['green', 'green']);
  assert.ok(!ready.act.label, 'ready: no second Create beside the page\'s own');
  const src = region(read('js/wizard.js'), '_naTheirs={', 'root._naTheirSet');
  assert.match(src, /getElementById\('na-theirs-pick'\)/, 'the picker is the sheet\'s own button');
});

test('f1094 (3) each panel is the five parts in the new look, as before in the old', () => {
  assert.match(region(read('js/views/homeboard.js'), 'function hbRdnPanelHtml(){', 'function hbRdnBtnHtml'), /newLookOn\(\) && typeof jamboOverviewHtml === 'function'\)\s*return `<div class="jl-words is-ov rd-five">\$\{jamboOverviewHtml\(hbRdnPanelFive\(hbRdnRead\(\)\)/);
  assert.match(region(read('js/views/intake.js'), 'function iknPanelHtml(r, may){', 'if (typeof document'), /newLookOn\(\) && typeof jamboOverviewHtml === 'function'\)\s*return `<div class="jl-words is-ov ikn-five">\$\{jamboOverviewHtml\(iknPanelFive\(r, may\)/);
  const ob = region(read('js/obligations.js'), 'function obPaintPanel(', 'host.querySelector');
  assert.match(ob, /ctx === 'page' && typeof window\.newLookOn === 'function' && newLookOn\(\)[\s\S]*obPanelFive\(o, c, i\)/, 'the page\'s duty panel; the contract\'s tab keeps its own');
  assert.match(region(read('js/obligations.js'), 'function obPaintDecision(r){', '\n}\n'), /newLookOn\(\)[\s\S]*obDecisionFive\(r\)/);
  assert.match(region(read('js/views/flowmap.js'), 'function fmPanelHtml(k){', 'function fmJlSayFive'), /newLookOn\(\) && typeof jamboOverviewHtml === 'function'\)\{\s*const f = fmPanelFive\(k\)/);
  assert.match(region(read('js/paperdesk.js'), 'function pdWallHelloHtml(){', 'function naTheirsFive'), /pd2On\(\) && typeof naTheirsNow === 'function'[\s\S]*naTheirsFive\(T\)/);
});

test('f1094 (4) every word of the round is in both books', () => {
  const W = world();
  const S = W.eval('typeof STRINGS !== "undefined" ? STRINGS : null'); assert.ok(S && S.en && S.sv);
  const keys = new Set();
  for (const f of ['js/views/homeboard.js', 'js/views/intake.js', 'js/obligations.js', 'js/views/flowmap.js', 'js/paperdesk.js'])
    for (const m of read(f).matchAll(/['"](jov5_(?:rd|rq|obp|fmp|nat)_[a-z0-9_]+)['"]/g)) keys.add(m[1]);
  assert.ok(keys.size >= 80, 'the round\'s words are found (' + keys.size + ')');
  const has = (b, k) => b[k] != null || b[k + '_one'] != null;
  assert.deepEqual([...keys].filter(k => !has(S.en, k) || !has(S.sv, k)), []);
});
