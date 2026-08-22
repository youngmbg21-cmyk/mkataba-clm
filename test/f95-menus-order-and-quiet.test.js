/* ============================================================
   F95 — the symbols, the order of the work, and the quiet
   ============================================================
   Four changes from the owner's second review, and the rules underneath them.

   A MENU NEEDS SOMETHING TO AIM AT. Nine verbs at one weight in one colour is
   a grey block: the only way to find the row you want is to read all nine.
   Each row carries a symbol now and the symbol carries the accent, so the eye
   lands before the reader has to parse a word. The label stays black — colour
   on nine labels is nine shouts — and the destructive rows keep their red on
   BOTH mark and label, because that is the one distinction a menu must never
   blur, hover included.

   THE ORDER ON SCREEN IS THE ORDER OF THE WORK. Checks sat above the contract
   form, which put the reviewing before the writing: three Run buttons offering
   to review a document that read "0 of 26 required filled". Nothing they could
   have returned would have been true.

   AND A CONFIRMATION THAT REPEATS THE SCREEN IS NOISE. "#CHG-011 accepted"
   floated over a page where the clause had just turned green and the count had
   just gone down — three statements of one fact, one of them covering the
   document while it said so. Green goes. Red stays exactly as it was: a
   failure is the one case where the screen cannot show you the outcome.

   ONE OF THESE IS GUARDED AGAINST THE WAY IT WAS ALREADY BROKEN. The Focus
   mode row relabels itself on every render, and it did that with textContent —
   which deletes the icon and the hint, because they are child elements. The
   markup it is BUILT from was always right, so only a rendered page could show
   it. That test renders the page.
*/
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const vm = require('node:vm');
const { buildWorld } = require('./world');
const F = require('./clausefixtures.js');

const ROOT = path.join(__dirname, '..');
const src = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

function contract(over = {}){
  return { id: 'MK-950', name: 'Raw Material Supply — Coast',
    counterparty: 'Naivas Supermarkets', template: 'RM', status: 'Under Review',
    folder: 'proc', value: 78000000, valueType: 'standard', fields: {}, metadata: {},
    audit: [], rounds: [], versions: [], signatures: [], comments: [],
    compliance: { consent: false },
    redlineText: F.protoRich(), format: 'rich', ...over };
}
/* The room head, on a stage that has the workspace shell around it. */
function head(c, opts){
  const { win } = buildWorld({ contractView: true, negotiationView: true });
  /* The stage boots the negotiation modules, not the money half of the shell.
     wsNextAction reads it to decide the head's primary. Shell stubs only. */
  win.isMonetary = x => (x.valueType || 'estimated') !== 'none';
  win.fmtMoney = v => 'KES ' + Number(v || 0).toLocaleString('en-KE');
  win.state = Object.assign({}, win.state, { contracts: [c], activeId: c.id, view: 'workspace' });
  win.getContract = id => (id === c.id ? c : null);
  return { win, html: win.roomHeadHtml(c, opts) };
}
/* The template form a library contract carries. */
function form(filled = {}){
  return { templateName: 'Kwetu - V2', versionNumber: 1, values: { ...filled },
    fields: [
      { fieldKey: 'biz', label: 'Registered Business Name', required: true, section: 'COMPANY INFORMATION' },
      { fieldKey: 'kra', label: 'KRA Pin', required: true, section: 'COMPANY INFORMATION' },
      { fieldKey: 'tel', label: 'Company Telephone Number(s)', required: true, section: 'COMPANY INFORMATION' },
      { fieldKey: 'note', label: 'Anything else', required: false, section: 'COMPANY INFORMATION' },
    ] };
}

describe('F95 — Draft new agreement is the filled green button', () => {
  test('it carries the primary fill, not an outline', () => {
    /* ---- CLAIM REVERSED IN PLACE 22 Aug 2026 ----
       It pinned the solid fill the owner asked for on 09 Aug. The owner has
       since asked for the design mock-up's button theme across the platform,
       and that theme spends exactly ONE fill per page — the head gives it to
       the contract's own next act, so Draft new agreement is a plain verb
       beside it. The row still leads with it; it is no longer shouting.
       What has NOT changed, and is what this test was really protecting: the
       button is still in the head on every tab, and the shell's delegated
       handler still finds it by data-page-new. */
    const btn = head(contract()).html.match(/<button[^>]*id="ws-new"[^>]*>/)[0];
    assert.match(btn, /ui-btn-plain/, 'a plain verb — the page spends its one fill elsewhere');
    assert.doesNotMatch(btn, /ui-btn-primary/, 'never a second filled act on one page');
    assert.match(btn, /data-page-new/, 'and the shell’s delegated handler still finds it');
  });

  test('the workbench does not offer it mid-round', () => {
    assert.doesNotMatch(head(contract(), { primary: false }).html, /id="ws-new"/,
      'Negotiate is a working surface — starting a different agreement there is noise');
  });
});

describe('F95 — every menu row has a symbol, and the symbols are solid dark green', () => {
  const css = src('index.html');
  /* Every declaration block whose selector list contains this exact selector.
     Read this way rather than by matching one long literal: the two menus share
     a rule, and a test that pinned the grouping would break the next time the
     selectors were tidied without the colours changing at all. */
  const bare = css.replace(/\/\*[\s\S]*?\*\//g, ' ');   // comments hold no rules
  const rulesFor = sel => [...bare.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .filter(m => m[1].split(',').some(s => s.trim().replace(/\s+/g, ' ') === sel))
    .map(m => m[2]);
  const decl = (sel, prop) => rulesFor(sel).map(b =>
    (b.match(new RegExp(prop + ':\\s*([^;]+)')) || [])[1]).filter(Boolean).pop();

  test('the room menu paints its icons dark green', () => {
    assert.equal(decl('.room-menu button svg', 'color'), 'var(--color-accent-800)');
    assert.equal(decl('.room-menu button:hover svg', 'color'), 'var(--color-accent-800)',
      'and hovering does not wash it out');
  });

  test('and fills them in, rather than leaving hairline outlines', () => {
    assert.equal(decl('.room-menu button svg', 'fill'), 'currentColor');
    assert.equal(decl('.reg-act svg', 'fill'), 'currentColor');
  });

  test('the register row menu is the same rule', () => {
    assert.equal(decl('.reg-act svg', 'color'), 'var(--color-accent-800)');
  });

  test('the destructive rows are red, hover included', () => {
    for (const sel of ['.room-menu .danger svg', '.room-menu .danger:hover svg', '.reg-act.danger svg'])
      assert.equal(decl(sel, 'color'), 'var(--st-ruby-fg)',
        `${sel} — hover must never turn Delete into a row that looks safe`);
  });

  test('the dark theme lifts them off the ground instead of sinking them', () => {
    assert.equal(decl('html.dark .room-menu button svg', 'color'), 'var(--color-accent-300)',
      'accent-800 is a near-black green on dark paper');
    assert.equal(decl('html.dark .reg-act svg', 'color'), 'var(--color-accent-300)');
  });

  test('every verb in the register menu names an icon', () => {
    /* Read from the source: the register page needs the whole application shell
       around it to render, and what is being asserted is that no row was added
       later without a mark. */
    const reg = src('js/views/register.js');
    const block = reg.slice(reg.indexOf('const REG_ROW_ACTIONS=['));
    const rows = block.slice(0, block.indexOf('];')).split('\n').filter(l => /\{k:/.test(l));
    assert.ok(rows.length >= 5, 'the menu still holds every verb it held');
    for (const r of rows) assert.match(r, /ic:'[a-zA-Z]+'/, `no symbol on: ${r.trim()}`);
    assert.match(reg, /class="reg-act\$\{a\.ruby\?' danger':''\}/,
      'and the destructive rows are marked so the red rule can find them');
  });

  test('every row of the room menu renders one', () => {
    const html = head(contract({ status: 'Draft' })).html;
    /* BOUNDED AT THE MENU'S OWN END (22 Aug 2026). This ran to the end of the
       head, which was harmless while the menu was the last thing in it — then
       the fact row moved below the acts and its Collapse button, which is a
       control and carries no symbol, fell inside the slice and failed a claim
       about menu rows. A slice that grows when the page grows is a test about
       whatever happens to follow it. */
    const menu = html.slice(html.indexOf('id="ws-more-menu"'), html.indexOf('room-facts'));
    const rows = menu.split('<button').slice(1);
    assert.ok(rows.length >= 6, 'the whole menu is being read');
    for (const r of rows){
      /* `[null, '(unnamed)']` rather than `[, '(unnamed)']`: the hole in the
         middle of an array literal is legal and meant here, but it is also
         exactly what a stray comma looks like, so it is written out. */
      const id = (r.match(/id="([^"]+)"/) || [null, '(unnamed)'])[1];
      assert.match(r.slice(0, r.indexOf('</button>')), /<svg/, `${id} has no symbol`);
    }
  });

  /* THE ONE THAT WAS ACTUALLY BROKEN, and only a rendered page could say so. */
  test('Focus mode keeps its symbol after it relabels itself', () => {
    const c = contract();
    const h = head(c);
    h.win.document.body.innerHTML = h.html;
    h.win.applyWsFocus();
    const b = h.win.document.getElementById('ws-focus');
    assert.ok(b.querySelector('svg'), 'the icon survived the relabel');
    assert.ok(b.querySelector('.mnote'), 'and so did the hint');
    assert.match(b.textContent, /Focus mode/);
  });
});

describe('F95 — the contract is filled in before it is checked', () => {
  test('the form comes before Checks in the column', () => {
    /* The page template is one string in one file; the order in it IS the order
       on screen, and it is the thing that regressed. */
    const page = src('js/views/contract.js');
    const doc = page.slice(page.indexOf('id="doc-right"'));
    assert.ok(doc.indexOf('id="tplform-section"') < doc.indexOf('id="checks-card"'),
      'reviewing a document that has not been written yet is not a check');
  });

  test('Checks says how many fields are still empty', () => {
    const { win } = buildWorld({ contractView: true, negotiationView: true });
    const c = contract({ templateForm: form() });
    assert.equal(win.tplFormOpenCount(c), 3, 'the optional field is not counted');
    assert.match(win.checksNoteHtml(c), /Fill the contract form above first/);
    assert.match(win.checksNoteHtml(c), /3 required fields still empty/);
  });

  test('and stops saying it the moment the last one is filled', () => {
    const { win } = buildWorld({ contractView: true, negotiationView: true });
    const c = contract({ templateForm: form({ biz: 'Highland Ltd', kra: 'A1', tel: '+254' }) });
    assert.equal(win.tplFormOpenCount(c), 0);
    assert.match(win.checksNoteHtml(c), /Run before sending/);
  });

  test('one left is one field, not one fields', () => {
    const { win } = buildWorld({ contractView: true, negotiationView: true });
    const c = contract({ templateForm: form({ biz: 'Highland Ltd', kra: 'A1' }) });
    assert.match(win.checksNoteHtml(c), /1 required field still empty/);
  });

  test('a contract with no form says nothing about one', () => {
    const { win } = buildWorld({ contractView: true, negotiationView: true });
    assert.equal(win.tplFormOpenCount(contract()), 0,
      'the common case — a plain template, or an upload that arrived complete');
    assert.match(win.checksNoteHtml(contract()), /Run before sending/);
  });

  test('typing in the form repaints the Checks line', () => {
    /* The count changes under the reader's hands, so the notice cannot be
       written once at build time and left there. */
    const lib = src('js/views/templatelib.js');
    const commit = lib.slice(lib.indexOf('function tplFormCommit'));
    assert.match(commit.slice(0, commit.indexOf('\n}')), /renderChecksCard\(c\)/);
    const page = src('js/views/contract.js');
    const render = page.slice(page.indexOf('function renderChecksCard'));
    assert.match(render.slice(0, render.indexOf('\n}')), /data-checks-note/);
  });
});

describe('F95 — the round’s queue slides over the page', () => {
  /* THE QUEUE STOPPED BEING A COLUMN (owner-asked, 12 Aug 2026). It was the
     first of three grid tracks and its chevron only narrowed it to a 34px rail
     that still held one; the width it took came off the CONTRACT, which is the
     thing being judged. It is an overlay now, on the Activity panel's own
     mechanism, and this block asserts the properties rather than the pixels:
     the panel occupies no layout track, the door that opens it carries the
     score the rail used to carry, and opening it repaints nothing. The claims
     about PIXELS — that the contract's width does not move — live in a browser
     file, because jsdom resolves no class rules at all. */
  function bench(side = 'owner'){
    const { win } = buildWorld({ negotiationView: true, contractView: true });
    const store = new Map();
    win.lsGet = k => (store.has(k) ? store.get(k) : null);
    win.lsSet = (k, v) => store.set(k, v);
    const c = contract();
    win.negoInit(c);
    /* One ask on the table, so the queue has a row to be a door. */
    const cl = (win.negoClauseList(c) || [])[0] || {};
    c.changes.push({ id: 'CHG-950', status: 'pending', authorSide: 'counterparty',
      clauseId: cl.clauseId || 'c1', clauseLabel: cl.label || '1. Supply',
      kind: 'edit', author: 'Them', seq: 1 });
    win.negoResetView();
    win.rlSetQueueOpen(false);
    const host = win.document.createElement('div');
    host.id = 'bench';
    win.document.body.appendChild(host);
    win.redlineEmbed(host, c, { side, by: 'Amina Otieno', persist: false,
      selMenu(){}, noAi: true, rerender(){} });
    return { win, c, host,
      grid: () => host.querySelector('#rl-grid'),
      queue: () => host.querySelector('#rl-queue'),
      scrim: () => host.querySelector('#rl-q-scrim'),
      tab: () => host.querySelector('#rl-q-tab'),
      close: () => host.querySelector('#rl-q-min'),
      press: el => el.dispatchEvent(new win.Event('click', { bubbles: true })) };
  }

  test('IT OCCUPIES NO LAYOUT TRACK', () => {
    /* The one claim the whole change is about. The grid asked for three columns
       through .has-queue and gave the queue a width in --rl-queue-w; both are
       gone, and so is the resizer term that subtracted them. */
    const b = bench();
    assert.ok(b.grid(), 'the grid is there');
    assert.ok(!b.grid().classList.contains('has-queue'),
      'the grid no longer reserves a track for the queue');
    const nego = (src('js/views/negotiation.js') + src('js/views/negotiation-css.js'));
    assert.ok(!/--rl-queue-w:/.test(nego), 'and nothing declares a width for that track');
    assert.ok(!/_rlQueueW/.test(nego), 'nor does the resizer subtract one');
    /* Re-derived rather than patched: ONE description of the geometry, asked
       for by the layout and by the drag alike — the mismatch between those two
       is what made the handle fall behind the cursor. */
    assert.match(nego, /const _rlAvail = grid => grid\.clientWidth - RL_GAP;/);
    const wire = nego.slice(nego.indexOf('function rlWireResizer'));
    assert.match(wire.slice(0, 2000), /_rlAvail\(grid\)/);
  });

  test('it arrives SHUT, over a scrim, with a door that says what is behind it', () => {
    const b = bench();
    assert.ok(b.queue(), 'the panel is mounted');
    assert.ok(!b.queue().classList.contains('is-open'),
      'an overlay that opened itself would be the complaint this change answers');
    assert.equal(b.queue().getAttribute('aria-hidden'), 'true');
    assert.ok(b.scrim(), 'and it has the Activity panel\'s scrim, not a second mechanism');
    assert.ok(!b.scrim().classList.contains('is-open'));
    const tab = b.tab();
    assert.ok(tab, 'the way back in is on screen');
    assert.equal(tab.getAttribute('aria-expanded'), 'false');
    assert.equal(tab.getAttribute('aria-controls'), 'rl-queue');
  });

  test('THE SCORE SURVIVES THE CLOSE — the door carries it', () => {
    /* The folded rail\'s justification was that "2 of 7" stayed legible at 34px,
       so reopening was never a guess. An overlay that simply shut would have
       taken that away. */
    const b = bench();
    const n = b.tab().querySelector('.rl-q-tab-n');
    assert.ok(n, 'the door reads out the round');
    assert.match(n.textContent.replace(/\s+/g, ''), /^\d+\/\d+$/);
    /* One source: the panel\'s own foot says the same two numbers. */
    const foot = b.host.querySelector('.rl-q-foot b').textContent.replace(/\s+/g, '');
    assert.equal(foot, n.textContent.replace(/\s+/g, '').replace('/', 'of'));
  });

  test('pressing the door opens it; the close, the scrim and Escape shut it', () => {
    const b = bench();
    b.press(b.tab());
    assert.ok(b.queue().classList.contains('is-open'));
    assert.ok(b.scrim().classList.contains('is-open'));
    assert.equal(b.win.rlQueueOpen(), true);
    b.press(b.close());
    assert.ok(!b.queue().classList.contains('is-open'), 'the close shuts it');
    b.press(b.tab());
    b.press(b.scrim());
    assert.ok(!b.queue().classList.contains('is-open'), 'so does the scrim');
    b.press(b.tab());
    b.win.document.dispatchEvent(new b.win.KeyboardEvent('keydown', { key: 'Escape' }));
    assert.ok(!b.queue().classList.contains('is-open'), 'and so does Escape');
  });

  test('OPENING IT REPAINTS NOTHING', () => {
    /* The property the fold already had and the one worth keeping: rebuilding
       the workbench to show one panel throws away the reader\'s place in the
       contract, which is the one thing they were holding on to. */
    const b = bench();
    const doc = b.host.querySelector('#rl-doc');
    b.press(b.tab());
    assert.equal(b.host.querySelector('#rl-doc'), doc, 'the same node, not a rebuilt one');
    const src2 = (src('js/views/negotiation.js') + src('js/views/negotiation-css.js'));
    const fn = src2.slice(src2.indexOf('function rlSetQueueShown'));
    const body = fn.slice(0, fn.indexOf('\n}'));
    assert.ok(!/again\(\)|renderRedline|redlineEmbed/.test(body), 'no repaint in the flip');
    /* And the resizer is NOT re-run: the split behind it has not moved. */
    assert.ok(!/rlLayoutResizer/.test(body));
  });

  test('A QUEUE ROW CLOSES IT — a door must not open onto a wall', () => {
    /* Pressing a row jumps the contract to that clause. With the panel standing
       over the contract, that lands the reader on a passage they cannot see. */
    const b = bench();
    b.press(b.tab());
    const row = b.host.querySelector('[data-rl-queue]');
    assert.ok(row, 'there is a row to press');
    b.press(row);
    assert.equal(b.win.rlQueueOpen(), false);
  });

  test('THE COUNTERPARTY GETS THE OVERLAY TOO', () => {
    /* One builder draws the owner\'s bench, the contract tab\'s embed and their
       page — and the complaint (the queue eating the contract\'s width) is the
       same on their screen. The door is built inside the panes rather than on
       the workbench toolbar precisely so it reaches a page that has no toolbar. */
    const b = bench('counterparty');
    assert.ok(b.queue());
    assert.ok(b.tab(), 'their page gets the door as well');
    assert.ok(b.scrim());
  });

  test('THE DOOR IS ON THE PAGE\'S BORDER WALL, NOT THE WINDOW\'S EDGE', () => {
    /* THE CLAIM THIS REWRITES (12 Aug 2026). Both the panel and its door were
       `position:fixed` — pinned to the WINDOW, which on this page is behind the
       sidebar and the shell's gutter and is not the page's edge at all. They
       are `absolute` now, so the nearest positioned ancestor (.rl-grid, which
       the resizer already made position:relative) puts them against the working
       area's own left border — on the bench, on the contract tab's embed and on
       the counterparty's page, each against ITS OWN wall.

       AND THE DOOR IS A TAB, TURNED ON ITS SIDE: a horizontal pill on the wall
       has to eat into the contract to carry its caption; a vertical one costs
       the page its own thickness and nothing else. The measurement lives in the
       browser file — jsdom resolves no class rules — so what is pinned here is
       the RULE, and that nothing re-pins either of them to the viewport. */
    const nego = (src('js/views/negotiation.js') + src('js/views/negotiation-css.js'));
    const panel = (nego.match(/\.redline-page \.rl-queue\{[\s\S]*?\n  \}/) || [''])[0];
    assert.match(panel, /position:absolute;left:0;top:0;bottom:0/,
      'the panel hangs off the page, not off the window');
    assert.match(panel, /visibility:hidden/,
      'and is hidden while shut — parked off the PAGE it would sit over the sidebar');
    const tab = (nego.match(/\.redline-page \.rl-q-tab\{[\s\S]*?\n  \}/) || [''])[0];
    assert.match(tab, /position:absolute;left:0;top:50%/, 'so does the door');
    assert.match(tab, /writing-mode:vertical-rl/, 'and it reads down the wall');
    assert.ok(!/\.redline-page \.rl-q-tab\{[^}]*position:fixed/.test(nego)
      && !/\.redline-page \.rl-queue\{[^}]*position:fixed/.test(nego),
      'nothing pins either of them back to the viewport');
  });

  test('AND FOCUS MODE KEEPS IT', () => {
    /* THE OTHER HALF OF THE SAME CLAIM, and it was a rule rather than an
       oversight: `.redline-page.rl-focus .rl-q-tab{display:none}` stood down
       the door in focus mode, which was defensible while it was window
       furniture. It is the page's own wall now, and focus mode is where a
       reader works THROUGH the round — the one place the reading order matters
       most — so hiding it there left the queue unreachable. */
    const nego = (src('js/views/negotiation.js') + src('js/views/negotiation-css.js'));
    assert.ok(!/\.rl-focus \.rl-q-tab\{display:none\}/.test(nego),
      'focus mode no longer hides the way into the queue');
    /* The notices stack IS still stood down in focus mode — that rule is a
       different decision and this one must not have taken it with it. */
    assert.match(nego, /\.redline-page\.rl-focus \.rl-notices\{display:none\}/);
  });

  test('THE PHONE GETS NO DESKTOP OVERLAY', () => {
    const nego = (src('js/views/negotiation.js') + src('js/views/negotiation-css.js'));
    const narrow = nego.slice(nego.lastIndexOf('@media (max-width:1023px)'));
    const block = narrow.slice(0, narrow.indexOf('\n  }'));
    assert.match(block, /\.rl-queue\{position:static!important/,
      'the queue goes back into the flow');
    assert.match(block, /\.rl-q-scrim,[\s\S]*\.rl-q-tab,[\s\S]*\.rl-q-min\{display:none!important\}/,
      'and the scrim, the door and the close have nothing to do there');
  });
});

describe('F95 — focus mode leaves no dead band at the foot', () => {
  test('entering focus re-measures the view height', () => {
    /* The band was never a padding value to halve: --view-h is the scroll
       container measured once, while the top strip was still on screen. */
    const nego = (src('js/views/negotiation.js') + src('js/views/negotiation-css.js'));
    const fn = nego.slice(nego.indexOf('function rlSetFocus('));
    const body = fn.slice(0, fn.indexOf('\n}'));
    assert.match(body, /syncViewHeight/, 'the stale measurement is retaken');
    assert.match(body, /requestAnimationFrame/,
      'after a frame — clientHeight means nothing until the new shell has laid out');
  });

  test('it is retaken on the way out too', () => {
    const { win } = buildWorld({ negotiationView: true });
    let calls = 0;
    win.syncViewHeight = () => { calls++; };
    win.requestAnimationFrame = fn => fn();
    win.rlSetFocus(true);
    win.rlSetFocus(false);
    assert.equal(calls, 2, 'leaving focus brings the strip back — same stale number, other way');
    win.rlResetFocus();
  });
});

describe('F95 — the negotiate objects are one set of objects', () => {
  const nego = (src('js/views/negotiation.js') + src('js/views/negotiation-css.js'));

  /* THIS BLOCK USED TO SAY "SQUARE". The workbench had been given a 0-3px
     radius everywhere, on the argument that a negotiation surface is a working
     surface rather than a gallery of cards. The 10 Aug 2026 design reverses
     it: the queue, the sheet and the change cards are 12-14px with a hairline
     lift, and the Document tab's rail cards match them, so switching tabs
     moves the work and not the furniture.

     WHAT SURVIVES UNCHANGED is the rule underneath both: ONE radius, used by
     everything on the page. A page where the paper is 14px, the cards are 6px
     and the queue is 2px is the drift this test exists to catch, whichever
     number is current. */
  test('the queue, the sheet and the change cards share one radius', () => {
    /* CLAIMS REVERSED IN PLACE, 20 Aug 2026 (owner-asked — the square-corner
       sweep): the ONE number is now 0, product-wide. What this test exists to
       catch — a page where the paper, the cards and the queue each round to a
       different number — survives with the family collapsed to a single
       value: square everywhere, and true circles (50%) untouched. */
    const radius = sel => {
      const rule = nego.slice(nego.indexOf(sel + '{'));
      const block = rule.slice(0, rule.indexOf('}'));
      return ((block.match(/border-radius:\s*([^;}]+)/) || [])[1] || '').trim();
    };
    assert.equal(radius('.redline-page .rl-col'), '0',
      'the column surface is square with the sweep');
    assert.equal(radius('.redline-page .rl-doc'), '0',
      'the doc column clips square — a radius here rounds the sheet\'s corners');
    assert.equal(radius('.redline-page .rl-paper'), '0',
      'the paper is square: a contract page prints square');
    assert.equal(radius('.redline-page .rl-col.rl-cp'), '0',
      'and the clause panel is square with it, winning on specificity');
    assert.equal(radius('.redline-page .rl-card'), '0',
      'a card inside the column shares the one shape, never a different family');
  });

  test('the Document tab\'s own cards were brought with them', () => {
    /* Source-level, like the rest of this file's cross-file claims: the
       workspace screen is too heavy to boot here and what is pinned is one
       line of source. */
    const ct = src('js/views/contract.js');
    assert.match(ct, /const CARD='background:var\(--color-surface\)[^']*border-radius:0'/,
      'the Doc page rail is the same card as the Negotiate column');
  });

  test('but the buttons and pills keep their own shape', () => {
    /* REVERSED 20 Aug 2026 with the sweep: the small round things are square
       now too — the tokens exist so they move together, and they moved. */
    assert.match(nego, /--n-r-sm:0/, 'the small controls follow the sweep through their token');
    const verbs = nego.slice(nego.indexOf('.redline-page .rl-card-verbs button{'));
    assert.match(verbs.slice(0, verbs.indexOf('}')), /border-radius:0/,
      'the verbs are square rectangles now, not pills and not soft');
    /* ---- CLAIM REVERSED, 12 Aug 2026, OWNER-ASKED ----
       This used to read "and a status pill is still a pill", asserting
       border-radius:999px. The owner asked for the status corner to stop
       being a capsule and become the coloured WORD — the card's head already
       carried an id, a round tag and a button, and the pill made the one
       thing worth reading the smallest type on the card. The claim is turned
       round rather than deleted: the shape is now deliberately NOT a pill,
       and the word carries the tone colour instead. */
    const badge = nego.slice(nego.indexOf('.redline-page .rl-badge{'));
    const badgeRule = badge.slice(0, badge.indexOf('}'));
    assert.doesNotMatch(badgeRule, /border-radius:999px/,
      'the status is a word now, not a pill');
    assert.match(badgeRule, /border:0/, 'no border');
    assert.match(badgeRule, /background:none/, 'and no fill');
    assert.match(nego, /\.rl-badge-no\{color:var\(--st-ruby-fg\)\}/,
      'the tone class survives and carries the colour on the word');
  });
});

describe('F95 — green confirmations are gone, red warnings are not', () => {
  /* The real toast(), from js/core.js, into a real DOM. The scenario world
     stubs toast as a recorder — correctly, it is testing what the product
     SAYS — so the function itself is exercised on its own small stage. */
  function stage(){
    const dom = new JSDOM('<!doctype html><body><div id="toast-root"></div></body>');
    const win = dom.window;
    win.icon = () => '<svg></svg>';
    win.esc = x => String(x == null ? '' : x);
    /* LIFTED BETWEEN LANDMARKS, not by a signature. toast gained a kinds table
       above it and a third argument on 15 Aug 2026, and slicing on the exact
       parameter list silently produced a broken window instead of a failing
       test. The two landmarks are asserted so a move fails loudly. */
    const core = src('js/core.js');
    const from = core.indexOf('const TOAST_KINDS');
    const to = core.indexOf('/* SHA-256, with an honest failure mode.');
    assert.ok(from > 0 && to > from, 'the toast block is still where this stage reads it');
    vm.runInContext(core.slice(from, to), vm.createContext(win));
    return { win, root: win.document.getElementById('toast-root'),
      boxes: () => win.document.getElementById('toast-root').children.length };
  }

  /* ---- THE SILENCE THIS BLOCK BOUGHT IS KEPT, AND IT IS NOW OPT-IN ----
     (15 Aug 2026, OI-10.) F95's decision was right and stands: an ordinary
     confirmation the screen has already made three times is noise. What was
     wrong was that there was no way to opt IN — a message that genuinely had to
     be read could only be made visible by calling it an error, which is exactly
     what the publish path did, and the owner reported it as a red alert over a
     successful send.

     So a BARE call is still silent, which is every one of the ~250 this block
     was written about; naming a kind is how a caller asks to be seen. */
  test('a bare toast still draws nothing at all', () => {
    const s = stage();
    s.win.toast('#CHG-011 accepted — merged into the clean text');
    assert.equal(s.boxes(), 0, 'the screen already said this three ways');
  });

  test('but a caller can now ask to be seen without lying about it', () => {
    const s = stage();
    s.win.toast('Round 2 published to Juno Limited.', 'ok');
    assert.equal(s.boxes(), 1, 'a deliberate confirmation draws');
    assert.equal(s.root.firstChild.dataset.toastKind, 'ok',
      'and it is not wearing the refusal colour to get there');
  });

  test('an error toast draws exactly as it always did', () => {
    const s = stage();
    s.win.toast('Could not read the document', 'err');
    assert.equal(s.boxes(), 1);
    assert.match(s.root.textContent, /Could not read the document/);
  });

  test('the callers are untouched — nothing has to know the rule', () => {
    const s = stage();
    for (let i = 0; i < 10; i++) s.win.toast('saved ' + i);
    s.win.toast('save failed', 'err');
    assert.equal(s.boxes(), 1, 'the silencing lives in one place, not in every call site');
  });

  test('and an unknown kind is still a refusal, so nothing existing got quieter', () => {
    const s = stage();
    s.win.toast('Something odd', 'sideways');
    assert.equal(s.boxes(), 1);
    assert.equal(s.root.firstChild.dataset.toastKind, 'err');
  });
});
