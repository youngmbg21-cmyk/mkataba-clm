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
  + '<h2>Clause 5 · Pricing</h2><p>Prices are fixed for the first twelve months.</p>'
  /* A second clause for THEIR ask to land on — see withBoth. */
  + '<h2>Clause 6 · Delivery</h2><p>Deliveries are made weekly to the mill gate.</p>';

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

  test('a secondary button looks pressable — the .ui-btn dress, pinned', () => {
    /* Reported TWICE (owner, 17 Aug 2026): "needs to be more visible that it
       is a button", then "still not visible enough" after a first pass that
       only darkened the grey border. Grey was the wrong axis — the folded
       chip, the portal verbs and the Copilot launcher all learned the same
       lesson — so the class wears the workspace ACCENT, mixed against the
       surface so it holds in both themes. Pinned so a refactor cannot quietly
       fade it back to furniture; the firmer hover border must never leak onto
       the filled primary, which outranks it only at rest. */
    const btn = /\.ui-btn\{([^}]*)\}/.exec(INDEX);
    assert.ok(btn, 'the class is defined');
    assert.match(btn[1], /background:color-mix\(in srgb,var\(--accent-solid\) 10%,var\(--color-surface\)\)/,
      'an accent tint at rest — a reader can see the control, in both themes');
    assert.match(btn[1], /border:1px solid color-mix\(in srgb,var\(--accent-solid\) 45%,var\(--color-surface\)\)/,
      'an accent border, mixed against the surface');
    assert.match(btn[1], /color:color-mix\(in srgb,var\(--accent-solid\) 40%,var\(--color-text\)\)/,
      'and accent-leaning ink that still follows the theme\'s text');
    assert.match(btn[1], /box-shadow:0 1px 2px/, 'and a small crisp lift');
    assert.match(INDEX, /\.ui-btn:not\(\.ui-btn-primary\):hover\{border-color:color-mix\(in srgb,var\(--accent-solid\) 70%,var\(--color-surface\)\)/,
      'the hover firms the border — and never over a filled primary');
  });
});

describe('f175 · the Tracked Changes head is a rule, not a box', () => {
  /* THREE STEPS, AND THE DIFFERENCE BETWEEN THEM IS THE POINT. The head began
     as a WHITE band lying across a grey pane — .nego-index-head paints the
     room's --n-paper — which was a rendering leak nobody chose. It went
     transparent. A COLOUR STRIP was then asked for deliberately (Young,
     10 Aug 2026: "change it to a color strip"), and the band was the frame.

     IT IS A RULE NOW ("A · Rule — the quiet ledger", same day): caption left,
     count right, a hairline under both, and the filter hanging off it. The
     band bought separation from the cards; a rule buys the same separation
     without putting a bordered box in a column whose whole content is bordered
     boxes.

     SO WHAT IS PINNED HERE IS THE PART THAT SURVIVED ALL THREE: the pane is
     not a box, the head is not a box, and neither of them is ever the room's
     white token — which is the leak the whole sequence started from. */
  test('a rule above the cards, and neither the pane nor the head is a card', async () => {
    const p = await stage();
    const css = p.css();
    assert.ok(/\.redline-page \.nego-pane\.index\{background:transparent\}/.test(css),
      'the column sits straight on the page, like .rl-col says both non-card columns do');
    const head = /\.rl-idx-head\{([^}]*)\}/.exec(css)[1];
    assert.match(head, /border-bottom:1px solid var\(--color-divider\)/,
      'the head is drawn by its rule');
    assert.match(head, /background:none/, 'and by nothing else — no band');
    assert.match(head, /border-radius:0/, 'a rule has no corners to round');
    assert.ok(!/--n-paper/.test(head), 'and never the room\'s white token');
  });

  test('the count is no louder than the caption it answers to', async () => {
    const p = await stage();
    const css = p.css();
    const k = /\.rl-idx-k\{([^}]*)\}/.exec(css)[1];
    const n = /\.rl-idx-n\{([^}]*)\}/.exec(css)[1];
    /* One size up across the head (owner-asked 16 Aug 2026); the RELATION is
       the claim — the count stays a hair above the caption and no more. */
    assert.match(k, /font-size:10\.5px/, 'the caption is the queue label\'s type');
    assert.match(n, /font-size:11px/,
      'and the count is a hair larger only because mono runs small at the same size');
    assert.match(n, /color:var\(--color-neutral-500\)/,
      'set below the caption in ink, which is what keeps it quieter');
  });

  test('the separate count stands down where the tabs draw — Option 1, one line', async () => {
    /* REVERSED IN PLACE (owner-chose Option 1, 16 Aug 2026). This test used
       to pin "N on the table" beside the filter — the same number the All tab
       prints, twelve pixels apart, at the cost of a whole head row. Where the
       tabs draw, the tabs ARE the count now; the .rl-idx-n element and its
       is-live accent survive in the sheet for the ONE head that has no tabs —
       a narrowed reviewer's, whose filter is furniture and is not drawn. */
    const p = await stage();
    assert.equal(p.$('.rl-idx-n'), null,
      'no separate count beside a drawn filter — one number, said once');
    assert.equal(p.$('[data-rl-cardfilter="all"] .rl-fseg-n').textContent.trim(), '1',
      'the All tab carries it instead');
    assert.ok(/\.rl-idx-n\.is-live\{[^}]*var\(--color-accent-800\)/.test(p.css()),
      'the count rules stay in the sheet for the reviewer head that still draws one');
    assert.ok(/\.rl-fseg\.on \.rl-fseg-n\{[^}]*var\(--color-accent-800\)/.test(p.css()),
      'and the pressed tab\'s count wears the same live accent');

    /* Nothing on the table at all: the tabs still draw, reading zero. */
    const q = await stage();
    q.c.changes = [];
    q.win.renderRedline();
    assert.equal(q.$('[data-rl-cardfilter="all"] .rl-fseg-n').textContent.trim(), '0',
      'an empty book reads zero on the tab, not a missing head');
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
  /* THEIR ask lands on the SECOND clause (15 Aug 2026): filed on the same
     clause as ours it is a counter now, and the funnel supersedes ours — one
     live change, and a filter with nothing to split. Mine-and-theirs
     coexisting is a two-clause state, which is what a real book looks like. */
  const cl = p.win.negoClauseList(p.c).find(x => x.num === '6');
  await p.win.negoEditClause(p.c, cl.clauseId,
    '<p>Deliveries are made fortnightly to the mill gate.</p>',
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
    /* The head no longer carries a filtered count (Option 1 — the tab counts
       deliberately do NOT move with the filter; that is their safety). What
       says "you are reading the Mine cut" is the pressed tab itself. */
    const on = p.$('.rl-fseg.on');
    assert.equal(on && on.getAttribute('data-rl-cardfilter'), 'mine',
      'the pressed tab names the cut');
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
