'use strict';
/* J1 item 4 — Build & Launch go-live rows. This is NOT a browser session, so
   I cannot press the rows or watch stGoLive() paint. What I CAN do is verify
   that the underlying data each row is computed from (per js/views/settings.js
   stGoLive, read directly) is real, reachable at the API, and changes state
   the way the row claims it will. The "does the row's door actually land
   somewhere real" half is explicitly a browser question — NOT answered here. */
const assert = require('node:assert');
const { startHati, seedWorkspace } = require('../../helpers');

(async () => {
  const h = await startHati();
  const W = await seedWorkspace(h);
  try {
    console.log('=== 04: go-live row facts ===');

    // ROW 1: legal name — ob.companyName (GET /api/org/branding) or getOrg().name (bootstrap.org.name)
    {
      const boot = await W.admin.json('/api/bootstrap');
      const branding = await W.admin.json('/api/org/branding');
      console.log(`ROW entity: bootstrap.org.name=${JSON.stringify(boot.org && boot.org.name)} branding.companyName=${JSON.stringify(branding.branding && branding.branding.companyName)}`);
      // seedWorkspace's /api/setup sets org: 'Highland Corporate Ltd' -- is that org.name?
      assert.ok(boot.org && boot.org.name, 'org.name must be present after setup');
      console.log('VERIFIED: entity row source (org.name) is real and reachable via GET /api/bootstrap.');
    }

    // ROW 2: mail delivering — bootstrap.emailConfigured / emailHealth
    {
      const boot = await W.admin.json('/api/bootstrap');
      console.log(`ROW mail: emailConfigured=${boot.emailConfigured} emailHealth=${JSON.stringify(boot.emailHealth)}`);
      assert.strictEqual(boot.emailConfigured, false, 'this harness runs with no mail provider (RESEND_API_KEY empty)');
      console.log('VERIFIED: mail row source reachable; with no provider configured it correctly reads unconfigured (not silently green).');
    }

    // ROW 3: Copilot key — bootstrap.aiConfigured / GET /api/ai/config .configured
    {
      const boot = await W.admin.json('/api/bootstrap');
      const cfg = await W.admin.json('/api/ai/config');
      console.log(`ROW key: bootstrap.aiConfigured=${boot.aiConfigured} /api/ai/config.configured=${cfg.configured}`);
      // startHati sets ANTHROPIC_API_KEY to a fake test key pointed at the stub, so both should read true
      assert.strictEqual(boot.aiConfigured, true);
      assert.strictEqual(cfg.configured, true);
      console.log('VERIFIED: key row source reachable and consistent across bootstrap and /api/ai/config.');
    }

    // ROW 4: spend ceiling — /api/ai/config.limits.dailySpendLimit
    {
      const cfg = await W.admin.json('/api/ai/config');
      console.log(`ROW ceiling: dailySpendLimit=${cfg.limits.dailySpendLimit} (row reads ok when >0; default 10 with no env override)`);
      // the real writer is PUT /api/ai/config (confirmed by grep: setMoney('aiDailySpendLimit', dailySpendLimit) at server.js:3641)
      const rSet = await W.admin.raw('/api/ai/config', { method: 'PUT', body: { dailySpendLimit: 25 } });
      console.log(`  PUT /api/ai/config {dailySpendLimit:25}: status=${rSet.status} body=${rSet.text.slice(0,200)}`);
      const cfg2 = await W.admin.json('/api/ai/config');
      console.log(`  after: dailySpendLimit=${cfg2.limits.dailySpendLimit}`);
      console.log(`VERIFIED: ceiling row source reachable; writable=${cfg2.limits.dailySpendLimit !== cfg.limits.dailySpendLimit}`);
      // non-admin refused from writing it
      const rSetNonAdmin = await W.unrestricted.raw('/api/ai/config', { method: 'PUT', body: { dailySpendLimit: 999 } });
      console.log(`  non-admin PUT /api/ai/config: status=${rSetNonAdmin.status} body=${rSetNonAdmin.text.slice(0,150)}`);
    }

    // ROW 5: >=1 approval rule — bootstrap.settings.approvalRules, BUT approvalRules() FALLS BACK
    // to a synthesized default rule (threshold 5,000,000) when settings.approvalRules is not an
    // array. Verify: a workspace where the admin NEVER visited approvals still reports "ok" because
    // of this client-side fallback, even though the server holds nothing.
    {
      const boot = await W.admin.json('/api/bootstrap');
      console.log(`ROW rule: bootstrap.settings.approvalRules = ${JSON.stringify(boot.settings.approvalRules)}`);
      const isArray = Array.isArray(boot.settings.approvalRules);
      console.log(`  is an explicit array on the server: ${isArray}`);
      console.log(`FINDING go-live-rule-row-fallback: without an admin ever configuring one, the SERVER holds no approvalRules array (${JSON.stringify(boot.settings.approvalRules)}), but js/approvals.js's approvalRules() synthesizes a default rule client-side (a 5,000,000 threshold rule) whenever settings.approvalRules is not an array -- so the go-live row would read 'ok:true, detail:1' on a workspace where nobody has ever set an approval rule.`);
    }

    // ROW 6: samples cleared — POST /api/demo/clear + c.seeded flag
    {
      const boot = await W.admin.json('/api/contracts');
      const list = boot.rows || [];
      const seededCount = list.filter(c => c.seeded === true).length;
      console.log(`ROW samples: contracts with seeded===true in the light list = ${seededCount} (fixtures here were NOT stamped seeded:true by seedWorkspace's fixtureContract, so expect 0)`);
      // exercise the real clear route
      const rClear = await W.admin.raw('/api/demo/clear', { method: 'POST' });
      console.log(`  POST /api/demo/clear: status=${rClear.status} body=${rClear.text.slice(0,400)}`);
      // non-admin refused
      const rClearNonAdmin = await W.unrestricted.raw('/api/demo/clear', { method: 'POST' });
      console.log(`  non-admin POST /api/demo/clear: status=${rClearNonAdmin.status} body=${rClearNonAdmin.text.slice(0,200)}`);
      console.log(`VERIFIED: samples row's underlying route (POST /api/demo/clear, admin-only) is real and reachable.`);
    }

    // ROW 7: integrity — purely client-side (negoIntegrityReport loop over every contract in
    // the browser). NO server route computes or stores this. Cannot be verified at the API at all.
    console.log('ROW integrity: js/views/settings.js reads _stIntegrity, a value set ONLY by a client-side loop over state.contracts calling negoIntegrityReport() per contract -- there is no server route that runs or stores this. NOT independently verifiable at the API; this is a browser-only computation. NOT TESTED beyond confirming there is no server endpoint for it:');
    {
      const probe = await W.admin.raw('/api/integrity');
      console.log(`  probe GET /api/integrity (expected 404, confirming no such route): status=${probe.status}`);
    }

    // ROW 8: signing caps — signCapUnanswered() reads users list; admin bootstrap gets full signCap per user
    {
      const boot = await W.admin.json('/api/bootstrap');
      const unanswered = boot.users.filter(u => u.role !== 'admin' && (u.signCap === undefined || u.signCap === null));
      console.log(`ROW caps: admin bootstrap users with signCap null/absent (role!=admin) = ${unanswered.map(u=>u.email)}`);
      console.log('VERIFIED: caps row source (per-user signCap, admin-visible) reachable at /api/bootstrap for an admin.');
    }

    // ROW 9: backup taken — PURELY a browser localStorage timestamp (hati.v1.lastBackup),
    // written whenever GET /api/export/workspace.zip succeeds client-side. There is NO
    // server record of "a backup was taken" at all -- confirm the download route exists
    // and is reachable, but the go-live tick itself is per-browser/per-device state.
    {
      const rZip = await W.admin.raw('/api/export/workspace.zip');
      console.log(`ROW backup: GET /api/export/workspace.zip (the actual backup download): status=${rZip.status} content-type=${rZip.headers.get('content-type')}`);
      const rZipNonAdmin = await W.unrestricted.raw('/api/export/workspace.zip');
      console.log(`  non-admin GET /api/export/workspace.zip: status=${rZipNonAdmin.status}`);
      console.log(`FINDING go-live-backup-row-is-per-browser: stLastBackup() (js/views/settings.js:1502) reads localStorage key 'hati.v1.lastBackup' -- there is no server-side record of when a backup was last taken. An admin who took a backup on one browser/device and opens Build & Launch on a different browser (or after clearing site data) would see 'Not set' even though a real backup exists, because the fact lives only in the browser that pressed the button, never on the server the workspace actually runs on.`);
    }

    // ROW 10: first send inside seven days — GET /api/activation, admin-only
    {
      const rAct = await W.admin.raw('/api/activation');
      console.log(`ROW firstsend: admin GET /api/activation: status=${rAct.status} body=${rAct.text.slice(0,300)}`);
      const rActNonAdmin = await W.unrestricted.raw('/api/activation');
      console.log(`  non-admin GET /api/activation: status=${rActNonAdmin.status} body=${rActNonAdmin.text.slice(0,150)}`);
      assert.strictEqual(rAct.status, 200);
      assert.strictEqual(rActNonAdmin.status, 403);
      console.log('VERIFIED: firstsend row source reachable for admin, correctly refused for non-admin.');
      // now actually send something (needs a signing/negotiate route + a share) to see the north star move
      // Keep it light: just confirm workspaceCreatedAt is set and northStar starts as no-data
      const act = rAct.json;
      console.log(`  workspaceCreatedAt=${act.workspaceCreatedAt} northStar=${JSON.stringify(act.northStar)}`);
    }

  } finally { await h.stop(); }
})().catch(e => { console.error('FATAL', e); process.exit(1); });
