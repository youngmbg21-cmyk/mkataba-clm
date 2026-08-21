/* J10 finding #3 — Webhooks out. Independent reproduction against a real
   server.

   AN HONEST NOTE ON WHAT COULD NOT BE CAPTURED LIVE, READ FIRST:
   This sandbox has NO outbound internet (curl to https://example.com
   returns a 403 from the environment's own proxy — verified below) and the
   product's own SSRF guard (ipIsPrivate / webhookGuardedLookup) correctly
   refuses every address reachable from inside this container: loopback,
   every RFC1918 range, the container's own Docker-bridge IP (172.16/12),
   and carrier-grade NAT (100.64/10). There is therefore NO address in this
   environment a real webhook delivery could land on — which is the guard
   doing exactly its job, not a limitation of the test. Because of this, the
   literal HTTP bytes of a delivered webhook (as they would appear on a
   customer's real receiving server) cannot be captured here. What CAN be,
   and is, proven live:
     - every registration-time refusal, exhaustively
     - the TRUE dynamic DNS-rebinding guard (webhookGuardedLookup), using a
       REAL public DNS name (127.0.0.1.nip.io) that resolves to a private
       address — a stronger and more realistic test than inserting a
       literal 127.0.0.1 URL, because a literal IP is caught by the STATIC
       text guard (webhookTargetOk) and never reaches the dynamic lookup
       path at all (see the note before that test, below)
     - that each of the four real product actions genuinely reaches
       webhookFire with real facts (the per-endpoint fails/lastStatus
       counters move on a real trigger and stay flat with no trigger)
     - the payload SHAPE and signature ALGORITHM, verified against the
       running server's actual source on disk (an independent re-check of
       the same claim the shipped f221 test makes, not a re-run of it)
     - everything else (admin-only, WEBHOOK_MAX, empty-events refusal,
       secret shown once, empty-secret refusal)
*/
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const http = require('node:http');
const dns = require('node:dns');
const fs = require('node:fs');
const path = require('node:path');
const { startHati, seedWorkspace, FOLDER_A } = require('../../helpers');

function isoInDays(n) {
  const d = new Date(); d.setUTCHours(0, 0, 0, 0); d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

(async () => {
  const results = [];
  const record = (name, ok, detail) => { results.push({ name, ok, detail }); console.log((ok ? 'PASS' : 'FAIL') + ' — ' + name, detail !== undefined ? JSON.stringify(detail).slice(0, 400) : ''); };
  const evidence = { environment: {}, registrationRefusals: [], dnsRebindingProbe: null, sourceVerification: {}, triggerProof: [] };

  // ---- confirm the "no outbound internet" premise, for the record ----
  try {
    const r = await fetch('https://example.com', { signal: AbortSignal.timeout(4000) });
    evidence.environment.outboundInternet = 'reachable (unexpected) status=' + r.status;
  } catch (e) {
    evidence.environment.outboundInternet = 'blocked: ' + String(e.message || e);
  }
  record('environment check: outbound internet to an arbitrary public host', true, evidence.environment.outboundInternet);

  // A real local sink, for the "nothing ever lands here" side of the proof.
  const got = [];
  const sink = http.createServer((req, res) => {
    let raw = ''; req.on('data', d => raw += d);
    req.on('end', () => { got.push({ url: req.url, headers: req.headers, raw }); res.writeHead(200); res.end('{}'); });
  });
  await new Promise(r => sink.listen(0, '127.0.0.1', r));
  const sinkPort = sink.address().port;

  const h = await startHati();
  try {
    const W = await seedWorkspace(h, { contracts: [] });

    // POST /api/webhooks carries its own rate limiter (rlHookAdd, 20/hour,
    // keyed per USER) — a real, deliberate control, and unrelated to the
    // SSRF matrix this script is exercising. To avoid tripping it (this
    // script alone makes far more than 20 registration attempts), spread
    // the calls across FRESH admin accounts, one per batch, each with its
    // own untouched bucket.
    let adminSeq = 0;
    const freshAdmin = async () => {
      adminSeq++;
      const email = `wh-admin-${adminSeq}@example.co.ke`;
      await W.admin.json('/api/users', { method: 'POST', body: { name: 'WH Admin ' + adminSeq, email, role: 'admin', password: 'temporary-pass-1' } });
      const c = h.client(email);
      await c.json('/api/login', { method: 'POST', body: { email, password: 'temporary-pass-1' } });
      await c.json('/api/password/change', { method: 'POST', body: { current: 'temporary-pass-1', password: 'wh-admin-pass-9' } });
      return c;
    };
    // POST /api/webhooks specifically carries rlHookAdd (20/hour per user) —
    // rotate to a fresh admin account every 15 POSTs so this script's own
    // volume of registration attempts never trips a real, deliberate,
    // unrelated rate limit. GET/DELETE are not rate-limited and read the
    // same workspace-wide table from any admin, so they stay on W.admin.
    let batchAdmin = await freshAdmin();
    let batchCount = 0;
    const postHook = async (body) => {
      if (batchCount >= 15) { batchAdmin = await freshAdmin(); batchCount = 0; }
      batchCount++;
      return batchAdmin.raw('/api/webhooks', { method: 'POST', body });
    };

    // ============================================================
    // PART A — registration-time SSRF matrix
    // ============================================================
    const refused = [
      'http://example.com/hook',                     // plain http
      'https://localhost/hook',
      'https://localhost./hook',                      // trailing dot — one-character bypass attempt
      'https://LOCALHOST/hook',                        // case
      'https://db.internal/hook',
      'https://db.internal./hook',
      'https://thing.local/hook',
      'https://127.0.0.1/hook',
      'https://10.0.0.5/hook',
      'https://172.16.4.4/hook',
      'https://192.168.1.10/hook',
      'https://169.254.169.254/latest/meta-data/',    // cloud metadata service
      'https://100.64.0.5/hook',                       // carrier-grade NAT
      'https://192.0.0.8/hook',                        // 192.0.0.0/24 IETF protocol assignments
      'https://198.18.0.5/hook',                       // benchmarking 198.18.0.0/15
      'https://198.19.9.9/hook',
      'https://192.88.99.1/hook',                      // 6to4 relay anycast
      'https://[::1]/hook',                            // IPv6 loopback
      'https://[fe80::1]/hook',                        // IPv6 link-local
      'https://[fc00::1]/hook',                        // IPv6 unique-local
      'https://[2002:7f00:1::]/hook',                  // 6to4 EMBEDDING 127.0.0.1
      'https://[2001:0:5ef5:79fd:0:59fc:0:1]/hook',    // Teredo
      'https://user:pass@example.com/hook',            // credentials in the URL
      'not-a-url',
    ];
    for (const url of refused) {
      const r = await postHook({ url, events: ['contract.signed'] });
      record('REFUSED at registration: ' + url, r.status === 400, { status: r.status, error: r.json && r.json.error });
      evidence.registrationRefusals.push({ url, status: r.status, error: r.json && r.json.error });
    }
    const afterRefusals = await W.admin.json('/api/webhooks');
    record('none of the refused addresses were stored', afterRefusals.webhooks.length === 0, afterRefusals.webhooks.length);

    // empty events list must be REFUSED, not "everything"
    const emptyEv = await postHook({ url: 'https://hooks.example.com/x' });
    record('EMPTY events list (field absent) is REFUSED at registration (fail closed)', emptyEv.status === 400, { status: emptyEv.status, error: emptyEv.json && emptyEv.json.error });
    const emptyEv2 = await postHook({ url: 'https://hooks.example.com/x', events: [] });
    record('EMPTY ARRAY events is likewise REFUSED', emptyEv2.status === 400, { status: emptyEv2.status });

    // admin-only
    for (const [label, cli] of [['unrestricted', W.unrestricted], ['novalues', W.novalues], ['restricted', W.restricted]]) {
      const listR = await cli.raw('/api/webhooks');
      const postR = await cli.raw('/api/webhooks', { method: 'POST', body: { url: 'https://hooks.example.com/x', events: ['contract.signed'] } }); // non-admins are refused before rlHookAdd even applies to them
      record('non-admin (' + label + ') refused GET /api/webhooks', listR.status === 403, listR.status);
      record('non-admin (' + label + ') refused POST /api/webhooks', postR.status === 403, postR.status);
    }

    // unknown event name dropped, not stored verbatim
    const junkEvR = await postHook({ url: 'https://hooks.example.com/junk-event', events: ['contract.signed', 'made.up.event'] });
    const junkEv = junkEvR.json;
    record('an unknown event name is DROPPED (never stored)', JSON.stringify(junkEv.webhook.events) === JSON.stringify(['contract.signed']), junkEv.webhook.events);
    await W.admin.json('/api/webhooks/' + junkEv.webhook.id, { method: 'DELETE' });

    // WEBHOOK_MAX ceiling
    const created = [];
    for (let i = 0; i < 20; i++) {
      const r = await postHook({ url: `https://hooks.example.com/n${i}`, events: ['contract.signed'] });
      created.push(r.json.webhook.id);
    }
    // the WEBHOOK_MAX check is a GLOBAL count in the handler, reached from a
    // FRESH admin (fresh rate-limit bucket) so this specifically exercises
    // the ceiling and not the unrelated per-user rate limit
    const overCap = await postHook({ url: 'https://hooks.example.com/one-too-many', events: ['contract.signed'] });
    record('the 21st endpoint is REFUSED — WEBHOOK_MAX=20 is enforced', overCap.status === 400, { status: overCap.status, error: overCap.json && overCap.json.error });
    for (const id of created) await W.admin.json('/api/webhooks/' + id, { method: 'DELETE' });

    // secret shown exactly once, never in the public shape
    const secRRaw = await postHook({ url: 'https://hooks.example.com/secret-test', events: ['contract.signed'] });
    const secR = secRRaw.json;
    record('a real secret is handed over on registration', !!(secR.secret && secR.secret.length >= 24), secR.secret ? secR.secret.length : null);
    const list1 = await W.admin.json('/api/webhooks');
    record('the secret NEVER appears again in the list', !JSON.stringify(list1).includes(secR.secret), true);
    await W.admin.json('/api/webhooks/' + secR.webhook.id, { method: 'DELETE' });

    // ============================================================
    // PART B — THE TRUE DYNAMIC DNS-REBINDING GUARD, exercised for real
    // ============================================================
    // "127.0.0.1.nip.io" is a REAL, public wildcard-DNS name that resolves
    // to 127.0.0.1 wherever it is looked up — used in the wild to test
    // exactly this class of guard. It is NOT a literal IP (IP_LITERAL is
    // false for it), so at REGISTRATION it must be ACCEPTED — the static
    // text guard has nothing to refuse it on. At SEND TIME the real DNS
    // lookup resolves it to 127.0.0.1 and webhookGuardedLookup must refuse
    // the CONNECTION. This is the scenario the code's own comments describe
    // ("a hostname that resolved publicly when it was registered can
    // resolve to 127.0.0.1 tomorrow") — proven here with a genuine DNS
    // lookup, not a mocked one.
    let dnsWorks = false;
    try { await new Promise((res, rej) => dns.lookup('127.0.0.1.nip.io', (e, a) => e ? rej(e) : res(a))); dnsWorks = true; } catch (_) {}
    record('DNS resolution to the public rebinding-test domain works from this sandbox', dnsWorks, dnsWorks);

    if (dnsWorks) {
      const rebindUrl = `https://127.0.0.1.nip.io:${sinkPort}/hook`;
      const regR = await postHook({ url: rebindUrl, events: ['contract.signed'] });
      record('a NAME that resolves privately is ACCEPTED at REGISTRATION (the static guard cannot see DNS)', regR.status === 200, { status: regR.status, body: regR.json });
      if (regR.status === 200) {
        const beforeCount = got.length;
        // trigger a real contract.signed
        await W.admin.json('/api/contracts/MK-REBIND', { method: 'PUT', body: { contract: {
          id: 'MK-REBIND', name: 'Rebind Probe', counterparty: 'X', folder: FOLDER_A, status: 'Draft',
          fields: {}, metadata: {}, obligations: [], audit: [], rounds: [], versions: [], signatures: [], comments: [] } } });
        const rb = await W.admin.json('/api/contracts/MK-REBIND');
        const rbv = rb._v; delete rb._v; rb.status = 'Signed'; rb.signatures = [{ by: 'X' }];
        await W.admin.json('/api/contracts/MK-REBIND', { method: 'PUT', body: { contract: rb, baseVersion: rbv } });
        await new Promise(r => setTimeout(r, 900));
        const rebindRow = (await W.admin.json('/api/webhooks')).webhooks.find(w => w.id === regR.json.webhook.id);
        record('AT SEND TIME the resolved-private address is REFUSED — the DYNAMIC lookup guard fires for real', rebindRow && rebindRow.lastOk === false, rebindRow);
        record('...and NOTHING reached the sink (real DNS resolution, real refusal, zero delivery)', got.length === beforeCount, { before: beforeCount, after: got.length });
        evidence.dnsRebindingProbe = { url: rebindUrl, registrationStatus: regR.status, rowAfterTrigger: rebindRow, sinkHitsGained: got.length - beforeCount };
        await W.admin.json('/api/webhooks/' + regR.json.webhook.id, { method: 'DELETE' });
      }
    } else {
      console.log('SKIPPED: DNS-rebinding live probe (no DNS resolution available in this sandbox)');
    }

    // ============================================================
    // PART C — all four real product actions genuinely reach webhookFire.
    // Four SEPARATE endpoints, each subscribed to exactly ONE event and
    // pointed at a refused loopback address (matching the shipped test's
    // own pattern — inserted straight into SQLite, since a raw 127.0.0.1
    // URL is refused even at registration). A trigger must move that ONE
    // row's counters and no other row's — proving each event kind reaches
    // the fire path with its OWN kind, not a leak of every kind to every
    // row (which is exactly the "empty list means everything" fault this
    // feature was built to close).
    // ============================================================
    const { DatabaseSync } = require('node:sqlite');
    const dbFile = path.join(h.dataDir, 'hati.db');
    const EVENTS = ['contract.signed', 'round.received', 'obligation.due', 'intake.requested'];
    const rowIds = {};
    {
      const rawDb = new DatabaseSync(dbFile);
      for (const kind of EVENTS) {
        const id = 'wh_j10_' + kind.replace('.', '_');
        rowIds[kind] = id;
        rawDb.prepare(`INSERT INTO webhooks (id,url,secret,events,active,created_by,created_at)
          VALUES (?,?,?,?,1,'j10',?)`).run(id, `https://127.0.0.1:${sinkPort}/${kind}`, 'j10-secret-' + kind, JSON.stringify([kind]), new Date().toISOString());
      }
      rawDb.close();
    }

    const snapshot = async () => {
      const list = (await W.admin.json('/api/webhooks')).webhooks;
      const m = {}; for (const kind of EVENTS) m[kind] = list.find(w => w.id === rowIds[kind]);
      return m;
    };
    const before = await snapshot();

    // 1) contract.signed
    await W.admin.json('/api/contracts/MK-WH-1', { method: 'PUT', body: { contract: {
      id: 'MK-WH-1', name: 'Some Counterparty Identity Ltd', counterparty: 'Some Counterparty Identity Ltd',
      folder: FOLDER_A, status: 'Draft', value: 100000, valueType: 'standard',
      fields: {}, metadata: {}, obligations: [], audit: [], rounds: [], versions: [], signatures: [], comments: [] } } });
    const draft = await W.admin.json('/api/contracts/MK-WH-1');
    const dv = draft._v; delete draft._v; draft.status = 'Signed'; draft.signatures = [{ by: 'Amina Otieno', at: new Date().toISOString() }];
    await W.admin.json('/api/contracts/MK-WH-1', { method: 'PUT', body: { contract: draft, baseVersion: dv } });

    // 2) round.received — its OWN, never-signed contract (a signed/executed
    // contract refuses this route with 409 — nothing to do with webhooks,
    // that guard belongs to a different feature and was just a scripting
    // mistake to trip over here) — mint a negotiate link, respond
    await W.admin.json('/api/contracts/MK-WH-3', { method: 'PUT', body: { contract: {
      id: 'MK-WH-3', name: 'Round Received Probe', counterparty: 'CP MD Co', folder: FOLDER_A,
      status: 'Under Review', fields: {}, metadata: {}, obligations: [], audit: [], rounds: [],
      versions: [], signatures: [], comments: [] } } });
    const share = await W.admin.json('/api/shares', { method: 'POST', body: {
      payload: { kind: 'hati-share', purpose: 'negotiate', purposeChosen: 'negotiate',
        org: 'Highland Corporate Ltd', sharedBy: 'Amina Otieno', at: new Date().toISOString(),
        contract: { id: 'MK-WH-3', name: 'Round Received Probe', docText: 'Article 1\n\nWording.' } },
      channel: 'email', durable: true, purpose: 'negotiate',
      recipient: { name: 'CP MD', email: 'cpmd@example.co.ke' }, expiryDays: 7 } });
    const anon = h.client('cpmd-anon');
    const respondR = await anon.raw('/api/shares/' + share.token + '/respond', { method: 'POST', body: {
      kind: 'hati-response', id: 'MK-WH-3', action: 'accept', name: 'CP MD' } });
    record('round.received TRIGGER: the counterparty response route accepted it', respondR.status === 200, { status: respondR.status, body: respondR.json });

    // 3) obligation.due — its OWN contract, an obligation due TODAY,
    // resolvable assignee, then force the sweep
    // status starts as Draft and is flipped to Signed in a SECOND save,
    // deliberately — creating a contract already-Signed in one save ALSO
    // counts as a signing event (prev is null, null !== 'Signed'), which
    // would be a second, unrelated contract.signed firing and muddy the
    // "each row only reacts to its own kind" check below.
    await W.admin.json('/api/contracts/MK-WH-4', { method: 'PUT', body: { contract: {
      id: 'MK-WH-4', name: 'Obligation Due Probe', counterparty: 'X', folder: FOLDER_A,
      status: 'Draft', fields: {}, metadata: {}, obligations: [], audit: [], rounds: [],
      versions: [], signatures: [], comments: [] } } });
    const ob4 = await W.admin.json('/api/contracts/MK-WH-4');
    const ob4v = ob4._v; delete ob4._v; ob4.status = 'Signed'; ob4.signatures = [{ by: 'X' }];
    ob4.obligations = [{ id: 'ob-wh-1', desc: 'Quarterly compliance report', due: isoInDays(0), status: 'open', assignee: 'admin@example.co.ke' }];
    await W.admin.json('/api/contracts/MK-WH-4', { method: 'PUT', body: { contract: ob4, baseVersion: ob4v } });
    const sweepResult = await W.admin.json('/api/reminders/run', { method: 'POST' });
    record('obligation.due TRIGGER: runReminders() executed', !!sweepResult, sweepResult);

    // 4) intake.requested
    await W.admin.json('/api/users', { method: 'POST', body: { name: 'WH Viewer', email: 'whviewer@example.co.ke', role: 'viewer', password: 'temporary-pass-1' } });
    const wv2 = h.client('whviewer');
    await wv2.json('/api/login', { method: 'POST', body: { email: 'whviewer@example.co.ke', password: 'temporary-pass-1' } });
    await wv2.json('/api/password/change', { method: 'POST', body: { current: 'temporary-pass-1', password: 'wv2-pass-9' } });
    const intakeR = await wv2.json('/api/intake', { method: 'POST', body: {
      title: 'A confidential thing only a Viewer typed', need: 'testing webhook payload allow-list' } });
    record('intake.requested TRIGGER: the request was created', !!intakeR.ok, intakeR.request && intakeR.request.id);

    await new Promise(r => setTimeout(r, 1200)); // let every fire-and-forget queue settle
    const after = await snapshot();

    for (const kind of EVENTS) {
      const b = before[kind], a = after[kind];
      const moved = a && (a.lastAt !== (b && b.lastAt)) && a.fails > (b ? b.fails : 0);
      record('EVENT FIRED FOR REAL: ' + kind + ' (its own endpoint\'s counters moved, refused for the right reason)', moved && /address refused/.test(a.lastStatus || ''), { before: b, after: a });
      evidence.triggerProof.push({ kind, before: b, after: a });
    }
    // and NOTHING landed on the real sink for any of the four
    record('across all four triggers, the real HTTP sink received ZERO requests (guard holds for every kind)', got.length === 0, got.length);

    // and NO CROSS-CONTAMINATION: an endpoint subscribed to ONLY
    // contract.signed must not have moved when round.received/etc fired
    // — already implied by the per-kind check above (its OWN row moved
    // only from its OWN trigger), but state it explicitly for one pair.
    const signedRowFails = after['contract.signed'].fails; // expect 2: MK-WH-1 AND MK-WH-4 both transition to Signed
    const roundRowFailsBeforeAnyRoundEvent = before['round.received'].fails; // 0
    record('the contract.signed endpoint fired exactly twice (MK-WH-1 + MK-WH-4 signing) and NOT for round.received/obligation.due/intake.requested (each row keyed to its own kind)', signedRowFails === 2, { signedRowFails });

    // ============================================================
    // PART D — payload shape + signature, verified against the RUNNING
    // server's actual source on disk (independent of, and not trusting,
    // the shipped f221 test file).
    // ============================================================
    const srv = fs.readFileSync(path.join(__dirname, '..', '..', '..', 'server', 'server.js'), 'utf8');
    const fires = srv.match(/webhookQueue\('[^']+',\s*\(\)\s*=>\s*\(\{[^}]*\}\)/g) || [];
    record('exactly four webhookQueue(...) call sites exist in the running server', fires.length === 4, fires.map(f => f.slice(0, 60)));
    const ALLOWED_DATA = new Set(['contractId', 'requestId', 'obligationId', 'status', 'due', 'action']);
    const seenKeys = {};
    for (const f of fires) {
      const kindMatch = f.match(/webhookQueue\('([^']+)'/);
      const kind = kindMatch ? kindMatch[1] : '?';
      const keys = [...f.matchAll(/([A-Za-z_][A-Za-z0-9_]*)\s*:/g)].map(m => m[1]);
      seenKeys[kind] = keys;
      const bad = keys.filter(k => !ALLOWED_DATA.has(k));
      record('payload keys for ' + kind + ' are ids/states ONLY (allow-list, independently checked)', bad.length === 0 && keys.length > 0, keys);
      record('  ...specifically NEVER a contract name or intake title key', !keys.includes('name') && !keys.includes('title'), keys);
    }
    evidence.sourceVerification.payloadKeysByEvent = seenKeys;

    const fireFn = srv.slice(srv.indexOf('async function webhookFire'), srv.indexOf('/* Fire-and-forget'));
    const sigMatch = fireFn.match(/createHmac\('sha256', r\.secret\)\.update\(at \+ '\.' \+ body\)/);
    record('signature = HMAC-SHA256(secret, timestamp + "." + body) — verified against the live server binary on disk', !!sigMatch, !!sigMatch);
    record('X-HaTi-Timestamp / X-HaTi-Delivery headers are set in the fire function', /'X-HaTi-Timestamp': at/.test(fireFn) && /'X-HaTi-Delivery': delivery/.test(fireFn), true);
    record('an empty secret is refused BEFORE signing (never signs with nothing)', /if \(!r\.secret\)/.test(fireFn), true);

    // Confirm the "empty secret refused" claim LIVE too (not just source):
    {
      const rawDb = new DatabaseSync(dbFile);
      rawDb.prepare(`INSERT INTO webhooks (id,url,secret,events,active,created_by,created_at)
        VALUES ('wh_j10_nosecret','https://127.0.0.1:${sinkPort}/nosecret','',?,1,'j10',?)`)
        .run(JSON.stringify(['contract.signed']), new Date().toISOString());
      rawDb.close();
    }
    await W.admin.json('/api/contracts/MK-WH-2', { method: 'PUT', body: { contract: {
      id: 'MK-WH-2', name: 'Second', counterparty: 'X', folder: FOLDER_A, status: 'Draft',
      fields: {}, metadata: {}, obligations: [], audit: [], rounds: [], versions: [], signatures: [], comments: [] } } });
    const d2 = await W.admin.json('/api/contracts/MK-WH-2');
    const d2v = d2._v; delete d2._v; d2.status = 'Signed'; d2.signatures = [{ by: 'X' }];
    await W.admin.json('/api/contracts/MK-WH-2', { method: 'PUT', body: { contract: d2, baseVersion: d2v } });
    await new Promise(r => setTimeout(r, 800));
    const nosecretRow = (await W.admin.json('/api/webhooks')).webhooks.find(w => w.id === 'wh_j10_nosecret');
    record('LIVE: an empty-secret endpoint is refused with "no signing secret" and gets nothing delivered', nosecretRow && /no signing secret/.test(nosecretRow.lastStatus || ''), nosecretRow);
    record('LIVE: and the sink genuinely received nothing for it', got.filter(g => g.url === '/nosecret').length === 0, true);

  } catch (e) {
    console.error('SCRIPT ERROR', e);
    results.push({ name: 'SCRIPT CRASHED', ok: false, detail: String(e && e.stack || e) });
  } finally {
    await h.stop();
    await new Promise(r => sink.close(r));
  }

  fs.writeFileSync(path.join(__dirname, 'webhook-payloads.json'), JSON.stringify(evidence, null, 2));

  const fails = results.filter(r => !r.ok);
  console.log('\n=== WEBHOOKS SUMMARY ===');
  console.log(results.length + ' checks, ' + fails.length + ' failed');
  if (fails.length) { fails.forEach(f => console.log('  FAIL: ' + f.name)); process.exitCode = 1; }
})();
