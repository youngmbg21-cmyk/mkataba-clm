/* ============================================================
   f166 — the desk's roster, stage 2: who else works this, and how they ask
   ============================================================
   Stage 1 recorded a name. This stage builds the list around it and the one
   conversation the list needs — somebody who is not on the desk asking to be.
   It still enforces nothing; stage 3 does that, behind a setting, and it takes
   the verbs and the model's refusal together. Removing verbs while the model
   still accepts the write would be a sign with no lock, which this codebase
   already warns about in its own words.

   WHAT IS UNDER TEST:

   1. THE ROSTER. Lead, contributors, and the three seats they produce. Who may
      change it: the lead and an admin, and emphatically not a contributor —
      being let in is not being able to let others in.

   2. REMOVAL DOES NOT DELETE WORK. The single most damaging thing this feature
      could do is lose four clauses of redlining because somebody came off a
      deal on a Friday. The drafts belong to the desk.

   3. THE FIVE REFUSALS, each with its own sentence. A viewer, the lead, someone
      already on the desk, somebody who cannot reach the stream, and nobody at
      all are five different mistakes.

   4. ASKING TO JOIN, and that it lands with the lead rather than in a void.

   5. THE WALL, again and always: none of this reaches the counterparty.
   ============================================================ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { buildWorld } = require('./world');

const BODY =
  '<h1>Cane Supply Agreement</h1><p>Between Wanjiru Catering Ltd and Nordfrakt Logistik AB</p>'
  + '<h2>Clause 2 · Delivery</h2><p>Weekly consignments to the mill gate.</p>'
  + '<h2>Clause 4 · Payment Terms</h2><p>Undisputed invoices are payable within thirty (30) days.</p>'
  + '<h2>Clause 6 · Liability</h2><p>Liability is capped at the fees paid in the preceding twelve months.</p>';

const ME    = { id: 'u_wanjiru', name: 'Wanjiru Kamau',  role: 'legal',  email: 'wanjiru@wanjiru.co.ke' };
const GRACE = { id: 'u_grace',   name: 'Grace Mwangi',   role: 'legal',  email: 'grace@wanjiru.co.ke' };
const DAN   = { id: 'u_dan',     name: 'Daniel Kiptoo',  role: 'legal',  email: 'daniel@wanjiru.co.ke' };
const BOSS  = { id: 'u_boss',    name: 'Achieng Otieno', role: 'admin',  email: 'achieng@wanjiru.co.ke' };
const VIEW  = { id: 'u_view',    name: 'Peter Njoroge',  role: 'viewer', email: 'peter@wanjiru.co.ke' };
const FENCED = { id: 'u_fenced', name: 'Anna Lindqvist', role: 'legal',  email: 'anna@wanjiru.co.ke' };
const EVERYONE = [ME, GRACE, DAN, BOSS, VIEW, FENCED];

function contract(over = {}){
  return { id: 'MK-D2', name: 'Cane Supply Agreement',
    counterparty: 'Nordfrakt Logistik AB', template: 'WH', status: 'Under Review',
    folder: 'dist', fields: {}, metadata: {}, audit: [], rounds: [], versions: [],
    signatures: [], comments: [], value: 4800000, redlineText: BODY, format: 'rich', ...over };
}

function world(opts = {}){
  const w = buildWorld({ user: opts.user || ME, ...opts });
  w.win.state = { settings: {}, contracts: [], activeId: 'MK-D2' };
  w.win.getUsers = () => EVERYONE;
  w.win.userById = id => EVERYONE.find(u => u.id === id) || null;
  w.win.saveSettings = () => {};
  /* Anna is fenced out of the distribution stream, which is the fifth refusal
     and the one with a deadlock behind it. */
  w.win.canAccessFolder = (folder, u) => !(u && u.id === FENCED.id && folder === 'dist');
  return w;
}

const mine = (win, c, num, body, over = {}) => {
  const cl = win.negoClauseList(c).find(x => String(x.num) === String(num));
  assert.ok(cl, `clause ${num} must be findable`);
  return win.negoEditClause(c, cl.clauseId, body, { side: 'owner', summary: 'our ask', ...over });
};
/* A contract with a desk already claimed by ME. */
async function claimed(win){
  const c = contract();
  await mine(win, c, 4, '<p>Undisputed invoices are payable within forty-five (45) days.</p>');
  return c;
}

/* ============================================================
   1 — THE ROSTER AND THE THREE SEATS
   ============================================================ */
describe('f166 · lead, contributor, reader', () => {

  test('adding a colleague gives them the contributor seat and nobody else moves', async () => {
    const { win } = world();
    const c = await claimed(win);
    assert.equal(win.deskRole(c, GRACE), 'reader', 'before: she is reading');

    assert.ok(win.deskAddContributor(c, GRACE));

    assert.equal(win.deskRole(c, GRACE), 'contributor');
    assert.equal(win.deskRole(c, ME), 'lead', 'the lead is unchanged');
    assert.equal(win.deskRole(c, DAN), 'reader', 'and everyone else still reads');
    assert.equal(win.deskContributors(c).length, 1);
  });

  test('a contributor cannot add another contributor', async () => {
    const { win } = world();
    const c = await claimed(win);
    win.deskAddContributor(c, GRACE);

    const { win: asGrace, log } = world({ user: GRACE });
    assert.equal(asGrace.deskMayManage(c, GRACE), false);
    assert.equal(asGrace.deskAddContributor(c, DAN), null);
    assert.equal(win.deskContributors(c).length, 1, 'the roster did not grow sideways');
    assert.ok(log.toasts.some(t => t.kind === 'err'), 'and it said why');
  });

  test('an admin can, because somebody has to when the lead is away', async () => {
    const { win } = world();
    const c = await claimed(win);
    const { win: asBoss } = world({ user: BOSS });
    assert.equal(asBoss.deskMayManage(c, BOSS), true);
    assert.ok(asBoss.deskAddContributor(c, DAN));
    assert.equal(win.deskRole(c, DAN), 'contributor');
  });

  test('removing somebody takes their hands and leaves their work', async () => {
    const { win } = world();
    const c = await claimed(win);
    win.deskAddContributor(c, GRACE);
    /* Grace drafts something. */
    const cl = win.negoClauseList(c).find(x => String(x.num) === '6');
    await win.negoEditClause(c, cl.clauseId,
      '<p>Liability is capped at 150% of the fees paid in the preceding twelve months.</p>',
      { side: 'owner', author: GRACE.name, summary: 'grace raises the cap' });
    const before = win.negoChanges(c).length;

    assert.ok(win.deskRemoveContributor(c, GRACE.id));

    assert.equal(win.deskRole(c, GRACE), 'reader');
    assert.equal(win.negoChanges(c).length, before, 'her drafts are still on the record');
  });

  test('handing over moves the lead and keeps the initiator', async () => {
    const { win } = world();
    const c = await claimed(win);
    assert.ok(win.deskHandover(c, GRACE));

    assert.equal(win.deskLead(c).id, GRACE.id);
    assert.equal(win.deskRole(c, GRACE), 'lead');
    assert.equal(win.deskInitiator(c).id, ME.id, 'who started it is history and does not move');
    assert.equal(win.deskRole(c, ME), 'contributor',
      'the outgoing lead stays on the desk — they had wording in flight a minute ago');
  });
});

/* ============================================================
   2 — THE FIVE REFUSALS
   ============================================================
   Each one says which mistake it was. A single grey "invalid" tells you which
   of the five you made: none. */
describe('f166 · who cannot be put on a desk, and why', () => {

  test('a viewer, the lead, somebody already on it, a fenced-out member, and nobody', async () => {
    const { win } = world();
    const c = await claimed(win);
    win.deskAddContributor(c, GRACE);

    const why = q => win.deskResolvePerson(q, c).why || '';
    assert.match(why('peter@wanjiru.co.ke'), /Viewer/);
    assert.match(why('wanjiru@wanjiru.co.ke'), /already leads/);
    assert.match(why('grace@wanjiru.co.ke'), /already on this desk/);
    assert.match(why('anna@wanjiru.co.ke'), /value stream/);
    assert.match(why('nobody@elsewhere.com'), /Nobody in this workspace/);

    assert.equal(win.deskResolvePerson('daniel@wanjiru.co.ke', c).ok, true, 'and Daniel is fine');
  });

  test('the candidate list refuses the same people the resolver does', async () => {
    const { win } = world();
    const c = await claimed(win);
    win.deskAddContributor(c, GRACE);
    const ids = win.deskCandidates(c).map(u => u.id);
    assert.equal(ids.includes(VIEW.id), false, 'no viewers');
    assert.equal(ids.includes(ME.id), false, 'not the lead');
    assert.equal(ids.includes(GRACE.id), false, 'not somebody already on it');
    assert.equal(ids.includes(FENCED.id), false, 'not somebody who cannot open the contract');
    assert.equal(ids.includes(DAN.id), true);
  });
});

/* ============================================================
   3 — ASKING TO JOIN
   ============================================================ */
describe('f166 · a reader has one button, and it reaches the lead', () => {

  test('the request is filed against the contract and shows on the reader\'s band', async () => {
    const { win } = world();
    const c = await claimed(win);

    const { win: asDan } = world({ user: DAN });
    const band = asDan.deskNoticeHtml(c, {});
    assert.match(band, /data-dk-join/, 'a reader is offered the ask');
    assert.match(band, /Wanjiru Kamau leads/);

    assert.ok(asDan.deskRequestJoin(c, { why: 'The Mombasa depot is mine.' }));
    assert.equal(win.deskJoinPending(c).length, 1);

    const after = asDan.deskNoticeHtml(c, {});
    assert.equal(/data-dk-join/.test(after), false, 'and asking twice is still one ask');
    assert.match(after, /request is with them/);
  });

  test('asking twice does not file twice', async () => {
    const { win } = world();
    const c = await claimed(win);
    const { win: asDan } = world({ user: DAN });
    asDan.deskRequestJoin(c, { why: 'once' });
    assert.equal(asDan.deskRequestJoin(c, { why: 'twice' }), null);
    assert.equal(win.deskJoinPending(c).length, 1);
  });

  test('the lead sees it in their own list, and a bystander does not', async () => {
    const { win } = world();
    const c = await claimed(win);
    const { win: asDan } = world({ user: DAN });
    asDan.deskRequestJoin(c, { why: 'The Mombasa depot is mine.' });

    assert.equal(win.deskJoinInboxFor([c], ME).length, 1);
    assert.equal(win.deskJoinInboxFor([c], GRACE).length, 0, 'not a colleague with no say');
    assert.equal(win.deskJoinInboxFor([c], BOSS).length, 1, 'an admin can unstick it');
  });

  test('adding them settles the request rather than leaving it pending forever', async () => {
    const { win } = world();
    const c = await claimed(win);
    const { win: asDan } = world({ user: DAN });
    asDan.deskRequestJoin(c, { why: 'The Mombasa depot is mine.' });

    win.deskAddContributor(c, DAN);
    assert.equal(win.deskJoinPending(c).length, 0);
    assert.equal(win.deskRole(c, DAN), 'contributor');
  });

  test('a decline is recorded, and they are not silently left waiting', async () => {
    const { win, log } = world();
    const c = await claimed(win);
    const { win: asDan } = world({ user: DAN });
    asDan.deskRequestJoin(c, { why: 'curious' });

    assert.ok(win.deskDeclineJoin(c, DAN.id));
    assert.equal(win.deskJoinPending(c).length, 0);
    assert.equal(win.deskRole(c, DAN), 'reader');
    assert.ok(log.audit.some(a => a.action === 'Negotiation desk' && /declined/.test(a.detail)));
  });

  test('a reason longer than a sentence is cut down before it is stored', async () => {
    const { win } = world();
    const c = await claimed(win);
    const { win: asDan } = world({ user: DAN });
    asDan.deskRequestJoin(c, { why: 'x'.repeat(2000) });
    assert.ok(win.deskJoinPending(c)[0].why.length <= win.DK_WHY_MAX);
  });
});

/* ============================================================
   4 — NOBODY LOSES A VERB YET, AND THE WALL HOLDS
   ============================================================ */
describe('f166 · stage 2 still enforces nothing', () => {

  test('a reader files a change exactly as they did yesterday', async () => {
    const { win } = world();
    const c = await claimed(win);
    const { win: asDan, log } = world({ user: DAN });
    assert.equal(asDan.deskRole(c, DAN), 'reader');
    const cl = win.negoClauseList(c).find(x => String(x.num) === '6');
    const filed = await asDan.negoEditClause(c, cl.clauseId,
      '<p>Liability is capped at 150% of the fees paid.</p>',
      { side: 'owner', author: DAN.name, summary: 'daniel edits' });
    assert.ok(filed);
    assert.equal(log.toasts.filter(t => t.kind === 'err').length, 0);
  });

  test('the band is for readers only — a lead and a contributor see no band at all', async () => {
    const { win } = world();
    const c = await claimed(win);
    win.deskAddContributor(c, GRACE);
    assert.equal(win.deskNoticeHtml(c, {}), '', 'the lead');
    const { win: asGrace } = world({ user: GRACE });
    assert.equal(asGrace.deskNoticeHtml(c, {}), '', 'the contributor');
  });

  test('the counterparty is told nothing about any of it', async () => {
    const { win } = world();
    const c = await claimed(win);
    win.deskAddContributor(c, GRACE);
    const { win: asDan } = world({ user: DAN });
    asDan.deskRequestJoin(c, { why: 'let me in' });

    assert.equal(win.deskNoticeHtml(c, { side: 'counterparty' }), '');
    assert.equal(win.deskNoticeHtml(c, { previewing: true }), '');
    assert.equal(win.deskChipHtml(c, { side: 'counterparty' }), '');

    if (typeof win.buildSharePayload === 'function'){
      const s = JSON.stringify(win.buildSharePayload(c, 'h', { org: 'X', sharedBy: ME.name }));
      assert.equal(/Grace Mwangi/.test(s), false, 'no contributor names');
      assert.equal(/joinRequests|contributors|"desk"/.test(s), false);
    }
  });
});

/* ============================================================
   5 — THE TWO LINES THE CARD GAINED
   ============================================================
   Shipped late, because they were in the design render and not in the first
   four stages — reported off a screenshot (Young, 09 Aug 2026): "attached is
   the renders that you created… I do not see these renders in the live report."

   BOTH CARD RENDERERS, always. redlineChangeCardsHtml draws the workbench and
   negoLiveCardsHtml draws the contract tab, and a fix in one of them is not a
   fix in the other — this codebase's own duplication rule, and a feature like
   this is exactly what it was written for. */
describe('f166 · a shared draft says whose hand wrote it', () => {

  function viewWorld(user, on = true){
    const w = buildWorld({ user, negotiationView: true, contractView: true });
    w.win.state = { settings: { deskRule: { on } }, contracts: [], activeId: 'MK-D2' };
    w.win.getUsers = () => EVERYONE;
    w.win.userById = id => EVERYONE.find(u => u.id === id) || null;
    w.win.saveSettings = () => {};
    w.win.canAccessFolder = () => true;
    return w;
  }
  /* A desk led by ME with a change Grace drafted. */
  async function shared(user, on = true){
    const w = viewWorld(user, on);
    const c = contract();
    await mine(w.win, c, 4, '<p>Payable within forty-five (45) days.</p>');
    w.win.deskAddContributor(c, GRACE, { force: true });
    const cl = w.win.negoClauseList(c).find(x => String(x.num) === '6');
    await w.win.negoEditClause(c, cl.clauseId,
      '<p>Liability is capped at 150% of the fees paid in the preceding twelve months.</p>',
      { side: 'owner', author: GRACE.name, summary: 'grace raises the cap' });
    return { w, c };
  }

  test('the workbench card names the colleague who drafted it', async () => {
    const { w, c } = await shared(ME);
    const html = w.win.redlineChangeCardsHtml(c, {});
    /* CLAIM UPDATED, 13 Aug 2026: a name on a CARD is now first name plus
       the surname's initial (cardName) — the whole name stays in the
       line's hover text, and in the record, the emails and the pickers.
       The claim is the same claim; only the form of the name moves. */
    assert.match(html, /dk-card-by/);
    assert.match(html, /drafted by Grace M\./);
    assert.match(html, /class="dk-card-by" title="Grace Mwangi"/,
      'and the whole name is on the row it shortens');
  });

  test('it does not caption your own wording back at you', async () => {
    const { w, c } = await shared(GRACE);
    const html = w.win.redlineChangeCardsHtml(c, {});
    assert.equal(/drafted by Grace M\./.test(html), false,
      'a caption on every card whatever it says is chrome again');
  });

  test('and it never appears on the counterparty\'s seat', async () => {
    const { w, c } = await shared(ME);
    assert.equal(/dk-card-by/.test(w.win.redlineChangeCardsHtml(c, { side: 'counterparty' })), false);
    assert.equal(/dk-card-by/.test(w.win.redlineChangeCardsHtml(c, { previewing: true })), false);
  });

  test('a contributor is told whose decision the counterparty\'s ask is — on BOTH renderers', async () => {
    const { w, c } = await shared(ME);
    const cl = w.win.negoClauseList(c).find(x => String(x.num) === '2');
    await w.win.negoEditClause(c, cl.clauseId, '<p>Fortnightly consignments.</p>',
      { side: 'counterparty', author: 'Erik Lindqvist', summary: 'their ask' });

    const asGrace = viewWorld(GRACE);
    const bench = asGrace.win.redlineChangeCardsHtml(c, {});
    assert.match(bench, /dk-card-instead/, 'the workbench');
    assert.match(bench, /Answering Nordfrakt Logistik AB is Wanjiru Kamau/);

    const tab = asGrace.win.negoLiveCardsHtml(c, {});
    assert.match(tab, /dk-card-instead/, 'the contract tab');
  });

  test('the lead is missing nothing, so is told nothing', async () => {
    const { w, c } = await shared(ME);
    assert.equal(/dk-card-instead/.test(w.win.redlineChangeCardsHtml(c, {})), false);
  });

  test('with the rule off there is no gap to explain', async () => {
    const { c } = await shared(ME, false);
    const asGrace = viewWorld(GRACE, false);
    assert.equal(/dk-card-instead/.test(asGrace.win.redlineChangeCardsHtml(c, {})), false);
  });
});
