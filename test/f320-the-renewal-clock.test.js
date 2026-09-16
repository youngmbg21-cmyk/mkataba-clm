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
