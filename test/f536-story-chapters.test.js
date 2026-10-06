/* f536 — EVERY STORY CHAPTER DRAWS, READS AND OPENS (Young, 6 Oct 2026: "some
   of the story charts do not appear and some charts are so small … there is
   not option to expand", then "Go with your recommendations")
   ============================================================================
     (1) A DEEPER CHAPTER IS NEVER BLANK — a pack step draws the pack's first
         chart and offers the whole answer; a step whose set no longer matches
         says so, with its contracts one press away;
     (2) ROOM AND A FLOOR — a chart that needs width takes the story's row; no
         SVG's writing may draw under the board's small text (its min-width);
     (3) THE CHART SHOWS WHAT THE CHAPTER SAYS — a chapter may name its own
         picture (both hosts clean it alike); one the board cannot draw falls
         back to the step's own chart; a kept run keeps it;
     (4) EVERY CHART CHAPTER OPENS BIG — the board's own button, a door that
         lands on the chapter enlarged with the trail back to the story;
     (5) AN EXPOSURE CHART LEADS WITH THE MONEY AT RISK, not the value.
   Run: node --test test/f536-story-chapters.test.js */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { buildWorld } = require('./world');
const { bookContracts, mon } = require('./board-precision');

const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const J = x => JSON.parse(JSON.stringify(x));
const textOf = h => String(h || '').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
function world(opts){
  const o = opts || {};
  const w = buildWorld({ intelView: true }).win;
  w.state = { contracts: bookContracts(), settings: {}, view: 'dashboard' };
  w.FOLDERS = { proc: { id: 'proc', name: 'Procurement & Raw Materials' }, sales: { id: 'sales', name: 'Sales & Route-to-Market' } };
  w.cKind = c => c.kind || 'Contract';
  w.getContract = id => w.state.contracts.find(c => c.id === id) || null;
  w.payDays = () => null; w.paySide = () => null;
  w.contractExpired = c => c.status === 'Signed' && !!c.expiry && c.expiry < mon(0, 1);
  w.isMonetary = () => true;
  w.currentUser = () => ({ id: 'u_test', name: 'Test User', role: 'legal' });
  w.eval(read('js/views/homeboard.js'));
  w.eval('intel.lenses=[]; intel.groups=null; intel.groupBy="folder"; intel.history=[];');
  w.hbPaintBoard = () => {};
  w.copilotAvailable = () => !!o.key;
  w.API_MODE = () => !!o.key;
  const s = w.hbS(); s.face = 'board'; s.panels = []; s.path = []; s.recipe = {}; s.digBig = false;
  return w;
}


function runOn(w, steps, chapters){
  const run = { id: 'rT1', q: 'why', steps, state: 'done', summary: 's', dropped: 0, cards: [], next: [], err: '', notice: '', at: '10:00', max: 15, story: 'friction', chapters, watch: [], aside: [] };
  w.hbDdKeep(run); w.hbStoryDeeperSet('friction', 'rT1'); return run;
}
const calc = (which, recipe, title) => ({ name: 'calculate', why: 'w', title: title || 'Step', lines: [], ids: [], n: 0, dig: '', input: { which, recipe } });

describe('f536 (1) a deeper chapter is never blank', () => {
  test('a pack step draws the pack\'s first chart and offers the whole answer', () => {
    const w = world();
    runOn(w, [{ name: 'pack', why: 'w', title: 'When value ends', lines: [], ids: [], n: 0, dig: 'pk:ending', input: null }], [{ step: 1, title: 'When value ends', text: '' }]);
    const D = w.hbStoryDeepD('friction', 1, 'all');
    assert.ok(D && D.kind === 'list' && D.ids.length, 'the pack\'s first chart is the chapter\'s');
    assert.equal(D.key, 'sy:friction.d1');
    const html = w.hbStoryHtml(w.hbDigData('sy:friction', 'all'), 'all');
    const ch = html.slice(html.indexOf('hb-sy-ch is-deep'));
    assert.match(ch, /<svg[^>]*class="hb-svg/);
    assert.match(ch, /data-hb-dig="pk:ending"[^>]*>Open the whole answer</);
  });
  test('a step whose set no longer matches says so, with its contracts one press away', () => {
    const w = world();
    const st = calc({ q: 'zqx zebra leases from mars' }, { pic: 'bars', split: { by: 'counterparty' } }, 'Leases');
    st.ids = ['MK-1001']; st.n = 1;
    runOn(w, [st], [{ step: 1, title: 'Not the leases', text: '' }]);
    assert.equal(w.hbStoryDeepD('friction', 1, 'all'), null);
    const ch = textOf(w.hbStoryHtml(w.hbDigData('sy:friction', 'all'), 'all'));
    assert.match(ch, /Not the leases HaTi could not draw this step again: the contracts it named no longer match\. Open 1/);
  });
});

describe('f536 (2) room, and a floor under the writing', () => {
  test('a grid, a stack, a timeline or more than 12 columns takes the row; a ring does not', () => {
    const w = world();
    const D = chart => ({ key: 'x', kind: 'list', ids: w.state.contracts.map(c => c.id), n: 1, chart, fixed: [] });
    const cs = w.hbListOf(w.state.contracts.map(c => c.id), 'all');
    assert.match(read('js/views/homeboard.js'), /const HB_STORY_WIDE_COLS = 12, HB_STORY_TEXT_MIN = 12;/);
    assert.equal(w.hbStoryWide(D({ pic: 'heat', split: { by: 'folder' }, split2: { by: 'status' } }), cs), true);
    assert.equal(w.hbStoryWide(D({ pic: 'ring', split: { by: 'folder' } }), cs), false);
    assert.equal(w.hbStoryWide(D({ pic: 'cols', split: { by: 'date', unit: 'm', date: 'signed' }, window: { last: 24, unit: 'm', date: 'signed' } }), cs), true);
    assert.equal(w.hbStoryWide(D({ pic: 'cols', split: { by: 'date', unit: 'q', date: 'signed' }, window: { last: 4, unit: 'q', date: 'signed' } }), cs), false);
  });
  test('an SVG\'s floor is its own smallest font scaled to the board\'s small text', () => {
    const w = world();
    const out = w.hbStoryPicHtml('<p>x</p><svg class="hb-svg hb-heat" viewBox="0 0 1000 200" role="group"><text font-size="10">a</text><text font-size="12">b</text></svg>');
    assert.match(out, /^<div class="hb-sy-pic">/);
    assert.match(out, /<svg style="min-width:1200px" class="hb-svg hb-heat"/);
    assert.equal(w.hbStoryPicHtml('<svg class="hb-svg" viewBox="0 0 1000 200"><rect/></svg>'), '<div class="hb-sy-pic"><svg class="hb-svg" viewBox="0 0 1000 200"><rect/></svg></div>', 'no writing, no floor');
  });
  test('the styles: a wide chapter spans the row, a chart scrolls inside its chapter', () => {
    const CSS = read('index.html');
    assert.match(CSS, /\.hb-sy-ch\.is-wide\{grid-column:1\/-1\}/);
    assert.match(CSS, /\.hb-sy-pic\{min-width:0;overflow-x:auto\}/);
  });
});

describe('f536 (3) the chart shows what the chapter says', () => {
  test('a chapter that names a picture is drawn in it, over the step\'s own contracts', () => {
    const w = world();
    runOn(w, [calc({ all: true }, { pic: 'bars', split: { by: 'counterparty' } })],
      [{ step: 1, title: 'It rose in September', text: '', recipe: w.hbStoryPicOf({ pic: 'cols', split: { by: 'date', unit: 'm', date: 'signed' }, which: { all: true }, title: 'x' }) }]);
    const D = w.hbStoryDeepD('friction', 1, 'all');
    assert.equal(D.chart.pic, 'cols'); assert.equal(D.chart.split.by, 'date'); assert.ok(!('which' in D.chart));
  });
  test('a picture the board cannot draw is dropped and the step\'s own chart stands', () => {
    const w = world();
    assert.equal(w.hbStoryPicOf({ pic: 'spiral', measure: 'vibes' }), undefined);
    assert.equal(w.hbStoryPicOf(null), undefined);
    runOn(w, [calc({ all: true }, { pic: 'bars', split: { by: 'counterparty' } })], [{ step: 1, title: 'T', text: '', recipe: undefined }]);
    assert.equal(w.hbStoryDeepD('friction', 1, 'all').chart.pic, 'bars');
  });
  test('the finish keeps a chapter\'s picture, and a refresh reads it back cleaned', async () => {
    const w = world({ key: true });
    w.api = async (route, method, body) => body.steps.length === 0
      ? { step: { name: 'calculate', input: { why: 'w', which: { all: true }, recipe: { pic: 'bars', split: { by: 'counterparty' } } } } }
      : { step: { name: 'finish', input: { summary: 'S.', chapters: [{ step: 1, title: 'By month', text: '', recipe: { pic: 'cols', split: { by: 'date', unit: 'm', date: 'signed' }, bogus: 1 } }] } } };
    w.hbDig('sy:friction', false);
    const run = await w.hbStoryDeeper('friction');
    assert.equal(run.chapters[0].recipe.pic, 'cols'); assert.ok(!('bogus' in run.chapters[0].recipe));
    assert.match(read('js/views/homeboard.js'), /text: txt\(c\.text, 700\), recipe: hbStoryPicOf\(c\.recipe\) \}\)\) : \[\];/, 'the refresh reads it back through the same cleaner');
  });
  test('the server asks for the picture and cleans it as a card\'s recipe', () => {
    const SERVER = read('server/server.js');
    assert.match(SERVER, /and the picture that shows what the title says/);
    const consts = SERVER.split('\n').filter(l => /^const (GRAPH_CHART_[A-Z_]+|BOARD_ANALYST_[A-Z_]+(, BOARD_ANALYST_[A-Z_]+)?) = /.test(l) && !/GRAPH_CHART_PROPS/.test(l)).join('\n');
    const fnOf = name => { const i = SERVER.indexOf('function ' + name + '('); return SERVER.slice(i, SERVER.indexOf('\n}\n', i) + 2); };
    const out = J(vm.runInNewContext(`${consts}\n${fnOf('graphChartSplit')}\n${fnOf('graphChartClean')}\n${fnOf('boardAnalystClean')}\nboardAnalystClean('finish', I);`,
      { I: { summary: 's', chapters: [{ step: 1, title: 'A', text: 'x', recipe: { pic: 'cols', split: { by: 'date', unit: 'm', date: 'signed' } } }, { step: 2, title: 'B', text: 'y', recipe: { pic: 'spiral' } }] } }));
    assert.equal(out.chapters[0].recipe.pic, 'cols');
    assert.ok(!('recipe' in out.chapters[1]), 'a picture the board cannot draw does not travel');
  });
});

describe('f536 (4) every chart chapter opens big', () => {
  test('the board\'s own button on a drawn chapter, a door onto that chapter', () => {
    const w = world();
    const html = w.hbStoryHtml(w.hbDigData('sy:friction', 'all'), 'all');
    assert.match(html, /<button type="button" class="hb-ib hb-bigbtn" data-hb-sy-big="sy:friction\.c1" aria-pressed="false" title="Make bigger"/);
    const SRC = read('js/views/homeboard.js');
    assert.match(SRC, /if \(on\('\[data-hb-sy-big\]'\)\)\{ const s = hbS\(\); s\.digBig = true; hbDig\(t\.closest\('\[data-hb-sy-big\]'\)\.getAttribute\('data-hb-sy-big'\), true\); return; \}/,
      'one press: enlarged, and the chapter is pushed on the trail so the crumb leads back');
  });
});

describe('f536 (5) an exposure chart leads with the money at risk', () => {
  test('the lead is the exposure from the same measure the reading says', () => {
    const w = world();
    const book = w.state.contracts; book.forEach((c, i) => { if (i % 2 === 0) c.scan = { findings: [{ sev: 'high' }] }; });
    w.riskOpenOf = c => (c.scan && c.scan.findings) || [];
    const D = { key: 'x', kind: 'list', ids: book.map(c => c.id), n: book.length, chart: { pic: 'bars', split: { by: 'folder' }, measure: 'exposure' }, fixed: [] };
    const cs = w.hbListOf(D.ids, 'all');
    const lead = textOf((w.hbChartHtml(D, cs, false).match(/<div class="hb-chart-lead">[\s\S]*?<\/div>/) || [''])[0]);
    /* the lead's figure is the sum of the bars it draws (each a group's exposure) */
    const big = textOf(w.hbChartHtml(D, cs, true));
    const exp = (lead.match(/· ([A-Z]{3} ([\d.]+)M) at risk/) || []);
    const bars = [...big.slice(big.indexOf('risk exposure ') + 14).matchAll(/KES ([\d.]+)M · \d+/g)].reduce((a, m) => a + Number(m[1]), 0);
    const plain = Object.assign({}, D, { chart: { pic: 'bars', split: { by: 'folder' }, measure: 'value' } });
    const val = (textOf((w.hbChartHtml(plain, cs, false).match(/<div class="hb-chart-lead">[\s\S]*?<\/div>/) || [''])[0]).match(/· ([A-Z]{3} [\d.,]+[BMK]?)/) || [])[1];
    assert.ok(exp[1], 'the lead says the money at risk: ' + lead);
    assert.ok(Math.abs(Number(exp[2]) - bars) < 1.01, `${exp[1]} against the bars' ${bars}M`);
    assert.ok(val && !lead.includes(val), `not the whole value (${val}): ${lead}`);
  });
  test('both books carry the words', () => {
    const I = read('js/i18n.js');
    for (const k of ['hb_lead_exposure', 'hb_sy_deep_none', 'hb_sy_deep_pack']) assert.equal((I.match(new RegExp('\\n\\s+' + k + ':', 'g')) || []).length, 2, k);
  });
});
