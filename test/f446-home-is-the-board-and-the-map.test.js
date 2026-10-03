/* F446 — HOME IS THE BOARD AND THE MAP (Young ruled 3 Oct 2026).

   Asked over one long sitting against the "HaTi Live Board" artifact: Home
   becomes a one-screen board built by asking, with a Board | Explorer switch
   on the same screen; Your book (six figures and the stage bar) with Prepared
   by Copilot under it, which folds to a line or closes; every number a door
   with a trail; "bring up MK-106" gives the contract card; what moved since
   you last looked, show these on the map, done while you were away, side by
   side, watch a number, give a panel to a colleague with a note and a seen
   tick, Present with a red pointer and a pen; the screen's own Dark | Light,
   landing on Dark, Light "Frosted"; Insights keeps its detailed tabs and
   loses Explorer; the phone stays as it is. "Go ahead and build then merge
   to main."

   WHAT IS PINNED, and each half fails at the parent (js/views/homeboard.js
   does not exist there, Explorer is an Insights tab and the gifts route 404s):
     1. the board's six figures are Home's OWN readings — the ninety days,
        past the end date and the live count equal hmDashSlices' lists;
     2. the lens is paySide's reading, and a lens counts only its own side;
     3. the reader understands English and Swedish without a model, names a
        contract by its reference or its unique name, and refuses to guess;
     4. what moved keeps ONE baseline a day, so a repaint never wipes it;
     5. a watch is a row in the bell only while its line is crossed;
     6. the board is the person's own record and a word this version does
        not know falls back to the fresh board;
     7. the wiring: Home hands its desktop paint to the board, Insights has
        no Explorer tab, the place store and the bell know Home's parts;
     8. the screen's Light is LITERAL (it may not flip with the platform's
        theme) and every token the board's sheet names exists;
     9. every word the board prints is in both books;
    10. the gift route is a RECORD, NOT A PERMISSION: a member id, never an
        address; never yourself; one of six kinds; only the receiver says
        seen or puts it away; only the giver takes it back; no figure kept. */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadViews } = require('./dom');
const { startHati, seedWorkspace } = require('./helpers');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const HB_SRC = read('js/views/homeboard.js');
const HOME = read('js/views/home.js');
const INTEL = read('js/views/intelligence.js');
const APP = read('js/app.js');
const CSS = read('index.html');
const i18n = require('../js/i18n.js');

const day = n => { const d = new Date(); d.setDate(d.getDate() + n);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const book = () => ([
  { id: 'MK-1', name: 'Warehouse Lease', counterparty: 'Siginon', status: 'Signed', value: 10e6, expiry: day(40),
    metadata: { category: 'supplier', paymentTerms: '30 days' }, audit: [] },
  { id: 'MK-2', name: 'Distribution', counterparty: 'Sendy', status: 'Signed', value: 20e6, expiry: day(200),
    metadata: { category: 'customer', paymentTerms: '60 days' }, audit: [] },
  { id: 'MK-3', name: 'Packaging', counterparty: 'Bidco', status: 'Draft', value: 5e6, audit: [] },
  { id: 'MK-4', name: 'Retail', counterparty: 'Naivas', status: 'Under Review', value: 7e6, metadata: { category: 'customer' }, audit: [] },
  { id: 'MK-5', name: 'Closed one', counterparty: 'Tuskys', status: 'Declined', value: 9e6, audit: [] },
  { id: 'MK-6', name: 'Old Fleet', counterparty: 'Coast Motors', status: 'Signed', value: 3e6, expiry: day(-12),
    metadata: { category: 'supplier' }, audit: [] },
]);
const CORE = read('js/core.js');
const contractOwnedBy = (() => {
  const at = CORE.indexOf('function contractOwnedBy(');
  assert.ok(at >= 0, 'contractOwnedBy is in js/core.js');
  return new Function('return (' + CORE.slice(at, CORE.indexOf('\n}', at) + 2) + ')')();
})();
const FILES = ['js/obligations.js', 'js/desknight.js', 'js/views/home.js', 'js/payterms.js', 'js/views/homeboard.js'];
function world({ contracts = book(), today = day(0), stored = null } = {}) {
  const clock = { today };
  const sb = loadViews(FILES, {
    contractOwnedBy, addEventListener() {}, removeEventListener() {},
    contractExpired: c => c.status === 'Signed' && !!c.expiry && c.expiry < day(0),
    todayISO: () => clock.today,
    state: { contracts, settings: {}, view: 'dashboard', serverStats: { total: contracts.length } } });
  if (stored) sb.localStorage.setItem('hati.v1.homeBoard.u_test', stored);
  return { sb, clock };
}

describe('F446 (1) — the six figures are Home\'s own readings', () => {
  test('live, the ninety days and past the end date equal hmDashSlices', () => {
    const { sb } = world();
    const d = sb.hbBookData('all'), S = sb.hmDashSlices();
    assert.deepEqual(d.figs.ending.ids, S.expiring.map(x => x.c.id), 'the ninety days are Home\'s list, in its order');
    assert.deepEqual(d.figs.ending.ids, ['MK-1']);
    assert.deepEqual(d.figs.live.ids.slice().sort(), S.live.map(c => c.id).sort(), 'live is "not Declined", the same list');
    assert.deepEqual(d.figs.past.ids, S.lapsed.map(c => c.id), 'past the end date is the same lapsed list');
    assert.deepEqual(d.figs.past.ids, ['MK-6']);
    assert.equal(d.figs.value.v, 10e6 + 20e6 + 5e6 + 7e6 + 3e6, 'value under contract adds the live contracts only');
  });
  test('money obeys canViewValues: no value is counted for a reader without it', () => {
    const { sb } = world();
    sb.canViewValues = () => false;
    const d = sb.hbBookData('all');
    assert.equal(d.money, false);
    assert.equal(d.figs.value.v, null);
    assert.ok(d.stages.every(s => s.v === null));
  });
  test('an archived contract is off the board', () => {
    const cs = book(); cs[0].archived = true;
    const { sb } = world({ contracts: cs });
    assert.ok(!sb.hbBookData('all').figs.live.ids.includes('MK-1'));
  });
});

describe('F446 (2) — the lens is paySide\'s reading', () => {
  test('suppliers counts only supplier contracts; the unsided are counted, not guessed', () => {
    const { sb } = world();
    const sup = sb.hbBookData('suppliers'), cus = sb.hbBookData('customers');
    assert.deepEqual(sup.figs.live.ids.sort(), ['MK-1', 'MK-6']);
    assert.deepEqual(cus.figs.live.ids.sort(), ['MK-2', 'MK-4']);
    assert.equal(sup.unsided, 2, 'MK-3 and MK-5 say no side and belong to neither lens');
    for (const c of sb.state.contracts) assert.equal(sb.hbSideOf(c), sb.paySide(c), 'one reading: ' + c.id);
  });
});

describe('F446 (3) — the reader, without a model', () => {
  const cases = [
    ['bring up MK-1', { act: 'card', id: 'MK-1' }],
    ['what about mk-4?', { act: 'card', id: 'MK-4' }],
    ['bring up MK-999', { act: 'noref', ref: 'MK-999' }],
    ['bring up Packaging', { act: 'card', id: 'MK-3' }],
    ['show overdue obligations', { act: 'panel', kind: 'obl', lens: null }],
    ['visa förfallna åtaganden', { act: 'panel', kind: 'obl', lens: null }],
    ['payment terms suppliers vs customers', { act: 'split', kind: 'pay' }],
    ['suppliers only', { act: 'lens', lens: 'suppliers' }],
    ['bara kunder', { act: 'lens', lens: 'customers' }],
    ['all contracts', { act: 'lens', lens: 'all' }],
    ['tell me when overdue goes above 3', { act: 'watch', k: 'overdue', dir: 'above', n: 3 }],
    ['alert me if live contracts drops below 5', { act: 'watch', k: 'live', dir: 'below', n: 5 }],
    ['the map', { act: 'face', face: 'explorer' }],
    ['back to the board', { act: 'face', face: 'board' }],
    ['present', { act: 'present' }],
    ['start over', { act: 'reset' }],
    ['remove the risk panel', { act: 'remove', kind: 'exp', lens: null }],
  ];
  for (const [q, want] of cases) test(JSON.stringify(q), () => {
    const { sb } = world();
    assert.deepEqual({ ...sb.hbParse(q) }, want);
  });
  test('two named contracts are Explorer\'s to compare, and a name two contracts share is not a guess', () => {
    const cs = book(); cs.push({ id: 'MK-7', name: 'Packaging Two', counterparty: 'Bidco', status: 'Draft', value: 1, audit: [] });
    const { sb } = world({ contracts: cs });
    assert.equal(sb.hbParse('compare MK-1 and MK-2'), null);
    assert.equal((sb.hbParse('bring up packaging') || {}).id, 'MK-3', 'an exact name wins');
    assert.notEqual((sb.hbParse('bring up pack') || {}).act, 'card', '"pack" is part of two names: no guess');
  });
  test('on the Explorer side the reader steps aside: the map answers as it always did', () => {
    const { sb } = world();
    sb.hbS().face = 'explorer';
    assert.equal(sb.hbAsk('Which contracts renew soon?'), null, 'a question about renewals is the map\'s');
    assert.equal(sb.hbAsk('bring up MK-1'), null, 'so is a contract');
    assert.equal(sb.hbAsk('suppliers only'), null, 'and a lens');
  });
  test('the reader never builds a pattern from the translated words (the house rule)', () => {
    const body = HB_SRC.slice(HB_SRC.indexOf('const HB_RX'), HB_SRC.indexOf('function hbParse'));
    assert.ok(!/new RegExp\([^)]*i18t/.test(HB_SRC), 'no RegExp is made from i18t');
    assert.ok(!/i18t\(/.test(body), 'HB_RX and hbFindContract read no screen words');
  });
});

describe('F446 (4) — what moved keeps one baseline a day', () => {
  test('the first paint of a new day makes yesterday\'s view the baseline; repaints keep it', () => {
    const { sb, clock } = world({ today: '2026-10-01' });
    assert.equal(sb.hbSeenTick(sb.hbBookData('all')), null, 'a first visit has nothing to compare with');
    clock.today = '2026-10-02';
    sb.state.contracts.push({ id: 'MK-8', name: 'New', counterparty: 'X', status: 'Draft', value: 1, audit: [] });
    const base = sb.hbSeenTick(sb.hbBookData('all'));
    assert.equal(base.at, '2026-10-01');
    const again = sb.hbSeenTick(sb.hbBookData('all'));
    assert.equal(again.at, '2026-10-01', 'a repaint the same day keeps the same baseline');
    const M = sb.hbMoved(sb.hbBookData('all'), again);
    assert.equal(M.live.d, 1);
    assert.deepEqual([...M.live.added], ['MK-8'], 'the dig-in names which contract arrived');
  });
  test('a figure that did not move draws nothing', () => {
    const { sb } = world();
    assert.equal(sb.hbDeltaHtml('live', { d: 0, added: [], gone: [] }, day(-1)), '');
  });
});

describe('F446 (5) — a watch is a bell row only while its line is crossed', () => {
  test('above and below, and nothing when the number is on the right side', () => {
    const { sb } = world();
    const s = sb.hbS();
    s.watches = [{ k: 'live', dir: 'above', n: 3 }, { k: 'past', dir: 'above', n: 4 }, { k: 'ending', dir: 'below', n: 2 }];
    const al = sb.hbWatchAlerts();
    assert.deepEqual([...al.map(a => a.k)], ['live', 'ending']);
    assert.ok(al.every(a => typeof a.go === 'function' && a.text), 'every row is a door with words');
  });
  test('the bell knows the kind and asks the board', () => {
    assert.match(APP, /k:'watch'/);
    assert.match(APP, /hbWatchAlerts\(\)\.forEach\(w=>push\('watch'/);
  });
});

describe('F446 (6) — the board is the person\'s own record', () => {
  test('it survives a reload, and what this version does not know falls back', () => {
    const stored = JSON.stringify({ face: 'explorer', lens: 'nonsense', screen: 'light', prep: 'folded',
      panels: [{ id: 'p1', kind: 'obl' }, { id: 'p2', kind: 'bogus' }], watches: [{ k: 'live', dir: 'sideways', n: 1 }] });
    const { sb } = world({ stored });
    const s = sb.hbS();
    assert.equal(s.face, 'explorer');
    assert.equal(s.lens, 'all', 'an unknown lens falls back to the whole book');
    assert.equal(s.screen, 'light');
    assert.equal(s.prep, 'folded');
    assert.deepEqual(s.panels.map(p => p.kind), ['obl'], 'an unknown panel kind is dropped');
    assert.equal(s.watches.length, 0, 'a watch with no direction is dropped');
  });
  test('the screen lands on Dark, the board side, the whole book, Prepared by Copilot open', () => {
    const { sb } = world();
    const s = sb.hbS();
    assert.deepEqual([s.face, s.screen, s.lens, s.prep], ['board', 'dark', 'all', 'open']);
  });
});

describe('F446 (7) — the wiring', () => {
  test('desktop Home hands its paint to the board; the phone keeps its own Home', () => {
    const at = HOME.indexOf('function renderDashboard(');
    const body = HOME.slice(at, at + 1500);
    assert.match(body, /hbRender\(\); *return;/);
    assert.ok(body.indexOf('_phone') < body.indexOf('hbRender'), 'the phone is asked first');
  });
  test('Insights has no Explorer tab; the map lives on Home', () => {
    const m = /const IG_TABS *= *\[([^\]]*)\]/.exec(INTEL);
    assert.ok(m, 'IG_TABS is declared');
    assert.ok(!/'map'/.test(m[1]), 'no map tab on Insights');
    assert.match(INTEL, /hbOpenExplorer/);
  });
  test('app.js loads the board, and the place store keeps Home\'s side and trail', () => {
    assert.match(APP, /import '\.\/views\/homeboard\.js';/);
    assert.match(APP, /dashboard:\['hbPlace','hbPlacePut'\]/);
  });
  test('the side Copilot knows the map is on screen on Home\'s Explorer side, and only there', () => {
    const AI = read('js/ai.js');
    const at = AI.indexOf('function aiInsightsTab(');
    const body = AI.slice(at, AI.indexOf('\n}', at));
    assert.match(body, /state\.view==='dashboard'\) return \(typeof igMapUp==='function' && igMapUp\(\)\) \? AI_INSIGHTS_TABS\.map : null/,
      'on Home: the contract graph while the map shows, nothing on the board side');
    assert.match(AI, /state\.view==='intel'\|\|\(state\.view==='dashboard'&&typeof igMapUp==='function'&&igMapUp\(\)\)/);
  });
  test('one listener, armed once, for every press on the board', () => {
    assert.match(HB_SRC, /!document\._hbWired/);
    assert.equal((HB_SRC.match(/document\.addEventListener\('click'/g) || []).length, 1);
  });
});

describe('F446 (8) — the screen\'s own look', () => {
  const sheet = (() => { const a = CSS.indexOf('HOME IS THE BOARD AND THE MAP'); const b = CSS.indexOf('.hb-presenting{height:100vh}'); return CSS.slice(a, b); })();
  test('Light is literal: it does not borrow a token that flips with the platform\'s theme', () => {
    const m = /#ig-page\.hb-light,#hb-page\.hb-light\{([^}]*)\}/.exec(sheet);
    assert.ok(m, 'the Light block is declared');
    assert.ok(!/var\(--(color|st)-/.test(m[1]), 'no platform colour token inside the Light block');
  });
  test('every token the board\'s sheet names exists (a missing one collapses its whole declaration)', () => {
    const used = new Set((sheet.match(/var\(--[a-z0-9-]+/g) || []).map(v => v.slice(4)));
    const missing = [...used].filter(v => !CSS.includes(v + ':'));
    assert.deepEqual(missing, []);
  });
  test('no !important in the board\'s sheet', () => {
    assert.ok(!/!important/.test(sheet));
  });
});

describe('F446 (9) — every word in both books', () => {
  test('each hb_ key the board prints is in English and Swedish', () => {
    const keys = new Set((HB_SRC.match(/'hb_[a-z0-9_]+'/g) || []).map(k => k.slice(1, -1)));
    const en = i18n.STRINGS ? i18n.STRINGS.en : null;
    const books = en ? i18n.STRINGS : null;
    const has = (lang, k) => books ? (k in books[lang] || (k + '_one') in books[lang]) : true;
    assert.ok(keys.size > 40, 'the board reads its words through i18t');
    const missing = [];
    for (const k of keys) { if (/_$/.test(k)) continue; /* a prefix the code completes */ for (const lang of ['en', 'sv']) if (!has(lang, k)) missing.push(lang + ':' + k); }
    assert.deepEqual(missing, []);
  });
});

describe('F446 (10) — a panel given to a colleague is a record, not a permission', () => {
  let h, w;
  before(async () => {
    h = await startHati(); w = await seedWorkspace(h, { approvalRules: [] });
  });
  after(async () => { if (h) await h.stop(); });
  const refused = async (client, p, opts, status) => {
    const r = await client.raw(p, opts);
    assert.equal(r.status, status, p + ' ' + JSON.stringify(opts && opts.body) + ' → ' + r.status + ' ' + r.text.slice(0, 120));
    return r;
  };
  test('the walls: no address, not yourself, a member, one of six kinds', async () => {
    const to = w.users.unrestricted.id;
    await refused(w.admin, '/api/home/gifts', { method: 'POST', body: { email: 'everything@example.co.ke', kind: 'obl' } }, 400);
    await refused(w.unrestricted, '/api/home/gifts', { method: 'POST', body: { to, kind: 'obl' } }, 400);
    await refused(w.admin, '/api/home/gifts', { method: 'POST', body: { to: 'u_nobody', kind: 'obl' } }, 400);
    await refused(w.admin, '/api/home/gifts', { method: 'POST', body: { to, kind: 'figures' } }, 400);
  });
  test('given, seen by the receiver only, taken back by the giver only — and no figure kept', async () => {
    const to = w.users.unrestricted.id;
    const r = await w.admin.json('/api/home/gifts', { method: 'POST', body: { to, kind: 'pay', split: true, lens: 'suppliers', note: 'Look at this', pid: 'p1', value: 999 } });
    const g = r.gift;
    assert.deepEqual(Object.keys(g).sort(), ['at', 'fromId', 'fromName', 'id', 'kind', 'lens', 'note', 'pid', 'seenAt', 'split', 'toId', 'toName'].sort(), 'the record carries a name, never a figure');
    assert.equal(g.seenAt, null);
    const theirs = await w.unrestricted.json('/api/home/gifts');
    assert.deepEqual(theirs.received.map(x => [x.id, x.kind, x.lens, x.split, x.note]), [[g.id, 'pay', 'suppliers', true, 'Look at this']]);
    const other = await w.restricted.json('/api/home/gifts');
    assert.equal(other.received.length, 0, 'nobody else sees it');
    await refused(w.admin, '/api/home/gifts/' + g.id + '/seen', { method: 'POST', body: {} }, 404);
    await refused(w.restricted, '/api/home/gifts/' + g.id + '/dismiss', { method: 'POST', body: {} }, 404);
    await refused(w.unrestricted, '/api/home/gifts/' + g.id, { method: 'DELETE' }, 404);
    await w.unrestricted.json('/api/home/gifts/' + g.id + '/seen', { method: 'POST', body: {} });
    const mine = await w.admin.json('/api/home/gifts');
    assert.ok(mine.sent.find(x => x.id === g.id).seenAt, 'the giver sees the tick');
    await w.admin.json('/api/home/gifts/' + g.id, { method: 'DELETE' });
    assert.equal((await w.unrestricted.json('/api/home/gifts')).received.length, 0, 'taken back');
  });
});
