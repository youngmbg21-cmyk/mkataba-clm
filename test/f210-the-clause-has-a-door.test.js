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
     1  the pill: green, worded Edit, top right, on every clause, always drawn
     2  it is a DOOR, not a verb — it opens the panel and files nothing
     3  the panel's three sections, and the empty states that must be drawn
     4  ONE READING, ONE PRODUCER — the panel's bodies come from the canvas
     5  the seats and the mounts where it must NOT be drawn
     6  the wall: the other side's unsent draft is not in the panel either
     7  the ways out, and the arming that decides which seats have them
     8  "as it stands" is what STANDS, not the round baseline
     9  both languages
    10  the twin renderer was carrying the MK-311 fault and now is not
   ============================================================ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld, supplyContract } = require('./world');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const SRC = read('js/views/negotiation.js');
const I18N = read('js/i18n.js');

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
  test('every clause carries one, worded Edit', async () => {
    const p = await bench();
    const box = page(p);
    /* section.rl-clause, not .rl-clause: the paper also puts that class on the
       numbered LINES inside a clause body (see .rl-line.rl-clause.rl-hang), and
       a line is not a clause. */
    const clauses = [...box.querySelectorAll('#rl-doc section.rl-clause')];
    assert.ok(clauses.length >= 2, 'the fixture has clauses to put a door on');
    assert.equal(pills(box).length, clauses.length,
      'one pill per clause — including the clauses nobody has asked anything about');
    pills(box).forEach(b => assert.equal(b.textContent.trim(), 'Edit'));
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

  test('it is green, and it is not hover-only', async () => {
    /* Emerald is the colour this page already wears for "your redlines travel
       on this" — the same family Direct Edit uses, deliberately, so a reader
       does not learn a second signal for the same idea.

       ALWAYS DRAWN is the load-bearing half. The tool row is furniture on a
       clause you are already working on; this is the way IN, and a hover-only
       door is an invisible affordance — the exact fault this file records
       against the selection route. */
    assert.match(SRC, /\.redline-page \.rl-cp-pill\{[^}]*background:#ecfdf5/,
      'the pill is emerald');
    assert.match(SRC, /\.redline-page \.rl-cp-pill\{[^}]*margin-left:auto/,
      'and it is pushed right even on a clause with no heading beside it');
    assert.doesNotMatch(SRC, /\.rl-clause:hover \.rl-cp-pill/,
      'nothing reveals it on hover, because it is never hidden');
  });

  test('it follows the reader\'s document type, like the rest of the sheet', async () => {
    /* The third report of one fault (13 and 15 Aug 2026) was enough; a fourth
       is not needed to apply the rule to a new piece of furniture. */
    assert.match(SRC, /\.redline-page \.rl-cp-pill\{[^}]*font-size:calc\(10\.5px \* var\(--doc-scale,1\)\)/);
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
    assert.deepEqual(heads.slice(0, 3), ['As it stands', 'On the table', 'History']);
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
    assert.ok(nones.includes('Nothing has been asked about this clause yet.'));
    assert.ok(nones.includes('Nothing is on the table for this clause.'));
  });

  test('a live ask appears on the table AND in the history', async () => {
    /* They answer different questions — "what am I deciding" and "how did this
       clause get here" — and an ask that is still open is a true answer to
       both. */
    const p = await bench();
    const box = page(p);
    const b = bodies(box).find(x => x.querySelector('.rl-cp-row'));
    assert.ok(b, 'the clause with the ask on it has rows');
    const secs = [...b.querySelectorAll('.rl-cp-sec')];
    const table = secs.find(s => /On the table/.test(s.querySelector('.rl-cp-h').textContent));
    const hist = secs.find(s => /History/.test(s.querySelector('.rl-cp-h').textContent));
    assert.equal(table.querySelectorAll('.rl-cp-row').length, 1);
    assert.equal(hist.querySelectorAll('.rl-cp-row').length, 1);
    assert.equal(table.querySelector('.rl-cp-row b').textContent, p.c.changes[0].id);
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
    assert.equal(hist.querySelectorAll('.rl-cp-row').length, 1, 'and the record keeps it');
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
    assert.match(SRC, /for \(let i = _list\.length - 1; i >= 0 && !ch; i--\) if \(onStanding\(_list\[i\]\)\) ch = _list\[i\];/);
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
