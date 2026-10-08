/* Chromium verification: THE SEAL IS THE SERVER'S (D4, 8 Oct 2026; B1, B7,
   B8, B16, B17 of the overnight run).
   ============================================================
   The review's finding 1, driven end to end with real presses:
     1  we sign first on the Signing tab: the confirmation PRINTS (B7), the
        save carries the frozen copy the server will seal from, and their link
        is issued only after our signature is on file (B8);
     2  the counterparty signs LAST on their link while NO browser is open:
        the server files it, seals as HaTi, names OUR signer as signatory, and
        writes the copies' line from what really happened (B16);
     3  a colleague who had nothing to do with the deal signs in afterwards: the
        seal, the signatory and the trail do not move (the bystander fault);
     4  the owner's page, still open, catches up by itself — sealed, said in a
        toast — and the page's own verifySeal reading agrees with the seal.
   Run: node test/chromium/seal-on-the-server-verify.js */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};
const until = async (fn, ms = 8000, step = 150) => { const end = Date.now() + ms; let v;
  while (Date.now() < end) { v = await fn(); if (v) return v; await new Promise(r => setTimeout(r, step)); } return v; };

(async () => {
  process.env.HATI_AGENTS_AUTO = 'off';
  const h = await startHati({ HATI_AGENTS_AUTO: 'off' });
  const W = await seedWorkspace(h, { approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const login = async (email, pass) => {
    const ctx = await browser.newContext({ viewport: { width: 1400, height: 1000 } });
    const page = await ctx.newPage();
    page.__errors = []; page.on('pageerror', e => page.__errors.push(e.message));
    page.__toasts = [];
    await page.exposeFunction('__toastSeen', (m, k) => page.__toasts.push({ m, k }));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    await page.fill('#li-email', email); await page.fill('#li-pass', pass); await page.click('#li-go');
    await page.waitForFunction(() => window.state && Array.isArray(state.contracts) && state.contracts.length > 0 && window.currentUser && currentUser(), null, { timeout: 15000 });
    await page.waitForTimeout(800);
    /* WHAT IS PAINTED, not what was called: a bare toast() paints nothing. */
    await page.evaluate(() => { const root = document.getElementById('toast-root');
      new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => { if (n.nodeType === 1) window.__toastSeen(n.textContent.replace(/\s+/g, ' ').trim(), 'painted'); })))
        .observe(root, { childList: true, subtree: true }); });
    return page;
  };
  try {
    const page = await login('admin@example.co.ke', 'adminpassword1');

    /* ---- THE FIXTURE: a signer each side (us first), nothing on the table,
       the readings the Sign button asks for already on file. */
    const ready = await page.evaluate(async () => {
      const c = getContract('MK-A2');
      await ensureFull(c);
      const me = currentUser();
      c.signerPlan = [
        { id: 'sg_me', party: 'internal', name: me.name, memberId: me.id, email: me.email, role: 'Director', order: 1, signed: false },
        { id: 'sg_cp', party: 'counterparty', name: 'Ola Nordmann', email: 'ola@nandi.co.ke', order: 2, signed: false } ];
      c._brief = { v: 1, at: new Date(Date.now() + 60000).toISOString(), by: 'Stage', truncated: false, data: {} };
      if (window.briefMarkRead) briefMarkRead(c);
      if (window.contractBoxesOpen && window.contractBlankSet) contractBoxesOpen(c).forEach(b =>
        contractBlankSet(c, b.key, b.type === 'date' ? '2026-10-01' : 'Stated', { quiet: true, hold: true }));
      const hash = playbookHashOf(playbookText(c));
      c.playbook = { label: 'Default', wordingHash: hash, verdicts: [] };
      c.obligationsReadHash = hash;
      c.compliance = {};
      persist(c); await flushSaves();
      openWorkspace(c.id);
      await new Promise(r => setTimeout(r, 500));
      roomGoTab(c, 'sign');
      await new Promise(r => setTimeout(r, 500));
      return { blockers: (signBlockers(c) || []).map(b => b.kind || b.key || String(b)), label: (document.getElementById('sign-btn') || {}).textContent };
    });
    check('0   staged: nothing holds the Sign button', !ready.blockers.length, JSON.stringify(ready));

    /* ---- 1 · WE SIGN FIRST ---- */
    await page.click('#sign-btn');
    await page.waitForSelector('#sig-pad', { timeout: 5000 });
    await page.click('[data-sig-tab="type"]');
    await page.fill('#sig-typed', 'Amina Otieno');
    await page.click('#sig-intent');
    await page.click('#sig-adopt-go');
    const stored1 = await until(async () => { const x = await W.admin.json('/api/contracts/MK-A2');
      return (x.signerPlan || []).some(s => s.id === 'sg_me' && s.signed) ? x : null; });
    check('1a  our signature is on file, and the save carried the frozen copy the server stamped',
      stored1 && stored1.sealPrep && stored1.sealPrep.basis && stored1.sealPrep.textHash && stored1.status !== 'Signed',
      stored1 ? JSON.stringify({ basis: !!(stored1.sealPrep || {}).basis, status: stored1.status }) : 'not saved');
    const shares = await until(async () => { const r = await W.admin.json('/api/contracts/MK-A2/shares');
      const list = Array.isArray(r) ? r : (r.shares || []);
      return list.find(s => String(s.signerId || s.signer_id || '') === 'sg_cp' && !s.revokedAt && !s.revoked_at) || null; });
    check('1b  their signing link is issued once our signature is on file (B8)', !!shares, shares ? 'token ' + String(shares.token).slice(0, 6) : 'none');
    const t1 = await until(async () => page.__toasts.find(t => /Internal signing complete|signing links|Recorded/.test(t.m)));
    check('1c  the confirmation is painted, not a silent bare toast (B7)', !!t1, JSON.stringify(t1 || page.__toasts.slice(-3)));

    /* ---- 2 · THEY SIGN LAST, WITH NO BROWSER OF OURS IN THE LOOP ---- */
    await page.evaluate(() => { window.__pollWas = window.pollPendingResponses; window.pollPendingResponses = async () => {}; });
    const them = h.client('them');
    const r = await them.raw('/api/shares/' + shares.token + '/respond', { method: 'POST', body: {
      v: 1, kind: 'hati-response', id: 'MK-A2', action: 'sign', name: 'Ola Nordmann', title: 'CEO', email: 'ola@nandi.co.ke',
      at: new Date().toISOString(), signatureForm: 'drawn', signatureImage: PNG } });
    check('2a  their signature is accepted', r.status === 200, String(r.status) + ' ' + JSON.stringify(r.json || {}).slice(0, 120));
    const sealed = await W.admin.json('/api/contracts/MK-A2');
    check('2b  sealed on the server the moment it landed — by HaTi',
      sealed.status === 'Signed' && sealed.execution && sealed.execution.by === 'HaTi' && !!sealed.hash,
      JSON.stringify({ status: sealed.status, by: sealed.execution && sealed.execution.by }));
    check('2c  the signatory is our own signer, not whoever opens HaTi next', /^Amina Otieno/.test(sealed.signatory || ''), sealed.signatory);
    check('2d  the trail lines are the server\'s: their signature (a countersignature — we signed first) and the seal',
      sealed.audit.some(a => a.user === 'HaTi' && a.action === 'Countersigned') && sealed.audit.some(a => a.user === 'HaTi' && a.action === 'Signed'));
    const dist = await until(async () => { const x = await W.admin.json('/api/contracts/MK-A2'); return x.distribution ? x : null; });
    const dl = dist && dist.audit.filter(a => a.action === 'Distributed').pop();
    check('2e  the copies went from the server, and the line says they wait in the outbox (B16)',
      dl && dl.user === 'HaTi' && /outbox/.test(dl.detail) && !/emailed to/.test(dl.detail), dl && dl.detail);

    /* ---- 3 · A BYSTANDER SIGNS IN ---- */
    const by = await login('everything@example.co.ke', 'their-own-pass-9');
    await by.evaluate(async () => { try { await pollNow(); } catch (_) {} const c = getContract('MK-A2'); if (c) { await ensureFull(c); openWorkspace(c.id); } });
    await by.waitForTimeout(2500);
    const after3 = await W.admin.json('/api/contracts/MK-A2');
    check('3a  a colleague opening HaTi afterwards moves nothing — seal, signatory and seal line stand',
      after3.hash === sealed.hash && after3.signatory === sealed.signatory
        && after3.audit.filter(a => a.action === 'Signed').length === 1 && !after3.audit.some(a => a.user === 'Unrestricted Legal' && /Signed|Distributed/.test(a.action)),
      JSON.stringify({ same: after3.hash === sealed.hash, signatory: after3.signatory }));

    /* ---- 4 · THE OWNER'S PAGE, STILL OPEN, CATCHES UP ---- */
    await page.evaluate(async () => { window.pollPendingResponses = window.__pollWas; await pollPendingResponses(); });
    const caught = await until(async () => page.evaluate(() => getContract('MK-A2').status === 'Signed'), 6000);
    const t4 = page.__toasts.find(t => /sealed by HaTi/.test(t.m));
    check('4a  the open page catches up by itself and says so', caught && !!t4, JSON.stringify(t4 || page.__toasts.slice(-4)));
    const verdict = await page.evaluate(async () => {
      const c = getContract('MK-A2');
      const th = await sha256(execHashInput(c.execution));
      const h2 = await sha256(sealString(c));
      return { text: th === c.execution.textHash, seal: h2 === c.hash, status: c.status };
    });
    check('4b  the page\'s own verifySeal reading agrees with the server\'s seal', verdict.text && verdict.seal, JSON.stringify(verdict));
    const sec = await page.evaluate(() => (document.getElementById('sign-btn') || {}).textContent || '');
    check('4c  the page draws it executed — no Sign button left', !/^Sign/.test(sec.trim()), sec.trim().slice(0, 40));
    check('5   no page errors', !page.__errors.length && !by.__errors.length, [...page.__errors, ...by.__errors].join(' | ').slice(0, 200));
  } catch (e) {
    check('the run itself', false, e && e.stack);
  } finally {
    await browser.close(); await h.stop();
    const failed = results.filter(r => !r.pass).length;
    console.log(`\n${results.length - failed}/${results.length} passed`);
    process.exit(failed ? 1 : 0);
  }
})();
