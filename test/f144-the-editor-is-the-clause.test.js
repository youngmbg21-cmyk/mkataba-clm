/* ============================================================
   f144 — Direct Edit opens ON the clause, and looks like the clause
   ============================================================
   Reported from the field (Young, 02 Aug 2026), against both the owner's
   Redline page and the counterparty's, with a screenshot: file a redline, press
   Direct Edit again to change a word of it, and the clause card falls apart —
   the wording spills out of its box, the paragraphs run together, and the three
   hover verbs sit on top of the Save change bar.

   Three separate faults arrive together, which is why one report looked like
   one bug:

   1. THE EDITOR WAS STYLED AS A DIFFERENT KIND OF THING. Every typographic rule
      for a clause body is written for `.nego-body`, and Direct Edit REPLACES
      `.nego-body` with `.nego-editing` — so the moment the editor opened the
      clause lost the lot. Measured in Chromium on one preamble: paragraphs fell
      back to the sheet's `pre-wrap`, so every newline in the stored markup
      printed as a hard break; a party table dropped from the card's full width
      to 126px of 648; a signature block lost its `overflow-x` and hung outside
      the card; and the 9px between blocks went to nothing. A short one-paragraph
      clause survived it, which is why this stood for as long as it did.

   2. THE HOVER VERBS WOULD NOT STAND DOWN. `.rl-tools` is revealed on
      `:focus-within`, and a caret in the editor IS focus within the clause. The
      row is absolutely positioned at `bottom:-9px` at z-index 3 — exactly where
      the editor's own Save change / Cancel bar sits.

   3. AND RE-EDITING THREW THE REDLINE AWAY. The editor loaded `cl.bodyHtml` —
      the ROUND BASELINE clause — never the pending change. So a second edit
      opened on the original wording with the writer's own proposal nowhere on
      screen, and saving re-filed against the baseline: the first ask was not
      refused or withdrawn, it was silently overwritten. The document beside the
      editor went on showing the redline the whole time, so the page disagreed
      with itself about what was being proposed.

   jsdom has no cascade and no box model, so (1) is pinned here at the RULE
   level — every `.nego-body` rule in the sheet has a `.nego-editing` twin — and
   measured for real in test/chromium/redline-verify.js. (2) and (3) are
   behaviour and are asserted against the real DOM. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { buildWorld } = require('./world');

/* The reported document's shape: a preamble that is a CLAUSE rather than front
   matter (no <h1> above it, so clauseFrontMatter has nothing to strip), holding
   the things a short clause does not have — several paragraphs, a party table
   and a preformatted signature block. This is the clause in the screenshot. */
const RICH = [
  '<h2>MASTER RAW MATERIALS PROCUREMENT AGREEMENT</h2>',
  '<p>THIS MASTER RAW MATERIALS PROCUREMENT AGREEMENT (the "Agreement") is entered into as of '
    + '<strong>[Effective Date]</strong> (the "Effective Date"), <strong>BY AND BETWEEN:</strong></p>',
  '<p><strong>GULIZ LLC</strong>, a limited liability company organized under the laws of Sweden '
    + '(the "Buyer");</p>',
  '<table><tbody><tr><td>BUYER:</td><td>SUPPLIER:</td></tr>'
    + '<tr><td>GULIZ LLC</td><td>Young</td></tr></tbody></table>',
  '<pre>Name: [Authorized Officer]        Title: Procurement Director</pre>',
  '<h2>1. SCOPE OF SUPPLY</h2>',
  '<p>1.1 This Agreement establishes the framework under which Buyer may purchase Materials.</p>',
].join('');

function contractFixture(over = {}){
  return { id: 'MK-281', name: 'Master Raw Materials Procurement Agreement',
    counterparty: 'Nordfrakt Logistik AB', template: 'RM', status: 'Under Review',
    folder: 'proc', fields: {}, metadata: {}, audit: [], rounds: [], versions: [],
    signatures: [], comments: [], redlineText: RICH, format: 'rich', ...over };
}

/* The page rendered the way the router renders it. */
async function page(opts = {}){
  const w = buildWorld({ negotiationView: true });
  const { win } = w;
  win.promptDialog = async () => '';
  win.openShareModal = () => {};
  const c = opts.contract || contractFixture();
  win.negoInit(c);
  win.state = Object.assign({}, win.state, { contracts: [c], activeId: c.id, view: 'redline' });
  win.getContract = id => (id === c.id ? c : null);
  win.renderRedline();
  const doc = win.document;
  const preamble = () => [...doc.querySelectorAll('#rl-doc .rl-clause[data-clause]')]
    .find(s => /PROCUREMENT AGREEMENT/.test((s.querySelector('.rl-clause-h') || {}).textContent || ''));
  return { w, win, c, doc, preamble,
    /* The engine's own controls, pressed the way a reader presses them.
       RE-STAGED 16 Aug 2026: the clause's Direct Edit is retired (no edits on
       the paper — all writing through the panel), so the press is the Edit
       pill and then the panel's ＋. Same editor, same handler, new home; the
       pill is pressed only when the clause's panel body is not already up,
       because the pill is a toggle. */
    edit(){
      const cl = preamble();
      const id = cl.getAttribute('data-clause');
      const body = () => [...doc.querySelectorAll('#rl-cp .rl-cp-src')]
        .find(b => b.getAttribute('data-rl-cp-for') === id);
      /* STAGED THROUGH THE PANEL'S OWN OPENER SINCE 29 Aug 2026. The pill on
         OUR seat opens the clause editor page now, so pressing it here would
         stage the wrong surface; this file's subject is the PANEL's inline
         editor, which is still what the counterparty's seat and a narrow
         window get. Opening it directly is what the pill used to do. */
      if (!body().classList.contains('is-on')) win.rlCpSetShown(doc, id);
      body().querySelector('[data-rl-cp-edit]').click();
      return doc.querySelector('[data-nego-editor]');
    },
    cpBody(){
      const id = preamble().getAttribute('data-clause');
      return [...doc.querySelectorAll('#rl-cp .rl-cp-src')]
        .find(b => b.getAttribute('data-rl-cp-for') === id);
    },
    /* REVERSED IN PLACE 28 Aug 2026: Save is ONE press. It walked the two
       steps and skipped the reason — the same thing a person did when they
       had nothing to add — and the owner has now removed the question. What
       these tests are about is unchanged: the wording. */
    save(){ doc.querySelector('[data-nego-next]').click(); },
    css: () => (doc.getElementById('nego-style') || { textContent: '' }).textContent,
    /* The Redline page's own sheet, which is where the hover row is dressed. */
    pageCss: () => (doc.getElementById('redline-layout-css') || { textContent: '' }).textContent };
}

/* Every selector in the sheet, comments stripped and comma lists split — the
   same reading f36 takes of this stylesheet. */
function selectors(css){
  return css.replace(/\/\*[\s\S]*?\*\//g, '')
    .split('}').map(b => b.split('{')[0].trim()).filter(Boolean)
    .flatMap(sel => sel.split(',').map(x => x.trim()))
    .filter(Boolean);
}

describe('f144 — the editor is styled as the clause it replaces', () => {
  /* The load-bearing assertion of this file. It is written against the SHEET
     rather than against a list of properties on purpose: a rule added to
     .nego-body next year is a rule the editor needs too, and this fails the
     moment somebody adds one without its twin. */
  test('every .nego-body rule has a .nego-editing twin', async () => {
    const p = await page();
    const sels = selectors(p.css());
    /* The body rules that describe CONTENT — what is inside the clause. The
       three that describe the container itself (its own margin, its font size,
       the page's canvas rule) are not in scope here; .nego-editing is handled
       beside them in the redline sheet and measured in Chromium. */
    const bodyRules = sels.filter(s => /\.nego-body\s|\.nego-body>/.test(s));
    assert.ok(bodyRules.length >= 15,
      `expected the body's typography rules to be in this sheet, found ${bodyRules.length}`);
    const missing = bodyRules
      .map(s => s.replace('.nego-body', '.nego-editing'))
      .filter(twin => !sels.includes(twin));
    assert.deepEqual(missing, [],
      'these clause-body rules do not reach the editor, so the wording changes shape when it is edited');
  });

  /* The specific one the screenshot was of. .nego-clause p carries pre-wrap for
     the TEXT PROJECTION, where the newlines are content; real markup turns it
     back off. The editor holds real markup and was getting the projection's
     rule, so every newline between two tags printed as a line break. */
  test('the editor turns pre-wrap back off, exactly as the body does', async () => {
    const p = await page();
    const css = p.css();
    assert.match(css, /\.nego-clause \.nego-editing p[^{]*\{[^}]*white-space:normal/,
      'without this the source HTML’s own indentation prints as hard breaks');
  });

  test('a table in the editor fills the card, and a pre block scrolls', async () => {
    const css = (await page()).css();
    assert.match(css, /\.nego-clause \.nego-editing table\{[^}]*width:100%/,
      'a table left at its intrinsic width shrink-wraps to a fraction of the card');
    assert.match(css, /\.nego-clause \.nego-editing pre\{[^}]*overflow-x:auto/,
      'without this a signature block hangs outside the clause');
  });
});

describe('f144 — an open editor is not also a row of verbs', () => {
  /* RE-STAGED 16 Aug 2026. The hover verbs this section kept down are retired
     with their row (no edits on the paper — all writing through the panel),
     and the editor's home moved into the panel with them. The CLAIM survives
     where the editor lives now: while the panel's editor is open, the panel's
     own acts (the ＋) stand down — a door the reader is already standing in —
     and the flag that says so dies with the editor. */
  test('the panel body says it is being written in', async () => {
    const p = await page();
    assert.ok(!p.cpBody().classList.contains('is-editing'), 'not before');
    p.edit();
    assert.ok(p.cpBody().classList.contains('is-editing'),
      'the body must be able to say so, or its acts cannot stand down');
  });

  test('and the sheet takes the acts off a body that says it', async () => {
    const p = await page();
    assert.match(p.pageCss(), /\.rl-cp-src\.is-editing \.rl-cp-acts\{display:none\}/);
    /* And nothing dresses the retired hover row any more. */
    assert.ok(!/\.rl-clause\.is-editing \.rl-tools/.test(p.pageCss()),
      'no rule survives for the retired tool row');
  });

  test('the flag dies with the editor, not after it', async () => {
    const p = await page();
    p.edit();
    p.doc.querySelector('[data-nego-cancel]').click();
    assert.equal(p.doc.querySelector('[data-nego-editor]'), null, 'the editor closed');
    assert.ok(!p.cpBody().classList.contains('is-editing'),
      'a body left flagged as editing would keep its acts hidden for good');
  });
});

describe('f144 — a clause you land on is not dressed as a dropdown', () => {
  /* The fault the two screenshots were actually of, and the one no rule about
     the clause could have found: rlJumpToClause flashed the clause by adding
     `rl-jump`, which is ALSO the class on the toolbar's contract picker
     (#rl-contract-jump). The picker's rule was written as `.redline-page
     .rl-jump` — two classes, no element — so it dressed the CLAUSE too:
     max-width:calc(220px + 9ch), overflow:hidden, white-space:nowrap, 11px
     mono. Measured on the real page, the clause went from 626px to 285px with
     its heading clipped mid-word, and stayed there until the next repaint.

     Nothing about either part was wrong on its own. They just asked for the
     same word. So what is pinned is the SEPARATION, three ways. */
  test('the clause flash and the contract picker do not share a class', async () => {
    const p = await page();
    const jumpSel = p.pageCss()
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .split('}').map(b => b.split('{')[0].trim()).filter(Boolean)
      .flatMap(sel => sel.split(',').map(x => x.trim()))
      .filter(sel => /\brl-jump\b/.test(sel));
    assert.ok(jumpSel.length, 'the picker still has rules of its own');
    for (const sel of jumpSel)
      assert.match(sel, /select\.rl-jump/,
        `"${sel}" would dress anything carrying rl-jump, not only the picker`);
  });

  test('the flash class is rl-arrived, and it is what the jump sets', async () => {
    const p = await page();
    const clause = p.preamble();
    const jumped = p.win.rlJumpToClause(clause.getAttribute('data-clause'), { edit: false });
    assert.ok(jumped, 'the jump found the clause');
    assert.ok(clause.classList.contains('rl-arrived'), 'the clause says it has arrived');
    assert.ok(!clause.classList.contains('rl-jump'),
      'and does not take the picker\'s name with it');
  });

  test('the sheet still lights a clause that has arrived', async () => {
    const p = await page();
    assert.match(p.pageCss(), /\.rl-clause\.rl-arrived\{animation:rlJump/,
      'renaming the class must not have left the flash without a rule');
  });
});

describe('f144 — Direct Edit opens on the wording that is on the table', () => {
  test('the first edit opens on the baseline, because that is what is on the table', async () => {
    const p = await page();
    const ed = p.edit();
    assert.ok(ed, 'the editor opened');
    assert.match(ed.textContent, /laws of Sweden/, 'the clause as the document has it');
  });

  test('re-opening shows the redline that was filed, not the wording under it', async () => {
    const p = await page();
    const ed = p.edit();
    ed.innerHTML = ed.innerHTML.replace('laws of Sweden', 'laws of Sweden and Norway');
    p.save();
    await new Promise(r => setTimeout(r, 0));

    const again = p.edit();
    assert.ok(again, 'the editor opened a second time');
    assert.match(again.textContent, /Sweden and Norway/,
      'the writer’s own ask must be what they come back to');
    assert.doesNotMatch(again.textContent.replace(/Sweden and Norway/g, ''), /laws of Sweden/,
      'and the baseline must not be handed back over the top of it');
  });

  test('a second edit revises the one ask instead of stacking a second', async () => {
    const p = await page();
    let ed = p.edit();
    ed.innerHTML = ed.innerHTML.replace('laws of Sweden', 'laws of Sweden and Norway');
    p.save();
    await new Promise(r => setTimeout(r, 0));
    ed = p.edit();
    ed.innerHTML = ed.innerHTML.replace('Sweden and Norway', 'Sweden, Norway and Denmark');
    p.save();
    await new Promise(r => setTimeout(r, 0));

    const live = p.win.negoChanges(p.c).filter(x => x.status !== 'superseded');
    assert.equal(live.length, 1, `one clause, one ask — got ${live.length}`);
    assert.match(live[0].newText, /Sweden, Norway and Denmark/,
      'the second edit must build on the first');
    /* The one that proves the loss is really gone: the ask has to have been
       CARRIED, not re-derived from the baseline and re-diffed. */
    assert.doesNotMatch(live[0].newText, /laws of Sweden\b(?!, Norway)/,
      'the intermediate wording must not have been resurrected');
  });

  /* A settled change is not "on the table": its wording is in the baseline
     (accepted) or is not the document at all (rejected). Reopening the editor
     from either would edit wording the record no longer carries. */
  test('a REJECTED change does not pre-fill the editor', async () => {
    const p = await page();
    const ed = p.edit();
    ed.innerHTML = ed.innerHTML.replace('laws of Sweden', 'laws of Sweden and Norway');
    p.save();
    await new Promise(r => setTimeout(r, 0));
    const ch = p.win.negoChanges(p.c).find(x => x.status === 'pending');
    p.win.negoResolve(p.c, ch.id, 'rejected', { side: 'counterparty', author: 'Amina Wanjiru' });
    p.win.renderRedline();

    const again = p.edit();
    assert.match(again.textContent, /laws of Sweden/, 'the baseline stands, and is what opens');
    assert.doesNotMatch(again.textContent, /Norway/,
      'a refused ask must not come back as the starting point for the next one');
  });

  /* The wall keeps the other side's unsent drafts out of the document. The
     editor reads the change id off the CLAUSE the renderer drew, so it can only
     ever open on wording that is already on the screen — a search of c.changes
     would have walked straight into a draft nobody is entitled to see. */
  test('the editor reads the change the DOCUMENT is showing', async () => {
    const p = await page();
    const ed = p.edit();
    ed.innerHTML = ed.innerHTML.replace('laws of Sweden', 'laws of Sweden and Norway');
    p.save();
    await new Promise(r => setTimeout(r, 0));
    const ch = p.win.negoChanges(p.c).find(x => x.status === 'pending');
    assert.equal(p.preamble().getAttribute('data-nego-card-anchor'), ch.id,
      'the clause names the change it is drawing, and that name is what the editor follows');
  });
});
