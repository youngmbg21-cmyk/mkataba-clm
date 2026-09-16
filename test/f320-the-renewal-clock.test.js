/* ============================================================
   F320 — THE RENEWAL CLOCK SEES THE NOTICE PERIOD, AND THE MAIL
   REACHES THE PERSON WHOSE CONTRACT IT IS
   ============================================================
   (Owner-ruled 16 Sep 2026, off the overnight review.)

   HaTi has carried a complete renewal machine for a month — renewalWindow,
   renewalDecisionDate, the calendar's horizon, the overnight memo, the desk
   row and this twice-daily sweep — and all six of them count back from the
   expiry by metadata.noticePeriodDays. Nothing on any screen could put that
   number there on a contract HaTi itself drafted:

     · the Distributor Agreement PRINTS "terminable on 90 days' written
       notice" and that blank saved to c.fields.noticeDays, which the paper
       prints and NOTHING else reads;
     · the upload's extractor found the number, and "Fill from document"
       kept four fields and threw the rest away;
     · an uploaded template whose blank is labelled "notice" mapped itself
       and worked — so somebody else's paper worked and ours did not;
     · and the Renewal card had been telling readers to "correct it on Key
       terms" for a month, pointing at a row that did not exist.

   With no number the clock falls back to the expiry itself, which is the one
   day that is already too late — and the card said nothing about the gap, so
   the screen looked correct. AN ABSENCE IS STATED, NEVER GUESSED.

   THE MAIL half is the owner's own ruling of the same day. Every renewal
   notice went to the admin list and to nobody else, which made an admin a
   message router for deadlines they do not own. The contract's OWNER now gets
   all six rungs (90/60/30 to expiry, 14/7/1 to the decision date) and the
   admins keep the LAST of each — 30 days and 1 day — as the escalation, the
   shape an overdue obligation already uses when it reaches them on day four.

   THE OWNER IS READ OFF THE PARSED RECORD, NOT OFF THE SQL ROW. The row comes
   from a contracts table with no owner column, so `c.owner` is undefined — the
   held-obligation branch further down still reads it that way and has always
   fallen through to the admins (logged, not fixed here). The ADDRESS is looked
   up, never taken from the record (the open-relay rule), and an owner who
   cannot open the contract's value stream is not told it exists.

   Every send lands on a recording mail stub; nothing reaches a real inbox. */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startHatiWithMail, seedWorkspace } = require('./helpers');

const isoDay = off => {
  const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + off);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

describe('F320 — the renewal clock and who it tells', () => {
  let h, W, mail;
  const ADMIN_EMAIL = 'admin@example.co.ke';
  const OWNER_EMAIL = 'everything@example.co.ke';
  const OWNER_NAME = 'Unrestricted Legal';

  const pause = ms => new Promise(r => setTimeout(r, ms));
  /* The sweep's sends are fire-and-forget by design, so the stub is read after
     a settle: wait for the expected arrival, then a beat longer so an
     unexpected second mail has had time to land before "exactly one" is
     asserted. Copied from f212, which fixed the same class of mail. */
  const settle = async (pred, ms = 2500) => {
    const end = Date.now() + ms;
    while (Date.now() < end && !pred()) await pause(25);
    await pause(200);
  };
  const run = () => W.admin.raw('/api/reminders/run', { method: 'POST', body: {} });
  const about = id => mail.sent.filter(m => (m.subject + ' ' + m.text).includes(id));
  const toOf = id => about(id).map(m => m.to).sort();

  /* One contract, one owner, one expiry that lands exactly on a milestone. */
  const put = (id, extra) => W.admin.json('/api/contracts/' + id, { method: 'PUT', body: { contract: Object.assign({
    id, name: 'Distribution — ' + id, counterparty: 'Savannah Consumer Goods Limited',
    status: 'Signed', folder: 'sales', fields: {}, metadata: {},
    audit: [], rounds: [], versions: [], signatures: [], comments: [], obligations: [],
  }, extra) } });

  before(async () => {
    h = await startHatiWithMail();
    W = await seedWorkspace(h);
    mail = h.mail;
  });
  after(async () => { await h.stop(); });

  /* ---------------------------------------------------------------
     1 · THE DECISION DATE EXISTS AT ALL
     A notice period on the record is what turns an expiry into a
     decision deadline. Without it there is only the expiry.
     --------------------------------------------------------------- */
  test('1 a contract with a notice period fires its decision mail; one without fires none', async () => {
    const withNotice = 'MK-N01', without = 'MK-N02';
    // decision date = expiry - notice, and we want that to be exactly 7 days out
    await put(withNotice, { expiry: isoDay(7 + 45), owner: { id: null, name: OWNER_NAME },
      metadata: { noticePeriodDays: 45 } });
    await put(without, { expiry: isoDay(7 + 45), owner: { id: null, name: OWNER_NAME }, metadata: {} });
    await run();
    await settle(() => about(withNotice).some(m => /decision/i.test(m.subject)));
    const decided = about(withNotice).filter(m => /decision/i.test(m.subject));
    const blind = about(without).filter(m => /decision/i.test(m.subject));
    assert.equal(decided.length > 0, true, 'a recorded notice period produces a decision mail');
    assert.equal(blind.length, 0, 'no notice period, no decision deadline — and no guess at one');
  });

  /* ---------------------------------------------------------------
     2 · THE MAIL GOES TO THE OWNER
     --------------------------------------------------------------- */
  test('2 the owner is mailed, and on an early rung the admins are not', async () => {
    const id = 'MK-N03';
    await put(id, { expiry: isoDay(90), owner: { id: null, name: OWNER_NAME }, metadata: {} });
    await run();
    await settle(() => about(id).length > 0);
    const to = toOf(id);
    assert.equal(to.includes(OWNER_EMAIL), true, 'the contract owner is told');
    assert.equal(to.includes(ADMIN_EMAIL), false, '90 days is the owner\'s rung alone');
  });

  test('3 on the last rung the admins are brought in beside the owner', async () => {
    const id = 'MK-N04';
    await put(id, { expiry: isoDay(30), owner: { id: null, name: OWNER_NAME }, metadata: {} });
    await run();
    await settle(() => about(id).length > 1);
    const to = toOf(id);
    assert.equal(to.includes(OWNER_EMAIL), true, 'the owner still gets it');
    assert.equal(to.includes(ADMIN_EMAIL), true, '30 days escalates to the admins');
  });

  /* ---------------------------------------------------------------
     4 · NOTHING GOES QUIETER THAN IT WAS
     An unowned contract keeps the admin mail on every rung.
     --------------------------------------------------------------- */
  test('4 an unowned contract still mails the admins on an early rung', async () => {
    const id = 'MK-N05';
    await put(id, { expiry: isoDay(60), metadata: {} });   // no owner at all
    await run();
    await settle(() => about(id).length > 0);
    assert.equal(toOf(id).includes(ADMIN_EMAIL), true,
      'with nobody to address, the admin mail runs exactly as it did');
  });

  /* ---------------------------------------------------------------
     5 · AN OWNER WHO CANNOT OPEN THE STREAM IS NOT TOLD IT EXISTS
     The scope check the daily brief beside this one already makes.
     --------------------------------------------------------------- */
  test('5 an out-of-scope owner is not mailed; the admins are', async () => {
    /* The seeded "Restricted Legal" can reach 'proc' and nothing else; this
       contract is filed under 'sales'. */
    const restricted = W.users.restricted;
    const id = 'MK-N06';
    await put(id, { expiry: isoDay(90), folder: 'sales',
      owner: { id: restricted.id, name: restricted.name }, metadata: {} });
    await run();
    await settle(() => about(id).length > 0);
    const to = toOf(id);
    assert.equal(to.includes(restricted.email), false,
      'an owner who cannot reach the stream is never told the contract exists');
    assert.equal(to.includes(ADMIN_EMAIL), true, 'and the admin mail runs instead');
  });

  /* ---------------------------------------------------------------
     6 · THE MAIL IS TRANSLATED, BECAUSE IT NOW HAS A NAMED READER
     While every reader was an admin getting identical words, hardcoded
     English was safe. Addressed to a person it is not.
     --------------------------------------------------------------- */
  test('6 the renewal mail follows the reader\'s own language', async () => {
    const owner = W.users.unrestricted;
    await W.unrestricted.json('/api/me/lang', { method: 'PUT', body: { lang: 'sv' } });
    const id = 'MK-N07';
    await put(id, { expiry: isoDay(90), owner: { id: owner.id, name: owner.name }, metadata: {} });
    await run();
    await settle(() => about(id).some(m => m.to === OWNER_EMAIL));
    const mine = about(id).find(m => m.to === OWNER_EMAIL);
    assert.ok(mine, 'the owner was mailed');
    assert.match(mine.subject, /Förnyelse/,
      'a Swedish reader gets Swedish — the words are keys now, not literals');
    await W.unrestricted.json('/api/me/lang', { method: 'PUT', body: { lang: 'en' } });
  });

  /* ---------------------------------------------------------------
     7 · SENT ONCE. The dedupe key did not change, so an already-reminded
     contract is not re-fired by this upgrade.
     --------------------------------------------------------------- */
  test('7 running the sweep twice sends nothing a second time', async () => {
    const id = 'MK-N08';
    await put(id, { expiry: isoDay(90), owner: { id: null, name: OWNER_NAME }, metadata: {} });
    await run();
    await settle(() => about(id).length > 0);
    const first = about(id).length;
    await run();
    await pause(600);
    assert.equal(about(id).length, first, 'one dedupe row per milestone, however many addresses');
  });
});

/* ============================================================
   AND THE SCREEN HALF — the row a reader actually presses
   ============================================================
   The mail above only works once the number is on the record, and until this
   change there was no way to put it there by hand. The panel is mounted and
   wired the way the tab mounts it, so these press the row a person presses
   rather than calling the setter behind it — f77's own harness, which exists
   for exactly this. */
const { buildWorld } = require('./world');

function ktShell(win){
  win.isMonetary = c => (c.valueType || 'estimated') !== 'none';
  win.fmtMoney = v => 'KES ' + Number(v || 0).toLocaleString('en-KE');
  win.fmtDocDate = v => String(v || '');
  win.streamLabel = () => 'Cost';
  win.keyTermsProgress = () => {};
  win.syncKeyTermsUI = () => {};
  win.renderAuditSection = () => {};
  win.todayStr = () => '16 Sep 2026';
}

function keyTerms(over = {}){
  const { win } = buildWorld({ contractView: true });
  ktShell(win);
  const c = Object.assign({ id: 'MK-320', name: 'Distributor Agreement',
    counterparty: 'Savannah Consumer Goods Limited', template: 'DA',
    status: 'Under Review', folder: 'sales', fields: {}, metadata: {},
    audit: [], rounds: [], versions: [], signatures: [], comments: [] }, over);
  const host = win.document.createElement('div');
  host.id = 'kt-rows';
  win.document.body.appendChild(host);
  host.innerHTML = win.ktTermsRowsHtml(c, { editable: true });
  win.wireKtRows(c); win.wireKeyTerms(c);
  return { win, c, host,
    row: k => host.querySelector(`[data-kt-row="${k}"]`),
    field: k => host.querySelector(`[data-kt="${k}"]`),
    press: el => el.dispatchEvent(new win.Event('click', { bubbles: true })),
    set: (el, v) => { el.value = v; el.dispatchEvent(new win.Event('change', { bubbles: true })); } };
}

describe('F320 — the notice period has a row, and it keeps the paper true', () => {
  test('8 the row sits between the expiry and the value stream, and reads as a value', () => {
    const k = keyTerms();
    assert.ok(k.row('notice'), 'the row the Renewal card has been pointing at for a month');
    assert.match(k.row('notice').textContent, /Notice/,
      'named as the metadata dialog and the phone name it — three surfaces, one word');
    assert.match(k.row('notice').textContent, /Not set/,
      'read as a value, not as an empty box');
    const order = [...k.host.querySelectorAll('[data-kt-row]')].map(r => r.getAttribute('data-kt-row'));
    assert.equal(order.indexOf('notice'), order.indexOf('expiry') + 1,
      'the notice period belongs beside the date it is counted back from');
  });

  test('9 typing a number records it, and writes it onto the paper too', () => {
    const k = keyTerms();
    k.press(k.row('notice').querySelector('[data-kt-edit]'));
    k.set(k.field('notice'), '90');
    assert.equal(k.c.metadata.noticePeriodDays, 90, 'the clock can read it');
    assert.equal(k.c.metadata.confidence.noticePeriodDays, 'high', 'somebody typed it');
    /* THE PAPER STAYS TRUE. The Distributor Agreement's clause 4 prints
       c.fields.noticeDays; a row that moved only the record would leave the
       page saying 90 while the clock counted 30 — this fault, restated the
       other way round. */
    assert.equal(k.c.fields.noticeDays, '90', 'and the clause prints the same number');
  });

  test('10 an empty box clears the fact — it never writes a zero', () => {
    const k = keyTerms({ metadata: { noticePeriodDays: 90, confidence: { noticePeriodDays: 'high' } },
      fields: { noticeDays: '90' } });
    k.press(k.row('notice').querySelector('[data-kt-edit]'));
    k.set(k.field('notice'), '');
    /* Every reader asks Number(…)||0 and reads 0 as "none stated", so a stored
       zero would say "no notice period" in a field somebody deliberately
       emptied — the same fact, written as a number nobody typed. */
    assert.equal(Object.prototype.hasOwnProperty.call(k.c.metadata, 'noticePeriodDays'), false,
      'cleared, not zeroed');
    assert.equal(Object.prototype.hasOwnProperty.call(k.c.fields, 'noticeDays'), false,
      'and the paper stops printing a number nobody stands behind');
  });

  test('11 the box writes on change, not on every keystroke', () => {
    const k = keyTerms();
    k.press(k.row('notice').querySelector('[data-kt-edit]'));
    const inp = k.field('notice');
    assert.equal(inp.type, 'number', 'a number box');
    /* Typing 90 through an `input`-driven handler stores 9 first — and for a
       figure the renewal clock reads, a nine-day notice period would sit on the
       record with a confidence stamp of 'high' until the second digit landed. */
    inp.value = '9';
    inp.dispatchEvent(new k.win.Event('input', { bubbles: true }));
    assert.equal(k.c.metadata.noticePeriodDays, undefined,
      'half a number is not a fact');
    k.set(inp, '90');
    assert.equal(k.c.metadata.noticePeriodDays, 90);
  });

  test('12 a signed contract states it and does not offer to change it', () => {
    const { win } = buildWorld({ contractView: true });
    ktShell(win);
    const c = { id: 'MK-321', name: 'Distributor Agreement', counterparty: 'Savannah',
      template: 'DA', status: 'Signed', folder: 'sales', fields: {},
      metadata: { noticePeriodDays: 90 }, audit: [], rounds: [], versions: [],
      signatures: [], comments: [] };
    const html = win.ktTermsRowsHtml(c, { editable: false });
    assert.match(html, /data-kt-row="notice"/, 'the record still says what the notice period is');
    assert.doesNotMatch(html, /data-kt="notice"/, 'but there is nothing to type into');
  });
});

/* ============================================================
   AND WHAT YOU DECIDED ABOUT IT — solutions 1 and 9 of the build plan
   ============================================================
   (Owner-approved 16 Sep 2026: "the whole card as drawn".)

   HaTi was very good at saying a renewal deadline was coming and had nowhere
   to write down the answer, so it went on asking about a decision taken three
   weeks ago and the only way to quieten it was to archive a contract that was
   still running.

   THE DECISION IS RECORDED AGAINST THE DEADLINE IT ANSWERED. `decideBy`,
   `expiry` and `notice` are stamped at the press, and the answer counts only
   while all three still hold — so moving the expiry or correcting the notice
   period lapses it of its own accord and every reminder starts again, with no
   sweep and no migration. Most of the claims below are about that rule and
   about the four surfaces that have to agree with it. */
const { buildWorld: rnWorld } = require('./world');

function rnStage(over = {}){
  /* `desk` is here for daysUntil, which js/obligations.js reads BARE — it is
     declared in a view file, so on a stage without one renewalWindow throws
     rather than falling back. The desk option stubs it with the product's own
     Math.ceil, and brings the overnight desk with it, which is one of the four
     surfaces a recorded answer has to reach. */
  const { win } = rnWorld({ obligations: true, templates: true, templateFields: true, desk: true });
  const c = Object.assign({ id: 'MK-D01', name: 'Distributor Agreement',
    counterparty: 'Savannah Consumer Goods Limited', status: 'Signed', folder: 'sales',
    execution: { at: new Date().toISOString(), by: 'Amina Otieno' },
    expiry: isoDay(150), fields: {},
    metadata: { expiryDate: isoDay(150), noticePeriodDays: 90, renewalType: 'auto-renew' },
    audit: [], rounds: [], versions: [], signatures: [], comments: [], obligations: [] }, over);
  return { win, c };
}
/* The shape contractSetRenewalDecision writes, built here so the reading can be
   tested without a DOM press — the press itself is driven in the browser file. */
function rnAnswer(win, c, answer, over = {}){
  const w = win.renewalWindow(c), q = win.renewalQuestionOf(c);
  c.renewalDecision = Object.assign({ answer, at: new Date().toISOString(),
    by: { id: 'u_1', name: 'Amina Otieno' }, why: '',
    decideBy: w.decideBy, expiry: q.expiry, notice: q.notice }, over);
  return c;
}

describe('F320 — the renewal decision, and the deadline it answers', () => {
  test('13 an answer stamped with the question silences the nags; one with no stamp silences nothing', () => {
    const { win, c } = rnStage();
    assert.equal(win.renewalDecided(c), false, 'nothing recorded, nothing settled');
    rnAnswer(win, c, 'renegotiate');
    assert.equal(win.renewalDecided(c), true, 'a stamped answer settles it');
    /* AN ANSWER THAT COULD NEVER LAPSE IS A PERMANENT SILENCE NOBODY CAN
       ACCOUNT FOR. A record with no decideBy/expiry pair cannot be checked
       against today's question, so it is not trusted — the safe direction. */
    c.renewalDecision = { answer: 'renew', at: new Date().toISOString(), by: { id: 'u_1', name: 'A' } };
    assert.equal(win.renewalDecided(c), false, 'no stamp, no silence');
  });

  test('14 moving the notice period or the expiry lapses the answer, and the card can say so', () => {
    const { win, c } = rnStage();
    rnAnswer(win, c, 'renew');
    assert.equal(win.renewalDecided(c), true);
    c.metadata.noticePeriodDays = 60;
    assert.equal(win.renewalDecided(c), false, 'a different notice period is a different question');
    assert.equal(win.renewalDecisionStale(c), true, 'and the answer is stale rather than absent');
    c.metadata.noticePeriodDays = 90;
    assert.equal(win.renewalDecided(c), true, 'putting it back answers the original question again');
    c.metadata.expiryDate = isoDay(151); c.expiry = isoDay(151);
    assert.equal(win.renewalDecided(c), false, 'and so is a different expiry');
  });

  test('15 the answer rides on renewalWindow, so every surface that asks it learns for free', () => {
    const { win, c } = rnStage();
    assert.equal(win.renewalWindow(c).decided, false);
    rnAnswer(win, c, 'lapse');
    const w = win.renewalWindow(c);
    assert.equal(w.decided, true, 'the card and the overnight desk read this word');
    assert.equal(w.decision.answer, 'lapse', 'and the answer itself, so neither keeps a copy of the rule');
    assert.equal(w.inWindow, true, 'the deadline is not taken off the screen — the card still draws');
  });

  test('16 reading the decision never writes — a card redraws on every paint', () => {
    const { win, c } = rnStage();
    rnAnswer(win, c, 'renew');
    const before = JSON.stringify(c);
    win.renewalDecided(c); win.renewalDecisionOf(c); win.renewalDecisionStale(c);
    win.renewalWindow(c); win.renewalQuestionOf(c);
    assert.equal(JSON.stringify(c), before, 'the record is untouched by being looked at');
  });

  test('17 who the reminders reach is answered three ways, because there are three facts', () => {
    const { win, c } = rnStage();
    win.getUsers = () => ([{ id: 'u_9', name: 'Amina Otieno', email: 'amina@example.co.ke' }]);
    win.canAccessFolder = () => true;
    c.owner = { id: 'u_9', name: 'Amina Otieno' };
    assert.equal(win.renewalNoticeTo(c).why, 'owner', 'a member with an address is told');
    /* RECORDED BUT UNREACHABLE IS NOT THE SAME FACT AS NOT RECORDED — the
       server sends to the admins in both cases, but only one of them has a
       fix the reader can act on. */
    win.canAccessFolder = () => false;
    assert.equal(win.renewalNoticeTo(c).why, 'unreachable', 'out of the stream is its own answer');
    win.canAccessFolder = () => true;
    c.owner = { id: 'u_nope', name: 'Nobody At All' };
    assert.equal(win.renewalNoticeTo(c).why, 'none', 'a name matching no member reaches nobody');
    /* AND THE ENTRY CONDITION IS THE SERVER'S, WHICH IS NARROWER THAN
       contractOwnerName's. The server's ownerOf bails on `!full.owner` and the
       mail goes to the admins. contractOwnerName falls through to `_raisedBy`,
       the transport HEAVY computes off the audit trail for records raised
       before the owner field existed — so a record with only that would have
       named somebody the sweep never writes to. */
    delete c.owner;
    c._raisedBy = 'Amina Otieno';
    assert.equal(win.renewalNoticeTo(c).why, 'none',
      'no stored owner is no owner, exactly as the sweep reads it');
  });

  test('18 only paper that states a notice period is asked for one', () => {
    const { win } = rnStage();
    const f = id => (win.builtinTemplateFields(id) || []).find(x => x.maps === 'noticePeriodDays');
    assert.ok(f('DA'), 'the Distributor Agreement prints the blank, so it asks for it');
    assert.equal(f('DA').key, 'noticeDays', 'keyed to the very blank clause 4 prints');
    assert.equal(f('DA').def, '90', 'and defaulted to what the clause has always said');
    /* CM's clause 3 carries `auditNotice` — the notice before an AUDIT VISIT.
       Mapping it would put a seven-day renewal deadline on every co-packing
       agreement. ND says "by written notice" with no number to key to. */
    assert.equal(f('CM'), undefined, 'an audit-visit notice is not a termination notice');
    assert.equal(f('ND'), undefined, 'and words with no figure are not a figure');
    ['RM', 'PK', 'EQ', 'WH', 'FF', 'RL', 'MK', 'LE', 'PS'].forEach(id =>
      assert.equal(f(id), undefined, `${id} says nothing about notice and is not asked`));
    assert.equal(Object.keys(win.TEMPLATE_NOTICE).length, 12,
      'every built-in is NAMED in the table — an omission looks identical to a null');
  });

  test('19b the contract graph stops saying a decision is owed', () => {
    /* MEASURED, not grepped. graphNodeFacts already HELD the answer — it calls
       renewalWindow and reads two keys off the object `decided` rides on — and
       threw it away, so a node would have printed "decide in 60 days" on a
       renewal the card said was settled. That is the two-screens-disagree fault
       class by name, and it was one word from the fix. */
    const { win } = rnWorld({ intelView: true, obligations: true, desk: true });
    const c = { id: 'MK-D02', name: 'Distributor Agreement', status: 'Signed', folder: 'sales',
      execution: { at: new Date().toISOString(), by: 'A' },
      expiry: isoDay(150), fields: {},
      metadata: { expiryDate: isoDay(150), noticePeriodDays: 90, renewalType: 'auto-renew' },
      audit: [], rounds: [], versions: [], signatures: [], comments: [], obligations: [] };
    assert.equal(typeof win.graphNodeFacts(c).decideDays, 'number',
      'the control: an unanswered renewal is still a fact on the node');
    const w = win.renewalWindow(c), q = win.renewalQuestionOf(c);
    c.renewalDecision = { answer: 'renew', at: new Date().toISOString(),
      by: { id: 'u_1', name: 'Amina Otieno' }, why: '',
      decideBy: w.decideBy, expiry: q.expiry, notice: q.notice };
    assert.equal(win.graphNodeFacts(c).decideDays, null,
      'and an answered one says nothing about a decision nobody owes');
  });

  test('19 a typed zero is not a notice period, on either door', () => {
    const { win } = rnStage();
    const c = { metadata: {}, fields: {} };
    const fields = [{ key: 'noticeDays', type: 'num', maps: 'noticePeriodDays' }];
    win.applyTemplateValues(c, fields, { noticeDays: '0' });
    /* Every reader in the product does Number(…)||0 and reads 0 as "none
       stated". The Key terms row DELETES the key for that reason; the drafting
       question must agree, or two doors onto one fact mean opposite things. */
    assert.equal(c.metadata.noticePeriodDays, undefined, 'zero records nothing, exactly as the row does');
    win.applyTemplateValues(c, fields, { noticeDays: '90' });
    assert.equal(c.metadata.noticePeriodDays, 90, 'a real figure is recorded');
    assert.equal(c.metadata.confidence.noticePeriodDays, 'high', 'a person typed it');
    assert.equal(String(c.fields.noticeDays), '90', 'and the paper keeps printing the same number');
  });
});

/* ============================================================
   AND THE SWEEP STOPS ASKING — the server's own half
   ============================================================
   TWO CONDITIONS, AND THEY ARE NOT THE SAME CONDITION, because the two ladders
   ask different questions. 14/7/1 counts to the DECISION date and asks what you
   are going to do; any answer settles it. 90/60/30 counts to the EXPIRY and
   says the agreement ends soon — deciding to renew does not make that untrue,
   so those keep running, and only a decision to LET IT LAPSE stops them too.
   The card says which, in those words, rather than promising a silence the
   sweep does not deliver.

   AND THE WALL: recording a decision silences six mails, so a request that
   files one in a colleague's name is a request to make somebody else appear to
   have taken a decision they did not take. THE SERVER IS THE WALL. */
describe('F320 — a recorded decision stops the sweep, and the server checks who made it', () => {
  let h, W, mail, meId;
  const ADMIN_EMAIL = 'admin@example.co.ke';
  const pause = ms => new Promise(r => setTimeout(r, ms));
  const settle = async (pred, ms = 2500) => {
    const end = Date.now() + ms;
    while (Date.now() < end && !pred()) await pause(25);
    await pause(200);
  };
  const run = () => W.admin.raw('/api/reminders/run', { method: 'POST', body: {} });
  const about = id => mail.sent.filter(m => (m.subject + ' ' + m.text).includes(id));

  before(async () => {
    h = await startHatiWithMail();
    W = await seedWorkspace(h);
    mail = h.mail;
    const boot = await W.admin.json('/api/bootstrap');
    meId = String((boot.user || boot.me || {}).id || '');
  });
  after(async () => { await h.stop(); });

  /* The decision as the browser stamps it: the answer, who, and the question. */
  const answered = (answer, expiry, notice, over = {}) => Object.assign({
    answer, at: new Date().toISOString(), by: { id: meId, name: 'Amina Otieno' }, why: '',
    decideBy: expiry, expiry, notice: String(notice),
  }, over);

  const put = (id, extra) => W.admin.raw('/api/contracts/' + id, { method: 'PUT', body: { contract: Object.assign({
    id, name: 'Distribution — ' + id, counterparty: 'Savannah Consumer Goods Limited',
    status: 'Signed', folder: 'sales', fields: {}, metadata: {},
    audit: [], rounds: [], versions: [], signatures: [], comments: [], obligations: [],
  }, extra) } });

  test('20 an answered renewal stops the decision mail; an unanswered one still fires', async () => {
    const quiet = 'MK-D10', loud = 'MK-D11';
    const exp = isoDay(7 + 45);
    await put(quiet, { expiry: exp, owner: { id: null, name: 'Unrestricted Legal' },
      metadata: { noticePeriodDays: 45 }, renewalDecision: answered('renegotiate', exp, 45) });
    await put(loud, { expiry: exp, owner: { id: null, name: 'Unrestricted Legal' },
      metadata: { noticePeriodDays: 45 } });
    await run();
    await settle(() => about(loud).some(m => /decision/i.test(m.subject)));
    assert.equal(about(loud).filter(m => /decision/i.test(m.subject)).length > 0, true,
      'the control still asks — otherwise this test proves nothing');
    assert.equal(about(quiet).filter(m => /decision/i.test(m.subject)).length, 0,
      'a decision taken is not a decision owed');
  });

  test('21 letting it lapse stops the expiry warnings too; renewing does not', async () => {
    const lapse = 'MK-D12', renew = 'MK-D13';
    const exp = isoDay(30);
    await put(lapse, { expiry: exp, owner: { id: null, name: 'Unrestricted Legal' },
      metadata: {}, renewalDecision: answered('lapse', exp, 0) });
    await put(renew, { expiry: exp, owner: { id: null, name: 'Unrestricted Legal' },
      metadata: {}, renewalDecision: answered('renew', exp, 0) });
    await run();
    await settle(() => about(renew).length > 0);
    assert.equal(about(renew).length > 0, true,
      'there is still work owed before the date, so the warning keeps coming');
    assert.equal(about(lapse).length, 0,
      'an intended ending is not news');
  });

  test('22 an answer to a different question does not silence anything', async () => {
    const id = 'MK-D14';
    const exp = isoDay(7 + 45);
    /* Stamped against a notice period the record no longer carries: the
       question moved, so the answer lapsed. Any mismatch at all fails towards
       REMINDING — the worst case is a mail nobody needed, never a deadline
       that passed in silence. */
    await put(id, { expiry: exp, owner: { id: null, name: 'Unrestricted Legal' },
      metadata: { noticePeriodDays: 45 }, renewalDecision: answered('renew', exp, 60) });
    await run();
    await settle(() => about(id).some(m => /decision/i.test(m.subject)));
    assert.equal(about(id).filter(m => /decision/i.test(m.subject)).length > 0, true,
      'a stale answer is no answer, and the sweep asks again');
  });

  test('23 a decision must name the person recording it, and carry the deadline it answers', async () => {
    const exp = isoDay(120);
    const base = { expiry: exp, metadata: { noticePeriodDays: 30 } };
    const someoneElse = await put('MK-D15', Object.assign({}, base, {
      renewalDecision: answered('renew', exp, 30, { by: { id: 'u_somebody_else', name: 'Not Me' } }) }));
    assert.equal(someoneElse.status, 400, 'an answer filed in a colleague\'s name is refused');
    const unstamped = await put('MK-D16', Object.assign({}, base, {
      renewalDecision: { answer: 'renew', at: new Date().toISOString(), by: { id: meId, name: 'Amina Otieno' } } }));
    assert.equal(unstamped.status, 400, 'an answer that could never lapse is refused');
    const bogus = await put('MK-D17', Object.assign({}, base, {
      renewalDecision: answered('maybe-later', exp, 30) }));
    assert.equal(bogus.status, 400, 'and only the three answers are answers');
    const good = await put('MK-D18', Object.assign({}, base, {
      renewalDecision: answered('renew', exp, 30) }));
    assert.equal(good.status < 300, true, 'the reader\'s own answer goes through');
  });
});

/* ============================================================
   AND THE CARD DRAWS BOTH OF THEM
   ============================================================
   test/world.js cannot load js/ai.js — it says so itself — so the card is read
   as SOURCE, sliced between two function names the way f219 reads it. The
   presses themselves are driven with a real mouse in the browser. PIN THE
   REGION, NOT A BYTE COUNT. */
describe('F320 — the card carries the answers and names who is told', () => {
  const fs = require('node:fs');
  const ai = fs.readFileSync(require('node:path').join(__dirname, '..', 'js', 'ai.js'), 'utf8');
  const card = ai.slice(ai.indexOf('function renewalCardHtml'), ai.indexOf('function renderRenewalSection'));

  test('24 the three answers are on the face, and each is a real control', () => {
    ['renew', 'renegotiate', 'lapse'].forEach(a =>
      assert.ok(card.includes(`rn_ans_`), `the answers are drawn from one list, not written out three times`));
    assert.match(card, /data-rn-decide/, 'a real button with a real attribute, not a link');
    assert.match(card, /rn_what_decided/, 'and the row says what it is asking');
  });

  test('25 the owner line is drawn only while the question is open', () => {
    assert.match(card, /rn_to_owner_decide/, 'the person the reminders reach is named');
    /* THE LADDER FOLLOWS THE FACT: 14/7/1 counts to the decision date and only
       exists where a notice period is recorded. On a contract without one those
       three mails never fire, and the card two paragraphs above says exactly
       that — so it must not promise them here. */
    assert.match(card, /w\.notice\s*>\s*0\s*\?\s*'rn_to_owner_decide'\s*:\s*'rn_to_owner_expiry'/,
      'and the rungs named are the rungs that will actually fire');
    assert.match(card, /rn_to_unreachable/, 'an owner who cannot open the stream is its own fact');
    /* ASKED OF THE RECORD, NOT OF THE POSTURE. Pressing "Change the decision"
       puts the three answers back but writes nothing, so the recorded answer
       still stands and the sweep is still silent — a line promising reminders
       in that posture would be false for as long as the reader took to choose.
       renewal-decision-verify 5c measures that on a real press. */
    assert.match(card, /!dec\s*&&\s*toLine/,
      'once an answer is on file nobody "gets" a reminder that stopped');
    assert.ok(!/!settled\s*&&\s*toLine/.test(card),
      'and not merely while the decided reading is showing');
  });

  test('26 the decided card states what stopped without over-claiming', () => {
    assert.match(card, /rn_stopped_2b/, 'the decision reminders stopped');
    assert.match(card, /rn_still_expiry/, 'and the expiry warnings did not — said, not hidden');
    assert.match(card, /rn_change/, 'with the way back on the same screen');
    assert.match(card, /rn_stale/, 'and an answer that no longer answers says so');
  });

  test('27 the card still mints nothing of its own', () => {
    assert.ok(!/createAmendment\(/.test(card),
      '"Start the renewal" stays the one door onto the paper — this records an intention');
  });
});
