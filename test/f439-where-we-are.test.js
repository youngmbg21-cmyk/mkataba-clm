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
  return { p, win: p.win, d, payload, $: s => d.querySelector(s) };
}

describe('f439 — the tabs', () => {
  test('Where we are · Redlines · History, on the control row', () => {
    const v = theirPage();
    const tabs = [...v.d.querySelectorAll('.pw-id-row2 .pw-tab')].map(b => b.id);
    assert.deepEqual(tabs, ['pt-tab-where', 'pt-tab-redlines', 'pt-hist']);
  });
  test('a first visit lands on Where we are, with the contract laid out under it', () => {
    const v = theirPage();
    assert.equal(v.$('#pw-page').dataset.ptTab, 'where');
    assert.equal(v.$('#pt-where-pane').hidden, false);
    assert.ok(v.$('#pt-where-pane .pw-journey'), 'the journey is drawn');
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
  test('nothing proposed, no History tab (the old button\'s rule)', () => {
    const v = theirPage({ changes: [] });
    assert.equal(v.$('#pt-hist'), null);
  });
});

describe('f439 — Notes and Focus are not hidden', () => {
  test('both are buttons on the page and neither is a row in More', () => {
    const v = theirPage();
    const menu = v.$('#pt-more-menu');
    assert.ok(v.$('.pw-id #pt-notes-door'), 'Notes beside the bell');
    assert.ok(v.$('.pw-id-row2 #pt-focus'), 'Focus beside the text size');
    assert.ok(!menu.contains(v.$('#pt-notes-door')) && !menu.contains(v.$('#pt-focus')));
    assert.ok(menu.querySelector('#pt-pdf'), 'More keeps the files');
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
  test('"Waiting on you" is the bell\'s rows, one for one', () => {
    const v = theirPage();
    const where = [...v.d.querySelectorAll('#pt-where-pane .pw-wrow')].map(r => r.getAttribute('data-pt-kind'));
    const bell = [...v.d.querySelectorAll('#pt-alerts-body .pt-alert')].map(r => r.getAttribute('data-pt-kind'));
    assert.ok(where.length, 'there is work waiting on this fixture');
    assert.deepEqual(where, bell);
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
    const v = theirPage();
    let asked = 0;
    const real = v.win.portalAskReason;
    v.win.portalAskReason = () => { asked++; return Promise.resolve(null); };
    await v.win.rlNoteAskAfterFile({ id: 'MK-500' }, { id: 'CHG-9' }, { side: 'counterparty' });
    assert.equal(asked, 1, 'their seat is asked');
    v.win.portalAskReason = real;
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
