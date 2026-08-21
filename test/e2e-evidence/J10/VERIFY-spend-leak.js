/* INDEPENDENT VERIFICATION of J10's finding:
   per-person Copilot spend reaches every role through GET /api/ai/config.
   Run: node test/e2e-evidence/J10/VERIFY-spend-leak.js */
const { startHati, seedWorkspace } = require('/home/user/mkataba-clm/test/helpers');
(async () => {
  const h = await startHati();
  const W = await seedWorkspace(h);
  const A = W.admin;

  /* A REAL VIEWER, on their own chosen password. */
  const v = await A.json('/api/users', { method: 'POST', body: {
    name: 'Vera Viewer', email: 'viewer@example.co.ke', role: 'viewer', password: 'temporary-pass-1' } });
  const V = h.client('viewer');
  await V.json('/api/login', { method: 'POST', body: { email: 'viewer@example.co.ke', password: 'temporary-pass-1' } });
  await V.json('/api/password/change', { method: 'POST', body: { current: 'temporary-pass-1', password: 'their-own-pass-9' } });
  const me = await V.json('/api/bootstrap').catch(() => null);
  console.log('ARM: the viewer is really a viewer ->', v.user.role);

  /* Spend some Copilot money as the ADMIN, so there is a per-person line to leak. */
  for (let i = 0; i < 3; i++)
    await A.raw('/api/ai/chat', { method: 'POST', body: { contractId: 'MK-A1', messages: [{ role: 'user', content: 'hello' }] } });

  const spend = await V.raw('/api/ai/spend');
  console.log('\nCONTROL  GET /api/ai/spend  as viewer ->', spend.status, String(spend.text).slice(0, 90));

  const cfg = await V.raw('/api/ai/config');
  console.log('ATTACK   GET /api/ai/config as viewer ->', cfg.status);
  const byPerson = cfg.json && cfg.json.spend && cfg.json.spend.byPerson;
  console.log('         .spend.byPerson  ->', JSON.stringify(byPerson));
  console.log('         .spend.unattributed ->', JSON.stringify(cfg.json && cfg.json.spend && cfg.json.spend.unattributed));

  const adminCfg = await A.json('/api/ai/config');
  const same = JSON.stringify(byPerson) === JSON.stringify(adminCfg.spend.byPerson);
  console.log('\n         identical to what the ADMIN sees? ->', same);

  const leaked = cfg.status === 200 && Array.isArray(byPerson) && byPerson.length > 0 && byPerson.some(p => p.name);
  console.log('\nRESULT:', leaked
    ? 'CONFIRMED — a Viewer reads every colleague\'s named daily Copilot spend, while /api/ai/spend correctly refuses them.'
    : 'NOT confirmed.');
  await h.stop();
  process.exit(leaked ? 1 : 0);
})();
