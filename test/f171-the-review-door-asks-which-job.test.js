/* ============================================================
   f171 — the Internal review button opens on a choice
   ============================================================
   Asked for directly (Young, 10 Aug 2026): "the internal review button should
   initiate the internal collaboration sessions. When you click on the internal
   review, you will have 2 choices, assign contributors or send review."

   Two different features answer those two choices — the DESK (colleagues who
   redline alongside you for the whole negotiation) and the REVIEW (a colleague
   who rules on named changes and hands them back) — and until this, the button
   labelled with the word people reach for opened only the second. The desk's
   own door was a chip in the header nobody connected to the task.

   What must stay true around the new door:
   - the chooser offers exactly the two acts, and each routes to the dialog
     that already existed — nothing about either feature changed behind it;
   - "assign contributors" on a contract with NO desk claims it for the person
     pressing, the same one-press rule the header chip follows, so the sheet
     never opens on an empty lead row;
   - the hand-back posture is NOT routed through the chooser: a reviewer
     pressing the same button is returning a job, not starting one;
   - a stage without the desk module falls straight through to the ask dialog,
     which is what every caller written before this did.
   ============================================================ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { buildWorld } = require('./world');

const BODY =
  '<h1>Cane Supply Agreement</h1><p>Between Wanjiru Catering Ltd and Nordfrakt Logistik AB</p>'
  + '<h2>Clause 5 · Pricing</h2><p>Prices are fixed for the first twelve months.</p>'
  + '<h2>Clause 10 · Sourcing</h2><p>Cane is sourced from the named estates only.</p>';

const ME    = { id: 'u_me',  name: 'Wanjiru Kamau',  role: 'legal', email: 'wanjiru@w.co.ke' };
const SALES = { id: 'u_sal', name: 'Achieng Otieno', role: 'admin', email: 'achieng@w.co.ke' };
const TEAM  = [ME, SALES];

const contract = (over = {}) => ({ id: 'MK-D1', name: 'Cane Supply Agreement',
  counterparty: 'Nordfrakt Logistik AB', status: 'Under Review', folder: 'dist',
  fields: {}, metadata: {}, audit: [], rounds: [], versions: [], signatures: [], comments: [],
  value: 4800000, redlineText: BODY, format: 'rich', ...over });

function world(opts = {}){
  const w = buildWorld({ user: opts.user || ME, ...opts });
  w.win.state = { settings: opts.settings || {}, contracts: [], view: 'redline', activeId: 'MK-D1' };
  w.win.getUsers = () => TEAM;
  w.win.userById = id => TEAM.find(u => u.id === id) || null;
  w.win.saveSettings = () => {};
  w.win.getContract = () => null;
  return w;
}
const modalRoot = w => w.win.document.getElementById('modal-root');
const press = (w, sel) => {
  const el = modalRoot(w).querySelector(sel);
  assert.ok(el, sel + ' is drawn');
  el.dispatchEvent(new w.win.Event('click', { bubbles: true }));
};

async function ours(win, c){
  win.negoInit(c);
  const cl = win.negoClauseList(c).find(x => x.num === '5');
  return win.negoEditClause(c, cl.clauseId, '<p>Prices are fixed for twenty-four months.</p>',
    { side: 'owner', author: ME.name, summary: 'ask on 5' });
}

describe('f171 · the door offers the two acts', () => {
  test('both options are drawn, each saying what it does', async () => {
    const w = world();
    const c = contract(); await ours(w.win, c);
    w.win.openReviewEntryChooser(c);
    const html = modalRoot(w).innerHTML;
    assert.match(html, /data-rv-entry="desk"/, 'assign contributors is offered');
    assert.match(html, /data-rv-entry="ask"/, 'send for review is offered');
    assert.ok(html.includes(w.win.i18t('rv_entry_desk')), 'named in the reader\'s words');
    assert.ok(html.includes(w.win.i18t('rv_entry_ask')));
  });

  test('"send for review" opens the ask dialog, unchanged behind the door', async () => {
    const w = world();
    const c = contract(); await ours(w.win, c);
    w.win.openReviewEntryChooser(c);
    press(w, '[data-rv-entry="ask"]');
    const html = modalRoot(w).innerHTML;
    assert.ok(html.includes(w.win.i18t('rv_modal_title')), 'the review ask dialog is on screen');
    assert.match(html, /id="rv-who"/, 'with its reviewer picker');
  });

  test('"assign contributors" opens the desk sheet', async () => {
    const w = world();
    const c = contract(); await ours(w.win, c);
    /* The change above already claimed the desk through negoFileChange, the
       same as any real contract that has been worked on. */
    assert.ok(w.win.deskIsOpen(c), 'the desk was claimed by the first change filed');
    w.win.openReviewEntryChooser(c);
    press(w, '[data-rv-entry="desk"]');
    const html = modalRoot(w).innerHTML;
    assert.ok(html.includes(w.win.i18t('dk_sheet_title')), 'the desk sheet is on screen');
    assert.match(html, /id="dk-who"/, 'with its add-contributor picker');
  });

  test('on a contract with no desk, choosing contributors claims it first', async () => {
    const w = world();
    const c = contract();
    w.win.negoInit(c);                       // nothing filed — no desk yet
    assert.ok(!w.win.deskIsOpen(c), 'no desk before the press');
    w.win.openReviewEntryChooser(c);
    press(w, '[data-rv-entry="desk"]');
    assert.ok(w.win.deskIsOpen(c), 'the press claimed it');
    assert.equal(w.win.deskLead(c).name, ME.name,
      'for the person pressing — the same person their first redline would have stamped');
    assert.ok(modalRoot(w).innerHTML.includes(w.win.i18t('dk_sheet_title')),
      'and the sheet opens with a lead to show');
  });

  test('without the desk module the door falls through to the ask dialog', async () => {
    const w = world();
    const c = contract(); await ours(w.win, c);
    w.win.openDeskSheet = undefined;   // a stage that never loaded js/desk.js
    w.win.openReviewEntryChooser(c);
    const html = modalRoot(w).innerHTML;
    assert.ok(!/data-rv-entry/.test(html), 'no chooser with nothing to choose between');
    assert.ok(html.includes(w.win.i18t('rv_modal_title')), 'straight to the ask dialog');
  });

  test('cancel closes it and starts nothing', async () => {
    const w = world();
    const c = contract(); await ours(w.win, c);
    w.win.openReviewEntryChooser(c);
    press(w, '#rv-entry-cancel');
    assert.equal(modalRoot(w).innerHTML, '', 'the modal is gone');
    assert.equal(w.win.reviewOpenList(c).length, 0, 'no review was opened');
  });
});
