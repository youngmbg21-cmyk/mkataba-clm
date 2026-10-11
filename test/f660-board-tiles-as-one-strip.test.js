/* f660 — THE NEW BOARD'S TILES (owner's "Build now", 11 Oct 2026, over the
   "HaTi Board" artifact: Stripe's tiles inside HaTi's own layout)
   (1) a figure's line is drawn ONLY from days this person actually saw on
       Home — one row a day, the last of the day wins, at most HB_HIST_DAYS,
       oldest first; nothing is guessed about a day nobody looked
   (2) below HB_HIST_MIN kept days a tile carries NO line at all; from there
       a line with its own words (from → to, how many days, since when); a
       figure that never moved draws flat through the middle
   (3) the tile reads what it counts, then the number (the label comes first)
   (4) the six figures are ONE STRIP: no gap, thin rules between, and the
       coloured top edge of 3 Oct is retired
   (5) the line's words are in both books
   Run: node --test test/f660-board-tiles-as-one-strip.test.js */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const INDEX = read('index.html');
const I18N = read('js/i18n.js');
/* days counted back from today, so no answer depends on the day the test runs */
const HB_HIST_DAYS = Number((read('js/views/homeboard.js').match(/HB_HIST_DAYS = (\d+)/) || [])[1]);
const ago = n => new Date(Date.now() - n * 864e5).toISOString().slice(0, 10);

function world(){
  const w = buildWorld({ intelView: true }).win;
  w.state = { contracts: [], settings: {}, view: 'dashboard' };
  w.FOLDERS = {};
  w.currentUser = () => ({ id: 'u_f660', name: 'Test User', role: 'legal' });
  w.eval(read('js/views/homeboard.js'));
  return w;
}
const row = (at, live) => ({ at, figs: { live: { n: live }, value: { n: 0 }, ending: { n: 0 }, past: { n: 0 }, overdue: { n: 0 }, us: { n: 0 } } });

describe('f660 the board tiles as one strip', () => {
  test('(1) one row a day, the last of the day wins, oldest first, capped', () => {
    const w = world();
    const seen = {};
    w.hbHistTick(seen, row(ago(2), 4));
    w.hbHistTick(seen, row(ago(5), 3));
    w.hbHistTick(seen, row(ago(2), 7));
    assert.equal(JSON.stringify(seen.hist.map(r => [r.at, r.n.live])), JSON.stringify([[ago(5), 3], [ago(2), 7]]));
    for (let i = 0; i < HB_HIST_DAYS + 15; i++) w.hbHistTick(seen, row(ago(200 - i), i));
    assert.equal(seen.hist.length, HB_HIST_DAYS);
    const ats = seen.hist.map(r => r.at);
    assert.equal(JSON.stringify(ats), JSON.stringify(ats.slice().sort()));
  });

  test('(2) no line below the minimum; a line with its words from there; flat sits mid-way', () => {
    const w = world();
    const s = w.hbS();
    s.seen = { hist: [{ at: ago(2), n: { live: 1 } }, { at: ago(1), n: { live: 2 } }] };
    assert.equal(w.hbSparkHtml('live', String), '', 'two days are not a line');
    s.seen.hist.push({ at: ago(0), n: { live: 5 } });
    const svg = w.hbSparkHtml('live', String);
    assert.match(svg, /^<svg class="hb-spark"/);
    assert.match(svg, /<title>[^<]*1 → 5[^<]*3[^<]*<\/title>/, 'the words say from → to and how many days');
    s.seen.hist = [0, 1, 2, 3].map(i => ({ at: ago(i), n: { live: 4 } }));
    const flat = w.hbSparkHtml('live', String);
    const line = (flat.match(/<path d="([^"]*)" class="hb-spark-l"/) || [])[1] || '';
    const ys = [...line.matchAll(/[ML][\d.]+ ([\d.]+)/g)].map(m => Number(m[1]));
    assert.ok(ys.length >= 4 && ys.every(y => y === 13), 'a figure that never moved runs through the middle: ' + ys);
  });

  test('(3) the tile reads what it counts, then the number', () => {
    const w = world();
    const html = w.hbBookHtml(w.hbBookData('all'), null, null);
    const tile = html.slice(html.indexOf('class="hb-fig'), html.indexOf('</div>', html.indexOf('class="hb-fig')));
    assert.ok(tile.indexOf('hb-fig-l') > 0 && tile.indexOf('hb-fig-l') < tile.indexOf('hb-fig-n'), 'label before number');
  });

  test('(4) one strip: no gap, rules between, no coloured top edge', () => {
    const figs = (INDEX.match(/\.hb-figs\{[^}]*\}/) || [''])[0];
    assert.match(figs, /gap:0/);
    assert.match(figs, /border:1px solid/);
    assert.match(INDEX, /\.hb-fig\{[^}]*border-left:1px solid/);
    assert.doesNotMatch(INDEX, /\.hb-fig::before/, 'the meaning edge is retired');
  });

  test('(5) the line\'s words are in both books', () => {
    assert.equal((I18N.match(/\bhb_spark_tip:/g) || []).length, 2);
  });
});
