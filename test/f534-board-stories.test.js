/* f534 — STORIES ON THE BOARD (Young, 6 Oct 2026: picked "Quick Story with
   Dig deeper" off the "Trend Story Agents" proposal, then "Use Dig deeper as
   the name, build it now")
   ============================================================================
     (1) THE ASK — "build me a story of our negotiation friction over the last
         year" (and renewals, and spend) opens a story; a question without the
         word "story" is not one; a story about nothing HaTi counts is not one;
     (2) THE CHAPTERS — four per story, each an ordinary card HaTi counts for
         free; every chapter key is a door;
     (3) THE WORDS — one Copilot call, written from the chapters' fact sheets,
         every sentence with a number HaTi did not count left out and said;
         kept with the numbers they were written over, and said to be out of
         date when the numbers move; with no key the chapters stand alone and
         the card says why — no call is made;
     (4) DIG DEEPER ON A STORY — the board's one Dig deeper with a longer
         allowance: the story's sheets go with the question, the run stays on
         the story, its chapters, what to watch and ideas set aside are kept
         and checked; Stop stops it;
     (5) THE SERVER — the analyst's story mode and its cleaner, both hosts;
     (6) SHARE — a story is given by its name, like a panel, and opens counted
         on the colleague's own Home;
     (7) ONE BUILDER for the steps; both books carry the words.
   Run: node --test test/f534-board-stories.test.js */
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
const tick = () => new Promise(r => setTimeout(r, 0));

describe('f534 (1) the ask', () => {
  const cases = [
    ['build me a story of our negotiation friction over the last year', 'friction'],
    ['tell the story of what is renewing in the next 12 months', 'renewals'],
    ['show me the story of where our money sits', 'spend'],
    ['a story of our spend this year', 'spend'],
    ['berättelse om förhandlingsfriktion', 'friction'],
  ];
  for (const [q, t] of cases) test(q, () => { const A = world().hbAskReadingOf(q); assert.equal(A && A.kind, 'story'); assert.equal(A.story, t); });
  test('without the word "story" it is not a story; a story about nothing HaTi counts is not one', () => {
    const w = world();
    assert.notEqual((w.hbAskReadingOf('negotiation friction over the last year') || {}).kind, 'story');
    assert.equal(w.hbStoryOfQ('a story about cats'), null);
  });
  test('the line over the box says the chapters are free and the words one call', () => {
    const w = world();
    assert.match(w.hbAskPreviewText(w.hbAskReadingOf('build me a story of our negotiation friction')), /^Story: Negotiation friction · chapters free, the words one Copilot call$/);
  });
});

describe('f534 (2) the chapters', () => {
  test('four per story, each a door that opens', () => {
    const w = world();
    for (const t of w.HB_STORIES){
      const S = w.hbStoryData(t, 'all');
      assert.equal(S.chapters.length, 4, t);
      const D = w.hbDigData('sy:' + t, 'all');
      assert.equal(D.kind, 'story'); assert.equal(D.title, S.title);
      S.chapters.filter(k => k.chart).forEach(k => { const C = w.hbDigData('sy:' + t + '.' + k.id, 'all');
        assert.equal(C && C.kind, 'list', t + '.' + k.id); assert.ok(C.ids.length > 0, t + '.' + k.id + ' counts contracts'); });
    }
  });
  test('the friction story reads rounds and the MEDIAN time to sign over the last 12 months by the signing date', () => {
    const S = world().hbStoryData('friction', 'all');
    assert.equal(S.chapters[0].chart.measure, 'rounds');
    assert.equal(S.chapters[1].chart.measure, 'medianDaysToSign');
    assert.deepEqual(J(S.chapters[1].chart.window), { last: 12, unit: 'm', date: 'signed' });
    assert.ok(Array.isArray(S.chapters[2].bars), 'which clauses get redlined: the friction tab\'s own ledger');
  });
  test('the clause ledger names the contracts behind each clause (a door, not just a count)', () => {
    assert.match(read('js/views/intelligence.js'), /extra:extraOf\(e\), ids:\[\.\.\.e\.ids\]\}\)\);/);
  });
});

describe('f534 (3) the words', () => {
  test('asked with a key: one call, from the fact sheets; a sentence with a number HaTi did not count is left out, and said', async () => {
    const w = world({ key: true });
    let calls = 0, prompt = '';
    w.copilotAsk = async (msgs) => { calls++; prompt = msgs[0].content;
      return { answer: 'LEAD: Rounds rose this year. Signing took 40 days at the peak.\nC1: The highest month was 3 rounds. It was 777 rounds once.\nC2: The slowest month took 40 days.\nC3: Nothing was redlined.\nC4: Kevian Kenya Ltd took 1.9 rounds on average.' }; };
    const said = w.hbAsk('build me a story of our negotiation friction over the last year');
    assert.match(textOf(said), /a story in 4 chapters, over the last 12 months, is on the board/);
    assert.match(textOf(said), /the words: one Copilot call/);
    await tick(); await tick();
    assert.equal(calls, 1, 'one call');
    assert.match(prompt, /CHAPTER 1 \(C1\): Rounds per contract/);
    assert.match(prompt, /Use ONLY numbers that appear on the fact sheets/);
    const rec = w.hbStoryKept('friction');
    assert.match(rec.lead, /Signing took 40 days at the peak/);
    assert.ok(!/777/.test(rec.paras.c1), 'the made-up number is left out');
    assert.equal(rec.dropped, 1, 'and how many were left out is said');
    const html = textOf(w.hbStoryHtml(w.hbDigData('sy:friction', 'all'), 'all'));
    assert.match(html, /Rounds rose this year/);
    assert.match(html, /1 sentence with a number HaTi did not count was left out|left out/);
  });
  test('the words stand only over the numbers they were written for', async () => {
    const w = world({ key: true });
    w.copilotAsk = async () => ({ answer: 'LEAD: Value sits mostly in Procurement.\nC1: x.\nC2: y.\nC3: z.\nC4: q.' });
    await w.hbStoryWrite('spend');
    assert.equal(w.hbStoryWords('spend', 'all').stale, false);
    w.state.contracts.push(Object.assign({}, w.state.contracts[0], { id: 'MK-NEW', value: 5e6 }));
    assert.equal(w.hbStoryWords('spend', 'all').stale, true);
    assert.match(textOf(w.hbStoryHtml(w.hbDigData('sy:spend', 'all'), 'all')), /The numbers have moved since this was written\. Write it again/);
  });
  test('with no key: no call, the chapters stand with HaTi\'s reading, and the card says why', () => {
    const w = world();
    let calls = 0; w.copilotAsk = async () => { calls++; return {}; };
    const said = w.hbAsk('show me the story of where our money sits');
    assert.equal(calls, 0);
    assert.match(textOf(said), /the words need a Copilot key/);
    const html = textOf(w.hbStoryHtml(w.hbDigData('sy:spend', 'all'), 'all'));
    assert.match(html, /HaTi’s own reading\. Copilot writes the story’s words once a Copilot key is set up/);
    assert.match(html, /Where the money sits/);
  });
  test('the reply\'s shape is read whatever the model\'s decoration', () => {
    const P = world().hbStoryParse('**LEAD:** One.\n**C1** – Two.\nC9: ignored\nC2: Three.', 4);
    assert.equal(P.lead, 'One.'); assert.equal(P.paras.c1, 'Two.'); assert.equal(P.paras.c2, 'Three.'); assert.ok(!P.paras.c9);
  });
});

describe('f534 (4) Dig deeper on a story', () => {
  test('the one Dig deeper, given the story: longer allowance, stays on the story, chapters, what to watch and ideas set aside kept and checked', async () => {
    const w = world({ key: true });
    const bodies = [];
    w.api = async (route, method, body) => {
      assert.equal(route, 'board/analyst');
      bodies.push(J(body));
      if (body.steps.length === 0) return { step: { name: 'calculate', input: { why: 'Is the rise in rounds one counterparty?', which: { all: true }, recipe: { split: { by: 'counterparty' }, measure: 'rounds' } } } };
      return { step: { name: 'finish', input: { summary: 'Kevian Kenya Ltd carries the friction. It took 999 rounds.', cards: [], next: [],
        chapters: [{ step: 1, title: 'Who drove it', text: 'Kevian Kenya Ltd took 1.9 rounds on average.' }, { step: 7, title: 'no such step', text: 'x' }],
        watch: [{ text: 'Kevian Kenya Ltd renews soon.', step: 1 }], aside: [{ idea: 'Bigger contracts take more rounds', why: 'Only a weak link.' }] } } };
    };
    w.hbDig('sy:friction', false);
    const run = await w.hbStoryDeeper('friction');
    assert.equal(run.story, 'friction'); assert.equal(run.max, w.HB_STORY_STEPS); assert.equal(w.HB_STORY_STEPS, 15);
    assert.ok(bodies[0].story && /STORY — Negotiation friction/.test(bodies[0].story), 'the story\'s own sheets go with the question');
    assert.deepEqual(J(w.hbS().path).slice(-1), ['sy:friction'], 'the run stays on the story');
    assert.equal(w.hbStoryKept('friction').deeper, run.id);
    assert.equal(run.chapters.length, 1, 'a chapter naming a step that was never taken is dropped');
    assert.equal(run.watch.length, 1); assert.equal(run.aside.length, 1);
    assert.ok(!/999/.test(run.summary), 'the summary is checked like every summary');
    const D = w.hbDigData('sy:friction.d1', 'all');
    assert.equal(D && D.kind, 'list', 'a deeper chapter is a card, counted again');
    const html = textOf(w.hbStoryHtml(w.hbDigData('sy:friction', 'all'), 'all'));
    assert.match(html, /5 of 5 · deeper Who drove it/);
    assert.match(html, /What to watch Kevian Kenya Ltd renews soon\. Open the \d+/);
    assert.match(html, /Ideas set aside Bigger contracts take more rounds\s*: Only a weak link\./);
    assert.match(html, /How HaTi worked this out · 1 step/);
  });
  test('Stop stops it at the next step, and what was found is kept', async () => {
    const w = world({ key: true });
    let n = 0;
    w.api = async () => { n++; if (n === 2) w.hbStoryStop('renewals');
      return { step: { name: 'calculate', input: { why: 'w', which: { all: true }, recipe: { split: 'stream' } } } }; };
    w.hbDig('sy:renewals', false);
    const run = await w.hbStoryDeeper('renewals');
    assert.equal(run.state, 'stopped');
    assert.ok(run.steps.length >= 1 && run.steps.length < 15);
    assert.match(textOf(w.hbStoryHtml(w.hbDigData('sy:renewals', 'all'), 'all')), /Stopped after \d+ steps?\. What was found is kept below\./);
  });
  test('the cost sits beside the button; with no key the button is grey and says why', () => {
    const on = w => w.hbStoryHtml(w.hbDigData('sy:friction', 'all'), 'all');
    assert.match(on(world({ key: true })), /data-hb-sy-deeper="friction"[^>]*title="Copilot looks for what is behind the story in up to 15 steps/);
    assert.match(on(world()), /data-hb-sy-deeper="friction" disabled title="[^"]*Copilot key/);
  });
  test('a story\'s deeper run is not let go while the story keeps it', () => {
    const w = world();
    w.hbStoryDeeperSet('friction', 'rKEEP');
    w.hbDdKeep({ id: 'rKEEP', q: 'x', steps: [] });
    for (let i = 0; i < 5; i++) w.hbDdKeep({ id: 'r' + i, q: 'x', steps: [] });
    assert.ok(w.hbDdRun('rKEEP'), 'kept');
  });
});

describe('f534 (5) the server', () => {
  const SERVER = read('server/server.js');
  test('the analyst\'s story mode: 15 steps, the story in the prompt, chapters / watch / aside in the finish', () => {
    assert.match(SERVER, /const BOARD_ANALYST_STORY_STEPS = 15, BOARD_ANALYST_STORY_MAX = 6000;/);
    assert.match(SERVER, /const maxSteps = story \? BOARD_ANALYST_STORY_STEPS : BOARD_ANALYST_STEPS;/);
    assert.match(SERVER, /This is DIG DEEPER on a story already on the board/);
    assert.match(SERVER, /chapters: \{ type: 'array'/); assert.match(SERVER, /watch: \{ type: 'array'/); assert.match(SERVER, /aside: \{ type: 'array'/);
  });
  test('its cleaner keeps a chapter only on a real step number', () => {
    const consts = SERVER.split('\n').filter(l => /^const (GRAPH_CHART_[A-Z_]+|BOARD_ANALYST_[A-Z_]+(, BOARD_ANALYST_[A-Z_]+)?) = /.test(l) && !/GRAPH_CHART_PROPS/.test(l)).join('\n');
    const fnOf = name => { const i = SERVER.indexOf('function ' + name + '('); return SERVER.slice(i, SERVER.indexOf('\n}\n', i) + 2); };
    const out = J(vm.runInNewContext(`${consts}\n${fnOf('graphChartSplit')}\n${fnOf('graphChartClean')}\n${fnOf('boardAnalystClean')}\nboardAnalystClean('finish', I);`,
      { I: { summary: 's', chapters: [{ step: 2, title: 'T', text: 'x' }, { step: 99, text: 'y' }, { text: 'z' }], watch: [{ text: 'w', step: 'a' }], aside: [{ idea: 'i', why: 'y' }, { why: 'no idea' }] } }));
    assert.deepEqual(out.chapters, [{ step: 2, title: 'T', text: 'x' }]);
    assert.deepEqual(out.watch, [{ text: 'w', step: null }]);
    assert.deepEqual(out.aside, [{ idea: 'i', why: 'y' }]);
  });
  test('a story can be given: its three names are gift kinds', () => {
    assert.match(SERVER, /const HOME_GIFT_KINDS = \['obl', 'fric', 'ren', 'pay', 'exp', 'val', 'sy_friction', 'sy_renewals', 'sy_spend'\];/);
  });
});

describe('f534 (6) share', () => {
  test('a story is given by its name, never a figure; a given story opens counted on the colleague\'s own Home', async () => {
    const w = world({ key: true });
    let posted = null;
    w.api = async (route, method, body) => { posted = { route, method, body: J(body) }; return { gift: { id: 'g1', pid: body.pid, toName: 'Wanjiru' } }; };
    w.toast = () => {};
    await w.hbGive('sy:friction', 'u2', 'For Monday');
    assert.equal(posted.route, 'home/gifts');
    assert.deepEqual([posted.body.kind, posted.body.pid, posted.body.note], ['sy_friction', 'sy:friction', 'For Monday']);
    assert.ok(!('lead' in posted.body) && !('paras' in posted.body), 'no words, no figures travel');
    const g = { id: 'g9', kind: 'sy_renewals', fromName: 'Amina', note: 'Look' };
    const h = w.hbStoryGiftHtml(g);
    assert.match(h, /data-hb-pid="gift:g9"/); assert.match(h, /data-hb-dig="sy:renewals"/); assert.match(textOf(h), /Story · Renewals and endings From Amina/);
  });
});

describe('f534 (7) one builder, both books', () => {
  test('the analyst card and the story draw their steps with one builder', () => {
    const HB = read('js/views/homeboard.js');
    assert.equal((HB.match(/\$\{hbDdStepsHtml\(run, busy\)\}/g) || []).length, 2);
  });
  test('the story\'s words are in both books', () => {
    const I = read('js/i18n.js');
    for (const k of ['hb_sy_friction', 'hb_sy_renewals', 'hb_sy_spend', 'hb_sy_dd_cost', 'hb_sy_watch', 'hb_sy_aside', 'hb_pre_story', 'hb_sy_nokey'])
      assert.equal((I.match(new RegExp('\\b' + k + ':', 'g')) || []).length, 2, k);
  });
});
