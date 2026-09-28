/* ============================================================
   f432 — THE EXPOSURE TAB IS THE PATTERN GRID (owner-picked by name, 28 Sep 2026)
   ============================================================
   The owner chose "Pattern Grid" off the Insights design-options page and
   said build: the five exposures set against the company's own groupings —
   category, value stream or owner — counts in squares, a press on a square
   listing its contracts beside the grid with a door into Contracts.

   WHAT THIS PINS IS WHAT MAY NOT MOVE UNDER THE NEW DRAWING, as much as the
   drawing itself: the owner's standing rule for this page — "five readings
   over metadata, NO SCORE, rows ranked, a zero row stands down, one ruby lead
   bar" — money obeying canViewValues and fxMissing, and a stream the reader
   cannot open never named.

   Against the parent every section that asks for the grid is red (there is
   no exposureGridData, no square, no switch); the claims written as [wall]
   pass on both sides by design and say so. */
const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world.js');

const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const INTEL = R('js/views/intelligence.js');
const CORE = R('js/core.js');
const HTML = R('index.html');
const I18N = R('js/i18n.js');
const code = s => s.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1 ');
const INTEL_C = code(INTEL);
const has = (w, k) => typeof w[k] === 'function';

/* A contract: id, KES value, category, stream, owner, the exposures it
   carries, whether Copilot has read it. */
const C = (id, value, cat, folder, owner, marks, read, extra) => {
  const m = marks || [];
  return Object.assign({
    id, name: 'Paper ' + id, counterparty: 'Co ' + id, status: 'Executed', value, folder,
    owner: owner ? { name: owner } : undefined,
    metadata: {
      currency: 'KES', category: cat || undefined,
      liabilityCapped: m.includes('liab') ? 'uncapped' : 'capped',
      priceReview: m.includes('price') ? 'open' : 'nochange',
      indemnityCapped: m.includes('indem') ? 'uncapped' : 'capped',
      renewalType: m.includes('auto') ? 'auto-renew' : 'fixed', noticePeriodDays: m.includes('auto') ? 14 : 90,
      exclusivity: m.includes('lock') ? 'exclusive' : 'none', terminateForConvenience: m.includes('lock') ? 'no' : 'yes',
    },
    obligations: [], audit: [], comments: [], signatures: [], fields: {},
  }, read ? { scan: { at: 'x' } } : {}, extra || {});
};
/* Twelve contracts over two categories, three streams and three owners, with
   one exposure (lock-in) that NOTHING carries — the zero row. */
const BOOK = () => [
  C('S1', 900, 'supplier', 'proc', 'Grace', ['price', 'liab'], true),
  C('S2', 700, 'supplier', 'proc', 'Grace', ['price'], true),
  C('S3', 500, 'supplier', 'mfg', 'Peter', ['price', 'indem'], false),
  C('S4', 300, 'supplier', 'mfg', 'Peter', ['liab'], true),
  C('S5', 100, 'supplier', 'sales', 'Brian', [], true),
  C('K1', 800, 'customer', 'sales', 'Brian', ['price'], true),
  C('K2', 600, 'customer', 'sales', 'Brian', ['auto'], false),
  C('K3', 400, 'customer', 'proc', 'Grace', ['indem', 'auto'], true),
  C('K4', 200, 'customer', 'mfg', 'Peter', [], false),
  C('N1', 50, '', 'proc', null, ['price'], true),
  C('D1', 999, 'supplier', 'proc', 'Grace', ['price'], true, { status: 'Declined' }),
  C('A1', 999, 'supplier', 'proc', 'Grace', ['price'], true, { archived: { at: 'x' } }),
];

function world(cs, opts) {
  const o = opts || {};
  const w = buildWorld({ intelView: true, homeView: true, templates: true, metadata: true }).win;
  /* contractOwnerName is js/core.js's, which this stage does not load — the
     REAL body is lifted from the source rather than a stand-in written here,
     so the test asks the product's own reading. */
  const src = CORE.match(/function contractOwnerName\(c\)\{[\s\S]*?\n\}/);
  if (src) w.eval(src[0] + '\nwindow.contractOwnerName=contractOwnerName;');
  w.state = Object.assign(w.state || {}, { contracts: cs });
  if (o.money === false) w.canViewValues = () => false;
  if (o.access) w.userFolderAccess = () => o.access;
  w.__shown = [];
  w.regShowOnly = (ids, label) => { w.__shown.push({ ids: ids.slice().sort(), label }); };
  w.__opened = [];
  w.selectContract = id => { w.__opened.push(id); };
  if (has(w, 'exposureGridSet')) w.exposureGridSet({ by: 'cat', m: 'n', k: null, g: null });
  return w;
}
function mount(w) {
  const host = w.document.createElement('div');
  host.id = 'ig-exp-body';
  w.document.body.appendChild(host);
  host.innerHTML = w.exposureHtml();
  w.exposureWire();
  return host;
}
const rowOf = (G, k) => (G.rows.concat([G.any, G.unread])).find(r => r.k === k);
const cellN = (G, k, key) => rowOf(G, k).cells[key].n;

describe('f432 (1) the grid counts per dimension, off the product\'s own readings', () => {
  test('1a exposureGridData is published and draws off exposureData', () => {
    const w = world(BOOK());
    assert.ok(has(w, 'exposureGridData'), 'there is a grid reading');
    const d = w.exposureData(), G = w.exposureGridData('cat', d);
    assert.deepEqual(G.rows.map(r => r.k), d.rows.map(r => r.k), 'the five in exposureData\'s own ranked order');
    assert.equal(G.lead, d.lead);
    assert.equal(G.live, 10, 'declined and shelved are out');
  });
  test('1b by CATEGORY: the record\'s closed list, labelled by metaOptLabel, the absence last', () => {
    const w = world(BOOK());
    const G = w.exposureGridData('cat');
    assert.deepEqual(G.cols.map(c => c.key), ['c:supplier', 'c:customer', ''], 'biggest first, "no category" last');
    assert.deepEqual(G.cols.map(c => c.n), [5, 4, 1]);
    assert.equal(G.cols[0].label, w.metaOptLabel('supplier'));
    assert.equal(G.cols[2].label, w.i18t('reg_uncategorised'));
    assert.equal(cellN(G, 'price', 'c:supplier'), 3, 'S1 S2 S3');
    assert.equal(cellN(G, 'price', 'c:customer'), 1, 'K1');
    assert.equal(cellN(G, 'price', ''), 1, 'N1');
    assert.equal(cellN(G, 'liability', 'c:supplier'), 2);
    assert.equal(cellN(G, 'indemnity', 'c:customer'), 1);
    assert.equal(cellN(G, 'autorenew', 'c:customer'), 2);
    assert.equal(cellN(G, 'any', 'c:supplier'), 4, 'at least one, each contract ONCE (S1 carries two)');
    assert.equal(cellN(G, 'unread', 'c:customer'), 2, 'K2 K4 — copilotRead\'s own answer');
  });
  test('1c by VALUE STREAM: c.folder named off FOLDERS', () => {
    const w = world(BOOK());
    const G = w.exposureGridData('stream');
    assert.deepEqual(G.cols.map(c => c.key).sort(), ['s:mfg', 's:proc', 's:sales']);
    assert.equal(G.cols.find(c => c.key === 's:proc').label, w.FOLDERS.proc.name);
    assert.equal(cellN(G, 'price', 's:proc'), 3, 'S1 S2 N1');
    assert.equal(cellN(G, 'price', 's:mfg'), 1);
    assert.equal(cellN(G, 'price', 's:sales'), 1);
  });
  test('1d by OWNER: contractOwnerName, and a contract nobody owns is its own group', () => {
    const w = world(BOOK());
    const G = w.exposureGridData('owner');
    assert.deepEqual(G.cols.map(c => c.label), ['Brian', 'Grace', 'Peter', w.i18t('exp_pg_no_owner')]);
    assert.equal(cellN(G, 'price', 'o:Grace'), 2);
    assert.equal(cellN(G, 'price', ''), 1, 'N1 has no owner');
    assert.match(INTEL_C, /contractOwnerName\(c\)/, 'the product\'s own owner reading');
  });
  test('1e the square\'s figures sum back to the row — nothing lost, nothing counted twice', () => {
    const w = world(BOOK());
    for (const by of ['cat', 'stream', 'owner']) {
      const G = w.exposureGridData(by);
      for (const r of G.rows) {
        const sum = G.cols.reduce((a, c) => a + r.cells[c.key].n, 0);
        assert.equal(sum, r.n, by + ' · ' + r.k);
      }
    }
  });
  test('1f the switch redraws the columns and the squares say so', () => {
    const w = world(BOOK());
    const host = mount(w);
    assert.ok(host.querySelector('[data-exp-by="cat"][aria-pressed="true"]'), 'category is the resting grouping');
    host.querySelector('[data-exp-by="owner"]').click();
    const heads = [...host.querySelectorAll('.exp-pg-hd:not(.is-tot)')].map(h => h.firstChild.textContent);
    assert.deepEqual(heads, ['Brian', 'Grace', 'Peter', w.i18t('exp_pg_no_owner')]);
    assert.ok(host.querySelector('[data-exp-by="owner"][aria-pressed="true"]'));
  });
});

describe('f432 (2) a zero row stands down, and there is ONE lead', () => {
  test('2a the zero row draws no square and no door, in the stood-down ink', () => {
    const w = world(BOOK());
    const host = mount(w);
    assert.equal(w.exposureData().rows.find(r => r.k === 'lockin').n, 0, 'the fixture: nothing is locked in');
    assert.equal(host.querySelectorAll('[data-exp-cell="lockin"]').length, 0, 'nothing to press over nothing');
    const rl = host.querySelector('.exp-pg-rl[data-exp-row="lockin"]');
    assert.ok(rl, 'the row is still drawn — "no contract has this" is a fact');
    assert.match(rl.getAttribute('style'), /color:var\(--color-neutral-500\)/);
    assert.ok(host.querySelectorAll('.exp-pg-rl[data-exp-row="price"] ~ button[data-exp-cell="price"]').length > 0,
      '[control] a live row does carry doors');
  });
  test('2b the zero row is ranked last, as the reading ranks it', () => {
    const w = world(BOOK());
    const html = w.exposureHtml();
    const at = k => html.indexOf('data-exp-row="' + k + '"');
    const five = w.exposureData().rows.map(r => r.k);
    five.forEach((k, i) => { if (i) assert.ok(at(five[i - 1]) < at(k), k); });
    assert.equal(five[4], 'lockin');
  });
  test('2c exactly ONE row wears the ruby bar, and it is the lead', () => {
    const w = world(BOOK());
    const host = mount(w);
    const ruby = [...host.querySelectorAll('.exp-pg-rl')].filter(el => /--st-ruby-fg/.test(el.getAttribute('style')));
    assert.equal(ruby.length, 1);
    assert.equal(ruby[0].getAttribute('data-exp-row'), w.exposureData().lead);
    const all = [...host.querySelectorAll('.exp-pg-rl')];
    assert.ok(all.every(el => /border-left:3px solid/.test(el.getAttribute('style'))), 'the bar is reserved on every row');
  });
  test('2d the squares are shaded by the ACCENT ramp — ruby is the lead\'s alone', () => {
    for (const n of [1, 2, 3, 4]) {
      const m = HTML.match(new RegExp('\\n\\s*\\.exp-r' + n + '\\{([^}]*)\\}'));
      assert.ok(m, 'a rule for step ' + n);
      assert.match(m[1], /--color-accent-/);
      assert.ok(!/ruby/.test(m[1]));
    }
  });
});

describe('f432 (3) NO SCORE — the grid adds nothing up across the five', () => {
  test('3a the page carries no score, grade, index or risk level', () => {
    const w = world(BOOK());
    const host = mount(w);
    assert.ok(host.querySelector('.exp-pg-mx'), 'the grid is drawn');
    assert.ok(!/score|rating|grade|risk level|index|out of 100/i.test(host.textContent));
  });
  test('3b [wall] no grid reading combines exposures into one figure per group', () => {
    const a = INTEL_C.indexOf('function exposureGridData');
    assert.ok(a > 0, 'the grid reading exists');
    const fn = INTEL_C.slice(a, INTEL_C.indexOf('function exposureHtml'));
    assert.ok(!/score|rating|grade|weight\s*\*|\/\s*100\b|severity/i.test(fn));
  });
  test('3c a square\'s shade is its own figure: equal counts, equal steps', () => {
    const w = world(BOOK());
    const G = w.exposureGridData('cat');
    const steps = {};
    G.rows.forEach(r => G.cols.forEach(c => { const x = r.cells[c.key]; if (x.n) (steps[x.n] = steps[x.n] || new Set()).add(x.stepN); }));
    Object.values(steps).forEach(s => assert.equal(s.size, 1, 'one count, one step'));
    assert.equal(rowOf(G, 'price').cells['c:supplier'].stepN, w.EXP_PG_STEPS, 'the largest square is the top step');
  });
});

describe('f432 (4) money obeys canViewValues, and a missing rate is left out and counted', () => {
  test('4a a reader without values sees counts only — no KES, no Value switch', () => {
    const w = world(BOOK(), { money: false });
    const G = w.exposureGridData('cat');
    assert.equal(G.money, false);
    assert.equal(rowOf(G, 'price').cells['c:supplier'].value, null);
    const host = mount(w);
    assert.ok(!host.querySelector('[data-exp-m]'), 'the Value switch is not drawn');
    assert.ok(!/KES/.test(host.textContent), 'no money anywhere on the page');
    host.querySelector('[data-exp-cell="price"][data-exp-g="c:supplier"]').click();
    assert.ok(!/KES/.test(w.document.getElementById('ig-exp-body').textContent), 'nor in the list beside it');
    assert.equal(w.exposureCellData(w.exposureGridData('cat'), 'price', 'c:supplier').items[0].value, null);
  });
  test('4b [control] a reader with values sees the Value switch and the money', () => {
    const w = world(BOOK());
    const host = mount(w);
    assert.ok(host.querySelector('[data-exp-m="v"]'));
    assert.match(host.textContent, /KES/);
  });
  test('4c a contract with no rate is counted in the square and LEFT OUT of its money', () => {
    const cs = BOOK(); cs.find(c => c.id === 'S2').metadata.currency = 'JPY';
    const w = world(cs);
    const x = rowOf(w.exposureGridData('cat'), 'price').cells['c:supplier'];
    assert.equal(x.n, 3, 'still counted');
    assert.equal(x.value, 1400, 'S1 900 + S3 500 — never S2 at par');
    assert.equal(x.left, 1, 'and the omission is counted');
  });
  test('4d the Value switch shows the money, and orders the list largest first', () => {
    const w = world(BOOK());
    const host = mount(w);
    host.querySelector('[data-exp-m="v"]').click();
    host.querySelector('[data-exp-cell="price"][data-exp-g="c:supplier"]').click();
    const ids = [...host.querySelectorAll('[data-exp-one]')].map(b => b.getAttribute('data-exp-one'));
    assert.deepEqual(ids, ['S1', 'S2', 'S3']);
  });
});

describe('f432 (5) a square is a door: it lists its contracts, and those open in Contracts', () => {
  test('5a pressing a square lists exactly that square\'s contracts beside the grid', () => {
    const w = world(BOOK());
    const host = mount(w);
    host.querySelector('[data-exp-cell="autorenew"][data-exp-g="c:customer"]').click();
    const ids = [...host.querySelectorAll('[data-exp-one]')].map(b => b.getAttribute('data-exp-one')).sort();
    assert.deepEqual(ids, ['K2', 'K3']);
    assert.ok(host.querySelector('[data-exp-cell="autorenew"][data-exp-g="c:customer"].is-sel'), 'the square says it is picked');
    assert.match(host.querySelector('.exp-pg-lbl').textContent, new RegExp(w.metaOptLabel('customer')));
  });
  test('5b the door under the list hands THOSE ids to regShowOnly, named', () => {
    const w = world(BOOK());
    const host = mount(w);
    host.querySelector('[data-exp-cell="liability"][data-exp-g="c:supplier"]').click();
    host.querySelector('[data-exp-open]').click();
    assert.equal(w.__shown.length, 1);
    assert.deepEqual(w.__shown[0].ids, ['S1', 'S4']);
    assert.match(w.__shown[0].label, /Liability/);
  });
  test('5c a row\'s total picks every group; a name opens its contract', () => {
    const w = world(BOOK());
    const host = mount(w);
    host.querySelector('.exp-pg-tot[data-exp-cell="price"]').click();
    const ids = [...host.querySelectorAll('[data-exp-one]')].map(b => b.getAttribute('data-exp-one')).sort();
    assert.deepEqual(ids, ['K1', 'N1', 'S1', 'S2', 'S3']);
    host.querySelector('[data-exp-one="S1"]').click();
    assert.deepEqual(w.__opened, ['S1']);
  });
  test('5d the headline figures are doors, and a zero is not one', () => {
    const w = world(BOOK());
    const host = mount(w);
    host.querySelector('[data-exp-go="two"]').click();
    assert.deepEqual(w.__shown[0].ids, ['K3', 'S1', 'S3'], 'two or more of the five');
    const w2 = world([C('Z1', 5, 'supplier', 'proc', 'Grace', [], true)]);
    const h2 = mount(w2);
    assert.ok(!h2.querySelector('[data-exp-go="two"]') && !h2.querySelector('[data-exp-cell="any"]'),
      'nothing carrying anything: no door onto nothing');
  });
  test('5e at rest the lead row is picked', () => {
    const w = world(BOOK());
    const host = mount(w);
    assert.equal(host.querySelector('.exp-pg-sel-t').textContent, w.exposureData().rows[0].title);
  });
});

describe('f432 (6) a stream the reader cannot open is never named', () => {
  test('6a it is counted, under an unnamed group, and its name is nowhere on the page', () => {
    const w = world(BOOK(), { access: ['proc', 'mfg'] });
    const G = w.exposureGridData('stream');
    assert.ok(!G.cols.some(c => c.key === 's:sales'));
    const other = G.cols.find(c => c.key === '~');
    assert.ok(other, 'counted, not hidden');
    assert.equal(other.label, w.i18t('exp_pg_other_stream'));
    w.exposureGridSet({ by: 'stream' });
    const html = w.exposureHtml();
    assert.ok(!html.includes(w.FOLDERS.sales.name));
  });
});

describe('f432 (7) the words, and what is published', () => {
  test('7a every exp_pg_ key is in both books', () => {
    const keys = [...new Set(INTEL.match(/exp_pg_[a-z_]+/g) || [])].filter(k => !/_$/.test(k));
    assert.ok(keys.length > 20);
    for (const k of keys) {
      const plain = (I18N.match(new RegExp('\\n\\s*' + k + ':', 'g')) || []).length;
      const plural = (I18N.match(new RegExp('\\n\\s*' + k + '_(one|other):', 'g')) || []).length;
      assert.ok(plain === 2 || plural === 4, k + ' is not in both books');
    }
  });
  test('7b the grid\'s names are published on window', () => {
    const w = world(BOOK());
    for (const k of ['exposureGridData', 'exposureGridPick', 'exposureCellData', 'exposureGridSet'])
      assert.equal(typeof w[k], 'function', k);
  });
  test('7c [wall] the renderer still asks exposureData once and counts nothing', () => {
    const draw = INTEL_C.slice(INTEL_C.indexOf('function exposureHtml'), INTEL_C.indexOf('function exposureWire'));
    assert.equal((draw.match(/exposureData\(\)/g) || []).length, 1);
    assert.ok(!/\.filter\(|\.reduce\(|fxHome\(/.test(draw));
  });
});
