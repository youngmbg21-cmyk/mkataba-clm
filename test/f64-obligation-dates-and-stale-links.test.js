/* ============================================================
   F64 — the SECOND instance of two patterns that were only fixed once
   ============================================================

   PART A — A DUE DATE IS NOT ALWAYS A DATE (the expiry bug, on obligations).

   F56 taught the expiry field that a date can arrive typed by a human. The
   obligation due date is the same field with a different name and it was left
   exactly as it was: `runFindObligations` files whatever the model put in
   `due`, and the model is told "ISO yyyy-mm-dd if a concrete date is stated"
   and answers "31 March 2027" often enough to matter. A hand-typed migration
   spreadsheet does the same.

   Nothing throws — which is why nobody noticed. The calendar grid is keyed by
   YYYY-MM-DD, so the event is built, counted, and then drawn on NO DAY AT ALL.
   `daysUntil` returns NaN, so every comparison against it is false: the
   obligation never appears in the sixty-day agenda, never reaches the sidebar
   count, and — the one that costs money — never becomes overdue, however long
   ago it was due. A payment obligation the customer asked Copilot to find, that
   Copilot found, silently tracked as "open" forever.

   PART B — THE COUNTERPARTY'S LINK IS A PHOTOCOPY, in the other direction.

   `refreshLiveShareQuietly` was added so that when a counterparty's answers are
   applied, the link they hold stops replaying the negotiation as it stood
   before they answered. It is called from exactly one place: applyResponse.

   The mirror image was never walked. The counterparty asks for a change of
   their own; the owner opens the room and accepts it. The record is right, the
   owner's screen is right — and the counterparty's link still serves the
   payload taken before the decision existed. They reload, and their own ask is
   back to "waiting on the other side" on a change that was accepted days ago.
*/
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { loadViews, STUB_TEMPLATES, STUB_FOLDERS } = require('./dom');
const { buildWorld } = require('./world');
const F = require('./clausefixtures.js');

/* ------------------------------------------------------------------ Part A */

const iso = off => {
  const d = new Date(Date.now() + off * 86400000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
/* The same calendar day, written the way a person writes it — which is what
   comes back from the model and out of a migration spreadsheet. */
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];
const humanDay = off => {
  const d = new Date(Date.now() + off * 86400000);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

const withObligation = due => ({
  id: 'MK-OBL', name: 'Distribution agreement — Tamu Beverages',
  counterparty: 'Tamu Beverages Ltd', folder: 'proc', status: 'Under Review',
  value: 3200000, valueType: 'standard', expiry: null, metadata: {},
  audit: [], comments: [], signatures: [],
  obligations: [{ id: 'ob_1', desc: 'Pay the quarterly minimum', due, recurring: 'quarterly',
    status: 'open', quote: 'The Distributor shall pay…' }],
});

function screens(contracts) {
  return loadViews(['js/obligations.js', 'js/views/calendar.js'], {
    TEMPLATES: STUB_TEMPLATES, FOLDERS: STUB_FOLDERS,
    state: { contracts, settings: {}, view: 'calendar',
      serverStats: { total: contracts.length }, shareOverview: {}, shareByContract: {} },
  });
}

describe('F64 — an obligation due date a person typed still reaches the calendar', () => {
  test('the event keys to a real grid cell', () => {
    const sb = screens([withObligation(humanDay(10))]);
    const ev = sb.calendarEvents().find(e => e.type === 'obligation');
    assert.ok(ev, 'the obligation must produce an event at all');
    assert.equal(ev.date, iso(10),
      'the grid is keyed by YYYY-MM-DD — anything else is drawn on no day at all');
  });

  test('and it appears in the sixty-day agenda', () => {
    const sb = screens([withObligation(humanDay(10))]);
    sb.renderCalendar();
    const html = sb.document.getElementById('content').innerHTML;
    assert.ok(html.includes('Pay the quarterly minimum') || html.includes('MK-OBL'),
      'an obligation due in ten days belongs on the next-60-days list');
    assert.ok(!html.includes('Nothing due in the next 60 days'),
      'the agenda must not report an empty diary over an obligation it holds');
  });

  test('a due date that has passed is overdue, however it was written', () => {
    const sb = screens([]);
    assert.equal(sb.obState({ status: 'open', due: humanDay(-30) }), 'overdue',
      'an obligation 30 days past due is overdue — NaN < 0 is false, and silence is the wrong answer');
    assert.equal(sb.obState({ status: 'open', due: iso(-30) }), 'overdue');
    assert.equal(sb.obState({ status: 'open', due: iso(30) }), 'open');
    assert.equal(sb.obState({ status: 'done', due: iso(-30) }), 'done');
  });

  test('a due date that is no kind of date is simply undated, not a crash and not a guess', () => {
    const sb = screens([withObligation('on completion of Phase 2')]);
    assert.equal(sb.obState({ status: 'open', due: 'on completion of Phase 2' }), 'open',
      'we do not know when it is due, so it is not overdue');
    const evs = sb.calendarEvents().filter(e => e.type === 'obligation');
    assert.equal(evs.length, 0,
      'an undated obligation must not be built as an event that lands on no day');
    sb.renderCalendar();
    assert.match(sb.document.getElementById('content').innerHTML, /cal-day/,
      'and the calendar still draws');
  });

  test('a clean ISO date is untouched', () => {
    const sb = screens([withObligation(iso(5))]);
    assert.equal(sb.calendarEvents().find(e => e.type === 'obligation').date, iso(5));
  });
});

/* Found while fixing the above, and worse than the thing it was found under:
   the normaliser handed every unrecognised string to Date.parse, and outside
   the ISO grammar Date.parse falls back to a parser that finds a date in almost
   anything. So "Phase 2" was not "we do not know when this expires" — it was
   1 February 2001, stated as fact, on a contract that then read as long expired
   and drew itself on a calendar twenty-five years ago. */
describe('F64 — a label that is not a date does not become a date', () => {
  const only = () => screens([]).dateOnly;

  test('free text the engine would guess at is refused', () => {
    const dateOnly = only();
    for (const junk of ['Phase 2', 'clause 4.2', 'on completion of Phase 2',
      'Annex 3', 'to be confirmed', 'TBC 2027', 'upon delivery, 2027', '2026',
      'within 30 days of invoice', 'Q1 2027']) {
      assert.equal(dateOnly(junk), null, `"${junk}" is not a date and must not become one`);
    }
  });

  test('the shapes people really write are still read', () => {
    const dateOnly = only();
    assert.equal(dateOnly('30 September 2026'), '2026-09-30');
    assert.equal(dateOnly('30 Sept 2026'), '2026-09-30');
    assert.equal(dateOnly('September 30, 2026'), '2026-09-30');
    assert.equal(dateOnly('Sep 30 2026'), '2026-09-30');
    assert.equal(dateOnly('2026/09/30'), '2026-09-30');
    assert.equal(dateOnly('2026-09-30'), '2026-09-30');
    assert.equal(dateOnly('2026-09-30T14:22:07.001Z'), '2026-09-30');
  });

  test('a month that is not a month is a label, not a date', () => {
    assert.equal(only()('Foo 30, 2026'), null);
  });
});

/* ------------------------------------------------------------------ Part B */

/* The owner's room, with one ask the counterparty put on the table and one of
   the owner's own that the counterparty refused — the two states an owner
   actually answers from. `refreshLiveShareQuietly` is spied rather than run:
   what is under test is whether the decision path calls the silent catch-up at
   all, and F61 already proves end to end against the real server what that call
   does when it lands. */
async function ownersRoom(){
  const { win } = buildWorld({ negotiationView: true, contractView: true });
  const c = { id: 'MK-700', name: 'Warehousing and Logistics Services Agreement',
    counterparty: 'Nordfrakt Logistik AB', template: 'WH', status: 'Under Review',
    folder: 'dist', fields: {}, metadata: {}, audit: [], rounds: [], versions: [],
    signatures: [], comments: [], redlineText: F.protoRich(), format: 'rich' };
  win.negoInit(c);
  const file = async (num, side, author) => {
    const cl = win.negoClauseList(c).find(x => x.num === num);
    return win.negoEditClause(c, cl.clauseId, `<p>${F.PROTO_ASKS[num].text}</p>`,
      { side, author, summary: F.PROTO_ASKS[num].summary });
  };
  const theirs = await file('4', 'counterparty', 'Erik Lindqvist');
  const ours = await file('9', 'owner', 'Wanjiru Kamau');
  win.negoResolve(c, ours.id, 'rejected', { side: 'counterparty', by: 'Erik Lindqvist' });

  const refreshed = [], emailed = [];
  win.refreshLiveShareQuietly = x => { refreshed.push(x); };
  win.reshareToLastRecipient = x => { emailed.push(x); return Promise.resolve({}); };
  win.negoResetView();
  win.openNegotiationOwnerRoom(c);
  const press = (id, sel) => {
    const card = win.document.querySelector(`[data-nego-card="${id}"]`);
    const btn = card && card.querySelector(sel);
    assert.ok(btn, `the room must offer ${sel} on #${id}`);
    btn.dispatchEvent(new win.Event('click', { bubbles: true }));
  };
  return { win, c, theirs, ours, refreshed, emailed, press };
}

describe('F64 — the counterparty’s link hears the owner’s answer too', () => {
  test('accepting their ask catches their link up', async () => {
    const t = await ownersRoom();
    t.press(t.theirs.id, '[data-nego-accept]');
    assert.equal(t.win.negoChangeById(t.c, t.theirs.id).status, 'accepted', 'the record has it');
    assert.equal(t.refreshed.length, 1,
      'and so must the link they hold — otherwise they reload and their own ask '
      + 'is back to "waiting on the other side" on something answered days ago');
    assert.equal(t.refreshed[0], t.c, 'this contract, not another');
  });

  test('rejecting it catches the link up as well', async () => {
    const t = await ownersRoom();
    // Reject asks for a reason first, so the handler is async — answer the
    // prompt the way the owner would and let the decision settle.
    t.win.promptDialog = () => Promise.resolve('Net-30 stands.');
    t.press(t.theirs.id, '[data-nego-reject]');
    await new Promise(r => setImmediate(r));
    assert.equal(t.win.negoChangeById(t.c, t.theirs.id).status, 'rejected');
    assert.equal(t.refreshed.length, 1, 'a refusal is an answer and they have to be able to see it');
  });

  test('withdrawing our own refused ask does too', async () => {
    const t = await ownersRoom();
    t.press(t.ours.id, '[data-nego-withdraw]');
    assert.equal(t.win.negoChangeById(t.c, t.ours.id).withdrawn != null, true);
    assert.equal(t.refreshed.length, 1,
      'letting an ask go is what clears the deadlock — a reader who cannot see it '
      + 'has not had it cleared');
  });

  test('and the catch-up is the silent one — nothing is sent to anybody', async () => {
    const t = await ownersRoom();
    t.press(t.theirs.id, '[data-nego-accept]');
    assert.equal(t.emailed.length, 0,
      'answering a change must never email the counterparty or re-mark the link as sent');
  });
});
