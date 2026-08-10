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

describe('f175 · the Tracked Changes head is a deliberate colour strip', () => {
  /* TWO STEPS, AND THE DIFFERENCE BETWEEN THEM IS THE POINT. The head began as
     a WHITE band lying across a grey pane — .nego-index-head paints the room's
     --n-paper — which was a rendering leak nobody chose. It went transparent,
     and the strip was then asked for deliberately (Young, 10 Aug 2026:
     "change it to a color strip"). So what is pinned here is that the pane is
     still not a box, and that the band is an accent object rather than a leak. */
  test('an accent strip above the cards, and the pane still is not a card', async () => {
    const p = await stage();
    const css = p.css();
    assert.ok(/\.redline-page \.nego-pane\.index\{background:transparent\}/.test(css),
      'the column sits straight on the page, like .rl-col says both non-card columns do');
    const head = /\.rl-idx-head\{([^}]*)\}/.exec(css)[1];
    assert.match(head, /background:var\(--color-accent-100\)/, 'the strip carries the accent tint');
    assert.match(head, /border-radius:11px/, 'as its own object, not the top edge of a box');
    assert.ok(!/--n-paper/.test(head), 'and never the room\'s white token');
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
    assert.ok(/\.rl-idx-n\.is-live\{[^}]*var\(--color-accent-800\)/.test(p.css()),
      'and live means the deeper ink (the chip already sits on the strip\'s tint)');

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

/* ============================================================
   AND THE STRIP CARRIES THE THREE-WAY CUT
   ============================================================
   Asked for in the same sentence as the strip: "it should also contain a
   filter that shows which changes are from me, counterparty or all."

   THIS CONTROL WAS REMOVED ONCE, and the argument for removing it was sound —
   a control that can hide a change is a control that can lose one. So the
   answer is not "put the dropdown back": every option carries its own count,
   all three are visible without opening anything, and a column emptied by the
   filter says so and offers the way back. Those three properties are what
   this section pins, because they are the ones that make the control safe. */
async function withBoth(){
  const p = await stage();                       // one ask of ours already filed
  const cl = p.win.negoClauseList(p.c)[0];
  await p.win.negoEditClause(p.c, cl.clauseId,
    '<p>Prices may be revised each quarter.</p>',
    { side: 'counterparty', author: 'Amina · Nordfrakt' });
  p.win.rlSetCardFilter('all');
  p.win.renderRedline();
  return p;
}
const chips = p => [...p.win.document.querySelectorAll('[data-rl-cardfilter]')];
const press = (p, k) => {
  const b = chips(p).find(x => x.getAttribute('data-rl-cardfilter') === k);
  assert.ok(b, 'the ' + k + ' chip is drawn');
  b.dispatchEvent(new p.win.Event('click', { bubbles: true, cancelable: true }));
};

describe('f175 · the strip filters by who asked', () => {
  test('three options, each carrying its own count', async () => {
    const p = await withBoth();
    assert.deepEqual(chips(p).map(b => b.getAttribute('data-rl-cardfilter')),
      ['all', 'mine', 'theirs'], 'all three, in that order');
    const n = k => chips(p).find(b => b.getAttribute('data-rl-cardfilter') === k)
      .querySelector('.rl-fseg-n').textContent;
    assert.equal(n('all'), '2');
    assert.equal(n('mine'), '1');
    assert.equal(n('theirs'), '1');
    /* THE COUNTS DO NOT MOVE WITH THE FILTER — that is what stops one hiding
       a change quietly. Reading "Theirs 1" while you are on Mine is the whole
       safety property. */
    press(p, 'mine');
    const after = k => chips(p).find(b => b.getAttribute('data-rl-cardfilter') === k)
      .querySelector('.rl-fseg-n').textContent;
    assert.equal(after('theirs'), '1', 'still says one is over there');
    assert.equal(after('all'), '2');
  });

  test('picking a side narrows the column, and the count above it follows', async () => {
    const p = await withBoth();
    assert.equal(p.win.redlineCardIds(p.c, { side: 'owner' }).length, 2, 'both to start');
    press(p, 'mine');
    const ours = p.win.negoChanges(p.c).filter(x => x.authorSide === 'owner').map(x => x.id);
    assert.deepEqual(p.win.redlineCardIds(p.c, { side: 'owner' }), ours,
      'the list is ours alone');
    /* The pill above the cards is drawn from redlineCardIds, so it cannot
       label a column it is not describing — the fault that function exists to
       prevent. */
    assert.match(p.$('.rl-idx-n').textContent, /1/, 'and the pill says one');
    assert.equal(p.win.document.querySelectorAll('#rl-changes [data-nego-card]').length, 1,
      'one card on screen');
  });

  test('a column emptied by the filter says so, and offers the way back', async () => {
    const p = await stage();                     // only OUR ask exists
    press(p, 'theirs');
    const empty = p.$('.rl-cards-empty');
    assert.ok(empty, 'the column is empty');
    assert.match(empty.textContent, /none from the side you picked/i,
      'and it says WHICH emptiness this is, not "no changes on the table"');
    const back = empty.querySelector('[data-rl-cardfilter="all"]');
    assert.ok(back, 'with the way back on it');
    back.dispatchEvent(new p.win.Event('click', { bubbles: true, cancelable: true }));
    assert.equal(p.win.rlCardFilter(), 'all', 'pressing it clears the filter');
    assert.ok(p.win.document.querySelector('#rl-changes [data-nego-card]'), 'and the card is back');
  });

  test('mine and theirs are read against the SEAT, not the company', async () => {
    /* On the counterparty's own page their asks are "mine". Same predicate,
       flipped by the seat, so their page and our preview of it both answer
       correctly rather than one of them being backwards. */
    const p = await withBoth();
    const ourAsk = p.win.negoChanges(p.c).find(x => x.authorSide === 'owner');
    p.win.rlSetCardFilter('mine');
    assert.ok(p.win.rlCardFilterPass(ourAsk, 'owner'), 'ours is "mine" on our seat');
    assert.ok(!p.win.rlCardFilterPass(ourAsk, 'counterparty'), 'and "theirs" on theirs');
  });

  test('a reviewer, already narrowed to their own clauses, is offered no filter', async () => {
    /* The rule predates this control: every setting gives the same answer once
       the column holds one person's work, and a control with one outcome is
       furniture. rlMyCardIds returning a set IS that narrowing. */
    const p = await stage();
    assert.ok(chips(p).length, 'ordinarily the chips are there');
    p.win.reviewAsk(p.c, { reviewer: SALES, ids: [p.mine.id] });
    const asSales = buildWorld({ user: SALES, negotiationView: true, contractView: true });
    asSales.win.getUsers = () => TEAM;
    asSales.win.userById = id => TEAM.find(u => u.id === id) || null;
    asSales.win.negoInit(p.c);
    assert.ok(asSales.win.rlMyCardIds(p.c, { side: 'owner' }),
      'fixture: the reviewer\'s column really is narrowed');
    assert.equal(p.win.redlineChangeCardsHtml(p.c, { side: 'owner' }).includes('data-rl-cardfilter'),
      false, 'and the cards carry no filter of their own');
  });
});
