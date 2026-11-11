/* f1005 — ONE ROW ON EXPLORER (the owner, 11 Nov 2026, of the three layouts drawn the day before: "for the
   explorer, build one row"). Explorer's talk runs long, so the answers before the newest fold to one line each
   and the newest carries ONE row; the Board keeps the SAP toolbar it was given.
     (1) Explorer draws one row, the Board the three labelled rows — the same pieces either way
     (2) the row: the chips, ONE filled button, and ⋯; everything else is under it
     (3) the answers before the newest fold to one line: the words asked, and how many that answer drew
     (4) a count is printed only where the answer drew a set, and a press opens that one where it stands
     (5) both books carry the folded line's words */
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
  win.eval("intel.lenses=[]; intel.groupBy='folder'; intel.groups=null; intel.history=[]; intel.lens=null; intel.paper=null; intel.tour=null; intel.mrOpen=null; intel.sapOpen=null; intel.oneOpen=null; intel.topDoubt=null;");
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

/* ---------- (1) THE FACE DECIDES ---------- */
test('f1005 (1) Explorer draws one row, the Board the three labelled rows', () => {
  const e = world('explorer');
  assert.equal(e.igOneRowOn(), true);
  const A = answer(e);
  assert.match(e.igOneHtml(A.m, A.i), /class="igd-one" data-ig-one="\d+"/);
  const b = world('board');
  assert.equal(b.igOneRowOn(), false);
  const B = answer(b);
  assert.match(b.igSapHtml(B.m, B.i), /class="igd-sap"/);
  /* and the panel asks the face, not the page */
  const IG = fs.readFileSync(path.join(ROOT, 'js/views/intelligence.js'), 'utf8');
  assert.match(IG, /igOneRowOn\(\)\?igOneHtml\(m,i\):igSapHtml\(m,i\)/);
});

/* ---------- (2) THE ROW ---------- */
test('f1005 (2) the chips, one filled button and ⋯ are on the row; the rest is under it', () => {
  const win = world('explorer');
  const { i, m } = answer(win);
  const html = win.igOneHtml(m, i);
  const row = String(html).split('<div class="igd-sap-menu')[0];
  assert.match(row, /data-ig-mr="\d+:keep"/, 'the chips are on the row');
  assert.match(row, /ui-btn-primary[^>]*data-ig-paper-go="\d+"/, 'ONE filled button');
  assert.equal((row.match(/ui-btn-primary/g) || []).length, 1);
  assert.match(row, /class="igd-one-more"[^>]*data-ig-sap-more="\d+"[^>]*aria-expanded="false"/, '⋯, shut');
  const menu = String(html).split('igd-sap-menu')[1] || '';
  for (const a of ['data-ig-mrnext', 'data-ig-list', 'data-ig-export'])
    assert.match(menu, new RegExp(a), a + ' is under ⋯');
  assert.ok(!/data-ig-mrnext/.test(row), 'a next step is never on the row');
  win.eval(`intel.sapOpen='${i}'`);
  assert.match(win.igOneHtml(m, i), /class="igd-one-more is-open"[^>]*aria-expanded="true"/);
});

/* ---------- (3) + (4) THE FOLD ---------- */
test('f1005 (3) the answers before the newest fold to one line, the newest keeps its bubble', () => {
  const win = world('explorer');
  answer(win, 'top 5 counterparties by value');
  answer(win, 'only include the top 2 folders by value');
  const feed = win.igTurnsHtml(win.eval('intel.history'));
  const folds = [...String(feed).matchAll(/data-ig-fold="(\d+)"/g)].map(x => x[1]);
  assert.deepEqual(folds, ['0'], 'the first question folded, the newest not');
  assert.match(feed, /<span class="igd-fold-q">top 5 counterparties by value<\/span>/);
  assert.equal((String(feed).match(/ig-bub-me/g) || []).length, 1, 'one question bubble: the newest');
});

test('f1005 (4) a count prints only where the answer drew a set, and a press opens that one', () => {
  const win = world('explorer');
  answer(win, 'top 5 counterparties by value');
  answer(win, 'only include the top 2 folders by value');
  const a = win.eval('intel.history');
  assert.match(win.igFoldHtml(a, 0, 2), /<span class="igd-fold-n">2 shown/, 'the set it drew');
  win.eval("intel.history[1].listIds=[]; intel.history[1].cardIds=[]");
  assert.ok(!/igd-fold-n">\d/.test(win.igFoldHtml(win.eval('intel.history'), 0, 2)), 'nothing drawn, no count');
  /* opened, the folded line says so and its answers stand under it */
  win.eval('intel.oneOpen=0');
  const feed = win.igTurnsHtml(win.eval('intel.history'));
  assert.match(feed, /data-ig-fold="0" aria-expanded="true"/);
  assert.match(feed, /data-ig-turn="1"/, 'its answer is drawn under it');
});

/* ---------- (5) BOTH BOOKS ---------- */
test('f1005 (5) both books carry the folded line\'s words', () => {
  const src = fs.readFileSync(path.join(ROOT, 'js/i18n.js'), 'utf8');
  const lines = src.split('\n').filter(l => l.includes('int_one_shown:'));
  assert.equal(lines.length, 2, 'in English and Swedish');
  for (const l of lines) assert.match(l, /\{n\}/, 'the count is the one the answer drew');
});
