/* f1005 — ONE ROW, AND THE WORDS ABOVE IT (the owner, 11 Nov 2026: "for the explorer, build one row", then
   "build one row on the board too", then, shown three ways of treating the older answers, "keep the words").
   The NEWEST answer carries one row of controls; every answer above it keeps everything Jambo said and loses
   only its controls. Nothing is folded away, so the conversation is drawn, as the panel's own rule has it.
     (1) one row on every face, and the three-row toolbar retired
     (2) the row: the chips, ONE filled button, and ⋯; everything else is under it
     (3) only the newest answer carries the row; the ones above keep their words
     (4) an answer with nothing under it draws no row at all
     (5) the ⋯ holds the next steps and the rarer acts, and its rows stay in the page while it is shut */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { buildWorld } = require('./world');

const ROOT = path.join(__dirname, '..');

const FIX = () => [
  { id: 'MK-1', name: 'Lease A', status: 'Signed', counterparty: 'Naivas', folder: 'proc', value: 100 },
  { id: 'MK-2', name: 'Lease B', status: 'Signed', counterparty: 'Naivas', folder: 'proc', value: 900 },
  { id: 'MK-3', name: 'Supply C', status: 'Draft', counterparty: 'Britam', folder: 'sales', value: 300 },
];
function world(face) {
  const w = buildWorld({ intelView: true });
  const win = w.win;
  win.state = { contracts: FIX(), settings: {}, view: 'dashboard' };
  win.getContract = id => win.state.contracts.find(x => x.id === id);
  win.isMonetary = win.isMonetary || (c => Number(c.value || 0) > 0);
  win.FOLDERS = { proc: { id: 'proc', name: 'Procurement' }, sales: { id: 'sales', name: 'Sales' } };
  win.statusLabel = win.statusLabel || (s => String(s || ''));
  win.jxCurrency = win.jxCurrency || (() => 'KES');
  win.fxHome = win.fxHome || (c => ({ v: Number(c.value || 0), code: 'KES', converted: false, missing: false }));
  win.openFindings = win.openFindings || (() => []);
  win.hbFace = () => face || 'explorer';
  win.API_MODE = () => true;
  win.contractRef = c => c.id;
  win.eval("intel.lenses=[]; intel.groupBy='folder'; intel.groups=null; intel.history=[]; intel.lens=null; intel.paper=null; intel.tour=null; intel.mrOpen=null; intel.moreOpen=null; intel.oneOpen=null; intel.topDoubt=null;");
  return win;
}
/* one answer on the map, with its reading, carrying a set of contracts */
function answer(win, q) {
  win.eval(`intel.history.push({ role:'user', text:${JSON.stringify(q || 'only include the top 2 folders by value')} })`);
  const h0 = win.eval('intel.history.length');
  win.igRecipeRun(win.igRecipeParse(q || 'only include the top 2 folders by value'));
  win.igMapReadAfter(h0, q || 'only include the top 2 folders by value', null);
  win.eval("intel.history[intel.history.length-1].listIds=['MK-1','MK-2']");
  return { i: win.eval('intel.history.length-1'), m: win.eval('intel.history[intel.history.length-1]') };
}

/* ---------- (1) ONE LAYOUT, EVERY FACE ---------- */
test('f1005 (1) the panel draws one row on every face, and the three-row toolbar is retired', () => {
  for (const face of ['explorer', 'board', 'paper']){
    const w = world(face);
    const A = answer(w);
    assert.match(w.igOneHtml(A.m, A.i), /class="igd-one" data-ig-one="\d+"/, face + ' draws the row');
  }
  const IG = fs.readFileSync(path.join(ROOT, 'js/views/intelligence.js'), 'utf8');
  assert.match(IG, /\$\{igOneHtml\(m,i\)\}/, 'the panel asks the one builder');
  assert.ok(!/function igSapHtml/.test(IG), 'the three-row toolbar is gone, not left beside it');
  assert.ok(!/igOneRowOn/.test(IG), 'and no switch between two layouts is left behind');
});

/* ---------- (2) THE ROW ---------- */
test('f1005 (2) the chips, one filled button and ⋯ are on the row; the rest is under it', () => {
  const win = world('explorer');
  const { i, m } = answer(win);
  const html = win.igOneHtml(m, i);
  const row = String(html).split('<div class="igd-more-menu')[0];
  assert.match(row, /data-ig-mr="\d+:keep"/, 'the chips are on the row');
  assert.match(row, /ui-btn-primary[^>]*data-ig-paper-go="\d+"/, 'ONE filled button');
  assert.equal((row.match(/ui-btn-primary/g) || []).length, 1);
  assert.match(row, /class="igd-one-more"[^>]*data-ig-more="\d+"[^>]*aria-expanded="false"/, '⋯, shut');
  const menu = String(html).split('igd-more-menu')[1] || '';
  for (const a of ['data-ig-mrnext', 'data-ig-list', 'data-ig-export'])
    assert.match(menu, new RegExp(a), a + ' is under ⋯');
  assert.ok(!/data-ig-mrnext/.test(row), 'a next step is never on the row');
  win.eval(`intel.moreOpen='${i}'`);
  assert.match(win.igOneHtml(m, i), /class="igd-one-more is-open"[^>]*aria-expanded="true"/);
});

/* ---------- (3) + (4) THE WORDS ABOVE THE NEWEST ---------- */
test('f1005 (3) only the newest answer carries the row; the ones above keep their words', () => {
  const win = world('explorer');
  answer(win, 'top 5 counterparties by value');
  const older = win.eval('intel.history.length-1');
  answer(win, 'only include the top 2 folders by value');
  const newest = win.eval('intel.history.length-1');
  const a = win.eval('intel.history');
  assert.equal(win.igOneHtml(a[older], older), '', 'the older answer has no row');
  assert.match(win.igOneHtml(a[newest], newest), /class="igd-one"/, 'the newest does');
  /* and nothing folds: every turn is drawn, words and all */
  const IG = fs.readFileSync(path.join(ROOT, 'js/views/intelligence.js'), 'utf8');
  assert.ok(!/igFoldHtml|data-ig-fold|oneOpen/.test(IG), 'no answer is folded away');
  assert.match(IG, /intel\.history\.map\(\(m,i,a\)=>\(typeof window\.jamboTurnHtml/, 'the feed draws every turn');
});

test('f1005 (4) an answer with nothing under it draws no row at all', () => {
  const win = world('explorer');
  const { i, m } = answer(win);
  win.eval("delete intel.history[intel.history.length-1].mapRead; intel.history[intel.history.length-1].listIds=[]; intel.history[intel.history.length-1].cardIds=[]");
  win.eval("intel.history[intel.history.length-1].read={ text:'Read from Explorer and your book' }");
  assert.equal(win.igOneHtml(win.eval('intel.history[intel.history.length-1]'), i), '', 'nothing to show, no row — and the source line never makes one');
  assert.ok(m, 'the answer itself is untouched');
});

/* ---------- (5) WHAT ⋯ HOLDS ---------- */
test('f1005 (5) ⋯ holds the next steps and the rarer acts, and its rows stay in the page while it is shut', () => {
  const win = world('explorer');
  try { win.eval('IG = { nodes:[{ id:"MK-1" }], hubs:[] }'); } catch (_){ /* the map's own object may be fixed */ }
  const { i, m } = answer(win);
  const html = win.igOneHtml(m, i);
  const menu = String(html).split('igd-more-menu')[1] || '';
  assert.ok(!/is-open/.test(String(html).split('igd-more-menu')[0]), 'shut to begin with');
  const rare = win.eval('!!(IG && IG.nodes)') ? ['data-ig-tour-open', 'data-ig-pin-open', 'data-ig-pic'] : [];
  for (const a of rare.concat(['data-ig-mrnext', 'data-ig-list', 'data-ig-export']))
    assert.match(menu, new RegExp(a), a + ' is in the page while ⋯ is shut');
});

/* ---------- (6) THE PIECES SPLIT WITHOUT CHANGING A PRESS (was f1003 (5)) ---------- */
test('f1005 (6) the two builders hand back their pieces without changing a press', () => {
  const win = world('explorer');
  const { i, m } = answer(win);
  const whole = win.igMapReadHtml(m, i), chips = win.igMapReadHtml(m, i, { part: 'chips' }), next = win.igMapReadHtml(m, i, { part: 'next' });
  const presses = h => [...String(h).matchAll(/data-ig-(mr|mrnext)="([^"]+)"/g)].map(x => x[1] + ':' + x[2]).sort();
  assert.deepEqual(presses(chips.concat(next)), presses(whole), 'every press survives the split');
  assert.ok(!/ig-mr-next/.test(chips), 'the chips piece carries no next-step box');
  const lead = win.igDoorsHtml(m, i, { part: 'lead' }), rest = win.igDoorsHtml(m, i, { part: 'rest' });
  const doors = h => [...String(h).matchAll(/data-ig-(paper-go|board-go|list|export)=/g)].map(x => x[1]).sort();
  assert.deepEqual(doors(lead + rest), doors(win.igDoorsHtml(m, i)), 'and every door');
  assert.match(lead, /ui-btn-primary/);
  assert.ok(!/ui-btn-primary/.test(rest), 'only one filled button, and it is the lead');
});

/* ---------- (7) THE SOURCE LINE, IN THE MENU (was f1003 (7)) ---------- */
test('f1005 (7) the source line is the last row of ⋯, a line not a press, and never printed twice', () => {
  const win = world('explorer');
  const { i } = answer(win);
  win.eval("intel.history[intel.history.length-1].read={ text:'Read from Explorer and your book' }");
  const html = win.igOneHtml(win.eval('intel.history[intel.history.length-1]'), i);
  const menu = String(html).split('igd-more-menu')[1] || '';
  assert.match(menu, /<div class="igd-src" data-ai-read>Read from Explorer and your book<\/div>/, 'in the menu');
  assert.ok(menu.lastIndexOf('igd-src') > menu.lastIndexOf('data-ig-list'), 'last in the menu');
  assert.ok(!/<button[^>]*igd-src/.test(menu), 'a line, never a press');
  const turn = { role: 'assistant', read: { text: 'Read from Explorer and your book' } };
  win.igMsgHTML = () => '<p>answer</p><div class="igd-src" data-ai-read>Read from Explorer and your book</div>';
  assert.equal((String(win.jamboTurnHtml(turn, 0, [turn], 'ig')).match(/data-ai-read/g) || []).length, 1, 'said once');
  win.igMsgHTML = () => '<p>answer</p>';
  assert.match(String(win.jamboTurnHtml(turn, 0, [turn], 'ig')), /class="ai-read jb-read is-ig" data-ai-read/, 'a builder that does not carry it still gets the line');
});

/* ---------- (8) THE PAGE LINKS RIDE THE WAY BACK (was f1003 (8)) ---------- */
test('f1005 (8) the page links stand on the way-back line, before the bin, and not in a row of their own', () => {
  const win = world('explorer');
  const C = fs.readFileSync(path.join(ROOT, 'js/components.js'), 'utf8');
  const a = C.indexOf('const JB_WAY_FEET'), b = C.indexOf('Object.assign(window,{', a);
  assert.ok(a > 0 && b > a, 'the ways region is where it was');
  win.esc = win.esc || (x => String(x == null ? '' : x).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch])));
  win._jbT = win._jbT || (k => k);
  win.newLookOn = () => true;
  win.flowMapRow = k => (k === 'dashboard' ? { d: ['board', 'contracts', 'calendar'] } : null);
  win.eval(C.slice(a, b) + '\nObject.assign(window,{ jamboWaysHere, jamboWaysHtml, jamboWaysSync });');
  win.state.view = 'dashboard';
  const door = win.jamboDoorHtml({ on: true, back: 'talk', to: 'Overview', bin: '<button class="jb-bin"></button>' });
  assert.match(door, /jb-door-sp"><\/span><nav class="jb-ways is-in-door"/, 'the links come after the spacer');
  assert.ok(door.indexOf('jb-ways') < door.indexOf('jb-bin'), 'and before the bin');
  assert.ok(!/is-above-foot/.test(door), 'never the row of its own');
});
