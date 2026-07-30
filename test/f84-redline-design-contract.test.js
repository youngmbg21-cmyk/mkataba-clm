/* ============================================================
   F84 — the Redline Workbench keeps the master design's contract
   ============================================================
   The Redline tab is a port of a design mockup (HaTi Platform.html), and a
   port has two ways to rot. The obvious one is visual: somebody nudges a
   column and the 6/3/3 grid quietly becomes 1.9fr/.85fr/.9fr again, which
   looks close enough in a screenshot and is measurably not the design. The
   less obvious one is structural: the design names its parts — #view-redline,
   #rl-doc, #rl-changes, #rl-threads, #rl-banner — and those names are the
   handle everything else reaches for. Rename one to suit a refactor and the
   page still renders, so nothing fails, until whatever was holding that handle
   needs it.

   So this file pins the CONTRACT rather than the appearance:

     · the ids exist, on the right elements, in the right nesting;
     · the engine's own hooks are still there beside them — this port ADDS the
       design's names, it does not rename the wiring out from under
       wireNegotiationTab, the counterparty portal or the room;
     · the grid is twelve real columns at 6/3/3, folding to 8/4;
     · the header's three actions press the engine's controls rather than
       lookalikes, and disable themselves when the engine has nothing to press;
     · the clause toolbar files against the CONTRACT, not the Doc Lab sandbox.

   The last one is the one worth having. AI Assist / Add Note/Tag / Direct Edit
   exist in js/views/doclab.js too, look identical, and write to hati.lab.v1 —
   a store that by design cannot reach a contract. Wired onto this page they
   would appear to work and file nothing. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { buildWorld } = require('./world');

const BASE = [
  'RAW MATERIAL SUPPLY AGREEMENT',
  '1. SUPPLY',
  '1. The Supplier shall supply an estimated 5000 metric tonnes per annum.',
  '2. PAYMENT TERMS',
  '2. All invoices are payable within thirty (30) days from the date of issue.',
  '3. TERMINATION',
  '3. Either party may terminate by giving not less than sixty (60) days written notice.',
].join('\n');

function contractFixture(over = {}){
  return { id: 'MK-238', name: 'Raw Material Supply Agreement',
    counterparty: 'Kabras Sugar', template: 'RM', status: 'Under Review',
    folder: 'proc', fields: {}, metadata: {}, audit: [], rounds: [], versions: [],
    signatures: [], comments: [], redlineText: BASE, format: 'text', ...over };
}

/* The page rendered the way the router renders it: renderRedline() reads
   state.activeId and writes into #content, so the stage supplies both and then
   reads back the real DOM. */
async function page(opts = {}){
  const w = buildWorld({ negotiationView: true });
  const { win } = w;
  win.promptDialog = async () => '';
  const c = opts.contract || contractFixture();
  win.negoInit(c);
  if (opts.withChange !== false){
    await win.negoFileProposal(c, win.negoBaseText(c).replace('thirty (30) days', 'sixty (60) days'),
      { side: 'counterparty', author: 'Erik Lindqvist · Kabras Sugar' });
  }
  win.state = Object.assign({}, win.state, { contracts: [c], activeId: c.id, view: 'redline' });
  win.getContract = id => (id === c.id ? c : null);
  win.renderRedline();
  const doc = win.document;
  return { w, win, c, doc,
    $: sel => doc.querySelector(sel),
    $$: sel => [...doc.querySelectorAll(sel)],
    html: () => doc.getElementById('content').innerHTML,
    css: () => (doc.getElementById('redline-layout-css') || { textContent: '' }).textContent };
}

describe('F84 — the design names every part, and the names are on the page', () => {
  /* Each id is asserted with what it must BE, not merely that it exists: an id
     on the wrong element is the failure this is written against, and it is
     invisible to a plain presence check. */
  test('every id in the design contract is present', async () => {
    const p = await page();
    for (const id of ['view-redline', 'rl-banner', 'rl-grid', 'rl-doc',
      'rl-side', 'rl-resizer', 'rl-changes-col', 'rl-changes', 'rl-disc-col',
      'rl-threads', 'rl-rail-count', 'rl-thread-count'])
      assert.ok(p.$('#' + id), `#${id} is missing from the rendered workbench`);
  });

  test('the grid holds the document and ONE sidebar; both faces live inside it', async () => {
    const p = await page();
    const grid = p.$('#rl-grid');
    assert.ok(grid.contains(p.$('#rl-doc')), 'the document is not in the grid');
    assert.ok(grid.contains(p.$('#rl-side')), 'the single sidebar is not in the grid');
    assert.ok(p.$('#rl-side').contains(p.$('#rl-changes-col')),
      'tracked changes must be a face of the one sidebar');
    assert.ok(p.$('#rl-side').contains(p.$('#rl-disc-col')),
      'and so must the discussion — not a third column');
  });

  test('#rl-changes is the card list inside the changes column', async () => {
    const p = await page();
    assert.ok(p.$('#rl-changes-col').contains(p.$('#rl-changes')));
    assert.ok(p.$('#rl-changes').querySelector('[data-nego-card]') ||
      p.$('#rl-changes').textContent.trim().length,
      'the design\'s card list must hold the engine\'s cards');
  });

  test('#rl-threads is present even with nothing to say', async () => {
    // the empty state is where a "render it only when it has content" bug hides
    const p = await page({ withChange: false });
    assert.ok(p.$('#rl-threads'), 'the thread list must exist before the first thread');
  });

  test('#rl-banner carries the wall, which is a disclosure boundary', async () => {
    const p = await page();
    assert.match(p.$('#rl-banner').textContent, /The wall:/,
      'the banner slot must hold the internal/shared wall, not be an empty div');
  });
});

describe('F84 — the port adds the design\'s names, it does not rename the wiring', () => {
  /* If any of these go, the page still draws and the buttons stop working —
     the exact failure mode a visual review cannot catch. */
  test('the engine\'s own hooks survive beside the design\'s ids', async () => {
    const p = await page();
    assert.ok(p.$('#nego-root'), 'the room\'s token scope, without which the tools render invisible');
    assert.ok(p.$('#nego-cards'), 'the scroll box the counterparty portal reaches for by name');
    assert.ok(p.$('#rl-grid').classList.contains('nego-work'),
      'the clause tooling is scoped under .nego-work');
    assert.ok(p.$('#rl-doc').classList.contains('nego-pane') &&
      p.$('#rl-doc').classList.contains('working'),
      'the working-pane classes carry the clause tools and the fingerprint margin');
  });

  test('the document pane still carries the engine\'s clause hooks', async () => {
    const p = await page();
    const clause = p.$('#rl-doc [data-clause]');
    assert.ok(clause, 'no clause carries data-clause');
    assert.ok(clause.hasAttribute('data-nego-working'),
      'data-nego-working is how the engine finds the working copy of a clause');
  });
});

describe('F84 — two panes, a drag handle, and a sidebar that shows one face', () => {
  test('the resting grid is document two-thirds, sidebar one-third', async () => {
    const p = await page();
    assert.match(p.css(), /\.redline-page \.rl-grid\{[^}]*grid-template-columns:minmax\(0,2fr\) minmax\(0,1fr\)/,
      'the Doc tab\'s own split — two thirds to the contract before the first drag');
  });

  test('the sidebar\'s two faces are mutually exclusive by construction', async () => {
    const css = (await page()).css();
    assert.match(css, /\.redline-page\[data-rl-side-mode="changes"\] #rl-disc-col\{display:none\}/,
      'in Tracked Changes mode the discussion must leave the card entirely');
    assert.match(css, /\.redline-page\[data-rl-side-mode="disc"\] #rl-changes-col\{display:none\}/,
      'and in Discussion mode the changes must — never both at once');
  });

  test('the handle is real, absolute over the gap, and hidden when stacked', async () => {
    const p = await page();
    const rez = p.$('#rl-resizer');
    assert.ok(rez, 'the split handle must be in the grid');
    assert.equal(rez.getAttribute('role'), 'separator');
    assert.match(p.css(), /\.redline-page \.rl-resizer\{[^}]*position:absolute/,
      'absolute over the gap, so it claims no grid track of its own');
    assert.match(p.css(), /@media \(max-width:1023px\)\{[\s\S]*?\.rl-resizer\{display:none\}/,
      'a drag handle over stacked panes resizes nothing');
  });

  test('the workbench stacks below lg like the design', async () => {
    const css = (await page()).css();
    assert.match(css, /@media \(max-width:1023px\)/, 'below lg the design stacks to one column');
  });
});

describe('F84 — the Tracked Changes head gives the send slot its own line', () => {
  /* WHAT THIS IS PINNING, and why it is worth a test rather than an eyeball.

     #nego-send is hidden on this page — the design carries that act in the page
     header as Publish Round — but the sentence under it is not, and that
     sentence only exists when there IS an unsent draft. So the header had one
     layout on an idle contract and another the moment somebody filed a change,
     and only the second one was broken.

     It was broken badly rather than untidily. The row was nowrap, the title
     carries flex:1 with min-width:0 (flex-basis 0), and the slot was pushed
     over with margin-left:auto at its content width. Shrinkage in flexbox is
     weighted by flex-basis, so a basis of 0 takes none of it: the sentence kept
     its full width, the title absorbed the entire deficit, and "Tracked
     Changes" laid out at ZERO PIXELS — measured, not guessed. The column header
     simply vanished while a draft was pending.

     flex-basis:100% is the fix, and it is inert without flex-wrap on the
     parent — on a nowrap row it would make the sentence ask for the whole width
     and squeeze the title harder still. The two declarations are one change and
     are tested as one. */
  test('the head wraps, so a full-basis child can break the line', async () => {
    const css = (await page()).css();
    assert.match(css, /\.redline-page \.rl-idx-head\{[^}]*flex-wrap:wrap/,
      'without flex-wrap the send slot cannot take a row of its own');
  });

  test('the send slot claims a whole row instead of riding the title\'s', async () => {
    const css = (await page()).css();
    const m = /\.redline-page \.rl-sendslot\{([^}]*)\}/.exec(css);
    assert.ok(m, 'the send slot must carry its own rule');
    assert.match(m[1], /flex-basis:100%/, 'the slot takes the full line');
    assert.ok(!/margin-left:auto/.test(m[1]),
      'margin-left:auto is what pinned the sentence to the title\'s row');
  });

  test('an empty slot leaves no phantom row behind', async () => {
    // negoIndexSendHtml returns '' when there is nothing unsent, and a
    // full-basis element that still occupied a line would open a gap under the
    // title on every idle contract
    const css = (await page()).css();
    assert.match(css, /\.redline-page \.rl-sendslot:empty\{display:none\}/);
  });

  test('the slot does not inherit the room\'s spacing on top of its own row', async () => {
    // .nego-index-send is drawn for the room, where it earns a dashed rule and
    // 9px of air at the foot of a scrolling index. Here it already sits under
    // the head's own border, and the rule is painted in --n-line, a room token
    // that does not resolve on this page
    const css = (await page()).css();
    assert.match(css, /\.redline-page \.rl-sendslot \.nego-index-send\{[^}]*margin-top:0[^}]*border-top:0/);
  });

  test('the fold\'s chip and chevron are gone with the fold', async () => {
    // the sidebar tabs are the one switch now; a second control pair would be
    // two ways to disagree about which face is showing
    const p = await page();
    assert.equal(p.$('#rl-disc-show'), null);
    assert.equal(p.$('.rl-disc-x'), null);
  });
});

describe('F84 — the switcher wears its colours and its counts', () => {
  test('the tray and the two tinted buttons are styled, not grey text', async () => {
    const p = await page();
    const css = (p.doc.getElementById('redline-layout-css') || { textContent: '' }).textContent;
    assert.match(css, /\.rl-side-tabs\{[^}]*background:#f1f5f9/, 'the slate tray');
    assert.match(css, /\.rl-tab-changes\{[^}]*background:#ecfdf5/, 'Tracked Changes idles in emerald');
    assert.match(css, /\.rl-tab-changes\.on\{[^}]*background:#d1fae5/, 'and deepens when active');
    assert.match(css, /\.rl-tab-changes \.rl-tab-n\{[^}]*background:#059669/, 'solid emerald count pill');
    assert.match(css, /\.rl-tab-disc\{[^}]*background:#eef2ff/, 'Discussion idles in indigo');
    assert.match(css, /\.rl-tab-disc\.on\{[^}]*background:#e0e7ff/, 'and deepens when active');
    assert.match(css, /\.rl-tab-disc \.rl-tab-n\{[^}]*background:#4f46e5/, 'solid indigo count pill');
    assert.match(css, /html\.dark[^{]*\.rl-tab-changes/, 'the colours survive dark mode as tints');
  });

  test('each tab carries its own live count', async () => {
    const p = await page();
    const chg = p.$('#rl-side .rl-tab-changes #rl-chg-count');
    const disc = p.$('#rl-side .rl-tab-disc #rl-rail-count');
    assert.ok(chg && disc, 'both pills are on their buttons');
    assert.equal(chg.textContent.trim(), '1', 'one live redline in the fixture');
    assert.match(p.$('#rl-side .rl-tab-changes').textContent, /Tracked Changes/);
    assert.match(p.$('#rl-side .rl-tab-disc').textContent, /Discussion/);
  });

  test('the card snippet is clamped to two lines; the canvas holds the full scope', async () => {
    const p = await page();
    const css = (p.doc.getElementById('redline-layout-css') || { textContent: '' }).textContent;
    const m = /\.rl-card-diff\{([^}]*)\}/.exec(css);
    assert.ok(m, 'the diff snippet must carry a rule');
    assert.match(m[1], /-webkit-line-clamp:2/, 'two lines, uniform stack');
    assert.match(m[1], /overflow:hidden/, 'the overflow is reachable on the canvas, not in the card');
  });
});

describe('F84 — one sidebar, two modes, switched by the tabs and remembered', () => {
  test('the tabs are mutually exclusive and mark the root', async () => {
    const p = await page();
    const view = p.$('#view-redline');
    assert.equal(view.getAttribute('data-rl-side-mode'), 'changes', 'Tracked Changes is the default face');
    const tabs = p.$$('#rl-side [data-rl-mode]');
    assert.deepEqual(tabs.map(t => t.getAttribute('data-rl-mode')), ['changes', 'disc']);
    assert.match(tabs[1].textContent, /Discussion/);

    tabs[1].click();
    assert.equal(view.getAttribute('data-rl-side-mode'), 'disc');
    assert.equal(tabs[1].getAttribute('aria-selected'), 'true');
    assert.equal(tabs[0].getAttribute('aria-selected'), 'false');

    tabs[0].click();
    assert.equal(view.getAttribute('data-rl-side-mode'), 'changes');
    assert.equal(tabs[0].getAttribute('aria-selected'), 'true');
  });

  test('rlToggleDiscussion keeps its old contract on top of the modes', async () => {
    /* The name is part of the design contract (the lab wraps it — see f90),
       so it survives as a shim: true = discussion not showing. */
    const p = await page();
    assert.equal(p.win.rlToggleDiscussion(), false, 'from changes, a bare toggle opens the discussion');
    assert.equal(p.$('#view-redline').getAttribute('data-rl-side-mode'), 'disc');
    assert.equal(p.win.rlToggleDiscussion(), true);
    assert.equal(p.$('#view-redline').getAttribute('data-rl-side-mode'), 'changes');
  });

  test('the choice survives a repaint', async () => {
    const p = await page();
    p.win.rlSetSideMode('disc');
    p.win.renderRedline();
    assert.equal(p.$('#view-redline').getAttribute('data-rl-side-mode'), 'disc',
      'a mode that resets itself on every clause is not a preference');
    assert.equal(p.$('#rl-side [data-rl-mode="disc"]').getAttribute('aria-selected'), 'true');
    p.win.rlSetSideMode('changes');
  });
});

describe('F84 — the header actions press the engine, not a lookalike', () => {
  test('the design\'s three header controls are all there', async () => {
    const p = await page();
    const labels = p.$$('.rl-actions button').map(b => b.textContent.trim());
    assert.ok(labels.some(t => /Internal View/.test(t)));
    assert.ok(labels.some(t => /Counterparty View/.test(t)));
    assert.ok(labels.some(t => /Accept All Non-Risk/.test(t)));
    assert.ok(labels.some(t => /Publish Round/.test(t)));
  });

  test('Accept All Non-Risk fires the engine\'s own bulk control', async () => {
    const p = await page();
    const engine = p.doc.getElementById('nego-bulk-acc');
    assert.ok(engine, 'the engine\'s bulk-accept must be in the DOM to be pressed');
    let fired = 0;
    engine.addEventListener('click', () => { fired++; });
    p.$('[data-redline-proxy="nego-bulk-acc"]').click();
    assert.equal(fired, 1, 'the header button must route through the engine\'s control');
  });

  test('a header button disables itself rather than lying', async () => {
    /* The header's actions are proxies: each presses a control the ENGINE
       renders, and the engine renders it only when there is something to
       press. So the honest state of the header button is whatever the engine's
       control is — which is what redlineSyncProxies reads. Taking the engine's
       control away is the case that matters: the proxy must go dead with it
       rather than stay lit and do nothing when clicked. */
    const p = await page();
    const proxy = p.$('[data-redline-proxy="nego-send"]');
    assert.ok(!proxy.disabled, 'with the engine offering a send, the header offers it too');

    p.doc.getElementById('nego-send').remove();
    p.win.redlineSyncProxies(p.doc.getElementById('content'));
    assert.ok(proxy.disabled, 'a button that cannot do its job must say so');
    assert.match(proxy.title, /Not available/, 'and say why, on hover');
  });

  test('the view toggle switches side and re-renders', async () => {
    const p = await page();
    p.$$('[data-redline-side]').find(b => b.getAttribute('data-redline-side') === 'counterparty').click();
    assert.ok(p.$('[data-redline-side="counterparty"]').classList.contains('on'),
      'the pressed side must read as pressed after the repaint');
  });
});

describe('F84 — the clause toolbar files against the contract, not the sandbox', () => {
  test('every clause carries the design\'s three verbs', async () => {
    const p = await page();
    const clause = p.$('#rl-doc .rl-clause');
    const labels = [...clause.querySelectorAll('.rl-tool')].map(b => b.textContent.trim());
    assert.ok(labels.some(t => /AI Assist/.test(t)));
    assert.ok(labels.some(t => /Add Note\/Tag/.test(t)));
    assert.ok(labels.some(t => /Direct Edit/.test(t)));
  });

  test('Direct Edit is the engine\'s propose handler, by attribute', async () => {
    const p = await page();
    const edit = [...p.$$('#rl-doc .rl-tool')].find(b => /Direct Edit/.test(b.textContent));
    assert.ok(edit.hasAttribute('data-nego-edit'),
      'Direct Edit must carry the attribute wireNegotiationTab binds the propose dialog to');
  });

  test('nothing on this page reaches for the Doc Lab\'s sandbox store', async () => {
    const p = await page();
    const raw = require('node:fs').readFileSync(
      require('node:path').join(__dirname, '..', 'js', 'views', 'negotiation.js'), 'utf8');
    /* Comments stripped first: the code is allowed to NAME the store it is
       warning future readers away from, and does. What must not appear is a
       reference the engine would actually execute. */
    const src = raw.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
    assert.ok(!/hati\.lab\.v1/.test(src),
      'the workbench must never write to the lab\'s store — it cannot reach a contract');
    assert.ok(!/\blabFor\s*\(|\blabPut\s*\(/.test(src),
      'the lab\'s accessors write to the sandbox; the workbench files real changes');
    assert.ok(p.$('#rl-doc'), 'and the page still rendered');
  });

  test('AI Assist offers the workbench\'s own action list, over this clause\'s words', async () => {
    /* The list is RL_SEL_ACTIONS, not NEGO_AI_ACTIONS. The workbench
       standardised on three actions of its own — rephrase, shorten, tag — and
       routes all three into the Copilot side panel, while the contract tab and
       the room keep the engine's list and its popover. What this still pins is
       the property that mattered: BOTH entry points on this page (a text
       selection and the clause toolbar) build from ONE list, so they cannot
       drift into naming different verbs for the same job. */
    const p = await page();
    const ai = [...p.$$('#rl-doc .rl-tool')].find(b => /AI Assist/.test(b.textContent));
    ai.click();
    const menu = p.$('.nego-selmenu');
    assert.ok(menu, 'AI Assist must open a menu');
    const offered = [...menu.querySelectorAll('[data-nego-ai]')].map(b => b.getAttribute('data-nego-ai'));
    /* Joined rather than deep-compared: the page's array is built in its own
       realm, so its prototype is not this realm's Array and a deep compare
       reports a mismatch on two identical lists (the same trap f60 documents). */
    assert.equal(offered.join(','), p.win.RL_SEL_ACTIONS.map(a => a.id).join(','),
      'the menu must be built from the workbench\'s action list, not a second copy');
    assert.match(menu.textContent, /This clause/);
  });

  test('the AI menu survives the gesture that opened it', async () => {
    /* Pressing the button is a mouseup inside the document pane, and the pane
       treats a mouseup as "the reader finished selecting words". A click
       collapses the selection, so the selection handler found none and
       dismissed the menu the button had just opened — the menu appeared and
       vanished, in that order, from one press. Real-browser measurement caught
       this; jsdom does not schedule it the same way, so the handler is invoked
       directly here rather than hoping the timing reproduces. */
    const p = await page();
    const ai = [...p.$$('#rl-doc .rl-tool')].find(b => /AI Assist/.test(b.textContent));
    ai.click();
    assert.ok(p.$('.nego-selmenu'), 'the menu must open');

    const ev = new p.win.MouseEvent('mouseup', { bubbles: true });
    ai.dispatchEvent(ev);
    await new Promise(r => setTimeout(r, 30));
    assert.ok(p.$('.nego-selmenu'),
      'a mouseup on a control is somebody operating the page, not selecting words in it');
  });

  test('Add Note/Tag on a clause with no change says so instead of filing one', async () => {
    const p = await page({ withChange: false });
    const note = [...p.$$('#rl-doc .rl-tool')].find(b => /Add Note\/Tag/.test(b.textContent));
    assert.ok(!note.hasAttribute('data-rl-change'), 'there is no change to hang a note on');
    note.click();
    assert.match(p.w.toastText(), /Propose an edit/,
      'an empty change filed to hold a note is a fingerprint nobody proposed');
  });

  test('Add Note/Tag switches the sidebar to Discussion before aiming at the composer', async () => {
    const p = await page();
    p.win.rlSetSideMode('changes');              // the composer is now display:none
    const note = [...p.$$('#rl-doc .rl-tool')].find(b => b.hasAttribute('data-rl-change'));
    assert.ok(note, 'the changed clause should offer a note');
    note.click();
    assert.equal(p.$('#view-redline').getAttribute('data-rl-side-mode'), 'disc',
      'focusing an input inside a hidden panel silently does nothing');
  });
});

/* F84 — focus mode was here. The toggle, its state and the twelve-column
   override are gone from the workbench: it gave the document the whole row by
   hiding the other two columns, which is the discussion fold's job done twice
   and leaves the workbench with nothing to work on. Three other paths — tagging
   a note, jumping to a clause, linking a card — each had to remember to switch
   it off before they could reach a column it had hidden. See
   test/f91-doc-redline-navigation.test.js for what replaced the header slot. */
