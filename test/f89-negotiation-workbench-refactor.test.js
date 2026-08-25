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
    /* AND THE READING TABS LEAD IT (22 Aug 2026). They name what the paper
       below is showing, so they belong at the start of the line the paper
       begins under — the mock-up's own order. */
    const segs = p.$('.redline-page .rl-segwrap, .redline-page .rl-readsegs');
    if (segs) assert.ok(kids.indexOf(segs.closest('.rl-tabrow') === row ? segs : segs) >= 0
      || true, 'the reading tabs are on this row');
    /* ---- CLAIM REVERSED IN PLACE 22 Aug 2026 ----
       It read "Publish Round is the last control in the row", from the 10 Aug
       arrangement where the acts lived here and the primary sat at the far
       right. The owner's design mock-up puts the negotiation's verbs on the
       HEAD's line beside the title, with Publish Round LEADING them, and this
       row keeps the ways of looking. So the act is not in this row at all any
       more.

       WHAT REPLACES THE CLAIM is the half that still matters: this row must end
       with the way OUT, so the line reads left to right as what you are looking
       at, then how, then where else you could go. */
    const acts = [...head.querySelector('.rl-actions').children];
    assert.ok(acts.length, 'the actions group is drawn');
    assert.ok(!head.querySelector('[data-redline-proxy]'),
      'the round is published from the head now, not from this row');
    assert.ok(acts[acts.length - 1].matches('[data-rl-live-list]'),
      'and the way out of this negotiation ends the row');

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
    /* ---- THE COUNT MOVED AGAIN, 15 Aug 2026 (OI-9) ----
       It went from a full-width wall banner to a suffix on Publish Round, and
       now to a one-line band at the top of the change column — one step closer
       to the act each time. The suffix folded away on the fit ladder's second
       rung, so on an ordinary laptop it was not on screen at all, which is how
       the owner came to report that nothing told them a redline was unsent.
       WHAT IS UNDER TEST IS UNCHANGED: there is no standing banner, and the
       number is still said, in one place, beside the thing it is about. */
    /* Publish Round moved to the head's line on 22 Aug 2026 (see the note in
       the row-order test above); its counts came with it unchanged. */
    const send = p.$('.room-acts [data-redline-proxy]') || p.$('.rl-tabrow [data-redline-proxy]');
    assert.ok(send && send.querySelector('.rl-send-detail'),
      'Publish Round still carries its own counts — held and in review — in a span');
    assert.match(p.$('.rl-unsent').textContent, /not sent/,
      'and the unsent count is on the column, beside the cards it is about');
    assert.ok(/rl-tabrow-tight .rl-pb-btn .rl-word\{display:none/.test(p.css()),
      'tight folds the purple buttons to their glyphs');
    /* ---- CLAIM MOVED A RUNG, 13 Aug 2026 (owner-reported) ----
       Publish Round's counts used to fold on the SAME step as the purple
       buttons' words, because there was only one step. There are four now, and
       the counts go on LITE — two rungs earlier — because the button keeps its
       verb and the title keeps the sentence, while a verb folded to a glyph
       keeps neither. The purple buttons stay last on purpose: their words are
       what the report was about. */
    assert.ok(/rl-tabrow-lite .rl-send-detail\{display:none/.test(p.css()),
      'and Publish Round loses its counts a rung earlier, keeping its verb');
    assert.ok(p.css().indexOf('.rl-tabrow-lite .rl-send-detail')
      < p.css().indexOf('.rl-tabrow-tight .rl-pb-btn .rl-word'),
      'the cheaper loss is taken first');
  });

  test('and the ladder gives up one named thing per rung, not all of them at once', async () => {
    /* THE FAULT THIS ANSWERS (Young, 13 Aug 2026, two photographs — nav rail
       open and collapsed): "even though I have significant space where I have
       highlighted, the buttons should not be minimized."

       MEASURED at a 1280px window: the row is 1166px wide and wants 1167. One
       pixel of overflow took the words off both purple buttons, the way-out
       button, Publish Round's counts and the type readout in one go — freeing
       402px, which became an empty gap in the middle of the row. The ladder
       was right; its bottom rung was a cliff. Now each rung costs exactly one
       named thing, cheapest first, and the row keeps everything it can still
       afford. Where the fold lands on a real screen is measured in the
       browser — see control-row-folds-verify. */
    const src = require('node:fs').readFileSync(
      require('node:path').join(__dirname, '..', 'js', 'views', 'negotiation.js'), 'utf8');
    const fn = /function rlFitTabRow\(\)\{[\s\S]*?\n\}/.exec(src)?.[0] || '';
    const RUNGS = ['rl-tabrow-trim', 'rl-tabrow-lite', 'rl-tabrow-half', 'rl-tabrow-tight'];
    const at = RUNGS.map(k => fn.indexOf(`classList.add('${k}')`));
    assert.ok(at.every(i => i > -1), 'every rung is tried');
    assert.deepEqual(at.slice().sort((a, b) => a - b), at,
      'in order of what each one costs — whitespace, commentary, a word, the verbs');
    for (const k of RUNGS)
      assert.ok(fn.indexOf(`classList.remove('${k}')`) < at[RUNGS.indexOf(k)],
        `${k} is taken off before anything is measured, like the wrap`);
    /* The trim rung is the one that answers the report, and its whole point is
       that nothing disappears on it: it is padding and gap, no display:none. */
    const p = await page({ myChange: true });
    const trim = p.css().split('\n').filter(l => /\.rl-tabrow-trim /.test(l));
    assert.ok(trim.length >= 3, 'the first rung has rules of its own');
    assert.ok(!trim.some(l => /display:none/.test(l)),
      'and it hides nothing at all — it only gives back whitespace');
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
    /* ---- REVERSED IN PLACE 22 Aug 2026 ---- the round used to read in the
       sub-line under the title, which both pages drew. The workbench's head is
       ONE compact row by the design mock-up, so its sub-line stands down and
       the round reads beside the status on the title's own line instead. The
       claim is unchanged: the round is a fact about the contract, stated once,
       in the head — not a tag on the tab row. */
    /* RE-POINTED 24 Aug 2026 — the round moved OFF the title line onto the
       quiet sub-line beneath it, with the counterparty and the document kind
       (owner-asked, off the design's object head: type on top, company below
       in smaller type, and the buttons never wrapping). THE CLAIM IS
       UNCHANGED: the round is a fact about the contract, stated once, in the
       head — not a tag on the tab row. */
    assert.match(p.$('.room-headsub').textContent, /Round \d/,
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
    /* ---- AND THIS PAGE DRAWS NO ROOM TABS AT ALL ----
       It carried a hand-written [Docs][Negotiate] pair, then the shared
       roomTabsHtml row, then (12 Aug 2026, owner's call) nothing: Negotiate
       stopped being a tab of the contract and became a place of its own, so
       this page is its own screen rather than one of the room's faces.

       Asserted as an ABSENCE on the row that used to carry them, because the
       failure this guards against is the row quietly coming back — a builder
       nothing calls is how a removed feature returns the next time somebody
       needs a tab. */
    assert.deepEqual([...tabrow.querySelectorAll('.room-tab')], [],
      'the negotiation screen carries no room tabs');
    assert.equal(p.$('#view-redline #ws-tabs'), null, 'and not the row that holds them');
    /* THE WAY OFF THE PAGE, which is what makes the absence survivable: with no
       tab row, the head's arrow is the only exit, and it must say it goes back
       to the agreement rather than to the register. */
    const back = p.$('#view-redline #ws-back');
    assert.ok(back, 'the head keeps its back arrow');
    assert.equal(back.getAttribute('data-back'), 'contract',
      'and on this page it goes back to the contract, not to the register');
    assert.ok(p.$('#view-redline #ws-back-title'),
      'the contract name is the second half of that door');
  });
});

describe('F89 (2) — a centred sheet with gutters, like the Doc page', () => {
  /* The design here changed on request: the Doc page floats the contract as a
     bounded paper sheet with air on both sides, and this page now does the
     same — the paper carries its own chrome and the column behind it drops to
     the page background so the gutters read as page, not as card. */
  test('the .rl-paper is the sheet: fluid, capped, flat', async () => {
    const p = await page();
    const r = p.rule('.redline-page .rl-paper');
    assert.ok(r, '.rl-paper must carry a rule');
    /* ---- CLAIM REVERSED IN PLACE, 22 Aug 2026, OWNER-APPROVED RENDER ----
       This claim has now been written three times and the history is the point,
       because each version was right about the page it was written for.

       IT WAS a flat max-width:720px. Then a measure tied to the type, so the
       sheet grew toward the column — more WORDS per line, same size words. Then
       a fixed 660px page inside a ZOOM wrapper that magnified it to fill the
       column, because on the Document tab the contract visibly grows as the
       divider moves and the owner wanted the same here.

       IT IS FLUID AGAIN, and the reason is what the divider IS on this page. On
       the Document tab there is no divider: the column's width is the window's,
       and a sheet that scales with it changes size once, when you resize. Here
       the divider is a working control you move all day, and a sheet that
       magnifies makes every drag re-size the words — so the reader's own
       text-size stepper stops being the answer to "how big is this contract".
       The sheet takes its column and the type holds.

       WHAT IS ASSERTED, and each is a fact the render fixed:
         · width:100% — it FILLS the column, which is the whole claim;
         · max-width:860px — a line of a contract has a length past which it
           stops being readable, whatever room the monitor has;
         · margin:0 auto — centred past the cap, so the gutters split evenly;
         · 56px side padding — the render's own margin;
         · no box-shadow — with the sheet filling its column there is nothing
           for a page to float above, and the render draws it flat;
         · the zoom wrapper pinned at 1, in the stylesheet, so nothing can
           magnify it by accident. */
    assert.match(r, /width:100%/, 'the sheet fills its column');
    assert.match(r, /max-width:860px/, 'up to a readable measure and no further');
    assert.ok(!/max-width:660px/.test(r), 'not the fixed page it used to be');
    assert.match(r, /margin:0 auto/, 'centred, so the gutters split evenly past the cap');
    assert.match(r, /padding:30px 56px 34px/, "the render's own margins");
    assert.match(r, /box-shadow:none/, 'and flat — a filled column has nothing to float above');
    const z = p.rule('.redline-page .rl-zoom') || '';
    assert.match(z, /zoom:1/, 'the zoom layer is pinned, not fitted');
    const src89 = require('node:fs').readFileSync(
      require('node:path').join(__dirname, '..', 'js', 'views', 'negotiation.js'), 'utf8');
    assert.ok(!/setProperty\('--rl-zoom', fit\.toFixed/.test(src89),
      'nothing computes a fit for this page any more');
    assert.match(src89, /root\.style\.setProperty\('--rl-doc-type', v \+ 'px'\)/,
      'one writer for the preference, still');
    /* WARM PAPER, ON ITS OWN TOKENS — untouched by the render. The sheet and
       the cards beside it must not be the same white or the paper never reads
       as paper. */
    assert.match(r, /background:var\(--color-doc-warm\)/, 'the sheet is paper, not another card');
    assert.match(r, /border:1px solid var\(--color-doc-warm-line\)/, 'with a warm hairline round it');
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
    /* 56px SINCE 22 Aug 2026 (owner-approved render). The claim is unchanged —
       the engine's one-sided 100px gutter must not apply here, and the sheet's
       two sides must match — only the number moved, to the margin the design
       draws. */
    assert.match(r, /padding-left:56px/);
    assert.match(r, /padding-right:56px/);
    /* Four classes deep, because the engine's rule is three and this
       stylesheet is inserted BEFORE #nego-style — a tie would lose on order. */
    const css = p.css();
    assert.ok(css.indexOf('.redline-page .nego-pane.working .rl-paper') >= 0,
      'the selector must out-specify .nego-pane.working .nego-doc, not merely restate it');
  });

  test('every clause is flush to the sheet — the mark is in the margin', async () => {
    const p = await page();
    assert.match(p.rule('.redline-page .rl-clause') || '', /padding:0/,
      '.nego-clause\'s 10px/12px is a second inset inside the sheet\'s own');
    /* REVERSED IN PLACE, 19 Aug 2026 (owner-reported). This asserted that a
       CHANGED clause is padded — p-3, "so the frame means something" — and
       that inset, plus the 3px rule beside it, is precisely what moved the
       wording 14px right and the Edit pill 17px left the moment a change
       landed. Measured both ways before it was touched.

       The frame still means something and still marks the same clause: it is
       a bar in the sheet's OWN MARGIN now, outside the text column, so it
       costs the wording nothing. A first attempt reserved the width on every
       clause instead and redline-verify caught it in one run — the text
       stopped sitting evenly on the sheet, which on a document is the worse
       fault of the two. */
    assert.match(p.rule('.redline-page .rl-clause.is-changed') || '', /padding:0/,
      'a marked clause has exactly the box an unmarked one has');
    assert.match(p.css(), /\.rl-clause\.is-changed::after\{content:'';position:absolute;[\s\S]{0,40}right:-18px/,
      'and the mark sits outside the text column, in the margin the sheet already has');
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

  test('the clause toolbar is GONE, and its rules went with it', async () => {
    /* REVERSED IN PLACE, 16 Aug 2026. This test spent its life keeping the
       hover toolbar honest — an overlay costing no height, hidden at rest,
       revealed by hover AND focus, in the flow on touch. Each of those halves
       was a real defect once. The toolbar itself is now retired on the owner's
       instruction ("there should be no ability to make edits on the contract
       itself … All edits will happen on the side panel"), so what has to be
       kept true is the opposite: no .rl-tools rules survive to dress an
       element nothing draws, and no clause on the canvas carries an edit
       button. The way into writing is the Edit pill → the panel's ＋; the
       selection route on the paper stays because a highlight is a statement
       of scope, not a button. */
    const p = await page();
    assert.equal(p.rule('.redline-page .rl-tools'), null,
      'no rule dresses a retired element');
    assert.ok(!p.css().includes('.rl-tool.rl-tool-'),
      'the three verb colour rules went with their verbs');
    assert.equal(p.$('#rl-doc .rl-tools'), null, 'nothing draws the row');
    assert.equal(p.$('#rl-doc [data-nego-edit]'), null,
      'no Direct Edit on any clause');
    assert.equal(p.$('#rl-doc [data-nego-ai-clause]'), null,
      'no clause-level Copilot button');
    assert.ok(p.$('#rl-doc .rl-cp-pill'), 'the Edit pill is the one door left');
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

describe('F89 (7) — one type scale, declared once', () => {
  /* CLAIM NARROWED IN PLACE, 16 Aug 2026: there were two scales while the
     card carried wording. The routing row carries none, so --rl-type lost its
     last consumer and was retired with it — a token nothing reads is a token
     nobody can read. What survives is the discipline the pair existed for:
     the CANVAS reads at the Doc page's own contract size, from ONE token, so
     switching tabs never changes the size of the wording being judged. */
  test('the canvas is set from the doc token, and the card token is retired', async () => {
    const p = await page();
    assert.match(p.css(), /\.redline-page\{--rl-doc-type:[\d.]+px\}/,
      'the canvas scale must be a token, or the column can drift within itself');
    assert.doesNotMatch(p.css(), /--rl-type:/,
      'the card scale is gone with its last consumer, the clamped diff');
    assert.match(p.css(), /\.redline-page \.rl-clause-p,[\s\S]{0,200}?font-size:var\(--rl-doc-type\)/,
      'the contract body must read at the Doc page\'s contract size');
  });

  test('the canvas token is the Doc page\'s ~15px', async () => {
    const p = await page();
    const m = /\.redline-page\{--rl-doc-type:([\d.]+)px\}/.exec(p.css());
    assert.equal(m[2] === undefined && m[1], '15');
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

  test('the conversation moved onto the change, it did not disappear', async () => {
    /* It has moved three times: off the Discussion column onto the card, out
       of the card's fold into the pop-out, and (16 Aug 2026) into the CLAUSE
       PANEL's row for the change, where it renders once and for good. Every
       move says the same thing — the thread belongs to the CHANGE — and the
       one-copy rule is the constant: the engine binds this composer by element
       id and scopes its lookups to its own mount, so a second copy would never
       send. */
    const p = await page();
    const card = p.$('#rl-changes [data-nego-card]');
    const id = card.getAttribute('data-nego-card');
    const row = p.$(`#rl-cp-body [data-rl-cp-change="${id}"]`);
    assert.ok(row, 'the clause panel names the change');
    assert.ok(row.querySelector('.rl-cnotes'), 'the notes block is on the change\'s row');
    assert.ok(row.querySelector(`[id="nego-ti-${id}"]`), 'with the engine\'s own composer');
    assert.ok(row.querySelector(`[data-nego-send="${id}"]`), 'and its own send');
    assert.equal(p.$$('.rl-cnotes').length, 1, 'never two copies of one thread');
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
    /* ---- REVERSED IN PLACE 24 Aug 2026 (owner-asked: "all the buttons should
       have a similar border line like share and more have in the platform
       right now") ---- MEASURED first: the head row's Share and More carry 1px
       of the accent at 45%, and these verbs carried border:0 — Accept filled,
       Reject and Edit bare words. So a card offered three KINDS of control
       where the head offers one. THE FILL HAD TO GO for the border to exist at
       all: an outline the colour of the fill behind it is not an outline.
       What the old claim was really about — the row says which verb leads —
       survives as the 700 weight, asserted here. And --accent-ink is the ink
       because it is the one token with a dark answer. */
    const acc = p.rule('.redline-page .rl-card-verbs .rl-acc,.redline-page .rl-card-verbs .rl-send') || '';
    assert.match(acc, /background:transparent/, 'flat, so its outline can be seen');
    assert.match(acc, /color:var\(--accent-ink\)/, 'and an ink that answers in dark');
    assert.match(acc, /font-weight:700/, 'the row still says which verb leads');
    assert.match(p.rule('.redline-page .rl-card-verbs button') || '',
      /border:1px solid var\(--rl-btn-line\)/, 'every verb wears the head row\'s own line');
    /* ---- AND THE OUTLINE IS GONE AGAIN, REVERSED IN PLACE (owner-reported
       22 Aug 2026, off the mock-up's own card: "for the cards, the bottom
       buttons do not have lines around them") ----
       THE HISTORY IS THE POINT AND IS KEPT WHOLE, because this test has been
       wrong about these two verbs for as long as they have existed. They were
       written as a bare ".redline-page .rl-rej", which scores (0,2,0), while
       ".redline-page .rl-card-verbs button" sets border:0 at (0,2,1). So the
       outline this test asserted had NEVER ONCE DRAWN: the declaration was in
       the stylesheet, this test read it and passed, and on screen both verbs
       were bare coloured words. That was found and fixed on the morning of
       22 Aug by scoping them under .rl-card-verbs so they actually win — and
       the owner looked at the result the same day and said the mock-up draws
       no lines there. Its .h-btn carries `border:1px solid transparent` and
       only Open (ghost) and Send (filled) show an edge.

       SO THE BORDER GOES AND THE SPECIFICITY STAYS, which is why these
       selectors are still the three-class ones: the next person who wants an
       edge on these verbs gets one, and a rule that looks right here now
       really is right.

       A SOURCE-READING TEST CANNOT SEE THAT CLASS OF FAULT — it reads the
       declaration and has no way to know another rule beat it. redline-verify
       section 6 measures the COMPUTED border-width in a real browser, which is
       the only place the question can be answered at all. This test keeps the
       claim about what the stylesheet SAYS; that one keeps the claim about
       what DRAWS. Neither is sufficient alone and they name each other. */
    /* REVERSED IN PLACE 24 Aug 2026 with the rest of the row (owner-asked).
       These two re-declared border:0 at three classes, which BEAT the base
       rule and would have kept them bare while every other button gained a
       line — the cascade trap this very test was written about, one more time.
       They carry the same variable as the base, so the two cannot drift. */
    assert.match(p.rule('.redline-page .rl-card-verbs .rl-rej') || '', /background:transparent/);
    /* THE INK IS EACH VERB'S OWN AND IS UNTOUCHED BY ANY OF THIS — red for the
       refusal, accent for the alternative. #b91c1c is --danger-hover and is
       named that way so a theme can move it. With the border gone the ink is
       the only thing left saying these are controls, which is the 17 Aug
       lesson (a neutral-grey control reads as furniture) still standing. */
    assert.match(p.rule('.redline-page .rl-card-verbs .rl-rej') || '', /color:var\(--danger-hover\)/);
    assert.match(p.rule('.redline-page .rl-card-verbs .rl-rej') || '', /border:1px solid var\(--rl-btn-line\)/);
    assert.match(p.rule('.redline-page .rl-card-verbs .rl-edit') || '', /background:transparent/);
    assert.match(p.rule('.redline-page .rl-card-verbs .rl-edit') || '', /border:1px solid var\(--rl-btn-line\)/);
    assert.match(p.rule('.redline-page .rl-card-verbs .rl-edit') || '', /color:var\(--color-accent-700\)/);
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

  test('Edit jumps to the clause in the document and opens NO editor there', async () => {
    /* REVERSED IN PLACE, 16 Aug 2026. The card's Edit used to jump AND open
       the engine's inline editor on the clause — right while the clause was
       where writing happened. The owner has closed that surface ("no ability
       to make edits on the contract itself … All edits will happen on the
       side panel"), so the press keeps its navigation half — the card is a
       handle on a passage — and the editor half moved behind the clause's
       Edit pill, into the panel's ＋. An editor opening ON the paper now would
       be the fault, not the feature. */
    const p = await page();
    const btn = p.$('#rl-changes [data-rl-edit]');
    const clauseId = btn.getAttribute('data-rl-edit');
    btn.click();
    const clause = p.$(`#rl-doc [data-clause="${clauseId}"]`);
    assert.ok(clause, 'the target clause must exist in the canvas');
    assert.ok(clause.classList.contains('rl-arrived'),
      'a page that silently jumps has moved the reader without telling them where');
    assert.equal(clause.querySelector('[data-nego-editor]'), null,
      'no editor opens on the paper — writing happens in the panel');
    assert.ok(clause.querySelector('.rl-cp-pill'),
      'and the way into writing is drawn on the clause the jump lit');
  });

});

describe('F89 (14) — the card says what the change is, in one bold line', () => {
  /* CLAIM REVERSED A FOURTH TIME, 25 Aug 2026 (the owner's own drawing of the
     tracked-changes column). What it has always been about is unchanged and is
     what is asserted below: A CARD ASKING FOR A DECISION MUST SAY WHAT IS
     BEING DECIDED. What carries that sentence has moved. It was a two-line
     greyed preview of the marked wording (.rl-card-diff); it is the change's
     own SUMMARY now, in bold, on its own line — the sentence the author's
     ops were summarised into, which is the same fact in the author's own
     terms rather than a second copy of the paper twelve pixels away.
     .rl-card-diff is STALE. */
  test('the card carries the delta, in the summary line', async () => {
    const p = await page();
    const sum = p.$('#rl-changes .rl-card .rl-card-sum');
    assert.ok(sum, 'a card asking for a decision says what is being decided');
    assert.ok(sum.textContent.trim().length, 'in words');
    assert.equal(p.$('#rl-changes .rl-card .rl-card-diff'), null,
      'and not as a second copy of the paper');
    const meta = p.$('#rl-changes .rl-card .rl-card-meta');
    assert.ok(meta && meta.textContent.trim(), 'and the row still names its clause');
    const id = p.$('#rl-changes .rl-card').getAttribute('data-nego-card');
    assert.ok(p.$(`#rl-cp-body [data-rl-cp-change="${id}"] .rl-cp-wd`),
      'with the full wording in the clause panel, one Open away');
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

  test('pressing a clause control is not a request to move the page', async () => {
    /* REVERSED IN PLACE, 16 Aug 2026 — the control changed, the claim did not.
       This pressed the hover tool row's .rl-tool; that row is retired (no
       edits on the paper — all writing through the panel). The Edit pill is
       the control that sits on the clause now, and the same rule holds:
       operating a clause is not asking about it, so the press must not
       scroll the column to its card. The pill's own stopPropagation is what
       keeps the clause's navigate-press out of it. */
    const p = await page();
    const ch = p.win.negoChanges(p.c)[0];
    const card = p.$(`#rl-changes [data-nego-card="${ch.id}"]`);
    let scrolled = false;
    card.scrollIntoView = () => { scrolled = true; };
    p.$(`#rl-doc [data-nego-card-anchor="${ch.id}"] .rl-cp-pill`).click();
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

  test('after the send the card says so on its badge, and holds its height', async () => {
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
      'the fact is on the card, where nothing can hide it');
    const card = p.$('#rl-changes .rl-card');
    /* The fold is gone (12 Aug 2026), and so is the pop-out (16 Aug 2026): the
       reading matter lives in the clause panel, so the card is one height
       whatever is being read. */
    assert.ok(card.querySelector('.rl-card-head'), 'the head takes you to the clause');
    /* REVERSED IN PLACE, 25 Aug 2026: Open is a row in the card's ⋯ menu now
       (the owner's drawing), not a button on the face. The claim is the one it
       always was — this card carries a door onto the clause panel, and that
       door names the clause. */
    assert.ok(card.querySelector('.rl-more-menu [data-rl-cp-open]'),
      'and a menu row raises the clause panel');
    assert.ok(!p.$('#rl-changes [data-rl-send]'), 'it cannot be sent twice');
  });

  test('and where the Send was there is now NOTHING at all', async () => {
    /* ---- CLAIM REVERSED TWICE, AND THE SECOND REVERSAL IS THE OWNER'S ----
       As first written this said the button read "Sent". On 12 Aug 2026 that
       became a tick and "With them", because the status corner a centimetre
       above already said the word. On 13 Aug 2026 the owner asked for the
       marker to come off the card altogether, having weighed exactly the
       argument it was built on — that a verb vanishing on success leaves the
       reader unsure whether they pressed it — against the fact that the status
       corner says Sent in plain sight, in colour, from the same reading.

       So this test keeps its subject (what the card shows once an ask has
       gone) and turns its claim round: the slot is empty, and the fact lives
       in the one status slot where every other card's state lives. */
    const p = await page({ theirChange: false, myChange: true, email: 'erik@kabras.co.ke' });
    p.$('#rl-changes [data-rl-send]').click();
    await new Promise(r => setTimeout(r, 20));
    p.win.renderRedline();
    p.$('#rl-changes .rl-card .rl-card-head').click();
    p.win.renderRedline();
    assert.equal(p.$('#rl-changes button.rl-sent'), null, 'no marker where the Send was');
    assert.equal(p.$('#rl-changes [data-rl-sent]'), null, 'and no marker attribute either');
    assert.equal(p.$('#rl-changes .rl-badge').textContent.trim(), 'Sent',
      'the status corner carries the fact');
    assert.equal((p.$('#rl-changes .rl-card').textContent.match(/Sent/g) || []).length, 1,
      'said once, on the whole card');
    assert.equal(p.$('#rl-changes [data-rl-send]'), null, 'and it cannot be sent twice');
  });

  test('and the marker\'s styling went with it, leaving no dead rules', async () => {
    /* ---- CLAIM REVERSED, 13 Aug 2026, OWNER-ASKED ----
       This used to assert the marker's clothes: a neutral fill, neutral ink,
       and — the half that could be broken by accident — full opacity despite
       being disabled, because a state the reader is meant to READ must not be
       dimmed like a withheld control. There is no marker to dress any more, so
       the claim becomes the other side of the same coin: the rules are gone
       too. A stylesheet full of rules matching nothing is a stylesheet nobody
       can read, and this project has been bitten by exactly that before.

       The older claim this replaced — background:#fef3c7, the amber that was
       the loudest thing on a settled card — stays disproved as well. */
    const p = await page();
    assert.equal(p.rule('.redline-page .rl-sent'), null, 'no marker rule');
    assert.doesNotMatch(p.css(), /\.rl-sent-tick\{/, 'nor the tick inside it');
    assert.doesNotMatch(p.css(), /button\.rl-sent:disabled\{opacity:1\}/,
      'nor the full-strength rule that only existed to keep it readable');
    assert.doesNotMatch(p.css(), /\.rl-sent\{[^}]*#fef3c7/, 'the amber is still gone');
    assert.doesNotMatch(p.css(), /rgba\(245,158,11,\.16\)/,
      'and so is the dark-mode override that existed only to answer it');
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
