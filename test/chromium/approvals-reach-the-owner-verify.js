/* Chromium verification: A REFUSED APPROVAL REACHES THE OWNER (B5, 8 Oct 2026),
   AND NO SIGNING LINK GOES OVER AN OPEN ASK (B2).
   ============================================================
   Driven with two people and real presses:
     1  the approver refuses with a reason;
     2  the owner, signing in afterwards, finds it in the bell (its own row,
        with the reason) and in the contract's checklist — and the bell does
        NOT say "It is your turn to sign" while the refusal holds it;
     3  the owner's mail says so too (the outbox, email being off here);
     4  B2: with one of our asks still open, the Signing tab's way to issue
        their link refuses, naming the clause — and the server refuses the
        same mint.
   Run: node test/chromium/approvals-reach-the-owner-verify.js */
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
  const adminId = (await W.admin.json('/api/bootstrap')).me.id;
  /* the contract: ours, a signer each side, us first */
  { const x = await W.admin.json('/api/contracts/MK-A2'); const v = x._v; delete x._v;
    x.owner = { id: adminId, name: 'Amina Otieno' };
    x.signerPlan = [
      { id: 'sg_me', party: 'internal', name: 'Amina Otieno', memberId: adminId, email: 'admin@example.co.ke', order: 1, signed: false },
      { id: 'sg_cp', party: 'counterparty', name: 'Ola Nordmann', email: 'ola@nandi.co.ke', order: 2, signed: false }];
    await W.admin.json('/api/contracts/MK-A2', { method: 'PUT', body: { contract: x, baseVersion: v } }); }
  await W.admin.json('/api/settings', { method: 'PUT', body: { approvalRules: [{ id: 'r1', order: 1, name: 'Finance check',
    cond: { type: 'value', op: '>=', value: 1 }, approver: { kind: 'member', id: W.users.unrestricted.id, name: 'Unrestricted Legal' } }] } });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const login = async (email, pass) => {
    const ctx = await browser.newContext({ viewport: { width: 1400, height: 1000 } });
    const page = await ctx.newPage();
    page.__errors = []; page.on('pageerror', e => page.__errors.push(e.message));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    await page.fill('#li-email', email); await page.fill('#li-pass', pass); await page.click('#li-go');
    await page.waitForFunction(() => window.state && Array.isArray(state.contracts) && state.contracts.length > 0 && window.currentUser && currentUser(), null, { timeout: 15000 });
    await page.waitForTimeout(800);
    return page;
  };
  try {
    /* 1 · THE APPROVER REFUSES */
    const appr = await login('everything@example.co.ke', 'their-own-pass-9');
    await appr.evaluate(async () => { const c = getContract('MK-A2'); await ensureFull(c); openWorkspace(c.id);
      await new Promise(r => setTimeout(r, 500)); roomGoTab(c, 'sign'); await new Promise(r => setTimeout(r, 400)); });
    await appr.click('#ap-reject');
    await appr.waitForSelector('#pd-input', { timeout: 5000 });
    await appr.fill('#pd-input', 'The payment terms need a second look.');
    await appr.click('#pd-ok');
    const s1 = await until(async () => { const x = await W.admin.json('/api/contracts/MK-A2');
      return ((x.approvalChain || []).find(s => s.ruleId === 'r1') || {}).status === 'rejected'; });
    check('1   the approver refused, with a reason, on the server', !!s1);

    /* 2 · THE OWNER SIGNS IN */
    const own = await login('admin@example.co.ke', 'adminpassword1');
    await own.click('#hdr-notify');
    await own.waitForTimeout(900);
    const bell = await own.evaluate(() => {
      const rows = (window.buildAlerts ? buildAlerts() : []).filter(a => a.id === 'MK-A2');
      return { rows: rows.map(a => a.kind + ':' + a.text + (a.sub ? ' / ' + a.sub : '')),
        panel: (document.querySelector('#ctx-panel, .ctx-panel, [data-panel-face="alerts"], #side-panel') || document.body).innerText };
    });
    check('2a  the bell has the refusal on its own row, with the reason',
      bell.rows.some(r => /^ap-refused:.*Finance check.*refused by Unrestricted Legal/.test(r) && /second look/.test(r)), bell.rows.join(' ‖ '));
    check('2b  …painted in the panel the bell opens', /refused by Unrestricted Legal/.test(bell.panel), '');
    check('2c  and it does NOT say "It is your turn to sign" while the refusal holds it',
      !bell.rows.some(r => /^signature:/.test(r)) && !bell.rows.some(r => /your turn to sign/i.test(r)), bell.rows.join(' ‖ '));
    const list = await own.evaluate(() => { const c = getContract('MK-A2');
      return { kinds: needsYouOf(c).map(x => x.kind), html: (insNeedsHtml(c) || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ') }; });
    check('2d  the contract\'s checklist leads with it, with its verb', list.kinds[0] === 'refused' && /Approval refused by Unrestricted Legal/.test(list.html) && /Revise/.test(list.html), JSON.stringify(list).slice(0, 220));

    /* 3 · THE OWNER'S MAIL */
    const mail = await until(async () => ((await W.admin.json('/api/outbox')).items || [])
      .find(m => m.to_addr === 'admin@example.co.ke' && /Approval refused/.test(m.subject || '')));
    check('3   the owner is mailed, with the reason (in the outbox: email is off here)', mail && /second look/.test(mail.body), mail ? mail.subject : 'none');

    /* 4 · B2: AN OPEN ASK HOLDS THE SIGNING LINK */
    const b2 = await own.evaluate(async () => {
      const c = getContract('MK-A2'); await ensureFull(c);
      c.changes = [{ id: 'CHG-9', clauseId: 'cl_pay', clauseLabel: '2. Payment', status: 'pending', authorSide: 'owner',
        createdAt: new Date(Date.now() - 3 * 864e5).toISOString() }];
      c.negotiation = Object.assign({}, c.negotiation || {}, { turn: 'counterparty', turnAt: new Date(Date.now() - 2 * 864e5).toISOString() });
      persist(c); await flushSaves();
      const no = signLinkRefusal(c);
      const out = await issueSigningRouteLinks(c);
      return { kind: no && no.kind, why: no && no.why, refused: out && out.refused };
    });
    check('4a  the browser refuses their signing link over the open ask, by clause', b2.kind === 'asks' && /2\. Payment/.test(b2.why || '') && /2\. Payment/.test(b2.refused || ''), JSON.stringify(b2));
    const wall = await W.admin.raw('/api/shares', { method: 'POST', body: {
      payload: { v: 1, kind: 'hati-share', org: 'Highland Corporate Ltd', sharedBy: 'Amina Otieno', at: new Date().toISOString(), docHash: 'h',
        purpose: 'sign', purposeChosen: 'sign', contract: { id: 'MK-A2', name: 'x', fields: {}, versions: [] } },
      channel: 'link', purpose: 'sign', signerId: 'sg_cp', recipient: { name: 'Ola Nordmann', email: 'ola@nandi.co.ke' } } });
    check('4b  and the server refuses the same mint, naming the clause', wall.status === 409 && /2\. Payment/.test((wall.json || {}).error || ''), String(wall.status) + ' ' + ((wall.json || {}).error || '').slice(0, 90));
    check('5   no page errors', !appr.__errors.length && !own.__errors.length, [...appr.__errors, ...own.__errors].join(' | ').slice(0, 200));
  } catch (e) {
    check('the run itself', false, e && e.stack);
  } finally {
    await browser.close(); await h.stop();
    const failed = results.filter(r => !r.pass).length;
    console.log(`\n${results.length - failed}/${results.length} passed`);
    process.exit(failed ? 1 : 0);
  }
})();
