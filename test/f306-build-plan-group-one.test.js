/* ============================================================
   f306 — THE BUILD PLAN, GROUP ONE: three facts move to where the work is
   ============================================================
   Owner-approved 13 Sep 2026 off the HaTi Build Plan. Three changes that share
   one idea and nothing else: take a fact the product ALREADY KNOWS and put it
   where the person is working, instead of somewhere else or nowhere.

     1  the clause editor's rail opens on the Playbook tab it already filled
     2  the greeting carries the two facts nothing else on the page states
     3  a review row says how long it has waited, and offers a nudge
     4  the counterparty's wall line stops printing the Send button's count

   NONE OF THEM RECORDS ANYTHING NEW except the reminder stamp, and none of them
   spends anything. Every claim below is driven or measured; where a claim is a
   grep it is a WALL (a thing that must not appear), never a description of a
   shape that happens to be there.
   ============================================================ */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld, supplyContract } = require('./world');
const { startHati, seedWorkspace } = require('./helpers');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
const CE = strip(read('js/views/clauseeditor.js'));
const REVIEW = strip(read('js/review.js'));
const PORTAL = strip(read('js/views/portal.js'));
const I18N = read('js/i18n.js');

/* A world with the clause editor mounted over a contract whose playbook review
   places one deviation on a named clause. The review is put on the RECORD, the
   way the overnight pass and Prepare redlines both leave it, so the rail reads
   exactly what it would read in the product. */
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
  if (opts.theirAsk)
    await win.negoFileProposal(c, win.negoBaseText(c).replace('thirty (30) days', 'sixty (60) days'),
      { side: 'counterparty', author: 'Amina Wanjiru', why: 'Our finance team needs sixty.' });
  win.state = Object.assign({}, win.state, { contracts: [c], activeId: c.id, view: 'redline' });
  win.getContract = id => (id === c.id ? c : null);
  return { w, win, c, doc: win.document };
}
/* The clause the supplied contract's payment wording lives in, and one the
   playbook says nothing about — asked of the product's own list so a change to
   the fixture cannot quietly make this file test the wrong clause. */
const clauseWith = (win, c, re) => (win.negoClauseList(c).find(cl => re.test(cl.text || '')) || null);

/* A deviation ON THE RECORD, quoting wording that really is in the clause, so
   rlPbFindClause can place it. Anything it cannot place lands on neither list,
   which is the whole point of the `here` scoping below. */
function putReview(c, quote, category){
  c.playbook = { at: new Date().toISOString(), book: 'Default', verdicts: [
    { category, status: 'deviation', quote, position: '≤ 45 days',
      redline: 'The Buyer shall pay within forty-five (45) days.', escalate: false }] };
}
const tabOn = doc => {
  const on = [...doc.querySelectorAll('[data-ce-tab]')].find(b => b.classList.contains('is-on'));
  return on ? on.getAttribute('data-ce-tab') : null;
};

describe('f306 (1) — the rail opens on Suggestions; the Playbook tab is a door, not a landing', () => {
  /* REVERSED THE DAY IT SHIPPED (Young, 13 Sep 2026): "when i click on the
     pencil, it takes me to the playbook scan page when i should remain in the
     suggestions". The reading survives (the tab's count is drawn off it); the
     auto-open does not. */
  test('a clause with a located finding still opens on Suggestions', async () => {
    const { win, c, doc } = await bench();
    const cl = clauseWith(win, c, /thirty \(30\) days/);
    assert.ok(cl, 'the fixture has a payment clause');
    putReview(c, cl.text.slice(0, 80), 'Payment terms');
    assert.equal(win.rlOpenClauseEditor(c, cl.clauseId), true, 'the editor opens');
    assert.equal(win.ceClauseFindings() > 0, true, 'this clause has findings of its own');
    assert.equal(tabOn(doc), 'chat', 'and the rail stays on Suggestions regardless');
  });
  test('a caller that names the Playbook tab still gets it', async () => {
    const { win, c, doc } = await bench();
    const cl = clauseWith(win, c, /thirty \(30\) days/);
    win.rlOpenClauseEditor(c, cl.clauseId, { tab: 'scan' });
    assert.equal(tabOn(doc), 'scan');
  });

  test('a clause with none of its own opens on the greeting, as it always did', async () => {
    const { win, c, doc } = await bench();
    const pay = clauseWith(win, c, /thirty \(30\) days/);
    putReview(c, pay.text.slice(0, 80), 'Payment terms');
    /* ANOTHER clause of the same contract: the deviation is placed, and placed
       somewhere else. This is the case that would break if the reading asked
       `missing` as well — a standard found nowhere is true of every clause at
       once, and the tab would open on all of them. */
    const other = win.negoClauseList(c).find(x => x.clauseId !== pay.clauseId);
    assert.ok(other, 'the fixture has a second clause');
    assert.equal(win.rlOpenClauseEditor(c, other.clauseId), true);
    assert.equal(win.ceClauseFindings(), 0, 'this clause has none of its own');
    assert.equal(tabOn(doc), 'chat', 'so nothing is moved');
  });

  test('a caller that names a tab still gets that tab', async () => {
    const { win, c, doc } = await bench();
    const cl = clauseWith(win, c, /thirty \(30\) days/);
    putReview(c, cl.text.slice(0, 80), 'Payment terms');
    win.rlOpenClauseEditor(c, cl.clauseId, { tab: 'chat' });
    assert.equal(tabOn(doc), 'chat', 'an explicit ask outranks the default');
  });

  test('no review on the record is answered with 0, never a scan', async () => {
    const { win, c, doc } = await bench();
    const cl = clauseWith(win, c, /thirty \(30\) days/);
    assert.equal(c.playbook, undefined, 'nothing has read this contract');
    win.rlOpenClauseEditor(c, cl.clauseId);
    assert.equal(win.ceClauseFindings(), 0);
    assert.equal(tabOn(doc), 'chat');
  });

  /* THE WALL: the opening tab may not cost money. The reading is the groups the
     rail already builds off the stored review; a fetch or a route here would be
     a call made on every open of every clause. */
  test('the reading spends nothing', () => {
    const m = /function ceClauseFindings\(\)\{[\s\S]*?\n\}/.exec(CE);
    assert.ok(m, 'the reading exists');
    assert.doesNotMatch(m[0], /fetch|api\(|\/api\/|anthropic/i, 'and asks no route');
    assert.match(m[0], /ceScanGroups\(\)\.here/, 'it is this clause\'s own findings');
    assert.doesNotMatch(m[0], /\.missing/, 'never the contract-wide missing list');
  });
});

describe('f306 (2) — the greeting carries what nothing else says', () => {
  test('their ask on this clause is printed before you ask a question', async () => {
    const { win, c, doc } = await bench({ theirAsk: true });
    const cl = clauseWith(win, c, /sixty \(60\) days|thirty \(30\) days/);
    win.rlOpenClauseEditor(c, cl.clauseId, { tab: 'chat' });
    const lane = doc.querySelector('#ce-lane') || doc.querySelector('.ce-rail') || doc.body;
    const txt = lane.textContent || '';
    assert.match(txt, /sixty|60/i, 'the reason they gave is on the page at rest');
  });

  /* THE WALL, AND IT IS THE WHOLE REASON THIS IS TWO FACTS AND NOT THREE.
     Prepare redlines files a redline for every playbook gap and the rail's own
     Playbook tab states the position per clause. A third statement in the
     greeting is the duplication this codebase pays most for. */
  test('the playbook is NOT stated a third time', () => {
    const m = /function ceGreetingHtml\(\)\{[\s\S]*?\n\}/.exec(CE);
    assert.ok(m, 'the greeting builder exists');
    assert.match(m[0], /cePrecedentLine\(\)/, 'precedent');
    assert.match(m[0], /ceTheirAsk\(\)/, 'and their ask');
    assert.doesNotMatch(m[0], /cePlaybookLine\(\)/, 'and never the playbook line');
  });
});

describe('f306 (3) — a review row says how long, and offers a nudge', () => {
  test('the age is whole days off the review\'s own stamp', () => {
    const { win } = buildWorld({ negotiationView: true });
    const days = n => win.reviewDaysWaiting({ at: new Date(Date.now() - n * 86400000).toISOString() });
    assert.equal(days(0), 0);
    assert.equal(days(3), 3);
    assert.equal(win.reviewDaysWaiting({}), null, 'an older review with no stamp says nothing');
    assert.equal(win.reviewDaysWaiting(null), null);
  });

  /* THE ROW IS DRAWN FROM THE READER'S CHAIR, and Remind is the requester's act
     — the same test that decides whether Cancel is drawn, because a bystander
     nudging somebody else's reviewer is not a thing this product does. */
  test('Remind is drawn beside Cancel, and only for whoever may cancel', () => {
    const src = /for \(const rv of st\.waiting\)\{[\s\S]*?\n  \}/.exec(REVIEW);
    assert.ok(src, 'the waiting row exists');
    assert.match(src[0], /rv-remind:' \+ rv\.id/, 'the act names its review');
    assert.match(src[0], /reviewMayCancel\(rv\)/, 'gated by the requester test');
    assert.match(src[0], /reviewDaysWaiting\(rv\)/, 'and the age is printed');
  });

  /* ONE DOOR ONTO ONE ACT. A reminder is the ask again, so it goes through the
     ask's own route — which looks the colleague up by id and never reads an
     address out of the body. A second route would be a second place for that
     rule to be got wrong. */
  test('a reminder goes through the review-request route, with a flag', () => {
    const m = /async function reviewRemind\([\s\S]*?\n\}/.exec(REVIEW);
    assert.ok(m, 'the act exists');
    assert.match(m[0], /review-request/, 'the one route');
    assert.match(m[0], /reminder: true/, 'told what it is');
    assert.equal((REVIEW.match(/review-request/g) || []).length, 2,
      'exactly two callers of that route in this file: the ask and the reminder');
  });

  test('the stamp is only written where something really left', () => {
    const m = /async function reviewRemind\([\s\S]*?\n\}/.exec(REVIEW);
    assert.match(m[0], /if \(out\.sent \|\| out\.outbox\)\{\s*\n\s*rv\.reminded =/,
      'a refused send records no reminder');
  });

  test('the keys are in both books', () => {
    for (const k of ['rv_remind_btn', 'rv_reminded_on', 'rv_waiting_days_one',
      'rv_waiting_days_other', 'rv_reminded_toast', 'rv_reminded_outbox', 'rv_reminded_failed'])
      assert.equal((I18N.match(new RegExp('\\b' + k + ':', 'g')) || []).length, 2,
        k + ' is written in English and Swedish');
  });
});

describe('f306 (3b) — the server sends a reminder, to the stored address', () => {
  let h, W, reviewer;
  before(async () => { h = await startHati(); W = await seedWorkspace(h); reviewer = W.users.unrestricted; });
  after(async () => { await h.stop(); });

  test('it names itself a reminder and still posts to the colleague looked up here', async () => {
    const r = await W.admin.json('/api/contracts/MK-A2/review-request', { method: 'POST', body: {
      reviewerId: reviewer.id, reminder: true, days: 4,
      /* AND THE OPEN-RELAY RULE HOLDS UNDER THE NEW FLAG: an address in the
         body is not read at all, here or anywhere. */
      reviewerEmail: 'attacker@example.net' } });
    assert.equal(r.ok, true);
    assert.equal(r.to, reviewer.email, 'the stored address, never the body\'s');
    const ob = await W.admin.json('/api/outbox');
    const mail = (ob.items || []).find(m => String(m.to_addr) === reviewer.email
      && /Reminder:/i.test(String(m.subject)));
    assert.ok(mail, 'the colleague was written to, and the message says what it is');
    assert.match(String(mail.subject), /Raw Milk Collection/, 'it names the contract');
    assert.match(String(mail.body), /still waiting on your review/i);
    assert.match(String(mail.body), /with you for 4 days/i, 'and how long they have had it');
    assert.match(String(mail.body), /#contract=MK-A2&tab=redline/, 'the link opens the negotiation');
  });

  test('without the flag the ask is byte-for-byte the ask it always was', async () => {
    const r = await W.admin.json('/api/contracts/MK-A2/review-request', { method: 'POST', body: {
      reviewerId: reviewer.id, note: 'Is Net-45 defensible?' } });
    assert.equal(r.ok, true);
    const ob = await W.admin.json('/api/outbox');
    const mail = (ob.items || []).find(m => String(m.to_addr) === reviewer.email
      && /asked you to review/i.test(String(m.subject)));
    assert.ok(mail, 'the ask still goes out under its own subject');
    assert.doesNotMatch(String(mail.subject), /Reminder/i);
    assert.match(String(mail.body), /Is Net-45 defensible\?/);
  });
});

describe('f306 (4) — the counterparty\'s wall is one line', () => {
  test('the promise is a key, in both books', () => {
    assert.equal((I18N.match(/\bpo_wall_live:/g) || []).length, 2);
    assert.match(PORTAL, /i18t\('po_wall_live'\)/, 'and the page reads it');
  });

  /* THE TWO SECOND PRINTINGS ARE GONE FROM THE WALL. Scoped to the wall
     BUILDER, not to the file: the signing screen's own foot still says how many
     decisions are ready and that none has travelled, and it is right to — that
     screen has no change column, no band and no Send label beside it. A wall
     asserted file-wide would have called that a fault. */
  test('the wall no longer counts the held answers a second time', () => {
    const raw = read('js/views/portal.js');
    const i = raw.indexOf('const banner = live');
    const j = raw.indexOf('pt-nego-facts', i);
    assert.ok(i > 0 && j > i, 'the wall builder is where this file thinks it is');
    const wall = raw.slice(i, j);
    assert.doesNotMatch(wall, /PORTAL_NEGO_DECISIONS/, 'it counts nothing');
    assert.doesNotMatch(wall, /answer\$\{|answers/i, 'and prints no answer count');
    assert.match(wall, /po_wall_live/, 'it is one promise, in one key');
  });

  /* AND THE SENTENCE ABOUT A SWITCH THIS SEAT DOES NOT HAVE IS GONE EVERYWHERE.
     The counterparty has ONE note room and everything written in it is for the
     sender, so there is no visibility to set and nothing anywhere should say
     there is. */
  test('nothing tells them a reply travels only when it is marked shared', () => {
    assert.doesNotMatch(read('js/views/portal.js'), /marked shared/i);
  });
});
