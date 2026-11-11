/* f996 — EXPLORER: THE N BIGGEST GROUPS, AND WHAT JAMBO UNDERSTOOD (the owner's screenshot, 10 Nov 2026: "only
   include the top 5 folders by value" kept the 5 biggest contracts IN EACH stream; the owner then picked "Board Twin"
   for showing the reading: the Board's own chips under the answer, the doubtful part amber, a word read said).
     (1) the free reader reads a grouping named right after the number as the N biggest GROUPS; "per"/"in each" stays
         per group; "supplier contracts" stays contracts; "folders" is HaTi's own word for the value streams
     (2) igTopGroups ranks the groups by their total and keeps the N biggest whole; the rest are said by name
     (3) the map carries it out, from the free reader and from the AI (top.groups), with ONE label
     (4) the route offers groups and keeps it; the company's own words travel off the Board
     (5) the two readers disagree on the shape: the words that name the groups win, and the Keep chip is amber
     (6) the reading chips: Keep · Ranked by · the word; a press re-reads the SAME set the other way, in place
     (7) a word only the AI read: an admin may teach it to the company's word book; the free reader reads it after */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { buildWorld } = require('./world');
const { startHati, seedWorkspace, fixtureContract } = require('./helpers');

const ROOT = path.join(__dirname, '..');
const IG = fs.readFileSync(path.join(ROOT, 'js/views/intelligence.js'), 'utf8');

const FIX = () => [
  { id: 'MK-1', name: 'Lease A', status: 'Signed', counterparty: 'Naivas', folder: 'proc', value: 100 },
  { id: 'MK-2', name: 'Lease B', status: 'Signed', counterparty: 'Naivas', folder: 'proc', value: 900 },
  { id: 'MK-3', name: 'Supply C', status: 'Draft', counterparty: 'Britam', folder: 'sales', value: 300 },
  { id: 'MK-4', name: 'Supply D', status: 'Under Review', counterparty: 'Britam', folder: 'sales', value: 400 },
  { id: 'MK-5', name: 'Supply E', status: 'Signed', counterparty: 'Zamara', folder: 'mfg', value: 50 },
  { id: 'MK-6', name: 'Supply F', status: 'Draft', counterparty: 'Zamara', folder: 'mfg', value: 60 },
  { id: 'MK-7', name: 'Lease G', status: 'Signed', counterparty: 'Twiga', folder: 'lease', value: 20 },
];
function world() {
  const w = buildWorld({ intelView: true });
  const win = w.win;
  win.state = { contracts: FIX(), settings: {} };
  win.getContract = id => win.state.contracts.find(x => x.id === id);
  win.isMonetary = win.isMonetary || (c => Number(c.value || 0) > 0);
  win.FOLDERS = { proc: { id: 'proc', name: 'Procurement' }, sales: { id: 'sales', name: 'Sales' }, mfg: { id: 'mfg', name: 'Manufacturing' }, lease: { id: 'lease', name: 'Leasing' } };
  win.statusLabel = win.statusLabel || (s => String(s || ''));
  win.jxCurrency = win.jxCurrency || (() => 'KES');
  win.fxHome = win.fxHome || (c => ({ v: Number(c.value || 0), code: 'KES', converted: false, missing: false }));
  win.openFindings = win.openFindings || (() => []);
  win.eval("intel.lenses=[]; intel.groupBy='folder'; intel.groups=null; intel.history=[]; intel.lens=null; intel.colourBy=null; intel.mrOpen=null; intel.topDoubt=null;");
  return win;
}
const shown = win => [...(win.eval('intelActive()').ids || [])].sort();
const topOf = (win, q) => { const p = win.igRecipeParse(q); const a = p && p.acts.find(x => x.top); return a ? a.top : null; };

/* ---------- (1) THE FREE READER ---------- */
test('f996 (1) a grouping right after the number is the N biggest groups — red at the parent: "top 5 folders" was 5 contracts', () => {
  const win = world();
  const t = topOf(win, 'only include the top 5 folders by value');
  assert.ok(t && t.groups === true && t.per === 'folder' && t.n === 5 && t.by === 'value', JSON.stringify(t));
  const c = topOf(win, 'the 3 biggest customers');
  assert.ok(c && c.groups === true && c.per === 'counterparty' && c.n === 3, JSON.stringify(c));
  const f = topOf(win, 'top 5 functions by value');
  assert.ok(f && f.groups === true && f.per === 'folder');
  /* not groups: in each, contracts, and the plain top N */
  const p = topOf(win, 'top 3 biggest contracts in each stream');
  assert.ok(p && !p.groups && p.per === 'folder', JSON.stringify(p));
  const s = topOf(win, 'top 5 supplier contracts');
  assert.ok(s && !s.groups, 'supplier contracts are contracts: ' + JSON.stringify(s));
  const o = topOf(win, 'top 10 by value');
  assert.ok(o && !o.groups && !o.per);
  assert.equal(win.igTopGroupsWord('top 5 value streams').key, 'folder');
  assert.equal(win.igTopGroupsWord('top 5 contracts'), null);
});

/* ---------- (2) THE RANKING ---------- */
test('f996 (2) igTopGroups ranks the groups by their total and keeps the N biggest whole; the rest by name', () => {
  const win = world();
  const G = win.igTopGroups(2, 'value', 'folder', null, 'down');
  assert.deepEqual([...G.kept], ['Procurement', 'Sales'], 'Procurement 1000 and Sales 700 lead');
  assert.deepEqual([...G.ids].sort(), ['MK-1', 'MK-2', 'MK-3', 'MK-4']);
  assert.deepEqual([...G.hidden], ['Manufacturing', 'Leasing']);
  const S = win.igTopGroups(1, 'value', 'folder', null, 'up');
  assert.deepEqual([...S.kept], ['Leasing'], 'the other end');
  assert.match(win.igTopHiddenSaid(['A', 'B', 'C', 'D', 'E']), /hidden: A, B, C and 2 more/);
});

/* ---------- (3) THE MAP CARRIES IT OUT ---------- */
test('f996 (3) the map keeps the N biggest groups from the free reader and from the AI, with ONE label', () => {
  const win = world();
  win.igRecipeRun(win.igRecipeParse('top 2 folders by value'));
  assert.deepEqual(shown(win), ['MK-1', 'MK-2', 'MK-3', 'MK-4']);
  const L = win.igTopLensNow();
  assert.equal(L.label, 'Top 2 value streams by value');
  const said = win.eval('intel.history[intel.history.length-1].text');
  assert.match(said, /hidden: Manufacturing, Leasing/, 'the groups left out are said');
  /* the AI's top.groups */
  const w2 = world();
  w2.intelGraphApply('top 2 value streams', { top: { n: 2, by: 'value', per: 'folder', groups: true }, note: 'x' });
  assert.deepEqual(shown(w2), ['MK-1', 'MK-2', 'MK-3', 'MK-4']);
  assert.equal(w2.igTopLensNow().label, 'Top 2 value streams by value');
  /* without groups, per is still the N biggest IN EACH group */
  const w3 = world();
  w3.intelGraphApply('top 1 in each stream', { top: { n: 1, by: 'value', per: 'folder' }, note: 'x' });
  assert.deepEqual(shown(w3), ['MK-2', 'MK-4', 'MK-6', 'MK-7']);
});

/* ---------- (4) THE ROUTE ---------- */
test('f996 (4) POST /api/ai/graph offers and keeps top.groups, and the company\'s words travel on the map', async () => {
  const h = await startHati();
  try {
    const { admin: c } = await seedWorkspace(h, { contracts: [fixtureContract('MK-G1', 'Office Lease', 'Twiga', 'sales', 5e6, 'Signed')], approvalRules: [] });
    h.ai.answerWith(name => name === 'render_graph' ? { note: 'x', answer: '', top: { n: 5, by: 'value', per: 'folder', groups: true } } : null);
    const r = await c.json('/api/ai/graph', { method: 'POST', body: { query: 'top 5 BUs', contracts: [{ id: 'MK-G1' }], screen: { groupBy: 'folder', words: '- Company words (read them so): "BUs" = split folder.' } } });
    assert.deepEqual(r.top, { n: 5, by: 'value', per: 'folder', groups: true, dir: 'down' });
    const body = JSON.parse(h.ai.calls[h.ai.calls.length - 1].raw);
    assert.ok(body.tools[0].input_schema.properties.top.properties.groups, 'the tool offers groups');
    assert.match(h.ai.lastPayloadText(), /BUs\\?" = split folder/, 'the company\'s words reach the model');
  } finally { await h.stop(); }
});

/* ---------- (5) THE CHECK ---------- */
test('f996 (5) the AI read "5 per stream" where the words name the groups: the words win and the Keep chip is amber', () => {
  const src = IG.slice(IG.indexOf('async function intelGraphAsk('), IG.indexOf('function igGapNote('));
  assert.match(src, /ft&&res\.top&&!igTopSame\(ft\.top,res\.top\)/, 'both read a top N: compared');
  assert.match(src, /if\(ft\.top\.groups\) res=Object\.assign\(\{\}, res, \{ top:/, 'the groups the words name win');
  assert.match(src, /intel\.topDoubt=/, 'the doubt is kept for the chip');
  const win = world();
  assert.equal(win.igTopSame({ n: 5, per: 'folder', groups: true }, { n: 5, per: 'folder' }), false);
  assert.equal(win.igTopShape(win.igTopClean({ n: 5, per: 'folder', groups: true })), 'groups');
});

/* ---------- (6) THE READING CHIPS ---------- */
/* RE-POINTED 11 Nov 2026 (the owner: "shorten the chips"): the chips carry the SHORT reading on the row — the
   label says "ranked", so the value no longer repeats "biggest" — and the menu keeps the whole words. */
test('f996 (6) the chips say Keep · By · the word; a press re-reads the same set in place', () => {
  const win = world();
  win.eval("intel.history.push({ role:'user', text:'only include the top 2 folders by value' })");
  const h0 = win.eval('intel.history.length');
  win.eval("intel.topDoubt='keep'");
  win.igRecipeRun(win.igRecipeParse('only include the top 2 folders by value'));
  win.eval("intel.topDoubt='keep'");
  win.igMapReadAfter(h0, 'only include the top 2 folders by value', null);
  const i = win.eval('intel.history.length-1');
  const m = win.eval('intel.history[intel.history.length-1]');
  assert.ok(m.mapRead, 'the reply carries its reading');
  assert.equal(m.mapRead.word.say, 'folders');
  let html = win.igMapReadHtml(m, i);
  assert.match(html, /class="hb-rd-chip is-doubt"[^>]*data-ig-mr="\d+:keep"/, 'the Keep chip is amber');
  assert.match(html, /<i>Keep<\/i>2 value streams/, 'short on the row');
  assert.match(html, /<i>By<\/i>value/);
  assert.match(html, /<i>&quot;folders&quot;<\/i>value streams/);
  assert.match(html, /data-ig-mrnext="\d+:\d+">Colour by stage</, 'a checked next step');
  /* the menu */
  win.eval(`intel.mrOpen='${i}:keep'`);
  html = win.igMapReadHtml(m, i);
  assert.match(html, /The 2 biggest in each value stream/);
  assert.match(html, /aria-checked="true" data-ig-mrset="\d+:keep:groups"><span>The 2 biggest value streams/);
  assert.match(html, /The 2 biggest contracts overall/);
  assert.match(html, /You wrote &quot;folders&quot;\. I read it as value streams\./);
  /* the press: in each stream instead — the same set, read the other way */
  assert.equal(win.igMapReadSet(i, 'keep', 'per'), true);
  assert.deepEqual(shown(win), ['MK-1', 'MK-2', 'MK-3', 'MK-4', 'MK-5', 'MK-6', 'MK-7']);
  assert.equal(m.mapRead.doubt, null, 'a choice made is not in doubt');
  assert.match(win.eval('intel.history[intel.history.length-1].text'), /Top 2 by value · in each value stream/, 'the line above says what the map now shows');
  assert.equal(win.eval('intel.history.length-1'), i, 'in place: no new turn');
  win.igMapReadSet(i, 'keep', 'groups');
  assert.deepEqual(shown(win), ['MK-1', 'MK-2', 'MK-3', 'MK-4'], 'and back, off the same set');
  /* a later answer takes the chips; the old ones stand still */
  win.eval("intel.history.push({ role:'assistant', text:'x', mapRead:{ top:intelActive&&intel.lenses.find(l=>l.top).top, word:null } })");
  assert.match(win.igMapReadHtml(m, i), /is-still/);
});

/* ---------- (7) A WORD ONLY THE AI READ ---------- */
test('f996 (7) a word only the AI read: an admin may teach it; once taught the free reader reads it', () => {
  const win = world();
  const w = win.igMapWordOf('top 5 BUs by value', 'folder');
  assert.deepEqual({ ...w }, { say: 'bus', key: 'folder', unknown: true });
  assert.equal(win.igMapWordOf('top 5 value streams', 'folder'), null, 'the grouping\'s own name needs no chip');
  assert.equal(win.igMapWordOf('top 5 functions', 'folder').builtIn, true);
  const src = IG.slice(IG.indexOf('async function igMapReadTeach('), IG.indexOf('async function intelAsk('));
  assert.match(src, /api\('settings\/board-words','PUT'/, 'the company\'s ONE word book');
  assert.match(IG, /R\.word\.unknown&&typeof isAdmin==='function'&&isAdmin\(\)/, 'only an admin is offered it');
  /* taught: the map's own reader reads it (the Board's swap, hbWordsApply) */
  assert.match(IG.slice(IG.indexOf('function igRecipeParse('), IG.indexOf('function igRecipeParse(') + 400), /hbWordsApply/);
});
