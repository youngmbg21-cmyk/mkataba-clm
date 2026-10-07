/* ============================================================
   F451 — Where the deal stands
   ============================================================
   Idea 15 of the seventeen, picked by Young on 3 October 2026 after four
   whole screens were drawn for him, and built on the 4th: *"Build all your
   recommendations."*

   ONE PAGE, AT ONE ADDRESS, THAT EVERY PARTY READS IDENTICALLY. Today a deal
   with three parties has three links and three pictures, and nobody is
   looking at the same thing.

   THE PAGE IS THE OVERLAP, NOT THE SUM, and that is the one rule everything
   else here follows. Every other feature in this product adds something to a
   screen one side owns. This is a single page with no owner, read by people
   who are negotiating against each other, so a fact goes on it only if it can
   be shown to EVERY party. If it cannot be shown to one of them it is not on
   the page at all — not hidden for that reader, not greyed, not there.
   Anything else would need the page to know who is reading, and the whole
   value is that it does not.

   WHAT THAT RULES OUT is not a list of good intentions; each item is a wall
   somewhere else in this product that one careless line here would walk
   through: the internal review the counterparty never learns happened; who on
   our side was asked to do what; any party's notes, walled into one named
   party's room on 3 October; money not put to every party; anything that
   reads as advice. AND PEOPLE — not even our own negotiator. A change's
   author travels to the counterparty today, but a third party that only signs
   has never been told who argues on our side, and this page is read by all of
   them at one address. So "Lately" says the SIDE and the act, never a name.

   AND NO SEAT WORD. "You" and "them" are the only words on a HaTi screen that
   mean different things to different readers, so the reading answers in PARTY
   NAMES — negWhoseMove's 'you'/'them' is turned into a name before anything
   is drawn. A page that says "your turn" to three parties at one address is
   lying to two of them.

   READING MUST NOT WRITE, and here it is load-bearing rather than tidy.
   negoChanges, negoProgress and negoRound all run negoInit, which CREATES a
   negotiation on a contract that has none — and this reading is asked for
   every contract with a status link, including signed paper that was imported
   and never negotiated. The server then freezes the wording it just invented.
   So everything reads c.changes and c.negotiation RAW.

   IT SPENDS NOTHING. No model writes a word of this page, which is what lets
   it be served to a stranger at a public address with no key, no budget and
   no wait. deal-stands-verify 6a counts every generative route while the tab
   is drawn and requires zero.

   THE DRAWING IS MEASURED IN A BROWSER (deal-stands-verify, 19 checks): the
   sheet, the party names, the lit step, the open point named by its clause,
   and every seeded secret looked for by name in what was painted. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const DS = read('js/dealstands.js');
const CONTRACT = read('js/views/contract.js');
const APP = read('js/app.js');
/* Comments carry the names of the very things this file forbids, so every
   sweep of the source runs over the CODE alone. */
const code = s => String(s).replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1 ');
const DSC = code(DS);

const iso = n => new Date(Date.now() + n * 864e5).toISOString();
function deal(extra){
  return { id: 'MK-D1', contractNo: 'MK-D1', name: 'Master Services Agreement',
    counterparty: 'Nordbygg AB', status: 'Under Review', value: 2400000,
    changes: [
      { id: 'CHG-1', status: 'accepted', authorSide: 'counterparty', clauseId: 'c4',
        clauseLabel: '4. Payment Terms', author: 'Tomas Backroom', resolvedBy: 'Tomas Backroom',
        createdAt: iso(-8), resolvedAt: iso(-7) },
      { id: 'CHG-2', status: 'pending', authorSide: 'owner', clauseId: 'c9',
        clauseLabel: '9. Liability Cap', author: 'Tomas Backroom', createdAt: iso(-3) },
    ],
    negotiation: { round: 2, rounds: [{ n: 1, at: iso(-4), changes: [] }] },
    signatures: [], obligations: [], thread: [], ...extra };
}
function world(){
  const w = buildWorld({ contractView: true, negotiationView: true });
  return w.win;
}

describe('f451 (1) — the reading answers the deal, not the seat', () => {
  test('whose move is a party NAME, never "you" or "them"', () => {
    const win = world();
    const D = win.dealStands(deal());
    assert.ok(D && D.move, 'one point is open, so somebody holds it');
    assert.equal(D.move.party, 'Nordbygg AB',
      'we asked, so they answer — and the answer is a name every reader can check');
    assert.ok(!/you|them/i.test(D.move.party));
  });

  test('with nothing open it says so, rather than guessing a side', () => {
    const win = world();
    const c = deal();
    c.changes[1].status = 'accepted';
    const D = win.dealStands(c);
    assert.equal(D.move, null, 'an absence is stated, never invented');
    assert.equal(D.agreed, true, 'every point answered and something was negotiated');
  });

  test('it counts the points the record holds, and parked asks only once', () => {
    const win = world();
    const c = deal();
    c.changes.push({ id: 'CHG-3', status: 'countered', authorSide: 'counterparty', clauseId: 'c9', createdAt: iso(-2) });
    c.changes.push({ id: 'CHG-4', status: 'superseded', authorSide: 'owner', clauseId: 'c9', createdAt: iso(-2) });
    const D = win.dealStands(c);
    assert.equal(D.total, 2, 'a parked ask is answered THROUGH its counter, and a superseded one is gone');
    assert.equal(D.open, 1);
    assert.equal(D.settled, 1);
  });

  test('the round and the journey are the record\'s own', () => {
    const win = world();
    const D = win.dealStands(deal());
    assert.equal(D.round, 2);
    assert.equal(D.steps.length, 4);
    assert.equal(D.steps.map(s => s.key).join(','), 'shared,negotiating,agreed,signed');
    assert.equal(D.steps.find(s => s.now).key, 'negotiating');
  });
});

describe('f451 (2) — the overlap, not the sum', () => {
  test('no person is named anywhere in what it returns', () => {
    const win = world();
    const c = deal({ review: { by: 'Priya Internal Reviewer', open: ['CHG-2'] },
      thread: [{ id: 'm1', who: 'Priya Internal Reviewer', visibility: 'internal', text: 'hold this' }] });
    const flat = JSON.stringify(win.dealStands(c));
    for (const who of ['Tomas Backroom', 'Priya Internal Reviewer'])
      assert.ok(!flat.includes(who), `${who} is on the record and must not be on this page`);
  });

  test('nothing from the review or the notes reaches it', () => {
    const win = world();
    const c = deal({ review: { by: 'Priya', open: ['CHG-2'] },
      thread: [{ id: 'm1', who: 'Priya', visibility: 'internal', text: 'Zanzibarium' }] });
    const flat = JSON.stringify(win.dealStands(c));
    assert.ok(!flat.includes('Zanzibarium'), 'a note is walled into one party\'s room; this page has no room');
    assert.ok(!/"review"/.test(flat), 'the counterparty never learns a review happened');
  });

  test('and the source never reaches for any of them', () => {
    for (const name of ['c.review', 'c.thread', 'reviewInboxFor', 'negoNoteRoom', 'deskSeatOf', 'c.value'])
      assert.ok(!DSC.includes(name), `${name} has no business in a page with no side`);
  });

  test('no change id travels either — CHG-4 means nothing outside the negotiation', () => {
    const win = world();
    const D = win.dealStands(deal());
    assert.ok(D.points.every(p => !/CHG-/.test(JSON.stringify(p))));
    assert.ok(D.lately.every(e => !/CHG-/.test(JSON.stringify(e))));
  });
});

describe('f451 (3) — reading must not write', () => {
  test('a contract that never negotiated is untouched by being read', () => {
    const win = world();
    const c = { id: 'MK-Q1', name: 'Imported paper', counterparty: 'Someone', status: 'Signed' };
    win.dealStands(c);
    assert.ok(!('negotiation' in c), 'negoInit would have put one here, and the server freezes it at signature');
    assert.ok(!('changes' in c));
  });

  test('and the source asks none of the readings that start one', () => {
    for (const name of ['negoChanges(', 'negoAllChanges(', 'negoProgress(', 'negoRound(', 'negoClauseList('])
      assert.ok(!DSC.includes(name), `${name} runs negoInit — it creates what it claims to count`);
  });
});

describe('f451 (4) — it spends nothing, and it is one reading', () => {
  test('no route, no model, no key', () => {
    for (const name of ['/api/ai', "api('ai", 'anthropic', 'fetch('])
      assert.ok(!DSC.includes(name), `${name} would make a public page wait on a budget`);
  });
  test('the two in-app surfaces call ONE builder', () => {
    assert.equal((DSC.match(/function standsHtml\(/g) || []).length, 1,
      'two surfaces may DRAW differently; the reading may never differ');
    assert.match(DSC, /function paintStandsPane\(/, 'and the tab paints it on arrival');
  });
});

describe('f451 (5) — the tab, and what it did not disturb', () => {
  /* RE-POINTED 7 Oct 2026: Overview 2 (owner-instructed, work order O-36)
     sits right after the Overview, so Where we are is third. */
  test('Where we are is in ROOM_TABS, right after the two Overviews', () => {
    const win = world();
    const keys = win.ROOM_TABS.map(t => t[0]);
    assert.equal(keys[0], 'terms', 'the Overview still leads, and roomOpenOnTerms with it');
    assert.equal(keys[1], 'ov2');
    assert.equal(keys[2], 'stands');
  });

  test('its pane is a SLOT, painted on arrival rather than built with the room', () => {
    assert.match(CONTRACT, /data-ws-pane="stands"/);
    assert.match(CONTRACT, /id="ws-stands-pane"/);
    assert.match(CONTRACT, /if\(_wsTab==='stands'\) try\{ paintStandsPane\(c\); \}/,
      'what it says moves with every change filed or answered');
  });

  test('the module is loaded by the app and by the harnesses', () => {
    assert.match(APP, /import '\.\/dealstands\.js';/);
    assert.match(read('test/world.js'), /js\/dealstands\.js/,
      'the browser harnesses do not load index.html — a new js/ file must be added there too');
    assert.match(read('test/portalworld.js'), /js\/dealstands\.js/);
  });
});

describe('f451 (6) — both books', () => {
  const I18N = read('js/i18n.js');
  for (const k of ['ds_eyebrow', 'ds_whose', 'ds_still_open', 'ds_never_shows', 'tab_where_we_are',
    'ds_ev_asked', 'ds_move_nobody', 'ds_role_negotiates'])
    test(`${k} is in both books`, () => {
      assert.equal((I18N.match(new RegExp('\\b' + k + ':', 'g')) || []).length, 2);
    });
  test('and not one of them carries a seat word', () => {
    const en = I18N.slice(I18N.indexOf("ds_eyebrow: '"), I18N.indexOf('tab_where_we_are:'));
    assert.ok(!/\b(your|yours|their|theirs)\b/i.test(en),
      'a page read by every party at one address cannot say "your turn"');
  });
});

/* ============================================================
   PART TWO — the public address, and the walls around it
   ============================================================
   A status link is the one purpose whose address does not open HaTi at all:
   the server builds the page from the stored record on every open. So three
   things have to be true at once, and each of them is a place a leak would
   otherwise be invisible until a counterparty found it:
     · the row behind the address holds no copy of the contract — only its id,
       because the server has to know which contract the address is for;
     · the route that serves every OTHER kind of link refuses this token
       outright, rather than handing over the working payload;
     · and the page itself is a standalone document, so every value in it is a
       literal: a document served outside the application carries no :root. */
describe('f451 (7) — the status link is not a copy of the contract', () => {
  const SRV = read('server/server.js');
  const CORE = read('js/core.js');
  const srvCode = code(SRV);

  test('status is a purpose both halves know', () => {
    assert.match(srvCode, /const SHARE_PURPOSES = \[[^\]]*'status'\]/);
    assert.match(code(CORE), /SHARE_PURPOSE = p => \(\[[^\]]*'status'\]/);
  });

  test('the browser builds the id and nothing more', () => {
    const cc = code(CORE);
    const from = cc.indexOf("purpose)==='status'");
    const early = cc.slice(from, cc.indexOf('\n', cc.indexOf('contract:{ id:c.id }', from)));
    assert.ok(from > 0, 'buildSharePayload stops early for a status link');
    assert.match(early, /contract:\{ id:c\.id \}/,
      'the id, so the server knows which contract the address is for');
    for (const field of ['body', 'changes', 'thread', 'upload', 'fields'])
      assert.ok(!early.includes(field + ':'), `${field} must not travel with a status link`);
  });

  test('and the server reduces a hand-built one to the same shape', () => {
    assert.match(srvCode, /purp === 'status' && payload\.contract\) payload\.contract = \{ id: shareId \}/,
      'the wall belongs to the route every path goes through, not to the browser');
  });

  test('the payload route refuses the token rather than serving it', () => {
    assert.match(srvCode, /if \(shareIsStatus\(s\)\) return res\.status\(403\)/,
      'without this it hands over the counterparty\'s whole working copy');
  });

  test('the page is served at its own address, and only for a status token', () => {
    assert.match(srvCode, /app\.get\('\/deal\/:token'/);
    /* The route's own body: it is served AFTER the Requests tracker, whose own
       check evaluates the slice between its stage map and its route — so
       nothing of this may sit between those two (f390 3b found that the hard
       way). The end is this route's own closing brace. */
    const from = srvCode.indexOf("app.get('/deal/:token'");
    const route = srvCode.slice(from, srvCode.indexOf('\n});', from));
    assert.match(route, /!shareIsStatus\(s\)\) return res\.status\(404\)/,
      'a negotiation token at this address is not a status page');
    assert.match(route, /s\.revoked_at\) return gone/, 'switched off is switched off, straight away');
    assert.match(route, /shareExpired\(s\)\) return gone/);
  });

  test('the standalone page carries no var() and no :root', () => {
    const page = SRV.slice(SRV.indexOf('function dealPageHtml'), SRV.indexOf("app.get('/deal/:token'"));
    assert.ok(!/var\(--/.test(page), 'a document served outside the application has no stylesheet to read');
    assert.ok(!/:root/.test(page));
  });

  test('and it takes no input — nothing to press, nothing to abuse', () => {
    const page = SRV.slice(SRV.indexOf('function dealPageHtml'), SRV.indexOf("app.get('/deal/:token'"));
    for (const tag of ['<form', '<input', '<button', '<script'])
      assert.ok(!page.includes(tag), `${tag} on a page anybody holding the address can open`);
  });

  test('the server\'s reading keeps every rule the browser\'s keeps', () => {
    /* THE WHOLE BLOCK, not the one function: the raw reads it is built out of
       (srvDsLive and its siblings) sit above it and are as much part of the
       reading as the function that calls them. */
    const s = srvCode.slice(srvCode.indexOf("const DEAL_STEPS = ['shared'"), srvCode.indexOf('function signerRouteFor'));
    /* ch.authorSide is the SIDE and is allowed; ch.author is the PERSON and is
       not, and one is a prefix of the other — so this asks on a word boundary
       rather than on a substring, which is how the first run of this check
       failed on its own reading. */
    for (const name of [/\bc\.review\b/, /\bc\.thread\b/, /\bresolvedBy\b/, /\bch\.author\b(?!Side)/])
      assert.ok(!name.test(s), `${name} has no business in a page with no side`);
    assert.match(s, /DEAL_STEPS\.map/, 'the same four steps');
    assert.match(s, /status !== 'superseded' && x\.status !== 'countered'/, 'the same live set');
  });
});
