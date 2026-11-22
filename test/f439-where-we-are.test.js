/* ============================================================
   f439 — their page has tabs and lands on "Where we are"
   ============================================================
   Young picked "Where we are" off three options on 29 Sep 2026 ("this is
   where the customer will see their working progress"), with Notes and Focus
   out of the More menu and a reason asked after every save.

   What is pinned here, off the counterparty's page as the real payload builds
   it:
     · three tabs — Where we are · Redlines · History — and the History tab
       wears the old button's id and draws the history IN the page;
     · Notes and Focus are buttons on the page; More keeps the two files;
     · the landing: a first visit, or something new FROM THE OTHER SIDE, opens
       Where we are; otherwise the tab they left; their own acts never move it;
     · "Waiting on you" is the bell's own rows;
     · the link's end date is printed in words;
     · a save on their seat asks for a reason and holds it as the change's own
       `why`, which is what Send already carries. Our seat is untouched. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { buildPortal, sharePayloadFor } = require('./portalworld');

const CHANGE = {
  id: 'CHG-001', clauseId: 'c1', clauseLabel: 'Clause 1 · Payment', changeType: 'modify',
  type: 'modify', status: 'pending',
  oldText: 'Payable within thirty (30) days.', newText: 'Payable within sixty (60) days.',
  ops: [{ op: 'del', text: 'thirty (30)' }, { op: 'ins', text: 'sixty (60)' }],
  summary: 'Payment terms extended to Net-60', authorSide: 'owner', author: 'Young Mbagaya',
};
function contract(over = {}) {
  return { id: 'MK-500', name: 'Supply Agreement', counterparty: 'Nordkust Industri AB',
    template: 'RM', status: 'Under Review', folder: 'proc', fields: {}, metadata: {},
    audit: [], rounds: [], versions: [], signatures: [], comments: [],
    format: 'text', redlineText: 'Clause 1\n\nPayable within thirty (30) days.',
    changes: [CHANGE], ...over };
}
function theirPage(over = {}, share = {}, store = null) {
  const p = buildPortal();
  /* A browser that remembers, for the tests about what is held on this page
     (this stage is otherwise an opaque origin, where storage throws). */
  if (store) Object.defineProperty(p.win, 'localStorage', { configurable: true,
    value: { getItem: k => (k in store ? store[k] : null), setItem: (k, x) => { store[k] = String(x); },
      removeItem: k => { delete store[k]; } } });
  const payload = sharePayloadFor(p, contract(over));
  payload.purpose = 'negotiate'; payload.purposeChosen = 'negotiate';
  p.win.renderSharePortal(payload, { token: 't', share: { recipientName: 'Erik Lindqvist', ...share } });
  const d = p.win.document;
  return { p, win: p.win, d, payload, $: s => d.querySelector(s), log: p.log };
}

describe('f439 — the tabs', () => {
  test('Where we are · Redlines · History, on the control row', () => {
    const v = theirPage();
    const tabs = [...v.d.querySelectorAll('.pw-id-row2 .pw-tab')].map(b => b.id);
    assert.deepEqual(tabs, ['pt-tab-where', 'pt-tab-redlines', 'pt-hist', 'pt-tab-signing']);
  });
  test('a first visit lands on Where we are, with the contract laid out under it', () => {
    const v = theirPage();
    assert.equal(v.$('#pw-page').dataset.ptTab, 'where');
    assert.equal(v.$('#pt-where-pane').hidden, false);
    /* RE-POINTED 22 Nov 2026 (P-44 review): their Where we are is the drawn page — the stops, the chips, one table */
    assert.ok(v.$('#pt-where-pane .pol-where .pol-stops'), 'the page is drawn, its four stops and all');
    assert.ok(v.$('#pt-nego'), 'the workbench is still mounted underneath');
    assert.equal(v.$('#pt-nego').inert, true, 'and takes no presses while covered');
  });
  test('the History tab draws the history in the page, never a pop-up', () => {
    const v = theirPage();
    v.$('#pt-hist').dispatchEvent(new v.win.Event('click', { bubbles: true }));
    assert.ok(v.$('#pt-hist-pane #history-timeline'), 'the timeline is in the tab');
    assert.equal(v.d.querySelectorAll('#history-timeline').length, 1, 'exactly one copy of it');
    assert.equal(v.$('#pw-page').dataset.ptTab, 'history');
  });
  /* RE-POINTED 22 Nov 2026 (P-44 review; the logged fault "no History tab" on a first share): on the new look their
     History always holds their own link's facts (sent, first opened) and their notes, so the tab is always there */
  test('nothing proposed, the History tab still stands (their link\'s own facts are its rows)', () => {
    const v = theirPage({ changes: [] });
    assert.ok(v.$('#pt-hist'));
  });
});

describe('f439 — Notes and Focus are not hidden', () => {
  /* ---- REVERSED IN PLACE 4 Oct 2026 (Young: "for space limitations, in the
     home page, you will have to delete the export button and keep it under
     the more button as it is designed today") ----
     On 29 September Notes and Focus moved out of More onto the page and the
     copies moved to a Copies card, which left the menu with nothing in it, so
     it was switched off. The argument was sound and is no longer: nothing
     else wanted that column in September, and the page every party reads
     wants it now. More is back, carrying exactly what it always carried, and
     it is how the owner's own contract room has done it all along.

     WHAT THIS CHECK WAS REALLY ABOUT IS UNCHANGED and is the first two lines:
     Notes and Focus are buttons on the page, not rows in a menu. */
  test('Notes and Focus are buttons on the page, and the copies are in More', () => {
    const v = theirPage();
    /* RE-POINTED 22 Nov 2026 (P-44 review, as drawn): the bell is on their black bar and opens ONE panel with
       Alerts · Notes; Notes is its second tab */
    assert.ok(v.$('.pol-bar #pt-bell'), 'the bell on the bar');
    assert.ok(v.$('#pt-alerts [data-pt-ptab="notes"]'), 'Notes, the bell panel\'s second tab');
    /* THE NEW LOOK IS THE ONLY LOOK (owner, 16 Nov 2026): Focus sits with the reading tools in More's pop-up */
    assert.ok(v.$('#pol-pop .pol-pop-tools #pt-focus'), 'Focus with the reading tools, behind More');
    assert.ok(v.$('#pt-more'), 'More is back, because there is something in it again');
    assert.ok(v.$('#pt-menu #pt-pdf') || v.$('#pt-more-menu #pt-pdf'), 'the clean copy');
    assert.equal(v.$('#pt-where-pane [data-pt-copy="pdf"]'), null,
      'and it is not also a card on the page — one door onto one act');
  });
});

describe('f439 — where they land', () => {
  test('nothing remembered → Where we are; the same news → the tab they left', () => {
    const v = theirPage();
    const sig = v.win.portalNewsSig(v.payload);
    assert.equal(v.win.portalLandingTab(v.payload), 'where', 'no memory on this stage');
    const store = { 'hati.ptPlace.t': JSON.stringify({ v: 1, tab: 'history', sig }) };
    Object.defineProperty(v.win, 'localStorage', { configurable: true,
      value: { getItem: k => store[k] || null, setItem: (k, x) => { store[k] = x; }, removeItem: k => { delete store[k]; } } });
    assert.equal(v.win.portalLandingTab(v.payload), 'history');
  });
  test('news from the other side changes the fingerprint; their own answers do not', () => {
    const v = theirPage();
    const before = v.win.portalNewsSig(v.payload);
    const ours = JSON.parse(JSON.stringify(v.payload));
    ours.contract.changes.push({ ...CHANGE, id: 'CHG-002', authorSide: 'counterparty' });
    assert.equal(v.win.portalNewsSig(ours), before, 'an ask of their own is not news to them');
    const moved = JSON.parse(JSON.stringify(v.payload));
    moved.contract.changes.push({ ...CHANGE, id: 'CHG-002' });
    assert.notEqual(v.win.portalNewsSig(moved), before, 'a new change from the other side is');
    const decided = JSON.parse(JSON.stringify(v.payload));
    decided.contract.changes[0].status = 'rejected';
    assert.notEqual(v.win.portalNewsSig(decided), before, 'and so is a decision on one');
  });
});

describe('f439 — Where we are borrows, never re-counts', () => {
  /* THE SHARED SHEET (Young picked it, 4 Oct 2026): "Waiting on you" became
     ONE line in the sheet's head. It names what the bell lists first and its
     door IS that row of the bell, so the two cannot disagree. */
  test('their own line is the bell\'s first row of work, and its door is that row', () => {
    const v = theirPage();
    /* RE-POINTED 22 Nov 2026 (P-44 review): the reader's own line is the drawn amber band; its button is still the
       bell's own row */
    const mine = v.$('#pt-where-pane .pol-w-band');
    assert.ok(mine, 'the reader\'s own line is the band at the head of the page');
    const bell = [...v.d.querySelectorAll('#pt-alerts-body [data-pt-kind]')].map(r => r.getAttribute('data-pt-kind'));
    assert.ok(bell.includes('answer'), 'there is work waiting on this fixture');
    const door = mine.querySelector('[data-pt-where-row]');
    assert.ok(door, 'the line carries its door');
    const row = v.$(`#pt-alerts-body [data-pt-alert="${door.getAttribute('data-pt-where-row')}"]`);
    assert.equal(row && row.closest('[data-pt-kind]').getAttribute('data-pt-kind'), 'answer', 'the same row the bell lists');
    assert.match(mine.textContent, /For you:/);
    assert.ok(!v.$('#pt-where-pane .pw-wrow, #pt-where-pane .pw-card, #pt-where-pane .pw-shrule'), 'the old cards and the rule are gone');
  });
  test('the link\'s end date is in words', () => {
    const v = theirPage({}, { expiresAt: '2026-10-12T09:00:00.000Z' });
    const sub = v.$('.pw-id-sub').textContent;
    assert.match(sub, /Oct/);
    assert.doesNotMatch(sub, /2026-10-12/);
  });
});

describe('f439 — a reason after every save, on their seat', () => {
  test('their save routes to portalAskReason; ours is untouched', async () => {
    /* THE NEW LOOK IS THE ONLY LOOK (owner, 16 Nov 2026): their seat is asked as ours is (8 Nov 2026, "mimic what is
       in the owner side") — their Notes drawer opens with the change pinned; the old "Why this change?" pop-up
       (portalAskReason, below) is the old look's */
    const v = theirPage();
    let asked = 0, pinned = null, opened = null;
    const real = v.win.portalAskReason, realPin = v.win.rlNotesPin, realOpen = v.win.portalOpenNotes;
    v.win.portalAskReason = () => { asked++; return Promise.resolve(null); };
    v.win.rlNotesPin = o => { pinned = o; };
    v.win.portalOpenNotes = o => { opened = o; };
    const out = v.win.rlNoteAskAfterFile({ id: 'MK-500' }, { id: 'CHG-9', clauseId: 'c1' }, { side: 'counterparty' });
    assert.ok(pinned && pinned.changeId === 'CHG-9' && pinned.filed === true, 'the change is pinned in their notes');
    assert.ok(opened && opened.pin === true, 'their Notes drawer opens on it');
    assert.equal(asked, 0, 'the old pop-up is not asked');
    pinned.resolve(null);
    assert.equal(await out, null, 'it ends when the note is written or skipped');
    v.win.portalAskReason = real; v.win.rlNotesPin = realPin; v.win.portalOpenNotes = realOpen;
  });
  const HELD = ch => ({ 'hati.negoHeld.t': JSON.stringify({ v: 1, at: Date.now(), decisions: {}, withdrawn: {},
    proposed: { [ch.id]: { ...ch } } }) });
  const heldWhy = (store, id) => ((JSON.parse(store['hati.negoHeld.t'] || '{}').proposed || {})[id] || {}).why;
  test('the answer is the change\'s own reason, held until Send', async () => {
    const ch = { id: 'CHG-9', clauseId: 'c1', clauseLabel: 'Clause 1 · Payment', authorSide: 'counterparty',
      status: 'pending', changeType: 'modify', oldText: 'thirty (30)', newText: 'sixty (60)' };
    const store = HELD(ch);
    const v = theirPage({}, {}, store);
    let seen = null;
    v.win.promptDialog = o => { seen = o; return Promise.resolve('  Our cash cycle is sixty days.  '); };
    const out = await v.win.portalAskReason({ id: 'MK-500' }, ch);
    assert.equal(out.why, 'Our cash cycle is sixty days.');
    assert.equal(ch.why, 'Our cash cycle is sixty days.');
    assert.equal(heldWhy(store, 'CHG-9'), 'Our cash cycle is sixty days.', 'held with the change');
    assert.ok(seen && seen.multiline, 'a reason is not a one-line answer');
  });
  test('skipping stores nothing', async () => {
    const ch = { id: 'CHG-9', clauseId: 'c1', authorSide: 'counterparty', status: 'pending',
      changeType: 'modify', oldText: 'thirty (30)', newText: 'sixty (60)' };
    const store = HELD(ch);
    const v = theirPage({}, {}, store);
    v.win.promptDialog = () => Promise.resolve(null);
    assert.equal(await v.win.portalAskReason({ id: 'MK-500' }, ch), null);
    assert.equal(heldWhy(store, 'CHG-9'), undefined);
  });
});

/* ---- ROUND TWO (Young: "implement all", 29 Sep 2026) ---- */
const tick = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); await new Promise(r => setImmediate(r)); };
const press = async (v, sel) => { const el = v.$(sel); assert.ok(el, `${sel} is on their page`);
  el.dispatchEvent(new v.win.Event('click', { bubbles: true })); await tick(); };

describe('f439 — the Signing tab on a negotiation link', () => {
  test('four stages, said as what comes next — never "Your turn"', async () => {
    const v = theirPage();
    await press(v, '#pt-tab-signing');
    const pane = v.$('#pt-sign-pane');
    assert.equal(pane.hidden, false);
    /* RE-POINTED 22 Nov 2026 (P-44 review): the drawn steps, each with its badge */
    assert.equal(pane.querySelectorAll('.pol-sg > li').length, 4);
    assert.doesNotMatch(pane.textContent, /Your turn/, 'nothing can be signed on this link');
    assert.match(pane.textContent, /Nothing can be signed on this link/);
  });
  /* RE-POINTED 22 Nov 2026 (P-44 review, as drawn): the step in hand's door is the panel's one black button, Open the
     redlines (the page's own "Review what changed" link went with the drawing; History stays its own tab) */
  test('the panel\'s Open the redlines opens the Redlines tab', async () => {
    const v = theirPage();
    await press(v, '#pt-tab-signing');
    await press(v, '#pol-side [data-pol-go="redlines"]');
    assert.equal(v.$('#pw-page').dataset.ptTab, 'redlines');
  });
});

describe('f439 — whose turn it is, beside the title', () => {
  test('work waiting on them reads "With you"', () => {
    const v = theirPage();
    assert.match(v.$('#pt-turn').textContent, /With you/);
  });
});

describe('f439 — the grey "Your table" strip is gone on the ordinary link', () => {
  test('no strip; the promise is on the Send all hover once something is held', async () => {
    const v = theirPage();
    assert.doesNotMatch((v.$('#rl-banner') || { textContent: '' }).textContent, /Your table/);
    v.win.portalSetTab('redlines');
    await press(v, '[data-nego-accept="CHG-001"]');
    assert.match(v.$('.rl-unsent-go').getAttribute('title'), /until you press Send/);
  });
});

describe('f439 — the check before Send', () => {
  async function held(v, how) {
    v.p.setResponderName('Erik Lindqvist');
    v.win.portalSetTab('redlines');
    if (how === 'reject') { v.win.promptDialog = async () => ''; await press(v, '[data-nego-reject="CHG-001"]'); }
    else await press(v, '[data-nego-accept="CHG-001"]');
  }
  test('Send shows what leaves first, and says where a reason is missing', async () => {
    const v = theirPage();
    await held(v, 'reject');
    await press(v, '.rl-unsent-go');
    assert.equal(v.log.sendChecks.length, 1, 'the check came up');
    assert.match(v.log.sendChecks[0].message, /Reject: .*no reason given/);
    assert.ok(v.p.lastSent(), 'and Send in it sent');
  });
  test('Keep working sends nothing and keeps what is held', async () => {
    const v = theirPage();
    await held(v, 'accept');
    v.win.confirmDialog = async () => false;
    await press(v, '.rl-unsent-go');
    assert.equal(v.p.lastSent(), null, 'nothing left');
    assert.ok(v.$('.rl-unsent-go'), 'the answer is still held, still sendable');
  });
});

describe('f439 — Reject already asks why, on their seat', () => {
  test('pressing Reject asks for a reason before it is recorded', async () => {
    const v = theirPage();
    v.win.portalSetTab('redlines');
    let asked = null;
    v.win.promptDialog = async o => { asked = o; return 'Net-30 stands.'; };
    await press(v, '[data-nego-reject="CHG-001"]');
    assert.ok(asked, 'the reason is asked for');
  });
});
