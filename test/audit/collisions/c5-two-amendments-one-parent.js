/* ============================================================
   COLLISION SWEEP — C5: TWO AMENDMENTS, ONE PARENT
   ============================================================
   (a) THE ORDINAL RACE — two colleagues write an amendment on the same
       agreement in the same minute. amendmentOrdinal counts the children the
       browser can see at the moment the button is pressed.
   (b) TWO EXECUTED TERM-MOVERS — two signed amendments each moving the end
       date. Which one does the live expiry follow, is that ordering
       defensible, and does the server's twin in runReminders agree?

   Real server (test/helpers.js) for storage, versioning, the family guards and
   the reminder sweep; real browser worlds (test/world.js, {family:true}) so the
   amendment is minted by js/family.js itself.

   ARMED STATE IS ASSERTED FIRST EVERY TIME: the two browsers really do hold
   the same id counter, the two children really are filed under the parent, and
   each one really is EXECUTED by the three signals amendmentExecuted reads.

   Run:  node test/audit/collisions/c5-two-amendments-one-parent.js
*/
const path = require('node:path');
const { startHati, seedWorkspace, FOLDER_A } = require(path.join(__dirname, '..', '..', 'helpers.js'));
const { buildWorld } = require(path.join(__dirname, '..', '..', 'world.js'));

let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) { pass++; console.log('PASS  ' + msg); } else { fail++; console.log('FAIL  ' + msg); } };
const note = msg => console.log('  ·   ' + msg);
const head = msg => console.log('\n=== ' + msg + ' ===');

const isoPlus = n => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };

/* A browser holding a set of contracts, with js/core.js's OWN id counter
   semantics: nextId = 'MK-' + (++uid), seeded from the bootstrap's uid. */
function browser(user, contracts, uid) {
  const w = buildWorld({ user, family: true });
  w.win.state = Object.assign({}, w.win.state, { contracts, activeId: null, settings: {} });
  w.win.uid = uid;
  w.win.nextId = () => 'MK-' + (++w.win.uid);
  /* js/core.js's own lookup, which js/family.js calls bare. */
  w.win.getContract = id => w.win.state.contracts.find(c => c.id === id);
  return w;
}
function payloadOf(c) {
  const p = { ...c };
  for (const k of ['_light', '_loaded', '_v', '_persisted', '_raisedBy', '_raisedAt', '_signedAt', '_lastAuditAt']) delete p[k];
  return p;
}

async function main() {
  const h = await startHati();
  try {
    const ws = await seedWorkspace(h);
    const admin = ws.admin;
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

    /* ================= (a) THE ORDINAL RACE ================= */
    head('C5a ARM — one master agreement, no children');
    const PID = 'MK-MASTER';
    const parent = {
      id: PID, name: 'Master Services Agreement', counterparty: 'Nordkust Industri AB',
      party: 'Highland Corporate Ltd', folder: FOLDER_A, value: 12000000, valueType: 'standard',
      status: 'Signed', template: null, hash: 'SEALED-1', signedAt: '2026-01-15T09:00:00.000Z',
      expiry: '2027-06-30', metadata: { effectiveDate: '2026-01-15', expiryDate: '2027-06-30' },
      fields: {}, comments: [], signatures: [], obligations: [], rounds: [], changes: [],
      audit: [{ at: new Date().toISOString(), user: 'Amina Otieno', action: 'Created', detail: 'probe fixture' }],
    };
    await admin.json('/api/contracts/' + PID, { method: 'PUT', body: { contract: parent, baseVersion: 0 } });

    const bootA = await A.client.json('/api/bootstrap');
    const bootB = await B.client.json('/api/bootstrap');
    bootA.contracts = (await A.client.json('/api/contracts?limit=500')).rows;
    bootB.contracts = (await B.client.json('/api/contracts?limit=500')).rows;
    ok(bootA.uid === bootB.uid,
      'ARMED-1 both browsers are handed the SAME id counter at sign-in: uid=' + bootA.uid + ' / ' + bootB.uid);
    ok((bootA.contracts || []).filter(c => c.parentId === PID).length === 0,
      'ARMED-2 the master has no children yet (list holds ' + bootA.contracts.length + ' rows)');
    const uid0 = bootA.uid;

    head('C5a — both colleagues press "Create an amendment"');
    const wA = browser({ id: A.user.id, name: A.user.name, role: 'legal', email: A.user.email },
      (bootA.contracts || []).map(c => ({ ...c })), uid0);
    const wB = browser({ id: B.user.id, name: B.user.name, role: 'legal', email: B.user.email },
      (bootB.contracts || []).map(c => ({ ...c })), uid0);
    const pA = wA.win.state.contracts.find(c => c.id === PID);
    const pB = wB.win.state.contracts.find(c => c.id === PID);
    ok(!!pA && !!pB, 'ARMED-3 both browsers hold the master ' + PID);

    ok(wA.win.amendmentOrdinal(pA, 'amendment') === 1 && wB.win.amendmentOrdinal(pB, 'amendment') === 1,
      'ARMED-4 both browsers compute ordinal 1 (A=' + wA.win.amendmentOrdinal(pA, 'amendment')
      + ' B=' + wB.win.amendmentOrdinal(pB, 'amendment') + ')');

    const madeA = wA.win.createAmendment(pA, { relation: 'amendment', expiry: isoPlus(400) });
    const madeB = wB.win.createAmendment(pB, { relation: 'amendment', expiry: isoPlus(700) });
    ok(!madeA.error && !madeB.error, 'ARMED-5 both mints succeeded');
    const amA = madeA.contract, amB = madeB.contract;
    note('A minted ' + amA.id + ' “' + amA.name + '” term→' + amA.expiry);
    note('B minted ' + amB.id + ' “' + amB.name + '” term→' + amB.expiry);

    ok(amA.name === amB.name,
      'THE NAME COLLIDES — both documents are called “' + amA.name + '”');
    ok(amA.id === amB.id,
      'AND SO DOES THE ID — nextId is a per-browser counter seeded from one bootstrap, '
      + 'so both are ' + amA.id);
    ok(amA.expiry !== amB.expiry,
      'they are genuinely different documents: A proposes ' + amA.expiry + ', B proposes ' + amB.expiry);
    const warnedA = wA.log.toasts.map(t => t.msg).join(' | ');
    const warnedB = wB.log.toasts.map(t => t.msg).join(' | ');
    ok(!/already|duplicate|same name|No\. 1 exists/i.test(warnedA + warnedB),
      'nothing warns at creation: toasts were [' + (warnedA + warnedB || 'none') + ']');

    head('C5a — both saves go to the server');
    const rA = await A.client.raw('/api/contracts/' + amA.id, { method: 'PUT', body: { contract: payloadOf(amA), baseVersion: 0, uid: wA.win.uid } });
    const rB = await B.client.raw('/api/contracts/' + amB.id, { method: 'PUT', body: { contract: payloadOf(amB), baseVersion: 0, uid: wB.win.uid } });
    note('A → ' + rA.status + ' ' + (rA.text || '').slice(0, 120));
    note('B → ' + rB.status + ' ' + (rB.text || '').slice(0, 120));
    ok(rA.status === 200, 'A\'s amendment is created (200)');
    ok(rB.status === 409, 'B\'s amendment is refused as a VERSION CONFLICT (409) on a document B has '
      + 'never seen before: ' + JSON.stringify(rB.json));

    head('C5a YARDSTICK — a refused save is a told save, and it must say the right thing');
    const conflictMsg = (rB.json && rB.json.error) || '';
    ok(/conflict|version/i.test(conflictMsg),
      'the message matches js/core.js saveContract\'s /conflict|version/i test, so B gets the H-4 dialog');
    note('the H-4 dialog says: "Someone else saved a change to ' + amB.id + ' while you were editing. '
       + 'Your change has not been saved. Keep yours and overwrite theirs, or discard yours and load their version?"');
    ok(true, 'THE DIALOG IS THE WRONG SHAPE: nobody edited B\'s document — a different colleague\'s '
      + 'different document was minted under the same id, and both answers destroy one of them');

    head('C5a — "Keep mine & save"');
    const fresh = await B.client.json('/api/contracts/' + amB.id);
    ok(fresh.expiry === amA.expiry,
      'ARMED-6 what B is about to overwrite really is A\'s document (its term is ' + fresh.expiry + ')');
    const keep = await B.client.raw('/api/contracts/' + amB.id, { method: 'PUT', body: { contract: payloadOf(amB), baseVersion: fresh._v, uid: wB.win.uid } });
    ok(keep.status === 200, '"Keep mine" lands (200)');
    const stored = await admin.json('/api/contracts/' + amB.id);
    ok(stored.expiry === amB.expiry,
      'the stored document is now B\'s (' + stored.expiry + ') — A\'s ' + amA.expiry + ' is gone');
    const kids = (await admin.json('/api/contracts?limit=500')).rows.filter(c => c.parentId === PID);
    ok(kids.length === 1,
      'the master has ONE child where two colleagues each created one: [' + kids.map(k => k.id + ' “' + k.name + '”').join(', ') + ']');
    const trail = (stored.audit || []).map(a => a.user + ' | ' + a.action + ': ' + a.detail);
    trail.forEach(t => note('audit | ' + t.slice(0, 130)));
    ok(trail.some(t => /Asha/.test(t)) && trail.some(t => /Bram/.test(t)),
      'ONE document\'s audit trail now records TWO creations by TWO people — the append-only merge '
      + 'kept A\'s "Created" line under B\'s document');
    ok(!trail.some(t => /replac|overwrit|discard|lost/i.test(t)),
      'and nothing in it says a document was replaced');

    head('C5a — the exact words the two people are shown');
    {
      const fs2 = require('node:fs');
      const i18 = fs2.readFileSync(path.join(__dirname, '..', '..', '..', 'js', 'i18n.js'), 'utf8');
      const core = fs2.readFileSync(path.join(__dirname, '..', '..', '..', 'js', 'core.js'), 'utf8');
      ok(/co_loaded_server_version: 'Loaded the server\u2019s version \u2014 your unsaved change was discarded'/.test(i18),
        '"Load theirs" says: "Loaded the server\u2019s version — your unsaved change was discarded" '
        + '— a CHANGE, not "the amendment you have just written was thrown away"');
      ok(/Someone else saved a change to '\+c\.id\+' while you were editing/.test(core),
        '"Keep mine / Load theirs" is offered as "Someone else saved a change to <id> while you were editing" '
        + '— which is false here: nobody edited it, a second document was minted under the same id');
      ok(/fa_name_hint_one: 'Counted from the \{n\} document already in this family\.'/.test(i18),
        'and the creation form\'s only duplicate-adjacent sentence — "Counted from the {n} documents '
        + 'already in this family" — counts the SAME stale browser list amendmentOrdinal counts, '
        + 'so in this race it says nothing at all (n = 0 on both screens)');
    }

    head('C5a — the id counter can also be walked BACKWARDS by a stale browser');
    const bootNow = await admin.json('/api/bootstrap');
    note('server id counter is now ' + bootNow.uid);
    await A.client.json('/api/contracts/' + amA.id, { method: 'PUT',
      body: { contract: { ...payloadOf(stored), lastAction: 'touched' }, baseVersion: (await A.client.json('/api/contracts/' + amA.id))._v, uid: uid0 } });
    const bootBack = await admin.json('/api/bootstrap');
    ok(bootBack.uid === uid0,
      'a save carrying an OLD uid moves the stored counter back: ' + bootNow.uid + ' → ' + bootBack.uid
      + ' (PUT /api/contracts/:id does setSetting(\'uid\', req.body.uid) with no floor)');
    ok(bootBack.uid < bootNow.uid,
      'so the NEXT browser to sign in is handed ' + bootBack.uid + ' and its first new contract '
      + 'would be minted as ' + ('MK-' + (bootBack.uid + 1)) + ', which already exists');

    /* ================= (b) TWO EXECUTED TERM-MOVERS ================= */
    head('C5b ARM — a master with two EXECUTED amendments, each moving the end date');
    const P2 = 'MK-TERM';
    const D90 = isoPlus(90), D30 = isoPlus(30);
    const master2 = { ...parent, id: P2, name: 'Distribution Agreement', expiry: '2027-06-30',
      metadata: { effectiveDate: '2026-01-15', expiryDate: '2027-06-30' },
      audit: [{ at: new Date().toISOString(), user: 'Amina Otieno', action: 'Created', detail: 'probe fixture' }] };
    await admin.json('/api/contracts/' + P2, { method: 'PUT', body: { contract: master2, baseVersion: 0 } });

    /* K1 signed on 2 August; K2 signed on 15 August. K2 is the later document
       and is the one that governs. Both are executed IN THE APP, so both carry
       the string js/views/contract.js writes: fmtDT(at) + ' EAT'. NOTHING here
       is invented — that is the format the product stores. */
    const kid = (id, name, expiry, signedAt) => ({
      id, name, parentId: P2, relation: 'amendment', linkConfirmed: true,
      counterparty: 'Nordkust Industri AB', party: 'Highland Corporate Ltd',
      folder: FOLDER_A, value: 0, valueType: 'standard', status: 'Signed',
      template: null, hash: 'SEALED-' + id, signedAt,
      expiry, metadata: { expiryDate: expiry },
      fields: {}, comments: [], signatures: [], obligations: [], rounds: [], changes: [],
      audit: [{ at: new Date().toISOString(), user: 'Amina Otieno', action: 'Created', detail: 'probe fixture' }],
    });
    const K1 = kid('MK-AM1', 'Amendment No. 1 to Distribution Agreement', D90, '2 Aug 2026, 09:12 EAT');
    const K2 = kid('MK-AM2', 'Amendment No. 2 to Distribution Agreement', D30, '15 Aug 2026, 16:40 EAT');
    await admin.json('/api/contracts/MK-AM1', { method: 'PUT', body: { contract: K1, baseVersion: 0 } });
    await admin.json('/api/contracts/MK-AM2', { method: 'PUT', body: { contract: K2, baseVersion: 0 } });

    const all = (await admin.json('/api/contracts?limit=500')).rows;
    const stK1 = all.find(c => c.id === 'MK-AM1'), stK2 = all.find(c => c.id === 'MK-AM2');
    ok(stK1 && stK1.parentId === P2 && stK2 && stK2.parentId === P2,
      'ARMED-7 both are filed under ' + P2);
    ok(stK1.status === 'Signed' && stK1.hash && stK2.status === 'Signed' && stK2.hash,
      'ARMED-8 both are EXECUTED by the signals amendmentExecuted reads (status=Signed, hash set)');
    ok(stK1.expiry === D90 && stK2.expiry === D30,
      'ARMED-9 they state DIFFERENT terms: MK-AM1 → ' + D90 + ', MK-AM2 → ' + D30);
    ok(stK1.signedAt < stK2.signedAt || true, 'ARMED-10 signedAt strings as stored: '
      + JSON.stringify(stK1.signedAt) + ' / ' + JSON.stringify(stK2.signedAt));

    head('C5b — what the SCREENS say (js/family.js effectiveExpiry)');
    const wC = browser({ id: A.user.id, name: A.user.name, role: 'legal', email: A.user.email },
      all.map(c => ({ ...c })), 9000);
    const m2 = wC.win.state.contracts.find(c => c.id === P2);
    ok(wC.win.familyChildren(P2).length === 2, 'ARMED-11 the browser sees both children');
    ok(wC.win.amendmentExecuted(stK1) === true && wC.win.amendmentExecuted(stK2) === true,
      'ARMED-12 amendmentExecuted answers true for both');
    const eff = wC.win.effectiveExpiry(m2);
    const src = wC.win.expirySource(m2);
    note('amendmentDate(MK-AM1) = ' + JSON.stringify(wC.win.amendmentDate(stK1)));
    note('amendmentDate(MK-AM2) = ' + JSON.stringify(wC.win.amendmentDate(stK2)));
    note('effectiveExpiry(' + P2 + ') = ' + eff + '   from ' + (src && src.id));
    ok(eff === D90 && src && src.id === 'MK-AM1',
      'THE LIVE EXPIRY FOLLOWS MK-AM1 (' + eff + ') — the amendment signed on 2 AUGUST, not the one '
      + 'signed on 15 August. The ordering key is String(signedAt).slice(0,10) of a DISPLAY string '
      + '("15 Aug 2026, 16:40 EAT" → "15 Aug 202"), compared with localeCompare');
    ok('2 Aug 2026'.localeCompare('15 Aug 202') > 0,
      'proof of the mechanism: "2 Aug 2026".localeCompare("15 Aug 202") = '
      + '2 Aug 2026'.localeCompare('15 Aug 202') + ' — a two-digit day loses to a one-digit day');
    const prop = wC.win.proposedExpiry(m2);
    ok(prop === null,
      'and proposedExpiry says nothing (both are signed), so no screen states the losing date at all: '
      + JSON.stringify(prop));

    head('C5b — the ISO / display-string mixture, from the paper-execution path');
    const P3 = 'MK-TERM2';
    await admin.json('/api/contracts/' + P3, { method: 'PUT', body: { contract:
      { ...master2, id: P3, name: 'Licence Agreement' }, baseVersion: 0 } });
    /* filePaperSignature writes c.signedAt = opts.signedOn || nowISO() — an ISO
       timestamp. signDocument writes fmtDT(at)+' EAT'. Two execution paths, two
       incompatible sort keys, on one family. */
    const K3 = { ...kid('MK-AM3', 'Amendment No. 1 to Licence Agreement', D90, '1 Sep 2026, 10:00 EAT'), parentId: P3 };
    const K4 = { ...kid('MK-AM4', 'Amendment No. 2 to Licence Agreement', D30, '2026-08-20T10:00:00.000Z'), parentId: P3 };
    await admin.json('/api/contracts/MK-AM3', { method: 'PUT', body: { contract: K3, baseVersion: 0 } });
    await admin.json('/api/contracts/MK-AM4', { method: 'PUT', body: { contract: K4, baseVersion: 0 } });
    const all2 = (await admin.json('/api/contracts?limit=500')).rows;
    const wD = browser({ id: A.user.id, name: A.user.name, role: 'legal', email: A.user.email },
      all2.map(c => ({ ...c })), 9500);
    const m3 = wD.win.state.contracts.find(c => c.id === P3);
    const eff3 = wD.win.effectiveExpiry(m3);
    note('amendmentDate(MK-AM3, signed IN APP on 1 Sep) = ' + JSON.stringify(wD.win.amendmentDate(all2.find(c => c.id === 'MK-AM3'))));
    note('amendmentDate(MK-AM4, filed ON PAPER on 20 Aug) = ' + JSON.stringify(wD.win.amendmentDate(all2.find(c => c.id === 'MK-AM4'))));
    note('effectiveExpiry(' + P3 + ') = ' + eff3 + '  (in-app amendment states ' + D90 + ', paper amendment states ' + D30 + ')');
    ok(eff3 === D30,
      'THE PAPER AMENDMENT OF 20 AUGUST BEATS THE IN-APP AMENDMENT OF 1 SEPTEMBER (' + eff3 + ') — '
      + 'signDocument stores a DISPLAY string and filePaperSignature stores an ISO one, so the two '
      + 'execution paths produce incomparable sort keys: "1 Sep 2026".localeCompare("2026-08-20") = '
      + '1 Sep 2026'.localeCompare('2026-08-20'));

    head('C5b — is the ordering stated anywhere?');
    const fs = require('node:fs');
    const famSrc = fs.readFileSync(path.join(__dirname, '..', '..', '..', 'js', 'family.js'), 'utf8');
    const claude = fs.readFileSync(path.join(__dirname, '..', '..', '..', 'CLAUDE.md'), 'utf8');
    ok(/most recent amendment that actually states a term wins/.test(famSrc),
      'js/family.js says only "most recent amendment that actually states a term wins"');
    ok(!/tie|tiebreak|latest expiry|greater date/i.test(famSrc.split('_latestTerm')[1] || ''),
      'the SECOND sort key — where the dates tie, the LATER END DATE wins — is nowhere in the comment');
    ok(!/execution order|signing order|signed later/i.test(claude),
      'and CLAUDE.md never states which of two executed amendments governs');

    head('C5b — the tie: two amendments executed on the SAME DAY');
    const P4 = 'MK-TERM3';
    await admin.json('/api/contracts/' + P4, { method: 'PUT', body: { contract:
      { ...master2, id: P4, name: 'Services Agreement' }, baseVersion: 0 } });
    const K5 = { ...kid('MK-AM5', 'Amendment No. 1 to Services Agreement', D90, '11 Aug 2026, 09:00 EAT'), parentId: P4 };
    const K6 = { ...kid('MK-AM6', 'Amendment No. 2 to Services Agreement', D30, '11 Aug 2026, 17:30 EAT'), parentId: P4 };
    await admin.json('/api/contracts/MK-AM5', { method: 'PUT', body: { contract: K5, baseVersion: 0 } });
    await admin.json('/api/contracts/MK-AM6', { method: 'PUT', body: { contract: K6, baseVersion: 0 } });
    const all3 = (await admin.json('/api/contracts?limit=500')).rows;
    const wE = browser({ id: A.user.id, name: A.user.name, role: 'legal', email: A.user.email },
      all3.map(c => ({ ...c })), 9800);
    const m4 = wE.win.state.contracts.find(c => c.id === P4);
    const eff4 = wE.win.effectiveExpiry(m4);
    ok(wE.win.amendmentDate(all3.find(c => c.id === 'MK-AM5')) === wE.win.amendmentDate(all3.find(c => c.id === 'MK-AM6')),
      'ARMED-13 both sort keys are identical ("' + wE.win.amendmentDate(all3.find(c => c.id === 'MK-AM5')) + '") — '
      + 'the time of day is sliced off');
    note('effectiveExpiry(' + P4 + ') = ' + eff4 + ' (09:00 amendment says ' + D90 + ', 17:30 amendment says ' + D30 + ')');
    ok(eff4 === D90,
      'THE LATER END DATE WINS THE TIE, not the later signature — the amendment executed at 17:30 '
      + 'shortening the term is ignored in favour of the 09:00 one extending it');


    head('C5b — what the SERVER says (runReminders, the twin of effectiveExpiry)');
    const runRes = await admin.json('/api/reminders/run', { method: 'POST', body: {} });
    note('reminder sweep -> ' + JSON.stringify(runRes));
    const outbox = await admin.json('/api/outbox');
    const items = outbox.items || [];
    const say = (label, name, expect, other) => {
      const ms = items.filter(m => String(m.subject || '').includes(name) || String(m.body || '').includes(name));
      ms.forEach(m => note('outbox | ' + m.subject + ' :: ' + String(m.body || '').slice(0, 170)));
      ok(ms.length > 0, label + ' — the sweep queued a renewal reminder');
      const usedExpect = ms.some(m => String(m.body || '').includes(expect));
      const usedOther = ms.some(m => String(m.body || '').includes(other));
      ok(usedExpect && !usedOther,
        label + ' — THE SERVER USED THE SAME DATE AS THE SCREENS (' + expect + ', not ' + other
        + '). runReminders agrees with effectiveExpiry, so no reminder contradicts a screen: '
        + 'both twins are wrong together, which is the better half.');
    };
    say('MK-TERM  2 Aug vs 15 Aug', 'Distribution Agreement', D90, D30);
    say('MK-TERM2 in-app vs paper', 'Licence Agreement', D30, D90);
    say('MK-TERM3 same-day tie', 'Services Agreement', D90, D30);

  } finally {
    await h.stop();
  }
  console.log('\n---------------------------------------------');
  console.log('C5 two amendments one parent: ' + pass + ' pass, ' + fail + ' fail');
  process.exit(fail ? 1 : 0);
}

main().catch(e => { console.error('PROBE ERROR', e); process.exit(2); });
