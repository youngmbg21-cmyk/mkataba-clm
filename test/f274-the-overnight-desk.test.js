/* ============================================================
   F274 — The overnight desk (idea 19, three kinds)
   ============================================================
   Owner-ruled 9 Sep 2026, off the ideas artifact and one question that turned
   out to matter: *"what is the difference between the 3 or 5 things compared to
   the 'needs your decision' on home page?"* — which found a real overlap. A
   renewal inside 90 days is ALREADY a row in that list, so the one-door rule is
   asserted here as hard as the reading itself.

   THE CONTROL COMES FIRST. Every qualifying test below is one of the product's
   own predicates — renewalWindow, obState, obligationIsTheirs, triageOf — and a
   stage that could not answer them would make every claim in this file a
   description of a fallback. Section 1 proves the stage really reaches them
   before anything else is asserted. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');

const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
/* THE SWEEPS READ CODE, NOT PROSE. This file's own comments name the things it
   must never do ("there must never be a route"), so a grep over raw source
   would find the warning and report it as the fault. */
const strip = t => t.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1 ');
const DESK = read('js/desknight.js');
const DESK_CODE = strip(DESK);
const HOME = read('js/views/home.js');
const HOME_CODE = strip(HOME);
const I18N = read('js/i18n.js');
const APP = read('js/app.js');
const CSS = read('index.html');

const day = n => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };

/* The three contracts the desk is built to notice, one per kind. Each carries
   the SHAPE the product really stores rather than a flag invented here: a
   counterparty obligation past its date, an upload whose standards pass found
   something and that nobody has opened, and an agreement in force inside its
   renewal window. */
function stage(over){
  const { win, log } = buildWorld({ desk: true });
  const cs = [
    { id: 'MK-1', name: 'Supply', status: 'Signed', counterparty: 'Nordkust',
      counterpartyEmail: 'ops@nordkust.example', audit: [],
      obligations: [{ id: 'o1', desc: 'Quarterly volume report', due: day(-4),
        party: 'theirs', status: 'open' }] },
    { id: 'MK-2', name: 'Lease', status: 'Under Review', counterparty: 'Kibo Traders',
      source: 'upload', audit: [],
      triage: { at: day(-1), seenAt: null,
        steps: { playbook: { ok: true, dev: 2, miss: 1, cats: ['Payment terms', 'Liability'] } } } },
    { id: 'MK-3', name: 'Services', status: 'Signed', counterparty: 'Juno Logistics',
      expiry: day(40), audit: [],
      metadata: { noticePeriodDays: 30, expiryDate: day(40) } },
  ];
  win.state.contracts = cs;
  Object.assign(win, over || {});
  return { win, log, cs, byId: id => cs.find(c => c.id === id) };
}

describe('F274 — the overnight desk', () => {

  /* --------------------------------------------------------------- */
  describe('1 — the control: the stage really reaches the product’s readings', () => {
    test('all three qualifying predicates answer, so nothing below is a fallback', () => {
      const { win, byId } = stage();
      assert.equal(typeof win.renewalWindow, 'function', 'renewalWindow is on the stage');
      assert.equal(typeof win.obState, 'function', 'obState is on the stage');
      assert.equal(typeof win.triageOf, 'function', 'triageOf is on the stage');
      const w = win.renewalWindow(byId('MK-3'));
      assert.ok(w && w.inWindow, 'the renewal reading really answers for a contract in force');
      assert.equal(win.obState(byId('MK-1').obligations[0]), 'overdue',
        'the obligation reading really answers overdue');
      assert.ok(win.triageOf(byId('MK-2')), 'the triage reading really answers');
    });
  });

  /* --------------------------------------------------------------- */
  describe('2 — three kinds, and one row of each', () => {
    test('the three kinds are the owner’s three, in the order they read', () => {
      const { win } = stage();
      assert.deepEqual([...win.DESK_KINDS], ['chase', 'deviations', 'renewal'],
        'what needs you first, what a date did by itself last');
    });

    test('each kind finds its own contract and nothing else', () => {
      const { win } = stage();
      const got = [...win.deskItems()].map(x => [x.kind, x.cid]);
      assert.deepEqual(got, [['chase', 'MK-1'], ['deviations', 'MK-2'], ['renewal', 'MK-3']]);
    });

    /* THE CLAIM THE WHOLE CAP RESTS ON. Ranked as one flat list of the best
       three, a quiet kind loses every morning and never draws at all. */
    test('a book full of one kind cannot take every place on the desk', () => {
      const { win, cs } = stage();
      for (let i = 0; i < 6; i++)
        cs.push({ id: 'MK-R' + i, name: 'R' + i, status: 'Signed', counterparty: 'X',
          audit: [], expiry: day(10 + i), metadata: { expiryDate: day(10 + i) } });
      const all = win.deskItems();
      assert.ok(all.filter(x => x.kind === 'renewal').length >= 7, 'seven renewals qualify');
      const shown = [...win.deskShown(all)].map(x => x.kind);
      assert.deepEqual(shown, ['chase', 'deviations', 'renewal'],
        'at most one of each, so no kind can be crowded out');
    });

    /* THE ORDER IS DESK_KINDS' OWN, not a second table beside it. */
    test('the row order is read off DESK_KINDS, never restated', () => {
      assert.match(DESK_CODE, /DESK_KINDS\.indexOf\(k\)/);
      assert.ok(!/\{\s*chase:\s*0,\s*deviations:\s*1/.test(DESK_CODE),
        'a second table would drift the day a kind moves');
    });

    test('within a kind the one that matters most leads', () => {
      const { win, cs } = stage();
      cs[0].obligations.push({ id: 'o2', desc: 'Insurance certificate', due: day(-40),
        party: 'theirs', status: 'open' });
      const chases = win.deskItems().filter(x => x.kind === 'chase');
      assert.equal(chases[0].ob.id, 'o2', 'the latest promise leads');
      assert.ok(chases[0].days > chases[1].days);
    });

    test('a kind with nothing to say draws no row', () => {
      const { win, cs } = stage();
      cs.length = 0;
      assert.deepEqual([...win.deskItems()], []);
    });
  });

  /* --------------------------------------------------------------- */
  describe('3 — what qualifies, and what deliberately does not', () => {
    test('an obligation of OURS is never chased — the route’s own refusal', () => {
      const { win, byId } = stage();
      byId('MK-1').obligations[0].party = 'ours';
      assert.equal(win.deskItems().filter(x => x.kind === 'chase').length, 0);
    });

    test('one already chased is not chased again the next morning', () => {
      const { win, byId } = stage();
      byId('MK-1').obligations[0].chasedAt = day(-1);
      assert.equal(win.deskItems().filter(x => x.kind === 'chase').length, 0);
    });

    /* DUE TODAY IS NOT LATE. Offering to chase somebody on the morning of
       their own deadline is the product being rude on the customer's behalf. */
    test('due today is not late enough to chase', () => {
      const { win, byId } = stage();
      byId('MK-1').obligations[0].due = day(0);
      assert.equal(win.deskItems().filter(x => x.kind === 'chase').length, 0);
      byId('MK-1').obligations[0].due = day(-1);
      assert.equal(win.deskItems().filter(x => x.kind === 'chase').length, 1);
    });

    test('a completed obligation is nobody’s to chase', () => {
      const { win, byId } = stage();
      byId('MK-1').obligations[0].status = 'done';
      assert.equal(win.deskItems().filter(x => x.kind === 'chase').length, 0);
    });

    test('no address on file is a FACT the row carries, not a refusal after the press', () => {
      const { win, byId } = stage();
      byId('MK-1').counterpartyEmail = '';
      const it = win.deskItems().find(x => x.kind === 'chase');
      assert.ok(it, 'the row is still drawn — the chase is still worth recording');
      assert.equal(it.noAddress, true, 'and it says so before anybody presses Send');
    });

    test('paper somebody has already opened leaves the desk', () => {
      const { win, byId } = stage();
      byId('MK-2').triage.seenAt = day(0);
      assert.equal(win.deskItems().filter(x => x.kind === 'deviations').length, 0,
        'acknowledging the strip on the contract clears this too — one fact, two ways to say yes');
    });

    test('paper that came back clean is not a row', () => {
      const { win, byId } = stage();
      byId('MK-2').triage.steps.playbook = { ok: true, dev: 0, miss: 0, cats: [] };
      assert.equal(win.deskItems().filter(x => x.kind === 'deviations').length, 0);
    });

    test('a contract still being negotiated is not up for renewal', () => {
      const { win, byId } = stage();
      byId('MK-3').status = 'Under Review';
      assert.equal(win.deskItems().filter(x => x.kind === 'renewal').length, 0,
        'renewalWindow’s own in-force rule, not a second copy of it');
    });

    test('a renewal past the 90-day window is not on the desk', () => {
      const { win, byId } = stage();
      byId('MK-3').expiry = day(400);
      byId('MK-3').metadata = { expiryDate: day(400) };
      assert.equal(win.deskItems().filter(x => x.kind === 'renewal').length, 0);
    });

    test('the shelf is quiet: archived and declined are off it', () => {
      const { win, cs } = stage();
      cs[0].archived = { at: day(-2) }; cs[1].status = 'Declined';
      const kinds = [...win.deskItems()].map(x => x.kind);
      assert.deepEqual(kinds, ['renewal']);
    });
  });

  /* --------------------------------------------------------------- */
  describe('4 — putting a row away', () => {
    test('a dismissed row does not come back', () => {
      const { win, byId } = stage();
      const it = win.deskItems().find(x => x.kind === 'renewal');
      assert.equal(win.deskDismiss(byId('MK-3'), it.key), true);
      assert.equal(win.deskItems().filter(x => x.kind === 'renewal').length, 0);
    });

    test('dismissing one kind leaves the others alone', () => {
      const { win, byId } = stage();
      win.deskDismiss(byId('MK-1'), 'chase:o1');
      assert.deepEqual([...win.deskItems()].map(x => x.kind), ['deviations', 'renewal']);
    });

    /* A CONTRACT CAN CARRY SEVERAL OF ONE KIND, so the key names the
       obligation as well: putting one late promise away must not put away
       the other. */
    test('the key names the obligation, so two on one contract are two rows', () => {
      const { win, byId } = stage();
      byId('MK-1').obligations.push({ id: 'o2', desc: 'Insurance', due: day(-9),
        party: 'theirs', status: 'open' });
      assert.equal(win.deskItems().filter(x => x.kind === 'chase').length, 2);
      win.deskDismiss(byId('MK-1'), 'chase:o2');
      const left = win.deskItems().filter(x => x.kind === 'chase');
      assert.equal(left.length, 1);
      assert.equal(left[0].ob.id, 'o1');
    });

    /* ABSENT ON EVERY RECORD ALREADY ON FILE — the whole migration story. */
    test('a record carrying no desk field reads exactly as it always did', () => {
      const { win, cs } = stage();
      for (const c of cs) assert.equal(c.desk, undefined, 'nothing is stamped by reading');
      assert.equal(win.deskItems().length, 3);
    });

    test('a viewer cannot dismiss', () => {
      const { win, byId } = stage({ canEdit: () => false });
      assert.equal(win.deskDismiss(byId('MK-3'), 'renewal'), false);
      assert.equal(byId('MK-3').desk, undefined);
    });
  });

  /* --------------------------------------------------------------- */
  describe('5 — ONE DOOR: a contract is not listed twice on one page', () => {
    /* The owner's own question, and it found the overlap: a renewal inside 90
       days is already a row in "Needs your decision", at exactly this window. */
    test('deskCids names the renewals, and only the renewals', () => {
      const { win } = stage();
      const ids = [...win.deskCids(win.deskItems())];
      assert.deepEqual(ids, ['MK-3'],
        'the chase and the deviations rows are different subjects and do not evict anything');
    });

    /* REVERSED IN PLACE (Young reported it 9 Sep 2026, off the sub-line: "it
       says 2 of 9 … where is the rest of the 9?"). This asserted the OPPOSITE —
       that a renewal held back by the cap still left the decisions list,
       because "the desk is going to offer it". IT IS NOT: the desk shows at
       most one renewal, so on a book with several due, one was on the desk and
       the rest were struck out of the list below and appeared NOWHERE. Home
       showed LESS than before the feature existed. Only what is ON SCREEN may
       evict anything. */
    test('a renewal the cap held back stays in the decisions list', () => {
      const { win, cs } = stage();
      cs.push({ id: 'MK-9', name: 'Second', status: 'Signed', counterparty: 'Y',
        audit: [], expiry: day(20), metadata: { expiryDate: day(20) } });
      const all = win.deskItems();
      const shown = win.deskShown(all);
      assert.equal(shown.filter(x => x.kind === 'renewal').length, 1,
        'only one renewal is on screen');
      assert.equal(all.filter(x => x.kind === 'renewal').length, 2, 'though two qualify');
      assert.deepEqual([...win.deskCids(shown)].sort(), ['MK-3'],
        'and only the one being drawn evicts anything — the other is still owed a row below');
    });

    test('Home filters the renewal source by the desk, and only that source', () => {
      assert.match(HOME_CODE, /\.\.\.decisions\.filter\(x=>!deskIds\.has\(x\.c\.id\)\)\.map\(/,
        'the renewal rows are the ones that move');
      /* AND IT IS BUILT FROM THE ROWS ON SCREEN. Handed deskAll it evicted
         every qualifying renewal while drawing one, so the rest were on
         neither list — the fault this whole section exists to prevent, running
         the other way. */
      assert.match(HOME_CODE, /deskCids\(deskRows\)/, 'only what is drawn may evict anything');
      assert.ok(!/deskCids\(deskAll\)/.test(HOME_CODE), 'never the whole list');
      for (const other of ['myReviews', 'myStaleDesks', 'myJoinAsks', 'waitingLongest'])
        assert.ok(!new RegExp(other + '\\.filter\\(x=>!deskIds').test(HOME_CODE),
          other + ' is a different subject and is never evicted by the desk');
    });

    test('Home draws the desk above the reader’s own list', () => {
      const i = HOME.indexOf('${deskSection}');
      const j = HOME.indexOf("hmSec(i18t('home_needs_decision')");
      assert.ok(i > 0 && j > i, 'prepared work leads, the reader’s own queue follows');
    });
  });

  /* --------------------------------------------------------------- */
  describe('6 — it decides nothing, sends nothing and files nothing', () => {
    /* THERE MUST NEVER BE A ROUTE. How far behind a company is on its own
       promises is that workspace's business. */
    for (const bad of ['api(', 'fetch(', "ai/"])
      test('the reading never reaches the network — ' + bad, () => {
        assert.ok(!DESK_CODE.includes(bad), bad + ' has no business in this reading');
      });

    /* IT COUNTS, IT DOES NOT DRAW — the Insights panels' rule. */
    for (const bad of ['innerHTML', '<div', '<button', 'document.'])
      test('the reading draws nothing — ' + bad, () => {
        assert.ok(!DESK_CODE.includes(bad), bad + ' belongs in the view, not the reading');
      });

    /* THE ONLY THING IT WRITES IS THE DISMISSAL STAMP. */
    test('nothing here files, sends, decides or audits', () => {
      for (const bad of ['logAudit', 'negoFileChange', 'contracts.unshift', 'toggleObligation',
        'obligationChase', 'sendEmail', 'runContractBrief', 'runPlaybookReview', 'extractObligations'])
        assert.ok(!DESK_CODE.includes(bad), bad + ' is not this reading’s to call');
    });

    test('the one write is the stamp, and it goes through the ordinary save', () => {
      const persists = DESK_CODE.match(/persist\(/g) || [];
      assert.equal(persists.length, 1, 'exactly one write, in deskDismiss');
      assert.match(DESK_CODE, /function deskDismiss[\s\S]*?persist\(c\)/);
    });

    test('reading the desk changes no record', () => {
      const { win, cs } = stage();
      const before = JSON.stringify(cs);
      win.deskShown(win.deskItems());
      assert.equal(JSON.stringify(cs), before, 'a reading that writes is not a reading');
    });
  });

  /* --------------------------------------------------------------- */
  describe('7 — it is loaded, published, and reachable', () => {
    test('js/app.js loads it, after the readings it asks', () => {
      const d = APP.indexOf("import './desknight.js'");
      const o = APP.indexOf("import './triage.js'");
      assert.ok(d > 0 && o > 0 && d > o, 'triage first, the desk after it');
    });

    /* A NAME ANOTHER MODULE REACHES THROUGH window IS UNREACHABLE UNLESS IT IS
       PUBLISHED — the rlPaperFootHtml fault, which fails in silence with a
       plausible fallback. Home reads all four through window. */
    test('every name Home reaches for is published', () => {
      for (const n of ['deskItems', 'deskShown', 'deskCids', 'deskDismiss'])
        assert.match(DESK, new RegExp('Object\\.assign\\(window,[\\s\\S]*\\b' + n + '\\b'),
          n + ' must leave js/desknight.js by name');
    });

    test('the row borrows the act row rather than declaring a second one', () => {
      assert.match(CSS, /\.hm-row\.is-tri,\.hm-row\.is-desk\{/, 'one rule, two wearers');
      assert.match(CSS, /\.hm-tri-acts,\.hm-desk-acts\{/);
    });
  });

  /* --------------------------------------------------------------- */
  describe('9 — the row Home draws', () => {
    /* THE DRIVEN CLAIMS ARE IN home-page-verify: whether the section is
       VISIBLE PIXELS above the reader's own list, whether a press really
       dismisses, and whether a contract is listed once. What is asked here is
       only what a source can honestly answer. */
    test('it is a div, because a button may not contain buttons', () => {
      const i = HOME.indexOf('function deskRowHtml');
      const body = HOME.slice(i, HOME.indexOf('\nfunction ', i + 10));
      assert.match(body, /<div class="hm-row is-desk/);
      assert.ok(!/<button type="button" class="hm-row/.test(body));
    });

    /* A VERB THAT CANNOT WORK IS NOT DRAWN. */
    test('Send is withheld where no message could go', () => {
      const i = HOME.indexOf('function deskRowHtml');
      const body = HOME.slice(i, HOME.indexOf('\nfunction ', i + 10));
      assert.match(body, /\(it\.noAddress\?'':B\('send'/,
        'no address on file means the row offers the contract instead');
      assert.match(body, /desk_chase_noaddr/, 'and says why');
    });

    test('every row carries a way to put it away', () => {
      const i = HOME.indexOf('function deskRowHtml');
      const body = HOME.slice(i, HOME.indexOf('\nfunction ', i + 10));
      assert.equal((body.match(/B\('discard'/g) || []).length, 3, 'one per kind');
    });

    /* AN EMPTY SECTION THAT SAYS SO EVERY MORNING IS FURNITURE. */
    test('nothing prepared draws no heading and no empty state', () => {
      assert.match(HOME_CODE, /const deskSection=deskRows\.length\?`/);
      assert.match(HOME_CODE, /<\/div>`:'';/);
    });

    /* NOT ONE OF THE ACTS IS A SECOND WAY OF DOING ANYTHING. */
    test('Send presses the product’s own chase, and nothing else sends', () => {
      assert.match(HOME_CODE, /await obligationChase\(cid,ob\)/);
      assert.ok(!/api\(`contracts\/\$\{[^}]*\}\/chase/.test(HOME_CODE),
        'Home never posts a chase itself');
    });

    /* NEVER THE DOCUMENT'S FORMATTER. fmtDocDate writes English months from a
       fixed list whatever language the reader has chosen — right on a contract
       and wrong on a screen — and the decisions list below reads its dates
       through fmtDDay, so one page would otherwise print one date two ways. */
    test('the date follows the reader, and it is the list’s own formatter', () => {
      const i = HOME.indexOf('function deskRowHtml');
      const body = HOME.slice(i, HOME.indexOf('\nfunction ', i + 10));
      assert.ok(!/fmtDocDate/.test(body), 'the document’s formatter has no business on a screen');
      assert.match(body, /fmtDDay\(when\)/);
      assert.equal((HOME_CODE.match(/const fmtDDay=/g) || []).length, 1,
        'one definition, two readers');
    });

    test('Open lands on the tab the row is about', () => {
      assert.match(HOME_CODE, /kind==='chase'\?'oblig':'terms'/,
        'a late promise lands on Obligations, the other two on Key terms');
    });
  });

  /* --------------------------------------------------------------- */
  describe('8 — the words, in both languages', () => {
    const KEYS = ['desk_sec', 'desk_sub_one', 'desk_sub_other', 'desk_showing', 'desk_discard',
      'desk_discard_all', 'desk_discard_q', 'desk_discard_msg', 'desk_discard_go',
      'desk_chase_t', 'desk_late_one', 'desk_late_other', 'desk_days_one',
      'desk_days_other', 'desk_chase_send', 'desk_chase_open', 'desk_chase_noaddr',
      'desk_dev_t_one', 'desk_dev_t_other', 'desk_dev_m', 'desk_dev_m_plain', 'desk_dev_tag',
      'desk_dev_open', 'desk_ren_t', 'desk_ren_by', 'desk_ren_late', 'desk_ren_notice', 'desk_ren_memo', 'desk_ren_flags_one',
      'desk_ren_flags_other', 'desk_ren_review'];
    for (const k of KEYS)
      test(k + ' is written in both books', () => {
        const hits = (I18N.match(new RegExp('^\\s*' + k + ':', 'gm')) || []).length;
        assert.equal(hits, 2, k + ' wants an English and a Swedish answer');
      });

    /* THE HEADER CLAIMS NO CLOCK TIME, and that is the truthfulness rule rather
       than a wording preference: HaTi does not yet do anything while nobody is
       watching, so "finished 05:40" would be the page inventing a night shift.
       What it DOES promise is the half the whole desk rests on. */
    test('the section promises what is true, and nothing more', () => {
      assert.match(I18N, /desk_sub_other: '\{n\} things · nothing was sent or filed'/);
      assert.ok(!/desk_sec: '[^']*05:40/.test(I18N), 'no clock time is claimed');
      assert.ok(!/desk_sec: '[^']*[Oo]vernight/.test(I18N),
        'nor a night shift the product does not yet run');
    });
  });
});
