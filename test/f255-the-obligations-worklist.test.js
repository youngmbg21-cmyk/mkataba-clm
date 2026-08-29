/* f255 — THE OBLIGATIONS WORKLIST, AND CHASING (owner-asked 29 Aug 2026, J-2.3)
   ========================================================================
   The Obligations tab answers "what does THIS contract commit us to". The
   question underneath it — what is waiting on me this week, across everything
   — had no screen at all: the Calendar answers "what falls in October", which
   is a different question and a worse one to work from.

   WHAT IS PINNED HERE:
     1  it is a table of OBLIGATIONS, not of contracts, and it counts nothing
        of its own — one population, one band list, one verb
     2  every filter narrows that one population, and a dateless obligation is
        in no due window
     3  a row opens its contract on the Obligations tab
     4  CHASING records the fact whether or not the mail goes
     5  …and the address is the server's to decide, never the body's
     6  obligations still never travel to the counterparty
     7  both languages
   ======================================================================== */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld, supplyContract } = require('./world');
const { startHatiWithMail, seedWorkspace } = require('./helpers');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
const OB_CODE = strip(read('js/obligations.js'));
const APP = strip(read('js/app.js'));
const CORE = strip(read('js/core.js'));
const HOME = strip(read('js/views/home.js'));
const SRV = read('server/server.js');
const HTML = read('index.html');
const I18N = read('js/i18n.js');

const isoDay = off => { const d = new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate()+off);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };

/* A book spanning three contracts, because a worklist that cannot be shown to
   cross one is not a worklist. */
function book(){
  const w = buildWorld({ intelView: true, contractView: true });
  const win = w.win;
  const roster = [{ id: 'u1', name: 'Wanjiku Kamau', email: 'wanjiku@hati.test', role: 'admin' }];
  const c1 = supplyContract({ id: 'MK-1', name: 'Supply', folder: 'proc', obligations: [
    { id: 'a1', desc: 'Quarterly report', due: isoDay(-9), status: 'open', assignee: 'Wanjiku Kamau' },
    { id: 'a2', desc: 'Insurance on file', due: isoDay(200), status: 'open', assignee: 'Wanjiku Kamau' },
  ]});
  const c2 = supplyContract({ id: 'MK-2', name: 'Lease', folder: 'ops',
    counterparty: 'Nordkust', counterpartyEmail: 'ops@nordkust.test', obligations: [
    { id: 'b1', desc: 'Deliver the audited accounts', due: isoDay(-3), status: 'open', party: 'theirs' },
    { id: 'b2', desc: 'Undated duty', due: '', status: 'open', assignee: 'Nobody At All' },
    { id: 'b3', desc: 'Already filed', due: isoDay(-40), status: 'done', completedAt: isoDay(-41) },
  ]});
  const c3 = supplyContract({ id: 'MK-3', name: 'Declined one', status: 'Declined', obligations: [
    { id: 'c1', desc: 'Never counted', due: isoDay(-1), status: 'open' },
  ]});
  win.state = Object.assign(win.state || {}, { contracts: [c1, c2, c3], activeId: 'MK-1', view: 'obligations' });
  win.getUsers = () => roster;
  win.currentUser = () => roster[0];
  win.getContract = id => (win.state.contracts.find(x => x.id === id) || null);
  win._obwF = null;
  return { w, win, c1, c2, c3 };
}
const rowsWith = (win, f) => { const cur = win.obwFilters();
  Object.assign(cur, { whose:'all', state:'open', side:'all', folder:'all', due:'all' }, f || {});
  return win.obwRows(cur); };

/* ================================================ 1 — ONE POPULATION */
describe('f255 (1) — a table of obligations, counting nothing of its own', () => {
  test('it lists obligations from more than one contract', () => {
    const { win } = book();
    const r = rowsWith(win, {});
    assert.ok(new Set(r.map(x => x.cid)).size >= 2, 'more than one contract');
    assert.ok(r.every(x => x.cid && x.cname), 'and each row names the contract it is on');
  });

  test('the live book only — a declined contract has no deliverables', () => {
    const { win } = book();
    assert.ok(!rowsWith(win, { state: 'all' }).some(x => x.cid === 'MK-3'));
  });

  test('IT BORROWS EVERY READING', () => {
    /* allObligations for the book, obState for overdue, obligationBand for the
       pile, toggleObligation for the act. A new copy of any of them is how two
       screens come to disagree about one commitment. */
    const fn = OB_CODE.match(/function obwRows\(f\)\{[\s\S]*?\n\}/)[0];
    for (const r of ['allObligations()', 'obState(o)', 'obligationBand(o)', 'obligationDue(o)'])
      assert.ok(fn.includes(r), `${r} is the one reading and this page asks it`);
    assert.ok(!/status\s*=\s*['"]/.test(fn), 'and it writes nothing');
  });

  test('the bands are the tab’s own four, so the two screens agree', () => {
    const { win } = book();
    const list = OB_CODE.match(/function renderObligationsList\(\)\{[\s\S]*?\n\}/)[0];
    assert.match(list, /OBLIG_BANDS\.map/);
    assert.deepEqual(Array.from(win.OBLIG_BANDS).map(b => b[0]),
      ['overdue', 'month', 'later', 'done']);
  });

  test('and the door’s count is what is LATE, borrowed not derived', () => {
    const { win } = book();
    assert.equal(win.obligationsDoorCount(), 2, 'two overdue across the live book');
    assert.match(APP, /obligations: \(typeof obligationsDoorCount==='function'\)\?obligationsDoorCount\(\):0/);
    assert.match(APP, /obligations:'amber'/, 'amber, like every count that means work owed');
  });
});

/* ================================================ 2 — THE FILTERS */
describe('f255 (2) — every filter narrows the one population', () => {
  test('state, side and whose', () => {
    const { win } = book();
    assert.equal(rowsWith(win, { state: 'overdue' }).length, 2);
    assert.equal(rowsWith(win, { state: 'done' }).length, 1);
    assert.equal(rowsWith(win, { state: 'all' }).length, 5);
    assert.equal(rowsWith(win, { side: 'theirs' }).length, 1);
    assert.equal(rowsWith(win, { whose: 'mine' }).length, 2, 'both of Wanjiku’s');
    assert.equal(rowsWith(win, { whose: 'none' }).length, 2,
      'the theirs one and the one named after nobody — neither will be reminded');
  });

  test('the value stream narrows it too', () => {
    const { win } = book();
    assert.equal(rowsWith(win, { folder: 'ops', state: 'all' }).length, 3);
    assert.equal(rowsWith(win, { folder: 'proc', state: 'all' }).length, 2);
  });

  test('A DATELESS OBLIGATION IS IN NO DUE WINDOW', () => {
    /* Nothing is ever sent about one and no window can contain it. Dropping it
       here is what makes "due in 7 days" mean the same thing on this page as
       it does in the bell. */
    const { win } = book();
    const r = rowsWith(win, { due: '7' });
    assert.ok(!r.some(x => x.id === 'b2'), 'the undated one is not in the window');
    assert.equal(r.length, 2, 'the two overdue ones are');
    assert.ok(rowsWith(win, { due: 'all' }).some(x => x.id === 'b2'), 'and it is not lost');
  });

  test('the filters are per sitting, not stored', () => {
    /* A stored filter lands a reader on a narrowed page a week later with
       nothing on screen saying why — the register's own lesson, and this page
       has no saved-view machinery to say it with. */
    assert.ok(!/localStorage/.test(OB_CODE.match(/function obwFilters\(\)\{[\s\S]*?\n\}/)[0]));
    assert.ok(!/lsSet\(OBW_KEY/.test(OB_CODE));
  });

  test('a stream the reader cannot see is not on the list', () => {
    const { win } = book();
    win.canAccessFolder = f => f !== 'ops';
    assert.ok(!rowsWith(win, { state: 'all' }).some(x => x.cid === 'MK-2'));
  });
});

/* ================================================ 3 — THE DOOR AND THE LANDING */
describe('f255 (3) — the door, and where a row lands', () => {
  test('it is a door in the EVERYDAY group with a count', () => {
    assert.match(HTML, /data-view="obligations" class="nav-item"/);
    assert.match(HTML, /data-count="obligations"/);
    /* ABOVE THE ADMINISTRATION FOLD, which starts shut — the wrong shelf for a
       door every role presses, and the exact mistake the Requests door made
       and had corrected. Anchored on the section's own markup rather than on
       the word, which appears in half a dozen comments above it. */
    const i = HTML.indexOf('data-view="obligations"');
    const admin = HTML.indexOf('data-section-toggle="settings"');
    assert.ok(i > 0 && admin > 0 && i < admin, 'in the everyday group');
  });

  test('the view is registered everywhere a view has to be', () => {
    assert.match(APP, /view==='obligations'\) renderObligationsList\(\)/, 'it draws');
    assert.match(APP, /case 'obligations': return \[i18t\('nav_obligations'\)/, 'it is named');
    assert.match(CORE, /'intake','obligations','folder'/,
      'and a reader who was on it when they closed the tab comes back to it');
  });

  test('a row opens its contract ON THE OBLIGATIONS TAB', () => {
    const list = OB_CODE.match(/function renderObligationsList\(\)\{[\s\S]*?\n\}/)[0];
    assert.match(list, /roomGoTab\(c, 'oblig'\)/,
      'a row that opened the Document tab would make the reader hunt for what '
      + 'they pressed');
  });

  test('and the Home card lands on this list rather than on the calendar', () => {
    assert.match(HOME, /go:\{nav:'obligations'\}/);
  });
});

/* ================================================ 4 — THE CHASE */
describe('f255 (4) — chasing records the fact, whatever the mail does', () => {
  test('it is offered on a THEIRS obligation and nowhere else', () => {
    const list = OB_CODE.match(/function renderObligationsList\(\)\{[\s\S]*?\n\}/)[0];
    assert.match(list, /theirs && o\.st !== 'done'/,
      'on ours there is nobody to chase, and on a finished one nothing to '
      + 'chase about — a verb that cannot work is not drawn');
  });

  test('THE RECORD IS WRITTEN BEFORE THE MESSAGE AND WHATEVER IT DOES', () => {
    /* That the other side was chased, and when, is the half that pays off at
       renewal; a fact that depends on a provider being up is not a record. */
    const fn = OB_CODE.match(/async function obligationChase\(cid, obId\)\{[\s\S]*?\n\}/)[0];
    const write = fn.indexOf('persist(c)');
    const send = fn.indexOf("api(`contracts/");
    assert.ok(write > 0 && send > write, 'persisted first, sent second');
    assert.match(fn, /o\.chasedAt = isoDay\(new Date\(\)\)/);
    assert.match(fn, /o\.chasedBy = by/);
    assert.match(fn, /logAudit\(c, 'Obligation', `Chased/);
  });

  test('it asks first, because this is the one act here that leaves the building', () => {
    const fn = OB_CODE.match(/async function obligationChase\(cid, obId\)\{[\s\S]*?\n\}/)[0];
    assert.match(fn, /await confirmDialog\(/);
    assert.match(fn, /if\(!ok\) return null;/, 'and a refusal writes nothing');
  });

  test('it refuses one of ours, and refuses a viewer', () => {
    const fn = OB_CODE.match(/async function obligationChase\(cid, obId\)\{[\s\S]*?\n\}/)[0];
    assert.match(fn, /if\(!obligationIsTheirs\(o\)\)\{ toast\(i18t\('ob_chase_ours'\)/);
    assert.match(fn, /if\(typeof canEdit === 'function' && !canEdit\(\)\)/);
  });

  test('THREE HONEST ANSWERS, the shape every other mail here reports', () => {
    const fn = OB_CODE.match(/async function obligationChase\(cid, obId\)\{[\s\S]*?\n\}/)[0];
    assert.match(fn, /r\.emailSent/); assert.match(fn, /r\.outbox/); assert.match(fn, /r\.emailError/);
  });
});

/* ================================================ 5 — THE SERVER */
describe('f255 (5) — the address is the server’s to decide', () => {
  let h, W, mail;
  const put = (id, over) => W.admin.json('/api/contracts/' + id, { method: 'PUT', body: { contract: Object.assign({
    id, name: 'Chase — ' + id, counterparty: 'Nordkust Industri AB',
    counterpartyEmail: 'ops@nordkust.test', status: 'Signed', fields: {}, metadata: {},
    obligations: [
      { id: 'th', desc: 'Deliver the audited accounts', due: '2026-01-01', status: 'open', party: 'theirs' },
      { id: 'us', desc: 'Pay the invoice', due: '2026-01-01', status: 'open', party: 'ours' },
      { id: 'fin', desc: 'Already filed', due: '2026-01-01', status: 'done', party: 'theirs' }],
    audit: [], rounds: [], versions: [], signatures: [], comments: [] }, over || {}) } });
  const chase = body => W.admin.raw('/api/contracts/MK-CHASE/chase', { method: 'POST', body });
  const pause = ms => new Promise(r => setTimeout(r, ms));

  before(async () => { h = await startHatiWithMail(); W = await seedWorkspace(h); mail = h.mail; });
  after(async () => { await h.stop(); });

  test('a body-supplied address is REFUSED — the open-relay rule', async () => {
    await put('MK-CHASE');
    const r = await chase({ obligationId: 'th', email: 'somebody@elsewhere.test' });
    assert.equal(r.status, 400);
    assert.match(r.json.error, /resolves the counterparty’s address/);
  });

  test('it mails the address on the CONTRACT, and says so', async () => {
    mail.reset();
    const r = await chase({ obligationId: 'th' });
    assert.equal(r.status, 200);
    assert.equal(r.json.to, 'ops@nordkust.test');
    assert.equal(r.json.emailSent, true);
    await pause(200);
    const got = mail.sent.filter(m => (m.subject + ' ' + m.text).includes('Deliver the audited accounts'));
    assert.equal(got.length, 1);
    assert.equal(got[0].to, 'ops@nordkust.test');
  });

  test('it refuses one of OURS and one already done', async () => {
    const a = await chase({ obligationId: 'us' });
    assert.equal(a.status, 409);
    assert.equal(a.json.reason, 'ours');
    const b = await chase({ obligationId: 'fin' });
    assert.equal(b.status, 409);
    assert.equal(b.json.reason, 'done');
  });

  test('NOWHERE TO WRITE IS A FACT, NOT A FAILURE', async () => {
    /* The browser has already recorded the chase; this says plainly that no
       message went and where to put an address. */
    await W.admin.json('/api/contracts/MK-CHASE2', { method: 'PUT', body: { contract: {
      id: 'MK-CHASE2', name: 'No address', counterparty: 'Nordkust', status: 'Signed',
      fields: {}, metadata: {}, obligations: [
        { id: 'th', desc: 'Something they owe', due: '2026-01-01', status: 'open', party: 'theirs' }],
      audit: [], rounds: [], versions: [], signatures: [], comments: [] } } });
    const r = await W.admin.raw('/api/contracts/MK-CHASE2/chase', { method: 'POST', body: { obligationId: 'th' } });
    assert.equal(r.status, 200);
    assert.equal(r.json.reason, 'no-address');
    assert.equal(r.json.emailSent, false);
    assert.match(r.json.emailError, /no email address on file/);
  });

  test('a contract out of the caller’s scope is invisible here too', async () => {
    const r = await W.unrestricted.raw('/api/contracts/MK-NOPE/chase', { method: 'POST', body: { obligationId: 'x' } });
    assert.equal(r.status, 404);
  });
});

/* ================================================ 6 — AND THEY STILL DO NOT TRAVEL */
describe('f255 (6) — obligations never reach the counterparty', () => {
  test('the share payload never touches them', () => {
    const src = strip(read('js/negotiation.js')) + strip(read('js/core.js'));
    const fn = src.match(/function buildSharePayload\([\s\S]*?\n\}/);
    assert.ok(fn, 'the builder is there to read');
    assert.ok(!/obligations/.test(fn[0]));
  });
  test('and the chase route is the only new way one reaches them — as prose, not as data', () => {
    const r = SRV.match(/app\.post\('\/api\/contracts\/:id\/chase'[\s\S]*?\n\}\);/)[0];
    assert.ok(!/obligations:/.test(r), 'it sends a sentence, never the record');
    assert.match(r, /auth, editor/, 'and a viewer cannot press it');
  });
});

/* ================================================ 7 — BOTH LANGUAGES */
describe('f255 (7) — both languages', () => {
  const KEYS = ['nav_obligations', 'nav_obligations_title', 'ob_f_whose', 'ob_f_state',
    'ob_f_side', 'ob_f_folder', 'ob_f_due', 'ob_none_match', 'ob_open_contract',
    'ob_chase', 'ob_chase_title', 'ob_chase_body', 'ob_chase_go', 'ob_chase_ours',
    'ob_chase_sent', 'ob_chase_outbox', 'ob_chase_failed', 'ob_chased', 'ob_chased_on',
    'ob_gone'];
  test('every key is written twice and the two are not the same words', () => {
    for (const k of KEYS){
      const hits = [...I18N.matchAll(new RegExp('^    ' + k + ": '([^']*)'", 'gm'))].map(m => m[1]);
      assert.equal(hits.length, 2, `${k} is missing from one dictionary`);
      assert.notEqual(hits[0], hits[1], `${k} is untranslated`);
    }
  });
  test('and the mail that leaves the building is written twice too', () => {
    for (const k of ['mail_ob_chase_subject', 'mail_ob_chase_line'])
      assert.equal((I18N.match(new RegExp('^    ' + k + ':', 'gm')) || []).length, 2, k);
  });
});
