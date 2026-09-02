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
  /* ---- THE NOTES PANEL, PAINTED INTO A PLAIN HOST ----
     The panel is the shell's drawer and buildWorld deliberately never loads the
     shell, so the element it normally lands in does not exist here. That is not
     a gap: rlNotesPanelPaint's whole contract is (host, c, ch, opts), so a bare
     div exercises the builder AND its wiring exactly as the drawer does. Which
     face the drawer is showing is app.js's job and is asserted there. */
  const notes = (ch, room) => {
    if (room) w.win.rlNpSetRoom(room);
    const host = w.win.document.createElement('div');
    w.win.document.body.appendChild(host);
    w.win.rlNotesPanelPaint(host, c, ch, { side: 'owner', author: ME.name, messages: c._messages });
    return host;
  };
  return { w, c, theirs, notes,
    $: sel => w.win.document.querySelector(sel),
    css: () => (w.win.document.getElementById('redline-layout-css') || { textContent: '' }).textContent };
}

/* REVERSED IN PLACE (owner-ruled 27 Aug 2026: "Internal vs external notes
   should not be in the same view"). The property these two were written for is
   unchanged and is asserted harder: our seat decides where a note goes, and the
   quiet path is what you land in. What moved is HOW — it was a switch set on
   the box, and it is the ROOM you are standing in now, which is a stronger
   guarantee because there is no setting left to leave pointing the wrong way. */
describe('f173 · the room is the destination, and it opens on Internal', () => {
  test('two rooms, Internal live, and no switch anywhere', async () => {
    const p = await mounted();
    assert.ok(p.$('#rl-changes .rl-card'), 'the card is drawn');
    assert.equal(p.$('#rl-changes .nego-visswitch'), null,
      'the routing row carries no composer of its own');
    assert.equal(p.$('#rl-cp-body .nego-visswitch'), null,
      'and neither does the clause panel any more — the box has left it');
    const host = p.notes(p.theirs, 'internal');
    const tabs = [...host.querySelectorAll('[data-rl-np-room]')];
    assert.deepEqual(tabs.map(t => t.getAttribute('data-rl-np-room')), ['internal', 'external'],
      'the panel offers exactly two rooms');
    assert.ok(tabs[0].classList.contains('on'), 'and opens on Internal');
    assert.equal(host.querySelector('.nego-visswitch'), null,
      'THE SWITCH IS GONE: there is nothing to set, so nothing to set wrongly');
  });

  test('each room names its own destination, without a sentence about it', async () => {
    /* REVERSED IN PLACE 2 Sep 2026 (owner-asked, off a screenshot of each
       line: "remove the highlighted areas. People are smart enough to know
       without being given explicit writing").

       WHAT STOOD HERE asserted the sentence over each room. It has gone from
       OUR seat, and the claim this test was written to make is unchanged and
       is now asserted where it belongs: the reader is told which room they are
       in by the TAB they pressed, by the box's own PLACEHOLDER — which is
       where the counterparty is NAMED, at the moment of typing — and by the
       tint the external composer wears. The line survives on the seat with no
       tabs, which f248 pins. */
    const p = await mounted();
    const int = p.notes(p.theirs, 'internal');
    assert.equal(int.querySelector('.rl-np-who'), null,
      'no sentence explaining the tab you just pressed');
    assert.ok(int.querySelector('[data-rl-np-room="internal"].on'),
      'the live tab is what says which room this is');
    assert.match(int.querySelector('.rl-np-in').placeholder, /your team/i,
      'and the box names its own audience');
    assert.ok(!int.querySelector('.rl-np-foot').classList.contains('out'),
      'the internal box wears no crossing mark');
    assert.match(int.querySelector('[data-rl-np-send]').textContent,
      new RegExp(p.w.win.i18t('ng_card_note_add'), 'i'), 'and its button adds a note');
    const ext = p.notes(p.theirs, 'external');
    assert.equal(ext.querySelector('.rl-np-who'), null,
      'nor over the external one');
    assert.ok(ext.querySelector('[data-rl-np-room="external"].on'));
    assert.match(ext.querySelector('.rl-np-in').placeholder, new RegExp(p.c.counterparty, 'i'),
      'THE COUNTERPARTY IS STILL NAMED BEFORE YOU TYPE — in the box itself');
    assert.ok(ext.querySelector('.rl-np-foot').classList.contains('out'),
      'and the box wears the crossing\'s own mark, so it cannot be mistaken for the other one');
    /* REVERSED IN PLACE 2 Sep 2026 (owner-asked, off a screenshot of this box:
       "this should not say reply rather Add note just like in the Internal
       tab"). Both rooms name the act the same way now, and the claim is
       STRONGER for it: what tells the two apart is the LINE above the box and
       the mark the box wears — both asserted three lines up — rather than a
       word on a button, which is where the distinction should live anyway.
       ng_send_this_reply is still live and is still the counterparty's own,
       on their card, where replying is exactly what they are doing. */
    assert.match(ext.querySelector('[data-rl-np-send]').textContent,
      new RegExp(p.w.win.i18t('ng_card_note_add'), 'i'),
      'and its button adds a note, in the internal room\'s own words');
    assert.equal(ext.querySelector('[data-rl-np-send]').textContent.trim(),
      int.querySelector('[data-rl-np-send]').textContent.trim(),
      'one word for one act, so no reader has to learn two');
    assert.ok(!/repl|svar/i.test(ext.querySelector('.rl-np-in').placeholder),
      'and the box it sits under does not ask for a reply either');
  });
});

describe('f173 · the counterparty\'s note arrives on the card', () => {
  /* REVERSED IN PLACE: their reply still has to reach the reader, and it now
     lands in the EXTERNAL room — which is where it belongs, because it crossed.
     A channel message is stamped shared by negoMergedThread, so this also pins
     that the room reading and the merge agree. */
  test('their reply lands in the external room, not the internal one', async () => {
    const p = await mounted({ channel: (win, theirs) => [{
      id: 'm1', topic: win.negoTopicFor(theirs), side: 'counterparty',
      author: 'Amina Wanjiru', at: '2026-08-10T10:00:00Z',
      body: 'Our AP cycle runs monthly — Net-30 forces out-of-cycle payments.' }] });
    assert.ok(Array.isArray(p.c._messages), 'the channel was fetched');
    const ext = p.notes(p.theirs, 'external');
    assert.match(ext.textContent, /AP cycle runs monthly/,
      'their words are in the room that crossed');
    assert.ok(ext.querySelector('.rl-np-note.is-them'),
      'marked as having come FROM them — the one thing the room cannot say');
    const int = p.notes(p.theirs, 'internal');
    assert.ok(!/AP cycle runs monthly/.test(int.textContent),
      'AND NOT IN THE INTERNAL ROOM: the two lists never share a note');
    assert.equal(p.w.win.negoNoteCounts(p.c, p.theirs, { messages: p.c._messages }, 'owner').external, 1);
  });

  test('with nothing in the channel the rooms are simply empty', async () => {
    const p = await mounted();
    assert.ok(Array.isArray(p.c._messages), 'fetched, and empty is a real answer');
    assert.equal(p.notes(p.theirs, 'external').querySelector('.rl-np-note'), null);
    assert.ok(p.notes(p.theirs, 'external').querySelector('.rl-np-empty'),
      'and an empty room says so rather than drawing nothing at all');
  });
});

describe('f173 · a long note folds instead of growing the card', () => {
  /* REVERSED IN PLACE: the property is that ONE pasted paragraph cannot set the
     height of everything around it, and it now protects the panel rather than
     the card. The fold, the three-line clamp and the reader's own way back are
     the same three things, re-pointed at rl-np. */
  test('past a few lines it clamps, with Show more under it', async () => {
    const p = await mounted();
    const essay = 'This clause needs careful thought. '.repeat(12);   // ~420 chars
    p.w.win.negoPostComment(p.c, p.theirs.id, essay, { side: 'owner', author: ME.name });
    const host = p.notes(p.theirs, 'internal');
    const note = host.querySelector('.rl-np-note');
    assert.ok(note.querySelector('p.rl-np-clamp'), 'the paragraph is clamped');
    const more = note.querySelector('[data-rl-note-more]');
    assert.ok(more, 'with the reader\'s own way to open it');
    /* The toggle is a class flip, not a repaint — a repaint would empty the box
       the reader may be halfway through typing into. */
    more.dispatchEvent(new p.w.win.Event('click', { bubbles: true, cancelable: true }));
    assert.ok(note.querySelector('p.rl-np-clamp.rl-np-open'), 'Show more opens it in place');
    assert.equal(more.textContent, p.w.win.i18t('ng_note_less'), 'and the button now offers the way back');
    more.dispatchEvent(new p.w.win.Event('click', { bubbles: true, cancelable: true }));
    assert.ok(!note.querySelector('p.rl-np-clamp.rl-np-open'), 'Show less folds it again');
  });

  test('a short note is just a note — no toggle, no clamp', async () => {
    const p = await mounted();
    p.w.win.negoPostComment(p.c, p.theirs.id, 'Fine by me.', { side: 'owner', author: ME.name });
    const note = p.notes(p.theirs, 'internal').querySelector('.rl-np-note');
    assert.ok(note, 'the note is drawn');
    assert.equal(note.querySelector('.rl-np-clamp'), null);
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
    /* RE-POINTED AGAIN 26 Aug 2026: the WHOSE ASKS filter is retired (the
       owner: "delete the whose ask feature"), so there is no longer a second
       place a count could be said. THE CLAIM IS THE ONE IT HAS ALWAYS BEEN
       and it is simply narrower now — the number is said ONCE, and the head's
       own title is where. */
    assert.ok(p.$('.rl-idx-title'), 'the index names itself');
    assert.match(p.$('.rl-idx-title').textContent, /\(\d+\)/,
      'and carries the count');
    assert.equal(p.$('#rl-cardfilter'), null, 'the retired filter says none');
    assert.equal(p.$('.rl-idx-n'), null, 'and no separate span says it either');
  });
});
