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
    const card = p.$('#rl-changes .rl-card');
    assert.ok(card, 'the card is drawn');
    const sw = card.querySelector('.nego-visswitch');
    assert.ok(sw, 'our seat has the visibility switch now');
    assert.equal(sw.querySelector('.v-int').getAttribute('aria-pressed'), 'true',
      'and it opens on Internal — the quiet path stays the safe one');
    assert.equal(sw.querySelector('.v-sh').getAttribute('aria-pressed'), 'false');
  });

  test('the button and the promise carry both faces for the switch to choose', async () => {
    const p = await mounted();
    const card = p.$('#rl-changes .rl-card');
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
    const card = p.$('#rl-changes .rl-card');
    assert.match(card.textContent, /AP cycle runs monthly/,
      'their words are on the change they are about');
    assert.ok(card.querySelector('.rl-cnote.is-shared'), 'wearing the shared wash');
  });

  test('with nothing in the channel the card simply has no notes', async () => {
    const p = await mounted();
    assert.ok(Array.isArray(p.c._messages), 'fetched, and empty is a real answer');
    assert.equal(p.$('#rl-changes .rl-cnote'), null);
  });
});

describe('f173 · a long note folds instead of growing the card', () => {
  test('past a few lines it clamps, with Show more under it', async () => {
    const p = await mounted();
    const essay = 'This clause needs careful thought. '.repeat(12);   // ~420 chars
    p.w.win.negoPostComment(p.c, p.theirs.id, essay, { side: 'owner', author: ME.name });
    p.w.win.renderRedline();
    const note = p.$('#rl-changes .rl-cnote');
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
    const note = p.$('#rl-changes .rl-cnote');
    assert.ok(note, 'the note is drawn');
    assert.equal(note.querySelector('.rl-cnote-clamp'), null);
    assert.equal(note.querySelector('[data-rl-note-more]'), null);
  });
});

describe('f173 · the column head is dressed like the queue\'s', () => {
  test('caption type, a count pill, and the hairline', async () => {
    const p = await mounted();
    const css = p.css();
    assert.ok(/\.rl-idx-head\{[^}]*border-bottom:1px solid var\(--color-divider\)/.test(css),
      'the head carries the same hairline the queue\'s head does');
    assert.ok(/\.rl-idx-k\{[^}]*font-size:9\.5px;font-weight:800;letter-spacing:\.12em/.test(css),
      'the caption takes .rl-q-label\'s own type');
    assert.ok(/\.rl-idx-n\{[^}]*border-radius:999px/.test(css),
      'and the count sits in a pill rather than floating as grey text');
    assert.ok(p.$('.rl-idx-head .rl-idx-k') && p.$('.rl-idx-head .rl-idx-n'),
      'both parts are drawn');
  });
});
