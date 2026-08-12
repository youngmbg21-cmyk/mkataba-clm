/* ============================================================
   f157 — a review is a chosen subset, and a change out for review does not travel
   ============================================================
   Three things reported off one screen, and they turn out to be one idea.

   1. YOU PICK WHICH ONES. A review used to sweep in everything outstanding,
      which is wrong about how people escalate: you are uneasy about the
      indemnity, not about all five redlines, and dragging the other four along
      stops the rest of the round for no reason. The default is still
      everything, because that is the common case.

   2. A CHANGE THAT IS OUT SAYS SO, AND IT SAYS IT IN AMBER. Asked for as "turn
      it red". Red is wrong and the reason is the point of the feature: ruby
      means REFUSED everywhere else in this product, and a change merely sitting
      with somebody has not been refused — it may well come back cleared. Paint
      both red and the one your boss actually stopped becomes invisible among
      the four they have not opened. Waiting is amber; held stays ruby.

   3. SENDING ASKS FIRST. With the rule off, sending wording that is still being
      read is allowed and is nearly always a mistake — the verdict arrives the
      next morning about something the counterparty has already seen. So it
      warns, names who is holding it, and offers to send the rest.

   AND THE CONSEQUENCE THAT TIES THEM TOGETHER: an unanswered change stays out
   of the payload for the same reason a held one does. Two reasons, one answer,
   asserted here against the real builder.
   ============================================================ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { buildWorld } = require('./world');
const { loadViews, STUB_TEMPLATES, STUB_FOLDERS } = require('./dom');
const { JSDOM } = require('jsdom');

const BODY =
  '<h1>Cane Supply Agreement</h1><p>Between Wanjiru Catering Ltd and Nordfrakt Logistik AB</p>'
  + '<h2>Clause 2 · Delivery</h2><p>Weekly consignments to the mill gate.</p>'
  + '<h2>Clause 4 · Payment Terms</h2><p>Undisputed invoices are payable within thirty (30) days.</p>'
  + '<h2>Clause 6 · Liability</h2><p>Liability is capped at the fees paid in the preceding twelve months.</p>'
  + '<h2>Clause 9 · Notices</h2><p>Notices are delivered by hand or by registered post.</p>';

const BOSS = { id: 'u_boss', name: 'Achieng Otieno', role: 'admin', email: 'achieng@w.co.ke' };
const ME   = { id: 'u_me',   name: 'Wanjiru Kamau',  role: 'legal', email: 'wanjiru@w.co.ke' };

const contract = (over = {}) => ({ id: 'MK-S1', name: 'Cane Supply Agreement',
  counterparty: 'Nordfrakt Logistik AB', status: 'Under Review', folder: 'dist',
  fields: {}, metadata: {}, audit: [], rounds: [], versions: [], signatures: [], comments: [],
  value: 4800000, redlineText: BODY, format: 'rich', ...over });

function world(opts = {}){
  const w = buildWorld({ user: opts.user || ME, ...opts });
  w.win.state = { settings: opts.settings || {}, contracts: [] };
  w.win.getUsers = () => [ME, BOSS];
  w.win.userById = id => [ME, BOSS].find(u => u.id === id) || null;
  w.win.saveSettings = () => {};
  return w;
}
const mine = (win, c, num, body) => {
  const cl = win.negoClauseList(c).find(x => x.num === num);
  assert.ok(cl, 'clause ' + num);
  return win.negoEditClause(c, cl.clauseId, body,
    { side: 'owner', author: ME.name, summary: 'ask on ' + num });
};

/* Three of ours on the table — enough that "some of them" is a real choice. */
async function three(win){
  const c = contract(); win.negoInit(c);
  const a = await mine(win, c, '4', '<p>Payable within forty-five (45) days.</p>');
  const b = await mine(win, c, '6', '<p>Liability is uncapped.</p>');
  const d = await mine(win, c, '9', '<p>Notices may be given by email.</p>');
  return { c, a, b, d };
}

/* ============================================================
   1 — CHOOSING
   ============================================================ */
describe('f157 · a review covers what you chose', () => {
  test('by default it is still everything', async () => {
    const { win } = world();
    const { c } = await three(win);
    const rv = win.reviewAsk(c, { reviewer: BOSS });
    assert.equal(rv.changeIds.length, 3, 'the common case needs no work to get');
  });

  test('naming ids narrows it, and the audit line says what was left out', async () => {
    const { win } = world();
    const { c, b } = await three(win);
    const rv = win.reviewAsk(c, { reviewer: BOSS, ids: [b.id] });
    assert.deepEqual([...rv.changeIds], [b.id]);
    const line = (c.audit || []).find(x => /Internal review requested/.test(x.detail || ''));
    assert.match(line.detail, /2 outstanding change\(s\) deliberately left out/,
      'a narrowed review is a decision, and the record says so');
  });

  test('an id that is not outstanding is ignored rather than trusted', async () => {
    const { win } = world();
    const { c, b } = await three(win);
    const rv = win.reviewAsk(c, { reviewer: BOSS, ids: [b.id, 'CHG-999'] });
    assert.deepEqual([...rv.changeIds], [b.id]);
  });

  test('choosing nothing is refused, and says so', async () => {
    const { win, log } = world();
    const { c } = await three(win);
    assert.equal(win.reviewAsk(c, { reviewer: BOSS, ids: ['CHG-999'] }), null);
    assert.match(log.toasts.map(t => t.msg).join(' '), /at least one change/i);
  });

  test('the reviewer may only rule on what they were shown', async () => {
    const { win, log } = world({ user: BOSS });
    const { c, a, b } = await three(win);
    win.reviewAsk(c, { reviewer: BOSS, by: ME.name, ids: [b.id] });
    assert.ok(win.reviewMark(c, b.id, 'held'), 'the one they were asked about');
    assert.equal(win.reviewMark(c, a.id, 'cleared'), null, 'and not the ones they were not');
    assert.match(log.toasts.map(t => t.msg).join(' '), /was not part of this review/);
  });

  test('handing back only counts what was asked about', async () => {
    const { win } = world({ user: BOSS });
    const { c, b } = await three(win);
    win.reviewAsk(c, { reviewer: BOSS, by: ME.name, ids: [b.id] });
    win.reviewMark(c, b.id, 'held');
    const rv = win.reviewReturn(c, {});
    assert.ok(rv, 'the other two were never in front of them, so they do not block the hand-back');
    assert.deepEqual({ ...rv.tally }, { cleared: 0, held: 1, advised: 0 });
  });

  test('the dialog offers a tick per change and a select-all', async () => {
    const { win } = world();
    const { c } = await three(win);
    const html = win.reviewAskModalHtml(c);
    assert.equal((html.match(/class="rv-pickch"/g) || []).length, 3, 'one tick each');
    assert.match(html, /checked/, 'and they start ticked');
    assert.match(html, /id="rv-pick-all"/, 'with a way to clear them all at once');
  });
});

/* ============================================================
   2 — THE CARD SAYS WHERE IT IS, IN THE RIGHT COLOUR
   ============================================================ */
describe('f157 · waiting is amber, held is ruby', () => {
  test('a change out for review wears a "with <name>" chip, not a verdict', async () => {
    const { win } = world({ negotiationView: true });
    const { c, b } = await three(win);
    win.reviewAsk(c, { reviewer: BOSS, ids: [b.id] });
    const html = win.redlineChangeCardsHtml(c, { side: 'owner' });
    /* The workbench card's ONE status badge carries it — the review's own chip
       stood down beside it rather than saying the same thing twice. */
    /* CLAIM UPDATED, 13 Aug 2026: the badge read "⌛ With Achieng Otieno" and
       now reads "⌛ Achieng Otieno". The hourglass already says waiting; "With"
       was the word doing least in a corner read at a glance. The NAME is what
       this test is about and it is still there. */
    /* CLAIM UPDATED, 13 Aug 2026: a name on a CARD is now first name plus
       the surname's initial (cardName) — the whole name stays in the
       line's hover text, and in the record, the emails and the pickers.
       The claim is the same claim; only the form of the name moves. */
    assert.match(html, /&#8987; Achieng O\./, 'and it names who has it');
    assert.match(html, /title="[^"]*Achieng Otieno/,
      'and the whole name is one hover away');
    assert.ok(!/data-rv-verdict="held"/.test(html), 'waiting is not a verdict');
    assert.match(html, /data-rv-waiting="1"/, 'and the card is flagged for the amber edge');
  });

  test('the two states are drawn differently, which is the whole point', async () => {
    const { win } = world({ user: BOSS, negotiationView: true });
    const { c, a, b } = await three(win);
    win.reviewAsk(c, { reviewer: BOSS, by: ME.name, ids: [a.id, b.id] });
    win.reviewMark(c, b.id, 'held');           // refused
    // a is still unanswered                    // in flight
    const html = win.redlineChangeCardsHtml(c, { side: 'owner' });
    assert.match(html, /data-rv-held="1"/, 'the refusal is marked');
    assert.match(html, /data-rv-waiting="1"/, 'and the wait is marked separately');
    assert.ok(html.indexOf('data-rv-held="1"') !== html.indexOf('data-rv-waiting="1"'),
      'they are two states on two cards, not one state wearing two names');
  });

  test('the chip clears the moment the reviewer answers', async () => {
    const { win } = world({ user: BOSS, negotiationView: true });
    const { c, b } = await three(win);
    win.reviewAsk(c, { reviewer: BOSS, by: ME.name, ids: [b.id] });
    assert.equal(win.reviewOutFor(c, win.negoChangeById(c, b.id)), BOSS.name);
    win.reviewMark(c, b.id, 'cleared');
    assert.equal(win.reviewOutFor(c, win.negoChangeById(c, b.id)), null,
      'answered is not waiting — the verdict speaks from here on');
  });

  test('a change out for review loses its Send button', async () => {
    const { win } = world({ negotiationView: true });
    const { c, a, b } = await three(win);
    win.reviewAsk(c, { reviewer: BOSS, ids: [b.id] });
    const html = win.redlineChangeCardsHtml(c, { side: 'owner' });
    assert.ok(html.includes(`data-rl-send="${a.id}"`), 'the one nobody is reading may go');
    assert.ok(!html.includes(`data-rl-send="${b.id}"`), 'the one being read may not');
  });

  test('and the counterparty is told none of it', async () => {
    const { win } = world({ negotiationView: true });
    const { c, b } = await three(win);
    win.reviewAsk(c, { reviewer: BOSS, ids: [b.id] });
    const asThem = win.redlineChangeCardsHtml(c, { side: 'counterparty', readonly: true, hiddenIds: [] });
    assert.ok(!/With Achieng/.test(asThem));
    assert.ok(!/data-rv-waiting/.test(asThem), 'not even that something is being looked at');
  });
});

/* ============================================================
   3 — THE GATE STAYS OFF THE CHANGES IT WAS NOT ASKED ABOUT
   ============================================================ */
describe('f157 · a narrow review locks narrowly', () => {
  const GATE = { reviewGate: { on: true, when: 'always', value: 0 } };

  test('with the rule ON, a review of one change still blocks — the others are unreviewed', async () => {
    const { win } = world({ settings: GATE });
    const { c, b } = await three(win);
    win.reviewAsk(c, { reviewer: BOSS, ids: [b.id] });
    const g = win.reviewGate(c);
    assert.equal(g.ok, false, 'the other two have been looked at by nobody');
    assert.equal(g.reason, 'with-reviewer');
  });

  test('with the rule OFF, the rest of the round is not held up', async () => {
    const { win } = world();
    const { c, b } = await three(win);
    win.reviewAsk(c, { reviewer: BOSS, ids: [b.id] });
    assert.equal(win.reviewGate(c).ok, true, 'nothing refuses the send');
    const w = win.reviewSendWarning(c);
    assert.ok(w, 'but it does warn');
    assert.equal(w.n, 1);
    assert.equal(w.who, BOSS.name);
    assert.deepEqual([...w.restIds].sort(), [...win.reviewSendable(c).map(x => x.id)].sort(),
      'and offers exactly the ones that are ready');
  });

  test('the warning names who and how many, and disappears once answered', async () => {
    const { win } = world({ user: BOSS });
    const { c, b } = await three(win);
    win.reviewAsk(c, { reviewer: BOSS, by: ME.name, ids: [b.id] });
    assert.match(win.reviewSendWarning(c).text, /with Achieng Otieno/);
    win.reviewMark(c, b.id, 'cleared');
    assert.equal(win.reviewSendWarning(c), null, 'answered, so there is nothing to warn about');
  });

  test('no review, no warning', async () => {
    const { win } = world();
    const { c } = await three(win);
    assert.equal(win.reviewSendWarning(c), null);
  });
});

/* ============================================================
   4 — AND IT DOES NOT TRAVEL
   ============================================================ */
describe('f157 · an unanswered change stays out of the payload', () => {
  function payloadWorld(){
    const W = new JSDOM('<!doctype html><body></body>', { url: 'https://hati.test/' }).window;
    const s = loadViews(
      ['js/richdoc.js', 'js/redline.js', 'js/clausemodel.js', 'js/negotiation.js',
        'js/review.js', 'js/core.js'],
      { TEMPLATES: STUB_TEMPLATES, FOLDERS: STUB_FOLDERS,
        document: W.document, crypto: W.crypto, NodeFilter: W.NodeFilter,
        Node: W.Node, DOMParser: W.DOMParser });
    s.currentUser = () => ME;
    s.getUsers = () => [ME, BOSS];
    s.state = { settings: {}, contracts: [] };
    s.logAudit = (c, a, d) => { (c.audit = c.audit || []).push({ action: a, detail: d }); };
    s.persist = () => {}; s.toast = () => {};
    return s;
  }

  test('wording being read by a colleague does not reach the counterparty', async () => {
    const s = payloadWorld();
    const c = contract(); s.negoInit(c);
    const cl = n => s.negoClauseList(c).find(x => x.num === n);
    const ready = await s.negoEditClause(c, cl('4').clauseId,
      '<p>Payable within forty-five (45) days.</p>',
      { side: 'owner', author: ME.name, summary: 'net-45' });
    const reading = await s.negoEditClause(c, cl('6').clauseId,
      '<p>Liability is uncapped without limit of any kind.</p>',
      { side: 'owner', author: ME.name, summary: 'no cap' });

    s.reviewAsk(c, { reviewer: BOSS, ids: [reading.id] });

    const p = s.buildSharePayload(c, 'hash', { org: 'Wanjiru Catering Ltd', sharedBy: ME.name });
    const ids = (p.contract.changes || []).map(x => x.id);
    assert.ok(ids.includes(ready.id), 'the one nobody is reading travels');
    assert.ok(!ids.includes(reading.id), 'the one being read does not');
    assert.ok(!/without limit of any kind/i.test(JSON.stringify(p)),
      'and neither does its wording, anywhere');
  });

  test('once it comes back cleared, it travels', async () => {
    const s = payloadWorld();
    const c = contract(); s.negoInit(c);
    const cl = s.negoClauseList(c).find(x => x.num === '6');
    const ch = await s.negoEditClause(c, cl.clauseId, '<p>Liability is uncapped.</p>',
      { side: 'owner', author: ME.name, summary: 'no cap' });
    s.reviewAsk(c, { reviewer: BOSS, ids: [ch.id] });
    s.currentUser = () => BOSS;
    s.reviewMark(c, ch.id, 'cleared');
    s.reviewReturn(c, {});
    const p = s.buildSharePayload(c, 'hash', { org: 'W', sharedBy: ME.name });
    assert.ok((p.contract.changes || []).map(x => x.id).includes(ch.id));
  });
});

/* ============================================================
   5 — THE REFUSAL NAMES THE RIGHT REASON
   ============================================================
   The gate asks "is anything sendable?" before "is anything out for review?",
   so the set it asks the first question about must exclude ONLY holds. Build it
   from the send-ready set instead — which also excludes what is being read —
   and a contract whose every change is sitting with a colleague reports
   "everything is held back by Achieng", which is a refusal naming a decision
   nobody made. Caught in the prototype, pinned here for the real one. */
describe('f157 · out for review is not the same refusal as held', () => {
  test('with everything out, the gate says who has it — not that it was held', async () => {
    const { win } = world({ settings: { reviewGate: { on: true, when: 'always', value: 0 } } });
    const { c } = await three(win);
    win.reviewAsk(c, { reviewer: BOSS });               // all three, nothing ruled on
    const g = win.reviewGate(c);
    assert.equal(g.ok, false);
    assert.equal(g.reason, 'with-reviewer', 'in flight, not refused');
    assert.match(win.reviewGateMessage(c), /with Achieng Otieno for internal review/);
    assert.ok(!/held back/.test(win.reviewGateMessage(c)),
      'nobody has held anything, so the refusal must not say they did');
  });

  test('and once they really are all held, it says that instead', async () => {
    const { win } = world({ user: BOSS, settings: { reviewGate: { on: true, when: 'always', value: 0 } } });
    const { c, a, b, d } = await three(win);
    win.reviewAsk(c, { reviewer: BOSS, by: ME.name });
    [a, b, d].forEach(x => win.reviewMark(c, x.id, 'held'));
    win.reviewReturn(c, {});
    const g = win.reviewGate(c);
    assert.equal(g.reason, 'all-held');
    assert.match(win.reviewGateMessage(c), /nothing to send/);
  });
});
