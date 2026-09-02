/* f246 — THE TRACKED-CHANGES COLUMN TAKES THE OWNER'S DRAWING (25 Aug 2026)
   ========================================================================
   "You neglected to build a very important feature to the app. How the new
   cards in the owner side are designed which is shown in the attached image."

   Five things in one drawing, and every one of them is a claim below:

     · the column names itself and carries the TOTAL in the name — "Tracked
       changes (7)" where it read "Change index";
     · the three-way cut is LABELLED — "WHOSE ASKS" beside a dropdown whose own
       word says only what it is set to;
     · the cards are grouped under FOUR BANDS, each with its own count;
     · a card is a meta line over a bold summary, with an action row under it —
       where this change stands at the left, the verbs at the right wall;
     · and the ⋯ menu carries what will not fit on that row, led by Edit with
       Copilot, which is where the approved clause journey has always put it.

   WHAT IS ON OUR SEAT ONLY, and it is asserted rather than assumed: the
   counterparty's column is untouched, as agreed twice — their card keeps the
   receipt and full shapes, their column draws no bands, and the owner's own
   PREVIEW of their page falls through to those same shapes so the window still
   shows what they see.

   THE COMPUTED HALF IS IN redline-verify, deliberately. buildWorld never loads
   the shell, and three of the claims here are really about pixels — whether
   the ⋯ menu's row is on screen once it is pressed, whether a band is drawn
   once, whether the card's two blocks stack. A rule that loses a cascade fight
   looks perfectly correct in the source, which this codebase has paid for more
   than once. So: the SHAPE and the RULES are pinned here; what DRAWS is pinned
   there, and the two name each other. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld, supplyContract } = require('./world');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const NEG = read('js/views/negotiation.js');
const NCSS = read('js/views/negotiation-css.js');
/* Comments carry the arguments in this codebase and would answer half of these
   assertions by accident. Every claim that reads source strips them first. */
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
const NEG_CODE = strip(NEG);

/* One bench, one contract, three changes in three different states — their
   live ask, our unsent draft, and a settled one — so every band the fixture
   can reach is reachable in one render. */
async function bench(o = {}){
  const w = buildWorld({ negotiationView: true });
  const { win } = w;
  /* ceTakesIt asks for the module BY NAME rather than only whether the width
     suits it, so this is what tells the two worlds apart: this world loads the
     edit page, and `noEditor` stands in for the stages that do not — the
     counterparty's seat, and a window too narrow for two columns. */
  if (o.noEditor){ win.rlOpenClauseEditor = undefined; win.clauseEditorFits = undefined; }
  win.promptDialog = async () => '';
  win.openAI = () => {}; win.aiPush = () => {}; win.renderAIFeed = () => {};
  win.copilotAvailable = () => false;
  win.openShareModal = () => {};
  win.counterpartyContact = () => ({ name: 'Nordkust', email: 'a@b.c' });
  win.reshareToLastRecipient = async () => ({ delivered: true });
  win.cachedShares = () => [];
  const c = supplyContract();
  win.negoInit(c);
  /* THEIRS, live and awaiting us. */
  await win.negoFileProposal(c, win.negoBaseText(c).replace('thirty (30) days', 'sixty (60) days'),
    { side: 'counterparty', author: 'Amina Wanjiru' });
  /* OURS, filed and never sent. */
  await win.negoFileProposal(c, win.negoResolvedText(c) + '\nA cap on liability of 100% of fees.',
    { side: 'owner', author: 'Young Mbagaya' });
  win.rlSetCardFilter('all');
  win.state = Object.assign({}, win.state, { contracts: [c], activeId: c.id, view: 'redline' });
  win.getContract = id => (id === c.id ? c : null);
  win.renderRedline();
  const $ = s => win.document.querySelector(s);
  const $$ = s => [...win.document.querySelectorAll(s)];
  return { w, win, c, $, $$, again: () => win.renderRedline(),
    /* OPEN ONE CARD. Since 2 Sep the row carries a single control and every
       verb, strip and note lives behind it, so a claim about what a change
       OFFERS has to open it first — reading the face alone would pass on a
       build that had lost the lot. */
    open: id => { win.rlCardSetOpen(id); win.renderRedline();
      return win.document.querySelector(`.rl-card-d[data-nego-card="${id}"]`); } };
}

/* ============================================================ 1 — THE HEAD */
describe('f246 (1) — the column names itself, and the name carries the total', () => {
  /* REVERSED IN PLACE 27 Aug 2026 (owner-asked: "Tracked changes should be now
     called Redlines (3) but do not add another number next to it"). The CLAIM
     is unchanged and is what it always was: the column heads itself, the name
     carries the book's own total, and the name is the dictionary's rather than
     a string typed here. Only which key it reads has moved. */
  test('"Redlines (N)", and both older names are retired', async () => {
    const p = await bench();
    const t = p.$('.rl-idx-title');
    assert.ok(t, 'the block heads itself');
    assert.equal(t.textContent.trim(),
      p.win.i18t('ng_redlines_head_n', { n: p.c.changes.length }),
      'the heading is the dictionary\'s, and the number in it is the book\'s own count');
    assert.doesNotMatch(t.textContent, /change index/i, 'the block\'s oldest name is gone');
    assert.doesNotMatch(p.$('.rl-idx').textContent, /tracked changes/i,
      'and so is the name it wore until this morning');
  });

  test('the total is BORROWED, never counted a second time', () => {
    /* The head, the filter's options and the bands all print counts of the
       same list. A second arithmetic here is how two halves of one column come
       to disagree, which is the fault this page has recorded twice. */
    const i = NEG_CODE.indexOf('ng_redlines_head_n');
    assert.ok(i > -1, 'the heading is still built here');
    const line = NEG_CODE.slice(i - 200, i + 200);
    assert.match(line, /changeTotal/, 'it prints the figure the rest of the head prints');
    assert.doesNotMatch(line, /\.filter\(|\.length\s*\)/,
      'and works nothing out for itself');
  });

  /* ---- AND IT SAYS ONE NUMBER (owner-asked 27 Aug 2026: "do not add another
     number next to it where in the renders it redundantly adds another 3") ----
     The head printed the book's total in its own name AND how many were still
     open beside it, which is the same round said twice on one line — and the
     pair was wide enough to wrap the row on a laptop, which is what pushed the
     column's own name onto a line of its own. How many are still open is said
     by the piles below, each named for exactly the state it holds and each
     carrying its own count. */
  test('and the open count is retired, in the markup and in the sheet', async () => {
    const p = await bench();
    assert.equal(p.$('.rl-idx-open'), null, 'nothing draws the second number');
    assert.equal(NCSS.indexOf('.rl-idx-open{'), -1,
      'and its rule is deleted rather than left standing');
    assert.equal(NCSS.indexOf('.rl-idx-open::before'), -1, 'dot and all');
    const head = p.$('.rl-idx-top').textContent;
    assert.doesNotMatch(head, /\bopen\b/i, 'the row says it once');
  });

  /* REVERSED IN PLACE 26 Aug 2026 (owner-asked, ringing the row: "delete this
     area completely"). The head said how far through the round you are TWICE:
     "Tracked changes (4)" and "3 open" on its own line, and "1 of 4 decided"
     twenty pixels lower. The sentence went; the BAR stays, because it is a
     glance rather than a number and was outside what the owner ringed. So the
     claim is the one that survives: the head still shows the round's shape,
     and it shows it once. */
  test('and the head still shows the round\'s shape, without saying it twice', async () => {
    const p = await bench();
    assert.equal(p.$('.rl-idx-foot'), null, 'the decided row is deleted, not hidden');
    assert.ok(p.$('.rl-idx-bar'), 'the bar still shows how far through it is');
    const head = p.$('.rl-idx').textContent;
    assert.equal((head.match(/\d+ of \d+/g) || []).length, 0,
      'and no sentence repeats what the title and the open count already say');
  });

  /* REVERSED IN PLACE 27 Aug 2026: the open marker went with the count it drew,
     so only the title half of this claim survives — and it survives whole. */
  test('the title still sits on its own rule', () => {
    /* The reference draws the title as the column's one tab — a 2px accent
       rule under the words and nothing else — so the head reads as a heading
       rather than as a row of chips. */
    const t = NCSS.slice(NCSS.indexOf('.redline-page .rl-idx-title{'),
      NCSS.indexOf('.redline-page .rl-idx-title i{'));
    assert.match(t, /border-bottom:2px solid var\(--accent-solid\)/, 'the title is a tab');
    assert.match(t, /margin-bottom:-1px/, 'sitting ON the head\'s hairline, not above it');
  });

  /* ---- THE ROUND'S TWO ACTS SIT TOGETHER (owner-asked 27 Aug 2026) ---- */
  test('Send all and Close Round share the head\'s right-hand end', async () => {
    const p = await bench();
    const top = p.$('.rl-idx-top');
    const send = top.querySelector('.rl-unsent-go');
    const close = top.querySelector('.rl-close-go');
    assert.ok(send, 'the send is in the head');
    assert.ok(close, 'and so is the close, from the first change onwards');
    assert.ok(close.hasAttribute('data-rl-close-round'),
      'it presses the page\'s own close handler, never a second path');
    /* ONLY EVER ONE OF THEM IS LIVE. Everything unsent has to travel before a
       round can be closed, so a live Send all means a dead Close and the pair
       can never both invite a press. That is the whole reason they may share
       one dress. */
    assert.equal(send.disabled, false, 'the send is live while something is unsent');
    assert.equal(close.disabled, true, 'and the close is not');
    assert.match(close.getAttribute('title'), /answer/i,
      'and it says why on its hover rather than after the press');
  });

  test('the close is drawn for nobody who may not press it', async () => {
    const p = await bench();
    const w = p.win;
    assert.equal(w.rlCloseRoundHtml(p.c, { side: 'counterparty' }), '',
      'a counterparty answers a round, they do not close one');
    assert.equal(w.rlCloseRoundHtml(p.c, { readonly: true }), '', 'nor a read-only copy');
    assert.equal(w.rlCloseRoundHtml({ ...p.c, changes: [] }, {}), '',
      'and nothing on the table is nothing to close');
  });

  /* ---- AND THE PAIR WEARS THE WORKSPACE ACCENT, NEVER AMBER (owner-asked
     27 Aug 2026: "green / blue depending on the mode as opposed to orange
     which is out of place") ----
     Amber on this page means one thing — work waiting on you — and a filled
     amber button spends that signal on a control rather than on a state.
     --accent-fill is accent-700, which is what makes white on it safe and what
     makes it follow the workspace: green in the teal one, navy in the other. */
  test('both acts are filled with the workspace accent, in one rule', () => {
    const i = NCSS.indexOf('.redline-page .rl-unsent-go,');
    assert.ok(i > -1, 'the two share one declaration');
    const r = NCSS.slice(i, NCSS.indexOf('}', i));
    assert.match(r, /\.rl-close-go\{/, 'and the close is the other half of it');
    assert.match(r, /background:var\(--accent-fill\)/, 'the accent fill, which follows the brand');
    assert.match(r, /color:#fff/, 'with white on it, which accent-700 is chosen for');
    assert.doesNotMatch(NCSS.slice(i, i + 900), /--st-amber/,
      'and no amber anywhere near either of them');
  });
});

/* ========================================================== 2 — WHOSE ASKS */
/* ---- SECTION 2 REVERSED IN PLACE (owner-asked 26 Aug 2026: "delete the
   whose ask feature") ----
   It held the WHOSE ASKS dropdown to its label and to three safety properties,
   because a control that HIDES changes is the one on this page that may never
   be silent. The control is gone, so the properties have nothing to be true
   of — and what it existed FOR is answered twice over by what replaced it: the
   piles SORT by the same reading instead of hiding, and the front edge of every
   row is coloured by whose ask it is.

   WHAT IS MEASURED HERE NOW is the only thing that still matters about it, and
   it is the stronger claim: the column cannot narrow AT ALL. A retired control
   whose machinery still narrows is a filter nobody can see, which is worse than
   the filter was. */
describe('f246 (2) — nothing hides a change any more', () => {
  test('the control is gone from the page', async () => {
    const p = await bench();
    assert.equal(p.$('#rl-cardfilter'), null, 'no dropdown');
    assert.equal(p.$('.rl-idx-fk'), null, 'and no label for one');
    assert.equal(p.$('.rl-idx-narrowed'), null, 'and no band saying it narrowed');
  });

  test('and the machinery behind it cannot narrow either', async () => {
    const p = await bench();
    const all = p.$$('#rl-changes .rl-card').length;
    assert.ok(all > 0, 'the column drew something');
    for (const cut of ['mine', 'theirs']){
      p.win.rlSetCardFilter(cut);
      p.again();
      assert.equal(p.$$('#rl-changes .rl-card').length, all,
        `setting the retired filter to ${cut} hides nothing`);
    }
    p.win.rlSetCardFilter('all');
    p.again();
    /* AND THE PILL COUNTS THE SAME LIST, which is the property those two have
       always had to share. */
    assert.equal(p.win.redlineCardIds(p.c, { side: 'owner' }).length, all,
      'the pill above the column counts what the column draws');
  });

  test('and the front edge has gone with it, for now', async () => {
    /* ---- REVERSED IN PLACE, 26 Aug 2026 (owner-asked: "delete the color
       coding of theirs vs mine as I am still thinking of a better solution") ----
       This claim was written the same day the filter was retired, on the
       reasoning that the edge answered at a glance the question the control
       used to ask. The owner has now taken BOTH away while they weigh a third
       answer, so what is pinned is the removal — and, more importantly, that
       the FACT survives it: data-rl-origin is still stamped on every row, so
       whatever replaces this is a rule to write and not a fact to go and find
       again. */
    const p = await bench();
    assert.doesNotMatch(NCSS, /\.rl-card-d\{border-left:3px solid/,
      'no coloured front edge on the row');
    assert.doesNotMatch(NCSS, /\.rl-card-d\[data-rl-origin="them"\]\{border-left-color/,
      'and nothing colours theirs differently');
    const row = p.$('#rl-changes .rl-card-d');
    assert.ok(row && row.hasAttribute('data-rl-origin'),
      'but the row still says whose ask it is, so the answer is one rule away');
    /* THE BOXED CARD KEEPS ITS OWN SPINE. That is the counterparty's seat and
       the owner's preview of it, where the rows carry no band headings and the
       edge is the only thing answering the question. */
    assert.match(NCSS, /\.rl-card\{[^}]*border-left:3px solid/,
      'the counterparty\'s boxed card is deliberately untouched');
  });
});

/* =============================================================== 3 — BANDS */
describe('f246 (3) — the bands', () => {
  test('every change lands in exactly one band, and the catch-all is last', async () => {
    const p = await bench();
    const { rlCardBand, RL_CARD_BANDS } = p.win;
    const bands = new Set(RL_CARD_BANDS);
    for (const ch of p.c.changes)
      assert.ok(bands.has(rlCardBand(ch, 'owner', new Set(), null, p.c)),
        'a change nobody thought of is still filed somewhere');
    assert.equal(rlCardBand(null, 'owner', new Set(), null, p.c), 'decided',
      'and nothing falls off the bottom of the column');
    assert.equal(RL_CARD_BANDS[RL_CARD_BANDS.length - 1], 'decided',
      'the catch-all sorts last, so an unknown state cannot lead the column');
  });

  test('the readings are questions, not statuses', async () => {
    const p = await bench();
    const { rlCardBand } = p.win;
    const theirs = p.c.changes.find(x => x.authorSide === 'counterparty');
    const ours = p.c.changes.find(x => x.authorSide === 'owner');
    const unsent = new Set([ours.id]);
    assert.equal(rlCardBand(theirs, 'owner', unsent, null, p.c), 'awaiting',
      'their live ask is what needs you');
    assert.equal(rlCardBand(ours, 'owner', unsent, null, p.c), 'drafts',
      'our unsent one is still on the desk');
    assert.equal(rlCardBand(ours, 'owner', new Set(), null, p.c), 'with',
      'and once it has gone it is with them');
  });

  /* ---- THE SETTLED PILE IS THREE PILES (owner-asked 26 Aug 2026) ----
     REVERSED IN PLACE: this asserted that accepted and withdrawn both answer
     'decided'. They no longer do, and the reason is the owner's own — with one
     pile holding two opposite outcomes every settled row had to print its own
     word to say which, which is the redundancy the split removes. What the
     claim is really about is unchanged and is still here: every settled state
     has exactly one home, and none of them is the catch-all. */
  test('a settled change goes to its own pile, never to the catch-all', async () => {
    const p = await bench();
    const { rlCardBand } = p.win;
    const ours = p.c.changes.find(x => x.authorSide === 'owner');
    const as = (over) => rlCardBand(Object.assign({}, ours, over), 'owner', new Set(), null, p.c);
    assert.equal(as({ status: 'accepted' }), 'accepted', 'agreed has a pile');
    assert.equal(as({ status: 'rejected' }), 'refused', 'and so does refused');
    assert.equal(as({ withdrawn: true }), 'withdrawn', 'and so does taken back');
    /* WITHDRAWN IS READ FIRST, whatever answer it carries underneath: it is a
       fact about the ask rather than about the answer. */
    assert.equal(as({ status: 'rejected', withdrawn: true }), 'withdrawn',
      'a withdrawn ask reads as withdrawn even when it was refused first');
    assert.equal(as({ status: 'superseded' }), 'decided',
      'and only a state nobody thought of reaches the catch-all');
  });

  /* REFUSED SITS ABOVE ACCEPTED — a refusal is still a sticking point and an
     acceptance is finished, which is rlCardRank's own reasoning applied to the
     headings. Pinned as a RELATION so re-ordering the piles costs one edit
     here and not three. */
  test('the piles run needs-you first and finished last', async () => {
    const p = await bench();
    const at = k => p.win.RL_CARD_BANDS.indexOf(k);
    for (const k of ['awaiting', 'drafts', 'review', 'held', 'with',
      'refused', 'accepted', 'withdrawn', 'decided'])
      assert.ok(at(k) > -1, `${k} is a band`);
    /* REVERSED IN PLACE 27 Aug 2026 (owner-asked: "move refusals to the top of
       the pile"). Refused was sixth, under five bands of work simply taking its
       course, so the one thing on this page that can stop the deal was the
       thing you had to scroll to find. Everything the claim was really about is
       kept: the rest still runs needs-you first and finished last. */
    assert.equal(at('refused'), 0, 'a refusal on the record leads the column');
    assert.ok(at('awaiting') < at('drafts'), 'then what needs you');
    assert.ok(at('drafts') < at('with'), 'then what you are still writing');
    assert.ok(at('with') < at('accepted'), 'then what has gone');
    assert.ok(at('accepted') < at('withdrawn'), 'and taken back is the quietest');
    assert.equal(at('decided'), p.win.RL_CARD_BANDS.length - 1,
      'and the catch-all is still last');
  });

  /* ---- AND THE DRAFTS PILE IS THREE (owner-asked 26 Aug 2026, off a
     screenshot of a reviewer's name squeezed to one letter: "remove the
     name"). A heading can say a state but not a person, so the two review
     states became headings of their own and the name came off the row. */
  test('an ask with a colleague has its own pile, and a held one another', async () => {
    const p = await bench();
    const { rlCardBand } = p.win;
    const ours = p.c.changes.find(x => x.authorSide === 'owner');
    const unsent = new Set([ours.id]);
    const held = p.win.reviewHeld, out = p.win.reviewOutFor;
    try {
      p.win.reviewHeld = ch => ch.id === ours.id;
      assert.equal(rlCardBand(ours, 'owner', unsent, null, p.c), 'held',
        'a colleague has stopped it going out');
      p.win.reviewHeld = () => false;
      p.win.reviewOutFor = (c, ch) => ch.id === ours.id ? { id: 'REV-1' } : null;
      assert.equal(rlCardBand(ours, 'owner', unsent, null, p.c), 'review',
        'and one merely asked about is out for review');
      /* WITHOUT A CONTRACT THE OLD ANSWER STANDS, which is what makes the new
         argument safe to leave optional — a caller with nothing to hand gets
         YOUR DRAFTS rather than a wrong pile. */
      assert.equal(rlCardBand(ours, 'owner', unsent, null), 'drafts',
        'a caller with no contract falls back to where it always sat');
    } finally {
      p.win.reviewHeld = held; p.win.reviewOutFor = out;
    }
  });

  test('the BAND is the outer sort and rlCardSort is the inner one', async () => {
    /* THE HALF A FIRST PASS GOT WRONG. rlCardSort orders by rlCardRank, and
       three of the four bands are all rank 0 — so a column left in rank order
       interleaves them and a heading either repeats or sits over a card it is
       not true of. Read in DOCUMENT ORDER, which is the only reading that can
       see it. */
    const p = await bench();
    const nodes = p.$$('#rl-changes .rl-band, #rl-changes .rl-card');
    assert.ok(nodes.length, 'the column drew something');
    const seen = [];
    let cur = null;
    for (const el of nodes){
      if (el.classList.contains('rl-band')){
        cur = el.getAttribute('data-rl-band');
        assert.ok(cur, 'every heading names its own band');
        assert.ok(!seen.includes(cur), `the ${cur} band is drawn once, not twice`);
        seen.push(cur);
      } else {
        assert.ok(cur, 'no card sits above the first heading');
        const ch = p.c.changes.find(x => x.id === el.getAttribute('data-nego-card'));
        assert.equal(p.win.rlCardBand(ch, 'owner',
          new Set(p.win.negoUnsentAsks(p.c, 'owner').map(x => x.id)), null, p.c), cur,
          'and every card sits under the heading that is true of it');
      }
    }
    assert.ok(seen.length >= 2, 'the fixture really does span more than one band');
  });

  test('a band carries its own count, and an empty band draws nothing', async () => {
    const p = await bench();
    for (const b of p.$$('#rl-changes .rl-band')){
      const n = Number(b.querySelector('b').textContent.trim());
      const under = p.$$(`#rl-changes .rl-card`).filter(card =>
        p.win.rlCardBand(p.c.changes.find(x => x.id === card.getAttribute('data-nego-card')),
          'owner', new Set(p.win.negoUnsentAsks(p.c, 'owner').map(x => x.id)), null, p.c)
          === b.getAttribute('data-rl-band')).length;
      assert.equal(n, under, 'the heading counts what is under it');
    }
    const drawn = p.$$('#rl-changes .rl-band').map(x => x.getAttribute('data-rl-band'));
    assert.ok(!drawn.includes('decided'),
      'nothing reaches the catch-all in this fixture, so no Decided heading — a heading over an empty pile is furniture');
  });
});

/* ================================================================ 4 — CARD */
describe('f246 (4) — the card is a meta line, a summary and an action row', () => {
  test('the row is the text and the acts, side by side and not stacked', async () => {
    /* THE REFERENCE'S OWN SHAPE, and a first pass got it wrong twice. It was
       built side by side, MEASURED as crushed — every card reading
       "CHG-006 · Cla…" over "hand, by c…" — and stacked into two rows. That
       was the right measurement and the wrong conclusion: what was eating the
       row was HaTi's BORDERED buttons and its filled provenance strip, neither
       of which the reference carries. Take those two off and it fits. Fix the
       cause, not the symptom. .rl-card-foot is STALE. */
    const p = await bench();
    const card = p.$('#rl-changes .rl-card-d');
    assert.ok(card, 'our seat draws the drawing\'s row');
    const txt = card.querySelector('.rl-card-txt');
    const side = card.querySelector('.rl-card-side');
    assert.ok(txt && side, 'the text and the acts');
    assert.equal(txt.compareDocumentPosition(side) & 4, 4, 'the text comes first');
    assert.equal(txt.parentElement, card, 'and neither is inside the other');
    assert.equal(side.parentElement, card);
    assert.equal(card.querySelector('.rl-card-foot'), null,
      'the stacked shape is gone — .rl-card-foot is stale');
  });

  test('and it is a ROW, not a card — no box, no spine', async () => {
    /* The reference draws hairline-separated rows on the column's own
       surface. Read off the sheet, because a rule that loses a cascade fight
       looks perfectly correct in the source — the computed half is measured in
       redline-verify. */
    const i = NCSS.indexOf('.redline-page .rl-card-d{');
    assert.ok(i > -1, 'the row has a rule');
    const rule = NCSS.slice(i, NCSS.indexOf('}', i));
    assert.match(rule, /border:0/, 'no box');
    assert.match(rule, /background:none/, 'no fill');
    assert.match(rule, /box-shadow:none/, 'no lift');
    assert.match(rule, /border-top:1px solid/, 'a hairline between rows instead');
  });

  test('the meta line names the change and its clause; the summary says what it is for', async () => {
    const p = await bench();
    const card = p.$('#rl-changes .rl-card-d');
    const meta = card.querySelector('.rl-card-meta').textContent;
    const ch = p.c.changes.find(x => x.id === card.getAttribute('data-nego-card'));
    assert.ok(meta.includes(ch.id), 'the reference');
    assert.ok(meta.includes(String(ch.clauseLabel || ch.clauseId)), 'and the clause it is on');
    assert.equal(card.querySelector('.rl-card-sum').textContent.trim(), ch.summary,
      'and the bold line is the change\'s own summary, quoted, never composed here');
  });

  /* ---- REVERSED IN PLACE (owner-asked 26 Aug 2026) ----
     This asserted that the state word stands down under AWAITING YOU and YOUR
     DRAFTS and draws everywhere else, because those two were the only headings
     that already said it. That reasoning was right, and splitting the settled
     and drafts piles made it true of EVERY heading — so the word comes off our
     seat's row entirely. The owner's own words: "if it is sent, then it is in
     the category of With Saw Sawa so it is redundant", and "remove the name".

     THE TWO THINGS THE OLD CLAIM WAS REALLY PROTECTING ARE BOTH STILL HERE,
     and they are what makes the removal safe rather than merely smaller: the
     status slot may not be duplicated by a second element, and no sentence may
     leave the product with the word. */
  test('our seat\'s row carries no status word at all', async () => {
    const p = await bench();
    for (const card of p.$$('#rl-changes .rl-card-d')){
      assert.equal(card.querySelector('.rl-badge'), null,
        'the heading above the row says which pile this is');
      assert.equal(card.querySelector('.rl-state'), null,
        '.rl-state was a second status element and is retired');
    }
    /* AND IT STAYS OFF ONCE THE ASK HAS GONE, which is the state the old rule
       drew a word for and the one the owner named. */
    p.win.negoHandOver(p.c, { to: 'counterparty' });
    p.again();
    const sent = p.$$('#rl-changes .rl-card-d');
    assert.ok(sent.length, 'the column still draws');
    for (const card of sent)
      assert.equal(card.querySelector('.rl-badge'), null,
        'a sent ask says nothing — WITH THEM is the heading over it');
  });

  test('the sentence the word carried rides on the row instead', async () => {
    /* A SENTENCE REMOVED FROM A SLOT MUST BE FINDABLE IN ANOTHER ONE BEFORE
       THE SLOT GOES. Every badge entry is [tone, word, hover]; the heading now
       says the word, so the hover joins the meta line's own title — and on the
       two review states that hover is what NAMES the colleague. */
    const p = await bench();
    p.win.negoHandOver(p.c, { to: 'counterparty' });
    p.again();
    const meta = p.$('#rl-changes .rl-card-d .rl-card-meta');
    assert.ok(meta, 'the row draws its reference line');
    const t = meta.getAttribute('title') || '';
    assert.ok(t.trim(), 'and it carries a hover');
    assert.ok(t.includes(p.c.counterparty),
      'which still says who a sent ask is waiting on');
  });

  /* ---- REVERSED IN PLACE, 2 Sep 2026 (owner-ruled: "the cards only had Open
     instead of edit, accepted etc ... you click open and the card expands and
     gives you all the options") ----
     This asserted the verbs sat BESIDE the text on the row. They are inside the
     card now, one press away, and the claim that mattered is untouched and is
     the one kept here: they are the SAME engine attributes, so the funnel, the
     desk rule and the review gate all still apply to a press. Where they are
     drawn moved; what they are did not. */
  test('the verbs are untouched — the same engine attributes, inside the card', async () => {
    const p = await bench();
    const theirId = p.c.changes.find(x => x.authorSide === 'counterparty').id;
    const theirs = p.open(theirId);
    assert.ok(theirs, 'their ask has a card');
    assert.ok(theirs.querySelector('[data-nego-accept]'), 'their ask still offers a decision');
    assert.ok(theirs.querySelector('[data-nego-reject]'), 'both ways');
    assert.ok(theirs.querySelector('.rl-cb .rl-card-verbs'),
      'and the verbs are in the body the card opens into');
    const mineId = p.c.changes.find(x => x.authorSide === 'owner').id;
    assert.ok(p.open(mineId).querySelector('[data-rl-send]'),
      'our draft still carries its own Send');
  });

  /* ---- AND THE FACE CARRIES ONE CONTROL AND NOTHING ELSE ----
     The whole of the owner's ruling, asserted as an ABSENCE: a closed card may
     offer no verb at all, because the reader is meant to open it first. */
  test('a closed card offers exactly one control, and it is Open', async () => {
    const p = await bench();
    p.win.rlCardSetOpen(null); p.again();
    for (const card of p.$$('#rl-changes .rl-card-d')){
      const btns = [...card.querySelectorAll('button')];
      assert.equal(btns.length, 1,
        'one control on the face — found ' + btns.map(b => b.textContent.trim()).join(', '));
      assert.ok(btns[0].hasAttribute('data-rl-card-open'), 'and it is Open');
      assert.equal(btns[0].textContent.trim(), p.win.i18t('ng_row_open'));
      assert.equal(btns[0].getAttribute('aria-expanded'), 'false');
    }
  });

  test('opening one closes the last — a column of open cards is the wall the piles answered', async () => {
    const p = await bench();
    const ids = p.c.changes.map(x => x.id);
    p.open(ids[0]);
    const second = p.open(ids[1]);
    assert.ok(second.querySelector('.rl-cb'), 'the one just opened has a body');
    assert.equal(p.$(`.rl-card-d[data-nego-card="${ids[0]}"] .rl-cb`), null,
      'and the one before it does not');
  });

  test('the conditional strips are still drawn, between the text and the acts', async () => {
    /* None may be dropped: a card with a hole in it and the explanation
       somewhere else is worse than either. */
    const p = await bench();
    const card = p.$$('#rl-changes .rl-card-d').find(el => el.querySelector('.rl-card-info'));
    if (!card) return;                       // the fixture may carry none
    const info = card.querySelector('.rl-card-info');
    assert.equal(info.parentElement, card, 'the strip is the row\'s own child');
    /* It takes the whole width and drops UNDER the row, which is what keeps
       the row a row. RE-POINTED, not weakened: the row is a two-track grid now
       rather than a wrapping flex line (see the two-thirds rule), so the way a
       strip claims the whole width is grid-column rather than a 100% basis.
       The claim is the same claim. */
    const i = NCSS.indexOf('.redline-page .rl-card-d .rl-card-info,');
    assert.ok(i > -1);
    assert.match(NCSS.slice(i, NCSS.indexOf('}', i)), /grid-column:1\/-1/);
  });
});

/* ================================================================ 5 — THE ⋯ */
describe('f246 (5) — the card opens instead of a menu', () => {
  /* ================================================================
     REVERSED IN PLACE, 2 Sep 2026 — the owner's ruling:

       "What if the cards only had Open instead of edit, accepted etc. You then
        click open and the cards only expands and gives you all the options
        that are hidden in the dropdown including the comments for the card."
        ... "remove go to clause because simply clicking on the card already
        takes you to the Clause."

     THE ⋯ IS RETIRED AND `rlCardMoreHtml` IS A STUB. What was really being
     protected by the claims that stood here was never the menu's shape — it was
     that the card offers every door exactly once, that the two doors onto a
     clause's wording are decided by ONE reading, that nothing here decides
     anything of its own, and that a stage which cannot open the edit page still
     has a way into the panel. Every one of those is kept below and now reads
     off the card's body. Only the claims about the menu's own furniture — its
     header, its shut state, its rule between the groups, its listener — go with
     the menu.
     ================================================================ */
  test('the menu is retired, and stubbed rather than deleted', () => {
    /* This file's own convention for a builder whose feature has gone: it is
       published and it had a caller, so a third caller must not be able to
       bring the menu back through a door nobody remembered. */
    assert.match(NEG_CODE, /function rlCardMoreHtml\([^)]*\)\{[\s\S]{0,2200}?return '';\n\}/,
      'rlCardMoreHtml answers with nothing');
    assert.equal(NEG_CODE.indexOf('rlFaceSplit(rvCancel'), -1,
      'and the two-on-the-face split has no caller left');
  });

  test('no card draws a ⋯ any more, open or shut', async () => {
    const p = await bench();
    assert.equal(p.$('#rl-changes .rl-more-menu'), null, 'shut');
    p.open(p.c.changes[0].id);
    assert.equal(p.$('#rl-changes .rl-more-menu'), null, 'and open');
  });

  test('the editor door is drawn exactly once per open card, never twice', async () => {
    /* THE CLAIM IS UNCHANGED and is still the stronger one: a card offering the
       same page twice is the fault, and so is a card offering it not at all.
       Both halves are read, because either alone would pass on a build that had
       lost the door. */
    const p = await bench();
    let seen = 0;
    for (const ch of p.c.changes){
      const card = p.open(ch.id);
      const doors = card.querySelectorAll('[data-rl-cp-editor-row]');
      assert.ok(doors.length <= 1,
        'one clause, one way into the edit page — ' + doors.length + ' drawn');
      if (doors.length){
        seen += 1;
        assert.equal(doors[0].getAttribute('data-rl-cp-editor-change'), ch.id,
          'named for this change');
      }
    }
    assert.ok(seen, 'and the door really is drawn');
  });

  test('and it names Copilot, in Copilot\'s own colour', async () => {
    /* On the row this verb had to be one short word; in the body there is room,
       so the name and the violet come back rather than going with the menu. */
    const p = await bench();
    const card = p.open(p.c.changes.find(x => x.authorSide === 'counterparty').id);
    const b = card.querySelector('[data-rl-cp-editor-row]');
    assert.ok(b, 'the door is there');
    assert.ok(b.textContent.includes(p.win.i18t('ng_cp_copilot')), 'and it says so');
    assert.ok(b.classList.contains('rl-verb-ai'), 'wearing the Copilot class');
    const i = NCSS.indexOf('.rl-card-verbs button.rl-verb-ai{');
    assert.ok(i > -1, 'which the sheet dresses');
    assert.match(NCSS.slice(i, NCSS.indexOf('}', i)), /color:#6d28d9/, 'the Copilot violet');
    assert.ok(NCSS.includes('html.dark .redline-page .rl-card-d .rl-card-verbs button.rl-verb-ai'),
      'with a night answer');
  });

  test('our seat has no door onto the clause panel', async () => {
    /* The second of the two doors the owner shut on 30 Aug. Unchanged. */
    const p = await bench();
    for (const ch of p.c.changes)
      assert.ok(!p.open(ch.id).querySelector('[data-rl-cp-open]'),
        'the panel is not offered where the edit page takes the clause');
  });

  test('A STAGE WITHOUT THE EDIT PAGE KEEPS THE JUMP AND THE PANEL', async () => {
    /* THE CAPABILITY THIS SECTION EXISTS FOR, and the one thing retiring the ⋯
       could have taken away silently: on a window too narrow for the editor's
       two columns, and on a stage that does not load the module, the clause
       panel is the ONLY way a clause is edited. The row that carried it was the
       menu's; it is a verb in the body now, on exactly the same condition. */
    const p = await bench({ noEditor: true });
    const card = p.open(p.c.changes.find(x => x.authorSide === 'counterparty').id);
    assert.ok(!card.querySelector('[data-rl-cp-editor-row]'),
      'no door onto a page this stage cannot open');
    assert.ok(card.querySelector('[data-rl-edit]'), 'Edit is the jump again');
    assert.ok(card.querySelector('[data-rl-cp-open]'),
      'and the clause panel is back, because here it is the only way in');
  });

  test('the reading is named once, and the body asks it', () => {
    /* Pin the relation, not the expression — the 1 Sep lesson, unchanged. */
    assert.match(NEG_CODE, /if \(!ceTakesIt && opts\.cpPanel/,
      'the body draws the panel door only where the editor cannot take the clause');
    assert.match(NEG_CODE, /const ceTakesIt = rlEditorTakesIt\(side, \{ preview: previewSeat \}\);/,
      'and the reading is the named one');
  });

  test('EVERY VERB IS AN EXISTING CONTROL, so the body decides nothing', async () => {
    /* The menu's own rule, kept: this is a place things are DRAWN, never a
       second path into the record. Every button in an open card carries an
       attribute some existing handler already owns. */
    const KNOWN = ['data-nego-accept', 'data-nego-reject', 'data-nego-undo',
      'data-nego-redecide', 'data-nego-withdraw', 'data-rl-send', 'data-rl-sendcopy',
      'data-rl-retract', 'data-rl-edit', 'data-rl-cp-editor-row', 'data-rl-cp-open',
      'data-rl-ask-review', 'data-rv-cancel', 'data-rv-verdict', 'data-rl-reopen',
      'data-rl-card-open', 'data-rl-np-room', 'data-rl-np-send', 'data-rl-note-more'];
    const p = await bench();
    for (const ch of p.c.changes)
      for (const b of p.open(ch.id).querySelectorAll('button')){
        const names = [...b.attributes].map(a => a.name);
        assert.ok(names.some(n => KNOWN.includes(n)),
          'every control is one the engine already owns — ' + names.join(','));
      }
  });

  test('and the body files nothing of its own', () => {
    /* The builder may compose what the card renderer handed it and read the
       notes; it may not reach the record. */
    const i = NEG_CODE.indexOf('function rlCardBodyHtml');
    assert.ok(i > -1);
    const fn = NEG_CODE.slice(i, NEG_CODE.indexOf('\nfunction ', i + 10));
    for (const bad of ['negoFileChange', 'negoResolve', 'persist(', 'logAudit', 'changes.push'])
      assert.ok(!fn.includes(bad), 'the body builder must not reach ' + bad);
  });
});

describe('f246 (6) — the counterparty\'s column is untouched', () => {
  test('their embed draws no bands and keeps the shapes it had', async () => {
    const p = await bench();
    const box = p.win.document.createElement('div');
    box.innerHTML = p.win.redlinePanesHtml(p.c,
      { side: 'counterparty', org: 'Nordkust Industri AB', hiddenIds: [] });
    assert.equal(box.querySelector('.rl-band'), null, 'no bands on their seat');
    assert.equal(box.querySelector('.rl-card-d'), null, 'and not the owner\'s card shape');
    assert.ok(box.querySelector('.rl-card'), 'they still get a column of cards');
  });

  test('and the owner\'s PREVIEW of their page shows what they see', () => {
    /* The window's whole purpose. previewSeat is what excludes it from the
       owner branch, and it is read from the mount rather than worked out
       again. */
    assert.ok(NEG_CODE.includes("side === 'owner' && !previewSeat"),
      'the owner card branch refuses the preview seat');
    /* ONE READING, SHARED. rlBandOpts answers "does this seat draw bands" and
       "what is unsent on it" for the card renderer AND for redlineCardIds, so
       the column and the pill cannot disagree about the order they share. */
    const i = NEG_CODE.indexOf('function rlBandOpts');
    assert.ok(i > -1, 'the reading is a named function, not a copy in each caller');
    const body = NEG_CODE.slice(i, NEG_CODE.indexOf('\n}', i));
    assert.match(body, /banded: side === 'owner' && !previewSeat/,
      'and the bands take the same answer');
    /* RE-POINTED 26 Aug 2026, and STRENGTHENED. This pinned the call spelled
       inline; the pill reads the same answer TWICE now — once to decide
       whether settled work is in its population at all, and once to sort it —
       so it holds bandOpts in a local rather than calling twice, which is the
       only way the two readings cannot drift. The claim is the stronger one:
       the pill asks rlBandOpts exactly once and uses that answer for both. */
    const j = NEG_CODE.indexOf('function redlineCardIds');
    assert.ok(j > -1);
    const pill = NEG_CODE.slice(j, NEG_CODE.indexOf('\n}', j));
    assert.equal((pill.match(/rlBandOpts\(/g) || []).length, 1,
      'the pill asks the reading once');
    assert.match(pill, /const bandOpts = rlBandOpts\(c, opts, side\)/,
      'and holds the answer');
    assert.match(pill, /rlCardSort\(kept, heldIds, bandOpts\)/,
      'the pill\'s own list is sorted by it too');
    assert.match(pill, /bandOpts\.banded && _rlSettledCard\(x\)/,
      'and settled work joins its population only where the headings draw');
  });
});

/* ============================================================ 7 — THE SHEET */
describe('f246 (7) — the rules that draw it', () => {
  test('every new rule is scoped to this page and to this card', () => {
    for (const sel of ['.rl-band', '.rl-card-d .rl-card-meta', '.rl-card-d .rl-card-sum',
                       '.rl-card-d .rl-card-side', '.rl-more-menu', '.rl-idx-fk'])
      assert.ok(NCSS.includes('.redline-page ' + sel),
        `${sel} is written for the negotiation page`);
  });

  test('the state\'s dot takes its colour from the tone, not from a second table', () => {
    const i = NCSS.indexOf('.redline-page .rl-card-d .rl-badge i');
    assert.ok(i > -1, 'the dot has a rule');
    assert.match(NCSS.slice(i, i + 200), /background:currentColor/,
      'so the four tone rules give it its colour for free');
  });

  test('both lines are one line each, and they elide', () => {
    /* The reference's row is exactly two lines tall — the reference over the
       summary — with the acts level beside them. A summary allowed to wrap
       would take the acts with it. */
    for (const k of ['.rl-card-meta', '.rl-card-sum']){
      const i = NCSS.indexOf('.redline-page .rl-card-d ' + k + '{');
      assert.ok(i > -1, k + ' has a rule');
      const rule = NCSS.slice(i, NCSS.indexOf('}', i));
      assert.match(rule, /white-space:nowrap/, k + ' is one line');
      assert.match(rule, /text-overflow:ellipsis/, 'and elides');
    }
  });

  test('the text claims what is LEFT, not its own content width', () => {
    /* BASIS ZERO, NOT AUTO. With basis auto a flex item's base size is its
       max-content, and on a long summary the base sizes overflow the line and
       the acts wrap underneath — the stacked card coming back through the
       other door. */
    const i = NCSS.indexOf('.redline-page .rl-card-d .rl-card-txt{');
    assert.ok(i > -1);
    assert.match(NCSS.slice(i, NCSS.indexOf('}', i)), /flex:1 1 0/);
  });

  test('the verbs are bare coloured words on this row, and only on this row', () => {
    /* The reference's own drawing. It does NOT reverse 24 Aug's "every button
       carries the head row's line": that ruling was about the HEAD ROW, and
       applying it here was the wrong precedent — three bordered buttons are
       what crushed the text this row exists to show. Scoped to .rl-card-d, so
       the counterparty's card and every head row keep their outlines. */
    const i = NCSS.indexOf('.redline-page .rl-card-d .rl-card-verbs button{');
    assert.ok(i > -1, 'the verbs have a rule of their own on this row');
    const rule = NCSS.slice(i, NCSS.indexOf('}', i));
    assert.match(rule, /border:0/, 'no outline');
    assert.match(rule, /background:none/, 'and no fill');
    assert.ok(!NCSS.includes('.redline-page .rl-card-verbs button{border:0'),
      'and the base rule is untouched, so the other seat keeps its own');
  });

  test('the reference leads and the redline reads quietly', () => {
    /* REVERSED IN PLACE 2 Sep 2026 (owner-asked, off a render: "the change
       number and clause to be in bold and black font while the redline is not
       in bold and in grey but with both keeping the same font size").

       WHAT STOOD HERE was 'a settled change reads quietly' — a settled summary
       dropping to the regular weight and the label shade, which was the ONE
       thing telling it apart from a live one once the row lost its box. That
       is now what EVERY summary does, so the rule that did it is gone and its
       ABSENCE is the claim: a declaration restating the base is noise the next
       reader has to rule out. What still separates the piles is the band
       heading over each, which f246 (4) asserts in its own right. */
    const meta = NCSS.indexOf('.redline-page .rl-card-d .rl-card-meta{');
    const sum  = NCSS.indexOf('.redline-page .rl-card-d .rl-card-sum{');
    assert.ok(meta > -1 && sum > -1, 'both lines have a rule on this row');
    const mr = NCSS.slice(meta, NCSS.indexOf('}', meta));
    const sr = NCSS.slice(sum,  NCSS.indexOf('}', sum));

    /* PIN THE RELATION, NOT THE NUMBER: one size on both lines, and weight and
       ink are what separate them. The size token may move in a later type pass
       and this costs no edit — what may not move is that they read alike. */
    const size = /font-size:(var\(--[a-z-]+\))/;
    assert.ok(size.test(mr) && size.test(sr), 'each names a size');
    assert.equal(mr.match(size)[1], sr.match(size)[1],
      'the reference and the summary read at ONE size');
    assert.match(mr, /line-height:18px/, 'and share one line box, or the pair reads as a mistake');
    assert.match(sr, /line-height:18px/);

    assert.match(mr, /font-weight:var\(--w-title\)/, 'the reference is the bold one');
    assert.match(mr, /color:var\(--color-text\)/,    'and carries the primary ink');
    assert.match(sr, /font-weight:var\(--w-body\)/,  'the redline is the regular one');
    assert.match(sr, /color:var\(--color-neutral-600\)/, 'and the label shade');

    assert.equal(NCSS.indexOf('.redline-page .rl-card-d.rl-card-done .rl-card-sum{'), -1,
      'and the settled rule is DELETED rather than left restating the base');
  });

  test('finished business steps back, and refused is not finished business', () => {
    /* owner-asked 2 Sep 2026, off a render: "I want to have the accepted and
       withdrawn clause where they are currently in black font to be grey".

       This is the mark the type change above SPENT, coming back — its own note
       said the way back was "the reference in the label shade on a settled
       row, and it is one rule", and this is that rule.

       THE SET IS NARROWER THAN THE SETTLED ONE, which is the whole claim:
       being finished and being quiet are two different questions, and REFUSED
       leads this column precisely because it can still stop the deal. */
    const NJS = read('js/views/negotiation.js');

    assert.match(NJS, /const RL_QUIET_BANDS = \['accepted', 'withdrawn'\];/,
      'the bands that step back are a NAMED SET, like the settled one above it');
    for (const b of ['refused', 'decided'])
      assert.ok(!/const RL_QUIET_BANDS = \[[^\]]*\]/.exec(NJS)[0].includes(`'${b}'`),
        `${b} is NOT in it — it stays black`);

    /* PIN THE RELATION: the quiet set is a strict subset of the settled one, so
       a band can never step back without also being finished. */
    const setOf = k => JSON.parse(new RegExp(`const ${k} = (\\[[^\\]]*\\])`)
      .exec(NJS)[1].replace(/'/g, '"'));
    const settled = setOf('RL_SETTLED_BANDS'), quiet = setOf('RL_QUIET_BANDS');
    assert.ok(quiet.length && quiet.every(b => settled.includes(b)),
      'and every quiet band is a settled one — the smaller question of which recede');
    assert.ok(quiet.length < settled.length,
      'strictly smaller, or the two questions have collapsed into one');

    /* THE MARKER IS ITS OWN, so `rl-card-done` keeps meaning FINISHED — it is
       what the open card's lead wording and f89 both read. */
    assert.match(NJS, /RL_QUIET_BANDS\.includes\(band\) \? ' rl-card-quiet' : ''/,
      'stamped from the set, on the row');
    assert.match(NJS, /RL_SETTLED_BANDS\.includes\(band\) \? ' rl-card-done' : ''/,
      'and the settled marker is untouched beside it');

    const i = NCSS.indexOf('.redline-page .rl-card-d.rl-card-quiet .rl-card-meta{');
    assert.ok(i > -1, 'and one rule greys the reference on those rows');
    const rule = NCSS.slice(i, NCSS.indexOf('}', i));
    assert.match(rule, /color:var\(--color-neutral-600\)/,
      'to the SUMMARY\'S OWN ink, so the whole row lands on one shade');
    assert.ok(!/font-size|font-weight/.test(rule),
      'the colour and nothing else — it keeps its size and its bold weight');
  });
});

/* =========================================================== 8 — THE WORDS */
describe('f246 (8) — it speaks both languages', () => {
  test('every new key is in both dictionaries', () => {
    const src = read('js/i18n.js');
    for (const k of ['ng_tracked_head_n', 'ng_whose_asks', 'ng_band_awaiting',
                     'ng_band_drafts', 'ng_band_with', 'ng_band_decided',
                     'ng_row_open_panel', 'ng_row_jump', 'ng_row_more_title'])
      assert.equal((src.match(new RegExp('^\\s*' + k + ':', 'gm')) || []).length, 2,
        `${k} is written once in each language`);
  });

  test('the band that names the other side takes their name', async () => {
    const p = await bench();
    const band = p.$$('#rl-changes .rl-band')
      .find(x => x.getAttribute('data-rl-band') === 'with');
    if (!band) return;
    assert.ok(band.textContent.includes(p.c.counterparty),
      'a heading about them says who they are');
  });
});

/* ============================================ 8 — THE COLUMN'S OWN SPACING */
describe('f246 (8) — one ruled list, and the act at the head', () => {
  /* ---- OWNER-ASKED 26 Aug 2026, MEASURED AGAINST THE REFERENCE COLUMN ----
     The rows were 67px apart against the reference's 53, with 22.5px of air
     above each hairline and 11.5 below — so the rule hugged the row beneath
     rather than dividing the two. The cause was ONE DECLARATION NOBODY RESET:
     the flat row replaced a boxed card that stood 11px clear of the next one,
     the box went and its margin stayed. The hairline also ran 426px of a 458px
     column while the band headings ran the full width, because the scroller
     insetted the rows and the bands cancelled that inset with a negative
     margin — one list, ruled two different lengths.

     WRITTEN AS RELATIONS, NOT NUMBERS, so the next type or spacing pass costs
     no edit here: what is pinned is that the row resets the box's margin, that
     the row and the band inset by the SAME TOKEN, and that the scroller insets
     nothing at all. */

  test('the row does not carry the boxed card\'s margin any more', () => {
    const row = /\.redline-page \.rl-card-d\{([^}]*)\}/.exec(NCSS)[1];
    assert.match(row, /margin:0/,
      'no leftover gap under each row — that is what made the rule off-centre');
    assert.match(row, /border-top:1px solid var\(--color-divider\)/,
      'and the rule between two rows is a hairline, drawn once');
    /* THE BOXED CARD IS WHERE THAT MARGIN BELONGS AND STILL HAS IT. */
    assert.match(/\.redline-page \.rl-card\{([^}]*)\}/.exec(NCSS)[1], /margin-bottom:11px/,
      'the counterparty\'s boxed card keeps it — that is what a box is for');
  });

  test('one ruling, wall to wall: the scroller insets nothing and the row insets itself', () => {
    assert.match(NCSS, /\.redline-page \.rl-cards\{padding:0\}/,
      'the scroller no longer holds the rows off the walls');
    const row = /\.redline-page \.rl-card-d\{([^}]*)\}/.exec(NCSS)[1];
    const band = /\.redline-page \.rl-band\{([^}]*)\}/.exec(NCSS)[1];
    assert.match(row, /padding:9px var\(--s-4\)/, 'the row carries the inset itself');
    assert.match(band, /padding:7px var\(--s-4\) 6px/, 'and the heading uses the SAME token');
    assert.match(band, /margin:0/,
      'so the heading has nothing left to cancel — it was margin:0 -16px');
  });

  test('every pile\'s count sits at the right wall', () => {
    assert.match(/\.redline-page \.rl-band b\{([^}]*)\}/.exec(NCSS)[1], /margin-left:auto/,
      'so seven of them line up rather than each following its own words');
  });

  test('the column\'s name shares the rows\' left edge', () => {
    assert.match(/\.redline-page \.rl-idx\{([^}]*)\}/.exec(NCSS)[1],
      /padding:var\(--s-3\) var\(--s-4\) 11px/,
      'the index insets by the same token as the rows and the headings');
  });

  test('SEND ALL is at the opposite end of the column\'s name', async () => {
    const p = await bench();
    const go = p.$('.rl-unsent-go');
    assert.ok(go, 'the act is drawn');
    assert.ok(go.closest('.rl-idx-top'),
      'in the head\'s own top row, not above the cards');
    /* THE SPACER IS WHAT PUTS IT AT THE WALL, and it has been there unused
       since the head was built. */
    const top = go.closest('.rl-idx-top');
    const kids = [...top.children];
    assert.ok(kids.indexOf(top.querySelector('.rl-idx-sp')) < kids.indexOf(go),
      'after the spacer, so it is pushed to the right wall');
    assert.equal(p.$('.rl-unsent'), null, 'and the strip it came from is gone');
  });
});

/* ============================================================
   f246 (9) — WHERE A CLAUSE IS EDITED, DECIDED ONCE
   ------------------------------------------------------------
   Owner-reported 1 Sep 2026, off a screenshot of the retired clause panel:
   "I do not recall what I clicked on but the feature in image 5 appeared again
   when it is supposed to be completely eliminated from the internal side of the
   platform. Review what caused the bug and clean it up."

   THE CAUSE WAS THREE COPIES OF ONE READING AND NONE WHERE IT MATTERED. The
   paper's pencil, the card's Edit and the ⋯ menu's Copilot row each worked out
   for themselves whether the edit page takes the clause; the [data-rl-edit]
   HANDLER — the thing that actually opens the panel — asked nothing at all.

   SO THE PANEL CAME BACK THROUGH THE MENU'S OWN "Jump to the clause" ROW. That
   row exists for a card with no Edit on its face, and its guard tested for
   `data-rl-edit=` — which was the card's Edit until 30 Aug and is now only the
   COUNTERPARTY's. On our seat the face carries `data-rl-cp-editor-row`, so the
   guard saw a bare face where there was an Edit, drew the row on almost every
   card, and pressing it opened the panel.

   BOTH HALVES ARE NEEDED and each is asserted below: the guard reads both
   doors, AND the handler asks the reading — because a card with no other rows
   at all still draws that row deliberately, so the guard alone cannot close it.
   ============================================================ */
describe('f246 (9) — one reading, four askers', () => {
  test('the reading is named once, and nobody keeps a copy', () => {
    assert.match(NEG_CODE, /function rlEditorTakesIt\(side, opts = \{\}\)\{/,
      'named where the doors that ask it can reach it');
    /* THE THREE QUESTIONS ARE UNCHANGED — their seat, a window too narrow for
       two columns, and a stage that does not load the module at all. */
    const fn = NEG_CODE.match(/function rlEditorTakesIt[\s\S]*?\n\}/)[0];
    assert.match(fn, /side === 'counterparty' \|\| opts\.preview/);
    assert.match(fn, /typeof window\.rlOpenClauseEditor !== 'function'/,
      'the MODULE by name, not merely the width');
    assert.match(fn, /clauseEditorFits\(\)/);
    /* AND NOBODY WORKS IT OUT AGAIN. Four askers, four calls, zero copies —
       a destination decided in four places is four places for them to
       disagree, and that disagreement is exactly what the owner photographed. */
    assert.equal((NEG_CODE.match(/typeof window\.rlOpenClauseEditor === 'function'/g) || []).length, 0,
      'no hand-rolled copy of the reading survives');
    /* RE-POINTED 2 Sep 2026: the ⋯ was one of the askers and has gone, so the
       count is the definition plus the three that remain — the paper's pencil,
       the card, and the [data-rl-edit] handler. The CLAIM is unchanged: every
       one of them ASKS rather than working it out again. */
    assert.ok((NEG_CODE.match(/rlEditorTakesIt\(/g) || []).length >= 4,
      'the definition plus its askers');
  });

  /* ---- REVERSED IN PLACE, 2 Sep 2026 ----
     This pinned the ⋯ menu's guard against drawing a jump row beside a face
     that already had one. The menu has gone and the card carries every door
     exactly once by construction — there is no second list to keep in step —
     so what the guard was protecting is now asserted directly: one door per
     card, on the open card, in section 5. This keeps the OTHER half of the
     claim, which is still a live rule: the two doors are mutually exclusive. */
  test('a card offers ONE way into its clause, never both', async () => {
    const p = await bench();
    for (const ch of p.c.changes){
      const card = p.open(ch.id);
      const editor = card.querySelectorAll('[data-rl-cp-editor-row]').length;
      const jump = card.querySelectorAll('[data-rl-edit]').length;
      assert.ok(!(editor && jump),
        'the same act drawn twice is the fault the menu\'s guard existed for');
    }
  });

  test('on our seat the press is a jump and nothing more', () => {
    const h = NEG_CODE.match(/\[data-rl-edit\]'\)\.forEach[\s\S]*?\n  \}\)\);/)[0];
    assert.match(h, /rlJumpToClause\(clauseId\)/, 'it still lights the clause');
    assert.match(h, /if \(rlEditorTakesIt\(\(opts && opts\.side\) \|\| 'owner'\)\) return;/,
      'and stops there where the edit page is the door — the row promises a '
      + 'jump and must not also open a retired panel');
    const stop = h.indexOf('rlEditorTakesIt(');
    assert.ok(stop > -1 && stop < h.indexOf('rlCpSetShown'),
      'the reading is asked BEFORE the panel is opened, not after');
  });

  test('and their seat keeps both halves, because the panel is their only door', () => {
    const h = NEG_CODE.match(/\[data-rl-edit\]'\)\.forEach[\s\S]*?\n  \}\)\);/)[0];
    assert.match(h, /rlCpSetShown\(btn\.closest\('\.redline-page'\) \|\| document, clauseId\)/,
      'rlOpenClauseEditor refuses a counterparty outright, so taking this from '
      + 'them would take away the only way their page proposes wording');
    assert.match(h, /ng_cp_cannot_open/, 'and L-3\'s refusal is still theirs');
  });

  test('DRIVEN: our seat draws no door onto the clause panel at all', async () => {
    /* RE-POINTED 2 Sep 2026: a card's doors are inside it now, so this opens
       each one rather than reading closed faces — which would pass on a build
       that had lost every door. */
    const p = await bench();
    let seen = 0;
    for (const ch of p.c.changes){
      const card = p.open(ch.id);
      assert.equal(card.querySelectorAll('[data-rl-cp-open]').length, 0,
        'our seat offers no door onto the retired panel');
      seen += card.querySelectorAll('[data-rl-cp-editor-row]').length;
    }
    assert.ok(seen, 'the fixture really does draw the edit page\'s door');
  });

  test('DRIVEN: a stage without the editor keeps the panel, and its jump', async () => {
    const p = await bench({ noEditor: true });
    let jump = 0, editor = 0, panel = 0;
    for (const ch of p.c.changes){
      const card = p.open(ch.id);
      jump += card.querySelectorAll('[data-rl-edit]').length;
      editor += card.querySelectorAll('[data-rl-cp-editor-row]').length;
      panel += card.querySelectorAll('[data-rl-cp-open]').length;
    }
    assert.ok(jump, 'the jump is back where the edit page cannot take the clause');
    assert.ok(panel, 'and so is the panel — here it is the only way in');
    assert.equal(editor, 0, 'nothing claims a page nothing can open');
  });
});

/* ============================================================
   10 — ONLY WHAT CHANGED IS IN THE CARD (owner-asked 2 Sep 2026)
   ============================================================
   "lets only have the sentences or bullet points that have been redlined show
   up in the WHAT YOU ARE PROPOSING card. This efficiently uses the card so
   that if a very long clause is being edited, the very long clause does not
   appear in the card. If it is two bullet points out of 6 bullet points from a
   clause, only the 2 should appear in the card."

   THE READING LIVES IN js/redline.js, beside the block builder it counts, and
   the CARD is the one surface that asks for it. Both halves are pinned: the
   filter itself, and that it is OFF everywhere else — the paper, the clause
   panel, the ask reveal and every export draw the clause as the clause. */
describe('f246 (10) — the card shows the parts this change touches', () => {
  /* Hand-built ops rather than a filed change, and deliberately so: what is
     under test is the BLOCK reading, and ops written out here say exactly
     which blocks are touched with nothing between the claim and the answer. */
  const OPS = [
    { op: 'keep', text: '1.1 Master Agreement Structure. Buyer may purchase Materials.\n' },
    { op: 'keep', text: '1.2 Issuance of Purchase Orders. Buyer shall issue written POs.\n' },
    { op: 'keep', text: '1.3 Precedence. In the event of ' },
    { op: 'del',  text: 'any' },
    { op: 'ins',  text: 'a' },
    { op: 'keep', text: ' conflict the terms of this Agreement prevail.\n' },
    { op: 'red',  text: '' },
    { op: 'keep', text: '1.4 Term. This Agreement runs for three years.' }
  ].filter(o => o.op !== 'red');

  test('the reading counts blocks, and counts only the ones really drawn', async () => {
    const w = buildWorld({ negotiationView: true });
    const s = w.win.redlineBlockStats(OPS);
    assert.deepEqual([s.total, s.changed, s.unchanged], [4, 1, 3],
      'four paragraphs, one of them touched');
    /* An empty block is not a block. The renderer has always dropped one, and
       a count that included it would print a number the picture disagrees
       with. */
    const withGap = w.win.redlineBlockStats(
      [{ op: 'keep', text: 'a\n\n' }, { op: 'ins', text: 'b' }]);
    assert.deepEqual([withGap.total, withGap.changed], [2, 1]);
  });

  test('changedOnly draws that one block and nothing else', async () => {
    const w = buildWorld({ negotiationView: true });
    const whole = w.win.redlineOpsBlocksHtml(OPS);
    const only  = w.win.redlineOpsBlocksHtml(OPS, { changedOnly: true });
    assert.equal((whole.match(/<p /g) || []).length, 4, 'the whole clause is four blocks');
    assert.equal((only.match(/<p /g) || []).length, 1, 'and the card wants one of them');
    assert.match(only, /Precedence/, 'the one that carries the change');
    assert.ok(!/Master Agreement/.test(only) && !/three years/.test(only),
      'and not the three it leaves alone');
    /* THE BLOCK IS DRAWN EXACTLY AS IT WOULD HAVE BEEN — its marks, its
       marker and its hanging indent. Filtering is a choice about WHICH blocks,
       never about how one is rendered. */
    assert.match(only, /<del/, 'with its deletion');
    assert.match(only, /<ins/, 'and its insertion');
  });

  test('OFF BY DEFAULT, so nothing else in the product moves', async () => {
    const w = buildWorld({ negotiationView: true });
    /* Written as the RELATION rather than as two strings: the default output
       and an explicit `changedOnly:false` must be the same string, and both
       must be the whole clause. */
    assert.equal(w.win.redlineOpsBlocksHtml(OPS),
      w.win.redlineOpsBlocksHtml(OPS, { changedOnly: false }));
    assert.match(w.win.redlineOpsBlocksHtml(OPS), /Master Agreement/,
      'the paper still draws the clause as the clause');
    const src = read('js/views/negotiation.js');
    assert.equal((src.match(/changedOnly: true/g) || []).length, 1,
      'exactly one surface asks for it');
    assert.match(src, /rlChangeWordingHtml\(ch, \{ changedOnly: true \}\)/,
      'and it is the open card');
  });

  test('a change that touches nothing falls back to the whole thing', async () => {
    /* A formatting-only change files all-keep ops. Drawing nothing at all
       would be worse than drawing everything, so the filter stands down —
       and having stood down it must not then claim anything was hidden. */
    const w = buildWorld({ negotiationView: true });
    const keep = [{ op: 'keep', text: 'one\ntwo\nthree' }];
    assert.equal((w.win.redlineOpsBlocksHtml(keep, { changedOnly: true }).match(/<p /g) || []).length, 3);
    const s = w.win.redlineBlockStats(keep);
    assert.equal(s.changed, 0, 'and nothing reads as touched, so nothing is announced');
  });

  test('an insertion and a deletion hide nothing, because they touch it all', async () => {
    const w = buildWorld({ negotiationView: true });
    for (const op of ['ins', 'del']){
      const ops = [{ op, text: 'a\nb\nc' }];
      assert.equal(w.win.redlineBlockStats(ops).unchanged, 0, op + ': nothing is left alone');
      assert.equal((w.win.redlineOpsBlocksHtml(ops, { changedOnly: true })
        .match(/<p /g) || []).length, 3, op + ': so all of it is drawn');
    }
  });

  test('WHAT IS NOT SHOWN IS SAID, and only when something is not shown', async () => {
    const p = await bench();
    /* ASKED AS THE RELATION, never against a fixture's happens-to-be: the line
       is drawn exactly when the arithmetic says something was left out, and
       the number it prints is the number that reading returned. That is the
       whole safety property — the note and the picture cannot disagree,
       because both come off the same ops — and it holds whatever the fixture
       turns out to contain. */
    let saidNothing = 0, saidSomething = 0;
    for (const ch of p.c.changes){
      const card = p.open(ch.id);
      const st = p.win.redlineBlockStats(p.win.rlChangeOps(ch));
      const owed = st.changed > 0 && st.unchanged > 0;
      const note = card.querySelector('.rl-cb-omit');
      assert.equal(!!note, owed,
        `${ch.id}: ${st.changed} of ${st.total} touched — note drawn ${!!note}`);
      if (note){
        assert.match(note.textContent, new RegExp(`\\b${st.unchanged}\\b`),
          'and it prints what the reading actually left out');
        saidSomething++;
      } else saidNothing++;
      /* AND THE DRAWN BLOCKS ARE THE TOUCHED ONES — the picture, not only the
         sentence about it. */
      const q = card.querySelector('.rl-cb-q');
      if (q && st.changed) assert.equal(q.querySelectorAll('.rl-line').length,
        st.changed, `${ch.id}: one block drawn per touched block`);
    }
    assert.ok(saidSomething || saidNothing, 'the fixture drew cards at all');
    /* And the sentence resolves, through the one plural reading the rest of
       this product uses. */
    const one = p.win.i18tn('ng_cb_unchanged', 1, { n: 1 });
    const many = p.win.i18tn('ng_cb_unchanged', 4, { n: 4 });
    assert.ok(one && !/\{n\}/.test(one), 'the singular resolves');
    assert.match(many, /4/, 'and the plural carries its count');
    assert.notEqual(one, many, 'and they are not the same sentence');
    assert.ok(p.win.i18t('ng_cb_only_changed_title').length > 20,
      'the hover says where the whole clause is');
  });

  test('and both languages carry its words', () => {
    const src = fs.readFileSync(path.join(ROOT, 'js/i18n.js'), 'utf8');
    for (const k of ['ng_cb_unchanged_one', 'ng_cb_unchanged_other',
      'ng_cb_only_changed_title']){
      assert.ok(new RegExp('\\b' + k + ':').test(src), k + ' is in the dictionary');
      assert.equal(src.split(new RegExp('\\b' + k + ':')).length - 1, 2,
        k + ' is in BOTH languages');
    }
  });
});

/* ============================================================
   11 — TAGGING, AND THE TWO THINGS OFF THE SAME SCREENSHOTS
   ============================================================
   Owner-asked 2 Sep 2026, three things in one message:

     "Remove the top highlighted comments sign because there is already a
      comments section at the bottom highlighted area."
     "in the internal and external, have the ability to tag parties in the
      comments using the @ feature. Only those allowed to edit or review the
      contract can be tagged internally and only the parties allowed to edit
      the contract at the counterparty can be tagged in the external part."
     "when the highlighted button says close, make it green until it is closed
      and it says open."

   THE THIRD IS A COLOUR and is measured in the browser, on the real app —
   --accent-ink is declared in index.html's :root and the redline harness page
   carries no token block at all, so a computed-style read there answers ''
   whatever the rule says. See six-fixes-verify. */
describe('f246 (11) — the count stands down once the card is open', () => {
  test('a shut card carries it; the open one does not', async () => {
    const p = await bench();
    const ch = p.c.changes[0];
    p.win.negoPostComment(p.c, ch.id, 'worth a word', { side: 'owner', author: 'Young Mbagaya' });
    p.again();
    const shut = p.$(`[data-nego-card="${ch.id}"] .rl-card-notes`);
    assert.ok(shut, 'a shut row is the ONLY place this fact is carried, so it stays');
    assert.match(shut.textContent, /1/, 'and says how many');
    const open = p.open(ch.id);
    assert.equal(open.querySelector('.rl-card-notes'), null,
      'and stands down once the rooms are twelve pixels below with their own counts');
    assert.ok(open.querySelector('[data-rl-np-room]'),
      'which is what makes the marker a second printing rather than the only one');
  });
});

describe('f246 (11) — who may be tagged, per room', () => {
  const TEAM = [
    { id: 'u_me',  name: 'Wanjiru Kamau', role: 'legal',  email: 'wanjiru@w.co.ke' },
    { id: 'u_sal', name: 'Simon Jordan',  role: 'legal',  email: 'simon@w.co.ke' },
    { id: 'u_v',   name: 'Viewer Vee',    role: 'viewer', email: 'vee@w.co.ke' },
  ];
  async function tagBench(){
    const p = await bench();
    p.win.getUsers = () => TEAM;
    p.win.userById = id => TEAM.find(u => u.id === id) || null;
    /* js/review.js is not on this stage; the app loads it, and negoTagPeople
       asks for it BY NAME rather than keeping a list of its own. */
    p.win.reviewCandidates = () => TEAM.filter(u => u.role !== 'viewer' && u.id !== 'u_me');
    p.c.counterpartyName = 'Erik Lindqvist';
    p.c.counterpartyEmail = 'erik@nordfrakt.se';
    p.c.signerPlan = [
      { id: 's1', party: 'counterparty', name: 'Anna Berg', email: 'anna@nordfrakt.se', order: 1 },
      { id: 's2', party: 'owner', name: 'Wanjiru Kamau', email: 'wanjiru@w.co.ke', order: 2 },
    ];
    return p;
  }

  test('internal offers colleagues who may act, and nobody else', async () => {
    const p = await tagBench();
    /* JOINED, NOT DEEP-COMPARED: the page realm's Array prototype is not this
        realm's — the f60 trap this file already documents. */
    const names = p.win.negoTagPeople(p.c, 'internal').map(x => x.name);
    assert.equal(names.join(' | '), 'Simon Jordan',
      'a viewer can neither edit nor review, and you do not tag yourself');
  });

  test('external offers the other side, and nobody from here', async () => {
    const p = await tagBench();
    const names = p.win.negoTagPeople(p.c, 'external').map(x => x.name);
    assert.equal(names.join(' | '), 'Anna Berg | Erik Lindqvist',
      'the counterparty signer and the recorded contact');
    /* THE WALL IS THAT THE TWO ARE DISJOINT. A colleague's name cannot reach
       a note that travels, because the room that travels never offers one. */
    const inside = p.win.negoTagPeople(p.c, 'internal').map(x => x.name.toLowerCase());
    assert.ok(!names.some(n => inside.includes(n.toLowerCase())),
      'no name is in both rooms');
    assert.ok(!names.includes('Wanjiru Kamau'),
      'and an owner-side signer is not one of the other side\'s people');
  });

  test('with no reviewCandidates it offers NOTHING, never a list of its own', async () => {
    /* The safe direction, said out loud: a tag list that quietly includes
       people who may not be tagged is worse than no tag list, and a second
       reading of "who may act here" is how the two come to disagree. */
    const p = await tagBench();
    p.win.reviewCandidates = undefined;
    assert.equal(p.win.negoTagPeople(p.c, 'internal').length, 0);
    assert.ok(p.win.negoTagPeople(p.c, 'external').length,
      'the external room reads the contract and is unaffected');
  });
});

describe('f246 (11) — the picker is the sign, the writer is the wall', () => {
  const TEAM = [
    { id: 'u_me',  name: 'Wanjiru Kamau', role: 'legal', email: 'wanjiru@w.co.ke' },
    { id: 'u_sal', name: 'Simon Jordan',  role: 'legal', email: 'simon@w.co.ke' },
  ];
  async function tagBench(){
    const p = await bench();
    p.win.getUsers = () => TEAM;
    p.win.reviewCandidates = () => TEAM.filter(u => u.id !== 'u_me');
    p.c.counterpartyName = 'Erik Lindqvist';
    p.c.counterpartyEmail = 'erik@nordfrakt.se';
    p.c.signerPlan = [];
    return p;
  }

  test('a mention is resolved from the text against the room\'s own people', async () => {
    const p = await tagBench();
    const people = p.win.negoTagPeople(p.c, 'internal');
    assert.equal(p.win.negoMentionsIn('ask @Simon Jordan about this', people)
      .map(m => m.id + ':' + m.name).join(' | '), 'u_sal:Simon Jordan');
    /* A NAME THE ROOM DOES NOT OFFER IS ORDINARY TEXT — there is no way to
       type a mention of somebody who cannot be tagged. */
    assert.equal(p.win.negoMentionsIn('ask @Nobody At All', people).length, 0);
    assert.equal(p.win.negoMentionsIn('the price is @45 per unit', people).length, 0);
  });

  test('THE WALL: an external note cannot carry a colleague', async () => {
    const p = await tagBench();
    const ch = p.c.changes[0];
    /* Written as the funnel writes it, with a colleague named in the text. */
    const msg = p.win.negoPostComment(p.c, ch.id, 'over to @Simon Jordan please',
      { side: 'owner', author: 'Wanjiru Kamau', visibility: 'shared' });
    assert.ok(msg, 'the note itself is filed — the wording is the writer\'s');
    assert.equal(msg.visibility, 'shared');
    assert.ok(!msg.mentions,
      'but nothing is tagged, because the external room offers no colleague');
    /* And the same text in the internal room does carry it. */
    const inside = p.win.negoPostComment(p.c, ch.id, 'over to @Simon Jordan please',
      { side: 'owner', author: 'Wanjiru Kamau', visibility: 'internal' });
    assert.equal(inside.mentions.map(m => m.id + ':' + m.name).join(' | '),
      'u_sal:Simon Jordan');
  });

  test('a caller cannot smuggle one in — the record is resolved, not accepted', async () => {
    const p = await tagBench();
    const ch = p.c.changes[0];
    const msg = p.win.negoPostComment(p.c, ch.id, 'nothing is named here',
      { side: 'owner', author: 'Wanjiru Kamau', visibility: 'shared',
        mentions: [{ id: 'u_sal', name: 'Simon Jordan' }] });
    assert.ok(!msg.mentions,
      'what is filed is what the note visibly says, never what a caller passed');
  });

  test('a note that names nobody carries no field at all', async () => {
    const p = await tagBench();
    const msg = p.win.negoPostComment(p.c, p.c.changes[0].id, 'plain words',
      { side: 'owner', author: 'Wanjiru Kamau' });
    assert.ok(!('mentions' in msg),
      'so every note already on file reads identically and nothing is migrated');
  });

  test('the picker draws the room\'s people, and nothing where there are none', async () => {
    const p = await tagBench();
    const inHtml = p.win.rlNpTagMenuHtml(p.c, 'internal', { side: 'owner' });
    assert.match(inHtml, /data-rl-np-tag="Simon Jordan"/);
    assert.ok(!/Erik Lindqvist/.test(inHtml), 'and never the other room\'s');
    const exHtml = p.win.rlNpTagMenuHtml(p.c, 'external', { side: 'owner' });
    assert.match(exHtml, /data-rl-np-tag="Erik Lindqvist"/);
    assert.ok(!/Simon Jordan/.test(exHtml));
    assert.match(inHtml, /hidden/, 'it arrives shut');
    p.win.reviewCandidates = undefined;
    assert.equal(p.win.rlNpTagMenuHtml(p.c, 'internal', { side: 'owner' }), '',
      'a control whose one outcome is an empty list is furniture');
  });

  test('a tagged name is drawn from the RECORD, and escaped first', async () => {
    const p = await tagBench();
    const marked = p.win.rlNpMarkMentions(
      p.win.esc ? p.win.esc('ask @Simon Jordan <b>now</b>') : 'ask @Simon Jordan &lt;b&gt;now&lt;/b&gt;',
      { mentions: [{ id: 'u_sal', name: 'Simon Jordan' }] });
    /* RE-POINTED 2 Sep 2026: the span gained the person's own ink class beside
       the marker one, so the claim reads the RELATION it was always about —
       the name is wrapped in the tag class and nothing else changed. */
    assert.match(marked, /<span class="rl-np-at[^"]*">@Simon Jordan<\/span>/);
    assert.ok(!/<b>/.test(marked), 'the note\'s own markup never reaches the page');
    /* NOTHING IS DRESSED AS A MENTION BY BEING TYPED. */
    assert.equal(p.win.rlNpMarkMentions('ask @Simon Jordan', {}), 'ask @Simon Jordan');
    assert.equal(p.win.rlNpMarkMentions('mail me @ 9', { mentions: [] }), 'mail me @ 9');
  });

  test('OUR ROSTER NEVER REACHES THEIR SEAT — the question this feature raises', async () => {
    /* The picker prints names into the markup of an open card, and their page
       mounts the same renderer. THE SEAT DOES NOT DECIDE THIS AND MUST NOT: the
       ROOM does. Their page has one room and it is the external one, which
       offers people at their own side and never a colleague — so the wall is
       the same wall the writer enforces, rather than a second rule about seats
       that could be got wrong. Asserted on their seat's own rendering. */
    const p = await tagBench();
    const theirs = p.win.rlNotesPanelHtml(p.c, p.c.changes[0],
      { side: 'counterparty', canComment: true, org: 'Nordfrakt' });
    assert.ok(!/Simon Jordan/.test(theirs) && !/simon@w\.co\.ke/.test(theirs),
      'no colleague of ours is offered, or even named, on their page');
    assert.match(theirs, /Erik Lindqvist/, 'their own people are');
    /* AND THE ROOM IS WHAT DID IT, not the seat: asked for the external room
       from OUR chair, the answer is the same list. */
    assert.equal(p.win.negoTagPeople(p.c, 'external', { side: 'owner' })
      .map(x => x.name).join(' | '),
      p.win.negoTagPeople(p.c, 'external', { side: 'counterparty' })
        .map(x => x.name).join(' | '));
  });

  test('and the words are in both languages', () => {
    const src = fs.readFileSync(path.join(ROOT, 'js/i18n.js'), 'utf8');
    for (const k of ['ng_np_tag_aria', 'ng_np_tag_none', 'ng_np_tag_hint']){
      assert.ok(new RegExp('\\b' + k + ':').test(src), k + ' is in the dictionary');
      assert.equal(src.split(new RegExp('\\b' + k + ':')).length - 1, 2,
        k + ' is in BOTH languages');
    }
  });
});
