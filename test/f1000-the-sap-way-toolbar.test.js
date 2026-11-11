/* f1000 — THE SAP WAY: ONE TOOLBAR UNDER A JAMBO ANSWER (the owner, 10 Nov 2026: "the jambo panel seems extremely
   crowed due to the extra features… they are fine but they need to be more clean and structured"; the owner then
   picked "The SAP way" by name out of three drawings).
     (1) three LABELLED rows — Understood · Next · Open — in that order, and nothing loose beside them
     (2) the reading chips land in Understood, the checked next steps in Next, the one filled button in Open
     (3) the rare acts (Explain this view · Pin this finding · Copy picture) are under More, and the menu's rows
         stay in the page while it is shut, so nothing is lost and a press is all it takes
     (4) a row with nothing in it is not drawn; an answer with nothing under it has no toolbar at all
     (5) the two builders split without changing a single press (igMapReadHtml part, igDoorsHtml part)
     (6) both books carry the row labels */
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
test('f1000 (1) one toolbar, three labelled rows in order: Understood · Next · Open', () => {
  const win = world();
  const { i, m } = answer(win);
  const html = win.igSapHtml(m, i);
  assert.match(html, /<div class="igd-sap" data-ig-sap="\d+"/, 'one toolbar');
  assert.deepEqual(rows(html), ['understood', 'next', 'open']);
  assert.match(html, /<span class="igd-sap-l">Understood<\/span>/);
  assert.match(html, /<span class="igd-sap-l">Next<\/span>/);
  assert.match(html, /<span class="igd-sap-l">Open<\/span>/);
});

test('f1000 (2) the chips are in Understood, the next steps in Next, the one filled button in Open', () => {
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
test('f1000 (3) Explain this view, Pin this finding and Copy picture are under More, and the shut menu keeps them', () => {
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
test('f1000 (4) a row with nothing in it is not drawn, and an answer with nothing under it has no toolbar', () => {
  const win = world();
  const { i, m } = answer(win);
  win.eval("delete intel.history[intel.history.length-1].mapRead");
  const html = win.igSapHtml(m, i);
  assert.deepEqual(rows(html), ['open'], 'no reading, no Understood and no Next row');
  win.eval("intel.history[intel.history.length-1].listIds=[]; intel.history[intel.history.length-1].cardIds=[]");
  assert.equal(win.igSapHtml(win.eval('intel.history[intel.history.length-1]'), i), '', 'nothing at all: no toolbar');
  assert.equal(win.igSapHtml({ role: 'user', text: 'hi' }, 0), '', 'never under your own words');
});

/* ---------- (5) THE SPLIT CHANGES NO PRESS ---------- */
test('f1000 (5) the two builders split into pieces without changing a press', () => {
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

/* ---------- (6) BOTH BOOKS ---------- */
test('f1000 (6) both books carry the row labels', () => {
  const src = fs.readFileSync(path.join(ROOT, 'js/i18n.js'), 'utf8');
  for (const k of ['int_sap_label', 'int_sap_understood', 'int_sap_next', 'int_sap_open', 'int_sap_more'])
    assert.equal((src.match(new RegExp('\\b' + k + ':', 'g')) || []).length, 2, k + ' in English and Swedish');
});
