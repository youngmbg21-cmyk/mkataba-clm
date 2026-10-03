/* ============================================================
   f446 — A ROOM FOR EVERY PARTY, AND THE DRAWER IS 460 (Young, 3 Oct 2026)
   ============================================================
   "Build option 1 at 460" — from the design round of the same day. Option 1
   was three things, and only one of them is about width:

     · the notes drawer widens to 460, which is NOT a new number: it is
       RL_RIGHT_W0, the width the redlines column rests at, so on the negotiate
       page the drawer lands on that column and takes nothing from the paper;
     · the two rooms (Internal / External) become one room per PARTY;
     · the note's acts row stops being seven controls on one line.

   THE SECOND IS WHY THIS WAS BUILT. Measured on the owner's own MK-411, which
   reads `Jumenza LLC +1`: a note carried no party anywhere, so "external" was
   ONE room shared by every outside party holding a link. Right on a two-party
   contract and always had been; a confidentiality fault from the moment a
   contract held a second outside party, which multi-party shipped in late
   September. (9) drives that on the real server.

   THE CLAIMS:
     1  the width is its own token on the notes face alone, two rungs, and the
        other two faces are untouched
     2  the face is written in ONE place, which both doors already call
     3  negoNoteParty: a note with no party is the FIRST outside party — the
        server's own rule, so there is nothing to migrate
     4  the room list is one reading; their seat gets exactly one room
     5  ONE builder for the room chips, where there were three copies
     6  the acts row is verbs, then facts, split by KIND
     7  the writer validates the party against the record
     8  the tag roster is narrowed to the room's own party — it is a WALL
     9  DRIVEN: two outside parties, two links, and neither reads the other's
    10  every word is in both books

   Run: node --test test/f446-a-room-for-every-party.test.js
   ============================================================ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');
const { startHati, seedWorkspace } = require('./helpers');

const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const NEGO = read('js/negotiation.js');
const VIEW = read('js/views/negotiation.js');
const APP = read('js/app.js');
const INDEX = read('index.html');
const I18N = read('js/i18n.js');
const SERVER = read('server/server.js');

const ME = { id: 'u_me', name: 'Amina Yusuf', role: 'legal', email: 'amina@mk.co.ke' };
const TWO = [
  { id: 'py_us', name: 'Highland Corporate Ltd', side: 'ours' },
  { id: 'py_a', name: 'Jumenza LLC', side: 'theirs', involvement: 'negotiate' },
  { id: 'py_b', name: 'Kvarnby Holding AB', side: 'theirs', involvement: 'negotiate' }
];
const contract = parties => ({ id: 'MK-446', name: 'Warehousing Logistics Agreement',
  counterparty: 'Jumenza LLC', party: 'Highland Corporate Ltd',
  status: 'Under Review', folder: 'dist', fields: {}, metadata: {}, audit: [], rounds: [],
  versions: [], signatures: [], comments: [], value: 800000,
  ...(parties ? { parties } : {}) });

function bench(parties){
  const w = buildWorld({ user: ME, negotiationView: true, canEdit: true });
  w.win.getUsers = () => [ME];
  w.win.persist = () => {};
  return { w, win: w.win, c: contract(parties) };
}

/* ============================================================
   1 — THE WIDTH IS THE NOTES FACE'S OWN
   ============================================================ */
describe('f446 (1) — 460 is the redline column’s own width, on this face alone', () => {
  test('the number is not invented here: it is RL_RIGHT_W0', () => {
    assert.match(VIEW, /const RL_RIGHT_W0 = 460;/,
      'the column rests at 460 — if this moves, the drawer’s rung is a lie');
    assert.match(INDEX, /--shell-panel-notes-w:460px/,
      'and the drawer tops out at the same number');
  });
  test('its own token, so Activity and Alerts do not move', () => {
    assert.match(INDEX, /--shell-panel-notes-w:330px/, 'the narrow rung is the one that shipped');
    /* THE WALL: the shared token keeps its three rungs exactly. A later hand
       widening --shell-panel-w instead would widen all three faces. */
    assert.match(INDEX, /--shell-panel-w:365px/);
    assert.match(INDEX, /min-width:1800px\)\{ :root\{ --shell-panel-w:400px/);
    assert.match(INDEX, /max-width:1439px\)\{ :root\{ --shell-panel-w:330px/);
  });
  test('two rungs, and the line is a named breakpoint of this product’s', () => {
    assert.match(INDEX, /min-width:1024px\)\{ :root\{ --shell-panel-notes-w:460px/,
      'BP.laptop, the rung clauseEditorFits already asks — not a number invented here');
    assert.match(APP, /laptop: 1024/, 'and that rung really is 1024');
  });
  test('the rule is scoped to the face and beats the base by WEIGHT, never !important', () => {
    const r = /#context-panel\[data-face="notes"\]\{ width:min\(var\(--shell-panel-notes-w,330px\),88vw\); \}/;
    assert.match(INDEX, r, 'id + attribute is (1,1,0) against the base rule’s (1,0,0)');
    const slice = INDEX.slice(INDEX.indexOf('#context-panel[data-face="notes"]'));
    assert.doesNotMatch(slice.slice(0, 200), /!important/, 'fixed by scope, as the rulebook says');
    assert.match(INDEX, /width:min\(var\(--shell-panel-w,365px\),88vw\)/,
      'and the base rule still carries the 88vw cap underneath');
  });
});

/* ============================================================
   2 — THE FACE IS WRITTEN ONCE
   ============================================================ */
describe('f446 (2) — one place writes the face, and both doors already call it', () => {
  test('applyPanelLayout writes it', () => {
    const i = APP.indexOf('function applyPanelLayout');
    const fn = APP.slice(i, APP.indexOf('\nfunction ', i + 10));
    assert.match(fn, /panel\.dataset\.face = panelFace\(\);/);
  });
  test('and it is the only writer, so a third door inherits it', () => {
    assert.equal((APP.match(/dataset\.face\s*=/g) || []).length, 1, 'exactly one');
    for (const door of ['function openPanel', 'function openNotesPanel']){
      const i = APP.indexOf(door);
      const fn = APP.slice(i, APP.indexOf('\nfunction ', i + 10));
      assert.match(fn, /applyPanelLayout\(\)/, door + ' calls it');
    }
  });
});

/* ============================================================
   3 — NO PARTY MEANS THE FIRST OUTSIDE PARTY
   ============================================================ */
describe('f446 (3) — the migration is a rule, not a backfill', () => {
  test('a shared note with no party reads as the first outside party', () => {
    const p = bench(TWO);
    const m = { visibility: 'shared', text: 'x' };
    const got = p.win.negoNoteParty(p.c, m);
    assert.equal(got && got.id, 'py_a', 'which is what every note on file is');
    assert.equal(p.win.negoNoteRoomKey(p.c, m), 'p:py_a');
  });
  test('a named party wins, and an unknown one falls back rather than landing elsewhere', () => {
    const p = bench(TWO);
    assert.equal(p.win.negoNoteParty(p.c, { visibility: 'shared', partyId: 'py_b' }).id, 'py_b');
    assert.equal(p.win.negoNoteParty(p.c, { visibility: 'shared', partyId: 'py_gone' }).id, 'py_a',
      'a party this contract no longer holds is never quietly re-homed to somebody else');
  });
  test('an internal note has no party at all — there is no outside party in the question', () => {
    const p = bench(TWO);
    assert.equal(p.win.negoNoteParty(p.c, { text: 'x' }), null);
    assert.equal(p.win.negoNoteRoomKey(p.c, { text: 'x' }), 'internal');
  });
  test('and the server says the same thing, in its own words', () => {
    assert.match(SERVER, /NULL party_id reads as the first\n\s*outside party/,
      'srvPartyOfShare’s rule is the one the browser mirrors');
    assert.match(SERVER, /addColumnIfMissing\('share_messages', 'party_id', 'TEXT'\)/);
  });
});

/* ============================================================
   4 — THE ROOM LIST
   ============================================================ */
describe('f446 (4) — one reading of which rooms a seat may see', () => {
  test('our seat: ours first, then one per outside party, in the record’s order', () => {
    const p = bench(TWO);
    const rooms = p.win.negoNoteRoomList(p.c, {}, 'owner');
    /* Joined rather than deep-compared: the array is built inside the
       harness's own realm, so a deep compare fails on the prototype rather
       than on the facts. The f443 lesson, in its array costume. */
    assert.equal(rooms.map(r => r.key).join(','), 'internal,p:py_a,p:py_b');
    assert.equal(rooms.map(r => r.external).join(','), 'false,true,true');
    assert.equal(rooms[1].name, 'Jumenza LLC', 'named after a real party, never "External"');
  });
  test('their seat gets exactly ONE room, which is why their page draws no tabs', () => {
    const p = bench(TWO);
    assert.equal(p.win.negoNoteRoomList(p.c, {}, 'counterparty').length, 1);
  });
  test('a contract with no parties on the record still answers, so nothing regresses', () => {
    const p = bench(null);
    const rooms = p.win.negoNoteRoomList(p.c, {}, 'owner');
    assert.ok(rooms.length >= 2, 'ours and one outside room');
    assert.equal(rooms[0].key, 'internal');
  });
  test('the counts carry a per-room tally, and the old three answers are untouched', () => {
    const p = bench(TWO);
    const ch = { id: 'CHG-001', thread: [
      { id: 'n1', text: 'ours' },
      { id: 'n2', text: 'to A', visibility: 'shared', partyId: 'py_a' },
      { id: 'n3', text: 'to B', visibility: 'shared', partyId: 'py_b' }] };
    const n = p.win.negoNoteCounts(p.c, ch, {}, 'owner');
    assert.equal(n.internal, 1);
    assert.equal(n.external, 2, 'the old answer still means every outside note');
    assert.equal(n.total, 3);
    assert.equal(n.byRoom['p:py_a'], 1);
    assert.equal(n.byRoom['p:py_b'], 1);
    assert.equal(n.byRoom.internal, 1);
  });
  test('an empty room has a zero, never an absent key', () => {
    const p = bench(TWO);
    const n = p.win.negoNoteCounts(p.c, { id: 'C', thread: [] }, {}, 'owner');
    assert.equal(n.byRoom['p:py_b'], 0, 'a chip never has to tell an absence from a zero');
  });
  test('and asking for one room returns only that party’s notes', () => {
    const p = bench(TWO);
    const ch = { id: 'C', thread: [
      { id: 'n2', text: 'to A', visibility: 'shared', partyId: 'py_a' },
      { id: 'n3', text: 'to B', visibility: 'shared', partyId: 'py_b' }] };
    assert.equal(p.win.negoRoomNotes(p.c, ch, 'p:py_a', {}, 'owner').map(m => m.id).join(','), 'n2');
    assert.equal(p.win.negoRoomNotes(p.c, ch, 'external', {}, 'owner').length, 2,
      "'external' still means every outside room, for the readers outside this panel that ask it that way");
  });
});

/* ============================================================
   5 — ONE BUILDER FOR THE CHIPS
   ============================================================ */
describe('f446 (5) — the clothes follow the builder', () => {
  test('the room row is built in exactly one place', () => {
    assert.equal((VIEW.match(/class="rl-np-tabs" role="tablist"/g) || []).length, 1,
      'it was written out three times — the panel, the chat face and the embed');
    assert.equal((VIEW.match(/NOTE_ROOMS\.map/g) || []).length, 0,
      'and none of the three keeps its own copy');
  });
  test('all three surfaces call it', () => {
    assert.equal((VIEW.match(/(?<!function )rlNpRoomsHtml\(c, room/g) || []).length, 3,
      'the panel, the embed and the chat face — the definition is not a caller');
  });
  test('the chip carries the room key and its count', () => {
    const p = bench(TWO);
    const html = p.win.rlNpRoomsHtml(p.c, 'p:py_a', { byRoom: { internal: 2, 'p:py_a': 1, 'p:py_b': 0 } }, {}, 'owner');
    assert.match(html, /data-rl-np-room="internal"/);
    assert.match(html, /data-rl-np-room="p:py_a"[^>]*aria-selected="true"/s, 'the live room is lit');
    assert.match(html, /Jumenza LLC <i>\(1\)<\/i>/, 'named, with its count');
    assert.match(html, /Kvarnby Holding AB <i>\(0\)<\/i>/, 'and an empty room says zero');
  });
  test('and a seat with one room draws no row at all', () => {
    const p = bench(TWO);
    assert.equal(p.win.rlNpRoomsHtml(p.c, 'p:py_a', {}, {}, 'counterparty'), '',
      'their page has one room, so a chip row would be a control that does nothing');
  });
});

/* ============================================================
   6 — THE ACTS ROW
   ============================================================ */
describe('f446 (6) — verbs on one line, facts on another', () => {
  const i = VIEW.indexOf('function rlNpNoteHtml');
  const fn = VIEW.slice(i, VIEW.indexOf('\nfunction ', i + 10));
  test('the split is by KIND, so it holds however many are drawn', () => {
    assert.match(fn, /const factBits = \[/, 'the facts are collected, not counted');
    assert.match(fn, /class="rl-np-facts"/);
  });
  test('nothing was removed and nothing went to a hover', () => {
    for (const bit of ['rl-np-seenby', 'rl-np-given', 'rl-np-doneby'])
      assert.ok(fn.includes(bit), bit + ' is still drawn on the face');
    for (const verb of ['data-rl-np-reply', 'data-rl-np-done', 'data-rl-np-seen',
      'data-rl-np-give', 'data-rl-np-delete'])
      assert.ok(fn.includes(verb), verb + ' is still a verb');
  });
  test('the given chip stays a door, and the separator is never inside it', () => {
    assert.match(fn, /class="rl-np-given" data-rl-np-give=/, 'press it to change who has it');
    assert.match(fn, /class="rl-np-fsep"/, 'its own element');
    assert.doesNotMatch(INDEX, /\.rl-np-facts > \* \+ \*::before/,
      'a pseudo inside the bits would put the dot inside the button');
  });
  test('the facts line wraps rather than clipping', () => {
    assert.match(INDEX, /\.rl-np-facts\{[^}]*flex-wrap:wrap/);
  });
});

/* ============================================================
   7 — THE WRITER CHECKS THE RECORD
   ============================================================ */
describe('f446 (7) — a party is validated, never taken on the caller’s word', () => {
  test('an id this contract does not hold is dropped', () => {
    const p = bench(TWO);
    const ch = { id: 'C', thread: [] };
    p.c.changes = [ch];
    const m = p.win.negoPostComment(p.c, 'C', 'hello', { visibility: 'shared', partyId: 'py_nope' });
    assert.ok(m, 'the note is still filed');
    assert.equal(m.partyId, undefined, 'with no party, which reads as the first — never somebody else’s room');
  });
  test('a real one is stored', () => {
    const p = bench(TWO);
    p.c.changes = [{ id: 'C', thread: [] }];
    const m = p.win.negoPostComment(p.c, 'C', 'hello', { visibility: 'shared', partyId: 'py_b' });
    assert.equal(m.partyId, 'py_b');
  });
  test('an internal note is never given one', () => {
    const p = bench(TWO);
    p.c.changes = [{ id: 'C', thread: [] }];
    const m = p.win.negoPostComment(p.c, 'C', 'hello', { partyId: 'py_b' });
    assert.equal(m.partyId, undefined, 'there is no outside party in the question');
  });
});

/* ============================================================
   7b — THE PAYLOAD IS THE SECOND LEAK PATH, AND IT IS WALLED TOO
   ============================================================
   The channel is one way a note reaches the other side; the SHARE PAYLOAD is
   the other, and it carried `thread` filtered on `visibility === 'shared'`
   alone. It is built in the browser, per send, for a named recipient, so the
   wall has to be here as well as on the server.
   DRIVEN against the real builder, which is how the first draft's bug was
   found: it resolved the NOTE's absent party to the asking link rather than to
   the first outside party, so a party-less note reached every party's copy. */
describe('f446 (7b) — a copy built for one party carries only that party\u2019s notes', () => {
  const { loadViews, STUB_TEMPLATES, STUB_FOLDERS } = require('./dom');
  const THEM = [{ id: 'py_a', name: 'Jumenza LLC' }, { id: 'py_b', name: 'Kvarnby Holding AB' }];
  const WHO = { org: 'Highland Corporate Ltd', sharedBy: 'Young Mbagaya' };
  /* core.js is the whole application core and the payload builder reads a small
     part of it, so the two readings it needs here are stubbed — the harness's
     own documented pattern (see f12). */
  const core = () => loadViews(['js/richdoc.js', 'js/core.js'], {
    TEMPLATES: STUB_TEMPLATES, FOLDERS: STUB_FOLDERS,
    partiesTheirs: () => THEM, negoAllChanges: c => c.changes || [] });
  const paper = () => ({ id: 'MK-446P', name: 'Warehousing', counterparty: 'Jumenza LLC',
    template: 'MK', value: 800000, valueType: 'standard', fields: { value: '800000' },
    folder: 'proc', redlineText: 'W', format: 'text', textFingerprint: 'fp', simhash: 'sh',
    audit: [], comments: [],
    changes: [{ id: 'CHG-001', clauseId: 'c1', status: 'pending', thread: [
      { id: 'n1', who: 'u', visibility: 'shared', partyId: 'py_a', text: 'For Jumenza only.' },
      { id: 'n2', who: 'u', visibility: 'shared', partyId: 'py_b', text: 'For Kvarnby only.' },
      { id: 'n3', who: 'u', visibility: 'shared', text: 'No party named.' },
      { id: 'n4', who: 'u', visibility: 'internal', text: 'Ours alone.' }] }] });
  const copyFor = want => JSON.stringify(
    core().buildSharePayload(paper(), 'hash', WHO, want ? { partyId: want } : undefined));

  test('each party gets its own room and never the other\u2019s', () => {
    const a = copyFor('py_a'), b = copyFor('py_b');
    assert.match(a, /For Jumenza only/, 'A reads its own');
    assert.doesNotMatch(a, /For Kvarnby only/, 'AND NOT THE OTHER PARTY\u2019S');
    assert.match(b, /For Kvarnby only/, 'B reads its own');
    assert.doesNotMatch(b, /For Jumenza only/, 'AND NOT THE OTHER PARTY\u2019S');
  });
  test('a note with no party is the FIRST party\u2019s, not everybody\u2019s', () => {
    assert.match(copyFor('py_a'), /No party named/, 'every note on file is the first party\u2019s');
    assert.doesNotMatch(copyFor('py_b'), /No party named/,
      'written the other way round first, and it reached every copy');
  });
  test('and the internal room still travels nowhere at all', () => {
    for (const w of ['py_a', 'py_b', null])
      assert.doesNotMatch(copyFor(w), /Ours alone/, 'the older wall is untouched');
  });
  test('a stage without the parties reading carries exactly what it carried before', () => {
    const s = loadViews(['js/richdoc.js', 'js/core.js'], {
      TEMPLATES: STUB_TEMPLATES, FOLDERS: STUB_FOLDERS, negoAllChanges: c => c.changes || [] });
    const j = JSON.stringify(s.buildSharePayload(paper(), 'hash', WHO, { partyId: 'py_b' }));
    assert.match(j, /For Jumenza only/,
      'an absent module must not start hiding notes that have always travelled');
  });
});

/* ============================================================
   8 — THE TAG ROSTER IS A WALL
   ============================================================ */
describe('f446 (8) — one party’s room offers only that party’s people', () => {
  test('the roster narrows by party', () => {
    const p = bench(TWO);
    p.c.signerPlan = [
      { id: 's1', party: 'counterparty', partyId: 'py_a', name: 'Lena Svensson', email: 'l@a.se' },
      { id: 's2', party: 'counterparty', partyId: 'py_b', name: 'Mats Oberg', email: 'm@b.se' }];
    const inA = p.win.negoTagPeople(p.c, 'external', { partyId: 'py_a' }).map(x => x.name);
    assert.ok(inA.includes('Lena Svensson'), 'their own are offered');
    assert.ok(!inA.includes('Mats Oberg'),
      'and a DIFFERENT company’s people are not — this list is what negoPostComment resolves mentions against');
  });
  test('an older caller naming no party gets exactly what it got before', () => {
    const p = bench(TWO);
    p.c.signerPlan = [
      { id: 's1', party: 'counterparty', partyId: 'py_a', name: 'Lena Svensson', email: 'l@a.se' },
      { id: 's2', party: 'counterparty', partyId: 'py_b', name: 'Mats Oberg', email: 'm@b.se' }];
    const all = p.win.negoTagPeople(p.c, 'external', {}).map(x => x.name);
    assert.ok(all.includes('Lena Svensson') && all.includes('Mats Oberg'));
  });
  test('"is this an outside room" is never a literal — the fault this build shipped once', () => {
    /* negoTagPeople read `room === 'external'`, which went FALSE for every real
       outside room the moment a room was keyed by its party — so the roster
       that negoPostComment resolves mentions against served OUR COLLEAGUES
       into the counterparty's picker. f246 (11) caught it on their own seat.
       Pinned here as a REGRESSION: the question is asked of internal. */
    const fn = NEGO.slice(NEGO.indexOf('function negoTagPeople'),
      NEGO.indexOf('function negoMentionsIn'))
      /* STRIP THE COMMENTS FIRST — the note beside the fix quotes the very
         pattern it forbids, and a sweep over raw source reads that as the
         fault coming back. The rulebook's own lesson, paid again here. */
      .replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    assert.doesNotMatch(fn, /room === 'external'/,
      'a party-keyed room is still an outside room');
    const p = bench(TWO);
    const names = p.win.negoTagPeople(p.c, 'p:py_a', {}).map(x => x.name);
    assert.ok(!names.includes(ME.name), 'no colleague is offered in a party room');
  });
  test('and the absent-partyId rule is the signer row’s own, not a second one', () => {
    const p = bench(TWO);
    p.c.signerPlan = [{ id: 's1', party: 'counterparty', name: 'Lena Svensson', email: 'l@a.se' }];
    assert.ok(p.win.negoTagPeople(p.c, 'external', { partyId: 'py_a' }).some(x => x.name === 'Lena Svensson'),
      'a row with no party belongs to the first outside party');
    assert.ok(!p.win.negoTagPeople(p.c, 'external', { partyId: 'py_b' }).some(x => x.name === 'Lena Svensson'));
  });
});

/* ============================================================
   9 — DRIVEN: TWO PARTIES, TWO LINKS, AND NEITHER READS THE OTHER'S
   ============================================================
   The claims above read the source and the model. THIS ONE RUNS THE REAL
   SERVER, because that is where the hole was: GET /api/shares/:token served
   the whole message table to every link holder, and a sweep over the source
   would have been satisfied by a filter nothing reached. */
describe('f446 (9) driven — a note for one party never reaches the other', () => {
  test('two outside parties, two links, and the wall holds both ways', async (t) => {
    const h = await startHati();
    t.after(() => h.stop());
    const W = await seedWorkspace(h, { approvalRules: [] });
    const cid = 'MK-A2';

    /* A contract with TWO outside parties on the record. Read back and written
       whole, through the ordinary save door, so the record under this is the
       record the product makes. */
    const cur = await W.admin.json('/api/contracts/' + cid);
    await W.admin.json('/api/contracts/' + cid, { method: 'PUT', body: {
      contract: { ...cur, party: 'Highland Corporate Ltd', counterparty: 'Jumenza LLC',
        parties: TWO },
      baseVersion: cur._v } });

    const mk = async partyId => {
      const r = await W.admin.json('/api/shares', { method: 'POST', body: {
        payload: { kind: 'hati-share', purpose: 'negotiate',
          contract: { id: cid, name: 'Warehousing Logistics Agreement' } },
        channel: 'link', recipient: { name: partyId, email: partyId + '@example.com' },
        purpose: 'negotiate', durable: true, partyId } });
      assert.ok(r && r.token, partyId + ' link minted');
      return r.token;
    };
    const linkA = await mk('py_a');
    const linkB = await mk('py_b');

    /* A colleague writes one note into EACH room. */
    const post = async (partyId, body) => {
      const r = await W.admin.json('/api/contracts/' + cid + '/messages', { method: 'POST',
        body: { topic: 'general', body, partyId } });
      assert.ok(r && r.ok, 'posted');
    };
    await post('py_a', 'Jumenza only: we can move to 45 days if they drop the rebate.');
    await post('py_b', 'Kvarnby only: they are signing, not negotiating.');

    const readBack = async tok => {
      const r = await fetch(h.base + '/api/shares/' + tok);
      assert.equal(r.status, 200);
      return ((await r.json()).messages || []).map(m => m.body);
    };
    const a = await readBack(linkA), b = await readBack(linkB);
    assert.ok(a.some(x => /Jumenza only/.test(x)), 'A reads its own room');
    assert.ok(!a.some(x => /Kvarnby only/.test(x)), 'AND NOT THE OTHER PARTY’S');
    assert.ok(b.some(x => /Kvarnby only/.test(x)), 'B reads its own room');
    assert.ok(!b.some(x => /Jumenza only/.test(x)), 'AND NOT THE OTHER PARTY’S');

    /* A link cannot name a room it is not in: the party on a row is the
       LINK'S, exactly as an address is looked up rather than read off a body. */
    const said = await fetch(h.base + '/api/shares/' + linkB + '/messages', { method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ author: 'Mats', topic: 'general',
        body: 'From B, claiming to be A.', partyId: 'py_a' }) });
    assert.equal(said.status, 200, 'their note is filed');
    assert.ok(!(await readBack(linkA)).some(x => /claiming to be A/.test(x)),
      'but it lands in B’s room, whatever the body asked for');

    /* AND A SIGNED-IN COLLEAGUE READS EVERY ROOM — they are both sides of it. */
    const mine = await W.admin.json('/api/contracts/' + cid + '/messages');
    const all = (mine.messages || []).map(m => m.body);
    assert.ok(all.some(x => /Jumenza only/.test(x)) && all.some(x => /Kvarnby only/.test(x)),
      'no room is hidden from the workspace that owns the contract');
  });
});

/* ============================================================
   10 — BOTH BOOKS
   ============================================================ */
describe('f446 (10) — every word is in both books', () => {
  for (const k of ['ng_np_room_us', 'ng_np_room_t_int', 'ng_np_room_t_ext'])
    test(k + ' is in both', () => {
      assert.equal((I18N.match(new RegExp('^\\s*' + k + ':', 'gm')) || []).length, 2);
    });
  test('and the old generic label stays LIVE, as the fallback for an unnamed party', () => {
    assert.match(VIEW, /r\.name \|\| i18t\('ng_np_tab_ext'\)/,
      'a contract whose outside party has no name on the record still draws a room');
  });
});
