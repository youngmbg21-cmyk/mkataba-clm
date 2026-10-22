/* ============================================================
   f862 — JAMBO SPEAKS FIRST ON AN UPLOAD (round 1 of Jambo's journey;
   owner, 22 Oct 2026: "First thing after uploading a contract, jambo pops up
   to advise you IN VERY NATURAL AND PLAIN LANGUAGE", and "May Jambo speak
   first on arrival? Yes")
   ============================================================
   (1) THE ONE READING (firstReadOf) sorts what the arrival reading already
       found: the worst risks and every departure from your standards are
       "push back now", the rest "read later"; anything to push back on means
       negotiate, nothing means send, a signed paper has no road.
   (2) THE TWO TURNS: who the other side is (with your history and the
       contract in short) and Yes / No; then the lists, capped and the cap
       said, and the road with the recommended one first and filled.
   (3) HE SPEAKS ONCE, AND ONLY FOR AN UPLOAD: the finished reading of an
       upload owes his words (sayOwed); Home's panel says them when that
       contract is on the paper (saidAt), never twice, never for a contract
       read before this existed.
   (4) EACH ANSWER IS AN EXISTING DOOR: Yes says so, No opens the fill-in door
       on the other side's name, Negotiate the Redlines face, Just send it the
       share card his word "share" answers with. Nothing is sent or filed.
   (5) YOUR HISTORY WITH THEM (partyHistoryOf) reads only your own book:
       others with the same party whatever the case, signed since when,
       their dated duties kept or late; a code-named deal is left out.
   (6) THE WIRING: the arrival door marks the reading, the reading's finish
       owes the words, Home's panel says them before it decides what to show,
       and a press goes to firstReadPress.
   AT THE PARENT (ff908e4) every part fails: none of these names exist.
   ============================================================ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const bare = s => String(s).replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^\s*\/\/.*$/gm, ' ');
const fnOf = (src, head) => { const i = src.indexOf(head); assert.ok(i >= 0, head + ' is there');
  const ends = ['\nfunction ', '\nasync function ', '\nObject.assign(', '\nconst ', '\n/* '].map(e => src.indexOf(e, i + head.length)).filter(j => j > 0);
  return src.slice(i, ends.length ? Math.min(...ends) : undefined); };
/* the stage's arrays live in another window; their words are what is compared */
const plain = x => JSON.parse(JSON.stringify(x));
/* his words are escaped for the bubble */
const said = s => String(s).replace(/&#39;/g, "'").replace(/&amp;/g, '&');

/* a stage with the real arrival reader and both books; the readings it sorts
   (the risk list, the standards check, the history) are doubles */
function stage(o = {}){
  const { win } = buildWorld({ triage: true });
  win.state = win.state || {}; win.state.contracts = o.book || [];
  win.riskOpenOf = () => (o.risks || []).map(r => Object.assign({ src: 'scan', id: r.title }, r));
  win.riskTitleOf = it => it.title; win.riskWhyOf = it => it.why || '';
  win.stdDepartures = () => o.deps || [];
  win.partyHistoryOf = () => o.hist || null;
  win.partyHistorySay = h => h ? 'HIST:' + h.n : '';
  win.isUpload = c => !!(c && c.upload);
  win.intel = { history: [], dockOpen: false };
  const saved = []; win.persist = c => saved.push(c.id);
  return { win, saved };
}
const upload = (extra = {}) => Object.assign({ id: 'MK-1', name: 'SaaS', counterparty: 'Nordvik Logistik AB', upload: { extractedText: 'words' },
  status: 'Draft', triage: { steps: { brief: { ok: true, line: 'They use your software for three years.' } } } }, extra);

describe('f862 (1) — the one reading sorts what the arrival reading found', () => {
  test('high risks and standards departures are push back; the rest read later; the road follows', () => {
    const { win } = stage({ risks: [{ title: 'Uncapped liability', sev: 'high', why: 'You could owe anything. Really.' }, { title: 'Payment in 60 days', sev: 'med' }],
      deps: [{ category: 'Termination', status: 'deviation' }, { category: 'uncapped liability', status: 'missing' }] });
    const R = win.firstReadOf(upload());
    assert.deepEqual(plain(R.push.map(x => x.title)), ['Uncapped liability', 'Termination'], 'the standard already said as a risk is not said twice');
    assert.equal(R.push[0].why, 'You could owe anything.', 'one sentence of why');
    assert.deepEqual(plain(R.later.map(x => x.title)), ['Payment in 60 days']);
    assert.equal(R.road, 'negotiate');
    assert.equal(R.short, 'They use your software for three years.');
    assert.equal(R.party, 'Nordvik Logistik AB');
  });
  test('nothing to push back on: send; a signed paper: no road', () => {
    const { win } = stage({ risks: [{ title: 'Payment in 60 days', sev: 'low' }] });
    assert.equal(win.firstReadOf(upload()).road, 'send');
    assert.equal(win.firstReadOf(upload({ status: 'Signed' })).road, null);
  });
});

describe('f862 (2) — the two turns, in his words', () => {
  test('who and in short, then the lists capped with the cap said, and the road with its lead filled', () => {
    const risks = ['A', 'B', 'C', 'D', 'E'].map(t => ({ title: 'Risk ' + t, sev: 'high' }));
    const { win } = stage({ risks, hist: { n: 2 } });
    const T = win.firstReadTurns(upload());
    assert.equal(T.length, 2);
    assert.match(T[0].text, /names Nordvik Logistik AB as the other side/);
    assert.match(T[0].text, /HIST:2/, 'your history with them is said');
    assert.match(T[0].text, /In short: They use your software/);
    assert.deepEqual(plain(T[0].choices.map(c => c.fr)), ['yes', 'other']);
    assert.match(said(T[1].text), /5 things I'd push back on now/);
    assert.equal((T[1].text.match(/<li>/g) || []).length, 3, 'three shown');
    assert.match(T[1].text, /And 2 more\./, 'A CAP IS A FACT');
    assert.deepEqual(plain(T[1].choices.map(c => c.fr)), ['nego', 'send'], 'the recommended road first');
    assert.equal(T[1].choices[0].lead, true);
    assert.ok(!T[1].choices[1].lead, 'one filled button');
  });
  test('no party read: he asks who; a file with no words: he says so and stops', () => {
    const { win } = stage({});
    const T = win.firstReadTurns(upload({ counterparty: '' }));
    assert.match(said(T[0].text), /couldn't find who the other side is/);
    assert.deepEqual(plain(T[0].choices.map(c => c.fr)), ['other']);
    const U = win.firstReadTurns(upload({ triage: { error: 'no text', steps: {} } }));
    assert.equal(U.length, 1); assert.match(said(U[0].text), /couldn't read any words/); assert.equal(U[0].choices, null);
  });
  test('the words come from both books', () => {
    const { win } = stage({});
    const sv = read('js/i18n.js');
    for (const k of ['fr_party', 'fr_push_head_other', 'fr_road_nego', 'fr_go_send', 'ph_signed_since_other', 'ph_kept'])
      assert.equal((sv.match(new RegExp('\\n    ' + k + ':', 'g')) || []).length, 2, k + ' in both books');
    assert.notEqual(win.i18t('fr_go_nego'), 'fr_go_nego');
  });
});

describe('f862 (3) — he speaks once, and only for an upload', () => {
  test('an upload owes; a drafted contract does not; owed once', () => {
    const { win, saved } = stage({});
    const c = upload();
    assert.equal(win.firstReadOwe(c), true); assert.equal(c.triage.sayOwed, true); assert.deepEqual(plain(saved), ['MK-1']);
    assert.equal(win.firstReadOwe(c), false, 'not twice');
    const d = upload({ id: 'MK-2', upload: null });
    assert.equal(win.firstReadOwe(d), false); assert.ok(!d.triage.sayOwed);
  });
  test('Home says them when that paper is up, stamps saidAt, and never again', () => {
    const { win } = stage({ risks: [{ title: 'Uncapped liability', sev: 'high' }] });
    const c = upload(); c.triage.sayOwed = true;
    win.pdOnPaper = () => true; win.pdContract = () => c;
    assert.equal(win.firstReadDue(), true);
    assert.equal(win.intel.history.length, 2); assert.ok(c.triage.saidAt);
    assert.equal(win.firstReadDue(), false); assert.equal(win.intel.history.length, 2, 'once');
  });
  test('never over an open face or another tab, never while an answer is on its way', () => {
    const { win } = stage({});
    const c = upload(); c.triage.sayOwed = true;
    win.pdOnPaper = () => true; win.pdContract = () => c;
    win.pdFaceNow = () => 'red'; assert.equal(win.firstReadDue(), false, 'not over the Redlines face');
    win.pdFaceNow = () => ''; win.pdTab = () => 'doc'; assert.equal(win.firstReadDue(), false, 'only beside the Dossier');
    win.pdTab = () => 'copilot'; win.intel.busy = true; assert.equal(win.firstReadDue(), false, 'not while an answer is on its way');
    win.intel.busy = false; assert.equal(win.firstReadDue(), true);
  });
  test('never snatches the panel from a hand in it: a press inside it after the paper landed holds his words', () => {
    const { win } = stage({});
    /* the panel's own reading (js/paperdesk.js), taken whole: the world does not carry that file */
    const pd = read('js/paperdesk.js');
    const from = pd.indexOf('let _pdLand = '), to = pd.indexOf('function pdTalkKey(){');
    assert.ok(from > 0 && to > from, 'pdHandIn is there');
    win.eval(pd.slice(from, to).replace(/^function (\w+)/gm, 'window.$1 = function $1').replace(/^let _pdLand/m, 'var _pdLand').replace('document._pdHandWired', 'document._pdHandWired862'));
    const c = upload({ id: 'MK-H' }); c.triage.sayOwed = true;
    win.pdOnPaper = () => true; win.pdContract = () => c;
    assert.equal(win.pdHandIn(c), false, 'the paper landed, nobody has touched the panel');
    const dock = win.document.createElement('div'); dock.id = 'ig-dock'; const b = win.document.createElement('button'); dock.appendChild(b); win.document.body.appendChild(dock);
    b.dispatchEvent(new win.Event('pointerdown', { bubbles: true }));
    assert.equal(win.pdHandIn(c), true, 'a hand in the panel');
    assert.equal(win.firstReadDue(), false); assert.equal(win.intel.history.length, 0);
    const other = upload({ id: 'MK-O' }); win.pdHandIn(other);
    assert.equal(win.pdHandIn(c), false, 'the paper opened again: he may speak');
    assert.equal(win.firstReadDue(), true);
  });
  test('a contract read before this existed stays quiet; nothing is said off the paper or mid-reading', () => {
    const { win } = stage({});
    const old = upload(); win.pdContract = () => old;
    win.pdOnPaper = () => true; assert.equal(win.firstReadDue(), false, 'no sayOwed');
    old.triage.sayOwed = true; win.pdOnPaper = () => false; assert.equal(win.firstReadDue(), false, 'not on the paper');
    win.pdOnPaper = () => true; old._triaging = true; assert.equal(win.firstReadDue(), false, 'still reading');
    assert.equal(win.intel.history.length, 0);
  });
});

describe('f862 (4) — each answer is an existing door', () => {
  test('yes, someone else, negotiate, just send it', () => {
    const { win } = stage({});
    const c = upload(); win.getContract = () => c;
    const kt = []; win.pdFillOpen = (id, o) => kt.push([id, o && o.key]); let back = 0; win.pdTalkBack = () => back++;
    const red = []; win.CA_GO = { redline: x => red.push(x.id) };
    const m = { choices: [1] };
    win.firstReadPress({ fr: 'yes', cid: c.id }, m);
    assert.equal(m.choices, null, 'an answer is spent once pressed');
    assert.match(win.intel.history.at(-1).text, /keep Nordvik Logistik AB as the other side/);
    const n = win.intel.history.length;
    win.firstReadPress({ fr: 'other', cid: c.id }, {});
    assert.deepEqual(plain(kt), [['MK-1', 'counterparty']], 'the fill-in door, on the other side\'s name');
    assert.equal(back, 1, 'the panel turns back from the talk to the Dossier');
    assert.equal(win.intel.history.length, n, 'no words that would pull the panel back to the talk');
    win.firstReadPress({ fr: 'nego', cid: c.id }, {});
    assert.deepEqual(plain(red), ['MK-1'], 'the Redlines face');
    win.firstReadPress({ fr: 'send', cid: c.id }, {});
    assert.deepEqual(JSON.parse(JSON.stringify(win.intel.history.at(-1).act)), { kind: 'go', place: 'share', cid: 'MK-1' }, 'the share card, which sends nothing itself');
  });
});

describe('f862 (5) — your history with them, from your own book only', () => {
  const cu = read('js/views/customers.js');
  function shelf(book){
    const { win } = buildWorld({});
    win.state = win.state || {}; win.state.contracts = book;
    win.todayISO = () => '2026-10-22';
    win.contractSignedAt = c => c.signedDay || null;
    win.precedentMine = () => ({ pay: { category: 'Payment terms', unit: 'days', theirs: { accepted: 0, refused: 2 }, numbers: { theirsAccepted: [] } } });
    win.precedentLine = p => 'PUSHED:' + p.category;
    for (const h of ['function cuNameOf(', 'function cuKeyOf(', 'function cuBook(', 'function partyHistoryOf(', 'function partyHistorySay(']){
      const src = fnOf(cu, h); win.eval(src.replace(/^function (\w+)/, 'window.$1 = function $1'));
    }
    return win;
  }
  test('others with the same party, signed since when, their duties, what they pushed on', () => {
    const now = { id: 'N', counterparty: 'Nordvik Logistik AB' };
    const book = [now,
      { id: 'A', counterparty: 'nordvik  logistik ab', signedDay: '2024-03-01', status: 'Signed',
        obligations: [{ party: 'theirs', due: '2024-05-01', status: 'done', completedAt: '2024-05-09' }, { party: 'theirs', due: '2024-06-01', status: 'done', completedAt: '2024-05-30' }, { party: 'ours', due: '2020-01-01' }] },
      { id: 'B', counterparty: 'Nordvik Logistik AB', signedDay: '2025-01-10', status: 'Signed' },
      { id: 'C', counterparty: 'Nordvik Logistik AB', _codeNamed: true },
      { id: 'D', counterparty: 'Nordvik Logistik AB', archived: true },
      { id: 'E', counterparty: 'Helio' }];
    const win = shelf(book);
    const h = win.partyHistoryOf(now);
    assert.deepEqual({ n: h.n, signed: h.signed, since: h.since, late: h.late, kept: h.kept, pushed: h.pushed },
      { n: 2, signed: 2, since: '2024', late: 1, kept: 1, pushed: 'PUSHED:Payment terms' });
    assert.equal(win.partyHistorySay(h), "You've signed 2 other agreements with Nordvik Logistik AB, the first in 2024. One of their dated duties was late. PUSHED:Payment terms");
  });
  test('a first contract says so; a code-named one says nothing', () => {
    const now = { id: 'N', counterparty: 'Brightline Studio AB' };
    const win = shelf([now]);
    assert.equal(win.partyHistorySay(win.partyHistoryOf(now)), 'This is your first contract with Brightline Studio AB.');
    assert.equal(win.partyHistoryOf({ id: 'X', counterparty: 'Brightline Studio AB', _codeNamed: true }), null);
  });
});

describe('f862 (6) — the wiring', () => {
  test('the arrival door marks it, the finish owes it, Home says it, a press reaches it', () => {
    const tri = bare(read('js/triage.js'));
    assert.match(fnOf(tri, 'function contractArrived('), /triageAndPaint\(c, o\.read === true \? \{ asked: true, arrival: true \} : \{ arrival: true \}\)/);
    const ct = bare(read('js/views/contract.js'));
    assert.match(fnOf(ct, 'function triageAndPaint('), /opts && opts\.arrival && window\.firstReadOwe\) try\{ firstReadOwe\(/);
    const ig = bare(read('js/views/intelligence.js'));
    const dock = fnOf(ig, 'function renderIntelDock(');
    /* RE-POINTED 22 Oct 2026: said AFTER the talk settles this paint, then the talk looks again
       (words said alongside a landing answer were filed as that answer's and never turned the panel) */
    const talk = dock.indexOf('pdTalkSync(dock)'), due = dock.indexOf('firstReadDue()'), again = dock.indexOf('pdTalkSync(dock)', due);
    assert.ok(talk > 0 && due > talk && again > due, 'said after the talk settles, and the talk looks again');
    assert.match(ig, /if\(c\.fr&&typeof window\.firstReadPress==='function'\)\{ firstReadPress\(c,m\); renderIntelDock\(\); return; \}/);
    assert.match(ig, /class="ui-btn ui-btn-sm\$\{c\.lead\?' ui-btn-primary':''\}" data-ig-choice=/);
  });
  test('no new AI call and nothing sent: the reading calls no route', () => {
    const tri = bare(read('js/triage.js'));
    const body = tri.slice(tri.indexOf('function firstReadFrozen('), tri.indexOf('Object.assign(window, { FIRST_READ_SHOW'));
    assert.doesNotMatch(body, /\bapi\(|fetch\(|\/api\/|negoFileChange|changes\.push/);
  });
});
