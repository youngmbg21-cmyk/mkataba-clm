/* ============================================================
   f470 — what stayed behind on one send stays behind on the next
   ============================================================
   THE DEFECT (process review, 4 Oct 2026). "Unsent" was ONE timestamp:
   anything of ours filed after `negotiation.turnAt`. A change a reviewer HELD,
   a change still OUT with a reviewer, and a colleague's open SUGGESTION are
   all subsets of unsent, so buildSharePayload left them out of a batch send —
   and then negoHandOver stamped a new turnAt. On the very next send the three
   were no longer "unsent", so they were no longer withheld, and they went to
   the counterparty with nobody having cleared them. The wall held for exactly
   one send.

   THE FIX. What a hand-over leaves behind is RECORDED as kept back
   (`negotiation.keptIds`), and a kept-back change stays unsent whatever the
   turn stamp says — until a hand-over happens at which it is no longer
   withheld, which is the send that carries it. f154's rule is untouched: a
   hold still applies only to wording the other side has not seen, because a
   kept-back change never left.

   BOTH HOSTS. The browser's sets (negoUnsentAsks → reviewWithheldIds,
   deskSuggestedIds) and the route's (rvUnsentOurs → rvWithheldIds,
   dkSuggestedIds) read the same record; the route also carries the list
   through an ordinary save, so a browser holding an older copy cannot wipe it.
   ============================================================ */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');
const { startHati } = require('./helpers');

const BODY =
  '<h1>Cane Supply Agreement</h1><p>Between Wanjiru Catering Ltd and Nordfrakt Logistik AB</p>'
  + '<h2>Clause 2 · Delivery</h2><p>Weekly consignments to the mill gate.</p>'
  + '<h2>Clause 4 · Payment Terms</h2><p>Undisputed invoices are payable within thirty (30) days.</p>'
  + '<h2>Clause 6 · Liability</h2><p>Liability is capped at the fees paid in the preceding twelve months.</p>'
  + '<h2>Clause 9 · Notices</h2><p>Notices are delivered by hand or by registered post.</p>';

const BOSS = { id: 'u_boss', name: 'Achieng Otieno', role: 'admin', email: 'achieng@wanjiru.co.ke' };
const ME = { id: 'u_wanjiru', name: 'Wanjiru Kamau', role: 'legal', email: 'wanjiru@wanjiru.co.ke' };

function contract(over = {}){
  return { id: 'MK-K1', name: 'Cane Supply Agreement',
    counterparty: 'Nordfrakt Logistik AB', template: 'WH', status: 'Under Review',
    folder: 'dist', fields: {}, metadata: {}, audit: [], rounds: [], versions: [],
    signatures: [], comments: [], value: 4800000, redlineText: BODY, format: 'rich', ...over };
}

/* A clock that always moves. A hand-over and a filing inside one millisecond
   would compare EQUAL, and equal reads as "sent" — a test that passed on a fast
   machine and failed on a slow one would be measuring the clock. */
function world(opts = {}){
  const w = buildWorld({ user: opts.user || ME, ...opts });
  w.win.state = { settings: opts.settings || {}, contracts: [] };
  w.win.getUsers = () => [ME, BOSS];
  w.win.userById = id => [ME, BOSS].find(u => u.id === id) || null;
  w.win.saveSettings = () => {};
  let t = Date.parse('2026-10-01T08:00:00.000Z');
  w.win.nowISO = () => new Date(t += 1000).toISOString();
  return w;
}
const as = (win, u) => { win.currentUser = () => u; };
const mine = async (win, c, num, body) => {
  const cl = win.negoClauseList(c).find(x => x.num === num);
  assert.ok(cl, `clause ${num} must be findable`);
  return win.negoEditClause(c, cl.clauseId, body, { side: 'owner', author: win.currentUser().name, summary: 'our ask' });
};
/* What a batch send would carry: our unsent asks less everything withheld —
   buildSharePayload's own subtraction, read through the same three sets. */
const carried = (win, c) => {
  const back = new Set([...win.reviewWithheldIds(c), ...win.deskSuggestedIds(c), ...win.negoHeldBackIds(c)]);
  return [...win.negoUnsentAsks(c, 'owner')].map(x => x.id).filter(id => !back.has(id)).sort();
};
/* jsdom's arrays come from another realm, and deepStrictEqual tells realms apart. */
const unsentIds = (win, c) => [...win.negoUnsentAsks(c, 'owner')].map(x => x.id);
const send = (win, c) => win.negoHandOver(c, { to: 'counterparty', by: win.currentUser().name });

describe('f470 (1) — a review hold survives the send it was kept out of', () => {
  test('held, then a batch send, then another send: still held, still unsent', async () => {
    const { win } = world({ user: BOSS });
    const c = contract(); win.negoInit(c);
    const good = await mine(win, c, '4', '<p>Payable within forty-five (45) days.</p>');
    const bad = await mine(win, c, '6', '<p>Liability is uncapped.</p>');
    win.reviewAsk(c, { reviewer: BOSS, by: ME.name });
    win.reviewMark(c, good.id, 'cleared');
    win.reviewMark(c, bad.id, 'held');
    win.reviewReturn(c, {});
    assert.deepEqual(carried(win, c), [good.id], 'the first send carries the cleared one only');

    send(win, c);
    assert.deepEqual(unsentIds(win, c), [bad.id],
      'the held change never left, so it is still unsent after the send');
    assert.equal(win.reviewHeldIds(c).has(bad.id), true, 'and still held');

    /* The counterparty answers; we send again. THIS is the send that leaked. */
    win.negoHandOver(c, { to: 'owner', by: 'Erik Lindqvist' });
    await mine(win, c, '9', '<p>Notices may also be sent by email.</p>');
    assert.ok(!carried(win, c).includes(bad.id), 'the second send does not carry the held change');
    send(win, c);
    assert.equal(win.reviewHeldIds(c).has(bad.id), true, 'nor the third');
  });

  test('a change still OUT with the reviewer is kept back the same way', async () => {
    const { win } = world({ user: ME });
    const c = contract(); win.negoInit(c);
    const a = await mine(win, c, '4', '<p>Payable within forty-five (45) days.</p>');
    win.reviewAsk(c, { reviewer: BOSS, by: ME.name });
    assert.deepEqual(carried(win, c), [], 'nothing travels while it is being read');
    send(win, c);
    win.negoHandOver(c, { to: 'owner', by: 'Erik Lindqvist' });
    assert.ok(win.reviewWithheldIds(c).has(a.id), 'still awaiting after the send it missed');
    assert.ok(!carried(win, c).includes(a.id), 'and the next send still leaves it home');
  });

  test('once cleared it travels on the next send, and then it is sent', async () => {
    const { win } = world({ user: BOSS });
    const c = contract(); win.negoInit(c);
    const a = await mine(win, c, '6', '<p>Liability is uncapped.</p>');
    win.reviewAsk(c, { reviewer: BOSS, by: ME.name });
    win.reviewMark(c, a.id, 'held');
    send(win, c);
    assert.ok(win.reviewHeldIds(c).has(a.id));
    /* The reviewer lifts the hold. */
    win.reviewMark(c, a.id, 'cleared');
    win.reviewReturn(c, {});
    assert.deepEqual(carried(win, c), [a.id], 'cleared — the next send carries it');
    send(win, c);
    assert.deepEqual(unsentIds(win, c), [],
      'and from that send on it is with them');
    /* f154's rule: wording they hold cannot be recalled by a hold. */
    win.reviewAsk(c, { reviewer: BOSS, by: ME.name, ids: [a.id] });
    assert.equal(win.reviewHeldIds(c).has(a.id), false, 'a hold only ever applies to wording they have not seen');
  });
});

describe('f470 (2) — a colleague\'s suggestion survives the send it was kept out of', () => {
  const DESK_ON = { deskRule: { on: true } };
  test('suggested, a batch send, another send: still not travelling', async () => {
    const { win } = world({ user: BOSS, settings: DESK_ON });
    const c = contract(); win.negoInit(c);
    win.deskOpen(c, { lead: BOSS, by: BOSS });
    win.deskAddContributor(c, ME, { force: true });
    as(win, ME);
    const sg = await mine(win, c, '4', '<p>Payable within forty-five (45) days.</p>');
    assert.ok(sg && sg.suggested, 'a contributor\'s filing is a suggestion');
    as(win, BOSS);
    const lead = await mine(win, c, '9', '<p>Notices may also be sent by email.</p>');
    assert.deepEqual(carried(win, c), [lead.id], 'the lead\'s own goes, the suggestion stays');
    send(win, c);
    assert.ok(win.deskSuggestedIds(c).has(sg.id), 'still a suggestion that must not travel');
    win.negoHandOver(c, { to: 'owner', by: 'Erik Lindqvist' });
    assert.ok(!carried(win, c).includes(sg.id), 'the next send leaves it home too');

    /* Adopted — now it goes, once. */
    win.deskAdoptSuggestion(c, sg.id);
    assert.deepEqual(carried(win, c), [sg.id]);
    send(win, c);
    assert.deepEqual(unsentIds(win, c), []);
  });

  test('Send all counts neither a hold nor an open suggestion', () => {
    const VIEW = fs.readFileSync(path.join(__dirname, '..', 'js/views/negotiation.js'), 'utf8');
    const fn = VIEW.slice(VIEW.indexOf('function rlUnsentCount('), VIEW.indexOf('function rlPlanBandHtml('));
    assert.match(fn, /deskSuggestedIds/, 'the button and the payload subtract the same three sets');
  });
});

/* ============================================================
   3 — THE ROUTE: the same rule where the wording actually leaves
   ============================================================ */
let h, admin;
before(async () => {
  h = await startHati();
  admin = h.client('admin');
  await admin.json('/api/setup', { method: 'POST', body: {
    org: 'Wanjiru Catering Ltd', name: 'Wanjiru Kamau', email: 'wanjiru@w.co.ke',
    password: 'adminpassword1', data: { uid: 900, contracts: [], settings: {} } } });
});
after(async () => { if (h) await h.stop(); });

const CHG = (id, at) => ({ id, clauseId: 'cl-' + id, clauseLabel: 'Clause ' + id,
  changeType: 'modify', status: 'pending', summary: 'ask', oldText: 'before', newText: 'after',
  ops: [], hash: 'h-' + id, author: 'Wanjiru Kamau', authorSide: 'owner', createdAt: at });
let version = 0;
const ID = 'MK-KEPT-1';
async function put(c){
  const r = await admin.raw('/api/contracts/' + ID, { method: 'PUT', body: { contract: { ...c, id: ID }, baseVersion: version } });
  if (r.status === 200) version = r.json.version;
  return r;
}
const share = ids => admin.raw('/api/shares', { method: 'POST', body: {
  payload: { kind: 'hati-share', purpose: 'negotiate', org: 'Wanjiru Catering Ltd', sharedBy: 'Wanjiru Kamau',
    contract: { id: ID, name: 'Cane Supply Agreement', status: 'Under Review',
      changes: ids.map(id => ({ id, summary: 'ask', clauseLabel: 'c' })) } },
  recipient: { name: 'Nordfrakt', email: 'erik@nordfrakt.se' }, channel: 'link', purpose: 'negotiate' } });

describe('f470 (3) — the route keeps a kept-back change behind on the next send', () => {
  test('held before the last hand-over, still stripped after it', async () => {
    const held = CHG('CHG-002', '2026-10-01T09:00:00.000Z');
    held.review = { verdict: 'held', by: 'Simon Jordan', at: '2026-10-01T09:30:00.000Z', hash: 'h-CHG-002', reviewId: 'REV-1' };
    const c = { name: 'Cane Supply Agreement', counterparty: 'Nordfrakt Logistik AB', status: 'Under Review',
      folder: 'dist', value: 100, audit: [], versions: [], rounds: [],
      changes: [CHG('CHG-001', '2026-10-01T09:00:00.000Z'), held],
      negotiation: { round: 1, turn: 'counterparty', turnAt: '2026-10-01T10:00:00.000Z', keptIds: ['CHG-002'] } };
    assert.equal((await put(c)).status, 200, 'seed');
    const r = await share(['CHG-001', 'CHG-002']);
    assert.equal(r.status, 200, JSON.stringify(r.json));
    const seen = await h.client('cp').raw('/api/shares/' + r.json.token);
    assert.ok(!/CHG-002/.test(seen.text), 'the held change never reaches them');
  });

  test('a save from an older copy does not wipe the list while the hold stands', async () => {
    const got = await admin.json('/api/contracts/' + ID);
    const c = JSON.parse(JSON.stringify(got.contract || got));
    delete c.negotiation.keptIds;
    assert.equal((await put(c)).status, 200);
    const back = await admin.json('/api/contracts/' + ID);
    assert.deepEqual(((back.contract || back).negotiation || {}).keptIds, ['CHG-002'],
      'the stored list wins for a change that is still withheld');
  });
});
