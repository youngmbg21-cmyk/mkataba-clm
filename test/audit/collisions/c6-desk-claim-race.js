/* ============================================================
   COLLISION SWEEP — C6: THE DESK CLAIM RACE
   ============================================================
   Two colleagues file their FIRST change on the same contract from two
   browsers holding the same baseVersion. The desk is claimed by the first
   change filed on our side (deskClaimOnFile, inside negoFileChange). Both
   browsers therefore claim it locally, for two different people.

   The stage is a REAL server (test/helpers.js) for storage, versioning and
   the desk guard on PUT /api/contracts/:id, plus TWO REAL BROWSER WORLDS
   (test/world.js) so the change and the claim are produced by the product's
   own funnel rather than by a fixture pretending to be one.

   ARMED STATE IS ASSERTED BEFORE ANYTHING IS JUDGED:
     · the desk rule is really ON in the stored settings (the D1 lesson: the
       shape is {deskRule:{on:true}} inside the appSettings blob, and PUT
       /api/settings takes the body AS that blob)
     · both browsers really hold the same version number
     · each browser's own copy really names its own filer as lead

   Run:  node test/audit/collisions/c6-desk-claim-race.js
*/
const path = require('node:path');
const { startHati, seedWorkspace, FOLDER_A } = require(path.join(__dirname, '..', '..', 'helpers.js'));
const { buildWorld } = require(path.join(__dirname, '..', '..', 'world.js'));

let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) { pass++; console.log('PASS  ' + msg); } else { fail++; console.log('FAIL  ' + msg); } };
const note = msg => console.log('  ·   ' + msg);
const head = msg => console.log('\n=== ' + msg + ' ===');

const BODY = [
  '<h1>SUPPLY AGREEMENT</h1>',
  '<h2>1. TERM</h2><p>This Agreement runs for twelve (12) months from the Effective Date.</p>',
  '<h2>2. PAYMENT</h2><p>Payment shall be made within thirty (30) days of a valid invoice.</p>',
  '<h2>3. LIABILITY</h2><p>Liability is capped at the sums paid in the preceding twelve months.</p>',
].join('');

/* A browser: the real modules, a real signed-in person, the desk rule as the
   server has it, and one contract in memory. */
function browser(user, contract, deskRuleOn) {
  const w = buildWorld({ user });
  w.win.state = Object.assign({}, w.win.state, {
    contracts: [contract], activeId: contract.id,
    settings: { deskRule: { on: !!deskRuleOn, staleDays: 5 } },
  });
  return w;
}

/* What js/core.js's saveContract sends. Stripping the underscored transport
   fields exactly as it does, so the payload the server sees is the real one. */
function payloadOf(c) {
  const p = { ...c };
  delete p._light; delete p._loaded; delete p._v;
  delete p._raisedBy; delete p._raisedAt; delete p._signedAt; delete p._lastAuditAt;
  delete p._persisted; delete p._chainVerify;
  return p;
}

async function main() {
  const h = await startHati();
  try {
    const ws = await seedWorkspace(h);
    const admin = ws.admin;

    /* Two plain Editors, neither of them admin, both unrestricted on folders. */
    const mk = async (name, email) => {
      const created = await admin.json('/api/users', { method: 'POST', body: {
        name, email, role: 'legal', password: 'temporary-pass-1' } });
      const c = h.client(email);
      await c.json('/api/login', { method: 'POST', body: { email, password: 'temporary-pass-1' } });
      await c.json('/api/password/change', { method: 'POST', body: { current: 'temporary-pass-1', password: 'their-own-pass-9' } });
      return { client: c, user: created.user };
    };
    const A = await mk('Asha Mwangi', 'asha@example.co.ke');
    const B = await mk('Bram Odhiambo', 'bram@example.co.ke');

    head('ARM — the desk rule is switched on, and it is read back from the server');
    const before = await admin.json('/api/bootstrap');
    ok(!((before.settings || {}).deskRule || {}).on, 'ARMED-0 the rule is OFF by default (bootstrap says ' + JSON.stringify((before.settings || {}).deskRule) + ')');
    await admin.json('/api/settings', { method: 'PUT', body: {
      ...(before.settings || {}), deskRule: { on: true, staleDays: 5 } } });
    const after = await admin.json('/api/bootstrap');
    const armed = !!(((after.settings || {}).deskRule || {}).on);
    ok(armed, 'ARMED-1 stored settings now read deskRule.on=true — ' + JSON.stringify((after.settings || {}).deskRule));
    if (!armed) throw new Error('could not arm the desk rule — everything below would be meaningless');

    head('ARM — a contract both Editors can see, with a document to redline');
    const ID = 'MK-DESK-1';
    const seed = {
      id: ID, name: 'Raw Material Supply', counterparty: 'Nordkust Industri AB',
      folder: FOLDER_A, value: 4800000, valueType: 'standard', status: 'Under Review',
      template: null, format: 'rich', redlineText: BODY,
      lastAction: '15 Aug 2026', expiry: '2027-06-30', hash: null, signedAt: null,
      fields: {}, metadata: {}, comments: [], signatures: [], obligations: [],
      rounds: [], changes: [],
      audit: [{ at: new Date().toISOString(), user: 'Amina Otieno', action: 'Created', detail: 'probe fixture' }],
    };
    await admin.json('/api/contracts/' + ID, { method: 'PUT', body: { contract: seed, baseVersion: 0 } });

    const aFetch = await A.client.json('/api/contracts/' + ID);
    const bFetch = await B.client.json('/api/contracts/' + ID);
    ok(aFetch._v === bFetch._v, 'ARMED-2 both browsers hold the SAME baseVersion: A._v=' + aFetch._v + ' B._v=' + bFetch._v);
    ok(!aFetch.desk || !aFetch.desk.leadId, 'ARMED-3 no desk is claimed yet (desk=' + JSON.stringify(aFetch.desk || null) + ')');
    const baseVersion = aFetch._v;

    head('ARM — each browser files its own first change through the real funnel');
    const wA = browser({ id: A.user.id, name: A.user.name, role: 'legal', email: A.user.email }, JSON.parse(JSON.stringify(aFetch)), true);
    const wB = browser({ id: B.user.id, name: B.user.name, role: 'legal', email: B.user.email }, JSON.parse(JSON.stringify(bFetch)), true);
    const cA = wA.win.state.contracts[0];
    const cB = wB.win.state.contracts[0];

    wA.win.negoInit(cA); wB.win.negoInit(cB);
    const clausesA = wA.win.negoClauseList(cA);
    const clausesB = wB.win.negoClauseList(cB);
    note('A sees clauses: ' + clausesA.map(x => x.clauseId).join(', '));
    const clauseA = clausesA.find(x => /PAYMENT/i.test(x.text || '')) || clausesA[1];
    const clauseB = clausesB.find(x => /LIABILITY/i.test(x.text || '')) || clausesB[2];

    /* side:'owner' is what every authoring screen passes — negoFileChange
       defaults to 'counterparty', and a probe that forgot it would file two
       INBOUND changes, claim no desk at all, and read exactly like a product
       with no race in it. */
    const chA = await wA.win.negoEditClause(cA, clauseA.clauseId,
      '<p>Payment shall be made within forty-five (45) days of a valid invoice.</p>', { side: 'owner' });
    const chB = await wB.win.negoEditClause(cB, clauseB.clauseId,
      '<p>Liability is capped at twice the sums paid in the preceding twelve months.</p>', { side: 'owner' });

    ok(!!chA && !!chB, 'ARMED-4 both funnels filed a change: A=' + (chA && chA.id) + ' B=' + (chB && chB.id));
    const leadA = wA.win.deskLead(cA), leadB = wB.win.deskLead(cB);
    note('A browser desk: ' + JSON.stringify(cA.desk));
    note('B browser desk: ' + JSON.stringify(cB.desk));
    ok(leadA && String(leadA.id) === String(A.user.id),
      'ARMED-5 A\'s browser names A as lead: ' + JSON.stringify(leadA));
    ok(leadB && String(leadB.id) === String(B.user.id),
      'ARMED-6 B\'s browser names B as lead: ' + JSON.stringify(leadB));
    ok(String(leadA.id) !== String(leadB.id),
      'ARMED-7 THE COLLISION IS REAL — two browsers, two different leads, one contract');

    /* Both browsers also believe they may send: the desk gates sending. */
    ok(wA.win.deskMaySend(cA, { id: A.user.id, name: A.user.name, role: 'legal' }) === true,
      'ARMED-8 A\'s browser: deskMaySend = true');
    ok(wB.win.deskMaySend(cB, { id: B.user.id, name: B.user.name, role: 'legal' }) === true,
      'ARMED-9 B\'s browser: deskMaySend = true (both think they own the send)');

    head('THE RACE — both saves go out with the same baseVersion');
    const rA = await A.client.raw('/api/contracts/' + ID, { method: 'PUT',
      body: { contract: payloadOf(cA), baseVersion } });
    const rB = await B.client.raw('/api/contracts/' + ID, { method: 'PUT',
      body: { contract: payloadOf(cB), baseVersion } });
    note('A save → ' + rA.status + ' ' + (rA.text || '').slice(0, 160));
    note('B save → ' + rB.status + ' ' + (rB.text || '').slice(0, 160));
    ok(rA.status === 200, 'first save lands (200)');
    ok(rB.status === 409, 'second save is refused as a version conflict (409) — ' + JSON.stringify(rB.json));

    const stored1 = await admin.json('/api/contracts/' + ID);
    ok(String(stored1.desk.leadId) === String(A.user.id),
      'the stored desk names A: leadId=' + stored1.desk.leadId + ' leadName=' + stored1.desk.leadName);
    ok((stored1.changes || []).length === 1 && stored1.changes[0].id === chA.id,
      'the stored record carries A\'s change only: ' + (stored1.changes || []).map(x => x.id + '/' + x.author).join(','));

    head('YARDSTICK — the loser\'s screen still shows the loser as lead');
    ok(String(wB.win.deskLead(cB).id) === String(B.user.id),
      'after the refusal, B\'s in-memory contract STILL names B as lead — nothing rolled it back');
    ok(wB.win.deskMaySend(cB) === true,
      'and B\'s browser still answers deskMaySend = true, over a server that says otherwise');
    note('nothing in the client reverts c.desk on a failed save: saveContract\'s catch branch '
       + 'either re-saves (keep mine), Object.assigns the server copy (load theirs), or toasts.');

    head('YARDSTICK — does anything reconcile it before a page reload?');
    {
      const fs2 = require('node:fs');
      const core = fs2.readFileSync(path.join(__dirname, '..', '..', '..', 'js', 'core.js'), 'utf8');
      ok(/async function pollNow\(reason\)\{[\s\S]{0,220}pollPendingResponses\(\);[\s\S]{0,80}pollThreadMessages\(\);/.test(core),
        'the client\'s only poller asks for counterparty RESPONSES and thread messages — it never '
        + 're-reads the contract record, so a stale desk is never refreshed by a tick');
      ok(/async function ensureFull\(c\)\{\s*\n?\s*if\(!API_MODE\(\) \|\| !c \|\| c\._loaded\) return;/.test(core),
        'and ensureFull returns early on an already-loaded contract, so re-opening the room does not '
        + 're-read it either — only a page reload (loadBootstrap) puts B\'s screen right');
    }

    head('KEEP MINE — what the H-4 dialog\'s first button actually does');
    const fresh = await B.client.json('/api/contracts/' + ID);
    const keepMine = await B.client.raw('/api/contracts/' + ID, { method: 'PUT',
      body: { contract: payloadOf(cB), baseVersion: fresh._v } });
    note('B "keep mine & save" → ' + keepMine.status + ' ' + (keepMine.text || '').slice(0, 220));
    ok(keepMine.status === 403,
      'THE SERVER REFUSES IT (403) — the desk guard asks rosterMoved against the stored desk');
    ok(/can change who is on this negotiation/i.test(keepMine.text || ''),
      'and the refusal NAMES the lead and the way out: ' + JSON.stringify(keepMine.json));

    head('YARDSTICK — a refused save is a told save');
    const msg = String((keepMine.json && keepMine.json.error) || '');
    ok(!/conflict|version/i.test(msg),
      'the 403 text carries neither "conflict" nor "version", so js/core.js saveContract '
      + 'falls to its plain error toast (co_save_failed + message) rather than the H-4 dialog');
    ok(msg.includes(A.user.name),
      'the sentence B is shown names ' + A.user.name + ' — but B has just filed what B believes '
      + 'is the FIRST change on an unclaimed contract, so the refusal describes a desk B never saw');

    head('AND B\'S CHANGE IS NOWHERE');
    const stored2 = await admin.json('/api/contracts/' + ID);
    const ids2 = (stored2.changes || []).map(x => x.id + '/' + x.author);
    ok(!(stored2.changes || []).some(x => x.author === B.user.name),
      'the stored contract holds no change of B\'s: [' + ids2.join(', ') + ']');
    const trail = (stored2.audit || []).map(a => a.action + ': ' + a.detail);
    ok(!trail.some(t => /Bram|refused|blocked|not saved/i.test(t)),
      'and the audit trail says nothing about B\'s attempt — ' + trail.length + ' lines, none naming it');
    trail.forEach(t => note('audit | ' + t.slice(0, 120)));

    head('CONTROL — the same race with the rule OFF (the shipped default)');
    await admin.json('/api/settings', { method: 'PUT', body: {
      ...(after.settings || {}), deskRule: { on: false, staleDays: 5 } } });
    const off = await admin.json('/api/bootstrap');
    ok(!(((off.settings || {}).deskRule || {}).on), 'ARMED-10 rule read back OFF: ' + JSON.stringify((off.settings || {}).deskRule));

    const ID2 = 'MK-DESK-2';
    await admin.json('/api/contracts/' + ID2, { method: 'PUT', body: { contract: { ...seed, id: ID2 }, baseVersion: 0 } });
    const a2 = await A.client.json('/api/contracts/' + ID2);
    const b2 = await B.client.json('/api/contracts/' + ID2);
    ok(a2._v === b2._v, 'ARMED-11 both browsers hold version ' + a2._v + ' of ' + ID2);

    const wA2 = browser({ id: A.user.id, name: A.user.name, role: 'legal', email: A.user.email }, JSON.parse(JSON.stringify(a2)), false);
    const wB2 = browser({ id: B.user.id, name: B.user.name, role: 'legal', email: B.user.email }, JSON.parse(JSON.stringify(b2)), false);
    const c2A = wA2.win.state.contracts[0], c2B = wB2.win.state.contracts[0];
    wA2.win.negoInit(c2A); wB2.win.negoInit(c2B);
    const clA2 = wA2.win.negoClauseList(c2A).find(x => /PAYMENT/i.test(x.text || ''));
    const clB2 = wB2.win.negoClauseList(c2B).find(x => /LIABILITY/i.test(x.text || ''));
    const ch2A = await wA2.win.negoEditClause(c2A, clA2.clauseId, '<p>Payment within forty-five (45) days.</p>', { side: 'owner' });
    const ch2B = await wB2.win.negoEditClause(c2B, clB2.clauseId, '<p>Liability capped at twice the sums paid.</p>', { side: 'owner' });
    ok(!!ch2A && !!ch2B, 'ARMED-12 both filed with the rule off: ' + ch2A.id + ' / ' + ch2B.id);
    ok(String(wA2.win.deskLead(c2A).id) !== String(wB2.win.deskLead(c2B).id),
      'ARMED-13 the desk is still claimed by each browser for its own filer even with the rule OFF '
      + '(deskClaimOnFile runs before the refusal, unconditionally)');

    const r2A = await A.client.raw('/api/contracts/' + ID2, { method: 'PUT', body: { contract: payloadOf(c2A), baseVersion: a2._v } });
    ok(r2A.status === 200, 'A lands (200)');
    const r2B = await B.client.raw('/api/contracts/' + ID2, { method: 'PUT', body: { contract: payloadOf(c2B), baseVersion: b2._v } });
    ok(r2B.status === 409, 'B is refused as a version conflict (409)');
    const fresh2 = await B.client.json('/api/contracts/' + ID2);
    const keep2 = await B.client.raw('/api/contracts/' + ID2, { method: 'PUT', body: { contract: payloadOf(c2B), baseVersion: fresh2._v } });
    note('B "keep mine & save" with the rule OFF → ' + keep2.status);
    ok(keep2.status === 200, 'IT LANDS — with the rule off nothing guards the roster');
    const stored3 = await admin.json('/api/contracts/' + ID2);
    ok(String(stored3.desk.leadId) === String(B.user.id),
      'the desk lead was silently REPLACED: stored leadId=' + stored3.desk.leadId + ' (' + stored3.desk.leadName + ')');

    head('AND THE TWO CHANGES WERE BORN WITH THE SAME ID');
    ok(ch2A.id === ch2B.id,
      'negoNextId is per contract and per browser, so both first changes are ' + ch2A.id
      + ' — A\'s and B\'s are DIFFERENT asks wearing ONE id');
    ok(ch2A.hash !== ch2B.hash,
      'their fingerprints differ (' + String(ch2A.hash).slice(0, 12) + '… vs ' + String(ch2B.hash).slice(0, 12)
      + '…), so they are provably two different records, not one');
    const surv = (stored3.changes || []);
    note('stored changes: [' + surv.map(x => x.id + '/' + x.author + '/' + x.clauseLabel).join(' | ') + ']');
    ok(surv.length === 1 && surv[0].author === B.user.name && surv[0].hash === ch2B.hash,
      'exactly one survives and it is B\'s: ' + surv[0].id + ' by ' + surv[0].author + ' on ' + surv[0].clauseLabel);
    ok(!surv.some(x => x.hash === ch2A.hash),
      'A\'s ask (' + ch2A.clauseLabel + ', fingerprint ' + String(ch2A.hash).slice(0, 12) + '…) is not on the record at all');

    head('YARDSTICK — every recorded "yes" is in the outcome');
    const trail3 = (stored3.audit || []).map(a => a.action + ': ' + a.detail);
    const proposed = trail3.filter(t => /#CHG-001 proposed by/.test(t));
    proposed.forEach(t => note('audit | ' + t.slice(0, 150)));
    ok(proposed.length === 2,
      'the audit trail holds TWO "#CHG-001 proposed by" lines — two different authors, two different '
      + 'clauses, one id — while c.changes holds one');
    ok(/Asha/.test(proposed.join(' ')) && /Bram/.test(proposed.join(' ')),
      'and they name both people, so the record contradicts itself about what CHG-001 is');
    const said = trail3.filter(t => /Negotiation desk/i.test(t));
    said.forEach(t => note('audit | ' + t.slice(0, 140)));
    ok(said.length === 2,
      'BOTH desk-opening audit lines survive on the record (' + said.length + ') — two "Negotiation opened by" '
      + 'entries naming two different leads, while c.desk holds only the second');
    ok(!trail3.some(t => /replac|took over|overwrit|handover|not saved|dropped/i.test(t)),
      'nothing in the trail says the lead was replaced or that A\'s change was dropped');

    head('YARDSTICK — does the fingerprint chain notice?');
    const wCheck = browser({ id: A.user.id, name: A.user.name, role: 'legal', email: A.user.email },
      JSON.parse(JSON.stringify(stored3)), false);
    const v = await wCheck.win.verifyChangeChain(wCheck.win.state.contracts[0]);
    note('verifyChangeChain → ' + JSON.stringify(v));
    ok(v && v.ok === true,
      'the surviving record verifies clean — the chain is per-change and cannot see that a '
      + 'sibling CHG-001 ever existed');

  } finally {
    await h.stop();
  }
  console.log('\n---------------------------------------------');
  console.log('C6 desk claim race: ' + pass + ' pass, ' + fail + ' fail');
  process.exit(fail ? 1 : 0);
}

main().catch(e => { console.error('PROBE ERROR', e); process.exit(2); });
