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
  return { w, win, c, $, $$, again: () => win.renderRedline() };
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

  test('the verbs are untouched — the same engine attributes, on one row', async () => {
    const p = await bench();
    const theirs = p.$$('#rl-changes .rl-card-d')
      .find(el => el.querySelector('[data-nego-accept]'));
    assert.ok(theirs, 'their ask still offers a decision');
    assert.ok(theirs.querySelector('[data-nego-reject]'), 'both ways');
    assert.ok(theirs.querySelector('.rl-card-side .rl-card-verbs'),
      'and the verbs are beside the text');
    const mine = p.$$('#rl-changes .rl-card-d')
      .find(el => el.querySelector('[data-rl-send]'));
    assert.ok(mine, 'our draft still carries its own Send');
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
describe('f246 (5) — the overflow menu', () => {
  /* ---- REVERSED IN PLACE, 30 Aug 2026 (owner-ruled: shut the doors that put
     the clause panel in front of me) ----
     This asserted that Edit with Copilot LEADS this menu on every card. It
     still does wherever it is drawn — and on our seat the card's own Edit now
     carries that same door, so on those cards the menu correctly draws no
     second copy of it. That is not a loss: it is this menu's own rule, stated
     two paragraphs down in its source, doing exactly what it is for.

     BOTH HALVES ARE ASSERTED, because either alone would pass on a build that
     had lost the door altogether. */
  /* ---- REVERSED IN PLACE, 30 Aug 2026 ----
     This asserted that Edit with Copilot LEADS this menu on every card. It
     still leads WHERE IT IS DRAWN — and since the owner shut the two doors onto
     the clause panel, the card's own Edit carries that same door on our seat,
     so the menu correctly draws no second copy of it. Not a loss: it is this
     menu's own "never repeat a verb the face carries" rule doing its job.

     THE CLAIM IS NOW THAT THE DOOR IS DRAWN EXACTLY ONCE, which is a stronger
     thing to say than where it sits — a card offering the same page twice is
     the fault, and so is a card offering it not at all. Both worlds are read,
     because either alone would pass on a build that had lost it. */
  test('the editor door is drawn exactly once per card, never twice', async () => {
    const p = await bench();
    const cards = p.$$('#rl-changes .rl-card-d');
    assert.ok(cards.length, 'there are cards to read');
    let seen = 0;
    cards.forEach(card => {
      const doors = card.querySelectorAll('[data-rl-cp-editor-row]');
      assert.ok(doors.length <= 1,
        'one clause, one way into the edit page — ' + doors.length + ' drawn');
      if (doors.length) seen += 1;
      if (doors.length) assert.equal(doors[0].getAttribute('data-rl-cp-editor-change'),
        card.getAttribute('data-nego-card'), 'named for this change');
    });
    assert.ok(seen, 'and the door really is drawn — without this the check '
      + 'above would pass on a build that had lost it altogether');
  });

  test('our seat has no door onto the clause panel', async () => {
    const p = await bench();
    assert.ok(!p.$('#rl-changes [data-rl-cp-open]'),
      'the panel row is shut on our seat — the second of the two doors the '
      + 'owner asked to be closed');
  });

  test('a stage without the edit page keeps the jump AND the panel', async () => {
    /* THE THIRD QUESTION ceTakesIt ASKS, and the reason it asks for the module
       by name rather than only about the width: the counterparty's seat and a
       window too narrow for two columns land here too, and on both the panel is
       the only way a clause is edited at all. Taking it away from them would
       take the capability, which is precisely what the owner was told would not
       happen. */
    const p = await bench({ noEditor: true });
    const card = p.$$('#rl-changes .rl-card-d').find(el => el.querySelector('.rl-more-menu'));
    assert.ok(card, 'the card carries a ⋯');
    assert.ok(!card.querySelector('[data-rl-cp-editor-row]'),
      'no door onto a page this stage cannot open');
    assert.ok(card.querySelector('[data-rl-edit]'),
      'Edit is the jump again');
    assert.ok(card.querySelector('[data-rl-cp-open]'),
      'and the clause panel is back, because here it is the only way in');
  });

  test('and our seat has no door onto the clause panel at all', () => {
    /* The second of the two doors the owner shut. Their seat keeps it — the
       editor refuses a counterparty outright, so the panel is the only way
       their page has to propose wording. */
    assert.match(NEG_CODE, /const ceDoor = own && typeof window !== .undefined./,
      'the row asks whether the editor can take this clause');
    assert.match(NEG_CODE, /if \(panel && !ceDoor\)/,
      'and draws only where it cannot');
  });

  test('Copilot is violet, and a rule groups the two doors from the two acts', () => {
    /* The reference draws this row in the Copilot colour rather than the
       workspace accent — the same violet .rl-btn-alt has carried since the
       playbook pass — and groups the menu: the two ways INTO this change's
       wording, then the two things you do about it. */
    const i = NCSS.indexOf('.redline-page .rl-more-row.rl-more-lead{');
    assert.ok(i > -1);
    const rule = NCSS.slice(i, NCSS.indexOf('}', i));
    assert.ok(!/--accent/.test(rule), 'not the workspace accent');
    assert.match(rule, /color:#6d28d9/, 'the Copilot violet');
    assert.ok(NCSS.includes('html.dark .redline-page .rl-more-row.rl-more-lead'),
      'with a night answer');
    assert.ok(NCSS.includes('.redline-page .rl-more-row.rl-more-cut{'),
      'and the group rule exists');
  });

  test('the rule is drawn on the row that OPENS the second group, never stray', async () => {
    const p = await bench();
    for (const menu of p.$$('#rl-changes .rl-more-menu')){
      const rows = [...menu.querySelectorAll('.rl-more-row')];
      const cuts = rows.filter(r => r.classList.contains('rl-more-cut'));
      assert.ok(cuts.length <= 1, 'at most one rule per menu');
      if (cuts.length) assert.notEqual(rows[0], cuts[0], 'never on the first row');
    }
  });

  test('the menu names no change — the card under it does', async () => {
    /* ---- REVERSED IN PLACE (owner-asked 26 Aug 2026: "remove the header from
       the dropdown") ----
       This asserted the opposite: a .rl-more-head naming the change, on the
       reasoning that "one menu floating over a column of six cards has to say
       which". TWO THINGS RETIRED THAT ARGUMENT. The menu opens hard against
       the ⋯ it was pressed on, ON the card, whose id and clause name are a few
       centimetres to the left and still on screen — so the head repeated two
       facts already under the reader's eye, in shouting micro-caps. And the
       same press now lights that card and scrolls the paper to its clause, so
       which row the menu belongs to is the most conspicuous thing on the page.
       WHAT IS STILL GUARDED: the change is still NAMED to somebody who cannot
       see any of that. A screen reader gets it from the button's own
       accessible name, and this is the assertion that stops that being lost
       along with the visible head. */
    const p = await bench();
    const card = p.$('#rl-changes .rl-card-d');
    assert.equal(card.querySelector('.rl-more-head'), null,
      'the head is gone — a selector nothing emits is a mention, so its rule went too');
    const btn = card.querySelector('.rl-more-btn');
    assert.ok(btn, 'the ⋯ is still there');
    assert.ok((btn.getAttribute('aria-label') || '').includes(card.getAttribute('data-nego-card')),
      'and it still names its change to a reader who cannot see the card');
  });

  test('it opens SHUT, and the button says so', async () => {
    const p = await bench();
    const card = p.$('#rl-changes .rl-card-d');
    assert.ok(card.querySelector('.rl-more-menu').hasAttribute('hidden'));
    assert.equal(card.querySelector('.rl-more-btn').getAttribute('aria-expanded'), 'false');
    assert.equal(card.querySelector('.rl-more-btn').getAttribute('aria-haspopup'), 'true');
  });

  test('every row is an EXISTING control, so the menu decides nothing', () => {
    /* The Copilot band's own rule: a second decision path is how two doors
       come to disagree about what a press costs. Each row carries an attribute
       the page already handles — the clause editor's, the clause panel's, the
       review ask's, the jump's — and the menu's own wiring binds ONLY its
       fold. */
    const i = NEG_CODE.indexOf('function rlCardMoreHtml');
    assert.ok(i > -1);
    const body = NEG_CODE.slice(i, NEG_CODE.indexOf('\n}', i));
    for (const attr of ['data-rl-cp-editor-row', 'data-rl-cp-open',
                        'data-rl-ask-review', 'data-rl-edit'])
      assert.ok(body.includes(attr), `the menu offers ${attr}`);
    for (const bad of ['negoResolve', 'negoFileChange', 'persist(', 'logAudit'])
      assert.ok(!body.includes(bad), `the menu never calls ${bad} itself`);
  });

  test('and it never repeats a verb the face already carries', async () => {
    /* Edit is data-rl-edit and it is on the face of almost every card that has
       verbs at all. A "Jump to the clause" row beside it is the same
       attribute, the same handler and the same act, twelve pixels apart. */
    const p = await bench();
    for (const card of p.$$('#rl-changes .rl-card-d')){
      const onFace = !!card.querySelector('.rl-card-verbs [data-rl-edit]');
      const inMenu = !!card.querySelector('.rl-more-menu [data-rl-edit]');
      assert.ok(!(onFace && inMenu), 'the jump is offered once per card');
    }
  });

  test('the menu is wired ONCE, at module load, in the capture phase', () => {
    /* The 15 Aug lesson: a listener armed inside a renderer belongs to
       whichever page rendered first, and the counterparty's mount never calls
       renderRedline at all. Column 0 in the source, never indented inside a
       function. */
    assert.match(NEG, /^if \(typeof document !== 'undefined' && !document\._rlMoreWired\)\{$/m,
      'armed at module scope — column 0, not indented inside a renderer');
    const i = NEG.indexOf('document._rlMoreWired');
    const block = NEG.slice(i, NEG.indexOf("document.addEventListener('keydown'", i));
    assert.match(block, /addEventListener\('click'/, 'it listens for a press');
    assert.match(block, /\}, true\);/,
      'and in the capture phase, like the clause panel\'s own door');
  });
});

/* ====================================================== 6 — THE OTHER SEAT */
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

  test('a settled change reads quietly', () => {
    const i = NCSS.indexOf('.redline-page .rl-card-d.rl-card-done .rl-card-sum{');
    assert.ok(i > -1, 'the Decided band greys its summaries');
    /* RE-POINTED on the merge, 25 Aug 2026 — PIN THE RELATION, NOT THE NUMBER.
       The weight sweep gave 1,065 declarations the ladder, so a settled
       summary now reads var(--w-body), which IS 400. The claim is that it
       drops back to the regular weight, and that is what is asserted. */
    assert.match(NCSS.slice(i, NCSS.indexOf('}', i)), /font-weight:var\(--w-body\)/);
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
