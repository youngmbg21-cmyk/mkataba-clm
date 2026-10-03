/* ============================================================
   F451 — Where the deal stands
   ============================================================
   Idea 15 of the seventeen, picked by Young on 3 October 2026 after four
   whole screens were drawn for him, and built on the 4th: *"Build all your
   recommendations."*

   ONE PAGE, AT ONE ADDRESS, THAT EVERY PARTY READS IDENTICALLY. Today a deal
   with three parties has three links and three pictures, and nobody is
   looking at the same thing.

   THE PAGE IS THE OVERLAP, NOT THE SUM, and that is the one rule everything
   else here follows. Every other feature in this product adds something to a
   screen one side owns. This is a single page with no owner, read by people
   who are negotiating against each other, so a fact goes on it only if it can
   be shown to EVERY party. If it cannot be shown to one of them it is not on
   the page at all — not hidden for that reader, not greyed, not there.
   Anything else would need the page to know who is reading, and the whole
   value is that it does not.

   WHAT THAT RULES OUT is not a list of good intentions; each item is a wall
   somewhere else in this product that one careless line here would walk
   through: the internal review the counterparty never learns happened; who on
   our side was asked to do what; any party's notes, walled into one named
   party's room on 3 October; money not put to every party; anything that
   reads as advice. AND PEOPLE — not even our own negotiator. A change's
   author travels to the counterparty today, but a third party that only signs
   has never been told who argues on our side, and this page is read by all of
   them at one address. So "Lately" says the SIDE and the act, never a name.

   AND NO SEAT WORD. "You" and "them" are the only words on a HaTi screen that
   mean different things to different readers, so the reading answers in PARTY
   NAMES — negWhoseMove's 'you'/'them' is turned into a name before anything
   is drawn. A page that says "your turn" to three parties at one address is
   lying to two of them.

   READING MUST NOT WRITE, and here it is load-bearing rather than tidy.
   negoChanges, negoProgress and negoRound all run negoInit, which CREATES a
   negotiation on a contract that has none — and this reading is asked for
   every contract with a status link, including signed paper that was imported
   and never negotiated. The server then freezes the wording it just invented.
   So everything reads c.changes and c.negotiation RAW.

   IT SPENDS NOTHING. No model writes a word of this page, which is what lets
   it be served to a stranger at a public address with no key, no budget and
   no wait. deal-stands-verify 6a counts every generative route while the tab
   is drawn and requires zero.

   THE DRAWING IS MEASURED IN A BROWSER (deal-stands-verify, 19 checks): the
   sheet, the party names, the lit step, the open point named by its clause,
   and every seeded secret looked for by name in what was painted. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const DS = read('js/dealstands.js');
const CONTRACT = read('js/views/contract.js');
const APP = read('js/app.js');
/* Comments carry the names of the very things this file forbids, so every
   sweep of the source runs over the CODE alone. */
const code = s => String(s).replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1 ');
const DSC = code(DS);

const iso = n => new Date(Date.now() + n * 864e5).toISOString();
function deal(extra){
  return { id: 'MK-D1', contractNo: 'MK-D1', name: 'Master Services Agreement',
    counterparty: 'Nordbygg AB', status: 'Under Review', value: 2400000,
    changes: [
      { id: 'CHG-1', status: 'accepted', authorSide: 'counterparty', clauseId: 'c4',
        clauseLabel: '4. Payment Terms', author: 'Tomas Backroom', resolvedBy: 'Tomas Backroom',
        createdAt: iso(-8), resolvedAt: iso(-7) },
      { id: 'CHG-2', status: 'pending', authorSide: 'owner', clauseId: 'c9',
        clauseLabel: '9. Liability Cap', author: 'Tomas Backroom', createdAt: iso(-3) },
    ],
    negotiation: { round: 2, rounds: [{ n: 1, at: iso(-4), changes: [] }] },
    signatures: [], obligations: [], thread: [], ...extra };
}
function world(){
  const w = buildWorld({ contractView: true, negotiationView: true });
  return w.win;
}

describe('f451 (1) — the reading answers the deal, not the seat', () => {
  test('whose move is a party NAME, never "you" or "them"', () => {
    const win = world();
    const D = win.dealStands(deal());
    assert.ok(D && D.move, 'one point is open, so somebody holds it');
    assert.equal(D.move.party, 'Nordbygg AB',
      'we asked, so they answer — and the answer is a name every reader can check');
    assert.ok(!/you|them/i.test(D.move.party));
  });

  test('with nothing open it says so, rather than guessing a side', () => {
    const win = world();
    const c = deal();
    c.changes[1].status = 'accepted';
    const D = win.dealStands(c);
    assert.equal(D.move, null, 'an absence is stated, never invented');
    assert.equal(D.agreed, true, 'every point answered and something was negotiated');
  });

  test('it counts the points the record holds, and parked asks only once', () => {
    const win = world();
    const c = deal();
    c.changes.push({ id: 'CHG-3', status: 'countered', authorSide: 'counterparty', clauseId: 'c9', createdAt: iso(-2) });
    c.changes.push({ id: 'CHG-4', status: 'superseded', authorSide: 'owner', clauseId: 'c9', createdAt: iso(-2) });
    const D = win.dealStands(c);
    assert.equal(D.total, 2, 'a parked ask is answered THROUGH its counter, and a superseded one is gone');
    assert.equal(D.open, 1);
    assert.equal(D.settled, 1);
  });

  test('the round and the journey are the record\'s own', () => {
    const win = world();
    const D = win.dealStands(deal());
    assert.equal(D.round, 2);
    assert.equal(D.steps.length, 4);
    assert.equal(D.steps.map(s => s.key).join(','), 'shared,negotiating,agreed,signed');
    assert.equal(D.steps.find(s => s.now).key, 'negotiating');
  });
});

describe('f451 (2) — the overlap, not the sum', () => {
  test('no person is named anywhere in what it returns', () => {
    const win = world();
    const c = deal({ review: { by: 'Priya Internal Reviewer', open: ['CHG-2'] },
      thread: [{ id: 'm1', who: 'Priya Internal Reviewer', visibility: 'internal', text: 'hold this' }] });
    const flat = JSON.stringify(win.dealStands(c));
    for (const who of ['Tomas Backroom', 'Priya Internal Reviewer'])
      assert.ok(!flat.includes(who), `${who} is on the record and must not be on this page`);
  });

  test('nothing from the review or the notes reaches it', () => {
    const win = world();
    const c = deal({ review: { by: 'Priya', open: ['CHG-2'] },
      thread: [{ id: 'm1', who: 'Priya', visibility: 'internal', text: 'Zanzibarium' }] });
    const flat = JSON.stringify(win.dealStands(c));
    assert.ok(!flat.includes('Zanzibarium'), 'a note is walled into one party\'s room; this page has no room');
    assert.ok(!/"review"/.test(flat), 'the counterparty never learns a review happened');
  });

  test('and the source never reaches for any of them', () => {
    for (const name of ['c.review', 'c.thread', 'reviewInboxFor', 'negoNoteRoom', 'deskSeatOf', 'c.value'])
      assert.ok(!DSC.includes(name), `${name} has no business in a page with no side`);
  });

  test('no change id travels either — CHG-4 means nothing outside the negotiation', () => {
    const win = world();
    const D = win.dealStands(deal());
    assert.ok(D.points.every(p => !/CHG-/.test(JSON.stringify(p))));
    assert.ok(D.lately.every(e => !/CHG-/.test(JSON.stringify(e))));
  });
});

describe('f451 (3) — reading must not write', () => {
  test('a contract that never negotiated is untouched by being read', () => {
    const win = world();
    const c = { id: 'MK-Q1', name: 'Imported paper', counterparty: 'Someone', status: 'Signed' };
    win.dealStands(c);
    assert.ok(!('negotiation' in c), 'negoInit would have put one here, and the server freezes it at signature');
    assert.ok(!('changes' in c));
  });

  test('and the source asks none of the readings that start one', () => {
    for (const name of ['negoChanges(', 'negoAllChanges(', 'negoProgress(', 'negoRound(', 'negoClauseList('])
      assert.ok(!DSC.includes(name), `${name} runs negoInit — it creates what it claims to count`);
  });
});

describe('f451 (4) — it spends nothing, and it is one reading', () => {
  test('no route, no model, no key', () => {
    for (const name of ['/api/ai', "api('ai", 'anthropic', 'fetch('])
      assert.ok(!DSC.includes(name), `${name} would make a public page wait on a budget`);
  });
  test('the two in-app surfaces call ONE builder', () => {
    assert.equal((DSC.match(/function standsHtml\(/g) || []).length, 1,
      'two surfaces may DRAW differently; the reading may never differ');
    assert.match(DSC, /function paintStandsPane\(/, 'and the tab paints it on arrival');
  });
});

describe('f451 (5) — the tab, and what it did not disturb', () => {
  test('Where we are is in ROOM_TABS, second', () => {
    const win = world();
    const keys = win.ROOM_TABS.map(t => t[0]);
    assert.equal(keys[0], 'terms', 'the Overview still leads, and roomOpenOnTerms with it');
    assert.equal(keys[1], 'stands');
  });

  test('its pane is a SLOT, painted on arrival rather than built with the room', () => {
    assert.match(CONTRACT, /data-ws-pane="stands"/);
    assert.match(CONTRACT, /id="ws-stands-pane"/);
    assert.match(CONTRACT, /if\(_wsTab==='stands'\) try\{ paintStandsPane\(c\); \}/,
      'what it says moves with every change filed or answered');
  });

  test('the module is loaded by the app and by the harnesses', () => {
    assert.match(APP, /import '\.\/dealstands\.js';/);
    assert.match(read('test/world.js'), /js\/dealstands\.js/,
      'the browser harnesses do not load index.html — a new js/ file must be added there too');
    assert.match(read('test/portalworld.js'), /js\/dealstands\.js/);
  });
});

describe('f451 (6) — both books', () => {
  const I18N = read('js/i18n.js');
  for (const k of ['ds_eyebrow', 'ds_whose', 'ds_still_open', 'ds_never_shows', 'tab_where_we_are',
    'ds_ev_asked', 'ds_move_nobody', 'ds_role_negotiates'])
    test(`${k} is in both books`, () => {
      assert.equal((I18N.match(new RegExp('\\b' + k + ':', 'g')) || []).length, 2);
    });
  test('and not one of them carries a seat word', () => {
    const en = I18N.slice(I18N.indexOf("ds_eyebrow: '"), I18N.indexOf('tab_where_we_are:'));
    assert.ok(!/\b(your|yours|their|theirs)\b/i.test(en),
      'a page read by every party at one address cannot say "your turn"');
  });
});
