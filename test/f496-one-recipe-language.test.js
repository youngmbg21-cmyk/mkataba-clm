/* f496 — ONE RECIPE LANGUAGE FOR EVERY CARD (the owner's work order, Part 1,
   4 Oct 2026: "I want it to be able to build almost anything i need in the
   dashboard with precision")

   A card is ONE short recipe — which contracts · split (and a second split) ·
   measure · picture · order · top N · period · comparison · name. HaTi draws
   only from it, Copilot only writes it, the dropdowns only edit it.

     A. ONE cleaner (hbCardClean) decides what a recipe is; a stored board is
        read through it, never rewritten;
     B. ONE planner (hbCardPlan) makes a recipe drawable and SAYS what it
        could not draw;
     C. ONE writer (hbCardSet): a press, the free reader and Copilot all go
        through it, and a kept card keeps its own copy;
     D. every new picture's bars, cells and columns are doors, and the number
        on a door is the list behind it;
     E. a top N says the rest, behind one door, never dropped silently;
     F. a period counts only its contracts, and says how many of how many;
     G. a comparison says this period against the one before, in words;
     H. the free reader reads the new parts from plain words, at no cost;
     I. the dropdown row edits the card it stands on, and a dead option says
        why. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const pad = n => String(n).padStart(2, '0');
/* a day in the month `off` months from now — mid-month, so no answer depends
   on the day the test runs */
const mon = (off, d = 15) => { const t = new Date(); const x = new Date(t.getFullYear(), t.getMonth() + off, d); return x.getFullYear() + '-' + pad(x.getMonth() + 1) + '-' + pad(x.getDate()); };

function book(){
  const cs = [];
  const add = (id, cp, status, value, folder, o) => cs.push(Object.assign({ id, name: 'Agreement ' + id, counterparty: cp, status, value, folder, expiry: mon(10), audit: [], metadata: {} }, o || {}));
  /* signings across the last 20 months: Juno most, then Naivas, then a tail */
  const cps = ['Juno AB', 'Juno AB', 'Naivas', 'Juno AB', 'Bidco', 'Naivas', 'Sendy', 'Kevian', 'Tuskys', 'Coast Motors', 'Siginon', 'Juno AB'];
  for (let k = 0; k < 24; k++){
    const off = -1 - (k % 20);
    add('MK-' + (100 + k), cps[k % cps.length], 'Signed', 1e6 * (1 + (k % 5)), k % 3 ? 'proc' : 'sales',
      { signedAt: mon(off, 10) + 'T10:00:00.000Z', _raisedAt: mon(off - 1, 5) + 'T10:00:00.000Z' });
  }
  add('MK-200', 'Juno AB', 'Draft', 5e6, 'sales', { _raisedAt: mon(-2, 5) + 'T10:00:00.000Z' });
  add('MK-201', 'Bidco', 'Under Review', 7e6, 'proc', { _raisedAt: mon(-3, 5) + 'T10:00:00.000Z' });
  add('MK-202', 'Naivas', 'Draft', 2e6, 'proc');
  add('MK-203', 'Sendy', 'Signed', 3e6, 'sales');                               /* executed, no signing date */
  return cs;
}
function world(){
  const w = buildWorld({ intelView: true }).win;
  w.state = { contracts: book(), settings: {}, view: 'dashboard' };
  w.FOLDERS = { proc: { id: 'proc', name: 'Procurement' }, sales: { id: 'sales', name: 'Sales' } };
  w.cKind = c => c.kind || 'Contract';
  w.getContract = id => w.state.contracts.find(c => c.id === id) || null;
  w.currentUser = () => ({ id: 'u_test', name: 'Test User', role: 'legal' });
  w.eval(read('js/views/homeboard.js'));
  w.eval('intel.lenses=[]; intel.groups=null; intel.groupBy="folder"; intel.history=[];');
  return w;
}
const J = x => JSON.parse(JSON.stringify(x));
/* a card over the whole book with this recipe on it, as a reader's press would leave it */
function card(w, recipe, q = 'contracts by stream'){
  const key = 'q:' + q;
  w.hbS().recipe = {}; w.hbCardSet(key, recipe);
  const D = w.hbDigData(key, 'all'); assert.ok(D, 'a card for ' + q);
  return { key, D, P: w.hbPlan(D), cs: w.hbListOf(D.ids, 'all') };
}
/* every door in a drawing, with the count its own label states */
function doors(html){
  const out = []; const re = /data-hb-dig="([^"]+)"[^>]*><title>([^<]*)<\/title/g; let m;
  const un = s => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
  while ((m = re.exec(html))) out.push({ key: un(m[1]), title: un(m[2]) });
  return out;
}
const lastCount = t => { const m = /(\d[\d,\s ]*)\s*$/.exec(t.split('·').pop()); return m ? Number(m[1].replace(/[^\d]/g, '')) : null; };

describe('F496 (A) — one cleaner decides what a recipe is', () => {
  test('every part is kept when it is good, dropped when it is not', () => {
    const w = world();
    const good = { pic: 'heat', split: { by: 'date', unit: 'q', date: 'signed' }, split2: { by: 'folder' }, measure: 'value', trend: false,
      sort: { by: 'name', dir: 'up' }, top: 7, window: { last: 6, unit: 'm', date: 'signed' }, compare: 'prev', title: 'Juno  by quarter', which: { q: 'Juno contracts' } };
    assert.deepEqual(J(w.hbCardClean(good)), Object.assign({}, good, { title: 'Juno by quarter' }));
    assert.deepEqual(J(w.hbCardClean({ pic: 'pie3d', split: { by: 'galaxy' }, top: 99, window: { last: 999, unit: 'm' }, compare: 'often', sort: { by: 'luck' }, title: '   ' })), {});
    assert.deepEqual(J(w.hbCardClean({ split: { by: 'folder' }, split2: { by: 'folder' } })), { split: { by: 'folder' } }, 'the same split twice is one split');
    assert.deepEqual(J(w.hbCardClean({ window: { from: '2026-05-01', to: '2026-01-01' } })), {}, 'a period that ends before it starts is no period');
    assert.deepEqual(J(w.hbCardClean({ title: '<b>Big</b> one' })).title, 'b Big /b one', 'a name never carries markup');
    assert.deepEqual(J(w.hbCardClean({ which: { ids: ['MK-1', 7, '', 'MK-2'] } })), { which: { ids: ['MK-1', 'MK-2'] } });
  });
  test('a stored board is read through the same cleaner, never rewritten', () => {
    const w = world();
    const stored = { 'q:old one': { pic: 'ring', split: { by: 'status' }, which: 'all' }, 'q:new one': { pic: 'stack', split: { by: 'folder' }, split2: { by: 'status' }, top: 3, junk: 1 } };
    const before = JSON.stringify(stored);
    const R = J(w.hbRecipeClean(stored));
    assert.deepEqual(R['q:old one'], { pic: 'ring', split: { by: 'status' }, which: 'all' }, 'yesterday\'s recipe draws as it did');
    assert.deepEqual(R['q:new one'], { pic: 'stack', split: { by: 'folder' }, split2: { by: 'status' }, top: 3 });
    assert.equal(JSON.stringify(stored), before, 'what was stored is not touched');
    const src = read('js/views/homeboard.js');
    const i = src.indexOf('function hbRecipeClean('), body = src.slice(i, src.indexOf('\n}\n', i));
    assert.match(body, /hbCardClean\(o\)/, 'the stored board is read through the one cleaner');
  });
});

describe('F496 (B) — the one planner makes a recipe drawable and says what it could not draw', () => {
  test('two splits: time runs across, a stack by default, averages side by side', () => {
    const w = world();
    let { P } = card(w, { split: { by: 'folder' }, split2: { by: 'date', unit: 'm', date: 'signed' } });
    assert.equal(P.split.by, 'date', 'time runs across'); assert.equal(P.split2.by, 'folder'); assert.equal(P.pic, 'stack');
    ({ P } = card(w, { split: { by: 'folder' }, split2: { by: 'status' }, measure: 'daysToSign', pic: 'stack' }));
    assert.equal(P.pic, 'grouped', 'averages are never added up');
    ({ P } = card(w, { split: { by: 'valueBand' }, split2: { by: 'status' } }));
    assert.equal(P.split2, null); assert.deepEqual(J(P.dropped), ['split2'], 'what it could not draw is said');
    ({ P } = card(w, { pic: 'heat', split: { by: 'folder' } }));
    assert.equal(P.pic, 'bars', 'a two-split picture with one split draws the one');
  });
  test('a comparison draws columns over time or bars, over a period it names', () => {
    const w = world();
    let { P } = card(w, { split: { by: 'counterparty' }, pic: 'ring', compare: 'prev' });
    assert.equal(P.pic, 'bars'); assert.deepEqual(J(P.window), { last: 12, unit: 'm', date: 'created' }); assert.equal(P.winSaid, true);
    ({ P } = card(w, { split: { by: 'date', unit: 'm', date: 'signed' }, compare: 'year', window: { last: 6, unit: 'm' } }));
    assert.equal(P.pic, 'cols'); assert.equal(P.window.date, 'signed', 'the period reads the split\'s own date');
    ({ P } = card(w, { pic: 'gantt', compare: 'prev' }));
    assert.equal(P.compare, null); assert.deepEqual(J(P.dropped), ['compare']);
  });
  test('the order and the top N belong to a split by a group', () => {
    const w = world();
    let { P } = card(w, { split: { by: 'date', unit: 'm', date: 'signed' }, top: 5, sort: { by: 'name', dir: 'up' } });
    assert.equal(P.top, null); assert.deepEqual(J(P.dropped).sort(), ['sort', 'top']);
    ({ P } = card(w, { split: { by: 'date', unit: 'm', date: 'signed' }, split2: { by: 'counterparty' }, top: 3 }));
    assert.equal(P.top, 3); assert.equal(P.groupDim, 'split2', 'under time the top N counts the colours');
  });
});

describe('F496 (C) — one writer', () => {
  test('a press, the free reader and Copilot all write through hbCardSet; a kept card keeps its copy', () => {
    const w = world(); const s = w.hbS();
    s.panels = [{ id: 'p1', kind: 'view', key: 'q:contracts by stream', title: 'Mine', recipe: { pic: 'ring', split: { by: 'folder' } }, split: false, big: false }];
    w.hbRecipeSet('q:contracts by stream', 'order', 'top:3');
    assert.equal(s.recipe['q:contracts by stream'].top, 3);
    assert.equal(s.panels[0].recipe.top, 3, 'the kept card follows');
    const src = read('js/views/homeboard.js').replace(/\/\*[\s\S]*?\*\//g, '');
    const writes = (src.match(/s\.recipe\[[^\]]+\]\s*=(?!=)/g) || []);
    assert.equal(writes.length, 1, 'one place writes a card\'s recipe: ' + writes.join(' | '));
    const i = src.indexOf('function hbRecipeSet('); assert.match(src.slice(i, i + 200), /hbCardSet\(key/);
    const e = src.indexOf('function hbCardEdit('); assert.match(src.slice(e, src.indexOf('\n}\n', e)), /hbCardSet\(key, parts\)/, 'a sentence and Copilot\'s answer go through it too');
  });
});

describe('F496 (D) — every new picture\'s numbers are doors onto their own contracts', () => {
  const check = (w, html, min) => {
    const ds = doors(html).filter(d => /^(q2|qm|qg|qr):/.test(d.key) && lastCount(d.title) != null);
    assert.ok(ds.length >= min, 'enough doors: ' + ds.length);
    ds.forEach(d => { const D = w.hbDigData(d.key, 'all'); assert.ok(D, 'the door opens: ' + d.key); assert.equal(D.n, lastCount(d.title), d.title + ' → ' + d.key); });
    return ds;
  };
  test('stacked and side-by-side columns', () => {
    const w = world();
    for (const pic of ['stack', 'grouped']){
      const { D, P, cs } = card(w, { split: { by: 'date', unit: 'q', date: 'signed' }, split2: { by: 'counterparty' }, pic });
      const { R } = w.hbChartRun(D, cs, P);
      const ds = check(w, R.body, 6);
      assert.ok(ds.some(d => /~\d+[vn]$/.test(d.key)), 'the colours past the cap are one door too');
      assert.equal(R.unsigned, 3, 'the not-signed are said, not drawn');
    }
  });
  test('the heat grid', () => {
    const w = world();
    const { D, P, cs } = card(w, { split: { by: 'folder' }, split2: { by: 'counterparty' }, pic: 'heat' });
    const { R } = w.hbChartRun(D, cs, P);
    check(w, R.body, 6);
    assert.match(R.body, /class="hb-sv-heat"/);
  });
  test('a comparison: this period and the one before, each bar a door', () => {
    const w = world();
    const { D, P, cs } = card(w, { split: { by: 'counterparty' }, compare: 'prev', window: { last: 6, unit: 'm', date: 'signed' } });
    const { R } = w.hbChartRun(D, cs, P);
    const ds = check(w, R.body, 3);
    assert.ok(ds.some(d => /§w§prev§/.test(d.key)), 'the period before has its own doors');
  });
  test('a dig under a card counts within its period', () => {
    const w = world();
    const { key, D, P, cs } = card(w, { split: { by: 'folder' }, window: { last: 6, unit: 'm', date: 'signed' } });
    const { cs: inWin } = w.hbChartRun(D, cs, P);
    const sub = w.hbDigData('qg:' + key + '§folder§Procurement', 'all');
    assert.equal(sub.n, inWin.filter(c => c.folder === 'proc').length);
  });
});

describe('F496 (E) — a top N says the rest, behind one door', () => {
  test('bars: the top 3, and the rest one bar that opens them', () => {
    const w = world();
    const { D, P, cs } = card(w, { split: { by: 'counterparty' }, pic: 'bars', top: 3, sort: { by: 'count', dir: 'down' } });
    const R = w.hbGroupBars(D, cs, P);
    assert.equal(R.rows.length, 4, 'three and the rest');
    assert.equal(R.rows[0].label, 'Juno AB', 'most contracts first');
    const rest = R.rows[3]; assert.match(rest.dig, /^qr:/);
    assert.equal(w.hbDigData(rest.dig, 'all').n, rest.n, 'the rest\'s number is the list behind it');
    const r = w.hbReadingOf(D, cs, P, R);
    assert.ok(r.lines.some(l => /Only the top 3 are drawn/.test(l) && /data-hb-dig="qr:/.test(l)), 'the reading says it, with the door');
  });
  test('a list keeps its top N and says how many more', () => {
    const w = world();
    const { D } = card(w, { pic: 'list', sort: { by: 'value', dir: 'down' }, top: 5 }, 'Juno contracts');
    const html = w.hbDigBodyHtml(D, 'all', false);
    assert.match(html, /Top 5 shown; \d+ more are in the list behind them\./);
  });
});

describe('F496 (F) — a period counts only its contracts, and says so', () => {
  test('the last 6 months by signing date', () => {
    const w = world();
    const { D, P, cs } = card(w, { split: { by: 'folder' }, window: { last: 6, unit: 'm', date: 'signed' } });
    const { R, cs: inWin } = w.hbChartRun(D, cs, P);
    const from = w.hbBucketStart(w.hbBucketMove(w.hbBucketOf(w.hbToday(), 'm'), 'm', -5), 'm');
    assert.ok(inWin.length > 0 && inWin.every(c => c.signedAt.slice(0, 10) >= from));
    assert.match(R.note, new RegExp('Last 6 months by signed: ' + inWin.length + ' of ' + cs.length + ' contracts\\.'));
    assert.match(R.note, /with no signed on record are left out/);
  });
  test('this year is the year we are in', () => {
    const w = world();
    const Z = w.hbWinOf({ window: { last: 1, unit: 'y', date: 'end' } });
    const y = new Date().getFullYear();
    assert.deepEqual([Z.from, Z.to], [y + '-01-01', y + '-12-31']);
  });
});

describe('F496 (G) — a comparison is said in words', () => {
  test('this period against the one before, and the same months a year earlier', () => {
    const w = world();
    let { D, P, cs } = card(w, { split: { by: 'date', unit: 'm', date: 'signed' }, compare: 'prev', window: { last: 6, unit: 'm' } });
    let { R } = w.hbChartRun(D, cs, P);
    assert.match(R.lead.replace(/<[^>]+>/g, ''), /^Last 6 months: \d+ contracts · The period before: \d+ contracts · (up|down) \d+%|no change|new/);
    const r = w.hbReadingOf(D, w.hbChartRun(D, cs, P).cs, P, R);
    assert.ok(r.lines[0].includes('the period before'), r.lines[0]);
    ({ D, P, cs } = card(w, { split: { by: 'date', unit: 'q', date: 'signed' }, compare: 'year', window: { last: 2, unit: 'q' } }));
    const Z = w.hbWinOf(P);
    assert.equal(Number(Z.prev.from.slice(0, 4)), Number(Z.from.slice(0, 4)) - 1, 'a year earlier');
    /* a period still running is held against the same stretch, and says so */
    ({ D, P, cs } = card(w, { split: { by: 'date', unit: 'm', date: 'signed' }, compare: 'year', window: { last: 1, unit: 'y' } }));
    const Y = w.hbWinOf(P), today = w.hbToday();
    assert.equal(Y.to, today); assert.equal(Y.prev.to, (Number(today.slice(0, 4)) - 1) + today.slice(4), 'last year up to the same day');
    assert.match(w.hbChartRun(D, cs, P).R.lead.replace(/<[^>]+>/g, ''), /^This year so far: /);
  });
});

describe('F496 (H) — the free reader reads the new parts from plain words, at no cost', () => {
  const BOOK = [
    ['contracts signed by month and by stream', R => R.split.by === 'date' && R.split.unit === 'm' && R.split.date === 'signed' && R.split2.by === 'folder' && !R.left],
    ['contracts by stream and stage as a stacked chart', R => R.split.by === 'folder' && R.split2.by === 'status' && R.pic === 'stack' && !R.left],
    ['heat map of contracts by stream and stage', R => R.pic === 'heat' && R.split.by === 'folder' && R.split2.by === 'status' && !R.left],
    ['top 5 counterparties by value', R => R.split.by === 'counterparty' && R.top === 5 && R.measure === 'value' && R.sort.dir === 'down' && !R.left],
    ['the 3 smallest streams', R => R.split.by === 'folder' && R.top === 3 && R.sort.dir === 'up'],
    ['value signed in the last 12 months by stream', R => R.window.last === 12 && R.window.unit === 'm' && R.window.date === 'signed' && R.split.by === 'folder' && R.measure === 'value' && !R.left],
    ['contracts signed this year by month compared to last year', R => R.window.last === 1 && R.window.unit === 'y' && R.compare === 'year' && R.split.date === 'signed' && !R.trend],
    ['value by stream this quarter against the previous quarter', R => R.window.unit === 'q' && R.compare === 'prev' && R.measure === 'value'],
    ['contracts by counterparty alphabetically', R => R.split.by === 'counterparty' && R.sort.by === 'name'],
    ['renewals by month called Renewals watch', R => R.title === 'Renewals watch' && R.split.by === 'date'],
  ];
  for (const [q, ok] of BOOK) test(JSON.stringify(q), () => {
    const w = world(); const R = w.hbRecipeRead(q);
    assert.ok(R && ok(R), JSON.stringify(R));
  });
  test('the words that were not about a period stay the map\'s ("ending in the next 6 months", "make this monthly")', () => {
    const w = world();
    const R = w.hbRecipeRead('contracts ending in the next 6 months by month');
    assert.ok(R && !R.window, 'an ending window stays a set, as it was');
    assert.equal(w.hbRecipeRead('make this monthly').window, undefined);
  });
  test('a question with new parts draws its card free', () => {
    const w = world();
    const r = w.hbParse('top 5 counterparties by value');
    assert.deepEqual(J(r), { act: 'dig', key: 'q:top 5 counterparties by value' });
    const D = w.hbDigData(r.key, 'all'), P = w.hbPlan(D);
    assert.equal(P.top, 5); assert.equal(P.split.by, 'counterparty'); assert.equal(P.measure, 'value');
  });
});

describe('F496 (I) — the dropdown row edits the card it stands on', () => {
  test('the row carries its card\'s key; the new parts are on it; a dead option says why', () => {
    const w = world();
    const { D, P } = card(w, { split: { by: 'folder' } });
    const html = w.hbRecipeRowHtml(D, P);
    assert.match(html, /data-hb-rkey="q:contracts by stream"/);
    ['split2', 'order', 'window', 'compare'].forEach(p => assert.match(html, new RegExp('data-hb-rc="' + p + '"')));
    const pics = w.hbRcOptions('pic', P, D);
    const heat = pics.find(o => o.v === 'heat'); assert.equal(heat.on, false); assert.match(heat.why, /second split/);
    const P2 = w.hbPlan(card(w, { split: { by: 'date', unit: 'm', date: 'signed' } }).D);
    assert.ok(w.hbRcOptions('order', P2, D).filter(o => /^sort:/.test(o.v)).every(o => !o.on && /group/.test(o.why)), 'an order on time alone is grey, with its reason');
  });
  test('a press on a panel\'s row changes that panel, not the open card', () => {
    const src = read('js/views/homeboard.js');
    assert.match(src, /const rkey = x => \{ const row = x\.closest\('\[data-hb-rkey\]'\)/);
    assert.match(src, /_hbRcOpen === D\.key \+ '\|' \+ part/, 'a menu opens on one card only');
  });
});
