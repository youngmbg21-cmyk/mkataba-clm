/* ============================================================
   f210 — the clause has a door, and the door opens a panel
   ============================================================
   Owner-asked, 16 Aug 2026, at the end of a long design conversation about
   negotiating a clause in one place instead of four: "Just add a green pill
   that says Edit on the top right of the clause."

   THIS IS THE FIRST PIECE AND IT IS ADDITIVE. Nothing is removed: the hover
   tool row, the ask tags, the change cards and the card pop-out all still work
   exactly as they did. What the page gains is a way IN — a pill on every
   clause that opens that clause's own panel: what it says now, what is on the
   table, and everything that has ever been asked about it.

   WHAT IS PINNED HERE:
     1  the pill: the pencil icon (accent ink, word as aria-label), top right, on every clause, always drawn
     2  it is a DOOR, not a verb — it opens the panel and files nothing
     3  the panel's three sections, and the empty states that must be drawn
     4  ONE READING, ONE PRODUCER — the panel's bodies come from the canvas
     5  the seats and the mounts where it must NOT be drawn
     6  the wall: the other side's unsent draft is not in the panel either
     7  the ways out, and the arming that decides which seats have them
     8  "as it stands" is what STANDS, not the round baseline
     9  both languages
    10  the twin renderer was carrying the MK-311 fault and now is not
    11  THE EDITING IS IN THE PANEL — one editor, two homes
    12  the Copilot: one button, one narrowed selection offer, one menu
   ============================================================ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld, supplyContract } = require('./world');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
/* THE PAGE'S SOURCE IS TWO FILES since 21 Aug 2026: its stylesheets were lifted
   into js/views/negotiation-css.js. A CSS rule that moved has not changed —
   reading only the renderer reports the whole sheet as missing. */
const SRC = (read('js/views/negotiation.js') + read('js/views/negotiation-css.js'));
const I18N = read('js/i18n.js');
const SRC_DOCX = read('js/docx.js');

/* A negotiation with one ask on one clause, from a named side. */
async function bench(opts = {}){
  const w = buildWorld({ negotiationView: true, contractView: true });
  const { win } = w;
  win.promptDialog = async () => '';
  win.openAI = () => {}; win.aiPush = () => {}; win.renderAIFeed = () => {};
  win.copilotAvailable = () => false;
  win.openShareModal = () => {};
  win.counterpartyContact = () => null;
  win.cachedShares = () => [];
  const c = supplyContract();
  win.negoInit(c);
  if (opts.ask !== false){
    await win.negoFileProposal(c,
      win.negoBaseText(c).replace('thirty (30) days', 'sixty (60) days'),
      { side: opts.side || 'counterparty', author: opts.author || 'Amina Wanjiru' });
  }
  win.state = Object.assign({}, win.state, { contracts: [c], activeId: c.id, view: 'redline' });
  win.getContract = id => (id === c.id ? c : null);
  return { w, win, c, doc: win.document };
}

/* The whole page as the reader gets it — panes, not just the canvas, because
   the panel is mounted by redlinePanesHtml and the pill only draws where the
   panel exists. */
function page(p, opts = {}){
  const box = p.doc.createElement('div');
  box.className = 'redline-page';
  box.innerHTML = p.win.redlinePanesHtml(p.c, { side: 'owner', hiddenIds: [], ...opts });
  return box;
}
const pills = box => [...box.querySelectorAll('.rl-cp-pill')];
const bodies = box => [...box.querySelectorAll('#rl-cp-body .rl-cp-src')];

describe('f210 (1) — the pill', () => {
  test('every clause carries one — the pencil icon, with the word kept for a screen reader', async () => {
    const p = await bench();
    const box = page(p);
    /* section.rl-clause, not .rl-clause: the paper also puts that class on the
       numbered LINES inside a clause body (see .rl-line.rl-clause.rl-hang), and
       a line is not a clause. */
    const clauses = [...box.querySelectorAll('#rl-doc section.rl-clause')];
    assert.ok(clauses.length >= 2, 'the fixture has clauses to put a door on');
    assert.equal(pills(box).length, clauses.length,
      'one pill per clause — including the clauses nobody has asked anything about');
    /* REVERSED IN PLACE, 20 Aug 2026 (owner-asked, off a picture of the glyph):
       the WORD left the paper for the pencil icon. The claim this test was
       making — the door is findable and named — is unchanged: the icon is the
       finding, and the name survives as aria-label + title. */
    pills(box).forEach(b => {
      assert.equal(b.textContent.trim(), '', 'icon-only on the paper');
      assert.ok(b.querySelector('svg'), 'the pencil glyph is the button');
      assert.equal(b.getAttribute('aria-label'), 'Edit', 'the word survives for a screen reader');
    });
  });

  test('it is at the TOP of the clause, in the heading row', async () => {
    /* The owner asked for top right. The hover tool row sits at the FOOT of the
       clause and is a different control with a different job; a pill that
       landed there would be the fourth button in a row nobody can see until
       they hover. */
    const p = await bench();
    pills(page(p)).forEach(b => {
      assert.ok(b.parentElement.classList.contains('rl-clause-top'),
        'the pill rides the clause head, beside the heading and the ask tags');
      assert.equal(b.parentElement.lastElementChild, b,
        'and it is LAST in that row, which is what puts it on the right');
    });
  });

  test('it wears the nav\'s colour, and it is not hover-only', async () => {
    /* CLAIM MOVED WITH THE OWNER'S ASK (16 Aug 2026): the pill follows the
       workspace theme through the nav panel's own token — dark green in the
       green workspace, navy in the blue one — instead of a fixed emerald that
       ignored what the workspace wore. One token, --nav-bg, so the dark theme
       comes free.

       ALWAYS DRAWN is the load-bearing half. The tool row is furniture on a
       clause you are already working on; this is the way IN, and a hover-only
       door is an invisible affordance — the exact fault this file records
       against the selection route. */
    /* REVERSED IN PLACE, 20 Aug 2026 (owner-asked): the dark nav-bg fill went
       with the word — the pencil now sits on a transparent face in the
       workspace ACCENT, visible but not too dark, and never neutral grey
       (the furniture lesson). */
    assert.match(SRC, /\.redline-page \.rl-cp-pill\{[^}]*background:transparent/,
      'no dark fill on the paper any more');
    assert.match(SRC, /\.redline-page \.rl-cp-pill\{[^}]*color:var\(--accent-solid/,
      'the glyph wears the workspace accent — visible, never furniture-grey');
    /* REVERSED IN PLACE, 19 Aug 2026 (owner-asked). margin-left:auto put the
       pill at the right of the heading's FLEX ROW, which is inside the
       clause's content box — so anything that changed that box moved the
       button, and a redline changed it by 17px. It is pinned to the clause
       now. The claim this line was making is unchanged and is stronger: the
       pill is at the right of the clause on every clause, including one with
       no heading beside it. */
    assert.match(SRC, /\.redline-page \.rl-cp-pill\{[^}]*position:absolute/,
      'it is pinned to the clause, so nothing the clause does can move it');
    assert.match(SRC, /\.redline-page \.rl-cp-pill\{[^}]*right:0/,
      'and it is pushed right even on a clause with no heading beside it');
    assert.doesNotMatch(SRC, /\.rl-clause:hover \.rl-cp-pill/,
      'nothing reveals it on hover, because it is never hidden');
  });

  test('it follows the reader\'s document type, like the rest of the sheet', async () => {
    /* The third report of one fault (13 and 15 Aug 2026) was enough; a fourth
       is not needed to apply the rule to a new piece of furniture. */
    /* WRITTEN AS THE RELATION, NOT THE NUMBER (22 Aug 2026). It pinned the
       literal 10.5px and failed the day every size in the product moved onto a
       whole pixel — over a claim that was still true. What this test is for is
       that the pill answers the stepper; which rung of the ladder it sits on is
       a design decision, not this claim's business. */
    assert.match(SRC, /\.redline-page \.rl-cp-pill\{[^}]*font-size:calc\(\d+px \* var\(--doc-scale,1\)\)/);
    assert.match(SRC, /\.redline-page \.rl-cp-pill\{[^}]*padding:calc\(3px \* var\(--doc-scale,1\)\)/);
  });
});

describe('f210 (2) — it is a door, not a verb', () => {
  test('pressing it files nothing and decides nothing', async () => {
    const p = await bench();
    const box = page(p);
    const before = JSON.stringify(p.c.changes);
    const pill = pills(box)[0];
    assert.equal(pill.getAttribute('data-nego-edit'), null, 'it is not the editor');
    assert.equal(pill.getAttribute('data-nego-accept'), null);
    assert.equal(pill.getAttribute('data-nego-reject'), null);
    assert.ok(pill.hasAttribute('data-rl-cp-open'), 'it opens the panel and nothing else');
    p.win.rlCpSetShown(box, pill.getAttribute('data-rl-cp-open'));
    assert.equal(JSON.stringify(p.c.changes), before, 'the record did not move');
  });

  test('opening is a class flip, never a repaint', async () => {
    /* The queue's own property and the reason it is worth keeping: rebuilding
       the page to show one panel throws away the reader's place in the
       contract, which is the one thing they were holding on to. */
    const p = await bench();
    const box = page(p);
    const id = pills(box)[0].getAttribute('data-rl-cp-open');
    const wording = () => [...box.querySelectorAll('#nego-scroll-work .nego-body')]
      .map(n => n.innerHTML).join('|');
    const before = wording();
    p.win.rlCpSetShown(box, id);
    assert.ok(box.querySelector('#rl-cp').classList.contains('is-open'));
    assert.equal(box.querySelector('#rl-cp-scrim'), null,
      'and there is no backdrop to dim the contract — REVERSED IN PLACE, 16 Aug 2026');
    assert.equal(wording(), before, 'the contract under it did not move a byte');
    /* The one thing on the paper that DOES move is the pressed pill's own
       aria-expanded, which is the pill describing its own door. */
    assert.equal(box.querySelector(`[data-rl-cp-open="${id}"]`).getAttribute('aria-expanded'), 'true');
  });

  test('one clause at a time', async () => {
    const p = await bench();
    const box = page(p);
    const ids = pills(box).map(b => b.getAttribute('data-rl-cp-open'));
    p.win.rlCpSetShown(box, ids[0]);
    p.win.rlCpSetShown(box, ids[1]);
    const on = bodies(box).filter(b => b.classList.contains('is-on'));
    assert.equal(on.length, 1, 'the same single-value rule as the pop-out and the ask reveal');
    assert.equal(on[0].getAttribute('data-rl-cp-for'), ids[1]);
    p.win.rlCpSetShown(box, null);
    assert.equal(p.win.rlCpOpenId(), null);
  });

  test('a clause the panel has no body for cannot be opened', async () => {
    /* A panel that slides out empty reads as broken rather than as "nothing
       here". Better to refuse the open. */
    const p = await bench();
    const box = page(p);
    p.win.rlCpSetShown(box, 'no-such-clause');
    assert.equal(p.win.rlCpOpenId(), null);
    assert.equal(box.querySelector('#rl-cp').classList.contains('is-open'), false);
  });
});

describe('f210 (3) — what is in the panel', () => {
  test('three sections: as it stands, on the table, history', async () => {
    const p = await bench();
    const box = page(p);
    const b = bodies(box)[0];
    const heads = [...b.querySelectorAll('.rl-cp-h')].map(h => h.textContent.trim());
    /* The acts sit between the first two — see f210 (15). The three sections
       the panel is ABOUT are still these three, in this order. */
    assert.deepEqual(heads.filter(h => h !== 'Change this clause'),
      ['As it stands', 'On the table', 'History']);
  });

  test('the history is drawn even when it is empty', async () => {
    /* A section that appears only once there is something in it teaches the
       reader nothing about where to look the first time they need it — and
       "nothing has been asked about this clause yet" is a real answer. */
    const p = await bench({ ask: false });
    const box = page(p);
    const b = bodies(box)[0];
    const heads = [...b.querySelectorAll('.rl-cp-h')].map(h => h.textContent.trim());
    assert.ok(heads.includes('History'), 'the heading is there with nothing under it');
    const nones = [...b.querySelectorAll('.rl-cp-none')].map(n => n.textContent.trim());
    assert.ok(nones.includes('Nothing has been settled on this clause yet.'),
      'and it names what is ABSENT — "nothing has been asked" would be untrue '
      + 'the moment an ask sits on the table twelve pixels above it');
    assert.ok(nones.includes('Nothing is on the table for this clause.'));
  });

  test('a live ask is ON THE TABLE ONLY — never in the history as well', async () => {
    /* REVERSED IN PLACE, 16 Aug 2026 (owner-reported): "when i redline, the new
       change appears On the Table and also as the last redline which is
       redundant. It should only appear On the Table and once resolved it takes
       its place at the bottom of the sequence in history."

       This used to assert the opposite, on the reasoning that "what am I
       deciding" and "how did this clause get here" are different questions and
       an open ask is a true answer to both. Measured against the screen, that
       is not worth the line it costs: the two sections sit twelve pixels apart,
       so a live ask printed itself twice, identically, and the reader has to
       work out that they are one thing. The SEQUENCE is not broken by the
       change — a settled ask joins the history at the bottom, which is where
       seq order puts it anyway. */
    const p = await bench();
    const box = page(p);
    const b = bodies(box).find(x => x.querySelector('.rl-cp-row'));
    assert.ok(b, 'the clause with the ask on it has rows');
    const secs = [...b.querySelectorAll('.rl-cp-sec')];
    const table = secs.find(s => /On the table/.test(s.querySelector('.rl-cp-h').textContent));
    const hist = secs.find(s => /History/.test(s.querySelector('.rl-cp-h').textContent));
    assert.equal(table.querySelectorAll('.rl-cp-row').length, 1, 'on the table');
    assert.equal(hist.querySelectorAll('.rl-cp-row').length, 0, 'and NOT in the history');
    assert.equal(table.querySelector('.rl-cp-row b').textContent, p.c.changes[0].id);
    /* …and the history's empty line says what is actually absent. "Nothing has
       been asked about this clause yet" would be untrue with an ask sitting
       twelve pixels above it. */
    assert.match(hist.querySelector('.rl-cp-none').textContent, /Nothing has been settled/);
  });

  test('a settled ask leaves the table and stays in the history', async () => {
    /* This is the panel earning its place: a decided change leaves the change
       column for good, and until now the ask tag on the clause was the only
       handle left on it. */
    const p = await bench();
    p.win.negoResolve(p.c, p.c.changes[0].id, 'rejected',
      { side: 'owner', by: 'Young Mbagaya', reply: 'Sixty is too long.' });
    const box = page(p);
    const b = bodies(box).find(x => x.querySelector('.rl-cp-row'));
    const secs = [...b.querySelectorAll('.rl-cp-sec')];
    const table = secs.find(s => /On the table/.test(s.querySelector('.rl-cp-h').textContent));
    const hist = secs.find(s => /History/.test(s.querySelector('.rl-cp-h').textContent));
    assert.equal(table.querySelectorAll('.rl-cp-row').length, 0, 'nothing left to decide');
    assert.equal(hist.querySelectorAll('.rl-cp-row').length, 1,
      'and it takes its place in the history — the two sections are one list, split by one predicate');
    assert.match(hist.querySelector('.rl-cp-why').textContent, /Sixty is too long/,
      'with the reason the refusal travelled with');
  });

  test('the wording of a change is the change\'s own stored ops, never a re-diff', async () => {
    /* The stored ops are inside the fingerprint. A mark drawn from a fresh
       diff would not be the mark the other side verified. One builder, shared
       with the ask reveal, so the two cannot drift. */
    assert.match(SRC, /function rlChangeWordingHtml\(ch\)\{/);
    assert.match(SRC, /const wording = rlChangeWordingHtml\(ch\);/,
      'the ask reveal asks the same builder');
    assert.match(SRC, /<div class="rl-cp-wd">\$\{rlChangeWordingHtml\(ch\)\}<\/div>/);
  });
});

describe('f210 (4) — one reading, one producer', () => {
  test('the panel\'s bodies are built by the canvas and rendered by the panel', async () => {
    /* Everything the panel needs — which changes are on which clause, which of
       them the wall hides, whether this seat has hands — has already been
       worked out by redlineDocHtml, and asking it twice is how two surfaces
       come to disagree about one clause. */
    assert.match(SRC, /const _cpBodies = \[\];\s*\n\s*const _cpDoc = redlineDocHtml\(c, \{ \.\.\.opts, cpSink: _cpBodies \}\);/);
    assert.match(SRC, /\$\{rlClausePanelHtml\(_cpBodies\)\}/);
    assert.equal((SRC.match(/opts\.cpSink\.push\(rlClausePanelBodyHtml\(/g) || []).length, 1,
      'exactly one call site — the sink');
  });

  test('the panel body is NOT rendered inside the clause', async () => {
    /* The first build put it there, hidden. A hidden node is still in the DOM
       and this page is read by measuring the DOM: three of this file's own
       neighbours immediately counted four paragraphs where the document has
       two, and found an unattributed mark that was a history row rather than
       anything on the paper. */
    const p = await bench();
    const box = page(p);
    assert.equal(box.querySelectorAll('#rl-doc .rl-cp-src').length, 0);
    assert.ok(bodies(box).length >= 2, 'they live in the panel');
  });

  test('and the panel is written AFTER the document it is about', async () => {
    /* It holds a copy of every clause's wording, so written FIRST it answers to
       the sheet's own selectors before the sheet does. paper-grows-verify
       caught exactly that: `querySelector('.redline-page .rl-tool')` — how the
       clause toolbar is measured — started returning a hidden button inside the
       panel, a 0x0 box, at every type setting. Two fixes together: the panel's
       own acts stopped wearing .rl-tool, and the panel moved last. It is
       position:absolute, so nothing about where it appears changed. */
    const p = await bench();
    const box = page(p);
    const html = box.innerHTML;
    assert.ok(html.indexOf('id="rl-doc"') < html.indexOf('id="rl-cp"'),
      'the document first, the panel after it');
    assert.equal(box.querySelectorAll('#rl-cp .rl-tool').length, 0,
      'and nothing in the panel answers to the sheet\'s tool-pill class');
    assert.ok(box.querySelectorAll('#rl-cp .rl-cp-act').length >= 2,
      'they wear the panel\'s own class instead');
  });

  test('and the clause count of paragraphs is what the document has', async () => {
    const p = await bench();
    const box = page(p);
    const cl = box.querySelector('#rl-doc section.rl-clause');
    assert.equal(cl.querySelectorAll('.rl-cp-src').length, 0,
      'the clause carries no second copy of its own wording');
    assert.equal(cl.querySelectorAll('.rl-cp-stands, .rl-cp-row').length, 0,
      'nor any of the panel\'s furniture, which is what poisoned the DOM queries');
  });
});

describe('f210 (5) — where it is not drawn', () => {
  test('not on a read-only copy', async () => {
    const p = await bench();
    const box = page(p, { readonly: true });
    assert.equal(pills(box).length, 0, 'a door promising something the page would refuse');
    assert.equal(bodies(box).filter(b => b.querySelector('.rl-cp-acts')).length, 0,
      'and no acts inside the panel either');
  });

  test('not for a seat with no hands', async () => {
    const p = await bench();
    const box = page(p, { canEdit: false });
    assert.equal(pills(box).length, 0);
  });

  test('not on a canvas rendered with no panel — the Word export', async () => {
    /* redlineDocHtml is also what the tracked-changes export reads. A door
       is drawn only where the room behind it exists. */
    const p = await bench();
    const box = p.doc.createElement('div');
    box.innerHTML = p.win.redlineDocHtml(p.c, { side: 'owner', hiddenIds: [] });
    assert.equal(box.querySelectorAll('.rl-cp-pill').length, 0);
    assert.equal(box.querySelectorAll('.rl-cp-src').length, 0);
    const cv = read('js/views/contract.js');
    assert.match(cv, /redlineDocHtml\(c,\{side\}\)/, 'the export passes no sink');
  });
});

describe('f210 (6) — the wall holds through the panel too', () => {
  test('the other side\'s unsent draft is not in the panel', async () => {
    /* The canvas walls it out of the document; the panel is built from what the
       canvas walked, so it inherits the wall rather than re-deriving it. That
       is the whole reason for the sink. */
    const p = await bench({ ask: false });
    await p.win.negoFileProposal(p.c,
      p.win.negoBaseText(p.c).replace('thirty (30) days', 'ninety (90) days'),
      { side: 'counterparty', author: 'Amina Wanjiru' });
    const ch = p.c.changes[0];
    const box = page(p, { hiddenIds: [ch.id] });
    const txt = [...bodies(box)].map(b => b.textContent).join(' ');
    assert.ok(!txt.includes(ch.id),
      'nothing in the panel says a change exists that this seat may not see');
    assert.ok(!/ninety \(90\)/.test(txt), 'nor its wording');
  });
});

describe('f210 (7) — the ways out, and where they are armed', () => {
  test('close button, the pill again, and Escape', async () => {
    /* REVERSED IN PLACE, 16 Aug 2026. This used to name a backdrop as one of
       the three. The scrim is gone — the owner asked for the contract to stay
       lit and usable beside the panel — and with it gone the PILL is reachable
       again, which makes pressing it a second time the third way out. */
    const p = await bench();
    const box = page(p);
    assert.ok(box.querySelector('#rl-cp-min[data-rl-cp-close]'), 'the ✕');
    assert.equal(box.querySelector('#rl-cp-scrim'), null, 'no backdrop');
    assert.match(SRC, /if \(ev\.key !== 'Escape' \|\| !rlCpOpenId\(\)\) return;/, 'and Escape');
    assert.match(SRC, /const mr = document\.getElementById\('modal-root'\);\s*\n\s*if \(mr && mr\.innerHTML\.trim\(\)\) return;/,
      'which defers to a dialog on top of it, as the queue\'s own handler does');
  });

  test('there is no scrim, so the contract stays lit and stays usable', async () => {
    /* Owner-reported 16 Aug 2026, in the same breath as the width and the
       shake: keep the contract visible, "it has to remain active". A dimmed
       backdrop is right for the queue — a reading order you step through — and
       wrong here, where the whole point is reading the panel AGAINST the
       wording it is about. */
    const p = await bench();
    const box = page(p);
    assert.equal(box.querySelector('#rl-cp-scrim'), null, 'no scrim in the markup');
    assert.doesNotMatch(SRC, /rl-cp-scrim/, 'and none left in the stylesheet or the wiring either');
  });

  test('the panel has NO width of its own — it IS the cards column', async () => {
    /* REVERSED IN PLACE, 16 Aug 2026, and it reverses this claim's own
       replacement from the same day. It shipped with a number (520px), then
       with a proportion (48%), and both were the same mistake in different
       clothes: a second opinion about how wide the right of this page should
       be, standing beside the one the reader already sets with the divider.
       Two opinions drift, and the proportion's drift was visible — it covered
       220px of the contract's own words.

       Owner-asked: "Stop it at the cards column so no words are covered. End at
       cards column but also in the position where you can expand it and
       minimize right to left with the cards and the contracts using the divider
       feature already available."

       So it is placed in the grid's SECOND TRACK and inset to it. An
       absolutely-positioned child of a grid container is laid out against the
       grid AREA it names, so the divider drives it with no JavaScript and there
       is nothing to keep in step. */
    assert.match(SRC, /\.redline-page \.rl-cp\{[\s\S]*?grid-column:2;grid-row:1;/,
      'it names the cards column\'s own track');
    assert.match(SRC, /\.redline-page \.rl-cp\{[\s\S]*?inset:0;width:auto;/,
      'and takes that track whole, with no width of its own');
    assert.doesNotMatch(SRC, /\.redline-page \.rl-cp\{[\s\S]*?width:clamp/,
      'the proportion is gone, not merely overridden');
  });

  test('and nothing keeps the panel and the divider in step, because nothing has to',
    async () => {
    /* The property worth pinning is an ABSENCE: the resizer writes the grid's
       columns and the panel is one of them, so there is no second writer to
       fall out of date. A rlLayoutResizer that started setting the panel's
       width would be exactly the drift this reversal removed. */
    const resizer = SRC.slice(SRC.indexOf('function rlLayoutResizer'),
      SRC.indexOf('function rlLayoutResizer') + 1600);
    assert.doesNotMatch(resizer, /rl-cp/, 'the resizer does not know the panel exists');
  });

  test('the grid CLIPS rather than hides, or the parked panel can be scrolled to',
    async () => {
    /* The reported shake, and its cause. Measured: with the panel parked off the
       right edge the grid's scrollWidth was 2008 against a clientWidth of 1462.
       overflow:hidden shows no bar but still makes a SCROLL BOX, and moving
       focus into the panel at the instant it opens made the browser scroll that
       box sideways — dragging the contract and the change column left and
       snapping them back as the slide finished. Two independent answers: no
       scroll box at all, and a focus call that asks not to scroll. */
    assert.match(SRC, /\.redline-page #rl-grid\.nego-work\{overflow:clip\}/,
      'written at a weight that beats the engine\'s own id-scoped overflow:hidden');
    assert.match(SRC, /close\.focus\(\{ preventScroll: true \}\)/);
  });

  test('the listener is armed at MODULE LOAD, not inside a renderer', async () => {
    /* A listener registered by the owner's page cannot belong to the
       counterparty's mount. That exact fault made the unsent band's Send dead
       on their seat for a day (15 Aug 2026), and it survived a browser check
       because the harness drew both seats. Asserted structurally: the guard
       must sit at column 0, never indented inside a function. */
    assert.match(SRC, /^if \(typeof document !== 'undefined' && !document\._rlCpWired\)\{$/m);
  });

  test('the pill stops its own press', async () => {
    /* It sits inside .nego-clause, whose own press navigates to the card. A
       door that also moves you is two acts on one press — the same rule the
       ask tag carries. */
    assert.match(SRC, /if \(opener\)\{[\s\S]{0,400}?ev\.preventDefault\(\); ev\.stopPropagation\(\);/);
  });

  test('a repaint re-marks the open body, and shuts the panel if the clause has gone', async () => {
    const p = await bench();
    const box = page(p);
    const id = pills(box)[0].getAttribute('data-rl-cp-open');
    p.win.rlCpSetShown(box, id);
    box.innerHTML = p.win.redlinePanesHtml(p.c, { side: 'owner', hiddenIds: [] });
    assert.equal(bodies(box).filter(b => b.classList.contains('is-on')).length, 1,
      'the fresh markup already carries the open body marked');
    p.win.rlCpPaint(box);
    assert.equal(p.win.rlCpOpenId(), id);
    /* Now the clause is not on the page at all. */
    const empty = p.doc.createElement('div');
    empty.className = 'redline-page';
    empty.innerHTML = '<div id="rl-cp"><div id="rl-cp-body"></div></div>';
    p.win.rlCpPaint(empty);
    assert.equal(p.win.rlCpOpenId(), null,
      'a panel held open over wording that is not on the paper is the two disagreeing');
  });
});

describe('f210 (8) — "as it stands" is what stands', () => {
  test('it reads negoClauseNowById, never the round baseline', async () => {
    /* Adopting a change does not move the baseline — only closing the round
       does. A panel headed "as it stands" printing the baseline would state the
       wording that was in force BEFORE the adoption the reader had just made,
       which is the whole MK-311 class of fault. */
    assert.match(SRC, /const standing = \(typeof negoClauseNowById === 'function'\)\s*\n\s*\? \(negoClauseNowById\(c, cl\.clauseId\) \|\| cl\) : cl;/);
  });

  test('and an adopted change is in it', async () => {
    const p = await bench();
    p.win.negoResolve(p.c, p.c.changes[0].id, 'accepted', { side: 'owner', by: 'Young Mbagaya' });
    const box = page(p);
    const b = bodies(box).find(x => x.querySelector('.rl-cp-row'));
    const stands = b.querySelector('.rl-cp-stands').textContent;
    assert.match(stands, /sixty \(60\)/, 'the adopted wording is the wording in force');
    assert.ok(!/thirty \(30\)/.test(stands), 'and the wording it replaced is not');
  });
});

describe('f210 (9) — both languages', () => {
  for (const k of ['ng_cp_edit', 'ng_cp_open_title', 'ng_cp_close_title', 'ng_cp_stands',
    'ng_cp_stands_note', 'ng_cp_table', 'ng_cp_table_none', 'ng_cp_history',
    'ng_cp_history_none', 'ng_cp_acts']){
    test(`${k} is defined twice`, () => {
      assert.equal((I18N.match(new RegExp(`\\b${k}:`, 'g')) || []).length, 2,
        'one English, one Swedish');
    });
  }
});

describe('f210 (10) — the twin renderer carried the MK-311 fault and now does not', () => {
  test('negoDocHtml picks by MEASUREMENT, not by age', async () => {
    /* THE DUPLICATION WARNING IN ITS LEAST OBVIOUS DIRECTION. redlineDocHtml
       was corrected on 15 Aug 2026 — a sentence struck by their ask, adopted by
       us, still printed in full — and this canvas, which is what the contract
       tab and the room draw, went on making exactly the same mistake with
       `chs[chs.length - 1]`. The two renderers disagreed about what the
       contract said. */
    assert.doesNotMatch(SRC, /const ch = Array\.isArray\(chs\) \? \(chs\.length \? chs\[chs\.length - 1\] : null\)/,
      'the old newest-wins line is gone from negoDocHtml');
    /* STRONGER SINCE 21 Aug 2026, and this is the point of that day's merge:
       the rule is no longer WRITTEN TWICE and asserted to match in two places.
       Both renderers ask negoLeadChange, which is the one reading, so they
       cannot drift again — which is what they did for a day and what made the
       contract on screen untrue. The renderers themselves stay separate on
       purpose: they draw different surfaces. It is the READING that may never
       be duplicated. */
    assert.match(SRC, /function negoLeadChange\(c, cl, chs\)\{/,
      'the one reading exists');
    const asks = (SRC.match(/=\s*negoLeadChange\(c, cl, /g) || []).length;
    assert.equal(asks, 2, 'and BOTH document renderers ask it — no more, no fewer');
    /* Neither may keep a copy: the loops that used to sit inline are gone. */
    assert.doesNotMatch(SRC, /measuredOnStanding/,
      'redlineDocHtml keeps no private copy of the rule');
    assert.doesNotMatch(SRC, /if \(_list\.length === 1\) ch = _list\[0\];/,
      'and negoDocHtml keeps none either');
  });

  test('both renderers draw the adopted wording on a clause carrying a rival', async () => {
    /* The reported fault, measured on both canvases at once. Two changes
       measured against the SAME wording are rivals; adopting one and leaving
       the other pending is exactly the state the screenshot showed. */
    const p = await bench({ ask: false });
    const base = p.win.negoBaseText(p.c);
    await p.win.negoFileProposal(p.c, base.replace('thirty (30) days', 'sixty (60) days'),
      { side: 'counterparty', author: 'Amina Wanjiru' });
    const first = p.c.changes[0];
    p.win.negoResolve(p.c, first.id, 'accepted', { side: 'owner', by: 'Young Mbagaya' });
    /* A rival measured against the same baseline, staged by hand: the funnel
       supersedes a live rival on filing, so the ordinary route to this shape is
       a legacy record. */
    p.c.changes.push(Object.assign({}, first, {
      id: 'CHG-RIVAL', seq: (first.seq || 0) + 1, status: 'pending',
      resolvedBy: undefined, withdrawn: false,
      newText: base.replace('thirty (30) days', 'ninety (90) days'),
      ops: [{ op: 'ins', text: base.replace('thirty (30) days', 'ninety (90) days') }],
    }));
    const boxA = p.doc.createElement('div');
    boxA.innerHTML = p.win.redlineDocHtml(p.c, { side: 'owner', hiddenIds: [] });
    const boxB = p.doc.createElement('div');
    boxB.innerHTML = p.win.negoDocHtml(p.c, { side: 'owner' });
    for (const [name, box] of [['redlineDocHtml', boxA], ['negoDocHtml', boxB]]){
      assert.match(box.textContent, /sixty \(60\)/,
        `${name} draws the adopted wording, not only the newest rival`);
    }
  });
});

describe('f210 (11) — the editing is in the panel', () => {
  test('the acts are the ＋ and the Copilot; Direct Edit has left', async () => {
    /* Owner-asked 16 Aug 2026: "Direct edit will not be needed because the
       window is already open for direct editing." It is the same act as the ＋
       beside it, one press further away and pointed at the clause BEHIND the
       panel. */
    const p = await bench();
    const box = page(p);
    const b = bodies(box)[0];
    /* REVERSED IN PLACE AGAIN, 19 Aug 2026. On 16 Aug this required ONE button:
       the Copilot had become plain violet WORDS, on the reasoning that a door
       and a label twelve pixels apart was the door doing the label's job badly.
       The owner has now asked for the button back — "change 'edit with copilot'
       to be a button which if clicked, it takes you to copilot and you can edit
       the entire clause" — and the ground under the old reasoning has moved
       with it: the paper's highlight menu is OFF on this seat, so the words
       named the only Copilot route on the page and it was one nobody could see.
       TWO buttons, and Direct Edit is still not one of them. */
    const acts = [...b.querySelectorAll('.rl-cp-acts button')];
    assert.equal(acts.length, 2, 'the ＋ and the Copilot, and nothing else');
    assert.ok(acts[0].hasAttribute('data-rl-cp-edit'), 'the ＋ leads');
    assert.ok(acts[1].hasAttribute('data-nego-ai-clause'),
      'and the Copilot beside it hands the whole clause over');
    assert.equal(b.querySelector('.rl-cp-ai-note'), null,
      'the words-without-a-pill are retired, not left beside their own button');
    assert.equal(b.querySelector('.rl-cp-acts [data-nego-edit]'), null,
      'Direct Edit is not in the panel');
    /* REVERSED IN PLACE, 16 Aug 2026 (same day, later report). This used to
       assert Direct Edit SURVIVED on the clause's hover row — "a different
       place with a different reason; retiring it there is its own piece". The
       owner then retired that piece off a screenshot of the row itself: "there
       should be no ability to make edits on the contract itself … All edits
       will happen on the side panel." So the whole tool row is gone from this
       canvas — no Direct Edit, no clause-level Copilot button — and the only
       doors into writing are the Edit pill (the panel's ＋) and a highlight on
       the paper, which is a statement of scope rather than a button. The
       room's own nego-tool row (negoDocHtml) is a different surface with no
       panel and is deliberately untouched. */
    assert.equal(box.querySelector('#rl-doc .rl-tools'), null,
      'the clause tool row is gone from the paper');
    assert.equal(box.querySelector('#rl-doc [data-nego-edit]'), null,
      'no edit door on the contract itself');
    assert.equal(box.querySelector('#rl-doc [data-nego-ai-clause]'), null,
      'and no clause-level Copilot button either');
  });

  test('the ＋ opens the ENGINE\'s editor, not a second one', async () => {
    /* ONE EDITOR, TWO HOMES. Everything the editor carries — the formatting
       bar, the two-step save, the reason question and its Skip, the
       fingerprint, every refusal — is the same code in both places, so the two
       can never come to disagree about what filing a change costs. The
       difference is three lines: which element it replaces. */
    assert.match(SRC, /host\.querySelectorAll\('\[data-nego-edit\],\[data-rl-cp-edit\]'\)/,
      'one handler, both doors');
    assert.match(SRC, /const inPanel = b\.hasAttribute\('data-rl-cp-edit'\);/);
    assert.match(SRC, /const body = inPanel \? block\.querySelector\('\.rl-cp-stands'\)/,
      'in the panel it opens on the "As it stands" wording');
    assert.equal((SRC.match(/holder\.setAttribute\('data-nego-editor'/g) || []).length, 1,
      'and there is exactly one place an editor is built');
  });

  test('the ＋ says which act it is', async () => {
    /* With one of OUR asks already pending the engine continues that draft
       rather than starting a rival — its own rule, not a decision taken here —
       so the button must not promise "new wording" over a press that does
       something else. */
    const p = await bench({ side: 'owner', author: 'Young Mbagaya' });
    /* The body for the clause the ask is ON — the panel holds one per clause
       and every other clause is untouched, which is itself the point. */
    const onIt = bodies(page(p)).find(b => b.querySelector('.rl-cp-row'));
    assert.match(onIt.querySelector('[data-rl-cp-edit]').textContent, /Continue your draft/);
    const untouched = bodies(page(p)).find(b => !b.querySelector('.rl-cp-row'));
    assert.match(untouched.querySelector('[data-rl-cp-edit]').textContent, /Propose new wording/,
      'every other clause still offers new wording');
    const q = await bench({ ask: false });
    assert.match(page(q).querySelector('.rl-cp-acts [data-rl-cp-edit]').textContent,
      /Propose new wording/);
  });

  test('THEIRS pending is not ours — the ＋ still offers new wording', async () => {
    /* The engine stacks a new change when a different hand comes back, so a
       counterparty ask on the clause does not make this "continue your draft". */
    const p = await bench();                       // their ask, by default
    const onIt = bodies(page(p)).find(b => b.querySelector('.rl-cp-row'));
    assert.match(onIt.querySelector('[data-rl-cp-edit]').textContent, /Propose new wording/);
  });

  test('the panel\'s editor does not follow the reader\'s DOCUMENT type', async () => {
    /* Every piece of the editor's furniture was taught to scale on --doc-scale
       (15 Aug 2026, the third report of one fault), and --doc-scale is written
       on the .redline-page ROOT by the document-type stepper. Inside the panel
       that would be a Save button shrinking because somebody made the PAPER
       smaller. The paper scales; the panel does not. */
    assert.match(SRC, /\.redline-page \.rl-cp-src\{--doc-scale:1\}/);
  });

  test('and the ＋ stands down while the panel is being written in', async () => {
    /* A door the reader is already standing in. Pressing it again is refused in
       silence by the handler (it returns on an open bar), and a control whose
       press does nothing is one the reader blames themselves for. */
    assert.match(SRC, /\.redline-page \.rl-cp-src\.is-editing \.rl-cp-acts\{display:none\}/);
  });

  test('the counterparty gets the ＋ too — they propose on this engine as well',
    async () => {
    /* The duplication warning in its ordinary direction: the panel is built in
       the shared panes and their page mounts the same component, so a control
       added for our seat is on theirs unless something stops it. Nothing should
       — proposing wording is exactly what their page is for. */
    const p = await bench();
    const box = page(p, { side: 'counterparty' });
    const plus = box.querySelector('.rl-cp-acts [data-rl-cp-edit]');
    assert.ok(plus, 'the ＋ is on their seat');
    assert.equal(box.querySelector('.rl-cp-acts [data-nego-edit]'), null,
      'and Direct Edit is gone from theirs as well, not only ours');
  });

  test('nothing in the panel is drawn for a seat with no hands', async () => {
    const p = await bench();
    const box = page(p, { readonly: true });
    assert.equal(box.querySelector('.rl-cp-acts'), null);
    assert.equal(box.querySelector('[data-rl-cp-edit]'), null);
  });
});

describe('f210 (12) — the Copilot', () => {
  test('"Edit with Copilot" is a BUTTON, and it hands over the whole clause',
    async () => {
    /* REVERSED IN PLACE, 19 Aug 2026, back to what it asserted before 16 Aug —
       and the reversal is the owner's, in these words: "change 'edit with
       copilot' to be a button which if clicked, it takes you to copilot and you
       can edit the entire clause."

       THE TWO ROUTES ARE DIFFERENT SIZES and that is why both are pinned here:
       this button hands the WHOLE clause over, the highlight inside the panel's
       editor hands ONE SENTENCE. The second is still a legal pane, asserted
       below, so the hint line under these buttons stays a promise the page
       keeps. */
    const p = await bench();
    const btn = page(p).querySelector('.rl-cp-acts [data-nego-ai-clause]');
    assert.ok(btn, 'the button is there');
    assert.match(btn.textContent, /Edit with Copilot/);
    assert.equal(btn.tagName, 'BUTTON', 'pressable, not a caption');
    assert.ok(btn.hasAttribute('data-rl-cp-ai'), 'marked as the panel\'s own Copilot door');
    assert.equal(page(p).querySelector('.rl-cp-ai-note'), null,
      'and the retired words-only signal is not drawn beside it');
    assert.match(SRC, /'\.rl-cp-src \[data-nego-editor\]'/,
      'while the highlight route the hint names is still a legal pane');
  });

  test('a highlight inside the panel\'s editor is a legal selection', async () => {
    /* "Leave the feature where you can highlight a sentence and it allows you
       to edit with copilot and moves you to the copilot assistant chat bot."
       NARROWED TO THE EDITOR, not the panel: the panel also prints the history,
       and a highlight there would be offered a redraft of a settled record. */
    assert.match(SRC, /'\.rl-cp-src \[data-nego-editor\]'/);
    assert.match(SRC, /if \(inPanel\) holder\.setAttribute\('data-clause', clauseId\);/,
      'and the editor carries the clause id a passage is resolved against');
    /* AND THE GUARD THAT BLOCKED IT IS EXEMPTED, NARROWLY. [data-nego-editor]
       is on the "this press is somebody operating the page" list because
       dragging inside the DOCUMENT's clause editor is somebody selecting words
       to bold them, and a menu over the formatting bar there is in the way. In
       the panel the editor IS the writing surface and the ask is the opposite.
       Narrow by construction: the formatting bar is a SIBLING of the holder,
       so its buttons still read as controls. */
    assert.match(SRC, /if \(t\.closest\('\.rl-cp-src \[data-nego-editor\]'\)\) return false;/);
    assert.match(SRC, /holder\.before\(fmt\);/,
      'the formatting bar is placed BEFORE the holder, which is what keeps it outside the exemption');
  });

  test('the offer narrows there to one action, through the SAME menu', async () => {
    /* A list, not a fork. Same builder, same routing, same refusals — this
       file's own rule that "a second menu would be a second set of refusals to
       keep in step". */
    const p = await bench();
    const { win } = p;
    win.document.body.innerHTML = '';
    const ctx = { c: p.c, text: 'some chosen wording', clauseId: 'x',
      rect: { left: 10, top: 10, width: 40, height: 12 } };
    const one = win.rlSelMenu({ ...ctx, only: ['edit'] });
    const labels = [...one.querySelectorAll('[data-nego-ai]')].map(b => b.textContent.trim());
    assert.equal(labels.length, 1, 'one action in the panel');
    assert.match(labels[0], /Edit with Copilot/);
    /* AND THE DOCUMENT'S OWN MENU IS UNTOUCHED — deliberately left alone, and
       said out loud. Simplify and Compare-to-our-standard are acts on the
       clause AS IT STANDS; inside the panel the reader is highlighting their
       own half-typed draft, where both are a different question. */
    const all = win.rlSelMenu({ ...ctx });
    const allLabels = [...all.querySelectorAll('[data-nego-ai]')].map(b => b.textContent.trim());
    assert.equal(allLabels.length, 3, 'the contract keeps all three');
    assert.match(allLabels.join('|'), /Simplify/);
    assert.match(allLabels.join('|'), /Compare to our standard/);
  });

  test('an unknown narrowing falls back to the whole list, never to an empty menu',
    async () => {
    const p = await bench();
    const menu = p.win.rlSelMenu({ c: p.c, text: 'words', clauseId: 'x',
      rect: { left: 10, top: 10, width: 40, height: 12 }, only: ['no-such-action'] });
    assert.equal(menu.querySelectorAll('[data-nego-ai]').length, 3);
  });
});

describe('f210 (14) — three faults reported the morning after the editing landed', () => {
  test('the Copilot press handed straight over — no menu to anchor', async () => {
    /* KEPT AFTER THE BUTTON WENT (16 Aug 2026). The button is a label now, so
       the panel no longer presses this path — but the clause toolbar's own
       Copilot still does, and `direct` is what stops a one-row menu being drawn
       for anything else that narrows the offer. The rule outlived its first
       caller; deleting the claim with the button would leave it unguarded. */
    /* Owner-reported 16 Aug 2026: "When I click edit with copilot the panel
       disappears and the copilot dropdown appears on the top right corner."

       Reproduced. The button raised the same three-item menu the clause toolbar
       raises, anchored on ITSELF — and the panel is shut in the capture phase
       before the menu is built, which sets its body to display:none, so the
       button's rect came back all zeros and the menu was clamped into the
       corner of the window. A dropdown detached from the thing that summoned
       it, offering two actions the owner had already asked this surface not to
       offer.

       Both halves answered by taking the menu out: a control already narrowed
       to ONE action is a menu with one row, and a menu with one row is a press
       the reader has to make twice. */
    assert.match(SRC, /const fromPanel = !!btn\.closest\('\.rl-cp-src'\);/);
    assert.match(SRC, /only: fromPanel \? \['edit'\] : null, direct: fromPanel/);
    assert.match(SRC, /if \(ctx\.direct && actions\.length === 1\)\{/,
      'and rlSelMenu hands it to rlAiPropose rather than drawing a one-row menu');
  });

  test('rlSelMenu returns no menu on a direct press, and still draws one otherwise',
    async () => {
    const p = await bench();
    const { win } = p;
    let handed = null;
    const real = win.rlAiPropose;
    win.rlAiPropose = ctx => { handed = ctx.action && ctx.action.id; };
    const ctx = { c: p.c, text: 'wording', clauseId: 'x',
      rect: { left: 10, top: 10, width: 40, height: 12 } };
    const none = win.rlSelMenu({ ...ctx, only: ['edit'], direct: true });
    assert.equal(none, null, 'nothing is drawn');
    assert.equal(handed, 'edit', 'it went straight to the Copilot');
    assert.equal(win.document.querySelectorAll('.nego-selmenu').length, 0,
      'and no stray dropdown is left on the page');
    /* A direct press with the whole list still gets a menu — `direct` is not a
       licence to pick for the reader. */
    const menu = win.rlSelMenu({ ...ctx, direct: true });
    assert.ok(menu && menu.querySelectorAll('[data-nego-ai]').length === 3);
    win.rlAiPropose = real;
  });

  test('a change that ARRIVED on the payload is not held as unsent', async () => {
    /* Owner-reported: "The counterparty side the changes do not seem to be
       working." Reproduced on the browser harness, and it PREDATES the clause
       panel — measured against the commit before it, same numbers.

       The portal's guard was `!PORTAL_NEGO_PROPOSED_SENT[ch.id]`, and that
       store starts empty in a fresh browser: it only fills when this reader
       presses Send. So on a link carrying asks this side had already made in an
       earlier round, the first act of any kind swept every one of them into
       "held here until you send them" — a reader who redlined once was told six
       changes were not sent and offered "Send all 6", over asks the owner had
       been looking at for a week.

       The payload IS the record of what has reached the other side, so it is
       asked each time rather than stored: nothing to persist, nothing to
       migrate, and no second store to keep in step. */
    const src = read('js/views/portal.js');
    assert.match(src, /const arrived = new Set\(\(\(\(p\|\|\{\}\)\.contract\|\|\{\}\)\.changes\|\|\[\]\)/);
    assert.match(src, /&& !arrived\.has\(ch\.id\) && !PORTAL_NEGO_PROPOSED_SENT\[ch\.id\]/);
    assert.match(src, /if\(arrived\.has\(ch\.id\) && PORTAL_NEGO_PROPOSED\[ch\.id\]\) delete PORTAL_NEGO_PROPOSED\[ch\.id\];/,
      'and a stale entry from before this rule is cleared, since nothing else removes one');
  });
});

describe('f210 (15) — how the panel reads', () => {
  test('the acts sit under "As it stands", not at the foot of the panel', async () => {
    /* Owner-asked 16 Aug 2026: "these buttons should appear under the As it
       Stands clause." They were below the history, which put the ＋ furthest
       from the one thing it copies. This block IS what the ＋ duplicates, so the
       button and its subject read as one thing — and once the editor is open it
       is at the top of the panel rather than under a scroll of settled asks. */
    const p = await bench();
    const b = bodies(page(p))[0];
    const secs = [...b.children].map(n => n.className);
    const iStands = secs.findIndex(k => /rl-cp-sec/.test(k) && !/acts/.test(k));
    const iActs = secs.findIndex(k => /rl-cp-acts/.test(k));
    assert.ok(iActs > iStands, 'after the wording it acts on');
    assert.equal(iActs, iStands + 1, 'and immediately after it — nothing in between');
    const heads = [...b.querySelectorAll('.rl-cp-h')].map(h => h.textContent.trim());
    assert.deepEqual(heads, ['As it stands', 'Change this clause', 'On the table', 'History']);
  });

  test('additions are green and nothing else — and the rule is at the BASE', async () => {
    /* REVERSED IN PLACE, 16 Aug 2026. This asserted a rule scoped to the panel,
       written while the paper was still on the tracked-changes convention. The
       owner reported it a second time, pointing at the paper, so the rule moved
       to .nego-ins itself and the panel's copy went — two rules for one fact is
       how they come to differ. The claim that matters now is that no scoped
       copy has crept back. */
    assert.doesNotMatch(SRC, /\.rl-cp-src \.nego-ins/,
      'no panel-only copy of a rule the base already carries');
    assert.match(SRC, /\.nego-ins\{[^}]*text-decoration:none\}/);
  });

  test('and the PAPER carries the same rule — one fact, one rule', async () => {
    /* REVERSED IN PLACE, 16 Aug 2026. This asserted that the document kept the
       tracked-changes convention while only the panel went plain, and said the
       reason out loud: the document is what anybody cites. The owner reported
       it a second time — the paper was the half being pointed at — so the rule
       moved to the BASE and the panel's copy went with it. Two rules for one
       fact is how they come to differ. */
    assert.doesNotMatch(SRC, /\.nego-ins\{[^}]*border-bottom:2px/);
    assert.doesNotMatch(SRC, /\.nego-ins\{[^}]*font-weight:600/);
    /* radius literal moved to 0 with the square-corner sweep, 20 Aug 2026 */
    assert.match(SRC, /\.nego-ins\{background:var\(--n-ins-bg\);color:var\(--n-ins-fg\);\s*\n\s*border-radius:0;padding:0 3px;text-decoration:none\}/);
    /* AND THE DELETION KEEPS ITS STRIKE. Not an inconsistency: colour alone can
       say "added"; nothing but the strike can say "taken out". */
    assert.match(SRC, /\.nego-del\{[^}]*text-decoration:line-through/);
  });

  test('the signposts are black; the captions under them are not', async () => {
    /* Owner-asked: "the highlighted features that bring your attention to
       something should be in black font so it is not missed." The section
       headings and the change id are what a reader scans for; at neutral-600
       they read as captions ABOUT the content rather than labels ON it. The
       explanatory lines stay grey, because those really are captions. */
    assert.match(SRC, /\.redline-page \.rl-cp-h\{[^}]*color:var\(--color-text\)\}/);
    assert.match(SRC, /\.redline-page \.rl-cp-who b\{color:var\(--color-text\)\}/);
    assert.match(SRC, /\.redline-page \.rl-cp-note,\.redline-page \.rl-cp-none\{[^}]*color:var\(--color-neutral-600\)\}/,
      'the explanatory lines stay quiet');
    assert.match(SRC, /\.redline-page \.rl-cp-who\{[^}]*color:var\(--color-neutral-600\);/,
      'and so does the rest of the meta line — only the id is lifted');
  });
});

describe('f210 (16) — a contract limb keeps its label and hangs its wraps', () => {
  const D = (() => {
    const win = {};
    new Function('window', 'module', read('js/docx.js'))(win, { exports: {} });
    return win;
  })();

  test('a lettered limb keeps its label — it is how the limb is cited', () => {
    /* Owner-reported 16 Aug 2026, off a Copilot proposal: the wording came back
       reading "(a) Manufacture all products…" and what landed in the contract
       was "• Manufacture all products…". DOC_BULLET matched `(a)` along with
       the true bullet marks, and the branch that used it STRIPPED what it
       matched — so every lettered limb the Copilot drafted, and every one in an
       uploaded contract, arrived with its label thrown away.

       js/docx.js already states the rule three lines from the fault, for
       numbers: "Both keep their number: it is the citation." A lettered limb is
       cited the same way — clause 1(b). */
    const html = D.docRichFromText(
      'The Co-Packer shall:\n(a) Manufacture all products to the recipe.\n'
      + '(b) Maintain full traceability of all materials and batch records.');
    assert.ok(html.includes('(a)') && html.includes('(b)'));
    assert.equal((html.match(/<li\b/g) || []).length, 0,
      'not a list — no browser draws "(a)" as a marker, so a list means losing the label');
  });

  test('"a)" and "(iv)" too, and a true bullet still loses its mark', () => {
    assert.ok(D.docRichFromText('a) First limb of the clause.').includes('a)'));
    assert.ok(D.docRichFromText('(iv) Fourth limb of the clause.').includes('(iv)'));
    const bullets = D.docRichFromText('\u2022 One item here.\n\u2022 Another item here.');
    assert.equal((bullets.match(/<li\b/g) || []).length, 2);
    assert.ok(!bullets.includes('\u2022'), 'a bullet mark carries no citation');
  });

  test('numbered clauses are untouched by the split', () => {
    /* The change is to ONE branch. A pattern widened later must not be able to
       turn a number back into a bullet, which is why the label is asked for
       before the mark. */
    const html = D.docRichFromText(
      '3. Payment shall be made within thirty days of a valid invoice being issued.');
    assert.match(html, /<ol start="3">/);
    assert.match(SRC_DOCX, /const labelled = !numbered && !bulleted && DOC_LABEL\.test\(t\);/);
  });

  test('a wrapped limb hangs under its own first word', () => {
    /* Owner-asked: "the words when wrap texted the should not go to the same
       line as the bullet point … so that the words in the first and second line
       are on the same vertical line."

       THE INDENT WAS ALREADY BEING COMPUTED AND NOTHING DREW IT.
       redlineOpsBlocksHtml has always split the opening marker off every line
       and stamped it rl-hang for exactly this; the rule that acts on it was
       scoped to .nego-redline, which is the ROOM's class and not this page's.
       The class was on the element the whole time. */
    assert.match(SRC, /\.redline-page \.rl-doc \.rl-hang\{padding-left:2\.6em;text-indent:-2\.6em\}/);
    assert.match(SRC, /\.redline-page \.rl-cp-src \.rl-hang\{padding-left:2\.6em;text-indent:-2\.6em\}/,
      'and in the panel, which renders the same builder\'s output');
    /* em, not px: the measure follows the reader's document type with the
       wording rather than drifting away from it at either end of the stepper. */
    assert.doesNotMatch(SRC, /\.rl-hang\{padding-left:\d+px/);
  });

  test('and the builder really does stamp it', () => {
    /* The other half of the claim: a rule for a class nothing emits is a rule
       nobody can see is broken. */
    const rl = read('js/redline.js');
    assert.match(rl, /const hang = redlineSplitMarker\(shown\)\.marker \? `\$\{pre\}-hang` : '';/);
    const marker = rl.slice(rl.indexOf('const RL_MARKER'), rl.indexOf('const RL_MARKER') + 200);
    assert.ok(marker.includes('[a-zA-Z]'),
      'and the marker pattern knows a lettered label');
    assert.ok(marker.includes('ivxlcdm'), 'and a roman one');
  });
});

describe('f210 (17) — the pills come off the paper, and the marker moves to the margin', () => {
  test('no ask tags on the contract, on either seat', async () => {
    /* Owner-asked 16 Aug 2026: "remove the pills from the contracts." Four of
       them on one clause heading — CHG-003 ✓ CHG-009 ↩ CHG-011 ↩ CHG-013 ? —
       pushed the clause's own name off its line, which is the fault the tag's
       label was trimmed twice to avoid. They were kept this long for ONE reason
       and it has gone: a settled change leaves the change column, and the tag
       was the only handle left on it. The panel is that handle now. */
    const p = await bench();
    for (const side of ['owner', 'counterparty']){
      const box = page(p, { side });
      assert.equal(box.querySelectorAll('#rl-doc .rl-asktag').length, 0, side);
      assert.equal(box.querySelectorAll('#rl-doc .rl-askrv').length, 0,
        'and no reveal, which nothing could open');
    }
  });

  test('a redlined clause is marked in the MARGIN instead', async () => {
    /* "keep the contract page white but add a thin redline on the right of the
       clause to signal a clause that has been redlined." An amber wash on most
       of the page marks nothing; a rule in the margin says the same thing and
       costs the wording none of its width. */
    const p = await bench();
    assert.ok(page(p).querySelector('#rl-doc .nego-clause.is-changed'),
      'the clause still says it has been argued over');
    /* RE-POINTED 19 Aug 2026: the rule moved from a BORDER on the clause to a
       bar in the sheet's margin, because a border takes width — see the
       claims below. The mark itself is unchanged to look at. */
    /* radius literal moved to 0 with the square-corner sweep, 20 Aug 2026 */
    /* background:var(--danger) since 21 Aug 2026 — the literal #dc2626 IS that
       token, so this rule did not move, only its spelling. See the note at the
       margin-bar test below, and f89's "THE COLOUR IS NAMED, NOT TYPED". */
    assert.match(SRC, /\.rl-clause\.is-changed::after\{content:'';position:absolute;\s*\n\s*top:0;bottom:0;right:-18px;width:3px;border-radius:0;background:var\(--danger\)\}/);
    /* REVERSED IN PLACE, 19 Aug 2026 — and this one was reversed because the
       claim in the comment was NOT TRUE of the code beneath it. "The padding
       is kept so the wording does not shift" described an older arrangement
       where every clause carried padding; the rule next to it had since set
       unmarked clauses to none, so a clause gaining its first change moved
       its wording 14px right and its Edit pill 17px left. Measured, both
       ways, before it was touched.

       The intention was always right, and it is what the code does now: one
       shared gutter on every clause, the rule reserved and transparent until
       there is something to mark, and the marked clause keeping only its own
       vertical air — which moves nothing sideways. */
    assert.match(SRC, /\.rl-clause\.is-changed\{background:none;border:0;border-radius:0;padding:0\}/,
      'a marked clause has exactly the box an unmarked one has');
    assert.match(SRC, /\.rl-clause\.is-changed::after\{content:'';position:absolute;\s*\n\s*top:0;bottom:0;right:-18px/,
      'and the mark is a bar in the sheet\'s own margin, outside the text column');
    assert.match(SRC, /\.redline-page \.rl-clause\{margin:0 0 16px;padding:0\}/,
      'so nothing about the wording moves when a change lands');
  });

  test('and the Reopen moved with them, or the remedy would be unreachable', async () => {
    /* The tag's reveal carried the way back from a settled decision, and the
       accept guard refuses IN WORDS naming reopening as the way out. The two
       had to move together: a refusal whose stated remedy cannot be reached is
       worse than no remedy — this file's own standing rule, and the exact fault
       f208 was written for. */
    const p = await bench();
    p.win.negoResolve(p.c, p.c.changes[0].id, 'rejected',
      { side: 'owner', by: 'Young Mbagaya', reply: 'No.' });
    const b = bodies(page(p)).find(x => x.querySelector('.rl-cp-row'));
    const re = b.querySelector('[data-rl-reopen]');
    assert.ok(re, 'a settled ask offers Reopen in the panel');
    assert.equal(re.getAttribute('data-nego-undo'), p.c.changes[0].id,
      'through the engine\'s own re-open, not a second path');
    /* And the History is where it sits, because that is where a settled ask is. */
    const hist = [...b.querySelectorAll('.rl-cp-sec')]
      .find(x => /History/.test(x.querySelector('.rl-cp-h').textContent));
    assert.ok(hist.contains(re));
  });

  test('and not on a pending ask, the counterparty, or a read-only seat', async () => {
    const p = await bench();
    assert.equal(bodies(page(p)).find(x => x.querySelector('.rl-cp-row'))
      .querySelector('[data-rl-reopen]'), null, 'nothing to undo on a live ask');
    p.win.negoResolve(p.c, p.c.changes[0].id, 'rejected', { side: 'owner', by: 'Y' });
    assert.equal(page(p, { side: 'counterparty' }).querySelector('[data-rl-reopen]'), null,
      'a refusal is reopened by the side that gave it');
    assert.equal(page(p, { readonly: true }).querySelector('[data-rl-reopen]'), null);
  });
});

describe('f210 (13) — the new words, both languages', () => {
  for (const k of ['ng_cp_propose', 'ng_cp_propose_title', 'ng_cp_continue',
    'ng_cp_continue_title', 'ng_cp_copilot', 'ng_cp_copilot_title', 'ng_cp_sel_hint']){
    test(`${k} is defined twice`, () => {
      assert.equal((I18N.match(new RegExp(`\\b${k}:`, 'g')) || []).length, 2,
        'one English, one Swedish');
    });
  }
});

/* ============================================================ */
describe('f210 (18) — History | + notes, default without notes', () => {
  /* Owner-asked 16 Aug 2026: "add a button next to edit that shows history
     with notes. The default will be without notes." Option 2 of three renders
     shown and chosen: a two-way switch beside the EDIT label, dressed like the
     toolbar's reading segments. The default face is the clean panel; "+ notes"
     is ONE CLASS on #rl-cp, and the conversation blocks are hidden by one CSS
     rule — a class flip, never a repaint, which is what keeps the one
     engine-wired composer alive in the DOM whichever face is showing. */

  test('the switch sits in the panel head, beside EDIT, default History', async () => {
    const p = await bench();
    const box = page(p);
    const head = box.querySelector('.rl-cp-head');
    const segs = head && head.querySelector('.rl-cp-segs');
    assert.ok(segs, 'the switch is in the head');
    const [hist, notes] = [...segs.querySelectorAll('[data-rl-cp-notes]')];
    assert.equal(hist.getAttribute('data-rl-cp-notes'), 'off');
    assert.equal(notes.getAttribute('data-rl-cp-notes'), 'on');
    assert.equal(hist.getAttribute('aria-pressed'), 'true', 'History is the default face');
    assert.equal(notes.getAttribute('aria-pressed'), 'false');
    assert.ok(!box.querySelector('#rl-cp').classList.contains('rl-cp-notes'),
      'and the panel opens without notes');
  });

  test('the default face HIDES the conversation by one rule, and + notes shows it', async () => {
    /* jsdom resolves no cascade, so the rule is read at the source — the same
       way f95 reads every radius. The browser half is clause-door-verify's. */
    assert.match(SRC, /\.redline-page \.rl-cp \.rl-cnotes\{display:none\}/,
      'the clean face is the default');
    assert.match(SRC, /\.redline-page \.rl-cp\.rl-cp-notes \.rl-cnotes\{display:block\}/,
      'and one class brings the conversation back');
  });

  test('the press is a class flip — the composer node survives it', async () => {
    const p = await bench();
    p.win.renderRedline();
    const $ = s => p.win.document.querySelector(s);
    const chId = p.c.changes[0].id;
    const boxBefore = $(`#rl-cp-body textarea#nego-ti-${chId}`);
    assert.ok(boxBefore, 'the one composer is in the panel');
    assert.ok(!$('#rl-cp').classList.contains('rl-cp-notes'), 'default: without notes');
    $('[data-rl-cp-notes="on"]').click();
    assert.ok($('#rl-cp').classList.contains('rl-cp-notes'), 'one press shows the notes');
    assert.equal($('[data-rl-cp-notes="on"]').getAttribute('aria-pressed'), 'true');
    assert.ok($('[data-rl-cp-notes="on"]').classList.contains('on')
      && !$('[data-rl-cp-notes="off"]').classList.contains('on'),
      'and the FACE flips with the state — aria alone is invisible pixels');
    assert.equal($(`#rl-cp-body textarea#nego-ti-${chId}`), boxBefore,
      'the SAME node — no repaint, so the engine\'s wiring survives the flip');
    $('[data-rl-cp-notes="off"]').click();
    assert.ok(!$('#rl-cp').classList.contains('rl-cp-notes'), 'and the way back');
    assert.equal($('[data-rl-cp-notes="off"]').getAttribute('aria-pressed'), 'true');
  });

  test('the choice survives a repaint within the sitting, and is not persisted', async () => {
    const p = await bench();
    p.win.renderRedline();
    const $ = s => p.win.document.querySelector(s);
    $('[data-rl-cp-notes="on"]').click();
    p.win.renderRedline();
    assert.ok($('#rl-cp').classList.contains('rl-cp-notes'),
      'a reader who asked for the conversation is reading conversations');
    assert.ok(!/rl-cp-notes|rlCpNotes/i.test(JSON.stringify(p.win.localStorage)),
      'a reading posture is not a setting');
  });

  test('the switch does not open, close or move the panel', async () => {
    const p = await bench();
    p.win.renderRedline();
    const $ = s => p.win.document.querySelector(s);
    const clauseId = p.c.changes[0].clauseId;
    $(`.rl-cp-pill[data-rl-cp-open="${clauseId}"]`).click();
    assert.equal(p.win.rlCpOpenId(), clauseId, 'the panel is open on the clause');
    $('[data-rl-cp-notes="on"]').click();
    assert.equal(p.win.rlCpOpenId(), clauseId,
      'showing the notes must not navigate or shut the panel');
    assert.ok($('#rl-cp').classList.contains('is-open'), 'still open');
  });

  test('both faces speak both languages', async () => {
    const en = read('js/i18n.js');
    for (const k of ['ng_cp_hist', 'ng_cp_hist_notes', 'ng_cp_notes_group',
      'ng_cp_hist_title', 'ng_cp_hist_notes_title'])
      assert.equal((en.match(new RegExp(`${k}:`, 'g')) || []).length, 2,
        `${k} must exist in EN and SV`);
  });
});

/* ============================================================
   F210 — THE CLAUSE BOX IS THE SAME WHETHER OR NOT ANYTHING IS ON IT
   ============================================================
   Owner-asked 19 Aug 2026, off a screenshot: the Edit pill sat 17px further
   left on a redlined clause than on a plain one, and the wording 14px
   further right. The cause was one rule — a marked clause gained padding and
   a rule an unmarked one did not have, and the pill hangs off the clause's
   own edge.

   TWO CHANGES, and the second is why this can never come back through a door
   nobody remembered: the boxes are equal, AND the pill is pinned to the box
   rather than carried by the heading's row. A marker invented later — the
   linked-clause outline, the new-clause tint, whatever comes next — cannot
   move it. The pixels are measured in clause-door-verify; these are the
   rules that produce them. */
describe('f210 (19) — the panel\'s own type stepper', () => {
  /* Owner-asked 20 Aug 2026: "Add the font adjuster to the redline panel
     which will only adjust the panel and nothing more." The toolbar stepper's
     own mechanism — a stored px, the same 8–20 bounds, applied live with no
     repaint — driving a CSS zoom on the panel BODY alone. The standing rule
     that the panel does not follow the DOCUMENT's type (.rl-cp-src
     {--doc-scale:1}) is untouched; this is the panel's own preference. */

  test('the stepper sits in the head, reading 14px, with its OWN readout class', async () => {
    const p = await bench();
    const box = page(p);
    const head = box.querySelector('.rl-cp-head');
    const down = head && head.querySelector('[data-rl-cp-type="down"]');
    const up = head && head.querySelector('[data-rl-cp-type="up"]');
    const out = head && head.querySelector('.rl-cp-type-out');
    assert.ok(down && up && out, 'A− / readout / A＋ are in the panel head');
    assert.equal(out.textContent, '14px', 'the panel\'s own base, not the document\'s 15');
    /* rlSetDocType repaints every .rl-type-out on the page with the DOCUMENT's
       px — one shared class is how the two steppers would come to lie about
       each other's value. */
    assert.ok(!out.classList.contains('rl-type-out'),
      'the readout does not wear the document stepper\'s class');
  });

  test('a press steps the panel and repaints nothing', async () => {
    const p = await bench();
    p.win.renderRedline();
    const $ = s => p.win.document.querySelector(s);
    const panelBefore = $('#rl-cp');
    $('[data-rl-cp-type="up"]').click();
    assert.equal($('.rl-cp-type-out').textContent, '15px', 'one press, one px');
    assert.equal($('#rl-cp').style.getPropertyValue('--cp-zoom'), (15 / 14).toFixed(4),
      'the zoom is the ratio against the panel\'s own base');
    assert.equal($('#rl-cp'), panelBefore, 'the SAME node — a class-and-var flip, never a repaint');
    $('[data-rl-cp-type="down"]').click();
    assert.equal($('.rl-cp-type-out').textContent, '14px', 'and the way back');
  });

  test('the bounds are the document stepper\'s own, and the buttons say so', async () => {
    const p = await bench();
    p.win.renderRedline();
    const $ = s => p.win.document.querySelector(s);
    p.win.rlCpSetType(99);
    assert.equal($('.rl-cp-type-out').textContent, '20px', 'clamped to the shared ceiling');
    assert.ok($('[data-rl-cp-type="up"]').disabled, 'A＋ refuses at the top');
    p.win.rlCpSetType(1);
    assert.equal($('.rl-cp-type-out').textContent, '8px', 'clamped to the shared floor');
    assert.ok($('[data-rl-cp-type="down"]').disabled, 'A− refuses at the bottom');
    p.win.rlCpSetType(14);
  });

  test('only the panel: the zoom is read by the panel body alone, and the document stepper does not touch it', async () => {
    /* jsdom resolves no cascade — the rule is read at the source, the f95 way. */
    assert.match(SRC, /\.redline-page \.rl-cp-body\{[^}]*zoom:var\(--cp-zoom,1\)/,
      'the panel BODY takes the zoom');
    assert.equal((SRC.match(/var\(--cp-zoom/g) || []).length, 1,
      'and nothing else reads it — "only the panel and nothing more"');
    const p = await bench();
    p.win.renderRedline();
    const $ = s => p.win.document.querySelector(s);
    p.win.rlCpSetType(16);
    p.win.rlSetDocType(10);
    assert.equal($('.rl-cp-type-out').textContent, '16px',
      'the document stepper repaints its own readouts and leaves the panel\'s alone');
    assert.ok(!$('.rl-doc') || !String($('.rl-doc').getAttribute('style') || '').includes('--cp-zoom'),
      'and the paper carries no panel zoom');
    p.win.rlCpSetType(14); p.win.rlSetDocType(15);
  });
});

describe('F210 — the clause rail', () => {
  const src = (read('js/views/negotiation.js') + read('js/views/negotiation-css.js'));
  const rule = sel => {
    const i = src.indexOf(sel + '{');
    assert.ok(i > 0, sel + ' is defined');
    return src.slice(i, src.indexOf('}', i));
  };

  test('every clause has the same box, marked or not', () => {
    assert.match(rule('.redline-page .rl-clause'), /margin:0 0 16px;padding:0/,
      'no padding on any of them');
    const marked = rule('.redline-page .rl-clause.is-changed');
    assert.match(marked, /padding:0/, 'including the marked one');
    assert.ok(!/border-right:3px solid #dc2626/.test(marked),
      'the rule is no longer a border — a border takes width from the wording');
    assert.ok(!/padding:12px 14px/.test(marked), 'and the old inset is gone');
  });

  test('the mark is a bar in the margin, not a border on the text', () => {
    const bar = rule('.redline-page .rl-clause.is-changed::after');
    assert.match(bar, /position:absolute/);
    assert.match(bar, /right:-18px/, 'outside the text column, in the white the sheet already has');
    /* NAMED, NOT TYPED (21 Aug 2026, the same move f89 records above it): the
       literal #dc2626 IS --danger, so the rule is unchanged and only its
       spelling moved. The hand-written dark override below is untouched and
       still wins in dark, which is why the census did not shift by a shade. */
    assert.match(bar, /background:var\(--danger\)/);
    assert.match(SRC, /html\.dark .redline-page \.rl-clause\.is-changed::after\{background:#f87171\}/,
      'and it follows the dark theme');
  });

  test('the pill is pinned to the box, not carried by the heading row', () => {
    const pill = rule('.redline-page .rl-cp-pill');
    assert.match(pill, /position:absolute/);
    assert.match(pill, /right:0/);
    assert.ok(!/margin-left:auto/.test(pill),
      'it no longer rides the row, so the row cannot move it');
    assert.match(rule('.redline-page .rl-clause-top'), /position:relative/,
      'and it is pinned to the clause, not the page');
  });

  test('the heading keeps clear of it, at every document size', () => {
    assert.match(rule('.redline-page .rl-clause-h'),
      /padding-right:calc\(62px \* var\(--doc-scale,1\)\)/,
      'reserved in the reader\'s own type scale — the pill grows with it');
  });
});

/* ============================================================
   13 — AND THE DOOR REACHES A CLAUSE YOU PROPOSED
   ============================================================
   Owner-asked 25 Aug 2026, off a screenshot of a payment-terms clause added
   from the playbook: "standard clauses added should be editable as well."

   IT WAS THE ONE THING ON THE PAPER WITH NO WAY BACK INTO IT. An insertClause
   ask is not in the baseline, so negoClauseById answered null and every editing
   door in the product stood down — a reader who added a clause and wanted to
   change thirty days to forty-five had to withdraw the ask and add it again.

   THE FIX IS THE FUNNEL'S OWN REVISION FOLD, not a new act: negoFileChange
   already revises in place when the same side files again on the same clause in
   the same round, and an insert is no different. So the claims here are about
   the ASK KEEPING ITS IDENTITY — same id, one change, previous wording on
   revisions[] — because a second insert would put an invisible extra clause
   into the agreement. */
describe('f210 (13) — a clause you proposed is editable too', () => {
  /* A bench whose contract carries OUR OWN pending insertClause ask, the shape
     the playbook and the clause library both file. */
  async function withInsert(side = 'owner'){
    const p = await bench({ ask: false });
    const list = p.win.negoClauseList(p.c);
    await p.win.negoInsertClause(p.c, list[list.length - 1].clauseId, {
      headingText: 'Payment terms',
      bodyHtml: '<p>Paid within thirty (30) days of the invoice date.</p>',
    }, { side, author: side === 'owner' ? 'Young Mbagaya' : 'Amina Wanjiru' });
    const ask = p.win.negoChanges(p.c).find(x => x.changeType === 'insertClause');
    return { ...p, ask };
  }

  test('the model revises the ask in place — same id, one change, the old wording kept', async () => {
    const p = await withInsert();
    const before = p.ask.id;
    const out = await p.win.negoReviseInsert(p.c, p.ask.clauseId,
      { bodyHtml: '<p>Paid within forty-five (45) days of the invoice date.</p>' },
      { side: 'owner', author: 'Young Mbagaya' });
    assert.ok(out, 'it filed');
    const live = p.win.negoChanges(p.c).filter(x => x.changeType === 'insertClause');
    assert.equal(live.length, 1, 'ONE clause is proposed, not two');
    assert.equal(live[0].id, before, 'and it is the same ask, so it keeps its place');
    assert.match(live[0].newText, /forty-five/);
    assert.equal(live[0].revisions.length, 1, 'the previous wording is on the record');
    assert.match(live[0].revisions[0].newText, /thirty/);
  });

  test('it only ever REVISES — it will not create a clause nobody proposed', async () => {
    const p = await withInsert();
    const n = () => p.win.negoChanges(p.c).length;
    const was = n();
    assert.equal(await p.win.negoReviseInsert(p.c, 'cl_nothing_here',
      { bodyHtml: '<p>x</p>' }, { side: 'owner' }), null,
      'an id with no ask behind it files nothing');
    assert.equal(n(), was, 'and nothing was added');
  });

  test('and never the other side\'s ask — a proposal is answered, not edited', async () => {
    const p = await withInsert('counterparty');
    assert.equal(await p.win.negoReviseInsert(p.c, p.ask.clauseId,
      { bodyHtml: '<p>ours now</p>' }, { side: 'owner' }), null);
    assert.match(p.win.negoChanges(p.c)[0].newText, /thirty/, 'their wording is untouched');
  });

  test('the paper draws the pill on it, like every other clause', async () => {
    const p = await withInsert();
    const box = page(p);
    const proposed = box.querySelector('#rl-doc section.rl-clause-new');
    assert.ok(proposed, 'the proposed clause is on the paper');
    assert.ok(proposed.querySelector('.rl-cp-pill'),
      'and it carries the same door every other clause carries');
    assert.equal(proposed.querySelector('.rl-cp-pill').getAttribute('data-rl-cp-open'),
      p.ask.clauseId, 'pointed at its own clause');
  });

  test('and the panel behind it says AS PROPOSED, because nothing stands yet', async () => {
    const p = await withInsert();
    const box = page(p);
    const body = bodies(box).find(b => b.getAttribute('data-rl-cp-for') === p.ask.clauseId);
    assert.ok(body, 'the panel has a body for it — a door must not open onto nothing');
    const { STRINGS } = require('../js/i18n.js');
    assert.match(body.textContent, new RegExp(STRINGS.en.ng_cp_proposed));
    assert.ok(!/As it stands/.test(body.querySelector('.rl-cp-h').textContent),
      'a clause nobody has agreed to is not in force, and this heading is where the page would say it is');
    assert.match(body.textContent, /thirty \(30\) days/, 'and it shows the wording being proposed');
    /* The ＋ continues the ask rather than starting a rival, which is what the
       funnel will actually do. */
    assert.match(body.querySelector('.rl-cp-act-new').textContent,
      new RegExp(STRINGS.en.ng_cp_continue));
  });

  test('their proposal gets no pill on our seat, and a settled one gets none either', async () => {
    const theirs = await withInsert('counterparty');
    const tBox = page(theirs);
    const tSec = tBox.querySelector('#rl-doc section.rl-clause-new');
    assert.ok(tSec, 'their proposed clause still draws');
    assert.ok(!tSec.querySelector('.rl-cp-pill'),
      'but it is answered, not edited — the mirror rule this page keeps everywhere');

    const mine = await withInsert();
    mine.ask.status = 'accepted';
    const mBox = page(mine);
    const mSec = mBox.querySelector('#rl-doc section.rl-clause-new');
    if (mSec) assert.ok(!mSec.querySelector('.rl-cp-pill'),
      'a settled ask is a record, not a draft');
  });

  test('both languages carry the proposed-clause wording', () => {
    const { STRINGS } = require('../js/i18n.js');
    for (const l of ['en', 'sv']){
      assert.ok(STRINGS[l].ng_cp_proposed, `${l} names the heading`);
      assert.ok(STRINGS[l].ng_cp_proposed_note, `${l} says why it is not in force`);
      assert.ok(STRINGS[l].ng_cp_proposed !== STRINGS[l].ng_cp_stands,
        `${l} does not say a proposal is in force`);
    }
  });

  test('the editor files through the revise door, never a second insert', () => {
    /* The one editor has two homes and now two kinds of ask. Read from the
       source because the branch is what matters: a proposed clause must not
       reach negoEditClause, which measures against a baseline it is not in. */
    assert.match(SRC, /negoReviseInsert\(c, clauseId, \{ bodyHtml: holder\.innerHTML \}/,
      'the save routes a proposed clause to the revise door');
    assert.match(SRC, /newAsk\s*\?\s*negoReviseInsert/,
      'and only when the clause is one that is only proposed');
  });
});
