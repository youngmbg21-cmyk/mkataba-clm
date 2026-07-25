// Verification pass 2: share gate, portal projection, OTP, XSS, delete cascade.
const { as, shot, txt, nav } = require('./lib.js');
const { launch, BASE } = require('./drv.js');
const hook = pg => pg.evaluate(() => { window.__toasts = []; const o = window.toast; window.toast = (m, k) => { window.__toasts.push((k || 'ok') + ': ' + m); return o(m, k); }; });
const ok = (l, p, d) => console.log((p ? '  PASS  ' : '  FAIL  ') + l + (d ? '  — ' + d : ''));

(async () => {
  const { b, pg } = await as('amina@mwangifoods.co.ke');
  await hook(pg);
  await pg.waitForTimeout(1000);

  // ---------- F-022 : an incomplete contract cannot be shared silently
  await nav(pg, 'templates');
  await pg.evaluate(() => Array.from(document.querySelectorAll('button')).find(e => e.offsetParent && e.innerText.trim() === 'Use template').click());
  await pg.waitForTimeout(1500);
  await pg.fill('#wz-counterparty', 'Hurry Supplies Ltd');
  await pg.click('#wz-create'); await pg.waitForTimeout(2200);
  const draftId = await pg.evaluate(() => window.state.activeId);
  await pg.evaluate(i => window.openWorkspace(i), draftId); await pg.waitForTimeout(1800);
  await pg.click('#ws-share'); await pg.waitForTimeout(1500);
  const modal = await txt(pg);
  ok('F-022 share modal names what is missing', /Not ready to send/.test(modal) && /No contract value is set/.test(modal), (modal.match(/Not ready to send[^\n]*/) || [''])[0]);
  ok('F-022 acknowledgement required', !!(await pg.$('#sh-ack')));
  await pg.fill('#sh-name', 'Grace Njeri'); await pg.fill('#sh-email', 'grace@hurry.co.ke');
  await pg.evaluate(() => { window.__toasts = []; });
  await pg.click('#share-send'); await pg.waitForTimeout(2000);
  let sent = await pg.evaluate(async () => (await (await fetch('/api/contracts/' + window.state.activeId + '/shares')).json()).shares.length);
  ok('F-022 send blocked without the acknowledgement', sent === 0, 'shares=' + sent + ' toast=' + JSON.stringify(await pg.evaluate(() => window.__toasts)));
  await pg.check('#sh-ack');
  await pg.click('#share-send'); await pg.waitForTimeout(2500);
  sent = await pg.evaluate(async () => (await (await fetch('/api/contracts/' + window.state.activeId + '/shares')).json()).shares.length);
  ok('F-022 send allowed once acknowledged', sent === 1, 'shares=' + sent);

  // ---------- F-019 : the portal document survives copy/print
  const tok = await pg.evaluate(async () => (await (await fetch('/api/contracts/' + window.state.activeId + '/shares')).json()).shares[0].token);
  await pg.evaluate(() => document.getElementById('share-close')?.click());
  // now fill the terms in so there is something to lose
  await pg.evaluate(async () => {
    const c = window.state.contracts.find(x => x.id === window.state.activeId);
    await window.ensureFull(c);
    c.fields = { ...(c.fields || {}), effDate: '2026-08-01', counterparty: 'Hurry Supplies Ltd', material: 'refined white sugar', contractValue: 2500000, payDays: 45 };
    c.value = 2500000; c.counterparty = 'Hurry Supplies Ltd';
    await window.persist(c); await window.flushSaves();
  });
  await pg.waitForTimeout(1500);
  await pg.evaluate(() => window.openWorkspace(window.state.activeId)); await pg.waitForTimeout(1500);
  await pg.click('#ws-share'); await pg.waitForTimeout(1200);
  if (await pg.$('#sh-ack')) await pg.check('#sh-ack');
  await pg.fill('#sh-name', 'Grace 2'); await pg.fill('#sh-email', 'grace2@hurry.co.ke');
  await pg.click('#share-send'); await pg.waitForTimeout(2500);
  const tok2 = await pg.evaluate(async () => (await (await fetch('/api/contracts/' + window.state.activeId + '/shares')).json()).shares[0].token);
  await b.close();

  const { b: b2, pg: pg2 } = await launch();
  await pg2.goto(BASE + '/#share=t:' + tok2, { waitUntil: 'networkidle' });
  await pg2.waitForTimeout(3000);
  const r = await pg2.evaluate(() => {
    const a = document.querySelector('article.doc-surface');
    return { inputs: a ? a.querySelectorAll('input,textarea').length : -1, text: a ? a.innerText.replace(/\s+/g, ' ') : '' };
  });
  ok('F-019 no form fields left in the portal document', r.inputs === 0, 'inputs=' + r.inputs);
  ok('F-019 the terms survive as text', /Hurry Supplies Ltd/.test(r.text) && /refined white sugar/.test(r.text), (r.text.match(/made on [^.]{0,90}/) || [''])[0]);

  // ---------- F-018 : the OTP is not shown to the counterparty
  await pg2.fill('#pt-name', 'Grace Njeri');
  await pg2.fill('#pt-email', 'grace2@hurry.co.ke');
  await pg2.click('#pt-sign'); await pg2.waitForTimeout(1500);
  await pg2.evaluate(() => { const t = Array.from(document.querySelectorAll('button')).find(x => /Type/.test(x.innerText) && x.offsetParent); if (t) t.click(); });
  await pg2.waitForTimeout(600);
  await pg2.evaluate(() => { const i = document.getElementById('sig-typed'); if (i) { i.value = 'Grace Njeri'; i.dispatchEvent(new Event('input', { bubbles: true })); } });
  await pg2.waitForTimeout(400);
  await pg2.click('#sig-adopt-go'); await pg2.waitForTimeout(3000);
  const otpScreen = await txt(pg2);
  ok('F-018 code not printed to the counterparty', !/your code is \d{6}/.test(otpScreen) && !/\b\d{6}\b/.test(otpScreen.split('Verify your email')[1] || ''),
    (otpScreen.match(/Email delivery[^\n]*/) || otpScreen.match(/code is[^\n]*/) || [''])[0].slice(0, 110));
  await shot(pg2, 'verify-otp');
  await b2.close();
})();
