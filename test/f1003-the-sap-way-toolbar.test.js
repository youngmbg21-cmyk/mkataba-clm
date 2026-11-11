/* f1003 — THE SAP WAY: ONE TOOLBAR UNDER A JAMBO ANSWER (the owner, 10 Nov 2026: "the jambo panel seems extremely
   crowed due to the extra features… they are fine but they need to be more clean and structured"; the owner then
   picked "The SAP way" by name out of three drawings).
     (1) three LABELLED rows — Understood · Next · Open — in that order, and nothing loose beside them
     (2) the reading chips land in Understood, the checked next steps in Next, the one filled button in Open
     (3) the rare acts (Explain this view · Pin this finding · Copy picture) are under More, and the menu's rows
         stay in the page while it is shut, so nothing is lost and a press is all it takes
     (4) a row with nothing in it is not drawn; an answer with nothing under it has no toolbar at all
     (5) the two builders split without changing a single press (igMapReadHtml part, igDoorsHtml part)
     (6) both books carry the row labels
     (7) the source line ("Read from Explorer and your book") is the last row of More, a line and not a press, and
         the panel never prints a second one under the answer
     (8) the page links ride the way-back line, at its right end before the bin — never a row of their own */
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
function world() {
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
  win.hbFace = () => 'explorer';
  win.API_MODE = () => true;
  win.contractRef = c => c.id;
  win.eval("intel.lenses=[]; intel.groupBy='folder'; intel.groups=null; intel.history=[]; intel.lens=null; intel.paper=null; intel.tour=null; intel.mrOpen=null; intel.sapOpen=null; intel.topDoubt=null;");
  return win;
}
/* one answer on the map, with its reading, carrying a set of contracts */
function answer(win) {
  const q = 'only include the top 2 folders by value';
  win.eval(`intel.history.push({ role:'user', text:${JSON.stringify(q)} })`);
  const h0 = win.eval('intel.history.length');
  win.igRecipeRun(win.igRecipeParse(q));
  win.igMapReadAfter(h0, q, null);
  win.eval("intel.history[intel.history.length-1].listIds=['MK-1','MK-2']");
  return { i: win.eval('intel.history.length-1'), m: win.eval('intel.history[intel.history.length-1]') };
}
const rows = html => [...String(html).matchAll(/data-ig-sap-r="([a-z]+)"/g)].map(m => m[1]);

/* ---------- (1) + (2) THE THREE LABELLED ROWS ---------- */
test('f1003 (1) one toolbar, three labelled rows in order: Understood · Next · Open', () => {
  const win = world();
  const { i, m } = answer(win);
  const html = win.igSapHtml(m, i);
  assert.match(html, /<div class="igd-sap" data-ig-sap="\d+"/, 'one toolbar');
  assert.deepEqual(rows(html), ['understood', 'next', 'open']);
  assert.match(html, /<span class="igd-sap-l">Understood<\/span>/);
  assert.match(html, /<span class="igd-sap-l">Next<\/span>/);
  assert.match(html, /<span class="igd-sap-l">Open<\/span>/);
});

test('f1003 (2) the chips are in Understood, the next steps in Next, the one filled button in Open', () => {
  const win = world();
  const { i, m } = answer(win);
  const html = win.igSapHtml(m, i);
  const part = k => { const segs = String(html).split('data-ig-sap-r="'); const seg = segs.find(x => x.startsWith(k + '"')); return seg || ''; };
  assert.match(part('understood'), /data-ig-mr="\d+:keep"/, 'Keep is a chip you can change');
  assert.match(part('understood'), /data-ig-mr="\d+:by"/);
  assert.ok(!/data-ig-mrnext/.test(part('understood')), 'a next step is not in the Understood row');
  assert.match(part('next'), /data-ig-mrnext="\d+:\d+"/, 'the checked next steps');
  assert.match(part('open'), /ui-btn-primary[^>]*data-ig-paper-go="\d+"/, 'ONE filled button');
});

/* ---------- (3) THE RARE ACTS, UNDER MORE ---------- */
test('f1003 (3) Explain this view, Pin this finding and Copy picture are under More, and the shut menu keeps them', () => {
  const win = world();
  try { win.eval('IG = { nodes:[{ id:"MK-1" }], hubs:[] }'); } catch (_){ /* the map's own object may be fixed: More then carries the doors only */ }
  const { i, m } = answer(win);
  const html = win.igSapHtml(m, i);
  const menu = String(html).split('igd-sap-menu')[1] || '';
  assert.match(html, /class="igd-sap-more"[^>]*data-ig-sap-more="\d+"[^>]*aria-haspopup="menu"[^>]*aria-expanded="false"/, 'More, shut');
  assert.ok(!/igd-sap-menu is-open/.test(html), 'and its menu is not open');
  const rare = win.eval('!!(IG && IG.nodes)') ? ['data-ig-tour-open', 'data-ig-pin-open', 'data-ig-pic'] : [];
  for (const a of rare.concat(['data-ig-list', 'data-ig-export']))
    assert.match(menu, new RegExp(a), a + ' is still in the page while More is shut');
  /* the press opens it; the same press again closes it (renderIntelDock reads intel.sapOpen) */
  win.eval(`intel.sapOpen='${i}'`);
  const open = win.igSapHtml(m, i);
  assert.match(open, /class="igd-sap-more is-open"[^>]*aria-expanded="true"/);
  assert.match(open, /class="igd-sap-menu is-open"/);
});

/* ---------- (4) AN EMPTY ROW IS NOT DRAWN ---------- */
test('f1003 (4) a row with nothing in it is not drawn, and an answer with nothing under it has no toolbar', () => {
  const win = world();
  const { i, m } = answer(win);
  win.eval("delete intel.history[intel.history.length-1].mapRead");
  const html = win.igSapHtml(m, i);
  assert.deepEqual(rows(html), ['open'], 'no reading, no Understood and no Next row');
  win.eval("intel.history[intel.history.length-1].listIds=[]; intel.history[intel.history.length-1].cardIds=[]");
  win.eval("intel.history[intel.history.length-1].read={ text:'Read from Explorer and your book' }");
  assert.equal(win.igSapHtml(win.eval('intel.history[intel.history.length-1]'), i), '', 'nothing at all: no toolbar, and the source line never makes one');
  assert.equal(win.igSapHtml({ role: 'user', text: 'hi' }, 0), '', 'never under your own words');
});

/* ---------- (5) THE SPLIT CHANGES NO PRESS ---------- */
test('f1003 (5) the two builders split into pieces without changing a press', () => {
  const win = world();
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

/* ---------- (7) THE SOURCE LINE, IN THE MENU ---------- */
test('f1003 (7) the source line is the last row of More, a line not a press, and never printed twice', () => {
  const win = world();
  const { i } = answer(win);
  win.eval("intel.history[intel.history.length-1].read={ text:'Read from Explorer and your book' }");
  const html = win.igSapHtml(win.eval('intel.history[intel.history.length-1]'), i);
  const menu = String(html).split('igd-sap-menu')[1] || '';
  assert.match(menu, /<div class="igd-sap-src" data-ai-read>Read from Explorer and your book<\/div>/, 'in the menu');
  assert.ok(menu.lastIndexOf('igd-sap-src') > menu.lastIndexOf('data-ig-list'), 'last in the menu');
  assert.ok(!/<button[^>]*igd-sap-src/.test(menu), 'a line, never a press');
  /* and the turn builder, seeing it said, does not say it again under the answer */
  const turn = { role: 'assistant', read: { text: 'Read from Explorer and your book' } };
  win.igMsgHTML = () => '<p>answer</p><div class="igd-sap-src" data-ai-read>Read from Explorer and your book</div>';
  const once = win.jamboTurnHtml(turn, 0, [turn], 'ig');
  assert.equal((String(once).match(/data-ai-read/g) || []).length, 1, 'said once');
  win.igMsgHTML = () => '<p>answer</p>';
  const plain = win.jamboTurnHtml(turn, 0, [turn], 'ig');
  assert.match(String(plain), /class="ai-read jb-read is-ig" data-ai-read/, 'a builder that does not carry it still gets the line');
});

/* ---------- (8) THE PAGE LINKS RIDE THE WAY BACK ---------- */
test('f1003 (8) the page links stand on the way-back line, before the bin, and not in a row of their own', () => {
  const win = world();
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
  assert.match(door, /class="jb-door"/);
  assert.match(door, /jb-door-sp"><\/span><nav class="jb-ways is-in-door"/, 'the links come after the spacer');
  assert.ok(door.indexOf('jb-ways') < door.indexOf('jb-bin'), 'and before the bin');
  assert.match(door, /data-jb-way="board"/);
  assert.ok(!/is-above-foot/.test(door), 'never the row of its own');
  /* the panel asks for no second row while the way back is drawn */
  const IG = fs.readFileSync(path.join(ROOT, 'js/views/intelligence.js'), 'utf8');
  assert.match(IG, /!_igCaChipsDrawn && !talk && typeof jamboWaysHtml === 'function'/, 'the above-foot row stands down');
});

/* ---------- (6) BOTH BOOKS ---------- */
test('f1003 (6) both books carry the row labels', () => {
  const src = fs.readFileSync(path.join(ROOT, 'js/i18n.js'), 'utf8');
  for (const k of ['int_sap_label', 'int_sap_understood', 'int_sap_next', 'int_sap_open', 'int_sap_more'])
    assert.equal((src.match(new RegExp('\\b' + k + ':', 'g')) || []).length, 2, k + ' in English and Swedish');
});
