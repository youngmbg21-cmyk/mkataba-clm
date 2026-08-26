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
async function bench(){
  const w = buildWorld({ negotiationView: true });
  const { win } = w;
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
  test('"Tracked changes (N)", and the old name is retired', async () => {
    const p = await bench();
    const t = p.$('.rl-idx-title');
    assert.ok(t, 'the block heads itself');
    assert.equal(t.textContent.trim(),
      p.win.i18t('ng_tracked_head_n', { n: p.c.changes.length }),
      'the heading is the dictionary\'s, and the number in it is the book\'s own count');
    assert.doesNotMatch(t.textContent, /change index/i, 'the block\'s old name is gone');
  });

  test('the total is BORROWED, never counted a second time', () => {
    /* The head, the filter's options and the bands all print counts of the
       same list. A second arithmetic here is how two halves of one column come
       to disagree, which is the fault this page has recorded twice. */
    const i = NEG_CODE.indexOf('ng_tracked_head_n');
    assert.ok(i > -1, 'the heading is still built here');
    const line = NEG_CODE.slice(i - 200, i + 200);
    assert.match(line, /changeTotal/, 'it prints the figure the rest of the head prints');
    assert.doesNotMatch(line, /\.filter\(|\.length\s*\)/,
      'and works nothing out for itself');
  });

  test('and the head still says how far through the round it is', async () => {
    const p = await bench();
    assert.match(p.$('.rl-idx-foot').textContent, /\d+ of \d+/);
  });

  test('the title sits on its own rule, and "N open" is an amber dot and word', () => {
    /* The reference draws the title as the column's one tab — a 2px accent
       rule under the words — and the open count as a warning rather than as a
       block: it shipped as a dark green chip, which read as the loudest object
       on a column whose job is the cards. */
    const t = NCSS.slice(NCSS.indexOf('.redline-page .rl-idx-title{'),
      NCSS.indexOf('.redline-page .rl-idx-title i{'));
    assert.match(t, /border-bottom:2px solid var\(--accent-solid\)/, 'the title is a tab');
    assert.match(t, /margin-bottom:-1px/, 'sitting ON the head\'s hairline, not above it');
    const o = NCSS.slice(NCSS.indexOf('.redline-page .rl-idx-open{'),
      NCSS.indexOf('.redline-page .rl-idx-open::before'));
    assert.match(o, /color:var\(--st-amber-fg\)/, 'amber, the product\'s own "waiting on you"');
    assert.match(o, /background:none/, 'and not a filled chip');
    assert.match(NCSS.slice(NCSS.indexOf('.redline-page .rl-idx-open::before')),
      /border-radius:50%/, 'with a dot, the same mark the rows carry');
  });
});

/* ========================================================== 2 — WHOSE ASKS */
describe('f246 (2) — the three-way cut says what it is about', () => {
  test('a visible label sits beside the dropdown', async () => {
    const p = await bench();
    const k = p.$('.rl-idx-fk');
    assert.ok(k, 'the filter is labelled on screen, not only in a title attribute');
    assert.equal(k.textContent.trim(), p.win.i18t('ng_whose_asks'));
    const sel = p.$('#rl-cardfilter');
    assert.ok(sel, 'and the control it labels is the page\'s one filter');
    assert.equal(k.compareDocumentPosition(sel) & 4, 4, 'the label comes first');
  });

  test('THE THREE SAFETY PROPERTIES ARE UNTOUCHED', async () => {
    /* This control can hide a change, so it is the one on the page that may
       never be silent. Labelling it must not have cost any of the three. */
    const p = await bench();
    const opts = p.$$('#rl-cardfilter option');
    assert.equal(opts.length, 3, 'three options, not states');
    for (const o of opts)
      assert.match(o.textContent, /\(\d+\)/, 'each carries its OWN count');
    p.win.rlSetCardFilter('mine');
    p.again();
    assert.ok(p.$('.rl-idx-narrowed'), 'and a narrowed column says so');
    assert.ok(p.$('.rl-idx-narrowed [data-rl-cardfilter="all"]'), 'and offers the way back');
    p.win.rlSetCardFilter('all');
  });

  test('the counts do not move when the filter does', async () => {
    const p = await bench();
    const before = p.$$('#rl-cardfilter option').map(o => o.textContent.trim());
    p.win.rlSetCardFilter('theirs');
    p.again();
    const after = p.$$('#rl-cardfilter option').map(o => o.textContent.trim());
    assert.equal(after.join('|'), before.join('|'),
      'the number of theirs is readable without opening the control');
    p.win.rlSetCardFilter('all');
  });
});

/* =============================================================== 3 — BANDS */
describe('f246 (3) — the four bands', () => {
  test('every change lands in exactly one band, and the catch-all is last', async () => {
    const p = await bench();
    const { rlCardBand } = p.win;
    const bands = new Set(['awaiting', 'drafts', 'with', 'decided']);
    for (const ch of p.c.changes)
      assert.ok(bands.has(rlCardBand(ch, 'owner', new Set(), null)),
        'a change nobody thought of is still filed somewhere');
    assert.equal(rlCardBand(null, 'owner', new Set(), null), 'decided',
      'and nothing falls off the bottom of the column');
  });

  test('the four readings are the four questions, not four statuses', async () => {
    const p = await bench();
    const { rlCardBand } = p.win;
    const theirs = p.c.changes.find(x => x.authorSide === 'counterparty');
    const ours = p.c.changes.find(x => x.authorSide === 'owner');
    const unsent = new Set([ours.id]);
    assert.equal(rlCardBand(theirs, 'owner', unsent, null), 'awaiting',
      'their live ask is what needs you');
    assert.equal(rlCardBand(ours, 'owner', unsent, null), 'drafts',
      'our unsent one is still on the desk');
    assert.equal(rlCardBand(ours, 'owner', new Set(), null), 'with',
      'and once it has gone it is with them');
    assert.equal(rlCardBand(Object.assign({}, ours, { status: 'accepted' }),
      'owner', new Set(), null), 'decided', 'settled is settled');
    assert.equal(rlCardBand(Object.assign({}, ours, { withdrawn: true }),
      'owner', new Set(), null), 'decided', 'and so is taken back');
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
          new Set(p.win.negoUnsentAsks(p.c, 'owner').map(x => x.id)), null), cur,
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
          'owner', new Set(p.win.negoUnsentAsks(p.c, 'owner').map(x => x.id)), null)
          === b.getAttribute('data-rl-band')).length;
      assert.equal(n, under, 'the heading counts what is under it');
    }
    const drawn = p.$$('#rl-changes .rl-band').map(x => x.getAttribute('data-rl-band'));
    assert.ok(!drawn.includes('decided'),
      'nothing is decided in this fixture, so no Decided heading — four headings over an empty pile is furniture');
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

  test('the state draws where it adds something, and is the ONE status slot', async () => {
    /* THE REFERENCE'S OWN RULE. Under AWAITING YOU and YOUR DRAFTS it shows no
       state word at all — the heading has said which pile this is, and the row
       is the reference, the summary and the verbs. It appears the moment it
       carries a fact the heading does not: Sent, Refused, Accepted, a
       reviewer's name. So the two bands it stands down under are exactly the
       two whose badge word IS the heading, and every other state still draws.

       WHEREVER IT DRAWS IT IS STILL .rl-badge AND ITS OWN TONE — half this
       product and half the suite ask that slot where a change stands, and a
       first pass that invented .rl-state broke about a dozen of them. */
    const p = await bench();
    const unsent = new Set(p.win.negoUnsentAsks(p.c, 'owner').map(x => x.id));
    let drawn = 0;
    for (const card of p.$$('#rl-changes .rl-card-d')){
      const ch = p.c.changes.find(x => x.id === card.getAttribute('data-nego-card'));
      const band = p.win.rlCardBand(ch, 'owner', unsent, null);
      const b = card.querySelector('.rl-badge');
      if (b){
        drawn++;
        assert.match(b.className, /rl-badge-(sent|draft|ok|no)/, 'wearing its own tone');
        assert.ok(b.textContent.trim(), 'and saying a word');
      } else {
        assert.ok(band === 'awaiting' || band === 'drafts',
          'a state only stands down where the heading already says it');
      }
      assert.ok(card.querySelectorAll('.rl-badge').length <= 1, 'never twice');
    }
    assert.equal(p.$('#rl-changes .rl-state'), null,
      '.rl-state was a second status element and is retired');
    /* AND IT REALLY DOES DRAW SOMEWHERE — a rule that stood every state down
       would satisfy the loop above and say nothing. */
    p.win.negoHandOver(p.c, { to: 'counterparty' });
    p.again();
    assert.ok(p.$('#rl-changes .rl-card-d .rl-badge'),
      'a sent ask says so, because its heading does not');
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
       the row a row. */
    const i = NCSS.indexOf('.redline-page .rl-card-d .rl-card-info,');
    assert.ok(i > -1);
    assert.match(NCSS.slice(i, NCSS.indexOf('}', i)), /flex:1 0 100%/);
  });
});

/* ================================================================ 5 — THE ⋯ */
describe('f246 (5) — the overflow menu', () => {
  test('Edit with Copilot leads it, as the approved journey has always put it', async () => {
    const p = await bench();
    const card = p.$$('#rl-changes .rl-card-d').find(el => el.querySelector('.rl-more-menu'));
    assert.ok(card, 'the card carries a ⋯');
    const rows = [...card.querySelectorAll('.rl-more-row')];
    assert.ok(rows.length, 'with rows in it');
    assert.ok(rows[0].hasAttribute('data-rl-cp-editor-row'), 'and Copilot is first');
    assert.equal(rows[0].getAttribute('data-rl-cp-editor-change'),
      card.getAttribute('data-nego-card'), 'named for this change');
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

  test('the menu names the change it belongs to', async () => {
    const p = await bench();
    const card = p.$('#rl-changes .rl-card-d');
    const head = card.querySelector('.rl-more-head');
    assert.ok(head && head.textContent.includes(card.getAttribute('data-nego-card')),
      'one menu floating over a column of six cards has to say which');
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
    assert.ok(NEG_CODE.includes('rlCardSort(kept, heldIds, rlBandOpts(c, opts, side))'),
      'the pill\'s own list is sorted by it too');
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
