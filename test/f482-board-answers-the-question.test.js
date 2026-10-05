/* F482 — THE BOARD ANSWERS THE QUESTION ASKED
 * (Young, 4 Oct 2026, over a screenshot of "All contracts · value by month
 * signed · trend": "Value: SEK -367.66 → SEK 851.41 over 24 months · rising",
 * "29 contracts · SEK 6K", and Copilot in the panel answering "why does the
 * dashboard say 851 SEK when we have over 1 billion sek under management"
 * with "Nothing changed on the map … likely points to a single contract's
 * value or a filtered subset" → "fix the stage bug then review this bug where
 * dashboards are still not working well as far as the relationship between
 * prompting and the output. Review this as a whole and fix it.")
 *
 *   (A) the stage bug: "has the most" names the LARGEST group, not the first;
 *   (B) signed is the stage, not the date: an executed contract with no
 *       signing date is in the "No date" column, never "not signed yet"; what
 *       is left off is said with its money;
 *   (C) a trend line needs history and is said as a line: never below zero,
 *       never through one busy month, its ends "about", per month;
 *   (D) the reader reads money questions and everyday words ("how much",
 *       "total", "did we sign", "average", "under management");
 *   (E) a split the board picks itself must split; "my contracts" is not an
 *       attention question; a ring by owner says "by owner";
 *   (F) Copilot is shown the board: what it counts, the open card, its
 *       headline, columns, trend sentence (not totals) and what is left off;
 *       the server puts it in the prompt; a value label reads "over 1M".
 *
 * Measured as drawn: test/chromium/board-answers-the-question-verify.js. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { buildWorld } = require('./world');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const pad = n => String(n).padStart(2, '0');
const mon = (off, d = 15) => { const t = new Date(); const x = new Date(t.getFullYear(), t.getMonth() + off, d); return x.getFullYear() + '-' + pad(x.getMonth() + 1) + '-' + pad(x.getDate()); };
const text = h => String(h).replace(/<svg[\s\S]*?<\/svg>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').replace(/ ([,.)])/g, '$1').trim();

/* the owner's book in small: the money sits in drafts; few signings carry a
   date, and those are small */
function book(signedDates){
  const cs = []; let i = 0;
  const add = o => cs.push(Object.assign({ id: 'MK-' + (100 + i), name: 'A ' + i, counterparty: ['Juno AB', 'Baltic Oy', 'Nordkraft AB'][i % 3], status: 'Draft', value: 1000,
    expiry: mon(20), folder: i % 2 ? 'proc' : 'sales', audit: [], metadata: {}, _raisedAt: mon(-40) }, o, { id: 'MK-' + (100 + i++) }));
  for (let k = 0; k < 10; k++) add({ status: 'Draft', value: 50e6 });
  for (let k = 0; k < 4; k++) add({ status: 'Under Review', value: 5e6 });
  (signedDates || [mon(-2, 3), mon(-2, 5), mon(-2, 7), mon(-2, 9), mon(-2, 11), mon(-2, 13)]).forEach(d => add({ status: 'Signed', value: 300, signedAt: d, folder: 'proc' }));
  for (let k = 0; k < 3; k++) add({ status: 'Signed', value: 2e6, signedAt: null, folder: 'proc' });
  return cs;
}
function world(cs){
  const w = buildWorld({ intelView: true }).win;
  w.state = { contracts: cs || book(), settings: {}, view: 'dashboard' };
  w.FOLDERS = { proc: { id: 'proc', name: 'Procurement' }, sales: { id: 'sales', name: 'Sales' } };
  w.cKind = () => 'Contract';
  w.getContract = id => w.state.contracts.find(c => c.id === id) || null;
  w.payDays = () => null; w.paySide = () => null; w.contractExpired = () => false;
  w.contractOwnerName = c => (c.owner && c.owner.name) || 'Amina';
  w.currentUser = () => ({ id: 'u1', name: 'Amina', role: 'legal' });
  w.eval(read('js/views/homeboard.js'));
  w.eval('intel.lenses=[]; intel.groups=null; intel.groupBy="folder"; intel.history=[];');
  w.hbPaintBoard = () => {};
  const s = w.hbS(); s.recipe = {}; s.path = []; s.panels = []; s.digBig = false; s.face = 'board';
  return w;
}
const card = (w, q) => { const D = w.hbDigData('q:' + q, 'all'); assert.ok(D, 'a card for ' + q); const cs = w.hbListOf(D.ids, 'all'), P = w.hbPlan(D); return { D, cs, P }; };

describe('F482 (A) — "has the most" is the largest', () => {
  test('a chart split by stage names the stage holding the most, not the first stage', () => {
    /* stage order is Draft, In Review, Executed; here Executed is the largest */
    const w = world(book().filter(c => c.status !== 'Draft' || c.id === 'MK-100'));
    const { D, cs, P } = card(w, 'contracts by stage');
    assert.equal(P.split.by, 'status');
    const r = w.hbReadingOf(D, cs, P, null);
    assert.match(text(r.lines.join(' ')), /Signed has the most: 9 contracts \(64%\)\./);
  });
});

describe('F482 (B) — signed is the stage, not the date', () => {
  test('the undated executed contracts stand in "No date"; only the not-yet-signed are left off, with their money', () => {
    const w = world();
    const { D, cs, P } = card(w, 'show contract value over time');
    const R = w.hbColsSvg(D, cs, P);
    assert.equal(R.none, 3, 'three executed contracts have no signing date');
    assert.equal(R.unsigned, 14, 'the drafts and the ones in review');
    assert.match(text(R.lead), /^9 contracts · KES 6M$/);
    assert.match(R.note, /14 contracts not signed yet \(KES 520M\) are not drawn\./);
    const t = text(w.hbReadingOf(D, cs, P, R).lines.join(' '));
    assert.match(t, /9 of the 23 contracts here have been signed\./);
    assert.match(t, /3 signed contracts have no signing date on record, so they stand apart on the right\./);
    assert.match(t, /14 contracts are not signed yet \(KES 520M\), so they are not on this chart\./);
    assert.doesNotMatch(t, /\b17 contracts are not signed\b/);
  });
});

describe('F482 (C) — a trend line needs history, and is said as a line', () => {
  test('one busy month after nothing is not a trend: no line, the reason in words', () => {
    const w = world();
    const { D, cs, P } = card(w, 'show contract value over time');
    assert.ok(P.trend, 'the question asked for a trend');
    const R = w.hbColsSvg(D, cs, P);
    assert.equal(R.trend, null); assert.doesNotMatch(R.body, /hb-sv-trend/);
    assert.match(R.note, /Not enough history yet for a trend\. It needs 6 months that hold contracts; there are 1\./);
  });
  test('a falling line stops at zero, and its ends are "about", per month, never a total', () => {
    const dates = []; for (let i = 0; i < 12; i++) for (let k = 0; k < Math.max(0, 12 - 2 * i); k++) dates.push(mon(i - 12, 3 + k));
    const w = world(book(dates));
    const { D, cs, P } = card(w, 'trend of contracts signed by month');
    const R = w.hbColsSvg(D, cs, P);
    assert.ok(R.trend, 'enough history for a line');
    assert.ok(R.trend.y0 >= 0 && R.trend.y1 >= 0, 'never below zero: ' + JSON.stringify(R.trend));
    assert.doesNotMatch(R.body, />[^<]*-\d/, 'no negative number drawn');
    assert.match(R.say, /^Trend line, count per month: about \d+ → about \d+ over \d+ months · falling$/);
    assert.match(R.body, />≈ \d+</, 'the line\'s ends are marked as approximate');
  });
  test('a line\'s end in money is rounded, not printed to the cent', () => {
    const w = world();
    assert.doesNotMatch(w.hbTrendFmt('value', 851.41), /\.41/);
    assert.match(w.hbTrendFmt('value', 851.41), /851/);
  });
});

describe('F482 (D) — everyday words and money questions', () => {
  const ASK = [
    ['how much value did we sign each month', 'cols', 'value', { by: 'date', unit: 'm', date: 'signed' }],
    ['average days to sign by month', 'cols', 'daysToSign', { by: 'date', unit: 'm', date: 'signed' }],
    ['how long does signing take', 'cols', 'daysToSign', { by: 'date', unit: 'm', date: 'signed' }],
    ['total value signed by month', 'cols', 'value', { by: 'date', unit: 'm', date: 'signed' }],
    ['value of contracts in review', 'blocks', 'value', null],
    ['how much is signed', 'blocks', 'value', null],
    ['total value under management', 'blocks', 'value', null],
  ];
  for (const [q, pic, measure, split] of ASK) test(JSON.stringify(q), () => {
    const w = world();
    assert.deepEqual({ ...(w.hbParse(q) || {}) }, { act: 'dig', key: 'q:' + q }, 'HaTi reads it free, as a card');
    const { P } = card(w, q);
    assert.equal(P.pic, pic); assert.equal(P.measure, measure);
    if (split) assert.deepEqual({ ...P.split }, split);
  });
  test('a question about money is answered in the panel with the money', () => {
    const w = world();
    const said = text(w.hbAsk('how much is signed'));
    assert.match(said, /: 9 contracts, KES 6M, on the board\./);
  });
  test('"high value contracts" is not a money chart: it keeps its road', () => {
    const w = world();
    assert.equal(w.hbRecipeRead('high value contracts'), null);
  });
});

describe('F482 (E) — the split the board picks splits; the right picture for "my contracts"; the right caption', () => {
  test('"how much is signed" is not one ring slice of "Executed 100%"', () => {
    const w = world();
    const { P } = card(w, 'how much is signed');
    assert.notEqual(P.split.by, 'status');
    assert.equal(P.split.by, 'counterparty', 'the first split that divides them');
  });
  test('a split the question names is drawn as asked, one group or not', () => {
    const w = world();
    assert.equal(card(w, 'contracts by type').P.split.by, 'kind');
  });
  test('"my contracts" is a ring by stage; "nobody owns" stays the attention picture', () => {
    const w = world();
    w.contractOwnedBy = () => true;
    const mine = w.hbDigData('q:my contracts', 'all');
    if (mine) assert.notEqual(w.hbPlan(mine).pic, 'bubbles');
    const src = read('js/views/homeboard.js');
    assert.match(src, /x\.field !== 'owner' \|\| x\.label === 'nobody owns'/);
  });
  test('a ring by owner says "by owner"', () => {
    const w = world();
    assert.equal(w.hbGroupWord('owner'), 'by owner');
    assert.equal(w.hbGroupWord('valueBand'), 'by value band');
  });
});

describe('F482 (F) — Copilot is shown the board', () => {
  test('the board in words: Your book, the open card, its headline, its trend sentence as a line, what is left off', () => {
    const w = world();
    const s = w.hbS(); s.path = ['q:show contract value over time'];
    const b = w.hbBoardNow();
    assert.match(b, /Your book \(the six figures at the top\): 23 live contracts; KES 526M value under contract/);
    assert.match(b, /Open card: "All contracts"/);
    assert.match(b, /Headline over the chart: 9 contracts · KES 6M/);
    assert.match(b, /14 contracts not signed yet \(KES 520M\) are not drawn\./);
    assert.match(b, /3 signed contracts have no signing date on record/);
    s.face = 'explorer';
    assert.equal(w.hbBoardNow(), '', 'on the map side the map is the screen');
  });
  test('the trend sentence is described as the ends of a fitted line, not totals', () => {
    const dates = []; for (let i = 0; i < 12; i++) for (let k = 0; k < 2 + (i % 3); k++) dates.push(mon(i - 12, 3 + k));
    const w = world(book(dates));
    const s = w.hbS(); s.path = ['q:show contract value over time'];
    assert.match(w.hbBoardNow(), /Trend sentence: "Trend line, value per month: about .+" — the two ends of a straight line fitted through the columns, per month; they are not totals and not what the book holds\./);
  });
  test('the question carries it: graphAskScreen on the board, and the server puts it in the prompt', () => {
    const w = world();
    w.hbFace = () => 'board';
    const s = w.hbS(); s.path = ['q:show contract value over time'];
    const sc = w.graphAskScreen();
    assert.match(sc.board, /Open card: "All contracts"/);
    const SERVER = read('server/server.js'); const i = SERVER.indexOf('function graphScreenSays(');
    const fn = SERVER.slice(i, SERVER.indexOf('\n}\n', i) + 2);
    const out = vm.runInNewContext(fn + '\ngraphScreenSays(S,A,B);', { S: { board: sc.board }, A: 5, B: 5 });
    assert.match(out, /The reader asked this on the Home BOARD, not on the map\./);
    assert.match(out, /Open card: "All contracts"/);
    assert.match(out, /change nothing on the map/);
    const huge = vm.runInNewContext(fn + '\ngraphScreenSays(S,A,B);', { S: { board: 'y'.repeat(9000) }, A: 5, B: 5 });
    assert.ok(huge.length < 4800, 'the board text is clamped');
  });
  test('asked on the board, "Nothing changed on the map" is not said over the answer, and a count the board does not show is left out', () => {
    const src = read('js/views/intelligence.js');
    assert.match(src, /\(ownHtml&&onBoard\?ownHtml:igEsc\(i18t\('int_did_nothing'\)\)/);
    assert.match(src, /own0=hbProseChecked\(own0\)\.text/); /* the honest reply (f511): hbWhyCheck runs inside hbProseChecked */
  });
  test('a question about the screen goes to Copilot with the board, never read as a new chart', () => {
    const w = world();
    for (const q of ['why does the dashboard say 851 SEK when we have over 1 billion under management', 'explain the trend line by month', 'what does this chart mean'])
      assert.equal(w.hbAsk(q), null, q);
  });
  test('a value label reads "over 1M", not "over 1million"', () => {
    const w = world();
    const cq = w.igConditions('contracts over 1 million');
    assert.equal(cq[0].label, 'over 1M');
  });
});

describe('F482 (G) — an axis never says one number twice', () => {
  const axis = body => [...String(body).matchAll(/<text x="\d+(?:\.\d+)?" y="[\d.]+" text-anchor="end" font-size="12" class="hb-sv-mute">([^<]*)<\/text>/g)].map(m => m[1]);
  test('one or two contracts a month: the scale reads 0, 1, 2, 3, 4 — never "2, 1, 1, 0, 0"', () => {
    const dates = []; for (let i = 0; i < 6; i++) for (let k = 0; k < 1 + (i % 2); k++) dates.push(mon(i - 7, 3 + k));
    /* the tallest column is 2: the undated executed ones are left out here */
    const w = world(book(dates).filter(c => c.status !== 'Signed' || c.signedAt));
    const { D, cs, P } = card(w, 'signed contracts by month');
    const labels = axis(w.hbColsSvg(D, cs, P).body);
    assert.equal(labels.length, 5, JSON.stringify(labels));
    assert.equal(new Set(labels).size, 5, 'every label differs: ' + JSON.stringify(labels));
    assert.deepEqual(labels, ['0', '1', '2', '3', '4']);
  });
  test('the same rule holds for live contracts each month', () => {
    const w = world();
    w.hbSnapsSet([0, 1, 2, 3, 4, 5].map(i => ({ month: mon(i - 6).slice(0, 7), live: 1 + (i % 2) })));
    const D = w.hbDigData('q:How many live contracts did we have each month?', 'all');
    const labels = axis(w.hbLiveSvg(D, w.hbPlan(D)).body);
    assert.equal(new Set(labels).size, labels.length, JSON.stringify(labels));
  });
  test('money keeps its own steps', () => {
    const w = world();
    assert.equal(w.hbAxisTop(8300, false), 10000);
    assert.equal(w.hbAxisTop(2.24, true), 4);
  });
});
