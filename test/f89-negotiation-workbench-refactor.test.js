/* ============================================================
   F89 — the Negotiation Workbench refactor
   ============================================================
   Thirteen changes to the Redline page, made together because they are one
   complaint said thirteen ways: the workbench looked like a stack of boxes,
   interrupted itself with dialogs, and printed a document that was not quite
   the document that had been uploaded.

   F84 already pins the design CONTRACT — the ids, the twelve columns, the
   proxies. This file pins the BEHAVIOUR the refactor added, and each test is
   named for the thing that was wrong:

     · the header and the document sheet each carried one frame too many;
     · redlining opened a floating dialog over the very wording being judged,
       instead of the Copilot column beside it;
     · the selection menu offered four verbs, two of which nobody used;
     · the document was re-typeset from parsed parts, so "1.1" came back as
       "1.1." and a lettered sub-clause list came back as a sentence;
     · the contract read at one type size and its own diffs at another;
     · a marked phrase would not say whose hand it was;
     · the Tracked Changes column listed settled history nobody could act on;
     · the card verbs were all the same colour, and there was no way back to
       the clause from the card;
     · and an unsent draft — filed, fingerprinted, and seen by nobody — had its
       only send button below the fold. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { buildWorld } = require('./world');

/* A RICH contract, because structure is the point of half this file. It
   carries the two things a re-typeset document loses: a heading whose number
   is not a plain integer, and a clause body made of more than one block. */
const RICH = [
  '<h1>SUPPLY AND SERVICES AGREEMENT</h1>',
  '<p>Between the parties named below.</p>',
  '<h2>1.1 Definitions</h2>',
  '<p>In this Agreement, <strong>Business Day</strong> means a day other than a Saturday.</p>',
  '<h2>2. PAYMENT TERMS</h2>',
  '<p>All invoices are payable within thirty (30) days from the date of issue.</p>',
  '<p>Interest accrues on any overdue amount at 2% per month.</p>',
  '<h2>8.2(a) Termination for convenience</h2>',
  '<ol><li>Either party may terminate on sixty (60) days notice.</li>',
  '<li>Accrued rights survive termination.</li></ol>',
].join('');

const PLAIN = [
  'RAW MATERIAL SUPPLY AGREEMENT',
  '1. SUPPLY',
  '1. The Supplier shall supply an estimated 5000 metric tonnes per annum.',
  '2. PAYMENT TERMS',
  '2. All invoices are payable within thirty (30) days from the date of issue.',
].join('\n');

function contractFixture(over = {}){
  return { id: 'MK-901', name: 'Supply and Services Agreement',
    counterparty: 'Naivas Supermarkets', template: 'RM', status: 'Under Review',
    folder: 'proc', fields: {}, metadata: {}, audit: [], rounds: [], versions: [],
    signatures: [], comments: [], redlineText: RICH, format: 'rich', ...over };
}

/* The page as the router renders it, plus a Copilot panel double: the world
   stage does not load js/ai.js, and every route this refactor added ends in
   that panel — so the panel is stubbed and the calls into it are recorded. */
async function page(opts = {}){
  const w = buildWorld({ negotiationView: true, contractView: true });
  const { win } = w;
  win.promptDialog = async () => '';
  const c = opts.contract || contractFixture(
    opts.email ? { counterpartyEmail: opts.email, counterpartyName: 'Erik Lindqvist' } : {});

  const panel = { opened: [], pushed: [], proposals: [], sessions: [] };
  win.openAI = (prefill, o) => panel.opened.push(o || {});
  win.aiPush = (role, m) => panel.pushed.push({ role, m });
  win.renderAIFeed = () => {};
  win.copilotAvailable = () => opts.copilot !== false;
  win.copilotPropose = async o => { panel.proposals.push(o);
    return { advice: 'Shorter, same effect.', proposedText: opts.wording || 'Payable within thirty (30) days.', strict: true }; };
  win.aiOpenProposal = o => { panel.cards = (panel.cards || []).concat([o]); return o; };
  win.aiOpenRephraseSession = o => { panel.sessions.push(o); return o; };
  win.aiCloseRephraseSession = () => {};

  /* The share layer, stood in for. counterpartyContact and
     reshareToLastRecipient live in js/core.js, which this stage does not load
     — so without these the workbench correctly finds no address on file and
     correctly falls through to the dialog, and a test of the direct send would
     be testing the fallback. The send ROUTE is the product's; only the
     transport at the end of it is a double. */
  const post = { reshared: 0, modals: 0, delivered: opts.delivered !== false };
  win.openShareModal = () => { post.modals++; };
  win.counterpartyContact = () => (opts.email
    ? { name: 'Erik Lindqvist', email: opts.email, channel: 'email' } : null);
  win.reshareToLastRecipient = async () => { post.reshared++; return { delivered: post.delivered }; };
  win.cachedShares = () => [];

  win.negoInit(c);
  if (opts.theirChange !== false){
    await win.negoFileProposal(c, win.negoBaseText(c).replace('thirty (30) days', 'sixty (60) days'),
      { side: 'counterparty', author: 'Amina Wanjiru' });
  }
  if (opts.myChange){
    await win.negoFileProposal(c, win.negoBaseText(c).replace('2% per month', '1.5% per month'),
      { side: 'owner', author: 'Young Mbagaya' });
  }
  win.state = Object.assign({}, win.state, { contracts: [c], activeId: c.id, view: 'redline' });
  win.getContract = id => (id === c.id ? c : null);
  win.renderRedline();
  const doc = win.document;
  /* Open the passage menu the way the page now does: through the selMenu hook
     this view hands the engine — the ONE entry left, since the clause
     toolbar's AI Assist is gone and highlighting words is the statement of
     scope. jsdom makes no real selection rectangle, so the hook is driven
     directly, exactly as F89's own selection test always has. */
  const openSel = (text = 'thirty (30) days', extra = {}) => {
    let handed = null;
    const real = win.wireNegotiationTab;
    win.wireNegotiationTab = (cc, o) => { handed = o; return real(cc, o); };
    win.renderRedline();
    win.wireNegotiationTab = real;
    const cl = win.negoClauseList(c).find(x => /PAYMENT/i.test(x.headingText))
      || win.negoClauseList(c)[0];
    /* `extra` stands in for what the live capture reads off the selection's
       own Range — `marked` and `spans` — which jsdom's rectless selections
       cannot produce through the real gesture. */
    handed.selMenu({ text, clauseId: cl.clauseId, ...extra,
      rect: { left: 10, top: 10, bottom: 30, right: 90, width: 80, height: 20 } });
    return doc.querySelector('.nego-selmenu');
  };
  return { w, win, c, doc, panel, post, openSel,
    $: sel => doc.querySelector(sel),
    $$: sel => [...doc.querySelectorAll(sel)],
    html: () => doc.getElementById('content').innerHTML,
    css: () => (doc.getElementById('redline-layout-css') || { textContent: '' }).textContent,
    /* The declaration block for exactly this selector. A selector can carry
       more than one block — .rl-doc has its grid span in one and its paint in
       another — so `has` picks the one being asked about rather than the
       first one written. */
    rule: (sel, has) => {
      const css = (doc.getElementById('redline-layout-css') || { textContent: '' }).textContent;
      const re = new RegExp(sel.replace(/[.#*+?^${}()|[\]\\]/g, '\\$&') + '\\{([^}]*)\\}', 'g');
      const blocks = [...css.matchAll(re)].map(m => m[1]);
      if (!blocks.length) return null;
      return (has ? blocks.find(b => b.includes(has)) : blocks[0]) || null;
    } };
}

describe('F89 (1) — the head is not a band at all: it rides on the tab row', () => {
  test('the controls sit at the right of the tab row, and no band is left behind', async () => {
    /* WHAT THIS TEST WAS FOR HAS NOT CHANGED — one frame, not two. What it
       pinned did, twice. It first guarded a bare, frameless strip (the TITLE
       CARD sat above it and a second border read as a box in a box); then, the
       card gone, it required .room-quiet — the same quiet bar the contract page
       puts under its tabs.

       Now there is NO band. The tab row's right-hand half stood empty above a
       strip carrying every control, so the two share one line (Young, 10 Aug
       2026) and the contract gets that whole band of height back. So the frame
       count this test has always been about is now ZERO extra frames: the head
       is a group inside the row, and .room-quiet — a band's clothes — would be
       exactly the second frame the original bug was. */
    const p = await page();
    const r = p.rule('.redline-page .rl-head');
    assert.ok(r, '.rl-head must still carry a rule');
    const head = p.$('.redline-page .rl-head');
    assert.ok(!head.classList.contains('room-quiet'),
      'it is not a band any more, so it must not wear a band\'s clothes');
    assert.ok(!/border:1px/.test(r) && !/box-shadow:var\(--shadow/.test(r),
      'and it draws no frame of its own — the row it sits in carries the rule');
    assert.ok(!p.$('.redline-page .rl-shell'),
      'and the title card it used to sit under is gone');

    /* WHERE IT SITS, which is the whole point of the change. */
    const row = p.$('.redline-page .rl-tabrow');
    assert.equal(head.parentElement, row, 'the head is a child of the tab row');
    const kids = [...row.children];
    assert.ok(kids.indexOf(p.$('.redline-page .rl-tabrow-gap')) < kids.indexOf(head),
      'a spacer pushes it right, so the markup still reads left to right');
    assert.equal(kids[kids.length - 1], head, 'and it is the last thing on the row');
    /* The primary act is the far-right control, where Open Negotiate sits on
       the Document tab — a reader moving between the two tabs finds the button
       in the same place. */
    const acts = [...head.querySelector('.rl-actions').children];
    assert.ok(acts.length, 'the actions group is drawn');
    assert.ok(acts[acts.length - 1].matches('[data-redline-proxy]'),
      'Publish Round is the last control in the row');

    /* AND IT DROPS TO ITS OWN LINE ONLY WHEN IT REALLY DOES NOT FIT. This was
       a width rule — one number, measured on one screen, and wrong on every
       other one: a round with no reviewer button and no "N needs you" is 300px
       narrower and sat on two lines for no reason. The row wraps on CONTENT
       now, which is plain flex-wrap, and the class only records what the
       browser decided so the two things CSS cannot express can follow it. */
    assert.ok(!/@media\s*\(max-width:1700px\)/.test(p.css()),
      'the guessed width rule is gone');
    assert.ok(/\.rl-tabrow\{[^}]*flex-wrap:wrap/.test(p.css()),
      'the row wraps when the content does not fit, at any width');
    assert.ok(/rl-tabrow-wrap .rl-tabrow-gap\{[^}]*border-bottom/.test(p.css()),
      'and on a wrapped row the rule moves onto the spacer, between the two lines');
    assert.equal(typeof p.win.rlFitTabRow, 'function',
      'something has to read the wrap back — CSS cannot');
  });

  test('the wrap is observed, never assumed — and it measures with its own class off', () => {
    /* THE TRAP THIS GUARDS. Once the spacer is a full-width line the head is
       wrapped BY DEFINITION, so an observer that measured with the class still
       on would confirm its own effect and a row that had grown room again
       could never come back to one line. */
    const src = require('node:fs').readFileSync(
      require('node:path').join(__dirname, '..', 'js', 'views', 'negotiation.js'), 'utf8');
    const fn = /function rlFitTabRow\(\)\{[\s\S]*?\n\}/.exec(src)?.[0] || '';
    assert.ok(fn, 'rlFitTabRow is in the file');
    const off = fn.indexOf("classList.remove('rl-tabrow-wrap')");
    const read = fn.indexOf('getBoundingClientRect()');
    const on = fn.indexOf("classList.add('rl-tabrow-wrap')");
    assert.ok(off > -1 && read > off, 'it takes the class off before it measures');
    assert.ok(on > read, 'and puts it back only after reading');
  });

  test('and it tightens before it wraps — a ThinkPad window keeps one line', async () => {
    /* Reported off two laptops side by side (Young, 10 Aug 2026): on a
       ThinkPad the controls dropped to a second line below the tabs, and that
       line comes straight out of the contract's height. So the observer has a
       middle step: compress the row (words down to glyphs and counts, the
       tooltips already say the rest) and only wrap if even THAT does not fit. */
    const src = require('node:fs').readFileSync(
      require('node:path').join(__dirname, '..', 'js', 'views', 'negotiation.js'), 'utf8');
    const fn = /function rlFitTabRow\(\)\{[\s\S]*?\n\}/.exec(src)?.[0] || '';
    const tightOff = fn.indexOf("classList.remove('rl-tabrow-tight')");
    const tightOn = fn.indexOf("classList.add('rl-tabrow-tight')");
    const wrapOn = fn.indexOf("classList.add('rl-tabrow-wrap')");
    assert.ok(tightOn > -1, 'the tight step exists');
    assert.ok(tightOff > -1 && tightOff < tightOn, 'measured with its own class off, like the wrap');
    assert.ok(wrapOn > tightOn, 'and the wrap is the LAST resort, tried after tight');

    /* The words are spans so standing them down is a paint decision — the
       textContent every other test reads never changes. */
    const p = await page({ myChange: true });
    assert.ok(p.$('.rl-pb-btn .rl-word'), 'the purple buttons carry their words in a span');
    const send = p.$('[data-redline-proxy]');
    assert.ok(send.querySelector('.rl-send-detail'), 'Publish Round carries its counts in a span');
    assert.match(send.textContent, /unsent/, 'and the counts are still in the text');
    assert.ok(/rl-tabrow-tight .rl-pb-btn .rl-word\{display:none/.test(p.css()),
      'tight folds the purple buttons to their glyphs');
    assert.ok(/rl-tabrow-tight .rl-send-detail\{display:none/.test(p.css()),
      'and Publish Round to its verb');
  });

  test('and the header is still the header', async () => {
    // flattening a container must not flatten what is in it
    const p = await page();
    const head = p.$('#view-redline .rl-head');
    assert.ok(head, 'the header section survives');
    /* The tab row carries the tabs and nothing else now. The round tag that
       used to ride at the end of it has moved to where the contract's other
       facts read — the subtitle under its name, drawn by roomHeadHtml, which
       both this page and the contract page use — so it appears on all five
       tabs from one line rather than on this one (10 Aug 2026). The contract
       switcher that sat beside it has gone: it is navigation to a DIFFERENT
       agreement, on the row that names this one. */
    const tabrow = p.$('#view-redline .rl-tabrow');
    assert.ok(tabrow, 'the tab row is its own line');
    assert.equal(tabrow.querySelector('.rl-round'), null, 'no round tag on the tab row');
    assert.equal(p.$('#rl-contract-jump'), null, 'and no contract switcher');
    assert.match(p.$('.room-sub').textContent, /Round \d/,
      'the round reads with the contract\'s other facts instead');
    /* The page's TITLE moved up into the Doc page's shell — same name, same
       status chip, same back arrow on both tabs — and the head now carries
       the [Docs][Negotiate] switcher in its place (the tab was labelled
       "Redline" until WO N1 renamed the place; the artifact — a redline —
       keeps its name). */
    /* The shell is not this page's own any more, and that is the point: both
       shells call roomHeadHtml, so the head here IS the contract page's head —
       same markup, same class, same ids — rather than a second one built to
       look like it. */
    const shell = p.$('#view-redline .room-head');
    assert.ok(shell, 'the room\'s shared head sits on this tab too');
    assert.match(shell.textContent, /Supply and Services Agreement/);
    /* The hand-written [Docs][Negotiate] pair this page carried is gone. Both
       shells now call roomTabsHtml, so there is one row and it has five tabs. */
    /* firstChild, not textContent: Negotiate carries its change count inside
       the button, which is the point of it.

       THE ORDER IS THE WORK ORDER, and this assertion is here to hold it that
       way. It read Document · Negotiate · Key terms · Signing, which is not
       the order anything happens in: Key terms sat third and has to be done
       FIRST — a contract with no counterparty and no value cannot be read for
       sense, sent, or signed. A reader following the row left to right was
       walked past the one thing blocking them. Agree the facts, read the
       paper, argue the wording, sign it. */
    assert.deepEqual([...tabrow.querySelectorAll('.room-tab')].map(b => b.firstChild.textContent.trim()),
      ['Key terms', 'Document', 'Negotiate', 'Signing', 'History']);
    assert.equal(tabrow.querySelector('[data-ws-tab="redline"] .rt-n').textContent, '1',
      'and the count is the change on the table');
    assert.ok(tabrow.querySelector('.room-tab.on').textContent.includes('Negotiate'),
      'this tab knows which tab it is');
  });
});

describe('F89 (2) — a centred sheet with gutters, like the Doc page', () => {
  /* The design here changed on request: the Doc page floats the contract as a
     bounded paper sheet with air on both sides, and this page now does the
     same — the paper carries its own chrome and the column behind it drops to
     the page background so the gutters read as page, not as card. */
  test('the .rl-paper is the sheet: bounded, centred, shadowed', async () => {
    const p = await page();
    const r = p.rule('.redline-page .rl-paper');
    assert.ok(r, '.rl-paper must carry a rule');
    assert.match(r, /max-width:720px/, 'the Doc page bounds the contract\'s measure; so does this one');
    assert.match(r, /margin:0 auto/, 'centred, so the gutters split evenly as the window widens');
    /* WARM PAPER, ON ITS OWN TOKENS. Not --color-surface any more: the sheet
       and the cards beside it were the same white, so the paper never read as
       paper. The three values are named in index.html because the Document
       tab, the counterparty's page and the phone paint the same sheet — and
       because the dark theme has to answer differently. */
    assert.match(r, /background:var\(--color-doc-warm\)/, 'the sheet is paper, not another card');
    assert.match(r, /border:1px solid var\(--color-doc-warm-line\)/, 'with a warm hairline round it');
    assert.match(r, /box-shadow:var\(--shadow-paper\)/, 'and it carries the paper shadow itself');
  });

  test('the column is nothing at all — the sheet is the object', async () => {
    const p = await page();
    const r = p.rule('.redline-page .rl-doc', 'box-shadow');
    assert.ok(r, '.rl-doc must have a paint rule of its own, split from .rl-col');
    /* It used to be the page-coloured canvas the sheet floated on, inside a
       bordered column. Both went (10 Aug 2026): a cream sheet inside a white
       card inside a bordered column is three frames for one document. */
    assert.match(r, /background:none/, 'no canvas of its own');
    assert.match(r, /border:0/, 'and no frame');
    // the QUEUE is still a card — this is not a global de-framing
    assert.match(p.rule('.redline-page .rl-col') || '', /border:1px solid/);
  });

  test('no later rule may zero the sheet\'s auto margins', async () => {
    /* The type-scale rule used to say margin:0 at three classes of
       specificity, beating the two-class centring rule — the paper hugged the
       left of the column with all the spare width on the right. */
    const p = await page();
    const r = p.rule('.redline-page .rl-doc .nego-doc');
    assert.ok(r, 'the sheet\'s type-scale rule must exist');
    assert.match(r, /margin:0 auto/,
      'this selector out-specifies the centring rule, so it must centre too');
  });
});

describe('F89 (2b) — the page sets the contract, it does not float it', () => {
  /* Three separate rules were each pushing the text in from the edges, and
     together they left the document sitting in a pool of white space that the
     master design does not have. Measured on the real box model before the
     fix: the text sat 116px from the left of its column and 46px from the
     right, and every clause carried 26px of INVISIBLE toolbar. */
  test('the engine\'s 100px fingerprint gutter is not reserved on this page', async () => {
    /* .nego-pane.working .nego-doc{padding-left:100px} exists so the room can
       hang change badges in the margin. This page carries the ask inline, in
       .rl-asktag on the clause's own row, so the gutter holds nothing — and it
       held it on ONE side, which is what made the sheet look off-centre. */
    const p = await page();
    const r = p.rule('.redline-page .nego-pane.working .rl-paper');
    assert.ok(r, 'the override must exist, or the engine\'s gutter applies');
    assert.match(r, /padding-left:36px/);
    assert.match(r, /padding-right:36px/);
    /* Four classes deep, because the engine's rule is three and this
       stylesheet is inserted BEFORE #nego-style — a tie would lose on order. */
    const css = p.css();
    assert.ok(css.indexOf('.redline-page .nego-pane.working .rl-paper') >= 0,
      'the selector must out-specify .nego-pane.working .nego-doc, not merely restate it');
  });

  test('a clause is flush to the sheet; only a changed one is framed', async () => {
    const p = await page();
    assert.match(p.rule('.redline-page .rl-clause') || '', /padding:0/,
      '.nego-clause\'s 10px/12px is a second inset inside the sheet\'s own');
    assert.match(p.rule('.redline-page .rl-clause.is-changed') || '', /padding:12px 14px/,
      'the design pads only what is on the table — p-3 — so the frame means something');
  });

  test('a repaint does not lose the reader\'s place in the contract', async () => {
    /* Saving a redline or a tag repaints the page whole, and a rebuilt
       scroller starts at the top — redline a clause six pages down and the
       contract shot back to the title. */
    const p = await page();
    const before = p.doc.getElementById('nego-scroll-work');
    before.scrollTop = 480;
    p.win.renderRedline();
    const after = p.doc.getElementById('nego-scroll-work');
    assert.notEqual(after, before, 'the repaint rebuilt the node');
    assert.equal(after.scrollTop, 480, 'and put the reader back where they were');
  });

  test('the clause toolbar is an overlay: hidden at rest, costing no height', async () => {
    /* This rule has been wrong twice, in opposite directions. opacity:0 IN THE
       FLOW reserved a blank 26px row under every clause — the vertical air a
       review complained about. Permanently visible closed that gap and opened
       the opposite complaint: three buttons repeating under every clause is
       not a clean contract. The resolution is an overlay — absolute, so it
       costs zero height AND can be hidden without leaving a hole. Both halves
       are asserted together because either alone re-creates a known defect. */
    const p = await page();
    const r = p.rule('.redline-page .rl-tools');
    assert.ok(r, '.rl-tools must carry a rule');
    assert.match(r, /position:absolute/,
      'in the flow, a hidden toolbar still occupies its row — that was the gap');
    assert.match(r, /opacity:0/, 'and at rest it is hidden — that was the clutter');
    assert.match(r, /pointer-events:none/,
      'an invisible button must never swallow a click aimed at the text under it');
  });

  test('hover and keyboard focus both reveal it; touch gets it outright', async () => {
    const p = await page();
    const css = p.css();
    assert.match(css, /\.redline-page \.rl-clause:hover \.rl-tools,\s*\.redline-page \.rl-clause:focus-within \.rl-tools\{opacity:1;pointer-events:auto\}/,
      'hover alone strands a keyboard user — focusing a tool must reveal the row it sits in');
    assert.match(css, /@media \(hover:none\)\{\s*\.redline-page \.rl-tools\{position:static;opacity:1/,
      'on touch there is no hover, so hidden tools are unreachable tools (f44\'s objection)');
    assert.match(p.rule('.redline-page .rl-clause', 'position:relative') || '', /position:relative/,
      'the overlay anchors to its clause, not to whatever ancestor happens to be positioned');
  });
});

describe('F89 (3,4) — redlining runs through the Copilot column, not a dialog', () => {
  test('an AI action opens the docked panel and files nothing', async () => {
    const p = await page();
    p.openSel();
    const shorten = [...p.$$('.nego-selmenu [data-nego-ai]')]
      .find(b => b.getAttribute('data-nego-ai') === 'shorten');
    assert.ok(shorten, 'the menu must offer the shorten action');
    shorten.dispatchEvent(new p.win.MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    await new Promise(r => setTimeout(r, 10));

    assert.equal(p.panel.opened.length, 1, 'the Copilot panel must open on the same gesture');
    assert.equal(p.panel.opened[0].docked, true,
      'docked, so the document it is about is still on the screen beside it');
    assert.ok(!p.$('.nego-aipop'),
      'no floating proposal dialog may be created — the proposal lives in the panel');
    assert.ok(p.panel.cards && p.panel.cards.length,
      'the proposal must arrive as a card in the panel stream');
  });

  test('what was asked appears in the reader\'s own stream first', async () => {
    const p = await page();
    p.openSel();
    p.$$('.nego-selmenu [data-nego-ai]')[1].dispatchEvent(
      new p.win.MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    await new Promise(r => setTimeout(r, 10));
    assert.ok(p.panel.pushed.some(x => x.role === 'user'),
      'a panel that answers a question it never showed reads as volunteering wording');
  });

  test('Edit asks what the change is for instead of guessing', async () => {
    const p = await page();
    p.openSel();
    [...p.$$('.nego-selmenu [data-nego-ai]')]
      .find(b => b.getAttribute('data-nego-ai') === 'edit').dispatchEvent(
        new p.win.MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    await new Promise(r => setTimeout(r, 10));
    assert.equal(p.panel.sessions.length, 1, 'it must seed a session, not spend a call');
    assert.equal(p.panel.proposals.length, 0, 'nothing is asked until the drafter says what they want');
    /* The question has to leave ADDING open. Asking "how would you like me to
       rephrase this" of a drafter who came to add three bullet points reads as
       a refusal before they have typed anything. */
    assert.match(p.panel.sessions[0].greeting, /what would you like to add or change/i);
  });

  test('a selection drives the side panel through the page\'s own hook', async () => {
    /* jsdom makes no real text selection with a rectangle, so this drives the
       two halves of the route separately: that the engine is GIVEN a builder by
       this page (opts.selMenu — the contract a fork would break), and that the
       builder produces a menu whose items end in the panel. */
    const p = await page();
    let handed = null;
    const realWire = p.win.wireNegotiationTab;
    p.win.wireNegotiationTab = (c, o) => { handed = o; return realWire(c, o); };
    p.win.renderRedline();
    assert.equal(typeof handed.selMenu, 'function',
      'the workbench must hand the engine its own selection builder');

    const cl = p.win.negoClauseList(p.c).find(x => /PAYMENT/i.test(x.headingText));
    handed.selMenu({ text: 'thirty (30) days', clauseId: cl.clauseId,
      rect: { left: 10, top: 10, bottom: 30, right: 90, width: 80, height: 20 } });
    const menu = p.$('.nego-selmenu');
    assert.ok(menu, 'a selection offers a menu');
    assert.ok(!p.$('.nego-aipop') && !p.$('[role="dialog"]'),
      'and never a dialog over the wording being judged');
    const ev = new p.win.MouseEvent('mousedown', { bubbles: true, cancelable: true });
    [...menu.querySelectorAll('[data-nego-ai]')]
      .find(b => b.getAttribute('data-nego-ai') === 'shorten').dispatchEvent(ev);
    await new Promise(r => setTimeout(r, 10));
    assert.equal(p.panel.opened.length, 1, 'choosing an item opens the Copilot column');
    assert.ok(!p.$('.nego-selmenu'), 'and the menu gets out of the way');
  });

  test('with no Copilot connected it says so in the panel, not in a dialog', async () => {
    const p = await page({ copilot: false });
    p.openSel();
    p.$$('.nego-selmenu [data-nego-ai]')[1].dispatchEvent(
      new p.win.MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    await new Promise(r => setTimeout(r, 10));
    assert.ok(!p.$('.nego-aipop'));
    assert.ok(p.panel.pushed.some(x => x.role === 'assistant' && /not connected/i.test(x.m.text)),
      'the refusal belongs in the conversation the reader just opened');
  });
});

describe('F89 (3b) — a refusal names the actual problem, read off the selection itself', () => {
  /* Highlighting across two clauses used to fall through the includes() check
     against ONE clause's text and be reported as "pending edits" — a false
     positive, read off the clause instead of off the chosen words. The live
     capture now reads `spans` and `marked` from the selection's own fragment;
     these drive the hook with those flags, the way every selection test on
     this page drives text and clauseId. */
  const press = async (p, i = 1) => {   // 1 = Shorten & Simplify
    p.$$('.nego-selmenu [data-nego-ai]')[i].dispatchEvent(
      new p.win.MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    await new Promise(r => setTimeout(r, 10));
  };
  const said = (p, re) => p.panel.pushed.some(x => x.role === 'assistant' && re.test(x.m.text));

  test('a selection spanning clauses is said to span clauses, before the model is asked', async () => {
    const p = await page();
    p.openSel('thirty (30) days.\n3. TERMINATION', { spans: true, marked: false });
    await press(p);
    assert.equal(p.panel.proposals.length, 0, 'no tokens are spent on it');
    assert.ok(said(p, /more than one clause/i));
    assert.ok(!said(p, /pending edits/i), 'and it is not misreported as pending edits');
  });

  test('an unmatched selection with no marks inside it is not blamed on pending edits', async () => {
    const p = await page();
    p.openSel('wording that is in no clause at all', { marked: false });
    await press(p);
    assert.ok(said(p, /reselect/i));
    assert.ok(!said(p, /pending edits/i));
  });

  test('marks actually inside the selection still read as pending edits', async () => {
    const p = await page();
    p.openSel('wording that mixes kept and struck text', { marked: true });
    await press(p);
    assert.ok(said(p, /pending edits/i));
  });

  test('typography in the selection does not block the rewrite', async () => {
    /* The clause stores "payable within thirty (30) days"; the selection
       arrives with a doubled space and a renderer line break. The tolerant
       match (negoFindPassage) reaches the model instead of refusing. */
    const p = await page();
    p.openSel('payable  within thirty\n(30) days', { marked: false });
    await press(p);
    assert.equal(p.panel.proposals.length, 1, 'the tolerant match reaches the model');
    assert.ok(!said(p, /couldn.t be matched|pending edits/i));
  });
});

describe('F89 (5) — three actions on a passage, and only three', () => {
  test('Compare to our standard carries this workspace\u2019s own positions', async () => {
    const p = await page();
    const a = p.win.rlStandardAction(p.c);
    assert.match(a.ask, /MATCHES, DEVIATES, or is NOT COVERED/,
      'the action has to ask for a verdict, not for a rewrite');
    assert.ok(a.ask.length > 120,
      'and it has to carry the standard it is measuring against, or the model invents one');
  });

  test('the menu is exactly the standardised set', async () => {
    const p = await page();
    const ids = p.win.RL_SEL_ACTIONS.map(a => a.id);
    /* STILL THREE after the Copilot learned to add wording as well as replace
       it. "Edit with Copilot" is the rename of "Rephrase with Copilot", not a
       fourth door beside it — two entries that read the same to anyone moving
       at speed is the duplicate-door problem this page already argued out. */
    assert.equal(ids.length, 3, 'three verbs, no more');
    assert.equal(ids.join(','), 'edit,shorten,standard');
    const labels = p.win.RL_SEL_ACTIONS.map(a => a.label);
    assert.match(labels[0], /Edit with Copilot/);
    /* "Tag with internal note" was the third and is now "Compare to our
       standard": a private remark about a fragment answered nobody in the next
       round, and the question a negotiator actually has with wording
       highlighted is whether it matches what this workspace accepts. */
    assert.match(labels[2], /Compare to our standard/);
    assert.ok(!labels.some(l => /internal note|Tag/i.test(l)),
      'the tag action is gone from the menu, not merely renamed around');
    assert.ok(!labels.some(l => /Rephrase/.test(l)),
      'and "rephrase" is gone from the menu — it named half the job');
    assert.match(labels[1], /Simplify/);
    assert.ok(!/Shorten &/.test(labels[1]), 'renamed to the outcome, once');
  });

  test('the rendered menu offers those and nothing else', async () => {
    const p = await page();
    p.openSel();
    const btns = p.$$('.nego-selmenu [data-nego-ai]');
    assert.equal(btns.length, 3);
    assert.ok(!/playbook/i.test(p.$('.nego-selmenu').textContent),
      'the playbook cannot draft, so it must not appear to');
  });


});

describe('F89 (6) — the document that was uploaded is the document that is drawn', () => {
  test('the clause heading is the literal one, not a rebuilt one', async () => {
    const p = await page({ theirChange: false });
    const heads = p.$$('#rl-doc .rl-clause-h').map(h => h.textContent.trim());
    assert.ok(heads.includes('1.1 Definitions'),
      `"1.1 Definitions" must survive verbatim — got ${JSON.stringify(heads)}`);
    assert.ok(heads.includes('8.2(a) Termination for convenience'),
      'a lettered sub-clause number must not be re-punctuated');
    assert.ok(!heads.some(h => /^1\.1\. /.test(h)),
      'a full stop nobody typed is a renumbering, however small');
  });

  test('paragraphs, bold and lists survive into the canvas', async () => {
    const p = await page({ theirChange: false });
    const doc = p.$('#rl-doc');
    assert.ok(doc.querySelector('.nego-body'), 'the body is drawn as rich markup, not a flat projection');
    assert.ok(doc.querySelector('.nego-body strong'), 'bold text must survive ingestion and render');
    assert.ok(doc.querySelector('.nego-body ol li'), 'a numbered sub-clause list must not read as a sentence');
    const payment = [...doc.querySelectorAll('.rl-clause')]
      .find(s => /PAYMENT TERMS/.test(s.textContent));
    assert.equal(payment.querySelectorAll('.nego-body > p').length, 2,
      'two paragraphs in the source are two paragraphs on the page');
  });

  test('a clause under redline keeps its blocks too', async () => {
    const p = await page();
    const changed = p.$('#rl-doc .rl-clause.is-changed');
    assert.ok(changed, 'the changed clause is drawn');
    assert.ok(changed.querySelector('.nego-body'),
      'the block renderer wraps in .nego-body so Direct Edit swaps the whole body');
    assert.ok(changed.querySelector('.rl-line'),
      'redlineOpsBlocksHtml regroups the stored ops at their newlines');
  });

  test('a headingless upload is not given an invented heading', async () => {
    const p = await page({ theirChange: false,
      contract: contractFixture({ redlineText: PLAIN, format: 'text' }) });
    const heads = p.$$('#rl-doc .rl-clause-h').map(h => h.textContent.trim());
    assert.ok(!heads.includes('Clause'), 'a placeholder heading is wording the document does not contain');
  });
});

describe('F89 (7) — two type scales, each declared once', () => {
  /* The one-size rule this replaced unified the canvas with the cards. The
     master directive supersedes it: the CANVAS reads at the Doc page's own
     contract size, so switching tabs never changes the size of the wording
     being judged, while the cards stay at their compact pointer scale. What
     survives from the old rule is the discipline — each scale is one token,
     so neither can drift within itself. */
  test('the canvas is set from the doc token, the cards from the card token', async () => {
    const p = await page();
    assert.match(p.css(), /\.redline-page\{--rl-type:[\d.]+px;--rl-doc-type:[\d.]+px\}/,
      'both scales must be tokens, or a column can drift apart within itself');
    assert.match(p.rule('.redline-page .rl-card-diff') || '', /font-size:var\(--rl-type\)/,
      'the cards keep the compact pointer scale');
    assert.match(p.css(), /\.redline-page \.rl-clause-p,[\s\S]{0,200}?font-size:var\(--rl-doc-type\)/,
      'the contract body must read at the Doc page\'s contract size');
  });

  test('the canvas token is the Doc page\'s ~15px; the card token stays compact', async () => {
    const p = await page();
    const m = /\.redline-page\{--rl-type:([\d.]+)px;--rl-doc-type:([\d.]+)px\}/.exec(p.css());
    assert.equal(m[1], '11.5');
    assert.equal(m[2], '15');
  });
});

describe('F89 (8) — a marked phrase says whose hand it was', () => {
  test('every redlined span in the document carries the last updater', async () => {
    const p = await page();
    const marks = p.$$('#rl-doc .rl-clause.is-changed ins, #rl-doc .rl-clause.is-changed del');
    assert.ok(marks.length, 'the changed clause must actually carry marked wording');
    for (const m of marks)
      assert.match(m.getAttribute('title') || '', /^Last updated by Amina Wanjiru/,
        'a mark with no attribution makes "who asked for this" a question you cannot answer by looking');
  });

  test('and the card answers it too, now on its meta line', async () => {
    /* The card used to carry a clamped copy of the redline, and the
       attribution rode on the marked runs inside it. The copy is gone — the
       wording lives in the document, which is where the marks above are — so
       the same question is answered by the line naming the clause and the
       author, which is on every card, open or collapsed. */
    const p = await page();
    const meta = p.$('#rl-changes .rl-card-meta');
    assert.ok(meta);
    assert.match(meta.getAttribute('title') || '', /Last updated by Amina Wanjiru/);
  });

  test('a name carrying a quote cannot break out of the attribute', async () => {
    const p = await page({ theirChange: false });
    await p.win.negoFileProposal(p.c, p.win.negoBaseText(p.c).replace('thirty (30) days', 'forty (40) days'),
      { side: 'counterparty', author: 'A "Tricky" Name' });
    p.win.renderRedline();
    const mark = p.$('#rl-doc .rl-clause.is-changed ins, #rl-doc .rl-clause.is-changed del');
    assert.ok(mark, 'the change still renders');
    /* Read back through the PARSER, which is the whole test. An unescaped
       quote would close the attribute at "A ", and everything after it would be
       parsed as further attributes — so the title would come back truncated and
       the element would carry junk attributes it was never given. */
    assert.equal(mark.getAttribute('title').startsWith('Last updated by A "Tricky" Name'), true,
      'the whole name must survive the round trip through the attribute');
    assert.ok(!mark.hasAttribute('name') && !mark.hasAttribute('tricky'),
      'a broken-out attribute value reappears as attributes nobody wrote');
  });
});

describe('F89 (9) — one sidebar, and one face left in it', () => {
  /* THE SECOND FACE HAS GONE. The Discussion column was a second list of the
     same changes, in a different order, behind a tab — so reading what your
     team said about clause 6.1 meant leaving the card for clause 6.1. The
     conversation reads on the change now (10 Aug 2026) and the switcher, the
     tray it sat in and the pair of rules that hid one column to show the other
     went with it. */
  test('there is one column, and nothing can hide it', async () => {
    const p = await page();
    assert.equal(p.$('#rl-disc-col'), null, 'no second panel');
    assert.equal(p.$$('#rl-side [data-rl-mode]').length, 0, 'and nothing to switch with');
    assert.doesNotMatch(p.css(), /#rl-changes-col\{display:none\}/,
      'no rule may take the cards off the page');
    p.win.rlSetSideMode('disc');
    assert.equal(p.win.rlSideMode(), 'changes', 'there is only one mode to be in');
    assert.ok(p.$('#rl-changes-col'), 'and the cards are still drawn');
  });

  test('the conversation moved onto the card, it did not disappear', async () => {
    const p = await page();
    const card = p.$('#rl-changes [data-nego-card]');
    assert.ok(card.querySelector('.rl-cnotes'), 'the notes block is on the change');
    const id = card.getAttribute('data-nego-card');
    assert.ok(card.querySelector(`[id="nego-ti-${id}"]`), 'with the engine\'s own composer');
    assert.ok(card.querySelector(`[data-nego-send="${id}"]`), 'and its own send');
  });
});

describe('F89 (10) — the Tracked Changes column holds only live redlines', () => {
  test('a decided change leaves the column', async () => {
    const p = await page();
    const ch = p.win.negoChanges(p.c)[0];
    assert.ok(p.$(`#rl-changes [data-nego-card="${ch.id}"]`), 'it is there while it is pending');
    p.win.negoResolve(p.c, ch.id, 'accepted', { side: 'owner' });
    p.win.renderRedline();
    assert.ok(!p.$(`#rl-changes [data-nego-card="${ch.id}"]`),
      'a column of changes nobody can act on is a column people stop reading');
  });

  test('and the empty state says where the settled ones went', async () => {
    const p = await page();
    p.win.negoResolve(p.c, p.win.negoChanges(p.c)[0].id, 'accepted', { side: 'owner' });
    p.win.renderRedline();
    assert.match(p.$('#rl-changes').textContent, /already been decided/,
      'silence about the history reads as data loss');
  });

  test('an unchanged clause has no card at all', async () => {
    const p = await page();
    const cards = p.$$('#rl-changes [data-nego-card]').length;
    assert.equal(cards, 1, 'one live change, one card — not one card per clause');
    assert.ok(p.$$('#rl-doc .rl-clause').length > cards,
      'the document still shows every clause; only the column is narrowed');
  });
});

describe('F89 (11,12) — the card verbs, their colours, and where Edit lands', () => {
  test('Accept is the filled one; Reject and Edit recede to outlines', async () => {
    /* THREE EQUAL TINTS BECAME A PRIMARY AND TWO ALTERNATIVES. Green, red and
       grey washes of the same weight asked the reader to choose between three
       equals — but accepting is what most cards are for, and the other two are
       the exceptions. Filled accent for the yes; an outline each for the no and
       the counter, which keeps their colours in the text where they still say
       which is which. The original worry — "a row of solid fills reads as
       alarms" — is answered by there being exactly one fill per card. */
    /* THE COLOUR IS NAMED, NOT TYPED. This asserted the literal #0f766e, which
       stopped being true when the brand colours were gathered into one place so
       the platform can carry a second theme. The rule it is guarding has not
       moved an inch — Accept is the one filled button, filled with the brand's
       own colour — so it now names that colour the way the stylesheet does. */
    const p = await page();
    assert.match(p.rule('.redline-page .rl-acc,.redline-page .rl-send') || '', /background:var\(--color-accent-700\)/);
    assert.match(p.rule('.redline-page .rl-acc,.redline-page .rl-send') || '', /color:#fff/);
    assert.match(p.rule('.redline-page .rl-rej') || '', /background:none/);
    assert.match(p.rule('.redline-page .rl-rej') || '', /color:#b91c1c/);
    assert.match(p.rule('.redline-page .rl-edit') || '', /background:none/);
    assert.match(p.rule('.redline-page .rl-edit') || '', /border:1px solid/);
  });

  test('the buttons on a live card carry those classes', async () => {
    const p = await page();
    const card = p.$('#rl-changes .rl-card');
    assert.ok(card.querySelector('button.rl-acc[data-nego-accept]'));
    assert.ok(card.querySelector('button.rl-rej[data-nego-reject]'));
    assert.ok(card.querySelector('button.rl-edit[data-rl-edit]'));
  });

  test('an unsent draft of ours gets a green Send', async () => {
    const p = await page({ theirChange: false, myChange: true });
    const card = p.$('#rl-changes .rl-card');
    const send = card.querySelector('button.rl-send[data-rl-send]');
    assert.ok(send, 'the one state that looks finished and is not must carry its own send');
    assert.match(card.textContent, /Draft/);
  });

  test('Edit jumps to the clause in the document and opens the editor there', async () => {
    const p = await page();
    const btn = p.$('#rl-changes [data-rl-edit]');
    const clauseId = btn.getAttribute('data-rl-edit');
    btn.click();
    const clause = p.$(`#rl-doc [data-clause="${clauseId}"]`);
    assert.ok(clause, 'the target clause must exist in the canvas');
    assert.ok(clause.classList.contains('rl-arrived'),
      'a page that silently jumps has moved the reader without telling them where');
    assert.ok(clause.querySelector('[data-nego-editor]'),
      'Edit means edit — the engine\'s inline editor opens on the clause itself');
  });

});

describe('F89 (14) — the card says what the change is, in two lines', () => {
  /* AND THAT IS A REVERSAL. The wording was taken OFF the card on the argument
     that the document beside it already shows the change, so a clamped copy
     was the same words twice. True, and the card that was left read as a
     filing reference: an id, a clause number and four buttons, with nothing on
     it about the thing being decided. It is back on the design's call (10 Aug
     2026) — clamped to two lines, marks and all, a summary you skim down the
     column rather than a place to read a clause. The full wording in its own
     surroundings is one click away and always has been (rlLinkFocus). */
  test('the card carries the delta, clamped', async () => {
    const p = await page();
    const diff = p.$('#rl-changes .rl-card-diff');
    assert.ok(diff, 'the card says what is being asked for');
    assert.ok(diff.textContent.trim().length, 'and says it in words');
    const r = p.rule('.redline-page .rl-card-diff');
    assert.match(r, /-webkit-line-clamp:2/,
      'two lines: a summary, not a second copy of the clause');
    assert.match(r, /overflow:hidden/);
  });

  test('but the document still marks it, so nothing was lost with the copy', async () => {
    const p = await page();
    assert.ok(p.$$('#rl-doc .rl-clause.is-changed ins, #rl-doc .rl-clause.is-changed del').length,
      'the redline is still readable — it moved, it did not go');
  });

  test('and pressing the card still takes you to it', async () => {
    /* THE HEAD IS THE PRESS TARGET. A card is a toggle now (10 Aug 2026) and
       only its head carries the listener, so the body — the verbs, the note
       box — cannot fold the card away underneath the hand using it. */
    const p = await page();
    p.$('#rl-changes .rl-card .rl-card-head').click();
    assert.ok(p.$('#rl-doc .rl-clause.is-linked'),
      'the card is a handle: the press is how you reach the wording it stands for');
  });

  /* Joined rather than deep-compared throughout: rlDeltaOps returns an array
     built in the PAGE's realm, whose prototype is not this realm's Array, so
     deepEqual reports a mismatch on two identical lists — the same trap f60
     documents and f84 works around the same way. */
  test('two edits far apart are not run together', async () => {
    const ops = [{ op: 'keep', text: 'A ' }, { op: 'del', text: 'one' },
      { op: 'keep', text: ' middle bit ' }, { op: 'ins', text: 'two' }, { op: 'keep', text: ' end' }];
    const p = await page();
    const out = p.win.rlDeltaOps(ops);
    assert.equal([...out].map(o => o.op).join(','), 'del,keep,ins',
      'the dropped middle leaves an ellipsis, or the card asserts they were adjacent');
    assert.match(out[1].text, /…/);
    assert.ok(![...out].some(o => /middle bit/.test(o.text)), 'and the middle itself is gone');
  });

  test('leading and trailing context leaves nothing behind', async () => {
    const p = await page();
    const out = p.win.rlDeltaOps([{ op: 'keep', text: 'before ' },
      { op: 'ins', text: 'X' }, { op: 'keep', text: ' after' }]);
    assert.equal([...out].map(o => o.op).join(','), 'ins',
      'there is no information in "the clause continues"');
  });

  test('a record with nothing marked falls back whole rather than blank', async () => {
    const p = await page();
    const out = p.win.rlDeltaOps([{ op: 'keep', text: 'nothing moved' }]);
    assert.equal([...out].map(o => o.text).join('|'), 'nothing moved',
      'an empty card is worse than a verbose one');
  });
});

describe('F89 (15) — a clause and its card are one thing shown twice', () => {
  test('clicking the clause lights and reaches its card', async () => {
    const p = await page();
    const ch = p.win.negoChanges(p.c)[0];
    const clause = p.$(`#rl-doc [data-nego-card-anchor="${ch.id}"]`);
    assert.ok(clause, 'the changed clause must name its card');
    let scrolled = null;
    const card = p.$(`#rl-changes [data-nego-card="${ch.id}"]`);
    card.scrollIntoView = o => { scrolled = o; };
    clause.click();
    assert.ok(card.classList.contains('is-linked'), 'the card must light');
    assert.ok(clause.classList.contains('is-linked'), 'and so must the clause');
    assert.ok(scrolled && scrolled.behavior === 'smooth', 'the card is scrolled to, smoothly');
  });

  test('clicking the card lights and reaches its clause', async () => {
    const p = await page();
    const ch = p.win.negoChanges(p.c)[0];
    /* RE-QUERIED AFTER THE PRESS. The head both jumps and toggles, and the
       toggle repaints the page — so a node held from before is detached
       afterwards, its class never changes, and the assertion reads false for a
       reason that has nothing to do with the pairing under test. The stub is
       put on the prototype's own element each time it is looked up. */
    const clauseNow = () => p.$(`#rl-doc [data-nego-card-anchor="${ch.id}"]`);
    let scrolled = null;
    const stub = o => { scrolled = o; };
    clauseNow().scrollIntoView = stub;
    /* The repaint replaces the node, so the stub has to survive it: patch the
       prototype for the length of this test rather than one element. */
    const proto = p.win.Element.prototype;
    const real = proto.scrollIntoView;
    proto.scrollIntoView = stub;
    try {
      p.$(`#rl-changes [data-nego-card="${ch.id}"] .rl-card-head`).click();
      assert.ok(clauseNow().classList.contains('is-linked'));
      assert.ok(scrolled && scrolled.behavior === 'smooth', 'the clause is scrolled to, smoothly');
    } finally { proto.scrollIntoView = real; }
  });

  test('the end that was clicked is not yanked out from under the pointer', async () => {
    const p = await page();
    const ch = p.win.negoChanges(p.c)[0];
    const clause = p.$(`#rl-doc [data-nego-card-anchor="${ch.id}"]`);
    let clauseScrolled = false;
    clause.scrollIntoView = () => { clauseScrolled = true; };
    clause.click();
    assert.equal(clauseScrolled, false,
      'the reader can already see the thing they just pressed');
  });

  test('pressing a clause tool is not a request to move the page', async () => {
    const p = await page();
    const ch = p.win.negoChanges(p.c)[0];
    const card = p.$(`#rl-changes [data-nego-card="${ch.id}"]`);
    let scrolled = false;
    card.scrollIntoView = () => { scrolled = true; };
    p.$(`#rl-doc [data-nego-card-anchor="${ch.id}"] .rl-tool`).click();
    assert.equal(scrolled, false, 'operating a clause is not asking about it');
  });

  test('only one pair is lit at a time', async () => {
    const p = await page({ myChange: true });
    const [a, b] = p.win.negoChanges(p.c);
    p.win.rlLinkFocus(p.c, a.id, 'card');
    p.win.rlLinkFocus(p.c, b.id, 'card');
    const lit = p.$$('#view-redline .is-linked').map(n =>
      n.getAttribute('data-nego-card') || n.getAttribute('data-nego-card-anchor'));
    assert.deepEqual([...new Set(lit)], [b.id], 'a stale ring points at the wrong change');
  });
});

describe('F89 (16) — Send is one click, and the card says so afterwards', () => {
  test('the page hands the engine a direct send and a contact', async () => {
    /* Without both, #nego-send falls through to the share dialog — which is
       the pop-up this is removing. */
    const p = await page({ theirChange: false, myChange: true });
    let handed = null;
    const real = p.win.wireNegotiationTab;
    p.win.wireNegotiationTab = (c, o) => { handed = o; return real(c, o); };
    p.win.renderRedline();
    assert.equal(typeof handed.onSendDirect, 'function');
    assert.ok('contact' in handed, 'the mount must answer "do we know where this goes?"');
  });

  test('with an address on file, Send opens no dialog', async () => {
    const p = await page({ theirChange: false, myChange: true, email: 'erik@kabras.co.ke' });
    p.$('#rl-changes [data-rl-send]').click();
    await new Promise(r => setTimeout(r, 20));
    assert.equal(p.post.modals, 0, 'a secondary confirmation is exactly what this removes');
    assert.equal(p.post.reshared, 1, 'and the send really goes, on the one click');
  });

  test('after the send the card collapses, and the badge is what says so', async () => {
    /* THE CARD FOLDS WHEN THE MOVE IS NOT YOURS. A sent ask has nothing left
       for this reader to press — Edit navigates, Sent is a label — so it
       becomes a line, and the head carries the fact. Opening it again brings
       the amber Sent back, which the next test pins. */
    const p = await page({ theirChange: false, myChange: true, email: 'erik@kabras.co.ke' });
    assert.match(p.$('#rl-changes .rl-badge').textContent, /Draft/);
    assert.ok(p.$('#rl-changes .rl-card-verbs'), 'a draft is open — it has verbs to press');
    p.$('#rl-changes [data-rl-send]').click();
    await new Promise(r => setTimeout(r, 20));
    p.win.renderRedline();
    assert.match(p.$('#rl-changes .rl-badge').textContent, /^Sent$/,
      'the fact stays on the head, which is the part that never folds');
    const card = p.$('#rl-changes .rl-card');
    assert.equal(card.getAttribute('data-rl-open'), '0');
    /* The body is in the DOM and hidden by the shut class rather than removed,
       so opening it is a class flip rather than a rebuild of the column. */
    assert.ok(card.classList.contains('rl-card-shut'), 'and the body folds away with it');
    assert.ok(card.querySelector('.rl-card-head'), 'with the head that opens it again');
    assert.ok(!p.$('#rl-changes [data-rl-send]'), 'it cannot be sent twice');
  });

  test('and opening it again puts the amber Sent back where the Send was', async () => {
    const p = await page({ theirChange: false, myChange: true, email: 'erik@kabras.co.ke' });
    p.$('#rl-changes [data-rl-send]').click();
    await new Promise(r => setTimeout(r, 20));
    p.win.renderRedline();
    p.$('#rl-changes .rl-card .rl-card-head').click();
    p.win.renderRedline();
    const sent = p.$('#rl-changes button.rl-sent');
    assert.ok(sent, 'the verb is where it was rather than gone');
    assert.equal(sent.textContent.trim(), 'Sent');
    assert.ok(sent.disabled, 'there is nothing further to do to it');
  });

  test('the amber is the specified one, and it is not greyed out', async () => {
    const p = await page();
    assert.match(p.rule('.redline-page .rl-sent') || '', /background:#fef3c7/,
      'the amber wash, matching the other verbs\' tint-and-tone clothing');
    assert.match(p.css(), /button\.rl-sent:disabled\{opacity:1\}/,
      'a state the reader is meant to read must not be dimmed like a withheld control');
  });

  test('the badge follows the record, not a flag anybody set', async () => {
    /* The whole safety argument for saying "Sent": it is read back from
       negoUnsentAsks, which measures against the hand-over timestamp. If the
       send fails, the turn does not move and nothing claims to have gone. */
    const p = await page({ theirChange: false, myChange: true, email: 'erik@kabras.co.ke' });
    p.win.reshareToLastRecipient = async () => { throw new Error('the network is down'); };
    p.$('#rl-changes [data-rl-send]').click();
    await new Promise(r => setTimeout(r, 20));
    p.win.renderRedline();
    assert.equal(p.win.negoUnsentAsks(p.c, 'owner').length, 1, 'nothing left the building');
    assert.match(p.$('#rl-changes .rl-badge').textContent, /Draft/,
      'so nothing may say it did');
    assert.ok(p.$('#rl-changes [data-rl-send]'), 'and the send is still offered');
    assert.match(p.w.toastText(), /Could not send/);
  });
});

describe('F89 (13) — the flashing batch send', () => {
  test('it appears with a count when drafts are held back', async () => {
    const p = await page({ theirChange: false, myChange: true });
    const b = p.$('[data-rl-blast]');
    assert.ok(b, 'the blast send renders at the head of the Tracked Changes column, beside the drafts it publishes');
    assert.match(b.textContent, /Send All \(1\) Redline/);
    assert.ok(b.classList.contains('rl-btn-blast'));
    assert.match(p.css(), /@keyframes rlBlast/, 'prominent means animated');
    assert.match(p.css(), /prefers-reduced-motion:reduce/,
      'a pulse nobody can switch off is an accessibility defect');
  });

  test('the count is the engine\'s own count of unsent asks', async () => {
    const p = await page({ theirChange: false, myChange: true });
    await p.win.negoFileProposal(p.c, p.win.negoBaseText(p.c).replace('Saturday', 'Saturday or Sunday'),
      { side: 'owner', author: 'Young Mbagaya' });
    p.win.renderRedline();
    assert.equal(p.win.negoUnsentAsks(p.c, 'owner').length, 2);
    assert.match(p.$('[data-rl-blast]').textContent, /Send All \(2\) Redlines/);
  });

  test('nothing unsent, no flashing button', async () => {
    const p = await page();                       // only THEIR change is on the table
    assert.equal(p.win.negoUnsentAsks(p.c, 'owner').length, 0);
    assert.ok(!p.$('[data-rl-blast]'),
      'an alarm with nothing behind it is worse than no alarm');
  });

  test('one press publishes the lot through the engine\'s own send', async () => {
    const p = await page({ theirChange: false, myChange: true });
    const engine = p.doc.getElementById('nego-send');
    assert.ok(engine, 'the engine\'s send must be in the DOM to be pressed');
    let fired = 0;
    engine.addEventListener('click', () => { fired++; });
    p.$('[data-rl-blast]').click();
    assert.equal(fired, 1, 'the blast IS the engine\'s own send — one control, one act');
  });

  test('the card\'s Send is the same act, not a second one', async () => {
    const p = await page({ theirChange: false, myChange: true });
    const engine = p.doc.getElementById('nego-send');
    let fired = 0;
    engine.addEventListener('click', () => { fired++; });
    p.$('#rl-changes [data-rl-send]').click();
    assert.equal(fired, 1,
      'a per-change send would let a reader believe they published one ask while others stayed home');
  });

  test('the batch button keeps its own tooltip while it is usable', async () => {
    const p = await page({ theirChange: false, myChange: true });
    const b = p.$('[data-rl-blast]');
    assert.match(b.title, /Publish every unsent redline/,
      'a control that only describes itself when broken is the wrong way round');
  });
});
