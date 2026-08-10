/* ============================================================
   F92 — six rounds across the table, and the wall holds every one
   ============================================================
   A complete negotiation, played on the Redline Workbench through its own
   DOM — the buttons, the composer, the view toggle — never by calling the
   model directly where a control exists for the act. Owner and counterparty
   alternate for six rounds, and after every act the page is re-read for the
   process rules the reference sets:

     · the view wall: Counterparty View is EXACTLY what they see — no unsent
       drafts, no internal notes, no internal threads, and no counts that
       betray their existence;
     · nobody rules on their own ask: Accept/Reject only on the other side's
       sent changes; Send/Edit on your own drafts; amber Sent on your own
       dispatched asks;
     · cards hold the delta only; clause and card stay in lockstep; Send is
       one click; and a finished round can be CLOSED from this page, folding
       its decisions into the round history and re-baselining the document.

   This file is the audit the fixes came from. Each gap it found is named at
   the assertion that would have caught it:

     G1  the toggle leaked — unsent drafts, notes and internal threads all
         rendered identically on both sides (doc, cards, threads, wall);
     G2  Counterparty View had no way to hand the contract back, so the loop
         stalled at round two (no #nego-send-decisions, blast proxying a
         control that only exists for the owner);
     G3  "Tag with internal note" silently did nothing on any silent change
         that was not the composer's default target;
     G4  the round could never be closed from this page — the only control
         was in the room. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { buildWorld } = require('./world');

const RICH = [
  '<h1>SUPPLY &amp; SERVICES AGREEMENT</h1>',
  '<p>Between Wanjiru Catering Ltd and Nordfrakt Logistik AB.</p>',
  '<h2>1. Scope of Services</h2>',
  '<p>The Provider shall receive, store, handle and dispatch the goods at the designated facility.</p>',
  '<h2>2. Payment Terms</h2>',
  '<p>All invoices are payable within thirty (30) days from the date of issue (Net-30).</p>',
  '<h2>3. Storage Duration</h2>',
  '<p>Stored goods may remain in the facility for a maximum of one hundred and twenty (120) days.</p>',
  '<h2>4. Termination</h2>',
  '<p>Either party may terminate by giving not less than sixty (60) days written notice.</p>',
  '<h2>5. Governing Law</h2>',
  '<p>This Agreement is governed by the laws of Kenya.</p>',
].join('');

/* One world for the whole negotiation — six rounds are one story, and
   rebuilding the stage between rounds would throw away the state under test. */
async function table(){
  const w = buildWorld({ negotiationView: true });
  const { win } = w;
  win.promptDialog = async () => 'Round agreed';
  win.confirmDialog = async () => true;
  const c = { id: 'MK-600', name: 'Supply & Services Agreement',
    counterparty: 'Nordfrakt Logistik AB', counterpartyName: 'Erik Lindqvist',
    counterpartyEmail: 'erik@nordfrakt.se', template: 'RM', status: 'Under Review',
    folder: 'proc', fields: {}, metadata: {}, audit: [], rounds: [], versions: [],
    signatures: [], comments: [], redlineText: RICH, format: 'rich' };

  /* The transport, stood in for — everything up to it is the product's. */
  const post = { reshared: 0, modals: 0 };
  win.openShareModal = () => { post.modals++; };
  win.counterpartyContact = () => ({ name: 'Erik Lindqvist', email: c.counterpartyEmail, channel: 'email' });
  win.reshareToLastRecipient = async () => { post.reshared++; return { delivered: true }; };
  win.cachedShares = () => [];
  /* The Copilot double: rlAiPropose routes through the panel, and Apply files
     through negoEditClause — the panel itself is not what round one tests. */
  const panel = { cards: [] };
  win.openAI = () => {}; win.aiPush = () => {}; win.renderAIFeed = () => {};
  win.copilotAvailable = () => true;
  win.copilotPropose = async () => ({ advice: 'Tighter.', strict: true,
    proposedText: 'All invoices are payable within forty-five (45) days from the date of issue (Net-45).' });
  win.aiOpenProposal = o => { panel.cards.push(o); return o; };
  win.aiCloseRephraseSession = () => {};

  win.negoInit(c);
  win.state = Object.assign({}, win.state, { contracts: [c], activeId: c.id, view: 'redline' });
  win.getContract = id => (id === c.id ? c : null);
  win.renderRedline();
  const doc = win.document;
  const t = { w, win, c, doc, post, panel,
    $: s => doc.querySelector(s), $$: s => [...doc.querySelectorAll(s)],
    text: () => doc.getElementById('content').textContent,
    /* the view toggle, pressed like a person presses it */
    view(side){ t.$(`[data-redline-side="${side}"]`).click(); },
    clauseByHead(re){ return t.$$('#rl-doc .rl-clause').find(x => re.test(x.textContent)); },
    card(id){ return t.$(`#rl-changes [data-nego-card="${id}"]`); },
    /* Direct Edit through the DOM: open the inline editor on a clause, swap
       the body, save. The same path a person's click takes. */
    async edit(re, newHtml){
      const cl = t.clauseByHead(re);
      cl.querySelector('[data-nego-edit]').click();
      const box = cl.querySelector('[data-nego-editor]');
      assert.ok(box, 'the inline editor must open on the clause itself');
      box.innerHTML = newHtml;
      /* Two steps: wording, then why. Skipped here — this simulation is about
         the rounds, not the reasons. */
      cl.querySelector('[data-nego-next]').click();
      (cl.querySelector('[data-nego-skip]') || cl.querySelector('[data-nego-save]')).click();
      await new Promise(r => setTimeout(r, 25));
    },
    async pause(ms = 25){ return new Promise(r => setTimeout(r, ms)); } };
  return t;
}

describe('F92 — the six-round negotiation, end to end', () => {
  test('the whole table, one story', async () => {
    const t = await table();
    const { win, c } = t;

    /* ================= ROUND 1 — the owner's opening ================= */
    // A Copilot redline on Payment Terms, applied from the panel card…
    const clause2 = win.negoClauseList(c).find(x => /Payment/.test(x.headingText));
    await win.rlAiPropose({ c, action: win.RL_SEL_ACTIONS.find(a => a.id === 'shorten'),
      text: clause2.text, clauseId: clause2.clauseId, opts: { side: 'owner' },
      again: () => win.renderRedline() });
    assert.equal(t.panel.cards.length, 1, 'the proposal lands as a panel card');
    const applied = t.panel.cards[0].onApply(t.panel.cards[0].proposedText);
    assert.equal(applied.ok, true);
    await t.pause();
    win.renderRedline();
    // …and a direct edit on Termination.
    await t.edit(/Termination/, '<p>Either party may terminate by giving not less than thirty (30) days written notice.</p>');
    win.renderRedline();

    const drafts = t.$$('#rl-changes .rl-badge').map(b => b.textContent.trim());
    assert.equal(drafts.filter(x => /Draft/.test(x)).length, 2, 'two local drafts, both locked');
    assert.match(t.$('[data-rl-blast]').textContent, /Send All \(2\) Redlines/);

    // One click sends the lot; no dialog; badges flip; the verb turns amber.
    t.$('#rl-changes [data-rl-send]').click();
    await t.pause();
    win.renderRedline();
    assert.equal(t.post.modals, 0, 'zero confirmation pop-ups on the send path');
    assert.equal(t.post.reshared, 1, 'and the dispatch really happened');
    assert.equal(win.negoTurn(c), 'counterparty', 'the table turned');
    assert.equal(t.$$('#rl-changes .rl-badge').filter(b => /^Sent$/.test(b.textContent.trim())).length, 2);
    /* The card folds once it is theirs to answer: no verb on it is a move
       this reader can make. The badge above carries the fact, and opening the
       card brings the amber Sent back — f89 pins that half. */
    assert.equal(t.$('#rl-changes .rl-card').getAttribute('data-rl-open'), '0',
      'a sent ask is a line, not a panel');
    assert.ok(!t.$('[data-rl-blast]'), 'nothing unsent, no flashing control');

    /* ================= ROUND 2 — the counterparty answers ================= */
    /* COUNTERPARTY VIEW IS A WINDOW NOW (Young, 08 Aug 2026 — the
       counterparty-view work order). It used to be their live seat, and this
       round used to be driven through it: Accept pressed on their cards, the
       counter-edit typed in their name. Every one of those verbs is gone from
       the preview — checking what they see and acting as them are different
       things. So the story is unchanged but the HANDS are honest: what the
       other side does is made through the engine, exactly as applyResponse
       makes it when their real answer arrives from their own link, and the
       preview is asserted verb-less. */
    t.view('counterparty');
    await t.pause();
    // The eye banner, not the wall's internal counts.
    assert.match(t.$('#rl-banner').textContent, /exactly what/, 'G1: the view wall banner');
    assert.ok(!/The wall:/.test(t.$('#rl-banner').textContent));
    const [ask1, ask2] = win.negoChanges(c).map(x => x.id);
    assert.ok(!t.card(ask1).querySelector('.rl-acc') && !t.card(ask1).querySelector('.rl-rej'),
      'the preview offers no Accept/Reject — deciding their asks is theirs to do');
    assert.ok(!t.card(ask1).querySelector('.rl-sent'),
      'the amber Sent state is the AUTHOR\'s, not the decider\'s');
    assert.ok(!t.$('[data-nego-edit]'), 'no Direct Edit from the preview');
    assert.match(t.$('#nego-readonly-why').textContent, /window onto exactly what/,
      'the column says why it has no verbs');
    /* The Copilot provenance label is not painted on a card at all now (F137),
       so it cannot cross the toggle. Asserted on the TEXT rather than on the
       old .rl-card-note element, which would pass by simply not existing. */
    assert.ok(!/Copilot —/.test(t.$('#rl-changes').textContent),
      'G1: the provenance label is not on the counterparty\'s cards');

    // Their answers and their counter-ask, as their own link files them.
    win.negoResolve(c, ask1, 'accepted', { side: 'counterparty', by: 'Erik Lindqvist' });   // accept Net-45
    win.negoResolve(c, ask2, 'rejected', { side: 'counterparty', by: 'Erik Lindqvist' });   // reject 30-day notice
    const termCl = win.negoClauseList(c).find(x => /Termination/.test(x.headingText));
    await win.negoEditClause(c, termCl.clauseId,
      '<p>Either party may terminate by giving not less than forty-five (45) days written notice.</p>',
      { side: 'counterparty', author: 'Erik Lindqvist' });
    win.renderRedline();
    await t.pause();
    const counter = win.negoChanges(c).find(x => x.authorSide === 'counterparty');
    assert.ok(counter, 'the counter-ask is on the record in their name');
    assert.ok(t.card(counter.id), 'and the preview shows it');
    assert.ok(!t.card(counter.id).querySelector('.rl-send') && !t.card(counter.id).querySelector('.rl-acc'),
      'with no verbs on it — the window does not act');

    /* Hand the table back.

       THE BUTTON THAT USED TO DO THIS IS GONE, deliberately. Counterparty View
       is a PREVIEW of their seat — its purpose is checking what crosses the
       wall before it does — and it came with their send, which on this page is
       negoHandOver recorded as a move made BY the counterparty. Pressing it
       produced a record of the other side handing the table back when they had
       done nothing at all, on a product whose worth is that the record is
       trustworthy. The seat now says so in the change column, and only their
       own link can send.

       The six rounds this file walks are unaffected: the turn move is what the
       simulation needs, so it is made directly. Asserted as ABSENT from the
       preview as well, so the button cannot quietly return. */
    assert.equal(t.doc.getElementById('nego-send-decisions'), null,
      'the preview seat offers no send — only their own link can move the table');
    win.negoHandOver(c, { to: 'owner', by: c.counterparty || 'Counterparty' });
    win.renderRedline();
    await t.pause();
    assert.equal(win.negoTurn(c), 'owner');

    /* ================= ROUND 3 — the owner reads the counter ================= */
    t.view('owner');
    await t.pause();
    assert.ok(t.card(counter.id).querySelector('.rl-acc') && t.card(counter.id).querySelector('.rl-rej'),
      'the counter arrives with Accept/Reject on our side');
    t.card(counter.id).querySelector('[data-nego-accept]').click();
    await t.pause();
    // A new ask on Storage, then an internal note tagged onto it.
    await t.edit(/Storage/, '<p>Stored goods may remain in the facility for a maximum of ninety (90) days.</p>');
    win.renderRedline();
    const storage = win.negoChanges(c).find(x => _liveOf(win, c, 'owner').includes(x.id));
    function _liveOf(w2, c2, side){ return w2.negoUnsentAsks(c2, side).map(x => x.id); }
    assert.ok(storage, 'the new ask is a draft of ours');
    /* THE TAG SHORTCUT IS GONE (Young, 03 Aug 2026) — the two buttons that
       opened the Discussion composer pre-set to internal were removed, because
       a reason for a change now travels ON the change where the other side can
       read it, and a private remark about a fragment answered nobody in the
       next round. Internal notes themselves are untouched: the Discussion
       panel still writes them, and this asserts the thing that always
       mattered — that one filed internal stays internal and stays home. */
    win.negoPostComment(c, storage.id, 'Floor is 90 days — walk if they push past 100.',
      { side: 'owner', visibility: 'internal' });
    await t.pause();
    const noteMsg = (win.negoChanges(c).find(x => x.id === storage.id).thread || [])[0];
    assert.equal(noteMsg.visibility, 'internal', 'the tagged note filed internal');
    /* AND IT READS ON THE CHANGE ITSELF. The Discussion column that used to
       hold it is gone (10 Aug 2026); the notes are the last block of the
       card's body, so the card has to be open to see them. Asserted HERE,
       while the change is still on the table — a card leaves the column when
       its change is decided, and the conversation goes with it. Where the note
       lives after that is the record and the archive, which this file already
       checks at the end. */
    win.renderRedline();
    t.$(`[data-nego-card="${storage.id}"] .rl-caret`)
      ?.dispatchEvent(new win.Event('click', { bubbles: true }));
    assert.ok(t.$$('#rl-changes .rl-cnotes').some(n => /walk if they push past/.test(n.textContent)),
      'our own internal note is ours to read, on the change it is about');
    // Send the new ask.
    t.$('#rl-changes [data-rl-send]').click();
    await t.pause();
    win.renderRedline();
    assert.equal(win.negoTurn(c), 'counterparty');

    /* ================= ROUND 4 — they reply in the open, and accept ================= */
    t.view('counterparty');
    await t.pause();
    assert.ok(!t.text().includes('walk if they push past'),
      'G1: the internal note never surfaces in their thread column');
    /* The preview takes no replies either — a message posted from here would
       be recorded as said BY them. Their reply arrives through the engine,
       as their own page files it. */
    assert.equal(t.doc.getElementById('nego-ti-' + storage.id), null,
      'no composer on the window');
    win.negoPostComment(c, storage.id, '90 days works if the premium rate applies after 60.',
      { side: 'counterparty', visibility: 'shared', by: 'Erik Lindqvist' });
    await t.pause();
    win.renderRedline();
    const thread = win.negoChanges(c).find(x => x.id === storage.id).thread;
    assert.equal(thread.filter(m => m.visibility === 'shared').length, 1, 'the reply travelled shared');
    win.negoResolve(c, storage.id, 'accepted', { side: 'counterparty', by: 'Erik Lindqvist' });
    await t.pause();
    // the preview seat has no send — see the note in round 2
    win.negoHandOver(c, { to: 'owner', by: c.counterparty || 'Counterparty' });
    win.renderRedline();
    await t.pause();
    assert.equal(win.negoTurn(c), 'owner');

    /* ================= ROUND 5 — the leak audit, with a draft on the table ================= */
    t.view('owner');
    await t.pause();
    await t.edit(/Governing/, '<p>This Agreement is governed by the laws of Kenya and the courts of Nairobi have exclusive jurisdiction.</p>');
    win.renderRedline();
    const gl = win.negoUnsentAsks(c, 'owner')[0];
    assert.ok(gl, 'a live unsent draft is on the owner\'s table');
    /* THE WALL BAR HAS GONE, THE COUNT HAS NOT. A full-width band restating a
       rule on every paint was removed on request; what it was telling you now
       rides on the verb that acts on it, at the moment things actually cross
       the wall. Same number, counted the same way, one place closer to the
       act. */
    assert.ok(!/The wall:/.test(t.$('#rl-banner').textContent), 'no standing banner');
    assert.match(t.$('[data-redline-proxy]').textContent, /1 unsent/,
      'the send button counts what is being held back');
    /* The internal note is still ours and still internal — checked on the
       RECORD here, because by this round the change it hangs off has been
       decided and its card has left the column. It was read off the screen
       above, while it was live. */
    assert.ok((win.negoChanges(c).find(x => x.id === storage.id).thread || [])
      .some(m => m.visibility === 'internal' && /walk if they push past/.test(m.text)),
      'our own internal note is still on the record, still internal');
    const marks = t.$$('#rl-doc .rl-clause.is-changed ins, #rl-doc .rl-clause.is-changed del');
    assert.ok(marks.length && marks.every(m => /^Last updated by /.test(m.getAttribute('title') || '')),
      'hover attribution on every marked span');
    /* THE SIDEBAR HAS ONE FACE NOW. The Discussion column is gone and
       rlToggleDiscussion survives only as the name the master design calls: it
       settles the page on the one mode there is and keeps its old return
       contract. A stored 'disc' from before must not be able to hide the
       cards. */
    assert.equal(win.rlToggleDiscussion(false), true, 'it answers "discussion is not showing"');
    assert.equal(win.rlSideMode(), 'changes', 'and there is nothing else to be');
    assert.equal(t.$('#rl-disc-col'), null, 'no second column');
    assert.ok(t.$('#rl-changes-col'), 'and the cards are still here');

    // NOW FLIP, with the draft still unsent. Nothing may betray it.
    t.view('counterparty');
    await t.pause();
    assert.ok(!t.card(gl.id), 'G1: no card for a draft they have never been sent');
    assert.ok(!t.text().includes('courts of Nairobi'),
      'G1: the document canvas shows the untouched clause, not the draft');
    /* Badges, not the column's raw text: the head's origin filter offers a
       "Drafts (Unsent)" OPTION on every seat — static chrome, there whether
       or not a draft exists, so it can betray nothing. What must never appear
       on their side is a Draft BADGE on a card, which is what this audits. */
    assert.ok(!t.$$('#rl-changes-col .rl-badge').some(b => /Draft/.test(b.textContent)),
      'G1: no Draft badge anywhere on their side');
    const glClause = t.clauseByHead(/Governing/);
    assert.ok(!glClause.classList.contains('is-changed'),
      'G1: the clause is not even framed — nothing says "something exists here"');
    t.view('owner');
    await t.pause();

    /* ================= ROUND 6 — batch publish, then close the book ================= */
    const blast = t.$('[data-rl-blast]');
    assert.ok(blast && /Send All \(1\) Redline/.test(blast.textContent), 'the flashing batch control');
    blast.click();
    await t.pause();
    win.renderRedline();
    assert.equal(win.negoTurn(c), 'counterparty');
    t.view('counterparty');
    await t.pause();
    assert.ok(!t.card(gl.id).querySelector('[data-nego-accept]'),
      'the window still offers no verbs in round six');
    win.negoResolve(c, gl.id, 'accepted', { side: 'counterparty', by: 'Erik Lindqvist' });
    await t.pause();
    // the preview seat has no send — see the note in round 2
    win.negoHandOver(c, { to: 'owner', by: c.counterparty || 'Counterparty' });
    win.renderRedline();
    await t.pause();
    t.view('owner');
    await t.pause();

    // Everything decided: the closer appears, and only now.
    const closer = t.$('[data-rl-close-round]');
    assert.ok(closer, 'G4: a finished round must be closable from the page it was worked on');
    closer.click();
    await t.pause(40);

    // The book: one archived round holding every decided change with its
    // passes; a clean baseline carrying the agreed wording; an empty table.
    assert.equal(c.negotiation.rounds.length, 1, 'the round folded into history');
    const archived = c.negotiation.rounds[0];
    assert.equal(archived.changes.length, 5, 'all five decided changes archived');
    assert.equal(win.negoChanges(c).length, 0, 'the table is empty for round two');
    assert.equal(win.negoRound(c), 2);
    const base = win.negoBaseText(c);
    assert.match(base, /forty-five \(45\) days from the date of issue/, 'accepted Net-45 is baseline');
    assert.match(base, /forty-five \(45\) days written notice/, 'the accepted counter is baseline');
    assert.match(base, /ninety \(90\) days/, 'the accepted storage ask is baseline');
    assert.match(base, /courts of Nairobi/, 'the final ask is baseline');
    assert.ok(!/thirty \(30\) days written notice/.test(base),
      'the rejected wording is nowhere in the agreed text');
    // The internal pass history survives in the archive, not in the public text.
    const archStorage = archived.changes.find(x => x.id === storage.id);
    assert.ok(archStorage.thread.some(m => m.visibility === 'internal'),
      'the internal note is preserved on the archived record');
    assert.ok(archStorage.thread.some(m => m.visibility === 'shared'),
      'beside the shared reply it answered');
  });

  test('the DOM contract survived six rounds of surgery', async () => {
    const t = await table();
    /* #rl-threads has left the list: the Discussion column it named is gone
       and the conversation reads on the change's own card (.rl-cnotes). */
    for (const id of ['view-redline', 'rl-doc', 'rl-changes', 'rl-banner', 'rl-grid'])
      assert.ok(t.$('#' + id), `#${id} still stands`);
  });
});
