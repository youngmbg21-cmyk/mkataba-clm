/* ============================================================
   f610 — a contributor discards only their own drafts (owner decision D3,
   9 Oct 2026)
   ============================================================
   Measured in the 9 Oct review: with the desk rule on, a contributor's row
   offered Discard on the LEAD's unsent draft, one press deleted it, and the
   server accepted the save. The owner's rule: a contributor may discard only
   their own drafts; the lead or an admin may discard anyone's; and Discard
   always asks "Discard #id?" first. Where nobody leads a desk, the contract's
   owner stands where the lead would.

   Three places hold the rule and each is checked here: the engine
   (negoRetractDraft through negoMayDiscard), the row (no Discard drawn for
   somebody who may not press it), and the server's PUT guard
   (srvDiscardRefusal, a difference against the stored record).
   ============================================================ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');
const { openedCards } = require('./cards');

const ROOT = path.join(__dirname, '..');
const BODY =
  '<h1>Supply Agreement</h1><p>Between Wanjiru Catering Ltd and Juno Limited</p>'
  + '<h2>1. Scope</h2><p>The Supplier shall deliver the goods to the Buyer\'s warehouse.</p>'
  + '<h2>2. Payment</h2><p>Each invoice is payable within thirty (30) days.</p>';

const LEAD = { id: 'u_lead', name: 'Amina Otieno', role: 'legal', email: 'a@w.co.ke' };
const CONTRIB = { id: 'u_con', name: 'Brian Kamau', role: 'legal', email: 'b@w.co.ke' };
const ADMIN = { id: 'u_adm', name: 'Grace Wafula', role: 'admin', email: 'g@w.co.ke' };
const OTHER = { id: 'u_oth', name: 'Peter Mwangi', role: 'legal', email: 'p@w.co.ke' };

const contract = (over = {}) => ({ id: 'MK-610', name: 'Supply Agreement',
  counterparty: 'Juno Limited', status: 'Under Review', folder: 'dist',
  fields: {}, metadata: {}, audit: [], rounds: [], versions: [], signatures: [], comments: [],
  value: 1000, redlineText: BODY, format: 'rich', owner: { id: LEAD.id, name: LEAD.name }, ...over });

function world(){
  const w = buildWorld({ user: LEAD, negotiationView: true, contractView: true });
  w.win.state = { settings: {}, contracts: [] };
  w.win.getUsers = () => [LEAD, CONTRIB, ADMIN, OTHER];
  w.win.saveSettings = () => {};
  w.win.persist = () => {};
  w.toasts = [];
  w.win.toast = (m, k) => w.toasts.push({ kind: k || 'ok', text: String(m) });
  w.as = u => { w.win.currentUser = () => u; };
  /* js/core.js's own reading (the world does not load core.js). */
  w.win.contractOwnedBy = (c, u) => !!(c && u && c.owner
    && (c.owner.id ? String(c.owner.id) === String(u.id) : c.owner.name === u.name));
  return w;
}
async function leadsDraft(w, withDesk){
  const c = contract(withDesk ? { desk: { leadId: LEAD.id, leadName: LEAD.name,
    contributors: [{ id: CONTRIB.id, name: CONTRIB.name }] } } : {});
  w.win.negoInit(c);
  const cl = w.win.negoClauseList(c).find(x => x.num === '2');
  w.as(LEAD);
  const ch = await w.win.negoEditClause(c, cl.clauseId,
    '<p>Each invoice is payable within sixty (60) days.</p>',
    { side: 'owner', author: LEAD.name, summary: 'sixty days' });
  assert.ok(ch, 'the lead\'s draft files');
  return { c, ch };
}

describe('f610 (1) — the engine refuses a colleague\'s draft', () => {
  test('a contributor cannot discard the lead\'s draft; the lead and an admin can', async () => {
    const w = world();
    const { c, ch } = await leadsDraft(w, true);
    w.as(CONTRIB);
    assert.equal(w.win.negoMayDiscard(c, ch), false);
    assert.equal(w.win.negoRetractDraft(c, ch.id, { side: 'owner' }), null, 'refused');
    assert.equal(c.changes.length, 1, 'the lead\'s draft is still there');
    assert.ok(w.toasts.some(t => t.kind === 'err' && /only your own drafts/.test(t.text)),
      'and the refusal is said in red');
    w.as(ADMIN);
    assert.equal(w.win.negoMayDiscard(c, ch), true, 'an admin may');
    w.as(LEAD);
    assert.equal(w.win.negoMayDiscard(c, ch), true, 'the author (and lead) may');
    assert.ok(w.win.negoRetractDraft(c, ch.id, { side: 'owner' }), 'and does');
    assert.equal(c.changes.length, 0);
  });

  test('the lead may discard a contributor\'s draft; a contributor their own', async () => {
    const w = world();
    const { c } = await leadsDraft(w, true);
    const cl = w.win.negoClauseList(c).find(x => x.num === '1');
    w.as(CONTRIB);
    const mine = await w.win.negoEditClause(c, cl.clauseId,
      '<p>The Supplier shall deliver the goods to the Buyer\'s main warehouse.</p>',
      { side: 'owner', author: CONTRIB.name, summary: 'main warehouse' });
    assert.ok(mine);
    assert.equal(w.win.negoMayDiscard(c, mine), true, 'their own');
    w.as(LEAD);
    assert.equal(w.win.negoMayDiscard(c, mine), true, 'the lead');
    w.as(OTHER);
    assert.equal(w.win.negoMayDiscard(c, mine), false, 'a stranger to the desk may not');
  });

  test('desk rule off: the contract owner may too; desk rule on: the lead decides', async () => {
    const w = world();
    const { c, ch } = await leadsDraft(w, false);
    w.as(OTHER);
    assert.equal(w.win.negoMayDiscard(c, ch), false, 'a colleague who neither wrote it nor owns the contract');
    c.owner = { id: OTHER.id, name: OTHER.name };
    assert.equal(w.win.negoMayDiscard(c, ch), true, 'with the rule off the contract\'s owner may');
    w.win.state.settings.deskRule = { on: true };
    assert.equal(w.win.negoMayDiscard(c, ch), false, 'with the rule on the seat decides — the owner is not the lead');
  });
});

describe('f610 (2) — the row draws Discard only for those who may press it', () => {
  test('the contributor\'s row on the lead\'s draft carries no Discard', async () => {
    const w = world();
    const { c, ch } = await leadsDraft(w, true);
    w.as(LEAD);
    const asLead = openedCards(w.win, c, { side: 'owner', canAct: true, by: LEAD.name });
    assert.match(asLead, new RegExp('data-rl-retract="' + ch.id + '"'), 'the lead sees Discard');
    w.as(CONTRIB);
    const asCon = openedCards(w.win, c, { side: 'owner', canAct: true, by: CONTRIB.name });
    assert.ok(!new RegExp('data-rl-retract="' + ch.id + '"').test(asCon), 'the contributor does not');
  });
});

describe('f610 (3) — the server refuses the same save', () => {
  const SRV = fs.readFileSync(path.join(ROOT, 'server/server.js'), 'utf8');
  const slice = SRV.slice(SRV.indexOf('const deskOfRow ='),
    SRV.indexOf('/* Did this save add, remove or reword one of OUR changes?'));
  let ruleOn = true;
  const mod = new Function('getSetting', 'rvUnsentOurs', 'deskRuleOn', slice
    + '\nreturn { srvMayDiscard, srvDiscardRefusal };')(() => ({}), () => [], () => ruleOn);
  const stored = () => ({ id: 'MK-610', owner: { id: LEAD.id, name: LEAD.name },
    desk: { leadId: LEAD.id, leadName: LEAD.name, contributors: [{ id: CONTRIB.id, name: CONTRIB.name }] },
    changes: [{ id: 'CHG-001', authorSide: 'owner', status: 'pending', author: LEAD.name, revisions: [] }],
    negotiation: { rounds: [] } });
  const without = () => ({ ...stored(), changes: [] });

  test('a contributor removing the lead\'s unsent draft is refused', () => {
    assert.match(String(mod.srvDiscardRefusal(stored(), without(), CONTRIB)), /only your own drafts/);
  });
  test('the author, the lead and an admin pass; a save that removes nothing passes', () => {
    assert.equal(mod.srvDiscardRefusal(stored(), without(), LEAD), null);
    assert.equal(mod.srvDiscardRefusal(stored(), without(), ADMIN), null);
    assert.equal(mod.srvDiscardRefusal(stored(), stored(), CONTRIB), null);
  });
  test('with the desk rule off, the contract owner may too; on, only the lead', () => {
    const prev = stored(); prev.owner = { id: OTHER.id, name: OTHER.name };
    assert.match(String(mod.srvDiscardRefusal(prev, without(), OTHER)), /only your own drafts/);
    ruleOn = false;
    assert.equal(mod.srvDiscardRefusal(prev, without(), OTHER), null);
    assert.match(String(mod.srvDiscardRefusal(prev, without(), CONTRIB)), /only your own drafts/);
    ruleOn = true;
  });
  test('cutting back a colleague\'s revisions is a discard too', () => {
    const prev = stored(); prev.changes[0].revisions = [{ hash: 'a' }];
    assert.match(String(mod.srvDiscardRefusal(prev, stored(), CONTRIB)), /only your own drafts/);
  });
  test('the guard is wired into the PUT', () => {
    assert.match(SRV, /const dcWhy = srvDiscardRefusal\(prev, c, req\.user\);\s*\n\s*if \(dcWhy\) return res\.status\(403\)/);
  });
});
