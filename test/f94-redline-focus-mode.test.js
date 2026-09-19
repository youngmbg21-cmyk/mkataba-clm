/* ============================================================
   F94 — focus mode: the chrome steps aside, the work does not move
   ============================================================
   Focus mode stands the WHOLE page down — the shared head, the tab row, the
   strip, the banner, and the app's own sidebar and top strip — and hands that
   height to the document and the changes. It used to keep the toolbar, because
   the toolbar carried the only way out; the way out is now a chip pinned to
   the page, which is what lets the toolbar go with everything else. Three
   properties make it safe, and all rot invisibly if unpinned:

     · IT IS A CLASS FLIP, NOT A REPAINT. The banner can hold the set-once
       counterparty email form; hiding must be display:none over the same
       nodes, never removal. And because nothing rebuilds, the three scroll
       boxes keep their positions — the whole point of a reading mode.

     · THE WAY OUT NEVER HIDES. The toggle that enters the mode is inside the
       strip the mode hides — a control that hides itself cannot be pressed
       again — so the exit is a separate chip, always in the DOM, shown by the
       focus rule. Esc works beside it, and arriving at the tab from any other
       view always lands on the full screen.

     · THE BUTTON'S FACE TELLS THE TRUTH. aria-pressed and the .on class flip
       with the mode, on entry, on exit, and across a repaint. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { buildWorld } = require('./world');

const BASE = [
  'RAW MATERIAL SUPPLY AGREEMENT',
  '1. SUPPLY',
  '1. The Supplier shall supply an estimated 5000 metric tonnes per annum.',
  '2. PAYMENT TERMS',
  '2. All invoices are payable within thirty (30) days from the date of issue.',
].join('\n');

function contractFixture(over = {}){
  return { id: 'MK-246', name: 'WH — Young',
    counterparty: 'Kabras Sugar', template: 'RM', status: 'Drafting',
    folder: 'proc', fields: {}, metadata: {}, audit: [], rounds: [], versions: [],
    signatures: [], comments: [], redlineText: BASE, format: 'text', ...over };
}

/* The page rendered the way the router renders it, same stage as F84. */
async function page(opts = {}){
  const w = buildWorld({ negotiationView: true, contractView: true });
  const { win } = w;
  win.promptDialog = async () => '';
  const c = opts.contract || contractFixture();
  win.negoInit(c);
  win.state = Object.assign({}, win.state, { contracts: [c], activeId: c.id, view: 'redline' });
  win.getContract = id => (id === c.id ? c : null);
  win.rlResetFocus();                   // each test starts on the full screen
  win.renderRedline();
  const doc = win.document;
  return { w, win, c, doc,
    $: sel => doc.querySelector(sel),
    view: () => doc.getElementById('view-redline'),
    css: () => (doc.getElementById('redline-layout-css') || { textContent: '' }).textContent };
}

/* ---- ASK WHAT A RULE DOES, NOT WHETHER ITS SELECTOR IS TYPED SOMEWHERE ----
   The 19 Sep ruling leaves `.redline-page.rl-focus .rl-tabrow` in the sheet —
   it is what gives the row the page's own top padding — so a check written as
   `css.includes('.redline-page.rl-focus .rl-tabrow')` passes whether the row
   is hidden or shown. A GREEN TALLY IS NOT A NET. These read the DECLARATION:
   which selectors actually carry display:none, and what one rule declares.

   COMMENTS ARE PROSE AND ARE STRIPPED FIRST. A rule's selector capture runs
   back to the previous `}`, so an explanatory comment above it is read as part
   of the selector and the rule is never found — which is a helper that reports
   "no such rule" for a rule that is right there. */
const _noComments = css => String(css || '').replace(/\/\*[\s\S]*?\*\//g, ' ');
function hiddenSelectors(css){
  const out = [];
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let m;
  while ((m = re.exec(_noComments(css)))){
    if (!/(^|;)\s*display\s*:\s*none/.test(m[2])) continue;
    m[1].split(',').forEach(s => out.push(s.replace(/\s+/g, ' ').trim()));
  }
  return out;
}
function ruleBody(css, selector){
  const esc = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  /* Anchored on a real boundary — the end of the rule before it, or a comma
     inside a selector list — so `.rl-tabrow` cannot match the tail of some
     longer selector that merely ends with those characters. */
  const m = _noComments(css).match(new RegExp('(?:^|[},])\\s*' + esc + '\\s*\\{([^{}]*)\\}'));
  return m ? m[1].replace(/\s+/g, '') : null;
}

describe('F94 — the toggle has left the strip, and focus still works', () => {
  /* WHERE IT WENT. The focus button sat at the quiet end of the toolbar beside
     the type stepper, and both have left it (10 Aug 2026): the design's strip
     carries the acts and the two ways of looking, and neither of these is
     pressed twice in the life of a contract. The stepper is on the Document
     tab; focus mode is a row in the room head's "..." menu (#ws-focus), which
     is where the rest of the give-the-document-more-room verbs already lived.

     THE MODE ITSELF IS UNTOUCHED, and that is what the rest of this file
     tests: the class, the flag, the Escape key and the way out. */
  test('the strip carries no FOCUS button — and the stepper is back', async () => {
    /* ---- HALF THIS CLAIM REVERSED, 13 Aug 2026, OWNER-ASKED ----
       The two controls left this strip together on 10 Aug 2026 and for one
       reason: neither is pressed twice in the life of a contract. That is
       still true of focus mode, which stays in the room head's "..." menu —
       and it stopped being true of the type stepper on the day the redline
       paper's measure started following the type. The size is now the lever
       that decides how much of the column the contract fills, so it belongs on
       the page the contract is worked on. See f84, which carries the argument.

       The group they shared is still gone: the stepper rides in .rl-actions
       with the row's other controls rather than in a wrapper of its own. */
    const p = await page();
    assert.equal(p.$('.rl-head [data-rl-focus]'), null, 'no focus button on the strip');
    assert.ok(p.$('.rl-head .rl-type-step'), 'but the type stepper is here again');
    assert.equal(p.$('.rl-setwrap'), null, 'and the group they shared is still gone');
  });

  test('the head\'s menu is the way in, and it presses the same function', async () => {
    const p = await page();
    const row = p.doc.getElementById('ws-focus');
    assert.ok(row, 'focus mode is a row in the "..." menu');
    row.click();
    assert.ok(p.view().classList.contains('rl-focus'), 'and it enters focus');
    p.win.rlSetFocus(false);
  });

  test('a fresh render is NOT in focus mode', async () => {
    const p = await page();
    assert.ok(!p.view().classList.contains('rl-focus'));
    assert.equal(p.win.rlFocusOn(), false);
  });
});

describe('F94 — entering and leaving', () => {
  test('the flag and the class move together, both ways', async () => {
    const p = await page();
    p.win.rlSetFocus(true);
    assert.ok(p.view().classList.contains('rl-focus'), 'entering focus marks the page');
    assert.equal(p.win.rlFocusOn(), true);
    p.win.rlSetFocus(false);
    assert.ok(!p.view().classList.contains('rl-focus'), 'and leaving takes the mark off');
    assert.equal(p.win.rlFocusOn(), false);
  });

  test('the way out is drawn over the page, because the way in is hidden', async () => {
    const p = await page();
    p.win.rlSetFocus(true);
    const exit = p.$('[data-rl-focus-exit]');
    assert.ok(exit, 'focus mode hides the head that opened it, so it draws its own exit');
    exit.click();
    assert.equal(p.win.rlFocusOn(), false);
  });
});

describe('F94 — the stylesheet keeps the bargain', () => {
  test('focus stands the whole page down — and leaves a way out that is not the toolbar', async () => {
    /* IT USED TO NAME .rl-shell — the title card this page drew for itself.
       That card is gone; both pages share one head now, so the rule matched
       nothing and the mode hid one banner and little else.

       Named properly, and taken further on request: the shared head, the tab
       row, the round line AND the app's own sidebar and top strip stand down,
       so the three panes take the window.

       THE OLD RULE — "never hide the toolbar, it carries the way out" — was
       right about the danger and is answered differently. The toolbar DOES
       hide now, and the way out is a chip pinned to the page instead. What may
       never happen is focus mode with no exit at all, and that is what this
       asserts. */
    /* ---- HALF THIS CLAIM REVERSED IN PLACE, 19 Sep 2026, OWNER-RULED ----
       "When in negotiation page make it mimic the document page when on focus
       mode." The head card and this page's strip still stand down — that half
       is untouched and is what the room does too. The TAB ROW and the app's
       own sidebar and top strip no longer do: see the mimic describe below,
       which carries the argument. The sentence above is kept because it is the
       reasoning the reversal rests on — "taken further on request" is exactly
       how the reading controls came to be swept up with the chrome. */
    const p = await page();
    const css = p.css();
    const hidden = hiddenSelectors(css);
    assert.ok(!/\.rl-shell\{/.test(css), 'the element it used to name, and its styles, are gone');
    ['.room-head', '#rl-banner'].forEach(sel =>
      assert.ok(hidden.includes('.redline-page.rl-focus ' + sel),
        `${sel} stands down under .rl-focus`));
    assert.match(css, /\.rl-focus-exit\{position:fixed/, 'the way out is pinned to the page');
    assert.ok(p.$('[data-rl-focus-exit]'), 'and it is rendered, in or out of focus');
  });

  test('the pressed button has its dark face in the stylesheet', async () => {
    const p = await page();
    assert.ok(/\.rl-focus-btn\.on/.test(p.css()),
      'the .on face must be styled, or a pressed toggle looks identical to an idle one');
  });
});

/* ============================================================
   F94-M — FOCUS MODE MIMICS THE DOCUMENT PAGE (Young ruled 19 Sep 2026)
   ============================================================
   "When in negotiation page make it mimic the document page when on focus
   mode." Ruled over a render of the two side by side, after two earlier
   readings were put and withdrawn.

   MEASURED AT THE PARENT in a real browser, entering focus on this page: top
   bar 44 -> 0, side rail 240 -> 0, head card 146 -> 0 AND the control row
   44 -> 0. On the Document tab the same press leaves the bar at 44, the rail
   at 240 and the tab row at 39, and drops only the head card. One button,
   two meanings.

   So the rule is the room's: the HEAD CARD goes, this page's own strip goes
   with it (the room hides #ws-strips in the same breath), the CONTROL ROW
   stays, the SHELL is left alone. The row is what carries As agreed, With
   changes, the Deal board, the text size, the Internal/Counterparty seat and
   All negotiations — every one of them unreachable from inside the mode a
   reader entered in order to read.

   The cost is stated rather than hidden: focus used to hand the paper the
   whole window, and the six questions' third refusal refuses taking that
   back. The owner ruled it twice and approved the render.

   THE COUNTERPARTY'S SEAT IS NOT IN THIS RULING and its walls are asserted
   below: their page mounts the same .redline-page and takes .rl-focus with
   it, so anything written unscoped here is a change to a seat nobody asked
   about. */
describe('F94-M — the control row survives, the shell survives, the head card does not', () => {
  test('the control row is NOT hidden by focus — and the head card still is', async () => {
    const p = await page();
    const hidden = hiddenSelectors(p.css());
    assert.ok(hidden.includes('.redline-page.rl-focus .room-head'),
      'the head card still stands down — that half of the old rule is untouched');
    assert.ok(!hidden.includes('.redline-page.rl-focus .rl-tabrow'),
      'the control row does NOT: it carries the readings, the seat and the way out to the list');
    assert.ok(!hidden.includes('.redline-page.rl-focus .rl-head'),
      'nor its right-hand half, which is where the seat switch and the stepper live');
  });

  test('the shell is left alone — no rule hides the sidebar or the top strip', async () => {
    const p = await page();
    const css = p.css();
    assert.ok(!/body\.rl-focused #side-nav/.test(css), 'the sidebar stays');
    assert.ok(!/body\.rl-focused #top-header/.test(css), 'and so does the dark bar');
    assert.ok(!/body\.rl-focused #app-shell\{/.test(css),
      'and the zero-width first track goes with them — nothing hides the sidebar to leave a void');
  });

  test('the row keeps the page\'s own gap above it, and states the height that gap costs', async () => {
    /* MEASURED on the real Document tab in focus: its band is 56px — the
       room's --page-pad-t plus the 40px tab row — so the white starts under
       the dark bar and the row sits one page-padding down inside it. This
       page carries that padding INSIDE #ws-head, so hiding the head takes the
       gap with it unless the row is given it back.

       AND THE HEIGHT HAS TO BE RESTATED WITH IT. Everything here is
       border-box: padding-top alone comes out of the row's own 44 and
       squashes every control the row aligns to its full height. Both halves
       read the same two tokens so they cannot drift — PIN THE RELATION. */
    const p = await page();
    const body = ruleBody(p.css(), '.redline-page.rl-focus .rl-tabrow');
    assert.ok(body, 'the focus rule for the row exists');
    assert.match(body, /padding-top:var\(--page-pad-t\)/, 'the gap is the page\'s own token');
    assert.match(body, /height:calc\(var\(--rl-tabrow-h\)\+var\(--page-pad-t\)\)/,
      'and the height is the row\'s own token plus that same gap, never a second literal');
  });

  test('the row\'s height is declared ONCE, as a token both rules read', async () => {
    const p = await page();
    const css = p.css();
    assert.match(css, /--rl-tabrow-h:44px/, 'declared on the page');
    const row = ruleBody(css, '.redline-page .rl-tabrow');
    assert.ok(row, 'the row rule exists');
    assert.match(row, /height:var\(--rl-tabrow-h\)/,
      'and the row reads the token rather than carrying the number a second time');
  });

  test('the row is WHITE, so it reads as the band the Document tab draws', async () => {
    /* The owner sent this back once: the first render put the surviving row on
       the grey page ground, and the real page does not. It was already right
       in the product; this pins it so the mimic cannot be undone by tidying. */
    const p = await page();
    const row = ruleBody(p.css(), '.redline-page .rl-tabrow');
    assert.match(row, /background:var\(--color-surface\)/,
      'the row paints its own surface — grey behind it is the fault that was reported');
  });

  test('THE COUNTERPARTY\'S SEAT IS THE WALL: the tight padding is scoped to their page', async () => {
    /* Their seat mounts this same .redline-page and takes .rl-focus with it,
       and their shell really does stand down (body.pw-focused hides their
       header). So the padding that is right there is wrong here, and an
       unscoped rule would have changed a page nobody asked about. */
    const p = await page();
    const css = p.css();
    assert.ok(/body\.pw-focused \.redline-page\.rl-focus\{padding:/.test(css),
      'their page keeps the tight focus padding');
    assert.ok(!/(^|\})\s*\.redline-page\.rl-focus\{padding:/.test(css),
      'and ours does not take it unscoped — the shell stays, so the page keeps its own margins');
    assert.ok(/body\.pw-focused \.redline-page\.rl-focus #rl-banner\{display:block\}/.test(css),
      'and their wall line is still the exception it has always been');
  });

  test('the list is never left in focus — the one funnel resets it', async () => {
    /* NEW THE DAY THE ROW SURVIVED. "All negotiations" is ON that row, so a
       reader in focus can now press it; it paints the list into this page's
       own host and never goes through setView, which is where app.js resets
       the mode. Without this the table would be drawn with a head stood down
       and an Exit focus chip floating over it. */
    const p = await page();
    p.win.rlSetFocus(true);
    assert.equal(p.win.rlFocusOn(), true, 'staged: the bench really is in focus');
    p.win.renderNegotiationsList(p.doc.getElementById('content'));
    assert.equal(p.win.rlFocusOn(), false, 'painting the list takes the mode off');
    assert.equal(p.doc.body.classList.contains('rl-focused'), false,
      'and the body marker goes with it');
  });
});
