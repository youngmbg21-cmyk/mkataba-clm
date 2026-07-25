// Regression: the whole signing journey still works end to end after the changes.
const { as, shot, txt, nav } = require('./lib.js');
const { launch, BASE } = require('./drv.js');
const ok = (l, p, d) => console.log((p ? '  PASS  ' : '  FAIL  ') + l + (d ? '  — ' + d : ''));

(async () => {
  const { b, pg } = await as('amina@mwangifoods.co.ke');
  await pg.waitForTimeout(1200);

  // fully-specified draft
  await nav(pg, 'templates');
  await pg.evaluate(() => Array.from(document.querySelectorAll('button')).find(e => e.offsetParent && e.innerText.trim() === 'Use template').click());
  await pg.waitForTimeout(1500);
  await pg.fill('#wz-counterparty', 'Kabras Sugar Limited');
  await pg.fill('#wz-value', '2500000');
  await pg.fill('#wz-effDate', '2026-08-01');
  await pg.fill('#wz-expiry', '2028-07-31');
  await pg.fill('#wz-material', 'refined white sugar');
  await pg.fill('#wz-payDays', '45');
  await pg.click('#wz-create'); await pg.waitForTimeout(2500);
  const id = await pg.evaluate(() => window.state.activeId);
  ok('regression: wizard creates a complete draft', !!id, id);

  // F-023: backwards dates are refused
  await nav(pg, 'templates');
  await pg.evaluate(() => Array.from(document.querySelectorAll('button')).find(e => e.offsetParent && e.innerText.trim() === 'Use template').click());
  await pg.waitForTimeout(1400);
  await pg.fill('#wz-counterparty', 'Backwards Ltd');
  await pg.fill('#wz-value', '100000');
  await pg.fill('#wz-effDate', '2026-12-31');
  await pg.fill('#wz-expiry', '2024-01-01');
  await pg.click('#wz-create'); await pg.waitForTimeout(1500);
  const blocked = !!(await pg.$('#wz-create'));
  ok('F-023 expiry before effective date refused', blocked, (await txt(pg)).match(/expiry date \([^)]*\) is before[^\n]*/)?.[0] || '');
  if (blocked) await pg.evaluate(() => document.getElementById('wz-cancel')?.click());
  await pg.waitForTimeout(800);

  // share it, complete, no readiness block expected
  await pg.evaluate(i => window.openWorkspace(i), id); await pg.waitForTimeout(2000);
  await pg.click('#ws-share'); await pg.waitForTimeout(1400);
  const modal = await txt(pg);
  ok('F-022 a complete contract shares with no block', !(await pg.$('#sh-ack')), (modal.match(/Not ready to send[^\n]*|Worth checking[^\n]*/) || ['no warning'])[0]);
  await pg.fill('#sh-name', 'Peter Kariuki'); await pg.fill('#sh-email', 'peter@kabras.co.ke');
  await pg.click('#share-send'); await pg.waitForTimeout(2500);
  const tok = await pg.evaluate(async () => (await (await fetch('/api/contracts/' + window.state.activeId + '/shares')).json()).shares[0].token);
  await pg.evaluate(() => document.getElementById('share-close')?.click());
  await b.close();

  // counterparty signs
  const { b: b2, pg: pg2 } = await launch();
  await pg2.goto(BASE + '/#share=t:' + tok, { waitUntil: 'networkidle' });
  await pg2.waitForTimeout(3000);
  await pg2.fill('#pt-name', 'Peter Kariuki');
  await pg2.fill('#pt-title', 'Director');
  await pg2.fill('#pt-email', 'peter@kabras.co.ke');
  await pg2.click('#pt-sign'); await pg2.waitForTimeout(1600);
  await pg2.evaluate(() => { const t = Array.from(document.querySelectorAll('button')).find(x => /Type/.test(x.innerText) && x.offsetParent); if (t) t.click(); });
  await pg2.waitForTimeout(600);
  await pg2.evaluate(() => { const i = document.getElementById('sig-typed'); if (i) { i.value = 'Peter Kariuki'; i.dispatchEvent(new Event('input', { bubbles: true })); } });
  await pg2.waitForTimeout(400);
  await pg2.click('#sig-adopt-go'); await pg2.waitForTimeout(3000);
  // the code now only exists in the admin outbox
  const { execSync } = require('child_process');
  const SC = '/tmp/claude-0/-home-user-mkataba-clm/755f1890-2593-5c40-9fce-6b486bee6495/scratchpad';
  const ob = JSON.parse(execSync(`curl -s -b ${SC}/ck_amina.txt localhost:3100/api/outbox`).toString());
  const code = (ob.items.find(i => /OTP for signing/.test(i.dev_hint || '')) || {}).dev_hint?.match(/(\d{6})/)?.[1];
  ok('F-018 the code is in the admin outbox', !!code, code ? 'found' : 'missing');
  await pg2.evaluate(c => { const i = document.getElementById('pt-otp'); i.value = c; i.dispatchEvent(new Event('input', { bubbles: true })); }, code);
  await pg2.evaluate(() => { const bb = Array.from(document.querySelectorAll('button')).find(x => /Verify & sign/.test(x.innerText)); if (bb) bb.click(); });
  await pg2.waitForTimeout(3500);
  ok('regression: counterparty can still sign', /delivered|all done|signed/i.test(await txt(pg2)));
  await b2.close();

  // owner applies + countersigns; audit must survive
  const { b: b3, pg: pg3 } = await as('amina@mwangifoods.co.ke');
  await pg3.waitForTimeout(2000);
  await pg3.evaluate(() => window.pollPendingResponses && window.pollPendingResponses());
  await pg3.waitForTimeout(4000);
  const afterResp = await pg3.evaluate(async i => {
    const c = await (await fetch('/api/contracts/' + i)).json();
    return { audit: (c.audit || []).map(a => a.action), status: c.status };
  }, id);
  ok('F-021 the audit trail survives a counterparty response',
    afterResp.audit.includes('Created') && afterResp.audit.includes('Shared') && afterResp.audit.includes('Countersigned'),
    JSON.stringify(afterResp.audit));

  await pg3.evaluate(i => window.openWorkspace(i), id); await pg3.waitForTimeout(2200);
  await pg3.evaluate(() => { const e = Array.from(document.querySelectorAll('button')).find(x => x.offsetParent && x.innerText.trim() === 'Signing'); if (e) e.click(); });
  await pg3.waitForTimeout(1500);
  await pg3.evaluate(() => { document.querySelectorAll('input[type=checkbox]').forEach(c => { if (c.offsetParent && !c.checked) { c.checked = true; c.dispatchEvent(new Event('change', { bubbles: true })); } }); });
  await pg3.waitForTimeout(1200);
  if (await pg3.$('#sign-btn')) {
    await pg3.evaluate(() => document.getElementById('sign-btn').click()); await pg3.waitForTimeout(2500);
    if (await pg3.$('#sig-adopt-go')) {
      await pg3.evaluate(() => { const t = Array.from(document.querySelectorAll('button')).find(x => /Type/.test(x.innerText) && x.offsetParent); if (t) t.click(); });
      await pg3.waitForTimeout(600);
      await pg3.evaluate(() => { const i = document.getElementById('sig-typed'); if (i) { i.value = 'Amina Otieno'; i.dispatchEvent(new Event('input', { bubbles: true })); } });
      await pg3.waitForTimeout(400);
      await pg3.evaluate(() => document.getElementById('sig-adopt-go').click()); await pg3.waitForTimeout(4500);
    }
  }
  const sealed = await pg3.evaluate(async i => {
    const c = await (await fetch('/api/contracts/' + i)).json();
    const d = document.createElement('div'); d.innerHTML = (c.execution && c.execution.html) || '';
    return { status: c.status, frozen: d.innerText.replace(/\s+/g, ' '), audit: (c.audit || []).map(a => a.action) };
  }, id);
  ok('regression: contract executes and seals', sealed.status === 'Signed', sealed.status);
  ok('regression: the frozen copy carries the real terms', /2500000|2,500,000/.test(sealed.frozen) && /Kabras Sugar Limited/.test(sealed.frozen),
    (sealed.frozen.match(/contract value is KES [^,]*/) || [''])[0]);
  ok('regression: the full audit trail is intact', sealed.audit.includes('Created') && sealed.audit.includes('Signed'), JSON.stringify(sealed.audit));

  // seal verification
  const seal = await pg3.evaluate(async i => {
    const c = window.state.contracts.find(x => x.id === i);
    await window.ensureFull(c);
    const before = document.getElementById('toast-root').innerText;
    await window.verifySeal(c);
    return document.getElementById('toast-root').innerText.replace(before, '').trim();
  }, id);
  ok('regression: verifySeal reports valid', /Seal valid/.test(seal), seal.split('\n').pop());
  await shot(pg3, 'verify-signed');
  await b3.close();
})();
