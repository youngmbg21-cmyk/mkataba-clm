/* Chromium verification: AN APPROVER'S TAB LEFT OPEN (B3, 8 Oct 2026).
   ============================================================
   The 9 Oct review, finding 5, driven with two people and real presses:
     1  the approver refuses with a reason in their tab, and leaves it open;
     2  the owner revises and sends it back, in theirs;
     3  the approver presses "Approve again" in the tab they left open: the
        approval lands on the owner's resubmission — no "Keep mine / Load
        theirs" dialog, the owner's resubmission line kept, the step approved
        on the server — and only then does the page say so;
     4  a second stale tab presses Approve after the step was approved: it is
        told plainly, and nothing is written twice.
   Run: node test/chromium/stale-approver-tab-verify.js */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};
const until = async (fn, ms = 8000, step = 150) => { const end = Date.now() + ms; let v;
  while (Date.now() < end) { v = await fn(); if (v) return v; await new Promise(r => setTimeout(r, step)); } return v; };

(async () => {
  const h = await startHati({ HATI_AGENTS_AUTO: 'off' });
  const W = await seedWorkspace(h, { approvalRules: [] });
  await W.admin.json('/api/settings', { method: 'PUT', body: { approvalRules: [{ id: 'r1', order: 1, name: 'Finance check',
    cond: { type: 'value', op: '>=', value: 1 }, approver: { kind: 'member', id: W.users.unrestricted.id, name: 'Unrestricted Legal' } }] } });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const login = async (email, pass) => {
    const ctx = await browser.newContext({ viewport: { width: 1400, height: 1000 } });
    const page = await ctx.newPage();
    page.__errors = []; page.on('pageerror', e => page.__errors.push(e.message));
    page.__toasts = [];
    await page.exposeFunction('__toastSeen', m => page.__toasts.push(m));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    await page.fill('#li-email', email); await page.fill('#li-pass', pass); await page.click('#li-go');
    await page.waitForFunction(() => window.state && Array.isArray(state.contracts) && state.contracts.length > 0 && window.currentUser && currentUser(), null, { timeout: 15000 });
    await page.waitForTimeout(800);
    await page.evaluate(() => { const root = document.getElementById('toast-root');
      new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => { if (n.nodeType === 1) window.__toastSeen(n.textContent.replace(/\s+/g, ' ').trim()); })))
        .observe(root, { childList: true, subtree: true }); });
    return page;
  };
  const openSigning = page => page.evaluate(async () => { const c = getContract('MK-A2'); await ensureFull(c);
    openWorkspace(c.id); await new Promise(r => setTimeout(r, 500)); roomGoTab(c, 'sign'); await new Promise(r => setTimeout(r, 500)); });
  const stored = () => W.admin.json('/api/contracts/MK-A2');
  const stepOf = x => (x.approvalChain || []).find(s => s.ruleId === 'r1') || {};
  try {
    const owner = await login('admin@example.co.ke', 'adminpassword1');
    const appr = await login('everything@example.co.ke', 'their-own-pass-9');
    const appr2 = await login('everything@example.co.ke', 'their-own-pass-9');
    await openSigning(appr); await openSigning(appr2);
    const btn0 = await appr.evaluate(() => (document.getElementById('ap-approve') || {}).textContent || '');
    check('0   the approver sees the step waiting on them', /Approve/.test(btn0), btn0.trim());

    /* 1 · REFUSED, WITH A REASON */
    const refused = await appr.evaluate(async () => await rejectApprovalStep(getContract('MK-A2'), 'The payment terms need a second look.'));
    const s1 = await until(async () => { const x = await stored(); return stepOf(x).status === 'rejected' ? x : null; });
    check('1   the refusal is on the server before the page says so', refused === true && !!s1, String(refused));

    /* 2 · THE OWNER REVISES AND SENDS IT BACK */
    await openSigning(owner);
    await owner.evaluate(async () => { const c = getContract('MK-A2'); await ensureFull(c); resubmitApproval(c, 'Payment terms revised'); await flushSaves(); });
    const s2 = await until(async () => { const x = await stored(); return stepOf(x).status === 'pending' ? x : null; });
    check('2   the owner\'s resubmission is on the server', !!s2);

    /* 3 · THE APPROVER PRESSES "APPROVE AGAIN" IN THE TAB THEY LEFT OPEN */
    const stale = await appr.evaluate(() => ({ status: (approvalState(getContract('MK-A2')).next || {}).status, btn: (document.getElementById('ap-approve') || {}).textContent || '' }));
    check('3a  the tab really is stale: it still shows the refusal', stale.status === 'rejected' && /Approve again/.test(stale.btn), JSON.stringify(stale));
    appr.__toasts.length = 0;
    await appr.click('#ap-approve');
    const s3 = await until(async () => { const x = await stored(); return stepOf(x).status === 'approved' ? x : null; });
    await appr.waitForTimeout(600);
    const dlg = await appr.evaluate(() => /Keep mine|Load theirs/.test(document.body.innerText));
    check('3b  the approval landed on the owner\'s resubmission, on the server', !!s3, s3 ? JSON.stringify(stepOf(s3)).slice(0, 120) : 'still ' + stepOf(await stored()).status);
    check('3c  no "Keep mine / Load theirs" dialog for a decision', !dlg);
    check('3d  the owner\'s resubmission line is kept', !!s3 && s3.audit.some(a => a.action === 'Approval resubmitted') && s3.audit.some(a => a.action === 'Approved'));
    check('3e  the page says so after the server took it', appr.__toasts.some(t => /All approvals complete|Step approved/.test(t)), appr.__toasts.join(' | '));

    /* 4 · A SECOND STALE TAB */
    appr2.__toasts.length = 0;
    const before4 = (await stored()).audit.filter(a => a.action === 'Approved').length;
    const r4 = await appr2.evaluate(async () => await approveContract(getContract('MK-A2')));
    await appr2.waitForTimeout(600);
    const after4 = (await stored()).audit.filter(a => a.action === 'Approved').length;
    check('4   a second stale tab is told plainly, and nothing is written twice',
      r4 !== true && after4 === before4 && appr2.__toasts.some(t => /already complete|no longer waiting/.test(t)), JSON.stringify({ r4, before4, after4, t: appr2.__toasts }));
    check('5   no page errors', ![owner, appr, appr2].some(p => p.__errors.length), [owner, appr, appr2].map(p => p.__errors.join(';')).join(' | ').slice(0, 200));
  } catch (e) {
    check('the run itself', false, e && e.stack);
  } finally {
    await browser.close(); await h.stop();
    const failed = results.filter(r => !r.pass).length;
    console.log(`\n${results.length - failed}/${results.length} passed`);
    process.exit(failed ? 1 : 0);
  }
})();
