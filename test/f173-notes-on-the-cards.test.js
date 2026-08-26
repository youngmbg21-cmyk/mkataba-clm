/* ============================================================
   f173 — the notes on the cards: the switch, the arrival, the fold
   ============================================================
   Three of the four card-notes complaints in one report (Young, 10 Aug 2026),
   pinned together because they are one surface:

   1. "there is no ability to toggle between internal and send to them like we
      have in the counterparty side" — our composer now carries the same
      visibility switch theirs always had. THE DEFAULTS OPPOSE EACH OTHER ON
      PURPOSE: theirs opens on Send-to-them, ours opens on Internal, because
      the quiet path through our form must never be the one that publishes a
      colleague's aside. f84 pins the default; this file pins the switch.

   2. "the notes from the counterparty are not being received" — their reply
      lives in the discussion channel (a public page cannot write to our
      record), and the workbench never fetched that channel. It does now, on
      mount, and the merged thread puts their words on the card.

   3. "when you enter a big paragraph of notes, the page card should not
      expand" — anything past a few lines clamps to three, with Show more /
      Show less under it, as a class flip that repaints nothing.

   The fourth complaint in the report — the Tracked Changes head — is a paint
   question; its rules are asserted here from the stylesheet.

   RE-POINTED 16 Aug 2026: the conversation lives in the CLAUSE PANEL's row for
   the change now (the card is a routing row and the pop-out is retired), so
   every claim below reads the panel — same switch, same defaults, same fold,
   new address. The card is asserted to carry none of it, which is the new
   half of the claim.
   ============================================================ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { buildWorld } = require('./world');

const BODY =
  '<h1>Cane Supply Agreement</h1><p>Between Wanjiru Catering Ltd and Nordfrakt Logistik AB</p>'
  + '<h2>Clause 5 · Pricing</h2><p>Prices are fixed for the first twelve months.</p>'
  + '<h2>Clause 10 · Sourcing</h2><p>Cane is sourced from the named estates only.</p>';

const ME = { id: 'u_me', name: 'Wanjiru Kamau', role: 'legal', email: 'wanjiru@w.co.ke' };

const contract = () => ({ id: 'MK-N1', name: 'Cane Supply Agreement',
  counterparty: 'Nordfrakt Logistik AB', status: 'Under Review', folder: 'dist',
  fields: {}, metadata: {}, audit: [], rounds: [], versions: [], signatures: [], comments: [],
  value: 4800000, redlineText: BODY, format: 'rich' });

async function mounted(opts = {}){
  const w = buildWorld({ user: ME, negotiationView: true, contractView: true });
  w.win.getUsers = () => [ME];
  w.win.userById = id => (id === ME.id ? ME : null);
  w.win.saveSettings = () => {};
  const c = contract();
  w.win.negoInit(c);
  const cl = w.win.negoClauseList(c).find(x => x.num === '5');
  const theirs = await w.win.negoEditClause(c, cl.clauseId,
    '<p>Prices may be revised quarterly.</p>',
    { side: 'counterparty', author: 'Amina Wanjiru · Nordfrakt Logistik AB' });
  /* The server double answers the messages route with whatever the test put
     there — the discussion channel, where a counterparty's reply really
     lives. */
  const channel = opts.channel ? opts.channel(w.win, theirs) : [];
  const realApi = w.win.api;
  w.win.api = async (path, method, body) => {
    if (/\/messages$/.test(path) && (!method || method === 'GET')) return { messages: channel };
    return realApi(path, method, body);
  };
  w.win.state = Object.assign({}, w.win.state,
    { contracts: [c], activeId: c.id, view: 'redline', settings: {} });
  w.win.getContract = id => (String(id) === String(c.id) ? c : null);
  w.win.renderRedline();
  /* The channel fetch is fire-and-forget; let its microtasks land. */
  await new Promise(r => setImmediate(r));
  await new Promise(r => setImmediate(r));
  return { w, c, theirs,
    $: sel => w.win.document.querySelector(sel),
    css: () => (w.win.document.getElementById('redline-layout-css') || { textContent: '' }).textContent };
}

describe('f173 · our composer carries the switch, defaulting to Internal', () => {
  test('both faces are drawn on our seat, Internal pressed', async () => {
    const p = await mounted();
    assert.ok(p.$('#rl-changes .rl-card'), 'the card is drawn');
    assert.equal(p.$('#rl-changes .nego-visswitch'), null,
      'the routing row carries no composer of its own');
    const row = p.$(`#rl-cp-body [data-rl-cp-change="${p.theirs.id}"]`);
    assert.ok(row, 'the change has its row in the clause panel');
    const sw = row.querySelector('.nego-visswitch');
    assert.ok(sw, 'our seat has the visibility switch now');
    assert.equal(sw.querySelector('.v-int').getAttribute('aria-pressed'), 'true',
      'and it opens on Internal — the quiet path stays the safe one');
    assert.equal(sw.querySelector('.v-sh').getAttribute('aria-pressed'), 'false');
  });

  test('the button and the promise carry both faces for the switch to choose', async () => {
    const p = await mounted();
    const card = p.$(`#rl-cp-body [data-rl-cp-change="${p.theirs.id}"]`);
    const btn = card.querySelector('.rl-cnote-add');
    assert.ok(btn.querySelector('.rl-when-int') && btn.querySelector('.rl-when-sh'),
      'the send button has an Internal face and a Send face');
    const hint = card.querySelector('.rl-cnote-hint');
    assert.match(hint.querySelector('.rl-when-int').textContent, /Never sent/i);
    assert.match(hint.querySelector('.rl-when-sh').textContent, /sees this/i);
    assert.ok(/rl-cnotes:has\(\.v-sh\[aria-pressed="true"\]\) \.rl-when-sh\{display:inline/.test(p.css()),
      'and the stylesheet swaps the faces on the pressed switch');
  });
});

describe('f173 · the counterparty\'s note arrives on the card', () => {
  test('the workbench fetches the channel on mount and the reply renders', async () => {
    const p = await mounted({ channel: (win, theirs) => [{
      id: 'm1', topic: win.negoTopicFor(theirs), side: 'counterparty',
      author: 'Amina Wanjiru', at: '2026-08-10T10:00:00Z',
      body: 'Our AP cycle runs monthly — Net-30 forces out-of-cycle payments.' }] });
    assert.ok(Array.isArray(p.c._messages), 'the channel was fetched');
    const row = p.$(`#rl-cp-body [data-rl-cp-change="${p.theirs.id}"]`);
    assert.match(row.textContent, /AP cycle runs monthly/,
      'their words are on the change they are about, in the panel');
    assert.ok(row.querySelector('.rl-cnote.is-shared'), 'wearing the shared wash');
  });

  test('with nothing in the channel the card simply has no notes', async () => {
    const p = await mounted();
    assert.ok(Array.isArray(p.c._messages), 'fetched, and empty is a real answer');
    assert.equal(p.$('#rl-cp-body .rl-cnote'), null);
  });
});

describe('f173 · a long note folds instead of growing the card', () => {
  test('past a few lines it clamps, with Show more under it', async () => {
    const p = await mounted();
    const essay = 'This clause needs careful thought. '.repeat(12);   // ~420 chars
    p.w.win.negoPostComment(p.c, p.theirs.id, essay, { side: 'owner', author: ME.name });
    p.w.win.renderRedline();
    const note = p.$('#rl-cp-body .rl-cnote');
    assert.ok(note.querySelector('p.rl-cnote-clamp'), 'the paragraph is clamped');
    const more = note.querySelector('[data-rl-note-more]');
    assert.ok(more, 'with the reader\'s own way to open it');
    assert.ok(/rl-cnote-clamp\{display:-webkit-box;-webkit-line-clamp:3/.test(p.css()),
      'clamped to three lines by the stylesheet');
    /* The toggle is a class flip, not a repaint. */
    more.dispatchEvent(new p.w.win.Event('click', { bubbles: true, cancelable: true }));
    assert.ok(!note.querySelector('p.rl-cnote-clamp'), 'Show more opens it in place');
    assert.equal(more.textContent, p.w.win.i18t('ng_note_less'), 'and the button now offers the way back');
    more.dispatchEvent(new p.w.win.Event('click', { bubbles: true, cancelable: true }));
    assert.ok(note.querySelector('p.rl-cnote-clamp'), 'Show less folds it again');
  });

  test('a short note is just a note — no toggle, no clamp', async () => {
    const p = await mounted();
    p.w.win.negoPostComment(p.c, p.theirs.id, 'Fine by me.', { side: 'owner', author: ME.name });
    p.w.win.renderRedline();
    const note = p.$('#rl-cp-body .rl-cnote');
    assert.ok(note, 'the note is drawn');
    assert.equal(note.querySelector('.rl-cnote-clamp'), null);
    assert.equal(note.querySelector('[data-rl-note-more]'), null);
  });
});

describe('f173 · the column head is a caption and a count', () => {
  /* THIS TEST HAS MOVED TWICE, and both moves were the head's frame changing
     under it. It first pinned a hairline under a transparent head, the answer
     to "not professionally designed". The head was then asked for as a COLOUR
     STRIP (Young, 10 Aug 2026), so the hairline went and the band was the
     frame. It is a RULE again now ("A · Rule — the quiet ledger", same day),
     so the hairline is back and the band is gone.

     WHAT HAS NEVER MOVED, and is what this test was always about, is the TYPE:
     the caption is the queue label's, and the count is set apart from it
     rather than reading as more of the same grey sentence. Only the way it is
     set apart has changed — a chip once, mono figures now. f175 owns the
     frame; this owns the type. */
  test('caption type, and a count set apart from it', async () => {
    const p = await mounted();
    const css = p.css();
    /* 10.5, not 9.5: the whole head went up one size (owner-asked 16 Aug 2026
       — "increase everything under the highlight by one size font"). The
       weight and tracking are the claim that never moved.

       REVERSED IN PLACE 20 Aug 2026: 800 became 700. "72" ships four cuts and
       800 is not one of them, so this caption was ALREADY rendering at 700 —
       measured, identical ink and identical width to a real 700. The claim is
       unchanged (the caption keeps its bold label type); only the source now
       asks for the weight it was always getting. */
    /* SIZES ROUNDED 22 Aug 2026: every font-size in the product moved off the
       half pixel onto a whole one (10.5 -> 11), because a fractional size puts
       the glyph stems between device pixels and renders soft. The RELATION
       these two lines assert is the claim and it is unchanged — see the base
       rule in index.html for the whole sweep. */
    /* SIZES LIFTED ONE STEP 22 Aug 2026 (owner-asked: "mimic the font sizes
       and approach"). HaTi's interface type was running one to two steps below
       the design's — its workhorse is 14px where HaTi's was 11-12 — so every
       size at or below 14px moved up one rung. The RELATION each of these
       lines asserts is the claim and is unchanged. */
    assert.ok(/\.rl-idx-k\{[^}]*font-size:var\(--t-label\);font-weight:var\(--w-title\);letter-spacing:\.12em/.test(css),
      'the caption keeps its label type, on a whole pixel');
    const n = /\.rl-idx-n\{([^}]*)\}/.exec(css)[1];
    assert.match(n, /font-family:var\(--font-mono\)/,
      'and the count is mono — it is the one part of the head that is a number');
    assert.match(n, /font-variant-numeric:tabular-nums/,
      'in tabular figures, so 1 and 11 do not shift the words beside them');
    /* Option 1 (16 Aug 2026): where the filter tabs draw, the All tab is the
       count and the separate .rl-idx-n stands down — it survives only on a
       narrowed reviewer's head, which draws no tabs. The caption is always
       there; the count is there exactly once, in one form or the other. */
    /* RE-POINTED 24 Aug 2026 — the column is headed by the change index now
       (owner-approved render): a title, how many are open, a bar and "N of M
       decided", with the three-way cut as a dropdown on that line. THE CLAIM
       IS UNCHANGED and is what this always guarded: the number is said ONCE.
       The old .rl-idx-k caption is stood down where the index draws. */
    assert.ok(p.$('.rl-idx-title'), 'the index names itself');
    assert.ok(p.$('.rl-idx-n') === null
      ? !!p.$('#rl-cardfilter')
      : !p.$('#rl-cardfilter'),
      'the count appears exactly once — in the filter, or as its own span, never both');
  });
});
