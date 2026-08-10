/* ============================================================
   f175 — the dialogs get some colour, the column head gets its balance
   ============================================================
   Two paint complaints from one report (Young, 10 Aug 2026), beside a
   screenshot of the SHARE dialog as the thing to match:

   1. "add some light color and character to the pop ups like in image 3. They
      are currently very bland." Eight dialogs across js/review.js and
      js/desk.js opened as a heading, a grey sentence and a stack of fields on
      plain white. They now share ONE head — accent-tinted, with an icon badge
      — built by reviewDialogHeadHtml and called from both files, because
      eight dialogs dressed eight times is six that get updated and two that
      do not.

   2. "make the top have a more professional look and balanced." The Tracked
      Changes head was a WHITE band lying across a GREY pane (.nego-index-head
      paints the room's --n-paper), with the caption jammed against one end
      and a heavier grey pill against the other. One ground now, and the count
      is no louder than the caption it answers to.

   AND THE CLASSES ARE REAL. This feature's own hardest-learned lesson is that
   `class="ui-input"` is not defined anywhere in the application, so every
   field wearing it rendered unstyled. Every class introduced here is checked
   against index.html, which is the only place that could make it a lie.
   ============================================================ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');

const INDEX = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

const BODY =
  '<h1>Cane Supply Agreement</h1><p>Between Wanjiru Catering Ltd and Nordfrakt Logistik AB</p>'
  + '<h2>Clause 5 · Pricing</h2><p>Prices are fixed for the first twelve months.</p>';

const ME    = { id: 'u_me',  name: 'Wanjiru Kamau',  role: 'admin', email: 'wanjiru@w.co.ke' };
const SALES = { id: 'u_sal', name: 'Achieng Otieno', role: 'legal', email: 'achieng@w.co.ke' };
const TEAM  = [ME, SALES];

const contract = () => ({ id: 'MK-D5', name: 'Cane Supply Agreement',
  counterparty: 'Nordfrakt Logistik AB', status: 'Under Review', folder: 'dist',
  fields: {}, metadata: {}, audit: [], rounds: [], versions: [], signatures: [], comments: [],
  value: 4800000, redlineText: BODY, format: 'rich' });

async function stage(){
  const w = buildWorld({ user: ME, negotiationView: true, contractView: true });
  const win = w.win;
  win.getUsers = () => TEAM;
  win.userById = id => TEAM.find(u => u.id === id) || null;
  win.saveSettings = () => {};
  win.openShareModal = () => {};
  win.counterpartyContact = () => null;
  win.cachedShares = () => [];
  const c = contract();
  win.negoInit(c);
  const cl = win.negoClauseList(c).find(x => x.num === '5');
  const mine = await win.negoEditClause(c, cl.clauseId,
    '<p>Prices are fixed for twenty-four months.</p>',
    { side: 'owner', author: ME.name, summary: 'ask on 5' });
  win.state = Object.assign({}, win.state,
    { contracts: [c], activeId: c.id, view: 'redline', settings: {} });
  win.getContract = id => (String(id) === String(c.id) ? c : null);
  win.renderRedline();
  return { w, win, c, mine,
    modal: () => win.document.getElementById('modal-root'),
    $: sel => win.document.querySelector(sel),
    css: () => (win.document.getElementById('redline-layout-css') || { textContent: '' }).textContent };
}

/* Every dialog in the feature, and how to open it. A new one added without a
   head fails the sweep below rather than shipping bland. */
const DIALOGS = [
  ['the desk sheet',          (w, c) => w.openDeskSheet(c)],
  ['the review ask',          (w, c) => w.openReviewAskModal(c)],
  ['the entry chooser',       (w, c) => w.openReviewEntryChooser(c)],
  ['the hand-over',           (w, c) => w.openDeskHandover(c)],
  ['the join request',        (w, c) => w.openDeskJoinAsk(c)],
  ['the reviewer note',       (w, c, ch) => w.openReviewNoteModal(c, ch.id)],
];

describe('f175 · every dialog in the feature wears the same head', () => {
  for (const [name, open] of DIALOGS){
    test(name + ' has a tinted head with an icon and a title', async () => {
      const p = await stage();
      p.win.deskOpenFromChip(p.c);              // a desk exists, so the sheet has a lead
      open(p.win, p.c, p.mine);
      const m = p.modal();
      assert.ok(m.querySelector('.rvd-head'), 'the head band is drawn');
      assert.ok(m.querySelector('.rvd-ico'), 'with an icon badge');
      const title = m.querySelector('.rvd-title');
      assert.ok(title && title.textContent.trim(), 'and a title in it');
      assert.ok(m.querySelector('.rvd-body'), 'the body is its own block');
      assert.ok(m.querySelector('.rvd-foot'), 'and the actions sit on a shelf');
      /* The old bare heading must be gone, or two dialogs disagree. */
      assert.equal(m.querySelector('h2[style*="font-heading"]'), null,
        'no dialog keeps a hand-rolled heading of its own');
    });
  }

  test('the head is built ONCE and desk.js calls it', () => {
    const rv = fs.readFileSync(path.join(__dirname, '..', 'js', 'review.js'), 'utf8');
    const dk = fs.readFileSync(path.join(__dirname, '..', 'js', 'desk.js'), 'utf8');
    assert.match(rv, /function reviewDialogHeadHtml\(/, 'review.js owns the builder');
    assert.match(rv, /reviewDialogHeadHtml,/, 'and exports it');
    assert.match(dk, /window\.reviewDialogHeadHtml/,
      'desk.js borrows it rather than writing a second one');
    /* AND FALLS BACK. The desk must not need the review loaded to draw. */
    assert.match(dk, /if \(typeof window !== 'undefined' && window\.reviewDialogHeadHtml\)/,
      'guarded, because a stage without js/review.js still opens the desk');
  });

  test('the desk sheet marks its lead as the subject, not one of a list', async () => {
    const p = await stage();
    p.win.deskOpenFromChip(p.c);
    p.win.openDeskSheet(p.c);
    assert.ok(p.modal().querySelector('.dk-row-lead'), 'the lead row is tinted');
    assert.ok(p.modal().querySelector('.rvd-note'),
      'and what the counterparty is told reads as a fact, not a footnote');
  });

  test('and every class it introduces is really defined', () => {
    /* THE `ui-input` LESSON. A class the application does not define renders
       as nothing at all, and looks exactly like a class that does. */
    for (const cls of ['rvd-head', 'rvd-ico', 'rvd-title', 'rvd-sub', 'rvd-body',
      'rvd-foot', 'rvd-note', 'rvd-opt', 'dk-row-lead']){
      assert.ok(new RegExp('\\.' + cls + '[{,: ]').test(INDEX),
        cls + ' must be defined in index.html, or it dresses nothing');
    }
  });
});

describe('f175 · the Tracked Changes head sits on one ground', () => {
  test('no white band across the grey pane', async () => {
    const p = await stage();
    const css = p.css();
    assert.ok(/\.redline-page \.nego-pane\.index\{background:transparent\}/.test(css),
      'the column sits straight on the page, like .rl-col says both non-card columns do');
    assert.ok(/\.rl-idx-head\{[^}]*background:transparent/.test(css),
      'and the head does not paint the room\'s --n-paper over it');
  });

  test('the count is no louder than the caption it answers to', async () => {
    const p = await stage();
    const css = p.css();
    const k = /\.rl-idx-k\{([^}]*)\}/.exec(css)[1];
    const n = /\.rl-idx-n\{([^}]*)\}/.exec(css)[1];
    assert.match(k, /font-size:9\.5px/, 'the caption is the queue label\'s type');
    assert.match(n, /font-size:9\.5px/, 'and the count is the same size, not larger');
    assert.match(n, /border-radius:999px/, 'still a chip');
  });

  test('the chip earns colour only when something is on the table', async () => {
    const p = await stage();
    assert.ok(p.$('.rl-idx-n.is-live'), 'one ask outstanding — the count is live');
    assert.ok(/\.rl-idx-n\.is-live\{[^}]*var\(--color-accent-100\)/.test(p.css()),
      'and live means the accent tint');

    /* THE STATE IN THE REPORT: nothing on the table at all. Driven by opening
       the bench on a contract with no changes, rather than by deciding this
       one — a decided ask can legitimately keep its card (see the sentIds and
       contested branches in redlineChangeCardsHtml), so deciding proves
       nothing about an empty column. */
    const q = await stage();
    q.c.changes = [];
    q.win.renderRedline();
    const n = q.$('.rl-idx-n');
    assert.ok(n, 'the count is still drawn when it is zero');
    assert.match(n.textContent, /0/, 'and it really is reading zero');
    assert.ok(!n.classList.contains('is-live'),
      'nothing on the table is not news, so it goes quiet');
  });
});
