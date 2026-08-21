/* J10 finding #4 — Copilot spend by person, and the workspace ceiling.
   Independent reproduction against a real server (with the Anthropic stand-in
   the test harness wires up — real HTTP round trips to a local stub, real
   token/cost accounting, no network egress). */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { startHati, seedWorkspace } = require('../../helpers');

(async () => {
  const results = [];
  const record = (name, ok, detail) => { results.push({ name, ok, detail }); console.log((ok ? 'PASS' : 'FAIL') + ' — ' + name, detail !== undefined ? JSON.stringify(detail).slice(0, 400) : ''); };

  const h = await startHati();
  try {
    const W = await seedWorkspace(h, { contracts: [] });

    // ============================================================
    // A — the AI key must be configured for /api/ai/* routes to run at all
    // ============================================================
    await W.admin.json('/api/ai/config', { method: 'PUT', body: { key: 'test-key-not-real' } });

    // ============================================================
    // B — an INDEPENDENT source-level walk of every metered call site,
    // exactly as the shipped f203 test does but performed here fresh: every
    // `await anthropicMessages(...)`/`...Stream(...)` call must pass a
    // `who:` (or forward a `meter.who`, as the shared playbook forwarder
    // does).
    // ============================================================
    const srv = fs.readFileSync(path.join(__dirname, '..', '..', '..', 'server', 'server.js'), 'utf8');
    // find every `await anthropicMessages(` / `await anthropicMessagesStream(`
    // CALL (not the function definitions, not comments mentioning the name)
    const lines = srv.split('\n');
    const callSites = [];
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      if (/await\s+anthropicMessages(Stream)?\(/.test(l) && !/^\s*\/\//.test(l.trim())) {
        // capture this line plus the next 2, since some calls wrap across lines
        callSites.push({ line: i + 1, text: lines.slice(i, i + 20).join(' ') });
      }
    }
    record('call sites found', callSites.length > 0, { count: callSites.length, lines: callSites.map(c => c.line) });
    let missingWho = [];
    for (const site of callSites) {
      const hasWho = /who\s*:\s*aiWho\(req\)/.test(site.text) || /who\s*:\s*\(meter\s*&&\s*meter\.who\)/.test(site.text) || /who\s*:\s*meter\.who/.test(site.text);
      if (!hasWho) missingWho.push(site);
    }
    record('EVERY metered call site names a person (who: aiWho(req), or forwards meter.who)', missingWho.length === 0, { total: callSites.length, missing: missingWho.map(s => ({ line: s.line, text: s.text.slice(0, 200) })) });

    // ============================================================
    // C — Phase 2 (a per-person daily CAP) is deliberately NOT built
    // ============================================================
    const grepDir = (root) => {
      const out = [];
      const stack = [root];
      while (stack.length) {
        const cur = stack.pop();
        for (const entry of fs.readdirSync(cur, { withFileTypes: true })) {
          const full = path.join(cur, entry.name);
          if (entry.isDirectory()) { if (entry.name !== 'node_modules') stack.push(full); }
          else if (entry.isFile() && (entry.name.endsWith('.js'))) {
            const text = fs.readFileSync(full, 'utf8');
            if (text.includes('copilotCap')) out.push(full);
          }
        }
      }
      return out;
    };
    const root = path.join(__dirname, '..', '..', '..');
    const capFiles = [...grepDir(path.join(root, 'server')), ...grepDir(path.join(root, 'js'))];
    record('Phase 2 (per-person daily copilotCap) is NOT built anywhere in server/ or js/', capFiles.length === 0, capFiles);

    // ============================================================
    // D — two different members set off real Copilot calls; two lines,
    // ledgers agree.
    // ============================================================
    await W.admin.json('/api/users', { method: 'POST', body: { name: 'Chat User Two', email: 'chatuser2@example.co.ke', role: 'legal', password: 'temporary-pass-1' } });
    const u2 = h.client('chatuser2');
    await u2.json('/api/login', { method: 'POST', body: { email: 'chatuser2@example.co.ke', password: 'temporary-pass-1' } });
    await u2.json('/api/password/change', { method: 'POST', body: { current: 'temporary-pass-1', password: 'chatuser2-pass-9' } });

    const spend0 = await W.admin.json('/api/ai/spend');
    record('BEFORE: today\'s spend ledger', true, spend0);

    // W.admin's Copilot chat call
    const chat1 = await W.admin.raw('/api/ai/chat', { method: 'POST', body: {
      messages: [{ role: 'user', content: 'What is the counterparty on our first contract?' }] } });
    record('admin\'s chat call succeeded', chat1.status === 200, { status: chat1.status, body: chat1.status !== 200 ? chat1.json : undefined });

    // chatuser2's Copilot chat call
    const chat2 = await u2.raw('/api/ai/chat', { method: 'POST', body: {
      messages: [{ role: 'user', content: 'Summarise our portfolio risk.' }] } });
    record('chatuser2\'s chat call succeeded', chat2.status === 200, { status: chat2.status, body: chat2.status !== 200 ? chat2.json : undefined });

    const spend1 = await W.admin.json('/api/ai/spend');
    // NOTE: /api/ai/spend's byFeature is an ARRAY of {feature,...} rows;
    // /api/ai/usage's byFeature (used elsewhere) is a DICT keyed by feature
    // name — two different shapes under the same field name on two related
    // routes. Not a correctness bug (each is internally consistent and
    // presumably read by client code that knows its own shape), but worth
    // noting; handled explicitly here rather than assumed.
    const chatRow0 = (spend0.byFeature || []).find(f => f.feature === 'chat');
    const chatRow1 = (spend1.byFeature || []).find(f => f.feature === 'chat');
    record('AFTER: byFeature chat row requests increased (a 5-step tool loop per chat call, since the stub never happens to pick deliver_answer first)', !!chatRow1 && chatRow1.requests === ((chatRow0 ? chatRow0.requests : 0) + 10), { before: chatRow0, after: chatRow1 });

    const boot1 = await W.admin.json('/api/bootstrap');
    const adminId = boot1.me.id;
    const boot2 = await u2.json('/api/bootstrap');
    const u2Id = boot2.me.id;

    // *** byPerson does NOT live on /api/ai/spend at all (see Finding H
    // below) — it lives on GET /api/ai/config's `spend` field, which is
    // aiSpendToday() verbatim. That is the ONLY place in the product that
    // currently carries it, so that is what "the per-person ledger" has to
    // mean here and is read from below. ***
    const cfgAfter = await W.admin.json('/api/ai/config');
    const byPerson = cfgAfter.spend.byPerson || [];
    const adminLine = byPerson.find(p => p.userId === adminId);
    const u2Line = byPerson.find(p => p.userId === u2Id);
    record('TWO DIFFERENT MEMBERS LAND ON TWO SEPARATE LINES (read via GET /api/ai/config\'s spend.byPerson)', !!adminLine && !!u2Line && adminLine.userId !== u2Line.userId, { adminLine, u2Line });
    // 5 requests each: the tool loop takes 5 real Anthropic round trips before
    // giving up (the AI stub never happens to hand back deliver_answer first),
    // and EVERY one of those 5 is metered with the SAME who — proving the loop
    // doesn't lose attribution partway through, only that it isn't "1 press = 1 request".
    record('each line shows exactly 5 requests (their own call\'s whole tool loop, not the other member\'s)', adminLine && adminLine.requests === 5 && u2Line && u2Line.requests === 5, { adminRequests: adminLine && adminLine.requests, u2Requests: u2Line && u2Line.requests });

    // THE TWO LEDGERS AGREE (byFeature.chat from /api/ai/spend vs byPerson sum
    // from /api/ai/config — different routes, same underlying ai_spend /
    // ai_spend_user tables, so they must add up to the same numbers)
    const perPersonReqSum = byPerson.reduce((t, p) => t + p.requests, 0);
    const chatReq = chatRow1 ? chatRow1.requests : null;
    record('byFeature chat requests (from /api/ai/spend) === sum of byPerson.requests (from /api/ai/config) — same calls, two ledgers, agreeing', chatReq === perPersonReqSum, { chatRequests: chatReq, perPersonSum: perPersonReqSum });
    const perPersonCostSum = byPerson.reduce((t, p) => t + p.cost, 0);
    record('sum(byPerson.cost) ~= workspace total cost (nothing unattributed here — every call was a real member)', Math.abs(perPersonCostSum - spend1.total) < 1e-9, { perPersonCostSum, workspaceTotal: spend1.total, unattributed: cfgAfter.spend.unattributed });
    record('unattributed is a NUMBER (a figure), not absent/undefined', typeof cfgAfter.spend.unattributed === 'number', cfgAfter.spend.unattributed);
    record('...and it is ~0 here, because every metered route in this build requires auth (see below)', Math.abs(cfgAfter.spend.unattributed) < 1e-9, cfgAfter.spend.unattributed);

    // ============================================================
    // E — WHY unattributed cannot be driven positive through any LIVE path
    // in this build: every one of the metered routes requires `auth`.
    // ============================================================
    const AI_ROUTES = ['/api/ai/search', '/api/ai/graph', '/api/ai/ocr', '/api/ai/template',
      '/api/ai/extract', '/api/ai/blanks', '/api/ai/obligations', '/api/ai/brief',
      '/api/ai/renewal', '/api/ai/playbook', '/api/ai/chat', '/api/ai/chat/stream',
      '/api/templates/upload'];
    const notAuthed = [];
    for (const route of AI_ROUTES) {
      const re = new RegExp("app\\.(post|get)\\('" + route.replace(/\//g, '\\/') + "',\\s*auth,");
      if (!re.test(srv)) notAuthed.push(route);
    }
    record('every metered route requires `auth` (so req.user is always set — this is WHY unattributed cannot be exercised live today, matching the shipped test\'s own admission)', notAuthed.length === 0, notAuthed);

    // ============================================================
    // F — /api/ai/spend is admin-only; /api/ai/usage is not
    // ============================================================
    const spendAsNonAdmin = await u2.raw('/api/ai/spend');
    record('/api/ai/spend refuses a non-admin', spendAsNonAdmin.status === 403, spendAsNonAdmin.status);
    const spendAsAdmin = await W.admin.raw('/api/ai/spend');
    record('/api/ai/spend allows the admin', spendAsAdmin.status === 200, spendAsAdmin.status);
    const usageAsNonAdmin = await u2.raw('/api/ai/usage');
    record('/api/ai/usage is OPEN to a non-admin member (the sidebar figure)', usageAsNonAdmin.status === 200, usageAsNonAdmin.status);
    for (const [label, cli] of [['restricted', W.restricted], ['novalues', W.novalues]]) {
      const r = await cli.raw('/api/ai/spend');
      record('/api/ai/spend refuses ' + label + ' too', r.status === 403, r.status);
    }

    // ============================================================
    // G — exercise the workspace spend ceiling: set it very low, prove
    // Copilot is refused IN WORDS once reached.
    // ============================================================
    // 0.000001 would ROUND TO 0 under the route's 1e4 money precision — and
    // 0 means "disabled", the opposite of what is wanted here. 0.001 survives
    // the rounding and is comfortably below what the two chat calls above
    // (10 metered requests total) have already spent.
    await W.admin.json('/api/ai/config', { method: 'PUT', body: { dailySpendLimit: 0.001 } });
    const overCeiling = await W.admin.raw('/api/ai/chat', { method: 'POST', body: { messages: [{ role: 'user', content: 'One more, please.' }] } });
    record('WORKSPACE SPEND CEILING: refused with 429 once reached', overCeiling.status === 429, { status: overCeiling.status, body: overCeiling.json });
    record('...and the refusal IS IN WORDS naming the remedy (an admin must raise the budget)', overCeiling.json && /admin needs to raise the budget/i.test(overCeiling.json.error || ''), overCeiling.json && overCeiling.json.error);
    record('...retryAfter is set', overCeiling.json && !!overCeiling.json.retryAfter, overCeiling.json && overCeiling.json.retryAfter);

    // restore a sane ceiling and confirm it works again
    await W.admin.json('/api/ai/config', { method: 'PUT', body: { dailySpendLimit: 100 } });
    const afterRaise = await W.admin.raw('/api/ai/chat', { method: 'POST', body: { messages: [{ role: 'user', content: 'Back to normal.' }] } });
    record('raising the ceiling lets Copilot answer again', afterRaise.status === 200, afterRaise.status);

    // ============================================================
    // H — *** FINDING ***: the per-person breakdown is disclosed through a
    // SECOND, NON-ADMIN-GATED route. GET /api/ai/config carries `spend:
    // aiSpendToday()`, which includes byPerson/unattributed exactly like
    // aiSpendToday() does — but /api/ai/config requires only `auth`, no
    // `admin`. And it is not a theoretical curl target: js/views/contract.js
    // line ~1248 fetches it into state.aiCfg for EVERY role that can open a
    // contract (Viewers included — Viewers can read contracts). So a plain
    // Viewer, the lowest-privilege role in the product ("read-only access"),
    // can see every named colleague's Copilot spend for the day.
    // ============================================================
    await W.admin.json('/api/users', { method: 'POST', body: { name: 'Plain Viewer', email: 'plainviewer@example.co.ke', role: 'viewer', password: 'temporary-pass-1' } });
    const plainViewer = h.client('plainviewer');
    await plainViewer.json('/api/login', { method: 'POST', body: { email: 'plainviewer@example.co.ke', password: 'temporary-pass-1' } });
    await plainViewer.json('/api/password/change', { method: 'POST', body: { current: 'temporary-pass-1', password: 'viewer-pass-9' } });

    const viewerSpendR = await plainViewer.raw('/api/ai/spend');
    record('control: /api/ai/spend correctly refuses the Viewer (this route IS properly admin-gated)', viewerSpendR.status === 403, viewerSpendR.status);

    const viewerCfgR = await plainViewer.raw('/api/ai/config');
    record('*** FINDING *** GET /api/ai/config is answered for a plain VIEWER (200, not 403)', viewerCfgR.status === 200, viewerCfgR.status);
    const leakedPeople = viewerCfgR.json && viewerCfgR.json.spend && viewerCfgR.json.spend.byPerson;
    record('*** FINDING *** ...and its `spend.byPerson` array is populated with named colleagues\' individual Copilot spend, visible to the Viewer', Array.isArray(leakedPeople) && leakedPeople.length >= 2 && leakedPeople.every(p => p.name && typeof p.cost === 'number'), leakedPeople);
    const adminSpendR = await W.admin.json('/api/ai/spend');
    record('*** FINDING *** meanwhile the PROPERLY admin-gated route (/api/ai/spend) carries no byPerson key AT ALL — the per-person data was simply never added there', !('byPerson' in adminSpendR) && !('unattributed' in adminSpendR), Object.keys(adminSpendR));
    const adminCfgR = await W.admin.json('/api/ai/config');
    record('*** FINDING *** admin\'s own /api/ai/config.spend.byPerson matches what the Viewer got, byte for byte — same data, wrong door', JSON.stringify(adminCfgR.spend.byPerson) === JSON.stringify(leakedPeople), true);
    record('*** FINDING *** unattributed is ALSO exposed to the Viewer via this route', typeof (viewerCfgR.json.spend.unattributed) === 'number', viewerCfgR.json.spend.unattributed);

    // Is this reachable through ordinary product use, or only a raw curl?
    // Cite the exact unguarded client call site (source-level, since running
    // the actual browser is out of reach here).
    const contractJs = fs.readFileSync(path.join(__dirname, '..', '..', '..', 'js', 'views', 'contract.js'), 'utf8');
    const fetchLine = (contractJs.split('\n').find(l => l.includes("api('ai/config')")) || '').trim();
    record('*** FINDING *** and this is not a theoretical curl target: the CONTRACT ROOM itself fetches ai/config with no role check around it (source line quoted)', /api\('ai\/config'\)/.test(fetchLine) && !/canEdit|role\s*===\s*'admin'|isAdmin/.test(fetchLine), fetchLine);

  } catch (e) {
    console.error('SCRIPT ERROR', e);
    results.push({ name: 'SCRIPT CRASHED', ok: false, detail: String(e && e.stack || e) });
  } finally {
    await h.stop();
  }

  const fails = results.filter(r => !r.ok);
  console.log('\n=== COPILOT SPEND SUMMARY ===');
  console.log(results.length + ' checks, ' + fails.length + ' failed');
  if (fails.length) { fails.forEach(f => console.log('  FAIL: ' + f.name)); process.exitCode = 1; }
})();
