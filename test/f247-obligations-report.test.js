/* f247 — WHERE OBLIGATIONS GO QUIET (26 Aug 2026)
   ========================================================================
   A fourth surface under Insights, between Negotiation friction and Contract
   graph. The friction tab asks where deals get STUCK; this one asks where
   promises get FORGOTTEN — the quieter failure, because a stalled negotiation
   has somebody waiting on it and a dropped obligation has nobody at all.

   THE CLAIM THE WHOLE PAGE RESTS ON is "no email will be sent about this",
   and that is not an opinion this page may hold on its own: the sweep in
   server/server.js is what actually sends. So the milestones are mirrored and
   this file asserts they still AGREE — a page confidently contradicting the
   thing that sends the mail is worse than no page.

   AND THE GUARD THAT ATE THE FIRST BUILD is pinned here by name. renderIntel
   carried a bare ['frame','map','friction'] whitelist written out separately
   from the tab row: the new button drew, the press registered, the page redrew
   the OVERVIEW, and nothing anywhere said why. It is one list now and both
   read it. That fault is invisible in the source of either half, which is
   exactly why it is a test rather than a comment.

   THE COMPUTED HALF IS IN obligations-report-verify, deliberately: whether a
   bar is on screen, whether the ours/theirs pair is tellable apart in both
   themes, and whether the page scrolls sideways on a laptop are questions
   jsdom cannot answer at all. The SHAPE and the RULES are here; what DRAWS is
   there, and the two name each other. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const IG = read('js/views/intelligence.js');
const SRV = read('server/server.js');
const I18N = read('js/i18n.js');
/* Comments carry the arguments in this codebase and would answer half of
   these assertions by accident. Every claim that reads source strips them. */
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
const IG_CODE = strip(IG);

/* The body of one top-level function, by brace matching from its signature. */
function bodyOf(src, name){
  const i = src.indexOf('function ' + name + '(');
  assert.ok(i >= 0, name + ' is not declared in this file');
  let j = src.indexOf('{', i), d = 0;
  for (let k = j; k < src.length; k++){
    if (src[k] === '{') d++;
    else if (src[k] === '}' && --d === 0) return src.slice(j, k + 1);
  }
  throw new Error('unbalanced braces in ' + name);
}

const day = off => { const d = new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate()+off);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };

/* A book with one of every reason an obligation goes quiet, and one of every
   reason it does not. Staged through the record's own shape — the report is a
   reading of stored contracts and nothing else writes to it. */
function stage(){
  const w = buildWorld({ intelView: true });
  const win = w.win;
  win.getUsers = () => ([
    { id: 'u1', name: 'Amina Otieno', email: 'amina@example.co.ke' },
    { id: 'u2', name: 'No Address',   email: '' },
  ]);
  const ob = o => Object.assign({ id: 'ob_' + Math.random().toString(36).slice(2,8),
    desc: 'A duty', due: '', recurring: 'none', assignee: '', status: 'open' }, o);
  const c = (id, o) => Object.assign({ id, name: id, counterparty: 'Nordkust',
    status: 'Signed', obligations: [] }, o);
  win.state = { contracts: [
    c('MK-1', { obligations: [
      /* REACHABLE — a date the product can read and somebody it can write to. */
      ob({ desc: 'Quarterly report', due: day(12), assignee: 'Amina Otieno', recurring: 'quarterly' }),
      /* Overdue but still inside the sweep's last milestone: a mail is still to come. */
      ob({ desc: 'Pay the invoice',  due: day(-2), assignee: 'Amina Otieno' }),
      /* SILENT · every milestone spent. */
      ob({ desc: 'Rebate recon',     due: day(-12), assignee: 'Amina Otieno' }),
      /* SILENT · no date at all. */
      ob({ desc: 'Serve notice',     due: '',       assignee: 'Amina Otieno' }),
      /* SILENT · a date nothing can parse. */
      ob({ desc: 'On completion',    due: 'on completion', assignee: 'Amina Otieno' }),
      /* SILENT · nobody named. */
      ob({ desc: 'Insurance cert',   due: day(30),  party: 'theirs' }),
      /* SILENT · named, but not a member of this workspace. */
      ob({ desc: 'Send forecast',    due: day(45),  assignee: 'Someone Who Left' }),
      /* Done, and a standing commitment nothing replaced. */
      ob({ desc: 'Old monthly',      due: day(-200), recurring: 'monthly',
           assignee: 'Amina Otieno', status: 'done' }),
      /* Done, but the same commitment is still open beside it — NOT stopped. */
      ob({ desc: 'Live annual',      due: day(-300), recurring: 'annual',
           assignee: 'Amina Otieno', status: 'done' }),
      ob({ desc: 'Live annual',      due: day(60),   recurring: 'annual',
           assignee: 'Amina Otieno' }),
    ] }),
    c('MK-2', { status: 'Signed' }),
    c('MK-3', { status: 'Under Review' }),
    c('MK-4', { status: 'Draft' }),
    /* Neither of these is in the live book. */
    c('MK-5', { status: 'Declined', obligations: [ob({ desc: 'Ignore me', due: day(5) })] }),
    c('MK-6', { status: 'Signed', archived: { at: day(-1) },
      obligations: [ob({ desc: 'Ignore me too', due: day(5) })] }),
  ] };
  return { win, d: win.intelObligationsData() };
}

describe('f247 · the tab is one list, read by the row AND the guard', () => {
  test('IG_TABS carries the four surfaces, obligations between friction and map', () => {
    const w = buildWorld({ intelView: true });
    assert.deepEqual([...w.win.IG_TABS], ['frame', 'friction', 'obligations', 'map']);
    assert.equal(w.win.IG_TABS.indexOf('obligations'), w.win.IG_TABS.indexOf('friction') + 1);
    assert.equal(w.win.IG_TABS.indexOf('map'), w.win.IG_TABS.indexOf('obligations') + 1);
  });

  test('the guard reads the list rather than writing its own out', () => {
    /* The exact shape of the fault: a bare array literal of tab names beside
       an intel.tab test. Whatever the row draws, that guard decides what the
       page may show, and the two drifted the moment a fourth tab arrived. */
    assert.ok(/IG_TABS\.indexOf\(intel\.tab\)\s*<\s*0/.test(IG_CODE),
      'renderIntel must test intel.tab against IG_TABS');
    assert.ok(!/\[\s*'frame'\s*,[^\]]*\]\s*\.indexOf\(intel\.tab\)/.test(IG_CODE),
      'a bare array of tab names is what silently sent every new tab back to the frame');
  });

  test('the row is built from the list, and its labels are KEYS not resolved strings', () => {
    assert.ok(/IG_TABS\.map\(k=>tabBtn\(k,\s*i18t\(IG_TAB_LABEL\[k\]\)\)\)/.test(IG_CODE),
      'the tab row must be built from IG_TABS');
    const w = buildWorld({ intelView: true });
    /* An object literal holding i18t(...) freezes whatever language was current
       at load — the getter trap this codebase has recorded four times over. */
    w.win.IG_TABS.forEach(k => assert.match(String(w.win.IG_TAB_LABEL[k]), /^[a-z_0-9]+$/,
      k + ' must map to a dictionary KEY, not a translated label'));
  });

  test('the tab has a home in renderIntel and its own scrolling body', () => {
    assert.ok(/if\(intel\.tab==='obligations'\)\{/.test(IG_CODE));
    assert.ok(/id="ig-oblig"/.test(IG_CODE));
    assert.ok(/intelObligationsHtml\(\)/.test(IG_CODE));
  });
});

describe('f247 · counting is not drawing', () => {
  const data = bodyOf(IG_CODE, 'intelObligationsData');
  const html = bodyOf(IG_CODE, 'intelObligationsHtml');

  test('the counter draws nothing', () => {
    assert.ok(!/<div|<span|<section|style="/.test(data), 'intelObligationsData emits markup');
    assert.ok(!/i18t\(/.test(data), 'intelObligationsData resolves a label');
  });

  test('the renderer counts nothing', () => {
    assert.ok(!/state\.contracts/.test(html),
      'intelObligationsHtml reads the book — every figure must come from the data object');
    assert.ok(/intelObligationsData\(\)/.test(html));
  });

  test('neither half reaches a route', () => {
    /* This is a reading of the caller's own already-scoped bootstrap, exactly
       as the precedent model is. There must never be a route: the numbers are
       this workspace's and never travel. */
    [['data', data], ['html', html]].forEach(([n, src]) => {
      assert.ok(!/\bapi\(/.test(src), n + ' calls api()');
      assert.ok(!/\bfetch\(/.test(src), n + ' calls fetch()');
      assert.ok(!/['"]ai\//.test(src), n + ' reaches an AI route');
    });
  });

  test('it borrows every reading and re-derives none', () => {
    ['obligationDue', 'obState', 'obligationIsTheirs', 'daysUntil']
      .forEach(f => assert.ok(new RegExp('\\b' + f + '\\b').test(data), 'must ask ' + f));
    /* A second copy of "is this a date" or "is this overdue" is how two screens
       come to disagree about the same commitment. */
    assert.ok(!/Date\.parse\(/.test(data), 'the counter parses a date itself');
    assert.ok(!/new Date\([^)]*T00:00:00/.test(data), 'the counter does its own day arithmetic');
  });
});

describe('f247 · the silence test mirrors the sweep that actually sends', () => {
  test('the thresholds are named, and they are the ones the server fires on', () => {
    assert.ok(/const OB_LAST_OWNED = -4, OB_LAST_UNOWNED = -1, OB_BRIEF_FLOOR = -30;/.test(IG_CODE));
    /* Read off server/server.js, so a change to the sweep fails HERE rather
       than leaving the page quietly claiming the wrong thing. */
    assert.ok(/od === -4 && fireTo\(/.test(SRV), 'the escalation no longer fires on day 4');
    assert.ok(/od === -1 && fireTo\(/.test(SRV), 'the owner overdue mail no longer fires on day 1');
    assert.ok(/\} else if \(od === -1 && fire\(/.test(SRV),
      'the unowned admin note no longer fires once on day 1');
    assert.ok(/od <= 7 && od >= -30/.test(SRV), 'the daily brief window has moved off 30 days');
  });

  test('an obligation with no readable date can never be reminded about', () => {
    const { d } = stage();
    assert.equal(d.why.nodate, 1);
    assert.equal(d.why.unreadable, 1);
  });

  test('nobody named, and a name that is not a member, are told apart', () => {
    const { d } = stage();
    assert.equal(d.why.noowner, 1, 'the "theirs" obligation with no chaser');
    assert.equal(d.why.gone, 1, 'Someone Who Left');
  });

  test('past the last milestone counts as spent — and one still inside it does not', () => {
    const { d } = stage();
    assert.equal(d.why.spent, 1, 'only the one 12 days overdue');
  });

  test('the headline counts each obligation once and says so when rows overlap', () => {
    const { d } = stage();
    /* Five silent: spent, nodate, unreadable, noowner, gone. */
    assert.equal(d.silent, 5);
    assert.equal(d.reasonSum, Object.values(d.why).reduce((a, b) => a + b, 0));
    assert.equal(d.silentOverlap, Math.max(0, d.reasonSum - d.silent));
  });

  test('a reachable obligation is not counted silent', () => {
    const { d } = stage();
    /* Ten open on MK-1; five of them are reachable — the quarterly report, the
       invoice two days overdue, the live annual, and the two above. */
    assert.equal(d.open, 8);
    assert.ok(d.silent < d.open, 'everything cannot be silent');
  });

  test('a member with no address to write to resolves to nobody', () => {
    const { win } = stage();
    win.state.contracts[0].obligations = [{ id: 'x', desc: 'd', due: day(9),
      assignee: 'No Address', status: 'open', recurring: 'none' }];
    const d = win.intelObligationsData();
    assert.equal(d.why.gone, 1, 'an account carrying no email is nowhere to send to');
  });
});

describe('f247 · the live book, and only the live book', () => {
  test('declined and archived contracts are out, and so is anything done', () => {
    const { d } = stage();
    assert.equal(d.contracts, 4, 'MK-1..MK-4 — never the declined or archived one');
    assert.equal(d.total, 10);
    assert.equal(d.done, 2);
    assert.equal(d.open, 8);
  });

  test('a contract with nothing recorded is split by where it stands', () => {
    const { d } = stage();
    assert.equal(d.cover.withOb, 1);
    assert.equal(d.cover.none, 3);
    assert.equal(d.cover.noneSigned, 1);
    assert.equal(d.cover.noneReview, 1);
    assert.equal(d.cover.noneDraft, 1);
  });

  test('what it cannot see is reported as unknown rather than guessed', () => {
    const { d } = stage();
    /* Nothing on the record says a contract was ever READ for obligations, and
       nothing says WHEN one was completed. Both are stated, and the day either
       field exists these flip and the panels become real. */
    assert.equal(d.canSeeScan, false);
    assert.equal(d.canSeeCompletedOn, false);
  });
});

describe('f247 · the readings the panels rest on', () => {
  test('overdue ages fall in the sweep\'s own buckets', () => {
    const { d } = stage();
    assert.equal(d.overdue, 2, 'two days and twelve days overdue');
    assert.deepEqual([...d.ages], [1, 1, 0, 0]);
    assert.equal(d.pastBoth, d.ages[2] + d.ages[3]);
  });

  test('the forward window splits ours from theirs', () => {
    const { d } = stage();
    assert.equal(d.ahead, 4, 'day 12, 30, 45 and 60 — inside 90');
    assert.equal(d.aheadTheirs, 1);
    assert.equal(d.aheadOurs, 3);
    assert.equal(d.aheadOurs + d.aheadTheirs, d.ahead);
  });

  test('the chase list is theirs only, soonest first, and names the counterparty', () => {
    const { d } = stage();
    assert.equal(d.chase.length, 1);
    assert.equal(d.chase[0].name, 'Nordkust');
    assert.equal(d.chase[0].n, 1);
  });

  test('who is carrying what is OUR side only, unassigned first', () => {
    const { d } = stage();
    /* There is no owner to group "theirs" by — this product holds no staff
       list for the counterparty and is not going to keep one. */
    const names = d.owners.map(o => o.name);
    assert.ok(!names.includes('Nordkust'));
    assert.ok(names.includes('Amina Otieno') && names.includes('Someone Who Left'));
    const lost = d.owners.find(o => o.name === 'Someone Who Left');
    assert.equal(lost.resolves, false, 'a name that is not a member keeps its own mark');
  });

  test('a repeating commitment counts as stopped only where nothing replaced it', () => {
    const { d } = stage();
    assert.equal(d.repeat.monthly, 1, 'the monthly return has no successor');
    assert.equal(d.repeat.annual, 0, 'the annual one is still open beside it');
    assert.equal(d.repeatTotal, 1);
  });

  test('row lists cap, and the overflow is counted rather than dropped', () => {
    assert.ok(/const OB_ROWS = 5;/.test(IG_CODE));
    const { d } = stage();
    assert.ok(d.chase.length <= 5);
    assert.equal(typeof d.chaseMore, 'number');
    assert.equal(typeof d.chaseMoreN, 'number');
    assert.equal(typeof d.ownersMore, 'number');
  });

  test('an empty book draws the empty state rather than six empty panels', () => {
    const w = buildWorld({ intelView: true });
    w.win.getUsers = () => [];
    w.win.state = { contracts: [] };
    const d = w.win.intelObligationsData();
    assert.equal(d.total, 0);
    assert.ok(/if\(!d\.total\) return/.test(bodyOf(IG_CODE, 'intelObligationsHtml')));
  });
});

describe('f247 · it reads like the two tabs beside it', () => {
  test('the card chrome resolves the same tokens as the portfolio card', () => {
    const PF = strip(read('js/views/portfolio.js'));
    const pf = /const PF_CARD='([^']+)'/.exec(PF);
    const ob = /const OB_CARD='([^']+)'/.exec(IG_CODE);
    assert.ok(pf && ob, 'both card shells must be named');
    const pad = s => (/padding:([^;]+)/.exec(s) || [])[1];
    assert.equal(pad(ob[1]), pad(pf[1]),
      'the Insights cards must sit at one padding — pin the RELATION, never the number');
    ['var(--color-surface)', 'var(--color-divider)', 'var(--radius)'].forEach(t =>
      assert.ok(ob[1].includes(t), 'the card must read ' + t + ' rather than a literal'));
  });

  test('a month is a word, so it follows the READER and carries its year', () => {
    const m = bodyOf(IG_CODE, 'obMonthLabel');
    assert.ok(/langLocale\(\)/.test(m), 'a month name follows the language, not the market');
    assert.ok(!/jxLocale\(\)/.test(m));
    assert.ok(/year:'numeric'/.test(m), 'a month is named with its whole year');
    const w = buildWorld({ intelView: true });
    assert.equal(w.win.obMonthLabel('nonsense'), 'nonsense', 'an unreadable key is handed back');
    assert.match(w.win.obMonthLabel('2026-09'), /2026/);
  });

  test('colour never carries a reading on its own', () => {
    const html = bodyOf(IG_CODE, 'intelObligationsHtml');
    /* Every chart on this page is drawn beside its own figure and every legend
       spells its count out, so nothing rests on the hue. */
    assert.ok(/role="img" aria-label=/.test(html), 'a chart must name itself for a reader who cannot see it');
    assert.ok(/int_ob_90_key_ours/.test(html) && /int_ob_90_key_theirs/.test(html));
  });
});

describe('f247 · one language per screen', () => {
  const keys = [...new Set([...IG.matchAll(/i18t(?:n)?\('(int_ob[a-z_0-9]*)'/g)].map(m => m[1]))];

  test('every key the page uses exists in BOTH languages', () => {
    assert.ok(keys.length > 60, 'expected the report to carry its own wording, got ' + keys.length);
    const twice = k => (I18N.match(new RegExp('^    ' + k + ':', 'gm')) || []).length === 2;
    /* i18tn takes a BASE key; the dictionary carries its _one and _other. */
    const missing = keys.filter(k => !twice(k) && !(twice(k + '_one') && twice(k + '_other')));
    assert.deepEqual(missing, [], 'keys not present exactly twice (English and Swedish)');
  });

  test('the tab itself is named in both', () => {
    assert.equal((I18N.match(/^    int_obligations:/gm) || []).length, 2);
  });
});
